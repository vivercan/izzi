'use client';

import { createClient } from '@supabase/supabase-js';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Truck, Power, RefreshCw, Search, Download, WifiOff, Navigation, ExternalLink, Clock, AlertTriangle, Zap } from 'lucide-react';

// Supabase client
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fbxbsslhewchyibdoyzk.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Google Maps API Key
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

const SEGMENTOS = ['IMPEX', 'CARROLL', 'BAFAR', 'NatureSweet', 'Pilgrims', 'ALPURA', 'BARCEL', 'MTTO', 'PATIOS', 'ACCIDENTE', 'INSTITUTO', 'PENDIENTE'];

interface Unit {
  economico: string;
  empresa: string;
  segmento: string;
  latitude: number | null;
  longitude: number | null;
  speed: number | null;
  address: string | null;
  timestamp_gps: string | null;
  timestamp_updated: string | null;
  stopped_minutes: number;
  status: string;
  anomaly: string | null;
}

interface SegmentoStats {
  segmento: string;
  total: number;
  moving: number;
  stopped: number;
  sin_senal: number;
  anomalies: number;
}

const EMP_ORDER: Record<string, number> = { SHI: 1, TROB: 2, WE: 3 };

// Cache para geocoding
const geoCache: Map<string, string> = new Map();

export default function DespachoInteligenteContent() {
  const [fleet, setFleet] = useState<Unit[]>([]);
  const [stats, setStats] = useState<SegmentoStats[]>([]);
  const [activeSegmento, setActiveSegmento] = useState('IMPEX');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [search, setSearch] = useState('');
  const [statusF, setStatusF] = useState('ALL');
  const [isBackgroundRunning, setIsBackgroundRunning] = useState(false);
  const workerRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadRef = useRef(false);

  // Formatear tiempo detenido
  const formatStoppedTime = (minutes: number | null): string => {
    if (!minutes || minutes < 1) return '-';
    if (minutes >= 1440) return `${Math.floor(minutes / 1440)}d ${Math.floor((minutes % 1440) / 60)}h`;
    if (minutes >= 60) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  // Cargar datos desde Supabase
  const loadFromSupabase = useCallback(async () => {
    try {
      // Cargar flota
      const { data: fleetData, error: fleetError } = await supabase
        .from('gps_tracking')
        .select('*')
        .order('segmento');

      if (fleetError) throw fleetError;
      
      if (fleetData) {
        setFleet(fleetData as Unit[]);
        
        // Encontrar última actualización
        const lastUpdated = fleetData.reduce((max, u) => {
          const d = u.timestamp_updated ? new Date(u.timestamp_updated) : null;
          return d && (!max || d > max) ? d : max;
        }, null as Date | null);
        
        if (lastUpdated) setLastUpdate(lastUpdated);
      }

      // Cargar estadísticas
      const { data: statsData, error: statsError } = await supabase
        .from('gps_summary')
        .select('*');

      if (!statsError && statsData) {
        setStats(statsData as SegmentoStats[]);
      }

    } catch (err) {
      console.error('Error loading from Supabase:', err);
    }
  }, []);

  // Geocoding con Google Maps
  const getDetailedAddress = async (lat: number, lon: number): Promise<string> => {
    const key = `${lat.toFixed(4)},${lon.toFixed(4)}`;
    if (geoCache.has(key)) return geoCache.get(key)!;

    if (GOOGLE_MAPS_API_KEY) {
      try {
        const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&language=es&key=${GOOGLE_MAPS_API_KEY}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'OK' && data.results?.length > 0) {
            const comps = data.results[0].address_components || [];
            let route = '', streetNum = '', neighborhood = '', locality = '', admin2 = '', admin1 = '';
            
            for (const c of comps) {
              const t = c.types || [];
              if (t.includes('route')) route = c.long_name;
              if (t.includes('street_number')) streetNum = c.long_name;
              if (t.includes('neighborhood') || t.includes('sublocality_level_1')) neighborhood = c.long_name;
              if (t.includes('locality')) locality = c.long_name;
              if (t.includes('administrative_area_level_2')) admin2 = c.long_name;
              if (t.includes('administrative_area_level_1')) admin1 = c.short_name;
            }
            
            const parts: string[] = [];
            if (route) {
              if (route.toLowerCase().includes('carretera') || route.toLowerCase().includes('autopista')) {
                parts.push(route);
              } else if (streetNum) {
                parts.push(`${route} #${streetNum}`);
              } else {
                parts.push(route);
              }
            }
            if (neighborhood) parts.push(`Col. ${neighborhood}`);
            if (locality) parts.push(locality);
            else if (admin2) parts.push(admin2);
            if (admin1) parts.push(admin1);
            
            const result = parts.join(', ') || 'México';
            geoCache.set(key, result);
            return result;
          }
        }
      } catch {}
    }

    // Fallback BigDataCloud
    try {
      const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=es`);
      if (res.ok) {
        const data = await res.json();
        const parts: string[] = [];
        if (data.locality) parts.push(data.locality);
        else if (data.city) parts.push(data.city);
        if (data.principalSubdivision) parts.push(data.principalSubdivision.replace('Estado de ', ''));
        const result = parts.join(', ') || 'México';
        geoCache.set(key, result);
        return result;
      }
    } catch {}
    
    return 'México';
  };

  // Fetch GPS de WideTech y actualizar Supabase
  const fetchWideTechBatch = async (placas: string[]) => {
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/make-server-d84b50bb/widetech/locations/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ placas })
      });
      if (res.ok) {
        const data = await res.json();
        return data.results || data.data || [];
      }
    } catch {}
    return [];
  };

  // Actualizar una unidad en Supabase
  const updateUnitInSupabase = async (eco: string, gpsData: any) => {
    if (!gpsData?.success || !gpsData?.location) {
      await supabase.rpc('update_gps_position', {
        p_economico: eco,
        p_lat: null,
        p_lon: null,
        p_speed: 0,
        p_address: null,
        p_timestamp_gps: null
      });
      return;
    }

    const loc = gpsData.location;
    let timestamp = null;
    if (loc.timestamp) {
      try {
        timestamp = new Date(loc.timestamp.replace(/\//g, '-')).toISOString();
      } catch {}
    }

    let address = loc.address || '';
    if (loc.latitude && loc.longitude && (!address || address.includes('desconocida'))) {
      address = await getDetailedAddress(loc.latitude, loc.longitude);
    }

    await supabase.rpc('update_gps_position', {
      p_economico: eco,
      p_lat: loc.latitude,
      p_lon: loc.longitude,
      p_speed: loc.speed || 0,
      p_address: address,
      p_timestamp_gps: timestamp
    });
  };

  // Background worker: actualiza toda la flota continuamente
  const runBackgroundWorker = useCallback(async () => {
    if (isBackgroundRunning) return;
    setIsBackgroundRunning(true);

    try {
      const { data: units } = await supabase
        .from('gps_tracking')
        .select('economico')
        .order('segmento');

      if (!units) return;

      const batchSize = 5;
      for (let i = 0; i < units.length; i += batchSize) {
        const batch = units.slice(i, i + batchSize);
        const placas = batch.map(u => u.economico);
        
        const gpsResults = await fetchWideTechBatch(placas);
        const gpsMap = new Map();
        for (const r of gpsResults) {
          if (r?.placa) gpsMap.set(r.placa, r);
        }

        for (const unit of batch) {
          await updateUnitInSupabase(unit.economico, gpsMap.get(unit.economico));
        }

        await new Promise(r => setTimeout(r, 300));
      }

      // Recargar datos
      await loadFromSupabase();

    } catch (err) {
      console.error('Background worker error:', err);
    } finally {
      setIsBackgroundRunning(false);
    }
  }, [isBackgroundRunning, loadFromSupabase]);

  // Inicialización: cargar de Supabase y empezar worker
  useEffect(() => {
    if (initialLoadRef.current) return;
    initialLoadRef.current = true;

    const init = async () => {
      setLoading(true);
      await loadFromSupabase();
      setLoading(false);
      
      // Iniciar background worker
      runBackgroundWorker();
    };

    init();

    // Configurar intervalo de actualización (cada 2 minutos)
    workerRef.current = setInterval(() => {
      runBackgroundWorker();
    }, 2 * 60 * 1000);

    // Suscribirse a cambios en tiempo real
    const subscription = supabase
      .channel('gps_tracking_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gps_tracking' }, () => {
        loadFromSupabase();
      })
      .subscribe();

    return () => {
      if (workerRef.current) clearInterval(workerRef.current);
      subscription.unsubscribe();
    };
  }, [loadFromSupabase, runBackgroundWorker]);

  // Refresh manual
  const handleRefresh = async () => {
    setRefreshing(true);
    await runBackgroundWorker();
    setRefreshing(false);
  };

  // Filtrar flota
  const segmentoUnits = fleet.filter(u => u.segmento === activeSegmento);
  
  const filtered = segmentoUnits.filter(u => {
    if (search && !u.economico.includes(search)) return false;
    if (statusF === 'moving' && u.status !== 'moving') return false;
    if (statusF === 'stopped' && u.status !== 'stopped') return false;
    if (statusF === 'no_signal' && !['no_signal', 'gps_issue', 'pending'].includes(u.status)) return false;
    return true;
  }).sort((a, b) => (EMP_ORDER[a.empresa] || 9) - (EMP_ORDER[b.empresa] || 9) || parseInt(a.economico) - parseInt(b.economico));

  // Stats del segmento actual
  const currentStats = stats.find(s => s.segmento === activeSegmento) || {
    total: segmentoUnits.length,
    moving: segmentoUnits.filter(u => u.status === 'moving').length,
    stopped: segmentoUnits.filter(u => u.status === 'stopped').length,
    sin_senal: segmentoUnits.filter(u => ['no_signal', 'gps_issue', 'pending'].includes(u.status)).length,
    anomalies: segmentoUnits.filter(u => u.anomaly).length
  };

  const openMap = (u: Unit) => u.latitude && window.open(`https://www.google.com/maps?q=${u.latitude},${u.longitude}`, '_blank');

  const exportCSV = () => {
    const rows = [['Eco', 'Empresa', 'Segmento', 'Status', 'Tiempo Parado', 'Velocidad', 'Ubicación', 'Anomalía', 'Lat', 'Lon', 'Última Señal']];
    filtered.forEach(u => rows.push([
      u.economico, u.empresa, u.segmento, u.status, 
      formatStoppedTime(u.stopped_minutes), String(u.speed || 0), 
      u.address || '', u.anomaly || '', 
      String(u.latitude || ''), String(u.longitude || ''), 
      u.timestamp_gps || ''
    ]));
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
      return new Date(t).toLocaleString('es-MX', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch { return t; }
  };

  const getStoppedColor = (minutes: number | null) => {
    if (!minutes || minutes < 1) return 'text-slate-500';
    if (minutes >= 1440) return 'text-red-400'; // > 1 día
    if (minutes >= 480) return 'text-red-400'; // > 8 horas
    if (minutes >= 240) return 'text-orange-400'; // > 4 horas
    if (minutes >= 60) return 'text-yellow-400'; // > 1 hora
    return 'text-slate-500';
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'moving': return 'bg-green-500/20 text-green-400';
      case 'stopped': return 'bg-yellow-500/20 text-yellow-400';
      case 'gps_issue': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-red-500/20 text-red-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #1a365d 0%, #0f172a 100%)' }}>
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-300 text-lg">Cargando flota...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4" style={{ background: 'linear-gradient(180deg, #1a365d 0%, #0f172a 100%)' }}>
      
      {/* Status indicator */}
      {isBackgroundRunning && (
        <div className="fixed top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20 text-green-400 text-sm z-50">
          <Zap className="w-4 h-4 animate-pulse" />
          Actualizando...
        </div>
      )}

      {/* TABS */}
      <div className="flex flex-wrap gap-2 mb-4">
        {SEGMENTOS.map(seg => {
          const segStat = stats.find(s => s.segmento === seg);
          const count = segStat?.total || fleet.filter(u => u.segmento === seg).length;
          if (count === 0) return null;
          const isActive = activeSegmento === seg;
          
          return (
            <button key={seg} onClick={() => setActiveSegmento(seg)}
              className={`h-9 px-4 rounded-xl text-sm font-semibold transition-all ${isActive ? 'bg-gradient-to-b from-blue-500 to-blue-700 text-white shadow-lg' : 'bg-slate-600/80 text-white hover:bg-slate-500/80'}`}
              style={{ boxShadow: isActive ? '0 4px 12px rgba(59,130,246,0.4)' : 'none' }}>
              {seg} ({count})
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 p-3 rounded-2xl bg-slate-800/60" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
        <button onClick={() => setStatusF('ALL')} className={`h-10 px-4 rounded-xl font-semibold text-sm flex items-center gap-2 ${statusF === 'ALL' ? 'bg-gradient-to-b from-slate-500 to-slate-700 text-white' : 'bg-slate-700/80 text-slate-300'}`}>
          <Truck className="w-4 h-4" />{currentStats.total}
        </button>
        <button onClick={() => setStatusF('moving')} className={`h-10 px-4 rounded-xl font-semibold text-sm flex items-center gap-2 ${statusF === 'moving' ? 'bg-gradient-to-b from-green-500 to-green-700 text-white' : 'bg-slate-700/80 text-slate-300'}`}>
          <Navigation className="w-4 h-4" />{currentStats.moving}
        </button>
        <button onClick={() => setStatusF('stopped')} className={`h-10 px-4 rounded-xl font-semibold text-sm flex items-center gap-2 ${statusF === 'stopped' ? 'bg-gradient-to-b from-yellow-500 to-yellow-600 text-white' : 'bg-slate-700/80 text-slate-300'}`}>
          <Power className="w-4 h-4" />{currentStats.stopped}
        </button>
        <button onClick={() => setStatusF('no_signal')} className={`h-10 px-4 rounded-xl font-semibold text-sm flex items-center gap-2 ${statusF === 'no_signal' ? 'bg-gradient-to-b from-red-500 to-red-700 text-white' : 'bg-slate-700/80 text-slate-300'}`}>
          <WifiOff className="w-4 h-4" />{currentStats.sin_senal}
        </button>
        
        {currentStats.anomalies > 0 && (
          <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-purple-500/20 text-purple-300 text-sm">
            <AlertTriangle className="w-4 h-4" />
            {currentStats.anomalies} GPS
          </div>
        )}

        <div className="w-px h-8 bg-slate-600/50" />
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Eco..." className="h-10 w-24 pl-9 pr-3 rounded-xl bg-slate-700/60 border border-slate-600/50 text-white text-sm placeholder-slate-400 focus:outline-none" />
        </div>

        <div className="flex-1" />

        {lastUpdate && (
          <span className="text-slate-500 text-xs">
            {lastUpdate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}

        <button onClick={exportCSV} className="h-10 w-10 flex items-center justify-center rounded-xl bg-gradient-to-b from-slate-600 to-slate-800 text-slate-300 hover:opacity-80">
          <Download className="w-4 h-4" />
        </button>

        <button onClick={handleRefresh} disabled={refreshing || isBackgroundRunning} className={`h-10 px-4 rounded-xl font-semibold text-sm flex items-center gap-2 ${refreshing || isBackgroundRunning ? 'bg-gradient-to-b from-orange-500 to-orange-700' : 'bg-gradient-to-b from-blue-500 to-blue-700'} text-white`}>
          <RefreshCw className={`w-4 h-4 ${refreshing || isBackgroundRunning ? 'animate-spin' : ''}`} />
          {refreshing || isBackgroundRunning ? 'Actualizando' : 'Actualizar'}
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
                      {u.status === 'moving' ? <Navigation className="w-3 h-3" /> : u.status === 'stopped' ? <Power className="w-3 h-3" /> : u.status === 'gps_issue' ? <AlertTriangle className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                      {u.status === 'moving' ? 'Mov' : u.status === 'stopped' ? 'Det' : u.status === 'gps_issue' ? 'GPS!' : 'Sin'}
                      {u.latitude && <ExternalLink className="w-2.5 h-2.5" />}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`text-sm font-semibold flex items-center gap-1 ${getStoppedColor(u.stopped_minutes)}`}>
                      {u.stopped_minutes >= 60 && <Clock className="w-3 h-3" />}
                      {formatStoppedTime(u.stopped_minutes)}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`text-sm font-semibold ${(u.speed || 0) > 0 ? 'text-green-400' : 'text-slate-500'}`}>{u.speed ?? '-'}</span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-col">
                      <span className="text-slate-300 text-sm truncate max-w-[350px]">{u.address || '-'}</span>
                      {u.anomaly && <span className="text-purple-400 text-xs">{u.anomaly}</span>}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-slate-500 text-xs">{fmtTs(u.timestamp_gps)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
