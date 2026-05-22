using Blog.Api.Helpers;
using Blog.Api.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Blog.Api.Data.Seed;

public static class DbSeeder
{
    public static async Task SeedAsync(BlogDbContext context)
    {
        if (await context.Users.AnyAsync()) return;

        // Seed admin user
        var admin = new User
        {
            Username = "admin",
            Email = "admin@blog.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
            Role = "Admin",
            IsActive = true
        };
        context.Users.Add(admin);
        await context.SaveChangesAsync();

        // Seed categories
        var categories = new List<Category>
        {
            new() { Name = "Technology", Slug = "technology", Description = "Tech articles and tutorials" },
            new() { Name = "Design", Slug = "design", Description = "UI/UX design topics" },
            new() { Name = "Personal", Slug = "personal", Description = "Personal thoughts and stories" }
        };
        context.Categories.AddRange(categories);
        await context.SaveChangesAsync();

        // Seed sample posts
        var samplePost = new Post
        {
            Title = "Welcome to My Blog",
            Slug = "welcome-to-my-blog",
            Content = "<p>Hello and welcome! This is the first post of my personal blog. Stay tuned for more content.</p>",
            Excerpt = "Hello and welcome to my personal blog!",
            Status = PostStatus.Published,
            PublishedAt = DateTime.UtcNow,
            AuthorId = admin.Id,
            CategoryId = categories[2].Id
        };
        context.Posts.Add(samplePost);
        await context.SaveChangesAsync();
    }
}
