$files = @(
    'c:\Users\26516\Desktop\n8n\blog-static\content\learn\cpa\03-audit\17-group-audit.md',
    'c:\Users\26516\Desktop\n8n\blog-static\content\learn\cpa\03-audit\18-special-items.md',
    'c:\Users\26516\Desktop\n8n\blog-static\content\learn\cpa\02-accounting\17-revenue.md'
)
foreach ($f in $files) {
    if (Test-Path $f) {
        $i = Get-Item $f
        $s = [math]::Round($i.Length/1024, 2)
        $c = (Get-Content $f).Count
        $name = Split-Path $f -Leaf
        Write-Host "$name : $s KB, $c lines"
    }
}
