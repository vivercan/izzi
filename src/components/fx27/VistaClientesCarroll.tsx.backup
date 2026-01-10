import { useState } from 'react';
import { ArrowLeft, Users, Eye, MapPin, FileDown, Calendar, Search, Filter, TrendingUp, AlertCircle, Clock, CheckCircle2, Navigation } from 'lucide-react';
import { AIAssistant } from './AIAssistant';

interface VistaClientesCarrollProps {
  onBack: () => void;
  onVerMapa?: () => void;
}

// Datos de ejemplo para la tabla
const viajesEjemplo = [
  { id: 1, unidad: 'GC-01', remolque: 'R-101', destino: 'CDMX', eta: '14:30', estado: 'En ruta', ultimaActualizacion: 'Hace 5 min', temp: '-18°C' },
  { id: 2, unidad: 'GC-02', remolque: 'R-102', destino: 'Guadalajara', eta: '16:45', estado: 'Entregado', ultimaActualizacion: 'Hace 1 hr', temp: '-20°C' },
  { id: 3, unidad: 'GC-03', remolque: 'R-103', destino: 'Monterrey', eta: '18:00', estado: 'En ruta', ultimaActualizacion: 'Hace 3 min', temp: '-19°C' },
  { id: 4, unidad: 'GC-04', remolque: 'R-104', destino: 'Querétaro', eta: '15:20', estado: 'Retraso', ultimaActualizacion: 'Hace 10 min', temp: '-18°C' },
  { id: 5, unidad: 'GC-05', remolque: 'R-105', destino: 'Puebla', eta: '13:45', estado: 'En ruta', ultimaActualizacion: 'Hace 2 min', temp: '-21°C' },
  { id: 6, unidad: 'GC-06', remolque: 'R-106', destino: 'León', eta: '17:30', estado: 'Entregado', ultimaActualizacion: 'Hace 2 hr', temp: '-19°C' },
];

export const VistaClientesCarroll = ({ onBack, onVerMapa }: VistaClientesCarrollProps) => {
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [busqueda, setBusqueda] = useState('');

  // Función para obtener el color del estado
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'En ruta':
        return { bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.5)', text: 'rgba(147, 197, 253, 1)' };
      case 'Entregado':
        return { bg: 'rgba(34, 197, 94, 0.15)', border: 'rgba(34, 197, 94, 0.5)', text: 'rgba(134, 239, 172, 1)' };
      case 'Retraso':
        return { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.5)', text: 'rgba(252, 165, 165, 1)' };
      default:
        return { bg: 'rgba(148, 163, 184, 0.15)', border: 'rgba(148, 163, 184, 0.5)', text: 'rgba(203, 213, 225, 1)' };
    }
  };

  return (
    <div 
      className="w-full min-h-screen relative overflow-hidden"
      style={{
        background: '#e5e7eb', // Gris claro
      }}
    >
      {/* ========== HEADER SUPERIOR AZUL (IGUAL AL DASHBOARD) ========== */}
      <div 
        className="relative z-10"
        style={{
          background: 'linear-gradient(135deg, #0B1220 0%, #1a2332 100%)',
          borderBottom: '2px solid rgba(30, 102, 245, 0.4)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div className="flex items-center justify-between px-8 py-4">{/* IZQUIERDA: BOTÓN REGRESO + TÍTULO */}
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack} 
              className="flex items-center justify-center transition-all duration-300"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: 'rgba(30, 102, 245, 0.15)',
                border: '1px solid rgba(30, 102, 245, 0.4)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(30, 102, 245, 0.25)';
                e.currentTarget.style.borderColor = 'rgba(30, 102, 245, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(30, 102, 245, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(30, 102, 245, 0.4)';
              }}
            >
              <ArrowLeft className="w-5 h-5 text-white" strokeWidth={2.5} />
            </button>

            <div className="flex items-center gap-3">
              <div 
                className="flex items-center justify-center rounded-xl"
                style={{
                  width: '44px',
                  height: '44px',
                  background: 'rgba(6, 182, 212, 0.2)',
                  border: '1px solid rgba(6, 182, 212, 0.5)',
                }}
              >
                <Users className="w-6 h-6" style={{ color: '#67e8f9' }} strokeWidth={2} />
              </div>
              <div>
                <h1 
                  style={{ 
                    fontFamily: "'Exo 2', sans-serif", 
                    fontSize: '20px', 
                    fontWeight: 900, 
                    letterSpacing: '1px',
                    color: 'white',
                  }}
                >
                  Vista Clientes · Granjas Carroll
                </h1>
                <p style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', color: '#9ca3af' }}>
                  Monitoreo de unidades dedicadas en tiempo real
                </p>
              </div>
            </div>
          </div>

          {/* DERECHA: TAG CLIENTE + EXPORTAR */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => alert('Exportando reporte...')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300"
              style={{
                background: 'rgba(6, 182, 212, 0.15)',
                border: '1px solid rgba(6, 182, 212, 0.4)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(6, 182, 212, 0.25)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(6, 182, 212, 0.15)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <FileDown className="w-4 h-4" style={{ color: '#67e8f9' }} strokeWidth={2} />
              <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 700, color: '#67e8f9', textTransform: 'uppercase' }}>
                Exportar reporte
              </span>
            </button>

            <div 
              className="flex items-center gap-2 px-4 py-2 rounded-lg"
              style={{
                background: 'rgba(6, 182, 212, 0.15)',
                border: '1px solid rgba(6, 182, 212, 0.4)',
              }}
            >
              <div 
                className="w-2 h-2 rounded-full"
                style={{
                  background: '#06b6d4',
                  boxShadow: '0 0 8px rgba(6, 182, 212, 0.8)'
                }}
              />
              <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 700, color: 'white', textTransform: 'uppercase' }}>
                CLIENTE
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========== SUB-HEADER / FILTROS ========== */}
      <div 
        className="relative z-10 border-b"
        style={{
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(10px)',
          borderColor: 'rgba(59, 130, 246, 0.1)'
        }}
      >
        <div className="flex items-center justify-between px-8 py-4 gap-4">
          {/* FILTROS */}
          <div className="flex items-center gap-3">
            {/* Filtro de Fechas */}
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300"
              style={{
                background: 'rgba(30, 41, 59, 0.6)',
                border: '1px solid rgba(100, 116, 139, 0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(100, 116, 139, 0.3)';
              }}
            >
              <Calendar className="w-4 h-4" style={{ color: 'rgba(148, 163, 184, 1)' }} strokeWidth={2} />
              <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', color: 'rgba(203, 213, 225, 1)' }}>
                Últimos 7 días
              </span>
            </button>

            {/* Filtro de Estado */}
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="px-4 py-2 rounded-lg transition-all duration-300"
              style={{
                background: 'rgba(30, 41, 59, 0.6)',
                border: '1px solid rgba(100, 116, 139, 0.3)',
                color: 'rgba(203, 213, 225, 1)',
                fontFamily: "'Exo 2', sans-serif",
                fontSize: '11px',
                outline: 'none'
              }}
            >
              <option value="todos">Todos los estados</option>
              <option value="en-ruta">En ruta</option>
              <option value="entregado">Entregado</option>
              <option value="retraso">Retraso</option>
            </select>

            {/* Búsqueda */}
            <div 
              className="flex items-center gap-2 px-4 py-2 rounded-lg"
              style={{
                background: 'rgba(30, 41, 59, 0.6)',
                border: '1px solid rgba(100, 116, 139, 0.3)',
                minWidth: '280px'
              }}
            >
              <Search className="w-4 h-4" style={{ color: 'rgba(148, 163, 184, 1)' }} strokeWidth={2} />
              <input
                type="text"
                placeholder="Buscar por unidad o remolque..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="flex-1 bg-transparent outline-none"
                style={{
                  color: 'rgba(203, 213, 225, 1)',
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: '11px'
                }}
              />
            </div>
          </div>

          {/* TAG SOLO CONSULTA */}
          <div 
            className="flex items-center gap-2 px-4 py-2 rounded-full"
            style={{
              background: 'rgba(6, 182, 212, 0.1)',
              border: '1px solid rgba(6, 182, 212, 0.4)',
              boxShadow: '0 0 12px rgba(6, 182, 212, 0.2)'
            }}
          >
            <Eye className="w-3.5 h-3.5" style={{ color: 'rgba(103, 232, 249, 1)' }} strokeWidth={2} />
            <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px', fontWeight: 700, color: 'rgba(103, 232, 249, 1)', textTransform: 'uppercase' }}>
              Modo cliente · Solo consulta
            </span>
          </div>
        </div>
      </div>

      {/* ========== CONTENIDO PRINCIPAL ========== */}
      <div className="relative z-10 p-8">
        <div className="max-w-[1800px] mx-auto">
          <div className="grid grid-cols-12 gap-6">
            
            {/* ========== TABLA DE VIAJES (COL 8) ========== */}
            <div className="col-span-8">
              <div 
                className="rounded-2xl overflow-hidden"
                style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
                }}
              >
                {/* Header de tabla */}
                <div 
                  className="px-6 py-4 border-b"
                  style={{
                    background: 'rgba(30, 41, 59, 0.4)',
                    borderColor: 'rgba(59, 130, 246, 0.2)'
                  }}
                >
                  <h3 style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', fontWeight: 700, color: 'rgba(226, 232, 240, 1)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Unidades en Operación
                  </h3>
                  <p style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px', color: 'rgba(148, 163, 184, 1)', marginTop: '4px' }}>
                    {viajesEjemplo.length} registros activos
                  </p>
                </div>

                {/* Tabla */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr 
                        style={{
                          background: 'rgba(30, 41, 59, 0.3)',
                          borderBottom: '1px solid rgba(59, 130, 246, 0.1)'
                        }}
                      >
                        {['Unidad', 'Remolque', 'Destino', 'ETA', 'Estado', 'Temp', 'Actualización', ''].map((header) => (
                          <th 
                            key={header}
                            className="px-4 py-3 text-left"
                            style={{
                              fontFamily: "'Exo 2', sans-serif",
                              fontSize: '10px',
                              fontWeight: 700,
                              color: 'rgba(148, 163, 184, 1)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {viajesEjemplo.map((viaje, idx) => {
                        const estadoColors = getEstadoColor(viaje.estado);
                        return (
                          <tr 
                            key={viaje.id}
                            className="transition-all duration-300"
                            style={{
                              borderBottom: '1px solid rgba(30, 41, 59, 0.5)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(30, 41, 59, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            <td className="px-4 py-3">
                              <span style={{ fontFamily: "'Orbitron', monospace", fontSize: '12px', fontWeight: 700, color: 'rgba(147, 197, 253, 1)' }}>
                                {viaje.unidad}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', color: 'rgba(203, 213, 225, 1)' }}>
                                {viaje.remolque}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', color: 'rgba(226, 232, 240, 1)' }}>
                                {viaje.destino}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 600, color: 'rgba(203, 213, 225, 1)' }}>
                                {viaje.eta}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div 
                                className="inline-flex px-2.5 py-1 rounded-full"
                                style={{
                                  background: estadoColors.bg,
                                  border: `1px solid ${estadoColors.border}`
                                }}
                              >
                                <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '9px', fontWeight: 700, color: estadoColors.text }}>
                                  {viaje.estado}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 600, color: 'rgba(103, 232, 249, 1)' }}>
                                {viaje.temp}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px', color: 'rgba(148, 163, 184, 1)' }}>
                                {viaje.ultimaActualizacion}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex justify-center">
                                <div 
                                  className="w-2 h-2 rounded-full"
                                  style={{
                                    background: '#22c55e',
                                    boxShadow: '0 0 6px rgba(34, 197, 94, 0.6)'
                                  }}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* ========== PANEL DE KPIs (COL 4) ========== */}
            <div className="col-span-4 space-y-6">
              
              {/* KPI 1: Entregas Hoy */}
              <div 
                className="rounded-2xl p-5"
                style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(34, 197, 94, 0.1)'
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="flex items-center justify-center rounded-xl"
                      style={{
                        width: '44px',
                        height: '44px',
                        background: 'rgba(34, 197, 94, 0.2)',
                        border: '1px solid rgba(34, 197, 94, 0.4)',
                        boxShadow: '0 0 16px rgba(34, 197, 94, 0.3)'
                      }}
                    >
                      <CheckCircle2 className="w-6 h-6" style={{ color: 'rgba(134, 239, 172, 1)' }} strokeWidth={2} />
                    </div>
                    <div>
                      <p style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px', color: 'rgba(148, 163, 184, 1)', textTransform: 'uppercase' }}>
                        Entregas Hoy
                      </p>
                      <h3 style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '28px', fontWeight: 900, color: 'rgba(134, 239, 172, 1)', lineHeight: '1' }}>
                        24
                      </h3>
                    </div>
                  </div>
                  <div 
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full"
                    style={{
                      background: 'rgba(34, 197, 94, 0.15)',
                      border: '1px solid rgba(34, 197, 94, 0.4)'
                    }}
                  >
                    <TrendingUp className="w-3 h-3" style={{ color: 'rgba(134, 239, 172, 1)' }} strokeWidth={2} />
                    <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '9px', fontWeight: 700, color: 'rgba(134, 239, 172, 1)' }}>
                      +12%
                    </span>
                  </div>
                </div>
                <div 
                  className="h-px"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(34, 197, 94, 0.3) 50%, transparent 100%)'
                  }}
                />
                <p style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '9px', color: 'rgba(148, 163, 184, 1)', marginTop: '12px' }}>
                  vs. 21 entregas ayer
                </p>
              </div>

              {/* KPI 2: Entregas Puntuales */}
              <div 
                className="rounded-2xl p-5"
                style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(59, 130, 246, 0.1)'
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="flex items-center justify-center rounded-xl"
                      style={{
                        width: '44px',
                        height: '44px',
                        background: 'rgba(59, 130, 246, 0.2)',
                        border: '1px solid rgba(59, 130, 246, 0.4)',
                        boxShadow: '0 0 16px rgba(59, 130, 246, 0.3)'
                      }}
                    >
                      <Clock className="w-6 h-6" style={{ color: 'rgba(147, 197, 253, 1)' }} strokeWidth={2} />
                    </div>
                    <div>
                      <p style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px', color: 'rgba(148, 163, 184, 1)', textTransform: 'uppercase' }}>
                        Puntuales
                      </p>
                      <h3 style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '28px', fontWeight: 900, color: 'rgba(147, 197, 253, 1)', lineHeight: '1' }}>
                        96%
                      </h3>
                    </div>
                  </div>
                </div>
                <div 
                  className="h-px"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(59, 130, 246, 0.3) 50%, transparent 100%)'
                  }}
                />
                <p style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '9px', color: 'rgba(148, 163, 184, 1)', marginTop: '12px' }}>
                  23 de 24 dentro de tiempo estimado
                </p>
              </div>

              {/* KPI 3: Retrasos */}
              <div 
                className="rounded-2xl p-5"
                style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(245, 158, 11, 0.1)'
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="flex items-center justify-center rounded-xl"
                      style={{
                        width: '44px',
                        height: '44px',
                        background: 'rgba(245, 158, 11, 0.2)',
                        border: '1px solid rgba(245, 158, 11, 0.4)',
                        boxShadow: '0 0 16px rgba(245, 158, 11, 0.3)'
                      }}
                    >
                      <AlertCircle className="w-6 h-6" style={{ color: 'rgba(251, 191, 36, 1)' }} strokeWidth={2} />
                    </div>
                    <div>
                      <p style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px', color: 'rgba(148, 163, 184, 1)', textTransform: 'uppercase' }}>
                        Retrasos
                      </p>
                      <h3 style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '28px', fontWeight: 900, color: 'rgba(251, 191, 36, 1)', lineHeight: '1' }}>
                        1
                      </h3>
                    </div>
                  </div>
                </div>
                <div 
                  className="h-px"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(245, 158, 11, 0.3) 50%, transparent 100%)'
                  }}
                />
                <p style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '9px', color: 'rgba(148, 163, 184, 1)', marginTop: '12px' }}>
                  Retraso promedio: 15 minutos
                </p>
              </div>

              {/* KPI 4: Alertas Activas */}
              <div 
                className="rounded-2xl p-5"
                style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(239, 68, 68, 0.1)'
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="flex items-center justify-center rounded-xl"
                      style={{
                        width: '44px',
                        height: '44px',
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        boxShadow: '0 0 16px rgba(239, 68, 68, 0.3)'
                      }}
                    >
                      <AlertCircle className="w-6 h-6" style={{ color: 'rgba(252, 165, 165, 1)' }} strokeWidth={2} />
                    </div>
                    <div>
                      <p style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px', color: 'rgba(148, 163, 184, 1)', textTransform: 'uppercase' }}>
                        Alertas Activas
                      </p>
                      <h3 style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '28px', fontWeight: 900, color: 'rgba(252, 165, 165, 1)', lineHeight: '1' }}>
                        0
                      </h3>
                    </div>
                  </div>
                </div>
                <div 
                  className="h-px"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(239, 68, 68, 0.3) 50%, transparent 100%)'
                  }}
                />
                <p style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '9px', color: 'rgba(148, 163, 184, 1)', marginTop: '12px' }}>
                  Todas las unidades dentro de parámetros
                </p>
              </div>

            </div>

          </div>
        </div>
      </div>

      {/* ========== ASISTENTE DE IA ========== */}
      <AIAssistant />
    </div>
  );
};