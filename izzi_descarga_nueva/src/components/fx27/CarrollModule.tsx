import { useState } from 'react';
import { Truck, ArrowLeft, AlertTriangle, CheckCircle, Download, X, Wrench, FileText, Zap, MapPin, Clock } from 'lucide-react';

interface CarrollModuleProps {
  onBack: () => void;
}

type EstadoUnidad = 'Lavado' | 'Origen' | 'Tránsito' | 'Destino';
type StatusEntrega = 'On Time' | 'Delayed' | 'Early';

interface Unidad {
  id: string;
  tracto: string;
  thermo: string;
  operador: string;
  destino: string;
  temp: number;
  estado: EstadoUnidad;
  cita: string;
  status: StatusEntrega;
  progreso: number;
  minutosDetenido?: number;
  semaforoMant: 'verde' | 'amarillo' | 'rojo';
  kmActual: number;
  kmMant: number;
  horasThermo: number;
  horasMant: number;
}

// 🚚 DATOS REALES
const DATOS_ENTREGAS: Unidad[] = [
  { id: '1', tracto: '785', thermo: '1329', operador: 'LUIS ÁNGEL MONTAÑO NÚÑEZ', destino: 'CEDIS Soriana', temp: -18.3, estado: 'Lavado', cita: '12:03 p.m.', status: 'Delayed', progreso: 0, semaforoMant: 'verde', kmActual: 6420, kmMant: 10000, horasThermo: 680, horasMant: 1000 },
  { id: '2', tracto: '765', thermo: '838B-13', operador: 'MARCELO SÁNCHEZ RODRIGUEZ', destino: 'CEDIS Chedraui', temp: -18.3, estado: 'Lavado', cita: '09:36 p.m.', status: 'Early', progreso: 100, semaforoMant: 'verde', kmActual: 5240, kmMant: 10000, horasThermo: 720, horasMant: 1000 },
  { id: '3', tracto: '196', thermo: '1340', operador: 'ARTURO ALCÁNTARA DÍAZ', destino: 'WM Aguascalientes', temp: -17.8, estado: 'Destino', cita: '05:54 a.m.', status: 'Early', progreso: 100, semaforoMant: 'amarillo', kmActual: 8750, kmMant: 10000, horasThermo: 890, horasMant: 1000 },
  { id: '4', tracto: '208', thermo: 'R18855', operador: 'HÉCTOR SILVA OPIA', destino: 'CEDIS HEB', temp: -18.9, estado: 'Destino', cita: '04:13 a.m.', status: 'On Time', progreso: 100, semaforoMant: 'verde', kmActual: 4200, kmMant: 10000, horasThermo: 560, horasMant: 1000 },
  { id: '5', tracto: '813', thermo: 'B38139', operador: 'FERNANDO GUZMÁN ISIDRO', destino: 'Empacadora Chiapas', temp: -19.4, estado: 'Origen', cita: '10:30 a.m.', status: 'Early', progreso: 4, minutosDetenido: 57, semaforoMant: 'verde', kmActual: 3890, kmMant: 10000, horasThermo: 420, horasMant: 1000 },
  { id: '6', tracto: '126', thermo: '1282', operador: 'JORGE DANIEL DÍAZ DÍAZ', destino: 'Central de Abastos Puebla', temp: 3.7, estado: 'Origen', cita: '11:28 p.m.', status: 'Early', progreso: 8, semaforoMant: 'amarillo', kmActual: 9100, kmMant: 10000, horasThermo: 910, horasMant: 1000 },
  { id: '7', tracto: '809', thermo: '1280', operador: 'ENRIQUE URBÁN FLORES', destino: 'CEDIS Costco', temp: -17.8, estado: 'Destino', cita: '05:17 a.m.', status: 'Early', progreso: 100, semaforoMant: 'amarillo', kmActual: 8900, kmMant: 10000, horasThermo: 920, horasMant: 1000 },
  { id: '8', tracto: '859', thermo: 'R18656', operador: 'EDDIE ALONSO VÁZQUEZ CRUZ', destino: 'CEDIS La Comer', temp: -6.0, estado: 'Destino', cita: '03:37 a.m.', status: 'Early', progreso: 100, semaforoMant: 'amarillo', kmActual: 8600, kmMant: 10000, horasThermo: 880, horasMant: 1000 },
  { id: '9', tracto: '777', thermo: '28854', operador: 'OCTAVIO VILLEGAS TINOCO', destino: 'Loma Bonita', temp: 3.6, estado: 'Destino', cita: '05:21 a.m.', status: 'On Time', progreso: 100, semaforoMant: 'verde', kmActual: 6100, kmMant: 10000, horasThermo: 740, horasMant: 1000 },
  { id: '10', tracto: '891', thermo: '1414', operador: 'JUAN FRANCISCO LUCIO PALACIOS', destino: 'La Providencia', temp: 3.1, estado: 'Tránsito', cita: '09:50 a.m.', status: 'Early', progreso: 72, semaforoMant: 'rojo', kmActual: 9800, kmMant: 10000, horasThermo: 980, horasMant: 1000 },
];

const DATOS_REGRESOS: Unidad[] = [
  { id: '11', tracto: '948', thermo: '1996', operador: 'RAÚL PÉREZ SOTO', destino: 'Oriental, Puebla', temp: 21.5, estado: 'Tránsito', cita: '08:01 a.m.', status: 'Delayed', progreso: 0, semaforoMant: 'verde', kmActual: 3200, kmMant: 10000, horasThermo: 410, horasMant: 1000 },
  { id: '12', tracto: '932', thermo: '1388', operador: 'JULIO ENRIQUE ARELLANO PÉREZ', destino: 'Oriental, Puebla', temp: -19.3, estado: 'Tránsito', cita: '11:16 a.m.', status: 'Delayed', progreso: 100, semaforoMant: 'amarillo', kmActual: 8800, kmMant: 10000, horasThermo: 900, horasMant: 1000 },
  { id: '13', tracto: '939', thermo: '1290', operador: 'RICARDO CARRILLO GARCÍA', destino: 'Oriental, Puebla', temp: -12.3, estado: 'Tránsito', cita: '08:28 a.m.', status: 'Early', progreso: 0, semaforoMant: 'verde', kmActual: 4800, kmMant: 10000, horasThermo: 590, horasMant: 1000 },
  { id: '14', tracto: '755', thermo: '1398', operador: 'LUIS ÁNGEL MONTAÑO NÚÑEZ', destino: 'Oriental, Puebla', temp: 3.1, estado: 'Tránsito', cita: '09:38 a.m.', status: 'Early', progreso: 0, semaforoMant: 'verde', kmActual: 5100, kmMant: 10000, horasThermo: 640, horasMant: 1000 },
  { id: '15', tracto: '776', thermo: '1324', operador: 'MARCELO SÁNCHEZ RODRIGUEZ', destino: 'Oriental, Puebla', temp: -19.3, estado: 'Tránsito', cita: '11:18 a.m.', status: 'Early', progreso: 100, semaforoMant: 'amarillo', kmActual: 8700, kmMant: 10000, horasThermo: 895, horasMant: 1000 },
  { id: '16', tracto: '862', thermo: '1312', operador: 'ARTURO ALCÁNTARA DÍAZ', destino: 'Oriental, Puebla', temp: -18.3, estado: 'Tránsito', cita: '08:01 a.m.', status: 'Delayed', progreso: 0, semaforoMant: 'verde', kmActual: 5900, kmMant: 10000, horasThermo: 710, horasMant: 1000 },
  { id: '17', tracto: '920', thermo: '842', operador: 'HÉCTOR SILVA OPIA', destino: 'Oriental, Puebla', temp: -18.3, estado: 'Tránsito', cita: '05:01 a.m.', status: 'Early', progreso: 100, semaforoMant: 'rojo', kmActual: 9850, kmMant: 10000, horasThermo: 985, horasMant: 1000 },
  { id: '18', tracto: '925', thermo: '5013', operador: 'FERNANDO GUZMÁN ISIDRO', destino: 'Oriental, Puebla', temp: 22.3, estado: 'Tránsito', cita: '09:30 a.m.', status: 'Early', progreso: 0, semaforoMant: 'verde', kmActual: 4100, kmMant: 10000, horasThermo: 520, horasMant: 1000 },
  { id: '19', tracto: '844', thermo: '1016', operador: 'JORGE DANIEL DÍAZ DÍAZ', destino: 'Oriental, Puebla', temp: -17.3, estado: 'Tránsito', cita: '08:38 a.m.', status: 'Early', progreso: 0, semaforoMant: 'verde', kmActual: 6300, kmMant: 10000, horasThermo: 765, horasMant: 1000 },
  { id: '20', tracto: '806', thermo: '1276', operador: 'ENRIQUE URBÁN FLORES', destino: 'Oriental, Puebla', temp: -17.3, estado: 'Tránsito', cita: '06:38 a.m.', status: 'Early', progreso: 0, semaforoMant: 'verde', kmActual: 5400, kmMant: 10000, horasThermo: 670, horasMant: 1000 },
];

export const DedicadosModule = ({ onBack }: CarrollModuleProps) => {
  const [vistaActiva, setVistaActiva] = useState<'entregas' | 'regresos'>('entregas');
  const [filtroStatus, setFiltroStatus] = useState<'all' | 'ontime' | 'delayed' | 'early'>('all');
  const [operadorModal, setOperadorModal] = useState<string | null>(null);
  const [mantModal, setMantModal] = useState<Unidad | null>(null);

  const datos = vistaActiva === 'entregas' ? DATOS_ENTREGAS : DATOS_REGRESOS;
  
  const datosFiltrados = filtroStatus === 'all' ? datos : 
    datos.filter(u => 
      filtroStatus === 'ontime' ? u.status === 'On Time' :
      filtroStatus === 'delayed' ? u.status === 'Delayed' :
      u.status === 'Early'
    );

  const alertasTemp = DATOS_ENTREGAS.filter(u => Math.abs(u.temp) > 20 || u.temp > 5).length + 
                      DATOS_REGRESOS.filter(u => Math.abs(u.temp) > 20 || u.temp > 25).length;
  
  const evidenciasPend = DATOS_ENTREGAS.filter(u => u.estado === 'Destino').length;

  const handleDescargarCSV = () => {
    const csv = datosFiltrados.map(u => 
      `${u.tracto},${u.operador},${u.destino},${u.temp},${u.estado},${u.status},${u.progreso}%`
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `carroll-${vistaActiva}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleDescargarDoc = (tipo: string) => {
    alert(`Descargando: ${tipo.toUpperCase()}_Carroll_2024.pdf`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50" style={{ height: '900px', overflow: 'hidden' }}>
      {/* MODAL LICENCIA */}
      {operadorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setOperadorModal(null)}>
          <div className="bg-white rounded-xl p-6 max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-900" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', fontWeight: 700 }}>
                LICENCIA DE CONDUCIR
              </h3>
              <button onClick={() => setOperadorModal(null)} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="text-slate-700" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px', fontWeight: 700 }}>
                {operadorModal}
              </div>
              <div className="bg-slate-100 rounded-lg p-4 text-center">
                <div className="w-full h-32 bg-gradient-to-br from-blue-500 to-blue-700 rounded flex items-center justify-center text-white" style={{ fontSize: '11px', fontWeight: 700 }}>
                  LICENCIA FEDERAL TIPO A
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><div className="text-slate-500" style={{ fontSize: '9px' }}>No. Licencia</div><div className="text-slate-900" style={{ fontWeight: 600 }}>FED-{Math.floor(Math.random() * 999999)}</div></div>
                <div><div className="text-slate-500" style={{ fontSize: '9px' }}>Vigencia</div><div className="text-emerald-600" style={{ fontWeight: 600 }}>31/12/2025</div></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MANTENIMIENTO */}
      {mantModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setMantModal(null)}>
          <div className="bg-white rounded-xl p-5 max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-slate-900 flex items-center gap-2" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 700 }}>
                <Wrench className="w-4 h-4 text-orange-600" />
                MANTENIMIENTO
              </h3>
              <button onClick={() => setMantModal(null)} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-slate-600 mb-1" style={{ fontSize: '11px', fontWeight: 600 }}>Tracto #{mantModal.tracto}</div>
                <div className="flex items-center justify-between mb-1" style={{ fontSize: '10px' }}>
                  <span>Kilometraje</span>
                  <span style={{ fontWeight: 700 }}>{mantModal.kmActual.toLocaleString()} / {mantModal.kmMant.toLocaleString()} km</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full ${mantModal.semaforoMant === 'rojo' ? 'bg-red-600' : mantModal.semaforoMant === 'amarillo' ? 'bg-yellow-500' : 'bg-emerald-500'}`} style={{ width: `${(mantModal.kmActual / mantModal.kmMant) * 100}%` }} />
                </div>
              </div>
              <div>
                <div className="text-slate-600 mb-1" style={{ fontSize: '11px', fontWeight: 600 }}>Thermo #{mantModal.thermo}</div>
                <div className="flex items-center justify-between mb-1" style={{ fontSize: '10px' }}>
                  <span>Horas de uso</span>
                  <span style={{ fontWeight: 700 }}>{mantModal.horasThermo} / {mantModal.horasMant} hrs</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full ${(mantModal.horasThermo / mantModal.horasMant) >= 0.95 ? 'bg-red-600' : (mantModal.horasThermo / mantModal.horasMant) >= 0.85 ? 'bg-yellow-500' : 'bg-emerald-500'}`} style={{ width: `${(mantModal.horasThermo / mantModal.horasMant) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="sticky top-0 z-10 bg-white/95 border-b border-slate-200 backdrop-blur-md shadow-sm">
        <div className="flex items-center justify-between px-5 py-2">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-orange-500 transition-all duration-200 cursor-pointer group">
              <ArrowLeft className="w-5 h-5 stroke-[3] group-hover:scale-110 transition-transform" />
            </button>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
                <Truck className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-slate-900" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '16px', fontWeight: 900, letterSpacing: '0.3px', lineHeight: '1' }}>
                  CARROLL
                </h1>
                <p className="text-slate-500" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '9px', lineHeight: '1.1' }}>
                  Granjas Carroll • Oriental, Puebla
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="text-center">
              <div className="text-emerald-600" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '20px', fontWeight: 900, lineHeight: '1' }}>{DATOS_ENTREGAS.length}</div>
              <div className="text-slate-500" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '8px', fontWeight: 700, letterSpacing: '0.3px', lineHeight: '1.1' }}>ENTREGAS</div>
            </div>
            <div className="text-center">
              <div className="text-purple-600" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '20px', fontWeight: 900, lineHeight: '1' }}>{DATOS_REGRESOS.length}</div>
              <div className="text-slate-500" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '8px', fontWeight: 700, letterSpacing: '0.3px', lineHeight: '1.1' }}>REGRESOS</div>
            </div>
            <div className="text-center">
              <div className="text-red-600" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '20px', fontWeight: 900, lineHeight: '1' }}>{alertasTemp}</div>
              <div className="text-slate-500" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '8px', fontWeight: 700, letterSpacing: '0.3px', lineHeight: '1.1' }}>ALERTAS</div>
            </div>
            <div className="text-center">
              <div className="text-amber-600" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '20px', fontWeight: 900, lineHeight: '1' }}>{evidenciasPend}</div>
              <div className="text-slate-500" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '8px', fontWeight: 700, letterSpacing: '0.3px', lineHeight: '1.1' }}>EVIDENCIAS PEND.</div>
            </div>
            <div className="text-center">
              <div className="text-blue-600" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '20px', fontWeight: 900, lineHeight: '1' }}>30</div>
              <div className="text-slate-500" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '8px', fontWeight: 700, letterSpacing: '0.3px', lineHeight: '1.1' }}>FLOTA</div>
            </div>
          </div>
        </div>

        <div className="px-5 pb-2 flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-0.5 bg-slate-100 rounded-lg p-0.5">
            <button onClick={() => setVistaActiva('entregas')} className={`px-2.5 py-1 rounded-md transition-all ${vistaActiva === 'entregas' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`} style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px', fontWeight: 700, lineHeight: '1' }}>↑ Entregas</button>
            <button onClick={() => setVistaActiva('regresos')} className={`px-2.5 py-1 rounded-md transition-all ${vistaActiva === 'regresos' ? 'bg-purple-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`} style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px', fontWeight: 700, lineHeight: '1' }}>↓ Regresos</button>
          </div>
          <div className="h-4 w-px bg-slate-300"></div>
          <div className="flex items-center gap-1">
            <button onClick={() => setFiltroStatus('all')} className={`px-2 py-0.5 rounded-md transition-all ${filtroStatus === 'all' ? 'bg-slate-700 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`} style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '9px', fontWeight: 700, lineHeight: '1' }}>Todos</button>
            <button onClick={() => setFiltroStatus('ontime')} className={`px-2 py-0.5 rounded-md transition-all flex items-center gap-0.5 ${filtroStatus === 'ontime' ? 'bg-emerald-500 text-white shadow-sm' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`} style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '9px', fontWeight: 700, lineHeight: '1' }}><CheckCircle className="w-2 h-2" />On Time</button>
            <button onClick={() => setFiltroStatus('delayed')} className={`px-2 py-0.5 rounded-md transition-all flex items-center gap-0.5 ${filtroStatus === 'delayed' ? 'bg-red-500 text-white shadow-sm' : 'bg-red-50 text-red-700 hover:bg-red-100'}`} style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '9px', fontWeight: 700, lineHeight: '1' }}><AlertTriangle className="w-2 h-2" />Delayed</button>
            <button onClick={() => setFiltroStatus('early')} className={`px-2 py-0.5 rounded-md transition-all flex items-center gap-0.5 ${filtroStatus === 'early' ? 'bg-blue-500 text-white shadow-sm' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`} style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '9px', fontWeight: 700, lineHeight: '1' }}><CheckCircle className="w-2 h-2" />Early</button>
          </div>
          <div className="h-4 w-px bg-slate-300"></div>
          <button onClick={handleDescargarCSV} className="px-2 py-0.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-0.5 shadow-sm" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '8px', fontWeight: 700, lineHeight: '1' }}><Download className="w-2.5 h-2.5" />CSV</button>
          <button onClick={() => handleDescargarDoc('sua')} className="px-2 py-0.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex items-center gap-0.5 shadow-sm" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '8px', fontWeight: 700, lineHeight: '1' }}><FileText className="w-2.5 h-2.5" />SUA</button>
          <button onClick={() => handleDescargarDoc('csf')} className="px-2 py-0.5 rounded-md bg-teal-600 text-white hover:bg-teal-700 transition-colors flex items-center gap-0.5 shadow-sm" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '8px', fontWeight: 700, lineHeight: '1' }}><FileText className="w-2.5 h-2.5" />CSF</button>
          <button onClick={() => handleDescargarDoc('opinion')} className="px-2 py-0.5 rounded-md bg-violet-600 text-white hover:bg-violet-700 transition-colors flex items-center gap-0.5 shadow-sm" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '8px', fontWeight: 700, lineHeight: '1' }}><FileText className="w-2.5 h-2.5" />Opinión</button>
          <button onClick={() => handleDescargarDoc('polizas')} className="px-2 py-0.5 rounded-md bg-orange-600 text-white hover:bg-orange-700 transition-colors flex items-center gap-0.5 shadow-sm" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '8px', fontWeight: 700, lineHeight: '1' }}><FileText className="w-2.5 h-2.5" />Pólizas</button>
          <div className="ml-auto text-slate-500" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px', fontWeight: 600 }}>{datosFiltrados.length} unidades</div>
        </div>
      </div>

      {/* TABLA */}
      <div className="px-4 py-3">
        <div className="bg-white shadow-sm border border-slate-200 overflow-hidden">
          <div className={`px-3 py-1.5 border-b border-slate-200 bg-gradient-to-r ${vistaActiva === 'entregas' ? 'from-emerald-50 to-white' : 'from-purple-50 to-white'}`}>
            <div className="flex items-center gap-1.5">
              <Truck className={`w-3.5 h-3.5 ${vistaActiva === 'entregas' ? 'text-emerald-600' : 'text-purple-600 rotate-180'}`} />
              <h2 className="text-slate-800" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.2px', lineHeight: '1' }}>
                {vistaActiva === 'entregas' ? 'ENTREGAS EN CURSO' : 'REGRESOS A PLANTA'}
              </h2>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-2 py-1.5 text-left text-slate-600" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '8px', fontWeight: 700, letterSpacing: '0.3px', lineHeight: '1', width: '60px' }}>UNIDAD</th>
                  <th className="px-2 py-1.5 text-left text-slate-600" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '8px', fontWeight: 700, letterSpacing: '0.3px', lineHeight: '1', width: '180px' }}>OPERADOR</th>
                  <th className="px-2 py-1.5 text-left text-slate-600" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '8px', fontWeight: 700, letterSpacing: '0.3px', lineHeight: '1', width: '140px' }}>DESTINO</th>
                  <th className="px-2 py-1.5 text-center text-slate-600" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '8px', fontWeight: 700, letterSpacing: '0.3px', lineHeight: '1', width: '50px' }}>TEMP</th>
                  <th className="px-2 py-1.5 text-center text-slate-600" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '8px', fontWeight: 700, letterSpacing: '0.3px', lineHeight: '1', width: '70px' }}>ESTADO</th>
                  <th className="px-2 py-1.5 text-center text-slate-600" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '8px', fontWeight: 700, letterSpacing: '0.3px', lineHeight: '1', width: '50px' }}>ALERTA</th>
                  <th className="px-2 py-1.5 text-center text-slate-600" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '8px', fontWeight: 700, letterSpacing: '0.3px', lineHeight: '1', width: '70px' }}>CITA</th>
                  <th className="px-2 py-1.5 text-center text-slate-600" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '8px', fontWeight: 700, letterSpacing: '0.3px', lineHeight: '1', width: '80px' }}>STATUS</th>
                  <th className="px-2 py-1.5 text-center text-slate-600" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '8px', fontWeight: 700, letterSpacing: '0.3px', lineHeight: '1', width: '40px' }}>MANT.</th>
                  <th className="px-2 py-1.5 text-center text-slate-600" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '8px', fontWeight: 700, letterSpacing: '0.3px', lineHeight: '1', width: '50px' }}>%</th>
                </tr>
              </thead>
              <tbody>
                {datosFiltrados.map((u, idx) => (
                  <tr key={u.id} className={`border-b border-slate-100 hover:bg-blue-50/30 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'}`}>
                    <td className="px-2 py-1.5">
                      <div className="text-slate-900" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 700, lineHeight: '1' }}>{u.tracto}</div>
                      <div className="text-slate-500" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '8px', lineHeight: '1' }}>{u.thermo}</div>
                    </td>
                    <td className="px-2 py-1.5">
                      <button onClick={() => setOperadorModal(u.operador)} className="text-left text-blue-600 hover:text-blue-800 hover:underline cursor-pointer" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '9px', fontWeight: 600, lineHeight: '1.2' }}>
                        {u.operador}
                      </button>
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="text-slate-800" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px', fontWeight: 600, lineHeight: '1.1' }}>{u.destino}</div>
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <div style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 900, lineHeight: '1', color: Math.abs(u.temp) > 20 || (u.temp > 5 && u.temp < 15) ? '#DC2626' : '#059669' }}>
                        {u.temp.toFixed(1)}°
                      </div>
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                        u.estado === 'Lavado' ? 'bg-cyan-100 text-cyan-700' :
                        u.estado === 'Origen' ? 'bg-orange-100 text-orange-700' :
                        u.estado === 'Tránsito' ? 'bg-blue-100 text-blue-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`} style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '9px', fontWeight: 700, lineHeight: '1' }}>
                        {u.estado}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      {u.minutosDetenido && u.minutosDetenido > 45 ? (
                        <div className="flex flex-col items-center">
                          <Zap className="w-3.5 h-3.5 text-yellow-600" />
                          <div className="text-yellow-700" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '8px', fontWeight: 700 }}>{u.minutosDetenido}m</div>
                        </div>
                      ) : (
                        <div className="text-slate-400" style={{ fontSize: '9px' }}>—</div>
                      )}
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <div className="text-indigo-700" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 900, lineHeight: '1' }}>{u.cita}</div>
                    </td>
                    <td className="px-2 py-1.5">
                      {u.status === 'On Time' ? (
                        <div className="flex items-center justify-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-100">
                          <CheckCircle className="w-2.5 h-2.5 text-emerald-700" />
                          <span className="text-emerald-700" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '9px', fontWeight: 700, lineHeight: '1' }}>On Time</span>
                        </div>
                      ) : u.status === 'Early' ? (
                        <div className="flex items-center justify-center gap-0.5 px-1.5 py-0.5 rounded bg-blue-100">
                          <CheckCircle className="w-2.5 h-2.5 text-blue-700" />
                          <span className="text-blue-700" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '9px', fontWeight: 700, lineHeight: '1' }}>Early</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-0.5 px-1.5 py-0.5 rounded bg-red-100">
                          <AlertTriangle className="w-2.5 h-2.5 text-red-700" />
                          <span className="text-red-700" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '9px', fontWeight: 700, lineHeight: '1' }}>Delayed</span>
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <button onClick={() => setMantModal(u)} className="flex flex-col items-center cursor-pointer hover:bg-slate-100 rounded px-1">
                        <div className={`w-3 h-3 rounded-full ${u.semaforoMant === 'rojo' ? 'bg-red-500' : u.semaforoMant === 'amarillo' ? 'bg-yellow-500' : 'bg-emerald-500'}`} />
                        <div className="text-slate-600" style={{ fontSize: '7px', marginTop: '1px' }}>{Math.floor((u.kmActual / u.kmMant) * 100)}%</div>
                      </button>
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <div className="text-slate-900" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', fontWeight: 900, lineHeight: '1' }}>{u.progreso}%</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};