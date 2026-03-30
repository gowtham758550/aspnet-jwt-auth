using Api.Models;
using Api.Models.User;
using Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers
{
    [Route("api/admin")]
    [ApiController]
    public class AdminController(AdminService adminService) : ControllerBase
    {
        [HttpGet("users")]
        public async Task<ActionResult<BaseResponse<List<UserDto>>>> GetAllUsers()
        {
            var response = new BaseResponse<List<UserDto>>
            {
                Success = true,
                Data = await adminService.GetAllUsers()
            };
            return Ok(response);
        }
    }
}
