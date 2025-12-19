import { useState, useEffect } from 'react';
import { Truck, ArrowLeft, MapPin, Clock, AlertTriangle, FileText, Activity, Map as MapIcon, TrendingUp, Package, CheckCircle2, AlertCircle, Settings } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { MapaFlota } from './MapaFlotaGoogleMaps';
import { UbicacionGPS } from './UbicacionGPS';
import { AdministracionCarroll } from './AdministracionCarroll';
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

interface Tractocamion {
  operador: string;
  numeroTracto: string;
  numeroRemolque: string;
}

interface UbicacionTracking {
  placa: string;
  latitude: number;
  longitude: number;
  speed: number;
  timestamp: string;
  odometer: number;
  address: string;
  operador?: string;
  numeroRemolque?: string;
}

// 🚚 28 TRACTOCAMIONES DEDICADOS GRANJAS CARROLL
const FLOTA_CARROLL: Tractocamion[] = [
  { operador: 'RAUL BAUTISTA LOPEZ', numeroTracto: '505', numeroRemolque: '1292' },
  { operador: 'LUIS ANGEL TAPIA RODRIGUEZ', numeroTracto: '777', numeroRemolque: '1356' },
  { operador: 'MARCELO SANCHEZ RODRIGUEZ', numeroTracto: '893', numeroRemolque: '1406' },
  { operador: 'MARCELO SANCHEZ RODRIGUEZ', numeroTracto: '931', numeroRemolque: '1288' },
  { operador: 'VICTOR ISLAS ORIA', numeroTracto: '937', numeroRemolque: '1348' },
  { operador: 'FEDERICO CLEMENTE QUINTERO', numeroTracto: '891', numeroRemolque: '1350' },
  { operador: 'FERNANDO GUZMAN SERVN', numeroTracto: '801', numeroRemolque: '1378' },
  { operador: 'JUAN ALAN DIAZ MARTINEZ', numeroTracto: '905', numeroRemolque: '1260' },
  { operador: 'ENRIQUE URBAN FLORES', numeroTracto: '911', numeroRemolque: '1256' },
  { operador: 'RENE ALONSO VAZQUEZ CRUZ', numeroTracto: '841', numeroRemolque: '1262' },
  { operador: 'OCTAVIO VILLELA TRENADO', numeroTracto: '863', numeroRemolque: '4113' },
  { operador: 'JUAN FRANCISCO LEOS FRAGOSO', numeroTracto: '861', numeroRemolque: '1208' },
  { operador: 'JUAN RAMIREZ MONTES', numeroTracto: '817', numeroRemolque: '1278' },
  { operador: 'JULIO ENRIQUE ARELLANO PEREZ', numeroTracto: '899', numeroRemolque: '1332' },
  { operador: 'CARLOS SERGIO FLORES VERGES', numeroTracto: '745', numeroRemolque: '1254' },
  { operador: 'RUBEN CALDERON JASSO', numeroTracto: '799', numeroRemolque: '1322' },
  { operador: 'JOSE ALBERTO MORANCHEL VILLANUEVA', numeroTracto: '837', numeroRemolque: '1296' },
  { operador: 'JUAN MANUEL OJEDA VELAZQUEZ', numeroTracto: '933', numeroRemolque: '1328' },
  { operador: 'CHRISTIAN OJEDA VELAZQUEZ', numeroTracto: '212', numeroRemolque: '838843' },
  { operador: 'HECTOR CHRISTIAN JAIME LEON', numeroTracto: '765', numeroRemolque: '838855' },
  { operador: 'MARCO ANTONIO GARCIA RAMIREZ', numeroTracto: '208', numeroRemolque: '1282' },
  { operador: 'EDGAR IVAN HERNANDEZ', numeroTracto: '813', numeroRemolque: '1360' },
  { operador: 'ALEJANDRO VILLANUEVA ESPINOZA', numeroTracto: '126', numeroRemolque: '838656' },
  { operador: 'RUMUALDO BAUTISTA GOMEZ', numeroTracto: '809', numeroRemolque: '28654' },
  { operador: 'HECTOR ADRIAN LOPEZ MEDINA', numeroTracto: '859', numeroRemolque: '1414' },
  { operador: 'CRISTIAN CORTEZ PORTILLO', numeroTracto: '178', numeroRemolque: '1376' },
  { operador: 'MARIO LARA TIBURCIO', numeroTracto: '731', numeroRemolque: '1398' },
  { operador: 'VICTOR FRANCO MONTAÑO', numeroTracto: '847', numeroRemolque: '1396' }
];

export const DedicadosModuleWideTech = ({ onBack }: DedicadosModuleProps) => {
  const [ubicaciones, setUbicaciones] = useState<UbicacionTracking[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [horaActual, setHoraActual] = useState(new Date());
  const [mostrarMapa, setMostrarMapa] = useState(false);
  const [unidadSeleccionada, setUnidadSeleccionada] = useState<string | null>(null);
  const [mostrarAdministracion, setMostrarAdministracion] = useState(false);
  const [tabActivo, setTabActivo] = useState('entregas');

  // Reloj
  useEffect(() => {
    const timer = setInterval(() => setHoraActual(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Cargar GPS desde gps_tracking
  const obtenerUbicaciones = async () => {
    try {
      console.log('🚀 [Carroll] Consultando gps_tracking...');
      
      const { data, error: dbError } = await supabase
        .from('gps_tracking')
        .select('*')
        .in('segmento', ['CARROL', 'CARROLL']);

      if (dbError) {
        console.error('❌ DB Error:', dbError);
        setError(dbError.message);
        return;
      }

      console.log('📥 [Carroll] Registros:', data?.length || 0);

      if (data && data.length > 0) {
        const ubicacionesMapeadas: UbicacionTracking[] = data.map((r: any) => {
          const tracto = FLOTA_CARROLL.find(t => t.numeroTracto === r.economico);
          return {
            placa: r.economico || '',
            latitude: r.latitude || 0,
            longitude: r.longitude || 0,
            speed: r.speed || 0,
            timestamp: r.timestamp_gps || '',
            odometer: 0,
            address: r.address || 'Sin dirección',
            operador: tracto?.operador || 'OPERADOR CARROLL',
            numeroRemolque: tracto?.numeroRemolque || 'N/A',
          };
        });
        setUbicaciones(ubicacionesMapeadas);
        setError(null);
      }
    } catch (err) {
      console.error('❌ Error:', err);
      setError(String(err));
    } finally {
      setCargando(false);
    }
  };

  // Cargar al inicio y cada 5 min
  useEffect(() => {
    obtenerUbicaciones();
    const interval = setInterval(obtenerUbicaciones, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Combinar flota con ubicaciones
  const unidadesCombinadas = FLOTA_CARROLL.map(tracto => {
    const ubicacion = ubicaciones.find(u => u.placa === tracto.numeroTracto);
    return { ...tracto, ubicacion };
  });

  const entregas = unidadesCombinadas.filter(u => u.ubicacion);

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B1220' }}>
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
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
              <span style={{ color: '#10B981', fontSize: '11px', fontWeight: 700 }}>{ubicaciones.length}/{FLOTA_CARROLL.length}</span>
            </div>
            <button onClick={() => setMostrarAdministracion(true)} className="p-2 rounded-lg" style={{ background: 'rgba(30, 102, 245, 0.15)', border: '1px solid rgba(30, 102, 245, 0.3)', color: 'white' }}>
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {mostrarAdministracion ? (
        <AdministracionCarroll onBack={() => setMostrarAdministracion(false)} />
      ) : (
        <>
          {/* TOOLBAR */}
          <div style={{ background: '#F3F5F8', borderBottom: '1px solid #E2E6EE', padding: '12px 24px' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex gap-1 bg-white p-1 rounded-lg border border-slate-200">
                  {['Entregas', 'Regresos', 'Puntual', 'Retraso', 'Adelanto', 'Asignación'].map(tab => (
                    <button key={tab} onClick={() => setTabActivo(tab.toLowerCase())} className="px-3 py-1.5 rounded text-xs font-semibold" style={{ color: tabActivo === tab.toLowerCase() ? '#1E66F5' : '#64748B', background: tabActivo === tab.toLowerCase() ? 'rgba(30, 102, 245, 0.1)' : 'transparent' }}>
                      {tab}
                    </button>
                  ))}
                </div>
                <button onClick={() => setMostrarMapa(true)} className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-white border border-blue-500 text-blue-500 text-xs font-semibold">
                  <MapIcon className="w-4 h-4" /> Mapa
                </button>
              </div>
              <div className="flex gap-2">
                {[{ l: 'ENTREGAS', v: entregas.length, c: '#059669' }, { l: 'TOTAL', v: FLOTA_CARROLL.length, c: '#1E66F5' }].map(k => (
                  <div key={k.l} className="px-3 py-2 bg-white rounded-lg border border-slate-200 relative overflow-hidden">
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: k.c }} />
                    <div className="text-xl font-bold text-slate-800">{k.v}</div>
                    <div className="text-xs text-slate-500">{k.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* TABLA */}
          <div className="p-6">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
              <div className="grid grid-cols-[50px_100px_1.5fr_2fr_1fr_1fr_1fr_120px] gap-3 px-4 py-3 bg-gradient-to-r from-slate-700 to-slate-800 text-white text-xs font-bold">
                <div className="text-center">#</div>
                <div>UNIDAD</div>
                <div>OPERADOR</div>
                <div>UBICACIÓN GPS</div>
                <div>ESTADO</div>
                <div>CITA</div>
                <div>STATUS</div>
                <div className="text-center">MTTO</div>
              </div>
              <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
                {unidadesCombinadas.map((unidad, index) => {
                  const tieneGPS = !!unidad.ubicacion;
                  const porcentaje = tieneGPS ? [38, 60, 100, 45, 80, 25, 90, 55, 70, 85, 100, 30, 65, 50, 75, 95, 40, 20, 88, 72, 58, 33, 97, 42, 68, 53, 82, 47][index % 28] : 0;
                  
                  return (
                    <div key={unidad.numeroTracto} className="grid grid-cols-[50px_100px_1.5fr_2fr_1fr_1fr_1fr_120px] gap-3 px-4 py-2 border-b border-slate-100 hover:bg-blue-50" style={{ background: index % 2 === 0 ? '#fff' : '#F8F9FB' }}>
                      <div className="flex items-center justify-center text-slate-500 font-bold">{index + 1}</div>
                      <div className="flex items-center">
                        <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-blue-50 border border-blue-200">
                          <Truck className="w-4 h-4 text-blue-500" />
                          <div>
                            <div className="font-bold text-blue-600 text-lg">{unidad.numeroTracto}</div>
                            <div className="text-xs text-slate-400">R-{unidad.numeroRemolque}</div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center text-sm font-semibold text-slate-700">{unidad.operador}</div>
                      <div className="flex items-center">
                        {tieneGPS ? (
                          <UbicacionGPS
                            latitude={unidad.ubicacion!.latitude}
                            longitude={unidad.ubicacion!.longitude}
                            address={unidad.ubicacion!.address}
                            onVerMapa={() => { setUnidadSeleccionada(unidad.numeroTracto); setMostrarMapa(true); }}
                            isCache={false}
                            cacheAge={0}
                          />
                        ) : (
                          <span className="text-slate-400 text-sm italic">Sin señal GPS</span>
                        )}
                      </div>
                      <div className="flex items-center">
                        {tieneGPS ? (
                          <div className="px-3 py-1 rounded-lg bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold">Transito</div>
                        ) : <span className="text-slate-300">—</span>}
                      </div>
                      <div className="flex items-center text-sm text-slate-600">
                        {tieneGPS ? `${10 + (index % 12)}:00` : '—'}
                      </div>
                      <div className="flex items-center">
                        {tieneGPS ? (
                          <div className="px-3 py-1 rounded-full text-white text-xs font-bold" style={{ background: porcentaje === 100 ? '#10B981' : porcentaje > 50 ? '#1E66F5' : '#F59E0B' }}>
                            {porcentaje === 100 ? 'ENTREGADO' : porcentaje > 50 ? 'PUNTUAL' : 'EN RUTA'}
                          </div>
                        ) : <span className="text-slate-300">—</span>}
                      </div>
                      <div className="flex items-center justify-center">
                        <svg width="50" height="28" viewBox="0 0 50 28">
                          <path d="M 5 24 A 18 18 0 0 1 45 24" fill="none" stroke="#E2E8F0" strokeWidth="5" strokeLinecap="round" />
                          <path d="M 5 24 A 18 18 0 0 1 45 24" fill="none" stroke={porcentaje <= 60 ? '#10B981' : porcentaje <= 89 ? '#F59E0B' : '#EF4444'} strokeWidth="5" strokeLinecap="round" strokeDasharray={`${(porcentaje / 100) * 56} 56`} />
                          <text x="25" y="22" textAnchor="middle" style={{ fontSize: '10px', fontWeight: 700, fill: '#0F172A' }}>{porcentaje}%</text>
                        </svg>
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
          </div>

          {mostrarMapa && (
            <MapaFlota
              ubicaciones={ubicaciones}
              unidadSeleccionada={unidadSeleccionada}
              onClose={() => { setMostrarMapa(false); setUnidadSeleccionada(null); }}
              onSeleccionarUnidad={setUnidadSeleccionada}
            />
          )}
        </>
      )}
    </div>
  );
};
