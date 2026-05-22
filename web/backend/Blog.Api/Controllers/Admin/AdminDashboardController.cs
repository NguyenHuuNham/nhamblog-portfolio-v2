using Blog.Api.Data;
using Blog.Api.Models.Common;
using Blog.Api.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Blog.Api.Controllers.Admin;

[ApiController]
[Route("api/admin/dashboard")]
[Authorize(Roles = "Admin")]
public class AdminDashboardController(BlogDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<DashboardStats>>> GetStats()
    {
        var stats = new DashboardStats
        {
            TotalPosts = await db.Posts.CountAsync(),
            PublishedPosts = await db.Posts.CountAsync(p => p.Status == PostStatus.Published),
            DraftPosts = await db.Posts.CountAsync(p => p.Status == PostStatus.Draft),
            TotalCategories = await db.Categories.CountAsync(),
            TotalComments = await db.Comments.CountAsync(),
            PendingComments = await db.Comments.CountAsync(c => !c.IsApproved),
            TotalViews = await db.Posts.SumAsync(p => (long)p.ViewCount),
            RecentPosts = await db.Posts
                .Include(p => p.Category)
                .OrderByDescending(p => p.CreatedAt)
                .Take(5)
                .Select(p => new RecentPostItem { Id = p.Id, Title = p.Title, Status = p.Status.ToString(), CreatedAt = p.CreatedAt })
                .ToListAsync()
        };
        return Ok(ApiResponse<DashboardStats>.Ok(stats));
    }
}

public class DashboardStats
{
    public int TotalPosts { get; set; }
    public int PublishedPosts { get; set; }
    public int DraftPosts { get; set; }
    public int TotalCategories { get; set; }
    public int TotalComments { get; set; }
    public int PendingComments { get; set; }
    public long TotalViews { get; set; }
    public List<RecentPostItem> RecentPosts { get; set; } = [];
}

public class RecentPostItem
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
