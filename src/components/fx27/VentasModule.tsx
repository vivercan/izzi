import { ModuleTemplate } from './ModuleTemplate';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { MODULE_IMAGES } from '../../assets/module-images';
import { TrendingUp, DollarSign, Building2, Loader2, Truck, Globe, RefreshCw, Send, Bot, Sparkles, BarChart3, Filter, X, Users } from 'lucide-react';
import { supabase } from '../../utils/supabase/client';

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 PERMISOS DE USUARIOS - ACTUALIZADOS 18/DIC/2025
// ═══════════════════════════════════════════════════════════════════════════════
const PERMISOS: { [email: string]: { vendedor?: string; verTodo: boolean } } = {
  // ADMINISTRADORES - Ver TODO
  'juan.viveros@trob.com.mx': { verTodo: true },
  'jennifer.sanchez@trob.com.mx': { verTodo: true },
  // CSR - Ver TODO (menos config)
  'customer.service3@trob.com.mx': { verTodo: true },  // Lizeth Rodríguez
  'customer.service1@trob.com.mx': { verTodo: true },  // Elizabeth Rodríguez
  // VENTAS - Solo sus clientes asignados
  'isis.estrada@wexpress.com.mx': { vendedor: 'ISIS', verTodo: false },
  'paloma.oliva@speedyhaul.com.mx': { vendedor: 'PALOMA', verTodo: false },
  // OPERACIONES - NO tienen acceso a Ventas
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 REGLAS DE PROCESAMIENTO - LÓGICA DE NEGOCIO (para futuros uploads)
// ═══════════════════════════════════════════════════════════════════════════════
export const REGLAS_PROCESAMIENTO = {
  // Clientes de ISIS
  CLIENTES_ISIS: ['HERCON', 'ARCH MEAT', 'SUN CHEMICAL', 'BAKERY MACHINERY', 'MARTICO', 'BERRIES PARADISE', 'TITAN MEATS', 'RED ROAD', 'BAK - HERCA'],
  
  // Clientes de PALOMA
  CLIENTES_PALOMA: ['P.A.C.', 'PAC INTERNATIONAL', 'SHORELINE', 'ATLAS EXPEDIT', 'LOGISTEED', 'SCHENKER', 'COMERCIALIZADORA KEES', 'FP GRUPO', 'JA FREIGHT'],
  
  // Consolidaciones de clientes
  CONSOLIDACIONES: {
    "PILGRIM'S PRIDE": ["PILGRIM", "PPC", "AVICOLA PILGRIM"],
    "SIGMA ALIMENTOS": ["SIGMA", "ALIMENTOS FINOS"],
    "BIMBO": ["BIMBO", "MARINELA", "TIA ROSA"],
    "BARCEL": ["BARCEL"], // Separado de BIMBO
    "NATURESWEET": ["NATURESWEET", "NATURESWEET COMERCIALIZADORA", "NATURESWEET INVERNADEROS", "NS BRANDS"],
    "BARRY CALLEBAUT": ["BARRY CALLEBAUT", "BARRY CALLEBAUT MEXICO", "BARRY CALLEBAUT DISTRIBUTORS"],
    "NEXTEER": ["NEXTEER", "STEERINGMEX", "STEERING"],
    "JOHNSON CONTROLS": ["JOHNSON CONTROL", "JCI", "JOHNSON"],
    "CLARIOS": ["CLARIOS", "CLARIOSMTY"],
    "HERCON": ["HERCON SERVICES", "HERCON"],
    "TITAN MEATS": ["TITAN MEATS", "TITAN MEATS LLC"],
    "SHORELINE TRANSFER": ["SHORELINE TRANFER", "SHORELINE TRANSFER", "SHORELINE"],
  },
  
  // Clientes siempre DEDICADO
  CLIENTES_DEDICADO: ['BAFAR', 'NATURESWEET', 'BARCEL', 'GRANJAS CARROLL', 'LALA'],
  
  // Clientes IMPEX (ya no DEDICADO)
  CLIENTES_IMPEX: ['NEXTEER', 'CLARIOS'],
  
  // Empresas internas (no pueden ser clientes)
  EMPRESAS_INTERNAS: ['TROB TRANSPORTES', 'WEXPRESS', 'SPEEDYHAUL', 'TROB', 'WE', 'SHI'],
  
  // Mapeo de empresas
  EMPRESA_MAP: {
    'TROB': 'TROB', 'TROB TRANSPORTES': 'TROB',
    'WE': 'WE', 'WEXPRESS': 'WE',
    'SHI': 'SHI', 'SPEEDYHAUL INTERNATIONAL': 'SHI', 'SPEEDYHAUL': 'SHI',
    'TROB_USA': 'TROB_USA', 'TROB USA': 'TROB_USA',
  },
  
  // Regla especial NEXTEER: QRO↔TAMAULIPAS = IMPO/EXPO
  NEXTEER_RUTAS: {
    'TAMAULIPAS_QUERETARO': 'IMPO',
    'QUERETARO_TAMAULIPAS': 'EXPO',
  },
  
  // Eliminar PILGRIM's NAC
  ELIMINAR_PILGRIM_NAC: true,
};

interface VentasModuleProps { onBack: () => void; userEmail?: string; }
interface Filtros { segmento: string; tipo: string; empresa: string; clientes: string[]; tractos: string[]; }
interface StatsData { total_viajes: number; total_ventas: number; por_segmento: { [k: string]: { viajes: number; ventas: number } }; por_empresa: { [k: string]: { viajes: number; ventas: number } }; }

const FILTROS_INIT: Filtros = { segmento: '', tipo: '', empresa: '', clientes: [], tractos: [] };

export function VentasModule({ onBack, userEmail = '' }: VentasModuleProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [year, setYear] = useState(2025);
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_INIT);
  const [filtrosOpen, setFiltrosOpen] = useState(false);
  const [vista, setVista] = useState<'dashboard' | 'chat'>('dashboard');
  const [ultimaAct, setUltimaAct] = useState('');
  const [topClientes, setTopClientes] = useState<{nombre: string; viajes: number; ventas: number}[]>([]);
  const [clientesDisponibles, setClientesDisponibles] = useState<string[]>([]);

  // Chat IA
  const [chatMsgs, setChatMsgs] = useState<{role: string; content: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Obtener permisos del usuario
  const permisoUsuario = useMemo(() => {
    const permiso = PERMISOS[userEmail.toLowerCase()];
    if (!permiso) return { verTodo: true }; // Default: admin
    return permiso;
  }, [userEmail]);

  const vendedorFiltro = permisoUsuario.vendedor || '';
  const esAdmin = permisoUsuario.verTodo;

  // Cargar datos
  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('ventas_maestro').select('*').eq('year', year);
      
      // 🔐 Filtro por vendedor (ISIS/PALOMA solo ven sus clientes)
      if (!esAdmin && vendedorFiltro) {
        query = query.eq('vendedor', vendedorFiltro);
      }
      
      // Filtros adicionales
      if (filtros.segmento) query = query.eq('segmento', filtros.segmento);
      if (filtros.tipo) query = query.eq('tipo', filtros.tipo);
      if (filtros.empresa) query = query.eq('empresa', filtros.empresa);
      if (filtros.clientes.length > 0) query = query.in('cliente_consolidado', filtros.clientes);
      if (filtros.tractos.length > 0) query = query.in('tracto', filtros.tractos);

      const { data, error } = await query;
      if (error) throw error;

      // Procesar stats
      const statsCalc: StatsData = {
        total_viajes: data?.length || 0,
        total_ventas: data?.reduce((sum, r) => sum + (r.ventas || 0), 0) || 0,
        por_segmento: {},
        por_empresa: {},
      };

      data?.forEach(r => {
        const seg = r.segmento || 'OTRO';
        const emp = r.empresa || 'OTRO';
        if (!statsCalc.por_segmento[seg]) statsCalc.por_segmento[seg] = { viajes: 0, ventas: 0 };
        if (!statsCalc.por_empresa[emp]) statsCalc.por_empresa[emp] = { viajes: 0, ventas: 0 };
        statsCalc.por_segmento[seg].viajes++;
        statsCalc.por_segmento[seg].ventas += r.ventas || 0;
        statsCalc.por_empresa[emp].viajes++;
        statsCalc.por_empresa[emp].ventas += r.ventas || 0;
      });

      setStats(statsCalc);

      // Top clientes
      const clienteMap: { [k: string]: { viajes: number; ventas: number } } = {};
      data?.forEach(r => {
        const c = r.cliente_consolidado || 'DESCONOCIDO';
        if (!clienteMap[c]) clienteMap[c] = { viajes: 0, ventas: 0 };
        clienteMap[c].viajes++;
        clienteMap[c].ventas += r.ventas || 0;
      });
      const top = Object.entries(clienteMap)
        .map(([nombre, d]) => ({ nombre, ...d }))
        .sort((a, b) => b.ventas - a.ventas)
        .slice(0, 10);
      setTopClientes(top);

      // Clientes disponibles para filtros
      const clientes = [...new Set(data?.map(r => r.cliente_consolidado).filter(Boolean))].sort();
      setClientesDisponibles(clientes as string[]);

      setUltimaAct(new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.error('Error cargando datos:', err);
    } finally {
      setLoading(false);
    }
  }, [year, filtros, esAdmin, vendedorFiltro]);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const nFiltros = useMemo(() => {
    let n = 0;
    if (filtros.segmento) n++;
    if (filtros.tipo) n++;
    if (filtros.empresa) n++;
    if (filtros.clientes.length > 0) n++;
    if (filtros.tractos.length > 0) n++;
    return n;
  }, [filtros]);

  const formatMoney = (n: number) => {
    if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
    return `$${n.toLocaleString()}`;
  };

  // Chat con Claude
  const enviarChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMsgs(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatLoading(true);

    try {
      const contexto = `
Eres un asistente de análisis de ventas para Grupo Loma Transportes (TROB, SHI, WE, TROB_USA).
Datos actuales (${year}):
- Total viajes: ${stats?.total_viajes?.toLocaleString()}
- Ventas totales: ${formatMoney(stats?.total_ventas || 0)}
- Por segmento: ${JSON.stringify(stats?.por_segmento)}
- Por empresa: ${JSON.stringify(stats?.por_empresa)}
- Top 10 clientes: ${JSON.stringify(topClientes)}

REGLAS DE NEGOCIO IMPORTANTES:
- CLIENTES ISIS: ${REGLAS_PROCESAMIENTO.CLIENTES_ISIS.join(', ')}
- CLIENTES PALOMA: ${REGLAS_PROCESAMIENTO.CLIENTES_PALOMA.join(', ')}
- CLIENTES DEDICADO: ${REGLAS_PROCESAMIENTO.CLIENTES_DEDICADO.join(', ')}
- CLIENTES IMPEX: ${REGLAS_PROCESAMIENTO.CLIENTES_IMPEX.join(', ')}
- NEXTEER (antes STEERINGMEX): rutas QRO↔Tamaulipas son IMPO/EXPO
- PILGRIM's NAC se elimina (solo IMPO/EXPO)

Usuario: ${userEmail} (${esAdmin ? 'Admin - ve todo' : `Vendedor  - solo sus clientes`})

Responde de forma concisa y útil. Si te preguntan por análisis, usa los datos disponibles.
`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY || '', 
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          system: contexto,
          messages: [...chatMsgs.map(m => ({ role: m.role, content: m.content })), { role: 'user', content: userMsg }]
        })
      });

      const data = await response.json();
      const assistantMsg = data.content?.[0]?.text || 'Error al procesar respuesta';
      setChatMsgs(prev => [...prev, { role: 'assistant', content: assistantMsg }]);
    } catch (err) {
      console.error('Error chat:', err);
      setChatMsgs(prev => [...prev, { role: 'assistant', content: 'Error de conexión con IA. Verifica la API key.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Dashboard
  const Dashboard = () => (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-xl p-4 border border-blue-500/20">
          <div className="flex items-center gap-2 text-blue-400 text-xs mb-1"><Truck className="w-4 h-4" />Viajes</div>
          <div className="text-2xl font-bold text-white">{stats?.total_viajes?.toLocaleString() || 0}</div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-xl p-4 border border-emerald-500/20">
          <div className="flex items-center gap-2 text-emerald-400 text-xs mb-1"><DollarSign className="w-4 h-4" />Ventas</div>
          <div className="text-2xl font-bold text-white">{formatMoney(stats?.total_ventas || 0)}</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-xl p-4 border border-purple-500/20">
          <div className="flex items-center gap-2 text-purple-400 text-xs mb-1"><Globe className="w-4 h-4" />IMPEX</div>
          <div className="text-2xl font-bold text-white">{stats?.por_segmento?.['IMPEX']?.viajes?.toLocaleString() || 0}</div>
          <div className="text-xs text-white/50">{formatMoney(stats?.por_segmento?.['IMPEX']?.ventas || 0)}</div>
        </div>
        <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-xl p-4 border border-orange-500/20">
          <div className="flex items-center gap-2 text-orange-400 text-xs mb-1"><Building2 className="w-4 h-4" />DEDICADO</div>
          <div className="text-2xl font-bold text-white">{stats?.por_segmento?.['DEDICADO']?.viajes?.toLocaleString() || 0}</div>
          <div className="text-xs text-white/50">{formatMoney(stats?.por_segmento?.['DEDICADO']?.ventas || 0)}</div>
        </div>
      </div>

      {/* Por empresa */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
        <h3 className="text-sm font-medium text-white/70 mb-3 flex items-center gap-2"><Building2 className="w-4 h-4" />Por Empresa</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(stats?.por_empresa || {}).sort((a, b) => b[1].ventas - a[1].ventas).map(([emp, d]) => (
            <div key={emp} className="bg-white/5 rounded-lg p-3">
              <div className="text-xs text-white/50">{emp}</div>
              <div className="text-lg font-bold text-white">{d.viajes.toLocaleString()}</div>
              <div className="text-xs text-emerald-400">{formatMoney(d.ventas)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Top clientes */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
        <h3 className="text-sm font-medium text-white/70 mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4" />Top 10 Clientes</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
          {topClientes.map((c, i) => (
            <div key={c.nombre} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
              <span className="text-xs text-white/30 w-5">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white truncate">{c.nombre}</div>
                <div className="text-xs text-white/50">{c.viajes} viajes</div>
              </div>
              <div className="text-sm font-medium text-emerald-400">{formatMoney(c.ventas)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Info vendedor (solo si no es admin) */}
      {!esAdmin && vendedorFiltro && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 text-orange-400">
            <Users className="w-4 h-4" />
            <span className="text-sm">Mostrando solo clientes asignados a <strong>{vendedorFiltro}</strong></span>
          </div>
        </div>
      )}
    </div>
  );

  // Chat IA
  const Chat = () => (
    <div className="flex flex-col h-[500px] bg-white/5 rounded-xl border border-white/10">
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-white/10">
        {chatMsgs.length === 0 && (
          <div className="text-center text-white/30 py-8">
            <Bot className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Pregunta sobre tus ventas...</p>
            <p className="text-xs mt-2">Ejemplos: "¿Cuál es mi mejor cliente?" • "Compara IMPEX vs DEDICADO" • "¿Cómo va TROB vs SHI?"</p>
          </div>
        )}
        {chatMsgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-xl px-4 py-2 ${m.role === 'user' ? 'bg-orange-500/20 text-white' : 'bg-white/10 text-white/90'}`}>
              <p className="text-sm whitespace-pre-wrap">{m.content}</p>
            </div>
          </div>
        ))}
        {chatLoading && (
          <div className="flex justify-start">
            <div className="bg-white/10 rounded-xl px-4 py-2">
              <Loader2 className="w-4 h-4 animate-spin text-white/50" />
            </div>
          </div>
        )}
      </div>
      <div className="border-t border-white/10 p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && enviarChat()}
            placeholder="Escribe tu pregunta..."
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-orange-500/50"
          />
          <button onClick={enviarChat} disabled={chatLoading} className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-4 py-2 transition-colors disabled:opacity-50">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  // Modal filtros
  const FiltrosModal = () => (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setFiltrosOpen(false)}>
      <div className="bg-[#1a1a2e] rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-lg font-medium text-white">Filtros</h3>
          <button onClick={() => setFiltrosOpen(false)} className="text-white/50 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
          <div>
            <label className="text-xs text-white/50 mb-1 block">Segmento</label>
            <select value={filtros.segmento} onChange={e => setFiltros(f => ({ ...f, segmento: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
              <option value="">Todos</option>
              <option value="IMPEX">IMPEX</option>
              <option value="DEDICADO">DEDICADO</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">Tipo</label>
            <select value={filtros.tipo} onChange={e => setFiltros(f => ({ ...f, tipo: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
              <option value="">Todos</option>
              <option value="IMPO">IMPO</option>
              <option value="EXPO">EXPO</option>
              <option value="NAC">NAC</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">Empresa</label>
            <select value={filtros.empresa} onChange={e => setFiltros(f => ({ ...f, empresa: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
              <option value="">Todas</option>
              <option value="TROB">TROB</option>
              <option value="SHI">SHI</option>
              <option value="WE">WE</option>
              <option value="TROB_USA">TROB USA</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">Clientes ({filtros.clientes.length})</label>
            <div className="bg-white/5 border border-white/10 rounded-lg max-h-32 overflow-y-auto">
              {clientesDisponibles.slice(0, 50).map(c => (
                <label key={c} className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 cursor-pointer">
                  <input type="checkbox" checked={filtros.clientes.includes(c)} onChange={e => {
                    if (e.target.checked) setFiltros(f => ({ ...f, clientes: [...f.clientes, c] }));
                    else setFiltros(f => ({ ...f, clientes: f.clientes.filter(x => x !== c) }));
                  }} className="rounded border-white/20" />
                  <span className="text-xs text-white/70 truncate">{c}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-white/10 flex gap-2">
          <button onClick={() => { setFiltros(FILTROS_INIT); setFiltrosOpen(false); }} className="flex-1 bg-white/5 hover:bg-white/10 text-white/70 rounded-lg py-2 text-sm">Limpiar</button>
          <button onClick={() => setFiltrosOpen(false)} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-lg py-2 text-sm">Aplicar</button>
        </div>
      </div>
    </div>
  );

  return (
    <ModuleTemplate title="Ventas" subtitle={esAdmin ? "Dashboard General" : `Clientes ${vendedorFiltro}`} onBack={onBack} backgroundImage={MODULE_IMAGES.ventas}>
      {filtrosOpen && <FiltrosModal />}
      
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setVista('dashboard')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${vista === 'dashboard' ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}>
            <BarChart3 className="w-3.5 h-3.5" />Dashboard
          </button>
          <button onClick={() => setVista('chat')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${vista === 'chat' ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}>
            <Sparkles className="w-3.5 h-3.5" />IA
          </button>
        </div>
        <div className="flex items-center gap-2">
          <select value={year} onChange={e => setYear(Number(e.target.value))} className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-xs">
            {[2025, 2024, 2023, 2022].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={() => setFiltrosOpen(true)} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs ${nFiltros ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}>
            <Filter className="w-3.5 h-3.5" />Filtros{nFiltros > 0 && <span className="bg-orange-500 text-white text-[9px] px-1.5 rounded-full">{nFiltros}</span>}
          </button>
          <button onClick={cargarDatos} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg"><RefreshCw className={`w-3.5 h-3.5 text-white/50 ${loading ? 'animate-spin' : ''}`} /></button>
          <span className="text-[10px] text-white/30 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{ultimaAct}</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>
      ) : vista === 'dashboard' ? <Dashboard /> : <Chat />}
    </ModuleTemplate>
  );
}

export default VentasModule;

