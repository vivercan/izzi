'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Truck, RefreshCw, Search, Download, WifiOff, Navigation, ArrowLeft, ChevronUp, ChevronDown, Power, ExternalLink, Clock, AlertTriangle, Zap } from 'lucide-react';

const SUPABASE_URL = 'https://fbxbsslhewchyibdoyzk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieGJzc2xoZXdjaHlpYmRveXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzczODEsImV4cCI6MjA3ODExMzM4MX0.Z8JPlg7hhKbA624QGHp2bKKTNtCD3WInQMO5twjl6a0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Segmentos
const SEGMENTOS_CONFIG = [
  { key: 'IMPEX', label: 'IMPEX', match: ['IMPEX', 'MTTO', 'NEXTEER', 'CLARIOS'] },
  { key: 'CARROL', label: 'CARROL', match: ['CARROL'] },
  { key: 'BAFAR', label: 'BAFAR', match: ['BAFAR'] },
  { key: 'ALPURA', label: 'ALPURA', match: ['ALPURA'] },
  { key: 'BARCEL', label: 'BARCEL', match: ['BARCEL'] },
  { key: 'ACCIDENTE', label: 'ACCIDENTE', match: ['ACCIDENTE'] },
  { key: 'DEDICADO_NS', label: 'NatureSweet', match: ['DEDICADO NS', 'NS/MULA', 'NatureSweet'] },
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
  estado_geo: string | null;
  municipio_geo: string | null;
}

type SortField = 'economico' | 'empresa' | 'estatus' | 'detencion' | 'velocidad' | 'ubicacion' | 'fecha_gps';
type SortDirection = 'asc' | 'desc';

const EMP_COLORS: Record<string, string> = {
  TROB: 'bg-blue-600',
  WE: 'bg-purple-600',
  SHI: 'bg-emerald-600',
};

// Helper: Title Case
const toTitleCase = (str: string | null): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Helper: Formatear ubicación limpia
const formatUbicacion = (unit: Unit): string => {
  const parts: string[] = [];
  
  // Priorizar estado_geo y municipio_geo
  if (unit.estado_geo) {
    parts.push(toTitleCase(unit.estado_geo));
  }
  if (unit.municipio_geo) {
    parts.push(toTitleCase(unit.municipio_geo));
  }
  
  // Si no hay geo, usar ubicacion pero limpiarla
  if (parts.length === 0 && unit.ubicacion) {
    // Aplicar Title Case a la ubicación cruda
    return toTitleCase(unit.ubicacion);
  }
  
  return parts.join(', ') || '-';
};

// Helper: Calcular tiempo detenido
const calcularDetencion = (unit: Unit): string => {
  if (!unit.ultima_actualizacion) return '';
  const vel = unit.velocidad || 0;
  if (vel > 0) return '';
  
  const ahora = new Date();
  const ultima = new Date(unit.ultima_actualizacion);
  const diffMs = ahora.getTime() - ultima.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  
  if (diffMins < 60) return `${diffMins}m`;
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  if (hours < 24) return `${hours}h ${mins}m`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return `${days}d ${remHours}h`;
};

interface DespachoProps {
  onBack?: () => void;
}

export default function DespachoInteligenteContent({ onBack }: DespachoProps) {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [segmentoActivo, setSegmentoActivo] = useState<string | null>(null);
  const [filtroEstatus, setFiltroEstatus] = useState<'todos' | 'movimiento' | 'detenido' | 'sinsenal'>('todos');
  const [busqueda, setBusqueda] = useState('');
  const [sortField, setSortField] = useState<SortField>('economico');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(0);

  // Cargar datos
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('gps_tracking')
        .select('economico, empresa, segmento, latitud, longitud, velocidad, ubicacion, estatus, ultima_actualizacion, fecha_gps, estado_geo, municipio_geo')
        .order('economico');
      
      if (error) throw error;
      setUnits(data || []);
      setUltimaActualizacion(new Date());
    } catch (err) {
      console.error('Error fetching GPS data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh cada minuto
    return () => clearInterval(interval);
  }, [fetchData]);

  // Countdown para próximo auto-sync
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const mins = now.getMinutes();
      const secs = now.getSeconds();
      const nextSync = (10 - (mins % 10)) * 60 - secs;
      setCountdown(nextSync > 0 ? nextSync : 600);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Conteos por segmento
  const conteosPorSegmento = useMemo(() => {
    const conteos: Record<string, number> = {};
    SEGMENTOS_CONFIG.forEach(seg => {
      conteos[seg.key] = units.filter(u => 
        seg.match.some(m => u.segmento?.toUpperCase().includes(m.toUpperCase()))
      ).length;
    });
    return conteos;
  }, [units]);

  // Filtrar unidades
  const filteredUnits = useMemo(() => {
    let result = [...units];
    
    // Filtro por segmento
    if (segmentoActivo) {
      const seg = SEGMENTOS_CONFIG.find(s => s.key === segmentoActivo);
      if (seg) {
        result = result.filter(u => 
          seg.match.some(m => u.segmento?.toUpperCase().includes(m.toUpperCase()))
        );
      }
    }
    
    // Filtro por estatus
    if (filtroEstatus !== 'todos') {
      result = result.filter(u => {
        const vel = u.velocidad || 0;
        const tieneGPS = u.latitud && u.longitud && u.ultima_actualizacion;
        const horasDesde = u.ultima_actualizacion 
          ? (new Date().getTime() - new Date(u.ultima_actualizacion).getTime()) / (1000 * 60 * 60)
          : 999;
        
        if (filtroEstatus === 'movimiento') return vel > 0;
        if (filtroEstatus === 'detenido') return vel === 0 && tieneGPS && horasDesde < 24;
        if (filtroEstatus === 'sinsenal') return !tieneGPS || horasDesde > 24;
        return true;
      });
    }
    
    // Filtro por búsqueda
    if (busqueda) {
      const q = busqueda.toLowerCase();
      result = result.filter(u => 
        u.economico?.toLowerCase().includes(q) ||
        u.empresa?.toLowerCase().includes(q) ||
        u.segmento?.toLowerCase().includes(q)
      );
    }
    
    // Ordenar
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'economico':
          cmp = (a.economico || '').localeCompare(b.economico || '');
          break;
        case 'empresa':
          cmp = (a.empresa || '').localeCompare(b.empresa || '');
          break;
        case 'velocidad':
          cmp = (a.velocidad || 0) - (b.velocidad || 0);
          break;
        case 'fecha_gps':
          cmp = new Date(a.ultima_actualizacion || 0).getTime() - new Date(b.ultima_actualizacion || 0).getTime();
          break;
        default:
          cmp = 0;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    
    return result;
  }, [units, segmentoActivo, filtroEstatus, busqueda, sortField, sortDir]);

  // Stats
  const stats = useMemo(() => {
    const enMovimiento = units.filter(u => (u.velocidad || 0) > 0).length;
    const detenidos = units.filter(u => {
      const vel = u.velocidad || 0;
      const horasDesde = u.ultima_actualizacion 
        ? (new Date().getTime() - new Date(u.ultima_actualizacion).getTime()) / (1000 * 60 * 60)
        : 999;
      return vel === 0 && horasDesde < 24;
    }).length;
    const sinSenal = units.length - enMovimiento - detenidos;
    return { total: units.length, enMovimiento, detenidos, sinSenal };
  }, [units]);

  // Toggle sort
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  // Exportar CSV
  const exportCSV = () => {
    const headers = ['ECONÓMICO', 'EMPRESA', 'ESTATUS', 'DETENCIÓN', 'VELOCIDAD', 'ESTADO', 'MUNICIPIO', 'UBICACIÓN', 'SEÑAL'];
    const rows = filteredUnits.map(u => {
      const vel = u.velocidad || 0;
      const estatus = vel > 0 ? 'En Movimiento' : 'Detenido';
      return [
        u.economico,
        u.empresa,
        estatus,
        calcularDetencion(u),
        vel > 0 ? `${vel} km/h` : '-',
        u.estado_geo || '',
        u.municipio_geo || '',
        u.ubicacion || '',
        u.ultima_actualizacion ? new Date(u.ultima_actualizacion).toLocaleString('es-MX') : ''
      ];
    });
    
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `despacho_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const formatTime = (ts: string | null) => {
    if (!ts) return '-';
    return new Date(ts).toLocaleString('es-MX', { 
      day: '2-digit', 
      month: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-900/80 backdrop-blur border-b border-orange-500/30 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button onClick={onBack} className="p-1.5 hover:bg-slate-700 rounded-md transition-colors">
                <ArrowLeft className="w-5 h-5 text-slate-400" />
              </button>
            )}
            <Truck className="w-6 h-6 text-orange-500" />
            <div>
              <h1 className="text-xl font-bold text-white">Despacho Inteligente</h1>
              <p className="text-xs text-slate-400">Monitoreo GPS en tiempo real</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                Auto-sync
              </span>
              <span className="text-orange-400 font-mono">{Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}s</span>
            </div>
            <span className="text-slate-400 text-xs">
              Últ: {ultimaActualizacion?.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <button 
              onClick={fetchData}
              disabled={loading}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-slate-300 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Segmentos */}
        <div className="flex flex-wrap gap-2">
          {SEGMENTOS_CONFIG.map(seg => (
            <button
              key={seg.key}
              onClick={() => setSegmentoActivo(segmentoActivo === seg.key ? null : seg.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                segmentoActivo === seg.key
                  ? 'bg-orange-600 text-white'
                  : 'bg-slate-700/60 text-slate-300 hover:bg-slate-600/60'
              }`}
            >
              {seg.label} ({conteosPorSegmento[seg.key] || 0})
            </button>
          ))}
        </div>

        {/* Filtros y búsqueda */}
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFiltroEstatus(filtroEstatus === 'movimiento' ? 'todos' : 'movimiento')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${
                filtroEstatus === 'movimiento' ? 'bg-emerald-600 text-white' : 'bg-slate-700/60 text-slate-300'
              }`}
            >
              <Navigation className="w-3 h-3" /> {stats.enMovimiento}
            </button>
            <button
              onClick={() => setFiltroEstatus(filtroEstatus === 'detenido' ? 'todos' : 'detenido')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${
                filtroEstatus === 'detenido' ? 'bg-amber-600 text-white' : 'bg-slate-700/60 text-slate-300'
              }`}
            >
              <Power className="w-3 h-3" /> {stats.detenidos}
            </button>
            <button
              onClick={() => setFiltroEstatus(filtroEstatus === 'sinsenal' ? 'todos' : 'sinsenal')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${
                filtroEstatus === 'sinsenal' ? 'bg-red-600 text-white' : 'bg-slate-700/60 text-slate-300'
              }`}
            >
              <WifiOff className="w-3 h-3" /> {stats.sinSenal}
            </button>
          </div>
          
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Eco..."
              className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 text-sm"
            />
          </div>
          
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700/60 hover:bg-slate-600/60 rounded-lg text-slate-300 text-sm transition-colors"
          >
            <Download className="w-4 h-4" /> CSV
          </button>
        </div>

        {/* Tabla */}
        <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/80 sticky top-0">
                <tr>
                  {[
                    { field: 'economico', label: 'ECONÓMICO' },
                    { field: 'empresa', label: 'EMPRESA' },
                    { field: 'estatus', label: 'ESTATUS' },
                    { field: 'detencion', label: 'DETENCIÓN' },
                    { field: 'velocidad', label: 'VELOCIDAD' },
                    { field: 'ubicacion', label: 'UBICACIÓN' },
                    { field: 'fecha_gps', label: 'SEÑAL' },
                  ].map(col => (
                    <th
                      key={col.field}
                      onClick={() => toggleSort(col.field as SortField)}
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        {col.label}
                        {sortField === col.field && (
                          sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {filteredUnits.map((u) => {
                  const vel = u.velocidad || 0;
                  const enMovimiento = vel > 0;
                  const horasDesde = u.ultima_actualizacion 
                    ? (new Date().getTime() - new Date(u.ultima_actualizacion).getTime()) / (1000 * 60 * 60)
                    : 999;
                  const sinSenal = horasDesde > 24;
                  
                  return (
                    <tr key={u.economico} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-white font-bold">{u.economico}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold text-white ${EMP_COLORS[u.empresa] || 'bg-slate-600'}`}>
                          {u.empresa}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {sinSenal ? (
                          <span className="flex items-center gap-1 text-red-400 text-sm">
                            <WifiOff className="w-3 h-3" /> Sin señal
                          </span>
                        ) : enMovimiento ? (
                          <span className="flex items-center gap-1 text-emerald-400 text-sm">
                            <Navigation className="w-3 h-3" /> En Movimiento
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-amber-400 text-sm">
                            <Power className="w-3 h-3" /> Detenido
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm ${horasDesde > 2 ? 'text-red-400' : 'text-slate-300'}`}>
                          {calcularDetencion(u) || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-semibold ${enMovimiento ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {enMovimiento ? `${vel} km/h` : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col max-w-md">
                          {/* Mostrar Estado | Municipio primero */}
                          {(u.estado_geo || u.municipio_geo) && (
                            <span className="text-cyan-400 text-sm font-medium">
                              {[u.estado_geo, u.municipio_geo].filter(Boolean).map(s => toTitleCase(s)).join(' | ')}
                            </span>
                          )}
                          {/* Descripción en segundo lugar */}
                          <span className="text-slate-400 text-xs truncate">
                            {toTitleCase(u.ubicacion) || '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs ${sinSenal ? 'text-red-400' : 'text-slate-400'}`}>
                          {formatTime(u.ultima_actualizacion)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
