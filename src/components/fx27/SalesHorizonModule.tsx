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
// Credenciales directas (igual que DedicadosModuleWideTech que SÍ funciona)
const SUPABASE_URL = 'https://fbxbsslhewchyibdoyzk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieGJzc2xoZXdjaHlpYmRveXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzczODEsImV4cCI6MjA3ODExMzM4MX0.Z8JPlg7hhKbA624QGHp2bKKTNtCD3WInQMO5twjl6a0';

const fetchSupabase = async (table: string, query: string = '') => {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
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
  const query = `segmento=ilike.${likePattern}&select=economico,latitud,longitud,velocidad,ubicacion,estatus,ultima_actualizacion,estado_geo,municipio_geo&order=economico`;
  
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/gps_tracking?${query}`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data || []).map((t: any) => ({
      economico: t.economico,
      tracto: t.economico,
      velocidad: t.velocidad || 0,
      estado: t.estatus || '',
      municipio: t.ubicacion || '',
      latitud: t.latitud,
      longitud: t.longitud,
      ultima_actualizacion: t.ultima_actualizacion,
      estado_geo: t.estado_geo || '',
      municipio_geo: t.municipio_geo || '',
    }));
  } catch {
    return [];
  }
};

// Fetch tractores por empresa con columnas correctas de gps_tracking
const fetchTractoresPorEmpresa = async (empresaId: string) => {
  const empresaEnBD: Record<string, string> = {
    'SPEEDYHAUL': 'SHI',
    'TROB': 'TROB',
    'WEXPRESS': 'WE',
  };
  
  const empresa = empresaEnBD[empresaId] || empresaId;
  const query = `empresa=eq.${encodeURIComponent(empresa)}&select=economico,latitud,longitud,velocidad,ubicacion,estatus,ultima_actualizacion,estado_geo,municipio_geo&order=economico`;
  
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/gps_tracking?${query}`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data || []).map((t: any) => ({
      economico: t.economico,
      tracto: t.economico,
      velocidad: t.velocidad || 0,
      estado: t.estatus || '',
      municipio: t.ubicacion || '',
      latitud: t.latitud,
      longitud: t.longitud,
      ultima_actualizacion: t.ultima_actualizacion,
      estado_geo: t.estado_geo || '',
      municipio_geo: t.municipio_geo || '',
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
    ['SALES HORIZON 2026 - RESUMEN EJECUTIVO', '', '', ''],
    ['', '', '', ''],
    ['META ANUAL', fmt(GLOBAL.meta_anual), '', ''],
    ['META MES (' + datosMes.nombre.toUpperCase() + ')', fmt(datosMes.ppto), '', ''],
    ['META DÍA (Día ' + diaActual + ')', fmt(metaDiaTotal), '', ''],
    ['META SEMANA ' + semana.semana, fmt(semana.meta), '', ''],
    ['', '', '', ''],
    ['TRACTORES OPERATIVOS', GLOBAL.tractores_facturan + ' / ' + GLOBAL.tractores_totales, '', ''],
    ['OPERATIVIDAD', (GLOBAL.operatividad * 100).toFixed(0) + '%', '', ''],
  ];
  
  const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');
  
  const segmentosData = [
    ['SEGMENTO', 'TRACTORES', 'PARTICIPACIÓN', 'PPTO ANUAL', 'META MES'],
    ...SEGMENTOS.map(s => [
      s.nombre,
      s.tractores,
      (s.pct * 100).toFixed(1) + '%',
      fmt(s.ppto),
      fmt(s.tmes),
    ])
  ];
  
  const wsSegmentos = XLSX.utils.aoa_to_sheet(segmentosData);
  XLSX.utils.book_append_sheet(wb, wsSegmentos, 'Segmentos');
  
  const empresasData = [
    ['EMPRESA', 'UNIDADES', 'PARTICIPACIÓN', 'PPTO ANUAL'],
    ...EMPRESAS.map(e => [
      e.nombre,
      e.unidades,
      (e.pct * 100).toFixed(1) + '%',
      fmt(e.ppto),
    ])
  ];
  
  const wsEmpresas = XLSX.utils.aoa_to_sheet(empresasData);
  XLSX.utils.book_append_sheet(wb, wsEmpresas, 'Empresas');
  
  XLSX.writeFile(wb, `SalesHorizon_${hoy.toISOString().split('T')[0]}.xlsx`);
};

// ===== COMPONENTE PRINCIPAL =====
interface SalesHorizonModuleProps {
  onBack: () => void;
}

export default function SalesHorizonModule({ onBack }: SalesHorizonModuleProps) {
  const hoy = new Date();
  const mesActual = hoy.getMonth() + 1;
  const diaActual = hoy.getDate();
  
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
            <div className="text-white text-2xl font-semibold">{(GLOBAL.operatividad * 100).toFixed(0)}%</div>
          </div>
          <div className="bg-gradient-to-b from-blue-800 to-blue-950 rounded-md p-4 shadow-[0_8px_30px_rgba(0,0,0,0.4)] border border-blue-600/30 text-center">
            <div className="text-blue-200 text-lg font-bold tracking-wide uppercase mb-1">Tractores</div>
            <div className="text-white text-2xl font-semibold">{GLOBAL.tractores_facturan}/{GLOBAL.tractores_totales}</div>
          </div>
        </div>

        {/* Presupuesto Mensual */}
        <div>
          <h2 className="text-slate-400 text-sm font-medium tracking-wide mb-3">Presupuesto Mensual</h2>
          <div className="grid grid-cols-12 gap-2">
            {MESES.map((m) => (
              <div
                key={m.mes}
                className={`rounded-md p-2 text-center transition-all ${
                  m.mes === mesActual
                    ? 'bg-gradient-to-b from-orange-700 to-orange-900 ring-2 ring-orange-400 shadow-lg shadow-orange-500/30'
                    : 'bg-slate-800/60 hover:bg-slate-700/60'
                }`}
              >
                <div className={`text-xs font-medium ${m.mes === mesActual ? 'text-orange-100' : 'text-slate-400'}`}>
                  {m.nombre.substring(0, 3)}
                </div>
                <div className={`text-sm font-bold ${m.mes === mesActual ? 'text-white' : 'text-slate-300'}`}>
                  {fmtDec(m.ppto)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Segmentos - Enero */}
        <div>
          <h2 className="text-slate-400 text-sm font-medium tracking-wide mb-3">Segmentos - {datosMesActual.nombre}</h2>
          <div className="grid grid-cols-7 gap-3">
            {SEGMENTOS.map((seg) => {
              const metaMes = seg.tmes;
              return (
                <div
                  key={seg.id}
                  className="bg-slate-800/60 rounded-md p-4 hover:bg-slate-700/60 transition-all border border-slate-700/50"
                >
                  <div className="text-slate-300 text-sm font-medium mb-1">{seg.nombre.toUpperCase()}</div>
                  <div className="text-orange-400 text-lg font-bold">{fmt(metaMes)}</div>
                  <button
                    onClick={() => setUnidadesSegmento(seg.id)}
                    className="text-xs text-blue-400 hover:text-blue-300 mt-2 hover:underline"
                  >
                    {seg.tractores} Unidades ›
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Empresas */}
        <div>
          <h2 className="text-slate-400 text-sm font-medium tracking-wide mb-3">Empresas - {datosMesActual.nombre}</h2>
          <div className="grid grid-cols-3 gap-4">
            {EMPRESAS.map((emp) => {
              const metaMes = emp.ppto / 12;
              return (
                <div
                  key={emp.id}
                  className="bg-slate-800/60 rounded-md p-4 hover:bg-slate-700/60 transition-all border border-slate-700/50"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-white font-bold">{emp.nombre}</div>
                    <div className="text-slate-400 text-xs">{emp.unidades} u</div>
                  </div>
                  <div className="text-slate-400 text-xs mb-1">Meta Anual</div>
                  <div className="text-blue-400 font-bold">{fmt(emp.ppto)}</div>
                  <div className="flex justify-between items-center mt-2">
                    <div className="text-slate-400 text-xs">{(emp.pct * 100).toFixed(0)}%</div>
                    <div className="text-slate-300 text-sm">Meta Mes <span className="text-white font-semibold">{fmtDec(metaMes)}</span></div>
                  </div>
                  <button
                    onClick={() => setUnidadesEmpresa(emp.id)}
                    className="text-xs text-blue-400 hover:text-blue-300 mt-2 hover:underline"
                  >
                    {emp.unidades} ›
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal Unidades Segmento */}
      {unidadesSegmento && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setUnidadesSegmento(null)}>
          <div className="bg-slate-800 rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  {SEGMENTOS.find(s => s.id === unidadesSegmento)?.tractores}
                </span>
                <h3 className="text-white text-xl font-bold">UNIDADES {SEGMENTOS.find(s => s.id === unidadesSegmento)?.nombre.toUpperCase()}</h3>
              </div>
              <button onClick={() => setUnidadesSegmento(null)} className="text-slate-400 hover:text-white text-2xl">&times;</button>
            </div>
            
            <div className="flex gap-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                <span className="text-slate-300 text-sm">En movimiento</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-amber-500 rounded-full"></span>
                <span className="text-slate-300 text-sm">Detenido</span>
              </div>
            </div>

            {loadingTractores ? (
              <div className="text-center py-8 text-slate-400">Cargando unidades...</div>
            ) : tractoresLista.length === 0 ? (
              <div className="text-center py-8 text-slate-400">No se encontraron unidades</div>
            ) : (
              <div className="grid grid-cols-6 gap-3">
                {tractoresLista.map((t) => {
                  const vel = parseFloat(t.velocidad) || 0;
                  const enMovimiento = vel > 0;
                  return (
                    <button
                      key={t.economico}
                      onClick={() => setTractoSeleccionado(t)}
                      className={`p-3 rounded-lg text-center transition-all hover:scale-105 ${
                        enMovimiento
                          ? 'bg-green-900/40 border border-green-600/50 hover:bg-green-800/50'
                          : 'bg-amber-900/40 border border-amber-600/50 hover:bg-amber-800/50'
                      }`}
                    >
                      <div className="text-white font-bold text-lg">{t.economico}</div>
                      <div className={`text-xs ${enMovimiento ? 'text-green-400' : 'text-amber-400'}`}>
                        {enMovimiento ? `${vel} km/h` : 'Detenido'}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Unidades Empresa */}
      {unidadesEmpresa && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setUnidadesEmpresa(null)}>
          <div className="bg-slate-800 rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  {EMPRESAS.find(e => e.id === unidadesEmpresa)?.unidades}
                </span>
                <h3 className="text-white text-xl font-bold">UNIDADES {EMPRESAS.find(e => e.id === unidadesEmpresa)?.nombre}</h3>
              </div>
              <button onClick={() => setUnidadesEmpresa(null)} className="text-slate-400 hover:text-white text-2xl">&times;</button>
            </div>
            
            <div className="flex gap-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                <span className="text-slate-300 text-sm">En movimiento</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-amber-500 rounded-full"></span>
                <span className="text-slate-300 text-sm">Detenido</span>
              </div>
            </div>

            {loadingTractores ? (
              <div className="text-center py-8 text-slate-400">Cargando unidades...</div>
            ) : tractoresLista.length === 0 ? (
              <div className="text-center py-8 text-slate-400">No se encontraron unidades</div>
            ) : (
              <div className="grid grid-cols-6 gap-3">
                {tractoresLista.map((t) => {
                  const vel = parseFloat(t.velocidad) || 0;
                  const enMovimiento = vel > 0;
                  return (
                    <button
                      key={t.economico}
                      onClick={() => setTractoSeleccionado(t)}
                      className={`p-3 rounded-lg text-center transition-all hover:scale-105 ${
                        enMovimiento
                          ? 'bg-green-900/40 border border-green-600/50 hover:bg-green-800/50'
                          : 'bg-amber-900/40 border border-amber-600/50 hover:bg-amber-800/50'
                      }`}
                    >
                      <div className="text-white font-bold text-lg">{t.economico}</div>
                      <div className={`text-xs ${enMovimiento ? 'text-green-400' : 'text-amber-400'}`}>
                        {enMovimiento ? `${vel} km/h` : 'Detenido'}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal GPS Detalle */}
      {tractoSeleccionado && (() => {
        const t = tractoSeleccionado;
        const vel = parseFloat(t.velocidad) || 0;
        const enMovimiento = vel > 0;
        
        let tiempoParado = '';
        if (!enMovimiento && t.ultima_actualizacion) {
          const ahora = new Date();
          const ultima = new Date(t.ultima_actualizacion);
          const diffMins = (ahora.getTime() - ultima.getTime()) / (1000 * 60);
          tiempoParado = diffMins >= 60 ? `${(diffMins / 60).toFixed(1)} hrs` : `${diffMins.toFixed(0)} min`;
        }
        
        const horasDesde = t.ultima_actualizacion ? (new Date().getTime() - new Date(t.ultima_actualizacion).getTime()) / (1000 * 60 * 60) : 0;
        const gpsDesactualizado = horasDesde > 2;
        
        return (
          <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-[70]" onClick={() => setTractoSeleccionado(null)}>
            <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-xl p-6 border-2 border-blue-500/50 shadow-2xl shadow-blue-500/20 max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <MapPin className="w-6 h-6 text-blue-400" />
                  <div className="text-white text-xl font-bold tracking-wide">Ubicación {t.economico || t.tracto}</div>
                </div>
                <button onClick={() => setTractoSeleccionado(null)} className="text-slate-400 hover:text-white text-2xl font-light">&times;</button>
              </div>

              {/* Mapa */}
              <div className="rounded-lg overflow-hidden border border-slate-600 h-72 mb-4">
                {t.latitud && t.longitud ? (
                  <iframe
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${t.longitud - 0.03},${t.latitud - 0.02},${t.longitud + 0.03},${t.latitud + 0.02}&layer=mapnik&marker=${t.latitud},${t.longitud}`}
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
                {/* Ubicación - Estado, Municipio, Dirección */}
                <div className="col-span-2 bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-blue-400" />
                    <span className="text-slate-400 text-xs uppercase tracking-wide">Ubicación</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-slate-500">Estado:</span>
                      <span className="text-white ml-2 font-semibold">{t.estado_geo || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Municipio:</span>
                      <span className="text-white ml-2 font-semibold">{t.municipio_geo || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Descripción:</span>
                      <span className="text-slate-300 ml-2">{t.municipio || 'N/A'}</span>
                    </div>
                  </div>
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

                {/* Velocidad promedio */}
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
                  <div className={`font-semibold ${gpsDesactualizado ? 'text-red-400' : 'text-white'}`}>
                    {t.ultima_actualizacion ? new Date(t.ultima_actualizacion).toLocaleString('es-MX') : 'N/A'}
                  </div>
                  {gpsDesactualizado && (
                    <div className="flex items-center gap-1 mt-1 text-red-400 text-xs">
                      <AlertTriangle className="w-3 h-3" />
                      GPS desactualizado
                    </div>
                  )}
                </div>

                {/* Vel Promedio placeholder */}
                <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                  <div className="flex items-center gap-2 mb-2">
                    <Gauge className="w-4 h-4 text-blue-400" />
                    <span className="text-slate-400 text-xs uppercase tracking-wide">Vel. Promedio</span>
                  </div>
                  <div className="text-white font-semibold text-lg">~{Math.max(vel - 5, 0)} km/h</div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
