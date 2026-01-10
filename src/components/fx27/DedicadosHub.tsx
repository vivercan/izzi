import { useState, useEffect } from 'react';
import { ArrowLeft, Shield, Eye, ChevronRight, Truck, Activity, Clock, MapPin, Zap } from 'lucide-react';

interface DedicadosHubProps {
  onBack: () => void;
  onNavigate: (module: 'admin-carroll' | 'vista-clientes-carroll') => void;
}

export const DedicadosHub = ({ onBack, onNavigate }: DedicadosHubProps) => {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const modules = [
    {
      id: 'admin',
      title: 'ADMINISTRACION',
      subtitle: 'CARROLL',
      description: 'Gestion de viajes, asignacion de unidades, control de flota y operaciones',
      icon: Shield,
      badge: 'OPERACIONES',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      cardBg: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(37,99,235,0.05) 100%)',
      borderColor: 'rgba(59,130,246,0.3)',
      glowColor: 'rgba(59,130,246,0.2)',
      route: 'admin-carroll' as const,
      features: ['Asignar viajes', 'Gestionar flota', 'Finalizar entregas']
    },
    {
      id: 'cliente',
      title: 'VISTA CLIENTE',
      subtitle: 'TORRE DE CONTROL',
      description: 'Monitoreo en tiempo real, ubicacion GPS y estatus de entregas',
      icon: Eye,
      badge: 'CLIENTE',
      gradient: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
      cardBg: 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(20,184,166,0.05) 100%)',
      borderColor: 'rgba(16,185,129,0.3)',
      glowColor: 'rgba(16,185,129,0.2)',
      route: 'vista-clientes-carroll' as const,
      features: ['GPS en vivo', 'Estatus ETA', 'Solo lectura']
    }
  ];

  return (
    <div className="w-full min-h-screen relative overflow-hidden" style={{ background: '#0a0f1a' }}>
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] rounded-full blur-[150px]"
          style={{ background: 'rgba(59,130,246,0.08)' }}
        />
        <div 
          className="absolute bottom-[-25%] right-[-15%] w-[600px] h-[600px] rounded-full blur-[130px]"
          style={{ background: 'rgba(16,185,129,0.08)' }}
        />
        <div 
          className="absolute top-[30%] right-[10%] w-[400px] h-[400px] rounded-full blur-[100px]"
          style={{ background: 'rgba(249,115,22,0.05)' }}
        />
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 group"
            style={{ 
              background: 'rgba(255,255,255,0.05)', 
              border: '1px solid rgba(255,255,255,0.1)' 
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
            }}
          >
            <ArrowLeft size={18} className="text-gray-400 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium text-gray-400">Volver</span>
          </button>

          <div className="flex items-center gap-3">
            <div 
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <Clock size={14} className="text-gray-500" />
              <span className="text-gray-400 text-sm">
                {currentTime.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div 
              className="flex items-center gap-2 px-4 py-2 rounded-xl"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}
            >
              <div className="relative">
                <div className="w-2 h-2 rounded-full" style={{ background: '#34d399' }} />
                <div className="absolute inset-0 w-2 h-2 rounded-full animate-ping" style={{ background: '#34d399' }} />
              </div>
              <span style={{ color: '#34d399' }} className="text-sm font-medium">Sistema activo</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-6 py-8 md:py-12">
        <div className="max-w-6xl mx-auto">
          {/* Title Section */}
          <div className="text-center mb-12 md:mb-16">
            <div 
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
              style={{ 
                background: 'linear-gradient(135deg, rgba(249,115,22,0.2) 0%, rgba(249,115,22,0.1) 100%)',
                border: '1px solid rgba(249,115,22,0.3)'
              }}
            >
              <Truck size={14} style={{ color: '#fb923c' }} />
              <span style={{ color: '#fb923c' }} className="text-xs font-bold tracking-wider">GRANJAS CARROLL</span>
              <div className="w-1 h-1 rounded-full" style={{ background: 'rgba(249,115,22,0.5)' }} />
              <span style={{ color: 'rgba(249,115,22,0.7)' }} className="text-xs">DEDICADOS</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
              HUB DE
              <span 
                className="ml-3"
                style={{ 
                  background: 'linear-gradient(135deg, #60a5fa 0%, #34d399 50%, #2dd4bf 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                GESTION
              </span>
            </h1>
            
            <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
              Control integral de flota dedicada con monitoreo GPS en tiempo real
            </p>
            
            {/* Stats */}
            <div 
              className="inline-flex items-center gap-1 p-1 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              {[
                { value: '32', label: 'Unidades', color: '#fff', icon: Truck },
                { value: '28', label: 'En Viaje', color: '#34d399', icon: Activity },
                { value: '102', label: 'Rutas', color: '#60a5fa', icon: MapPin },
              ].map((stat, idx) => (
                <div key={idx} className="flex items-center">
                  <div className="flex items-center gap-3 px-5 py-3">
                    <stat.icon size={18} style={{ color: stat.color, opacity: 0.5 }} />
                    <div className="text-left">
                      <div className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
                      <div className="text-xs text-gray-500">{stat.label}</div>
                    </div>
                  </div>
                  {idx < 2 && <div className="w-px h-10" style={{ background: 'rgba(255,255,255,0.1)' }} />}
                </div>
              ))}
            </div>
          </div>

          {/* Module Cards */}
          <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
            {modules.map((module) => {
              const isHovered = hoveredCard === module.id;
              return (
                <button
                  key={module.id}
                  onClick={() => onNavigate(module.route)}
                  onMouseEnter={() => setHoveredCard(module.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  className="group relative overflow-hidden rounded-3xl p-6 md:p-8 text-left transition-all duration-500"
                  style={{
                    background: module.cardBg,
                    border: `1px solid ${module.borderColor}`,
                    transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                    boxShadow: isHovered ? `0 25px 50px -12px ${module.glowColor}` : 'none'
                  }}
                >
                  {/* Glow effect on hover */}
                  <div 
                    className="absolute inset-0 transition-opacity duration-700"
                    style={{ 
                      opacity: isHovered ? 1 : 0,
                      background: module.cardBg
                    }}
                  />
                  <div 
                    className="absolute top-0 left-0 w-full h-px"
                    style={{ 
                      background: `linear-gradient(90deg, transparent, ${module.borderColor}, transparent)`,
                      opacity: isHovered ? 1 : 0,
                      transition: 'opacity 0.3s'
                    }}
                  />
                  
                  {/* Icon */}
                  <div 
                    className="relative z-10 w-16 h-16 md:w-18 md:h-18 rounded-2xl mb-6 flex items-center justify-center transition-all duration-500"
                    style={{ 
                      background: module.gradient,
                      transform: isHovered ? 'scale(1.1) rotate(3deg)' : 'scale(1)',
                      boxShadow: `0 10px 30px -10px ${module.glowColor}`
                    }}
                  >
                    <module.icon size={28} className="text-white" />
                  </div>

                  {/* Badge */}
                  <div 
                    className="relative z-10 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider mb-4 text-white"
                    style={{ background: module.gradient, boxShadow: `0 4px 15px -3px ${module.glowColor}` }}
                  >
                    <Zap size={10} />
                    {module.badge}
                  </div>

                  {/* Title */}
                  <h2 
                    className="relative z-10 text-2xl md:text-3xl font-bold text-white mb-1 transition-transform"
                    style={{ transform: isHovered ? 'translateX(4px)' : 'translateX(0)' }}
                  >
                    {module.title}
                  </h2>
                  <h3 className="relative z-10 text-base md:text-lg text-gray-400 mb-4">
                    {module.subtitle}
                  </h3>

                  {/* Description */}
                  <p className="relative z-10 text-gray-500 text-sm mb-6 leading-relaxed">
                    {module.description}
                  </p>

                  {/* Features */}
                  <div className="relative z-10 flex flex-wrap gap-2 mb-6">
                    {module.features.map((feature, fidx) => (
                      <span 
                        key={fidx}
                        className="px-2 py-1 rounded-lg text-gray-400 text-xs"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)' }}
                      >
                        {feature}
                      </span>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <div 
                    className="relative z-10 flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-white font-semibold text-sm overflow-hidden"
                    style={{ background: module.gradient, boxShadow: `0 10px 30px -10px ${module.glowColor}` }}
                  >
                    <span className="relative z-10">ACCEDER</span>
                    <ChevronRight 
                      size={18} 
                      className="relative z-10 transition-transform"
                      style={{ transform: isHovered ? 'translateX(4px)' : 'translateX(0)' }}
                    />
                    <div 
                      className="absolute inset-0 transition-transform duration-700"
                      style={{ 
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                        transform: isHovered ? 'translateX(100%)' : 'translateX(-100%)'
                      }}
                    />
                  </div>

                  {/* Corner decoration */}
                  <div 
                    className="absolute top-0 right-0 w-40 h-40 rounded-bl-full transition-all duration-500"
                    style={{ 
                      background: module.gradient,
                      opacity: 0.08,
                      width: isHovered ? '192px' : '160px',
                      height: isHovered ? '192px' : '160px'
                    }}
                  />
                </button>
              );
            })}
          </div>

          {/* Info Banner */}
          <div className="mt-12 md:mt-16 max-w-4xl mx-auto">
            <div 
              className="relative overflow-hidden rounded-2xl p-5 md:p-6"
              style={{ 
                background: 'linear-gradient(135deg, rgba(30,41,59,0.4) 0%, rgba(15,23,42,0.4) 100%)',
                border: '1px solid rgba(255,255,255,0.05)'
              }}
            >
              <div className="flex items-start gap-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ 
                    background: 'linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(16,185,129,0.2) 100%)',
                    border: '1px solid rgba(59,130,246,0.2)'
                  }}
                >
                  <Activity size={22} style={{ color: '#60a5fa' }} />
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-semibold mb-1 flex items-center gap-2">
                    Historial Perpetuo
                    <span 
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{ background: 'rgba(16,185,129,0.2)', color: '#34d399' }}
                    >
                      ACTIVO
                    </span>
                  </h4>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Todos los viajes, eventos y documentos se almacenan de forma permanente con 
                    <span className="text-white font-medium"> trazabilidad completa</span>, 
                    auditoria total del sistema y 
                    <span className="text-white font-medium"> multiples capas de seguridad avanzada</span>.
                  </p>
                </div>
              </div>
              <div 
                className="absolute top-0 right-0 w-72 h-full"
                style={{ background: 'linear-gradient(270deg, rgba(59,130,246,0.05) 0%, transparent 100%)' }}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DedicadosHub;
