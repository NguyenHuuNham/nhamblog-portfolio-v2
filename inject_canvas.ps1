# Add bg-canvas.js script to all public HTML pages
$files = @('index.html','about.html','blog.html','projects.html')
foreach ($f in $files) {
    if (Test-Path $f) {
        $c = Get-Content $f -Raw -Encoding UTF8
        if ($c -notmatch 'bg-canvas\.js') {
            # Add before </body>
            $c = $c.Replace('</body>', "  <script src=""./js/bg-canvas.js""></script>`n</body>")
            Set-Content $f $c -Encoding UTF8 -NoNewline
            Write-Host "Added to: $f"
        } else {
            Write-Host "Already has bg-canvas: $f"
        }
    }
}
Write-Host "Done!"
