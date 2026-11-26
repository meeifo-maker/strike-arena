# Pulls real CS2 skin metadata from ByMykel's CSGO-API and writes public/skins-data.js
# Usage: powershell -ExecutionPolicy Bypass -File scripts/fetch-skins.ps1 [-PerWeapon 10]
param([int]$PerWeapon = 10)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root = Split-Path $PSScriptRoot -Parent
$imgDir = Join-Path $root 'public/assets/skins/img'
New-Item -ItemType Directory -Force $imgDir | Out-Null

$api = Invoke-RestMethod 'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json'

$map = [ordered]@{ glock = 'weapon_glock'; deagle = 'weapon_deagle'; mp9 = 'weapon_mp9'; ak = 'weapon_ak47'; m4 = 'weapon_m4a1_silencer'; awp = 'weapon_awp'; knife = 'weapon_knife_karambit' }
$skip = @{ deagle = @('Printstream'); m4 = @('Printstream') }
$tiers = @(
  @{ id = 'rarity_contraband_weapon'; q = 1; v = 450 },
  @{ id = 'rarity_ancient_weapon';    q = 4; v = 280 },
  @{ id = 'rarity_legendary_weapon';  q = 3; v = 170 },
  @{ id = 'rarity_mythical_weapon';   q = 2; v = 100 },
  @{ id = 'rarity_rare_weapon';       q = 1; v = 60 },
  @{ id = 'rarity_uncommon_weapon';   q = 1; v = 40 },
  @{ id = 'rarity_common_weapon';     q = 1; v = 25 },
  @{ id = 'rarity_ancient';           q = 10; v = 400 }
)
$famous = @('Asiimov','Fire Serpent','Redline','Vulcan','Howl','Dragon Lore','Medusa','Hyper Beast','Fade','Neo-Noir','Water Elemental',
  'Blaze','Kumicho Dragon','Hypnotic','Neon Rider','Bloodsport','Wild Lotus','Gold Arabesque','Lightning Strike','Hot Rod','Hyper Beast',
  'Doppler','Marble Fade','Tiger Tooth','Crimson Web','Slaughter','Case Hardened','Lore','Gamma Doppler','Autotronic','Dragon King',
  'Golden Koi','Code Red','Cyrex','Icarus Fell','Bullet Queen','Water Elemental','Vogue','Starlight Protector','Hydra','Nightmare')
$md5 = [System.Security.Cryptography.MD5]::Create()
function Get-Hash($s) { [BitConverter]::ToString($md5.ComputeHash([Text.Encoding]::UTF8.GetBytes($s))) }
$shiny = 'Fade|Doppler|Gamma|Chrome|Gold|Marble|Lore|Tiger Tooth|Damascus|Ultraviolet|Steel|Metal|Bright Water|Freehand|Autotronic|Black Laminate|Slaughter'

function Get-Tint($path) {
  $bmp = [System.Drawing.Bitmap]::FromFile($path)
  try {
    $r = 0.0; $g = 0.0; $b = 0.0; $w = 0.0
    for ($y = 0; $y -lt $bmp.Height; $y += 3) { for ($x = 0; $x -lt $bmp.Width; $x += 3) {
      $c = $bmp.GetPixel($x, $y); if ($c.A -lt 160) { continue }
      $mx = [Math]::Max($c.R, [Math]::Max($c.G, $c.B)); $mn = [Math]::Min($c.R, [Math]::Min($c.G, $c.B))
      $k = 0.15 + ($mx - $mn) / 255.0 * ($mx / 255.0)
      $r += $c.R * $k; $g += $c.G * $k; $b += $c.B * $k; $w += $k } }
  } finally { $bmp.Dispose() }
  if ($w -eq 0) { return '#ffffff' }
  $r /= $w; $g /= $w; $b /= $w
  $l = 0.3 * $r + 0.59 * $g + 0.11 * $b
  $r = [Math]::Max(0, $l + ($r - $l) * 1.8); $g = [Math]::Max(0, $l + ($g - $l) * 1.8); $b = [Math]::Max(0, $l + ($b - $l) * 1.8)
  $s = 235 / [Math]::Max(1, [Math]::Max($r, [Math]::Max($g, $b)))
  '#{0:x2}{1:x2}{2:x2}' -f [int][Math]::Min(255, $r * $s), [int][Math]::Min(255, $g * $s), [int][Math]::Min(255, $b * $s)
}

# Colours of the weapon in N vertical bands, left (muzzle/tip) to right (stock/handle)
function Get-Palette($path, $n = 5) {
  $bmp = [System.Drawing.Bitmap]::FromFile($path)
  try {
    $x0 = $bmp.Width; $x1 = 0
    for ($x = 0; $x -lt $bmp.Width; $x += 2) { for ($y = 0; $y -lt $bmp.Height; $y += 4) { if ($bmp.GetPixel($x, $y).A -ge 160) { $x0 = [Math]::Min($x0, $x); $x1 = [Math]::Max($x1, $x); break } } }
    $bands = @()
    for ($i = 0; $i -lt $n; $i++) {
      $a = [int]($x0 + ($x1 - $x0) * $i / $n); $z = [int]($x0 + ($x1 - $x0) * ($i + 1) / $n)
      $r = 0.0; $g = 0.0; $b = 0.0; $w = 0.0
      for ($x = $a; $x -le $z; $x += 2) { for ($y = 0; $y -lt $bmp.Height; $y += 2) {
        $c = $bmp.GetPixel($x, $y); if ($c.A -lt 160) { continue }
        $mx = [Math]::Max($c.R, [Math]::Max($c.G, $c.B)); $mn = [Math]::Min($c.R, [Math]::Min($c.G, $c.B))
        $k = 0.25 + ($mx - $mn) / 255.0 * 2
        $r += $c.R * $k; $g += $c.G * $k; $b += $c.B * $k; $w += $k } }
      if ($w -eq 0) { $bands += '#808080'; continue }
      $r /= $w; $g /= $w; $b /= $w
      $l = 0.3 * $r + 0.59 * $g + 0.11 * $b
      $r = $l + ($r - $l) * 1.4; $g = $l + ($g - $l) * 1.4; $b = $l + ($b - $l) * 1.4
      $bands += '#{0:x2}{1:x2}{2:x2}' -f ([int][Math]::Min(255, [Math]::Max(0, $r * 1.15))), ([int][Math]::Min(255, [Math]::Max(0, $g * 1.15))), ([int][Math]::Min(255, [Math]::Max(0, $b * 1.15)))
    }
  } finally { $bmp.Dispose() }
  $bands
}

$out = [ordered]@{}
foreach ($wid in $map.Keys) {
  $pool = $api | Where-Object { $_.weapon.id -eq $map[$wid] -and $_.pattern -and $_.image -and $skip[$wid] -notcontains $_.pattern.name } |
    Sort-Object { $_.pattern.name } -Unique |
    Sort-Object { if ($famous -contains $_.pattern.name) { 0 } else { 1 } }, { Get-Hash $_.pattern.name }
  $pick = @()
  foreach ($t in $tiers) { $pick += $pool | Where-Object { $_.rarity.id -eq $t.id } | Select-Object -First $t.q }
  if ($pick.Count -lt $PerWeapon) { $pick += $pool | Where-Object { $pick -notcontains $_ } | Select-Object -First ($PerWeapon - $pick.Count) }
  $list = @()
  foreach ($s in @($pick) + @($pool | Where-Object { $pick -notcontains $_ })) {
    if ($list.Count -ge $PerWeapon) { break }
    $slug = ($s.pattern.name.ToLower() -replace '[^a-z0-9]+', '-').Trim('-')
    $file = Join-Path $imgDir "$wid-$slug.png"
    if (-not (Test-Path $file)) {
      try { Invoke-WebRequest "$($s.image)/256fx192f" -OutFile $file -UseBasicParsing }
      catch { Write-Warning "no image for $wid $($s.pattern.name), skipping"; continue }
    }
    $tier = $tiers | Where-Object { $_.id -eq $s.rarity.id } | Select-Object -First 1
    $metal = $s.pattern.name -match $shiny
    $list += [ordered]@{
      id = $slug; name = $s.pattern.name; pk = $s.pattern.id; legacy = [bool]$s.legacy_model; value = if ($wid -eq 'knife') { 400 } elseif ($tier) { $tier.v } else { 60 }
      tint = Get-Tint $file; grad = @(Get-Palette $file); metal = if ($metal) { 0.85 } else { 0.3 }; rough = if ($metal) { 0.25 } else { 0.55 }
      img = "assets/skins/img/$wid-$slug.png"; shape = if ($wid -eq 'knife') { 'karambit' } else { $null }; rarity = $s.rarity.name; rc = $s.rarity.color
    }
    Write-Host "$wid  $($s.rarity.name.PadRight(12)) $($s.pattern.name)"
  }
  $out[$wid] = $list
}
$json = $out | ConvertTo-Json -Depth 5 -Compress
Set-Content (Join-Path $root 'public/skins-data.js') "// Generated by scripts/fetch-skins.ps1 from ByMykel/CSGO-API — rerun to refresh`nwindow.SKIN_DATA=$json;" -Encoding UTF8
Write-Host "Wrote public/skins-data.js"
