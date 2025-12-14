import { ModuleTemplate } from './ModuleTemplate';
import { useState, useEffect } from 'react';
import { MODULE_IMAGES } from '../../assets/module-images';
import { Building2, Globe, User, Phone, Mail, MapPinned, MapPin, Users, Calendar, Truck, DollarSign, ClipboardList, TrendingUp, AlertCircle, FileText, Save } from 'lucide-react';
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

// ═══════════════════════════════════════════════════════════════
// ESTILOS AAA - Sistema de diseño premium
// ═══════════════════════════════════════════════════════════════
const styles = {
  // Inputs
  input: {
    background: 'rgba(15,23,42,0.60)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: '10px',
    color: 'white',
    fontFamily: "'Exo 2', sans-serif",
    fontSize: '13px',
    padding: '8px 12px',
    width: '100%',
    outline: 'none',
    transition: 'all 0.15s ease',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.15)'
  },
  inputFocus: {
    borderColor: 'rgba(59,130,246,0.50)',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.15), 0 0 0 2px rgba(59,130,246,0.15)'
  },
  // Labels
  label: {
    color: 'rgba(148,163,184,0.95)',
    fontFamily: "'Exo 2', sans-serif",
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.03em',
    marginBottom: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  // Cards/Secciones
  card: {
    background: 'rgba(15,23,42,0.40)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '12px',
    padding: '12px',
    backdropFilter: 'blur(8px)'
  },
  cardHighlight: {
    background: 'linear-gradient(135deg, rgba(34,197,94,0.08) 0%, rgba(34,197,94,0.03) 100%)',
    border: '1px solid rgba(34,197,94,0.25)',
    borderRadius: '12px',
    padding: '12px',
    boxShadow: '0 4px 20px rgba(34,197,94,0.10)'
  },
  // Chips/Pills para selección múltiple
  chipInactive: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    color: 'rgba(255,255,255,0.60)',
    fontFamily: "'Exo 2', sans-serif",
    fontSize: '12px',
    fontWeight: 600,
    padding: '8px 12px',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  chipActive: {
    background: 'rgba(59,130,246,0.15)',
    border: '1px solid rgba(59,130,246,0.40)',
    borderRadius: '8px',
    color: 'rgba(147,197,253,0.95)',
    fontFamily: "'Exo 2', sans-serif",
    fontSize: '12px',
    fontWeight: 600,
    padding: '8px 12px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(59,130,246,0.20), inset 0 1px 0 rgba(255,255,255,0.10)'
  }
};

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <ModuleTemplate title="Agregar Lead" onBack={onBack} headerImage={MODULE_IMAGES.AGREGAR_LEAD}>
      {/* ═══════════════════════════════════════════════════════════════
          FONDO GLOBAL AAA - Sistema de profundidad
          ═══════════════════════════════════════════════════════════════ */}
      <div 
        className="h-[calc(100vh-120px)] overflow-hidden relative"
        style={{
          background: `
            radial-gradient(ellipse 120% 80% at 50% 20%, rgba(37,99,235,0.90) 0%, rgba(30,64,175,0.95) 40%, rgba(15,23,42,1) 100%),
            linear-gradient(180deg, #1e3a8a 0%, #0f172a 100%)
          `
        }}
      >
        {/* Noise texture overlay */}
        <div 
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            opacity: 0.03,
            mixBlendMode: 'overlay'
          }}
        />
        
        {/* Vignette */}
        <div 
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            background: 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 50%, rgba(0,0,0,0.30) 100%)'
          }}
        />

        {/* CONTENEDOR PRINCIPAL - Card flotante */}
        <div 
          className="relative z-10 h-full mx-4 my-3 rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, rgba(15,23,42,0.92) 0%, rgba(15,23,42,0.96) 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: `
              0 25px 60px rgba(0,0,0,0.40),
              0 10px 25px rgba(0,0,0,0.25),
              inset 0 1px 0 rgba(255,255,255,0.06),
              inset 0 0 0 1px rgba(255,255,255,0.03)
            `,
            backdropFilter: 'blur(16px)'
          }}
        >
          <div className="p-4 h-full overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(100,116,139,0.3) transparent' }}>
            <form onSubmit={handleSubmit} className="h-full">
              <div className="grid grid-cols-3 gap-4 h-full">
                
                {/* ═══════════════════════════════════════════════════════════════
                    COLUMNA 1: EMPRESA + CONTACTO + UBICACIÓN
                    ═══════════════════════════════════════════════════════════════ */}
                <div className="space-y-3 flex flex-col">
                  
                  {/* 🏢 NIVEL 1: EMPRESA - Card destacada */}
                  <div 
                    className="p-3 rounded-xl"
                    style={{
                      background: 'linear-gradient(135deg, rgba(34,197,94,0.10) 0%, rgba(34,197,94,0.04) 100%)',
                      border: '1px solid rgba(34,197,94,0.30)',
                      boxShadow: '0 8px 24px rgba(34,197,94,0.12), inset 0 1px 0 rgba(255,255,255,0.05)'
                    }}
                  >
                    <div style={styles.label}>
                      <Building2 className="w-4 h-4 text-green-400" />
                      <span className="text-green-400 font-bold">NIVEL 1 • EMPRESA *</span>
                    </div>
                    <input
                      type="text"
                      value={formData.nombreEmpresa}
                      onChange={(e) => handleInputChange('nombreEmpresa', e.target.value)}
                      placeholder="EMPRESA S.A. DE C.V."
                      required
                      className="focus:ring-2 focus:ring-green-400/30"
                      style={{
                        ...styles.input,
                        fontSize: '14px',
                        fontWeight: 700,
                        borderColor: 'rgba(34,197,94,0.30)'
                      }}
                    />
                  </div>

                  {/* 🌐 Página Web */}
                  <div style={styles.card}>
                    <div style={styles.label}>
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      <span>Página Web</span>
                    </div>
                    <input
                      type="text"
                      value={formData.paginaWeb}
                      onChange={(e) => handleInputChange('paginaWeb', e.target.value)}
                      placeholder="www.empresa.com"
                      style={styles.input}
                    />
                  </div>

                  {/* 👤 Contacto */}
                  <div style={styles.card}>
                    <div style={styles.label}>
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Nombre Contacto</span>
                    </div>
                    <input
                      type="text"
                      value={formData.nombreContacto}
                      onChange={(e) => handleInputChange('nombreContacto', e.target.value)}
                      placeholder="Juan Pérez"
                      style={styles.input}
                    />
                  </div>

                  {/* 📱 Teléfono + ✉️ Email */}
                  <div className="grid grid-cols-2 gap-2">
                    <div style={styles.card}>
                      <div style={styles.label}>
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>Teléfono</span>
                      </div>
                      <input
                        type="tel"
                        value={formData.telefonoContacto}
                        onChange={(e) => handleInputChange('telefonoContacto', e.target.value)}
                        placeholder="55 1234 5678"
                        style={{ ...styles.input, fontSize: '12px' }}
                      />
                    </div>
                    <div style={styles.card}>
                      <div style={styles.label}>
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>Email</span>
                      </div>
                      <input
                        type="email"
                        value={formData.correoElectronico}
                        onChange={(e) => handleInputChange('correoElectronico', e.target.value)}
                        placeholder="contacto@empresa.com"
                        style={{ ...styles.input, fontSize: '12px' }}
                      />
                    </div>
                  </div>

                  {/* 🏭 Tipo de Empresa */}
                  <div style={styles.card}>
                    <div style={styles.label}>
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Tipo de Empresa</span>
                    </div>
                    <select
                      value={formData.tipoEmpresa}
                      onChange={(e) => handleInputChange('tipoEmpresa', e.target.value)}
                      style={{ ...styles.input, cursor: 'pointer' }}
                    >
                      <option value="">Selecciona...</option>
                      {TIPOS_EMPRESA.map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}
                    </select>
                  </div>

                  {/* 📍 Ciudad + Estado */}
                  <div className="grid grid-cols-2 gap-2">
                    <div style={styles.card}>
                      <div style={styles.label}>
                        <MapPinned className="w-3 h-3 text-slate-400" />
                        <span>Ciudad</span>
                      </div>
                      <input
                        type="text"
                        value={formData.ciudad}
                        onChange={(e) => handleInputChange('ciudad', e.target.value)}
                        placeholder="Monterrey"
                        style={{ ...styles.input, fontSize: '12px' }}
                      />
                    </div>
                    <div style={styles.card}>
                      <div style={styles.label}>
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>Estado</span>
                      </div>
                      <input
                        type="text"
                        value={formData.estado}
                        onChange={(e) => handleInputChange('estado', e.target.value)}
                        placeholder="Nuevo León"
                        style={{ ...styles.input, fontSize: '12px' }}
                      />
                    </div>
                  </div>

                  {/* 🎯 Prioridad + 🏢 Tamaño */}
                  <div className="grid grid-cols-2 gap-2">
                    <div style={styles.card}>
                      <div style={styles.label}>
                        <AlertCircle className="w-3 h-3 text-slate-400" />
                        <span>Prioridad</span>
                      </div>
                      <select
                        value={formData.prioridad}
                        onChange={(e) => handleInputChange('prioridad', e.target.value)}
                        style={{ ...styles.input, fontSize: '12px', cursor: 'pointer' }}
                      >
                        {PRIORIDADES.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div style={styles.card}>
                      <div style={styles.label}>
                        <Users className="w-3 h-3 text-slate-400" />
                        <span>Tamaño</span>
                      </div>
                      <select
                        value={formData.tamanoEmpresa}
                        onChange={(e) => handleInputChange('tamanoEmpresa', e.target.value)}
                        style={{ ...styles.input, fontSize: '12px', cursor: 'pointer' }}
                      >
                        <option value="">Selecciona...</option>
                        {TAMANOS_EMPRESA.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* 📅 Fecha Estimada de Cierre */}
                  <div style={styles.card}>
                    <div style={styles.label}>
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Fecha Estimada de Cierre</span>
                    </div>
                    <input
                      type="date"
                      value={formData.fechaEstimadaCierre}
                      onChange={(e) => handleInputChange('fechaEstimadaCierre', e.target.value)}
                      style={{ ...styles.input, fontFamily: "'Orbitron', monospace" }}
                    />
                  </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════════
                    COLUMNA 2: SERVICIOS + NOTAS
                    ═══════════════════════════════════════════════════════════════ */}
                <div className="space-y-3 flex flex-col">
                  
                  {/* 🚛 Tipo de Servicio */}
                  <div style={styles.card}>
                    <div style={styles.label}>
                      <Truck className="w-4 h-4 text-blue-400" />
                      <span className="text-blue-300">Tipo de Servicio</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {TIPOS_SERVICIO.map(tipo => (
                        <button
                          key={tipo}
                          type="button"
                          onClick={() => handleToggleTipoServicio(tipo)}
                          className="transition-all duration-150 hover:-translate-y-0.5"
                          style={formData.tipoServicio?.includes(tipo) ? styles.chipActive : styles.chipInactive}
                        >
                          {tipo}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 🗺️ Tipo de Viaje */}
                  <div style={styles.card}>
                    <div style={styles.label}>
                      <MapPin className="w-4 h-4 text-green-400" />
                      <span className="text-green-300">Tipo de Viaje</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {TIPOS_VIAJE.map(tipo => (
                        <button
                          key={tipo}
                          type="button"
                          onClick={() => handleToggleTipoViaje(tipo)}
                          className="transition-all duration-150 hover:-translate-y-0.5"
                          style={formData.tipoViaje?.includes(tipo) 
                            ? { ...styles.chipActive, background: 'rgba(34,197,94,0.15)', borderColor: 'rgba(34,197,94,0.40)', color: 'rgba(134,239,172,0.95)' }
                            : styles.chipInactive
                          }
                        >
                          {tipo}
                        </button>
                      ))}
                    </div>

                    {/* Checkboxes Transbordo y DTD */}
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <label 
                        className="flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all"
                        style={{
                          background: formData.transbordo ? 'rgba(34,197,94,0.10)' : 'transparent',
                          border: `1px solid ${formData.transbordo ? 'rgba(34,197,94,0.30)' : 'rgba(255,255,255,0.06)'}`
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={formData.transbordo}
                          onChange={(e) => setFormData({ ...formData, transbordo: e.target.checked })}
                          className="w-4 h-4 rounded cursor-pointer accent-green-500"
                        />
                        <span className={`text-xs font-medium ${formData.transbordo ? 'text-green-400' : 'text-slate-500'}`}>
                          Transbordo
                        </span>
                      </label>

                      <label 
                        className="flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all"
                        style={{
                          background: formData.dtd ? 'rgba(34,197,94,0.10)' : 'transparent',
                          border: `1px solid ${formData.dtd ? 'rgba(34,197,94,0.30)' : 'rgba(255,255,255,0.06)'}`
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={formData.dtd}
                          onChange={(e) => setFormData({ ...formData, dtd: e.target.checked })}
                          className="w-4 h-4 rounded cursor-pointer accent-green-500"
                        />
                        <span className={`text-xs font-medium ${formData.dtd ? 'text-green-400' : 'text-slate-500'}`}>
                          DTD
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* 📝 Próximos Pasos */}
                  <div style={{ ...styles.card, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={styles.label}>
                      <FileText className="w-4 h-4 text-amber-400" />
                      <span className="text-amber-300">Próximos Pasos</span>
                    </div>
                    <textarea
                      value={formData.proximosPasos}
                      onChange={(e) => handleInputChange('proximosPasos', e.target.value)}
                      placeholder="Describe los próximos pasos..."
                      className="flex-1 mt-2 resize-none"
                      style={{
                        ...styles.input,
                        minHeight: '120px',
                        lineHeight: '1.5'
                      }}
                    />
                  </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════════
                    COLUMNA 3: RUTAS, FINANZAS E HITOS
                    ═══════════════════════════════════════════════════════════════ */}
                <div className="space-y-3 flex flex-col">
                  
                  {/* 💰 NIVEL 3: RUTAS Y FINANZAS */}
                  <div 
                    className="p-3 rounded-xl"
                    style={{
                      background: 'linear-gradient(135deg, rgba(249,115,22,0.10) 0%, rgba(249,115,22,0.04) 100%)',
                      border: '1px solid rgba(249,115,22,0.30)',
                      boxShadow: '0 8px 24px rgba(249,115,22,0.10), inset 0 1px 0 rgba(255,255,255,0.05)'
                    }}
                  >
                    <div style={styles.label}>
                      <DollarSign className="w-4 h-4 text-orange-400" />
                      <span className="text-orange-400 font-bold">NIVEL 3 • RUTAS Y FINANZAS</span>
                    </div>
                    <div className="space-y-2 mt-2">
                      <input
                        type="text"
                        value={formData.principalesRutas}
                        onChange={(e) => handleInputChange('principalesRutas', e.target.value)}
                        placeholder="CDMX - MTY - GDL"
                        style={{ ...styles.input, borderColor: 'rgba(249,115,22,0.25)' }}
                      />
                      <input
                        type="number"
                        value={formData.viajesPorMes}
                        onChange={(e) => handleInputChange('viajesPorMes', e.target.value)}
                        placeholder="Viajes/Mes: 15"
                        style={{ ...styles.input, fontFamily: "'Orbitron', monospace", borderColor: 'rgba(249,115,22,0.25)' }}
                      />
                      <input
                        type="text"
                        value={formData.tarifa}
                        onChange={(e) => handleInputChange('tarifa', e.target.value)}
                        placeholder="Tarifa MXN: $45k - $55k"
                        style={{ ...styles.input, fontFamily: "'Orbitron', monospace", borderColor: 'rgba(249,115,22,0.25)' }}
                      />
                      <input
                        type="text"
                        value={formData.proyectadoVentaMensual}
                        onChange={(e) => handleInputChange('proyectadoVentaMensual', e.target.value)}
                        placeholder="Proyectado USD: $50k - $100k"
                        style={{ ...styles.input, fontFamily: "'Orbitron', monospace", borderColor: 'rgba(249,115,22,0.25)' }}
                      />
                    </div>
                  </div>

                  {/* 🏆 HITOS DEL CLIENTE (NIVELES 4-7) */}
                  <div style={styles.card}>
                    <div style={styles.label}>
                      <TrendingUp className="w-4 h-4 text-white" />
                      <span className="text-white font-bold">HITOS DEL CLIENTE</span>
                    </div>
                    <div className="space-y-2 mt-2">
                      {[
                        { key: 'altaCliente', label: 'Nivel 4 • Alta de Cliente', color: '#06B6D4' },
                        { key: 'generacionSOP', label: 'Nivel 5 • Generación SOP', color: '#A855F7' },
                        { key: 'juntaArranque', label: 'Nivel 6 • Junta de Arranque', color: '#EC4899' },
                        { key: 'facturado', label: 'Nivel 7 • Facturado', color: '#F59E0B' },
                      ].map(({ key, label, color }) => (
                        <label 
                          key={key}
                          className="flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all"
                          style={{
                            background: formData[key as keyof Lead] ? `${color}15` : 'transparent',
                            border: `1px solid ${formData[key as keyof Lead] ? `${color}40` : 'rgba(255,255,255,0.06)'}`
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={formData[key as keyof Lead] as boolean || false}
                            onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
                            className="w-4 h-4 rounded cursor-pointer"
                            style={{ accentColor: color }}
                          />
                          <span 
                            className="text-xs font-medium"
                            style={{ color: formData[key as keyof Lead] ? color : 'rgba(148,163,184,0.70)' }}
                          >
                            <span style={{ color }}>●</span> {label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Info Vendedor + Botón Guardar */}
                  <div className="mt-auto space-y-3">
                    {/* Info Vendedor */}
                    <div 
                      className="px-3 py-2 rounded-xl flex items-center justify-between"
                      style={{
                        background: 'rgba(59,130,246,0.10)',
                        border: '1px solid rgba(59,130,246,0.25)'
                      }}
                    >
                      <span className="text-white/80 text-sm">
                        Vendedor: <span className="font-bold text-white">{formData.vendedor}</span>
                      </span>
                      <span className="text-blue-300/70 text-sm" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {new Date().toLocaleDateString('es-MX')}
                      </span>
                    </div>

                    {/* BOTÓN GUARDAR - Premium OS */}
                    <button
                      type="submit"
                      className="group relative w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
                      style={{
                        background: 'linear-gradient(180deg, #3B82F6 0%, #2563EB 50%, #1D4ED8 100%)',
                        border: '1px solid rgba(96,165,250,0.50)',
                        boxShadow: '0 10px 30px rgba(59,130,246,0.35), 0 4px 12px rgba(59,130,246,0.25), inset 0 1px 0 rgba(255,255,255,0.20)',
                        fontFamily: "'Exo 2', sans-serif",
                        fontSize: '15px',
                        fontWeight: 700,
                        letterSpacing: '0.5px',
                        color: 'white'
                      }}
                    >
                      <Save className="w-5 h-5" />
                      GUARDAR LEAD
                    </button>

                    {/* Indicador de Niveles */}
                    <div 
                      className="px-3 py-2 rounded-xl text-center"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)'
                      }}
                    >
                      <div className="text-[10px] text-slate-500 leading-relaxed">
                        <span className="text-green-400">●</span> N1:Empresa • 
                        <span className="text-blue-400">●</span> N2:Contacto • 
                        <span className="text-orange-400">●</span> N3:Rutas • 
                        <span className="text-cyan-400">●</span> N4:Alta • 
                        <span className="text-purple-400">●</span> N5:SOP • 
                        <span className="text-pink-400">●</span> N6:Junta • 
                        <span className="text-yellow-400">●</span> N7:Facturado
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </form>
          </div>
        </div>
      </div>
    </ModuleTemplate>
  );
};
