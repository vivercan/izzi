import { ModuleTemplate } from './ModuleTemplate';
import { useState, useEffect } from 'react';
import { MODULE_IMAGES } from '../../assets/module-images';
import { Building2, Globe, User, Phone, Mail, MapPinned, MapPin, Users, Calendar, TrendingUp, AlertCircle, Save, Check } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface AgregarLeadModuleProps {
  onBack: () => void;
}

interface Lead {
  id: string;
  nombreEmpresa: string;
  paginaWeb: string;
  nombreContacto: string;
  telefonoContacto: string;
  correoElectronico: string;
  tipoEmpresa: string;
  ciudad: string;
  estado: string;
  prioridad: string;
  tamanoEmpresa: string;
  fechaEstimadaCierre: string;
  tipoServicio: string[];
  tipoViaje: string[];
  transbordo: boolean;
  dtd: boolean;
  principalesRutas: string;
  viajesPorMes: string;
  tarifa: string;
  proyectadoVentaMensual: string;
  proximosPasos: string;
  etapaLead: string;
  altaCliente: boolean;
  generacionSOP: boolean;
  juntaArranque: boolean;
  facturado: boolean;
  vendedor: string;
  fechaCaptura: string;
}

const TIPOS_SERVICIO = ['Seco', 'Refrigerado', 'Seco Hazmat', 'Refri Hazmat'];
const TIPOS_VIAJE = ['Impo', 'Expo', 'Nacional', 'Dedicado'];

const TIPOS_EMPRESA = [
  'Agroalimentario fresco', 'Proteína animal y cárnicos', 'Lácteos y derivados',
  'Alimentos procesados', 'Bebidas', 'Farma y salud', 'Químicos',
  'Plásticos y empaques', 'Papel y cartón', 'CPG', 'Retail y e-commerce',
  'Electrónica', 'Automotriz OEM', 'Automotriz aftermarket', 'Metales',
  'Maquinaria', 'Materiales construcción', 'Textil y moda', 'Muebles y línea blanca',
  'Aeroespacial', '3PL', 'Línea Americana', 'Agencia Aduanal'
];

const PRIORIDADES = ['🔴 Alta', '🟡 Media', '🟢 Baja'];
const TAMANOS_EMPRESA = ['1-50', '51-200', '201-1000', '1000+'];

export const AgregarLeadModule = ({ onBack }: AgregarLeadModuleProps) => {
  const [formData, setFormData] = useState<Partial<Lead>>({
    nombreEmpresa: '', paginaWeb: '', nombreContacto: '', telefonoContacto: '', correoElectronico: '',
    tipoEmpresa: '', ciudad: '', estado: '', prioridad: '🟡 Media', tamanoEmpresa: '', fechaEstimadaCierre: '',
    tipoServicio: [], tipoViaje: [], transbordo: false, dtd: false, principalesRutas: '', viajesPorMes: '',
    tarifa: '', proyectadoVentaMensual: '', proximosPasos: '', etapaLead: 'Prospecto', vendedor: '',
    altaCliente: false, generacionSOP: false, juntaArranque: false, facturado: false,
  });

  useEffect(() => {
    const session = localStorage.getItem('fx27-session');
    if (session) {
      try {
        const { email } = JSON.parse(session);
        const usuarios = JSON.parse(localStorage.getItem('fx27-usuarios') || '[]');
        const usuario = usuarios.find((u: any) => u.correo === email);
        if (usuario) setFormData(prev => ({ ...prev, vendedor: usuario.nombre }));
      } catch (e) { console.error('Error al obtener vendedor'); }
    }
  }, []);

  const handleInputChange = (field: keyof Lead, value: string) => {
    if (field === 'nombreEmpresa') setFormData({ ...formData, [field]: value.toUpperCase() });
    else if (field === 'nombreContacto') {
      const fmt = (t: string) => t.toLowerCase().split(' ').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
      setFormData({ ...formData, [field]: fmt(value) });
    } else if (field === 'correoElectronico') setFormData({ ...formData, [field]: value.toLowerCase() });
    else setFormData({ ...formData, [field]: value });
  };

  const toggleServicio = (t: string) => {
    const s = formData.tipoServicio || [];
    setFormData({ ...formData, tipoServicio: s.includes(t) ? s.filter(x => x !== t) : [...s, t] });
  };

  const toggleViaje = (t: string) => {
    const v = formData.tipoViaje || [];
    setFormData({ ...formData, tipoViaje: v.includes(t) ? v.filter(x => x !== t) : [...v, t] });
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.nombreEmpresa) { alert('❌ Debes ingresar el Nombre de la Empresa'); return; }

    try {
      const checkResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/leads`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      const checkResult = await checkResponse.json();
      if (checkResponse.ok && checkResult.success) {
        const existe = checkResult.leads.find((l: Lead) => l.nombreEmpresa.toLowerCase().trim() === formData.nombreEmpresa!.toLowerCase().trim());
        if (existe) {
          alert(`❌ DUPLICADA\n"${formData.nombreEmpresa}" ya existe.\nRegistrada por: ${existe.vendedor}`);
          return;
        }
      }
    } catch (e) { console.error('[AgregarLead] Error verificando:', e); }

    const nuevoLead: Lead = {
      id: Date.now().toString(), nombreEmpresa: formData.nombreEmpresa!, paginaWeb: formData.paginaWeb || '',
      nombreContacto: formData.nombreContacto || '', telefonoContacto: formData.telefonoContacto || '',
      correoElectronico: formData.correoElectronico || '', tipoEmpresa: formData.tipoEmpresa || '',
      ciudad: formData.ciudad || '', estado: formData.estado || '', prioridad: formData.prioridad || '🟡 Media',
      tamanoEmpresa: formData.tamanoEmpresa || '', fechaEstimadaCierre: formData.fechaEstimadaCierre || '',
      tipoServicio: formData.tipoServicio || [], tipoViaje: formData.tipoViaje || [],
      transbordo: formData.transbordo || false, dtd: formData.dtd || false,
      principalesRutas: formData.principalesRutas || '', viajesPorMes: formData.viajesPorMes || '',
      tarifa: formData.tarifa || '', proyectadoVentaMensual: formData.proyectadoVentaMensual || '',
      proximosPasos: formData.proximosPasos || '', etapaLead: 'Prospecto', vendedor: formData.vendedor!,
      fechaCaptura: new Date().toISOString(), altaCliente: formData.altaCliente || false,
      generacionSOP: formData.generacionSOP || false, juntaArranque: formData.juntaArranque || false,
      facturado: formData.facturado || false,
    };

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/leads`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${publicAnonKey}` },
        body: JSON.stringify(nuevoLead)
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Error');
      alert('✅ Lead guardado');
      setFormData({
        nombreEmpresa: '', paginaWeb: '', nombreContacto: '', telefonoContacto: '', correoElectronico: '',
        tipoEmpresa: '', ciudad: '', estado: '', prioridad: '🟡 Media', tamanoEmpresa: '', fechaEstimadaCierre: '',
        tipoServicio: [], tipoViaje: [], transbordo: false, dtd: false, principalesRutas: '', viajesPorMes: '',
        tarifa: '', proyectadoVentaMensual: '', proximosPasos: '', etapaLead: 'Prospecto', vendedor: formData.vendedor,
        altaCliente: false, generacionSOP: false, juntaArranque: false, facturado: false,
      });
    } catch (e) { console.error('[AgregarLead] Error:', e); alert(`❌ Error: ${e}`); }
  };

  // Checkbox compacto
  const Chk = ({ checked, onChange, label, color = '#3B82F6' }: { checked: boolean; onChange: (v: boolean) => void; label: string; color?: string }) => (
    <label className="flex items-center gap-1.5 cursor-pointer">
      <div onClick={(e) => { e.preventDefault(); onChange(!checked); }}
        style={{ width: '14px', height: '14px', borderRadius: '3px', background: checked ? color : 'rgba(255,255,255,0.08)',
          border: `1.5px solid ${checked ? color : 'rgba(255,255,255,0.25)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: checked ? `0 2px 8px ${color}50` : 'none' }}>
        {checked && <Check className="w-2 h-2 text-white" strokeWidth={3} />}
      </div>
      <span style={{ color: checked ? '#EAF2FF' : '#94A3B8', fontSize: '11px', fontWeight: checked ? 600 : 500 }}>{label}</span>
    </label>
  );

  // Estilos compactos
  const card = { background: 'linear-gradient(180deg, rgba(10,24,46,0.50) 0%, rgba(10,24,46,0.35) 100%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '10px', boxShadow: '0 6px 20px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.06)' };
  const input = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '6px 10px', color: '#EAF2FF', fontSize: '13px', width: '100%', outline: 'none', height: '36px' };
  const label = { color: '#94A3B8', fontSize: '11px', fontWeight: 600, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' };
  const chip = (active: boolean, color: string) => ({
    background: active ? `linear-gradient(180deg, ${color}ee 0%, ${color}aa 100%)` : 'rgba(255,255,255,0.06)',
    border: `1px solid ${active ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.12)'}`,
    borderRadius: '999px', padding: '6px 12px', height: '32px',
    color: active ? 'white' : '#94A3B8', fontSize: '11px', fontWeight: active ? 700 : 500,
    boxShadow: active ? '0 4px 12px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.15)' : 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  });

  return (
    <ModuleTemplate title="Agregar Lead" onBack={onBack} headerImage={MODULE_IMAGES.AGREGAR_LEAD}>
      {/* FONDO AAA - Idéntico al Panel */}
      <div className="relative" style={{ height: 'calc(100vh - 120px)', background: `radial-gradient(ellipse 120% 80% at 50% 20%, rgba(37,99,235,0.95) 0%, rgba(30,64,175,0.98) 40%, rgba(15,23,42,1) 100%), linear-gradient(180deg, #1e3a8a 0%, #0f172a 100%)` }}>
        {/* Noise + Glow + Vignette */}
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`, opacity: 0.03 }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 45%, rgba(59,130,246,0.10) 0%, transparent 60%)' }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(0,0,0,0.20) 100%)' }} />

        {/* CONTENEDOR PRINCIPAL */}
        <div className="absolute inset-3 rounded-2xl flex flex-col" style={{ background: 'linear-gradient(180deg, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.98) 100%)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 20px 60px rgba(0,0,0,0.50), inset 0 1px 0 rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)' }}>
          
          {/* CONTENIDO - Sin scroll */}
          <div className="flex-1 p-3 pb-16">
            <form onSubmit={handleSubmit} className="h-full">
              <div className="grid grid-cols-3 gap-3 h-full">
                
                {/* COL 1: EMPRESA + CONTACTO */}
                <div className="flex flex-col gap-2">
                  {/* NIVEL 1 */}
                  <div style={card}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 6px #22C55E80' }} />
                      <span style={{ color: '#4ADE80', fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em' }}>NIVEL 1 • EMPRESA</span>
                    </div>
                    <input type="text" value={formData.nombreEmpresa} onChange={(e) => handleInputChange('nombreEmpresa', e.target.value)} placeholder="EMPRESA S.A. DE C.V." required className="focus:ring-2 focus:ring-blue-500/40" style={{ ...input, fontSize: '14px', fontWeight: 700, height: '38px' }} />
                  </div>

                  {/* Web + Contacto */}
                  <div className="grid grid-cols-2 gap-2">
                    <div style={card}>
                      <div style={label as any}><Globe className="w-3 h-3" /> Web</div>
                      <input type="text" value={formData.paginaWeb} onChange={(e) => handleInputChange('paginaWeb', e.target.value)} placeholder="www.empresa.com" style={input} />
                    </div>
                    <div style={card}>
                      <div style={label as any}><User className="w-3 h-3" /> Contacto</div>
                      <input type="text" value={formData.nombreContacto} onChange={(e) => handleInputChange('nombreContacto', e.target.value)} placeholder="Juan Pérez" style={input} />
                    </div>
                  </div>

                  {/* Tel + Email */}
                  <div className="grid grid-cols-2 gap-2">
                    <div style={card}>
                      <div style={label as any}><Phone className="w-3 h-3" /> Teléfono</div>
                      <input type="tel" value={formData.telefonoContacto} onChange={(e) => handleInputChange('telefonoContacto', e.target.value)} placeholder="55 1234 5678" style={input} />
                    </div>
                    <div style={card}>
                      <div style={label as any}><Mail className="w-3 h-3" /> Email</div>
                      <input type="email" value={formData.correoElectronico} onChange={(e) => handleInputChange('correoElectronico', e.target.value)} placeholder="mail@empresa.com" style={input} />
                    </div>
                  </div>

                  {/* Tipo Empresa */}
                  <div style={card}>
                    <div style={label as any}><Building2 className="w-3 h-3" /> Tipo de Empresa</div>
                    <select value={formData.tipoEmpresa} onChange={(e) => handleInputChange('tipoEmpresa', e.target.value)} style={{ ...input, cursor: 'pointer' }}>
                      <option value="">Selecciona...</option>
                      {TIPOS_EMPRESA.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  {/* Ciudad + Estado */}
                  <div className="grid grid-cols-2 gap-2">
                    <div style={card}>
                      <div style={label as any}><MapPinned className="w-3 h-3" /> Ciudad</div>
                      <input type="text" value={formData.ciudad} onChange={(e) => handleInputChange('ciudad', e.target.value)} placeholder="Monterrey" style={input} />
                    </div>
                    <div style={card}>
                      <div style={label as any}><MapPin className="w-3 h-3" /> Estado</div>
                      <input type="text" value={formData.estado} onChange={(e) => handleInputChange('estado', e.target.value)} placeholder="Nuevo León" style={input} />
                    </div>
                  </div>

                  {/* Prioridad + Tamaño + Fecha */}
                  <div className="grid grid-cols-3 gap-2">
                    <div style={card}>
                      <div style={label as any}><AlertCircle className="w-3 h-3" /> Prior.</div>
                      <select value={formData.prioridad} onChange={(e) => handleInputChange('prioridad', e.target.value)} style={{ ...input, fontSize: '12px' }}>
                        {PRIORIDADES.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div style={card}>
                      <div style={label as any}><Users className="w-3 h-3" /> Tamaño</div>
                      <select value={formData.tamanoEmpresa} onChange={(e) => handleInputChange('tamanoEmpresa', e.target.value)} style={{ ...input, fontSize: '12px' }}>
                        <option value="">-</option>
                        {TAMANOS_EMPRESA.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div style={card}>
                      <div style={label as any}><Calendar className="w-3 h-3" /> Cierre</div>
                      <input type="date" value={formData.fechaEstimadaCierre} onChange={(e) => handleInputChange('fechaEstimadaCierre', e.target.value)} style={{ ...input, fontSize: '11px', fontFamily: "'Orbitron', monospace" }} />
                    </div>
                  </div>
                </div>

                {/* COL 2: SERVICIOS + NOTAS */}
                <div className="flex flex-col gap-2">
                  {/* Tipo Servicio */}
                  <div style={card}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3B82F6', boxShadow: '0 0 6px #3B82F680' }} />
                      <span style={{ color: '#93C5FD', fontSize: '11px', fontWeight: 600 }}>Tipo de Servicio</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {TIPOS_SERVICIO.map(t => (
                        <button key={t} type="button" onClick={() => toggleServicio(t)} className="transition-all duration-150 hover:-translate-y-0.5" style={chip(formData.tipoServicio?.includes(t) || false, '#3B82F6')}>{t}</button>
                      ))}
                    </div>
                  </div>

                  {/* Tipo Viaje */}
                  <div style={card}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 6px #22C55E80' }} />
                      <span style={{ color: '#86EFAC', fontSize: '11px', fontWeight: 600 }}>Tipo de Viaje</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {TIPOS_VIAJE.map(t => (
                        <button key={t} type="button" onClick={() => toggleViaje(t)} className="transition-all duration-150 hover:-translate-y-0.5" style={chip(formData.tipoViaje?.includes(t) || false, '#22C55E')}>{t}</button>
                      ))}
                    </div>
                    <div className="flex gap-4 mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                      <Chk checked={formData.transbordo || false} onChange={(v) => setFormData({ ...formData, transbordo: v })} label="Transbordo" color="#22C55E" />
                      <Chk checked={formData.dtd || false} onChange={(v) => setFormData({ ...formData, dtd: v })} label="DTD" color="#22C55E" />
                    </div>
                  </div>

                  {/* Próximos Pasos - ALTURA REDUCIDA */}
                  <div style={{ ...card, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#F59E0B', boxShadow: '0 0 6px #F59E0B80' }} />
                      <span style={{ color: '#FCD34D', fontSize: '11px', fontWeight: 600 }}>Próximos Pasos</span>
                    </div>
                    <textarea value={formData.proximosPasos} onChange={(e) => handleInputChange('proximosPasos', e.target.value)} placeholder="Describe los próximos pasos..."
                      style={{ flex: 1, minHeight: '100px', maxHeight: '140px', background: 'rgba(0,0,0,0.20)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '8px', padding: '8px 10px', color: '#EAF2FF', fontSize: '12px', lineHeight: '1.5', outline: 'none', resize: 'none', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.20)' }} />
                  </div>
                </div>

                {/* COL 3: FINANZAS + HITOS */}
                <div className="flex flex-col gap-2">
                  {/* NIVEL 3 */}
                  <div style={card}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#F97316', boxShadow: '0 0 6px #F9731680' }} />
                      <span style={{ color: '#FB923C', fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em' }}>NIVEL 3 • FINANZAS</span>
                    </div>
                    <div className="space-y-1.5">
                      <input type="text" value={formData.principalesRutas} onChange={(e) => handleInputChange('principalesRutas', e.target.value)} placeholder="CDMX - MTY - GDL" style={input} />
                      <div className="grid grid-cols-2 gap-1.5">
                        <input type="number" value={formData.viajesPorMes} onChange={(e) => handleInputChange('viajesPorMes', e.target.value)} placeholder="Viajes/Mes" style={{ ...input, fontFamily: "'Orbitron', monospace" }} />
                        <input type="text" value={formData.tarifa} onChange={(e) => handleInputChange('tarifa', e.target.value)} placeholder="Tarifa MXN" style={{ ...input, fontFamily: "'Orbitron', monospace" }} />
                      </div>
                      <input type="text" value={formData.proyectadoVentaMensual} onChange={(e) => handleInputChange('proyectadoVentaMensual', e.target.value)} placeholder="Proyectado USD: $50k - $100k" style={{ ...input, fontFamily: "'Orbitron', monospace" }} />
                    </div>
                  </div>

                  {/* HITOS */}
                  <div style={card}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <TrendingUp className="w-3.5 h-3.5" style={{ color: '#EAF2FF' }} />
                      <span style={{ color: '#EAF2FF', fontSize: '11px', fontWeight: 700 }}>HITOS DEL CLIENTE</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                      {[
                        { k: 'altaCliente', l: 'N4 • Alta', c: '#22D3EE' },
                        { k: 'generacionSOP', l: 'N5 • SOP', c: '#A855F7' },
                        { k: 'juntaArranque', l: 'N6 • Junta', c: '#EC4899' },
                        { k: 'facturado', l: 'N7 • Facturado', c: '#F59E0B' },
                      ].map(({ k, l, c }) => (
                        <div key={k} className="flex items-center gap-1">
                          <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: c }} />
                          <Chk checked={formData[k as keyof Lead] as boolean || false} onChange={(v) => setFormData({ ...formData, [k]: v })} label={l} color={c} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Leyenda compacta */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '6px 8px', textAlign: 'center' }}>
                    <span style={{ color: '#64748B', fontSize: '9px' }}>
                      <span style={{ color: '#22C55E' }}>●</span>N1 <span style={{ color: '#3B82F6' }}>●</span>N2 <span style={{ color: '#F97316' }}>●</span>N3 <span style={{ color: '#22D3EE' }}>●</span>N4 <span style={{ color: '#A855F7' }}>●</span>N5 <span style={{ color: '#EC4899' }}>●</span>N6 <span style={{ color: '#F59E0B' }}>●</span>N7
                    </span>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* FOOTER - Absoluto para no empujar contenido */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-2" style={{ background: 'linear-gradient(180deg, rgba(15,23,42,0.85) 0%, rgba(15,23,42,0.98) 100%)', borderTop: '1px solid rgba(255,255,255,0.08)', borderRadius: '0 0 16px 16px' }}>
            {/* Vendedor */}
            <div className="flex items-center gap-2" style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '8px', padding: '6px 12px' }}>
              <span style={{ color: '#94A3B8', fontSize: '12px' }}>Vendedor: <span style={{ color: '#EAF2FF', fontWeight: 600 }}>{formData.vendedor || '...'}</span></span>
              <div style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.15)' }} />
              <span style={{ color: '#93C5FD', fontFamily: "'Orbitron', monospace", fontSize: '11px' }}>{new Date().toLocaleDateString('es-MX')}</span>
            </div>

            {/* GUARDAR */}
            <button type="button" onClick={() => handleSubmit()} className="flex items-center gap-2 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0"
              style={{ background: 'linear-gradient(180deg, #2F6BFF 0%, #1F4FD6 100%)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: '10px', padding: '10px 24px', boxShadow: '0 10px 25px rgba(0,0,0,0.40), 0 4px 12px rgba(47,107,255,0.30), inset 0 1px 0 rgba(255,255,255,0.18)', fontSize: '13px', fontWeight: 700, color: 'white' }}>
              <Save className="w-4 h-4" />
              GUARDAR LEAD
            </button>
          </div>
        </div>
      </div>
    </ModuleTemplate>
  );
};
