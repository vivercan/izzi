'use client';

import { projectId, publicAnonKey } from '../../utils/supabase/info';
import React, { useState, useEffect, useCallback } from 'react';
import { Truck, MapPin, Clock, Gauge, Power, RefreshCw, Search, Download, X, WifiOff, Navigation, ExternalLink } from 'lucide-react';

// FLOTA 242 UNIDADES
const FLOTA_RAW: { e: string; emp: string; seg: string }[] = [
  {e:"167",emp:"TROB",seg:"INSTITUTO"},{e:"503",emp:"TROB",seg:"PATIERO"},{e:"505",emp:"TROB",seg:"CARROL"},{e:"509",emp:"TROB",seg:"PATIERO"},{e:"511",emp:"TROB",seg:"BAFAR"},{e:"547",emp:"TROB",seg:"PATIO"},{e:"575",emp:"TROB",seg:"MTTO"},{e:"587",emp:"TROB",seg:"MTTO"},{e:"589",emp:"TROB",seg:"PATIO"},{e:"593",emp:"TROB",seg:"PATIO"},{e:"629",emp:"TROB",seg:"MTTO"},{e:"643",emp:"TROB",seg:"CARROL"},{e:"649",emp:"TROB",seg:"BAFAR"},{e:"651",emp:"TROB",seg:"BARCEL"},{e:"653",emp:"TROB",seg:"IMPEX"},{e:"657",emp:"TROB",seg:"IMPEX"},{e:"681",emp:"TROB",seg:"IMPEX"},{e:"699",emp:"TROB",seg:"IMPEX"},{e:"713",emp:"TROB",seg:"IMPEX"},{e:"717",emp:"TROB",seg:"IMPEX"},{e:"721",emp:"TROB",seg:"IMPEX"},{e:"727",emp:"TROB",seg:"CARROL"},{e:"729",emp:"TROB",seg:"IMPEX"},{e:"731",emp:"TROB",seg:"CARROL"},{e:"733",emp:"TROB",seg:"BAFAR"},{e:"735",emp:"TROB",seg:"BAFAR"},{e:"739",emp:"TROB",seg:"IMPEX"},{e:"741",emp:"TROB",seg:"IMPEX"},{e:"743",emp:"TROB",seg:"ACCIDENTE"},{e:"745",emp:"TROB",seg:"CARROL"},{e:"747",emp:"TROB",seg:"ALPURA"},{e:"749",emp:"TROB",seg:"IMPEX"},{e:"751",emp:"TROB",seg:"IMPEX"},{e:"753",emp:"TROB",seg:"IMPEX"},{e:"757",emp:"TROB",seg:"IMPEX"},{e:"759",emp:"TROB",seg:"BAFAR"},{e:"761",emp:"TROB",seg:"IMPEX"},{e:"765",emp:"TROB",seg:"CARROL"},{e:"767",emp:"TROB",seg:"ALPURA"},{e:"769",emp:"TROB",seg:"IMPEX"},{e:"771",emp:"TROB",seg:"IMPEX"},{e:"773",emp:"TROB",seg:"IMPEX"},{e:"777",emp:"TROB",seg:"CARROL"},{e:"779",emp:"TROB",seg:"IMPEX"},{e:"781",emp:"TROB",seg:"IMPEX"},{e:"783",emp:"TROB",seg:"IMPEX"},{e:"785",emp:"TROB",seg:"IMPEX"},{e:"787",emp:"TROB",seg:"IMPEX"},{e:"789",emp:"TROB",seg:"IMPEX"},{e:"791",emp:"TROB",seg:"IMPEX"},{e:"797",emp:"TROB",seg:"IMPEX"},{e:"799",emp:"TROB",seg:"IMPEX"},{e:"801",emp:"TROB",seg:"CARROL"},{e:"803",emp:"TROB",seg:"IMPEX"},{e:"807",emp:"TROB",seg:"BAFAR"},{e:"809",emp:"TROB",seg:"CARROL"},{e:"811",emp:"TROB",seg:"IMPEX"},{e:"813",emp:"TROB",seg:"CARROL"},{e:"815",emp:"TROB",seg:"BAFAR"},{e:"817",emp:"TROB",seg:"CARROL"},{e:"819",emp:"TROB",seg:"IMPEX"},{e:"821",emp:"TROB",seg:"BAFAR"},{e:"823",emp:"TROB",seg:"ACCIDENTE"},{e:"825",emp:"TROB",seg:"BAFAR"},{e:"827",emp:"TROB",seg:"IMPEX"},{e:"831",emp:"TROB",seg:"IMPEX"},{e:"835",emp:"TROB",seg:"IMPEX"},{e:"837",emp:"TROB",seg:"CARROL"},{e:"839",emp:"TROB",seg:"ALPURA"},{e:"841",emp:"TROB",seg:"CARROL"},{e:"843",emp:"TROB",seg:"BAFAR"},{e:"845",emp:"TROB",seg:"IMPEX"},{e:"847",emp:"TROB",seg:"IMPEX"},{e:"849",emp:"TROB",seg:"IMPEX"},{e:"851",emp:"TROB",seg:"IMPEX"},{e:"853",emp:"TROB",seg:"IMPEX"},{e:"855",emp:"TROB",seg:"IMPEX"},{e:"857",emp:"TROB",seg:"ALPURA"},{e:"859",emp:"TROB",seg:"CARROL"},{e:"861",emp:"TROB",seg:"CARROL"},{e:"863",emp:"TROB",seg:"IMPEX"},{e:"865",emp:"TROB",seg:"MTTO"},{e:"867",emp:"TROB",seg:"IMPEX"},{e:"869",emp:"TROB",seg:"IMPEX"},{e:"871",emp:"TROB",seg:"IMPEX"},{e:"873",emp:"TROB",seg:"IMPEX"},{e:"875",emp:"TROB",seg:"ACCIDENTE"},{e:"877",emp:"TROB",seg:"IMPEX"},{e:"879",emp:"TROB",seg:"CARROL"},{e:"883",emp:"TROB",seg:"IMPEX"},{e:"885",emp:"TROB",seg:"IMPEX"},{e:"887",emp:"TROB",seg:"IMPEX"},{e:"889",emp:"TROB",seg:"IMPEX"},{e:"891",emp:"TROB",seg:"CARROL"},{e:"893",emp:"TROB",seg:"CARROL"},{e:"895",emp:"TROB",seg:"BAFAR"},{e:"897",emp:"TROB",seg:"IMPEX"},{e:"899",emp:"TROB",seg:"CARROL"},{e:"901",emp:"TROB",seg:"BAFAR"},{e:"903",emp:"TROB",seg:"BARCEL"},{e:"905",emp:"TROB",seg:"CARROL"},{e:"907",emp:"TROB",seg:"BARCEL"},{e:"909",emp:"TROB",seg:"MTTO"},{e:"911",emp:"TROB",seg:"CARROL"},{e:"913",emp:"TROB",seg:"IMPEX"},{e:"915",emp:"TROB",seg:"BARCEL"},{e:"917",emp:"TROB",seg:"BARCEL"},{e:"919",emp:"TROB",seg:"BARCEL"},{e:"921",emp:"TROB",seg:"PATIO"},{e:"923",emp:"TROB",seg:"PATIO"},{e:"925",emp:"TROB",seg:"BAFAR"},{e:"927",emp:"TROB",seg:"BARCEL"},{e:"929",emp:"TROB",seg:"ALPURA"},{e:"931",emp:"TROB",seg:"CARROL"},{e:"933",emp:"TROB",seg:"CARROL"},{e:"935",emp:"TROB",seg:"BARCEL"},{e:"937",emp:"TROB",seg:"CARROL"},{e:"939",emp:"TROB",seg:"BARCEL"},{e:"941",emp:"TROB",seg:"BAFAR"},{e:"943",emp:"TROB",seg:"MTTO"},{e:"945",emp:"TROB",seg:"CARROL"},{e:"947",emp:"TROB",seg:"IMPEX"},{e:"953",emp:"TROB",seg:"IMPEX"},{e:"955",emp:"TROB",seg:"ALPURA"},{e:"957",emp:"TROB",seg:"BAFAR"},{e:"959",emp:"TROB",seg:"BAFAR"},{e:"961",emp:"TROB",seg:"BAFAR"},{e:"963",emp:"TROB",seg:"IMPEX"},{e:"501",emp:"TROB",seg:"IMPEX"},{e:"507",emp:"TROB",seg:"IMPEX"},
  {e:"112",emp:"WE",seg:"IMPEX"},{e:"116",emp:"WE",seg:"IMPEX"},{e:"118",emp:"WE",seg:"CARROL"},{e:"124",emp:"WE",seg:"IMPEX"},{e:"126",emp:"WE",seg:"MTTO"},{e:"128",emp:"WE",seg:"IMPEX"},{e:"130",emp:"WE",seg:"IMPEX"},{e:"134",emp:"WE",seg:"MTTO"},{e:"138",emp:"WE",seg:"IMPEX"},{e:"140",emp:"WE",seg:"IMPEX"},{e:"142",emp:"WE",seg:"IMPEX"},{e:"144",emp:"WE",seg:"IMPEX"},{e:"146",emp:"WE",seg:"IMPEX"},{e:"148",emp:"WE",seg:"CARROL"},{e:"152",emp:"WE",seg:"IMPEX"},{e:"154",emp:"WE",seg:"IMPEX"},{e:"156",emp:"WE",seg:"ALPURA"},{e:"158",emp:"WE",seg:"IMPEX"},{e:"160",emp:"WE",seg:"IMPEX"},{e:"162",emp:"WE",seg:"BARCEL"},{e:"164",emp:"WE",seg:"IMPEX"},{e:"166",emp:"WE",seg:"IMPEX"},{e:"168",emp:"WE",seg:"IMPEX"},{e:"170",emp:"WE",seg:"ALPURA"},{e:"172",emp:"WE",seg:"IMPEX"},{e:"174",emp:"WE",seg:"IMPEX"},{e:"176",emp:"WE",seg:"IMPEX"},{e:"178",emp:"WE",seg:"CARROL"},{e:"180",emp:"WE",seg:"IMPEX"},{e:"182",emp:"WE",seg:"IMPEX"},{e:"184",emp:"WE",seg:"IMPEX"},{e:"186",emp:"WE",seg:"IMPEX"},{e:"188",emp:"WE",seg:"IMPEX"},{e:"190",emp:"WE",seg:"ALPURA"},{e:"192",emp:"WE",seg:"IMPEX"},{e:"194",emp:"WE",seg:"IMPEX"},{e:"196",emp:"WE",seg:"IMPEX"},{e:"198",emp:"WE",seg:"ALPURA"},{e:"200",emp:"WE",seg:"IMPEX"},{e:"202",emp:"WE",seg:"IMPEX"},{e:"204",emp:"WE",seg:"ALPURA"},{e:"206",emp:"WE",seg:"IMPEX"},{e:"208",emp:"WE",seg:"CARROL"},{e:"212",emp:"WE",seg:"CARROL"},{e:"214",emp:"WE",seg:"CARROL"},{e:"216",emp:"WE",seg:"IMPEX"},{e:"218",emp:"WE",seg:"IMPEX"},{e:"220",emp:"WE",seg:"IMPEX"},{e:"222",emp:"WE",seg:"IMPEX"},{e:"224",emp:"WE",seg:"IMPEX"},{e:"226",emp:"WE",seg:"IMPEX"},{e:"228",emp:"WE",seg:"IMPEX"},{e:"232",emp:"WE",seg:"IMPEX"},{e:"234",emp:"WE",seg:"ALPURA"},{e:"236",emp:"WE",seg:"ALPURA"},{e:"230",emp:"WE",seg:"PENDIENTE"},
  {e:"1",emp:"SHI",seg:"NS"},{e:"101",emp:"SHI",seg:"NS"},{e:"103",emp:"SHI",seg:"NS"},{e:"105",emp:"SHI",seg:"NS"},{e:"107",emp:"SHI",seg:"NS"},{e:"109",emp:"SHI",seg:"PILGRIMS"},{e:"111",emp:"SHI",seg:"PILGRIMS"},{e:"113",emp:"SHI",seg:"ACCIDENTE"},{e:"115",emp:"SHI",seg:"NS"},{e:"117",emp:"SHI",seg:"NS"},{e:"119",emp:"SHI",seg:"PILGRIMS"},{e:"121",emp:"SHI",seg:"PILGRIMS"},{e:"123",emp:"SHI",seg:"IMPEX"},{e:"125",emp:"SHI",seg:"PILGRIMS"},{e:"689",emp:"SHI",seg:"NS"},{e:"129",emp:"SHI",seg:"PILGRIMS"},{e:"131",emp:"SHI",seg:"IMPEX"},{e:"133",emp:"SHI",seg:"ACCIDENTE"},{e:"401",emp:"SHI",seg:"ALPURA"},{e:"405",emp:"SHI",seg:"NS"},{e:"409",emp:"SHI",seg:"PILGRIMS"},{e:"413",emp:"SHI",seg:"IMPEX"},{e:"417",emp:"SHI",seg:"PILGRIMS"},{e:"419",emp:"SHI",seg:"IMPEX"},{e:"431",emp:"SHI",seg:"PILGRIMS"},{e:"433",emp:"SHI",seg:"PATIO"},{e:"435",emp:"SHI",seg:"NS"},{e:"437",emp:"SHI",seg:"PILGRIMS"},{e:"439",emp:"SHI",seg:"NS"},{e:"441",emp:"SHI",seg:"PILGRIMS"},{e:"443",emp:"SHI",seg:"IMPEX"},{e:"445",emp:"SHI",seg:"NS"},{e:"449",emp:"SHI",seg:"NS"},
  {e:"231001",emp:"USA",seg:"USA"},{e:"231002",emp:"USA",seg:"USA"},{e:"231003",emp:"USA",seg:"USA"},{e:"231004",emp:"USA",seg:"USA"},{e:"231005",emp:"USA",seg:"USA"},{e:"241006",emp:"USA",seg:"USA"},{e:"241007",emp:"USA",seg:"USA"},{e:"241008",emp:"USA",seg:"USA"},{e:"241009",emp:"USA",seg:"USA"},{e:"241010",emp:"USA",seg:"USA"},{e:"241011",emp:"USA",seg:"USA"},{e:"241012",emp:"USA",seg:"USA"},{e:"241013",emp:"USA",seg:"USA"},{e:"241014",emp:"USA",seg:"USA"},{e:"241015",emp:"USA",seg:"USA"},{e:"241016",emp:"USA",seg:"USA"},{e:"241017",emp:"USA",seg:"USA"},{e:"241018",emp:"USA",seg:"USA"},{e:"241019",emp:"USA",seg:"MTTO"},{e:"241020",emp:"USA",seg:"USA"},{e:"241021",emp:"USA",seg:"MTTO"},{e:"775",emp:"USA",seg:"USA"},{e:"881",emp:"USA",seg:"USA"},
];

const normSeg = (s: string): string => {
  const u = s.toUpperCase();
  if (u.includes('ALPURA')) return 'ALPURA';
  if (u.includes('BAFAR')) return 'BAFAR';
  if (u.includes('BARCEL')) return 'BARCEL';
  if (u.includes('CARROL')) return 'CARROLL';
  if (u.includes('NS') || u.includes('NATURE')) return 'NatureSweet';
  if (u.includes('PILGRIM')) return 'Pilgrims';
  if (u.includes('IMPEX')) return 'IMPEX';
  if (u.includes('MTTO')) return 'MTTO';
  if (u.includes('ACCIDENTE')) return 'ACCIDENTE';
  if (u.includes('INSTITUTO')) return 'INSTITUTO';
  if (u.includes('PATIO') || u.includes('PATIERO')) return 'PATIOS';
  if (u.includes('PENDIENTE')) return 'PENDIENTE';
  if (u.includes('USA')) return 'USA';
  return 'IMPEX';
};

const FLOTA = FLOTA_RAW.map(u => ({ economico: u.e, empresa: u.emp, segmento: normSeg(u.seg) }));

interface Unit { economico: string; empresa: string; segmento: string; latitude: number | null; longitude: number | null; speed: number | null; address: string | null; timestamp: string | null; odometer: number | null; ignition: boolean | null; status: 'moving' | 'stopped' | 'no_signal' | 'loading'; }

const SEGS = ['ALPURA', 'BAFAR', 'BARCEL', 'CARROLL', 'NatureSweet', 'Pilgrims', 'IMPEX', 'MTTO', 'ACCIDENTE', 'INSTITUTO', 'PATIOS', 'PENDIENTE', 'USA'];
const EMP_ORDER: Record<string, number> = { SHI: 1, TROB: 2, WE: 3, USA: 4 };

export default function DespachoInteligenteContent() {
  const [fleet, setFleet] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [search, setSearch] = useState('');
  const [statusF, setStatusF] = useState('ALL');
  const [empF, setEmpF] = useState(['SHI', 'TROB', 'WE', 'USA']);
  const [segF, setSegF] = useState('ALL');
  const [progress, setProgress] = useState({ c: 0, t: 0 });

  const fetchBatch = async (placas: string[]) => {
    try {
      const r = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/widetech/locations/batch`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${publicAnonKey}` }, body: JSON.stringify({ placas }) });
      if (!r.ok) return [];
      const j = await r.json();
      return j.results || j.data || [];
    } catch { return []; }
  };

  const fetchGPS = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setFleet(FLOTA.map(u => ({ ...u, latitude: null, longitude: null, speed: null, address: null, timestamp: null, odometer: null, ignition: null, status: 'loading' as const })));
    const batches: string[][] = [];
    for (let i = 0; i < FLOTA.length; i += 5) batches.push(FLOTA.slice(i, i + 5).map(u => u.economico));
    setProgress({ c: 0, t: batches.length });
    const all: any[] = [];
    for (let i = 0; i < batches.length; i++) {
      const res = await fetchBatch(batches[i]);
      all.push(...res);
      setProgress({ c: i + 1, t: batches.length });
      setFleet(prev => prev.map(u => {
        const g = all.find((d: any) => d.placa === u.economico);
        if (g?.success && g.location) {
          const l = g.location;
          const mov = (l.speed || 0) > 5;
          const sig = l.latitude && l.longitude;
          const ign = l.ignition === 'ON' || l.ignition === true;
          return { ...u, latitude: l.latitude, longitude: l.longitude, speed: l.speed, address: l.address || l.addressOriginal, timestamp: l.timestamp, odometer: l.odometer, ignition: ign, status: !sig ? 'no_signal' : mov ? 'moving' : ign ? 'stopped' : 'no_signal' };
        }
        if (batches.slice(0, i + 1).flat().includes(u.economico) && u.status === 'loading') return { ...u, status: 'no_signal' as const };
        return u;
      }));
      if (i < batches.length - 1) await new Promise(r => setTimeout(r, 250));
    }
    setLastRefresh(new Date());
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchGPS(); }, [fetchGPS]);

  const toggle = (e: string) => setEmpF(p => p.includes(e) ? p.filter(x => x !== e) : [...p, e]);

  const filtered = fleet.filter(u => {
    if (search && !u.economico.includes(search)) return false;
    if (!empF.includes(u.empresa)) return false;
    if (segF !== 'ALL' && u.segmento !== segF) return false;
    if (statusF === 'moving' && u.status !== 'moving') return false;
    if (statusF === 'stopped' && u.status !== 'stopped') return false;
    if (statusF === 'no_signal' && u.status !== 'no_signal') return false;
    return true;
  }).sort((a, b) => (EMP_ORDER[a.empresa] || 9) - (EMP_ORDER[b.empresa] || 9) || a.segmento.localeCompare(b.segmento) || parseInt(a.economico) - parseInt(b.economico));

  const stats = { total: fleet.length, mov: fleet.filter(u => u.status === 'moving').length, det: fleet.filter(u => u.status === 'stopped').length, sin: fleet.filter(u => u.status === 'no_signal').length, emp: { SHI: fleet.filter(u => u.empresa === 'SHI').length, TROB: fleet.filter(u => u.empresa === 'TROB').length, WE: fleet.filter(u => u.empresa === 'WE').length, USA: fleet.filter(u => u.empresa === 'USA').length } };

  const openMap = (u: Unit) => u.latitude && window.open(`https://www.google.com/maps?q=${u.latitude},${u.longitude}`, '_blank');

  const exportCSV = () => {
    const csv = [['Eco', 'Empresa', 'Seg', 'Status', 'Vel', 'Lat', 'Lon', 'Dir', 'Señal'], ...filtered.map(u => [u.economico, u.empresa, u.segmento, u.status, u.speed || '', u.latitude || '', u.longitude || '', u.address || '', u.timestamp || ''])].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const b = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const l = document.createElement('a'); l.href = URL.createObjectURL(b); l.download = `GPS_${new Date().toISOString().slice(0, 10)}.csv`; l.click();
  };

  const fmtTs = (t: string | null) => t ? new Date(t).toLocaleString('es-MX', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-';

  const isLoading = loading || refreshing;
  const pct = progress.t > 0 ? Math.round((progress.c / progress.t) * 100) : 0;

  // Estilos de botones uniformes
  const btnBase = "h-10 px-4 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all duration-200";
  const btn3d = (active: boolean, from: string, to: string, shadow: string) => `${btnBase} ${active ? `bg-gradient-to-b from-${from} to-${to} text-white` : 'bg-slate-700/80 text-slate-300 hover:bg-slate-600/80'}`;

  return (
    <div className="min-h-screen p-4" style={{ background: 'linear-gradient(180deg, #1a365d 0%, #0f172a 100%)' }}>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 p-3 rounded-2xl bg-slate-800/60 backdrop-blur-sm" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
        
        {/* Status Buttons - Uniformes */}
        <button onClick={() => setStatusF('ALL')} className={`${btnBase} ${statusF === 'ALL' ? 'bg-gradient-to-b from-slate-500 to-slate-700 text-white' : 'bg-slate-700/80 text-slate-300 hover:bg-slate-600/80'}`} style={{ boxShadow: statusF === 'ALL' ? '0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)' : 'none' }}>
          <Truck className="w-4 h-4" /><span>{stats.total}</span>
        </button>
        
        <button onClick={() => setStatusF('moving')} className={`${btnBase} ${statusF === 'moving' ? 'bg-gradient-to-b from-green-500 to-green-700 text-white' : 'bg-slate-700/80 text-slate-300 hover:bg-slate-600/80'}`} style={{ boxShadow: statusF === 'moving' ? '0 4px 12px rgba(34,197,94,0.4), inset 0 1px 0 rgba(255,255,255,0.1)' : 'none' }}>
          <Navigation className="w-4 h-4" /><span>{stats.mov}</span>
        </button>
        
        <button onClick={() => setStatusF('stopped')} className={`${btnBase} ${statusF === 'stopped' ? 'bg-gradient-to-b from-yellow-500 to-yellow-600 text-white' : 'bg-slate-700/80 text-slate-300 hover:bg-slate-600/80'}`} style={{ boxShadow: statusF === 'stopped' ? '0 4px 12px rgba(234,179,8,0.4), inset 0 1px 0 rgba(255,255,255,0.1)' : 'none' }}>
          <Power className="w-4 h-4" /><span>{stats.det}</span>
        </button>
        
        <button onClick={() => setStatusF('no_signal')} className={`${btnBase} ${statusF === 'no_signal' ? 'bg-gradient-to-b from-red-500 to-red-700 text-white' : 'bg-slate-700/80 text-slate-300 hover:bg-slate-600/80'}`} style={{ boxShadow: statusF === 'no_signal' ? '0 4px 12px rgba(239,68,68,0.4), inset 0 1px 0 rgba(255,255,255,0.1)' : 'none' }}>
          <WifiOff className="w-4 h-4" /><span>{stats.sin}</span>
        </button>

        {/* Separador */}
        <div className="w-px h-8 bg-slate-600/50" />

        {/* Empresas - Minimalistas diferenciadas */}
        <button onClick={() => toggle('SHI')} className={`h-10 px-3 rounded-xl text-sm font-semibold transition-all ${empF.includes('SHI') ? 'bg-purple-600/90 text-white' : 'bg-slate-700/60 text-slate-400'}`} style={{ boxShadow: empF.includes('SHI') ? '0 4px 12px rgba(147,51,234,0.3)' : 'none' }}>
          SHI <span className="opacity-70">({stats.emp.SHI})</span>
        </button>
        <button onClick={() => toggle('TROB')} className={`h-10 px-3 rounded-xl text-sm font-semibold transition-all ${empF.includes('TROB') ? 'bg-blue-600/90 text-white' : 'bg-slate-700/60 text-slate-400'}`} style={{ boxShadow: empF.includes('TROB') ? '0 4px 12px rgba(37,99,235,0.3)' : 'none' }}>
          TROB <span className="opacity-70">({stats.emp.TROB})</span>
        </button>
        <button onClick={() => toggle('WE')} className={`h-10 px-3 rounded-xl text-sm font-semibold transition-all ${empF.includes('WE') ? 'bg-emerald-600/90 text-white' : 'bg-slate-700/60 text-slate-400'}`} style={{ boxShadow: empF.includes('WE') ? '0 4px 12px rgba(5,150,105,0.3)' : 'none' }}>
          WE <span className="opacity-70">({stats.emp.WE})</span>
        </button>
        <button onClick={() => toggle('USA')} className={`h-10 px-3 rounded-xl text-sm font-semibold transition-all ${empF.includes('USA') ? 'bg-amber-600/90 text-white' : 'bg-slate-700/60 text-slate-400'}`} style={{ boxShadow: empF.includes('USA') ? '0 4px 12px rgba(217,119,6,0.3)' : 'none' }}>
          USA <span className="opacity-70">({stats.emp.USA})</span>
        </button>

        {/* Separador */}
        <div className="w-px h-8 bg-slate-600/50" />

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Eco..." className="h-10 w-24 pl-9 pr-3 rounded-xl bg-slate-700/60 border border-slate-600/50 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500/50" />
        </div>

        {/* Segmento */}
        <select value={segF} onChange={e => setSegF(e.target.value)} className="h-10 px-3 rounded-xl bg-slate-700/60 border border-slate-600/50 text-white text-sm focus:outline-none">
          <option value="ALL" className="bg-slate-800">Segmento</option>
          {SEGS.map(s => <option key={s} value={s} className="bg-slate-800">{s}</option>)}
        </select>

        <div className="flex-1" />

        {/* Info */}
        <span className="text-slate-400 text-sm">{filtered.length}/{stats.total}</span>
        {lastRefresh && <span className="text-slate-500 text-xs">{lastRefresh.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>}

        {/* Download - Azul oscuro 3D */}
        <button onClick={exportCSV} className="h-10 w-10 flex items-center justify-center rounded-xl bg-gradient-to-b from-slate-600 to-slate-800 text-slate-300 hover:from-slate-500 hover:to-slate-700 transition-all" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)' }}>
          <Download className="w-4 h-4" />
        </button>

        {/* Actualizar */}
        <button onClick={() => fetchGPS(true)} disabled={isLoading} className={`h-10 px-4 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all ${isLoading ? 'bg-gradient-to-b from-orange-500 to-orange-700' : 'bg-gradient-to-b from-blue-500 to-blue-700'} text-white`} style={{ boxShadow: isLoading ? '0 4px 16px rgba(249,115,22,0.5), inset 0 1px 0 rgba(255,255,255,0.2)' : '0 4px 16px rgba(59,130,246,0.4), inset 0 1px 0 rgba(255,255,255,0.2)' }}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? `${pct}%` : 'Actualizar'}
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden bg-slate-800/40 backdrop-blur-sm" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)' }}>
        <div className="max-h-[calc(100vh-180px)] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-slate-900/95 z-10">
              <tr>
                {['ECO', 'EMPRESA', 'SEGMENTO', 'STATUS', 'VEL', 'UBICACIÓN', 'SEÑAL'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.economico} className="border-t border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-white">{u.economico}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${u.empresa === 'SHI' ? 'bg-purple-500/20 text-purple-300' : u.empresa === 'TROB' ? 'bg-blue-500/20 text-blue-300' : u.empresa === 'WE' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>{u.empresa}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-sm">{u.segmento}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => openMap(u)} disabled={!u.latitude} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${u.status === 'moving' ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : u.status === 'stopped' ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' : 'bg-red-500/20 text-red-400'} ${u.latitude ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
                      {u.status === 'moving' ? <Navigation className="w-3 h-3" /> : u.status === 'stopped' ? <Power className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                      {u.status === 'moving' ? 'Mov' : u.status === 'stopped' ? 'Det' : 'Sin'}
                      {u.latitude && <ExternalLink className="w-3 h-3" />}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-semibold ${(u.speed || 0) > 0 ? 'text-green-400' : 'text-slate-500'}`}>{u.speed ?? '-'}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs max-w-[200px] truncate">{u.address || (u.latitude ? `${u.latitude.toFixed(3)}, ${u.longitude?.toFixed(3)}` : '-')}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{fmtTs(u.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
