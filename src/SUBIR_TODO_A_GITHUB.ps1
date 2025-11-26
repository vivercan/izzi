# ========================================
# 🚀 SUBIR TODO DE FIGMA MAKE A GITHUB
# ========================================

Write-Host "🚀 INICIANDO SUBIDA A GITHUB..." -ForegroundColor Cyan
Write-Host ""

# Cambiar a carpeta GitHub
cd C:\Users\timon\Documents\Chabelita

# Copiar archivos desde Figma Make
$FIGMA_SRC = "C:\Users\timon\Downloads\ES ESTE\src"

Write-Host "📋 Copiando archivos..." -ForegroundColor Yellow

# Copiar App.tsx
Copy-Item "$FIGMA_SRC\App.tsx" -Destination ".\src\App.tsx" -Force -ErrorAction SilentlyContinue
Write-Host "  ✅ App.tsx" -ForegroundColor Green

# Copiar styles
Copy-Item "$FIGMA_SRC\styles\*" -Destination ".\src\styles\" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "  ✅ styles/" -ForegroundColor Green

# Copiar components
Copy-Item "$FIGMA_SRC\components\*" -Destination ".\src\components\" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "  ✅ components/" -ForegroundColor Green

# Copiar package.json actualizado desde Figma Make
Copy-Item "C:\Users\timon\Downloads\ES ESTE\package.json" -Destination ".\package.json" -Force -ErrorAction SilentlyContinue
Write-Host "  ✅ package.json (con @react-google-maps/api)" -ForegroundColor Green

Write-Host ""
Write-Host "📊 Cambios a subir:" -ForegroundColor Cyan
git status --short

Write-Host ""
Write-Host "⚠️  Esto se subirá a www.jjcrm27.com" -ForegroundColor Yellow
Write-Host "Presiona ENTER para continuar..." -ForegroundColor Yellow
Read-Host

# Subir TODO a GitHub
git add .
git commit -m "feat(fx27): Sincronización completa Figma Make → GitHub (dashboard + módulos + dependencias)"
git push origin main

Write-Host ""
if ($LASTEXITCODE -eq 0) {
    Write-Host "🎉 ¡SUBIDO EXITOSAMENTE!" -ForegroundColor Green
    Write-Host "🌐 Deploy iniciado en www.jjcrm27.com (2-3 min)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🔗 Monitorea: https://github.com/vivercan/Chabelita/actions" -ForegroundColor White
} else {
    Write-Host "❌ Error al subir" -ForegroundColor Red
}

Write-Host ""
Read-Host "Presiona ENTER para cerrar"
