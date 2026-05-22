using Blog.Api.Models.DTOs.Category;

namespace Blog.Api.Services.Interfaces;

public interface ICategoryService
{
    Task<List<CategoryDto>> GetAllAsync();
    Task<CategoryDto> CreateAsync(CreateCategoryRequest request);
    Task<CategoryDto> UpdateAsync(int id, CreateCategoryRequest request);
    Task DeleteAsync(int id);
}
