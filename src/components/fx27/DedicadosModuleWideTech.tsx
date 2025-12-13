import { useState, useEffect } from 'react';
import { Truck, ArrowLeft, MapPin, Clock, AlertTriangle, FileText, Activity, Map as MapIcon, TrendingUp, Package, CheckCircle2, AlertCircle, Settings } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { MapaFlota } from './MapaFlotaGoogleMaps';
import { getGoogleMapsApiKey } from '../../utils/supabase/getGoogleMapsKey';
import { UbicacionGPS } from './UbicacionGPS';
import { AdministracionCarroll } from './AdministracionCarroll';

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
  heading?: string;
  ignition?: string;
  temperatura1?: number | null;
  temperatura2?: number | null;
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
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date | null>(null);
  const [tabActivo, setTabActivo] = useState('entregas');
  const [datosCache, setDatosCache] = useState({ fromCache: 0, fromAPI: 0 });
  const [mostrarMapa, setMostrarMapa] = useState(false);
  const [unidadSeleccionada, setUnidadSeleccionada] = useState<string | null>(null);
  const [horaActual, setHoraActual] = useState(new Date());
  const [modalAsignacionAbierto, setModalAsignacionAbierto] = useState(false);
  const [convenioVenta, setConvenioVenta] = useState('');
  const [unidadAsignacion, setUnidadAsignacion] = useState('');
  const [numeroRemolqueAsignacion, setNumeroRemolqueAsignacion] = useState('');
  const [mostrarAdministracion, setMostrarAdministracion] = useState(false);
  const [flotaCarroll, setFlotaCarroll] = useState<Tractocamion[]>(FLOTA_CARROLL);

  // Actualizar reloj cada segundo
  useEffect(() => {
    const timer = setInterval(() => setHoraActual(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Cargar flota Carroll desde backend
  useEffect(() => {
    cargarFlotaCarroll();
  }, []);

  const cargarFlotaCarroll = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/carroll/unidades`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }
      );
      const data = await response.json();
      if (data.success && data.unidades.length > 0) {
        setFlotaCarroll(data.unidades);
        console.log(`✅ Flota Carroll cargada: ${data.unidades.length} unidades`);
      } else {
        // Si no hay unidades en backend, inicializar con las 28 default
        console.log('⚠️ No hay unidades en backend, inicializando...');
        await inicializarFlotaDefault();
      }
    } catch (error) {
      console.error('Error cargando flota Carroll:', error);
    }
  };

  const inicializarFlotaDefault = async () => {
    for (const unidad of FLOTA_CARROLL) {
      try {
        await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/carroll/unidades`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${publicAnonKey}`
            },
            body: JSON.stringify(unidad)
          }
        );
      } catch (error) {
        console.error(`Error guardando unidad ${unidad.numeroTracto}:`, error);
      }
    }
    console.log('✅ Flota Carroll inicializada con 28 unidades');
  };

  const obtenerUbicaciones = async () => {
    setCargando(true);
    setError(null);

    try {
      const placas = flotaCarroll.map(t => t.numeroTracto);
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/widetech/locations/batch`;

      console.log('🚀 Consultando GPS para', placas.length, 'unidades...');
      console.log('📋 Placas:', placas);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ placas })
      });

      const data = await response.json();
      console.log('📥 Respuesta completa del servidor:', JSON.stringify(data, null, 2));
      console.log('📊 Total results:', data.results?.length);
      console.log('✅ Successful:', data.successful);
      console.log('❌ Failed:', data.failed);

      if (!data.success) {
        throw new Error(data.error || 'Error al obtener ubicaciones');
      }

      const ubicacionesConInfo = data.results
        .filter((r: any) => r.success)
        .map((r: any) => {
          const tracto = flotaCarroll.find(t => t.numeroTracto === r.placa);
          return {
            ...r.location,
            placa: r.placa,
            operador: tracto?.operador || 'Desconocido',
            numeroRemolque: tracto?.numeroRemolque || 'N/A',
            fromCache: r.fromCache || false,
            cacheAge: r.cacheAge || 0
          };
        });

      console.log(`✅ ${ubicacionesConInfo.length} unidades con GPS activo`);
      
      const exitosos = data.results.filter((r: any) => r.success);
      const fallidos = data.results.filter((r: any) => !r.success);
      console.log('🟢 Primeros 3 exitosos:', exitosos.slice(0, 3));
      console.log('🔴 Primeros 3 fallidos:', fallidos.slice(0, 3));

      setUbicaciones(ubicacionesConInfo);
      setUltimaActualizacion(new Date());
      setDatosCache({
        fromCache: data.fromCache || 0,
        fromAPI: (data.successful || 0) - (data.fromCache || 0)
      });
    } catch (err) {
      setError(String(err));
      console.error('❌ Error completo:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    obtenerUbicaciones();
    const interval = setInterval(obtenerUbicaciones, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const unidadesCombinadas = FLOTA_CARROLL.map(tracto => {
    const ubicacion = ubicaciones.find(u => u.placa === tracto.numeroTracto);
    return {
      ...tracto,
      ubicacion
    };
  });

  const entregas = unidadesCombinadas.filter(u => u.ubicacion);
  const registros = entregas.length;
  const alertas = 4;
  const evidencias = 6;

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
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(30, 102, 245, 0.3)';
                e.currentTarget.style.borderColor = '#1E66F5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(30, 102, 245, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(30, 102, 245, 0.3)';
              }}
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
            </button>

            <h1
              style={{
                fontFamily: "'Exo 2', sans-serif",
                fontSize: '22px',
                fontWeight: 700,
                color: 'white',
                letterSpacing: '0.5px',
              }}
            >
              OPERATIONS HUB · GRANJAS CARROLL
            </h1>
          </div>

          {/* RIGHT: CLOCK + GPS STATUS */}
          <div className="flex items-center gap-4">
            {/* RELOJ CON DÍA COMPLETO */}
            <div 
              className="flex items-center gap-3 px-4 rounded-lg" 
              style={{ 
                minWidth: '500px',
                paddingTop: '16px',
                paddingBottom: '12px',
                background: 'transparent',
                border: '1px solid rgba(30, 102, 245, 0.25)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <Clock className="w-5 h-5" style={{ color: '#60A5FA' }} />
              <div className="flex-1 text-center">
                <div style={{ 
                  fontFamily: "'Exo 2', sans-serif", 
                  fontSize: '14px', 
                  fontWeight: 600, 
                  color: 'rgba(255, 255, 255, 0.95)',
                  letterSpacing: '0.3px'
                }}>
                  {horaActual.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                    .split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')}
                  <span style={{ 
                    margin: '0 8px',
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontWeight: 400
                  }}>·</span>
                  <span style={{ 
                    fontFamily: "'Orbitron', monospace",
                    fontSize: '15px',
                    fontWeight: 700,
                    color: '#60A5FA',
                    letterSpacing: '1px'
                  }}>
                    {horaActual.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })}
                  </span>
                </div>
              </div>
            </div>

            {/* GPS STATUS - 2 ESTADOS: CARGANDO / EN LÍNEA */}
            <div 
              className="flex items-center gap-2 px-2.5 rounded-lg transition-all" 
              style={{
                minWidth: '90px',
                paddingTop: '5px',
                paddingBottom: '5px',
                background: cargando 
                  ? 'transparent' 
                  : 'rgba(16, 185, 129, 0.15)',
                border: cargando 
                  ? 'none' 
                  : '1px solid rgba(16, 185, 129, 0.5)',
                backdropFilter: 'blur(10px)'
              }}
            >
              {cargando ? (
                <>
                  {/* ANILLO GIRANDO */}
                  <div className="animate-spin">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                      <circle 
                        cx="10" 
                        cy="10" 
                        r="8" 
                        stroke="#F59E0B" 
                        strokeWidth="3" 
                        strokeLinecap="round"
                        strokeDasharray="25 25"
                        opacity="0.8"
                      />
                    </svg>
                  </div>
                  <div>
                    <div style={{ 
                      fontFamily: "'Exo 2', sans-serif", 
                      fontSize: '10px', 
                      fontWeight: 700, 
                      color: 'rgba(255, 255, 255, 0.95)',
                      letterSpacing: '0.2px',
                      lineHeight: '1.2'
                    }}>
                      Sync…
                    </div>
                    <div style={{ 
                      fontFamily: "'Exo 2', sans-serif", 
                      fontSize: '8px', 
                      fontWeight: 600, 
                      color: 'rgba(255, 255, 255, 0.7)',
                      letterSpacing: '0.2px',
                      lineHeight: '1.2'
                    }}>
                      {ubicaciones.length}/26
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" style={{ color: '#10B981' }} />
                  <div>
                    <div style={{ 
                      fontFamily: "'Exo 2', sans-serif", 
                      fontSize: '10px', 
                      fontWeight: 700, 
                      color: '#10B981',
                      letterSpacing: '0.2px',
                      lineHeight: '1.2'
                    }}>
                      En línea
                    </div>
                    <div style={{ 
                      fontFamily: "'Exo 2', sans-serif", 
                      fontSize: '8px', 
                      fontWeight: 600, 
                      color: 'rgba(16, 185, 129, 0.8)',
                      letterSpacing: '0.2px',
                      lineHeight: '1.2'
                    }}>
                      {ubicaciones.length}/26
                    </div>
                  </div>
                </>
              )}
            </div>
            
            {/* BOTÓN ADMINISTRACIÓN */}
            <button
              onClick={() => setMostrarAdministracion(true)}
              className="p-2 rounded-lg transition-all ml-3"
              style={{
                background: 'rgba(30, 102, 245, 0.15)',
                border: '1px solid rgba(30, 102, 245, 0.3)',
                color: 'white'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(30, 102, 245, 0.3)';
                e.currentTarget.style.borderColor = '#1E66F5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(30, 102, 245, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(30, 102, 245, 0.3)';
              }}
              title="Administración Carroll"
            >
              <Settings className="w-5 h-5" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      {/* MOSTRAR ADMINISTRACIÓN O MONITOR */}
      {mostrarAdministracion ? (
        <AdministracionCarroll onBack={() => {
          setMostrarAdministracion(false);
          cargarFlotaCarroll();
        }} />
      ) : (
      <>
      {/* ========== BANDA COMPACTA HUD: TABS + KPIs + MAPA ========== */}
      <div style={{ background: '#F3F5F8', borderBottom: '1px solid #E2E6EE', padding: '12px 24px' }}>
        <div className="flex items-center justify-between gap-6">
          
          {/* LEFT: TABS + BOTÓN MAPA */}
          <div className="flex items-center gap-4">
            {/* TABS PREMIUM */}
            <div className="flex items-center gap-1" style={{ 
              background: 'white', 
              padding: '4px', 
              borderRadius: '10px', 
              border: '1px solid #E2E6EE',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)'
            }}>
              <button
                onClick={() => setTabActivo('entregas')}
                className="px-3 py-1.5 transition-all rounded-lg"
                style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: '11px',
                  fontWeight: 600,
                  color: tabActivo === 'entregas' ? '#1E66F5' : '#64748B',
                  background: tabActivo === 'entregas' ? 'rgba(30, 102, 245, 0.1)' : 'transparent',
                  borderBottom: tabActivo === 'entregas' ? '2px solid #1E66F5' : '2px solid transparent'
                }}
              >
                Entregas
              </button>
              <button
                onClick={() => setTabActivo('regresos')}
                className="px-3 py-1.5 transition-all rounded-lg"
                style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: '11px',
                  fontWeight: 600,
                  color: tabActivo === 'regresos' ? '#1E66F5' : '#64748B',
                  background: tabActivo === 'regresos' ? 'rgba(30, 102, 245, 0.1)' : 'transparent',
                  borderBottom: tabActivo === 'regresos' ? '2px solid #1E66F5' : '2px solid transparent'
                }}
              >
                Regresos
              </button>
              <button
                onClick={() => setTabActivo('puntual')}
                className="px-3 py-1.5 transition-all rounded-lg"
                style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: '11px',
                  fontWeight: 600,
                  color: tabActivo === 'puntual' ? '#1E66F5' : '#64748B',
                  background: tabActivo === 'puntual' ? 'rgba(30, 102, 245, 0.1)' : 'transparent',
                  borderBottom: tabActivo === 'puntual' ? '2px solid #1E66F5' : '2px solid transparent'
                }}
              >
                Puntual
              </button>
              <button
                onClick={() => setTabActivo('retraso')}
                className="px-3 py-1.5 transition-all rounded-lg"
                style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: '11px',
                  fontWeight: 600,
                  color: tabActivo === 'retraso' ? '#DC2626' : '#64748B',
                  background: tabActivo === 'retraso' ? 'rgba(220, 38, 38, 0.1)' : 'transparent',
                  borderBottom: tabActivo === 'retraso' ? '2px solid #DC2626' : '2px solid transparent'
                }}
              >
                Retraso
              </button>
              <button
                onClick={() => setTabActivo('adelanto')}
                className="px-3 py-1.5 transition-all rounded-lg"
                style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: '11px',
                  fontWeight: 600,
                  color: tabActivo === 'adelanto' ? '#F59E0B' : '#64748B',
                  background: tabActivo === 'adelanto' ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                  borderBottom: tabActivo === 'adelanto' ? '2px solid #F59E0B' : '2px solid transparent'
                }}
              >
                Adelanto
              </button>
              <button
                onClick={() => setTabActivo('asignacion')}
                className="px-3 py-1.5 transition-all rounded-lg"
                style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: '11px',
                  fontWeight: 600,
                  color: tabActivo === 'asignacion' ? '#1E66F5' : '#64748B',
                  background: tabActivo === 'asignacion' ? 'rgba(30, 102, 245, 0.1)' : 'transparent',
                  borderBottom: tabActivo === 'asignacion' ? '2px solid #1E66F5' : '2px solid transparent'
                }}
              >
                Asignación
              </button>
            </div>

            {/* BOTÓN MAPA - MISMO ESTILO QUE TABS */}
            <button
              onClick={() => setMostrarMapa(true)}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg transition-all"
              style={{
                fontFamily: "'Exo 2', sans-serif",
                fontSize: '11px',
                fontWeight: 600,
                background: 'white',
                border: '1.5px solid #1E66F5',
                color: '#1E66F5',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(30, 102, 245, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
              }}
            >
              <MapIcon className="w-4 h-4" />
              Mapa
            </button>

            {/* BOTÓN CAPTURAR VIAJE */}
            <button
              onClick={() => setModalAsignacionAbierto(true)}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg transition-all"
              style={{
                fontFamily: "'Exo 2', sans-serif",
                fontSize: '11px',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                border: '1.5px solid #10B981',
                color: 'white',
                boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 3px 10px rgba(16, 185, 129, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 6px rgba(16, 185, 129, 0.3)';
              }}
            >
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M10 4 L10 16 M4 10 L16 10" />
              </svg>
              Capturar Viaje
            </button>
          </div>

          {/* RIGHT: MINI KPIs COMPACTOS (40% MENOS ALTURA) */}
          <div className="flex items-center gap-2.5">
            {/* ENTREGAS - Mini panel */}
            <div 
              className="rounded-lg transition-all relative overflow-hidden"
              style={{
                background: 'white',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
                border: '1px solid #E2E6EE',
                padding: '6px 10px',
                minWidth: '85px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 3px 8px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.06)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                right: 0, 
                height: '3px', 
                background: 'linear-gradient(90deg, #059669 0%, #10B981 100%)' 
              }} />
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <TrendingUp className="w-3.5 h-3.5" style={{ color: '#64748B', opacity: 0.5 }} />
                <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '22px', fontWeight: 700, color: '#111827', lineHeight: '1' }}>
                  {entregas.length}
                </div>
              </div>
              <div style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '8.5px', fontWeight: 600, color: '#64748B', letterSpacing: '0.5px' }}>
                ENTREGAS
              </div>
            </div>

            {/* REGISTROS - Mini panel */}
            <div 
              className="rounded-lg transition-all relative overflow-hidden"
              style={{
                background: 'white',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
                border: '1px solid #E2E6EE',
                padding: '6px 10px',
                minWidth: '85px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 3px 8px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.06)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                right: 0, 
                height: '3px', 
                background: 'linear-gradient(90deg, #64748B 0%, #94A3B8 100%)' 
              }} />
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <FileText className="w-3.5 h-3.5" style={{ color: '#64748B', opacity: 0.5 }} />
                <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '22px', fontWeight: 700, color: '#111827', lineHeight: '1' }}>
                  {entregas.length}
                </div>
              </div>
              <div style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '8.5px', fontWeight: 600, color: '#64748B', letterSpacing: '0.5px' }}>
                REGISTROS
              </div>
            </div>

            {/* ALERTAS - Mini panel */}
            <div 
              className="rounded-lg transition-all relative overflow-hidden"
              style={{
                background: 'white',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
                border: '1px solid #E2E6EE',
                padding: '6px 10px',
                minWidth: '85px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 3px 8px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.06)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                right: 0, 
                height: '3px', 
                background: 'linear-gradient(90deg, #DC2626 0%, #EF4444 100%)' 
              }} />
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <AlertTriangle className="w-3.5 h-3.5" style={{ color: '#64748B', opacity: 0.5 }} />
                <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '22px', fontWeight: 700, color: '#111827', lineHeight: '1' }}>
                  {alertas}
                </div>
              </div>
              <div style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '8.5px', fontWeight: 600, color: '#64748B', letterSpacing: '0.5px' }}>
                ALERTAS
              </div>
            </div>

            {/* EVIDENCIAS - Mini panel */}
            <div 
              className="rounded-lg transition-all relative overflow-hidden"
              style={{
                background: 'white',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
                border: '1px solid #E2E6EE',
                padding: '6px 10px',
                minWidth: '85px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 3px 8px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.06)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                right: 0, 
                height: '3px', 
                background: 'linear-gradient(90deg, #F59E0B 0%, #FBBF24 100%)' 
              }} />
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <Package className="w-3.5 h-3.5" style={{ color: '#64748B', opacity: 0.5 }} />
                <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '22px', fontWeight: 700, color: '#111827', lineHeight: '1' }}>
                  {evidencias}
                </div>
              </div>
              <div style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '8.5px', fontWeight: 600, color: '#64748B', letterSpacing: '0.5px' }}>
                EVIDENCIAS
              </div>
            </div>

            {/* TOTAL - Mini panel */}
            <div 
              className="rounded-lg transition-all relative overflow-hidden"
              style={{
                background: 'white',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
                border: '1px solid #E2E6EE',
                padding: '6px 10px',
                minWidth: '85px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 3px 8px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.06)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                right: 0, 
                height: '3px', 
                background: 'linear-gradient(90deg, #1E66F5 0%, #3B82F6 100%)' 
              }} />
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <Truck className="w-3.5 h-3.5" style={{ color: '#64748B', opacity: 0.5 }} />
                <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '22px', fontWeight: 700, color: '#111827', lineHeight: '1' }}>
                  26
                </div>
              </div>
              <div style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '8.5px', fontWeight: 600, color: '#64748B', letterSpacing: '0.5px' }}>
                TOTAL
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========== TABLA PROTAGONISTA CON ZEBRA MARCADA ========== */}
      <div className="p-6">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden" style={{ border: '1px solid #E2E6EE' }}>
          {/* HEADER TABLA */}
          <div className="grid grid-cols-[50px_100px_1.5fr_2fr_1.5fr_1fr_1fr_1fr_1fr_1.2fr_120px] gap-3 px-4 py-3 bg-gradient-to-r from-slate-700 to-slate-800 text-white">
            <div style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textAlign: 'center' }}>#</div>
            <div style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px' }}>UNIDAD</div>
            <div style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px' }}>OPERADOR</div>
            <div style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px' }}>UBICACIÓN GPS</div>
            <div style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px' }}>DESTINO / CLIENTE</div>
            <div style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px' }}>ESTADO</div>
            <div style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px' }}>CITA</div>
            <div style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px' }}>ETA</div>
            <div style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px' }}>LLEGADA</div>
            <div style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px' }}>STATUS</div>
            <div style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textAlign: 'center' }}>MANTENIMIENTO</div>
          </div>

          {/* FILAS - 26 UNIDADES CON ZEBRA MARCADA */}
          <div className="max-h-[calc(100vh-220px)] overflow-y-auto">
            {unidadesCombinadas.map((unidad, index) => {
              const tieneGPS = !!unidad.ubicacion;
              const estados = ['Transito', 'Lavado', 'Destino', 'Origen'];
              const estadoRandom = estados[index % estados.length];
              const porcentaje = tieneGPS ? [38, 0, 100, 100, 4, 8, 100, 100, 60, 75, 90, 95, 100, 85, 70, 55, 40, 25, 10, 5, 100, 100, 80, 65, 50, 35][index] || 0 : 0;
              
              return (
                <div
                  key={unidad.numeroTracto}
                  className="grid grid-cols-[50px_100px_1.5fr_2fr_1.5fr_1fr_1fr_1fr_1fr_1.2fr_120px] gap-3 px-4 py-1 transition-all"
                  style={{
                    background: index % 2 === 0 ? '#FFFFFF' : '#F8F9FB',
                    borderBottom: '1px solid #E2E6EE'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#E6F0FF';
                    e.currentTarget.style.borderLeft = '2px solid #1E66F5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = index % 2 === 0 ? '#FFFFFF' : '#F8F9FB';
                    e.currentTarget.style.borderLeft = 'none';
                  }}
                >
                  {/* NÚMERO */}
                  <div className="flex items-center justify-center">
                    <div style={{ 
                      fontFamily: "'Orbitron', monospace", 
                      fontSize: '14px', 
                      fontWeight: 700, 
                      color: '#64748B',
                      letterSpacing: '0.5px'
                    }}>
                      {index + 1}
                    </div>
                  </div>

                  {/* UNIDAD */}
                  <div className="flex items-center gap-2">
                    <div 
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
                      style={{
                        background: 'linear-gradient(135deg, rgba(239, 246, 255, 0.8) 0%, rgba(219, 234, 254, 0.9) 100%)',
                        border: '1px solid rgba(30, 102, 245, 0.15)',
                        boxShadow: '0 1px 3px rgba(30, 102, 245, 0.08)',
                        minWidth: '85px'
                      }}
                    >
                      <Truck className="w-4 h-4" style={{ color: '#1E66F5', flexShrink: 0 }} />
                      <div>
                        <div style={{ 
                          fontFamily: "'Orbitron', monospace", 
                          fontSize: '19px', 
                          fontWeight: 700,
                          color: '#1E66F5',
                          lineHeight: '1.2',
                          letterSpacing: '0.5px'
                        }}>
                          {unidad.numeroTracto}
                        </div>
                        <div style={{ 
                          fontFamily: "'Exo 2', sans-serif", 
                          fontSize: '11px',
                          fontWeight: 400,
                          color: '#94A3B8',
                          lineHeight: '1.2',
                          letterSpacing: '0.3px'
                        }}>
                          R-{unidad.numeroRemolque}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* OPERADOR */}
                  <div className="flex items-center">
                    <div className="text-slate-700" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px', fontWeight: 600 }}>
                      {unidad.operador}
                    </div>
                  </div>

                  {/* UBICACIÓN GPS */}
                  <div className="flex items-center">
                    {tieneGPS ? (
                      <UbicacionGPS
                        latitude={unidad.ubicacion!.latitude}
                        longitude={unidad.ubicacion!.longitude}
                        address={unidad.ubicacion!.address}
                        onVerMapa={() => {
                          setUnidadSeleccionada(unidad.numeroTracto);
                          setMostrarMapa(true);
                        }}
                        isCache={(unidad.ubicacion as any).fromCache || false}
                        cacheAge={(unidad.ubicacion as any).cacheAge || 0}
                      />
                    ) : (
                      <div className="text-slate-400" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px', fontStyle: 'italic' }}>
                        Sin señal GPS
                      </div>
                    )}
                  </div>

                  {/* DESTINO / CLIENTE */}
                  <div className="flex items-center">
                    {tieneGPS ? (
                      <div>
                        <div className="text-slate-800" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px', fontWeight: 700 }}>
                          {unidad.ubicacion!.address.split(',').slice(-2).join(',').trim().substring(0, 20).toUpperCase()}
                        </div>
                        <div className="text-blue-600" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px' }}>
                          Cliente 0
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-300">—</div>
                    )}
                  </div>

                  {/* ESTADO */}
                  <div className="flex items-center">
                    {tieneGPS ? (
                      <div className="px-3 py-1.5 rounded-lg bg-emerald-100 border border-emerald-200">
                        <div className="text-emerald-700" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 700 }}>
                          {estadoRandom}
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-300">—</div>
                    )}
                  </div>

                  {/* CITA */}
                  <div className="flex items-center">
                    {tieneGPS ? (
                      <div>
                        <div className="text-slate-700" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 700 }}>
                          {`${10 + (index % 12)}:${(index % 6) * 10}`.padStart(5, '0')}
                        </div>
                        <div className="text-slate-500" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px' }}>
                          2025-06-{10 + (index % 15)}
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-300">—</div>
                    )}
                  </div>

                  {/* ETA */}
                  <div className="flex items-center">
                    {tieneGPS ? (
                      <div>
                        <div className="text-slate-700" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 700 }}>
                          {`${10 + (index % 12)}:${(index % 6) * 10}`.padStart(5, '0')}
                        </div>
                        <div className="text-slate-500" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px' }}>
                          2025-06-{10 + (index % 15)}
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-300">—</div>
                    )}
                  </div>

                  {/* LLEGADA */}
                  <div className="flex items-center">
                    {tieneGPS ? (
                      <div>
                        <div className={`${porcentaje === 100 ? 'text-emerald-600' : porcentaje > 50 ? 'text-yellow-600' : 'text-blue-600'}`} style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 700 }}>
                          {porcentaje === 100 ? 'Entregado' : porcentaje > 50 ? 'Entregado' : `${20 - (index % 15)}h ${(index % 6) * 10}m`}
                        </div>
                        <div className="text-slate-500" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '9px' }}>
                          {porcentaje === 100 ? 'Confirmado' : 'Confirmando'}
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-300">—</div>
                    )}
                  </div>

                  {/* STATUS - PILLS ANCHO FIJO */}
                  <div className="flex items-center justify-center">
                    {tieneGPS ? (
                      <div 
                        className="px-4 py-1.5 rounded-full flex items-center justify-center"
                        style={{
                          minWidth: '105px',
                          background: porcentaje === 100 
                            ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' 
                            : porcentaje > 50 
                            ? 'linear-gradient(135deg, #1E66F5 0%, #1D4ED8 100%)' 
                            : porcentaje > 10
                            ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
                            : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12)'
                        }}
                      >
                        <div style={{ 
                          fontFamily: "'Exo 2', sans-serif", 
                          fontSize: '11px', 
                          fontWeight: 700,
                          color: 'white',
                          textAlign: 'center',
                          letterSpacing: '0.3px'
                        }}>
                          {porcentaje === 100 ? 'ENTREGADO' : porcentaje > 50 ? 'PUNTUAL' : porcentaje > 10 ? 'ADELANTO' : 'RETRASO'}
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-300">—</div>
                    )}
                  </div>

                  {/* MANTENIMIENTO - MEDIA LUNA (HALF GAUGE) */}
                  <div className="flex items-center justify-center">
                    {tieneGPS ? (
                      <div className="flex flex-col items-center gap-0.5">
                        {/* SVG Half Gauge (Media Luna) */}
                        <svg width="50" height="32" viewBox="0 0 50 32">
                          {/* Arco de fondo (gris claro) */}
                          <path
                            d="M 5 27 A 20 20 0 0 1 45 27"
                            fill="none"
                            stroke="#E2E8F0"
                            strokeWidth="6"
                            strokeLinecap="round"
                          />
                          {/* Arco de progreso (color según porcentaje) */}
                          <path
                            d="M 5 27 A 20 20 0 0 1 45 27"
                            fill="none"
                            stroke={
                              porcentaje <= 60 
                                ? '#10B981' 
                                : porcentaje <= 89 
                                ? '#F59E0B' 
                                : '#EF4444'
                            }
                            strokeWidth="6"
                            strokeLinecap="round"
                            strokeDasharray={`${(porcentaje / 100) * 62.83} 62.83`}
                          />
                          {/* Texto porcentaje centrado */}
                          <text
                            x="25"
                            y="24"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            style={{
                              fontFamily: "Arial, sans-serif",
                              fontSize: '11px',
                              fontWeight: 700,
                              fill: '#0F172A'
                            }}
                          >
                            {porcentaje}%
                          </text>
                        </svg>
                        {/* Etiqueta de estado */}
                        <div style={{
                          fontFamily: "'Exo 2', sans-serif",
                          fontSize: '8px',
                          fontWeight: 600,
                          color: porcentaje <= 60 
                            ? '#10B981' 
                            : porcentaje <= 89 
                            ? '#F59E0B' 
                            : '#EF4444',
                          letterSpacing: '0.3px'
                        }}>
                          {porcentaje <= 60 ? 'OK' : porcentaje <= 89 ? 'Próximo' : 'Crítico'}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-0.5">
                        <svg width="50" height="32" viewBox="0 0 50 32">
                          <path
                            d="M 5 27 A 20 20 0 0 1 45 27"
                            fill="none"
                            stroke="#E2E8F0"
                            strokeWidth="6"
                            strokeLinecap="round"
                          />
                        </svg>
                        <div style={{
                          fontFamily: "'Exo 2', sans-serif",
                          fontSize: '8px',
                          fontWeight: 600,
                          color: '#CBD5E1'
                        }}>
                          N/A
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div className="text-red-700" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px', fontWeight: 700 }}>
                Error: {error}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MAPA */}
      {mostrarMapa && (
        <MapaFlota
          ubicaciones={ubicaciones}
          unidadSeleccionada={unidadSeleccionada}
          onClose={() => {
            setMostrarMapa(false);
            setUnidadSeleccionada(null);
          }}
          onSeleccionarUnidad={(placa) => setUnidadSeleccionada(placa)}
        />
      )}

      {/* MODAL DE ASIGNACIÓN DE VIAJE */}
      {modalAsignacionAbierto && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)'
          }}
          onClick={() => setModalAsignacionAbierto(false)}
        >
          <div 
            className="relative bg-white rounded-xl shadow-2xl"
            style={{
              width: '440px',
              border: '2px solid #1E66F5',
              animation: 'scaleIn 0.2s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER CON BOTÓN CERRAR */}
            <div 
              className="relative flex items-center justify-between px-6 py-4 rounded-t-xl"
              style={{
                background: 'linear-gradient(135deg, #1E66F5 0%, #1D4ED8 100%)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              <h2 
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'white',
                  letterSpacing: '0.5px'
                }}
              >
                CAPTURA DE VIAJE
              </h2>
              <button
                onClick={() => setModalAsignacionAbierto(false)}
                className="p-1.5 rounded-lg transition-all"
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                }}
              >
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 20 20" 
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <path d="M4 4 L16 16 M16 4 L4 16" />
                </svg>
              </button>
            </div>

            {/* FORMULARIO */}
            <div className="px-6 py-6">
              {/* CONVENIO DE VENTA */}
              <div className="mb-5">
                <label 
                  style={{
                    fontFamily: "'Exo 2', sans-serif",
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#0F172A',
                    display: 'block',
                    marginBottom: '8px',
                    letterSpacing: '0.3px'
                  }}
                >
                  CONVENIO DE VENTA
                </label>
                <input
                  type="text"
                  value={convenioVenta}
                  onChange={(e) => setConvenioVenta(e.target.value.toUpperCase())}
                  placeholder="Ingrese convenio de venta"
                  className="w-full px-4 py-3 rounded-lg transition-all"
                  style={{
                    fontFamily: "'Exo 2', sans-serif",
                    fontSize: '13px',
                    fontWeight: 600,
                    border: '2px solid #E2E8F0',
                    outline: 'none',
                    background: '#F8FAFC'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#1E66F5';
                    e.currentTarget.style.background = '#FFFFFF';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#E2E8F0';
                    e.currentTarget.style.background = '#F8FAFC';
                  }}
                />
              </div>

              {/* UNIDAD */}
              <div className="mb-5">
                <label 
                  style={{
                    fontFamily: "'Exo 2', sans-serif",
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#0F172A',
                    display: 'block',
                    marginBottom: '8px',
                    letterSpacing: '0.3px'
                  }}
                >
                  UNIDAD
                </label>
                <select
                  value={unidadAsignacion}
                  onChange={(e) => setUnidadAsignacion(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg transition-all"
                  style={{
                    fontFamily: "'Exo 2', sans-serif",
                    fontSize: '13px',
                    fontWeight: 600,
                    border: '2px solid #E2E8F0',
                    outline: 'none',
                    background: '#F8FAFC'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#1E66F5';
                    e.currentTarget.style.background = '#FFFFFF';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#E2E8F0';
                    e.currentTarget.style.background = '#F8FAFC';
                  }}
                >
                  <option value="">Seleccione una unidad</option>
                  {FLOTA_CARROLL.map((unidad) => (
                    <option key={unidad.numeroTracto} value={unidad.numeroTracto}>
                      {unidad.numeroTracto} - {unidad.operador}
                    </option>
                  ))}
                </select>
              </div>

              {/* NÚMERO DE REMOLQUE */}
              <div className="mb-6">
                <label 
                  style={{
                    fontFamily: "'Exo 2', sans-serif",
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#0F172A',
                    display: 'block',
                    marginBottom: '8px',
                    letterSpacing: '0.3px'
                  }}
                >
                  NÚMERO DE REMOLQUE
                </label>
                <input
                  type="text"
                  value={numeroRemolqueAsignacion}
                  onChange={(e) => setNumeroRemolqueAsignacion(e.target.value)}
                  placeholder="Ingrese número de remolque"
                  className="w-full px-4 py-3 rounded-lg transition-all"
                  style={{
                    fontFamily: "'Exo 2', sans-serif",
                    fontSize: '13px',
                    fontWeight: 600,
                    border: '2px solid #E2E8F0',
                    outline: 'none',
                    background: '#F8FAFC'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#1E66F5';
                    e.currentTarget.style.background = '#FFFFFF';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#E2E8F0';
                    e.currentTarget.style.background = '#F8FAFC';
                  }}
                />
              </div>

              {/* BOTÓN ACEPTAR */}
              <button
                onClick={() => {
                  // Aquí se procesaría la asignación
                  console.log('Asignación:', { convenioVenta, unidadAsignacion, numeroRemolqueAsignacion });
                  setModalAsignacionAbierto(false);
                  setConvenioVenta('');
                  setUnidadAsignacion('');
                  setNumeroRemolqueAsignacion('');
                }}
                className="w-full py-3.5 rounded-lg transition-all"
                style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: '14px',
                  fontWeight: 700,
                  color: 'white',
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  border: 'none',
                  letterSpacing: '0.5px',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                }}
              >
                ACEPTAR
              </button>
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
};