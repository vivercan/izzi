import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, Users, User, Loader2, Brain, AlertTriangle, 
  FileSpreadsheet, RefreshCw, ChevronLeft, Sparkles, 
  MessageSquare, X
} from 'lucide-react';

// Importar ModuleTemplate para header consistente
import { ModuleTemplate } from './ModuleTemplate';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN
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
  ultimo_mensaje?: string;
  ultimo_remitente?: string;
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

interface WhatsAppMonitorModuleProps {
  onBack: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════
export const WhatsAppMonitorModule: React.FC<WhatsAppMonitorModuleProps> = ({ onBack }) => {
  // Estados principales
  const [chats, setChats] = useState<ChatGroup[]>([]);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [allMensajes, setAllMensajes] = useState<Mensaje[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatGroup | null>(null);
  
  // Estados UI
  const [loading, setLoading] = useState(true);
  const [loadingMensajes, setLoadingMensajes] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  // Modal análisis
  const [showAnalisis, setShowAnalisis] = useState(false);
  const [analisisResult, setAnalisisResult] = useState<string>('');
  const [analisisTipo, setAnalisisTipo] = useState<'chat' | 'global'>('chat');

  const mensajesEndRef = useRef<HTMLDivElement>(null);

  // ═══════════════════════════════════════════════════════════════════════════
  // CARGAR TODOS LOS MENSAJES Y CONSTRUIR LISTA DE CHATS
  // ═══════════════════════════════════════════════════════════════════════════
  const cargarDatos = useCallback(async () => {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/whatsapp_mensajes?select=*&order=timestamp.desc&limit=10000`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        }
      );

      if (!response.ok) throw new Error('Error al cargar mensajes');

      const data: Mensaje[] = await response.json();
      setAllMensajes(data);

      // Construir lista de chats
      const chatMap = new Map<string, ChatGroup>();
      const ahora = new Date();
      const hace24h = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);

      data.forEach((msg) => {
        if (!chatMap.has(msg.chat_id)) {
          chatMap.set(msg.chat_id, {
            chat_id: msg.chat_id,
            chat_nombre: msg.chat_nombre || 'Sin nombre',
            es_grupo: msg.es_grupo,
            total_mensajes: 0,
            mensajes_nuevos: 0,
            ultima_actividad: msg.timestamp,
            ultimo_mensaje: msg.mensaje,
            ultimo_remitente: msg.remitente
          });
        }

        const chat = chatMap.get(msg.chat_id)!;
        chat.total_mensajes++;

        if (new Date(msg.timestamp) > hace24h) {
          chat.mensajes_nuevos++;
        }
      });

      const chatsArray = Array.from(chatMap.values())
        .sort((a, b) => new Date(b.ultima_actividad).getTime() - new Date(a.ultima_actividad).getTime());

      setChats(chatsArray);
      setLastUpdate(new Date());
      setConnected(true);
      setLoading(false);

      // Si hay chat seleccionado, actualizar sus mensajes
      if (selectedChat) {
        const mensajesChat = data
          .filter(m => m.chat_id === selectedChat.chat_id)
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        setMensajes(mensajesChat);
      }
    } catch (err: any) {
      console.error('Error cargando datos:', err);
      setError(err.message || 'Error al cargar datos');
      setConnected(false);
      setLoading(false);
    }
  }, [selectedChat]);

  // ═══════════════════════════════════════════════════════════════════════════
  // REALTIME - Polling cada 5 segundos
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    cargarDatos();

    const interval = setInterval(cargarDatos, 5000);

    return () => clearInterval(interval);
  }, [cargarDatos]);

  // ═══════════════════════════════════════════════════════════════════════════
  // SELECCIONAR CHAT
  // ═══════════════════════════════════════════════════════════════════════════
  const seleccionarChat = (chat: ChatGroup) => {
    setSelectedChat(chat);
    setLoadingMensajes(true);

    const mensajesChat = allMensajes
      .filter(m => m.chat_id === chat.chat_id)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    setMensajes(mensajesChat);
    setLoadingMensajes(false);

    setTimeout(() => {
      mensajesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ANÁLISIS CON CLAUDE
  // ═══════════════════════════════════════════════════════════════════════════
  const analizarConIA = async (tipo: 'chat' | 'global') => {
    setAnalyzing(true);
    setAnalisisTipo(tipo);
    setShowAnalisis(true);
    setAnalisisResult('');

    try {
      let mensajesParaAnalizar: Mensaje[] = [];
      let contexto = '';

      if (tipo === 'chat' && selectedChat) {
        mensajesParaAnalizar = mensajes.slice(-100);
        contexto = `el chat/grupo "${selectedChat.chat_nombre}"`;
      } else {
        const chatIds = [...new Set(allMensajes.map(m => m.chat_id))];
        chatIds.forEach(chatId => {
          const msgsChat = allMensajes.filter(m => m.chat_id === chatId).slice(0, 50);
          mensajesParaAnalizar.push(...msgsChat);
        });
        mensajesParaAnalizar = mensajesParaAnalizar.slice(0, 500);
        contexto = 'TODOS los chats de WhatsApp';
      }

      if (mensajesParaAnalizar.length === 0) {
        setAnalisisResult('No hay mensajes para analizar.');
        setAnalyzing(false);
        return;
      }

      const mensajesFormateados = mensajesParaAnalizar
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .map(m => `[${new Date(m.timestamp).toLocaleString('es-MX')}] [${m.chat_nombre}] ${m.remitente}: ${m.mensaje}`)
        .join('\n');

      const prompt = `Eres un asistente de gestión operativa para Grupo Loma Transportes. Analiza las conversaciones de WhatsApp de ${contexto}.

Proporciona:
1. **RESUMEN EJECUTIVO** (máx 5 oraciones)
2. **ACCIONES URGENTES**: Lista de cosas que requieren atención INMEDIATA
3. **ALERTAS**: Problemas, quejas, demoras, urgencias
4. **OPORTUNIDADES**: Mejoras o situaciones positivas
5. **MÉTRICAS**: Participantes activos, temas recurrentes

Usa emojis para urgencia: 🔴 Alta, 🟡 Media, 🟢 Baja

CONVERSACIONES:
${mensajesFormateados}`;

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
      setAnalisisResult(claudeData.content[0].text);
    } catch (err: any) {
      setAnalisisResult(`Error: ${err.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPORTAR EXCEL
  // ═══════════════════════════════════════════════════════════════════════════
  const exportarExcel = () => {
    const headers = ['Fecha', 'Hora', 'Chat/Grupo', 'Remitente', 'Mensaje'];
    const rows = allMensajes.map(msg => {
      const fecha = new Date(msg.timestamp);
      return [
        fecha.toLocaleDateString('es-MX'),
        fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        msg.chat_nombre || 'Sin nombre',
        msg.remitente || 'Desconocido',
        `"${(msg.mensaje || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `WhatsApp_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════
  const formatTiempo = (fecha: string) => {
    const f = new Date(fecha);
    const diffMs = Date.now() - f.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHoras < 24) return `${diffHoras}h`;
    return f.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' });
  };

  const formatHora = (fecha: string) => 
    new Date(fecha).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

  const chatsFiltrados = chats.filter(c =>
    c.chat_nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <ModuleTemplate title="WhatsApp Monitor" onBack={onBack}>
      <div className="flex h-[calc(100vh-180px)]">
        
        {/* ══════════════════════════════════════════════════════════════════
            PANEL IZQUIERDO - Lista de Chats
        ══════════════════════════════════════════════════════════════════ */}
        <div className="w-[300px] flex-shrink-0 border-r border-white/10 flex flex-col bg-white/[0.02]">
          
          {/* Header */}
          <div className="p-2 border-b border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-[10px] text-white/40">
                  {connected ? 'Live' : 'Off'} • {formatTiempo(lastUpdate.toISOString())}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => analizarConIA('global')}
                  disabled={analyzing}
                  className="p-1.5 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-400"
                  title="Analizar TODO"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={exportarExcel}
                  className="p-1.5 rounded bg-green-500/20 hover:bg-green-500/30 text-green-400"
                  title="Exportar"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={cargarDatos}
                  disabled={loading}
                  className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-white/40"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-7 pr-2 py-1.5 text-xs rounded bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-blue-500/50 focus:outline-none"
              />
            </div>

            {/* Stats mini */}
            <div className="flex gap-1 text-[9px]">
              <div className="flex-1 text-center py-1 rounded bg-white/5">
                <span className="text-white font-bold">{chats.length}</span>
                <span className="text-white/30 ml-0.5">chats</span>
              </div>
              <div className="flex-1 text-center py-1 rounded bg-white/5">
                <span className="text-blue-400 font-bold">{allMensajes.length}</span>
                <span className="text-white/30 ml-0.5">msgs</span>
              </div>
              <div className="flex-1 text-center py-1 rounded bg-white/5">
                <span className="text-green-400 font-bold">
                  {chats.reduce((s, c) => s + c.mensajes_nuevos, 0)}
                </span>
                <span className="text-white/30 ml-0.5">24h</span>
              </div>
            </div>
          </div>

          {/* Lista de chats */}
          <div className="flex-1 overflow-y-auto">
            {loading && chats.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
              </div>
            ) : chatsFiltrados.length === 0 ? (
              <div className="text-center py-8 text-white/30 text-xs">No hay chats</div>
            ) : (
              chatsFiltrados.map((chat) => (
                <div
                  key={chat.chat_id}
                  onClick={() => seleccionarChat(chat)}
                  className={`px-2 py-2 border-b border-white/5 cursor-pointer hover:bg-white/5 ${
                    selectedChat?.chat_id === chat.chat_id ? 'bg-blue-500/10 border-l-2 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      chat.es_grupo ? 'bg-blue-500/20' : 'bg-green-500/20'
                    }`}>
                      {chat.es_grupo ? (
                        <Users className="w-4 h-4 text-blue-400" />
                      ) : (
                        <User className="w-4 h-4 text-green-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-white text-xs font-medium truncate pr-1">
                          {chat.chat_nombre}
                        </h4>
                        <span className="text-[9px] text-white/30 flex-shrink-0">
                          {formatTiempo(chat.ultima_actividad)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-white/40 text-[10px] truncate pr-1">
                          {chat.ultimo_mensaje?.substring(0, 30)}...
                        </p>
                        {chat.mensajes_nuevos > 0 && (
                          <span className="px-1 py-0.5 rounded-full bg-green-500 text-white text-[8px] font-bold">
                            {chat.mensajes_nuevos}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            PANEL DERECHO - Mensajes
        ══════════════════════════════════════════════════════════════════ */}
        <div className="flex-1 flex flex-col bg-[#0B1220]/50">
          {selectedChat ? (
            <>
              {/* Header del chat */}
              <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedChat(null)}
                    className="lg:hidden p-1 rounded hover:bg-white/10"
                  >
                    <ChevronLeft className="w-4 h-4 text-white/50" />
                  </button>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    selectedChat.es_grupo ? 'bg-blue-500/20' : 'bg-green-500/20'
                  }`}>
                    {selectedChat.es_grupo ? (
                      <Users className="w-4 h-4 text-blue-400" />
                    ) : (
                      <User className="w-4 h-4 text-green-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-white font-medium text-sm">{selectedChat.chat_nombre}</h3>
                    <p className="text-white/40 text-[10px]">{mensajes.length} mensajes</p>
                  </div>
                </div>
                <button
                  onClick={() => analizarConIA('chat')}
                  disabled={analyzing}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 text-xs font-medium disabled:opacity-50"
                >
                  {analyzing && analisisTipo === 'chat' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Brain className="w-3.5 h-3.5" />
                  )}
                  <span>Analizar</span>
                </button>
              </div>

              {/* Mensajes */}
              <div className="flex-1 overflow-y-auto px-3 py-2">
                {loadingMensajes ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                  </div>
                ) : mensajes.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-white/30 text-sm">
                    No hay mensajes
                  </div>
                ) : (
                  <>
                    {mensajes.map((msg, idx) => {
                      const fecha = new Date(msg.timestamp);
                      const fechaAnterior = idx > 0 ? new Date(mensajes[idx - 1].timestamp) : null;
                      const esNuevoDia = !fechaAnterior || fecha.toDateString() !== fechaAnterior.toDateString();

                      return (
                        <React.Fragment key={msg.id}>
                          {esNuevoDia && (
                            <div className="flex items-center justify-center py-2">
                              <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/40 text-[9px]">
                                {fecha.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })}
                              </span>
                            </div>
                          )}
                          <div className="flex items-start gap-1.5 hover:bg-white/[0.02] rounded px-1 py-0.5">
                            <span className="text-[9px] text-white/25 w-8 flex-shrink-0 pt-0.5">
                              {formatHora(msg.timestamp)}
                            </span>
                            <div className="flex-1 min-w-0">
                              <span className="text-[11px] font-semibold text-green-400 mr-1.5">
                                {msg.remitente || '?'}
                              </span>
                              <span className="text-[12px] text-white/85 break-words">
                                {msg.mensaje}
                              </span>
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })}
                    <div ref={mensajesEndRef} />
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 text-white/10 mx-auto mb-3" />
                <h3 className="text-white/40 text-sm">Selecciona un chat</h3>
              </div>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            MODAL ANÁLISIS IA
        ══════════════════════════════════════════════════════════════════ */}
        {showAnalisis && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-2xl max-h-[80vh] m-4 rounded-xl bg-[#0F172A] border border-white/10 flex flex-col overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-purple-500/10">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-400" />
                  <h3 className="text-white font-medium text-sm">
                    Análisis - {analisisTipo === 'global' ? 'Todos los Chats' : selectedChat?.chat_nombre}
                  </h3>
                </div>
                <button
                  onClick={() => setShowAnalisis(false)}
                  className="p-1 rounded hover:bg-white/10 text-white/50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {analyzing ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 text-purple-400 animate-spin mb-3" />
                    <p className="text-white/40 text-sm">Analizando...</p>
                  </div>
                ) : (
                  <div className="text-white/85 whitespace-pre-wrap text-sm leading-relaxed">
                    {analisisResult}
                  </div>
                )}
              </div>
              <div className="px-4 py-2 border-t border-white/10 flex justify-end">
                <button
                  onClick={() => setShowAnalisis(false)}
                  className="px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-white text-xs"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="fixed bottom-4 right-4 z-50 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 flex items-center gap-2 max-w-sm">
          <AlertTriangle className="w-4 h-4" />
          <p className="text-xs flex-1">{error}</p>
          <button onClick={() => setError(null)}><X className="w-3 h-3" /></button>
        </div>
      )}
    </ModuleTemplate>
  );
};

export default WhatsAppMonitorModule;
