// ═══════════════════════════════════════════════════════════════════════════
// PROSPECCIÓN IA MODULE v8 - Enterprise B2B Prospecting System
// Vista lista, respaldo automático, histórico, exportación Excel
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { 
  Search, Loader2, Building2, Mail, MapPin, 
  ChevronDown, ChevronRight, Target, Users, X, 
  Save, Lock, Unlock, Briefcase, Factory,
  Globe, UserCheck, Database, Check,
  Linkedin, Download, History, RefreshCw,
  ArrowUpDown, FileSpreadsheet, Eye, Filter
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fbxbsslhewchyibdoyzk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieGJzc2xoZXdjaHlpYmRveXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzczODEsImV4cCI6MjA3ODExMzM4MX0.Z8JPlg7hhKbA624QGHp2bKKTNtCD3WInQMO5twjl6a0'
);

const SUPABASE_URL = 'https://fbxbsslhewchyibdoyzk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieGJzc2xoZXdjaHlpYmRveXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzczODEsImV4cCI6MjA3ODExMzM4MX0.Z8JPlg7hhKbA624QGHp2bKKTNtCD3WInQMO5twjl6a0';

// ═══════════════════════════════════════════════════════════════════════════
// DATOS DE FILTROS
// ═══════════════════════════════════════════════════════════════════════════

const ZONAS = {
  norte: { nombre: 'Norte', estados: ['Baja California', 'Baja California Sur', 'Chihuahua', 'Coahuila', 'Durango', 'Nuevo León', 'Sinaloa', 'Sonora', 'Tamaulipas'] },
  bajio: { nombre: 'Bajío', estados: ['Aguascalientes', 'Guanajuato', 'Querétaro', 'San Luis Potosí', 'Zacatecas'] },
  centro: { nombre: 'Centro', estados: ['Ciudad de México', 'Estado de México', 'Hidalgo', 'Morelos', 'Puebla', 'Tlaxcala'] },
  occidente: { nombre: 'Occidente', estados: ['Colima', 'Jalisco', 'Michoacán', 'Nayarit'] },
  sur: { nombre: 'Sur', estados: ['Chiapas', 'Guerrero', 'Oaxaca', 'Tabasco', 'Veracruz', 'Campeche', 'Quintana Roo', 'Yucatán'] }
};

const JERARQUIAS = [
  { id: 'owner', nombre: 'Owner', titles: ['Owner', 'Founder', 'Co-Founder', 'Dueño', 'Socio', 'Propietario'] },
  { id: 'clevel', nombre: 'C-Level', titles: ['CEO', 'COO', 'CFO', 'CTO', 'CMO', 'President', 'Chairman', 'Director General'] },
  { id: 'director', nombre: 'Director', titles: ['Director', 'VP', 'Vice President', 'Vicepresidente'] },
  { id: 'gerente', nombre: 'Gerente', titles: ['Manager', 'Gerente', 'Head of', 'Jefe', 'Responsable'] },
  { id: 'coordinador', nombre: 'Coordinador', titles: ['Coordinator', 'Coordinador', 'Supervisor', 'Lead', 'Encargado'] }
];

const FUNCIONES = [
  { id: 'direccion', nombre: 'Dirección General', keywords: ['CEO', 'Director General', 'Managing Director', 'President', 'General Manager', 'Presidente'] },
  { id: 'operaciones', nombre: 'Operaciones / Planta', keywords: ['Operations', 'Plant', 'Production', 'Manufacturing', 'Operaciones', 'Planta', 'Producción', 'Manufactura'] },
  { id: 'supplychain', nombre: 'Supply Chain', keywords: ['Supply Chain', 'Logistics', 'Distribution', 'Warehouse', 'Logística', 'Cadena de Suministro', 'Almacén', 'Distribución'] },
  { id: 'comex', nombre: 'Comercio Exterior', keywords: ['Import', 'Export', 'Trade', 'Customs', 'Importación', 'Exportación', 'Comercio Exterior', 'Aduanas', 'International'] },
  { id: 'compras', nombre: 'Compras', keywords: ['Procurement', 'Purchasing', 'Sourcing', 'Buyer', 'Compras', 'Abastecimiento', 'Adquisiciones'] },
  { id: 'finanzas', nombre: 'Finanzas Op.', keywords: ['Finance', 'Accounting', 'Controller', 'Finanzas', 'Contabilidad', 'Tesorería', 'Facturación'] }
];

// Exclusiones automáticas (lista negra) - NOMBRES ESPECÍFICOS + KEYWORDS
const EXCLUSIONES_EMPRESAS = [
  // Bancos específicos
  'bbva', 'bancomer', 'santander', 'hsbc', 'banamex', 'citibanamex', 'banorte', 'scotiabank',
  'inbursa', 'banco azteca', 'compartamos', 'afirme', 'banbajio', 'banco del bajio',
  'actinver', 'multiva', 'banregio', 'mifel', 'hey banco', 'nu bank', 'nubank',
  // Logística/Transporte específicos
  'abc logistica', 'abc logística', 'dhl', 'fedex', 'ups', 'estafeta', 'paquetexpress', 
  'redpack', 'j&t express', 'castores', 'fletes', 'transportes', 'freight',
  '99 minutos', 'enviaflores', 'mercado envios',
  // Consultoras
  'deloitte', 'kpmg', 'pwc', 'ey ', 'ernst young', 'mckinsey', 'bain', 'bcg', 'accenture',
  // Recursos Humanos / Reclutamiento
  'manpower', 'adecco', 'kelly services', 'randstad', 'recursos humanos', '4work',
  'occ mundial', 'computrabajo', 'linkedin', 'indeed', 'glassdoor', 'careeradvisor',
  'brivé', 'brive', 'evaluar', 'talent clue', 'workable', 'greenhouse',
  // Hoteles
  'marriott', 'hilton', 'hyatt', 'intercontinental', 'holiday inn', 'fiesta americana',
  'city express', 'camino real', 'posadas',
  // Aerolíneas
  'aeromexico', 'aeroméxico', 'volaris', 'viva aerobus', 'interjet',
  // Otros servicios a excluir
  'axity', 'softtek', 'infosys', 'tcs', 'wipro', 'cognizant',
  'avocado creative', 'barroso mayorga', // Agencias de la lista
];

const EXCLUSIONES_KEYWORDS = [
  // Logística y Transporte
  'logistics', 'logistica', 'logística', 'transportation', 'trucking', 'freight', 
  '3pl', '4pl', 'courier', 'shipping', 'forwarding', 'mensajeria', 'paqueteria',
  // Banca y Finanzas
  'bank', 'banking', 'banco', 'insurance', 'aseguradora', 'seguros', 'financial services', 
  'fintech', 'credito', 'crédito', 'prestamos', 'préstamos', 'financiera',
  // Gobierno y ONGs
  'government', 'gobierno', 'ngo', 'nonprofit', 'ong', 'fundacion', 'fundación',
  // Educación
  'education', 'university', 'universidad', 'school', 'escuela', 'colegio', 'instituto',
  // Hospitalidad
  'hotel', 'resort', 'restaurant', 'restaurante', 'hospitality', 'tourism', 'turismo',
  // Servicios profesionales
  'consulting', 'consultoria', 'consultoría', 'agency', 'agencia', 'marketing', 
  'advertising', 'publicidad', 'legal', 'law firm', 'abogados', 'despacho legal',
  'accounting firm', 'contadores', 'contabilidad', 'auditoria',
  // Inmobiliario
  'real estate', 'inmobiliaria', 'bienes raices', 'bienes raíces',
  // Recursos Humanos
  'reclutamiento', 'headhunter', 'talent acquisition', 'staffing', 'career', 
  'empleo', 'trabajo', 'job board', 'executive search', 'outplacement',
  // Software/SaaS sin operación física
  'software company', 'saas', 'digital agency', 'web development',
];

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

interface Contacto {
  id: string;
  source_id: string;
  fuente: 'apollo' | 'hunter';
  nombre: string;
  apellido: string;
  nombre_completo: string;
  puesto_original: string;
  puesto_normalizado: string;
  jerarquia: string;
  funcion: string;
  empresa: string;
  dominio_empresa: string;
  industria: string;
  pais: string;
  estado: string;
  zona: string;
  email: string;
  email_status: 'verified' | 'locked' | 'none';
  email_unlocked: boolean;
  linkedin: string;
  telefono: string;
  fecha_captura: string;
  fecha_ultima_aparicion: string;
  fecha_desaparicion: string | null;
  es_nuevo: boolean;
  activo: boolean;
  seleccionado?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════════════════════════════════════════

const detectarJerarquia = (puesto: string): string => {
  const p = puesto.toLowerCase();
  for (const j of JERARQUIAS) {
    if (j.titles.some(t => p.includes(t.toLowerCase()))) {
      return j.nombre;
    }
  }
  return 'Otro';
};

const detectarFuncion = (puesto: string): string => {
  const p = puesto.toLowerCase();
  for (const f of FUNCIONES) {
    if (f.keywords.some(k => p.includes(k.toLowerCase()))) {
      return f.nombre;
    }
  }
  return 'General';
};

const detectarZona = (estado: string): string => {
  for (const [key, zona] of Object.entries(ZONAS)) {
    if (zona.estados.some(e => estado.toLowerCase().includes(e.toLowerCase()))) {
      return zona.nombre;
    }
  }
  return 'Otro';
};

const esEmpresaExcluida = (empresa: string, industria: string, puesto?: string): boolean => {
  const emp = empresa.toLowerCase();
  const ind = industria.toLowerCase();
  const pue = (puesto || '').toLowerCase();
  const texto = `${emp} ${ind}`;
  
  // Verificar nombres específicos de empresas excluidas
  if (EXCLUSIONES_EMPRESAS.some(exc => emp.includes(exc))) {
    return true;
  }
  
  // Verificar keywords en empresa o industria
  if (EXCLUSIONES_KEYWORDS.some(exc => texto.includes(exc))) {
    return true;
  }
  
  // Excluir puestos de RH/Reclutamiento/Marketing
  const puestosExcluidos = [
    'talent acquisition', 'reclutador', 'recruiter', 'hr ', 'human resources',
    'recursos humanos', 'headhunter', 'marketing', 'community manager',
    'social media', 'content', 'seo', 'sem', 'publicista', 'diseñador',
    'developer', 'programador', 'software engineer', 'data scientist',
    'employee relations', 'people', 'cultura organizacional'
  ];
  if (puestosExcluidos.some(exc => pue.includes(exc))) {
    return true;
  }
  
  return false;
};

const normalizarPuesto = (puesto: string): string => {
  // Limpiar y acortar puesto
  return puesto
    .replace(/\s+/g, ' ')
    .replace(/[,|\/\\-]+/g, ' ')
    .trim()
    .substring(0, 50);
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE FILTRO DESPLEGABLE
// ═══════════════════════════════════════════════════════════════════════════

const FilterSection = ({ 
  icon: Icon, 
  title, 
  count, 
  expanded, 
  onToggle, 
  children 
}: {
  icon: any;
  title: string;
  count?: number | string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) => (
  <div className="border-b border-gray-700/30">
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-white/5 transition-all text-left group"
    >
      {expanded ? <ChevronDown className="w-3.5 h-3.5 text-orange-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-300" />}
      <Icon className="w-4 h-4 text-blue-400" />
      <span className="text-sm font-medium text-gray-200 flex-1">{title}</span>
      {count !== undefined && (
        <span className="text-xs text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">{count}</span>
      )}
    </button>
    {expanded && (
      <div className="px-3 pb-3">
        {children}
      </div>
    )}
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export const ProspeccionIAModule = ({ onBack }: { onBack: () => void }) => {
  // Tab activa
  const [tabActiva, setTabActiva] = useState<'buscar' | 'respaldados'>('buscar');

  // Estados de filtros - TODOS VACÍOS POR DEFECTO
  const [useApollo, setUseApollo] = useState(true);
  const [useHunter, setUseHunter] = useState(false);
  const [soloVerificados, setSoloVerificados] = useState(false); // OFF por defecto
  const [todoMexico, setTodoMexico] = useState(true);
  const [zonasActivas, setZonasActivas] = useState<string[]>([]);
  const [empresaBusqueda, setEmpresaBusqueda] = useState('');
  const [jerarquiasActivas, setJerarquiasActivas] = useState<string[]>([]); // VACÍO
  const [funcionesActivas, setFuncionesActivas] = useState<string[]>([]); // VACÍO

  // Estados de UI
  const [expandedFilters, setExpandedFilters] = useState({
    fuente: true,
    ubicacion: true,
    jerarquia: true,
    funcion: true
  });
  const [porPagina, setPorPagina] = useState(100);
  const [paginaActual, setPaginaActual] = useState(1);

  // Estados de datos
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [contactosRespaldados, setContactosRespaldados] = useState<Contacto[]>([]);
  const [paginacion, setPaginacion] = useState({ total: 0, page: 0, pages: 0 });
  const [seleccionarTodos, setSeleccionarTodos] = useState(false);
  const [hoveredContacto, setHoveredContacto] = useState<string | null>(null);
  const [stats, setStats] = useState({ nuevos: 0, existentes: 0, total: 0 });
  
  // Modal y desbloqueo
  const [contactoSeleccionado, setContactoSeleccionado] = useState<Contacto | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [desbloqueando, setDesbloqueando] = useState<string | null>(null);
  const [confirmandoDesbloqueo, setConfirmandoDesbloqueo] = useState<string | null>(null);
  
  // Extracción masiva
  const [extrayendoTodo, setExtrayendoTodo] = useState(false);
  const [progresoExtraccion, setProgresoExtraccion] = useState({ pagina: 0, total: 0, guardados: 0 });
  const [cancelarExtraccion, setCancelarExtraccion] = useState(false);

  const toggleFilter = (key: keyof typeof expandedFilters) => {
    setExpandedFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // CARGAR RESPALDADOS AL INICIO
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (tabActiva === 'respaldados') {
      cargarRespaldados();
    }
  }, [tabActiva]);

  const cargarRespaldados = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('prospeccion_contactos')
        .select('*')
        .order('empresa', { ascending: true })
        .order('nombre', { ascending: true });

      if (!error && data) {
        setContactosRespaldados(data.map((c: any) => ({
          ...c,
          nombre_completo: `${c.nombre} ${c.apellido}`,
          es_nuevo: false,
          activo: !c.fecha_desaparicion,
          seleccionado: false
        })));
      }
    } catch (err) {
      console.error('Error cargando respaldados:', err);
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // LÓGICA DE BÚSQUEDA
  // ═══════════════════════════════════════════════════════════════════════════

  const construirTitulos = () => {
    // Si no hay filtros de jerarquía ni función seleccionados, NO enviar titles
    // Esto permite que Apollo devuelva TODOS los contactos de México (3.7M)
    if (jerarquiasActivas.length === 0 && funcionesActivas.length === 0) {
      return undefined; // No enviar titles = buscar todos
    }
    
    const titles: string[] = [];
    jerarquiasActivas.forEach(j => {
      const jer = JERARQUIAS.find(x => x.id === j);
      if (jer) titles.push(...jer.titles);
    });
    funcionesActivas.forEach(f => {
      const func = FUNCIONES.find(x => x.id === f);
      if (func) titles.push(...func.keywords);
    });
    return [...new Set(titles)].slice(0, 25);
  };

  const buscarEnApollo = async (page = 1) => {
    let ubicaciones: string[] = ['Mexico'];
    if (!todoMexico && zonasActivas.length > 0) {
      ubicaciones = zonasActivas.flatMap(z => ZONAS[z as keyof typeof ZONAS]?.estados || []).map(e => `${e}, Mexico`);
    }

    const titles = construirTitulos();

    // Construir params - solo incluir titles si hay filtros seleccionados
    const params: any = {
      locations: ubicaciones,
      company_name: empresaBusqueda.trim() || undefined,
      page,
      per_page: porPagina
    };
    
    // Solo agregar titles si hay filtros (no undefined)
    if (titles && titles.length > 0) {
      params.titles = titles;
    }

    console.log('Buscando con params:', params); // Debug

    const response = await fetch(`${SUPABASE_URL}/functions/v1/prospeccion-api`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
      body: JSON.stringify({
        action: 'apollo_search',
        params
      })
    });

    if (!response.ok) throw new Error('Error en búsqueda Apollo');
    return await response.json();
  };

  const procesarContactos = (rawContacts: any[]): Contacto[] => {
    const ahora = new Date().toISOString();
    
    return rawContacts
      .map((c: any) => {
        const puesto = c.puesto || '';
        const empresa = c.empresa || '';
        const industria = c.industria || '';
        const estado = c.estado || '';
        
        // Excluir empresas de lista negra
        if (esEmpresaExcluida(empresa, industria, puesto)) {
          return null;
        }

        const emailBloqueado = c.email === 'email_not_unlocked@domain.com';
        
        return {
          id: c.id,
          source_id: c.id,
          fuente: 'apollo' as const,
          nombre: c.nombre || '',
          apellido: c.apellido || '',
          nombre_completo: `${c.nombre || ''} ${c.apellido || ''}`.trim(),
          puesto_original: puesto,
          puesto_normalizado: normalizarPuesto(puesto),
          jerarquia: detectarJerarquia(puesto),
          funcion: detectarFuncion(puesto),
          empresa: empresa,
          dominio_empresa: '',
          industria: industria,
          pais: c.pais || 'Mexico',
          estado: estado,
          zona: detectarZona(estado),
          email: emailBloqueado ? '' : c.email,
          email_status: emailBloqueado ? 'locked' as const : (c.email ? 'verified' as const : 'none' as const),
          email_unlocked: !emailBloqueado && !!c.email,
          linkedin: c.linkedin || '',
          telefono: c.telefono || '',
          fecha_captura: ahora,
          fecha_ultima_aparicion: ahora,
          fecha_desaparicion: null,
          es_nuevo: true,
          activo: true,
          seleccionado: false
        };
      })
      .filter((c): c is Contacto => c !== null);
  };

  const handleBuscar = async () => {
    if (!useApollo && !useHunter) return;
    setLoading(true);
    setPaginaActual(1);
    
    try {
      const data = await buscarEnApollo(1);
      let contacts = procesarContactos(data.contacts || []);

      // Filtrar solo verificados si está activo
      if (soloVerificados) {
        contacts = contacts.filter(c => c.email_status === 'verified' || c.email_status === 'locked');
      }

      // FILTRAR SOLO MÉXICO - excluir otros países
      contacts = contacts.filter(c => {
        const pais = (c.pais || '').toLowerCase();
        const estado = (c.estado || '').toLowerCase();
        // Excluir si claramente es de otro país
        const paisesExcluidos = ['united states', 'usa', 'canada', 'brazil', 'argentina', 'chile', 'peru', 'colombia', 'spain', 'portugal'];
        const estadosUSA = ['california', 'texas', 'florida', 'new york', 'massachusetts', 'illinois', 'arizona', 'georgia', 'ohio', 'michigan'];
        
        if (paisesExcluidos.some(p => pais.includes(p))) return false;
        if (estadosUSA.some(e => estado.toLowerCase().includes(e))) return false;
        if (pais && !pais.includes('mexico') && !pais.includes('méxico')) return false;
        
        return true;
      });

      // Ordenar A-Z por empresa
      contacts.sort((a, b) => a.empresa.localeCompare(b.empresa) || a.nombre_completo.localeCompare(b.nombre_completo));

      setContactos(contacts);
      setPaginacion({ total: data.total || 0, page: 1, pages: data.total_pages || 0 });
      setStats({ nuevos: contacts.length, existentes: 0, total: contacts.length });
      setSeleccionarTodos(false);

      // Auto-guardar en Supabase
      await guardarEnSupabase(contacts);

    } catch (err) {
      console.error('Error en búsqueda:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCargarMas = async () => {
    if (loading || paginacion.page >= paginacion.pages) return;
    setLoading(true);
    
    try {
      const data = await buscarEnApollo(paginacion.page + 1);
      let newContacts = procesarContactos(data.contacts || []);

      if (soloVerificados) {
        newContacts = newContacts.filter(c => c.email_status === 'verified' || c.email_status === 'locked');
      }

      const allContacts = [...contactos, ...newContacts];
      allContacts.sort((a, b) => a.empresa.localeCompare(b.empresa) || a.nombre_completo.localeCompare(b.nombre_completo));

      setContactos(allContacts);
      setPaginacion(prev => ({ ...prev, page: prev.page + 1 }));

      // Auto-guardar nuevos
      await guardarEnSupabase(newContacts);

    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // GUARDAR EN SUPABASE (AUTO)
  // ═══════════════════════════════════════════════════════════════════════════

  const guardarEnSupabase = async (contacts: Contacto[]) => {
    if (contacts.length === 0) return;

    try {
      const datos = contacts.map(c => ({
        source_id: c.source_id,
        fuente: c.fuente,
        nombre: c.nombre,
        apellido: c.apellido,
        puesto_original: c.puesto_original,
        puesto_normalizado: c.puesto_normalizado,
        jerarquia: c.jerarquia,
        funcion: c.funcion,
        empresa: c.empresa,
        dominio_empresa: c.dominio_empresa,
        industria: c.industria,
        pais: c.pais,
        estado: c.estado,
        zona: c.zona,
        email: c.email || null,
        email_status: c.email_status,
        email_unlocked: c.email_unlocked,
        linkedin: c.linkedin,
        telefono: c.telefono,
        fecha_captura: c.fecha_captura,
        fecha_ultima_aparicion: c.fecha_ultima_aparicion
      }));

      // Batch insert con upsert
      for (let i = 0; i < datos.length; i += 100) {
        const batch = datos.slice(i, i + 100);
        await supabase
          .from('prospeccion_contactos')
          .upsert(batch, { 
            onConflict: 'source_id,fuente',
            ignoreDuplicates: false 
          });
      }
    } catch (err) {
      console.error('Error guardando en Supabase:', err);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // EXTRACCIÓN MASIVA Y EXPORTAR A EXCEL
  // ═══════════════════════════════════════════════════════════════════════════

  const extraerTodoYExportar = async () => {
    if (paginacion.total === 0) {
      alert('Primero realiza una búsqueda');
      return;
    }

    const totalPaginas = Math.ceil(paginacion.total / 100);
    const confirmacion = confirm(
      `¿Extraer ${paginacion.total.toLocaleString()} contactos?\n\n` +
      `• ${totalPaginas.toLocaleString()} páginas a procesar\n` +
      `• Se guardarán en base de datos\n` +
      `• Tiempo estimado: ${Math.ceil(totalPaginas * 1.5 / 60)} minutos\n` +
      `• Emails quedan bloqueados (se desbloquean después)\n\n` +
      `¿Continuar?`
    );

    if (!confirmacion) return;

    setExtrayendoTodo(true);
    setCancelarExtraccion(false);
    setProgresoExtraccion({ pagina: 0, total: totalPaginas, guardados: 0 });

    let todosLosContactos: any[] = [];
    let totalGuardados = 0;

    try {
      for (let pagina = 1; pagina <= totalPaginas; pagina++) {
        if (cancelarExtraccion) {
          alert(`Extracción cancelada en página ${pagina}. ${totalGuardados} contactos guardados.`);
          break;
        }

        setProgresoExtraccion(prev => ({ ...prev, pagina }));

        // Buscar página
        const { contacts } = await buscar(pagina);
        
        if (contacts.length === 0) break;

        // Guardar en Supabase inmediatamente
        await guardarEnSupabase(contacts);
        totalGuardados += contacts.length;
        todosLosContactos = [...todosLosContactos, ...contacts];

        setProgresoExtraccion(prev => ({ ...prev, guardados: totalGuardados }));

        // Pequeña pausa para no saturar la API
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Generar Excel con todo lo guardado
      if (todosLosContactos.length > 0) {
        generarExcel(todosLosContactos);
        alert(`✅ Extracción completada!\n\n${totalGuardados.toLocaleString()} contactos guardados y exportados.`);
      }

    } catch (err) {
      console.error('Error en extracción:', err);
      alert(`Error en extracción. ${totalGuardados} contactos guardados hasta el momento.`);
    } finally {
      setExtrayendoTodo(false);
      setProgresoExtraccion({ pagina: 0, total: 0, guardados: 0 });
    }
  };

  const generarExcel = (datos: Contacto[]) => {
    const headers = [
      'Empresa', 'Sector', 'Nombre', 'Apellido', 'Puesto',
      'Jerarquía', 'Función', 'Email', 'Email Status', 'Estado', 'Zona',
      'LinkedIn', 'Teléfono', 'Fuente', 'Fecha'
    ];

    const rows = datos.map(c => [
      c.empresa || '',
      c.industria || '',
      c.nombre || '',
      c.apellido || '',
      c.puesto_normalizado || c.puesto_original || '',
      c.jerarquia || '',
      c.funcion || '',
      c.email || '🔒 Bloqueado',
      c.email_status || 'locked',
      c.estado || '',
      c.zona || '',
      c.linkedin || '',
      c.telefono || '',
      c.fuente || 'apollo',
      new Date().toISOString().split('T')[0]
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `prospeccion_${datos.length}_contactos_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportarExcel = async () => {
    setExportando(true);
    
    try {
      // Cargar TODO desde Supabase (histórico perpetuo)
      const { data, error } = await supabase
        .from('prospeccion_contactos')
        .select('*')
        .order('empresa', { ascending: true })
        .order('nombre', { ascending: true });

      if (error) throw error;
      
      if (!data || data.length === 0) {
        alert('No hay contactos guardados en la base de datos.\n\nUsa el botón "Extraer Todo" para descargar y guardar contactos.');
        return;
      }

      generarExcel(data as Contacto[]);
      alert(`Exportados ${data.length.toLocaleString()} contactos del histórico`);

    } catch (err) {
      console.error('Error exportando:', err);
      alert('Error al exportar');
    } finally {
      setExportando(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // SELECCIÓN
  // ═══════════════════════════════════════════════════════════════════════════

  const toggleSeleccionarTodos = () => {
    const nuevoValor = !seleccionarTodos;
    setSeleccionarTodos(nuevoValor);
    const lista = tabActiva === 'respaldados' ? contactosRespaldados : contactos;
    const setter = tabActiva === 'respaldados' ? setContactosRespaldados : setContactos;
    setter(lista.map(c => ({ ...c, seleccionado: nuevoValor })));
  };

  const toggleSeleccionContacto = (id: string) => {
    const lista = tabActiva === 'respaldados' ? contactosRespaldados : contactos;
    const setter = tabActiva === 'respaldados' ? setContactosRespaldados : setContactos;
    setter(lista.map(c => c.id === id ? { ...c, seleccionado: !c.seleccionado } : c));
  };

  // Abrir modal de detalle
  const abrirDetalleContacto = (contacto: Contacto) => {
    setContactoSeleccionado(contacto);
    setMostrarModal(true);
  };

  // Desbloquear email via Apollo API
  const desbloquearEmail = async (contacto: Contacto) => {
    setDesbloqueando(contacto.id);
    setConfirmandoDesbloqueo(null);
    
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/prospeccion-api`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify({
          action: 'apollo_unlock',
          params: { person_id: contacto.source_id }
        })
      });

      if (!response.ok) throw new Error('Error al desbloquear');
      
      const data = await response.json();
      
      if (data.email) {
        // Actualizar contacto en lista
        const actualizarContacto = (c: Contacto) => 
          c.id === contacto.id 
            ? { ...c, email: data.email, email_status: 'verified' as const, email_unlocked: true }
            : c;
        
        setContactos(prev => prev.map(actualizarContacto));
        setContactosRespaldados(prev => prev.map(actualizarContacto));
        
        // Guardar en Supabase
        await supabase
          .from('prospeccion_contactos')
          .upsert({
            source_id: contacto.source_id,
            fuente: contacto.fuente,
            nombre: contacto.nombre,
            apellido: contacto.apellido,
            email: data.email,
            email_status: 'verified',
            email_unlocked: true,
            fecha_desbloqueo: new Date().toISOString(),
            empresa: contacto.empresa,
            industria: contacto.industria,
            puesto_original: contacto.puesto_original,
            puesto_normalizado: contacto.puesto_normalizado,
            jerarquia: contacto.jerarquia,
            funcion: contacto.funcion,
            estado: contacto.estado,
            zona: contacto.zona,
            linkedin: contacto.linkedin,
            telefono: contacto.telefono
          }, { onConflict: 'source_id,fuente' });

        alert(`✅ Email desbloqueado: ${data.email}`);
      } else {
        alert('No se pudo obtener el email');
      }
    } catch (err) {
      console.error('Error desbloqueando:', err);
      alert('Error al desbloquear email');
    } finally {
      setDesbloqueando(null);
    }
  };

  const toggleZona = (zona: string) => {
    setZonasActivas(prev => prev.includes(zona) ? prev.filter(z => z !== zona) : [...prev, zona]);
  };

  const limpiarFiltros = () => {
    setUseApollo(true);
    setUseHunter(false);
    setSoloVerificados(false);
    setTodoMexico(true);
    setZonasActivas([]);
    setEmpresaBusqueda('');
    setJerarquiasActivas([]); // VACÍO
    setFuncionesActivas([]); // VACÍO
  };

  const contactosActivos = tabActiva === 'respaldados' ? contactosRespaldados : contactos;
  const seleccionadosCount = contactosActivos.filter(c => c.seleccionado).length;

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="h-screen bg-gradient-to-br from-[#0d1117] via-[#111827] to-[#0d1117] text-gray-100 flex flex-col overflow-hidden">
      
      {/* ══════════════ HEADER ══════════════ */}
      <header className="h-14 bg-gradient-to-r from-[#1a1f2e] to-[#0d1117] border-b border-gray-700/50 flex items-center px-4 flex-shrink-0 shadow-lg">
        <button onClick={onBack} className="mr-3 p-1.5 hover:bg-white/10 rounded-lg transition-colors">
          <X className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Target className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-base">Prospección IA</span>
        </div>

        {/* Tabs */}
        <div className="flex ml-8 gap-2">
          <button
            onClick={() => setTabActiva('buscar')}
            className={`px-4 py-1.5 text-sm rounded-lg transition-all font-medium ${
              tabActiva === 'buscar' 
                ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/20' 
                : 'text-gray-400 hover:bg-white/10 hover:text-gray-200'
            }`}
          >
            <Search className="w-4 h-4 inline mr-1.5" />
            Buscar
          </button>
          <button
            onClick={() => setTabActiva('respaldados')}
            className={`px-4 py-1.5 text-sm rounded-lg transition-all font-medium ${
              tabActiva === 'respaldados' 
                ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/20' 
                : 'text-gray-400 hover:bg-white/10 hover:text-gray-200'
            }`}
          >
            <History className="w-4 h-4 inline mr-1.5" />
            Respaldados
          </button>
        </div>

        <div className="flex-1" />

        {/* Checkbox emails verificados */}
        <label className="flex items-center gap-2 text-sm text-gray-400 mr-4 cursor-pointer hover:text-gray-200 transition-colors">
          <input
            type="checkbox"
            checked={soloVerificados}
            onChange={e => setSoloVerificados(e.target.checked)}
            className="w-4 h-4 rounded border-gray-600 bg-gray-800 checked:bg-blue-600"
          />
          <UserCheck className="w-4 h-4" />
          Solo verificados
        </label>

        {/* Contador */}
        {contactosActivos.length > 0 && (
          <span className="text-sm text-gray-400 mr-4">
            {contactosActivos.length.toLocaleString()} mostrados
            {paginacion.total > 0 && (
              <span className="text-orange-400 font-semibold ml-1">
                ({paginacion.total >= 1000000 
                  ? `${(paginacion.total / 1000000).toFixed(1)}M` 
                  : paginacion.total >= 1000 
                    ? `${(paginacion.total / 1000).toFixed(0)}K`
                    : paginacion.total
                } disponibles)
              </span>
            )}
          </span>
        )}

        {/* Botones */}
        {extrayendoTodo ? (
          <div className="flex items-center gap-3 mr-2">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
                <span className="text-sm text-orange-400 font-medium">
                  Extrayendo... Pág {progresoExtraccion.pagina.toLocaleString()}/{progresoExtraccion.total.toLocaleString()}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {progresoExtraccion.guardados.toLocaleString()} guardados
              </span>
            </div>
            <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-300"
                style={{ width: `${(progresoExtraccion.pagina / progresoExtraccion.total) * 100}%` }}
              />
            </div>
            <button
              onClick={() => setCancelarExtraccion(true)}
              className="px-2 py-1 text-xs bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded transition-colors"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={extraerTodoYExportar}
              disabled={paginacion.total === 0}
              title={`Extraer y guardar ${paginacion.total.toLocaleString()} contactos`}
              className="px-3 py-1.5 text-sm text-white bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center gap-1.5 mr-2 transition-all shadow-lg shadow-green-500/20"
            >
              <Download className="w-4 h-4" />
              Extraer Todo
            </button>
            <button
              onClick={exportarExcel}
              disabled={exportando}
              title="Exportar contactos guardados en base de datos"
              className="px-3 py-1.5 text-sm text-gray-300 hover:text-white bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 rounded-lg flex items-center gap-1.5 mr-2 transition-all"
            >
              {exportando ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
              Excel (BD)
            </button>
          </>
        )}

        {tabActiva === 'buscar' && (
          <>
            <button
              onClick={limpiarFiltros}
              className="px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-white/10 rounded-lg mr-2 transition-all"
            >
              Limpiar
            </button>
            <button
              onClick={handleBuscar}
              disabled={loading || (!useApollo && !useHunter)}
              className="px-4 py-1.5 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 disabled:opacity-50 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-lg shadow-orange-500/20 transition-all"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Buscar
            </button>
          </>
        )}

        {tabActiva === 'respaldados' && (
          <button
            onClick={cargarRespaldados}
            disabled={loading}
            className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Actualizar
          </button>
        )}
      </header>

      {/* ══════════════ CONTENIDO PRINCIPAL ══════════════ */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ══════════════ PANEL FILTROS ══════════════ */}
        {tabActiva === 'buscar' && (
          <aside className="w-60 bg-gradient-to-b from-[#1a1f2e] to-[#151921] border-r border-gray-700/50 flex flex-col overflow-hidden shadow-xl">
            <div className="flex-1 overflow-y-auto">
              
              {/* Búsqueda por empresa */}
              <div className="p-3 border-b border-gray-700/50">
                <label className="text-[10px] text-gray-500 uppercase mb-1 block">Buscar empresa</label>
                <input
                  type="text"
                  placeholder="Ej: Bimbo, Coca-Cola..."
                  value={empresaBusqueda}
                  onChange={e => setEmpresaBusqueda(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleBuscar()}
                  className="w-full px-3 py-2.5 bg-gray-900/80 border border-gray-600/50 rounded-lg text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 outline-none placeholder-gray-500 transition-all"
                />
              </div>

              {/* FUENTE */}
              <FilterSection
                icon={Database}
                title="Fuente"
                expanded={expandedFilters.fuente}
                onToggle={() => toggleFilter('fuente')}
              >
                <div className="flex gap-2">
                  <button
                    onClick={() => setUseApollo(!useApollo)}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                      useApollo 
                        ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg shadow-orange-500/20' 
                        : 'bg-gray-800/80 text-gray-400 hover:bg-gray-700 border border-gray-700'
                    }`}
                  >
                    Apollo
                  </button>
                  <button
                    onClick={() => setUseHunter(!useHunter)}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                      useHunter 
                        ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-500/20' 
                        : 'bg-gray-800/80 text-gray-400 hover:bg-gray-700 border border-gray-700'
                    }`}
                  >
                    Hunter
                  </button>
                </div>
              </FilterSection>

              {/* UBICACIÓN */}
              <FilterSection
                icon={MapPin}
                title="Ubicación"
                count={todoMexico ? 'MX' : zonasActivas.length}
                expanded={expandedFilters.ubicacion}
                onToggle={() => toggleFilter('ubicacion')}
              >
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-white/5 p-1.5 rounded-lg transition-colors">
                    <input
                      type="checkbox"
                      checked={todoMexico}
                      onChange={e => setTodoMexico(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-800 checked:bg-blue-600"
                    />
                    <Globe className="w-4 h-4 text-blue-400" />
                    Todo México
                  </label>
                  
                  {!todoMexico && (
                    <div className="space-y-1 pt-2 border-t border-gray-700/30 mt-2">
                      {Object.entries(ZONAS).map(([key, zona]) => (
                        <label key={key} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-white/5 p-1.5 rounded-lg transition-colors">
                          <input
                            type="checkbox"
                            checked={zonasActivas.includes(key)}
                            onChange={() => toggleZona(key)}
                            className="w-4 h-4 rounded border-gray-600 bg-gray-800 checked:bg-blue-600"
                          />
                          <span className="flex-1">{zona.nombre}</span>
                          <span className="text-gray-500 text-xs">{zona.estados.length}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </FilterSection>

              {/* JERARQUÍA */}
              <FilterSection
                icon={Users}
                title="Jerarquía"
                count={jerarquiasActivas.length}
                expanded={expandedFilters.jerarquia}
                onToggle={() => toggleFilter('jerarquia')}
              >
                <div className="space-y-1">
                  {JERARQUIAS.map(jer => (
                    <label key={jer.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-white/5 p-1.5 rounded-lg transition-colors">
                      <input
                        type="checkbox"
                        checked={jerarquiasActivas.includes(jer.id)}
                        onChange={() => setJerarquiasActivas(prev =>
                          prev.includes(jer.id) ? prev.filter(j => j !== jer.id) : [...prev, jer.id]
                        )}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-800 checked:bg-blue-600"
                      />
                      <span>{jer.nombre}</span>
                    </label>
                  ))}
                </div>
              </FilterSection>

              {/* FUNCIÓN */}
              <FilterSection
                icon={Briefcase}
                title="Función"
                count={funcionesActivas.length}
                expanded={expandedFilters.funcion}
                onToggle={() => toggleFilter('funcion')}
              >
                <div className="space-y-1">
                  {FUNCIONES.map(func => (
                    <label key={func.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-white/5 p-1.5 rounded-lg transition-colors">
                      <input
                        type="checkbox"
                        checked={funcionesActivas.includes(func.id)}
                        onChange={() => setFuncionesActivas(prev =>
                          prev.includes(func.id) ? prev.filter(f => f !== func.id) : [...prev, func.id]
                        )}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-800 checked:bg-blue-600"
                      />
                      <span>{func.nombre}</span>
                    </label>
                  ))}
                </div>
              </FilterSection>

            </div>
          </aside>
        )}

        {/* ══════════════ PANEL RESULTADOS (LISTA) ══════════════ */}
        <main className="flex-1 bg-gradient-to-br from-[#0d1117] to-[#111827] flex flex-col overflow-hidden">
          
          {/* Subheader */}
          {contactosActivos.length > 0 && (
            <div className="h-12 bg-gradient-to-r from-[#1a1f2e]/80 to-transparent border-b border-gray-700/30 flex items-center px-4 flex-shrink-0 text-sm">
              <label className="flex items-center gap-2 cursor-pointer hover:bg-white/5 px-2 py-1 rounded-lg transition-colors">
                <input
                  type="checkbox"
                  checked={seleccionarTodos}
                  onChange={toggleSeleccionarTodos}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 checked:bg-blue-600"
                />
                <span className="text-gray-300">Todos</span>
              </label>
              
              {seleccionadosCount > 0 && (
                <span className="ml-3 px-2 py-0.5 bg-blue-900/30 text-blue-400 rounded text-[10px]">
                  {seleccionadosCount} sel.
                </span>
              )}

              <div className="flex-1" />

              {/* Paginación */}
              <span className="text-gray-500 mr-2">
                Pág {paginacion.page} de {paginacion.pages}
              </span>
              
              {tabActiva === 'buscar' && paginacion.page < paginacion.pages && (
                <button
                  onClick={handleCargarMas}
                  disabled={loading}
                  className="px-2 py-0.5 bg-gray-800 hover:bg-gray-700 rounded text-[10px] flex items-center gap-1"
                >
                  {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : '+50'}
                </button>
              )}

              <select
                value={porPagina}
                onChange={e => setPorPagina(Number(e.target.value))}
                className="ml-2 bg-gray-800 border border-gray-700 rounded text-[10px] px-1 py-0.5"
              >
                <option value={50}>50/pág</option>
                <option value={100}>100/pág</option>
              </select>
            </div>
          )}

          {/* Lista de contactos */}
          <div className="flex-1 overflow-y-auto">
            {contactosActivos.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-600">
                <div className="text-center">
                  <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">{tabActiva === 'buscar' ? 'Configura filtros y busca' : 'Sin contactos respaldados'}</p>
                  <p className="text-xs mt-1 text-gray-700">Los resultados se guardan automáticamente</p>
                </div>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-[#1a1f2e] to-[#151921] sticky top-0 z-10">
                  <tr className="text-left text-gray-400 border-b border-gray-700/50">
                    <th className="w-10 p-3"></th>
                    <th className="p-3 font-semibold">Empresa</th>
                    <th className="p-3 font-semibold w-36">Sector</th>
                    <th className="p-3 font-semibold">Contacto</th>
                    <th className="p-3 font-semibold">Puesto</th>
                    <th className="p-3 font-semibold w-24">Jerarquía</th>
                    <th className="p-3 font-semibold w-28">Función</th>
                    <th className="p-3 font-semibold w-32">Email</th>
                    <th className="p-3 font-semibold w-28">Estado</th>
                    <th className="p-3 font-semibold w-20">Fuente</th>
                  </tr>
                </thead>
                <tbody>
                  {contactosActivos.map(c => (
                    <tr
                      key={c.id}
                      onMouseEnter={() => setHoveredContacto(c.id)}
                      onMouseLeave={() => setHoveredContacto(null)}
                      className={`border-b border-gray-800/30 cursor-pointer transition-all duration-150 ${
                        c.seleccionado 
                          ? 'bg-blue-900/30 border-l-2 border-l-blue-500' 
                          : hoveredContacto === c.id 
                            ? 'bg-gradient-to-r from-white/5 to-transparent' 
                            : 'hover:bg-white/[0.02]'
                      } ${!c.activo ? 'opacity-50' : ''}`}
                    >
                      <td className="p-3" onClick={(e) => { e.stopPropagation(); toggleSeleccionContacto(c.id); }}>
                        <input
                          type="checkbox"
                          checked={c.seleccionado}
                          onChange={() => {}}
                          className="w-4 h-4 rounded border-gray-600 bg-gray-800 checked:bg-blue-600 cursor-pointer"
                        />
                      </td>
                      <td className="p-3" onClick={() => abrirDetalleContacto(c)}>
                        <span className="text-blue-400 font-semibold truncate block max-w-[180px] hover:text-blue-300" title={c.empresa}>
                          {c.empresa}
                        </span>
                      </td>
                      <td className="p-3" onClick={() => abrirDetalleContacto(c)}>
                        <span className="text-gray-400 text-xs truncate block max-w-[140px]" title={c.industria}>
                          {c.industria || '—'}
                        </span>
                      </td>
                      <td className="p-3" onClick={() => abrirDetalleContacto(c)}>
                        <span className="text-gray-100 font-medium truncate block max-w-[150px]" title={c.nombre_completo}>
                          {c.nombre_completo}
                        </span>
                        {c.linkedin && (
                          <a
                            href={c.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="text-blue-500 hover:text-blue-400 inline-flex items-center gap-1 mt-0.5"
                          >
                            <Linkedin className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </td>
                      <td className="p-3" onClick={() => abrirDetalleContacto(c)}>
                        <span className="text-gray-300 truncate block max-w-[150px]" title={c.puesto_original}>
                          {c.puesto_normalizado}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                          c.jerarquia === 'Owner' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          c.jerarquia === 'C-Level' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                          c.jerarquia === 'Director' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                          c.jerarquia === 'Gerente' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                          'bg-gray-700/50 text-gray-400 border border-gray-600/30'
                        }`}>
                          {c.jerarquia}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                          c.funcion === 'Dirección General' ? 'bg-indigo-500/20 text-indigo-400' :
                          c.funcion === 'Operaciones / Planta' ? 'bg-cyan-500/20 text-cyan-400' :
                          c.funcion === 'Supply Chain' ? 'bg-teal-500/20 text-teal-400' :
                          c.funcion === 'Compras' ? 'bg-emerald-500/20 text-emerald-400' :
                          c.funcion === 'Comercio Exterior' ? 'bg-sky-500/20 text-sky-400' :
                          'bg-gray-700/50 text-gray-400'
                        }`}>
                          {c.funcion}
                        </span>
                      </td>
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        {c.email_status === 'locked' ? (
                          confirmandoDesbloqueo === c.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => desbloquearEmail(c)}
                                disabled={desbloqueando === c.id}
                                className="text-xs bg-green-600 hover:bg-green-500 text-white px-2 py-1 rounded font-medium"
                              >
                                {desbloqueando === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Sí'}
                              </button>
                              <button
                                onClick={() => setConfirmandoDesbloqueo(null)}
                                className="text-xs bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 rounded"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmandoDesbloqueo(c.id)}
                              className="text-yellow-400 flex items-center gap-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 px-2 py-1 rounded-md transition-colors cursor-pointer"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              <span className="text-xs font-medium">Bloqueado</span>
                            </button>
                          )
                        ) : c.email ? (
                          <span className="text-green-400 truncate block max-w-[130px] text-xs" title={c.email}>
                            {c.email}
                          </span>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="text-gray-400 flex items-center gap-1.5 text-xs">
                          <MapPin className="w-3.5 h-3.5 text-gray-500" />
                          {c.estado || c.zona || '—'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`text-xs px-2 py-1 rounded-md font-medium ${
                          c.fuente === 'apollo' 
                            ? 'bg-gradient-to-r from-orange-600/20 to-orange-500/10 text-orange-400 border border-orange-500/30' 
                            : 'bg-gradient-to-r from-purple-600/20 to-purple-500/10 text-purple-400 border border-purple-500/30'
                        }`}>
                          {c.fuente}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>

      {/* Tooltip hover */}
      {hoveredContacto && (
        <div className="fixed bottom-4 right-4 bg-gradient-to-br from-[#1e2433] to-[#151921] border border-gray-600/50 rounded-xl p-4 shadow-2xl text-sm z-50 max-w-sm backdrop-blur-sm">
          {(() => {
            const c = contactosActivos.find(x => x.id === hoveredContacto);
            if (!c) return null;
            return (
              <>
                <p className="text-gray-400 mb-1"><strong>Puesto original:</strong> {c.puesto_original}</p>
                <p className="text-gray-400 mb-1"><strong>Jerarquía:</strong> {c.jerarquia}</p>
                <p className="text-gray-400 mb-1"><strong>Función:</strong> {c.funcion}</p>
                <p className="text-gray-400"><strong>Zona:</strong> {c.zona}</p>
              </>
            );
          })()}
        </div>
      )}

      {/* Modal de detalle del contacto */}
      {mostrarModal && contactoSeleccionado && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setMostrarModal(false)}>
          <div 
            className="bg-gradient-to-br from-[#1e2433] to-[#151921] border border-gray-600/50 rounded-2xl p-6 shadow-2xl max-w-lg w-full mx-4"
            onClick={e => e.stopPropagation()}
          >
            {/* Header del modal */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">{contactoSeleccionado.nombre_completo}</h2>
                <p className="text-blue-400 font-medium">{contactoSeleccionado.empresa}</p>
                <p className="text-gray-400 text-sm">{contactoSeleccionado.puesto_original}</p>
              </div>
              <button 
                onClick={() => setMostrarModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Info del contacto */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-gray-500 text-xs uppercase mb-1">Sector</p>
                <p className="text-gray-200">{contactoSeleccionado.industria || '—'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase mb-1">Ubicación</p>
                <p className="text-gray-200">{contactoSeleccionado.estado || contactoSeleccionado.zona || '—'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase mb-1">Jerarquía</p>
                <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                  contactoSeleccionado.jerarquia === 'Owner' ? 'bg-amber-500/20 text-amber-400' :
                  contactoSeleccionado.jerarquia === 'C-Level' ? 'bg-purple-500/20 text-purple-400' :
                  contactoSeleccionado.jerarquia === 'Director' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  {contactoSeleccionado.jerarquia}
                </span>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase mb-1">Función</p>
                <span className="px-2 py-1 rounded-md text-xs font-medium bg-gray-700/50 text-gray-300">
                  {contactoSeleccionado.funcion}
                </span>
              </div>
            </div>

            {/* Email */}
            <div className="bg-gray-800/50 rounded-xl p-4 mb-6">
              <p className="text-gray-500 text-xs uppercase mb-2">Email</p>
              {contactoSeleccionado.email_status === 'locked' ? (
                <div className="flex items-center justify-between">
                  <span className="text-yellow-400 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Email bloqueado
                  </span>
                  <button
                    onClick={() => desbloquearEmail(contactoSeleccionado)}
                    disabled={desbloqueando === contactoSeleccionado.id}
                    className="px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 rounded-lg font-medium text-sm flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    {desbloqueando === contactoSeleccionado.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Unlock className="w-4 h-4" />
                    )}
                    Desbloquear
                  </button>
                </div>
              ) : (
                <p className="text-green-400 text-lg">{contactoSeleccionado.email}</p>
              )}
            </div>

            {/* Links */}
            <div className="flex gap-3">
              {contactoSeleccionado.linkedin && (
                <a
                  href={contactoSeleccionado.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg text-center text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Linkedin className="w-4 h-4" />
                  Ver LinkedIn
                </a>
              )}
              <button
                onClick={() => {
                  // Guardar contacto en Supabase
                  guardarEnSupabase([contactoSeleccionado]);
                  alert('Contacto guardado en base de datos');
                }}
                className="flex-1 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg text-center text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProspeccionIAModule;
