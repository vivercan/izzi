import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Users, Upload, Download, Search, UserCheck, X, FileSpreadsheet, Brain, MapPin, ChevronDown, RefreshCw, ClipboardList, MessageSquare, Loader2, Check, AlertTriangle, Truck } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

const supabase = createClient(`https://${projectId}.supabase.co`, publicAnonKey);
const ANTHROPIC_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || '';

// ============ TYPES ============
interface ClienteAsignacion {
  id: number; numero: number; cliente: string; ejecutivo_sc: string; status: string; notas: string | null;
}
interface DataExpo {
  id: number; estado: string; tipo: string; cliente: string; viajes: number; formatos_venta: string;
  num_formatos: number; origenes: string; dedicado: string; cruce: string; empresa: string;
}
interface DataImpo {
  id: number; numero: number; cliente: string; viajes: number; thermo: number; seco: number;
  formatos: number; tipo_equipo: string; zona_entrega: string; empresa: string;
}
interface Props {
  onBack: () => void; userEmail?: string; userName?: string; userRole?: string;
}

// ============ NEIGHBOR STATES MAP ============
const NEIGHBOR_STATES: Record<string, string[]> = {
  'AGUASCALIENTES': ['JALISCO', 'ZACATECAS', 'SAN LUIS POTOSI'],
  'CAMPECHE': ['CHIAPAS'],
  'CHIAPAS': ['CAMPECHE'],
  'CIUDAD DE MEXICO': ['ESTADO DE MEXICO'],
  'COAHUILA': ['NUEVO LEON', 'DURANGO', 'ZACATECAS', 'SAN LUIS POTOSI'],
  'COLIMA': ['JALISCO', 'MICHOACAN'],
  'DURANGO': ['COAHUILA', 'ZACATECAS', 'SINALOA', 'NAYARIT'],
  'ESTADO DE MEXICO': ['CIUDAD DE MEXICO', 'HIDALGO', 'PUEBLA', 'TLAXCALA', 'MORELOS', 'QUERETARO', 'MICHOACAN', 'GUERRERO'],
  'GUANAJUATO': ['JALISCO', 'AGUASCALIENTES', 'SAN LUIS POTOSI', 'QUERETARO', 'MICHOACAN'],
  'GUERRERO': ['ESTADO DE MEXICO', 'MICHOACAN', 'MORELOS', 'PUEBLA'],
  'HIDALGO': ['ESTADO DE MEXICO', 'PUEBLA', 'VERACRUZ', 'SAN LUIS POTOSI', 'QUERETARO', 'TLAXCALA'],
  'JALISCO': ['NAYARIT', 'AGUASCALIENTES', 'ZACATECAS', 'GUANAJUATO', 'MICHOACAN', 'COLIMA'],
  'MICHOACAN': ['JALISCO', 'GUANAJUATO', 'QUERETARO', 'ESTADO DE MEXICO', 'GUERRERO', 'COLIMA'],
  'MORELOS': ['ESTADO DE MEXICO', 'GUERRERO', 'PUEBLA'],
  'NAYARIT': ['JALISCO', 'ZACATECAS', 'DURANGO', 'SINALOA'],
  'NUEVO LEON': ['COAHUILA', 'TAMAULIPAS', 'SAN LUIS POTOSI'],
  'PUEBLA': ['ESTADO DE MEXICO', 'HIDALGO', 'TLAXCALA', 'VERACRUZ', 'MORELOS', 'GUERRERO'],
  'QUERETARO': ['GUANAJUATO', 'SAN LUIS POTOSI', 'HIDALGO', 'ESTADO DE MEXICO', 'MICHOACAN'],
  'SAN LUIS POTOSI': ['ZACATECAS', 'AGUASCALIENTES', 'JALISCO', 'GUANAJUATO', 'QUERETARO', 'HIDALGO', 'VERACRUZ', 'TAMAULIPAS', 'NUEVO LEON', 'COAHUILA'],
  'SINALOA': ['SONORA', 'DURANGO', 'NAYARIT'],
  'SONORA': ['SINALOA'],
  'TAMAULIPAS': ['NUEVO LEON', 'SAN LUIS POTOSI', 'VERACRUZ'],
  'TLAXCALA': ['PUEBLA', 'HIDALGO', 'ESTADO DE MEXICO'],
  'VERACRUZ': ['TAMAULIPAS', 'SAN LUIS POTOSI', 'HIDALGO', 'PUEBLA'],
  'ZACATECAS': ['DURANGO', 'COAHUILA', 'SAN LUIS POTOSI', 'AGUASCALIENTES', 'JALISCO', 'NAYARIT'],
};

const EJECUTIVOS_SC = ['ELI', 'LIZ'];

// ============ STYLES ============
const S = {
  bg: { background: 'linear-gradient(135deg, #001f4d 0%, #003d7a 25%, #0066cc 50%, #1a8fff 75%, #4da6ff 100%)' },
  overlay: { background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.3) 100%)' },
  card: {
    background: 'linear-gradient(155deg, rgba(18,32,58,0.96) 0%, rgba(12,22,42,0.98) 35%, rgba(8,16,32,1) 70%, rgba(6,12,24,1) 100%)',
    border: '1px solid rgba(80,120,180,0.2)',
    borderRadius: '12px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
  },
  cardHover: {
    border: '1px solid rgba(240,160,80,0.5)',
    boxShadow: '0 8px 32px rgba(240,160,80,0.15), 0 4px 16px rgba(0,0,0,0.5)',
    transform: 'translateY(-4px)',
  },
  font: { fontFamily: "'Exo 2', sans-serif" },
  text: { color: 'rgba(255,255,255,0.9)', fontFamily: "'Exo 2', sans-serif" },
  textMuted: { color: 'rgba(255,255,255,0.6)', fontFamily: "'Exo 2', sans-serif" },
  textOrange: { color: 'rgba(240,160,80,1)', fontFamily: "'Exo 2', sans-serif" },
  input: {
    background: 'rgba(10,20,40,0.8)', border: '1px solid rgba(80,120,180,0.25)', borderRadius: '8px',
    color: 'rgba(255,255,255,0.9)', fontFamily: "'Exo 2', sans-serif", padding: '10px 14px', fontSize: '14px',
    outline: 'none', width: '100%',
  },
  select: {
    background: 'rgba(10,20,40,0.8)', border: '1px solid rgba(80,120,180,0.25)', borderRadius: '8px',
    color: 'rgba(255,255,255,0.9)', fontFamily: "'Exo 2', sans-serif", padding: '10px 14px', fontSize: '14px',
    outline: 'none', cursor: 'pointer', appearance: 'none' as const,
  },
  btn: {
    background: 'linear-gradient(135deg, rgba(240,160,80,0.9) 0%, rgba(220,140,60,0.95) 100%)',
    border: 'none', borderRadius: '8px', color: '#fff', fontFamily: "'Exo 2', sans-serif",
    fontWeight: 700, padding: '10px 20px', cursor: 'pointer', fontSize: '13px', letterSpacing: '0.03em',
  },
  btnSecondary: {
    background: 'rgba(20,35,60,0.9)', border: '1px solid rgba(80,120,180,0.3)', borderRadius: '8px',
    color: 'rgba(255,255,255,0.85)', fontFamily: "'Exo 2', sans-serif", fontWeight: 600,
    padding: '10px 20px', cursor: 'pointer', fontSize: '13px',
  },
  tableHeader: {
    background: 'rgba(15,25,45,0.95)', borderBottom: '2px solid rgba(240,160,80,0.3)',
    fontFamily: "'Exo 2', sans-serif", fontSize: '12px', fontWeight: 700, color: 'rgba(240,160,80,0.9)',
    textTransform: 'uppercase' as const, letterSpacing: '0.06em', padding: '12px 14px', textAlign: 'left' as const,
  },
  tableCell: {
    fontFamily: "'Exo 2', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.85)',
    padding: '10px 14px', borderBottom: '1px solid rgba(80,120,180,0.1)',
  },
};

// ============ AI HELPER ============
const callClaudeAPI = async (prompt: string): Promise<string> => {
  if (!ANTHROPIC_KEY) return 'API key no configurada. Agrega VITE_ANTHROPIC_API_KEY en tu .env';
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514', max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const data = await res.json();
    return data.content?.[0]?.text || 'Sin respuesta';
  } catch (err) {
    console.error('Claude API error:', err);
    return 'Error al consultar IA. Verifica tu API key y conexión.';
  }
};

// ============ EXCEL EXPORT ============
const exportToExcel = (headers: string[], rows: string[][], filename: string, aiSummary?: string) => {
  const now = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
  let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
<head><meta charset="utf-8">
<style>
  body { font-family: Calibri, Arial, sans-serif; }
  .title { font-size: 18px; font-weight: bold; color: #1a3a6e; padding: 10px; }
  .subtitle { font-size: 12px; color: #666; padding: 4px 10px; }
  .ai-summary { background: #f0f4ff; border-left: 4px solid #1a3a6e; padding: 12px; margin: 10px 0; font-size: 12px; color: #333; }
  th { background-color: #1a3a6e; color: white; font-weight: bold; font-size: 12px; padding: 10px 12px; text-align: left; border: 1px solid #0d2147; }
  td { font-size: 11px; padding: 8px 12px; border: 1px solid #d0d8e8; color: #222; }
  tr:nth-child(even) td { background-color: #f5f8fc; }
  tr:hover td { background-color: #e8f0fe; }
  .highlight { background-color: #fff3e0 !important; font-weight: bold; }
  .badge-si { background: #c8e6c9; color: #2e7d32; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 10px; }
  .badge-no { background: #f5f5f5; color: #999; padding: 2px 8px; border-radius: 4px; font-size: 10px; }
  .footer { font-size: 10px; color: #999; padding: 8px 10px; margin-top: 10px; }
</style></head><body>`;
  html += `<div class="title">📊 FX27 — Servicio a Clientes</div>`;
  html += `<div class="subtitle">Reporte generado: ${now} | Grupo Loma Transportes</div>`;
  if (aiSummary) html += `<div class="ai-summary"><b>🤖 Resumen IA:</b><br/>${aiSummary.replace(/\n/g, '<br/>')}</div>`;
  html += `<br/><table cellspacing="0"><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
  rows.forEach(row => {
    html += `<tr>${row.map(cell => `<td>${cell || ''}</td>`).join('')}</tr>`;
  });
  html += `</table><div class="footer">Generado por FX27 Future Experience 27 — Grupo Loma Transportes | ${now}</div></body></html>`;
  const blob = new Blob(['\ufeff' + html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `${filename}_${new Date().toISOString().slice(0,10)}.xls`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
};

// ============ KPI CARD ============
const KPICard = ({ label, value, icon: Icon, color = 'rgba(240,160,80,1)' }: { label: string; value: string | number; icon: any; color?: string }) => (
  <div style={{ ...S.card, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '160px' }}>
    <div style={{ background: `${color}22`, borderRadius: '10px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon style={{ width: '22px', height: '22px', color }} />
    </div>
    <div>
      <div style={{ ...S.font, fontSize: '24px', fontWeight: 800, color: 'rgba(255,255,255,0.95)', lineHeight: 1.1 }}>{value}</div>
      <div style={{ ...S.font, fontSize: '11px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em', textTransform: 'uppercase', marginTop: '2px' }}>{label}</div>
    </div>
  </div>
);

// ============ MAIN COMPONENT ============
export function AtencionClientesModule({ onBack, userEmail, userName, userRole }: Props) {
  const [view, setView] = useState<'home' | 'asignacion' | 'expo' | 'impo'>('home');
  const [loading, setLoading] = useState(true);

  // Data
  const [asignacion, setAsignacion] = useState<ClienteAsignacion[]>([]);
  const [expoData, setExpoData] = useState<DataExpo[]>([]);
  const [impoData, setImpoData] = useState<DataImpo[]>([]);

  // Asignacion state
  const [searchAsig, setSearchAsig] = useState('');
  const [filterEjec, setFilterEjec] = useState('TODOS');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editEjecutivo, setEditEjecutivo] = useState('');

  // Expo state
  const [expoTipo, setExpoTipo] = useState('THERMO');
  const [expoEstado, setExpoEstado] = useState('');
  const [expoExpanded, setExpoExpanded] = useState(false);
  const [searchExpo, setSearchExpo] = useState('');

  // Impo state
  const [searchImpo, setSearchImpo] = useState('');
  const [filterTipoImpo, setFilterTipoImpo] = useState('TODOS');

  // AI state
  const [aiQuery, setAiQuery] = useState('');
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showAI, setShowAI] = useState(false);

  // Export state
  const [exporting, setExporting] = useState(false);

  // ============ FETCH DATA ============
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [asigRes, expoRes, impoRes] = await Promise.all([
          supabase.from('sc_clientes_asignacion').select('*').order('numero'),
          supabase.from('sc_data_expo').select('*').order('viajes', { ascending: false }),
          supabase.from('sc_data_impo').select('*').order('viajes', { ascending: false }),
        ]);
        if (asigRes.data) setAsignacion(asigRes.data);
        if (expoRes.data) setExpoData(expoRes.data);
        if (impoRes.data) setImpoData(impoRes.data);
      } catch (err) { console.error('Error fetching data:', err); }
      setLoading(false);
    };
    fetchAll();
  }, []);

  // ============ ASIGNACION LOGIC ============
  const handleAssign = async (id: number, ejecutivo: string) => {
    const status = ejecutivo === 'PENDIENTE' ? 'PENDIENTE' : 'ASIGNADO';
    const { error } = await supabase.from('sc_clientes_asignacion')
      .update({ ejecutivo_sc: ejecutivo, status, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (!error) {
      setAsignacion(prev => prev.map(c => c.id === id ? { ...c, ejecutivo_sc: ejecutivo, status } : c));
      setEditingId(null);
    }
  };

  const filteredAsignacion = useMemo(() => {
    let data = asignacion;
    if (filterEjec !== 'TODOS') data = data.filter(c => c.ejecutivo_sc === filterEjec);
    if (searchAsig) {
      const q = searchAsig.toLowerCase();
      data = data.filter(c => c.cliente.toLowerCase().includes(q) || (c.notas || '').toLowerCase().includes(q));
    }
    // CSR filter: show only their clients
    if (userRole === 'csr' && userEmail) {
      const csrName = userName?.split(' ')[0]?.toUpperCase() || '';
      if (csrName === 'LIZ' || csrName === 'ELI') {
        data = data.filter(c => c.ejecutivo_sc === csrName || c.status === 'PENDIENTE');
      }
    }
    return data;
  }, [asignacion, filterEjec, searchAsig, userRole, userEmail, userName]);

  const asigKPIs = useMemo(() => ({
    total: asignacion.length,
    eli: asignacion.filter(c => c.ejecutivo_sc === 'ELI').length,
    liz: asignacion.filter(c => c.ejecutivo_sc === 'LIZ').length,
    pendientes: asignacion.filter(c => c.status === 'PENDIENTE').length,
  }), [asignacion]);

  // ============ EXPO LOGIC ============
  const estadosDisponibles = useMemo(() => {
    const estados = [...new Set(expoData.map(d => d.estado))].sort();
    return estados;
  }, [expoData]);

  const filteredExpo = useMemo(() => {
    if (!expoEstado) return [];
    let targetEstados = [expoEstado];
    if (expoExpanded && NEIGHBOR_STATES[expoEstado]) {
      targetEstados = [expoEstado, ...NEIGHBOR_STATES[expoEstado]];
    }
    let data = expoData.filter(d => d.tipo === expoTipo && targetEstados.includes(d.estado));
    if (searchExpo) {
      const q = searchExpo.toLowerCase();
      data = data.filter(d => d.cliente.toLowerCase().includes(q) || d.origenes.toLowerCase().includes(q));
    }
    return data.sort((a, b) => b.viajes - a.viajes);
  }, [expoData, expoTipo, expoEstado, expoExpanded, searchExpo]);

  const expoKPIs = useMemo(() => ({
    clientes: filteredExpo.length,
    viajes: filteredExpo.reduce((s, d) => s + d.viajes, 0),
    formatos: filteredExpo.reduce((s, d) => s + d.num_formatos, 0),
    dedicados: filteredExpo.filter(d => d.dedicado === 'SI').length,
  }), [filteredExpo]);

  // ============ IMPO LOGIC ============
  const filteredImpo = useMemo(() => {
    let data = impoData;
    if (filterTipoImpo !== 'TODOS') {
      if (filterTipoImpo === 'THERMO') data = data.filter(d => d.thermo > 0);
      else if (filterTipoImpo === 'SECO') data = data.filter(d => d.seco > 0);
    }
    if (searchImpo) {
      const q = searchImpo.toLowerCase();
      data = data.filter(d => d.cliente.toLowerCase().includes(q) || (d.zona_entrega || '').toLowerCase().includes(q) || (d.empresa || '').toLowerCase().includes(q));
    }
    return data;
  }, [impoData, filterTipoImpo, searchImpo]);

  const impoKPIs = useMemo(() => ({
    clientes: filteredImpo.length,
    viajes: filteredImpo.reduce((s, d) => s + d.viajes, 0),
    thermo: filteredImpo.reduce((s, d) => s + d.thermo, 0),
    seco: filteredImpo.reduce((s, d) => s + d.seco, 0),
  }), [filteredImpo]);

  // ============ AI SEARCH ============
  const handleAISearch = async () => {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    let context = '';
    if (view === 'asignacion') {
      context = `Datos de asignación de clientes (${asignacion.length} clientes). ELI tiene ${asigKPIs.eli}, LIZ tiene ${asigKPIs.liz}, PENDIENTES: ${asigKPIs.pendientes}. Lista: ${asignacion.slice(0, 50).map(c => `${c.cliente} (${c.ejecutivo_sc})`).join(', ')}...`;
    } else if (view === 'expo') {
      const expoSample = filteredExpo.length > 0 ? filteredExpo : expoData.slice(0, 30);
      context = `Datos de exportación (471 registros). Filtro actual: ${expoTipo} en ${expoEstado || 'sin seleccionar'}. Resultados: ${expoSample.map(d => `${d.cliente}: ${d.viajes} viajes desde ${d.estado} (${d.tipo}, Ded:${d.dedicado}, Cruce:${d.cruce})`).join(' | ')}`;
    } else if (view === 'impo') {
      context = `Datos de importación (${impoData.length} clientes). Top: ${impoData.slice(0, 20).map(d => `${d.cliente}: ${d.viajes}v (T:${d.thermo}/S:${d.seco})`).join(' | ')}`;
    }
    const prompt = `Eres un asistente de Servicio a Clientes para Grupo Loma Transportes (TROB/WEXPRESS/SPEEDYHAUL), empresa de transporte con 242 tractores. Responde en español, conciso y útil.\n\nContexto de datos:\n${context}\n\nPregunta del usuario: ${aiQuery}\n\nResponde de forma directa, práctica y orientada a la acción. Si es una búsqueda, lista los resultados relevantes. Si es una consulta de negocio, da recomendaciones concretas.`;
    const result = await callClaudeAPI(prompt);
    setAiResult(result);
    setAiLoading(false);
  };

  // ============ EXPORT WITH AI ============
  const handleExportWithAI = async (headers: string[], rows: string[][], filename: string, dataContext: string) => {
    setExporting(true);
    let aiSummary = '';
    if (ANTHROPIC_KEY) {
      const prompt = `Genera un resumen ejecutivo breve (3-4 oraciones) en español para este reporte de ${filename} de Grupo Loma Transportes. Datos: ${dataContext}. Incluye insights clave y recomendaciones. Solo el texto, sin títulos ni formato markdown.`;
      aiSummary = await callClaudeAPI(prompt);
    }
    exportToExcel(headers, rows, filename, aiSummary);
    setExporting(false);
  };

  // ============ COMMON HEADER ============
  const Header = ({ title, subtitle }: { title: string; subtitle: string }) => (
    <div style={{
      background: 'linear-gradient(180deg, rgba(15,25,45,0.95) 0%, rgba(12,20,38,0.92) 50%, rgba(10,18,32,0.85) 100%)',
      backdropFilter: 'blur(20px) saturate(140%)', WebkitBackdropFilter: 'blur(20px) saturate(140%)',
      borderBottom: '1px solid rgba(80,120,180,0.15)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
      padding: '0 48px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'relative', marginBottom: '32px',
    }}>
      {/* Top accent line */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
        background: 'linear-gradient(90deg, transparent 0%, rgba(240,160,80,0.3) 20%, rgba(240,160,80,0.6) 50%, rgba(240,160,80,0.3) 80%, transparent 100%)',
        boxShadow: '0 1px 6px rgba(240,160,80,0.3)' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <button onClick={view === 'home' ? onBack : () => setView('home')}
          style={{ ...S.btnSecondary, display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 18px', borderRadius: '0px',
            background: 'linear-gradient(135deg, rgba(20,30,50,0.85) 0%, rgba(15,22,40,0.9) 100%)',
            border: '1px solid rgba(80,120,180,0.25)', boxShadow: '0 2px 8px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)' }}>
          <ArrowLeft style={{ width: '16px', height: '16px' }} /> {view === 'home' ? 'Dashboard' : 'Volver'}
        </button>
        <div>
          <h1 style={{ ...S.text, fontSize: '24px', fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>{title}</h1>
          <p style={{ ...S.textMuted, fontSize: '11px', margin: '2px 0 0 0', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{subtitle}</p>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => setShowAI(!showAI)}
          style={{ ...S.btnSecondary, display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '0px',
            background: showAI ? 'linear-gradient(135deg, rgba(240,160,80,0.15) 0%, rgba(220,140,60,0.1) 100%)' : 'linear-gradient(135deg, rgba(20,30,50,0.85) 0%, rgba(15,22,40,0.9) 100%)',
            border: showAI ? '1px solid rgba(240,160,80,0.5)' : '1px solid rgba(80,120,180,0.25)',
            color: showAI ? 'rgba(240,160,80,1)' : 'rgba(255,255,255,0.85)',
            boxShadow: showAI ? '0 0 16px rgba(240,160,80,0.2), 0 2px 8px rgba(0,0,0,0.25)' : '0 2px 8px rgba(0,0,0,0.25)' }}>
          <Brain style={{ width: '16px', height: '16px' }} /> Buscar con IA
        </button>
        {/* FX27 branding */}
        <div style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '20px', fontWeight: 900, letterSpacing: '-0.02em',
          background: 'linear-gradient(135deg, #E8EEF4 0%, #B5C4D8 30%, #D8DFE8 55%, #9FB0C5 80%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          filter: 'drop-shadow(1px 0 2px rgba(160,180,210,0.15))', marginLeft: '8px' }}>FX27</div>
      </div>
    </div>
  );

  // ============ AI PANEL ============
  const AIPanel = () => showAI ? (
    <div style={{ ...S.card, padding: '16px', marginBottom: '16px', borderColor: 'rgba(240,160,80,0.3)' }}>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: aiResult ? '12px' : '0' }}>
        <Brain style={{ width: '20px', height: '20px', color: 'rgba(240,160,80,0.9)', flexShrink: 0 }} />
        <input value={aiQuery} onChange={e => setAiQuery(e.target.value)} placeholder="Pregunta algo... ej: ¿Qué clientes cargan thermo en Jalisco?"
          style={{ ...S.input, flex: 1 }}
          onKeyDown={e => e.key === 'Enter' && handleAISearch()} />
        <button onClick={handleAISearch} disabled={aiLoading}
          style={{ ...S.btn, display: 'flex', alignItems: 'center', gap: '6px', opacity: aiLoading ? 0.7 : 1 }}>
          {aiLoading ? <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} /> : <Search style={{ width: '16px', height: '16px' }} />}
          {aiLoading ? 'Buscando...' : 'Buscar'}
        </button>
        <button onClick={() => { setShowAI(false); setAiResult(''); setAiQuery(''); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
          <X style={{ width: '18px', height: '18px', color: 'rgba(255,255,255,0.5)' }} />
        </button>
      </div>
      {aiResult && (
        <div style={{ background: 'rgba(240,160,80,0.08)', border: '1px solid rgba(240,160,80,0.2)', borderRadius: '8px', padding: '14px', marginTop: '8px' }}>
          <pre style={{ ...S.text, fontSize: '13px', whiteSpace: 'pre-wrap', margin: 0, lineHeight: 1.6 }}>{aiResult}</pre>
        </div>
      )}
    </div>
  ) : null;

  // ============ LOADING ============
  if (loading) return (
    <div style={{ ...S.bg, width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ ...S.overlay, position: 'absolute', inset: 0 }} />
      <div style={{ position: 'relative', textAlign: 'center' }}>
        <Loader2 style={{ width: '48px', height: '48px', color: 'rgba(240,160,80,0.8)', animation: 'spin 1s linear infinite' }} />
        <p style={{ ...S.text, marginTop: '12px', fontSize: '14px' }}>Cargando datos...</p>
      </div>
    </div>
  );

  // ============ HOME VIEW ============
  if (view === 'home') return (
    <div style={{ ...S.bg, width: '100vw', height: '100vh', overflow: 'auto', position: 'relative' }}>
      <div style={{ ...S.overlay, position: 'fixed', inset: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* HEADER BAR — FX27 STYLE */}
        <div style={{
          background: 'linear-gradient(180deg, rgba(15,25,45,0.95) 0%, rgba(12,20,38,0.92) 50%, rgba(10,18,32,0.85) 100%)',
          backdropFilter: 'blur(20px) saturate(140%)', WebkitBackdropFilter: 'blur(20px) saturate(140%)',
          borderBottom: '1px solid rgba(80,120,180,0.15)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -1px 0 rgba(0,0,0,0.2)',
          padding: '0 48px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'relative',
        }}>
          {/* Top orange accent line */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(240,160,80,0.3) 15%, rgba(240,160,80,0.6) 50%, rgba(240,160,80,0.3) 85%, transparent 100%)',
            boxShadow: '0 1px 8px rgba(240,160,80,0.3)' }} />
          {/* Bottom glow */}
          <div style={{ position: 'absolute', bottom: '-4px', left: '48px', right: '48px', height: '4px',
            background: 'linear-gradient(90deg, transparent, rgba(25,40,65,0.7) 10%, rgba(35,55,85,0.9) 50%, rgba(25,40,65,0.7) 90%, transparent)',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4), 0 2px 8px rgba(10,40,90,0.2)', borderRadius: '2px' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button onClick={onBack}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
                fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 600,
                background: 'linear-gradient(135deg, rgba(20,30,50,0.85) 0%, rgba(15,22,40,0.9) 100%)',
                backdropFilter: 'blur(8px)', border: '1px solid rgba(80,120,180,0.25)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)',
                borderRadius: '0px', color: 'rgba(255,255,255,0.9)', cursor: 'pointer', transition: 'all 0.3s' }}>
              <ArrowLeft style={{ width: '16px', height: '16px' }} /> Dashboard
            </button>
            <div>
              <h1 style={{ ...S.text, fontSize: '26px', fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>Servicio a Clientes</h1>
              <p style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', margin: '4px 0 0 0', letterSpacing: '0.15em', textTransform: 'uppercase',
                color: 'rgba(240,160,80,0.7)', fontWeight: 500 }}>Gestión de clientes, exportaciones e importaciones</p>
            </div>
          </div>
          {/* FX27 Logo */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <div style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '36px', fontWeight: 900, lineHeight: 1,
              background: 'linear-gradient(135deg, #E8EEF4 0%, #B5C4D8 30%, #D8DFE8 55%, #9FB0C5 80%, #D0D9E4 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              filter: 'drop-shadow(2px 0 4px rgba(160,180,210,0.2))' }}>FX27</div>
            <div style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '8px', fontWeight: 500, letterSpacing: '0.2em',
              textTransform: 'uppercase', color: 'rgba(240,160,80,0.6)', marginTop: '2px',
              filter: 'blur(0.3px) drop-shadow(0 0 6px rgba(240,160,80,0.5))' }}>Future Experience 27</div>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div style={{ padding: '40px 48px', maxWidth: '1400px', margin: '0 auto' }}>
          {/* KPI CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '48px' }}>
            {[
              { label: 'CLIENTES ACTIVOS', value: asigKPIs.total, icon: Users, color: 'rgba(240,160,80,1)' },
              { label: 'ASIGNADOS ELI', value: asigKPIs.eli, icon: UserCheck, color: '#4caf50' },
              { label: 'ASIGNADOS LIZ', value: asigKPIs.liz, icon: UserCheck, color: '#2196f3' },
              { label: 'PENDIENTES', value: asigKPIs.pendientes, icon: AlertTriangle, color: '#ff9800' },
            ].map((kpi, i) => {
              const Icon = kpi.icon;
              return (
                <div key={i} style={{
                  background: 'linear-gradient(155deg, rgba(18,32,58,0.96) 0%, rgba(12,22,42,0.98) 35%, rgba(8,16,32,1) 70%, rgba(6,12,24,1) 100%)',
                  border: '1px solid rgba(80,120,180,0.2)', borderRadius: '10px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -1px 0 rgba(0,0,0,0.3)',
                  padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', overflow: 'hidden',
                }}>
                  {/* Top accent */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                    background: `linear-gradient(90deg, transparent, ${kpi.color}66 50%, transparent)` }} />
                  <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: `${kpi.color}18`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon style={{ width: '22px', height: '22px', color: kpi.color }} />
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '28px', fontWeight: 800, color: 'rgba(255,255,255,0.95)', lineHeight: 1 }}>{kpi.value}</div>
                    <div style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px', fontWeight: 700, color: kpi.color,
                      letterSpacing: '0.1em', marginTop: '4px', textTransform: 'uppercase' }}>{kpi.label}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 3 MAIN SECTION BUTTONS — DASHBOARD STYLE */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {[
              { id: 'asignacion' as const, title: 'Asignación de Clientes', desc: `${asigKPIs.total} clientes · ${asigKPIs.pendientes} pendientes`, icon: ClipboardList, color: '#4caf50' },
              { id: 'expo' as const, title: 'Exportaciones', desc: `${expoData.length} registros · 25 estados · THERMO/SECO`, icon: Upload, color: '#ff9800' },
              { id: 'impo' as const, title: 'Importación', desc: `${impoData.length} clientes · USA → México`, icon: Download, color: '#2196f3' },
            ].map(item => {
              const Icon = item.icon;
              return (
                <button key={item.id} onClick={() => setView(item.id)}
                  className="sc-section-btn"
                  style={{
                    background: 'linear-gradient(155deg, rgba(18,32,58,0.96) 0%, rgba(12,22,42,0.98) 35%, rgba(8,16,32,1) 70%, rgba(6,12,24,1) 100%)',
                    border: '2px solid transparent',
                    backgroundImage: 'linear-gradient(155deg, rgba(18,32,58,0.96) 0%, rgba(12,22,42,0.98) 35%, rgba(8,16,32,1) 70%, rgba(6,12,24,1) 100%), linear-gradient(135deg, rgba(180,100,50,0.28) 0%, rgba(60,90,140,0.25) 50%, rgba(180,100,50,0.28) 100%)',
                    backgroundOrigin: 'border-box', backgroundClip: 'padding-box, border-box',
                    borderRadius: '10px', cursor: 'pointer', textAlign: 'center' as const,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.45), 0 8px 24px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -1px 0 rgba(0,0,0,0.35)',
                    padding: '48px 32px', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '20px',
                    transition: 'all 0.3s ease', position: 'relative' as const, overflow: 'hidden',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-6px)';
                    e.currentTarget.style.backgroundImage = 'linear-gradient(155deg, rgba(28,48,82,1) 0%, rgba(20,35,62,1) 35%, rgba(14,24,45,1) 70%, rgba(10,18,35,1) 100%), linear-gradient(135deg, rgba(240,160,80,0.65) 0%, rgba(220,140,70,0.6) 25%, rgba(70,110,170,0.4) 50%, rgba(220,140,70,0.6) 75%, rgba(240,160,80,0.65) 100%)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.4), 0 10px 24px rgba(0,0,0,0.6), 0 18px 48px rgba(220,140,70,0.3), inset 0 2px 0 rgba(255,255,255,0.12), inset 0 -2px 0 rgba(0,0,0,0.5), 0 0 40px rgba(240,160,80,0.25)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.backgroundImage = 'linear-gradient(155deg, rgba(18,32,58,0.96) 0%, rgba(12,22,42,0.98) 35%, rgba(8,16,32,1) 70%, rgba(6,12,24,1) 100%), linear-gradient(135deg, rgba(180,100,50,0.28) 0%, rgba(60,90,140,0.25) 50%, rgba(180,100,50,0.28) 100%)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.45), 0 8px 24px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -1px 0 rgba(0,0,0,0.35)';
                  }}>
                  {/* Top orange accent line on hover */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', opacity: 0, transition: 'opacity 0.3s',
                    background: 'linear-gradient(90deg, transparent 0%, rgba(240,160,80,0.3) 15%, rgba(240,160,80,0.85) 50%, rgba(240,160,80,0.3) 85%, transparent 100%)',
                    boxShadow: '0 2px 12px rgba(240,160,80,0.5)', borderTopLeftRadius: '10px', borderTopRightRadius: '10px' }}
                    className="sc-accent-line" />
                  {/* Highlight superior 3D bisel */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '35%', opacity: 0.3, pointerEvents: 'none',
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 100%)', borderTopLeftRadius: '10px', borderTopRightRadius: '10px' }} />
                  {/* Icon */}
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: `${item.color}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s',
                    boxShadow: `0 0 0 1px ${item.color}30, 0 4px 16px ${item.color}10` }}>
                    <Icon style={{ width: '40px', height: '40px', color: item.color, transition: 'all 0.3s',
                      filter: `drop-shadow(0 2px 8px ${item.color}40)` }} />
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '18px', fontWeight: 700, color: 'rgba(255,255,255,0.95)',
                      textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>{item.title}</div>
                    <div style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '8px' }}>{item.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .sc-section-btn:hover .sc-accent-line { opacity: 1 !important; }
      `}</style>
    </div>
  );

  // ============ ASIGNACION VIEW ============
  if (view === 'asignacion') return (
    <div style={{ ...S.bg, width: '100vw', height: '100vh', overflow: 'auto' }}>
      <div style={{ ...S.overlay, position: 'fixed', inset: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'relative' }}>
        <Header title="Asignación de Clientes" subtitle={`${asigKPIs.total} clientes · Asigna ejecutivo de servicio a cada cliente`} />
        <div style={{ padding: '24px 40px' }}>
        <AIPanel />

        {/* KPIs */}
        <div style={{ display: 'flex', gap: '14px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <KPICard label="Total Clientes" value={asigKPIs.total} icon={Users} />
          <KPICard label="Eli Pasillas" value={asigKPIs.eli} icon={UserCheck} color="#4caf50" />
          <KPICard label="Liz Garcia" value={asigKPIs.liz} icon={UserCheck} color="#2196f3" />
          <KPICard label="Pendientes" value={asigKPIs.pendientes} icon={AlertTriangle} color="#ff9800" />
        </div>

        {/* Filters & Actions */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'rgba(255,255,255,0.4)' }} />
            <input value={searchAsig} onChange={e => setSearchAsig(e.target.value)} placeholder="Buscar cliente..."
              style={{ ...S.input, paddingLeft: '38px' }} />
          </div>
          <select value={filterEjec} onChange={e => setFilterEjec(e.target.value)} style={{ ...S.select, width: '180px' }}>
            <option value="TODOS">Todos</option>
            <option value="ELI">ELI</option>
            <option value="LIZ">LIZ</option>
            <option value="PENDIENTE">Pendientes</option>
          </select>
          <button onClick={() => {
            const headers = ['#', 'CLIENTE', 'EJECUTIVO SC', 'STATUS', 'NOTAS'];
            const rows = filteredAsignacion.map(c => [String(c.numero), c.cliente, c.ejecutivo_sc, c.status, c.notas || '']);
            const ctx = `${asigKPIs.total} clientes totales, ELI: ${asigKPIs.eli}, LIZ: ${asigKPIs.liz}, Pendientes: ${asigKPIs.pendientes}`;
            handleExportWithAI(headers, rows, 'Asignacion_Clientes_SC', ctx);
          }} disabled={exporting}
            style={{ ...S.btn, display: 'flex', alignItems: 'center', gap: '6px' }}>
            {exporting ? <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} /> : <FileSpreadsheet style={{ width: '16px', height: '16px' }} />}
            Exportar Excel
          </button>
        </div>

        {/* Table */}
        <div style={{ ...S.card, overflow: 'hidden' }}>
          <div style={{ maxHeight: 'calc(100vh - 380px)', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 5 }}>
                <tr>
                  <th style={{ ...S.tableHeader, width: '50px' }}>#</th>
                  <th style={{ ...S.tableHeader }}>Cliente</th>
                  <th style={{ ...S.tableHeader, width: '150px' }}>Ejecutivo SC</th>
                  <th style={{ ...S.tableHeader, width: '120px' }}>Status</th>
                  <th style={{ ...S.tableHeader }}>Notas</th>
                  <th style={{ ...S.tableHeader, width: '100px' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {filteredAsignacion.map(c => (
                  <tr key={c.id} style={{ transition: 'background 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(240,160,80,0.05)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ ...S.tableCell, color: 'rgba(255,255,255,0.4)' }}>{c.numero}</td>
                    <td style={{ ...S.tableCell, fontWeight: 600 }}>{c.cliente}</td>
                    <td style={S.tableCell}>
                      {editingId === c.id ? (
                        <select value={editEjecutivo} onChange={e => setEditEjecutivo(e.target.value)}
                          style={{ ...S.select, padding: '6px 10px', fontSize: '12px', width: '120px' }}>
                          <option value="PENDIENTE">PENDIENTE</option>
                          {EJECUTIVOS_SC.map(e => <option key={e} value={e}>{e}</option>)}
                        </select>
                      ) : (
                        <span style={{
                          padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, fontFamily: "'Exo 2', sans-serif",
                          background: c.ejecutivo_sc === 'ELI' ? 'rgba(76,175,80,0.15)' : c.ejecutivo_sc === 'LIZ' ? 'rgba(33,150,243,0.15)' : 'rgba(255,152,0,0.15)',
                          color: c.ejecutivo_sc === 'ELI' ? '#66bb6a' : c.ejecutivo_sc === 'LIZ' ? '#42a5f5' : '#ffa726',
                        }}>{c.ejecutivo_sc}</span>
                      )}
                    </td>
                    <td style={S.tableCell}>
                      <span style={{
                        padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, fontFamily: "'Exo 2', sans-serif",
                        background: c.status === 'ASIGNADO' ? 'rgba(76,175,80,0.12)' : 'rgba(255,152,0,0.12)',
                        color: c.status === 'ASIGNADO' ? '#66bb6a' : '#ffa726',
                      }}>{c.status}</span>
                    </td>
                    <td style={{ ...S.tableCell, fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{c.notas || '—'}</td>
                    <td style={S.tableCell}>
                      {editingId === c.id ? (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button onClick={() => handleAssign(c.id, editEjecutivo)}
                            style={{ background: 'rgba(76,175,80,0.2)', border: '1px solid rgba(76,175,80,0.4)', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}>
                            <Check style={{ width: '14px', height: '14px', color: '#66bb6a' }} />
                          </button>
                          <button onClick={() => setEditingId(null)}
                            style={{ background: 'rgba(255,80,80,0.15)', border: '1px solid rgba(255,80,80,0.3)', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}>
                            <X style={{ width: '14px', height: '14px', color: '#ff6b6b' }} />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditingId(c.id); setEditEjecutivo(c.ejecutivo_sc); }}
                          style={{ ...S.btnSecondary, padding: '5px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <UserCheck style={{ width: '13px', height: '13px' }} /> Asignar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div style={{ ...S.textMuted, fontSize: '11px', marginTop: '8px', textAlign: 'right' }}>
          Mostrando {filteredAsignacion.length} de {asignacion.length} clientes
        </div>
      </div></div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // ============ EXPORTACIONES VIEW ============
  if (view === 'expo') {
    const neighborStates = expoEstado ? (NEIGHBOR_STATES[expoEstado] || []) : [];
    return (
      <div style={{ ...S.bg, width: '100vw', height: '100vh', overflow: 'auto' }}>
        <div style={{ ...S.overlay, position: 'fixed', inset: 0, pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <Header title="Buscador de Exportaciones" subtitle="Encuentra clientes por tipo de equipo y estado de origen" />
          <div style={{ padding: '24px 40px' }}>
          <AIPanel />

          {/* Filters */}
          <div style={{ ...S.card, padding: '20px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: '0 0 200px' }}>
                <label style={{ ...S.textMuted, fontSize: '11px', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Tipo de Equipo
                </label>
                <div style={{ display: 'flex', gap: '0' }}>
                  {['THERMO', 'SECO'].map(t => (
                    <button key={t} onClick={() => setExpoTipo(t)}
                      style={{
                        flex: 1, padding: '10px 16px', fontFamily: "'Exo 2', sans-serif", fontWeight: 700, fontSize: '13px',
                        border: '1px solid rgba(80,120,180,0.3)', cursor: 'pointer', transition: 'all 0.2s',
                        borderRadius: t === 'THERMO' ? '8px 0 0 8px' : '0 8px 8px 0',
                        background: expoTipo === t ? (t === 'THERMO' ? 'rgba(33,150,243,0.3)' : 'rgba(255,152,0,0.3)') : 'rgba(10,20,40,0.6)',
                        color: expoTipo === t ? '#fff' : 'rgba(255,255,255,0.5)',
                        borderColor: expoTipo === t ? (t === 'THERMO' ? 'rgba(33,150,243,0.6)' : 'rgba(255,152,0,0.6)') : 'rgba(80,120,180,0.3)',
                      }}>
                      {t === 'THERMO' ? '❄️' : '📦'} {t}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ flex: 1, minWidth: '250px' }}>
                <label style={{ ...S.textMuted, fontSize: '11px', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Estado de Origen
                </label>
                <select value={expoEstado} onChange={e => { setExpoEstado(e.target.value); setExpoExpanded(false); }}
                  style={S.select}>
                  <option value="">— Selecciona un estado —</option>
                  {estadosDisponibles.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>

              {expoEstado && neighborStates.length > 0 && (
                <button onClick={() => setExpoExpanded(!expoExpanded)}
                  style={{
                    ...S.btnSecondary, display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px',
                    ...(expoExpanded ? { border: '1px solid rgba(33,150,243,0.5)', color: '#42a5f5', background: 'rgba(33,150,243,0.1)' } : {}),
                  }}>
                  <MapPin style={{ width: '16px', height: '16px' }} />
                  {expoExpanded ? `Búsqueda ampliada (${neighborStates.length + 1} estados)` : `Ampliar a estados vecinos (+${neighborStates.length})`}
                </button>
              )}

              <div style={{ position: 'relative', flex: '0 0 250px' }}>
                <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'rgba(255,255,255,0.4)' }} />
                <input value={searchExpo} onChange={e => setSearchExpo(e.target.value)} placeholder="Filtrar cliente..."
                  style={{ ...S.input, paddingLeft: '38px' }} />
              </div>
            </div>

            {expoExpanded && neighborStates.length > 0 && (
              <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ ...S.textMuted, fontSize: '11px' }}>Estados incluidos:</span>
                {[expoEstado, ...neighborStates].map(e => (
                  <span key={e} style={{
                    padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, fontFamily: "'Exo 2', sans-serif",
                    background: e === expoEstado ? 'rgba(240,160,80,0.2)' : 'rgba(33,150,243,0.15)',
                    color: e === expoEstado ? '#ffa726' : '#42a5f5',
                    border: `1px solid ${e === expoEstado ? 'rgba(240,160,80,0.4)' : 'rgba(33,150,243,0.3)'}`,
                  }}>{e}</span>
                ))}
              </div>
            )}
          </div>

          {/* KPIs */}
          {expoEstado && (
            <div style={{ display: 'flex', gap: '14px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <KPICard label="Clientes" value={expoKPIs.clientes} icon={Users} />
              <KPICard label="Viajes" value={expoKPIs.viajes.toLocaleString()} icon={Truck} color="#2196f3" />
              <KPICard label="Formatos" value={expoKPIs.formatos} icon={ClipboardList} color="#9c27b0" />
              <KPICard label="Dedicados" value={expoKPIs.dedicados} icon={UserCheck} color="#4caf50" />
            </div>
          )}

          {/* Export button */}
          {filteredExpo.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
              <button onClick={() => {
                const headers = ['#', 'CLIENTE', 'VIAJES', 'FORMATOS', 'ORÍGENES', 'DEDICADO', 'CRUCE', 'EMPRESA', 'ESTADO'];
                const rows = filteredExpo.map((d, i) => [String(i + 1), d.cliente, String(d.viajes), String(d.num_formatos), d.origenes, d.dedicado, d.cruce, d.empresa, d.estado]);
                const ctx = `Búsqueda: ${expoTipo} en ${expoEstado}${expoExpanded ? ' + vecinos' : ''}. ${expoKPIs.clientes} clientes, ${expoKPIs.viajes} viajes, ${expoKPIs.dedicados} dedicados`;
                handleExportWithAI(headers, rows, `EXPO_${expoTipo}_${expoEstado}`, ctx);
              }} disabled={exporting}
                style={{ ...S.btn, display: 'flex', alignItems: 'center', gap: '6px' }}>
                {exporting ? <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} /> : <FileSpreadsheet style={{ width: '16px', height: '16px' }} />}
                Exportar Excel
              </button>
            </div>
          )}

          {/* Results */}
          {!expoEstado ? (
            <div style={{ ...S.card, padding: '60px 40px', textAlign: 'center' }}>
              <MapPin style={{ width: '48px', height: '48px', color: 'rgba(240,160,80,0.4)', margin: '0 auto 16px' }} />
              <p style={{ ...S.text, fontSize: '16px', fontWeight: 600 }}>Selecciona tipo de equipo y estado</p>
              <p style={{ ...S.textMuted, fontSize: '13px', marginTop: '8px' }}>
                Elige THERMO o SECO y un estado para ver los clientes que han cargado desde ahí
              </p>
            </div>
          ) : filteredExpo.length === 0 ? (
            <div style={{ ...S.card, padding: '40px', textAlign: 'center' }}>
              <AlertTriangle style={{ width: '36px', height: '36px', color: 'rgba(255,152,0,0.6)', margin: '0 auto 12px' }} />
              <p style={{ ...S.text, fontSize: '14px' }}>No se encontraron resultados para {expoTipo} en {expoEstado}</p>
              {!expoExpanded && neighborStates.length > 0 && (
                <button onClick={() => setExpoExpanded(true)} style={{ ...S.btn, marginTop: '12px' }}>
                  Ampliar búsqueda a estados vecinos
                </button>
              )}
            </div>
          ) : (
            <div style={{ ...S.card, overflow: 'hidden' }}>
              <div style={{ maxHeight: 'calc(100vh - 460px)', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 5 }}>
                    <tr>
                      <th style={{ ...S.tableHeader, width: '40px' }}>#</th>
                      <th style={S.tableHeader}>Cliente</th>
                      <th style={{ ...S.tableHeader, width: '80px', textAlign: 'center' }}>Viajes</th>
                      <th style={{ ...S.tableHeader, width: '70px', textAlign: 'center' }}>Fmts</th>
                      <th style={S.tableHeader}>Orígenes</th>
                      <th style={{ ...S.tableHeader, width: '80px', textAlign: 'center' }}>Dedicado</th>
                      <th style={{ ...S.tableHeader, width: '70px', textAlign: 'center' }}>Cruce</th>
                      <th style={{ ...S.tableHeader, width: '130px' }}>Empresa</th>
                      {expoExpanded && <th style={{ ...S.tableHeader, width: '120px' }}>Estado</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpo.map((d, i) => (
                      <tr key={d.id} style={{ transition: 'background 0.2s', background: d.dedicado === 'SI' ? 'rgba(76,175,80,0.04)' : 'transparent' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(240,160,80,0.06)')}
                        onMouseLeave={e => (e.currentTarget.style.background = d.dedicado === 'SI' ? 'rgba(76,175,80,0.04)' : 'transparent')}>
                        <td style={{ ...S.tableCell, color: 'rgba(255,255,255,0.4)' }}>{i + 1}</td>
                        <td style={{ ...S.tableCell, fontWeight: 600 }}>{d.cliente}</td>
                        <td style={{ ...S.tableCell, textAlign: 'center', fontWeight: 700, color: 'rgba(240,160,80,1)' }}>{d.viajes}</td>
                        <td style={{ ...S.tableCell, textAlign: 'center' }}>{d.num_formatos}</td>
                        <td style={{ ...S.tableCell, fontSize: '11px', color: 'rgba(255,255,255,0.6)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          title={d.origenes}>{d.origenes}</td>
                        <td style={{ ...S.tableCell, textAlign: 'center' }}>
                          <span style={{
                            padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, fontFamily: "'Exo 2', sans-serif",
                            background: d.dedicado === 'SI' ? 'rgba(76,175,80,0.15)' : 'rgba(120,120,120,0.1)',
                            color: d.dedicado === 'SI' ? '#66bb6a' : 'rgba(255,255,255,0.35)',
                          }}>{d.dedicado}</span>
                        </td>
                        <td style={{ ...S.tableCell, textAlign: 'center' }}>
                          <span style={{
                            padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, fontFamily: "'Exo 2', sans-serif",
                            background: d.cruce === 'SI' ? 'rgba(33,150,243,0.15)' : 'rgba(120,120,120,0.1)',
                            color: d.cruce === 'SI' ? '#42a5f5' : 'rgba(255,255,255,0.35)',
                          }}>{d.cruce}</span>
                        </td>
                        <td style={{ ...S.tableCell, fontSize: '11px' }}>{d.empresa || '—'}</td>
                        {expoExpanded && (
                          <td style={S.tableCell}>
                            <span style={{
                              padding: '3px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 600, fontFamily: "'Exo 2', sans-serif",
                              background: d.estado === expoEstado ? 'rgba(240,160,80,0.15)' : 'rgba(33,150,243,0.1)',
                              color: d.estado === expoEstado ? '#ffa726' : '#42a5f5',
                            }}>{d.estado}</span>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <div style={{ ...S.textMuted, fontSize: '11px', marginTop: '8px', textAlign: 'right' }}>
            {filteredExpo.length} resultados · {expoTipo} · {expoExpanded ? `${expoEstado} + vecinos` : expoEstado || 'Sin filtro'}
          </div>
        </div></div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ============ IMPORTACION VIEW ============
  return (
    <div style={{ ...S.bg, width: '100vw', height: '100vh', overflow: 'auto' }}>
      <div style={{ ...S.overlay, position: 'fixed', inset: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'relative' }}>
        <Header title="Clientes de Importación" subtitle={`${impoData.length} clientes · Entregas USA → México`} />
        <div style={{ padding: '24px 40px' }}>
        <AIPanel />

        {/* KPIs */}
        <div style={{ display: 'flex', gap: '14px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <KPICard label="Clientes" value={impoKPIs.clientes} icon={Users} />
          <KPICard label="Viajes Totales" value={impoKPIs.viajes.toLocaleString()} icon={Truck} color="#2196f3" />
          <KPICard label="Viajes Thermo" value={impoKPIs.thermo.toLocaleString()} icon={Download} color="#29b6f6" />
          <KPICard label="Viajes Seco" value={impoKPIs.seco.toLocaleString()} icon={Upload} color="#ff9800" />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'rgba(255,255,255,0.4)' }} />
            <input value={searchImpo} onChange={e => setSearchImpo(e.target.value)} placeholder="Buscar cliente, zona o empresa..."
              style={{ ...S.input, paddingLeft: '38px' }} />
          </div>
          <select value={filterTipoImpo} onChange={e => setFilterTipoImpo(e.target.value)} style={{ ...S.select, width: '180px' }}>
            <option value="TODOS">Todos los tipos</option>
            <option value="THERMO">Solo Thermo</option>
            <option value="SECO">Solo Seco</option>
          </select>
          <button onClick={() => {
            const headers = ['#', 'CLIENTE', 'VIAJES', 'THERMO', 'SECO', 'FORMATOS', 'TIPO EQUIPO', 'ZONA ENTREGA', 'EMPRESA'];
            const rows = filteredImpo.map(d => [String(d.numero), d.cliente, String(d.viajes), String(d.thermo), String(d.seco), String(d.formatos), d.tipo_equipo, d.zona_entrega, d.empresa || '']);
            const ctx = `${impoKPIs.clientes} clientes IMPO, ${impoKPIs.viajes} viajes totales, ${impoKPIs.thermo} thermo, ${impoKPIs.seco} seco`;
            handleExportWithAI(headers, rows, 'Importacion_Clientes', ctx);
          }} disabled={exporting}
            style={{ ...S.btn, display: 'flex', alignItems: 'center', gap: '6px' }}>
            {exporting ? <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} /> : <FileSpreadsheet style={{ width: '16px', height: '16px' }} />}
            Exportar Excel
          </button>
        </div>

        {/* Table */}
        <div style={{ ...S.card, overflow: 'hidden' }}>
          <div style={{ maxHeight: 'calc(100vh - 380px)', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 5 }}>
                <tr>
                  <th style={{ ...S.tableHeader, width: '40px' }}>#</th>
                  <th style={S.tableHeader}>Cliente</th>
                  <th style={{ ...S.tableHeader, width: '70px', textAlign: 'center' }}>Viajes</th>
                  <th style={{ ...S.tableHeader, width: '70px', textAlign: 'center' }}>Thermo</th>
                  <th style={{ ...S.tableHeader, width: '70px', textAlign: 'center' }}>Seco</th>
                  <th style={{ ...S.tableHeader, width: '70px', textAlign: 'center' }}>Fmts</th>
                  <th style={{ ...S.tableHeader, width: '120px' }}>Tipo Equipo</th>
                  <th style={S.tableHeader}>Zona de Entrega</th>
                  <th style={{ ...S.tableHeader, width: '140px' }}>Empresa</th>
                </tr>
              </thead>
              <tbody>
                {filteredImpo.map(d => (
                  <tr key={d.id} style={{ transition: 'background 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(240,160,80,0.05)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ ...S.tableCell, color: 'rgba(255,255,255,0.4)' }}>{d.numero}</td>
                    <td style={{ ...S.tableCell, fontWeight: 600 }}>{d.cliente}</td>
                    <td style={{ ...S.tableCell, textAlign: 'center', fontWeight: 700, color: 'rgba(240,160,80,1)' }}>{d.viajes}</td>
                    <td style={{ ...S.tableCell, textAlign: 'center', color: d.thermo > 0 ? '#29b6f6' : 'rgba(255,255,255,0.25)' }}>{d.thermo}</td>
                    <td style={{ ...S.tableCell, textAlign: 'center', color: d.seco > 0 ? '#ffa726' : 'rgba(255,255,255,0.25)' }}>{d.seco}</td>
                    <td style={{ ...S.tableCell, textAlign: 'center' }}>{d.formatos}</td>
                    <td style={S.tableCell}>
                      <span style={{
                        padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, fontFamily: "'Exo 2', sans-serif",
                        background: d.tipo_equipo.includes('THERMO') && d.tipo_equipo.includes('SECO') ? 'rgba(156,39,176,0.15)' : d.tipo_equipo.includes('THERMO') ? 'rgba(33,150,243,0.15)' : 'rgba(255,152,0,0.15)',
                        color: d.tipo_equipo.includes('THERMO') && d.tipo_equipo.includes('SECO') ? '#ba68c8' : d.tipo_equipo.includes('THERMO') ? '#42a5f5' : '#ffa726',
                      }}>{d.tipo_equipo}</span>
                    </td>
                    <td style={{ ...S.tableCell, fontSize: '11px', color: 'rgba(255,255,255,0.6)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      title={d.zona_entrega}>{d.zona_entrega}</td>
                    <td style={{ ...S.tableCell, fontSize: '11px' }}>{d.empresa || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div style={{ ...S.textMuted, fontSize: '11px', marginTop: '8px', textAlign: 'right' }}>
          Mostrando {filteredImpo.length} de {impoData.length} clientes
        </div>
      </div></div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
