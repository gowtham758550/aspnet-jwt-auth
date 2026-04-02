using Api.Models.User;
using Api.Repositories;

namespace Api.Services
{
    public class AdminService(IUserRepository userRepository)
    {
        private readonly IUserRepository _userRepository = userRepository;

        public async Task<List<UserDto>> GetAllUsers()
        {
            var users = await _userRepository.GetAllUsers();

            if (users == null) return [];
            else return users;
        }
    }
}
