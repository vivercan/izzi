import { useState, useEffect } from 'react';
import { Truck, ArrowLeft, AlertTriangle, CheckCircle, Download, X, Wrench, FileText, Zap, MapPin, Clock, Paperclip, Plus, Calendar, Navigation, Settings } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { FormatosVentaHub } from './FormatosVentaHub';

interface CarrollModuleProps {
  onBack: () => void;
}

interface Unidad {
  id: string;
  tracto: string;
  thermo: string;
  operador: string;
  kmActual: number;
  fechaMantoTracto?: string;
  fechaMantoRemolque?: string;
  diasMantRemolque?: number;
  semaforoMant: 'verde' | 'amarillo' | 'rojo';
  semaforoRemolque?: 'verde' | 'amarillo' | 'rojo';
}

// 🚚 28 UNIDADES DEDICADAS GRANJAS CARROLL - DATOS REALES ACTUALIZADOS  
const DATOS_ENTREGAS: Unidad[] = [
  { id: '1', tracto: '505', thermo: '1292', operador: 'RAUL BAUTISTA LOPEZ', kmActual: 936409, semaforoMant: 'verde', semaforoRemolque: 'verde', fechaMantoTracto: '20/11/2025', fechaMantoRemolque: '24/10/2025', diasMantRemolque: 27 },
  { id: '2', tracto: '777', thermo: '1356', operador: 'LUIS ANGEL TAPIA RODRIGUEZ', kmActual: 491391, semaforoMant: 'verde', semaforoRemolque: 'rojo', fechaMantoTracto: '04/09/2025', fechaMantoRemolque: '07/07/2025', diasMantRemolque: 136 },
  { id: '3', tracto: '893', thermo: '1406', operador: 'MARCELO SANCHEZ RODRIGUEZ', kmActual: 276880, semaforoMant: 'verde', semaforoRemolque: 'verde', fechaMantoTracto: '08/10/2025', fechaMantoRemolque: '09/10/2025', diasMantRemolque: 42 },
  { id: '4', tracto: '931', thermo: '1288', operador: 'MARCELO SANCHEZ RODRIGUEZ', kmActual: 929754, semaforoMant: 'verde', semaforoRemolque: 'amarillo', fechaMantoTracto: '29/09/2025', fechaMantoRemolque: '18/08/2025', diasMantRemolque: 94 },
  { id: '5', tracto: '937', thermo: '1348', operador: 'VICTOR ISLAS ORIA', kmActual: 124800, semaforoMant: 'verde', semaforoRemolque: 'amarillo', fechaMantoTracto: '18/09/2025', fechaMantoRemolque: '21/08/2025', diasMantRemolque: 91 },
  { id: '6', tracto: '891', thermo: '1350', operador: 'FEDERICO CLEMENTE QUINTERO', kmActual: 246977, semaforoMant: 'verde', semaforoRemolque: 'amarillo', fechaMantoTracto: '28/08/2025', fechaMantoRemolque: '08/08/2025', diasMantRemolque: 104 },
  { id: '7', tracto: '801', thermo: '1378', operador: 'FERNANDO GUZMAN SERVN', kmActual: 802126, semaforoMant: 'verde', semaforoRemolque: 'verde', fechaMantoTracto: '31/10/2025', fechaMantoRemolque: '19/11/2025', diasMantRemolque: 1 },
  { id: '8', tracto: '905', thermo: '1260', operador: 'JUAN ALAN DIAZ MARTINEZ', kmActual: 936408, semaforoMant: 'verde', semaforoRemolque: 'verde', fechaMantoTracto: '30/08/2025', fechaMantoRemolque: '19/09/2025', diasMantRemolque: 62 },
  { id: '9', tracto: '911', thermo: '1256', operador: 'ENRIQUE URBAN FLORES', kmActual: 175998, semaforoMant: 'verde', semaforoRemolque: 'amarillo', fechaMantoTracto: '12/09/2025', fechaMantoRemolque: '20/08/2025', diasMantRemolque: 92 },
  { id: '10', tracto: '841', thermo: '1262', operador: 'RENE ALONSO VAZQUEZ CRUZ', kmActual: 238717, semaforoMant: 'verde', semaforoRemolque: 'amarillo', fechaMantoTracto: '15/10/2025', fechaMantoRemolque: '02/08/2025', diasMantRemolque: 110 },
  { id: '11', tracto: '863', thermo: '4113', operador: 'OCTAVIO VILLELA TRENADO', kmActual: 371606, semaforoMant: 'verde', semaforoRemolque: 'rojo', fechaMantoTracto: '02/08/2025', fechaMantoRemolque: '17/07/2025', diasMantRemolque: 126 },
  { id: '12', tracto: '861', thermo: '1208', operador: 'JUAN FRANCISCO LEOS FRAGOSO', kmActual: 354969, semaforoMant: 'verde', semaforoRemolque: 'verde', fechaMantoTracto: '13/11/2025', fechaMantoRemolque: '07/10/2025', diasMantRemolque: 44 },
  { id: '13', tracto: '817', thermo: '1278', operador: 'JUAN RAMIREZ MONTES', kmActual: 417234, semaforoMant: 'verde', semaforoRemolque: 'verde', fechaMantoTracto: '30/08/2025', fechaMantoRemolque: '05/09/2025', diasMantRemolque: 76 },
  { id: '14', tracto: '899', thermo: '1332', operador: 'JULIO ENRIQUE ARELLANO PEREZ', kmActual: 228885, semaforoMant: 'verde', semaforoRemolque: 'verde', fechaMantoTracto: '18/10/2025', fechaMantoRemolque: '20/10/2025', diasMantRemolque: 31 },
  { id: '15', tracto: '745', thermo: '1254', operador: 'CARLOS SERGIO FLORES VERGES', kmActual: 995790, semaforoMant: 'verde', semaforoRemolque: 'verde', fechaMantoTracto: '20/11/2025', fechaMantoRemolque: '17/09/2025', diasMantRemolque: 64 },
  { id: '16', tracto: '799', thermo: '1322', operador: 'RUBEN CALDERON JASSO', kmActual: 870714, semaforoMant: 'verde', semaforoRemolque: 'verde', fechaMantoTracto: '22/10/2025', fechaMantoRemolque: '22/10/2025', diasMantRemolque: 29 },
  { id: '17', tracto: '837', thermo: '1296', operador: 'JOSE ALBERTO MORANCHEL VILLANUEVA', kmActual: 289359, semaforoMant: 'verde', semaforoRemolque: 'amarillo', fechaMantoTracto: '22/10/2025', fechaMantoRemolque: '14/08/2025', diasMantRemolque: 98 },
  { id: '18', tracto: '933', thermo: '1328', operador: 'JUAN MANUEL OJEDA VELAZQUEZ', kmActual: 162940, semaforoMant: 'verde', semaforoRemolque: 'verde', fechaMantoTracto: '17/11/2025', fechaMantoRemolque: '10/10/2025', diasMantRemolque: 41 },
  { id: '19', tracto: '212', thermo: '838843', operador: 'CHRISTIAN OJEDA VELAZQUEZ', kmActual: 38529, semaforoMant: 'verde', semaforoRemolque: 'verde', fechaMantoTracto: '23/10/2025', fechaMantoRemolque: '10/11/2025', diasMantRemolque: 10 },
  { id: '20', tracto: '765', thermo: '838855', operador: 'HECTOR CHRISTIAN JAIME LEON', kmActual: 1081287, semaforoMant: 'verde', semaforoRemolque: 'amarillo', fechaMantoTracto: '10/11/2025', fechaMantoRemolque: '08/08/2025', diasMantRemolque: 104 },
  { id: '21', tracto: '208', thermo: '1282', operador: 'MARCO ANTONIO GARCIA RAMIREZ', kmActual: 129159, semaforoMant: 'verde', semaforoRemolque: 'verde', fechaMantoTracto: '18/11/2025', fechaMantoRemolque: '05/09/2025', diasMantRemolque: 76 },
  { id: '22', tracto: '813', thermo: '1360', operador: 'EDGAR IVAN HERNANDEZ', kmActual: 363662, semaforoMant: 'verde', semaforoRemolque: 'verde', fechaMantoTracto: '27/10/2025', fechaMantoRemolque: '02/10/2025', diasMantRemolque: 49 },
  { id: '23', tracto: '126', thermo: '838656', operador: 'ALEJANDRO VILLANUEVA ESPINOZA', kmActual: 1362370, semaforoMant: 'verde', semaforoRemolque: 'rojo', fechaMantoTracto: '24/08/2025', fechaMantoRemolque: '08/05/2025', diasMantRemolque: 196 },
  { id: '24', tracto: '809', thermo: '28654', operador: 'RUMUALDO BAUTISTA GOMEZ', kmActual: 429433, semaforoMant: 'verde', semaforoRemolque: 'amarillo', fechaMantoTracto: '15/10/2025', fechaMantoRemolque: '02/08/2025', diasMantRemolque: 110 },
  { id: '25', tracto: '859', thermo: '1414', operador: 'HECTOR ADRIAN LOPEZ MEDINA', kmActual: 196719, semaforoMant: 'verde', semaforoRemolque: 'verde', fechaMantoTracto: '17/09/2025', fechaMantoRemolque: '04/10/2025', diasMantRemolque: 47 },
  { id: '26', tracto: '178', thermo: '1376', operador: 'CRISTIAN CORTEZ PORTILLO', kmActual: 426784, semaforoMant: 'verde', semaforoRemolque: 'amarillo', fechaMantoTracto: '21/09/2025', fechaMantoRemolque: '26/08/2025', diasMantRemolque: 86 },
  { id: '27', tracto: '731', thermo: '1398', operador: 'MARIO LARA TIBURCIO', kmActual: 889384, semaforoMant: 'verde', semaforoRemolque: 'verde', fechaMantoTracto: '19/06/2025', fechaMantoRemolque: '13/09/2025', diasMantRemolque: 68 },
  { id: '28', tracto: '847', thermo: '1396', operador: 'VICTOR FRANCO MONTAÑO', kmActual: 498572, semaforoMant: 'verde', semaforoRemolque: 'amarillo', fechaMantoTracto: '10/11/2025', fechaMantoRemolque: '28/08/2025', diasMantRemolque: 84 },
];

export const CarrollModuleFinalV2Compact = ({ onBack }: CarrollModuleProps) => {
  const [modalFormatoVenta, setModalFormatoVenta] = useState(false);
  const [modalEditarParametros, setModalEditarParametros] = useState(false);
  const [mostrarFormatos, setMostrarFormatos] = useState(false);
  const [kmTracto, setKmTracto] = useState('28000');
  const [diasRemolque, setDiasRemolque] = useState('120');

  if (mostrarFormatos) {
    return <FormatosVentaHub onBack={() => setMostrarFormatos(false)} />;
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0056B8 0%, #0B84FF 100%)' }}>
      {/* HEADER COMPACTO CON DATOS DE MANTENIMIENTO */}
      <div className="px-5 py-3 border-b" style={{ backgroundColor: '#0B1220', borderColor: '#1E293B' }}>
        <div className="flex items-center justify-between gap-6">
          
          {/* LEFT: BACK + TITLE */}
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-white" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '18px', fontWeight: 700 }}>
                DEDICADOS #12 - GRANJAS CARROLL
              </h1>
              <p className="text-slate-400" style={{ fontSize: '11px' }}>
                {DATOS_ENTREGAS.length} tractocamiones dedicados
              </p>
            </div>
          </div>

          {/* CENTER: CRITERIOS DE MANTENIMIENTO */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <Wrench className="w-5 h-5 text-yellow-400" />
              <div>
                <div className="text-white" style={{ fontSize: '11px', fontWeight: 700, fontFamily: "'Exo 2', sans-serif" }}>
                  MANTENIMIENTO TRACTO
                </div>
                <div className="text-yellow-300" style={{ fontSize: '14px', fontWeight: 900, fontFamily: "'Orbitron', sans-serif" }}>
                  CADA 28,000 KM
                </div>
              </div>
            </div>
            <div className="h-10 w-px bg-slate-600"></div>
            <div className="flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-yellow-400" />
              <div>
                <div className="text-white" style={{ fontSize: '11px', fontWeight: 700, fontFamily: "'Exo 2', sans-serif" }}>
                  MANTENIMIENTO REMOLQUE
                </div>
                <div className="text-yellow-300" style={{ fontSize: '14px', fontWeight: 900, fontFamily: "'Orbitron', sans-serif" }}>
                  CADA 120 DÍAS
                </div>
              </div>
            </div>
            <div className="h-10 w-px bg-slate-600"></div>
            <div className="flex items-center gap-3 text-white" style={{ fontSize: '10px' }}>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span>🟢 VERDE: 0-80 días</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span>🟡 AMARILLO: 81-110 días</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>🔴 ROJO: 111+ días (urgente)</span>
              </div>
            </div>
          </div>

          {/* RIGHT: BOTONES */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMostrarFormatos(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
              style={{
                fontFamily: "'Exo 2', sans-serif",
                fontSize: '12px',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                border: '1.5px solid #3B82F6',
                color: 'white',
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)';
              }}
            >
              <FileText className="w-4 h-4" />
              Formatos
            </button>
            <button
              onClick={() => setModalEditarParametros(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
              style={{
                fontFamily: "'Exo 2', sans-serif",
                fontSize: '12px',
                fontWeight: 700,
                background: '#1E293B',
                border: '1.5px solid #475569',
                color: '#94A3B8'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#334155';
                e.currentTarget.style.borderColor = '#64748B';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#1E293B';
                e.currentTarget.style.borderColor = '#475569';
              }}
            >
              <Settings className="w-4 h-4" />
              Editar Parámetros
            </button>
          </div>
        </div>
      </div>

      {/* TABLA COMPACTA */}
      <div className="px-5 py-4">
        <div className="bg-white shadow border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-gradient-to-r from-emerald-50 to-white">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-600" />
              <h2 className="text-slate-900" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 700 }}>
                28 UNIDADES ACTUALIZADAS CON KM Y FECHAS DE MANTENIMIENTO
              </h2>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-700 border-b border-slate-600">
                  <th className="px-2 py-1.5 text-left text-white" style={{ fontSize: '10px', fontWeight: 700 }}>UNIDAD</th>
                  <th className="px-2 py-1.5 text-left text-white" style={{ fontSize: '10px', fontWeight: 700 }}>OPERADOR</th>
                  <th className="px-2 py-1.5 text-right text-white" style={{ fontSize: '10px', fontWeight: 700 }}>KM TRACTO</th>
                  <th className="px-2 py-1.5 text-center text-white" style={{ fontSize: '10px', fontWeight: 700 }}>ÚLT MANT TRACTO</th>
                  <th className="px-2 py-1.5 text-center text-white" style={{ fontSize: '10px', fontWeight: 700 }}>ÚLT MANT REM</th>
                  <th className="px-2 py-1.5 text-center text-white" style={{ fontSize: '10px', fontWeight: 700 }}>DÍAS REM</th>
                  <th className="px-2 py-1.5 text-center text-white" style={{ fontSize: '10px', fontWeight: 700 }}>SEMÁFORO TRACTO</th>
                  <th className="px-2 py-1.5 text-center text-white" style={{ fontSize: '10px', fontWeight: 700 }}>SEMÁFORO REM</th>
                </tr>
              </thead>
              <tbody>
                {DATOS_ENTREGAS.map((unidad, idx) => (
                  <tr key={unidad.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="px-2 py-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className="text-slate-700" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '13px', fontWeight: 700 }}>
                          {unidad.tracto}
                        </div>
                        <div className="text-slate-400" style={{ fontSize: '10px' }}>
                          #{unidad.thermo}
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-1.5 text-slate-700" style={{ fontSize: '11px' }}>
                      {unidad.operador}
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      <div className="text-slate-900" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '12px', fontWeight: 700 }}>
                        {unidad.kmActual.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <div className="text-slate-700" style={{ fontSize: '11px' }}>
                        {unidad.fechaMantoTracto || 'N/A'}
                      </div>
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <div className="text-slate-700" style={{ fontSize: '11px' }}>
                        {unidad.fechaMantoRemolque || 'N/A'}
                      </div>
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <div className="inline-flex items-center justify-center px-2 py-1 rounded" style={{
                        background: unidad.semaforoRemolque === 'verde' ? '#D1FAE5' : unidad.semaforoRemolque === 'amarillo' ? '#FEF3C7' : '#FEE2E2',
                        color: unidad.semaforoRemolque === 'verde' ? '#065F46' : unidad.semaforoRemolque === 'amarillo' ? '#92400E' : '#991B1B',
                        fontSize: '11px',
                        fontWeight: 700
                      }}>
                        {unidad.diasMantRemolque || 0}
                      </div>
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <div className="inline-flex items-center justify-center w-6 h-6 rounded-full" style={{
                        background: unidad.semaforoMant === 'verde' ? '#10B981' : unidad.semaforoMant === 'amarillo' ? '#F59E0B' : '#EF4444'
                      }}>
                      </div>
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <div className="inline-flex items-center justify-center w-6 h-6 rounded-full" style={{
                        background: unidad.semaforoRemolque === 'verde' ? '#10B981' : unidad.semaforoRemolque === 'amarillo' ? '#F59E0B' : '#EF4444'
                      }}>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL FORMATO DE VENTA */}
      {modalFormatoVenta && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)'
          }}
          onClick={() => setModalFormatoVenta(false)}
        >
          <div 
            className="relative bg-white rounded-xl shadow-2xl"
            style={{
              width: '600px',
              maxHeight: '90vh',
              border: '2px solid #10B981'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER */}
            <div 
              className="relative flex items-center justify-between px-6 py-4 rounded-t-xl"
              style={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              <h2 style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: '18px',
                fontWeight: 700,
                color: 'white',
                letterSpacing: '0.5px'
              }}>
                NUEVO FORMATO DE VENTA
              </h2>
              <button
                onClick={() => setModalFormatoVenta(false)}
                className="p-1.5 rounded-lg transition-all"
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* CONTENIDO */}
            <div className="px-6 py-6">
              <p className="text-center text-slate-600" style={{ fontSize: '14px' }}>
                Funcionalidad en desarrollo...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR PARÁMETROS */}
      {modalEditarParametros && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)'
          }}
          onClick={() => setModalEditarParametros(false)}
        >
          <div 
            className="relative bg-white rounded-xl shadow-2xl"
            style={{
              width: '500px',
              border: '2px solid #475569'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER */}
            <div 
              className="relative flex items-center justify-between px-6 py-4 rounded-t-xl"
              style={{
                background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              <h2 style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: '18px',
                fontWeight: 700,
                color: 'white',
                letterSpacing: '0.5px'
              }}>
                EDITAR PARÁMETROS DE MANTENIMIENTO
              </h2>
              <button
                onClick={() => setModalEditarParametros(false)}
                className="p-1.5 rounded-lg transition-all"
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* FORMULARIO */}
            <div className="px-6 py-6">
              <div className="mb-5">
                <label style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#0F172A',
                  display: 'block',
                  marginBottom: '8px'
                }}>
                  KILÓMETROS MANTENIMIENTO TRACTO
                </label>
                <input
                  type="text"
                  value={kmTracto}
                  onChange={(e) => setKmTracto(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg"
                  style={{
                    fontFamily: "'Exo 2', sans-serif",
                    fontSize: '13px',
                    border: '2px solid #E2E8F0',
                    outline: 'none'
                  }}
                />
              </div>

              <div className="mb-6">
                <label style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#0F172A',
                  display: 'block',
                  marginBottom: '8px'
                }}>
                  DÍAS MANTENIMIENTO REMOLQUE
                </label>
                <input
                  type="text"
                  value={diasRemolque}
                  onChange={(e) => setDiasRemolque(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg"
                  style={{
                    fontFamily: "'Exo 2', sans-serif",
                    fontSize: '13px',
                    border: '2px solid #E2E8F0',
                    outline: 'none'
                  }}
                />
              </div>

              <button
                onClick={() => {
                  console.log('Guardar parámetros:', { kmTracto, diasRemolque });
                  setModalEditarParametros(false);
                }}
                className="w-full py-3.5 rounded-lg"
                style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: '14px',
                  fontWeight: 700,
                  color: 'white',
                  background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                  border: 'none'
                }}
              >
                GUARDAR CAMBIOS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};