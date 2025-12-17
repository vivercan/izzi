import { ModuleTemplate } from './ModuleTemplate';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { MODULE_IMAGES } from '../../assets/module-images';
import { TrendingUp, DollarSign, Building2, Loader2, Truck, Globe, RefreshCw, Send, Bot, Sparkles, BarChart3, Filter, X, Package, Gauge, Check } from 'lucide-react';
import { supabase } from '../../utils/supabase/client';

interface VentasModuleProps { onBack: () => void; }
interface Filtros { fechaInicio: string; fechaFin: string; segmento: string; tipo: string; empresa: string; clientes: string[]; tractos: string[]; cajas: string[]; estadoOrigen: string; estadoDestino: string; vendedor: string; division: string; kmsMin: string; kmsMax: string; }
interface StatsData { total_viajes: number; total_ventas: number; total_kms: number; por_segmento: { [k: string]: { viajes: number; ventas: number } }; por_empresa: { [k: string]: { viajes: number; ventas: number } }; por_tipo: { [k: string]: { viajes: number; ventas: number } }; }
interface TopItem { nombre: string; viajes: number; ventas: number; }

// Obtener primer y último día del mes actual
const getDefaultDateRange = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  return {
    fechaInicio: firstDay.toISOString().split('T')[0],
    fechaFin: lastDay.toISOString().split('T')[0]
  };
};

const defaultDates = getDefaultDateRange();
const FILTROS_INIT: Filtros = { 
  fechaInicio: defaultDates.fechaInicio, 
  fechaFin: defaultDates.fechaFin, 
  segmento: '', tipo: '', empresa: '', clientes: [], tractos: [], cajas: [], estadoOrigen: '', estadoDestino: '', vendedor: '', division: '', kmsMin: '', kmsMax: '' 
};

// ═══════════════════════════════════════════════════════════════════════════
// 📋 PERMISOS VENTAS - DEBE COINCIDIR CON App.tsx
// ═══════════════════════════════════════════════════════════════════════════
// | Usuario            | Correo                          | Acceso Ventas     |
// |--------------------|--------------------------------|-------------------|
// | Juan Viveros       | juan.viveros@trob.com.mx       | Ver TODO          |
// | Jennifer Sánchez   | jennifer.sanchez@trob.com.mx   | Ver TODO          |
// | Lizeth Rodríguez   | customer.service3@trob.com.mx  | Ver TODO (CSR)    |
// | Elizabeth Rodríguez| customer.service1@trob.com.mx  | Ver TODO (CSR)    |
// | Isis Estrada       | isis.estrada@wexpress.com.mx   | Solo clientes ISIS|
// | Paloma Oliva       | paloma.oliva@speedyhaul.com.mx | Solo clientes PALOMA|
// | Jaime Soto         | jaime.soto@trob.com.mx         | SIN ACCESO (Op)   |
// | José Rodríguez     | jose.rodriguez@trob.com.mx     | SIN ACCESO (Op)   |
// | Marcos Pineda      | marcos.pineda@trob.com.mx      | SIN ACCESO (Op)   |
// ═══════════════════════════════════════════════════════════════════════════
const PERMISOS: { [email: string]: { vendedor?: string; verTodo: boolean } } = {
  // ADMIN - Ver TODO
  'juan.viveros@trob.com.mx': { verTodo: true },
  'jennifer.sanchez@trob.com.mx': { verTodo: true },
  // CSR - Ver TODO
  'customer.service3@trob.com.mx': { verTodo: true },
  'customer.service1@trob.com.mx': { verTodo: true },
  // VENTAS - Solo sus clientes (filtro por ejecutivo_ventas en BD)
  'isis.estrada@wexpress.com.mx': { vendedor: 'ISIS', verTodo: false },
  'paloma.oliva@speedyhaul.com.mx': { vendedor: 'PALOMA', verTodo: false },
  // OPERACIONES - No aparecen aquí porque no tienen acceso a este módulo
};

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
        <span className={selected.length ? 'text-white' : 'text-white/30'}>{selected.length ? `${selected.length} sel.` : placeholder}</span>
        <span className="text-white/40 text-xs">▼</span>
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-slate-900 border border-white/10 rounded-lg shadow-xl max-h-48 overflow-hidden">
          <div className="p-2 border-b border-white/10">
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white placeholder-white/30 focus:outline-none" onClick={(e) => e.stopPropagation()} />
          </div>
          <div className="overflow-y-auto max-h-36 scrollbar-thin scrollbar-thumb-white/10">
            {selected.length > 0 && <button onClick={() => onChange([])} className="w-full px-3 py-1 text-left text-xs text-red-400 hover:bg-white/5 border-b border-white/10">✕ Limpiar</button>}
            {filtered.slice(0, 50).map(item => (
              <div key={item} onClick={() => toggle(item)} className={`px-3 py-1 text-xs cursor-pointer flex items-center gap-2 hover:bg-white/5 ${selected.includes(item) ? 'bg-orange-500/10 text-orange-400' : 'text-white/70'}`}>
                <div className={`w-3 h-3 rounded border ${selected.includes(item) ? 'bg-orange-500 border-orange-500' : 'border-white/20'} flex items-center justify-center`}>
                  {selected.includes(item) && <Check className="w-2 h-2 text-white" />}
                </div>
                <span className="truncate">{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function VentasModule({ onBack }: VentasModuleProps) {
  const [vista, setVista] = useState<'dashboard' | 'chat'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [topClientes, setTopClientes] = useState<TopItem[]>([]);
  const [topTractos, setTopTractos] = useState<TopItem[]>([]);
  const [topCajas, setTopCajas] = useState<TopItem[]>([]);
  const [datosMensuales, setDatosMensuales] = useState<{ [k: string]: { viajes: number; ventas: number } }>({});
  const [ultimaAct, setUltimaAct] = useState('');
  const [filtrosAplicados, setFiltrosAplicados] = useState<Filtros>(FILTROS_INIT);
  const [filtrosTemp, setFiltrosTemp] = useState<Filtros>(FILTROS_INIT);
  const [filtrosOpen, setFiltrosOpen] = useState(false);
  const [year, setYear] = useState(2025);
  const [yearAplicado, setYearAplicado] = useState(2025);
  const [opClientes, setOpClientes] = useState<string[]>([]);
  const [opTractos, setOpTractos] = useState<string[]>([]);
  const [opCajas, setOpCajas] = useState<string[]>([]);
  const [opEstados, setOpEstados] = useState<string[]>([]);
  const [chatMsgs, setChatMsgs] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [chatIn, setChatIn] = useState('');
  const [chatLoad, setChatLoad] = useState(false);
  const [userPermisos, setUserPermisos] = useState<{ vendedor?: string; verTodo: boolean }>({ verTodo: true });
  const [moneda, setMoneda] = useState<'MXN' | 'USD'>('MXN');

  useEffect(() => {
    const getUser = () => {
      // Obtener usuario de localStorage (no de Supabase Auth)
      const session = localStorage.getItem('fx27-session');
      if (session) {
        try {
          const { email } = JSON.parse(session);
          if (email) {
            const p = PERMISOS[email] || { verTodo: false };
            console.log('📧 Usuario logueado:', email, '- Permisos:', p);
            setUserPermisos(p);
            if (p.vendedor && !p.verTodo) {
              setFiltrosAplicados(prev => ({ ...prev, vendedor: p.vendedor! }));
              setFiltrosTemp(prev => ({ ...prev, vendedor: p.vendedor! }));
            }
          }
        } catch (e) {
          console.error('Error parsing session:', e);
        }
      }
    };
    getUser();
  }, []);

  const cargarOpciones = useCallback(async () => {
    const { data: c } = await supabase.from('ventas_maestro').select('cliente_consolidado').not('cliente_consolidado', 'is', null);
    if (c) setOpClientes([...new Set(c.map(x => x.cliente_consolidado))].filter(Boolean).sort());
    const { data: t } = await supabase.from('ventas_maestro').select('tracto').not('tracto', 'is', null);
    if (t) setOpTractos([...new Set(t.map(x => x.tracto))].filter(Boolean).sort());
    const { data: ca } = await supabase.from('ventas_maestro').select('caja').not('caja', 'is', null);
    if (ca) setOpCajas([...new Set(ca.map(x => x.caja))].filter(Boolean).sort());
    const { data: e } = await supabase.from('ventas_maestro').select('estado_origen, estado_destino');
    if (e) setOpEstados([...new Set([...e.map(x => x.estado_origen), ...e.map(x => x.estado_destino)].filter(Boolean))].sort());
  }, []);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const { data: uf } = await supabase.from('ventas_maestro').select('fecha_factura').order('fecha_factura', { ascending: false }).limit(1).single();
      if (uf?.fecha_factura) setUltimaAct(`Datos: ${new Date(uf.fecha_factura).toLocaleDateString('es-MX')}`);

      let q = supabase.from('ventas_maestro').select('*').gte('fecha_factura', `${yearAplicado}-01-01`).lte('fecha_factura', `${yearAplicado}-12-31`);

      // Aplicar permisos de vendedor
      if (!userPermisos.verTodo && userPermisos.vendedor) {
        q = q.eq('ejecutivo_ventas', userPermisos.vendedor);
      } else if (filtrosAplicados.vendedor) {
        q = q.eq('ejecutivo_ventas', filtrosAplicados.vendedor);
      }

      if (filtrosAplicados.fechaInicio) q = q.gte('fecha_factura', filtrosAplicados.fechaInicio);
      if (filtrosAplicados.fechaFin) q = q.lte('fecha_factura', filtrosAplicados.fechaFin);
      if (filtrosAplicados.segmento) q = q.eq('segmento', filtrosAplicados.segmento);
      if (filtrosAplicados.tipo) q = q.eq('tipo', filtrosAplicados.tipo);
      if (filtrosAplicados.empresa) q = q.eq('empresa', filtrosAplicados.empresa);
      if (filtrosAplicados.estadoOrigen) q = q.eq('estado_origen', filtrosAplicados.estadoOrigen);
      if (filtrosAplicados.estadoDestino) q = q.eq('estado_destino', filtrosAplicados.estadoDestino);
      if (filtrosAplicados.division) q = q.eq('division', filtrosAplicados.division);
      if (filtrosAplicados.kmsMin) q = q.gte('kms_viaje', parseFloat(filtrosAplicados.kmsMin));
      if (filtrosAplicados.kmsMax) q = q.lte('kms_viaje', parseFloat(filtrosAplicados.kmsMax));

      const { data: vd } = await q;
      if (vd) {
        let d = vd;
        if (filtrosAplicados.clientes.length) d = d.filter(x => filtrosAplicados.clientes.includes(x.cliente_consolidado));
        if (filtrosAplicados.tractos.length) d = d.filter(x => filtrosAplicados.tractos.includes(x.tracto));
        if (filtrosAplicados.cajas.length) d = d.filter(x => filtrosAplicados.cajas.includes(x.caja));

        // Detectar moneda según división
        const hasTrobUSA = d.some(r => r.division === 'TROB_USA');
        const hasGrupoLoma = d.some(r => r.division === 'GRUPO_LOMA' || !r.division);
        if (filtrosAplicados.division === 'TROB_USA') setMoneda('USD');
        else if (filtrosAplicados.division === 'GRUPO_LOMA') setMoneda('MXN');
        else setMoneda(hasTrobUSA && !hasGrupoLoma ? 'USD' : 'MXN');

        const tv = d.length;
        const tven = d.reduce((s, r) => s + (r.ventas || 0), 0);
        const tkm = d.reduce((s, r) => s + (r.kms_viaje || 0), 0);

        const pSeg: any = {}, pEmp: any = {}, pTipo: any = {};
        d.forEach(r => {
          const sg = r.segmento || 'SIN', em = r.empresa || 'SIN', tp = r.tipo || 'NAC';
          if (!pSeg[sg]) pSeg[sg] = { viajes: 0, ventas: 0 };
          if (!pEmp[em]) pEmp[em] = { viajes: 0, ventas: 0 };
          if (!pTipo[tp]) pTipo[tp] = { viajes: 0, ventas: 0 };
          pSeg[sg].viajes++; pSeg[sg].ventas += r.ventas || 0;
          pEmp[em].viajes++; pEmp[em].ventas += r.ventas || 0;
          pTipo[tp].viajes++; pTipo[tp].ventas += r.ventas || 0;
        });

        setStats({ total_viajes: tv, total_ventas: tven, total_kms: tkm, por_segmento: pSeg, por_empresa: pEmp, por_tipo: pTipo });

        // Top clientes
        const cliMap: any = {};
        d.forEach(r => { const c = r.cliente_consolidado || 'SIN'; if (!cliMap[c]) cliMap[c] = { viajes: 0, ventas: 0 }; cliMap[c].viajes++; cliMap[c].ventas += r.ventas || 0; });
        setTopClientes(Object.entries(cliMap).map(([n, v]: any) => ({ nombre: n, ...v })).sort((a, b) => b.ventas - a.ventas).slice(0, 5));

        // Top tractos
        const traMap: any = {};
        d.forEach(r => { const t = r.tracto || 'SIN'; if (!traMap[t]) traMap[t] = { viajes: 0, ventas: 0 }; traMap[t].viajes++; traMap[t].ventas += r.ventas || 0; });
        setTopTractos(Object.entries(traMap).map(([n, v]: any) => ({ nombre: n, ...v })).sort((a, b) => b.viajes - a.viajes).slice(0, 5));

        // Top cajas
        const cajaMap: any = {};
        d.forEach(r => { const c = r.caja || 'SIN'; if (!cajaMap[c]) cajaMap[c] = { viajes: 0, ventas: 0 }; cajaMap[c].viajes++; cajaMap[c].ventas += r.ventas || 0; });
        setTopCajas(Object.entries(cajaMap).map(([n, v]: any) => ({ nombre: n, ...v })).sort((a, b) => b.viajes - a.viajes).slice(0, 5));

        // Datos mensuales
        const mesMap: any = {};
        d.forEach(r => { const m = r.fecha_factura?.substring(0, 7); if (m) { if (!mesMap[m]) mesMap[m] = { viajes: 0, ventas: 0 }; mesMap[m].viajes++; mesMap[m].ventas += r.ventas || 0; } });
        setDatosMensuales(mesMap);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [yearAplicado, filtrosAplicados, userPermisos]);

  useEffect(() => { cargarOpciones(); }, [cargarOpciones]);
  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const abrirFiltros = () => { setFiltrosTemp(filtrosAplicados); setYear(yearAplicado); setFiltrosOpen(true); };
  const aplicarFiltros = () => { setFiltrosAplicados(filtrosTemp); setYearAplicado(year); setFiltrosOpen(false); };
  const limpiarFiltros = () => { 
    const base = userPermisos.vendedor && !userPermisos.verTodo ? { ...FILTROS_INIT, vendedor: userPermisos.vendedor } : FILTROS_INIT;
    setFiltrosTemp(base); 
    setYear(2025); 
  };

  const nFiltros = useMemo(() => {
    let n = 0;
    if (filtrosAplicados.fechaInicio) n++;
    if (filtrosAplicados.fechaFin) n++;
    if (filtrosAplicados.segmento) n++;
    if (filtrosAplicados.tipo) n++;
    if (filtrosAplicados.empresa) n++;
    if (filtrosAplicados.clientes.length) n++;
    if (filtrosAplicados.tractos.length) n++;
    if (filtrosAplicados.cajas.length) n++;
    if (filtrosAplicados.estadoOrigen) n++;
    if (filtrosAplicados.estadoDestino) n++;
    if (filtrosAplicados.vendedor && userPermisos.verTodo) n++;
    if (filtrosAplicados.division) n++;
    if (filtrosAplicados.kmsMin) n++;
    if (filtrosAplicados.kmsMax) n++;
    return n;
  }, [filtrosAplicados, userPermisos]);

  const enviarChat = async () => {
    if (!chatIn.trim() || chatLoad) return;
    const msg = chatIn.trim();
    setChatIn('');
    setChatMsgs(p => [...p, { role: 'user', content: msg }]);
    setChatLoad(true);
    try {
      const ctx = `Datos ventas ${yearAplicado}: ${stats?.total_viajes || 0} viajes, $${(stats?.total_ventas || 0).toLocaleString()} ${moneda}. Top clientes: ${topClientes.map(c => c.nombre).join(', ')}`;
      const res = await fetch('https://fbxbsslhewchyibdoyzk.supabase.co/functions/v1/ventas-api', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'chat', message: msg, context: ctx })
      });
      const data = await res.json();
      setChatMsgs(p => [...p, { role: 'assistant', content: data.response || 'Sin respuesta' }]);
    } catch { setChatMsgs(p => [...p, { role: 'assistant', content: 'Error de conexión' }]); }
    setChatLoad(false);
  };

  const fmt = (n: number) => {
    if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
    return `$${n.toLocaleString()}`;
  };

  const ModalFiltros = () => {
    if (!filtrosOpen) return null;
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-white/10 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-white font-medium">Filtros</h3>
            <button onClick={() => setFiltrosOpen(false)} className="text-white/50 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-4 overflow-y-auto max-h-[60vh] space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-white/40 text-xs mb-1 block">Año</label>
                <select value={year} onChange={e => setYear(Number(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                  {[2023, 2024, 2025].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              {userPermisos.verTodo && (
                <div>
                  <label className="text-white/40 text-xs mb-1 block">Vendedor</label>
                  <select value={filtrosTemp.vendedor} onChange={e => setFiltrosTemp(p => ({ ...p, vendedor: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                    <option value="">Todos</option>
                    <option value="ISIS">ISIS</option>
                    <option value="PALOMA">PALOMA</option>
                  </select>
                </div>
              )}
              <div>
                <label className="text-white/40 text-xs mb-1 block">División</label>
                <select value={filtrosTemp.division} onChange={e => setFiltrosTemp(p => ({ ...p, division: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                  <option value="">Todas</option>
                  <option value="GRUPO_LOMA">Grupo Loma (MXN)</option>
                  <option value="TROB_USA">TROB USA (USD)</option>
                </select>
              </div>
              <div>
                <label className="text-white/40 text-xs mb-1 block">Fecha Inicio</label>
                <div className="flex gap-2">
                  <select 
                    value={filtrosTemp.fechaInicio ? filtrosTemp.fechaInicio.slice(5, 7) : ''}
                    onChange={e => {
                      const year = filtrosTemp.fechaInicio ? filtrosTemp.fechaInicio.slice(0, 4) : new Date().getFullYear().toString();
                      const month = e.target.value;
                      if (month) setFiltrosTemp(p => ({ ...p, fechaInicio: `${year}-${month}-01` }));
                    }}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-white text-sm"
                  >
                    <option value="">Mes</option>
                    <option value="01">Enero</option>
                    <option value="02">Febrero</option>
                    <option value="03">Marzo</option>
                    <option value="04">Abril</option>
                    <option value="05">Mayo</option>
                    <option value="06">Junio</option>
                    <option value="07">Julio</option>
                    <option value="08">Agosto</option>
                    <option value="09">Septiembre</option>
                    <option value="10">Octubre</option>
                    <option value="11">Noviembre</option>
                    <option value="12">Diciembre</option>
                  </select>
                  <select
                    value={filtrosTemp.fechaInicio ? filtrosTemp.fechaInicio.slice(0, 4) : ''}
                    onChange={e => {
                      const month = filtrosTemp.fechaInicio ? filtrosTemp.fechaInicio.slice(5, 7) : '01';
                      if (e.target.value) setFiltrosTemp(p => ({ ...p, fechaInicio: `${e.target.value}-${month}-01` }));
                    }}
                    className="w-24 bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-white text-sm"
                  >
                    <option value="">Año</option>
                    <option value="2023">2023</option>
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-white/40 text-xs mb-1 block">Fecha Fin</label>
                <div className="flex gap-2">
                  <select 
                    value={filtrosTemp.fechaFin ? filtrosTemp.fechaFin.slice(5, 7) : ''}
                    onChange={e => {
                      const year = filtrosTemp.fechaFin ? filtrosTemp.fechaFin.slice(0, 4) : new Date().getFullYear().toString();
                      const month = e.target.value;
                      if (month) {
                        // Calcular último día del mes
                        const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
                        setFiltrosTemp(p => ({ ...p, fechaFin: `${year}-${month}-${lastDay.toString().padStart(2, '0')}` }));
                      }
                    }}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-white text-sm"
                  >
                    <option value="">Mes</option>
                    <option value="01">Enero</option>
                    <option value="02">Febrero</option>
                    <option value="03">Marzo</option>
                    <option value="04">Abril</option>
                    <option value="05">Mayo</option>
                    <option value="06">Junio</option>
                    <option value="07">Julio</option>
                    <option value="08">Agosto</option>
                    <option value="09">Septiembre</option>
                    <option value="10">Octubre</option>
                    <option value="11">Noviembre</option>
                    <option value="12">Diciembre</option>
                  </select>
                  <select
                    value={filtrosTemp.fechaFin ? filtrosTemp.fechaFin.slice(0, 4) : ''}
                    onChange={e => {
                      const month = filtrosTemp.fechaFin ? filtrosTemp.fechaFin.slice(5, 7) : '12';
                      if (e.target.value) {
                        const lastDay = new Date(parseInt(e.target.value), parseInt(month), 0).getDate();
                        setFiltrosTemp(p => ({ ...p, fechaFin: `${e.target.value}-${month}-${lastDay.toString().padStart(2, '0')}` }));
                      }
                    }}
                    className="w-24 bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-white text-sm"
                  >
                    <option value="">Año</option>
                    <option value="2023">2023</option>
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-white/40 text-xs mb-1 block">Segmento</label>
                <select value={filtrosTemp.segmento} onChange={e => setFiltrosTemp(p => ({ ...p, segmento: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                  <option value="">Todos</option>
                  <option value="IMPEX">IMPEX</option>
                  <option value="DEDICADO">DEDICADO</option>
                </select>
              </div>
              <div>
                <label className="text-white/40 text-xs mb-1 block">Tipo</label>
                <select value={filtrosTemp.tipo} onChange={e => setFiltrosTemp(p => ({ ...p, tipo: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                  <option value="">Todos</option>
                  <option value="IMPO">IMPO</option>
                  <option value="EXPO">EXPO</option>
                  <option value="NAC">NAC</option>
                </select>
              </div>
              <div>
                <label className="text-white/40 text-xs mb-1 block">Empresa</label>
                <select value={filtrosTemp.empresa} onChange={e => setFiltrosTemp(p => ({ ...p, empresa: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                  <option value="">Todas</option>
                  <option value="TROB">TROB</option>
                  <option value="WEXPRESS">WEXPRESS</option>
                  <option value="SHI">SHI</option>
                </select>
              </div>
              <div>
                <label className="text-white/40 text-xs mb-1 block">Estado Origen</label>
                <select value={filtrosTemp.estadoOrigen} onChange={e => setFiltrosTemp(p => ({ ...p, estadoOrigen: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                  <option value="">Todos</option>
                  {opEstados.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div>
                <label className="text-white/40 text-xs mb-1 block">Estado Destino</label>
                <select value={filtrosTemp.estadoDestino} onChange={e => setFiltrosTemp(p => ({ ...p, estadoDestino: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                  <option value="">Todos</option>
                  {opEstados.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div>
                <label className="text-white/40 text-xs mb-1 block">KMs Mínimo</label>
                <input type="number" value={filtrosTemp.kmsMin} onChange={e => setFiltrosTemp(p => ({ ...p, kmsMin: e.target.value }))} placeholder="0" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
              </div>
              <div>
                <label className="text-white/40 text-xs mb-1 block">KMs Máximo</label>
                <input type="number" value={filtrosTemp.kmsMax} onChange={e => setFiltrosTemp(p => ({ ...p, kmsMax: e.target.value }))} placeholder="10000" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
              </div>
            </div>
            <MultiSelect label="Clientes" options={opClientes} selected={filtrosTemp.clientes} onChange={v => setFiltrosTemp(p => ({ ...p, clientes: v }))} placeholder="Seleccionar clientes..." />
            <MultiSelect label="Tractos" options={opTractos} selected={filtrosTemp.tractos} onChange={v => setFiltrosTemp(p => ({ ...p, tractos: v }))} placeholder="Seleccionar tractos..." />
            <MultiSelect label="Cajas/Remolques" options={opCajas} selected={filtrosTemp.cajas} onChange={v => setFiltrosTemp(p => ({ ...p, cajas: v }))} placeholder="Seleccionar cajas..." />
          </div>
          <div className="p-4 border-t border-white/10 flex justify-between">
            <button onClick={limpiarFiltros} className="px-4 py-2 text-red-400 text-sm hover:bg-red-500/10 rounded-lg">Limpiar</button>
            <button onClick={aplicarFiltros} className="px-6 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600">Aplicar</button>
          </div>
        </div>
      </div>
    );
  };

  const Dashboard = () => {
    if (loading) return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );

    const meses = Object.keys(datosMensuales).sort();
    const maxVentas = Math.max(...Object.values(datosMensuales).map(m => m.ventas), 1);

    return (
      <div className="space-y-3">
        {/* KPIs */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Truck className="w-4 h-4 text-orange-400" />
              <span className="text-white/50 text-xs">Viajes</span>
            </div>
            <div className="text-white text-xl font-bold">{(stats?.total_viajes || 0).toLocaleString()}</div>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span className="text-white/50 text-xs">Ventas ({moneda})</span>
            </div>
            <div className="text-white text-xl font-bold">{fmt(stats?.total_ventas || 0)}</div>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Gauge className="w-4 h-4 text-blue-400" />
              <span className="text-white/50 text-xs">KMs Total</span>
            </div>
            <div className="text-white text-xl font-bold">{((stats?.total_kms || 0) / 1000).toFixed(0)}K</div>
          </div>
        </div>

        {/* Gráfica mensual */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3">
          <div className="text-white/70 text-xs mb-2 flex items-center gap-1">
            <BarChart3 className="w-3 h-3" /> Ventas Mensuales {yearAplicado}
          </div>
          <div className="flex items-end gap-1 h-24">
            {meses.map(m => {
              const d = datosMensuales[m];
              const h = (d.ventas / maxVentas) * 100;
              return (
                <div key={m} className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-white/5 rounded-t relative" style={{ height: '80px' }}>
                    <div className="absolute bottom-0 w-full bg-gradient-to-t from-orange-500 to-orange-400 rounded-t transition-all" style={{ height: `${h}%` }} />
                  </div>
                  <span className="text-white/30 text-[8px] mt-1">{m.split('-')[1]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tops */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-2">
            <div className="text-white/50 text-[10px] mb-1 flex items-center gap-1"><Building2 className="w-3 h-3" />Top Clientes</div>
            {topClientes.map((c, i) => (
              <div key={i} className="flex justify-between text-[9px] py-0.5 border-b border-white/5 last:border-0">
                <span className="text-white/70 truncate flex-1">{c.nombre}</span>
                <span className="text-orange-400 ml-1">{fmt(c.ventas)}</span>
              </div>
            ))}
          </div>
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-2">
            <div className="text-white/50 text-[10px] mb-1 flex items-center gap-1"><Truck className="w-3 h-3" />Top Tractos</div>
            {topTractos.map((t, i) => (
              <div key={i} className="flex justify-between text-[9px] py-0.5 border-b border-white/5 last:border-0">
                <span className="text-white/70 truncate flex-1">{t.nombre}</span>
                <span className="text-blue-400 ml-1">{t.viajes}</span>
              </div>
            ))}
          </div>
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-2">
            <div className="text-white/50 text-[10px] mb-1 flex items-center gap-1"><Package className="w-3 h-3" />Top Cajas</div>
            {topCajas.map((c, i) => (
              <div key={i} className="flex justify-between text-[9px] py-0.5 border-b border-white/5 last:border-0">
                <span className="text-white/70 truncate flex-1">{c.nombre}</span>
                <span className="text-emerald-400 ml-1">{c.viajes}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Por tipo */}
        <div className="grid grid-cols-3 gap-2">
          {['IMPO', 'EXPO', 'NAC'].map(tipo => {
            const d = stats?.por_tipo?.[tipo] || { viajes: 0, ventas: 0 };
            return (
              <div key={tipo} className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-2 text-center">
                <div className="text-white/40 text-[10px]">{tipo}</div>
                <div className="text-white font-bold text-sm">{d.viajes.toLocaleString()}</div>
                <div className="text-orange-400 text-[10px]">{fmt(d.ventas)}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const Chat = () => (
    <div className="h-[400px] flex flex-col bg-white/[0.02] border border-white/[0.06] rounded-lg">
      <div className="p-2 border-b border-white/[0.06] flex items-center gap-2">
        <Sparkles className="w-3 h-3 text-orange-400" />
        <span className="text-white text-xs font-medium">Análisis IA</span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-white/10">
        {chatMsgs.length === 0 && (
          <div className="text-center text-white/30 py-4">
            <Bot className="w-6 h-6 mx-auto mb-1 opacity-50" />
            <p className="text-[10px]">Pregunta sobre ventas</p>
          </div>
        )}
        {chatMsgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-2 rounded-lg text-[10px] ${m.role === 'user' ? 'bg-orange-500/20 text-white' : 'bg-white/5 text-white/80'}`}>
              {m.content}
            </div>
          </div>
        ))}
        {chatLoad && (
          <div className="flex justify-start">
            <div className="bg-white/5 rounded-lg p-2 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span className="text-[10px] text-white/50">...</span>
            </div>
          </div>
        )}
      </div>
      <div className="p-2 border-t border-white/[0.06] flex gap-1">
        <input type="text" value={chatIn} onChange={e => setChatIn(e.target.value)} onKeyDown={e => e.key === 'Enter' && enviarChat()} placeholder="Pregunta..." className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-[10px] placeholder-white/30" />
        <button onClick={enviarChat} disabled={chatLoad || !chatIn.trim()} className="px-2 py-1 bg-orange-500/20 rounded text-orange-400 disabled:opacity-50">
          <Send className="w-3 h-3" />
        </button>
      </div>
    </div>
  );

  return (
    <ModuleTemplate title="Ventas" subtitle={userPermisos.vendedor ? `Vendedor: ${userPermisos.vendedor}` : "Análisis Grupo Loma & TROB USA"} icon={TrendingUp} accentColor="orange" backgroundImage={MODULE_IMAGES.ventas} onBack={onBack}>
      <ModalFiltros />
      <div className="flex items-center justify-between mb-2">
        <div className="flex gap-1">
          <button onClick={() => setVista('dashboard')} className={`px-2 py-1 rounded text-[10px] font-medium flex items-center gap-1 ${vista === 'dashboard' ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-white/50'}`}>
            <BarChart3 className="w-3 h-3" />Dashboard
          </button>
          <button onClick={() => setVista('chat')} className={`px-2 py-1 rounded text-[10px] font-medium flex items-center gap-1 ${vista === 'chat' ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-white/50'}`}>
            <Sparkles className="w-3 h-3" />IA
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white/50 text-xs font-medium">{yearAplicado}</span>
          <button onClick={abrirFiltros} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-500 hover:bg-orange-600 text-white transition-colors">
            <Filter className="w-3.5 h-3.5" />Filtros{nFiltros > 0 && <span className="bg-white/20 text-white text-[10px] px-1.5 rounded-full">{nFiltros}</span>}
          </button>
          <button onClick={cargarDatos} className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
            <RefreshCw className="w-3.5 h-3.5 text-white/70" />
          </button>
          <span className="text-[10px] text-white/40 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{ultimaAct}
          </span>
        </div>
      </div>
      {vista === 'dashboard' ? <Dashboard /> : <Chat />}
    </ModuleTemplate>
  );
}

export default VentasModule;
