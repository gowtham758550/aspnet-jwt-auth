namespace Api.Models
{
    public record RegisterRequest(
        string Email,
        string Password,
        string? FirstName = null,
        string? LastName = null
    );

    public record LoginRequest(
        string Email,
        string Password
    );

    public record RefreshRequest(
        string Token,
        string RefreshToken
    );

    public record LogoutRequest(string RefreshToken);

    public record LogoutAllRequest(string token);

    public class AuthResponse
    {
        public bool Success { get; set; } = false;
        public string Token { get; set; } = null!;
        public string RefreshToken { get; set; } = null!;
    }
}
