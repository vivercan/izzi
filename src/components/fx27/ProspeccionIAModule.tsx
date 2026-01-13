// ═══════════════════════════════════════════════════════════════════════════
// PROSPECCIÓN IA MODULE v3 - Con paginación, BD y detección de cambios
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useRef, useEffect } from 'react';
import { 
  Search, Filter, Download, Loader2, CheckCircle2, XCircle, 
  Building2, User, Mail, MapPin, Briefcase, Sparkles, 
  RefreshCw, ChevronDown, ChevronUp, Send, Bot, Trash2,
  Globe, Target, Users, AlertCircle, Check, X, Crown, Factory,
  Database, Plus, ArrowRight, Eye, Save, Zap
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════════════════
const SUPABASE_URL = 'https://fbxbsslhewchyibdoyzk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieGJzc2xoZXdjaHlpYmRveXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzczODEsImV4cCI6MjA3ODExMzM4MX0.Z8JPlg7hhKbA624QGHp2bKKTNtCD3WInQMO5twjl6a0';
const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || '';

const CONTACTOS_POR_PAGINA = 50;

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
  // Para tracking de cambios
  esNuevo?: boolean;
  yaExistia?: boolean;
}

interface MensajeChat {
  role: 'user' | 'assistant';
  content: string;
}

interface PaginacionInfo {
  total: number;
  totalPages: number;
  currentPage: number;
  loaded: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// ZONAS DE MÉXICO (ordenadas alfabéticamente dentro de cada zona)
// ═══════════════════════════════════════════════════════════════════════════
const ZONAS_MEXICO: { [key: string]: { nombre: string; estados: string[] } } = {
  norte: {
    nombre: 'Norte',
    estados: ['Baja California', 'Baja California Sur', 'Chihuahua', 'Coahuila', 'Durango', 'Nuevo León', 'Sinaloa', 'Sonora', 'Tamaulipas']
  },
  bajio: {
    nombre: 'Bajío',
    estados: ['Aguascalientes', 'Guanajuato', 'Querétaro', 'San Luis Potosí', 'Zacatecas']
  },
  centro: {
    nombre: 'Centro',
    estados: ['Ciudad de México', 'Estado de México', 'Hidalgo', 'Morelos', 'Puebla', 'Tlaxcala']
  },
  occidente: {
    nombre: 'Occidente',
    estados: ['Colima', 'Jalisco', 'Michoacán', 'Nayarit']
  },
  sur: {
    nombre: 'Sur',
    estados: ['Chiapas', 'Guerrero', 'Oaxaca', 'Tabasco', 'Veracruz']
  },
  sureste: {
    nombre: 'Sureste',
    estados: ['Campeche', 'Quintana Roo', 'Yucatán']
  }
};

const TODOS_LOS_ESTADOS = Object.values(ZONAS_MEXICO).flatMap(z => z.estados).sort();

// ═══════════════════════════════════════════════════════════════════════════
// SEGMENTOS DE MERCADO
// ═══════════════════════════════════════════════════════════════════════════
const SEGMENTOS_MERCADO: { [key: string]: { nombre: string; icon: string; keywords: string[] } } = {
  automotriz: { nombre: 'Automotriz', icon: '🚗', keywords: ['automotive', 'auto parts'] },
  aeroespacial: { nombre: 'Aeroespacial', icon: '✈️', keywords: ['aerospace', 'aviation'] },
  mineria: { nombre: 'Minería', icon: '⛏️', keywords: ['mining', 'metals'] },
  agroindustrial: { nombre: 'Agroindustrial', icon: '🌾', keywords: ['agriculture', 'agroindustrial'] },
  alimentos: { nombre: 'Alimentos y Bebidas', icon: '🍔', keywords: ['food', 'beverages'] },
  carnicos: { nombre: 'Cárnicos / Pollo', icon: '🥩', keywords: ['meat', 'poultry'] },
  produce: { nombre: 'Produce / Frutas', icon: '🍎', keywords: ['produce', 'fruits'] },
  retail: { nombre: 'Retail / Autoservicio', icon: '🛒', keywords: ['retail', 'supermarket'] },
  consumo: { nombre: 'Consumo Masivo', icon: '📦', keywords: ['consumer goods', 'fmcg'] },
  farmaceutica: { nombre: 'Farmacéutica', icon: '💊', keywords: ['pharmaceutical', 'medical'] },
  manufactura: { nombre: 'Manufactura General', icon: '🏭', keywords: ['manufacturing', 'industrial'] }
};

// Puestos
const PUESTOS_CLEVEL = ['CEO', 'Chief Executive Officer', 'Director General', 'President', 'Presidente', 'Owner', 'Founder'];
const PUESTOS_DECISION = [...PUESTOS_CLEVEL, 'VP', 'Vice President', 'Director', 'Gerente', 'Manager', 'Head of', 'Jefe'];

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════
interface Props {
  onBack: () => void;
}

export const ProspeccionIAModule = ({ onBack }: Props) => {
  // Estados de UI
  const [paso, setPaso] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros de búsqueda
  const [fuenteSeleccionada, setFuenteSeleccionada] = useState<'apollo' | 'hunter' | 'ambos' | null>(null);
  const [estadosSeleccionados, setEstadosSeleccionados] = useState<string[]>([]);
  const [zonasExpandidas, setZonasExpandidas] = useState<string[]>([]);
  const [segmentosSeleccionados, setSegmentosSeleccionados] = useState<string[]>(Object.keys(SEGMENTOS_MERCADO));
  const [buscarEmpresa, setBuscarEmpresa] = useState('');
  const [soloCLevel, setSoloCLevel] = useState(false);
  
  // Contactos y paginación
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [paginacion, setPaginacion] = useState<PaginacionInfo>({ total: 0, totalPages: 0, currentPage: 0, loaded: 0 });
  const [contactosGuardados, setContactosGuardados] = useState<Set<string>>(new Set());
  const [guardando, setGuardando] = useState(false);
  
  // Chat IA
  const [chatMessages, setChatMessages] = useState<MensajeChat[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  
  // Stats
  const [stats, setStats] = useState({ nuevos: 0, existentes: 0, total: 0 });

  // ═══════════════════════════════════════════════════════════════════════════
  // FUNCIONES DE BÚSQUEDA
  // ═══════════════════════════════════════════════════════════════════════════
  
  const buscarApollo = async (page: number = 1, perPage: number = CONTACTOS_POR_PAGINA): Promise<{ contacts: Contacto[], total: number, totalPages: number }> => {
    const puestosABuscar = soloCLevel ? PUESTOS_CLEVEL : PUESTOS_DECISION;
    const ubicaciones = estadosSeleccionados.length > 0 
      ? estadosSeleccionados.map(e => `${e}, Mexico`)
      : ['Mexico'];

    const keywords = segmentosSeleccionados.flatMap(s => SEGMENTOS_MERCADO[s]?.keywords || []);

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
          titles: puestosABuscar.slice(0, 10),
          company_name: buscarEmpresa.trim() || undefined,
          keywords: keywords.slice(0, 10),
          page,
          per_page: perPage
        }
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Error en Apollo');
    }

    const data = await response.json();
    
    const contacts = (data.contacts || []).map((c: any) => ({
      ...c,
      source_id: c.id,
      prioridad: null,
      excluido: false
    }));

    return {
      contacts,
      total: data.total || 0,
      totalPages: data.total_pages || 0
    };
  };

  const buscarHunter = async (): Promise<Contacto[]> => {
    // Dominios basados en segmentos
    const dominiosBase = [
      'bafar.com.mx', 'barcel.com.mx', 'gruma.com', 'cemex.com',
      'bimbo.com', 'lala.com.mx', 'alpura.com', 'sigma-alimentos.com',
      'femsa.com', 'modelo.com', 'bachoco.com.mx', 'grupobafar.com'
    ];

    const response = await fetch(`${SUPABASE_URL}/functions/v1/prospeccion-api`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        action: 'hunter_domain_search',
        params: { domains: dominiosBase.slice(0, 10) }
      })
    });

    if (!response.ok) throw new Error('Error en Hunter');

    const data = await response.json();
    return (data.contacts || []).map((c: any) => ({
      ...c,
      source_id: c.id,
      prioridad: null,
      excluido: false
    }));
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // VERIFICAR CONTACTOS EXISTENTES EN BD
  // ═══════════════════════════════════════════════════════════════════════════
  
  const verificarExistentes = async (contactosNuevos: Contacto[]): Promise<Contacto[]> => {
    // Obtener source_ids de los contactos nuevos
    const sourceIds = contactosNuevos.map(c => c.source_id || c.id);
    
    // Buscar cuáles ya existen
    const { data: existentes } = await supabase
      .from('prospeccion_contactos')
      .select('source_id')
      .in('source_id', sourceIds);
    
    const existentesSet = new Set((existentes || []).map(e => e.source_id));
    
    // Marcar cada contacto
    return contactosNuevos.map(c => ({
      ...c,
      yaExistia: existentesSet.has(c.source_id || c.id),
      esNuevo: !existentesSet.has(c.source_id || c.id)
    }));
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLERS DE BÚSQUEDA
  // ═══════════════════════════════════════════════════════════════════════════
  
  const handleBuscarContactos = async () => {
    if (!fuenteSeleccionada) {
      setError('Selecciona una fuente de datos');
      return;
    }

    setLoading(true);
    setError(null);
    setContactos([]);
    
    try {
      let todosContactos: Contacto[] = [];
      let totalDisponible = 0;
      let totalPaginas = 0;
      
      if (fuenteSeleccionada === 'apollo' || fuenteSeleccionada === 'ambos') {
        const { contacts, total, totalPages } = await buscarApollo(1, CONTACTOS_POR_PAGINA);
        todosContactos = [...todosContactos, ...contacts];
        totalDisponible = total;
        totalPaginas = totalPages;
      }
      
      if (fuenteSeleccionada === 'hunter' || fuenteSeleccionada === 'ambos') {
        const hunterContacts = await buscarHunter();
        todosContactos = [...todosContactos, ...hunterContacts];
      }

      // Verificar cuáles ya existen en BD
      const contactosConStatus = await verificarExistentes(todosContactos);
      
      // Calcular stats
      const nuevos = contactosConStatus.filter(c => c.esNuevo).length;
      const existentes = contactosConStatus.filter(c => c.yaExistia).length;
      
      setContactos(contactosConStatus);
      setPaginacion({
        total: totalDisponible,
        totalPages: totalPaginas,
        currentPage: 1,
        loaded: contactosConStatus.length
      });
      setStats({ nuevos, existentes, total: totalDisponible });
      setPaso(2);
      
      // Mensaje inicial
      setChatMessages([{
        role: 'assistant',
        content: `✅ **Cargados ${contactosConStatus.length} de ${totalDisponible.toLocaleString()} contactos disponibles**

📊 **Estadísticas:**
• 🆕 Nuevos: ${nuevos}
• 📁 Ya guardados: ${existentes}
• 📄 Total disponible: ${totalDisponible.toLocaleString()} (${totalPaginas} páginas)

**Opciones:**
• Clic en "Cargar +50" para más contactos
• Clic en "Traer Todos" para cargar todo
• Usa el chat para filtrar por industria, puesto, etc.

¿Qué deseas hacer?`
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
      setPaginacion(prev => ({
        ...prev,
        currentPage: nextPage,
        loaded: prev.loaded + contactosConStatus.length
      }));
      
      const nuevos = contactosConStatus.filter(c => c.esNuevo).length;
      setStats(prev => ({
        ...prev,
        nuevos: prev.nuevos + nuevos,
        existentes: prev.existentes + (contactosConStatus.length - nuevos)
      }));

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleTraerTodos = async () => {
    if (loadingMore) return;
    
    const confirmar = window.confirm(
      `¿Cargar los ${paginacion.total.toLocaleString()} contactos?\n\nEsto puede tardar unos minutos y consumir créditos de Apollo.`
    );
    
    if (!confirmar) return;
    
    setLoadingMore(true);
    
    try {
      let todosContactos = [...contactos];
      let currentPage = paginacion.currentPage;
      
      while (currentPage < paginacion.totalPages) {
        currentPage++;
        const { contacts } = await buscarApollo(currentPage, CONTACTOS_POR_PAGINA);
        const contactosConStatus = await verificarExistentes(contacts);
        todosContactos = [...todosContactos, ...contactosConStatus];
        
        // Actualizar progreso
        setPaginacion(prev => ({
          ...prev,
          currentPage,
          loaded: todosContactos.length
        }));
        
        // Pequeña pausa para no saturar la API
        await new Promise(r => setTimeout(r, 300));
      }
      
      setContactos(todosContactos);
      
      const nuevos = todosContactos.filter(c => c.esNuevo).length;
      setStats({
        nuevos,
        existentes: todosContactos.length - nuevos,
        total: paginacion.total
      });

      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: `✅ **Cargados ${todosContactos.length} contactos completos**\n\n🆕 Nuevos: ${nuevos}\n📁 Ya existentes: ${todosContactos.length - nuevos}`
      }]);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingMore(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // GUARDAR EN BASE DE DATOS
  // ═══════════════════════════════════════════════════════════════════════════
  
  const handleGuardarTodos = async () => {
    setGuardando(true);
    
    try {
      const contactosParaGuardar = contactos.filter(c => c.esNuevo && !c.excluido);
      
      if (contactosParaGuardar.length === 0) {
        alert('No hay contactos nuevos para guardar');
        setGuardando(false);
        return;
      }
      
      // Preparar datos para insertar
      const datos = contactosParaGuardar.map(c => ({
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
        busqueda_keywords: segmentosSeleccionados,
        busqueda_ubicaciones: estadosSeleccionados,
        busqueda_segmentos: segmentosSeleccionados
      }));

      // Insertar en lotes de 100
      const BATCH_SIZE = 100;
      let insertados = 0;
      
      for (let i = 0; i < datos.length; i += BATCH_SIZE) {
        const batch = datos.slice(i, i + BATCH_SIZE);
        
        const { error } = await supabase
          .from('prospeccion_contactos')
          .upsert(batch, { 
            onConflict: 'source_id,fuente',
            ignoreDuplicates: false 
          });
        
        if (error) throw error;
        insertados += batch.length;
      }
      
      // Actualizar UI
      setContactos(prev => prev.map(c => ({
        ...c,
        esNuevo: false,
        yaExistia: true
      })));
      
      setStats(prev => ({
        ...prev,
        nuevos: 0,
        existentes: prev.existentes + insertados
      }));

      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: `✅ **Guardados ${insertados} contactos en la base de datos**\n\nAhora puedes verlos en futuras búsquedas.`
      }]);

    } catch (err: any) {
      setError(`Error guardando: ${err.message}`);
    } finally {
      setGuardando(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ZONAS Y ESTADOS
  // ═══════════════════════════════════════════════════════════════════════════
  
  const toggleZona = (zonaKey: string) => {
    const zona = ZONAS_MEXICO[zonaKey];
    const todosSeleccionados = zona.estados.every(e => estadosSeleccionados.includes(e));
    
    if (todosSeleccionados) {
      setEstadosSeleccionados(prev => prev.filter(e => !zona.estados.includes(e)));
    } else {
      setEstadosSeleccionados(prev => [...new Set([...prev, ...zona.estados])]);
    }
  };

  const toggleEstado = (estado: string) => {
    setEstadosSeleccionados(prev => 
      prev.includes(estado) ? prev.filter(e => e !== estado) : [...prev, estado]
    );
  };

  const toggleExpandirZona = (zonaKey: string) => {
    setZonasExpandidas(prev => 
      prev.includes(zonaKey) ? prev.filter(z => z !== zonaKey) : [...prev, zonaKey]
    );
  };

  const seleccionarTodoMexico = () => {
    if (estadosSeleccionados.length === TODOS_LOS_ESTADOS.length) {
      setEstadosSeleccionados([]);
    } else {
      setEstadosSeleccionados([...TODOS_LOS_ESTADOS]);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-lg">
          <ChevronDown className="w-6 h-6 rotate-90" />
        </button>
        <div className="flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-orange-400" />
          <div>
            <h1 className="text-2xl font-bold">Prospección IA</h1>
            <p className="text-sm text-gray-400">Apollo + Hunter + Claude AI</p>
          </div>
        </div>
        
        {/* Progress indicators */}
        <div className="ml-auto flex gap-2">
          {[1, 2, 3, 4].map(p => (
            <div 
              key={p}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
                ${paso >= p ? 'bg-orange-500' : 'bg-gray-700'}`}
            >
              {paso > p ? <Check className="w-5 h-5" /> : p}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* PASO 1: Configuración de búsqueda */}
      {paso === 1 && (
        <div className="space-y-6">
          {/* Fuente de datos */}
          <div className="bg-slate-800/50 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-400" />
              Fuente de Datos
            </h2>
            <div className="grid grid-cols-3 gap-4">
              {[
                { id: 'apollo', name: 'Apollo.io', icon: Target },
                { id: 'hunter', name: 'Hunter.io', icon: Mail },
                { id: 'ambos', name: 'Ambos', icon: Zap }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFuenteSeleccionada(f.id as any)}
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2
                    ${fuenteSeleccionada === f.id 
                      ? 'border-orange-500 bg-orange-500/20' 
                      : 'border-gray-600 hover:border-gray-500'}`}
                >
                  <f.icon className="w-8 h-8" />
                  <span className="font-medium">{f.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Búsqueda por empresa */}
          <div className="bg-slate-800/50 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-green-400" />
              Buscar empresa específica (opcional)
            </h2>
            <input
              type="text"
              placeholder="Ej: CEMEX, Bimbo, Femsa..."
              value={buscarEmpresa}
              onChange={e => setBuscarEmpresa(e.target.value)}
              className="w-full p-3 bg-slate-700 rounded-lg border border-gray-600 focus:border-orange-500 outline-none"
            />
          </div>

          {/* Solo C-Level */}
          <div className="bg-slate-800/50 rounded-xl p-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={soloCLevel}
                onChange={e => setSoloCLevel(e.target.checked)}
                className="w-5 h-5 rounded"
              />
              <Crown className="w-6 h-6 text-yellow-400" />
              <div>
                <span className="font-semibold">Solo Dueños / Presidentes / C-Level</span>
                <p className="text-sm text-gray-400">CEO, President, Owner, Founder, Chairman, Director General</p>
              </div>
            </label>
          </div>

          {/* Ubicación con zonas desplegables */}
          <div className="bg-slate-800/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <MapPin className="w-5 h-5 text-red-400" />
                Ubicación
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={seleccionarTodoMexico}
                  className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  {estadosSeleccionados.length === TODOS_LOS_ESTADOS.length ? 'Limpiar Todo' : 'Todo México'}
                </button>
                <span className="text-sm text-gray-400">
                  {estadosSeleccionados.length} seleccionados
                </span>
              </div>
            </div>

            {/* Zonas desplegables */}
            <div className="space-y-2">
              {Object.entries(ZONAS_MEXICO).map(([key, zona]) => {
                const estadosEnZona = zona.estados.filter(e => estadosSeleccionados.includes(e));
                const todosSeleccionados = estadosEnZona.length === zona.estados.length;
                const algunosSeleccionados = estadosEnZona.length > 0 && !todosSeleccionados;
                const expandida = zonasExpandidas.includes(key);

                return (
                  <div key={key} className="border border-gray-700 rounded-lg overflow-hidden">
                    {/* Header de zona */}
                    <div 
                      className="flex items-center gap-3 p-3 bg-slate-700/50 cursor-pointer hover:bg-slate-700"
                      onClick={() => toggleExpandirZona(key)}
                    >
                      <input
                        type="checkbox"
                        checked={todosSeleccionados}
                        ref={input => {
                          if (input) input.indeterminate = algunosSeleccionados;
                        }}
                        onChange={e => {
                          e.stopPropagation();
                          toggleZona(key);
                        }}
                        className="w-4 h-4"
                        onClick={e => e.stopPropagation()}
                      />
                      <span className="font-medium flex-1">{zona.nombre}</span>
                      <span className="text-sm text-gray-400">
                        {estadosEnZona.length}/{zona.estados.length}
                      </span>
                      {expandida ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                    
                    {/* Estados de la zona */}
                    {expandida && (
                      <div className="p-3 bg-slate-800/50 grid grid-cols-2 md:grid-cols-3 gap-2">
                        {zona.estados.map(estado => (
                          <label key={estado} className="flex items-center gap-2 cursor-pointer hover:bg-slate-700/50 p-1 rounded">
                            <input
                              type="checkbox"
                              checked={estadosSeleccionados.includes(estado)}
                              onChange={() => toggleEstado(estado)}
                              className="w-4 h-4"
                            />
                            <span className="text-sm">{estado}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Segmentos de mercado */}
          <div className="bg-slate-800/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Factory className="w-5 h-5 text-purple-400" />
                Segmentos de mercado
              </h2>
              <button
                onClick={() => setSegmentosSeleccionados(
                  segmentosSeleccionados.length === Object.keys(SEGMENTOS_MERCADO).length 
                    ? [] 
                    : Object.keys(SEGMENTOS_MERCADO)
                )}
                className="text-sm text-gray-400 hover:text-white"
              >
                {segmentosSeleccionados.length === Object.keys(SEGMENTOS_MERCADO).length ? 'Limpiar' : 'Seleccionar todos'}
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(SEGMENTOS_MERCADO).map(([key, seg]) => (
                <button
                  key={key}
                  onClick={() => setSegmentosSeleccionados(prev =>
                    prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]
                  )}
                  className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2
                    ${segmentosSeleccionados.includes(key)
                      ? 'border-orange-500 bg-orange-500/20'
                      : 'border-gray-600 hover:border-gray-500'}`}
                >
                  <span className="text-xl">{seg.icon}</span>
                  <span className="text-sm">{seg.nombre}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Botón buscar */}
          <button
            onClick={handleBuscarContactos}
            disabled={loading || !fuenteSeleccionada || segmentosSeleccionados.length === 0}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 
              disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold text-lg flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            {loading ? 'Buscando...' : 'Buscar Contactos'}
          </button>
        </div>
      )}

      {/* PASO 2: Lista de contactos + Chat */}
      {paso === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lista de contactos */}
          <div className="bg-slate-800/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                Contactos ({contactos.length})
              </h2>
              <div className="flex gap-2 text-sm">
                <span className="px-2 py-1 bg-green-600/30 text-green-400 rounded">🆕 {stats.nuevos}</span>
                <span className="px-2 py-1 bg-blue-600/30 text-blue-400 rounded">📁 {stats.existentes}</span>
              </div>
            </div>

            {/* Info de paginación */}
            <div className="mb-4 p-3 bg-slate-700/50 rounded-lg text-sm">
              <div className="flex justify-between items-center">
                <span>
                  Mostrando {contactos.length} de {paginacion.total.toLocaleString()} disponibles
                </span>
                <span className="text-gray-400">
                  Página {paginacion.currentPage} de {paginacion.totalPages}
                </span>
              </div>
            </div>

            {/* Lista scrolleable */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto mb-4">
              {contactos.map(c => (
                <div 
                  key={c.id}
                  className={`p-3 rounded-lg border ${
                    c.excluido ? 'border-red-800 bg-red-900/20 opacity-50' :
                    c.esNuevo ? 'border-green-600 bg-green-900/20' :
                    'border-gray-700 bg-slate-700/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{c.nombre} {c.apellido}</span>
                        {c.esNuevo && <span className="text-xs bg-green-600 px-1 rounded">NUEVO</span>}
                        {c.yaExistia && <span className="text-xs bg-blue-600 px-1 rounded">GUARDADO</span>}
                      </div>
                      <p className="text-sm text-gray-400 truncate">{c.puesto}</p>
                      <p className="text-sm text-blue-400 truncate">{c.empresa}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <Mail className="w-3 h-3" />
                        <span className={c.email === 'email_not_unlocked@domain.com' ? 'text-yellow-500' : ''}>
                          {c.email === 'email_not_unlocked@domain.com' ? '🔒 Bloqueado' : c.email}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setContactos(prev => prev.map(x => 
                        x.id === c.id ? { ...x, excluido: !x.excluido } : x
                      ))}
                      className="p-1 hover:bg-white/10 rounded"
                    >
                      {c.excluido ? <RefreshCw className="w-4 h-4" /> : <Trash2 className="w-4 h-4 text-red-400" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Botones de paginación */}
            <div className="flex gap-2">
              <button
                onClick={handleCargarMas}
                disabled={loadingMore || paginacion.currentPage >= paginacion.totalPages}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg flex items-center justify-center gap-2"
              >
                {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Cargar +{CONTACTOS_POR_PAGINA}
              </button>
              <button
                onClick={handleTraerTodos}
                disabled={loadingMore || paginacion.loaded >= paginacion.total}
                className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                Traer Todos ({paginacion.total.toLocaleString()})
              </button>
            </div>

            {/* Botón guardar */}
            <button
              onClick={handleGuardarTodos}
              disabled={guardando || stats.nuevos === 0}
              className="w-full mt-4 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg flex items-center justify-center gap-2"
            >
              {guardando ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Guardar {stats.nuevos} Nuevos en BD
            </button>
          </div>

          {/* Chat IA */}
          <div className="bg-slate-800/50 rounded-xl p-6 flex flex-col">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Bot className="w-5 h-5 text-orange-400" />
              Asistente IA para Filtrar
            </h2>
            
            <div 
              ref={chatRef}
              className="flex-1 overflow-y-auto space-y-3 mb-4 max-h-[500px]"
            >
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg ${
                    msg.role === 'assistant' 
                      ? 'bg-slate-700' 
                      : 'bg-orange-600/20 ml-8'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                </div>
              ))}
              {chatLoading && (
                <div className="flex items-center gap-2 text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Pensando...
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleEnviarChat()}
                placeholder="Ej: Solo empresas de alimentos..."
                className="flex-1 p-3 bg-slate-700 rounded-lg border border-gray-600 focus:border-orange-500 outline-none"
              />
              <button
                onClick={handleEnviarChat}
                disabled={chatLoading || !chatInput.trim()}
                className="p-3 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 rounded-lg"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Botones de navegación */}
      {paso > 1 && (
        <div className="mt-6 flex gap-4">
          <button
            onClick={() => setPaso((paso - 1) as any)}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg"
          >
            ← Volver
          </button>
          {paso === 2 && (
            <button
              onClick={() => setPaso(3)}
              disabled={contactos.filter(c => !c.excluido).length === 0}
              className="px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 rounded-lg ml-auto flex items-center gap-2"
            >
              Validar Emails <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );

  // Chat handler (simplificado)
  async function handleEnviarChat() {
    if (!chatInput.trim() || chatLoading) return;
    
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatLoading(true);
    
    try {
      // Por ahora respuesta simple, después integramos Claude
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: `Entendido. Filtro aplicado: "${userMsg}"\n\n(Integración completa con Claude próximamente)`
      }]);
    } finally {
      setChatLoading(false);
    }
  }
};

export default ProspeccionIAModule;
