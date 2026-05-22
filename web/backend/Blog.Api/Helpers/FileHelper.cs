namespace Blog.Api.Helpers;

public static class FileHelper
{
    public static async Task<string> SaveFileAsync(IFormFile file, string uploadPath)
    {
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        var fileName = $"{Guid.NewGuid()}{extension}";
        var fullPath = Path.Combine(uploadPath, fileName);

        Directory.CreateDirectory(uploadPath);

        using var stream = new FileStream(fullPath, FileMode.Create);
        await file.CopyToAsync(stream);

        return $"/uploads/{fileName}";
    }

    public static void DeleteFile(string relativePath, string webRootPath)
    {
        if (string.IsNullOrEmpty(relativePath)) return;
        var fullPath = Path.Combine(webRootPath, relativePath.TrimStart('/'));
        if (File.Exists(fullPath))
            File.Delete(fullPath);
    }
}
