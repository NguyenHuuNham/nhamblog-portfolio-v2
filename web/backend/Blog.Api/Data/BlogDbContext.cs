using Blog.Api.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Blog.Api.Data;

public class BlogDbContext(DbContextOptions<BlogDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Post> Posts => Set<Post>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Comment> Comments => Set<Comment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User
        modelBuilder.Entity<User>(e =>
        {
            e.HasIndex(u => u.Email).IsUnique();
            e.HasIndex(u => u.Username).IsUnique();
            e.Property(u => u.Email).HasMaxLength(256);
            e.Property(u => u.Username).HasMaxLength(100);
            e.Property(u => u.Role).HasMaxLength(50);
        });

        // Category
        modelBuilder.Entity<Category>(e =>
        {
            e.HasIndex(c => c.Slug).IsUnique();
            e.Property(c => c.Name).HasMaxLength(100);
            e.Property(c => c.Slug).HasMaxLength(150);
        });

        // Post
        modelBuilder.Entity<Post>(e =>
        {
            e.HasIndex(p => p.Slug).IsUnique();
            e.Property(p => p.Title).HasMaxLength(500);
            e.Property(p => p.Slug).HasMaxLength(550);
            e.Property(p => p.Status).HasConversion<string>();

            e.HasOne(p => p.Author)
             .WithMany(u => u.Posts)
             .HasForeignKey(p => p.AuthorId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(p => p.Category)
             .WithMany(c => c.Posts)
             .HasForeignKey(p => p.CategoryId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // Comment
        modelBuilder.Entity<Comment>(e =>
        {
            e.Property(c => c.AuthorName).HasMaxLength(100);
            e.Property(c => c.AuthorEmail).HasMaxLength(256);

            e.HasOne(c => c.Post)
             .WithMany(p => p.Comments)
             .HasForeignKey(c => c.PostId)
             .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
