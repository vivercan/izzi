import { ArrowLeft } from 'lucide-react';
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

      {/* Vignette ultra sutil */}
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

      {/* Spotlight de trabajo */}
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

      {/* Ruido fino premium 4% */}
      <svg 
        className="absolute w-full pointer-events-none opacity-[0.04]"
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

      {/* Logo FX27 - INAMOVIBLE */}
      <div className="absolute z-50 opacity-25 flex flex-col items-center" style={{ top: '-4px', right: '8px' }}>
        <div className="text-[80px] font-black text-white leading-none" style={{ fontFamily: 'Exo 2, sans-serif' }}>
          FX27
        </div>
        <div className="text-[16px] text-white tracking-wider mt-1" style={{ fontFamily: 'Exo 2, sans-serif' }}>
          Future Experiencie 27
        </div>
      </div>

      {/* Barra superior PREMIUM - Gradiente navy/petroleo + noise */}
      <div 
        className="absolute top-0 left-0 right-0 z-10"
        style={{
          height: '119px',
          overflow: 'hidden'
        }}
      >
        {/* Base: Gradiente oscuro navy -> petroleo */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #0a1628 0%, #0d1f35 25%, #0f2847 50%, #0a1e38 75%, #081420 100%)'
          }}
        />
        
        {/* Capa 2: Gradiente horizontal sutil para profundidad */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, rgba(15,30,56,0.9) 0%, rgba(20,45,75,0.6) 30%, rgba(15,35,60,0.7) 70%, rgba(10,20,40,0.9) 100%)'
          }}
        />

        {/* Capa 3: Acento azul muy sutil en centro */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 80% 100% at 50% 100%, rgba(59,130,246,0.08) 0%, transparent 60%)'
          }}
        />

        {/* Capa 4: Overlay oscuro homogeneizador */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, rgba(8,15,28,0.4) 0%, rgba(8,15,28,0.2) 50%, rgba(8,15,28,0.5) 100%)'
          }}
        />

        {/* Capa 5: Noise/grain premium 4% */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none">
          <filter id="headerNoise">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch"/>
            <feColorMatrix type="saturate" values="0"/>
          </filter>
          <rect width="100%" height="100%" filter="url(#headerNoise)"/>
        </svg>

        {/* Linea inferior sutil */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.2) 20%, rgba(59,130,246,0.3) 50%, rgba(59,130,246,0.2) 80%, transparent 100%)'
          }}
        />
      </div>

      {/* Main Content */}
      <div 
        className="relative z-10 w-full h-full flex flex-col"
        style={{
          animation: 'moduleEnter 150ms ease-out',
          padding: '0 24px 0px 24px'
        }}
      >
        {/* Header */}
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

        {/* Workstage */}
        <div style={{ height: 'calc(100vh - 167px)' }}>
          <div 
            className="w-full h-full rounded-[18px] overflow-hidden"
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
                <p style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '16px', color: 'rgba(255, 255, 255, 0.5)' }}>
                  Contenido del modulo
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes sheen {
          0%, 100% { background-position: 0% 0%; }
          50% { background-position: 100% 100%; }
        }
        @keyframes moduleEnter {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes panelEnter {
          from { opacity: 0; transform: translateY(12px) scale(0.99); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};
