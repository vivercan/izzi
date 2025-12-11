import { ModuleTemplate } from './ModuleTemplate';
import { useState, useEffect } from 'react';
import { MODULE_IMAGES } from '../../assets/module-images';
import { Search, Download, TrendingUp, X, BarChart3, Building2, User, Calendar, Eye, Trash2, SortAsc, SortDesc, FileText, Upload, Pencil, AlertTriangle, Loader2, CheckCircle, Brain } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

interface PanelOportunidadesModuleProps { onBack: () => void; }

interface Cotizacion { nombre: string; url: string; fecha: string; analisis?: any; eliminado?: boolean; }

interface Lead {
  id: string; nombreEmpresa: string; paginaWeb: string; nombreContacto: string; telefonoContacto?: string;
  correoElectronico: string; tipoServicio: string[]; tipoViaje: string[]; principalesRutas: string;
  viajesPorMes: string; tarifa: string; proyectadoVentaMensual?: string; proximosPasos: string;
  etapaLead?: string; altaCliente?: boolean; generacionSOP?: boolean; juntaArranque?: boolean;
  facturado?: boolean; vendedor: string; fechaCreacion: string; fechaActualizacion?: string;
  cotizaciones?: Cotizacion[]; eliminado?: boolean; fechaEliminado?: string; historialCambios?: { fecha: string; campo: string; valorAnterior: string; valorNuevo: string; }[];
}

type SortField = 'nombreEmpresa' | 'vendedor' | 'fechaCreacion' | 'viajesPorMes';
type SortDirection = 'asc' | 'desc';

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
  const [tipoCambio, setTipoCambio] = useState(18.18);

  const handleInputChange = (field: keyof Lead, value: any) => {
    if (field === 'nombreContacto') {
      const formatearNombre = (texto: string) => texto.toLowerCase().split(' ').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
      setFormData({ ...formData, [field]: formatearNombre(value) });
    } else if (field === 'correoElectronico') {
      setFormData({ ...formData, [field]: value.toLowerCase() });
    } else {
      setFormData({ ...formData, [field]: value });
    }
  };

  useEffect(() => { if (editLead) setFormData(editLead); }, [editLead]);

  useEffect(() => {
    const cargarLeads = async () => {
      try {
        const session = localStorage.getItem('fx27-session');
        let vendedorActual = '';
        let esAdmin = false;
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
    if (filterFecha) resultado = resultado.filter(lead => new Date(lead.fechaCreacion).toISOString().split('T')[0] === filterFecha);
    resultado.sort((a, b) => {
      let valueA: any = a[sortField]; let valueB: any = b[sortField];
      if (sortField === 'viajesPorMes') { valueA = parseInt(valueA) || 0; valueB = parseInt(valueB) || 0; }
      if (sortField === 'fechaCreacion') { valueA = new Date(valueA).getTime(); valueB = new Date(valueB).getTime(); }
      if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    setFilteredLeads(resultado);
  }, [leads, searchTerm, filterVendedor, filterFecha, sortField, sortDirection, showDeleted]);

  const handleSort = (field: SortField) => { if (sortField === field) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc'); else { setSortField(field); setSortDirection('asc'); } };
  const handleExportExcel = () => { const headers = ['Empresa', 'Contacto', 'Email', 'Servicio', 'Viaje', 'Rutas', 'Viajes/Mes', 'Tarifa', 'Vendedor', 'Fecha']; const rows = filteredLeads.map(lead => [lead.nombreEmpresa, lead.nombreContacto, lead.correoElectronico, lead.tipoServicio.join(', '), lead.tipoViaje.join(', '), lead.principalesRutas, lead.viajesPorMes, lead.tarifa, lead.vendedor, new Date(lead.fechaCreacion).toLocaleDateString('es-MX')]); const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n'); const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `leads_fx27_${new Date().toISOString().split('T')[0]}.csv`; link.click(); };
  const getVendedoresUnicos = () => Array.from(new Set(leads.map(lead => lead.vendedor)));

  const extraerTextoPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let texto = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      texto += content.items.map((item: any) => item.str).join(' ') + '\n';
    }
    return texto;
  };

  const analizarCotizacionConIA = async (pdfText: string): Promise<any> => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/analyze-cotizacion`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${publicAnonKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfText, tipoCambio })
      });
      const result = await response.json();
      if (result.success) return result.analisis;
      return null;
    } catch (error) { console.error('Error analizando:', error); return null; }
  };

  const handleSubirCotizaciones = async (files: FileList, lead: Lead) => {
    setAnalizando(true);
    const archivos = Array.from(files).filter(f => f.type === 'application/pdf');
    let nuevasCotizaciones = [...(lead.cotizaciones || [])];
    let tiposServicioActualizados = [...lead.tipoServicio];
    let tiposViajeActualizados = [...lead.tipoViaje];
    let rutasActualizadas = lead.principalesRutas || '';
    let tarifaActualizada = lead.tarifa || '';
    let viajesActualizados = lead.viajesPorMes || '';

    for (const file of archivos) {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const pdfText = await extraerTextoPDF(file);
      const analisis = await analizarCotizacionConIA(pdfText);

      nuevasCotizaciones.push({
        nombre: file.name,
        url: base64,
        fecha: new Date().toISOString(),
        analisis: analisis,
        eliminado: false
      });

      if (analisis && !analisis.error) {
        if (analisis.tipoServicio) {
          analisis.tipoServicio.forEach((s: string) => {
            if (!tiposServicioActualizados.includes(s)) tiposServicioActualizados.push(s);
          });
        }
        if (analisis.tipoViaje) {
          analisis.tipoViaje.forEach((v: string) => {
            if (!tiposViajeActualizados.includes(v)) tiposViajeActualizados.push(v);
          });
        }
        if (analisis.rutas && !rutasActualizadas.includes(analisis.rutas)) {
          rutasActualizadas = rutasActualizadas ? `${rutasActualizadas}, ${analisis.rutas}` : analisis.rutas;
        }
        if (analisis.tarifaMXN) {
          tarifaActualizada = `$${analisis.tarifaMXN.toLocaleString()} MXN`;
        }
        if (analisis.viajes) {
          viajesActualizados = String(parseInt(viajesActualizados || '0') + analisis.viajes);
        }
      }
    }

    const leadActualizado = {
      ...lead,
      cotizaciones: nuevasCotizaciones,
      tipoServicio: tiposServicioActualizados,
      tipoViaje: tiposViajeActualizados,
      principalesRutas: rutasActualizadas,
      tarifa: tarifaActualizada,
      viajesPorMes: viajesActualizados,
      etapaLead: 'Cotizado',
      fechaActualizacion: new Date().toISOString()
    };

    try {
      await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/leads/${lead.id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${publicAnonKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(leadActualizado)
      });
      setLeads(leads.map(l => l.id === lead.id ? leadActualizado : l));
      setCotizacionesModal(leadActualizado);
      alert(`${archivos.length} cotización(es) analizadas y guardadas`);
    } catch (error) { alert('Error al guardar'); }
    setAnalizando(false);
  };

  const handleEliminarCotizacion = async (lead: Lead, index: number) => {
    const cotizacionesActualizadas = lead.cotizaciones?.map((c, i) => i === index ? { ...c, eliminado: true } : c) || [];
    const leadActualizado = { ...lead, cotizaciones: cotizacionesActualizadas, fechaActualizacion: new Date().toISOString() };
    try {
      await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/leads/${lead.id}`, {
        method: 'PUT', headers: { 'Authorization': `Bearer ${publicAnonKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(leadActualizado)
      });
      setLeads(leads.map(l => l.id === lead.id ? leadActualizado : l));
      setCotizacionesModal(leadActualizado);
    } catch (error) { alert('Error'); }
  };

  const handleConfirmarEliminacion = async () => {
    if (!deleteModal || deleteConfirmText !== 'DELETE') { alert('Debes escribir DELETE'); return; }
    try {
      const leadActualizado = { ...deleteModal, eliminado: true, fechaEliminado: new Date().toISOString() };
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/leads/${deleteModal.id}`, { method: 'PUT', headers: { 'Authorization': `Bearer ${publicAnonKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify(leadActualizado) });
      if (response.ok) { setLeads(leads.map(l => l.id === deleteModal.id ? leadActualizado : l)); setDeleteModal(null); setDeleteConfirmText(''); alert('Lead eliminado'); }
    } catch (error) { alert('Error'); }
  };

  const handleRestaurarLead = async (lead: Lead) => {
    if (!isAdmin) return;
    try {
      const leadActualizado = { ...lead, eliminado: false, fechaEliminado: null };
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/leads/${lead.id}`, { method: 'PUT', headers: { 'Authorization': `Bearer ${publicAnonKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify(leadActualizado) });
      if (response.ok) { setLeads(leads.map(l => l.id === lead.id ? leadActualizado : l)); alert('Lead restaurado'); }
    } catch (error) { console.error(error); }
  };

  const handleGuardarEdicion = async () => {
    if (!editLead || !formData) return;
    if (!formData.nombreEmpresa?.trim() || !formData.nombreContacto?.trim() || !formData.correoElectronico?.trim()) { alert('Campos obligatorios'); return; }
    try {
      const leadActualizado = { ...editLead, ...formData, tipoServicio: formData.tipoServicio || [], tipoViaje: formData.tipoViaje || [], fechaActualizacion: new Date().toISOString() };
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/leads/${editLead.id}`, { method: 'PUT', headers: { 'Authorization': `Bearer ${publicAnonKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify(leadActualizado) });
      if (response.ok) { setLeads(leads.map(l => l.id === editLead.id ? leadActualizado : l)); setEditLead(null); setFormData({}); alert('Lead actualizado'); }
    } catch (error) { alert('Error'); }
  };

  const handleToggleServicio = (servicio: string) => { const servicios = formData.tipoServicio || []; setFormData({ ...formData, tipoServicio: servicios.includes(servicio) ? servicios.filter(s => s !== servicio) : [...servicios, servicio] }); };
  const handleToggleViaje = (viaje: string) => { const viajes = formData.tipoViaje || []; setFormData({ ...formData, tipoViaje: viajes.includes(viaje) ? viajes.filter(v => v !== viaje) : [...viajes, viaje] }); };
  const SortIcon = ({ field }: { field: SortField }) => { if (sortField !== field) return <SortAsc className="w-4 h-4 opacity-30" />; return sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />; };

  return (
    <ModuleTemplate title="Panel de Oportunidades" onBack={onBack} headerImage={MODULE_IMAGES.PANEL_OPORTUNIDADES}>
      <div className="p-4">
        <div className="mb-2 flex flex-wrap gap-3 items-center justify-between">
          <div className="flex-1 min-w-[300px]"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--fx-muted)]" /><input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar leads..." className="w-full pl-10 pr-4 py-1.5 rounded-lg bg-[rgba(15,23,42,0.85)] border border-[rgba(148,163,184,0.4)] text-white placeholder:text-[var(--fx-muted)] focus:outline-none focus:border-[var(--fx-primary)]" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px' }} /></div></div>
          <div className="flex gap-3">
            <select value={filterVendedor} onChange={(e) => setFilterVendedor(e.target.value)} className="px-3 py-1.5 rounded-lg bg-[rgba(15,23,42,0.85)] border border-[rgba(148,163,184,0.4)] text-white focus:outline-none" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px' }}><option value="">Todos los vendedores</option>{getVendedoresUnicos().map(v => <option key={v} value={v}>{v}</option>)}</select>
            <input type="date" value={filterFecha} onChange={(e) => setFilterFecha(e.target.value)} className="px-3 py-1.5 rounded-lg bg-[rgba(15,23,42,0.85)] border border-[rgba(148,163,184,0.4)] text-white focus:outline-none" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px' }} />
          </div>
          <div className="flex gap-3">
            {isAdmin && <button onClick={() => setShowDeleted(!showDeleted)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${showDeleted ? 'bg-red-500/30 text-red-400 border border-red-500/50' : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'}`} style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 600 }}><Trash2 className="w-4 h-4" />{showDeleted ? 'Ocultar eliminados' : 'Ver eliminados'}</button>}
            <button onClick={() => setShowFunnel(!showFunnel)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 transition-colors" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 600 }}><BarChart3 className="w-4 h-4" />Funnel</button>
            <button onClick={handleExportExcel} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 transition-colors" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 600 }}><Download className="w-4 h-4" />Exportar</button>
          </div>
        </div>

        {showFunnel && (
          <div className="mb-2 p-4 rounded-2xl bg-[var(--fx-surface)] border border-white/10">
            <h3 className="text-white mb-3" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '18px', fontWeight: 700 }}>Funnel de Ventas</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30"><div className="text-blue-400 mb-1" style={{ fontSize: '12px' }}>Total Leads</div><div className="text-white" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '28px', fontWeight: 700 }}>{leads.filter(l => !l.eliminado).length}</div></div>
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30"><div className="text-yellow-400 mb-1" style={{ fontSize: '12px' }}>Cotizados</div><div className="text-white" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '28px', fontWeight: 700 }}>{leads.filter(l => !l.eliminado && l.etapaLead === 'Cotizado').length}</div></div>
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30"><div className="text-green-400 mb-1" style={{ fontSize: '12px' }}>Cerrados</div><div className="text-white" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '28px', fontWeight: 700 }}>{leads.filter(l => !l.eliminado && l.etapaLead === 'Cerrado').length}</div></div>
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30"><div className="text-red-400 mb-1" style={{ fontSize: '12px' }}>Eliminados</div><div className="text-white" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '28px', fontWeight: 700 }}>{leads.filter(l => l.eliminado).length}</div></div>
            </div>
          </div>
        )}

        <div className="rounded-2xl bg-[var(--fx-surface)] border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-[var(--fx-surface)] z-10">
                <tr className="border-b border-white/10">
                  <th className="px-2 py-1.5 text-center text-[var(--fx-muted)]" style={{ fontSize: '11px', fontWeight: 600, width: '3%' }}>#</th>
                  <th onClick={() => handleSort('nombreEmpresa')} className="px-2 py-1.5 text-left text-[var(--fx-muted)] cursor-pointer hover:text-white" style={{ fontSize: '11px', fontWeight: 600, width: '12%' }}><div className="flex items-center gap-1"><Building2 className="w-3 h-3" />EMPRESA<SortIcon field="nombreEmpresa" /></div></th>
                  <th className="px-1.5 py-1.5 text-left text-[var(--fx-muted)]" style={{ fontSize: '11px', fontWeight: 600, width: '7%' }}>ETAPA</th>
                  <th className="px-2 py-1.5 text-left text-[var(--fx-muted)]" style={{ fontSize: '11px', fontWeight: 600, width: '15%' }}>CONTACTO</th>
                  <th className="px-2 py-1.5 text-left text-[var(--fx-muted)]" style={{ fontSize: '11px', fontWeight: 600, width: '10%' }}>SERVICIO</th>
                  <th className="px-1.5 py-1.5 text-left text-[var(--fx-muted)]" style={{ fontSize: '11px', fontWeight: 600, width: '10%' }}>VIAJE</th>
                  <th className="px-1.5 py-1.5 text-left text-[var(--fx-muted)]" style={{ fontSize: '11px', fontWeight: 600, width: '7%' }}>TARIFA</th>
                  <th onClick={() => handleSort('vendedor')} className="px-2 py-1.5 text-left text-[var(--fx-muted)] cursor-pointer hover:text-white" style={{ fontSize: '11px', fontWeight: 600, width: '10%' }}><div className="flex items-center gap-1"><User className="w-3 h-3" />VENDEDOR<SortIcon field="vendedor" /></div></th>
                  <th onClick={() => handleSort('fechaCreacion')} className="px-2 py-1.5 text-left text-[var(--fx-muted)] cursor-pointer hover:text-white" style={{ fontSize: '11px', fontWeight: 600, width: '8%' }}><div className="flex items-center gap-1"><Calendar className="w-3 h-3" />CREADO<SortIcon field="fechaCreacion" /></div></th>
                  <th className="px-2 py-1.5 text-center text-[var(--fx-muted)]" style={{ fontSize: '11px', fontWeight: 600, width: '10%' }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.length === 0 ? (
                  <tr><td colSpan={10} className="px-6 py-12 text-center text-[var(--fx-muted)]">No se encontraron leads.</td></tr>
                ) : (
                  filteredLeads.map((lead, index) => (
                    <tr key={lead.id} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${lead.eliminado ? 'opacity-50 bg-red-500/5' : ''}`} style={{ height: '44px' }}>
                      <td className="px-2 py-2 text-center" style={{ fontFamily: "'Orbitron', monospace", fontSize: '11px', fontWeight: 600, color: lead.eliminado ? '#ef4444' : 'var(--fx-primary)' }}>{index + 1}</td>
                      <td className="px-2 py-2 text-white" style={{ fontSize: '11px', fontWeight: 700 }}>{lead.nombreEmpresa}{lead.eliminado && <span className="ml-2 text-red-400 text-xs">(ELIMINADO)</span>}</td>
                      <td className="px-1.5 py-2"><span className={`px-2 py-0.5 rounded text-xs font-semibold ${lead.etapaLead === 'Cotizado' ? 'bg-yellow-500/20 text-yellow-400' : lead.etapaLead === 'Negociación' ? 'bg-orange-500/20 text-orange-400' : lead.etapaLead === 'Cerrado' ? 'bg-green-500/20 text-green-400' : 'bg-purple-500/20 text-purple-400'}`} style={{ fontSize: '10px' }}>{lead.etapaLead || 'Prospecto'}</span></td>
                      <td className="px-2 py-2"><div className="flex flex-col" style={{ fontSize: '11px' }}><span className="text-white font-semibold">{lead.nombreContacto}</span><span className="text-[var(--fx-muted)]" style={{ fontSize: '10px' }}>{lead.correoElectronico}</span></div></td>
                      <td className="px-2 py-2"><div className="flex flex-wrap gap-0.5">{lead.tipoServicio.map((tipo, idx) => <span key={idx} className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400" style={{ fontSize: '9px', fontWeight: 600 }}>{tipo}</span>)}</div></td>
                      <td className="px-1.5 py-2"><div className="flex flex-wrap gap-0.5">{lead.tipoViaje.map((tipo, idx) => <span key={idx} className="px-1.5 py-0.5 rounded bg-green-500/20 text-green-400" style={{ fontSize: '9px', fontWeight: 600 }}>{tipo}</span>)}</div></td>
                      <td className="px-1.5 py-2">{lead.tarifa ? <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400" style={{ fontFamily: "'Orbitron', monospace", fontSize: '10px', fontWeight: 600 }}>{lead.tarifa}</span> : <span className="text-[var(--fx-muted)]" style={{ fontSize: '10px' }}>N/A</span>}</td>
                      <td className="px-2 py-2 text-[var(--fx-muted)]" style={{ fontSize: '11px' }}>{lead.vendedor}</td>
                      <td className="px-2 py-2"><div className="flex flex-col"><span className="text-white" style={{ fontSize: '10px', fontWeight: 600 }}>{new Date(lead.fechaCreacion).toLocaleDateString('es-MX')}</span>{lead.fechaActualizacion && <span className="text-[var(--fx-muted)]" style={{ fontSize: '9px' }}>Act: {new Date(lead.fechaActualizacion).toLocaleDateString('es-MX')}</span>}</div></td>
                      <td className="px-2 py-2">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => setSelectedLead(lead)} className="p-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30" title="Ver"><Eye className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setEditLead(lead)} className="p-1.5 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30" title="Editar" disabled={lead.eliminado}><Pencil className="w-3.5 h-3.5" /></button>
                          <div className="relative">
                            <button onClick={() => setCotizacionesModal(lead)} className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30" title="Cotizaciones"><FileText className="w-3.5 h-3.5" /></button>
                            {lead.cotizaciones && lead.cotizaciones.filter(c => !c.eliminado).length > 0 && <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white" style={{ fontSize: '9px', fontWeight: 700 }}>{lead.cotizaciones.filter(c => !c.eliminado).length}</div>}
                          </div>
                          {lead.eliminado && isAdmin ? <button onClick={() => handleRestaurarLead(lead)} className="p-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30" title="Restaurar"><TrendingUp className="w-3.5 h-3.5" /></button> : <button onClick={() => setDeleteModal(lead)} className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30" title="Eliminar" disabled={lead.eliminado}><Trash2 className="w-3.5 h-3.5" /></button>}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL VER */}
        {selectedLead && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedLead(null)}>
            <div className="bg-[var(--fx-surface)] rounded-2xl border border-white/20 w-[95vw] max-w-[1400px] max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-[var(--fx-surface)] border-b border-white/10 p-4 flex items-center justify-between">
                <h3 className="text-white flex items-center gap-3" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '22px', fontWeight: 700 }}><Building2 className="w-6 h-6 text-blue-400" />{selectedLead.nombreEmpresa}</h3>
                <button onClick={() => setSelectedLead(null)} className="p-2 rounded-lg hover:bg-white/10"><X className="w-6 h-6 text-white" /></button>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10"><div className="text-blue-400 mb-1 flex items-center gap-2" style={{ fontSize: '11px', fontWeight: 600 }}><User className="w-3 h-3" />CONTACTO</div><div className="text-white font-semibold">{selectedLead.nombreContacto}</div><div className="text-[var(--fx-muted)] text-sm">{selectedLead.correoElectronico}</div>{selectedLead.telefonoContacto && <div className="text-[var(--fx-muted)] text-sm">{selectedLead.telefonoContacto}</div>}</div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10"><div className="text-blue-400 mb-1" style={{ fontSize: '11px', fontWeight: 600 }}>PÁGINA WEB</div><div className="text-white text-sm">{selectedLead.paginaWeb || 'No especificada'}</div></div>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10"><div className="text-blue-400 mb-2" style={{ fontSize: '11px', fontWeight: 600 }}>TIPO DE SERVICIO</div><div className="flex flex-wrap gap-1">{selectedLead.tipoServicio.map((tipo, i) => <span key={i} className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-semibold">{tipo}</span>)}</div></div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10"><div className="text-green-400 mb-2" style={{ fontSize: '11px', fontWeight: 600 }}>TIPO DE VIAJE</div><div className="flex flex-wrap gap-1">{selectedLead.tipoViaje.map((tipo, i) => <span key={i} className="px-2 py-1 rounded bg-green-500/20 text-green-400 border border-green-500/30 text-xs font-semibold">{tipo}</span>)}</div></div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10"><div className="text-blue-400 mb-1" style={{ fontSize: '11px', fontWeight: 600 }}>PRÓXIMOS PASOS</div><div className="text-white text-sm">{selectedLead.proximosPasos || 'Sin próximos pasos'}</div></div>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30"><div className="text-purple-400 mb-1" style={{ fontSize: '10px', fontWeight: 600 }}>RUTAS</div><div className="text-white font-semibold text-sm">{selectedLead.principalesRutas || '-'}</div></div>
                      <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/30"><div className="text-orange-400 mb-1" style={{ fontSize: '10px', fontWeight: 600 }}>VIAJES/MES</div><div className="text-white font-bold text-xl" style={{ fontFamily: "'Orbitron', sans-serif" }}>{selectedLead.viajesPorMes || '-'}</div></div>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30"><div className="text-emerald-400 mb-1" style={{ fontSize: '10px', fontWeight: 600 }}>TARIFA / VENTA</div><div className="text-emerald-400 font-bold text-xl" style={{ fontFamily: "'Orbitron', sans-serif" }}>{selectedLead.tarifa || 'N/A'}</div></div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10"><div className="text-yellow-400 mb-2" style={{ fontSize: '11px', fontWeight: 600 }}>HITOS</div><div className="grid grid-cols-2 gap-1"><div className={`flex items-center gap-1 p-1.5 rounded text-xs ${selectedLead.altaCliente ? 'bg-cyan-500/20 text-cyan-400' : 'bg-gray-500/10 text-gray-500'}`}>{selectedLead.altaCliente ? '✅' : '⬜'} N4</div><div className={`flex items-center gap-1 p-1.5 rounded text-xs ${selectedLead.generacionSOP ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-500/10 text-gray-500'}`}>{selectedLead.generacionSOP ? '✅' : '⬜'} N5</div><div className={`flex items-center gap-1 p-1.5 rounded text-xs ${selectedLead.juntaArranque ? 'bg-pink-500/20 text-pink-400' : 'bg-gray-500/10 text-gray-500'}`}>{selectedLead.juntaArranque ? '✅' : '⬜'} N6</div><div className={`flex items-center gap-1 p-1.5 rounded text-xs ${selectedLead.facturado ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-500/10 text-gray-500'}`}>{selectedLead.facturado ? '✅' : '⬜'} N7</div></div></div>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                    <h4 className="text-emerald-400 flex items-center gap-2 mb-3" style={{ fontSize: '12px', fontWeight: 700 }}><FileText className="w-4 h-4" />COTIZACIONES {selectedLead.cotizaciones?.filter(c => !c.eliminado).length ? `(${selectedLead.cotizaciones.filter(c => !c.eliminado).length})` : ''}</h4>
                    {(!selectedLead.cotizaciones || selectedLead.cotizaciones.filter(c => !c.eliminado).length === 0) ? <div className="text-center py-4 text-[var(--fx-muted)] text-sm">Sin cotizaciones</div> : <div className="space-y-2 max-h-[200px] overflow-y-auto">{selectedLead.cotizaciones.filter(c => !c.eliminado).map((cot, i) => <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10"><div className="flex items-center gap-2 flex-1 min-w-0"><FileText className="w-4 h-4 text-emerald-400 flex-shrink-0" /><div className="truncate text-white text-xs">{cot.nombre}</div></div><a href={cot.url} download={cot.nombre} className="p-1.5 rounded bg-blue-500/20 text-blue-400 flex-shrink-0"><Download className="w-3 h-3" /></a></div>)}</div>}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/10">
                  <div className="text-[var(--fx-muted)] text-sm"><span className="text-white font-semibold">Vendedor:</span> {selectedLead.vendedor}</div>
                  <div className="text-[var(--fx-muted)] text-sm"><span className="text-white font-semibold">Creado:</span> {new Date(selectedLead.fechaCreacion).toLocaleString('es-MX')}{selectedLead.fechaActualizacion && <span className="ml-3"><span className="text-yellow-400 font-semibold">Actualizado:</span> {new Date(selectedLead.fechaActualizacion).toLocaleString('es-MX')}</span>}</div>
                  <button onClick={() => setSelectedLead(null)} className="px-6 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white text-sm font-semibold">Cerrar</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL ELIMINAR */}
        {deleteModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => { setDeleteModal(null); setDeleteConfirmText(''); }}>
            <div className="bg-[var(--fx-surface)] rounded-2xl border border-red-500/30 w-[500px] p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4"><div className="p-3 rounded-full bg-red-500/20"><AlertTriangle className="w-8 h-8 text-red-400" /></div><div><h3 className="text-white" style={{ fontSize: '20px', fontWeight: 700 }}>Eliminar Lead</h3><p className="text-red-400" style={{ fontSize: '12px' }}>Esta acción requiere confirmación</p></div></div>
              <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20"><p className="text-white mb-2" style={{ fontSize: '14px' }}>¿Eliminar el lead?</p><p className="text-white font-bold text-lg">{deleteModal.nombreEmpresa}</p><p className="text-[var(--fx-muted)] text-sm mt-1">{deleteModal.nombreContacto} - {deleteModal.correoElectronico}</p></div>
              <div className="mb-4"><label className="text-[var(--fx-muted)] block mb-2" style={{ fontSize: '12px' }}>Escribe <span className="text-red-400 font-bold">DELETE</span> para confirmar:</label><input type="text" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())} placeholder="DELETE" className="w-full px-4 py-3 rounded-lg bg-[rgba(15,23,42,0.85)] border border-red-500/40 text-white text-center text-lg font-bold focus:outline-none" style={{ letterSpacing: '0.2em' }} /></div>
              <div className="flex gap-3"><button onClick={() => { setDeleteModal(null); setDeleteConfirmText(''); }} className="flex-1 px-4 py-3 rounded-lg bg-gray-600 hover:bg-gray-700 text-white font-semibold">Cancelar</button><button onClick={handleConfirmarEliminacion} disabled={deleteConfirmText !== 'DELETE'} className={`flex-1 px-4 py-3 rounded-lg font-semibold ${deleteConfirmText === 'DELETE' ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-red-500/20 text-red-400/50 cursor-not-allowed'}`}>Eliminar</button></div>
            </div>
          </div>
        )}

        {/* MODAL COTIZACIONES CON IA */}
        {cotizacionesModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setCotizacionesModal(null)}>
            <div className="bg-[var(--fx-surface)] rounded-2xl border border-white/20 w-[900px] max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white flex items-center gap-2" style={{ fontSize: '24px', fontWeight: 700 }}><FileText className="w-6 h-6 text-emerald-400" />Cotizaciones - {cotizacionesModal.nombreEmpresa}</h3>
                <button onClick={() => setCotizacionesModal(null)} className="p-2 rounded-lg hover:bg-white/10"><X className="w-5 h-5 text-white" /></button>
              </div>
              
              <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30">
                <div className="flex items-center gap-3 mb-3">
                  <Brain className="w-6 h-6 text-purple-400" />
                  <div><div className="text-white font-semibold">Análisis Inteligente con IA</div><div className="text-[var(--fx-muted)] text-sm">Sube PDFs y Claude extraerá automáticamente: servicio, viaje, rutas y tarifas</div></div>
                </div>
                <label className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg ${analizando ? 'bg-purple-500/30' : 'bg-emerald-500/20 hover:bg-emerald-500/30'} text-emerald-400 border border-emerald-500/30 cursor-pointer`}>
                  {analizando ? <><Loader2 className="w-5 h-5 animate-spin" /><span>Analizando con IA...</span></> : <><Upload className="w-5 h-5" /><span style={{ fontWeight: 600 }}>Subir Cotizaciones (PDFs)</span></>}
                  <input type="file" accept="application/pdf" multiple className="hidden" disabled={analizando} onChange={(e) => { if (e.target.files && e.target.files.length > 0) handleSubirCotizaciones(e.target.files, cotizacionesModal); e.target.value = ''; }} />
                </label>
              </div>

              <div className="space-y-3">
                {(!cotizacionesModal.cotizaciones || cotizacionesModal.cotizaciones.filter(c => !c.eliminado).length === 0) ? (
                  <div className="text-center py-8 text-[var(--fx-muted)]">No hay cotizaciones adjuntas.</div>
                ) : (
                  cotizacionesModal.cotizaciones.filter(c => !c.eliminado).map((cot, i) => (
                    <div key={i} className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-emerald-400" />
                          <div>
                            <div className="text-white font-semibold">{cot.nombre}</div>
                            <div className="text-[var(--fx-muted)] text-xs">{new Date(cot.fecha).toLocaleString('es-MX')}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <a href={cot.url} download={cot.nombre} className="px-3 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 flex items-center gap-2 text-sm font-semibold"><Download className="w-4 h-4" />Descargar</a>
                          <button onClick={() => handleEliminarCotizacion(cotizacionesModal, cotizacionesModal.cotizaciones?.indexOf(cot) || i)} className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                      {cot.analisis && !cot.analisis.error && (
                        <div className="mt-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                          <div className="flex items-center gap-2 mb-2"><CheckCircle className="w-4 h-4 text-purple-400" /><span className="text-purple-400 text-xs font-semibold">ANÁLISIS IA</span></div>
                          <div className="grid grid-cols-4 gap-2 text-xs">
                            <div><span className="text-[var(--fx-muted)]">Servicio:</span> <span className="text-white">{cot.analisis.tipoServicio?.join(', ')}</span></div>
                            <div><span className="text-[var(--fx-muted)]">Viaje:</span> <span className="text-white">{cot.analisis.tipoViaje?.join(', ')}</span></div>
                            <div><span className="text-[var(--fx-muted)]">Rutas:</span> <span className="text-white">{cot.analisis.rutas}</span></div>
                            <div><span className="text-[var(--fx-muted)]">Tarifa:</span> <span className="text-emerald-400 font-semibold">${cot.analisis.tarifaMXN?.toLocaleString()} MXN</span></div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
              <button onClick={() => setCotizacionesModal(null)} className="mt-6 w-full px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white font-semibold">Cerrar</button>
            </div>
          </div>
        )}

        {/* MODAL EDITAR */}
        {editLead && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setEditLead(null)}>
            <div className="bg-[var(--fx-surface)] rounded-2xl border border-white/20 w-[900px] max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6"><h3 className="text-white flex items-center gap-2" style={{ fontSize: '24px', fontWeight: 700 }}><Pencil className="w-6 h-6 text-yellow-400" />Editar - {editLead.nombreEmpresa}</h3><button onClick={() => setEditLead(null)} className="p-2 rounded-lg hover:bg-white/10"><X className="w-5 h-5 text-white" /></button></div>
              <div className="grid grid-cols-2 gap-4">
                <div><div className="text-[var(--fx-muted)] mb-1 text-xs">Nombre de la Empresa</div><input type="text" value={formData.nombreEmpresa || ''} onChange={(e) => setFormData({ ...formData, nombreEmpresa: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[rgba(15,23,42,0.85)] border border-[rgba(148,163,184,0.4)] text-white focus:outline-none text-sm" /></div>
                <div><div className="text-[var(--fx-muted)] mb-1 text-xs">Página Web</div><input type="text" value={formData.paginaWeb || ''} onChange={(e) => setFormData({ ...formData, paginaWeb: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[rgba(15,23,42,0.85)] border border-[rgba(148,163,184,0.4)] text-white focus:outline-none text-sm" /></div>
                <div><div className="text-[var(--fx-muted)] mb-1 text-xs">Contacto</div><input type="text" value={formData.nombreContacto || ''} onChange={(e) => handleInputChange('nombreContacto', e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[rgba(15,23,42,0.85)] border border-[rgba(148,163,184,0.4)] text-white focus:outline-none text-sm" /></div>
                <div><div className="text-[var(--fx-muted)] mb-1 text-xs">Email</div><input type="email" value={formData.correoElectronico || ''} onChange={(e) => handleInputChange('correoElectronico', e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[rgba(15,23,42,0.85)] border border-[rgba(148,163,184,0.4)] text-white focus:outline-none text-sm" /></div>
                <div className="col-span-2"><div className="text-[var(--fx-muted)] mb-1 text-xs">Tipo de Servicio</div><div className="flex flex-wrap gap-2">{['Seco', 'Refrigerado', 'Seco Hazmat', 'Refrigerado Hazmat'].map(s => <button key={s} onClick={() => handleToggleServicio(s)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${formData.tipoServicio?.includes(s) ? 'bg-blue-500/30 text-blue-400 border border-blue-500/50' : 'bg-[rgba(15,23,42,0.85)] border border-[rgba(148,163,184,0.4)] text-white'}`}>{s}</button>)}</div></div>
                <div className="col-span-2"><div className="text-[var(--fx-muted)] mb-1 text-xs">Tipo de Viaje</div><div className="flex flex-wrap gap-2">{['Impo', 'Expo', 'Nacional', 'Dedicado'].map(v => <button key={v} onClick={() => handleToggleViaje(v)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${formData.tipoViaje?.includes(v) ? 'bg-green-500/30 text-green-400 border border-green-500/50' : 'bg-[rgba(15,23,42,0.85)] border border-[rgba(148,163,184,0.4)] text-white'}`}>{v}</button>)}</div></div>
                <div><div className="text-[var(--fx-muted)] mb-1 text-xs">Rutas</div><input type="text" value={formData.principalesRutas || ''} onChange={(e) => setFormData({ ...formData, principalesRutas: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[rgba(15,23,42,0.85)] border border-[rgba(148,163,184,0.4)] text-white focus:outline-none text-sm" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><div className="text-[var(--fx-muted)] mb-1 text-xs">Viajes/Mes</div><input type="number" value={formData.viajesPorMes || ''} onChange={(e) => setFormData({ ...formData, viajesPorMes: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[rgba(15,23,42,0.85)] border border-[rgba(148,163,184,0.4)] text-white focus:outline-none text-sm" /></div>
                  <div><div className="text-[var(--fx-muted)] mb-1 text-xs">Tarifa</div><input type="text" value={formData.tarifa || ''} onChange={(e) => setFormData({ ...formData, tarifa: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[rgba(15,23,42,0.85)] border border-[rgba(148,163,184,0.4)] text-white focus:outline-none text-sm" /></div>
                </div>
                <div className="col-span-2"><div className="text-[var(--fx-muted)] mb-1 text-xs">Próximos Pasos</div><textarea value={formData.proximosPasos || ''} onChange={(e) => setFormData({ ...formData, proximosPasos: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg bg-[rgba(15,23,42,0.85)] border border-[rgba(148,163,184,0.4)] text-white focus:outline-none text-sm" /></div>
                <div><div className="text-[var(--fx-muted)] mb-1 text-xs">Etapa del Lead</div><select value={formData.etapaLead || 'Prospecto'} onChange={(e) => setFormData({ ...formData, etapaLead: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[rgba(15,23,42,0.85)] border border-[rgba(148,163,184,0.4)] text-white focus:outline-none text-sm"><option value="Prospecto">Prospecto</option><option value="Cotizado">Cotizado</option><option value="Negociación">Negociación</option><option value="Cerrado">Cerrado</option></select></div>
                <div className="p-3 rounded-lg bg-[var(--fx-surface)] border border-white/10">
                  <div className="text-white mb-2 text-xs font-bold">HITOS</div>
                  <div className="grid grid-cols-4 gap-2">
                    <label className="flex items-center gap-1 p-2 rounded bg-cyan-500/10 border border-cyan-500/30 cursor-pointer text-xs"><input type="checkbox" checked={formData.altaCliente || false} onChange={(e) => setFormData({ ...formData, altaCliente: e.target.checked })} className="w-3 h-3" /><span className="text-cyan-400">N4</span></label>
                    <label className="flex items-center gap-1 p-2 rounded bg-purple-500/10 border border-purple-500/30 cursor-pointer text-xs"><input type="checkbox" checked={formData.generacionSOP || false} onChange={(e) => setFormData({ ...formData, generacionSOP: e.target.checked })} className="w-3 h-3" /><span className="text-purple-400">N5</span></label>
                    <label className="flex items-center gap-1 p-2 rounded bg-pink-500/10 border border-pink-500/30 cursor-pointer text-xs"><input type="checkbox" checked={formData.juntaArranque || false} onChange={(e) => setFormData({ ...formData, juntaArranque: e.target.checked })} className="w-3 h-3" /><span className="text-pink-400">N6</span></label>
                    <label className="flex items-center gap-1 p-2 rounded bg-yellow-500/10 border border-yellow-500/30 cursor-pointer text-xs"><input type="checkbox" checked={formData.facturado || false} onChange={(e) => setFormData({ ...formData, facturado: e.target.checked })} className="w-3 h-3" /><span className="text-yellow-400">N7</span></label>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6"><button onClick={() => setEditLead(null)} className="flex-1 px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white font-semibold">Cancelar</button><button onClick={handleGuardarEdicion} className="flex-1 px-4 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">Guardar Cambios</button></div>
            </div>
          </div>
        )}
      </div>
    </ModuleTemplate>
  );
};
