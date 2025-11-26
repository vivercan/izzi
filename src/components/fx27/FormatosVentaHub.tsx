import { useState } from 'react';
import { ArrowLeft, Book, Plus } from 'lucide-react';
import { CatalogoFormatosVenta } from './CatalogoFormatosVenta';
import { NuevoFormatoVenta } from './NuevoFormatoVenta';

interface FormatosVentaHubProps {
  onBack: () => void;
}

export const FormatosVentaHub = ({ onBack }: FormatosVentaHubProps) => {
  const [vistaActiva, setVistaActiva] = useState<'menu' | 'catalogo' | 'nuevo'>('menu');

  if (vistaActiva === 'catalogo') {
    return <CatalogoFormatosVenta onBack={() => setVistaActiva('menu')} />;
  }

  if (vistaActiva === 'nuevo') {
    return <NuevoFormatoVenta onBack={() => setVistaActiva('menu')} />;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0B1220' }}>
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
              FORMATOS DE VENTA - GRANJAS CARROLL
            </h1>
            <p className="text-slate-400" style={{ fontSize: '12px' }}>
              Gestión de formatos de venta y viajes
            </p>
          </div>
        </div>
      </div>

      {/* CONTENIDO - DOS BOTONES GRANDES */}
      <div className="px-5 py-12 flex items-center justify-center">
        <div className="grid grid-cols-2 gap-8" style={{ maxWidth: '1200px' }}>
          
          {/* BOTÓN CATÁLOGO */}
          <button
            onClick={() => setVistaActiva('catalogo')}
            className="group relative p-12 rounded-xl transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
              border: '2px solid #3B82F6',
              boxShadow: '0 8px 24px rgba(59, 130, 246, 0.2)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(59, 130, 246, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.2)';
            }}
          >
            <div className="flex flex-col items-center gap-6">
              <div 
                className="flex items-center justify-center rounded-xl"
                style={{
                  width: '80px',
                  height: '80px',
                  background: 'rgba(59, 130, 246, 0.15)',
                  border: '2px solid #3B82F6'
                }}
              >
                <Book className="w-10 h-10" style={{ color: '#3B82F6' }} strokeWidth={2} />
              </div>
              
              <div className="text-center">
                <h2 
                  className="mb-3"
                  style={{ 
                    fontFamily: "'Orbitron', sans-serif", 
                    fontSize: '24px', 
                    fontWeight: 700, 
                    color: '#FFFFFF',
                    letterSpacing: '0.5px'
                  }}
                >
                  CATÁLOGO DE FORMATOS DE VENTA
                </h2>
                <p style={{ 
                  fontFamily: "'Exo 2', sans-serif", 
                  fontSize: '14px', 
                  color: '#94A3B8',
                  lineHeight: '1.6'
                }}>
                  Consulta todos los formatos de venta registrados<br />
                  con destinos, kilómetros y ubicaciones
                </p>
              </div>

              <div 
                className="px-8 py-3 rounded-lg"
                style={{
                  background: '#3B82F6',
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: '14px',
                  fontWeight: 700,
                  color: 'white',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px'
                }}
              >
                Ver Catálogo →
              </div>
            </div>
          </button>

          {/* BOTÓN NUEVO FORMATO */}
          <button
            onClick={() => setVistaActiva('nuevo')}
            className="group relative p-12 rounded-xl transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
              border: '2px solid #10B981',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.2)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(16, 185, 129, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.2)';
            }}
          >
            <div className="flex flex-col items-center gap-6">
              <div 
                className="flex items-center justify-center rounded-xl"
                style={{
                  width: '80px',
                  height: '80px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '2px solid #10B981'
                }}
              >
                <Plus className="w-10 h-10" style={{ color: '#10B981' }} strokeWidth={2} />
              </div>
              
              <div className="text-center">
                <h2 
                  className="mb-3"
                  style={{ 
                    fontFamily: "'Orbitron', sans-serif", 
                    fontSize: '24px', 
                    fontWeight: 700, 
                    color: '#FFFFFF',
                    letterSpacing: '0.5px'
                  }}
                >
                  NUEVO FORMATO
                </h2>
                <p style={{ 
                  fontFamily: "'Exo 2', sans-serif", 
                  fontSize: '14px', 
                  color: '#94A3B8',
                  lineHeight: '1.6'
                }}>
                  Registra un nuevo formato de venta<br />
                  con todos sus detalles y ubicación
                </p>
              </div>

              <div 
                className="px-8 py-3 rounded-lg"
                style={{
                  background: '#10B981',
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: '14px',
                  fontWeight: 700,
                  color: 'white',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px'
                }}
              >
                Crear Nuevo →
              </div>
            </div>
          </button>

        </div>
      </div>
    </div>
  );
};
