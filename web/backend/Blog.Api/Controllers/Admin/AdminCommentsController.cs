using Blog.Api.Models.Common;
using Blog.Api.Models.DTOs.Comment;
using Blog.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Blog.Api.Controllers.Admin;

[ApiController]
[Route("api/admin/comments")]
[Authorize(Roles = "Admin")]
public class AdminCommentsController(ICommentService commentService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<PaginationResult<CommentDto>>>> GetAll(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await commentService.GetAllForAdminAsync(page, pageSize);
        return Ok(ApiResponse<PaginationResult<CommentDto>>.Ok(result));
    }

    [HttpPatch("{id:int}/approve")]
    public async Task<ActionResult<ApiResponse<CommentDto>>> Approve(int id)
    {
        var comment = await commentService.ApproveAsync(id);
        return Ok(ApiResponse<CommentDto>.Ok(comment, "Comment approved"));
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id)
    {
        await commentService.DeleteAsync(id);
        return Ok(ApiResponse<object>.Ok(null!, "Comment deleted"));
    }
}
