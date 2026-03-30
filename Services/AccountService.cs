using Api.Common.Constants;
using Api.Data;
using Api.Data.Entities;
using Api.Helpers;
using Api.Models;
using Api.Models.User;
using Api.Repositories;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Api.Services
{
    public class AccountService(AppDbContext db, TokenService tokenService, IUserRepository userRepository, IRoleRepository roleRepository)
    {

        private readonly IUserRepository _userRepository = userRepository;
        private readonly IRoleRepository roleRepository = roleRepository;

        public async Task<AuthResponse> RegisterUser(RegisterRequest request)
        {
            if (await _userRepository.AnyAsync(u => u.Email == request.Email))
                return new();

            var userRole = await roleRepository.FirstOrDefaultAsync(x => x.Name == RoleConstants.User);
            
            if (userRole == null)
                return new();

            var user = new User
            {
                Email = request.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                FirstName = request.FirstName,
                LastName = request.LastName,
                Roles =
                [
                    userRole
                ]
            };

            _userRepository.Add(user);

            await db.SaveChangesAsync();

            return await IssueTokenPair(new UserDto
            {
                Email = user.Email,
                FullName = UserHelper.GetFullName(user.FirstName, user.LastName),
                Role = userRole.Name,
                Id = user.Id
            });
        }

        public async Task<AuthResponse> Login(LoginRequest request)
        {
            var user = await _userRepository.GetUserLogin(request.Email);

            if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
                return new();

            return await IssueTokenPair(user);
        }

        public async Task<AuthResponse> RefreshToken(RefreshRequest request)
        {
            var principal = tokenService.GetPrincipalFromExpiredToken(request.Token);
            if (principal is null)
                return new();

            var jti = principal.FindFirstValue(JwtRegisteredClaimNames.Jti);

            var stored = await db.RefreshTokens
                .Include(x => x.User)
                .FirstOrDefaultAsync(rt => rt.Token == request.RefreshToken);

            if (stored is null || stored.IsUsed || stored.IsRevoked || stored.ExpiresAt < DateTime.UtcNow || stored.JwtId != jti)
                return new();

            stored.IsUsed = true;
            await db.SaveChangesAsync();

            return await IssueTokenPair(new UserDto
            {
                Id = stored.User.Id,
                Email = stored.User.Email,
                Role = stored.User.Roles.FirstOrDefault()?.Name ?? RoleConstants.DefautlRole,
                FullName = UserHelper.GetFullName(stored.User.FirstName, stored.User.LastName)
            });
        }

        private async Task<AuthResponse> IssueTokenPair(UserDto user)
        {
            var accessToken = await tokenService.GenerateAccessToken(user);

            var jti = new JwtSecurityTokenHandler().ReadJwtToken(accessToken).Id;

            var refreshToken = await tokenService.GenerateRefreshToken(user.Id, jti);

            return new AuthResponse
            {
                Token = accessToken,
                RefreshToken = refreshToken,
                Success = true
            };
        }

        public async Task<bool> RevokeRefreshToken(string refreshToken)
        {
            var data = await db.RefreshTokens.FirstOrDefaultAsync(x => x.Token == refreshToken);

            if (data is null || data.IsRevoked)
                return false;

            data.IsRevoked = true;
            await db.SaveChangesAsync();

            return true;
        }

        public async Task<bool> LogoutAll(string token)
        {
            var principal = tokenService.GetPrincipalFromExpiredToken(token);
            if (principal is null) return false;

            var userId = principal.FindFirstValue(JwtRegisteredClaimNames.Sub);

            if (!Guid.TryParse(userId, out var userGuid))
                return false;

            await db.RefreshTokens
                .Where(x => x.UserId == userGuid && x.IsRevoked == false)
                .ExecuteUpdateAsync(x => x.SetProperty(y => y.IsRevoked, true));

            return true;
        }
    }
}
