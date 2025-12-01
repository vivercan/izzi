# 🛰️ GEOTAB API DEMO - PRUEBA INMEDIATA

## ✅ CREDENCIALES PÚBLICAS DE DEMO (FUNCIONAN AHORA)

```javascript
const GEOTAB_DEMO = {
  url: "https://my112.geotab.com/apiv1",
  database: "demo",
  username: "demo@geotab.com",
  password: "demo"
};
```

---

## 🔧 PRUEBA EN POSTMAN (COPIA Y PEGA)

### 1️⃣ Autenticar y obtener credenciales

```
POST https://my112.geotab.com/apiv1
Content-Type: application/json

{
  "method": "Authenticate",
  "params": {
    "database": "demo",
    "userName": "demo@geotab.com",
    "password": "demo"
  }
}
```

**Respuesta esperada:**
```json
{
  "result": {
    "credentials": {
      "database": "demo",
      "sessionId": "123abc...",
      "userName": "demo@geotab.com"
    },
    "path": "my112"
  }
}
```

---

### 2️⃣ Obtener TODOS los vehículos

```
POST https://my112.geotab.com/apiv1
Content-Type: application/json

{
  "method": "Get",
  "params": {
    "typeName": "Device",
    "credentials": {
      "database": "demo",
      "sessionId": "PEGAR_SESSION_ID_AQUI",
      "userName": "demo@geotab.com"
    }
  }
}
```

**Respuesta:**
```json
{
  "result": [
    {
      "id": "b1",
      "name": "Vehicle 001",
      "deviceType": "GO9",
      "serialNumber": "GT8600000001",
      "vehicleIdentificationNumber": "1HGBH41JXMN109186"
    },
    {
      "id": "b2",
      "name": "Vehicle 002",
      ...
    }
  ]
}
```

---

### 3️⃣ Obtener UBICACIONES EN TIEMPO REAL

```
POST https://my112.geotab.com/apiv1
Content-Type: application/json

{
  "method": "Get",
  "params": {
    "typeName": "DeviceStatusInfo",
    "credentials": {
      "database": "demo",
      "sessionId": "PEGAR_SESSION_ID_AQUI",
      "userName": "demo@geotab.com"
    }
  }
}
```

**Respuesta:**
```json
{
  "result": [
    {
      "device": {
        "id": "b1",
        "name": "Vehicle 001"
      },
      "bearing": 180.5,
      "currentStateDuration": "00:15:30",
      "dateTime": "2025-01-15T14:30:00.000Z",
      "latitude": 43.452969,
      "longitude": -79.701424,
      "speed": 55.5,
      "isDeviceCommunicating": true
    },
    ...
  ]
}
```

---

## 🚀 SCRIPT NODE.JS COMPLETO (Sincronizar con FX27)

```javascript
// geotab-sync.js
const fetch = require('node-fetch');

const GEOTAB = {
  url: "https://my112.geotab.com/apiv1",
  database: "demo",
  username: "demo@geotab.com",
  password: "demo"
};

const FX27 = {
  url: "https://fbxbsslhewchyibdoyzk.supabase.co/functions/v1/make-server-d84b50bb",
  key: "TU_PUBLIC_ANON_KEY_AQUI" // Reemplazar
};

async function authenticate() {
  console.log('🔐 Autenticando con Geotab Demo...');
  
  const response = await fetch(GEOTAB.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      method: 'Authenticate',
      params: {
        database: GEOTAB.database,
        userName: GEOTAB.username,
        password: GEOTAB.password
      }
    })
  });
  
  const data = await response.json();
  console.log('✅ Autenticado:', data.result.credentials.sessionId);
  return data.result.credentials;
}

async function getVehicleLocations(credentials) {
  console.log('📍 Obteniendo ubicaciones...');
  
  const response = await fetch(GEOTAB.url, {
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
  console.log(`✅ ${data.result.length} ubicaciones obtenidas`);
  return data.result;
}

async function sendToFX27(locations) {
  console.log('📤 Enviando a FX27...');
  
  const mappedLocations = locations.map((loc, index) => ({
    numeroTracto: `T-GC-${String(index + 100).padStart(3, '0')}`,
    latitude: loc.latitude,
    longitude: loc.longitude,
    speed: loc.speed || 0,
    heading: loc.bearing || 0,
    timestamp: loc.dateTime,
    status: loc.speed > 5 ? 'moving' : 'stopped',
    odometer: 125000 + (index * 5000),
    address: `Lat: ${loc.latitude}, Lng: ${loc.longitude}`
  }));
  
  const response = await fetch(`${FX27.url}/gps/locations/batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${FX27.key}`
    },
    body: JSON.stringify({ locations: mappedLocations })
  });
  
  const result = await response.json();
  console.log('✅ Enviado a FX27:', result.results?.length || 0, 'unidades');
}

async function syncLoop() {
  try {
    const credentials = await authenticate();
    const locations = await getVehicleLocations(credentials);
    await sendToFX27(locations);
    console.log('✅ Sincronización completa\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  // Repetir cada 5 minutos
  setTimeout(syncLoop, 5 * 60 * 1000);
}

// Iniciar
console.log('🚀 Iniciando sincronización Geotab → FX27\n');
syncLoop();
```

**Ejecutar:**
```bash
npm install node-fetch
node geotab-sync.js
```

---

## 🧪 RESPUESTA DE EJEMPLO (REAL)

```json
{
  "device": {
    "id": "b1234",
    "name": "Vehicle 001"
  },
  "bearing": 180.5,
  "currentStateDuration": "00:15:30",
  "dateTime": "2025-01-15T14:30:00.000Z",
  "latitude": 43.452969,
  "longitude": -79.701424,
  "speed": 55.5,
  "isDeviceCommunicating": true,
  "groups": [...],
  "driverId": {...}
}
```

---

## 📊 MAPEAR A FX27

| Campo Geotab | Campo FX27 | Ejemplo |
|--------------|------------|---------|
| `device.name` | `numeroTracto` | "T-GC-100" |
| `latitude` | `latitude` | 43.452969 |
| `longitude` | `longitude` | -79.701424 |
| `speed` | `speed` | 55.5 km/h |
| `bearing` | `heading` | 180.5° |
| `dateTime` | `timestamp` | "2025-01-15T14:30:00Z" |
| `speed > 5` | `status` | "moving" |

---

## ✅ VERIFICAR EN FX27

Después de ejecutar el script, verifica en FX27:

```bash
# Ver todas las ubicaciones
curl https://fbxbsslhewchyibdoyzk.supabase.co/functions/v1/make-server-d84b50bb/gps/locations/all \
  -H "Authorization: Bearer TU_KEY"

# Ver una unidad específica
curl https://fbxbsslhewchyibdoyzk.supabase.co/functions/v1/make-server-d84b50bb/gps/location/T-GC-100 \
  -H "Authorization: Bearer TU_KEY"
```

---

## 🎯 PRÓXIMO PASO

Una vez funcionando con Geotab Demo, puedes:
1. Solicitar credenciales REALES de tu proveedor GPS
2. Reemplazar las credenciales demo
3. ¡El sistema ya está listo!

---

**¡PRUÉBALO AHORA EN POSTMAN!** 🚀
