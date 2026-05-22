using Blog.Api.Models.Common;
using Blog.Api.Models.Entities;

namespace Blog.Api.Repositories.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByIdAsync(int id);
    Task<PaginationResult<User>> GetAllAsync(int page, int pageSize);
    Task<User> CreateAsync(User user);
    Task<User> UpdateAsync(User user);
}
