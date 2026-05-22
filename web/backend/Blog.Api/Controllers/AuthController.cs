using Blog.Api.Models.Common;
using Blog.Api.Models.DTOs.Auth;
using Blog.Api.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Blog.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(IAuthService authService) : ControllerBase
{
    [HttpPost("login")]
    public async Task<ActionResult<ApiResponse<AuthResponse>>> Login([FromBody] LoginRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponse<AuthResponse>.Fail("Validation failed",
                ModelState.ToDictionary(k => k.Key, v => v.Value!.Errors.Select(e => e.ErrorMessage).ToArray())));

        var result = await authService.LoginAsync(request);
        return Ok(ApiResponse<AuthResponse>.Ok(result, "Login successful"));
    }
}
