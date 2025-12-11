import { Compass, TrendingUp, Globe, ArrowUpRight, Sparkles, Linkedin, X, ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface DashboardWidgetsProps {
  onNavigateToDashboard?: () => void;
}

interface NewsItem {
  id: string | number;
  title: string;
  description: string;
  fullDescription: string;
  source: string;
  sourceFull: string;
  date: string;
  url: string;
  image: string;
}

export const DashboardWidgets = ({ onNavigateToDashboard }: DashboardWidgetsProps) => {
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
  const [selectedNews, setSelectedNews] = useState<number | string | null>(null);
  const [transportNews, setTransportNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Obtener noticias reales del servidor
  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/news/get-news`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`
            }
          }
        );

        const data = await response.json();
        
        if (data.success && data.news && data.news.length > 0) {
          console.log('✅ Noticias reales obtenidas:', data.news.length);
          setTransportNews(data.news);
        } else {
          console.log('⚠️ No se obtuvieron noticias, usando fallback');
          // Fallback noticias por defecto
          setTransportNews(getDefaultNews());
        }
      } catch (error) {
        console.error('Error obteniendo noticias:', error);
        setTransportNews(getDefaultNews());
      } finally {
        setLoading(false);
      }
    };

    fetchNews();

    // Actualizar noticias cada 2 horas
    const interval = setInterval(() => {
      fetchNews();
    }, 2 * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Noticias por defecto (fallback)
  const getDefaultNews = (): NewsItem[] => {
    return [
      {
        id: 1,
        title: 'T-MEC: Comercio trilateral récord histórico',
        description: 'Intercambio comercial México-EE.UU.-Canadá superó $1.5 billones.',
        fullDescription: 'El tratado comercial T-MEC alcanzó cifras récord en 2024, con un intercambio comercial que superó los $1.5 billones de dólares entre México, Estados Unidos y Canadá. Este hito refleja la fortaleza de las relaciones comerciales trilaterales y el papel crucial del transporte de carga en la integración económica regional.',
        source: 'SE',
        sourceFull: 'Secretaría de Economía',
        date: '20 Nov',
        url: 'https://www.gob.mx/se',
        image: 'https://images.unsplash.com/photo-1759734065710-64d38dcebf98?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbnRlcm5hdGlvbmFsJTIwdHJhZGUlMjB0cnVja3N8ZW58MXx8fHwxNzYzNjI2MDQ0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
      },
      {
        id: 2,
        title: 'Corredor Interoceánico: Modernización',
        description: 'Nueva autopista reduce 35% tiempos Golfo-Pacífico.',
        fullDescription: 'La Secretaría de Comunicaciones y Transportes moderniza la infraestructura carretera del Corredor Interoceánico. La nueva autopista de alta especificación reducirá los tiempos de tránsito entre el Golfo de México y el Pacífico en un 35%, optimizando las rutas logísticas nacionales.',
        source: 'SCT',
        sourceFull: 'SCT México',
        date: '18 Nov',
        url: 'https://www.gob.mx/sct',
        image: 'https://images.unsplash.com/photo-1759382033088-9726a2eb7688?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoaWdod2F5JTIwaW5mcmFzdHJ1Y3R1cmUlMjBtZXhpY298ZW58MXx8fHwxNzYzNjI2MDQ0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
      },
      {
        id: 3,
        title: 'México lidera exportación refrigerados',
        description: 'Sector cárnico crece 18% en último trimestre.',
        fullDescription: 'México se consolida como líder en exportación de productos refrigerados en Latinoamérica. El sector cárnico registró un crecimiento del 18% en el último trimestre, impulsado por la modernización de flotas especializadas y mejoras en cadenas de frío.',
        source: 'CANACAR',
        sourceFull: 'Cámara Nacional del Autotransporte de Carga',
        date: '15 Nov',
        url: 'https://www.canacar.com.mx',
        image: 'https://images.unsplash.com/photo-1589725971583-8fa4d89e5e33?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZWZyaWdlcmF0ZWQlMjBjYXJnbyUyMHRyYW5zcG9ydHxlbnwxfHx8fDE3NjM2MjYwNDV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
      },
      {
        id: 4,
        title: 'GPS en tractocamiones: Seguridad',
        description: 'Rastreo satelital reduce robos 42% en rutas federales.',
        fullDescription: 'La implementación de sistemas GPS de última generación en tractocamiones ha logrado reducir los índices de robo en un 42% en las principales rutas federales. La tecnología de rastreo satelital en tiempo real permite monitoreo continuo y respuesta inmediata ante contingencias.',
        source: 'ANPACT',
        sourceFull: 'Asociación Nacional de Productores de Autobuses, Camiones y Tractocamiones',
        date: '12 Nov',
        url: 'https://www.anpact.com.mx',
        image: 'https://images.unsplash.com/photo-1666015212938-b96bb465f5b4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncHMlMjB0cmFja2luZyUyMHRlY2hub2xvZ3l8ZW58MXx8fHwxNzYzNjI2MDQ0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
      }
    ];
  };

  // Rotar noticias cada 8 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentNewsIndex((prev) => (prev + 1) % transportNews.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [transportNews]);

  const currentNews = transportNews[currentNewsIndex];

  return (
    <>
      {/* ========== NOTICIAS DE TRANSPORTE (PARTE INFERIOR IZQUIERDA) ========== */}
      <div
        className="fixed z-40 transition-all duration-300"
        style={{
          bottom: '14px',
          left: '362px',
          width: '884px',
          height: '155px',
          background: 'linear-gradient(155deg, rgba(18, 32, 58, 0.3) 0%, rgba(12, 22, 42, 0.3) 35%, rgba(8, 16, 32, 0.3) 70%, rgba(6, 12, 24, 0.3) 100%)',
          backdropFilter: 'blur(20px) saturate(140%)',
          WebkitBackdropFilter: 'blur(20px) saturate(140%)',
          border: '1px solid rgba(240, 160, 80, 0.3)',
          borderRadius: '0px',
          boxShadow: `
            0 2px 4px rgba(0, 0, 0, 0.3),
            0 6px 16px rgba(0, 0, 0, 0.5),
            0 12px 32px rgba(0, 0, 0, 0.6),
            inset 0 1px 0 rgba(255, 255, 255, 0.08),
            inset 0 -1px 0 rgba(0, 0, 0, 0.4),
            0 0 20px rgba(240, 160, 80, 0.08)
          `,
          overflow: 'hidden'
        }}
      >
        {/* Borde superior brillante */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(240, 160, 80, 0.3) 15%, rgba(240, 160, 80, 0.85) 50%, rgba(240, 160, 80, 0.3) 85%, transparent 100%)',
            boxShadow: '0 2px 12px rgba(240, 160, 80, 0.5)',
          }}
        />

        {/* Grid de 4 noticias - MÁS ESPACIO SIN TÍTULO */}
        <div className="px-3 pt-3 pb-3 grid grid-cols-4 gap-2">
          {transportNews.map((news) => (
            <div
              key={news.id}
              onClick={() => setSelectedNews(news.id)}
              className="rounded-lg p-2.5 transition-all duration-300 cursor-pointer group relative flex flex-col"
              style={{
                background: 'rgba(15, 23, 42, 0.3)',
                border: '1px solid rgba(240, 160, 80, 0.2)',
                height: '129px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(15, 23, 42, 0.5)';
                e.currentTarget.style.border = '1px solid rgba(240, 160, 80, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(15, 23, 42, 0.3)';
                e.currentTarget.style.border = '1px solid rgba(240, 160, 80, 0.2)';
              }}
            >
              <h4
                style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#FFFFFF',
                  lineHeight: '1.3',
                  marginBottom: '6px',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                {news.title}
              </h4>

              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '9px',
                  color: 'rgba(255, 255, 255, 0.6)',
                  lineHeight: '1.4',
                  marginBottom: '8px',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  flex: 1
                }}
              >
                {news.description}
              </p>

              {/* Fuente y Fecha - Mejoradas en la parte inferior */}
              <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid rgba(240, 160, 80, 0.15)' }}>
                <span
                  style={{
                    fontFamily: "'Exo 2', sans-serif",
                    fontSize: '9px',
                    color: 'rgba(240, 160, 80, 0.9)',
                    fontWeight: 600,
                    letterSpacing: '0.3px'
                  }}
                >
                  {news.source}
                </span>
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '8px',
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontWeight: 500
                  }}
                >
                  {news.date}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========== MODAL DE NOTICIA COMPLETA ========== */}
      {selectedNews !== null && (() => {
        const news = transportNews.find(n => n.id === selectedNews);
        if (!news) return null;

        return (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center"
            style={{
              background: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(8px)',
            }}
            onClick={() => setSelectedNews(null)}
          >
            <div
              className="relative"
              style={{
                width: '720px',
                maxHeight: '85vh',
                background: 'linear-gradient(155deg, rgba(18, 32, 58, 0.98) 0%, rgba(12, 22, 42, 0.98) 50%, rgba(8, 16, 32, 1) 100%)',
                border: '2px solid rgba(240, 160, 80, 0.4)',
                borderRadius: '16px',
                boxShadow: '0 24px 64px rgba(0, 0, 0, 0.8), 0 0 40px rgba(240, 160, 80, 0.2)',
                overflow: 'hidden',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Botón cerrar */}
              <button
                onClick={() => setSelectedNews(null)}
                className="absolute top-4 right-4 z-10 flex items-center justify-center transition-all duration-200"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(240, 160, 80, 0.3)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(240, 160, 80, 0.2)';
                  e.currentTarget.style.border = '1px solid rgba(240, 160, 80, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)';
                  e.currentTarget.style.border = '1px solid rgba(240, 160, 80, 0.3)';
                }}
              >
                <X className="w-4 h-4 text-white" strokeWidth={2.5} />
              </button>

              {/* Imagen de portada */}
              <div className="relative w-full h-64 overflow-hidden">
                <img
                  src={news.image}
                  alt={news.title}
                  className="w-full h-full object-cover"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(to bottom, transparent 0%, rgba(8, 16, 32, 0.4) 50%, rgba(8, 16, 32, 0.9) 100%)'
                  }}
                />
                {/* Badge de fuente */}
                <div
                  className="absolute top-4 left-4 px-3 py-1.5 rounded-lg"
                  style={{
                    background: 'rgba(240, 160, 80, 0.9)',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px', fontWeight: 700, color: '#0B1220', letterSpacing: '0.5px' }}>
                    {news.source}
                  </span>
                </div>
              </div>

              {/* Contenido */}
              <div className="px-8 py-6">
                <h2
                  style={{
                    fontFamily: "'Exo 2', sans-serif",
                    fontSize: '24px',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    lineHeight: '1.3',
                    marginBottom: '8px'
                  }}
                >
                  {news.title}
                </h2>

                <div className="flex items-center gap-3 mb-6">
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '11px',
                      color: 'rgba(240, 160, 80, 0.9)',
                      fontWeight: 600
                    }}
                  >
                    {news.sourceFull}
                  </span>
                  <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>•</span>
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '11px',
                      color: 'rgba(255, 255, 255, 0.6)'
                    }}
                  >
                    {news.date} 2024
                  </span>
                </div>

                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '14px',
                    color: 'rgba(255, 255, 255, 0.85)',
                    lineHeight: '1.7',
                    marginBottom: '24px'
                  }}
                >
                  {news.fullDescription}
                </p>

                {/* Botón para ir al sitio */}
                <button
                  onClick={() => window.open(news.url, '_blank')}
                  className="flex items-center gap-2 px-5 py-2.5 transition-all duration-300"
                  style={{
                    background: 'linear-gradient(90deg, rgba(240, 160, 80, 0.9) 0%, rgba(240, 160, 80, 1) 100%)',
                    border: '1px solid rgba(240, 160, 80, 1)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(240, 160, 80, 0.3)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(90deg, rgba(240, 160, 80, 1) 0%, rgba(255, 180, 100, 1) 100%)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(240, 160, 80, 0.5)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(90deg, rgba(240, 160, 80, 0.9) 0%, rgba(240, 160, 80, 1) 100%)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(240, 160, 80, 0.3)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <ExternalLink className="w-4 h-4 text-[#0B1220]" strokeWidth={2.5} />
                  <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 700, color: '#0B1220', letterSpacing: '0.3px' }}>
                    IR AL SITIO OFICIAL
                  </span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
};