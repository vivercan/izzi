// ═══════════════════════════════════════════════════════════════════════════
// PROSPECCIÓN IA MODULE v6 - Estilo Apollo.io
// 2 columnas fijas, sin scroll de página, filtros desplegables
// ═══════════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { 
  Search, Loader2, Building2, Mail, MapPin, 
  ChevronDown, ChevronRight, Target, Users, X, 
  Plus, Save, Lock, Unlock, Briefcase, Factory,
  Globe, UserCheck, Filter, Database
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

const INDUSTRIAS = [
  'Agroindustrial', 'Alimentos y Bebidas', 'Cárnicos / Pollo', 'Produce / Frutas',
  'Manufactura', 'Automotriz', 'Aeroespacial', 'Construcción', 'Retail',
  'Farmacéutica', 'Química', 'Minería', 'Electrónica', 'Textil', 'Empaque'
];

const JERARQUIAS = [
  { id: 'owner', nombre: 'Dueños / Owner', titles: ['Owner', 'Founder', 'Co-Founder', 'Dueño', 'Socio'] },
  { id: 'clevel', nombre: 'C-Level', titles: ['CEO', 'COO', 'CFO', 'CTO', 'CMO', 'President', 'Chairman'] },
  { id: 'director', nombre: 'Directores', titles: ['Director', 'VP', 'Vice President', 'Director General'] },
  { id: 'gerente', nombre: 'Gerentes', titles: ['Manager', 'Gerente', 'Head of', 'Jefe'] },
  { id: 'coordinador', nombre: 'Coordinadores', titles: ['Coordinator', 'Coordinador', 'Supervisor', 'Lead'] }
];

const FUNCIONES = [
  { id: 'direccion', nombre: 'Dirección General', titles: ['CEO', 'Director General', 'Managing Director', 'President', 'General Manager'] },
  { id: 'operaciones', nombre: 'Operaciones / Planta', titles: ['Operations', 'Plant', 'Production', 'Manufacturing', 'Operaciones', 'Planta', 'Producción'] },
  { id: 'supplychain', nombre: 'Logística / Supply Chain', titles: ['Supply Chain', 'Logistics', 'Distribution', 'Warehouse', 'Logística', 'Cadena de Suministro', 'Almacén'] },
  { id: 'comex', nombre: 'Comercio Exterior', titles: ['Import', 'Export', 'Trade', 'Customs', 'Importación', 'Exportación', 'Comercio Exterior', 'Aduanas'] },
  { id: 'compras', nombre: 'Compras / Procurement', titles: ['Procurement', 'Purchasing', 'Sourcing', 'Buyer', 'Compras', 'Abastecimiento'] },
  { id: 'finanzas', nombre: 'Finanzas Operativas', titles: ['Finance', 'Accounting', 'Controller', 'Finanzas', 'Contabilidad', 'Tesorería'] }
];

const EXCLUSIONES_AUTO = ['logistics', 'transportation', 'trucking', 'freight', '3pl', 'courier', 'banking', 'hotel', 'government', 'ngo'];

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

interface Contacto {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  emailVerificado: boolean;
  empresa: string;
  industria: string;
  puesto: string;
  ciudad: string;
  estado: string;
  fuente: 'apollo' | 'hunter';
  esNuevo?: boolean;
  excluido?: boolean;
}

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
      className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-white/5 transition-colors text-left"
    >
      {expanded ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
      <Icon className="w-4 h-4 text-gray-400" />
      <span className="text-sm font-medium text-gray-200 flex-1">{title}</span>
      {count !== undefined && (
        <span className="text-xs text-gray-500">{count}</span>
      )}
    </button>
    {expanded && (
      <div className="px-3 pb-3 max-h-48 overflow-y-auto">
        {children}
      </div>
    )}
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE CHIP SELECCIONABLE
// ═══════════════════════════════════════════════════════════════════════════

const Chip = ({ 
  label, 
  selected, 
  onClick,
  count
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  count?: number;
}) => (
  <button
    onClick={onClick}
    className={`px-2 py-1 text-xs rounded border transition-all ${
      selected 
        ? 'bg-blue-600/30 border-blue-500/50 text-blue-300' 
        : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600'
    }`}
  >
    {label}
    {count !== undefined && <span className="ml-1 opacity-60">({count})</span>}
  </button>
);

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export const ProspeccionIAModule = ({ onBack }: { onBack: () => void }) => {
  // Estados de filtros
  const [useApollo, setUseApollo] = useState(true);
  const [useHunter, setUseHunter] = useState(false);
  const [soloVerificados, setSoloVerificados] = useState(true);
  const [todoMexico, setTodoMexico] = useState(true);
  const [zonasActivas, setZonasActivas] = useState<string[]>([]);
  const [estadosActivos, setEstadosActivos] = useState<string[]>([]);
  const [empresa, setEmpresa] = useState('');
  const [dominio, setDominio] = useState('');
  const [industriasActivas, setIndustriasActivas] = useState<string[]>([]);
  const [jerarquiasActivas, setJerarquiasActivas] = useState<string[]>(['owner', 'clevel', 'director', 'gerente']);
  const [funcionesActivas, setFuncionesActivas] = useState<string[]>(['direccion', 'operaciones', 'supplychain', 'compras']);

  // Estados de UI
  const [expandedFilters, setExpandedFilters] = useState({
    fuente: true,
    email: true,
    ubicacion: true,
    empresa: false,
    industria: true,
    jerarquia: true,
    funcion: true
  });

  // Estados de datos
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [paginacion, setPaginacion] = useState({ total: 0, page: 0, pages: 0 });
  const [guardando, setGuardando] = useState(false);

  const toggleFilter = (key: keyof typeof expandedFilters) => {
    setExpandedFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // LÓGICA DE BÚSQUEDA (sin cambios)
  // ═══════════════════════════════════════════════════════════════════════════

  const construirTitulos = () => {
    const titles: string[] = [];
    jerarquiasActivas.forEach(j => {
      const jer = JERARQUIAS.find(x => x.id === j);
      if (jer) titles.push(...jer.titles);
    });
    funcionesActivas.forEach(f => {
      const func = FUNCIONES.find(x => x.id === f);
      if (func) titles.push(...func.titles);
    });
    return [...new Set(titles)].slice(0, 15);
  };

  const buscar = async (page = 1) => {
    let ubicaciones: string[] = ['Mexico'];
    if (!todoMexico) {
      if (estadosActivos.length > 0) {
        ubicaciones = estadosActivos.map(e => `${e}, Mexico`);
      } else if (zonasActivas.length > 0) {
        ubicaciones = zonasActivas.flatMap(z => ZONAS[z as keyof typeof ZONAS]?.estados || []).map(e => `${e}, Mexico`);
      }
    }

    const titles = construirTitulos();
    const keywords = industriasActivas.length > 0 ? industriasActivas : undefined;

    const response = await fetch(`${SUPABASE_URL}/functions/v1/prospeccion-api`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
      body: JSON.stringify({
        action: 'apollo_search',
        params: {
          locations: ubicaciones,
          titles: titles,
          company_name: empresa.trim() || undefined,
          keywords: keywords,
          page,
          per_page: 100
        }
      })
    });

    if (!response.ok) throw new Error('Error en búsqueda');
    const data = await response.json();

    let contacts: Contacto[] = (data.contacts || []).map((c: any) => ({
      id: c.id,
      nombre: c.nombre,
      apellido: c.apellido,
      email: c.email,
      emailVerificado: c.emailVerificado,
      empresa: c.empresa,
      industria: c.industria || '',
      puesto: c.puesto,
      ciudad: c.ciudad || '',
      estado: c.estado || '',
      fuente: 'apollo',
      esNuevo: true
    }));

    // Filtrar verificados
    if (soloVerificados) {
      contacts = contacts.filter(c => c.email !== 'email_not_unlocked@domain.com');
    }

    // Excluir industrias no deseadas
    contacts = contacts.filter(c => {
      const ind = (c.industria || '').toLowerCase();
      const emp = (c.empresa || '').toLowerCase();
      return !EXCLUSIONES_AUTO.some(exc => ind.includes(exc) || emp.includes(exc));
    });

    return { contacts, total: data.total || 0, pages: data.total_pages || 0 };
  };

  const handleBuscar = async () => {
    if (!useApollo && !useHunter) return;
    setLoading(true);
    try {
      const { contacts, total, pages } = await buscar(1);
      setContactos(contacts);
      setPaginacion({ total, page: 1, pages });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCargarMas = async () => {
    if (loadingMore || paginacion.page >= paginacion.pages) return;
    setLoadingMore(true);
    try {
      const { contacts } = await buscar(paginacion.page + 1);
      setContactos(prev => [...prev, ...contacts]);
      setPaginacion(prev => ({ ...prev, page: prev.page + 1 }));
    } finally {
      setLoadingMore(false);
    }
  };

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      const nuevos = contactos.filter(c => c.esNuevo && !c.excluido);
      const datos = nuevos.map(c => ({
        source_id: c.id,
        fuente: c.fuente,
        nombre: c.nombre,
        apellido: c.apellido,
        email: c.email === 'email_not_unlocked@domain.com' ? null : c.email,
        empresa: c.empresa,
        industria: c.industria,
        puesto: c.puesto,
        ciudad: c.ciudad,
        estado: c.estado
      }));

      for (let i = 0; i < datos.length; i += 100) {
        await supabase.from('prospeccion_contactos').upsert(datos.slice(i, i + 100), { onConflict: 'source_id,fuente' });
      }
      setContactos(prev => prev.map(c => ({ ...c, esNuevo: false })));
    } finally {
      setGuardando(false);
    }
  };

  const toggleZona = (zona: string) => {
    if (zonasActivas.includes(zona)) {
      setZonasActivas(prev => prev.filter(z => z !== zona));
    } else {
      setZonasActivas(prev => [...prev, zona]);
    }
  };

  const nuevos = contactos.filter(c => c.esNuevo && !c.excluido).length;

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="h-screen bg-[#0f1419] text-gray-100 flex flex-col overflow-hidden">
      {/* ══════════════ HEADER ══════════════ */}
      <header className="h-12 bg-[#15202b] border-b border-gray-800 flex items-center px-4 flex-shrink-0">
        <button onClick={onBack} className="mr-3 p-1.5 hover:bg-white/10 rounded">
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-orange-500" />
          <span className="font-semibold">Prospección IA</span>
        </div>

        <div className="flex-1 flex justify-center">
          <label className="flex items-center gap-2 text-sm text-gray-400">
            <input
              type="checkbox"
              checked={soloVerificados}
              onChange={e => setSoloVerificados(e.target.checked)}
              className="w-4 h-4 rounded bg-gray-700 border-gray-600"
            />
            <UserCheck className="w-4 h-4" />
            Solo emails verificados
          </label>
        </div>

        <div className="flex items-center gap-2">
          {paginacion.total > 0 && (
            <span className="text-xs text-gray-500 mr-2">
              {contactos.length.toLocaleString()} de {paginacion.total.toLocaleString()}
            </span>
          )}
          <button
            onClick={handleBuscar}
            disabled={loading || (!useApollo && !useHunter)}
            className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 rounded text-sm font-medium flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Buscar
          </button>
          <button
            onClick={handleGuardar}
            disabled={guardando || nuevos === 0}
            className="px-4 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded text-sm font-medium flex items-center gap-2"
          >
            {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar {nuevos > 0 && `(${nuevos})`}
          </button>
        </div>
      </header>

      {/* ══════════════ CONTENIDO PRINCIPAL ══════════════ */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ══════════════ PANEL FILTROS (25%) ══════════════ */}
        <aside className="w-72 bg-[#192734] border-r border-gray-800 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            
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
                  className={`flex-1 py-1.5 rounded text-xs font-medium flex items-center justify-center gap-1 transition-all ${
                    useApollo ? 'bg-orange-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  <Target className="w-3 h-3" /> Apollo
                </button>
                <button
                  onClick={() => setUseHunter(!useHunter)}
                  className={`flex-1 py-1.5 rounded text-xs font-medium flex items-center justify-center gap-1 transition-all ${
                    useHunter ? 'bg-orange-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  <Mail className="w-3 h-3" /> Hunter
                </button>
              </div>
            </FilterSection>

            {/* UBICACIÓN */}
            <FilterSection
              icon={MapPin}
              title="Ubicación"
              count={todoMexico ? 'Todo MX' : `${zonasActivas.length} zonas`}
              expanded={expandedFilters.ubicacion}
              onToggle={() => toggleFilter('ubicacion')}
            >
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs cursor-pointer">
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
                  <div className="space-y-1 pt-2 border-t border-gray-700/50">
                    {Object.entries(ZONAS).map(([key, zona]) => (
                      <label key={key} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-white/5 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={zonasActivas.includes(key)}
                          onChange={() => toggleZona(key)}
                          className="w-3 h-3 rounded"
                        />
                        <span className="flex-1">{zona.nombre}</span>
                        <span className="text-gray-500">{zona.estados.length}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </FilterSection>

            {/* EMPRESA */}
            <FilterSection
              icon={Building2}
              title="Empresa"
              expanded={expandedFilters.empresa}
              onToggle={() => toggleFilter('empresa')}
            >
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Nombre de empresa..."
                  value={empresa}
                  onChange={e => setEmpresa(e.target.value)}
                  className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs focus:border-blue-500 outline-none"
                />
                <input
                  type="text"
                  placeholder="Dominio web..."
                  value={dominio}
                  onChange={e => setDominio(e.target.value)}
                  className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs focus:border-blue-500 outline-none"
                />
                <p className="text-xs text-gray-500 italic">
                  Excluye: Logística, Transporte, Bancos, Gobierno
                </p>
              </div>
            </FilterSection>

            {/* INDUSTRIA */}
            <FilterSection
              icon={Factory}
              title="Industria"
              count={industriasActivas.length > 0 ? industriasActivas.length : 'Todas'}
              expanded={expandedFilters.industria}
              onToggle={() => toggleFilter('industria')}
            >
              <div className="flex flex-wrap gap-1">
                {INDUSTRIAS.map(ind => (
                  <Chip
                    key={ind}
                    label={ind}
                    selected={industriasActivas.includes(ind)}
                    onClick={() => setIndustriasActivas(prev => 
                      prev.includes(ind) ? prev.filter(i => i !== ind) : [...prev, ind]
                    )}
                  />
                ))}
              </div>
              {industriasActivas.length > 0 && (
                <button
                  onClick={() => setIndustriasActivas([])}
                  className="mt-2 text-xs text-gray-500 hover:text-gray-300"
                >
                  Limpiar filtros
                </button>
              )}
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
                  <label key={jer.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-white/5 p-1 rounded">
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
              <div className="space-y-1">
                {FUNCIONES.map(func => (
                  <label key={func.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-white/5 p-1 rounded">
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

        {/* ══════════════ PANEL RESULTADOS (75%) ══════════════ */}
        <main className="flex-1 bg-[#0f1419] flex flex-col overflow-hidden">
          
          {/* Subheader resultados */}
          {contactos.length > 0 && (
            <div className="h-10 bg-[#15202b] border-b border-gray-800 flex items-center px-4 flex-shrink-0">
              <span className="text-sm text-gray-400">
                {contactos.length} contactos • Página {paginacion.page} de {paginacion.pages}
              </span>
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-xs px-2 py-1 bg-green-900/30 text-green-400 rounded">
                  {nuevos} nuevos
                </span>
                <button
                  onClick={handleCargarMas}
                  disabled={loadingMore || paginacion.page >= paginacion.pages}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded text-xs flex items-center gap-1"
                >
                  {loadingMore ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                  Cargar más
                </button>
              </div>
            </div>
          )}

          {/* Grid de contactos */}
          <div className="flex-1 overflow-y-auto p-4">
            {contactos.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>Configura los filtros y presiona Buscar</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
                {contactos.map(c => (
                  <div
                    key={c.id}
                    className={`bg-[#192734] rounded-lg p-3 border transition-all hover:border-gray-600 ${
                      c.excluido ? 'opacity-40 border-red-900' :
                      c.esNuevo ? 'border-green-800/50' : 'border-gray-800'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate text-gray-100">
                          {c.nombre} {c.apellido}
                        </p>
                        <p className="text-xs text-gray-400 truncate" title={c.puesto}>
                          {c.puesto}
                        </p>
                      </div>
                      <button
                        onClick={() => setContactos(prev => prev.map(x => 
                          x.id === c.id ? { ...x, excluido: !x.excluido } : x
                        ))}
                        className="ml-2 p-1 hover:bg-white/10 rounded"
                      >
                        <X className="w-3 h-3 text-gray-500" />
                      </button>
                    </div>
                    
                    <p className="text-xs text-blue-400 truncate mb-1" title={c.empresa}>
                      {c.empresa}
                    </p>
                    
                    {c.industria && (
                      <p className="text-xs text-gray-500 truncate mb-1">
                        {c.industria}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-700/50">
                      {c.email === 'email_not_unlocked@domain.com' ? (
                        <button className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300">
                          <Lock className="w-3 h-3" />
                          <span>Desbloquear</span>
                        </button>
                      ) : (
                        <p className="text-xs text-green-400 truncate flex items-center gap-1">
                          <Unlock className="w-3 h-3" />
                          <span className="truncate">{c.email}</span>
                        </p>
                      )}
                    </div>

                    {c.estado && (
                      <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {c.estado}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProspeccionIAModule;
