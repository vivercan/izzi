# Script PowerShell para corregir REGEX en index.tsx
$file = "supabase\functions\server\index.tsx"

Write-Host "`n🔧 CORRIGIENDO REGEX EN $file..." -ForegroundColor Cyan

# Leer contenido RAW
$content = Get-Content $file -Raw

# BUSCAR Y REEMPLAZAR usando -replace (más directo)
# Fix 1: latMatch
$content = $content -replace 'const latMatch = responseText\.match\(/<Latitude>\(\[-\\\\d\.\]\+\)<\\\\/Latitude>/\);', 'const latMatch = responseText.match(/<Latitude>([-\d.]+)<\/Latitude>/);'

# Fix 2: lngMatch  
$content = $content -replace 'const lngMatch = responseText\.match\(/<Longitude>\(\[-\\\\d\.\]\+\)<\\\\/Longitude>/\);', 'const lngMatch = responseText.match(/<Longitude>([-\d.]+)<\/Longitude>/);'

# Fix 3: speedMatch
$content = $content -replace 'const speedMatch = responseText\.match\(/<Speed>\(\[\\\\d\.\]\+\)<\\\\/Speed>/\);', 'const speedMatch = responseText.match(/<Speed>([\d.]+)<\/Speed>/);'

# Fix 4: locationMatch
$content = $content -replace 'const locationMatch = responseText\.match\(/<Location><!\\\\\\[CDATA\\\\\\[\(\[^\\\\\\]\]\+\)\\\\\\]\\\\\\]><\\\\/Location>/\);', 'const locationMatch = responseText.match(/<Location><!\[CDATA\[([^\]]+)\]\]><\/Location>/);'

# Fix 5: odometerMatch
$content = $content -replace 'const odometerMatch = responseText\.match\(/<Odometer>\(\[\\\\d\.\]\+\)<\\\\/Odometer>/\);', 'const odometerMatch = responseText.match(/<Odometer>([\d.]+)<\/Odometer>/);'

# Fix 6: temp1Match
$content = $content -replace 'const temp1Match = responseText\.match\(/<S1\[^>\]\*>\(\[-\\\\d\.\]\+\)<\\\\/S1>/\);', 'const temp1Match = responseText.match(/<S1[^>]*>([-\d.]+)<\/S1>/);'

# Fix 7: temp2Match
$content = $content -replace 'const temp2Match = responseText\.match\(/<S2\[^>\]\*>\(\[-\\\\d\.\]\+\)<\\\\/S2>/\);', 'const temp2Match = responseText.match(/<S2[^>]*>([-\d.]+)<\/S2>/);'

# Guardar
$content | Set-Content $file -NoNewline -Encoding UTF8

Write-Host "✅ REGEX CORREGIDOS!" -ForegroundColor Green
Write-Host "`nVerifica con: git diff $file" -ForegroundColor Yellow
