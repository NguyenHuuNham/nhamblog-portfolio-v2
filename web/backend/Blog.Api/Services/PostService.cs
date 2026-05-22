using Blog.Api.Helpers;
using Blog.Api.Models.Common;
using Blog.Api.Models.DTOs.Post;
using Blog.Api.Models.Entities;
using Blog.Api.Repositories.Interfaces;
using Blog.Api.Services.Interfaces;

namespace Blog.Api.Services;

public class PostService(IPostRepository postRepository) : IPostService
{
    public async Task<PaginationResult<PostSummaryDto>> GetPublishedAsync(int page, int pageSize, string? categorySlug = null, string? search = null)
    {
        var result = await postRepository.GetPublishedAsync(page, pageSize, categorySlug, search);
        return new PaginationResult<PostSummaryDto>
        {
            Items = result.Items.Select(MapToSummary).ToList(),
            TotalCount = result.TotalCount,
            Page = result.Page,
            PageSize = result.PageSize
        };
    }

    public async Task<PostDto?> GetBySlugAsync(string slug)
    {
        var post = await postRepository.GetBySlugAsync(slug);
        if (post == null) return null;
        await postRepository.IncrementViewCountAsync(post.Id);
        return MapToDto(post);
    }

    public async Task<PaginationResult<PostDto>> GetAllForAdminAsync(int page, int pageSize, string? status = null)
    {
        var result = await postRepository.GetAllForAdminAsync(page, pageSize, status);
        return new PaginationResult<PostDto>
        {
            Items = result.Items.Select(MapToDto).ToList(),
            TotalCount = result.TotalCount,
            Page = result.Page,
            PageSize = result.PageSize
        };
    }

    public async Task<PostDto> CreateAsync(CreatePostRequest request, int authorId)
    {
        var slug = SlugHelper.GenerateUnique(request.Title,
            s => postRepository.SlugExistsAsync(s).Result);

        Enum.TryParse<PostStatus>(request.Status, true, out var status);

        var post = new Post
        {
            Title = request.Title,
            Slug = slug,
            Content = request.Content,
            Excerpt = request.Excerpt,
            ThumbnailUrl = request.ThumbnailUrl,
            Status = status,
            CategoryId = request.CategoryId,
            AuthorId = authorId,
            PublishedAt = status == PostStatus.Published ? DateTime.UtcNow : null
        };

        var created = await postRepository.CreateAsync(post);
        var full = await postRepository.GetByIdAsync(created.Id);
        return MapToDto(full!);
    }

    public async Task<PostDto> UpdateAsync(int id, UpdatePostRequest request)
    {
        var post = await postRepository.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Post {id} not found");

        var newSlug = SlugHelper.GenerateUnique(request.Title,
            s => postRepository.SlugExistsAsync(s, id).Result);

        Enum.TryParse<PostStatus>(request.Status, true, out var status);

        post.Title = request.Title;
        post.Slug = newSlug;
        post.Content = request.Content;
        post.Excerpt = request.Excerpt;
        post.ThumbnailUrl = request.ThumbnailUrl;
        post.CategoryId = request.CategoryId;
        post.UpdatedAt = DateTime.UtcNow;

        if (status == PostStatus.Published && post.Status != PostStatus.Published)
            post.PublishedAt = DateTime.UtcNow;

        post.Status = status;
        await postRepository.UpdateAsync(post);
        var full = await postRepository.GetByIdAsync(id);
        return MapToDto(full!);
    }

    public async Task DeleteAsync(int id)
    {
        var post = await postRepository.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Post {id} not found");
        await postRepository.DeleteAsync(post);
    }

    private static PostDto MapToDto(Post p) => new()
    {
        Id = p.Id, Title = p.Title, Slug = p.Slug, Content = p.Content,
        Excerpt = p.Excerpt, ThumbnailUrl = p.ThumbnailUrl,
        Status = p.Status.ToString(), ViewCount = p.ViewCount,
        CreatedAt = p.CreatedAt, PublishedAt = p.PublishedAt,
        AuthorName = p.Author?.Username ?? "",
        CategoryName = p.Category?.Name ?? "",
        CategorySlug = p.Category?.Slug ?? "",
        CommentCount = p.Comments?.Count ?? 0
    };

    private static PostSummaryDto MapToSummary(Post p) => new()
    {
        Id = p.Id, Title = p.Title, Slug = p.Slug, Excerpt = p.Excerpt,
        ThumbnailUrl = p.ThumbnailUrl, PublishedAt = p.PublishedAt,
        AuthorName = p.Author?.Username ?? "",
        CategoryName = p.Category?.Name ?? "",
        CategorySlug = p.Category?.Slug ?? "",
        ViewCount = p.ViewCount,
        CommentCount = p.Comments?.Count(c => c.IsApproved) ?? 0
    };
}
