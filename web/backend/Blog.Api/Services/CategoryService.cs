using Blog.Api.Helpers;
using Blog.Api.Models.DTOs.Category;
using Blog.Api.Models.Entities;
using Blog.Api.Repositories.Interfaces;
using Blog.Api.Services.Interfaces;

namespace Blog.Api.Services;

public class CategoryService(ICategoryRepository categoryRepository) : ICategoryService
{
    public async Task<List<CategoryDto>> GetAllAsync()
    {
        var cats = await categoryRepository.GetAllWithPostCountAsync();
        return cats.Select(c => new CategoryDto
        {
            Id = c.Id, Name = c.Name, Slug = c.Slug,
            Description = c.Description,
            PostCount = c.Posts.Count
        }).ToList();
    }

    public async Task<CategoryDto> CreateAsync(CreateCategoryRequest request)
    {
        var slug = SlugHelper.GenerateUnique(request.Name,
            s => categoryRepository.SlugExistsAsync(s).Result);

        var category = new Category
        {
            Name = request.Name,
            Slug = slug,
            Description = request.Description
        };
        var created = await categoryRepository.CreateAsync(category);
        return new CategoryDto { Id = created.Id, Name = created.Name, Slug = created.Slug, Description = created.Description };
    }

    public async Task<CategoryDto> UpdateAsync(int id, CreateCategoryRequest request)
    {
        var category = await categoryRepository.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Category {id} not found");

        var slug = SlugHelper.GenerateUnique(request.Name,
            s => categoryRepository.SlugExistsAsync(s, id).Result);

        category.Name = request.Name;
        category.Slug = slug;
        category.Description = request.Description;

        var updated = await categoryRepository.UpdateAsync(category);
        return new CategoryDto { Id = updated.Id, Name = updated.Name, Slug = updated.Slug, Description = updated.Description };
    }

    public async Task DeleteAsync(int id)
    {
        var category = await categoryRepository.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Category {id} not found");
        await categoryRepository.DeleteAsync(category);
    }
}
