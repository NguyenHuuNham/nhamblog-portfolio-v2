namespace Blog.Api.Models.Entities;

public class Comment
{
    public int Id { get; set; }
    public string AuthorName { get; set; } = string.Empty;
    public string AuthorEmail { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public bool IsApproved { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // FK
    public int PostId { get; set; }

    // Navigation
    public Post Post { get; set; } = null!;
}
