'use client';

import React, { useState, useEffect } from 'react';
import { Target, ArrowLeft, Download, MapPin, Gauge, Clock, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';

// Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

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

// % por DÍA DE LA SEMANA (del Excel Resumen)
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
  
  // === HOJA 1: RESUMEN ===
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

  // === HOJA 2: SEGMENTOS ===
  const segHeader = ['Segmento', 'Tractores', '% Ppto', 'Meta Anual', 'Meta Mes', 'Meta Semana', 'Meta Hoy', '$/Tracto Mes', '$/Tracto Semana', '$/Tracto Hoy'];
  const segData = SEGMENTOS.map(s => {
    const metaMes = datosMes.ppto * s.pct;
    const metaSem = semana.meta * s.pct;
    const metaDia = metaDiaTotal * s.pct;
    return [
      s.nombre,
      s.tractores,
      s.pct,
      s.ppto,
      Math.round(metaMes),
      Math.round(metaSem),
      Math.round(metaDia),
      Math.round(metaMes / s.tractores),
      Math.round(metaSem / s.tractores),
      Math.round(metaDia / s.tractores)
    ];
  });
  
  const segSheet = [
    ['SEGMENTOS - ' + datosMes.nombre],
    [''],
    segHeader,
    ...segData,
    [''],
    ['PRESUPUESTO POR MES Y SEGMENTO'],
    ['Segmento', ...MESES.map(m => m.nombre)],
    ...SEGMENTOS.map(s => [s.nombre, ...MESES.map(m => Math.round(m.ppto * s.pct))])
  ];
  const wsSegmentos = XLSX.utils.aoa_to_sheet(segSheet);
  wsSegmentos['!cols'] = [{ wch: 15 }, ...Array(12).fill({ wch: 14 })];
  XLSX.utils.book_append_sheet(wb, wsSegmentos, 'Segmentos');

  // === HOJA 3: EMPRESAS ===
  const empHeader = ['Empresa', 'Unidades', '% Ppto', 'Meta Anual', 'Meta Mes', 'Meta Semana', 'Meta Hoy'];
  const empData = EMPRESAS.map(e => {
    const metaMes = datosMes.ppto * e.pct;
    const metaSem = semana.meta * e.pct;
    const metaDia = metaDiaTotal * e.pct;
    return [
      e.nombre,
      e.unidades,
      e.pct,
      e.ppto,
      Math.round(metaMes),
      Math.round(metaSem),
      Math.round(metaDia)
    ];
  });
  
  const empSheet = [
    ['EMPRESAS - ' + datosMes.nombre],
    [''],
    empHeader,
    ...empData,
    [''],
    ['PRESUPUESTO POR MES Y EMPRESA'],
    ['Empresa', ...MESES.map(m => m.nombre)],
    ...EMPRESAS.map(e => [e.nombre, ...MESES.map(m => Math.round(m.ppto * e.pct))])
  ];
  const wsEmpresas = XLSX.utils.aoa_to_sheet(empSheet);
  wsEmpresas['!cols'] = [{ wch: 15 }, ...Array(12).fill({ wch: 14 })];
  XLSX.utils.book_append_sheet(wb, wsEmpresas, 'Empresas');

  // Descargar
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
  const [unidadesSegmento, setUnidadesSegmento] = useState<string | null>(null);
  const [unidadesEmpresa, setUnidadesEmpresa] = useState<string | null>(null);
  const [tractoSeleccionado, setTractoSeleccionado] = useState<string | null>(null);
  const [datosGPS, setDatosGPS] = useState<any>(null);
  const [loadingGPS, setLoadingGPS] = useState(false);
  
  // Estados para tractores dinámicos desde BD
  const [tractoresSegmento, setTractoresSegmento] = useState<any[]>([]);
  const [tractoresEmpresa, setTractoresEmpresa] = useState<any[]>([]);
  const [loadingTractores, setLoadingTractores] = useState(false);
  const [conteoSegmentos, setConteoSegmentos] = useState<Record<string, number>>({});
  const [conteoEmpresas, setConteoEmpresas] = useState<Record<string, number>>({});

  // Cargar conteo de tractores al iniciar
  useEffect(() => {
    const cargarConteos = async () => {
      try {
        const { data } = await supabase
          .from('gps_tracking')
          .select('economico, segmento, empresa');
        
        if (data) {
          // Conteo por segmento
          const porSegmento: Record<string, number> = {};
          const porEmpresa: Record<string, number> = {};
          
          data.forEach(t => {
            if (t.segmento) {
              const segKey = t.segmento.toUpperCase().replace(/\s+/g, '_');
              porSegmento[segKey] = (porSegmento[segKey] || 0) + 1;
            }
            if (t.empresa) {
              const empKey = t.empresa.toUpperCase().replace(/\s+/g, '');
              porEmpresa[empKey] = (porEmpresa[empKey] || 0) + 1;
            }
          });
          
          setConteoSegmentos(porSegmento);
          setConteoEmpresas(porEmpresa);
        }
      } catch (err) {
        console.error('Error cargando conteos:', err);
      }
    };
    cargarConteos();
  }, []);

  // Cargar tractores cuando se abre modal de segmento
  useEffect(() => {
    if (unidadesSegmento) {
      const cargarTractoresSegmento = async () => {
        setLoadingTractores(true);
        try {
          const segmentoNombre = SEGMENTOS.find(s => s.id === unidadesSegmento)?.nombre || unidadesSegmento;
          
          const { data } = await supabase
            .from('gps_tracking')
            .select('economico, tracto, velocidad, estado, municipio, ultima_actualizacion, latitud, longitud')
            .ilike('segmento', `%${segmentoNombre}%`)
            .order('economico');
          
          setTractoresSegmento(data || []);
        } catch (err) {
          console.error('Error cargando tractores segmento:', err);
        }
        setLoadingTractores(false);
      };
      cargarTractoresSegmento();
    }
  }, [unidadesSegmento]);

  // Cargar tractores cuando se abre modal de empresa
  useEffect(() => {
    if (unidadesEmpresa) {
      const cargarTractoresEmpresa = async () => {
        setLoadingTractores(true);
        try {
          const empresaNombre = EMPRESAS.find(e => e.id === unidadesEmpresa)?.nombre || unidadesEmpresa;
          
          const { data } = await supabase
            .from('gps_tracking')
            .select('economico, tracto, velocidad, estado, municipio, ultima_actualizacion, latitud, longitud')
            .ilike('empresa', `%${empresaNombre}%`)
            .order('economico');
          
          setTractoresEmpresa(data || []);
        } catch (err) {
          console.error('Error cargando tractores empresa:', err);
        }
        setLoadingTractores(false);
      };
      cargarTractoresEmpresa();
    }
  }, [unidadesEmpresa]);

  // Función para obtener datos GPS del tracto desde Despacho Inteligente
  const obtenerDatosGPS = async (tractoId: string) => {
    setLoadingGPS(true);
    try {
      // Buscar en gps_tracking por número económico
      const { data, error } = await supabase
        .from('gps_tracking')
        .select('*')
        .eq('economico', tractoId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        // Calcular tiempo parado
        let tiempoParado = null;
        const velocidad = parseFloat(data.velocidad) || 0;
        
        if (velocidad === 0) {
          const ahora = new Date();
          const ultimaAct = new Date(data.ultima_actualizacion || data.updated_at);
          const diffMs = ahora.getTime() - ultimaAct.getTime();
          const diffMins = diffMs / (1000 * 60);
          if (diffMins >= 60) {
            tiempoParado = `${(diffMins / 60).toFixed(1)} hrs`;
          } else {
            tiempoParado = `${diffMins.toFixed(1)} min`;
          }
        }

        // Calcular si GPS está desactualizado (más de 2 horas)
        const ahora = new Date();
        const ultimaAct = new Date(data.ultima_actualizacion || data.updated_at);
        const diffHoras = (ahora.getTime() - ultimaAct.getTime()) / (1000 * 60 * 60);
        const gpsDesactualizado = diffHoras > 2;

        setDatosGPS({
          ...data,
          velocidad: velocidad,
          tiempoParado,
          gpsDesactualizado,
          horasDesdeActualizacion: diffHoras.toFixed(1)
        });
      } else {
        setDatosGPS({ sinDatos: true });
      }
    } catch (err) {
      console.error('Error obteniendo GPS:', err);
      setDatosGPS({ error: true });
    }
    setLoadingGPS(false);
  };

  // Efecto para cargar datos cuando se selecciona un tracto
  useEffect(() => {
    if (tractoSeleccionado) {
      obtenerDatosGPS(tractoSeleccionado);
    } else {
      setDatosGPS(null);
    }
  }, [tractoSeleccionado]);

  const datosMesActual = MESES[mesActual - 1];
  const acumuladoYTD = MESES.slice(0, mesActual).reduce((a, m) => a + m.ppto, 0);
  
  // Metas dinámicas TOTALES
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
        {/* KPIs Principales */}
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
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Presupuesto Mensual</span>
          </div>
          <div className="flex gap-1">
            {MESES.map(m => (
              <div 
                key={m.mes} 
                className={`flex-1 rounded text-center py-2 cursor-pointer transition-all ${
                  m.mes === mesActual 
                    ? 'bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-lg shadow-orange-500/20' 
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600'
                }`}
              >
                <div className="text-xs font-medium">{m.nombre}</div>
                <div className="text-xs opacity-90 font-bold">{fmt(m.ppto, true)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Segmentos */}
        <div className="bg-slate-800/50 rounded-md p-3 border border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Segmentos - {datosMesActual.nombre}</span>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {SEGMENTOS.map(s => (
              <div 
                key={s.id} 
                onClick={() => setSegmentoSeleccionado(segmentoSeleccionado === s.id ? null : s.id)}
                className={`rounded-md p-2 text-center cursor-pointer transition-all border ${
                  segmentoSeleccionado === s.id 
                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 border-blue-400 shadow-lg shadow-blue-500/20' 
                    : 'bg-gradient-to-br from-slate-700 to-slate-800 border-slate-600 hover:from-blue-700 hover:to-blue-800 hover:border-blue-500'
                }`}
              >
                <div className="text-white text-xs font-medium truncate uppercase">{s.nombre}</div>
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
                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 border-blue-400 shadow-lg shadow-blue-500/20' 
                    : 'bg-gradient-to-br from-slate-700 to-slate-800 border-slate-600 hover:from-blue-600 hover:to-blue-700 hover:border-blue-500'
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
                    <div className="text-blue-300 font-medium">{fmt(e.ppto)}</div>
                  </div>
                  <div 
                    onClick={(ev) => { ev.stopPropagation(); setUnidadesEmpresa(e.id); }}
                    className="text-right cursor-pointer"
                  >
                    <div className="text-slate-500">Unidades</div>
                    <div className="text-amber-400 font-medium hover:text-amber-300 hover:underline">{e.unidades} ›</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL - Segmento */}
      {segmentoSeleccionado && (() => {
        const seg = SEGMENTOS.find(s => s.id === segmentoSeleccionado);
        if (!seg) return null;
        
        // Meta mensual del segmento (usa mes seleccionado en el modal)
        const datosMesModal = MESES[mesSeleccionadoModal - 1];
        const metaMesSeg = datosMesModal.ppto * seg.pct;
        // Meta semanal del segmento (proporcional de la semana total)
        const metaSemanaSeg = metaSemanaTotal * seg.pct;
        // Meta diaria del segmento (% día de semana × meta mensual)
        const metaDiaSeg = metaDiaHoyTotal * seg.pct;
        
        // Metas por TRACTO (promedio entre los tractores del segmento)
        const metaTractoMes = metaMesSeg / seg.tractores;
        const metaTractoSemana = metaSemanaSeg / seg.tractores;
        const metaTractoDia = metaDiaSeg / seg.tractores;
        
        return (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => { setSegmentoSeleccionado(null); setMesSeleccionadoModal(mesActual); }}>
            <div className="bg-slate-800 rounded-xl p-8 border border-slate-600 shadow-2xl max-w-4xl w-full mx-4" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <div className="text-white text-2xl font-bold uppercase tracking-wide">{seg.nombre}</div>
                <button onClick={() => { setSegmentoSeleccionado(null); setMesSeleccionadoModal(mesActual); }} className="text-slate-400 hover:text-white text-2xl font-light">&times;</button>
              </div>
              
              {/* Metas del Segmento */}
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-3">Metas del Segmento - {datosMesModal.nombre}</div>
              <div className="grid grid-cols-4 gap-3 mb-6">
                <div className="bg-slate-700 rounded-lg p-4 text-center border border-slate-600">
                  <div className="text-slate-400 text-xs uppercase tracking-wide mb-2">Anual</div>
                  <div className="text-white font-semibold text-lg">{fmt(seg.ppto)}</div>
                </div>
                <div className="bg-slate-700 rounded-lg p-4 text-center border border-slate-600">
                  <div className="text-slate-400 text-xs uppercase tracking-wide mb-2">Mes ({datosMesModal.nombre})</div>
                  <div className="text-white font-semibold text-lg">{fmt(Math.round(metaMesSeg))}</div>
                </div>
                <div className="bg-slate-700 rounded-lg p-4 text-center border border-slate-600">
                  <div className="text-slate-400 text-xs uppercase tracking-wide mb-2">Semana {semanaActual.semana} ({diasSemana} días)</div>
                  <div className="text-white font-semibold text-lg">{fmt(Math.round(metaSemanaSeg))}</div>
                </div>
                <div className="bg-amber-700 rounded-lg p-4 text-center border border-amber-600">
                  <div className="text-amber-100 text-xs uppercase tracking-wide mb-2">{textoHoy}</div>
                  <div className="text-white font-semibold text-lg">{fmt(Math.round(metaDiaSeg))}</div>
                </div>
              </div>
              
              {/* Metas por Tracto */}
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-3">Promedio por Unidad ({seg.tractores} tractores)</div>
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-slate-700/70 rounded-lg p-4 text-center border border-slate-600">
                  <div className="text-slate-400 text-xs uppercase tracking-wide mb-2">$/Tracto Mes</div>
                  <div className="text-white font-semibold text-lg">{fmt(Math.round(metaTractoMes))}</div>
                </div>
                <div className="bg-slate-700/70 rounded-lg p-4 text-center border border-slate-600">
                  <div className="text-slate-400 text-xs uppercase tracking-wide mb-2">$/Tracto Semana {semanaActual.semana}</div>
                  <div className="text-white font-semibold text-lg">{fmt(Math.round(metaTractoSemana))}</div>
                </div>
                <div className="bg-slate-700/70 rounded-lg p-4 text-center border border-slate-600">
                  <div className="text-slate-400 text-xs uppercase tracking-wide mb-2">$/Tracto Hoy</div>
                  <div className="text-white font-semibold text-lg">{fmt(Math.round(metaTractoDia))}</div>
                </div>
              </div>
              
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-3">Selecciona un Mes</div>
              <div className="grid grid-cols-6 gap-2">
                {MESES.map(m => (
                  <div 
                    key={m.mes} 
                    onClick={() => setMesSeleccionadoModal(m.mes)}
                    className={`text-center p-3 rounded-lg cursor-pointer transition-all ${
                      m.mes === mesSeleccionadoModal 
                        ? 'bg-amber-700 text-white border border-amber-500' 
                        : 'bg-slate-700 text-slate-300 border border-slate-600 hover:bg-slate-600'
                    }`}
                  >
                    <div className="text-xs font-medium">{m.nombre.slice(0,3)}</div>
                    <div className="font-semibold">{fmtDec(Math.round(m.ppto * seg.pct))}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL - Empresa */}
      {empresaSeleccionada && (() => {
        const emp = EMPRESAS.find(e => e.id === empresaSeleccionada);
        if (!emp) return null;
        
        // Metas de la EMPRESA (usa mes seleccionado en el modal)
        const datosMesModal = MESES[mesSeleccionadoModal - 1];
        const metaMesEmp = datosMesModal.ppto * emp.pct;
        const metaSemanaEmp = metaSemanaTotal * emp.pct;
        const metaDiaEmp = metaDiaHoyTotal * emp.pct;
        
        return (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => { setEmpresaSeleccionada(null); setMesSeleccionadoModal(mesActual); }}>
            <div className="bg-slate-800 rounded-xl p-8 border border-slate-600 shadow-2xl max-w-3xl w-full mx-4" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <div className="text-white text-2xl font-bold tracking-wide">{emp.nombre}</div>
                <button onClick={() => { setEmpresaSeleccionada(null); setMesSeleccionadoModal(mesActual); }} className="text-slate-400 hover:text-white text-2xl font-light">&times;</button>
              </div>
              
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-3">Metas de la Empresa - {datosMesModal.nombre}</div>
              <div className="grid grid-cols-4 gap-3 mb-6">
                <div className="bg-slate-700 rounded-lg p-4 text-center border border-slate-600">
                  <div className="text-slate-400 text-xs uppercase tracking-wide mb-2">Anual</div>
                  <div className="text-white font-semibold text-lg">{fmt(emp.ppto)}</div>
                </div>
                <div className="bg-slate-700 rounded-lg p-4 text-center border border-slate-600">
                  <div className="text-slate-400 text-xs uppercase tracking-wide mb-2">Mes ({datosMesModal.nombre})</div>
                  <div className="text-white font-semibold text-lg">{fmt(Math.round(metaMesEmp))}</div>
                </div>
                <div className="bg-slate-700 rounded-lg p-4 text-center border border-slate-600">
                  <div className="text-slate-400 text-xs uppercase tracking-wide mb-2">Semana {semanaActual.semana} ({diasSemana} días)</div>
                  <div className="text-white font-semibold text-lg">{fmt(Math.round(metaSemanaEmp))}</div>
                </div>
                <div className="bg-amber-700 rounded-lg p-4 text-center border border-amber-600">
                  <div className="text-amber-100 text-xs uppercase tracking-wide mb-2">{textoHoy}</div>
                  <div className="text-white font-semibold text-lg">{fmt(Math.round(metaDiaEmp))}</div>
                </div>
              </div>
              
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-3">Selecciona un Mes</div>
              <div className="grid grid-cols-6 gap-2">
                {MESES.map(m => (
                  <div 
                    key={m.mes} 
                    onClick={() => setMesSeleccionadoModal(m.mes)}
                    className={`text-center p-3 rounded-lg cursor-pointer transition-all ${
                      m.mes === mesSeleccionadoModal 
                        ? 'bg-amber-700 text-white border border-amber-500' 
                        : 'bg-slate-700 text-slate-300 border border-slate-600 hover:bg-slate-600'
                    }`}
                  >
                    <div className="text-xs font-medium">{m.nombre.slice(0,3)}</div>
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
        const cantidadReal = conteoSegmentos[seg.id] || tractoresSegmento.length || seg.tractores;
        
        return (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]" onClick={() => { setUnidadesSegmento(null); setTractoresSegmento([]); }}>
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-xl p-6 border-2 border-amber-500/50 shadow-2xl shadow-amber-500/20 max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-500 text-slate-900 px-3 py-1 rounded-md font-bold text-sm">{cantidadReal}</div>
                  <div className="text-white text-xl font-bold uppercase tracking-wide">Unidades {seg.nombre}</div>
                </div>
                <button onClick={() => { setUnidadesSegmento(null); setTractoresSegmento([]); }} className="text-slate-400 hover:text-white text-2xl font-light">&times;</button>
              </div>
              
              {loadingTractores ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                  <span className="ml-3 text-slate-400">Cargando unidades...</span>
                </div>
              ) : (
                <div className="overflow-y-auto max-h-[60vh] pr-2">
                  <div className="grid grid-cols-6 gap-2">
                    {tractoresSegmento.map((t, i) => {
                      const vel = parseFloat(t.velocidad) || 0;
                      const enMovimiento = vel > 0;
                      return (
                        <div 
                          key={i} 
                          onClick={() => setTractoSeleccionado(t.economico)}
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
                  {tractoresSegmento.length === 0 && !loadingTractores && (
                    <div className="text-center py-8 text-slate-400">No se encontraron unidades para este segmento</div>
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
        const cantidadReal = conteoEmpresas[emp.id] || tractoresEmpresa.length || emp.unidades;
        
        return (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]" onClick={() => { setUnidadesEmpresa(null); setTractoresEmpresa([]); }}>
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-xl p-6 border-2 border-amber-500/50 shadow-2xl shadow-amber-500/20 max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-500 text-slate-900 px-3 py-1 rounded-md font-bold text-sm">{cantidadReal}</div>
                  <div className="text-white text-xl font-bold tracking-wide">Unidades {emp.nombre}</div>
                </div>
                <button onClick={() => { setUnidadesEmpresa(null); setTractoresEmpresa([]); }} className="text-slate-400 hover:text-white text-2xl font-light">&times;</button>
              </div>
              
              {loadingTractores ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                  <span className="ml-3 text-slate-400">Cargando unidades...</span>
                </div>
              ) : (
                <div className="overflow-y-auto max-h-[60vh] pr-2">
                  <div className="grid grid-cols-6 gap-2">
                    {tractoresEmpresa.map((t, i) => {
                      const vel = parseFloat(t.velocidad) || 0;
                      const enMovimiento = vel > 0;
                      return (
                        <div 
                          key={i} 
                          onClick={() => setTractoSeleccionado(t.economico)}
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
                  {tractoresEmpresa.length === 0 && !loadingTractores && (
                    <div className="text-center py-8 text-slate-400">No se encontraron unidades para esta empresa</div>
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
      {tractoSeleccionado && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-[70]" onClick={() => setTractoSeleccionado(null)}>
          <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-xl p-6 border-2 border-blue-500/50 shadow-2xl shadow-blue-500/20 max-w-3xl w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <MapPin className="w-6 h-6 text-blue-400" />
                <div className="text-white text-xl font-bold tracking-wide">Ubicación {tractoSeleccionado}</div>
              </div>
              <button onClick={() => setTractoSeleccionado(null)} className="text-slate-400 hover:text-white text-2xl font-light">&times;</button>
            </div>

            {loadingGPS ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-slate-400">Cargando datos GPS...</span>
              </div>
            ) : datosGPS?.sinDatos ? (
              <div className="text-center py-12">
                <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                <div className="text-slate-300 text-lg">Sin datos GPS disponibles</div>
                <div className="text-slate-500 text-sm mt-2">Esta unidad no tiene registros en el sistema</div>
              </div>
            ) : datosGPS?.error ? (
              <div className="text-center py-12">
                <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <div className="text-slate-300 text-lg">Error al obtener datos</div>
              </div>
            ) : datosGPS ? (
              <div className="space-y-4">
                {/* Mapa */}
                <div className="rounded-lg overflow-hidden border border-slate-600 h-64">
                  {datosGPS.latitud && datosGPS.longitud ? (
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      scrolling="no"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${datosGPS.longitud - 0.02},${datosGPS.latitud - 0.015},${datosGPS.longitud + 0.02},${datosGPS.latitud + 0.015}&layer=mapnik&marker=${datosGPS.latitud},${datosGPS.longitud}`}
                      style={{ border: 0 }}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center bg-slate-700">
                      <span className="text-slate-400">Sin coordenadas disponibles</span>
                    </div>
                  )}
                </div>

                {/* Datos del tracto */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Ubicación */}
                  <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-blue-400" />
                      <span className="text-slate-400 text-xs uppercase tracking-wide">Ubicación</span>
                    </div>
                    <div className="text-white font-semibold">{datosGPS.estado || 'N/A'}</div>
                    <div className="text-slate-300 text-sm">{datosGPS.municipio || datosGPS.ciudad || 'N/A'}</div>
                  </div>

                  {/* Estado de movimiento */}
                  <div className={`rounded-lg p-4 border ${datosGPS.velocidad > 0 ? 'bg-green-900/30 border-green-600' : 'bg-amber-900/30 border-amber-600'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Gauge className="w-4 h-4 text-blue-400" />
                      <span className="text-slate-400 text-xs uppercase tracking-wide">Estado</span>
                    </div>
                    {datosGPS.velocidad > 0 ? (
                      <>
                        <div className="text-green-400 font-semibold flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                          En Movimiento
                        </div>
                        <div className="text-white text-lg font-bold">{datosGPS.velocidad} km/h</div>
                      </>
                    ) : (
                      <>
                        <div className="text-amber-400 font-semibold flex items-center gap-2">
                          <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
                          Detenido
                        </div>
                        {datosGPS.tiempoParado && (
                          <div className="text-white text-lg font-bold">{datosGPS.tiempoParado}</div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Velocidad promedio */}
                  <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                    <div className="flex items-center gap-2 mb-2">
                      <Gauge className="w-4 h-4 text-blue-400" />
                      <span className="text-slate-400 text-xs uppercase tracking-wide">Vel. Promedio 24h</span>
                    </div>
                    <div className="text-white font-semibold text-lg">{datosGPS.velocidad_promedio || 'N/A'} km/h</div>
                    <div className="text-slate-400 text-xs">Sin contar paradas</div>
                  </div>

                  {/* Última actualización */}
                  <div className={`rounded-lg p-4 border ${datosGPS.gpsDesactualizado ? 'bg-red-900/30 border-red-600' : 'bg-slate-700/50 border-slate-600'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <span className="text-slate-400 text-xs uppercase tracking-wide">Última Actualización</span>
                    </div>
                    {datosGPS.gpsDesactualizado ? (
                      <>
                        <div className="text-red-400 font-semibold flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          GPS Desactualizado
                        </div>
                        <div className="text-slate-300 text-sm">
                          {new Date(datosGPS.ultima_actualizacion).toLocaleString('es-MX')}
                        </div>
                        <div className="text-red-300 text-xs">Hace {datosGPS.horasDesdeActualizacion} hrs</div>
                      </>
                    ) : (
                      <>
                        <div className="text-green-400 font-semibold text-sm">GPS Activo</div>
                        <div className="text-slate-300 text-sm">
                          {new Date(datosGPS.ultima_actualizacion).toLocaleString('es-MX')}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Coordenadas */}
                <div className="bg-slate-800 rounded-lg p-3 border border-slate-700 flex items-center justify-between">
                  <div className="text-slate-400 text-xs">
                    <span className="text-slate-500">LAT:</span> {datosGPS.latitud?.toFixed(6) || 'N/A'} | 
                    <span className="text-slate-500 ml-2">LON:</span> {datosGPS.longitud?.toFixed(6) || 'N/A'}
                  </div>
                  {datosGPS.latitud && datosGPS.longitud && (
                    <a 
                      href={`https://www.google.com/maps?q=${datosGPS.latitud},${datosGPS.longitud}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 text-xs hover:text-blue-300 hover:underline"
                    >
                      Abrir en Google Maps →
                    </a>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
