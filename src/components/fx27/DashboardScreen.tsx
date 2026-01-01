import { Truck, UserPlus, BarChart3, Route, Wrench, Activity, Settings, FileText, TrendingUp, Package, LogOut, Sparkles, Headphones, Lock, Target } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { AIAssistant } from './AIAssistant';

interface DashboardScreenProps {
  onLogout: () => void;
  onNavigate: (module: string) => void;
  userRole?: 'admin' | 'ventas' | 'operaciones';
  userName?: string; // ✅ NUEVO: Nombre del usuario logueado
}

export const DashboardScreen = ({ onLogout, onNavigate, userRole = 'admin', userName = 'Usuario' }: DashboardScreenProps) => {
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  
  // Función para obtener el número de semana del año
  const getWeekNumber = (date: Date): number => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  // Función para obtener tipo de cambio
  const fetchExchangeRate = async () => {
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json();
      if (data.rates && data.rates.MXN) {
        setExchangeRate(data.rates.MXN);
      }
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
    }
  };

  // Actualizar tipo de cambio al montar y cada 8 horas
  useEffect(() => {
    fetchExchangeRate();
    const interval = setInterval(() => {
      fetchExchangeRate();
    }, 8 * 60 * 60 * 1000); // 8 horas en milisegundos

    return () => clearInterval(interval);
  }, []);

  const currentDate = new Date();
  const dateString = currentDate.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Capitalizar primera letra del día de la semana
  const formattedDate = dateString.charAt(0).toUpperCase() + dateString.slice(1);
  const weekNumber = getWeekNumber(currentDate);

  const hasAccess = (moduleId: string): boolean => {
    if (userRole === 'admin') return true;
    if (userRole === 'ventas') return moduleId !== 'configuracion';
    if (userRole === 'operaciones') return moduleId === 'operaciones';
    return false;
  };

  const handleModuleClick = (moduleId: string) => {
    if (hasAccess(moduleId)) {
      onNavigate(moduleId);
    } else {
      setShowAccessDenied(true);
      setTimeout(() => setShowAccessDenied(false), 2000);
    }
  };

  const isKeyModule = (moduleId: string): boolean => {
    return ['panel-oportunidades', 'despacho-inteligente', 'control-equipo', 'servicio-clientes'].includes(moduleId);
  };

  const modules = [
    { id: 'agregar-lead', name: 'Agregar Lead', icon: UserPlus },
    { id: 'panel-oportunidades', name: 'Panel de Oportunidades', icon: BarChart3 },
    { id: 'operaciones', name: 'Operaciones', icon: Truck },
    { id: 'despacho-inteligente', name: 'Despacho Inteligente', icon: Sparkles },
    { id: 'control-equipo', name: 'Control de Equipo', icon: Wrench },
    { id: 'kpis', name: 'KPIs', icon: Activity },
    { id: 'configuracion', name: 'Configuración', icon: Settings },
    { id: 'cotizaciones', name: 'Cotizaciones', icon: FileText },
    { id: 'ventas', name: 'Ventas', icon: TrendingUp },
    { id: 'utilerias', name: 'Utilerías', icon: Package },
    { id: 'servicio-clientes', name: 'Servicio A Clientes', icon: Headphones },
    { id: 'dedicados', name: 'Dedicados', icon: Route },
    ];

  const topModules = modules.slice(0, 7);
  const bottomModules = modules.slice(7);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Background - Gradiente AZUL ELÉCTRICO #10 FIJO */}
      <div 
        className="absolute inset-0 transition-all duration-700"
        style={{
          background: 'linear-gradient(135deg, #001f4d 0%, #003d7a 25%, #0066cc 50%, #1a8fff 75%, #4da6ff 100%)',
          opacity: 1,
        }}
      />
      
      {/* Overlay oscuro sutil para mejorar contraste de los botones */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.25) 0%, rgba(0, 0, 0, 0.15) 50%, rgba(0, 0, 0, 0.25) 100%)',
        }}
      />
      
      {/* Halo volumétrico detrás de los botones - Panel flotante */}
      <div 
        className="absolute"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -46%)',
          width: '88%',
          height: '68%',
          background: 'radial-gradient(ellipse at center, rgba(30, 80, 160, 0.08) 0%, rgba(40, 90, 170, 0.04) 35%, transparent 70%)',
          filter: 'blur(90px)',
          pointerEvents: 'none',
        }}
      />

      {/* Logo FX27 - Metal cepillado premium */}
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

      {/* HEADER 3D PROFESIONAL - ROMPE CON LO PLANO */}
      <div 
        className="absolute top-0 left-0 right-0 z-40"
        style={{
          height: '120px',
          background: 'linear-gradient(180deg, rgba(15, 25, 45, 0.92) 0%, rgba(12, 20, 38, 0.88) 50%, rgba(10, 18, 32, 0.75) 100%)',
          backdropFilter: 'blur(20px) saturate(140%)',
          WebkitBackdropFilter: 'blur(20px) saturate(140%)',
          borderBottom: '1px solid rgba(80, 120, 180, 0.15)',
          boxShadow: `
            0 8px 32px rgba(0, 0, 0, 0.4),
            0 2px 8px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.05),
            inset 0 -1px 0 rgba(0, 0, 0, 0.2),
            0 12px 48px rgba(10, 40, 90, 0.15)
          `,
        }}
      >
        {/* Borde superior con degradado sutil */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(60, 110, 180, 0.3) 20%, rgba(80, 130, 200, 0.4) 50%, rgba(60, 110, 180, 0.3) 80%, transparent 100%)',
            boxShadow: '0 1px 3px rgba(80, 130, 200, 0.2)',
          }}
        />

        {/* Contenido del Header */}
        <div className="relative h-full flex items-center justify-between px-12" style={{ paddingTop: '8px', marginRight: '286px' }}>
          {/* Fecha, Semana y Tipo de Cambio */}
          <div className="flex items-center gap-6" style={{ marginTop: '-15px', marginLeft: '-5px' }}>
            {/* Fecha */}
            <div 
              style={{
                fontFamily: "'Exo 2', sans-serif",
                fontSize: '15px',
                fontWeight: 400,
                color: 'rgba(255, 255, 255, 0.75)',
                letterSpacing: '0.02em',
              }}
            >
              {formattedDate}
            </div>

            {/* Separador */}
            <div 
              style={{
                width: '1px',
                height: '20px',
                background: 'rgba(255, 255, 255, 0.2)',
              }}
            />

            {/* Número de Semana */}
            <div 
              style={{
                fontFamily: "'Exo 2', sans-serif",
                fontSize: '15px',
                fontWeight: 600,
                color: 'rgba(80, 140, 220, 0.9)',
                letterSpacing: '0.03em',
              }}
            >
              W{weekNumber}
            </div>

            {/* Separador */}
            <div 
              style={{
                width: '1px',
                height: '20px',
                background: 'rgba(255, 255, 255, 0.2)',
              }}
            />

            {/* Tipo de Cambio USD/MXN */}
            <div 
              style={{
                fontFamily: "'Exo 2', sans-serif",
                fontSize: '15px',
                fontWeight: 400,
                color: 'rgba(255, 255, 255, 0.75)',
                letterSpacing: '0.02em',
              }}
            >
              {exchangeRate ? `$${exchangeRate.toFixed(2)} MXN/USD` : 'Cargando...'}
            </div>
          </div>
          
          {/* Usuario y Cerrar Sesión */}
          <div className="flex items-center gap-4" style={{ marginTop: '-10px', marginRight: '-65px' }}>
            <div className="flex flex-col items-end" style={{ marginRight: '16px' }}>
              <div 
                style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'rgba(255, 255, 255, 0.95)',
                  letterSpacing: '0.02em',
                }}
              >
                {userName}
              </div>
              <div 
                style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'rgba(80, 140, 220, 0.9)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                {userRole === 'admin' ? 'ADMIN' : userRole === 'ventas' ? 'VENTAS' : 'OPERACIONES'}
              </div>
            </div>

            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-5 py-2.5 transition-all duration-300"
              style={{
                fontFamily: "'Exo 2', sans-serif",
                fontSize: '13px',
                fontWeight: 600,
                background: 'linear-gradient(135deg, rgba(20, 30, 50, 0.85) 0%, rgba(15, 22, 40, 0.9) 100%)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(80, 120, 180, 0.25)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
                borderRadius: '0px',
                color: 'rgba(255, 255, 255, 0.9)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.border = '1px solid rgba(59, 130, 246, 0.6)';
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(30, 45, 70, 0.95) 0%, rgba(20, 30, 52, 1) 100%)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(59, 130, 246, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.color = 'rgba(255, 255, 255, 1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.border = '1px solid rgba(80, 120, 180, 0.25)';
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(20, 30, 50, 0.85) 0%, rgba(15, 22, 40, 0.9) 100%)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.06)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
              }}
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>

        {/* Borde inferior 3D con múltiples capas */}
        <div 
          style={{
            position: 'absolute',
            bottom: '-4px',
            left: '48px',
            right: '48px',
            height: '4px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(25, 40, 65, 0.7) 10%, rgba(35, 55, 85, 0.9) 50%, rgba(25, 40, 65, 0.7) 90%, transparent 100%)',
            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(10, 40, 90, 0.2)',
            borderRadius: '2px',
          }}
        >
          <div 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '1px',
              background: 'linear-gradient(90deg, transparent 0%, rgba(80, 130, 200, 0.3) 25%, rgba(100, 150, 220, 0.4) 50%, rgba(80, 130, 200, 0.3) 75%, transparent 100%)',
            }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full h-full flex flex-col px-12" style={{ paddingTop: '156px' }}>

        {/* Top 7 Modules */}
        <div className="flex gap-5 mb-5">
          {topModules.map((module) => {
            const Icon = module.icon;
            const locked = !hasAccess(module.id);
            const isKey = isKeyModule(module.id);
            
            return (
              <button
                key={module.id}
                onClick={() => handleModuleClick(module.id)}
                className="group relative flex flex-col items-center justify-center gap-3 aspect-square p-5 transition-all duration-300"
                style={{
                  background: isKey 
                    ? 'linear-gradient(155deg, rgba(22, 38, 68, 0.98) 0%, rgba(15, 25, 48, 0.99) 35%, rgba(10, 18, 35, 1) 70%, rgba(8, 14, 28, 1) 100%)'
                    : 'linear-gradient(155deg, rgba(18, 32, 58, 0.96) 0%, rgba(12, 22, 42, 0.98) 35%, rgba(8, 16, 32, 1) 70%, rgba(6, 12, 24, 1) 100%)',
                  border: '2px solid transparent',
                  backgroundImage: isKey
                    ? 'linear-gradient(155deg, rgba(22, 38, 68, 0.98) 0%, rgba(15, 25, 48, 0.99) 35%, rgba(10, 18, 35, 1) 70%, rgba(8, 14, 28, 1) 100%), linear-gradient(135deg, rgba(220, 140, 70, 0.4) 0%, rgba(180, 100, 50, 0.35) 25%, rgba(60, 90, 140, 0.3) 50%, rgba(180, 100, 50, 0.35) 75%, rgba(220, 140, 70, 0.4) 100%)'
                    : 'linear-gradient(155deg, rgba(18, 32, 58, 0.96) 0%, rgba(12, 22, 42, 0.98) 35%, rgba(8, 16, 32, 1) 70%, rgba(6, 12, 24, 1) 100%), linear-gradient(135deg, rgba(180, 100, 50, 0.28) 0%, rgba(60, 90, 140, 0.25) 50%, rgba(180, 100, 50, 0.28) 100%)',
                  backgroundOrigin: 'border-box',
                  backgroundClip: 'padding-box, border-box',
                  boxShadow: isKey
                    ? `
                      0 2px 4px rgba(0, 0, 0, 0.3),
                      0 6px 16px rgba(0, 0, 0, 0.5),
                      0 12px 32px rgba(0, 0, 0, 0.6),
                      inset 0 1px 0 rgba(255, 255, 255, 0.08),
                      inset 0 -1px 0 rgba(0, 0, 0, 0.4),
                      inset 2px 2px 4px rgba(40, 60, 100, 0.15),
                      inset -2px -2px 4px rgba(0, 0, 0, 0.25),
                      0 0 20px rgba(220, 140, 70, 0.08)
                    `
                    : `
                      0 2px 4px rgba(0, 0, 0, 0.25),
                      0 4px 12px rgba(0, 0, 0, 0.45),
                      0 8px 24px rgba(0, 0, 0, 0.55),
                      inset 0 1px 0 rgba(255, 255, 255, 0.05),
                      inset 0 -1px 0 rgba(0, 0, 0, 0.35),
                      inset 2px 2px 4px rgba(30, 50, 80, 0.12),
                      inset -2px -2px 4px rgba(0, 0, 0, 0.2)
                    `,
                  borderRadius: '10px',
                  width: 'calc((100% - 120px) / 7)',
                  flexShrink: 0,
                  transform: 'translateY(0)',
                  opacity: locked ? 0.4 : 1,
                  cursor: locked ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={(e) => {
                  if (!locked) {
                    e.currentTarget.style.transform = 'translateY(-6px)';
                    e.currentTarget.style.backgroundImage = 'linear-gradient(155deg, rgba(28, 48, 82, 1) 0%, rgba(20, 35, 62, 1) 35%, rgba(14, 24, 45, 1) 70%, rgba(10, 18, 35, 1) 100%), linear-gradient(135deg, rgba(240, 160, 80, 0.65) 0%, rgba(220, 140, 70, 0.6) 25%, rgba(70, 110, 170, 0.4) 50%, rgba(220, 140, 70, 0.6) 75%, rgba(240, 160, 80, 0.65) 100%)';
                    e.currentTarget.style.boxShadow = `
                      0 4px 8px rgba(0, 0, 0, 0.4),
                      0 10px 24px rgba(0, 0, 0, 0.6),
                      0 18px 48px rgba(220, 140, 70, 0.3),
                      0 24px 64px rgba(0, 0, 0, 0.7),
                      inset 0 2px 0 rgba(255, 255, 255, 0.12),
                      inset 0 -2px 0 rgba(0, 0, 0, 0.5),
                      inset 3px 3px 6px rgba(240, 160, 80, 0.08),
                      inset -3px -3px 6px rgba(0, 0, 0, 0.35),
                      0 0 40px rgba(240, 160, 80, 0.25)
                    `;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!locked) {
                    const isKey = isKeyModule(module.id);
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.backgroundImage = isKey
                      ? 'linear-gradient(155deg, rgba(22, 38, 68, 0.98) 0%, rgba(15, 25, 48, 0.99) 35%, rgba(10, 18, 35, 1) 70%, rgba(8, 14, 28, 1) 100%), linear-gradient(135deg, rgba(220, 140, 70, 0.4) 0%, rgba(180, 100, 50, 0.35) 25%, rgba(60, 90, 140, 0.3) 50%, rgba(180, 100, 50, 0.35) 75%, rgba(220, 140, 70, 0.4) 100%)'
                      : 'linear-gradient(155deg, rgba(18, 32, 58, 0.96) 0%, rgba(12, 22, 42, 0.98) 35%, rgba(8, 16, 32, 1) 70%, rgba(6, 12, 24, 1) 100%), linear-gradient(135deg, rgba(180, 100, 50, 0.28) 0%, rgba(60, 90, 140, 0.25) 50%, rgba(180, 100, 50, 0.28) 100%)';
                    e.currentTarget.style.boxShadow = isKey
                      ? `
                        0 2px 4px rgba(0, 0, 0, 0.3),
                        0 6px 16px rgba(0, 0, 0, 0.5),
                        0 12px 32px rgba(0, 0, 0, 0.6),
                        inset 0 1px 0 rgba(255, 255, 255, 0.08),
                        inset 0 -1px 0 rgba(0, 0, 0, 0.4),
                        inset 2px 2px 4px rgba(40, 60, 100, 0.15),
                        inset -2px -2px 4px rgba(0, 0, 0, 0.25),
                        0 0 20px rgba(220, 140, 70, 0.08)
                      `
                      : `
                        0 2px 4px rgba(0, 0, 0, 0.25),
                        0 4px 12px rgba(0, 0, 0, 0.45),
                        0 8px 24px rgba(0, 0, 0, 0.55),
                        inset 0 1px 0 rgba(255, 255, 255, 0.05),
                        inset 0 -1px 0 rgba(0, 0, 0, 0.35),
                        inset 2px 2px 4px rgba(30, 50, 80, 0.12),
                        inset -2px -2px 4px rgba(0, 0, 0, 0.2)
                      `;
                  }
                }}
              >
                {locked && (
                  <div className="absolute top-2 right-2 z-20">
                    <Lock className="w-5 h-5 text-red-400 opacity-70" />
                  </div>
                )}
                
                {/* Fondo circular naranja detrás del ícono - DISRUPTIVO */}
                <div 
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle, rgba(240, 160, 80, 0.25) 0%, rgba(220, 140, 70, 0.18) 40%, rgba(200, 120, 60, 0.08) 70%, transparent 100%)',
                    borderRadius: '50%',
                    filter: 'blur(8px)',
                    display: locked ? 'none' : 'block',
                    transform: 'translate(-50%, -50%) scale(0.8)',
                  }}
                  ref={(el) => {
                    if (el && el.parentElement?.matches(':hover') && !locked) {
                      el.style.transform = 'translate(-50%, -50%) scale(1)';
                    }
                  }}
                />
                
                {/* Highlight superior - Efecto 3D bisel */}
                <div 
                  className="absolute top-0 left-0 right-0 h-[35%] opacity-30 group-hover:opacity-50 transition-opacity duration-300 pointer-events-none"
                  style={{
                    background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, transparent 100%)',
                    borderTopLeftRadius: '10px',
                    borderTopRightRadius: '10px',
                    display: locked ? 'none' : 'block'
                  }}
                />
                
                {/* Línea superior naranja - Acento cobre en hover */}
                <div 
                  className="absolute top-0 left-0 right-0 h-[3px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(240, 160, 80, 0.3) 15%, rgba(240, 160, 80, 0.85) 50%, rgba(240, 160, 80, 0.3) 85%, transparent 100%)',
                    boxShadow: '0 2px 12px rgba(240, 160, 80, 0.5), 0 0 20px rgba(240, 160, 80, 0.3)',
                    borderTopLeftRadius: '10px',
                    borderTopRightRadius: '10px',
                    display: locked ? 'none' : 'block'
                  }}
                />
                
                {/* Inner glow cobre desde arriba - más intenso */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: 'radial-gradient(ellipse at 50% 0%, rgba(240, 160, 80, 0.15) 0%, rgba(220, 140, 70, 0.08) 40%, transparent 70%)',
                    pointerEvents: 'none',
                    borderRadius: '10px',
                    display: locked ? 'none' : 'block'
                  }}
                />
                
                {/* Ícono con double glow */}
                <Icon 
                  className="w-20 h-20 relative z-10 transition-all duration-300 group-hover:scale-110" 
                  style={{ 
                    color: locked ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.95)',
                    strokeWidth: 1.8,
                    filter: locked 
                      ? 'none' 
                      : 'drop-shadow(0 4px 10px rgba(0, 0, 0, 0.6)) drop-shadow(0 0 14px rgba(255, 255, 255, 0.15)) drop-shadow(0 0 20px rgba(240, 160, 80, 0))',
                  }}
                  onMouseEnter={(e) => {
                    if (!locked) {
                      e.currentTarget.style.color = 'rgba(240, 160, 80, 1)';
                      e.currentTarget.style.filter = 'drop-shadow(0 4px 10px rgba(0, 0, 0, 0.6)) drop-shadow(0 0 16px rgba(240, 160, 80, 0.6)) drop-shadow(0 0 24px rgba(240, 160, 80, 0.5))';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!locked) {
                      e.currentTarget.style.color = 'rgba(255, 255, 255, 0.95)';
                      e.currentTarget.style.filter = 'drop-shadow(0 4px 10px rgba(0, 0, 0, 0.6)) drop-shadow(0 0 14px rgba(255, 255, 255, 0.15)) drop-shadow(0 0 20px rgba(240, 160, 80, 0))';
                    }
                  }}
                />
                
                {/* Texto con sombra multicapa - CAMBIA A NARANJA EN HOVER */}
                <span 
                  className="text-center relative z-10 transition-all duration-300"
                  style={{
                    fontFamily: "'Exo 2', sans-serif",
                    fontSize: '13px',
                    lineHeight: '1.25',
                    fontWeight: 600,
                    letterSpacing: '0.02em',
                    color: locked ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.9)',
                    opacity: locked ? 0.3 : 0.9,
                    textShadow: '0 2px 8px rgba(0, 0, 0, 0.6), 0 1px 3px rgba(0, 0, 0, 0.8)',
                  }}
                  onMouseEnter={(e) => {
                    if (!locked) {
                      e.currentTarget.style.color = 'rgba(240, 160, 80, 1)';
                      e.currentTarget.style.opacity = '1';
                      e.currentTarget.style.textShadow = '0 2px 8px rgba(0, 0, 0, 0.6), 0 0 12px rgba(240, 160, 80, 0.5)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!locked) {
                      e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
                      e.currentTarget.style.opacity = '0.9';
                      e.currentTarget.style.textShadow = '0 2px 8px rgba(0, 0, 0, 0.6), 0 1px 3px rgba(0, 0, 0, 0.8)';
                    }
                  }}
                >
                  {module.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Bottom 5 Modules */}
        <div className="flex gap-5">
          {bottomModules.map((module) => {
            const Icon = module.icon;
            const locked = !hasAccess(module.id);
            const isKey = isKeyModule(module.id);
            
            return (
              <button
                key={module.id}
                onClick={() => handleModuleClick(module.id)}
                className="group relative flex flex-col items-center justify-center gap-3 aspect-square p-5 transition-all duration-300"
                style={{
                  background: isKey 
                    ? 'linear-gradient(155deg, rgba(22, 38, 68, 0.98) 0%, rgba(15, 25, 48, 0.99) 35%, rgba(10, 18, 35, 1) 70%, rgba(8, 14, 28, 1) 100%)'
                    : 'linear-gradient(155deg, rgba(18, 32, 58, 0.96) 0%, rgba(12, 22, 42, 0.98) 35%, rgba(8, 16, 32, 1) 70%, rgba(6, 12, 24, 1) 100%)',
                  border: '2px solid transparent',
                  backgroundImage: isKey
                    ? 'linear-gradient(155deg, rgba(22, 38, 68, 0.98) 0%, rgba(15, 25, 48, 0.99) 35%, rgba(10, 18, 35, 1) 70%, rgba(8, 14, 28, 1) 100%), linear-gradient(135deg, rgba(220, 140, 70, 0.4) 0%, rgba(180, 100, 50, 0.35) 25%, rgba(60, 90, 140, 0.3) 50%, rgba(180, 100, 50, 0.35) 75%, rgba(220, 140, 70, 0.4) 100%)'
                    : 'linear-gradient(155deg, rgba(18, 32, 58, 0.96) 0%, rgba(12, 22, 42, 0.98) 35%, rgba(8, 16, 32, 1) 70%, rgba(6, 12, 24, 1) 100%), linear-gradient(135deg, rgba(180, 100, 50, 0.28) 0%, rgba(60, 90, 140, 0.25) 50%, rgba(180, 100, 50, 0.28) 100%)',
                  backgroundOrigin: 'border-box',
                  backgroundClip: 'padding-box, border-box',
                  boxShadow: isKey
                    ? `
                      0 2px 4px rgba(0, 0, 0, 0.3),
                      0 6px 16px rgba(0, 0, 0, 0.5),
                      0 12px 32px rgba(0, 0, 0, 0.6),
                      inset 0 1px 0 rgba(255, 255, 255, 0.08),
                      inset 0 -1px 0 rgba(0, 0, 0, 0.4),
                      inset 2px 2px 4px rgba(40, 60, 100, 0.15),
                      inset -2px -2px 4px rgba(0, 0, 0, 0.25),
                      0 0 20px rgba(220, 140, 70, 0.08)
                    `
                    : `
                      0 2px 4px rgba(0, 0, 0, 0.25),
                      0 4px 12px rgba(0, 0, 0, 0.45),
                      0 8px 24px rgba(0, 0, 0, 0.55),
                      inset 0 1px 0 rgba(255, 255, 255, 0.05),
                      inset 0 -1px 0 rgba(0, 0, 0, 0.35),
                      inset 2px 2px 4px rgba(30, 50, 80, 0.12),
                      inset -2px -2px 4px rgba(0, 0, 0, 0.2)
                    `,
                  borderRadius: '10px',
                  width: 'calc((100% - 120px) / 7)',
                  flexShrink: 0,
                  transform: 'translateY(0)',
                  opacity: locked ? 0.4 : 1,
                  cursor: locked ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={(e) => {
                  if (!locked) {
                    e.currentTarget.style.transform = 'translateY(-6px)';
                    e.currentTarget.style.backgroundImage = 'linear-gradient(155deg, rgba(28, 48, 82, 1) 0%, rgba(20, 35, 62, 1) 35%, rgba(14, 24, 45, 1) 70%, rgba(10, 18, 35, 1) 100%), linear-gradient(135deg, rgba(240, 160, 80, 0.65) 0%, rgba(220, 140, 70, 0.6) 25%, rgba(70, 110, 170, 0.4) 50%, rgba(220, 140, 70, 0.6) 75%, rgba(240, 160, 80, 0.65) 100%)';
                    e.currentTarget.style.boxShadow = `
                      0 4px 8px rgba(0, 0, 0, 0.4),
                      0 10px 24px rgba(0, 0, 0, 0.6),
                      0 18px 48px rgba(220, 140, 70, 0.3),
                      0 24px 64px rgba(0, 0, 0, 0.7),
                      inset 0 2px 0 rgba(255, 255, 255, 0.12),
                      inset 0 -2px 0 rgba(0, 0, 0, 0.5),
                      inset 3px 3px 6px rgba(240, 160, 80, 0.08),
                      inset -3px -3px 6px rgba(0, 0, 0, 0.35),
                      0 0 40px rgba(240, 160, 80, 0.25)
                    `;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!locked) {
                    const isKey = isKeyModule(module.id);
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.backgroundImage = isKey
                      ? 'linear-gradient(155deg, rgba(22, 38, 68, 0.98) 0%, rgba(15, 25, 48, 0.99) 35%, rgba(10, 18, 35, 1) 70%, rgba(8, 14, 28, 1) 100%), linear-gradient(135deg, rgba(220, 140, 70, 0.4) 0%, rgba(180, 100, 50, 0.35) 25%, rgba(60, 90, 140, 0.3) 50%, rgba(180, 100, 50, 0.35) 75%, rgba(220, 140, 70, 0.4) 100%)'
                      : 'linear-gradient(155deg, rgba(18, 32, 58, 0.96) 0%, rgba(12, 22, 42, 0.98) 35%, rgba(8, 16, 32, 1) 70%, rgba(6, 12, 24, 1) 100%), linear-gradient(135deg, rgba(180, 100, 50, 0.28) 0%, rgba(60, 90, 140, 0.25) 50%, rgba(180, 100, 50, 0.28) 100%)';
                    e.currentTarget.style.boxShadow = isKey
                      ? `
                        0 2px 4px rgba(0, 0, 0, 0.3),
                        0 6px 16px rgba(0, 0, 0, 0.5),
                        0 12px 32px rgba(0, 0, 0, 0.6),
                        inset 0 1px 0 rgba(255, 255, 255, 0.08),
                        inset 0 -1px 0 rgba(0, 0, 0, 0.4),
                        inset 2px 2px 4px rgba(40, 60, 100, 0.15),
                        inset -2px -2px 4px rgba(0, 0, 0, 0.25),
                        0 0 20px rgba(220, 140, 70, 0.08)
                      `
                      : `
                        0 2px 4px rgba(0, 0, 0, 0.25),
                        0 4px 12px rgba(0, 0, 0, 0.45),
                        0 8px 24px rgba(0, 0, 0, 0.55),
                        inset 0 1px 0 rgba(255, 255, 255, 0.05),
                        inset 0 -1px 0 rgba(0, 0, 0, 0.35),
                        inset 2px 2px 4px rgba(30, 50, 80, 0.12),
                        inset -2px -2px 4px rgba(0, 0, 0, 0.2)
                      `;
                  }
                }}
              >
                {locked && (
                  <div className="absolute top-2 right-2 z-20">
                    <Lock className="w-5 h-5 text-red-400 opacity-70" />
                  </div>
                )}
                
                {/* Highlight superior - Efecto 3D bisel */}
                <div 
                  className="absolute top-0 left-0 right-0 h-[35%] opacity-30 group-hover:opacity-50 transition-opacity duration-300 pointer-events-none"
                  style={{
                    background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, transparent 100%)',
                    borderTopLeftRadius: '10px',
                    borderTopRightRadius: '10px',
                    display: locked ? 'none' : 'block'
                  }}
                />
                
                {/* Línea superior naranja - Acento cobre en hover */}
                <div 
                  className="absolute top-0 left-0 right-0 h-[3px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(240, 160, 80, 0.3) 15%, rgba(240, 160, 80, 0.85) 50%, rgba(240, 160, 80, 0.3) 85%, transparent 100%)',
                    boxShadow: '0 2px 12px rgba(240, 160, 80, 0.5), 0 0 20px rgba(240, 160, 80, 0.3)',
                    borderTopLeftRadius: '10px',
                    borderTopRightRadius: '10px',
                    display: locked ? 'none' : 'block'
                  }}
                />
                
                {/* Inner glow cobre desde arriba - más intenso */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: 'radial-gradient(ellipse at 50% 0%, rgba(240, 160, 80, 0.15) 0%, rgba(220, 140, 70, 0.08) 40%, transparent 70%)',
                    pointerEvents: 'none',
                    borderRadius: '10px',
                    display: locked ? 'none' : 'block'
                  }}
                />
                
                {/* Ícono con double glow */}
                <Icon 
                  className="w-20 h-20 relative z-10 transition-all duration-300 group-hover:scale-110" 
                  style={{ 
                    color: locked ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.95)',
                    strokeWidth: 1.8,
                    filter: locked 
                      ? 'none' 
                      : 'drop-shadow(0 4px 10px rgba(0, 0, 0, 0.6)) drop-shadow(0 0 14px rgba(255, 255, 255, 0.15)) drop-shadow(0 0 20px rgba(240, 160, 80, 0))',
                  }}
                  onMouseEnter={(e) => {
                    if (!locked) {
                      e.currentTarget.style.color = 'rgba(240, 160, 80, 1)';
                      e.currentTarget.style.filter = 'drop-shadow(0 4px 10px rgba(0, 0, 0, 0.6)) drop-shadow(0 0 16px rgba(240, 160, 80, 0.6)) drop-shadow(0 0 24px rgba(240, 160, 80, 0.5))';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!locked) {
                      e.currentTarget.style.color = 'rgba(255, 255, 255, 0.95)';
                      e.currentTarget.style.filter = 'drop-shadow(0 4px 10px rgba(0, 0, 0, 0.6)) drop-shadow(0 0 14px rgba(255, 255, 255, 0.15)) drop-shadow(0 0 20px rgba(240, 160, 80, 0))';
                    }
                  }}
                />
                
                {/* Texto con sombra multicapa */}
                <span 
                  className="text-center relative z-10 transition-all duration-300 group-hover:opacity-100"
                  style={{
                    fontFamily: "'Exo 2', sans-serif",
                    fontSize: '13px',
                    lineHeight: '1.25',
                    fontWeight: 600,
                    letterSpacing: '0.02em',
                    color: locked ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.9)',
                    opacity: locked ? 0.3 : 0.9,
                    textShadow: '0 2px 8px rgba(0, 0, 0, 0.6), 0 1px 3px rgba(0, 0, 0, 0.8)',
                  }}
                >
                  {module.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Mensaje acceso denegado */}
        {showAccessDenied && (
          <div 
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 px-8 py-4 flex items-center gap-3"
            style={{
              background: 'linear-gradient(135deg, rgba(180, 30, 30, 0.95) 0%, rgba(140, 20, 20, 0.98) 100%)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(220, 80, 80, 0.5)',
              borderRadius: '0px',
              boxShadow: '0 8px 32px rgba(180, 30, 30, 0.5), 0 2px 8px rgba(0, 0, 0, 0.4)',
              fontFamily: "'Exo 2', sans-serif"
            }}
          >
            <Lock className="w-6 h-6 text-white opacity-95" />
            <span className="text-white" style={{ fontSize: '15px', fontWeight: 600 }}>No tienes acceso a este módulo</span>
          </div>
        )}
      </div>

      {/* ========== ASISTENTE DE IA ========== */}
      <AIAssistant />
    </div>
  );
};