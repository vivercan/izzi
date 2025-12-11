import { useEffect, useState } from 'react';
import { X, ZoomIn, ZoomOut, Navigation } from 'lucide-react';

interface UbicacionTracking {
  placa: string;
  latitude: number;
  longitude: number;
  speed: number;
  timestamp: string;
  address: string;
  operador?: string;
}

interface MapaFlotaProps {
  ubicaciones: UbicacionTracking[];
  unidadSeleccionada: string | null;
  onClose: () => void;
  onSeleccionarUnidad: (placa: string) => void;
}

export const MapaFlota = ({ ubicaciones, unidadSeleccionada, onClose, onSeleccionarUnidad }: MapaFlotaProps) => {
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Asignar al azar si va a entrega o regreso (por ahora)
  const ubicacionesConEstado = ubicaciones.map((u, index) => ({
    ...u,
    estado: index % 2 === 0 ? 'entrega' : 'regreso'
  }));

  // Convertir lat/lng a coordenadas del mapa (México: lat 14-32, lng -118 a -86)
  const latLngToXY = (lat: number, lng: number) => {
    const mapWidth = 1000;
    const mapHeight = 800;
    
    // México bounds aproximados
    const minLat = 14.5;
    const maxLat = 32.7;
    const minLng = -118.4;
    const maxLng = -86.7;
    
    const x = ((lng - minLng) / (maxLng - minLng)) * mapWidth;
    const y = ((maxLat - lat) / (maxLat - minLat)) * mapHeight;
    
    return { x, y };
  };

  // Auto-zoom cuando se selecciona una unidad
  useEffect(() => {
    if (unidadSeleccionada) {
      const ubicacion = ubicaciones.find(u => u.placa === unidadSeleccionada);
      if (ubicacion) {
        const { x, y } = latLngToXY(ubicacion.latitude, ubicacion.longitude);
        // Centrar en la ubicación seleccionada
        setPanX(-x * 2 + 400);
        setPanY(-y * 2 + 300);
        setZoom(2);
      }
    } else {
      // Reset al vista general
      setPanX(0);
      setPanY(0);
      setZoom(1);
    }
  }, [unidadSeleccionada]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPanX(e.clientX - dragStart.x);
      setPanY(e.clientY - dragStart.y);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex flex-col">
      {/* HEADER DEL MAPA */}
      <div className="bg-white px-4 py-3 flex items-center justify-between shadow-lg">
        <div>
          <div className="text-gray-800" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '18px', fontWeight: 700 }}>
            🗺️ MAPA DE FLOTA • {ubicaciones.length} Unidades Activas
          </div>
          <div className="text-gray-500" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px' }}>
            República Mexicana • GPS en tiempo real
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* CONTROLES DE ZOOM */}
          <div className="flex items-center gap-1 bg-gray-100 rounded p-1">
            <button
              onClick={() => setZoom(Math.min(zoom + 0.5, 4))}
              className="p-2 bg-white hover:bg-blue-500 hover:text-white transition-colors shadow-sm rounded"
              title="Acercar"
            >
              <ZoomIn className="w-4 h-4" strokeWidth={2.5} />
            </button>
            <button
              onClick={() => setZoom(Math.max(zoom - 0.5, 0.5))}
              className="p-2 bg-white hover:bg-blue-500 hover:text-white transition-colors shadow-sm rounded"
              title="Alejar"
            >
              <ZoomOut className="w-4 h-4" strokeWidth={2.5} />
            </button>
            <button
              onClick={() => {
                setZoom(1);
                setPanX(0);
                setPanY(0);
                onSeleccionarUnidad('');
              }}
              className="p-2 bg-white hover:bg-blue-500 hover:text-white transition-colors shadow-sm rounded"
              title="Centrar"
            >
              <Navigation className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 bg-red-500 hover:bg-red-600 text-white transition-colors shadow-md hover:shadow-lg rounded"
          >
            <X className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* MAPA */}
      <div 
        className="flex-1 relative overflow-hidden bg-gradient-to-br from-blue-100 via-blue-50 to-green-50"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <div
          style={{
            transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
            transformOrigin: 'center',
            transition: isDragging ? 'none' : 'transform 0.3s ease-out',
            width: '1000px',
            height: '800px',
            position: 'absolute',
            left: '50%',
            top: '50%',
            marginLeft: '-500px',
            marginTop: '-400px'
          }}
        >
          {/* MAPA BASE DE MÉXICO (simplificado con SVG) */}
          <svg
            viewBox="0 0 1000 800"
            className="w-full h-full"
            style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }}
          >
            {/* Fondo del territorio */}
            <rect x="0" y="0" width="1000" height="800" fill="#E8F4F8" />
            
            {/* Contorno aproximado de México */}
            <path
              d="M 100,400 L 150,200 L 250,150 L 350,100 L 450,120 L 550,100 L 650,150 L 750,200 L 820,250 L 870,350 L 900,450 L 880,550 L 820,620 L 750,680 L 650,720 L 550,750 L 450,740 L 350,710 L 250,650 L 180,600 L 120,520 Z"
              fill="#8FD5A6"
              stroke="#2D7A4F"
              strokeWidth="3"
              opacity="0.8"
            />
            
            {/* Estados principales (simplificado) */}
            <g opacity="0.5">
              {/* Baja California */}
              <rect x="50" y="80" width="80" height="250" fill="#6BC98E" stroke="#2D7A4F" strokeWidth="2" rx="5" />
              
              {/* Sonora/Chihuahua */}
              <rect x="150" y="100" width="200" height="180" fill="#6BC98E" stroke="#2D7A4F" strokeWidth="2" rx="5" />
              
              {/* Zona Centro */}
              <ellipse cx="450" cy="450" rx="180" ry="150" fill="#7FD59E" stroke="#2D7A4F" strokeWidth="2" />
              
              {/* Península de Yucatán */}
              <path
                d="M 700,500 L 850,480 L 900,520 L 880,580 L 800,600 L 720,580 Z"
                fill="#6BC98E"
                stroke="#2D7A4F"
                strokeWidth="2"
              />
            </g>
            
            {/* Grid de referencia */}
            <g stroke="#94C9A9" strokeWidth="1" opacity="0.3">
              {[0, 100, 200, 300, 400, 500, 600, 700, 800, 900].map(x => (
                <line key={`v${x}`} x1={x} y1="0" x2={x} y2="800" />
              ))}
              {[0, 100, 200, 300, 400, 500, 600, 700].map(y => (
                <line key={`h${y}`} x1="0" y1={y} x2="1000" y2={y} />
              ))}
            </g>
          </svg>

          {/* MARCADORES DE UNIDADES */}
          {ubicacionesConEstado.map((ubicacion) => {
            const { x, y } = latLngToXY(ubicacion.latitude, ubicacion.longitude);
            const esSeleccionada = unidadSeleccionada === ubicacion.placa;
            const esEntrega = ubicacion.estado === 'entrega';
            
            return (
              <div
                key={ubicacion.placa}
                className="absolute"
                style={{
                  left: `${x}px`,
                  top: `${y}px`,
                  transform: 'translate(-50%, -50%)',
                  zIndex: esSeleccionada ? 1000 : 1
                }}
              >
                {/* MARCADOR */}
                <div
                  className={`relative cursor-pointer transition-all ${
                    esSeleccionada ? 'scale-150' : 'hover:scale-125'
                  }`}
                  onClick={() => onSeleccionarUnidad(ubicacion.placa)}
                >
                  {/* Pin */}
                  <div className="relative">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-xl ${
                        esEntrega ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{
                        fontFamily: "'Orbitron', monospace",
                        fontSize: '12px',
                        fontWeight: 700,
                        color: 'white'
                      }}
                    >
                      {esEntrega ? 'E' : 'R'}
                    </div>
                    {/* Punta del pin */}
                    <div
                      className={`absolute left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[10px] ${
                        esEntrega ? 'border-t-emerald-500' : 'border-t-amber-500'
                      } border-l-transparent border-r-transparent`}
                      style={{ top: '36px' }}
                    />
                  </div>

                  {/* ETIQUETA CON NÚMERO */}
                  <div
                    className={`absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg shadow-xl border-2 ${
                      esEntrega
                        ? 'bg-emerald-500 border-emerald-600'
                        : 'bg-amber-500 border-amber-600'
                    } whitespace-nowrap`}
                  >
                    <div
                      className="text-white"
                      style={{
                        fontFamily: "'Orbitron', monospace",
                        fontSize: '14px',
                        fontWeight: 700
                      }}
                    >
                      {ubicacion.placa}
                    </div>
                    {/* Flecha de la etiqueta */}
                    <div
                      className={`absolute left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] ${
                        esEntrega ? 'border-t-emerald-600' : 'border-t-amber-600'
                      } border-l-transparent border-r-transparent`}
                      style={{ bottom: '-8px' }}
                    />
                  </div>

                  {/* POPUP AL SELECCIONAR */}
                  {esSeleccionada && (
                    <div
                      className="absolute left-12 top-0 bg-white rounded-lg shadow-2xl border-2 border-gray-300 p-3 w-64 z-50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className={`px-3 py-1.5 rounded ${
                            esEntrega ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                        >
                          <div
                            className="text-white"
                            style={{
                              fontFamily: "'Orbitron', monospace",
                              fontSize: '16px',
                              fontWeight: 700
                            }}
                          >
                            {ubicacion.placa}
                          </div>
                        </div>
                        <div
                          className={`px-2 py-1 rounded border-2 ${
                            esEntrega
                              ? 'border-emerald-500 text-emerald-700 bg-emerald-50'
                              : 'border-amber-500 text-amber-700 bg-amber-50'
                          }`}
                        >
                          <div
                            style={{
                              fontFamily: "'Exo 2', sans-serif",
                              fontSize: '10px',
                              fontWeight: 700
                            }}
                          >
                            {esEntrega ? '📦 ENTREGA' : '🔄 REGRESO'}
                          </div>
                        </div>
                      </div>
                      <div
                        className="text-gray-800 mb-1"
                        style={{
                          fontFamily: "'Exo 2', sans-serif",
                          fontSize: '12px',
                          fontWeight: 700
                        }}
                      >
                        {ubicacion.operador}
                      </div>
                      <div
                        className="text-gray-600 mb-1"
                        style={{
                          fontFamily: "'Exo 2', sans-serif",
                          fontSize: '10px'
                        }}
                      >
                        📍 {ubicacion.address.substring(0, 60)}...
                      </div>
                      <div
                        className="text-gray-600 mb-1"
                        style={{
                          fontFamily: "'Exo 2', sans-serif",
                          fontSize: '10px'
                        }}
                      >
                        🚗 Velocidad: {ubicacion.speed} km/h
                      </div>
                      <div
                        className="text-gray-500"
                        style={{
                          fontFamily: "'Exo 2', sans-serif",
                          fontSize: '9px'
                        }}
                      >
                        🕐 {new Date(ubicacion.timestamp).toLocaleString('es-MX')}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* INDICADOR DE ZOOM */}
        <div className="absolute bottom-4 right-4 bg-white bg-opacity-90 px-3 py-2 rounded-lg shadow-lg">
          <div
            className="text-gray-700"
            style={{
              fontFamily: "'Exo 2', sans-serif",
              fontSize: '11px',
              fontWeight: 700
            }}
          >
            Zoom: {Math.round(zoom * 100)}%
          </div>
        </div>
      </div>

      {/* PANEL INFERIOR CON BOTONES DE UNIDADES */}
      <div className="bg-white px-4 py-3 shadow-lg border-t border-gray-300">
        <div
          className="text-gray-700 mb-2"
          style={{
            fontFamily: "'Exo 2', sans-serif",
            fontSize: '11px',
            fontWeight: 700
          }}
        >
          SELECCIONAR UNIDAD PARA UBICAR:
        </div>
        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
          {ubicaciones.map((ubicacion, index) => {
            const esEntrega = index % 2 === 0;
            const esSeleccionada = unidadSeleccionada === ubicacion.placa;

            return (
              <button
                key={ubicacion.placa}
                onClick={() => onSeleccionarUnidad(ubicacion.placa)}
                className={`px-3 py-1.5 transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5 border-b-2 ${
                  esSeleccionada
                    ? esEntrega
                      ? 'bg-gradient-to-b from-emerald-400 to-emerald-600 text-white border-emerald-800 shadow-emerald-500/50'
                      : 'bg-gradient-to-b from-amber-400 to-amber-600 text-white border-amber-800 shadow-amber-500/50'
                    : esEntrega
                    ? 'bg-gradient-to-b from-emerald-100 to-emerald-200 text-emerald-800 border-emerald-400 hover:from-emerald-200 hover:to-emerald-300'
                    : 'bg-gradient-to-b from-amber-100 to-amber-200 text-amber-800 border-amber-400 hover:from-amber-200 hover:to-amber-300'
                }`}
                style={{
                  fontFamily: "'Orbitron', monospace",
                  fontSize: '13px',
                  fontWeight: 700
                }}
                title={ubicacion.operador}
              >
                {ubicacion.placa}
              </button>
            );
          })}
        </div>
        <div className="mt-2 flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <div
              className="text-gray-600"
              style={{
                fontFamily: "'Exo 2', sans-serif",
                fontSize: '10px',
                fontWeight: 700
              }}
            >
              Entrega
            </div>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <div
              className="text-gray-600"
              style={{
                fontFamily: "'Exo 2', sans-serif",
                fontSize: '10px',
                fontWeight: 700
              }}
            >
              Regreso
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
