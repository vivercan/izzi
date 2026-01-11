// ═══════════════════════════════════════════════════════════════════════════
// SERVICIO CLIENTES MODULE - Hub principal de Alta de Clientes
// CORREGIDO: Integra AsignarCxC al flujo completo + Botón IA
// Versión: 2.0 - 10/Ene/2026
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  UserPlus, Clock, CheckCircle2, AlertCircle, Search, Filter,
  Building2, Calendar, User, CreditCard, FileText, ChevronRight,
  RefreshCw, Loader2, X, Users, DollarSign, Sparkles, Bot
} from 'lucide-react';

// Componentes del flujo
import CrearSolicitudAlta from './CrearSolicitudAlta';
import RevisarSolicitudAlta from './RevisarSolicitudAlta';
import { AsignarCxC } from './AsignarCxC';
import ConfirmarAltaNancy from './ConfirmarAltaNancy';

const supabaseUrl = 'https://fbxbsslhewchyibdoyzk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieGJzc2xoZXdjaHlpYmRveXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzczODEsImV4cCI6MjA3ODExMzM4MX0.Z8JPlg7hhKbA624QGHp2bKKTNtCD3WInQMO5twjl6a0';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE ESTATUS
// ═══════════════════════════════════════════════════════════════════════════
const ESTATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any; descripcion: string }> = {
  'ENVIADA': {
    label: 'Enviada al Cliente',
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.15)',
    icon: Clock,
    descripcion: 'Esperando que el cliente complete el formulario'
  },
  'PENDIENTE_CSR': {
    label: 'Pendiente Revisión',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.15)',
    icon: AlertCircle,
    descripcion: 'Juan Viveros debe revisar y asignar CSR'
  },
  'PENDIENTE_COBRANZA': {
    label: 'Pendiente CxC',
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.15)',
    icon: CreditCard,
    descripcion: 'Claudia/Martha deben asignar ejecutivo de Cobranza'
  },
  'PENDIENTE_CONFIRMACION': {
    label: 'Pendiente Confirmación',
    color: '#ec4899',
    bg: 'rgba(236,72,153,0.15)',
    icon: CheckCircle2,
    descripcion: 'Nancy Alonso debe confirmar el alta'
  },
  'COMPLETADA': {
    label: 'Completada',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.15)',
    icon: CheckCircle2,
    descripcion: 'Alta finalizada exitosamente'
  },
  'RECHAZADA': {
    label: 'Rechazada',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.15)',
    icon: X,
    descripcion: 'Solicitud rechazada'
  }
};

// Orden de estatus para tabs
const ESTATUS_ORDEN = ['PENDIENTE_CSR', 'PENDIENTE_COBRANZA', 'PENDIENTE_CONFIRMACION', 'ENVIADA', 'COMPLETADA'];

export default function ServicioClientesModule() {
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstatus, setFiltroEstatus] = useState<string>('TODOS');
  const [busqueda, setBusqueda] = useState('');
  const [conteos, setConteos] = useState<Record<string, number>>({});

  // Modal states
  const [showCrear, setShowCrear] = useState(false);
  const [showIA, setShowIA] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<any>(null);
  const [modalTipo, setModalTipo] = useState<'revisar' | 'asignar_cxc' | 'confirmar' | null>(null);

  // Usuario actual
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    cargarSolicitudes();
    obtenerUsuario();
  }, []);

  const obtenerUsuario = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUserEmail(user?.email || '');
  };

  const cargarSolicitudes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('alta_clientes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSolicitudes(data || []);

      // Calcular conteos
      const counts: Record<string, number> = { TODOS: data?.length || 0 };
      (data || []).forEach(s => {
        const estatus = s.estatus || 'ENVIADA';
        counts[estatus] = (counts[estatus] || 0) + 1;
      });
      setConteos(counts);

    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // DETERMINAR QUÉ MODAL ABRIR SEGÚN ESTATUS
  // ═══════════════════════════════════════════════════════════════════════════
  const abrirSolicitud = (solicitud: any) => {
    setSolicitudSeleccionada(solicitud);

    switch (solicitud.estatus) {
      case 'PENDIENTE_CSR':
        setModalTipo('revisar');
        break;
      case 'PENDIENTE_COBRANZA':
        setModalTipo('asignar_cxc');
        break;
      case 'PENDIENTE_CONFIRMACION':
        setModalTipo('confirmar');
        break;
      case 'COMPLETADA':
        setModalTipo('confirmar');
        break;
      default:
        setModalTipo('revisar');
    }
  };

  const cerrarModal = () => {
    setSolicitudSeleccionada(null);
    setModalTipo(null);
    cargarSolicitudes();
  };

  // Filtrar solicitudes
  const solicitudesFiltradas = solicitudes.filter(s => {
    if (filtroEstatus !== 'TODOS' && s.estatus !== filtroEstatus) return false;
    if (busqueda) {
      const search = busqueda.toLowerCase();
      return (
        s.razon_social?.toLowerCase().includes(search) ||
        s.rfc_mc?.toLowerCase().includes(search) ||
        s.rfc?.toLowerCase().includes(search) ||
        s.nombre_cliente?.toLowerCase().includes(search) ||
        s.email_cliente?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Users className="w-7 h-7 text-orange-400" />
            Alta de Clientes
          </h1>
          <p className="text-white/50 text-sm mt-1">
            Gestión de solicitudes de alta comercial
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={cargarSolicitudes}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
            title="Actualizar"
          >
            <RefreshCw className={`w-5 h-5 text-white/50 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* ═══════════════════════════════════════════════════════════════════════════
              🆕 BOTÓN IA - NUEVO
              ═══════════════════════════════════════════════════════════════════════════ */}
          <button
            onClick={() => setShowIA(true)}
            className="px-4 py-2 rounded-xl flex items-center gap-2 font-semibold text-white transition-all hover:scale-105"
            style={{ 
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 50%, #4c1d95 100%)',
              boxShadow: '0 0 20px rgba(139,92,246,0.4)'
            }}
          >
            <Sparkles className="w-5 h-5" />
            <span>IA</span>
          </button>

          <button
            onClick={() => setShowCrear(true)}
            className="px-4 py-2 rounded-xl flex items-center gap-2 font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #fe5000 0%, #cc4000 100%)' }}
          >
            <UserPlus className="w-5 h-5" />
            Nueva Solicitud
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════
          🆕 CARD IA - NUEVO
          ═══════════════════════════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-r from-purple-500/20 via-violet-500/20 to-indigo-500/20 rounded-2xl border border-purple-500/30 p-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-500/30">
            <Bot className="w-6 h-6 text-purple-300" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-bold flex items-center gap-2">
              Asistente IA
              <span className="px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-300 text-xs">Beta</span>
            </h3>
            <p className="text-white/50 text-sm">
              Validación automática de documentos • Análisis de riesgo • Sugerencias inteligentes
            </p>
          </div>
          <button
            onClick={() => setShowIA(true)}
            className="px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-300 text-sm font-medium hover:bg-purple-500/30 transition-all"
          >
            Explorar →
          </button>
        </div>
      </div>

      {/* TABS DE ESTATUS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFiltroEstatus('TODOS')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap ${
            filtroEstatus === 'TODOS' ? 'bg-white/20 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'
          }`}
        >
          <span>Todos</span>
          <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-bold">{conteos.TODOS || 0}</span>
        </button>

        {ESTATUS_ORDEN.map(estatus => {
          const config = ESTATUS_CONFIG[estatus];
          const count = conteos[estatus] || 0;
          const Icon = config.icon;
          return (
            <button
              key={estatus}
              onClick={() => setFiltroEstatus(estatus)}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap ${
                filtroEstatus === estatus ? 'text-white' : 'text-white/50 hover:text-white/70'
              }`}
              style={{ background: filtroEstatus === estatus ? config.bg : 'rgba(255,255,255,0.05)' }}
            >
              <Icon className="w-4 h-4" style={{ color: config.color }} />
              <span>{config.label}</span>
              {count > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: config.bg, color: config.color }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* BÚSQUEDA */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
        <input
          type="text"
          placeholder="Buscar por razón social, RFC, contacto o email..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-orange-500/50 focus:outline-none"
        />
      </div>

      {/* LISTA DE SOLICITUDES */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      ) : solicitudesFiltradas.length === 0 ? (
        <div className="text-center p-12 text-white/50">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No hay solicitudes {filtroEstatus !== 'TODOS' ? `con estatus "${ESTATUS_CONFIG[filtroEstatus]?.label}"` : ''}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {solicitudesFiltradas.map(solicitud => {
            const config = ESTATUS_CONFIG[solicitud.estatus] || ESTATUS_CONFIG['ENVIADA'];
            const Icon = config.icon;
            const tipoPago = solicitud.tipo_pago === 'CREDITO' ? `Crédito ${solicitud.dias_credito || 30}d` : solicitud.tipo_pago || '-';

            return (
              <div
                key={solicitud.id}
                onClick={() => abrirSolicitud(solicitud)}
                className="bg-[#0a1628]/95 rounded-xl border border-white/10 p-4 hover:border-white/20 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: config.bg }}>
                    <Icon className="w-6 h-6" style={{ color: config.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-white truncate">{solicitud.razon_social || 'Sin nombre'}</h3>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: config.bg, color: config.color }}>
                        {config.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-white/50">
                      <span>{solicitud.rfc_mc || solicitud.rfc || '-'}</span>
                      <span>•</span>
                      <span>{solicitud.nombre_cliente || '-'}</span>
                      <span>•</span>
                      <span>{solicitud.empresa_facturadora || '-'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    {solicitud.csr_nombre && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-500/10">
                        <User className="w-3 h-3 text-purple-400" />
                        <span className="text-purple-300">{solicitud.csr_nombre.split(' ')[0]}</span>
                      </div>
                    )}
                    {solicitud.cxc_nombre && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-500/10">
                        <CreditCard className="w-3 h-3 text-green-400" />
                        <span className="text-green-300">{solicitud.cxc_nombre.split(' ')[0]}</span>
                      </div>
                    )}
                    {solicitud.tipo_pago && (
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${solicitud.tipo_pago === 'CREDITO' ? 'bg-green-500/10' : 'bg-blue-500/10'}`}>
                        <DollarSign className={`w-3 h-3 ${solicitud.tipo_pago === 'CREDITO' ? 'text-green-400' : 'text-blue-400'}`} />
                        <span className={solicitud.tipo_pago === 'CREDITO' ? 'text-green-300' : 'text-blue-300'}>{tipoPago}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right text-xs text-white/30">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    {new Date(solicitud.created_at).toLocaleDateString('es-MX')}
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white/50 transition-all" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODALES */}
      
      {/* Modal Crear Solicitud */}
      {showCrear && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a1628] rounded-2xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-lg font-bold text-white">Nueva Solicitud de Alta</h2>
              <button onClick={() => setShowCrear(false)} className="text-white/50 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4">
              <CrearSolicitudAlta onCreated={() => { setShowCrear(false); cargarSolicitudes(); }} />
            </div>
          </div>
        </div>
      )}

      {/* 🆕 Modal IA */}
      {showIA && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a1628] rounded-2xl border border-purple-500/30 w-full max-w-2xl">
            <div className="flex items-center justify-between p-4 border-b border-purple-500/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-500/20">
                  <Bot className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Asistente IA</h2>
                  <p className="text-xs text-purple-300/70">Powered by Claude</p>
                </div>
              </div>
              <button onClick={() => setShowIA(false)} className="text-white/50 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/20">
                  <Sparkles className="w-8 h-8 text-purple-400 mb-3" />
                  <h3 className="text-white font-semibold mb-1">Validación de Documentos</h3>
                  <p className="text-white/50 text-sm">Analiza automáticamente CSF, opinión de cumplimiento y actas constitutivas.</p>
                </div>
                <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/20">
                  <AlertCircle className="w-8 h-8 text-purple-400 mb-3" />
                  <h3 className="text-white font-semibold mb-1">Análisis de Riesgo</h3>
                  <p className="text-white/50 text-sm">Evalúa el perfil crediticio del cliente con búsqueda web.</p>
                </div>
                <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/20">
                  <FileText className="w-8 h-8 text-purple-400 mb-3" />
                  <h3 className="text-white font-semibold mb-1">Extracción de Datos</h3>
                  <p className="text-white/50 text-sm">Extrae RFC, razón social y domicilio de documentos PDF.</p>
                </div>
                <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/20">
                  <Users className="w-8 h-8 text-purple-400 mb-3" />
                  <h3 className="text-white font-semibold mb-1">Sugerencias</h3>
                  <p className="text-white/50 text-sm">Recomienda CSR y CxC basado en carga de trabajo.</p>
                </div>
              </div>
              <div className="mt-6 p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/30">
                <p className="text-yellow-300 text-sm text-center">🚀 Funcionalidades en desarrollo. Próximamente disponibles.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Revisar (Juan Viveros) */}
      {modalTipo === 'revisar' && solicitudSeleccionada && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a1628] rounded-2xl border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div>
                <h2 className="text-lg font-bold text-white">Revisar Solicitud</h2>
                <p className="text-sm text-white/50">Validar cliente y asignar Servicio a Clientes (CSR)</p>
              </div>
              <button onClick={cerrarModal} className="text-white/50 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4">
              <RevisarSolicitudAlta solicitudId={solicitudSeleccionada.id} onUpdated={cerrarModal} />
            </div>
          </div>
        </div>
      )}

      {/* Modal Asignar CxC (Claudia/Martha) */}
      {modalTipo === 'asignar_cxc' && solicitudSeleccionada && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a1628] rounded-2xl border border-white/10 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div>
                <h2 className="text-lg font-bold text-white">Asignar Ejecutivo de Cobranza</h2>
                <p className="text-sm text-white/50">Seleccionar ejecutivo CxC para este cliente</p>
              </div>
              <button onClick={cerrarModal} className="text-white/50 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4">
              <AsignarCxC />
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar (Nancy Alonso) */}
      {modalTipo === 'confirmar' && solicitudSeleccionada && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a1628] rounded-2xl border border-white/10 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div>
                <h2 className="text-lg font-bold text-white">Confirmar Alta</h2>
                <p className="text-sm text-white/50">Revisar y confirmar alta del cliente</p>
              </div>
              <button onClick={cerrarModal} className="text-white/50 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4">
              <ConfirmarAltaNancy solicitudId={solicitudSeleccionada.id} onConfirmed={cerrarModal} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
