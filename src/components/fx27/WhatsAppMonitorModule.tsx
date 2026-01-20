import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, Users, User, Loader2, Brain, AlertTriangle, 
  FileSpreadsheet, RefreshCw, Sparkles, MessageSquare, X,
  FileText, Download, GripVertical
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

  const [panelWidth, setPanelWidth] = useState(350);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
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
      setPanelWidth(Math.max(280, Math.min(500, newWidth)));
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
  // CARGAR TODOS LOS MENSAJES - SIN LÍMITE PARA TRAER TODO
  // ═══════════════════════════════════════════════════════════════════════════
  const cargarDatos = useCallback(async () => {
    try {
      // Traer TODOS los mensajes sin límite
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/whatsapp_mensajes?select=*&order=timestamp.desc`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Range': '0-99999', // Aumentar rango para traer más
            'Prefer': 'count=none'
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

      // Actualizar mensajes del chat seleccionado si existe
      if (selectedChat) {
        const mensajesChat = data
          .filter(m => m.chat_id === selectedChat.chat_id)
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        setMensajes(mensajesChat);
      }
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message);
      setConnected(false);
      setLoading(false);
    }
  }, [selectedChat]);

  // Polling cada 5 segundos
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
    const hoy = new Date();
    const diffMs = hoy.getTime() - f.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins} min`;
    
    // Si es hoy, mostrar hora
    if (f.toDateString() === hoy.toDateString()) {
      return f.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    }
    
    // Si es ayer
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);
    if (f.toDateString() === ayer.toDateString()) {
      return 'Ayer';
    }
    
    // Más de ayer
    return f.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' });
  };

  const formatHora = (fecha: string) => 
    new Date(fecha).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

  const chatsFiltrados = chats.filter(c =>
    c.chat_nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      {/* Contenedor con altura fija relativa al viewport */}
      <div 
        ref={containerRef}
        className="flex overflow-hidden rounded-xl shadow-lg"
        style={{ 
          height: 'calc(100vh - 200px)',
          minHeight: '500px',
          userSelect: isResizing ? 'none' : 'auto'
        }}
      >
        
        {/* ══════════════════════════════════════════════════════════════════
            PANEL IZQUIERDO - Lista de Chats - FONDO BLANCO
        ══════════════════════════════════════════════════════════════════ */}
        <div 
          className="flex-shrink-0 flex flex-col"
          style={{ 
            width: panelWidth,
            background: '#FFFFFF',
            borderRight: '1px solid #E0E0E0'
          }}
        >
          {/* Header panel */}
          <div 
            className="p-3 space-y-3 flex-shrink-0"
            style={{ 
              background: '#F0F2F5',
              borderBottom: '1px solid #E0E0E0'
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-xs font-medium text-gray-600">
                  {connected ? 'En vivo' : 'Desconectado'}
                </span>
                <span className="text-xs text-gray-400">
                  • {formatTiempo(lastUpdate.toISOString())}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => analizarConIA('global')}
                  disabled={analyzing}
                  className="p-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white transition-colors"
                  title="Analizar TODO con IA"
                >
                  <Sparkles className="w-4 h-4" />
                </button>
                <button
                  onClick={exportarExcel}
                  className="p-2 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors"
                  title="Exportar Excel"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                </button>
                <button
                  onClick={cargarDatos}
                  disabled={loading}
                  className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-600 transition-colors"
                  title="Actualizar"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar o empezar un chat"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg bg-white border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Stats */}
            <div className="flex gap-2">
              <div className="flex-1 text-center py-2 rounded-lg bg-white border border-gray-200">
                <span className="text-sm font-bold text-gray-900">{chats.length}</span>
                <span className="text-xs text-gray-500 ml-1">chats</span>
              </div>
              <div className="flex-1 text-center py-2 rounded-lg bg-white border border-gray-200">
                <span className="text-sm font-bold text-blue-600">{allMensajes.length}</span>
                <span className="text-xs text-gray-500 ml-1">msgs</span>
              </div>
              <div className="flex-1 text-center py-2 rounded-lg bg-white border border-gray-200">
                <span className="text-sm font-bold text-green-600">
                  {chats.reduce((s, c) => s + c.mensajes_nuevos, 0)}
                </span>
                <span className="text-xs text-gray-500 ml-1">24h</span>
              </div>
            </div>
          </div>

          {/* Lista de chats scrolleable */}
          <div className="flex-1 overflow-y-auto">
            {loading && chats.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
              </div>
            ) : chatsFiltrados.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No hay chats</p>
              </div>
            ) : (
              chatsFiltrados.map((chat) => (
                <div
                  key={chat.chat_id}
                  onClick={() => seleccionarChat(chat)}
                  className={`px-4 py-3 cursor-pointer transition-all border-b border-gray-100 ${
                    selectedChat?.chat_id === chat.chat_id 
                      ? 'bg-gray-100' 
                      : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                      chat.es_grupo ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      {chat.es_grupo ? (
                        <Users className="w-6 h-6 text-blue-600" />
                      ) : (
                        <User className="w-6 h-6 text-green-600" />
                      )}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h4 className="text-[15px] font-medium text-gray-900 truncate pr-2">
                          {chat.chat_nombre}
                        </h4>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {formatTiempo(chat.ultima_actividad)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500 truncate pr-2">
                          {chat.ultimo_mensaje?.substring(0, 35)}...
                        </p>
                        {chat.mensajes_nuevos > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-green-500 text-white text-xs font-bold flex-shrink-0">
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
          className="w-1.5 cursor-col-resize flex items-center justify-center hover:bg-green-200 transition-colors"
          style={{ background: isResizing ? '#22C55E' : '#E5E7EB' }}
        >
          <GripVertical className="w-3 h-3 text-gray-400" />
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            PANEL DERECHO - Mensajes - ESTILO WHATSAPP CLARO
        ══════════════════════════════════════════════════════════════════ */}
        <div 
          className="flex-1 flex flex-col min-w-0"
          style={{ 
            background: selectedChat ? '#E5DDD5' : '#F0F2F5'
          }}
        >
          {selectedChat ? (
            <>
              {/* Header del chat - FIJO */}
              <div 
                className="px-4 py-3 flex items-center justify-between flex-shrink-0"
                style={{ 
                  background: '#F0F2F5',
                  borderBottom: '1px solid #E0E0E0'
                }}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    selectedChat.es_grupo ? 'bg-blue-100' : 'bg-green-100'
                  }`}>
                    {selectedChat.es_grupo ? (
                      <Users className="w-5 h-5 text-blue-600" />
                    ) : (
                      <User className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">{selectedChat.chat_nombre}</h3>
                    <p className="text-xs text-gray-500">{mensajes.length} mensajes</p>
                  </div>
                </div>
                <button
                  onClick={() => analizarConIA('chat')}
                  disabled={analyzing}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {analyzing && analisisTipo === 'chat' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Brain className="w-4 h-4" />
                  )}
                  <span>Analizar</span>
                </button>
              </div>

              {/* Área de mensajes - SCROLLEABLE */}
              <div 
                className="flex-1 overflow-y-auto px-6 py-4"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4ccc4' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}
              >
                {loadingMensajes ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
                  </div>
                ) : mensajes.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    No hay mensajes en este chat
                  </div>
                ) : (
                  <div className="space-y-2">
                    {mensajes.map((msg, idx) => {
                      const fecha = new Date(msg.timestamp);
                      const fechaAnterior = idx > 0 ? new Date(mensajes[idx - 1].timestamp) : null;
                      const esNuevoDia = !fechaAnterior || fecha.toDateString() !== fechaAnterior.toDateString();

                      return (
                        <React.Fragment key={msg.id}>
                          {/* Separador de día */}
                          {esNuevoDia && (
                            <div className="flex items-center justify-center py-3">
                              <span className="px-4 py-1.5 rounded-lg bg-white text-gray-600 text-xs font-medium shadow-sm">
                                {fecha.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
                              </span>
                            </div>
                          )}

                          {/* Burbuja de mensaje */}
                          <div className="flex justify-start">
                            <div 
                              className="max-w-[70%] rounded-lg px-3 py-2 shadow-sm"
                              style={{ background: '#FFFFFF' }}
                            >
                              {/* Nombre remitente en grupos */}
                              {selectedChat.es_grupo && (
                                <p className="text-xs font-semibold mb-1" style={{ color: '#00A884' }}>
                                  {msg.remitente || 'Desconocido'}
                                </p>
                              )}

                              {/* Imagen */}
                              {msg.media_url && esImagen(msg.media_url, msg.media_type) && (
                                <div 
                                  className="mb-2 cursor-pointer"
                                  onClick={() => setImagenExpandida(msg.media_url!)}
                                >
                                  <img 
                                    src={msg.media_url} 
                                    alt="Media" 
                                    className="max-w-full rounded max-h-[250px] object-cover"
                                  />
                                </div>
                              )}

                              {/* Archivo */}
                              {msg.media_url && !esImagen(msg.media_url, msg.media_type) && (
                                <a 
                                  href={msg.media_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 p-2 rounded bg-gray-50 mb-2 hover:bg-gray-100 transition-colors"
                                >
                                  <FileText className="w-8 h-8 text-blue-500" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-900 truncate">{msg.media_filename || 'Archivo'}</p>
                                    <p className="text-xs text-gray-400">{msg.media_type || 'documento'}</p>
                                  </div>
                                  <Download className="w-4 h-4 text-gray-400" />
                                </a>
                              )}

                              {/* Texto */}
                              {msg.mensaje && (
                                <p className="text-[14.5px] text-gray-800 whitespace-pre-wrap break-words leading-relaxed">
                                  {msg.mensaje}
                                </p>
                              )}

                              {/* Hora */}
                              <p className="text-[10px] text-gray-400 text-right mt-1">
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
            /* Estado vacío cuando no hay chat seleccionado */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center">
                  <MessageSquare className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-medium text-gray-600 mb-2">Selecciona un chat</h3>
                <p className="text-sm text-gray-400">
                  Elige una conversación de la lista para ver los mensajes
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            MODAL ANÁLISIS IA
        ══════════════════════════════════════════════════════════════════ */}
        {showAnalisis && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
            <div className="w-full max-w-2xl max-h-[80vh] m-4 rounded-xl bg-white flex flex-col overflow-hidden shadow-2xl">
              <div className="px-5 py-4 bg-orange-500 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <Brain className="w-6 h-6 text-white" />
                  <h3 className="text-white font-semibold text-lg">
                    Análisis IA - {analisisTipo === 'global' ? 'Todos los Chats' : selectedChat?.chat_nombre}
                  </h3>
                </div>
                <button
                  onClick={() => setShowAnalisis(false)}
                  className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                {analyzing ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
                    <p className="text-gray-500">Analizando conversaciones...</p>
                  </div>
                ) : (
                  <div className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                    {analisisResult}
                  </div>
                )}
              </div>
              <div className="px-5 py-3 border-t bg-gray-50 flex justify-end flex-shrink-0">
                <button
                  onClick={() => setShowAnalisis(false)}
                  className="px-5 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal imagen expandida */}
        {imagenExpandida && (
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 cursor-pointer"
            onClick={() => setImagenExpandida(null)}
          >
            <button
              onClick={() => setImagenExpandida(null)}
              className="absolute top-4 right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={imagenExpandida} 
              alt="Imagen" 
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
            />
          </div>
        )}
      </div>

      {/* Error toast */}
      {error && (
        <div className="fixed bottom-4 right-4 z-[100] p-4 rounded-lg bg-red-500 text-white flex items-center gap-3 max-w-md shadow-lg">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm flex-1">{error}</p>
          <button onClick={() => setError(null)} className="p-1 hover:bg-white/20 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </ModuleTemplate>
  );
};

export default WhatsAppMonitorModule;
