import { useState, useEffect } from 'react';
import { Newspaper, Radio } from 'lucide-react';

interface Noticia {
  id: string;
  titulo: string;
  ubicacion: string;
  categoria: 'transito' | 'clima' | 'seguridad' | 'general';
  timestamp: string;
}

interface NewsTickerProps {
  ciudades: string[]; // Ciudades por donde transitan las unidades
}

export const NewsTicker = ({ ciudades }: NewsTickerProps) => {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [indicePausa, setIndicePausa] = useState<number | null>(null);

  // Noticias demo - en producción esto vendría de un endpoint
  useEffect(() => {
    const noticiasDemo: Noticia[] = [
      {
        id: '1',
        titulo: '🚧 Carretera 150D Oriental-Puebla: Tránsito fluido, sin incidencias',
        ubicacion: 'Oriental-Puebla',
        categoria: 'transito',
        timestamp: new Date().toISOString()
      },
      {
        id: '2',
        titulo: '☀️ Monterrey: Clima despejado 26°C, condiciones óptimas para descarga en CEDIS Walmart',
        ubicacion: 'Monterrey, NL',
        categoria: 'clima',
        timestamp: new Date().toISOString()
      },
      {
        id: '3',
        titulo: '⚠️ Central de Abastos CDMX: Alta afluencia vehicular, considerar horarios de descarga',
        ubicacion: 'Ciudad de México',
        categoria: 'transito',
        timestamp: new Date().toISOString()
      },
      {
        id: '4',
        titulo: '🌧️ Guadalajara: Probabilidad de lluvia 40%, verificar temperatura de carga',
        ubicacion: 'Guadalajara, JAL',
        categoria: 'clima',
        timestamp: new Date().toISOString()
      },
      {
        id: '5',
        titulo: '✅ Autopista Oriental-Querétaro: Excelentes condiciones, tiempo estimado 7h 50m',
        ubicacion: 'Oriental-Querétaro',
        categoria: 'transito',
        timestamp: new Date().toISOString()
      },
      {
        id: '6',
        titulo: '🚨 Veracruz: Inspección SCT activa en caseta Cardel, documentación en orden',
        ubicacion: 'Veracruz, VER',
        categoria: 'seguridad',
        timestamp: new Date().toISOString()
      },
      {
        id: '7',
        titulo: '🌡️ Oriental: Temperatura planta 8°C, condiciones ideales para carga refrigerada',
        ubicacion: 'Oriental, Puebla',
        categoria: 'clima',
        timestamp: new Date().toISOString()
      },
      {
        id: '8',
        titulo: '⛽ San Luis Potosí: Precio diesel $23.80/L en ruta principal hacia Oriental',
        ubicacion: 'San Luis Potosí, SLP',
        categoria: 'general',
        timestamp: new Date().toISOString()
      },
      {
        id: '9',
        titulo: '📦 CEDIS Soriana Guadalajara: Recepción disponible 24h, sin demoras',
        ubicacion: 'Guadalajara, JAL',
        categoria: 'general',
        timestamp: new Date().toISOString()
      },
      {
        id: '10',
        titulo: '🚧 Autopista 150D: Obras menor entre Esperanza-Orizaba, demora 10 minutos',
        ubicacion: 'Veracruz-Puebla',
        categoria: 'transito',
        timestamp: new Date().toISOString()
      }
    ];

    setNoticias(noticiasDemo);

    // En producción, aquí harías fetch a tu endpoint de noticias
    // filtrado por las ciudades activas
  }, [ciudades]);

  const getCategoriaColor = (categoria: Noticia['categoria']) => {
    switch (categoria) {
      case 'transito': return 'text-yellow-400';
      case 'clima': return 'text-blue-400';
      case 'seguridad': return 'text-red-400';
      case 'general': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="bg-gradient-to-r from-[var(--fx-surface)] to-[rgba(30,102,245,0.1)] border-y border-[rgba(148,163,184,0.2)] overflow-hidden">
      <div className="flex items-center h-12">
        {/* Label fijo */}
        <div className="flex items-center gap-2 px-6 bg-[var(--fx-primary)] h-full flex-shrink-0">
          <Radio className="w-4 h-4 text-white animate-pulse" />
          <span className="text-white uppercase tracking-wider" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px', fontWeight: 700 }}>
            Noticias de Ruta
          </span>
        </div>

        {/* Ticker animado */}
        <div className="flex-1 overflow-hidden relative">
          <div 
            className="flex gap-12 animate-scroll"
            onMouseEnter={() => setIndicePausa(0)}
            onMouseLeave={() => setIndicePausa(null)}
            style={{
              animation: indicePausa !== null ? 'none' : 'scroll 60s linear infinite'
            }}
          >
            {/* Duplicar noticias para loop infinito */}
            {[...noticias, ...noticias].map((noticia, index) => (
              <div 
                key={`${noticia.id}-${index}`} 
                className="flex items-center gap-3 whitespace-nowrap flex-shrink-0"
              >
                <span className={getCategoriaColor(noticia.categoria)} style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 600 }}>
                  {noticia.ubicacion}:
                </span>
                <span className="text-white" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px' }}>
                  {noticia.titulo}
                </span>
                <span className="text-[var(--fx-muted)]">•</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-scroll {
          animation: scroll 60s linear infinite;
        }
      `}</style>
    </div>
  );
};