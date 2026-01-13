// ═══════════════════════════════════════════════════════════════════════════
// PROSPECCIÓN IA MODULE v5 - Diseño ultra compacto
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useRef } from 'react';
import { 
  Search, Loader2, Building2, Mail, MapPin, Sparkles, 
  RefreshCw, ChevronDown, ChevronUp, Send, Bot, Trash2,
  Target, Users, AlertCircle, Check, X, 
  Database, Plus, ArrowRight, Save, Zap, Briefcase, Filter
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fbxbsslhewchyibdoyzk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieGJzc2xoZXdjaHlpYmRveXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzczODEsImV4cCI6MjA3ODExMzM4MX0.Z8JPlg7hhKbA624QGHp2bKKTNtCD3WInQMO5twjl6a0'
);

const SUPABASE_URL = 'https://fbxbsslhewchyibdoyzk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieGJzc2xoZXdjaHlpYmRveXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzczODEsImV4cCI6MjA3ODExMzM4MX0.Z8JPlg7hhKbA624QGHp2bKKTNtCD3WInQMO5twjl6a0';

// ═══════════════════════════════════════════════════════════════════════════
// PUESTOS (compacto)
// ═══════════════════════════════════════════════════════════════════════════
const PUESTOS = {
  direccion: ['CEO', 'President', 'Owner', 'Founder', 'Chairman', 'Director General', 'COO', 'CFO'],
  operaciones: ['VP Operations', 'Operations Director', 'Operations Manager', 'Plant Manager', 'Production Manager', 'Manufacturing Director', 'Quality Manager', 'Gerente de Operaciones', 'Gerente de Planta'],
  supplychain: ['VP Supply Chain', 'Supply Chain Director', 'Supply Chain Manager', 'Logistics Director', 'Logistics Manager', 'Distribution Manager', 'Warehouse Manager', 'Transportation Manager', 'Inventory Manager', 'Gerente de Logística'],
  compras: ['VP Procurement', 'Procurement Director', 'Procurement Manager', 'Purchasing Manager', 'Sourcing Manager', 'Director de Compras', 'Gerente de Compras']
};

// ═══════════════════════════════════════════════════════════════════════════
// INDUSTRIAS DE APOLLO (reales)
// ═══════════════════════════════════════════════════════════════════════════
const INDUSTRIAS = [
  { id: 'automotive', name: 'Automotriz', keywords: ['automotive', 'auto parts'] },
  { id: 'aerospace', name: 'Aeroespacial', keywords: ['aerospace', 'aviation'] },
  { id: 'manufacturing', name: 'Manufactura', keywords: ['manufacturing', 'industrial'] },
  { id: 'food', name: 'Alimentos', keywords: ['food', 'beverages', 'food production'] },
  { id: 'agriculture', name: 'Agroindustrial', keywords: ['agriculture', 'farming'] },
  { id: 'mining', name: 'Minería', keywords: ['mining', 'metals', 'steel'] },
  { id: 'pharmaceutical', name: 'Farmacéutica', keywords: ['pharmaceutical', 'medical'] },
  { id: 'retail', name: 'Retail', keywords: ['retail', 'consumer goods'] },
  { id: 'chemicals', name: 'Químicos', keywords: ['chemicals', 'plastics'] },
  { id: 'construction', name: 'Construcción', keywords: ['construction', 'building'] },
  { id: 'textiles', name: 'Textiles', keywords: ['textiles', 'apparel'] },
  { id: 'electronics', name: 'Electrónica', keywords: ['electronics', 'semiconductors'] },
  { id: 'energy', name: 'Energía', keywords: ['energy', 'oil', 'gas'] },
  { id: 'packaging', name: 'Empaque', keywords: ['packaging', 'containers'] },
  { id: 'logistics', name: 'Logística', keywords: ['logistics', 'transportation'] },
  { id: 'healthcare', name: 'Salud', keywords: ['healthcare', 'hospitals'] }
];

const ZONAS = {
  norte: ['Chihuahua', 'Coahuila', 'Nuevo León', 'Tamaulipas', 'Sonora', 'Baja California'],
  bajio: ['Aguascalientes', 'Guanajuato', 'Querétaro', 'San Luis Potosí', 'Zacatecas'],
  centro: ['CDMX', 'Estado de México', 'Puebla', 'Hidalgo', 'Morelos', 'Tlaxcala'],
  occidente: ['Jalisco', 'Michoacán', 'Colima', 'Nayarit'],
  sur: ['Veracruz', 'Oaxaca', 'Chiapas', 'Guerrero', 'Tabasco']
};

const TODOS_ESTADOS = Object.values(ZONAS).flat();

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
  empresa: string;
  puesto: string;
  fuente: 'apollo' | 'hunter';
  esNuevo?: boolean;
  excluido?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════════════
export const ProspeccionIAModule = ({ onBack }: { onBack: () => void }) => {
  // UI
  const [paso, setPaso] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros
  const [useApollo, setUseApollo] = useState(true);
  const [useHunter, setUseHunter] = useState(false);
  const [empresa, setEmpresa] = useState('');
  const [puestosActivos, setPuestosActivos] = useState<string[]>(['direccion', 'operaciones', 'supplychain']);
  const [industriasActivas, setIndustriasActivas] = useState<string[]>(INDUSTRIAS.map(i => i.id));
  const [estadosActivos, setEstadosActivos] = useState<string[]>([]);
  const [soloVerificados, setSoloVerificados] = useState(true);
  
  // Expandibles
  const [showPuestos, setShowPuestos] = useState(true);
  const [showUbicacion, setShowUbicacion] = useState(false);
  const [showIndustrias, setShowIndustrias] = useState(false);
  
  // Contactos
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [paginacion, setPaginacion] = useState({ total: 0, page: 1, pages: 0 });
  const [guardando, setGuardando] = useState(false);

  // ═══════════════════════════════════════════════════════════════════════════
  // BÚSQUEDA
  // ═══════════════════════════════════════════════════════════════════════════
  
  const buscar = async (page = 1) => {
    const ubicaciones = estadosActivos.length > 0 
      ? estadosActivos.map(e => `${e}, Mexico`)
      : ['Mexico'];

    const puestos = puestosActivos.flatMap(area => PUESTOS[area as keyof typeof PUESTOS] || []);
    const keywords = industriasActivas.flatMap(id => INDUSTRIAS.find(i => i.id === id)?.keywords || []);

    const response = await fetch(`${SUPABASE_URL}/functions/v1/prospeccion-api`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
      body: JSON.stringify({
        action: 'apollo_search',
        params: {
          locations: ubicaciones,
          titles: puestos.slice(0, 15),
          company_name: empresa.trim() || undefined,
          keywords: keywords.length > 0 ? keywords.slice(0, 10) : undefined,
          page,
          per_page: 100
        }
      })
    });

    if (!response.ok) throw new Error('Error en búsqueda');
    const data = await response.json();
    
    let contacts = (data.contacts || []).map((c: any) => ({
      id: c.id,
      source_id: c.id,
      nombre: c.nombre,
      apellido: c.apellido,
      email: c.email,
      emailVerificado: c.emailVerificado,
      empresa: c.empresa,
      puesto: c.puesto,
      fuente: 'apollo' as const,
      esNuevo: true
    }));

    // Filtrar solo verificados si está activo
    if (soloVerificados) {
      contacts = contacts.filter((c: Contacto) => 
        c.emailVerificado || c.email !== 'email_not_unlocked@domain.com'
      );
    }

    return { contacts, total: data.total || 0, pages: data.total_pages || 0 };
  };

  const handleBuscar = async () => {
    if (!useApollo && !useHunter) { setError('Selecciona Apollo o Hunter'); return; }
    setLoading(true);
    setError(null);
    
    try {
      const { contacts, total, pages } = await buscar(1);
      setContactos(contacts);
      setPaginacion({ total, page: 1, pages });
      setPaso(2);
    } catch (err: any) {
      setError(err.message);
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
        source_id: c.source_id,
        fuente: c.fuente,
        nombre: c.nombre,
        apellido: c.apellido,
        email: c.email === 'email_not_unlocked@domain.com' ? null : c.email,
        empresa: c.empresa,
        puesto: c.puesto
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
    const estados = ZONAS[zona as keyof typeof ZONAS];
    const todosActivos = estados.every(e => estadosActivos.includes(e));
    setEstadosActivos(prev => todosActivos 
      ? prev.filter(e => !estados.includes(e))
      : [...new Set([...prev, ...estados])]
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER PASO 1
  // ═══════════════════════════════════════════════════════════════════════════
  
  if (paso === 1) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-3 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <button onClick={onBack} className="p-1 hover:bg-white/10 rounded"><ChevronDown className="w-4 h-4 rotate-90" /></button>
          <Sparkles className="w-5 h-5 text-orange-400" />
          <span className="font-bold">Prospección IA</span>
          
          {/* Fuentes toggle */}
          <div className="flex gap-1 ml-4">
            <button
              onClick={() => setUseApollo(!useApollo)}
              className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${useApollo ? 'bg-orange-500' : 'bg-slate-700'}`}
            >
              <Target className="w-3 h-3" /> Apollo
            </button>
            <button
              onClick={() => setUseHunter(!useHunter)}
              className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${useHunter ? 'bg-orange-500' : 'bg-slate-700'}`}
            >
              <Mail className="w-3 h-3" /> Hunter
            </button>
          </div>

          {/* Empresa */}
          <input
            type="text"
            placeholder="Empresa específica..."
            value={empresa}
            onChange={e => setEmpresa(e.target.value)}
            className="ml-4 px-2 py-1 bg-slate-700 rounded text-xs w-40 border border-gray-600"
          />

          {/* Solo verificados */}
          <label className="flex items-center gap-1 ml-4 text-xs cursor-pointer">
            <input type="checkbox" checked={soloVerificados} onChange={e => setSoloVerificados(e.target.checked)} className="w-3 h-3" />
            Solo emails válidos
          </label>

          {/* Botón buscar */}
          <button
            onClick={handleBuscar}
            disabled={loading || (!useApollo && !useHunter)}
            className="ml-auto px-4 py-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 rounded text-xs font-medium flex items-center gap-1"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
            Buscar
          </button>
        </div>

        {error && (
          <div className="mb-2 p-2 bg-red-500/20 border border-red-500 rounded text-xs flex items-center gap-2">
            <AlertCircle className="w-3 h-3" />{error}
            <button onClick={() => setError(null)} className="ml-auto"><X className="w-3 h-3" /></button>
          </div>
        )}

        {/* Contenido principal */}
        <div className="flex-1 grid grid-cols-3 gap-2 overflow-hidden">
          {/* Puestos */}
          <div className="bg-slate-800/50 rounded p-2 overflow-auto">
            <div className="flex items-center gap-1 mb-2 cursor-pointer" onClick={() => setShowPuestos(!showPuestos)}>
              <Briefcase className="w-3 h-3 text-blue-400" />
              <span className="text-xs font-medium">Puestos</span>
              <span className="text-xs text-gray-400 ml-auto">{puestosActivos.length} áreas</span>
              {showPuestos ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </div>
            {showPuestos && (
              <div className="space-y-1">
                {Object.entries(PUESTOS).map(([area, puestos]) => (
                  <label key={area} className={`flex items-center gap-1 p-1 rounded text-xs cursor-pointer ${puestosActivos.includes(area) ? 'bg-blue-600/30' : 'bg-slate-700/50'}`}>
                    <input
                      type="checkbox"
                      checked={puestosActivos.includes(area)}
                      onChange={() => setPuestosActivos(prev => prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area])}
                      className="w-3 h-3"
                    />
                    <span className="capitalize">{area}</span>
                    <span className="text-gray-400 ml-auto">{puestos.length}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Ubicación */}
          <div className="bg-slate-800/50 rounded p-2 overflow-auto">
            <div className="flex items-center gap-1 mb-2 cursor-pointer" onClick={() => setShowUbicacion(!showUbicacion)}>
              <MapPin className="w-3 h-3 text-red-400" />
              <span className="text-xs font-medium">Ubicación</span>
              <span className="text-xs text-gray-400 ml-auto">{estadosActivos.length || 'Todo MX'}</span>
              {showUbicacion ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </div>
            {showUbicacion && (
              <div className="space-y-1">
                <button
                  onClick={() => setEstadosActivos(estadosActivos.length === TODOS_ESTADOS.length ? [] : [...TODOS_ESTADOS])}
                  className="w-full px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs mb-1"
                >
                  {estadosActivos.length === TODOS_ESTADOS.length ? 'Limpiar' : 'Todo México'}
                </button>
                {Object.entries(ZONAS).map(([zona, estados]) => {
                  const activos = estados.filter(e => estadosActivos.includes(e)).length;
                  return (
                    <label key={zona} className={`flex items-center gap-1 p-1 rounded text-xs cursor-pointer ${activos === estados.length ? 'bg-orange-600/30' : activos > 0 ? 'bg-orange-600/20' : 'bg-slate-700/50'}`}>
                      <input
                        type="checkbox"
                        checked={activos === estados.length}
                        onChange={() => toggleZona(zona)}
                        className="w-3 h-3"
                      />
                      <span className="capitalize">{zona}</span>
                      <span className="text-gray-400 ml-auto">{activos}/{estados.length}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Industrias */}
          <div className="bg-slate-800/50 rounded p-2 overflow-auto">
            <div className="flex items-center gap-1 mb-2 cursor-pointer" onClick={() => setShowIndustrias(!showIndustrias)}>
              <Filter className="w-3 h-3 text-purple-400" />
              <span className="text-xs font-medium">Industrias</span>
              <span className="text-xs text-gray-400 ml-auto">{industriasActivas.length}/{INDUSTRIAS.length}</span>
              {showIndustrias ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </div>
            {showIndustrias && (
              <div className="space-y-1">
                <button
                  onClick={() => setIndustriasActivas(industriasActivas.length === INDUSTRIAS.length ? [] : INDUSTRIAS.map(i => i.id))}
                  className="w-full px-2 py-1 bg-purple-600 hover:bg-purple-700 rounded text-xs mb-1"
                >
                  {industriasActivas.length === INDUSTRIAS.length ? 'Limpiar' : 'Todas'}
                </button>
                <div className="grid grid-cols-2 gap-1">
                  {INDUSTRIAS.map(ind => (
                    <label key={ind.id} className={`flex items-center gap-1 p-1 rounded text-xs cursor-pointer truncate ${industriasActivas.includes(ind.id) ? 'bg-purple-600/30' : 'bg-slate-700/50'}`}>
                      <input
                        type="checkbox"
                        checked={industriasActivas.includes(ind.id)}
                        onChange={() => setIndustriasActivas(prev => prev.includes(ind.id) ? prev.filter(i => i !== ind.id) : [...prev, ind.id])}
                        className="w-3 h-3"
                      />
                      <span className="truncate">{ind.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER PASO 2 - Grid de contactos
  // ═══════════════════════════════════════════════════════════════════════════
  
  const nuevos = contactos.filter(c => c.esNuevo && !c.excluido).length;

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-3 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <button onClick={() => setPaso(1)} className="p-1 hover:bg-white/10 rounded"><ChevronDown className="w-4 h-4 rotate-90" /></button>
        <Sparkles className="w-5 h-5 text-orange-400" />
        <span className="font-bold">Contactos ({contactos.length})</span>
        <span className="text-xs text-gray-400">{contactos.length} de {paginacion.total.toLocaleString()} • Pág {paginacion.page}/{paginacion.pages}</span>
        
        <div className="flex gap-1 ml-auto">
          <span className="px-2 py-1 bg-green-600/30 text-green-400 rounded text-xs">🆕 {nuevos}</span>
        </div>

        <button
          onClick={handleCargarMas}
          disabled={loadingMore || paginacion.page >= paginacion.pages}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded text-xs flex items-center gap-1"
        >
          {loadingMore ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
          +100
        </button>

        <button
          onClick={handleGuardar}
          disabled={guardando || nuevos === 0}
          className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded text-xs flex items-center gap-1"
        >
          {guardando ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
          Guardar {nuevos}
        </button>
      </div>

      {/* Grid de contactos - 6 columnas */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-6 gap-1">
          {contactos.map(c => (
            <div
              key={c.id}
              className={`p-2 rounded border text-xs ${
                c.excluido ? 'border-red-800 bg-red-900/20 opacity-40' :
                c.esNuevo ? 'border-green-600/50 bg-green-900/20' :
                'border-gray-700 bg-slate-800/50'
              }`}
            >
              <div className="flex items-start justify-between gap-1">
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{c.nombre} {c.apellido}</p>
                  <p className="text-gray-400 truncate">{c.puesto}</p>
                  <p className="text-blue-400 truncate">{c.empresa}</p>
                  <p className={`truncate ${c.email === 'email_not_unlocked@domain.com' ? 'text-yellow-500' : 'text-gray-500'}`}>
                    {c.email === 'email_not_unlocked@domain.com' ? '🔒' : c.email}
                  </p>
                </div>
                <button
                  onClick={() => setContactos(prev => prev.map(x => x.id === c.id ? { ...x, excluido: !x.excluido } : x))}
                  className="p-0.5 hover:bg-white/10 rounded flex-shrink-0"
                >
                  {c.excluido ? <RefreshCw className="w-3 h-3" /> : <X className="w-3 h-3 text-red-400" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProspeccionIAModule;
