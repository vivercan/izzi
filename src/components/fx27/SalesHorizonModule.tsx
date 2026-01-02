'use client';

import React, { useState } from 'react';
import { 
  Target, ArrowLeft, Download, Building2, Users, Truck, X
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
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<string | null>(null);
  const [segmentoSeleccionado, setSegmentoSeleccionado] = useState<string | null>(null);

  const datosMesActual = MESES[mesActual - 1];
  const acumuladoYTD = MESES.slice(0, mesActual).reduce((a, m) => a + m.ppto, 0);

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
              <Target className="w-5 h-5 text-orange-400" />
              <span className="text-lg font-bold text-white tracking-wide">SALES HORIZON 2026</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1.5 bg-gradient-to-b from-blue-800 to-blue-950 rounded-md text-blue-100 border border-blue-600/30 font-light tracking-wide">{GLOBAL.tractores_facturan} tractores</span>
            <button className="text-xs px-3 py-1.5 bg-gradient-to-b from-blue-800 to-blue-950 hover:from-blue-700 hover:to-blue-900 rounded-md text-blue-100 font-light tracking-wide border border-blue-600/30 shadow-lg flex items-center gap-1">
              <Download className="w-3 h-3" /> Excel
            </button>
          </div>
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
                title={`${m.nombre}: ${fmt(m.ppto, true)}`}
              >
                <div className="text-xs font-medium">{m.nombre}</div>
                <div className="text-xs opacity-90 font-bold">{fmt(m.ppto, true)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Resumen rápido por Segmento */}
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
                <div className="text-slate-400 text-xs">{s.tractores} Unidades</div>
              </div>
            ))}
          </div>
        </div>

        {/* Empresas - Meta Mensual */}
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
                  <div className="text-right">
                    <div className="text-slate-500">Unidades</div>
                    <div className="text-slate-300">{e.unidades}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL SUPERPUESTO - Segmento */}
      {segmentoSeleccionado && (() => {
        const seg = SEGMENTOS.find(s => s.id === segmentoSeleccionado);
        if (!seg) return null;
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSegmentoSeleccionado(null)}>
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-8 border border-blue-500/30 shadow-2xl max-w-3xl w-full mx-4" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <div className="text-blue-200 text-2xl font-bold uppercase">{seg.nombre}</div>
                <button onClick={() => setSegmentoSeleccionado(null)} className="text-slate-400 hover:text-white text-3xl">&times;</button>
              </div>
              <div className="grid grid-cols-5 gap-3 mb-6">
                <div className="bg-blue-800/40 rounded-lg p-4 text-center">
                  <div className="text-blue-300 text-sm mb-1">Anual</div>
                  <div className="text-white font-bold text-xl">{fmt(seg.ppto, true)}</div>
                </div>
                <div className="bg-blue-800/40 rounded-lg p-4 text-center">
                  <div className="text-blue-300 text-sm mb-1">Mensual</div>
                  <div className="text-white font-bold text-xl">{fmt(datosMesActual.ppto * seg.pct, true)}</div>
                </div>
                <div className="bg-blue-800/40 rounded-lg p-4 text-center">
                  <div className="text-blue-300 text-sm mb-1">Semanal</div>
                  <div className="text-white font-bold text-xl">{fmt(datosMesActual.ppto * seg.pct / 4, true)}</div>
                </div>
                <div className="bg-blue-800/40 rounded-lg p-4 text-center">
                  <div className="text-blue-300 text-sm mb-1">Diario</div>
                  <div className="text-white font-bold text-xl">{fmt(datosMesActual.ppto * seg.pct / 30, true)}</div>
                </div>
                <div className="bg-blue-800/40 rounded-lg p-4 text-center">
                  <div className="text-blue-300 text-sm mb-1">$/Unidad</div>
                  <div className="text-white font-bold text-xl">{fmt(seg.tmes, true)}</div>
                </div>
              </div>
              <div className="text-sm text-slate-400 mb-3">Presupuesto por mes:</div>
              <div className="grid grid-cols-6 gap-2">
                {MESES.map(m => (
                  <div key={m.mes} className={`text-center p-3 rounded-lg text-sm ${m.mes === mesActual ? 'bg-orange-500/40 text-orange-100' : 'bg-slate-700/50 text-slate-300'}`}>
                    <div className="font-medium">{m.nombre.slice(0,3)}</div>
                    <div className="font-bold text-lg">{fmt(m.ppto * seg.pct, true)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL SUPERPUESTO - Empresa */}
      {empresaSeleccionada && (() => {
        const emp = EMPRESAS.find(e => e.id === empresaSeleccionada);
        if (!emp) return null;
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setEmpresaSeleccionada(null)}>
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-8 border border-blue-500/30 shadow-2xl max-w-3xl w-full mx-4" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <div className="text-blue-200 text-2xl font-bold">{emp.nombre}</div>
                <button onClick={() => setEmpresaSeleccionada(null)} className="text-slate-400 hover:text-white text-3xl">&times;</button>
              </div>
              <div className="grid grid-cols-4 gap-3 mb-6">
                <div className="bg-blue-800/40 rounded-lg p-4 text-center">
                  <div className="text-blue-300 text-sm mb-1">Anual</div>
                  <div className="text-white font-bold text-xl">{fmt(emp.ppto, true)}</div>
                </div>
                <div className="bg-blue-800/40 rounded-lg p-4 text-center">
                  <div className="text-blue-300 text-sm mb-1">Mensual</div>
                  <div className="text-white font-bold text-xl">{fmt(datosMesActual.ppto * emp.pct, true)}</div>
                </div>
                <div className="bg-blue-800/40 rounded-lg p-4 text-center">
                  <div className="text-blue-300 text-sm mb-1">Semanal</div>
                  <div className="text-white font-bold text-xl">{fmt(datosMesActual.ppto * emp.pct / 4, true)}</div>
                </div>
                <div className="bg-blue-800/40 rounded-lg p-4 text-center">
                  <div className="text-blue-300 text-sm mb-1">Diario</div>
                  <div className="text-white font-bold text-xl">{fmt(datosMesActual.ppto * emp.pct / 30, true)}</div>
                </div>
              </div>
              <div className="text-sm text-slate-400 mb-3">Presupuesto por mes:</div>
              <div className="grid grid-cols-6 gap-2">
                {MESES.map(m => (
                  <div key={m.mes} className={`text-center p-3 rounded-lg text-sm ${m.mes === mesActual ? 'bg-orange-500/40 text-orange-100' : 'bg-slate-700/50 text-slate-300'}`}>
                    <div className="font-medium">{m.nombre.slice(0,3)}</div>
                    <div className="font-bold text-lg">{fmt(m.ppto * emp.pct, true)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
