$logoSnippet = @'
<a href="./index.html" class="nav-logo" title="NH"><svg width="32" height="32" viewBox="0 0 32 32" fill="none"><defs><linearGradient id="lgNav" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#00d4ff"/><stop offset="100%" stop-color="#7a00ff"/></linearGradient></defs><rect width="32" height="32" rx="9" fill="url(#lgNav)"/><text x="5" y="22" font-family="Outfit,sans-serif" font-weight="800" font-size="14" fill="white">NH</text></svg></a><div class="nav-divider"></div>
'@

$files = @('about.html','blog.html','projects.html','post.html')
foreach ($f in $files) {
    if (Test-Path $f) {
        $c = Get-Content $f -Raw -Encoding UTF8
        if ($c -notmatch 'nav-logo') {
            $c = $c.Replace('<nav class="floating-nav">', '<nav class="floating-nav">' + $logoSnippet.Trim())
            Set-Content $f $c -Encoding UTF8 -NoNewline
            Write-Host "Updated: $f"
        } else {
            Write-Host "Already has logo: $f"
        }
    }
}
Write-Host "Done!"
