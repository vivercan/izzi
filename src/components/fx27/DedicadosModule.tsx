import { useState } from 'react';
import { Truck, ArrowLeft, AlertTriangle, PackageX, Package, CheckCircle, Download, Camera, Clock2, Droplets, AlertCircle, Wrench, FileText, X } from 'lucide-react';

interface DedicadosModuleProps {
  onBack: () => void;
}

type EstadoUnidad = 'Lavado' | 'Origen' | 'Tránsito' | 'Destino' | 'Regresando';
type TipoTemperatura = 'Refrigerado' | 'Congelado';
type EstadoRegreso = 'Vacío - Thermo Apagado' | 'Cargado - Refrigerado' | 'Devolución - Thermo Activo';
type StatusEntrega = 'On Time' | 'Delayed' | 'Early';
type EvidenciaStatus = 'Sin Evidencia' | 'Pendiente' | 'Completa' | 'Vencida';

interface Unidad {
  id: string;
  numeroTracto: string;
  numeroRemolque: string;
  operador: string;
  destino: string;
  origen: string;
  eta: string;
  fechaSalida: string;
  fechaFinalizacion?: Date;
  estado: EstadoUnidad;
  ruta: string;
  carga: string;
  tipoTemperatura: TipoTemperatura;
  temperaturaActual: number;
  temperaturaObjetivo: number;
  alertaTemperatura: boolean;
  distanciaKm: number;
  tiempoTransito: string;
  estadoRegreso?: EstadoRegreso;
  ubicacionActual: string;
  progreso: number;
  statusEntrega: StatusEntrega;
  minutosVariacion: number;
  tiempoRestante: string;
  velocidadPromedio: number;
  ultimaActualizacion: string;
  tiempoIdaOriginal?: string;
  tiempoTranscurrido?: string;
  dentroDeTiempoObjetivo?: boolean;
  horaCita?: string;
  evidenciaStatus?: EvidenciaStatus;
  horasDesdeFinalizacion?: number;
}

// 🚚 DATOS REALES DE GRANJAS CARROLL
const TRACTOCAMIONES_REALES = ['933', '212', '785', '765', '196', '208', '813', '126', '809', '859', '777', '891', '948', '932', '939', '755', '776', '862', '920', '925', '844', '806', '898', '912', '886', '948', '842', '850', '901', '915'];

const THERMOS_REALES = ['1329', '838B-13', '1340', 'R18855', 'B38139', '1282', '1280', 'R18656', '28854', '1414', '1996', '1388', '1290', '1398', '1324', '1312', '842', '5013', '1016', '1276', '1922', 'R18432', '1256', 'B38200', '1445', '1501', 'R18700', '1335', '1299', '1411'];

const OPERADORES_REALES = [
  'RICARDO CARRILLO GARCÍA',
  'LUIS ÁNGEL MONTAÑO NÚÑEZ',
  'MARCELO SÁNCHEZ RODRIGUEZ',
  'ARTURO ALCÁNTARA DÍAZ',
  'HÉCTOR SILVA OPIA',
  'FEDERICO ALBERTO GUZMÁN',
  'FERNANDO GUZMÁN ISIDRO',
  'JORGE DANIEL DÍAZ DÍAZ',
  'ENRIQUE URBÁN FLORES',
  'EDDIE ALONSO VÁZQUEZ CRUZ',
  'OCTAVIO VILLEGAS TINOCO',
  'JUAN FRANCISCO LUCIO PALACIOS',
  'RAÚL PÉREZ SOTO',
  'JULIO ENRIQUE ARELLANO PÉREZ'
];

const CLIENTES_REALES = [
  { nombre: 'CEDIS Walmart', ciudad: 'Monterrey, NL', distancia: 789, tiempo: '16h 15m' },
  { nombre: 'Central de Abastos', ciudad: 'CDMX', distancia: 280, tiempo: '5h 45m' },
  { nombre: 'CEDIS Soriana', ciudad: 'Guadalajara, JAL', distancia: 620, tiempo: '12h 30m' },
  { nombre: 'CEDIS Chedraui', ciudad: 'Veracruz, VER', distancia: 95, tiempo: '2h 15m' },
  { nombre: 'WM Aguascalientes', ciudad: 'Aguascalientes, AGS', distancia: 540, tiempo: '11h 0m' },
  { nombre: 'CEDIS HEB', ciudad: 'San Luis Potosí, SLP', distancia: 450, tiempo: '9h 15m' },
  { nombre: 'Empacadora Chiapas', ciudad: 'Tuxtla Gutiérrez, CHIS', distancia: 780, tiempo: '16h 0m' },
  { nombre: 'Central de Abastos Puebla', ciudad: 'Puebla, PUE', distancia: 40, tiempo: '1h 0m' },
  { nombre: 'CEDIS Costco', ciudad: 'Querétaro, QRO', distancia: 380, tiempo: '7h 50m' },
  { nombre: 'CEDIS La Comer', ciudad: 'León, GTO', distancia: 460, tiempo: '9h 30m' },
  { nombre: 'Loma Bonita', ciudad: 'Oaxaca, OAX', distancia: 535, tiempo: '11h 0m' },
  { nombre: 'La Providencia', ciudad: 'Hidalgo, HGO', distancia: 60, tiempo: '1h 30m' },
  { nombre: 'Santa Bárbara', ciudad: 'Jalisco, JAL', distancia: 620, tiempo: '12h 30m' },
  { nombre: 'Calimax Tijuana', ciudad: 'Tijuana, BC', distancia: 2850, tiempo: '36h 0m' },
  { nombre: 'JAL JAMES', ciudad: 'Guadalajara, JAL', distancia: 620, tiempo: '12h 30m' }
];

const ORIGEN_REAL = 'Granjas Carroll - Oriental, Puebla';

const calcularTiempoRestante = (progreso: number, tiempoTotal: string): string => {
  const match = tiempoTotal.match(/(\d+)h\s*(\d+)m/);
  if (!match) return '0h 0m';
  
  const horas = parseInt(match[1]);
  const minutos = parseInt(match[2]);
  const totalMinutos = (horas * 60) + minutos;
  const minutosRestantes = Math.floor(totalMinutos * (1 - progreso / 100));
  
  const horasRestantes = Math.floor(minutosRestantes / 60);
  const minsRestantes = minutosRestantes % 60;
  
  return `${horasRestantes}h ${minsRestantes}m`;
};

const calcularEvidenciaStatus = (estado: EstadoUnidad, fechaFinalizacion?: Date): EvidenciaStatus => {
  if (estado !== 'Destino') return 'Sin Evidencia';
  if (!fechaFinalizacion) return 'Sin Evidencia';
  
  const horasTranscurridas = (Date.now() - fechaFinalizacion.getTime()) / (1000 * 60 * 60);
  
  const randomChance = Math.random();
  if (horasTranscurridas > 24) return 'Vencida';
  if (horasTranscurridas > 2) {
    return randomChance > 0.3 ? 'Completa' : 'Pendiente';
  }
  return randomChance > 0.5 ? 'Completa' : 'Pendiente';
};

const generarUnidades = (): Unidad[] => {
  const unidades: Unidad[] = [];
  
  for (let i = 0; i < 15; i++) {
    const cliente = CLIENTES_REALES[i % CLIENTES_REALES.length];
    const estadosEntrega: EstadoUnidad[] = ['Lavado', 'Origen', 'Tránsito', 'Destino'];
    const estado = estadosEntrega[Math.floor(Math.random() * estadosEntrega.length)];
    
    const tipoTemp: TipoTemperatura = Math.random() > 0.5 ? 'Refrigerado' : 'Congelado';
    const tempObjetivo = tipoTemp === 'Congelado' ? -18 : 4;
    const tempActual = tempObjetivo + (Math.random() * 3 - 1.5);
    const alertaTemp = Math.abs(tempActual - tempObjetivo) > 2.5;
    
    const progreso = estado === 'Lavado' ? 0 : 
                     estado === 'Origen' ? Math.floor(Math.random() * 10) :
                     estado === 'Tránsito' ? Math.floor(Math.random() * 60) + 20 : 
                     100;
    
    const cargasTipo = ['Mix Cárnicos Congelados', 'Res Refrigerada', 'Cerdo Congelado', 'Pollo Refrigerado'];
    const carga = cargasTipo[Math.floor(Math.random() * cargasTipo.length)];
    
    const ubicaciones = ['En Origen', 'En Carretera', `Cerca de ${cliente.ciudad}`, `En ${cliente.ciudad}`];
    const ubicacionActual = progreso < 20 ? ubicaciones[0] : progreso < 60 ? ubicaciones[1] : progreso < 85 ? ubicaciones[2] : ubicaciones[3];
    
    const statusRandom = Math.random();
    const statusEntrega: StatusEntrega = statusRandom > 0.7 ? 'On Time' : statusRandom > 0.15 ? 'Early' : 'Delayed';
    const minutosVariacion = statusEntrega === 'On Time' ? 0 : statusEntrega === 'Early' ? -Math.floor(Math.random() * 30) : Math.floor(Math.random() * 45) + 15;
    
    const tiempoRestante = calcularTiempoRestante(progreso, cliente.tiempo);
    const velocidadPromedio = Math.floor(Math.random() * 20) + 65;
    const minutosAtras = Math.floor(Math.random() * 15) + 1;
    const ultimaActualizacion = `${minutosAtras}m`;
    
    const fechaFinalizacion = estado === 'Destino' ? new Date(Date.now() - Math.random() * 30 * 60 * 60 * 1000) : undefined;
    const evidenciaStatus = calcularEvidenciaStatus(estado, fechaFinalizacion);
    const horasDesdeFinalizacion = fechaFinalizacion ? (Date.now() - fechaFinalizacion.getTime()) / (1000 * 60 * 60) : undefined;
    
    // Calcular CITA para ENTREGAS
    const match = cliente.tiempo.match(/(\d+)h\s*(\d+)m/);
    const horasViaje = match ? parseInt(match[1]) : 0;
    const minutosViaje = match ? parseInt(match[2]) : 0;
    const totalMinutosViaje = (horasViaje * 60) + minutosViaje;
    
    const fechaSalidaDate = new Date(Date.now() - Math.random() * 21600000);
    const horaCitaDate = new Date(fechaSalidaDate.getTime() + (totalMinutosViaje * 60 * 1000));
    const horaCita = horaCitaDate.toLocaleString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
    unidades.push({
      id: `E-${String(i + 1).padStart(3, '0')}`,
      numeroTracto: TRACTOCAMIONES_REALES[i],
      numeroRemolque: THERMOS_REALES[i],
      operador: OPERADORES_REALES[i % OPERADORES_REALES.length],
      destino: `${cliente.nombre} - ${cliente.ciudad}`,
      origen: ORIGEN_REAL,
      eta: new Date(Date.now() + Math.random() * 86400000).toLocaleString('es-MX', { 
        day: '2-digit',
        month: 'short', 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
      }),
      fechaSalida: new Date(Date.now() - Math.random() * 43200000).toLocaleString('es-MX', { 
        day: '2-digit',
        month: 'short', 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
      }),
      fechaFinalizacion,
      estado,
      ruta: `Oriental → ${cliente.ciudad}`,
      carga,
      tipoTemperatura: tipoTemp,
      temperaturaActual: tempActual,
      temperaturaObjetivo: tempObjetivo,
      alertaTemperatura: alertaTemp,
      distanciaKm: cliente.distancia,
      tiempoTransito: cliente.tiempo,
      ubicacionActual,
      progreso,
      statusEntrega,
      minutosVariacion,
      tiempoRestante,
      velocidadPromedio,
      ultimaActualizacion,
      evidenciaStatus,
      horasDesdeFinalizacion,
      horaCita
    });
  }
  
  for (let i = 0; i < 15; i++) {
    const cliente = CLIENTES_REALES[i % CLIENTES_REALES.length];
    const estadosRegreso: EstadoRegreso[] = [
      'Vacío - Thermo Apagado', 
      'Cargado - Refrigerado', 
      'Devolución - Thermo Activo'
    ];
    const estadoRegreso = estadosRegreso[Math.floor(Math.random() * estadosRegreso.length)];
    
    const tempObjetivo = estadoRegreso === 'Vacío - Thermo Apagado' ? 0 : 
                         estadoRegreso === 'Devolución - Thermo Activo' ? 4 : -18;
    const tempActual = estadoRegreso === 'Vacío - Thermo Apagado' ? 
                       Math.random() * 10 + 15 :
                       tempObjetivo + (Math.random() * 2 - 1);
    
    const alertaTemp = estadoRegreso !== 'Vacío - Thermo Apagado' && Math.abs(tempActual - tempObjetivo) > 2;
    const progreso = Math.floor(Math.random() * 60) + 20;
    
    const carga = estadoRegreso === 'Vacío - Thermo Apagado' ? 'Vacío' :
                  estadoRegreso === 'Cargado - Refrigerado' ? 'Mix Cárnicos Retorno' :
                  'Producto Devuelto (Quality)';
    
    const match = cliente.tiempo.match(/(\d+)h\s*(\d+)m/);
    const horasIda = match ? parseInt(match[1]) : 0;
    const minutosIda = match ? parseInt(match[2]) : 0;
    const totalMinutosIda = (horasIda * 60) + minutosIda;
    
    const minutosTranscurridos = Math.floor((totalMinutosIda * progreso / 100) * (0.9 + Math.random() * 0.3));
    const horasTranscurridas = Math.floor(minutosTranscurridos / 60);
    const minsTranscurridos = minutosTranscurridos % 60;
    const tiempoTranscurrido = `${horasTranscurridas}h ${minsTranscurridos}m`;
    
    const porcentajeObjetivo = 1.20;
    const tiempoObjetivoMinutos = Math.floor(totalMinutosIda * porcentajeObjetivo);
    
    const dentroDeTiempoObjetivo = minutosTranscurridos <= tiempoObjetivoMinutos;
    
    let statusEntrega: StatusEntrega;
    if (dentroDeTiempoObjetivo && minutosTranscurridos < totalMinutosIda) {
      statusEntrega = 'Early';
    } else if (dentroDeTiempoObjetivo) {
      statusEntrega = 'On Time';
    } else {
      statusEntrega = 'Delayed';
    }
    
    const minutosVariacion = statusEntrega === 'On Time' ? 0 : 
                             statusEntrega === 'Early' ? Math.floor(totalMinutosIda - minutosTranscurridos) : 
                             Math.floor(minutosTranscurridos - tiempoObjetivoMinutos);
    
    const tiempoRestante = calcularTiempoRestante(progreso, cliente.tiempo);
    const velocidadPromedio = Math.floor(Math.random() * 20) + 65;
    const minutosAtras = Math.floor(Math.random() * 15) + 1;
    const ultimaActualizacion = `${minutosAtras}m`;
    
    const fechaSalidaDate = new Date(Date.now() - Math.random() * 21600000);
    const horaCitaDate = new Date(fechaSalidaDate.getTime() + (tiempoObjetivoMinutos * 60 * 1000));
    const horaCita = horaCitaDate.toLocaleString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
    unidades.push({
      id: `R-${String(i + 1).padStart(3, '0')}`,
      numeroTracto: TRACTOCAMIONES_REALES[(i + 15) % 30],
      numeroRemolque: THERMOS_REALES[(i + 15) % 30],
      operador: OPERADORES_REALES[i % OPERADORES_REALES.length],
      destino: ORIGEN_REAL,
      origen: `${cliente.nombre} - ${cliente.ciudad}`,
      eta: new Date(Date.now() + Math.random() * 86400000).toLocaleString('es-MX', { 
        day: '2-digit',
        month: 'short', 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
      }),
      fechaSalida: new Date(Date.now() - Math.random() * 21600000).toLocaleString('es-MX', { 
        day: '2-digit',
        month: 'short', 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
      }),
      estado: 'Regresando',
      ruta: `${cliente.ciudad} → Oriental`,
      carga,
      tipoTemperatura: estadoRegreso === 'Vacío - Thermo Apagado' ? 'Refrigerado' : 
                       estadoRegreso === 'Devolución - Thermo Activo' ? 'Refrigerado' : 'Congelado',
      temperaturaActual: tempActual,
      temperaturaObjetivo: tempObjetivo,
      alertaTemperatura: alertaTemp,
      distanciaKm: cliente.distancia,
      tiempoTransito: cliente.tiempo,
      estadoRegreso,
      ubicacionActual: `Regresando - ${progreso}% completado`,
      progreso,
      statusEntrega,
      minutosVariacion,
      tiempoRestante,
      velocidadPromedio,
      ultimaActualizacion,
      tiempoIdaOriginal: cliente.tiempo,
      tiempoTranscurrido,
      dentroDeTiempoObjetivo,
      horaCita
    });
  }
  
  return unidades;
};

const UNIDADES_INICIALES = generarUnidades();

export const DedicadosModule = ({ onBack }: DedicadosModuleProps) => {
  const [unidades, setUnidades] = useState<Unidad[]>(UNIDADES_INICIALES);
  const [vistaActiva, setVistaActiva] = useState<'entregas' | 'regresos'>('entregas');
  const [filtroStatus, setFiltroStatus] = useState<'all' | 'ontime' | 'delayed' | 'early'>('all');
  const [mostrarEvidencias, setMostrarEvidencias] = useState(false);

  const getTempColor = (actual: number, objetivo: number, alerta: boolean) => {
    if (alerta) return '#DC2626';
    if (Math.abs(actual - objetivo) < 1) return '#059669';
    return '#D97706';
  };

  const handleDescargarReporte = () => {
    const data = unidadesActivas.map(u => ({
      Unidad: `${u.numeroTracto}/${u.numeroRemolque}`,
      Operador: u.operador,
      Destino: u.destino,
      Estado: u.estado,
      Temperatura: `${u.temperaturaActual.toFixed(1)}°C`,
      Status: u.statusEntrega,
      Progreso: `${u.progreso}%`,
      Velocidad: `${u.velocidadPromedio} km/h`
    }));
    
    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `carroll-${vistaActiva}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const entregas = unidades.filter(u => u.id.startsWith('E-'));
  const regresos = unidades.filter(u => u.id.startsWith('R-'));

  const evidenciasPendientes = unidades.filter(u => 
    u.evidenciaStatus === 'Pendiente' || u.evidenciaStatus === 'Vencida'
  ).length;
  
  const evidenciasCompletas = unidades.filter(u => 
    u.evidenciaStatus === 'Completa'
  );

  const aplicarFiltroStatus = (unidades: Unidad[]) => {
    if (filtroStatus === 'all') return unidades;
    if (filtroStatus === 'ontime') return unidades.filter(u => u.statusEntrega === 'On Time');
    if (filtroStatus === 'delayed') return unidades.filter(u => u.statusEntrega === 'Delayed');
    if (filtroStatus === 'early') return unidades.filter(u => u.statusEntrega === 'Early');
    return unidades;
  };

  const unidadesActivas = vistaActiva === 'entregas' ? aplicarFiltroStatus(entregas) : aplicarFiltroStatus(regresos);

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0056B8 0%, #0B84FF 100%)' }}>
      <div className="sticky top-0 z-10 bg-white/95 border-b border-slate-200 backdrop-blur-md shadow-sm">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-orange-500 transition-all duration-200 cursor-pointer group"
            >
              <ArrowLeft className="w-5 h-5 stroke-[3] group-hover:scale-110 transition-transform" />
            </button>
            
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-slate-900" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '18px', fontWeight: 900, letterSpacing: '0.5px', lineHeight: '1' }}>
                  CARROLL
                </h1>
                <p className="text-slate-500" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px', lineHeight: '1.2' }}>
                  Granjas Carroll • Oriental, Puebla
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-emerald-600" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '22px', fontWeight: 900, lineHeight: '1' }}>
                {entregas.length}
              </div>
              <div className="text-slate-500" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '9px', fontWeight: 700, letterSpacing: '0.5px', lineHeight: '1.2' }}>
                ENTREGAS
              </div>
            </div>
            <div className="text-center">
              <div className="text-purple-600" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '22px', fontWeight: 900, lineHeight: '1' }}>
                {regresos.length}
              </div>
              <div className="text-slate-500" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '9px', fontWeight: 700, letterSpacing: '0.5px', lineHeight: '1.2' }}>
                REGRESOS
              </div>
            </div>
            <div className="text-center">
              <div className="text-red-600" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '22px', fontWeight: 900, lineHeight: '1' }}>
                {unidades.filter(u => u.alertaTemperatura).length}
              </div>
              <div className="text-slate-500" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '9px', fontWeight: 700, letterSpacing: '0.5px', lineHeight: '1.2' }}>
                ALERTAS
              </div>
            </div>
            <div 
              className="text-center cursor-pointer hover:bg-amber-50 rounded-lg px-3 py-1 transition-colors"
              onClick={() => setMostrarEvidencias(true)}
            >
              <div className="text-amber-600" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '22px', fontWeight: 900, lineHeight: '1' }}>
                {evidenciasPendientes}
              </div>
              <div className="text-slate-500" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '9px', fontWeight: 700, letterSpacing: '0.5px', lineHeight: '1.2' }}>
                EVIDENCIAS PENDIENTES
              </div>
            </div>
            <div className="text-center">
              <div className="text-blue-600" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '22px', fontWeight: 900, lineHeight: '1' }}>
                30
              </div>
              <div className="text-slate-500" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '9px', fontWeight: 700, letterSpacing: '0.5px', lineHeight: '1.2' }}>
                FLOTA
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-2 flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
            <button
              onClick={() => setVistaActiva('entregas')}
              className={`px-3 py-1 rounded-md transition-all ${
                vistaActiva === 'entregas'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 700, lineHeight: '1' }}
            >
              ↑ Entregas
            </button>
            <button
              onClick={() => setVistaActiva('regresos')}
              className={`px-3 py-1 rounded-md transition-all ${
                vistaActiva === 'regresos'
                  ? 'bg-purple-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 700, lineHeight: '1' }}
            >
              ↓ Regresos
            </button>
          </div>

          <div className="h-5 w-px bg-slate-300"></div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setFiltroStatus('all')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                filtroStatus === 'all'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px', fontWeight: 700, lineHeight: '1' }}
            >
              Todos
            </button>
            <button
              onClick={() => setFiltroStatus('ontime')}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                filtroStatus === 'ontime'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
              style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px', fontWeight: 700, lineHeight: '1' }}
            >
              <CheckCircle className="w-2.5 h-2.5" />
              On Time
            </button>
            <button
              onClick={() => setFiltroStatus('delayed')}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                filtroStatus === 'delayed'
                  ? 'bg-red-500 text-white shadow-sm'
                  : 'bg-red-50 text-red-700 hover:bg-red-100'
              }`}
              style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px', fontWeight: 700, lineHeight: '1' }}
            >
              <AlertTriangle className="w-2.5 h-2.5" />
              Delayed
            </button>
            <button
              onClick={() => setFiltroStatus('early')}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                filtroStatus === 'early'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
              style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px', fontWeight: 700, lineHeight: '1' }}
            >
              <CheckCircle className="w-2.5 h-2.5" />
              Early
            </button>
          </div>

          <div className="h-5 w-px bg-slate-300"></div>

          <button
            onClick={handleDescargarReporte}
            className="px-3 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-sm"
            style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px', fontWeight: 700, lineHeight: '1' }}
          >
            <Download className="w-3 h-3" />
            Descargar CSV
          </button>

          <div className="ml-auto text-slate-500" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 600 }}>
            {unidadesActivas.length} unidades
          </div>
        </div>
      </div>

      <div className="p-5">
        {vistaActiva === 'entregas' ? (
          <div className="bg-white shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-4 py-2 border-b border-slate-200 bg-gradient-to-r from-emerald-50 to-white">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-600" />
                <h2 className="text-slate-800" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 700, letterSpacing: '0.3px', lineHeight: '1' }}>
                  ENTREGAS EN CURSO
                </h2>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-2 text-left text-slate-600" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px', lineHeight: '1' }}>UNIDAD</th>
                    <th className="px-4 py-2 text-left text-slate-600" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px', lineHeight: '1' }}>OPERADOR</th>
                    <th className="px-4 py-2 text-left text-slate-600" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px', lineHeight: '1' }}>DESTINO</th>
                    <th className="px-4 py-2 text-center text-slate-600" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px', lineHeight: '1' }}>TEMP</th>
                    <th className="px-4 py-2 text-center text-slate-600" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px', lineHeight: '1' }}>ESTADO</th>
                    <th className="px-4 py-2 text-center text-slate-600" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px', lineHeight: '1' }}>CITA</th>
                    <th className="px-4 py-2 text-center text-slate-600" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px', lineHeight: '1' }}>STATUS</th>
                    <th className="px-4 py-2 text-center text-slate-600" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px', lineHeight: '1' }}>%</th>
                  </tr>
                </thead>
                <tbody>
                  {unidadesActivas.map((unidad, idx) => (
                    <tr 
                      key={unidad.id} 
                      className={`border-b border-slate-100 hover:bg-blue-50/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}
                    >
                      <td className="px-4 py-2">
                        <div className="text-slate-900" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 700, lineHeight: '1.2' }}>
                          {unidad.numeroTracto}
                        </div>
                        <div className="text-slate-500" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px', lineHeight: '1.2' }}>
                          {unidad.numeroRemolque}
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="text-slate-700" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 600, lineHeight: '1.3' }}>
                          {unidad.operador}
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="text-slate-800" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px', fontWeight: 600, lineHeight: '1.2' }}>
                          {unidad.destino.split(' - ')[0]}
                        </div>
                        <div className="text-blue-600" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px', lineHeight: '1.2' }}>
                          {unidad.distanciaKm} km • {unidad.tiempoRestante}
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex flex-col items-center">
                          <div 
                            className="font-bold" 
                            style={{ 
                              fontFamily: "'Exo 2', sans-serif", 
                              fontSize: '16px', 
                              fontWeight: 900,
                              lineHeight: '1',
                              color: getTempColor(unidad.temperaturaActual, unidad.temperaturaObjetivo, unidad.alertaTemperatura)
                            }}
                          >
                            {unidad.temperaturaActual.toFixed(1)}°
                          </div>
                          <div className="text-slate-400" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '9px', lineHeight: '1.2' }}>
                            obj {unidad.temperaturaObjetivo}°
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span className={`inline-flex items-center justify-center px-3 py-1.5 rounded-md font-bold min-w-[75px] ${
                          unidad.estado === 'Lavado' ? 'bg-cyan-100 text-cyan-700' :
                          unidad.estado === 'Origen' ? 'bg-orange-100 text-orange-700' :
                          unidad.estado === 'Tránsito' ? 'bg-blue-100 text-blue-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`} style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 700, lineHeight: '1' }}>
                          {unidad.estado}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex flex-col items-center">
                          <div className="text-indigo-700" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', fontWeight: 900, lineHeight: '1' }}>
                            {unidad.horaCita}
                          </div>
                          <div className="text-slate-400" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '9px', lineHeight: '1.2' }}>
                            ETA estimado
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        {unidad.statusEntrega === 'On Time' ? (
                          <div className="flex items-center justify-center gap-1 px-2.5 py-1 rounded-md bg-emerald-100">
                            <CheckCircle className="w-3 h-3 text-emerald-700" />
                            <span className="text-emerald-700" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 700, lineHeight: '1' }}>
                              On Time
                            </span>
                          </div>
                        ) : unidad.statusEntrega === 'Early' ? (
                          <div className="flex items-center justify-center gap-1 px-2.5 py-1 rounded-md bg-blue-100">
                            <CheckCircle className="w-3 h-3 text-blue-700" />
                            <span className="text-blue-700" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 700, lineHeight: '1' }}>
                              Early
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1 px-2.5 py-1 rounded-md bg-red-100">
                            <AlertTriangle className="w-3 h-3 text-red-700" />
                            <span className="text-red-700" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 700, lineHeight: '1' }}>
                              Delayed
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <div className="text-slate-900" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '16px', fontWeight: 900, lineHeight: '1' }}>
                          {unidad.progreso}%
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-4 py-2 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-white">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-purple-600 rotate-180" />
                <h2 className="text-slate-800" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 700, letterSpacing: '0.3px', lineHeight: '1' }}>
                  REGRESOS A PLANTA
                </h2>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-2 text-left text-slate-600" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px', lineHeight: '1' }}>UNIDAD</th>
                    <th className="px-4 py-2 text-left text-slate-600" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px', lineHeight: '1' }}>OPERADOR</th>
                    <th className="px-4 py-2 text-left text-slate-600" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px', lineHeight: '1' }}>DESDE</th>
                    <th className="px-4 py-2 text-left text-slate-600" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px', lineHeight: '1' }}>ESTADO</th>
                    <th className="px-4 py-2 text-center text-slate-600" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px', lineHeight: '1' }}>TEMP</th>
                    <th className="px-4 py-2 text-center text-slate-600" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px', lineHeight: '1' }}>CITA</th>
                    <th className="px-4 py-2 text-center text-slate-600" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px', lineHeight: '1' }}>STATUS</th>
                    <th className="px-4 py-2 text-center text-slate-600" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px', lineHeight: '1' }}>%</th>
                  </tr>
                </thead>
                <tbody>
                  {unidadesActivas.map((unidad, idx) => (
                    <tr 
                      key={unidad.id} 
                      className={`border-b border-slate-100 hover:bg-purple-50/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}
                    >
                      <td className="px-4 py-2">
                        <div className="text-slate-900" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 700, lineHeight: '1.2' }}>
                          {unidad.numeroTracto}
                        </div>
                        <div className="text-slate-500" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px', lineHeight: '1.2' }}>
                          {unidad.numeroRemolque}
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="text-slate-700" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 600, lineHeight: '1.3' }}>
                          {unidad.operador}
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="text-slate-800" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px', fontWeight: 600, lineHeight: '1.2' }}>
                          {unidad.origen.split(' - ')[0]}
                        </div>
                        <div className="text-purple-600" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px', lineHeight: '1.2' }}>
                          {unidad.distanciaKm} km • {unidad.tiempoRestante}
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1.5">
                          {unidad.estadoRegreso === 'Vacío - Thermo Apagado' ? (
                            <>
                              <PackageX className="w-3.5 h-3.5 text-slate-400" />
                              <div>
                                <div className="text-slate-600" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 700, lineHeight: '1.2' }}>
                                  Vacío
                                </div>
                                <div className="text-slate-400" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '9px', lineHeight: '1.2' }}>
                                  Thermo Off
                                </div>
                              </div>
                            </>
                          ) : unidad.estadoRegreso === 'Cargado - Refrigerado' ? (
                            <>
                              <Package className="w-3.5 h-3.5 text-blue-600" />
                              <div>
                                <div className="text-blue-700" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 700, lineHeight: '1.2' }}>
                                  Cargado
                                </div>
                                <div className="text-slate-400" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '9px', lineHeight: '1.2' }}>
                                  Refrigerado
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                              <div>
                                <div className="text-amber-700" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 700, lineHeight: '1.2' }}>
                                  Devolución
                                </div>
                                <div className="text-slate-400" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '9px', lineHeight: '1.2' }}>
                                  Thermo On
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex flex-col items-center">
                          <div 
                            className="font-bold" 
                            style={{ 
                              fontFamily: "'Exo 2', sans-serif", 
                              fontSize: '16px', 
                              fontWeight: 900,
                              lineHeight: '1',
                              color: unidad.estadoRegreso === 'Vacío - Thermo Apagado' ? '#64748B' : getTempColor(unidad.temperaturaActual, unidad.temperaturaObjetivo, unidad.alertaTemperatura)
                            }}
                          >
                            {unidad.temperaturaActual.toFixed(1)}°
                          </div>
                          {unidad.estadoRegreso !== 'Vacío - Thermo Apagado' && (
                            <div className="text-slate-400" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '9px', lineHeight: '1.2' }}>
                              obj {unidad.temperaturaObjetivo}°
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex flex-col items-center">
                          <div className="text-indigo-700" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', fontWeight: 900, lineHeight: '1' }}>
                            {unidad.horaCita}
                          </div>
                          <div className="text-slate-400" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '9px', lineHeight: '1.2' }}>
                            +20% objetivo
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        {unidad.statusEntrega === 'On Time' ? (
                          <div className="flex items-center justify-center gap-1 px-2.5 py-1 rounded-md bg-emerald-100">
                            <CheckCircle className="w-3 h-3 text-emerald-700" />
                            <span className="text-emerald-700" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 700, lineHeight: '1' }}>
                              On Time
                            </span>
                          </div>
                        ) : unidad.statusEntrega === 'Early' ? (
                          <div className="flex items-center justify-center gap-1 px-2.5 py-1 rounded-md bg-blue-100">
                            <CheckCircle className="w-3 h-3 text-blue-700" />
                            <span className="text-blue-700" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 700, lineHeight: '1' }}>
                              Early {Math.abs(unidad.minutosVariacion)}m
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1 px-2.5 py-1 rounded-md bg-red-100">
                            <AlertTriangle className="w-3 h-3 text-red-700" />
                            <span className="text-red-700" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 700, lineHeight: '1' }}>
                              +{unidad.minutosVariacion}m
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <div className="text-slate-900" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '16px', fontWeight: 900, lineHeight: '1' }}>
                          {unidad.progreso}%
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};