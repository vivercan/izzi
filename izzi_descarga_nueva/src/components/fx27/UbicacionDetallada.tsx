import { useState, useEffect } from 'react';
import { MapPin, Navigation, Target } from 'lucide-react';
import { 
  obtenerUbicacionDetallada, 
  formatearUbicacionCorta, 
  formatearUbicacionCompleta,
  detectarUbicacionImportante,
  GRANJAS_CARROLL_COORDS
} from '../../utils/geocoding';

interface UbicacionDetalladaProps {
  lat: number;
  lng: number;
  mostrarCompleto?: boolean;
  onUbicacionCargada?: (ubicacion: any) => void;
}

export const UbicacionDetallada = ({ 
  lat, 
  lng, 
  mostrarCompleto = false,
  onUbicacionCargada 
}: UbicacionDetalladaProps) => {
  const [ubicacion, setUbicacion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState('');

  useEffect(() => {
    // Obtener API Key de Google Maps
    fetch(`https://${import.meta.env.VITE_SUPABASE_PROJECT_ID || 'ynpjtamjhqstwuazedqu'}.supabase.co/functions/v1/make-server-d84b50bb/api-keys/google-maps`, {
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlucGp0YW1qaHFzdHd1YXplZHF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY3OTM4ODcsImV4cCI6MjA1MjM2OTg4N30.SL7kEKdJJl_y9i6h_CbmYb9ywRp--5rzvg9Mh4n6S9Q'}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setGoogleMapsApiKey(data.apiKey);
      })
      .catch(err => console.error('Error obteniendo API Key:', err));
  }, []);

  useEffect(() => {
    if (!googleMapsApiKey) return;

    const cargarUbicacion = async () => {
      setLoading(true);
      try {
        const ubicacionDetallada = await obtenerUbicacionDetallada(
          { lat, lng },
          googleMapsApiKey
        );
        setUbicacion(ubicacionDetallada);
        
        if (onUbicacionCargada) {
          onUbicacionCargada(ubicacionDetallada);
        }
      } catch (error) {
        console.error('Error cargando ubicación:', error);
      }
      setLoading(false);
    };

    cargarUbicacion();
  }, [lat, lng, googleMapsApiKey]);

  // Detectar ubicación importante
  const ubicacionImportante = detectarUbicacionImportante({ lat, lng });

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-400" style={{ fontSize: '11px' }}>
        <Navigation className="w-3 h-3 animate-spin" />
        <span>Obteniendo ubicación...</span>
      </div>
    );
  }

  if (!ubicacion) {
    return (
      <div className="flex items-center gap-2 text-slate-400" style={{ fontSize: '11px' }}>
        <MapPin className="w-3 h-3" />
        <span>{lat.toFixed(4)}, {lng.toFixed(4)}</span>
      </div>
    );
  }

  // Si está en ubicación importante
  if (ubicacionImportante) {
    return (
      <div className="inline-flex items-center gap-2 px-2 py-1 rounded-lg" style={{
        background: ubicacion.esGranjasCarroll ? '#ECFDF5' : '#EFF6FF',
        border: `1.5px solid ${ubicacion.esGranjasCarroll ? '#10B981' : '#3B82F6'}`
      }}>
        <span style={{ fontSize: '14px' }}>{ubicacionImportante.icono}</span>
        <div>
          <div style={{ 
            fontFamily: "'Exo 2', sans-serif",
            fontSize: '11px', 
            fontWeight: 700,
            color: ubicacion.esGranjasCarroll ? '#065F46' : '#1E40AF'
          }}>
            {ubicacionImportante.nombre}
          </div>
          {mostrarCompleto && (
            <div style={{ 
              fontSize: '10px', 
              color: '#64748B',
              marginTop: '2px'
            }}>
              {ubicacionImportante.distancia}m del centro
            </div>
          )}
        </div>
      </div>
    );
  }

  // Ubicación normal
  return (
    <div className="flex items-center gap-2">
      <MapPin className="w-3.5 h-3.5 text-slate-500" />
      <div>
        <div style={{ 
          fontFamily: "'Exo 2', sans-serif",
          fontSize: '11px', 
          fontWeight: 600,
          color: '#334155'
        }}>
          {formatearUbicacionCorta(ubicacion)}
        </div>
        {mostrarCompleto && ubicacion.codigoPostal && (
          <div style={{ 
            fontSize: '10px', 
            color: '#64748B',
            marginTop: '2px'
          }}>
            CP {ubicacion.codigoPostal}
          </div>
        )}
      </div>
    </div>
  );
};
