// ═══════════════════════════════════════════════════════════════════════════
// PROSPECCIÓN IA MODULE v4 - Rediseño con filtros de Apollo
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useRef } from 'react';
import { 
  Search, Loader2, Building2, Mail, MapPin, Sparkles, 
  RefreshCw, ChevronDown, ChevronUp, Send, Bot, Trash2,
  Target, Users, AlertCircle, Check, X, Crown, 
  Database, Plus, ArrowRight, Save, Zap, Briefcase, Filter
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fbxbsslhewchyibdoyzk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieGJzc2xoZXdjaHlpYmRveXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzczODEsImV4cCI6MjA3ODExMzM4MX0.Z8JPlg7hhKbA624QGHp2bKKTNtCD3WInQMO5twjl6a0'
);

const SUPABASE_URL = 'https://fbxbsslhewchyibdoyzk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieGJzc2xoZXdjaHlpYmRveXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzczODEsImV4cCI6MjA3ODExMzM4MX0.Z8JPlg7hhKbA624QGHp2bKKTNtCD3WInQMO5twjl6a0';

const CONTACTOS_POR_PAGINA = 50;

// ═══════════════════════════════════════════════════════════════════════════
// PUESTOS ORGANIZADOS POR ÁREA (basado en Apollo)
// ═══════════════════════════════════════════════════════════════════════════
const PUESTOS_POR_AREA = {
  direccion: {
    nombre: '👑 Dirección / C-Level',
    puestos: ['CEO', 'President', 'Owner', 'Founder', 'Chairman', 'Director General', 'Managing Director', 'COO', 'CFO', 'CTO', 'CMO']
  },
  operaciones: {
    nombre: '⚙️ Operaciones / Planta',
    puestos: ['VP Operations', 'Operations Director', 'Operations Manager', 'Plant Manager', 'Plant Director', 'Production Manager', 'Production Director', 'Manufacturing Director', 'Manufacturing Manager', 'Gerente de Operaciones', 'Gerente de Planta', 'Gerente de Producción', 'Director de Operaciones', 'Director de Manufactura', 'Jefe de Producción', 'Supervisor de Producción', 'Quality Manager', 'Quality Director', 'Gerente de Calidad']
  },
  supplychain: {
    nombre: '📦 Supply Chain / Logística',
    puestos: ['VP Supply Chain', 'VP Logistics', 'Supply Chain Director', 'Supply Chain Manager', 'Logistics Director', 'Logistics Manager', 'Distribution Director', 'Distribution Manager', 'Warehouse Director', 'Warehouse Manager', 'Transportation Manager', 'Fleet Manager', 'Inventory Manager', 'Materials Manager', 'Director de Cadena de Suministro', 'Gerente de Logística', 'Gerente de Distribución', 'Gerente de Almacén', 'Gerente de Inventarios', 'Gerente de Materiales', 'Jefe de Logística', 'Jefe de Almacén', 'Coordinador de Logística', 'Planeador de Demanda', 'Demand Planner', 'S&OP Manager']
  },
  compras: {
    nombre: '🛒 Compras / Procurement',
    puestos: ['VP Procurement', 'Procurement Director', 'Procurement Manager', 'Purchasing Director', 'Purchasing Manager', 'Sourcing Director', 'Sourcing Manager', 'Strategic Sourcing Manager', 'Buyer', 'Senior Buyer', 'Category Manager', 'Director de Compras', 'Gerente de Compras', 'Gerente de Abastecimiento', 'Jefe de Compras', 'Comprador Senior']
  },
  comercial: {
    nombre: '💼 Comercial / Ventas',
    puestos: ['VP Sales', 'VP Commercial', 'Sales Director', 'Commercial Director', 'Business Development Director', 'Business Development Manager', 'Key Account Manager', 'Director Comercial', 'Gerente Comercial', 'Gerente de Ventas', 'Gerente de Cuentas Clave']
  },
  finanzas: {
    nombre: '💰 Finanzas / Administración',
    puestos: ['VP Finance', 'Finance Director', 'Finance Manager', 'Controller', 'Director de Finanzas', 'Gerente de Finanzas', 'Contralor', 'Director Administrativo', 'Gerente Administrativo']
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// INDUSTRIAS DE APOLLO (las que SÍ interesan)
// ═══════════════════════════════════════════════════════════════════════════
const INDUSTRIAS_APOLLO = {
  automotive: { nombre: '🚗 Automotriz', keywords: ['automotive', 'auto parts', 'automobile'] },
  aerospace: { nombre: '✈️ Aeroespacial', keywords: ['aerospace', 'aviation', 'defense'] },
  manufacturing: { nombre: '🏭 Manufactura', keywords: ['manufacturing', 'industrial', 'machinery'] },
  food: { nombre: '🍔 Alimentos y Bebidas', keywords: ['food', 'beverages', 'food production'] },
  agriculture: { nombre: '🌾 Agroindustrial', keywords: ['agriculture', 'farming', 'agroindustrial'] },
  mining: { nombre: '⛏️ Minería y Metales', keywords: ['mining', 'metals', 'steel'] },
  pharmaceutical: { nombre: '💊 Farmacéutica', keywords: ['pharmaceutical', 'medical devices', 'healthcare'] },
  retail: { nombre: '🛒 Retail / Comercio', keywords: ['retail', 'consumer goods', 'supermarket'] },
  chemicals: { nombre: '🧪 Químicos', keywords: ['chemicals', 'plastics', 'petrochemicals'] },
  construction: { nombre: '🏗️ Construcción', keywords: ['construction', 'building materials', 'cement'] },
  textiles: { nombre: '👕 Textiles', keywords: ['textiles', 'apparel', 'fashion'] },
  electronics: { nombre: '📱 Electrónica', keywords: ['electronics', 'semiconductors', 'electrical'] },
  energy: { nombre: '⚡ Energía', keywords: ['energy', 'oil', 'gas', 'renewables'] },
  packaging: { nombre: '📦 Empaque', keywords: ['packaging', 'containers', 'paper'] }
};

// Industrias a EXCLUIR por defecto
const INDUSTRIAS_EXCLUIR_DEFAULT = [
  'logistics', 'transportation', 'trucking', 'freight', 'shipping', 'courier',
  '3pl', 'warehousing', 'forwarding', 'customs broker',
  'banking', 'financial services', 'insurance', 'investment',
  'government', 'public sector', 'education', 'universities',
  'legal', 'law firm', 'consulting', 'staffing', 'recruiting',
  'real estate', 'hospitality', 'hotels', 'restaurants'
];

// ═══════════════════════════════════════════════════════════════════════════
// ZONAS DE MÉXICO (compacto)
// ═══════════════════════════════════════════════════════════════════════════
const ZONAS_MEXICO = {
  norte: { nombre: 'Norte', estados: ['Baja California', 'Baja California Sur', 'Chihuahua', 'Coahuila', 'Durango', 'Nuevo León', 'Sinaloa', 'Sonora', 'Tamaulipas'] },
  bajio: { nombre: 'Bajío', estados: ['Aguascalientes', 'Guanajuato', 'Querétaro', 'San Luis Potosí', 'Zacatecas'] },
  centro: { nombre: 'Centro', estados: ['Ciudad de México', 'Estado de México', 'Hidalgo', 'Morelos', 'Puebla', 'Tlaxcala'] },
  occidente: { nombre: 'Occidente', estados: ['Colima', 'Jalisco', 'Michoacán', 'Nayarit'] },
  sur: { nombre: 'Sur', estados: ['Chiapas', 'Guerrero', 'Oaxaca', 'Tabasco', 'Veracruz'] },
  sureste: { nombre: 'Sureste', estados: ['Campeche', 'Quintana Roo', 'Yucatán'] }
};

const TODOS_LOS_ESTADOS = Object.values(ZONAS_MEXICO).flatMap(z => z.estados).sort();

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════
interface Contacto {
  id: string;
  source_id?: string;
  nombre: string;
  apellido: string;
  email: string;
  emailVerificado: boolean;
  emailScore: number;
  empresa: string;
  industria: string;
  puesto: string;
  ciudad: string;
  estado: string;
  pais: string;
  linkedin?: string;
  telefono?: string;
  fuente: 'apollo' | 'hunter';
  prioridad: 'A' | 'B' | 'C' | null;
  excluido: boolean;
  esNuevo?: boolean;
  yaExistia?: boolean;
}

interface MensajeChat {
  role: 'user' | 'assistant';
  content: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════
interface Props {
  onBack: () => void;
}

export const ProspeccionIAModule = ({ onBack }: Props) => {
  // Estados UI
  const [paso, setPaso] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros
  const [fuenteSeleccionada, setFuenteSeleccionada] = useState<'apollo' | 'hunter' | 'ambos' | null>('apollo');
  const [estadosSeleccionados, setEstadosSeleccionados] = useState<string[]>([]);
  const [puestosSeleccionados, setPuestosSeleccionados] = useState<string[]>([
    // Por defecto: Dirección, Operaciones y Supply Chain
    ...PUESTOS_POR_AREA.direccion.puestos,
    ...PUESTOS_POR_AREA.operaciones.puestos,
    ...PUESTOS_POR_AREA.supplychain.puestos
  ]);
  const [industriasSeleccionadas, setIndustriasSeleccionadas] = useState<string[]>(Object.keys(INDUSTRIAS_APOLLO));
  const [buscarEmpresa, setBuscarEmpresa] = useState('');
  const [excluirLogisticas, setExcluirLogisticas] = useState(true);
  
  // UI expandibles
  const [mostrarUbicacion, setMostrarUbicacion] = useState(false);
  const [mostrarIndustrias, setMostrarIndustrias] = useState(false);
  const [areasExpandidas, setAreasExpandidas] = useState<string[]>(['direccion', 'operaciones', 'supplychain']);
  
  // Contactos y paginación
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [paginacion, setPaginacion] = useState({ total: 0, totalPages: 0, currentPage: 0, loaded: 0 });
  const [stats, setStats] = useState({ nuevos: 0, existentes: 0, total: 0 });
  const [guardando, setGuardando] = useState(false);
  
  // Chat
  const [chatMessages, setChatMessages] = useState<MensajeChat[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  // ═══════════════════════════════════════════════════════════════════════════
  // BÚSQUEDA APOLLO
  // ═══════════════════════════════════════════════════════════════════════════
  
  const buscarApollo = async (page: number = 1, perPage: number = CONTACTOS_POR_PAGINA) => {
    const ubicaciones = estadosSeleccionados.length > 0 
      ? estadosSeleccionados.map(e => `${e}, Mexico`)
      : ['Mexico'];

    // Keywords de industrias seleccionadas
    const keywords = industriasSeleccionadas.flatMap(k => INDUSTRIAS_APOLLO[k]?.keywords || []);

    const response = await fetch(`${SUPABASE_URL}/functions/v1/prospeccion-api`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        action: 'apollo_search',
        params: {
          locations: ubicaciones,
          titles: puestosSeleccionados.slice(0, 15),
          company_name: buscarEmpresa.trim() || undefined,
          keywords: keywords.length > 0 ? keywords.slice(0, 15) : undefined,
          page,
          per_page: perPage
        }
      })
    });

    if (!response.ok) throw new Error((await response.json()).error || 'Error en Apollo');

    const data = await response.json();
    
    let contacts = (data.contacts || []).map((c: any) => ({
      ...c,
      source_id: c.id,
      prioridad: null,
      excluido: false
    }));

    // Filtrar industrias excluidas si está activo
    if (excluirLogisticas) {
      contacts = contacts.filter((c: Contacto) => {
        const industria = (c.industria || '').toLowerCase();
        const empresa = (c.empresa || '').toLowerCase();
        return !INDUSTRIAS_EXCLUIR_DEFAULT.some(exc => 
          industria.includes(exc) || empresa.includes(exc)
        );
      });
    }

    return { contacts, total: data.total || 0, totalPages: data.total_pages || 0 };
  };

  // Verificar existentes en BD
  const verificarExistentes = async (contactosNuevos: Contacto[]) => {
    const sourceIds = contactosNuevos.map(c => c.source_id || c.id);
    const { data: existentes } = await supabase
      .from('prospeccion_contactos')
      .select('source_id')
      .in('source_id', sourceIds);
    
    const existentesSet = new Set((existentes || []).map(e => e.source_id));
    
    return contactosNuevos.map(c => ({
      ...c,
      yaExistia: existentesSet.has(c.source_id || c.id),
      esNuevo: !existentesSet.has(c.source_id || c.id)
    }));
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════
  
  const handleBuscarContactos = async () => {
    if (puestosSeleccionados.length === 0) {
      setError('Selecciona al menos un puesto');
      return;
    }

    setLoading(true);
    setError(null);
    setContactos([]);
    
    try {
      const { contacts, total, totalPages } = await buscarApollo(1, CONTACTOS_POR_PAGINA);
      const contactosConStatus = await verificarExistentes(contacts);
      
      const nuevos = contactosConStatus.filter(c => c.esNuevo).length;
      
      setContactos(contactosConStatus);
      setPaginacion({ total, totalPages, currentPage: 1, loaded: contactosConStatus.length });
      setStats({ nuevos, existentes: contactosConStatus.length - nuevos, total });
      setPaso(2);
      
      setChatMessages([{
        role: 'assistant',
        content: `✅ **${contactosConStatus.length} de ${total.toLocaleString()} contactos**\n\n🆕 Nuevos: ${nuevos}\n📁 Guardados: ${contactosConStatus.length - nuevos}\n📄 Total disponible: ${total.toLocaleString()}\n\n¿Qué deseas hacer?`
      }]);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCargarMas = async () => {
    if (loadingMore || paginacion.currentPage >= paginacion.totalPages) return;
    setLoadingMore(true);
    
    try {
      const nextPage = paginacion.currentPage + 1;
      const { contacts } = await buscarApollo(nextPage, CONTACTOS_POR_PAGINA);
      const contactosConStatus = await verificarExistentes(contacts);
      
      setContactos(prev => [...prev, ...contactosConStatus]);
      setPaginacion(prev => ({ ...prev, currentPage: nextPage, loaded: prev.loaded + contactosConStatus.length }));
      
      const nuevos = contactosConStatus.filter(c => c.esNuevo).length;
      setStats(prev => ({ ...prev, nuevos: prev.nuevos + nuevos, existentes: prev.existentes + (contactosConStatus.length - nuevos) }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleTraerTodos = async () => {
    if (loadingMore) return;
    if (!window.confirm(`¿Cargar los ${paginacion.total.toLocaleString()} contactos?`)) return;
    
    setLoadingMore(true);
    try {
      let todos = [...contactos];
      let currentPage = paginacion.currentPage;
      
      while (currentPage < paginacion.totalPages) {
        currentPage++;
        const { contacts } = await buscarApollo(currentPage, CONTACTOS_POR_PAGINA);
        const conStatus = await verificarExistentes(contacts);
        todos = [...todos, ...conStatus];
        setPaginacion(prev => ({ ...prev, currentPage, loaded: todos.length }));
        await new Promise(r => setTimeout(r, 300));
      }
      
      setContactos(todos);
      const nuevos = todos.filter(c => c.esNuevo).length;
      setStats({ nuevos, existentes: todos.length - nuevos, total: paginacion.total });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleGuardarTodos = async () => {
    setGuardando(true);
    try {
      const nuevos = contactos.filter(c => c.esNuevo && !c.excluido);
      if (nuevos.length === 0) { alert('No hay nuevos'); setGuardando(false); return; }
      
      const datos = nuevos.map(c => ({
        source_id: c.source_id || c.id,
        fuente: c.fuente,
        nombre: c.nombre,
        apellido: c.apellido,
        email: c.email === 'email_not_unlocked@domain.com' ? null : c.email,
        email_verificado: c.emailVerificado,
        email_score: c.emailScore,
        telefono: c.telefono,
        linkedin: c.linkedin,
        empresa: c.empresa,
        industria: c.industria,
        puesto: c.puesto,
        ciudad: c.ciudad,
        estado: c.estado,
        pais: c.pais,
        prioridad: c.prioridad,
        excluido: c.excluido,
        busqueda_ubicaciones: estadosSeleccionados,
        busqueda_keywords: industriasSeleccionadas
      }));

      for (let i = 0; i < datos.length; i += 100) {
        const batch = datos.slice(i, i + 100);
        const { error } = await supabase.from('prospeccion_contactos').upsert(batch, { onConflict: 'source_id,fuente' });
        if (error) throw error;
      }
      
      setContactos(prev => prev.map(c => ({ ...c, esNuevo: false, yaExistia: true })));
      setStats(prev => ({ ...prev, nuevos: 0, existentes: prev.existentes + nuevos.length }));
      setChatMessages(prev => [...prev, { role: 'assistant', content: `✅ Guardados ${nuevos.length} contactos` }]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  // Toggle helpers
  const toggleArea = (areaKey: string) => {
    const area = PUESTOS_POR_AREA[areaKey as keyof typeof PUESTOS_POR_AREA];
    const todosSeleccionados = area.puestos.every(p => puestosSeleccionados.includes(p));
    
    if (todosSeleccionados) {
      setPuestosSeleccionados(prev => prev.filter(p => !area.puestos.includes(p)));
    } else {
      setPuestosSeleccionados(prev => [...new Set([...prev, ...area.puestos])]);
    }
  };

  const toggleZona = (zonaKey: string) => {
    const zona = ZONAS_MEXICO[zonaKey as keyof typeof ZONAS_MEXICO];
    const todosSeleccionados = zona.estados.every(e => estadosSeleccionados.includes(e));
    
    if (todosSeleccionados) {
      setEstadosSeleccionados(prev => prev.filter(e => !zona.estados.includes(e)));
    } else {
      setEstadosSeleccionados(prev => [...new Set([...prev, ...zona.estados])]);
    }
  };

  // Chat handler
  const handleEnviarChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: msg }]);
    setChatLoading(true);
    
    try {
      setChatMessages(prev => [...prev, { role: 'assistant', content: `Filtro: "${msg}"\n\n(IA completa próximamente)` }]);
    } finally {
      setChatLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4">
      {/* Header compacto */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-lg">
          <ChevronDown className="w-5 h-5 rotate-90" />
        </button>
        <Sparkles className="w-6 h-6 text-orange-400" />
        <h1 className="text-xl font-bold">Prospección IA</h1>
        <span className="text-sm text-gray-400">Apollo + Hunter + Claude AI</span>
        
        <div className="ml-auto flex gap-1">
          {[1, 2, 3, 4].map(p => (
            <div key={p} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${paso >= p ? 'bg-orange-500' : 'bg-gray-700'}`}>
              {paso > p ? <Check className="w-4 h-4" /> : p}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-3 p-3 bg-red-500/20 border border-red-500 rounded-lg flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* PASO 1: Filtros */}
      {paso === 1 && (
        <div className="space-y-3">
          {/* Fila 1: Fuente + Empresa */}
          <div className="flex gap-3">
            {/* Selector de fuente */}
            <div className="bg-slate-800/50 rounded-lg p-3 flex-shrink-0">
              <div className="flex items-center gap-1 mb-2">
                <Database className="w-4 h-4 text-blue-400" />
                <span className="font-medium text-xs">Fuente</span>
              </div>
              <div className="flex gap-1">
                {[
                  { id: 'apollo', name: 'Apollo', icon: Target },
                  { id: 'hunter', name: 'Hunter', icon: Mail },
                  { id: 'ambos', name: 'Ambos', icon: Zap }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFuenteSeleccionada(f.id as any)}
                    className={`px-3 py-1.5 rounded text-xs flex items-center gap-1 transition-all ${
                      fuenteSeleccionada === f.id 
                        ? 'bg-orange-500 text-white' 
                        : 'bg-slate-700 hover:bg-slate-600'
                    }`}
                  >
                    <f.icon className="w-3 h-3" />
                    {f.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Empresa específica */}
            <div className="bg-slate-800/50 rounded-lg p-3 flex-1">
              <div className="flex items-center gap-1 mb-2">
                <Building2 className="w-4 h-4 text-green-400" />
                <span className="font-medium text-xs">Empresa específica (opcional)</span>
              </div>
              <input
                type="text"
                placeholder="Ej: CEMEX, Bimbo..."
                value={buscarEmpresa}
                onChange={e => setBuscarEmpresa(e.target.value)}
                className="w-full p-2 bg-slate-700 rounded border border-gray-600 focus:border-orange-500 outline-none text-sm"
              />
            </div>
          </div>

          {/* Puestos por área */}
          <div className="bg-slate-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="w-4 h-4 text-blue-400" />
              <span className="font-medium text-xs">Puestos / Cargos</span>
              <span className="text-xs text-gray-400 ml-auto">{puestosSeleccionados.length} seleccionados</span>
            </div>
            
            <div className="space-y-1">
              {Object.entries(PUESTOS_POR_AREA).map(([key, area]) => {
                const seleccionados = area.puestos.filter(p => puestosSeleccionados.includes(p));
                const todosSeleccionados = seleccionados.length === area.puestos.length;
                const algunosSeleccionados = seleccionados.length > 0 && !todosSeleccionados;
                const expandida = areasExpandidas.includes(key);

                return (
                  <div key={key} className="border border-gray-700 rounded overflow-hidden">
                    <div 
                      className="flex items-center gap-2 p-2 bg-slate-700/50 cursor-pointer hover:bg-slate-700 text-xs"
                      onClick={() => setAreasExpandidas(prev => prev.includes(key) ? prev.filter(a => a !== key) : [...prev, key])}
                    >
                      <input
                        type="checkbox"
                        checked={todosSeleccionados}
                        ref={input => { if (input) input.indeterminate = algunosSeleccionados; }}
                        onChange={e => { e.stopPropagation(); toggleArea(key); }}
                        onClick={e => e.stopPropagation()}
                        className="w-3 h-3"
                      />
                      <span className="flex-1">{area.nombre}</span>
                      <span className="text-xs text-gray-400">{seleccionados.length}/{area.puestos.length}</span>
                      {expandida ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </div>
                    
                    {expandida && (
                      <div className="p-2 bg-slate-800/50 flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                        {area.puestos.map(puesto => (
                          <label key={puesto} className="flex items-center gap-1 text-xs bg-slate-700/50 px-1.5 py-0.5 rounded cursor-pointer hover:bg-slate-600/50">
                            <input
                              type="checkbox"
                              checked={puestosSeleccionados.includes(puesto)}
                              onChange={() => setPuestosSeleccionados(prev => 
                                prev.includes(puesto) ? prev.filter(p => p !== puesto) : [...prev, puesto]
                              )}
                              className="w-3 h-3"
                            />
                            <span className="truncate">{puesto}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fila 2: Ubicación + Industrias lado a lado */}
          <div className="flex gap-3">
            {/* Ubicación compacta */}
            <div className="bg-slate-800/50 rounded-lg p-3 flex-1">
              <div 
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => setMostrarUbicacion(!mostrarUbicacion)}
              >
                <MapPin className="w-4 h-4 text-red-400" />
                <span className="font-medium text-xs">Ubicación</span>
                <span className="text-xs text-gray-400 ml-auto">
                  {estadosSeleccionados.length === 0 ? 'Todo México' : `${estadosSeleccionados.length} estados`}
                </span>
                {mostrarUbicacion ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </div>
              
              {mostrarUbicacion && (
                <div className="mt-2 space-y-2">
                  <div className="flex gap-1 flex-wrap">
                    <button
                      onClick={() => setEstadosSeleccionados(estadosSeleccionados.length === TODOS_LOS_ESTADOS.length ? [] : [...TODOS_LOS_ESTADOS])}
                      className="px-2 py-0.5 text-xs bg-blue-600 hover:bg-blue-700 rounded"
                    >
                      {estadosSeleccionados.length === TODOS_LOS_ESTADOS.length ? 'Limpiar' : 'Todo MX'}
                    </button>
                    {Object.entries(ZONAS_MEXICO).map(([key, zona]) => {
                      const sel = zona.estados.filter(e => estadosSeleccionados.includes(e));
                      return (
                        <button
                          key={key}
                          onClick={() => toggleZona(key)}
                          className={`px-2 py-0.5 text-xs rounded ${
                            sel.length === zona.estados.length ? 'bg-orange-600' :
                            sel.length > 0 ? 'bg-orange-600/50' : 'bg-slate-700 hover:bg-slate-600'
                          }`}
                        >
                          {zona.nombre}
                        </button>
                      );
                    })}
                  </div>
                  
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                    {TODOS_LOS_ESTADOS.map(estado => (
                      <label key={estado} className="flex items-center gap-1 text-xs bg-slate-700/50 px-1.5 py-0.5 rounded cursor-pointer hover:bg-slate-600/50">
                        <input
                          type="checkbox"
                          checked={estadosSeleccionados.includes(estado)}
                          onChange={() => setEstadosSeleccionados(prev => 
                            prev.includes(estado) ? prev.filter(e => e !== estado) : [...prev, estado]
                          )}
                          className="w-3 h-3"
                        />
                        <span>{estado}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Industrias dropdown */}
            <div className="bg-slate-800/50 rounded-lg p-3 flex-1">
              <div 
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => setMostrarIndustrias(!mostrarIndustrias)}
              >
                <Filter className="w-4 h-4 text-purple-400" />
                <span className="font-medium text-xs">Industrias</span>
                <span className="text-xs text-gray-400 ml-auto">{industriasSeleccionadas.length} sel.</span>
                {mostrarIndustrias ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </div>
              
              {mostrarIndustrias && (
                <div className="mt-2">
                  <button
                    onClick={() => setIndustriasSeleccionadas(industriasSeleccionadas.length === Object.keys(INDUSTRIAS_APOLLO).length ? [] : Object.keys(INDUSTRIAS_APOLLO))}
                    className="px-2 py-0.5 text-xs bg-purple-600 hover:bg-purple-700 rounded mb-2"
                  >
                    {industriasSeleccionadas.length === Object.keys(INDUSTRIAS_APOLLO).length ? 'Limpiar' : 'Todas'}
                  </button>
                  <div className="grid grid-cols-2 gap-1 max-h-28 overflow-y-auto">
                    {Object.entries(INDUSTRIAS_APOLLO).map(([key, ind]) => (
                      <label key={key} className={`flex items-center gap-1 text-xs p-1 rounded border cursor-pointer ${
                        industriasSeleccionadas.includes(key) ? 'bg-purple-600/30 border-purple-500' : 'bg-slate-700/50 border-gray-700'
                      }`}>
                        <input
                          type="checkbox"
                          checked={industriasSeleccionadas.includes(key)}
                          onChange={() => setIndustriasSeleccionadas(prev => 
                            prev.includes(key) ? prev.filter(i => i !== key) : [...prev, key]
                          )}
                          className="w-3 h-3"
                        />
                        <span className="truncate">{ind.nombre}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Excluir logísticas */}
          <div className="bg-slate-800/50 rounded-lg p-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={excluirLogisticas}
                onChange={e => setExcluirLogisticas(e.target.checked)}
                className="w-3 h-3"
              />
              <X className="w-4 h-4 text-red-400" />
              <span className="font-medium">Excluir automáticamente:</span>
              <span className="text-gray-400">Logísticas, transportes, bancos, gobierno, consultorías</span>
            </label>
          </div>

          {/* Botón buscar */}
          <button
            onClick={handleBuscarContactos}
            disabled={loading || puestosSeleccionados.length === 0}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 
              disabled:opacity-50 rounded-lg font-semibold text-sm flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {loading ? 'Buscando...' : `Buscar en ${fuenteSeleccionada === 'ambos' ? 'Apollo + Hunter' : fuenteSeleccionada?.charAt(0).toUpperCase() + fuenteSeleccionada?.slice(1)}`}
          </button>
        </div>
      )}

      {/* PASO 2: Lista + Chat */}
      {paso === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Lista contactos */}
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                Contactos ({contactos.length})
              </h2>
              <div className="flex gap-1 text-xs">
                <span className="px-2 py-1 bg-green-600/30 text-green-400 rounded">🆕 {stats.nuevos}</span>
                <span className="px-2 py-1 bg-blue-600/30 text-blue-400 rounded">📁 {stats.existentes}</span>
              </div>
            </div>

            <div className="text-xs text-gray-400 mb-2">
              {contactos.length} de {paginacion.total.toLocaleString()} • Página {paginacion.currentPage}/{paginacion.totalPages}
            </div>

            <div className="space-y-2 max-h-[350px] overflow-y-auto mb-3">
              {contactos.map(c => (
                <div key={c.id} className={`p-2 rounded border text-sm ${
                  c.excluido ? 'border-red-800 bg-red-900/20 opacity-50' :
                  c.esNuevo ? 'border-green-600 bg-green-900/20' :
                  'border-gray-700 bg-slate-700/30'
                }`}>
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-medium truncate">{c.nombre} {c.apellido}</span>
                        {c.esNuevo && <span className="text-xs bg-green-600 px-1 rounded">NUEVO</span>}
                      </div>
                      <p className="text-xs text-gray-400 truncate">{c.puesto}</p>
                      <p className="text-xs text-blue-400 truncate">{c.empresa}</p>
                      <p className="text-xs text-gray-500">
                        {c.email === 'email_not_unlocked@domain.com' ? '🔒 Bloqueado' : c.email}
                      </p>
                    </div>
                    <button
                      onClick={() => setContactos(prev => prev.map(x => x.id === c.id ? { ...x, excluido: !x.excluido } : x))}
                      className="p-1 hover:bg-white/10 rounded"
                    >
                      {c.excluido ? <RefreshCw className="w-3 h-3" /> : <Trash2 className="w-3 h-3 text-red-400" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mb-2">
              <button
                onClick={handleCargarMas}
                disabled={loadingMore || paginacion.currentPage >= paginacion.totalPages}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded text-sm flex items-center justify-center gap-1"
              >
                {loadingMore ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                +{CONTACTOS_POR_PAGINA}
              </button>
              <button
                onClick={handleTraerTodos}
                disabled={loadingMore || paginacion.loaded >= paginacion.total}
                className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded text-sm flex items-center justify-center gap-1"
              >
                <Zap className="w-3 h-3" />
                Todos ({paginacion.total.toLocaleString()})
              </button>
            </div>

            <button
              onClick={handleGuardarTodos}
              disabled={guardando || stats.nuevos === 0}
              className="w-full py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded text-sm flex items-center justify-center gap-1"
            >
              {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Guardar {stats.nuevos} Nuevos
            </button>
          </div>

          {/* Chat */}
          <div className="bg-slate-800/50 rounded-lg p-4 flex flex-col">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <Bot className="w-4 h-4 text-orange-400" />
              Asistente IA
            </h2>
            
            <div ref={chatRef} className="flex-1 overflow-y-auto space-y-2 mb-3 max-h-[400px]">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`p-2 rounded text-sm ${msg.role === 'assistant' ? 'bg-slate-700' : 'bg-orange-600/20 ml-6'}`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              ))}
              {chatLoading && <div className="flex items-center gap-2 text-xs text-gray-400"><Loader2 className="w-3 h-3 animate-spin" />Pensando...</div>}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleEnviarChat()}
                placeholder="Filtrar, clasificar..."
                className="flex-1 p-2 bg-slate-700 rounded border border-gray-600 focus:border-orange-500 outline-none text-sm"
              />
              <button onClick={handleEnviarChat} disabled={chatLoading || !chatInput.trim()} className="p-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 rounded">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navegación */}
      {paso > 1 && (
        <div className="mt-4 flex gap-3">
          <button onClick={() => setPaso((paso - 1) as any)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm">
            ← Volver
          </button>
          {paso === 2 && (
            <button
              onClick={() => setPaso(3)}
              disabled={contactos.filter(c => !c.excluido).length === 0}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 rounded text-sm ml-auto flex items-center gap-1"
            >
              Validar Emails <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ProspeccionIAModule;
