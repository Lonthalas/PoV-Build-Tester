param([string]$dll, [string]$out)
# Extrae (solo lectura) del DLL a $out los íconos del árbol de oficios y, del de combate, los v2.mastery, los de los Caminos,
# los halos de maestría y los retratos de cada camino. Los íconos quedan de 48 px; halos y retratos, más grandes.
Add-Type -AssemblyName System.Drawing
New-Item -ItemType Directory -Force $out | Out-Null
$asm = [Reflection.Assembly]::ReflectionOnlyLoad([IO.File]::ReadAllBytes($dll))
function Save48($img, [Drawing.Rectangle]$src, [string]$key, [int]$size = 48, [bool]$jpg = $false) {
  $bmp = New-Object Drawing.Bitmap $size, $size
  $g = [Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.DrawImage($img, (New-Object Drawing.Rectangle 0, 0, $size, $size), $src, [Drawing.GraphicsUnit]::Pixel)
  $g.Dispose()
  if ($jpg) {
    $codec = [Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
    $p = New-Object Drawing.Imaging.EncoderParameters 1
    $p.Param[0] = New-Object Drawing.Imaging.EncoderParameter ([Drawing.Imaging.Encoder]::Quality), 85L
    $bmp.Save((Join-Path $out "$key.jpg"), $codec, $p)
  } else { $bmp.Save((Join-Path $out "$key.png"), [Drawing.Imaging.ImageFormat]::Png) }
  $bmp.Dispose()
}
function Load($res) { [Drawing.Image]::FromStream($asm.GetManifestResourceStream($res)) }
$n = 0; $size = 48; $jpg = $false
foreach ($res in $asm.GetManifestResourceNames()) {
  if ($res -match '^PassiveTree\.(craftart|craftmastery|crafttravel)\.(.+)\.png$') { $key = $Matches[1] + "__" + $Matches[2] }
  elseif ($res -match '^PassiveTree\.art5\.icon-(.+)\.png$') { $key = "art5__" + $Matches[1] }
  # Keystones y maestrías del árbol de combate ("v2m:..." en el árbol).
  elseif ($res -match '^PassiveTree\.v2\.mastery\.(.+)\.png$') { $key = "v2m__" + $Matches[1] }
  elseif ($res -match '^PassiveTree\.v2\.icon\.(.+)\.png$') { $key = "v2__" + $Matches[1] }
  elseif ($res -match '^PassiveTree\.path\.(.+)-normal\.png$') { $key = "path__" + $Matches[1] }
  # Caminos: neutro y por atributo (UiKit.AttributeIcon).
  elseif ($res -match '^PassiveTree\.polish3\.(attribute-.+)\.png$') { $key = "polish3__" + $Matches[1] }
  # Halos de los notables con maestría (MasteryBacks) y de oficios (CraftHalos), y marco y retratos del centro del árbol.
  elseif ($res -match '^PassiveTree\.v2\.(halo|crafthalo)\.(.+)\.png$') { $key = $Matches[1] + "__" + $Matches[2]; $size = 80 }
  elseif ($res -eq 'PassiveTree.polish3.portrait-ring.png') { $key = "portrait__ring"; $size = 400 }
  # Los retratos se guardan en JPEG (la página los recorta en círculo, no necesitan transparencia).
  elseif ($res -match '^PassiveTree\.path-(.+)-512\.png$') { $key = "portrait__" + $Matches[1]; $size = 384; $jpg = $true }
  else { continue }
  $img = Load $res
  Save48 $img (New-Object Drawing.Rectangle 0, 0, $img.Width, $img.Height) $key $size $jpg
  $size = 48; $jpg = $false
  $img.Dispose(); $n++
}
# Atlas de oficios: 13 columnas, casillas de 256 px con 2 px de margen cada 260 px (CraftNodeArt.Get).
$img = Load 'PassiveTree.craftnodes.atlas.png'
"craftnodes.atlas: $($img.Width)x$($img.Height)"
for ($i = 0; ($i % 13) * 260 + 258 -le $img.Width -and [math]::Floor($i / 13) * 260 + 258 -le $img.Height; $i++) {
  Save48 $img (New-Object Drawing.Rectangle (($i % 13) * 260 + 2), ([math]::Floor($i / 13) * 260 + 2), 256, 256) "craftatlas__$i"; $n++
}
$img.Dispose()
# Atlas general: 16 columnas de 128 px (UiKit.Tile).
$img = Load 'PassiveTree.icons.png'
"icons: $($img.Width)x$($img.Height)"
for ($i = 0; ($i % 16) * 128 + 128 -le $img.Width -and [math]::Floor($i / 16) * 128 + 128 -le $img.Height; $i++) {
  Save48 $img (New-Object Drawing.Rectangle (($i % 16) * 128), ([math]::Floor($i / 16) * 128), 128, 128) "tile__$i"; $n++
}
$img.Dispose()
"imágenes guardadas: $n"
