# Logo mới - Mobile Phone icon (phù hợp Mobile App Developer)
$phoneSVG = '<svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="lgNav" x1="0" y1="0" x2="34" y2="34" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#00d4ff"/><stop offset="100%" stop-color="#7a00ff"/></linearGradient></defs><rect width="34" height="34" rx="10" fill="url(#lgNav)"/><rect x="10" y="5" width="14" height="24" rx="3" stroke="white" stroke-width="2" fill="none"/><line x1="14" y1="9" x2="20" y2="9" stroke="white" stroke-width="1.5" stroke-linecap="round"/><circle cx="17" cy="25.5" r="1.5" fill="white"/></svg>'

$files = @('index.html','about.html','blog.html','projects.html','post.html')
foreach ($f in $files) {
    if (Test-Path $f) {
        $c = Get-Content $f -Raw -Encoding UTF8
        $c = $c -replace '(<a href="\.\/index\.html" class="nav-logo"[^>]*>)[\s\S]*?(<\/svg>\s*<\/a>)', "`$1$phoneSVG</a>"
        Set-Content $f $c -Encoding UTF8 -NoNewline
        Write-Host "Updated: $f"
    }
}
Write-Host "Done!"
