# ⚡ SINCRONIZACIÓN RÁPIDA - FIGMA MAKE → GITHUB

## 🎯 OBJETIVO
Copiar los 4 archivos modificados de Figma Make a tu repositorio local y hacer push a GitHub.

## 📁 ARCHIVOS A COPIAR

| # | Archivo en Figma Make | Destino en Repositorio Local | Líneas |
|---|----------------------|------------------------------|--------|
| 1 | `/supabase/functions/server/index.tsx` | `C:\Users\timon\Documents\Chabelita\supabase\functions\server\index.tsx` | 2,257 |
| 2 | `/components/fx27/DedicadosModuleWideTech.tsx` | `C:\Users\timon\Documents\Chabelita\src\components\fx27\DedicadosModuleWideTech.tsx` | ~1,100 |
| 3 | `/components/fx27/AdminCarrollModule.tsx` | `C:\Users\timon\Documents\Chabelita\src\components\fx27\AdminCarrollModule.tsx` | ~800 |
| 4 | `/components/fx27/AdministracionCarroll.tsx` | `C:\Users\timon\Documents\Chabelita\src\components\fx27\AdministracionCarroll.tsx` | ~650 |

## 🚀 MÉTODO 1: Descarga desde Figma Make (RECOMENDADO)

### Paso 1: Descargar el proyecto completo
1. En Figma Make, click en el botón **"Export"** o **"Download"**
2. Se descargará un `.zip` con toda la estructura del proyecto
3. Extrae el `.zip` en una carpeta temporal, por ejemplo: `C:\Users\timon\Downloads\FigmaMake-Export\`

### Paso 2: Copiar archivos con PowerShell

\`\`\`powershell
# Define rutas
$origen = "C:\Users\timon\Downloads\FigmaMake-Export"  # Ajusta según tu descarga
$destino = "C:\Users\timon\Documents\Chabelita"

# Copia backend (SIN src/)
Copy-Item "$origen\supabase\functions\server\index.tsx" -Destination "$destino\supabase\functions\server\index.tsx" -Force

# Copia componentes frontend (CON src/)
Copy-Item "$origen\components\fx27\DedicadosModuleWideTech.tsx" -Destination "$destino\src\components\fx27\DedicadosModuleWideTech.tsx" -Force
Copy-Item "$origen\components\fx27\AdminCarrollModule.tsx" -Destination "$destino\src\components\fx27\AdminCarrollModule.tsx" -Force
Copy-Item "$origen\components\fx27\AdministracionCarroll.tsx" -Destination "$destino\src\components\fx27\AdministracionCarroll.tsx" -Force

Write-Host "✅ Archivos copiados exitosamente!" -ForegroundColor Green
\`\`\`

### Paso 3: Verificar cambios

\`\`\`powershell
cd C:\Users\timon\Documents\Chabelita
git status
\`\`\`

Deberías ver algo como:

\`\`\`
modified:   supabase/functions/server/index.tsx
modified:   src/components/fx27/AdminCarrollModule.tsx
modified:   src/components/fx27/AdministracionCarroll.tsx
modified:   src/components/fx27/DedicadosModuleWideTech.tsx
\`\`\`

### Paso 4: Commit y Push

\`\`\`powershell
# Agregar cambios
git add supabase/functions/server/index.tsx
git add src/components/fx27/AdminCarrollModule.tsx
git add src/components/fx27/AdministracionCarroll.tsx
git add src/components/fx27/DedicadosModuleWideTech.tsx

# Commit
git commit -m "feat(carroll): Sistema de geocercas inteligentes + 31 unidades editables

✨ Nuevas funcionalidades:
- Backend: Endpoints REST para unidades y geocercas Carroll
- Monitor: Integración GPS WideTech con detección automática de CEDIS
- Admin: Panel de gestión completa de 31 tractocamiones
- Geocercas: 30 ubicaciones predefinidas (Walmart, Soriana, HEB, etc.)
- Caché: Sistema de 40 segundos para evitar error 109 API WideTech

🚚 Módulo #12 Dedicados - Granjas Carroll
📍 Oriental, Puebla → Cárnicos refrigerados/congelados
⚡ Diseñado para desktop 1440×900 ultra compacto"

# Push a GitHub
git push origin main

Write-Host "`n🎉 ¡PUSH COMPLETADO!" -ForegroundColor Cyan
Write-Host "El auto-deploy se activará en www.jjcrm27.com" -ForegroundColor Yellow
\`\`\`

## 🚀 MÉTODO 2: Copia Manual por Archivo

Si no puedes descargar el proyecto completo, copia cada archivo individualmente:

### 1. Backend (`index.tsx`)
\`\`\`powershell
# En Figma Make: Selecciona todo el contenido de /supabase/functions/server/index.tsx
# Copia al portapapeles (Ctrl+A, Ctrl+C)

# Luego en PowerShell:
notepad "C:\Users\timon\Documents\Chabelita\supabase\functions\server\index.tsx"
# Pega el contenido (Ctrl+V) y guarda (Ctrl+S)
\`\`\`

### 2. Monitor Carroll
\`\`\`powershell
notepad "C:\Users\timon\Documents\Chabelita\src\components\fx27\DedicadosModuleWideTech.tsx"
# Copia desde Figma Make → Pega aquí → Guarda
\`\`\`

### 3. Admin Carroll
\`\`\`powershell
notepad "C:\Users\timon\Documents\Chabelita\src\components\fx27\AdminCarrollModule.tsx"
# Copia desde Figma Make → Pega aquí → Guarda
\`\`\`

### 4. Administración Carroll
\`\`\`powershell
notepad "C:\Users\timon\Documents\Chabelita\src\components\fx27\AdministracionCarroll.tsx"
# Copia desde Figma Make → Pega aquí → Guarda
\`\`\`

Luego ejecuta el **Paso 3 y 4** del Método 1.

## ⚠️ IMPORTANTE: Diferencia de Rutas

**Figma Make NO usa carpeta `src/` para componentes**  
**Tu repositorio SÍ usa carpeta `src/` para componentes**

| Figma Make | GitHub Repo |
|------------|-------------|
| `/components/fx27/...` | `/src/components/fx27/...` |
| `/supabase/...` | `/supabase/...` ✅ (igual) |

## ✅ VERIFICACIÓN POST-DEPLOYMENT

### 1. Verificar que el deployment terminó
\`\`\`powershell
# Espera 2-3 minutos para que GitHub Actions termine
Start-Sleep -Seconds 180

# Abre el sitio
Start-Process "https://www.jjcrm27.com"
\`\`\`

### 2. Probar el sistema Carroll
1. Login en www.jjcrm27.com
2. Dashboard → **Dedicados**
3. Selecciona **"Monitor Carroll (Desarrollo)"**
4. Verifica:
   - ✅ Se muestran 31 unidades
   - ✅ Aparecen ubicaciones GPS de WideTech
   - ✅ Se detectan geocercas (ej: "CEDIS Walmart Monterrey")
   - ✅ Mini-KPIs funcionan (Alertas, Entregas, Registros)

### 3. Probar el panel de administración
1. Desde Dedicados, selecciona **"Administración Carroll (Operaciones)"**
2. Verifica:
   - ✅ Tabla con 31 tractocamiones
   - ✅ Botones de editar/eliminar funcionan
   - ✅ Se pueden agregar nuevas unidades
   - ✅ Semáforos de mantenimiento actualizan

## 🔧 TROUBLESHOOTING

### Error: "La carpeta src no existe"
\`\`\`powershell
# Verificar estructura
ls C:\Users\timon\Documents\Chabelita\src\components\fx27\
\`\`\`

Si no existe, crea la estructura:
\`\`\`powershell
mkdir C:\Users\timon\Documents\Chabelita\src\components\fx27\ -Force
\`\`\`

### Error: "git push rejected"
\`\`\`powershell
# Pull primero
git pull origin main

# Resuelve conflictos si los hay
git status

# Intenta push de nuevo
git push origin main
\`\`\`

### Error: "Cannot find module '@supabase/supabase-js'"
El proyecto usa Deno en el backend, no Node. Asegúrate que el archivo `index.tsx` tenga:
\`\`\`typescript
import { createClient } from "npm:@supabase/supabase-js@2.39.0";
\`\`\`

## 📊 RESUMEN DE CAMBIOS

| Componente | Cambio Principal |
|-----------|------------------|
| **Backend** | +230 líneas de endpoints Carroll (unidades + geocercas) |
| **DedicadosModuleWideTech** | Integración GPS WideTech + detección automática de CEDIS |
| **AdminCarrollModule** | Panel de gestión de 31 tractocamiones con CRUD completo |
| **AdministracionCarroll** | Hub de administración con 3 vistas (Admin/Monitor/Clientes) |

## 🎯 PRÓXIMOS PASOS

Una vez que el push esté completo:

1. ✅ Monitorear logs de deployment
2. ✅ Probar funcionalidades en producción
3. ✅ Validar que las geocercas detecten correctamente
4. ✅ Verificar que el caché de WideTech funcione (40 segundos)
5. ✅ Crear backup de la configuración actual

---

**Fecha**: 25 de noviembre de 2025  
**Proyecto**: FX27 CRM - Módulo Dedicados  
**Cliente**: Granjas Carroll de México  
**Unidades**: 31 tractocamiones  
**Geocercas**: 30 ubicaciones predefinidas
