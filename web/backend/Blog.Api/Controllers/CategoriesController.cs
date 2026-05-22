using Blog.Api.Models.Common;
using Blog.Api.Models.DTOs.Category;
using Blog.Api.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Blog.Api.Controllers;

[ApiController]
[Route("api/categories")]
public class CategoriesController(ICategoryService categoryService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<CategoryDto>>>> GetAll()
    {
        var categories = await categoryService.GetAllAsync();
        return Ok(ApiResponse<List<CategoryDto>>.Ok(categories));
    }
}
