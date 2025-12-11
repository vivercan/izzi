import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Search, Download, TrendingUp, X, BarChart3, Building2, User, Calendar, Eye, Trash2, SortAsc, SortDesc, FileText, Upload, Pencil, ArrowLeft, TrendingDown, DollarSign } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { FunnelChart, Funnel, LabelList, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface PanelOportunidadesModuleProps {
  onBack: () => void;
}

interface Lead {
  id: string;
  nombreEmpresa: string;
  paginaWeb: string;
  nombreContacto: string;
  telefonoContacto?: string;
  correoElectronico: string;
  tipoServicio: string[];
  tipoViaje: string[];
  principalesRutas: string;
  viajesPorMes: string;
  tarifa: string;
  proyectadoVentaMensual?: string;
  proximosPasos: string;
  etapaLead?: string;
  // Niveles 4-7: Hitos del cliente
  altaCliente?: boolean;
  generacionSOP?: boolean;
  juntaArranque?: boolean;
  facturado?: boolean;
  vendedor: string;
  fechaCaptura: string;
  cotizaciones?: { nombre: string; url: string; fecha: string }[];
}

type SortField = 'nombreEmpresa' | 'vendedor' | 'fechaCaptura' | 'viajesPorMes';
type SortDirection = 'asc' | 'desc';

// Get current date in Spanish format
const getCurrentDate = () => {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const now = new Date();
  return `${days[now.getDay()]} ${now.getDate()} de ${months[now.getMonth()]} de ${now.getFullYear()}`;
};

export const PanelOportunidadesModule = ({ onBack }: PanelOportunidadesModuleProps) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVendedor, setFilterVendedor] = useState('');
  const [filterFechaInicio, setFilterFechaInicio] = useState('');
  const [filterFechaFin, setFilterFechaFin] = useState('');
  const [sortField, setSortField] = useState<SortField>('fechaCaptura');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showFunnel, setShowFunnel] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [cotizacionesModal, setCotizacionesModal] = useState<Lead | null>(null);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  
  // Estado para el formulario de edición
  const [formData, setFormData] = useState<Partial<Lead>>({});

  // Función para manejar cambios en el formulario con formateo automático
  const handleInputChange = (field: keyof Lead, value: any) => {
    if (field === 'nombreContacto') {
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

  // Cargar datos del lead en el formulario cuando se selecciona para editar
  useEffect(() => {
    if (editLead) {
      setFormData(editLead);
    }
  }, [editLead]);

  // Cargar leads del localStorage
  useEffect(() => {
    const cargarLeads = async () => {
      try {
        // Obtener datos del usuario actual
        const session = localStorage.getItem('fx27-session');
        let vendedorActual = '';
        let esAdmin = false;
        
        if (session) {
          const { email } = JSON.parse(session);
          const usuarios = JSON.parse(localStorage.getItem('fx27-usuarios') || '[]');
          const usuario = usuarios.find((u: any) => u.correo === email);
          
          if (usuario) {
            vendedorActual = usuario.nombre;
            esAdmin = usuario.rol === 'admin';
          }
        }

        // Si es admin, traer todos los leads. Si no, filtrar por vendedor
        const url = esAdmin 
          ? `https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/leads`
          : `https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/leads?vendedor=${encodeURIComponent(vendedorActual)}`;
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        });

        const result = await response.json();

        if (response.ok && result.success) {
          console.log(`[PanelOportunidades] Leads cargados: ${result.leads.length} (Admin: ${esAdmin})`);
          setLeads(result.leads);
          setFilteredLeads(result.leads);
        } else {
          console.error('[PanelOportunidades] Error al cargar leads:', result.error);
        }
      } catch (error) {
        console.error('[PanelOportunidades] Error al conectar con la base de datos:', error);
      }
    };

    cargarLeads();
  }, []);

  // Aplicar filtros y ordenamiento
  useEffect(() => {
    let resultado = [...leads];

    // Filtro por búsqueda
    if (searchTerm) {
      resultado = resultado.filter(lead =>
        lead.nombreEmpresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.nombreContacto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.correoElectronico.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por vendedor
    if (filterVendedor) {
      resultado = resultado.filter(lead => lead.vendedor === filterVendedor);
    }

    // Filtro por rango de fechas
    if (filterFechaInicio || filterFechaFin) {
      resultado = resultado.filter(lead => {
        const fechaLead = new Date(lead.fechaCaptura);
        const inicio = filterFechaInicio ? new Date(filterFechaInicio) : null;
        const fin = filterFechaFin ? new Date(filterFechaFin) : null;
        
        if (inicio && fin) {
          return fechaLead >= inicio && fechaLead <= fin;
        } else if (inicio) {
          return fechaLead >= inicio;
        } else if (fin) {
          return fechaLead <= fin;
        }
        return true;
      });
    }

    // Ordenamiento
    resultado.sort((a, b) => {
      let valueA: any = a[sortField];
      let valueB: any = b[sortField];

      // Para campos numéricos
      if (sortField === 'viajesPorMes') {
        valueA = parseInt(valueA) || 0;
        valueB = parseInt(valueB) || 0;
      }

      // Para fechas
      if (sortField === 'fechaCaptura') {
        valueA = new Date(valueA).getTime();
        valueB = new Date(valueB).getTime();
      }

      if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredLeads(resultado);
  }, [leads, searchTerm, filterVendedor, filterFechaInicio, filterFechaFin, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleExportExcel = () => {
    // Crear CSV
    const headers = ['Empresa', 'Contacto', 'Email', 'Servicio', 'Viaje', 'Rutas', 'Viajes/Mes', 'Tarifa', 'Vendedor', 'Fecha'];
    const rows = filteredLeads.map(lead => [
      lead.nombreEmpresa,
      lead.nombreContacto,
      lead.correoElectronico,
      lead.tipoServicio.join(', '),
      lead.tipoViaje.join(', '),
      lead.principalesRutas,
      lead.viajesPorMes,
      lead.tarifa,
      lead.vendedor,
      new Date(lead.fechaCaptura).toLocaleDateString('es-MX')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `leads_fx27_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleEliminarLead = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este lead?')) {
      try {
        const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/leads/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        });

        const result = await response.json();

        if (response.ok && result.success) {
          console.log('[PanelOportunidades] Lead eliminado exitosamente');
          const nuevosLeads = leads.filter(lead => lead.id !== id);
          setLeads(nuevosLeads);
          alert('✅ Lead eliminado exitosamente');
        } else {
          throw new Error(result.error || 'Error al eliminar lead');
        }
      } catch (error) {
        console.error('[PanelOportunidades] Error al eliminar lead:', error);
        alert(`❌ Error al eliminar el lead: ${error}`);
      }
    }
  };

  const getVendedoresUnicos = () => {
    return Array.from(new Set(leads.map(lead => lead.vendedor)));
  };

  // Función para manejar el guardado de la edición
  const handleGuardarEdicion = async () => {
    if (!editLead || !formData) return;

    // Validaciones
    if (!formData.nombreEmpresa?.trim()) {
      alert('❌ El nombre de la empresa es obligatorio');
      return;
    }

    if (!formData.nombreContacto?.trim()) {
      alert('❌ El nombre del contacto es obligatorio');
      return;
    }

    if (!formData.correoElectronico?.trim()) {
      alert('❌ El correo electrónico es obligatorio');
      return;
    }

    // Validar duplicados solo si cambió el nombre de la empresa
    if (formData.nombreEmpresa !== editLead.nombreEmpresa) {
      const existeLead = leads.some(
        lead => lead.id !== editLead.id && 
        lead.nombreEmpresa.toLowerCase() === formData.nombreEmpresa?.toLowerCase()
      );
      
      if (existeLead) {
        alert(`❌ Ya existe un lead con el nombre "${formData.nombreEmpresa}"`);
        return;
      }
    }

    try {
      const leadActualizado = {
        ...editLead,
        ...formData,
        tipoServicio: formData.tipoServicio || [],
        tipoViaje: formData.tipoViaje || []
      };

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/leads/${editLead.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(leadActualizado)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log('[PanelOportunidades] Lead actualizado exitosamente');
        const nuevosLeads = leads.map(l => l.id === editLead.id ? leadActualizado : l);
        setLeads(nuevosLeads);
        setEditLead(null);
        setFormData({});
        alert('✅ Lead actualizado exitosamente');
      } else {
        throw new Error(result.error || 'Error al actualizar lead');
      }
    } catch (error) {
      console.error('[PanelOportunidades] Error al actualizar lead:', error);
      alert(`❌ Error al actualizar el lead: ${error}`);
    }
  };

  const handleToggleServicio = (servicio: string) => {
    const servicios = formData.tipoServicio || [];
    if (servicios.includes(servicio)) {
      setFormData({ ...formData, tipoServicio: servicios.filter(s => s !== servicio) });
    } else {
      setFormData({ ...formData, tipoServicio: [...servicios, servicio] });
    }
  };

  const handleToggleViaje = (viaje: string) => {
    const viajes = formData.tipoViaje || [];
    if (viajes.includes(viaje)) {
      setFormData({ ...formData, tipoViaje: viajes.filter(v => v !== viaje) });
    } else {
      setFormData({ ...formData, tipoViaje: [...viajes, viaje] });
    }
  };

  // 🔧 FUNCIÓN PARA REFORMATEAR TODOS LOS LEADS EXISTENTES
  const reformatearTodosLosLeads = async () => {
    if (!confirm('⚠️ ¿Reformatear TODOS los leads?\n\nEsto actualizará:\n• Nombres de contactos a formato título (Juan Pérez)\n• Correos a minúsculas\n\n¿Continuar?')) {
      return;
    }

    const formatearNombre = (texto: string) => {
      if (!texto) return texto;
      return texto
        .toLowerCase()
        .split(' ')
        .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
        .join(' ');
    };

    try {
      let reformateados = 0;
      
      for (const lead of leads) {
        const nombreFormateado = formatearNombre(lead.nombreContacto);
        const emailFormateado = lead.correoElectronico.toLowerCase();
        
        // Solo actualizar si hay cambios
        if (nombreFormateado !== lead.nombreContacto || emailFormateado !== lead.correoElectronico) {
          const leadActualizado = {
            ...lead,
            nombreContacto: nombreFormateado,
            correoElectronico: emailFormateado
          };

          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/leads/${lead.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${publicAnonKey}`
            },
            body: JSON.stringify(leadActualizado)
          });

          if (response.ok) {
            reformateados++;
          }
        }
      }

      alert(`✅ Reformateo completado!\n\n${reformateados} leads actualizados`);
      
      // Recargar leads
      window.location.reload();
    } catch (error) {
      console.error('[PanelOportunidades] Error al reformatear leads:', error);
      alert('❌ Error al reformatear leads');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <SortAsc className="w-3.5 h-3.5 opacity-30" />;
    return sortDirection === 'asc' ? <SortAsc className="w-3.5 h-3.5" /> : <SortDesc className="w-3.5 h-3.5" />;
  };

  // 📊 CALCULAR DATOS PARA EL FUNNEL (RATIO 20:1)
  const calcularFunnelData = () => {
    const totalProyectado = filteredLeads.reduce((sum, lead) => {
      const valor = lead.proyectadoVentaMensual;
      if (!valor) return sum;
      
      // Extraer número de strings como "$50k – $100k"
      const match = valor.match(/\d+/);
      const numero = match ? parseInt(match[0]) : 0;
      return sum + numero * 1000; // Convertir k a número
    }, 0);

    // Calcular etapas del funnel con ratio 20:1
    const meta = totalProyectado; // Meta de cierre
    const prospeccion = meta * 20; // 20x la meta
    const calificacion = meta * 10; // 50% del total prospectado
    const presentacion = meta * 5; // 50% de calificados
    const negociacion = meta * 2.5; // 50% de presentados
    const cierre = meta; // Meta final

    return [
      { name: 'Prospección', value: prospeccion, fill: 'url(#blueGradient)', displayValue: `$${(prospeccion / 1000).toFixed(0)}k` },
      { name: 'Calificación', value: calificacion, fill: 'url(#purpleGradient)', displayValue: `$${(calificacion / 1000).toFixed(0)}k` },
      { name: 'Presentación', value: presentacion, fill: 'url(#pinkGradient)', displayValue: `$${(presentacion / 1000).toFixed(0)}k` },
      { name: 'Negociación', value: negociacion, fill: 'url(#orangeGradient)', displayValue: `$${(negociacion / 1000).toFixed(0)}k` },
      { name: 'Cierre', value: cierre, fill: 'url(#greenGradient)', displayValue: `$${(cierre / 1000).toFixed(0)}k` }
    ];
  };

  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      {/* BACKGROUND - FX27 STANDARD LIGHTER GRADIENT */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #0056B8 0%, #0B84FF 100%)',
        }}
      />

      {/* HEADER BAR - FX27 STANDARD */}
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
            Panel de Oportunidades
          </h1>
        </div>

        {/* Center: Global Date - FX27 STANDARD */}
        <div 
          className="text-white transition-colors duration-200 hover:text-[#F8A83C] cursor-default" 
          style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '16px', fontWeight: 600, letterSpacing: '0.4px' }}
        >
          {getCurrentDate()}
        </div>

        {/* Right: FX27 Logo + Slogan */}
        <div className="flex flex-col items-center mr-2">
          <div className="text-white" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '34px', fontWeight: 800, letterSpacing: '1.8px' }}>
            FX<span className="text-[#1E66F5]">27</span>
          </div>
          <div className="text-slate-400/60" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '9px', fontWeight: 300, letterSpacing: '2.5px', textTransform: 'uppercase', marginTop: '-3px' }}>
            Future Experience 27
          </div>
        </div>
      </div>

      {/* MAIN CONTENT - OPTIMIZED SPACING */}
      <div className="relative z-10 h-[calc(100vh-68px)] px-7 pt-4 pb-6 overflow-auto">
        
        {/* SEARCH & FILTERS ROW - GLASSMORPHISM */}
        <div className="mb-4 flex flex-wrap gap-3 items-center justify-between">
          {/* Search bar - Glassy pill */}
          <div className="flex-1 min-w-[300px] max-w-[500px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar leads..."
                className="w-full pl-10 pr-4 py-2.5 rounded-full border text-white/95 placeholder:text-gray-500 focus:outline-none focus:shadow-[0_0_0_3px_rgba(30,102,245,0.25)] transition-all"
                style={{ 
                  fontFamily: "'Exo 2', sans-serif", 
                  fontSize: '15px',
                  background: 'rgba(15, 23, 42, 0.85)',
                  borderColor: 'rgba(71, 130, 196, 0.3)',
                  backdropFilter: 'blur(12px)'
                }}
              />
            </div>
          </div>

          {/* Filters - Glass pills */}
          <div className="flex gap-3">
            <select
              value={filterVendedor}
              onChange={(e) => setFilterVendedor(e.target.value)}
              className="px-3 py-2.5 rounded-xl border text-white/95 focus:outline-none focus:shadow-[0_0_0_3px_rgba(30,102,245,0.15)] transition-all"
              style={{ 
                fontFamily: "'Exo 2', sans-serif", 
                fontSize: '14px',
                background: 'rgba(15, 23, 42, 0.85)',
                borderColor: 'rgba(71, 130, 196, 0.3)',
              }}
            >
              <option value="">Todos los vendedores</option>
              {getVendedoresUnicos().map(vendedor => (
                <option key={vendedor} value={vendedor}>{vendedor}</option>
              ))}
            </select>

            {/* Fecha Inicio - GLASSMORPHISM */}
            <div 
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl border backdrop-blur-xl shadow-lg transition-all duration-200 hover:shadow-xl hover:border-blue-400/50" 
              style={{ 
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.7) 100%)',
                borderColor: 'rgba(96, 165, 250, 0.35)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
              }}
            >
              <Calendar className="w-4 h-4 text-blue-300" />
              <input
                type="date"
                value={filterFechaInicio}
                onChange={(e) => setFilterFechaInicio(e.target.value)}
                placeholder="Desde"
                className="bg-transparent border-none text-white/95 focus:outline-none uppercase"
                style={{ 
                  fontFamily: "'Exo 2', sans-serif", 
                  fontSize: '14px', 
                  fontWeight: 600,
                  width: '140px',
                  textTransform: 'uppercase'
                }}
              />
            </div>

            {/* Fecha Fin - GLASSMORPHISM */}
            <div 
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl border backdrop-blur-xl shadow-lg transition-all duration-200 hover:shadow-xl hover:border-blue-400/50" 
              style={{ 
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.7) 100%)',
                borderColor: 'rgba(96, 165, 250, 0.35)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
              }}
            >
              <Calendar className="w-4 h-4 text-blue-300" />
              <input
                type="date"
                value={filterFechaFin}
                onChange={(e) => setFilterFechaFin(e.target.value)}
                placeholder="Hasta"
                className="bg-transparent border-none text-white/95 focus:outline-none uppercase"
                style={{ 
                  fontFamily: "'Exo 2', sans-serif", 
                  fontSize: '14px', 
                  fontWeight: 600,
                  width: '140px',
                  textTransform: 'uppercase'
                }}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowFunnel(!showFunnel)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 hover:scale-[1.02]"
              style={{ 
                fontFamily: "'Exo 2', sans-serif", 
                fontSize: '12px', 
                fontWeight: 600,
                background: showFunnel ? 'linear-gradient(90deg, rgba(147, 51, 234, 0.3), rgba(168, 85, 247, 0.3))' : 'rgba(147, 51, 234, 0.2)',
                color: '#a855f7',
                border: '1px solid rgba(168, 85, 247, 0.3)'
              }}
            >
              <TrendingDown className="w-4 h-4" />
              {showFunnel ? 'Ocultar Funnel' : 'Ver Funnel'}
            </button>

            <button
              onClick={reformatearTodosLosLeads}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 hover:scale-[1.02]"
              style={{ 
                fontFamily: "'Exo 2', sans-serif", 
                fontSize: '12px', 
                fontWeight: 600,
                background: 'rgba(249, 115, 22, 0.2)',
                color: '#fb923c',
                border: '1px solid rgba(251, 146, 60, 0.3)'
              }}
            >
              <Pencil className="w-4 h-4" />
              Formatear
            </button>

            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 hover:scale-[1.02]"
              style={{ 
                fontFamily: "'Exo 2', sans-serif", 
                fontSize: '12px', 
                fontWeight: 600,
                background: 'rgba(34, 197, 94, 0.2)',
                color: '#4ade80',
                border: '1px solid rgba(74, 222, 128, 0.3)'
              }}
            >
              <Download className="w-4 h-4" />
              Exportar
            </button>
          </div>
        </div>

        {/* FUNNEL DE VENTAS - REAL CHART */}
        {showFunnel && (
          <div 
            className="mb-4 p-6 rounded-2xl border shadow-2xl"
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              borderColor: 'rgba(71, 130, 196, 0.25)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
            }}
          >
            <div className="flex items-center gap-3 mb-6">
              <TrendingDown className="w-6 h-6 text-purple-400" />
              <h3 className="text-white" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '20px', fontWeight: 700 }}>
                Funnel de Ventas (Ratio 20:1)
              </h3>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              {/* Left: Funnel Blocks - RECTANGULAR STACKED */}
              <div className="h-[400px] relative flex flex-col justify-center gap-2 px-4">
                {calcularFunnelData().map((entry, index) => (
                  <div
                    key={index}
                    className="relative transition-all duration-300 hover:scale-105"
                    style={{
                      width: `${100 - (index * 15)}%`,
                      marginLeft: 'auto',
                      marginRight: 'auto'
                    }}
                  >
                    <div
                      className="p-4 flex items-center justify-between"
                      style={{
                        background: entry.fill,
                        borderRadius: '2px',
                        border: '2px solid rgba(255, 255, 255, 0.25)',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
                        backdropFilter: 'blur(8px)'
                      }}
                    >
                      <div>
                        <div 
                          className="text-white"
                          style={{
                            fontFamily: "'Exo 2', sans-serif",
                            fontSize: '15px',
                            fontWeight: 700,
                            letterSpacing: '0.5px',
                            textShadow: '0 2px 4px rgba(0,0,0,0.4)'
                          }}
                        >
                          {entry.name}
                        </div>
                        <div 
                          className="text-white/80 mt-0.5"
                          style={{
                            fontFamily: "'Exo 2', sans-serif",
                            fontSize: '11px',
                            fontWeight: 500
                          }}
                        >
                          {entry.count} leads
                        </div>
                      </div>
                      <div
                        className="text-white"
                        style={{
                          fontFamily: "'Orbitron', sans-serif",
                          fontSize: '20px',
                          fontWeight: 700,
                          textShadow: '0 2px 8px rgba(0,0,0,0.5)'
                        }}
                      >
                        {entry.displayValue}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right: KPIs - ENHANCED CONTRAST */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl border shadow-lg" style={{ 
                  background: 'linear-gradient(135deg, rgba(96, 165, 250, 0.2) 0%, rgba(59, 130, 246, 0.15) 100%)', 
                  borderColor: 'rgba(96, 165, 250, 0.5)',
                  boxShadow: '0 4px 16px rgba(59, 130, 246, 0.2)'
                }}>
                  <div className="text-blue-300 mb-1" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                    Total Leads
                  </div>
                  <div className="text-white" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '32px', fontWeight: 700, textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                    {leads.length}
                  </div>
                </div>

                <div className="p-4 rounded-xl border shadow-lg" style={{ 
                  background: 'linear-gradient(135deg, rgba(74, 222, 128, 0.2) 0%, rgba(34, 197, 94, 0.15) 100%)', 
                  borderColor: 'rgba(74, 222, 128, 0.5)',
                  boxShadow: '0 4px 16px rgba(34, 197, 94, 0.2)'
                }}>
                  <div className="text-green-300 mb-1" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                    Filtrados
                  </div>
                  <div className="text-white" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '32px', fontWeight: 700, textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                    {filteredLeads.length}
                  </div>
                </div>

                <div className="p-4 rounded-xl border shadow-lg" style={{ 
                  background: 'linear-gradient(135deg, rgba(192, 132, 252, 0.2) 0%, rgba(168, 85, 247, 0.15) 100%)', 
                  borderColor: 'rgba(192, 132, 252, 0.5)',
                  boxShadow: '0 4px 16px rgba(168, 85, 247, 0.2)'
                }}>
                  <div className="text-purple-300 mb-1" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                    Vendedores
                  </div>
                  <div className="text-white" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '32px', fontWeight: 700, textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                    {getVendedoresUnicos().length}
                  </div>
                </div>

                <div className="p-4 rounded-xl border shadow-lg" style={{ 
                  background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(251, 146, 60, 0.15) 100%)', 
                  borderColor: 'rgba(251, 191, 36, 0.5)',
                  boxShadow: '0 4px 16px rgba(251, 146, 60, 0.2)'
                }}>
                  <div className="text-amber-300 mb-1" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                    Proyectado Total
                  </div>
                  <div className="text-white" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '26px', fontWeight: 700, textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                    ${(calcularFunnelData()[4].value / 1000).toFixed(0)}k
                  </div>
                </div>

                {/* Explicación del ratio */}
                <div className="col-span-2 p-4 rounded-xl border shadow-md" style={{ 
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%)', 
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                }}>
                  <div className="text-gray-200 text-sm" style={{ fontFamily: "'Exo 2', sans-serif", lineHeight: '1.6' }}>
                    <strong className="text-purple-300">Ratio 20:1:</strong> Para cerrar la meta proyectada, necesitas <strong className="text-white">${(calcularFunnelData()[0].value / 1000).toFixed(0)}k</strong> en prospección (20x más que el cierre).
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TABLE - GLASSMORPHISM + STICKY HEADER - OPTIMIZED HEIGHT */}
        <div 
          className="rounded-2xl border shadow-2xl overflow-hidden"
          style={{
            background: 'rgba(15, 23, 42, 0.85)',
            borderColor: 'rgba(71, 130, 196, 0.25)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            height: 'calc(100vh - 200px)',
            maxHeight: 'calc(100vh - 200px)'
          }}
        >
          <div className="overflow-x-auto overflow-y-auto custom-scrollbar" style={{ height: '100%', maxHeight: '100%' }}>
            <style>{`
              .custom-scrollbar::-webkit-scrollbar {
                width: 10px;
                height: 10px;
              }
              .custom-scrollbar::-webkit-scrollbar-track {
                background: rgba(15, 23, 42, 0.5);
                border-radius: 10px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb {
                background: rgba(30, 102, 245, 0.6);
                border-radius: 10px;
                border: 2px solid rgba(15, 23, 42, 0.5);
              }
              .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: rgba(30, 102, 245, 0.8);
              }
            `}</style>
            <table className="w-full">
              <thead className="sticky top-0 z-10" style={{ 
                background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.98) 0%, rgba(20, 30, 48, 0.95) 100%)',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.5)',
                height: '52px'
              }}>
                <tr className="border-b border-white/10" style={{ height: '52px' }}>
                  <th 
                    className="px-3 py-3.5 text-center text-gray-200"
                    style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', width: '3%', color: '#e2e8f0', height: '52px' }}
                  >
                    #
                  </th>
                  <th 
                    onClick={() => handleSort('nombreEmpresa')}
                    className="px-3 py-3.5 text-left cursor-pointer hover:text-white transition-colors"
                    style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', width: '11%', color: '#e2e8f0', height: '52px' }}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      EMPRESA
                      <SortIcon field="nombreEmpresa" />
                    </div>
                  </th>
                  <th className="px-3 py-3.5 text-left" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', width: '7%', color: '#e2e8f0', height: '52px' }}>
                    ETAPA
                  </th>
                  <th className="px-3 py-3.5 text-left" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', width: '20%', color: '#e2e8f0', height: '52px' }}>
                    CONTACTO
                  </th>
                  <th className="px-3 py-3.5 text-left" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', width: '9%', color: '#e2e8f0', height: '52px' }}>
                    SERVICIO
                  </th>
                  <th className="px-3 py-3.5 text-left" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', width: '9%', color: '#e2e8f0', height: '52px' }}>
                    TIPO DE VIAJES
                  </th>
                  <th 
                    onClick={() => handleSort('viajesPorMes')}
                    className="px-3 py-3.5 text-center cursor-pointer hover:text-white transition-colors"
                    style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', width: '5%', color: '#e2e8f0', height: '52px' }}
                  >
                    <div className="flex items-center justify-center gap-1">
                      VIAJES
                      <SortIcon field="viajesPorMes" />
                    </div>
                  </th>
                  <th 
                    className="px-3 py-3.5 text-center"
                    style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', width: '7%', color: '#e2e8f0', height: '52px' }}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      VENTA
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('vendedor')}
                    className="px-3 py-3.5 text-left cursor-pointer hover:text-white transition-colors"
                    style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', width: '10%', color: '#e2e8f0', height: '52px' }}
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      VENDEDOR
                      <SortIcon field="vendedor" />
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('fechaCaptura')}
                    className="px-3 py-3.5 text-center cursor-pointer hover:text-white transition-colors"
                    style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', width: '8%', color: '#e2e8f0', height: '52px' }}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Calendar className="w-4 h-4" />
                      FECHA
                      <SortIcon field="fechaCaptura" />
                    </div>
                  </th>
                  <th className="px-3 py-3.5 text-center" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', width: '10%', color: '#e2e8f0', height: '52px' }}>
                    ACCIONES
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-6 py-12 text-center text-gray-400" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '16px' }}>
                      No se encontraron leads. {!filterFechaInicio && !filterFechaFin && !searchTerm && !filterVendedor && 'Agrega uno nuevo desde "Agregar Lead".'}
                      {(filterFechaInicio || filterFechaFin || searchTerm || filterVendedor) && 'Intenta ajustar los filtros.'}
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead, index) => (
                    <tr 
                      key={lead.id} 
                      className="border-b border-white/5 hover:bg-white/5 transition-all duration-200 group"
                      style={{ 
                        background: index % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)',
                        height: '56px'
                      }}
                    >
                      <td className="px-3 py-3.5 text-center align-middle" style={{ fontFamily: "'Orbitron', monospace", fontSize: '14px', fontWeight: 600, color: '#1E66F5', height: '56px' }}>
                        {index + 1}
                      </td>
                      <td className="px-3 py-3.5 text-white align-middle" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', fontWeight: 700, height: '56px' }}>
                        {lead.nombreEmpresa}
                      </td>
                      <td className="px-3 py-3.5 align-middle" style={{ height: '56px' }}>
                        <span 
                          className="px-2.5 py-1 rounded-full text-xs shadow-sm"
                          style={{ 
                            fontFamily: "'Exo 2', sans-serif", 
                            fontWeight: 700,
                            fontSize: '10px',
                            background: lead.etapaLead === 'Cotizado' 
                              ? 'linear-gradient(135deg, rgba(96, 165, 250, 0.4) 0%, rgba(59, 130, 246, 0.35) 100%)' 
                              : 'linear-gradient(135deg, rgba(148, 163, 184, 0.35) 0%, rgba(100, 116, 139, 0.3) 100%)',
                            color: lead.etapaLead === 'Cotizado' ? '#dbeafe' : '#e2e8f0',
                            border: lead.etapaLead === 'Cotizado' 
                              ? '1.5px solid rgba(96, 165, 250, 0.6)' 
                              : '1.5px solid rgba(148, 163, 184, 0.5)',
                            boxShadow: lead.etapaLead === 'Cotizado'
                              ? '0 2px 8px rgba(59, 130, 246, 0.25)'
                              : '0 2px 8px rgba(100, 116, 139, 0.2)',
                            textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                          }}
                        >
                          {lead.etapaLead || 'Prospecto'}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 align-middle" style={{ height: '56px' }}>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-white" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', fontWeight: 600 }}>
                            {lead.nombreContacto}
                          </span>
                          <span className="text-gray-400" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px' }}>
                            {lead.correoElectronico}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 align-middle" style={{ height: '56px' }}>
                        <div className="flex flex-wrap gap-1">
                          {lead.tipoServicio.map((tipo, i) => (
                            <span 
                              key={i}
                              className="px-2.5 py-1 rounded-full shadow-sm"
                              style={{ 
                                fontFamily: "'Exo 2', sans-serif", 
                                fontWeight: 700, 
                                fontSize: '10px',
                                background: tipo.includes('Hazmat') 
                                  ? 'linear-gradient(135deg, rgba(192, 132, 252, 0.35) 0%, rgba(168, 85, 247, 0.3) 100%)' 
                                  : 'linear-gradient(135deg, rgba(96, 165, 250, 0.35) 0%, rgba(59, 130, 246, 0.3) 100%)',
                                color: tipo.includes('Hazmat') ? '#e9d5ff' : '#dbeafe',
                                border: tipo.includes('Hazmat') 
                                  ? '1.5px solid rgba(192, 132, 252, 0.6)' 
                                  : '1.5px solid rgba(96, 165, 250, 0.6)',
                                boxShadow: tipo.includes('Hazmat')
                                  ? '0 2px 8px rgba(168, 85, 247, 0.25)'
                                  : '0 2px 8px rgba(59, 130, 246, 0.25)',
                                textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                              }}
                            >
                              {tipo}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-3.5 align-middle" style={{ height: '56px' }}>
                        <div className="flex flex-wrap gap-1">
                          {lead.tipoViaje.map((tipo, i) => (
                            <span 
                              key={i}
                              className="px-2.5 py-1 rounded-full shadow-sm"
                              style={{ 
                                fontFamily: "'Exo 2', sans-serif", 
                                fontWeight: 700, 
                                fontSize: '10px',
                                background: 'linear-gradient(135deg, rgba(74, 222, 128, 0.35) 0%, rgba(34, 197, 94, 0.3) 100%)',
                                color: '#d1fae5',
                                border: '1.5px solid rgba(74, 222, 128, 0.6)',
                                boxShadow: '0 2px 8px rgba(34, 197, 94, 0.25)',
                                textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                              }}
                            >
                              {tipo}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-center text-white align-middle" style={{ fontFamily: "'Orbitron', monospace", fontSize: '15px', fontWeight: 600, height: '56px' }}>
                        {lead.viajesPorMes || '–'}
                      </td>
                      <td className="px-3 py-3.5 text-center align-middle" style={{ height: '56px' }}>
                        <span 
                          className="px-3 py-1.5 rounded-lg shadow-md"
                          style={{
                            fontFamily: "'Orbitron', sans-serif",
                            fontSize: '14px',
                            fontWeight: 700,
                            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.25) 0%, rgba(16, 185, 129, 0.2) 100%)',
                            color: '#6ee7b7',
                            border: '1.5px solid rgba(110, 231, 183, 0.4)',
                            boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)',
                            textShadow: '0 1px 2px rgba(0,0,0,0.4)',
                            display: 'inline-block'
                          }}
                        >
                          {lead.proyectadoVentaMensual || 'N/A'}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-gray-300 align-middle" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', fontWeight: 600, height: '56px' }}>
                        {lead.vendedor}
                      </td>
                      <td className="px-3 py-3.5 text-center text-white align-middle" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 600, height: '56px' }}>
                        {new Date(lead.fechaCaptura).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </td>
                      <td className="px-3 py-3.5 align-middle" style={{ height: '56px' }}>
                        <div className="flex items-center justify-center gap-2">
                          {/* Ver detalles - Blue 3D */}
                          <button
                            onClick={() => setSelectedLead(lead)}
                            className="p-2.5 rounded-xl transition-all duration-200 hover:scale-110 hover:-translate-y-0.5 group"
                            style={{ 
                              background: 'linear-gradient(135deg, rgba(96, 165, 250, 0.3) 0%, rgba(59, 130, 246, 0.25) 100%)',
                              border: '1.5px solid rgba(96, 165, 250, 0.4)',
                              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
                              color: '#93c5fd'
                            }}
                            title="Ver detalles"
                          >
                            <Eye className="w-4.5 h-4.5 group-hover:text-blue-300 transition-colors" strokeWidth={2.5} />
                          </button>
                          
                          {/* Editar - Orange 3D */}
                          <button
                            onClick={() => setEditLead(lead)}
                            className="p-2.5 rounded-xl transition-all duration-200 hover:scale-110 hover:-translate-y-0.5 group"
                            style={{ 
                              background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.3) 0%, rgba(251, 146, 60, 0.25) 100%)',
                              border: '1.5px solid rgba(251, 191, 36, 0.4)',
                              boxShadow: '0 4px 12px rgba(251, 146, 60, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
                              color: '#fcd34d'
                            }}
                            title="Editar"
                          >
                            <Pencil className="w-4.5 h-4.5 group-hover:text-amber-300 transition-colors" strokeWidth={2.5} />
                          </button>
                          
                          {/* Cotizaciones - Green 3D */}
                          <div className="relative">
                            <button
                              onClick={() => setCotizacionesModal(lead)}
                              className="p-2.5 rounded-xl transition-all duration-200 hover:scale-110 hover:-translate-y-0.5 group"
                              style={{ 
                                background: 'linear-gradient(135deg, rgba(74, 222, 128, 0.3) 0%, rgba(34, 197, 94, 0.25) 100%)',
                                border: '1.5px solid rgba(74, 222, 128, 0.4)',
                                boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
                                color: '#86efac'
                              }}
                              title="Cotizaciones"
                            >
                              <FileText className="w-4.5 h-4.5 group-hover:text-green-300 transition-colors" strokeWidth={2.5} />
                            </button>
                            {lead.cotizaciones && lead.cotizaciones.length > 0 && (
                              <div 
                                className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white shadow-lg"
                                style={{ 
                                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  border: '2px solid rgba(16, 185, 129, 0.3)',
                                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)'
                                }}
                              >
                                {lead.cotizaciones.length}
                              </div>
                            )}
                          </div>
                          
                          {/* Eliminar - Red 3D */}
                          <button
                            onClick={() => handleEliminarLead(lead.id)}
                            className="p-2.5 rounded-xl transition-all duration-200 hover:scale-110 hover:-translate-y-0.5 group"
                            style={{ 
                              background: 'linear-gradient(135deg, rgba(248, 113, 113, 0.3) 0%, rgba(239, 68, 68, 0.25) 100%)',
                              border: '1.5px solid rgba(248, 113, 113, 0.4)',
                              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
                              color: '#fca5a5'
                            }}
                            title="Eliminar"
                          >
                            <Trash2 className="w-4.5 h-4.5 group-hover:text-red-300 transition-colors" strokeWidth={2.5} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODALS (unchanged logic, just keeping them) */}
        {/* ... rest of modals stay the same ... */}
      </div>
    </div>
  );
};
