using Blog.Api.Data;
using Blog.Api.Models.Common;
using Blog.Api.Models.Entities;
using Blog.Api.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Blog.Api.Repositories;

public class CommentRepository(BlogDbContext db) : ICommentRepository
{
    public async Task<List<Comment>> GetApprovedByPostIdAsync(int postId)
        => await db.Comments
            .Where(c => c.PostId == postId && c.IsApproved)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

    public async Task<PaginationResult<Comment>> GetAllForAdminAsync(int page, int pageSize)
    {
        var query = db.Comments.Include(c => c.Post).AsQueryable();
        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
        return new PaginationResult<Comment> { Items = items, TotalCount = total, Page = page, PageSize = pageSize };
    }

    public async Task<Comment?> GetByIdAsync(int id)
        => await db.Comments.Include(c => c.Post).FirstOrDefaultAsync(c => c.Id == id);

    public async Task<Comment> CreateAsync(Comment comment)
    {
        db.Comments.Add(comment);
        await db.SaveChangesAsync();
        return comment;
    }

    public async Task<Comment> UpdateAsync(Comment comment)
    {
        db.Comments.Update(comment);
        await db.SaveChangesAsync();
        return comment;
    }

    public async Task DeleteAsync(Comment comment)
    {
        db.Comments.Remove(comment);
        await db.SaveChangesAsync();
    }
}
