'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Truck, Power, RefreshCw, Search, Download, WifiOff, Navigation, ExternalLink, Clock, AlertTriangle, Zap, ArrowLeft } from 'lucide-react';

const SUPABASE_URL = 'https://fbxbsslhewchyibdoyzk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieGJzc2xoZXdjaHlpYmRveXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzczODEsImV4cCI6MjA3ODExMzM4MX0.Z8JPlg7hhKbA624QGHp2bKKTNtCD3WInQMO5twjl6a0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const SEGMENTOS = ['IMPEX', 'CARROL', 'BAFAR', 'NatureSweet', 'Pilgrims', 'ALPURA', 'BARCEL', 'PATIOS', 'ACCIDENTE', 'PENDIENTE'];

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
  stopped_minutes: number | null;
  stopped_time: string | null;
  status: string;
  anomaly: string | null;
}

const EMP_ORDER: Record<string, number> = { SHI: 1, TROB: 2, WE: 3 };

interface DespachoProps {
  onBack?: () => void;
}

export default function DespachoInteligenteContent({ onBack }: DespachoProps) {
  const [fleet, setFleet] = useState<Unit[]>([]);
  const [activeSegmento, setActiveSegmento] = useState('IMPEX');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusF, setStatusF] = useState('ALL');
  const [workerStatus, setWorkerStatus] = useState<'idle' | 'running' | 'error'>('idle');
  const [countdown, setCountdown] = useState<string>('');
  const [nextCronTime, setNextCronTime] = useState<string>('');

  const calcularProximoCron = useCallback(() => {
    const now = new Date();
    const mins = now.getMinutes();
    const nextMins = Math.ceil((mins + 1) / 5) * 5;
    const next = new Date(now);
    
    if (nextMins >= 60) {
      next.setHours(next.getHours() + 1);
      next.setMinutes(nextMins - 60, 0, 0);
    } else {
      next.setMinutes(nextMins, 0, 0);
    }
    
    const horaStr = next.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });
    setNextCronTime(horaStr);
    
    const diffMs = next.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);
    
    if (diffMins <= 0 && diffSecs <= 30) {
      setCountdown('ejecutando...');
    } else if (diffMins === 0) {
      setCountdown(`${diffSecs}s`);
    } else {
      setCountdown(`${diffMins}m`);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('gps_tracking').select('*').order('segmento');
      if (error) throw error;
      if (data && data.length > 0) setFleet(data);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const triggerWorker = async () => {
    setWorkerStatus('running');
    try {
      const res = await fetch('https://fbxbsslhewchyibdoyzk.supabase.co/functions/v1/gps-worker', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        await loadData();
        setWorkerStatus('idle');
      } else {
        setWorkerStatus('error');
        setTimeout(() => setWorkerStatus('idle'), 3000);
      }
    } catch {
      setWorkerStatus('error');
      setTimeout(() => setWorkerStatus('idle'), 3000);
    }
  };

  useEffect(() => {
    loadData();
    calcularProximoCron();
    
    const channel = supabase.channel('gps_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gps_tracking' }, () => loadData())
      .subscribe();

    const countdownInterval = setInterval(calcularProximoCron, 1000);
    const dataInterval = setInterval(loadData, 30000);

    return () => { channel.unsubscribe(); clearInterval(countdownInterval); clearInterval(dataInterval); };
  }, [loadData, calcularProximoCron]);

  const segmentoUnits = fleet.filter(u => u.segmento === activeSegmento);
  
  const filtered = segmentoUnits.filter(u => {
    if (search && !u.economico.includes(search)) return false;
    if (statusF === 'moving' && u.status !== 'moving') return false;
    if (statusF === 'stopped' && u.status !== 'stopped') return false;
    if (statusF === 'no_signal' && !['no_signal', 'gps_issue', 'pending'].includes(u.status)) return false;
    return true;
  }).sort((a, b) => (EMP_ORDER[a.empresa] || 9) - (EMP_ORDER[b.empresa] || 9) || parseInt(a.economico) - parseInt(b.economico));

  const stats = {
    total: segmentoUnits.length,
    mov: segmentoUnits.filter(u => u.status === 'moving').length,
    det: segmentoUnits.filter(u => u.status === 'stopped').length,
    sin: segmentoUnits.filter(u => ['no_signal', 'gps_issue', 'pending'].includes(u.status)).length,
    anomalies: segmentoUnits.filter(u => u.anomaly).length
  };

  const segmentoCounts = SEGMENTOS.reduce((acc, seg) => {
    acc[seg] = fleet.filter(u => u.segmento === seg).length;
    return acc;
  }, {} as Record<string, number>);

  const openMap = (u: Unit) => u.latitude && window.open(`https://www.google.com/maps?q=${u.latitude},${u.longitude}`, '_blank');

  const exportCSV = () => {
    const rows = [['Economico', 'Empresa', 'Segmento', 'Estatus', 'Detencion', 'Velocidad', 'Ubicación', 'Lat', 'Lon', 'Última Señal']];
    filtered.forEach(u => rows.push([u.economico, u.empresa, u.segmento, u.status, u.stopped_time || '', String(u.speed || 0), u.address || '', String(u.latitude || ''), String(u.longitude || ''), u.timestamp_gps || '']));
    const blob = new Blob(['\ufeff' + rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `GPS_${activeSegmento}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const formatTime = (t: string | null) => {
    if (!t) return '-';
    try { return new Date(t.includes('/') ? t.replace(/\//g, '-') : t).toLocaleString('es-MX', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true }); } catch { return t; }
  };

  const getStoppedColor = (minutes: number | null) => {
    if (!minutes || minutes < 1) return 'text-slate-500';
    if (minutes >= 480) return 'text-red-400';
    if (minutes >= 240) return 'text-orange-400';
    if (minutes >= 60) return 'text-yellow-400';
    return 'text-slate-400';
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

  if (fleet.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #1a365d 0%, #0f172a 100%)' }}>
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <p className="text-slate-300 text-lg mb-4">No hay datos</p>
          <button onClick={triggerWorker} disabled={workerStatus === 'running'} className="px-6 py-3 rounded-xl bg-gradient-to-b from-blue-500 to-blue-700 text-white font-semibold flex items-center gap-2 mx-auto">
            <Zap className={`w-5 h-5 ${workerStatus === 'running' ? 'animate-pulse' : ''}`} />
            {workerStatus === 'running' ? 'Cargando...' : 'Iniciar carga'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #1a365d 0%, #0f172a 100%)' }}>
      {/* HEADER - Solo tabs y controles, SIN logo duplicado */}
      <div className="px-4 py-2 flex items-center gap-3 border-b border-slate-700/50">
        {onBack && (
          <button onClick={onBack} className="p-2 rounded-lg bg-slate-700/50 text-white hover:bg-slate-600/50">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        
        {/* TABS */}
        <div className="flex flex-wrap gap-1.5">
          {SEGMENTOS.map(seg => {
            const count = segmentoCounts[seg] || 0;
            if (count === 0) return null;
            const isActive = activeSegmento === seg;
            return (
              <button key={seg} onClick={() => setActiveSegmento(seg)}
                className={`h-8 px-3 rounded-lg text-xs font-semibold transition-all ${isActive ? 'bg-gradient-to-b from-blue-500 to-blue-700 text-white' : 'bg-slate-600/80 text-white hover:bg-slate-500/80'}`}>
                {seg} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2">
        <button onClick={() => setStatusF('ALL')} className={`h-8 px-3 rounded-lg font-semibold text-xs flex items-center gap-1.5 ${statusF === 'ALL' ? 'bg-gradient-to-b from-slate-500 to-slate-700 text-white' : 'bg-slate-700/80 text-slate-300'}`}>
          <Truck className="w-3.5 h-3.5" />{stats.total}
        </button>
        <button onClick={() => setStatusF('moving')} className={`h-8 px-3 rounded-lg font-semibold text-xs flex items-center gap-1.5 ${statusF === 'moving' ? 'bg-gradient-to-b from-green-500 to-green-700 text-white' : 'bg-slate-700/80 text-slate-300'}`}>
          <Navigation className="w-3.5 h-3.5" />{stats.mov}
        </button>
        <button onClick={() => setStatusF('stopped')} className={`h-8 px-3 rounded-lg font-semibold text-xs flex items-center gap-1.5 ${statusF === 'stopped' ? 'bg-gradient-to-b from-yellow-500 to-yellow-600 text-white' : 'bg-slate-700/80 text-slate-300'}`}>
          <Power className="w-3.5 h-3.5" />{stats.det}
        </button>
        <button onClick={() => setStatusF('no_signal')} className={`h-8 px-3 rounded-lg font-semibold text-xs flex items-center gap-1.5 ${statusF === 'no_signal' ? 'bg-gradient-to-b from-red-500 to-red-700 text-white' : 'bg-slate-700/80 text-slate-300'}`}>
          <WifiOff className="w-3.5 h-3.5" />{stats.sin}
        </button>
        
        {stats.anomalies > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-500/20 text-purple-300 text-xs">
            <AlertTriangle className="w-3 h-3" />{stats.anomalies}
          </div>
        )}

        <div className="relative ml-2">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Eco..." 
            className="h-8 w-20 pl-7 pr-2 rounded-lg bg-slate-700/60 border border-slate-600/50 text-white text-xs placeholder-slate-400 focus:outline-none" />
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-700/40 border border-slate-600/30">
          <div className={`w-1.5 h-1.5 rounded-full ${countdown === 'ejecutando...' ? 'bg-orange-400 animate-pulse' : 'bg-green-400'}`} />
          <span className="text-[10px] text-slate-400">Cron</span>
          <span className="text-xs text-blue-400 font-semibold">{countdown}</span>
          <span className="text-[10px] text-slate-500">→ {nextCronTime}</span>
        </div>

        <button onClick={exportCSV} className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-700/60 text-slate-300 hover:bg-slate-600/60">
          <Download className="w-3.5 h-3.5" />
        </button>

        <button onClick={triggerWorker} disabled={workerStatus === 'running'}
          className={`h-8 px-3 rounded-lg font-semibold text-xs flex items-center gap-1.5 ${
            workerStatus === 'running' ? 'bg-orange-600' : workerStatus === 'error' ? 'bg-red-600' : 'bg-blue-600'
          } text-white`}>
          {workerStatus === 'running' ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" />Actualizando</> : 
           workerStatus === 'error' ? <><AlertTriangle className="w-3.5 h-3.5" />Error</> : 
           <><Zap className="w-3.5 h-3.5" />Actualizar</>}
        </button>
      </div>

      {/* Table */}
      <div className="px-4 pb-4">
        <div className="rounded-xl overflow-hidden bg-slate-800/40">
          <div className="max-h-[calc(100vh-120px)] overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-slate-900/95 z-10">
                <tr>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold text-slate-400 uppercase w-20">ECONÓMICO</th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold text-slate-400 uppercase w-14">EMPRESA</th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold text-slate-400 uppercase w-16">ESTATUS</th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold text-slate-400 uppercase w-20">DETENCIÓN</th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold text-slate-400 uppercase w-16">VELOCIDAD</th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold text-slate-400 uppercase">UBICACIÓN</th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold text-slate-400 uppercase w-28">SEÑAL</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.economico} className={`border-t border-slate-700/30 hover:bg-slate-700/20 ${u.anomaly ? 'bg-purple-900/10' : ''}`}>
                    <td className="px-3 py-1.5 font-mono font-bold text-white text-sm">
                      {u.economico}
                      {u.anomaly && <AlertTriangle className="w-3 h-3 text-purple-400 inline ml-1" />}
                    </td>
                    <td className="px-3 py-1.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        u.empresa === 'SHI' ? 'bg-purple-500/20 text-purple-300' : 
                        u.empresa === 'TROB' ? 'bg-blue-500/20 text-blue-300' : 'bg-emerald-500/20 text-emerald-300'
                      }`}>{u.empresa}</span>
                    </td>
                    <td className="px-3 py-1.5">
                      <button onClick={() => openMap(u)} disabled={!u.latitude} 
                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${getStatusColor(u.status)} ${u.latitude ? 'cursor-pointer hover:opacity-80' : 'opacity-60'}`}>
                        {u.status === 'moving' ? <Navigation className="w-3 h-3" /> : u.status === 'stopped' ? <Power className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                        {u.status === 'moving' ? 'Mov' : u.status === 'stopped' ? 'Det' : 'Sin'}
                        {u.latitude && <ExternalLink className="w-2 h-2" />}
                      </button>
                    </td>
                    <td className="px-3 py-1.5">
                      <span className={`text-xs font-semibold ${getStoppedColor(u.stopped_minutes)}`}>
                        {u.stopped_time || ''}
                      </span>
                    </td>
                    <td className="px-3 py-1.5">
                      <span className={`text-xs font-semibold ${(u.speed || 0) > 0 ? 'text-green-400' : 'text-slate-500'}`}>
                        {u.speed != null ? `${u.speed} km/h` : '-'}
                      </span>
                    </td>
                    <td className="px-3 py-1.5">
                      <span className="text-slate-300 text-xs truncate block max-w-[350px]">{u.address || '-'}</span>
                    </td>
                    <td className="px-3 py-1.5 text-slate-400 text-[10px]">{formatTime(u.timestamp_gps)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
