$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$iconDir = Join-Path $root "icons"
New-Item -ItemType Directory -Force -Path $iconDir | Out-Null

foreach ($size in @(16, 32, 48, 128)) {
  $renderSize = $size * 4
  $bitmap = New-Object System.Drawing.Bitmap($renderSize, $renderSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $scale = $renderSize / 128.0
  $graphics.ScaleTransform($scale, $scale)
  $green = [System.Drawing.ColorTranslator]::FromHtml("#00A870")
  $white = [System.Drawing.Color]::White
  $graphics.Clear([System.Drawing.Color]::Transparent)
  $corner = 28
  $rounded = New-Object System.Drawing.Drawing2D.GraphicsPath
  $rounded.AddArc(4, 4, $corner, $corner, 180, 90)
  $rounded.AddArc(96, 4, $corner, $corner, 270, 90)
  $rounded.AddArc(96, 96, $corner, $corner, 0, 90)
  $rounded.AddArc(4, 96, $corner, $corner, 90, 90)
  $rounded.CloseFigure()
  $graphics.FillPath((New-Object System.Drawing.SolidBrush($green)), $rounded)
  $font = New-Object System.Drawing.Font("Arial", 92, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $brush = New-Object System.Drawing.SolidBrush($white)
  $format = New-Object System.Drawing.StringFormat
  $format.Alignment = [System.Drawing.StringAlignment]::Center
  $format.LineAlignment = [System.Drawing.StringAlignment]::Center
  $graphics.DrawString("C", $font, $brush, (New-Object System.Drawing.RectangleF(0, 6, 128, 128)), $format)
  $output = Join-Path $iconDir ("icon-$size.png")
  $final = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $finalGraphics = [System.Drawing.Graphics]::FromImage($final)
  $finalGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $finalGraphics.DrawImage($bitmap, 0, 0, $size, $size)
  $final.Save($output, [System.Drawing.Imaging.ImageFormat]::Png)
  $finalGraphics.Dispose(); $final.Dispose(); $format.Dispose(); $font.Dispose(); $brush.Dispose(); $rounded.Dispose(); $graphics.Dispose(); $bitmap.Dispose()
}

Write-Output "Generated icons/icon-16.png, icon-32.png, icon-48.png, icon-128.png"
