using Blog.Api.Models.Common;
using Blog.Api.Models.Entities;

namespace Blog.Api.Repositories.Interfaces;

public interface ICommentRepository
{
    Task<List<Comment>> GetApprovedByPostIdAsync(int postId);
    Task<PaginationResult<Comment>> GetAllForAdminAsync(int page, int pageSize);
    Task<Comment?> GetByIdAsync(int id);
    Task<Comment> CreateAsync(Comment comment);
    Task<Comment> UpdateAsync(Comment comment);
    Task DeleteAsync(Comment comment);
}
