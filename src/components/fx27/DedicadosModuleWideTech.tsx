import { useState, useEffect, useCallback } from 'react';
import { Truck, ArrowLeft, MapPin, Clock, AlertTriangle, FileText, Activity, Map as MapIcon, TrendingUp, Package, CheckCircle2, AlertCircle, Settings, Power, Navigation, WifiOff, RefreshCw } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { MapaFlota } from './MapaFlotaGoogleMaps';
import { AdministracionCarroll } from './AdministracionCarroll';

// ═══════════════════════════════════════════════════════════════════════════
// 🔧 CONFIGURACIÓN SUPABASE - IGUAL QUE DESPACHO INTELIGENTE (MADRE)
// ═══════════════════════════════════════════════════════════════════════════
const SUPABASE_URL = 'https://fbxbsslhewchyibdoyzk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieGJzc2xoZXdjaHlpYmRveXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzczODEsImV4cCI6MjA3ODExMzM4MX0.Z8JPlg7hhKbA624QGHp2bKKTNtCD3WInQMO5twjl6a0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface DedicadosModuleProps {
  onBack: () => void;
}

// Interface igual que MADRE
interface Unit {
  economico: string;
  empresa: string;
  segmento: string;
  latitude: number | null;
  longitude: number | null;
  speed: number | null;
  address: string | null;
  timestamp_gps: string | null;
  timestamp_updated: string | null;
  stopped_minutes: number | null;
  stopped_time: string | null;
  status: string;
  anomaly: string | null;
}

// 🚚 31 TRACTOCAMIONES DEDICADOS GRANJAS CARROLL (del Excel)
const PLACAS_CARROLL = [
  '505', '643', '727', '731', '745', '765', '777', '801', '809', '813',
  '837', '841', '847', '859', '861', '863', '891', '893', '899', '905',
  '911', '931', '933', '937', '126', '178', '208', '212', '817', '799', '929'
];

// Mapeo de operadores por placa
const OPERADORES_CARROLL: Record<string, string> = {
  '505': 'RAUL BAUTISTA LOPEZ',
  '777': 'LUIS ANGEL TAPIA RODRIGUEZ',
  '893': 'MARCELO SANCHEZ RODRIGUEZ',
  '931': 'MARCELO SANCHEZ RODRIGUEZ',
  '937': 'VICTOR ISLAS ORIA',
  '891': 'FEDERICO CLEMENTE QUINTERO',
  '801': 'FERNANDO GUZMAN SERVN',
  '905': 'JUAN ALAN DIAZ MARTINEZ',
  '911': 'ENRIQUE URBAN FLORES',
  '841': 'RENE ALONSO VAZQUEZ CRUZ',
  '863': 'OCTAVIO VILLELA TRENADO',
  '861': 'JUAN FRANCISCO LEOS FRAGOSO',
  '817': 'JUAN RAMIREZ MONTES',
  '899': 'JULIO ENRIQUE ARELLANO PEREZ',
  '745': 'CARLOS SERGIO FLORES VERGES',
  '799': 'RUBEN CALDERON JASSO',
  '837': 'JOSE ALBERTO MORANCHEL VILLANUEVA',
  '933': 'JUAN MANUEL OJEDA VELAZQUEZ',
  '212': 'CHRISTIAN OJEDA VELAZQUEZ',
  '765': 'HECTOR CHRISTIAN JAIME LEON',
  '208': 'MARCO ANTONIO GARCIA RAMIREZ',
  '813': 'EDGAR IVAN HERNANDEZ',
  '126': 'ALEJANDRO VILLANUEVA ESPINOZA',
  '809': 'RUMUALDO BAUTISTA GOMEZ',
  '859': 'HECTOR ADRIAN LOPEZ MEDINA',
  '178': 'CRISTIAN CORTEZ PORTILLO',
  '731': 'MARIO LARA TIBURCIO',
  '847': 'VICTOR FRANCO MONTAÑO',
  '643': 'OPERADOR CARROLL',
  '727': 'OPERADOR CARROLL',
  '929': 'OPERADOR CARROLL'
};

// Mapeo de remolques por placa
const REMOLQUES_CARROLL: Record<string, string> = {
  '505': '1292', '777': '1356', '893': '1406', '931': '1288', '937': '1348',
  '891': '1350', '801': '1378', '905': '1260', '911': '1256', '841': '1262',
  '863': '4113', '861': '1208', '817': '1278', '899': '1332', '745': '1254',
  '799': '1322', '837': '1296', '933': '1328', '212': '838843', '765': '838855',
  '208': '1282', '813': '1360', '126': '838656', '809': '28654', '859': '1414',
  '178': '1376', '731': '1398', '847': '1396', '643': 'N/A', '727': 'N/A', '929': 'N/A'
};

export const DedicadosModuleWideTech = ({ onBack }: DedicadosModuleProps) => {
  const [fleet, setFleet] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [horaActual, setHoraActual] = useState(new Date());
  const [mostrarMapa, setMostrarMapa] = useState(false);
  const [unidadSeleccionada, setUnidadSeleccionada] = useState<string | null>(null);
  const [mostrarAdministracion, setMostrarAdministracion] = useState(false);
  const [tabActivo, setTabActivo] = useState('entregas');
  const [error, setError] = useState<string | null>(null);

  // Actualizar reloj cada segundo
  useEffect(() => {
    const timer = setInterval(() => setHoraActual(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // 📡 CARGAR DATOS DESDE GPS_TRACKING (IGUAL QUE MADRE)
  // ═══════════════════════════════════════════════════════════════════════════
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      console.log('🔄 [Carroll] Cargando GPS desde gps_tracking...');
      
      // Consultar gps_tracking filtrando por CARROL o por las placas específicas
      const { data, error: dbError } = await supabase
        .from('gps_tracking')
        .select('*')
        .or(`segmento.eq.CARROL,segmento.eq.CARROLL,economico.in.(${PLACAS_CARROLL.join(',')})`);

      if (dbError) throw dbError;

      if (data && data.length > 0) {
        console.log(`✅ [Carroll] ${data.length} unidades encontradas en gps_tracking`);
        setFleet(data);
        
        // Encontrar última actualización
        const latest = data.reduce((max, u) => {
          const d = u.timestamp_updated ? new Date(u.timestamp_updated) : null;
          return d && (!max || d > max) ? d : max;
        }, null as Date | null);
        
        if (latest) setLastUpdate(latest);
        setError(null);
      } else {
        console.log('⚠️ [Carroll] No hay datos en gps_tracking, mostrando placas sin GPS');
        // Crear unidades vacías para las placas de Carroll
        const unidadesVacias: Unit[] = PLACAS_CARROLL.map(placa => ({
          economico: placa,
          empresa: 'TROB',
          segmento: 'CARROL',
          latitude: null,
          longitude: null,
          speed: null,
          address: null,
          timestamp_gps: null,
          timestamp_updated: null,
          stopped_minutes: null,
          stopped_time: null,
          status: 'no_signal',
          anomaly: null
        }));
        setFleet(unidadesVacias);
      }
    } catch (err) {
      console.error('❌ [Carroll] Error cargando datos:', err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar datos al inicio y cada 10 minutos
  useEffect(() => {
    loadData();
    
    // Suscripción a cambios en tiempo real (igual que MADRE)
    const channel = supabase
      .channel('gps_carroll_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'gps_tracking' },
        (payload) => {
          console.log('📡 [Carroll] Cambio detectado en gps_tracking:', payload);
          loadData();
        }
      )
      .subscribe();

    // Actualizar cada 10 minutos
    const interval = setInterval(() => {
      console.log('⏰ [Carroll] Actualización automática (10 min)');
      loadData();
    }, 10 * 60 * 1000);

    return () => {
      channel.unsubscribe();
      clearInterval(interval);
    };
  }, [loadData]);

  // Filtrar solo unidades de Carroll
  const unidadesCarroll = fleet.filter(u => 
    u.segmento === 'CARROL' || 
    u.segmento === 'CARROLL' || 
    PLACAS_CARROLL.includes(u.economico)
  );

  // Stats
  const stats = {
    total: unidadesCarroll.length || PLACAS_CARROLL.length,
    mov: unidadesCarroll.filter(u => u.status === 'moving').length,
    det: unidadesCarroll.filter(u => u.status === 'stopped').length,
    sin: unidadesCarroll.filter(u => ['no_signal', 'gps_issue', 'pending'].includes(u.status)).length
  };

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'moving': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'stopped': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'gps_issue': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-red-500/20 text-red-400 border-red-500/30';
    }
  };

  const getStoppedColor = (minutes: number | null) => {
    if (!minutes || minutes < 1) return 'text-slate-500';
    if (minutes >= 480) return 'text-red-400';
    if (minutes >= 240) return 'text-orange-400';
    if (minutes >= 60) return 'text-yellow-400';
    return 'text-slate-400';
  };

  const formatTime = (t: string | null) => {
    if (!t) return '-';
    try {
      return new Date(t.includes('/') ? t.replace(/\//g, '-') : t)
        .toLocaleString('es-MX', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true });
    } catch { return t; }
  };

  const openMap = (u: Unit) => u.latitude && window.open(`https://www.google.com/maps?q=${u.latitude},${u.longitude}`, '_blank');

  // Si no hay datos de Carroll, mostrar todas las placas esperadas
  const unidadesAMostrar = unidadesCarroll.length > 0 
    ? unidadesCarroll 
    : PLACAS_CARROLL.map(placa => ({
        economico: placa,
        empresa: 'TROB',
        segmento: 'CARROL',
        latitude: null,
        longitude: null,
        speed: null,
        address: null,
        timestamp_gps: null,
        timestamp_updated: null,
        stopped_minutes: null,
        stopped_time: null,
        status: 'no_signal',
        anomaly: null
      } as Unit));

  return (
    <div className="min-h-screen" style={{ background: '#FAFBFC' }}>
      {/* ========== TOP BAR OSCURA ESTILO FX27 ========== */}
      <div style={{
        background: 'linear-gradient(135deg, #0B1220 0%, #1a2332 100%)',
        borderBottom: '1px solid rgba(30, 102, 245, 0.3)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        height: '60px'
      }}>
        <div className="px-6 h-full flex items-center justify-between">
          {/* LEFT: BACK + TITLE */}
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 rounded-lg transition-all"
              style={{
                background: 'rgba(30, 102, 245, 0.15)',
                border: '1px solid rgba(30, 102, 245, 0.3)',
                color: 'white'
              }}
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
            </button>

            <h1 style={{
              fontFamily: "'Exo 2', sans-serif",
              fontSize: '22px',
              fontWeight: 700,
              color: 'white',
              letterSpacing: '0.5px',
            }}>
              OPERATIONS HUB · GRANJAS CARROLL
            </h1>
          </div>

          {/* RIGHT: CLOCK + GPS STATUS */}
          <div className="flex items-center gap-4">
            {/* RELOJ */}
            <div className="flex items-center gap-3 px-4 py-2 rounded-lg" style={{ 
              background: 'transparent',
              border: '1px solid rgba(30, 102, 245, 0.25)',
            }}>
              <Clock className="w-5 h-5" style={{ color: '#60A5FA' }} />
              <div style={{ 
                fontFamily: "'Exo 2', sans-serif", 
                fontSize: '14px', 
                fontWeight: 600, 
                color: 'rgba(255, 255, 255, 0.95)',
              }}>
                {horaActual.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                <span style={{ margin: '0 8px', color: 'rgba(255, 255, 255, 0.5)' }}>·</span>
                <span style={{ 
                  fontFamily: "'Orbitron', monospace",
                  fontSize: '15px',
                  fontWeight: 700,
                  color: '#60A5FA',
                }}>
                  {horaActual.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })}
                </span>
              </div>
            </div>

            {/* GPS STATUS */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{
              background: loading ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              border: `1px solid ${loading ? 'rgba(245, 158, 11, 0.5)' : 'rgba(16, 185, 129, 0.5)'}`,
            }}>
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" style={{ color: '#F59E0B' }} />
                  <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 700, color: '#F59E0B' }}>
                    Sync... {stats.mov + stats.det}/{stats.total}
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" style={{ color: '#10B981' }} />
                  <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 700, color: '#10B981' }}>
                    En línea {stats.mov + stats.det}/{stats.total}
                  </span>
                </>
              )}
            </div>

            {/* REFRESH MANUAL */}
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 rounded-lg transition-all"
              style={{
                background: 'rgba(30, 102, 245, 0.15)',
                border: '1px solid rgba(30, 102, 245, 0.3)',
                color: 'white'
              }}
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* SETTINGS */}
            <button
              onClick={() => setMostrarAdministracion(true)}
              className="p-2 rounded-lg transition-all"
              style={{
                background: 'rgba(30, 102, 245, 0.15)',
                border: '1px solid rgba(30, 102, 245, 0.3)',
                color: 'white'
              }}
            >
              <Settings className="w-5 h-5" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      {mostrarAdministracion ? (
        <AdministracionCarroll onBack={() => setMostrarAdministracion(false)} />
      ) : (
        <>
          {/* ========== TOOLBAR ========== */}
          <div style={{ background: '#F3F5F8', borderBottom: '1px solid #E2E6EE', padding: '12px 24px' }}>
            <div className="flex items-center justify-between gap-6">
              {/* TABS + MAPA */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
                  {['Entregas', 'Regresos', 'Puntual', 'Retraso', 'Adelanto', 'Asignación'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setTabActivo(tab.toLowerCase())}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        color: tabActivo === tab.toLowerCase() ? '#1E66F5' : '#64748B',
                        background: tabActivo === tab.toLowerCase() ? 'rgba(30, 102, 245, 0.1)' : 'transparent',
                      }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setMostrarMapa(true)}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-white border border-blue-500 text-blue-500 text-xs font-semibold"
                >
                  <MapIcon className="w-4 h-4" />
                  Mapa
                </button>
              </div>

              {/* MINI KPIs */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-slate-200">
                  <Truck className="w-4 h-4 text-slate-400" />
                  <span className="text-xl font-bold text-slate-800">{stats.total}</span>
                  <span className="text-xs text-slate-500">Total</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-green-200">
                  <Navigation className="w-4 h-4 text-green-500" />
                  <span className="text-xl font-bold text-green-600">{stats.mov}</span>
                  <span className="text-xs text-green-600">Mov</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-yellow-200">
                  <Power className="w-4 h-4 text-yellow-500" />
                  <span className="text-xl font-bold text-yellow-600">{stats.det}</span>
                  <span className="text-xs text-yellow-600">Det</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-red-200">
                  <WifiOff className="w-4 h-4 text-red-500" />
                  <span className="text-xl font-bold text-red-600">{stats.sin}</span>
                  <span className="text-xs text-red-600">Sin</span>
                </div>
              </div>
            </div>
          </div>

          {/* ========== TABLA ========== */}
          <div className="p-6">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
              {/* HEADER */}
              <div className="grid grid-cols-[50px_100px_180px_80px_100px_1fr_120px] gap-3 px-4 py-3 bg-gradient-to-r from-slate-700 to-slate-800 text-white">
                <div className="text-xs font-bold text-center">#</div>
                <div className="text-xs font-bold">UNIDAD</div>
                <div className="text-xs font-bold">OPERADOR</div>
                <div className="text-xs font-bold">STATUS</div>
                <div className="text-xs font-bold">PARADO</div>
                <div className="text-xs font-bold">UBICACIÓN GPS</div>
                <div className="text-xs font-bold">SEÑAL</div>
              </div>

              {/* FILAS */}
              <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
                {unidadesAMostrar.map((u, index) => (
                  <div
                    key={u.economico}
                    className="grid grid-cols-[50px_100px_180px_80px_100px_1fr_120px] gap-3 px-4 py-2 border-b border-slate-100 hover:bg-blue-50 transition-all"
                    style={{ background: index % 2 === 0 ? '#FFFFFF' : '#F8F9FB' }}
                  >
                    {/* # */}
                    <div className="flex items-center justify-center text-slate-500 font-mono font-bold">
                      {index + 1}
                    </div>

                    {/* UNIDAD */}
                    <div className="flex items-center">
                      <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-blue-50 border border-blue-200">
                        <Truck className="w-4 h-4 text-blue-500" />
                        <div>
                          <div className="font-mono font-bold text-blue-600 text-lg">{u.economico}</div>
                          <div className="text-xs text-slate-400">R-{REMOLQUES_CARROLL[u.economico] || 'N/A'}</div>
                        </div>
                      </div>
                    </div>

                    {/* OPERADOR */}
                    <div className="flex items-center">
                      <span className="text-sm font-semibold text-slate-700 truncate">
                        {OPERADORES_CARROLL[u.economico] || 'Sin asignar'}
                      </span>
                    </div>

                    {/* STATUS */}
                    <div className="flex items-center">
                      <button 
                        onClick={() => openMap(u)}
                        disabled={!u.latitude}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold border ${getStatusColor(u.status)} ${u.latitude ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed opacity-60'}`}
                      >
                        {u.status === 'moving' ? <Navigation className="w-3 h-3" /> : 
                         u.status === 'stopped' ? <Power className="w-3 h-3" /> : 
                         <WifiOff className="w-3 h-3" />}
                        {u.status === 'moving' ? 'Mov' : 
                         u.status === 'stopped' ? 'Det' : 'Sin'}
                      </button>
                    </div>

                    {/* PARADO */}
                    <div className="flex items-center">
                      <span className={`text-sm font-semibold ${getStoppedColor(u.stopped_minutes)}`}>
                        {u.stopped_time || '-'}
                      </span>
                    </div>

                    {/* UBICACIÓN */}
                    <div className="flex items-center">
                      {u.latitude ? (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-sm text-slate-700 truncate">{u.address || 'Sin dirección'}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400 italic">Sin señal GPS</span>
                      )}
                    </div>

                    {/* SEÑAL */}
                    <div className="flex items-center text-xs text-slate-400">
                      {formatTime(u.timestamp_gps)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ÚLTIMA ACTUALIZACIÓN */}
            {lastUpdate && (
              <div className="mt-4 text-center text-sm text-slate-500">
                Última actualización: {lastUpdate.toLocaleString('es-MX')} · Próxima en 10 min
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Error: {error}</span>
                </div>
              </div>
            )}
          </div>

          {/* MAPA */}
          {mostrarMapa && (
            <MapaFlota
              ubicaciones={unidadesCarroll.filter(u => u.latitude).map(u => ({
                placa: u.economico,
                latitude: u.latitude!,
                longitude: u.longitude!,
                speed: u.speed || 0,
                timestamp: u.timestamp_gps || '',
                odometer: 0,
                address: u.address || '',
                operador: OPERADORES_CARROLL[u.economico],
                numeroRemolque: REMOLQUES_CARROLL[u.economico]
              }))}
              unidadSeleccionada={unidadSeleccionada}
              onClose={() => {
                setMostrarMapa(false);
                setUnidadSeleccionada(null);
              }}
              onSeleccionarUnidad={(placa) => setUnidadSeleccionada(placa)}
            />
          )}
        </>
      )}
    </div>
  );
};
