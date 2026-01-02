'use client';

import React, { useState, useEffect } from 'react';
import { Target, ArrowLeft, Download, MapPin, Gauge, Clock, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';

// ===== DATOS GLOBALES =====
const GLOBAL = { meta_anual: 1341341246.49, operatividad: 0.95, tractores_totales: 219, tractores_facturan: 210 };

const EMPRESAS = [
  { id: 'SPEEDYHAUL', nombre: 'SPEEDYHAUL', pct: 0.15, ppto: 201201187, unidades: 33 },
  { id: 'TROB', nombre: 'TROB', pct: 0.595, ppto: 798098042, unidades: 131 },
  { id: 'WEXPRESS', nombre: 'WEXPRESS', pct: 0.255, ppto: 342042018, unidades: 56 },
];

const SEGMENTOS = [
  { id: 'BAFAR', nombre: 'Bafar', tractores: 16, pct: 0.059, ppto: 79152000, tmes: 412250 },
  { id: 'CARROLL', nombre: 'Carroll', tractores: 31, pct: 0.119, ppto: 160166400, tmes: 430555 },
  { id: 'BARCEL', nombre: 'Barcel', tractores: 10, pct: 0.051, ppto: 68140135, tmes: 567834 },
  { id: 'NATURE_SWEET', nombre: 'Nature Sweet', tractores: 13, pct: 0.051, ppto: 68094000, tmes: 436500 },
  { id: 'ALPURA', nombre: 'ALPURA', tractores: 13, pct: 0.059, ppto: 78570000, tmes: 503654 },
  { id: 'IMPEX', nombre: 'IMPEX', tractores: 116, pct: 0.608, ppto: 815456954, tmes: 585817 },
  { id: 'PILGRIMS', nombre: 'Pilgrims', tractores: 11, pct: 0.054, ppto: 71761757, tmes: 543650 },
];

const MESES = [
  { mes: 1, nombre: 'Enero', pct: 0.07, ppto: 93893887 },
  { mes: 2, nombre: 'Febrero', pct: 0.07, ppto: 93893887 },
  { mes: 3, nombre: 'Marzo', pct: 0.08, ppto: 107307300 },
  { mes: 4, nombre: 'Abril', pct: 0.08, ppto: 107307300 },
  { mes: 5, nombre: 'Mayo', pct: 0.081, ppto: 108648641 },
  { mes: 6, nombre: 'Junio', pct: 0.085, ppto: 114014006 },
  { mes: 7, nombre: 'Julio', pct: 0.087, ppto: 116696688 },
  { mes: 8, nombre: 'Agosto', pct: 0.089, ppto: 119379371 },
  { mes: 9, nombre: 'Septiembre', pct: 0.093, ppto: 124744736 },
  { mes: 10, nombre: 'Octubre', pct: 0.095, ppto: 127427418 },
  { mes: 11, nombre: 'Noviembre', pct: 0.09, ppto: 120720712 },
  { mes: 12, nombre: 'Diciembre', pct: 0.08, ppto: 107307300 },
];

// % por DÍA DE LA SEMANA
const PCT_DIA_SEMANA: Record<number, number> = {
  0: 0.0190, 1: 0.0333, 2: 0.0381, 3: 0.0381, 4: 0.0476, 5: 0.0381, 6: 0.0286,
};

// Semanas del año
const SEMANAS_2026 = [
  { semana: 1, inicio: new Date(2026, 0, 1), fin: new Date(2026, 0, 9), meta: 33074168 },
  { semana: 2, inicio: new Date(2026, 0, 10), fin: new Date(2026, 0, 16), meta: 25724353 },
  { semana: 3, inicio: new Date(2026, 0, 17), fin: new Date(2026, 0, 23), meta: 25724353 },
  { semana: 4, inicio: new Date(2026, 0, 24), fin: new Date(2026, 0, 31), meta: 30000000 },
];

// ===== SUPABASE FETCH HELPER =====
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const fetchSupabase = async (table: string, query: string = '') => {
  if (!supabaseUrl || !supabaseKey) return null;
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/${table}?${query}`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
};

// Fetch tractores por segmento con columnas correctas de gps_tracking
const fetchTractoresPorSegmento = async (segmentoId: string) => {
  if (!supabaseUrl || !supabaseKey) return [];
  
  // Mapeo UI → patrón BD (basado en query real de gps_tracking)
  const patronBusqueda: Record<string, string> = {
    'BAFAR': 'BAFAR',
    'CARROLL': 'CARROL',           // BD: CARROL (31)
    'BARCEL': 'BARCEL',
    'NATURE_SWEET': 'DEDICADO NS', // BD: DEDICADO NS (12) + DEDICADO NS/MULA (1)
    'ALPURA': 'ALPURA',
    'IMPEX': 'IMPEX',              // BD: IMPEX/NEXTEER/CLARIOS (101) + IMPEX/MTTO (8)
    'PILGRIMS': 'DEDICADO PILGRIMS',
  };
  
  const patron = patronBusqueda[segmentoId] || segmentoId;
  const likePattern = encodeURIComponent(`*${patron}*`);
  // Columnas REALES: economico, empresa, segmento, latitud, longitud, velocidad, ubicacion, estatus, ultima_actualizacion
  const query = `segmento=ilike.${likePattern}&select=economico,latitud,longitud,velocidad,ubicacion,estatus,ultima_actualizacion&order=economico`;
  
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/gps_tracking?${query}`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      }
    });
    if (!res.ok) return [];
    const data = await res.json();
    // Mapear a lo que espera el UI
    return (data || []).map((t: any) => ({
      economico: t.economico,
      tracto: t.economico,
      velocidad: t.velocidad || 0,
      estado: t.estatus || '',
      municipio: t.ubicacion || '',
      latitud: t.latitud,
      longitud: t.longitud,
      ultima_actualizacion: t.ultima_actualizacion,
    }));
  } catch {
    return [];
  }
};

// Fetch tractores por empresa con columnas correctas de gps_tracking
const fetchTractoresPorEmpresa = async (empresaId: string) => {
  if (!supabaseUrl || !supabaseKey) return [];
  
  // Mapeo UI → BD
  const empresaEnBD: Record<string, string> = {
    'SPEEDYHAUL': 'SHI',
    'TROB': 'TROB',
    'WEXPRESS': 'WE',
  };
  
  const empresa = empresaEnBD[empresaId] || empresaId;
  // Columnas REALES de gps_tracking
  const query = `empresa=eq.${encodeURIComponent(empresa)}&select=economico,latitud,longitud,velocidad,ubicacion,estatus,ultima_actualizacion&order=economico`;
  
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/gps_tracking?${query}`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      }
    });
    if (!res.ok) return [];
    const data = await res.json();
    // Mapear a lo que espera el UI
    return (data || []).map((t: any) => ({
      economico: t.economico,
      tracto: t.economico,
      velocidad: t.velocidad || 0,
      estado: t.estatus || '',
      municipio: t.ubicacion || '',
      latitud: t.latitud,
      longitud: t.longitud,
      ultima_actualizacion: t.ultima_actualizacion,
    }));
  } catch {
    return [];
  }
};

// ===== HELPERS =====
const fmt = (v: number, c = false): string => {
  if (c) {
    if (v >= 1e9) return `$${Math.round(v / 1e9)}B`;
    if (v >= 1e6) return `$${Math.round(v / 1e6)}M`;
    if (v >= 1e3) return `$${Math.round(v / 1e3)}K`;
  }
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(v);
};

const fmtDec = (v: number): string => {
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
};

const getPctDiaHoy = (): number => {
  const diaSemana = new Date().getDay();
  return PCT_DIA_SEMANA[diaSemana] || 0.0333;
};

const getSemanaActual = () => {
  const hoy = new Date();
  for (const s of SEMANAS_2026) {
    if (hoy >= s.inicio && hoy <= s.fin) return s;
  }
  return SEMANAS_2026[0];
};

const getDiasSemanaActual = () => {
  const semana = getSemanaActual();
  const diffTime = semana.fin.getTime() - semana.inicio.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

// ===== FUNCIÓN EXPORTAR EXCEL =====
const exportarExcel = () => {
  const wb = XLSX.utils.book_new();
  const hoy = new Date();
  const mesActual = hoy.getMonth() + 1;
  const diaActual = hoy.getDate();
  const datosMes = MESES[mesActual - 1];
  const pctDia = getPctDiaHoy();
  const metaDiaTotal = datosMes.ppto * pctDia;
  const semana = getSemanaActual();
  
  const resumenData = [
    ['SALES HORIZON 2026'],
    [''],
    ['RESUMEN GENERAL'],
    ['Meta Anual', GLOBAL.meta_anual],
    ['Meta Mes (' + datosMes.nombre + ')', datosMes.ppto],
    ['Meta Semana ' + semana.semana, semana.meta],
    ['Meta Hoy (Día ' + diaActual + ')', Math.round(metaDiaTotal)],
    ['Operatividad', GLOBAL.operatividad],
    ['Tractores Facturan', GLOBAL.tractores_facturan],
    ['Tractores Totales', GLOBAL.tractores_totales],
    [''],
    ['PRESUPUESTO MENSUAL'],
    ['Mes', '% del Año', 'Presupuesto'],
    ...MESES.map(m => [m.nombre, m.pct, m.ppto])
  ];
  const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
  wsResumen['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

  const segHeader = ['Segmento', 'Tractores', '% Ppto', 'Meta Anual', 'Meta Mes'];
  const segData = SEGMENTOS.map(s => [s.nombre, s.tractores, s.pct, s.ppto, Math.round(datosMes.ppto * s.pct)]);
  const segSheet = [['SEGMENTOS'], [''], segHeader, ...segData];
  const wsSegmentos = XLSX.utils.aoa_to_sheet(segSheet);
  XLSX.utils.book_append_sheet(wb, wsSegmentos, 'Segmentos');

  const empHeader = ['Empresa', 'Unidades', '% Ppto', 'Meta Anual', 'Meta Mes'];
  const empData = EMPRESAS.map(e => [e.nombre, e.unidades, e.pct, e.ppto, Math.round(datosMes.ppto * e.pct)]);
  const empSheet = [['EMPRESAS'], [''], empHeader, ...empData];
  const wsEmpresas = XLSX.utils.aoa_to_sheet(empSheet);
  XLSX.utils.book_append_sheet(wb, wsEmpresas, 'Empresas');

  const fecha = hoy.toISOString().split('T')[0];
  XLSX.writeFile(wb, `Sales_Horizon_2026_${fecha}.xlsx`);
};

interface Props { onBack: () => void; }

export default function SalesHorizonModule({ onBack }: Props) {
  const mesActual = new Date().getMonth() + 1;
  const diaActual = new Date().getDate();
  const diaSemana = new Date().getDay();
  const nombreDia = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][diaSemana];
  const nombreMesCorto = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][mesActual - 1];
  const textoHoy = `Hoy ${nombreDia} ${diaActual} ${nombreMesCorto} 2026`;
  
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<string | null>(null);
  const [segmentoSeleccionado, setSegmentoSeleccionado] = useState<string | null>(null);
  const [mesSeleccionadoModal, setMesSeleccionadoModal] = useState(mesActual);
  
  // Estados para modales de unidades
  const [unidadesSegmento, setUnidadesSegmento] = useState<string | null>(null);
  const [unidadesEmpresa, setUnidadesEmpresa] = useState<string | null>(null);
  const [tractoresLista, setTractoresLista] = useState<any[]>([]);
  const [loadingTractores, setLoadingTractores] = useState(false);
  
  // Estados para modal GPS
  const [tractoSeleccionado, setTractoSeleccionado] = useState<any | null>(null);

  // Cargar tractores por segmento
  useEffect(() => {
    if (!unidadesSegmento) return;
    const cargar = async () => {
      setLoadingTractores(true);
      const data = await fetchTractoresPorSegmento(unidadesSegmento);
      setTractoresLista(data || []);
      setLoadingTractores(false);
    };
    cargar();
  }, [unidadesSegmento]);

  // Cargar tractores por empresa
  useEffect(() => {
    if (!unidadesEmpresa) return;
    const cargar = async () => {
      setLoadingTractores(true);
      const data = await fetchTractoresPorEmpresa(unidadesEmpresa);
      setTractoresLista(data || []);
      setLoadingTractores(false);
    };
    cargar();
  }, [unidadesEmpresa]);

  const datosMesActual = MESES[mesActual - 1];
  const acumuladoYTD = MESES.slice(0, mesActual).reduce((a, m) => a + m.ppto, 0);
  
  const pctDiaHoy = getPctDiaHoy();
  const metaDiaHoyTotal = datosMesActual.ppto * pctDiaHoy;
  const semanaActual = getSemanaActual();
  const diasSemana = getDiasSemanaActual();
  const metaSemanaTotal = semanaActual.meta;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-900 border-b-2 border-orange-500/50 px-4 py-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 hover:bg-slate-700 rounded-md">
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </button>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-orange-400" />
              <span className="text-lg font-bold text-white tracking-wide">SALES HORIZON 2026</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1.5 bg-gradient-to-b from-blue-800 to-blue-950 rounded-md text-blue-100 border border-blue-600/30 font-light tracking-wide">{GLOBAL.tractores_facturan} tractores</span>
            <button 
              onClick={exportarExcel}
              className="text-xs px-3 py-1.5 bg-gradient-to-b from-blue-800 to-blue-950 hover:from-blue-700 hover:to-blue-900 rounded-md text-blue-100 font-light tracking-wide border border-blue-600/30 shadow-lg flex items-center gap-1"
            >
              <Download className="w-3 h-3" /> Excel
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-5 gap-3">
          <div className="bg-gradient-to-b from-blue-800 to-blue-950 rounded-md p-4 shadow-[0_8px_30px_rgba(0,0,0,0.4)] border border-blue-600/30 text-center">
            <div className="text-blue-200 text-lg font-bold tracking-wide uppercase mb-1">Anual</div>
            <div className="text-white text-2xl font-semibold">{fmt(GLOBAL.meta_anual)}</div>
          </div>
          <div className="bg-gradient-to-b from-blue-800 to-blue-950 rounded-md p-4 shadow-[0_8px_30px_rgba(0,0,0,0.4)] border border-blue-600/30 text-center">
            <div className="text-blue-200 text-lg font-bold tracking-wide uppercase mb-1">{datosMesActual.nombre}</div>
            <div className="text-white text-2xl font-semibold">{fmt(datosMesActual.ppto)}</div>
          </div>
          <div className="bg-gradient-to-b from-blue-800 to-blue-950 rounded-md p-4 shadow-[0_8px_30px_rgba(0,0,0,0.4)] border border-blue-600/30 text-center">
            <div className="text-blue-200 text-lg font-bold tracking-wide uppercase mb-1">Acumulado YTD</div>
            <div className="text-white text-2xl font-semibold">{fmt(acumuladoYTD)}</div>
          </div>
          <div className="bg-gradient-to-b from-blue-800 to-blue-950 rounded-md p-4 shadow-[0_8px_30px_rgba(0,0,0,0.4)] border border-blue-600/30 text-center">
            <div className="text-blue-200 text-lg font-bold tracking-wide uppercase mb-1">Operatividad</div>
            <div className="text-white text-2xl font-semibold">{Math.round(GLOBAL.operatividad * 100)}%</div>
          </div>
          <div className="bg-gradient-to-b from-blue-800 to-blue-950 rounded-md p-4 shadow-[0_8px_30px_rgba(0,0,0,0.4)] border border-blue-600/30 text-center">
            <div className="text-blue-200 text-lg font-bold tracking-wide uppercase mb-1">Tractores</div>
            <div className="text-white text-2xl font-semibold">{GLOBAL.tractores_facturan}/{GLOBAL.tractores_totales}</div>
          </div>
        </div>

        {/* Presupuesto Mensual */}
        <div className="bg-slate-800/50 rounded-md p-3 border border-slate-700/50">
          <span className="text-sm text-slate-400">Presupuesto Mensual</span>
          <div className="flex gap-1 mt-2">
            {MESES.map(m => (
              <div 
                key={m.mes} 
                className={`flex-1 rounded text-center py-2 ${
                  m.mes === mesActual 
                    ? 'bg-gradient-to-br from-orange-400 to-orange-500 text-white' 
                    : 'bg-slate-700/50 text-slate-300'
                }`}
              >
                <div className="text-xs font-medium">{m.nombre}</div>
                <div className="text-xs font-bold">{fmt(m.ppto, true)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Segmentos */}
        <div className="bg-slate-800/50 rounded-md p-3 border border-slate-700/50">
          <span className="text-sm text-slate-400">Segmentos - {datosMesActual.nombre}</span>
          <div className="grid grid-cols-7 gap-2 mt-2">
            {SEGMENTOS.map(s => (
              <div 
                key={s.id} 
                onClick={() => setSegmentoSeleccionado(segmentoSeleccionado === s.id ? null : s.id)}
                className={`rounded-md p-2 text-center cursor-pointer transition-all border ${
                  segmentoSeleccionado === s.id 
                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 border-blue-400' 
                    : 'bg-gradient-to-br from-slate-700 to-slate-800 border-slate-600 hover:border-blue-500'
                }`}
              >
                <div className="text-white text-xs font-medium uppercase">{s.nombre}</div>
                <div className="text-blue-300 font-bold text-xs mt-1">{fmt(Math.round(datosMesActual.ppto * s.pct))}</div>
                <div 
                  onClick={(e) => { e.stopPropagation(); setUnidadesSegmento(s.id); }}
                  className="text-amber-400 text-xs mt-1 hover:text-amber-300 hover:underline cursor-pointer font-medium"
                >
                  {s.tractores} Unidades ›
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Empresas */}
        <div className="bg-slate-800/50 rounded-md p-3 border border-slate-700/50">
          <span className="text-sm text-slate-400">Empresas - {datosMesActual.nombre}</span>
          <div className="grid grid-cols-3 gap-3 mt-2">
            {EMPRESAS.map(e => (
              <div 
                key={e.id} 
                onClick={() => setEmpresaSeleccionada(empresaSeleccionada === e.id ? null : e.id)}
                className={`rounded-md p-3 cursor-pointer transition-all border ${
                  empresaSeleccionada === e.id 
                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 border-blue-400' 
                    : 'bg-gradient-to-br from-slate-700 to-slate-800 border-slate-600 hover:border-blue-500'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="text-white text-sm font-bold">{e.nombre}</div>
                  <div className="text-right">
                    <div className="text-blue-100 text-xs">Meta Mes</div>
                    <div className="text-blue-200 font-bold text-sm">{fmt(Math.round(datosMesActual.ppto * e.pct))}</div>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs mt-2">
                  <div>
                    <div className="text-slate-500">% Ppto</div>
                    <div className="text-slate-300">{Math.round(e.pct * 100)}%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-slate-500">Meta Anual</div>
                    <div className="text-blue-300">{fmt(e.ppto)}</div>
                  </div>
                  <div 
                    onClick={(ev) => { ev.stopPropagation(); setUnidadesEmpresa(e.id); }}
                    className="text-right cursor-pointer"
                  >
                    <div className="text-slate-500">Unidades</div>
                    <div className="text-amber-400 hover:text-amber-300 hover:underline font-medium">{e.unidades} ›</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL Segmento */}
      {segmentoSeleccionado && (() => {
        const seg = SEGMENTOS.find(s => s.id === segmentoSeleccionado);
        if (!seg) return null;
        const datosMesModal = MESES[mesSeleccionadoModal - 1];
        const metaMesSeg = datosMesModal.ppto * seg.pct;
        const metaSemanaSeg = metaSemanaTotal * seg.pct;
        const metaDiaSeg = metaDiaHoyTotal * seg.pct;
        
        return (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => { setSegmentoSeleccionado(null); setMesSeleccionadoModal(mesActual); }}>
            <div className="bg-slate-800 rounded-xl p-8 border border-slate-600 shadow-2xl max-w-4xl w-full mx-4" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <div className="text-white text-2xl font-bold uppercase">{seg.nombre}</div>
                <button onClick={() => { setSegmentoSeleccionado(null); setMesSeleccionadoModal(mesActual); }} className="text-slate-400 hover:text-white text-2xl">&times;</button>
              </div>
              
              <div className="text-xs text-slate-400 uppercase mb-3">Metas del Segmento - {datosMesModal.nombre}</div>
              <div className="grid grid-cols-4 gap-3 mb-6">
                <div className="bg-slate-700 rounded-lg p-4 text-center border border-slate-600">
                  <div className="text-slate-400 text-xs uppercase mb-2">Anual</div>
                  <div className="text-white font-semibold text-lg">{fmt(seg.ppto)}</div>
                </div>
                <div className="bg-slate-700 rounded-lg p-4 text-center border border-slate-600">
                  <div className="text-slate-400 text-xs uppercase mb-2">Mes</div>
                  <div className="text-white font-semibold text-lg">{fmt(Math.round(metaMesSeg))}</div>
                </div>
                <div className="bg-slate-700 rounded-lg p-4 text-center border border-slate-600">
                  <div className="text-slate-400 text-xs uppercase mb-2">Semana {semanaActual.semana}</div>
                  <div className="text-white font-semibold text-lg">{fmt(Math.round(metaSemanaSeg))}</div>
                </div>
                <div className="bg-amber-700 rounded-lg p-4 text-center border border-amber-600">
                  <div className="text-amber-100 text-xs uppercase mb-2">{textoHoy}</div>
                  <div className="text-white font-semibold text-lg">{fmt(Math.round(metaDiaSeg))}</div>
                </div>
              </div>
              
              <div className="text-xs text-slate-400 uppercase mb-3">Promedio por Unidad ({seg.tractores} tractores)</div>
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-slate-700/70 rounded-lg p-4 text-center border border-slate-600">
                  <div className="text-slate-400 text-xs uppercase mb-2">$/Tracto Mes</div>
                  <div className="text-white font-semibold text-lg">{fmt(Math.round(metaMesSeg / seg.tractores))}</div>
                </div>
                <div className="bg-slate-700/70 rounded-lg p-4 text-center border border-slate-600">
                  <div className="text-slate-400 text-xs uppercase mb-2">$/Tracto Semana</div>
                  <div className="text-white font-semibold text-lg">{fmt(Math.round(metaSemanaSeg / seg.tractores))}</div>
                </div>
                <div className="bg-slate-700/70 rounded-lg p-4 text-center border border-slate-600">
                  <div className="text-slate-400 text-xs uppercase mb-2">$/Tracto Hoy</div>
                  <div className="text-white font-semibold text-lg">{fmt(Math.round(metaDiaSeg / seg.tractores))}</div>
                </div>
              </div>
              
              <div className="text-xs text-slate-400 uppercase mb-3">Selecciona un Mes</div>
              <div className="grid grid-cols-6 gap-2">
                {MESES.map(m => (
                  <div 
                    key={m.mes} 
                    onClick={() => setMesSeleccionadoModal(m.mes)}
                    className={`text-center p-3 rounded-lg cursor-pointer ${
                      m.mes === mesSeleccionadoModal 
                        ? 'bg-amber-700 text-white border border-amber-500' 
                        : 'bg-slate-700 text-slate-300 border border-slate-600 hover:bg-slate-600'
                    }`}
                  >
                    <div className="text-xs">{m.nombre.slice(0,3)}</div>
                    <div className="font-semibold">{fmtDec(Math.round(m.ppto * seg.pct))}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL Empresa */}
      {empresaSeleccionada && (() => {
        const emp = EMPRESAS.find(e => e.id === empresaSeleccionada);
        if (!emp) return null;
        const datosMesModal = MESES[mesSeleccionadoModal - 1];
        const metaMesEmp = datosMesModal.ppto * emp.pct;
        const metaSemanaEmp = metaSemanaTotal * emp.pct;
        const metaDiaEmp = metaDiaHoyTotal * emp.pct;
        
        return (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => { setEmpresaSeleccionada(null); setMesSeleccionadoModal(mesActual); }}>
            <div className="bg-slate-800 rounded-xl p-8 border border-slate-600 shadow-2xl max-w-3xl w-full mx-4" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <div className="text-white text-2xl font-bold">{emp.nombre}</div>
                <button onClick={() => { setEmpresaSeleccionada(null); setMesSeleccionadoModal(mesActual); }} className="text-slate-400 hover:text-white text-2xl">&times;</button>
              </div>
              
              <div className="text-xs text-slate-400 uppercase mb-3">Metas de la Empresa - {datosMesModal.nombre}</div>
              <div className="grid grid-cols-4 gap-3 mb-6">
                <div className="bg-slate-700 rounded-lg p-4 text-center border border-slate-600">
                  <div className="text-slate-400 text-xs uppercase mb-2">Anual</div>
                  <div className="text-white font-semibold text-lg">{fmt(emp.ppto)}</div>
                </div>
                <div className="bg-slate-700 rounded-lg p-4 text-center border border-slate-600">
                  <div className="text-slate-400 text-xs uppercase mb-2">Mes</div>
                  <div className="text-white font-semibold text-lg">{fmt(Math.round(metaMesEmp))}</div>
                </div>
                <div className="bg-slate-700 rounded-lg p-4 text-center border border-slate-600">
                  <div className="text-slate-400 text-xs uppercase mb-2">Semana {semanaActual.semana}</div>
                  <div className="text-white font-semibold text-lg">{fmt(Math.round(metaSemanaEmp))}</div>
                </div>
                <div className="bg-amber-700 rounded-lg p-4 text-center border border-amber-600">
                  <div className="text-amber-100 text-xs uppercase mb-2">{textoHoy}</div>
                  <div className="text-white font-semibold text-lg">{fmt(Math.round(metaDiaEmp))}</div>
                </div>
              </div>
              
              <div className="text-xs text-slate-400 uppercase mb-3">Selecciona un Mes</div>
              <div className="grid grid-cols-6 gap-2">
                {MESES.map(m => (
                  <div 
                    key={m.mes} 
                    onClick={() => setMesSeleccionadoModal(m.mes)}
                    className={`text-center p-3 rounded-lg cursor-pointer ${
                      m.mes === mesSeleccionadoModal 
                        ? 'bg-amber-700 text-white border border-amber-500' 
                        : 'bg-slate-700 text-slate-300 border border-slate-600 hover:bg-slate-600'
                    }`}
                  >
                    <div className="text-xs">{m.nombre.slice(0,3)}</div>
                    <div className="font-semibold">{fmt(Math.round(m.ppto * emp.pct), true)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL - Unidades por Segmento */}
      {unidadesSegmento && (() => {
        const seg = SEGMENTOS.find(s => s.id === unidadesSegmento);
        if (!seg) return null;
        
        return (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]" onClick={() => { setUnidadesSegmento(null); setTractoresLista([]); }}>
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-xl p-6 border-2 border-amber-500/50 shadow-2xl shadow-amber-500/20 max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-500 text-slate-900 px-3 py-1 rounded-md font-bold text-sm">{tractoresLista.length || seg.tractores}</div>
                  <div className="text-white text-xl font-bold uppercase tracking-wide">Unidades {seg.nombre}</div>
                </div>
                <button onClick={() => { setUnidadesSegmento(null); setTractoresLista([]); }} className="text-slate-400 hover:text-white text-2xl font-light">&times;</button>
              </div>
              
              {loadingTractores ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                  <span className="ml-3 text-slate-400">Cargando unidades...</span>
                </div>
              ) : (
                <div className="overflow-y-auto max-h-[60vh] pr-2">
                  <div className="grid grid-cols-6 gap-2">
                    {tractoresLista.map((t, i) => {
                      const vel = parseFloat(t.velocidad) || 0;
                      const enMovimiento = vel > 0;
                      return (
                        <div 
                          key={i} 
                          onClick={() => setTractoSeleccionado(t)}
                          className={`text-white text-center py-2 px-1 rounded-lg text-xs font-semibold border shadow-md transition-all cursor-pointer ${
                            enMovimiento 
                              ? 'bg-gradient-to-br from-green-600 to-green-700 border-green-500 hover:from-green-500 hover:to-green-600' 
                              : 'bg-gradient-to-br from-amber-600 to-amber-700 border-amber-500 hover:from-amber-500 hover:to-amber-600'
                          }`}
                          title={enMovimiento ? `${vel} km/h - ${t.municipio || ''}` : `Detenido - ${t.municipio || ''}`}
                        >
                          {t.economico || t.tracto}
                        </div>
                      );
                    })}
                  </div>
                  {tractoresLista.length === 0 && !loadingTractores && (
                    <div className="text-center py-8 text-slate-400">No se encontraron unidades</div>
                  )}
                </div>
              )}
              
              <div className="mt-4 flex gap-4 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-green-600"></span> En movimiento
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-amber-600"></span> Detenido
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL - Unidades por Empresa */}
      {unidadesEmpresa && (() => {
        const emp = EMPRESAS.find(e => e.id === unidadesEmpresa);
        if (!emp) return null;
        
        return (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]" onClick={() => { setUnidadesEmpresa(null); setTractoresLista([]); }}>
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-xl p-6 border-2 border-amber-500/50 shadow-2xl shadow-amber-500/20 max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-500 text-slate-900 px-3 py-1 rounded-md font-bold text-sm">{tractoresLista.length || emp.unidades}</div>
                  <div className="text-white text-xl font-bold tracking-wide">Unidades {emp.nombre}</div>
                </div>
                <button onClick={() => { setUnidadesEmpresa(null); setTractoresLista([]); }} className="text-slate-400 hover:text-white text-2xl font-light">&times;</button>
              </div>
              
              {loadingTractores ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                  <span className="ml-3 text-slate-400">Cargando unidades...</span>
                </div>
              ) : (
                <div className="overflow-y-auto max-h-[60vh] pr-2">
                  <div className="grid grid-cols-6 gap-2">
                    {tractoresLista.map((t, i) => {
                      const vel = parseFloat(t.velocidad) || 0;
                      const enMovimiento = vel > 0;
                      return (
                        <div 
                          key={i} 
                          onClick={() => setTractoSeleccionado(t)}
                          className={`text-white text-center py-2 px-1 rounded-lg text-xs font-semibold border shadow-md transition-all cursor-pointer ${
                            enMovimiento 
                              ? 'bg-gradient-to-br from-green-600 to-green-700 border-green-500 hover:from-green-500 hover:to-green-600' 
                              : 'bg-gradient-to-br from-amber-600 to-amber-700 border-amber-500 hover:from-amber-500 hover:to-amber-600'
                          }`}
                          title={enMovimiento ? `${vel} km/h - ${t.municipio || ''}` : `Detenido - ${t.municipio || ''}`}
                        >
                          {t.economico || t.tracto}
                        </div>
                      );
                    })}
                  </div>
                  {tractoresLista.length === 0 && !loadingTractores && (
                    <div className="text-center py-8 text-slate-400">No se encontraron unidades</div>
                  )}
                </div>
              )}
              
              <div className="mt-4 flex gap-4 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-green-600"></span> En movimiento
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-amber-600"></span> Detenido
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL - Detalles GPS del Tracto */}
      {tractoSeleccionado && (() => {
        const t = tractoSeleccionado;
        const vel = parseFloat(t.velocidad) || 0;
        const enMovimiento = vel > 0;
        
        // Calcular tiempo parado
        let tiempoParado = '';
        if (!enMovimiento && t.ultima_actualizacion) {
          const ahora = new Date();
          const ultima = new Date(t.ultima_actualizacion);
          const diffMins = (ahora.getTime() - ultima.getTime()) / (1000 * 60);
          tiempoParado = diffMins >= 60 ? `${(diffMins / 60).toFixed(1)} hrs` : `${diffMins.toFixed(1)} min`;
        }
        
        // GPS desactualizado (más de 2 horas)
        const horasDesde = t.ultima_actualizacion ? (new Date().getTime() - new Date(t.ultima_actualizacion).getTime()) / (1000 * 60 * 60) : 0;
        const gpsDesactualizado = horasDesde > 2;
        
        return (
          <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-[70]" onClick={() => setTractoSeleccionado(null)}>
            <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-xl p-6 border-2 border-blue-500/50 shadow-2xl shadow-blue-500/20 max-w-3xl w-full mx-4" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <MapPin className="w-6 h-6 text-blue-400" />
                  <div className="text-white text-xl font-bold tracking-wide">Ubicación {t.economico || t.tracto}</div>
                </div>
                <button onClick={() => setTractoSeleccionado(null)} className="text-slate-400 hover:text-white text-2xl font-light">&times;</button>
              </div>

              {/* Mapa */}
              <div className="rounded-lg overflow-hidden border border-slate-600 h-64 mb-4">
                {t.latitud && t.longitud ? (
                  <iframe
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${t.longitud - 0.02},${t.latitud - 0.015},${t.longitud + 0.02},${t.latitud + 0.015}&layer=mapnik&marker=${t.latitud},${t.longitud}`}
                    style={{ border: 0 }}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center bg-slate-700">
                    <span className="text-slate-400">Sin coordenadas disponibles</span>
                  </div>
                )}
              </div>

              {/* Datos */}
              <div className="grid grid-cols-2 gap-3">
                {/* Ubicación */}
                <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-blue-400" />
                    <span className="text-slate-400 text-xs uppercase tracking-wide">Ubicación</span>
                  </div>
                  <div className="text-white font-semibold">{t.estado || 'N/A'}</div>
                  <div className="text-slate-300 text-sm">{t.municipio || 'N/A'}</div>
                </div>

                {/* Estado de movimiento */}
                <div className={`rounded-lg p-4 border ${enMovimiento ? 'bg-green-900/30 border-green-600' : 'bg-amber-900/30 border-amber-600'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Gauge className="w-4 h-4 text-blue-400" />
                    <span className="text-slate-400 text-xs uppercase tracking-wide">Estado</span>
                  </div>
                  {enMovimiento ? (
                    <>
                      <div className="text-green-400 font-semibold flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                        En Movimiento
                      </div>
                      <div className="text-white text-lg font-bold">{vel} km/h</div>
                    </>
                  ) : (
                    <>
                      <div className="text-amber-400 font-semibold flex items-center gap-2">
                        <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
                        Detenido
                      </div>
                      {tiempoParado && <div className="text-white text-lg font-bold">{tiempoParado}</div>}
                    </>
                  )}
                </div>

                {/* Velocidad promedio placeholder */}
                <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                  <div className="flex items-center gap-2 mb-2">
                    <Gauge className="w-4 h-4 text-blue-400" />
                    <span className="text-slate-400 text-xs uppercase tracking-wide">Vel. Actual</span>
                  </div>
                  <div className="text-white font-semibold text-lg">{vel} km/h</div>
                </div>

                {/* Última actualización */}
                <div className={`rounded-lg p-4 border ${gpsDesactualizado ? 'bg-red-900/30 border-red-600' : 'bg-slate-700/50 border-slate-600'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span className="text-slate-400 text-xs uppercase tracking-wide">Última Actualización</span>
                  </div>
                  {gpsDesactualizado ? (
                    <>
                      <div className="text-red-400 font-semibold flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        GPS Desactualizado
                      </div>
                      <div className="text-slate-300 text-sm">
                        {t.ultima_actualizacion ? new Date(t.ultima_actualizacion).toLocaleString('es-MX') : 'N/A'}
                      </div>
                      <div className="text-red-300 text-xs">Hace {horasDesde.toFixed(1)} hrs</div>
                    </>
                  ) : (
                    <>
                      <div className="text-green-400 font-semibold text-sm">GPS Activo</div>
                      <div className="text-slate-300 text-sm">
                        {t.ultima_actualizacion ? new Date(t.ultima_actualizacion).toLocaleString('es-MX') : 'N/A'}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Coordenadas */}
              <div className="bg-slate-800 rounded-lg p-3 border border-slate-700 flex items-center justify-between mt-3">
                <div className="text-slate-400 text-xs">
                  <span className="text-slate-500">LAT:</span> {t.latitud?.toFixed(6) || 'N/A'} | 
                  <span className="text-slate-500 ml-2">LON:</span> {t.longitud?.toFixed(6) || 'N/A'}
                </div>
                {t.latitud && t.longitud && (
                  <a 
                    href={`https://www.google.com/maps?q=${t.latitud},${t.longitud}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 text-xs hover:text-blue-300 hover:underline"
                  >
                    Abrir en Google Maps →
                  </a>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
