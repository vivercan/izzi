import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, Users, User, Loader2, Brain, AlertTriangle, 
  FileSpreadsheet, RefreshCw, Sparkles, MessageSquare, X,
  Image as ImageIcon, FileText, Download, GripVertical
} from 'lucide-react';

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
  media_url?: string;
  media_type?: string;
  media_filename?: string;
}

interface WhatsAppMonitorModuleProps {
  onBack: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════
export const WhatsAppMonitorModule: React.FC<WhatsAppMonitorModuleProps> = ({ onBack }) => {
  const [chats, setChats] = useState<ChatGroup[]>([]);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [allMensajes, setAllMensajes] = useState<Mensaje[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatGroup | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [loadingMensajes, setLoadingMensajes] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  const [showAnalisis, setShowAnalisis] = useState(false);
  const [analisisResult, setAnalisisResult] = useState<string>('');
  const [analisisTipo, setAnalisisTipo] = useState<'chat' | 'global'>('chat');

  // Panel resizable
  const [panelWidth, setPanelWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Imagen expandida
  const [imagenExpandida, setImagenExpandida] = useState<string | null>(null);

  const mensajesEndRef = useRef<HTMLDivElement>(null);

  // ═══════════════════════════════════════════════════════════════════════════
  // RESIZE PANEL
  // ═══════════════════════════════════════════════════════════════════════════
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = e.clientX - containerRect.left;
      setPanelWidth(Math.max(250, Math.min(500, newWidth)));
    };

    const handleMouseUp = () => setIsResizing(false);

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // ═══════════════════════════════════════════════════════════════════════════
  // CARGAR DATOS
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
            ultimo_mensaje: msg.mensaje || (msg.media_type ? `📎 ${msg.media_type}` : ''),
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

      if (selectedChat) {
        const mensajesChat = data
          .filter(m => m.chat_id === selectedChat.chat_id)
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        setMensajes(mensajesChat);
      }
    } catch (err: any) {
      setError(err.message);
      setConnected(false);
      setLoading(false);
    }
  }, [selectedChat]);

  // Polling cada 5 segundos (GRATIS - no usa Supabase Realtime de pago)
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
  // ANÁLISIS IA
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
        contexto = 'TODOS los chats';
      }

      if (mensajesParaAnalizar.length === 0) {
        setAnalisisResult('No hay mensajes para analizar.');
        setAnalyzing(false);
        return;
      }

      const mensajesFormateados = mensajesParaAnalizar
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .map(m => `[${new Date(m.timestamp).toLocaleString('es-MX')}] [${m.chat_nombre}] ${m.remitente}: ${m.mensaje || '[MEDIA]'}`)
        .join('\n');

      const prompt = `Analiza estas conversaciones de WhatsApp de ${contexto} para Grupo Loma Transportes.

1. **RESUMEN** (máx 5 oraciones)
2. **ACCIONES URGENTES** 🔴
3. **ALERTAS** ⚠️
4. **OPORTUNIDADES** 💡

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

      if (!claudeResponse.ok) throw new Error('Error en Claude API');

      const claudeData = await claudeResponse.json();
      setAnalisisResult(claudeData.content[0].text);
    } catch (err: any) {
      setAnalisisResult(`Error: ${err.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPORTAR
  // ═══════════════════════════════════════════════════════════════════════════
  const exportarExcel = () => {
    const headers = ['Fecha', 'Hora', 'Chat', 'Remitente', 'Mensaje', 'Media'];
    const rows = allMensajes.map(msg => {
      const f = new Date(msg.timestamp);
      return [
        f.toLocaleDateString('es-MX'),
        f.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        msg.chat_nombre || '',
        msg.remitente || '',
        `"${(msg.mensaje || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
        msg.media_url || ''
      ];
    });

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
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
    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
    return f.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' });
  };

  const formatHora = (fecha: string) => 
    new Date(fecha).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

  const chatsFiltrados = chats.filter(c =>
    c.chat_nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Detectar si es imagen
  const esImagen = (url?: string, type?: string) => {
    if (type?.startsWith('image')) return true;
    if (url?.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return true;
    return false;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <ModuleTemplate title="WhatsApp Monitor" onBack={onBack}>
      <div 
        ref={containerRef}
        className="flex h-[calc(100vh-180px)] overflow-hidden rounded-lg"
        style={{ userSelect: isResizing ? 'none' : 'auto' }}
      >
        
        {/* ══════════════════════════════════════════════════════════════════
            PANEL IZQUIERDO - Lista de Chats (Resizable)
        ══════════════════════════════════════════════════════════════════ */}
        <div 
          className="flex-shrink-0 flex flex-col border-r border-white/10"
          style={{ 
            width: panelWidth,
            background: '#111B21' // Color WhatsApp sidebar
          }}
        >
          {/* Header */}
          <div className="p-2 space-y-2" style={{ background: '#202C33' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-[10px] text-white/50">
                  {connected ? 'Live' : 'Off'} • {formatTiempo(lastUpdate.toISOString())}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => analizarConIA('global')}
                  disabled={analyzing}
                  className="p-1.5 rounded bg-[#00A884]/20 hover:bg-[#00A884]/30 text-[#00A884]"
                  title="Analizar TODO"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={exportarExcel}
                  className="p-1.5 rounded bg-[#00A884]/20 hover:bg-[#00A884]/30 text-[#00A884]"
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
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="Buscar o empezar un chat"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg text-white placeholder-white/40 focus:outline-none"
                style={{ background: '#2A3942' }}
              />
            </div>

            {/* Stats */}
            <div className="flex gap-1 text-[9px]">
              <div className="flex-1 text-center py-1 rounded" style={{ background: '#2A3942' }}>
                <span className="text-white font-bold">{chats.length}</span>
                <span className="text-white/40 ml-0.5">chats</span>
              </div>
              <div className="flex-1 text-center py-1 rounded" style={{ background: '#2A3942' }}>
                <span className="text-[#00A884] font-bold">{allMensajes.length}</span>
                <span className="text-white/40 ml-0.5">msgs</span>
              </div>
              <div className="flex-1 text-center py-1 rounded" style={{ background: '#2A3942' }}>
                <span className="text-[#25D366] font-bold">
                  {chats.reduce((s, c) => s + c.mensajes_nuevos, 0)}
                </span>
                <span className="text-white/40 ml-0.5">24h</span>
              </div>
            </div>
          </div>

          {/* Lista de chats */}
          <div className="flex-1 overflow-y-auto">
            {loading && chats.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-[#00A884] animate-spin" />
              </div>
            ) : chatsFiltrados.length === 0 ? (
              <div className="text-center py-8 text-white/30 text-xs">No hay chats</div>
            ) : (
              chatsFiltrados.map((chat) => (
                <div
                  key={chat.chat_id}
                  onClick={() => seleccionarChat(chat)}
                  className={`px-3 py-2.5 cursor-pointer border-b transition-colors ${
                    selectedChat?.chat_id === chat.chat_id 
                      ? 'bg-[#2A3942]' 
                      : 'hover:bg-[#202C33]'
                  }`}
                  style={{ borderColor: '#222D34' }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                      chat.es_grupo ? 'bg-[#00A884]/20' : 'bg-[#25D366]/20'
                    }`}>
                      {chat.es_grupo ? (
                        <Users className="w-6 h-6 text-[#00A884]" />
                      ) : (
                        <User className="w-6 h-6 text-[#25D366]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-white text-sm font-normal truncate pr-2">
                          {chat.chat_nombre}
                        </h4>
                        <span className="text-[11px] text-white/40 flex-shrink-0">
                          {formatTiempo(chat.ultima_actividad)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-white/50 text-[13px] truncate pr-2">
                          {chat.ultimo_mensaje?.substring(0, 35)}...
                        </p>
                        {chat.mensajes_nuevos > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-[#25D366] text-white text-[10px] font-medium">
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
            RESIZE HANDLE
        ══════════════════════════════════════════════════════════════════ */}
        <div
          onMouseDown={handleMouseDown}
          className="w-1 cursor-col-resize hover:bg-[#00A884]/50 transition-colors flex items-center justify-center group"
          style={{ background: isResizing ? '#00A884' : '#2A3942' }}
        >
          <GripVertical className="w-3 h-3 text-white/30 group-hover:text-white/60" />
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            PANEL DERECHO - Mensajes (Estilo WhatsApp)
        ══════════════════════════════════════════════════════════════════ */}
        <div 
          className="flex-1 flex flex-col min-w-0"
          style={{ 
            background: '#0B141A',
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h100v100H0z\' fill=\'%230B141A\'/%3E%3Cpath d=\'M10 10h2v2h-2zM30 30h2v2h-2zM50 10h2v2h-2zM70 50h2v2h-2zM90 30h2v2h-2zM20 70h2v2h-2zM60 80h2v2h-2zM80 90h2v2h-2z\' fill=\'%23182229\' opacity=\'.3\'/%3E%3C/svg%3E")'
          }}
        >
          {selectedChat ? (
            <>
              {/* Header del chat */}
              <div 
                className="px-4 py-2.5 flex items-center justify-between flex-shrink-0"
                style={{ background: '#202C33' }}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    selectedChat.es_grupo ? 'bg-[#00A884]/20' : 'bg-[#25D366]/20'
                  }`}>
                    {selectedChat.es_grupo ? (
                      <Users className="w-5 h-5 text-[#00A884]" />
                    ) : (
                      <User className="w-5 h-5 text-[#25D366]" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-white font-medium text-base">{selectedChat.chat_nombre}</h3>
                    <p className="text-white/50 text-xs">{mensajes.length} mensajes</p>
                  </div>
                </div>
                <button
                  onClick={() => analizarConIA('chat')}
                  disabled={analyzing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                  style={{ background: '#00A884', color: 'white' }}
                >
                  {analyzing && analisisTipo === 'chat' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Brain className="w-4 h-4" />
                  )}
                  <span>Analizar</span>
                </button>
              </div>

              {/* Mensajes */}
              <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0">
                {loadingMensajes ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 text-[#00A884] animate-spin" />
                  </div>
                ) : mensajes.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-white/30 text-sm">
                    No hay mensajes
                  </div>
                ) : (
                  <div className="space-y-1">
                    {mensajes.map((msg, idx) => {
                      const fecha = new Date(msg.timestamp);
                      const fechaAnterior = idx > 0 ? new Date(mensajes[idx - 1].timestamp) : null;
                      const esNuevoDia = !fechaAnterior || fecha.toDateString() !== fechaAnterior.toDateString();

                      return (
                        <React.Fragment key={msg.id}>
                          {/* Separador de día */}
                          {esNuevoDia && (
                            <div className="flex items-center justify-center py-2">
                              <span 
                                className="px-3 py-1 rounded-lg text-[11px] text-white/70"
                                style={{ background: '#182229' }}
                              >
                                {fecha.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
                              </span>
                            </div>
                          )}

                          {/* Burbuja de mensaje - Estilo WhatsApp */}
                          <div className="flex justify-start mb-0.5">
                            <div 
                              className="max-w-[75%] rounded-lg px-2.5 py-1.5 relative"
                              style={{ 
                                background: '#202C33',
                                borderRadius: '7.5px'
                              }}
                            >
                              {/* Nombre del remitente (solo en grupos) */}
                              {selectedChat.es_grupo && (
                                <p 
                                  className="text-[12.5px] font-medium mb-0.5"
                                  style={{ color: '#00A884' }}
                                >
                                  {msg.remitente || 'Desconocido'}
                                </p>
                              )}

                              {/* Imagen si existe */}
                              {msg.media_url && esImagen(msg.media_url, msg.media_type) && (
                                <div 
                                  className="mb-1 cursor-pointer"
                                  onClick={() => setImagenExpandida(msg.media_url!)}
                                >
                                  <img 
                                    src={msg.media_url} 
                                    alt="Media" 
                                    className="max-w-full rounded-md max-h-[300px] object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                </div>
                              )}

                              {/* Archivo adjunto si no es imagen */}
                              {msg.media_url && !esImagen(msg.media_url, msg.media_type) && (
                                <a 
                                  href={msg.media_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 p-2 rounded mb-1"
                                  style={{ background: '#182229' }}
                                >
                                  <FileText className="w-8 h-8 text-[#00A884]" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-white text-sm truncate">
                                      {msg.media_filename || 'Archivo'}
                                    </p>
                                    <p className="text-white/40 text-xs">
                                      {msg.media_type || 'documento'}
                                    </p>
                                  </div>
                                  <Download className="w-5 h-5 text-white/40" />
                                </a>
                              )}

                              {/* Texto del mensaje */}
                              {msg.mensaje && (
                                <p className="text-[14.2px] text-white/90 whitespace-pre-wrap break-words">
                                  {msg.mensaje}
                                </p>
                              )}

                              {/* Hora */}
                              <p className="text-[10px] text-white/40 text-right mt-0.5 -mb-0.5">
                                {formatHora(msg.timestamp)}
                              </p>
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })}
                    <div ref={mensajesEndRef} />
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Estado vacío */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-20 h-20 text-white/10 mx-auto mb-4" />
                <h3 className="text-white/40 text-lg mb-1">Selecciona un chat</h3>
                <p className="text-white/25 text-sm">
                  Elige una conversación para ver los mensajes
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            MODAL ANÁLISIS IA
        ══════════════════════════════════════════════════════════════════ */}
        {showAnalisis && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <div 
              className="w-full max-w-2xl max-h-[80vh] m-4 rounded-xl flex flex-col overflow-hidden"
              style={{ background: '#111B21', border: '1px solid #2A3942' }}
            >
              <div 
                className="px-4 py-3 flex items-center justify-between"
                style={{ background: '#202C33' }}
              >
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-[#00A884]" />
                  <h3 className="text-white font-medium">
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
                    <Loader2 className="w-8 h-8 text-[#00A884] animate-spin mb-3" />
                    <p className="text-white/40 text-sm">Analizando...</p>
                  </div>
                ) : (
                  <div className="text-white/85 whitespace-pre-wrap text-sm leading-relaxed">
                    {analisisResult}
                  </div>
                )}
              </div>
              <div className="px-4 py-2 border-t flex justify-end" style={{ borderColor: '#2A3942' }}>
                <button
                  onClick={() => setShowAnalisis(false)}
                  className="px-4 py-1.5 rounded text-white text-sm"
                  style={{ background: '#00A884' }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            MODAL IMAGEN EXPANDIDA
        ══════════════════════════════════════════════════════════════════ */}
        {imagenExpandida && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 cursor-pointer"
            onClick={() => setImagenExpandida(null)}
          >
            <button
              onClick={() => setImagenExpandida(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={imagenExpandida} 
              alt="Imagen" 
              className="max-w-[90vw] max-h-[90vh] object-contain"
            />
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="fixed bottom-4 right-4 z-50 p-3 rounded-lg flex items-center gap-2 max-w-sm" style={{ background: '#F15C6D', color: 'white' }}>
          <AlertTriangle className="w-4 h-4" />
          <p className="text-xs flex-1">{error}</p>
          <button onClick={() => setError(null)}><X className="w-3 h-3" /></button>
        </div>
      )}
    </ModuleTemplate>
  );
};

export default WhatsAppMonitorModule;
