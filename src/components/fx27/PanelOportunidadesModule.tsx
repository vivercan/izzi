import { ModuleTemplate } from './ModuleTemplate';
import { useState, useEffect } from 'react';
import { MODULE_IMAGES } from '../../assets/module-images';
import { Search, Download, TrendingUp, X, BarChart3, Building2, User, Calendar, Eye, Trash2, SortAsc, SortDesc, FileText, Upload, Pencil, AlertTriangle, Loader2, CheckCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface PanelOportunidadesModuleProps { onBack: () => void; }
interface Cotizacion { nombre: string; url: string; fecha: string; analisis?: any; eliminado?: boolean; }
interface Lead { id: string; nombreEmpresa: string; paginaWeb: string; nombreContacto: string; telefonoContacto?: string; correoElectronico: string; tipoServicio: string[]; tipoViaje: string[]; principalesRutas: string; viajesPorMes: string; tarifa: string; proyectadoVentaMensual?: string; proximosPasos: string; etapaLead?: string; altaCliente?: boolean; generacionSOP?: boolean; juntaArranque?: boolean; facturado?: boolean; vendedor: string; fechaCreacion: string; fechaActualizacion?: string; cotizaciones?: Cotizacion[]; eliminado?: boolean; fechaEliminado?: string; }
type SortField = 'nombreEmpresa' | 'vendedor' | 'fechaCreacion' | 'viajesPorMes';
type SortDirection = 'asc' | 'desc';

const formatDate = (dateStr: string | undefined): string => {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return '-'; }
};

export const PanelOportunidadesModule = ({ onBack }: PanelOportunidadesModuleProps) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVendedor, setFilterVendedor] = useState('');
  const [filterFecha, setFilterFecha] = useState('');
  const [sortField, setSortField] = useState<SortField>('fechaCreacion');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showFunnel, setShowFunnel] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [cotizacionesModal, setCotizacionesModal] = useState<Lead | null>(null);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [formData, setFormData] = useState<Partial<Lead>>({});
  const [deleteModal, setDeleteModal] = useState<Lead | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [analizando, setAnalizando] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [pdfPreview, setPdfPreview] = useState<string | null>(null);
  const [tipoCambio] = useState(18.18);

  const handleInputChange = (field: keyof Lead, value: any) => {
    if (field === 'nombreContacto') { setFormData({ ...formData, [field]: value.toLowerCase().split(' ').map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ') }); }
    else if (field === 'correoElectronico') { setFormData({ ...formData, [field]: value.toLowerCase() }); }
    else { setFormData({ ...formData, [field]: value }); }
  };

  useEffect(() => { if (editLead) setFormData(editLead); }, [editLead]);

  useEffect(() => {
    const cargarLeads = async () => {
      try {
        const session = localStorage.getItem('fx27-session');
        let vendedorActual = '', esAdmin = false;
        if (session) {
          const { email } = JSON.parse(session);
          const usuarios = JSON.parse(localStorage.getItem('fx27-usuarios') || '[]');
          const usuario = usuarios.find((u: any) => u.correo === email);
          if (usuario) { vendedorActual = usuario.nombre; esAdmin = usuario.rol === 'admin'; setIsAdmin(esAdmin); }
        }
        const url = esAdmin ? `https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/leads` : `https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/leads?vendedor=${encodeURIComponent(vendedorActual)}`;
        const response = await fetch(url, { headers: { 'Authorization': `Bearer ${publicAnonKey}` } });
        const result = await response.json();
        if (response.ok && result.success) { setLeads(result.leads); setFilteredLeads(result.leads.filter((l: Lead) => !l.eliminado)); }
      } catch (error) { console.error('Error:', error); }
    };
    cargarLeads();
  }, []);

  useEffect(() => {
    let resultado = [...leads];
    if (!showDeleted) resultado = resultado.filter(lead => !lead.eliminado);
    if (searchTerm) resultado = resultado.filter(lead => lead.nombreEmpresa.toLowerCase().includes(searchTerm.toLowerCase()) || lead.nombreContacto.toLowerCase().includes(searchTerm.toLowerCase()) || lead.correoElectronico.toLowerCase().includes(searchTerm.toLowerCase()));
    if (filterVendedor) resultado = resultado.filter(lead => lead.vendedor === filterVendedor);
    if (filterFecha) resultado = resultado.filter(lead => { try { return new Date(lead.fechaCreacion).toISOString().split('T')[0] === filterFecha; } catch { return false; } });
    resultado.sort((a, b) => {
      let valueA: any = a[sortField], valueB: any = b[sortField];
      if (sortField === 'viajesPorMes') { valueA = parseInt(valueA) || 0; valueB = parseInt(valueB) || 0; }
      if (sortField === 'fechaCreacion') { try { valueA = new Date(valueA).getTime() || 0; valueB = new Date(valueB).getTime() || 0; } catch { valueA = 0; valueB = 0; } }
      if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    setFilteredLeads(resultado);
  }, [leads, searchTerm, filterVendedor, filterFecha, sortField, sortDirection, showDeleted]);

  const handleSort = (field: SortField) => { if (sortField === field) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc'); else { setSortField(field); setSortDirection('asc'); } };
  const handleExportExcel = () => { const headers = ['Empresa', 'Contacto', 'Email', 'Servicio', 'Viaje', 'Rutas', 'Viajes/Mes', 'Tarifa', 'Vendedor', 'Fecha']; const rows = filteredLeads.map(lead => [lead.nombreEmpresa, lead.nombreContacto, lead.correoElectronico, lead.tipoServicio.join(', '), lead.tipoViaje.join(', '), lead.principalesRutas, lead.viajesPorMes, lead.tarifa, lead.vendedor, formatDate(lead.fechaCreacion)]); const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n'); const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `leads_fx27_${new Date().toISOString().split('T')[0]}.csv`; link.click(); };
  const getVendedoresUnicos = () => Array.from(new Set(leads.map(lead => lead.vendedor)));

  const analizarCotizacion = async (pdfText: string, fileName: string): Promise<any> => {
    console.log('=== INICIANDO ANÁLISIS ===');
    console.log('Archivo:', fileName);
    console.log('Texto (primeros 500):', pdfText.substring(0, 500));
    
    try {
      const url = `https://${projectId}.supabase.co/functions/v1/analyze-cotizacion`;
      const textoParaEnviar = pdfText.length > 100 ? pdfText.substring(0, 8000) : `Cotización de transporte: ${fileName}. Por favor analiza y proporciona valores típicos para una cotización de transporte refrigerado.`;
      
      const response = await fetch(url, { 
        method: 'POST', 
        headers: { 'Authorization': `Bearer ${publicAnonKey}`, 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ pdfText: textoParaEnviar, tipoCambio })
      });
      
      console.log('Status:', response.status);
      const text = await response.text();
      console.log('Response raw:', text);
      
      try {
        const result = JSON.parse(text);
        console.log('Parsed result:', result);
        
        if (result.success && result.analisis) {
          let analisis = result.analisis;
          if (analisis.raw && typeof analisis.raw === 'string') {
            const jsonMatch = analisis.raw.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              try { analisis = JSON.parse(jsonMatch[0]); } catch {}
            }
          }
          return analisis;
        }
        return null;
      } catch (e) {
        console.error('Error parsing:', e);
        return null;
      }
    } catch (error) { 
      console.error('Error fetch:', error); 
      return null; 
    }
  };

  const handleSubirCotizaciones = async (files: FileList, lead: Lead) => {
    setAnalizando(true);
    setStatusMsg('Leyendo archivos...');
    const archivos = Array.from(files).filter(f => f.type === 'application/pdf');
    
    if (archivos.length === 0) { alert('Solo se permiten archivos PDF'); setAnalizando(false); setStatusMsg(''); return; }

    let nuevasCotizaciones = [...(lead.cotizaciones || [])];
    let tiposServicio = [...(lead.tipoServicio || [])], tiposViaje = [...(lead.tipoViaje || [])];
    let rutas = lead.principalesRutas || '', tarifa = lead.tarifa || '', viajes = lead.viajesPorMes || '';

    for (let i = 0; i < archivos.length; i++) {
      const file = archivos[i];
      setStatusMsg(`Procesando ${i + 1}/${archivos.length}: ${file.name}`);
      
      try {
        const base64 = await new Promise<string>((resolve, reject) => { 
          const reader = new FileReader(); 
          reader.onload = () => resolve(reader.result as string); 
          reader.onerror = () => reject('Error');
          reader.readAsDataURL(file); 
        });

        setStatusMsg(`Analizando ${file.name}...`);
        const analisis = await analizarCotizacion(file.name, file.name);
        console.log('Análisis obtenido:', analisis);

        nuevasCotizaciones.push({ nombre: file.name, url: base64, fecha: new Date().toISOString(), analisis, eliminado: false });

        if (analisis && !analisis.error) {
          if (Array.isArray(analisis.tipoServicio)) analisis.tipoServicio.forEach((s: string) => { if (s && !tiposServicio.includes(s)) tiposServicio.push(s); });
          if (Array.isArray(analisis.tipoViaje)) analisis.tipoViaje.forEach((v: string) => { if (v && !tiposViaje.includes(v)) tiposViaje.push(v); });
          if (analisis.rutas && !rutas.includes(analisis.rutas)) rutas = rutas ? `${rutas}, ${analisis.rutas}` : analisis.rutas;
          if (analisis.tarifaMXN) tarifa = `$${Number(analisis.tarifaMXN).toLocaleString()} MXN`;
          if (analisis.viajes) viajes = String(parseInt(viajes || '0') + parseInt(String(analisis.viajes)));
        }
      } catch (fileError) {
        console.error('Error archivo:', fileError);
        nuevasCotizaciones.push({ nombre: file.name, url: '', fecha: new Date().toISOString(), analisis: { error: String(fileError) }, eliminado: false });
      }
    }

    setStatusMsg('Guardando...');
    const leadActualizado = { 
      ...lead, 
      cotizaciones: nuevasCotizaciones, 
      tipoServicio: tiposServicio.length > 0 ? tiposServicio : lead.tipoServicio, 
      tipoViaje: tiposViaje.length > 0 ? tiposViaje : lead.tipoViaje, 
      principalesRutas: rutas || lead.principalesRutas, 
      tarifa: tarifa || lead.tarifa, 
      viajesPorMes: viajes || lead.viajesPorMes, 
      etapaLead: 'Cotizado', 
      fechaActualizacion: new Date().toISOString() 
    };
    
    try {
      await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/leads/${lead.id}`, { method: 'PUT', headers: { 'Authorization': `Bearer ${publicAnonKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify(leadActualizado) });
      setLeads(leads.map(l => l.id === lead.id ? leadActualizado : l));
      setCotizacionesModal(leadActualizado);
      alert(`${archivos.length} cotización(es) procesadas`);
    } catch { alert('Error guardando'); }
    setAnalizando(false);
    setStatusMsg('');
  };

  const handleEliminarCotizacion = async (lead: Lead, index: number) => {
    const cotizaciones = lead.cotizaciones?.map((c, i) => i === index ? { ...c, eliminado: true } : c) || [];
    const leadActualizado = { ...lead, cotizaciones, fechaActualizacion: new Date().toISOString() };
    try {
      await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/leads/${lead.id}`, { method: 'PUT', headers: { 'Authorization': `Bearer ${publicAnonKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify(leadActualizado) });
      setLeads(leads.map(l => l.id === lead.id ? leadActualizado : l));
      setCotizacionesModal(leadActualizado);
    } catch { alert('Error'); }
  };

  const handleConfirmarEliminacion = async () => {
    if (!deleteModal || deleteConfirmText !== 'DELETE') return;
    try {
      const leadActualizado = { ...deleteModal, eliminado: true, fechaEliminado: new Date().toISOString() };
      await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/leads/${deleteModal.id}`, { method: 'PUT', headers: { 'Authorization': `Bearer ${publicAnonKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify(leadActualizado) });
      setLeads(leads.map(l => l.id === deleteModal.id ? leadActualizado : l));
      setDeleteModal(null); setDeleteConfirmText('');
    } catch { alert('Error'); }
  };

  const handleRestaurarLead = async (lead: Lead) => {
    if (!isAdmin) return;
    try {
      const leadActualizado = { ...lead, eliminado: false, fechaEliminado: null };
      await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/leads/${lead.id}`, { method: 'PUT', headers: { 'Authorization': `Bearer ${publicAnonKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify(leadActualizado) });
      setLeads(leads.map(l => l.id === lead.id ? leadActualizado : l));
    } catch { console.error('Error'); }
  };

  const handleGuardarEdicion = async () => {
    if (!editLead || !formData?.nombreEmpresa?.trim() || !formData?.nombreContacto?.trim() || !formData?.correoElectronico?.trim()) { alert('Campos obligatorios'); return; }
    try {
      const leadActualizado = { ...editLead, ...formData, tipoServicio: formData.tipoServicio || [], tipoViaje: formData.tipoViaje || [], fechaActualizacion: new Date().toISOString() };
      await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/leads/${editLead.id}`, { method: 'PUT', headers: { 'Authorization': `Bearer ${publicAnonKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify(leadActualizado) });
      setLeads(leads.map(l => l.id === editLead.id ? leadActualizado : l));
      setEditLead(null); setFormData({});
    } catch { alert('Error'); }
  };

  const handleToggleServicio = (s: string) => { const arr = formData.tipoServicio || []; setFormData({ ...formData, tipoServicio: arr.includes(s) ? arr.filter(x => x !== s) : [...arr, s] }); };
  const handleToggleViaje = (v: string) => { const arr = formData.tipoViaje || []; setFormData({ ...formData, tipoViaje: arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v] }); };
  const SortIcon = ({ field }: { field: SortField }) => sortField !== field ? <SortAsc className="w-4 h-4 opacity-30" /> : sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />;

  return (
    <ModuleTemplate title="Panel de Oportunidades" onBack={onBack} headerImage={MODULE_IMAGES.PANEL_OPORTUNIDADES}>
      <div className="flex flex-col h-[calc(100vh-120px)]">
        <div className="flex-shrink-0 p-4 pb-2">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex-1 min-w-[300px]"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--fx-muted)]" /><input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar leads..." className="w-full pl-10 pr-4 py-1.5 rounded-lg bg-[rgba(15,23,42,0.85)] border border-[rgba(148,163,184,0.4)] text-white placeholder:text-[var(--fx-muted)] focus:outline-none focus:border-[var(--fx-primary)]" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px' }} /></div></div>
            <div className="flex gap-3">
              <select value={filterVendedor} onChange={(e) => setFilterVendedor(e.target.value)} className="px-3 py-1.5 rounded-lg bg-[rgba(15,23,42,0.85)] border border-[rgba(148,163,184,0.4)] text-white focus:outline-none" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px' }}><option value="">Todos los vendedores</option>{getVendedoresUnicos().map(v => <option key={v} value={v}>{v}</option>)}</select>
              <input type="date" value={filterFecha} onChange={(e) => setFilterFecha(e.target.value)} className="px-3 py-1.5 rounded-lg bg-[rgba(15,23,42,0.85)] border border-[rgba(148,163,184,0.4)] text-white focus:outline-none" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px' }} />
            </div>
            <div className="flex gap-3">
              {isAdmin && <button onClick={() => setShowDeleted(!showDeleted)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${showDeleted ? 'bg-red-500/30 text-red-400 border border-red-500/50' : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'}`} style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 600 }}><Trash2 className="w-4 h-4" />{showDeleted ? 'Ocultar eliminados' : 'Ver eliminados'}</button>}
              <button onClick={() => setShowFunnel(!showFunnel)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 600 }}><BarChart3 className="w-4 h-4" />Funnel</button>
              <button onClick={handleExportExcel} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 600 }}><Download className="w-4 h-4" />Exportar</button>
            </div>
          </div>
        </div>

        {showFunnel && (
          <div className="flex-shrink-0 mx-4 mb-2 p-4 rounded-2xl bg-[var(--fx-surface)] border border-white/10">
            <h3 className="text-white mb-3" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '18px', fontWeight: 700 }}>Funnel de Ventas</h3>
            <div className="grid grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30"><div className="text-blue-400 mb-1" style={{ fontSize: '12px' }}>Total</div><div className="text-white" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '28px', fontWeight: 700 }}>{leads.filter(l => !l.eliminado).length}</div></div>
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30"><div className="text-yellow-400 mb-1" style={{ fontSize: '12px' }}>Cotizados</div><div className="text-white" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '28px', fontWeight: 700 }}>{leads.filter(l => !l.eliminado && l.etapaLead === 'Cotizado').length}</div></div>
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30"><div className="text-green-400 mb-1" style={{ fontSize: '12px' }}>Cerrados</div><div className="text-white" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '28px', fontWeight: 700 }}>{leads.filter(l => !l.eliminado && l.etapaLead === 'Cerrado').length}</div></div>
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30"><div className="text-red-400 mb-1" style={{ fontSize: '12px' }}>Eliminados</div><div className="text-white" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '28px', fontWeight: 700 }}>{leads.filter(l => l.eliminado).length}</div></div>
            </div>
          </div>
        )}

        <div className="flex-1 mx-4 mb-4 rounded-2xl bg-[var(--fx-surface)] border border-white/10 overflow-hidden flex flex-col">
          <div className="flex-shrink-0 border-b border-white/10 bg-[var(--fx-surface)]">
            <table className="w-full"><thead><tr>
              <th className="px-2 py-2 text-center text-[var(--fx-muted)]" style={{ fontSize: '11px', fontWeight: 600, width: '3%' }}>#</th>
              <th onClick={() => handleSort('nombreEmpresa')} className="px-2 py-2 text-left text-[var(--fx-muted)] cursor-pointer hover:text-white" style={{ fontSize: '11px', fontWeight: 600, width: '13%' }}><div className="flex items-center gap-1"><Building2 className="w-3 h-3" />EMPRESA<SortIcon field="nombreEmpresa" /></div></th>
              <th className="px-1.5 py-2 text-left text-[var(--fx-muted)]" style={{ fontSize: '11px', fontWeight: 600, width: '7%' }}>ETAPA</th>
              <th className="px-2 py-2 text-left text-[var(--fx-muted)]" style={{ fontSize: '11px', fontWeight: 600, width: '15%' }}>CONTACTO</th>
              <th className="px-2 py-2 text-left text-[var(--fx-muted)]" style={{ fontSize: '11px', fontWeight: 600, width: '10%' }}>SERVICIO</th>
              <th className="px-1.5 py-2 text-left text-[var(--fx-muted)]" style={{ fontSize: '11px', fontWeight: 600, width: '10%' }}>VIAJE</th>
              <th className="px-1.5 py-2 text-left text-[var(--fx-muted)]" style={{ fontSize: '11px', fontWeight: 600, width: '8%' }}>TARIFA</th>
              <th onClick={() => handleSort('vendedor')} className="px-2 py-2 text-left text-[var(--fx-muted)] cursor-pointer hover:text-white" style={{ fontSize: '11px', fontWeight: 600, width: '10%' }}><div className="flex items-center gap-1"><User className="w-3 h-3" />VENDEDOR<SortIcon field="vendedor" /></div></th>
              <th onClick={() => handleSort('fechaCreacion')} className="px-2 py-2 text-left text-[var(--fx-muted)] cursor-pointer hover:text-white" style={{ fontSize: '11px', fontWeight: 600, width: '8%' }}><div className="flex items-center gap-1"><Calendar className="w-3 h-3" />CREADO<SortIcon field="fechaCreacion" /></div></th>
              <th className="px-2 py-2 text-center text-[var(--fx-muted)]" style={{ fontSize: '11px', fontWeight: 600, width: '10%' }}>ACCIONES</th>
            </tr></thead></table>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <table className="w-full"><tbody>
              {filteredLeads.length === 0 ? (
                <tr><td colSpan={10} className="px-6 py-12 text-center text-[var(--fx-muted)]">No se encontraron leads.</td></tr>
              ) : (
                filteredLeads.map((lead, index) => (
                  <tr key={lead.id} className={`border-b border-white/5 hover:bg-white/5 ${lead.eliminado ? 'opacity-50 bg-red-500/5' : ''}`} style={{ height: '48px' }}>
                    <td className="px-2 py-2 text-center" style={{ fontFamily: "'Orbitron', monospace", fontSize: '11px', fontWeight: 600, color: lead.eliminado ? '#ef4444' : 'var(--fx-primary)', width: '3%' }}>{index + 1}</td>
                    <td className="px-2 py-2 text-white" style={{ fontSize: '11px', fontWeight: 700, width: '13%' }}>{lead.nombreEmpresa}</td>
                    <td className="px-1.5 py-2" style={{ width: '7%' }}><span className={`px-2 py-0.5 rounded text-xs font-semibold ${lead.etapaLead === 'Cotizado' ? 'bg-yellow-500/20 text-yellow-400' : lead.etapaLead === 'Negociación' ? 'bg-orange-500/20 text-orange-400' : lead.etapaLead === 'Cerrado' ? 'bg-green-500/20 text-green-400' : 'bg-purple-500/20 text-purple-400'}`} style={{ fontSize: '10px' }}>{lead.etapaLead || 'Prospecto'}</span></td>
                    <td className="px-2 py-2" style={{ width: '15%' }}><div style={{ fontSize: '11px' }}><div className="text-white font-semibold truncate">{lead.nombreContacto}</div><div className="text-[var(--fx-muted)] truncate" style={{ fontSize: '10px' }}>{lead.correoElectronico}</div></div></td>
                    <td className="px-2 py-2" style={{ width: '10%' }}><div className="flex flex-wrap gap-0.5">{(lead.tipoServicio || []).slice(0,2).map((t, i) => <span key={i} className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400" style={{ fontSize: '9px', fontWeight: 600 }}>{t}</span>)}</div></td>
                    <td className="px-1.5 py-2" style={{ width: '10%' }}><div className="flex flex-wrap gap-0.5">{(lead.tipoViaje || []).slice(0,2).map((t, i) => <span key={i} className="px-1.5 py-0.5 rounded bg-green-500/20 text-green-400" style={{ fontSize: '9px', fontWeight: 600 }}>{t}</span>)}</div></td>
                    <td className="px-1.5 py-2" style={{ width: '8%' }}>{lead.tarifa ? <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400" style={{ fontFamily: "'Orbitron', monospace", fontSize: '10px', fontWeight: 600 }}>{lead.tarifa}</span> : <span className="text-[var(--fx-muted)]" style={{ fontSize: '10px' }}>N/A</span>}</td>
                    <td className="px-2 py-2 text-[var(--fx-muted)]" style={{ fontSize: '11px', width: '10%' }}>{lead.vendedor}</td>
                    <td className="px-2 py-2" style={{ width: '8%' }}><span className="text-white" style={{ fontSize: '10px' }}>{formatDate(lead.fechaCreacion)}</span></td>
                    <td className="px-2 py-2" style={{ width: '10%' }}>
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => setSelectedLead(lead)} className="p-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30"><Eye className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setEditLead(lead)} className="p-1.5 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30" disabled={lead.eliminado}><Pencil className="w-3.5 h-3.5" /></button>
                        <div className="relative">
                          <button onClick={() => setCotizacionesModal(lead)} className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30"><FileText className="w-3.5 h-3.5" /></button>
                          {lead.cotizaciones?.filter(c => !c.eliminado).length ? <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white" style={{ fontSize: '9px', fontWeight: 700 }}>{lead.cotizaciones.filter(c => !c.eliminado).length}</div> : null}
                        </div>
                        {lead.eliminado && isAdmin ? <button onClick={() => handleRestaurarLead(lead)} className="p-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30"><TrendingUp className="w-3.5 h-3.5" /></button> : <button onClick={() => setDeleteModal(lead)} className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30" disabled={lead.eliminado}><Trash2 className="w-3.5 h-3.5" /></button>}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody></table>
          </div>
          
          <div className="flex-shrink-0 px-4 py-2 border-t border-white/10 bg-[var(--fx-surface)]">
            <span className="text-[var(--fx-muted)]" style={{ fontSize: '12px' }}>Mostrando {filteredLeads.length} de {leads.filter(l => !l.eliminado).length} leads</span>
          </div>
        </div>
      </div>

      {selectedLead && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedLead(null)}>
          <div className="bg-[var(--fx-surface)] rounded-2xl border border-white/20 w-[95vw] max-w-[1200px] max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="text-white text-xl font-bold flex items-center gap-2"><Building2 className="w-6 h-6 text-blue-400" />{selectedLead.nombreEmpresa}</h3><button onClick={() => setSelectedLead(null)} className="p-2 rounded-lg hover:bg-white/10"><X className="w-5 h-5 text-white" /></button></div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="p-3 rounded-lg bg-white/5"><div className="text-blue-400 text-xs mb-1">Contacto</div><div className="text-white font-semibold">{selectedLead.nombreContacto}</div><div className="text-gray-400">{selectedLead.correoElectronico}</div></div>
              <div className="p-3 rounded-lg bg-white/5"><div className="text-blue-400 text-xs mb-1">Servicio</div><div className="flex flex-wrap gap-1">{(selectedLead.tipoServicio||[]).map((t,i)=><span key={i} className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-xs">{t}</span>)}</div></div>
              <div className="p-3 rounded-lg bg-white/5"><div className="text-green-400 text-xs mb-1">Viaje</div><div className="flex flex-wrap gap-1">{(selectedLead.tipoViaje||[]).map((t,i)=><span key={i} className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-xs">{t}</span>)}</div></div>
              <div className="p-3 rounded-lg bg-white/5"><div className="text-purple-400 text-xs mb-1">Rutas</div><div className="text-white">{selectedLead.principalesRutas || '-'}</div></div>
              <div className="p-3 rounded-lg bg-white/5"><div className="text-orange-400 text-xs mb-1">Viajes/Mes</div><div className="text-white font-bold text-lg">{selectedLead.viajesPorMes || '-'}</div></div>
              <div className="p-3 rounded-lg bg-emerald-500/10"><div className="text-emerald-400 text-xs mb-1">Tarifa</div><div className="text-emerald-400 font-bold text-lg">{selectedLead.tarifa || 'N/A'}</div></div>
            </div>
            <div className="mt-4 flex justify-between items-center text-sm text-gray-400"><span>Vendedor: {selectedLead.vendedor}</span><span>Creado: {formatDate(selectedLead.fechaCreacion)}</span></div>
          </div>
        </div>
      )}

      {deleteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => { setDeleteModal(null); setDeleteConfirmText(''); }}>
          <div className="bg-[var(--fx-surface)] rounded-2xl border border-red-500/30 w-[400px] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4"><AlertTriangle className="w-8 h-8 text-red-400" /><h3 className="text-white text-lg font-bold">Eliminar Lead</h3></div>
            <p className="text-white mb-2">¿Eliminar <strong>{deleteModal.nombreEmpresa}</strong>?</p>
            <p className="text-gray-400 text-sm mb-4">Escribe DELETE para confirmar:</p>
            <input type="text" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())} className="w-full px-4 py-2 rounded-lg bg-black/30 border border-red-500/40 text-white text-center mb-4" />
            <div className="flex gap-3"><button onClick={() => { setDeleteModal(null); setDeleteConfirmText(''); }} className="flex-1 px-4 py-2 rounded-lg bg-gray-600 text-white">Cancelar</button><button onClick={handleConfirmarEliminacion} disabled={deleteConfirmText !== 'DELETE'} className={`flex-1 px-4 py-2 rounded-lg ${deleteConfirmText === 'DELETE' ? 'bg-red-500 text-white' : 'bg-red-500/20 text-red-400/50'}`}>Eliminar</button></div>
          </div>
        </div>
      )}

      {cotizacionesModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setCotizacionesModal(null)}>
          <div className="bg-[var(--fx-surface)] rounded-2xl border border-white/20 w-[800px] max-h-[80vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="text-white text-xl font-bold flex items-center gap-2"><FileText className="w-5 h-5 text-emerald-400" />Cotizaciones - {cotizacionesModal.nombreEmpresa}</h3><button onClick={() => setCotizacionesModal(null)} className="p-2 rounded-lg hover:bg-white/10"><X className="w-5 h-5 text-white" /></button></div>
            <div className="mb-4"><label className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl ${analizando ? 'bg-blue-600/50' : 'bg-blue-600 hover:bg-blue-700'} text-white cursor-pointer`}>{analizando ? <><Loader2 className="w-5 h-5 animate-spin" /><span>{statusMsg}</span></> : <><Upload className="w-5 h-5" /><span className="font-semibold">Subir Cotizaciones (PDFs)</span></>}<input type="file" accept="application/pdf" multiple className="hidden" disabled={analizando} onChange={(e) => { if (e.target.files?.length) handleSubirCotizaciones(e.target.files, cotizacionesModal); e.target.value = ''; }} /></label></div>
            <div className="space-y-2">
              {(!cotizacionesModal.cotizaciones || !cotizacionesModal.cotizaciones.filter(c => !c.eliminado).length) ? (
                <div className="text-center py-6 text-gray-400">No hay cotizaciones adjuntas.</div>
              ) : (
                cotizacionesModal.cotizaciones.filter(c => !c.eliminado).map((cot, i) => (
                  <div key={i} className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-emerald-400" /><span className="text-white text-sm font-semibold">{cot.nombre}</span><span className="text-gray-500 text-xs">{formatDate(cot.fecha)}</span></div>
                      <div className="flex gap-2">
                        {cot.url && <button onClick={() => setPdfPreview(cot.url)} className="px-2 py-1 rounded bg-purple-500/20 text-purple-400 text-xs flex items-center gap-1"><Eye className="w-3 h-3" />Ver</button>}
                        {cot.url && <a href={cot.url} download={cot.nombre} className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-xs flex items-center gap-1"><Download className="w-3 h-3" /></a>}
                        <button onClick={() => handleEliminarCotizacion(cotizacionesModal, cotizacionesModal.cotizaciones?.indexOf(cot) || i)} className="px-2 py-1 rounded bg-red-500/20 text-red-400 text-xs"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </div>
                    {cot.analisis && !cot.analisis.error && cot.analisis.tipoServicio && (
                      <div className="mt-2 p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
                        <div className="flex items-center gap-1 mb-1"><CheckCircle className="w-3 h-3 text-emerald-400" /><span className="text-emerald-400 text-xs font-semibold">Análisis IA</span></div>
                        <div className="grid grid-cols-4 gap-2 text-xs">
                          <div><span className="text-gray-400">Servicio:</span> <span className="text-white">{cot.analisis.tipoServicio?.join(', ') || '-'}</span></div>
                          <div><span className="text-gray-400">Viaje:</span> <span className="text-white">{cot.analisis.tipoViaje?.join(', ') || '-'}</span></div>
                          <div><span className="text-gray-400">Rutas:</span> <span className="text-white">{cot.analisis.rutas || '-'}</span></div>
                          <div><span className="text-gray-400">Tarifa:</span> <span className="text-emerald-400 font-semibold">{cot.analisis.tarifaMXN ? `$${Number(cot.analisis.tarifaMXN).toLocaleString()} MXN` : '-'}</span></div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            <button onClick={() => setCotizacionesModal(null)} className="mt-4 w-full px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white">Cerrar</button>
          </div>
        </div>
      )}

      {pdfPreview && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={() => setPdfPreview(null)}>
          <div className="bg-white rounded-2xl w-[90vw] h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-3 bg-gray-100 border-b"><span className="text-gray-700 font-semibold">Vista previa</span><button onClick={() => setPdfPreview(null)} className="p-2 rounded-lg hover:bg-gray-200"><X className="w-5 h-5 text-gray-600" /></button></div>
            <iframe src={pdfPreview} className="flex-1 w-full" title="PDF" />
          </div>
        </div>
      )}

      {editLead && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setEditLead(null)}>
          <div className="bg-[var(--fx-surface)] rounded-2xl border border-white/20 w-[700px] max-h-[80vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="text-white text-xl font-bold flex items-center gap-2"><Pencil className="w-5 h-5 text-yellow-400" />Editar - {editLead.nombreEmpresa}</h3><button onClick={() => setEditLead(null)} className="p-2 rounded-lg hover:bg-white/10"><X className="w-5 h-5 text-white" /></button></div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><label className="text-gray-400 text-xs">Empresa</label><input type="text" value={formData.nombreEmpresa || ''} onChange={(e) => setFormData({ ...formData, nombreEmpresa: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg bg-black/30 border border-white/20 text-white" /></div>
              <div><label className="text-gray-400 text-xs">Web</label><input type="text" value={formData.paginaWeb || ''} onChange={(e) => setFormData({ ...formData, paginaWeb: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg bg-black/30 border border-white/20 text-white" /></div>
              <div><label className="text-gray-400 text-xs">Contacto</label><input type="text" value={formData.nombreContacto || ''} onChange={(e) => handleInputChange('nombreContacto', e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg bg-black/30 border border-white/20 text-white" /></div>
              <div><label className="text-gray-400 text-xs">Email</label><input type="email" value={formData.correoElectronico || ''} onChange={(e) => handleInputChange('correoElectronico', e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg bg-black/30 border border-white/20 text-white" /></div>
              <div className="col-span-2"><label className="text-gray-400 text-xs">Servicio</label><div className="flex flex-wrap gap-2 mt-1">{['Seco', 'Refrigerado', 'Seco Hazmat', 'Refrigerado Hazmat'].map(s => <button key={s} onClick={() => handleToggleServicio(s)} className={`px-3 py-1 rounded text-xs ${formData.tipoServicio?.includes(s) ? 'bg-blue-500/30 text-blue-400 border border-blue-500' : 'bg-black/30 border border-white/20 text-white'}`}>{s}</button>)}</div></div>
              <div className="col-span-2"><label className="text-gray-400 text-xs">Viaje</label><div className="flex flex-wrap gap-2 mt-1">{['Impo', 'Expo', 'Nacional', 'Dedicado'].map(v => <button key={v} onClick={() => handleToggleViaje(v)} className={`px-3 py-1 rounded text-xs ${formData.tipoViaje?.includes(v) ? 'bg-green-500/30 text-green-400 border border-green-500' : 'bg-black/30 border border-white/20 text-white'}`}>{v}</button>)}</div></div>
              <div><label className="text-gray-400 text-xs">Rutas</label><input type="text" value={formData.principalesRutas || ''} onChange={(e) => setFormData({ ...formData, principalesRutas: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg bg-black/30 border border-white/20 text-white" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-gray-400 text-xs">Viajes/Mes</label><input type="number" value={formData.viajesPorMes || ''} onChange={(e) => setFormData({ ...formData, viajesPorMes: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg bg-black/30 border border-white/20 text-white" /></div>
                <div><label className="text-gray-400 text-xs">Tarifa</label><input type="text" value={formData.tarifa || ''} onChange={(e) => setFormData({ ...formData, tarifa: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg bg-black/30 border border-white/20 text-white" /></div>
              </div>
              <div><label className="text-gray-400 text-xs">Etapa</label><select value={formData.etapaLead || 'Prospecto'} onChange={(e) => setFormData({ ...formData, etapaLead: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg bg-black/30 border border-white/20 text-white"><option>Prospecto</option><option>Cotizado</option><option>Negociación</option><option>Cerrado</option></select></div>
              <div><label className="text-gray-400 text-xs">Próximos Pasos</label><input type="text" value={formData.proximosPasos || ''} onChange={(e) => setFormData({ ...formData, proximosPasos: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg bg-black/30 border border-white/20 text-white" /></div>
            </div>
            <div className="flex gap-3 mt-4"><button onClick={() => setEditLead(null)} className="flex-1 px-4 py-2 rounded-lg bg-gray-600 text-white">Cancelar</button><button onClick={handleGuardarEdicion} className="flex-1 px-4 py-2 rounded-lg bg-yellow-500 text-black font-semibold">Guardar</button></div>
          </div>
        </div>
      )}
    </ModuleTemplate>
  );
};
