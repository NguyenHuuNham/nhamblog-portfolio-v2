using Blog.Api.Models.Common;
using Blog.Api.Models.Entities;

namespace Blog.Api.Repositories.Interfaces;

public interface IPostRepository
{
    Task<PaginationResult<Post>> GetPublishedAsync(int page, int pageSize, string? categorySlug = null, string? search = null);
    Task<Post?> GetBySlugAsync(string slug);
    Task<PaginationResult<Post>> GetAllForAdminAsync(int page, int pageSize, string? status = null);
    Task<Post?> GetByIdAsync(int id);
    Task<Post> CreateAsync(Post post);
    Task<Post> UpdateAsync(Post post);
    Task DeleteAsync(Post post);
    Task<bool> SlugExistsAsync(string slug, int? excludeId = null);
    Task IncrementViewCountAsync(int id);
}
