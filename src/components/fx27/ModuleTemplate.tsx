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

      {/* Logo FX27 - COPIADO EXACTO DEL DASHBOARD */}
      <div className="absolute z-50 flex flex-col items-end" style={{ top: '13px', right: '32px' }}>
        <div
          className="text-[72px] font-black leading-none tracking-tight"
          style={{
            fontFamily: 'Exo 2, sans-serif',
            background: 'linear-gradient(135deg, #E8EEF4 0%, #B5C4D8 30%, #D8DFE8 55%, #9FB0C5 80%, #D0D9E4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(2px 0 4px rgba(160, 180, 210, 0.2)) drop-shadow(-1px 0 2px rgba(255, 255, 255, 0.1))',
          }}
        >
          FX27
        </div>
        <div
          className="text-[13px] tracking-[0.15em] mt-1 uppercase"
          style={{
            fontFamily: 'Exo 2, sans-serif',
            color: 'rgba(240, 160, 80, 0.75)',
            fontWeight: 500,
            letterSpacing: '0.25em',
            marginRight: '-3px',
            fontSize: '11px',
            filter: 'blur(0.5px) drop-shadow(0 0 8px rgba(240, 160, 80, 0.6)) drop-shadow(0 0 16px rgba(240, 160, 80, 0.4))',
          }}
        >
          Future Experience 27
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
          {/* BOTÓN NARANJA #fe5000 con flecha blanca */}
          <button
            onClick={onBack}
            className="group flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 hover:scale-105"
            style={{
              background: '#fe5000',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 4px 12px rgba(254, 80, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#cc4000';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(254, 80, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#fe5000';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(254, 80, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)';
            }}
          >
            {/* Flecha blanca usando la imagen */}
            <img 
              src="/src/flecha-correcta.png" 
              alt="Volver"
              className="w-6 h-6"
              style={{ filter: 'brightness(0) invert(1)' }}
              onError={(e) => {
                // Fallback: si no carga la imagen, usar el ícono
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  const fallback = document.createElement('div');
                  fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>';
                  parent.appendChild(fallback.firstChild as Node);
                }
              }}
            />
            {/* Fallback icon si la imagen no existe */}
            <ArrowLeft
              className="w-6 h-6 absolute"
              style={{
                color: 'white',
                opacity: 0
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
