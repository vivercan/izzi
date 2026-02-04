// ═══════════════════════════════════════════════════════════════════════════
// SERVICIO A CLIENTES MODULE - ESTILO DASHBOARD EXACTO
// Versión: 3.0 - 04/Feb/2026 - Flujo paralelo EN_REVISION
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ModuleTemplate } from './ModuleTemplate';
import { MODULE_IMAGES } from '../../assets/module-images';
import CrearSolicitudAlta from './CrearSolicitudAlta';
import RevisarSolicitudAlta from './RevisarSolicitudAlta';
import ConfirmarAltaNancy from './ConfirmarAltaNancy';
import { AsignarCxC } from './AsignarCxC';
import {
  UserPlus, FileText, CheckCircle2, Clock, AlertCircle,
  Search, RefreshCw, Loader2, Eye, ArrowLeft, Shield, CreditCard, Mail,
  Edit2, Trash2, X, AlertTriangle
} from 'lucide-react';

const supabaseUrl = 'https://fbxbsslhewchyibdoyzk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieGJzc2xoZXdjaHlpYmRveXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzczODEsImV4cCI6MjA3ODExMzM4MX0.Z8JPlg7hhKbA624QGHp2bKKTNtCD3WInQMO5twjl6a0';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const ESTATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  'ENVIADA': { label: 'Enviada', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', icon: Mail },
  'EN_REVISION': { label: 'En Revisión', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', icon: Search },
  'PENDIENTE_CSR': { label: 'Pendiente CSR', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', icon: Clock },
  'PENDIENTE_COBRANZA': { label: 'Pendiente CxC', color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)', icon: CreditCard },
  'PENDIENTE_CONFIRMACION': { label: 'Por Confirmar', color: '#f97316', bg: 'rgba(249,115,22,0.15)', icon: Shield },
  'COMPLETADA': { label: 'Completada', color: '#22c55e', bg: 'rgba(34,197,94,0.15)', icon: CheckCircle2 },
  'RECHAZADA': { label: 'Rechazada', color: '#ef4444', bg: 'rgba(239,68,68,0.15)', icon: AlertCircle }
};

const EMPRESAS = {
  'TROB': { nombre: 'TROB TRANSPORTES', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.2)' },
  'WE': { nombre: 'WEXPRESS', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.2)' },
  'SHI': { nombre: 'SPEEDYHAUL INTERNATIONAL', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.2)' },
  'TROB_USA': { nombre: 'TROB USA LLC', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.2)' }
};

interface Props {
  onBack: () => void;
  userEmail?: string;
  userName?: string;
}

type Vista = 'hub' | 'lista' | 'revisar' | 'asignar_cxc' | 'confirmar';

export function ServicioClientesModule({ onBack, userEmail, userName }: Props) {
  const [vista, setVista] = useState<Vista>('hub');
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtroEstatus, setFiltroEstatus] = useState<string>('');
  const [busqueda, setBusqueda] = useState('');
  const [showCrearModal, setShowCrearModal] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<string | null>(null);

  // Admin y modales
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [currentUserName, setCurrentUserName] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showDeleteMultipleModal, setShowDeleteMultipleModal] = useState(false);

  // Verificar si es admin y obtener datos del usuario
  useEffect(() => {
    const userData = localStorage.getItem('fx27-session');
    if (userData) {
      const user = JSON.parse(userData);
      const adminEmails = [
        'juan.viveros@trob.com.mx',
        'jennifer.sanchez@trob.com.mx'
      ];
      const email = (user.email || userEmail || '').toLowerCase();
      const name = user.name || userName || '';
      const userRole = (user.role || '').toLowerCase();
      
      setCurrentUserEmail(email);
      setCurrentUserName(name);
      setIsAdmin(
        adminEmails.includes(email) ||
        userRole === 'admin' ||
        userRole === 'administrador'
      );
    }
  }, [userEmail, userName]);

  // CORREGIDO: Filtrar por usuario si no es admin
  const cargarSolicitudes = async () => {
    setLoading(true);
    try {
      let query = supabase.from('alta_clientes').select('*').order('created_at', { ascending: false });
      
      // Filtrar por estatus si hay filtro activo
      if (filtroEstatus) query = query.eq('estatus', filtroEstatus);
      
      // NUEVO: Si NO es admin, filtrar solo las que creó el usuario
      if (!isAdmin && (currentUserEmail || currentUserName)) {
        // Filtrar por email O por nombre del usuario creador
        query = query.or(`enviado_por.ilike.%${currentUserEmail}%,enviado_por.ilike.%${currentUserName}%`);
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

  // Eliminar solicitud
  const eliminarSolicitud = async (id: string) => {
    if (deleteConfirmText !== 'DELETE') {
      alert('Escriba DELETE para confirmar');
      return;
    }

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('alta_clientes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setShowDeleteModal(null);
      setDeleteConfirmText('');
      cargarSolicitudes();
    } catch (err) {
      console.error('Error eliminando:', err);
      alert('Error al eliminar la solicitud');
    } finally {
      setDeleting(false);
    }
  };

  // Eliminar múltiples solicitudes
  const eliminarMultiples = async () => {
    if (deleteConfirmText !== 'DELETE') {
      alert('Escriba DELETE para confirmar');
      return;
    }

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('alta_clientes')
        .delete()
        .in('id', selectedIds);

      if (error) throw error;

      setShowDeleteMultipleModal(false);
      setDeleteConfirmText('');
      setSelectedIds([]);
      cargarSolicitudes();
    } catch (err) {
      console.error('Error eliminando:', err);
      alert('Error al eliminar las solicitudes');
    } finally {
      setDeleting(false);
    }
  };

  // Toggle selección
  const toggleSeleccion = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSeleccionTodos = () => {
    if (selectedIds.length === solicitudesFiltradas.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(solicitudesFiltradas.map(s => s.id));
    }
  };

  useEffect(() => {
    if (vista === 'lista') cargarSolicitudes();
  }, [vista, filtroEstatus, isAdmin, currentUserEmail, currentUserName]);

  const solicitudesFiltradas = solicitudes.filter(s => {
    if (!busqueda) return true;
    const term = busqueda.toLowerCase();
    return s.razon_social?.toLowerCase().includes(term) ||
           s.nombre_cliente?.toLowerCase().includes(term) ||
           s.rfc_mc?.toLowerCase().includes(term) ||
           s.email_cliente?.toLowerCase().includes(term);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: HUB - ESTILO DASHBOARD EXACTO (SIN ModuleTemplate)
  // ═══════════════════════════════════════════════════════════════════════════
  const renderHub = () => {
    const botones = [
      { id: 'nueva-alta', nombre: 'Nueva Alta', icon: UserPlus, onClick: () => setShowCrearModal(true) },
      { id: 'solicitudes', nombre: 'Solicitudes', icon: FileText, onClick: () => { setFiltroEstatus(''); setVista('lista'); } },
      { id: 'en-revision', nombre: 'En Revisión', icon: Search, onClick: () => { setFiltroEstatus('EN_REVISION'); setVista('lista'); } },
      { id: 'por-confirmar', nombre: 'Por Confirmar', icon: Shield, onClick: () => { setFiltroEstatus('PENDIENTE_CONFIRMACION'); setVista('lista'); } },
      { id: 'completadas', nombre: 'Completadas', icon: CheckCircle2, onClick: () => { setFiltroEstatus('COMPLETADA'); setVista('lista'); } }
    ];

    return (
      <div className="relative w-full h-screen overflow-hidden">
        {/* Background - Gradiente AZUL ELÉCTRICO igual al Dashboard */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #001f4d 0%, #003d7a 25%, #0066cc 50%, #1a8fff 75%, #4da6ff 100%)',
          }}
        />
        {/* Overlay oscuro */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.25) 0%, rgba(0, 0, 0, 0.15) 50%, rgba(0, 0, 0, 0.25) 100%)',
          }}
        />

        {/* Header con botón regresar y logo */}
        <div
          className="absolute top-0 left-0 right-0 z-40"
          style={{
            height: '80px',
            background: 'linear-gradient(180deg, rgba(15, 25, 45, 0.92) 0%, rgba(12, 20, 38, 0.88) 50%, rgba(10, 18, 32, 0.75) 100%)',
            backdropFilter: 'blur(20px) saturate(140%)',
            borderBottom: '1px solid rgba(80, 120, 180, 0.15)',
          }}
        >
          <div className="h-full flex items-center justify-between px-8">
            {/* Botón regresar */}
            <button
              onClick={onBack}
              className="flex items-center gap-3 transition-all duration-300"
              style={{
                background: '#fe5000',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(254, 80, 0, 0.4)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#cc4000';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#fe5000';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>

            {/* Título */}
            <h1
              style={{
                fontFamily: "'Exo 2', sans-serif",
                fontSize: '22px',
                fontWeight: 700,
                color: '#ffffff',
                marginLeft: '16px',
                flex: 1
              }}
            >
              Clientes
            </h1>

            {/* Logo FX27 */}
            <div className="flex flex-col items-end">
              <div
                className="text-[48px] font-black leading-none tracking-tight"
                style={{
                  fontFamily: 'Exo 2, sans-serif',
                  background: 'linear-gradient(135deg, #E8EEF4 0%, #B5C4D8 30%, #D8DFE8 55%, #9FB0C5 80%, #D0D9E4 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  filter: 'drop-shadow(2px 0 4px rgba(160, 180, 210, 0.2))',
                }}
              >
                FX27
              </div>
              <div
                className="text-[9px] tracking-[0.15em] uppercase"
                style={{
                  fontFamily: 'Exo 2, sans-serif',
                  color: 'rgba(240, 160, 80, 0.75)',
                  filter: 'blur(0.5px) drop-shadow(0 0 8px rgba(240, 160, 80, 0.6))',
                }}
              >
                FUTURE EXPERIENCE 27
              </div>
            </div>
          </div>
        </div>

        {/* Grid de botones */}
        <div className="relative z-10 w-full h-full px-12" style={{ paddingTop: '120px' }}>
          {/* Título */}
          <h2
            style={{
              fontFamily: "'Exo 2', sans-serif",
              fontSize: '24px',
              fontWeight: 600,
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: '24px',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
            }}
          >
            Administración de Clientes
          </h2>

          <div className="flex gap-5 flex-wrap" style={{ maxWidth: '1200px' }}>
            {botones.map(btn => {
              const Icon = btn.icon;
              return (
                <button
                  key={btn.id}
                  onClick={btn.onClick}
                  className="group relative flex flex-col items-center justify-center gap-3 p-5 transition-all duration-300"
                  style={{
                    width: '180px',
                    height: '180px',
                    background: 'linear-gradient(155deg, rgba(18, 32, 58, 0.96) 0%, rgba(12, 22, 42, 0.98) 35%, rgba(8, 16, 32, 1) 70%, rgba(6, 12, 24, 1) 100%)',
                    border: '2px solid transparent',
                    backgroundImage: 'linear-gradient(155deg, rgba(18, 32, 58, 0.96) 0%, rgba(12, 22, 42, 0.98) 35%, rgba(8, 16, 32, 1) 70%, rgba(6, 12, 24, 1) 100%), linear-gradient(135deg, rgba(180, 100, 50, 0.28) 0%, rgba(60, 90, 140, 0.25) 50%, rgba(180, 100, 50, 0.28) 100%)',
                    backgroundOrigin: 'border-box',
                    backgroundClip: 'padding-box, border-box',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3), 0 6px 16px rgba(0, 0, 0, 0.5), inset -2px -2px 4px rgba(0, 0, 0, 0.2)',
                    borderRadius: '10px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-6px)';
                    e.currentTarget.style.backgroundImage = 'linear-gradient(155deg, rgba(28, 48, 82, 1) 0%, rgba(20, 35, 62, 1) 35%, rgba(14, 24, 45, 1) 70%, rgba(10, 18, 35, 1) 100%), linear-gradient(135deg, rgba(240, 160, 80, 0.65) 0%, rgba(220, 140, 70, 0.6) 25%, rgba(70, 110, 170, 0.4) 50%, rgba(220, 140, 70, 0.6) 75%, rgba(240, 160, 80, 0.65) 100%)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.4), 0 10px 24px rgba(0, 0, 0, 0.6), 0 0 30px rgba(240, 160, 80, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.backgroundImage = 'linear-gradient(155deg, rgba(18, 32, 58, 0.96) 0%, rgba(12, 22, 42, 0.98) 35%, rgba(8, 16, 32, 1) 70%, rgba(6, 12, 24, 1) 100%), linear-gradient(135deg, rgba(180, 100, 50, 0.28) 0%, rgba(60, 90, 140, 0.25) 50%, rgba(180, 100, 50, 0.28) 100%)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.3), 0 6px 16px rgba(0, 0, 0, 0.5), inset -2px -2px 4px rgba(0, 0, 0, 0.2)';
                  }}
                >
                  {/* Highlight superior */}
                  <div
                    className="absolute top-0 left-0 right-0 h-[35%] opacity-30 group-hover:opacity-50 transition-opacity duration-300 pointer-events-none"
                    style={{
                      background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, transparent 100%)',
                      borderTopLeftRadius: '10px',
                      borderTopRightRadius: '10px',
                    }}
                  />

                  {/* Línea superior naranja en hover */}
                  <div
                    className="absolute top-0 left-0 right-0 h-[3px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: 'linear-gradient(90deg, transparent 0%, rgba(240, 160, 80, 0.3) 15%, rgba(240, 160, 80, 0.85) 50%, rgba(240, 160, 80, 0.3) 85%, transparent 100%)',
                      boxShadow: '0 2px 12px rgba(240, 160, 80, 0.5), 0 0 20px rgba(240, 160, 80, 0.3)',
                      borderTopLeftRadius: '10px',
                      borderTopRightRadius: '10px',
                    }}
                  />

                  {/* Inner glow naranja */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: 'radial-gradient(ellipse at 50% 0%, rgba(240, 160, 80, 0.15) 0%, rgba(220, 140, 70, 0.08) 40%, transparent 70%)',
                      pointerEvents: 'none',
                      borderRadius: '10px',
                    }}
                  />

                  {/* Ícono */}
                  <Icon
                    className="w-20 h-20 relative z-10 transition-all duration-300 group-hover:scale-110"
                    style={{
                      color: 'rgba(255, 255, 255, 0.95)',
                      strokeWidth: 1.8,
                      filter: 'drop-shadow(0 4px 10px rgba(0, 0, 0, 0.6)) drop-shadow(0 0 14px rgba(255, 255, 255, 0.15))',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'rgba(240, 160, 80, 1)';
                      e.currentTarget.style.filter = 'drop-shadow(0 4px 10px rgba(0, 0, 0, 0.6)) drop-shadow(0 0 16px rgba(240, 160, 80, 0.6)) drop-shadow(0 0 24px rgba(240, 160, 80, 0.5))';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'rgba(255, 255, 255, 0.95)';
                      e.currentTarget.style.filter = 'drop-shadow(0 4px 10px rgba(0, 0, 0, 0.6)) drop-shadow(0 0 14px rgba(255, 255, 255, 0.15))';
                    }}
                  />

                  {/* Texto */}
                  <span
                    className="text-center relative z-10 transition-all duration-300"
                    style={{
                      fontFamily: "'Exo 2', sans-serif",
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'rgba(255, 255, 255, 0.9)',
                      textShadow: '0 2px 8px rgba(0, 0, 0, 0.6), 0 1px 3px rgba(0, 0, 0, 0.8)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'rgba(240, 160, 80, 1)';
                      e.currentTarget.style.textShadow = '0 2px 8px rgba(0, 0, 0, 0.6), 0 0 12px rgba(240, 160, 80, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
                      e.currentTarget.style.textShadow = '0 2px 8px rgba(0, 0, 0, 0.6), 0 1px 3px rgba(0, 0, 0, 0.8)';
                    }}
                  >
                    {btn.nombre}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Crear Solicitud */}
        {showCrearModal && (
          <CrearSolicitudAlta
            usuarioCreador={currentUserEmail || currentUserName || userEmail || userName || 'Sistema'}
            onClose={() => setShowCrearModal(false)}
            onCreated={(id) => {
              setShowCrearModal(false);
              setVista('lista');
              cargarSolicitudes();
            }}
          />
        )}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: LISTA DE SOLICITUDES (USA ModuleTemplate)
  // ═══════════════════════════════════════════════════════════════════════════
  const renderLista = () => (
    <ModuleTemplate title="Clientes" onBack={() => { setVista('hub'); setFiltroEstatus(''); }} headerImage={MODULE_IMAGES.SERVICIO_CLIENTES}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '20px', fontWeight: 700, color: '#ffffff' }}>
              {isAdmin ? 'Todas las Solicitudes' : 'Mis Solicitudes de Alta'}
            </h2>
            <p style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
              {filtroEstatus ? ESTATUS_CONFIG[filtroEstatus]?.label : (isAdmin ? 'Todas las solicitudes' : 'Solo las que yo creé')}
            </p>
          </div>

          <div className="flex items-center gap-3">
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

            <button onClick={cargarSolicitudes} disabled={loading} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <RefreshCw className={`w-5 h-5 text-white/60 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Botón borrar seleccionados - Solo Admin */}
            {isAdmin && selectedIds.length > 0 && (
              <button
                onClick={() => setShowDeleteMultipleModal(true)}
                className="px-4 py-2 rounded-lg flex items-center gap-2 font-medium text-white transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', fontFamily: "'Exo 2', sans-serif", fontSize: '14px' }}
              >
                <Trash2 className="w-4 h-4" />
                Borrar ({selectedIds.length})
              </button>
            )}

            <button
              onClick={() => setShowCrearModal(true)}
              className="px-4 py-2 rounded-lg flex items-center gap-2 font-medium text-white transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #fe5000 0%, #cc4000 100%)', fontFamily: "'Exo 2', sans-serif", fontSize: '14px' }}
            >
              <UserPlus className="w-4 h-4" />
              Nueva Alta
            </button>
          </div>
        </div>

        <div className="rounded-xl border overflow-hidden" style={{ background: 'rgba(10, 22, 40, 0.95)', borderColor: 'rgba(255,255,255,0.1)' }}>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
          ) : solicitudesFiltradas.length === 0 ? (
            <div className="text-center py-20">
              <FileText className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p style={{ fontFamily: "'Exo 2', sans-serif", color: 'rgba(255,255,255,0.5)' }}>
                {isAdmin ? 'No hay solicitudes' : 'No has creado solicitudes aún'}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  {/* Checkbox seleccionar todos - Solo Admin */}
                  {isAdmin && (
                    <th className="text-left px-4 py-3 w-12">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === solicitudesFiltradas.length && solicitudesFiltradas.length > 0}
                        onChange={toggleSeleccionTodos}
                        className="w-4 h-4 rounded cursor-pointer"
                        style={{ accentColor: '#fe5000' }}
                      />
                    </th>
                  )}
                  <th className="text-left px-4 py-3" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Cliente</th>
                  <th className="text-left px-4 py-3" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>RFC</th>
                  <th className="text-left px-4 py-3" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Empresa</th>
                  <th className="text-left px-4 py-3" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Estatus</th>
                  <th className="text-left px-4 py-3" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Fecha</th>
                  <th className="text-left px-4 py-3" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {solicitudesFiltradas.map(sol => {
                  const estatus = ESTATUS_CONFIG[sol.estatus] || ESTATUS_CONFIG['ENVIADA'];
                  const EstatusIcon = estatus.icon;
                  const empresa = EMPRESAS[sol.giro as keyof typeof EMPRESAS];

                  return (
                    <tr key={sol.id} className="hover:bg-white/5 transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      {/* Checkbox selección - Solo Admin */}
                      {isAdmin && (
                        <td className="px-4 py-3 w-12">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(sol.id)}
                            onChange={() => toggleSeleccion(sol.id)}
                            className="w-4 h-4 rounded cursor-pointer"
                            style={{ accentColor: '#fe5000' }}
                          />
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <div>
                          <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', fontWeight: 500, color: '#fff' }}>{sol.razon_social || 'Sin nombre'}</span>
                          <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'block' }}>{sol.nombre_cliente || ''}</span>
                          <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.35)', display: 'block' }}>{sol.email_cliente}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span style={{ fontFamily: "'Roboto Mono', monospace", fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>{sol.rfc_mc || '-'}</span>
                      </td>
                      <td className="px-4 py-3">
                        {empresa ? (
                          <span
                            className="px-3 py-1 rounded text-xs font-semibold"
                            style={{
                              background: empresa.bg,
                              color: empresa.color,
                              border: `1px solid ${empresa.color}40`,
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
                        <span className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 w-fit" style={{ background: estatus.bg, color: estatus.color, fontFamily: "'Exo 2', sans-serif" }}>
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
                        <div className="flex items-center gap-1">
                          {/* Ver */}
                          <button
                            onClick={() => {
                              setSolicitudSeleccionada(sol.id);
                              if (sol.estatus === 'EN_REVISION' || sol.estatus === 'PENDIENTE_CSR') setVista('revisar'); else if (sol.estatus === 'PENDIENTE_COBRANZA') setVista('asignar_cxc');
                              else if (sol.estatus === 'PENDIENTE_CONFIRMACION') setVista('confirmar');
                              else setVista('revisar');
                            }}
                            className="p-2 hover:bg-orange-500/20 rounded-lg transition-colors group"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4 text-white/40 group-hover:text-orange-400 transition-colors" />
                          </button>

                          {/* Editar - Solo Admin */}
                          {isAdmin && (
                            <button
                              onClick={() => {
                                setSolicitudSeleccionada(sol.id);
                                setVista('revisar');
                              }}
                              className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors group"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4 text-white/40 group-hover:text-blue-400 transition-colors" />
                            </button>
                          )}

                          {/* Borrar - Solo Admin */}
                          {isAdmin && (
                            <button
                              onClick={() => setShowDeleteModal(sol.id)}
                              className="p-2 hover:bg-red-500/20 rounded-lg transition-colors group"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4 text-white/40 group-hover:text-red-400 transition-colors" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {showCrearModal && (
          <CrearSolicitudAlta
            usuarioCreador={currentUserEmail || currentUserName || userEmail || userName || 'Sistema'}
            onClose={() => setShowCrearModal(false)}
            onCreated={() => { setShowCrearModal(false); cargarSolicitudes(); }}
          />
        )}

        {/* Modal Confirmar Borrado */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0f1729] rounded-2xl border border-red-500/30 p-6 w-full max-w-md">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Eliminar Solicitud</h3>
                  <p className="text-sm text-red-400">Esta acción no se puede deshacer</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-white/70 mb-4">
                  ¿Está seguro que desea eliminar esta solicitud? Se borrarán todos los datos y documentos asociados.
                </p>
                <label className="block text-sm font-medium text-white/50 mb-2">
                  Escriba <span className="text-red-400 font-bold">DELETE</span> para confirmar:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-white outline-none focus:border-red-500 font-mono text-center text-lg"
                  style={{ letterSpacing: '0.2em' }}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(null);
                    setDeleteConfirmText('');
                  }}
                  className="flex-1 py-3 rounded-xl bg-white/10 text-white/70 font-medium hover:bg-white/20 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => eliminarSolicitud(showDeleteModal)}
                  disabled={deleteConfirmText !== 'DELETE' || deleting}
                  className="flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: deleteConfirmText === 'DELETE'
                      ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                      : 'rgba(255,255,255,0.1)',
                    color: deleteConfirmText === 'DELETE' ? '#fff' : 'rgba(255,255,255,0.3)'
                  }}
                >
                  {deleting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Trash2 className="w-5 h-5" />
                  )}
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Confirmar Borrado Múltiple */}
        {showDeleteMultipleModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0f1729] rounded-2xl border border-red-500/30 p-6 w-full max-w-md">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Eliminar {selectedIds.length} Solicitudes</h3>
                  <p className="text-sm text-red-400">Esta acción no se puede deshacer</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-white/70 mb-4">
                  ¿Está seguro que desea eliminar <span className="text-red-400 font-bold">{selectedIds.length}</span> solicitudes? Se borrarán todos los datos y documentos asociados.
                </p>
                <label className="block text-sm font-medium text-white/50 mb-2">
                  Escriba <span className="text-red-400 font-bold">DELETE</span> para confirmar:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-white outline-none focus:border-red-500 font-mono text-center text-lg"
                  style={{ letterSpacing: '0.2em' }}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteMultipleModal(false);
                    setDeleteConfirmText('');
                  }}
                  className="flex-1 py-3 rounded-xl bg-white/10 text-white/70 font-medium hover:bg-white/20 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={eliminarMultiples}
                  disabled={deleteConfirmText !== 'DELETE' || deleting}
                  className="flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: deleteConfirmText === 'DELETE'
                      ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                      : 'rgba(255,255,255,0.1)',
                    color: deleteConfirmText === 'DELETE' ? '#fff' : 'rgba(255,255,255,0.3)'
                  }}
                >
                  {deleting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Trash2 className="w-5 h-5" />
                  )}
                  Eliminar {selectedIds.length}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ModuleTemplate>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: REVISAR SOLICITUD
  // ═══════════════════════════════════════════════════════════════════════════
  const renderRevisar = () => (
    <ModuleTemplate title="Revisar Solicitud" onBack={() => { setVista('lista'); setSolicitudSeleccionada(null); }} headerImage={MODULE_IMAGES.SERVICIO_CLIENTES}>
      <div className="p-6">
        {solicitudSeleccionada && (
          <RevisarSolicitudAlta
            solicitudId={solicitudSeleccionada}
            onUpdated={() => { setVista('lista'); setSolicitudSeleccionada(null); cargarSolicitudes(); }}
          />
        )}
      </div>
    </ModuleTemplate>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: CONFIRMAR ALTA
  // ═══════════════════════════════════════════════════════════════════════════
  const renderAsignarCxC = () => (
    <ModuleTemplate title="Asignar Cobranza" onBack={() => { setVista('lista'); setSolicitudSeleccionada(null); }} headerImage={MODULE_IMAGES.SERVICIO_CLIENTES}>
      <div className="p-6">
        <AsignarCxC
          onBack={() => { setVista('lista'); setSolicitudSeleccionada(null); }}
          onAssigned={() => { setVista('lista'); setSolicitudSeleccionada(null); cargarSolicitudes(); }}
        />
      </div>
    </ModuleTemplate>
  );

  const renderConfirmar = () => (
    <ModuleTemplate title="Confirmar Alta" onBack={() => { setVista('lista'); setSolicitudSeleccionada(null); }} headerImage={MODULE_IMAGES.SERVICIO_CLIENTES}>
      <div className="p-6">
        {solicitudSeleccionada && (
          <ConfirmarAltaNancy
            solicitudId={solicitudSeleccionada}
            onConfirmed={() => { setVista('lista'); setSolicitudSeleccionada(null); cargarSolicitudes(); }}
          />
        )}
      </div>
    </ModuleTemplate>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER PRINCIPAL
  // ═══════════════════════════════════════════════════════════════════════════
  if (vista === 'hub') return renderHub();
  if (vista === 'lista') return renderLista();
  if (vista === 'revisar') return renderRevisar();
  if (vista === 'asignar_cxc') return renderAsignarCxC();
  if (vista === 'confirmar') return renderConfirmar();
  return renderHub();
}

export default ServicioClientesModule;
