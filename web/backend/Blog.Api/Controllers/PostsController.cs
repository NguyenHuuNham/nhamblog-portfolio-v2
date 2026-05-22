using Blog.Api.Models.Common;
using Blog.Api.Models.DTOs.Comment;
using Blog.Api.Models.DTOs.Post;
using Blog.Api.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Blog.Api.Controllers;

[ApiController]
[Route("api/posts")]
public class PostsController(IPostService postService, ICommentService commentService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<PaginationResult<PostSummaryDto>>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? category = null,
        [FromQuery] string? search = null)
    {
        var result = await postService.GetPublishedAsync(page, pageSize, category, search);
        return Ok(ApiResponse<PaginationResult<PostSummaryDto>>.Ok(result));
    }

    [HttpGet("{slug}")]
    public async Task<ActionResult<ApiResponse<PostDto>>> GetBySlug(string slug)
    {
        var post = await postService.GetBySlugAsync(slug);
        if (post == null) return NotFound(ApiResponse<PostDto>.Fail("Post not found"));
        return Ok(ApiResponse<PostDto>.Ok(post));
    }

    [HttpGet("{postId:int}/comments")]
    public async Task<ActionResult<ApiResponse<List<CommentDto>>>> GetComments(int postId)
    {
        var comments = await commentService.GetApprovedByPostIdAsync(postId);
        return Ok(ApiResponse<List<CommentDto>>.Ok(comments));
    }

    [HttpPost("{postId:int}/comments")]
    public async Task<ActionResult<ApiResponse<CommentDto>>> AddComment(int postId, [FromBody] CreateCommentRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponse<CommentDto>.Fail("Validation failed"));

        request.PostId = postId;
        var comment = await commentService.CreateAsync(request);
        return Ok(ApiResponse<CommentDto>.Ok(comment, "Comment submitted for review"));
    }
}
