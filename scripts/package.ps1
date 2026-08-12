$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$manifestPath = Join-Path $root "manifest.json"
$manifest = Get-Content -Raw -Encoding UTF8 $manifestPath | ConvertFrom-Json
$dist = Join-Path $root "dist"
$stage = Join-Path ([System.IO.Path]::GetTempPath()) ("cos-page-saver-" + [guid]::NewGuid().ToString("N"))
$zip = Join-Path $dist ("cos-page-saver-v" + $manifest.version + ".zip")

New-Item -ItemType Directory -Force -Path $dist, $stage | Out-Null

$files = @(
  "manifest.json", "background.js", "crypto.js", "markdown.js", "storage.js",
  "popup.html", "popup.js", "options.html", "options.js", "styles.css"
)
foreach ($file in $files) {
  Copy-Item -LiteralPath (Join-Path $root $file) -Destination (Join-Path $stage $file) -Force
}
Copy-Item -LiteralPath (Join-Path $root "icons") -Destination (Join-Path $stage "icons") -Recurse -Force

if (Test-Path -LiteralPath $zip) { Remove-Item -LiteralPath $zip -Force }
Compress-Archive -Path (Join-Path $stage "*") -DestinationPath $zip -CompressionLevel Optimal
Remove-Item -LiteralPath $stage -Recurse -Force

Write-Output "Generated: $zip"
