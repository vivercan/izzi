import { ModuleTemplate } from './ModuleTemplate';
import { useState, useEffect } from 'react';
import { MODULE_IMAGES } from '../../assets/module-images';
import { Building2, Globe, User, Phone, Mail, MapPinned, MapPin, Users, Calendar, TrendingUp, AlertCircle, Save, Check } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM FX27 - TOKENS EXACTOS DEL PANEL DE OPORTUNIDADES
// ═══════════════════════════════════════════════════════════════════════════════

const FX27 = {
  // Colores base
  colors: {
    text: {
      primary: 'rgba(255,255,255,0.95)',
      secondary: 'rgba(148,163,184,0.90)',
      muted: 'rgba(148,163,184,0.70)',
    },
    accent: {
      green: '#22C55E',
      blue: '#3B82F6',
      orange: '#F97316',
      cyan: '#06B6D4',
      purple: '#A855F7',
      pink: '#EC4899',
      amber: '#F59E0B',
    }
  },
  // Card premium - igual al Panel
  card: {
    background: 'linear-gradient(135deg, rgba(30,58,138,0.60) 0%, rgba(30,64,175,0.50) 100%)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
    boxShadow: '0 12px 40px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 0 0 1px rgba(255,255,255,0.03)',
    backdropFilter: 'blur(12px)',
  },
  // Input premium - igual al Panel
  input: {
    background: 'rgba(15,23,42,0.50)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.20)',
    color: 'rgba(255,255,255,0.95)',
    placeholder: 'rgba(255,255,255,0.35)',
  },
  // Botón premium - igual al Panel
  button: {
    primary: {
      background: 'linear-gradient(180deg, rgba(59,130,246,0.30) 0%, rgba(37,99,235,0.25) 100%)',
      border: '1px solid rgba(59,130,246,0.40)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.20), inset 0 1px 0 rgba(255,255,255,0.10)',
    },
    default: {
      background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 100%)',
      border: '1px solid rgba(255,255,255,0.10)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.20), inset 0 1px 0 rgba(255,255,255,0.10)',
    }
  }
};

interface AgregarLeadModuleProps { onBack: () => void; }
interface Lead { id: string; nombreEmpresa: string; paginaWeb: string; nombreContacto: string; telefonoContacto: string; correoElectronico: string; tipoEmpresa: string; ciudad: string; estado: string; prioridad: string; tamanoEmpresa: string; fechaEstimadaCierre: string; tipoServicio: string[]; tipoViaje: string[]; transbordo: boolean; dtd: boolean; principalesRutas: string; viajesPorMes: string; tarifa: string; proyectadoVentaMensual: string; proximosPasos: string; etapaLead: string; altaCliente: boolean; generacionSOP: boolean; juntaArranque: boolean; facturado: boolean; vendedor: string; fechaCaptura: string; }

const TIPOS_SERVICIO = ['Seco', 'Refrigerado', 'Seco Hazmat', 'Refri Hazmat'];
const TIPOS_VIAJE = ['Impo', 'Expo', 'Nacional', 'Dedicado'];
const TIPOS_EMPRESA = ['Agroalimentario', 'Proteína/Cárnicos', 'Lácteos', 'Alimentos procesados', 'Bebidas', 'Farma/Salud', 'Químicos', 'Plásticos', 'Papel/Cartón', 'CPG', 'Retail/e-commerce', 'Electrónica', 'Automotriz OEM', 'Automotriz Aftermarket', 'Metales', 'Maquinaria', 'Construcción', 'Textil/Moda', 'Muebles/Línea Blanca', 'Aeroespacial', '3PL', 'Línea Americana', 'Agencia Aduanal'];
const PRIORIDADES = ['🔴 Alta', '🟡 Media', '🟢 Baja'];
const TAMANOS = ['1-50', '51-200', '201-1000', '1000+'];

// Colores de chips - igual al Panel
const getChipStyleServicio = (tipo: string, selected: boolean) => {
  const t = tipo.toLowerCase();
  if (selected) {
    if (t.includes('refrigerado') && t.includes('hazmat')) return { bg: 'rgba(236,72,153,0.25)', border: 'rgba(236,72,153,0.50)', color: 'rgba(251,207,232,0.95)' };
    if (t.includes('hazmat')) return { bg: 'rgba(168,85,247,0.25)', border: 'rgba(168,85,247,0.50)', color: 'rgba(233,213,255,0.95)' };
    if (t.includes('refrigerado')) return { bg: 'rgba(6,182,212,0.25)', border: 'rgba(6,182,212,0.50)', color: 'rgba(207,250,254,0.95)' };
    return { bg: 'rgba(100,116,139,0.25)', border: 'rgba(148,163,184,0.50)', color: 'rgba(226,232,240,0.95)' };
  }
  return { bg: 'rgba(15,23,42,0.50)', border: 'rgba(255,255,255,0.08)', color: 'rgba(148,163,184,0.80)' };
};

const getChipStyleViaje = (tipo: string, selected: boolean) => {
  const t = tipo.toLowerCase();
  if (selected) {
    if (t === 'nacional') return { bg: 'rgba(34,197,94,0.25)', border: 'rgba(34,197,94,0.50)', color: 'rgba(187,247,208,0.95)' };
    if (t === 'expo') return { bg: 'rgba(59,130,246,0.25)', border: 'rgba(59,130,246,0.50)', color: 'rgba(191,219,254,0.95)' };
    if (t === 'impo') return { bg: 'rgba(245,158,11,0.25)', border: 'rgba(245,158,11,0.50)', color: 'rgba(254,243,199,0.95)' };
    if (t === 'dedicado') return { bg: 'rgba(139,92,246,0.25)', border: 'rgba(139,92,246,0.50)', color: 'rgba(221,214,254,0.95)' };
  }
  return { bg: 'rgba(15,23,42,0.50)', border: 'rgba(255,255,255,0.08)', color: 'rgba(148,163,184,0.80)' };
};

export const AgregarLeadModule = ({ onBack }: AgregarLeadModuleProps) => {
  const [formData, setFormData] = useState<Partial<Lead>>({ nombreEmpresa: '', paginaWeb: '', nombreContacto: '', telefonoContacto: '', correoElectronico: '', tipoEmpresa: '', ciudad: '', estado: '', prioridad: '🟡 Media', tamanoEmpresa: '', fechaEstimadaCierre: '', tipoServicio: [], tipoViaje: [], transbordo: false, dtd: false, principalesRutas: '', viajesPorMes: '', tarifa: '', proyectadoVentaMensual: '', proximosPasos: '', etapaLead: 'Prospecto', vendedor: '', altaCliente: false, generacionSOP: false, juntaArranque: false, facturado: false });

  useEffect(() => {
    const session = localStorage.getItem('fx27-session');
    if (session) { try { const { email } = JSON.parse(session); const usuarios = JSON.parse(localStorage.getItem('fx27-usuarios') || '[]'); const u = usuarios.find((x: any) => x.correo === email); if (u) setFormData(p => ({ ...p, vendedor: u.nombre })); } catch {} }
  }, []);

  const handleInput = (f: keyof Lead, v: string) => {
    if (f === 'nombreEmpresa') setFormData({ ...formData, [f]: v.toUpperCase() });
    else if (f === 'nombreContacto') setFormData({ ...formData, [f]: v.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') });
    else if (f === 'correoElectronico') setFormData({ ...formData, [f]: v.toLowerCase() });
    else setFormData({ ...formData, [f]: v });
  };
  const toggleServ = (t: string) => { const s = formData.tipoServicio || []; setFormData({ ...formData, tipoServicio: s.includes(t) ? s.filter(x => x !== t) : [...s, t] }); };
  const toggleViaje = (t: string) => { const v = formData.tipoViaje || []; setFormData({ ...formData, tipoViaje: v.includes(t) ? v.filter(x => x !== t) : [...v, t] }); };

  const handleSubmit = async () => {
    if (!formData.nombreEmpresa) { alert('❌ Ingresa el Nombre de la Empresa'); return; }
    try {
      const chk = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/leads`, { headers: { 'Authorization': `Bearer ${publicAnonKey}` } });
      const res = await chk.json();
      if (chk.ok && res.success) { const ex = res.leads.find((l: Lead) => l.nombreEmpresa.toLowerCase().trim() === formData.nombreEmpresa!.toLowerCase().trim()); if (ex) { alert(`❌ DUPLICADA: "${formData.nombreEmpresa}" ya existe (${ex.vendedor})`); return; } }
    } catch {}
    const lead: Lead = { id: Date.now().toString(), nombreEmpresa: formData.nombreEmpresa!, paginaWeb: formData.paginaWeb || '', nombreContacto: formData.nombreContacto || '', telefonoContacto: formData.telefonoContacto || '', correoElectronico: formData.correoElectronico || '', tipoEmpresa: formData.tipoEmpresa || '', ciudad: formData.ciudad || '', estado: formData.estado || '', prioridad: formData.prioridad || '🟡 Media', tamanoEmpresa: formData.tamanoEmpresa || '', fechaEstimadaCierre: formData.fechaEstimadaCierre || '', tipoServicio: formData.tipoServicio || [], tipoViaje: formData.tipoViaje || [], transbordo: formData.transbordo || false, dtd: formData.dtd || false, principalesRutas: formData.principalesRutas || '', viajesPorMes: formData.viajesPorMes || '', tarifa: formData.tarifa || '', proyectadoVentaMensual: formData.proyectadoVentaMensual || '', proximosPasos: formData.proximosPasos || '', etapaLead: 'Prospecto', vendedor: formData.vendedor!, fechaCaptura: new Date().toISOString(), altaCliente: formData.altaCliente || false, generacionSOP: formData.generacionSOP || false, juntaArranque: formData.juntaArranque || false, facturado: formData.facturado || false };
    try {
      const r = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/leads`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${publicAnonKey}` }, body: JSON.stringify(lead) });
      const j = await r.json(); if (!r.ok || !j.success) throw new Error(j.error || 'Error');
      alert('✅ Lead guardado');
      setFormData({ nombreEmpresa: '', paginaWeb: '', nombreContacto: '', telefonoContacto: '', correoElectronico: '', tipoEmpresa: '', ciudad: '', estado: '', prioridad: '🟡 Media', tamanoEmpresa: '', fechaEstimadaCierre: '', tipoServicio: [], tipoViaje: [], transbordo: false, dtd: false, principalesRutas: '', viajesPorMes: '', tarifa: '', proyectadoVentaMensual: '', proximosPasos: '', etapaLead: 'Prospecto', vendedor: formData.vendedor, altaCliente: false, generacionSOP: false, juntaArranque: false, facturado: false });
    } catch (e) { alert(`❌ Error: ${e}`); }
  };

  // ═══════════════════════════════════════════════════════════════
  // COMPONENTES REUTILIZABLES - DESIGN SYSTEM FX27
  // ═══════════════════════════════════════════════════════════════

  // Checkbox Premium - igual estilo Panel
  const PremiumCheckbox = ({ checked, onChange, label, accentColor }: { checked: boolean; onChange: (v: boolean) => void; label: string; accentColor: string }) => (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <div 
        onClick={(e) => { e.preventDefault(); onChange(!checked); }}
        className="transition-all duration-150"
        style={{
          width: '16px', height: '16px', borderRadius: '4px',
          background: checked ? accentColor : 'rgba(15,23,42,0.50)',
          border: `1.5px solid ${checked ? accentColor : 'rgba(255,255,255,0.15)'}`,
          boxShadow: checked ? `0 2px 8px ${accentColor}50, inset 0 1px 0 rgba(255,255,255,0.20)` : 'inset 0 1px 2px rgba(0,0,0,0.20)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
      >
        {checked && <Check style={{ width: '10px', height: '10px', color: 'white', strokeWidth: 3 }} />}
      </div>
      <span style={{ color: checked ? 'rgba(255,255,255,0.95)' : 'rgba(148,163,184,0.85)', fontSize: '13px', fontWeight: checked ? 600 : 500, fontFamily: "'Exo 2', sans-serif" }}>{label}</span>
    </label>
  );

  // Input Premium - HUNDIDO igual al Panel
  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: '36px',
    padding: '0 12px',
    borderRadius: '12px',
    background: FX27.input.background,
    border: FX27.input.border,
    boxShadow: FX27.input.boxShadow,
    color: FX27.input.color,
    fontSize: '13px',
    fontFamily: "'Exo 2', sans-serif",
    outline: 'none',
    transition: 'all 0.15s ease'
  };

  // Card Section - igual al Panel
  const cardStyle: React.CSSProperties = {
    background: FX27.card.background,
    border: FX27.card.border,
    borderRadius: FX27.card.borderRadius,
    boxShadow: FX27.card.boxShadow,
    backdropFilter: FX27.card.backdropFilter,
    padding: '14px'
  };

  // Label con acento izquierdo - igual al Panel
  const SectionHeader = ({ icon: Icon, label, accentColor }: { icon: any; label: string; accentColor: string }) => (
    <div className="flex items-center gap-2 mb-3" style={{ paddingLeft: '10px', borderLeft: `3px solid ${accentColor}` }}>
      <Icon style={{ width: '14px', height: '14px', color: accentColor }} />
      <span style={{ color: 'rgba(255,255,255,0.95)', fontSize: '13px', fontWeight: 600, fontFamily: "'Exo 2', sans-serif", letterSpacing: '0.3px' }}>{label}</span>
    </div>
  );

  // Chip Seleccionable - mismo estilo que Panel (NO arcade)
  const SelectableChip = ({ label, selected, onClick, styleGetter }: { label: string; selected: boolean; onClick: () => void; styleGetter: (t: string, s: boolean) => { bg: string; border: string; color: string } }) => {
    const styles = styleGetter(label, selected);
    return (
      <button
        type="button"
        onClick={onClick}
        className="transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0"
        style={{
          height: '32px',
          padding: '0 14px',
          borderRadius: '10px', // NO 9999px - más premium
          background: styles.bg,
          border: `1px solid ${styles.border}`,
          color: styles.color,
          fontSize: '12px',
          fontWeight: selected ? 600 : 500,
          fontFamily: "'Exo 2', sans-serif",
          boxShadow: selected ? '0 4px 12px rgba(0,0,0,0.20), inset 0 1px 0 rgba(255,255,255,0.15)' : 'inset 0 1px 2px rgba(0,0,0,0.15)',
          cursor: 'pointer'
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <ModuleTemplate title="Agregar Lead" onBack={onBack} headerImage={MODULE_IMAGES.AGREGAR_LEAD}>
      {/* ═══════════════════════════════════════════════════════════════
          FONDO GLOBAL AAA - IDÉNTICO AL PANEL DE OPORTUNIDADES
          ═══════════════════════════════════════════════════════════════ */}
      <div 
        className="flex flex-col relative"
        style={{
          height: 'calc(100vh - 120px)',
          background: `
            radial-gradient(ellipse 120% 80% at 50% 20%, rgba(37,99,235,0.95) 0%, rgba(30,64,175,0.98) 40%, rgba(15,23,42,1) 100%),
            linear-gradient(180deg, #1e3a8a 0%, #0f172a 100%)
          `
        }}
      >
        {/* Noise texture overlay - igual al Panel */}
        <div 
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            opacity: 0.035,
            mixBlendMode: 'overlay'
          }}
        />
        
        {/* Radial glow - igual al Panel */}
        <div 
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            background: `
              radial-gradient(ellipse 70% 50% at 50% 45%, rgba(59,130,246,0.12) 0%, transparent 60%),
              radial-gradient(ellipse 90% 60% at 50% 50%, rgba(30,58,138,0.20) 0%, transparent 70%)
            `
          }}
        />
        
        {/* Vignette - igual al Panel */}
        <div 
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            background: 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(0,0,0,0.25) 100%)'
          }}
        />

        {/* ═══════════════════════════════════════════════════════════════
            CONTENEDOR PRINCIPAL - GRID 2 FILAS (contenido + footer)
            ═══════════════════════════════════════════════════════════════ */}
        <div 
          className="flex-1 mx-4 my-4 rounded-2xl relative z-10"
          style={{
            display: 'grid',
            gridTemplateRows: '1fr auto',
            background: 'linear-gradient(180deg, rgba(15,23,42,0.92) 0%, rgba(15,23,42,0.96) 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.06)',
            backdropFilter: 'blur(16px)',
            overflow: 'hidden'
          }}
        >
          {/* CONTENIDO - 3 COLUMNAS */}
          <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', minHeight: 0 }}>
            
            {/* ═══════════════════════════════════════════════════════════════
                COLUMNA 1: EMPRESA + CONTACTO + UBICACIÓN
                ═══════════════════════════════════════════════════════════════ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* NIVEL 1: EMPRESA */}
              <div style={cardStyle}>
                <SectionHeader icon={Building2} label="NIVEL 1 • EMPRESA" accentColor={FX27.colors.accent.green} />
                <input
                  type="text"
                  value={formData.nombreEmpresa}
                  onChange={e => handleInput('nombreEmpresa', e.target.value)}
                  placeholder="EMPRESA S.A. DE C.V."
                  required
                  style={{ ...inputStyle, fontSize: '14px', fontWeight: 700, height: '40px' }}
                  className="focus:ring-2 focus:ring-blue-400/30"
                />
              </div>

              {/* Web + Contacto */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={cardStyle}>
                  <div style={{ color: 'rgba(148,163,184,0.90)', fontSize: '12px', fontWeight: 600, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Globe style={{ width: '12px', height: '12px' }} />Web
                  </div>
                  <input type="text" value={formData.paginaWeb} onChange={e => handleInput('paginaWeb', e.target.value)} placeholder="www.empresa.com" style={inputStyle} />
                </div>
                <div style={cardStyle}>
                  <div style={{ color: 'rgba(148,163,184,0.90)', fontSize: '12px', fontWeight: 600, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User style={{ width: '12px', height: '12px' }} />Contacto
                  </div>
                  <input type="text" value={formData.nombreContacto} onChange={e => handleInput('nombreContacto', e.target.value)} placeholder="Juan Pérez" style={inputStyle} />
                </div>
              </div>

              {/* Tel + Email */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={cardStyle}>
                  <div style={{ color: 'rgba(148,163,184,0.90)', fontSize: '12px', fontWeight: 600, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Phone style={{ width: '12px', height: '12px' }} />Teléfono
                  </div>
                  <input type="tel" value={formData.telefonoContacto} onChange={e => handleInput('telefonoContacto', e.target.value)} placeholder="55 1234 5678" style={inputStyle} />
                </div>
                <div style={cardStyle}>
                  <div style={{ color: 'rgba(148,163,184,0.90)', fontSize: '12px', fontWeight: 600, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mail style={{ width: '12px', height: '12px' }} />Email
                  </div>
                  <input type="email" value={formData.correoElectronico} onChange={e => handleInput('correoElectronico', e.target.value)} placeholder="mail@empresa.com" style={inputStyle} />
                </div>
              </div>

              {/* Tipo Empresa */}
              <div style={cardStyle}>
                <div style={{ color: 'rgba(148,163,184,0.90)', fontSize: '12px', fontWeight: 600, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building2 style={{ width: '12px', height: '12px' }} />Tipo de Empresa
                </div>
                <select value={formData.tipoEmpresa} onChange={e => handleInput('tipoEmpresa', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">Selecciona...</option>
                  {TIPOS_EMPRESA.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Ciudad + Estado + Prioridad */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div style={cardStyle}>
                  <div style={{ color: 'rgba(148,163,184,0.90)', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>Ciudad</div>
                  <input type="text" value={formData.ciudad} onChange={e => handleInput('ciudad', e.target.value)} placeholder="Monterrey" style={{ ...inputStyle, height: '32px', fontSize: '12px' }} />
                </div>
                <div style={cardStyle}>
                  <div style={{ color: 'rgba(148,163,184,0.90)', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>Estado</div>
                  <input type="text" value={formData.estado} onChange={e => handleInput('estado', e.target.value)} placeholder="Nuevo León" style={{ ...inputStyle, height: '32px', fontSize: '12px' }} />
                </div>
                <div style={cardStyle}>
                  <div style={{ color: 'rgba(148,163,184,0.90)', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>Prioridad</div>
                  <select value={formData.prioridad} onChange={e => handleInput('prioridad', e.target.value)} style={{ ...inputStyle, height: '32px', fontSize: '12px', cursor: 'pointer' }}>
                    {PRIORIDADES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                COLUMNA 2: SERVICIOS + VIAJE + NOTAS
                ═══════════════════════════════════════════════════════════════ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* TIPO SERVICIO */}
              <div style={cardStyle}>
                <SectionHeader icon={TrendingUp} label="TIPO DE SERVICIO" accentColor={FX27.colors.accent.blue} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {TIPOS_SERVICIO.map(t => (
                    <SelectableChip key={t} label={t} selected={formData.tipoServicio?.includes(t) || false} onClick={() => toggleServ(t)} styleGetter={getChipStyleServicio} />
                  ))}
                </div>
              </div>

              {/* TIPO VIAJE */}
              <div style={cardStyle}>
                <SectionHeader icon={MapPin} label="TIPO DE VIAJE" accentColor={FX27.colors.accent.green} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {TIPOS_VIAJE.map(t => (
                    <SelectableChip key={t} label={t} selected={formData.tipoViaje?.includes(t) || false} onClick={() => toggleViaje(t)} styleGetter={getChipStyleViaje} />
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '20px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <PremiumCheckbox checked={formData.transbordo || false} onChange={v => setFormData({ ...formData, transbordo: v })} label="Transbordo" accentColor={FX27.colors.accent.green} />
                  <PremiumCheckbox checked={formData.dtd || false} onChange={v => setFormData({ ...formData, dtd: v })} label="DTD" accentColor={FX27.colors.accent.green} />
                </div>
              </div>

              {/* PRÓXIMOS PASOS */}
              <div style={{ ...cardStyle, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <SectionHeader icon={AlertCircle} label="PRÓXIMOS PASOS" accentColor={FX27.colors.accent.amber} />
                <textarea
                  value={formData.proximosPasos}
                  onChange={e => handleInput('proximosPasos', e.target.value)}
                  placeholder="Describe los próximos pasos..."
                  style={{
                    flex: 1,
                    minHeight: '80px',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    background: FX27.input.background,
                    border: FX27.input.border,
                    boxShadow: FX27.input.boxShadow,
                    color: FX27.input.color,
                    fontSize: '13px',
                    fontFamily: "'Exo 2', sans-serif",
                    lineHeight: '1.5',
                    outline: 'none',
                    resize: 'none'
                  }}
                />
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                COLUMNA 3: FINANZAS + HITOS
                ═══════════════════════════════════════════════════════════════ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* NIVEL 3: FINANZAS */}
              <div style={cardStyle}>
                <SectionHeader icon={TrendingUp} label="NIVEL 3 • FINANZAS" accentColor={FX27.colors.accent.orange} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input type="text" value={formData.principalesRutas} onChange={e => handleInput('principalesRutas', e.target.value)} placeholder="CDMX - MTY - GDL" style={inputStyle} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <input type="number" value={formData.viajesPorMes} onChange={e => handleInput('viajesPorMes', e.target.value)} placeholder="Viajes/Mes" style={inputStyle} />
                    <input type="text" value={formData.tarifa} onChange={e => handleInput('tarifa', e.target.value)} placeholder="Tarifa" style={inputStyle} />
                  </div>
                  <input type="text" value={formData.proyectadoVentaMensual} onChange={e => handleInput('proyectadoVentaMensual', e.target.value)} placeholder="Proyectado USD: $50k-$100k" style={inputStyle} />
                </div>
              </div>

              {/* HITOS */}
              <div style={cardStyle}>
                <SectionHeader icon={TrendingUp} label="HITOS DEL CLIENTE" accentColor={FX27.colors.accent.cyan} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { k: 'altaCliente', l: 'N4 • Alta de Cliente', c: FX27.colors.accent.cyan },
                    { k: 'generacionSOP', l: 'N5 • Generación SOP', c: FX27.colors.accent.purple },
                    { k: 'juntaArranque', l: 'N6 • Junta de Arranque', c: FX27.colors.accent.pink },
                    { k: 'facturado', l: 'N7 • Facturado', c: FX27.colors.accent.amber },
                  ].map(({ k, l, c }) => (
                    <PremiumCheckbox key={k} checked={formData[k as keyof Lead] as boolean || false} onChange={v => setFormData({ ...formData, [k]: v })} label={l} accentColor={c} />
                  ))}
                </div>
              </div>

              {/* Tamaño + Fecha */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={cardStyle}>
                  <div style={{ color: 'rgba(148,163,184,0.90)', fontSize: '11px', fontWeight: 600, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Users style={{ width: '11px', height: '11px' }} />Tamaño
                  </div>
                  <select value={formData.tamanoEmpresa} onChange={e => handleInput('tamanoEmpresa', e.target.value)} style={{ ...inputStyle, height: '32px', fontSize: '12px', cursor: 'pointer' }}>
                    <option value="">-</option>
                    {TAMANOS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div style={cardStyle}>
                  <div style={{ color: 'rgba(148,163,184,0.90)', fontSize: '11px', fontWeight: 600, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar style={{ width: '11px', height: '11px' }} />Cierre Est.
                  </div>
                  <input type="date" value={formData.fechaEstimadaCierre} onChange={e => handleInput('fechaEstimadaCierre', e.target.value)} style={{ ...inputStyle, height: '32px', fontSize: '11px' }} />
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              FOOTER - IGUAL ESTILO AL PANEL
              ═══════════════════════════════════════════════════════════════ */}
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: 'linear-gradient(180deg, rgba(30,58,138,0.40) 0%, rgba(30,64,175,0.35) 100%)',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(12px)'
            }}
          >
            {/* Info Vendedor */}
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px 16px',
                borderRadius: '12px',
                background: 'rgba(15,23,42,0.50)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.15)'
              }}
            >
              <span style={{ color: 'rgba(148,163,184,0.90)', fontSize: '13px', fontFamily: "'Exo 2', sans-serif" }}>
                Vendedor: <span style={{ color: 'rgba(255,255,255,0.95)', fontWeight: 600 }}>{formData.vendedor || '...'}</span>
              </span>
              <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.15)' }} />
              <span style={{ color: 'rgba(147,197,253,0.90)', fontSize: '12px', fontFamily: "'Orbitron', monospace" }}>
                {new Date().toLocaleDateString('es-MX')}
              </span>
            </div>

            {/* BOTÓN GUARDAR - 3D Premium igual al Panel */}
            <button
              type="button"
              onClick={handleSubmit}
              className="transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 24px',
                borderRadius: '12px',
                background: 'linear-gradient(180deg, rgba(59,130,246,0.35) 0%, rgba(37,99,235,0.30) 100%)',
                border: '1px solid rgba(59,130,246,0.45)',
                boxShadow: '0 4px 14px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.12)',
                color: 'rgba(147,197,253,0.98)',
                fontSize: '14px',
                fontWeight: 600,
                fontFamily: "'Exo 2', sans-serif",
                cursor: 'pointer'
              }}
            >
              <Save style={{ width: '16px', height: '16px' }} />
              GUARDAR LEAD
            </button>
          </div>
        </div>
      </div>
    </ModuleTemplate>
  );
};
