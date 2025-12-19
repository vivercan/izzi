import { useState, useEffect, useCallback } from 'react';
import { Truck, ArrowLeft, MapPin, Clock, AlertTriangle, CheckCircle2, Navigation, Power, WifiOff, ExternalLink, RefreshCw, Wrench, MapPinned } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fbxbsslhewchyibdoyzk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieGJzc2xoZXdjaHlpYmRveXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzczODEsImV4cCI6MjA3ODExMzM4MX0.Z8JPlg7hhKbA624QGHp2bKKTNtCD3WInQMO5twjl6a0';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface DedicadosModuleProps {
  onBack: () => void;
}

interface UnidadCarroll {
  economico: string;
  empresa: string;
  latitude: number | null;
  longitude: number | null;
  speed: number | null;
  address: string | null;
  timestamp_gps: string | null;
  timestamp_updated: string | null;
  status: string;
  operador: string;
  remolque: string;
  mtto: number;
  origen: string;
  destino: string;
}

// Datos de operadores Carroll
const OPERADORES: Record<string, { operador: string; remolque: string; mtto: number; origen: string; destino: string }> = {
  '118': { operador: 'OPERADOR CARROLL', remolque: 'N/A', mtto: 45, origen: 'Tepeji, Hidalgo', destino: 'Granjas Carroll' },
  '148': { operador: 'OPERADOR CARROLL', remolque: 'N/A', mtto: 60, origen: 'Perote, Veracruz', destino: 'Granjas Carroll' },
  '178': { operador: 'CRISTIAN CORTEZ PORTILLO', remolque: '1376', mtto: 72, origen: 'Oriental, Puebla', destino: 'Granjas Carroll' },
  '208': { operador: 'MARCO ANTONIO GARCIA RAMIREZ', remolque: '1282', mtto: 58, origen: 'Puebla', destino: 'Granjas Carroll' },
  '212': { operador: 'CHRISTIAN OJEDA VELAZQUEZ', remolque: '838843', mtto: 88, origen: 'Ciudad de Libres, Puebla', destino: 'Granjas Carroll' },
  '214': { operador: 'OPERADOR CARROLL', remolque: 'N/A', mtto: 35, origen: 'Oriental, Puebla', destino: 'Granjas Carroll' },
  '433': { operador: 'OPERADOR CARROLL', remolque: 'N/A', mtto: 40, origen: 'Perote, Veracruz', destino: 'Granjas Carroll' },
  '505': { operador: 'RAUL BAUTISTA LOPEZ', remolque: '1292', mtto: 50, origen: 'Tepeji, Hidalgo', destino: 'Granjas Carroll' },
  '643': { operador: 'OPERADOR CARROLL', remolque: 'N/A', mtto: 55, origen: 'Oriental, Puebla', destino: 'Granjas Carroll' },
  '727': { operador: 'OPERADOR CARROLL', remolque: 'N/A', mtto: 62, origen: 'Perote, Veracruz', destino: 'Granjas Carroll' },
  '731': { operador: 'MARIO LARA TIBURCIO', remolque: '1398', mtto: 48, origen: 'Oriental, Puebla', destino: 'Granjas Carroll' },
  '745': { operador: 'CARLOS SERGIO FLORES VERGES', remolque: '1254', mtto: 75, origen: 'Oriental, Puebla', destino: 'Granjas Carroll' },
  '765': { operador: 'HECTOR CHRISTIAN JAIME LEON', remolque: '838855', mtto: 72, origen: 'Ciudad Nezahualcóyotl, Estado de México', destino: 'Granjas Carroll' },
  '777': { operador: 'LUIS ANGEL TAPIA RODRIGUEZ', remolque: '1356', mtto: 65, origen: 'Tepeji, Hidalgo', destino: 'Granjas Carroll' },
  '799': { operador: 'RUBEN CALDERON JASSO', remolque: '1322', mtto: 0, origen: 'Sin asignar', destino: 'Sin asignar' },
  '801': { operador: 'FERNANDO GUZMAN SERVN', remolque: '1378', mtto: 55, origen: 'Oriental, Puebla', destino: 'Granjas Carroll' },
  '809': { operador: 'RUMUALDO BAUTISTA GOMEZ', remolque: '28654', mtto: 68, origen: 'Tepeji, Hidalgo', destino: 'Granjas Carroll' },
  '813': { operador: 'EDGAR IVAN HERNANDEZ', remolque: '1360', mtto: 33, origen: 'San Antonio Virreyes, Puebla', destino: 'Granjas Carroll' },
  '817': { operador: 'JUAN RAMIREZ MONTES', remolque: '1278', mtto: 42, origen: 'Oriental, Puebla', destino: 'Granjas Carroll' },
  '837': { operador: 'JOSE ALBERTO MORANCHEL VILLANUEVA', remolque: '1296', mtto: 40, origen: 'San Antonio Virreyes, Puebla', destino: 'Granjas Carroll' },
  '841': { operador: 'RENE ALONSO VAZQUEZ CRUZ', remolque: '1262', mtto: 58, origen: 'Perote, Veracruz', destino: 'Granjas Carroll' },
  '847': { operador: 'VICTOR FRANCO MONTAÑO', remolque: '1396', mtto: 70, origen: 'Oriental, Puebla', destino: 'Granjas Carroll' },
  '859': { operador: 'HECTOR ADRIAN LOPEZ MEDINA', remolque: '1414', mtto: 45, origen: 'Tepeji, Hidalgo', destino: 'Granjas Carroll' },
  '861': { operador: 'JUAN FRANCISCO LEOS FRAGOSO', remolque: '1208', mtto: 52, origen: 'Oriental, Puebla', destino: 'Granjas Carroll' },
  '863': { operador: 'OCTAVIO VILLELA TRENADO', remolque: '4113', mtto: 38, origen: 'Perote, Veracruz', destino: 'Granjas Carroll' },
  '879': { operador: 'OPERADOR CARROLL', remolque: 'N/A', mtto: 30, origen: 'Oriental, Puebla', destino: 'Granjas Carroll' },
  '891': { operador: 'FEDERICO CLEMENTE QUINTERO', remolque: '1350', mtto: 65, origen: 'Tepeji, Hidalgo', destino: 'Granjas Carroll' },
  '893': { operador: 'MARCELO SANCHEZ RODRIGUEZ', remolque: '1406', mtto: 20, origen: 'Oriental, Puebla', destino: 'Granjas Carroll' },
  '899': { operador: 'JULIO ENRIQUE ARELLANO PEREZ', remolque: '1332', mtto: 50, origen: 'Parque Industrial Tepeji, Hidalgo', destino: 'Granjas Carroll' },
  '905': { operador: 'JUAN ALAN DIAZ MARTINEZ', remolque: '1260', mtto: 48, origen: 'Oriental, Puebla', destino: 'Granjas Carroll' },
  '911': { operador: 'ENRIQUE URBAN FLORES', remolque: '1256', mtto: 55, origen: 'Perote, Veracruz', destino: 'Granjas Carroll' },
  '931': { operador: 'MARCELO SANCHEZ RODRIGUEZ', remolque: '1288', mtto: 62, origen: 'Oriental, Puebla', destino: 'Granjas Carroll' },
  '933': { operador: 'JUAN MANUEL OJEDA VELAZQUEZ', remolque: '1328', mtto: 20, origen: 'Oriental, Puebla', destino: 'Granjas Carroll' },
  '937': { operador: 'VICTOR ISLAS ORIA', remolque: '1348', mtto: 75, origen: 'Tepeji, Hidalgo', destino: 'Granjas Carroll' },
  '945': { operador: 'OPERADOR CARROLL', remolque: 'N/A', mtto: 42, origen: 'Oriental, Puebla', destino: 'Granjas Carroll' },
};

export const DedicadosModuleWideTech = ({ onBack }: DedicadosModuleProps) => {
  const [unidades, setUnidades] = useState<UnidadCarroll[]>([]);
  const [cargando, setCargando] = useState(true);
  const [horaActual, setHoraActual] = useState(new Date());
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setHoraActual(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const cargarUnidades = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('gps_tracking')
        .select('*')
        .or('segmento.eq.CARROL,segmento.eq.CARROLL');

      if (error) throw error;

      if (data && data.length > 0) {
        const mapped: UnidadCarroll[] = data.map((r: any) => {
          const info = OPERADORES[r.economico] || { 
            operador: 'OPERADOR CARROLL', 
            remolque: 'N/A', 
            mtto: 50, 
            origen: 'Oriental, Puebla', 
            destino: 'Granjas Carroll' 
          };
          
          return {
            economico: r.economico || '',
            empresa: r.empresa || 'TROB',
            latitude: r.latitude,
            longitude: r.longitude,
            speed: r.speed,
            address: r.address || '',
            timestamp_gps: r.timestamp_gps,
            timestamp_updated: r.timestamp_updated,
            status: r.status || 'stopped',
            operador: info.operador,
            remolque: info.remolque,
            mtto: info.mtto,
            origen: info.origen,
            destino: info.destino,
          };
        });
        
        mapped.sort((a, b) => parseInt(a.economico) - parseInt(b.economico));
        setUnidades(mapped);
        
        const latest = data.reduce((max: Date | null, u: any) => {
          const d = u.timestamp_updated ? new Date(u.timestamp_updated) : null;
          return d && (!max || d > max) ? d : max;
        }, null);
        if (latest) setLastUpdate(latest);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarUnidades();
    
    const channel = supabase
      .channel('carroll_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gps_tracking' }, () => cargarUnidades())
      .subscribe();

    const interval = setInterval(cargarUnidades, 30000);
    return () => { channel.unsubscribe(); clearInterval(interval); };
  }, [cargarUnidades]);

  // CORREGIDO: Sin señal = cuando NO hay latitude o latitude es 0
  const tieneGPS = (u: UnidadCarroll) => u.latitude !== null && u.latitude !== 0;
  
  const stats = {
    total: unidades.length,
    conGPS: unidades.filter(tieneGPS).length,
    enMovimiento: unidades.filter(u => tieneGPS(u) && u.status === 'moving').length,
    detenidos: unidades.filter(u => tieneGPS(u) && u.status === 'stopped').length,
    sinSenal: unidades.filter(u => !tieneGPS(u)).length,
  };

  const openGoogleMaps = (lat: number, lon: number) => {
    window.open(`https://www.google.com/maps?q=${lat},${lon}`, '_blank');
  };

  const formatTime = (t: string | null) => {
    if (!t) return '-';
    try {
      return new Date(t).toLocaleString('es-MX', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true });
    } catch { return t; }
  };

  const getMttoColor = (mtto: number) => {
    if (mtto >= 70) return 'text-green-600 bg-green-50';
    if (mtto >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
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
      <div style={{ background: 'linear-gradient(135deg, #0B1220 0%, #1a2332 100%)', height: '60px' }}>
        <div className="px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 rounded-lg" style={{ background: 'rgba(30, 102, 245, 0.15)', border: '1px solid rgba(30, 102, 245, 0.3)', color: 'white' }}>
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '22px', fontWeight: 700, color: 'white' }}>
              OPERATIONS HUB · GRANJAS CARROLL
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-4 py-2 rounded-lg" style={{ border: '1px solid rgba(30, 102, 245, 0.25)' }}>
              <Clock className="w-5 h-5" style={{ color: '#60A5FA' }} />
              <span style={{ color: 'white', fontFamily: "'Exo 2', sans-serif" }}>
                {horaActual.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })} · {horaActual.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true })}
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.5)' }}>
              <CheckCircle2 className="w-4 h-4" style={{ color: '#10B981' }} />
              <span style={{ color: '#10B981', fontSize: '13px', fontWeight: 700 }}>{stats.conGPS}/{stats.total}</span>
            </div>
            <div className="px-3 py-2 rounded-lg" style={{ background: '#1E3A5F' }}>
              <span style={{ color: 'white', fontSize: '13px', fontWeight: 700 }}>{stats.total}</span>
              <span style={{ color: '#94A3B8', fontSize: '11px', marginLeft: '4px' }}>TOTAL</span>
            </div>
          </div>
        </div>
      </div>

      {/* STATS BAR */}
      <div style={{ background: '#F3F5F8', borderBottom: '1px solid #E2E6EE', padding: '12px 24px' }}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 shadow-sm">
            <Truck className="w-4 h-4 text-slate-600" />
            <span className="text-sm font-bold text-slate-700">{stats.total}</span>
            <span className="text-xs text-slate-400">Total</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-50 border border-green-200">
            <Navigation className="w-4 h-4 text-green-600" />
            <span className="text-sm font-bold text-green-700">{stats.enMovimiento}</span>
            <span className="text-xs text-green-500">En Tránsito</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-50 border border-yellow-200">
            <Power className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-bold text-yellow-700">{stats.detenidos}</span>
            <span className="text-xs text-yellow-500">Detenidos</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 border border-red-200">
            <WifiOff className="w-4 h-4 text-red-500" />
            <span className="text-sm font-bold text-red-600">{stats.sinSenal}</span>
            <span className="text-xs text-red-400">Sin Señal</span>
          </div>
          
          <div className="flex-1" />
          
          {lastUpdate && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Clock className="w-4 h-4" />
              Última actualización: <span className="font-semibold text-slate-700">{lastUpdate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
            </div>
          )}
        </div>
      </div>

      {/* TABLA */}
      <div className="p-4">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
          {/* Header */}
          <div className="grid grid-cols-[40px_90px_1fr_1.5fr_90px_70px_90px_1fr_1fr_110px] gap-2 px-3 py-2.5 bg-gradient-to-r from-slate-700 to-slate-800 text-white text-[11px] font-bold uppercase">
            <div className="text-center">#</div>
            <div>Unidad</div>
            <div>Operador</div>
            <div>Ubicación GPS</div>
            <div className="text-center">Estado</div>
            <div className="text-center">Vel</div>
            <div className="text-center">MTTO</div>
            <div>Origen</div>
            <div>Destino</div>
            <div>Señal</div>
          </div>
          
          {/* Body */}
          <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
            {unidades.map((u, idx) => {
              const gpsOK = tieneGPS(u);
              
              return (
                <div key={u.economico} 
                  className="grid grid-cols-[40px_90px_1fr_1.5fr_90px_70px_90px_1fr_1fr_110px] gap-2 px-3 py-2 border-b border-slate-100 hover:bg-blue-50/50 transition-colors items-center"
                  style={{ background: idx % 2 === 0 ? '#fff' : '#F8FAFC' }}>
                  
                  {/* # */}
                  <div className="text-center text-slate-400 font-bold text-xs">{idx + 1}</div>
                  
                  {/* UNIDAD */}
                  <div className="flex items-center">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-50 border border-blue-200">
                      <Truck className="w-3.5 h-3.5 text-blue-500" />
                      <div>
                        <div className="font-bold text-blue-700 text-sm">{u.economico}</div>
                        <div className="text-[9px] text-slate-400">R-{u.remolque}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* OPERADOR */}
                  <div className="text-xs font-semibold text-slate-700 truncate">{u.operador}</div>
                  
                  {/* UBICACIÓN GPS */}
                  <div className="flex items-center">
                    {gpsOK ? (
                      <button 
                        onClick={() => openGoogleMaps(u.latitude!, u.longitude!)}
                        className="flex items-center gap-1.5 text-left hover:bg-blue-100 px-1.5 py-0.5 rounded transition-colors group">
                        <MapPin className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-slate-700 truncate max-w-[200px]">
                            {u.address || `${u.latitude?.toFixed(4)}, ${u.longitude?.toFixed(4)}`}
                          </div>
                          <div className="text-[9px] text-green-500 flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse"></span>
                            Live GPS
                          </div>
                        </div>
                        <ExternalLink className="w-2.5 h-2.5 text-slate-400 opacity-0 group-hover:opacity-100" />
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 text-slate-400 text-xs italic">
                        <WifiOff className="w-3.5 h-3.5 text-red-400" />
                        Sin señal GPS
                      </div>
                    )}
                  </div>
                  
                  {/* ESTADO */}
                  <div className="flex items-center justify-center">
                    {gpsOK ? (
                      u.status === 'moving' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 border border-green-300">
                          Transito
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-100 text-yellow-700 border border-yellow-300">
                          Detenido
                        </span>
                      )
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-600 border border-red-300">
                        Sin GPS
                      </span>
                    )}
                  </div>
                  
                  {/* VELOCIDAD */}
                  <div className="flex items-center justify-center">
                    {gpsOK ? (
                      <span className={`text-xs font-bold ${(u.speed || 0) > 0 ? 'text-green-600' : 'text-slate-400'}`}>
                        {u.speed || 0} km/h
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </div>
                  
                  {/* MTTO */}
                  <div className="flex items-center justify-center">
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${getMttoColor(u.mtto)}`}>
                      <Wrench className="w-3 h-3" />
                      {u.mtto}%
                    </div>
                  </div>
                  
                  {/* ORIGEN */}
                  <div className="flex items-center gap-1 text-xs text-slate-600 truncate">
                    <MapPinned className="w-3 h-3 text-blue-400 flex-shrink-0" />
                    <span className="truncate">{u.origen}</span>
                  </div>
                  
                  {/* DESTINO */}
                  <div className="flex items-center gap-1 text-xs text-slate-600 truncate">
                    <MapPinned className="w-3 h-3 text-orange-400 flex-shrink-0" />
                    <span className="truncate">{u.destino}</span>
                  </div>
                  
                  {/* SEÑAL */}
                  <div className="text-[10px] text-slate-500">
                    {formatTime(u.timestamp_gps)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
