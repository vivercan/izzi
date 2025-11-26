import { useState, useEffect } from 'react';
import { MapPin, Factory, Loader } from 'lucide-react';
import { obtenerDireccionDetallada, formatearUbicacion, type Coordenadas, type UbicacionDetallada } from '../../utils/ubicacion-inteligente';

interface UbicacionInteligenteCompactaProps {
  lat: number;
  lng: number;
  mostrarCompleto?: boolean; // Si es true, muestra la dirección completa en tooltip
}

export const UbicacionInteligenteCompacta = ({ 
  lat, 
  lng, 
  mostrarCompleto = false 
}: UbicacionInteligenteCompactaProps) => {
  const [ubicacion, setUbicacion] = useState<UbicacionDetallada | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!lat || !lng) {
      setError(true);
      setCargando(false);
      return;
    }

    cargarUbicacion();
  }, [lat, lng]);

  const cargarUbicacion = async () => {
    setCargando(true);
    setError(false);

    try {
      const coordenadas: Coordenadas = { lat, lng };
      const resultado = await obtenerDireccionDetallada(coordenadas);
      
      if (resultado) {
        setUbicacion(resultado);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('Error cargando ubicación:', err);
      setError(true);
    } finally {
      setCargando(false);
    }
  };

  // ESTADO: Cargando
  if (cargando) {
    return (
      <div className="flex items-center gap-2" style={{ minHeight: '20px' }}>
        <Loader className="w-3.5 h-3.5 text-slate-400 animate-spin" />
        <span style={{ 
          fontFamily: "'Exo 2', sans-serif", 
          fontSize: '11px', 
          color: '#94A3B8',
          fontStyle: 'italic'
        }}>
          Obteniendo ubicación...
        </span>
      </div>
    );
  }

  // ESTADO: Error
  if (error || !ubicacion) {
    return (
      <div className="flex items-center gap-2" style={{ minHeight: '20px' }}>
        <MapPin className="w-3.5 h-3.5 text-slate-400" />
        <span style={{ 
          fontFamily: "'Exo 2', sans-serif", 
          fontSize: '11px', 
          color: '#94A3B8'
        }}>
          Ubicación no disponible
        </span>
      </div>
    );
  }

  // ESTADO: Éxito - Formatear ubicación
  const { icono, textoCorto, textoCompleto } = formatearUbicacion(ubicacion);
  const esClienteConocido = ubicacion.tipo === 'cliente-conocido';

  return (
    <div 
      className="flex items-center gap-2 group relative" 
      style={{ minHeight: '20px' }}
      title={ubicacion.direccionCompleta}
    >
      {/* ICONO */}
      {esClienteConocido ? (
        <Factory 
          className="w-3.5 h-3.5 flex-shrink-0" 
          style={{ color: '#10B981' }}
        />
      ) : (
        <MapPin 
          className="w-3.5 h-3.5 flex-shrink-0" 
          style={{ color: '#3B82F6' }}
        />
      )}

      {/* TEXTO */}
      <div className="flex flex-col gap-0.5">
        {esClienteConocido ? (
          <>
            {/* NOMBRE DEL CLIENTE */}
            <span style={{ 
              fontFamily: "'Exo 2', sans-serif", 
              fontSize: '12px', 
              color: '#10B981',
              fontWeight: 700,
              lineHeight: '1.2'
            }}>
              {ubicacion.nombreCliente}
            </span>
            {/* MUNICIPIO, ESTADO */}
            <span style={{ 
              fontFamily: "'Exo 2', sans-serif", 
              fontSize: '10px', 
              color: '#64748B',
              lineHeight: '1.2'
            }}>
              {ubicacion.municipio}, {ubicacion.estado}
            </span>
          </>
        ) : (
          <>
            {/* MUNICIPIO, ESTADO */}
            <span style={{ 
              fontFamily: "'Exo 2', sans-serif", 
              fontSize: '11px', 
              color: '#475569',
              fontWeight: 600,
              lineHeight: '1.2'
            }}>
              {ubicacion.municipio}, {ubicacion.estado}
            </span>
            {/* REFERENCIA ADICIONAL (si existe) */}
            {ubicacion.referenciaAdicional && (
              <span style={{ 
                fontFamily: "'Exo 2', sans-serif", 
                fontSize: '10px', 
                color: '#94A3B8',
                lineHeight: '1.2',
                fontStyle: 'italic'
              }}>
                {ubicacion.referenciaAdicional}
              </span>
            )}
          </>
        )}
      </div>

      {/* TOOLTIP CON DIRECCIÓN COMPLETA (hover) */}
      {mostrarCompleto && (
        <div 
          className="absolute left-0 top-full mt-2 px-3 py-2 rounded-lg shadow-xl z-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={{
            background: '#1E293B',
            border: '1px solid #475569',
            minWidth: '250px',
            maxWidth: '350px'
          }}
        >
          <p style={{
            fontFamily: "'Exo 2', sans-serif",
            fontSize: '11px',
            color: '#E2E8F0',
            lineHeight: '1.5'
          }}>
            {ubicacion.direccionCompleta}
          </p>
        </div>
      )}
    </div>
  );
};
