# 🗺️ SISTEMA DE UBICACIONES INTELIGENTES - FX27

## 📋 Descripción General

Sistema avanzado de geolocalización que detecta automáticamente cuando un tractocamión está en ubicaciones conocidas (clientes) o muestra información detallada de ubicaciones genéricas.

---

## 🎯 Características Principales

### ✅ **Detección Automática de Clientes**

| Tipo de Ubicación | Radio | Comportamiento |
|-------------------|-------|----------------|
| 🏭 **Granjas Carroll** | 500m | Prioridad máxima - Siempre detecta origen |
| 📍 **Clientes Conocidos** | 100m | Detecta 71 destinos del catálogo de formatos |
| 🌍 **Ubicación Genérica** | - | Muestra Municipio, Estado + referencia |

### ✅ **Información Mostrada**

#### **Cuando está en cliente conocido:**
```
🏭 NOMBRE CLIENTE
   Municipio, Estado
```

Ejemplo:
```
🏭 Granjas Carroll
   Oriental, Puebla
```

#### **Cuando NO está en cliente conocido:**
```
📍 Municipio, Estado
   (Colonia o Calle adicional)
```

Ejemplo:
```
📍 Querétaro, Querétaro
   (Centro Histórico)
```

---

## 🛠️ Archivos Creados

### 1. **`/utils/ubicacion-inteligente.ts`**
Funciones principales del sistema:

- `calcularDistancia(coord1, coord2)` - Fórmula de Haversine (metros)
- `estaEnGranjasCarroll(coord)` - Verifica radio de 500m
- `clienteCercano(coord, clientes)` - Busca cliente en radio de 100m
- `extraerCoordenadasDeUrl(url)` - Parsea URLs de Google Maps
- `obtenerClientesConocidos()` - Obtiene catálogo desde Supabase (con caché de 5 min)
- `obtenerDireccionDetallada(coord)` - Geocodificación inversa completa
- `formatearUbicacion(ubicacion)` - Formatea para UI

### 2. **`/components/fx27/UbicacionInteligenteCompacta.tsx`**
Componente visual ultra compacto para tablas:

**Props:**
```typescript
interface UbicacionInteligenteCompactaProps {
  lat: number;                // Latitud GPS
  lng: number;                // Longitud GPS
  mostrarCompleto?: boolean;  // Tooltip con dirección completa (hover)
}
```

**Uso:**
```tsx
<UbicacionInteligenteCompacta 
  lat={19.3419} 
  lng={-97.6664}
  mostrarCompleto={true}
/>
```

### 3. **`/components/fx27/EjemploUbicacionesInteligentes.tsx`**
Página de demostración con 5 ejemplos de ubicaciones.

---

## 🔧 Funcionamiento Técnico

### **Flujo de Detección (Prioridad):**

```
1. ¿Está en Granjas Carroll? (500m)
   └─ SÍ → Muestra "🏭 Granjas Carroll - Oriental, Puebla"
   └─ NO → Continuar

2. ¿Está cerca de algún cliente conocido? (100m)
   └─ SÍ → Muestra "🏭 NOMBRE CLIENTE - Municipio, Estado"
   └─ NO → Continuar

3. Geocodificación inversa con Google Maps API
   └─ Extraer: Municipio, Estado, Colonia, Calle
   └─ Muestra "📍 Municipio, Estado (Referencia adicional)"
```

### **Caché de Clientes Conocidos:**

- **Duración:** 5 minutos
- **Origen:** Catálogo de formatos de venta (84 registros → 71 destinos únicos)
- **Optimización:** Evita consultas innecesarias a Supabase

### **Extracción de Coordenadas:**

Soporta múltiples formatos de URLs de Google Maps:

```javascript
// Formato 1: ?q=lat,lng
https://www.google.com/maps?q=19.3419,-97.6664

// Formato 2: /@lat,lng
https://www.google.com/maps/@19.3419,-97.6664,15z

// Formato 3: /place/.../@lat,lng
https://www.google.com/maps/place/Granjas+Carroll/@19.3419,-97.6664,15z

// Formato 4: Short URL (maps.app.goo.gl)
https://maps.app.goo.gl/xYz123 (redirige a formato con coordenadas)
```

---

## 📊 Ejemplo de Integración en Tabla

### **Antes:**
```tsx
<td>{unidad.ubicacion}</td>
```

### **Después:**
```tsx
<td>
  <UbicacionInteligenteCompacta 
    lat={unidad.lat} 
    lng={unidad.lng}
    mostrarCompleto={true}
  />
</td>
```

### **Resultado Visual:**

| Unidad | Operador | 📍 Ubicación Actual |
|--------|----------|---------------------|
| 001 | Juan Pérez | 🏭 **Granjas Carroll**<br/><small>Oriental, Puebla</small> |
| 002 | Pedro Martínez | 📍 **Querétaro, Qro**<br/><small>(Centro Histórico)</small> |
| 003 | Luis Ramírez | 🏭 **Cedis Walmart**<br/><small>Iztapalapa, CDMX</small> |

---

## 🔑 Configuración Requerida

### **1. Google Maps API Key**

Ya configurada en:
```
Supabase → Project Settings → Edge Functions → Environment Variables
Variable: GOOGLE_MAPS_API_KEY
```

### **2. Geocoding API Habilitada**

✅ Ya habilitada en Google Cloud Console:
```
https://console.cloud.google.com/apis/library/geocoding-backend.googleapis.com
```

### **3. Endpoint de Backend**

✅ Ya existe en `/supabase/functions/server/index.tsx`:
```typescript
app.get("/make-server-d84b50bb/api-keys/google-maps", (c) => {
  const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY') || '';
  return c.json({ apiKey });
});
```

---

## 📈 Rendimiento y Límites

### **Google Maps Geocoding API:**
- **Límite gratuito:** 40,000 solicitudes/mes
- **Costo después:** $0.005 USD por solicitud
- **Caché:** Reduce solicitudes innecesarias

### **Optimizaciones Implementadas:**

1. ✅ Caché de clientes conocidos (5 min)
2. ✅ Detección prioritaria de Granjas Carroll (sin API)
3. ✅ Detección de clientes conocidos (sin API)
4. ✅ Solo usa Geocoding API para ubicaciones genéricas

**Resultado:** ~70% de las consultas NO usan la API de Google Maps.

---

## 🧪 Cómo Probar

### **Opción 1: Componente de Ejemplo**

Agrega temporalmente al `App.tsx`:
```tsx
import { EjemploUbicacionesInteligentes } from './components/fx27/EjemploUbicacionesInteligentes';

// En tu renderizado:
<EjemploUbicacionesInteligentes />
```

### **Opción 2: Integrar en Módulo Carroll**

Ver sección siguiente: "Integración en el Módulo Carroll"

---

## 🚀 Siguientes Pasos

### **1. Integrar en tabla de unidades del módulo Carroll**
- Agregar columna "📍 Ubicación Actual"
- Mostrar ubicación en tiempo real para cada tractocamión

### **2. Dashboard de monitoreo**
- Mapa con todas las unidades
- Filtros por cliente/municipio
- Alertas cuando una unidad llega a cliente

### **3. Historial de ubicaciones**
- Guardar snapshot cada X minutos
- Generar rutas de viaje
- Reportes de tiempo en cliente

---

## 🐛 Troubleshooting

### **Problema: "Ubicación no disponible"**

**Causas posibles:**
1. Coordenadas inválidas (lat/lng fuera de rango)
2. Google Maps API Key no configurada
3. Geocoding API no habilitada
4. Límite de API excedido

**Solución:**
```bash
# Verificar configuración
1. Ve a: Módulo #12 → Botón "Verificar GPS API"
2. Confirma que sale: ✅ Todo funciona correctamente
```

### **Problema: Clientes no se detectan**

**Causa:** URLs de ubicación en formatos no tienen coordenadas válidas.

**Solución:**
```javascript
// Verificar que las URLs tengan este formato:
https://www.google.com/maps/@19.3419,-97.6664,15z

// NO este formato (nombre de lugar):
https://www.google.com/maps/place/Granjas+Carroll
```

---

## 📞 Soporte

Para problemas técnicos, revisar:
1. Console del navegador (F12)
2. Logs del backend en Supabase
3. Este documento de troubleshooting

---

**Última actualización:** 21 Nov 2025  
**Versión:** 1.0.0  
**Proyecto:** FX27 - Sistema CRM Granjas Carroll
