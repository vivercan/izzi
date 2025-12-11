# 🌦️ MAPA CLIMÁTICO - INSTRUCCIONES DE CONFIGURACIÓN

## ⚠️ IMPORTANTE: Usar OpenWeatherMap, NO Google Weather API

La **Google Weather API** que ves en tu imagen de Google Cloud Console **NO funciona** para capas meteorológicas overlay en mapas.

**Solución correcta:** Usar **Open WeatherMap Maps API** que es **GRATUITA** y está diseñada específicamente para mostrar capas meteorológicas sobre Google Maps.

---

## 🔧 CONFIGURACIÓN PASO A PASO

### **PASO 1: Obtener API Key de OpenWeatherMap** (GRATIS)

1. Ve a: https://openweathermap.org/
2. Haz clic en **"Sign Up"** (arriba derecha)
3. Completa el formulario:
   - Email
   - Username
   - Password
   - Acepta términos
4. **Verifica tu email**
5. Inicia sesión en: https://home.openweathermap.org/
6. Ve a **"API keys"** (menú izquierdo)
7. Copia tu **API Key** (o crea una nueva con nombre "FX27-Mapa-Climatico")

### **PASO 2: Configurar la API Key en Supabase**

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard
2. Ve a: **Project Settings → Edge Functions → Environment Variables**
3. Agrega una nueva variable:
   ```
   Nombre: OPENWEATHER_API_KEY
   Valor: [TU_API_KEY_DE_OPENWEATHERMAP]
   ```
4. Haz clic en **"Save"**

### **PASO 3: Crear endpoint en el servidor**

Agrega este código en `/supabase/functions/server/index.tsx`:

```typescript
// Endpoint para obtener OpenWeather API Key
app.get("/make-server-d84b50bb/api-keys/openweather", (c) => {
  const apiKey = Deno.env.get('OPENWEATHER_API_KEY') || '';
  return c.json({ apiKey });
});
```

---

## 📊 CAPAS METEOROLÓGICAS DISPONIBLES

El mapa climático muestra 5 capas meteorológicas en tiempo real:

| Capa | Descripción | Datos que Muestra |
|------|-------------|-------------------|
| 🌡️ **Temperatura** | Temperatura actual | -10°C a 40°C (colores: azul → verde → rojo) |
| 🌧️ **Precipitación** | Lluvia, nieve, granizo | Intensidad de precipitación (azul claro → azul oscuro) |
| ☁️ **Nubosidad** | Cobertura de nubes | Porcentaje de nubes (transparente → blanco) |
| 💨 **Viento** | Velocidad y dirección | Flechas indican dirección, color indica velocidad |
| 🌫️ **Presión** | Presión atmosférica | Zonas de alta/baja presión (colores) |

---

## 🎯 CÓMO USAR EL MAPA CLIMÁTICO

### **Opción 1: Abrir desde un botón**

Agrega esto en tu componente:

```tsx
import { MapaClimaticoCarroll } from './components/fx27/MapaClimaticoCarroll';
import { useState } from 'react';

// En tu componente:
const [mostrarMapa, setMostrarMapa] = useState(false);

// En tu JSX:
<button onClick={() => setMostrarMapa(true)}>
  🌦️ Ver Mapa Climático
</button>

{mostrarMapa && (
  <MapaClimaticoCarroll 
    onClose={() => setMostrarMapa(false)}
    unidades={[
      { tracto: '785', lat: 19.3419, lng: -97.6664, operador: 'LUIS ÁNGEL' },
      { tracto: '765', lat: 20.5888, lng: -100.3899, operador: 'MARCELO' },
      // ... más unidades
    ]}
  />
)}
```

### **Opción 2: En el DedicadosHub**

Agrega un botón flotante:

```tsx
// En DedicadosHub.tsx
<button
  onClick={() => /* abrir mapa */}
  className="fixed bottom-8 right-8 z-20"
  style={{
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)',
    boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)'
  }}
>
  <Cloud className="w-7 h-7 text-white" />
</button>
```

---

## 🔍 EJEMPLO DE FUNCIONAMIENTO

```
USUARIO:
1. Abre el mapa climático
2. Ve México con todos los tractocamiones marcados
3. Selecciona capa "Precipitación"

RESULTADO:
- El mapa ahora muestra zonas con lluvia en tiempo real
- Tractocamión #785 (Querétaro) está en zona de lluvia moderada (azul oscuro)
- Tractocamión #765 (CDMX) está sin lluvia (sin color)
- El operador puede ver condiciones climáticas antes de planear rutas
```

---

## 🚨 IMPORTANTE: LÍMITES Y COSTOS

### **OpenWeatherMap - Plan GRATIS:**

- ✅ **60 llamadas por minuto**
- ✅ **1,000,000 llamadas por mes**
- ✅ **Totalmente GRATUITO** para siempre
- ✅ No requiere tarjeta de crédito

### **Cómo funciona:**

El mapa usa "tiles" (mosaicos de 256x256 px). Cuando el usuario ve el mapa:
- Cada tile visible = 1 llamada a la API
- Aproximadamente 20-30 tiles visibles a la vez
- Cambiar de capa = otra serie de tiles

**Estimación de uso:**
- 1 usuario viendo el mapa por 5 minutos = ~100-150 llamadas
- Con límite de 1,000,000/mes puedes tener:
  - 6,666 sesiones de mapa de 5 minutos
  - ≈ 220 sesiones diarias

**Conclusión:** Más que suficiente para un sistema de 30 unidades.

---

## 📝 DIFERENCIA: Google Weather API vs OpenWeatherMap

| Característica | Google Weather API | OpenWeatherMap Maps |
|----------------|--------------------|--------------------|
| **Tipo** | API de datos JSON | **Overlay de mapas (lo que necesitas)** |
| **Uso** | Para obtener clima de un punto específico | **Para mostrar capas visuales en mapas** |
| **Formato** | JSON con temperatura, humedad, etc. | **Imágenes PNG overlay** |
| **Integración con Google Maps** | ❌ No diseñado para overlay | ✅ Diseñado específicamente para esto |
| **Costo** | $1.50 por 1,000 llamadas | ✅ **GRATIS** (1M llamadas/mes) |

---

## 🎨 PERSONALIZACIÓN DEL MAPA

### **Cambiar opacidad de capas:**

En `MapaClimaticoCarroll.tsx`, línea ~210:

```typescript
const nuevaCapaWeather = new google.maps.ImageMapType({
  // ... código existente ...
  opacity: 0.6,  // Cambia esto: 0.0 (invisible) a 1.0 (opaco)
  // ... código existente ...
});
```

### **Cambiar centro inicial del mapa:**

```typescript
const centro = { lat: 19.3419, lng: -97.6664 };  // Granjas Carroll
// Cambiar a:
const centro = { lat: 19.4326, lng: -99.1332 };  // CDMX
```

### **Cambiar zoom inicial:**

```typescript
zoom: 6,  // 6 = México completo, 10 = Estado, 15 = Ciudad
```

---

## 🐛 TROUBLESHOOTING

### **Problema: "Las capas no se muestran"**

**Solución:**
1. Verifica que tengas la API Key de **OpenWeatherMap** (no Google)
2. Verifica que la key esté en Supabase como `OPENWEATHER_API_KEY`
3. Abre la consola del navegador (F12) y busca errores
4. Verifica que el endpoint `/api-keys/openweather` exista en tu servidor

### **Problema: "El mapa no carga"**

**Solución:**
1. Verifica que la Google Maps API Key siga funcionando
2. Verifica que el script de Google Maps se cargue (Network tab en F12)
3. Confirma que no haya errores de CORS

### **Problema: "No veo ninguna unidad en el mapa"**

**Solución:**
1. Asegúrate de pasar el array `unidades` al componente con coordenadas válidas
2. Verifica que las coordenadas estén en el rango correcto:
   - lat: -90 a 90
   - lng: -180 a 180

---

## 📚 RECURSOS ADICIONALES

- **OpenWeatherMap Docs:** https://openweathermap.org/api/weathermaps
- **Tipos de Capas:** https://openweathermap.org/api/weather-map-layers
- **Google Maps Overlay:** https://developers.google.com/maps/documentation/javascript/maptypes#ImageMapTypes

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [ ] Crear cuenta en OpenWeatherMap
- [ ] Obtener API Key de OpenWeatherMap
- [ ] Agregar `OPENWEATHER_API_KEY` a Supabase
- [ ] Crear endpoint `/api-keys/openweather` en servidor
- [ ] Importar `MapaClimaticoCarroll` en tu componente
- [ ] Agregar botón para abrir el mapa
- [ ] Probar cada capa meteorológica
- [ ] Verificar que los marcadores de unidades se muestren

---

**Última actualización:** 21 Nov 2025  
**Versión:** 1.0.0  
**Proyecto:** FX27 - Sistema CRM Granjas Carroll
