namespace Blog.Api.Configurations;

public class UploadSettings
{
    public string UploadPath { get; set; } = "uploads";
    public long MaxFileSizeBytes { get; set; } = 5_000_000; // 5MB
    public string[] AllowedExtensions { get; set; } = [".jpg", ".jpeg", ".png", ".webp"];
}
