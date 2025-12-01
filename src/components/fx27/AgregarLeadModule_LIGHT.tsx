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

const TIPOS_SERVICIO = [
  'Seco',
  'Refrigerado',
  'Seco Hazmat',
  'Refrigerado Hazmat'
];

const TIPOS_VIAJE = [
  'Impo',
  'Expo',
  'Nacional',
  'Dedicado'
];

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

const TAMANOS_EMPRESA = [
  '1-50 empleados',
  '51-200 empleados',
  '201-1000 empleados',
  '1000+ empleados'
];

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
        return texto
          .toLowerCase()
          .split(' ')
          .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
          .join(' ');
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
    const nuevosServicios = servicios.includes(tipo)
      ? servicios.filter(s => s !== tipo)
      : [...servicios, tipo];
    setFormData({ ...formData, tipoServicio: nuevosServicios });
  };

  const handleToggleTipoViaje = (tipo: string) => {
    const viajes = formData.tipoViaje || [];
    const nuevosViajes = viajes.includes(tipo)
      ? viajes.filter(v => v !== tipo)
      : [...viajes, tipo];
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
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify(nuevoLead)
      });

      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Error al guardar el lead');
      }

      console.log('[AgregarLead] Lead guardado exitosamente:', result.lead);
      alert('✅ Lead guardado exitosamente');

      setFormData({
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
        vendedor: formData.vendedor,
        altaCliente: false,
        generacionSOP: false,
        juntaArranque: false,
        facturado: false,
      });
    } catch (error) {
      console.error('[AgregarLead] Error al guardar lead:', error);
      alert(`❌ Error al guardar el lead: ${error}`);
    }
  };

  return (
    <ModuleTemplate 
      title="Agregar Lead" 
      onBack={onBack} 
      headerImage={MODULE_IMAGES.AGREGAR_LEAD}
    >
      {/* Fondo general gris claro con sutil degradado */}
      <div 
        className="p-4 h-[calc(100vh-160px)] overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #E8EDF4 0%, #E0E7F0 50%, #D8E1EC 100%)',
        }}
      >
        <form onSubmit={handleSubmit} className="h-full">
          {/* Grid principal: 3 columnas */}
          <div className="grid grid-cols-3 gap-4 h-full">
            
            {/* ========== COLUMNA 1: EMPRESA ========== */}
            <div className="space-y-3 flex flex-col">
              
              {/* Card contenedor */}
              <div 
                className="p-4 rounded-xl space-y-3 flex flex-col shadow-md"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #D2D9E5',
                }}
              >
                {/* Empresa (NIVEL 1) */}
                <div 
                  className="p-3 rounded-lg"
                  style={{
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-5 h-5 text-white" strokeWidth={2.5} />
                    <h3 
                      className="text-white uppercase tracking-wide"
                      style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 700 }}
                    >
                      NIVEL 1 • EMPRESA *
                    </h3>
                  </div>
                  <input
                    type="text"
                    value={formData.nombreEmpresa}
                    onChange={(e) => handleInputChange('nombreEmpresa', e.target.value)}
                    placeholder="EMPRESA S.A. DE C.V."
                    required
                    className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                    style={{
                      background: 'rgba(255, 255, 255, 0.95)',
                      border: '2px solid rgba(255, 255, 255, 0.6)',
                      color: '#0F172A',
                      fontFamily: "'Exo 2', sans-serif",
                      fontSize: '15px',
                      fontWeight: 700,
                    }}
                  />
                </div>

                {/* Página Web */}
                <div className="space-y-1.5">
                  <div 
                    className="flex items-center gap-2 px-2 py-1 rounded-t-lg"
                    style={{
                      background: 'linear-gradient(to right, #F0F4F8, #E8EDF4)',
                      borderBottom: '1px solid #D2D9E5',
                    }}
                  >
                    <Globe className="w-4 h-4" style={{ color: '#3B82F6' }} />
                    <label 
                      style={{ 
                        fontFamily: "'Exo 2', sans-serif", 
                        fontSize: '13px', 
                        fontWeight: 600,
                        color: '#0F172A'
                      }}
                    >
                      Página Web
                    </label>
                  </div>
                  <input
                    type="text"
                    value={formData.paginaWeb}
                    onChange={(e) => handleInputChange('paginaWeb', e.target.value)}
                    placeholder="www.empresa.com (opcional)"
                    className="w-full px-3 py-2 rounded-lg focus:outline-none transition-all"
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      color: '#111827',
                      fontFamily: "'Exo 2', sans-serif",
                      fontSize: '14px',
                      borderRadius: '8px',
                    }}
                    onFocus={(e) => {
                      e.target.style.border = '2px solid #3B82F6';
                      e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.border = '1px solid #CBD5E1';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                {/* Nombre Contacto */}
                <div className="space-y-1.5">
                  <div 
                    className="flex items-center gap-2 px-2 py-1 rounded-t-lg"
                    style={{
                      background: 'linear-gradient(to right, #F0F4F8, #E8EDF4)',
                      borderBottom: '1px solid #D2D9E5',
                    }}
                  >
                    <User className="w-4 h-4" style={{ color: '#3B82F6' }} />
                    <label 
                      style={{ 
                        fontFamily: "'Exo 2', sans-serif", 
                        fontSize: '13px', 
                        fontWeight: 600,
                        color: '#0F172A'
                      }}
                    >
                      Nombre Contacto
                    </label>
                  </div>
                  <input
                    type="text"
                    value={formData.nombreContacto}
                    onChange={(e) => handleInputChange('nombreContacto', e.target.value)}
                    placeholder="Juan Pérez"
                    className="w-full px-3 py-2 rounded-lg focus:outline-none transition-all"
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      color: '#111827',
                      fontFamily: "'Exo 2', sans-serif",
                      fontSize: '14px',
                      borderRadius: '8px',
                    }}
                    onFocus={(e) => {
                      e.target.style.border = '2px solid #3B82F6';
                      e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.border = '1px solid #CBD5E1';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                {/* Teléfono + Email */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <div 
                      className="flex items-center gap-1.5 px-2 py-1 rounded-t-lg"
                      style={{
                        background: 'linear-gradient(to right, #F0F4F8, #E8EDF4)',
                        borderBottom: '1px solid #D2D9E5',
                      }}
                    >
                      <Phone className="w-3.5 h-3.5" style={{ color: '#3B82F6' }} />
                      <label 
                        style={{ 
                          fontFamily: "'Exo 2', sans-serif", 
                          fontSize: '12px', 
                          fontWeight: 600,
                          color: '#0F172A'
                        }}
                      >
                        Teléfono
                      </label>
                    </div>
                    <input
                      type="tel"
                      value={formData.telefonoContacto}
                      onChange={(e) => handleInputChange('telefonoContacto', e.target.value)}
                      placeholder="55 1234 5678"
                      className="w-full px-3 py-2 rounded-lg focus:outline-none transition-all"
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #CBD5E1',
                        color: '#111827',
                        fontFamily: "'Exo 2', sans-serif",
                        fontSize: '13px',
                        borderRadius: '8px',
                      }}
                      onFocus={(e) => {
                        e.target.style.border = '2px solid #3B82F6';
                        e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.border = '1px solid #CBD5E1';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div 
                      className="flex items-center gap-1.5 px-2 py-1 rounded-t-lg"
                      style={{
                        background: 'linear-gradient(to right, #F0F4F8, #E8EDF4)',
                        borderBottom: '1px solid #D2D9E5',
                      }}
                    >
                      <Mail className="w-3.5 h-3.5" style={{ color: '#3B82F6' }} />
                      <label 
                        style={{ 
                          fontFamily: "'Exo 2', sans-serif", 
                          fontSize: '12px', 
                          fontWeight: 600,
                          color: '#0F172A'
                        }}
                      >
                        Email
                      </label>
                    </div>
                    <input
                      type="email"
                      value={formData.correoElectronico}
                      onChange={(e) => handleInputChange('correoElectronico', e.target.value)}
                      placeholder="contacto@empresa.com"
                      className="w-full px-3 py-2 rounded-lg focus:outline-none transition-all"
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #CBD5E1',
                        color: '#111827',
                        fontFamily: "'Exo 2', sans-serif",
                        fontSize: '13px',
                        borderRadius: '8px',
                      }}
                      onFocus={(e) => {
                        e.target.style.border = '2px solid #3B82F6';
                        e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.border = '1px solid #CBD5E1';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </div>

                {/* Tipo de Empresa */}
                <div className="space-y-1.5">
                  <div 
                    className="flex items-center gap-2 px-2 py-1 rounded-t-lg"
                    style={{
                      background: 'linear-gradient(to right, #ECFDF5, #D1FAE5)',
                      borderBottom: '1px solid #A7F3D0',
                    }}
                  >
                    <Building2 className="w-4 h-4" style={{ color: '#10B981' }} />
                    <label 
                      style={{ 
                        fontFamily: "'Exo 2', sans-serif", 
                        fontSize: '13px', 
                        fontWeight: 600,
                        color: '#0F172A'
                      }}
                    >
                      Tipo de Empresa
                    </label>
                  </div>
                  <select
                    value={formData.tipoEmpresa}
                    onChange={(e) => handleInputChange('tipoEmpresa', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg focus:outline-none transition-all"
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #A7F3D0',
                      color: '#111827',
                      fontFamily: "'Exo 2', sans-serif",
                      fontSize: '13px',
                      fontWeight: 600,
                      borderRadius: '8px',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.border = '2px solid #10B981';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.border = '1px solid #A7F3D0';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <option value="">Selecciona...</option>
                    {TIPOS_EMPRESA.map(tipo => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </select>
                </div>

                {/* Ciudad + Estado */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <div 
                      className="flex items-center gap-1.5 px-2 py-1 rounded-t-lg"
                      style={{
                        background: 'linear-gradient(to right, #F0F4F8, #E8EDF4)',
                        borderBottom: '1px solid #D2D9E5',
                      }}
                    >
                      <MapPinned className="w-3.5 h-3.5" style={{ color: '#06B6D4' }} />
                      <label 
                        style={{ 
                          fontFamily: "'Exo 2', sans-serif", 
                          fontSize: '12px', 
                          fontWeight: 600,
                          color: '#0F172A'
                        }}
                      >
                        Ciudad
                      </label>
                    </div>
                    <input
                      type="text"
                      value={formData.ciudad}
                      onChange={(e) => handleInputChange('ciudad', e.target.value)}
                      placeholder="Monterrey"
                      className="w-full px-3 py-2 rounded-lg focus:outline-none transition-all"
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #CBD5E1',
                        color: '#111827',
                        fontFamily: "'Exo 2', sans-serif",
                        fontSize: '13px',
                        borderRadius: '8px',
                      }}
                      onFocus={(e) => {
                        e.target.style.border = '2px solid #06B6D4';
                        e.target.style.boxShadow = '0 0 0 3px rgba(6, 182, 212, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.border = '1px solid #CBD5E1';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div 
                      className="flex items-center gap-1.5 px-2 py-1 rounded-t-lg"
                      style={{
                        background: 'linear-gradient(to right, #F0F4F8, #E8EDF4)',
                        borderBottom: '1px solid #D2D9E5',
                      }}
                    >
                      <MapPin className="w-3.5 h-3.5" style={{ color: '#06B6D4' }} />
                      <label 
                        style={{ 
                          fontFamily: "'Exo 2', sans-serif", 
                          fontSize: '12px', 
                          fontWeight: 600,
                          color: '#0F172A'
                        }}
                      >
                        Estado
                      </label>
                    </div>
                    <input
                      type="text"
                      value={formData.estado}
                      onChange={(e) => handleInputChange('estado', e.target.value)}
                      placeholder="Nuevo León"
                      className="w-full px-3 py-2 rounded-lg focus:outline-none transition-all"
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #CBD5E1',
                        color: '#111827',
                        fontFamily: "'Exo 2', sans-serif",
                        fontSize: '13px',
                        borderRadius: '8px',
                      }}
                      onFocus={(e) => {
                        e.target.style.border = '2px solid #06B6D4';
                        e.target.style.boxShadow = '0 0 0 3px rgba(6, 182, 212, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.border = '1px solid #CBD5E1';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </div>

                {/* Prioridad + Tamaño */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <div 
                      className="flex items-center gap-1.5 px-2 py-1 rounded-t-lg"
                      style={{
                        background: 'linear-gradient(to right, #FEE2E2, #FECACA)',
                        borderBottom: '1px solid #FCA5A5',
                      }}
                    >
                      <AlertCircle className="w-3.5 h-3.5" style={{ color: '#EF4444' }} />
                      <label 
                        style={{ 
                          fontFamily: "'Exo 2', sans-serif", 
                          fontSize: '12px', 
                          fontWeight: 600,
                          color: '#0F172A'
                        }}
                      >
                        Prioridad
                      </label>
                    </div>
                    <select
                      value={formData.prioridad}
                      onChange={(e) => handleInputChange('prioridad', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg focus:outline-none transition-all"
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #FCA5A5',
                        color: '#111827',
                        fontFamily: "'Exo 2', sans-serif",
                        fontSize: '13px',
                        fontWeight: 700,
                        borderRadius: '8px',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.border = '2px solid #EF4444';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.border = '1px solid #FCA5A5';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      {PRIORIDADES.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <div 
                      className="flex items-center gap-1.5 px-2 py-1 rounded-t-lg"
                      style={{
                        background: 'linear-gradient(to right, #F3E8FF, #E9D5FF)',
                        borderBottom: '1px solid #D8B4FE',
                      }}
                    >
                      <Users className="w-3.5 h-3.5" style={{ color: '#A855F7' }} />
                      <label 
                        style={{ 
                          fontFamily: "'Exo 2', sans-serif", 
                          fontSize: '12px', 
                          fontWeight: 600,
                          color: '#0F172A'
                        }}
                      >
                        Tamaño
                      </label>
                    </div>
                    <select
                      value={formData.tamanoEmpresa}
                      onChange={(e) => handleInputChange('tamanoEmpresa', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg focus:outline-none transition-all"
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #D8B4FE',
                        color: '#111827',
                        fontFamily: "'Exo 2', sans-serif",
                        fontSize: '12px',
                        fontWeight: 600,
                        borderRadius: '8px',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.border = '2px solid #A855F7';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(168, 85, 247, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.border = '1px solid #D8B4FE';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <option value="">Selecciona...</option>
                      {TAMANOS_EMPRESA.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Fecha Estimada Cierre */}
                <div className="space-y-1.5">
                  <div 
                    className="flex items-center gap-2 px-2 py-1 rounded-t-lg"
                    style={{
                      background: 'linear-gradient(to right, #FEF3C7, #FDE68A)',
                      borderBottom: '1px solid #FCD34D',
                    }}
                  >
                    <Calendar className="w-4 h-4" style={{ color: '#F59E0B' }} />
                    <label 
                      style={{ 
                        fontFamily: "'Exo 2', sans-serif", 
                        fontSize: '13px', 
                        fontWeight: 600,
                        color: '#0F172A'
                      }}
                    >
                      Fecha Estimada de Cierre
                    </label>
                  </div>
                  <input
                    type="date"
                    value={formData.fechaEstimadaCierre}
                    onChange={(e) => handleInputChange('fechaEstimadaCierre', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg focus:outline-none transition-all backdrop-blur-xl uppercase"
                    style={{
                      background: 'linear-gradient(135deg, rgba(254, 249, 195, 0.8) 0%, rgba(253, 224, 71, 0.3) 100%)',
                      border: '1.5px solid #FCD34D',
                      color: '#111827',
                      fontFamily: "'Exo 2', sans-serif",
                      fontSize: '14px',
                      fontWeight: 600,
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(252, 211, 77, 0.2), inset 0 1px 0 rgba(255,255,255,0.6)',
                      textTransform: 'uppercase'
                    }}
                    onFocus={(e) => {
                      e.target.style.border = '2px solid #F59E0B';
                      e.target.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.border = '1px solid #FCD34D';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>
            </div>

            {/* ========== COLUMNA 2: SERVICIOS ========== */}
            <div className="space-y-3 flex flex-col">
              <div 
                className="p-4 rounded-xl space-y-3 flex flex-col shadow-md"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #D2D9E5',
                }}
              >
                {/* Tipo de Servicio */}
                <div className="space-y-2">
                  <div 
                    className="flex items-center gap-2 px-3 py-2 rounded-lg"
                    style={{
                      background: 'linear-gradient(to right, #DBEAFE, #BFDBFE)',
                      borderBottom: '2px solid #93C5FD',
                    }}
                  >
                    <Truck className="w-5 h-5" style={{ color: '#3B82F6' }} />
                    <label 
                      style={{ 
                        fontFamily: "'Exo 2', sans-serif", 
                        fontSize: '14px', 
                        fontWeight: 600,
                        color: '#0F172A'
                      }}
                    >
                      Tipo de Servicio
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {TIPOS_SERVICIO.map(tipo => (
                      <button
                        key={tipo}
                        type="button"
                        onClick={() => handleToggleTipoServicio(tipo)}
                        className="px-3 py-2 rounded-lg transition-all"
                        style={{
                          background: formData.tipoServicio?.includes(tipo)
                            ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)'
                            : '#F9FAFB',
                          border: formData.tipoServicio?.includes(tipo)
                            ? '2px solid #2563EB'
                            : '1px solid #D1D5DB',
                          color: formData.tipoServicio?.includes(tipo) ? '#FFFFFF' : '#6B7280',
                          fontFamily: "'Exo 2', sans-serif",
                          fontSize: '13px',
                          fontWeight: 700,
                          boxShadow: formData.tipoServicio?.includes(tipo)
                            ? '0 4px 12px rgba(59, 130, 246, 0.3)'
                            : 'none',
                        }}
                      >
                        {tipo}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tipo de Viaje */}
                <div className="space-y-2">
                  <div 
                    className="flex items-center gap-2 px-3 py-2 rounded-lg"
                    style={{
                      background: 'linear-gradient(to right, #D1FAE5, #A7F3D0)',
                      borderBottom: '2px solid #6EE7B7',
                    }}
                  >
                    <MapPin className="w-5 h-5" style={{ color: '#10B981' }} />
                    <label 
                      style={{ 
                        fontFamily: "'Exo 2', sans-serif", 
                        fontSize: '14px', 
                        fontWeight: 600,
                        color: '#0F172A'
                      }}
                    >
                      Tipo de Viaje
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {TIPOS_VIAJE.map(tipo => (
                      <button
                        key={tipo}
                        type="button"
                        onClick={() => handleToggleTipoViaje(tipo)}
                        className="px-3 py-2 rounded-lg transition-all"
                        style={{
                          background: formData.tipoViaje?.includes(tipo)
                            ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                            : '#F9FAFB',
                          border: formData.tipoViaje?.includes(tipo)
                            ? '2px solid #059669'
                            : '1px solid #D1D5DB',
                          color: formData.tipoViaje?.includes(tipo) ? '#FFFFFF' : '#6B7280',
                          fontFamily: "'Exo 2', sans-serif",
                          fontSize: '13px',
                          fontWeight: 700,
                          boxShadow: formData.tipoViaje?.includes(tipo)
                            ? '0 4px 12px rgba(16, 185, 129, 0.3)'
                            : 'none',
                        }}
                      >
                        {tipo}
                      </button>
                    ))}
                  </div>

                  {/* Transbordo y DTD */}
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <label 
                      className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all"
                      style={{
                        background: formData.transbordo ? '#ECFDF5' : '#F9FAFB',
                        border: formData.transbordo ? '2px solid #10B981' : '1px solid #D1D5DB',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formData.transbordo}
                        onChange={(e) => setFormData({ ...formData, transbordo: e.target.checked })}
                        className="w-4 h-4 rounded cursor-pointer"
                        style={{
                          accentColor: '#10B981',
                        }}
                      />
                      <span 
                        style={{ 
                          fontFamily: "'Exo 2', sans-serif", 
                          fontSize: '12px',
                          color: formData.transbordo ? '#059669' : '#6B7280',
                          fontWeight: formData.transbordo ? 600 : 400,
                        }}
                      >
                        Transbordo
                      </span>
                    </label>

                    <label 
                      className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all"
                      style={{
                        background: formData.dtd ? '#ECFDF5' : '#F9FAFB',
                        border: formData.dtd ? '2px solid #10B981' : '1px solid #D1D5DB',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formData.dtd}
                        onChange={(e) => setFormData({ ...formData, dtd: e.target.checked })}
                        className="w-4 h-4 rounded cursor-pointer"
                        style={{
                          accentColor: '#10B981',
                        }}
                      />
                      <span 
                        style={{ 
                          fontFamily: "'Exo 2', sans-serif", 
                          fontSize: '12px',
                          color: formData.dtd ? '#059669' : '#6B7280',
                          fontWeight: formData.dtd ? 600 : 400,
                        }}
                      >
                        DTD
                      </span>
                    </label>
                  </div>
                </div>

                {/* Próximos Pasos */}
                <div className="space-y-2 flex-1">
                  <div 
                    className="flex items-center gap-2 px-3 py-2 rounded-lg"
                    style={{
                      background: 'linear-gradient(to right, #FED7AA, #FDBA74)',
                      borderBottom: '2px solid #FB923C',
                    }}
                  >
                    <FileText className="w-5 h-5" style={{ color: '#F97316' }} />
                    <label 
                      style={{ 
                        fontFamily: "'Exo 2', sans-serif", 
                        fontSize: '14px', 
                        fontWeight: 600,
                        color: '#0F172A'
                      }}
                    >
                      Próximos Pasos
                    </label>
                  </div>
                  <textarea
                    value={formData.proximosPasos}
                    onChange={(e) => handleInputChange('proximosPasos', e.target.value)}
                    placeholder="Ej: Enviar cotización formal, programar visita a planta..."
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg focus:outline-none transition-all resize-none"
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      color: '#111827',
                      fontFamily: "'Exo 2', sans-serif",
                      fontSize: '13px',
                      borderRadius: '8px',
                    }}
                    onFocus={(e) => {
                      e.target.style.border = '2px solid #F97316';
                      e.target.style.boxShadow = '0 0 0 3px rgba(249, 115, 22, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.border = '1px solid #CBD5E1';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>
            </div>

            {/* ========== COLUMNA 3: RUTAS Y FINANZAS ========== */}
            <div className="space-y-3 flex flex-col">
              <div 
                className="p-4 rounded-xl space-y-3 flex flex-col shadow-md"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #D2D9E5',
                }}
              >
                {/* Header NIVEL 3 */}
                <div 
                  className="px-3 py-2 rounded-lg"
                  style={{
                    background: 'linear-gradient(to right, #DBEAFE, #BFDBFE)',
                    borderBottom: '2px solid #93C5FD',
                  }}
                >
                  <h3 
                    className="uppercase tracking-wide"
                    style={{ 
                      fontFamily: "'Exo 2', sans-serif", 
                      fontSize: '13px', 
                      fontWeight: 700,
                      color: '#0F172A'
                    }}
                  >
                    NIVEL 3 – RUTAS Y FINANZAS
                  </h3>
                </div>

                {/* Principales Rutas */}
                <div className="space-y-1.5">
                  <div 
                    className="flex items-center gap-2 px-2 py-1 rounded-t-lg"
                    style={{
                      background: 'linear-gradient(to right, #F0F4F8, #E8EDF4)',
                      borderBottom: '1px solid #D2D9E5',
                    }}
                  >
                    <MapPin className="w-4 h-4" style={{ color: '#3B82F6' }} />
                    <label 
                      style={{ 
                        fontFamily: "'Exo 2', sans-serif", 
                        fontSize: '13px', 
                        fontWeight: 600,
                        color: '#0F172A'
                      }}
                    >
                      Principales Rutas
                    </label>
                  </div>
                  <input
                    type="text"
                    value={formData.principalesRutas}
                    onChange={(e) => handleInputChange('principalesRutas', e.target.value)}
                    placeholder="CDMX - Monterrey"
                    className="w-full px-3 py-2 rounded-lg focus:outline-none transition-all"
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      color: '#111827',
                      fontFamily: "'Exo 2', sans-serif",
                      fontSize: '14px',
                      borderRadius: '8px',
                    }}
                    onFocus={(e) => {
                      e.target.style.border = '2px solid #3B82F6';
                      e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.border = '1px solid #CBD5E1';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                {/* Viajes/Mes */}
                <div className="space-y-1.5">
                  <div 
                    className="flex items-center gap-2 px-2 py-1 rounded-t-lg"
                    style={{
                      background: 'linear-gradient(to right, #F0F4F8, #E8EDF4)',
                      borderBottom: '1px solid #D2D9E5',
                    }}
                  >
                    <Truck className="w-4 h-4" style={{ color: '#10B981' }} />
                    <label 
                      style={{ 
                        fontFamily: "'Exo 2', sans-serif", 
                        fontSize: '13px', 
                        fontWeight: 600,
                        color: '#0F172A'
                      }}
                    >
                      Viajes/Mes
                    </label>
                  </div>
                  <input
                    type="text"
                    value={formData.viajesPorMes}
                    onChange={(e) => handleInputChange('viajesPorMes', e.target.value)}
                    placeholder="20"
                    className="w-full px-3 py-2 rounded-lg focus:outline-none transition-all"
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      color: '#111827',
                      fontFamily: "'Exo 2', sans-serif",
                      fontSize: '14px',
                      borderRadius: '8px',
                    }}
                    onFocus={(e) => {
                      e.target.style.border = '2px solid #10B981';
                      e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.border = '1px solid #CBD5E1';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                {/* Tarifa MXN */}
                <div className="space-y-1.5">
                  <div 
                    className="flex items-center gap-2 px-2 py-1 rounded-t-lg"
                    style={{
                      background: 'linear-gradient(to right, #FEF3C7, #FDE68A)',
                      borderBottom: '1px solid #FCD34D',
                    }}
                  >
                    <DollarSign className="w-4 h-4" style={{ color: '#F59E0B' }} />
                    <label 
                      style={{ 
                        fontFamily: "'Exo 2', sans-serif", 
                        fontSize: '13px', 
                        fontWeight: 600,
                        color: '#0F172A'
                      }}
                    >
                      Tarifa MXN
                    </label>
                  </div>
                  <input
                    type="text"
                    value={formData.tarifa}
                    onChange={(e) => handleInputChange('tarifa', e.target.value)}
                    placeholder="$35,000"
                    className="w-full px-3 py-2 rounded-lg focus:outline-none transition-all"
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #FCD34D',
                      color: '#111827',
                      fontFamily: "'Orbitron', monospace",
                      fontSize: '14px',
                      fontWeight: 600,
                      borderRadius: '8px',
                    }}
                    onFocus={(e) => {
                      e.target.style.border = '2px solid #F59E0B';
                      e.target.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.border = '1px solid #FCD34D';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                {/* Proyectado USD */}
                <div className="space-y-1.5">
                  <div 
                    className="flex items-center gap-2 px-2 py-1 rounded-t-lg"
                    style={{
                      background: 'linear-gradient(to right, #D1FAE5, #A7F3D0)',
                      borderBottom: '1px solid #6EE7B7',
                    }}
                  >
                    <TrendingUp className="w-4 h-4" style={{ color: '#10B981' }} />
                    <label 
                      style={{ 
                        fontFamily: "'Exo 2', sans-serif", 
                        fontSize: '13px', 
                        fontWeight: 600,
                        color: '#0F172A'
                      }}
                    >
                      Proyectado Venta Mensual USD
                    </label>
                  </div>
                  <input
                    type="text"
                    value={formData.proyectadoVentaMensual}
                    onChange={(e) => handleInputChange('proyectadoVentaMensual', e.target.value)}
                    placeholder="$35,000 USD"
                    className="w-full px-3 py-2 rounded-lg focus:outline-none transition-all"
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #6EE7B7',
                      color: '#111827',
                      fontFamily: "'Orbitron', monospace",
                      fontSize: '14px',
                      fontWeight: 600,
                      borderRadius: '8px',
                    }}
                    onFocus={(e) => {
                      e.target.style.border = '2px solid #10B981';
                      e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.border = '1px solid #6EE7B7';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                {/* Hitos del Cliente */}
                <div className="space-y-2">
                  <div 
                    className="px-3 py-2 rounded-lg"
                    style={{
                      background: 'linear-gradient(to right, #E9D5FF, #D8B4FE)',
                      borderBottom: '2px solid #C084FC',
                    }}
                  >
                    <h3 
                      className="uppercase tracking-wide"
                      style={{ 
                        fontFamily: "'Exo 2', sans-serif", 
                        fontSize: '13px', 
                        fontWeight: 700,
                        color: '#0F172A'
                      }}
                    >
                      HITOS DEL CLIENTE
                    </h3>
                  </div>

                  {/* Checkboxes de Hitos */}
                  <div className="space-y-2">
                    <label 
                      className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all"
                      style={{
                        background: formData.altaCliente ? '#F3E8FF' : '#F9FAFB',
                        border: formData.altaCliente ? '2px solid #A855F7' : '1px solid #D1D5DB',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formData.altaCliente}
                        onChange={(e) => setFormData({ ...formData, altaCliente: e.target.checked })}
                        className="w-4 h-4 rounded cursor-pointer"
                        style={{
                          accentColor: '#A855F7',
                        }}
                      />
                      <span 
                        style={{ 
                          fontFamily: "'Exo 2', sans-serif", 
                          fontSize: '12px',
                          color: formData.altaCliente ? '#7C3AED' : '#6B7280',
                          fontWeight: formData.altaCliente ? 600 : 400,
                        }}
                      >
                        Alta del cliente
                      </span>
                    </label>

                    <label 
                      className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all"
                      style={{
                        background: formData.generacionSOP ? '#F3E8FF' : '#F9FAFB',
                        border: formData.generacionSOP ? '2px solid #A855F7' : '1px solid #D1D5DB',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formData.generacionSOP}
                        onChange={(e) => setFormData({ ...formData, generacionSOP: e.target.checked })}
                        className="w-4 h-4 rounded cursor-pointer"
                        style={{
                          accentColor: '#A855F7',
                        }}
                      />
                      <span 
                        style={{ 
                          fontFamily: "'Exo 2', sans-serif", 
                          fontSize: '12px',
                          color: formData.generacionSOP ? '#7C3AED' : '#6B7280',
                          fontWeight: formData.generacionSOP ? 600 : 400,
                        }}
                      >
                        Generación de SOP
                      </span>
                    </label>

                    <label 
                      className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all"
                      style={{
                        background: formData.juntaArranque ? '#F3E8FF' : '#F9FAFB',
                        border: formData.juntaArranque ? '2px solid #A855F7' : '1px solid #D1D5DB',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formData.juntaArranque}
                        onChange={(e) => setFormData({ ...formData, juntaArranque: e.target.checked })}
                        className="w-4 h-4 rounded cursor-pointer"
                        style={{
                          accentColor: '#A855F7',
                        }}
                      />
                      <span 
                        style={{ 
                          fontFamily: "'Exo 2', sans-serif", 
                          fontSize: '12px',
                          color: formData.juntaArranque ? '#7C3AED' : '#6B7280',
                          fontWeight: formData.juntaArranque ? 600 : 400,
                        }}
                      >
                        Junta de arranque
                      </span>
                    </label>

                    <label 
                      className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all"
                      style={{
                        background: formData.facturado ? '#F3E8FF' : '#F9FAFB',
                        border: formData.facturado ? '2px solid #A855F7' : '1px solid #D1D5DB',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formData.facturado}
                        onChange={(e) => setFormData({ ...formData, facturado: e.target.checked })}
                        className="w-4 h-4 rounded cursor-pointer"
                        style={{
                          accentColor: '#A855F7',
                        }}
                      />
                      <span 
                        style={{ 
                          fontFamily: "'Exo 2', sans-serif", 
                          fontSize: '12px',
                          color: formData.facturado ? '#7C3AED' : '#6B7280',
                          fontWeight: formData.facturado ? 600 : 400,
                        }}
                      >
                        Facturado
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========== BOTÓN GUARDAR LEAD (PARTE INFERIOR) ========== */}
          <div 
            className="mt-4 flex items-center justify-between px-6 py-4 rounded-xl"
            style={{
              background: 'linear-gradient(to right, #F8FAFC, #F1F5F9)',
              border: '1px solid #CBD5E1',
            }}
          >
            <div className="flex items-center gap-3">
              <User className="w-5 h-5" style={{ color: '#64748B' }} />
              <div>
                <p 
                  style={{ 
                    fontFamily: "'Exo 2', sans-serif", 
                    fontSize: '12px',
                    color: '#64748B',
                    fontWeight: 600,
                  }}
                >
                  Vendedor:
                </p>
                <p 
                  style={{ 
                    fontFamily: "'Exo 2', sans-serif", 
                    fontSize: '14px',
                    color: '#0F172A',
                    fontWeight: 700,
                  }}
                >
                  {formData.vendedor || 'No asignado'}
                </p>
              </div>
            </div>

            <button
              type="submit"
              className="group flex items-center gap-3 px-8 py-3 rounded-lg transition-all"
              style={{
                background: 'linear-gradient(135deg, #1E66F5 0%, #1555D6 100%)',
                border: 'none',
                boxShadow: '0 6px 20px rgba(30, 102, 245, 0.4)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 28px rgba(30, 102, 245, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(30, 102, 245, 0.4)';
              }}
            >
              <Save className="w-5 h-5 text-white group-hover:rotate-12 transition-transform" strokeWidth={2.5} />
              <span 
                className="text-white"
                style={{ 
                  fontFamily: "'Exo 2', sans-serif", 
                  fontSize: '15px',
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                }}
              >
                GUARDAR LEAD
              </span>
            </button>
          </div>
        </form>
      </div>
    </ModuleTemplate>
  );
};
