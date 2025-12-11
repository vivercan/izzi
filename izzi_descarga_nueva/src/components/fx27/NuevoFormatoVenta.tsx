import { useState } from 'react';
import { ArrowLeft, Save, MapPin } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface NuevoFormatoVentaProps {
  onBack: () => void;
}

export const NuevoFormatoVenta = ({ onBack }: NuevoFormatoVentaProps) => {
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error', texto: string } | null>(null);
  
  const [formData, setFormData] = useState({
    convenioVenta: '',
    origen: 'ORIENTAL PUEBLA',
    destino: '',
    destinoNickname: '',
    kilometrosIda: '',
    kilometrosRegreso: '',
    ubicacionUrl: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje(null);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/formatos-venta`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...formData,
            kilometrosIda: parseFloat(formData.kilometrosIda),
            kilometrosRegreso: parseFloat(formData.kilometrosRegreso)
          })
        }
      );

      if (response.ok) {
        setMensaje({ tipo: 'success', texto: '✅ Formato guardado exitosamente' });
        // Limpiar formulario
        setFormData({
          convenioVenta: '',
          origen: 'ORIENTAL PUEBLA',
          destino: '',
          destinoNickname: '',
          kilometrosIda: '',
          kilometrosRegreso: '',
          ubicacionUrl: ''
        });
        setTimeout(() => {
          onBack();
        }, 1500);
      } else {
        setMensaje({ tipo: 'error', texto: '❌ Error al guardar el formato' });
      }
    } catch (error) {
      console.error('Error:', error);
      setMensaje({ tipo: 'error', texto: '❌ Error de conexión' });
    }
    setGuardando(false);
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0056B8 0%, #0B84FF 100%)' }}>
      {/* HEADER */}
      <div className="px-5 py-4 border-b" style={{ backgroundColor: '#0B1220', borderColor: '#1E293B' }}>
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-white" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '20px', fontWeight: 700 }}>
              NUEVO FORMATO DE VENTA
            </h1>
            <p className="text-slate-400" style={{ fontSize: '12px' }}>
              Registra un nuevo formato con todos sus detalles
            </p>
          </div>
        </div>
      </div>

      {/* FORMULARIO */}
      <div className="px-5 py-8 flex justify-center">
        <form onSubmit={handleSubmit} className="w-full" style={{ maxWidth: '800px' }}>
          <div className="bg-white rounded-xl shadow-xl p-8 border-2" style={{ borderColor: '#3B82F6' }}>
            
            {/* MENSAJE */}
            {mensaje && (
              <div 
                className="mb-6 px-4 py-3 rounded-lg"
                style={{
                  background: mensaje.tipo === 'success' ? '#D1FAE5' : '#FEE2E2',
                  border: `1.5px solid ${mensaje.tipo === 'success' ? '#10B981' : '#EF4444'}`,
                  color: mensaje.tipo === 'success' ? '#065F46' : '#991B1B',
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: '13px',
                  fontWeight: 600
                }}
              >
                {mensaje.texto}
              </div>
            )}

            <div className="grid grid-cols-2 gap-6">
              {/* CONVENIO VENTA */}
              <div>
                <label style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#0F172A',
                  display: 'block',
                  marginBottom: '8px'
                }}>
                  CONVENIO DE VENTA *
                </label>
                <input
                  type="text"
                  required
                  value={formData.convenioVenta}
                  onChange={(e) => setFormData({ ...formData, convenioVenta: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg"
                  style={{
                    fontFamily: "'Exo 2', sans-serif",
                    fontSize: '13px',
                    border: '2px solid #E2E8F0',
                    outline: 'none'
                  }}
                  placeholder="Ej: 8415"
                />
              </div>

              {/* ORIGEN */}
              <div>
                <label style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#0F172A',
                  display: 'block',
                  marginBottom: '8px'
                }}>
                  ORIGEN *
                </label>
                <select
                  required
                  value={formData.origen}
                  onChange={(e) => setFormData({ ...formData, origen: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg"
                  style={{
                    fontFamily: "'Exo 2', sans-serif",
                    fontSize: '13px',
                    border: '2px solid #E2E8F0',
                    outline: 'none'
                  }}
                >
                  <option value="ORIENTAL PUEBLA">ORIENTAL PUEBLA</option>
                  <option value="ESTADO DE CUAUTITLAN">ESTADO DE CUAUTITLAN</option>
                </select>
              </div>

              {/* DESTINO */}
              <div>
                <label style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#0F172A',
                  display: 'block',
                  marginBottom: '8px'
                }}>
                  DESTINO (ESTADO) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.destino}
                  onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg"
                  style={{
                    fontFamily: "'Exo 2', sans-serif",
                    fontSize: '13px',
                    border: '2px solid #E2E8F0',
                    outline: 'none'
                  }}
                  placeholder="Ej: PUEBLA"
                />
              </div>

              {/* DESTINO NICKNAME */}
              <div>
                <label style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#0F172A',
                  display: 'block',
                  marginBottom: '8px'
                }}>
                  DESTINO NICKNAME *
                </label>
                <input
                  type="text"
                  required
                  value={formData.destinoNickname}
                  onChange={(e) => setFormData({ ...formData, destinoNickname: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg"
                  style={{
                    fontFamily: "'Exo 2', sans-serif",
                    fontSize: '13px',
                    border: '2px solid #E2E8F0',
                    outline: 'none'
                  }}
                  placeholder="Ej: WALMART MONTERREY"
                />
              </div>

              {/* KM IDA */}
              <div>
                <label style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#0F172A',
                  display: 'block',
                  marginBottom: '8px'
                }}>
                  KILÓMETROS DE IDA *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.kilometrosIda}
                  onChange={(e) => setFormData({ ...formData, kilometrosIda: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg"
                  style={{
                    fontFamily: "'Exo 2', sans-serif",
                    fontSize: '13px',
                    border: '2px solid #E2E8F0',
                    outline: 'none'
                  }}
                  placeholder="Ej: 2267"
                />
              </div>

              {/* KM REGRESO */}
              <div>
                <label style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#0F172A',
                  display: 'block',
                  marginBottom: '8px'
                }}>
                  KILÓMETROS DE REGRESO *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.kilometrosRegreso}
                  onChange={(e) => setFormData({ ...formData, kilometrosRegreso: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg"
                  style={{
                    fontFamily: "'Exo 2', sans-serif",
                    fontSize: '13px',
                    border: '2px solid #E2E8F0',
                    outline: 'none'
                  }}
                  placeholder="Ej: 57.34"
                />
              </div>
            </div>

            {/* UBICACIÓN URL */}
            <div className="mt-6">
              <label style={{
                fontFamily: "'Exo 2', sans-serif",
                fontSize: '12px',
                fontWeight: 700,
                color: '#0F172A',
                display: 'block',
                marginBottom: '8px'
              }}>
                <MapPin className="inline w-4 h-4 mr-1" />
                URL DE UBICACIÓN (GOOGLE MAPS) *
              </label>
              <input
                type="url"
                required
                value={formData.ubicacionUrl}
                onChange={(e) => setFormData({ ...formData, ubicacionUrl: e.target.value })}
                className="w-full px-4 py-3 rounded-lg"
                style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: '13px',
                  border: '2px solid #E2E8F0',
                  outline: 'none'
                }}
                placeholder="https://www.google.com/maps?cid=..."
              />
              <p style={{ 
                fontFamily: "'Exo 2', sans-serif", 
                fontSize: '11px', 
                color: '#64748B',
                marginTop: '6px'
              }}>
                Usa enlaces cortos de Google Maps (https://maps.app.goo.gl/...)
              </p>
            </div>

            {/* BOTONES */}
            <div className="flex gap-4 mt-8">
              <button
                type="button"
                onClick={onBack}
                className="flex-1 py-3.5 rounded-lg"
                style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#64748B',
                  background: '#F1F5F9',
                  border: '2px solid #CBD5E1'
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="flex-1 py-3.5 rounded-lg flex items-center justify-center gap-2"
                style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: '14px',
                  fontWeight: 700,
                  color: 'white',
                  background: guardando ? '#94A3B8' : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  border: 'none',
                  cursor: guardando ? 'not-allowed' : 'pointer'
                }}
              >
                <Save className="w-5 h-5" />
                {guardando ? 'Guardando...' : 'Guardar Formato'}
              </button>
            </div>

            {/* UBICACIONES DE REFERENCIA */}
            <div className="mt-8 pt-6 border-t-2" style={{ borderColor: '#E2E8F0' }}>
              <h3 style={{
                fontFamily: "'Exo 2', sans-serif",
                fontSize: '13px',
                fontWeight: 700,
                color: '#0F172A',
                marginBottom: '12px'
              }}>
                📍 UBICACIONES DE REFERENCIA
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <a
                  href="https://maps.app.goo.gl/GaGDFmuzdHEG6qB57"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-lg text-center transition-all"
                  style={{
                    fontFamily: "'Exo 2', sans-serif",
                    fontSize: '11px',
                    fontWeight: 600,
                    background: '#EFF6FF',
                    border: '1px solid #3B82F6',
                    color: '#3B82F6'
                  }}
                >
                  🏭 Granjas Carroll Oriental
                </a>
                <a
                  href="https://maps.app.goo.gl/WLpurkfXM2rWgmwTA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-lg text-center transition-all"
                  style={{
                    fontFamily: "'Exo 2', sans-serif",
                    fontSize: '11px',
                    fontWeight: 600,
                    background: '#EFF6FF',
                    border: '1px solid #3B82F6',
                    color: '#3B82F6'
                  }}
                >
                  🏪 Warlo
                </a>
                <a
                  href="https://maps.app.goo.gl/jvorwgJjoV1Zx6MF7"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-lg text-center transition-all"
                  style={{
                    fontFamily: "'Exo 2', sans-serif",
                    fontSize: '11px',
                    fontWeight: 600,
                    background: '#EFF6FF',
                    border: '1px solid #3B82F6',
                    color: '#3B82F6'
                  }}
                >
                  ❄️ Frialsa Frigoríficos
                </a>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
