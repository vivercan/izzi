'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Truck, RefreshCw, Search, Download, WifiOff, Navigation, ArrowLeft } from 'lucide-react';

const SUPABASE_URL = 'https://fbxbsslhewchyibdoyzk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieGJzc2xoZXdjaHlpYmRveXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzczODEsImV4cCI6MjA3ODExMzM4MX0.Z8JPlg7hhKbA624QGHp2bKKTNtCD3WInQMO5twjl6a0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Segmentos basados en el Excel GPS_PLACAS.xlsx
const SEGMENTOS_CONFIG = [
  { key: 'IMPEX', label: 'IMPEX', match: ['IMPEX', 'MTTO', 'NEXTEER', 'CLARIOS'] },
  { key: 'CARROL', label: 'CARROL', match: ['CARROL'] },
  { key: 'BAFAR', label: 'BAFAR', match: ['BAFAR'] },
  { key: 'ALPURA', label: 'ALPURA', match: ['ALPURA'] },
  { key: 'BARCEL', label: 'BARCEL', match: ['BARCEL'] },
  { key: 'ACCIDENTE', label: 'ACCIDENTE', match: ['ACCIDENTE'] },
  { key: 'DEDICADO_NS', label: 'NatureSweet', match: ['DEDICADO NS', 'NS/MULA'] },
  { key: 'DEDICADO_PILGRIMS', label: 'Pilgrims', match: ['DEDICADO PILGRIMS'] },
  { key: 'PATIOS', label: 'PATIOS', match: ['PATIO', 'PATIERO', 'MULA QRO', 'MULA AGS'] },
  { key: 'OTROS', label: 'UNIDADES DE SERVICIO', match: ['INSTITUTO', 'PENDIENTE', 'ZAPATA'] },
];

interface Unit {
  economico: string;
  empresa: string;
  segmento: string;
  latitud: number | null;
  longitud: number | null;
  velocidad: number | null;
  ubicacion: string | null;
  estatus: string | null;
  ultima_actualizacion: string | null;
  fecha_gps: string | null;
}

const EMP_COLORS: Record<string, string> = {
  TROB: 'bg-blue-600',
  WE: 'bg-purple-600',
  SHI: 'bg-emerald-600',
};

interface DespachoProps {
  onBack?: () => void;
}

// Función para determinar a qué segmento pertenece una unidad
function getSegmentoKey(segmento: string): string {
  if (!segmento) return 'OTROS';
  const seg = segmento.toUpperCase();
  
  for (const config of SEGMENTOS_CONFIG) {
    for (const match of config.match) {
      if (seg.includes(match.toUpperCase())) {
        return config.key;
      }
    }
  }
  return 'OTROS';
}

// Formatear fecha de señal GPS
function formatSignalTime(dateStr: string | null): string {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return date.toLocaleString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return dateStr;
  }
}

// Calcular tiempo detenido
function calcStoppedTime(dateStr: string | null, estatus: string | null): string {
  if (!dateStr || estatus === 'En Movimiento') return '-';
  try {
    const then = new Date(dateStr).getTime();
    const now = Date.now();
    const diffMs = now - then;
    const mins = Math.floor(diffMs / 60000);
    
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hours < 24) return `${hours}h ${remMins}m`;
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return `${days}d ${remHours}h`;
  } catch {
    return '-';
  }
}

export default function DespachoInteligenteContent({ onBack }: DespachoProps) {
  const [fleet, setFleet] = useState<Unit[]>([]);
  const [activeSegmento, setActiveSegmento] = useState('IMPEX');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'moving' | 'stopped'>('ALL');
  const [countdown, setCountdown] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  // Cargar datos de Supabase
  const loadFleet = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('gps_tracking')
        .select('*')
        .order('economico', { ascending: true });

      if (error) throw error;
      setFleet(data || []);
      setLastUpdate(new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.error('Error loading fleet:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar al inicio y cada 60 segundos
  useEffect(() => {
    loadFleet();
    const interval = setInterval(loadFleet, 60000);
    return () => clearInterval(interval);
  }, [loadFleet]);

  // Countdown para próxima actualización
  useEffect(() => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown(prev => (prev <= 1 ? 60 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [lastUpdate]);

  // Filtrar flota por segmento activo
  const filteredFleet = fleet.filter(u => {
    const segKey = getSegmentoKey(u.segmento);
    if (segKey !== activeSegmento) return false;
    
    // Filtro de búsqueda
    if (search) {
      const s = search.toLowerCase();
      if (!u.economico.toLowerCase().includes(s) && 
          !u.empresa?.toLowerCase().includes(s) &&
          !u.ubicacion?.toLowerCase().includes(s)) {
        return false;
      }
    }
    
    // Filtro de estatus
    if (statusFilter === 'moving' && u.estatus !== 'En Movimiento') return false;
    if (statusFilter === 'stopped' && u.estatus !== 'Detenido') return false;
    
    return true;
  });

  // Contar por segmento
  const segmentCounts = SEGMENTOS_CONFIG.map(seg => ({
    ...seg,
    count: fleet.filter(u => getSegmentoKey(u.segmento) === seg.key).length,
  }));

  // Contadores de estado
  const movingCount = filteredFleet.filter(u => u.estatus === 'En Movimiento').length;
  const stoppedCount = filteredFleet.filter(u => u.estatus === 'Detenido').length;
  const noSignalCount = filteredFleet.filter(u => !u.latitud).length;

  // Exportar a CSV
  const exportCSV = () => {
    const headers = ['Económico', 'Empresa', 'Segmento', 'Estatus', 'Velocidad', 'Ubicación', 'Señal GPS'];
    const rows = filteredFleet.map(u => [
      u.economico,
      u.empresa,
      u.segmento,
      u.estatus || 'Sin señal',
      u.velocidad ? `${u.velocidad} km/h` : '-',
      u.ubicacion || '-',
      formatSignalTime(u.fecha_gps),
    ]);
    
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `despacho_${activeSegmento}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 border-b border-slate-700/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <button onClick={onBack} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-slate-400" />
              </button>
            )}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-lg shadow-orange-500/20">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Despacho Inteligente</h1>
                <p className="text-xs text-slate-400">Monitoreo GPS en tiempo real</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Auto-sync indicator */}
            <div className="flex items-center gap-2 bg-slate-700/50 px-3 py-1.5 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-slate-300">Auto-sync</span>
              <span className="text-xs text-orange-400 font-mono">{countdown}s</span>
            </div>
            
            <span className="text-xs text-slate-500">Últ: {lastUpdate}</span>
            
            <button
              onClick={loadFleet}
              disabled={loading}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-slate-300 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Tabs de segmentos */}
        <div className="flex flex-wrap gap-2 mb-6">
          {segmentCounts.filter(s => s.count > 0).map(seg => (
            <button
              key={seg.key}
              onClick={() => setActiveSegmento(seg.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeSegmento === seg.key
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {seg.label} ({seg.count})
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-4 mb-4">
          {/* Contadores */}
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 px-3 py-1.5 bg-slate-700/50 rounded-lg">
              <Truck className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-white font-medium">{filteredFleet.length}</span>
            </span>
            <span className="flex items-center gap-1 px-3 py-1.5 bg-green-900/30 rounded-lg">
              <Navigation className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-400">{movingCount}</span>
            </span>
            <span className="flex items-center gap-1 px-3 py-1.5 bg-amber-900/30 rounded-lg">
              <RefreshCw className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-amber-400">{stoppedCount}</span>
            </span>
            <span className="flex items-center gap-1 px-3 py-1.5 bg-red-900/30 rounded-lg">
              <WifiOff className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-400">{noSignalCount}</span>
            </span>
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Eco..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Export */}
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4 text-slate-300" />
            <span className="text-sm text-slate-300">CSV</span>
          </button>
        </div>

        {/* Tabla */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
          <div className="overflow-y-auto max-h-[calc(100vh-340px)]" style={{ scrollSnapType: "y mandatory" }}>
            <table className="w-full text-sm">
              <thead className="bg-slate-800 sticky top-0 z-20 shadow-md">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Económico</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Empresa</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Estatus</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Detención</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Velocidad</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Ubicación</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">Señal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-5 h-5 text-orange-500 animate-spin" />
                        <span className="text-slate-400">Cargando flota...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredFleet.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                      No hay unidades en este segmento
                    </td>
                  </tr>
                ) : (
                  filteredFleet.map(u => (
                    <tr key={u.economico} className="hover:bg-slate-700/30 transition-colors h-14" style={{ scrollSnapAlign: "start" }}>
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-white">{u.economico}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium text-white ${EMP_COLORS[u.empresa] || 'bg-slate-600'}`}>
                          {u.empresa}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {u.latitud ? (
                          <span className={`flex items-center gap-1 text-xs ${
                            u.estatus === 'En Movimiento' ? 'text-green-400' : 'text-amber-400'
                          }`}>
                            {u.estatus === 'En Movimiento' ? (
                              <Navigation className="w-3 h-3" />
                            ) : (
                              <RefreshCw className="w-3 h-3" />
                            )}
                            {u.estatus}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-red-400">
                            <WifiOff className="w-3 h-3" />
                            Sin señal
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {calcStoppedTime(u.fecha_gps, u.estatus)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs ${u.velocidad && u.velocidad > 0 ? 'text-green-400' : 'text-slate-500'}`}>
                          {u.velocidad ? `${u.velocidad} km/h` : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {u.latitud && u.longitud ? (
                          <a
                            href={`https://www.google.com/maps?q=${u.latitud},${u.longitud}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-slate-300 hover:text-orange-400 transition-colors truncate block max-w-[300px]"
                            title={u.ubicacion || 'Ver en mapa'}
                          >
                            {u.ubicacion || `${u.latitud.toFixed(4)}, ${u.longitud.toFixed(4)}`}
                          </a>
                        ) : (
                          <span className="text-xs text-slate-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-xs text-slate-400">{formatSignalTime(u.fecha_gps)}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
