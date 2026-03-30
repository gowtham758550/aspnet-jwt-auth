using Api.Data.Entities;
using Api.Models.User;

namespace Api.Repositories
{
    public interface IUserRepository : IBaseRepository<User>
    {
        Task<List<UserDto>> GetAllUsers();
        Task<UserDto?> GetUserByEmail(string email);
        Task<UserLoginDto?> GetUserLogin(string email);
    }
}
