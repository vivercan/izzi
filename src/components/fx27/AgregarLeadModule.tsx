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

  return (
    <ModuleTemplate 
      title="Agregar Lead" 
      onBack={onBack} 
      headerImage={MODULE_IMAGES.AGREGAR_LEAD}
    >
      <div className="p-3 h-[calc(100vh-160px)] overflow-hidden">
        <form onSubmit={handleSubmit} className="h-full">
          {/* Grid principal: 3 columnas SIN SCROLL */}
          <div className="grid grid-cols-3 gap-2.5 h-full">
            
            {/* ===== COLUMNA 1: EMPRESA + CONTACTO + UBICACIÓN ===== */}
            <div className="space-y-1.5 flex flex-col">
              
              {/* 🏢 Empresa (NIVEL 1) */}
              <div className="p-2 rounded-lg bg-[var(--fx-surface)] border-2 border-green-500/40 shadow-lg shadow-green-500/10">
                <div className="flex items-center gap-1.5 mb-1">
                  <Building2 className="w-4 h-4 text-green-400" />
                  <h3 className="text-green-400" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 700 }}>
                    NIVEL 1 • EMPRESA *
                  </h3>
                </div>
                <input
                  type="text"
                  value={formData.nombreEmpresa}
                  onChange={(e) => handleInputChange('nombreEmpresa', e.target.value)}
                  placeholder="EMPRESA S.A. DE C.V."
                  required
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[rgba(15,23,42,0.9)] border-2 border-[rgba(148,163,184,0.5)] text-white placeholder:text-[var(--fx-muted)] focus:outline-none focus:border-green-400 shadow-inner"
                  style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '15px', fontWeight: 700 }}
                />
              </div>

              {/* 🌐 Página Web */}
              <div className="p-1.5 rounded-lg bg-[var(--fx-surface)] border-2 border-white/10">
                <div className="flex items-center gap-1 mb-0.5">
                  <Globe className="w-3.5 h-3.5 text-blue-400" />
                  <label className="text-blue-300" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 600 }}>
                    Página Web
                  </label>
                </div>
                <input
                  type="text"
                  value={formData.paginaWeb}
                  onChange={(e) => handleInputChange('paginaWeb', e.target.value)}
                  placeholder="www.empresa.com (opcional)"
                  className="w-full px-2 py-1 rounded bg-[rgba(15,23,42,0.9)] border-2 border-[rgba(148,163,184,0.4)] text-white placeholder:text-[var(--fx-muted)] focus:outline-none focus:border-blue-400"
                  style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px' }}
                />
              </div>

              {/* 👤 Contacto */}
              <div className="p-1.5 rounded-lg bg-[var(--fx-surface)] border-2 border-white/10">
                <div className="flex items-center gap-1 mb-0.5">
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  <label className="text-blue-300" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 600 }}>
                    Nombre Contacto
                  </label>
                </div>
                <input
                  type="text"
                  value={formData.nombreContacto}
                  onChange={(e) => handleInputChange('nombreContacto', e.target.value)}
                  placeholder="Juan Pérez"
                  className="w-full px-2 py-1 rounded bg-[rgba(15,23,42,0.9)] border-2 border-[rgba(148,163,184,0.4)] text-white placeholder:text-[var(--fx-muted)] focus:outline-none focus:border-blue-400"
                  style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px' }}
                />
              </div>

              {/* 📱 Teléfono + ✉️ Email (GRID 2 COLUMNAS) */}
              <div className="grid grid-cols-2 gap-1.5">
                <div className="p-1.5 rounded-lg bg-[var(--fx-surface)] border-2 border-white/10">
                  <div className="flex items-center gap-1 mb-0.5">
                    <Phone className="w-3 h-3 text-blue-400" />
                    <label className="text-blue-300" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px', fontWeight: 600 }}>
                      Teléfono
                    </label>
                  </div>
                  <input
                    type="tel"
                    value={formData.telefonoContacto}
                    onChange={(e) => handleInputChange('telefonoContacto', e.target.value)}
                    placeholder="55 1234 5678"
                    className="w-full px-2 py-1 rounded bg-[rgba(15,23,42,0.9)] border-2 border-[rgba(148,163,184,0.4)] text-white placeholder:text-[var(--fx-muted)] focus:outline-none focus:border-blue-400"
                    style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px' }}
                  />
                </div>

                <div className="p-1.5 rounded-lg bg-[var(--fx-surface)] border-2 border-white/10">
                  <div className="flex items-center gap-1 mb-0.5">
                    <Mail className="w-3 h-3 text-blue-400" />
                    <label className="text-blue-300" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px', fontWeight: 600 }}>
                      Email
                    </label>
                  </div>
                  <input
                    type="email"
                    value={formData.correoElectronico}
                    onChange={(e) => handleInputChange('correoElectronico', e.target.value)}
                    placeholder="contacto@empresa.com"
                    className="w-full px-2 py-1 rounded bg-[rgba(15,23,42,0.9)] border-2 border-[rgba(148,163,184,0.4)] text-white placeholder:text-[var(--fx-muted)] focus:outline-none focus:border-blue-400"
                    style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px' }}
                  />
                </div>
              </div>

              {/* 🏭 Tipo de Empresa - SELECT */}
              <div className="p-1.5 rounded-lg bg-[var(--fx-surface)] border-2 border-emerald-500/40">
                <div className="flex items-center gap-1 mb-0.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                  <label className="text-emerald-300" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 600 }}>
                    Tipo de Empresa
                  </label>
                </div>
                <select
                  value={formData.tipoEmpresa}
                  onChange={(e) => handleInputChange('tipoEmpresa', e.target.value)}
                  className="w-full px-2 py-1 rounded bg-[rgba(15,23,42,0.9)] border-2 border-emerald-500/40 text-white focus:outline-none focus:border-emerald-400"
                  style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 600 }}
                >
                  <option value="">Selecciona...</option>
                  {TIPOS_EMPRESA.map(tipo => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
              </div>

              {/* 📍 Ciudad + Estado (GRID 2 COLUMNAS) - NUEVO */}
              <div className="grid grid-cols-2 gap-1.5">
                <div className="p-1.5 rounded-lg bg-[var(--fx-surface)] border-2 border-white/10">
                  <div className="flex items-center gap-1 mb-0.5">
                    <MapPinned className="w-3 h-3 text-cyan-400" />
                    <label className="text-cyan-300" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px', fontWeight: 600 }}>
                      Ciudad
                    </label>
                  </div>
                  <input
                    type="text"
                    value={formData.ciudad}
                    onChange={(e) => handleInputChange('ciudad', e.target.value)}
                    placeholder="Monterrey"
                    className="w-full px-2 py-1 rounded bg-[rgba(15,23,42,0.9)] border-2 border-[rgba(148,163,184,0.4)] text-white placeholder:text-[var(--fx-muted)] focus:outline-none focus:border-cyan-400"
                    style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px' }}
                  />
                </div>

                <div className="p-1.5 rounded-lg bg-[var(--fx-surface)] border-2 border-white/10">
                  <div className="flex items-center gap-1 mb-0.5">
                    <MapPin className="w-3 h-3 text-cyan-400" />
                    <label className="text-cyan-300" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px', fontWeight: 600 }}>
                      Estado
                    </label>
                  </div>
                  <input
                    type="text"
                    value={formData.estado}
                    onChange={(e) => handleInputChange('estado', e.target.value)}
                    placeholder="Nuevo León"
                    className="w-full px-2 py-1 rounded bg-[rgba(15,23,42,0.9)] border-2 border-[rgba(148,163,184,0.4)] text-white placeholder:text-[var(--fx-muted)] focus:outline-none focus:border-cyan-400"
                    style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px' }}
                  />
                </div>
              </div>

              {/* 🎯 Prioridad + 🏢 Tamaño Empresa (GRID 2 COLUMNAS) - NUEVO */}
              <div className="grid grid-cols-2 gap-1.5">
                <div className="p-1.5 rounded-lg bg-[var(--fx-surface)] border-2 border-red-500/30">
                  <div className="flex items-center gap-1 mb-0.5">
                    <AlertCircle className="w-3 h-3 text-red-400" />
                    <label className="text-red-300" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px', fontWeight: 600 }}>
                      Prioridad
                    </label>
                  </div>
                  <select
                    value={formData.prioridad}
                    onChange={(e) => handleInputChange('prioridad', e.target.value)}
                    className="w-full px-2 py-1 rounded bg-[rgba(15,23,42,0.9)] border-2 border-red-500/40 text-white focus:outline-none focus:border-red-400"
                    style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 700 }}
                  >
                    {PRIORIDADES.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="p-1.5 rounded-lg bg-[var(--fx-surface)] border-2 border-white/10">
                  <div className="flex items-center gap-1 mb-0.5">
                    <Users className="w-3 h-3 text-purple-400" />
                    <label className="text-purple-300" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px', fontWeight: 600 }}>
                      Tamaño
                    </label>
                  </div>
                  <select
                    value={formData.tamanoEmpresa}
                    onChange={(e) => handleInputChange('tamanoEmpresa', e.target.value)}
                    className="w-full px-2 py-1 rounded bg-[rgba(15,23,42,0.9)] border-2 border-purple-500/40 text-white focus:outline-none focus:border-purple-400"
                    style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px', fontWeight: 600 }}
                  >
                    <option value="">Selecciona...</option>
                    {TAMANOS_EMPRESA.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 📅 Fecha Estimada de Cierre - NUEVO */}
              <div className="p-1.5 rounded-lg bg-[var(--fx-surface)] border-2 border-yellow-500/30">
                <div className="flex items-center gap-1 mb-0.5">
                  <Calendar className="w-3.5 h-3.5 text-yellow-400" />
                  <label className="text-yellow-300" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 600 }}>
                    Fecha Estimada de Cierre
                  </label>
                </div>
                <input
                  type="date"
                  value={formData.fechaEstimadaCierre}
                  onChange={(e) => handleInputChange('fechaEstimadaCierre', e.target.value)}
                  className="w-full px-2 py-1 rounded bg-[rgba(15,23,42,0.9)] border-2 border-yellow-500/40 text-white focus:outline-none focus:border-yellow-400"
                  style={{ fontFamily: "'Orbitron', monospace", fontSize: '13px', fontWeight: 600 }}
                />
              </div>
            </div>

            {/* ===== COLUMNA 2: SERVICIOS + NOTAS ===== */}
            <div className="space-y-1.5 flex flex-col">
              
              {/* 🚛 Tipo de Servicio */}
              <div className="p-1.5 rounded-lg bg-[var(--fx-surface)] border-2 border-white/10">
                <div className="flex items-center gap-1 mb-1">
                  <Truck className="w-4 h-4 text-blue-400" />
                  <label className="text-blue-300" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', fontWeight: 600 }}>
                    Tipo de Servicio
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {TIPOS_SERVICIO.map(tipo => (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => handleToggleTipoServicio(tipo)}
                      className={`px-2 py-1.5 rounded-lg border-2 transition-all ${
                        formData.tipoServicio?.includes(tipo)
                          ? 'bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/30'
                          : 'bg-[rgba(15,23,42,0.5)] border-[rgba(148,163,184,0.4)] text-[var(--fx-muted)] hover:border-blue-400 hover:shadow'
                      }`}
                      style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 700 }}
                    >
                      {tipo}
                    </button>
                  ))}
                </div>
              </div>

              {/* 🗺️ Tipo de Viaje */}
              <div className="p-1.5 rounded-lg bg-[var(--fx-surface)] border-2 border-white/10">
                <div className="flex items-center gap-1 mb-1">
                  <MapPin className="w-4 h-4 text-green-400" />
                  <label className="text-green-300" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', fontWeight: 600 }}>
                    Tipo de Viaje
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {TIPOS_VIAJE.map(tipo => (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => handleToggleTipoViaje(tipo)}
                      className={`px-2 py-1.5 rounded-lg border-2 transition-all ${
                        formData.tipoViaje?.includes(tipo)
                          ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/30'
                          : 'bg-[rgba(15,23,42,0.5)] border-[rgba(148,163,184,0.4)] text-[var(--fx-muted)] hover:border-green-400 hover:shadow'
                      }`}
                      style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 700 }}
                    >
                      {tipo}
                    </button>
                  ))}
                </div>

                {/* Checkboxes Transbordo y DTD */}
                <div className="grid grid-cols-2 gap-1 mt-1.5">
                  <label className="flex items-center gap-1.5 p-1.5 rounded-lg cursor-pointer hover:bg-green-500/10 transition-colors border-2 border-green-500/20 hover:border-green-500/40">
                    <input
                      type="checkbox"
                      checked={formData.transbordo}
                      onChange={(e) => setFormData({ ...formData, transbordo: e.target.checked })}
                      className="w-3.5 h-3.5 rounded border-2 border-green-500/50 bg-[rgba(15,23,42,0.9)] checked:bg-green-500 checked:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 cursor-pointer"
                    />
                    <span className={`transition-colors ${formData.transbordo ? 'text-green-400 font-semibold' : 'text-[var(--fx-muted)]'}`} style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px' }}>
                      Transbordo
                    </span>
                  </label>

                  <label className="flex items-center gap-1.5 p-1.5 rounded-lg cursor-pointer hover:bg-green-500/10 transition-colors border-2 border-green-500/20 hover:border-green-500/40">
                    <input
                      type="checkbox"
                      checked={formData.dtd}
                      onChange={(e) => setFormData({ ...formData, dtd: e.target.checked })}
                      className="w-3.5 h-3.5 rounded border-2 border-green-500/50 bg-[rgba(15,23,42,0.9)] checked:bg-green-500 checked:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 cursor-pointer"
                    />
                    <span className={`transition-colors ${formData.dtd ? 'text-green-400 font-semibold' : 'text-[var(--fx-muted)]'}`} style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px' }}>
                      DTD
                    </span>
                  </label>
                </div>
              </div>

              {/* 📝 Próximos Pasos */}
              <div className="p-1.5 rounded-lg bg-[var(--fx-surface)] border-2 border-white/10 flex-1">
                <div className="flex items-center gap-1 mb-0.5">
                  <FileText className="w-4 h-4 text-orange-400" />
                  <label className="text-orange-300" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', fontWeight: 600 }}>
                    Próximos Pasos
                  </label>
                </div>
                <textarea
                  value={formData.proximosPasos}
                  onChange={(e) => handleInputChange('proximosPasos', e.target.value)}
                  placeholder="Describe los próximos pasos..."
                  className="w-full h-[calc(100%-32px)] px-2 py-1.5 rounded-lg bg-[rgba(15,23,42,0.9)] border-2 border-[rgba(148,163,184,0.4)] text-white placeholder:text-[var(--fx-muted)] focus:outline-none focus:border-orange-400 resize-none shadow-inner"
                  style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', lineHeight: '1.5' }}
                />
              </div>
            </div>

            {/* ===== COLUMNA 3: RUTAS, FINANZAS E HITOS ===== */}
            <div className="space-y-1.5 flex flex-col">
              
              {/* 💰 NIVEL 3: RUTAS Y FINANZAS */}
              <div className="p-1.5 rounded-lg bg-[var(--fx-surface)] border-2 border-orange-500/40 shadow-lg shadow-orange-500/10">
                <div className="flex items-center gap-1 mb-1">
                  <DollarSign className="w-4 h-4 text-orange-400" />
                  <h3 className="text-orange-300" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', fontWeight: 700 }}>
                    NIVEL 3 • RUTAS Y FINANZAS
                  </h3>
                </div>

                <div className="space-y-1">
                  {/* Principales Rutas */}
                  <input
                    type="text"
                    value={formData.principalesRutas}
                    onChange={(e) => handleInputChange('principalesRutas', e.target.value)}
                    placeholder="CDMX - MTY - GDL"
                    className="w-full px-2 py-1 rounded bg-[rgba(15,23,42,0.9)] border-2 border-[rgba(148,163,184,0.4)] text-white placeholder:text-[var(--fx-muted)] focus:outline-none focus:border-orange-400"
                    style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px' }}
                  />

                  {/* Viajes por Mes */}
                  <input
                    type="number"
                    value={formData.viajesPorMes}
                    onChange={(e) => handleInputChange('viajesPorMes', e.target.value)}
                    placeholder="Viajes/Mes: 15"
                    className="w-full px-2 py-1 rounded bg-[rgba(15,23,42,0.9)] border-2 border-[rgba(148,163,184,0.4)] text-white placeholder:text-[var(--fx-muted)] focus:outline-none focus:border-orange-400"
                    style={{ fontFamily: "'Orbitron', monospace", fontSize: '14px' }}
                  />

                  {/* Tarifa MXN */}
                  <input
                    type="text"
                    value={formData.tarifa}
                    onChange={(e) => handleInputChange('tarifa', e.target.value)}
                    placeholder="Tarifa MXN: $45k - $55k"
                    className="w-full px-2 py-1 rounded bg-[rgba(15,23,42,0.9)] border-2 border-[rgba(148,163,184,0.4)] text-white placeholder:text-[var(--fx-muted)] focus:outline-none focus:border-orange-400"
                    style={{ fontFamily: "'Orbitron', monospace", fontSize: '14px' }}
                  />

                  {/* Proyectado USD */}
                  <input
                    type="text"
                    value={formData.proyectadoVentaMensual}
                    onChange={(e) => handleInputChange('proyectadoVentaMensual', e.target.value)}
                    placeholder="Proyectado USD: $50k - $100k"
                    className="w-full px-2 py-1 rounded bg-[rgba(15,23,42,0.9)] border-2 border-[rgba(148,163,184,0.4)] text-white placeholder:text-[var(--fx-muted)] focus:outline-none focus:border-orange-400"
                    style={{ fontFamily: "'Orbitron', monospace", fontSize: '14px' }}
                  />
                </div>
              </div>

              {/* 🏆 HITOS DEL CLIENTE (NIVELES 4-7) */}
              <div className="p-1.5 rounded-lg bg-[var(--fx-surface)] border-2 border-white/20">
                <div className="flex items-center gap-1 mb-1">
                  <TrendingUp className="w-4 h-4 text-white" />
                  <h3 className="text-white" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', fontWeight: 700 }}>
                    HITOS DEL CLIENTE
                  </h3>
                </div>

                <div className="space-y-1">
                  {/* Nivel 4: Alta de Cliente - CYAN */}
                  <label className="flex items-center gap-2 p-1 rounded-lg cursor-pointer hover:bg-cyan-500/20 transition-colors group border-2 border-cyan-500/20 hover:border-cyan-500/40">
                    <input
                      type="checkbox"
                      checked={formData.altaCliente}
                      onChange={(e) => setFormData({ ...formData, altaCliente: e.target.checked })}
                      className="w-4 h-4 rounded border-2 border-cyan-500/50 bg-[rgba(15,23,42,0.9)] checked:bg-cyan-500 checked:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 cursor-pointer"
                    />
                    <span className={`flex-1 transition-colors ${formData.altaCliente ? 'text-cyan-400 font-semibold' : 'text-[var(--fx-muted)]'}`} style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px' }}>
                      <span className="text-cyan-500 mr-1">●</span> Nivel 4 • Alta de Cliente
                    </span>
                  </label>

                  {/* Nivel 5: Generación SOP - PURPLE */}
                  <label className="flex items-center gap-2 p-1 rounded-lg cursor-pointer hover:bg-purple-500/20 transition-colors group border-2 border-purple-500/20 hover:border-purple-500/40">
                    <input
                      type="checkbox"
                      checked={formData.generacionSOP}
                      onChange={(e) => setFormData({ ...formData, generacionSOP: e.target.checked })}
                      className="w-4 h-4 rounded border-2 border-purple-500/50 bg-[rgba(15,23,42,0.9)] checked:bg-purple-500 checked:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 cursor-pointer"
                    />
                    <span className={`flex-1 transition-colors ${formData.generacionSOP ? 'text-purple-400 font-semibold' : 'text-[var(--fx-muted)]'}`} style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px' }}>
                      <span className="text-purple-500 mr-1">●</span> Nivel 5 • Generación SOP
                    </span>
                  </label>

                  {/* Nivel 6: Junta de Arranque - PINK */}
                  <label className="flex items-center gap-2 p-1 rounded-lg cursor-pointer hover:bg-pink-500/20 transition-colors group border-2 border-pink-500/20 hover:border-pink-500/40">
                    <input
                      type="checkbox"
                      checked={formData.juntaArranque}
                      onChange={(e) => setFormData({ ...formData, juntaArranque: e.target.checked })}
                      className="w-4 h-4 rounded border-2 border-pink-500/50 bg-[rgba(15,23,42,0.9)] checked:bg-pink-500 checked:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 cursor-pointer"
                    />
                    <span className={`flex-1 transition-colors ${formData.juntaArranque ? 'text-pink-400 font-semibold' : 'text-[var(--fx-muted)]'}`} style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px' }}>
                      <span className="text-pink-500 mr-1">●</span> Nivel 6 • Junta de Arranque
                    </span>
                  </label>

                  {/* Nivel 7: Facturado - YELLOW/GOLD */}
                  <label className="flex items-center gap-2 p-1 rounded-lg cursor-pointer hover:bg-yellow-500/20 transition-colors group border-2 border-yellow-500/20 hover:border-yellow-500/40">
                    <input
                      type="checkbox"
                      checked={formData.facturado}
                      onChange={(e) => setFormData({ ...formData, facturado: e.target.checked })}
                      className="w-4 h-4 rounded border-2 border-yellow-500/50 bg-[rgba(15,23,42,0.9)] checked:bg-yellow-500 checked:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 cursor-pointer"
                    />
                    <span className={`flex-1 transition-colors ${formData.facturado ? 'text-yellow-400 font-semibold' : 'text-[var(--fx-muted)]'}`} style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px' }}>
                      <span className="text-yellow-500 mr-1">●</span> Nivel 7 • Facturado
                    </span>
                  </label>
                </div>
              </div>

              {/* Info Vendedor + Botón Guardar */}
              <div className="mt-auto space-y-1.5">
                {/* Info Vendedor */}
                <div className="px-2 py-1.5 rounded-lg bg-[rgba(30,102,245,0.15)] border-2 border-[rgba(30,102,245,0.4)]">
                  <div className="flex items-center justify-between text-white" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px' }}>
                    <span>Vendedor: <span className="font-bold">{formData.vendedor}</span></span>
                    <span className="text-blue-300">{new Date().toLocaleDateString('es-MX')}</span>
                  </div>
                </div>

                {/* Botón Guardar - ULTRA MODERNO */}
                <button
                  type="submit"
                  className="group relative w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-br from-[#1E66F5] via-[#0EA5E9] to-[#06B6D4] hover:from-[#1557dc] hover:via-[#0284c7] hover:to-[#0891b2] text-white transition-all duration-300 shadow-2xl shadow-blue-500/50 hover:shadow-blue-400/60 hover:scale-[1.02] border-2 border-blue-400/30 overflow-hidden"
                  style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '16px', fontWeight: 700, letterSpacing: '0.5px' }}
                >
                  {/* Glassmorphism overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Animated shine effect */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"></div>
                  
                  <Save className="w-5 h-5 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
                  <span className="relative z-10">GUARDAR LEAD</span>
                </button>

                {/* Indicador de Niveles Compacto */}
                <div className="px-2 py-1 rounded-lg bg-[var(--fx-surface)] border-2 border-white/10">
                  <div className="text-[var(--fx-muted)] text-center leading-tight" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px' }}>
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
    </ModuleTemplate>
  );
};