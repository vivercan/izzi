# ============================================
# FX27 - FIX DEPLOYMENT PARA VERCEL
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FX27 - FIX DEPLOYMENT" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Agregar archivos nuevos
Write-Host "[1/4] Agregando archivos nuevos..." -ForegroundColor Green
git add index.html
git add main.tsx
git add vite.config.ts
git add DEPLOY_FIX.ps1

# Commit
Write-Host "[2/4] Creando commit..." -ForegroundColor Green
git commit -m "Fix: Agregar index.html y main.tsx para deployment en Vercel"

# Push
Write-Host "[3/4] Subiendo a GitHub..." -ForegroundColor Green
git push origin main

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  COMPLETADO" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Ahora ve a Vercel y el auto-deploy se activara automaticamente." -ForegroundColor Yellow
Write-Host ""

pause
