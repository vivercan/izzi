import { useState, useEffect } from 'react';
import { ArrowLeft, Truck, MapPin, Clock, RefreshCw, Navigation, Search, List, Map, X, Phone, Gauge } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fbxbsslhewchyibdoyzk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieGJzc2xoZXdjaHlpYmRveXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzczODEsImV4cCI6MjA3ODExMzM4MX0.Z8JPlg7hhKbA624QGHp2bKKTNtCD3WInQMO5twjl6a0'
);

interface VistaClientesCarrollProps { onBack: () => void; }

interface Unidad {
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
  viaje_id: number | null;
  cliente_destino: string | null;
  operador_efectivo: string;
  telefono_efectivo: string;
}

export const VistaClientesCarroll = ({ onBack }: VistaClientesCarrollProps) => {
  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [vista, setVista] = useState<'lista' | 'mapa'>('lista');
  const [selectedUnidad, setSelectedUnidad] = useState<Unidad | null>(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    fetchUnidades();
    const interval = setInterval(fetchUnidades, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnidades = async () => {
    try {
      const { data, error } = await supabase.from('carroll_monitor').select('*');
      if (!error && data) { setUnidades(data); setLastUpdate(new Date()); }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const stats = {
    total: unidades.length,
    movimiento: unidades.filter(u => u.velocidad > 0).length,
    detenidos: unidades.filter(u => u.velocidad === 0).length,
  };

  const getEstadoColor = (u: Unidad) => {
    if (u.velocidad > 0) return { bg: '#10b981', text: 'En Movimiento' };
    if (u.viaje_id) return { bg: '#f59e0b', text: 'Detenido' };
    return { bg: '#6b7280', text: 'En Espera' };
  };

  const tiempoDesde = (fecha: string) => {
    if (!fecha) return '-';
    const mins = Math.floor((Date.now() - new Date(fecha).getTime()) / 60000);
    if (mins < 1) return 'Ahora';
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins/60)}h`;
  };

  const filtered = unidades.filter(u => {
    const matchBusqueda = !busqueda || 
      u.economico.includes(busqueda) || 
      u.operador_efectivo?.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.ubicacion?.toLowerCase().includes(busqueda.toLowerCase());
    const matchFiltro = filtro === 'todos' || 
      (filtro === 'movimiento' && u.velocidad > 0) ||
      (filtro === 'detenido' && u.velocidad === 0);
    return matchBusqueda && matchFiltro;
  });

  const openGoogleMaps = (u: Unidad) => {
    if (u.latitud && u.longitud) {
      window.open(`https://www.google.com/maps?q=${u.latitud},${u.longitud}`, '_blank');
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#0B1220' }}>
      {/* Header */}
      <div className="px-4 py-3 border-b" style={{ borderColor: '#1e293b' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 rounded-lg hover:bg-slate-800"><ArrowLeft className="w-5 h-5 text-white" /></button>
            <div>
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-500" />
                <span className="text-white font-bold">Granjas Carroll</span>
                <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: '#10b981', color: '#fff' }}>TORRE DE CONTROL</span>
              </div>
              <span className="text-xs text-gray-500">Actualizado: {lastUpdate.toLocaleTimeString('es-MX')}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchUnidades} className="p-2 rounded-lg hover:bg-slate-800">
              <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <div className="flex items-center gap-1 px-3 py-1 rounded-lg" style={{ background: 'rgba(16,185,129,0.2)' }}>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-500 text-xs font-medium">En vivo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats + Filtros + Toggle Vista */}
      <div className="px-4 py-3 border-b flex items-center justify-between gap-4 flex-wrap" style={{ borderColor: '#1e293b' }}>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white">{stats.total}</span>
            <span className="text-gray-500 text-sm">Unidades</span>
          </div>
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-emerald-500" />
            <span className="text-emerald-500 font-bold">{stats.movimiento}</span>
            <span className="text-gray-500 text-xs">Movimiento</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-amber-500 font-bold">{stats.detenidos}</span>
            <span className="text-gray-500 text-xs">Detenidos</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle Lista/Mapa */}
          <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid #334155' }}>
            <button
              onClick={() => setVista('lista')}
              className="flex items-center gap-1 px-3 py-2 text-sm transition-colors"
              style={{ background: vista === 'lista' ? '#10b981' : '#1e293b', color: vista === 'lista' ? '#fff' : '#94a3b8' }}
            >
              <List className="w-4 h-4" />
              Lista
            </button>
            <button
              onClick={() => setVista('mapa')}
              className="flex items-center gap-1 px-3 py-2 text-sm transition-colors"
              style={{ background: vista === 'mapa' ? '#10b981' : '#1e293b', color: vista === 'mapa' ? '#fff' : '#94a3b8' }}
            >
              <Map className="w-4 h-4" />
              Mapa
            </button>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar eco..."
              className="pl-9 pr-3 py-2 rounded-lg text-sm text-white"
              style={{ background: '#1e293b', border: '1px solid #334155', width: '140px' }}
            />
          </div>
          <select
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm text-gray-300"
            style={{ background: '#1e293b', border: '1px solid #334155' }}
          >
            <option value="todos">Todos</option>
            <option value="movimiento">En movimiento</option>
            <option value="detenido">Detenidos</option>
          </select>
        </div>
      </div>

      {/* Contenido - Lista o Mapa */}
      {vista === 'lista' ? (
        <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 140px)' }}>
          <table className="w-full">
            <thead className="sticky top-0" style={{ background: '#0f172a' }}>
              <tr className="text-left text-xs text-gray-500 uppercase">
                <th className="px-4 py-3">ECO</th>
                <th className="px-4 py-3">Empresa</th>
                <th className="px-4 py-3">Estatus</th>
                <th className="px-4 py-3">Velocidad</th>
                <th className="px-4 py-3">Ubicacion</th>
                <th className="px-4 py-3">Destino</th>
                <th className="px-4 py-3 text-right">Actualizado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const estado = getEstadoColor(u);
                return (
                  <tr key={u.economico} className="border-b hover:bg-slate-800/50 transition-colors cursor-pointer" style={{ borderColor: '#1e293b' }} onClick={() => setSelectedUnidad(u)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-gray-500" />
                        <span className="text-white font-bold">{u.economico}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded text-xs font-bold" style={{ 
                        background: u.empresa === 'TROB' ? '#3b82f6' : u.empresa === 'WE' ? '#8b5cf6' : '#f59e0b',
                        color: '#fff'
                      }}>{u.empresa}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: estado.bg }} />
                        <span className="text-sm" style={{ color: estado.bg }}>{estado.text}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {u.velocidad > 0 ? (
                        <span className="text-emerald-400 font-medium">{u.velocidad} km/h</span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedUnidad(u); }}
                        className="flex items-center gap-1 max-w-[280px] hover:text-blue-400 transition-colors group"
                      >
                        <MapPin className="w-3 h-3 text-blue-500 flex-shrink-0 group-hover:scale-110 transition-transform" />
                        <span className="text-gray-400 text-sm truncate group-hover:text-blue-400">{u.ubicacion || '-'}</span>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      {u.cliente_destino ? (
                        <span className="text-blue-400 text-sm">{u.cliente_destino}</span>
                      ) : (
                        <span className="text-gray-600 text-sm">Sin asignar</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-gray-500 text-sm">{tiempoDesde(u.ultima_actualizacion)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Vista Mapa */
        <div className="p-4" style={{ height: 'calc(100vh - 140px)' }}>
          <div className="w-full h-full rounded-xl overflow-hidden" style={{ border: '1px solid #334155' }}>
            <iframe
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              src={`https://www.google.com/maps/embed/v1/view?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&center=19.4326,-99.1332&zoom=5&maptype=roadmap`}
            />
            {/* Overlay con unidades */}
            <div className="absolute bottom-4 left-4 right-4 flex gap-2 overflow-x-auto pb-2">
              {filtered.slice(0, 10).map((u) => {
                const estado = getEstadoColor(u);
                return (
                  <button
                    key={u.economico}
                    onClick={() => setSelectedUnidad(u)}
                    className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg"
                    style={{ background: 'rgba(15,23,42,0.95)', border: `1px solid ${estado.bg}` }}
                  >
                    <Truck className="w-4 h-4" style={{ color: estado.bg }} />
                    <span className="text-white font-bold text-sm">{u.economico}</span>
                    {u.velocidad > 0 && <span className="text-emerald-400 text-xs">{u.velocidad}km/h</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalle Unidad */}
      {selectedUnidad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedUnidad(null)}>
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.7)' }} />
          <div className="relative w-full max-w-2xl rounded-2xl overflow-hidden" style={{ background: '#0f172a', border: '1px solid #334155' }} onClick={(e) => e.stopPropagation()}>
            {/* Header Modal */}
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#1e293b' }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.2)' }}>
                  <Truck className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-white">ECO {selectedUnidad.economico}</span>
                    <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ 
                      background: selectedUnidad.empresa === 'TROB' ? '#3b82f6' : '#8b5cf6',
                      color: '#fff'
                    }}>{selectedUnidad.empresa}</span>
                  </div>
                  <span className="text-gray-400 text-sm">{selectedUnidad.operador_efectivo || 'Sin operador'}</span>
                </div>
              </div>
              <button onClick={() => setSelectedUnidad(null)} className="p-2 rounded-lg hover:bg-slate-800">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Mapa */}
            <div className="h-64">
              {selectedUnidad.latitud && selectedUnidad.longitud ? (
                <iframe
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${selectedUnidad.latitud},${selectedUnidad.longitud}&zoom=15`}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: '#1e293b' }}>
                  <span className="text-gray-500">Sin coordenadas GPS</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-5 space-y-4">
              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl text-center" style={{ background: '#1e293b' }}>
                  <Gauge className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                  <p className="text-xl font-bold text-white">{selectedUnidad.velocidad || 0}</p>
                  <p className="text-xs text-gray-500">km/h</p>
                </div>
                <div className="p-3 rounded-xl text-center" style={{ background: '#1e293b' }}>
                  <Navigation className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-white">{selectedUnidad.gps_estatus || 'N/A'}</p>
                  <p className="text-xs text-gray-500">GPS</p>
                </div>
                <div className="p-3 rounded-xl text-center" style={{ background: '#1e293b' }}>
                  <Clock className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-white">{tiempoDesde(selectedUnidad.ultima_actualizacion)}</p>
                  <p className="text-xs text-gray-500">Actualizado</p>
                </div>
              </div>

              {/* Ubicacion */}
              <div className="p-4 rounded-xl" style={{ background: '#1e293b' }}>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-white text-sm">{selectedUnidad.ubicacion || 'Ubicacion no disponible'}</p>
                    <p className="text-gray-500 text-xs mt-1">{selectedUnidad.estado_geo}, {selectedUnidad.municipio_geo}</p>
                  </div>
                </div>
              </div>

              {/* Destino */}
              {selectedUnidad.cliente_destino && (
                <div className="p-4 rounded-xl" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)' }}>
                  <p className="text-xs text-gray-400 uppercase mb-1">Destino</p>
                  <p className="text-blue-400 font-medium">{selectedUnidad.cliente_destino}</p>
                </div>
              )}

              {/* Botones */}
              <div className="flex gap-3">
                {selectedUnidad.telefono_efectivo && (
                  
                    href={`tel:${selectedUnidad.telefono_efectivo}`}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors"
                    style={{ background: '#10b981', color: '#fff' }}
                  >
                    <Phone className="w-4 h-4" />
                    Llamar Operador
                  </a>
                )}
                <button
                  onClick={() => openGoogleMaps(selectedUnidad)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors"
                  style={{ background: '#3b82f6', color: '#fff' }}
                >
                  <Map className="w-4 h-4" />
                  Abrir en Google Maps
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VistaClientesCarroll;
