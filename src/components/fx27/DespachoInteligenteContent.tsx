'use client';

import { projectId, publicAnonKey } from '../../utils/supabase/info';
import React, { useState, useEffect, useCallback } from 'react';
import { Truck, Power, RefreshCw, Search, Download, WifiOff, Navigation, ExternalLink, Clock, AlertTriangle } from 'lucide-react';

// API Key desde variable de entorno
const ANTHROPIC_API_KEY = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || '';

// FLOTA 219 UNIDADES
const FLOTA_RAW: { e: string; emp: string; seg: string }[] = [
  {e:"167",emp:"TROB",seg:"INSTITUTO"},{e:"503",emp:"TROB",seg:"PATIOS"},{e:"505",emp:"TROB",seg:"CARROLL"},{e:"509",emp:"TROB",seg:"PATIOS"},{e:"511",emp:"TROB",seg:"BAFAR"},{e:"547",emp:"TROB",seg:"PATIOS"},{e:"575",emp:"TROB",seg:"MTTO"},{e:"587",emp:"TROB",seg:"MTTO"},{e:"589",emp:"TROB",seg:"PATIOS"},{e:"593",emp:"TROB",seg:"PATIOS"},{e:"629",emp:"TROB",seg:"MTTO"},{e:"643",emp:"TROB",seg:"CARROLL"},{e:"649",emp:"TROB",seg:"BAFAR"},{e:"651",emp:"TROB",seg:"BARCEL"},{e:"653",emp:"TROB",seg:"IMPEX"},{e:"657",emp:"TROB",seg:"IMPEX"},{e:"681",emp:"TROB",seg:"IMPEX"},{e:"699",emp:"TROB",seg:"IMPEX"},{e:"713",emp:"TROB",seg:"IMPEX"},{e:"717",emp:"TROB",seg:"IMPEX"},{e:"721",emp:"TROB",seg:"IMPEX"},{e:"727",emp:"TROB",seg:"CARROLL"},{e:"729",emp:"TROB",seg:"IMPEX"},{e:"731",emp:"TROB",seg:"CARROLL"},{e:"733",emp:"TROB",seg:"BAFAR"},{e:"735",emp:"TROB",seg:"BAFAR"},{e:"739",emp:"TROB",seg:"IMPEX"},{e:"741",emp:"TROB",seg:"IMPEX"},{e:"743",emp:"TROB",seg:"ACCIDENTE"},{e:"745",emp:"TROB",seg:"CARROLL"},{e:"747",emp:"TROB",seg:"ALPURA"},{e:"749",emp:"TROB",seg:"IMPEX"},{e:"751",emp:"TROB",seg:"IMPEX"},{e:"753",emp:"TROB",seg:"IMPEX"},{e:"757",emp:"TROB",seg:"IMPEX"},{e:"759",emp:"TROB",seg:"BAFAR"},{e:"761",emp:"TROB",seg:"IMPEX"},{e:"765",emp:"TROB",seg:"CARROLL"},{e:"767",emp:"TROB",seg:"ALPURA"},{e:"769",emp:"TROB",seg:"IMPEX"},{e:"771",emp:"TROB",seg:"IMPEX"},{e:"773",emp:"TROB",seg:"IMPEX"},{e:"777",emp:"TROB",seg:"CARROLL"},{e:"779",emp:"TROB",seg:"IMPEX"},{e:"781",emp:"TROB",seg:"IMPEX"},{e:"783",emp:"TROB",seg:"IMPEX"},{e:"785",emp:"TROB",seg:"IMPEX"},{e:"787",emp:"TROB",seg:"IMPEX"},{e:"789",emp:"TROB",seg:"IMPEX"},{e:"791",emp:"TROB",seg:"IMPEX"},{e:"797",emp:"TROB",seg:"IMPEX"},{e:"799",emp:"TROB",seg:"IMPEX"},{e:"801",emp:"TROB",seg:"CARROLL"},{e:"803",emp:"TROB",seg:"IMPEX"},{e:"807",emp:"TROB",seg:"BAFAR"},{e:"809",emp:"TROB",seg:"CARROLL"},{e:"811",emp:"TROB",seg:"IMPEX"},{e:"813",emp:"TROB",seg:"CARROLL"},{e:"815",emp:"TROB",seg:"BAFAR"},{e:"817",emp:"TROB",seg:"CARROLL"},{e:"819",emp:"TROB",seg:"IMPEX"},{e:"821",emp:"TROB",seg:"BAFAR"},{e:"823",emp:"TROB",seg:"ACCIDENTE"},{e:"825",emp:"TROB",seg:"BAFAR"},{e:"827",emp:"TROB",seg:"IMPEX"},{e:"831",emp:"TROB",seg:"IMPEX"},{e:"835",emp:"TROB",seg:"IMPEX"},{e:"837",emp:"TROB",seg:"CARROLL"},{e:"839",emp:"TROB",seg:"ALPURA"},{e:"841",emp:"TROB",seg:"CARROLL"},{e:"843",emp:"TROB",seg:"BAFAR"},{e:"845",emp:"TROB",seg:"IMPEX"},{e:"847",emp:"TROB",seg:"IMPEX"},{e:"849",emp:"TROB",seg:"IMPEX"},{e:"851",emp:"TROB",seg:"IMPEX"},{e:"853",emp:"TROB",seg:"IMPEX"},{e:"855",emp:"TROB",seg:"IMPEX"},{e:"857",emp:"TROB",seg:"ALPURA"},{e:"859",emp:"TROB",seg:"CARROLL"},{e:"861",emp:"TROB",seg:"CARROLL"},{e:"863",emp:"TROB",seg:"IMPEX"},{e:"865",emp:"TROB",seg:"MTTO"},{e:"867",emp:"TROB",seg:"IMPEX"},{e:"869",emp:"TROB",seg:"IMPEX"},{e:"871",emp:"TROB",seg:"IMPEX"},{e:"873",emp:"TROB",seg:"IMPEX"},{e:"875",emp:"TROB",seg:"ACCIDENTE"},{e:"877",emp:"TROB",seg:"IMPEX"},{e:"879",emp:"TROB",seg:"CARROLL"},{e:"883",emp:"TROB",seg:"IMPEX"},{e:"885",emp:"TROB",seg:"IMPEX"},{e:"887",emp:"TROB",seg:"IMPEX"},{e:"889",emp:"TROB",seg:"IMPEX"},{e:"891",emp:"TROB",seg:"CARROLL"},{e:"893",emp:"TROB",seg:"CARROLL"},{e:"895",emp:"TROB",seg:"BAFAR"},{e:"897",emp:"TROB",seg:"IMPEX"},{e:"899",emp:"TROB",seg:"CARROLL"},{e:"901",emp:"TROB",seg:"BAFAR"},{e:"903",emp:"TROB",seg:"BARCEL"},{e:"905",emp:"TROB",seg:"CARROLL"},{e:"907",emp:"TROB",seg:"BARCEL"},{e:"909",emp:"TROB",seg:"MTTO"},{e:"911",emp:"TROB",seg:"CARROLL"},{e:"913",emp:"TROB",seg:"IMPEX"},{e:"915",emp:"TROB",seg:"BARCEL"},{e:"917",emp:"TROB",seg:"BARCEL"},{e:"919",emp:"TROB",seg:"BARCEL"},{e:"921",emp:"TROB",seg:"PATIOS"},{e:"923",emp:"TROB",seg:"PATIOS"},{e:"925",emp:"TROB",seg:"BAFAR"},{e:"927",emp:"TROB",seg:"BARCEL"},{e:"929",emp:"TROB",seg:"ALPURA"},{e:"931",emp:"TROB",seg:"CARROLL"},{e:"933",emp:"TROB",seg:"CARROLL"},{e:"935",emp:"TROB",seg:"BARCEL"},{e:"937",emp:"TROB",seg:"CARROLL"},{e:"939",emp:"TROB",seg:"BARCEL"},{e:"941",emp:"TROB",seg:"BAFAR"},{e:"943",emp:"TROB",seg:"MTTO"},{e:"945",emp:"TROB",seg:"CARROLL"},{e:"947",emp:"TROB",seg:"IMPEX"},{e:"953",emp:"TROB",seg:"IMPEX"},{e:"955",emp:"TROB",seg:"ALPURA"},{e:"957",emp:"TROB",seg:"BAFAR"},{e:"959",emp:"TROB",seg:"BAFAR"},{e:"961",emp:"TROB",seg:"BAFAR"},{e:"963",emp:"TROB",seg:"IMPEX"},{e:"501",emp:"TROB",seg:"IMPEX"},{e:"507",emp:"TROB",seg:"IMPEX"},
  {e:"112",emp:"WE",seg:"IMPEX"},{e:"116",emp:"WE",seg:"IMPEX"},{e:"118",emp:"WE",seg:"CARROLL"},{e:"124",emp:"WE",seg:"IMPEX"},{e:"126",emp:"WE",seg:"MTTO"},{e:"128",emp:"WE",seg:"IMPEX"},{e:"130",emp:"WE",seg:"IMPEX"},{e:"134",emp:"WE",seg:"MTTO"},{e:"138",emp:"WE",seg:"IMPEX"},{e:"140",emp:"WE",seg:"IMPEX"},{e:"142",emp:"WE",seg:"IMPEX"},{e:"144",emp:"WE",seg:"IMPEX"},{e:"146",emp:"WE",seg:"IMPEX"},{e:"148",emp:"WE",seg:"CARROLL"},{e:"152",emp:"WE",seg:"IMPEX"},{e:"154",emp:"WE",seg:"IMPEX"},{e:"156",emp:"WE",seg:"ALPURA"},{e:"158",emp:"WE",seg:"IMPEX"},{e:"160",emp:"WE",seg:"IMPEX"},{e:"162",emp:"WE",seg:"BARCEL"},{e:"164",emp:"WE",seg:"IMPEX"},{e:"166",emp:"WE",seg:"IMPEX"},{e:"168",emp:"WE",seg:"IMPEX"},{e:"170",emp:"WE",seg:"ALPURA"},{e:"172",emp:"WE",seg:"IMPEX"},{e:"174",emp:"WE",seg:"IMPEX"},{e:"176",emp:"WE",seg:"IMPEX"},{e:"178",emp:"WE",seg:"CARROLL"},{e:"180",emp:"WE",seg:"IMPEX"},{e:"182",emp:"WE",seg:"IMPEX"},{e:"184",emp:"WE",seg:"IMPEX"},{e:"186",emp:"WE",seg:"IMPEX"},{e:"188",emp:"WE",seg:"IMPEX"},{e:"190",emp:"WE",seg:"ALPURA"},{e:"192",emp:"WE",seg:"IMPEX"},{e:"194",emp:"WE",seg:"IMPEX"},{e:"196",emp:"WE",seg:"IMPEX"},{e:"198",emp:"WE",seg:"ALPURA"},{e:"200",emp:"WE",seg:"IMPEX"},{e:"202",emp:"WE",seg:"IMPEX"},{e:"204",emp:"WE",seg:"ALPURA"},{e:"206",emp:"WE",seg:"IMPEX"},{e:"208",emp:"WE",seg:"CARROLL"},{e:"212",emp:"WE",seg:"CARROLL"},{e:"214",emp:"WE",seg:"CARROLL"},{e:"216",emp:"WE",seg:"IMPEX"},{e:"218",emp:"WE",seg:"IMPEX"},{e:"220",emp:"WE",seg:"IMPEX"},{e:"222",emp:"WE",seg:"IMPEX"},{e:"224",emp:"WE",seg:"IMPEX"},{e:"226",emp:"WE",seg:"IMPEX"},{e:"228",emp:"WE",seg:"IMPEX"},{e:"232",emp:"WE",seg:"IMPEX"},{e:"234",emp:"WE",seg:"ALPURA"},{e:"236",emp:"WE",seg:"ALPURA"},{e:"230",emp:"WE",seg:"PENDIENTE"},
  {e:"1",emp:"SHI",seg:"NatureSweet"},{e:"101",emp:"SHI",seg:"NatureSweet"},{e:"103",emp:"SHI",seg:"NatureSweet"},{e:"105",emp:"SHI",seg:"NatureSweet"},{e:"107",emp:"SHI",seg:"NatureSweet"},{e:"109",emp:"SHI",seg:"Pilgrims"},{e:"111",emp:"SHI",seg:"Pilgrims"},{e:"113",emp:"SHI",seg:"ACCIDENTE"},{e:"115",emp:"SHI",seg:"NatureSweet"},{e:"117",emp:"SHI",seg:"NatureSweet"},{e:"119",emp:"SHI",seg:"Pilgrims"},{e:"121",emp:"SHI",seg:"Pilgrims"},{e:"123",emp:"SHI",seg:"IMPEX"},{e:"125",emp:"SHI",seg:"Pilgrims"},{e:"689",emp:"SHI",seg:"NatureSweet"},{e:"129",emp:"SHI",seg:"Pilgrims"},{e:"131",emp:"SHI",seg:"IMPEX"},{e:"133",emp:"SHI",seg:"ACCIDENTE"},{e:"401",emp:"SHI",seg:"ALPURA"},{e:"405",emp:"SHI",seg:"NatureSweet"},{e:"409",emp:"SHI",seg:"Pilgrims"},{e:"413",emp:"SHI",seg:"IMPEX"},{e:"417",emp:"SHI",seg:"Pilgrims"},{e:"419",emp:"SHI",seg:"IMPEX"},{e:"431",emp:"SHI",seg:"Pilgrims"},{e:"433",emp:"SHI",seg:"PATIOS"},{e:"435",emp:"SHI",seg:"NatureSweet"},{e:"437",emp:"SHI",seg:"Pilgrims"},{e:"439",emp:"SHI",seg:"NatureSweet"},{e:"441",emp:"SHI",seg:"Pilgrims"},{e:"443",emp:"SHI",seg:"IMPEX"},{e:"445",emp:"SHI",seg:"NatureSweet"},{e:"449",emp:"SHI",seg:"NatureSweet"},
];

const FLOTA = FLOTA_RAW.map(u => ({ economico: u.e, empresa: u.emp, segmento: u.seg }));
const SEGMENTOS = ['IMPEX', 'CARROLL', 'BAFAR', 'NatureSweet', 'Pilgrims', 'ALPURA', 'BARCEL', 'MTTO', 'PATIOS', 'ACCIDENTE', 'INSTITUTO', 'PENDIENTE'];

interface Unit {
  economico: string;
  empresa: string;
  segmento: string;
  latitude: number | null;
  longitude: number | null;
  speed: number | null;
  address: string;
  timestamp: string | null;
  stoppedTime: string;
  status: 'moving' | 'stopped' | 'no_signal' | 'loading' | 'pending' | 'gps_issue';
  anomaly: string | null;
}

interface GeofenceHistory {
  lat: number;
  lon: number;
  entryTime: Date;
}

const EMP_ORDER: Record<string, number> = { SHI: 1, TROB: 2, WE: 3 };

// Caches
const geoCache: Map<string, string> = new Map();
const geofenceHistory: Map<string, GeofenceHistory> = new Map();
const aiLocationCache: Map<string, string> = new Map();

// Calcular distancia Haversine en km
const calcDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

export default function DespachoInteligenteContent() {
  const [fleet, setFleet] = useState<Unit[]>([]);
  const [activeSegmento, setActiveSegmento] = useState('IMPEX');
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [search, setSearch] = useState('');
  const [statusF, setStatusF] = useState('ALL');
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [loadedSegmentos, setLoadedSegmentos] = useState<string[]>([]);

  useEffect(() => {
    setFleet(FLOTA.map(u => ({ 
      ...u, latitude: null, longitude: null, speed: null, address: '-', 
      timestamp: null, stoppedTime: '-', status: 'pending' as const, anomaly: null
    })));
  }, []);

  // IA: Obtener ubicación detallada con Claude (AUTOMÁTICO)
  const getDetailedLocation = async (lat: number, lon: number): Promise<string> => {
    const key = `${lat.toFixed(4)},${lon.toFixed(4)}`;
    if (aiLocationCache.has(key)) return aiLocationCache.get(key)!;

    // Si no hay API key, usar BigDataCloud
    if (!ANTHROPIC_API_KEY) {
      return await getBasicLocation(lat, lon);
    }

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 100,
          messages: [{
            role: 'user',
            content: `Coordenadas México: ${lat}, ${lon}. Dame ubicación exacta en máximo 40 caracteres. Formato: "Lugar específico, Ciudad, Estado" o si es carretera "Carr. X Km Y, Estado". Solo la ubicación, nada más.`
          }]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const result = data.content[0]?.text?.trim() || '';
        if (result && result.length < 60) {
          aiLocationCache.set(key, result);
          return result;
        }
      }
    } catch (err) {
      console.log('AI error, using fallback');
    }
    
    return await getBasicLocation(lat, lon);
  };

  // Fallback: BigDataCloud
  const getBasicLocation = async (lat: number, lon: number): Promise<string> => {
    const key = `${lat.toFixed(3)},${lon.toFixed(3)}`;
    if (geoCache.has(key)) return geoCache.get(key)!;

    try {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=es`
      );
      
      if (response.ok) {
        const data = await response.json();
        const parts: string[] = [];
        if (data.locality) parts.push(data.locality);
        else if (data.city) parts.push(data.city);
        if (data.principalSubdivision) {
          const estado = data.principalSubdivision.replace('Estado de ', '');
          if (!parts.includes(estado)) parts.push(estado);
        }
        const result = parts.length > 0 ? parts.join(', ') : 'México';
        geoCache.set(key, result);
        return result;
      }
    } catch {}
    return 'México';
  };

  // Detectar anomalías de GPS
  const detectAnomaly = (timestamp: string | null): { anomaly: string | null; isGpsIssue: boolean } => {
    if (!timestamp) return { anomaly: 'Sin datos GPS', isGpsIssue: true };
    
    try {
      const date = new Date(timestamp.includes('/') ? timestamp.replace(/\//g, '-') : timestamp);
      const now = new Date();
      const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
      
      if (diffHours > 72) return { anomaly: `GPS sin señal ${Math.floor(diffHours / 24)}d`, isGpsIssue: true };
      if (diffHours > 24) return { anomaly: `GPS inactivo ${Math.floor(diffHours)}h`, isGpsIssue: true };
    } catch {}
    return { anomaly: null, isGpsIssue: false };
  };

  // Geocerca: calcular tiempo real detenido
  const updateGeofence = (eco: string, lat: number, lon: number): string => {
    const history = geofenceHistory.get(eco);
    const now = new Date();
    
    if (history) {
      const distance = calcDistance(history.lat, history.lon, lat, lon);
      
      if (distance < 1) {
        const diffMs = now.getTime() - history.entryTime.getTime();
        const mins = Math.floor(diffMs / 60000);
        const hours = Math.floor(mins / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days}d ${hours % 24}h`;
        if (hours > 0) return `${hours}h ${mins % 60}m`;
        if (mins > 0) return `${mins}m`;
        return '-';
      } else {
        geofenceHistory.set(eco, { lat, lon, entryTime: now });
        return '-';
      }
    } else {
      geofenceHistory.set(eco, { lat, lon, entryTime: now });
      return '-';
    }
  };

  const fetchBatch = async (placas: string[]) => {
    try {
      const r = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/widetech/locations/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${publicAnonKey}` },
        body: JSON.stringify({ placas })
      });
      if (!r.ok) return [];
      const j = await r.json();
      return j.results || j.data || [];
    } catch { return []; }
  };

  const fetchSegmento = useCallback(async (segmento: string) => {
    setLoading(true);
    const unitsToFetch = FLOTA.filter(u => u.segmento === segmento);
    const placas = unitsToFetch.map(u => u.economico);
    
    setFleet(prev => prev.map(u => u.segmento === segmento ? { ...u, status: 'loading' as const } : u));
    
    const batches: string[][] = [];
    for (let i = 0; i < placas.length; i += 5) batches.push(placas.slice(i, i + 5));
    setProgress({ current: 0, total: placas.length });

    for (let i = 0; i < batches.length; i++) {
      const res = await fetchBatch(batches[i]);
      setProgress({ current: Math.min((i + 1) * 5, placas.length), total: placas.length });

      for (const g of res) {
        const placa = g?.placa;
        if (!placa) continue;

        if (g.success && g.location) {
          const l = g.location;
          const lat = l.latitude;
          const lon = l.longitude;
          const hasCoords = lat && lon;
          const speed = l.speed || 0;
          const isMoving = speed > 3;
          const ts = l.timestamp;
          
          // Detectar anomalías
          const { anomaly, isGpsIssue } = detectAnomaly(ts);
          
          // Status
          let status: Unit['status'] = 'no_signal';
          if (isGpsIssue) {
            status = 'gps_issue';
          } else if (hasCoords) {
            status = isMoving ? 'moving' : 'stopped';
          }
          
          // Ubicación detallada con IA (AUTOMÁTICO)
          let address = '-';
          if (hasCoords && !isGpsIssue) {
            address = await getDetailedLocation(lat, lon);
          }
          
          // Tiempo en geocerca
          let stoppedTime = '-';
          if (hasCoords && !isMoving && !isGpsIssue) {
            stoppedTime = updateGeofence(placa, lat, lon);
          }

          setFleet(prev => prev.map(u => 
            u.economico === placa ? {
              ...u, latitude: lat, longitude: lon, speed, address, timestamp: ts,
              stoppedTime, status, anomaly
            } : u
          ));
        } else {
          setFleet(prev => prev.map(u => 
            u.economico === placa ? { 
              ...u, status: 'no_signal' as const, address: '-', stoppedTime: '-',
              anomaly: 'Sin respuesta WideTech'
            } : u
          ));
        }
      }

      if (i < batches.length - 1) await new Promise(r => setTimeout(r, 300));
    }

    setFleet(prev => prev.map(u => 
      u.segmento === segmento && u.status === 'loading' ? { ...u, status: 'no_signal' as const } : u
    ));

    setLoadedSegmentos(prev => prev.includes(segmento) ? prev : [...prev, segmento]);
    setLastRefresh(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (fleet.length > 0 && !loadedSegmentos.includes('IMPEX') && !loading) {
      fetchSegmento('IMPEX');
    }
  }, [fleet.length, loadedSegmentos, loading, fetchSegmento]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && loadedSegmentos.includes(activeSegmento)) {
        fetchSegmento(activeSegmento);
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [activeSegmento, loading, loadedSegmentos, fetchSegmento]);

  const handleSegmentoClick = (seg: string) => {
    setActiveSegmento(seg);
    if (!loadedSegmentos.includes(seg) && !loading) {
      fetchSegmento(seg);
    }
  };

  const segmentoUnits = fleet.filter(u => u.segmento === activeSegmento);
  
  const filtered = segmentoUnits.filter(u => {
    if (search && !u.economico.includes(search)) return false;
    if (statusF === 'moving' && u.status !== 'moving') return false;
    if (statusF === 'stopped' && u.status !== 'stopped') return false;
    if (statusF === 'no_signal' && u.status !== 'no_signal' && u.status !== 'gps_issue' && u.status !== 'pending') return false;
    return true;
  }).sort((a, b) => (EMP_ORDER[a.empresa] || 9) - (EMP_ORDER[b.empresa] || 9) || parseInt(a.economico) - parseInt(b.economico));

  const segStats = {
    total: segmentoUnits.length,
    mov: segmentoUnits.filter(u => u.status === 'moving').length,
    det: segmentoUnits.filter(u => u.status === 'stopped').length,
    sin: segmentoUnits.filter(u => u.status === 'no_signal' || u.status === 'pending' || u.status === 'gps_issue').length,
    anomalies: segmentoUnits.filter(u => u.anomaly).length
  };

  const openMap = (u: Unit) => u.latitude && window.open(`https://www.google.com/maps?q=${u.latitude},${u.longitude}`, '_blank');

  const exportCSV = () => {
    const rows = [['Eco', 'Empresa', 'Segmento', 'Status', 'Tiempo Parado', 'Velocidad', 'Ubicación', 'Anomalía', 'Lat', 'Lon', 'Última Señal']];
    filtered.forEach(u => rows.push([u.economico, u.empresa, u.segmento, u.status, u.stoppedTime, String(u.speed || 0), u.address, u.anomaly || '', String(u.latitude || ''), String(u.longitude || ''), u.timestamp || '']));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `GPS_${activeSegmento}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const fmtTs = (t: string | null) => {
    if (!t) return '-';
    try {
      const d = new Date(t.includes('/') ? t.replace(/\//g, '-') : t);
      return d.toLocaleString('es-MX', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch { return t; }
  };

  const getStoppedColor = (time: string) => {
    if (!time || time === '-') return 'text-slate-500';
    if (time.includes('d')) return 'text-red-400';
    if (time.includes('h')) {
      const h = parseInt(time);
      if (h >= 8) return 'text-red-400';
      if (h >= 4) return 'text-orange-400';
    }
    return 'text-yellow-400';
  };

  const getStatusColor = (status: Unit['status']) => {
    switch(status) {
      case 'moving': return 'bg-green-500/20 text-green-400';
      case 'stopped': return 'bg-yellow-500/20 text-yellow-400';
      case 'gps_issue': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-red-500/20 text-red-400';
    }
  };

  return (
    <div className="min-h-screen p-4" style={{ background: 'linear-gradient(180deg, #1a365d 0%, #0f172a 100%)' }}>
      
      {/* TABS */}
      <div className="flex flex-wrap gap-2 mb-4">
        {SEGMENTOS.map(seg => {
          const count = FLOTA.filter(u => u.segmento === seg).length;
          if (count === 0) return null;
          const isLoaded = loadedSegmentos.includes(seg);
          const isActive = activeSegmento === seg;
          
          return (
            <button key={seg} onClick={() => handleSegmentoClick(seg)} disabled={loading && !isActive}
              className={`h-9 px-4 rounded-xl text-sm font-semibold transition-all ${isActive ? 'bg-gradient-to-b from-blue-500 to-blue-700 text-white shadow-lg' : isLoaded ? 'bg-slate-600/80 text-white hover:bg-slate-500/80' : 'bg-slate-700/60 text-slate-400 hover:bg-slate-600/60'}`}
              style={{ boxShadow: isActive ? '0 4px 12px rgba(59,130,246,0.4)' : 'none' }}>
              {seg} ({count}){isLoaded && !isActive && <span className="ml-1 text-green-400">✓</span>}
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 p-3 rounded-2xl bg-slate-800/60" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
        <button onClick={() => setStatusF('ALL')} className={`h-10 px-4 rounded-xl font-semibold text-sm flex items-center gap-2 ${statusF === 'ALL' ? 'bg-gradient-to-b from-slate-500 to-slate-700 text-white' : 'bg-slate-700/80 text-slate-300'}`}>
          <Truck className="w-4 h-4" />{segStats.total}
        </button>
        <button onClick={() => setStatusF('moving')} className={`h-10 px-4 rounded-xl font-semibold text-sm flex items-center gap-2 ${statusF === 'moving' ? 'bg-gradient-to-b from-green-500 to-green-700 text-white' : 'bg-slate-700/80 text-slate-300'}`}>
          <Navigation className="w-4 h-4" />{segStats.mov}
        </button>
        <button onClick={() => setStatusF('stopped')} className={`h-10 px-4 rounded-xl font-semibold text-sm flex items-center gap-2 ${statusF === 'stopped' ? 'bg-gradient-to-b from-yellow-500 to-yellow-600 text-white' : 'bg-slate-700/80 text-slate-300'}`}>
          <Power className="w-4 h-4" />{segStats.det}
        </button>
        <button onClick={() => setStatusF('no_signal')} className={`h-10 px-4 rounded-xl font-semibold text-sm flex items-center gap-2 ${statusF === 'no_signal' ? 'bg-gradient-to-b from-red-500 to-red-700 text-white' : 'bg-slate-700/80 text-slate-300'}`}>
          <WifiOff className="w-4 h-4" />{segStats.sin}
        </button>
        
        {segStats.anomalies > 0 && (
          <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-purple-500/20 text-purple-300 text-sm">
            <AlertTriangle className="w-4 h-4" />
            {segStats.anomalies} GPS
          </div>
        )}

        <div className="w-px h-8 bg-slate-600/50" />
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Eco..." className="h-10 w-24 pl-9 pr-3 rounded-xl bg-slate-700/60 border border-slate-600/50 text-white text-sm placeholder-slate-400 focus:outline-none" />
        </div>

        <div className="flex-1" />

        {lastRefresh && <span className="text-slate-500 text-xs">{lastRefresh.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>}

        <button onClick={exportCSV} className="h-10 w-10 flex items-center justify-center rounded-xl bg-gradient-to-b from-slate-600 to-slate-800 text-slate-300 hover:opacity-80">
          <Download className="w-4 h-4" />
        </button>

        <button onClick={() => fetchSegmento(activeSegmento)} disabled={loading} className={`h-10 px-4 rounded-xl font-semibold text-sm flex items-center gap-2 ${loading ? 'bg-gradient-to-b from-orange-500 to-orange-700' : 'bg-gradient-to-b from-blue-500 to-blue-700'} text-white`}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? `${progress.current}/${progress.total}` : 'Actualizar'}
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden bg-slate-800/40" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
        <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-slate-900/95 z-10">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-semibold text-slate-400 uppercase w-16">ECO</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-slate-400 uppercase w-16">EMP</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-slate-400 uppercase w-20">STATUS</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-slate-400 uppercase w-20">PARADO</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-slate-400 uppercase w-12">VEL</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-slate-400 uppercase">UBICACIÓN</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-slate-400 uppercase w-28">SEÑAL</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.economico} className={`border-t border-slate-700/30 hover:bg-slate-700/20 ${u.anomaly ? 'bg-purple-900/10' : ''}`}>
                  <td className="px-3 py-2 font-mono font-bold text-white">
                    {u.economico}
                    {u.anomaly && <AlertTriangle className="w-3 h-3 text-purple-400 inline ml-1" />}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${u.empresa === 'SHI' ? 'bg-purple-500/20 text-purple-300' : u.empresa === 'TROB' ? 'bg-blue-500/20 text-blue-300' : 'bg-emerald-500/20 text-emerald-300'}`}>{u.empresa}</span>
                  </td>
                  <td className="px-3 py-2">
                    <button onClick={() => openMap(u)} disabled={!u.latitude} className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${getStatusColor(u.status)} ${u.latitude ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed opacity-60'}`}>
                      {u.status === 'moving' ? <Navigation className="w-3 h-3" /> : u.status === 'stopped' ? <Power className="w-3 h-3" /> : u.status === 'gps_issue' ? <AlertTriangle className="w-3 h-3" /> : u.status === 'loading' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <WifiOff className="w-3 h-3" />}
                      {u.status === 'moving' ? 'Mov' : u.status === 'stopped' ? 'Det' : u.status === 'gps_issue' ? 'GPS!' : u.status === 'loading' ? '...' : 'Sin'}
                      {u.latitude && <ExternalLink className="w-2.5 h-2.5" />}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`text-sm font-semibold flex items-center gap-1 ${getStoppedColor(u.stoppedTime)}`}>
                      {u.stoppedTime !== '-' && <Clock className="w-3 h-3" />}
                      {u.stoppedTime}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`text-sm font-semibold ${(u.speed || 0) > 0 ? 'text-green-400' : 'text-slate-500'}`}>{u.speed ?? '-'}</span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-col">
                      <span className="text-slate-300 text-sm truncate max-w-[300px]">{u.address}</span>
                      {u.anomaly && <span className="text-purple-400 text-xs">{u.anomaly}</span>}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-slate-500 text-xs">{fmtTs(u.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
