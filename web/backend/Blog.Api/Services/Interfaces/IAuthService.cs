using Blog.Api.Models.DTOs.Auth;

namespace Blog.Api.Services.Interfaces;

public interface IAuthService
{
    Task<AuthResponse> LoginAsync(LoginRequest request);
}
