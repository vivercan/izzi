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

const TIPOS_SERVICIO = ['Seco', 'Refrigerado', 'Seco Hazmat', 'Refrigerado Hazmat'];
const TIPOS_VIAJE = ['Impo', 'Expo', 'Nacional', 'Dedicado'];

const TIPOS_EMPRESA = [
  'Agroalimentario fresco (frutas y vegetales)',
  'Proteína animal y cárnicos',
  'Lácteos y derivados',
  'Alimentos procesados y abarrotes secos',
  'Bebidas (no alcohólicas y cerveza)',
  'Farma, químico-farmacéutico y salud',
  'Químicos y especialidades empacadas',
  'Plásticos, empaques y resinas sólidas',
  'Papel, cartón y empaques de papel',
  'Cuidado del hogar y cuidado personal (CPG)',
  'Retail, autoservicio y e-commerce (carga mixta)',
  'Electrónica, cómputo y alta tecnología',
  'Automotriz OEM y Tier 1',
  'Automotriz aftermarket y refacciones',
  'Metales y productos metal-mecánicos',
  'Maquinaria ligera y equipo industrial empacado',
  'Materiales de construcción ligeros y acabados',
  'Textil, moda y calzado',
  'Muebles, línea blanca y decoración',
  'Aeroespacial, defensa y alta precisión',
  '3PL',
  'Línea Americana',
  'Agencia Aduanal'
];

const PRIORIDADES = ['🔴 Alta', '🟡 Media', '🟢 Baja'];
const TAMANOS_EMPRESA = ['1-50 empleados', '51-200 empleados', '201-1000 empleados', '1000+ empleados'];

export const AgregarLeadModule = ({ onBack }: AgregarLeadModuleProps) => {
  const [formData, setFormData] = useState<Partial<Lead>>({
    nombreEmpresa: '',
    paginaWeb: '',
    nombreContacto: '',
    telefonoContacto: '',
    correoElectronico: '',
    tipoEmpresa: '',
    ciudad: '',
    estado: '',
    prioridad: '🟡 Media',
    tamanoEmpresa: '',
    fechaEstimadaCierre: '',
    tipoServicio: [],
    tipoViaje: [],
    transbordo: false,
    dtd: false,
    principalesRutas: '',
    viajesPorMes: '',
    tarifa: '',
    proyectadoVentaMensual: '',
    proximosPasos: '',
    etapaLead: 'Prospecto',
    vendedor: '',
    altaCliente: false,
    generacionSOP: false,
    juntaArranque: false,
    facturado: false,
  });

  useEffect(() => {
    const session = localStorage.getItem('fx27-session');
    if (session) {
      try {
        const { email } = JSON.parse(session);
        const usuarios = JSON.parse(localStorage.getItem('fx27-usuarios') || '[]');
        const usuario = usuarios.find((u: any) => u.correo === email);
        if (usuario) {
          setFormData(prev => ({ ...prev, vendedor: usuario.nombre }));
        }
      } catch (e) {
        console.error('Error al obtener vendedor');
      }
    }
  }, []);

  const handleInputChange = (field: keyof Lead, value: string) => {
    if (field === 'nombreEmpresa') {
      setFormData({ ...formData, [field]: value.toUpperCase() });
    } else if (field === 'nombreContacto') {
      const formatearNombre = (texto: string) => {
        return texto.toLowerCase().split(' ').map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1)).join(' ');
      };
      setFormData({ ...formData, [field]: formatearNombre(value) });
    } else if (field === 'correoElectronico') {
      setFormData({ ...formData, [field]: value.toLowerCase() });
    } else {
      setFormData({ ...formData, [field]: value });
    }
  };

  const handleToggleTipoServicio = (tipo: string) => {
    const servicios = formData.tipoServicio || [];
    const nuevosServicios = servicios.includes(tipo) ? servicios.filter(s => s !== tipo) : [...servicios, tipo];
    setFormData({ ...formData, tipoServicio: nuevosServicios });
  };

  const handleToggleTipoViaje = (tipo: string) => {
    const viajes = formData.tipoViaje || [];
    const nuevosViajes = viajes.includes(tipo) ? viajes.filter(v => v !== tipo) : [...viajes, tipo];
    setFormData({ ...formData, tipoViaje: nuevosViajes });
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.nombreEmpresa) {
      alert('❌ Nivel 1 mínimo: Debes ingresar el Nombre de la Empresa');
      return;
    }

    try {
      const checkResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/leads`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      const checkResult = await checkResponse.json();
      
      if (checkResponse.ok && checkResult.success) {
        const empresaExistente = checkResult.leads.find(
          (lead: Lead) => lead.nombreEmpresa.toLowerCase().trim() === formData.nombreEmpresa!.toLowerCase().trim()
        );
        
        if (empresaExistente) {
          alert(`❌ EMPRESA DUPLICADA\n\nLa empresa "${formData.nombreEmpresa}" ya existe en el sistema.\n\n📋 Detalles:\n• Registrada por: ${empresaExistente.vendedor}\n• Fecha: ${new Date(empresaExistente.fechaCaptura).toLocaleDateString('es-MX')}\n• Contacto: ${empresaExistente.nombreContacto || 'Sin contacto'}\n\n💡 Verifica en el Panel de Oportunidades.`);
          return;
        }
      }
    } catch (error) {
      console.error('[AgregarLead] Error al verificar duplicados:', error);
    }

    const nuevoLead: Lead = {
      id: Date.now().toString(),
      nombreEmpresa: formData.nombreEmpresa!,
      paginaWeb: formData.paginaWeb || '',
      nombreContacto: formData.nombreContacto || '',
      telefonoContacto: formData.telefonoContacto || '',
      correoElectronico: formData.correoElectronico || '',
      tipoEmpresa: formData.tipoEmpresa || '',
      ciudad: formData.ciudad || '',
      estado: formData.estado || '',
      prioridad: formData.prioridad || '🟡 Media',
      tamanoEmpresa: formData.tamanoEmpresa || '',
      fechaEstimadaCierre: formData.fechaEstimadaCierre || '',
      tipoServicio: formData.tipoServicio || [],
      tipoViaje: formData.tipoViaje || [],
      transbordo: formData.transbordo || false,
      dtd: formData.dtd || false,
      principalesRutas: formData.principalesRutas || '',
      viajesPorMes: formData.viajesPorMes || '',
      tarifa: formData.tarifa || '',
      proyectadoVentaMensual: formData.proyectadoVentaMensual || '',
      proximosPasos: formData.proximosPasos || '',
      etapaLead: formData.etapaLead || 'Prospecto',
      vendedor: formData.vendedor!,
      fechaCaptura: new Date().toISOString(),
      altaCliente: formData.altaCliente || false,
      generacionSOP: formData.generacionSOP || false,
      juntaArranque: formData.juntaArranque || false,
      facturado: formData.facturado || false,
    };

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${publicAnonKey}` },
        body: JSON.stringify(nuevoLead)
      });
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Error al guardar el lead');
      }

      alert('✅ Lead guardado exitosamente');
      setFormData({
        nombreEmpresa: '', paginaWeb: '', nombreContacto: '', telefonoContacto: '', correoElectronico: '',
        tipoEmpresa: '', ciudad: '', estado: '', prioridad: '🟡 Media', tamanoEmpresa: '', fechaEstimadaCierre: '',
        tipoServicio: [], tipoViaje: [], transbordo: false, dtd: false, principalesRutas: '', viajesPorMes: '',
        tarifa: '', proyectadoVentaMensual: '', proximosPasos: '', etapaLead: 'Prospecto', vendedor: formData.vendedor,
        altaCliente: false, generacionSOP: false, juntaArranque: false, facturado: false,
      });
    } catch (error) {
      console.error('[AgregarLead] Error al guardar lead:', error);
      alert(`❌ Error al guardar el lead: ${error}`);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // COMPONENTE: Checkbox Moderno OS Style
  // ═══════════════════════════════════════════════════════════════
  const ModernCheckbox = ({ checked, onChange, label, color = '#3B82F6' }: { checked: boolean; onChange: (v: boolean) => void; label: string; color?: string }) => (
    <label className="flex items-center gap-2 cursor-pointer group">
      <div 
        onClick={(e) => { e.preventDefault(); onChange(!checked); }}
        className="flex items-center justify-center transition-all duration-150"
        style={{
          width: '16px',
          height: '16px',
          borderRadius: '4px',
          background: checked ? color : 'rgba(255,255,255,0.06)',
          border: `1.5px solid ${checked ? color : 'rgba(255,255,255,0.20)'}`,
          boxShadow: checked ? `0 3px 10px ${color}50` : 'inset 0 1px 2px rgba(0,0,0,0.20)'
        }}
      >
        {checked && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
      </div>
      <span style={{ color: checked ? '#EAF2FF' : '#A9B7D0', fontFamily: "'Exo 2', sans-serif", fontSize: '12px', fontWeight: checked ? 600 : 500 }}>
        {label}
      </span>
    </label>
  );

  // Estilos reutilizables - tipografía legible
  const cardStyle = {
    background: 'linear-gradient(180deg, rgba(10,24,46,0.55) 0%, rgba(10,24,46,0.40) 100%)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '14px',
    padding: '12px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.06)'
  };

  const inputStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: '10px',
    padding: '8px 12px',
    color: '#EAF2FF',
    fontFamily: "'Exo 2', sans-serif",
    fontSize: '13px',
    width: '100%',
    outline: 'none',
    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.18)'
  };

  const labelStyle = {
    color: '#A9B7D0',
    fontFamily: "'Exo 2', sans-serif",
    fontSize: '12px',
    fontWeight: 600,
    marginBottom: '6px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  };

  return (
    <ModuleTemplate title="Agregar Lead" onBack={onBack} headerImage={MODULE_IMAGES.AGREGAR_LEAD}>
      {/* ═══════════════════════════════════════════════════════════════
          FONDO GLOBAL AAA - Idéntico al Panel de Oportunidades
          ═══════════════════════════════════════════════════════════════ */}
      <div 
        className="flex flex-col h-[calc(100vh-120px)] relative overflow-hidden"
        style={{
          background: `
            radial-gradient(ellipse 120% 80% at 50% 20%, rgba(37,99,235,0.95) 0%, rgba(30,64,175,0.98) 40%, rgba(15,23,42,1) 100%),
            linear-gradient(180deg, #1e3a8a 0%, #0f172a 100%)
          `
        }}
      >
        {/* Noise texture */}
        <div className="absolute inset-0 pointer-events-none z-0" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`, opacity: 0.035, mixBlendMode: 'overlay' }} />
        
        {/* Radial glow */}
        <div className="absolute inset-0 pointer-events-none z-0" style={{ background: `radial-gradient(ellipse 70% 50% at 50% 45%, rgba(59,130,246,0.12) 0%, transparent 60%), radial-gradient(ellipse 90% 60% at 50% 50%, rgba(30,58,138,0.20) 0%, transparent 70%)` }} />
        
        {/* Vignette */}
        <div className="absolute inset-0 pointer-events-none z-0" style={{ background: 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(0,0,0,0.25) 100%)' }} />

        {/* ═══════════════════════════════════════════════════════════════
            CONTENEDOR PRINCIPAL - Sin scroll, todo cabe
            ═══════════════════════════════════════════════════════════════ */}
        <div 
          className="flex-1 mx-4 my-4 rounded-2xl relative z-10 flex flex-col overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.98) 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 24px 70px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 0 0 1px rgba(255,255,255,0.04)',
            backdropFilter: 'blur(20px)'
          }}
        >
          {/* CONTENIDO - Sin scroll */}
          <div className="flex-1 p-4 flex flex-col">
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
              <div className="grid grid-cols-3 gap-4 flex-1">
                
                {/* ═══════════════════════════════════════════════════════════════
                    COLUMNA 1: EMPRESA + CONTACTO + UBICACIÓN
                    ═══════════════════════════════════════════════════════════════ */}
                <div className="flex flex-col gap-2.5">
                  
                  {/* NIVEL 1: EMPRESA */}
                  <div style={cardStyle} className="hover:-translate-y-0.5 transition-transform">
                    <div className="flex items-center gap-2 mb-2">
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 8px rgba(34,197,94,0.50)' }} />
                      <span style={{ color: '#4ADE80', fontFamily: "'Exo 2', sans-serif", fontSize: '12px', fontWeight: 700, letterSpacing: '0.06em' }}>
                        NIVEL 1 • EMPRESA
                      </span>
                    </div>
                    <input
                      type="text"
                      value={formData.nombreEmpresa}
                      onChange={(e) => handleInputChange('nombreEmpresa', e.target.value)}
                      placeholder="EMPRESA S.A. DE C.V."
                      required
                      className="focus:ring-2 focus:ring-blue-500/40"
                      style={{ ...inputStyle, fontSize: '14px', fontWeight: 700, padding: '10px 14px' }}
                    />
                  </div>

                  {/* Página Web + Contacto */}
                  <div className="grid grid-cols-2 gap-2">
                    <div style={cardStyle} className="hover:-translate-y-0.5 transition-transform">
                      <div style={labelStyle as any}><Globe className="w-3.5 h-3.5" /> Web</div>
                      <input type="text" value={formData.paginaWeb} onChange={(e) => handleInputChange('paginaWeb', e.target.value)} placeholder="www.empresa.com" className="focus:ring-2 focus:ring-blue-500/35" style={inputStyle} />
                    </div>
                    <div style={cardStyle} className="hover:-translate-y-0.5 transition-transform">
                      <div style={labelStyle as any}><User className="w-3.5 h-3.5" /> Contacto</div>
                      <input type="text" value={formData.nombreContacto} onChange={(e) => handleInputChange('nombreContacto', e.target.value)} placeholder="Juan Pérez" className="focus:ring-2 focus:ring-blue-500/35" style={inputStyle} />
                    </div>
                  </div>

                  {/* Teléfono + Email */}
                  <div className="grid grid-cols-2 gap-2">
                    <div style={cardStyle} className="hover:-translate-y-0.5 transition-transform">
                      <div style={labelStyle as any}><Phone className="w-3.5 h-3.5" /> Teléfono</div>
                      <input type="tel" value={formData.telefonoContacto} onChange={(e) => handleInputChange('telefonoContacto', e.target.value)} placeholder="55 1234 5678" className="focus:ring-2 focus:ring-blue-500/35" style={inputStyle} />
                    </div>
                    <div style={cardStyle} className="hover:-translate-y-0.5 transition-transform">
                      <div style={labelStyle as any}><Mail className="w-3.5 h-3.5" /> Email</div>
                      <input type="email" value={formData.correoElectronico} onChange={(e) => handleInputChange('correoElectronico', e.target.value)} placeholder="contacto@empresa.com" className="focus:ring-2 focus:ring-blue-500/35" style={inputStyle} />
                    </div>
                  </div>

                  {/* Tipo de Empresa */}
                  <div style={cardStyle} className="hover:-translate-y-0.5 transition-transform">
                    <div style={labelStyle as any}><Building2 className="w-3.5 h-3.5" /> Tipo de Empresa</div>
                    <select value={formData.tipoEmpresa} onChange={(e) => handleInputChange('tipoEmpresa', e.target.value)} className="cursor-pointer focus:ring-2 focus:ring-blue-500/35" style={inputStyle}>
                      <option value="">Selecciona...</option>
                      {TIPOS_EMPRESA.map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}
                    </select>
                  </div>

                  {/* Ciudad + Estado */}
                  <div className="grid grid-cols-2 gap-2">
                    <div style={cardStyle} className="hover:-translate-y-0.5 transition-transform">
                      <div style={labelStyle as any}><MapPinned className="w-3.5 h-3.5" /> Ciudad</div>
                      <input type="text" value={formData.ciudad} onChange={(e) => handleInputChange('ciudad', e.target.value)} placeholder="Monterrey" className="focus:ring-2 focus:ring-blue-500/35" style={inputStyle} />
                    </div>
                    <div style={cardStyle} className="hover:-translate-y-0.5 transition-transform">
                      <div style={labelStyle as any}><MapPin className="w-3.5 h-3.5" /> Estado</div>
                      <input type="text" value={formData.estado} onChange={(e) => handleInputChange('estado', e.target.value)} placeholder="Nuevo León" className="focus:ring-2 focus:ring-blue-500/35" style={inputStyle} />
                    </div>
                  </div>

                  {/* Prioridad + Tamaño + Fecha */}
                  <div className="grid grid-cols-3 gap-2">
                    <div style={cardStyle} className="hover:-translate-y-0.5 transition-transform">
                      <div style={labelStyle as any}><AlertCircle className="w-3 h-3" /> Prioridad</div>
                      <select value={formData.prioridad} onChange={(e) => handleInputChange('prioridad', e.target.value)} className="cursor-pointer focus:ring-2 focus:ring-blue-500/35" style={{ ...inputStyle, fontSize: '12px' }}>
                        {PRIORIDADES.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div style={cardStyle} className="hover:-translate-y-0.5 transition-transform">
                      <div style={labelStyle as any}><Users className="w-3 h-3" /> Tamaño</div>
                      <select value={formData.tamanoEmpresa} onChange={(e) => handleInputChange('tamanoEmpresa', e.target.value)} className="cursor-pointer focus:ring-2 focus:ring-blue-500/35" style={{ ...inputStyle, fontSize: '11px' }}>
                        <option value="">-</option>
                        {TAMANOS_EMPRESA.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div style={cardStyle} className="hover:-translate-y-0.5 transition-transform">
                      <div style={labelStyle as any}><Calendar className="w-3 h-3" /> Cierre</div>
                      <input type="date" value={formData.fechaEstimadaCierre} onChange={(e) => handleInputChange('fechaEstimadaCierre', e.target.value)} className="focus:ring-2 focus:ring-blue-500/35" style={{ ...inputStyle, fontFamily: "'Orbitron', monospace", fontSize: '11px' }} />
                    </div>
                  </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════════
                    COLUMNA 2: SERVICIOS + VIAJE + NOTAS
                    ═══════════════════════════════════════════════════════════════ */}
                <div className="flex flex-col gap-2.5">
                  
                  {/* Tipo de Servicio */}
                  <div style={cardStyle} className="hover:-translate-y-0.5 transition-transform">
                    <div className="flex items-center gap-2 mb-2">
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3B82F6', boxShadow: '0 0 8px rgba(59,130,246,0.50)' }} />
                      <span style={{ color: 'rgba(147,197,253,0.95)', fontFamily: "'Exo 2', sans-serif", fontSize: '12px', fontWeight: 600 }}>Tipo de Servicio</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {TIPOS_SERVICIO.map(tipo => {
                        const isActive = formData.tipoServicio?.includes(tipo);
                        return (
                          <button key={tipo} type="button" onClick={() => handleToggleTipoServicio(tipo)} className="transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0"
                            style={{
                              background: isActive ? 'linear-gradient(180deg, rgba(59,130,246,0.90) 0%, rgba(59,130,246,0.65) 100%)' : 'rgba(255,255,255,0.05)',
                              border: `1px solid ${isActive ? 'rgba(147,197,253,0.45)' : 'rgba(255,255,255,0.10)'}`,
                              borderRadius: '999px', padding: '8px 12px',
                              color: isActive ? 'white' : '#A9B7D0',
                              fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: isActive ? 700 : 500,
                              boxShadow: isActive ? '0 6px 16px rgba(59,130,246,0.35), inset 0 1px 0 rgba(255,255,255,0.15)' : 'inset 0 1px 2px rgba(0,0,0,0.15)'
                            }}
                          >{tipo}</button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tipo de Viaje */}
                  <div style={cardStyle} className="hover:-translate-y-0.5 transition-transform">
                    <div className="flex items-center gap-2 mb-2">
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 8px rgba(34,197,94,0.50)' }} />
                      <span style={{ color: 'rgba(134,239,172,0.95)', fontFamily: "'Exo 2', sans-serif", fontSize: '12px', fontWeight: 600 }}>Tipo de Viaje</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {TIPOS_VIAJE.map(tipo => {
                        const isActive = formData.tipoViaje?.includes(tipo);
                        return (
                          <button key={tipo} type="button" onClick={() => handleToggleTipoViaje(tipo)} className="transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0"
                            style={{
                              background: isActive ? 'linear-gradient(180deg, rgba(34,197,94,0.90) 0%, rgba(34,197,94,0.65) 100%)' : 'rgba(255,255,255,0.05)',
                              border: `1px solid ${isActive ? 'rgba(134,239,172,0.45)' : 'rgba(255,255,255,0.10)'}`,
                              borderRadius: '999px', padding: '8px 12px',
                              color: isActive ? 'white' : '#A9B7D0',
                              fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: isActive ? 700 : 500,
                              boxShadow: isActive ? '0 6px 16px rgba(34,197,94,0.35), inset 0 1px 0 rgba(255,255,255,0.15)' : 'inset 0 1px 2px rgba(0,0,0,0.15)'
                            }}
                          >{tipo}</button>
                        );
                      })}
                    </div>
                    {/* Checkboxes */}
                    <div className="flex gap-6 mt-3 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <ModernCheckbox checked={formData.transbordo || false} onChange={(v) => setFormData({ ...formData, transbordo: v })} label="Transbordo" color="#22C55E" />
                      <ModernCheckbox checked={formData.dtd || false} onChange={(v) => setFormData({ ...formData, dtd: v })} label="DTD" color="#22C55E" />
                    </div>
                  </div>

                  {/* Próximos Pasos */}
                  <div style={{ ...cardStyle, flex: 1, display: 'flex', flexDirection: 'column' }} className="hover:-translate-y-0.5 transition-transform">
                    <div className="flex items-center gap-2 mb-2">
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B', boxShadow: '0 0 8px rgba(245,158,11,0.50)' }} />
                      <span style={{ color: 'rgba(252,211,77,0.95)', fontFamily: "'Exo 2', sans-serif", fontSize: '12px', fontWeight: 600 }}>Próximos Pasos</span>
                    </div>
                    <textarea
                      value={formData.proximosPasos}
                      onChange={(e) => handleInputChange('proximosPasos', e.target.value)}
                      placeholder="Describe los próximos pasos..."
                      className="flex-1 resize-none focus:ring-2 focus:ring-blue-500/35"
                      style={{
                        background: 'rgba(0,0,0,0.18)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        color: '#EAF2FF',
                        fontFamily: "'Exo 2', sans-serif",
                        fontSize: '13px',
                        lineHeight: '1.5',
                        outline: 'none',
                        boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.22)',
                        minHeight: '80px'
                      }}
                    />
                  </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════════
                    COLUMNA 3: RUTAS, FINANZAS E HITOS
                    ═══════════════════════════════════════════════════════════════ */}
                <div className="flex flex-col gap-2.5">
                  
                  {/* NIVEL 3: RUTAS Y FINANZAS */}
                  <div style={cardStyle} className="hover:-translate-y-0.5 transition-transform">
                    <div className="flex items-center gap-2 mb-2">
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F97316', boxShadow: '0 0 8px rgba(249,115,22,0.50)' }} />
                      <span style={{ color: '#FB923C', fontFamily: "'Exo 2', sans-serif", fontSize: '12px', fontWeight: 700, letterSpacing: '0.06em' }}>NIVEL 3 • RUTAS Y FINANZAS</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="col-span-2">
                        <input type="text" value={formData.principalesRutas} onChange={(e) => handleInputChange('principalesRutas', e.target.value)} placeholder="CDMX - MTY - GDL" className="focus:ring-2 focus:ring-orange-500/35" style={inputStyle} />
                      </div>
                      <input type="number" value={formData.viajesPorMes} onChange={(e) => handleInputChange('viajesPorMes', e.target.value)} placeholder="Viajes/Mes" className="focus:ring-2 focus:ring-orange-500/35" style={{ ...inputStyle, fontFamily: "'Orbitron', monospace" }} />
                      <input type="text" value={formData.tarifa} onChange={(e) => handleInputChange('tarifa', e.target.value)} placeholder="Tarifa MXN" className="focus:ring-2 focus:ring-orange-500/35" style={{ ...inputStyle, fontFamily: "'Orbitron', monospace" }} />
                      <div className="col-span-2">
                        <input type="text" value={formData.proyectadoVentaMensual} onChange={(e) => handleInputChange('proyectadoVentaMensual', e.target.value)} placeholder="Proyectado USD: $50k - $100k" className="focus:ring-2 focus:ring-orange-500/35" style={{ ...inputStyle, fontFamily: "'Orbitron', monospace" }} />
                      </div>
                    </div>
                  </div>

                  {/* HITOS DEL CLIENTE */}
                  <div style={cardStyle} className="hover:-translate-y-0.5 transition-transform">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4" style={{ color: '#EAF2FF' }} />
                      <span style={{ color: '#EAF2FF', fontFamily: "'Exo 2', sans-serif", fontSize: '12px', fontWeight: 700 }}>HITOS DEL CLIENTE</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      {[
                        { key: 'altaCliente', label: 'N4 • Alta Cliente', color: '#22D3EE' },
                        { key: 'generacionSOP', label: 'N5 • Gen. SOP', color: '#A855F7' },
                        { key: 'juntaArranque', label: 'N6 • Junta Arranque', color: '#EC4899' },
                        { key: 'facturado', label: 'N7 • Facturado', color: '#F59E0B' },
                      ].map(({ key, label, color }) => (
                        <div key={key} className="flex items-center gap-1.5">
                          <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: color, boxShadow: `0 0 5px ${color}60` }} />
                          <ModernCheckbox 
                            checked={formData[key as keyof Lead] as boolean || false}
                            onChange={(v) => setFormData({ ...formData, [key]: v })}
                            label={label}
                            color={color}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Leyenda de Niveles - Compacta */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '8px 10px' }}>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center" style={{ color: '#7F93B2', fontFamily: "'Exo 2', sans-serif", fontSize: '10px' }}>
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
            </form>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              BARRA INFERIOR - Siempre visible, sin scroll
              ═══════════════════════════════════════════════════════════════ */}
          <div 
            className="flex-shrink-0 flex items-center justify-between px-4"
            style={{
              height: '60px',
              background: 'linear-gradient(180deg, rgba(15,23,42,0.80) 0%, rgba(15,23,42,0.98) 100%)',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 -8px 30px rgba(0,0,0,0.25)'
            }}
          >
            {/* Vendedor + Fecha */}
            <div 
              className="flex items-center gap-3"
              style={{
                background: 'rgba(59,130,246,0.10)',
                border: '1px solid rgba(59,130,246,0.20)',
                borderRadius: '10px',
                padding: '8px 14px',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)'
              }}
            >
              <span style={{ color: '#A9B7D0', fontFamily: "'Exo 2', sans-serif", fontSize: '13px' }}>
                Vendedor: <span style={{ color: '#EAF2FF', fontWeight: 600 }}>{formData.vendedor || '...'}</span>
              </span>
              <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.12)' }} />
              <span style={{ color: 'rgba(147,197,253,0.80)', fontFamily: "'Orbitron', monospace", fontSize: '12px' }}>
                {new Date().toLocaleDateString('es-MX')}
              </span>
            </div>

            {/* BOTÓN GUARDAR - CTA Principal */}
            <button
              type="button"
              onClick={() => handleSubmit()}
              className="flex items-center gap-2.5 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0"
              style={{
                background: 'linear-gradient(180deg, #2F6BFF 0%, #1F4FD6 100%)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '12px',
                padding: '12px 28px',
                boxShadow: '0 12px 30px rgba(0,0,0,0.40), 0 6px 16px rgba(47,107,255,0.30), inset 0 1px 0 rgba(255,255,255,0.18)',
                fontFamily: "'Exo 2', sans-serif",
                fontSize: '14px',
                fontWeight: 700,
                letterSpacing: '0.4px',
                color: 'white'
              }}
            >
              <Save className="w-4.5 h-4.5" />
              GUARDAR LEAD
            </button>
          </div>
        </div>
      </div>
    </ModuleTemplate>
  );
};
