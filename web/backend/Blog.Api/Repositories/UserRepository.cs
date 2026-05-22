using Blog.Api.Data;
using Blog.Api.Models.Common;
using Blog.Api.Models.Entities;
using Blog.Api.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Blog.Api.Repositories;

public class UserRepository(BlogDbContext db) : IUserRepository
{
    public async Task<User?> GetByEmailAsync(string email)
        => await db.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());

    public async Task<User?> GetByIdAsync(int id)
        => await db.Users.FindAsync(id);

    public async Task<PaginationResult<User>> GetAllAsync(int page, int pageSize)
    {
        var total = await db.Users.CountAsync();
        var items = await db.Users
            .OrderByDescending(u => u.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
        return new PaginationResult<User> { Items = items, TotalCount = total, Page = page, PageSize = pageSize };
    }

    public async Task<User> CreateAsync(User user)
    {
        db.Users.Add(user);
        await db.SaveChangesAsync();
        return user;
    }

    public async Task<User> UpdateAsync(User user)
    {
        db.Users.Update(user);
        await db.SaveChangesAsync();
        return user;
    }
}
