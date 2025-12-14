import { ModuleTemplate } from './ModuleTemplate';
import { useState, useEffect, useCallback } from 'react';
import { MODULE_IMAGES } from '../../assets/module-images';
import { Upload, FileSpreadsheet, Calendar, TrendingUp, DollarSign, Users, Building2, Filter, Download, Loader2, CheckCircle, AlertTriangle, X, ChevronDown, BarChart3, PieChart, ArrowUpRight, ArrowDownRight, Truck, Globe, RefreshCw } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import * as XLSX from 'xlsx';

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS E INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

interface VentasModuleProps { onBack: () => void; }

interface ViajeVenta {
  id: string;
  idViaje: string;
  fechaFactura: string;
  cliente: string;
  clienteCorregido: string;
  clienteConsolidado: string;
  tipoViaje: string;
  segmentoNegocio: string;
  ejecutivo: string;
  subtotalUnificado: number;
  tcFactura: number;
  ventas: number;
  origen: string;
  destino: string;
  empresa: string;
  estatusFactura: string;
  clienteFinal: string;
  fechaCarga: string;
}

interface ResumenVentas {
  totalVentas: number;
  totalViajes: number;
  porEjecutivo: { [key: string]: number };
  porSegmento: { [key: string]: number };
  porCliente: { [key: string]: number };
  porMes: { [key: string]: number };
}

type FiltroTiempo = 'semana' | 'mes' | 'año' | 'rango';
type Vista = 'dashboard' | 'upload' | 'tabla';

// ═══════════════════════════════════════════════════════════════════════════════
// REGLAS DE PROCESAMIENTO (DEL DOCUMENTO)
// ═══════════════════════════════════════════════════════════════════════════════

const EMPRESAS_INTERNAS = ['TROB TRANSPORTES', 'WEXPRESS', 'SPEEDYHAUL INTERNATIONAL'];

const CLIENTES_SIEMPRE_DEDICADO = ['BAFAR', 'NATURESWEET', 'CLARIOS', 'NEXTEER', 'BARCEL'];

const MAPEO_CLIENTEFINAL: { [key: string]: string } = {
  'SIGMA ALIMENTOS': 'SIGMA ALIMENTOS',
  'BIMBO': 'BIMBO',
  'PILGRIM\'S': 'PILGRIM\'S PRIDE',
  'TYSON': 'TYSON FOODS',
  'BACHOCO': 'BACHOCO',
};

const CONSOLIDACION_CLIENTES: { [key: string]: string[] } = {
  'SIGMA ALIMENTOS': ['SIGMA ALIMENTOS CENTRO', 'SIGMA ALIMENTOS COMERCIAL', 'SIGMA ALIMENTOS LACTEOS'],
  'PILGRIM\'S PRIDE': ['PILGRIM\'S PRIDE', 'AVICOLA PILGRIM\'S PRIDE DE MEXICO', 'PILGRIM\'S PRIDE MEXICO'],
  'BIMBO': ['BIMBO', 'GRUPO BIMBO', 'BIMBO BAKERIES'],
  'NATURESWEET': ['NATURESWEET', 'NATURESWEET COMERCIALIZADORA', 'NATURESWEET INVERNADEROS'],
  'BARCEL': ['BARCEL', 'BARCEL S.A.'],
};

const CLIENTES_ISIS = ['HERCON SERVICES', 'ARCH MEAT', 'ZEBRA LOGISTICS', 'SUN CHEMICAL', 'BAKERY MACHINERY', 'MARTICO MEX', 'BERRIES PARADISE', 'TITAN MEATS', 'RED ROAD LOGISTICS'];
const CLIENTES_PALOMA = ['P.A.C. INTERNATIONAL', 'PAC INTERNATIONAL', 'SHORELINE TRANSFER', 'ATLAS EXPEDITORS', 'LOGISTEED MEXICO', 'SCHENKER INTERNATIONAL', 'COMERCIALIZADORA KEES'];

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCIONES DE PROCESAMIENTO
// ═══════════════════════════════════════════════════════════════════════════════

const corregirCliente = (cliente: string, clienteFinal: string, origen: string, destino: string): string => {
  if (!EMPRESAS_INTERNAS.includes(cliente.toUpperCase())) {
    return cliente;
  }
  // Método 1: Buscar en ClienteFinal
  for (const [key, value] of Object.entries(MAPEO_CLIENTEFINAL)) {
    if (clienteFinal.toUpperCase().includes(key)) {
      return value;
    }
  }
  // Método 2: Buscar en Origen/Destino (simplificado)
  const ubicaciones = `${origen} ${destino}`.toUpperCase();
  if (ubicaciones.includes('SIGMA')) return 'SIGMA ALIMENTOS';
  if (ubicaciones.includes('PILGRIM')) return 'PILGRIM\'S PRIDE';
  if (ubicaciones.includes('BIMBO')) return 'BIMBO';
  
  return cliente; // Sin corrección
};

const consolidarCliente = (clienteCorregido: string): string => {
  const upper = clienteCorregido.toUpperCase();
  for (const [consolidado, variantes] of Object.entries(CONSOLIDACION_CLIENTES)) {
    if (variantes.some(v => upper.includes(v.toUpperCase()))) {
      return consolidado;
    }
  }
  return clienteCorregido;
};

const clasificarSegmento = (clienteConsolidado: string, tipoViaje: string): string => {
  // Clientes siempre DEDICADO
  if (CLIENTES_SIEMPRE_DEDICADO.some(c => clienteConsolidado.toUpperCase().includes(c))) {
    return 'DEDICADO';
  }
  // Regla general
  if (tipoViaje === 'NAC') {
    return 'DEDICADO';
  }
  return 'IMPEX';
};

const asignarEjecutivo = (clienteConsolidado: string): string => {
  const upper = clienteConsolidado.toUpperCase();
  if (CLIENTES_ISIS.some(c => upper.includes(c))) return 'ISIS ESTRADA';
  if (CLIENTES_PALOMA.some(c => upper.includes(c))) return 'PALOMA OLIVO';
  return '';
};

const procesarExcel = (data: any[]): ViajeVenta[] => {
  const viajes: ViajeVenta[] = [];
  const idViajesVistos = new Set<string>();

  for (const row of data) {
    // 1. Saltar cancelados
    const estatus = String(row.EstatusFactura || '').toLowerCase();
    if (estatus.includes('cancelad')) continue;

    // 2. Saltar duplicados por idViaje
    const idViaje = String(row.idViaje || '');
    if (idViaje && idViajesVistos.has(idViaje)) continue;
    if (idViaje) idViajesVistos.add(idViaje);

    // 3. Extraer datos
    const cliente = String(row.Cliente || '').toUpperCase();
    const clienteFinal = String(row.ClienteFinal || '');
    const origen = String(row.Origen || '');
    const destino = String(row.Destino || '');
    const tipoViaje = String(row.TipoViaje || '').toUpperCase();

    // 4. Corregir cliente (si es empresa interna)
    const clienteCorregido = corregirCliente(cliente, clienteFinal, origen, destino).toUpperCase();

    // 5. Consolidar cliente
    const clienteConsolidado = consolidarCliente(clienteCorregido).toUpperCase();

    // 6. Eliminar NAC de PILGRIM'S
    if (clienteConsolidado.includes('PILGRIM') && tipoViaje === 'NAC') continue;

    // 7. Clasificar segmento
    const segmentoNegocio = clasificarSegmento(clienteConsolidado, tipoViaje);

    // 8. Asignar ejecutivo
    const ejecutivo = asignarEjecutivo(clienteConsolidado);

    // 9. Calcular ventas
    const subtotalUnificado = parseFloat(row.SubTotalUnificado) || 0;
    const tcFactura = parseFloat(row.TC_Factura) || 1;
    const ventas = Math.round(subtotalUnificado * tcFactura);

    // 10. Parsear fecha
    let fechaFactura = '';
    if (row.FechaFactura) {
      const fecha = new Date(row.FechaFactura);
      if (!isNaN(fecha.getTime())) {
        fechaFactura = fecha.toISOString().split('T')[0];
      }
    }

    viajes.push({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      idViaje,
      fechaFactura,
      cliente,
      clienteCorregido,
      clienteConsolidado,
      tipoViaje,
      segmentoNegocio,
      ejecutivo,
      subtotalUnificado,
      tcFactura,
      ventas,
      origen,
      destino,
      empresa: String(row.Empresa || ''),
      estatusFactura: String(row.EstatusFactura || ''),
      clienteFinal,
      fechaCarga: new Date().toISOString(),
    });
  }

  return viajes;
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

export const VentasModule = ({ onBack }: VentasModuleProps) => {
  const [vista, setVista] = useState<Vista>('dashboard');
  const [ventas, setVentas] = useState<ViajeVenta[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [filtroTiempo, setFiltroTiempo] = useState<FiltroTiempo>('mes');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [filtroEjecutivo, setFiltroEjecutivo] = useState('');
  const [filtroSegmento, setFiltroSegmento] = useState('');
  const [dragOver, setDragOver] = useState(false);

  // Cargar ventas desde Supabase
  useEffect(() => {
    const cargarVentas = async () => {
      try {
        const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/ventas`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        });
        const data = await res.json();
        if (data.success && data.ventas) {
          setVentas(data.ventas);
        }
      } catch (error) {
        console.error('Error cargando ventas:', error);
      } finally {
        setLoading(false);
      }
    };
    cargarVentas();
  }, []);

  // Filtrar ventas por fecha
  const ventasFiltradas = useCallback(() => {
    let filtered = [...ventas];
    const hoy = new Date();
    
    if (filtroTiempo === 'semana') {
      const inicioSemana = new Date(hoy);
      inicioSemana.setDate(hoy.getDate() - hoy.getDay());
      filtered = filtered.filter(v => new Date(v.fechaFactura) >= inicioSemana);
    } else if (filtroTiempo === 'mes') {
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      filtered = filtered.filter(v => new Date(v.fechaFactura) >= inicioMes);
    } else if (filtroTiempo === 'año') {
      const inicioAño = new Date(hoy.getFullYear(), 0, 1);
      filtered = filtered.filter(v => new Date(v.fechaFactura) >= inicioAño);
    } else if (filtroTiempo === 'rango' && fechaInicio && fechaFin) {
      filtered = filtered.filter(v => {
        const fecha = new Date(v.fechaFactura);
        return fecha >= new Date(fechaInicio) && fecha <= new Date(fechaFin);
      });
    }

    if (filtroEjecutivo) {
      filtered = filtered.filter(v => v.ejecutivo === filtroEjecutivo);
    }
    if (filtroSegmento) {
      filtered = filtered.filter(v => v.segmentoNegocio === filtroSegmento);
    }

    return filtered;
  }, [ventas, filtroTiempo, fechaInicio, fechaFin, filtroEjecutivo, filtroSegmento]);

  // Calcular resumen
  const calcularResumen = useCallback((): ResumenVentas => {
    const filtered = ventasFiltradas();
    const resumen: ResumenVentas = {
      totalVentas: 0,
      totalViajes: filtered.length,
      porEjecutivo: {},
      porSegmento: {},
      porCliente: {},
      porMes: {},
    };

    for (const v of filtered) {
      resumen.totalVentas += v.ventas;
      
      // Por ejecutivo
      if (v.ejecutivo) {
        resumen.porEjecutivo[v.ejecutivo] = (resumen.porEjecutivo[v.ejecutivo] || 0) + v.ventas;
      }
      
      // Por segmento
      resumen.porSegmento[v.segmentoNegocio] = (resumen.porSegmento[v.segmentoNegocio] || 0) + v.ventas;
      
      // Por cliente (top 10)
      resumen.porCliente[v.clienteConsolidado] = (resumen.porCliente[v.clienteConsolidado] || 0) + v.ventas;
      
      // Por mes
      const mes = v.fechaFactura.substring(0, 7);
      resumen.porMes[mes] = (resumen.porMes[mes] || 0) + v.ventas;
    }

    return resumen;
  }, [ventasFiltradas]);

  // Manejar upload de archivo
  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('❌ Solo se permiten archivos Excel (.xlsx, .xls)');
      return;
    }

    setUploading(true);
    setUploadProgress('Leyendo archivo...');

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      setUploadProgress(`Procesando ${jsonData.length} registros...`);

      // Procesar con las reglas
      const viajesProcesados = procesarExcel(jsonData);
      
      setUploadProgress(`${viajesProcesados.length} viajes válidos. Verificando duplicados...`);

      // Filtrar duplicados contra los existentes
      const idViajesExistentes = new Set(ventas.map(v => v.idViaje));
      const viajesNuevos = viajesProcesados.filter(v => !idViajesExistentes.has(v.idViaje));

      if (viajesNuevos.length === 0) {
        alert('ℹ️ Todos los viajes ya existen en la base de datos');
        setUploading(false);
        setUploadProgress('');
        return;
      }

      setUploadProgress(`Guardando ${viajesNuevos.length} viajes nuevos...`);

      // Guardar en Supabase
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/ventas`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ viajes: viajesNuevos })
      });

      const result = await res.json();
      
      if (result.success) {
        setVentas(prev => [...prev, ...viajesNuevos]);
        alert(`✅ ${viajesNuevos.length} viajes agregados correctamente\n${viajesProcesados.length - viajesNuevos.length} duplicados omitidos`);
        setVista('dashboard');
      } else {
        throw new Error(result.error || 'Error al guardar');
      }

    } catch (error) {
      console.error('Error procesando archivo:', error);
      alert(`❌ Error: ${error}`);
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const resumen = calcularResumen();
  const topClientes = Object.entries(resumen.porCliente)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════════

  return (
    <ModuleTemplate title="Ventas" onBack={onBack}>
      {/* FONDO GLOBAL AAA - Igual al Panel de Oportunidades */}
      <div 
        className="flex flex-col h-[calc(100vh-120px)] relative"
        style={{
          background: `
            radial-gradient(ellipse 120% 80% at 50% 20%, rgba(37,99,235,0.95) 0%, rgba(30,64,175,0.98) 40%, rgba(15,23,42,1) 100%),
            linear-gradient(180deg, #1e3a8a 0%, #0f172a 100%)
          `,
        }}
      >
        {/* Noise texture overlay */}
        <div 
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            opacity: 0.035,
            mixBlendMode: 'overlay'
          }}
        />
        
        {/* Radial glow */}
        <div 
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            background: `
              radial-gradient(ellipse 70% 50% at 50% 45%, rgba(59,130,246,0.12) 0%, transparent 60%),
              radial-gradient(ellipse 90% 60% at 50% 50%, rgba(30,58,138,0.20) 0%, transparent 70%)
            `
          }}
        />

        {/* BARRA DE NAVEGACIÓN / FILTROS */}
        <div 
          className="flex-shrink-0 mx-4 mt-4 mb-3 p-4 rounded-2xl relative z-10"
          style={{
            background: 'linear-gradient(135deg, rgba(30,58,138,0.60) 0%, rgba(30,64,175,0.50) 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)',
            backdropFilter: 'blur(12px)'
          }}
        >
          <div className="flex flex-wrap gap-3 items-center justify-between">
            {/* TABS DE VISTA */}
            <div className="flex gap-2">
              {(['dashboard', 'upload', 'tabla'] as Vista[]).map(v => (
                <button
                  key={v}
                  onClick={() => setVista(v)}
                  className="px-4 py-2 rounded-xl transition-all duration-150"
                  style={{
                    background: vista === v ? 'linear-gradient(180deg, rgba(59,130,246,0.30) 0%, rgba(37,99,235,0.25) 100%)' : 'transparent',
                    border: vista === v ? '1px solid rgba(59,130,246,0.40)' : '1px solid transparent',
                    color: vista === v ? 'rgba(147,197,253,0.98)' : 'rgba(255,255,255,0.60)',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  {v === 'dashboard' && <><BarChart3 className="w-4 h-4 inline mr-2" />Dashboard</>}
                  {v === 'upload' && <><Upload className="w-4 h-4 inline mr-2" />Subir Excel</>}
                  {v === 'tabla' && <><FileSpreadsheet className="w-4 h-4 inline mr-2" />Datos</>}
                </button>
              ))}
            </div>

            {/* FILTROS DE TIEMPO */}
            {vista === 'dashboard' && (
              <div className="flex gap-2 items-center">
                {(['semana', 'mes', 'año', 'rango'] as FiltroTiempo[]).map(f => (
                  <button
                    key={f}
                    onClick={() => setFiltroTiempo(f)}
                    className="px-3 py-1.5 rounded-lg transition-all duration-150 text-xs font-medium"
                    style={{
                      background: filtroTiempo === f ? 'rgba(255,255,255,0.12)' : 'transparent',
                      border: filtroTiempo === f ? '1px solid rgba(255,255,255,0.15)' : '1px solid transparent',
                      color: filtroTiempo === f ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.50)',
                    }}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
                
                {filtroTiempo === 'rango' && (
                  <div className="flex gap-2 ml-2">
                    <input
                      type="date"
                      value={fechaInicio}
                      onChange={e => setFechaInicio(e.target.value)}
                      className="px-2 py-1 rounded-lg text-xs"
                      style={{
                        background: 'rgba(15,23,42,0.50)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: 'white'
                      }}
                    />
                    <span className="text-white/50">→</span>
                    <input
                      type="date"
                      value={fechaFin}
                      onChange={e => setFechaFin(e.target.value)}
                      className="px-2 py-1 rounded-lg text-xs"
                      style={{
                        background: 'rgba(15,23,42,0.50)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: 'white'
                      }}
                    />
                  </div>
                )}

                {/* Filtro ejecutivo */}
                <select
                  value={filtroEjecutivo}
                  onChange={e => setFiltroEjecutivo(e.target.value)}
                  className="px-3 py-1.5 rounded-lg text-xs"
                  style={{
                    background: 'rgba(15,23,42,0.50)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'white'
                  }}
                >
                  <option value="">Todos los ejecutivos</option>
                  <option value="ISIS ESTRADA">ISIS ESTRADA</option>
                  <option value="PALOMA OLIVO">PALOMA OLIVO</option>
                </select>

                {/* Filtro segmento */}
                <select
                  value={filtroSegmento}
                  onChange={e => setFiltroSegmento(e.target.value)}
                  className="px-3 py-1.5 rounded-lg text-xs"
                  style={{
                    background: 'rgba(15,23,42,0.50)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'white'
                  }}
                >
                  <option value="">Todos los segmentos</option>
                  <option value="IMPEX">IMPEX</option>
                  <option value="DEDICADO">DEDICADO</option>
                </select>
              </div>
            )}

            {/* CONTADOR */}
            <div className="text-white/60 text-sm">
              {ventas.length.toLocaleString()} viajes totales
            </div>
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="flex-1 mx-4 mb-4 overflow-hidden relative z-10">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
          ) : (
            <>
              {/* ═══════════════════════════════════════════════════════════════
                  VISTA: DASHBOARD
                  ═══════════════════════════════════════════════════════════════ */}
              {vista === 'dashboard' && (
                <div className="grid grid-cols-4 gap-4 h-full">
                  {/* TARJETAS KPI */}
                  <div 
                    className="col-span-4 grid grid-cols-4 gap-4"
                  >
                    {/* Total Ventas */}
                    <div 
                      className="p-5 rounded-2xl"
                      style={{
                        background: 'linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(22,163,74,0.10) 100%)',
                        border: '1px solid rgba(34,197,94,0.25)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.20)'
                      }}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <DollarSign className="w-5 h-5 text-green-400" />
                        <span className="text-green-400/70 text-sm font-medium">Total Ventas</span>
                      </div>
                      <div className="text-3xl font-bold text-green-400" style={{ fontFamily: "'Orbitron', monospace" }}>
                        ${resumen.totalVentas.toLocaleString('es-MX')}
                      </div>
                      <div className="text-green-400/50 text-xs mt-1">MXN</div>
                    </div>

                    {/* Total Viajes */}
                    <div 
                      className="p-5 rounded-2xl"
                      style={{
                        background: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.10) 100%)',
                        border: '1px solid rgba(59,130,246,0.25)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.20)'
                      }}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Truck className="w-5 h-5 text-blue-400" />
                        <span className="text-blue-400/70 text-sm font-medium">Total Viajes</span>
                      </div>
                      <div className="text-3xl font-bold text-blue-400" style={{ fontFamily: "'Orbitron', monospace" }}>
                        {resumen.totalViajes.toLocaleString()}
                      </div>
                      <div className="text-blue-400/50 text-xs mt-1">viajes</div>
                    </div>

                    {/* IMPEX */}
                    <div 
                      className="p-5 rounded-2xl"
                      style={{
                        background: 'linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(139,92,246,0.10) 100%)',
                        border: '1px solid rgba(168,85,247,0.25)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.20)'
                      }}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Globe className="w-5 h-5 text-purple-400" />
                        <span className="text-purple-400/70 text-sm font-medium">IMPEX</span>
                      </div>
                      <div className="text-3xl font-bold text-purple-400" style={{ fontFamily: "'Orbitron', monospace" }}>
                        ${(resumen.porSegmento['IMPEX'] || 0).toLocaleString('es-MX')}
                      </div>
                      <div className="text-purple-400/50 text-xs mt-1">MXN</div>
                    </div>

                    {/* DEDICADO */}
                    <div 
                      className="p-5 rounded-2xl"
                      style={{
                        background: 'linear-gradient(135deg, rgba(249,115,22,0.15) 0%, rgba(234,88,12,0.10) 100%)',
                        border: '1px solid rgba(249,115,22,0.25)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.20)'
                      }}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Building2 className="w-5 h-5 text-orange-400" />
                        <span className="text-orange-400/70 text-sm font-medium">DEDICADO</span>
                      </div>
                      <div className="text-3xl font-bold text-orange-400" style={{ fontFamily: "'Orbitron', monospace" }}>
                        ${(resumen.porSegmento['DEDICADO'] || 0).toLocaleString('es-MX')}
                      </div>
                      <div className="text-orange-400/50 text-xs mt-1">MXN</div>
                    </div>
                  </div>

                  {/* TOP CLIENTES */}
                  <div 
                    className="col-span-2 p-5 rounded-2xl overflow-auto"
                    style={{
                      background: 'linear-gradient(180deg, rgba(15,23,42,0.92) 0%, rgba(15,23,42,0.96) 100%)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      boxShadow: '0 12px 40px rgba(0,0,0,0.25)'
                    }}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <Building2 className="w-5 h-5 text-blue-400" />
                      <span className="text-white/90 font-semibold">Top 5 Clientes</span>
                    </div>
                    <div className="space-y-3">
                      {topClientes.map(([cliente, monto], i) => (
                        <div key={cliente} className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center">
                            {i + 1}
                          </span>
                          <span className="flex-1 text-white/80 text-sm truncate">{cliente}</span>
                          <span className="text-green-400 font-semibold text-sm" style={{ fontFamily: "'Orbitron', monospace" }}>
                            ${monto.toLocaleString('es-MX')}
                          </span>
                        </div>
                      ))}
                      {topClientes.length === 0 && (
                        <div className="text-white/40 text-sm text-center py-4">Sin datos</div>
                      )}
                    </div>
                  </div>

                  {/* POR EJECUTIVO */}
                  <div 
                    className="col-span-2 p-5 rounded-2xl"
                    style={{
                      background: 'linear-gradient(180deg, rgba(15,23,42,0.92) 0%, rgba(15,23,42,0.96) 100%)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      boxShadow: '0 12px 40px rgba(0,0,0,0.25)'
                    }}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <Users className="w-5 h-5 text-cyan-400" />
                      <span className="text-white/90 font-semibold">Por Ejecutivo</span>
                    </div>
                    <div className="space-y-4">
                      {Object.entries(resumen.porEjecutivo).map(([ejecutivo, monto]) => (
                        <div key={ejecutivo}>
                          <div className="flex justify-between mb-1">
                            <span className="text-white/70 text-sm">{ejecutivo}</span>
                            <span className="text-cyan-400 font-semibold text-sm" style={{ fontFamily: "'Orbitron', monospace" }}>
                              ${monto.toLocaleString('es-MX')}
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-700/50 overflow-hidden">
                            <div 
                              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                              style={{ width: `${(monto / resumen.totalVentas) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                      {Object.keys(resumen.porEjecutivo).length === 0 && (
                        <div className="text-white/40 text-sm text-center py-4">Sin datos</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════════
                  VISTA: UPLOAD
                  ═══════════════════════════════════════════════════════════════ */}
              {vista === 'upload' && (
                <div className="flex items-center justify-center h-full">
                  <div 
                    className={`w-full max-w-2xl p-12 rounded-3xl text-center transition-all duration-200 ${dragOver ? 'scale-[1.02]' : ''}`}
                    style={{
                      background: dragOver 
                        ? 'linear-gradient(135deg, rgba(59,130,246,0.20) 0%, rgba(37,99,235,0.15) 100%)'
                        : 'linear-gradient(180deg, rgba(15,23,42,0.92) 0%, rgba(15,23,42,0.96) 100%)',
                      border: dragOver 
                        ? '2px dashed rgba(59,130,246,0.60)'
                        : '2px dashed rgba(255,255,255,0.15)',
                      boxShadow: '0 20px 60px rgba(0,0,0,0.30)'
                    }}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                  >
                    {uploading ? (
                      <div className="space-y-4">
                        <Loader2 className="w-16 h-16 text-blue-400 animate-spin mx-auto" />
                        <div className="text-white/90 text-lg font-medium">{uploadProgress}</div>
                      </div>
                    ) : (
                      <>
                        <FileSpreadsheet className="w-20 h-20 text-blue-400/60 mx-auto mb-6" />
                        <h3 className="text-white/90 text-xl font-semibold mb-2">
                          Arrastra tu archivo Excel aquí
                        </h3>
                        <p className="text-white/50 text-sm mb-6">
                          o haz clic para seleccionar archivo
                        </p>
                        <input
                          type="file"
                          accept=".xlsx,.xls"
                          className="hidden"
                          id="excel-upload"
                          onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                        />
                        <label
                          htmlFor="excel-upload"
                          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl cursor-pointer transition-all duration-150 hover:-translate-y-0.5"
                          style={{
                            background: 'linear-gradient(180deg, rgba(59,130,246,0.30) 0%, rgba(37,99,235,0.25) 100%)',
                            border: '1px solid rgba(59,130,246,0.40)',
                            color: 'rgba(147,197,253,0.98)',
                            fontSize: '14px',
                            fontWeight: 600,
                          }}
                        >
                          <Upload className="w-5 h-5" />
                          Seleccionar archivo
                        </label>
                        <div className="mt-8 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                            <div className="text-left">
                              <div className="text-amber-400/90 text-sm font-medium mb-1">Columnas requeridas:</div>
                              <div className="text-amber-400/60 text-xs">
                                idViaje, Cliente, ClienteFinal, Origen, Destino, TipoViaje, SubTotalUnificado, TC_Factura, FechaFactura, EstatusFactura, Empresa
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════════
                  VISTA: TABLA
                  ═══════════════════════════════════════════════════════════════ */}
              {vista === 'tabla' && (
                <div 
                  className="h-full rounded-2xl overflow-hidden"
                  style={{
                    background: 'linear-gradient(180deg, rgba(15,23,42,0.92) 0%, rgba(15,23,42,0.96) 100%)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.25)'
                  }}
                >
                  <div className="overflow-auto h-full">
                    <table className="w-full">
                      <thead className="sticky top-0 z-10" style={{ background: 'rgba(15,23,42,0.98)' }}>
                        <tr>
                          {['Fecha', 'ID Viaje', 'Cliente', 'Segmento', 'Ejecutivo', 'Ventas'].map(col => (
                            <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-white/60 border-b border-white/10">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {ventasFiltradas().slice(0, 100).map((v, i) => (
                          <tr 
                            key={v.id} 
                            className="transition-colors hover:bg-white/5"
                            style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}
                          >
                            <td className="px-4 py-3 text-sm text-white/70">{v.fechaFactura}</td>
                            <td className="px-4 py-3 text-sm text-white/50 font-mono text-xs">{v.idViaje}</td>
                            <td className="px-4 py-3 text-sm text-white/90">{v.clienteConsolidado}</td>
                            <td className="px-4 py-3">
                              <span 
                                className="px-2 py-1 rounded-full text-xs font-medium"
                                style={{
                                  background: v.segmentoNegocio === 'IMPEX' ? 'rgba(168,85,247,0.20)' : 'rgba(249,115,22,0.20)',
                                  color: v.segmentoNegocio === 'IMPEX' ? 'rgba(192,132,252,0.95)' : 'rgba(251,146,60,0.95)',
                                }}
                              >
                                {v.segmentoNegocio}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-white/60">{v.ejecutivo || '-'}</td>
                            <td className="px-4 py-3 text-sm text-green-400 font-semibold" style={{ fontFamily: "'Orbitron', monospace" }}>
                              ${v.ventas.toLocaleString('es-MX')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {ventasFiltradas().length === 0 && (
                      <div className="text-center py-12 text-white/40">
                        No hay datos para mostrar
                      </div>
                    )}
                    {ventasFiltradas().length > 100 && (
                      <div className="text-center py-4 text-white/40 text-sm">
                        Mostrando 100 de {ventasFiltradas().length} registros
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ModuleTemplate>
  );
};
