import { ArrowLeft, Linkedin } from 'lucide-react';
import React from 'react';

interface ModuleTemplateProps {
  title: string;
  onBack: () => void;
  children?: React.ReactNode;
  headerImage?: string;
}

export const ModuleTemplate = ({ title, onBack, children, headerImage }: ModuleTemplateProps) => {
  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Background with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0B1220] via-[#0F172A] to-[#1E66F5]/20"></div>

      {/* Vignette ultra sutil - oscurece bordes 2-3% */}
      <div 
        className="absolute pointer-events-none"
        style={{
          top: '119px',
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(ellipse at center, transparent 0%, transparent 40%, rgba(0,0,0,0.025) 75%, rgba(0,0,0,0.03) 100%)'
        }}
      />

      {/* Spotlight de trabajo - halo suave debajo del título */}
      <div 
        className="absolute pointer-events-none"
        style={{
          top: '380px',
          left: '55%',
          transform: 'translateX(-50%)',
          width: '900px',
          height: '700px',
          background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 30%, transparent 70%)',
          filter: 'blur(60px)'
        }}
      />

      {/* Ruido fino para evitar banding */}
      <svg 
        className="absolute w-full pointer-events-none opacity-[0.03]"
        style={{
          top: '119px',
          left: 0,
          right: 0,
          bottom: 0,
          height: 'calc(100vh - 119px)'
        }}
      >
        <filter id="noiseFilter">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch"/>
          <feColorMatrix type="saturate" values="0"/>
        </filter>
        <rect width="100%" height="100%" filter="url(#noiseFilter)"/>
      </svg>

      {/* Sheen diagonal lento */}
      <div 
        className="absolute pointer-events-none"
        style={{
          top: '119px',
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.008) 50%, transparent 100%)',
          backgroundSize: '400% 400%',
          animation: 'sheen 30s ease-in-out infinite'
        }}
      />

      {/* Logo FX27 en esquina superior derecha - INAMOVIBLE */}
      <div className="absolute z-50 opacity-25 flex flex-col items-center" style={{ top: '-4px', right: '8px' }}>
        <div className="text-[80px] font-black text-white leading-none" style={{ fontFamily: 'Exo 2, sans-serif' }}>
          FX27
        </div>
        <div className="text-[16px] text-white tracking-wider mt-1" style={{ fontFamily: 'Exo 2, sans-serif' }}>
          Future Experiencie 27
        </div>
      </div>

      {/* Barra superior "glass" - Extendida hasta donde termina el logo */}
      <div 
        className="absolute top-0 left-0 right-0 z-10"
        style={{
          height: '119px',
          background: 'rgba(15, 23, 42, 0.25)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          overflow: 'hidden'
        }}
      >
        {/* Imagen de fondo tipo tecnología */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: headerImage ? `url(${headerImage})` : 'url(https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.45,
            filter: 'saturate(1.2) brightness(1.1)'
          }}
        />
        
        {/* Overlay de gradiente azul */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, rgba(30, 102, 245, 0.12) 0%, rgba(15, 23, 42, 0.25) 50%, rgba(30, 102, 245, 0.08) 100%)'
          }}
        />
      </div>

      {/* Main Content con animación de entrada */}
      <div 
        className="relative z-10 w-full h-full flex flex-col"
        style={{
          animation: 'moduleEnter 150ms ease-out',
          padding: '0 24px 0px 24px'
        }}
      >
        {/* Header - Centrado verticalmente en la franja */}
        <div className="flex items-center gap-6 relative z-20" style={{ paddingTop: '25px', marginBottom: '65px' }}>
          <button
            onClick={onBack}
            className="group flex items-center justify-center w-12 h-12 rounded-xl bg-[rgba(0,0,0,0.4)] border border-[rgba(255,255,255,0.15)] hover:bg-[rgba(30,102,245,0.25)] hover:border-[rgba(30,102,245,0.5)] transition-all duration-200 hover:scale-105"
            style={{
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)'
            }}
          >
            <ArrowLeft 
              className="w-6 h-6 transition-all duration-200" 
              style={{ 
                color: 'rgba(255, 255, 255, 0.92)',
                filter: 'drop-shadow(0 0 0 transparent)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = 'drop-shadow(0 0 8px rgba(30, 102, 245, 0.4))';
                e.currentTarget.style.color = 'rgba(255, 255, 255, 1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = 'drop-shadow(0 0 0 transparent)';
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.92)';
              }}
            />
          </button>

          <h1 
            style={{
              fontFamily: "'Exo 2', sans-serif",
              fontWeight: 600,
              fontSize: '32px',
              lineHeight: '1',
              color: 'rgba(255, 255, 255, 1)'
            }}
          >
            {title}
          </h1>
        </div>

        {/* Workstage translúcido - Panel de trabajo */}
        <div style={{ height: 'calc(100vh - 167px)' }}>
          <div 
            className="w-full h-full rounded-[18px]"
            style={{
              background: 'rgba(15, 23, 42, 0.35)',
              backdropFilter: 'blur(32px) saturate(180%)',
              WebkitBackdropFilter: 'blur(32px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.08)',
              animation: 'panelEnter 150ms ease-out'
            }}
          >
            {children || (
              <div className="p-8 flex items-center justify-center min-h-[400px]">
                <p 
                  style={{
                    fontFamily: "'Exo 2', sans-serif",
                    fontSize: '16px',
                    color: 'rgba(255, 255, 255, 0.5)'
                  }}
                >
                  Contenido del módulo
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Keyframes para animaciones */}
      <style>{`
        @keyframes sheen {
          0%, 100% { background-position: 0% 0%; }
          50% { background-position: 100% 100%; }
        }
        
        @keyframes moduleEnter {
          from { 
            opacity: 0;
            transform: translateY(8px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes panelEnter {
          from { 
            opacity: 0;
            transform: translateY(12px) scale(0.99);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};