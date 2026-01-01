'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Truck, RefreshCw, Search, ArrowLeft, Navigation, WifiOff, MapPin, Clock } from 'lucide-react';

const SUPABASE_URL = 'https://fbxbsslhewchyibdoyzk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieGJzc2xoZXdjaHlpYmRveXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzczODEsImV4cCI6MjA3ODExMzM4MX0.Z8JPlg7hhKbA624QGHp2bKKTNtCD3WInQMO5twjl6a0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE SEGMENTOS DEDICADOS
// Cada segmento tiene sus palabras clave para filtrar de gps_tracking
// ═══════════════════════════════════════════════════════════════════════════
const SEGMENTOS_DEDICADOS = [
  { 
    key: 'CARROL', 
    label: 'Granjas Carroll', 
    color: 'from-green-600 to-green-700',
    match: ['CARROL', 'PATIO CARROL'] 
  },
  { 
    key: 'BAFAR', 
    label: 'Bafar', 
    color: 'from-red-600 to-red-700',
    match: ['BAFAR'] 
  },
  { 
    key: 'ALPURA', 
    label: 'Alpura', 
    color: 'from-blue-600 to-blue-700',
    match: ['ALPURA'] 
  },
  { 
    key: 'BARCEL', 
    label: 'Barcel', 
    color: 'from-yellow-600 to-amber-700',
    match: ['BARCEL'] 
  },
  { 
    key: 'NATURESWEET', 
    label: 'NatureSweet', 
    color: 'from-emerald-600 to-teal-700',
    match: ['DEDICADO NS', 'NS/MULA'] 
  },
  { 
    key: 'PILGRIMS', 
    label: 'Pilgrims', 
    color: 'from-orange-600 to-orange-700',
    match: ['DEDICADO PILGRIMS'] 
  },
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

interface DedicadosModuleProps {
  onBack: () => void;
}

const EMP_COLORS: Record<string, string> = {
  TROB: 'bg-blue-600',
  WE: 'bg-purple-600',
  SHI: 'bg-emerald-600',
};

// Verificar si una unidad pertenece a un segmento
function matchesSegmento(unitSegmento: string, segmentoConfig: typeof SEGMENTOS_DEDICADOS[0]): boolean {
  if (!unitSegmento) return false;
  const seg = unitSegmento.toUpperCase();
  return segmentoConfig.match.some(m => seg.includes(m.toUpperCase()));
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

export function DedicadosModuleWideTech({ onBack }: DedicadosModuleProps) {
  const [allUnits, setAllUnits] = useState<Unit[]>([]);
  const [activeSegmento, setActiveSegmento] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [lastUpdate, setLastUpdate] = useState<string>('');

  // Cargar todos los datos de gps_tracking
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('gps_tracking')
        .select('*')
        .order('economico', { ascending: true });

      if (error) throw error;
      setAllUnits(data || []);
      setLastUpdate(new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar al inicio y cada 60 segundos
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Contar unidades por segmento
  const segmentCounts = SEGMENTOS_DEDICADOS.map(seg => ({
    ...seg,
    count: allUnits.filter(u => matchesSegmento(u.segmento, seg)).length,
  }));

  // Filtrar unidades del segmento activo
  const activeConfig = SEGMENTOS_DEDICADOS.find(s => s.key === activeSegmento);
  const filteredUnits = activeConfig
    ? allUnits.filter(u => {
        if (!matchesSegmento(u.segmento, activeConfig)) return false;
        if (search) {
          const s = search.toLowerCase();
          if (!u.economico.toLowerCase().includes(s) &&
              !u.empresa?.toLowerCase().includes(s) &&
              !u.ubicacion?.toLowerCase().includes(s)) {
            return false;
          }
        }
        return true;
      })
    : [];

  // Stats del segmento activo
  const movingCount = filteredUnits.filter(u => u.estatus === 'En Movimiento').length;
  const stoppedCount = filteredUnits.filter(u => u.estatus === 'Detenido').length;
  const noSignalCount = filteredUnits.filter(u => !u.latitud).length;

  // Vista de selección de segmento
  if (!activeSegmento) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Header */}
        <div className="bg-slate-800/50 border-b border-slate-700/50 px-6 py-4">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-lg shadow-orange-500/20">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Dedicados</h1>
                <p className="text-xs text-slate-400">Selecciona un segmento</p>
              </div>
            </div>
          </div>
        </div>

        {/* Grid de segmentos */}
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {segmentCounts.filter(s => s.count > 0).map(seg => (
              <button
                key={seg.key}
                onClick={() => setActiveSegmento(seg.key)}
                className={`p-6 rounded-2xl bg-gradient-to-br ${seg.color} hover:scale-105 transition-all shadow-lg`}
              >
                <div className="flex flex-col items-center gap-2">
                  <Truck className="w-10 h-10 text-white/80" />
                  <span className="text-lg font-bold text-white">{seg.label}</span>
                  <span className="text-3xl font-black text-white">{seg.count}</span>
                  <span className="text-xs text-white/70">unidades</span>
                </div>
              </button>
            ))}
          </div>

          {/* Mensaje si no hay datos */}
          {loading && (
            <div className="flex items-center justify-center mt-12">
              <RefreshCw className="w-6 h-6 text-orange-500 animate-spin mr-2" />
              <span className="text-slate-400">Cargando datos...</span>
            </div>
          )}

          {!loading && segmentCounts.every(s => s.count === 0) && (
            <div className="text-center mt-12">
              <WifiOff className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No hay datos GPS disponibles</p>
              <p className="text-xs text-slate-500 mt-2">Ejecuta el script GPS-WORKER para cargar datos</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Vista de detalle del segmento
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 border-b border-slate-700/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setActiveSegmento(null)} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </button>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl bg-gradient-to-br ${activeConfig?.color}`}>
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{activeConfig?.label}</h1>
                <p className="text-xs text-slate-400">{filteredUnits.length} unidades</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-700/50 px-3 py-1.5 rounded-lg">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-300">{lastUpdate}</span>
            </div>
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 text-slate-300 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-4 mb-4">
          {/* Stats */}
          <div className="flex items-center gap-2">
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
              placeholder="Buscar eco..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
          <div className="overflow-x-auto max-h-[calc(100vh-280px)]">
            <table className="w-full text-sm">
              <thead className="bg-slate-700/50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Eco</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Empresa</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Estatus</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Detención</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Velocidad</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Ubicación</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">Señal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filteredUnits.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                      No hay unidades
                    </td>
                  </tr>
                ) : (
                  filteredUnits.map(u => (
                    <tr key={u.economico} className="hover:bg-slate-700/30 transition-colors">
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
                            {u.estatus === 'En Movimiento' ? <Navigation className="w-3 h-3" /> : <RefreshCw className="w-3 h-3" />}
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
                            className="flex items-center gap-1 text-xs text-slate-300 hover:text-orange-400 transition-colors"
                          >
                            <MapPin className="w-3 h-3" />
                            <span className="truncate max-w-[250px]">{u.ubicacion || 'Ver mapa'}</span>
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
