import { ModuleTemplate } from './ModuleTemplate';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { MODULE_IMAGES } from '../../assets/module-images';
import { 
  TrendingUp, DollarSign, Building2, Loader2, Truck, Globe, RefreshCw, 
  Send, Bot, Sparkles, BarChart3, Calendar, Filter, X, ChevronDown,
  Users, MapPin, Package, Gauge, Search
} from 'lucide-react';
import { supabase } from '../../utils/supabase/client';

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════════

interface VentasModuleProps { onBack: () => void; }

interface Filtros {
  fechaInicio: string;
  fechaFin: string;
  segmento: string;
  tipo: string;
  empresa: string;
  cliente: string;
  tracto: string;
  operador: string;
  estadoOrigen: string;
  estadoDestino: string;
}

interface StatsData {
  total_viajes: number;
  total_ventas: number;
  total_kms: number;
  por_segmento: { [key: string]: { viajes: number; ventas: number } };
  por_empresa: { [key: string]: { viajes: number; ventas: number } };
  por_tipo: { [key: string]: { viajes: number; ventas: number } };
}

interface TopItem { nombre: string; viajes: number; ventas: number; }

type Vista = 'dashboard' | 'chat';

const FILTROS_INICIALES: Filtros = {
  fechaInicio: '', fechaFin: '', segmento: '', tipo: '', empresa: '',
  cliente: '', tracto: '', operador: '', estadoOrigen: '', estadoDestino: '',
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

export function VentasModule({ onBack }: VentasModuleProps) {
  const [vista, setVista] = useState<Vista>('dashboard');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [topClientes, setTopClientes] = useState<TopItem[]>([]);
  const [topTractos, setTopTractos] = useState<TopItem[]>([]);
  const [topOperadores, setTopOperadores] = useState<TopItem[]>([]);
  const [datosMensuales, setDatosMensuales] = useState<{ [key: string]: { viajes: number; ventas: number } }>({});
  const [ultimaActualizacion, setUltimaActualizacion] = useState('');
  
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_INICIALES);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [yearSeleccionado, setYearSeleccionado] = useState(2025);
  
  const [opcionesTractos, setOpcionesTractos] = useState<string[]>([]);
  const [opcionesEstados, setOpcionesEstados] = useState<string[]>([]);
  
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────────
  // CARGAR OPCIONES PARA FILTROS
  // ─────────────────────────────────────────────────────────────────────────────

  const cargarOpciones = useCallback(async () => {
    const { data: tractos } = await supabase.from('ventas_maestro').select('tracto').not('tracto', 'is', null);
    if (tractos) setOpcionesTractos([...new Set(tractos.map(t => t.tracto))].filter(Boolean).sort());

    const { data: estados } = await supabase.from('ventas_maestro').select('estado_origen, estado_destino');
    if (estados) {
      const todos = [...estados.map(e => e.estado_origen), ...estados.map(e => e.estado_destino)].filter(Boolean);
      setOpcionesEstados([...new Set(todos)].sort());
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // CARGAR DATOS
  // ─────────────────────────────────────────────────────────────────────────────
  
  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const { data: ultimaFecha } = await supabase
        .from('ventas_maestro').select('fecha_factura')
        .order('fecha_factura', { ascending: false }).limit(1).single();
      
      if (ultimaFecha?.fecha_factura) {
        setUltimaActualizacion(`Datos al: ${new Date(ultimaFecha.fecha_factura).toLocaleDateString('es-MX')}`);
      }

      let query = supabase.from('ventas_maestro').select('*');
      query = query.gte('fecha_factura', `${yearSeleccionado}-01-01`).lte('fecha_factura', `${yearSeleccionado}-12-31`);

      if (filtros.fechaInicio) query = query.gte('fecha_factura', filtros.fechaInicio);
      if (filtros.fechaFin) query = query.lte('fecha_factura', filtros.fechaFin);
      if (filtros.segmento) query = query.eq('segmento', filtros.segmento);
      if (filtros.tipo) query = query.eq('tipo', filtros.tipo);
      if (filtros.empresa) query = query.eq('empresa', filtros.empresa);
      if (filtros.cliente) query = query.ilike('cliente_consolidado', `%${filtros.cliente}%`);
      if (filtros.tracto) query = query.eq('tracto', filtros.tracto);
      if (filtros.operador) query = query.ilike('operador', `%${filtros.operador}%`);
      if (filtros.estadoOrigen) query = query.eq('estado_origen', filtros.estadoOrigen);
      if (filtros.estadoDestino) query = query.eq('estado_destino', filtros.estadoDestino);

      const { data: ventasData } = await query;

      if (ventasData) {
        const totalViajes = ventasData.length;
        const totalVentas = ventasData.reduce((sum, r) => sum + (r.ventas || 0), 0);
        const totalKms = ventasData.reduce((sum, r) => sum + (r.kms_viaje || 0), 0);

        const porSegmento: any = {}; const porEmpresa: any = {}; const porTipo: any = {};
        
        ventasData.forEach(r => {
          const seg = r.segmento || 'SIN'; const emp = r.empresa || 'SIN'; const tipo = r.tipo || 'NAC';
          if (!porSegmento[seg]) porSegmento[seg] = { viajes: 0, ventas: 0 };
          if (!porEmpresa[emp]) porEmpresa[emp] = { viajes: 0, ventas: 0 };
          if (!porTipo[tipo]) porTipo[tipo] = { viajes: 0, ventas: 0 };
          porSegmento[seg].viajes++; porSegmento[seg].ventas += r.ventas || 0;
          porEmpresa[emp].viajes++; porEmpresa[emp].ventas += r.ventas || 0;
          porTipo[tipo].viajes++; porTipo[tipo].ventas += r.ventas || 0;
        });

        setStats({ total_viajes: totalViajes, total_ventas: totalVentas, total_kms: totalKms, por_segmento: porSegmento, por_empresa: porEmpresa, por_tipo: porTipo });

        // Top clientes
        const clienteStats: any = {};
        ventasData.forEach(r => {
          const c = r.cliente_consolidado || 'SIN';
          if (!clienteStats[c]) clienteStats[c] = { viajes: 0, ventas: 0 };
          clienteStats[c].viajes++; clienteStats[c].ventas += r.ventas || 0;
        });
        setTopClientes(Object.entries(clienteStats).map(([nombre, s]: any) => ({ nombre, ...s })).sort((a, b) => b.ventas - a.ventas).slice(0, 10));

        // Top tractos
        const tractoStats: any = {};
        ventasData.forEach(r => {
          const t = r.tracto; if (!t) return;
          if (!tractoStats[t]) tractoStats[t] = { viajes: 0, ventas: 0 };
          tractoStats[t].viajes++; tractoStats[t].ventas += r.ventas || 0;
        });
        setTopTractos(Object.entries(tractoStats).map(([nombre, s]: any) => ({ nombre, ...s })).sort((a, b) => b.ventas - a.ventas).slice(0, 10));

        // Top operadores
        const opStats: any = {};
        ventasData.forEach(r => {
          const o = r.operador; if (!o) return;
          if (!opStats[o]) opStats[o] = { viajes: 0, ventas: 0 };
          opStats[o].viajes++; opStats[o].ventas += r.ventas || 0;
        });
        setTopOperadores(Object.entries(opStats).map(([nombre, s]: any) => ({ nombre, ...s })).sort((a, b) => b.ventas - a.ventas).slice(0, 10));

        // Por mes
        const porMes: any = {};
        ventasData.forEach(r => {
          if (!r.fecha_factura) return;
          const key = r.fecha_factura.substring(0, 7);
          if (!porMes[key]) porMes[key] = { viajes: 0, ventas: 0 };
          porMes[key].viajes++; porMes[key].ventas += r.ventas || 0;
        });
        setDatosMensuales(porMes);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [yearSeleccionado, filtros]);

  useEffect(() => { cargarOpciones(); }, [cargarOpciones]);
  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  // ─────────────────────────────────────────────────────────────────────────────
  // CHAT IA
  // ─────────────────────────────────────────────────────────────────────────────

  const enviarPregunta = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const pregunta = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: pregunta }]);
    setChatLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ventas-api', { body: { action: 'ai_analysis', pregunta, year: yearSeleccionado } });
      if (error) throw error;
      setChatMessages(prev => [...prev, { role: 'assistant', content: data?.respuesta || 'No pude procesar tu pregunta.' }]);
    } catch (error) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Error al procesar la pregunta.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────────────────────

  const formatMoney = (n: number) => `$${n.toLocaleString('es-MX')}`;
  const formatNumber = (n: number) => n.toLocaleString('es-MX');
  const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const limpiarFiltros = () => setFiltros(FILTROS_INICIALES);
  const filtrosActivos = useMemo(() => Object.values(filtros).filter(Boolean).length, [filtros]);

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER: FILTROS
  // ═══════════════════════════════════════════════════════════════════════════════

  const renderFiltros = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
        <div className="flex items-center gap-4">
          <select value={yearSeleccionado} onChange={(e) => setYearSeleccionado(Number(e.target.value))}
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500/50">
            {[2025, 2024, 2023, 2022, 2021].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={() => setFiltrosAbiertos(!filtrosAbiertos)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${filtrosAbiertos || filtrosActivos > 0 ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}>
            <Filter className="w-4 h-4" /> Filtros
            {filtrosActivos > 0 && <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">{filtrosActivos}</span>}
          </button>
          <button onClick={cargarDatos} className="p-2.5 bg-white/5 hover:bg-orange-500/20 rounded-lg transition-all group">
            <RefreshCw className="w-5 h-5 text-white/60 group-hover:text-orange-400" />
          </button>
        </div>
        <div className="flex items-center gap-2 text-sm text-white/40">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          {ultimaActualizacion}
        </div>
      </div>

      {filtrosAbiertos && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 space-y-4">
          <div className="grid grid-cols-6 gap-4">
            <div className="col-span-2">
              <label className="text-white/40 text-xs mb-1 block">Fecha Inicio</label>
              <input type="date" value={filtros.fechaInicio} onChange={(e) => setFiltros({ ...filtros, fechaInicio: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500/50" />
            </div>
            <div className="col-span-2">
              <label className="text-white/40 text-xs mb-1 block">Fecha Fin</label>
              <input type="date" value={filtros.fechaFin} onChange={(e) => setFiltros({ ...filtros, fechaFin: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500/50" />
            </div>
            <div>
              <label className="text-white/40 text-xs mb-1 block">Segmento</label>
              <select value={filtros.segmento} onChange={(e) => setFiltros({ ...filtros, segmento: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500/50">
                <option value="">Todos</option><option value="IMPEX">IMPEX</option><option value="DEDICADO">DEDICADO</option>
              </select>
            </div>
            <div>
              <label className="text-white/40 text-xs mb-1 block">Tipo Viaje</label>
              <select value={filtros.tipo} onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500/50">
                <option value="">Todos</option><option value="IMPO">Importación</option><option value="EXPO">Exportación</option><option value="NAC">Nacional</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-4">
            <div>
              <label className="text-white/40 text-xs mb-1 block">Empresa</label>
              <select value={filtros.empresa} onChange={(e) => setFiltros({ ...filtros, empresa: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500/50">
                <option value="">Todas</option><option value="TROB">TROB</option><option value="WE">WE</option><option value="SHI">SHI</option>
              </select>
            </div>
            <div>
              <label className="text-white/40 text-xs mb-1 block">Cliente</label>
              <input type="text" value={filtros.cliente} onChange={(e) => setFiltros({ ...filtros, cliente: e.target.value })} placeholder="Buscar..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 focus:outline-none focus:border-orange-500/50" />
            </div>
            <div>
              <label className="text-white/40 text-xs mb-1 block">Tracto</label>
              <select value={filtros.tracto} onChange={(e) => setFiltros({ ...filtros, tracto: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500/50">
                <option value="">Todos</option>
                {opcionesTractos.slice(0, 100).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-white/40 text-xs mb-1 block">Operador</label>
              <input type="text" value={filtros.operador} onChange={(e) => setFiltros({ ...filtros, operador: e.target.value })} placeholder="Buscar..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 focus:outline-none focus:border-orange-500/50" />
            </div>
            <div className="flex items-end gap-2">
              <button onClick={limpiarFiltros} className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-red-500/20 text-white/60 hover:text-red-400 rounded-lg transition-all text-sm">
                <X className="w-4 h-4" /> Limpiar
              </button>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="text-white/40 text-xs mb-1 block">Estado Origen</label>
              <select value={filtros.estadoOrigen} onChange={(e) => setFiltros({ ...filtros, estadoOrigen: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500/50">
                <option value="">Todos</option>
                {opcionesEstados.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label className="text-white/40 text-xs mb-1 block">Estado Destino</label>
              <select value={filtros.estadoDestino} onChange={(e) => setFiltros({ ...filtros, estadoDestino: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500/50">
                <option value="">Todos</option>
                {opcionesEstados.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER: DASHBOARD
  // ═══════════════════════════════════════════════════════════════════════════════

  const renderDashboard = () => {
    if (loading || !stats) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="relative">
            <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
            <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-orange-500/20 animate-ping" />
          </div>
          <span className="ml-4 text-white/60 text-lg">Cargando datos...</span>
        </div>
      );
    }

    const maxVentas = Math.max(...topClientes.map(c => c.ventas), 1);

    return (
      <div className="space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-gradient-to-br from-orange-500/20 to-transparent border border-orange-500/20 rounded-xl p-5 hover:border-orange-500/40 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-orange-500/20 rounded-lg"><DollarSign className="w-5 h-5 text-orange-400" /></div>
              <span className="text-white/60 text-sm">Total Ventas</span>
            </div>
            <div className="text-2xl font-bold text-white">{formatMoney(stats.total_ventas)}</div>
          </div>
          <div className="bg-gradient-to-br from-blue-500/20 to-transparent border border-blue-500/20 rounded-xl p-5 hover:border-blue-500/40 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-blue-500/20 rounded-lg"><Truck className="w-5 h-5 text-blue-400" /></div>
              <span className="text-white/60 text-sm">Total Viajes</span>
            </div>
            <div className="text-2xl font-bold text-white">{formatNumber(stats.total_viajes)}</div>
          </div>
          <div className="bg-gradient-to-br from-emerald-500/20 to-transparent border border-emerald-500/20 rounded-xl p-5 hover:border-emerald-500/40 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-emerald-500/20 rounded-lg"><Globe className="w-5 h-5 text-emerald-400" /></div>
              <span className="text-white/60 text-sm">IMPEX</span>
            </div>
            <div className="text-xl font-bold text-white">{formatMoney(stats.por_segmento?.IMPEX?.ventas || 0)}</div>
            <div className="text-xs text-white/40 mt-1">{formatNumber(stats.por_segmento?.IMPEX?.viajes || 0)} viajes</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500/20 to-transparent border border-purple-500/20 rounded-xl p-5 hover:border-purple-500/40 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-purple-500/20 rounded-lg"><Package className="w-5 h-5 text-purple-400" /></div>
              <span className="text-white/60 text-sm">DEDICADO</span>
            </div>
            <div className="text-xl font-bold text-white">{formatMoney(stats.por_segmento?.DEDICADO?.ventas || 0)}</div>
            <div className="text-xs text-white/40 mt-1">{formatNumber(stats.por_segmento?.DEDICADO?.viajes || 0)} viajes</div>
          </div>
          <div className="bg-gradient-to-br from-cyan-500/20 to-transparent border border-cyan-500/20 rounded-xl p-5 hover:border-cyan-500/40 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-cyan-500/20 rounded-lg"><Gauge className="w-5 h-5 text-cyan-400" /></div>
              <span className="text-white/60 text-sm">Kilómetros</span>
            </div>
            <div className="text-xl font-bold text-white">{formatNumber(Math.round(stats.total_kms))}</div>
            <div className="text-xs text-white/40 mt-1">km recorridos</div>
          </div>
        </div>

        {/* Por Tipo */}
        <div className="grid grid-cols-3 gap-4">
          {['IMPO', 'EXPO', 'NAC'].map((tipo, idx) => {
            const data = stats.por_tipo?.[tipo] || { viajes: 0, ventas: 0 };
            const colors = ['from-amber-500/20 border-amber-500/20', 'from-teal-500/20 border-teal-500/20', 'from-indigo-500/20 border-indigo-500/20'];
            const textColors = ['text-amber-400', 'text-teal-400', 'text-indigo-400'];
            const labels = ['Importación', 'Exportación', 'Nacional'];
            return (
              <div key={tipo} className={`bg-gradient-to-br ${colors[idx]} to-transparent border rounded-xl p-4 hover:scale-[1.02] transition-transform`}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`text-sm font-medium ${textColors[idx]}`}>{labels[idx]}</span>
                    <div className="text-lg font-bold text-white mt-1">{formatMoney(data.ventas)}</div>
                    <div className="text-xs text-white/40">{formatNumber(data.viajes)} viajes</div>
                  </div>
                  <MapPin className={`w-8 h-8 ${textColors[idx]} opacity-50`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Grid: Clientes + Empresa + Tractos */}
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-400" /> Top 10 Clientes
            </h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {topClientes.map((c, i) => (
                <div key={c.nombre} className="flex items-center gap-3 group">
                  <span className="text-white/40 text-sm w-6">{i + 1}.</span>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-white/80 text-sm truncate max-w-[150px] group-hover:text-orange-400 transition-colors">{c.nombre}</span>
                      <span className="text-white/60 text-xs">{formatMoney(c.ventas)}</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full" style={{ width: `${(c.ventas / maxVentas) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-400" /> Por Empresa
            </h3>
            <div className="space-y-4">
              {Object.entries(stats.por_empresa || {}).map(([empresa, data]) => {
                const max = Math.max(...Object.values(stats.por_empresa || {}).map(e => e.ventas), 1);
                const colors: any = { 'TROB': 'from-orange-500 to-orange-400', 'WE': 'from-blue-500 to-blue-400', 'SHI': 'from-emerald-500 to-emerald-400' };
                return (
                  <div key={empresa}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white font-medium">{empresa}</span>
                      <div className="text-right">
                        <span className="text-white/80">{formatMoney(data.ventas)}</span>
                        <span className="text-white/40 text-xs ml-2">({formatNumber(data.viajes)})</span>
                      </div>
                    </div>
                    <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full bg-gradient-to-r ${colors[empresa] || 'from-gray-500 to-gray-400'} rounded-full`} style={{ width: `${(data.ventas / max) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5 text-cyan-400" /> Top 10 Tractos
            </h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {topTractos.length === 0 ? <p className="text-white/40 text-sm">Sin datos</p> : topTractos.map((t, i) => {
                const max = Math.max(...topTractos.map(x => x.ventas), 1);
                return (
                  <div key={t.nombre} className="flex items-center gap-3 group">
                    <span className="text-white/40 text-sm w-6">{i + 1}.</span>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-white/80 text-sm font-mono group-hover:text-cyan-400 transition-colors">#{t.nombre}</span>
                        <span className="text-white/60 text-xs">{formatNumber(t.viajes)} viajes</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full" style={{ width: `${(t.ventas / max) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top Operadores */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" /> Top 10 Operadores
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {topOperadores.map((o, i) => {
              const max = Math.max(...topOperadores.map(x => x.ventas), 1);
              return (
                <div key={o.nombre} className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-lg hover:bg-white/[0.04] transition-colors group">
                  <span className="text-white/40 text-sm w-6">{i + 1}.</span>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-white/80 text-sm truncate max-w-[200px] group-hover:text-purple-400 transition-colors">{o.nombre}</span>
                      <span className="text-white/60 text-xs">{formatMoney(o.ventas)}</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full" style={{ width: `${(o.ventas / max) * 100}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gráfica mensual */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-orange-400" /> Ventas Mensuales - {yearSeleccionado}
          </h3>
          <div className="flex items-end gap-2 h-48">
            {MESES.map((mes, idx) => {
              const key = `${yearSeleccionado}-${String(idx + 1).padStart(2, '0')}`;
              const data = datosMensuales[key] || { ventas: 0 };
              const max = Math.max(...Object.values(datosMensuales).map(d => d.ventas), 1);
              const height = max > 0 ? (data.ventas / max) * 100 : 0;
              return (
                <div key={mes} className="flex-1 flex flex-col items-center group">
                  <div className="w-full flex flex-col items-center justify-end h-40 relative">
                    <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                      {formatMoney(data.ventas)}
                    </div>
                    <div className="w-full bg-gradient-to-t from-orange-500 to-orange-400 rounded-t-md transition-all hover:from-orange-400 hover:to-orange-300 cursor-pointer"
                      style={{ height: `${height}%`, minHeight: data.ventas > 0 ? '4px' : '0' }} />
                  </div>
                  <span className="text-white/40 text-xs mt-2">{mes}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER: CHAT
  // ═══════════════════════════════════════════════════════════════════════════════

  const renderChat = () => (
    <div className="h-[600px] flex flex-col bg-white/[0.02] border border-white/[0.06] rounded-xl">
      <div className="p-4 border-b border-white/[0.06] flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-orange-500/20 to-purple-500/20 rounded-lg">
          <Sparkles className="w-5 h-5 text-orange-400" />
        </div>
        <div>
          <h3 className="text-white font-medium">Análisis IA</h3>
          <p className="text-white/40 text-sm">Pregunta sobre los datos de ventas</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.length === 0 && (
          <div className="text-center text-white/40 py-8">
            <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Pregúntame sobre las ventas</p>
            <div className="mt-4 space-y-2 max-w-md mx-auto">
              {['¿Cuál es el cliente más rentable?', 'Compara IMPEX vs DEDICADO', '¿Qué tracto tiene más viajes?'].map((ej, i) => (
                <button key={i} onClick={() => setChatInput(ej)} className="block w-full text-left px-3 py-2 bg-white/5 rounded-lg text-sm hover:bg-white/10 transition-colors">{ej}</button>
              ))}
            </div>
          </div>
        )}
        {chatMessages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-xl ${msg.role === 'user' ? 'bg-orange-500/20 border border-orange-500/30 text-white' : 'bg-white/5 border border-white/10 text-white/80'}`}>
              {msg.role === 'assistant' && <div className="flex items-center gap-2 mb-2 text-orange-400 text-sm"><Bot className="w-4 h-4" /><span>Claude</span></div>}
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {chatLoading && (
          <div className="flex justify-start">
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <div className="flex items-center gap-2 text-white/60"><Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm">Analizando...</span></div>
            </div>
          </div>
        )}
      </div>
      <div className="p-4 border-t border-white/[0.06]">
        <div className="flex gap-2">
          <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && enviarPregunta()} placeholder="Escribe tu pregunta..."
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-orange-500/50" />
          <button onClick={enviarPregunta} disabled={chatLoading || !chatInput.trim()}
            className="px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg text-white font-medium hover:from-orange-400 hover:to-orange-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER PRINCIPAL
  // ═══════════════════════════════════════════════════════════════════════════════

  return (
    <ModuleTemplate title="Ventas" subtitle="Análisis y reportes de ventas Grupo Loma" icon={TrendingUp} accentColor="orange" backgroundImage={MODULE_IMAGES.ventas} onBack={onBack}>
      <div className="flex gap-2 mb-6">
        <button onClick={() => setVista('dashboard')} className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${vista === 'dashboard' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}>
          <BarChart3 className="w-4 h-4" /> Dashboard
        </button>
        <button onClick={() => setVista('chat')} className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${vista === 'chat' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}>
          <Sparkles className="w-4 h-4" /> Análisis IA
        </button>
      </div>
      {renderFiltros()}
      <div className="mt-6">
        {vista === 'dashboard' && renderDashboard()}
        {vista === 'chat' && renderChat()}
      </div>
    </ModuleTemplate>
  );
}

export default VentasModule;
