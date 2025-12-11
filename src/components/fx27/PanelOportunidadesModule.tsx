import { ModuleTemplate } from './ModuleTemplate';
import { useState, useEffect } from 'react';
import { MODULE_IMAGES } from '../../assets/module-images';
import { Search, Download, TrendingUp, X, BarChart3, Building2, User, Calendar, Eye, Trash2, SortAsc, SortDesc, FileText, Upload, Pencil, AlertTriangle, Loader2, CheckCircle, DollarSign, Clock, Zap, Flame, Skull } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface PanelOportunidadesModuleProps { onBack: () => void; }
interface LineaCotizacion { ruta: string; tarifa: number; moneda: string; viajes: number; tipoViaje: string; subtotalMXN: number; }
interface Cotizacion { nombre: string; url: string; fecha: string; analisis?: any; eliminado?: boolean; lineas?: LineaCotizacion[]; potencialMXN?: number; }
interface HistorialCambio { fecha: string; campo: string; valorAnterior: string; valorNuevo: string; usuario: string; }
interface Lead { id: string; nombreEmpresa: string; paginaWeb: string; nombreContacto: string; telefonoContacto?: string; correoElectronico: string; tipoServicio: string[]; tipoViaje: string[]; principalesRutas: string; viajesPorMes: string; tarifa: string; proyectadoVentaMensual?: string; proximosPasos: string; etapaLead?: string; altaCliente?: boolean; generacionSOP?: boolean; juntaArranque?: boolean; facturado?: boolean; vendedor: string; fechaCaptura?: string; fechaActualizacion?: string; cotizaciones?: Cotizacion[]; eliminado?: boolean; fechaEliminado?: string; historial?: HistorialCambio[]; fechaLiberacion?: string; }
type SortField = 'nombreEmpresa' | 'vendedor' | 'fechaCaptura' | 'viajesPorMes';
type SortDirection = 'asc' | 'desc';

const CLIENTES_EXISTENTES = ['ABASTECEDORA DE MATERIAS PRIMAS','AGROINDUSTRIAL AGRILEG DE TEHUACAN','AGROPECUARIA MARLEE','AGROS','ALIANZA CARNICA','ALIMENTOS FINOS DE OCCIDENTE','ALIMENTOS Y SAZONADORES REGIOS','ALL CARRIERS, INC.','ANA PAULA ALONSO ZARAZUA','ARCBEST II INC','ARCH MEAT','ATLAS EXPEDITORS','AVICOLA PILGRIM\'S PRIDE DE MEXICO','AYVI','BAK - HERCA','BAKERY MACHINERY AND ENGINEERING LLC','BARCEL','BARRY CALLEBAUT MEXICO','BARRY CALLEBAUT MEXICO DISTRIBUTORS','BBA LOGISTCS LLC','BERRIES PARADISE','BIMBO','BIO-ORGANICOS SALUDABLES','BISON TRANSPORT INC','C H ROBINSON DE MEXICO','CADENA COMERCIAL OXXO','CARNES SELECTAS TANGAMANGA','CAROLINA LOGISTICS INC','CFI LOGISTICA','CH ROBINSON WORLDWIDE, INC','COMERCIALIZADORA DE LACTEOS Y DERIVADOS','COMERCIALIZADORA GAB','COMERCIALIZADORA KEES','DEACERO','DISTRIBUCION Y EMBARQUES FRESH','DISTRIBUIDORA Y COMERCIALIZADORA INTERNACIONAL DEL NORTE','EA LOGISTICA','EBI TRANSFERS','EDMUNDO BARRAGAN PERALES','EMPACADORA DE CARNES UNIDAD GANADERA','ENLACES TERRESTRES DEL BOSQUE','FORJAS Y MAQUINAS','FP GRUPO LOGISTICO EMPRESARIAL','FRIGORIFICO Y EMPACADORA DE AGUASCALIENTES','FWD LOGISTICA','GANADEROS PRODUCTORES DE LECHE PURA','GRANJAS CARROLL DE MEXICO','GRANJERO FELIZ','GRUPO MELANGE DE MEXICO','GUILLERMO ACEVES CASILLAS','HEXPOL COMPOUNDING','HEXPOL COMPOUNDING QUERETARO','HIGH - TECH GARDENS','HIGH TECH FARMS','HONDA TRADING DE MEXICO','HORTIFRUT','IMPORTADORA DE PRODUCTOS CARNICOS APODACA','INDUSTRIALIZADORA DE CARNICOS STRATTEGA','INDUSTRIAS ACROS WHIRLPOOL','INFINITY TRADING IMPORTS AND EXPORTS','INTERCARNES','INTERLAND TRANSPORT','INTERLAND USA','INVERNADERO ISER','JD AGRO KAPITAL','JOHNSON CONTROLS ENTERPRISES MEXICO','KGL INTERNATIONAL NETWORK MEXICO','KONEKT INTERSERVICE','KRONUS LOGISTICS LLC','L\'ORTICELLO','LA PRADERA MIXTECA','LILA LISSETH GOVEA DUEÑAS','LOADED AND ROLLING CARRIER SOLUTIONS','LOGISTEED MEXICO','LONGHORN WAREHOUSES, INC','LTD INTERNATIONAL','MAR BRAN','MARBRAN USA, LTD','MARIA DE LOURDES HERNANDEZ CABRERA','MARTICO MEX','MCALLEN MEAT PURVEYORS, LLC','MCCAIN MEXICO','MGB INTERNATIONAL LLC','MI PUEBLITO TIERRA BUENA','NATURESWEET COMERCIALIZADORA','NATURESWEET INVERNADEROS','NS BRANDS, LTD','NUVOCARGO','ONE SOLUTION GROUP, INC','ONTARIO LIMITED DBA TRAFFIX','ONUS COMERCIAL','P.A.C. INTERNATIONAL','PERFORMER LOGISTICS','PILGRIM\'S PRIDE','PIPER TRADING LLC','POLLO Y HUEVO TRIUNFO','PRODUCTORA AGRICOLA DE AGUASCALIENTES','PRODUCTORA DE BOCADOS CARNICOS','PRODUCTORA DE HUEVO GIGANTES','PRODUCTOS CAREY','PRODUCTOS FRUGO','PROMOTORA DE MERCADOS','RA QUINTANA ELIZONDO CORPORATIVO ADUANAL','R.H. SHIPPING & CHARTERING','R.H. SHIPPING AND CHARTERING','RANCHO ACUICOLA ELIXIR','RED ROAD LOGISTICS INC','REGULO BARAJAS MEDINA','SCHENKER INTERNATIONAL','SERVI CARNES DE OCCIDENTE','SIGMA ALIMENTOS CENTRO','SIGMA ALIMENTOS COMERCIAL','SKYWHALE','SPEEDYHAUL INTERNATIONAL','STEERINGMEX','SUMMIT PLASTICS GUANAJUATO','SUMMIT PLASTICS SILAO','SUN CHEMICAL','TEU LOGISTICA','TITAN MEATS LLC','TRANSPLACE MEXICO LLC','TRAXION TECHNOLOGIES','TROB TRANSPORTES','TROB USA, LLC','UNITED FC DE MEXICO','UNIVERSAL WIPES','VALLE REDONDO','VDT LOGISTICA','VEGGIE PRIME','VICTUX','VISCERAS SELECTAS DEL BAJIO','WEXPRESS','WHIRLPOOL INTERNACIONAL','ZEBRA LOGISTICS','ZEBRA LOGISTICS, INC'];

const formatDate = (dateStr: string | undefined): string => {
  if (!dateStr) return '-';
  try { const date = new Date(dateStr); if (isNaN(date.getTime())) return '-'; return date.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }); } catch { return '-'; }
};

const formatDateTime = (dateStr: string | undefined): string => {
  if (!dateStr) return '-';
  try { const date = new Date(dateStr); if (isNaN(date.getTime())) return '-'; return date.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return '-'; }
};

const diasSinMovimiento = (fechaActualizacion: string | undefined, fechaCaptura: string | undefined): number => {
  const fecha = fechaActualizacion || fechaCaptura;
  if (!fecha) return 0;
  const diff = Date.now() - new Date(fecha).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

const diasDesdeCreacion = (fechaCaptura: string | undefined): number => {
  if (!fechaCaptura) return 0;
  const diff = Date.now() - new Date(fechaCaptura).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

const TC_USD_MXN = 20.50;

const detectarTipoViaje = (ruta: string): string => {
  const rutaLower = ruta.toLowerCase();
  const ciudadesUSA = ['laredo', 'nuevo laredo', 'nvo laredo', 'dallas', 'houston', 'san antonio', 'el paso', 'mcallen', 'brownsville', 'eagle pass', 'texas', 'california', 'arizona', 'chicago', 'los angeles', 'phoenix'];
  const esOrigenUSA = ciudadesUSA.some(c => rutaLower.startsWith(c) || rutaLower.includes(c + ' -') || rutaLower.includes(c + ' a '));
  const esDestinoUSA = ciudadesUSA.some(c => rutaLower.endsWith(c) || rutaLower.includes('- ' + c) || rutaLower.includes(' a ' + c));
  const tieneUSA = ciudadesUSA.some(c => rutaLower.includes(c));
  if (rutaLower.includes('laredo') || rutaLower.includes('nvo laredo') || rutaLower.includes('nuevo laredo')) {
    if (esOrigenUSA && !esDestinoUSA) return 'Impo';
    if (!esOrigenUSA && esDestinoUSA) return 'Expo';
  }
  if (tieneUSA && !rutaLower.includes('laredo')) return 'DTD';
  if (esOrigenUSA) return 'Impo';
  if (esDestinoUSA) return 'Expo';
  return 'Nacional';
};

const buscarDuplicados = (nombre: string, leadsExistentes: Lead[]): { duplicadoExacto: boolean; similares: string[] } => {
  const nombreNorm = nombre.toUpperCase().trim();
  const duplicadoExacto = CLIENTES_EXISTENTES.some(c => c.toUpperCase() === nombreNorm) || leadsExistentes.some(l => l.nombreEmpresa.toUpperCase() === nombreNorm);
  const similares: string[] = [];
  const palabras = nombreNorm.split(' ').filter(p => p.length > 3);
  CLIENTES_EXISTENTES.forEach(c => { const cNorm = c.toUpperCase(); if (cNorm !== nombreNorm && palabras.some(p => cNorm.includes(p))) similares.push(c); });
  leadsExistentes.forEach(l => { const lNorm = l.nombreEmpresa.toUpperCase(); if (lNorm !== nombreNorm && palabras.some(p => lNorm.includes(p)) && !similares.includes(l.nombreEmpresa)) similares.push(l.nombreEmpresa); });
  return { duplicadoExacto, similares: similares.slice(0, 5) };
};

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
  const [analizando, setAnalizando] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [pdfPreview, setPdfPreview] = useState<string | null>(null);
  const [tipoCambio] = useState(TC_USD_MXN);
  const [lineasModal, setLineasModal] = useState<{cotizacion: Cotizacion, lead: Lead, index: number} | null>(null);
  const [lineasCotizacion, setLineasCotizacion] = useState<LineaCotizacion[]>([]);

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
    if (filterFecha) resultado = resultado.filter(lead => { try { return lead.fechaCaptura && new Date(lead.fechaCaptura).toISOString().split('T')[0] === filterFecha; } catch { return false; } });
    resultado.sort((a, b) => {
      let valueA: any = a[sortField], valueB: any = b[sortField];
      if (sortField === 'viajesPorMes') { valueA = parseInt(valueA) || 0; valueB = parseInt(valueB) || 0; }
      if (sortField === 'fechaCaptura') { try { valueA = new Date(a.fechaCaptura || '').getTime() || 0; valueB = new Date(b.fechaCaptura || '').getTime() || 0; } catch { valueA = 0; valueB = 0; } }
      if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    setFilteredLeads(resultado);
  }, [leads, searchTerm, filterVendedor, filterFecha, sortField, sortDirection, showDeleted]);

  const getAlertaLead = (lead: Lead): { tipo: 'amarillo' | 'rojo' | 'critico' | null; mensaje: string; dias: number } => {
    if (lead.etapaLead === 'Cerrado') return { tipo: null, mensaje: '', dias: 0 };
    const diasCreacion = diasDesdeCreacion(lead.fechaCaptura);
    const diasSinMov = diasSinMovimiento(lead.fechaActualizacion, lead.fechaCaptura);
    if (diasCreacion >= 90) {
      const diasRestantes = 15 - (diasCreacion - 90);
      return { tipo: 'critico', mensaje: `Lead será liberado en ${diasRestantes > 0 ? diasRestantes : 0} días. No podrá volver a capturarlo.`, dias: diasRestantes > 0 ? diasRestantes : 0 };
    }
    if (diasSinMov >= 30) return { tipo: 'rojo', mensaje: `${diasSinMov} días sin movimiento. ¡Urge actualizar estatus!`, dias: diasSinMov };
    if (diasSinMov >= 15) return { tipo: 'amarillo', mensaje: `${diasSinMov} días sin movimiento. Requiere seguimiento.`, dias: diasSinMov };
    return { tipo: null, mensaje: '', dias: 0 };
  };

  const handleSort = (field: SortField) => { if (sortField === field) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc'); else { setSortField(field); setSortDirection('asc'); } };
  const handleExportExcel = () => { const headers = ['Empresa', 'Contacto', 'Email', 'Servicio', 'Viaje', 'Rutas', 'Viajes/Mes', 'Potencial MXN', 'Vendedor', 'Fecha']; const rows = filteredLeads.map(lead => [lead.nombreEmpresa, lead.nombreContacto, lead.correoElectronico, (lead.tipoServicio||[]).join(', '), (lead.tipoViaje||[]).join(', '), lead.principalesRutas, lead.viajesPorMes, lead.proyectadoVentaMensual || '', lead.vendedor, formatDate(lead.fechaCaptura)]); const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n'); const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `leads_fx27_${new Date().toISOString().split('T')[0]}.csv`; link.click(); };
  const getVendedoresUnicos = () => Array.from(new Set(leads.map(lead => lead.vendedor)));

  const analizarCotizacion = async (pdfText: string, fileName: string): Promise<any> => {
    try {
      const url = `https://${projectId}.supabase.co/functions/v1/analyze-cotizacion`;
      const textoParaEnviar = pdfText.length > 100 ? pdfText.substring(0, 8000) : `Cotización de transporte: ${fileName}. Analiza y extrae información típica.`;
      const response = await fetch(url, { method: 'POST', headers: { 'Authorization': `Bearer ${publicAnonKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ pdfText: textoParaEnviar, tipoCambio }) });
      const text = await response.text();
      try {
        const result = JSON.parse(text);
        if (result.success && result.analisis) {
          let analisis = result.analisis;
          if (analisis.raw && typeof analisis.raw === 'string') {
            const jsonMatch = analisis.raw.match(/\{[\s\S]*\}/);
            if (jsonMatch) { try { analisis = JSON.parse(jsonMatch[0]); } catch {} }
          }
          return analisis;
        }
        return null;
      } catch { return null; }
    } catch { return null; }
  };

  const handleSubirCotizaciones = async (files: FileList, lead: Lead) => {
    setAnalizando(true);
    setStatusMsg('Analizando PDF...');
    const archivos = Array.from(files).filter(f => f.type === 'application/pdf');
    if (archivos.length === 0) { alert('Solo PDFs'); setAnalizando(false); setStatusMsg(''); return; }
    
    for (let i = 0; i < archivos.length; i++) {
      const file = archivos[i];
      try {
        const base64 = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result as string); reader.onerror = () => reject('Error'); reader.readAsDataURL(file); });
        const analisis = await analizarCotizacion(file.name, file.name);
        const nuevaCot: Cotizacion = { nombre: file.name, url: base64, fecha: new Date().toISOString(), analisis, eliminado: false };
        
        let lineas: LineaCotizacion[] = [];
        if (analisis && !analisis.error) {
          const rutasStr = analisis.rutas || '';
          const rutasArray = rutasStr.split(/[,;|\n]/).map((r: string) => r.trim()).filter((r: string) => r);
          const tarifaBase = analisis.tarifaMXN || analisis.tarifaTotal || 0;
          const monedaBase = analisis.moneda || 'MXN';
          
          if (rutasArray.length > 0) {
            lineas = rutasArray.map((ruta: string) => ({ ruta, tarifa: tarifaBase, moneda: monedaBase, viajes: 0, tipoViaje: detectarTipoViaje(ruta), subtotalMXN: 0 }));
          } else {
            lineas = [{ ruta: rutasStr || 'Ruta Principal', tarifa: tarifaBase, moneda: monedaBase, viajes: 0, tipoViaje: 'Nacional', subtotalMXN: 0 }];
          }
        } else {
          lineas = [{ ruta: 'Ruta 1', tarifa: 0, moneda: 'MXN', viajes: 0, tipoViaje: 'Nacional', subtotalMXN: 0 }];
        }
        
        const leadTemp = { ...lead, cotizaciones: [...(lead.cotizaciones || []), nuevaCot] };
        setLeads(leads.map(l => l.id === lead.id ? leadTemp : l));
        setCotizacionesModal(leadTemp);
        setLineasCotizacion(lineas);
        setLineasModal({ cotizacion: nuevaCot, lead: leadTemp, index: (lead.cotizaciones || []).length });
        setAnalizando(false);
        setStatusMsg('');
        return;
      } catch (e) { console.error('Error:', e); }
    }
    setAnalizando(false);
    setStatusMsg('');
  };

  const calcularSubtotal = (linea: LineaCotizacion): number => {
    const tarifaMXN = linea.moneda === 'USD' ? linea.tarifa * tipoCambio : linea.tarifa;
    return linea.viajes * tarifaMXN;
  };

  const calcularTotalMXN = (): number => lineasCotizacion.reduce((sum, linea) => sum + calcularSubtotal(linea), 0);
  const todosViajesCapturados = (): boolean => lineasCotizacion.every(l => l.viajes > 0);

  const handleGuardarCotizacion = async () => {
    if (!lineasModal || !todosViajesCapturados()) return;
    const { lead, index } = lineasModal;
    const cotizaciones = [...(lead.cotizaciones || [])];
    const lineasConSubtotal = lineasCotizacion.map(l => ({ ...l, subtotalMXN: calcularSubtotal(l) }));
    const potencialMXN = calcularTotalMXN();
    cotizaciones[index] = { ...cotizaciones[index], lineas: lineasConSubtotal, potencialMXN };
    
    const tiposViaje = [...(lead.tipoViaje || [])];
    let rutas = lead.principalesRutas || '';
    let totalViajes = parseInt(lead.viajesPorMes || '0');
    
    lineasConSubtotal.forEach(l => {
      if (l.tipoViaje && !tiposViaje.includes(l.tipoViaje)) tiposViaje.push(l.tipoViaje);
      if (l.ruta && !rutas.includes(l.ruta)) rutas = rutas ? `${rutas}, ${l.ruta}` : l.ruta;
      totalViajes += l.viajes;
    });
    
    let potencialTotal = 0;
    cotizaciones.forEach(cot => { if (cot.potencialMXN) potencialTotal += cot.potencialMXN; });
    
    const historialNuevo: HistorialCambio = { fecha: new Date().toISOString(), campo: 'cotizaciones', valorAnterior: '', valorNuevo: `Nueva cotización: ${cotizaciones[index].nombre}`, usuario: lead.vendedor };
    
    const leadActualizado = { ...lead, cotizaciones, tipoViaje: tiposViaje, principalesRutas: rutas, viajesPorMes: String(totalViajes), proyectadoVentaMensual: `$${potencialTotal.toLocaleString('es-MX')} MXN`, etapaLead: 'Cotizado', fechaActualizacion: new Date().toISOString(), historial: [...(lead.historial || []), historialNuevo] };
    
    try {
      await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/leads/${lead.id}`, { method: 'PUT', headers: { 'Authorization': `Bearer ${publicAnonKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify(leadActualizado) });
      setLeads(leads.map(l => l.id === lead.id ? leadActualizado : l));
      setCotizacionesModal(leadActualizado);
      setLineasModal(null);
      setLineasCotizacion([]);
      alert('Cotización guardada correctamente');
    } catch { alert('Error guardando'); }
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
    } catch {}
  };

  const handleGuardarEdicion = async () => {
    if (!editLead || !formData?.nombreEmpresa?.trim() || !formData?.nombreContacto?.trim() || !formData?.correoElectronico?.trim()) { alert('Campos obligatorios'); return; }
    const { duplicadoExacto, similares } = buscarDuplicados(formData.nombreEmpresa || '', leads.filter(l => l.id !== editLead.id));
    if (duplicadoExacto) { alert(`Error: El cliente "${formData.nombreEmpresa}" ya existe en el sistema.`); return; }
    if (similares.length > 0 && !confirm(`Se encontraron clientes similares:\n${similares.join('\n')}\n\n¿Desea continuar de todos modos?`)) return;
    
    try {
      const historialNuevo: HistorialCambio = { fecha: new Date().toISOString(), campo: 'edición', valorAnterior: editLead.nombreEmpresa, valorNuevo: formData.nombreEmpresa || '', usuario: editLead.vendedor };
      const leadActualizado = { ...editLead, ...formData, tipoServicio: formData.tipoServicio || [], tipoViaje: formData.tipoViaje || [], fechaActualizacion: new Date().toISOString(), historial: [...(editLead.historial || []), historialNuevo] };
      await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/leads/${editLead.id}`, { method: 'PUT', headers: { 'Authorization': `Bearer ${publicAnonKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify(leadActualizado) });
      setLeads(leads.map(l => l.id === editLead.id ? leadActualizado : l));
      setEditLead(null); setFormData({});
    } catch { alert('Error'); }
  };

  const handleInputChange = (field: keyof Lead, value: any) => {
    if (field === 'nombreContacto') { setFormData({ ...formData, [field]: value.toLowerCase().split(' ').map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ') }); }
    else if (field === 'correoElectronico') { setFormData({ ...formData, [field]: value.toLowerCase() }); }
    else { setFormData({ ...formData, [field]: value }); }
  };

  const handleToggleServicio = (s: string) => { const arr = formData.tipoServicio || []; setFormData({ ...formData, tipoServicio: arr.includes(s) ? arr.filter(x => x !== s) : [...arr, s] }); };
  const handleToggleViaje = (v: string) => { const arr = formData.tipoViaje || []; setFormData({ ...formData, tipoViaje: arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v] }); };
  const SortIcon = ({ field }: { field: SortField }) => sortField !== field ? <SortAsc className="w-4 h-4 opacity-30" /> : sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />;

  // Componente Badge de Alerta
  const AlertBadge = ({ lead }: { lead: Lead }) => {
    const alerta = getAlertaLead(lead);
    if (!alerta.tipo) return null;
    
    if (alerta.tipo === 'amarillo') {
      return (
        <span title={alerta.mensaje} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-yellow-500/20 text-yellow-400 text-xs font-semibold cursor-help border border-yellow-500/30 hover:bg-yellow-500/30 transition-colors">
          <Zap className="w-3 h-3" />
          <span>{alerta.dias}d</span>
        </span>
      );
    }
    
    if (alerta.tipo === 'rojo') {
      return (
        <span title={alerta.mensaje} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-red-500/20 text-red-400 text-xs font-semibold cursor-help border border-red-500/30 hover:bg-red-500/30 transition-colors animate-pulse">
          <Flame className="w-3 h-3" />
          <span>{alerta.dias}d</span>
        </span>
      );
    }
    
    if (alerta.tipo === 'critico') {
      return (
        <span title={alerta.mensaje} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-red-600/30 text-red-300 text-xs font-bold cursor-help border border-red-500/50 hover:bg-red-600/40 transition-colors animate-pulse">
          <Skull className="w-3 h-3" />
          <span>{alerta.dias}d</span>
        </span>
      );
    }
    
    return null;
  };

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
            <div className="grid grid-cols-5 gap-3">
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30"><div className="text-blue-400 mb-1" style={{ fontSize: '12px' }}>Total</div><div className="text-white" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '28px', fontWeight: 700 }}>{leads.filter(l => !l.eliminado).length}</div></div>
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30"><div className="text-yellow-400 mb-1" style={{ fontSize: '12px' }}>Cotizados</div><div className="text-white" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '28px', fontWeight: 700 }}>{leads.filter(l => !l.eliminado && l.etapaLead === 'Cotizado').length}</div></div>
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30"><div className="text-green-400 mb-1" style={{ fontSize: '12px' }}>Cerrados</div><div className="text-white" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '28px', fontWeight: 700 }}>{leads.filter(l => !l.eliminado && l.etapaLead === 'Cerrado').length}</div></div>
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30"><div className="text-emerald-400 mb-1" style={{ fontSize: '12px' }}>$ Potencial Total</div><div className="text-emerald-400" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '18px', fontWeight: 700 }}>${leads.filter(l => !l.eliminado && l.proyectadoVentaMensual).reduce((sum, l) => sum + (parseInt(l.proyectadoVentaMensual?.replace(/[^0-9]/g, '') || '0') || 0), 0).toLocaleString('es-MX')} MXN</div></div>
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30"><div className="text-red-400 mb-1" style={{ fontSize: '12px' }}>En Riesgo</div><div className="text-white" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '28px', fontWeight: 700 }}>{leads.filter(l => !l.eliminado && getAlertaLead(l).tipo !== null).length}</div></div>
            </div>
          </div>
        )}

        <div className="flex-1 mx-4 mb-4 rounded-2xl bg-[var(--fx-surface)] border border-white/10 overflow-hidden flex flex-col">
          <div className="flex-shrink-0 border-b border-white/10 bg-[var(--fx-surface)]">
            <table className="w-full"><thead><tr>
              <th className="px-2 py-2 text-center text-[var(--fx-muted)]" style={{ fontSize: '11px', fontWeight: 600, width: '3%' }}>#</th>
              <th onClick={() => handleSort('nombreEmpresa')} className="px-2 py-2 text-left text-[var(--fx-muted)] cursor-pointer hover:text-white" style={{ fontSize: '11px', fontWeight: 600, width: '18%' }}><div className="flex items-center gap-1"><Building2 className="w-3 h-3" />EMPRESA<SortIcon field="nombreEmpresa" /></div></th>
              <th className="px-1.5 py-2 text-left text-[var(--fx-muted)]" style={{ fontSize: '11px', fontWeight: 600, width: '7%' }}>ETAPA</th>
              <th className="px-2 py-2 text-left text-[var(--fx-muted)]" style={{ fontSize: '11px', fontWeight: 600, width: '14%' }}>CONTACTO</th>
              <th className="px-2 py-2 text-left text-[var(--fx-muted)]" style={{ fontSize: '11px', fontWeight: 600, width: '10%' }}>SERVICIO</th>
              <th className="px-1.5 py-2 text-left text-[var(--fx-muted)]" style={{ fontSize: '11px', fontWeight: 600, width: '10%' }}>VIAJE</th>
              <th className="px-1.5 py-2 text-left text-[var(--fx-muted)]" style={{ fontSize: '11px', fontWeight: 600, width: '12%' }}><div className="flex items-center gap-1"><DollarSign className="w-3 h-3" />$ POTENCIAL</div></th>
              <th onClick={() => handleSort('vendedor')} className="px-2 py-2 text-left text-[var(--fx-muted)] cursor-pointer hover:text-white" style={{ fontSize: '11px', fontWeight: 600, width: '10%' }}><div className="flex items-center gap-1"><User className="w-3 h-3" />VENDEDOR<SortIcon field="vendedor" /></div></th>
              <th onClick={() => handleSort('fechaCaptura')} className="px-2 py-2 text-left text-[var(--fx-muted)] cursor-pointer hover:text-white" style={{ fontSize: '11px', fontWeight: 600, width: '8%' }}><div className="flex items-center gap-1"><Calendar className="w-3 h-3" />CREADO<SortIcon field="fechaCaptura" /></div></th>
              <th className="px-2 py-2 text-center text-[var(--fx-muted)]" style={{ fontSize: '11px', fontWeight: 600, width: '8%' }}>ACCIONES</th>
            </tr></thead></table>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <table className="w-full"><tbody>
              {filteredLeads.length === 0 ? (
                <tr><td colSpan={10} className="px-6 py-12 text-center text-[var(--fx-muted)]">No se encontraron leads.</td></tr>
              ) : (
                filteredLeads.map((lead, index) => {
                  const alerta = getAlertaLead(lead);
                  return (
                    <tr key={lead.id} className={`border-b border-white/5 hover:bg-white/5 ${lead.eliminado ? 'opacity-50 bg-red-500/5' : ''} ${alerta.tipo === 'critico' ? 'bg-red-500/10' : ''}`} style={{ height: '48px' }}>
                      <td className="px-2 py-2 text-center" style={{ fontFamily: "'Orbitron', monospace", fontSize: '11px', fontWeight: 600, color: lead.eliminado ? '#ef4444' : alerta.tipo === 'critico' ? '#ef4444' : 'var(--fx-primary)', width: '3%' }}>{index + 1}</td>
                      <td className="px-2 py-2" style={{ width: '18%' }}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-white truncate" style={{ fontSize: '11px', fontWeight: 700 }}>{lead.nombreEmpresa}</span>
                          <AlertBadge lead={lead} />
                        </div>
                      </td>
                      <td className="px-1.5 py-2" style={{ width: '7%' }}><span className={`px-2 py-0.5 rounded text-xs font-semibold ${lead.etapaLead === 'Cotizado' ? 'bg-yellow-500/20 text-yellow-400' : lead.etapaLead === 'Negociación' ? 'bg-orange-500/20 text-orange-400' : lead.etapaLead === 'Cerrado' ? 'bg-green-500/20 text-green-400' : 'bg-purple-500/20 text-purple-400'}`} style={{ fontSize: '10px' }}>{lead.etapaLead || 'Prospecto'}</span></td>
                      <td className="px-2 py-2" style={{ width: '14%' }}><div style={{ fontSize: '11px' }}><div className="text-white font-semibold truncate">{lead.nombreContacto}</div><div className="text-[var(--fx-muted)] truncate" style={{ fontSize: '10px' }}>{lead.correoElectronico}</div></div></td>
                      <td className="px-2 py-2" style={{ width: '10%' }}><div className="flex flex-wrap gap-0.5">{(lead.tipoServicio || []).slice(0,2).map((t, i) => <span key={i} className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400" style={{ fontSize: '9px', fontWeight: 600 }}>{t}</span>)}</div></td>
                      <td className="px-1.5 py-2" style={{ width: '10%' }}><div className="flex flex-wrap gap-0.5">{(lead.tipoViaje || []).slice(0,2).map((t, i) => <span key={i} className="px-1.5 py-0.5 rounded bg-green-500/20 text-green-400" style={{ fontSize: '9px', fontWeight: 600 }}>{t}</span>)}</div></td>
                      <td className="px-1.5 py-2" style={{ width: '12%' }}>{lead.proyectadoVentaMensual ? <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400" style={{ fontFamily: "'Orbitron', monospace", fontSize: '10px', fontWeight: 600 }}>{lead.proyectadoVentaMensual}</span> : <span className="text-[var(--fx-muted)]" style={{ fontSize: '10px' }}>-</span>}</td>
                      <td className="px-2 py-2 text-[var(--fx-muted)]" style={{ fontSize: '11px', width: '10%' }}>{lead.vendedor}</td>
                      <td className="px-2 py-2" style={{ width: '8%' }}><span className="text-white" style={{ fontSize: '10px' }}>{formatDate(lead.fechaCaptura)}</span></td>
                      <td className="px-2 py-2" style={{ width: '8%' }}>
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => setSelectedLead(lead)} className="p-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30" title="Ver detalle completo"><Eye className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setEditLead(lead)} className="p-1.5 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30" disabled={lead.eliminado} title="Editar lead"><Pencil className="w-3.5 h-3.5" /></button>
                          <div className="relative">
                            <button onClick={() => setCotizacionesModal(lead)} className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30" title="Gestionar cotizaciones"><FileText className="w-3.5 h-3.5" /></button>
                            {lead.cotizaciones?.filter(c => !c.eliminado).length ? <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white" style={{ fontSize: '9px', fontWeight: 700 }}>{lead.cotizaciones.filter(c => !c.eliminado).length}</div> : null}
                          </div>
                          {lead.eliminado && isAdmin ? <button onClick={() => handleRestaurarLead(lead)} className="p-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30" title="Restaurar lead"><TrendingUp className="w-3.5 h-3.5" /></button> : <button onClick={() => setDeleteModal(lead)} className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30" disabled={lead.eliminado} title="Eliminar lead"><Trash2 className="w-3.5 h-3.5" /></button>}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody></table>
          </div>
          
          <div className="flex-shrink-0 px-4 py-2 border-t border-white/10 bg-[var(--fx-surface)]">
            <span className="text-[var(--fx-muted)]" style={{ fontSize: '12px' }}>Mostrando {filteredLeads.length} de {leads.filter(l => !l.eliminado).length} leads</span>
          </div>
        </div>
      </div>

      {/* Modal Ver Lead Completo */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedLead(null)}>
          <div className="bg-[var(--fx-surface)] rounded-2xl border border-white/20 w-[95vw] max-w-[1100px] max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-xl font-bold flex items-center gap-2"><Building2 className="w-6 h-6 text-blue-400" />{selectedLead.nombreEmpresa}</h3>
              <button onClick={() => setSelectedLead(null)} className="p-2 rounded-lg hover:bg-white/10"><X className="w-5 h-5 text-white" /></button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <div className="flex items-center gap-2 text-blue-400 text-xs mb-1"><Calendar className="w-3 h-3" />Fecha de Creación</div>
                <div className="text-white font-semibold">{formatDateTime(selectedLead.fechaCaptura)}</div>
              </div>
              <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
                <div className="flex items-center gap-2 text-orange-400 text-xs mb-1"><Clock className="w-3 h-3" />Última Modificación</div>
                <div className="text-white font-semibold">{formatDateTime(selectedLead.fechaActualizacion) || formatDateTime(selectedLead.fechaCaptura)}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-sm mb-4">
              <div className="p-3 rounded-lg bg-white/5"><div className="text-blue-400 text-xs mb-1">Contacto</div><div className="text-white font-semibold">{selectedLead.nombreContacto}</div><div className="text-gray-400">{selectedLead.correoElectronico}</div>{selectedLead.telefonoContacto && <div className="text-gray-400">{selectedLead.telefonoContacto}</div>}</div>
              <div className="p-3 rounded-lg bg-white/5"><div className="text-blue-400 text-xs mb-1">Servicio</div><div className="flex flex-wrap gap-1">{(selectedLead.tipoServicio||[]).map((t,i)=><span key={i} className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-xs">{t}</span>)}</div></div>
              <div className="p-3 rounded-lg bg-white/5"><div className="text-green-400 text-xs mb-1">Tipo de Viaje</div><div className="flex flex-wrap gap-1">{(selectedLead.tipoViaje||[]).map((t,i)=><span key={i} className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-xs">{t}</span>)}</div></div>
              <div className="p-3 rounded-lg bg-white/5 col-span-2"><div className="text-purple-400 text-xs mb-1">Rutas</div><div className="text-white text-sm">{selectedLead.principalesRutas || '-'}</div></div>
              <div className="p-3 rounded-lg bg-white/5"><div className="text-orange-400 text-xs mb-1">Viajes/Mes</div><div className="text-white font-bold text-lg">{selectedLead.viajesPorMes || '-'}</div></div>
            </div>
            
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 mb-4">
              <div className="text-emerald-400 text-xs mb-1">$ Potencial Mensual</div>
              <div className="text-emerald-400 font-bold text-3xl">{selectedLead.proyectadoVentaMensual || 'Sin calcular'}</div>
            </div>
            
            {selectedLead.cotizaciones && selectedLead.cotizaciones.filter(c => !c.eliminado).length > 0 && (
              <div className="mb-4">
                <h4 className="text-white font-semibold mb-2 flex items-center gap-2"><FileText className="w-4 h-4 text-emerald-400" />Cotizaciones ({selectedLead.cotizaciones.filter(c => !c.eliminado).length})</h4>
                <div className="space-y-2">
                  {selectedLead.cotizaciones.filter(c => !c.eliminado).map((cot, i) => (
                    <div key={i} className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white font-medium">{cot.nombre}</span>
                        <span className="text-gray-400 text-xs">{formatDate(cot.fecha)}</span>
                      </div>
                      {cot.lineas && cot.lineas.length > 0 && (
                        <div className="space-y-1">
                          {cot.lineas.map((linea, idx) => (
                            <div key={idx} className="flex justify-between text-xs text-gray-400">
                              <span>{linea.ruta} ({linea.tipoViaje})</span>
                              <span>{linea.viajes} viajes × ${linea.tarifa.toLocaleString('es-MX')} = <span className="text-emerald-400">${linea.subtotalMXN.toLocaleString('es-MX')} MXN</span></span>
                            </div>
                          ))}
                          <div className="pt-2 border-t border-white/10 flex justify-between text-sm">
                            <span className="text-emerald-400">Total Cotización:</span>
                            <span className="text-emerald-400 font-bold">${cot.potencialMXN?.toLocaleString('es-MX')} MXN</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {selectedLead.historial && selectedLead.historial.length > 0 && (
              <div className="mb-4">
                <h4 className="text-white font-semibold mb-2 flex items-center gap-2"><Clock className="w-4 h-4 text-orange-400" />Historial de Modificaciones</h4>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {selectedLead.historial.slice().reverse().map((h, i) => (
                    <div key={i} className="flex items-center gap-3 text-xs p-2 rounded bg-white/5">
                      <span className="text-gray-500">{formatDateTime(h.fecha)}</span>
                      <span className="text-blue-400">{h.campo}</span>
                      <span className="text-gray-400">{h.valorNuevo}</span>
                      <span className="text-gray-500 ml-auto">{h.usuario}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-between items-center text-sm text-gray-400">
              <span>Vendedor: {selectedLead.vendedor}</span>
              <span>Etapa: {selectedLead.etapaLead || 'Prospecto'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Modal Eliminar */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => { setDeleteModal(null); setDeleteConfirmText(''); }}>
          <div className="bg-[var(--fx-surface)] rounded-2xl border border-red-500/30 w-[400px] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4"><AlertTriangle className="w-8 h-8 text-red-400" /><h3 className="text-white text-lg font-bold">Eliminar Lead</h3></div>
            <p className="text-white mb-2">¿Eliminar <strong>{deleteModal.nombreEmpresa}</strong>?</p>
            <p className="text-gray-400 text-sm mb-4">Escribe DELETE:</p>
            <input type="text" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())} className="w-full px-4 py-2 rounded-lg bg-black/30 border border-red-500/40 text-white text-center mb-4" />
            <div className="flex gap-3"><button onClick={() => { setDeleteModal(null); setDeleteConfirmText(''); }} className="flex-1 px-4 py-2 rounded-lg bg-gray-600 text-white">Cancelar</button><button onClick={handleConfirmarEliminacion} disabled={deleteConfirmText !== 'DELETE'} className={`flex-1 px-4 py-2 rounded-lg ${deleteConfirmText === 'DELETE' ? 'bg-red-500 text-white' : 'bg-red-500/20 text-red-400/50'}`}>Eliminar</button></div>
          </div>
        </div>
      )}

      {/* Modal Cotizaciones */}
      {cotizacionesModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setCotizacionesModal(null)}>
          <div className="bg-[var(--fx-surface)] rounded-2xl border border-white/20 w-[900px] max-h-[85vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="text-white text-xl font-bold flex items-center gap-2"><FileText className="w-5 h-5 text-emerald-400" />Cotizaciones - {cotizacionesModal.nombreEmpresa}</h3><button onClick={() => setCotizacionesModal(null)} className="p-2 rounded-lg hover:bg-white/10"><X className="w-5 h-5 text-white" /></button></div>
            <div className="mb-4"><label className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl ${analizando ? 'bg-blue-600/50' : 'bg-blue-600 hover:bg-blue-700'} text-white cursor-pointer`}>{analizando ? <><Loader2 className="w-5 h-5 animate-spin" /><span>{statusMsg}</span></> : <><Upload className="w-5 h-5" /><span className="font-semibold">Subir Cotización (PDF)</span></>}<input type="file" accept="application/pdf" className="hidden" disabled={analizando} onChange={(e) => { if (e.target.files?.length) handleSubirCotizaciones(e.target.files, cotizacionesModal); e.target.value = ''; }} /></label></div>
            <div className="space-y-3">
              {(!cotizacionesModal.cotizaciones || !cotizacionesModal.cotizaciones.filter(c => !c.eliminado).length) ? (
                <div className="text-center py-6 text-gray-400">No hay cotizaciones adjuntas.</div>
              ) : (
                cotizacionesModal.cotizaciones.filter(c => !c.eliminado).map((cot, i) => (
                  <div key={i} className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-emerald-400" /><span className="text-white font-semibold">{cot.nombre}</span><span className="text-gray-500 text-xs">{formatDate(cot.fecha)}</span></div>
                      <div className="flex gap-2">
                        {cot.url && <button onClick={() => setPdfPreview(cot.url)} className="px-2 py-1 rounded bg-purple-500/20 text-purple-400 text-xs flex items-center gap-1" title="Ver PDF"><Eye className="w-3 h-3" />Ver</button>}
                        {cot.url && <a href={cot.url} download={cot.nombre} className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-xs flex items-center gap-1" title="Descargar"><Download className="w-3 h-3" /></a>}
                        <button onClick={() => handleEliminarCotizacion(cotizacionesModal, cotizacionesModal.cotizaciones?.indexOf(cot) || i)} className="px-2 py-1 rounded bg-red-500/20 text-red-400 text-xs" title="Eliminar"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </div>
                    {cot.lineas && cot.lineas.length > 0 && (
                      <div className="mt-3 p-3 rounded bg-emerald-500/10 border border-emerald-500/20">
                        <div className="flex items-center gap-1 mb-2"><CheckCircle className="w-3 h-3 text-emerald-400" /><span className="text-emerald-400 text-xs font-semibold">Líneas Cotizadas</span></div>
                        <div className="space-y-2">
                          {cot.lineas.map((linea, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs p-2 rounded bg-black/20">
                              <div className="flex-1"><span className="text-white font-medium">{linea.ruta}</span><span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${linea.tipoViaje === 'Impo' ? 'bg-blue-500/20 text-blue-400' : linea.tipoViaje === 'Expo' ? 'bg-green-500/20 text-green-400' : linea.tipoViaje === 'DTD' ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-500/20 text-gray-400'}`}>{linea.tipoViaje}</span></div>
                              <div className="text-gray-400">{linea.viajes} viajes × ${linea.tarifa.toLocaleString('es-MX')} {linea.moneda}</div>
                              <div className="text-emerald-400 font-semibold ml-4">${linea.subtotalMXN.toLocaleString('es-MX')} MXN</div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 pt-3 border-t border-emerald-500/30 flex justify-between items-center"><span className="text-emerald-400 font-semibold">TOTAL:</span><span className="text-emerald-400 font-bold text-xl">${cot.potencialMXN?.toLocaleString('es-MX')} MXN</span></div>
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

      {/* Modal Captura de Viajes */}
      {lineasModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-[var(--fx-surface)] rounded-2xl border border-emerald-500/30 w-[900px] max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-bold flex items-center gap-2"><DollarSign className="w-5 h-5 text-emerald-400" />Capturar Viajes por Ruta</h3>
              <div className="text-blue-400 text-sm">TC: $1 USD = ${tipoCambio} MXN</div>
            </div>
            
            <div className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-blue-400 text-sm">Captura únicamente el número de <strong>viajes potenciales por mes</strong> para cada ruta.</p>
            </div>
            
            <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-white/5 rounded-t-lg text-xs text-gray-400 font-semibold">
              <div className="col-span-4">RUTA</div>
              <div className="col-span-2">TIPO</div>
              <div className="col-span-2">TARIFA</div>
              <div className="col-span-2 text-center">VIAJES/MES</div>
              <div className="col-span-2 text-right">SUBTOTAL</div>
            </div>
            
            <div className="space-y-1 mb-4">
              {lineasCotizacion.map((linea, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 p-3 rounded-lg bg-white/5 border border-white/10 items-center">
                  <div className="col-span-4 text-white text-sm font-medium">{linea.ruta}</div>
                  <div className="col-span-2"><span className={`px-2 py-1 rounded text-xs font-semibold ${linea.tipoViaje === 'Impo' ? 'bg-blue-500/20 text-blue-400' : linea.tipoViaje === 'Expo' ? 'bg-green-500/20 text-green-400' : linea.tipoViaje === 'DTD' ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-500/20 text-gray-400'}`}>{linea.tipoViaje}</span></div>
                  <div className="col-span-2 text-gray-300 text-sm">${linea.tarifa.toLocaleString('es-MX')} {linea.moneda}</div>
                  <div className="col-span-2">
                    <input type="number" min="0" value={linea.viajes || ''} onChange={(e) => { const arr = [...lineasCotizacion]; arr[idx].viajes = parseInt(e.target.value) || 0; setLineasCotizacion(arr); }} className={`w-full px-3 py-2 rounded border text-white text-center text-sm font-bold ${linea.viajes > 0 ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-red-500/10 border-red-500/30'}`} placeholder="0" style={{ MozAppearance: 'textfield' }} />
                  </div>
                  <div className="col-span-2 text-right text-emerald-400 font-bold">${calcularSubtotal(linea).toLocaleString('es-MX')} MXN</div>
                </div>
              ))}
            </div>
            
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-emerald-400 font-semibold text-lg">POTENCIAL MENSUAL TOTAL:</span>
                <span className="text-emerald-400 font-bold text-3xl" style={{ fontFamily: "'Orbitron', monospace" }}>${calcularTotalMXN().toLocaleString('es-MX')} MXN</span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button onClick={() => { setLineasModal(null); setLineasCotizacion([]); }} className="flex-1 px-4 py-2 rounded-lg bg-gray-600 text-white">Cancelar</button>
              <button onClick={handleGuardarCotizacion} disabled={!todosViajesCapturados()} className={`flex-1 px-4 py-3 rounded-lg font-semibold ${todosViajesCapturados() ? 'bg-emerald-500 text-black' : 'bg-gray-500/30 text-gray-500 cursor-not-allowed'}`}>
                {todosViajesCapturados() ? 'Guardar Cotización' : 'Completa todos los viajes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Preview PDF */}
      {pdfPreview && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={() => setPdfPreview(null)}>
          <div className="bg-white rounded-2xl w-[90vw] h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-3 bg-gray-100 border-b"><span className="text-gray-700 font-semibold">Vista previa</span><button onClick={() => setPdfPreview(null)} className="p-2 rounded-lg hover:bg-gray-200"><X className="w-5 h-5 text-gray-600" /></button></div>
            <iframe src={pdfPreview} className="flex-1 w-full" title="PDF" />
          </div>
        </div>
      )}

      {/* Modal Editar */}
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
              <div className="col-span-2"><label className="text-gray-400 text-xs">Viaje</label><div className="flex flex-wrap gap-2 mt-1">{['Impo', 'Expo', 'Nacional', 'DTD', 'Dedicado'].map(v => <button key={v} onClick={() => handleToggleViaje(v)} className={`px-3 py-1 rounded text-xs ${formData.tipoViaje?.includes(v) ? 'bg-green-500/30 text-green-400 border border-green-500' : 'bg-black/30 border border-white/20 text-white'}`}>{v}</button>)}</div></div>
              <div className="col-span-2"><label className="text-gray-400 text-xs">Rutas</label><input type="text" value={formData.principalesRutas || ''} onChange={(e) => setFormData({ ...formData, principalesRutas: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg bg-black/30 border border-white/20 text-white" /></div>
              <div><label className="text-gray-400 text-xs">Viajes/Mes</label><input type="number" value={formData.viajesPorMes || ''} onChange={(e) => setFormData({ ...formData, viajesPorMes: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg bg-black/30 border border-white/20 text-white" /></div>
              <div><label className="text-gray-400 text-xs">Etapa</label><select value={formData.etapaLead || 'Prospecto'} onChange={(e) => setFormData({ ...formData, etapaLead: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg bg-black/30 border border-white/20 text-white"><option>Prospecto</option><option>Cotizado</option><option>Negociación</option><option>Cerrado</option></select></div>
              <div className="col-span-2"><label className="text-gray-400 text-xs">Próximos Pasos</label><input type="text" value={formData.proximosPasos || ''} onChange={(e) => setFormData({ ...formData, proximosPasos: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg bg-black/30 border border-white/20 text-white" /></div>
            </div>
            <div className="flex gap-3 mt-4"><button onClick={() => setEditLead(null)} className="flex-1 px-4 py-2 rounded-lg bg-gray-600 text-white">Cancelar</button><button onClick={handleGuardarEdicion} className="flex-1 px-4 py-2 rounded-lg bg-yellow-500 text-black font-semibold">Guardar</button></div>
          </div>
        </div>
      )}
    </ModuleTemplate>
  );
};
