'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, Database, FolderOpen, Target, Lock, UserPlus } from 'lucide-react';
import SalesHorizonModule from './SalesHorizonModule';
import ConfiguracionAltaClientes from './ConfiguracionAltaClientes';

interface Props { onBack: () => void; }

type SubModulo = null | 'usuarios' | 'backup' | 'archivos' | 'sales_horizon' | 'proceso_alta';

export function ConfiguracionModule({ onBack }: Props) {
  const [subModulo, setSubModulo] = useState<SubModulo>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('fx27_user');
    if (userData) {
      const user = JSON.parse(userData);
      // Administradores: Juan Viveros, Jennifer Sánchez
      const admins = ['juan.viveros', 'jennifer.sanchez', 'admin', 'jviveros', 'jsanchez'];
      setIsAdmin(admins.includes(user.username?.toLowerCase()) || user.role === 'admin' || user.rol === 'administrador');
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: Sales Horizon (Solo Admins)
  // ═══════════════════════════════════════════════════════════════════════════
  if (subModulo === 'sales_horizon') {
    if (!isAdmin) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
          <div className="bg-slate-800/50 rounded-xl p-8 border border-red-500/30 text-center max-w-md">
            <Lock className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Acceso Restringido</h2>
            <p className="text-slate-400 mb-4">Solo los administradores pueden acceder a Sales Horizon.</p>
            <button onClick={() => setSubModulo(null)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white">
              Volver
            </button>
          </div>
        </div>
      );
    }
    return <SalesHorizonModule onBack={() => setSubModulo(null)} />;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: Proceso de Alta (Solo Admins)
  // ═══════════════════════════════════════════════════════════════════════════
  if (subModulo === 'proceso_alta') {
    if (!isAdmin) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
          <div className="bg-slate-800/50 rounded-xl p-8 border border-red-500/30 text-center max-w-md">
            <Lock className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Acceso Restringido</h2>
            <p className="text-slate-400 mb-4">Solo los administradores pueden configurar el Proceso de Alta.</p>
            <button onClick={() => setSubModulo(null)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white">
              Volver
            </button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Header */}
        <div className="bg-slate-800/50 border-b border-slate-700/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setSubModulo(null)} className="p-2 bg-orange-500 hover:bg-orange-600 rounded-full transition-colors">
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <h1 className="text-2xl font-bold text-white">Proceso de Alta</h1>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">FX27</div>
              <div className="text-xs text-slate-400 tracking-wider">FUTURE EXPERIENCE 27</div>
            </div>
          </div>
        </div>
        
        {/* Contenido */}
        <div className="p-6">
          <ConfiguracionAltaClientes />
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // OPCIONES DEL MENÚ
  // ═══════════════════════════════════════════════════════════════════════════
  const opciones = [
    { id: 'usuarios', titulo: 'Usuarios', descripcion: 'Gestionar usuarios y permisos', icono: Users, color: 'from-blue-500 to-blue-600', adminOnly: false },
    { id: 'backup', titulo: 'Backup', descripcion: 'Respaldo de leads eliminados', icono: Database, color: 'from-emerald-500 to-emerald-600', adminOnly: false },
    { id: 'archivos', titulo: 'Archivos', descripcion: 'Cotizaciones y contratos', icono: FolderOpen, color: 'from-purple-500 to-purple-600', adminOnly: false },
    { id: 'sales_horizon', titulo: 'Sales Horizon', descripcion: isAdmin ? 'Presupuesto y metas 2026' : '🔒 Solo Administradores', icono: Target, color: isAdmin ? 'from-orange-500 to-amber-600' : 'from-slate-500 to-slate-600', adminOnly: true },
    { id: 'proceso_alta', titulo: 'Proceso de Alta', descripcion: isAdmin ? 'Configurar CSR, correos, crédito' : '🔒 Solo Administradores', icono: UserPlus, color: isAdmin ? 'from-cyan-500 to-teal-600' : 'from-slate-500 to-slate-600', adminOnly: true },
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
            const disabled = op.adminOnly && !isAdmin;
            return (
              <button 
                key={op.id} 
                onClick={() => !disabled && setSubModulo(op.id as SubModulo)} 
                className={`bg-white rounded-2xl p-6 text-center transition-all ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-xl hover:scale-[1.02]'}`}
              >
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
