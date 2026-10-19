Add-Type -AssemblyName System.Drawing

$sourcePath = "c:\Users\surya\OneDrive\Desktop\cybershield\techwhizz\mobile_app\assets\images\logo.png"
$publicDir = "c:\Users\surya\OneDrive\Desktop\cybershield\techwhizz\public"
$appDir = "c:\Users\surya\OneDrive\Desktop\cybershield\techwhizz\app"

if (-not (Test-Path $publicDir)) {
    New-Item -ItemType Directory -Path $publicDir -Force | Out-Null
}

# Copy logo.png to public
Copy-Item $sourcePath (Join-Path $publicDir "logo.png") -Force
Copy-Item $sourcePath (Join-Path $appDir "icon.png") -Force

function Resize-Image($src, $dst, $width, $height) {
    $img = [System.Drawing.Image]::FromFile($src)
    $bmp = New-Object System.Drawing.Bitmap($width, $height)
    $graph = [System.Drawing.Graphics]::FromImage($bmp)
    
    $graph.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graph.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graph.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graph.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    $graph.Clear([System.Drawing.Color]::Transparent)
    $graph.DrawImage($img, 0, 0, $width, $height)
    
    $bmp.Save($dst, [System.Drawing.Imaging.ImageFormat]::Png)
    $graph.Dispose()
    $bmp.Dispose()
    $img.Dispose()
    Write-Host "Created: $dst ($width x $height)"
}

Resize-Image $sourcePath (Join-Path $publicDir "favicon-32x32.png") 32 32
Resize-Image $sourcePath (Join-Path $publicDir "favicon-16x16.png") 16 16
Resize-Image $sourcePath (Join-Path $publicDir "apple-touch-icon.png") 180 180
Resize-Image $sourcePath (Join-Path $publicDir "android-chrome-192x192.png") 192 192
Resize-Image $sourcePath (Join-Path $publicDir "android-chrome-512x512.png") 512 512

# Create multi-size ICO file for app/favicon.ico and public/favicon.ico
$img32 = [System.Drawing.Image]::FromFile((Join-Path $publicDir "favicon-32x32.png"))
$bmp32 = New-Object System.Drawing.Bitmap($img32)
$hIcon = $bmp32.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hIcon)

$icoStream1 = New-Object System.IO.FileStream ((Join-Path $publicDir "favicon.ico"), [System.IO.FileMode]::Create)
$icon.Save($icoStream1)
$icoStream1.Close()

$icoStream2 = New-Object System.IO.FileStream ((Join-Path $appDir "favicon.ico"), [System.IO.FileMode]::Create)
$icon.Save($icoStream2)
$icoStream2.Close()

$icon.Dispose()
$bmp32.Dispose()
$img32.Dispose()

Write-Host "Favicons and web icons generated successfully."
