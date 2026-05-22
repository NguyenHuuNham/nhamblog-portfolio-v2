using System.ComponentModel.DataAnnotations;

namespace Blog.Api.Models.DTOs.Post;

public class CreatePostRequest
{
    [Required, MinLength(5)] public string Title { get; set; } = string.Empty;
    [Required] public string Content { get; set; } = string.Empty;
    public string? Excerpt { get; set; }
    public string? ThumbnailUrl { get; set; }
    public string Status { get; set; } = "Draft";
    [Required] public int CategoryId { get; set; }
}

public class UpdatePostRequest
{
    [Required, MinLength(5)] public string Title { get; set; } = string.Empty;
    [Required] public string Content { get; set; } = string.Empty;
    public string? Excerpt { get; set; }
    public string? ThumbnailUrl { get; set; }
    public string Status { get; set; } = "Draft";
    [Required] public int CategoryId { get; set; }
}
