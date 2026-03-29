using Api.Models;
using Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Api.Controllers
{

    [ApiController]
    [Route("api/account")]
    public class AccountController(AccountService accountService, TokenService tokenService) : ControllerBase
    {

        [HttpPost("signup")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            var result = await accountService.RegisterUser(request);
            if (!result.Success)
                return BadRequest("Registration failed.");
            return Ok(result);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var result = await accountService.Login(request);
            if (!result.Success)
                return Unauthorized("Invalid email or password.");
            return Ok(result);
        }

        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh([FromBody] RefreshRequest request)
        {
            var result = await accountService.RefreshToken(request);
            if (!result.Success)
                return BadRequest("Invalid token or refresh token.");
            return Ok(result);
        }

        [HttpPost("me")]
        [Authorize]
        public IActionResult Me()
        {
            var userId = User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            var email = User.FindFirstValue(JwtRegisteredClaimNames.Email);
            var firstName = User.FindFirstValue("firstName");
            var lastName = User.FindFirstValue("lastName");
            return Ok(new
            {
                Id = userId,
                Email = email,
                FirstName = firstName,
                LastName = lastName


            });
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout([FromBody] LogoutRequest request)
        {
            var success = await accountService.RevokeRefreshToken(request.RefreshToken);
            if (success) return Ok();
            else return BadRequest();
        }

        [HttpPost("logout-all")]
        public async Task<IActionResult> LogoutAll([FromBody] LogoutAllRequest request)
        {
            var success = await accountService.LogoutAll(request.token);
            if (success) return Ok();
            else return BadRequest();
        }
        
    }
}
