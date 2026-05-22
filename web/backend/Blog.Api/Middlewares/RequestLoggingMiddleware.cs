namespace Blog.Api.Middlewares;

public class RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        var start = DateTime.UtcNow;
        await next(context);
        var elapsed = (DateTime.UtcNow - start).TotalMilliseconds;

        logger.LogInformation("{Method} {Path} -> {StatusCode} ({Elapsed}ms)",
            context.Request.Method,
            context.Request.Path,
            context.Response.StatusCode,
            elapsed);
    }
}
