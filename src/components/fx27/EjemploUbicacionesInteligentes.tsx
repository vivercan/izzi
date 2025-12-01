import { UbicacionInteligenteCompacta } from './UbicacionInteligenteCompacta';
import { ArrowLeft } from 'lucide-react';

interface EjemploUbicacionesInteligentesProps {
  onBack?: () => void;
}

export const EjemploUbicacionesInteligentes = ({ onBack }: EjemploUbicacionesInteligentesProps) => {
  // Ubicaciones de prueba
  const ejemplos = [
    {
      nombre: 'Granjas Carroll (origen)',
      lat: 19.3419,
      lng: -97.6664,
      descripcion: 'Debe detectarse como "Granjas Carroll" (radio 500m)'
    },
    {
      nombre: 'Querétaro centro',
      lat: 20.5888,
      lng: -100.3899,
      descripcion: 'Ubicación genérica: Municipio, Estado'
    },
    {
      nombre: 'CDMX - Iztapalapa',
      lat: 19.3568,
      lng: -99.0588,
      descripcion: 'Ubicación genérica con colonia/calle'
    },
    {
      nombre: 'Monterrey centro',
      lat: 25.6866,
      lng: -100.3161,
      descripcion: 'Ubicación genérica del norte'
    },
    {
      nombre: 'Puebla centro',
      lat: 19.0414,
      lng: -98.2063,
      descripcion: 'Ubicación genérica cercana a Oriental'
    }
  ];

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: '#0B1220' }}>
      {/* BOTÓN DE REGRESO */}
      {onBack && (
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
          style={{
            background: '#1E293B',
            border: '1.5px solid #475569',
            color: '#E2E8F0'
          }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 600 }}>
            Regresar
          </span>
        </button>
      )}

      <div className="max-w-5xl mx-auto">
        {/* HEADER */}
        <div className="mb-8 text-center">
          <h1 className="text-white mb-3" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '28px', fontWeight: 700 }}>
            🗺️ SISTEMA DE UBICACIONES INTELIGENTES
          </h1>
          <p className="text-slate-400 mb-6" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px' }}>
            Detección automática de clientes conocidos (100m) y ubicaciones genéricas con geocodificación
          </p>

          {/* BADGES INFORMATIVOS */}
          <div className="flex justify-center gap-4 mb-8">
            <div className="px-4 py-2 rounded-lg" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10B981' }}>
              <span style={{ color: '#10B981', fontSize: '12px', fontWeight: 600 }}>
                🏭 Granjas Carroll: 500m
              </span>
            </div>
            <div className="px-4 py-2 rounded-lg" style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid #3B82F6' }}>
              <span style={{ color: '#3B82F6', fontSize: '12px', fontWeight: 600 }}>
                📍 Otros clientes: 100m
              </span>
            </div>
          </div>
        </div>

        {/* TABLA DE EJEMPLOS */}
        <div className="rounded-xl overflow-hidden" style={{ border: '1.5px solid #1E293B' }}>
          {/* HEADER DE TABLA */}
          <div 
            className="grid grid-cols-12 gap-4 px-6 py-3"
            style={{ background: '#1E293B' }}
          >
            <div className="col-span-3">
              <span style={{ color: '#E2E8F0', fontSize: '11px', fontWeight: 700, fontFamily: "'Exo 2', sans-serif" }}>
                UBICACIÓN DE PRUEBA
              </span>
            </div>
            <div className="col-span-2">
              <span style={{ color: '#E2E8F0', fontSize: '11px', fontWeight: 700, fontFamily: "'Exo 2', sans-serif" }}>
                COORDENADAS
              </span>
            </div>
            <div className="col-span-4">
              <span style={{ color: '#E2E8F0', fontSize: '11px', fontWeight: 700, fontFamily: "'Exo 2', sans-serif" }}>
                RESULTADO DETECTADO
              </span>
            </div>
            <div className="col-span-3">
              <span style={{ color: '#E2E8F0', fontSize: '11px', fontWeight: 700, fontFamily: "'Exo 2', sans-serif" }}>
                COMPORTAMIENTO ESPERADO
              </span>
            </div>
          </div>

          {/* FILAS DE DATOS */}
          {ejemplos.map((ejemplo, index) => (
            <div
              key={index}
              className="grid grid-cols-12 gap-4 px-6 py-4 items-center"
              style={{
                background: index % 2 === 0 ? '#0F1729' : '#0B1220',
                borderTop: '1px solid #1E293B'
              }}
            >
              {/* NOMBRE */}
              <div className="col-span-3">
                <span style={{ 
                  color: '#F1F5F9', 
                  fontSize: '12px', 
                  fontWeight: 600, 
                  fontFamily: "'Exo 2', sans-serif" 
                }}>
                  {ejemplo.nombre}
                </span>
              </div>

              {/* COORDENADAS */}
              <div className="col-span-2">
                <code style={{ 
                  color: '#94A3B8', 
                  fontSize: '10px', 
                  fontFamily: 'monospace',
                  display: 'block',
                  lineHeight: '1.4'
                }}>
                  {ejemplo.lat.toFixed(4)}<br/>
                  {ejemplo.lng.toFixed(4)}
                </code>
              </div>

              {/* RESULTADO (COMPONENTE) */}
              <div className="col-span-4">
                <UbicacionInteligenteCompacta 
                  lat={ejemplo.lat} 
                  lng={ejemplo.lng}
                  mostrarCompleto={true}
                />
              </div>

              {/* DESCRIPCIÓN */}
              <div className="col-span-3">
                <span style={{ 
                  color: '#64748B', 
                  fontSize: '10px', 
                  fontStyle: 'italic',
                  fontFamily: "'Exo 2', sans-serif",
                  lineHeight: '1.4'
                }}>
                  {ejemplo.descripcion}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* INFORMACIÓN TÉCNICA */}
        <div className="mt-8 p-6 rounded-xl" style={{ background: '#1E293B', border: '1.5px solid #475569' }}>
          <h3 className="text-white mb-4" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '16px', fontWeight: 700 }}>
            📊 Información del Sistema
          </h3>
          <div className="space-y-3 text-slate-300" style={{ fontSize: '13px', lineHeight: '1.7', fontFamily: "'Exo 2', sans-serif" }}>
            <p>
              <strong className="text-white">1. Granjas Carroll (Origen):</strong> Radio de 500 metros. Se detecta con prioridad máxima.
            </p>
            <p>
              <strong className="text-white">2. Clientes Conocidos (Destinos):</strong> Radio de 100 metros. Cargados automáticamente desde el catálogo de 84 formatos de venta con 71 destinos únicos.
            </p>
            <p>
              <strong className="text-white">3. Ubicaciones Genéricas:</strong> Cuando no está cerca de ningún cliente conocido, muestra: Municipio, Estado + referencia adicional (colonia/calle).
            </p>
            <p>
              <strong className="text-white">4. Caché Inteligente:</strong> Los clientes conocidos se cachean por 5 minutos para optimizar rendimiento.
            </p>
            <p>
              <strong className="text-white">5. API Utilizada:</strong> Google Maps Geocoding API (geocodificación inversa: coordenadas → dirección).
            </p>
          </div>
        </div>

        {/* CÓMO USAR */}
        <div className="mt-6 p-6 rounded-xl" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1.5px solid #10B981' }}>
          <h3 className="text-emerald-400 mb-4" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '16px', fontWeight: 700 }}>
            💻 Cómo Usar en Código
          </h3>
          <code className="block px-4 py-3 rounded-lg text-emerald-100" style={{ 
            background: '#0F1729',
            fontSize: '12px',
            fontFamily: 'monospace',
            lineHeight: '1.6',
            whiteSpace: 'pre-wrap'
          }}>
{`import { UbicacionInteligenteCompacta } from './components/fx27/UbicacionInteligenteCompacta';

// En tu tabla de unidades:
<UbicacionInteligenteCompacta 
  lat={unidad.lat}  // Del GPS de la unidad
  lng={unidad.lng}
  mostrarCompleto={true}  // Muestra tooltip con dirección completa al hacer hover
/>`}
          </code>
        </div>
      </div>
    </div>
  );
};
