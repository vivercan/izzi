import { useState } from 'react';
import { ArrowLeft, Shield, Activity, Users, Database } from 'lucide-react';
import { AIAssistant } from './AIAssistant';

interface DedicadosHubProps {
  onBack: () => void;
  onNavigate: (module: 'admin-carroll' | 'monitor-carroll' | 'vista-clientes-carroll') => void;
}

export const DedicadosHub = ({ onBack, onNavigate }: DedicadosHubProps) => {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  return (
    <div 
      className="w-full min-h-screen relative flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #0056B8 0%, #0B84FF 100%)',
        padding: '32px 64px'
      }}
    >
      {/* BOTÓN DE REGRESO - ESQUINA SUPERIOR IZQUIERDA */}
      <button 
        onClick={onBack} 
        className="fixed top-8 left-8 z-10 flex items-center justify-center transition-all duration-200 group cursor-pointer"
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '10px',
          background: '#151A22',
          border: '1.5px solid #2A3440',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.25)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        }}
      >
        <ArrowLeft className="w-7 h-7 text-white/70 group-hover:text-orange-400 stroke-[3] group-hover:scale-110 transition-all" />
      </button>

      {/* INDICADOR SISTEMA ACTIVO - ESQUINA SUPERIOR DERECHA */}
      <div 
        className="fixed top-8 right-8 z-10 flex items-center gap-3 px-5 py-3 rounded-lg"
        style={{
          background: '#151A22',
          border: '1.5px solid #10B981',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
        }}
      >
        <div 
          className="w-2.5 h-2.5 rounded-full"
          style={{
            background: '#10B981',
            boxShadow: '0 0 8px rgba(16, 185, 129, 0.5)'
          }}
        />
        <span style={{ 
          fontFamily: "'Inter', sans-serif", 
          fontSize: '13px', 
          fontWeight: 600, 
          color: '#FFFFFF',
          letterSpacing: '0.3px'
        }}>
          Sistema activo
        </span>
      </div>

      {/* CONTENEDOR PRINCIPAL */}
      <div 
        className="w-full"
        style={{
          maxWidth: '1400px',
          background: '#151A22',
          borderRadius: '12px',
          border: '1px solid #2A3440',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 8px 24px rgba(0, 0, 0, 0.2)',
          padding: '64px 56px'
        }}
      >
        {/* TÍTULO PRINCIPAL */}
        <div className="mb-12 text-center">
          <h1 
            style={{ 
              fontFamily: "'Inter', sans-serif", 
              fontSize: '28px', 
              fontWeight: 700, 
              letterSpacing: '2px',
              color: '#FFFFFF',
              textTransform: 'uppercase',
              marginBottom: '12px'
            }}
          >
            DEDICADOS – HUB DE GESTIÓN
          </h1>
          <div 
            style={{
              width: '120px',
              height: '2px',
              background: 'linear-gradient(90deg, transparent, #4A5568, transparent)',
              margin: '0 auto'
            }}
          />
        </div>

        {/* GRID DE 3 MÓDULOS */}
        <div className="grid grid-cols-3 gap-8 mb-10">
          
          {/* MÓDULO 1: ADMINISTRACIÓN CARROLL */}
          <button
            onClick={() => onNavigate('admin-carroll')}
            onMouseEnter={() => setHoveredCard('admin')}
            onMouseLeave={() => setHoveredCard(null)}
            className="group relative text-left transition-all duration-300"
            style={{
              background: '#10141B',
              borderRadius: '10px',
              border: hoveredCard === 'admin' ? '2px solid #1E66F5' : '2px solid rgba(30, 102, 245, 0.4)',
              boxShadow: hoveredCard === 'admin' 
                ? '0 12px 32px rgba(0, 0, 0, 0.4)' 
                : '0 6px 20px rgba(0, 0, 0, 0.25)',
              padding: '40px 32px',
              transform: hoveredCard === 'admin' ? 'translateY(-4px)' : 'translateY(0)'
            }}
          >
            {/* ICONO */}
            <div className="flex justify-center mb-8">
              <div 
                className="flex items-center justify-center"
                style={{
                  width: '64px',
                  height: '64px',
                  background: '#0A0D12',
                  border: '2px solid #1E66F5',
                  borderRadius: '10px',
                }}
              >
                <Shield className="w-7 h-7" style={{ color: '#1E66F5' }} strokeWidth={2} />
              </div>
            </div>

            {/* TÍTULO */}
            <h2 
              className="text-center mb-5"
              style={{ 
                fontFamily: "'Inter', sans-serif", 
                fontSize: '18px', 
                fontWeight: 700, 
                letterSpacing: '0.5px',
                color: '#FFFFFF',
                textTransform: 'uppercase',
                lineHeight: '1.3'
              }}
            >
              ADMINISTRACIÓN CARROLL
            </h2>

            {/* ETIQUETA PILL */}
            <div className="flex justify-center mb-8">
              <div 
                className="px-5 py-2 rounded-full"
                style={{
                  background: 'rgba(30, 102, 245, 0.12)',
                  border: '1px solid #1E66F5',
                }}
              >
                <span style={{ 
                  fontFamily: "'Inter', sans-serif", 
                  fontSize: '11px', 
                  fontWeight: 700, 
                  color: '#1E66F5', 
                  textTransform: 'uppercase', 
                  letterSpacing: '1px' 
                }}>
                  OPERACIONES
                </span>
              </div>
            </div>

            {/* BOTÓN ACCEDER */}
            <div className="flex justify-center">
              <div 
                className="rounded-lg text-center transition-all duration-300"
                style={{
                  width: '85%',
                  background: hoveredCard === 'admin' ? '#2B74FF' : '#1E66F5',
                  padding: '14px 0',
                  boxShadow: '0 4px 12px rgba(30, 102, 245, 0.3)'
                }}
              >
                <span style={{ 
                  fontFamily: "'Inter', sans-serif", 
                  fontSize: '13px', 
                  fontWeight: 700, 
                  color: '#FFFFFF', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.8px' 
                }}>
                  ACCEDER →
                </span>
              </div>
            </div>
          </button>

          {/* MÓDULO 2: MONITOR CARROLL */}
          <button
            onClick={() => onNavigate('monitor-carroll')}
            onMouseEnter={() => setHoveredCard('monitor')}
            onMouseLeave={() => setHoveredCard(null)}
            className="group relative text-left transition-all duration-300"
            style={{
              background: '#10141B',
              borderRadius: '10px',
              border: hoveredCard === 'monitor' ? '2px solid #10B981' : '2px solid rgba(16, 185, 129, 0.4)',
              boxShadow: hoveredCard === 'monitor' 
                ? '0 12px 32px rgba(0, 0, 0, 0.4)' 
                : '0 6px 20px rgba(0, 0, 0, 0.25)',
              padding: '40px 32px',
              transform: hoveredCard === 'monitor' ? 'translateY(-4px)' : 'translateY(0)'
            }}
          >
            {/* ICONO */}
            <div className="flex justify-center mb-8">
              <div 
                className="flex items-center justify-center"
                style={{
                  width: '64px',
                  height: '64px',
                  background: '#0A0D12',
                  border: '2px solid #10B981',
                  borderRadius: '10px',
                }}
              >
                <Activity className="w-7 h-7" style={{ color: '#10B981' }} strokeWidth={2} />
              </div>
            </div>

            {/* TÍTULO */}
            <h2 
              className="text-center mb-5"
              style={{ 
                fontFamily: "'Inter', sans-serif", 
                fontSize: '18px', 
                fontWeight: 700, 
                letterSpacing: '0.5px',
                color: '#FFFFFF',
                textTransform: 'uppercase',
                lineHeight: '1.3'
              }}
            >
              MONITOR CARROLL
            </h2>

            {/* ETIQUETA PILL */}
            <div className="flex justify-center mb-8">
              <div 
                className="px-5 py-2 rounded-full"
                style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid #10B981',
                }}
              >
                <span style={{ 
                  fontFamily: "'Inter', sans-serif", 
                  fontSize: '11px', 
                  fontWeight: 700, 
                  color: '#10B981', 
                  textTransform: 'uppercase', 
                  letterSpacing: '1px' 
                }}>
                  DESARROLLO
                </span>
              </div>
            </div>

            {/* BOTÓN ACCEDER */}
            <div className="flex justify-center">
              <div 
                className="rounded-lg text-center transition-all duration-300"
                style={{
                  width: '85%',
                  background: hoveredCard === 'monitor' ? '#14D89B' : '#10B981',
                  padding: '14px 0',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}
              >
                <span style={{ 
                  fontFamily: "'Inter', sans-serif", 
                  fontSize: '13px', 
                  fontWeight: 700, 
                  color: '#FFFFFF', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.8px' 
                }}>
                  ACCEDER →
                </span>
              </div>
            </div>
          </button>

          {/* MÓDULO 3: VISTA CLIENTES */}
          <button
            onClick={() => onNavigate('vista-clientes-carroll')}
            onMouseEnter={() => setHoveredCard('clientes')}
            onMouseLeave={() => setHoveredCard(null)}
            className="group relative text-left transition-all duration-300"
            style={{
              background: '#10141B',
              borderRadius: '10px',
              border: hoveredCard === 'clientes' ? '2px solid #06B6D4' : '2px solid rgba(6, 182, 212, 0.4)',
              boxShadow: hoveredCard === 'clientes' 
                ? '0 12px 32px rgba(0, 0, 0, 0.4)' 
                : '0 6px 20px rgba(0, 0, 0, 0.25)',
              padding: '40px 32px',
              transform: hoveredCard === 'clientes' ? 'translateY(-4px)' : 'translateY(0)'
            }}
          >
            {/* ICONO */}
            <div className="flex justify-center mb-8">
              <div 
                className="flex items-center justify-center"
                style={{
                  width: '64px',
                  height: '64px',
                  background: '#0A0D12',
                  border: '2px solid #06B6D4',
                  borderRadius: '10px',
                }}
              >
                <Users className="w-7 h-7" style={{ color: '#06B6D4' }} strokeWidth={2} />
              </div>
            </div>

            {/* TÍTULO */}
            <h2 
              className="text-center mb-5"
              style={{ 
                fontFamily: "'Inter', sans-serif", 
                fontSize: '18px', 
                fontWeight: 700, 
                letterSpacing: '0.5px',
                color: '#FFFFFF',
                textTransform: 'uppercase',
                lineHeight: '1.3'
              }}
            >
              VISTA CLIENTES
            </h2>

            {/* ETIQUETA PILL */}
            <div className="flex justify-center mb-8">
              <div 
                className="px-5 py-2 rounded-full"
                style={{
                  background: 'rgba(6, 182, 212, 0.12)',
                  border: '1px solid #06B6D4',
                }}
              >
                <span style={{ 
                  fontFamily: "'Inter', sans-serif", 
                  fontSize: '11px', 
                  fontWeight: 700, 
                  color: '#06B6D4', 
                  textTransform: 'uppercase', 
                  letterSpacing: '1px' 
                }}>
                  CLIENTE
                </span>
              </div>
            </div>

            {/* BOTÓN ACCEDER */}
            <div className="flex justify-center">
              <div 
                className="rounded-lg text-center transition-all duration-300"
                style={{
                  width: '85%',
                  background: hoveredCard === 'clientes' ? '#0AC9E8' : '#06B6D4',
                  padding: '14px 0',
                  boxShadow: '0 4px 12px rgba(6, 182, 212, 0.3)'
                }}
              >
                <span style={{ 
                  fontFamily: "'Inter', sans-serif", 
                  fontSize: '13px', 
                  fontWeight: 700, 
                  color: '#FFFFFF', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.8px' 
                }}>
                  ACCEDER →
                </span>
              </div>
            </div>
          </button>

        </div>

        {/* BLOQUE HISTORIAL PERPETUO */}
        <div 
          className="rounded-lg p-6 flex items-start gap-5"
          style={{
            background: '#0C1016',
            border: '1px solid #1E2530',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
          }}
        >
          {/* ICONO */}
          <div 
            className="flex items-center justify-center flex-shrink-0"
            style={{
              width: '48px',
              height: '48px',
              background: '#151A22',
              border: '1.5px solid #2A4568',
              borderRadius: '10px'
            }}
          >
            <Database className="w-6 h-6" style={{ color: '#5B9AFF' }} strokeWidth={2} />
          </div>

          {/* TEXTO */}
          <div className="flex-1">
            <p style={{ 
              fontFamily: "'Inter', sans-serif", 
              fontSize: '13px', 
              lineHeight: '1.7', 
              color: '#C2C8D2' 
            }}>
              <span style={{ fontWeight: 700, color: '#FFFFFF' }}>Historial Perpetuo:</span> Todos los viajes, eventos y documentos se almacenan de forma permanente con <span style={{ fontWeight: 600, color: '#E8EBF0' }}>trazabilidad completa</span>, auditoría total del sistema y <span style={{ fontWeight: 600, color: '#E8EBF0' }}>múltiples capas de seguridad avanzada</span>. Arquitectura diseñada para minimizar vulnerabilidades y alinearse con estándares internacionales de ciberseguridad.
            </p>
          </div>
        </div>

      </div>

      {/* ASISTENTE DE IA */}
      <AIAssistant />
    </div>
  );
};