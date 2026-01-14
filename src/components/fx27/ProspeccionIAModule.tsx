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
  <div className="border-b border-gray-700/50">
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors text-left"
    >
      {expanded ? <ChevronDown className="w-3 h-3 text-gray-400" /> : <ChevronRight className="w-3 h-3 text-gray-400" />}
      <Icon className="w-3.5 h-3.5 text-gray-400" />
      <span className="text-xs font-medium text-gray-200 flex-1">{title}</span>
      {count !== undefined && (
        <span className="text-[10px] text-gray-500 bg-gray-800 px-1.5 rounded">{count}</span>
      )}
    </button>
    {expanded && (
      <div className="px-3 pb-2 max-h-40 overflow-y-auto">
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
  const [porPagina, setPorPagina] = useState(50);
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
    const titles: string[] = [];
    
    // Si no hay filtros seleccionados, usar lista AMPLIA por defecto
    if (jerarquiasActivas.length === 0 && funcionesActivas.length === 0) {
      return [
        // C-Level y Dirección
        'CEO', 'COO', 'CFO', 'Director General', 'President', 'Owner', 'Founder',
        'Managing Director', 'General Manager', 'Country Manager',
        // Directores
        'Director', 'VP', 'Vice President', 'Director de Operaciones', 
        'Director de Logística', 'Director de Supply Chain', 'Director de Compras',
        'Director de Planta', 'Director Comercial', 'Director de Producción',
        // Gerentes
        'Gerente', 'Manager', 'Gerente de Operaciones', 'Gerente de Logística',
        'Gerente de Planta', 'Gerente de Compras', 'Gerente de Supply Chain',
        'Gerente de Almacén', 'Gerente de Distribución', 'Gerente de Producción',
        'Plant Manager', 'Operations Manager', 'Supply Chain Manager',
        'Logistics Manager', 'Procurement Manager', 'Purchasing Manager',
        'Warehouse Manager', 'Distribution Manager',
        // Comercio Exterior
        'Import', 'Export', 'Comercio Exterior', 'Trade', 'International'
      ];
    }
    
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

    const params: any = {
      locations: ubicaciones,
      titles: titles, // Siempre enviar titles
      company_name: empresaBusqueda.trim() || undefined,
      page,
      per_page: porPagina
    };

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
  // EXPORTAR A EXCEL - TODO EL HISTÓRICO DE SUPABASE
  // ═══════════════════════════════════════════════════════════════════════════

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
      
      const datos = data || [];
      
      // Crear CSV
      const headers = [
        'Empresa', 'Nombre', 'Apellido', 'Puesto Original', 'Puesto Normalizado',
        'Jerarquía', 'Función', 'Email', 'Email Status', 'Estado', 'Zona',
        'Industria', 'LinkedIn', 'Teléfono', 'Fuente', 'Fecha Captura', 'Activo'
      ];

      const rows = datos.map((c: any) => [
        c.empresa || '',
        c.nombre || '',
        c.apellido || '',
        c.puesto_original || c.puesto || '',
        c.puesto_normalizado || '',
        c.jerarquia || '',
        c.funcion || '',
        c.email || '🔒 Bloqueado',
        c.email_status || 'locked',
        c.estado || '',
        c.zona || '',
        c.industria || '',
        c.linkedin || '',
        c.telefono || '',
        c.fuente || 'apollo',
        c.fecha_captura || c.created_at || '',
        c.activo ? 'Sí' : 'No'
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `prospeccion_historico_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      alert(`Exportados ${datos.length} contactos del histórico`);

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
    <div className="h-screen bg-[#0d1117] text-gray-100 flex flex-col overflow-hidden">
      
      {/* ══════════════ HEADER ══════════════ */}
      <header className="h-11 bg-[#161b22] border-b border-gray-800 flex items-center px-3 flex-shrink-0">
        <button onClick={onBack} className="mr-2 p-1 hover:bg-white/10 rounded">
          <X className="w-4 h-4" />
        </button>
        
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-orange-500" />
          <span className="font-semibold text-sm">Prospección IA</span>
        </div>

        {/* Tabs */}
        <div className="flex ml-6 gap-1">
          <button
            onClick={() => setTabActiva('buscar')}
            className={`px-3 py-1 text-xs rounded transition-all ${
              tabActiva === 'buscar' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-400 hover:bg-white/10'
            }`}
          >
            <Search className="w-3 h-3 inline mr-1" />
            Buscar
          </button>
          <button
            onClick={() => setTabActiva('respaldados')}
            className={`px-3 py-1 text-xs rounded transition-all ${
              tabActiva === 'respaldados' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-400 hover:bg-white/10'
            }`}
          >
            <History className="w-3 h-3 inline mr-1" />
            Respaldados
          </button>
        </div>

        <div className="flex-1" />

        {/* Checkbox emails verificados */}
        <label className="flex items-center gap-1.5 text-xs text-gray-400 mr-4">
          <input
            type="checkbox"
            checked={soloVerificados}
            onChange={e => setSoloVerificados(e.target.checked)}
            className="w-3 h-3 rounded"
          />
          <UserCheck className="w-3 h-3" />
          Solo verificados
        </label>

        {/* Contador */}
        {contactosActivos.length > 0 && (
          <span className="text-xs text-gray-500 mr-3">
            {contactosActivos.length.toLocaleString()} contactos
          </span>
        )}

        {/* Botones */}
        <button
          onClick={exportarExcel}
          disabled={exportando || contactosActivos.length === 0}
          className="px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-white/10 rounded flex items-center gap-1 mr-2"
        >
          {exportando ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileSpreadsheet className="w-3 h-3" />}
          Excel
        </button>

        {tabActiva === 'buscar' && (
          <>
            <button
              onClick={limpiarFiltros}
              className="px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-white/10 rounded mr-2"
            >
              Limpiar
            </button>
            <button
              onClick={handleBuscar}
              disabled={loading || (!useApollo && !useHunter)}
              className="px-3 py-1 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 rounded text-xs font-medium flex items-center gap-1"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
              Buscar
            </button>
          </>
        )}

        {tabActiva === 'respaldados' && (
          <button
            onClick={cargarRespaldados}
            disabled={loading}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded text-xs font-medium flex items-center gap-1"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            Actualizar
          </button>
        )}
      </header>

      {/* ══════════════ CONTENIDO PRINCIPAL ══════════════ */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ══════════════ PANEL FILTROS ══════════════ */}
        {tabActiva === 'buscar' && (
          <aside className="w-56 bg-[#161b22] border-r border-gray-800 flex flex-col overflow-hidden">
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
                  className="w-full px-2 py-1.5 bg-gray-900 border border-gray-700 rounded text-xs focus:border-orange-500 outline-none"
                />
              </div>

              {/* FUENTE */}
              <FilterSection
                icon={Database}
                title="Fuente"
                expanded={expandedFilters.fuente}
                onToggle={() => toggleFilter('fuente')}
              >
                <div className="flex gap-1">
                  <button
                    onClick={() => setUseApollo(!useApollo)}
                    className={`flex-1 py-1 rounded text-[10px] font-medium transition-all ${
                      useApollo ? 'bg-orange-600 text-white' : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    Apollo
                  </button>
                  <button
                    onClick={() => setUseHunter(!useHunter)}
                    className={`flex-1 py-1 rounded text-[10px] font-medium transition-all ${
                      useHunter ? 'bg-orange-600 text-white' : 'bg-gray-800 text-gray-400'
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
                <div className="space-y-1">
                  <label className="flex items-center gap-1.5 text-[10px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={todoMexico}
                      onChange={e => setTodoMexico(e.target.checked)}
                      className="w-3 h-3 rounded"
                    />
                    <Globe className="w-3 h-3 text-blue-400" />
                    Todo México
                  </label>
                  
                  {!todoMexico && (
                    <div className="space-y-0.5 pt-1 border-t border-gray-700/50 mt-1">
                      {Object.entries(ZONAS).map(([key, zona]) => (
                        <label key={key} className="flex items-center gap-1.5 text-[10px] cursor-pointer hover:bg-white/5 p-0.5 rounded">
                          <input
                            type="checkbox"
                            checked={zonasActivas.includes(key)}
                            onChange={() => toggleZona(key)}
                            className="w-3 h-3 rounded"
                          />
                          <span className="flex-1">{zona.nombre}</span>
                          <span className="text-gray-600">{zona.estados.length}</span>
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
                <div className="space-y-0.5">
                  {JERARQUIAS.map(jer => (
                    <label key={jer.id} className="flex items-center gap-1.5 text-[10px] cursor-pointer hover:bg-white/5 p-0.5 rounded">
                      <input
                        type="checkbox"
                        checked={jerarquiasActivas.includes(jer.id)}
                        onChange={() => setJerarquiasActivas(prev =>
                          prev.includes(jer.id) ? prev.filter(j => j !== jer.id) : [...prev, jer.id]
                        )}
                        className="w-3 h-3 rounded"
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
                <div className="space-y-0.5">
                  {FUNCIONES.map(func => (
                    <label key={func.id} className="flex items-center gap-1.5 text-[10px] cursor-pointer hover:bg-white/5 p-0.5 rounded">
                      <input
                        type="checkbox"
                        checked={funcionesActivas.includes(func.id)}
                        onChange={() => setFuncionesActivas(prev =>
                          prev.includes(func.id) ? prev.filter(f => f !== func.id) : [...prev, func.id]
                        )}
                        className="w-3 h-3 rounded"
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
        <main className="flex-1 bg-[#0d1117] flex flex-col overflow-hidden">
          
          {/* Subheader */}
          {contactosActivos.length > 0 && (
            <div className="h-9 bg-[#161b22] border-b border-gray-800 flex items-center px-3 flex-shrink-0 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={seleccionarTodos}
                  onChange={toggleSeleccionarTodos}
                  className="w-3 h-3 rounded"
                />
                <span className="text-gray-400">Todos</span>
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
                <option value={50}>50</option>
                <option value={100}>100</option>
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
              <table className="w-full text-xs">
                <thead className="bg-[#161b22] sticky top-0 z-10">
                  <tr className="text-left text-gray-500 border-b border-gray-800">
                    <th className="w-8 p-2"></th>
                    <th className="p-2 font-medium">Empresa</th>
                    <th className="p-2 font-medium">Contacto</th>
                    <th className="p-2 font-medium">Puesto</th>
                    <th className="p-2 font-medium w-20">Jerarquía</th>
                    <th className="p-2 font-medium w-24">Función</th>
                    <th className="p-2 font-medium w-28">Email</th>
                    <th className="p-2 font-medium w-24">Estado</th>
                    <th className="p-2 font-medium w-16">Fuente</th>
                  </tr>
                </thead>
                <tbody>
                  {contactosActivos.map(c => (
                    <tr
                      key={c.id}
                      onClick={() => toggleSeleccionContacto(c.id)}
                      onMouseEnter={() => setHoveredContacto(c.id)}
                      onMouseLeave={() => setHoveredContacto(null)}
                      className={`border-b border-gray-800/50 cursor-pointer transition-colors ${
                        c.seleccionado 
                          ? 'bg-blue-900/20' 
                          : hoveredContacto === c.id 
                            ? 'bg-white/5' 
                            : ''
                      } ${!c.activo ? 'opacity-50' : ''}`}
                    >
                      <td className="p-2">
                        <input
                          type="checkbox"
                          checked={c.seleccionado}
                          onChange={() => {}}
                          className="w-3 h-3 rounded"
                        />
                      </td>
                      <td className="p-2">
                        <span className="text-blue-400 font-medium truncate block max-w-[180px]" title={c.empresa}>
                          {c.empresa}
                        </span>
                        {c.industria && (
                          <span className="text-gray-600 text-[10px] truncate block">{c.industria}</span>
                        )}
                      </td>
                      <td className="p-2">
                        <span className="text-gray-200 truncate block max-w-[150px]" title={c.nombre_completo}>
                          {c.nombre_completo}
                        </span>
                        {c.linkedin && (
                          <a
                            href={c.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="text-blue-500 hover:text-blue-400"
                          >
                            <Linkedin className="w-3 h-3 inline" />
                          </a>
                        )}
                      </td>
                      <td className="p-2">
                        <span className="text-gray-400 truncate block max-w-[150px]" title={c.puesto_original}>
                          {c.puesto_normalizado}
                        </span>
                      </td>
                      <td className="p-2">
                        <span className="px-1.5 py-0.5 bg-gray-800 rounded text-[10px] text-gray-300">
                          {c.jerarquia}
                        </span>
                      </td>
                      <td className="p-2">
                        <span className="px-1.5 py-0.5 bg-gray-800 rounded text-[10px] text-gray-300">
                          {c.funcion}
                        </span>
                      </td>
                      <td className="p-2">
                        {c.email_status === 'locked' ? (
                          <span className="text-yellow-500 flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            <span className="text-[10px]">Bloqueado</span>
                          </span>
                        ) : c.email ? (
                          <span className="text-green-400 truncate block max-w-[120px]" title={c.email}>
                            {c.email}
                          </span>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                      <td className="p-2">
                        <span className="text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {c.estado || c.zona || '—'}
                        </span>
                      </td>
                      <td className="p-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                          c.fuente === 'apollo' ? 'bg-orange-900/30 text-orange-400' : 'bg-purple-900/30 text-purple-400'
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
        <div className="fixed bottom-4 right-4 bg-[#1c2128] border border-gray-700 rounded-lg p-3 shadow-xl text-xs z-50 max-w-xs">
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
    </div>
  );
};

export default ProspeccionIAModule;
