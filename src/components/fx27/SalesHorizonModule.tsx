'use client';

import React, { useState, useMemo } from 'react';
import { 
  Target, ArrowLeft, ChevronDown, ChevronUp, Download, Calendar,
  Building2, Users, Truck, Filter
} from 'lucide-react';

// ===== DATOS =====
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

// ===== HELPERS =====
const fmt = (v: number, c = false): string => {
  if (c) {
    if (v >= 1e9) return `$${Math.round(v / 1e9)}B`;
    if (v >= 1e6) return `$${Math.round(v / 1e6)}M`;
    if (v >= 1e3) return `$${Math.round(v / 1e3)}K`;
  }
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(v);
};

interface Props { onBack: () => void; }

export default function SalesHorizonModule({ onBack }: Props) {
  const mesActual = new Date().getMonth() + 1;
  const [showFiltros, setShowFiltros] = useState(false);
  const [fechaInicio, setFechaInicio] = useState('2026-01-01');
  const [fechaFin, setFechaFin] = useState('2026-12-31');
  
  const [checks, setChecks] = useState({
    empresas: false,
    segmentos: false,
    meses: false,
    tractores: false,
  });

  const toggleCheck = (key: keyof typeof checks) => {
    setChecks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const datosMesActual = MESES[mesActual - 1];
  const acumuladoYTD = MESES.slice(0, mesActual).reduce((a, m) => a + m.ppto, 0);

  const mesesEnRango = useMemo(() => {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const mesI = inicio.getMonth() + 1;
    const mesF = fin.getMonth() + 1;
    return MESES.filter(m => m.mes >= mesI && m.mes <= mesF);
  }, [fechaInicio, fechaFin]);

  const pptoRango = mesesEnRango.reduce((a, m) => a + m.ppto, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header - Más claro para distinguirse */}
      <div className="bg-slate-900 border-b-2 border-orange-500/50 px-4 py-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 hover:bg-slate-700 rounded-md">
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </button>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-orange-500" />
              <span className="text-lg font-bold text-white">Sales Horizon 2026</span>
            </div>
          </div>
          <button className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-b from-blue-800 to-blue-950 hover:from-blue-700 hover:to-blue-900 rounded-md text-xs text-white font-medium border border-blue-600/30 shadow-lg">
            <Download className="w-3 h-3" /> Excel
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* KPIs Principales - Azul dashboard con profundidad */}
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

        {/* Barra de meses - COLORES VIVOS */}
        <div className="bg-slate-800/50 rounded-md p-3 border border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Distribución Mensual</span>
          </div>
          <div className="flex gap-1">
            {MESES.map(m => (
              <div 
                key={m.mes} 
                className={`flex-1 rounded text-center py-2 cursor-pointer transition-all ${
                  m.mes === mesActual 
                    ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30' 
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600'
                }`}
                title={`${m.nombre}: ${fmt(m.ppto, true)}`}
              >
                <div className="text-xs font-medium">{m.nombre}</div>
                <div className="text-xs opacity-90 font-bold">{fmt(m.ppto, true)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Botón Filtros Avanzados - COLOR VIVO */}
        <button 
          onClick={() => setShowFiltros(!showFiltros)}
          className={`w-full flex items-center justify-between p-3 rounded-md border transition-all ${
            showFiltros 
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 border-orange-400 shadow-lg shadow-orange-500/25' 
              : 'bg-slate-800/50 hover:bg-slate-700/50 border-slate-700/50'
          }`}
        >
          <div className="flex items-center gap-2">
            <Filter className={`w-4 h-4 ${showFiltros ? 'text-white' : 'text-orange-400'}`} />
            <span className={`font-medium ${showFiltros ? 'text-white' : 'text-white'}`}>Filtros y Desglose Avanzado</span>
          </div>
          {showFiltros ? <ChevronUp className="w-5 h-5 text-white" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>

        {/* Panel de Filtros */}
        {showFiltros && (
          <div className="bg-slate-800/50 rounded-md p-4 border border-slate-700/50 space-y-4">
            {/* Rango de fechas */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-300">Rango:</span>
              </div>
              <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm" />
              <span className="text-slate-500">a</span>
              <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm" />
              <div className="ml-auto px-3 py-1 bg-gradient-to-r from-orange-500 to-amber-500 rounded-md text-white font-bold text-sm shadow-lg shadow-orange-500/25">
                Ppto Rango: {fmt(pptoRango, true)}
              </div>
            </div>

            {/* Checkboxes - COLORES VIVOS */}
            <div className="flex flex-wrap gap-3">
              {[
                { key: 'empresas', label: 'Por Empresa', icon: Building2, color: 'blue' },
                { key: 'segmentos', label: 'Por Segmento', icon: Users, color: 'blue' },
                { key: 'meses', label: 'Por Mes', icon: Calendar, color: 'orange' },
                { key: 'tractores', label: '$/Tracto', icon: Truck, color: 'purple' },
              ].map(({ key, label, icon: Icon, color }) => (
                <label 
                  key={key} 
                  className={`flex items-center gap-2 px-4 py-2 rounded-md cursor-pointer transition-all ${
                    checks[key as keyof typeof checks] 
                      ? `bg-gradient-to-r from-${color}-500 to-${color}-600 shadow-lg shadow-${color}-500/25 border-transparent` 
                      : 'bg-slate-700/50 border-slate-600 hover:bg-slate-600'
                  } border`}
                >
                  <input type="checkbox" checked={checks[key as keyof typeof checks]} onChange={() => toggleCheck(key as keyof typeof checks)} className="w-4 h-4 accent-white" />
                  <Icon className="w-4 h-4 text-white" />
                  <span className="text-sm text-white font-medium">{label}</span>
                </label>
              ))}
            </div>

            {/* Resultados según checks */}
            <div className="space-y-3">
              {checks.empresas && (
                <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-md p-3 border border-blue-500/30">
                  <h4 className="text-sm font-bold text-blue-300 mb-2 flex items-center gap-2"><Building2 className="w-4 h-4" /> Por Empresa</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {EMPRESAS.map(e => (
                      <div key={e.id} className="bg-blue-500/20 rounded-md p-3 flex justify-between items-center border border-blue-400/30">
                        <span className="text-white text-sm font-medium">{e.nombre}</span>
                        <span className="text-blue-200 font-black text-lg">{fmt(pptoRango * e.pct, true)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {checks.segmentos && (
                <div className="bg-gradient-to-br from-blue-800/20 to-blue-900/20 rounded-md p-3 border border-blue-600/30">
                  <h4 className="text-sm font-bold text-blue-300 mb-2 flex items-center gap-2"><Users className="w-4 h-4" /> Por Segmento</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {SEGMENTOS.map(s => (
                      <div key={s.id} className="bg-blue-800/20 rounded-md p-2 border border-blue-600/30">
                        <div className="flex justify-between items-start">
                          <span className="text-white text-xs font-medium">{s.nombre}</span>
                          <span className="text-blue-200 font-black text-sm">{fmt(pptoRango * s.pct, true)}</span>
                        </div>
                        <div className="text-blue-300/70 text-xs mt-1">{s.tractores}T • {fmt(s.tmes, true)}/T</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {checks.meses && (
                <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-md p-3 border border-orange-500/30">
                  <h4 className="text-sm font-bold text-orange-300 mb-2 flex items-center gap-2"><Calendar className="w-4 h-4" /> Por Mes (en rango)</h4>
                  <div className="grid grid-cols-6 gap-2">
                    {mesesEnRango.map(m => (
                      <div key={m.mes} className={`rounded-md p-2 text-center border ${
                        m.mes === mesActual 
                          ? 'bg-gradient-to-br from-orange-500 to-red-500 border-orange-400 shadow-lg' 
                          : 'bg-orange-500/20 border-orange-400/30'
                      }`}>
                        <div className="text-white text-xs font-medium">{m.nombre}</div>
                        <div className="text-white font-black text-sm">{fmt(m.ppto, true)}</div>
                        <div className="text-orange-200/70 text-xs">{Math.round(m.pct * 100)}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {checks.tractores && (
                <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-md p-3 border border-purple-500/30">
                  <h4 className="text-sm font-bold text-purple-300 mb-2 flex items-center gap-2"><Truck className="w-4 h-4" /> $/Tracto por Segmento</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {SEGMENTOS.map(s => (
                      <div key={s.id} className="bg-purple-500/20 rounded-md p-2 border border-purple-400/30">
                        <div className="text-white text-xs font-medium">{s.nombre}</div>
                        <div className="text-purple-200 font-black text-lg">{fmt(s.tmes)}</div>
                        <div className="text-purple-300/70 text-xs">
                          Día: {fmt(Math.round(s.tmes / 30))} • Sem: {fmt(Math.round(s.tmes / 4), true)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!checks.empresas && !checks.segmentos && !checks.meses && !checks.tractores && (
                <div className="text-center text-slate-400 py-6 bg-slate-700/30 rounded-md">
                  ☝️ Selecciona una o más opciones para ver el desglose
                </div>
              )}
            </div>
          </div>
        )}

        {/* Resumen rápido por Segmento - COLORES VIVOS */}
        <div className="bg-slate-800/50 rounded-md p-3 border border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Segmentos - {datosMesActual.nombre}</span>
            <span className="text-xs px-2 py-1 bg-gradient-to-b from-blue-800 to-blue-950 rounded-md text-blue-100 border border-blue-600/30 font-light tracking-wide">{GLOBAL.tractores_facturan} tractores</span>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {SEGMENTOS.map(s => (
              <div key={s.id} className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-md p-2 text-center hover:from-blue-700 hover:to-blue-800 cursor-pointer transition-all border border-slate-600 hover:border-blue-500">
                <div className="text-white text-xs font-medium truncate uppercase">{s.nombre}</div>
                <div className="text-blue-400 font-black text-sm">{fmt(datosMesActual.ppto * s.pct, true)}</div>
                <div className="text-slate-400 text-xs">{s.tractores} Unidades</div>
              </div>
            ))}
          </div>
        </div>

        {/* Empresas compacto */}
        <div className="bg-slate-800/50 rounded-md p-3 border border-slate-700/50">
          <span className="text-sm text-slate-400">Empresas - {datosMesActual.nombre}</span>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {EMPRESAS.map(e => (
              <div key={e.id} className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-md p-3 flex justify-between items-center hover:from-blue-600 hover:to-blue-700 cursor-pointer transition-all border border-slate-600 hover:border-blue-500">
                <div>
                  <div className="text-white text-sm font-bold">{e.nombre}</div>
                  <div className="text-slate-400 text-xs">{Math.round(e.pct * 100)}% del ppto • {e.unidades} Unidades</div>
                </div>
                <div className="text-blue-400 font-black text-lg">{fmt(datosMesActual.ppto * e.pct, true)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
