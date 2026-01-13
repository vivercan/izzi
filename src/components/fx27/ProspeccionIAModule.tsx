// ═══════════════════════════════════════════════════════════════════════════
// PROSPECCIÓN IA MODULE - Integración Apollo + Hunter + Claude AI
// Solo accesible para: juan.viveros@trob.com.mx
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useRef } from 'react';
import { 
  Search, Filter, Download, Loader2, CheckCircle2, XCircle, 
  Building2, User, Mail, MapPin, Briefcase, Sparkles, 
  RefreshCw, ChevronDown, ChevronUp, Send, Bot, Trash2,
  Globe, Target, Users, AlertCircle, Check, X
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE APIs - Usar variables de entorno de Vite
// ═══════════════════════════════════════════════════════════════════════════
const APOLLO_API_KEY = import.meta.env.VITE_APOLLO_API_KEY || '';
const HUNTER_API_KEY = import.meta.env.VITE_HUNTER_API_KEY || '';
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

interface FiltrosProspeccion {
  pais: string;
  estados: string[];
  industriasIncluir: string[];
  industriasExcluir: string[];
  puestosIncluir: string[];
  puestosExcluir: string[];
  tamanoEmpresa: string;
}

interface MensajeChat {
  role: 'user' | 'assistant';
  content: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// DATOS PREDEFINIDOS
// ═══════════════════════════════════════════════════════════════════════════
const INDUSTRIAS_INTERES = [
  'Automotriz', 'Automotive', 'Auto Parts',
  'Aeroespacial', 'Aerospace', 'Aviation',
  'Minería', 'Mining', 'Metals',
  'Agroindustrial', 'Agriculture', 'Food Production', 'Food & Beverage',
  'Tier 1', 'Tier 2', 'Tier 3', 'Manufacturing',
  'Retail', 'Autoservicio', 'Supermarkets',
  'Cárnicos', 'Meat Processing', 'Poultry',
  'Produce', 'Fresh Produce', 'Fruits & Vegetables',
  'Dairy', 'Lácteos',
  'Consumer Goods', 'FMCG',
  'Packaging', 'Plastics',
  'Pharmaceuticals', 'Medical Devices'
];

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

const PUESTOS_DECISION = [
  'CEO', 'Director General', 'General Manager',
  'COO', 'Chief Operating Officer', 'Operations Director',
  'VP', 'Vice President', 'Vicepresidente',
  'Supply Chain Director', 'Director de Cadena de Suministro',
  'Logistics Manager', 'Gerente de Logística',
  'Plant Manager', 'Gerente de Planta',
  'Operations Manager', 'Gerente de Operaciones',
  'Procurement Director', 'Director de Compras',
  'Purchasing Manager', 'Gerente de Compras',
  'Distribution Manager', 'Gerente de Distribución',
  'Head of Operations', 'Head of Supply Chain',
  'Director de Operaciones', 'Director de Logística',
  'Gerente General', 'Subdirector',
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

const ESTADOS_MEXICO = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche',
  'Chiapas', 'Chihuahua', 'Coahuila', 'Colima', 'Durango',
  'Estado de México', 'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco',
  'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla',
  'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora',
  'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'
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
  
  // Filtros
  const [filtros, setFiltros] = useState<FiltrosProspeccion>({
    pais: 'Mexico',
    estados: [],
    industriasIncluir: [...INDUSTRIAS_INTERES],
    industriasExcluir: [...INDUSTRIAS_EXCLUIR],
    puestosIncluir: [...PUESTOS_DECISION],
    puestosExcluir: [...PUESTOS_EXCLUIR],
    tamanoEmpresa: ''
  });
  
  // Chat IA
  const [chatMessages, setChatMessages] = useState<MensajeChat[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Validación emails
  const [validandoEmails, setValidandoEmails] = useState(false);
  const [progresValidacion, setProgresValidacion] = useState(0);

  // Verificar configuración de APIs
  const apisConfiguradas = APOLLO_API_KEY && HUNTER_API_KEY && ANTHROPIC_API_KEY;

  // ═══════════════════════════════════════════════════════════════════════════
  // FUNCIONES DE API
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Buscar en Apollo
  const buscarApollo = async (): Promise<Contacto[]> => {
    if (!APOLLO_API_KEY) {
      throw new Error('Apollo API Key no configurada. Añade VITE_APOLLO_API_KEY en .env');
    }
    
    try {
      const response = await fetch('https://api.apollo.io/v1/mixed_people/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'X-Api-Key': APOLLO_API_KEY
        },
        body: JSON.stringify({
          api_key: APOLLO_API_KEY,
          q_organization_domains: [],
          page: 1,
          per_page: 100,
          organization_locations: filtros.estados.length > 0 
            ? filtros.estados.map(e => `${e}, Mexico`)
            : ['Mexico'],
          person_titles: filtros.puestosIncluir.slice(0, 10),
          organization_industry_tag_ids: [],
          contact_email_status: ['verified', 'likely_valid']
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error en Apollo API');
      }

      const data = await response.json();
      
      return (data.people || []).map((p: any, idx: number) => ({
        id: `apollo-${idx}-${Date.now()}`,
        nombre: p.first_name || '',
        apellido: p.last_name || '',
        email: p.email || '',
        emailVerificado: p.email_status === 'verified',
        emailScore: p.email_status === 'verified' ? 100 : p.email_status === 'likely_valid' ? 80 : 50,
        empresa: p.organization?.name || '',
        industria: p.organization?.industry || '',
        puesto: p.title || '',
        ciudad: p.city || '',
        estado: p.state || '',
        pais: p.country || 'Mexico',
        linkedin: p.linkedin_url || '',
        telefono: p.phone_numbers?.[0]?.sanitized_number || '',
        fuente: 'apollo' as const,
        prioridad: null,
        excluido: false
      }));
    } catch (err: any) {
      console.error('Error Apollo:', err);
      throw new Error(`Apollo: ${err.message}`);
    }
  };

  // Buscar en Hunter (Domain Search)
  const buscarHunter = async (): Promise<Contacto[]> => {
    if (!HUNTER_API_KEY) {
      throw new Error('Hunter API Key no configurada. Añade VITE_HUNTER_API_KEY en .env');
    }
    
    try {
      // Hunter usa búsqueda por dominio, necesitamos dominios de empresas
      // Para esta implementación, usaremos el endpoint de búsqueda de emails
      const domains = [
        'bafar.com.mx', 'barcel.com.mx', 'grupoalfa.com.mx', 'gruma.com',
        'cemex.com', 'femsa.com', 'bimbo.com', 'lala.com.mx', 'alpura.com'
      ];

      const allContacts: Contacto[] = [];

      for (const domain of domains.slice(0, 5)) { // Limitar para no gastar créditos
        const response = await fetch(
          `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${HUNTER_API_KEY}&limit=10`
        );

        if (response.ok) {
          const data = await response.json();
          const emails = data.data?.emails || [];
          
          emails.forEach((e: any, idx: number) => {
            allContacts.push({
              id: `hunter-${domain}-${idx}-${Date.now()}`,
              nombre: e.first_name || '',
              apellido: e.last_name || '',
              email: e.value || '',
              emailVerificado: e.verification?.status === 'valid',
              emailScore: e.confidence || 0,
              empresa: data.data?.organization || domain,
              industria: data.data?.industry || '',
              puesto: e.position || '',
              ciudad: '',
              estado: '',
              pais: 'Mexico',
              linkedin: e.linkedin || '',
              telefono: e.phone_number || '',
              fuente: 'hunter' as const,
              prioridad: null,
              excluido: false
            });
          });
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      return allContacts;
    } catch (err: any) {
      console.error('Error Hunter:', err);
      throw new Error(`Hunter: ${err.message}`);
    }
  };

  // Validar email individual con Hunter
  const validarEmailHunter = async (email: string): Promise<{ valid: boolean; score: number }> => {
    if (!HUNTER_API_KEY) return { valid: false, score: 0 };
    
    try {
      const response = await fetch(
        `https://api.hunter.io/v2/email-verifier?email=${encodeURIComponent(email)}&api_key=${HUNTER_API_KEY}`
      );
      
      if (response.ok) {
        const data = await response.json();
        return {
          valid: data.data?.status === 'valid',
          score: data.data?.score || 0
        };
      }
      return { valid: false, score: 0 };
    } catch {
      return { valid: false, score: 0 };
    }
  };

  // Consultar a Claude para filtrar/priorizar
  const consultarClaude = async (prompt: string): Promise<string> => {
    if (!ANTHROPIC_API_KEY) {
      throw new Error('Anthropic API Key no configurada. Añade VITE_ANTHROPIC_API_KEY en .env');
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
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
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
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  // Paso 1 → 2: Seleccionar fuente y buscar
  const handleBuscarContactos = async () => {
    if (!fuenteSeleccionada) {
      setError('Selecciona una fuente de datos');
      return;
    }

    if (!apisConfiguradas) {
      setError('APIs no configuradas. Revisa el archivo .env');
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

      setContactosRaw(contactos);
      setContactosFiltrados(contactos);
      setPaso(2);
      
      // Mensaje inicial del chat
      setChatMessages([{
        role: 'assistant',
        content: `✅ He encontrado **${contactos.length} contactos** de ${fuenteSeleccionada === 'ambos' ? 'Apollo y Hunter' : fuenteSeleccionada}.\n\nAhora puedo ayudarte a filtrar y segmentar. Por ejemplo:\n- "Elimina las empresas de logística y transporte"\n- "Solo quiero automotriz y aeroespacial"\n- "Filtra por Aguascalientes y Querétaro"\n- "Clasifica por prioridad A, B, C"\n\n¿Qué filtros quieres aplicar?`
      }]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Chat con IA para filtrar
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

      // Intentar extraer JSON de la respuesta para aplicar filtros
      const jsonMatch = respuesta.match(/\{[\s\S]*"accion"[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const accionData = JSON.parse(jsonMatch[0]);
          aplicarFiltrosIA(accionData);
        } catch {
          // No se pudo parsear, solo mostrar respuesta
        }
      }
    } catch (err: any) {
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `❌ Error: ${err.message}` 
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Aplicar filtros sugeridos por IA
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

  // Validar emails con Hunter
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
        await new Promise(resolve => setTimeout(resolve, 300)); // Rate limiting
      }

      setContactosFiltrados(contactosActualizados);
      setPaso(3);
    } catch (err: any) {
      setError(`Error validando emails: ${err.message}`);
    } finally {
      setValidandoEmails(false);
    }
  };

  // Generar lista final
  const handleGenerarListaFinal = () => {
    const finales = contactosFiltrados.filter(c => !c.excluido && c.emailVerificado);
    setContactosFinales(finales);
    setPaso(4);
  };

  // Exportar a CSV
  const handleExportarCSV = () => {
    const headers = ['Nombre', 'Apellido', 'Email', 'Email Verificado', 'Score', 'Empresa', 'Industria', 'Puesto', 'Ciudad', 'Estado', 'País', 'LinkedIn', 'Teléfono', 'Prioridad', 'Razón Prioridad'];
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

  // Estilos comunes
  const cardStyle = "bg-white/5 border border-white/10 rounded-xl p-4 hover:border-[#f97316]/50 transition-all";
  const btnPrimary = "bg-gradient-to-r from-[#f97316] to-[#ea580c] hover:from-[#ea580c] hover:to-[#c2410c] text-white font-medium px-6 py-3 rounded-xl transition-all flex items-center gap-2 disabled:opacity-50";
  const btnSecondary = "bg-white/10 hover:bg-white/20 text-white font-medium px-4 py-2 rounded-lg transition-all flex items-center gap-2";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1628] via-[#1a2744] to-[#0d1f3c] p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
            >
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
          
          {/* Indicador de pasos */}
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map(p => (
              <div 
                key={p}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  paso === p 
                    ? 'bg-[#f97316] text-white' 
                    : paso > p 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/50' 
                      : 'bg-white/10 text-white/40'
                }`}
              >
                {paso > p ? <Check className="w-5 h-5" /> : p}
              </div>
            ))}
          </div>
        </div>

        {/* Alerta si no hay APIs configuradas */}
        {!apisConfiguradas && (
          <div className="mb-6 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-xl text-yellow-400">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5" />
              <div>
                <strong>APIs no configuradas</strong>
                <p className="text-sm text-yellow-400/80 mt-1">
                  Crea un archivo <code className="bg-black/30 px-1 rounded">.env</code> en la raíz del proyecto con:
                </p>
                <pre className="mt-2 text-xs bg-black/30 p-2 rounded overflow-x-auto">
{`VITE_APOLLO_API_KEY=tu_api_key_apollo
VITE_HUNTER_API_KEY=tu_api_key_hunter
VITE_ANTHROPIC_API_KEY=tu_api_key_anthropic`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* PASO 1: Seleccionar fuente */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {paso === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold text-white mb-2">Paso 1: Selecciona la fuente de datos</h2>
              <p className="text-white/60">Elige de dónde extraer los contactos</p>
            </div>

            <div className="grid grid-cols-3 gap-6 max-w-4xl mx-auto">
              {/* Apollo */}
              <button
                onClick={() => setFuenteSeleccionada('apollo')}
                className={`${cardStyle} ${fuenteSeleccionada === 'apollo' ? 'border-[#f97316] bg-[#f97316]/10' : ''}`}
              >
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Globe className="w-8 h-8 text-purple-400" />
                  </div>
                  <h3 className="text-white font-semibold mb-1">Apollo.io</h3>
                  <p className="text-white/50 text-sm">Base de datos B2B</p>
                </div>
              </button>

              {/* Hunter */}
              <button
                onClick={() => setFuenteSeleccionada('hunter')}
                className={`${cardStyle} ${fuenteSeleccionada === 'hunter' ? 'border-[#f97316] bg-[#f97316]/10' : ''}`}
              >
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <Target className="w-8 h-8 text-orange-400" />
                  </div>
                  <h3 className="text-white font-semibold mb-1">Hunter.io</h3>
                  <p className="text-white/50 text-sm">Verificación de emails</p>
                </div>
              </button>

              {/* Ambos */}
              <button
                onClick={() => setFuenteSeleccionada('ambos')}
                className={`${cardStyle} ${fuenteSeleccionada === 'ambos' ? 'border-[#f97316] bg-[#f97316]/10' : ''}`}
              >
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Users className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-white font-semibold mb-1">Ambos</h3>
                  <p className="text-white/50 text-sm">Máxima cobertura</p>
                </div>
              </button>
            </div>

            {/* Filtros básicos */}
            <div className={`${cardStyle} max-w-4xl mx-auto mt-8`}>
              <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                <Filter className="w-5 h-5 text-[#f97316]" />
                Filtros de búsqueda inicial
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white/60 text-sm mb-2 block">País</label>
                  <select 
                    value={filtros.pais}
                    onChange={e => setFiltros(prev => ({ ...prev, pais: e.target.value }))}
                    className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="Mexico">México</option>
                    <option value="United States">Estados Unidos</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-white/60 text-sm mb-2 block">Estados (opcional)</label>
                  <select 
                    multiple
                    value={filtros.estados}
                    onChange={e => setFiltros(prev => ({ 
                      ...prev, 
                      estados: Array.from(e.target.selectedOptions, o => o.value)
                    }))}
                    className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white h-24"
                  >
                    {ESTADOS_MEXICO.map(estado => (
                      <option key={estado} value={estado}>{estado}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Botón buscar */}
            <div className="flex justify-center mt-8">
              <button 
                onClick={handleBuscarContactos}
                disabled={!fuenteSeleccionada || loading || !apisConfiguradas}
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

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* PASO 2: Filtrar con IA */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
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
                      msg.role === 'user' 
                        ? 'bg-[#f97316]/20 ml-8' 
                        : 'bg-white/10 mr-8'
                    }`}
                  >
                    <div className="text-white/80 text-sm whitespace-pre-wrap">{msg.content}</div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex items-center gap-2 text-white/50 p-3">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analizando...
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
                  placeholder="Ej: Elimina empresas de logística..."
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

            {/* Botones de acción */}
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
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> 
                    Validando ({progresValidacion}%)
                  </>
                ) : (
                  <><CheckCircle2 className="w-5 h-5" /> Validar Emails con Hunter</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* PASO 3: Resultados validación */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {paso === 3 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold text-white mb-2">Paso 3: Resultados de Validación</h2>
              <p className="text-white/60">Emails verificados por Hunter.io</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto">
              <div className={cardStyle}>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-1">
                    {contactosFiltrados.filter(c => !c.excluido).length}
                  </div>
                  <div className="text-white/60 text-sm">Total Contactos</div>
                </div>
              </div>
              <div className={cardStyle}>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400 mb-1">
                    {contactosFiltrados.filter(c => !c.excluido && c.emailVerificado).length}
                  </div>
                  <div className="text-white/60 text-sm">Emails Verificados</div>
                </div>
              </div>
              <div className={cardStyle}>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-400 mb-1">
                    {contactosFiltrados.filter(c => !c.excluido && !c.emailVerificado).length}
                  </div>
                  <div className="text-white/60 text-sm">No Verificados</div>
                </div>
              </div>
            </div>

            {/* Lista */}
            <div className={`${cardStyle} max-w-4xl mx-auto`}>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {contactosFiltrados.filter(c => !c.excluido).map(contacto => (
                  <div 
                    key={contacto.id}
                    className={`p-3 rounded-lg flex items-center justify-between ${
                      contacto.emailVerificado 
                        ? 'bg-green-500/10 border border-green-500/30' 
                        : 'bg-red-500/10 border border-red-500/30'
                    }`}
                  >
                    <div>
                      <div className="text-white font-medium">{contacto.nombre} {contacto.apellido}</div>
                      <div className="text-white/60 text-sm">{contacto.empresa} - {contacto.puesto}</div>
                      <div className="text-white/50 text-xs">{contacto.email}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-white/60 text-sm">Score: {contacto.emailScore}%</span>
                      {contacto.emailVerificado ? (
                        <CheckCircle2 className="w-6 h-6 text-green-400" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-between max-w-4xl mx-auto">
              <button onClick={() => setPaso(2)} className={btnSecondary}>
                <ChevronDown className="w-4 h-4 rotate-90" /> Volver a Filtrar
              </button>
              <button onClick={handleGenerarListaFinal} className={btnPrimary}>
                <Download className="w-5 h-5" /> Generar Lista Final
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* PASO 4: Exportar */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {paso === 4 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold text-white mb-2">✅ Lista Final Lista</h2>
              <p className="text-white/60">{contactosFinales.length} contactos verificados listos para exportar</p>
            </div>

            {/* Resumen por prioridad */}
            <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto">
              <div className={`${cardStyle} border-green-500/50`}>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400 mb-1">
                    {contactosFinales.filter(c => c.prioridad === 'A').length}
                  </div>
                  <div className="text-white/60 text-sm">Prioridad A</div>
                </div>
              </div>
              <div className={`${cardStyle} border-yellow-500/50`}>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-400 mb-1">
                    {contactosFinales.filter(c => c.prioridad === 'B').length}
                  </div>
                  <div className="text-white/60 text-sm">Prioridad B</div>
                </div>
              </div>
              <div className={`${cardStyle} border-gray-500/50`}>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-400 mb-1">
                    {contactosFinales.filter(c => c.prioridad === 'C' || !c.prioridad).length}
                  </div>
                  <div className="text-white/60 text-sm">Prioridad C / Sin clasificar</div>
                </div>
              </div>
            </div>

            {/* Tabla final */}
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
                        }`}>
                          {c.prioridad || 'C'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {contactosFinales.length > 20 && (
                <div className="text-center text-white/40 py-2">
                  + {contactosFinales.length - 20} contactos más...
                </div>
              )}
            </div>

            {/* Botones exportar */}
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
