$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$manifestPath = Join-Path $root "manifest.json"
$manifest = Get-Content -Raw -Encoding UTF8 $manifestPath | ConvertFrom-Json
$dist = Join-Path $root "dist"
$legacySecrets = Join-Path $root ".secrets"
$secrets = Join-Path $env:LOCALAPPDATA "CosPageSaver"
$stage = Join-Path ([System.IO.Path]::GetTempPath()) ("cos-page-saver-" + [guid]::NewGuid().ToString("N"))
$zip = Join-Path $dist ("cos-page-saver-v" + $manifest.version + ".zip")
$crx = Join-Path $dist ("cos-page-saver-v" + $manifest.version + ".crx")
$key = Join-Path $secrets "cos-page-saver.pem"
$legacyKey = Join-Path $legacySecrets "cos-page-saver.pem"

New-Item -ItemType Directory -Force -Path $dist, $stage, $secrets | Out-Null
New-Item -ItemType Directory -Force -Path $secrets | Out-Null

if (-not (Test-Path -LiteralPath $key) -and (Test-Path -LiteralPath $legacyKey)) {
  Move-Item -LiteralPath $legacyKey -Destination $key -Force
}

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

$chrome = @(
  "C:\Program Files\Google\Chrome\Application\chrome.exe",
  "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
  (Join-Path $env:LOCALAPPDATA "Google\Chrome\Application\chrome.exe")
) | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (-not $chrome) { throw "Chrome executable not found; CRX cannot be generated." }

$crxWork = Join-Path ([System.IO.Path]::GetTempPath()) ("cos-page-saver-crx-" + [guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Force -Path $crxWork | Out-Null
$crxStage = Join-Path $crxWork "extension"
Copy-Item -LiteralPath $stage -Destination $crxStage -Recurse -Force
if (Test-Path -LiteralPath $key) {
  & $chrome "--pack-extension=$crxStage" "--pack-extension-key=$key" | Out-Null
} else {
  & $chrome "--pack-extension=$crxStage" | Out-Null
  $generatedKey = Join-Path $crxWork "extension.pem"
  if (-not (Test-Path -LiteralPath $generatedKey)) { throw "Chrome did not generate the CRX private key." }
  Copy-Item -LiteralPath $generatedKey -Destination $key -Force
}
$generatedCrx = Join-Path $crxWork "extension.crx"
if (-not (Test-Path -LiteralPath $generatedCrx)) { throw "Chrome did not generate the CRX file." }
if (Test-Path -LiteralPath $crx) { Remove-Item -LiteralPath $crx -Force }
Copy-Item -LiteralPath $generatedCrx -Destination $crx -Force
Remove-Item -LiteralPath $crxWork -Recurse -Force
Remove-Item -LiteralPath $stage -Recurse -Force

Write-Output "Generated ZIP: $zip"
Write-Output "Generated CRX: $crx"
