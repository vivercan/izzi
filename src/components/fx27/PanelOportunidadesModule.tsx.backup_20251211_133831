import { ModuleTemplate } from './ModuleTemplate';
import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { MODULE_IMAGES } from '../../assets/module-images';
import { Search, Download, TrendingUp, X, BarChart3, Building2, User, Calendar, Eye, Trash2, SortAsc, SortDesc, FileText, Upload, Pencil } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

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

export const PanelOportunidadesModule = ({ onBack }: PanelOportunidadesModuleProps) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVendedor, setFilterVendedor] = useState('');
  const [filterFecha, setFilterFecha] = useState('');
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

    // Filtro por fecha
    if (filterFecha) {
      resultado = resultado.filter(lead => {
        const fechaLead = new Date(lead.fechaCaptura).toISOString().split('T')[0];
        return fechaLead === filterFecha;
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
  }, [leads, searchTerm, filterVendedor, filterFecha, sortField, sortDirection]);

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
    if (sortField !== field) return <SortAsc className="w-4 h-4 opacity-30" />;
    return sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />;
  };

  return (
    <ModuleTemplate 
      title="Panel de Oportunidades" 
      onBack={onBack} 
      headerImage={MODULE_IMAGES.PANEL_OPORTUNIDADES}
    >
      <div className="p-4">
        {/* Controles superiores */}
        <div className="mb-2 flex flex-wrap gap-3 items-center justify-between">
          {/* Búsqueda con contador integrado */}
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--fx-muted)]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar leads..."
                className="w-full pl-10 pr-4 py-1.5 rounded-lg bg-[rgba(15,23,42,0.85)] border border-[rgba(148,163,184,0.4)] text-white placeholder:text-[var(--fx-muted)] focus:outline-none focus:border-[var(--fx-primary)]"
                style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px' }}
              />
            </div>
          </div>

          {/* Filtros */}
          <div className="flex gap-3">
            <select
              value={filterVendedor}
              onChange={(e) => setFilterVendedor(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-[rgba(15,23,42,0.85)] border border-[rgba(148,163,184,0.4)] text-white focus:outline-none focus:border-[var(--fx-primary)]"
              style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px' }}
            >
              <option value="">Todos los vendedores</option>
              {getVendedoresUnicos().map(vendedor => (
                <option key={vendedor} value={vendedor}>{vendedor}</option>
              ))}
            </select>

            <input
              type="date"
              value={filterFecha}
              onChange={(e) => setFilterFecha(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-[rgba(15,23,42,0.85)] border border-[rgba(148,163,184,0.4)] text-white focus:outline-none focus:border-[var(--fx-primary)]"
              style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px' }}
            />
          </div>

          {/* Acciones */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowFunnel(!showFunnel)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 transition-colors"
              style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 600 }}
            >
              <BarChart3 className="w-4 h-4" />
              Funnel
            </button>

            <button
              onClick={reformatearTodosLosLeads}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30 transition-colors"
              style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 600 }}
              title="Reformatear todos los leads"
            >
              <Pencil className="w-4 h-4" />
              Formatear
            </button>

            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 transition-colors"
              style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 600 }}
            >
              <Download className="w-4 h-4" />
              Exportar
            </button>
          </div>
        </div>

        {/* Funnel de Ventas */}
        {showFunnel && (
          <div className="mb-2 p-4 rounded-2xl bg-[var(--fx-surface)] border border-white/10">
            <h3 className="text-white mb-3" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '18px', fontWeight: 700 }}>
              📊 Funnel de Ventas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <div className="text-blue-400 mb-1" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px' }}>Total Leads</div>
                <div className="text-white" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '28px', fontWeight: 700 }}>{leads.length}</div>
              </div>
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                <div className="text-green-400 mb-1" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px' }}>Filtrados</div>
                <div className="text-white" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '28px', fontWeight: 700 }}>{filteredLeads.length}</div>
              </div>
              <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                <div className="text-purple-400 mb-1" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px' }}>Vendedores</div>
                <div className="text-white" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '28px', fontWeight: 700 }}>{getVendedoresUnicos().length}</div>
              </div>
              <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
                <div className="text-orange-400 mb-1" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px' }}>Tasa Conversión</div>
                <div className="text-white" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '28px', fontWeight: 700 }}>
                  {leads.length > 0 ? Math.round((filteredLeads.length / leads.length) * 100) : 0}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabla de Leads - ULTRA COMPACTA PARA VER 25 EMPRESAS */}
        <div className="rounded-2xl bg-[var(--fx-surface)] border border-white/10 overflow-hidden">
          <div 
            className="overflow-x-auto custom-scrollbar" 
            style={{ 
              overflowY: 'auto'
            }}
          >
            <style>{`
              .custom-scrollbar::-webkit-scrollbar {
                width: 12px;
                height: 12px;
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
              <thead className="sticky top-0 bg-[var(--fx-surface)] z-10">
                <tr className="border-b border-white/10">
                  <th 
                    className="px-2 py-1.5 text-center text-[var(--fx-muted)]"
                    style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 600, width: '4%' }}
                  >
                    ITEM
                  </th>
                  <th 
                    onClick={() => handleSort('nombreEmpresa')}
                    className="px-2 py-1.5 text-left text-[var(--fx-muted)] cursor-pointer hover:text-white transition-colors"
                    style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 600, width: '10%' }}
                  >
                    <div className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      EMPRESA
                      <SortIcon field="nombreEmpresa" />
                    </div>
                  </th>
                  <th className="px-1.5 py-1.5 text-left text-[var(--fx-muted)]" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 600, width: '7%' }}>
                    ETAPA
                  </th>
                  <th className="px-2 py-1.5 text-left text-[var(--fx-muted)]" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 600, width: '24%' }}>
                    CONTACTO
                  </th>
                  <th className="px-2 py-1.5 text-left text-[var(--fx-muted)]" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 600, width: '10%' }}>
                    SERVICIO
                  </th>
                  <th className="px-1.5 py-1.5 text-left text-[var(--fx-muted)]" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 600, width: '10%' }}>
                    TIPO DE VIAJES
                  </th>
                  <th 
                    onClick={() => handleSort('viajesPorMes')}
                    className="px-1.5 py-1.5 text-left text-[var(--fx-muted)] cursor-pointer hover:text-white transition-colors"
                    style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 600, width: '6%' }}
                  >
                    <div className="flex items-center gap-1">
                      VIAJES
                      <SortIcon field="viajesPorMes" />
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('vendedor')}
                    className="px-2 py-1.5 text-left text-[var(--fx-muted)] cursor-pointer hover:text-white transition-colors"
                    style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 600, width: '10%' }}
                  >
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      VENDEDOR
                      <SortIcon field="vendedor" />
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('fechaCaptura')}
                    className="px-2 py-1.5 text-left text-[var(--fx-muted)] cursor-pointer hover:text-white transition-colors"
                    style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 600, width: '8%' }}
                  >
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      FECHA
                      <SortIcon field="fechaCaptura" />
                    </div>
                  </th>
                  <th className="px-2 py-1.5 text-center text-[var(--fx-muted)]" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 600, width: '12%' }}>
                    ACCIONES
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center text-[var(--fx-muted)]" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px' }}>
                      No se encontraron leads. Agrega uno nuevo desde el módulo "Agregar Lead".
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead, index) => (
                    <tr key={lead.id} className="border-b border-white/5 hover:bg-white/5 transition-colors" style={{ height: '44px' }}>
                      <td className="px-2 py-2 text-center align-middle" style={{ fontFamily: "'Orbitron', monospace", fontSize: '11px', fontWeight: 600, lineHeight: '1.1', color: 'var(--fx-primary)' }}>
                        {index + 1}
                      </td>
                      <td className="px-2 py-2 text-white align-middle" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 700, lineHeight: '1.1' }}>
                        {lead.nombreEmpresa}
                      </td>
                      <td className="px-1.5 py-2 text-[var(--fx-muted)] align-middle" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px', lineHeight: '1.1' }}>
                        {lead.etapaLead || 'Prospecto'}
                      </td>
                      <td className="px-2 py-2 align-middle">
                        <div className="flex items-center gap-2" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', lineHeight: '1.2' }}>
                          <span className="text-white">{lead.nombreContacto}</span>
                          <span className="text-[var(--fx-muted)]" style={{ fontSize: '10px' }}>{lead.correoElectronico}</span>
                        </div>
                      </td>
                      <td className="px-2 py-2 align-middle">
                        <div className="flex flex-wrap gap-0.5">
                          {lead.tipoServicio.map((tipo, index) => (
                            <span 
                              key={index}
                              className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 text-xs"
                              style={{ fontFamily: "'Exo 2', sans-serif", fontWeight: 600, fontSize: '9px', lineHeight: '1.1' }}
                            >
                              {tipo}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-1.5 py-2 align-middle">
                        <div className="flex flex-wrap gap-0.5">
                          {lead.tipoViaje.map((tipo, index) => (
                            <span 
                              key={index}
                              className="px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 text-xs"
                              style={{ fontFamily: "'Exo 2', sans-serif", fontWeight: 600, fontSize: '9px', lineHeight: '1.1' }}
                            >
                              {tipo}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-1.5 py-2 text-white align-middle" style={{ fontFamily: "'Orbitron', monospace", fontSize: '11px', fontWeight: 600, lineHeight: '1.1' }}>
                        {lead.viajesPorMes || '-'}
                      </td>
                      <td className="px-2 py-2 text-[var(--fx-muted)] align-middle" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', lineHeight: '1.1' }}>
                        {lead.vendedor}
                      </td>
                      <td className="px-2 py-2 text-white align-middle" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px', fontWeight: 600, lineHeight: '1.1' }}>
                        {new Date(lead.fechaCaptura).toLocaleDateString('es-MX')}
                      </td>
                      <td className="px-2 py-2 align-middle">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedLead(lead)}
                            className="p-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition-colors"
                            title="Ver detalles"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditLead(lead)}
                            className="p-1.5 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 transition-colors"
                            title="Editar"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <div className="relative">
                            <button
                              onClick={() => setCotizacionesModal(lead)}
                              className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 transition-colors"
                              title="Cotizaciones"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                            {lead.cotizaciones && lead.cotizaciones.length > 0 && (
                              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center" style={{ fontSize: '8px', fontWeight: 700 }}>
                                {lead.cotizaciones.length}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => handleEliminarLead(lead.id)}
                            className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

        {/* Modal de detalles */}
        {selectedLead && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedLead(null)}>
            <div className="bg-[var(--fx-surface)] rounded-2xl border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-white mb-6 flex items-center gap-2" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '24px', fontWeight: 700 }}>
                <Building2 className="w-6 h-6" />
                {selectedLead.nombreEmpresa}
              </h3>

              <div className="space-y-4">
                <div>
                  <div className="text-[var(--fx-muted)] mb-1" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px' }}>Página Web</div>
                  <div className="text-white" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px' }}>{selectedLead.paginaWeb || '-'}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[var(--fx-muted)] mb-1" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px' }}>Contacto</div>
                    <div className="text-white" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px' }}>{selectedLead.nombreContacto}</div>
                  </div>
                  <div>
                    <div className="text-[var(--fx-muted)] mb-1" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px' }}>Email</div>
                    <div className="text-white" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px' }}>{selectedLead.correoElectronico}</div>
                  </div>
                </div>

                <div>
                  <div className="text-[var(--fx-muted)] mb-1" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px' }}>Tipo de Servicio</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedLead.tipoServicio.map((tipo, index) => (
                      <span key={index} className="px-3 py-1 rounded-lg bg-blue-500/20 text-blue-400" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 600 }}>
                        {tipo}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-[var(--fx-muted)] mb-1" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px' }}>Tipo de Viaje</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedLead.tipoViaje.map((tipo, index) => (
                      <span key={index} className="px-3 py-1 rounded-lg bg-green-500/20 text-green-400" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 600 }}>
                        {tipo}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-[var(--fx-muted)] mb-1" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px' }}>Rutas</div>
                    <div className="text-white" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px' }}>{selectedLead.principalesRutas || '-'}</div>
                  </div>
                  <div>
                    <div className="text-[var(--fx-muted)] mb-1" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px' }}>Viajes/Mes</div>
                    <div className="text-white" style={{ fontFamily: "'Orbitron', monospace", fontSize: '14px' }}>{selectedLead.viajesPorMes || '-'}</div>
                  </div>
                  <div>
                    <div className="text-[var(--fx-muted)] mb-1" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px' }}>Tarifa</div>
                    <div className="text-white" style={{ fontFamily: "'Orbitron', monospace", fontSize: '14px' }}>{selectedLead.tarifa || '-'}</div>
                  </div>
                </div>

                <div>
                  <div className="text-[var(--fx-muted)] mb-1" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px' }}>Próximos Pasos</div>
                  <div className="text-white p-3 rounded-lg bg-[rgba(15,23,42,0.5)]" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px' }}>
                    {selectedLead.proximosPasos || 'No hay próximos pasos registrados'}
                  </div>
                </div>

                {/* Hitos del Cliente */}
                <div className="p-4 rounded-lg bg-[var(--fx-surface)] border border-white/10">
                  <div className="text-white mb-3" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 700 }}>
                    🏆 HITOS DEL CLIENTE
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Nivel 4 - CYAN */}
                    <div className="flex items-center gap-2 p-2 rounded bg-cyan-500/10 border border-cyan-500/30">
                      <span className="text-lg">{selectedLead.altaCliente ? '✅' : '⬜'}</span>
                      <div>
                        <div className={`${selectedLead.altaCliente ? 'text-cyan-400 font-semibold' : 'text-[var(--fx-muted)]'}`} style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px' }}>
                          <span className="text-cyan-500">●</span> Nivel 4
                        </div>
                        <div className={`${selectedLead.altaCliente ? 'text-cyan-400' : 'text-[var(--fx-muted)]'}`} style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px' }}>
                          Alta de Cliente
                        </div>
                      </div>
                    </div>
                    
                    {/* Nivel 5 - PURPLE */}
                    <div className="flex items-center gap-2 p-2 rounded bg-purple-500/10 border border-purple-500/30">
                      <span className="text-lg">{selectedLead.generacionSOP ? '✅' : '⬜'}</span>
                      <div>
                        <div className={`${selectedLead.generacionSOP ? 'text-purple-400 font-semibold' : 'text-[var(--fx-muted)]'}`} style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px' }}>
                          <span className="text-purple-500">●</span> Nivel 5
                        </div>
                        <div className={`${selectedLead.generacionSOP ? 'text-purple-400' : 'text-[var(--fx-muted)]'}`} style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px' }}>
                          Generación SOP
                        </div>
                      </div>
                    </div>
                    
                    {/* Nivel 6 - PINK */}
                    <div className="flex items-center gap-2 p-2 rounded bg-pink-500/10 border border-pink-500/30">
                      <span className="text-lg">{selectedLead.juntaArranque ? '✅' : '⬜'}</span>
                      <div>
                        <div className={`${selectedLead.juntaArranque ? 'text-pink-400 font-semibold' : 'text-[var(--fx-muted)]'}`} style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px' }}>
                          <span className="text-pink-500">●</span> Nivel 6
                        </div>
                        <div className={`${selectedLead.juntaArranque ? 'text-pink-400' : 'text-[var(--fx-muted)]'}`} style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px' }}>
                          Junta de Arranque
                        </div>
                      </div>
                    </div>
                    
                    {/* Nivel 7 - YELLOW */}
                    <div className="flex items-center gap-2 p-2 rounded bg-yellow-500/10 border border-yellow-500/30">
                      <span className="text-lg">{selectedLead.facturado ? '✅' : '⬜'}</span>
                      <div>
                        <div className={`${selectedLead.facturado ? 'text-yellow-400 font-semibold' : 'text-[var(--fx-muted)]'}`} style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px' }}>
                          <span className="text-yellow-500">●</span> Nivel 7
                        </div>
                        <div className={`${selectedLead.facturado ? 'text-yellow-400' : 'text-[var(--fx-muted)]'}`} style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px' }}>
                          Facturado
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                  <div>
                    <div className="text-[var(--fx-muted)] mb-1" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px' }}>Vendedor</div>
                    <div className="text-white" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px' }}>{selectedLead.vendedor}</div>
                  </div>
                  <div>
                    <div className="text-[var(--fx-muted)] mb-1" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px' }}>Fecha de Captura</div>
                    <div className="text-white" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px' }}>
                      {new Date(selectedLead.fechaCaptura).toLocaleString('es-MX')}
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedLead(null)}
                className="mt-6 w-full px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white transition-colors"
                style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', fontWeight: 600 }}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {/* Modal de Cotizaciones */}
        {cotizacionesModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setCotizacionesModal(null)}>
            <div className="bg-[var(--fx-surface)] rounded-2xl border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white flex items-center gap-2" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '24px', fontWeight: 700 }}>
                  <FileText className="w-6 h-6 text-emerald-400" />
                  Cotizaciones
                </h3>
                <button onClick={() => setCotizacionesModal(null)} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="mb-4">
                <div className="text-white mb-2" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '16px', fontWeight: 600 }}>
                  {cotizacionesModal.nombreEmpresa}
                </div>
                <div className="text-[var(--fx-muted)]" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px' }}>
                  Adjunta cotizaciones en formato PDF (ilimitadas)
                </div>
              </div>

              {/* Botón para subir archivos */}
              <div className="mb-6">
                <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 cursor-pointer transition-colors">
                  <Upload className="w-5 h-5" />
                  <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', fontWeight: 600 }}>Subir Cotización (PDF)</span>
                  <input
                    type="file"
                    accept="application/pdf"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      files.forEach(file => {
                        if (file.type === 'application/pdf') {
                          // Simular la carga del archivo (en producción esto se guardaría en backend)
                          const reader = new FileReader();
                          reader.onload = async () => {
                            const newCotizacion = {
                              nombre: file.name,
                              url: reader.result as string,
                              fecha: new Date().toISOString()
                            };
                            
                            // Actualizar el lead con la nueva cotización Y CAMBIAR ETAPA
                            const updatedLeads = leads.map(l => {
                              if (l.id === cotizacionesModal.id) {
                                const nuevasCotizaciones = [...(l.cotizaciones || []), newCotizacion];
                                // Si es la primera cotización, cambiar etapa de "Prospecto" a "Cotizado"
                                const nuevaEtapa = (l.cotizaciones || []).length === 0 ? 'Cotizado' : l.etapaLead;
                                return {
                                  ...l,
                                  cotizaciones: nuevasCotizaciones,
                                  etapaLead: nuevaEtapa
                                };
                              }
                              return l;
                            });
                            
                            // Guardar en backend
                            const leadActualizado = updatedLeads.find(l => l.id === cotizacionesModal.id);
                            if (leadActualizado) {
                              try {
                                await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/leads/${leadActualizado.id}`, {
                                  method: 'PUT',
                                  headers: {
                                    'Authorization': `Bearer ${publicAnonKey}`,
                                    'Content-Type': 'application/json'
                                  },
                                  body: JSON.stringify(leadActualizado)
                                });
                              } catch (error) {
                                console.error('Error al guardar cotización:', error);
                              }
                            }
                            
                            setLeads(updatedLeads);
                            setCotizacionesModal(updatedLeads.find(l => l.id === cotizacionesModal.id) || null);
                            alert(`✅ Cotización "${file.name}" agregada exitosamente`);
                          };
                          reader.readAsDataURL(file);
                        }
                      });
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>

              {/* Lista de cotizaciones */}
              <div className="space-y-3">
                {(!cotizacionesModal.cotizaciones || cotizacionesModal.cotizaciones.length === 0) ? (
                  <div className="text-center py-8 text-[var(--fx-muted)]" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px' }}>
                    No hay cotizaciones adjuntas. Sube el primer archivo.
                  </div>
                ) : (
                  cotizacionesModal.cotizaciones.map((cotizacion, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-3 flex-1">
                        <FileText className="w-5 h-5 text-emerald-400" />
                        <div className="flex-1">
                          <div className="text-white" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', fontWeight: 600 }}>
                            {cotizacion.nombre}
                          </div>
                          <div className="text-[var(--fx-muted)]" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px' }}>
                            {new Date(cotizacion.fecha).toLocaleString('es-MX')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={cotizacion.url}
                          download={cotizacion.nombre}
                          className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition-colors"
                          title="Descargar"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => {
                            if (confirm(`¿Eliminar "${cotizacion.nombre}"?`)) {
                              const updatedLeads = leads.map(l => {
                                if (l.id === cotizacionesModal.id) {
                                  return {
                                    ...l,
                                    cotizaciones: l.cotizaciones?.filter((_, i) => i !== index) || []
                                  };
                                }
                                return l;
                              });
                              setLeads(updatedLeads);
                              setCotizacionesModal(updatedLeads.find(l => l.id === cotizacionesModal.id) || null);
                            }
                          }}
                          className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <button
                onClick={() => setCotizacionesModal(null)}
                className="mt-6 w-full px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white transition-colors"
                style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', fontWeight: 600 }}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {/* Modal de Edición */}
        {editLead && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setEditLead(null)}>
            <div className="bg-[var(--fx-surface)] rounded-2xl border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white flex items-center gap-2" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '24px', fontWeight: 700 }}>
                  <Pencil className="w-6 h-6 text-orange-400" />
                  Editar Lead
                </h3>
                <button onClick={() => setEditLead(null)} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-[var(--fx-muted)] mb-1" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px' }}>Nombre de la Empresa</div>
                  <input
                    type="text"
                    value={formData.nombreEmpresa || ''}
                    onChange={(e) => setFormData({ ...formData, nombreEmpresa: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[rgba(15,23,42,0.85)] border border-[rgba(148,163,184,0.4)] text-white placeholder:text-[var(--fx-muted)] focus:outline-none focus:border-[var(--fx-primary)]"
                    style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px' }}
                  />
                </div>

                <div>
                  <div className="text-[var(--fx-muted)] mb-1" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px' }}>Página Web</div>
                  <input
                    type="text"
                    value={formData.paginaWeb || ''}
                    onChange={(e) => setFormData({ ...formData, paginaWeb: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[rgba(15,23,42,0.85)] border border-[rgba(148,163,184,0.4)] text-white placeholder:text-[var(--fx-muted)] focus:outline-none focus:border-[var(--fx-primary)]"
                    style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px' }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[var(--fx-muted)] mb-1" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px' }}>Contacto</div>
                    <input
                      type="text"
                      value={formData.nombreContacto || ''}
                      onChange={(e) => handleInputChange('nombreContacto', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[rgba(15,23,42,0.85)] border border-[rgba(148,163,184,0.4)] text-white placeholder:text-[var(--fx-muted)] focus:outline-none focus:border-[var(--fx-primary)]"
                      style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <div className="text-[var(--fx-muted)] mb-1" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px' }}>Email</div>
                    <input
                      type="email"
                      value={formData.correoElectronico || ''}
                      onChange={(e) => handleInputChange('correoElectronico', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[rgba(15,23,42,0.85)] border border-[rgba(148,163,184,0.4)] text-white placeholder:text-[var(--fx-muted)] focus:outline-none focus:border-[var(--fx-primary)]"
                      style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div>
                  <div className="text-[var(--fx-muted)] mb-1" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px' }}>Tipo de Servicio</div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleToggleServicio('Aerolíneas')}
                      className={`px-3 py-1 rounded-lg ${formData.tipoServicio?.includes('Aerolíneas') ? 'bg-blue-500/20 text-blue-400' : 'bg-[rgba(15,23,42,0.85)] border border-[rgba(148,163,184,0.4)] text-white'}`}
                      style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 600 }}
                    >
                      Aerolíneas
                    </button>
                    <button
                      onClick={() => handleToggleServicio('Hoteles')}
                      className={`px-3 py-1 rounded-lg ${formData.tipoServicio?.includes('Hoteles') ? 'bg-blue-500/20 text-blue-400' : 'bg-[rgba(15,23,42,0.85)] border border-[rgba(148,163,184,0.4)] text-white'}`}
                      style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 600 }}
                    >
                      Hoteles
                    </button>
                    <button
                      onClick={() => handleToggleServicio('Transporte')}
                      className={`px-3 py-1 rounded-lg ${formData.tipoServicio?.includes('Transporte') ? 'bg-blue-500/20 text-blue-400' : 'bg-[rgba(15,23,42,0.85)] border border-[rgba(148,163,184,0.4)] text-white'}`}
                      style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 600 }}
                    >
                      Transporte
                    </button>
                    <button
                      onClick={() => handleToggleServicio('Seguros')}
                      className={`px-3 py-1 rounded-lg ${formData.tipoServicio?.includes('Seguros') ? 'bg-blue-500/20 text-blue-400' : 'bg-[rgba(15,23,42,0.85)] border border-[rgba(148,163,184,0.4)] text-white'}`}
                      style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 600 }}
                    >
                      Seguros
                    </button>
                  </div>
                </div>

                <div>
                  <div className="text-[var(--fx-muted)] mb-1" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px' }}>Tipo de Viaje</div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleToggleViaje('Doméstico')}
                      className={`px-3 py-1 rounded-lg ${formData.tipoViaje?.includes('Doméstico') ? 'bg-green-500/20 text-green-400' : 'bg-[rgba(15,23,42,0.85)] border border-[rgba(148,163,184,0.4)] text-white'}`}
                      style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 600 }}
                    >
                      Doméstico
                    </button>
                    <button
                      onClick={() => handleToggleViaje('Internacional')}
                      className={`px-3 py-1 rounded-lg ${formData.tipoViaje?.includes('Internacional') ? 'bg-green-500/20 text-green-400' : 'bg-[rgba(15,23,42,0.85)] border border-[rgba(148,163,184,0.4)] text-white'}`}
                      style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 600 }}
                    >
                      Internacional
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-[var(--fx-muted)] mb-1" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px' }}>Rutas</div>
                    <input
                      type="text"
                      value={formData.principalesRutas || ''}
                      onChange={(e) => setFormData({ ...formData, principalesRutas: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[rgba(15,23,42,0.85)] border border-[rgba(148,163,184,0.4)] text-white placeholder:text-[var(--fx-muted)] focus:outline-none focus:border-[var(--fx-primary)]"
                      style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <div className="text-[var(--fx-muted)] mb-1" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px' }}>Viajes/Mes</div>
                    <input
                      type="number"
                      value={formData.viajesPorMes || ''}
                      onChange={(e) => setFormData({ ...formData, viajesPorMes: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[rgba(15,23,42,0.85)] border border-[rgba(148,163,184,0.4)] text-white placeholder:text-[var(--fx-muted)] focus:outline-none focus:border-[var(--fx-primary)]"
                      style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <div className="text-[var(--fx-muted)] mb-1" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px' }}>Tarifa</div>
                    <input
                      type="text"
                      value={formData.tarifa || ''}
                      onChange={(e) => setFormData({ ...formData, tarifa: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[rgba(15,23,42,0.85)] border border-[rgba(148,163,184,0.4)] text-white placeholder:text-[var(--fx-muted)] focus:outline-none focus:border-[var(--fx-primary)]"
                      style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div>
                  <div className="text-[var(--fx-muted)] mb-1" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px' }}>Próximos Pasos</div>
                  <textarea
                    value={formData.proximosPasos || ''}
                    onChange={(e) => setFormData({ ...formData, proximosPasos: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[rgba(15,23,42,0.85)] border border-[rgba(148,163,184,0.4)] text-white placeholder:text-[var(--fx-muted)] focus:outline-none focus:border-[var(--fx-primary)]"
                    style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px' }}
                  />
                </div>

                {/* Hitos del Cliente */}
                <div className="p-4 rounded-lg bg-[var(--fx-surface)] border border-white/10">
                  <div className="text-white mb-3" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 700 }}>
                    🏆 HITOS DEL CLIENTE
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Nivel 4 - CYAN */}
                    <div className="flex items-center gap-2 p-2 rounded bg-cyan-500/10 border border-cyan-500/30">
                      <span className="text-lg">{formData.altaCliente ? '✅' : '⬜'}</span>
                      <div>
                        <div className={`${formData.altaCliente ? 'text-cyan-400 font-semibold' : 'text-[var(--fx-muted)]'}`} style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px' }}>
                          <span className="text-cyan-500">●</span> Nivel 4
                        </div>
                        <div className={`${formData.altaCliente ? 'text-cyan-400' : 'text-[var(--fx-muted)]'}`} style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px' }}>
                          Alta de Cliente
                        </div>
                      </div>
                    </div>
                    
                    {/* Nivel 5 - PURPLE */}
                    <div className="flex items-center gap-2 p-2 rounded bg-purple-500/10 border border-purple-500/30">
                      <span className="text-lg">{formData.generacionSOP ? '✅' : '⬜'}</span>
                      <div>
                        <div className={`${formData.generacionSOP ? 'text-purple-400 font-semibold' : 'text-[var(--fx-muted)]'}`} style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px' }}>
                          <span className="text-purple-500">●</span> Nivel 5
                        </div>
                        <div className={`${formData.generacionSOP ? 'text-purple-400' : 'text-[var(--fx-muted)]'}`} style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px' }}>
                          Generación SOP
                        </div>
                      </div>
                    </div>
                    
                    {/* Nivel 6 - PINK */}
                    <div className="flex items-center gap-2 p-2 rounded bg-pink-500/10 border border-pink-500/30">
                      <span className="text-lg">{formData.juntaArranque ? '✅' : '⬜'}</span>
                      <div>
                        <div className={`${formData.juntaArranque ? 'text-pink-400 font-semibold' : 'text-[var(--fx-muted)]'}`} style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px' }}>
                          <span className="text-pink-500">●</span> Nivel 6
                        </div>
                        <div className={`${formData.juntaArranque ? 'text-pink-400' : 'text-[var(--fx-muted)]'}`} style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px' }}>
                          Junta de Arranque
                        </div>
                      </div>
                    </div>
                    
                    {/* Nivel 7 - YELLOW */}
                    <div className="flex items-center gap-2 p-2 rounded bg-yellow-500/10 border border-yellow-500/30">
                      <span className="text-lg">{formData.facturado ? '✅' : '⬜'}</span>
                      <div>
                        <div className={`${formData.facturado ? 'text-yellow-400 font-semibold' : 'text-[var(--fx-muted)]'}`} style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px' }}>
                          <span className="text-yellow-500">●</span> Nivel 7
                        </div>
                        <div className={`${formData.facturado ? 'text-yellow-400' : 'text-[var(--fx-muted)]'}`} style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px' }}>
                          Facturado
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                  <div>
                    <div className="text-[var(--fx-muted)] mb-1" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px' }}>Vendedor</div>
                    <input
                      type="text"
                      value={formData.vendedor || ''}
                      onChange={(e) => setFormData({ ...formData, vendedor: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[rgba(15,23,42,0.85)] border border-[rgba(148,163,184,0.4)] text-white placeholder:text-[var(--fx-muted)] focus:outline-none focus:border-[var(--fx-primary)]"
                      style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <div className="text-[var(--fx-muted)] mb-1" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px' }}>Fecha de Captura</div>
                    <input
                      type="datetime-local"
                      value={formData.fechaCaptura || ''}
                      onChange={(e) => setFormData({ ...formData, fechaCaptura: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[rgba(15,23,42,0.85)] border border-[rgba(148,163,184,0.4)] text-white placeholder:text-[var(--fx-muted)] focus:outline-none focus:border-[var(--fx-primary)]"
                      style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px' }}
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleGuardarEdicion}
                className="mt-6 w-full px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white transition-colors"
                style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', fontWeight: 600 }}
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        )}
      </div>
    </ModuleTemplate>
  );
};