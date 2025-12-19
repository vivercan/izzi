import { useState, useEffect, useCallback } from 'react';
import { Truck, ArrowLeft, MapPin, Clock, AlertTriangle, Activity, Map as MapIcon, CheckCircle2, Settings, Navigation, Power, WifiOff, ExternalLink, RefreshCw } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════════════════════
// 🔧 SUPABASE CLIENT
// ═══════════════════════════════════════════════════════════════════════════
const SUPABASE_URL = 'https://fbxbsslhewchyibdoyzk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieGJzc2xoZXdjaHlpYmRveXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzczODEsImV4cCI6MjA3ODExMzM4MX0.Z8JPlg7hhKbA624QGHp2bKKTNtCD3WInQMO5twjl6a0';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface DedicadosModuleProps {
  onBack: () => void;
}

interface UnidadCarroll {
  economico: string;
  empresa: string;
  segmento: string;
  latitude: number | null;
  longitude: number | null;
  speed: number | null;
  address: string | null;
  timestamp_gps: string | null;
  timestamp_updated: string | null;
  status: string;
  operador?: string;
  remolque?: string;
}

// 🚚 OPERADORES CARROLL (para mostrar nombres)
const OPERADORES_CARROLL: Record<string, { operador: string; remolque: string }> = {
  '505': { operador: 'RAUL BAUTISTA LOPEZ', remolque: '1292' },
  '777': { operador: 'LUIS ANGEL TAPIA RODRIGUEZ', remolque: '1356' },
  '893': { operador: 'MARCELO SANCHEZ RODRIGUEZ', remolque: '1406' },
  '931': { operador: 'MARCELO SANCHEZ RODRIGUEZ', remolque: '1288' },
  '937': { operador: 'VICTOR ISLAS ORIA', remolque: '1348' },
  '891': { operador: 'FEDERICO CLEMENTE QUINTERO', remolque: '1350' },
  '801': { operador: 'FERNANDO GUZMAN SERVN', remolque: '1378' },
  '905': { operador: 'JUAN ALAN DIAZ MARTINEZ', remolque: '1260' },
  '911': { operador: 'ENRIQUE URBAN FLORES', remolque: '1256' },
  '841': { operador: 'RENE ALONSO VAZQUEZ CRUZ', remolque: '1262' },
  '863': { operador: 'OCTAVIO VILLELA TRENADO', remolque: '4113' },
  '861': { operador: 'JUAN FRANCISCO LEOS FRAGOSO', remolque: '1208' },
  '817': { operador: 'JUAN RAMIREZ MONTES', remolque: '1278' },
  '899': { operador: 'JULIO ENRIQUE ARELLANO PEREZ', remolque: '1332' },
  '745': { operador: 'CARLOS SERGIO FLORES VERGES', remolque: '1254' },
  '799': { operador: 'RUBEN CALDERON JASSO', remolque: '1322' },
  '837': { operador: 'JOSE ALBERTO MORANCHEL VILLANUEVA', remolque: '1296' },
  '933': { operador: 'JUAN MANUEL OJEDA VELAZQUEZ', remolque: '1328' },
  '212': { operador: 'CHRISTIAN OJEDA VELAZQUEZ', remolque: '838843' },
  '765': { operador: 'HECTOR CHRISTIAN JAIME LEON', remolque: '838855' },
  '208': { operador: 'MARCO ANTONIO GARCIA RAMIREZ', remolque: '1282' },
  '813': { operador: 'EDGAR IVAN HERNANDEZ', remolque: '1360' },
  '126': { operador: 'ALEJANDRO VILLANUEVA ESPINOZA', remolque: '838656' },
  '809': { operador: 'RUMUALDO BAUTISTA GOMEZ', remolque: '28654' },
  '859': { operador: 'HECTOR ADRIAN LOPEZ MEDINA', remolque: '1414' },
  '178': { operador: 'CRISTIAN CORTEZ PORTILLO', remolque: '1376' },
  '731': { operador: 'MARIO LARA TIBURCIO', remolque: '1398' },
  '847': { operador: 'VICTOR FRANCO MONTAÑO', remolque: '1396' },
  '727': { operador: 'OPERADOR CARROLL', remolque: 'N/A' },
  '643': { operador: 'OPERADOR CARROLL', remolque: 'N/A' },
  '879': { operador: 'OPERADOR CARROLL', remolque: 'N/A' },
  '945': { operador: 'OPERADOR CARROLL', remolque: 'N/A' },
  '118': { operador: 'OPERADOR CARROLL', remolque: 'N/A' },
  '148': { operador: 'OPERADOR CARROLL', remolque: 'N/A' },
  '214': { operador: 'OPERADOR CARROLL', remolque: 'N/A' },
  '433': { operador: 'OPERADOR CARROLL', remolque: 'N/A' },
};

export const DedicadosModuleWideTech = ({ onBack }: DedicadosModuleProps) => {
  const [unidades, setUnidades] = useState<UnidadCarroll[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [horaActual, setHoraActual] = useState(new Date());
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [tabActivo, setTabActivo] = useState('entregas');

  // Reloj
  useEffect(() => {
    const timer = setInterval(() => setHoraActual(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Cargar TODAS las unidades CARROL desde gps_tracking
  const cargarUnidades = useCallback(async () => {
    try {
      console.log('🚀 [Carroll] Consultando gps_tracking para segmento CARROL...');
      
      const { data, error: dbError } = await supabase
        .from('gps_tracking')
        .select('*')
        .or('segmento.eq.CARROL,segmento.eq.CARROLL');

      if (dbError) {
        console.error('❌ DB Error:', dbError);
        setError(dbError.message);
        return;
      }

      console.log('📥 [Carroll] Registros encontrados:', data?.length || 0);

      if (data && data.length > 0) {
        const unidadesMapeadas: UnidadCarroll[] = data.map((r: any) => {
          const info = OPERADORES_CARROLL[r.economico] || { operador: 'OPERADOR CARROLL', remolque: 'N/A' };
          return {
            economico: r.economico || '',
            empresa: r.empresa || 'TROB',
            segmento: r.segmento || 'CARROL',
            latitude: r.latitude,
            longitude: r.longitude,
            speed: r.speed,
            address: r.address || '',
            timestamp_gps: r.timestamp_gps,
            timestamp_updated: r.timestamp_updated,
            status: r.status || 'stopped',
            operador: info.operador,
            remolque: info.remolque,
          };
        });
        
        // Ordenar por económico
        unidadesMapeadas.sort((a, b) => parseInt(a.economico) - parseInt(b.economico));
        
        setUnidades(unidadesMapeadas);
        setError(null);
        
        // Última actualización
        const latest = data.reduce((max: Date | null, u: any) => {
          const d = u.timestamp_updated ? new Date(u.timestamp_updated) : null;
          return d && (!max || d > max) ? d : max;
        }, null);
        if (latest) setLastUpdate(latest);
      }
    } catch (err) {
      console.error('❌ Error:', err);
      setError(String(err));
    } finally {
      setCargando(false);
    }
  }, []);

  // Cargar al inicio y suscribirse a cambios
  useEffect(() => {
    cargarUnidades();
    
    // Suscripción realtime
    const channel = supabase
      .channel('carroll_gps_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'gps_tracking' },
        () => cargarUnidades()
      )
      .subscribe();

    // Refrescar cada 30 segundos
    const interval = setInterval(cargarUnidades, 30000);

    return () => {
      channel.unsubscribe();
      clearInterval(interval);
    };
  }, [cargarUnidades]);

  // Stats
  const stats = {
    total: unidades.length,
    conGPS: unidades.filter(u => u.latitude && u.latitude !== 0).length,
    enMovimiento: unidades.filter(u => u.status === 'moving').length,
    detenidos: unidades.filter(u => u.status === 'stopped').length,
    sinSenal: unidades.filter(u => !u.latitude || u.latitude === 0).length,
  };

  const openGoogleMaps = (lat: number, lon: number) => {
    window.open(`https://www.google.com/maps?q=${lat},${lon}`, '_blank');
  };

  const formatTime = (t: string | null) => {
    if (!t) return '-';
    try {
      return new Date(t).toLocaleString('es-MX', { 
        day: '2-digit', 
        month: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
      });
    } catch { return t; }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'moving': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'stopped': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-red-500/20 text-red-400 border-red-500/30';
    }
  };

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B1220' }}>
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
          <div className="text-white text-lg">Cargando GPS Carroll...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#FAFBFC' }}>
      {/* TOP BAR */}
      <div style={{ background: 'linear-gradient(135deg, #0B1220 0%, #1a2332 100%)', borderBottom: '1px solid rgba(30, 102, 245, 0.3)', height: '60px' }}>
        <div className="px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 rounded-lg" style={{ background: 'rgba(30, 102, 245, 0.15)', border: '1px solid rgba(30, 102, 245, 0.3)', color: 'white' }}>
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '22px', fontWeight: 700, color: 'white' }}>OPERATIONS HUB · GRANJAS CARROLL</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-4 py-2 rounded-lg" style={{ border: '1px solid rgba(30, 102, 245, 0.25)' }}>
              <Clock className="w-5 h-5" style={{ color: '#60A5FA' }} />
              <span style={{ color: 'white', fontFamily: "'Exo 2', sans-serif" }}>
                {horaActual.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })} · {horaActual.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.5)' }}>
              <CheckCircle2 className="w-4 h-4" style={{ color: '#10B981' }} />
              <span style={{ color: '#10B981', fontSize: '11px', fontWeight: 700 }}>{stats.conGPS}/{stats.total}</span>
            </div>
          </div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div style={{ background: '#F3F5F8', borderBottom: '1px solid #E2E6EE', padding: '12px 24px' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Stats Pills */}
            <div className="flex gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200">
                <Truck className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-semibold text-slate-700">{stats.total}</span>
                <span className="text-xs text-slate-400">Total</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 border border-green-200">
                <Navigation className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold text-green-700">{stats.enMovimiento}</span>
                <span className="text-xs text-green-500">Mov</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-50 border border-yellow-200">
                <Power className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-semibold text-yellow-700">{stats.detenidos}</span>
                <span className="text-xs text-yellow-500">Det</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200">
                <WifiOff className="w-4 h-4 text-red-600" />
                <span className="text-sm font-semibold text-red-700">{stats.sinSenal}</span>
                <span className="text-xs text-red-500">Sin GPS</span>
              </div>
            </div>
          </div>
          
          {lastUpdate && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Clock className="w-4 h-4" />
              <span>Última actualización: {lastUpdate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
            </div>
          )}
        </div>
      </div>

      {/* TABLA */}
      <div className="p-6">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
          <div className="grid grid-cols-[50px_100px_1.5fr_2fr_100px_100px_150px] gap-3 px-4 py-3 bg-gradient-to-r from-slate-700 to-slate-800 text-white text-xs font-bold">
            <div className="text-center">#</div>
            <div>UNIDAD</div>
            <div>OPERADOR</div>
            <div>UBICACIÓN GPS</div>
            <div className="text-center">ESTADO</div>
            <div className="text-center">VEL</div>
            <div>SEÑAL</div>
          </div>
          <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
            {unidades.map((unidad, index) => {
              const tieneGPS = unidad.latitude && unidad.latitude !== 0;
              
              return (
                <div 
                  key={unidad.economico} 
                  className="grid grid-cols-[50px_100px_1.5fr_2fr_100px_100px_150px] gap-3 px-4 py-3 border-b border-slate-100 hover:bg-blue-50 transition-colors"
                  style={{ background: index % 2 === 0 ? '#fff' : '#F8F9FB' }}
                >
                  {/* # */}
                  <div className="flex items-center justify-center text-slate-500 font-bold">{index + 1}</div>
                  
                  {/* UNIDAD */}
                  <div className="flex items-center">
                    <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-blue-50 border border-blue-200">
                      <Truck className="w-4 h-4 text-blue-500" />
                      <div>
                        <div className="font-bold text-blue-600 text-lg">{unidad.economico}</div>
                        <div className="text-xs text-slate-400">R-{unidad.remolque}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* OPERADOR */}
                  <div className="flex items-center text-sm font-semibold text-slate-700">
                    {unidad.operador}
                  </div>
                  
                  {/* UBICACIÓN GPS */}
                  <div className="flex items-center">
                    {tieneGPS ? (
                      <button 
                        onClick={() => openGoogleMaps(unidad.latitude!, unidad.longitude!)}
                        className="flex items-center gap-2 text-left hover:bg-blue-100 px-2 py-1 rounded-lg transition-colors"
                      >
                        <MapPin className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <div>
                          <div className="text-sm text-slate-700 truncate max-w-[300px]">
                            {unidad.address || `${unidad.latitude?.toFixed(4)}, ${unidad.longitude?.toFixed(4)}`}
                          </div>
                          <div className="text-xs text-green-500 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                            Live GPS
                          </div>
                        </div>
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </button>
                    ) : (
                      <span className="text-slate-400 text-sm italic flex items-center gap-2">
                        <WifiOff className="w-4 h-4 text-red-400" />
                        Sin señal GPS
                      </span>
                    )}
                  </div>
                  
                  {/* ESTADO */}
                  <div className="flex items-center justify-center">
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold border ${getStatusColor(unidad.status)}`}>
                      {unidad.status === 'moving' ? 'Transito' : unidad.status === 'stopped' ? 'Detenido' : 'Sin GPS'}
                    </span>
                  </div>
                  
                  {/* VELOCIDAD */}
                  <div className="flex items-center justify-center">
                    <span className={`text-sm font-bold ${(unidad.speed || 0) > 0 ? 'text-green-500' : 'text-slate-400'}`}>
                      {tieneGPS ? `${unidad.speed || 0} km/h` : '-'}
                    </span>
                  </div>
                  
                  {/* SEÑAL */}
                  <div className="flex items-center text-xs text-slate-500">
                    {formatTime(unidad.timestamp_gps)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {error && (
          <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-5 h-5" /> {error}
          </div>
        )}
        
        {unidades.length === 0 && !error && (
          <div className="mt-4 p-8 bg-yellow-50 border border-yellow-200 rounded-xl text-center">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <p className="text-yellow-700 font-semibold">No se encontraron unidades CARROLL en la base de datos</p>
            <p className="text-yellow-600 text-sm mt-2">Verifica que el segmento esté configurado correctamente en gps_tracking</p>
          </div>
        )}
      </div>
    </div>
  );
};
