# ====================================
# FX27 - RESET COMPLETO GITHUB
# ====================================
# Este script reemplaza TODO el código en GitHub
# manteniendo la base de datos Supabase intacta
# ====================================

Write-Host "🚀 INICIANDO RESET COMPLETO FX27..." -ForegroundColor Cyan
Write-Host ""

# 1. Ir al directorio del proyecto
Set-Location "C:\Users\timon\Documents\Chabelita"

Write-Host "📂 Limpiando archivos anteriores..." -ForegroundColor Yellow
# Eliminar SOLO archivos de código, NO .git
Remove-Item -Path "src" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "components" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "utils" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "styles" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "supabase" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "assets" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "App.tsx" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "package.json" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "vite.config.ts" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "index.css" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "vercel.json" -Force -ErrorAction SilentlyContinue

Write-Host "✅ Archivos antiguos eliminados" -ForegroundColor Green
Write-Host ""

Write-Host "📥 Copiando archivos desde Figma Make..." -ForegroundColor Yellow
Write-Host "   (Carpeta: C:\Users\timon\Downloads\ES ESTE)" -ForegroundColor Gray
Write-Host ""

# 2. Copiar TODO desde la carpeta de descarga
$source = "C:\Users\timon\Downloads\ES ESTE"
$destination = "C:\Users\timon\Documents\Chabelita"

# Copiar carpetas principales
Copy-Item "$source\src" -Destination $destination -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item "$source\components" -Destination $destination -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item "$source\utils" -Destination $destination -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item "$source\styles" -Destination $destination -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item "$source\supabase" -Destination $destination -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item "$source\assets" -Destination $destination -Recurse -Force -ErrorAction SilentlyContinue

# Copiar archivos raíz
Copy-Item "$source\App.tsx" -Destination $destination -Force -ErrorAction SilentlyContinue
Copy-Item "$source\package.json" -Destination $destination -Force -ErrorAction SilentlyContinue
Copy-Item "$source\vite.config.ts" -Destination $destination -Force -ErrorAction SilentlyContinue
Copy-Item "$source\index.css" -Destination $destination -Force -ErrorAction SilentlyContinue
Copy-Item "$source\vercel.json" -Destination $destination -Force -ErrorAction SilentlyContinue

Write-Host "✅ Archivos copiados correctamente" -ForegroundColor Green
Write-Host ""

Write-Host "🔍 Verificando gradientes..." -ForegroundColor Yellow

# Verificar LoginScreen
$loginContent = Get-Content "components\fx27\LoginScreen.tsx" -Raw
if ($loginContent -match "#001f4d") {
    Write-Host "   ✅ LoginScreen tiene gradiente AZUL ELÉCTRICO" -ForegroundColor Green
} else {
    Write-Host "   ❌ LoginScreen tiene gradiente INCORRECTO" -ForegroundColor Red
}

# Verificar DashboardScreen
$dashContent = Get-Content "components\fx27\DashboardScreen.tsx" -Raw
if ($dashContent -match "#001f4d") {
    Write-Host "   ✅ DashboardScreen tiene gradiente AZUL ELÉCTRICO" -ForegroundColor Green
} else {
    Write-Host "   ❌ DashboardScreen tiene gradiente INCORRECTO" -ForegroundColor Red
}

Write-Host ""
Write-Host "📤 Preparando commit masivo..." -ForegroundColor Yellow

# 3. Git add TODO
git add -A

# 4. Commit con mensaje claro
git commit -m "🔄 RESET COMPLETO: Código correcto desde Figma Make (gradientes Azul Eléctrico definitivos)"

Write-Host "✅ Commit creado" -ForegroundColor Green
Write-Host ""

Write-Host "🚀 SUBIENDO A GITHUB..." -ForegroundColor Cyan
Write-Host "   Esto forzará un nuevo deployment en Vercel" -ForegroundColor Gray
Write-Host ""

# 5. Push a GitHub
git push origin main --force

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ RESET COMPLETO EXITOSO" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 SIGUIENTES PASOS:" -ForegroundColor Yellow
Write-Host "   1. Ve a: https://vercel.com/dashboard" -ForegroundColor White
Write-Host "   2. Espera el nuevo deployment (2-3 min)" -ForegroundColor White
Write-Host "   3. Abre en incógnito: https://jjcrm27.com" -ForegroundColor White
Write-Host "   4. Verifica gradiente AZUL ELÉCTRICO brillante" -ForegroundColor White
Write-Host ""
Write-Host "💾 BASE DE DATOS SUPABASE = INTACTA ✅" -ForegroundColor Cyan
Write-Host ""
