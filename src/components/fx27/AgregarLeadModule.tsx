import { ModuleTemplate } from './ModuleTemplate';
import { useState, useEffect } from 'react';
import { MODULE_IMAGES } from '../../assets/module-images';
import { Building2, Globe, User, Phone, Mail, MapPinned, MapPin, Users, Calendar, TrendingUp, AlertCircle, Save, Check } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface AgregarLeadModuleProps { onBack: () => void; }
interface Lead { id: string; nombreEmpresa: string; paginaWeb: string; nombreContacto: string; telefonoContacto: string; correoElectronico: string; tipoEmpresa: string; ciudad: string; estado: string; prioridad: string; tamanoEmpresa: string; fechaEstimadaCierre: string; tipoServicio: string[]; tipoViaje: string[]; transbordo: boolean; dtd: boolean; principalesRutas: string; viajesPorMes: string; tarifa: string; proyectadoVentaMensual: string; proximosPasos: string; etapaLead: string; altaCliente: boolean; generacionSOP: boolean; juntaArranque: boolean; facturado: boolean; vendedor: string; fechaCaptura: string; }

const TIPOS_SERVICIO = ['Seco', 'Refrigerado', 'Seco Hazmat', 'Refri Hazmat'];
const TIPOS_VIAJE = ['Impo', 'Expo', 'Nacional', 'Dedicado'];
const TIPOS_EMPRESA = ['Agroalimentario', 'Proteína/Cárnicos', 'Lácteos', 'Alimentos procesados', 'Bebidas', 'Farma/Salud', 'Químicos', 'Plásticos', 'Papel/Cartón', 'CPG', 'Retail/e-commerce', 'Electrónica', 'Automotriz OEM', 'Automotriz Aftermarket', 'Metales', 'Maquinaria', 'Construcción', 'Textil/Moda', 'Muebles/Línea Blanca', 'Aeroespacial', '3PL', 'Línea Americana', 'Agencia Aduanal'];
const PRIORIDADES = ['🔴 Alta', '🟡 Media', '🟢 Baja'];
const TAMANOS = ['1-50', '51-200', '201-1000', '1000+'];

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

  // Checkbox compacto
  const Chk = ({ ck, set, lb, cl = '#3B82F6' }: { ck: boolean; set: (v: boolean) => void; lb: string; cl?: string }) => (
    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
      <div onClick={e => { e.preventDefault(); set(!ck); }} style={{ width: '14px', height: '14px', borderRadius: '3px', background: ck ? cl : 'rgba(255,255,255,0.08)', border: `1.5px solid ${ck ? cl : 'rgba(255,255,255,0.30)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: ck ? `0 2px 8px ${cl}60` : 'inset 0 1px 2px rgba(0,0,0,0.3)' }}>
        {ck && <Check style={{ width: '10px', height: '10px', color: 'white', strokeWidth: 3 }} />}
      </div>
      <span style={{ color: ck ? '#F1F5F9' : '#94A3B8', fontSize: '11px', fontWeight: ck ? 600 : 500 }}>{lb}</span>
    </label>
  );

  // Estilos con PROFUNDIDAD REAL
  const card: React.CSSProperties = { 
    background: 'linear-gradient(180deg, rgba(15,25,45,0.80) 0%, rgba(10,20,40,0.70) 100%)', 
    border: '1px solid rgba(255,255,255,0.10)', 
    borderRadius: '12px', 
    padding: '10px 12px', 
    boxShadow: '0 8px 24px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.08)' 
  };
  const inp: React.CSSProperties = { 
    background: 'rgba(0,0,0,0.25)', 
    border: '1px solid rgba(255,255,255,0.15)', 
    borderRadius: '8px', 
    padding: '0 10px', 
    color: '#F1F5F9', 
    fontSize: '13px', 
    width: '100%', 
    outline: 'none', 
    height: '34px',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.30)'
  };
  const lbl: React.CSSProperties = { color: '#CBD5E1', fontSize: '11px', fontWeight: 600, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' };
  const chip = (on: boolean, c: string): React.CSSProperties => ({ 
    background: on ? `linear-gradient(180deg, ${c} 0%, ${c}cc 100%)` : 'rgba(0,0,0,0.30)', 
    border: `1px solid ${on ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.15)'}`, 
    borderRadius: '999px', 
    padding: '0 12px', 
    height: '30px', 
    color: on ? 'white' : '#CBD5E1', 
    fontSize: '11px', 
    fontWeight: on ? 700 : 500, 
    boxShadow: on ? '0 4px 12px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.20)' : 'inset 0 1px 2px rgba(0,0,0,0.25)', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  });

  return (
    <ModuleTemplate title="Agregar Lead" onBack={onBack} headerImage={MODULE_IMAGES.AGREGAR_LEAD}>
      {/* WRAPPER - Altura fija sin overflow */}
      <div style={{ 
        height: 'calc(100vh - 140px)', 
        padding: '16px', 
        boxSizing: 'border-box',
        overflow: 'hidden',
        background: `
          radial-gradient(ellipse 130% 70% at 50% 10%, rgba(37,99,235,0.50) 0%, rgba(30,64,175,0.40) 35%, transparent 70%),
          linear-gradient(180deg, #0f172a 0%, #020617 100%)
        `
      }}>
        {/* CONTENEDOR PRINCIPAL - Flex column */}
        <div style={{ 
          height: '100%',
          borderRadius: '16px', 
          background: 'linear-gradient(180deg, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.98) 100%)', 
          border: '1px solid rgba(255,255,255,0.10)', 
          boxShadow: '0 20px 60px rgba(0,0,0,0.50), inset 0 1px 0 rgba(255,255,255,0.08)', 
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          
          {/* CONTENIDO - 3 columnas */}
          <div style={{ flex: 1, padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', minHeight: 0 }}>
            
            {/* COL 1: EMPRESA + CONTACTO */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* N1 Empresa */}
              <div style={card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 8px #22C55E' }} />
                  <span style={{ color: '#4ADE80', fontSize: '12px', fontWeight: 700, letterSpacing: '0.5px' }}>N1 • EMPRESA</span>
                </div>
                <input type="text" value={formData.nombreEmpresa} onChange={e => handleInput('nombreEmpresa', e.target.value)} placeholder="EMPRESA S.A. DE C.V." style={{ ...inp, fontSize: '14px', fontWeight: 700, height: '38px' }} />
              </div>

              {/* Web + Contacto */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={card}>
                  <div style={lbl}><Globe style={{ width: '12px', height: '12px' }} />Web</div>
                  <input type="text" value={formData.paginaWeb} onChange={e => handleInput('paginaWeb', e.target.value)} placeholder="www.empresa.com" style={inp} />
                </div>
                <div style={card}>
                  <div style={lbl}><User style={{ width: '12px', height: '12px' }} />Contacto</div>
                  <input type="text" value={formData.nombreContacto} onChange={e => handleInput('nombreContacto', e.target.value)} placeholder="Juan Pérez" style={inp} />
                </div>
              </div>

              {/* Tel + Email */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={card}>
                  <div style={lbl}><Phone style={{ width: '12px', height: '12px' }} />Teléfono</div>
                  <input type="tel" value={formData.telefonoContacto} onChange={e => handleInput('telefonoContacto', e.target.value)} placeholder="55 1234 5678" style={inp} />
                </div>
                <div style={card}>
                  <div style={lbl}><Mail style={{ width: '12px', height: '12px' }} />Email</div>
                  <input type="email" value={formData.correoElectronico} onChange={e => handleInput('correoElectronico', e.target.value)} placeholder="mail@empresa.com" style={inp} />
                </div>
              </div>

              {/* Tipo Empresa */}
              <div style={card}>
                <div style={lbl}><Building2 style={{ width: '12px', height: '12px' }} />Tipo de Empresa</div>
                <select value={formData.tipoEmpresa} onChange={e => handleInput('tipoEmpresa', e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                  <option value="">Selecciona...</option>
                  {TIPOS_EMPRESA.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Ciudad + Estado */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={card}>
                  <div style={lbl}><MapPinned style={{ width: '12px', height: '12px' }} />Ciudad</div>
                  <input type="text" value={formData.ciudad} onChange={e => handleInput('ciudad', e.target.value)} placeholder="Monterrey" style={inp} />
                </div>
                <div style={card}>
                  <div style={lbl}><MapPin style={{ width: '12px', height: '12px' }} />Estado</div>
                  <input type="text" value={formData.estado} onChange={e => handleInput('estado', e.target.value)} placeholder="Nuevo León" style={inp} />
                </div>
              </div>

              {/* Prioridad + Tamaño + Fecha */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div style={card}>
                  <div style={lbl}><AlertCircle style={{ width: '12px', height: '12px' }} />Prior.</div>
                  <select value={formData.prioridad} onChange={e => handleInput('prioridad', e.target.value)} style={{ ...inp, fontSize: '12px' }}>
                    {PRIORIDADES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div style={card}>
                  <div style={lbl}><Users style={{ width: '12px', height: '12px' }} />Tamaño</div>
                  <select value={formData.tamanoEmpresa} onChange={e => handleInput('tamanoEmpresa', e.target.value)} style={{ ...inp, fontSize: '12px' }}>
                    <option value="">-</option>
                    {TAMANOS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div style={card}>
                  <div style={lbl}><Calendar style={{ width: '12px', height: '12px' }} />Cierre</div>
                  <input type="date" value={formData.fechaEstimadaCierre} onChange={e => handleInput('fechaEstimadaCierre', e.target.value)} style={{ ...inp, fontSize: '11px' }} />
                </div>
              </div>
            </div>

            {/* COL 2: SERVICIOS + NOTAS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Tipo Servicio */}
              <div style={card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3B82F6', boxShadow: '0 0 8px #3B82F6' }} />
                  <span style={{ color: '#93C5FD', fontSize: '12px', fontWeight: 600 }}>Tipo de Servicio</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {TIPOS_SERVICIO.map(t => <button key={t} type="button" onClick={() => toggleServ(t)} style={chip(formData.tipoServicio?.includes(t) || false, '#3B82F6')}>{t}</button>)}
                </div>
              </div>

              {/* Tipo Viaje */}
              <div style={card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 8px #22C55E' }} />
                  <span style={{ color: '#86EFAC', fontSize: '12px', fontWeight: 600 }}>Tipo de Viaje</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {TIPOS_VIAJE.map(t => <button key={t} type="button" onClick={() => toggleViaje(t)} style={chip(formData.tipoViaje?.includes(t) || false, '#22C55E')}>{t}</button>)}
                </div>
                <div style={{ display: 'flex', gap: '16px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.10)' }}>
                  <Chk ck={formData.transbordo || false} set={v => setFormData({ ...formData, transbordo: v })} lb="Transbordo" cl="#22C55E" />
                  <Chk ck={formData.dtd || false} set={v => setFormData({ ...formData, dtd: v })} lb="DTD" cl="#22C55E" />
                </div>
              </div>

              {/* Próximos Pasos - ALTURA CONTROLADA */}
              <div style={{ ...card, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B', boxShadow: '0 0 8px #F59E0B' }} />
                  <span style={{ color: '#FCD34D', fontSize: '12px', fontWeight: 600 }}>Próximos Pasos</span>
                </div>
                <textarea 
                  value={formData.proximosPasos} 
                  onChange={e => handleInput('proximosPasos', e.target.value)} 
                  placeholder="Describe los próximos pasos a seguir con este lead..."
                  style={{ 
                    flex: 1,
                    background: 'rgba(0,0,0,0.25)', 
                    border: '1px solid rgba(255,255,255,0.12)', 
                    borderRadius: '8px', 
                    padding: '10px', 
                    color: '#F1F5F9', 
                    fontSize: '13px', 
                    lineHeight: '1.5',
                    outline: 'none', 
                    resize: 'none',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.25)'
                  }} 
                />
              </div>
            </div>

            {/* COL 3: FINANZAS + HITOS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* N3 Finanzas */}
              <div style={card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F97316', boxShadow: '0 0 8px #F97316' }} />
                  <span style={{ color: '#FB923C', fontSize: '12px', fontWeight: 700, letterSpacing: '0.5px' }}>N3 • FINANZAS</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input type="text" value={formData.principalesRutas} onChange={e => handleInput('principalesRutas', e.target.value)} placeholder="CDMX - MTY - GDL" style={inp} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <input type="number" value={formData.viajesPorMes} onChange={e => handleInput('viajesPorMes', e.target.value)} placeholder="Viajes/Mes" style={inp} />
                    <input type="text" value={formData.tarifa} onChange={e => handleInput('tarifa', e.target.value)} placeholder="Tarifa" style={inp} />
                  </div>
                  <input type="text" value={formData.proyectadoVentaMensual} onChange={e => handleInput('proyectadoVentaMensual', e.target.value)} placeholder="Proyectado USD: $50k-$100k" style={inp} />
                </div>
              </div>

              {/* Hitos */}
              <div style={card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <TrendingUp style={{ width: '14px', height: '14px', color: '#F1F5F9' }} />
                  <span style={{ color: '#F1F5F9', fontSize: '12px', fontWeight: 700 }}>HITOS DEL CLIENTE</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {[
                    { k: 'altaCliente', l: 'N4 • Alta Cliente', c: '#22D3EE' }, 
                    { k: 'generacionSOP', l: 'N5 • Gen. SOP', c: '#A855F7' }, 
                    { k: 'juntaArranque', l: 'N6 • Junta Arranque', c: '#EC4899' }, 
                    { k: 'facturado', l: 'N7 • Facturado', c: '#F59E0B' }
                  ].map(({ k, l, c }) => (
                    <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: c, boxShadow: `0 0 6px ${c}` }} />
                      <Chk ck={formData[k as keyof Lead] as boolean || false} set={v => setFormData({ ...formData, [k]: v })} lb={l} cl={c} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Leyenda compacta */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '8px 12px', textAlign: 'center' }}>
                <div style={{ color: '#64748B', fontSize: '10px', display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span><span style={{ color: '#22C55E' }}>●</span> N1</span>
                  <span><span style={{ color: '#3B82F6' }}>●</span> N2</span>
                  <span><span style={{ color: '#F97316' }}>●</span> N3</span>
                  <span><span style={{ color: '#22D3EE' }}>●</span> N4</span>
                  <span><span style={{ color: '#A855F7' }}>●</span> N5</span>
                  <span><span style={{ color: '#EC4899' }}>●</span> N6</span>
                  <span><span style={{ color: '#F59E0B' }}>●</span> N7</span>
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER - Siempre visible, en flujo */}
          <div style={{ 
            flexShrink: 0,
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            padding: '12px 16px',
            background: 'linear-gradient(180deg, rgba(15,23,42,0.90) 0%, rgba(15,23,42,1) 100%)', 
            borderTop: '1px solid rgba(255,255,255,0.10)'
          }}>
            {/* Vendedor */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              background: 'rgba(59,130,246,0.15)', 
              border: '1px solid rgba(59,130,246,0.30)', 
              borderRadius: '10px', 
              padding: '8px 16px',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)'
            }}>
              <span style={{ color: '#94A3B8', fontSize: '13px' }}>
                Vendedor: <span style={{ color: '#F1F5F9', fontWeight: 600 }}>{formData.vendedor || '...'}</span>
              </span>
              <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.20)' }} />
              <span style={{ color: '#93C5FD', fontSize: '12px', fontFamily: 'monospace' }}>
                {new Date().toLocaleDateString('es-MX')}
              </span>
            </div>

            {/* BOTÓN GUARDAR - Grande y visible */}
            <button 
              type="button" 
              onClick={handleSubmit}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                background: 'linear-gradient(180deg, #2F6BFF 0%, #1D4ED8 100%)', 
                border: '1px solid rgba(255,255,255,0.20)', 
                borderRadius: '12px', 
                padding: '12px 28px', 
                boxShadow: '0 10px 30px rgba(0,0,0,0.40), 0 4px 12px rgba(47,107,255,0.30), inset 0 1px 0 rgba(255,255,255,0.20)', 
                fontSize: '14px', 
                fontWeight: 700, 
                color: 'white', 
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 14px 35px rgba(0,0,0,0.45), 0 6px 16px rgba(47,107,255,0.40), inset 0 1px 0 rgba(255,255,255,0.25)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.40), 0 4px 12px rgba(47,107,255,0.30), inset 0 1px 0 rgba(255,255,255,0.20)'; }}
            >
              <Save style={{ width: '18px', height: '18px' }} />
              GUARDAR LEAD
            </button>
          </div>
        </div>
      </div>
    </ModuleTemplate>
  );
};
