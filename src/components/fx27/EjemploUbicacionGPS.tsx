import { useState } from 'react';
import { MapPin, Target, Navigation } from 'lucide-react';
import { UbicacionDetallada } from './UbicacionDetallada';

/**
 * COMPONENTE DE EJEMPLO: Cómo usar el sistema de ubicación detallada
 * 
 * Este componente demuestra:
 * 1. Detección automática de Granjas Carroll (radio 500m)
 * 2. Reverse Geocoding para obtener dirección completa
 * 3. Formato de ubicación con municipio y estado
 */

interface UnidadEjemplo {
  id: string;
  tracto: string;
  operador: string;
  lat: number;
  lng: number;
  estadoActual: string; // Esto es lo que muestra actualmente solo "QRO"
}

// Ejemplos de unidades con diferentes ubicaciones
const UNIDADES_EJEMPLO: UnidadEjemplo[] = [
  {
    id: '1',
    tracto: '505',
    operador: 'RAUL BAUTISTA LOPEZ',
    lat: 19.3419, // EXACTAMENTE en Granjas Carroll
    lng: -97.6664,
    estadoActual: 'Puebla' // Antes mostraba solo esto
  },
  {
    id: '2',
    tracto: '777',
    operador: 'LUIS ANGEL TAPIA RODRIGUEZ',
    lat: 19.3425, // A 100m de Granjas Carroll
    lng: -97.6670,
    estadoActual: 'Puebla'
  },
  {
    id: '3',
    tracto: '893',
    operador: 'MARCELO SANCHEZ RODRIGUEZ',
    lat: 20.5888, // Querétaro
    lng: -100.3899,
    estadoActual: 'QRO' // Solo mostraba "QRO"
  },
  {
    id: '4',
    tracto: '931',
    operador: 'MARCELO SANCHEZ RODRIGUEZ',
    lat: 19.4326, // Ciudad de México
    lng: -99.1332,
    estadoActual: 'CDMX'
  }
];

export const EjemploUbicacionGPS = () => {
  const [unidadSeleccionada, setUnidadSeleccionada] = useState<UnidadEjemplo | null>(null);

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: '#0B1220' }}>
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-white mb-2" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '24px', fontWeight: 700 }}>
            🗺️ SISTEMA DE UBICACIÓN DETALLADA
          </h1>
          <p className="text-slate-400" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px' }}>
            Detección automática de Granjas Carroll + Reverse Geocoding con Google Maps
          </p>
        </div>

        {/* INFORMACIÓN */}
        <div className="mb-6 p-6 rounded-xl border-2" style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)',
          borderColor: '#10B981'
        }}>
          <div className="flex items-start gap-4">
            <Target className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-white mb-2" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', fontWeight: 700 }}>
                🎯 GEOCERCA GRANJAS CARROLL
              </h3>
              <p className="text-slate-300 mb-3" style={{ fontSize: '13px', lineHeight: '1.6' }}>
                Coordenadas: <strong>19.3419, -97.6664</strong> • Radio: <strong>500 metros</strong>
              </p>
              <p className="text-slate-400" style={{ fontSize: '12px', lineHeight: '1.6' }}>
                ✅ Cuando una unidad está dentro del radio de 500m, automáticamente se marca como:<br />
                <strong className="text-emerald-400">"🏭 Granjas Carroll, Oriental Puebla"</strong>
              </p>
              <p className="text-slate-400 mt-2" style={{ fontSize: '12px', lineHeight: '1.6' }}>
                📍 Para otras ubicaciones, usa <strong>Google Maps Reverse Geocoding API</strong> para obtener:<br />
                • Dirección completa • Municipio • Estado • Código Postal
              </p>
            </div>
          </div>
        </div>

        {/* TABLA DE UNIDADES CON UBICACIÓN DETALLADA */}
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-slate-700 to-slate-800">
            <h2 className="text-white" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '16px', fontWeight: 700 }}>
              COMPARACIÓN: ANTES vs AHORA
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-100 border-b-2 border-slate-200">
                  <th className="px-4 py-3 text-left text-slate-700" style={{ fontSize: '11px', fontWeight: 700 }}>
                    UNIDAD
                  </th>
                  <th className="px-4 py-3 text-left text-slate-700" style={{ fontSize: '11px', fontWeight: 700 }}>
                    OPERADOR
                  </th>
                  <th className="px-4 py-3 text-left text-slate-700" style={{ fontSize: '11px', fontWeight: 700 }}>
                    COORDENADAS GPS
                  </th>
                  <th className="px-4 py-3 text-left text-slate-700" style={{ fontSize: '11px', fontWeight: 700 }}>
                    ❌ ANTES (Solo estado)
                  </th>
                  <th className="px-4 py-3 text-left text-slate-700" style={{ fontSize: '11px', fontWeight: 700 }}>
                    ✅ AHORA (Ubicación detallada)
                  </th>
                </tr>
              </thead>
              <tbody>
                {UNIDADES_EJEMPLO.map((unidad, idx) => (
                  <tr 
                    key={unidad.id} 
                    className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} border-b border-slate-100 hover:bg-blue-50 transition-colors cursor-pointer`}
                    onClick={() => setUnidadSeleccionada(unidad)}
                  >
                    <td className="px-4 py-3">
                      <div className="text-slate-900" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '14px', fontWeight: 700 }}>
                        {unidad.tracto}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-700" style={{ fontSize: '12px' }}>
                        {unidad.operador}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-slate-600" style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                        <Navigation className="w-3 h-3" />
                        {unidad.lat.toFixed(4)}, {unidad.lng.toFixed(4)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="inline-flex items-center px-3 py-1.5 rounded-lg" style={{
                        background: '#FEE2E2',
                        border: '1px solid #EF4444',
                        color: '#991B1B',
                        fontSize: '11px',
                        fontWeight: 600
                      }}>
                        ❌ {unidad.estadoActual}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <UbicacionDetallada 
                        lat={unidad.lat} 
                        lng={unidad.lng} 
                        mostrarCompleto={false}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* INSTRUCCIONES DE INTEGRACIÓN */}
        <div className="mt-8 p-6 rounded-xl border-2 border-slate-600" style={{ background: '#1E293B' }}>
          <h3 className="text-white mb-4" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '16px', fontWeight: 700 }}>
            📝 CÓMO INTEGRAR EN TUS COMPONENTES
          </h3>
          
          <div className="space-y-4">
            <div className="p-4 rounded-lg" style={{ background: '#0F172A', border: '1px solid #475569' }}>
              <p className="text-emerald-400 mb-2" style={{ fontSize: '12px', fontWeight: 700 }}>
                1. Importar el componente:
              </p>
              <code className="text-slate-300" style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                import {'{ UbicacionDetallada }'} from './components/fx27/UbicacionDetallada';
              </code>
            </div>

            <div className="p-4 rounded-lg" style={{ background: '#0F172A', border: '1px solid #475569' }}>
              <p className="text-emerald-400 mb-2" style={{ fontSize: '12px', fontWeight: 700 }}>
                2. Usar en tu tabla o componente:
              </p>
              <code className="text-slate-300 block" style={{ fontSize: '11px', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                {`<UbicacionDetallada 
  lat={unidad.lat} 
  lng={unidad.lng} 
  mostrarCompleto={true}
  onUbicacionCargada={(ubicacion) => {
    console.log('Ubicación cargada:', ubicacion);
    // Aquí puedes guardar la ubicación en estado
  }}
/>`}
              </code>
            </div>

            <div className="p-4 rounded-lg" style={{ background: '#0F172A', border: '1px solid #475569' }}>
              <p className="text-emerald-400 mb-2" style={{ fontSize: '12px', fontWeight: 700 }}>
                3. O usar las funciones de utilidad directamente:
              </p>
              <code className="text-slate-300 block" style={{ fontSize: '11px', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                {`import { 
  estaEnGranjasCarroll, 
  calcularDistancia,
  obtenerUbicacionDetallada 
} from '../../utils/geocoding';

// Verificar si está en Granjas Carroll
const enGranjas = estaEnGranjasCarroll({ lat: 19.3419, lng: -97.6664 });

// Obtener ubicación detallada
const ubicacion = await obtenerUbicacionDetallada(
  { lat, lng }, 
  googleMapsApiKey
);`}
              </code>
            </div>
          </div>
        </div>

        {/* NOTA IMPORTANTE */}
        <div className="mt-6 p-4 rounded-lg" style={{ background: '#FEF3C7', border: '2px solid #F59E0B' }}>
          <p className="text-amber-900" style={{ fontSize: '12px', lineHeight: '1.6' }}>
            ⚠️ <strong>IMPORTANTE:</strong> Este sistema usa Google Maps Geocoding API. Asegúrate de tener habilitada la API en tu proyecto de Google Cloud y que tu API Key tenga los permisos necesarios.
          </p>
        </div>
      </div>
    </div>
  );
};
