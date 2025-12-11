import { useState, useEffect } from 'react';
import { ArrowLeft, Building2, Globe, User, Phone, Mail, MapPinned, MapPin, Users, Calendar, Truck, DollarSign, TrendingUp, AlertCircle, FileText, Save, ChevronLeft, ChevronRight } from 'lucide-react';
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
  // Niveles 4-7: Hitos del cliente
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

// Get current date in Spanish format
const getCurrentDate = () => {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const now = new Date();
  return `${days[now.getDay()]} ${now.getDate()} de ${months[now.getMonth()]} de ${now.getFullYear()}`;
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
    // Niveles 4-7: Hitos del cliente
    altaCliente: false,
    generacionSOP: false,
    juntaArranque: false,
    facturado: false,
  });

  // Obtener el usuario actual del localStorage
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
      // Formatear nombre: Primera letra mayúscula, resto minúscula
      const formatearNombre = (texto: string) => {
        return texto
          .toLowerCase()
          .split(' ')
          .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
          .join(' ');
      };
      setFormData({ ...formData, [field]: formatearNombre(value) });
    } else if (field === 'correoElectronico') {
      // Correos siempre en minúsculas
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
    
    // If selecting Hazmat, disable DTD
    if (tipo.includes('Hazmat') && !servicios.includes(tipo)) {
      setFormData(prev => ({ ...prev, tipoServicio: nuevosServicios, dtd: false }));
    }
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

    // NIVEL 1: Solo requiere nombre de empresa
    if (!formData.nombreEmpresa) {
      alert('❌ Nivel 1 mínimo: Debes ingresar el Nombre de la Empresa');
      return;
    }

    // VALIDAR DUPLICADOS: Verificar si la empresa ya existe
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
      // Continuar con el guardado si falla la verificación
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
      // Niveles 4-7: Hitos del cliente
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

      // Limpiar formulario
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
        // Niveles 4-7: Hitos del cliente
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

  // Check if Hazmat is selected to disable DTD
  const isHazmatSelected = formData.tipoServicio?.some(s => s.includes('Hazmat'));

  // Format date for display (DD MMM AAAA)
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    const date = new Date(dateStr);
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* BACKGROUND - FX27 STANDARD LIGHTER GRADIENT */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #0056B8 0%, #0B84FF 100%)',
        }}
      />

      {/* HEADER BAR - Clean solid navy */}
      <div className="relative z-10 h-[68px] bg-[#0a0e1a]/95 backdrop-blur-sm border-b border-white/5 flex items-center justify-between px-8">
        {/* Left: Back + Title */}
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/70 hover:text-orange-400 transition-all duration-200 cursor-pointer group"
          >
            <ArrowLeft className="w-7 h-7 stroke-[3] group-hover:scale-110 transition-transform" />
          </button>
          <h1 className="text-white" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '20px', fontWeight: 600, letterSpacing: '0.5px' }}>
            Agregar Lead
          </h1>
        </div>

        {/* Center: Global Date - FX27 STANDARD */}
        <div 
          className="text-white transition-colors duration-200 hover:text-[#F8A83C] cursor-default" 
          style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '16px', fontWeight: 600, letterSpacing: '0.4px' }}
        >
          {getCurrentDate()}
        </div>

        {/* Right: FX27 Logo (+2px) + Slogan (aligned centered) */}
        <div className="flex flex-col items-center mr-2">
          <div className="text-white" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '34px', fontWeight: 800, letterSpacing: '1.8px' }}>
            FX<span className="text-[#1E66F5]">27</span>
          </div>
          <div className="text-slate-400/60" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '9px', fontWeight: 300, letterSpacing: '2.5px', textTransform: 'uppercase', marginTop: '-3px' }}>
            Future Experience 27
          </div>
        </div>
      </div>

      {/* MAIN CONTENT - Balanced columns, scroll if needed */}
      <div className="relative z-10 h-[calc(100vh-68px)] px-7 py-4 overflow-auto">
        <form onSubmit={handleSubmit} className="min-h-full flex flex-col pb-8">
          
          {/* Grid: 3 balanced columns */}
          <div className="grid grid-cols-[1fr_1fr_1fr] gap-5 flex-1 overflow-hidden">
            
            {/* ===== LEFT COLUMN: NIVEL 1 - EMPRESA ===== */}
            <div className="flex flex-col">
              <div 
                className="px-5 py-4 rounded-2xl border shadow-2xl flex flex-col h-full"
                style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  borderColor: 'rgba(71, 130, 196, 0.25)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                }}
              >
                {/* Header */}
                <div className="flex items-center gap-2.5 mb-2.5">
                  <Building2 className="w-5 h-5 text-white/90 stroke-[1.8]" />
                  <h3 className="text-white/90" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '15px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>
                    NIVEL 1 – EMPRESA
                  </h3>
                </div>
                
                {/* Green accent */}
                <div className="h-[1.5px] w-20 bg-gradient-to-r from-emerald-400/60 to-transparent mb-3.5 shadow-sm shadow-emerald-400/20" />
                
                <div className="space-y-2.5 flex-1 overflow-y-auto pr-1">
                  {/* Nombre Empresa */}
                  <div>
                    <label className="block text-[#E5EDF5]/80 mb-1.5" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px', fontWeight: 500, letterSpacing: '0.3px' }}>
                      Nombre de la Empresa *
                    </label>
                    <input
                      type="text"
                      value={formData.nombreEmpresa}
                      onChange={(e) => handleInputChange('nombreEmpresa', e.target.value)}
                      placeholder="EMPRESA S.A. DE C.V."
                      required
                      className="w-full px-3 py-2 rounded-xl border text-white/95 placeholder:text-[#64748b] focus:outline-none focus:shadow-[0_0_0_3px_rgba(30,102,245,0.25)] transition-all"
                      style={{ 
                        fontFamily: "'Exo 2', sans-serif", 
                        fontSize: '13px', 
                        fontWeight: 600,
                        background: 'rgba(45, 65, 95, 0.6)',
                        borderColor: 'rgba(96, 165, 220, 0.5)',
                      }}
                    />
                  </div>

                  {/* Página Web */}
                  <div>
                    <label className="flex items-center gap-1.5 text-[#E5EDF5]/80 mb-1.5" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px', fontWeight: 500, letterSpacing: '0.3px' }}>
                      <Globe className="w-3.5 h-3.5 stroke-[1.8]" />
                      Página Web
                    </label>
                    <input
                      type="text"
                      value={formData.paginaWeb}
                      onChange={(e) => handleInputChange('paginaWeb', e.target.value)}
                      placeholder="www.empresa.com"
                      className="w-full px-3 py-2 rounded-xl border text-white/95 placeholder:text-[#64748b] focus:outline-none focus:shadow-[0_0_0_3px_rgba(30,102,245,0.15)] transition-all"
                      style={{ 
                        fontFamily: "'Exo 2', sans-serif", 
                        fontSize: '13px',
                        background: 'rgba(45, 65, 95, 0.6)',
                        borderColor: 'rgba(96, 165, 220, 0.4)',
                      }}
                    />
                  </div>

                  {/* Nombre Contacto */}
                  <div>
                    <label className="flex items-center gap-1.5 text-[#E5EDF5]/80 mb-1.5" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px', fontWeight: 500, letterSpacing: '0.3px' }}>
                      <User className="w-3.5 h-3.5 stroke-[1.8]" />
                      Nombre Contacto
                    </label>
                    <input
                      type="text"
                      value={formData.nombreContacto}
                      onChange={(e) => handleInputChange('nombreContacto', e.target.value)}
                      placeholder="Juan Pérez"
                      className="w-full px-3 py-2 rounded-xl border text-white/95 placeholder:text-[#64748b] focus:outline-none focus:shadow-[0_0_0_3px_rgba(30,102,245,0.15)] transition-all"
                      style={{ 
                        fontFamily: "'Exo 2', sans-serif", 
                        fontSize: '13px',
                        background: 'rgba(45, 65, 95, 0.6)',
                        borderColor: 'rgba(96, 165, 220, 0.4)',
                      }}
                    />
                  </div>

                  {/* Teléfono + Email */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="flex items-center gap-1 text-[#E5EDF5]/80 mb-1.5" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px', fontWeight: 500, letterSpacing: '0.3px' }}>
                        <Phone className="w-3 h-3 stroke-[1.8]" />
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        value={formData.telefonoContacto}
                        onChange={(e) => handleInputChange('telefonoContacto', e.target.value)}
                        placeholder="55 1234 5678"
                        className="w-full px-2.5 py-2 rounded-xl border text-white/95 placeholder:text-[#64748b] focus:outline-none focus:shadow-[0_0_0_3px_rgba(30,102,245,0.15)] transition-all"
                        style={{ 
                          fontFamily: "'Exo 2', sans-serif", 
                          fontSize: '12px',
                          background: 'rgba(45, 65, 95, 0.6)',
                          borderColor: 'rgba(96, 165, 220, 0.4)',
                        }}
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-1 text-[#E5EDF5]/80 mb-1.5" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px', fontWeight: 500, letterSpacing: '0.3px' }}>
                        <Mail className="w-3 h-3 stroke-[1.8]" />
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.correoElectronico}
                        onChange={(e) => handleInputChange('correoElectronico', e.target.value)}
                        placeholder="contacto@empresa.com"
                        className="w-full px-2.5 py-2 rounded-xl border text-white/95 placeholder:text-[#64748b] focus:outline-none focus:shadow-[0_0_0_3px_rgba(30,102,245,0.15)] transition-all"
                        style={{ 
                          fontFamily: "'Exo 2', sans-serif", 
                          fontSize: '12px',
                          background: 'rgba(45, 65, 95, 0.6)',
                          borderColor: 'rgba(96, 165, 220, 0.4)',
                        }}
                      />
                    </div>
                  </div>

                  {/* Tipo de Empresa */}
                  <div>
                    <label className="flex items-center gap-1.5 text-[#E5EDF5]/80 mb-1.5" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px', fontWeight: 500, letterSpacing: '0.3px' }}>
                      <Building2 className="w-3.5 h-3.5 stroke-[1.8]" />
                      Tipo de Empresa
                    </label>
                    <select
                      value={formData.tipoEmpresa}
                      onChange={(e) => handleInputChange('tipoEmpresa', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border text-white/95 focus:outline-none focus:shadow-[0_0_0_3px_rgba(30,102,245,0.15)] transition-all"
                      style={{ 
                        fontFamily: "'Exo 2', sans-serif", 
                        fontSize: '12px',
                        background: 'rgba(45, 65, 95, 0.6)',
                        borderColor: 'rgba(96, 165, 220, 0.4)',
                      }}
                    >
                      <option value="">Selecciona...</option>
                      {TIPOS_EMPRESA.map(tipo => (
                        <option key={tipo} value={tipo}>{tipo}</option>
                      ))}
                    </select>
                  </div>

                  {/* Ciudad + Estado */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="flex items-center gap-1 text-[#E5EDF5]/80 mb-1.5" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px', fontWeight: 500, letterSpacing: '0.3px' }}>
                        <MapPinned className="w-3 h-3 stroke-[1.8]" />
                        Ciudad
                      </label>
                      <input
                        type="text"
                        value={formData.ciudad}
                        onChange={(e) => handleInputChange('ciudad', e.target.value)}
                        placeholder="Monterrey"
                        className="w-full px-2.5 py-2 rounded-xl border text-white/95 placeholder:text-[#64748b] focus:outline-none focus:shadow-[0_0_0_3px_rgba(30,102,245,0.15)] transition-all"
                        style={{ 
                          fontFamily: "'Exo 2', sans-serif", 
                          fontSize: '12px',
                          background: 'rgba(45, 65, 95, 0.6)',
                          borderColor: 'rgba(96, 165, 220, 0.4)',
                        }}
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-1 text-[#E5EDF5]/80 mb-1.5" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px', fontWeight: 500, letterSpacing: '0.3px' }}>
                        <MapPin className="w-3 h-3 stroke-[1.8]" />
                        Estado
                      </label>
                      <input
                        type="text"
                        value={formData.estado}
                        onChange={(e) => handleInputChange('estado', e.target.value)}
                        placeholder="Nuevo León"
                        className="w-full px-2.5 py-2 rounded-xl border text-white/95 placeholder:text-[#64748b] focus:outline-none focus:shadow-[0_0_0_3px_rgba(30,102,245,0.15)] transition-all"
                        style={{ 
                          fontFamily: "'Exo 2', sans-serif", 
                          fontSize: '12px',
                          background: 'rgba(45, 65, 95, 0.6)',
                          borderColor: 'rgba(96, 165, 220, 0.4)',
                        }}
                      />
                    </div>
                  </div>

                  {/* Prioridad + Tamaño */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="flex items-center gap-1 text-[#E5EDF5]/80 mb-1.5" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px', fontWeight: 500, letterSpacing: '0.3px' }}>
                        <AlertCircle className="w-3 h-3 stroke-[1.8]" />
                        Prioridad
                      </label>
                      <div className="relative">
                        <select
                          value={formData.prioridad}
                          onChange={(e) => handleInputChange('prioridad', e.target.value)}
                          className="w-full px-2.5 py-2 pl-7 rounded-xl border text-white/95 focus:outline-none focus:shadow-[0_0_0_3px_rgba(30,102,245,0.15)] transition-all appearance-none"
                          style={{ 
                            fontFamily: "'Exo 2', sans-serif", 
                            fontSize: '12px',
                            fontWeight: 600,
                            background: 'rgba(45, 65, 95, 0.6)',
                            borderColor: 'rgba(96, 165, 220, 0.4)',
                          }}
                        >
                          {PRIORIDADES.map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full shadow-sm" style={{
                          backgroundColor: formData.prioridad?.includes('Alta') ? '#ef4444' : formData.prioridad?.includes('Media') ? '#eab308' : '#22c55e',
                          boxShadow: `0 0 6px ${formData.prioridad?.includes('Alta') ? '#ef4444' : formData.prioridad?.includes('Media') ? '#eab308' : '#22c55e'}60`
                        }} />
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center gap-1 text-[#E5EDF5]/80 mb-1.5" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px', fontWeight: 500, letterSpacing: '0.3px' }}>
                        <Users className="w-3 h-3 stroke-[1.8]" />
                        Tamaño
                      </label>
                      <select
                        value={formData.tamanoEmpresa}
                        onChange={(e) => handleInputChange('tamanoEmpresa', e.target.value)}
                        className="w-full px-2.5 py-2 rounded-xl border text-white/95 focus:outline-none focus:shadow-[0_0_0_3px_rgba(30,102,245,0.15)] transition-all"
                        style={{ 
                          fontFamily: "'Exo 2', sans-serif", 
                          fontSize: '11px',
                          background: 'rgba(45, 65, 95, 0.6)',
                          borderColor: 'rgba(96, 165, 220, 0.4)',
                        }}
                      >
                        <option value="">Selecciona...</option>
                        {TAMANOS_EMPRESA.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Fecha Estimada - GLASSY PREMIUM + FORMAT DD MMM AAAA */}
                  <div>
                    <label className="flex items-center gap-1.5 text-[#E5EDF5]/80 mb-1.5" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px', fontWeight: 500, letterSpacing: '0.3px' }}>
                      <Calendar className="w-3.5 h-3.5 stroke-[1.8]" />
                      Fecha Estimada de Cierre
                    </label>
                    <input
                      type="date"
                      value={formData.fechaEstimadaCierre}
                      onChange={(e) => handleInputChange('fechaEstimadaCierre', e.target.value)}
                      placeholder="DD MMM AAAA"
                      className="w-full px-3 py-2.5 rounded-xl border text-white/95 focus:outline-none focus:shadow-[0_0_0_4px_rgba(30,102,245,0.3)] transition-all backdrop-blur-xl uppercase"
                      style={{ 
                        fontFamily: "'Exo 2', sans-serif", 
                        fontSize: '14px',
                        fontWeight: 600,
                        background: 'linear-gradient(135deg, rgba(55, 80, 115, 0.7) 0%, rgba(40, 60, 90, 0.8) 100%)',
                        borderColor: 'rgba(96, 165, 220, 0.5)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
                        textTransform: 'uppercase'
                      }}
                    />
                    {formData.fechaEstimadaCierre && (
                      <div className="mt-1 text-xs text-white/60" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                        {formatDateDisplay(formData.fechaEstimadaCierre)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ===== CENTER COLUMN: SERVICIOS + VIAJE + NOTAS ===== */}
            <div className="flex flex-col gap-3.5">
              
              {/* Card Servicios */}
              <div 
                className="px-5 py-4 rounded-2xl border shadow-2xl"
                style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  borderColor: 'rgba(71, 130, 196, 0.25)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                }}
              >
                <div className="space-y-3.5">
                  
                  {/* Tipo de Servicio */}
                  <div>
                    <div className="flex items-center gap-2.5 mb-2.5">
                      <Truck className="w-4.5 h-4.5 text-white/90 stroke-[1.8]" />
                      <label className="text-white/90" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                        Tipo de Servicio
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {TIPOS_SERVICIO.map(tipo => (
                        <button
                          key={tipo}
                          type="button"
                          onClick={() => handleToggleTipoServicio(tipo)}
                          className={`px-3 py-1.5 rounded-full border transition-all duration-200 ${
                            formData.tipoServicio?.includes(tipo)
                              ? 'text-white shadow-lg scale-[1.02]'
                              : 'text-gray-400 hover:border-[#4782c4]/60'
                          }`}
                          style={{ 
                            fontFamily: "'Exo 2', sans-serif", 
                            fontSize: '11px', 
                            fontWeight: 600,
                            background: formData.tipoServicio?.includes(tipo) ? '#3d7ff6' : 'rgba(45, 65, 95, 0.5)',
                            borderColor: formData.tipoServicio?.includes(tipo) ? '#3d7ff6' : 'rgba(96, 165, 220, 0.3)',
                            boxShadow: formData.tipoServicio?.includes(tipo) ? '0 4px 16px rgba(30, 102, 245, 0.4)' : 'none'
                          }}
                        >
                          {tipo}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tipo de Viaje */}
                  <div>
                    <div className="flex items-center gap-2.5 mb-2.5">
                      <MapPin className="w-4.5 h-4.5 text-white/90 stroke-[1.8]" />
                      <label className="text-white/90" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                        Tipo de Viaje
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {TIPOS_VIAJE.map(tipo => (
                        <button
                          key={tipo}
                          type="button"
                          onClick={() => handleToggleTipoViaje(tipo)}
                          className={`px-3 py-1.5 rounded-full border transition-all duration-200 ${
                            formData.tipoViaje?.includes(tipo)
                              ? 'text-white shadow-lg scale-[1.02]'
                              : 'text-gray-400 hover:border-[#4782c4]/60'
                          }`}
                          style={{ 
                            fontFamily: "'Exo 2', sans-serif", 
                            fontSize: '11px', 
                            fontWeight: 600,
                            background: formData.tipoViaje?.includes(tipo) ? '#3d7ff6' : 'rgba(45, 65, 95, 0.5)',
                            borderColor: formData.tipoViaje?.includes(tipo) ? '#3d7ff6' : 'rgba(96, 165, 220, 0.3)',
                            boxShadow: formData.tipoViaje?.includes(tipo) ? '0 4px 16px rgba(30, 102, 245, 0.4)' : 'none'
                          }}
                        >
                          {tipo}
                        </button>
                      ))}
                    </div>

                    {/* Checkboxes */}
                    <div className="grid grid-cols-2 gap-2 mt-2.5">
                      <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-white/5 transition-colors border border-white/5">
                        <input
                          type="checkbox"
                          checked={formData.transbordo}
                          onChange={(e) => setFormData({ ...formData, transbordo: e.target.checked })}
                          className="w-3.5 h-3.5 rounded border-[#60a5dc]/50 bg-[#2d415f]/60 checked:bg-[#3d7ff6] checked:border-[#3d7ff6] focus:outline-none focus:ring-2 focus:ring-[#3d7ff6]/30 cursor-pointer transition-all"
                        />
                        <span className={`transition-colors ${formData.transbordo ? 'text-white font-semibold' : 'text-gray-400'}`} style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px' }}>
                          Transbordo
                        </span>
                      </label>

                      <label className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/5 ${isHazmatSelected ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-white/5'} transition-colors`}>
                        <input
                          type="checkbox"
                          checked={formData.dtd}
                          onChange={(e) => setFormData({ ...formData, dtd: e.target.checked })}
                          disabled={isHazmatSelected}
                          className={`w-3.5 h-3.5 rounded border-[#60a5dc]/50 bg-[#2d415f]/60 checked:bg-[#3d7ff6] checked:border-[#3d7ff6] focus:outline-none focus:ring-2 focus:ring-[#3d7ff6]/30 transition-all ${isHazmatSelected ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                        />
                        <span className={`transition-colors ${formData.dtd && !isHazmatSelected ? 'text-white font-semibold' : 'text-gray-400'}`} style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px' }}>
                          DTD
                        </span>
                      </label>
                    </div>

                    {/* Helper note about Hazmat + DTD */}
                    <div className="mt-2 text-gray-500/80 italic" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px', lineHeight: '1.4' }}>
                      Nota: combinaciones con Hazmat no están disponibles en servicio DTD.
                    </div>
                  </div>
                </div>
              </div>

              {/* Próximos Pasos - REDUCED HEIGHT (50-60%) */}
              <div 
                className="px-5 py-4 rounded-2xl border shadow-2xl flex flex-col"
                style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  borderColor: 'rgba(71, 130, 196, 0.25)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                }}
              >
                <div className="flex items-center gap-2.5 mb-2.5">
                  <FileText className="w-4.5 h-4.5 text-white/90 stroke-[1.8]" />
                  <label className="text-white/90" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                    Próximos Pasos
                  </label>
                </div>
                <textarea
                  value={formData.proximosPasos}
                  onChange={(e) => handleInputChange('proximosPasos', e.target.value)}
                  placeholder="Describe los próximos pasos con el cliente..."
                  className="w-full px-3 py-2.5 rounded-xl border text-white/95 placeholder:text-[#64748b] focus:outline-none focus:shadow-[0_0_0_3px_rgba(30,102,245,0.2)] resize-none transition-all"
                  style={{ 
                    fontFamily: "'Exo 2', sans-serif", 
                    fontSize: '13px', 
                    lineHeight: '1.5',
                    height: '100px',
                    background: 'rgba(45, 65, 95, 0.6)',
                    borderColor: 'rgba(96, 165, 220, 0.4)',
                  }}
                />
              </div>
            </div>

            {/* ===== RIGHT COLUMN: RUTAS, FINANZAS, HITOS ===== */}
            <div className="flex flex-col gap-3.5">
              
              {/* NIVEL 3: RUTAS Y FINANZAS */}
              <div 
                className="px-5 py-4 rounded-2xl border shadow-2xl"
                style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  borderColor: 'rgba(71, 130, 196, 0.25)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                }}
              >
                <div className="flex items-center gap-2.5 mb-2.5">
                  <DollarSign className="w-5 h-5 text-white/90 stroke-[1.8]" />
                  <h3 className="text-white/90" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '15px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>
                    NIVEL 3 – RUTAS Y FINANZAS
                  </h3>
                </div>
                
                {/* Amber accent */}
                <div className="h-[1.5px] w-20 bg-gradient-to-r from-amber-400/60 to-transparent mb-3.5 shadow-sm shadow-amber-400/20" />

                <div className="space-y-2">
                  {/* Principales Rutas */}
                  <div>
                    <label className="text-[#E5EDF5]/80 mb-1.5 block" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                      Principales Rutas
                    </label>
                    <input
                      type="text"
                      value={formData.principalesRutas}
                      onChange={(e) => handleInputChange('principalesRutas', e.target.value)}
                      placeholder="CDMX – MTY – GDL"
                      className="w-full px-3 py-2 rounded-full border text-white/95 placeholder:text-[#64748b] focus:outline-none focus:shadow-[0_0_0_3px_rgba(30,102,245,0.2)] transition-all shadow-inner"
                      style={{ 
                        fontFamily: "'Exo 2', sans-serif", 
                        fontSize: '13px', 
                        fontWeight: 600,
                        background: 'rgba(45, 65, 95, 0.6)',
                        borderColor: 'rgba(96, 165, 220, 0.35)',
                      }}
                    />
                  </div>

                  {/* KPI: Viajes/Mes - NO SPINNERS */}
                  <div className="px-3 py-2 rounded-xl border" style={{ background: 'rgba(45, 65, 95, 0.5)', borderColor: 'rgba(96, 165, 220, 0.25)' }}>
                    <div className="text-[#E5EDF5]/70 mb-0.5" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.7px' }}>
                      Viajes/Mes
                    </div>
                    <input
                      type="number"
                      value={formData.viajesPorMes}
                      onChange={(e) => handleInputChange('viajesPorMes', e.target.value)}
                      placeholder="15"
                      className="w-full bg-transparent border-none text-white/95 focus:outline-none placeholder:text-gray-700 [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                      style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '20px', fontWeight: 700 }}
                    />
                  </div>

                  {/* KPI: Tarifa MXN - EMPHASIZED NUMBERS */}
                  <div className="px-3 py-2 rounded-xl border" style={{ background: 'rgba(45, 65, 95, 0.5)', borderColor: 'rgba(96, 165, 220, 0.25)' }}>
                    <div className="text-[#E5EDF5]/70 mb-0.5" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.7px' }}>
                      Tarifa MXN
                    </div>
                    <input
                      type="text"
                      value={formData.tarifa}
                      onChange={(e) => handleInputChange('tarifa', e.target.value)}
                      placeholder="$45k – $55k"
                      className="w-full bg-transparent border-none text-white/95 focus:outline-none placeholder:text-gray-700"
                      style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '20px', fontWeight: 700 }}
                    />
                  </div>

                  {/* KPI: Proyectado USD - AMBER ACCENT ON LABEL ONLY */}
                  <div className="px-3 py-2 rounded-xl border" style={{ background: 'rgba(45, 65, 95, 0.5)', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
                    <div className="text-amber-400/80 mb-0.5" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.7px' }}>
                      Proyectado USD
                    </div>
                    <input
                      type="text"
                      value={formData.proyectadoVentaMensual}
                      onChange={(e) => handleInputChange('proyectadoVentaMensual', e.target.value)}
                      placeholder="$50k – $100k"
                      className="w-full bg-transparent border-none text-white/95 focus:outline-none placeholder:text-gray-700"
                      style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '20px', fontWeight: 700 }}
                    />
                  </div>
                </div>
              </div>

              {/* HITOS DEL CLIENTE - MORE VERTICAL SPACING */}
              <div 
                className="px-5 py-4 rounded-2xl border shadow-2xl flex-1"
                style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  borderColor: 'rgba(71, 130, 196, 0.25)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                }}
              >
                <div className="flex items-center gap-2.5 mb-3.5">
                  <TrendingUp className="w-4.5 h-4.5 text-white/90 stroke-[1.8]" />
                  <h3 className="text-white/90" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                    Hitos del Cliente
                  </h3>
                </div>

                {/* Vertical timeline - MORE SPACING */}
                <div className="relative pl-5 space-y-3.5">
                  <div className="absolute left-2 top-1 bottom-1 w-[1.5px] bg-gradient-to-b from-cyan-500/30 via-purple-500/30 via-pink-500/30 to-yellow-500/30" />

                  {/* Nivel 4 */}
                  <label className="flex items-start gap-2.5 cursor-pointer group">
                    <div className="relative flex-shrink-0">
                      <div className={`w-3 h-3 rounded-full border-2 transition-all ${formData.altaCliente ? 'bg-cyan-400 border-cyan-400 shadow-lg shadow-cyan-400/60' : 'bg-[#2d415f] border-cyan-500/50'}`} />
                    </div>
                    <div className="flex-1">
                      <input
                        type="checkbox"
                        checked={formData.altaCliente}
                        onChange={(e) => setFormData({ ...formData, altaCliente: e.target.checked })}
                        className="hidden"
                      />
                      <span className={`transition-colors ${formData.altaCliente ? 'text-cyan-300 font-semibold' : 'text-gray-400'}`} style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px' }}>
                        Nivel 4 • Alta de Cliente
                      </span>
                    </div>
                  </label>

                  {/* Nivel 5 */}
                  <label className="flex items-start gap-2.5 cursor-pointer group">
                    <div className="relative flex-shrink-0">
                      <div className={`w-3 h-3 rounded-full border-2 transition-all ${formData.generacionSOP ? 'bg-purple-400 border-purple-400 shadow-lg shadow-purple-400/60' : 'bg-[#2d415f] border-purple-500/50'}`} />
                    </div>
                    <div className="flex-1">
                      <input
                        type="checkbox"
                        checked={formData.generacionSOP}
                        onChange={(e) => setFormData({ ...formData, generacionSOP: e.target.checked })}
                        className="hidden"
                      />
                      <span className={`transition-colors ${formData.generacionSOP ? 'text-purple-300 font-semibold' : 'text-gray-400'}`} style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px' }}>
                        Nivel 5 • Generación SOP
                      </span>
                    </div>
                  </label>

                  {/* Nivel 6 */}
                  <label className="flex items-start gap-2.5 cursor-pointer group">
                    <div className="relative flex-shrink-0">
                      <div className={`w-3 h-3 rounded-full border-2 transition-all ${formData.juntaArranque ? 'bg-pink-400 border-pink-400 shadow-lg shadow-pink-400/60' : 'bg-[#2d415f] border-pink-500/50'}`} />
                    </div>
                    <div className="flex-1">
                      <input
                        type="checkbox"
                        checked={formData.juntaArranque}
                        onChange={(e) => setFormData({ ...formData, juntaArranque: e.target.checked })}
                        className="hidden"
                      />
                      <span className={`transition-colors ${formData.juntaArranque ? 'text-pink-300 font-semibold' : 'text-gray-400'}`} style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px' }}>
                        Nivel 6 • Junta de Arranque
                      </span>
                    </div>
                  </label>

                  {/* Nivel 7 */}
                  <label className="flex items-start gap-2.5 cursor-pointer group">
                    <div className="relative flex-shrink-0">
                      <div className={`w-3 h-3 rounded-full border-2 transition-all ${formData.facturado ? 'bg-yellow-400 border-yellow-400 shadow-lg shadow-yellow-400/60' : 'bg-[#2d415f] border-yellow-500/50'}`} />
                    </div>
                    <div className="flex-1">
                      <input
                        type="checkbox"
                        checked={formData.facturado}
                        onChange={(e) => setFormData({ ...formData, facturado: e.target.checked })}
                        className="hidden"
                      />
                      <span className={`transition-colors ${formData.facturado ? 'text-yellow-300 font-semibold' : 'text-gray-400'}`} style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px' }}>
                        Nivel 7 • Facturado
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* VENDOR BAR + BUTTON - FX27 GRADIENT */}
              <div className="space-y-2">
                {/* Vendor bar - FX27 GRADIENT BAR */}
                <div 
                  className="px-4 py-2.5 rounded-xl"
                  style={{
                    background: 'linear-gradient(90deg, rgba(30, 102, 245, 0.3) 0%, rgba(14, 165, 233, 0.3) 100%)',
                    borderColor: 'rgba(30, 102, 245, 0.4)',
                    border: '1px solid'
                  }}
                >
                  <span className="text-white" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 600 }}>
                    Vendedor: <span className="font-semibold">{formData.vendedor}</span>
                  </span>
                </div>

                {/* Button GUARDAR LEAD - REDUCED HEIGHT, SAME GRADIENT (20% lighter) */}
                <button
                  type="submit"
                  className="group w-full flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-xl text-white transition-all duration-300 hover:scale-[1.02]"
                  style={{
                    background: 'linear-gradient(90deg, #3d7ff6 0%, #3975e8 50%, #32b4f0 100%)',
                    boxShadow: '0 8px 24px rgba(61, 127, 246, 0.6)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(90deg, #3975e8 0%, #32b4f0 50%, #22c5e0 100%)';
                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(61, 127, 246, 0.8)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(90deg, #3d7ff6 0%, #3975e8 50%, #32b4f0 100%)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(61, 127, 246, 0.6)';
                  }}
                >
                  <Save className="w-5 h-5 stroke-[2.5] group-hover:scale-110 transition-transform" />
                  <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', fontWeight: 700, letterSpacing: '1px' }}>
                    GUARDAR LEAD
                  </span>
                </button>
              </div>
            </div>

          </div>

          {/* FOOTER STEPPER - LOWER HEIGHT, LARGER TEXT (+2px) */}
          <div 
            className="flex items-center justify-center gap-2.5 mt-3.5 px-5 py-2 rounded-full mx-auto"
            style={{
              background: 'rgba(10, 14, 26, 0.9)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(71, 130, 196, 0.2)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)'
            }}
          >
            {[
              { label: 'N1Empresa', active: true },
              { label: 'N2Contacto', active: false },
              { label: 'N3Rutas', active: false },
              { label: 'N4Alta', active: false },
              { label: 'N5SOP', active: false },
              { label: 'N6Junta', active: false },
              { label: 'N7Facturado', active: false }
            ].map((step) => (
              <div
                key={step.label}
                className={`px-3.5 py-1.5 rounded-full transition-all duration-200 ${
                  step.active
                    ? 'text-white'
                    : 'text-gray-400 border'
                }`}
                style={{ 
                  fontFamily: "'Exo 2', sans-serif", 
                  fontSize: '12px', 
                  fontWeight: 600, 
                  letterSpacing: '0.4px',
                  background: step.active ? '#1E66F5' : 'transparent',
                  borderColor: step.active ? 'transparent' : 'rgba(71, 130, 196, 0.15)',
                  boxShadow: step.active ? '0 4px 12px rgba(30, 102, 245, 0.5)' : 'none'
                }}
              >
                {step.label}
              </div>
            ))}
          </div>
        </form>
      </div>
    </div>
  );
};
