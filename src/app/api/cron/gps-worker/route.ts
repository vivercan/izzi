import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase config
const SUPABASE_URL = 'https://fbxbsslhewchyibdoyzk.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Google Maps API Key
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyBzElqSRGrJhkrBYrTGwxL0mb6v2pz4l64';

// Flota completa
const FLOTA = [
  {e:"167",emp:"TROB",seg:"INSTITUTO"},{e:"503",emp:"TROB",seg:"PATIOS"},{e:"505",emp:"TROB",seg:"CARROLL"},{e:"509",emp:"TROB",seg:"PATIOS"},{e:"511",emp:"TROB",seg:"BAFAR"},{e:"547",emp:"TROB",seg:"PATIOS"},{e:"575",emp:"TROB",seg:"MTTO"},{e:"587",emp:"TROB",seg:"MTTO"},{e:"589",emp:"TROB",seg:"PATIOS"},{e:"593",emp:"TROB",seg:"PATIOS"},{e:"629",emp:"TROB",seg:"MTTO"},{e:"643",emp:"TROB",seg:"CARROLL"},{e:"649",emp:"TROB",seg:"BAFAR"},{e:"651",emp:"TROB",seg:"BARCEL"},{e:"653",emp:"TROB",seg:"IMPEX"},{e:"657",emp:"TROB",seg:"IMPEX"},{e:"681",emp:"TROB",seg:"IMPEX"},{e:"699",emp:"TROB",seg:"IMPEX"},{e:"713",emp:"TROB",seg:"IMPEX"},{e:"717",emp:"TROB",seg:"IMPEX"},{e:"721",emp:"TROB",seg:"IMPEX"},{e:"727",emp:"TROB",seg:"CARROLL"},{e:"729",emp:"TROB",seg:"IMPEX"},{e:"731",emp:"TROB",seg:"CARROLL"},{e:"733",emp:"TROB",seg:"BAFAR"},{e:"735",emp:"TROB",seg:"BAFAR"},{e:"739",emp:"TROB",seg:"IMPEX"},{e:"741",emp:"TROB",seg:"IMPEX"},{e:"743",emp:"TROB",seg:"ACCIDENTE"},{e:"745",emp:"TROB",seg:"CARROLL"},{e:"747",emp:"TROB",seg:"ALPURA"},{e:"749",emp:"TROB",seg:"IMPEX"},{e:"751",emp:"TROB",seg:"IMPEX"},{e:"753",emp:"TROB",seg:"IMPEX"},{e:"757",emp:"TROB",seg:"IMPEX"},{e:"759",emp:"TROB",seg:"BAFAR"},{e:"761",emp:"TROB",seg:"IMPEX"},{e:"765",emp:"TROB",seg:"CARROLL"},{e:"767",emp:"TROB",seg:"ALPURA"},{e:"769",emp:"TROB",seg:"IMPEX"},{e:"771",emp:"TROB",seg:"IMPEX"},{e:"773",emp:"TROB",seg:"IMPEX"},{e:"777",emp:"TROB",seg:"CARROLL"},{e:"779",emp:"TROB",seg:"IMPEX"},{e:"781",emp:"TROB",seg:"IMPEX"},{e:"783",emp:"TROB",seg:"IMPEX"},{e:"785",emp:"TROB",seg:"IMPEX"},{e:"787",emp:"TROB",seg:"IMPEX"},{e:"789",emp:"TROB",seg:"IMPEX"},{e:"791",emp:"TROB",seg:"IMPEX"},{e:"797",emp:"TROB",seg:"IMPEX"},{e:"799",emp:"TROB",seg:"IMPEX"},{e:"801",emp:"TROB",seg:"CARROLL"},{e:"803",emp:"TROB",seg:"IMPEX"},{e:"807",emp:"TROB",seg:"BAFAR"},{e:"809",emp:"TROB",seg:"CARROLL"},{e:"811",emp:"TROB",seg:"IMPEX"},{e:"813",emp:"TROB",seg:"CARROLL"},{e:"815",emp:"TROB",seg:"BAFAR"},{e:"817",emp:"TROB",seg:"CARROLL"},{e:"819",emp:"TROB",seg:"IMPEX"},{e:"821",emp:"TROB",seg:"BAFAR"},{e:"823",emp:"TROB",seg:"ACCIDENTE"},{e:"825",emp:"TROB",seg:"BAFAR"},{e:"827",emp:"TROB",seg:"IMPEX"},{e:"831",emp:"TROB",seg:"IMPEX"},{e:"835",emp:"TROB",seg:"IMPEX"},{e:"837",emp:"TROB",seg:"CARROLL"},{e:"839",emp:"TROB",seg:"ALPURA"},{e:"841",emp:"TROB",seg:"CARROLL"},{e:"843",emp:"TROB",seg:"BAFAR"},{e:"845",emp:"TROB",seg:"IMPEX"},{e:"847",emp:"TROB",seg:"IMPEX"},{e:"849",emp:"TROB",seg:"IMPEX"},{e:"851",emp:"TROB",seg:"IMPEX"},{e:"853",emp:"TROB",seg:"IMPEX"},{e:"855",emp:"TROB",seg:"IMPEX"},{e:"857",emp:"TROB",seg:"ALPURA"},{e:"859",emp:"TROB",seg:"CARROLL"},{e:"861",emp:"TROB",seg:"CARROLL"},{e:"863",emp:"TROB",seg:"IMPEX"},{e:"865",emp:"TROB",seg:"MTTO"},{e:"867",emp:"TROB",seg:"IMPEX"},{e:"869",emp:"TROB",seg:"IMPEX"},{e:"871",emp:"TROB",seg:"IMPEX"},{e:"873",emp:"TROB",seg:"IMPEX"},{e:"875",emp:"TROB",seg:"ACCIDENTE"},{e:"877",emp:"TROB",seg:"IMPEX"},{e:"879",emp:"TROB",seg:"CARROLL"},{e:"883",emp:"TROB",seg:"IMPEX"},{e:"885",emp:"TROB",seg:"IMPEX"},{e:"887",emp:"TROB",seg:"IMPEX"},{e:"889",emp:"TROB",seg:"IMPEX"},{e:"891",emp:"TROB",seg:"CARROLL"},{e:"893",emp:"TROB",seg:"CARROLL"},{e:"895",emp:"TROB",seg:"BAFAR"},{e:"897",emp:"TROB",seg:"IMPEX"},{e:"899",emp:"TROB",seg:"CARROLL"},{e:"901",emp:"TROB",seg:"BAFAR"},{e:"903",emp:"TROB",seg:"BARCEL"},{e:"905",emp:"TROB",seg:"CARROLL"},{e:"907",emp:"TROB",seg:"BARCEL"},{e:"909",emp:"TROB",seg:"MTTO"},{e:"911",emp:"TROB",seg:"CARROLL"},{e:"913",emp:"TROB",seg:"IMPEX"},{e:"915",emp:"TROB",seg:"BARCEL"},{e:"917",emp:"TROB",seg:"BARCEL"},{e:"919",emp:"TROB",seg:"BARCEL"},{e:"921",emp:"TROB",seg:"PATIOS"},{e:"923",emp:"TROB",seg:"PATIOS"},{e:"925",emp:"TROB",seg:"BAFAR"},{e:"927",emp:"TROB",seg:"BARCEL"},{e:"929",emp:"TROB",seg:"ALPURA"},{e:"931",emp:"TROB",seg:"CARROLL"},{e:"933",emp:"TROB",seg:"CARROLL"},{e:"935",emp:"TROB",seg:"BARCEL"},{e:"937",emp:"TROB",seg:"CARROLL"},{e:"939",emp:"TROB",seg:"BARCEL"},{e:"941",emp:"TROB",seg:"BAFAR"},{e:"943",emp:"TROB",seg:"MTTO"},{e:"945",emp:"TROB",seg:"CARROLL"},{e:"947",emp:"TROB",seg:"IMPEX"},{e:"953",emp:"TROB",seg:"IMPEX"},{e:"955",emp:"TROB",seg:"ALPURA"},{e:"957",emp:"TROB",seg:"BAFAR"},{e:"959",emp:"TROB",seg:"BAFAR"},{e:"961",emp:"TROB",seg:"BAFAR"},{e:"963",emp:"TROB",seg:"IMPEX"},{e:"501",emp:"TROB",seg:"IMPEX"},{e:"507",emp:"TROB",seg:"IMPEX"},
  {e:"112",emp:"WE",seg:"IMPEX"},{e:"116",emp:"WE",seg:"IMPEX"},{e:"118",emp:"WE",seg:"CARROLL"},{e:"124",emp:"WE",seg:"IMPEX"},{e:"126",emp:"WE",seg:"MTTO"},{e:"128",emp:"WE",seg:"IMPEX"},{e:"130",emp:"WE",seg:"IMPEX"},{e:"134",emp:"WE",seg:"MTTO"},{e:"138",emp:"WE",seg:"IMPEX"},{e:"140",emp:"WE",seg:"IMPEX"},{e:"142",emp:"WE",seg:"IMPEX"},{e:"144",emp:"WE",seg:"IMPEX"},{e:"146",emp:"WE",seg:"IMPEX"},{e:"148",emp:"WE",seg:"CARROLL"},{e:"152",emp:"WE",seg:"IMPEX"},{e:"154",emp:"WE",seg:"IMPEX"},{e:"156",emp:"WE",seg:"ALPURA"},{e:"158",emp:"WE",seg:"IMPEX"},{e:"160",emp:"WE",seg:"IMPEX"},{e:"162",emp:"WE",seg:"BARCEL"},{e:"164",emp:"WE",seg:"IMPEX"},{e:"166",emp:"WE",seg:"IMPEX"},{e:"168",emp:"WE",seg:"IMPEX"},{e:"170",emp:"WE",seg:"ALPURA"},{e:"172",emp:"WE",seg:"IMPEX"},{e:"174",emp:"WE",seg:"IMPEX"},{e:"176",emp:"WE",seg:"IMPEX"},{e:"178",emp:"WE",seg:"CARROLL"},{e:"180",emp:"WE",seg:"IMPEX"},{e:"182",emp:"WE",seg:"IMPEX"},{e:"184",emp:"WE",seg:"IMPEX"},{e:"186",emp:"WE",seg:"IMPEX"},{e:"188",emp:"WE",seg:"IMPEX"},{e:"190",emp:"WE",seg:"ALPURA"},{e:"192",emp:"WE",seg:"IMPEX"},{e:"194",emp:"WE",seg:"IMPEX"},{e:"196",emp:"WE",seg:"IMPEX"},{e:"198",emp:"WE",seg:"ALPURA"},{e:"200",emp:"WE",seg:"IMPEX"},{e:"202",emp:"WE",seg:"IMPEX"},{e:"204",emp:"WE",seg:"ALPURA"},{e:"206",emp:"WE",seg:"IMPEX"},{e:"208",emp:"WE",seg:"CARROLL"},{e:"212",emp:"WE",seg:"CARROLL"},{e:"214",emp:"WE",seg:"CARROLL"},{e:"216",emp:"WE",seg:"IMPEX"},{e:"218",emp:"WE",seg:"IMPEX"},{e:"220",emp:"WE",seg:"IMPEX"},{e:"222",emp:"WE",seg:"IMPEX"},{e:"224",emp:"WE",seg:"IMPEX"},{e:"226",emp:"WE",seg:"IMPEX"},{e:"228",emp:"WE",seg:"IMPEX"},{e:"232",emp:"WE",seg:"IMPEX"},{e:"234",emp:"WE",seg:"ALPURA"},{e:"236",emp:"WE",seg:"ALPURA"},{e:"230",emp:"WE",seg:"PENDIENTE"},
  {e:"1",emp:"SHI",seg:"NatureSweet"},{e:"101",emp:"SHI",seg:"NatureSweet"},{e:"103",emp:"SHI",seg:"NatureSweet"},{e:"105",emp:"SHI",seg:"NatureSweet"},{e:"107",emp:"SHI",seg:"NatureSweet"},{e:"109",emp:"SHI",seg:"Pilgrims"},{e:"111",emp:"SHI",seg:"Pilgrims"},{e:"113",emp:"SHI",seg:"ACCIDENTE"},{e:"115",emp:"SHI",seg:"NatureSweet"},{e:"117",emp:"SHI",seg:"NatureSweet"},{e:"119",emp:"SHI",seg:"Pilgrims"},{e:"121",emp:"SHI",seg:"Pilgrims"},{e:"123",emp:"SHI",seg:"IMPEX"},{e:"125",emp:"SHI",seg:"Pilgrims"},{e:"689",emp:"SHI",seg:"NatureSweet"},{e:"129",emp:"SHI",seg:"Pilgrims"},{e:"131",emp:"SHI",seg:"IMPEX"},{e:"133",emp:"SHI",seg:"ACCIDENTE"},{e:"401",emp:"SHI",seg:"ALPURA"},{e:"405",emp:"SHI",seg:"NatureSweet"},{e:"409",emp:"SHI",seg:"Pilgrims"},{e:"413",emp:"SHI",seg:"IMPEX"},{e:"417",emp:"SHI",seg:"Pilgrims"},{e:"419",emp:"SHI",seg:"IMPEX"},{e:"431",emp:"SHI",seg:"Pilgrims"},{e:"433",emp:"SHI",seg:"PATIOS"},{e:"435",emp:"SHI",seg:"NatureSweet"},{e:"437",emp:"SHI",seg:"Pilgrims"},{e:"439",emp:"SHI",seg:"NatureSweet"},{e:"441",emp:"SHI",seg:"Pilgrims"},{e:"443",emp:"SHI",seg:"IMPEX"},{e:"445",emp:"SHI",seg:"NatureSweet"},{e:"449",emp:"SHI",seg:"NatureSweet"},
];

// Calcular distancia Haversine en km
function calcDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Geocoding con Google Maps
async function getAddress(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&language=es&key=${GOOGLE_MAPS_API_KEY}`
    );
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'OK' && data.results?.[0]) {
        const comps = data.results[0].address_components || [];
        let streetNumber = '', route = '', neighborhood = '', sublocality = '', locality = '', adminArea1 = '';
        
        for (const c of comps) {
          const types = c.types || [];
          if (types.includes('street_number')) streetNumber = c.long_name;
          if (types.includes('route')) route = c.long_name;
          if (types.includes('neighborhood')) neighborhood = c.long_name;
          if (types.includes('sublocality_level_1') || types.includes('sublocality')) sublocality = c.long_name;
          if (types.includes('locality')) locality = c.long_name;
          if (types.includes('administrative_area_level_1')) adminArea1 = c.short_name;
        }
        
        const parts: string[] = [];
        if (route) {
          const isHighway = /carretera|autopista|libramiento|federal/i.test(route);
          parts.push(isHighway ? route : (streetNumber ? `${route} #${streetNumber}` : route));
        }
        const colonia = neighborhood || sublocality;
        if (colonia && colonia !== route) parts.push(`Col. ${colonia}`);
        if (locality) parts.push(locality);
        if (adminArea1) parts.push(adminArea1);
        
        return parts.length > 0 ? parts.join(', ') : `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
      }
    }
  } catch {}
  return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
}

// Fetch batch de WideTech
async function fetchWideTechBatch(placas: string[]): Promise<any[]> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/functions/v1/make-server-d84b50bb/widetech/locations/batch`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        },
        body: JSON.stringify({ placas })
      }
    );
    if (res.ok) {
      const data = await res.json();
      return data.results || data.data || [];
    }
  } catch (e) {
    console.error('WideTech error:', e);
  }
  return [];
}

// Formatear tiempo parado
function formatStoppedTime(minutes: number): string {
  if (minutes < 1) return '-';
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
}

export async function GET(request: NextRequest) {
  // Verificar autorización (para cron de Vercel)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  // Permitir acceso si es cron de Vercel o si tiene el secret correcto
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // También permitir si viene de Vercel Cron
    const vercelCron = request.headers.get('x-vercel-cron');
    if (!vercelCron) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const startTime = Date.now();
  
  console.log('🚀 GPS Worker started at', new Date().toISOString());

  try {
    // Obtener datos actuales de la tabla
    const { data: currentData } = await supabase
      .from('gps_tracking')
      .select('economico, geofence_lat, geofence_lon, geofence_entry_time');
    
    const geofenceMap = new Map<string, { lat: number; lon: number; entryTime: string }>();
    if (currentData) {
      for (const row of currentData) {
        if (row.geofence_lat && row.geofence_lon && row.geofence_entry_time) {
          geofenceMap.set(row.economico, {
            lat: row.geofence_lat,
            lon: row.geofence_lon,
            entryTime: row.geofence_entry_time
          });
        }
      }
    }

    const placas = FLOTA.map(u => u.e);
    const batchSize = 10;
    let processed = 0;
    let updated = 0;

    for (let i = 0; i < placas.length; i += batchSize) {
      const batch = placas.slice(i, i + batchSize);
      const results = await fetchWideTechBatch(batch);
      
      const gpsMap = new Map<string, any>();
      for (const r of results) {
        if (r?.placa) gpsMap.set(r.placa, r);
      }

      for (const eco of batch) {
        const r = gpsMap.get(eco);
        const unit = FLOTA.find(u => u.e === eco);
        if (!unit) continue;

        const now = new Date().toISOString();
        let updateData: any = {
          economico: eco,
          empresa: unit.emp,
          segmento: unit.seg,
          timestamp_updated: now
        };

        if (r?.success && r?.location) {
          const { latitude: lat, longitude: lon, speed = 0, timestamp: ts } = r.location;
          
          if (lat && lon) {
            // Obtener dirección
            const address = await getAddress(lat, lon);
            
            // Calcular geocerca
            const existing = geofenceMap.get(eco);
            let geofenceLat = lat;
            let geofenceLon = lon;
            let geofenceEntry = now;
            let stoppedMinutes = 0;
            
            if (existing) {
              const distance = calcDistance(existing.lat, existing.lon, lat, lon);
              if (distance < 1) {
                // Dentro de la geocerca
                geofenceLat = existing.lat;
                geofenceLon = existing.lon;
                geofenceEntry = existing.entryTime;
                stoppedMinutes = Math.floor(
                  (new Date().getTime() - new Date(existing.entryTime).getTime()) / 60000
                );
              }
            }

            // Detectar anomalías
            let anomaly: string | null = null;
            let status = 'stopped';
            
            if (ts) {
              const hours = (Date.now() - new Date(ts.includes('/') ? ts.replace(/\//g, '-') : ts).getTime()) / 3600000;
              if (hours > 72) {
                anomaly = `GPS sin señal ${Math.floor(hours / 24)}d`;
                status = 'gps_issue';
              } else if (hours > 24) {
                anomaly = `GPS inactivo ${Math.floor(hours)}h`;
                status = 'gps_issue';
              } else if (speed > 3) {
                status = 'moving';
                stoppedMinutes = 0;
              }
            }

            updateData = {
              ...updateData,
              latitude: lat,
              longitude: lon,
              speed,
              address,
              timestamp_gps: ts,
              geofence_lat: geofenceLat,
              geofence_lon: geofenceLon,
              geofence_entry_time: geofenceEntry,
              stopped_minutes: stoppedMinutes,
              stopped_time: formatStoppedTime(stoppedMinutes),
              status,
              anomaly
            };
          }
        } else {
          updateData.status = 'no_signal';
        }

        // Upsert en Supabase
        const { error } = await supabase
          .from('gps_tracking')
          .upsert(updateData, { onConflict: 'economico' });

        if (!error) updated++;
        processed++;
      }

      // Pequeña pausa entre batches
      if (i + batchSize < placas.length) {
        await new Promise(r => setTimeout(r, 200));
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ GPS Worker completed: ${updated}/${processed} units in ${duration}s`);

    return NextResponse.json({
      success: true,
      processed,
      updated,
      duration: `${duration}s`,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ GPS Worker error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// También permitir POST para testing manual
export async function POST(request: NextRequest) {
  return GET(request);
}
