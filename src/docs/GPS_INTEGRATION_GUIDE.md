# 🛰️ GUÍA DE INTEGRACIÓN GPS - FX27 DEDICADOS

## 📡 PROVEEDORES SOPORTADOS

El sistema está preparado para cualquier proveedor GPS. Los más comunes en México:

### 1. **GEOTAB** ⭐ Recomendado
- **API Docs:** https://developers.geotab.com/
- **Endpoint:** https://my.geotab.com/apiv1
- **Método:** REST API + WebSocket
- **Datos:** Ubicación en tiempo real, velocidad, odómetro, eventos

### 2. **SAMSARA**
- **API Docs:** https://developers.samsara.com/
- **Endpoint:** https://api.samsara.com/v1
- **Método:** REST API + Webhooks
- **Datos:** GPS, temperatura, ELD, dashcam

### 3. **OMNITRACS**
- **API Docs:** https://developer.omnitracs.com/
- **Endpoint:** https://api.omnitracs.com/
- **Método:** REST API
- **Datos:** Tracking, HOS, IFTA

### 4. **VERIZON CONNECT (FleetMatics)**
- **API Docs:** https://developer.verizonconnect.com/
- **Endpoint:** https://api.verizonconnect.com/
- **Método:** REST API + Webhooks

### 5. **AT&T FLEET COMPLETE**
- **API Docs:** Solicitar a AT&T
- **Endpoint:** https://fleetcomplete.api.att.com/
- **Método:** REST API

---

## 🔧 CONFIGURACIÓN INICIAL

### PASO 1: Configurar Credenciales

En el módulo **Configuración → GPS**, ingresa:

```json
{
  "provider": "geotab",
  "apiKey": "TU_API_KEY_AQUI",
  "apiUrl": "https://my.geotab.com/apiv1",
  "webhookSecret": "SECRET_PARA_WEBHOOKS",
  "additionalConfig": {
    "database": "tu_database_geotab",
    "username": "usuario",
    "sessionId": "obtenido_tras_autenticacion"
  }
}
```

**Endpoint Backend:**
```
POST https://fbxbsslhewchyibdoyzk.supabase.co/functions/v1/make-server-d84b50bb/gps/config
Authorization: Bearer {publicAnonKey}
```

---

## 📍 ENVIAR UBICACIONES

### Opción A: Webhook (Recomendado)
Configura el webhook en tu proveedor GPS apuntando a:
```
https://fbxbsslhewchyibdoyzk.supabase.co/functions/v1/make-server-d84b50bb/gps/webhook
```

### Opción B: Polling (Script personalizado)
Crea un script que consulte la API de tu proveedor cada X minutos y envíe datos:

```javascript
// Ejemplo: Enviar ubicación de UNA unidad
POST /gps/location
{
  "numeroTracto": "T-0100",
  "latitude": 25.6866,
  "longitude": -100.3161,
  "speed": 85.5,
  "heading": 180,
  "timestamp": "2025-01-15T14:30:00Z",
  "status": "moving",
  "odometer": 125000,
  "address": "Carretera Federal 85, Monterrey, NL"
}
```

```javascript
// Ejemplo: Enviar MÚLTIPLES ubicaciones (batch)
POST /gps/locations/batch
{
  "locations": [
    {
      "numeroTracto": "T-0100",
      "latitude": 25.6866,
      "longitude": -100.3161,
      "speed": 85.5,
      "heading": 180,
      "timestamp": "2025-01-15T14:30:00Z",
      "status": "moving",
      "odometer": 125000,
      "address": "Monterrey, NL"
    },
    {
      "numeroTracto": "T-0101",
      "latitude": 27.4889,
      "longitude": -99.5087,
      "speed": 0,
      "heading": 0,
      "timestamp": "2025-01-15T14:30:00Z",
      "status": "stopped",
      "odometer": 98000,
      "address": "Laredo, TX"
    }
  ]
}
```

---

## 📊 CONSULTAR UBICACIONES

### Ver todas las unidades (mapa)
```
GET /gps/locations/all
```

Respuesta:
```json
{
  "success": true,
  "locations": [
    {
      "numeroTracto": "T-0100",
      "latitude": 25.6866,
      "longitude": -100.3161,
      "speed": 85.5,
      "status": "moving",
      "address": "Monterrey, NL",
      "updatedAt": "2025-01-15T14:30:00Z"
    }
  ],
  "count": 30
}
```

### Ver una unidad específica
```
GET /gps/location/T-0100
```

### Ver histórico de una unidad
```
GET /gps/history/T-0100
```

---

## 🔄 SCRIPT DE SINCRONIZACIÓN AUTOMÁTICA

### Ejemplo con **Geotab** (Node.js)

```javascript
// sync-geotab.js
const fetch = require('node-fetch');

const GEOTAB_CONFIG = {
  database: 'tu_database',
  username: 'usuario',
  password: 'password',
  apiUrl: 'https://my.geotab.com/apiv1'
};

const FX27_BACKEND = 'https://fbxbsslhewchyibdoyzk.supabase.co/functions/v1/make-server-d84b50bb';
const FX27_KEY = 'tu_public_anon_key';

// 1. Autenticar con Geotab
async function authenticateGeotab() {
  const response = await fetch(`${GEOTAB_CONFIG.apiUrl}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      method: 'Authenticate',
      params: {
        database: GEOTAB_CONFIG.database,
        userName: GEOTAB_CONFIG.username,
        password: GEOTAB_CONFIG.password
      }
    })
  });
  
  const data = await response.json();
  return data.result.credentials;
}

// 2. Obtener ubicaciones de todos los vehículos
async function getDeviceLocations(credentials) {
  const response = await fetch(`${GEOTAB_CONFIG.apiUrl}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      method: 'Get',
      params: {
        typeName: 'DeviceStatusInfo',
        credentials
      }
    })
  });
  
  const data = await response.json();
  return data.result;
}

// 3. Enviar a FX27
async function sendToFX27(locations) {
  const mappedLocations = locations.map(loc => ({
    numeroTracto: loc.device.name, // Ej: "T-0100"
    latitude: loc.latitude,
    longitude: loc.longitude,
    speed: loc.speed,
    heading: loc.bearing,
    timestamp: loc.dateTime,
    status: loc.speed > 5 ? 'moving' : 'stopped',
    odometer: loc.odometer
  }));
  
  const response = await fetch(`${FX27_BACKEND}/gps/locations/batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${FX27_KEY}`
    },
    body: JSON.stringify({ locations: mappedLocations })
  });
  
  const result = await response.json();
  console.log('✅ Ubicaciones enviadas:', result.results.length);
}

// 4. Loop cada 5 minutos
async function syncLoop() {
  try {
    console.log('🔄 Sincronizando con Geotab...');
    const credentials = await authenticateGeotab();
    const locations = await getDeviceLocations(credentials);
    await sendToFX27(locations);
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  setTimeout(syncLoop, 5 * 60 * 1000); // 5 minutos
}

syncLoop();
```

**Ejecutar:**
```bash
node sync-geotab.js
```

---

## 🎯 INTEGRACIÓN EN FRONTEND

El módulo **Dedicados** se actualizará automáticamente cuando haya datos GPS disponibles. Los cambios incluirán:

1. **Mapa interactivo** mostrando todas las unidades
2. **Actualización en tiempo real** cada 30 segundos
3. **Histórico de rutas** (últimas 24 horas)
4. **Alertas automáticas** (geofencing, velocidad excesiva)

---

## 🚨 IMPORTANTE

1. **Seguridad:** Las API Keys NUNCA se exponen al frontend
2. **Rate Limits:** Respeta los límites de tu proveedor GPS
3. **Limpieza:** El histórico se limpia automáticamente después de 30 días
4. **Webhooks:** Configura la URL del webhook en el panel de tu proveedor

---

## 📞 CONTACTO

¿Necesitas ayuda con un proveedor GPS específico?
- Geotab: support@geotab.com
- Samsara: support@samsara.com
- Omnitracs: developer-support@omnitracs.com

---

**¡Sistema listo para recibir datos GPS en tiempo real! 🛰️**
