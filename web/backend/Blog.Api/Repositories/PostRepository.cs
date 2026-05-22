using Blog.Api.Data;
using Blog.Api.Models.Common;
using Blog.Api.Models.Entities;
using Blog.Api.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Blog.Api.Repositories;

public class PostRepository(BlogDbContext db) : IPostRepository
{
    public async Task<PaginationResult<Post>> GetPublishedAsync(int page, int pageSize, string? categorySlug = null, string? search = null)
    {
        var query = db.Posts
            .Include(p => p.Author)
            .Include(p => p.Category)
            .Include(p => p.Comments)
            .Where(p => p.Status == PostStatus.Published)
            .AsQueryable();

        if (!string.IsNullOrEmpty(categorySlug))
            query = query.Where(p => p.Category.Slug == categorySlug);

        if (!string.IsNullOrEmpty(search))
            query = query.Where(p => p.Title.Contains(search) || p.Excerpt!.Contains(search));

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(p => p.PublishedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PaginationResult<Post> { Items = items, TotalCount = total, Page = page, PageSize = pageSize };
    }

    public async Task<Post?> GetBySlugAsync(string slug)
        => await db.Posts
            .Include(p => p.Author)
            .Include(p => p.Category)
            .Include(p => p.Comments.Where(c => c.IsApproved))
            .FirstOrDefaultAsync(p => p.Slug == slug && p.Status == PostStatus.Published);

    public async Task<PaginationResult<Post>> GetAllForAdminAsync(int page, int pageSize, string? status = null)
    {
        var query = db.Posts
            .Include(p => p.Author)
            .Include(p => p.Category)
            .Include(p => p.Comments)
            .AsQueryable();

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<PostStatus>(status, true, out var statusEnum))
            query = query.Where(p => p.Status == statusEnum);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PaginationResult<Post> { Items = items, TotalCount = total, Page = page, PageSize = pageSize };
    }

    public async Task<Post?> GetByIdAsync(int id)
        => await db.Posts
            .Include(p => p.Author)
            .Include(p => p.Category)
            .FirstOrDefaultAsync(p => p.Id == id);

    public async Task<Post> CreateAsync(Post post)
    {
        db.Posts.Add(post);
        await db.SaveChangesAsync();
        return post;
    }

    public async Task<Post> UpdateAsync(Post post)
    {
        db.Posts.Update(post);
        await db.SaveChangesAsync();
        return post;
    }

    public async Task DeleteAsync(Post post)
    {
        db.Posts.Remove(post);
        await db.SaveChangesAsync();
    }

    public async Task<bool> SlugExistsAsync(string slug, int? excludeId = null)
        => await db.Posts.AnyAsync(p => p.Slug == slug && (excludeId == null || p.Id != excludeId));

    public async Task IncrementViewCountAsync(int id)
    {
        await db.Posts.Where(p => p.Id == id)
            .ExecuteUpdateAsync(s => s.SetProperty(p => p.ViewCount, p => p.ViewCount + 1));
    }
}
