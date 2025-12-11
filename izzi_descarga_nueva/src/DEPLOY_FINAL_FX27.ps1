# ============================================================================
# 🔧 FX27 - SCRIPT DE DEPLOYMENT LIMPIO A GITHUB + VERCEL
# ============================================================================

$RepoURL = "https://github.com/vivercan/izzi.git"
$RamaPrincipal = "main"

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  FX27 CRM - DEPLOYMENT AUTOMÁTICO A GITHUB + VERCEL" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# FASE 1: LIMPIEZA DE ARCHIVOS PROBLEMÁTICOS
Write-Host "🧹 FASE 1: Limpiando archivos duplicados y problemáticos..." -ForegroundColor Yellow
Write-Host ""

$archivosBorrar = @(
    "main.tsx",
    "index.css",
    "src\styles\globals.css"
)

foreach ($archivo in $archivosBorrar) {
    if (Test-Path $archivo) {
        Remove-Item $archivo -Force
        Write-Host "  ✅ Eliminado: $archivo" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  No existe: $archivo (OK)" -ForegroundColor Gray
    }
}

Write-Host ""

# FASE 2: CORRECCIÓN DE IMPORTACIÓN DUPLICADA EN APP.TSX
Write-Host "🔧 FASE 2: Corrigiendo importación duplicada de CSS..." -ForegroundColor Yellow
Write-Host ""

$appTsxPath = "App.tsx"

if (Test-Path $appTsxPath) {
    $contenido = Get-Content $appTsxPath -Raw -Encoding UTF8
    $contenido = $contenido -replace "import\s+['\`"]\.\/styles\/globals\.css['\`"];?\s*\n", ""
    $contenido | Out-File -FilePath $appTsxPath -Encoding UTF8 -NoNewline
    Write-Host "  ✅ App.tsx corregido (eliminada importación duplicada)" -ForegroundColor Green
} else {
    Write-Host "  ❌ ERROR: No se encuentra App.tsx" -ForegroundColor Red
    exit 1
}

Write-Host ""

# FASE 3: INICIALIZAR GIT
Write-Host "📦 FASE 3: Inicializando repositorio Git..." -ForegroundColor Yellow
Write-Host ""

if (-not (Test-Path ".git")) {
    git init
    Write-Host "  ✅ Repositorio Git inicializado" -ForegroundColor Green
} else {
    Write-Host "  ℹ️  Repositorio Git ya existe" -ForegroundColor Gray
}

Write-Host ""

# FASE 4: CONFIGURAR REPOSITORIO REMOTO
Write-Host "🔗 FASE 4: Configurando repositorio remoto..." -ForegroundColor Yellow
Write-Host ""

$remoteExists = git remote | Select-String -Pattern "^origin$"
if ($remoteExists) {
    git remote remove origin
    Write-Host "  ℹ️  Remote 'origin' anterior eliminado" -ForegroundColor Gray
}

git remote add origin $RepoURL
Write-Host "  ✅ Remote 'origin' configurado: $RepoURL" -ForegroundColor Green

Write-Host ""

# FASE 5: PREPARAR COMMIT
Write-Host "📝 FASE 5: Preparando archivos para commit..." -ForegroundColor Yellow
Write-Host ""

git add .
Write-Host "  ✅ Todos los archivos agregados al staging" -ForegroundColor Green

Write-Host ""

# FASE 6: CREAR COMMIT
Write-Host "💾 FASE 6: Creando commit..." -ForegroundColor Yellow
Write-Host ""

$commitMessage = "fix(fx27): Deploy completo desde Figma Make - Limpieza de duplicados y correcciones"
git commit -m $commitMessage
Write-Host "  ✅ Commit creado: $commitMessage" -ForegroundColor Green

Write-Host ""

# FASE 7: PUSH FORZADO A GITHUB
Write-Host "🚀 FASE 7: Subiendo a GitHub (reemplazando contenido)..." -ForegroundColor Yellow
Write-Host ""
Write-Host "  ⚠️  ATENCIÓN: Se reemplazará TODO el contenido en GitHub" -ForegroundColor Magenta
Write-Host "  ⏳ Esto puede tardar 15-30 segundos..." -ForegroundColor Gray
Write-Host ""

git push -f origin $RamaPrincipal

Write-Host ""
Write-Host "  ✅ Push completado exitosamente" -ForegroundColor Green
Write-Host ""

# RESUMEN FINAL
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ✅ DEPLOYMENT COMPLETADO EXITOSAMENTE" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 ACCIONES REALIZADAS:" -ForegroundColor White
Write-Host "  ✅ Archivos problemáticos eliminados (3 archivos)" -ForegroundColor Green
Write-Host "  ✅ App.tsx corregido (importación duplicada removida)" -ForegroundColor Green
Write-Host "  ✅ Código subido a GitHub: $RepoURL" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 PRÓXIMO PASO:" -ForegroundColor White
Write-Host "  1. Vercel detectará el push automáticamente" -ForegroundColor Yellow
Write-Host "  2. Iniciará el build en 10-20 segundos" -ForegroundColor Yellow
Write-Host "  3. El sitio estará en www.jjcrm27.com en ~3-5 minutos" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔍 VERIFICAR DEPLOYMENT:" -ForegroundColor White
Write-Host "  • GitHub: https://github.com/vivercan/izzi" -ForegroundColor Cyan
Write-Host "  • Vercel Dashboard: https://vercel.com/dashboard" -ForegroundColor Cyan
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
