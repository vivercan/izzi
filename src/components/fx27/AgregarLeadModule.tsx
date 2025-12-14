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
    <label className="flex items-center gap-1.5 cursor-pointer">
      <div onClick={e => { e.preventDefault(); set(!ck); }} style={{ width: '14px', height: '14px', borderRadius: '3px', background: ck ? cl : 'rgba(255,255,255,0.08)', border: `1.5px solid ${ck ? cl : 'rgba(255,255,255,0.25)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: ck ? `0 2px 6px ${cl}50` : 'none' }}>
        {ck && <Check className="w-2 h-2 text-white" strokeWidth={3} />}
      </div>
      <span style={{ color: ck ? '#EAF2FF' : '#94A3B8', fontSize: '11px', fontWeight: ck ? 600 : 500 }}>{lb}</span>
    </label>
  );

  // Estilos compactos
  const crd = { background: 'linear-gradient(180deg, rgba(10,24,46,0.50) 0%, rgba(10,24,46,0.35) 100%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '8px 10px', boxShadow: '0 4px 14px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)' };
  const inp = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '7px', padding: '5px 9px', color: '#EAF2FF', fontSize: '13px', width: '100%', outline: 'none', height: '32px', boxSizing: 'border-box' as const };
  const lbl = { color: '#94A3B8', fontSize: '11px', fontWeight: 600, marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '4px' };
  const chip = (on: boolean, c: string) => ({ background: on ? `linear-gradient(180deg, ${c}dd 0%, ${c}99 100%)` : 'rgba(255,255,255,0.06)', border: `1px solid ${on ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.12)'}`, borderRadius: '999px', padding: '5px 10px', height: '28px', color: on ? 'white' : '#94A3B8', fontSize: '11px', fontWeight: on ? 700 : 500, boxShadow: on ? '0 3px 10px rgba(0,0,0,0.28)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' });

  return (
    <ModuleTemplate title="Agregar Lead" onBack={onBack} headerImage={MODULE_IMAGES.AGREGAR_LEAD}>
      {/* FONDO AAA - Idéntico al Panel */}
      <div style={{ height: 'calc(100vh - 120px)', maxHeight: 'calc(100vh - 120px)', boxSizing: 'border-box', position: 'relative', background: `radial-gradient(ellipse 120% 80% at 50% 20%, rgba(37,99,235,0.95) 0%, rgba(30,64,175,0.98) 40%, rgba(15,23,42,1) 100%), linear-gradient(180deg, #1e3a8a 0%, #0f172a 100%)` }}>
        {/* Noise + Glow + Vignette */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, opacity: 0.03 }} />
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 70% 50% at 50% 45%, rgba(59,130,246,0.10) 0%, transparent 60%)' }} />
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(0,0,0,0.20) 100%)' }} />

        {/* CONTENEDOR PRINCIPAL - GRID 2 FILAS */}
        <div style={{ position: 'absolute', top: '12px', left: '12px', right: '12px', bottom: '12px', borderRadius: '16px', background: 'linear-gradient(180deg, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.98) 100%)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 16px 50px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)', display: 'grid', gridTemplateRows: '1fr auto', overflow: 'hidden' }}>
          
          {/* FILA 1: CONTENIDO */}
          <div style={{ minHeight: 0, padding: '12px', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', height: '100%' }}>
              
              {/* COL 1 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* N1 Empresa */}
                <div style={crd}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 5px #22C55E80' }} />
                    <span style={{ color: '#4ADE80', fontSize: '11px', fontWeight: 700 }}>N1 • EMPRESA</span>
                  </div>
                  <input type="text" value={formData.nombreEmpresa} onChange={e => handleInput('nombreEmpresa', e.target.value)} placeholder="EMPRESA S.A. DE C.V." required style={{ ...inp, fontSize: '14px', fontWeight: 700, height: '34px' }} />
                </div>
                {/* Web + Contacto */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div style={crd}><div style={lbl as any}><Globe className="w-3 h-3" />Web</div><input type="text" value={formData.paginaWeb} onChange={e => handleInput('paginaWeb', e.target.value)} placeholder="www.empresa.com" style={inp} /></div>
                  <div style={crd}><div style={lbl as any}><User className="w-3 h-3" />Contacto</div><input type="text" value={formData.nombreContacto} onChange={e => handleInput('nombreContacto', e.target.value)} placeholder="Juan Pérez" style={inp} /></div>
                </div>
                {/* Tel + Email */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div style={crd}><div style={lbl as any}><Phone className="w-3 h-3" />Tel</div><input type="tel" value={formData.telefonoContacto} onChange={e => handleInput('telefonoContacto', e.target.value)} placeholder="55 1234 5678" style={inp} /></div>
                  <div style={crd}><div style={lbl as any}><Mail className="w-3 h-3" />Email</div><input type="email" value={formData.correoElectronico} onChange={e => handleInput('correoElectronico', e.target.value)} placeholder="mail@empresa.com" style={inp} /></div>
                </div>
                {/* Tipo Empresa */}
                <div style={crd}><div style={lbl as any}><Building2 className="w-3 h-3" />Tipo Empresa</div><select value={formData.tipoEmpresa} onChange={e => handleInput('tipoEmpresa', e.target.value)} style={{ ...inp, cursor: 'pointer' }}><option value="">Selecciona...</option>{TIPOS_EMPRESA.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                {/* Ciudad + Estado */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div style={crd}><div style={lbl as any}><MapPinned className="w-3 h-3" />Ciudad</div><input type="text" value={formData.ciudad} onChange={e => handleInput('ciudad', e.target.value)} placeholder="Monterrey" style={inp} /></div>
                  <div style={crd}><div style={lbl as any}><MapPin className="w-3 h-3" />Estado</div><input type="text" value={formData.estado} onChange={e => handleInput('estado', e.target.value)} placeholder="Nuevo León" style={inp} /></div>
                </div>
                {/* Prioridad + Tamaño + Fecha */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <div style={crd}><div style={lbl as any}><AlertCircle className="w-3 h-3" />Prior.</div><select value={formData.prioridad} onChange={e => handleInput('prioridad', e.target.value)} style={{ ...inp, fontSize: '11px' }}>{PRIORIDADES.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
                  <div style={crd}><div style={lbl as any}><Users className="w-3 h-3" />Tamaño</div><select value={formData.tamanoEmpresa} onChange={e => handleInput('tamanoEmpresa', e.target.value)} style={{ ...inp, fontSize: '11px' }}><option value="">-</option>{TAMANOS.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                  <div style={crd}><div style={lbl as any}><Calendar className="w-3 h-3" />Cierre</div><input type="date" value={formData.fechaEstimadaCierre} onChange={e => handleInput('fechaEstimadaCierre', e.target.value)} style={{ ...inp, fontSize: '10px', fontFamily: "'Orbitron', monospace" }} /></div>
                </div>
              </div>

              {/* COL 2 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Servicio */}
                <div style={crd}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3B82F6', boxShadow: '0 0 5px #3B82F680' }} />
                    <span style={{ color: '#93C5FD', fontSize: '11px', fontWeight: 600 }}>Tipo Servicio</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    {TIPOS_SERVICIO.map(t => <button key={t} type="button" onClick={() => toggleServ(t)} style={chip(formData.tipoServicio?.includes(t) || false, '#3B82F6')}>{t}</button>)}
                  </div>
                </div>
                {/* Viaje */}
                <div style={crd}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 5px #22C55E80' }} />
                    <span style={{ color: '#86EFAC', fontSize: '11px', fontWeight: 600 }}>Tipo Viaje</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    {TIPOS_VIAJE.map(t => <button key={t} type="button" onClick={() => toggleViaje(t)} style={chip(formData.tipoViaje?.includes(t) || false, '#22C55E')}>{t}</button>)}
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <Chk ck={formData.transbordo || false} set={v => setFormData({ ...formData, transbordo: v })} lb="Transbordo" cl="#22C55E" />
                    <Chk ck={formData.dtd || false} set={v => setFormData({ ...formData, dtd: v })} lb="DTD" cl="#22C55E" />
                  </div>
                </div>
                {/* Próximos Pasos */}
                <div style={{ ...crd, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#F59E0B', boxShadow: '0 0 5px #F59E0B80' }} />
                    <span style={{ color: '#FCD34D', fontSize: '11px', fontWeight: 600 }}>Próximos Pasos</span>
                  </div>
                  <textarea value={formData.proximosPasos} onChange={e => handleInput('proximosPasos', e.target.value)} placeholder="Describe los próximos pasos..." style={{ flex: 1, minHeight: '80px', maxHeight: '120px', background: 'rgba(0,0,0,0.18)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '7px', padding: '7px 9px', color: '#EAF2FF', fontSize: '12px', lineHeight: 1.4, outline: 'none', resize: 'none' }} />
                </div>
              </div>

              {/* COL 3 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* N3 Finanzas */}
                <div style={crd}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#F97316', boxShadow: '0 0 5px #F9731680' }} />
                    <span style={{ color: '#FB923C', fontSize: '11px', fontWeight: 700 }}>N3 • FINANZAS</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <input type="text" value={formData.principalesRutas} onChange={e => handleInput('principalesRutas', e.target.value)} placeholder="CDMX - MTY - GDL" style={inp} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      <input type="number" value={formData.viajesPorMes} onChange={e => handleInput('viajesPorMes', e.target.value)} placeholder="Viajes/Mes" style={{ ...inp, fontFamily: "'Orbitron', monospace", fontSize: '12px' }} />
                      <input type="text" value={formData.tarifa} onChange={e => handleInput('tarifa', e.target.value)} placeholder="Tarifa" style={{ ...inp, fontFamily: "'Orbitron', monospace", fontSize: '12px' }} />
                    </div>
                    <input type="text" value={formData.proyectadoVentaMensual} onChange={e => handleInput('proyectadoVentaMensual', e.target.value)} placeholder="Proyectado USD: $50k-$100k" style={{ ...inp, fontFamily: "'Orbitron', monospace", fontSize: '12px' }} />
                  </div>
                </div>
                {/* Hitos */}
                <div style={crd}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                    <TrendingUp className="w-3.5 h-3.5" style={{ color: '#EAF2FF' }} />
                    <span style={{ color: '#EAF2FF', fontSize: '11px', fontWeight: 700 }}>HITOS</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 10px' }}>
                    {[{ k: 'altaCliente', l: 'N4•Alta', c: '#22D3EE' }, { k: 'generacionSOP', l: 'N5•SOP', c: '#A855F7' }, { k: 'juntaArranque', l: 'N6•Junta', c: '#EC4899' }, { k: 'facturado', l: 'N7•Fact', c: '#F59E0B' }].map(({ k, l, c }) => (
                      <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: c }} />
                        <Chk ck={formData[k as keyof Lead] as boolean || false} set={v => setFormData({ ...formData, [k]: v })} lb={l} cl={c} />
                      </div>
                    ))}
                  </div>
                </div>
                {/* Leyenda */}
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '7px', padding: '5px 7px', textAlign: 'center' }}>
                  <span style={{ color: '#64748B', fontSize: '9px' }}><span style={{ color: '#22C55E' }}>●</span>N1 <span style={{ color: '#3B82F6' }}>●</span>N2 <span style={{ color: '#F97316' }}>●</span>N3 <span style={{ color: '#22D3EE' }}>●</span>N4 <span style={{ color: '#A855F7' }}>●</span>N5 <span style={{ color: '#EC4899' }}>●</span>N6 <span style={{ color: '#F59E0B' }}>●</span>N7</span>
                </div>
              </div>
            </div>
          </div>

          {/* FILA 2: FOOTER - EN FLUJO NORMAL, NUNCA SE CORTA */}
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'linear-gradient(180deg, rgba(15,23,42,0.80) 0%, rgba(15,23,42,0.98) 100%)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            {/* Vendedor */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '8px', padding: '6px 12px' }}>
              <span style={{ color: '#94A3B8', fontSize: '12px' }}>Vendedor: <span style={{ color: '#EAF2FF', fontWeight: 600 }}>{formData.vendedor || '...'}</span></span>
              <div style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.15)' }} />
              <span style={{ color: '#93C5FD', fontFamily: "'Orbitron', monospace", fontSize: '11px' }}>{new Date().toLocaleDateString('es-MX')}</span>
            </div>
            {/* GUARDAR */}
            <button type="button" onClick={handleSubmit} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(180deg, #2F6BFF 0%, #1F4FD6 100%)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: '10px', padding: '9px 22px', boxShadow: '0 8px 20px rgba(0,0,0,0.35), 0 3px 10px rgba(47,107,255,0.25), inset 0 1px 0 rgba(255,255,255,0.18)', fontSize: '13px', fontWeight: 700, color: 'white', cursor: 'pointer', transition: 'transform 0.15s' }} onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')} onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
              <Save className="w-4 h-4" />GUARDAR LEAD
            </button>
          </div>
        </div>
      </div>
    </ModuleTemplate>
  );
};
