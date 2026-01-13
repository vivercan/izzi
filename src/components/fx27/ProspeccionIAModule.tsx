// ═══════════════════════════════════════════════════════════════════════════
// PROSPECCIÓN IA MODULE v2 - Integración Apollo + Hunter + Claude AI
// Solo accesible para: juan.viveros@trob.com.mx
// MEJORAS: Zonas, Checkboxes, Búsqueda empresa, C-Level, Segmentos
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useRef } from 'react';
import { 
  Search, Filter, Download, Loader2, CheckCircle2, XCircle, 
  Building2, User, Mail, MapPin, Briefcase, Sparkles, 
  RefreshCw, ChevronDown, ChevronUp, Send, Bot, Trash2,
  Globe, Target, Users, AlertCircle, Check, X, Crown, Factory
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE APIs
// ═══════════════════════════════════════════════════════════════════════════
// Las API keys de Apollo y Hunter están en Supabase Edge Function (evita CORS)
// Solo Anthropic se llama directo desde el browser (soporta CORS)
const SUPABASE_URL = 'https://fbxbsslhewchyibdoyzk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieGJzc2xoZXdjaHlpYmRveXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzczODEsImV4cCI6MjA3ODExMzM4MX0.Z8JPlg7hhKbA624QGHp2bKKTNtCD3WInQMO5twjl6a0';
const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || '';

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════
interface Contacto {
  id: string;
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
  fuente: 'apollo' | 'hunter' | 'ambos';
  prioridad: 'A' | 'B' | 'C' | null;
  razonPrioridad?: string;
  excluido: boolean;
  razonExclusion?: string;
}

interface MensajeChat {
  role: 'user' | 'assistant';
  content: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// ZONAS DE MÉXICO
// ═══════════════════════════════════════════════════════════════════════════
const ZONAS_MEXICO: { [key: string]: { nombre: string; color: string; estados: string[] } } = {
  norte: {
    nombre: 'Norte',
    color: '#3b82f6',
    estados: ['Chihuahua', 'Coahuila', 'Nuevo León', 'Tamaulipas', 'Sonora', 'Baja California', 'Baja California Sur', 'Durango', 'Sinaloa']
  },
  bajio: {
    nombre: 'Bajío',
    color: '#22c55e',
    estados: ['Aguascalientes', 'Guanajuato', 'Querétaro', 'San Luis Potosí', 'Zacatecas']
  },
  centro: {
    nombre: 'Centro',
    color: '#f97316',
    estados: ['Ciudad de México', 'Estado de México', 'Puebla', 'Tlaxcala', 'Morelos', 'Hidalgo']
  },
  occidente: {
    nombre: 'Occidente',
    color: '#a855f7',
    estados: ['Jalisco', 'Michoacán', 'Colima', 'Nayarit']
  },
  sur: {
    nombre: 'Sur',
    color: '#ef4444',
    estados: ['Oaxaca', 'Chiapas', 'Guerrero', 'Veracruz', 'Tabasco']
  },
  sureste: {
    nombre: 'Sureste',
    color: '#06b6d4',
    estados: ['Yucatán', 'Quintana Roo', 'Campeche']
  }
};

// Lista plana de todos los estados
const TODOS_LOS_ESTADOS = Object.values(ZONAS_MEXICO).flatMap(z => z.estados);

// ═══════════════════════════════════════════════════════════════════════════
// SEGMENTOS DE MERCADO
// ═══════════════════════════════════════════════════════════════════════════
const SEGMENTOS_MERCADO: { [key: string]: { nombre: string; icon: string; keywords: string[] } } = {
  automotriz: {
    nombre: 'Automotriz',
    icon: '🚗',
    keywords: ['Automotive', 'Auto Parts', 'Automotriz', 'Tier 1', 'Tier 2', 'Tier 3', 'OEM', 'Car Manufacturing']
  },
  aeroespacial: {
    nombre: 'Aeroespacial',
    icon: '✈️',
    keywords: ['Aerospace', 'Aviation', 'Aeroespacial', 'Aircraft', 'Defense']
  },
  mineria: {
    nombre: 'Minería',
    icon: '⛏️',
    keywords: ['Mining', 'Metals', 'Minería', 'Steel', 'Minerals']
  },
  agroindustrial: {
    nombre: 'Agroindustrial',
    icon: '🌾',
    keywords: ['Agriculture', 'Agroindustrial', 'Farming', 'Crops', 'Seeds']
  },
  alimentos: {
    nombre: 'Alimentos y Bebidas',
    icon: '🍔',
    keywords: ['Food Production', 'Food & Beverage', 'Beverages', 'Snacks', 'Dairy', 'Lácteos']
  },
  carnicos: {
    nombre: 'Cárnicos / Pollo',
    icon: '🥩',
    keywords: ['Meat Processing', 'Poultry', 'Cárnicos', 'Beef', 'Pork', 'Chicken']
  },
  produce: {
    nombre: 'Produce / Frutas',
    icon: '🍎',
    keywords: ['Fresh Produce', 'Fruits', 'Vegetables', 'Produce', 'Berries']
  },
  retail: {
    nombre: 'Retail / Autoservicio',
    icon: '🛒',
    keywords: ['Retail', 'Supermarkets', 'Autoservicio', 'Grocery', 'Convenience']
  },
  consumo: {
    nombre: 'Consumo Masivo',
    icon: '📦',
    keywords: ['Consumer Goods', 'FMCG', 'CPG', 'Household Products']
  },
  farmaceutica: {
    nombre: 'Farmacéutica',
    icon: '💊',
    keywords: ['Pharmaceuticals', 'Medical Devices', 'Healthcare', 'Biotech']
  },
  manufactura: {
    nombre: 'Manufactura General',
    icon: '🏭',
    keywords: ['Manufacturing', 'Industrial', 'Packaging', 'Plastics', 'Chemicals']
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// INDUSTRIAS A EXCLUIR (siempre)
// ═══════════════════════════════════════════════════════════════════════════
const INDUSTRIAS_EXCLUIR = [
  'Logistics', 'Logística', 'Transportation', 'Transporte',
  'Freight', 'Forwarding', 'Freight Forwarding',
  'Broker', 'Customs Broker', '3PL', 'Warehousing',
  'Government', 'Gobierno', 'Public Sector',
  'Education', 'Educación', 'Universities', 'Schools',
  'Hotels', 'Hospitality', 'Hoteles',
  'Technology Services', 'IT Services', 'Software',
  'Consulting', 'Consultoría', 'Advisory',
  'Legal', 'Law Firm', 'Abogados',
  'Real Estate', 'Inmobiliaria',
  'Banking', 'Financial Services', 'Insurance'
];

// ═══════════════════════════════════════════════════════════════════════════
// PUESTOS
// ═══════════════════════════════════════════════════════════════════════════
const PUESTOS_CLEVEL = [
  'CEO', 'Chief Executive Officer', 'Director General',
  'President', 'Presidente', 'Owner', 'Dueño', 'Founder', 'Fundador',
  'Chairman', 'Presidente del Consejo', 'Managing Director',
  'COO', 'Chief Operating Officer', 'CFO', 'Chief Financial Officer'
];

const PUESTOS_DECISION = [
  ...PUESTOS_CLEVEL,
  'VP', 'Vice President', 'Vicepresidente',
  'Supply Chain Director', 'Director de Cadena de Suministro',
  'Operations Director', 'Director de Operaciones',
  'Logistics Manager', 'Gerente de Logística',
  'Plant Manager', 'Gerente de Planta',
  'Operations Manager', 'Gerente de Operaciones',
  'Procurement Director', 'Director de Compras',
  'Purchasing Manager', 'Gerente de Compras',
  'Distribution Manager', 'Gerente de Distribución',
  'Head of Operations', 'Head of Supply Chain',
  'Director de Logística', 'Gerente General', 'Subdirector',
  'Supervisor', 'Coordinador', 'Coordinator'
];

const PUESTOS_EXCLUIR = [
  'HR', 'Human Resources', 'Recursos Humanos',
  'Legal', 'Abogado', 'Lawyer', 'Attorney',
  'IT', 'Systems', 'Sistemas', 'Developer',
  'Marketing', 'Communications', 'PR',
  'Accounting', 'Contador', 'Finance Analyst',
  'Receptionist', 'Assistant', 'Asistente',
  'Intern', 'Practicante', 'Trainee'
];

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════
interface ProspeccionIAModuleProps {
  onBack: () => void;
}

export const ProspeccionIAModule = ({ onBack }: ProspeccionIAModuleProps) => {
  // Estados principales
  const [paso, setPaso] = useState<1 | 2 | 3 | 4>(1);
  const [fuenteSeleccionada, setFuenteSeleccionada] = useState<'apollo' | 'hunter' | 'ambos' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Contactos
  const [contactosRaw, setContactosRaw] = useState<Contacto[]>([]);
  const [contactosFiltrados, setContactosFiltrados] = useState<Contacto[]>([]);
  const [contactosFinales, setContactosFinales] = useState<Contacto[]>([]);
  
  // NUEVOS FILTROS
  const [estadosSeleccionados, setEstadosSeleccionados] = useState<string[]>([]);
  const [zonasSeleccionadas, setZonasSeleccionadas] = useState<string[]>([]);
  const [segmentosSeleccionados, setSegmentosSeleccionados] = useState<string[]>(Object.keys(SEGMENTOS_MERCADO));
  const [buscarEmpresa, setBuscarEmpresa] = useState('');
  const [soloCLevel, setSoloCLevel] = useState(false);
  const [mostrarFiltrosAvanzados, setMostrarFiltrosAvanzados] = useState(false);
  
  // Chat IA
  const [chatMessages, setChatMessages] = useState<MensajeChat[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Validación emails
  const [validandoEmails, setValidandoEmails] = useState(false);
  const [progresValidacion, setProgresValidacion] = useState(0);

  // Verificar configuración de APIs (solo necesitamos Anthropic en el frontend)
  const apisConfiguradas = ANTHROPIC_API_KEY && SUPABASE_URL;

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLERS DE FILTROS
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Toggle zona completa
  const toggleZona = (zonaKey: string) => {
    const zona = ZONAS_MEXICO[zonaKey];
    const todosSeleccionados = zona.estados.every(e => estadosSeleccionados.includes(e));
    
    if (todosSeleccionados) {
      // Quitar todos los estados de esta zona
      setEstadosSeleccionados(prev => prev.filter(e => !zona.estados.includes(e)));
      setZonasSeleccionadas(prev => prev.filter(z => z !== zonaKey));
    } else {
      // Agregar todos los estados de esta zona
      setEstadosSeleccionados(prev => [...new Set([...prev, ...zona.estados])]);
      setZonasSeleccionadas(prev => [...new Set([...prev, zonaKey])]);
    }
  };

  // Toggle estado individual
  const toggleEstado = (estado: string) => {
    setEstadosSeleccionados(prev => 
      prev.includes(estado) 
        ? prev.filter(e => e !== estado)
        : [...prev, estado]
    );
  };

  // Toggle segmento
  const toggleSegmento = (segmentoKey: string) => {
    setSegmentosSeleccionados(prev =>
      prev.includes(segmentoKey)
        ? prev.filter(s => s !== segmentoKey)
        : [...prev, segmentoKey]
    );
  };

  // Seleccionar/deseleccionar todos los segmentos
  const toggleTodosSegmentos = () => {
    if (segmentosSeleccionados.length === Object.keys(SEGMENTOS_MERCADO).length) {
      setSegmentosSeleccionados([]);
    } else {
      setSegmentosSeleccionados(Object.keys(SEGMENTOS_MERCADO));
    }
  };

  // Limpiar filtros de ubicación
  const limpiarUbicacion = () => {
    setEstadosSeleccionados([]);
    setZonasSeleccionadas([]);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // FUNCIONES DE API
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Obtener keywords de segmentos seleccionados
  const getKeywordsSegmentos = (): string[] => {
    return segmentosSeleccionados.flatMap(s => SEGMENTOS_MERCADO[s]?.keywords || []);
  };

  // Buscar en Apollo (via Edge Function para evitar CORS)
  const buscarApollo = async (): Promise<Contacto[]> => {
    try {
      const puestosABuscar = soloCLevel ? PUESTOS_CLEVEL : PUESTOS_DECISION;
      const ubicaciones = estadosSeleccionados.length > 0 
        ? estadosSeleccionados.map(e => `${e}, Mexico`)
        : ['Mexico'];

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
            page: 1,
            per_page: 100
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error en Apollo API');
      }

      const data = await response.json();
      // Agregar campos faltantes a los contactos de Apollo
      return (data.contacts || []).map((c: any) => ({
        ...c,
        prioridad: c.prioridad || null,
        excluido: c.excluido || false,
        fuente: 'apollo' as const
      }));
    } catch (err: any) {
      console.error('Error Apollo:', err);
      throw new Error(`Apollo: ${err.message}`);
    }
  };

  // Buscar en Hunter (via Edge Function para evitar CORS)
  const buscarHunter = async (): Promise<Contacto[]> => {
    try {
      let domains: string[] = [];
      
      if (buscarEmpresa.trim()) {
        const empresaLimpia = buscarEmpresa.trim().toLowerCase()
          .replace(/\s+/g, '')
          .replace(/[^a-z0-9]/g, '');
        domains = [`${empresaLimpia}.com`, `${empresaLimpia}.com.mx`];
      } else {
        domains = [
          'bafar.com.mx', 'barcel.com.mx', 'grupoalfa.com.mx', 'gruma.com',
          'cemex.com', 'femsa.com', 'bimbo.com', 'lala.com.mx', 'alpura.com',
          'sigma-alimentos.com', 'modelorama.com.mx', 'bachoco.com.mx'
        ];
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/prospeccion-api`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          action: 'hunter_domain_search',
          params: { domains }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error en Hunter API');
      }

      const data = await response.json();
      // Agregar campos faltantes a los contactos de Hunter
      return (data.contacts || []).map((c: any) => ({
        ...c,
        prioridad: c.prioridad || null,
        excluido: c.excluido || false,
        fuente: 'hunter' as const
      }));
    } catch (err: any) {
      console.error('Error Hunter:', err);
      throw new Error(`Hunter: ${err.message}`);
    }
  };

  // Validar email con Hunter (via Edge Function)
  const validarEmailHunter = async (email: string): Promise<{ valid: boolean; score: number }> => {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/prospeccion-api`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          action: 'hunter_verify_email',
          params: { email }
        })
      });

      if (response.ok) {
        const data = await response.json();
        return { valid: data.valid || false, score: data.score || 0 };
      }
      return { valid: false, score: 0 };
    } catch {
      return { valid: false, score: 0 };
    }
  };

  // Consultar Claude
  const consultarClaude = async (prompt: string): Promise<string> => {
    if (!ANTHROPIC_API_KEY) {
      throw new Error('Anthropic API Key no configurada');
    }
    
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Error en Claude API');
      }

      const data = await response.json();
      return data.content[0].text;
    } catch (err: any) {
      console.error('Error Claude:', err);
      throw new Error(`Claude: ${err.message}`);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLERS PRINCIPALES
  // ═══════════════════════════════════════════════════════════════════════════

  const handleBuscarContactos = async () => {
    if (!fuenteSeleccionada) {
      setError('Selecciona una fuente de datos');
      return;
    }

    if (!apisConfiguradas) {
      setError('APIs no configuradas. Revisa las variables de entorno en Vercel');
      return;
    }

    if (segmentosSeleccionados.length === 0) {
      setError('Selecciona al menos un segmento de mercado');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      let contactos: Contacto[] = [];
      
      if (fuenteSeleccionada === 'apollo' || fuenteSeleccionada === 'ambos') {
        const apolloContacts = await buscarApollo();
        contactos = [...contactos, ...apolloContacts];
      }
      
      if (fuenteSeleccionada === 'hunter' || fuenteSeleccionada === 'ambos') {
        const hunterContacts = await buscarHunter();
        contactos = [...contactos, ...hunterContacts];
      }

      // Eliminar duplicados por email
      const emailsVistos = new Set<string>();
      contactos = contactos.filter(c => {
        if (!c.email || emailsVistos.has(c.email.toLowerCase())) return false;
        emailsVistos.add(c.email.toLowerCase());
        return true;
      });

      // Filtrar por industrias excluidas
      contactos = contactos.filter(c => {
        const industriaLower = (c.industria || '').toLowerCase();
        return !INDUSTRIAS_EXCLUIR.some(exc => industriaLower.includes(exc.toLowerCase()));
      });

      // Filtrar por puestos excluidos
      contactos = contactos.filter(c => {
        const puestoLower = (c.puesto || '').toLowerCase();
        return !PUESTOS_EXCLUIR.some(exc => puestoLower.includes(exc.toLowerCase()));
      });

      setContactosRaw(contactos);
      setContactosFiltrados(contactos);
      setPaso(2);
      
      // Mensaje inicial del chat
      const filtrosAplicados = [];
      if (estadosSeleccionados.length > 0) filtrosAplicados.push(`Estados: ${estadosSeleccionados.join(', ')}`);
      if (buscarEmpresa) filtrosAplicados.push(`Empresa: ${buscarEmpresa}`);
      if (soloCLevel) filtrosAplicados.push('Solo C-Level/Dueños');
      filtrosAplicados.push(`Segmentos: ${segmentosSeleccionados.map(s => SEGMENTOS_MERCADO[s].nombre).join(', ')}`);

      setChatMessages([{
        role: 'assistant',
        content: `✅ He encontrado **${contactos.length} contactos** de ${fuenteSeleccionada === 'ambos' ? 'Apollo y Hunter' : fuenteSeleccionada}.\n\n**Filtros aplicados:**\n${filtrosAplicados.map(f => `• ${f}`).join('\n')}\n\n**Ya excluí automáticamente:**\n• Empresas de logística, transporte, forwarders\n• Gobierno, educación, hoteles\n• Tecnología, consultorías, legal\n• Puestos de RH, IT, Marketing, Legal\n\nAhora puedo ayudarte a filtrar más. Por ejemplo:\n- "Solo quiero empresas grandes"\n- "Clasifica por prioridad A, B, C"\n- "Elimina las que no tengan Operations en el puesto"\n\n¿Qué más quieres filtrar?`
      }]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Chat con IA
  const handleEnviarChat = async () => {
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatLoading(true);

    try {
      const contactosJson = JSON.stringify(contactosFiltrados.slice(0, 50).map(c => ({
        empresa: c.empresa,
        industria: c.industria,
        puesto: c.puesto,
        estado: c.estado,
        email: c.email
      })), null, 2);

      const prompt = `Actúa como director comercial B2B especializado en transporte de carga en México (caja seca 53' y refrigerado).

CONTEXTO:
- Tengo ${contactosFiltrados.length} contactos extraídos de Apollo/Hunter
- Muestra de los primeros 50:
${contactosJson}

INSTRUCCIÓN DEL USUARIO:
"${userMessage}"

REGLAS:
1. Empresas que SÍ interesan: automotrices, aeroespaciales, mineras, agroindustriales, retail, produce, tier1/2/3, cárnicos
2. Empresas que NO interesan: logísticas, transportistas, forwarders, brokers, gobierno, educación, hoteles, tecnología, consultorías
3. Puestos que SÍ interesan: Director, Gerente, VP, Head, Supervisor, Coordinador (operaciones, supply chain, compras, planta)
4. Puestos que NO interesan: RH, Legal, IT, Marketing, Contabilidad

RESPONDE con:
1. Una explicación clara de qué filtros aplicarás
2. Un JSON con la estructura: { "accion": "filtrar" | "priorizar" | "excluir", "criterios": {...}, "empresas_afectadas": [...] }

Si el usuario pide clasificar por prioridad, usa:
- A: Muy alta probabilidad (automotriz, aeroespacial, minería grande)
- B: Media probabilidad (agroindustrial, retail mediano)
- C: Baja probabilidad (otros sectores válidos)`;

      const respuesta = await consultarClaude(prompt);
      setChatMessages(prev => [...prev, { role: 'assistant', content: respuesta }]);

      // Intentar aplicar filtros del JSON
      const jsonMatch = respuesta.match(/\{[\s\S]*"accion"[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const accionData = JSON.parse(jsonMatch[0]);
          aplicarFiltrosIA(accionData);
        } catch { /* No se pudo parsear */ }
      }
    } catch (err: any) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: `❌ Error: ${err.message}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  const aplicarFiltrosIA = (accion: any) => {
    if (accion.accion === 'excluir' && accion.empresas_afectadas) {
      setContactosFiltrados(prev => 
        prev.map(c => ({
          ...c,
          excluido: accion.empresas_afectadas.some((e: string) => 
            c.empresa.toLowerCase().includes(e.toLowerCase())
          ) ? true : c.excluido,
          razonExclusion: accion.empresas_afectadas.some((e: string) => 
            c.empresa.toLowerCase().includes(e.toLowerCase())
          ) ? accion.criterios?.razon || 'Filtrado por IA' : c.razonExclusion
        }))
      );
    }

    if (accion.accion === 'priorizar' && accion.empresas_afectadas) {
      setContactosFiltrados(prev =>
        prev.map(c => {
          const empresaInfo = accion.empresas_afectadas.find((e: any) => 
            c.empresa.toLowerCase().includes(e.empresa?.toLowerCase() || e.toLowerCase())
          );
          if (empresaInfo) {
            return {
              ...c,
              prioridad: empresaInfo.prioridad || 'B',
              razonPrioridad: empresaInfo.razon || 'Clasificado por IA'
            };
          }
          return c;
        })
      );
    }
  };

  const handleValidarEmails = async () => {
    const contactosSinExcluir = contactosFiltrados.filter(c => !c.excluido);
    if (contactosSinExcluir.length === 0) {
      setError('No hay contactos para validar');
      return;
    }

    setValidandoEmails(true);
    setProgresValidacion(0);

    try {
      const total = contactosSinExcluir.length;
      const contactosActualizados = [...contactosFiltrados];

      for (let i = 0; i < contactosSinExcluir.length; i++) {
        const contacto = contactosSinExcluir[i];
        if (contacto.email) {
          const resultado = await validarEmailHunter(contacto.email);
          const idx = contactosActualizados.findIndex(c => c.id === contacto.id);
          if (idx !== -1) {
            contactosActualizados[idx] = {
              ...contactosActualizados[idx],
              emailVerificado: resultado.valid,
              emailScore: resultado.score
            };
          }
        }
        setProgresValidacion(Math.round(((i + 1) / total) * 100));
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      setContactosFiltrados(contactosActualizados);
      setPaso(3);
    } catch (err: any) {
      setError(`Error validando emails: ${err.message}`);
    } finally {
      setValidandoEmails(false);
    }
  };

  const handleGenerarListaFinal = () => {
    const finales = contactosFiltrados.filter(c => !c.excluido && c.emailVerificado);
    setContactosFinales(finales);
    setPaso(4);
  };

  const handleExportarCSV = () => {
    const headers = ['Nombre', 'Apellido', 'Email', 'Verificado', 'Score', 'Empresa', 'Industria', 'Puesto', 'Ciudad', 'Estado', 'País', 'LinkedIn', 'Teléfono', 'Prioridad', 'Razón'];
    const rows = contactosFinales.map(c => [
      c.nombre, c.apellido, c.email, c.emailVerificado ? 'Sí' : 'No', c.emailScore,
      c.empresa, c.industria, c.puesto, c.ciudad, c.estado, c.pais,
      c.linkedin || '', c.telefono || '', c.prioridad || '', c.razonPrioridad || ''
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prospeccion_ia_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  const cardStyle = "bg-white/5 border border-white/10 rounded-xl p-4 hover:border-[#f97316]/50 transition-all";
  const btnPrimary = "bg-gradient-to-r from-[#f97316] to-[#ea580c] hover:from-[#ea580c] hover:to-[#c2410c] text-white font-medium px-6 py-3 rounded-xl transition-all flex items-center gap-2 disabled:opacity-50";
  const btnSecondary = "bg-white/10 hover:bg-white/20 text-white font-medium px-4 py-2 rounded-lg transition-all flex items-center gap-2";
  const checkboxStyle = "w-4 h-4 rounded border-white/30 bg-white/10 text-[#f97316] focus:ring-[#f97316]";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1628] via-[#1a2744] to-[#0d1f3c] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all">
              <ChevronDown className="w-5 h-5 text-white rotate-90" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <Sparkles className="w-7 h-7 text-[#f97316]" />
                Prospección IA
              </h1>
              <p className="text-white/60 text-sm">Apollo + Hunter + Claude AI</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map(p => (
              <div key={p} className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                paso === p ? 'bg-[#f97316] text-white' : paso > p ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-white/10 text-white/40'
              }`}>
                {paso > p ? <Check className="w-5 h-5" /> : p}
              </div>
            ))}
          </div>
        </div>

        {/* Alertas */}
        {!apisConfiguradas && (
          <div className="mb-6 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-xl text-yellow-400">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5" />
              <span><strong>APIs no configuradas</strong> - Configura VITE_ANTHROPIC_API_KEY en Vercel y despliega la Edge Function prospeccion-api</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════════ */}
        {/* PASO 1: Filtros de búsqueda */}
        {/* ════════════════════════════════════════════════════════════════════════ */}
        {paso === 1 && (
          <div className="space-y-6">
            {/* Fuente de datos */}
            <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto">
              {(['apollo', 'hunter', 'ambos'] as const).map(fuente => (
                <button
                  key={fuente}
                  onClick={() => setFuenteSeleccionada(fuente)}
                  className={`${cardStyle} ${fuenteSeleccionada === fuente ? 'border-[#f97316] bg-[#f97316]/10' : ''}`}
                >
                  <div className="text-center">
                    <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${
                      fuente === 'apollo' ? 'bg-purple-500/20' : fuente === 'hunter' ? 'bg-orange-500/20' : 'bg-green-500/20'
                    }`}>
                      {fuente === 'apollo' ? <Globe className="w-6 h-6 text-purple-400" /> :
                       fuente === 'hunter' ? <Target className="w-6 h-6 text-orange-400" /> :
                       <Users className="w-6 h-6 text-green-400" />}
                    </div>
                    <h3 className="text-white font-semibold text-sm">
                      {fuente === 'apollo' ? 'Apollo.io' : fuente === 'hunter' ? 'Hunter.io' : 'Ambos'}
                    </h3>
                  </div>
                </button>
              ))}
            </div>

            {/* Búsqueda por empresa */}
            <div className={cardStyle}>
              <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#f97316]" />
                Buscar empresa específica (opcional)
              </h3>
              <input
                type="text"
                value={buscarEmpresa}
                onChange={e => setBuscarEmpresa(e.target.value)}
                placeholder="Ej: CEMEX, Bimbo, Femsa..."
                className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/30"
              />
            </div>

            {/* Solo C-Level */}
            <div className={cardStyle}>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={soloCLevel}
                  onChange={e => setSoloCLevel(e.target.checked)}
                  className={checkboxStyle}
                />
                <Crown className="w-5 h-5 text-yellow-400" />
                <div>
                  <span className="text-white font-medium">Solo Dueños / Presidentes / C-Level</span>
                  <p className="text-white/50 text-xs">CEO, President, Owner, Founder, Chairman, Director General</p>
                </div>
              </label>
            </div>

            {/* Zonas de México */}
            <div className={cardStyle}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-medium flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#f97316]" />
                  Ubicación
                </h3>
                {estadosSeleccionados.length > 0 && (
                  <button onClick={limpiarUbicacion} className="text-white/50 text-xs hover:text-white">
                    Limpiar ({estadosSeleccionados.length})
                  </button>
                )}
              </div>
              
              {/* Zonas como botones */}
              <div className="grid grid-cols-6 gap-2 mb-4">
                {Object.entries(ZONAS_MEXICO).map(([key, zona]) => {
                  const todosSeleccionados = zona.estados.every(e => estadosSeleccionados.includes(e));
                  const algunosSeleccionados = zona.estados.some(e => estadosSeleccionados.includes(e));
                  return (
                    <button
                      key={key}
                      onClick={() => toggleZona(key)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                        todosSeleccionados 
                          ? 'bg-opacity-30 border-current' 
                          : algunosSeleccionados
                            ? 'bg-opacity-15 border-current border-dashed'
                            : 'bg-white/5 border-white/10 hover:border-white/30'
                      }`}
                      style={{ 
                        backgroundColor: todosSeleccionados || algunosSeleccionados ? `${zona.color}30` : undefined,
                        borderColor: todosSeleccionados || algunosSeleccionados ? zona.color : undefined,
                        color: todosSeleccionados || algunosSeleccionados ? zona.color : 'rgba(255,255,255,0.7)'
                      }}
                    >
                      {zona.nombre}
                    </button>
                  );
                })}
              </div>

              {/* Estados individuales (colapsable) */}
              <button 
                onClick={() => setMostrarFiltrosAvanzados(!mostrarFiltrosAvanzados)}
                className="text-white/50 text-xs flex items-center gap-1 hover:text-white"
              >
                {mostrarFiltrosAvanzados ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {mostrarFiltrosAvanzados ? 'Ocultar estados' : 'Seleccionar estados individuales'}
              </button>

              {mostrarFiltrosAvanzados && (
                <div className="mt-4 grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                  {TODOS_LOS_ESTADOS.map(estado => (
                    <label key={estado} className="flex items-center gap-2 text-xs text-white/70 cursor-pointer hover:text-white">
                      <input
                        type="checkbox"
                        checked={estadosSeleccionados.includes(estado)}
                        onChange={() => toggleEstado(estado)}
                        className={checkboxStyle}
                      />
                      {estado}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Segmentos de mercado */}
            <div className={cardStyle}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-medium flex items-center gap-2">
                  <Factory className="w-5 h-5 text-[#f97316]" />
                  Segmentos de mercado
                </h3>
                <button onClick={toggleTodosSegmentos} className="text-white/50 text-xs hover:text-white">
                  {segmentosSeleccionados.length === Object.keys(SEGMENTOS_MERCADO).length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                </button>
              </div>
              
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(SEGMENTOS_MERCADO).map(([key, segmento]) => (
                  <label 
                    key={key}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                      segmentosSeleccionados.includes(key) 
                        ? 'bg-[#f97316]/20 border border-[#f97316]/50' 
                        : 'bg-white/5 border border-white/10 hover:border-white/30'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={segmentosSeleccionados.includes(key)}
                      onChange={() => toggleSegmento(key)}
                      className="hidden"
                    />
                    <span className="text-lg">{segmento.icon}</span>
                    <span className={`text-xs ${segmentosSeleccionados.includes(key) ? 'text-white' : 'text-white/60'}`}>
                      {segmento.nombre}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Info de exclusiones */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-blue-400 text-sm">
              <strong>🚫 Excluido automáticamente:</strong>
              <p className="text-blue-400/70 mt-1">
                Logística, transporte, forwarders, brokers, gobierno, educación, hoteles, tecnología, consultorías, legal, inmobiliarias, bancos. 
                Puestos: RH, IT, Marketing, Legal, Contabilidad, Asistentes.
              </p>
            </div>

            {/* Botón buscar */}
            <div className="flex justify-center">
              <button 
                onClick={handleBuscarContactos}
                disabled={!fuenteSeleccionada || loading || !apisConfiguradas || segmentosSeleccionados.length === 0}
                className={btnPrimary}
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Buscando...</>
                ) : (
                  <><Search className="w-5 h-5" /> Buscar Contactos</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════════ */}
        {/* PASO 2: Filtrar con IA */}
        {/* ════════════════════════════════════════════════════════════════════════ */}
        {paso === 2 && (
          <div className="grid grid-cols-2 gap-6">
            {/* Lista de contactos */}
            <div className={cardStyle}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-medium flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#f97316]" />
                  Contactos ({contactosFiltrados.filter(c => !c.excluido).length})
                </h3>
                <span className="text-white/40 text-sm">
                  Excluidos: {contactosFiltrados.filter(c => c.excluido).length}
                </span>
              </div>
              
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                {contactosFiltrados.map(contacto => (
                  <div 
                    key={contacto.id}
                    className={`p-3 rounded-lg border transition-all ${
                      contacto.excluido 
                        ? 'bg-red-500/10 border-red-500/30 opacity-50' 
                        : contacto.prioridad === 'A'
                          ? 'bg-green-500/10 border-green-500/30'
                          : contacto.prioridad === 'B'
                            ? 'bg-yellow-500/10 border-yellow-500/30'
                            : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium text-sm">
                            {contacto.nombre} {contacto.apellido}
                          </span>
                          {contacto.prioridad && (
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              contacto.prioridad === 'A' ? 'bg-green-500/20 text-green-400' :
                              contacto.prioridad === 'B' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {contacto.prioridad}
                            </span>
                          )}
                        </div>
                        <div className="text-white/60 text-xs mt-1">{contacto.puesto}</div>
                        <div className="text-white/50 text-xs">{contacto.empresa}</div>
                        <div className="text-white/40 text-xs flex items-center gap-1 mt-1">
                          <Mail className="w-3 h-3" />
                          {contacto.email}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setContactosFiltrados(prev => 
                            prev.map(c => c.id === contacto.id ? { ...c, excluido: !c.excluido } : c)
                          );
                        }}
                        className={`p-1 rounded ${contacto.excluido ? 'text-green-400' : 'text-red-400'}`}
                      >
                        {contacto.excluido ? <RefreshCw className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat IA */}
            <div className={cardStyle}>
              <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                <Bot className="w-5 h-5 text-[#f97316]" />
                Asistente IA para Filtrar
              </h3>
              
              <div className="h-[400px] overflow-y-auto mb-4 space-y-3 pr-2">
                {chatMessages.map((msg, idx) => (
                  <div 
                    key={idx}
                    className={`p-3 rounded-lg ${
                      msg.role === 'user' ? 'bg-[#f97316]/20 ml-8' : 'bg-white/10 mr-8'
                    }`}
                  >
                    <div className="text-white/80 text-sm whitespace-pre-wrap">{msg.content}</div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex items-center gap-2 text-white/50 p-3">
                    <Loader2 className="w-4 h-4 animate-spin" /> Analizando...
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleEnviarChat()}
                  placeholder="Ej: Clasifica por prioridad A, B, C..."
                  className="flex-1 bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/30"
                />
                <button 
                  onClick={handleEnviarChat}
                  disabled={chatLoading || !chatInput.trim()}
                  className="bg-[#f97316] hover:bg-[#ea580c] text-white p-2 rounded-lg disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Botones */}
            <div className="col-span-2 flex justify-between">
              <button onClick={() => setPaso(1)} className={btnSecondary}>
                <ChevronDown className="w-4 h-4 rotate-90" /> Volver
              </button>
              <button 
                onClick={handleValidarEmails}
                disabled={validandoEmails || contactosFiltrados.filter(c => !c.excluido).length === 0}
                className={btnPrimary}
              >
                {validandoEmails ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Validando ({progresValidacion}%)</>
                ) : (
                  <><CheckCircle2 className="w-5 h-5" /> Validar Emails</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════════ */}
        {/* PASO 3 y 4: Mantener igual que antes */}
        {/* ════════════════════════════════════════════════════════════════════════ */}
        {paso === 3 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold text-white mb-2">Paso 3: Resultados de Validación</h2>
              <p className="text-white/60">Emails verificados por Hunter.io</p>
            </div>

            <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto">
              <div className={cardStyle}>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-1">{contactosFiltrados.filter(c => !c.excluido).length}</div>
                  <div className="text-white/60 text-sm">Total</div>
                </div>
              </div>
              <div className={cardStyle}>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400 mb-1">{contactosFiltrados.filter(c => !c.excluido && c.emailVerificado).length}</div>
                  <div className="text-white/60 text-sm">Verificados</div>
                </div>
              </div>
              <div className={cardStyle}>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-400 mb-1">{contactosFiltrados.filter(c => !c.excluido && !c.emailVerificado).length}</div>
                  <div className="text-white/60 text-sm">No verificados</div>
                </div>
              </div>
            </div>

            <div className={`${cardStyle} max-w-4xl mx-auto max-h-[400px] overflow-y-auto`}>
              {contactosFiltrados.filter(c => !c.excluido).map(contacto => (
                <div key={contacto.id} className={`p-3 rounded-lg flex items-center justify-between mb-2 ${
                  contacto.emailVerificado ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'
                }`}>
                  <div>
                    <div className="text-white font-medium">{contacto.nombre} {contacto.apellido}</div>
                    <div className="text-white/60 text-sm">{contacto.empresa} - {contacto.puesto}</div>
                    <div className="text-white/50 text-xs">{contacto.email}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-white/60 text-sm">Score: {contacto.emailScore}%</span>
                    {contacto.emailVerificado ? <CheckCircle2 className="w-6 h-6 text-green-400" /> : <XCircle className="w-6 h-6 text-red-400" />}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between max-w-4xl mx-auto">
              <button onClick={() => setPaso(2)} className={btnSecondary}>
                <ChevronDown className="w-4 h-4 rotate-90" /> Volver
              </button>
              <button onClick={handleGenerarListaFinal} className={btnPrimary}>
                <Download className="w-5 h-5" /> Generar Lista Final
              </button>
            </div>
          </div>
        )}

        {paso === 4 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold text-white mb-2">✅ Lista Final</h2>
              <p className="text-white/60">{contactosFinales.length} contactos verificados</p>
            </div>

            <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto">
              {['A', 'B', 'C'].map(p => (
                <div key={p} className={`${cardStyle} border-${p === 'A' ? 'green' : p === 'B' ? 'yellow' : 'gray'}-500/50`}>
                  <div className="text-center">
                    <div className={`text-3xl font-bold mb-1 ${p === 'A' ? 'text-green-400' : p === 'B' ? 'text-yellow-400' : 'text-gray-400'}`}>
                      {contactosFinales.filter(c => c.prioridad === p || (!c.prioridad && p === 'C')).length}
                    </div>
                    <div className="text-white/60 text-sm">Prioridad {p}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className={`${cardStyle} max-w-5xl mx-auto overflow-x-auto`}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-white/60 border-b border-white/10">
                    <th className="text-left py-2 px-3">Nombre</th>
                    <th className="text-left py-2 px-3">Email</th>
                    <th className="text-left py-2 px-3">Empresa</th>
                    <th className="text-left py-2 px-3">Puesto</th>
                    <th className="text-left py-2 px-3">Prioridad</th>
                  </tr>
                </thead>
                <tbody>
                  {contactosFinales.slice(0, 20).map(c => (
                    <tr key={c.id} className="border-b border-white/5 text-white/80">
                      <td className="py-2 px-3">{c.nombre} {c.apellido}</td>
                      <td className="py-2 px-3">{c.email}</td>
                      <td className="py-2 px-3">{c.empresa}</td>
                      <td className="py-2 px-3">{c.puesto}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          c.prioridad === 'A' ? 'bg-green-500/20 text-green-400' :
                          c.prioridad === 'B' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>{c.prioridad || 'C'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {contactosFinales.length > 20 && (
                <div className="text-center text-white/40 py-2">+ {contactosFinales.length - 20} más...</div>
              )}
            </div>

            <div className="flex justify-center gap-4">
              <button onClick={() => setPaso(1)} className={btnSecondary}>
                <RefreshCw className="w-4 h-4" /> Nueva Búsqueda
              </button>
              <button onClick={handleExportarCSV} className={btnPrimary}>
                <Download className="w-5 h-5" /> Exportar CSV
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProspeccionIAModule;
