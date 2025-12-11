import { ModuleTemplate } from './ModuleTemplate';
import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { MODULE_IMAGES } from '../../assets/module-images';
import { Search, Download, TrendingUp, X, BarChart3, Building2, User, Calendar, Eye, Trash2, SortAsc, SortDesc, FileText, Upload, Pencil, AlertTriangle } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface PanelOportunidadesModuleProps {
  onBack: () => void;
}

interface Lead {
  id: string;
  nombreEmpresa: string;
  paginaWeb: string;
  nombreContacto: string;
  telefonoContacto?: string;
  correoElectronico: string;
  tipoServicio: string[];
  tipoViaje: string[];
  principalesRutas: string;
  viajesPorMes: string;
  tarifa: string;
  proyectadoVentaMensual?: string;
  proximosPasos: string;
  etapaLead?: string;
  altaCliente?: boolean;
  generacionSOP?: boolean;
  juntaArranque?: boolean;
  facturado?: boolean;
  vendedor: string;
  fechaCaptura: string;
  cotizaciones?: { nombre: string; url: string; fecha: string }[];
  eliminado?: boolean;
  fechaEliminado?: string;
}

type SortField = 'nombreEmpresa' | 'vendedor' | 'fechaCaptura' | 'viajesPorMes';
type SortDirection = 'asc' | 'desc';

export const PanelOportunidadesModule = ({ onBack }: PanelOportunidadesModuleProps) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVendedor, setFilterVendedor] = useState('');
  const [filterFecha, setFilterFecha] = useState('');
  const [sortField, setSortField] = useState<SortField>('fechaCaptura');
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
    if (filterFecha) resultado = resultado.filter(lead => new Date(lead.fechaCaptura).toISOString().split('T')[0] === filterFecha);
    resultado.sort((a, b) => {
      let valueA: any = a[sortField]; let valueB: any = b[sortField];
      if (sortField === 'viajesPorMes') { valueA = parseInt(valueA) || 0; valueB = parseInt(valueB) || 0; }
      if (sortField === 'fechaCaptura') { valueA = new Date(valueA).getTime(); valueB = new Date(valueB).getTime(); }
      if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    setFilteredLeads(resultado);
  }, [leads, searchTerm, filterVendedor, filterFecha, sortField, sortDirection, showDeleted]);

  const handleSort = (field: SortField) => { if (sortField === field) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc'); else { setSortField(field); setSortDirection('asc'); } };
  const handleExportExcel = () => { const headers = ['Empresa', 'Contacto', 'Email', 'Servicio', 'Viaje', 'Rutas', 'Viajes/Mes', 'Tarifa', 'Vendedor', 'Fecha']; const rows = filteredLeads.map(lead => [lead.nombreEmpresa, lead.nombreContacto, lead.correoElectronico, lead.tipoServicio.join(', '), lead.tipoViaje.join(', '), lead.principalesRutas, lead.viajesPorMes, lead.tarifa, lead.vendedor, new Date(lead.fechaCaptura).toLocaleDateString('es-MX')]); const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n'); const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `leads_fx27_${new Date().toISOString().split('T')[0]}.csv`; link.click(); };
  const getVendedoresUnicos = () => Array.from(new Set(leads.map(lead => lead.vendedor)));

  const handleConfirmarEliminacion = async () => {
    if (!deleteModal || deleteConfirmText !== 'DELETE') { alert('Debes escribir DELETE para confirmar'); return; }
    try {
      const leadActualizado = { ...deleteModal, eliminado: true, fechaEliminado: new Date().toISOString() };
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/leads/${deleteModal.id}`, { method: 'PUT', headers: { 'Authorization': `Bearer ${publicAnonKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify(leadActualizado) });
      if (response.ok) { setLeads(leads.map(l => l.id === deleteModal.id ? leadActualizado : l)); setDeleteModal(null); setDeleteConfirmText(''); alert('Lead eliminado'); }
    } catch (error) { alert('Error al eliminar'); }
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
      const leadActualizado = { ...editLead, ...formData, tipoServicio: formData.tipoServicio || [], tipoViaje: formData.tipoViaje || [] };
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/leads/${editLead.id}`, { method: 'PUT', headers: { 'Authorization': `Bearer ${publicAnonKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify(leadActualizado) });
      if (response.ok) { setLeads(leads.map(l => l.id === editLead.id ? leadActualizado : l)); setEditLead(null); setFormData({}); alert('Lead actualizado'); }
    } catch (error) { alert('Error al actualizar'); }
  };

  const handleToggleServicio = (servicio: string) => { const servicios = formData.tipoServicio || []; setFormData({ ...formData, tipoServicio: servicios.includes(servicio) ? servicios.filter(s => s !== servicio) : [...servicios, servicio] }); };
  const handleToggleViaje = (viaje: string) => { const viajes = formData.tipoViaje || []; setFormData({ ...formData, tipoViaje: viajes.includes(viaje) ? viajes.filter(v => v !== viaje) : [...viajes, viaje] }); };
  const SortIcon = ({ field }: { field: SortField }) => { if (sortField !== field) return <SortAsc className="w-4 h-4 opacity-30" />; return sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />; };

  return (
    <ModuleTemplate title="Panel de Oportunidades" onBack={onBack} headerImage={MODULE_IMAGES.PANEL_OPORTUNIDADES}>
      <div className="p-4">
        <div className="mb-2 flex flex-wrap gap-3 items-center justify-between">
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--fx-muted)]" />
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar leads..." className="w-full pl-10 pr-4 py-1.5 rounded-lg bg-[rgba(15,23,42,0.85)] border border-[rgba(148,163,184,0.4)] text-white placeholder:text-[var(--fx-muted)] focus:outline-none focus:border-[var(--fx-primary)]" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px' }} />
            </div>
          </div>
          <div className="flex gap-3">
            <select value={filterVendedor} onChange={(e) => setFilterVendedor(e.target.value)} className="px-3 py-1.5 rounded-lg bg-[rgba(15,23,42,0.85)] border border-[rgba(148,163,184,0.4)] text-white focus:outline-none" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px' }}>
              <option value="">Todos los vendedores</option>
              {getVendedoresUnicos().map(v => <option key={v} value={v}>{v}</option>)}
            </select>
            <input type="date" value={filterFecha} onChange={(e) => setFilterFecha(e.target.value)} className="px-3 py-1.5 rounded-lg bg-[rgba(15,23,42,0.85)] border border-[rgba(148,163,184,0.4)] text-white focus:outline-none" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px' }} />
          </div>
          <div className="flex gap-3">
            {isAdmin && <button onClick={() => setShowDeleted(!showDeleted)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${showDeleted ? 'bg-red-500/30 text-red-400 border border-red-500/50' : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'}`} style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 600 }}><Trash2 className="w-4 h-4" />{showDeleted ? 'Ocultar eliminados' : 'Ver eliminados'}</button>}
            <button onClick={() => setShowFunnel(!showFunnel)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 transition-colors" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 600 }}><BarChart3 className="w-4 h-4" />Ver Funnel</button>
            <button onClick={handleExportExcel} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 transition-colors" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 600 }}><Download className="w-4 h-4" />Exportar</button>
          </div>
        </div>

        {showFunnel && (
          <div className="mb-2 p-4 rounded-2xl bg-[var(--fx-surface)] border border-white/10">
            <h3 className="text-white mb-3" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '18px', fontWeight: 700 }}>Funnel de Ventas</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30"><div className="text-blue-400 mb-1" style={{ fontSize: '12px' }}>Total Leads</div><div className="text-white" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '28px', fontWeight: 700 }}>{leads.filter(l => !l.eliminado).length}</div></div>
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30"><div className="text-green-400 mb-1" style={{ fontSize: '12px' }}>Filtrados</div><div className="text-white" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '28px', fontWeight: 700 }}>{filteredLeads.filter(l => !l.eliminado).length}</div></div>
              <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30"><div className="text-purple-400 mb-1" style={{ fontSize: '12px' }}>Vendedores</div><div className="text-white" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '28px', fontWeight: 700 }}>{getVendedoresUnicos().length}</div></div>
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30"><div className="text-red-400 mb-1" style={{ fontSize: '12px' }}>Eliminados</div><div className="text-white" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '28px', fontWeight: 700 }}>{leads.filter(l => l.eliminado).length}</div></div>
            </div>
          </div>
        )}

        <div className="rounded-2xl bg-[var(--fx-surface)] border border-white/10 overflow-hidden">
          <div className="overflow-x-auto" style={{ overflowY: 'auto' }}>
            <table className="w-full">
              <thead className="sticky top-0 bg-[var(--fx-surface)] z-10">
                <tr className="border-b border-white/10">
                  <th className="px-2 py-1.5 text-center text-[var(--fx-muted)]" style={{ fontSize: '11px', fontWeight: 600, width: '3%' }}>#</th>
                  <th onClick={() => handleSort('nombreEmpresa')} className="px-2 py-1.5 text-left text-[var(--fx-muted)] cursor-pointer hover:text-white" style={{ fontSize: '11px', fontWeight: 600, width: '12%' }}><div className="flex items-center gap-1"><Building2 className="w-3 h-3" />EMPRESA<SortIcon field="nombreEmpresa" /></div></th>
                  <th className="px-1.5 py-1.5 text-left text-[var(--fx-muted)]" style={{ fontSize: '11px', fontWeight: 600, width: '7%' }}>ETAPA</th>
                  <th className="px-2 py-1.5 text-left text-[var(--fx-muted)]" style={{ fontSize: '11px', fontWeight: 600, width: '18%' }}>CONTACTO</th>
                  <th className="px-2 py-1.5 text-left text-[var(--fx-muted)]" style={{ fontSize: '11px', fontWeight: 600, width: '10%' }}>SERVICIO</th>
                  <th className="px-1.5 py-1.5 text-left text-[var(--fx-muted)]" style={{ fontSize: '11px', fontWeight: 600, width: '10%' }}>TIPO VIAJES</th>
                  <th onClick={() => handleSort('viajesPorMes')} className="px-1.5 py-1.5 text-left text-[var(--fx-muted)] cursor-pointer hover:text-white" style={{ fontSize: '11px', fontWeight: 600, width: '5%' }}><div className="flex items-center gap-1">VIAJES<SortIcon field="viajesPorMes" /></div></th>
                  <th className="px-1.5 py-1.5 text-left text-[var(--fx-muted)]" style={{ fontSize: '11px', fontWeight: 600, width: '7%' }}>$ VENTA</th>
                  <th onClick={() => handleSort('vendedor')} className="px-2 py-1.5 text-left text-[var(--fx-muted)] cursor-pointer hover:text-white" style={{ fontSize: '11px', fontWeight: 600, width: '10%' }}><div className="flex items-center gap-1"><User className="w-3 h-3" />VENDEDOR<SortIcon field="vendedor" /></div></th>
                  <th onClick={() => handleSort('fechaCaptura')} className="px-2 py-1.5 text-left text-[var(--fx-muted)] cursor-pointer hover:text-white" style={{ fontSize: '11px', fontWeight: 600, width: '8%' }}><div className="flex items-center gap-1"><Calendar className="w-3 h-3" />FECHA<SortIcon field="fechaCaptura" /></div></th>
                  <th className="px-2 py-1.5 text-center text-[var(--fx-muted)]" style={{ fontSize: '11px', fontWeight: 600, width: '10%' }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.length === 0 ? (
                  <tr><td colSpan={11} className="px-6 py-12 text-center text-[var(--fx-muted)]">No se encontraron leads.</td></tr>
                ) : (
                  filteredLeads.map((lead, index) => (
                    <tr key={lead.id} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${lead.eliminado ? 'opacity-50 bg-red-500/5' : ''}`} style={{ height: '44px' }}>
                      <td className="px-2 py-2 text-center" style={{ fontFamily: "'Orbitron', monospace", fontSize: '11px', fontWeight: 600, color: lead.eliminado ? '#ef4444' : 'var(--fx-primary)' }}>{index + 1}</td>
                      <td className="px-2 py-2 text-white" style={{ fontSize: '11px', fontWeight: 700 }}>{lead.nombreEmpresa}{lead.eliminado && <span className="ml-2 text-red-400 text-xs">(ELIMINADO)</span>}</td>
                      <td className="px-1.5 py-2"><span className={`px-2 py-0.5 rounded text-xs font-semibold ${lead.etapaLead === 'Cotizado' ? 'bg-yellow-500/20 text-yellow-400' : lead.etapaLead === 'Negociación' ? 'bg-orange-500/20 text-orange-400' : lead.etapaLead === 'Cerrado' ? 'bg-green-500/20 text-green-400' : 'bg-purple-500/20 text-purple-400'}`} style={{ fontSize: '10px' }}>{lead.etapaLead || 'Prospecto'}</span></td>
                      <td className="px-2 py-2"><div className="flex flex-col" style={{ fontSize: '11px' }}><span className="text-white font-semibold">{lead.nombreContacto}</span><span className="text-[var(--fx-muted)]" style={{ fontSize: '10px' }}>{lead.correoElectronico}</span></div></td>
                      <td className="px-2 py-2"><div className="flex flex-wrap gap-0.5">{lead.tipoServicio.map((tipo, idx) => <span key={idx} className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400" style={{ fontSize: '9px', fontWeight: 600 }}>{tipo}</span>)}</div></td>
                      <td className="px-1.5 py-2"><div className="flex flex-wrap gap-0.5">{lead.tipoViaje.map((tipo, idx) => <span key={idx} className="px-1.5 py-0.5 rounded bg-green-500/20 text-green-400" style={{ fontSize: '9px', fontWeight: 600 }}>{tipo}</span>)}</div></td>
                      <td className="px-1.5 py-2 text-white" style={{ fontFamily: "'Orbitron', monospace", fontSize: '11px', fontWeight: 600 }}>{lead.viajesPorMes || '-'}</td>
                      <td className="px-1.5 py-2">{lead.tarifa ? <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400" style={{ fontFamily: "'Orbitron', monospace", fontSize: '10px', fontWeight: 600 }}>{lead.tarifa}</span> : <span className="text-[var(--fx-muted)] px-2 py-0.5 rounded bg-gray-500/20" style={{ fontSize: '10px' }}>N/A</span>}</td>
                      <td className="px-2 py-2 text-[var(--fx-muted)]" style={{ fontSize: '11px' }}>{lead.vendedor}</td>
                      <td className="px-2 py-2 text-white" style={{ fontSize: '10px', fontWeight: 600 }}>{new Date(lead.fechaCaptura).toLocaleDateString('es-MX')}</td>
                      <td className="px-2 py-2">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => setSelectedLead(lead)} className="p-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30" title="Ver"><Eye className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setEditLead(lead)} className="p-1.5 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30" title="Editar" disabled={lead.eliminado}><Pencil className="w-3.5 h-3.5" /></button>
                          <div className="relative">
                            <button onClick={() => setCotizacionesModal(lead)} className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30" title="Cotizaciones"><FileText className="w-3.5 h-3.5" /></button>
                            {lead.cotizaciones && lead.cotizaciones.length > 0 && <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white" style={{ fontSize: '9px', fontWeight: 700 }}>{lead.cotizaciones.length}</div>}
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

        {selectedLead && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedLead(null)}>
            <div className="bg-[var(--fx-surface)] rounded-2xl border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-[var(--fx-surface)] border-b border-white/10 p-6 flex items-center justify-between">
                <h3 className="text-white flex items-center gap-3" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '24px', fontWeight: 700 }}><Building2 className="w-7 h-7 text-blue-400" />{selectedLead.nombreEmpresa}</h3>
                <button onClick={() => setSelectedLead(null)} className="p-2 rounded-lg hover:bg-white/10"><X className="w-6 h-6 text-white" /></button>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10"><div className="text-blue-400 mb-2 flex items-center gap-2" style={{ fontSize: '12px', fontWeight: 600 }}><User className="w-4 h-4" />CONTACTO</div><div className="text-white text-lg font-semibold">{selectedLead.nombreContacto}</div><div className="text-[var(--fx-muted)]">{selectedLead.correoElectronico}</div>{selectedLead.telefonoContacto && <div className="text-[var(--fx-muted)]">{selectedLead.telefonoContacto}</div>}</div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10"><div className="text-blue-400 mb-2" style={{ fontSize: '12px', fontWeight: 600 }}>PÁGINA WEB</div><div className="text-white">{selectedLead.paginaWeb || 'No especificada'}</div></div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10"><div className="text-blue-400 mb-2" style={{ fontSize: '12px', fontWeight: 600 }}>TIPO DE SERVICIO</div><div className="flex flex-wrap gap-2">{selectedLead.tipoServicio.map((tipo, i) => <span key={i} className="px-3 py-1 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30" style={{ fontSize: '13px', fontWeight: 600 }}>{tipo}</span>)}</div></div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10"><div className="text-green-400 mb-2" style={{ fontSize: '12px', fontWeight: 600 }}>TIPO DE VIAJE</div><div className="flex flex-wrap gap-2">{selectedLead.tipoViaje.map((tipo, i) => <span key={i} className="px-3 py-1 rounded-lg bg-green-500/20 text-green-400 border border-green-500/30" style={{ fontSize: '13px', fontWeight: 600 }}>{tipo}</span>)}</div></div>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30"><div className="text-purple-400 mb-1" style={{ fontSize: '11px', fontWeight: 600 }}>RUTAS</div><div className="text-white font-semibold">{selectedLead.principalesRutas || '-'}</div></div>
                      <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30"><div className="text-orange-400 mb-1" style={{ fontSize: '11px', fontWeight: 600 }}>VIAJES/MES</div><div className="text-white font-bold text-2xl" style={{ fontFamily: "'Orbitron', sans-serif" }}>{selectedLead.viajesPorMes || '-'}</div></div>
                    </div>
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30"><div className="text-emerald-400 mb-1" style={{ fontSize: '11px', fontWeight: 600 }}>TARIFA / VENTA</div><div className="text-emerald-400 font-bold text-2xl" style={{ fontFamily: "'Orbitron', sans-serif" }}>{selectedLead.tarifa || 'N/A'}</div></div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10"><div className="text-blue-400 mb-2" style={{ fontSize: '12px', fontWeight: 600 }}>PRÓXIMOS PASOS</div><div className="text-white">{selectedLead.proximosPasos || 'Sin próximos pasos'}</div></div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-yellow-400 mb-3" style={{ fontSize: '12px', fontWeight: 600 }}>HITOS DEL CLIENTE</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className={`flex items-center gap-2 p-2 rounded ${selectedLead.altaCliente ? 'bg-cyan-500/20 border border-cyan-500/40' : 'bg-gray-500/10 border border-gray-500/20'}`}><span>{selectedLead.altaCliente ? '✅' : '⬜'}</span><span className={selectedLead.altaCliente ? 'text-cyan-400' : 'text-gray-500'} style={{ fontSize: '11px' }}>N4 - Alta Cliente</span></div>
                        <div className={`flex items-center gap-2 p-2 rounded ${selectedLead.generacionSOP ? 'bg-purple-500/20 border border-purple-500/40' : 'bg-gray-500/10 border border-gray-500/20'}`}><span>{selectedLead.generacionSOP ? '✅' : '⬜'}</span><span className={selectedLead.generacionSOP ? 'text-purple-400' : 'text-gray-500'} style={{ fontSize: '11px' }}>N5 - SOP</span></div>
                        <div className={`flex items-center gap-2 p-2 rounded ${selectedLead.juntaArranque ? 'bg-pink-500/20 border border-pink-500/40' : 'bg-gray-500/10 border border-gray-500/20'}`}><span>{selectedLead.juntaArranque ? '✅' : '⬜'}</span><span className={selectedLead.juntaArranque ? 'text-pink-400' : 'text-gray-500'} style={{ fontSize: '11px' }}>N6 - Junta Arranque</span></div>
                        <div className={`flex items-center gap-2 p-2 rounded ${selectedLead.facturado ? 'bg-yellow-500/20 border border-yellow-500/40' : 'bg-gray-500/10 border border-gray-500/20'}`}><span>{selectedLead.facturado ? '✅' : '⬜'}</span><span className={selectedLead.facturado ? 'text-yellow-400' : 'text-gray-500'} style={{ fontSize: '11px' }}>N7 - Facturado</span></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                  <h4 className="text-emerald-400 flex items-center gap-2 mb-4" style={{ fontSize: '16px', fontWeight: 700 }}><FileText className="w-5 h-5" />COTIZACIONES ENVIADAS{selectedLead.cotizaciones && selectedLead.cotizaciones.length > 0 && <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-xs">{selectedLead.cotizaciones.length}</span>}</h4>
                  {(!selectedLead.cotizaciones || selectedLead.cotizaciones.length === 0) ? <div className="text-center py-6 text-[var(--fx-muted)]">No hay cotizaciones adjuntas.</div> : <div className="space-y-2">{selectedLead.cotizaciones.map((cot, i) => <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10"><div className="flex items-center gap-3"><FileText className="w-5 h-5 text-emerald-400" /><div><div className="text-white font-semibold" style={{ fontSize: '14px' }}>{cot.nombre}</div><div className="text-[var(--fx-muted)]" style={{ fontSize: '11px' }}>{new Date(cot.fecha).toLocaleString('es-MX')}</div></div></div><a href={cot.url} download={cot.nombre} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30" style={{ fontSize: '12px', fontWeight: 600 }}><Download className="w-4 h-4" />Descargar</a></div>)}</div>}
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-white/10"><div className="text-[var(--fx-muted)]" style={{ fontSize: '12px' }}><span className="text-white font-semibold">Vendedor:</span> {selectedLead.vendedor}</div><div className="text-[var(--fx-muted)]" style={{ fontSize: '12px' }}><span className="text-white font-semibold">Capturado:</span> {new Date(selectedLead.fechaCaptura).toLocaleString('es-MX')}</div></div>
              </div>
              <div className="sticky bottom-0 bg-[var(--fx-surface)] border-t border-white/10 p-4"><button onClick={() => setSelectedLead(null)} className="w-full px-4 py-3 rounded-lg bg-gray-600 hover:bg-gray-700 text-white" style={{ fontSize: '14px', fontWeight: 600 }}>Cerrar</button></div>
            </div>
          </div>
        )}

        {deleteModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => { setDeleteModal(null); setDeleteConfirmText(''); }}>
            <div className="bg-[var(--fx-surface)] rounded-2xl border border-red-500/30 max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4"><div className="p-3 rounded-full bg-red-500/20"><AlertTriangle className="w-8 h-8 text-red-400" /></div><div><h3 className="text-white" style={{ fontSize: '20px', fontWeight: 700 }}>Eliminar Lead</h3><p className="text-red-400" style={{ fontSize: '12px' }}>Esta acción requiere confirmación</p></div></div>
              <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20"><p className="text-white mb-2" style={{ fontSize: '14px' }}>¿Estás seguro de eliminar el lead?</p><p className="text-white font-bold text-lg">{deleteModal.nombreEmpresa}</p><p className="text-[var(--fx-muted)] text-sm mt-1">{deleteModal.nombreContacto} - {deleteModal.correoElectronico}</p></div>
              <div className="mb-4"><label className="text-[var(--fx-muted)] block mb-2" style={{ fontSize: '12px' }}>Escribe <span className="text-red-400 font-bold">DELETE</span> para confirmar:</label><input type="text" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())} placeholder="DELETE" className="w-full px-4 py-3 rounded-lg bg-[rgba(15,23,42,0.85)] border border-red-500/40 text-white text-center text-lg font-bold focus:outline-none focus:border-red-500" style={{ letterSpacing: '0.2em' }} /></div>
              <div className="flex gap-3"><button onClick={() => { setDeleteModal(null); setDeleteConfirmText(''); }} className="flex-1 px-4 py-3 rounded-lg bg-gray-600 hover:bg-gray-700 text-white" style={{ fontSize: '14px', fontWeight: 600 }}>Cancelar</button><button onClick={handleConfirmarEliminacion} disabled={deleteConfirmText !== 'DELETE'} className={`flex-1 px-4 py-3 rounded-lg ${deleteConfirmText === 'DELETE' ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-red-500/20 text-red-400/50 cursor-not-allowed'}`} style={{ fontSize: '14px', fontWeight: 600 }}>Eliminar Lead</button></div>
              <p className="text-[var(--fx-muted)] text-center mt-4" style={{ fontSize: '11px' }}>Los leads eliminados se conservan en la base de datos.</p>
            </div>
          </div>
        )}

        {cotizacionesModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setCotizacionesModal(null)}>
            <div className="bg-[var(--fx-surface)] rounded-2xl border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6"><h3 className="text-white flex items-center gap-2" style={{ fontSize: '24px', fontWeight: 700 }}><FileText className="w-6 h-6 text-emerald-400" />Cotizaciones</h3><button onClick={() => setCotizacionesModal(null)} className="p-2 rounded-lg hover:bg-white/10"><X className="w-5 h-5 text-white" /></button></div>
              <div className="mb-4"><div className="text-white mb-2" style={{ fontSize: '16px', fontWeight: 600 }}>{cotizacionesModal.nombreEmpresa}</div><div className="text-[var(--fx-muted)]" style={{ fontSize: '13px' }}>Adjunta cotizaciones en formato PDF</div></div>
              <div className="mb-6"><label className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 cursor-pointer"><Upload className="w-5 h-5" /><span style={{ fontSize: '14px', fontWeight: 600 }}>Subir Cotización (PDF)</span><input type="file" accept="application/pdf" multiple className="hidden" onChange={(e) => { const files = Array.from(e.target.files || []); files.forEach(file => { if (file.type === 'application/pdf') { const reader = new FileReader(); reader.onload = async () => { const newCot = { nombre: file.name, url: reader.result as string, fecha: new Date().toISOString() }; const updatedLeads = leads.map(l => { if (l.id === cotizacionesModal.id) { const nuevasCot = [...(l.cotizaciones || []), newCot]; return { ...l, cotizaciones: nuevasCot, etapaLead: (l.cotizaciones || []).length === 0 ? 'Cotizado' : l.etapaLead }; } return l; }); const leadAct = updatedLeads.find(l => l.id === cotizacionesModal.id); if (leadAct) { try { await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/leads/${leadAct.id}`, { method: 'PUT', headers: { 'Authorization': `Bearer ${publicAnonKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify(leadAct) }); } catch (err) { console.error(err); } } setLeads(updatedLeads); setCotizacionesModal(updatedLeads.find(l => l.id === cotizacionesModal.id) || null); alert(`Cotización "${file.name}" agregada`); }; reader.readAsDataURL(file); } }); e.target.value = ''; }} /></label></div>
              <div className="space-y-3">{(!cotizacionesModal.cotizaciones || cotizacionesModal.cotizaciones.length === 0) ? <div className="text-center py-8 text-[var(--fx-muted)]">No hay cotizaciones adjuntas.</div> : cotizacionesModal.cotizaciones.map((cot, i) => <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10"><div className="flex items-center gap-3 flex-1"><FileText className="w-5 h-5 text-emerald-400" /><div className="flex-1"><div className="text-white" style={{ fontSize: '14px', fontWeight: 600 }}>{cot.nombre}</div><div className="text-[var(--fx-muted)]" style={{ fontSize: '12px' }}>{new Date(cot.fecha).toLocaleString('es-MX')}</div></div></div><div className="flex items-center gap-2"><a href={cot.url} download={cot.nombre} className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400" title="Descargar"><Download className="w-4 h-4" /></a><button onClick={async () => { if (confirm(`¿Eliminar "${cot.nombre}"?`)) { const updatedLeads = leads.map(l => { if (l.id === cotizacionesModal.id) return { ...l, cotizaciones: l.cotizaciones?.filter((_, idx) => idx !== i) || [] }; return l; }); const leadAct = updatedLeads.find(l => l.id === cotizacionesModal.id); if (leadAct) { try { await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/leads/${leadAct.id}`, { method: 'PUT', headers: { 'Authorization': `Bearer ${publicAnonKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify(leadAct) }); } catch (err) { console.error(err); } } setLeads(updatedLeads); setCotizacionesModal(updatedLeads.find(l => l.id === cotizacionesModal.id) || null); } }} className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400" title="Eliminar"><Trash2 className="w-4 h-4" /></button></div></div>)}</div>
              <button onClick={() => setCotizacionesModal(null)} className="mt-6 w-full px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white" style={{ fontSize: '14px', fontWeight: 600 }}>Cerrar</button>
            </div>
          </div>
        )}

        {editLead && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setEditLead(null)}>
            <div className="bg-[var(--fx-surface)] rounded-2xl border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6"><h3 className="text-white flex items-center gap-2" style={{ fontSize: '24px', fontWeight: 700 }}><Pencil className="w-6 h-6 text-yellow-400" />Editar Lead</h3><button onClick={() => setEditLead(null)} className="p-2 rounded-lg hover:bg-white/10"><X className="w-5 h-5 text-white" /></button></div>
              <div className="space-y-4">
                <div><div className="text-[var(--fx-muted)] mb-1" style={{ fontSize: '12px' }}>Nombre de la Empresa</div><input type="text" value={formData.nombreEmpresa || ''} onChange={(e) => setFormData({ ...formData, nombreEmpresa: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[rgba(15,23,42,0.85)] border border-[rgba(148,163,184,0.4)] text-white focus:outline-none focus:border-[var(--fx-primary)]" style={{ fontSize: '13px' }} /></div>
                <div><div className="text-[var(--fx-muted)] mb-1" style={{ fontSize: '12px' }}>Página Web</div><input type="text" value={formData.paginaWeb || ''} onChange={(e) => setFormData({ ...formData, paginaWeb: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[rgba(15,23,42,0.85)] border border-[rgba(148,163,184,0.4)] text-white focus:outline-none focus:border-[var(--fx-primary)]" style={{ fontSize: '13px' }} /></div>
                <div className="grid grid-cols-2 gap-4"><div><div className="text-[var(--fx-muted)] mb-1" style={{ fontSize: '12px' }}>Contacto</div><input type="text" value={formData.nombreContacto || ''} onChange={(e) => handleInputChange('nombreContacto', e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[rgba(15,23,42,0.85)] border border-[rgba(148,163,184,0.4)] text-white focus:outline-none focus:border-[var(--fx-primary)]" style={{ fontSize: '13px' }} /></div><div><div className="text-[var(--fx-muted)] mb-1" style={{ fontSize: '12px' }}>Email</div><input type="email" value={formData.correoElectronico || ''} onChange={(e) => handleInputChange('correoElectronico', e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[rgba(15,23,42,0.85)] border border-[rgba(148,163,184,0.4)] text-white focus:outline-none focus:border-[var(--fx-primary)]" style={{ fontSize: '13px' }} /></div></div>
                <div><div className="text-[var(--fx-muted)] mb-1" style={{ fontSize: '12px' }}>Tipo de Servicio</div><div className="flex flex-wrap gap-2">{['Seco', 'Refrigerado', 'Seco Hazmat', 'Refrigerado Hazmat'].map(s => <button key={s} onClick={() => handleToggleServicio(s)} className={`px-3 py-1 rounded-lg ${formData.tipoServicio?.includes(s) ? 'bg-blue-500/30 text-blue-400 border border-blue-500/50' : 'bg-[rgba(15,23,42,0.85)] border border-[rgba(148,163,184,0.4)] text-white'}`} style={{ fontSize: '12px', fontWeight: 600 }}>{s}</button>)}</div></div>
                <div><div className="text-[var(--fx-muted)] mb-1" style={{ fontSize: '12px' }}>Tipo de Viaje</div><div className="flex flex-wrap gap-2">{['Impo', 'Expo', 'Nacional', 'Dedicado'].map(v => <button key={v} onClick={() => handleToggleViaje(v)} className={`px-3 py-1 rounded-lg ${formData.tipoViaje?.includes(v) ? 'bg-green-500/30 text-green-400 border border-green-500/50' : 'bg-[rgba(15,23,42,0.85)] border border-[rgba(148,163,184,0.4)] text-white'}`} style={{ fontSize: '12px', fontWeight: 600 }}>{v}</button>)}</div></div>
                <div className="grid grid-cols-3 gap-4"><div><div className="text-[var(--fx-muted)] mb-1" style={{ fontSize: '12px' }}>Rutas</div><input type="text" value={formData.principalesRutas || ''} onChange={(e) => setFormData({ ...formData, principalesRutas: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[rgba(15,23,42,0.85)] border border-[rgba(148,163,184,0.4)] text-white focus:outline-none focus:border-[var(--fx-primary)]" style={{ fontSize: '13px' }} /></div><div><div className="text-[var(--fx-muted)] mb-1" style={{ fontSize: '12px' }}>Viajes/Mes</div><input type="number" value={formData.viajesPorMes || ''} onChange={(e) => setFormData({ ...formData, viajesPorMes: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[rgba(15,23,42,0.85)] border border-[rgba(148,163,184,0.4)] text-white focus:outline-none focus:border-[var(--fx-primary)]" style={{ fontSize: '13px' }} /></div><div><div className="text-[var(--fx-muted)] mb-1" style={{ fontSize: '12px' }}>Tarifa</div><input type="text" value={formData.tarifa || ''} onChange={(e) => setFormData({ ...formData, tarifa: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[rgba(15,23,42,0.85)] border border-[rgba(148,163,184,0.4)] text-white focus:outline-none focus:border-[var(--fx-primary)]" style={{ fontSize: '13px' }} /></div></div>
                <div><div className="text-[var(--fx-muted)] mb-1" style={{ fontSize: '12px' }}>Próximos Pasos</div><textarea value={formData.proximosPasos || ''} onChange={(e) => setFormData({ ...formData, proximosPasos: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-lg bg-[rgba(15,23,42,0.85)] border border-[rgba(148,163,184,0.4)] text-white focus:outline-none focus:border-[var(--fx-primary)]" style={{ fontSize: '13px' }} /></div>
                <div><div className="text-[var(--fx-muted)] mb-1" style={{ fontSize: '12px' }}>Etapa del Lead</div><select value={formData.etapaLead || 'Prospecto'} onChange={(e) => setFormData({ ...formData, etapaLead: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-[rgba(15,23,42,0.85)] border border-[rgba(148,163,184,0.4)] text-white focus:outline-none focus:border-[var(--fx-primary)]" style={{ fontSize: '13px' }}><option value="Prospecto">Prospecto</option><option value="Cotizado">Cotizado</option><option value="Negociación">Negociación</option><option value="Cerrado">Cerrado</option></select></div>
                <div className="p-4 rounded-lg bg-[var(--fx-surface)] border border-white/10"><div className="text-white mb-3" style={{ fontSize: '13px', fontWeight: 700 }}>HITOS DEL CLIENTE</div><div className="grid grid-cols-2 gap-2"><label className="flex items-center gap-2 p-2 rounded bg-cyan-500/10 border border-cyan-500/30 cursor-pointer"><input type="checkbox" checked={formData.altaCliente || false} onChange={(e) => setFormData({ ...formData, altaCliente: e.target.checked })} className="w-4 h-4" /><span className="text-cyan-400" style={{ fontSize: '11px' }}>N4 - Alta Cliente</span></label><label className="flex items-center gap-2 p-2 rounded bg-purple-500/10 border border-purple-500/30 cursor-pointer"><input type="checkbox" checked={formData.generacionSOP || false} onChange={(e) => setFormData({ ...formData, generacionSOP: e.target.checked })} className="w-4 h-4" /><span className="text-purple-400" style={{ fontSize: '11px' }}>N5 - SOP</span></label><label className="flex items-center gap-2 p-2 rounded bg-pink-500/10 border border-pink-500/30 cursor-pointer"><input type="checkbox" checked={formData.juntaArranque || false} onChange={(e) => setFormData({ ...formData, juntaArranque: e.target.checked })} className="w-4 h-4" /><span className="text-pink-400" style={{ fontSize: '11px' }}>N6 - Junta Arranque</span></label><label className="flex items-center gap-2 p-2 rounded bg-yellow-500/10 border border-yellow-500/30 cursor-pointer"><input type="checkbox" checked={formData.facturado || false} onChange={(e) => setFormData({ ...formData, facturado: e.target.checked })} className="w-4 h-4" /><span className="text-yellow-400" style={{ fontSize: '11px' }}>N7 - Facturado</span></label></div></div>
              </div>
              <div className="flex gap-3 mt-6"><button onClick={() => setEditLead(null)} className="flex-1 px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white" style={{ fontSize: '14px', fontWeight: 600 }}>Cancelar</button><button onClick={handleGuardarEdicion} className="flex-1 px-4 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-black" style={{ fontSize: '14px', fontWeight: 600 }}>Guardar Cambios</button></div>
            </div>
          </div>
        )}
      </div>
    </ModuleTemplate>
  );
};
