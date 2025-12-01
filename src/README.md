# 🚀 FX27 - Future Experiencie 27

Sistema de gestión para transporte de carga con interfaz moderna y efectos visuales avanzados.

![FX27 Version](https://img.shields.io/badge/version-1.0-blue)
![Status](https://img.shields.io/badge/status-production-success)

---

## 📋 ÍNDICE

- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Inicio Rápido](#-inicio-rápido)
- [Deployment](#-deployment)
- [Documentación](#-documentación)
- [Credenciales](#-credenciales)
- [Estructura](#-estructura)

---

## ✨ CARACTERÍSTICAS

### Módulos del Sistema (11 totales):

#### Fila Superior (7 módulos):
1. **Agregar Lead** - Gestión de prospectos
2. **Panel de Oportunidades** - Seguimiento de ventas
3. **Operaciones** - Control operativo
4. **Despacho Inteligente** - Asignación automatizada
5. **Control de Equipo** - Gestión de flotilla
6. **KPIs** - Métricas de rendimiento
7. **Configuración** - Ajustes del sistema

#### Fila Inferior (4 módulos):
8. **Cotizaciones** - Generación de presupuestos
9. **Ventas** - Gestión comercial
10. **Utilerías** - Herramientas auxiliares
11. **Servicio A Clientes** - Atención al cliente

### Características Visuales:

✅ **Glassmorphism** - Efectos de vidrio translúcido  
✅ **Efectos Hover Dramáticos** - Shadows, glows, transforms  
✅ **Headers con Imágenes** - Fotografías tecnológicas contrastantes  
✅ **Franja Azul Primary** - Overlay con 40% opacity (bottom: 3%)  
✅ **Logo FX27 Inamovible** - Marca de agua en todas las pantallas  
✅ **Tipografías Personalizadas** - Exo 2, Orbitron, Exo 2 Black  
✅ **Responsive Design** - Optimizado para desktop (1440×900+)  

### Características Funcionales:

✅ **Sistema de Autenticación** - Login con validación  
✅ **Roles de Usuario** - Admin y Operaciones  
✅ **Persistencia de Sesión** - localStorage  
✅ **Navegación Fluida** - Entre módulos  

---

## 🛠️ TECNOLOGÍAS

- **React 18** - Framework frontend
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **Tailwind CSS 4.0** - Estilos y diseño
- **Lucide React** - Iconografía
- **Shadcn/ui** - Componentes UI
- **Supabase** - Backend (Auth, Database, Storage)
- **Vercel** - Hosting y deployment

---

## 🚀 INICIO RÁPIDO

### Prerrequisitos:
- Node.js 18+ instalado
- npm o yarn
- Git

### Instalación Local:

```bash
# 1. Clonar repositorio
git clone https://github.com/TU-USUARIO/fx27.git
cd fx27

# 2. Instalar dependencias
npm install

# 3. Crear archivo de variables de entorno
cp .env.example .env.local

# 4. Editar .env.local con tus credenciales de Supabase:
# VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
# VITE_SUPABASE_ANON_KEY=tu-anon-key

# 5. Correr en desarrollo
npm run dev

# 6. Abrir en navegador
# http://localhost:5173
```

---

## 🌐 DEPLOYMENT

### GitHub + Vercel (Recomendado):

1. **Subir a GitHub**:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy en Vercel**:
   - Ir a https://vercel.com/new
   - Import repository "fx27"
   - Agregar variables de entorno:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
   - Click "Deploy"

3. **Done!** Tu app estará en:
   ```
   https://fx27.vercel.app
   ```

**Documentación completa**: Ver [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 📚 DOCUMENTACIÓN

| Documento | Descripción |
|-----------|-------------|
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Guía completa de deployment |
| [RESPALDOS.md](./RESPALDOS.md) | Sistema de snapshots y restauración |
| [COMANDOS-RAPIDOS.md](./COMANDOS-RAPIDOS.md) | Comandos para copiar/pegar |

---

## 🔐 CREDENCIALES

### Usuario Administrador:
```
Email: juan.viveros@trob.com.mx
Password: Mexico86
Rol: Admin (acceso completo a todos los módulos)
```

### Usuario Operaciones (ejemplo):
```
Email: operaciones@trob.com.mx
Password: Mexico86
Rol: Operations (acceso solo a Operaciones y Ventas)
```

---

## 📁 ESTRUCTURA DEL PROYECTO

```
fx27/
├── public/                    # Archivos estáticos
├── src/
│   ├── components/
│   │   ├── fx27/             # Componentes del sistema FX27
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── DashboardScreen.tsx
│   │   │   ├── ModuleTemplate.tsx
│   │   │   ├── AgregarLeadModule.tsx
│   │   │   ├── PanelOportunidadesModule.tsx
│   │   │   ├── DespachoInteligenteModule.tsx
│   │   │   ├── ControlEquipoModule.tsx
│   │   │   ├── KPIsModule.tsx
│   │   │   ├── ConfiguracionModule.tsx
│   │   │   ├── CotizacionesModule.tsx
│   │   │   ├── VentasModule.tsx
│   │   │   ├── UtileriasModule.tsx
│   │   │   └── ServicioClientesModule.tsx
│   │   └── ui/               # Componentes Shadcn/ui
│   ├── styles/
│   │   └── globals.css       # Estilos globales y tokens
│   ├── App.tsx               # Componente principal
│   └── main.tsx              # Entry point
├── .env.example              # Template de variables de entorno
├── .gitignore                # Archivos ignorados por Git
├── vercel.json               # Configuración de Vercel
├── package.json              # Dependencias
├── DEPLOYMENT.md             # Guía de deployment
├── RESPALDOS.md              # Sistema de respaldos
├── COMANDOS-RAPIDOS.md       # Comandos útiles
└── README.md                 # Este archivo
```

---

## 🎨 DESIGN SYSTEM

### Colores:
```css
--fx-primary: #1E66F5     /* Azul principal */
--fx-bg: #0B1220          /* Fondo oscuro */
--fx-surface: #0F172A     /* Superficies */
--fx-text: #FFFFFF        /* Texto principal */
--fx-muted: #94A3B8       /* Texto secundario */
```

### Tipografías:
- **Exo 2** - Textos generales
- **Orbitron SemiBold** - Números y labels tech
- **Exo 2 Black** - Logo FX27

### Espaciados:
8px, 12px, 16px, 24px, 32px

### Border Radius:
12px, 16px

---

## 🔄 WORKFLOW DE DESARROLLO

### Crear Snapshot Antes de Cambios:
```bash
git add . && git commit -m "Estado estable" && git tag -a v1.1 -m "Snapshot" && git push && git push origin v1.1
```

### Hacer Cambios:
```bash
# 1. Editar código
# 2. Probar local
npm run dev

# 3. Subir cambios
git add .
git commit -m "Descripción de cambios"
git push
```

### Restaurar si Algo Sale Mal:
```bash
git tag -l                              # Ver snapshots
git reset --hard v1.0-dashboard-completo  # Restaurar
```

---

## 🐛 TROUBLESHOOTING

### Imágenes no cargan:
- Verificar conexión a internet (se cargan desde Unsplash CDN)
- Hard refresh: Ctrl+Shift+R (Windows) o Cmd+Shift+R (Mac)

### Estilos diferentes en producción:
- Verificar que `globals.css` esté importado en `App.tsx`
- Clear cache en Vercel: Settings > Data > Clear Cache

### Login no funciona:
- Verificar credenciales: juan.viveros@trob.com.mx / Mexico86
- Revisar consola del navegador para errores

### Variables de entorno no funcionan:
- Verificar que empiecen con `VITE_`
- Redeploy en Vercel después de agregar variables
- Reiniciar dev server local: Ctrl+C, luego `npm run dev`

---

## 📊 ESTADO DEL PROYECTO

| Componente | Estado | Notas |
|------------|--------|-------|
| Login | ✅ Completo | Con validación y persistencia |
| Dashboard | ✅ Completo | 11 módulos, efectos finales |
| Agregar Lead | ✅ Completo | Con header y efectos |
| Panel Oportunidades | ✅ Completo | Con header y efectos |
| Despacho Inteligente | ✅ Completo | Con header y efectos |
| Control Equipo | ✅ Completo | Con header y efectos |
| KPIs | ✅ Completo | Con header y efectos |
| Configuración | ✅ Completo | Con header y efectos |
| Cotizaciones | ✅ Completo | Con header y efectos |
| Ventas | ✅ Completo | Con header y efectos |
| Utilerías | ✅ Completo | Con header y efectos |
| Servicio A Clientes | ✅ Completo | Con header y efectos |

---

## 🎯 PRÓXIMOS PASOS SUGERIDOS

- [ ] Implementar contenido funcional en módulos
- [ ] Integrar API de transporte
- [ ] Agregar gráficos en módulo KPIs
- [ ] Implementar CRUD en módulos
- [ ] Agregar notificaciones en tiempo real
- [ ] Mobile responsive (si es necesario)

---

## 👥 CONTRIBUCIÓN

Para contribuir al proyecto:

1. Fork el repositorio
2. Crear branch: `git checkout -b feature/nueva-feature`
3. Commit cambios: `git commit -m 'Agregar nueva feature'`
4. Push: `git push origin feature/nueva-feature`
5. Crear Pull Request

---

## 📄 LICENCIA

Este proyecto es privado y confidencial.

---

## 📞 SOPORTE

Para soporte o preguntas:
- Email: juan.viveros@trob.com.mx
- Documentación: Ver archivos .md en el proyecto

---

## 🎉 AGRADECIMIENTOS

Desarrollado con ❤️ para el sector de transporte de carga.

**FX27 - Future Experiencie 27**

---

**Última actualización**: 7 Noviembre 2025  
**Versión**: 1.0  
**Status**: Production Ready
