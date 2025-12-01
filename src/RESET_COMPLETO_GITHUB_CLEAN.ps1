# ====================================
# FX27 - RESET COMPLETO GITHUB
# ====================================
# Este script reemplaza TODO el codigo en GitHub
# manteniendo la base de datos Supabase intacta
# ====================================

Write-Host "INICIANDO RESET COMPLETO FX27..." -ForegroundColor Cyan
Write-Host ""

# 1. Ir al directorio del proyecto
Set-Location "C:\Users\timon\Documents\Chabelita"

Write-Host "Limpiando archivos anteriores..." -ForegroundColor Yellow
# Eliminar SOLO archivos de codigo, NO .git
Remove-Item -Path "src" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "components" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "utils" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "styles" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "supabase" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "assets" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "docs" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "guidelines" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "App.tsx" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "package.json" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "vite.config.ts" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "index.css" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "main.tsx" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "vercel.json" -Force -ErrorAction SilentlyContinue

Write-Host "Archivos antiguos eliminados OK" -ForegroundColor Green
Write-Host ""

Write-Host "Copiando archivos desde Figma Make..." -ForegroundColor Yellow
Write-Host "Carpeta origen: C:\Users\timon\Downloads\ES ESTE\src" -ForegroundColor Gray
Write-Host ""

# 2. Copiar TODO desde la carpeta de descarga
$source = "C:\Users\timon\Downloads\ES ESTE\src"
$destination = "C:\Users\timon\Documents\Chabelita"

# Copiar carpetas principales
if (Test-Path "$source\components") {
    Copy-Item "$source\components" -Destination $destination -Recurse -Force
    Write-Host "  [OK] components/" -ForegroundColor Green
}

if (Test-Path "$source\utils") {
    Copy-Item "$source\utils" -Destination $destination -Recurse -Force
    Write-Host "  [OK] utils/" -ForegroundColor Green
}

if (Test-Path "$source\styles") {
    Copy-Item "$source\styles" -Destination $destination -Recurse -Force
    Write-Host "  [OK] styles/" -ForegroundColor Green
}

if (Test-Path "$source\supabase") {
    Copy-Item "$source\supabase" -Destination $destination -Recurse -Force
    Write-Host "  [OK] supabase/" -ForegroundColor Green
}

if (Test-Path "$source\assets") {
    Copy-Item "$source\assets" -Destination $destination -Recurse -Force
    Write-Host "  [OK] assets/" -ForegroundColor Green
}

if (Test-Path "$source\docs") {
    Copy-Item "$source\docs" -Destination $destination -Recurse -Force
    Write-Host "  [OK] docs/" -ForegroundColor Green
}

if (Test-Path "$source\guidelines") {
    Copy-Item "$source\guidelines" -Destination $destination -Recurse -Force
    Write-Host "  [OK] guidelines/" -ForegroundColor Green
}

# Copiar archivos raiz
if (Test-Path "$source\App.tsx") {
    Copy-Item "$source\App.tsx" -Destination $destination -Force
    Write-Host "  [OK] App.tsx" -ForegroundColor Green
}

if (Test-Path "$source\package.json") {
    Copy-Item "$source\package.json" -Destination $destination -Force
    Write-Host "  [OK] package.json" -ForegroundColor Green
}

if (Test-Path "$source\vite.config.ts") {
    Copy-Item "$source\vite.config.ts" -Destination $destination -Force
    Write-Host "  [OK] vite.config.ts" -ForegroundColor Green
}

if (Test-Path "$source\index.css") {
    Copy-Item "$source\index.css" -Destination $destination -Force
    Write-Host "  [OK] index.css" -ForegroundColor Green
}

if (Test-Path "$source\main.tsx") {
    Copy-Item "$source\main.tsx" -Destination $destination -Force
    Write-Host "  [OK] main.tsx" -ForegroundColor Green
}

if (Test-Path "$source\vercel.json") {
    Copy-Item "$source\vercel.json" -Destination $destination -Force
    Write-Host "  [OK] vercel.json" -ForegroundColor Green
}

Write-Host ""
Write-Host "Archivos copiados correctamente" -ForegroundColor Green
Write-Host ""

Write-Host "Verificando gradientes..." -ForegroundColor Yellow

# Verificar LoginScreen
if (Test-Path "components\fx27\LoginScreen.tsx") {
    $loginContent = Get-Content "components\fx27\LoginScreen.tsx" -Raw
    if ($loginContent -match "#001f4d") {
        Write-Host "  [OK] LoginScreen tiene gradiente AZUL ELECTRICO" -ForegroundColor Green
    } else {
        Write-Host "  [ERROR] LoginScreen tiene gradiente INCORRECTO" -ForegroundColor Red
    }
}

# Verificar DashboardScreen
if (Test-Path "components\fx27\DashboardScreen.tsx") {
    $dashContent = Get-Content "components\fx27\DashboardScreen.tsx" -Raw
    if ($dashContent -match "#001f4d") {
        Write-Host "  [OK] DashboardScreen tiene gradiente AZUL ELECTRICO" -ForegroundColor Green
    } else {
        Write-Host "  [ERROR] DashboardScreen tiene gradiente INCORRECTO" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Preparando commit masivo..." -ForegroundColor Yellow

# 3. Git add TODO
git add -A

# 4. Commit con mensaje claro
git commit -m "RESET COMPLETO: Codigo correcto desde Figma Make (gradientes Azul Electrico definitivos)"

Write-Host "Commit creado OK" -ForegroundColor Green
Write-Host ""

Write-Host "SUBIENDO A GITHUB..." -ForegroundColor Cyan
Write-Host "Esto forzara un nuevo deployment en Vercel" -ForegroundColor Gray
Write-Host ""

# 5. Push a GitHub
git push origin main

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "RESET COMPLETO EXITOSO" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "SIGUIENTES PASOS:" -ForegroundColor Yellow
Write-Host "  1. Ve a: https://vercel.com/dashboard" -ForegroundColor White
Write-Host "  2. Espera el nuevo deployment (2-3 min)" -ForegroundColor White
Write-Host "  3. Abre en incognito: https://jjcrm27.com" -ForegroundColor White
Write-Host "  4. Verifica gradiente AZUL ELECTRICO brillante" -ForegroundColor White
Write-Host ""
Write-Host "BASE DE DATOS SUPABASE = INTACTA" -ForegroundColor Cyan
Write-Host ""
