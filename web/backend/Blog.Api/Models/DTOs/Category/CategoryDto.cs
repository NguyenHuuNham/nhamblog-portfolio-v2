using System.ComponentModel.DataAnnotations;

namespace Blog.Api.Models.DTOs.Category;

public class CategoryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int PostCount { get; set; }
}

public class CreateCategoryRequest
{
    [Required, MinLength(2)] public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
}
