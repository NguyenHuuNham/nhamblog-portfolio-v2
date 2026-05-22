namespace Blog.Api.Helpers;

public static class SlugHelper
{
    private static readonly Slugify.SlugHelper _slugHelper = new();

    public static string Generate(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return string.Empty;
        return _slugHelper.GenerateSlug(text);
    }

    public static string GenerateUnique(string text, Func<string, bool> exists)
    {
        var slug = Generate(text);
        var original = slug;
        var counter = 1;
        while (exists(slug))
        {
            slug = $"{original}-{counter}";
            counter++;
        }
        return slug;
    }
}
