using Api.Common.Constants;
using Api.Data;
using Api.Data.Entities;
using Api.Helpers;
using Api.Models.User;
using Microsoft.EntityFrameworkCore;

namespace Api.Repositories
{
    public class UserRepository(AppDbContext db) : BaseRepository<User>(db), IUserRepository
    {
        public async Task<List<UserDto>> GetAllUsers()
        {
            return await _db.Users
                .Select(x => new UserDto
                {
                    Id = x.Id,
                    Email = x.Email,
                    FullName = UserHelper.GetFullName(x.FirstName, x.LastName),
                    Role = x.Roles.Select(r => r.Name).FirstOrDefault() ?? RoleConstants.DefautlRole,
                })
                .ToListAsync();
        }

        public async Task<UserDto?> GetUserByEmail(string email)
        {
            return await _db.Users
                .Where(x => x.Email == email)
                .Select(x => new UserDto
                {
                    Id = x.Id,
                    Email = x.Email,
                    FullName = UserHelper.GetFullName(x.FirstName, x.LastName),
                    Role = x.Roles.Select(r => r.Name).FirstOrDefault() ?? RoleConstants.DefautlRole,
                })
                .FirstOrDefaultAsync();
        }
        public async Task<UserLoginDto?> GetUserLogin(string email)
        {
            return await _db.Users
                .Where(x => x.Email == email)
                .Select(x => new UserLoginDto
                {
                    Id = x.Id,
                    Email = x.Email,
                    FullName = UserHelper.GetFullName(x.FirstName, x.LastName),
                    Role = x.Roles.Select(r => r.Name).FirstOrDefault() ?? RoleConstants.DefautlRole,
                    PasswordHash = x.PasswordHash,
                })
                .FirstOrDefaultAsync();
        }
    }
}
