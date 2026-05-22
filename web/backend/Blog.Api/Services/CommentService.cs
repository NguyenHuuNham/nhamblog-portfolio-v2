using Blog.Api.Models.Common;
using Blog.Api.Models.DTOs.Comment;
using Blog.Api.Models.Entities;
using Blog.Api.Repositories.Interfaces;
using Blog.Api.Services.Interfaces;

namespace Blog.Api.Services;

public class CommentService(ICommentRepository commentRepository, IPostRepository postRepository) : ICommentService
{
    public async Task<List<CommentDto>> GetApprovedByPostIdAsync(int postId)
    {
        var comments = await commentRepository.GetApprovedByPostIdAsync(postId);
        return comments.Select(MapToDto).ToList();
    }

    public async Task<PaginationResult<CommentDto>> GetAllForAdminAsync(int page, int pageSize)
    {
        var result = await commentRepository.GetAllForAdminAsync(page, pageSize);
        return new PaginationResult<CommentDto>
        {
            Items = result.Items.Select(MapToDto).ToList(),
            TotalCount = result.TotalCount,
            Page = result.Page,
            PageSize = result.PageSize
        };
    }

    public async Task<CommentDto> CreateAsync(CreateCommentRequest request)
    {
        _ = await postRepository.GetByIdAsync(request.PostId)
            ?? throw new KeyNotFoundException($"Post {request.PostId} not found");

        var comment = new Comment
        {
            AuthorName = request.AuthorName,
            AuthorEmail = request.AuthorEmail,
            Content = request.Content,
            PostId = request.PostId,
            IsApproved = false
        };
        var created = await commentRepository.CreateAsync(comment);
        return MapToDto(created);
    }

    public async Task<CommentDto> ApproveAsync(int id)
    {
        var comment = await commentRepository.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Comment {id} not found");
        comment.IsApproved = true;
        var updated = await commentRepository.UpdateAsync(comment);
        return MapToDto(updated);
    }

    public async Task DeleteAsync(int id)
    {
        var comment = await commentRepository.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Comment {id} not found");
        await commentRepository.DeleteAsync(comment);
    }

    private static CommentDto MapToDto(Comment c) => new()
    {
        Id = c.Id, AuthorName = c.AuthorName, Content = c.Content,
        IsApproved = c.IsApproved, CreatedAt = c.CreatedAt,
        PostId = c.PostId, PostTitle = c.Post?.Title ?? ""
    };
}
