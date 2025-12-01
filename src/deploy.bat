@echo off
REM FX27 - Script de Deployment Automatizado para Windows
REM Este script prepara y sube todo a GitHub

title FX27 - Deployment Automatizado
color 0B

echo.
echo ========================================
echo    FX27 - DEPLOYMENT AUTOMATIZADO
echo ========================================
echo.

REM PASO 1: Inicializar Git
echo [1/6] Inicializando Git...
if not exist .git (
    git init
    echo [OK] Git inicializado
) else (
    echo [OK] Git ya estaba inicializado
)
echo.

REM PASO 2: Verificar configuracion Git
echo [2/6] Verificando configuracion Git...
git config user.name >nul 2>&1
if errorlevel 1 (
    set /p git_name="Ingresa tu nombre para Git: "
    git config user.name "%git_name%"
)
git config user.email >nul 2>&1
if errorlevel 1 (
    set /p git_email="Ingresa tu email para Git: "
    git config user.email "%git_email%"
)
echo [OK] Configuracion Git completa
echo.

REM PASO 3: Agregar archivos
echo [3/6] Agregando archivos al repositorio...
git add .
echo [OK] Archivos agregados
echo.

REM PASO 4: Crear commit
echo [4/6] Creando commit inicial...
git commit -m "FX27 v1.0 - Dashboard completo con 11 modulos y efectos visuales finales" >nul 2>&1
if errorlevel 1 (
    echo [OK] Ya existe un commit
) else (
    echo [OK] Commit creado
)
echo.

REM PASO 5: Crear tag
echo [5/6] Creando snapshot v1.0...
git tag -a v1.0-dashboard-completo -m "Estado inicial estable - 11 modulos completos" >nul 2>&1
if errorlevel 1 (
    echo [OK] Tag ya existe
) else (
    echo [OK] Snapshot creado: v1.0-dashboard-completo
)
echo.

REM PASO 6: GitHub
echo [6/6] Configurando conexion con GitHub...
echo.
echo IMPORTANTE: Necesitas la URL de tu repositorio de GitHub
echo.
echo Si aun NO has creado el repositorio:
echo   1. Ve a: https://github.com/new
echo   2. Repository name: fx27
echo   3. Privacy: Private (recomendado)
echo   4. NO marcar 'Initialize with README'
echo   5. Click 'Create repository'
echo   6. Copia la URL que aparece
echo.
set /p github_url="Ingresa la URL de tu repositorio (ejemplo: https://github.com/tu-usuario/fx27.git): "

if "%github_url%"=="" (
    echo [!] No se ingreso URL
    echo Ejecuta despues: git remote add origin TU_URL
) else (
    git remote get-url origin >nul 2>&1
    if not errorlevel 1 (
        echo [!] 'origin' ya existe. Actualizando...
        git remote set-url origin %github_url%
    ) else (
        git remote add origin %github_url%
    )
    echo [OK] Repositorio remoto configurado
    echo.
    
    echo Subiendo codigo a GitHub...
    git branch -M main
    git push -u origin main
    if errorlevel 1 (
        echo [!] Error al subir. Ejecuta: git push -u origin main
    ) else (
        echo [OK] Codigo subido a GitHub
    )
    
    echo.
    echo Subiendo tag (snapshot)...
    git push origin v1.0-dashboard-completo
    if errorlevel 1 (
        echo [!] Ejecuta: git push origin v1.0-dashboard-completo
    ) else (
        echo [OK] Snapshot subido a GitHub
    )
)

echo.
echo ========================================
echo    DEPLOYMENT PREPARADO
echo ========================================
echo.
echo SIGUIENTE PASO: Vercel Deployment
echo.
echo 1. Ve a: https://vercel.com/new
echo 2. Click en 'Import' tu repositorio 'fx27'
echo 3. Agrega estas Environment Variables:
echo.
echo    VITE_SUPABASE_URL
echo    https://fbxbsslhewchyibdoyzk.supabase.co
echo.
echo    VITE_SUPABASE_ANON_KEY
echo    eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieGJzc2xoZXdjaHlpYmRveXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzczODEsImV4cCI6MjA3ODExMzM4MX0.Z8JPlg7hhKbA624QGHp2bKKTNtCD3WInQMO5twjl6a0
echo.
echo 4. Marca: Production, Preview, Development
echo 5. Click 'Deploy'
echo.
echo Tu app estara lista en 2-3 minutos!
echo.
pause
