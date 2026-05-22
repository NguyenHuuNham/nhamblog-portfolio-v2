namespace Blog.Api.Models.DTOs.Post;

public class PostDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? Excerpt { get; set; }
    public string? ThumbnailUrl { get; set; }
    public string Status { get; set; } = string.Empty;
    public int ViewCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? PublishedAt { get; set; }
    public string AuthorName { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public string CategorySlug { get; set; } = string.Empty;
    public int CommentCount { get; set; }
}

public class PostSummaryDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Excerpt { get; set; }
    public string? ThumbnailUrl { get; set; }
    public DateTime? PublishedAt { get; set; }
    public string AuthorName { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public string CategorySlug { get; set; } = string.Empty;
    public int ViewCount { get; set; }
    public int CommentCount { get; set; }
}
