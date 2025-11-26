#!/bin/bash

# FX27 - Script de Deployment Automatizado
# Este script prepara y sube todo a GitHub

echo "🚀 FX27 - DEPLOYMENT AUTOMATIZADO"
echo "===================================="
echo ""

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# PASO 1: Inicializar Git
echo -e "${BLUE}[1/6]${NC} Inicializando Git..."
if [ ! -d .git ]; then
    git init
    echo -e "${GREEN}✓${NC} Git inicializado"
else
    echo -e "${GREEN}✓${NC} Git ya estaba inicializado"
fi
echo ""

# PASO 2: Configurar usuario Git (si no está configurado)
echo -e "${BLUE}[2/6]${NC} Verificando configuración Git..."
if [ -z "$(git config user.name)" ]; then
    echo -e "${YELLOW}⚠${NC} Por favor ingresa tu nombre para Git:"
    read git_name
    git config user.name "$git_name"
fi
if [ -z "$(git config user.email)" ]; then
    echo -e "${YELLOW}⚠${NC} Por favor ingresa tu email para Git:"
    read git_email
    git config user.email "$git_email"
fi
echo -e "${GREEN}✓${NC} Configuración Git: $(git config user.name) <$(git config user.email)>"
echo ""

# PASO 3: Agregar todos los archivos
echo -e "${BLUE}[3/6]${NC} Agregando archivos al repositorio..."
git add .
echo -e "${GREEN}✓${NC} Archivos agregados"
echo ""

# PASO 4: Crear commit inicial
echo -e "${BLUE}[4/6]${NC} Creando commit inicial..."
git commit -m "FX27 v1.0 - Dashboard completo con 11 módulos y efectos visuales finales" 2>/dev/null || {
    echo -e "${GREEN}✓${NC} Ya existe un commit (omitiendo)"
}
echo ""

# PASO 5: Crear tag de respaldo
echo -e "${BLUE}[5/6]${NC} Creando snapshot v1.0..."
git tag -a v1.0-dashboard-completo -m "Estado inicial estable - 11 módulos completos" 2>/dev/null || {
    echo -e "${GREEN}✓${NC} Tag ya existe (omitiendo)"
}
echo -e "${GREEN}✓${NC} Snapshot creado: v1.0-dashboard-completo"
echo ""

# PASO 6: Conectar con GitHub
echo -e "${BLUE}[6/6]${NC} Configurando conexión con GitHub..."
echo ""
echo -e "${YELLOW}IMPORTANTE:${NC} Ahora necesitas la URL de tu repositorio de GitHub"
echo ""
echo -e "Si aún NO has creado el repositorio:"
echo -e "  1. Ve a: ${BLUE}https://github.com/new${NC}"
echo -e "  2. Repository name: ${GREEN}fx27${NC}"
echo -e "  3. Privacy: Private (recomendado)"
echo -e "  4. NO marcar 'Initialize with README'"
echo -e "  5. Click 'Create repository'"
echo -e "  6. Copia la URL que aparece"
echo ""
echo -e "Ingresa la URL de tu repositorio de GitHub:"
echo -e "Ejemplo: ${BLUE}https://github.com/tu-usuario/fx27.git${NC}"
read github_url

if [ -z "$github_url" ]; then
    echo -e "${YELLOW}⚠${NC} No se ingresó URL. Configurando 'origin' para después..."
    echo -e "Ejecuta después: ${BLUE}git remote add origin TU_URL${NC}"
else
    # Verificar si origin ya existe
    if git remote get-url origin >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠${NC} 'origin' ya existe. Actualizando..."
        git remote set-url origin "$github_url"
    else
        git remote add origin "$github_url"
    fi
    echo -e "${GREEN}✓${NC} Repositorio remoto configurado"
    echo ""
    
    # Intentar subir a GitHub
    echo -e "${BLUE}Subiendo código a GitHub...${NC}"
    if git push -u origin main 2>/dev/null; then
        echo -e "${GREEN}✓${NC} Código subido a GitHub"
    else
        # Intentar con master si main falla
        git branch -M main
        if git push -u origin main; then
            echo -e "${GREEN}✓${NC} Código subido a GitHub"
        else
            echo -e "${YELLOW}⚠${NC} No se pudo subir automáticamente"
            echo -e "Ejecuta manualmente: ${BLUE}git push -u origin main${NC}"
        fi
    fi
    
    echo ""
    echo -e "${BLUE}Subiendo tag (snapshot)...${NC}"
    git push origin v1.0-dashboard-completo 2>/dev/null && {
        echo -e "${GREEN}✓${NC} Snapshot subido a GitHub"
    } || {
        echo -e "${YELLOW}⚠${NC} Ejecuta: ${BLUE}git push origin v1.0-dashboard-completo${NC}"
    }
fi

echo ""
echo "===================================="
echo -e "${GREEN}✓ DEPLOYMENT PREPARADO${NC}"
echo "===================================="
echo ""
echo -e "📋 SIGUIENTE PASO: Vercel Deployment"
echo ""
echo -e "1. Ve a: ${BLUE}https://vercel.com/new${NC}"
echo -e "2. Click en 'Import' tu repositorio 'fx27'"
echo -e "3. Agrega estas Environment Variables:"
echo ""
echo -e "   ${GREEN}VITE_SUPABASE_URL${NC}"
echo -e "   https://fbxbsslhewchyibdoyzk.supabase.co"
echo ""
echo -e "   ${GREEN}VITE_SUPABASE_ANON_KEY${NC}"
echo -e "   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieGJzc2xoZXdjaHlpYmRveXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzczODEsImV4cCI6MjA3ODExMzM4MX0.Z8JPlg7hhKbA624QGHp2bKKTNtCD3WInQMO5twjl6a0"
echo ""
echo -e "4. Marca: ${YELLOW}Production, Preview, Development${NC}"
echo -e "5. Click 'Deploy'"
echo ""
echo -e "${GREEN}¡Tu app estará lista en 2-3 minutos!${NC} 🚀"
echo ""
