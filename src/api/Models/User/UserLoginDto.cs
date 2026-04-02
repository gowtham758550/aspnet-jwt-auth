namespace Api.Models.User
{
    public class UserLoginDto : UserDto
    {
        public string PasswordHash { get; set; } = string.Empty;
    }
}
