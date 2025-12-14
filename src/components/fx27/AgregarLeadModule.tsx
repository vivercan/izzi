import { ModuleTemplate } from './ModuleTemplate';
import { useState, useEffect } from 'react';
import { MODULE_IMAGES } from '../../assets/module-images';
import { Building2, Globe, User, Phone, Mail, MapPin, Users, Calendar, TrendingUp, AlertCircle, Save, Check } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM FX27 - TOKENS DEL PANEL DE OPORTUNIDADES
// ═══════════════════════════════════════════════════════════════════════════════
const FX27 = {
  card: {
    background: 'linear-gradient(135deg, rgba(30,58,138,0.55) 0%, rgba(30,64,175,0.45) 100%)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '14px',
    boxShadow: '0 8px 28px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.07)',
    backdropFilter: 'blur(10px)',
  },
  input: {
    background: 'rgba(15,23,42,0.50)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.18)',
  }
};

interface AgregarLeadModuleProps { onBack: () => void; }
interface Lead { id: string; nombreEmpresa: string; paginaWeb: string; nombreContacto: string; telefonoContacto: string; correoElectronico: string; tipoEmpresa: string; ciudad: string; estado: string; prioridad: string; tamanoEmpresa: string; fechaEstimadaCierre: string; tipoServicio: string[]; tipoViaje: string[]; transbordo: boolean; dtd: boolean; principalesRutas: string; viajesPorMes: string; tarifa: string; proyectadoVentaMensual: string; proximosPasos: string; etapaLead: string; altaCliente: boolean; generacionSOP: boolean; juntaArranque: boolean; facturado: boolean; vendedor: string; fechaCaptura: string; }

const TIPOS_SERVICIO = ['Seco', 'Refrigerado', 'Seco Hazmat', 'Refri Hazmat'];
const TIPOS_VIAJE = ['Impo', 'Expo', 'Nacional', 'Dedicado'];
const TIPOS_EMPRESA = ['Agroalimentario', 'Proteína/Cárnicos', 'Lácteos', 'Alimentos procesados', 'Bebidas', 'Farma/Salud', 'Químicos', 'Plásticos', 'Papel/Cartón', 'CPG', 'Retail/e-commerce', 'Electrónica', 'Automotriz OEM', 'Automotriz Aftermarket', 'Metales', 'Maquinaria', 'Construcción', 'Textil/Moda', 'Muebles/Línea Blanca', 'Aeroespacial', '3PL', 'Línea Americana', 'Agencia Aduanal'];
const PRIORIDADES = ['🔴 Alta', '🟡 Media', '🟢 Baja'];
const TAMANOS = ['1-50', '51-200', '201-1000', '1000+'];

// Colores chips
const getChipStyle = (tipo: string, selected: boolean, isViaje: boolean) => {
  if (!selected) return { bg: 'rgba(15,23,42,0.50)', border: 'rgba(255,255,255,0.08)', color: 'rgba(148,163,184,0.75)' };
  const t = tipo.toLowerCase();
  if (isViaje) {
    if (t === 'nacional') return { bg: 'rgba(34,197,94,0.22)', border: 'rgba(34,197,94,0.45)', color: 'rgba(187,247,208,0.95)' };
    if (t === 'expo') return { bg: 'rgba(59,130,246,0.22)', border: 'rgba(59,130,246,0.45)', color: 'rgba(191,219,254,0.95)' };
    if (t === 'impo') return { bg: 'rgba(245,158,11,0.22)', border: 'rgba(245,158,11,0.45)', color: 'rgba(254,243,199,0.95)' };
    return { bg: 'rgba(139,92,246,0.22)', border: 'rgba(139,92,246,0.45)', color: 'rgba(221,214,254,0.95)' };
  } else {
    if (t.includes('refrigerado') && t.includes('hazmat')) return { bg: 'rgba(236,72,153,0.22)', border: 'rgba(236,72,153,0.45)', color: 'rgba(251,207,232,0.95)' };
    if (t.includes('hazmat')) return { bg: 'rgba(168,85,247,0.22)', border: 'rgba(168,85,247,0.45)', color: 'rgba(233,213,255,0.95)' };
    if (t.includes('refrigerado')) return { bg: 'rgba(6,182,212,0.22)', border: 'rgba(6,182,212,0.45)', color: 'rgba(207,250,254,0.95)' };
    return { bg: 'rgba(100,116,139,0.22)', border: 'rgba(148,163,184,0.40)', color: 'rgba(226,232,240,0.92)' };
  }
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

  // Checkbox Premium
  const Chk = ({ ck, set, lb, cl }: { ck: boolean; set: (v: boolean) => void; lb: string; cl: string }) => (
    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
      <div onClick={e => { e.preventDefault(); set(!ck); }} style={{ width: '15px', height: '15px', borderRadius: '4px', background: ck ? cl : 'rgba(15,23,42,0.50)', border: `1.5px solid ${ck ? cl : 'rgba(255,255,255,0.15)'}`, boxShadow: ck ? `0 2px 6px ${cl}50` : 'inset 0 1px 2px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {ck && <Check style={{ width: '10px', height: '10px', color: 'white', strokeWidth: 3 }} />}
      </div>
      <span style={{ color: ck ? 'rgba(255,255,255,0.95)' : 'rgba(148,163,184,0.85)', fontSize: '12px', fontWeight: ck ? 600 : 500 }}>{lb}</span>
    </label>
  );

  // Estilos compactos
  const card: React.CSSProperties = { ...FX27.card, padding: '10px 12px' };
  const inp: React.CSSProperties = { width: '100%', height: '34px', padding: '0 12px', borderRadius: '10px', background: FX27.input.background, border: FX27.input.border, boxShadow: FX27.input.boxShadow, color: 'rgba(255,255,255,0.95)', fontSize: '13px', outline: 'none' };
  const lbl: React.CSSProperties = { color: 'rgba(148,163,184,0.90)', fontSize: '11px', fontWeight: 600, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' };

  const Chip = ({ t, sel, onClick, viaje }: { t: string; sel: boolean; onClick: () => void; viaje: boolean }) => {
    const s = getChipStyle(t, sel, viaje);
    return <button type="button" onClick={onClick} style={{ height: '32px', padding: '0 14px', borderRadius: '10px', background: s.bg, border: `1px solid ${s.border}`, color: s.color, fontSize: '12px', fontWeight: sel ? 600 : 500, boxShadow: sel ? '0 3px 10px rgba(0,0,0,0.18)' : 'none', cursor: 'pointer', transition: 'all 0.15s' }}>{t}</button>;
  };

  const SectionHead = ({ icon: Icon, label, color }: { icon: any; label: string; color: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', paddingLeft: '8px', borderLeft: `3px solid ${color}` }}>
      <Icon style={{ width: '13px', height: '13px', color }} />
      <span style={{ color: 'rgba(255,255,255,0.92)', fontSize: '12px', fontWeight: 600, letterSpacing: '0.3px' }}>{label}</span>
    </div>
  );

  return (
    <ModuleTemplate title="Agregar Lead" onBack={onBack} headerImage={MODULE_IMAGES.AGREGAR_LEAD}>
      {/* ═══════════════════════════════════════════════════════════════
          WRAPPER PRINCIPAL - APROVECHA TODO EL ESPACIO
          ═══════════════════════════════════════════════════════════════ */}
      <div style={{
        height: 'calc(100vh - 140px)',
        display: 'flex',
        flexDirection: 'column',
        padding: '12px',
        boxSizing: 'border-box',
        background: `
          radial-gradient(ellipse 120% 80% at 50% 20%, rgba(37,99,235,0.95) 0%, rgba(30,64,175,0.98) 40%, rgba(15,23,42,1) 100%),
          linear-gradient(180deg, #1e3a8a 0%, #0f172a 100%)
        `
      }}>
        {/* Noise overlay */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, opacity: 0.03, mixBlendMode: 'overlay', zIndex: 0 }} />

        {/* ═══════════════════════════════════════════════════════════════
            CONTENEDOR PRINCIPAL - FLEX COLUMN (content + footer)
            ═══════════════════════════════════════════════════════════════ */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px',
          background: 'linear-gradient(180deg, rgba(15,23,42,0.94) 0%, rgba(15,23,42,0.97) 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 16px 50px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)',
          backdropFilter: 'blur(14px)'
        }}>
          
          {/* ═══════════════════════════════════════════════════════════════
              CONTENIDO - 3 COLUMNAS COMPACTAS
              ═══════════════════════════════════════════════════════════════ */}
          <div style={{ flex: 1, padding: '14px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', minHeight: 0 }}>
            
            {/* COL 1: EMPRESA + CONTACTO */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* N1 EMPRESA */}
              <div style={card}>
                <SectionHead icon={Building2} label="N1 • EMPRESA" color="#22C55E" />
                <input type="text" value={formData.nombreEmpresa} onChange={e => handleInput('nombreEmpresa', e.target.value)} placeholder="EMPRESA S.A. DE C.V." style={{ ...inp, fontSize: '14px', fontWeight: 700, height: '38px' }} />
              </div>

              {/* Web + Contacto */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={card}><div style={lbl}><Globe style={{ width: '11px', height: '11px' }} />Web</div><input type="text" value={formData.paginaWeb} onChange={e => handleInput('paginaWeb', e.target.value)} placeholder="www.empresa.com" style={inp} /></div>
                <div style={card}><div style={lbl}><User style={{ width: '11px', height: '11px' }} />Contacto</div><input type="text" value={formData.nombreContacto} onChange={e => handleInput('nombreContacto', e.target.value)} placeholder="Juan Pérez" style={inp} /></div>
              </div>

              {/* Tel + Email */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={card}><div style={lbl}><Phone style={{ width: '11px', height: '11px' }} />Teléfono</div><input type="tel" value={formData.telefonoContacto} onChange={e => handleInput('telefonoContacto', e.target.value)} placeholder="55 1234 5678" style={inp} /></div>
                <div style={card}><div style={lbl}><Mail style={{ width: '11px', height: '11px' }} />Email</div><input type="email" value={formData.correoElectronico} onChange={e => handleInput('correoElectronico', e.target.value)} placeholder="mail@empresa.com" style={inp} /></div>
              </div>

              {/* Tipo Empresa */}
              <div style={card}><div style={lbl}><Building2 style={{ width: '11px', height: '11px' }} />Tipo de Empresa</div><select value={formData.tipoEmpresa} onChange={e => handleInput('tipoEmpresa', e.target.value)} style={{ ...inp, cursor: 'pointer' }}><option value="">Selecciona...</option>{TIPOS_EMPRESA.map(t => <option key={t} value={t}>{t}</option>)}</select></div>

              {/* Ciudad + Estado */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={card}><div style={lbl}>Ciudad</div><input type="text" value={formData.ciudad} onChange={e => handleInput('ciudad', e.target.value)} placeholder="Monterrey" style={{ ...inp, height: '30px', fontSize: '12px' }} /></div>
                <div style={card}><div style={lbl}>Estado</div><input type="text" value={formData.estado} onChange={e => handleInput('estado', e.target.value)} placeholder="Nuevo León" style={{ ...inp, height: '30px', fontSize: '12px' }} /></div>
              </div>

              {/* Prioridad + Tamaño + Cierre */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <div style={card}><div style={lbl}><AlertCircle style={{ width: '10px', height: '10px' }} />Prior.</div><select value={formData.prioridad} onChange={e => handleInput('prioridad', e.target.value)} style={{ ...inp, height: '28px', fontSize: '11px', cursor: 'pointer' }}>{PRIORIDADES.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
                <div style={card}><div style={lbl}><Users style={{ width: '10px', height: '10px' }} />Tamaño</div><select value={formData.tamanoEmpresa} onChange={e => handleInput('tamanoEmpresa', e.target.value)} style={{ ...inp, height: '28px', fontSize: '11px', cursor: 'pointer' }}><option value="">-</option>{TAMANOS.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                <div style={card}><div style={lbl}><Calendar style={{ width: '10px', height: '10px' }} />Cierre</div><input type="date" value={formData.fechaEstimadaCierre} onChange={e => handleInput('fechaEstimadaCierre', e.target.value)} style={{ ...inp, height: '28px', fontSize: '10px' }} /></div>
              </div>
            </div>

            {/* COL 2: SERVICIOS + VIAJE + NOTAS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* TIPO SERVICIO */}
              <div style={card}>
                <SectionHead icon={TrendingUp} label="TIPO DE SERVICIO" color="#3B82F6" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {TIPOS_SERVICIO.map(t => <Chip key={t} t={t} sel={formData.tipoServicio?.includes(t) || false} onClick={() => toggleServ(t)} viaje={false} />)}
                </div>
              </div>

              {/* TIPO VIAJE */}
              <div style={card}>
                <SectionHead icon={MapPin} label="TIPO DE VIAJE" color="#22C55E" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {TIPOS_VIAJE.map(t => <Chip key={t} t={t} sel={formData.tipoViaje?.includes(t) || false} onClick={() => toggleViaje(t)} viaje={true} />)}
                </div>
                <div style={{ display: 'flex', gap: '16px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <Chk ck={formData.transbordo || false} set={v => setFormData({ ...formData, transbordo: v })} lb="Transbordo" cl="#22C55E" />
                  <Chk ck={formData.dtd || false} set={v => setFormData({ ...formData, dtd: v })} lb="DTD" cl="#22C55E" />
                </div>
              </div>

              {/* PRÓXIMOS PASOS */}
              <div style={{ ...card, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <SectionHead icon={AlertCircle} label="PRÓXIMOS PASOS" color="#F59E0B" />
                <textarea value={formData.proximosPasos} onChange={e => handleInput('proximosPasos', e.target.value)} placeholder="Describe los próximos pasos..." style={{ flex: 1, minHeight: '60px', padding: '8px 10px', borderRadius: '10px', background: FX27.input.background, border: FX27.input.border, boxShadow: FX27.input.boxShadow, color: 'rgba(255,255,255,0.95)', fontSize: '12px', lineHeight: 1.4, outline: 'none', resize: 'none' }} />
              </div>
            </div>

            {/* COL 3: FINANZAS + HITOS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* N3 FINANZAS */}
              <div style={card}>
                <SectionHead icon={TrendingUp} label="N3 • FINANZAS" color="#F97316" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input type="text" value={formData.principalesRutas} onChange={e => handleInput('principalesRutas', e.target.value)} placeholder="CDMX - MTY - GDL" style={inp} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <input type="number" value={formData.viajesPorMes} onChange={e => handleInput('viajesPorMes', e.target.value)} placeholder="Viajes/Mes" style={inp} />
                    <input type="text" value={formData.tarifa} onChange={e => handleInput('tarifa', e.target.value)} placeholder="Tarifa" style={inp} />
                  </div>
                  <input type="text" value={formData.proyectadoVentaMensual} onChange={e => handleInput('proyectadoVentaMensual', e.target.value)} placeholder="Proyectado USD: $50k-$100k" style={inp} />
                </div>
              </div>

              {/* HITOS */}
              <div style={card}>
                <SectionHead icon={TrendingUp} label="HITOS DEL CLIENTE" color="#06B6D4" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Chk ck={formData.altaCliente || false} set={v => setFormData({ ...formData, altaCliente: v })} lb="N4 • Alta de Cliente" cl="#06B6D4" />
                  <Chk ck={formData.generacionSOP || false} set={v => setFormData({ ...formData, generacionSOP: v })} lb="N5 • Generación SOP" cl="#A855F7" />
                  <Chk ck={formData.juntaArranque || false} set={v => setFormData({ ...formData, juntaArranque: v })} lb="N6 • Junta de Arranque" cl="#EC4899" />
                  <Chk ck={formData.facturado || false} set={v => setFormData({ ...formData, facturado: v })} lb="N7 • Facturado" cl="#F59E0B" />
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              FOOTER - COMPACTO
              ═══════════════════════════════════════════════════════════════ */}
          <div style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            background: 'linear-gradient(180deg, rgba(30,58,138,0.35) 0%, rgba(30,64,175,0.30) 100%)',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '0 0 16px 16px'
          }}>
            {/* Vendedor + Fecha */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 14px', borderRadius: '10px', background: 'rgba(15,23,42,0.50)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ color: 'rgba(148,163,184,0.90)', fontSize: '13px' }}>Vendedor: <span style={{ color: 'rgba(255,255,255,0.95)', fontWeight: 600 }}>{formData.vendedor || '...'}</span></span>
              <div style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.15)' }} />
              <span style={{ color: 'rgba(147,197,253,0.90)', fontSize: '12px', fontFamily: 'monospace' }}>{new Date().toLocaleDateString('es-MX')}</span>
            </div>

            {/* BOTÓN GUARDAR - Premium 3D */}
            <button type="button" onClick={handleSubmit} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 22px', borderRadius: '12px', background: 'linear-gradient(180deg, rgba(59,130,246,0.35) 0%, rgba(37,99,235,0.30) 100%)', border: '1px solid rgba(59,130,246,0.45)', boxShadow: '0 4px 14px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.12)', color: 'rgba(147,197,253,0.98)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.12)'; }}>
              <Save style={{ width: '15px', height: '15px' }} />
              GUARDAR LEAD
            </button>
          </div>
        </div>
      </div>
    </ModuleTemplate>
  );
};
