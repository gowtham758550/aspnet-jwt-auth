using Api.Models.User;

namespace Api.Helpers
{
    public static class UserHelper
    {
        public static string GetFullName(string? firstName, string? secondName)
        {
            return $"{(string.IsNullOrWhiteSpace(firstName) ? "" : firstName)} {(string.IsNullOrWhiteSpace(secondName) ? "" : secondName)}";
        }
    }
}
