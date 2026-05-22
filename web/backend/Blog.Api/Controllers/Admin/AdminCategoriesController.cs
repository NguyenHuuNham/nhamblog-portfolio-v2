using Blog.Api.Models.Common;
using Blog.Api.Models.DTOs.Category;
using Blog.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Blog.Api.Controllers.Admin;

[ApiController]
[Route("api/admin/categories")]
[Authorize(Roles = "Admin")]
public class AdminCategoriesController(ICategoryService categoryService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<CategoryDto>>>> GetAll()
    {
        var result = await categoryService.GetAllAsync();
        return Ok(ApiResponse<List<CategoryDto>>.Ok(result));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<CategoryDto>>> Create([FromBody] CreateCategoryRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponse<CategoryDto>.Fail("Validation failed"));
        var category = await categoryService.CreateAsync(request);
        return Ok(ApiResponse<CategoryDto>.Ok(category, "Category created"));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ApiResponse<CategoryDto>>> Update(int id, [FromBody] CreateCategoryRequest request)
    {
        var category = await categoryService.UpdateAsync(id, request);
        return Ok(ApiResponse<CategoryDto>.Ok(category, "Category updated"));
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(int id)
    {
        await categoryService.DeleteAsync(id);
        return Ok(ApiResponse<object>.Ok(null!, "Category deleted"));
    }
}
