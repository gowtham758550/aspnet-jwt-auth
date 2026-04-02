namespace Api.Models.User
{
    public class UserDto
    {
        public Guid Id { get; set; }
        public required string Email { get; set; }
        public string? FullName { get; set; }
        public required string Role { get; set; }
    }
}
