using Blog.Api.Models.Common;
using Blog.Api.Models.DTOs.Comment;

namespace Blog.Api.Services.Interfaces;

public interface ICommentService
{
    Task<List<CommentDto>> GetApprovedByPostIdAsync(int postId);
    Task<PaginationResult<CommentDto>> GetAllForAdminAsync(int page, int pageSize);
    Task<CommentDto> CreateAsync(CreateCommentRequest request);
    Task<CommentDto> ApproveAsync(int id);
    Task DeleteAsync(int id);
}
