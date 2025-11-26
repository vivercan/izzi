# 🗺️ SISTEMA DE UBICACIÓN DETALLADA CON GPS

## 📋 Descripción General

Este sistema permite obtener información detallada de ubicación a partir de coordenadas GPS, con detección automática de **Granjas Carroll, Oriental Puebla** cuando las unidades están en un radio de 500 metros.

---

## ✨ Características Principales

### 1. **Detección Automática de Granjas Carroll**
- **Coordenadas Exactas:** `19.3419, -97.6664`
- **Radio de detección:** 500 metros
- **Identificación automática:** Cuando una unidad está dentro del radio, se marca como:
  ```
  🏭 Granjas Carroll, Oriental Puebla
  ```

### 2. **Reverse Geocoding con Google Maps**
- Convierte coordenadas GPS en direcciones completas
- Obtiene:
  - ✅ Dirección completa
  - ✅ Municipio
  - ✅ Estado
  - ✅ Código Postal
  - ✅ País

### 3. **Cálculo de Distancias**
- Fórmula de Haversine para precisión
- Distancias en metros
- Detección de proximidad a puntos importantes

---

## 🚀 Uso Rápido

### Opción 1: Componente React (Más Fácil)

```tsx
import { UbicacionDetallada } from './components/fx27/UbicacionDetallada';

// En tu componente:
<UbicacionDetallada 
  lat={19.3419} 
  lng={-97.6664} 
  mostrarCompleto={true}
  onUbicacionCargada={(ubicacion) => {
    console.log(ubicacion);
    // {
    //   direccionCompleta: "Granjas Carroll, Oriental Puebla",
    //   municipio: "Oriental",
    //   estado: "Puebla",
    //   codigoPostal: "75021",
    //   esGranjasCarroll: true,
    //   distanciaAGranjasCarroll: 0
    // }
  }}
/>
```

### Opción 2: Funciones de Utilidad (Más Control)

```tsx
import { 
  estaEnGranjasCarroll, 
  calcularDistancia,
  obtenerUbicacionDetallada,
  GRANJAS_CARROLL_COORDS
} from '../utils/geocoding';

// 1. Verificar si está en Granjas Carroll
const enGranjas = estaEnGranjasCarroll({ lat: 19.3419, lng: -97.6664 });
// true

// 2. Calcular distancia a Granjas Carroll
const distancia = calcularDistancia(
  { lat: 19.3419, lng: -97.6664 },
  GRANJAS_CARROLL_COORDS
);
// 0 (metros)

// 3. Obtener ubicación detallada (requiere API Key)
const ubicacion = await obtenerUbicacionDetallada(
  { lat: 20.5888, lng: -100.3899 },
  googleMapsApiKey
);
// {
//   direccionCompleta: "Querétaro, Qro., México",
//   municipio: "Querétaro",
//   estado: "Querétaro",
//   codigoPostal: "76000",
//   esGranjasCarroll: false,
//   distanciaAGranjasCarroll: 123456
// }
```

---

## 🔧 Configuración de Google Maps API

### Paso 1: Habilitar la API
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto o crea uno nuevo
3. Ve a **APIs & Services > Library**
4. Busca **"Geocoding API"**
5. Haz clic en **"Enable"**

### Paso 2: Crear API Key
1. Ve a **APIs & Services > Credentials**
2. Haz clic en **"Create Credentials" > "API Key"**
3. Copia la API Key generada

### Paso 3: Configurar en Supabase
1. Ve a tu proyecto Supabase
2. **Settings > Edge Functions > Environment Variables**
3. Agrega la variable:
   - **Name:** `GOOGLE_MAPS_API_KEY`
   - **Value:** `tu-api-key-aquí`

### Paso 4: Restricciones de Seguridad (Opcional pero recomendado)
1. En Google Cloud Console, edita la API Key
2. **Application restrictions:**
   - Selecciona "HTTP referrers"
   - Agrega: `https://jjcrm27.com/*`
3. **API restrictions:**
   - Selecciona "Restrict key"
   - Marca solo "Geocoding API"

---

## 📊 Casos de Uso

### Caso 1: Tabla de Unidades (Reemplazar "QRO")

**ANTES:**
```tsx
<td>{unidad.estado}</td> 
// Muestra: "QRO"
```

**AHORA:**
```tsx
<td>
  <UbicacionDetallada lat={unidad.lat} lng={unidad.lng} />
</td>
// Muestra: "Querétaro, Querétaro" o "🏭 Granjas Carroll, Oriental Puebla"
```

### Caso 2: Detección de Llegada a Origen

```tsx
import { estaEnGranjasCarroll } from '../utils/geocoding';

// En tu lógica de monitoreo
useEffect(() => {
  const verificarUbicacion = () => {
    const enOrigen = estaEnGranjasCarroll({ 
      lat: unidad.latActual, 
      lng: unidad.lngActual 
    });
    
    if (enOrigen && unidad.estado === 'En Tránsito') {
      // ¡La unidad llegó a Granjas Carroll!
      actualizarEstado('Origen');
      notificar('Unidad llegó a origen');
    }
  };
  
  verificarUbicacion();
}, [unidad.latActual, unidad.lngActual]);
```

### Caso 3: Alertas por Proximidad

```tsx
import { calcularDistancia, GRANJAS_CARROLL_COORDS } from '../utils/geocoding';

const distancia = calcularDistancia(
  { lat: unidad.lat, lng: unidad.lng },
  GRANJAS_CARROLL_COORDS
);

if (distancia <= 1000) { // 1km
  mostrarAlerta('🚨 Unidad a menos de 1km de origen');
} else if (distancia <= 5000) { // 5km
  mostrarAlerta('⚠️ Unidad aproximándose a origen');
}
```

---

## 🏭 Ubicaciones Importantes Predefinidas

El sistema incluye 3 ubicaciones importantes:

```typescript
export const UBICACIONES_IMPORTANTES = [
  {
    nombre: 'Granjas Carroll, Oriental Puebla',
    coords: { lat: 19.3419, lng: -97.6664 },
    radio: 500, // metros
    icono: '🏭',
    descripcion: 'Granjas Carroll de México, S de RL de CV'
  },
  {
    nombre: 'Warlo',
    coords: { lat: 19.0427, lng: -97.5922 },
    radio: 300,
    icono: '🏪',
    descripcion: 'Warlo - Punto de carga/descarga'
  },
  {
    nombre: 'Frialsa Frigoríficos',
    coords: { lat: 19.0427, lng: -97.5922 },
    radio: 300,
    icono: '❄️',
    descripción: 'Frialsa Frigoríficos - Almacén refrigerado'
  }
];
```

Para detectar cualquier ubicación importante:

```tsx
import { detectarUbicacionImportante } from '../utils/geocoding';

const ubicacion = detectarUbicacionImportante({ lat: 19.3419, lng: -97.6664 });
if (ubicacion) {
  console.log(ubicacion);
  // {
  //   nombre: 'Granjas Carroll, Oriental Puebla',
  //   coords: { lat: 19.3419, lng: -97.6664 },
  //   radio: 500,
  //   icono: '🏭',
  //   descripcion: 'Granjas Carroll de México, S de RL de CV',
  //   distancia: 0
  // }
}
```

---

## 🔍 Ejemplo Completo de Integración

```tsx
import { useState, useEffect } from 'react';
import { UbicacionDetallada } from './components/fx27/UbicacionDetallada';
import { estaEnGranjasCarroll } from '../utils/geocoding';

interface Unidad {
  id: string;
  tracto: string;
  operador: string;
  lat: number;
  lng: number;
}

export const TablaUnidades = ({ unidades }: { unidades: Unidad[] }) => {
  return (
    <table>
      <thead>
        <tr>
          <th>Unidad</th>
          <th>Operador</th>
          <th>Ubicación Actual</th>
          <th>Estado</th>
        </tr>
      </thead>
      <tbody>
        {unidades.map(unidad => {
          const enGranjas = estaEnGranjasCarroll({ 
            lat: unidad.lat, 
            lng: unidad.lng 
          });
          
          return (
            <tr key={unidad.id}>
              <td>{unidad.tracto}</td>
              <td>{unidad.operador}</td>
              <td>
                <UbicacionDetallada 
                  lat={unidad.lat} 
                  lng={unidad.lng}
                  mostrarCompleto={true}
                />
              </td>
              <td>
                {enGranjas && (
                  <span className="badge-success">
                    ✅ En Origen
                  </span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};
```

---

## 💰 Costos de Google Maps API

### Geocoding API - Precios (2024)
- **Primeras 40,000 solicitudes/mes:** GRATIS
- **40,001 - 100,000:** $0.005 USD por solicitud
- **100,001+:** $0.004 USD por solicitud

### Optimización de Costos
El sistema ya incluye optimizaciones:

1. ✅ **Caché de Granjas Carroll:** Si está en el radio de 500m, NO se llama a la API
2. ✅ **Detección local primero:** Verifica ubicaciones importantes antes de llamar API
3. ✅ **Fallback inteligente:** Si falla la API, muestra coordenadas

### Estimación para FX27
Con 28 unidades actualizando cada 5 minutos:
- **Llamadas/día:** ~8,000 (si todas están fuera de Granjas Carroll)
- **Llamadas/mes:** ~240,000
- **Costo mensual:** ~$1,000 USD

Con optimizaciones (50% en Granjas Carroll):
- **Llamadas/mes:** ~120,000
- **Costo mensual:** ~$400 USD

---

## 🐛 Solución de Problemas

### Error: "API key not valid"
**Solución:** Verifica que:
1. La API Key esté correctamente configurada en Supabase
2. La Geocoding API esté habilitada en Google Cloud
3. No haya restricciones que bloqueen la llamada

### Error: "OVER_QUERY_LIMIT"
**Solución:** 
- Has excedido el límite gratuito
- Agrega un método de pago en Google Cloud Console

### La ubicación muestra solo coordenadas
**Posibles causas:**
1. API Key no cargada aún (espera 1-2 segundos)
2. Error de red
3. Límite de API excedido

---

## 📚 Archivos del Sistema

```
/utils/
  └── geocoding.ts               # Funciones de utilidad

/components/fx27/
  ├── UbicacionDetallada.tsx     # Componente React principal
  └── EjemploUbicacionGPS.tsx    # Ejemplo de implementación

/docs/
  └── SISTEMA_UBICACION_GPS.md   # Esta documentación
```

---

## 🎯 Próximas Mejoras

- [ ] Agregar más ubicaciones importantes (Warlo, Frialsa con coords reales)
- [ ] Caché de ubicaciones en localStorage
- [ ] Modo offline con última ubicación conocida
- [ ] Historial de geocercas visitadas
- [ ] Alertas push cuando entra/sale de geocercas

---

## 📞 Soporte

Para dudas o problemas:
1. Revisa los ejemplos en `/components/fx27/EjemploUbicacionGPS.tsx`
2. Consulta la documentación de Google Maps Geocoding API
3. Verifica los logs del navegador y Supabase Edge Functions

---

**Creado para FX27 - Sistema CRM Dedicados Granjas Carroll** 🚚
