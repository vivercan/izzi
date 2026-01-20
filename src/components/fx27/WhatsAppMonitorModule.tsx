import React, { useState, useEffect, useCallback } from 'react';
import { 
  ArrowLeft, MessageSquare, RefreshCw, Search, CheckCircle2, 
  AlertCircle, Clock, Users, User, Loader2, ChevronDown, ChevronUp,
  Brain, CheckSquare, Square, AlertTriangle, Download, FileSpreadsheet
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN - Supabase y Anthropic
// ═══════════════════════════════════════════════════════════════════════════
const projectId = 'fbxbsslhewchyibdoyzk';
const publicAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieGJzc2xoZXdjaHlpYmRveXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzczODEsImV4cCI6MjA3ODExMzM4MX0.Z8JPlg7hhKbA624QGHp2bKKTNtCD3WInQMO5twjl6a0';

const SUPABASE_URL = `https://${projectId}.supabase.co`;
const SUPABASE_ANON_KEY = publicAnonKey;
const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY as string;

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════
interface ChatGroup {
  chat_id: string;
  chat_nombre: string;
  es_grupo: boolean;
  total_mensajes: number;
  mensajes_nuevos: number;
  ultima_actividad: string;
  estado: 'sin_analizar' | 'pendientes' | 'atendido';
  ultimo_analisis?: string;
}

interface Mensaje {
  id: string;
  chat_id: string;
  chat_nombre: string;
  es_grupo: boolean;
  remitente: string;
  mensaje: string;
  timestamp: string;
}

interface AnalisisResult {
  resumen: string;
  acciones_pendientes: Array<{
    id: string;
    descripcion: string;
    urgencia: 'alta' | 'media' | 'baja';
    atendido: boolean;
  }>;
  metricas: {
    tiempo_respuesta_promedio: string;
    mensajes_sin_respuesta: number;
    participantes_activos: number;
  };
  alertas: string[];
  oportunidades: string[];
}

interface WhatsAppMonitorModuleProps {
  onBack: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════
export const WhatsAppMonitorModule: React.FC<WhatsAppMonitorModuleProps> = ({ onBack }) => {
  const [chats, setChats] = useState<ChatGroup[]>([]);
  const [selectedChats, setSelectedChats] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'todos' | 'sin_analizar' | 'pendientes' | 'atendido'>('todos');
  
  const [analisisActual, setAnalisisActual] = useState<Record<string, AnalisisResult>>({});
  const [chatExpandido, setChatExpandido] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progreso, setProgreso] = useState({ actual: 0, total: 0 });

  // ═══════════════════════════════════════════════════════════════════════════
  // CARGAR CHATS
  // ═══════════════════════════════════════════════════════════════════════════
  const cargarChats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/rpc/obtener_resumen_chats`,
        {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const fallbackResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/whatsapp_mensajes?select=chat_id,chat_nombre,es_grupo,timestamp&order=timestamp.desc`,
          {
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
          }
        );

        if (!fallbackResponse.ok) throw new Error('Error al cargar mensajes');
        
        const mensajes = await fallbackResponse.json();
        
        const chatMap = new Map<string, ChatGroup>();
        const ahora = new Date();
        const hace24h = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);

        mensajes.forEach((msg: any) => {
          if (!chatMap.has(msg.chat_id)) {
            chatMap.set(msg.chat_id, {
              chat_id: msg.chat_id,
              chat_nombre: msg.chat_nombre || 'Sin nombre',
              es_grupo: msg.es_grupo,
              total_mensajes: 0,
              mensajes_nuevos: 0,
              ultima_actividad: msg.timestamp,
              estado: 'sin_analizar'
            });
          }
          
          const chat = chatMap.get(msg.chat_id)!;
          chat.total_mensajes++;
          
          if (new Date(msg.timestamp) > hace24h) {
            chat.mensajes_nuevos++;
          }
        });

        const estadosResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/whatsapp_analisis?select=chat_id,estado,created_at&order=created_at.desc`,
          {
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
          }
        );

        if (estadosResponse.ok) {
          const estados = await estadosResponse.json();
          const estadosPorChat = new Map<string, any>();
          
          estados.forEach((e: any) => {
            if (!estadosPorChat.has(e.chat_id)) {
              estadosPorChat.set(e.chat_id, e);
            }
          });

          chatMap.forEach((chat, chatId) => {
            const estado = estadosPorChat.get(chatId);
            if (estado) {
              chat.estado = estado.estado;
              chat.ultimo_analisis = estado.created_at;
            }
          });
        }

        const chatsArray = Array.from(chatMap.values())
          .sort((a, b) => new Date(b.ultima_actividad).getTime() - new Date(a.ultima_actividad).getTime());
        
        setChats(chatsArray);
      } else {
        const data = await response.json();
        setChats(data);
      }
    } catch (err: any) {
      console.error('Error cargando chats:', err);
      setError(err.message || 'Error al cargar chats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarChats();
  }, [cargarChats]);

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPORTAR A EXCEL
  // ═══════════════════════════════════════════════════════════════════════════
  const exportarExcel = async () => {
    setExporting(true);
    setError(null);

    try {
      // Obtener TODOS los mensajes
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/whatsapp_mensajes?select=*&order=timestamp.desc&limit=10000`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        }
      );

      if (!response.ok) throw new Error('Error al obtener mensajes');

      const mensajes: Mensaje[] = await response.json();

      // Crear CSV con formato para análisis
      const headers = [
        'Fecha',
        'Hora', 
        'Día Semana',
        'Semana del Año',
        'Grupo/Chat',
        'Es Grupo',
        'Remitente',
        'Mensaje',
        'Caracteres',
        'Tiempo desde anterior (min)'
      ];

      let prevTimestamp: Date | null = null;
      let prevChatId: string | null = null;

      const rows = mensajes.map((msg, index) => {
        const fecha = new Date(msg.timestamp);
        const diaSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][fecha.getDay()];
        
        // Calcular semana del año
        const startOfYear = new Date(fecha.getFullYear(), 0, 1);
        const days = Math.floor((fecha.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
        const semanaAno = Math.ceil((days + startOfYear.getDay() + 1) / 7);

        // Calcular tiempo desde mensaje anterior en el mismo chat
        let tiempoDesdeAnterior = '';
        if (prevTimestamp && prevChatId === msg.chat_id) {
          const diffMin = Math.round((prevTimestamp.getTime() - fecha.getTime()) / 60000);
          tiempoDesdeAnterior = diffMin.toString();
        }
        prevTimestamp = fecha;
        prevChatId = msg.chat_id;

        return [
          fecha.toLocaleDateString('es-MX'),
          fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
          diaSemana,
          `Semana ${semanaAno}`,
          msg.chat_nombre || 'Sin nombre',
          msg.es_grupo ? 'Sí' : 'No',
          msg.remitente || 'Desconocido',
          `"${(msg.mensaje || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
          (msg.mensaje || '').length.toString(),
          tiempoDesdeAnterior
        ];
      });

      // Crear contenido CSV
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      // Agregar BOM para Excel reconozca UTF-8
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // Descargar archivo
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `WhatsApp_Mensajes_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (err: any) {
      console.error('Error exportando:', err);
      setError(err.message || 'Error al exportar');
    } finally {
      setExporting(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ANALIZAR CON CLAUDE
  // ═══════════════════════════════════════════════════════════════════════════
  const analizarChats = async () => {
    if (selectedChats.size === 0) {
      setError('Selecciona al menos un chat para analizar');
      return;
    }

    setAnalyzing(true);
    setError(null);
    setProgreso({ actual: 0, total: selectedChats.size });

    const chatsSeleccionados = Array.from(selectedChats);
    const nuevosAnalisis: Record<string, AnalisisResult> = {};

    for (let i = 0; i < chatsSeleccionados.length; i++) {
      const chatId = chatsSeleccionados[i];
      setProgreso({ actual: i + 1, total: chatsSeleccionados.length });

      try {
        const hace48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
        
        const mensajesResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/whatsapp_mensajes?chat_id=eq.${encodeURIComponent(chatId)}&timestamp=gte.${hace48h}&order=timestamp.asc&limit=500`,
          {
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
          }
        );

        if (!mensajesResponse.ok) continue;
        
        const mensajes: Mensaje[] = await mensajesResponse.json();
        
        if (mensajes.length === 0) {
          nuevosAnalisis[chatId] = {
            resumen: 'No hay mensajes recientes en las últimas 48 horas.',
            acciones_pendientes: [],
            metricas: {
              tiempo_respuesta_promedio: 'N/A',
              mensajes_sin_respuesta: 0,
              participantes_activos: 0
            },
            alertas: [],
            oportunidades: []
          };
          continue;
        }

        const chatNombre = mensajes[0]?.chat_nombre || 'Chat';
        const mensajesFormateados = mensajes.map(m => 
          `[${new Date(m.timestamp).toLocaleString('es-MX')}] ${m.remitente}: ${m.mensaje}`
        ).join('\n');

        const prompt = `Eres un asistente de gestión operativa para Grupo Loma Transportes. Analiza esta conversación de WhatsApp del grupo/chat "${chatNombre}" y proporciona:

1. RESUMEN EJECUTIVO: Qué pasó en pocas líneas (máx 3 oraciones)
2. ACCIONES PENDIENTES: Lista de cosas que requieren acción HOY, con urgencia (alta/media/baja)
3. MÉTRICAS: Tiempo promedio de respuesta, mensajes sin respuesta, participantes activos
4. ALERTAS: Problemas detectados, menciones de "urgente", "problema", "demora", etc.
5. OPORTUNIDADES: Posibles mejoras o situaciones que aprovechar

CONVERSACIÓN:
${mensajesFormateados}

Responde SOLO en JSON con esta estructura exacta:
{
  "resumen": "string",
  "acciones_pendientes": [
    {"id": "1", "descripcion": "string", "urgencia": "alta|media|baja", "atendido": false}
  ],
  "metricas": {
    "tiempo_respuesta_promedio": "string",
    "mensajes_sin_respuesta": number,
    "participantes_activos": number
  },
  "alertas": ["string"],
  "oportunidades": ["string"]
}`;

        const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true'
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 2000,
            messages: [{ role: 'user', content: prompt }]
          })
        });

        if (!claudeResponse.ok) {
          const errorData = await claudeResponse.json();
          throw new Error(errorData.error?.message || 'Error en Claude API');
        }

        const claudeData = await claudeResponse.json();
        const responseText = claudeData.content[0].text;

        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const analisis = JSON.parse(jsonMatch[0]);
          nuevosAnalisis[chatId] = analisis;

          await fetch(`${SUPABASE_URL}/rest/v1/whatsapp_analisis`, {
            method: 'POST',
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
              chat_id: chatId,
              chat_nombre: chatNombre,
              analisis: analisis,
              estado: analisis.acciones_pendientes.length > 0 ? 'pendientes' : 'atendido'
            })
          });

          setChats(prev => prev.map(c => 
            c.chat_id === chatId 
              ? { ...c, estado: analisis.acciones_pendientes.length > 0 ? 'pendientes' : 'atendido', ultimo_analisis: new Date().toISOString() }
              : c
          ));
        }
      } catch (err: any) {
        console.error(`Error analizando chat ${chatId}:`, err);
        nuevosAnalisis[chatId] = {
          resumen: `Error al analizar: ${err.message}`,
          acciones_pendientes: [],
          metricas: { tiempo_respuesta_promedio: 'N/A', mensajes_sin_respuesta: 0, participantes_activos: 0 },
          alertas: ['Error en análisis'],
          oportunidades: []
        };
      }
    }

    setAnalisisActual(prev => ({ ...prev, ...nuevosAnalisis }));
    setAnalyzing(false);
    setSelectedChats(new Set());
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // MARCAR ACCIÓN COMO ATENDIDA
  // ═══════════════════════════════════════════════════════════════════════════
  const toggleAccionAtendida = (chatId: string, accionId: string) => {
    setAnalisisActual(prev => {
      const analisis = prev[chatId];
      if (!analisis) return prev;

      const nuevasAcciones = analisis.acciones_pendientes.map(a =>
        a.id === accionId ? { ...a, atendido: !a.atendido } : a
      );

      const todasAtendidas = nuevasAcciones.every(a => a.atendido);

      if (todasAtendidas) {
        setChats(prevChats => prevChats.map(c =>
          c.chat_id === chatId ? { ...c, estado: 'atendido' } : c
        ));
      }

      return {
        ...prev,
        [chatId]: {
          ...analisis,
          acciones_pendientes: nuevasAcciones
        }
      };
    });
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // FILTROS Y SELECCIÓN
  // ═══════════════════════════════════════════════════════════════════════════
  const chatsFiltrados = chats.filter(chat => {
    const matchSearch = chat.chat_nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'todos' || chat.estado === filterStatus;
    return matchSearch && matchStatus;
  });

  const toggleSelectChat = (chatId: string) => {
    setSelectedChats(prev => {
      const nuevo = new Set(prev);
      if (nuevo.has(chatId)) {
        nuevo.delete(chatId);
      } else {
        nuevo.add(chatId);
      }
      return nuevo;
    });
  };

  const selectAll = () => {
    if (selectedChats.size === chatsFiltrados.length) {
      setSelectedChats(new Set());
    } else {
      setSelectedChats(new Set(chatsFiltrados.map(c => c.chat_id)));
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'atendido': return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case 'pendientes': return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      default: return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'atendido': return 'Atendido';
      case 'pendientes': return 'Pendientes';
      default: return 'Sin analizar';
    }
  };

  const formatTiempoRelativo = (fecha: string) => {
    const ahora = new Date();
    const fechaMsg = new Date(fecha);
    const diffMs = ahora.getTime() - fechaMsg.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMs / 3600000);
    const diffDias = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHoras < 24) return `Hace ${diffHoras} hr`;
    if (diffDias < 7) return `Hace ${diffDias} días`;
    return fechaMsg.toLocaleDateString('es-MX');
  };

  const costoEstimado = () => {
    const totalMensajes = chatsFiltrados
      .filter(c => selectedChats.has(c.chat_id))
      .reduce((sum, c) => sum + c.mensajes_nuevos, 0);
    const costo = (totalMensajes * 0.001).toFixed(2);
    return { mensajes: totalMensajes, costo };
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen" style={{ background: 'var(--fx-bg, #0B1220)' }}>
      {/* Header Estandarizado - Estilo FX27 */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-xl bg-[#F97316] hover:bg-[#EA580C] flex items-center justify-center transition-all"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 
              className="text-2xl font-bold text-white"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              WhatsApp Monitor
            </h1>
          </div>

          {/* Logo FX27 */}
          <div className="text-right">
            <div 
              className="text-3xl font-black tracking-wider"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              <span className="text-[#3B82F6]">FX</span>
              <span className="text-[#F97316]">27</span>
            </div>
            <div 
              className="text-[9px] text-white/40 tracking-[0.15em] uppercase"
              style={{ fontFamily: "'Exo 2', sans-serif" }}
            >
              FUTURE EXPERIENCE 27
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        {/* Barra de acciones */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          {/* Búsqueda */}
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
            <input
              type="text"
              placeholder="Buscar chat o grupo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-[var(--fx-primary)] focus:outline-none transition-all"
              style={{ fontFamily: "'Exo 2', sans-serif" }}
            />
          </div>

          {/* Filtro de estado */}
          <div className="flex items-center gap-2 bg-white/5 rounded-xl p-1 border border-white/10">
            {(['todos', 'sin_analizar', 'pendientes', 'atendido'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterStatus === status
                    ? 'bg-[var(--fx-primary)] text-white'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
                style={{ fontFamily: "'Exo 2', sans-serif" }}
              >
                {status === 'todos' ? 'Todos' : 
                 status === 'sin_analizar' ? '🔴 Sin analizar' :
                 status === 'pendientes' ? '🟡 Pendientes' : '🟢 Atendido'}
              </button>
            ))}
          </div>

          {/* Botones de acción */}
          <div className="flex items-center gap-2">
            <button
              onClick={selectAll}
              className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all flex items-center gap-2"
            >
              {selectedChats.size === chatsFiltrados.length && chatsFiltrados.length > 0 ? (
                <CheckSquare className="w-5 h-5 text-[var(--fx-primary)]" />
              ) : (
                <Square className="w-5 h-5" />
              )}
              <span className="hidden sm:inline" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                {selectedChats.size === chatsFiltrados.length && chatsFiltrados.length > 0 
                  ? 'Deseleccionar' 
                  : 'Seleccionar todo'}
              </span>
            </button>

            <button
              onClick={cargarChats}
              disabled={loading}
              className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all flex items-center gap-2"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline" style={{ fontFamily: "'Exo 2', sans-serif" }}>Actualizar</span>
            </button>

            {/* BOTÓN EXPORTAR EXCEL */}
            <button
              onClick={exportarExcel}
              disabled={exporting}
              className="px-4 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white transition-all flex items-center gap-2"
            >
              {exporting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-5 h-5" />
              )}
              <span style={{ fontFamily: "'Exo 2', sans-serif" }}>
                {exporting ? 'Exportando...' : 'Exportar Excel'}
              </span>
            </button>
          </div>
        </div>

        {/* Info de selección y botón analizar */}
        {selectedChats.size > 0 && (
          <div 
            className="mb-6 p-4 rounded-2xl border border-[var(--fx-primary)]/30 flex items-center justify-between"
            style={{ background: 'linear-gradient(135deg, rgba(30,102,245,0.1) 0%, rgba(30,102,245,0.05) 100%)' }}
          >
            <div className="flex items-center gap-4">
              <Brain className="w-8 h-8 text-[var(--fx-primary)]" />
              <div>
                <p className="text-white font-semibold" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                  {selectedChats.size} chat{selectedChats.size > 1 ? 's' : ''} seleccionado{selectedChats.size > 1 ? 's' : ''}
                </p>
                <p className="text-white/50 text-sm">
                  ~{costoEstimado().mensajes} mensajes • Costo estimado: ${costoEstimado().costo} USD
                </p>
              </div>
            </div>
            <button
              onClick={analizarChats}
              disabled={analyzing}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--fx-primary)] to-blue-600 text-white font-semibold hover:shadow-lg hover:shadow-[var(--fx-primary)]/25 transition-all flex items-center gap-2 disabled:opacity-50"
              style={{ fontFamily: "'Exo 2', sans-serif" }}
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analizando {progreso.actual}/{progreso.total}...
                </>
              ) : (
                <>
                  <Brain className="w-5 h-5" />
                  Analizar Seleccionados
                </>
              )}
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p style={{ fontFamily: "'Exo 2', sans-serif" }}>{error}</p>
          </div>
        )}

        {/* Stats header */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
            <p className="text-2xl font-bold text-white">{chats.length}</p>
            <p className="text-white/50 text-xs">Total Chats</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
            <p className="text-2xl font-bold text-red-400">{chats.filter(c => c.estado === 'sin_analizar').length}</p>
            <p className="text-white/50 text-xs">Sin Analizar</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
            <p className="text-2xl font-bold text-yellow-400">{chats.filter(c => c.estado === 'pendientes').length}</p>
            <p className="text-white/50 text-xs">Con Pendientes</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
            <p className="text-2xl font-bold text-green-400">{chats.filter(c => c.estado === 'atendido').length}</p>
            <p className="text-white/50 text-xs">Atendidos</p>
          </div>
        </div>

        {/* Lista de chats */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-[var(--fx-primary)] animate-spin" />
          </div>
        ) : chatsFiltrados.length === 0 ? (
          <div className="text-center py-20">
            <MessageSquare className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <p className="text-white/50 text-lg" style={{ fontFamily: "'Exo 2', sans-serif" }}>
              No se encontraron chats
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {chatsFiltrados.map((chat) => (
              <div key={chat.chat_id} className="rounded-2xl overflow-hidden border border-white/10 bg-white/5">
                {/* Fila del chat */}
                <div 
                  className={`p-4 flex items-center gap-4 cursor-pointer hover:bg-white/5 transition-all ${
                    selectedChats.has(chat.chat_id) ? 'bg-[var(--fx-primary)]/10' : ''
                  }`}
                  onClick={() => toggleSelectChat(chat.chat_id)}
                >
                  {/* Checkbox */}
                  <div className="flex-shrink-0">
                    {selectedChats.has(chat.chat_id) ? (
                      <CheckSquare className="w-6 h-6 text-[var(--fx-primary)]" />
                    ) : (
                      <Square className="w-6 h-6 text-white/30" />
                    )}
                  </div>

                  {/* Icono de grupo/personal */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                    chat.es_grupo ? 'bg-blue-500/20' : 'bg-green-500/20'
                  }`}>
                    {chat.es_grupo ? (
                      <Users className="w-6 h-6 text-blue-400" />
                    ) : (
                      <User className="w-6 h-6 text-green-400" />
                    )}
                  </div>

                  {/* Info del chat */}
                  <div className="flex-1 min-w-0">
                    <h3 
                      className="text-white font-semibold truncate"
                      style={{ fontFamily: "'Exo 2', sans-serif" }}
                    >
                      {chat.chat_nombre}
                    </h3>
                    <p className="text-white/50 text-sm">
                      {chat.total_mensajes} mensajes totales
                    </p>
                  </div>

                  {/* Mensajes nuevos */}
                  {chat.mensajes_nuevos > 0 && (
                    <div className="px-3 py-1 rounded-full bg-[var(--fx-primary)] text-white text-sm font-semibold">
                      {chat.mensajes_nuevos} nuevos
                    </div>
                  )}

                  {/* Última actividad */}
                  <div className="text-right flex-shrink-0 w-24">
                    <p className="text-white/70 text-sm" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                      {formatTiempoRelativo(chat.ultima_actividad)}
                    </p>
                  </div>

                  {/* Estado */}
                  <div className="flex items-center gap-2 flex-shrink-0 w-32">
                    {getEstadoIcon(chat.estado)}
                    <span className="text-white/70 text-sm" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                      {getEstadoLabel(chat.estado)}
                    </span>
                  </div>

                  {/* Botón expandir análisis */}
                  {analisisActual[chat.chat_id] && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setChatExpandido(chatExpandido === chat.chat_id ? null : chat.chat_id);
                      }}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
                    >
                      {chatExpandido === chat.chat_id ? (
                        <ChevronUp className="w-5 h-5 text-white/50" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-white/50" />
                      )}
                    </button>
                  )}
                </div>

                {/* Panel de análisis expandido */}
                {chatExpandido === chat.chat_id && analisisActual[chat.chat_id] && (
                  <div className="border-t border-white/10 p-6 space-y-6" style={{ background: 'rgba(0,0,0,0.2)' }}>
                    {/* Resumen */}
                    <div>
                      <h4 className="text-white/50 text-sm mb-2 uppercase tracking-wider" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                        📋 Resumen
                      </h4>
                      <p className="text-white" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                        {analisisActual[chat.chat_id].resumen}
                      </p>
                    </div>

                    {/* Acciones pendientes */}
                    {analisisActual[chat.chat_id].acciones_pendientes.length > 0 && (
                      <div>
                        <h4 className="text-white/50 text-sm mb-3 uppercase tracking-wider" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                          ⚡ Acciones Pendientes
                        </h4>
                        <div className="space-y-2">
                          {analisisActual[chat.chat_id].acciones_pendientes.map((accion) => (
                            <div
                              key={accion.id}
                              onClick={() => toggleAccionAtendida(chat.chat_id, accion.id)}
                              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                                accion.atendido
                                  ? 'bg-green-500/10 border-green-500/30'
                                  : accion.urgencia === 'alta'
                                  ? 'bg-red-500/10 border-red-500/30'
                                  : accion.urgencia === 'media'
                                  ? 'bg-yellow-500/10 border-yellow-500/30'
                                  : 'bg-white/5 border-white/10'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {accion.atendido ? (
                                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                                ) : (
                                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${
                                    accion.urgencia === 'alta' ? 'border-red-400' :
                                    accion.urgencia === 'media' ? 'border-yellow-400' : 'border-white/30'
                                  }`} />
                                )}
                                <span className={`flex-1 ${accion.atendido ? 'text-white/50 line-through' : 'text-white'}`}>
                                  {accion.descripcion}
                                </span>
                                <span className={`px-2 py-1 rounded text-xs font-semibold uppercase ${
                                  accion.urgencia === 'alta' ? 'bg-red-500/20 text-red-400' :
                                  accion.urgencia === 'media' ? 'bg-yellow-500/20 text-yellow-400' :
                                  'bg-white/10 text-white/50'
                                }`}>
                                  {accion.urgencia}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Métricas */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Tiempo respuesta</p>
                        <p className="text-xl font-bold text-white">
                          {analisisActual[chat.chat_id].metricas.tiempo_respuesta_promedio}
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Sin respuesta</p>
                        <p className="text-xl font-bold text-white">
                          {analisisActual[chat.chat_id].metricas.mensajes_sin_respuesta}
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Participantes</p>
                        <p className="text-xl font-bold text-white">
                          {analisisActual[chat.chat_id].metricas.participantes_activos}
                        </p>
                      </div>
                    </div>

                    {/* Alertas */}
                    {analisisActual[chat.chat_id].alertas.length > 0 && (
                      <div>
                        <h4 className="text-white/50 text-sm mb-2 uppercase tracking-wider" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                          🚨 Alertas
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {analisisActual[chat.chat_id].alertas.map((alerta, idx) => (
                            <span 
                              key={idx}
                              className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-sm"
                            >
                              {alerta}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Oportunidades */}
                    {analisisActual[chat.chat_id].oportunidades.length > 0 && (
                      <div>
                        <h4 className="text-white/50 text-sm mb-2 uppercase tracking-wider" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                          💡 Oportunidades
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {analisisActual[chat.chat_id].oportunidades.map((oportunidad, idx) => (
                            <span 
                              key={idx}
                              className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm"
                            >
                              {oportunidad}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatsAppMonitorModule;
