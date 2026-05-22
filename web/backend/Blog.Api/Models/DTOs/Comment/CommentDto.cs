using System.ComponentModel.DataAnnotations;

namespace Blog.Api.Models.DTOs.Comment;

public class CommentDto
{
    public int Id { get; set; }
    public string AuthorName { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public bool IsApproved { get; set; }
    public DateTime CreatedAt { get; set; }
    public int PostId { get; set; }
    public string PostTitle { get; set; } = string.Empty;
}

public class CreateCommentRequest
{
    [Required] public string AuthorName { get; set; } = string.Empty;
    [Required, EmailAddress] public string AuthorEmail { get; set; } = string.Empty;
    [Required, MinLength(10)] public string Content { get; set; } = string.Empty;
    [Required] public int PostId { get; set; }
}
