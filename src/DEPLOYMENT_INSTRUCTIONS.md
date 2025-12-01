# 🚀 FX27 - Instrucciones de Deployment

## ✅ Configuración Correcta (No Modificar)

### Archivos Clave que NUNCA debes editar manualmente:

1. **vite.config.ts** - Configuración de build con `outDir: 'dist'`
2. **vercel.json** - Configuración de Vercel con `outputDirectory: "dist"`
3. **postcss.config.js** - Configuración de Tailwind CSS v4
4. **tsconfig.json** - Configuración de TypeScript
5. **styles/globals.css** - Estilos globales con Tailwind v4

## 📋 Proceso de Deployment en Vercel

### Cuando hagas cambios:

```bash
# 1. Agregar todos los archivos
git add .

# 2. Crear commit
git commit -m "Tu mensaje descriptivo"

# 3. Subir a GitHub
git push origin main
```

### Vercel automáticamente:
- Detectará el push a GitHub
- Ejecutará `npm run build`
- Desplegará desde la carpeta `dist`

## ⚠️ Si el sitio se ve "descuadrado":

Esto puede suceder si se modifican estos archivos críticos. La solución es:

1. **NO** crear un nuevo `vite.config.ts` desde cero
2. **NO** modificar la sintaxis de Tailwind en `globals.css`
3. **RESTAURAR** los archivos a la versión correcta de este commit

## 🔧 Comandos Útiles

```bash
# Ver el build localmente antes de deployar
npm run build
npm run preview

# Desarrollo local
npm run dev
```

## 📊 Checklist de Deployment

- [ ] Todos los archivos están en Git
- [ ] El commit tiene un mensaje descriptivo
- [ ] Se hizo push a GitHub (rama main)
- [ ] Vercel detectó el cambio automáticamente
- [ ] El build completó sin errores
- [ ] El sitio se ve correctamente en producción

## 🆘 Troubleshooting

### Problema: "Sitio descuadrado después del deployment"
**Causa:** Archivos de configuración modificados incorrectamente
**Solución:** Restaurar `vite.config.ts` y `styles/globals.css` de este commit

### Problema: "Build falla en Vercel"
**Causa:** Dependencias faltantes o conflictos
**Solución:** Verificar que `package.json` tenga todas las dependencias

### Problema: "Estilos no se cargan"
**Causa:** Tailwind CSS no se está compilando
**Solución:** Verificar que `postcss.config.js` esté correcto

---

**Última actualización:** Configuración optimizada para Tailwind CSS v4 + Vite
**Deployment:** Vercel automático desde GitHub (vivercan/izzi)
**URL:** https://www.jjcrm27.com
