using Api.Data;
using Api.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace Api.Services
{
    public class TokenService(IConfiguration configuration, AppDbContext dbContext)
    {
        private readonly string _secret = configuration["Jwt:Secret"] ?? throw new InvalidOperationException("JWT secret is not configured.");
        private readonly int _accessExpiry = int.Parse(configuration["Jwt:DefaultAccessTokenExpirationMinutes"] ?? "15");
        private readonly int _refreshExpiry = int.Parse(configuration["Jwt:DefaultRefreshTokenExpirationDays"] ?? "7");

        public string GenerateAccessToken(User user)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secret));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var jti = Guid.NewGuid().ToString();

            var claims = new List<Claim>
            {
                new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new(JwtRegisteredClaimNames.Email, user.Email),
                new(JwtRegisteredClaimNames.Jti, jti),
                new("firstName", user.FirstName ?? string.Empty),
                new("lastName", user.LastName ?? string.Empty)
            };

            var token = new JwtSecurityToken(
                claims: claims, 
                expires: DateTime.UtcNow.AddMinutes(_accessExpiry), 
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public async Task<string> GenerateRefreshToken(Guid userId, string jti)
        {
            var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));

            dbContext.RefreshTokens.Add(new RefreshToken
            {
                Token = token,
                JwtId = jti,
                UserId = userId,
                ExpiresAt = DateTime.UtcNow.AddDays(_refreshExpiry)
            });

            await dbContext.SaveChangesAsync();
            return token;
        }

        public ClaimsPrincipal? GetPrincipalFromExpiredToken(string token)
        {
            var parameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secret)),
                ValidateIssuer = false,
                ValidateLifetime = false,
                ValidateAudience = false,
            };
            var handler = new JwtSecurityTokenHandler();
            handler.InboundClaimTypeMap.Clear();

            try

            {
                var principal = handler.ValidateToken(token, parameters, out var rawToken);

                if (rawToken is not JwtSecurityToken jwt || !jwt.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.OrdinalIgnoreCase))
                    return null;

                return principal;
            }
            catch
            {
                return null;
            }
        }

    }
}
