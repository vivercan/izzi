import { useState, useEffect, useRef } from 'react';
import { Cloud, CloudRain, CloudSnow, CloudDrizzle, Wind, Thermometer, CloudLightning, CloudFog, Sun, X } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface MapaClimaticoCarrollProps {
  onClose?: () => void;
  unidades?: Array<{
    tracto: string;
    lat: number;
    lng: number;
    operador: string;
  }>;
}

// Tipos de capas meteorológicas disponibles
type CapaClimatica = 
  | 'temperatura'
  | 'precipitacion'
  | 'nubes'
  | 'viento'
  | 'presion'
  | 'ninguna';

interface InfoCapa {
  id: CapaClimatica;
  nombre: string;
  icono: React.ReactNode;
  descripcion: string;
  color: string;
}

export const MapaClimaticoCarroll = ({ onClose, unidades = [] }: MapaClimaticoCarrollProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [capaActiva, setCapaActiva] = useState<CapaClimatica>('ninguna');
  const [capaWeather, setCapaWeather] = useState<google.maps.ImageMapType | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>('');

  // Definición de capas disponibles
  const CAPAS: InfoCapa[] = [
    {
      id: 'temperatura',
      nombre: 'Temperatura',
      icono: <Thermometer className="w-4 h-4" />,
      descripcion: 'Temperatura actual en °C',
      color: '#EF4444'
    },
    {
      id: 'precipitacion',
      nombre: 'Precipitación',
      icono: <CloudRain className="w-4 h-4" />,
      descripcion: 'Lluvia, granizo, nieve',
      color: '#3B82F6'
    },
    {
      id: 'nubes',
      nombre: 'Nubosidad',
      icono: <Cloud className="w-4 h-4" />,
      descripcion: 'Cobertura de nubes',
      color: '#94A3B8'
    },
    {
      id: 'viento',
      nombre: 'Viento',
      icono: <Wind className="w-4 h-4" />,
      descripcion: 'Velocidad y dirección',
      color: '#06B6D4'
    },
    {
      id: 'presion',
      nombre: 'Presión',
      icono: <CloudFog className="w-4 h-4" />,
      descripcion: 'Presión atmosférica',
      color: '#8B5CF6'
    }
  ];

  // Obtener API Key
  useEffect(() => {
    obtenerAPIKey();
  }, []);

  const obtenerAPIKey = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/api-keys/google-maps`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Error obteniendo API Key');
      }

      const data = await response.json();
      setApiKey(data.apiKey);
    } catch (err) {
      console.error('Error obteniendo API Key:', err);
      setError('No se pudo obtener la API Key de Google Maps');
    }
  };

  // Inicializar mapa cuando tenemos API Key
  useEffect(() => {
    if (!apiKey || !mapRef.current) return;

    cargarGoogleMaps();
  }, [apiKey]);

  const cargarGoogleMaps = async () => {
    try {
      // Cargar Google Maps API
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        inicializarMapa();
      };

      script.onerror = () => {
        setError('Error cargando Google Maps API');
        setCargando(false);
      };

      document.head.appendChild(script);
    } catch (err) {
      console.error('Error cargando Google Maps:', err);
      setError('Error al cargar el mapa');
      setCargando(false);
    }
  };

  const inicializarMapa = () => {
    if (!mapRef.current) return;

    try {
      // Centro del mapa: Granjas Carroll
      const centro = { lat: 19.3419, lng: -97.6664 };

      const mapaGoogle = new google.maps.Map(mapRef.current, {
        center: centro,
        zoom: 6,
        mapTypeId: 'roadmap',
        styles: [
          {
            featureType: 'all',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#334155' }]
          },
          {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#bfdbfe' }]
          }
        ]
      });

      // Agregar marcadores de unidades
      if (unidades.length > 0) {
        unidades.forEach((unidad) => {
          new google.maps.Marker({
            position: { lat: unidad.lat, lng: unidad.lng },
            map: mapaGoogle,
            title: `Tracto ${unidad.tracto} - ${unidad.operador}`,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#1E66F5',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2
            }
          });
        });
      }

      setMap(mapaGoogle);
      setCargando(false);
    } catch (err) {
      console.error('Error inicializando mapa:', err);
      setError('Error al inicializar el mapa');
      setCargando(false);
    }
  };

  // Cambiar capa meteorológica
  const cambiarCapa = (nuevaCapa: CapaClimatica) => {
    if (!map) return;

    // Remover capa anterior
    if (capaWeather) {
      map.overlayMapTypes.clear();
      setCapaWeather(null);
    }

    if (nuevaCapa === 'ninguna') {
      setCapaActiva('ninguna');
      return;
    }

    // Mapeo de capas a tipos de OpenWeatherMap
    const tiposOpenWeather: Record<CapaClimatica, string> = {
      'temperatura': 'temp_new',
      'precipitacion': 'precipitation_new',
      'nubes': 'clouds_new',
      'viento': 'wind_new',
      'presion': 'pressure_new',
      'ninguna': ''
    };

    const tipoOWM = tiposOpenWeather[nuevaCapa];
    if (!tipoOWM) return;

    // Crear nueva capa
    const nuevaCapaWeather = new google.maps.ImageMapType({
      getTileUrl: (coord, zoom) => {
        return `https://tile.openweathermap.org/map/${tipoOWM}/${zoom}/${coord.x}/${coord.y}.png?appid=${apiKey}`;
      },
      tileSize: new google.maps.Size(256, 256),
      opacity: 0.6,
      name: nuevaCapa
    });

    map.overlayMapTypes.push(nuevaCapaWeather);
    setCapaWeather(nuevaCapaWeather);
    setCapaActiva(nuevaCapa);
  };

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-md">
          <h2 className="text-red-600 mb-4" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '18px', fontWeight: 700 }}>
            ⚠️ Error
          </h2>
          <p className="text-slate-700 mb-6" style={{ fontSize: '14px' }}>
            {error}
          </p>
          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/95 z-50 flex flex-col">
      {/* HEADER */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Cloud className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '20px', fontWeight: 900, color: '#FFFFFF' }}>
              MAPA CLIMÁTICO - CARROLL
            </h1>
            <p style={{ fontSize: '12px', color: '#94A3B8' }}>
              Monitoreo meteorológico en tiempo real
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        )}
      </div>

      {/* CONTENEDOR PRINCIPAL */}
      <div className="flex-1 flex">
        {/* PANEL DE CAPAS (IZQUIERDA) */}
        <div className="w-64 bg-slate-800 border-r border-slate-700 p-4 overflow-y-auto">
          <h3 style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', fontWeight: 700, color: '#FFFFFF', marginBottom: '12px' }}>
            🌦️ CAPAS METEOROLÓGICAS
          </h3>

          <div className="space-y-2">
            {/* Opción: Sin capa */}
            <button
              onClick={() => cambiarCapa('ninguna')}
              className={`w-full text-left px-3 py-2.5 rounded-lg transition-all ${
                capaActiva === 'ninguna'
                  ? 'bg-slate-600 border-2 border-blue-500'
                  : 'bg-slate-700 border-2 border-transparent hover:bg-slate-600'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Sun className="w-4 h-4" style={{ color: '#FCD34D' }} />
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF' }}>
                  Sin capa
                </span>
              </div>
              <p style={{ fontSize: '10px', color: '#94A3B8', marginLeft: '24px' }}>
                Vista estándar del mapa
              </p>
            </button>

            {/* Capas dinámicas */}
            {CAPAS.map((capa) => (
              <button
                key={capa.id}
                onClick={() => cambiarCapa(capa.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-all ${
                  capaActiva === capa.id
                    ? 'bg-slate-600 border-2 border-blue-500'
                    : 'bg-slate-700 border-2 border-transparent hover:bg-slate-600'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div style={{ color: capa.color }}>{capa.icono}</div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF' }}>
                    {capa.nombre}
                  </span>
                </div>
                <p style={{ fontSize: '10px', color: '#94A3B8', marginLeft: '24px' }}>
                  {capa.descripcion}
                </p>
              </button>
            ))}
          </div>

          {/* INFORMACIÓN ADICIONAL */}
          <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
            <h4 style={{ fontSize: '11px', fontWeight: 700, color: '#FFFFFF', marginBottom: '8px' }}>
              📊 INFORMACIÓN
            </h4>
            <p style={{ fontSize: '10px', color: '#94A3B8', lineHeight: '1.5' }}>
              <strong className="text-white">Datos en tiempo real:</strong> Temperatura, precipitación, nubosidad, viento y presión atmosférica.
            </p>
            <p style={{ fontSize: '10px', color: '#94A3B8', lineHeight: '1.5', marginTop: '8px' }}>
              <strong className="text-white">Actualización:</strong> Cada 10 minutos desde estaciones meteorológicas globales.
            </p>
          </div>
        </div>

        {/* MAPA (DERECHA) */}
        <div className="flex-1 relative">
          {cargando && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 z-10">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p style={{ color: '#FFFFFF', fontSize: '14px' }}>Cargando mapa...</p>
              </div>
            </div>
          )}
          <div ref={mapRef} className="w-full h-full" />
        </div>
      </div>

      {/* LEYENDA (BOTTOM) */}
      {capaActiva !== 'ninguna' && (
        <div className="bg-slate-800 border-t border-slate-700 px-6 py-3">
          <div className="flex items-center gap-6">
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#FFFFFF' }}>
              LEYENDA:
            </span>
            <div className="flex items-center gap-4">
              {capaActiva === 'temperatura' && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-600 rounded"></div>
                    <span style={{ fontSize: '10px', color: '#CBD5E1' }}>Frío (-10°C a 10°C)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span style={{ fontSize: '10px', color: '#CBD5E1' }}>Templado (10°C a 25°C)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-600 rounded"></div>
                    <span style={{ fontSize: '10px', color: '#CBD5E1' }}>Calor (25°C+)</span>
                  </div>
                </>
              )}
              {capaActiva === 'precipitacion' && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-400 rounded"></div>
                    <span style={{ fontSize: '10px', color: '#CBD5E1' }}>Lluvia ligera</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-600 rounded"></div>
                    <span style={{ fontSize: '10px', color: '#CBD5E1' }}>Lluvia moderada</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-900 rounded"></div>
                    <span style={{ fontSize: '10px', color: '#CBD5E1' }}>Tormenta intensa</span>
                  </div>
                </>
              )}
              {capaActiva === 'nubes' && (
                <span style={{ fontSize: '10px', color: '#CBD5E1' }}>
                  Más blanco = Mayor cobertura de nubes
                </span>
              )}
              {capaActiva === 'viento' && (
                <span style={{ fontSize: '10px', color: '#CBD5E1' }}>
                  Flechas indican dirección y velocidad del viento
                </span>
              )}
              {capaActiva === 'presion' && (
                <span style={{ fontSize: '10px', color: '#CBD5E1' }}>
                  Colores indican zonas de alta/baja presión
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
