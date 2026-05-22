using Blog.Api.Models.Common;
using Blog.Api.Models.DTOs.Post;
using Blog.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Blog.Api.Controllers.Admin;

[ApiController]
[Route("api/admin/posts")]
[Authorize(Roles = "Admin,Editor")]
public class AdminPostsController(IPostService postService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<PaginationResult<PostDto>>>> GetAll(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] string? status = null)
    {
        var result = await postService.GetAllForAdminAsync(page, pageSize, status);
        return Ok(ApiResponse<PaginationResult<PostDto>>.Ok(result));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<PostDto>>> Create([FromBody] CreatePostRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponse<PostDto>.Fail("Validation failed"));

        var authorId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var post = await postService.CreateAsync(request, authorId);
        return CreatedAtAction(nameof(GetAll), ApiResponse<PostDto>.Ok(post, "Post created"));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ApiResponse<PostDto>>> Update(int id, [FromBody] UpdatePostRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponse<PostDto>.Fail("Validation failed"));

        var post = await postService.UpdateAsync(id, request);
        return Ok(ApiResponse<PostDto>.Ok(post, "Post updated"));
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id)
    {
        await postService.DeleteAsync(id);
        return Ok(ApiResponse<object>.Ok(null!, "Post deleted"));
    }
}
