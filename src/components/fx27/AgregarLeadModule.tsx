import { ModuleTemplate } from './ModuleTemplate';
import { useState, useEffect } from 'react';
import { MODULE_IMAGES } from '../../assets/module-images';
import { Building2, Globe, User, Phone, Mail, MapPinned, MapPin, Users, Calendar, Truck, DollarSign, TrendingUp, AlertCircle, FileText, Save, Check } from 'lucide-react';
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

  // ═══════════════════════════════════════════════════════════════
  // COMPONENTE: Checkbox Moderno
  // ═══════════════════════════════════════════════════════════════
  const ModernCheckbox = ({ checked, onChange, label, color = '#2F6BFF' }: { checked: boolean; onChange: (v: boolean) => void; label: string; color?: string }) => (
    <label className="flex items-center gap-3 cursor-pointer group">
      <div 
        onClick={() => onChange(!checked)}
        className="relative flex items-center justify-center transition-all duration-150"
        style={{
          width: '20px',
          height: '20px',
          borderRadius: '6px',
          background: checked ? color : 'rgba(255,255,255,0.04)',
          border: `1px solid ${checked ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.16)'}`,
          boxShadow: checked ? `0 4px 12px ${color}40` : 'none'
        }}
      >
        {checked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
      </div>
      <span 
        className="text-sm transition-colors"
        style={{ 
          color: checked ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.62)',
          fontFamily: "'Exo 2', sans-serif",
          fontWeight: checked ? 600 : 500
        }}
      >
        {label}
      </span>
    </label>
  );

  return (
    <ModuleTemplate title="Agregar Lead" onBack={onBack} headerImage={MODULE_IMAGES.AGREGAR_LEAD}>
      {/* ═══════════════════════════════════════════════════════════════
          CONTENEDOR PRINCIPAL - MEGA CARD FLOTANTE AAA
          ═══════════════════════════════════════════════════════════════ */}
      <div 
        className="h-full overflow-hidden p-4"
        style={{
          background: 'linear-gradient(180deg, rgba(12,20,35,0.70) 0%, rgba(12,20,35,0.50) 100%)',
          borderRadius: '22px',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: `
            inset 0 0 0 1px rgba(255,255,255,0.05),
            0 40px 120px rgba(0,0,0,0.55)
          `
        }}
      >
        <div 
          className="h-full overflow-y-auto pr-2"
          style={{ 
            scrollbarWidth: 'thin', 
            scrollbarColor: 'rgba(255,255,255,0.15) transparent' 
          }}
        >
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-3 gap-5">
              
              {/* ═══════════════════════════════════════════════════════════════
                  COLUMNA 1: EMPRESA + CONTACTO + UBICACIÓN
                  ═══════════════════════════════════════════════════════════════ */}
              <div className="space-y-4">
                
                {/* 🏢 NIVEL 1: EMPRESA */}
                <div 
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '18px',
                    padding: '16px',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)'
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22C55E' }} />
                    <span style={{ color: '#22C55E', fontFamily: "'Exo 2', sans-serif", fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em' }}>
                      NIVEL 1 • EMPRESA
                    </span>
                  </div>
                  <input
                    type="text"
                    value={formData.nombreEmpresa}
                    onChange={(e) => handleInputChange('nombreEmpresa', e.target.value)}
                    placeholder="EMPRESA S.A. DE C.V."
                    required
                    className="w-full transition-all duration-150 focus:outline-none"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '14px',
                      padding: '12px 16px',
                      color: 'rgba(255,255,255,0.92)',
                      fontFamily: "'Exo 2', sans-serif",
                      fontSize: '15px',
                      fontWeight: 700
                    }}
                  />
                </div>

                {/* 🌐 Página Web */}
                <div 
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '18px',
                    padding: '14px',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)'
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.50)' }} />
                    <span style={{ color: 'rgba(255,255,255,0.62)', fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 600 }}>
                      Página Web
                    </span>
                  </div>
                  <input
                    type="text"
                    value={formData.paginaWeb}
                    onChange={(e) => handleInputChange('paginaWeb', e.target.value)}
                    placeholder="www.empresa.com"
                    className="w-full transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-cyan-400/35"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '14px',
                      padding: '10px 14px',
                      color: 'rgba(255,255,255,0.92)',
                      fontFamily: "'Exo 2', sans-serif",
                      fontSize: '14px'
                    }}
                  />
                </div>

                {/* 👤 Nombre Contacto */}
                <div 
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '18px',
                    padding: '14px',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)'
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.50)' }} />
                    <span style={{ color: 'rgba(255,255,255,0.62)', fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 600 }}>
                      Nombre Contacto
                    </span>
                  </div>
                  <input
                    type="text"
                    value={formData.nombreContacto}
                    onChange={(e) => handleInputChange('nombreContacto', e.target.value)}
                    placeholder="Juan Pérez"
                    className="w-full transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-cyan-400/35"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '14px',
                      padding: '10px 14px',
                      color: 'rgba(255,255,255,0.92)',
                      fontFamily: "'Exo 2', sans-serif",
                      fontSize: '14px'
                    }}
                  />
                </div>

                {/* 📱 Teléfono + ✉️ Email */}
                <div className="grid grid-cols-2 gap-3">
                  <div 
                    style={{
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '18px',
                      padding: '12px',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)'
                    }}
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <Phone className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.50)' }} />
                      <span style={{ color: 'rgba(255,255,255,0.62)', fontFamily: "'Exo 2', sans-serif", fontSize: '10px', fontWeight: 600 }}>
                        Teléfono
                      </span>
                    </div>
                    <input
                      type="tel"
                      value={formData.telefonoContacto}
                      onChange={(e) => handleInputChange('telefonoContacto', e.target.value)}
                      placeholder="55 1234 5678"
                      className="w-full transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-cyan-400/35"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '14px',
                        padding: '8px 12px',
                        color: 'rgba(255,255,255,0.92)',
                        fontFamily: "'Exo 2', sans-serif",
                        fontSize: '13px'
                      }}
                    />
                  </div>
                  <div 
                    style={{
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '18px',
                      padding: '12px',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)'
                    }}
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <Mail className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.50)' }} />
                      <span style={{ color: 'rgba(255,255,255,0.62)', fontFamily: "'Exo 2', sans-serif", fontSize: '10px', fontWeight: 600 }}>
                        Email
                      </span>
                    </div>
                    <input
                      type="email"
                      value={formData.correoElectronico}
                      onChange={(e) => handleInputChange('correoElectronico', e.target.value)}
                      placeholder="contacto@empresa.com"
                      className="w-full transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-cyan-400/35"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '14px',
                        padding: '8px 12px',
                        color: 'rgba(255,255,255,0.92)',
                        fontFamily: "'Exo 2', sans-serif",
                        fontSize: '13px'
                      }}
                    />
                  </div>
                </div>

                {/* 🏭 Tipo de Empresa */}
                <div 
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '18px',
                    padding: '14px',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)'
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.50)' }} />
                    <span style={{ color: 'rgba(255,255,255,0.62)', fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 600 }}>
                      Tipo de Empresa
                    </span>
                  </div>
                  <select
                    value={formData.tipoEmpresa}
                    onChange={(e) => handleInputChange('tipoEmpresa', e.target.value)}
                    className="w-full cursor-pointer transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-cyan-400/35"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '14px',
                      padding: '10px 14px',
                      color: 'rgba(255,255,255,0.92)',
                      fontFamily: "'Exo 2', sans-serif",
                      fontSize: '13px'
                    }}
                  >
                    <option value="">Selecciona...</option>
                    {TIPOS_EMPRESA.map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}
                  </select>
                </div>

                {/* 📍 Ciudad + Estado */}
                <div className="grid grid-cols-2 gap-3">
                  <div 
                    style={{
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '18px',
                      padding: '12px',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)'
                    }}
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <MapPinned className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.50)' }} />
                      <span style={{ color: 'rgba(255,255,255,0.62)', fontFamily: "'Exo 2', sans-serif", fontSize: '10px', fontWeight: 600 }}>
                        Ciudad
                      </span>
                    </div>
                    <input
                      type="text"
                      value={formData.ciudad}
                      onChange={(e) => handleInputChange('ciudad', e.target.value)}
                      placeholder="Monterrey"
                      className="w-full transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-cyan-400/35"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '14px',
                        padding: '8px 12px',
                        color: 'rgba(255,255,255,0.92)',
                        fontFamily: "'Exo 2', sans-serif",
                        fontSize: '13px'
                      }}
                    />
                  </div>
                  <div 
                    style={{
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '18px',
                      padding: '12px',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)'
                    }}
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <MapPin className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.50)' }} />
                      <span style={{ color: 'rgba(255,255,255,0.62)', fontFamily: "'Exo 2', sans-serif", fontSize: '10px', fontWeight: 600 }}>
                        Estado
                      </span>
                    </div>
                    <input
                      type="text"
                      value={formData.estado}
                      onChange={(e) => handleInputChange('estado', e.target.value)}
                      placeholder="Nuevo León"
                      className="w-full transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-cyan-400/35"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '14px',
                        padding: '8px 12px',
                        color: 'rgba(255,255,255,0.92)',
                        fontFamily: "'Exo 2', sans-serif",
                        fontSize: '13px'
                      }}
                    />
                  </div>
                </div>

                {/* 🎯 Prioridad + 🏢 Tamaño */}
                <div className="grid grid-cols-2 gap-3">
                  <div 
                    style={{
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '18px',
                      padding: '12px',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)'
                    }}
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <AlertCircle className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.50)' }} />
                      <span style={{ color: 'rgba(255,255,255,0.62)', fontFamily: "'Exo 2', sans-serif", fontSize: '10px', fontWeight: 600 }}>
                        Prioridad
                      </span>
                    </div>
                    <select
                      value={formData.prioridad}
                      onChange={(e) => handleInputChange('prioridad', e.target.value)}
                      className="w-full cursor-pointer transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-cyan-400/35"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '14px',
                        padding: '8px 12px',
                        color: 'rgba(255,255,255,0.92)',
                        fontFamily: "'Exo 2', sans-serif",
                        fontSize: '13px'
                      }}
                    >
                      {PRIORIDADES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div 
                    style={{
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '18px',
                      padding: '12px',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)'
                    }}
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <Users className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.50)' }} />
                      <span style={{ color: 'rgba(255,255,255,0.62)', fontFamily: "'Exo 2', sans-serif", fontSize: '10px', fontWeight: 600 }}>
                        Tamaño
                      </span>
                    </div>
                    <select
                      value={formData.tamanoEmpresa}
                      onChange={(e) => handleInputChange('tamanoEmpresa', e.target.value)}
                      className="w-full cursor-pointer transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-cyan-400/35"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '14px',
                        padding: '8px 12px',
                        color: 'rgba(255,255,255,0.92)',
                        fontFamily: "'Exo 2', sans-serif",
                        fontSize: '13px'
                      }}
                    >
                      <option value="">Selecciona...</option>
                      {TAMANOS_EMPRESA.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                {/* 📅 Fecha Estimada de Cierre */}
                <div 
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '18px',
                    padding: '14px',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)'
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.50)' }} />
                    <span style={{ color: 'rgba(255,255,255,0.62)', fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 600 }}>
                      Fecha Estimada de Cierre
                    </span>
                  </div>
                  <input
                    type="date"
                    value={formData.fechaEstimadaCierre}
                    onChange={(e) => handleInputChange('fechaEstimadaCierre', e.target.value)}
                    className="w-full transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-cyan-400/35"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '14px',
                      padding: '10px 14px',
                      color: 'rgba(255,255,255,0.92)',
                      fontFamily: "'Orbitron', monospace",
                      fontSize: '14px',
                      fontVariantNumeric: 'tabular-nums'
                    }}
                  />
                </div>
              </div>

              {/* ═══════════════════════════════════════════════════════════════
                  COLUMNA 2: SERVICIOS + NOTAS
                  ═══════════════════════════════════════════════════════════════ */}
              <div className="space-y-4">
                
                {/* 🚛 Tipo de Servicio - TOGGLES OS */}
                <div 
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '18px',
                    padding: '16px',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)'
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2F6BFF' }} />
                    <span style={{ color: 'rgba(255,255,255,0.80)', fontFamily: "'Exo 2', sans-serif", fontSize: '12px', fontWeight: 600 }}>
                      Tipo de Servicio
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {TIPOS_SERVICIO.map(tipo => {
                      const isActive = formData.tipoServicio?.includes(tipo);
                      return (
                        <button
                          key={tipo}
                          type="button"
                          onClick={() => handleToggleTipoServicio(tipo)}
                          className="transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0"
                          style={{
                            background: isActive 
                              ? 'linear-gradient(180deg, rgba(47,107,255,0.90) 0%, rgba(47,107,255,0.55) 100%)'
                              : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${isActive ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.08)'}`,
                            borderRadius: '999px',
                            padding: '10px 16px',
                            color: isActive ? 'white' : 'rgba(255,255,255,0.62)',
                            fontFamily: "'Exo 2', sans-serif",
                            fontSize: '12px',
                            fontWeight: isActive ? 700 : 500,
                            boxShadow: isActive ? '0 10px 22px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.16)' : 'none'
                          }}
                        >
                          {tipo}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 🗺️ Tipo de Viaje - TOGGLES OS */}
                <div 
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '18px',
                    padding: '16px',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)'
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22C55E' }} />
                    <span style={{ color: 'rgba(255,255,255,0.80)', fontFamily: "'Exo 2', sans-serif", fontSize: '12px', fontWeight: 600 }}>
                      Tipo de Viaje
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {TIPOS_VIAJE.map(tipo => {
                      const isActive = formData.tipoViaje?.includes(tipo);
                      return (
                        <button
                          key={tipo}
                          type="button"
                          onClick={() => handleToggleTipoViaje(tipo)}
                          className="transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0"
                          style={{
                            background: isActive 
                              ? 'linear-gradient(180deg, rgba(34,197,94,0.90) 0%, rgba(34,197,94,0.55) 100%)'
                              : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${isActive ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.08)'}`,
                            borderRadius: '999px',
                            padding: '10px 16px',
                            color: isActive ? 'white' : 'rgba(255,255,255,0.62)',
                            fontFamily: "'Exo 2', sans-serif",
                            fontSize: '12px',
                            fontWeight: isActive ? 700 : 500,
                            boxShadow: isActive ? '0 10px 22px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.16)' : 'none'
                          }}
                        >
                          {tipo}
                        </button>
                      );
                    })}
                  </div>

                  {/* Checkboxes Transbordo y DTD */}
                  <div className="grid grid-cols-2 gap-4 mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <ModernCheckbox 
                      checked={formData.transbordo || false}
                      onChange={(v) => setFormData({ ...formData, transbordo: v })}
                      label="Transbordo"
                      color="#22C55E"
                    />
                    <ModernCheckbox 
                      checked={formData.dtd || false}
                      onChange={(v) => setFormData({ ...formData, dtd: v })}
                      label="DTD"
                      color="#22C55E"
                    />
                  </div>
                </div>

                {/* 📝 Próximos Pasos - NOTE PREMIUM */}
                <div 
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '18px',
                    padding: '16px',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
                    flex: 1
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B' }} />
                    <span style={{ color: 'rgba(255,255,255,0.80)', fontFamily: "'Exo 2', sans-serif", fontSize: '12px', fontWeight: 600 }}>
                      Próximos Pasos
                    </span>
                  </div>
                  <textarea
                    value={formData.proximosPasos}
                    onChange={(e) => handleInputChange('proximosPasos', e.target.value)}
                    placeholder="Describe los próximos pasos..."
                    className="w-full resize-none transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-cyan-400/35"
                    style={{
                      background: 'rgba(0,0,0,0.18)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '14px',
                      padding: '12px 14px',
                      color: 'rgba(255,255,255,0.92)',
                      fontFamily: "'Exo 2', sans-serif",
                      fontSize: '14px',
                      lineHeight: '1.6',
                      minHeight: '160px',
                      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.15)'
                    }}
                  />
                </div>
              </div>

              {/* ═══════════════════════════════════════════════════════════════
                  COLUMNA 3: RUTAS, FINANZAS E HITOS
                  ═══════════════════════════════════════════════════════════════ */}
              <div className="space-y-4 flex flex-col">
                
                {/* 💰 NIVEL 3: RUTAS Y FINANZAS */}
                <div 
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '18px',
                    padding: '16px',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)'
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FF6A00' }} />
                    <span style={{ color: '#FF6A00', fontFamily: "'Exo 2', sans-serif", fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em' }}>
                      NIVEL 3 • RUTAS Y FINANZAS
                    </span>
                  </div>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={formData.principalesRutas}
                      onChange={(e) => handleInputChange('principalesRutas', e.target.value)}
                      placeholder="CDMX - MTY - GDL"
                      className="w-full transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-cyan-400/35"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '14px',
                        padding: '10px 14px',
                        color: 'rgba(255,255,255,0.92)',
                        fontFamily: "'Exo 2', sans-serif",
                        fontSize: '14px'
                      }}
                    />
                    <input
                      type="number"
                      value={formData.viajesPorMes}
                      onChange={(e) => handleInputChange('viajesPorMes', e.target.value)}
                      placeholder="Viajes/Mes: 15"
                      className="w-full transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-cyan-400/35"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '14px',
                        padding: '10px 14px',
                        color: 'rgba(255,255,255,0.92)',
                        fontFamily: "'Orbitron', monospace",
                        fontSize: '14px',
                        fontVariantNumeric: 'tabular-nums'
                      }}
                    />
                    <input
                      type="text"
                      value={formData.tarifa}
                      onChange={(e) => handleInputChange('tarifa', e.target.value)}
                      placeholder="Tarifa MXN: $45k - $55k"
                      className="w-full transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-cyan-400/35"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '14px',
                        padding: '10px 14px',
                        color: 'rgba(255,255,255,0.92)',
                        fontFamily: "'Orbitron', monospace",
                        fontSize: '14px',
                        fontVariantNumeric: 'tabular-nums'
                      }}
                    />
                    <input
                      type="text"
                      value={formData.proyectadoVentaMensual}
                      onChange={(e) => handleInputChange('proyectadoVentaMensual', e.target.value)}
                      placeholder="Proyectado USD: $50k - $100k"
                      className="w-full transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-cyan-400/35"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '14px',
                        padding: '10px 14px',
                        color: 'rgba(255,255,255,0.92)',
                        fontFamily: "'Orbitron', monospace",
                        fontSize: '14px',
                        fontVariantNumeric: 'tabular-nums'
                      }}
                    />
                  </div>
                </div>

                {/* 🏆 HITOS DEL CLIENTE */}
                <div 
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '18px',
                    padding: '16px',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)'
                  }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.80)' }} />
                    <span style={{ color: 'rgba(255,255,255,0.92)', fontFamily: "'Exo 2', sans-serif", fontSize: '12px', fontWeight: 700 }}>
                      HITOS DEL CLIENTE
                    </span>
                  </div>
                  <div className="space-y-3">
                    {[
                      { key: 'altaCliente', label: 'Nivel 4 • Alta de Cliente', color: '#22D3EE' },
                      { key: 'generacionSOP', label: 'Nivel 5 • Generación SOP', color: '#A855F7' },
                      { key: 'juntaArranque', label: 'Nivel 6 • Junta de Arranque', color: '#EC4899' },
                      { key: 'facturado', label: 'Nivel 7 • Facturado', color: '#F59E0B' },
                    ].map(({ key, label, color }) => (
                      <div key={key} className="flex items-center gap-2">
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: color }} />
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

                {/* Info Vendedor + Botón Guardar */}
                <div className="mt-auto space-y-4">
                  {/* Info Vendedor */}
                  <div 
                    className="flex items-center justify-between"
                    style={{
                      background: 'rgba(47,107,255,0.10)',
                      border: '1px solid rgba(47,107,255,0.20)',
                      borderRadius: '14px',
                      padding: '12px 16px'
                    }}
                  >
                    <span style={{ color: 'rgba(255,255,255,0.70)', fontFamily: "'Exo 2', sans-serif", fontSize: '13px' }}>
                      Vendedor: <span style={{ color: 'white', fontWeight: 600 }}>{formData.vendedor}</span>
                    </span>
                    <span style={{ color: 'rgba(147,197,253,0.80)', fontFamily: "'Orbitron', monospace", fontSize: '13px', fontVariantNumeric: 'tabular-nums' }}>
                      {new Date().toLocaleDateString('es-MX')}
                    </span>
                  </div>

                  {/* BOTÓN GUARDAR - ESTILO OS PREMIUM */}
                  <button
                    type="submit"
                    className="group w-full flex items-center justify-center gap-3 transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0"
                    style={{
                      background: 'linear-gradient(180deg, rgba(47,107,255,1) 0%, rgba(47,107,255,0.70) 100%)',
                      border: '1px solid rgba(255,255,255,0.14)',
                      borderRadius: '14px',
                      padding: '16px 24px',
                      boxShadow: '0 18px 40px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.16)',
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
                    className="text-center"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: '14px',
                      padding: '10px 12px'
                    }}
                  >
                    <div style={{ color: 'rgba(255,255,255,0.45)', fontFamily: "'Exo 2', sans-serif", fontSize: '10px', lineHeight: '1.6' }}>
                      <span style={{ color: '#22C55E' }}>●</span> N1:Empresa • 
                      <span style={{ color: '#2F6BFF' }}>●</span> N2:Contacto • 
                      <span style={{ color: '#FF6A00' }}>●</span> N3:Rutas • 
                      <span style={{ color: '#22D3EE' }}>●</span> N4:Alta • 
                      <span style={{ color: '#A855F7' }}>●</span> N5:SOP • 
                      <span style={{ color: '#EC4899' }}>●</span> N6:Junta • 
                      <span style={{ color: '#F59E0B' }}>●</span> N7:Facturado
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </form>
        </div>
      </div>
    </ModuleTemplate>
  );
};
