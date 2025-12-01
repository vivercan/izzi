import { useEffect, useState, useRef } from 'react';
import { X, MapPin, Truck, Navigation, Cloud, Thermometer, Droplets, Wind } from 'lucide-react';
import { GoogleMap, LoadScript, OverlayView, InfoWindow } from '@react-google-maps/api';
import { getGoogleMapsApiKey } from '../../utils/supabase/getGoogleMapsKey';

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
  tiempoEstacionado?: number; // en minutos - tiempo que lleva en la posición actual (radio 500m)
}

interface MapaFlotaProps {
  ubicaciones: UbicacionTracking[];
  unidadSeleccionada: string | null;
  onClose: () => void;
  onSeleccionarUnidad: (placa: string) => void;
}

const containerStyle = {
  width: '100%',
  height: '100%'
};

// Centro de México (aproximadamente)
const defaultCenter = {
  lat: 23.6345,
  lng: -102.5528
};

export const MapaFlota = ({ ubicaciones, unidadSeleccionada, onClose, onSeleccionarUnidad }: MapaFlotaProps) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [hoveredCluster, setHoveredCluster] = useState<{ unidades: UbicacionTracking[]; x: number; y: number } | null>(null);
  const [center, setCenter] = useState(defaultCenter);
  const [zoom, setZoom] = useState(5);
  const [apiKey, setApiKey] = useState<string>('');
  const [loadingKey, setLoadingKey] = useState(true);
  const mapRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const menuHoverRef = useRef<boolean>(false);
  
  // Estados para capas climáticas
  const [capaClimatica, setCapaClimatica] = useState<string | null>(null);
  const [weatherOverlay, setWeatherOverlay] = useState<google.maps.ImageMapType | null>(null);

  // Cargar la API key al montar el componente
  useEffect(() => {
    const fetchApiKey = async () => {
      const key = await getGoogleMapsApiKey();
      setApiKey(key);
      setLoadingKey(false);
    };
    fetchApiKey();
  }, []);

  // Determinar si una unidad está en entrega o regreso (lógica placeholder)
  const esEntrega = (index: number) => Math.random() > 0.5;

  // 26 colores únicos para cada tractocamión
  const coloresPorUnidad = [
    '#1E66F5', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
    '#14B8A6', '#F43F5E', '#22C55E', '#EAB308', '#A855F7',
    '#DB2777', '#0EA5E9', '#65A30D', '#DC2626', '#7C3AED',
    '#059669', '#D97706', '#4F46E5', '#0D9488', '#BE123C', '#16A34A'
  ];

  useEffect(() => {
    if (map && ubicaciones.length > 0 && typeof google !== 'undefined') {
      if (unidadSeleccionada) {
        // Zoom a unidad específica
        const ubicacion = ubicaciones.find(u => u.placa === unidadSeleccionada);
        if (ubicacion) {
          map.panTo({ lat: ubicacion.latitude, lng: ubicacion.longitude });
          map.setZoom(12);
          setSelectedMarker(unidadSeleccionada);
        }
      } else {
        // Mostrar todas las unidades
        const bounds = new google.maps.LatLngBounds();
        ubicaciones.forEach(u => {
          bounds.extend({ lat: u.latitude, lng: u.longitude });
        });
        map.fitBounds(bounds);
      }
    }
  }, [map, unidadSeleccionada, ubicaciones]);

  const handleVerTodas = () => {
    if (map && ubicaciones.length > 0 && typeof google !== 'undefined') {
      const bounds = new google.maps.LatLngBounds();
      ubicaciones.forEach(u => {
        bounds.extend({ lat: u.latitude, lng: u.longitude });
      });
      map.fitBounds(bounds);
      setSelectedMarker(null);
      onSeleccionarUnidad('');
    }
  };

  // Función para crear marcador personalizado: rectángulo gris con número blanco y sombra
  const getMarkerIcon = (placa: string, unidadesEnCluster: number = 1, isSelected: boolean = false) => {
    const mostrarIndicador = unidadesEnCluster > 1;
    const scale = isSelected ? 1.15 : 1;
    const width = 56 * scale;
    const height = (mostrarIndicador ? 42 : 28) * scale;
    
    const svgMarker = `
      <svg width="${width + 4}" height="${height + 4}" xmlns="http://www.w3.org/2000/svg">
        <!-- Sombra suave debajo del marcador -->
        <defs>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
            <feOffset dx="0" dy="2" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.3"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        <!-- Rectángulo principal con sombra y bordes redondeados -->
        <rect x="${2 * scale}" y="${2 * scale}" width="${52 * scale}" height="${24 * scale}" rx="${6 * scale}" ry="${6 * scale}" 
              fill="${isSelected ? '#1E66F5' : '#4B5563'}" 
              stroke="#FFFFFF" 
              stroke-width="${2.5 * scale}"
              filter="url(#shadow)"/>
        
        <!-- Texto blanco ultra bold -->
        <text x="${28 * scale}" y="${17 * scale}" 
              font-family="Arial, sans-serif" 
              font-size="${14 * scale}" 
              font-weight="bold" 
              fill="#FFFFFF" 
              text-anchor="middle" 
              dominant-baseline="middle">${placa}</text>
        
        ${mostrarIndicador ? `
        <!-- Indicador de múltiples unidades -->
        <rect x="${16 * scale}" y="${28 * scale}" width="${24 * scale}" height="${12 * scale}" rx="${6 * scale}" ry="${6 * scale}" 
              fill="#EF4444" 
              stroke="#FFFFFF" 
              stroke-width="${2 * scale}"
              filter="url(#shadow)"/>
        <text x="${28 * scale}" y="${34 * scale}" 
              font-family="Arial, sans-serif" 
              font-size="${10 * scale}" 
              font-weight="bold" 
              fill="#FFFFFF" 
              text-anchor="middle" 
              dominant-baseline="middle">+${unidadesEnCluster - 1}</text>
        ` : ''}
      </svg>
    `;
    
    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgMarker)}`,
      scaledSize: { width: width + 4, height: height + 4 },
      anchor: { x: (width + 4) / 2, y: (height + 4) / 2 },
    };
  };

  // Función para detectar ubicaciones cercanas y crear clusters
  const crearClusters = () => {
    const DISTANCIA_MINIMA = 0.05; // grados (~5km)
    const clusters: { centro: { lat: number; lng: number }; unidades: UbicacionTracking[] }[] = [];
    const procesadas = new Set<string>();

    ubicaciones.forEach((ubicacion) => {
      if (procesadas.has(ubicacion.placa)) return;

      const cluster = {
        centro: { lat: ubicacion.latitude, lng: ubicacion.longitude },
        unidades: [ubicacion]
      };

      // Buscar unidades cercanas
      ubicaciones.forEach((otra) => {
        if (otra.placa === ubicacion.placa || procesadas.has(otra.placa)) return;

        const distancia = Math.sqrt(
          Math.pow(ubicacion.latitude - otra.latitude, 2) +
          Math.pow(ubicacion.longitude - otra.longitude, 2)
        );

        if (distancia < DISTANCIA_MINIMA) {
          cluster.unidades.push(otra);
          procesadas.add(otra.placa);
        }
      });

      procesadas.add(ubicacion.placa);
      clusters.push(cluster);
    });

    return clusters;
  };

  const clusters = crearClusters();

  // Función para calcular offset circular alrededor del cluster
  const calcularPosicionCluster = (index: number, total: number, centro: { lat: number; lng: number }) => {
    if (total === 1) return centro;
    
    const radio = 0.02; // Radio del círculo en grados
    const angulo = (2 * Math.PI * index) / total;
    
    return {
      lat: centro.lat + radio * Math.cos(angulo),
      lng: centro.lng + radio * Math.sin(angulo)
    };
  };

  // Función para extraer municipio y estado de la dirección
  const extraerUbicacion = (address: string) => {
    // 📍 LISTA DE DESTINOS CONOCIDOS (EXACTAMENTE IGUAL QUE BACKEND)
    const destinosConocidos = [
      { nombre: 'GRANJAS CARROLL', ciudad: 'Oriental', estado: 'Puebla' },
      { nombre: 'CEDIS Walmart Monterrey', ciudad: 'Monterrey', estado: 'Nuevo León' },
      { nombre: 'CEDIS Walmart Chihuahua', ciudad: 'Chihuahua', estado: 'Chihuahua' },
      { nombre: 'Central de Abastos CDMX', ciudad: 'CDMX', estado: 'Ciudad de México' },
      { nombre: 'Central de Abastos Puebla', ciudad: 'Puebla', estado: 'Puebla' },
      { nombre: 'CEDIS Soriana Guadalajara', ciudad: 'Guadalajara', estado: 'Jalisco' },
      { nombre: 'CEDIS Chedraui Veracruz', ciudad: 'Veracruz', estado: 'Veracruz' },
      { nombre: 'WM Aguascalientes', ciudad: 'Aguascalientes', estado: 'Aguascalientes' },
      { nombre: 'CEDIS HEB San Luis Potosí', ciudad: 'San Luis Potosí', estado: 'San Luis Potosí' },
      { nombre: 'CEDIS Costco Querétaro', ciudad: 'Querétaro', estado: 'Querétaro' },
      { nombre: 'CEDIS Costco Chihuahua', ciudad: 'Chihuahua', estado: 'Chihuahua' },
      { nombre: 'CEDIS La Comer León', ciudad: 'León', estado: 'Guanajuato' },
      { nombre: 'CEDIS Guadalajara', ciudad: 'Guadalajara', estado: 'Jalisco' },
      { nombre: 'CEDIS Tijuana', ciudad: 'Tijuana', estado: 'Baja California' },
      { nombre: 'CEDIS Hermosillo', ciudad: 'Hermosillo', estado: 'Sonora' },
      { nombre: 'CEDIS Cancún', ciudad: 'Cancún', estado: 'Quintana Roo' },
      { nombre: 'CEDIS Mérida', ciudad: 'Mérida', estado: 'Yucatán' },
      { nombre: 'Empacadora Chiapas', ciudad: 'Tuxtla Gutiérrez', estado: 'Chiapas' },
      { nombre: 'Loma Bonita', ciudad: 'Oaxaca', estado: 'Oaxaca' },
      { nombre: 'La Providencia', ciudad: 'Pachuca', estado: 'Hidalgo' }
    ];
    
    // Verificar si la dirección contiene alguno de los destinos conocidos
    for (const destino of destinosConocidos) {
      if (address.includes(destino.nombre)) {
        return {
          ubicacion: destino.nombre,
          municipio: destino.ciudad,
          estado: destino.estado
        };
      }
    }
    
    // Formato genérico: "Calle, Colonia, CP, Municipio, Estado, País"
    const partes = address.split(',').map(p => p.trim());
    
    if (partes.length >= 3) {
      const estado = partes[partes.length - 2] || '';
      const municipio = partes[partes.length - 3] || '';
      const ubicacion = partes.slice(0, -2).join(', ');
      
      return { ubicacion, municipio, estado };
    }
    
    if (partes.length === 2) {
      return { ubicacion: partes[0], municipio: '', estado: partes[1] };
    }
    
    if (partes.length === 1) {
      return { ubicacion: partes[0], municipio: '', estado: '' };
    }
    
    return { ubicacion: address, municipio: '', estado: '' };
  };

  // Función para cerrar el menú con delay (3 segundos)
  const cerrarMenuConDelay = () => {
    // Limpiar cualquier timeout previo
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    // Solo cerrar si el mouse NO está sobre el menú
    hoverTimeoutRef.current = setTimeout(() => {
      if (!menuHoverRef.current) {
        setHoveredCluster(null);
      }
    }, 3000); // 3 segundos
  };

  // Función cuando el mouse entra al marcador
  const handleMarkerMouseOver = (cluster: { unidades: UbicacionTracking[]; centro: { lat: number; lng: number } }, e: any) => {
    // Limpiar timeout si existe
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    setHoveredCluster({
      unidades: cluster.unidades,
      x: e.pixel.x,
      y: e.pixel.y
    });
  };

  // Función cuando el mouse sale del marcador
  const handleMarkerMouseOut = () => {
    cerrarMenuConDelay();
  };

  // Función cuando el mouse entra al menú emergente
  const handleMenuMouseEnter = () => {
    menuHoverRef.current = true;
    // Limpiar timeout para que no se cierre
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  // Función cuando el mouse sale del menú emergente
  const handleMenuMouseLeave = () => {
    menuHoverRef.current = false;
    cerrarMenuConDelay();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full h-full max-w-[95vw] max-h-[95vh] flex flex-col overflow-hidden">
        
        {/* ========== HEADER AZUL COMPACTO (50% ALTURA) ========== */}
        <div 
          className="flex items-center justify-between px-5 py-2.5" 
          style={{
            background: 'linear-gradient(135deg, #1E66F5 0%, #1a56d4 100%)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
          }}
        >
          {/* TÍTULO + ÍCONO COMPACTO */}
          <div className="flex items-center gap-3">
            <div 
              className="p-2 rounded-lg" 
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.1) 100%)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}
            >
              <Navigation className="w-4 h-4 text-white drop-shadow-lg" strokeWidth={2.5} />
            </div>
            <div>
              <h2 
                className="text-white drop-shadow-lg" 
                style={{ 
                  fontFamily: "'Exo 2', sans-serif", 
                  fontSize: '16px', 
                  fontWeight: 800, 
                  letterSpacing: '0.5px',
                  lineHeight: '1.1'
                }}
              >
                MAPA DE FLOTA GRANJAS CARROLL
              </h2>
              <p 
                className="text-blue-100" 
                style={{ 
                  fontFamily: "'Exo 2', sans-serif", 
                  fontSize: '10px', 
                  fontWeight: 600,
                  marginTop: '1px'
                }}
              >
                {ubicaciones.length} unidades con GPS activo
              </p>
            </div>
          </div>

          {/* BOTÓN CERRAR COMPACTO */}
          <button
            onClick={onClose}
            className="flex items-center justify-center transition-all hover:scale-110"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.95)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
              border: '2px solid rgba(255, 255, 255, 1)'
            }}
          >
            <X className="w-4 h-4 text-[#1E66F5]" strokeWidth={3} />
          </button>
        </div>

        {/* CONTENIDO: MAPA + PANEL LATERAL */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* MAPA */}
          <div className="flex-1 relative" ref={mapRef}>
            {/* MENÚ EMERGENTE AL HACER HOVER EN CLUSTER */}
            {hoveredCluster && hoveredCluster.unidades.length > 1 && (
              <div
                className="absolute z-[9999] bg-white rounded-lg shadow-2xl border-2 border-[#1E66F5] p-3 min-w-[280px]"
                style={{
                  left: hoveredCluster.x + 10,
                  top: hoveredCluster.y - 10,
                  pointerEvents: 'none'
                }}
                onMouseEnter={handleMenuMouseEnter}
                onMouseLeave={handleMenuMouseLeave}
              >
                <div className="mb-2 pb-2 border-b border-gray-200">
                  <div style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 700, color: '#1E66F5' }}>
                    🚛 {hoveredCluster.unidades.length} UNIDADES EN ESTE PERÍMETRO
                  </div>
                  <div style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '9px', color: '#6B7280' }}>
                    Haz clic en una para ubicarla
                  </div>
                </div>
                <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                  {hoveredCluster.unidades.map((unidad, idx) => {
                    const { ubicacion: direccion, municipio, estado } = extraerUbicacion(unidad.address);
                    const colorUnidad = coloresPorUnidad[idx % coloresPorUnidad.length];
                    
                    return (
                      <div
                        key={unidad.placa}
                        className="p-2 bg-gray-50 rounded border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-all cursor-pointer"
                        style={{ pointerEvents: 'auto' }}
                        onClick={() => {
                          onSeleccionarUnidad(unidad.placa);
                          setHoveredCluster(null);
                        }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div 
                            className="w-3 h-3 rounded" 
                            style={{ 
                              backgroundColor: colorUnidad,
                              border: '1px solid white',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                            }}
                          ></div>
                          <span style={{ fontFamily: "'Orbitron', monospace", fontSize: '12px', fontWeight: 700, color: '#000000' }}>
                            {unidad.placa}
                          </span>
                          <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '8px', color: '#9CA3AF', marginLeft: 'auto' }}>
                            {unidad.speed} km/h
                          </span>
                        </div>
                        <div style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '8px', color: '#6B7280', marginLeft: '20px', marginBottom: '2px' }}>
                          {unidad.operador}
                        </div>
                        {(municipio || estado) && (
                          <div style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '8px', color: '#1E66F5', fontWeight: 600, marginLeft: '20px' }}>
                            {municipio}{municipio && estado && ', '}{estado}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {loadingKey ? (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <div className="text-center">
                  <div className="relative w-16 h-16 mx-auto mb-4">
                    <div className="absolute inset-0 border-4 border-[#1E66F5] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <p className="text-[#1E66F5]" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', fontWeight: 700 }}>
                    Cargando mapa...
                  </p>
                </div>
              </div>
            ) : !apiKey ? (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <div className="text-center text-red-600">
                  <p style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', fontWeight: 700 }}>
                    ⚠️ Error: No se pudo obtener la API key de Google Maps
                  </p>
                </div>
              </div>
            ) : (
              <LoadScript googleMapsApiKey={apiKey}>
                <GoogleMap
                  mapContainerStyle={containerStyle}
                  center={center}
                  zoom={zoom}
                  onLoad={setMap}
                  options={{
                    styles: [
                      {
                        featureType: 'water',
                        elementType: 'geometry',
                        stylers: [{ color: '#C6E9FF' }]
                      },
                      {
                        featureType: 'landscape',
                        elementType: 'geometry',
                        stylers: [{ color: '#F5F5F5' }]
                      },
                      {
                        featureType: 'road',
                        elementType: 'geometry.fill',
                        stylers: [{ color: '#FFFFFF' }]
                      },
                      {
                        featureType: 'road',
                        elementType: 'geometry.stroke',
                        stylers: [{ color: '#DDDDDD' }]
                      },
                      {
                        featureType: 'road.highway',
                        elementType: 'geometry.fill',
                        stylers: [{ color: '#FFE8A8' }]
                      },
                      {
                        featureType: 'road.highway',
                        elementType: 'geometry.stroke',
                        stylers: [{ color: '#F5C842' }]
                      },
                      {
                        featureType: 'poi',
                        elementType: 'geometry',
                        stylers: [{ color: '#E8F5E9' }]
                      },
                      {
                        featureType: 'poi.park',
                        elementType: 'geometry',
                        stylers: [{ color: '#C8E6C9' }]
                      },
                      {
                        featureType: 'administrative',
                        elementType: 'geometry.stroke',
                        stylers: [{ color: '#CCCCCC' }, { weight: 1 }]
                      },
                      {
                        featureType: 'all',
                        elementType: 'labels.text.fill',
                        stylers: [{ color: '#333333' }]
                      },
                      {
                        featureType: 'all',
                        elementType: 'labels.text.stroke',
                        stylers: [{ color: '#FFFFFF' }, { weight: 3 }]
                      }
                    ],
                    disableDefaultUI: false,
                    zoomControl: true,
                    streetViewControl: false,
                    fullscreenControl: true,
                  }}
                >
                  {clusters.map((cluster) => {
                    const isSelected = selectedMarker === cluster.unidades[0].placa;
                    const position = calcularPosicionCluster(cluster.unidades.length - 1, cluster.unidades.length, cluster.centro);
                    const markerIcon = getMarkerIcon(cluster.unidades[0].placa, cluster.unidades.length, isSelected);
                    
                    return (
                      <OverlayView
                        key={cluster.unidades[0].placa}
                        position={position}
                        mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                      >
                        <div
                          onClick={() => {
                            setSelectedMarker(cluster.unidades[0].placa);
                            onSeleccionarUnidad(cluster.unidades[0].placa);
                          }}
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            handleMarkerMouseOver(cluster, { pixel: { x: rect.left, y: rect.top } });
                          }}
                          onMouseLeave={handleMarkerMouseOut}
                          className="cursor-pointer transition-transform hover:scale-110"
                          style={{
                            transform: 'translate(-50%, -50%)',
                            zIndex: isSelected ? 1000 : cluster.unidades[0].placa.charCodeAt(0)
                          }}
                          title={`Unidad ${cluster.unidades[0].placa}`}
                        >
                          <img 
                            src={markerIcon.url} 
                            alt={`Unidad ${cluster.unidades[0].placa}`}
                            style={{
                              width: `${markerIcon.scaledSize.width}px`,
                              height: `${markerIcon.scaledSize.height}px`
                            }}
                          />
                        </div>
                      </OverlayView>
                    );
                  })}

                  {selectedMarker && ubicaciones.find(u => u.placa === selectedMarker) && (() => {
                    const ubicacionSeleccionada = ubicaciones.find(u => u.placa === selectedMarker)!;
                    const { ubicacion: direccion, municipio, estado } = extraerUbicacion(ubicacionSeleccionada.address);
                    
                    // Calcular horas con 1 decimal desde tiempoEstacionado (que viene en minutos)
                    const tiempoMinutos = ubicacionSeleccionada.tiempoEstacionado || 0;
                    const horasDecimal = (tiempoMinutos / 60).toFixed(1);
                    
                    return (
                      <InfoWindow
                        position={{
                          lat: ubicacionSeleccionada.latitude,
                          lng: ubicacionSeleccionada.longitude
                        }}
                        onCloseClick={() => setSelectedMarker(null)}
                      >
                        <div style={{ fontFamily: "'Exo 2', sans-serif", maxWidth: '280px' }}>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: '#1E66F5', marginBottom: '8px' }}>
                            🚛 Unidad {selectedMarker}
                          </div>
                          <div style={{ fontSize: '11px', color: '#374151', marginBottom: '4px' }}>
                            <strong>Operador:</strong> {ubicacionSeleccionada.operador}
                          </div>
                          <div style={{ fontSize: '11px', color: '#374151', marginBottom: '4px' }}>
                            <strong>Velocidad:</strong> {ubicacionSeleccionada.speed} km/h
                          </div>
                          
                          {/* TIEMPO DE ESPERA - Solo mostrar si tiene tiempo estacionado */}
                          {ubicacionSeleccionada.tiempoEstacionado && ubicacionSeleccionada.tiempoEstacionado > 0 && (
                            <div 
                              style={{ 
                                background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.15) 0%, rgba(251, 146, 60, 0.05) 100%)',
                                border: '1.5px solid rgba(251, 146, 60, 0.4)',
                                borderRadius: '8px',
                                padding: '8px 10px',
                                marginTop: '8px',
                                marginBottom: '8px'
                              }}
                            >
                              <div style={{ fontSize: '9px', fontWeight: 700, color: '#EA580C', letterSpacing: '0.3px', marginBottom: '4px' }}>
                                ⏱️ TIEMPO DE ESPERA
                              </div>
                              <div style={{ fontSize: '18px', fontWeight: 800, color: '#EA580C', letterSpacing: '0.5px', lineHeight: '1.2' }}>
                                {horasDecimal} <span style={{ fontSize: '11px', fontWeight: 600 }}>hrs</span>
                              </div>
                              <div style={{ fontSize: '8px', fontWeight: 600, color: '#9A3412', marginTop: '2px' }}>
                                Estacionado en radio de 500m
                              </div>
                            </div>
                          )}
                          
                          <div style={{ borderTop: '1px solid #E5E7EB', marginTop: '8px', paddingTop: '8px' }}>
                            <div style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280', marginBottom: '4px' }}>
                              📍 UBICACIÓN:
                            </div>
                            <div style={{ fontSize: '10px', color: '#374151', lineHeight: '1.4', marginBottom: '6px' }}>
                              {direccion}
                            </div>
                            {(municipio || estado) && (
                              <div style={{ fontSize: '11px', color: '#1E66F5', fontWeight: 700 }}>
                                {municipio}{municipio && estado && ', '}{estado}
                              </div>
                            )}
                          </div>
                        </div>
                      </InfoWindow>
                    );
                  })()}
                </GoogleMap>
              </LoadScript>
            )}
          </div>

          {/* PANEL LATERAL - GRID DE 2 COLUMNAS */}
          <div className="w-96 bg-white border-l-2 border-slate-200 overflow-y-auto shadow-xl">
            <div className="p-3.5">
              {/* BOTÓN VER TODAS COMPACTO */}
              <button
                onClick={handleVerTodas}
                className="w-full mb-3.5 px-3.5 py-2 bg-gradient-to-r from-[#1E66F5] to-[#1a56d4] text-white rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 hover:scale-105"
                style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px', fontWeight: 800 }}
              >
                <MapPin className="w-4 h-4" />
                VER TODAS LAS UNIDADES
              </button>

              {/* SEPARADOR + TÍTULO COMPACTO */}
              <div className="mb-3 pb-2 border-b-2 border-slate-200">
                <div className="flex items-center justify-between">
                  <div style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 800, color: '#1E66F5', letterSpacing: '0.5px' }}>
                    UNIDADES ({ubicaciones.length}):
                  </div>
                  <div className="px-2 py-1 rounded-md bg-emerald-100 border border-emerald-300">
                    <Truck className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                </div>
              </div>

              {/* GRID DE 2 COLUMNAS - TARJETAS ULTRA COMPACTAS */}
              <div className="grid grid-cols-2 gap-1.5">
                {ubicaciones.map((ubicacion, index) => {
                  const isSelected = unidadSeleccionada === ubicacion.placa;
                  const colorUnidad = coloresPorUnidad[index % coloresPorUnidad.length];
                  const { ubicacion: direccion, municipio, estado } = extraerUbicacion(ubicacion.address);
                  
                  return (
                    <button
                      key={ubicacion.placa}
                      onClick={() => onSeleccionarUnidad(ubicacion.placa)}
                      className={`w-full text-left p-1.5 rounded-lg border-2 transition-all shadow-sm hover:shadow-md ${
                        isSelected
                          ? 'bg-blue-50 border-[#1E66F5] shadow-md scale-[1.02]'
                          : 'bg-slate-50 border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      {/* HEADER: CÍRCULO + NÚMERO + VELOCIDAD */}
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center gap-1">
                          <div 
                            className="w-2.5 h-2.5 rounded shadow-sm" 
                            style={{ 
                              backgroundColor: colorUnidad,
                              border: '1.5px solid white'
                            }}
                          ></div>
                          <span style={{ fontFamily: "'Orbitron', monospace", fontSize: '11px', fontWeight: 700, color: '#1E66F5' }}>
                            {ubicacion.placa}
                          </span>
                        </div>
                        <div className="px-1 py-0.5 rounded bg-slate-200">
                          <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '7px', fontWeight: 700, color: '#475569' }}>
                            {ubicacion.speed} km/h
                          </span>
                        </div>
                      </div>
                      
                      {/* OPERADOR */}
                      <div style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '7px', fontWeight: 600, color: '#64748b', marginBottom: '2px', marginLeft: '12px' }}>
                        {ubicacion.operador}
                      </div>
                      
                      {/* UBICACIÓN */}
                      <div className="ml-3 pt-0.5 border-t border-slate-200">
                        {(municipio || estado) ? (
                          <div className="flex items-center gap-0.5">
                            <MapPin className="w-2 h-2 text-[#1E66F5]" />
                            <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '7px', color: '#1E66F5', fontWeight: 700 }}>
                              {municipio}{municipio && estado && ', '}{estado}
                            </span>
                          </div>
                        ) : (
                          <div style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '6px', color: '#94a3b8', fontStyle: 'italic' }}>
                            Ubicación desconocida
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};