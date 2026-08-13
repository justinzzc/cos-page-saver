param(
  [switch]$Draft,
  [switch]$Prerelease
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$manifestPath = Join-Path $root "manifest.json"
$manifest = Get-Content -Raw -Encoding UTF8 $manifestPath | ConvertFrom-Json
$version = $manifest.version
$tag = "v$version"
$dist = Join-Path $root "dist"
$zip = Join-Path $dist "cos-page-saver-v$version.zip"
$crx = Join-Path $dist "cos-page-saver-v$version.crx"

Write-Output "Building release artifacts for $tag..."
& (Join-Path $PSScriptRoot "package.ps1")
if (-not (Test-Path -LiteralPath $zip) -or -not (Test-Path -LiteralPath $crx)) {
  throw "Release artifacts were not generated."
}

Write-Output "Checking GitHub CLI authentication..."
& gh auth status
if ($LASTEXITCODE -ne 0) {
  throw "GitHub CLI is not authenticated. Run: gh auth login -h github.com"
}

$notes = "CRX3 package for the Yun Jian Cun Chrome extension. Supports page clipping, context-menu saving, and image or animated-image source preservation."
$arguments = @(
  "release", "create", $tag, $crx, $zip,
  "--title", "$($manifest.name) $tag",
  "--notes", $notes
)
if ($Draft) { $arguments += "--draft" }
if ($Prerelease) { $arguments += "--prerelease" }

Write-Output "Publishing GitHub Release $tag..."
& gh @arguments
if ($LASTEXITCODE -ne 0) {
  throw "GitHub Release creation failed."
}

Write-Output "Release published: $tag"
