import { ModuleTemplate } from './ModuleTemplate';
import { useState, useEffect } from 'react';
import { MODULE_IMAGES } from '../../assets/module-images';
import { Search, Download, TrendingUp, X, BarChart3, Building2, User, Calendar, Eye, Trash2, SortAsc, SortDesc, FileText, Upload, Pencil, AlertTriangle, Loader2, CheckCircle, DollarSign, Clock, Zap, Flame, Skull, MapPin, ArrowRight, Truck } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PanelOportunidadesModuleProps { onBack: () => void; }
interface LineaCotizacion { origen: string; destino: string; servicio: string; tarifa: number; moneda: string; viajes: number; tipoViaje: string; subtotalMXN: number; omitida?: boolean; }
interface Cotizacion { nombre: string; url: string; fecha: string; analisis?: any; eliminado?: boolean; lineas?: LineaCotizacion[]; potencialMXN?: number; }
interface HistorialCambio { fecha: string; campo: string; valorAnterior: string; valorNuevo: string; usuario: string; }
interface HoldInfo { fechaInicio: string; fechaFin: string; contador: number; }
interface Lead { id: string; nombreEmpresa: string; paginaWeb: string; nombreContacto: string; telefonoContacto?: string; correoElectronico: string; tipoServicio: string[]; tipoViaje: string[]; principalesRutas: string; viajesPorMes: string; tarifa: string; proyectadoVentaMensual?: string; proximosPasos: string; etapaLead?: string; altaCliente?: boolean; generacionSOP?: boolean; juntaArranque?: boolean; facturado?: boolean; vendedor: string; fechaCaptura?: string; fechaActualizacion?: string; cotizaciones?: Cotizacion[]; eliminado?: boolean; fechaEliminado?: string; historial?: HistorialCambio[]; fechaLiberacion?: string; holdInfo?: HoldInfo; declinado?: boolean; fechaDeclinado?: string; }
type SortField = 'nombreEmpresa' | 'vendedor' | 'fechaCaptura' | 'viajesPorMes';
type SortDirection = 'asc' | 'desc';

// Estatus disponibles para leads
const ETAPAS_LEAD = ['Prospecto', 'Cotizado', 'Negociacion', 'Cerrado', 'En Hold', 'Declinado'] as const;

const CLIENTES_EXISTENTES = ['ABASTECEDORA DE MATERIAS PRIMAS','AGROINDUSTRIAL AGRILEG DE TEHUACAN','AGROPECUARIA MARLEE','AGROS','ALIANZA CARNICA','ALIMENTOS FINOS DE OCCIDENTE','ALIMENTOS Y SAZONADORES REGIOS','ALL CARRIERS, INC.','ARCBEST II INC','ARCH MEAT','ATLAS EXPEDITORS','AVICOLA PILGRIM\'S PRIDE DE MEXICO','BAKERY MACHINERY AND ENGINEERING LLC','BARCEL','BARRY CALLEBAUT MEXICO','BBA LOGISTCS LLC','BERRIES PARADISE','BIMBO','BISON TRANSPORT INC','C H ROBINSON DE MEXICO','CADENA COMERCIAL OXXO','CARNES SELECTAS TANGAMANGA','CAROLINA LOGISTICS INC','CFI LOGISTICA','CH ROBINSON WORLDWIDE, INC','COMERCIALIZADORA DE LACTEOS Y DERIVADOS','COMERCIALIZADORA GAB','COMERCIALIZADORA KEES','DEACERO','DISTRIBUCION Y EMBARQUES FRESH','EA LOGISTICA','EMPACADORA DE CARNES UNIDAD GANADERA','ENLACES TERRESTRES DEL BOSQUE','FRIGORIFICO Y EMPACADORA DE AGUASCALIENTES','FWD LOGISTICA','GANADEROS PRODUCTORES DE LECHE PURA','GRANJAS CARROLL DE MEXICO','GRANJERO FELIZ','GRUPO MELANGE DE MEXICO','HEXPOL COMPOUNDING','HIGH TECH FARMS','HONDA TRADING DE MEXICO','HORTIFRUT','IMPORTADORA DE PRODUCTOS CARNICOS APODACA','INDUSTRIALIZADORA DE CARNICOS STRATTEGA','INDUSTRIAS ACROS WHIRLPOOL','INTERCARNES','INTERLAND TRANSPORT','INTERLAND USA','JOHNSON CONTROLS ENTERPRISES MEXICO','KGL INTERNATIONAL NETWORK MEXICO','KONEKT INTERSERVICE','KRONUS LOGISTICS LLC','LOGISTEED MEXICO','LONGHORN WAREHOUSES, INC','MAR BRAN','MARBRAN USA, LTD','MARTICO MEX','MCALLEN MEAT PURVEYORS, LLC','MCCAIN MEXICO','NATURESWEET COMERCIALIZADORA','NATURESWEET INVERNADEROS','NS BRANDS, LTD','NUVOCARGO','ONE SOLUTION GROUP, INC','P.A.C. INTERNATIONAL','PERFORMER LOGISTICS','PILGRIM\'S PRIDE','PIPER TRADING LLC','POLLO Y HUEVO TRIUNFO','PRODUCTORA AGRICOLA DE AGUASCALIENTES','PRODUCTORA DE BOCADOS CARNICOS','PRODUCTOS CAREY','PRODUCTOS FRUGO','PROMOTORA DE MERCADOS','R.H. SHIPPING & CHARTERING','RANCHO ACUICOLA ELIXIR','RED ROAD LOGISTICS INC','SCHENKER INTERNATIONAL','SERVI CARNES DE OCCIDENTE','SIGMA ALIMENTOS CENTRO','SIGMA ALIMENTOS COMERCIAL','SPEEDYHAUL INTERNATIONAL','STEERINGMEX','SUMMIT PLASTICS GUANAJUATO','SUN CHEMICAL','TEU LOGISTICA','TITAN MEATS LLC','TRANSPLACE MEXICO LLC','TRAXION TECHNOLOGIES','TROB TRANSPORTES','TROB USA, LLC','UNITED FC DE MEXICO','VALLE REDONDO','VDT LOGISTICA','VEGGIE PRIME','VICTUX','VISCERAS SELECTAS DEL BAJIO','WEXPRESS','WHIRLPOOL INTERNACIONAL','ZEBRA LOGISTICS','ZEBRA LOGISTICS, INC'];

const formatDate = (dateStr: string | undefined): string => { if (!dateStr) return '-'; try { const date = new Date(dateStr); if (isNaN(date.getTime())) return '-'; return date.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }); } catch { return '-'; } };
const formatDateTime = (dateStr: string | undefined): string => { if (!dateStr) return '-'; try { const date = new Date(dateStr); if (isNaN(date.getTime())) return '-'; return date.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return '-'; } };
const diasSinMovimiento = (fechaActualizacion: string | undefined, fechaCaptura: string | undefined): number => { const fecha = fechaActualizacion || fechaCaptura; if (!fecha) return 0; return Math.floor((Date.now() - new Date(fecha).getTime()) / (1000 * 60 * 60 * 24)); };
const diasDesdeCreacion = (fechaCaptura: string | undefined): number => { if (!fechaCaptura) return 0; return Math.floor((Date.now() - new Date(fechaCaptura).getTime()) / (1000 * 60 * 60 * 24)); };

const esUbicacionUSA = (ubicacion: string): boolean => {
  const lower = ubicacion.toLowerCase();
  const estadosUSA = ['tx', 'texas', 'ca', 'california', 'az', 'arizona', 'nm', 'new mexico', 'illinois', 'il', 'ohio', 'oh', 'michigan', 'mi'];
  const ciudadesUSA = ['laredo', 'dallas', 'houston', 'san antonio', 'mcallen', 'brownsville', 'eagle pass', 'el paso', 'austin', 'chicago', 'los angeles', 'phoenix', 'tucson', 'tyler', 'edinburg'];
  const tieneZipUSA = /\b\d{5}\b/.test(ubicacion);
  return estadosUSA.some(e => lower.includes(e)) || ciudadesUSA.some(c => lower.includes(c)) || tieneZipUSA;
};

const esFronteraMX = (ubicacion: string): boolean => {
  const lower = ubicacion.toLowerCase();
  return lower.includes('nuevo laredo') || lower.includes('nvo laredo') || lower.includes('reynosa') || lower.includes('matamoros') || lower.includes('nogales') && !lower.includes('az') || lower.includes('tijuana') || lower.includes('mexicali') || lower.includes('ciudad juarez') || lower.includes('piedras negras') || lower.includes('colombia') && lower.includes('nl');
};

const detectarTipoViaje = (origen: string, destino: string, servicio: string): string => {
  const origenUSA = esUbicacionUSA(origen);
  const destinoUSA = esUbicacionUSA(destino);
  const destinoFronteraMX = esFronteraMX(destino);
  const servicioLower = servicio.toLowerCase();
  if (servicioLower.includes('parte americana') || servicioLower.includes('americana')) return 'DTD';
  if (origenUSA && destinoUSA) return 'DTD';
  if (origenUSA && !destinoUSA) return 'Impo';
  if (!origenUSA && destinoUSA) return 'Expo';
  if (!origenUSA && destinoFronteraMX) return 'Expo';
  return 'Nacional';
};

const normalizarServicio = (servicio: string): string => {
  const lower = servicio.toLowerCase();
  if (lower.includes('refrigerado') || lower.includes('thermo') || lower.includes('reefer')) return 'Refrigerado';
  if (lower.includes('hazmat')) return lower.includes('refri') ? 'Refrigerado Hazmat' : 'Seco Hazmat';
  return 'Seco';
};

const parsearCotizacionPDF = (texto: string): LineaCotizacion[] => {
  const lineas: LineaCotizacion[] = [];
  const lines = texto.split('\n').map(l => l.trim()).filter(l => l);
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.toLowerCase().includes('origen') && line.toLowerCase().includes('destino') && line.toLowerCase().includes('importe')) {
      i++;
      let origen = '', destino = '', servicio = '', importe = 0, moneda = 'MXN';
      while (i < lines.length && !lines[i].toLowerCase().startsWith('total') && !(lines[i].toLowerCase().includes('origen') && lines[i].toLowerCase().includes('destino') && lines[i].toLowerCase().includes('importe'))) {
        const dataLine = lines[i].trim();
        const importeMatch = dataLine.match(/([\d,]+\.?\d*)\s*(USD|MXN|\$MX)/i);
        if (importeMatch) { importe = parseFloat(importeMatch[1].replace(/,/g, '')); moneda = importeMatch[2].toUpperCase().includes('USD') ? 'USD' : 'MXN'; }
        const servicioMatch = dataLine.match(/(Refrigerado|Seco|Parte Americana|Cruce|Hazmat)/i);
        if (servicioMatch) servicio = servicioMatch[1];
        if (!origen && !importeMatch && dataLine.length > 3) { if (/[A-Za-z]+.*[,.]/.test(dataLine) || /\b(TX|CA|AZ|NL|Jal|Ags|Coah|Tamps|Gto|Qro)\b/i.test(dataLine)) { origen = dataLine.replace(/-$/, '').trim(); } }
        else if (origen && !destino && !importeMatch && !servicioMatch && dataLine.length > 3) { if (/[A-Za-z]+.*[,.]/.test(dataLine) || /\b(TX|CA|AZ|NL|Jal|Ags|Coah|Tamps|Gto|Qro)\b/i.test(dataLine)) { destino = dataLine.replace(/-$/, '').trim(); } }
        i++;
      }
      if (origen && destino && importe > 0) { lineas.push({ origen: origen.replace(/\s+/g, ' ').trim(), destino: destino.replace(/\s+/g, ' ').trim(), servicio: normalizarServicio(servicio) || 'Seco', tarifa: importe, moneda, viajes: 0, tipoViaje: detectarTipoViaje(origen, destino, servicio), subtotalMXN: 0 }); }
    } else { i++; }
  }
  return lineas;
};

const analizarPDFConClaude = async (textoPDF: string, pdfBase64?: string): Promise<LineaCotizacion[]> => {
  try {
    console.log('Enviando a Edge Function para analisis con Claude Vision...');
    let imagenBase64 = '';
    if (pdfBase64) {
      try {
        const base64Data = pdfBase64.split(',')[1] || pdfBase64;
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
        const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
        const page = await pdf.getPage(1);
        const scale = 2;
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx!, viewport }).promise;
        imagenBase64 = canvas.toDataURL('image/png');
        console.log('PDF convertido a imagen, tamano:', imagenBase64.length);
      } catch (e) { console.error('Error convirtiendo PDF a imagen:', e); }
    }
    const response = await fetch(`https://fbxbsslhewchyibdoyzk.supabase.co/functions/v1/analizar-cotizacion-pdf`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${publicAnonKey}` }, body: JSON.stringify({ imagenBase64, textoPDF }) });
    if (!response.ok) { console.error('Error en Edge Function:', response.status); return []; }
    const data = await response.json();
    console.log('Respuesta de Claude:', data);
    if (!data.success || !data.rutas || data.rutas.length === 0) { console.log('No se detectaron rutas con IA'); return []; }
    return data.rutas.map((r: any) => ({ origen: r.origen || '', destino: r.destino || '', servicio: r.servicio || 'Seco', tarifa: parseFloat(r.tarifa) || 0, moneda: r.moneda || 'MXN', viajes: 0, tipoViaje: detectarTipoViaje(r.origen || '', r.destino || '', r.servicio || ''), subtotalMXN: 0 }));
  } catch (error) { console.error('Error llamando a Edge Function:', error); return []; }
};

const extraerTextoPDF = async (base64: string): Promise<string> => {
  try {
    const base64Data = base64.split(',')[1] || base64;
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) { const page = await pdf.getPage(i); const textContent = await page.getTextContent(); fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n'; }
    return fullText;
  } catch (error) { console.error('Error extrayendo texto del PDF:', error); return ''; }
};

const obtenerTipoCambio = async (): Promise<number> => {
  try {
    const cached = localStorage.getItem('tipoCambioUSD');
    if (cached) { const { valor, fecha } = JSON.parse(cached); if (fecha === new Date().toISOString().split('T')[0]) return valor; }
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    if (response.ok) { const data = await response.json(); const tc = data.rates?.MXN || 18.5; localStorage.setItem('tipoCambioUSD', JSON.stringify({ valor: tc, fecha: new Date().toISOString().split('T')[0] })); return tc; }
    return 18.5;
  } catch { return 18.5; }
};

const calcularPotencialDesdeCotizaciones = (lead: Lead): number => {
  if (!lead.cotizaciones) return 0;
  return lead.cotizaciones.filter(c => !c.eliminado && c.potencialMXN).reduce((sum, c) => sum + (c.potencialMXN || 0), 0);
};

// VALIDACIÓN DE DUPLICADOS MEJORADA
// Detecta: cliente existente, lead de otro vendedor, lead propio, similares
interface DuplicadoInfo {
  esClienteExistente: boolean;
  esLeadOtroVendedor: boolean;
  vendedorActual: string;
  esLeadPropio: boolean;
  duplicadoExacto: boolean;
  similares: { nombre: string; tipo: 'cliente' | 'lead'; vendedor?: string }[];
}

const buscarDuplicadosCompleto = (
  nombre: string, 
  todosLosLeads: Lead[], 
  vendedorActual: string
): DuplicadoInfo => {
  const nombreNorm = nombre.toUpperCase().trim();
  
  // 1. Verificar si es cliente existente
  const esClienteExistente = CLIENTES_EXISTENTES.some(c => c.toUpperCase() === nombreNorm);
  
  // 2. Verificar si es lead de otro vendedor
  const leadOtroVendedor = todosLosLeads.find(l => 
    l.nombreEmpresa.toUpperCase() === nombreNorm && 
    l.vendedor !== vendedorActual &&
    !l.eliminado
  );
  
  // 3. Verificar si es lead propio
  const leadPropio = todosLosLeads.find(l => 
    l.nombreEmpresa.toUpperCase() === nombreNorm && 
    l.vendedor === vendedorActual &&
    !l.eliminado
  );
  
  // 4. Buscar similares
  const similares: { nombre: string; tipo: 'cliente' | 'lead'; vendedor?: string }[] = [];
  const palabras = nombreNorm.split(' ').filter(p => p.length > 3);
  
  // Similares en clientes existentes
  CLIENTES_EXISTENTES.forEach(c => { 
    const cNorm = c.toUpperCase(); 
    if (cNorm !== nombreNorm && palabras.some(p => cNorm.includes(p))) {
      similares.push({ nombre: c, tipo: 'cliente' });
    }
  });
  
  // Similares en leads (de cualquier vendedor)
  todosLosLeads.forEach(l => { 
    const lNorm = l.nombreEmpresa.toUpperCase(); 
    if (lNorm !== nombreNorm && !l.eliminado && palabras.some(p => lNorm.includes(p))) {
      if (!similares.find(s => s.nombre.toUpperCase() === lNorm)) {
        similares.push({ 
          nombre: l.nombreEmpresa, 
          tipo: 'lead', 
          vendedor: l.vendedor 
        });
      }
    }
  });
  
  return { 
    esClienteExistente,
    esLeadOtroVendedor: !!leadOtroVendedor,
    vendedorActual: leadOtroVendedor?.vendedor || '',
    esLeadPropio: !!leadPropio,
    duplicadoExacto: esClienteExistente || !!leadOtroVendedor || !!leadPropio,
    similares: similares.slice(0, 5)
  };
};

// Mantener función legacy para compatibilidad
const buscarDuplicados = (nombre: string, leadsExistentes: Lead[]): { duplicadoExacto: boolean; similares: string[] } => {
  const nombreNorm = nombre.toUpperCase().trim();
  const duplicadoExacto = CLIENTES_EXISTENTES.some(c => c.toUpperCase() === nombreNorm) || leadsExistentes.some(l => l.nombreEmpresa.toUpperCase() === nombreNorm);
  const similares: string[] = [];
  const palabras = nombreNorm.split(' ').filter(p => p.length > 3);
  CLIENTES_EXISTENTES.forEach(c => { const cNorm = c.toUpperCase(); if (cNorm !== nombreNorm && palabras.some(p => cNorm.includes(p))) similares.push(c); });
  leadsExistentes.forEach(l => { const lNorm = l.nombreEmpresa.toUpperCase(); if (lNorm !== nombreNorm && palabras.some(p => lNorm.includes(p)) && !similares.includes(l.nombreEmpresa)) similares.push(l.nombreEmpresa); });
  return { duplicadoExacto, similares: similares.slice(0, 5) };
};

const getTipoViajeColor = (tipo: string) => {
  switch(tipo) {
    case 'Impo': return 'bg-blue-500/10 text-blue-400/90 border-blue-500/20';
    case 'Expo': return 'bg-blue-500/10 text-blue-400/90 border-blue-500/20';
    case 'DTD': return 'bg-slate-500/10 text-slate-400/80 border-slate-500/20';
    default: return 'bg-slate-500/10 text-slate-400/70 border-slate-500/20';
  }
};

export const PanelOportunidadesModule = ({ onBack }: PanelOportunidadesModuleProps) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [allLeads, setAllLeads] = useState<Lead[]>([]); // TODOS los leads para validación de duplicados
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVendedor, setFilterVendedor] = useState('');
  const [filterFecha, setFilterFecha] = useState('');
  const [funnelVendedor, setFunnelVendedor] = useState(''); // Filtro de vendedor para Funnel
  const [vendedorActual, setVendedorActual] = useState(''); // Nombre del vendedor logueado
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
  const [tipoCambio, setTipoCambio] = useState<number>(18.5);
  const [lineasModal, setLineasModal] = useState<{cotizacion: Cotizacion, lead: Lead, index: number} | null>(null);
  const [lineasCotizacion, setLineasCotizacion] = useState<LineaCotizacion[]>([]);

  useEffect(() => { obtenerTipoCambio().then(tc => setTipoCambio(tc)); }, []);
  useEffect(() => { if (editLead) setFormData(editLead); }, [editLead]);

  useEffect(() => {
    const cargarLeads = async () => {
      try {
        const session = localStorage.getItem('fx27-session');
        let vendedor = '', esAdmin = false;
        if (session) { 
          const { email } = JSON.parse(session); 
          const usuarios = JSON.parse(localStorage.getItem('fx27-usuarios') || '[]'); 
          const usuario = usuarios.find((u: any) => u.correo === email); 
          if (usuario) { 
            vendedor = usuario.nombre; 
            esAdmin = usuario.rol === 'admin'; 
            setIsAdmin(esAdmin); 
            setVendedorActual(vendedor);
          } 
        }
        
        // Admin ve todos los leads, usuarios solo los suyos
        const url = esAdmin 
          ? `https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/leads` 
          : `https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/leads?vendedor=${encodeURIComponent(vendedor)}`;
        const response = await fetch(url, { headers: { 'Authorization': `Bearer ${publicAnonKey}` } });
        const result = await response.json();
        
        if (response.ok && result.success) { 
          setLeads(result.leads); 
          setFilteredLeads(result.leads.filter((l: Lead) => !l.eliminado)); 
        }
        
        // SIEMPRE cargar TODOS los leads para validación de duplicados (incluso para usuarios normales)
        const allLeadsUrl = `https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/leads`;
        const allResponse = await fetch(allLeadsUrl, { headers: { 'Authorization': `Bearer ${publicAnonKey}` } });
        const allResult = await allResponse.json();
        if (allResponse.ok && allResult.success) {
          setAllLeads(allResult.leads);
        }
        
      } catch (error) { console.error('Error:', error); }
    };
    cargarLeads();
  }, []);

  // Función para verificar y reactivar leads en Hold que cumplieron 30 días
  const verificarHoldsExpirados = async (leadsArray: Lead[]): Promise<Lead[]> => {
    const ahora = new Date();
    const leadsActualizados: Lead[] = [];
    
    for (const lead of leadsArray) {
      if (lead.etapaLead === 'En Hold' && lead.holdInfo?.fechaFin) {
        const fechaFin = new Date(lead.holdInfo.fechaFin);
        if (ahora >= fechaFin) {
          // Hold expirado - reactivar lead
          const leadReactivado = {
            ...lead,
            etapaLead: 'Prospecto',
            fechaActualizacion: ahora.toISOString(),
            historial: [
              ...(lead.historial || []),
              {
                fecha: ahora.toISOString(),
                campo: 'etapaLead',
                valorAnterior: 'En Hold',
                valorNuevo: 'Prospecto (reactivado automático)',
                usuario: 'Sistema'
              }
            ]
          };
          leadsActualizados.push(leadReactivado);
          
          // Actualizar en servidor
          try {
            await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/leads/${lead.id}`, {
              method: 'PUT',
              headers: { 'Authorization': `Bearer ${publicAnonKey}`, 'Content-Type': 'application/json' },
              body: JSON.stringify(leadReactivado)
            });
          } catch (e) { console.error('Error reactivando lead:', e); }
        }
      }
    }
    
    return leadsActualizados;
  };

  useEffect(() => {
    let resultado = [...leads];
    
    // Verificar holds expirados al cargar
    verificarHoldsExpirados(resultado).then(reactivados => {
      if (reactivados.length > 0) {
        setLeads(prevLeads => prevLeads.map(l => {
          const reactivado = reactivados.find(r => r.id === l.id);
          return reactivado || l;
        }));
      }
    });
    
    // Filtrar según permisos
    if (!showDeleted) {
      resultado = resultado.filter(lead => {
        // Declinados solo visibles para admin en modo "Ver eliminados"
        if (lead.declinado) return false;
        // Eliminados normales
        if (lead.eliminado) return false;
        return true;
      });
    } else if (isAdmin) {
      // Admin en modo "Ver eliminados" ve TODO incluyendo declinados
      resultado = resultado;
    }
    
    if (searchTerm) resultado = resultado.filter(lead => lead.nombreEmpresa.toLowerCase().includes(searchTerm.toLowerCase()) || lead.nombreContacto.toLowerCase().includes(searchTerm.toLowerCase()) || lead.correoElectronico.toLowerCase().includes(searchTerm.toLowerCase()));
    if (filterVendedor) resultado = resultado.filter(lead => lead.vendedor === filterVendedor);
    if (filterFecha) resultado = resultado.filter(lead => { try { return lead.fechaCaptura && new Date(lead.fechaCaptura).toISOString().split('T')[0] === filterFecha; } catch { return false; } });
    resultado.sort((a, b) => { let valueA: any = a[sortField], valueB: any = b[sortField]; if (sortField === 'viajesPorMes') { valueA = parseInt(valueA) || 0; valueB = parseInt(valueB) || 0; } if (sortField === 'fechaCaptura') { try { valueA = new Date(a.fechaCaptura || '').getTime() || 0; valueB = new Date(b.fechaCaptura || '').getTime() || 0; } catch { valueA = 0; valueB = 0; } } if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1; if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1; return 0; });
    setFilteredLeads(resultado);
  }, [leads, searchTerm, filterVendedor, filterFecha, sortField, sortDirection, showDeleted, isAdmin]);

  const getAlertaLead = (lead: Lead): { tipo: 'amarillo' | 'rojo' | 'critico' | null; mensaje: string; dias: number } => {
    if (lead.etapaLead === 'Cerrado') return { tipo: null, mensaje: '', dias: 0 };
    const diasCreacion = diasDesdeCreacion(lead.fechaCaptura);
    const diasSinMov = diasSinMovimiento(lead.fechaActualizacion, lead.fechaCaptura);
    if (diasCreacion >= 90) { const diasRestantes = 15 - (diasCreacion - 90); return { tipo: 'critico', mensaje: `Lead sera liberado en ${diasRestantes > 0 ? diasRestantes : 0} dias.`, dias: diasRestantes > 0 ? diasRestantes : 0 }; }
    if (diasSinMov >= 30) return { tipo: 'rojo', mensaje: `${diasSinMov} dias sin movimiento. Urge!`, dias: diasSinMov };
    if (diasSinMov >= 15) return { tipo: 'amarillo', mensaje: `${diasSinMov} dias sin movimiento.`, dias: diasSinMov };
    return { tipo: null, mensaje: '', dias: 0 };
  };

  const handleSort = (field: SortField) => { if (sortField === field) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc'); else { setSortField(field); setSortDirection('asc'); } };
  const handleExportExcel = () => { const headers = ['Empresa', 'Contacto', 'Email', 'Servicio', 'Viaje', 'Rutas', 'Viajes/Mes', 'Potencial MXN', 'Vendedor', 'Fecha']; const rows = filteredLeads.map(lead => { const potencial = calcularPotencialDesdeCotizaciones(lead); return [lead.nombreEmpresa, lead.nombreContacto, lead.correoElectronico, (lead.tipoServicio||[]).join(', '), (lead.tipoViaje||[]).join(', '), lead.principalesRutas, lead.viajesPorMes, potencial > 0 ? `$${potencial.toLocaleString('es-MX')}` : '', lead.vendedor, formatDate(lead.fechaCaptura)]; }); const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n'); const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `leads_fx27_${new Date().toISOString().split('T')[0]}.csv`; link.click(); };
  const getVendedoresUnicos = () => Array.from(new Set(leads.map(lead => lead.vendedor)));

  const handleSubirCotizaciones = async (files: FileList, lead: Lead) => {
    setAnalizando(true); setStatusMsg('Leyendo PDF...');
    const archivos = Array.from(files).filter(f => f.type === 'application/pdf');
    if (archivos.length === 0) { alert('Solo PDFs'); setAnalizando(false); setStatusMsg(''); return; }
    for (const file of archivos) {
      try {
        setStatusMsg('Extrayendo contenido...');
        const base64 = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result as string); reader.onerror = () => reject('Error'); reader.readAsDataURL(file); });
        setStatusMsg('Extrayendo texto del PDF...');
        const textoPDF = await extraerTextoPDF(base64);
        console.log('Texto extraido:', textoPDF.substring(0, 1500));
        setStatusMsg('Analizando rutas con IA...');
        let rutas = await analizarPDFConClaude(textoPDF, base64);
        console.log('Rutas encontradas:', rutas);
        if (rutas.length === 0) { rutas = parsearCotizacionPDF(textoPDF); console.log('Rutas con parser local:', rutas); }
        if (rutas.length === 0) { rutas.push({ origen: '', destino: '', servicio: 'Seco', tarifa: 0, moneda: 'USD', viajes: 0, tipoViaje: 'Nacional', subtotalMXN: 0 }); }
        const nuevaCot: Cotizacion = { nombre: file.name, url: base64, fecha: new Date().toISOString(), eliminado: false };
        const leadTemp = { ...lead, cotizaciones: [...(lead.cotizaciones || []), nuevaCot] };
        setLeads(leads.map(l => l.id === lead.id ? leadTemp : l));
        setCotizacionesModal(leadTemp);
        setLineasCotizacion(rutas);
        setLineasModal({ cotizacion: nuevaCot, lead: leadTemp, index: (lead.cotizaciones || []).length });
        setAnalizando(false); setStatusMsg('');
        return;
      } catch (e) { console.error('Error:', e); alert('Error al procesar el PDF'); }
    }
    setAnalizando(false); setStatusMsg('');
  };

  const calcularSubtotal = (linea: LineaCotizacion): number => { 
    if (linea.omitida) return 0; // Rutas omitidas no suman
    const tarifaMXN = linea.moneda === 'USD' ? linea.tarifa * tipoCambio : linea.tarifa; 
    return linea.viajes * tarifaMXN; 
  };
  
  const calcularTotalMXN = (): number => lineasCotizacion
    .filter(l => !l.omitida) // Solo contar rutas activas
    .reduce((sum, linea) => sum + calcularSubtotal(linea), 0);
  
  // Validar solo rutas NO omitidas
  const todosViajesCapturados = (): boolean => {
    const rutasActivas = lineasCotizacion.filter(l => !l.omitida);
    if (rutasActivas.length === 0) return false; // Al menos una ruta activa
    return rutasActivas.every(l => l.viajes > 0 && l.origen && l.destino && l.tarifa > 0);
  };
  
  // Contar rutas activas vs omitidas
  const contarRutas = () => {
    const activas = lineasCotizacion.filter(l => !l.omitida).length;
    const omitidas = lineasCotizacion.filter(l => l.omitida).length;
    return { activas, omitidas, total: lineasCotizacion.length };
  };
  
  // Toggle omitir/incluir ruta
  const handleToggleOmitirRuta = (idx: number) => {
    const arr = [...lineasCotizacion];
    arr[idx].omitida = !arr[idx].omitida;
    // Si se omite, limpiar viajes para evitar confusión
    if (arr[idx].omitida) {
      arr[idx].viajes = 0;
      arr[idx].subtotalMXN = 0;
    }
    setLineasCotizacion(arr);
  };

  const handleCambioLinea = (idx: number, campo: keyof LineaCotizacion, valor: any) => {
    const arr = [...lineasCotizacion];
    (arr[idx] as any)[campo] = valor;
    if (campo === 'origen' || campo === 'destino') arr[idx].tipoViaje = detectarTipoViaje(arr[idx].origen, arr[idx].destino, arr[idx].servicio);
    setLineasCotizacion(arr);
  };

  const handleGuardarCotizacion = async () => {
    if (!lineasModal || !todosViajesCapturados()) return;
    const { lead, index } = lineasModal;
    const cotizaciones = [...(lead.cotizaciones || [])];
    // Solo guardar rutas activas (no omitidas)
    const lineasActivas = lineasCotizacion.filter(l => !l.omitida);
    const lineasConSubtotal = lineasActivas.map(l => ({ ...l, subtotalMXN: calcularSubtotal(l) }));
    const potencialMXN = calcularTotalMXN();
    cotizaciones[index] = { ...cotizaciones[index], lineas: lineasConSubtotal, potencialMXN };
    const tiposViaje = [...(lead.tipoViaje || [])]; const tiposServicio = [...(lead.tipoServicio || [])];
    let rutas = lead.principalesRutas || ''; let totalViajes = parseInt(lead.viajesPorMes || '0');
    lineasConSubtotal.forEach(l => { if (l.tipoViaje && !tiposViaje.includes(l.tipoViaje)) tiposViaje.push(l.tipoViaje); if (l.servicio && !tiposServicio.includes(l.servicio)) tiposServicio.push(l.servicio); const rutaStr = `${l.origen} -> ${l.destino}`; if (!rutas.includes(rutaStr)) rutas = rutas ? `${rutas}, ${rutaStr}` : rutaStr; totalViajes += l.viajes; });
    let potencialTotal = 0; cotizaciones.forEach(cot => { if (!cot.eliminado && cot.potencialMXN) potencialTotal += cot.potencialMXN; });
    const historialNuevo: HistorialCambio = { fecha: new Date().toISOString(), campo: 'cotizaciones', valorAnterior: '', valorNuevo: `Nueva cotizacion: ${cotizaciones[index].nombre}`, usuario: lead.vendedor };
    const leadActualizado = { ...lead, cotizaciones, tipoViaje: tiposViaje, tipoServicio: tiposServicio, principalesRutas: rutas, viajesPorMes: String(totalViajes), proyectadoVentaMensual: potencialTotal > 0 ? `$${potencialTotal.toLocaleString('es-MX')} MXN` : '', etapaLead: 'Cotizado', fechaActualizacion: new Date().toISOString(), historial: [...(lead.historial || []), historialNuevo] };
    try {
      await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/leads/${lead.id}`, { method: 'PUT', headers: { 'Authorization': `Bearer ${publicAnonKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify(leadActualizado) });
      setLeads(leads.map(l => l.id === lead.id ? leadActualizado : l));
      setCotizacionesModal(leadActualizado); setLineasModal(null); setLineasCotizacion([]);
      alert('Cotizacion guardada correctamente');
    } catch { alert('Error guardando'); }
  };

  const handleEliminarCotizacion = async (lead: Lead, index: number) => { const cotizaciones = lead.cotizaciones?.map((c, i) => i === index ? { ...c, eliminado: true } : c) || []; const potencialTotal = cotizaciones.filter(c => !c.eliminado && c.potencialMXN).reduce((sum, c) => sum + (c.potencialMXN || 0), 0); const leadActualizado = { ...lead, cotizaciones, proyectadoVentaMensual: potencialTotal > 0 ? `$${potencialTotal.toLocaleString('es-MX')} MXN` : '', fechaActualizacion: new Date().toISOString() }; try { await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/leads/${lead.id}`, { method: 'PUT', headers: { 'Authorization': `Bearer ${publicAnonKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify(leadActualizado) }); setLeads(leads.map(l => l.id === lead.id ? leadActualizado : l)); setCotizacionesModal(leadActualizado); } catch { alert('Error'); } };
  const handleConfirmarEliminacion = async () => { if (!deleteModal || deleteConfirmText !== 'DELETE') return; try { const leadActualizado = { ...deleteModal, eliminado: true, fechaEliminado: new Date().toISOString() }; await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/leads/${deleteModal.id}`, { method: 'PUT', headers: { 'Authorization': `Bearer ${publicAnonKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify(leadActualizado) }); setLeads(leads.map(l => l.id === deleteModal.id ? leadActualizado : l)); setDeleteModal(null); setDeleteConfirmText(''); } catch { alert('Error'); } };
  const handleRestaurarLead = async (lead: Lead) => { if (!isAdmin) return; try { const leadActualizado = { ...lead, eliminado: false, fechaEliminado: null }; await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/leads/${lead.id}`, { method: 'PUT', headers: { 'Authorization': `Bearer ${publicAnonKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify(leadActualizado) }); setLeads(leads.map(l => l.id === lead.id ? leadActualizado : l)); } catch {} };

  const handleGuardarEdicion = async () => {
    if (!editLead || !formData?.nombreEmpresa?.trim() || !formData?.nombreContacto?.trim() || !formData?.correoElectronico?.trim()) { 
      alert('Campos obligatorios: Empresa, Contacto y Email'); 
      return; 
    }
    
    // VALIDACIÓN DE DUPLICADOS MEJORADA
    const nombreNuevo = formData.nombreEmpresa || '';
    const nombreCambio = nombreNuevo.toUpperCase() !== editLead.nombreEmpresa.toUpperCase();
    
    if (nombreCambio) {
      const duplicados = buscarDuplicadosCompleto(nombreNuevo, allLeads, vendedorActual);
      
      // 1. Es cliente existente
      if (duplicados.esClienteExistente) {
        alert(`❌ ERROR: "${nombreNuevo}" ya es un CLIENTE EXISTENTE.\n\nNo se puede crear un lead para un cliente que ya tenemos.`);
        return;
      }
      
      // 2. Es lead de otro vendedor
      if (duplicados.esLeadOtroVendedor) {
        alert(`❌ ERROR: "${nombreNuevo}" ya es un lead asignado a ${duplicados.vendedorActual}.\n\nNo se permiten leads duplicados entre vendedores.`);
        return;
      }
      
      // 3. Similares encontrados - mostrar advertencia
      if (duplicados.similares.length > 0) {
        const listaSimlares = duplicados.similares.map(s => 
          s.tipo === 'cliente' 
            ? `• ${s.nombre} (CLIENTE EXISTENTE)` 
            : `• ${s.nombre} (Lead de ${s.vendedor})`
        ).join('\n');
        
        if (!confirm(`⚠️ ADVERTENCIA: Se encontraron empresas similares:\n\n${listaSimlares}\n\n¿Deseas continuar de todas formas?`)) {
          return;
        }
      }
    }
    
    try {
      const historialNuevo: HistorialCambio = { fecha: new Date().toISOString(), campo: 'edicion', valorAnterior: editLead.nombreEmpresa, valorNuevo: formData.nombreEmpresa || '', usuario: editLead.vendedor };
      const leadActualizado = { ...editLead, ...formData, tipoServicio: formData.tipoServicio || [], tipoViaje: formData.tipoViaje || [], fechaActualizacion: new Date().toISOString(), historial: [...(editLead.historial || []), historialNuevo] };
      await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/leads/${editLead.id}`, { method: 'PUT', headers: { 'Authorization': `Bearer ${publicAnonKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify(leadActualizado) });
      setLeads(leads.map(l => l.id === editLead.id ? leadActualizado : l)); 
      // Actualizar también allLeads
      setAllLeads(allLeads.map(l => l.id === editLead.id ? leadActualizado : l));
      setEditLead(null); 
      setFormData({});
    } catch { alert('Error al guardar'); }
  };

  const handleInputChange = (field: keyof Lead, value: any) => { if (field === 'nombreContacto') setFormData({ ...formData, [field]: value.toLowerCase().split(' ').map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ') }); else if (field === 'correoElectronico') setFormData({ ...formData, [field]: value.toLowerCase() }); else setFormData({ ...formData, [field]: value }); };
  const handleToggleServicio = (s: string) => { const arr = formData.tipoServicio || []; setFormData({ ...formData, tipoServicio: arr.includes(s) ? arr.filter(x => x !== s) : [...arr, s] }); };
  const handleToggleViaje = (v: string) => { const arr = formData.tipoViaje || []; setFormData({ ...formData, tipoViaje: arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v] }); };
  const SortIcon = ({ field }: { field: SortField }) => sortField !== field ? <SortAsc className="w-4 h-4 opacity-30" /> : sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />;
  
  // SEMÁFOROS SÓLIDOS PREMIUM
  const AlertBadge = ({ lead }: { lead: Lead }) => { 
    const alerta = getAlertaLead(lead); 
    if (!alerta.tipo) return null; 
    
    // Warning (amarillo) - fondo sólido ámbar
    if (alerta.tipo === 'amarillo') return (
      <span 
        title={alerta.mensaje} 
        className="inline-flex items-center justify-center gap-1 cursor-help transition-all duration-150 hover:-translate-y-0.5"
        style={{
          height: '24px',
          padding: '0 10px',
          borderRadius: '8px',
          background: '#F59E0B',
          color: '#111827',
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.2px',
          boxShadow: '0 6px 14px rgba(245,158,11,0.35), inset 0 1px 0 rgba(255,255,255,0.25)'
        }}
      >
        <Zap className="w-3 h-3" />{alerta.dias}d
      </span>
    ); 
    
    // Danger (rojo) - fondo sólido rojo
    if (alerta.tipo === 'rojo' || alerta.tipo === 'critico') return (
      <span 
        title={alerta.mensaje} 
        className="inline-flex items-center justify-center gap-1 cursor-help transition-all duration-150 hover:-translate-y-0.5"
        style={{
          height: '24px',
          padding: '0 10px',
          borderRadius: '8px',
          background: '#DC2626',
          color: '#FFFFFF',
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.2px',
          boxShadow: '0 6px 14px rgba(220,38,38,0.40), inset 0 1px 0 rgba(255,255,255,0.18)'
        }}
      >
        {alerta.tipo === 'critico' ? <Skull className="w-3 h-3" /> : <Flame className="w-3 h-3" />}{alerta.dias}d
      </span>
    ); 
    
    return null; 
  };

  // Icono PDF inline SVG
  const PdfIcon = () => (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M9 15v-2h1.5a1.5 1.5 0 1 1 0 3H9" />
      <path d="M12 13h1.5a1.5 1.5 0 0 1 0 3H12v-5" />
      <path d="M17 13v4" />
    </svg>
  );

  return (
    <ModuleTemplate title="Panel de Oportunidades" onBack={onBack}>
      {/* ═══════════════════════════════════════════════════════════════
          FONDO GLOBAL AAA - Sistema de profundidad con radial gradient
          ═══════════════════════════════════════════════════════════════ */}
      <div 
        className="flex flex-col h-[calc(100vh-120px)] relative"
        style={{
          background: `
            radial-gradient(ellipse 120% 80% at 50% 20%, rgba(37,99,235,0.95) 0%, rgba(30,64,175,0.98) 40%, rgba(15,23,42,1) 100%),
            linear-gradient(180deg, #1e3a8a 0%, #0f172a 100%)
          `,
        }}
      >
        {/* Noise texture overlay - muy sutil */}
        <div 
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            opacity: 0.035,
            mixBlendMode: 'overlay'
          }}
        />
        
        {/* Radial glow behind main container - hace que "flote" */}
        <div 
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            background: `
              radial-gradient(ellipse 70% 50% at 50% 45%, rgba(59,130,246,0.12) 0%, transparent 60%),
              radial-gradient(ellipse 90% 60% at 50% 50%, rgba(30,58,138,0.20) 0%, transparent 70%)
            `
          }}
        />
        
        {/* Vignette sutil en esquinas */}
        <div 
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            background: 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(0,0,0,0.25) 100%)'
          }}
        />

        {/* ═══════════════════════════════════════════════════════════════
            BARRA DE FILTROS - Card flotante premium
            ═══════════════════════════════════════════════════════════════ */}
        <div 
          className="flex-shrink-0 mx-4 mt-4 mb-3 p-4 rounded-2xl relative z-10"
          style={{
            background: 'linear-gradient(135deg, rgba(30,58,138,0.60) 0%, rgba(30,64,175,0.50) 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 0 0 1px rgba(255,255,255,0.03)',
            backdropFilter: 'blur(12px)'
          }}
        >
          <div className="flex flex-wrap gap-3 items-center justify-between">
            {/* BÚSQUEDA - Input premium */}
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                <input 
                  type="text" 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  placeholder="Buscar leads..." 
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-blue-400/30 transition-all duration-200" 
                  style={{ 
                    fontFamily: "'Exo 2', sans-serif", 
                    fontSize: '13px',
                    background: 'rgba(15,23,42,0.50)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.20)'
                  }} 
                />
              </div>
            </div>
            
            {/* FILTRO VENDEDOR - Select premium */}
            <div className="flex gap-3">
              <select 
                value={filterVendedor} 
                onChange={(e) => setFilterVendedor(e.target.value)} 
                className="px-4 py-2.5 rounded-xl text-white/90 focus:outline-none transition-all duration-150 cursor-pointer hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
                style={{ 
                  fontFamily: "'Exo 2', sans-serif", 
                  fontSize: '13px',
                  background: 'rgba(15,23,42,0.50)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.05)'
                }}>
                <option value="">Todos los vendedores</option>
                {getVendedoresUnicos().map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            
            {/* BOTONES OS PREMIUM */}
            <div className="flex gap-2.5">
              {isAdmin && (
                <button 
                  onClick={() => setShowDeleted(!showDeleted)} 
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
                  style={{ 
                    fontFamily: "'Exo 2', sans-serif", 
                    fontSize: '13px', 
                    fontWeight: 600,
                    background: showDeleted 
                      ? 'linear-gradient(180deg, rgba(239,68,68,0.25) 0%, rgba(220,38,38,0.20) 100%)' 
                      : 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 100%)',
                    border: showDeleted ? '1px solid rgba(239,68,68,0.30)' : '1px solid rgba(255,255,255,0.10)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.20), inset 0 1px 0 rgba(255,255,255,0.10)',
                    color: showDeleted ? 'rgba(252,165,165,0.95)' : 'rgba(255,255,255,0.90)'
                  }}>
                  <Trash2 className="w-4 h-4" />
                  {showDeleted ? 'Ocultar eliminados' : 'Ver eliminados'}
                </button>
              )}
              <button 
                onClick={() => setShowFunnel(!showFunnel)} 
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
                style={{ 
                  fontFamily: "'Exo 2', sans-serif", 
                  fontSize: '13px', 
                  fontWeight: 600,
                  background: showFunnel 
                    ? 'linear-gradient(180deg, rgba(59,130,246,0.30) 0%, rgba(37,99,235,0.25) 100%)' 
                    : 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 100%)',
                  border: showFunnel ? '1px solid rgba(59,130,246,0.40)' : '1px solid rgba(255,255,255,0.10)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.20), inset 0 1px 0 rgba(255,255,255,0.10)',
                  color: showFunnel ? 'rgba(147,197,253,0.98)' : 'rgba(255,255,255,0.90)'
                }}>
                <BarChart3 className="w-4 h-4" />
                Funnel
              </button>
              {/* EXPORTAR - Solo Admin */}
              {isAdmin && (
                <button 
                  onClick={handleExportExcel} 
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
                  style={{ 
                    fontFamily: "'Exo 2', sans-serif", 
                    fontSize: '13px', 
                    fontWeight: 600,
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 100%)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.20), inset 0 1px 0 rgba(255,255,255,0.10)',
                    color: 'rgba(255,255,255,0.90)'
                  }}>
                  <Download className="w-4 h-4" />
                  Exportar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* FUNNEL CARD - Premium glass con filtro por vendedor */}
        {showFunnel && (
          <div 
            className="flex-shrink-0 mx-4 mb-3 p-4 rounded-2xl relative z-10"
            style={{
              background: 'linear-gradient(135deg, rgba(15,23,42,0.90) 0%, rgba(30,41,59,0.85) 100%)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 16px 48px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.06), inset 0 0 0 1px rgba(255,255,255,0.03)',
              backdropFilter: 'blur(16px)'
            }}
          >
            {/* Header del Funnel con filtro */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white/95" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '16px', fontWeight: 600, letterSpacing: '-0.01em' }}>
                Funnel de Ventas {!isAdmin && <span className="text-blue-400/70 text-sm ml-2">({vendedorActual})</span>}
              </h3>
              {/* Filtro de vendedor - Solo Admin */}
              {isAdmin && (
                <select 
                  value={funnelVendedor} 
                  onChange={(e) => setFunnelVendedor(e.target.value)} 
                  className="px-3 py-1.5 rounded-lg text-white/90 focus:outline-none transition-all duration-150 cursor-pointer text-sm"
                  style={{ 
                    fontFamily: "'Exo 2', sans-serif",
                    background: 'rgba(15,23,42,0.60)',
                    border: '1px solid rgba(255,255,255,0.10)',
                  }}>
                  <option value="">Todos los vendedores</option>
                  {getVendedoresUnicos().map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              )}
            </div>
            {/* Métricas del Funnel - Filtradas según vendedor */}
            {(() => {
              // Filtrar leads según contexto
              const leadsFunnel = isAdmin 
                ? (funnelVendedor ? leads.filter(l => l.vendedor === funnelVendedor) : leads)
                : leads.filter(l => l.vendedor === vendedorActual);
              
              const total = leadsFunnel.filter(l => !l.eliminado).length;
              const cotizados = leadsFunnel.filter(l => !l.eliminado && l.etapaLead === 'Cotizado').length;
              const cerrados = leadsFunnel.filter(l => !l.eliminado && l.etapaLead === 'Cerrado').length;
              const potencial = leadsFunnel.filter(l => !l.eliminado).reduce((sum, l) => sum + calcularPotencialDesdeCotizaciones(l), 0);
              const enRiesgo = leadsFunnel.filter(l => !l.eliminado && getAlertaLead(l).tipo !== null).length;
              
              return (
                <div className="grid grid-cols-5 gap-3">
                  <div className="p-3 rounded-xl" style={{ background: 'rgba(59,130,246,0.10)', border: '1px solid rgba(59,130,246,0.20)' }}>
                    <div className="text-blue-300/80 mb-1" style={{ fontSize: '11px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Total</div>
                    <div className="text-white" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '26px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{total}</div>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: 'rgba(251,191,36,0.10)', border: '1px solid rgba(251,191,36,0.20)' }}>
                    <div className="text-amber-300/80 mb-1" style={{ fontSize: '11px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Cotizados</div>
                    <div className="text-white" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '26px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{cotizados}</div>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.20)' }}>
                    <div className="text-green-300/80 mb-1" style={{ fontSize: '11px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Cerrados</div>
                    <div className="text-white" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '26px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{cerrados}</div>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: 'rgba(20,184,166,0.10)', border: '1px solid rgba(20,184,166,0.20)' }}>
                    <div className="text-teal-300/80 mb-1" style={{ fontSize: '11px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>$ Potencial</div>
                    <div className="text-teal-400" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '17px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>${potencial.toLocaleString('es-MX')}</div>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.20)' }}>
                    <div className="text-red-300/80 mb-1" style={{ fontSize: '11px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>En Riesgo</div>
                    <div className="text-white" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '26px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{enRiesgo}</div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            CONTENEDOR PRINCIPAL - Surface flotante con profundidad máxima
            ═══════════════════════════════════════════════════════════════ */}
        <div 
          className="flex-1 mx-4 mb-4 rounded-2xl overflow-hidden flex flex-col relative z-10"
          style={{
            background: 'linear-gradient(180deg, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.98) 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: `
              0 30px 80px rgba(0,0,0,0.45),
              0 15px 35px rgba(0,0,0,0.30),
              inset 0 1px 0 rgba(255,255,255,0.08),
              inset 0 0 0 1px rgba(255,255,255,0.04)
            `,
            backdropFilter: 'blur(20px)'
          }}
        >
          {/* HEADER TABLA - STICKY con glass blur */}
          <div 
            className="flex-shrink-0 sticky top-0 z-20 backdrop-blur-md"
            style={{
              background: 'rgba(30, 41, 59, 0.85)',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}
          >
            <table className="w-full" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '3%' }} />
                <col style={{ width: '17%' }} />
                <col style={{ width: '9%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '9%' }} />
                <col style={{ width: '9%' }} />
                <col style={{ width: '11%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '9%' }} />
                <col style={{ width: '9%' }} />
              </colgroup>
              <thead><tr>
                <th className="px-2 py-3.5 text-center" style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(180,190,205,0.95)', letterSpacing: '0.06em' }}>#</th>
                <th onClick={() => handleSort('nombreEmpresa')} className="px-3 py-3.5 text-left cursor-pointer hover:text-white transition-colors" style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(180,190,205,0.95)', letterSpacing: '0.06em' }}><div className="flex items-center gap-1"><Building2 className="w-3 h-3" />EMPRESA<SortIcon field="nombreEmpresa" /></div></th>
                <th className="px-3 py-3.5 text-left" style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(180,190,205,0.95)', letterSpacing: '0.06em' }}>ETAPA</th>
                <th className="px-3 py-3.5 text-left" style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(180,190,205,0.95)', letterSpacing: '0.06em' }}>CONTACTO</th>
                <th className="px-3 py-3.5 text-left" style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(180,190,205,0.95)', letterSpacing: '0.06em' }}>SERVICIO</th>
                <th className="px-3 py-3.5 text-left" style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(180,190,205,0.95)', letterSpacing: '0.06em' }}>VIAJE</th>
                <th className="px-3 py-3.5 text-right" style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(180,190,205,0.95)', letterSpacing: '0.06em' }}>$ POTENCIAL</th>
                <th onClick={() => handleSort('vendedor')} className="px-3 py-3.5 text-left cursor-pointer hover:text-white transition-colors" style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(180,190,205,0.95)', letterSpacing: '0.06em' }}><div className="flex items-center gap-1"><User className="w-3 h-3" />VENDEDOR<SortIcon field="vendedor" /></div></th>
                <th onClick={() => handleSort('fechaCaptura')} className="px-3 py-3.5 text-right cursor-pointer hover:text-white transition-colors" style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(180,190,205,0.95)', letterSpacing: '0.06em' }}><div className="flex items-center justify-end gap-1"><Calendar className="w-3 h-3" />CREADO<SortIcon field="fechaCaptura" /></div></th>
                <th className="px-3 py-3.5 text-center" style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(180,190,205,0.95)', letterSpacing: '0.06em' }}>ACCIONES</th>
              </tr></thead>
            </table>
          </div>
          
          {/* BODY TABLA - Con scrollbar estilizado y scrollbar-gutter */}
          <div 
            className="flex-1 overflow-y-auto"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(100,116,139,0.4) transparent',
              scrollbarGutter: 'stable'
            }}
          >
            <style>{`
              .table-scroll::-webkit-scrollbar { width: 6px; }
              .table-scroll::-webkit-scrollbar-track { background: transparent; }
              .table-scroll::-webkit-scrollbar-thumb { background: rgba(100,116,139,0.4); border-radius: 3px; }
              .table-scroll::-webkit-scrollbar-thumb:hover { background: rgba(100,116,139,0.6); }
            `}</style>
            <table className="w-full" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '3%' }} />
                <col style={{ width: '17%' }} />
                <col style={{ width: '9%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '9%' }} />
                <col style={{ width: '9%' }} />
                <col style={{ width: '11%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '9%' }} />
                <col style={{ width: '9%' }} />
              </colgroup>
              <tbody>
              {filteredLeads.length === 0 ? (<tr><td colSpan={10} className="px-6 py-12 text-center text-slate-400">No se encontraron leads.</td></tr>) : (
                filteredLeads.map((lead, index) => {
                  const alerta = getAlertaLead(lead);
                  const potencial = calcularPotencialDesdeCotizaciones(lead);
                  return (
                    <tr 
                      key={lead.id} 
                      className={`transition-all duration-180 ${lead.eliminado ? 'opacity-50' : ''}`}
                      style={{ 
                        height: '52px',
                        background: index % 2 === 0 ? 'rgba(30,41,59,0.20)' : 'transparent',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        borderLeft: '2px solid transparent'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(59,130,246,0.08)';
                        e.currentTarget.style.borderLeftColor = 'rgba(249,115,22,0.7)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = index % 2 === 0 ? 'rgba(30,41,59,0.20)' : 'transparent';
                        e.currentTarget.style.borderLeftColor = 'transparent';
                      }}
                    >
                      {/* # */}
                      <td className="px-2 py-2 text-center" style={{ fontFamily: "'Orbitron', monospace", fontSize: '11px', fontWeight: 600, color: lead.eliminado ? '#ef4444' : alerta.tipo === 'critico' ? '#ef4444' : '#60a5fa', fontVariantNumeric: 'tabular-nums' }}>{index + 1}</td>
                      
                      {/* EMPRESA */}
                      <td className="px-3 py-2"><div className="flex items-center justify-between gap-2"><span className="text-white truncate" style={{ fontSize: '13px', fontWeight: 600 }}>{lead.nombreEmpresa}</span><AlertBadge lead={lead} /></div></td>
                      
                      {/* ETAPA - Pill premium con jerarquía alta */}
                      <td className="px-3 py-2">
                        <span 
                          className="inline-flex items-center justify-center transition-all duration-150 hover:-translate-y-0.5 cursor-default"
                          style={{ 
                            fontSize: '11px', 
                            fontWeight: 700,
                            letterSpacing: '0.3px',
                            minWidth: '100px',
                            height: '28px',
                            padding: '0 12px',
                            borderRadius: '9999px',
                            background: lead.etapaLead === 'Cotizado' 
                              ? 'rgba(251,191,36,0.16)' 
                              : lead.etapaLead === 'Negociacion' 
                                ? 'rgba(168,85,247,0.16)' 
                                : lead.etapaLead === 'Cerrado' 
                                  ? 'rgba(34,197,94,0.16)' 
                                  : lead.etapaLead === 'En Hold'
                                    ? 'rgba(251,191,36,0.12)'
                                    : lead.etapaLead === 'Declinado'
                                      ? 'rgba(239,68,68,0.16)'
                                      : 'rgba(59,130,246,0.14)',
                            border: lead.etapaLead === 'Cotizado' 
                              ? '1px solid rgba(251,191,36,0.40)' 
                              : lead.etapaLead === 'Negociacion' 
                                ? '1px solid rgba(168,85,247,0.40)' 
                                : lead.etapaLead === 'Cerrado' 
                                  ? '1px solid rgba(34,197,94,0.40)' 
                                  : lead.etapaLead === 'En Hold'
                                    ? '1px solid rgba(251,191,36,0.30)'
                                    : lead.etapaLead === 'Declinado'
                                      ? '1px solid rgba(239,68,68,0.40)'
                                      : '1px solid rgba(59,130,246,0.35)',
                            borderLeftWidth: '4px',
                            borderLeftColor: lead.etapaLead === 'Cotizado' 
                              ? '#FBBF24' 
                              : lead.etapaLead === 'Negociacion' 
                                ? '#A855F7' 
                                : lead.etapaLead === 'Cerrado' 
                                  ? '#22C55E' 
                                  : lead.etapaLead === 'En Hold'
                                    ? '#F59E0B'
                                    : lead.etapaLead === 'Declinado'
                                      ? '#EF4444'
                                      : '#3B82F6',
                            color: lead.etapaLead === 'Declinado' ? 'rgba(252,165,165,0.95)' : 'rgba(255,255,255,0.95)',
                            textAlign: 'center',
                            boxShadow: '0 6px 14px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.12)',
                            opacity: lead.etapaLead === 'En Hold' ? 0.75 : 1
                          }}
                        >
                          {lead.etapaLead === 'En Hold' ? `⏸️ Hold` : lead.etapaLead === 'Declinado' ? '❌ Declinado' : (lead.etapaLead || 'Prospecto')}
                        </span>
                        {/* Mostrar días restantes de Hold */}
                        {lead.etapaLead === 'En Hold' && lead.holdInfo?.fechaFin && (
                          <div className="text-amber-400/70 text-[9px] mt-0.5">
                            {Math.ceil((new Date(lead.holdInfo.fechaFin).getTime() - Date.now()) / (1000*60*60*24))}d restantes
                          </div>
                        )}
                      </td>
                      
                      {/* CONTACTO */}
                      <td className="px-3 py-2">
                        <div>
                          <div className="text-white/90 font-medium truncate" style={{ fontSize: '12px' }}>{lead.nombreContacto}</div>
                          <div className="truncate" style={{ fontSize: '11px', color: 'rgba(148,163,184,0.85)' }}>{lead.correoElectronico}</div>
                        </div>
                      </td>
                      
                      {/* SERVICIO - Chips con paleta FRÍA diferenciada */}
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          {(lead.tipoServicio || []).slice(0,2).map((t, i) => {
                            // Paleta fría: Seco=azul/gris, Refrigerado=cian/teal, Hazmat=morado/rojo
                            const isRefrigerado = t.toLowerCase().includes('refrigerado');
                            const isHazmat = t.toLowerCase().includes('hazmat');
                            const isSeco = t.toLowerCase().includes('seco') && !isHazmat;
                            
                            let bg, border, color;
                            if (isRefrigerado && isHazmat) {
                              // Refrigerado Hazmat - rojo/magenta
                              bg = 'rgba(236,72,153,0.14)';
                              border = '1px solid rgba(236,72,153,0.40)';
                              color = 'rgba(251,207,232,0.95)';
                            } else if (isHazmat) {
                              // Seco Hazmat - morado
                              bg = 'rgba(168,85,247,0.14)';
                              border = '1px solid rgba(168,85,247,0.40)';
                              color = 'rgba(233,213,255,0.95)';
                            } else if (isRefrigerado) {
                              // Refrigerado - cian/teal
                              bg = 'rgba(6,182,212,0.14)';
                              border = '1px solid rgba(6,182,212,0.40)';
                              color = 'rgba(207,250,254,0.95)';
                            } else {
                              // Seco - azul/slate frío
                              bg = 'rgba(100,116,139,0.16)';
                              border = '1px solid rgba(148,163,184,0.35)';
                              color = 'rgba(226,232,240,0.92)';
                            }
                            
                            return (
                              <span 
                                key={i}
                                className="transition-all duration-150 hover:-translate-y-0.5"
                                style={{ 
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  height: '24px',
                                  padding: '0 10px',
                                  borderRadius: '9999px',
                                  fontSize: '10px', 
                                  fontWeight: 700,
                                  letterSpacing: '0.2px',
                                  background: bg,
                                  border: border,
                                  color: color,
                                  boxShadow: '0 4px 10px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.10)'
                                }}
                              >{t}</span>
                            );
                          })}
                        </div>
                      </td>
                      
                      {/* VIAJE - Chips con paleta DIRECCIONAL diferenciada */}
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          {(lead.tipoViaje || []).slice(0,2).map((t, i) => {
                            // Paleta direccional: Nacional=verde, Expo=azul, Impo=ámbar, DTD=violeta
                            const lower = t.toLowerCase();
                            
                            let bg, border, color;
                            if (lower === 'nacional') {
                              // Nacional - verde
                              bg = 'rgba(34,197,94,0.14)';
                              border = '1px solid rgba(34,197,94,0.40)';
                              color = 'rgba(187,247,208,0.95)';
                            } else if (lower === 'expo') {
                              // Expo - azul
                              bg = 'rgba(59,130,246,0.14)';
                              border = '1px solid rgba(59,130,246,0.40)';
                              color = 'rgba(191,219,254,0.95)';
                            } else if (lower === 'impo') {
                              // Impo - ámbar
                              bg = 'rgba(245,158,11,0.14)';
                              border = '1px solid rgba(245,158,11,0.40)';
                              color = 'rgba(254,243,199,0.95)';
                            } else if (lower === 'dtd' || lower === 'dedicado') {
                              // DTD/Dedicado - violeta
                              bg = 'rgba(139,92,246,0.14)';
                              border = '1px solid rgba(139,92,246,0.40)';
                              color = 'rgba(221,214,254,0.95)';
                            } else {
                              // Default - slate
                              bg = 'rgba(100,116,139,0.14)';
                              border = '1px solid rgba(148,163,184,0.30)';
                              color = 'rgba(226,232,240,0.90)';
                            }
                            
                            return (
                              <span 
                                key={i}
                                className="transition-all duration-150 hover:-translate-y-0.5"
                                style={{ 
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  height: '24px',
                                  padding: '0 10px',
                                  borderRadius: '9999px',
                                  fontSize: '10px', 
                                  fontWeight: 700,
                                  letterSpacing: '0.2px',
                                  background: bg,
                                  border: border,
                                  color: color,
                                  boxShadow: '0 4px 10px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.10)'
                                }}
                              >{t}</span>
                            );
                          })}
                        </div>
                      </td>
                      
                      {/* $ POTENCIAL - Alineado derecha, tabular-nums */}
                      <td className="px-3 py-2 text-right">
                        {potencial > 0 ? (
                          <span 
                            style={{ 
                              display: 'inline-flex',
                              alignItems: 'center',
                              height: '24px',
                              padding: '0 10px',
                              borderRadius: '6px',
                              fontFamily: "'Exo 2', sans-serif", 
                              fontSize: '11px', 
                              fontWeight: 600, 
                              fontVariantNumeric: 'tabular-nums',
                              background: 'rgba(255,255,255,0.06)',
                              border: '1px solid rgba(255,255,255,0.12)',
                              color: 'rgba(255,255,255,0.92)'
                            }}
                          >
                            ${potencial.toLocaleString('es-MX')}
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', color: 'rgba(100,116,139,0.5)' }}>—</span>
                        )}
                      </td>
                      
                      {/* VENDEDOR */}
                      <td className="px-3 py-2" style={{ fontSize: '11px', color: 'rgba(148,163,184,0.90)' }}>{lead.vendedor}</td>
                      
                      {/* CREADO - Alineado derecha, tabular-nums */}
                      <td className="px-3 py-2 text-right" style={{ fontSize: '11px', fontVariantNumeric: 'tabular-nums', color: 'rgba(203,213,225,0.85)' }}>{formatDate(lead.fechaCaptura)}</td>
                      
                      {/* ACCIONES */}
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* BOTÓN EDITAR - Naranja FX */}
                          <button onClick={() => setEditLead(lead)} disabled={lead.eliminado} title="Editar"
                            className="w-[34px] h-[34px] rounded-[11px] flex items-center justify-center transition-all duration-180 hover:-translate-y-0.5 hover:scale-[1.02] active:translate-y-0 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{ 
                              background: 'linear-gradient(180deg, #fb923c 0%, #f97316 50%, #ea580c 100%)', 
                              boxShadow: '0 8px 18px rgba(249,115,22,0.28), inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -1px 0 rgba(0,0,0,0.18)' 
                            }}>
                            <Pencil className="w-4 h-4 text-white/95" strokeWidth={2.5} />
                          </button>
                          
                          {/* BOTÓN PDF - BLANCO SÓLIDO OS */}
                          <div className="relative">
                            <button onClick={() => setCotizacionesModal(lead)} title="PDF / Cotizaciones"
                              className="w-[34px] h-[34px] rounded-[11px] flex items-center justify-center transition-all duration-180 hover:-translate-y-0.5 hover:scale-[1.02] active:translate-y-0 active:scale-[0.98]"
                              style={{ 
                                background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)', 
                                border: '1px solid rgba(0,0,0,0.08)',
                                boxShadow: '0 8px 18px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.90), inset 0 -1px 0 rgba(0,0,0,0.05)' 
                              }}>
                              {/* Icono PDF rojo */}
                              <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="#dc2626" opacity="0.15"/>
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <polyline points="14 2 14 8 20 8" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <text x="7" y="17" fill="#dc2626" fontSize="5" fontWeight="700" fontFamily="system-ui">PDF</text>
                              </svg>
                            </button>
                            {lead.cotizaciones?.filter(c => !c.eliminado).length ? (
                              <div 
                                className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] rounded-full flex items-center justify-center" 
                                style={{ 
                                  fontSize: '10px', 
                                  fontWeight: 700, 
                                  color: '#ffffff',
                                  background: '#dc2626',
                                  boxShadow: '0 2px 6px rgba(220,38,38,0.4)'
                                }}
                              >
                                {lead.cotizaciones.filter(c => !c.eliminado).length}
                              </div>
                            ) : null}
                          </div>
                          
                          {/* BOTÓN ELIMINAR - Gris oscuro serio */}
                          {lead.eliminado && isAdmin ? (
                            <button onClick={() => handleRestaurarLead(lead)} title="Restaurar"
                              className="w-[34px] h-[34px] rounded-[11px] flex items-center justify-center transition-all duration-180 hover:-translate-y-0.5 hover:scale-[1.02] active:translate-y-0 active:scale-[0.98]"
                              style={{ 
                                background: 'linear-gradient(180deg, #34d399 0%, #10b981 50%, #059669 100%)', 
                                boxShadow: '0 8px 18px rgba(16,185,129,0.28), inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -1px 0 rgba(0,0,0,0.18)' 
                              }}>
                              <TrendingUp className="w-4 h-4 text-white/95" strokeWidth={2.5} />
                            </button>
                          ) : (
                            <button onClick={() => setDeleteModal(lead)} disabled={lead.eliminado} title="Eliminar"
                              className="w-[34px] h-[34px] rounded-[11px] flex items-center justify-center transition-all duration-180 hover:-translate-y-0.5 hover:scale-[1.02] active:translate-y-0 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                              style={{ 
                                background: 'linear-gradient(180deg, #64748b 0%, #475569 50%, #334155 100%)', 
                                boxShadow: '0 8px 18px rgba(51,65,85,0.35), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.20)' 
                              }}>
                              <Trash2 className="w-4 h-4 text-white/90" strokeWidth={2.5} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody></table>
          </div>
          {/* FOOTER TABLA */}
          <div 
            className="flex-shrink-0 px-4 py-3"
            style={{
              background: 'rgba(30, 41, 59, 0.5)',
              borderTop: '1px solid rgba(255,255,255,0.06)'
            }}
          >
            <span className="text-slate-400" style={{ fontSize: '12px', fontFamily: "'Exo 2', sans-serif" }}>
              Mostrando {filteredLeads.length} de {leads.filter(l => !l.eliminado).length} leads
            </span>
          </div>
        </div>
      </div>

      {selectedLead && (<div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedLead(null)}><div className="bg-slate-900 rounded-2xl border border-slate-700/40 w-[95vw] max-w-[1100px] max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}><div className="flex items-center justify-between mb-4"><h3 className="text-white text-xl font-bold flex items-center gap-2"><Building2 className="w-6 h-6 text-blue-400" />{selectedLead.nombreEmpresa}</h3><button onClick={() => setSelectedLead(null)} className="p-2 rounded-lg hover:bg-slate-800 transition-colors"><X className="w-5 h-5 text-white" /></button></div><div className="grid grid-cols-2 gap-4 mb-4"><div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/15"><div className="flex items-center gap-2 text-blue-400/70 text-xs mb-1"><Calendar className="w-3 h-3" />Creacion</div><div className="text-white font-semibold">{formatDateTime(selectedLead.fechaCaptura)}</div></div><div className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/15"><div className="flex items-center gap-2 text-orange-400/70 text-xs mb-1"><Clock className="w-3 h-3" />Ultima Modificacion</div><div className="text-white font-semibold">{formatDateTime(selectedLead.fechaActualizacion) || formatDateTime(selectedLead.fechaCaptura)}</div></div></div><div className="grid grid-cols-3 gap-4 text-sm mb-4"><div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/25"><div className="text-blue-400/70 text-xs mb-1">Contacto</div><div className="text-white font-semibold">{selectedLead.nombreContacto}</div><div className="text-slate-400">{selectedLead.correoElectronico}</div></div><div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/25"><div className="text-blue-400/70 text-xs mb-1">Servicio</div><div className="flex flex-wrap gap-1">{(selectedLead.tipoServicio||[]).map((t,i)=><span key={i} className="px-2 py-0.5 rounded bg-slate-700/40 text-slate-300 text-xs border border-slate-600/25">{t}</span>)}</div></div><div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/25"><div className="text-blue-400/70 text-xs mb-1">Viaje</div><div className="flex flex-wrap gap-1">{(selectedLead.tipoViaje||[]).map((t,i)=><span key={i} className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 text-xs border border-blue-500/20">{t}</span>)}</div></div><div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/25 col-span-2"><div className="text-blue-400/70 text-xs mb-1">Rutas</div><div className="text-white text-sm">{selectedLead.principalesRutas || '-'}</div></div><div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/25"><div className="text-blue-400/70 text-xs mb-1">Viajes/Mes</div><div className="text-white font-bold text-lg">{selectedLead.viajesPorMes || '-'}</div></div></div>{(() => { const pot = calcularPotencialDesdeCotizaciones(selectedLead); return pot > 0 ? <div className="p-4 rounded-lg bg-teal-500/5 border border-teal-500/15 mb-4"><div className="text-teal-400/70 text-xs mb-1">$ Potencial Mensual</div><div className="text-teal-400 font-bold text-3xl">${pot.toLocaleString('es-MX')} MXN</div></div> : null; })()}<div className="flex justify-between items-center text-sm text-slate-500"><span>Vendedor: {selectedLead.vendedor}</span><span>Etapa: {selectedLead.etapaLead || 'Prospecto'}</span></div></div></div>)}

      {deleteModal && (<div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => { setDeleteModal(null); setDeleteConfirmText(''); }}><div className="bg-slate-900 rounded-2xl border border-red-500/25 w-[400px] p-6" onClick={(e) => e.stopPropagation()}><div className="flex items-center gap-3 mb-4"><AlertTriangle className="w-8 h-8 text-red-400" /><h3 className="text-white text-lg font-bold">Eliminar Lead</h3></div><p className="text-white mb-2">Eliminar <strong>{deleteModal.nombreEmpresa}</strong>?</p><p className="text-slate-400 text-sm mb-4">Escribe DELETE:</p><input type="text" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())} className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-red-500/25 text-white text-center mb-4 focus:outline-none focus:border-red-500/40" /><div className="flex gap-3"><button onClick={() => { setDeleteModal(null); setDeleteConfirmText(''); }} className="flex-1 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors">Cancelar</button><button onClick={handleConfirmarEliminacion} disabled={deleteConfirmText !== 'DELETE'} className={`flex-1 px-4 py-2 rounded-lg transition-colors ${deleteConfirmText === 'DELETE' ? 'bg-red-500/80 hover:bg-red-500 text-white' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}>Eliminar</button></div></div></div>)}

      {cotizacionesModal && (<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setCotizacionesModal(null)}><div className="bg-slate-900 rounded-2xl border border-slate-700/40 w-[900px] max-h-[85vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}><div className="flex items-center justify-between mb-4"><h3 className="text-white text-xl font-bold flex items-center gap-2"><FileText className="w-5 h-5 text-blue-400" />Cotizaciones - {cotizacionesModal.nombreEmpresa}</h3><button onClick={() => setCotizacionesModal(null)} className="p-2 rounded-lg hover:bg-slate-800 transition-colors"><X className="w-5 h-5 text-white" /></button></div><div className="mb-4"><label className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl ${analizando ? 'bg-blue-600/40' : 'bg-blue-600/80 hover:bg-blue-600'} text-white cursor-pointer transition-colors`}>{analizando ? <><Loader2 className="w-5 h-5 animate-spin" /><span>{statusMsg}</span></> : <><Upload className="w-5 h-5" /><span className="font-semibold">Subir Cotizacion (PDF)</span></>}<input type="file" accept="application/pdf" className="hidden" disabled={analizando} onChange={(e) => { if (e.target.files?.length) handleSubirCotizaciones(e.target.files, cotizacionesModal); e.target.value = ''; }} /></label></div><div className="space-y-3">{(!cotizacionesModal.cotizaciones || !cotizacionesModal.cotizaciones.filter(c => !c.eliminado).length) ? (<div className="text-center py-6 text-slate-500">No hay cotizaciones.</div>) : (cotizacionesModal.cotizaciones.filter(c => !c.eliminado).map((cot, i) => (<div key={i} className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/25"><div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><FileText className="w-4 h-4 text-blue-400" /><span className="text-white font-semibold">{cot.nombre}</span><span className="text-slate-600 text-xs">{formatDate(cot.fecha)}</span></div><div className="flex gap-2">{cot.url && <button onClick={() => setPdfPreview(cot.url)} className="px-2 py-1 rounded bg-slate-700/40 hover:bg-blue-500/10 text-slate-400 hover:text-blue-400 text-xs flex items-center gap-1 transition-colors border border-slate-600/25"><Eye className="w-3 h-3" />Ver</button>}{cot.url && <a href={cot.url} download={cot.nombre} className="px-2 py-1 rounded bg-slate-700/40 hover:bg-blue-500/10 text-slate-400 hover:text-blue-400 text-xs flex items-center gap-1 transition-colors border border-slate-600/25"><Download className="w-3 h-3" /></a>}<button onClick={() => handleEliminarCotizacion(cotizacionesModal, cotizacionesModal.cotizaciones?.indexOf(cot) || i)} className="px-2 py-1 rounded bg-slate-700/40 hover:bg-red-500/10 text-slate-400 hover:text-red-400 text-xs transition-colors border border-slate-600/25"><Trash2 className="w-3 h-3" /></button></div></div>{cot.lineas && cot.lineas.length > 0 && (<div className="mt-3 p-3 rounded bg-teal-500/5 border border-teal-500/15"><div className="flex items-center gap-1 mb-2"><CheckCircle className="w-3 h-3 text-teal-400" /><span className="text-teal-400/70 text-xs font-semibold">Lineas Cotizadas</span></div><div className="space-y-2">{cot.lineas.map((linea, idx) => (<div key={idx} className="flex justify-between items-center text-xs p-2 rounded bg-slate-900/40"><div className="flex-1 flex items-center gap-2"><MapPin className="w-3 h-3 text-slate-600" /><span className="text-white">{linea.origen}</span><ArrowRight className="w-3 h-3 text-slate-600" /><span className="text-white">{linea.destino}</span><span className={`ml-2 px-1.5 py-0.5 rounded border ${getTipoViajeColor(linea.tipoViaje)}`}>{linea.tipoViaje}</span></div><div className="text-slate-400">{linea.viajes} x ${linea.tarifa.toLocaleString('es-MX')} {linea.moneda}</div><div className="text-teal-400 font-semibold ml-4">${linea.subtotalMXN.toLocaleString('es-MX')}</div></div>))}</div><div className="mt-3 pt-3 border-t border-teal-500/15 flex justify-between items-center"><span className="text-teal-400/70 font-semibold">TOTAL:</span><span className="text-teal-400 font-bold text-xl">${cot.potencialMXN?.toLocaleString('es-MX')}</span></div></div>)}</div>)))}</div><button onClick={() => setCotizacionesModal(null)} className="mt-4 w-full px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors">Cerrar</button></div></div>)}

      {lineasModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-slate-900 rounded-2xl border border-blue-500/25 w-[850px] max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-bold flex items-center gap-2"><DollarSign className="w-5 h-5 text-blue-400" />Capturar Viajes por Ruta</h3>
              <button onClick={() => { setLineasModal(null); setLineasCotizacion([]); }} className="p-2 rounded-lg hover:bg-slate-800 transition-colors"><X className="w-5 h-5 text-white" /></button>
            </div>
            
            {/* Instrucciones y contador de rutas */}
            <div className="mb-4 p-3 rounded-lg bg-blue-500/5 border border-blue-500/15">
              <p className="text-blue-400/70 text-sm mb-2">Captura los <strong>viajes potenciales por mes</strong> para cada ruta. Si el cliente no acepta una ruta, puedes <strong>omitirla</strong>.</p>
              <div className="flex gap-4 text-xs">
                <span className="text-green-400">✓ {contarRutas().activas} rutas activas</span>
                {contarRutas().omitidas > 0 && <span className="text-slate-500">⊘ {contarRutas().omitidas} omitidas</span>}
                <span className="text-slate-400">Total: {contarRutas().total}</span>
              </div>
            </div>
            
            <div className="space-y-3 mb-4">
              {lineasCotizacion.map((linea, idx) => (
                <div 
                  key={idx} 
                  className={`p-4 rounded-xl border transition-all ${
                    linea.omitida 
                      ? 'bg-slate-800/20 border-slate-700/15 opacity-50' 
                      : 'bg-slate-800/40 border-slate-700/25'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className={`w-4 h-4 ${linea.omitida ? 'text-slate-600' : 'text-blue-400'}`} />
                      <span className={`font-semibold ${linea.omitida ? 'text-slate-500 line-through' : 'text-white'}`}>
                        {linea.origen || 'Sin origen'}
                      </span>
                      <span className="text-slate-600">→</span>
                      <span className={`font-semibold ${linea.omitida ? 'text-slate-500 line-through' : 'text-white'}`}>
                        {linea.destino || 'Sin destino'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold border ${linea.omitida ? 'bg-slate-800/30 text-slate-600 border-slate-700/20' : getTipoViajeColor(linea.tipoViaje)}`}>
                        {linea.tipoViaje}
                      </span>
                      {/* Botón Omitir/Incluir */}
                      <button
                        onClick={() => handleToggleOmitirRuta(idx)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                          linea.omitida
                            ? 'bg-green-500/15 text-green-400 hover:bg-green-500/25 border border-green-500/30'
                            : 'bg-red-500/10 text-red-400/80 hover:bg-red-500/20 border border-red-500/20'
                        }`}
                      >
                        {linea.omitida ? '+ Incluir' : '⊘ Omitir'}
                      </button>
                    </div>
                  </div>
                  
                  {!linea.omitida && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-slate-400"><Truck className="w-4 h-4 inline mr-1" />{linea.servicio}</span>
                        <span className="text-blue-400 font-bold">${linea.tarifa?.toLocaleString('es-MX')} {linea.moneda}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-slate-400 text-sm">Viajes/mes:</label>
                        <input 
                          type="number" 
                          min="0" 
                          value={linea.viajes || ''} 
                          onChange={(e) => handleCambioLinea(idx, 'viajes', parseInt(e.target.value) || 0)} 
                          placeholder="0" 
                          style={{ MozAppearance: 'textfield' }} 
                          className={`w-20 px-3 py-2 rounded-lg text-center font-bold text-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${linea.viajes > 0 ? 'bg-blue-500/10 border-blue-500/40 text-blue-300' : 'bg-red-500/8 border-red-500/30 text-white'} border-2 focus:outline-none transition-colors`} 
                        />
                      </div>
                    </div>
                  )}
                  
                  {linea.omitida && (
                    <div className="text-center text-slate-500 text-sm py-2">
                      Esta ruta no será incluida en la cotización
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Total - Solo rutas activas */}
            <div className="p-4 rounded-xl bg-teal-500/5 border border-teal-500/15 mb-4">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-teal-400/70 font-semibold text-lg">POTENCIAL MENSUAL:</span>
                  <span className="text-teal-400/50 text-sm ml-2">({contarRutas().activas} rutas)</span>
                </div>
                <span className="text-teal-400 font-bold text-3xl" style={{ fontFamily: "'Orbitron', monospace" }}>${calcularTotalMXN().toLocaleString('es-MX')} MXN</span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button onClick={() => { setLineasModal(null); setLineasCotizacion([]); }} className="flex-1 px-4 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-semibold transition-colors">Cancelar</button>
              <button 
                onClick={handleGuardarCotizacion} 
                disabled={!todosViajesCapturados()} 
                className={`flex-1 px-4 py-3 rounded-lg font-bold text-lg transition-colors ${todosViajesCapturados() ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
              >
                {todosViajesCapturados() ? `✓ Guardar (${contarRutas().activas} rutas)` : 'Captura viajes en rutas activas'}
              </button>
            </div>
          </div>
        </div>
      )}

      {pdfPreview && (<div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={() => setPdfPreview(null)}><div className="bg-white rounded-2xl w-[90vw] h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}><div className="flex items-center justify-between p-3 bg-slate-100 border-b"><span className="text-slate-700 font-semibold">Vista previa</span><button onClick={() => setPdfPreview(null)} className="p-2 rounded-lg hover:bg-slate-200 transition-colors"><X className="w-5 h-5 text-slate-600" /></button></div><iframe src={pdfPreview} className="flex-1 w-full" title="PDF" /></div></div>)}

      {editLead && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setEditLead(null)}>
          <div className="bg-slate-900 rounded-2xl border border-slate-700/50 w-[700px] max-h-[80vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-xl font-bold flex items-center gap-2">
                <Pencil className="w-5 h-5 text-blue-400" />Editar - {editLead.nombreEmpresa}
              </h3>
              <button onClick={() => setEditLead(null)} className="p-2 rounded-lg hover:bg-slate-800 transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <label className="text-slate-400 text-xs">Empresa</label>
                <input type="text" value={formData.nombreEmpresa || ''} onChange={(e) => setFormData({ ...formData, nombreEmpresa: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700/50 text-white focus:outline-none focus:border-blue-500/50 transition-colors" />
              </div>
              <div>
                <label className="text-slate-400 text-xs">Web</label>
                <input type="text" value={formData.paginaWeb || ''} onChange={(e) => setFormData({ ...formData, paginaWeb: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700/50 text-white focus:outline-none focus:border-blue-500/50 transition-colors" />
              </div>
              <div>
                <label className="text-slate-400 text-xs">Contacto</label>
                <input type="text" value={formData.nombreContacto || ''} onChange={(e) => handleInputChange('nombreContacto', e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700/50 text-white focus:outline-none focus:border-blue-500/50 transition-colors" />
              </div>
              <div>
                <label className="text-slate-400 text-xs">Email</label>
                <input type="email" value={formData.correoElectronico || ''} onChange={(e) => handleInputChange('correoElectronico', e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700/50 text-white focus:outline-none focus:border-blue-500/50 transition-colors" />
              </div>
              <div className="col-span-2">
                <label className="text-slate-400 text-xs">Servicio</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {['Seco', 'Refrigerado', 'Seco Hazmat', 'Refrigerado Hazmat'].map(s => (
                    <button key={s} onClick={() => handleToggleServicio(s)} className={`px-3 py-1 rounded text-xs transition-all ${formData.tipoServicio?.includes(s) ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' : 'bg-slate-800 border border-slate-700/50 text-slate-400 hover:text-slate-300'}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div className="col-span-2">
                <label className="text-slate-400 text-xs">Viaje</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {['Impo', 'Expo', 'Nacional', 'DTD', 'Dedicado'].map(v => (
                    <button key={v} onClick={() => handleToggleViaje(v)} className={`px-3 py-1 rounded text-xs transition-all ${formData.tipoViaje?.includes(v) ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' : 'bg-slate-800 border border-slate-700/50 text-slate-400 hover:text-slate-300'}`}>{v}</button>
                  ))}
                </div>
              </div>
              <div className="col-span-2">
                <label className="text-slate-400 text-xs">Rutas</label>
                <input type="text" value={formData.principalesRutas || ''} onChange={(e) => setFormData({ ...formData, principalesRutas: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700/50 text-white focus:outline-none focus:border-blue-500/50 transition-colors" />
              </div>
              <div>
                <label className="text-slate-400 text-xs">Viajes/Mes</label>
                <input type="number" value={formData.viajesPorMes || ''} onChange={(e) => setFormData({ ...formData, viajesPorMes: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700/50 text-white focus:outline-none focus:border-blue-500/50 transition-colors" />
              </div>
              <div>
                <label className="text-slate-400 text-xs">Etapa</label>
                <select 
                  value={formData.etapaLead || 'Prospecto'} 
                  onChange={(e) => {
                    const nuevaEtapa = e.target.value;
                    
                    // Lógica especial para "En Hold"
                    if (nuevaEtapa === 'En Hold') {
                      const holdActual = formData.holdInfo || editLead?.holdInfo;
                      const contadorHold = (holdActual?.contador || 0) + 1;
                      
                      if (contadorHold > 3) {
                        alert('⚠️ Este lead ya fue puesto en Hold 3 veces.\n\nNo se puede poner en Hold nuevamente. El lead quedará libre.');
                        // Liberar lead (quitar vendedor)
                        setFormData({ 
                          ...formData, 
                          etapaLead: 'Prospecto',
                          vendedor: '',
                          fechaLiberacion: new Date().toISOString()
                        });
                        return;
                      }
                      
                      const fechaInicio = new Date();
                      const fechaFin = new Date(fechaInicio.getTime() + (30 * 24 * 60 * 60 * 1000)); // +30 días
                      
                      setFormData({ 
                        ...formData, 
                        etapaLead: 'En Hold',
                        holdInfo: {
                          fechaInicio: fechaInicio.toISOString(),
                          fechaFin: fechaFin.toISOString(),
                          contador: contadorHold
                        }
                      });
                      
                      alert(`📋 Lead puesto En Hold (${contadorHold}/3)\n\nSe reactivará automáticamente el ${fechaFin.toLocaleDateString('es-MX')}`);
                      return;
                    }
                    
                    // Lógica especial para "Declinado"
                    if (nuevaEtapa === 'Declinado') {
                      if (!confirm('⚠️ ¿Marcar como DECLINADO?\n\nEl lead será removido del panel pero quedará en el archivo histórico para el Admin.')) {
                        return;
                      }
                      setFormData({ 
                        ...formData, 
                        etapaLead: 'Declinado',
                        declinado: true,
                        fechaDeclinado: new Date().toISOString()
                      });
                      return;
                    }
                    
                    setFormData({ ...formData, etapaLead: nuevaEtapa });
                  }} 
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700/50 text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                >
                  <option value="Prospecto">Prospecto</option>
                  <option value="Cotizado">Cotizado</option>
                  <option value="Negociacion">Negociación</option>
                  <option value="Cerrado">Cerrado</option>
                  <option value="En Hold" style={{ color: '#FBBF24' }}>⏸️ En Hold (30 días)</option>
                  <option value="Declinado" style={{ color: '#EF4444' }}>❌ Declinado</option>
                </select>
                {/* Mostrar info de Hold si está activo */}
                {formData.etapaLead === 'En Hold' && formData.holdInfo && (
                  <div className="mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs">
                    <div className="text-amber-400">⏸️ En Hold ({formData.holdInfo.contador}/3 usos)</div>
                    <div className="text-amber-300/70">Se reactiva: {new Date(formData.holdInfo.fechaFin).toLocaleDateString('es-MX')}</div>
                  </div>
                )}
              </div>
              <div className="col-span-2">
                <label className="text-slate-400 text-xs">Proximos Pasos</label>
                <input type="text" value={formData.proximosPasos || ''} onChange={(e) => setFormData({ ...formData, proximosPasos: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700/50 text-white focus:outline-none focus:border-blue-500/50 transition-colors" />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setEditLead(null)} className="flex-1 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors">Cancelar</button>
              <button onClick={handleGuardarEdicion} className="flex-1 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-colors">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </ModuleTemplate>
  );
};
