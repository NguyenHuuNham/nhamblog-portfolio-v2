using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Blog.Api.Configurations;
using Blog.Api.Models.DTOs.Auth;
using Blog.Api.Repositories.Interfaces;
using Blog.Api.Services.Interfaces;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Blog.Api.Services;

public class AuthService(IUserRepository userRepository, IOptions<JwtSettings> jwtOptions) : IAuthService
{
    private readonly JwtSettings _jwt = jwtOptions.Value;

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var user = await userRepository.GetByEmailAsync(request.Email)
            ?? throw new UnauthorizedAccessException("Invalid email or password");

        if (!user.IsActive)
            throw new UnauthorizedAccessException("Account is disabled");

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid email or password");

        var expiry = DateTime.UtcNow.AddDays(_jwt.ExpirationInDays);
        var token = GenerateJwtToken(user.Id, user.Email, user.Role, expiry);

        return new AuthResponse
        {
            Token = token,
            Email = user.Email,
            Username = user.Username,
            Role = user.Role,
            ExpiresAt = expiry
        };
    }

    private string GenerateJwtToken(int userId, string email, string role, DateTime expiry)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwt.Secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Email, email),
            new Claim(ClaimTypes.Role, role)
        };

        var token = new JwtSecurityToken(
            issuer: _jwt.Issuer,
            audience: _jwt.Audience,
            claims: claims,
            expires: expiry,
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
