# Script SIMPLE para corregir REGEX
$file = "supabase\functions\server\index.tsx"

Write-Host "`n🔧 Leyendo archivo..." -ForegroundColor Cyan

# Leer
$content = Get-Content $file -Raw

# Contar ANTES
$antes = ([regex]::Matches($content, '\\\\d')).Count
Write-Host "ANTES: $antes ocurrencias de \\d" -ForegroundColor Yellow

# REEMPLAZAR: \\d por \d (escapado en el string PowerShell es [backslash]d)
$content = $content.Replace('\\d', '\d')
$content = $content.Replace('\\]', '\]')

# Contar DESPUÉS
$despues = ([regex]::Matches($content, '\\\\d')).Count  
Write-Host "DESPUÉS: $despues ocurrencias de \\d" -ForegroundColor Cyan

# Guardar
$content | Set-Content $file -NoNewline -Encoding UTF8

Write-Host "`n✅ CORREGIDO!" -ForegroundColor Green
Write-Host "Verifica: git diff $file" -ForegroundColor Yellow
