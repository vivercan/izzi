# ========================================
# 🚀 SCRIPT COMPLETO: FIGMA MAKE → GITHUB
# ========================================
# Este script copia TODO el proyecto de Figma Make a GitHub
# manteniendo la estructura y sincronizando correctamente

Write-Host "🚀 INICIANDO SINCRONIZACIÓN COMPLETA..." -ForegroundColor Cyan
Write-Host ""

# ====================================
# 📁 PASO 1: RUTAS
# ====================================
$FIGMA_PATH = "C:\Users\timon\Downloads\ES ESTE\src"
$GITHUB_PATH = "C:\Users\timon\Documents\Chabelita"

Write-Host "📂 Origen : $FIGMA_PATH" -ForegroundColor Yellow
Write-Host "📂 Destino: $GITHUB_PATH" -ForegroundColor Yellow
Write-Host ""

# ====================================
# 🔄 PASO 2: CAMBIAR A DIRECTORIO GITHUB
# ====================================
cd $GITHUB_PATH
Write-Host "✅ Cambiado a directorio GitHub" -ForegroundColor Green
Write-Host ""

# ====================================
# 📋 PASO 3: COPIAR ARCHIVOS PRINCIPALES
# ====================================
Write-Host "📋 Copiando archivos principales..." -ForegroundColor Cyan

# App.tsx
if (Test-Path "$FIGMA_PATH\App.tsx") {
    Copy-Item "$FIGMA_PATH\App.tsx" -Destination ".\src\App.tsx" -Force
    Write-Host "  ✅ App.tsx" -ForegroundColor Green
}

# index.css (si existe, sino crear uno básico)
if (Test-Path "$FIGMA_PATH\index.css") {
    Copy-Item "$FIGMA_PATH\index.css" -Destination ".\src\index.css" -Force
    Write-Host "  ✅ index.css" -ForegroundColor Green
} else {
    $indexCssContent = @"
/* FX27 CRM - Main CSS Entry Point */
@import './styles/globals.css';
"@
    $indexCssContent | Out-File -FilePath ".\src\index.css" -Encoding utf8 -Force
    Write-Host "  ✅ index.css (creado)" -ForegroundColor Green
}

Write-Host ""

# ====================================
# 🎨 PASO 4: COPIAR CARPETA STYLES
# ====================================
Write-Host "🎨 Copiando carpeta styles..." -ForegroundColor Cyan
if (Test-Path "$FIGMA_PATH\styles") {
    Copy-Item "$FIGMA_PATH\styles\*" -Destination ".\src\styles\" -Recurse -Force
    Write-Host "  ✅ Carpeta styles completa" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Carpeta styles no encontrada en Figma Make" -ForegroundColor Yellow
}
Write-Host ""

# ====================================
# 🧩 PASO 5: COPIAR CARPETA COMPONENTS
# ====================================
Write-Host "🧩 Copiando carpeta components..." -ForegroundColor Cyan
if (Test-Path "$FIGMA_PATH\components") {
    Copy-Item "$FIGMA_PATH\components\*" -Destination ".\src\components\" -Recurse -Force
    Write-Host "  ✅ Carpeta components completa" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Carpeta components no encontrada en Figma Make" -ForegroundColor Yellow
}
Write-Host ""

# ====================================
# 🖼️ PASO 6: COPIAR ASSETS (si existen)
# ====================================
Write-Host "🖼️  Copiando carpeta assets..." -ForegroundColor Cyan
if (Test-Path "$FIGMA_PATH\assets") {
    Copy-Item "$FIGMA_PATH\assets\*" -Destination ".\src\assets\" -Recurse -Force
    Write-Host "  ✅ Carpeta assets completa" -ForegroundColor Green
} else {
    Write-Host "  ℹ️  Carpeta assets no encontrada (no es problema)" -ForegroundColor Gray
}
Write-Host ""

# ====================================
# 🔧 PASO 7: COPIAR UTILS (si existen)
# ====================================
Write-Host "🔧 Copiando carpeta utils..." -ForegroundColor Cyan
if (Test-Path "$FIGMA_PATH\utils") {
    # No copiar info.tsx porque ya existe en GitHub
    Get-ChildItem "$FIGMA_PATH\utils" -Recurse | Where-Object { $_.Name -ne "info.tsx" } | ForEach-Object {
        $relativePath = $_.FullName.Substring("$FIGMA_PATH\utils".Length)
        $destination = ".\src\utils$relativePath"
        $destinationDir = Split-Path $destination -Parent
        if (!(Test-Path $destinationDir)) {
            New-Item -ItemType Directory -Path $destinationDir -Force | Out-Null
        }
        Copy-Item $_.FullName -Destination $destination -Force
    }
    Write-Host "  ✅ Carpeta utils completa (excepto info.tsx protegido)" -ForegroundColor Green
} else {
    Write-Host "  ℹ️  Carpeta utils no encontrada (no es problema)" -ForegroundColor Gray
}
Write-Host ""

# ====================================
# 📊 PASO 8: VER CAMBIOS DETECTADOS
# ====================================
Write-Host "📊 Cambios detectados:" -ForegroundColor Cyan
Write-Host ""
git status --short
Write-Host ""

# ====================================
# ⏸️ PASO 9: CONFIRMACIÓN DEL USUARIO
# ====================================
Write-Host "✅ Archivos listos para subir a GitHub" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANTE: Esto va a subir TODOS los cambios a www.jjcrm27.com" -ForegroundColor Yellow
Write-Host "📦 La base de datos NO se afectará (leads, tractocamiones, etc.)" -ForegroundColor Green
Write-Host ""
Write-Host "Presiona ENTER para continuar o CTRL+C para cancelar..." -ForegroundColor Yellow
Read-Host

# ====================================
# 🚀 PASO 10: GIT ADD, COMMIT Y PUSH
# ====================================
Write-Host ""
Write-Host "🚀 Subiendo cambios a GitHub..." -ForegroundColor Cyan
Write-Host ""

git add src/App.tsx src/index.css src/styles/ src/components/ src/assets/ src/utils/

$commitMessage = "feat(fx27): Sincronización completa desde Figma Make - Dashboard + Módulos + Estilos"

git commit -m $commitMessage

git push origin main

# ====================================
# 🎉 PASO 11: RESULTADO FINAL
# ====================================
Write-Host ""
if ($LASTEXITCODE -eq 0) {
    Write-Host "🎉 ¡TODO SUBIDO EXITOSAMENTE!" -ForegroundColor Green
    Write-Host "🌐 Deploy automático iniciado en www.jjcrm27.com" -ForegroundColor Cyan
    Write-Host "⏱️  Espera 2-3 minutos para que termine el deploy" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🔗 Monitorea el progreso en:" -ForegroundColor Cyan
    Write-Host "   https://github.com/vivercan/Chabelita/actions" -ForegroundColor White
} else {
    Write-Host "❌ Hubo un error en el push" -ForegroundColor Red
    Write-Host "💡 Revisa los mensajes de error arriba" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Presiona ENTER para cerrar..." -ForegroundColor Gray
Read-Host
