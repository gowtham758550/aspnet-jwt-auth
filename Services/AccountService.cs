using Api.Data;
using Api.Data.Entities;
using Api.Models;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Api.Services
{
    public class AccountService(AppDbContext dbContext, TokenService tokenService)
    {
        public async Task<AuthResponse> RegisterUser(RegisterRequest request)
        {
            if (await dbContext.Users.AnyAsync(u => u.Email == request.Email))
                return new();

            var user = new User
            {
                Email = request.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                FirstName = request.FirstName,
                LastName = request.LastName
            };

            dbContext.Users.Add(user);
            await dbContext.SaveChangesAsync();

            return await IssueTokenPair(user);
        }

        public async Task<AuthResponse> Login(LoginRequest request)
        {
            var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Email == request.Email);

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

            var stored = await dbContext.RefreshTokens
                .Include(x => x.User)
                .FirstOrDefaultAsync(rt => rt.Token == request.RefreshToken);

            if (stored is null || stored.IsUsed || stored.IsRevoked || stored.ExpiresAt < DateTime.UtcNow || stored.JwtId != jti)
                return new();

            stored.IsUsed = true;
            await dbContext.SaveChangesAsync();

            return await IssueTokenPair(stored.User);
        }

        private async Task<AuthResponse> IssueTokenPair(User user)
        {
            var accessToken = tokenService.GenerateAccessToken(user);

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
            var data = await dbContext.RefreshTokens.FirstOrDefaultAsync(x => x.Token == refreshToken);

            if (data is null || data.IsRevoked)
                return false;

            data.IsRevoked = true;
            await dbContext.SaveChangesAsync();

            return true;
        }

        public async Task<bool> LogoutAll(string token)
        {
            var principal = tokenService.GetPrincipalFromExpiredToken(token);
            if (principal is null) return false;

            var userId = principal.FindFirstValue(JwtRegisteredClaimNames.Sub);

            if (!Guid.TryParse(userId, out var userGuid))
                return false;

            await dbContext.RefreshTokens
                .Where(x => x.UserId == userGuid && x.IsRevoked == false)
                .ExecuteUpdateAsync(x => x.SetProperty(y => y.IsRevoked, true));

            return true;
        }
    }
}
