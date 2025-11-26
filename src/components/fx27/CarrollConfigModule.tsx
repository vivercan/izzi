import { useState, useEffect } from 'react';
import { ModuleTemplate } from './ModuleTemplate';
import { Upload, Settings, MapPin, Clock, Truck, Download, Save, AlertCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface CarrollConfigModuleProps {
  onBack: () => void;
}

interface ETAParams {
  velocidadPromedio: number; // km/h
  horasManejoPorDescanso: number; // horas
  tiempoDescanso: number; // minutos
  tiempoPromedioCarga: number; // minutos
  tiempoPromedioDescarga: number; // minutos
}

interface CarrollData {
  clientes: any[];
  rutas: any[];
  destinos: any[];
  etaParams: ETAParams;
}

const DEFAULT_ETA_PARAMS: ETAParams = {
  velocidadPromedio: 50, // km/h (sugerido para tractocamión 5ta rueda)
  horasManejoPorDescanso: 7, // cada 7 horas de manejo
  tiempoDescanso: 60, // 1 hora de descanso
  tiempoPromedioCarga: 45, // 45 min para cargar
  tiempoPromedioDescarga: 60 // 1 hora para descargar
};

export const CarrollConfigModule = ({ onBack }: CarrollConfigModuleProps) => {
  const [etaParams, setETAParams] = useState<ETAParams>(DEFAULT_ETA_PARAMS);
  const [uploadingKML, setUploadingKML] = useState(false);
  const [uploadingClientes, setUploadingClientes] = useState(false);
  const [saving, setSaving] = useState(false);
  const [carrollData, setCarrollData] = useState<CarrollData | null>(null);

  // Cargar configuración existente
  useEffect(() => {
    loadCarrollConfig();
  }, []);

  const loadCarrollConfig = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/carroll/config`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );
      
      const result = await response.json();
      if (result.success && result.config) {
        setCarrollData(result.config);
        if (result.config.etaParams) {
          setETAParams(result.config.etaParams);
        }
      }
    } catch (error) {
      console.error('[Carroll] Error al cargar configuración:', error);
    }
  };

  const handleSaveETAParams = async () => {
    setSaving(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/carroll/eta-params`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({ etaParams })
        }
      );

      const result = await response.json();
      if (result.success) {
        alert('✅ Parámetros de ETA guardados exitosamente');
        loadCarrollConfig();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('[Carroll] Error al guardar parámetros:', error);
      alert(`❌ Error al guardar: ${error}`);
    } finally {
      setSaving(false);
    }
  };

  const handleUploadKML = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.kml') && !file.name.endsWith('.kmz')) {
      alert('⚠️ Solo se permiten archivos KML o KMZ');
      return;
    }

    setUploadingKML(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'kml');

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/carroll/upload`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: formData
        }
      );

      const result = await response.json();
      if (result.success) {
        alert(`✅ Ruta KML "${file.name}" cargada exitosamente`);
        loadCarrollConfig();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('[Carroll] Error al subir KML:', error);
      alert(`❌ Error al subir archivo: ${error}`);
    } finally {
      setUploadingKML(false);
    }
  };

  const handleUploadClientes = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
      alert('⚠️ Solo se permiten archivos CSV o Excel');
      return;
    }

    setUploadingClientes(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'clientes');

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/carroll/upload`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: formData
        }
      );

      const result = await response.json();
      if (result.success) {
        alert(`✅ Archivo de clientes "${file.name}" cargado exitosamente`);
        loadCarrollConfig();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('[Carroll] Error al subir clientes:', error);
      alert(`❌ Error al subir archivo: ${error}`);
    } finally {
      setUploadingClientes(false);
    }
  };

  const calcularETA = (distanciaKm: number): string => {
    const { velocidadPromedio, horasManejoPorDescanso, tiempoDescanso, tiempoPromedioCarga, tiempoPromedioDescarga } = etaParams;
    
    // Tiempo de viaje sin descansos (en horas)
    const tiempoViajeHoras = distanciaKm / velocidadPromedio;
    
    // Calcular número de descansos necesarios
    const numDescansos = Math.floor(tiempoViajeHoras / horasManejoPorDescanso);
    
    // Tiempo total de descansos (en minutos)
    const tiempoDescansosMin = numDescansos * tiempoDescanso;
    
    // Tiempo total en minutos
    const tiempoTotalMin = (tiempoViajeHoras * 60) + tiempoDescansosMin + tiempoPromedioCarga + tiempoPromedioDescarga;
    
    // Convertir a horas y minutos
    const horas = Math.floor(tiempoTotalMin / 60);
    const minutos = Math.round(tiempoTotalMin % 60);
    
    return `${horas}h ${minutos}m`;
  };

  return (
    <ModuleTemplate 
      title="Configuración Carroll - Granjas Carroll" 
      onBack={onBack} 
      headerImage="https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cnVjayUyMGZsZWV0JTIwbG9naXN0aWNzfGVufDB8fHx8MTY3NjA1MzQ0MXww&ixlib=rb-4.1.0&q=80&w=1080"
    >
      <div className="p-8 space-y-8">
        {/* SECCIÓN 1: PARÁMETROS DE CÁLCULO ETA */}
        <div className="bg-[var(--fx-surface)] rounded-2xl border border-[rgba(148,163,184,0.2)] overflow-hidden">
          <div className="p-6 border-b border-[rgba(148,163,184,0.2)] bg-gradient-to-r from-[var(--fx-primary)]/10 to-transparent">
            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6 text-[var(--fx-primary)]" />
              <h2 className="text-white" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '20px', fontWeight: 700 }}>
                Parámetros de Cálculo de ETA
              </h2>
            </div>
            <p className="text-[var(--fx-muted)] mt-2" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px' }}>
              Configura los parámetros para el cálculo automático de tiempos de tránsito
            </p>
          </div>

          <div className="p-6 grid grid-cols-2 gap-6">
            {/* Velocidad Promedio */}
            <div>
              <label className="block text-[var(--fx-muted)] mb-2" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 600 }}>
                <Truck className="w-4 h-4 inline mr-2" />
                Velocidad Promedio (km/h)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={etaParams.velocidadPromedio}
                  onChange={(e) => setETAParams({ ...etaParams, velocidadPromedio: Number(e.target.value) })}
                  className="w-full px-4 py-3 bg-[rgba(148,163,184,0.05)] border border-[rgba(148,163,184,0.2)] rounded-xl text-white focus:outline-none focus:border-[var(--fx-primary)]"
                  style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '16px', fontWeight: 600 }}
                  min="30"
                  max="90"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--fx-muted)]" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px' }}>
                  Sugerido: 50 km/h
                </span>
              </div>
              <p className="mt-2 text-[var(--fx-muted)]" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px' }}>
                Velocidad promedio de tractocamión 5ta rueda en carretera
              </p>
            </div>

            {/* Horas de Manejo por Descanso */}
            <div>
              <label className="block text-[var(--fx-muted)] mb-2" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 600 }}>
                <Clock className="w-4 h-4 inline mr-2" />
                Horas de Manejo por Descanso
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={etaParams.horasManejoPorDescanso}
                  onChange={(e) => setETAParams({ ...etaParams, horasManejoPorDescanso: Number(e.target.value) })}
                  className="w-full px-4 py-3 bg-[rgba(148,163,184,0.05)] border border-[rgba(148,163,184,0.2)] rounded-xl text-white focus:outline-none focus:border-[var(--fx-primary)]"
                  style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '16px', fontWeight: 600 }}
                  min="4"
                  max="10"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--fx-muted)]" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px' }}>
                  Sugerido: 7 horas
                </span>
              </div>
              <p className="mt-2 text-[var(--fx-muted)]" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px' }}>
                Cada cuántas horas el operador toma descanso
              </p>
            </div>

            {/* Tiempo de Descanso */}
            <div>
              <label className="block text-[var(--fx-muted)] mb-2" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 600 }}>
                <Clock className="w-4 h-4 inline mr-2" />
                Tiempo de Descanso (minutos)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={etaParams.tiempoDescanso}
                  onChange={(e) => setETAParams({ ...etaParams, tiempoDescanso: Number(e.target.value) })}
                  className="w-full px-4 py-3 bg-[rgba(148,163,184,0.05)] border border-[rgba(148,163,184,0.2)] rounded-xl text-white focus:outline-none focus:border-[var(--fx-primary)]"
                  style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '16px', fontWeight: 600 }}
                  min="30"
                  max="120"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--fx-muted)]" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px' }}>
                  Sugerido: 60 min
                </span>
              </div>
              <p className="mt-2 text-[var(--fx-muted)]" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px' }}>
                Duración de cada descanso del operador
              </p>
            </div>

            {/* Tiempo de Carga */}
            <div>
              <label className="block text-[var(--fx-muted)] mb-2" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 600 }}>
                <Upload className="w-4 h-4 inline mr-2" />
                Tiempo Promedio de Carga (minutos)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={etaParams.tiempoPromedioCarga}
                  onChange={(e) => setETAParams({ ...etaParams, tiempoPromedioCarga: Number(e.target.value) })}
                  className="w-full px-4 py-3 bg-[rgba(148,163,184,0.05)] border border-[rgba(148,163,184,0.2)] rounded-xl text-white focus:outline-none focus:border-[var(--fx-primary)]"
                  style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '16px', fontWeight: 600 }}
                  min="15"
                  max="180"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--fx-muted)]" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px' }}>
                  Sugerido: 45 min
                </span>
              </div>
              <p className="mt-2 text-[var(--fx-muted)]" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px' }}>
                Tiempo en planta Perote para cargar
              </p>
            </div>

            {/* Tiempo de Descarga */}
            <div>
              <label className="block text-[var(--fx-muted)] mb-2" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 600 }}>
                <Download className="w-4 h-4 inline mr-2" />
                Tiempo Promedio de Descarga (minutos)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={etaParams.tiempoPromedioDescarga}
                  onChange={(e) => setETAParams({ ...etaParams, tiempoPromedioDescarga: Number(e.target.value) })}
                  className="w-full px-4 py-3 bg-[rgba(148,163,184,0.05)] border border-[rgba(148,163,184,0.2)] rounded-xl text-white focus:outline-none focus:border-[var(--fx-primary)]"
                  style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '16px', fontWeight: 600 }}
                  min="30"
                  max="180"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--fx-muted)]" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px' }}>
                  Sugerido: 60 min
                </span>
              </div>
              <p className="mt-2 text-[var(--fx-muted)]" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px' }}>
                Tiempo en CEDIS/destino para descargar
              </p>
            </div>

            {/* Botón Guardar */}
            <div className="col-span-2 flex justify-end gap-4 pt-4 border-t border-[rgba(148,163,184,0.2)]">
              <button
                onClick={() => setETAParams(DEFAULT_ETA_PARAMS)}
                className="px-6 py-3 rounded-xl bg-[rgba(148,163,184,0.1)] hover:bg-[rgba(148,163,184,0.2)] text-white transition-colors"
                style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', fontWeight: 600 }}
              >
                Restaurar Sugeridos
              </button>
              <button
                onClick={handleSaveETAParams}
                disabled={saving}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--fx-primary)] to-blue-600 hover:from-blue-700 hover:to-blue-800 text-white transition-all disabled:opacity-50 flex items-center gap-2"
                style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', fontWeight: 600 }}
              >
                <Save className="w-4 h-4" />
                {saving ? 'Guardando...' : 'Guardar Parámetros'}
              </button>
            </div>
          </div>

          {/* Preview de Cálculo */}
          <div className="p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-t border-[rgba(148,163,184,0.2)]">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <h4 className="text-blue-400 mb-2" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', fontWeight: 600 }}>
                  Ejemplo de Cálculo ETA
                </h4>
                <div className="space-y-1 text-[var(--fx-muted)]" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px' }}>
                  <p>• Ruta Perote → Monterrey (550 km): <span className="text-white font-semibold">{calcularETA(550)}</span></p>
                  <p>• Ruta Perote → CDMX (200 km): <span className="text-white font-semibold">{calcularETA(200)}</span></p>
                  <p>• Ruta Perote → Guadalajara (650 km): <span className="text-white font-semibold">{calcularETA(650)}</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: SUBIR ARCHIVOS */}
        <div className="grid grid-cols-2 gap-6">
          {/* Upload KML/KMZ */}
          <div className="bg-[var(--fx-surface)] rounded-2xl border border-[rgba(148,163,184,0.2)] overflow-hidden">
            <div className="p-6 border-b border-[rgba(148,163,184,0.2)] bg-gradient-to-r from-green-500/10 to-transparent">
              <div className="flex items-center gap-3">
                <MapPin className="w-6 h-6 text-green-400" />
                <h2 className="text-white" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '18px', fontWeight: 700 }}>
                  Rutas KML/KMZ
                </h2>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-[var(--fx-muted)]" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px' }}>
                Sube archivos KML o KMZ con las rutas de Google Maps
              </p>

              <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-[rgba(148,163,184,0.3)] rounded-xl hover:border-green-400 transition-colors cursor-pointer group">
                <Upload className="w-12 h-12 text-[var(--fx-muted)] group-hover:text-green-400 transition-colors mb-3" />
                <span className="text-white group-hover:text-green-400 transition-colors" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', fontWeight: 600 }}>
                  {uploadingKML ? 'Subiendo...' : 'Seleccionar archivo KML/KMZ'}
                </span>
                <span className="text-[var(--fx-muted)] mt-1" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px' }}>
                  Exporta rutas desde Google Maps
                </span>
                <input 
                  type="file" 
                  accept=".kml,.kmz" 
                  onChange={handleUploadKML}
                  disabled={uploadingKML}
                  className="hidden" 
                />
              </label>

              {carrollData?.rutas && carrollData.rutas.length > 0 && (
                <div className="mt-4 p-4 bg-green-500/10 rounded-xl border border-green-500/30">
                  <p className="text-green-400" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 600 }}>
                    ✅ {carrollData.rutas.length} rutas cargadas
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Upload Clientes/Destinos */}
          <div className="bg-[var(--fx-surface)] rounded-2xl border border-[rgba(148,163,184,0.2)] overflow-hidden">
            <div className="p-6 border-b border-[rgba(148,163,184,0.2)] bg-gradient-to-r from-purple-500/10 to-transparent">
              <div className="flex items-center gap-3">
                <MapPin className="w-6 h-6 text-purple-400" />
                <h2 className="text-white" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '18px', fontWeight: 700 }}>
                  Clientes / Destinos
                </h2>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-[var(--fx-muted)]" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px' }}>
                Sube archivo CSV o Excel con clientes y destinos
              </p>

              <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-[rgba(148,163,184,0.3)] rounded-xl hover:border-purple-400 transition-colors cursor-pointer group">
                <Upload className="w-12 h-12 text-[var(--fx-muted)] group-hover:text-purple-400 transition-colors mb-3" />
                <span className="text-white group-hover:text-purple-400 transition-colors" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', fontWeight: 600 }}>
                  {uploadingClientes ? 'Subiendo...' : 'Seleccionar archivo CSV/Excel'}
                </span>
                <span className="text-[var(--fx-muted)] mt-1" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px' }}>
                  Columnas: Cliente, Destino, Distancia
                </span>
                <input 
                  type="file" 
                  accept=".csv,.xlsx,.xls" 
                  onChange={handleUploadClientes}
                  disabled={uploadingClientes}
                  className="hidden" 
                />
              </label>

              {carrollData?.clientes && carrollData.clientes.length > 0 && (
                <div className="mt-4 p-4 bg-purple-500/10 rounded-xl border border-purple-500/30">
                  <p className="text-purple-400" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 600 }}>
                    ✅ {carrollData.clientes.length} clientes cargados
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: INSTRUCCIONES */}
        <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-2xl border border-yellow-500/30 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-400 mt-0.5" />
            <div>
              <h4 className="text-yellow-400 mb-3" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '16px', fontWeight: 700 }}>
                📋 Instrucciones para subir archivos
              </h4>
              <div className="space-y-2 text-[var(--fx-muted)]" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px' }}>
                <p><strong className="text-white">KML/KMZ:</strong> Ve a Google Maps → Tus sitios → Mapas → Menú (3 puntos) → Exportar a KML</p>
                <p><strong className="text-white">CSV Clientes:</strong> Formato: Cliente,Destino,DistanciaKm,Latitud,Longitud</p>
                <p><strong className="text-white">Ejemplo:</strong> CEDIS Walmart,Monterrey NL,550,25.6866,-100.3161</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ModuleTemplate>
  );
};
