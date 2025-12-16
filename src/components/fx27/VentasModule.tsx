import { ModuleTemplate } from './ModuleTemplate';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { MODULE_IMAGES } from '../../assets/module-images';
import { 
  TrendingUp, DollarSign, Building2, Loader2, Truck, Globe, RefreshCw, 
  Send, Bot, Sparkles, BarChart3, Filter, X, Users, MapPin, Package, Gauge, Check
} from 'lucide-react';
import { supabase } from '../../utils/supabase/client';

interface VentasModuleProps { onBack: () => void; }
interface Filtros { fechaInicio: string; fechaFin: string; segmento: string; tipo: string; empresa: string; clientes: string[]; tractos: string[]; estadoOrigen: string; estadoDestino: string; }
interface StatsData { total_viajes: number; total_ventas: number; total_kms: number; por_segmento: { [k: string]: { viajes: number; ventas: number } }; por_empresa: { [k: string]: { viajes: number; ventas: number } }; por_tipo: { [k: string]: { viajes: number; ventas: number } }; }
interface TopItem { nombre: string; viajes: number; ventas: number; }
type Vista = 'dashboard' | 'chat';

const FILTROS_INIT: Filtros = { fechaInicio: '', fechaFin: '', segmento: '', tipo: '', empresa: '', clientes: [], tractos: [], estadoOrigen: '', estadoDestino: '' };

// Multi-Select Component
function MultiSelect({ label, options, selected, onChange, placeholder }: { label: string; options: string[]; selected: string[]; onChange: (v: string[]) => void; placeholder: string; }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, []);
  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));
  const toggle = (item: string) => { if (selected.includes(item)) onChange(selected.filter(s => s !== item)); else onChange([...selected, item]); };
  return (
    <div ref={ref} className="relative">
      <label className="text-white/40 text-xs mb-1 block">{label}</label>
      <div onClick={() => setOpen(!open)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm cursor-pointer hover:border-white/20 flex items-center justify-between">
        <span className={selected.length ? 'text-white' : 'text-white/30'}>{selected.length ? `${selected.length} seleccionados` : placeholder}</span>
        <span className="text-white/40 text-xs">▼</span>
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-slate-900 border border-white/10 rounded-lg shadow-xl max-h-52 overflow-hidden">
          <div className="p-2 border-b border-white/10">
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white placeholder-white/30 focus:outline-none" onClick={(e) => e.stopPropagation()} />
          </div>
          <div className="overflow-y-auto max-h-40 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {selected.length > 0 && <button onClick={() => onChange([])} className="w-full px-3 py-1.5 text-left text-xs text-red-400 hover:bg-white/5 border-b border-white/10">✕ Limpiar</button>}
            {filtered.slice(0, 80).map(item => (
              <div key={item} onClick={() => toggle(item)} className={`px-3 py-1.5 text-sm cursor-pointer flex items-center gap-2 hover:bg-white/5 ${selected.includes(item) ? 'bg-orange-500/10 text-orange-400' : 'text-white/70'}`}>
                <div className={`w-3.5 h-3.5 rounded border ${selected.includes(item) ? 'bg-orange-500 border-orange-500' : 'border-white/20'} flex items-center justify-center`}>
                  {selected.includes(item) && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
                <span className="truncate text-xs">{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function VentasModule({ onBack }: VentasModuleProps) {
  const [vista, setVista] = useState<Vista>('dashboard');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [topClientes, setTopClientes] = useState<TopItem[]>([]);
  const [topTractos, setTopTractos] = useState<TopItem[]>([]);
  const [topOperadores, setTopOperadores] = useState<TopItem[]>([]);
  const [datosMensuales, setDatosMensuales] = useState<{ [k: string]: { viajes: number; ventas: number } }>({});
  const [ultimaAct, setUltimaAct] = useState('');
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_INIT);
  const [filtrosOpen, setFiltrosOpen] = useState(false);
  const [year, setYear] = useState(2025);
  const [opClientes, setOpClientes] = useState<string[]>([]);
  const [opTractos, setOpTractos] = useState<string[]>([]);
  const [opEstados, setOpEstados] = useState<string[]>([]);
  const [chatMsgs, setChatMsgs] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [chatIn, setChatIn] = useState('');
  const [chatLoad, setChatLoad] = useState(false);

  const cargarOpciones = useCallback(async () => {
    const { data: c } = await supabase.from('ventas_maestro').select('cliente_consolidado').not('cliente_consolidado', 'is', null);
    if (c) setOpClientes([...new Set(c.map(x => x.cliente_consolidado))].filter(Boolean).sort());
    const { data: t } = await supabase.from('ventas_maestro').select('tracto').not('tracto', 'is', null);
    if (t) setOpTractos([...new Set(t.map(x => x.tracto))].filter(Boolean).sort());
    const { data: e } = await supabase.from('ventas_maestro').select('estado_origen, estado_destino');
    if (e) setOpEstados([...new Set([...e.map(x => x.estado_origen), ...e.map(x => x.estado_destino)].filter(Boolean))].sort());
  }, []);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const { data: uf } = await supabase.from('ventas_maestro').select('fecha_factura').order('fecha_factura', { ascending: false }).limit(1).single();
      if (uf?.fecha_factura) setUltimaAct(`Datos al: ${new Date(uf.fecha_factura).toLocaleDateString('es-MX')}`);
      let q = supabase.from('ventas_maestro').select('*').gte('fecha_factura', `${year}-01-01`).lte('fecha_factura', `${year}-12-31`);
      if (filtros.fechaInicio) q = q.gte('fecha_factura', filtros.fechaInicio);
      if (filtros.fechaFin) q = q.lte('fecha_factura', filtros.fechaFin);
      if (filtros.segmento) q = q.eq('segmento', filtros.segmento);
      if (filtros.tipo) q = q.eq('tipo', filtros.tipo);
      if (filtros.empresa) q = q.eq('empresa', filtros.empresa);
      if (filtros.estadoOrigen) q = q.eq('estado_origen', filtros.estadoOrigen);
      if (filtros.estadoDestino) q = q.eq('estado_destino', filtros.estadoDestino);
      const { data: vd } = await q;
      if (vd) {
        let d = vd;
        if (filtros.clientes.length) d = d.filter(x => filtros.clientes.includes(x.cliente_consolidado));
        if (filtros.tractos.length) d = d.filter(x => filtros.tractos.includes(x.tracto));
        const tv = d.length, tven = d.reduce((s, r) => s + (r.ventas || 0), 0), tkm = d.reduce((s, r) => s + (r.kms_viaje || 0), 0);
        const pSeg: any = {}, pEmp: any = {}, pTipo: any = {};
        d.forEach(r => { const sg = r.segmento || 'SIN', em = r.empresa || 'SIN', tp = r.tipo || 'NAC'; if (!pSeg[sg]) pSeg[sg] = { viajes: 0, ventas: 0 }; if (!pEmp[em]) pEmp[em] = { viajes: 0, ventas: 0 }; if (!pTipo[tp]) pTipo[tp] = { viajes: 0, ventas: 0 }; pSeg[sg].viajes++; pSeg[sg].ventas += r.ventas || 0; pEmp[em].viajes++; pEmp[em].ventas += r.ventas || 0; pTipo[tp].viajes++; pTipo[tp].ventas += r.ventas || 0; });
        setStats({ total_viajes: tv, total_ventas: tven, total_kms: tkm, por_segmento: pSeg, por_empresa: pEmp, por_tipo: pTipo });
        const cs: any = {}; d.forEach(r => { const c = r.cliente_consolidado || 'SIN'; if (!cs[c]) cs[c] = { viajes: 0, ventas: 0 }; cs[c].viajes++; cs[c].ventas += r.ventas || 0; });
        setTopClientes(Object.entries(cs).map(([n, s]: any) => ({ nombre: n, ...s })).sort((a, b) => b.ventas - a.ventas).slice(0, 10));
        const ts: any = {}; d.forEach(r => { const t = r.tracto; if (!t) return; if (!ts[t]) ts[t] = { viajes: 0, ventas: 0 }; ts[t].viajes++; ts[t].ventas += r.ventas || 0; });
        setTopTractos(Object.entries(ts).map(([n, s]: any) => ({ nombre: n, ...s })).sort((a, b) => b.ventas - a.ventas).slice(0, 10));
        const os: any = {}; d.forEach(r => { const o = r.operador; if (!o) return; if (!os[o]) os[o] = { viajes: 0, ventas: 0 }; os[o].viajes++; os[o].ventas += r.ventas || 0; });
        setTopOperadores(Object.entries(os).map(([n, s]: any) => ({ nombre: n, ...s })).sort((a, b) => b.ventas - a.ventas).slice(0, 10));
        const pm: any = {}; d.forEach(r => { if (!r.fecha_factura) return; const k = r.fecha_factura.substring(0, 7); if (!pm[k]) pm[k] = { viajes: 0, ventas: 0 }; pm[k].viajes++; pm[k].ventas += r.ventas || 0; });
        setDatosMensuales(pm);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [year, filtros]);

  useEffect(() => { cargarOpciones(); }, [cargarOpciones]);
  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const enviarChat = async () => {
    if (!chatIn.trim() || chatLoad) return;
    const p = chatIn.trim(); setChatIn(''); setChatMsgs(m => [...m, { role: 'user', content: p }]); setChatLoad(true);
    try { const { data } = await supabase.functions.invoke('ventas-api', { body: { action: 'ai_analysis', pregunta: p, year } }); setChatMsgs(m => [...m, { role: 'assistant', content: data?.respuesta || 'Error' }]); } catch { setChatMsgs(m => [...m, { role: 'assistant', content: 'Error' }]); } finally { setChatLoad(false); }
  };

  const fmt = (n: number) => `$${n.toLocaleString('es-MX')}`;
  const fmtN = (n: number) => n.toLocaleString('es-MX');
  const MES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const limpiar = () => setFiltros(FILTROS_INIT);
  const nFiltros = useMemo(() => [filtros.fechaInicio, filtros.fechaFin, filtros.segmento, filtros.tipo, filtros.empresa, filtros.clientes.length, filtros.tractos.length, filtros.estadoOrigen, filtros.estadoDestino].filter(Boolean).length, [filtros]);

  // Modal Filtros
  const ModalFiltros = () => filtrosOpen ? (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16" onClick={() => setFiltrosOpen(false)}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-slate-900/95 border border-white/10 rounded-xl p-4 w-[650px] shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-medium text-sm flex items-center gap-2"><Filter className="w-4 h-4 text-orange-400" />Filtros</h3>
          <button onClick={() => setFiltrosOpen(false)} className="p-1 hover:bg-white/10 rounded"><X className="w-4 h-4 text-white/60" /></button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><label className="text-white/40 text-xs mb-1 block">Fecha Inicio</label><input type="date" value={filtros.fechaInicio} onChange={e => setFiltros({ ...filtros, fechaInicio: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-orange-500/50" /></div>
          <div><label className="text-white/40 text-xs mb-1 block">Fecha Fin</label><input type="date" value={filtros.fechaFin} onChange={e => setFiltros({ ...filtros, fechaFin: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-orange-500/50" /></div>
          <div><label className="text-white/40 text-xs mb-1 block">Segmento</label><select value={filtros.segmento} onChange={e => setFiltros({ ...filtros, segmento: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none"><option value="">Todos</option><option value="IMPEX">IMPEX</option><option value="DEDICADO">DEDICADO</option></select></div>
          <div><label className="text-white/40 text-xs mb-1 block">Tipo</label><select value={filtros.tipo} onChange={e => setFiltros({ ...filtros, tipo: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none"><option value="">Todos</option><option value="IMPO">IMPO</option><option value="EXPO">EXPO</option><option value="NAC">NAC</option></select></div>
          <div><label className="text-white/40 text-xs mb-1 block">Empresa</label><select value={filtros.empresa} onChange={e => setFiltros({ ...filtros, empresa: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none"><option value="">Todas</option><option value="TROB">TROB</option><option value="WE">WE</option><option value="SHI">SHI</option></select></div>
          <div><label className="text-white/40 text-xs mb-1 block">Edo Origen</label><select value={filtros.estadoOrigen} onChange={e => setFiltros({ ...filtros, estadoOrigen: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none"><option value="">Todos</option>{opEstados.map(x => <option key={x} value={x}>{x}</option>)}</select></div>
          <div><label className="text-white/40 text-xs mb-1 block">Edo Destino</label><select value={filtros.estadoDestino} onChange={e => setFiltros({ ...filtros, estadoDestino: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none"><option value="">Todos</option>{opEstados.map(x => <option key={x} value={x}>{x}</option>)}</select></div>
          <MultiSelect label="Clientes" options={opClientes} selected={filtros.clientes} onChange={v => setFiltros({ ...filtros, clientes: v })} placeholder="Seleccionar..." />
          <MultiSelect label="Tractos" options={opTractos} selected={filtros.tractos} onChange={v => setFiltros({ ...filtros, tractos: v })} placeholder="Seleccionar..." />
        </div>
        <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-white/10">
          <button onClick={limpiar} className="px-3 py-1.5 bg-white/5 hover:bg-red-500/20 text-white/60 hover:text-red-400 rounded-lg text-xs flex items-center gap-1"><X className="w-3 h-3" />Limpiar</button>
          <button onClick={() => { cargarDatos(); setFiltrosOpen(false); }} className="px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg text-xs font-medium">Aplicar</button>
        </div>
      </div>
    </div>
  ) : null;

  // Dashboard
  const Dashboard = () => {
    if (loading || !stats) return <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /><span className="ml-2 text-white/50 text-sm">Cargando...</span></div>;
    const mx = Math.max(...topClientes.map(c => c.ventas), 1);
    return (
      <div className="space-y-3">
        {/* KPIs */}
        <div className="grid grid-cols-5 gap-2">
          <div className="bg-gradient-to-br from-orange-500/15 to-transparent border border-orange-500/20 rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 mb-0.5"><DollarSign className="w-3.5 h-3.5 text-orange-400" /><span className="text-white/50 text-[10px]">Total Ventas</span></div>
            <div className="text-lg font-bold text-white">{fmt(stats.total_ventas)}</div>
          </div>
          <div className="bg-gradient-to-br from-blue-500/15 to-transparent border border-blue-500/20 rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 mb-0.5"><Truck className="w-3.5 h-3.5 text-blue-400" /><span className="text-white/50 text-[10px]">Total Viajes</span></div>
            <div className="text-lg font-bold text-white">{fmtN(stats.total_viajes)}</div>
          </div>
          <div className="bg-gradient-to-br from-emerald-500/15 to-transparent border border-emerald-500/20 rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 mb-0.5"><Globe className="w-3.5 h-3.5 text-emerald-400" /><span className="text-white/50 text-[10px]">IMPEX</span></div>
            <div className="text-base font-bold text-white">{fmt(stats.por_segmento?.IMPEX?.ventas || 0)}</div>
            <div className="text-[9px] text-white/40">{fmtN(stats.por_segmento?.IMPEX?.viajes || 0)} viajes</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500/15 to-transparent border border-purple-500/20 rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 mb-0.5"><Package className="w-3.5 h-3.5 text-purple-400" /><span className="text-white/50 text-[10px]">DEDICADO</span></div>
            <div className="text-base font-bold text-white">{fmt(stats.por_segmento?.DEDICADO?.ventas || 0)}</div>
            <div className="text-[9px] text-white/40">{fmtN(stats.por_segmento?.DEDICADO?.viajes || 0)} viajes</div>
          </div>
          <div className="bg-gradient-to-br from-cyan-500/15 to-transparent border border-cyan-500/20 rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 mb-0.5"><Gauge className="w-3.5 h-3.5 text-cyan-400" /><span className="text-white/50 text-[10px]">Kilómetros</span></div>
            <div className="text-base font-bold text-white">{fmtN(Math.round(stats.total_kms))}</div>
            <div className="text-[9px] text-white/40">km recorridos</div>
          </div>
        </div>
        {/* Por Tipo */}
        <div className="grid grid-cols-3 gap-2">
          {[['IMPO', 'Importación', 'amber'], ['EXPO', 'Exportación', 'teal'], ['NAC', 'Nacional', 'indigo']].map(([t, l, c]) => {
            const d = stats.por_tipo?.[t] || { viajes: 0, ventas: 0 };
            return <div key={t} className={`bg-gradient-to-br from-${c}-500/15 to-transparent border border-${c}-500/20 rounded-lg p-2.5`}>
              <span className={`text-${c}-400 text-xs font-medium`}>{l}</span>
              <div className="text-sm font-bold text-white mt-0.5">{fmt(d.ventas)}</div>
              <div className="text-[9px] text-white/40">{fmtN(d.viajes)} viajes</div>
            </div>;
          })}
        </div>
        {/* Grid 3 cols */}
        <div className="grid grid-cols-3 gap-3">
          {/* Top Clientes */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3">
            <h3 className="text-sm font-medium text-white mb-2 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-orange-400" />Top 10 Clientes</h3>
            <div className="space-y-1.5 max-h-52 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
              {topClientes.map((c, i) => (
                <div key={c.nombre} className="flex items-center gap-2">
                  <span className="text-white/30 text-[10px] w-4">{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-white/70 text-[11px] truncate max-w-[100px]">{c.nombre}</span>
                      <span className="text-white/50 text-[10px]">{fmt(c.ventas)}</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full" style={{ width: `${(c.ventas / mx) * 100}%` }} /></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Por Empresa */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3">
            <h3 className="text-sm font-medium text-white mb-2 flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-blue-400" />Por Empresa</h3>
            <div className="space-y-2">
              {Object.entries(stats.por_empresa || {}).map(([e, d]) => {
                const mxE = Math.max(...Object.values(stats.por_empresa || {}).map(x => x.ventas), 1);
                const col: any = { TROB: 'orange', WE: 'blue', SHI: 'emerald' };
                return <div key={e}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-white text-xs font-medium">{e}</span>
                    <span className="text-white/60 text-[10px]">{fmt(d.ventas)} <span className="text-white/30">({fmtN(d.viajes)})</span></span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden"><div className={`h-full bg-gradient-to-r from-${col[e] || 'gray'}-500 to-${col[e] || 'gray'}-400 rounded-full`} style={{ width: `${(d.ventas / mxE) * 100}%` }} /></div>
                </div>;
              })}
            </div>
          </div>
          {/* Top Tractos */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3">
            <h3 className="text-sm font-medium text-white mb-2 flex items-center gap-1.5"><Truck className="w-3.5 h-3.5 text-cyan-400" />Top 10 Tractos</h3>
            <div className="space-y-1.5 max-h-52 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
              {topTractos.length === 0 ? <p className="text-white/30 text-xs">Sin datos</p> : topTractos.map((t, i) => {
                const mxT = Math.max(...topTractos.map(x => x.ventas), 1);
                return <div key={t.nombre} className="flex items-center gap-2">
                  <span className="text-white/30 text-[10px] w-4">{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-white/70 text-[11px] font-mono">#{t.nombre}</span>
                      <span className="text-white/50 text-[10px]">{fmtN(t.viajes)} vjs</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full" style={{ width: `${(t.ventas / mxT) * 100}%` }} /></div>
                  </div>
                </div>;
              })}
            </div>
          </div>
        </div>
        {/* Top Operadores */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3">
          <h3 className="text-sm font-medium text-white mb-2 flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-purple-400" />Top 10 Operadores</h3>
          <div className="grid grid-cols-2 gap-2">
            {topOperadores.map((o, i) => {
              const mxO = Math.max(...topOperadores.map(x => x.ventas), 1);
              return <div key={o.nombre} className="flex items-center gap-2 p-2 bg-white/[0.02] rounded-lg">
                <span className="text-white/30 text-[10px] w-4">{i + 1}.</span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-white/70 text-[10px] truncate max-w-[140px]">{o.nombre}</span>
                    <span className="text-white/50 text-[9px]">{fmt(o.ventas)}</span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full" style={{ width: `${(o.ventas / mxO) * 100}%` }} /></div>
                </div>
              </div>;
            })}
          </div>
        </div>
        {/* Gráfica mensual */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3">
          <h3 className="text-sm font-medium text-white mb-2 flex items-center gap-1.5"><BarChart3 className="w-3.5 h-3.5 text-orange-400" />Ventas Mensuales - {year}</h3>
          <div className="flex items-end gap-1 h-32">
            {MES.map((m, i) => {
              const k = `${year}-${String(i + 1).padStart(2, '0')}`;
              const d = datosMensuales[k] || { ventas: 0 };
              const mxM = Math.max(...Object.values(datosMensuales).map(x => x.ventas), 1);
              const h = mxM > 0 ? (d.ventas / mxM) * 100 : 0;
              return <div key={m} className="flex-1 flex flex-col items-center group">
                <div className="w-full flex flex-col items-center justify-end h-24 relative">
                  <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap z-10">{fmt(d.ventas)}</div>
                  <div className="w-full bg-gradient-to-t from-orange-500 to-orange-400 rounded-t transition-all hover:from-orange-400 cursor-pointer" style={{ height: `${h}%`, minHeight: d.ventas > 0 ? '2px' : '0' }} />
                </div>
                <span className="text-white/30 text-[9px] mt-1">{m}</span>
              </div>;
            })}
          </div>
        </div>
      </div>
    );
  };

  // Chat
  const Chat = () => (
    <div className="h-[450px] flex flex-col bg-white/[0.02] border border-white/[0.06] rounded-lg">
      <div className="p-3 border-b border-white/[0.06] flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-orange-400" />
        <span className="text-white text-sm font-medium">Análisis IA</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-white/10">
        {chatMsgs.length === 0 && <div className="text-center text-white/30 py-6"><Bot className="w-8 h-8 mx-auto mb-2 opacity-50" /><p className="text-xs">Pregunta sobre las ventas</p></div>}
        {chatMsgs.map((m, i) => <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[80%] p-2 rounded-lg text-xs ${m.role === 'user' ? 'bg-orange-500/20 text-white' : 'bg-white/5 text-white/80'}`}>{m.content}</div></div>)}
        {chatLoad && <div className="flex justify-start"><div className="bg-white/5 rounded-lg p-2 flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /><span className="text-xs text-white/50">Analizando...</span></div></div>}
      </div>
      <div className="p-3 border-t border-white/[0.06] flex gap-2">
        <input type="text" value={chatIn} onChange={e => setChatIn(e.target.value)} onKeyDown={e => e.key === 'Enter' && enviarChat()} placeholder="Escribe tu pregunta..." className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs placeholder-white/30 focus:outline-none" />
        <button onClick={enviarChat} disabled={chatLoad || !chatIn.trim()} className="px-3 py-2 bg-orange-500/20 rounded-lg text-orange-400 disabled:opacity-50"><Send className="w-4 h-4" /></button>
      </div>
    </div>
  );

  return (
    <ModuleTemplate title="Ventas" subtitle="Análisis Grupo Loma" icon={TrendingUp} accentColor="orange" backgroundImage={MODULE_IMAGES.ventas} onBack={onBack}>
      <ModalFiltros />
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-2">
          <button onClick={() => setVista('dashboard')} className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 ${vista === 'dashboard' ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}><BarChart3 className="w-3.5 h-3.5" />Dashboard</button>
          <button onClick={() => setVista('chat')} className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 ${vista === 'chat' ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}><Sparkles className="w-3.5 h-3.5" />IA</button>
        </div>
        <div className="flex items-center gap-2">
          <select value={year} onChange={e => setYear(Number(e.target.value))} className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-xs">{[2025, 2024, 2023, 2022, 2021].map(y => <option key={y} value={y}>{y}</option>)}</select>
          <button onClick={() => setFiltrosOpen(true)} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs ${nFiltros ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}>
            <Filter className="w-3.5 h-3.5" />Filtros{nFiltros > 0 && <span className="bg-orange-500 text-white text-[9px] px-1.5 rounded-full">{nFiltros}</span>}
          </button>
          <button onClick={cargarDatos} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg"><RefreshCw className="w-3.5 h-3.5 text-white/50" /></button>
          <span className="text-[10px] text-white/30 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{ultimaAct}</span>
        </div>
      </div>
      {vista === 'dashboard' ? <Dashboard /> : <Chat />}
    </ModuleTemplate>
  );
}

export default VentasModule;
