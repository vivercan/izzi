import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fbxbsslhewchyibdoyzk.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyBzElqSRGrJhkrBYrTGwxL0mb6v2pz4l64';

const FLOTA = [
  {e:"167",emp:"TROB",seg:"INSTITUTO"},{e:"503",emp:"TROB",seg:"PATIOS"},{e:"505",emp:"TROB",seg:"CARROLL"},{e:"509",emp:"TROB",seg:"PATIOS"},{e:"511",emp:"TROB",seg:"BAFAR"},{e:"547",emp:"TROB",seg:"PATIOS"},{e:"575",emp:"TROB",seg:"MTTO"},{e:"587",emp:"TROB",seg:"MTTO"},{e:"589",emp:"TROB",seg:"PATIOS"},{e:"593",emp:"TROB",seg:"PATIOS"},{e:"629",emp:"TROB",seg:"MTTO"},{e:"643",emp:"TROB",seg:"CARROLL"},{e:"649",emp:"TROB",seg:"BAFAR"},{e:"651",emp:"TROB",seg:"BARCEL"},{e:"653",emp:"TROB",seg:"IMPEX"},{e:"657",emp:"TROB",seg:"IMPEX"},{e:"681",emp:"TROB",seg:"IMPEX"},{e:"699",emp:"TROB",seg:"IMPEX"},{e:"713",emp:"TROB",seg:"IMPEX"},{e:"717",emp:"TROB",seg:"IMPEX"},{e:"721",emp:"TROB",seg:"IMPEX"},{e:"727",emp:"TROB",seg:"CARROLL"},{e:"729",emp:"TROB",seg:"IMPEX"},{e:"731",emp:"TROB",seg:"CARROLL"},{e:"733",emp:"TROB",seg:"BAFAR"},{e:"735",emp:"TROB",seg:"BAFAR"},{e:"739",emp:"TROB",seg:"IMPEX"},{e:"741",emp:"TROB",seg:"IMPEX"},{e:"743",emp:"TROB",seg:"ACCIDENTE"},{e:"745",emp:"TROB",seg:"CARROLL"},{e:"747",emp:"TROB",seg:"ALPURA"},{e:"749",emp:"TROB",seg:"IMPEX"},{e:"751",emp:"TROB",seg:"IMPEX"},{e:"753",emp:"TROB",seg:"IMPEX"},{e:"757",emp:"TROB",seg:"IMPEX"},{e:"759",emp:"TROB",seg:"BAFAR"},{e:"761",emp:"TROB",seg:"IMPEX"},{e:"765",emp:"TROB",seg:"CARROLL"},{e:"767",emp:"TROB",seg:"ALPURA"},{e:"769",emp:"TROB",seg:"IMPEX"},{e:"771",emp:"TROB",seg:"IMPEX"},{e:"773",emp:"TROB",seg:"IMPEX"},{e:"777",emp:"TROB",seg:"CARROLL"},{e:"779",emp:"TROB",seg:"IMPEX"},{e:"781",emp:"TROB",seg:"IMPEX"},{e:"783",emp:"TROB",seg:"IMPEX"},{e:"785",emp:"TROB",seg:"IMPEX"},{e:"787",emp:"TROB",seg:"IMPEX"},{e:"789",emp:"TROB",seg:"IMPEX"},{e:"791",emp:"TROB",seg:"IMPEX"},{e:"797",emp:"TROB",seg:"IMPEX"},{e:"799",emp:"TROB",seg:"IMPEX"},{e:"801",emp:"TROB",seg:"CARROLL"},{e:"803",emp:"TROB",seg:"IMPEX"},{e:"807",emp:"TROB",seg:"BAFAR"},{e:"809",emp:"TROB",seg:"CARROLL"},{e:"811",emp:"TROB",seg:"IMPEX"},{e:"813",emp:"TROB",seg:"CARROLL"},{e:"815",emp:"TROB",seg:"BAFAR"},{e:"817",emp:"TROB",seg:"CARROLL"},{e:"819",emp:"TROB",seg:"IMPEX"},{e:"821",emp:"TROB",seg:"BAFAR"},{e:"823",emp:"TROB",seg:"ACCIDENTE"},{e:"825",emp:"TROB",seg:"BAFAR"},{e:"827",emp:"TROB",seg:"IMPEX"},{e:"831",emp:"TROB",seg:"IMPEX"},{e:"835",emp:"TROB",seg:"IMPEX"},{e:"837",emp:"TROB",seg:"CARROLL"},{e:"839",emp:"TROB",seg:"ALPURA"},{e:"841",emp:"TROB",seg:"CARROLL"},{e:"843",emp:"TROB",seg:"BAFAR"},{e:"845",emp:"TROB",seg:"IMPEX"},{e:"847",emp:"TROB",seg:"IMPEX"},{e:"849",emp:"TROB",seg:"IMPEX"},{e:"851",emp:"TROB",seg:"IMPEX"},{e:"853",emp:"TROB",seg:"IMPEX"},{e:"855",emp:"TROB",seg:"IMPEX"},{e:"857",emp:"TROB",seg:"ALPURA"},{e:"859",emp:"TROB",seg:"CARROLL"},{e:"861",emp:"TROB",seg:"CARROLL"},{e:"863",emp:"TROB",seg:"IMPEX"},{e:"865",emp:"TROB",seg:"MTTO"},{e:"867",emp:"TROB",seg:"IMPEX"},{e:"869",emp:"TROB",seg:"IMPEX"},{e:"871",emp:"TROB",seg:"IMPEX"},{e:"873",emp:"TROB",seg:"IMPEX"},{e:"875",emp:"TROB",seg:"ACCIDENTE"},{e:"877",emp:"TROB",seg:"IMPEX"},{e:"879",emp:"TROB",seg:"CARROLL"},{e:"883",emp:"TROB",seg:"IMPEX"},{e:"885",emp:"TROB",seg:"IMPEX"},{e:"887",emp:"TROB",seg:"IMPEX"},{e:"889",emp:"TROB",seg:"IMPEX"},{e:"891",emp:"TROB",seg:"CARROLL"},{e:"893",emp:"TROB",seg:"CARROLL"},{e:"895",emp:"TROB",seg:"BAFAR"},{e:"897",emp:"TROB",seg:"IMPEX"},{e:"899",emp:"TROB",seg:"CARROLL"},{e:"901",emp:"TROB",seg:"BAFAR"},{e:"903",emp:"TROB",seg:"BARCEL"},{e:"905",emp:"TROB",seg:"CARROLL"},{e:"907",emp:"TROB",seg:"BARCEL"},{e:"909",emp:"TROB",seg:"MTTO"},{e:"911",emp:"TROB",seg:"CARROLL"},{e:"913",emp:"TROB",seg:"IMPEX"},{e:"915",emp:"TROB",seg:"BARCEL"},{e:"917",emp:"TROB",seg:"BARCEL"},{e:"919",emp:"TROB",seg:"BARCEL"},{e:"921",emp:"TROB",seg:"PATIOS"},{e:"923",emp:"TROB",seg:"PATIOS"},{e:"925",emp:"TROB",seg:"BAFAR"},{e:"927",emp:"TROB",seg:"BARCEL"},{e:"929",emp:"TROB",seg:"ALPURA"},{e:"931",emp:"TROB",seg:"CARROLL"},{e:"933",emp:"TROB",seg:"CARROLL"},{e:"935",emp:"TROB",seg:"BARCEL"},{e:"937",emp:"TROB",seg:"CARROLL"},{e:"939",emp:"TROB",seg:"BARCEL"},{e:"941",emp:"TROB",seg:"BAFAR"},{e:"943",emp:"TROB",seg:"MTTO"},{e:"945",emp:"TROB",seg:"CARROLL"},{e:"947",emp:"TROB",seg:"IMPEX"},{e:"953",emp:"TROB",seg:"IMPEX"},{e:"955",emp:"TROB",seg:"ALPURA"},{e:"957",emp:"TROB",seg:"BAFAR"},{e:"959",emp:"TROB",seg:"BAFAR"},{e:"961",emp:"TROB",seg:"BAFAR"},{e:"963",emp:"TROB",seg:"IMPEX"},{e:"501",emp:"TROB",seg:"IMPEX"},{e:"507",emp:"TROB",seg:"IMPEX"},
  {e:"112",emp:"WE",seg:"IMPEX"},{e:"116",emp:"WE",seg:"IMPEX"},{e:"118",emp:"WE",seg:"CARROLL"},{e:"124",emp:"WE",seg:"IMPEX"},{e:"126",emp:"WE",seg:"MTTO"},{e:"128",emp:"WE",seg:"IMPEX"},{e:"130",emp:"WE",seg:"IMPEX"},{e:"134",emp:"WE",seg:"MTTO"},{e:"138",emp:"WE",seg:"IMPEX"},{e:"140",emp:"WE",seg:"IMPEX"},{e:"142",emp:"WE",seg:"IMPEX"},{e:"144",emp:"WE",seg:"IMPEX"},{e:"146",emp:"WE",seg:"IMPEX"},{e:"148",emp:"WE",seg:"CARROLL"},{e:"152",emp:"WE",seg:"IMPEX"},{e:"154",emp:"WE",seg:"IMPEX"},{e:"156",emp:"WE",seg:"ALPURA"},{e:"158",emp:"WE",seg:"IMPEX"},{e:"160",emp:"WE",seg:"IMPEX"},{e:"162",emp:"WE",seg:"BARCEL"},{e:"164",emp:"WE",seg:"IMPEX"},{e:"166",emp:"WE",seg:"IMPEX"},{e:"168",emp:"WE",seg:"IMPEX"},{e:"170",emp:"WE",seg:"ALPURA"},{e:"172",emp:"WE",seg:"IMPEX"},{e:"174",emp:"WE",seg:"IMPEX"},{e:"176",emp:"WE",seg:"IMPEX"},{e:"178",emp:"WE",seg:"CARROLL"},{e:"180",emp:"WE",seg:"IMPEX"},{e:"182",emp:"WE",seg:"IMPEX"},{e:"184",emp:"WE",seg:"IMPEX"},{e:"186",emp:"WE",seg:"IMPEX"},{e:"188",emp:"WE",seg:"IMPEX"},{e:"190",emp:"WE",seg:"ALPURA"},{e:"192",emp:"WE",seg:"IMPEX"},{e:"194",emp:"WE",seg:"IMPEX"},{e:"196",emp:"WE",seg:"IMPEX"},{e:"198",emp:"WE",seg:"ALPURA"},{e:"200",emp:"WE",seg:"IMPEX"},{e:"202",emp:"WE",seg:"IMPEX"},{e:"204",emp:"WE",seg:"ALPURA"},{e:"206",emp:"WE",seg:"IMPEX"},{e:"208",emp:"WE",seg:"CARROLL"},{e:"212",emp:"WE",seg:"CARROLL"},{e:"214",emp:"WE",seg:"CARROLL"},{e:"216",emp:"WE",seg:"IMPEX"},{e:"218",emp:"WE",seg:"IMPEX"},{e:"220",emp:"WE",seg:"IMPEX"},{e:"222",emp:"WE",seg:"IMPEX"},{e:"224",emp:"WE",seg:"IMPEX"},{e:"226",emp:"WE",seg:"IMPEX"},{e:"228",emp:"WE",seg:"IMPEX"},{e:"232",emp:"WE",seg:"IMPEX"},{e:"234",emp:"WE",seg:"ALPURA"},{e:"236",emp:"WE",seg:"ALPURA"},{e:"230",emp:"WE",seg:"PENDIENTE"},
  {e:"1",emp:"SHI",seg:"NatureSweet"},{e:"101",emp:"SHI",seg:"NatureSweet"},{e:"103",emp:"SHI",seg:"NatureSweet"},{e:"105",emp:"SHI",seg:"NatureSweet"},{e:"107",emp:"SHI",seg:"NatureSweet"},{e:"109",emp:"SHI",seg:"Pilgrims"},{e:"111",emp:"SHI",seg:"Pilgrims"},{e:"113",emp:"SHI",seg:"ACCIDENTE"},{e:"115",emp:"SHI",seg:"NatureSweet"},{e:"117",emp:"SHI",seg:"NatureSweet"},{e:"119",emp:"SHI",seg:"Pilgrims"},{e:"121",emp:"SHI",seg:"Pilgrims"},{e:"123",emp:"SHI",seg:"IMPEX"},{e:"125",emp:"SHI",seg:"Pilgrims"},{e:"689",emp:"SHI",seg:"NatureSweet"},{e:"129",emp:"SHI",seg:"Pilgrims"},{e:"131",emp:"SHI",seg:"IMPEX"},{e:"133",emp:"SHI",seg:"ACCIDENTE"},{e:"401",emp:"SHI",seg:"ALPURA"},{e:"405",emp:"SHI",seg:"NatureSweet"},{e:"409",emp:"SHI",seg:"Pilgrims"},{e:"413",emp:"SHI",seg:"IMPEX"},{e:"417",emp:"SHI",seg:"Pilgrims"},{e:"419",emp:"SHI",seg:"IMPEX"},{e:"431",emp:"SHI",seg:"Pilgrims"},{e:"433",emp:"SHI",seg:"PATIOS"},{e:"435",emp:"SHI",seg:"NatureSweet"},{e:"437",emp:"SHI",seg:"Pilgrims"},{e:"439",emp:"SHI",seg:"NatureSweet"},{e:"441",emp:"SHI",seg:"Pilgrims"},{e:"443",emp:"SHI",seg:"IMPEX"},{e:"445",emp:"SHI",seg:"NatureSweet"},{e:"449",emp:"SHI",seg:"NatureSweet"},
];

function calcDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

async function getDetailedAddress(lat: number, lon: number): Promise<string> {
  try {
    // Primero intentar con result_type específico para mejor detalle
    const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&language=es&key=${GOOGLE_MAPS_API_KEY}`);
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    
    if (data.status === 'OK' && data.results?.length > 0) {
      // Buscar el resultado más detallado (street_address o route)
      let bestResult = data.results[0];
      for (const r of data.results) {
        if (r.types?.includes('street_address') || r.types?.includes('route') || r.types?.includes('premise')) {
          bestResult = r;
          break;
        }
      }
      
      const comps = bestResult.address_components || [];
      let streetNum = '', route = '', neighborhood = '', sublocality = '', locality = '', admin1 = '';
      
      for (const c of comps) {
        const t = c.types || [];
        if (t.includes('street_number')) streetNum = c.long_name;
        if (t.includes('route')) route = c.long_name;
        if (t.includes('neighborhood')) neighborhood = c.long_name;
        if (t.includes('sublocality_level_1') || t.includes('sublocality')) sublocality = c.long_name;
        if (t.includes('locality')) locality = c.long_name;
        if (t.includes('administrative_area_level_1')) admin1 = c.short_name;
      }
      
      const parts: string[] = [];
      
      // Calle con número
      if (route) {
        const isHwy = /carretera|autopista|libramiento|federal|estatal|blvd|boulevard|avenida|av\.|periférico|anillo/i.test(route);
        if (isHwy) {
          parts.push(streetNum && /^\d+$/.test(streetNum) ? `${route} Km ${streetNum}` : route);
        } else {
          parts.push(streetNum ? `${route} #${streetNum}` : route);
        }
      }
      
      // Colonia
      const col = neighborhood || sublocality;
      if (col && col !== route && !col.includes('Municipio')) {
        parts.push(`Col. ${col}`);
      }
      
      // Ciudad
      if (locality) {
        parts.push(locality.replace(/^Municipio de\s+/i, ''));
      }
      
      // Estado
      if (admin1) parts.push(admin1);
      
      if (parts.length > 0) return parts.join(', ');
    }
  } catch {}
  return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
}

async function fetchWideTech(placas: string[]): Promise<any[]> {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/make-server-d84b50bb/widetech/locations/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` },
      body: JSON.stringify({ placas })
    });
    if (res.ok) { const d = await res.json(); return d.results || d.data || []; }
  } catch {}
  return [];
}

function formatTime(mins: number): string {
  if (mins < 1) return '-';
  const h = Math.floor(mins / 60), d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h`;
  if (h > 0) return `${h}h ${mins % 60}m`;
  return `${mins}m`;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    const vc = request.headers.get('x-vercel-cron');
    if (!vc) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const start = Date.now();
  console.log('🚀 GPS Worker v2 started');

  try {
    const { data: curr } = await supabase.from('gps_tracking').select('economico, geofence_lat, geofence_lon, geofence_entry_time');
    const geoMap = new Map<string, { lat: number; lon: number; entry: string }>();
    if (curr) for (const r of curr) if (r.geofence_lat && r.geofence_lon && r.geofence_entry_time) geoMap.set(r.economico, { lat: r.geofence_lat, lon: r.geofence_lon, entry: r.geofence_entry_time });

    const placas = FLOTA.map(u => u.e);
    let processed = 0, updated = 0;

    for (let i = 0; i < placas.length; i += 10) {
      const batch = placas.slice(i, i + 10);
      const results = await fetchWideTech(batch);
      const gpsMap = new Map<string, any>();
      for (const r of results) if (r?.placa) gpsMap.set(r.placa, r);

      for (const eco of batch) {
        const r = gpsMap.get(eco);
        const unit = FLOTA.find(u => u.e === eco);
        if (!unit) continue;

        const now = new Date().toISOString();
        let upd: any = { economico: eco, empresa: unit.emp, segmento: unit.seg, timestamp_updated: now };

        if (r?.success && r?.location) {
          const { latitude: lat, longitude: lon, speed = 0, timestamp: ts } = r.location;
          if (lat && lon) {
            const address = await getDetailedAddress(lat, lon);
            const existing = geoMap.get(eco);
            let gLat = lat, gLon = lon, gEntry = now, stoppedMins = 0;
            
            if (existing && calcDistance(existing.lat, existing.lon, lat, lon) < 1) {
              gLat = existing.lat; gLon = existing.lon; gEntry = existing.entry;
              stoppedMins = Math.floor((Date.now() - new Date(existing.entry).getTime()) / 60000);
            }

            let anomaly: string | null = null, status = 'stopped';
            if (ts) {
              const hrs = (Date.now() - new Date(ts.includes('/') ? ts.replace(/\//g, '-') : ts).getTime()) / 3600000;
              if (hrs > 72) { anomaly = `GPS sin señal ${Math.floor(hrs / 24)}d`; status = 'gps_issue'; }
              else if (hrs > 24) { anomaly = `GPS inactivo ${Math.floor(hrs)}h`; status = 'gps_issue'; }
              else if (speed > 3) { status = 'moving'; stoppedMins = 0; }
            }

            upd = { ...upd, latitude: lat, longitude: lon, speed, address, timestamp_gps: ts, geofence_lat: gLat, geofence_lon: gLon, geofence_entry_time: gEntry, stopped_minutes: stoppedMins, stopped_time: formatTime(stoppedMins), status, anomaly };
          }
        } else {
          upd.status = 'no_signal';
        }

        const { error } = await supabase.from('gps_tracking').upsert(upd, { onConflict: 'economico' });
        if (!error) updated++;
        processed++;
      }
      if (i + 10 < placas.length) await new Promise(r => setTimeout(r, 300));
    }

    const dur = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`✅ GPS Worker v2: ${updated}/${processed} in ${dur}s`);
    return NextResponse.json({ success: true, processed, updated, duration: `${dur}s`, timestamp: new Date().toISOString() });
  } catch (e: any) {
    console.error('❌ GPS Worker error:', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) { return GET(req); }
