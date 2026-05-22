using Blog.Api.Models.Entities;

namespace Blog.Api.Repositories.Interfaces;

public interface ICategoryRepository
{
    Task<List<Category>> GetAllWithPostCountAsync();
    Task<Category?> GetBySlugAsync(string slug);
    Task<Category?> GetByIdAsync(int id);
    Task<Category> CreateAsync(Category category);
    Task<Category> UpdateAsync(Category category);
    Task DeleteAsync(Category category);
    Task<bool> SlugExistsAsync(string slug, int? excludeId = null);
}
