'use client';

import { projectId, publicAnonKey } from '../../utils/supabase/info';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Truck, Power, RefreshCw, Search, Download, WifiOff, Navigation, ExternalLink, Clock, AlertTriangle } from 'lucide-react';

// Google Maps API Key
const GOOGLE_MAPS_API_KEY = 'AIzaSyBzElqSRGrJhkrBYrTGwxL0mb6v2pz4l64';

const SEGMENTOS = ['IMPEX', 'CARROLL', 'BAFAR', 'NatureSweet', 'Pilgrims', 'ALPURA', 'BARCEL', 'MTTO', 'PATIOS', 'ACCIDENTE', 'INSTITUTO', 'PENDIENTE'];

const FLOTA_RAW: { e: string; emp: string; seg: string }[] = [
  {e:"167",emp:"TROB",seg:"INSTITUTO"},{e:"503",emp:"TROB",seg:"PATIOS"},{e:"505",emp:"TROB",seg:"CARROLL"},{e:"509",emp:"TROB",seg:"PATIOS"},{e:"511",emp:"TROB",seg:"BAFAR"},{e:"547",emp:"TROB",seg:"PATIOS"},{e:"575",emp:"TROB",seg:"MTTO"},{e:"587",emp:"TROB",seg:"MTTO"},{e:"589",emp:"TROB",seg:"PATIOS"},{e:"593",emp:"TROB",seg:"PATIOS"},{e:"629",emp:"TROB",seg:"MTTO"},{e:"643",emp:"TROB",seg:"CARROLL"},{e:"649",emp:"TROB",seg:"BAFAR"},{e:"651",emp:"TROB",seg:"BARCEL"},{e:"653",emp:"TROB",seg:"IMPEX"},{e:"657",emp:"TROB",seg:"IMPEX"},{e:"681",emp:"TROB",seg:"IMPEX"},{e:"699",emp:"TROB",seg:"IMPEX"},{e:"713",emp:"TROB",seg:"IMPEX"},{e:"717",emp:"TROB",seg:"IMPEX"},{e:"721",emp:"TROB",seg:"IMPEX"},{e:"727",emp:"TROB",seg:"CARROLL"},{e:"729",emp:"TROB",seg:"IMPEX"},{e:"731",emp:"TROB",seg:"CARROLL"},{e:"733",emp:"TROB",seg:"BAFAR"},{e:"735",emp:"TROB",seg:"BAFAR"},{e:"739",emp:"TROB",seg:"IMPEX"},{e:"741",emp:"TROB",seg:"IMPEX"},{e:"743",emp:"TROB",seg:"ACCIDENTE"},{e:"745",emp:"TROB",seg:"CARROLL"},{e:"747",emp:"TROB",seg:"ALPURA"},{e:"749",emp:"TROB",seg:"IMPEX"},{e:"751",emp:"TROB",seg:"IMPEX"},{e:"753",emp:"TROB",seg:"IMPEX"},{e:"757",emp:"TROB",seg:"IMPEX"},{e:"759",emp:"TROB",seg:"BAFAR"},{e:"761",emp:"TROB",seg:"IMPEX"},{e:"765",emp:"TROB",seg:"CARROLL"},{e:"767",emp:"TROB",seg:"ALPURA"},{e:"769",emp:"TROB",seg:"IMPEX"},{e:"771",emp:"TROB",seg:"IMPEX"},{e:"773",emp:"TROB",seg:"IMPEX"},{e:"777",emp:"TROB",seg:"CARROLL"},{e:"779",emp:"TROB",seg:"IMPEX"},{e:"781",emp:"TROB",seg:"IMPEX"},{e:"783",emp:"TROB",seg:"IMPEX"},{e:"785",emp:"TROB",seg:"IMPEX"},{e:"787",emp:"TROB",seg:"IMPEX"},{e:"789",emp:"TROB",seg:"IMPEX"},{e:"791",emp:"TROB",seg:"IMPEX"},{e:"797",emp:"TROB",seg:"IMPEX"},{e:"799",emp:"TROB",seg:"IMPEX"},{e:"801",emp:"TROB",seg:"CARROLL"},{e:"803",emp:"TROB",seg:"IMPEX"},{e:"807",emp:"TROB",seg:"BAFAR"},{e:"809",emp:"TROB",seg:"CARROLL"},{e:"811",emp:"TROB",seg:"IMPEX"},{e:"813",emp:"TROB",seg:"CARROLL"},{e:"815",emp:"TROB",seg:"BAFAR"},{e:"817",emp:"TROB",seg:"CARROLL"},{e:"819",emp:"TROB",seg:"IMPEX"},{e:"821",emp:"TROB",seg:"BAFAR"},{e:"823",emp:"TROB",seg:"ACCIDENTE"},{e:"825",emp:"TROB",seg:"BAFAR"},{e:"827",emp:"TROB",seg:"IMPEX"},{e:"831",emp:"TROB",seg:"IMPEX"},{e:"835",emp:"TROB",seg:"IMPEX"},{e:"837",emp:"TROB",seg:"CARROLL"},{e:"839",emp:"TROB",seg:"ALPURA"},{e:"841",emp:"TROB",seg:"CARROLL"},{e:"843",emp:"TROB",seg:"BAFAR"},{e:"845",emp:"TROB",seg:"IMPEX"},{e:"847",emp:"TROB",seg:"IMPEX"},{e:"849",emp:"TROB",seg:"IMPEX"},{e:"851",emp:"TROB",seg:"IMPEX"},{e:"853",emp:"TROB",seg:"IMPEX"},{e:"855",emp:"TROB",seg:"IMPEX"},{e:"857",emp:"TROB",seg:"ALPURA"},{e:"859",emp:"TROB",seg:"CARROLL"},{e:"861",emp:"TROB",seg:"CARROLL"},{e:"863",emp:"TROB",seg:"IMPEX"},{e:"865",emp:"TROB",seg:"MTTO"},{e:"867",emp:"TROB",seg:"IMPEX"},{e:"869",emp:"TROB",seg:"IMPEX"},{e:"871",emp:"TROB",seg:"IMPEX"},{e:"873",emp:"TROB",seg:"IMPEX"},{e:"875",emp:"TROB",seg:"ACCIDENTE"},{e:"877",emp:"TROB",seg:"IMPEX"},{e:"879",emp:"TROB",seg:"CARROLL"},{e:"883",emp:"TROB",seg:"IMPEX"},{e:"885",emp:"TROB",seg:"IMPEX"},{e:"887",emp:"TROB",seg:"IMPEX"},{e:"889",emp:"TROB",seg:"IMPEX"},{e:"891",emp:"TROB",seg:"CARROLL"},{e:"893",emp:"TROB",seg:"CARROLL"},{e:"895",emp:"TROB",seg:"BAFAR"},{e:"897",emp:"TROB",seg:"IMPEX"},{e:"899",emp:"TROB",seg:"CARROLL"},{e:"901",emp:"TROB",seg:"BAFAR"},{e:"903",emp:"TROB",seg:"BARCEL"},{e:"905",emp:"TROB",seg:"CARROLL"},{e:"907",emp:"TROB",seg:"BARCEL"},{e:"909",emp:"TROB",seg:"MTTO"},{e:"911",emp:"TROB",seg:"CARROLL"},{e:"913",emp:"TROB",seg:"IMPEX"},{e:"915",emp:"TROB",seg:"BARCEL"},{e:"917",emp:"TROB",seg:"BARCEL"},{e:"919",emp:"TROB",seg:"BARCEL"},{e:"921",emp:"TROB",seg:"PATIOS"},{e:"923",emp:"TROB",seg:"PATIOS"},{e:"925",emp:"TROB",seg:"BAFAR"},{e:"927",emp:"TROB",seg:"BARCEL"},{e:"929",emp:"TROB",seg:"ALPURA"},{e:"931",emp:"TROB",seg:"CARROLL"},{e:"933",emp:"TROB",seg:"CARROLL"},{e:"935",emp:"TROB",seg:"BARCEL"},{e:"937",emp:"TROB",seg:"CARROLL"},{e:"939",emp:"TROB",seg:"BARCEL"},{e:"941",emp:"TROB",seg:"BAFAR"},{e:"943",emp:"TROB",seg:"MTTO"},{e:"945",emp:"TROB",seg:"CARROLL"},{e:"947",emp:"TROB",seg:"IMPEX"},{e:"953",emp:"TROB",seg:"IMPEX"},{e:"955",emp:"TROB",seg:"ALPURA"},{e:"957",emp:"TROB",seg:"BAFAR"},{e:"959",emp:"TROB",seg:"BAFAR"},{e:"961",emp:"TROB",seg:"BAFAR"},{e:"963",emp:"TROB",seg:"IMPEX"},{e:"501",emp:"TROB",seg:"IMPEX"},{e:"507",emp:"TROB",seg:"IMPEX"},
  {e:"112",emp:"WE",seg:"IMPEX"},{e:"116",emp:"WE",seg:"IMPEX"},{e:"118",emp:"WE",seg:"CARROLL"},{e:"124",emp:"WE",seg:"IMPEX"},{e:"126",emp:"WE",seg:"MTTO"},{e:"128",emp:"WE",seg:"IMPEX"},{e:"130",emp:"WE",seg:"IMPEX"},{e:"134",emp:"WE",seg:"MTTO"},{e:"138",emp:"WE",seg:"IMPEX"},{e:"140",emp:"WE",seg:"IMPEX"},{e:"142",emp:"WE",seg:"IMPEX"},{e:"144",emp:"WE",seg:"IMPEX"},{e:"146",emp:"WE",seg:"IMPEX"},{e:"148",emp:"WE",seg:"CARROLL"},{e:"152",emp:"WE",seg:"IMPEX"},{e:"154",emp:"WE",seg:"IMPEX"},{e:"156",emp:"WE",seg:"ALPURA"},{e:"158",emp:"WE",seg:"IMPEX"},{e:"160",emp:"WE",seg:"IMPEX"},{e:"162",emp:"WE",seg:"BARCEL"},{e:"164",emp:"WE",seg:"IMPEX"},{e:"166",emp:"WE",seg:"IMPEX"},{e:"168",emp:"WE",seg:"IMPEX"},{e:"170",emp:"WE",seg:"ALPURA"},{e:"172",emp:"WE",seg:"IMPEX"},{e:"174",emp:"WE",seg:"IMPEX"},{e:"176",emp:"WE",seg:"IMPEX"},{e:"178",emp:"WE",seg:"CARROLL"},{e:"180",emp:"WE",seg:"IMPEX"},{e:"182",emp:"WE",seg:"IMPEX"},{e:"184",emp:"WE",seg:"IMPEX"},{e:"186",emp:"WE",seg:"IMPEX"},{e:"188",emp:"WE",seg:"IMPEX"},{e:"190",emp:"WE",seg:"ALPURA"},{e:"192",emp:"WE",seg:"IMPEX"},{e:"194",emp:"WE",seg:"IMPEX"},{e:"196",emp:"WE",seg:"IMPEX"},{e:"198",emp:"WE",seg:"ALPURA"},{e:"200",emp:"WE",seg:"IMPEX"},{e:"202",emp:"WE",seg:"IMPEX"},{e:"204",emp:"WE",seg:"ALPURA"},{e:"206",emp:"WE",seg:"IMPEX"},{e:"208",emp:"WE",seg:"CARROLL"},{e:"212",emp:"WE",seg:"CARROLL"},{e:"214",emp:"WE",seg:"CARROLL"},{e:"216",emp:"WE",seg:"IMPEX"},{e:"218",emp:"WE",seg:"IMPEX"},{e:"220",emp:"WE",seg:"IMPEX"},{e:"222",emp:"WE",seg:"IMPEX"},{e:"224",emp:"WE",seg:"IMPEX"},{e:"226",emp:"WE",seg:"IMPEX"},{e:"228",emp:"WE",seg:"IMPEX"},{e:"232",emp:"WE",seg:"IMPEX"},{e:"234",emp:"WE",seg:"ALPURA"},{e:"236",emp:"WE",seg:"ALPURA"},{e:"230",emp:"WE",seg:"PENDIENTE"},
  {e:"1",emp:"SHI",seg:"NatureSweet"},{e:"101",emp:"SHI",seg:"NatureSweet"},{e:"103",emp:"SHI",seg:"NatureSweet"},{e:"105",emp:"SHI",seg:"NatureSweet"},{e:"107",emp:"SHI",seg:"NatureSweet"},{e:"109",emp:"SHI",seg:"Pilgrims"},{e:"111",emp:"SHI",seg:"Pilgrims"},{e:"113",emp:"SHI",seg:"ACCIDENTE"},{e:"115",emp:"SHI",seg:"NatureSweet"},{e:"117",emp:"SHI",seg:"NatureSweet"},{e:"119",emp:"SHI",seg:"Pilgrims"},{e:"121",emp:"SHI",seg:"Pilgrims"},{e:"123",emp:"SHI",seg:"IMPEX"},{e:"125",emp:"SHI",seg:"Pilgrims"},{e:"689",emp:"SHI",seg:"NatureSweet"},{e:"129",emp:"SHI",seg:"Pilgrims"},{e:"131",emp:"SHI",seg:"IMPEX"},{e:"133",emp:"SHI",seg:"ACCIDENTE"},{e:"401",emp:"SHI",seg:"ALPURA"},{e:"405",emp:"SHI",seg:"NatureSweet"},{e:"409",emp:"SHI",seg:"Pilgrims"},{e:"413",emp:"SHI",seg:"IMPEX"},{e:"417",emp:"SHI",seg:"Pilgrims"},{e:"419",emp:"SHI",seg:"IMPEX"},{e:"431",emp:"SHI",seg:"Pilgrims"},{e:"433",emp:"SHI",seg:"PATIOS"},{e:"435",emp:"SHI",seg:"NatureSweet"},{e:"437",emp:"SHI",seg:"Pilgrims"},{e:"439",emp:"SHI",seg:"NatureSweet"},{e:"441",emp:"SHI",seg:"Pilgrims"},{e:"443",emp:"SHI",seg:"IMPEX"},{e:"445",emp:"SHI",seg:"NatureSweet"},{e:"449",emp:"SHI",seg:"NatureSweet"},
];

const FLOTA = FLOTA_RAW.map(u => ({ economico: u.e, empresa: u.emp, segmento: u.seg }));

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
  stoppedMinutes: number;
  status: 'moving' | 'stopped' | 'no_signal' | 'loading' | 'gps_issue';
  anomaly: string | null;
}

interface GeofenceData { lat: number; lon: number; entryTime: number; }

const EMP_ORDER: Record<string, number> = { SHI: 1, TROB: 2, WE: 3 };
const geoCache = new Map<string, string>();
const geofenceCache = new Map<string, GeofenceData>();

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
  const [loadedSegmentos, setLoadedSegmentos] = useState<Set<string>>(new Set());
  const isLoadingRef = useRef(false);

  useEffect(() => {
    setFleet(FLOTA.map(u => ({
      ...u, latitude: null, longitude: null, speed: null, address: '-',
      timestamp: null, stoppedTime: '-', stoppedMinutes: 0,
      status: 'no_signal' as const, anomaly: null
    })));
  }, []);

  const getAddress = async (lat: number, lon: number): Promise<string> => {
    const key = `${lat.toFixed(5)},${lon.toFixed(5)}`;
    if (geoCache.has(key)) return geoCache.get(key)!;

    try {
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&language=es&key=${GOOGLE_MAPS_API_KEY}`);
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
          
          const result = parts.length > 0 ? parts.join(', ') : `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
          geoCache.set(key, result);
          return result;
        }
      }
    } catch {}

    try {
      const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=es`);
      if (res.ok) {
        const data = await res.json();
        const parts: string[] = [];
        if (data.locality) parts.push(data.locality);
        if (data.principalSubdivision) parts.push(data.principalSubdivision.replace(/Estado de |State of /g, ''));
        const result = parts.length > 0 ? parts.join(', ') : `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
        geoCache.set(key, result);
        return result;
      }
    } catch {}
    
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  };

  const updateGeofence = (eco: string, lat: number, lon: number): { time: string; minutes: number } => {
    const now = Date.now();
    const existing = geofenceCache.get(eco);
    
    if (existing && calcDistance(existing.lat, existing.lon, lat, lon) < 1) {
      const minutes = Math.floor((now - existing.entryTime) / 60000);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      const time = days > 0 ? `${days}d ${hours % 24}h` : hours > 0 ? `${hours}h ${minutes % 60}m` : minutes >= 1 ? `${minutes}m` : '-';
      return { time, minutes };
    }
    
    geofenceCache.set(eco, { lat, lon, entryTime: now });
    return { time: '-', minutes: 0 };
  };

  const detectAnomaly = (timestamp: string | null): { anomaly: string | null; isGpsIssue: boolean } => {
    if (!timestamp) return { anomaly: null, isGpsIssue: false };
    try {
      const hours = (Date.now() - new Date(timestamp.includes('/') ? timestamp.replace(/\//g, '-') : timestamp).getTime()) / 3600000;
      if (hours > 72) return { anomaly: `GPS sin señal ${Math.floor(hours / 24)}d`, isGpsIssue: true };
      if (hours > 24) return { anomaly: `GPS inactivo ${Math.floor(hours)}h`, isGpsIssue: true };
    } catch {}
    return { anomaly: null, isGpsIssue: false };
  };

  const fetchBatch = async (placas: string[]) => {
    try {
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/widetech/locations/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${publicAnonKey}` },
        body: JSON.stringify({ placas })
      });
      if (res.ok) {
        const data = await res.json();
        return data.results || data.data || [];
      }
    } catch (e) { console.error('WideTech error:', e); }
    return [];
  };

  const loadSegmento = useCallback(async (segmento: string) => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setLoading(true);

    const units = FLOTA.filter(u => u.segmento === segmento);
    const placas = units.map(u => u.economico);
    setProgress({ current: 0, total: placas.length });
    setFleet(prev => prev.map(u => u.segmento === segmento ? { ...u, status: 'loading' as const } : u));

    const batchSize = 5;
    for (let i = 0; i < placas.length; i += batchSize) {
      const batch = placas.slice(i, i + batchSize);
      const results = await fetchBatch(batch);
      setProgress({ current: Math.min(i + batchSize, placas.length), total: placas.length });

      const updates: Record<string, Partial<Unit>> = {};
      
      for (const r of results) {
        if (!r?.placa) continue;
        const eco = r.placa;
        
        if (r.success && r.location) {
          const { latitude: lat, longitude: lon, speed = 0, timestamp: ts } = r.location;
          const hasCoords = lat && lon;
          const isMoving = speed > 3;
          const { anomaly, isGpsIssue } = detectAnomaly(ts);
          
          let status: Unit['status'] = isGpsIssue ? 'gps_issue' : hasCoords ? (isMoving ? 'moving' : 'stopped') : 'no_signal';
          let address = '-', stoppedTime = '-', stoppedMinutes = 0;
          
          if (hasCoords) {
            address = await getAddress(lat, lon);
            if (!isMoving && !isGpsIssue) {
              const geo = updateGeofence(eco, lat, lon);
              stoppedTime = geo.time;
              stoppedMinutes = geo.minutes;
            }
          }
          
          updates[eco] = { latitude: lat, longitude: lon, speed, address, timestamp: ts, stoppedTime, stoppedMinutes, status, anomaly };
        } else {
          updates[eco] = { status: 'no_signal', address: '-', anomaly: null };
        }
      }

      setFleet(prev => prev.map(u => updates[u.economico] ? { ...u, ...updates[u.economico] } : u));
      if (i + batchSize < placas.length) await new Promise(r => setTimeout(r, 300));
    }

    setFleet(prev => prev.map(u => u.segmento === segmento && u.status === 'loading' ? { ...u, status: 'no_signal' as const } : u));
    setLoadedSegmentos(prev => new Set([...prev, segmento]));
    setLastRefresh(new Date());
    setLoading(false);
    isLoadingRef.current = false;
  }, []);

  useEffect(() => {
    if (fleet.length > 0 && !loadedSegmentos.has('IMPEX') && !loading) loadSegmento('IMPEX');
  }, [fleet.length, loadedSegmentos, loading, loadSegmento]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && loadedSegmentos.has(activeSegmento)) loadSegmento(activeSegmento);
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [activeSegmento, loading, loadedSegmentos, loadSegmento]);

  const handleSegmentoClick = (seg: string) => {
    setActiveSegmento(seg);
    if (!loadedSegmentos.has(seg) && !loading) loadSegmento(seg);
  };

  const segmentoUnits = fleet.filter(u => u.segmento === activeSegmento);
  const filtered = segmentoUnits.filter(u => {
    if (search && !u.economico.includes(search)) return false;
    if (statusF === 'moving' && u.status !== 'moving') return false;
    if (statusF === 'stopped' && u.status !== 'stopped') return false;
    if (statusF === 'no_signal' && !['no_signal', 'gps_issue', 'loading'].includes(u.status)) return false;
    return true;
  }).sort((a, b) => (EMP_ORDER[a.empresa] || 9) - (EMP_ORDER[b.empresa] || 9) || parseInt(a.economico) - parseInt(b.economico));

  const stats = {
    total: segmentoUnits.length,
    mov: segmentoUnits.filter(u => u.status === 'moving').length,
    det: segmentoUnits.filter(u => u.status === 'stopped').length,
    sin: segmentoUnits.filter(u => ['no_signal', 'gps_issue', 'loading'].includes(u.status)).length,
    anomalies: segmentoUnits.filter(u => u.anomaly).length
  };

  const openMap = (u: Unit) => u.latitude && window.open(`https://www.google.com/maps?q=${u.latitude},${u.longitude}`, '_blank');

  const exportCSV = () => {
    const rows = [['Eco', 'Empresa', 'Segmento', 'Status', 'Tiempo Parado', 'Velocidad', 'Ubicación', 'Anomalía', 'Lat', 'Lon', 'Última Señal']];
    filtered.forEach(u => rows.push([u.economico, u.empresa, u.segmento, u.status, u.stoppedTime, String(u.speed || 0), u.address, u.anomaly || '', String(u.latitude || ''), String(u.longitude || ''), u.timestamp || '']));
    const blob = new Blob(['\ufeff' + rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob);
    link.download = `GPS_${activeSegmento}_${new Date().toISOString().slice(0, 10)}.csv`; link.click();
  };

  const formatTime = (t: string | null) => {
    if (!t) return '-';
    try { return new Date(t.includes('/') ? t.replace(/\//g, '-') : t).toLocaleString('es-MX', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true }); }
    catch { return t; }
  };

  const getStoppedColor = (m: number) => m < 1 ? 'text-slate-500' : m >= 480 ? 'text-red-400' : m >= 240 ? 'text-orange-400' : m >= 60 ? 'text-yellow-400' : 'text-slate-400';
  const getStatusColor = (s: Unit['status']) => s === 'moving' ? 'bg-green-500/20 text-green-400' : s === 'stopped' ? 'bg-yellow-500/20 text-yellow-400' : s === 'gps_issue' ? 'bg-purple-500/20 text-purple-400' : 'bg-red-500/20 text-red-400';

  return (
    <div className="min-h-screen p-4" style={{ background: 'linear-gradient(180deg, #1a365d 0%, #0f172a 100%)' }}>
      <div className="flex flex-wrap gap-2 mb-4">
        {SEGMENTOS.map(seg => {
          const count = FLOTA.filter(u => u.segmento === seg).length;
          if (count === 0) return null;
          const isLoaded = loadedSegmentos.has(seg), isActive = activeSegmento === seg, isCurrentlyLoading = loading && isActive;
          return (
            <button key={seg} onClick={() => handleSegmentoClick(seg)} disabled={loading && !isActive}
              className={`h-9 px-4 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${isActive ? 'bg-gradient-to-b from-blue-500 to-blue-700 text-white shadow-lg' : isLoaded ? 'bg-slate-600/80 text-white hover:bg-slate-500/80' : 'bg-slate-700/60 text-slate-400 hover:bg-slate-600/60'}`}
              style={{ boxShadow: isActive ? '0 4px 12px rgba(59,130,246,0.4)' : 'none' }}>
              {seg} ({count})
              {isCurrentlyLoading && <RefreshCw className="w-3 h-3 animate-spin" />}
              {isLoaded && !isActive && <span className="text-green-400">✓</span>}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3 mb-4 p-3 rounded-2xl bg-slate-800/60" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
        <button onClick={() => setStatusF('ALL')} className={`h-10 px-4 rounded-xl font-semibold text-sm flex items-center gap-2 ${statusF === 'ALL' ? 'bg-gradient-to-b from-slate-500 to-slate-700 text-white' : 'bg-slate-700/80 text-slate-300'}`}><Truck className="w-4 h-4" />{stats.total}</button>
        <button onClick={() => setStatusF('moving')} className={`h-10 px-4 rounded-xl font-semibold text-sm flex items-center gap-2 ${statusF === 'moving' ? 'bg-gradient-to-b from-green-500 to-green-700 text-white' : 'bg-slate-700/80 text-slate-300'}`}><Navigation className="w-4 h-4" />{stats.mov}</button>
        <button onClick={() => setStatusF('stopped')} className={`h-10 px-4 rounded-xl font-semibold text-sm flex items-center gap-2 ${statusF === 'stopped' ? 'bg-gradient-to-b from-yellow-500 to-yellow-600 text-white' : 'bg-slate-700/80 text-slate-300'}`}><Power className="w-4 h-4" />{stats.det}</button>
        <button onClick={() => setStatusF('no_signal')} className={`h-10 px-4 rounded-xl font-semibold text-sm flex items-center gap-2 ${statusF === 'no_signal' ? 'bg-gradient-to-b from-red-500 to-red-700 text-white' : 'bg-slate-700/80 text-slate-300'}`}><WifiOff className="w-4 h-4" />{stats.sin}</button>
        {stats.anomalies > 0 && <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-purple-500/20 text-purple-300 text-sm"><AlertTriangle className="w-4 h-4" />{stats.anomalies}</div>}
        <div className="w-px h-8 bg-slate-600/50" />
        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Eco..." className="h-10 w-24 pl-9 pr-3 rounded-xl bg-slate-700/60 border border-slate-600/50 text-white text-sm placeholder-slate-400 focus:outline-none" /></div>
        <div className="flex-1" />
        {lastRefresh && <span className="text-slate-400 text-sm">{lastRefresh.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>}
        <button onClick={exportCSV} className="h-10 w-10 flex items-center justify-center rounded-xl bg-gradient-to-b from-slate-600 to-slate-800 text-slate-300 hover:opacity-80"><Download className="w-4 h-4" /></button>
        <button onClick={() => loadSegmento(activeSegmento)} disabled={loading} className={`h-10 px-4 rounded-xl font-semibold text-sm flex items-center gap-2 ${loading ? 'bg-gradient-to-b from-orange-500 to-orange-700' : 'bg-gradient-to-b from-blue-500 to-blue-700'} text-white`}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />{loading ? `${progress.current}/${progress.total}` : 'Actualizar'}
        </button>
      </div>

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
                <th className="px-3 py-3 text-left text-xs font-semibold text-slate-400 uppercase w-32">SEÑAL</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.economico} className={`border-t border-slate-700/30 hover:bg-slate-700/20 ${u.anomaly ? 'bg-purple-900/10' : ''}`}>
                  <td className="px-3 py-2 font-mono font-bold text-white">{u.economico}{u.anomaly && <AlertTriangle className="w-3 h-3 text-purple-400 inline ml-1" />}</td>
                  <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded text-xs font-semibold ${u.empresa === 'SHI' ? 'bg-purple-500/20 text-purple-300' : u.empresa === 'TROB' ? 'bg-blue-500/20 text-blue-300' : 'bg-emerald-500/20 text-emerald-300'}`}>{u.empresa}</span></td>
                  <td className="px-3 py-2">
                    <button onClick={() => openMap(u)} disabled={!u.latitude} className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${getStatusColor(u.status)} ${u.latitude ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed opacity-60'}`}>
                      {u.status === 'moving' ? <Navigation className="w-3 h-3" /> : u.status === 'stopped' ? <Power className="w-3 h-3" /> : u.status === 'gps_issue' ? <AlertTriangle className="w-3 h-3" /> : u.status === 'loading' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <WifiOff className="w-3 h-3" />}
                      {u.status === 'moving' ? 'Mov' : u.status === 'stopped' ? 'Det' : u.status === 'gps_issue' ? 'GPS!' : u.status === 'loading' ? '...' : 'Sin'}
                      {u.latitude && <ExternalLink className="w-2.5 h-2.5" />}
                    </button>
                  </td>
                  <td className="px-3 py-2"><span className={`text-sm font-semibold flex items-center gap-1 ${getStoppedColor(u.stoppedMinutes)}`}>{u.stoppedMinutes >= 60 && <Clock className="w-3 h-3" />}{u.stoppedTime}</span></td>
                  <td className="px-3 py-2"><span className={`text-sm font-semibold ${(u.speed || 0) > 0 ? 'text-green-400' : 'text-slate-500'}`}>{u.speed ?? '-'}</span></td>
                  <td className="px-3 py-2"><div className="flex flex-col"><span className="text-slate-300 text-sm truncate max-w-[400px]">{u.address}</span>{u.anomaly && <span className="text-purple-400 text-xs">{u.anomaly}</span>}</div></td>
                  <td className="px-3 py-2 text-slate-400 text-xs">{formatTime(u.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
