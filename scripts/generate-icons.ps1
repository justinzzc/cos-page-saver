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
  $font = New-Object System.Drawing.Font("Arial", ($size * 0.58), [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $brush = New-Object System.Drawing.SolidBrush($white)
  $format = New-Object System.Drawing.StringFormat
  $format.Alignment = [System.Drawing.StringAlignment]::Center
  $format.LineAlignment = [System.Drawing.StringAlignment]::Center
  $graphics.DrawString("C", $font, $brush, (New-Object System.Drawing.RectangleF(0, 4, 128, 120)), $format)
  $output = Join-Path $iconDir ("icon-$size.png")
  $bitmap.Save($output, [System.Drawing.Imaging.ImageFormat]::Png)
  $format.Dispose(); $font.Dispose(); $brush.Dispose(); $graphics.Dispose(); $bitmap.Dispose()
}

Write-Output "Generated icons/icon-16.png, icon-32.png, icon-48.png, icon-128.png"
