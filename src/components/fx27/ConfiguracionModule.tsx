'use client';

import React, { useState } from 'react';
import { ArrowLeft, Users, Database, FolderOpen, Target } from 'lucide-react';
import SalesHorizonModule from './SalesHorizonModule';

interface Props { onBack: () => void; }

type SubModulo = null | 'usuarios' | 'backup' | 'archivos' | 'sales_horizon';

export function ConfiguracionModule({ onBack }: Props) {
  const [subModulo, setSubModulo] = useState<SubModulo>(null);

  if (subModulo === 'sales_horizon') {
    return <SalesHorizonModule onBack={() => setSubModulo(null)} />;
  }

  const opciones = [
    { id: 'usuarios', titulo: 'Usuarios', descripcion: 'Gestionar usuarios y permisos', icono: Users, color: 'from-blue-500 to-blue-600' },
    { id: 'backup', titulo: 'Backup', descripcion: 'Respaldo de leads eliminados', icono: Database, color: 'from-emerald-500 to-emerald-600' },
    { id: 'archivos', titulo: 'Archivos', descripcion: 'Cotizaciones y contratos', icono: FolderOpen, color: 'from-purple-500 to-purple-600' },
    { id: 'sales_horizon', titulo: 'Sales Horizon', descripcion: 'Presupuesto y metas 2026', icono: Target, color: 'from-orange-500 to-amber-600' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="bg-slate-800/50 border-b border-slate-700/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 bg-orange-500 hover:bg-orange-600 rounded-full">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-2xl font-bold text-white">Configuración</h1>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">FX27</div>
            <div className="text-xs text-slate-400 tracking-wider">FUTURE EXPERIENCE 27</div>
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-3 gap-4 max-w-5xl mx-auto">
          {opciones.map((op) => {
            const Icono = op.icono;
            return (
              <button key={op.id} onClick={() => setSubModulo(op.id as SubModulo)} className="bg-white rounded-2xl p-6 text-center hover:shadow-xl hover:scale-[1.02] transition-all">
                <div className={`w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br ${op.color} flex items-center justify-center`}>
                  <Icono className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">{op.titulo}</h3>
                <p className="text-sm text-slate-500">{op.descripcion}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
