// ═══════════════════════════════════════════════════════════════════════════
// SERVICIO A CLIENTES MODULE - MÓDULO PRINCIPAL
// Incluye: Nueva Alta, Lista de Solicitudes, Revisión Juan, Confirmación Nancy
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ModuleTemplate } from './ModuleTemplate';
import { MODULE_IMAGES } from '../../assets/module-images';
import CrearSolicitudAlta from './CrearSolicitudAlta';
import RevisarSolicitudAlta from './RevisarSolicitudAlta';
import ConfirmarAltaNancy from './ConfirmarAltaNancy';
import {
  UserPlus, Users, FileText, CheckCircle2, Clock, AlertCircle,
  Search, Filter, RefreshCw, Loader2, Eye, ChevronRight,
  Building2, Calendar, Mail, ArrowLeft, Shield, CreditCard
} from 'lucide-react';

const supabaseUrl = 'https://fbxbsslhewchyibdoyzk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieGJzc2xoZXdjaHlpYmRveXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzczODEsImV4cCI6MjA3ODExMzM4MX0.Z8JPlg7hhKbA624QGHp2bKKTNtCD3WInQMO5twjl6a0';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Mapeo de estatus con colores
const ESTATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  'ENVIADA': { label: 'Enviada', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', icon: Mail },
  'PENDIENTE_CSR': { label: 'Pendiente CSR', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', icon: Clock },
  'PENDIENTE_COBRANZA': { label: 'Pendiente CxC', color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)', icon: CreditCard },
  'PENDIENTE_CONFIRMACION': { label: 'Por Confirmar', color: '#f97316', bg: 'rgba(249,115,22,0.15)', icon: Shield },
  'COMPLETADA': { label: 'Completada', color: '#22c55e', bg: 'rgba(34,197,94,0.15)', icon: CheckCircle2 },
  'RECHAZADA': { label: 'Rechazada', color: '#ef4444', bg: 'rgba(239,68,68,0.15)', icon: AlertCircle }
};

// Empresas facturadoras
const EMPRESAS = {
  'TROB': { nombre: 'TROB', color: '#001f4d' },
  'WE': { nombre: 'WExpress', color: '#059669' },
  'SHI': { nombre: 'Speedyhaul', color: '#7c3aed' },
  'TROB_USA': { nombre: 'TROB USA', color: '#dc2626' }
};

interface Props {
  onBack: () => void;
  userEmail?: string;
  userName?: string;
}

type Vista = 'hub' | 'lista' | 'revisar' | 'confirmar';

export function ServicioClientesModule({ onBack, userEmail, userName }: Props) {
  const [vista, setVista] = useState<Vista>('hub');
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtroEstatus, setFiltroEstatus] = useState<string>('');
  const [busqueda, setBusqueda] = useState('');
  const [showCrearModal, setShowCrearModal] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<string | null>(null);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  // Cargar solicitudes
  const cargarSolicitudes = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('alta_clientes')
        .select('*')
        .order('created_at', { ascending: false });

      if (filtroEstatus) {
        query = query.eq('estatus', filtroEstatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      setSolicitudes(data || []);
    } catch (err) {
      console.error('Error cargando solicitudes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (vista === 'lista') {
      cargarSolicitudes();
    }
  }, [vista, filtroEstatus]);

  // Filtrar por búsqueda
  const solicitudesFiltradas = solicitudes.filter(s => {
    if (!busqueda) return true;
    const term = busqueda.toLowerCase();
    return (
      s.razon_social?.toLowerCase().includes(term) ||
      s.rfc_mc?.toLowerCase().includes(term) ||
      s.correo_cliente?.toLowerCase().includes(term)
    );
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: HUB PRINCIPAL - ESTILO DASHBOARD
  // ═══════════════════════════════════════════════════════════════════════════
  const renderHub = () => {
    const botones = [
      {
        id: 'nueva-alta',
        nombre: 'Nueva Alta',
        icon: UserPlus,
        onClick: () => setShowCrearModal(true)
      },
      {
        id: 'solicitudes',
        nombre: 'Solicitudes',
        icon: FileText,
        onClick: () => { setFiltroEstatus(''); setVista('lista'); }
      },
      {
        id: 'pendientes-csr',
        nombre: 'Pendientes CSR',
        icon: Clock,
        onClick: () => { setFiltroEstatus('PENDIENTE_CSR'); setVista('lista'); }
      },
      {
        id: 'pendientes-cxc',
        nombre: 'Pendientes CxC',
        icon: CreditCard,
        onClick: () => { setFiltroEstatus('PENDIENTE_COBRANZA'); setVista('lista'); }
      },
      {
        id: 'por-confirmar',
        nombre: 'Por Confirmar',
        icon: Shield,
        onClick: () => { setFiltroEstatus('PENDIENTE_CONFIRMACION'); setVista('lista'); }
      },
      {
        id: 'completadas',
        nombre: 'Completadas',
        icon: CheckCircle2,
        onClick: () => { setFiltroEstatus('COMPLETADA'); setVista('lista'); }
      }
    ];

    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header estilo Dashboard */}
          <div className="text-center mb-10">
            <h2 
              style={{ 
                fontFamily: "'Exo 2', sans-serif",
                fontSize: '28px',
                fontWeight: 700,
                color: '#ffffff',
                marginBottom: '8px'
              }}
            >
              Servicio a Clientes
            </h2>
            <p 
              style={{ 
                fontFamily: "'Exo 2', sans-serif",
                fontSize: '14px',
                color: 'rgba(255,255,255,0.5)'
              }}
            >
              Gestión de altas y atención al cliente
            </p>
          </div>

          {/* Grid de botones estilo Dashboard */}
          <div className="grid grid-cols-3 gap-5">
            {botones.map(btn => {
              const Icon = btn.icon;
              const isHovered = hoveredBtn === btn.id;
              
              return (
                <button
                  key={btn.id}
                  onClick={btn.onClick}
                  onMouseEnter={() => setHoveredBtn(btn.id)}
                  onMouseLeave={() => setHoveredBtn(null)}
                  className="relative group"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '16px',
                    border: isHovered ? '1.5px solid rgba(254, 80, 0, 0.6)' : '1px solid rgba(255, 255, 255, 0.08)',
                    padding: '32px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                    boxShadow: isHovered 
                      ? '0 20px 40px rgba(254, 80, 0, 0.15), 0 0 30px rgba(254, 80, 0, 0.1)' 
                      : '0 4px 20px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  {/* Efecto de brillo en hover */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '16px',
                      background: isHovered 
                        ? 'linear-gradient(135deg, rgba(254, 80, 0, 0.1) 0%, transparent 50%, rgba(254, 80, 0, 0.05) 100%)'
                        : 'transparent',
                      transition: 'all 0.3s ease',
                      pointerEvents: 'none'
                    }}
                  />
                  
                  {/* Icono */}
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isHovered 
                        ? 'rgba(254, 80, 0, 0.15)' 
                        : 'rgba(255, 255, 255, 0.05)',
                      border: isHovered 
                        ? '1px solid rgba(254, 80, 0, 0.3)' 
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <Icon 
                      style={{ 
                        width: '28px', 
                        height: '28px',
                        color: isHovered ? '#fe5000' : 'rgba(255, 255, 255, 0.7)',
                        transition: 'all 0.3s ease'
                      }} 
                    />
                  </div>
                  
                  {/* Nombre */}
                  <span
                    style={{
                      fontFamily: "'Exo 2', sans-serif",
                      fontSize: '15px',
                      fontWeight: 600,
                      color: isHovered ? '#ffffff' : 'rgba(255, 255, 255, 0.85)',
                      textAlign: 'center',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {btn.nombre}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: LISTA DE SOLICITUDES
  // ═══════════════════════════════════════════════════════════════════════════
  const renderLista = () => (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => { setVista('hub'); setFiltroEstatus(''); }}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white/60" />
          </button>
          <div>
            <h2 
              style={{ 
                fontFamily: "'Exo 2', sans-serif",
                fontSize: '20px',
                fontWeight: 700,
                color: '#ffffff'
              }}
            >
              Solicitudes de Alta
            </h2>
            <p 
              style={{ 
                fontFamily: "'Exo 2', sans-serif",
                fontSize: '13px',
                color: 'rgba(255,255,255,0.5)'
              }}
            >
              {filtroEstatus ? ESTATUS_CONFIG[filtroEstatus]?.label : 'Todas las solicitudes'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar..."
              className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 text-sm w-64 outline-none focus:border-orange-500/50"
              style={{ fontFamily: "'Exo 2', sans-serif" }}
            />
          </div>

          {/* Filtro estatus */}
          <select
            value={filtroEstatus}
            onChange={e => setFiltroEstatus(e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none"
            style={{ fontFamily: "'Exo 2', sans-serif" }}
          >
            <option value="" style={{ background: '#1a1a2e' }}>Todos</option>
            {Object.entries(ESTATUS_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key} style={{ background: '#1a1a2e' }}>{cfg.label}</option>
            ))}
          </select>

          {/* Refrescar */}
          <button
            onClick={cargarSolicitudes}
            disabled={loading}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-5 h-5 text-white/60 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Nueva Alta */}
          <button
            onClick={() => setShowCrearModal(true)}
            className="px-4 py-2 rounded-lg flex items-center gap-2 font-medium text-white transition-all hover:scale-105"
            style={{ 
              background: 'linear-gradient(135deg, #fe5000 0%, #cc4000 100%)',
              fontFamily: "'Exo 2', sans-serif",
              fontSize: '14px'
            }}
          >
            <UserPlus className="w-4 h-4" />
            Nueva Alta
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div 
        className="rounded-xl border overflow-hidden"
        style={{ 
          background: 'rgba(10, 22, 40, 0.95)',
          borderColor: 'rgba(255,255,255,0.1)'
        }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        ) : solicitudesFiltradas.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p style={{ fontFamily: "'Exo 2', sans-serif", color: 'rgba(255,255,255,0.5)' }}>
              No hay solicitudes
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th className="text-left px-4 py-3" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cliente</th>
                <th className="text-left px-4 py-3" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>RFC</th>
                <th className="text-left px-4 py-3" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Empresa</th>
                <th className="text-left px-4 py-3" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estatus</th>
                <th className="text-left px-4 py-3" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fecha</th>
                <th className="text-left px-4 py-3" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {solicitudesFiltradas.map(sol => {
                const estatus = ESTATUS_CONFIG[sol.estatus] || ESTATUS_CONFIG['ENVIADA'];
                const EstatusIcon = estatus.icon;
                const empresa = EMPRESAS[sol.empresa_facturadora as keyof typeof EMPRESAS];

                return (
                  <tr 
                    key={sol.id} 
                    className="hover:bg-white/5 transition-colors"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', fontWeight: 500, color: '#fff' }}>
                          {sol.razon_social || 'Sin nombre'}
                        </span>
                        <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.4)', display: 'block' }}>
                          {sol.correo_cliente}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span style={{ fontFamily: "'Roboto Mono', monospace", fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
                        {sol.rfc_mc || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {empresa ? (
                        <span
                          className="px-2 py-1 rounded text-xs font-medium"
                          style={{ 
                            background: `${empresa.color}20`, 
                            color: empresa.color,
                            fontFamily: "'Exo 2', sans-serif"
                          }}
                        >
                          {empresa.nombre}
                        </span>
                      ) : (
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 w-fit"
                        style={{ 
                          background: estatus.bg, 
                          color: estatus.color,
                          fontFamily: "'Exo 2', sans-serif"
                        }}
                      >
                        <EstatusIcon className="w-3 h-3" />
                        {estatus.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                        {sol.created_at ? new Date(sol.created_at).toLocaleDateString('es-MX') : '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          setSolicitudSeleccionada(sol.id);
                          if (sol.estatus === 'PENDIENTE_CSR' || sol.estatus === 'PENDIENTE_COBRANZA') {
                            setVista('revisar');
                          } else if (sol.estatus === 'PENDIENTE_CONFIRMACION') {
                            setVista('confirmar');
                          } else {
                            setVista('revisar');
                          }
                        }}
                        className="p-2 hover:bg-orange-500/20 rounded-lg transition-colors group"
                      >
                        <Eye className="w-4 h-4 text-white/40 group-hover:text-orange-400 transition-colors" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: REVISAR SOLICITUD (JUAN)
  // ═══════════════════════════════════════════════════════════════════════════
  const renderRevisar = () => (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => { setVista('lista'); setSolicitudSeleccionada(null); }}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white/60" />
        </button>
        <div>
          <h2 style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '20px', fontWeight: 700, color: '#ffffff' }}>
            Revisar Solicitud
          </h2>
          <p style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
            Validar cliente, asignar CSR y crédito
          </p>
        </div>
      </div>

      {solicitudSeleccionada && (
        <RevisarSolicitudAlta
          solicitudId={solicitudSeleccionada}
          onUpdated={() => {
            setVista('lista');
            setSolicitudSeleccionada(null);
            cargarSolicitudes();
          }}
        />
      )}
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: CONFIRMAR ALTA (NANCY)
  // ═══════════════════════════════════════════════════════════════════════════
  const renderConfirmar = () => (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => { setVista('lista'); setSolicitudSeleccionada(null); }}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white/60" />
        </button>
        <div>
          <h2 style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '20px', fontWeight: 700, color: '#ffffff' }}>
            Confirmar Alta
          </h2>
          <p style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
            Revisión final y confirmación al cliente
          </p>
        </div>
      </div>

      {solicitudSeleccionada && (
        <ConfirmarAltaNancy
          solicitudId={solicitudSeleccionada}
          onConfirmed={() => {
            setVista('lista');
            setSolicitudSeleccionada(null);
            cargarSolicitudes();
          }}
        />
      )}
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER PRINCIPAL
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <ModuleTemplate
      title="Servicio a Clientes"
      onBack={onBack}
      headerImage={MODULE_IMAGES.SERVICIO_CLIENTES}
    >
      <div className="h-full overflow-auto">
        {vista === 'hub' && renderHub()}
        {vista === 'lista' && renderLista()}
        {vista === 'revisar' && renderRevisar()}
        {vista === 'confirmar' && renderConfirmar()}
      </div>

      {/* Modal Crear Solicitud */}
      {showCrearModal && (
        <CrearSolicitudAlta
          usuarioCreador={userEmail || userName || 'Sistema'}
          onClose={() => setShowCrearModal(false)}
          onCreated={(id) => {
            setShowCrearModal(false);
            cargarSolicitudes();
          }}
        />
      )}
    </ModuleTemplate>
  );
}

export default ServicioClientesModule;
