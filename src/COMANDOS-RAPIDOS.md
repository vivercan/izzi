# ⚡ COMANDOS RÁPIDOS FX27

## 🎯 PARA COPIAR Y PEGAR

---

## 📦 PRIMER DEPLOYMENT (Hacer UNA VEZ)

```bash
# 1. Inicializar Git (si no existe)
git init

# 2. Agregar todos los archivos
git add .

# 3. Crear primer commit
git commit -m "FX27 v1.0 - Dashboard completo con 11 módulos"

# 4. Crear snapshot de respaldo
git tag -a v1.0-dashboard-completo -m "Estado inicial estable - 11 módulos completos"

# 5. Conectar con GitHub (reemplaza con tu URL)
git remote add origin https://github.com/TU-USUARIO/fx27.git

# 6. Subir todo a GitHub
git push -u origin main
git push origin v1.0-dashboard-completo

# 7. Ir a Vercel y hacer Import Project
# https://vercel.com/new
# Seleccionar el repositorio fx27
# Agregar variables de entorno:
#   VITE_SUPABASE_URL
#   VITE_SUPABASE_ANON_KEY
# Click Deploy
```

---

## 💾 CREAR SNAPSHOT (Antes de cambios grandes)

```bash
# TODO EN UNO - Copiar y pegar:
git add . && git commit -m "Estado estable antes de cambios" && git tag -a v1.1 -m "Snapshot antes de modificaciones" && git push && git push origin v1.1
```

### O paso por paso:
```bash
# 1. Guardar cambios actuales
git add .
git commit -m "Estado estable antes de cambios"

# 2. Crear tag (cambiar v1.1 por tu versión)
git tag -a v1.1 -m "Descripción del snapshot"

# 3. Subir a GitHub
git push
git push origin v1.1

# 4. Verificar que se creó
git tag -l
```

---

## ⏮️ RESTAURAR SNAPSHOT

```bash
# 1. Ver snapshots disponibles
git tag -l

# 2. Restaurar a un snapshot específico (ejemplo: v1.0-dashboard-completo)
git checkout v1.0-dashboard-completo
git checkout -b restaurar-v1.0

# 3. Si todo está bien, aplicar a main
git checkout main
git merge restaurar-v1.0
git push
```

---

## 🔄 HACER CAMBIOS Y SUBIR (Workflow normal)

```bash
# TODO EN UNO - Después de hacer cambios en el código:
git add . && git commit -m "Descripción de cambios" && git push
```

### O paso por paso:
```bash
# 1. Ver qué cambió
git status

# 2. Agregar cambios
git add .

# 3. Guardar con mensaje
git commit -m "Agregado módulo X" 

# 4. Subir a GitHub (se deploya automático en Vercel)
git push
```

---

## 🆘 EMERGENCIA - Volver atrás RÁPIDO

```bash
# Volver al último snapshot estable (EJEMPLO: v1.0)
git reset --hard v1.0-dashboard-completo
git push --force
```

⚠️ **CUIDADO**: Esto borrará todos los cambios después del snapshot

---

## 🔍 VER INFORMACIÓN

```bash
# Ver todos los snapshots
git tag -l

# Ver historial de cambios
git log --oneline

# Ver último commit
git log -1

# Ver branches
git branch -a

# Ver diferencias con versión anterior
git diff v1.0 v1.1
```

---

## 📤 ACTUALIZAR DESPUÉS DE CAMBIOS

```bash
# Alguien más hizo cambios, bajarlos:
git pull

# Tú hiciste cambios, subirlos:
git push
```

---

## 🌿 TRABAJAR EN NUEVA FEATURE (Avanzado)

```bash
# 1. Crear branch para nueva feature
git checkout -b feature/nuevo-modulo

# 2. Hacer cambios...

# 3. Guardar cambios
git add .
git commit -m "Agregado nuevo módulo"

# 4. Volver a main y hacer merge
git checkout main
git merge feature/nuevo-modulo

# 5. Subir
git push
```

---

## 🗑️ DESHACER CAMBIOS (No guardados)

```bash
# Deshacer TODOS los cambios no guardados
git reset --hard

# Deshacer cambios de UN archivo
git checkout -- nombre-archivo.tsx
```

---

## 📋 VARIABLES DE ENTORNO EN VERCEL

### Agregar/Editar en Vercel:
1. Ir a: https://vercel.com/dashboard
2. Seleccionar proyecto "fx27"
3. Settings > Environment Variables
4. Agregar:
   ```
   VITE_SUPABASE_URL = https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY = tu-key-aqui
   ```
5. Seleccionar: Production, Preview, Development
6. Save
7. Redeploy: Deployments > ... > Redeploy

---

## 🔧 DESARROLLO LOCAL

```bash
# Instalar dependencias (primera vez)
npm install

# Crear archivo .env.local con:
# VITE_SUPABASE_URL=https://...
# VITE_SUPABASE_ANON_KEY=...

# Correr en desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview
```

---

## 🎯 VERIFICACIÓN POST-DEPLOYMENT

```bash
# Abrir la app en Vercel
# Verificar manualmente:
```

- [ ] Login funciona (juan.viveros@trob.com.mx / Mexico86)
- [ ] 11 módulos visibles
- [ ] Logo FX27 en esquina superior derecha
- [ ] Slogan "Future Experiencie 27" visible
- [ ] Efectos hover funcionan
- [ ] Imágenes de headers cargan
- [ ] Colores correctos
- [ ] Tipografías correctas

---

## 📱 COMANDOS PARA GITHUB DESKTOP (Alternativa sin terminal)

Si prefieres interfaz gráfica:

1. **Commit**:
   - Abre GitHub Desktop
   - Verás cambios en la izquierda
   - Escribe mensaje en "Summary"
   - Click "Commit to main"

2. **Push**:
   - Click "Push origin" (arriba)

3. **Tag**:
   - Menu > Repository > Create Tag
   - Nombre: v1.0-dashboard-completo
   - Click "Create Tag"
   - Push origin (incluir tags)

---

## 🔐 CONFIGURACIÓN INICIAL DE GIT (Una vez en tu máquina)

```bash
# Configurar tu nombre
git config --global user.name "Tu Nombre"

# Configurar tu email
git config --global user.email "tu@email.com"

# Verificar configuración
git config --list
```

---

## 📊 MONITOREO DE DEPLOYMENTS

### Ver deployments en Vercel:
```
https://vercel.com/tu-usuario/fx27/deployments
```

Cada push a GitHub crea un nuevo deployment automáticamente.

---

## 🎨 MANTENER DISEÑO EXACTO

### Archivos CRÍTICOS que definen el diseño:
```
/styles/globals.css          ← Tipografías, colores, tokens
/components/fx27/*.tsx       ← Componentes con estilos inline
/vercel.json                 ← Configuración de deployment
```

### Antes de modificar estos archivos:
```bash
# Crear snapshot
git add . && git commit -m "Antes de modificar diseño" && git tag -a v1.1-pre-cambios -m "Snapshot seguridad" && git push && git push origin v1.1-pre-cambios
```

---

## ✅ WORKFLOW COMPLETO RECOMENDADO

```bash
# 1. ANTES DE TRABAJAR - Crear snapshot
git add . && git commit -m "Estado estable" && git tag -a v1.1 -m "Snapshot" && git push && git push origin v1.1

# 2. HACER CAMBIOS EN EL CÓDIGO
# ...editar archivos...

# 3. PROBAR LOCAL
npm run dev
# Verificar que todo funcione

# 4. SUBIR CAMBIOS
git add . && git commit -m "Descripción clara de cambios" && git push

# 5. VERIFICAR EN VERCEL
# Ir a https://fx27.vercel.app
# Verificar checklist

# 6. SI ALGO SALIÓ MAL
git reset --hard v1.1
git push --force
```

---

**Última actualización**: 7 Nov 2025  
**Nota**: Reemplaza "v1.1", "v1.0", etc. con tus versiones reales
