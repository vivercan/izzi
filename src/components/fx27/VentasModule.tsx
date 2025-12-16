import { ModuleTemplate } from './ModuleTemplate';
import { useState, useEffect, useCallback } from 'react';
import { MODULE_IMAGES } from '../../assets/module-images';
import { 
  TrendingUp, DollarSign, Building2, Loader2, Truck, 
  Globe, RefreshCw, Send, Bot, Sparkles, BarChart3
} from 'lucide-react';
import { supabase } from '../../utils/supabase/client';

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════════

interface VentasModuleProps { onBack: () => void; }

interface StatsData {
  total_viajes: number;
  total_ventas: number;
  por_segmento: { [key: string]: { viajes: number; ventas: number } };
  por_empresa: { [key: string]: { viajes: number; ventas: number } };
}

interface TopCliente {
  nombre: string;
  viajes: number;
  ventas: number;
}

interface MesData {
  viajes: number;
  ventas: number;
  impex: number;
  dedicado: number;
}

type Vista = 'dashboard' | 'chat';

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

export function VentasModule({ onBack }: VentasModuleProps) {
  const [vista, setVista] = useState<Vista>('dashboard');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [topClientes, setTopClientes] = useState<TopCliente[]>([]);
  const [datosMensuales, setDatosMensuales] = useState<{ [key: string]: MesData }>({});
  const [ultimaActualizacion, setUltimaActualizacion] = useState<string>('');
  const [yearSeleccionado, setYearSeleccionado] = useState<number>(2025);
  
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────────
  // CARGAR DATOS
  // ─────────────────────────────────────────────────────────────────────────────
  
  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const { data: ultimaFecha } = await supabase
        .from('ventas_maestro')
        .select('fecha_factura')
        .order('fecha_factura', { ascending: false })
        .limit(1)
        .single();
      
      if (ultimaFecha?.fecha_factura) {
        const fecha = new Date(ultimaFecha.fecha_factura);
        setUltimaActualizacion(`Datos al: ${fecha.toLocaleDateString('es-MX')}`);
      }

      const inicioAño = `${yearSeleccionado}-01-01`;
      const finAño = `${yearSeleccionado}-12-31`;

      const { data: ventasData } = await supabase
        .from('ventas_maestro')
        .select('cliente_consolidado, segmento, empresa, ventas, fecha_factura')
        .gte('fecha_factura', inicioAño)
        .lte('fecha_factura', finAño);

      if (ventasData) {
        const totalViajes = ventasData.length;
        const totalVentas = ventasData.reduce((sum, r) => sum + (r.ventas || 0), 0);

        const porSegmento: { [key: string]: { viajes: number; ventas: number } } = {};
        ventasData.forEach(r => {
          const seg = r.segmento || 'SIN_SEGMENTO';
          if (!porSegmento[seg]) porSegmento[seg] = { viajes: 0, ventas: 0 };
          porSegmento[seg].viajes++;
          porSegmento[seg].ventas += r.ventas || 0;
        });

        const porEmpresa: { [key: string]: { viajes: number; ventas: number } } = {};
        ventasData.forEach(r => {
          const emp = r.empresa || 'SIN_EMPRESA';
          if (!porEmpresa[emp]) porEmpresa[emp] = { viajes: 0, ventas: 0 };
          porEmpresa[emp].viajes++;
          porEmpresa[emp].ventas += r.ventas || 0;
        });

        setStats({ total_viajes: totalViajes, total_ventas: totalVentas, por_segmento: porSegmento, por_empresa: porEmpresa });

        const clienteStats: { [key: string]: { viajes: number; ventas: number } } = {};
        ventasData.forEach(r => {
          const cliente = r.cliente_consolidado || 'SIN_CLIENTE';
          if (!clienteStats[cliente]) clienteStats[cliente] = { viajes: 0, ventas: 0 };
          clienteStats[cliente].viajes++;
          clienteStats[cliente].ventas += r.ventas || 0;
        });

        const top10 = Object.entries(clienteStats)
          .map(([nombre, s]) => ({ nombre, ...s }))
          .sort((a, b) => b.ventas - a.ventas)
          .slice(0, 10);

        setTopClientes(top10);

        const porMes: { [key: string]: MesData } = {};
        ventasData.forEach(r => {
          const fecha = new Date(r.fecha_factura);
          const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
          if (!porMes[key]) porMes[key] = { viajes: 0, ventas: 0, impex: 0, dedicado: 0 };
          porMes[key].viajes++;
          porMes[key].ventas += r.ventas || 0;
          if (r.segmento === 'IMPEX') porMes[key].impex += r.ventas || 0;
          if (r.segmento === 'DEDICADO') porMes[key].dedicado += r.ventas || 0;
        });

        setDatosMensuales(porMes);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  }, [yearSeleccionado]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

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
      const { data, error } = await supabase.functions.invoke('ventas-api', {
        body: { action: 'ai_analysis', pregunta, year: yearSeleccionado }
      });

      if (error) throw error;

      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data?.respuesta || 'No pude procesar tu pregunta.' 
      }]);
    } catch (error) {
      console.error('Error IA:', error);
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Error al procesar la pregunta. Intenta de nuevo.' 
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const formatMoney = (n: number) => `$${n.toLocaleString('es-MX')}`;
  const formatNumber = (n: number) => n.toLocaleString('es-MX');
  const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER DASHBOARD
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
        {/* Header */}
        <div className="flex items-center justify-between bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
          <div className="flex items-center gap-4">
            <select
              value={yearSeleccionado}
              onChange={(e) => setYearSeleccionado(Number(e.target.value))}
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500/50 transition-all hover:bg-white/10"
            >
              <option value={2025}>2025</option>
              <option value={2024}>2024</option>
              <option value={2023}>2023</option>
            </select>
            <button onClick={cargarDatos} className="p-2.5 bg-white/5 hover:bg-orange-500/20 rounded-lg transition-all duration-300 group">
              <RefreshCw className="w-5 h-5 text-white/60 group-hover:text-orange-400 transition-colors" />
            </button>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/40">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {ultimaActualizacion}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4">
          <div className="group relative bg-gradient-to-br from-orange-500/20 via-orange-500/10 to-transparent border border-orange-500/20 rounded-xl p-5 overflow-hidden hover:border-orange-500/40 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-orange-500/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
                  <DollarSign className="w-5 h-5 text-orange-400" />
                </div>
                <span className="text-white/60 text-sm">Total Ventas</span>
              </div>
              <div className="text-2xl font-bold text-white">{formatMoney(stats.total_ventas)}</div>
              <div className="text-xs text-white/40 mt-1">MXN</div>
            </div>
          </div>

          <div className="group relative bg-gradient-to-br from-blue-500/20 via-blue-500/10 to-transparent border border-blue-500/20 rounded-xl p-5 overflow-hidden hover:border-blue-500/40 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-blue-500/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
                  <Truck className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-white/60 text-sm">Total Viajes</span>
              </div>
              <div className="text-2xl font-bold text-white">{formatNumber(stats.total_viajes)}</div>
            </div>
          </div>

          <div className="group relative bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-transparent border border-emerald-500/20 rounded-xl p-5 overflow-hidden hover:border-emerald-500/40 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-emerald-500/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
                  <Globe className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-white/60 text-sm">IMPEX</span>
              </div>
              <div className="text-2xl font-bold text-white">{formatMoney(stats.por_segmento?.IMPEX?.ventas || 0)}</div>
              <div className="text-xs text-white/40 mt-1">{formatNumber(stats.por_segmento?.IMPEX?.viajes || 0)} viajes</div>
            </div>
          </div>

          <div className="group relative bg-gradient-to-br from-purple-500/20 via-purple-500/10 to-transparent border border-purple-500/20 rounded-xl p-5 overflow-hidden hover:border-purple-500/40 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-purple-500/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
                  <Truck className="w-5 h-5 text-purple-400" />
                </div>
                <span className="text-white/60 text-sm">DEDICADO</span>
              </div>
              <div className="text-2xl font-bold text-white">{formatMoney(stats.por_segmento?.DEDICADO?.ventas || 0)}</div>
              <div className="text-xs text-white/40 mt-1">{formatNumber(stats.por_segmento?.DEDICADO?.viajes || 0)} viajes</div>
            </div>
          </div>
        </div>

        {/* Top Clientes + Empresas */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.1] transition-all duration-300">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-400" />
              Top 10 Clientes - {yearSeleccionado}
            </h3>
            <div className="space-y-3">
              {topClientes.map((cliente, idx) => (
                <div key={cliente.nombre} className="group flex items-center gap-3 hover:bg-white/[0.02] p-2 -mx-2 rounded-lg transition-all duration-200">
                  <span className="text-white/40 text-sm w-6 group-hover:text-orange-400 transition-colors">{idx + 1}.</span>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-white/80 text-sm truncate max-w-[200px] group-hover:text-white transition-colors">{cliente.nombre}</span>
                      <span className="text-white/60 text-xs group-hover:text-orange-400 transition-colors">{formatMoney(cliente.ventas)}</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all duration-500 group-hover:from-orange-400 group-hover:to-yellow-400"
                        style={{ width: `${(cliente.ventas / maxVentas) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.1] transition-all duration-300">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-400" />
              Por Empresa
            </h3>
            <div className="space-y-4">
              {Object.entries(stats.por_empresa || {}).map(([empresa, data]) => {
                const maxEmpresa = Math.max(...Object.values(stats.por_empresa || {}).map(e => e.ventas), 1);
                const colors: { [key: string]: string } = { 'TROB': 'from-orange-500 to-orange-400', 'WE': 'from-blue-500 to-blue-400', 'SHI': 'from-emerald-500 to-emerald-400' };
                const bgColors: { [key: string]: string } = { 'TROB': 'bg-orange-500/10 border-orange-500/20', 'WE': 'bg-blue-500/10 border-blue-500/20', 'SHI': 'bg-emerald-500/10 border-emerald-500/20' };
                return (
                  <div key={empresa} className={`p-3 rounded-lg border ${bgColors[empresa] || 'bg-white/5 border-white/10'} hover:scale-[1.02] transition-all duration-200`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white font-medium">{empresa}</span>
                      <div className="text-right">
                        <span className="text-white/80">{formatMoney(data.ventas)}</span>
                        <span className="text-white/40 text-xs ml-2">({formatNumber(data.viajes)} viajes)</span>
                      </div>
                    </div>
                    <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full bg-gradient-to-r ${colors[empresa] || 'from-gray-500 to-gray-400'} rounded-full transition-all duration-500`} style={{ width: `${(data.ventas / maxEmpresa) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Gráfica Mensual */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.1] transition-all duration-300">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            Ventas Mensuales - {yearSeleccionado}
          </h3>
          <div className="flex items-end gap-2 h-48">
            {MESES.map((mes, idx) => {
              const key = `${yearSeleccionado}-${String(idx + 1).padStart(2, '0')}`;
              const data = datosMensuales[key] || { ventas: 0 };
              const maxMes = Math.max(...Object.values(datosMensuales).map(d => d.ventas), 1);
              const height = (data.ventas / maxMes) * 100;
              return (
                <div key={mes} className="flex-1 flex flex-col items-center group">
                  <div className="w-full flex flex-col items-center justify-end h-40 relative">
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 border border-white/20 rounded px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {formatMoney(data.ventas)}
                    </div>
                    <div 
                      className="w-full bg-gradient-to-t from-orange-500 to-orange-400 rounded-t-md transition-all duration-300 group-hover:from-orange-400 group-hover:to-yellow-400 group-hover:shadow-lg group-hover:shadow-orange-500/20"
                      style={{ height: `${height}%`, minHeight: data.ventas > 0 ? '4px' : '0' }}
                    />
                  </div>
                  <span className="text-white/40 text-xs mt-2 group-hover:text-white transition-colors">{mes}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER CHAT
  // ═══════════════════════════════════════════════════════════════════════════════

  const renderChat = () => (
    <div className="h-[600px] flex flex-col bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
      <div className="p-4 border-b border-white/[0.06] flex items-center gap-3 bg-gradient-to-r from-orange-500/10 to-purple-500/10">
        <div className="p-2 bg-gradient-to-br from-orange-500/20 to-purple-500/20 rounded-lg">
          <Sparkles className="w-5 h-5 text-orange-400" />
        </div>
        <div>
          <h3 className="text-white font-medium">Análisis IA</h3>
          <p className="text-white/40 text-sm">Pregunta sobre los datos de ventas de Grupo Loma</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.length === 0 && (
          <div className="text-center text-white/40 py-8">
            <Bot className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg mb-2">Pregúntame sobre las ventas</p>
            <p className="text-sm text-white/30 mb-6">Puedo analizar clientes, segmentos, tendencias y más</p>
            <div className="space-y-2 max-w-md mx-auto">
              {['¿Cuál es el cliente más rentable?', 'Compara IMPEX vs DEDICADO', '¿Cómo van las ventas por empresa?', '¿Qué cliente creció más este año?'].map((ejemplo, idx) => (
                <button key={idx} onClick={() => setChatInput(ejemplo)} className="block w-full text-left px-4 py-3 bg-white/5 rounded-lg text-sm hover:bg-white/10 hover:border-orange-500/30 border border-transparent transition-all duration-200">
                  {ejemplo}
                </button>
              ))}
            </div>
          </div>
        )}

        {chatMessages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-xl ${msg.role === 'user' ? 'bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/30 text-white' : 'bg-white/5 border border-white/10 text-white/80'}`}>
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-2 text-orange-400 text-sm">
                  <Bot className="w-4 h-4" />
                  <span>Claude</span>
                </div>
              )}
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}

        {chatLoading && (
          <div className="flex justify-start">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-3 text-white/60">
                <div className="relative">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <div className="absolute inset-0 w-5 h-5 rounded-full border border-orange-500/50 animate-ping" />
                </div>
                <span className="text-sm">Analizando datos...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-white/[0.06] bg-white/[0.01]">
        <div className="flex gap-3">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && enviarPregunta()}
            placeholder="Escribe tu pregunta..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-orange-500/50 focus:bg-white/[0.07] transition-all duration-200"
          />
          <button
            onClick={enviarPregunta}
            disabled={chatLoading || !chatInput.trim()}
            className="px-5 py-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl text-white font-medium hover:from-orange-400 hover:to-orange-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-orange-500/25 active:scale-95"
          >
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
    <ModuleTemplate
      title="Ventas"
      subtitle="Análisis y reportes de ventas Grupo Loma"
      icon={TrendingUp}
      accentColor="orange"
      backgroundImage={MODULE_IMAGES.ventas}
      onBack={onBack}
    >
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setVista('dashboard')}
          className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${vista === 'dashboard' ? 'bg-gradient-to-r from-orange-500/20 to-orange-600/10 text-orange-400 border border-orange-500/30 shadow-lg shadow-orange-500/10' : 'bg-white/5 text-white/60 hover:bg-white/10 border border-transparent'}`}
        >
          <BarChart3 className="w-4 h-4" />
          Dashboard
        </button>
        <button
          onClick={() => setVista('chat')}
          className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${vista === 'chat' ? 'bg-gradient-to-r from-orange-500/20 to-orange-600/10 text-orange-400 border border-orange-500/30 shadow-lg shadow-orange-500/10' : 'bg-white/5 text-white/60 hover:bg-white/10 border border-transparent'}`}
        >
          <Sparkles className="w-4 h-4" />
          Análisis IA
        </button>
      </div>

      {vista === 'dashboard' && renderDashboard()}
      {vista === 'chat' && renderChat()}
    </ModuleTemplate>
  );
}

