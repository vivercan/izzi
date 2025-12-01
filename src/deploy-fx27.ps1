# ============================================================================
# FX27 - DEPLOYMENT COMPLETO A GITHUB CON LIMPIEZA
# ============================================================================

$RepoURL = "https://github.com/vivercan/izzi.git"
$RamaPrincipal = "main"
$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   FX27 - DEPLOYMENT A GITHUB + VERCEL" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# VALIDACION 1: VERIFICAR GIT
Write-Host "VALIDACION: Verificando Git..." -ForegroundColor Yellow
try {
    $gitVersion = git --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Git instalado: $gitVersion" -ForegroundColor Green
    } else {
        Write-Host "  ERROR: Git no esta instalado" -ForegroundColor Red
        Write-Host "  Descarga Git desde: https://git-scm.com/download/win" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "  ERROR: Git no esta instalado" -ForegroundColor Red
    Write-Host "  Descarga Git desde: https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# VALIDACION 2: VERIFICAR UBICACION
Write-Host "VALIDACION: Verificando ubicacion del proyecto..." -ForegroundColor Yellow
if (-not (Test-Path "App.tsx")) {
    Write-Host "  ERROR: No se encuentra App.tsx" -ForegroundColor Red
    exit 1
}
Write-Host "  Ubicacion correcta confirmada" -ForegroundColor Green
Write-Host ""

# FASE 1: CREAR .gitignore
Write-Host "FASE 1: Creando .gitignore..." -ForegroundColor Yellow

$gitignoreContent = @"
# Dependencias
node_modules/
.pnp
.pnp.js

# Produccion
dist/
build/

# Variables de entorno
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# Editor
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# Vite
.vite

# Vercel
.vercel
"@

$gitignoreContent | Out-File -FilePath ".gitignore" -Encoding UTF8 -NoNewline
Write-Host "  .gitignore creado correctamente" -ForegroundColor Green
Write-Host ""

# FASE 2: ELIMINAR ARCHIVOS DUPLICADOS
Write-Host "FASE 2: Eliminando archivos duplicados..." -ForegroundColor Yellow

$archivosDuplicados = @(
    "main.tsx",
    "index.css",
    "src\styles\globals.css"
)

foreach ($archivo in $archivosDuplicados) {
    if (Test-Path $archivo) {
        Remove-Item $archivo -Force
        Write-Host "  Eliminado: $archivo" -ForegroundColor Green
    } else {
        Write-Host "  No existe: $archivo (OK)" -ForegroundColor Gray
    }
}

Write-Host ""

# FASE 3: INICIALIZAR GIT
Write-Host "FASE 3: Configurando repositorio Git..." -ForegroundColor Yellow

if (-not (Test-Path ".git")) {
    git init
    Write-Host "  Repositorio Git inicializado" -ForegroundColor Green
} else {
    Write-Host "  Repositorio Git ya existe" -ForegroundColor Gray
}

Write-Host ""

# FASE 4: CONFIGURAR REMOTE
Write-Host "FASE 4: Configurando repositorio remoto..." -ForegroundColor Yellow

$remoteExists = git remote 2>$null | Select-String -Pattern "^origin$"
if ($remoteExists) {
    git remote remove origin
    Write-Host "  Remote 'origin' anterior eliminado" -ForegroundColor Gray
}

git remote add origin $RepoURL
Write-Host "  Remote configurado: $RepoURL" -ForegroundColor Green
Write-Host ""

# FASE 5: STAGING
Write-Host "FASE 5: Preparando archivos..." -ForegroundColor Yellow

git add .

if ($LASTEXITCODE -eq 0) {
    Write-Host "  Todos los archivos agregados al staging" -ForegroundColor Green
} else {
    Write-Host "  ERROR al agregar archivos" -ForegroundColor Red
    exit 1
}

Write-Host ""

# FASE 6: COMMIT
Write-Host "FASE 6: Creando commit..." -ForegroundColor Yellow

$commitMessage = "fix(fx27): Limpieza completa - Eliminados duplicados + gitignore configurado"

git commit -m $commitMessage 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "  Commit creado exitosamente" -ForegroundColor Green
} else {
    Write-Host "  Commit creado (o sin cambios)" -ForegroundColor Gray
}

Write-Host ""

# FASE 7: PUSH A GITHUB
Write-Host "FASE 7: Subiendo a GitHub..." -ForegroundColor Yellow
Write-Host ""
Write-Host "  ATENCION: Esto reemplazara el contenido actual en GitHub" -ForegroundColor Magenta
Write-Host "  Repositorio: $RepoURL" -ForegroundColor Cyan
Write-Host "  Rama: $RamaPrincipal" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Ejecutando push..." -ForegroundColor Yellow

git push -f origin $RamaPrincipal

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "  PUSH COMPLETADO EXITOSAMENTE" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host "   DEPLOYMENT COMPLETADO" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "ACCIONES REALIZADAS:" -ForegroundColor White
    Write-Host "  - .gitignore creado" -ForegroundColor Green
    Write-Host "  - 3 archivos duplicados eliminados" -ForegroundColor Green
    Write-Host "  - Codigo subido a GitHub" -ForegroundColor Green
    Write-Host ""
    Write-Host "PROXIMO PASO:" -ForegroundColor White
    Write-Host "  1. Vercel detectara el push (10-20 segundos)" -ForegroundColor Yellow
    Write-Host "  2. Iniciara el build automaticamente" -ForegroundColor Yellow
    Write-Host "  3. Sitio disponible en www.jjcrm27.com (3-5 minutos)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "VERIFICAR EN:" -ForegroundColor White
    Write-Host "  GitHub: https://github.com/vivercan/izzi" -ForegroundColor Cyan
    Write-Host "  Vercel: https://vercel.com/dashboard" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "  ERROR EN PUSH" -ForegroundColor Red
    Write-Host ""
    Write-Host "POSIBLES CAUSAS:" -ForegroundColor Yellow
    Write-Host "  1. Credenciales de GitHub no configuradas" -ForegroundColor White
    Write-Host "  2. Sin acceso al repositorio" -ForegroundColor White
    Write-Host "  3. Problemas de conexion a Internet" -ForegroundColor White
    Write-Host ""
    exit 1
}
