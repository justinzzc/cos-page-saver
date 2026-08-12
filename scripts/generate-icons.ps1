$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$iconDir = Join-Path $root "icons"
New-Item -ItemType Directory -Force -Path $iconDir | Out-Null

foreach ($size in @(16, 32, 48, 128)) {
  $bitmap = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $scale = $size / 128.0
  $graphics.ScaleTransform($scale, $scale)
  $green = [System.Drawing.ColorTranslator]::FromHtml("#00A870")
  $white = [System.Drawing.Color]::White
  $graphics.Clear($green)
  $cloud = New-Object System.Drawing.Drawing2D.GraphicsPath
  $cloud.AddEllipse(33, 45, 45, 35)
  $cloud.AddEllipse(51, 23, 42, 54)
  $cloud.AddEllipse(73, 44, 37, 38)
  $cloud.AddRectangle((New-Object System.Drawing.Rectangle(35, 55, 65, 35)))
  $graphics.FillPath((New-Object System.Drawing.SolidBrush($white)), $cloud)
  $brush = New-Object System.Drawing.SolidBrush($green)
  $graphics.FillRectangle($brush, 57, 38, 14, 52)
  $graphics.FillRectangle($brush, 40, 57, 48, 14)
  $output = Join-Path $iconDir ("icon-$size.png")
  $bitmap.Save($output, [System.Drawing.Imaging.ImageFormat]::Png)
  $brush.Dispose(); $cloud.Dispose(); $graphics.Dispose(); $bitmap.Dispose()
}

Write-Output "Generated icons/icon-16.png, icon-32.png, icon-48.png, icon-128.png"
