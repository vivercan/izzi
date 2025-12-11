# 🚀 GUÍA DE DEPLOYMENT FX27

## Estado Actual del Proyecto
**Versión**: 1.0 - Dashboard completo con 11 módulos
**Fecha**: 7 de Noviembre 2025
**Estado**: Diseño finalizado con efectos visuales, glassmorphism y headers contrastantes

---

## 📋 PRE-REQUISITOS

### Cuentas Configuradas
- ✅ GitHub (repositorio creado)
- ✅ Vercel (cuenta vinculada con GitHub)
- ✅ Supabase (proyecto creado)

---

## 🔧 PASO 1: PREPARAR VARIABLES DE ENTORNO

### En Supabase:
1. Ve a tu proyecto Supabase
2. Settings > API
3. Copia estos valores:
   - `Project URL` → VITE_SUPABASE_URL
   - `anon public` key → VITE_SUPABASE_ANON_KEY

### Crear archivo .env.local (para desarrollo local):
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

---

## 📦 PASO 2: SUBIR A GITHUB

### Opción A: Usando Git CLI
```bash
# 1. Inicializar repositorio (si no existe)
git init

# 2. Agregar todos los archivos
git add .

# 3. Crear commit con mensaje descriptivo
git commit -m "FX27 v1.0 - Dashboard completo con 11 módulos y efectos visuales finales"

# 4. Conectar con tu repositorio de GitHub
git remote add origin https://github.com/tu-usuario/fx27.git

# 5. Subir a GitHub
git push -u origin main
```

### Opción B: Usando GitHub Desktop
1. Abre GitHub Desktop
2. File > Add Local Repository
3. Selecciona la carpeta del proyecto
4. Haz commit con mensaje: "FX27 v1.0 - Dashboard completo"
5. Click en "Publish repository"

---

## 🌐 PASO 3: DEPLOYMENT EN VERCEL

### Deployment Automático desde GitHub:

1. **Ir a Vercel Dashboard**
   - https://vercel.com/dashboard

2. **Import Project**
   - Click en "Add New..." > "Project"
   - Selecciona tu repositorio de GitHub "fx27"
   - Click en "Import"

3. **Configurar Build Settings**
   ```
   Framework Preset: Vite
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

4. **Agregar Variables de Entorno**
   - En la sección "Environment Variables"
   - Agrega las siguientes variables (para Production, Preview y Development):
   
   ```
   VITE_SUPABASE_URL = https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY = tu-anon-key
   ```

5. **Deploy**
   - Click en "Deploy"
   - Espera 2-3 minutos
   - ¡Listo! Tu app estará en: `https://fx27.vercel.app`

---

## 🔄 PASO 4: CONFIGURAR AUTO-DEPLOYMENT

Una vez configurado, cada push a GitHub desplegará automáticamente:

```bash
# Hacer cambios en el código
git add .
git commit -m "Descripción del cambio"
git push

# Vercel detectará el push y desplegará automáticamente
```

---

## 💾 SISTEMA DE RESPALDO (SNAPSHOTS)

### Crear un Snapshot (Punto de Restauración):

#### Método 1: Git Tags (Recomendado)
```bash
# Crear tag con la versión actual
git tag -a v1.0-dashboard-completo -m "FX27 Dashboard completo - 11 módulos con efectos finales"

# Subir el tag a GitHub
git push origin v1.0-dashboard-completo

# Ver todos los tags
git tag -l
```

#### Método 2: Git Branch de Respaldo
```bash
# Crear branch de respaldo
git checkout -b backup/v1.0-dashboard-completo

# Subir branch de respaldo
git push origin backup/v1.0-dashboard-completo

# Volver a main
git checkout main
```

### Restaurar desde un Snapshot:

#### Restaurar desde Tag:
```bash
# Ver tags disponibles
git tag -l

# Restaurar a un tag específico
git checkout v1.0-dashboard-completo

# Crear nueva branch desde ese punto
git checkout -b restauracion-v1.0

# Si todo está bien, hacer merge a main
git checkout main
git merge restauracion-v1.0
git push
```

#### Restaurar desde Branch de Respaldo:
```bash
# Ver branches de respaldo
git branch -a

# Cambiar a la branch de respaldo
git checkout backup/v1.0-dashboard-completo

# Crear nueva branch desde ahí
git checkout -b restaurar-desde-backup

# Revisar que todo esté correcto y hacer merge
git checkout main
git merge restaurar-desde-backup
git push
```

---

## 🖼️ MANTENER IMÁGENES EXACTAS

### Las imágenes de Unsplash están hardcodeadas en el código:
- ✅ No se necesita configuración adicional
- ✅ Las URLs son permanentes
- ✅ Se cargan directamente desde Unsplash CDN

### Si necesitas cambiar una imagen:
1. Busca en el componente correspondiente (ej: `ServicioClientesModule.tsx`)
2. Reemplaza la URL de `headerImage`
3. Commit y push para deployment automático

---

## 📐 MANTENER TAMAÑOS Y ESTILOS EXACTOS

### Todos los estilos están en:
1. **`/styles/globals.css`** - Tokens de diseño, tipografías
2. **Componentes individuales** - Estilos inline con valores específicos

### Para preservar el diseño exacto:
- ✅ NO modificar `globals.css` sin respaldo
- ✅ Los tamaños están en píxeles exactos (no usar rem/em)
- ✅ Los efectos hover tienen valores específicos de shadow y blur

---

## 🎨 TIPOGRAFÍAS (CRÍTICO)

Las tipografías se cargan desde Google Fonts en `globals.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@100;200;300;400;500;600;700;800;900&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&display=swap');
```

- ✅ **EXO 2**: Textos generales
- ✅ **ORBITRON SemiBold**: Números y labels tech
- ✅ **EXO 2 Black**: Logo FX27

---

## 🔍 VERIFICACIÓN POST-DEPLOYMENT

### Checklist después de deployment:

- [ ] Logo FX27 visible en todas las pantallas (inamovible, z-50)
- [ ] Slogan "Future Experiencie 27" presente
- [ ] 11 módulos visibles (7 arriba, 4 abajo)
- [ ] Efectos hover funcionando (translate, shadows, glow)
- [ ] Glassmorphism en módulos (blur, opacity)
- [ ] Headers con imágenes contrastantes
- [ ] Franja azul en headers (bottom: 3%, opacity: 40%)
- [ ] Tipografías correctas (Exo 2, Orbitron)
- [ ] Login funcional (juan.viveros@trob.com.mx / Mexico86)
- [ ] Responsive en desktop (1440×900 y otras resoluciones)
- [ ] Sesión persistente (localStorage)

---

## 🆘 TROUBLESHOOTING

### Problema: "Imágenes no cargan en producción"
**Solución**: Las imágenes de Unsplash a veces tardan. Verifica la URL en el navegador.

### Problema: "Estilos diferentes en producción"
**Solución**: 
1. Verifica que `globals.css` esté siendo importado en `App.tsx`
2. Clear cache de Vercel: Settings > Data > Clear Cache

### Problema: "Tipografías no se ven"
**Solución**: 
1. Verifica conexión a Google Fonts
2. Revisa que `@import` esté al inicio de `globals.css`

### Problema: "Variables de entorno no funcionan"
**Solución**:
1. Verifica que empiecen con `VITE_`
2. Redeploy desde Vercel Dashboard
3. Revisa que estén en las 3 secciones (Production, Preview, Development)

---

## 📊 COMANDOS ÚTILES DE RESPALDO

### Crear snapshot rápido (tag):
```bash
git tag -a v1.0 -m "Snapshot del estado actual" && git push origin v1.0
```

### Ver diferencias con versión anterior:
```bash
git diff v1.0 v1.1
```

### Crear respaldo completo local:
```bash
# Copiar toda la carpeta del proyecto
cp -r /ruta/proyecto/fx27 /ruta/respaldos/fx27-backup-$(date +%Y%m%d)
```

---

## 🎯 PRÓXIMOS PASOS RECOMENDADOS

1. **Crear tag v1.0** inmediatamente
2. **Hacer primer deployment** a Vercel
3. **Verificar checklist** post-deployment
4. **Crear branch de desarrollo** para cambios futuros:
   ```bash
   git checkout -b desarrollo
   ```
5. **Mantener main limpio** solo para versiones estables

---

## 📝 NOTAS IMPORTANTES

- **NUNCA** hacer `git push --force` en main
- **SIEMPRE** crear tag antes de cambios grandes
- **VERIFICAR** en preview antes de merge a main
- **DOCUMENTAR** cada cambio importante en commits
- **MANTENER** este archivo actualizado con cada versión

---

**Última actualización**: 7 Nov 2025  
**Versión del documento**: 1.0  
**Autor**: FX27 Development Team
