// Updated: 2026-01-10 13:46:31
import { useState, useEffect } from 'react';
import { 
  ArrowLeft, Truck, MapPin, Clock, Phone, User, 
  CheckCircle, AlertTriangle, Circle, RefreshCw,
  List, Map as MapIcon, Filter, Navigation,
  Gauge, Calendar, ArrowRight, Eye, Activity,
  ThermometerSnowflake
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Supabase client
const SUPABASE_URL = 'https://fbxbsslhewchyibdoyzk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieGJzc2xoZXdjaHlpYmRveXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzczODEsImV4cCI6MjA3ODExMzM4MX0.Z8JPlg7hhKbA624QGHp2bKKTNtCD3WInQMO5twjl6a0';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface VistaClientesCarrollProps {
  onBack: () => void;
  onVerMapa?: () => void;
}

interface UnidadMonitor {
  economico: string;
  empresa: string;
  gps_estatus: string;
  velocidad: number;
  latitud: number;
  longitud: number;
  ubicacion: string;
  ultima_actualizacion: string;
  estado_geo: string;
  municipio_geo: string;
  operador_default: string;
  telefono_default: string;
  viaje_id: number | null;
  id_formato: number | null;
  operador_viaje: string | null;
  telefono_viaje: string | null;
  hora_cita_destino: string | null;
  hora_inicio: string | null;
  viaje_estado: string | null;
  tiempo_en_origen_min: number | null;
  tiempo_en_destino_min: number | null;
  origen_nombre: string | null;
  cliente_destino: string | null;
  kilometros: number | null;
  tiempo_transito_hrs: number | null;
  operador_efectivo: string;
  telefono_efectivo: string;
}

export const VistaClientesCarroll = ({ onBack }: VistaClientesCarrollProps) => {
  const [unidades, setUnidades] = useState<UnidadMonitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'lista' | 'mapa'>('lista');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [selectedUnidad, setSelectedUnidad] = useState<UnidadMonitor | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Stats calculados
  const stats = {
    total: unidades.length,
    enViaje: unidades.filter(u => u.viaje_id).length,
    aTiempo: unidades.filter(u => u.viaje_estado && !['retrasado', 'retraso_leve'].includes(u.viaje_estado)).length,
    retrasados: unidades.filter(u => u.viaje_estado === 'retrasado').length,
    enOrigen: unidades.filter(u => u.viaje_estado === 'en_origen').length,
    enDestino: unidades.filter(u => u.viaje_estado === 'en_destino').length,
  };

  useEffect(() => {
    fetchUnidades();
    const interval = setInterval(fetchUnidades, 60000); // Refresh cada minuto
    return () => clearInterval(interval);
  }, []);

  const fetchUnidades = async () => {
    try {
      const { data, error } = await supabase
        .from('carroll_monitor')
        .select('*');

      if (error) throw error;
      if (data) {
        setUnidades(data);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error fetching unidades:', error);
    }
    setLoading(false);
  };

  const getEstadoVisual = (unidad: UnidadMonitor) => {
    if (!unidad.viaje_id) {
      return { 
        color: 'gray', 
        bg: 'rgba(148, 163, 184, 0.15)', 
        border: 'rgba(148, 163, 184, 0.3)',
        text: '#94a3b8', 
        label: 'En Espera',
        icon: Circle,
      };
    }

    const estado = unidad.viaje_estado || 'asignado';
    
    const configs: Record<string, any> = {
      'asignado': { color: 'blue', bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.3)', text: '#60a5fa', label: 'Asignado', icon: Circle },
      'transito_origen': { color: 'blue', bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.3)', text: '#60a5fa', label: 'A Origen', icon: Navigation },
      'en_origen': { color: 'orange', bg: 'rgba(249, 115, 22, 0.15)', border: 'rgba(249, 115, 22, 0.3)', text: '#fb923c', label: 'Cargando', icon: MapPin },
      'transito_destino': { color: 'blue', bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.3)', text: '#60a5fa', label: 'En Tránsito', icon: Truck },
      'en_destino': { color: 'emerald', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)', text: '#34d399', label: 'Descargando', icon: CheckCircle },
      'retrasado': { color: 'red', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)', text: '#f87171', label: 'Retrasado', icon: AlertTriangle },
      'retraso_leve': { color: 'yellow', bg: 'rgba(234, 179, 8, 0.15)', border: 'rgba(234, 179, 8, 0.3)', text: '#facc15', label: 'Retraso Leve', icon: Clock },
    };

    return configs[estado] || configs['asignado'];
  };

  const calcularProgreso = (unidad: UnidadMonitor) => {
    if (!unidad.viaje_id || !unidad.kilometros) return 0;
    const estados = ['asignado', 'transito_origen', 'en_origen', 'transito_destino', 'en_destino'];
    const idx = estados.indexOf(unidad.viaje_estado || 'asignado');
    return Math.min(100, (idx + 1) * 20);
  };

  const filteredUnidades = unidades.filter(u => {
    if (filterEstado === 'todos') return true;
    if (filterEstado === 'en_viaje') return u.viaje_id;
    if (filterEstado === 'sin_asignar') return !u.viaje_id;
    if (filterEstado === 'retrasados') return u.viaje_estado === 'retrasado';
    if (filterEstado === 'a_tiempo') return u.viaje_id && u.viaje_estado !== 'retrasado';
    return true;
  });

  const tiempoSinActualizar = (fecha: string) => {
    if (!fecha) return 'N/A';
    const diff = Date.now() - new Date(fecha).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Ahora';
    if (mins < 60) return `Hace ${mins} min`;
    return `Hace ${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  return (
    <div className="w-full min-h-screen" style={{ background: '#0a0f1a' }}>
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[100px]"
          style={{ background: 'rgba(16, 185, 129, 0.08)' }}
        />
        <div 
          className="absolute bottom-[-15%] left-[-10%] w-[400px] h-[400px] rounded-full blur-[100px]"
          style={{ background: 'rgba(20, 184, 166, 0.08)' }}
        />
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      {/* Header */}
      <header 
        className="relative z-10 px-6 py-4"
        style={{ 
          background: 'linear-gradient(135deg, #0B1220 0%, #1a2332 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.05)'
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 rounded-xl transition-all duration-200"
              style={{ 
                background: 'rgba(255,255,255,0.05)', 
                border: '1px solid rgba(255,255,255,0.1)' 
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              }}
            >
              <ArrowLeft size={20} className="text-gray-400" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-white">GRANJAS CARROLL</h1>
                <span 
                  className="px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}
                >
                  TORRE DE CONTROL
                </span>
              </div>
              <p className="text-sm text-gray-500">
                Última actualización: {lastUpdate.toLocaleTimeString('es-MX')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchUnidades}
              className="p-2 rounded-xl transition-all"
              style={{ 
                background: 'rgba(255,255,255,0.05)', 
                border: '1px solid rgba(255,255,255,0.1)' 
              }}
            >
              <RefreshCw size={18} className={`text-gray-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <div 
              className="flex items-center gap-2 px-4 py-2 rounded-xl"
              style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }}
            >
              <div className="relative">
                <div className="w-2 h-2 rounded-full" style={{ background: '#34d399' }} />
                <div 
                  className="absolute inset-0 w-2 h-2 rounded-full animate-ping"
                  style={{ background: '#34d399' }}
                />
              </div>
              <span style={{ color: '#34d399' }} className="text-sm font-medium">En vivo</span>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Strip */}
      <div 
        className="relative z-10 px-6 py-4"
        style={{ 
          background: 'rgba(0,0,0,0.2)', 
          borderBottom: '1px solid rgba(255,255,255,0.05)' 
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            {[
              { label: 'Unidades', value: stats.total, color: '#fff' },
              { label: 'En Viaje', value: stats.enViaje, color: '#60a5fa' },
              { label: 'A Tiempo', value: stats.aTiempo, color: '#34d399' },
              { label: 'Retrasados', value: stats.retrasados, color: '#f87171' },
            ].map((stat, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</span>
                <span className="text-gray-500 text-sm">{stat.label}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div 
              className="flex rounded-xl overflow-hidden"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <button
                onClick={() => setViewMode('lista')}
                className="flex items-center gap-2 px-4 py-2 transition-colors"
                style={{ 
                  background: viewMode === 'lista' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                  color: viewMode === 'lista' ? '#34d399' : '#94a3b8'
                }}
              >
                <List size={16} />
                <span className="text-sm">Lista</span>
              </button>
              <button
                onClick={() => setViewMode('mapa')}
                className="flex items-center gap-2 px-4 py-2 transition-colors"
                style={{ 
                  background: viewMode === 'mapa' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                  color: viewMode === 'mapa' ? '#34d399' : '#94a3b8'
                }}
              >
                <MapIcon size={16} />
                <span className="text-sm">Mapa</span>
              </button>
            </div>

            {/* Filter */}
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="px-4 py-2 rounded-xl text-sm cursor-pointer"
              style={{ 
                background: 'rgba(255,255,255,0.05)', 
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#cbd5e1'
              }}
            >
              <option value="todos">Todos</option>
              <option value="en_viaje">En viaje</option>
              <option value="a_tiempo">A tiempo</option>
              <option value="retrasados">Retrasados</option>
              <option value="sin_asignar">Sin asignación</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 px-6 py-6">
        <div className="max-w-7xl mx-auto">
          {viewMode === 'lista' ? (
            /* Vista Lista */
            <div className="grid gap-4">
              {loading ? (
                <div className="text-center py-12 text-gray-500">
                  <RefreshCw size={32} className="animate-spin mx-auto mb-4" />
                  <p>Cargando unidades...</p>
                </div>
              ) : filteredUnidades.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Truck size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No hay unidades para mostrar</p>
                </div>
              ) : (
                filteredUnidades.map((unidad) => {
                  const visual = getEstadoVisual(unidad);
                  const progreso = calcularProgreso(unidad);
                  const IconComponent = visual.icon;
                  
                  return (
                    <div
                      key={unidad.economico}
                      onClick={() => setSelectedUnidad(unidad)}
                      className="relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                        border: `1px solid ${visual.border}`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)';
                      }}
                    >
                      <div className="p-5">
                        {/* Top Row */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-4">
                            {/* ECO Badge */}
                            <div 
                              className="w-14 h-14 rounded-xl flex flex-col items-center justify-center"
                              style={{ 
                                background: visual.bg, 
                                border: `1px solid ${visual.border}` 
                              }}
                            >
                              <Truck size={18} style={{ color: visual.text }} />
                              <span className="text-xs font-bold" style={{ color: visual.text }}>
                                {unidad.economico}
                              </span>
                            </div>

                            {/* Operador Info */}
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-semibold text-white">
                                  {unidad.operador_efectivo}
                                </h3>
                              </div>
                              {unidad.telefono_efectivo && (
                                <div className="flex items-center gap-1 text-gray-500 text-sm">
                                  <Phone size={12} />
                                  <span>{unidad.telefono_efectivo}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Estado Badge */}
                          <div 
                            className="flex items-center gap-2 px-4 py-2 rounded-xl"
                            style={{ background: visual.bg, border: `1px solid ${visual.border}` }}
                          >
                            <IconComponent size={16} style={{ color: visual.text }} />
                            <span className="font-semibold" style={{ color: visual.text }}>
                              {visual.label}
                            </span>
                          </div>
                        </div>

                        {/* Route Info */}
                        {unidad.viaje_id ? (
                          <>
                            <div className="flex items-center gap-3 mb-4 text-sm">
                              <div className="flex items-center gap-2 text-gray-400">
                                <MapPin size={14} style={{ color: '#60a5fa' }} />
                                <span className="truncate max-w-[150px]">{unidad.origen_nombre}</span>
                              </div>
                              <ArrowRight size={14} className="text-gray-600" />
                              <div className="flex items-center gap-2 text-white font-medium">
                                <MapPin size={14} style={{ color: '#34d399' }} />
                                <span className="truncate max-w-[200px]">{unidad.cliente_destino}</span>
                              </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mb-4">
                              <div 
                                className="h-2 rounded-full overflow-hidden"
                                style={{ background: 'rgba(255,255,255,0.1)' }}
                              >
                                <div 
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{ 
                                    width: `${progreso}%`,
                                    background: visual.color === 'red' 
                                      ? 'linear-gradient(90deg, #ef4444, #f87171)' 
                                      : visual.color === 'emerald'
                                      ? 'linear-gradient(90deg, #10b981, #34d399)'
                                      : 'linear-gradient(90deg, #3b82f6, #60a5fa)'
                                  }}
                                />
                              </div>
                              <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                                <span>{unidad.kilometros} km</span>
                                <span>{Math.round(progreso)}% completado</span>
                              </div>
                            </div>

                            {/* Bottom Row - Cita & ETA */}
                            <div 
                              className="flex items-center justify-between pt-3"
                              style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
                            >
                              <div className="flex items-center gap-4">
                                {unidad.hora_cita_destino && (
                                  <div className="flex items-center gap-2">
                                    <Calendar size={14} className="text-gray-500" />
                                    <span className="text-white text-sm font-medium">
                                      Cita: {new Date(unidad.hora_cita_destino).toLocaleString('es-MX', {
                                        day: '2-digit',
                                        month: 'short',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <Clock size={14} className="text-gray-500" />
                                  <span className="text-gray-400 text-sm">
                                    ~{unidad.tiempo_transito_hrs}h restantes
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                  <Gauge size={14} className="text-gray-500" />
                                  <span className="text-gray-400">{unidad.velocidad || 0} km/h</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <ThermometerSnowflake size={14} style={{ color: '#60a5fa' }} />
                                  <span style={{ color: '#60a5fa' }}>-18°C</span>
                                </div>
                              </div>
                            </div>
                          </>
                        ) : (
                          /* Sin Viaje */
                          <div className="py-2">
                            <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                              <MapPin size={14} />
                              <span>Ubicación actual:</span>
                            </div>
                            <p className="text-gray-400">{unidad.ubicacion || 'Ubicación no disponible'}</p>
                            <p className="text-gray-500 text-sm mt-1">
                              {tiempoSinActualizar(unidad.ultima_actualizacion)}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Decorative corner */}
                      <div 
                        className="absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-50"
                        style={{ background: visual.bg }}
                      />
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* Vista Mapa - Placeholder */
            <div 
              className="rounded-2xl overflow-hidden"
              style={{ 
                border: '1px solid rgba(255,255,255,0.1)', 
                height: 'calc(100vh - 280px)',
                background: '#0d1420'
              }}
            >
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <MapIcon size={64} className="mx-auto mb-4 opacity-30" />
                  <p className="text-lg mb-2">Mapa en desarrollo</p>
                  <p className="text-sm text-gray-600">
                    Integración con Google Maps próximamente
                  </p>
                  
                  {/* Mini grid de unidades */}
                  <div className="mt-8 grid grid-cols-4 gap-2 max-w-md mx-auto">
                    {filteredUnidades.slice(0, 8).map((u) => {
                      const visual = getEstadoVisual(u);
                      return (
                        <div 
                          key={u.economico}
                          className="p-3 rounded-xl"
                          style={{ background: visual.bg, border: `1px solid ${visual.border}` }}
                        >
                          <Truck size={16} style={{ color: visual.text }} className="mx-auto mb-1" />
                          <p className="text-xs font-bold" style={{ color: visual.text }}>{u.economico}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Detail Modal */}
      {selectedUnidad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => setSelectedUnidad(null)}
          />
          
          <div 
            className="relative w-full max-w-lg rounded-2xl overflow-hidden"
            style={{ 
              background: '#0f1629', 
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}
          >
            {/* Modal Header */}
            <div 
              className="relative px-6 py-5"
              style={{ 
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(20, 184, 166, 0.1) 100%)',
                borderBottom: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <button 
                onClick={() => setSelectedUnidad(null)}
                className="absolute top-4 right-4 p-2 rounded-lg transition-colors"
                style={{ background: 'rgba(255,255,255,0.1)' }}
              >
                <ArrowLeft size={18} className="text-white" />
              </button>
              
              <div className="flex items-center gap-4">
                <div 
                  className="w-16 h-16 rounded-2xl flex flex-col items-center justify-center"
                  style={{ 
                    background: 'rgba(16, 185, 129, 0.2)', 
                    border: '1px solid rgba(16, 185, 129, 0.3)' 
                  }}
                >
                  <Truck size={24} style={{ color: '#34d399' }} />
                  <span className="font-bold" style={{ color: '#34d399' }}>{selectedUnidad.economico}</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedUnidad.operador_efectivo}</h3>
                  {selectedUnidad.telefono_efectivo && (
                    <a 
                      href={`tel:${selectedUnidad.telefono_efectivo}`} 
                      className="flex items-center gap-1 text-sm"
                      style={{ color: '#34d399' }}
                    >
                      <Phone size={12} />
                      {selectedUnidad.telefono_efectivo}
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 space-y-4">
              {/* Ruta */}
              {selectedUnidad.viaje_id && (
                <div 
                  className="p-4 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Ruta Actual</p>
                  <div className="flex items-center gap-2 text-white">
                    <MapPin size={16} style={{ color: '#60a5fa' }} className="flex-shrink-0" />
                    <span className="truncate">{selectedUnidad.origen_nombre}</span>
                    <ArrowRight size={14} className="text-gray-600 flex-shrink-0" />
                    <MapPin size={16} style={{ color: '#34d399' }} className="flex-shrink-0" />
                    <span className="truncate font-medium">{selectedUnidad.cliente_destino}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-sm text-gray-400">
                    <span>{selectedUnidad.kilometros} km</span>
                    <span>·</span>
                    <span>~{selectedUnidad.tiempo_transito_hrs}h estimado</span>
                  </div>
                </div>
              )}

              {/* Ubicación */}
              <div 
                className="p-4 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Ubicación Actual</p>
                <p className="text-white">{selectedUnidad.ubicacion || 'No disponible'}</p>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    {selectedUnidad.estado_geo}, {selectedUnidad.municipio_geo}
                  </span>
                  <span className="text-gray-400">{tiempoSinActualizar(selectedUnidad.ultima_actualizacion)}</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div 
                  className="p-3 rounded-xl text-center"
                  style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)' }}
                >
                  <Gauge size={18} style={{ color: '#60a5fa' }} className="mx-auto mb-1" />
                  <p className="text-lg font-bold text-white">{selectedUnidad.velocidad || 0}</p>
                  <p className="text-xs text-gray-500">km/h</p>
                </div>
                <div 
                  className="p-3 rounded-xl text-center"
                  style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}
                >
                  <Navigation size={18} style={{ color: '#34d399' }} className="mx-auto mb-1" />
                  <p className="text-lg font-bold text-white">{selectedUnidad.gps_estatus || 'N/A'}</p>
                  <p className="text-xs text-gray-500">Estado GPS</p>
                </div>
                <div 
                  className="p-3 rounded-xl text-center"
                  style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)' }}
                >
                  <ThermometerSnowflake size={18} style={{ color: '#60a5fa' }} className="mx-auto mb-1" />
                  <p className="text-lg font-bold text-white">-18°C</p>
                  <p className="text-xs text-gray-500">Refrigeración</p>
                </div>
              </div>

              {/* Cita */}
              {selectedUnidad.hora_cita_destino && (
                <div 
                  className="p-4 rounded-xl"
                  style={{ 
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(20, 184, 166, 0.1) 100%)',
                    border: '1px solid rgba(16, 185, 129, 0.2)'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Hora de Cita</p>
                      <p className="text-xl font-bold text-white">
                        {new Date(selectedUnidad.hora_cita_destino).toLocaleString('es-MX', {
                          weekday: 'short',
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Estado</p>
                      <span 
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full font-medium"
                        style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}
                      >
                        <CheckCircle size={14} />
                        A tiempo
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VistaClientesCarroll;

