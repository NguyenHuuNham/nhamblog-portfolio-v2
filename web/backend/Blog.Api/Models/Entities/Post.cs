namespace Blog.Api.Models.Entities;

public enum PostStatus { Draft, Published, Archived }

public class Post
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? Excerpt { get; set; }
    public string? ThumbnailUrl { get; set; }
    public PostStatus Status { get; set; } = PostStatus.Draft;
    public int ViewCount { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? PublishedAt { get; set; }

    // FK
    public int AuthorId { get; set; }
    public int CategoryId { get; set; }

    // Navigation
    public User Author { get; set; } = null!;
    public Category Category { get; set; } = null!;
    public ICollection<Comment> Comments { get; set; } = [];
}
