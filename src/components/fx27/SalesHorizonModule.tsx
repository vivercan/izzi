'use client';

import React, { useState, useMemo } from 'react';
import { 
  Target, ArrowLeft, ChevronDown, ChevronUp, Download, Calendar,
  Building2, Users, Truck, TrendingUp, Filter, X
} from 'lucide-react';

// ===== DATOS =====
const GLOBAL = { meta_anual: 1341341246.49, operatividad: 0.95, tractores_totales: 219, tractores_facturan: 210 };

const EMPRESAS = [
  { id: 'SPEEDYHAUL', nombre: 'SPEEDYHAUL', pct: 0.15, ppto: 201201187 },
  { id: 'TROB', nombre: 'TROB', pct: 0.595, ppto: 798098042 },
  { id: 'WEXPRESS', nombre: 'WEXPRESS', pct: 0.255, ppto: 342042018 },
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
  { mes: 1, nombre: 'Ene', pct: 0.07, ppto: 93893887 },
  { mes: 2, nombre: 'Feb', pct: 0.07, ppto: 93893887 },
  { mes: 3, nombre: 'Mar', pct: 0.08, ppto: 107307300 },
  { mes: 4, nombre: 'Abr', pct: 0.08, ppto: 107307300 },
  { mes: 5, nombre: 'May', pct: 0.081, ppto: 108648641 },
  { mes: 6, nombre: 'Jun', pct: 0.085, ppto: 114014006 },
  { mes: 7, nombre: 'Jul', pct: 0.087, ppto: 116696688 },
  { mes: 8, nombre: 'Ago', pct: 0.089, ppto: 119379371 },
  { mes: 9, nombre: 'Sep', pct: 0.093, ppto: 124744736 },
  { mes: 10, nombre: 'Oct', pct: 0.095, ppto: 127427418 },
  { mes: 11, nombre: 'Nov', pct: 0.09, ppto: 120720712 },
  { mes: 12, nombre: 'Dic', pct: 0.08, ppto: 107307300 },
];

// ===== HELPERS =====
const fmt = (v: number, c = false): string => {
  if (c) {
    if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
    if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
    if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  }
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(v);
};
const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

interface Props { onBack: () => void; }

export default function SalesHorizonModule({ onBack }: Props) {
  const mesActual = new Date().getMonth() + 1;
  const [showFiltros, setShowFiltros] = useState(false);
  const [fechaInicio, setFechaInicio] = useState('2026-01-01');
  const [fechaFin, setFechaFin] = useState('2026-12-31');
  
  // Checkboxes
  const [checks, setChecks] = useState({
    empresas: false,
    segmentos: false,
    meses: false,
    semanas: false,
    tractores: false,
  });

  const toggleCheck = (key: keyof typeof checks) => {
    setChecks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const datosMesActual = MESES[mesActual - 1];
  const acumuladoYTD = MESES.slice(0, mesActual).reduce((a, m) => a + m.ppto, 0);

  // Calcular meses en rango
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
      {/* Header compacto */}
      <div className="bg-slate-800/50 border-b border-slate-700/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 hover:bg-slate-700 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </button>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-400" />
              <span className="text-lg font-bold text-white">Sales Horizon 2026</span>
            </div>
          </div>
          <button className="flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs text-white">
            <Download className="w-3 h-3" /> Excel
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* KPIs Principales - Compactos */}
        <div className="grid grid-cols-5 gap-3">
          <div className="bg-blue-600/20 rounded-lg p-3 border border-blue-500/30">
            <div className="text-blue-300 text-xs">Meta Anual</div>
            <div className="text-xl font-bold text-white">{fmt(GLOBAL.meta_anual, true)}</div>
          </div>
          <div className="bg-emerald-600/20 rounded-lg p-3 border border-emerald-500/30">
            <div className="text-emerald-300 text-xs">Meta {datosMesActual.nombre}</div>
            <div className="text-xl font-bold text-white">{fmt(datosMesActual.ppto, true)}</div>
          </div>
          <div className="bg-orange-600/20 rounded-lg p-3 border border-orange-500/30">
            <div className="text-orange-300 text-xs">Acumulado YTD</div>
            <div className="text-xl font-bold text-white">{fmt(acumuladoYTD, true)}</div>
          </div>
          <div className="bg-purple-600/20 rounded-lg p-3 border border-purple-500/30">
            <div className="text-purple-300 text-xs">Operatividad</div>
            <div className="text-xl font-bold text-white">{pct(GLOBAL.operatividad)}</div>
          </div>
          <div className="bg-cyan-600/20 rounded-lg p-3 border border-cyan-500/30">
            <div className="text-cyan-300 text-xs">Tractores</div>
            <div className="text-xl font-bold text-white">{GLOBAL.tractores_facturan}/{GLOBAL.tractores_totales}</div>
          </div>
        </div>

        {/* Barra de meses - Visual rápido */}
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Distribución Mensual</span>
            <span className="text-xs text-slate-500">Click para ver detalle</span>
          </div>
          <div className="flex gap-1">
            {MESES.map(m => (
              <div 
                key={m.mes} 
                className={`flex-1 rounded text-center py-2 cursor-pointer transition-all ${m.mes === mesActual ? 'bg-orange-500 text-white' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'}`}
                title={`${m.nombre}: ${fmt(m.ppto, true)}`}
              >
                <div className="text-xs font-medium">{m.nombre}</div>
                <div className="text-xs opacity-75">{fmt(m.ppto, true)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Botón Filtros Avanzados */}
        <button 
          onClick={() => setShowFiltros(!showFiltros)}
          className="w-full flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg border border-slate-700/50"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-orange-400" />
            <span className="text-white font-medium">Filtros y Desglose Avanzado</span>
          </div>
          {showFiltros ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>

        {/* Panel de Filtros */}
        {showFiltros && (
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 space-y-4">
            {/* Rango de fechas */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-300">Rango:</span>
              </div>
              <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm" />
              <span className="text-slate-500">a</span>
              <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm" />
              <div className="ml-auto text-sm text-orange-400 font-medium">
                Ppto Rango: {fmt(pptoRango, true)}
              </div>
            </div>

            {/* Checkboxes */}
            <div className="flex flex-wrap gap-3">
              {[
                { key: 'empresas', label: 'Por Empresa', icon: Building2 },
                { key: 'segmentos', label: 'Por Segmento', icon: Users },
                { key: 'meses', label: 'Por Mes', icon: Calendar },
                { key: 'tractores', label: '$/Tracto', icon: Truck },
              ].map(({ key, label, icon: Icon }) => (
                <label key={key} className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${checks[key as keyof typeof checks] ? 'bg-orange-500/30 border-orange-500' : 'bg-slate-700/50 border-slate-600'} border`}>
                  <input type="checkbox" checked={checks[key as keyof typeof checks]} onChange={() => toggleCheck(key as keyof typeof checks)} className="w-4 h-4 accent-orange-500" />
                  <Icon className="w-4 h-4 text-slate-300" />
                  <span className="text-sm text-white">{label}</span>
                </label>
              ))}
            </div>

            {/* Resultados según checks */}
            <div className="space-y-3">
              {/* Por Empresa */}
              {checks.empresas && (
                <div className="bg-slate-700/30 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-blue-400 mb-2 flex items-center gap-2"><Building2 className="w-4 h-4" /> Por Empresa</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {EMPRESAS.map(e => (
                      <div key={e.id} className="bg-slate-800/50 rounded p-2 flex justify-between items-center">
                        <span className="text-white text-sm">{e.nombre}</span>
                        <span className="text-blue-300 font-bold text-sm">{fmt(pptoRango * e.pct, true)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Por Segmento */}
              {checks.segmentos && (
                <div className="bg-slate-700/30 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-emerald-400 mb-2 flex items-center gap-2"><Users className="w-4 h-4" /> Por Segmento</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {SEGMENTOS.map(s => (
                      <div key={s.id} className="bg-slate-800/50 rounded p-2">
                        <div className="flex justify-between">
                          <span className="text-white text-xs">{s.nombre}</span>
                          <span className="text-emerald-300 font-bold text-xs">{fmt(pptoRango * s.pct, true)}</span>
                        </div>
                        <div className="text-slate-500 text-xs">{s.tractores}T • {fmt(s.tmes, true)}/T</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Por Mes */}
              {checks.meses && (
                <div className="bg-slate-700/30 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-orange-400 mb-2 flex items-center gap-2"><Calendar className="w-4 h-4" /> Por Mes (en rango)</h4>
                  <div className="grid grid-cols-6 gap-2">
                    {mesesEnRango.map(m => (
                      <div key={m.mes} className={`rounded p-2 text-center ${m.mes === mesActual ? 'bg-orange-500/30 border border-orange-500/50' : 'bg-slate-800/50'}`}>
                        <div className="text-white text-xs font-medium">{m.nombre}</div>
                        <div className="text-orange-300 font-bold text-sm">{fmt(m.ppto, true)}</div>
                        <div className="text-slate-500 text-xs">{pct(m.pct)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* $/Tracto */}
              {checks.tractores && (
                <div className="bg-slate-700/30 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-purple-400 mb-2 flex items-center gap-2"><Truck className="w-4 h-4" /> $/Tracto por Segmento</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {SEGMENTOS.map(s => (
                      <div key={s.id} className="bg-slate-800/50 rounded p-2">
                        <div className="text-white text-xs">{s.nombre}</div>
                        <div className="text-purple-300 font-bold">{fmt(s.tmes)}</div>
                        <div className="text-slate-500 text-xs">
                          Día: {fmt(s.tmes / 30)} • Sem: {fmt(s.tmes / 4, true)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mensaje si no hay nada seleccionado */}
              {!checks.empresas && !checks.segmentos && !checks.meses && !checks.tractores && (
                <div className="text-center text-slate-500 py-4">
                  Selecciona una o más opciones para ver el desglose
                </div>
              )}
            </div>
          </div>
        )}

        {/* Resumen rápido por Segmento (siempre visible, compacto) */}
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Segmentos - {datosMesActual.nombre}</span>
            <span className="text-xs text-emerald-400">{GLOBAL.tractores_facturan} tractores facturando</span>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {SEGMENTOS.map(s => (
              <div key={s.id} className="bg-slate-700/30 rounded p-2 text-center hover:bg-slate-700/50 cursor-pointer">
                <div className="text-white text-xs font-medium truncate">{s.nombre}</div>
                <div className="text-emerald-400 font-bold text-sm">{fmt(datosMesActual.ppto * s.pct, true)}</div>
                <div className="text-slate-500 text-xs">{s.tractores}T</div>
              </div>
            ))}
          </div>
        </div>

        {/* Empresas compacto */}
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
          <span className="text-sm text-slate-400">Empresas - {datosMesActual.nombre}</span>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {EMPRESAS.map(e => (
              <div key={e.id} className="bg-slate-700/30 rounded p-2 flex justify-between items-center">
                <div>
                  <div className="text-white text-sm font-medium">{e.nombre}</div>
                  <div className="text-slate-500 text-xs">{pct(e.pct)} del ppto</div>
                </div>
                <div className="text-blue-400 font-bold">{fmt(datosMesActual.ppto * e.pct, true)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
