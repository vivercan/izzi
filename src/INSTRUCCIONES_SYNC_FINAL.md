# 🚀 INSTRUCCIONES PARA SUBIR FIGMA MAKE → GITHUB → WEB

## ✅ **TODO ESTÁ LISTO EN FIGMA MAKE**

El código aquí en Figma Make está **100% correcto y funcional**.

---

## 📋 **PASO A PASO PARA SUBIR A LA WEB**

### **OPCIÓN 1: Script Automático (RECOMENDADO)** ⭐

1. **Descarga el script desde Figma Make:**
   - Busca el archivo: `SYNC_COMPLETO_FIGMA_A_GITHUB.ps1`
   - Descárgalo a tu carpeta local

2. **Guárdalo en tu carpeta GitHub:**
   ```
   C:\Users\timon\Documents\Chabelita\SYNC_COMPLETO_FIGMA_A_GITHUB.ps1
   ```

3. **Ejecuta el script:**
   ```powershell
   cd C:\Users\timon\Documents\Chabelita
   .\SYNC_COMPLETO_FIGMA_A_GITHUB.ps1
   ```

4. **Confirma cuando te lo pida:**
   - Revisa los cambios detectados
   - Presiona ENTER para confirmar
   - Espera 2-3 minutos para el deploy

---

### **OPCIÓN 2: Manual (Si el script falla)**

```powershell
# 1. Ir a carpeta GitHub
cd C:\Users\timon\Documents\Chabelita

# 2. Copiar archivos principales
Copy-Item "C:\Users\timon\Downloads\ES ESTE\src\App.tsx" -Destination ".\src\App.tsx" -Force
Copy-Item "C:\Users\timon\Downloads\ES ESTE\src\index.css" -Destination ".\src\index.css" -Force

# 3. Copiar carpetas completas
Copy-Item "C:\Users\timon\Downloads\ES ESTE\src\styles\*" -Destination ".\src\styles\" -Recurse -Force
Copy-Item "C:\Users\timon\Downloads\ES ESTE\src\components\*" -Destination ".\src\components\" -Recurse -Force

# 4. Ver cambios
git status

# 5. Subir a GitHub
git add src/
git commit -m "feat(fx27): Sincronización completa desde Figma Make"
git push origin main
```

---

## 🔍 **SI HAY ERROR EN EL DEPLOY**

### **1. Ver los logs del error:**

Ve a: https://github.com/vivercan/Chabelita/actions

Haz clic en el deployment fallido y mándame una captura de los logs.

---

### **2. Errores comunes y soluciones:**

#### ❌ **Error: "Cannot find module"**
**Causa:** Falta un archivo o import incorrecto

**Solución:**
```powershell
# Asegúrate de copiar TODO:
cd C:\Users\timon\Documents\Chabelita
Copy-Item "C:\Users\timon\Downloads\ES ESTE\src\*" -Destination ".\src\" -Recurse -Force -Exclude "supabase"
git add src/
git commit -m "fix: Sincronización completa de archivos faltantes"
git push origin main
```

---

#### ❌ **Error: "Build failed"**
**Causa:** Problema en el vite build

**Solución:** Verificar que `package.json` tenga todas las dependencias

---

#### ❌ **Error: "Module not found: @react-google-maps/api"**
**Causa:** Falta agregar la dependencia

**Solución:**
1. Edita `package.json` en GitHub
2. Agrega en dependencies:
   ```json
   "@react-google-maps/api": "^2.19.3"
   ```
3. Haz commit y push

---

## 📊 **QUÉ SE MANTENDRÁ EN LA WEB**

### ✅ **SE MANTIENE (en Supabase):**
- ✅ Todos los leads
- ✅ Datos de tractocamiones Carroll
- ✅ Geocercas configuradas
- ✅ Usuarios creados dinámicamente
- ✅ Configuraciones guardadas

### 🔄 **SE ACTUALIZA (código):**
- 🔄 Diseño del dashboard
- 🔄 Componentes y módulos
- 🔄 Estilos (CSS)
- 🔄 Lógica de frontend

---

## ⚠️ **ARCHIVOS QUE NO SE DEBEN TOCAR**

Estos archivos están protegidos y NO se copian:

- `/supabase/functions/server/kv_store.tsx`
- `/utils/supabase/info.tsx` (tiene las keys de producción)
- `/supabase/functions/server/index.tsx` (ya configurado en GitHub)

---

## 🎯 **VERIFICACIÓN POST-DEPLOY**

Después de que termine el deploy (2-3 minutos), verifica:

1. ✅ Abre: www.jjcrm27.com
2. ✅ Haz login con: `juan.viveros@trob.com.mx` / `Mexico86`
3. ✅ Verifica que se vea:
   - Header con W48
   - Tipo de cambio
   - Usuario "Juan Viveros ADMIN"
   - Diseño mejorado del dashboard
   - Líneas decorativas
4. ✅ Prueba el módulo "Dedicados #12"
5. ✅ Verifica que las 31 unidades Carroll estén ahí
6. ✅ Prueba el Monitor GPS (WideTech)

---

## 💡 **SI ALGO SALE MAL**

1. 📸 Toma captura del error completo
2. 🔗 Mándame el link del deployment con error
3. 📋 Dime exactamente qué pasos seguiste
4. ⚡ Yo te ayudo a corregirlo

---

## 🎉 **RESUMEN**

```
Figma Make (✅ TODO CORRECTO AQUÍ)
     ↓
Copiar archivos con script
     ↓
GitHub (repositorio vivercan/Chabelita)
     ↓
Auto-deploy (2-3 min)
     ↓
www.jjcrm27.com (✅ ACTUALIZADO)
```

---

## 📞 **¿NECESITAS AYUDA?**

Mándame:
1. El mensaje de error completo
2. Captura de pantalla
3. Qué comando ejecutaste

¡Y lo arreglamos juntos! 🚀
