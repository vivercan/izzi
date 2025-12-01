# 💾 SISTEMA DE RESPALDOS FX27

## 🎯 OBJETIVO
Mantener puntos de restauración del proyecto FX27 para poder volver a estados anteriores estables en caso de desconfiguración.

---

## 📸 SNAPSHOT ACTUAL: v1.0 - Dashboard Completo

### Estado del Sistema:
- **Fecha**: 7 Noviembre 2025
- **Versión**: 1.0
- **Descripción**: Dashboard completo con 11 módulos, efectos visuales finales, glassmorphism, headers con imágenes contrastantes

### Características Incluidas:
✅ Login screen con validación (juan.viveros@trob.com.mx / Mexico86)  
✅ Dashboard con 11 módulos (7 arriba, 4 abajo)  
✅ Efectos hover dramáticos en módulos  
✅ Glassmorphism (blur, opacity, borders)  
✅ Headers con imágenes tecnológicas de Unsplash  
✅ Franja azul primary (bottom: 3%, opacity: 40%)  
✅ Logo FX27 inamovible (z-50, top: -8px, right: 8px)  
✅ Slogan "Future Experiencie 27" en todas las pantallas  
✅ Tipografías: Exo 2, Orbitron, Exo 2 Black  
✅ Sistema de roles (admin, operations)  
✅ Persistencia de sesión (localStorage)  

### Módulos Completos:
1. Agregar Lead
2. Panel de Oportunidades  
3. Operaciones
4. Despacho Inteligente
5. Control de Equipo
6. KPIs
7. Configuración
8. Cotizaciones
9. Ventas
10. Utilerías
11. **Servicio A Clientes** (nuevo)

---

## 🔧 CÓMO CREAR UN SNAPSHOT

### Método 1: Git Tag (RECOMENDADO)

```bash
# 1. Ver el estado actual
git status

# 2. Asegurarte de que todo esté committed
git add .
git commit -m "Estado estable antes de crear snapshot"

# 3. Crear tag con nombre descriptivo
git tag -a v1.0-dashboard-completo -m "FX27 v1.0 - Dashboard completo con 11 módulos"

# 4. Subir el tag a GitHub
git push origin v1.0-dashboard-completo

# 5. Verificar que se creó
git tag -l
```

### Método 2: Branch de Respaldo

```bash
# 1. Crear branch desde el estado actual
git checkout -b backup/v1.0-dashboard-completo

# 2. Subir a GitHub
git push origin backup/v1.0-dashboard-completo

# 3. Volver a main
git checkout main

# 4. Verificar branches
git branch -a
```

### Método 3: Respaldo Local (Adicional)

```bash
# En tu sistema de archivos
cp -r /ruta/fx27 /ruta/respaldos/fx27-v1.0-$(date +%Y%m%d-%H%M%S)

# O en Windows (PowerShell)
Copy-Item -Path "C:\ruta\fx27" -Destination "C:\respaldos\fx27-v1.0-20251107" -Recurse
```

---

## ⏮️ CÓMO RESTAURAR UN SNAPSHOT

### Restaurar desde Git Tag:

```bash
# 1. Ver tags disponibles
git tag -l

# Salida ejemplo:
# v1.0-dashboard-completo
# v1.1-nuevas-features
# v0.9-beta

# 2. Ver detalles de un tag
git show v1.0-dashboard-completo

# 3. OPCIÓN A: Ver el código sin cambiar nada (solo lectura)
git checkout v1.0-dashboard-completo

# 4. OPCIÓN B: Restaurar y continuar trabajando
git checkout v1.0-dashboard-completo
git checkout -b restauracion-v1.0

# 5. Si todo está bien, hacer merge a main
git checkout main
git merge restauracion-v1.0
git push

# 6. OPCIÓN C: Resetear main completamente a ese tag (CUIDADO)
git checkout main
git reset --hard v1.0-dashboard-completo
git push --force  # ⚠️ PELIGROSO - Solo si estás seguro
```

### Restaurar desde Branch de Respaldo:

```bash
# 1. Ver branches disponibles
git branch -a

# 2. Cambiar a la branch de respaldo
git checkout backup/v1.0-dashboard-completo

# 3. Crear nueva branch de trabajo desde ahí
git checkout -b trabajo-desde-backup

# 4. Trabajar normalmente
# ...hacer cambios...

# 5. Cuando esté listo, merge a main
git checkout main
git merge trabajo-desde-backup
git push
```

### Restaurar desde Respaldo Local:

```bash
# 1. Ir a la carpeta de respaldos
cd /ruta/respaldos

# 2. Ver respaldos disponibles
ls -la

# 3. Copiar el respaldo deseado sobre el proyecto actual
# ⚠️ CUIDADO: Esto sobrescribirá todo
cp -r fx27-v1.0-20251107/* /ruta/fx27/

# 4. Ir al proyecto y verificar
cd /ruta/fx27
git status

# 5. Si todo está bien, commit
git add .
git commit -m "Restaurado desde respaldo local v1.0"
git push
```

---

## 📋 CHECKLIST DE VERIFICACIÓN POST-RESTAURACIÓN

Después de restaurar, verifica que todo funcione:

### Visual:
- [ ] Logo FX27 en posición correcta (top: -8px, right: 8px, z-50)
- [ ] Slogan "Future Experiencie 27" visible
- [ ] 11 módulos visibles en dashboard (7+4)
- [ ] Colores correctos (primary: #1E66F5, bg: #0B1220)
- [ ] Tipografías correctas (Exo 2, Orbitron)

### Funcional:
- [ ] Login funciona (juan.viveros@trob.com.mx / Mexico86)
- [ ] Navegación entre módulos
- [ ] Botón "Volver" funciona
- [ ] Logout funciona
- [ ] Persistencia de sesión funciona

### Efectos:
- [ ] Hover en módulos (translateY, shadows, glow)
- [ ] Glassmorphism (blur, borders)
- [ ] Headers con imágenes
- [ ] Franja azul en headers (bottom: 3%)

### Técnico:
- [ ] npm install funciona
- [ ] npm run dev funciona
- [ ] npm run build funciona
- [ ] No hay errores en consola

---

## 🗂️ HISTORIAL DE SNAPSHOTS

### v1.0 - Dashboard Completo (7 Nov 2025)
**Tag**: `v1.0-dashboard-completo`  
**Descripción**: Primera versión estable con 11 módulos y efectos visuales completos  
**Cambios principales**:
- 11 módulos implementados
- Sistema de login y roles
- Efectos visuales finales
- Headers con imágenes contrastantes

### v0.9 - Beta (Ejemplo futuro)
**Tag**: `v0.9-beta`  
**Descripción**: Versión beta previa...

---

## 📅 CALENDARIO DE RESPALDOS

### Cuándo Crear Snapshots:

✅ **SIEMPRE** antes de:
- Cambios grandes en la estructura
- Actualizar dependencias importantes
- Modificar estilos globales
- Cambiar sistema de navegación
- Integrar nuevas features complejas

✅ **RECOMENDADO** después de:
- Completar un módulo nuevo
- Terminar efectos visuales
- Finalizar una feature completa
- Estado estable antes de presentación

❌ **NO NECESARIO** para:
- Cambios de texto pequeños
- Ajustes menores de estilos
- Fixes de typos
- Cambios en comentarios

---

## 🔐 MEJORES PRÁCTICAS

### 1. Nombres de Tags Claros
```bash
# ✅ BIEN
git tag -a v1.0-dashboard-completo -m "Dashboard completo"
git tag -a v1.1-modulo-ventas -m "Agregado módulo de ventas"

# ❌ MAL
git tag -a tag1 -m "cambios"
git tag -a fix -m "arreglos"
```

### 2. Documentar Snapshots
- Actualiza este archivo `RESPALDOS.md` con cada snapshot
- Describe qué incluye cada versión
- Anota fecha y razón del snapshot

### 3. Mantener Respaldos Múltiples
- Git tags (remoto en GitHub)
- Branches de respaldo (remoto en GitHub)
- Respaldo local en tu máquina
- Respaldo en Vercel (deployments automáticos)

### 4. Nunca Force Push en Main
```bash
# ❌ PELIGROSO
git push --force origin main

# ✅ MEJOR
git push origin main
# Si hay conflictos, resolverlos manualmente
```

---

## 🆘 RESCATE DE EMERGENCIA

### Si perdiste todo y solo tienes Vercel:

1. **Descargar código desde Vercel**:
   - Ir a Vercel Dashboard
   - Project > Deployments
   - Click en el deployment estable
   - Download source code

2. **O clonar desde GitHub**:
   ```bash
   git clone https://github.com/tu-usuario/fx27.git
   cd fx27
   git checkout v1.0-dashboard-completo
   ```

### Si GitHub y local se perdieron:

1. **Vercel guarda el código de cada deployment**
2. **Descargar el último deployment estable**
3. **Recrear repositorio**:
   ```bash
   git init
   git add .
   git commit -m "Recuperado desde Vercel"
   git remote add origin https://github.com/tu-usuario/fx27-new.git
   git push -u origin main
   ```

---

## 📊 COMANDOS RÁPIDOS DE REFERENCIA

```bash
# Ver todos los snapshots (tags)
git tag -l

# Ver detalles de un snapshot
git show v1.0-dashboard-completo

# Crear snapshot rápido
git tag -a v1.0 -m "Snapshot" && git push origin v1.0

# Ver branches de respaldo
git branch -a | grep backup

# Comparar con versión anterior
git diff v1.0 v1.1

# Ver historial de commits
git log --oneline --graph --all

# Verificar estado actual
git status

# Ver último commit
git log -1
```

---

## ✅ CHECKLIST ANTES DE HACER CAMBIOS GRANDES

1. [ ] Crear snapshot actual
2. [ ] Verificar que el snapshot se subió a GitHub
3. [ ] Documentar en RESPALDOS.md
4. [ ] Hacer respaldo local adicional
5. [ ] Ahora sí, hacer los cambios
6. [ ] Probar exhaustivamente
7. [ ] Si funciona: commit y push
8. [ ] Si no funciona: restaurar desde snapshot

---

**Última actualización**: 7 Nov 2025  
**Mantenedor**: FX27 Development Team  
**Próxima revisión**: Después de cada cambio mayor
