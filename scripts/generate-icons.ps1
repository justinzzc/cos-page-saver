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
  $purple = [System.Drawing.ColorTranslator]::FromHtml("#6D4AFF")
  $lightPurple = [System.Drawing.ColorTranslator]::FromHtml("#DCD4FF")
  $white = [System.Drawing.Color]::White
  $graphics.Clear($purple)
  $doc = New-Object System.Drawing.Drawing2D.GraphicsPath
  $doc.AddPolygon(@([System.Drawing.Point]::new(37, 24), [System.Drawing.Point]::new(73, 24), [System.Drawing.Point]::new(91, 42), [System.Drawing.Point]::new(91, 104), [System.Drawing.Point]::new(37, 104)))
  $graphics.FillPath((New-Object System.Drawing.SolidBrush($white)), $doc)
  $brush = New-Object System.Drawing.SolidBrush($purple)
  $graphics.FillPolygon($brush, @([System.Drawing.Point]::new(59, 47), [System.Drawing.Point]::new(67, 47), [System.Drawing.Point]::new(67, 72), [System.Drawing.Point]::new(74, 65), [System.Drawing.Point]::new(80, 71), [System.Drawing.Point]::new(63, 88), [System.Drawing.Point]::new(46, 71), [System.Drawing.Point]::new(52, 65), [System.Drawing.Point]::new(59, 72)))
  $graphics.FillPolygon((New-Object System.Drawing.SolidBrush($lightPurple)), @([System.Drawing.Point]::new(73, 24), [System.Drawing.Point]::new(91, 42), [System.Drawing.Point]::new(73, 42)))
  $pen = New-Object System.Drawing.Pen($lightPurple, 6)
  $graphics.DrawLine($pen, 45, 95, 83, 95)
  $output = Join-Path $iconDir ("icon-$size.png")
  $bitmap.Save($output, [System.Drawing.Imaging.ImageFormat]::Png)
  $pen.Dispose(); $brush.Dispose(); $doc.Dispose(); $graphics.Dispose(); $bitmap.Dispose()
}

Write-Output "Generated icons/icon-16.png, icon-32.png, icon-48.png, icon-128.png"
