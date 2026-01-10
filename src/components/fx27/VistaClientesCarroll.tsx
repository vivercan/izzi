import { useState, useEffect } from 'react';
import { ArrowLeft, Truck, MapPin, Clock, Phone, RefreshCw, Navigation, Gauge, Search, Filter } from 'lucide-react';
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
  ubicacion: string;
  ultima_actualizacion: string;
  estado_geo: string;
  viaje_id: number | null;
  cliente_destino: string | null;
  hora_cita_destino: string | null;
  viaje_estado: string | null;
  operador_efectivo: string;
}

export const VistaClientesCarroll = ({ onBack }: VistaClientesCarrollProps) => {
  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('todos');
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
    enViaje: unidades.filter(u => u.viaje_id).length,
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

  return (
    <div className="min-h-screen" style={{ background: '#0B1220' }}>
      {/* Header Compacto */}
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

      {/* Stats + Filtros */}
      <div className="px-4 py-3 border-b flex items-center justify-between gap-4" style={{ borderColor: '#1e293b' }}>
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
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar eco..."
              className="pl-9 pr-3 py-2 rounded-lg text-sm text-white"
              style={{ background: '#1e293b', border: '1px solid #334155', width: '160px' }}
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

      {/* Tabla */}
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
                <tr key={u.economico} className="border-b hover:bg-slate-800/50 transition-colors" style={{ borderColor: '#1e293b' }}>
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
                    <div className="flex items-center gap-1 max-w-[300px]">
                      <MapPin className="w-3 h-3 text-gray-500 flex-shrink-0" />
                      <span className="text-gray-400 text-sm truncate">{u.ubicacion || '-'}</span>
                    </div>
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
    </div>
  );
};

export default VistaClientesCarroll;
