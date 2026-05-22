using Blog.Api.Models.Common;
using Blog.Api.Models.DTOs.Post;

namespace Blog.Api.Services.Interfaces;

public interface IPostService
{
    Task<PaginationResult<PostSummaryDto>> GetPublishedAsync(int page, int pageSize, string? categorySlug = null, string? search = null);
    Task<PostDto?> GetBySlugAsync(string slug);
    Task<PaginationResult<PostDto>> GetAllForAdminAsync(int page, int pageSize, string? status = null);
    Task<PostDto> CreateAsync(CreatePostRequest request, int authorId);
    Task<PostDto> UpdateAsync(int id, UpdatePostRequest request);
    Task DeleteAsync(int id);
}
