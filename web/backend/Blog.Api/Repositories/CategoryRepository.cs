using Blog.Api.Data;
using Blog.Api.Models.Entities;
using Blog.Api.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Blog.Api.Repositories;

public class CategoryRepository(BlogDbContext db) : ICategoryRepository
{
    public async Task<List<Category>> GetAllWithPostCountAsync()
        => await db.Categories
            .Include(c => c.Posts.Where(p => p.Status == PostStatus.Published))
            .OrderBy(c => c.Name)
            .ToListAsync();

    public async Task<Category?> GetBySlugAsync(string slug)
        => await db.Categories.FirstOrDefaultAsync(c => c.Slug == slug);

    public async Task<Category?> GetByIdAsync(int id)
        => await db.Categories.FindAsync(id);

    public async Task<Category> CreateAsync(Category category)
    {
        db.Categories.Add(category);
        await db.SaveChangesAsync();
        return category;
    }

    public async Task<Category> UpdateAsync(Category category)
    {
        db.Categories.Update(category);
        await db.SaveChangesAsync();
        return category;
    }

    public async Task DeleteAsync(Category category)
    {
        db.Categories.Remove(category);
        await db.SaveChangesAsync();
    }

    public async Task<bool> SlugExistsAsync(string slug, int? excludeId = null)
        => await db.Categories.AnyAsync(c => c.Slug == slug && (excludeId == null || c.Id != excludeId));
}
