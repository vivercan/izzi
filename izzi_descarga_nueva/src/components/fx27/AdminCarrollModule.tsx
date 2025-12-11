import { useState } from 'react';
import { ArrowLeft, Truck, User, FileText, Database, Upload, Download, Plus, Edit, Trash2, Save, X, FolderUp, FileSpreadsheet, FileCheck, Shield, FileKey } from 'lucide-react';

interface AdminCarrollModuleProps {
  onBack: () => void;
}

interface Operador {
  id: string;
  nombre: string;
  licencia: string;
  vigenciaLicencia: string;
  telefono: string;
  activo: boolean;
}

interface Unidad {
  id: string;
  tracto: string;
  thermo: string;
  operadorAsignado: string;
  kmActual: number;
  kmProxMant: number;
  horasThermo: number;
  horasProxMant: number;
  ultimoViaje: string;
}

// 🚛 30 CAMIONES CARROLL - NÚMEROS ECONÓMICOS REALES
const UNIDADES_CARROLL: Unidad[] = [
  { id: '1', tracto: '785', thermo: '1329', operadorAsignado: 'LUIS ÁNGEL MONTAÑO NÚÑEZ', kmActual: 6420, kmProxMant: 10000, horasThermo: 680, horasProxMant: 1000, ultimoViaje: '2024-11-10' },
  { id: '2', tracto: '765', thermo: '838B-13', operadorAsignado: 'MARCELO SÁNCHEZ RODRIGUEZ', kmActual: 5240, kmProxMant: 10000, horasThermo: 720, horasProxMant: 1000, ultimoViaje: '2024-11-09' },
  { id: '3', tracto: '196', thermo: '1340', operadorAsignado: 'ARTURO ALCÁNTARA DÍAZ', kmActual: 8750, kmProxMant: 10000, horasThermo: 890, horasProxMant: 1000, ultimoViaje: '2024-11-11' },
  { id: '4', tracto: '208', thermo: 'R18855', operadorAsignado: 'HÉCTOR SILVA OPIA', kmActual: 4200, kmProxMant: 10000, horasThermo: 560, horasProxMant: 1000, ultimoViaje: '2024-11-08' },
  { id: '5', tracto: '813', thermo: 'B38139', operadorAsignado: 'FERNANDO GUZMÁN ISIDRO', kmActual: 3890, kmProxMant: 10000, horasThermo: 420, horasProxMant: 1000, ultimoViaje: '2024-11-07' },
  { id: '6', tracto: '126', thermo: '1282', operadorAsignado: 'JORGE DANIEL DÍAZ DÍAZ', kmActual: 9100, kmProxMant: 10000, horasThermo: 910, horasProxMant: 1000, ultimoViaje: '2024-11-10' },
  { id: '7', tracto: '809', thermo: '1280', operadorAsignado: 'ENRIQUE URBÁN FLORES', kmActual: 8900, kmProxMant: 10000, horasThermo: 920, horasProxMant: 1000, ultimoViaje: '2024-11-09' },
  { id: '8', tracto: '859', thermo: 'R18656', operadorAsignado: 'EDDIE ALONSO VÁZQUEZ CRUZ', kmActual: 8600, kmProxMant: 10000, horasThermo: 880, horasProxMant: 1000, ultimoViaje: '2024-11-11' },
  { id: '9', tracto: '777', thermo: '28854', operadorAsignado: 'OCTAVIO VILLEGAS TINOCO', kmActual: 6100, kmProxMant: 10000, horasThermo: 740, horasProxMant: 1000, ultimoViaje: '2024-11-08' },
  { id: '10', tracto: '891', thermo: '1414', operadorAsignado: 'JUAN FRANCISCO LUCIO PALACIOS', kmActual: 9800, kmProxMant: 10000, horasThermo: 980, horasProxMant: 1000, ultimoViaje: '2024-11-10' },
  { id: '11', tracto: '948', thermo: '1996', operadorAsignado: 'RAÚL PÉREZ SOTO', kmActual: 3200, kmProxMant: 10000, horasThermo: 410, horasProxMant: 1000, ultimoViaje: '2024-11-07' },
  { id: '12', tracto: '932', thermo: '1388', operadorAsignado: 'JULIO ENRIQUE ARELLANO PÉREZ', kmActual: 8800, kmProxMant: 10000, horasThermo: 900, horasProxMant: 1000, ultimoViaje: '2024-11-09' },
  { id: '13', tracto: '939', thermo: '1290', operadorAsignado: 'RICARDO CARRILLO GARCÍA', kmActual: 4800, kmProxMant: 10000, horasThermo: 590, horasProxMant: 1000, ultimoViaje: '2024-11-08' },
  { id: '14', tracto: '755', thermo: '1398', operadorAsignado: 'FELIPE GONZÁLEZ MORALES', kmActual: 5100, kmProxMant: 10000, horasThermo: 640, horasProxMant: 1000, ultimoViaje: '2024-11-07' },
  { id: '15', tracto: '776', thermo: '1324', operadorAsignado: 'ANTONIO MÉNDEZ CASTRO', kmActual: 8700, kmProxMant: 10000, horasThermo: 895, horasProxMant: 1000, ultimoViaje: '2024-11-10' },
  { id: '16', tracto: '862', thermo: '1312', operadorAsignado: 'JOSÉ RAMÍREZ LÓPEZ', kmActual: 5900, kmProxMant: 10000, horasThermo: 710, horasProxMant: 1000, ultimoViaje: '2024-11-09' },
  { id: '17', tracto: '920', thermo: '842', operadorAsignado: 'CARLOS LÓPEZ HERNÁNDEZ', kmActual: 9850, kmProxMant: 10000, horasThermo: 985, horasProxMant: 1000, ultimoViaje: '2024-11-11' },
  { id: '18', tracto: '925', thermo: '5013', operadorAsignado: 'MIGUEL TORRES REYES', kmActual: 4100, kmProxMant: 10000, horasThermo: 520, horasProxMant: 1000, ultimoViaje: '2024-11-08' },
  { id: '19', tracto: '844', thermo: '1016', operadorAsignado: 'SERGIO MARTÍNEZ SOTO', kmActual: 6300, kmProxMant: 10000, horasThermo: 765, horasProxMant: 1000, ultimoViaje: '2024-11-07' },
  { id: '20', tracto: '806', thermo: '1276', operadorAsignado: 'PABLO HERNÁNDEZ RUIZ', kmActual: 5400, kmProxMant: 10000, horasThermo: 670, horasProxMant: 1000, ultimoViaje: '2024-11-10' },
  { id: '21', tracto: '898', thermo: '1922', operadorAsignado: 'DANIEL GARCÍA SILVA', kmActual: 7200, kmProxMant: 10000, horasThermo: 820, horasProxMant: 1000, ultimoViaje: '2024-11-09' },
  { id: '22', tracto: '912', thermo: 'R18432', operadorAsignado: 'FRANCISCO RUIZ ORTIZ', kmActual: 4900, kmProxMant: 10000, horasThermo: 610, horasProxMant: 1000, ultimoViaje: '2024-11-08' },
  { id: '23', tracto: '886', thermo: '1256', operadorAsignado: 'ROBERTO CRUZ VARGAS', kmActual: 5600, kmProxMant: 10000, horasThermo: 690, horasProxMant: 1000, ultimoViaje: '2024-11-07' },
  { id: '24', tracto: '871', thermo: 'B38200', operadorAsignado: 'EDUARDO MORALES RAMOS', kmActual: 8100, kmProxMant: 10000, horasThermo: 870, horasProxMant: 1000, ultimoViaje: '2024-11-10' },
  { id: '25', tracto: '842', thermo: '1445', operadorAsignado: 'JAVIER SÁNCHEZ MEDINA', kmActual: 5800, kmProxMant: 10000, horasThermo: 720, horasProxMant: 1000, ultimoViaje: '2024-11-09' },
  { id: '26', tracto: '850', thermo: '1501', operadorAsignado: 'MANUEL REYES DOMÍNGUEZ', kmActual: 3800, kmProxMant: 10000, horasThermo: 480, horasProxMant: 1000, ultimoViaje: '2024-11-08' },
  { id: '27', tracto: '901', thermo: 'R18700', operadorAsignado: 'GABRIEL ORTIZ JIMÉNEZ', kmActual: 4500, kmProxMant: 10000, horasThermo: 560, horasProxMant: 1000, ultimoViaje: '2024-11-07' },
  { id: '28', tracto: '915', thermo: '1335', operadorAsignado: 'ALBERTO VEGA MENDOZA', kmActual: 8300, kmProxMant: 10000, horasThermo: 890, horasProxMant: 1000, ultimoViaje: '2024-11-11' },
  { id: '29', tracto: '933', thermo: '1299', operadorAsignado: 'ARTURO SILVA ROMERO', kmActual: 6700, kmProxMant: 10000, horasThermo: 790, horasProxMant: 1000, ultimoViaje: '2024-11-10' },
  { id: '30', tracto: '212', thermo: '1411', operadorAsignado: 'HÉCTOR CAMPOS NAVARRO', kmActual: 5200, kmProxMant: 10000, horasThermo: 650, horasProxMant: 1000, ultimoViaje: '2024-11-09' },
];

export const AdminCarrollModule = ({ onBack }: AdminCarrollModuleProps) => {
  const [seccionActiva, setSeccionActiva] = useState<'unidades' | 'operadores' | 'documentos' | 'historial'>('unidades');
  const [unidades, setUnidades] = useState<Unidad[]>(UNIDADES_CARROLL);
  const [mostrarMenuCarga, setMostrarMenuCarga] = useState(false);
  const [editandoUnidad, setEditandoUnidad] = useState<Unidad | null>(null);
  const [agregandoUnidad, setAgregandoUnidad] = useState(false);
  const [nuevaUnidad, setNuevaUnidad] = useState<Partial<Unidad>>({
    tracto: '',
    thermo: '',
    operadorAsignado: '',
    kmActual: 0,
    kmProxMant: 10000,
    horasThermo: 0,
    horasProxMant: 1000,
    ultimoViaje: new Date().toISOString().split('T')[0]
  });

  const handleAgregarUnidad = () => {
    if (!nuevaUnidad.tracto || !nuevaUnidad.thermo || !nuevaUnidad.operadorAsignado) {
      alert('⚠️ Por favor completa todos los campos obligatorios');
      return;
    }
    
    const unidad: Unidad = {
      id: String(unidades.length + 1),
      tracto: nuevaUnidad.tracto!,
      thermo: nuevaUnidad.thermo!,
      operadorAsignado: nuevaUnidad.operadorAsignado!,
      kmActual: nuevaUnidad.kmActual || 0,
      kmProxMant: nuevaUnidad.kmProxMant || 10000,
      horasThermo: nuevaUnidad.horasThermo || 0,
      horasProxMant: nuevaUnidad.horasProxMant || 1000,
      ultimoViaje: nuevaUnidad.ultimoViaje || new Date().toISOString().split('T')[0]
    };
    
    setUnidades([...unidades, unidad]);
    setAgregandoUnidad(false);
    setNuevaUnidad({
      tracto: '',
      thermo: '',
      operadorAsignado: '',
      kmActual: 0,
      kmProxMant: 10000,
      horasThermo: 0,
      horasProxMant: 1000,
      ultimoViaje: new Date().toISOString().split('T')[0]
    });
    alert('✅ Unidad agregada exitosamente');
  };

  const handleEditarUnidad = (unidad: Unidad) => {
    setEditandoUnidad(unidad);
  };

  const handleGuardarEdicion = () => {
    if (editandoUnidad) {
      setUnidades(unidades.map(u => u.id === editandoUnidad.id ? editandoUnidad : u));
      setEditandoUnidad(null);
      alert('✅ Unidad actualizada exitosamente');
    }
  };

  const handleEliminarUnidad = (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta unidad?')) {
      setUnidades(unidades.filter(u => u.id !== id));
      alert('✅ Unidad eliminada');
    }
  };

  return (
    <div className="w-full min-h-screen" style={{ background: 'linear-gradient(135deg, #0056B8 0%, #0B84FF 100%)' }}>
      {/* HEADER */}
      <div className="sticky top-0 z-10 bg-white/95 border-b border-slate-200 backdrop-blur-md shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 rounded-lg bg-slate-200 hover:bg-slate-300 transition-all duration-200 border border-slate-400 cursor-pointer group">
              <ArrowLeft className="w-6 h-6 text-slate-900 hover:text-orange-500 stroke-[3] group-hover:scale-110 transition-all" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-slate-900" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '20px', fontWeight: 900 }}>
                  ADMINISTRACIÓN CARROLL
                </h1>
                <p className="text-slate-500" style={{ fontSize: '12px' }}>Gestión completa de flota, operadores y documentos</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-center">
              <div className="text-blue-600" style={{ fontSize: '24px', fontWeight: 900 }}>30</div>
              <div className="text-slate-500" style={{ fontSize: '10px', fontWeight: 700 }}>UNIDADES</div>
            </div>
            <div className="h-10 w-px bg-slate-300"></div>
            <div className="text-center">
              <div className="text-emerald-600" style={{ fontSize: '24px', fontWeight: 900 }}>30</div>
              <div className="text-slate-500" style={{ fontSize: '10px', fontWeight: 700 }}>OPERADORES</div>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="px-6 pb-3 flex gap-2">
          <button onClick={() => setSeccionActiva('unidades')} className={`px-4 py-2 rounded-lg transition-colors ${seccionActiva === 'unidades' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`} style={{ fontSize: '12px', fontWeight: 700 }}>
            <Truck className="w-4 h-4 inline mr-2" />Unidades
          </button>
          <button onClick={() => setSeccionActiva('operadores')} className={`px-4 py-2 rounded-lg transition-colors ${seccionActiva === 'operadores' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`} style={{ fontSize: '12px', fontWeight: 700 }}>
            <User className="w-4 h-4 inline mr-2" />Operadores
          </button>
          <button onClick={() => setSeccionActiva('documentos')} className={`px-4 py-2 rounded-lg transition-colors ${seccionActiva === 'documentos' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`} style={{ fontSize: '12px', fontWeight: 700 }}>
            <FileText className="w-4 h-4 inline mr-2" />Documentos
          </button>
          <button onClick={() => setSeccionActiva('historial')} className={`px-4 py-2 rounded-lg transition-colors ${seccionActiva === 'historial' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`} style={{ fontSize: '12px', fontWeight: 700 }}>
            <Database className="w-4 h-4 inline mr-2" />Historial
          </button>
        </div>
      </div>

      {/* CONTENIDO */}
      <div className="px-6 py-4">
        {seccionActiva === 'unidades' && (
          <div className="bg-white rounded-lg shadow border border-slate-200">
            <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-white border-b flex items-center justify-between">
              <h2 className="text-slate-900" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', fontWeight: 700 }}>
                FLOTA CARROLL - 30 UNIDADES
              </h2>
              <button 
                onClick={() => setAgregandoUnidad(true)}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2" 
                style={{ fontSize: '11px', fontWeight: 700 }}
              >
                <Plus className="w-4 h-4" />Agregar Unidad
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b">
                    <th className="px-3 py-2 text-left" style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>TRACTO</th>
                    <th className="px-3 py-2 text-left" style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>THERMO</th>
                    <th className="px-3 py-2 text-left" style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>OPERADOR</th>
                    <th className="px-3 py-2 text-center" style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>KM ACTUAL</th>
                    <th className="px-3 py-2 text-center" style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>PRÓX. MANT.</th>
                    <th className="px-3 py-2 text-center" style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>HRS THERMO</th>
                    <th className="px-3 py-2 text-center" style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>ÚLTIMO VIAJE</th>
                    <th className="px-3 py-2 text-center" style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {unidades.map((u, idx) => (
                    <tr key={u.id} className={`border-b hover:bg-blue-50/30 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'}`}>
                      <td className="px-3 py-2">
                        <div className="text-slate-900" style={{ fontSize: '14px', fontWeight: 900 }}>#{u.tracto}</div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-slate-700" style={{ fontSize: '12px', fontWeight: 600 }}>{u.thermo}</div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-slate-800" style={{ fontSize: '12px', fontWeight: 600 }}>{u.operadorAsignado}</div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div style={{ fontSize: '12px', fontWeight: 700 }}>{u.kmActual.toLocaleString()} km</div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className={`inline-flex items-center px-2 py-1 rounded ${
                          u.kmActual >= u.kmProxMant * 0.95 ? 'bg-red-100 text-red-700' :
                          u.kmActual >= u.kmProxMant * 0.85 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`} style={{ fontSize: '11px', fontWeight: 700 }}>
                          {u.kmProxMant.toLocaleString()} km
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div style={{ fontSize: '12px', fontWeight: 700 }}>{u.horasThermo} hrs</div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="text-slate-600" style={{ fontSize: '11px' }}>{u.ultimoViaje}</div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleEditarUnidad(u)}
                            className="p-1.5 rounded bg-blue-100 hover:bg-blue-200 text-blue-700"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleEliminarUnidad(u.id)}
                            className="p-1.5 rounded bg-red-100 hover:bg-red-200 text-red-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {seccionActiva === 'documentos' && (
          <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-slate-900" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '16px', fontWeight: 700 }}>
                GESTIÓN DE DOCUMENTOS
              </h2>
              
              {/* BOTÓN CARGA MASIVA CON MENÚ DESPLEGABLE */}
              <div className="relative">
                <button 
                  onClick={() => setMostrarMenuCarga(!mostrarMenuCarga)}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all flex items-center gap-2 shadow-lg" 
                  style={{ fontSize: '12px', fontWeight: 700 }}
                >
                  <FolderUp className="w-5 h-5" />
                  CARGA MASIVA DE ARCHIVOS
                </button>

                {mostrarMenuCarga && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border-2 border-emerald-500 z-50">
                    <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-3 rounded-t-xl">
                      <div className="text-white flex items-center gap-2" style={{ fontSize: '13px', fontWeight: 700 }}>
                        <FolderUp className="w-4 h-4" />
                        OPCIONES DE CARGA
                      </div>
                    </div>
                    <div className="p-3 space-y-2">
                      <button 
                        onClick={() => {
                          setMostrarMenuCarga(false);
                          // Aquí iría la lógica de carga
                        }}
                        className="w-full px-3 py-2.5 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors flex items-center gap-3 group"
                      >
                        <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                        <div>
                          <div className="text-slate-900" style={{ fontSize: '12px', fontWeight: 700 }}>Excel de Flota</div>
                          <div className="text-slate-500" style={{ fontSize: '10px' }}>Operador, Tracto, Thermo, Placas</div>
                        </div>
                      </button>

                      <button 
                        onClick={() => {
                          setMostrarMenuCarga(false);
                        }}
                        className="w-full px-3 py-2.5 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-left transition-colors flex items-center gap-3"
                      >
                        <FileKey className="w-5 h-5 text-indigo-600" />
                        <div>
                          <div className="text-slate-900" style={{ fontSize: '12px', fontWeight: 700 }}>Licencias Federales</div>
                          <div className="text-slate-500" style={{ fontSize: '10px' }}>PDFs múltiples sin límite</div>
                        </div>
                      </button>

                      <button 
                        onClick={() => {
                          setMostrarMenuCarga(false);
                        }}
                        className="w-full px-3 py-2.5 bg-teal-50 hover:bg-teal-100 rounded-lg text-left transition-colors flex items-center gap-3"
                      >
                        <FileCheck className="w-5 h-5 text-teal-600" />
                        <div>
                          <div className="text-slate-900" style={{ fontSize: '12px', fontWeight: 700 }}>Constancias Situación Fiscal</div>
                          <div className="text-slate-500" style={{ fontSize: '10px' }}>CSF múltiples PDF</div>
                        </div>
                      </button>

                      <button 
                        onClick={() => {
                          setMostrarMenuCarga(false);
                        }}
                        className="w-full px-3 py-2.5 bg-orange-50 hover:bg-orange-100 rounded-lg text-left transition-colors flex items-center gap-3"
                      >
                        <Shield className="w-5 h-5 text-orange-600" />
                        <div>
                          <div className="text-slate-900" style={{ fontSize: '12px', fontWeight: 700 }}>Pólizas de Seguro</div>
                          <div className="text-slate-500" style={{ fontSize: '10px' }}>Seguros múltiples PDF</div>
                        </div>
                      </button>

                      <button 
                        onClick={() => {
                          setMostrarMenuCarga(false);
                        }}
                        className="w-full px-3 py-2.5 bg-violet-50 hover:bg-violet-100 rounded-lg text-left transition-colors flex items-center gap-3"
                      >
                        <FileText className="w-5 h-5 text-violet-600" />
                        <div>
                          <div className="text-slate-900" style={{ fontSize: '12px', fontWeight: 700 }}>Opinión de Cumplimientos</div>
                          <div className="text-slate-500" style={{ fontSize: '10px' }}>Sin límite de archivos</div>
                        </div>
                      </button>
                    </div>
                    <div className="px-4 py-3 bg-slate-50 border-t rounded-b-xl">
                      <div className="text-slate-600 flex items-center gap-2" style={{ fontSize: '10px' }}>
                        <Database className="w-3 h-3" />
                        Almacenamiento perpetuo en Supabase
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-500 hover:bg-blue-50/30 transition-all cursor-pointer">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                <div className="text-slate-700" style={{ fontSize: '13px', fontWeight: 700 }}>Licencias de Operadores</div>
                <div className="text-slate-500 mt-1" style={{ fontSize: '10px' }}>PDF - Nombrar: NOMBRE_OPERADOR_Licencia.pdf</div>
                <button className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" style={{ fontSize: '11px', fontWeight: 700 }}>
                  Subir Licencias
                </button>
              </div>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-500 hover:bg-blue-50/30 transition-all cursor-pointer">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                <div className="text-slate-700" style={{ fontSize: '13px', fontWeight: 700 }}>Documentos SUA</div>
                <div className="text-slate-500 mt-1" style={{ fontSize: '10px' }}>PDF - Nombrar: SUA_Carroll_FECHA.pdf</div>
                <button className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700" style={{ fontSize: '11px', fontWeight: 700 }}>
                  Subir SUA
                </button>
              </div>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-500 hover:bg-blue-50/30 transition-all cursor-pointer">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                <div className="text-slate-700" style={{ fontSize: '13px', fontWeight: 700 }}>Documentos CSF</div>
                <div className="text-slate-500 mt-1" style={{ fontSize: '10px' }}>PDF - Nombrar: CSF_Carroll_FECHA.pdf</div>
                <button className="mt-3 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700" style={{ fontSize: '11px', fontWeight: 700 }}>
                  Subir CSF
                </button>
              </div>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-500 hover:bg-blue-50/30 transition-all cursor-pointer">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                <div className="text-slate-700" style={{ fontSize: '13px', fontWeight: 700 }}>Opinión de Cumplimiento</div>
                <div className="text-slate-500 mt-1" style={{ fontSize: '10px' }}>PDF - Nombrar: Opinion_Carroll_FECHA.pdf</div>
                <button className="mt-3 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700" style={{ fontSize: '11px', fontWeight: 700 }}>
                  Subir Opinión
                </button>
              </div>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-500 hover:bg-blue-50/30 transition-all cursor-pointer">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                <div className="text-slate-700" style={{ fontSize: '13px', fontWeight: 700 }}>Pólizas de Seguro</div>
                <div className="text-slate-500 mt-1" style={{ fontSize: '10px' }}>PDF - Nombrar: Poliza_Carroll_UNIDAD.pdf</div>
                <button className="mt-3 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700" style={{ fontSize: '11px', fontWeight: 700 }}>
                  Subir Pólizas
                </button>
              </div>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-500 hover:bg-blue-50/30 transition-all cursor-pointer">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                <div className="text-slate-700" style={{ fontSize: '13px', fontWeight: 700 }}>Otros Documentos</div>
                <div className="text-slate-500 mt-1" style={{ fontSize: '10px' }}>PDF/Excel - Cualquier formato</div>
                <button className="mt-3 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700" style={{ fontSize: '11px', fontWeight: 700 }}>
                  Subir Archivos
                </button>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-blue-900 mb-2" style={{ fontSize: '12px', fontWeight: 700 }}>📋 NOMENCLATURA SUGERIDA:</div>
              <ul className="text-blue-800 space-y-1" style={{ fontSize: '11px' }}>
                <li>• <span style={{ fontWeight: 700 }}>Licencias:</span> NOMBRE_APELLIDO_Licencia.pdf</li>
                <li>• <span style={{ fontWeight: 700 }}>SUA/CSF/Opinión:</span> TIPO_Carroll_2024-11-12.pdf</li>
                <li>• <span style={{ fontWeight: 700 }}>Pólizas:</span> Poliza_Tracto_785.pdf</li>
              </ul>
            </div>
          </div>
        )}

        {seccionActiva === 'historial' && (
          <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
            <h2 className="text-slate-900 mb-4" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '16px', fontWeight: 700 }}>
              HISTORIAL DE VIAJES (PERPETUO)
            </h2>
            <div className="text-center py-12">
              <Database className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <div className="text-slate-600 mb-2" style={{ fontSize: '14px', fontWeight: 700 }}>
                Sistema de Historial en Construcción
              </div>
              <div className="text-slate-500" style={{ fontSize: '12px' }}>
                Todos los viajes se guardarán automáticamente en Supabase
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL AGREGAR UNIDAD */}
      {agregandoUnidad && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-slate-900" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '18px', fontWeight: 700 }}>
                ➕ Agregar Nueva Unidad
              </h3>
              <button onClick={() => setAgregandoUnidad(false)} className="p-2 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-slate-700 mb-2" style={{ fontSize: '12px', fontWeight: 700 }}>Tracto *</label>
                <input
                  type="text"
                  value={nuevaUnidad.tracto}
                  onChange={(e) => setNuevaUnidad({...nuevaUnidad, tracto: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  placeholder="785"
                />
              </div>
              <div>
                <label className="block text-slate-700 mb-2" style={{ fontSize: '12px', fontWeight: 700 }}>Thermo *</label>
                <input
                  type="text"
                  value={nuevaUnidad.thermo}
                  onChange={(e) => setNuevaUnidad({...nuevaUnidad, thermo: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  placeholder="1329"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-slate-700 mb-2" style={{ fontSize: '12px', fontWeight: 700 }}>Operador Asignado *</label>
                <input
                  type="text"
                  value={nuevaUnidad.operadorAsignado}
                  onChange={(e) => setNuevaUnidad({...nuevaUnidad, operadorAsignado: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  placeholder="NOMBRE COMPLETO DEL OPERADOR"
                />
              </div>
              <div>
                <label className="block text-slate-700 mb-2" style={{ fontSize: '12px', fontWeight: 700 }}>KM Actual</label>
                <input
                  type="number"
                  value={nuevaUnidad.kmActual}
                  onChange={(e) => setNuevaUnidad({...nuevaUnidad, kmActual: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-slate-700 mb-2" style={{ fontSize: '12px', fontWeight: 700 }}>KM Próx. Mant.</label>
                <input
                  type="number"
                  value={nuevaUnidad.kmProxMant}
                  onChange={(e) => setNuevaUnidad({...nuevaUnidad, kmProxMant: parseInt(e.target.value) || 10000})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-slate-700 mb-2" style={{ fontSize: '12px', fontWeight: 700 }}>Horas Thermo</label>
                <input
                  type="number"
                  value={nuevaUnidad.horasThermo}
                  onChange={(e) => setNuevaUnidad({...nuevaUnidad, horasThermo: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-slate-700 mb-2" style={{ fontSize: '12px', fontWeight: 700 }}>Último Viaje</label>
                <input
                  type="date"
                  value={nuevaUnidad.ultimoViaje}
                  onChange={(e) => setNuevaUnidad({...nuevaUnidad, ultimoViaje: e.target.value})}
                  className="w-full px-3 py-2.5 border rounded-lg backdrop-blur-xl uppercase transition-all"
                  style={{ 
                    fontSize: '14px',
                    fontWeight: 600,
                    fontFamily: "'Exo 2', sans-serif",
                    background: 'linear-gradient(135deg, rgba(241, 245, 249, 0.95) 0%, rgba(226, 232, 240, 0.9) 100%)',
                    borderColor: 'rgba(148, 163, 184, 0.4)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255,255,255,0.8)',
                    textTransform: 'uppercase'
                  }}
                />
              </div>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setAgregandoUnidad(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg"
                style={{ fontSize: '12px', fontWeight: 700 }}
              >
                Cancelar
              </button>
              <button
                onClick={handleAgregarUnidad}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                style={{ fontSize: '12px', fontWeight: 700 }}
              >
                Guardar Unidad
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR UNIDAD */}
      {editandoUnidad && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-slate-900" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '18px', fontWeight: 700 }}>
                ✏️ Editar Unidad #{editandoUnidad.tracto}
              </h3>
              <button onClick={() => setEditandoUnidad(null)} className="p-2 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-slate-700 mb-2" style={{ fontSize: '12px', fontWeight: 700 }}>Tracto</label>
                <input
                  type="text"
                  value={editandoUnidad.tracto}
                  onChange={(e) => setEditandoUnidad({...editandoUnidad, tracto: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-slate-700 mb-2" style={{ fontSize: '12px', fontWeight: 700 }}>Thermo</label>
                <input
                  type="text"
                  value={editandoUnidad.thermo}
                  onChange={(e) => setEditandoUnidad({...editandoUnidad, thermo: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-slate-700 mb-2" style={{ fontSize: '12px', fontWeight: 700 }}>Operador Asignado</label>
                <input
                  type="text"
                  value={editandoUnidad.operadorAsignado}
                  onChange={(e) => setEditandoUnidad({...editandoUnidad, operadorAsignado: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-slate-700 mb-2" style={{ fontSize: '12px', fontWeight: 700 }}>KM Actual</label>
                <input
                  type="number"
                  value={editandoUnidad.kmActual}
                  onChange={(e) => setEditandoUnidad({...editandoUnidad, kmActual: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-slate-700 mb-2" style={{ fontSize: '12px', fontWeight: 700 }}>KM Próx. Mant.</label>
                <input
                  type="number"
                  value={editandoUnidad.kmProxMant}
                  onChange={(e) => setEditandoUnidad({...editandoUnidad, kmProxMant: parseInt(e.target.value) || 10000})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-slate-700 mb-2" style={{ fontSize: '12px', fontWeight: 700 }}>Horas Thermo</label>
                <input
                  type="number"
                  value={editandoUnidad.horasThermo}
                  onChange={(e) => setEditandoUnidad({...editandoUnidad, horasThermo: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-slate-700 mb-2" style={{ fontSize: '12px', fontWeight: 700 }}>Último Viaje</label>
                <input
                  type="date"
                  value={editandoUnidad.ultimoViaje}
                  onChange={(e) => setEditandoUnidad({...editandoUnidad, ultimoViaje: e.target.value})}
                  className="w-full px-3 py-2.5 border rounded-lg backdrop-blur-xl uppercase transition-all"
                  style={{ 
                    fontSize: '14px',
                    fontWeight: 600,
                    fontFamily: "'Exo 2', sans-serif",
                    background: 'linear-gradient(135deg, rgba(241, 245, 249, 0.95) 0%, rgba(226, 232, 240, 0.9) 100%)',
                    borderColor: 'rgba(148, 163, 184, 0.4)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255,255,255,0.8)',
                    textTransform: 'uppercase'
                  }}
                />
              </div>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setEditandoUnidad(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg"
                style={{ fontSize: '12px', fontWeight: 700 }}
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarEdicion}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                style={{ fontSize: '12px', fontWeight: 700 }}
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};