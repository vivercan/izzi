import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Loader, Key, MapPin, ExternalLink } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface ResultadoPrueba {
  estado: 'cargando' | 'exito' | 'error' | 'sin-api-key';
  mensaje: string;
  detalles?: string;
  codigoError?: string;
  direccionObtenida?: string;
}

export const VerificadorGoogleMapsAPI = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [resultado, setResultado] = useState<ResultadoPrueba>({
    estado: 'cargando',
    mensaje: 'Verificando configuración...'
  });

  useEffect(() => {
    verificarAPI();
  }, []);

  const verificarAPI = async () => {
    setResultado({
      estado: 'cargando',
      mensaje: 'Obteniendo API Key de Supabase...'
    });

    try {
      // 1. Obtener API Key de Supabase
      const responseKey = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/api-keys/google-maps`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );

      if (!responseKey.ok) {
        setResultado({
          estado: 'error',
          mensaje: '❌ Error al obtener API Key desde Supabase',
          detalles: 'No se pudo conectar al servidor. Verifica que el backend esté funcionando.'
        });
        return;
      }

      const dataKey = await responseKey.json();
      const key = dataKey.apiKey;
      setApiKey(key);

      if (!key || key === '') {
        setResultado({
          estado: 'sin-api-key',
          mensaje: '⚠️ API Key de Google Maps NO configurada',
          detalles: 'La variable de entorno GOOGLE_MAPS_API_KEY está vacía en Supabase.'
        });
        return;
      }

      // 2. Probar Geocoding API con coordenadas de Granjas Carroll
      setResultado({
        estado: 'cargando',
        mensaje: 'Probando Geocoding API con coordenadas de Granjas Carroll...'
      });

      const lat = 19.3419;
      const lng = -97.6664;
      const urlGeocode = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${key}&language=es`;

      const responseGeocode = await fetch(urlGeocode);
      const dataGeocode = await responseGeocode.json();

      console.log('Respuesta Geocoding API:', dataGeocode);

      // 3. Analizar respuesta
      if (dataGeocode.status === 'OK') {
        const direccion = dataGeocode.results[0]?.formatted_address || 'Dirección no disponible';
        setResultado({
          estado: 'exito',
          mensaje: '✅ ¡Google Maps Geocoding API funciona correctamente!',
          detalles: 'Tu API Key está configurada y Geocoding API está habilitada.',
          direccionObtenida: direccion
        });
      } else if (dataGeocode.status === 'REQUEST_DENIED') {
        const errorMessage = dataGeocode.error_message || 'No se proporcionó mensaje de error';
        setResultado({
          estado: 'error',
          mensaje: '🚫 REQUEST_DENIED - Geocoding API NO está habilitada',
          detalles: errorMessage,
          codigoError: dataGeocode.status
        });
      } else if (dataGeocode.status === 'OVER_QUERY_LIMIT') {
        setResultado({
          estado: 'error',
          mensaje: '⚠️ OVER_QUERY_LIMIT - Límite de consultas excedido',
          detalles: 'Has excedido el límite gratuito de 40,000 solicitudes/mes. Agrega un método de pago en Google Cloud.',
          codigoError: dataGeocode.status
        });
      } else {
        setResultado({
          estado: 'error',
          mensaje: `❌ Error en Geocoding API: ${dataGeocode.status}`,
          detalles: dataGeocode.error_message || 'Error desconocido',
          codigoError: dataGeocode.status
        });
      }
    } catch (error) {
      console.error('Error en verificación:', error);
      setResultado({
        estado: 'error',
        mensaje: '❌ Error de conexión',
        detalles: error instanceof Error ? error.message : 'Error desconocido al verificar la API'
      });
    }
  };

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: '#0B1220' }}>
      <div className="max-w-4xl mx-auto">
        
        {/* HEADER */}
        <div className="mb-8 text-center">
          <h1 className="text-white mb-3" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '28px', fontWeight: 700 }}>
            🔍 VERIFICADOR DE GOOGLE MAPS API
          </h1>
          <p className="text-slate-400" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px' }}>
            Diagnóstico completo de Geocoding API para ubicaciones detalladas
          </p>
        </div>

        {/* TARJETA DE RESULTADO */}
        <div 
          className="rounded-2xl overflow-hidden shadow-2xl mb-6"
          style={{
            background: resultado.estado === 'exito' ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)' :
                       resultado.estado === 'error' ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)' :
                       resultado.estado === 'sin-api-key' ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.05) 100%)' :
                       'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)',
            border: `2px solid ${
              resultado.estado === 'exito' ? '#10B981' :
              resultado.estado === 'error' ? '#EF4444' :
              resultado.estado === 'sin-api-key' ? '#F59E0B' :
              '#3B82F6'
            }`
          }}
        >
          <div 
            className="px-8 py-6"
            style={{
              background: resultado.estado === 'exito' ? '#10B981' :
                         resultado.estado === 'error' ? '#EF4444' :
                         resultado.estado === 'sin-api-key' ? '#F59E0B' :
                         '#3B82F6'
            }}
          >
            <div className="flex items-center gap-4">
              {resultado.estado === 'cargando' && <Loader className="w-8 h-8 text-white animate-spin" />}
              {resultado.estado === 'exito' && <CheckCircle className="w-8 h-8 text-white" />}
              {resultado.estado === 'error' && <XCircle className="w-8 h-8 text-white" />}
              {resultado.estado === 'sin-api-key' && <AlertTriangle className="w-8 h-8 text-white" />}
              
              <div className="flex-1">
                <h2 className="text-white" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '20px', fontWeight: 700 }}>
                  {resultado.mensaje}
                </h2>
                {resultado.codigoError && (
                  <p className="text-white opacity-80 mt-1" style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                    Código: {resultado.codigoError}
                  </p>
                )}
              </div>

              <button
                onClick={verificarAPI}
                className="px-6 py-3 rounded-lg transition-all"
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '1.5px solid rgba(255, 255, 255, 0.5)',
                  color: 'white',
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: '13px',
                  fontWeight: 700
                }}
              >
                🔄 Verificar de Nuevo
              </button>
            </div>
          </div>

          <div className="px-8 py-6 bg-white">
            {resultado.detalles && (
              <div className="mb-4">
                <p style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', color: '#475569', lineHeight: '1.6' }}>
                  {resultado.detalles}
                </p>
              </div>
            )}

            {resultado.direccionObtenida && (
              <div className="p-4 rounded-lg mb-4" style={{ background: '#F0FDF4', border: '1.5px solid #10B981' }}>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-emerald-900 mb-1" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px', fontWeight: 700 }}>
                      📍 DIRECCIÓN OBTENIDA (Granjas Carroll):
                    </p>
                    <p className="text-emerald-800" style={{ fontSize: '13px', lineHeight: '1.5' }}>
                      {resultado.direccionObtenida}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* API KEY INFO */}
            {apiKey && (
              <div className="p-4 rounded-lg mb-4" style={{ background: '#F8FAFC', border: '1.5px solid #CBD5E1' }}>
                <div className="flex items-start gap-3">
                  <Key className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-slate-700 mb-2" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px', fontWeight: 700 }}>
                      🔑 API KEY DETECTADA:
                    </p>
                    <code className="block px-3 py-2 rounded text-slate-900 break-all" style={{ 
                      fontSize: '11px', 
                      fontFamily: 'monospace',
                      background: '#E2E8F0'
                    }}>
                      {apiKey.substring(0, 15)}...{apiKey.substring(apiKey.length - 10)}
                    </code>
                  </div>
                </div>
              </div>
            )}

            {/* INSTRUCCIONES SEGÚN EL ESTADO */}
            {resultado.estado === 'error' && resultado.codigoError === 'REQUEST_DENIED' && (
              <div className="mt-6 p-6 rounded-xl" style={{ background: '#FEF3C7', border: '2px solid #F59E0B' }}>
                <h3 className="text-amber-900 mb-4 flex items-center gap-2" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '16px', fontWeight: 700 }}>
                  <AlertTriangle className="w-5 h-5" />
                  🔧 SOLUCIÓN: Habilitar Geocoding API
                </h3>
                <ol className="space-y-3 text-amber-900" style={{ fontSize: '13px', lineHeight: '1.6' }}>
                  <li className="flex gap-3">
                    <span className="font-bold flex-shrink-0">1.</span>
                    <div>
                      Ve a <strong>Google Cloud Console</strong>:
                      <a 
                        href="https://console.cloud.google.com/apis/library/geocoding-backend.googleapis.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 mt-2 px-4 py-2 rounded-lg transition-all inline-flex"
                        style={{ background: '#F59E0B', color: 'white', fontWeight: 600 }}
                      >
                        Abrir Google Cloud Console
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold flex-shrink-0">2.</span>
                    <span>Asegúrate de tener seleccionado el proyecto correcto (donde está tu API Key)</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold flex-shrink-0">3.</span>
                    <span>Haz clic en el botón azul <strong>"ENABLE"</strong> (Habilitar)</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold flex-shrink-0">4.</span>
                    <span>Espera 1-2 minutos y haz clic en <strong>"🔄 Verificar de Nuevo"</strong> arriba</span>
                  </li>
                </ol>
              </div>
            )}

            {resultado.estado === 'sin-api-key' && (
              <div className="mt-6 p-6 rounded-xl" style={{ background: '#FEF3C7', border: '2px solid #F59E0B' }}>
                <h3 className="text-amber-900 mb-4 flex items-center gap-2" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '16px', fontWeight: 700 }}>
                  <AlertTriangle className="w-5 h-5" />
                  🔧 SOLUCIÓN: Configurar API Key en Supabase
                </h3>
                <ol className="space-y-3 text-amber-900" style={{ fontSize: '13px', lineHeight: '1.6' }}>
                  <li className="flex gap-3">
                    <span className="font-bold flex-shrink-0">1.</span>
                    <span>Ve a tu proyecto en <strong>Google Cloud Console</strong> → <strong>APIs & Services</strong> → <strong>Credentials</strong></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold flex-shrink-0">2.</span>
                    <span>Copia tu API Key de Google Maps</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold flex-shrink-0">3.</span>
                    <span>Ve a <strong>Supabase</strong> → <strong>Project Settings</strong> → <strong>Edge Functions</strong> → <strong>Environment Variables</strong></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold flex-shrink-0">4.</span>
                    <span>Agrega variable: <code style={{ background: '#FCD34D', padding: '2px 6px', borderRadius: '4px' }}>GOOGLE_MAPS_API_KEY</code> con el valor de tu API Key</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold flex-shrink-0">5.</span>
                    <span>Haz clic en <strong>"🔄 Verificar de Nuevo"</strong> arriba</span>
                  </li>
                </ol>
              </div>
            )}

            {resultado.estado === 'exito' && (
              <div className="mt-6 p-6 rounded-xl" style={{ background: '#ECFDF5', border: '2px solid #10B981' }}>
                <h3 className="text-emerald-900 mb-4 flex items-center gap-2" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '16px', fontWeight: 700 }}>
                  <CheckCircle className="w-5 h-5" />
                  ✅ ¡TODO LISTO! Ahora puedes usar:
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-emerald-800 mb-2" style={{ fontSize: '13px', fontWeight: 600 }}>
                      1. Componente de Ubicación Detallada:
                    </p>
                    <code className="block px-4 py-3 rounded text-emerald-900" style={{ 
                      fontSize: '12px', 
                      fontFamily: 'monospace',
                      background: '#D1FAE5',
                      whiteSpace: 'pre-wrap'
                    }}>
{`<UbicacionDetallada 
  lat={19.3419} 
  lng={-97.6664} 
/>`}
                    </code>
                  </div>
                  <div>
                    <p className="text-emerald-800 mb-2" style={{ fontSize: '13px', fontWeight: 600 }}>
                      2. Ver ejemplo completo:
                    </p>
                    <p className="text-emerald-700" style={{ fontSize: '12px' }}>
                      Revisa <code style={{ background: '#D1FAE5', padding: '2px 6px', borderRadius: '4px' }}>/components/fx27/EjemploUbicacionGPS.tsx</code>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* INFORMACIÓN ADICIONAL */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-lg" style={{ background: '#1E293B', border: '1px solid #475569' }}>
            <div className="text-slate-400 mb-1" style={{ fontSize: '11px', fontWeight: 600 }}>
              Prueba con:
            </div>
            <div className="text-white" style={{ fontSize: '13px', fontWeight: 700 }}>
              Granjas Carroll
            </div>
            <div className="text-slate-500 mt-1" style={{ fontSize: '10px', fontFamily: 'monospace' }}>
              19.3419, -97.6664
            </div>
          </div>

          <div className="p-4 rounded-lg" style={{ background: '#1E293B', border: '1px solid #475569' }}>
            <div className="text-slate-400 mb-1" style={{ fontSize: '11px', fontWeight: 600 }}>
              API utilizada:
            </div>
            <div className="text-white" style={{ fontSize: '13px', fontWeight: 700 }}>
              Geocoding API
            </div>
            <div className="text-slate-500 mt-1" style={{ fontSize: '10px' }}>
              Google Maps Platform
            </div>
          </div>

          <div className="p-4 rounded-lg" style={{ background: '#1E293B', border: '1px solid #475569' }}>
            <div className="text-slate-400 mb-1" style={{ fontSize: '11px', fontWeight: 600 }}>
              Límite gratuito:
            </div>
            <div className="text-white" style={{ fontSize: '13px', fontWeight: 700 }}>
              40,000 / mes
            </div>
            <div className="text-slate-500 mt-1" style={{ fontSize: '10px' }}>
              Después: $0.005/solicitud
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};