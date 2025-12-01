# 🔧 INSTRUCCIONES COMPLETAS PARA FIX DE WIDETECH GPS

## 📋 RESUMEN:
Necesitas hacer 2 cambios en `/supabase/functions/server/index.tsx`:

1. ✅ **Agregar caché en memoria** (línea ~30)
2. ✅ **Reemplazar endpoint batch** (líneas ~1071-1173)

---

## 🔥 CAMBIO #1: AGREGAR CACHE EN MEMORIA

**UBICACIÓN:** Después de la línea que dice `})();` (línea ~28)

**BUSCA ESTO:**
```typescript
})();

// Enable logger
app.use('*', logger(console.log));
```

**AGREGAR ENTRE ESAS LÍNEAS:**
```typescript
})();

// ==================== WIDETECH GPS CACHE ====================
// Caché en memoria para evitar error 109 (40 segundos entre consultas por placa)
const WIDETECH_CACHE: Record<string, { data: any; lastRequestTime: number; fromCache?: boolean }> = {};
const MIN_INTERVAL_MS = 40_000; // 40 segundos

// Enable logger
app.use('*', logger(console.log));
```

---

## 🔥 CAMBIO #2: REEMPLAZAR ENDPOINT BATCH COMPLETO

**UBICACIÓN:** Líneas ~1071-1173

**BUSCA ESTE COMENTARIO:**
```typescript
// POST obtener ubicaciones de múltiples tractocamiones (batch)
```

**REEMPLAZAR TODO EL ENDPOINT** (desde el comentario hasta el `});` que cierra la función)

**EL CÓDIGO COMPLETO ESTÁ EN:** `/supabase/functions/server/widetech_batch_fixed.tsx`

**O COPIA DIRECTAMENTE:**

```typescript
// POST obtener ubicaciones de múltiples tractocamiones (batch) CON CACHE 40s
app.post("/make-server-d84b50bb/widetech/locations/batch", async (c) => {
  try {
    const { placas } = await c.req.json();
    
    if (!Array.isArray(placas) || placas.length === 0) {
      return c.json({ success: false, error: 'Debe proporcionar un array de placas' }, 400);
    }
    
    const results = [];
    const login = "GrCarroll";
    const password = "CARROLL2025";
    const now = Date.now();
    
    console.log(`[WIDETECH BATCH] 🚛 Consultando ${placas.length} unidades...`);
    
    // Obtener ÚLTIMA ubicación de cada placa usando GET request simple CON CACHE
    for (const placa of placas) {
      try {
        console.log(`\n[WIDETECH] 🔍 Placa: ${placa}`);
        
        // 1️⃣ VERIFICAR CACHE: Si consulté hace menos de 40s, usar cache
        const cached = WIDETECH_CACHE[placa];
        if (cached && (now - cached.lastRequestTime) < MIN_INTERVAL_MS) {
          const timeLeft = Math.ceil((MIN_INTERVAL_MS - (now - cached.lastRequestTime)) / 1000);
          console.log(`[WIDETECH] 💾 CACHE HIT para ${placa} (consultado hace ${Math.ceil((now - cached.lastRequestTime) / 1000)}s, quedan ${timeLeft}s para actualizar)`);
          
          results.push({
            placa,
            success: true,
            location: cached.data,
            fromCache: true,
            cacheAge: Math.ceil((now - cached.lastRequestTime) / 1000)
          });
          continue;
        }
        
        // 2️⃣ NO HAY CACHE O YA PASARON 40s → CONSULTAR API
        console.log(`[WIDETECH] 🌐 CONSULTANDO API para ${placa}`);
        
        const url = `https://web1ws.widetech.co/WsHistoryGetByPlate.asmx/HistoyDataLastLocationByPlate?sLogin=${login}&sPassword=${password}&sPlate=${placa}`;
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json, text/xml, */*'
          }
        });
        
        console.log(`[WIDETECH] 📥 Response status: ${response.status} para placa ${placa}`);
        
        const responseText = await response.text();
        
        // Verificar error 109 (consultado muy rápido)
        if (responseText.includes('<code>109</code>')) {
          console.log(`[WIDETECH] ⚠️ ERROR 109 para ${placa}: Debe esperar más tiempo`);
          
          if (cached) {
            console.log(`[WIDETECH] 💾 Usando cache viejo por error 109`);
            results.push({
              placa,
              success: true,
              location: cached.data,
              fromCache: true,
              cacheAge: Math.ceil((now - cached.lastRequestTime) / 1000),
              warning: 'Error 109: usando cache viejo'
            });
          } else {
            results.push({
              placa,
              success: false,
              error: 'Error 109: Debe esperar 40 segundos entre consultas'
            });
          }
          continue;
        }
        
        // 3️⃣ PARSEAR XML con REGEX CORREGIDOS (un solo backslash)
        const latMatch = responseText.match(/<Latitude>([-\d.]+)<\/Latitude>/);
        const lngMatch = responseText.match(/<Longitude>([-\d.]+)<\/Longitude>/);
        const speedMatch = responseText.match(/<Speed>([\d.]+)<\/Speed>/);
        const headingMatch = responseText.match(/<Heading>([^<]+)<\/Heading>/);
        const locationMatch = responseText.match(/<Location><!\[CDATA\[([^\]]+)\]\]><\/Location>/);
        const dateTimeMatch = responseText.match(/<DateTimeGPS>([^<]+)<\/DateTimeGPS>/);
        const odometerMatch = responseText.match(/<Odometer>([\d.]+)<\/Odometer>/);
        const ignitionMatch = responseText.match(/<Ignition>([01])<\/Ignition>/);
        const temp1Match = responseText.match(/<S1[^>]*>([-\d.]+)<\/S1>/);
        const temp2Match = responseText.match(/<S2[^>]*>([-\d.]+)<\/S2>/);
        
        if (latMatch && lngMatch) {
          const location = {
            placa,
            latitude: parseFloat(latMatch[1]),
            longitude: parseFloat(lngMatch[1]),
            speed: speedMatch ? parseFloat(speedMatch[1]) : 0,
            heading: headingMatch ? headingMatch[1] : 'N/A',
            address: locationMatch ? locationMatch[1].trim() : 'Ubicación desconocida',
            timestamp: dateTimeMatch ? dateTimeMatch[1] : new Date().toISOString(),
            odometer: odometerMatch ? parseFloat(odometerMatch[1]) : 0,
            ignition: ignitionMatch ? (ignitionMatch[1] === '1' ? 'ON' : 'OFF') : 'N/A',
            temperatura1: temp1Match ? parseFloat(temp1Match[1]) : null,
            temperatura2: temp2Match ? parseFloat(temp2Match[1]) : null
          };
          
          // 4️⃣ GUARDAR EN CACHE
          WIDETECH_CACHE[placa] = {
            data: location,
            lastRequestTime: now
          };
          
          console.log(`[WIDETECH BATCH] ✅ ${placa}: ${location.latitude}, ${location.longitude} | Guardado en cache`);
          
          results.push({
            placa,
            success: true,
            location,
            fromCache: false
          });
        } else {
          console.log(`[WIDETECH BATCH] ❌ ${placa}: No se encontró ubicación en XML`);
          results.push({
            placa,
            success: false,
            error: 'No se encontraron coordenadas GPS en la respuesta XML'
          });
        }
      } catch (error) {
        console.error(`[WIDETECH BATCH] ❌ Error en placa ${placa}:`, error);
        results.push({
          placa,
          success: false,
          error: String(error)
        });
      }
    }
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const fromCache = results.filter(r => r.fromCache).length;
    
    console.log(`[WIDETECH BATCH] ✅ Exitosos: ${successful} | ❌ Fallidos: ${failed} | 💾 Cache: ${fromCache}`);
    
    return c.json({
      success: true,
      results,
      total: placas.length,
      successful,
      failed,
      fromCache,
      cacheInfo: {
        minIntervalSeconds: MIN_INTERVAL_MS / 1000,
        message: 'Las placas consultadas hace menos de 40s usan cache automáticamente'
      }
    });
  } catch (error) {
    console.error(`[POST /widetech/locations/batch] Error: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});
```

---

## ✅ CHECKLIST:

- [ ] Cambio #1: Agregué caché en memoria después de línea 28
- [ ] Cambio #2: Reemplacé endpoint batch completo (líneas 1071-1173)
- [ ] Guardé el archivo
- [ ] Probé en el módulo Dedicados

---

## 🎯 RESULTADO ESPERADO:

1. ✅ **Primera carga**: Consulta las 26 placas (tarda ~5-10s)
2. ✅ **Segunda carga inmediata**: Usa caché (instantáneo)
3. ✅ **Después de 40s**: Vuelve a consultar las que expiraron
4. ✅ **Error 109**: Usa caché viejo automáticamente
5. ✅ **26 unidades visibles** con datos GPS reales

---

## 📊 LOGS ESPERADOS:

```
[WIDETECH BATCH] 🚛 Consultando 26 unidades...
[WIDETECH] 🔍 Placa: 777
[WIDETECH] 🌐 CONSULTANDO API para 777
[WIDETECH] 📥 Response status: 200 para placa 777
[WIDETECH BATCH] ✅ 777: 19.40053, -97.62264 | Guardado en cache
[WIDETECH] 🔍 Placa: 893
[WIDETECH] 💾 CACHE HIT para 893 (consultado hace 2s, quedan 38s para actualizar)
...
[WIDETECH BATCH] ✅ Exitosos: 26 | ❌ Fallidos: 0 | 💾 Cache: 20
```

---

## 🚀 PRÓXIMO PASO:

Después de hacer estos cambios, actualiza el componente frontend para:
- Mostrar indicador de "usando caché" 
- Botón "Actualizar" con contador de cooldown
- Tooltip que muestre edad del dato

¿Listo para probarlo? 🎯
