import { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { getGoogleMapsApiKey } from '../../utils/supabase/getGoogleMapsKey';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface UbicacionGPSProps {
  latitude: number;
  longitude: number;
  address: string;
  onVerMapa: () => void;
  isCache: boolean;
  cacheAge?: number;
}

interface CiudadEstado {
  ciudad: string;
  estado: string;
  cargando: boolean;
  esDestinoConocido: boolean;
  nombreDestino?: string;
  dentroDeGeocerca?: boolean;
}

export const UbicacionGPS = ({ latitude, longitude, address, onVerMapa, isCache, cacheAge }: UbicacionGPSProps) => {
  const [ubicacion, setUbicacion] = useState<CiudadEstado>({ ciudad: '', estado: '', cargando: true, esDestinoConocido: false });

  useEffect(() => {
    const procesarUbicacion = async () => {
      try {
        // 📍 PASO 1: VERIFICAR GEOCERCAS (desde backend con cálculo preciso)
        try {
          const geocercaResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/carroll/detectar-geocerca`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${publicAnonKey}`
              },
              body: JSON.stringify({ lat: latitude, lng: longitude })
            }
          );
          
          const geocercaData = await geocercaResponse.json();
          
          if (geocercaData.success && geocercaData.dentroDeGeocerca && geocercaData.geocerca) {
            const geo = geocercaData.geocerca;
            console.log('✅ Geocerca detectada:', geo.nombre, `(${geo.distanciaMetros}m)`);
            setUbicacion({ 
              ciudad: geo.ciudad, 
              estado: geo.estado, // ESTADO COMPLETO (no abreviado)
              cargando: false,
              esDestinoConocido: true,
              nombreDestino: geo.nombre,
              dentroDeGeocerca: true
            });
            return;
          }
        } catch (geocercaError) {
          console.warn('Error verificando geocerca:', geocercaError);
          // Continuar con Google Maps si falla la geocerca
        }
        
        // 📍 PASO 2: NO HAY GEOCERCA - Usar Google Maps Geocoding API
        const apiKey = await getGoogleMapsApiKey();
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}&language=es`;
        
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK' && data.results && data.results.length > 0) {
          const addressComponents = data.results[0].address_components;
          
          let ciudad = '';
          let municipio = '';
          let estado = '';

          // Buscar municipio (locality)
          const localityComponent = addressComponents.find((c: any) => 
            c.types.includes('locality')
          );
          if (localityComponent) {
            municipio = localityComponent.long_name;
          }
          
          // Buscar sublocality si no hay locality
          if (!municipio) {
            const sublocalityComponent = addressComponents.find((c: any) => 
              c.types.includes('sublocality') || c.types.includes('sublocality_level_1')
            );
            if (sublocalityComponent) {
              municipio = sublocalityComponent.long_name;
            }
          }

          // Buscar estado (administrative_area_level_1) - NOMBRE COMPLETO
          const stateComponent = addressComponents.find((c: any) => 
            c.types.includes('administrative_area_level_1')
          );
          if (stateComponent) {
            estado = stateComponent.long_name; // USAR long_name para estado completo
          }

          ciudad = municipio;

          setUbicacion({ ciudad, estado, cargando: false, esDestinoConocido: false, dentroDeGeocerca: false });
        } else {
          // Fallback final: extraer del address manualmente
          const parts = address.split(',').map(p => p.trim());
          if (parts.length >= 2) {
            setUbicacion({ 
              ciudad: parts[0]?.trim() || '',
              estado: parts[parts.length - 1]?.trim() || '',
              cargando: false,
              esDestinoConocido: false,
              dentroDeGeocerca: false
            });
          } else {
            // Último recurso: mostrar coordenadas
            setUbicacion({ 
              ciudad: `${latitude.toFixed(4)}°`,
              estado: `${longitude.toFixed(4)}°`,
              cargando: false,
              esDestinoConocido: false,
              dentroDeGeocerca: false
            });
          }
        }
      } catch (error) {
        console.error('Error obteniendo ubicación:', error);
        // Fallback robusto
        const parts = address.split(',').map(p => p.trim());
        if (parts.length >= 2) {
          setUbicacion({ 
            ciudad: parts[0]?.trim() || '',
            estado: parts[parts.length - 1]?.trim() || '',
            cargando: false,
            esDestinoConocido: false,
            dentroDeGeocerca: false
          });
        } else if (parts.length === 1) {
          setUbicacion({ 
            ciudad: parts[0],
            estado: '',
            cargando: false,
            esDestinoConocido: false,
            dentroDeGeocerca: false
          });
        } else {
          // Último último recurso: coordenadas
          setUbicacion({ 
            ciudad: `${latitude.toFixed(4)}°`,
            estado: `${longitude.toFixed(4)}°`,
            cargando: false,
            esDestinoConocido: false,
            dentroDeGeocerca: false
          });
        }
      }
    };

    procesarUbicacion();
  }, [latitude, longitude, address]);

  return (
    <div className="flex items-center gap-2">
      {/* BOTÓN MARCADOR - SOLO ICONO */}
      <button
        className="p-2 rounded-full bg-gradient-to-r from-[#1E66F5] to-[#1a56d4] text-white hover:shadow-lg flex items-center justify-center transition-all hover:scale-105 shadow-md"
        style={{ fontFamily: "'Exo 2', sans-serif" }}
        onClick={onVerMapa}
        title="Ver en mapa"
      >
        <MapPin className="w-3.5 h-3.5" strokeWidth={2.5} />
      </button>

      {/* INFORMACIÓN DE UBICACIÓN */}
      <div className="flex-1">
        {ubicacion.cargando ? (
          <div className="text-slate-400" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px' }}>
            Cargando ubicación...
          </div>
        ) : ubicacion.dentroDeGeocerca && ubicacion.nombreDestino ? (
          <>
            {/* DENTRO DE GEOCERCA - FORMATO ESPECIAL CON ICONO */}
            <div className="text-emerald-500 flex items-center gap-1" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px', fontWeight: 800, letterSpacing: '0.3px' }}>
              <span className="text-xs">📍</span> {ubicacion.nombreDestino}
            </div>
            <div className="text-slate-500" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '9px', fontWeight: 600 }}>
              {ubicacion.ciudad}, {ubicacion.estado}
            </div>
          </>
        ) : (ubicacion.ciudad || ubicacion.estado) ? (
          <>
            {/* UBICACIÓN GENÉRICA - MUNICIPIO Y ESTADO COMPLETO */}
            <div className="text-[#1E66F5]" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 700 }}>
              {ubicacion.ciudad}{ubicacion.ciudad && ubicacion.estado && ', '}{ubicacion.estado}
            </div>
          </>
        ) : (
          <>
            {/* FALLBACK - Mostrar inicio de la dirección */}
            <div className="text-slate-500" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px' }}>
              {address.split(',')[0]?.substring(0, 25) || 'Ubicación GPS'}...
            </div>
          </>
        )}
        
        {/* INDICADOR DE CACHE O LIVE */}
        <div className="text-slate-400 flex items-center gap-1" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '7px', marginTop: '1px' }}>
          {isCache ? (
            <span className="text-amber-500 font-semibold">📦 Cache {cacheAge}s</span>
          ) : (
            <span className="text-emerald-500 flex items-center gap-1 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live GPS
            </span>
          )}
        </div>
      </div>
    </div>
  );
};