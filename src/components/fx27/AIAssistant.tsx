import { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Minimize2 } from 'lucide-react';

interface Message {
  id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: 'assistant',
      content: '¡Hola! Soy tu asistente inteligente del sistema FX27. Estoy aquí para ayudarte con dudas sobre el CRM, logística, operaciones de transporte, uso de módulos y cualquier funcionalidad del sistema. ¿En qué puedo ayudarte?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Sistema de prompt acotado - Solo responde temas del sistema
  const getAIResponse = async (userMessage: string): Promise<string> => {
    // Palabras clave permitidas
    const allowedTopics = [
      'crm', 'logistica', 'transporte', 'viaje', 'unidad', 'tractocamion', 'remolque',
      'operacion', 'despacho', 'cliente', 'lead', 'oportunidad', 'cotizacion', 'venta',
      'kpi', 'dashboard', 'modulo', 'carroll', 'dedicados', 'refrigerado', 'congelado',
      'ruta', 'destino', 'origen', 'entrega', 'retraso', 'temperatura', 'monitoreo',
      'administracion', 'configuracion', 'usuario', 'rol', 'permiso', 'fx27', 'sistema',
      'ayuda', 'como', 'donde', 'cuando', 'que', 'quien', 'reportes', 'exportar',
      'filtro', 'buscar', 'agregar', 'editar', 'eliminar', 'guardar', 'actualizar'
    ];

    const messageLower = userMessage.toLowerCase();
    const isRelevant = allowedTopics.some(topic => messageLower.includes(topic));

    // Si no es relevante al sistema, respuesta de redirección
    if (!isRelevant && userMessage.length > 10) {
      return 'Lo siento, solo puedo ayudarte con temas relacionados al sistema FX27, logística y operaciones de transporte. ¿Tienes alguna duda sobre el CRM, los módulos, operaciones o funcionalidades del sistema?';
    }

    // Respuestas contextuales del sistema
    if (messageLower.includes('dedicados') || messageLower.includes('carroll')) {
      return 'El módulo **Dedicados** es específico para Granjas Carroll. Incluye 3 vistas:\n\n1. **Administración Carroll** (Operaciones): Gestión completa de las 26 unidades dedicadas, creación de viajes, asignación de rutas.\n\n2. **Monitor Carroll** (Desarrollo): Seguimiento en tiempo real, KPIs, alertas y control de temperatura.\n\n3. **Vista Clientes** (Cliente): Vista de solo consulta para que el cliente vea el estatus de sus embarques.\n\n¿Necesitas ayuda con alguna funcionalidad específica?';
    }

    if (messageLower.includes('agregar') && (messageLower.includes('viaje') || messageLower.includes('unidad'))) {
      return 'Para agregar un viaje en el módulo Dedicados:\n\n1. Accede a **Administración Carroll**\n2. Haz clic en el botón **"+ Nuevo Viaje"**\n3. Completa los campos: Unidad, Remolque, Origen, Destino, Tipo de carga, Temperatura requerida\n4. El sistema valida automáticamente que no haya duplicados\n5. Guarda y el viaje quedará registrado con trazabilidad completa\n\n¿Necesitas más detalles?';
    }

    if (messageLower.includes('temperatura') || messageLower.includes('refrigerad') || messageLower.includes('congelad')) {
      return 'El sistema monitorea temperatura en tiempo real para cargas refrigeradas y congeladas:\n\n• **Refrigerado**: 0°C a 4°C\n• **Congelado**: -18°C a -25°C\n\nSi la temperatura sale del rango, se genera una **alerta automática** visible en el Monitor Carroll. El cliente también puede ver la temperatura actual en su Vista de Clientes.\n\n¿Quieres saber más sobre alertas?';
    }

    if (messageLower.includes('kpi') || messageLower.includes('reporte') || messageLower.includes('exportar')) {
      return 'El sistema FX27 incluye múltiples KPIs y reportes:\n\n📊 **KPIs principales:**\n• Entregas del día\n• Puntuación de puntualidad\n• Unidades activas\n• Retrasos y alertas\n\n📄 **Exportación:**\nPuedes exportar reportes en formato Excel o PDF desde cualquier módulo usando el botón "Exportar reporte" en la esquina superior derecha.\n\n¿Qué tipo de reporte necesitas?';
    }

    if (messageLower.includes('usuario') || messageLower.includes('rol') || messageLower.includes('permiso')) {
      return 'El sistema FX27 tiene 4 roles de usuario:\n\n1. **Administrador**: Acceso total a todos los módulos\n2. **Ventas**: Acceso a leads, oportunidades, cotizaciones\n3. **Operaciones**: Acceso a operaciones, despacho, equipos\n4. **Custom**: Permisos personalizados según necesidades\n\nLos permisos se configuran en el módulo **Configuración** (solo administradores).\n\n¿Necesitas ayuda con la configuración?';
    }

    if (messageLower.includes('como') && messageLower.includes('modulo')) {
      return 'Desde el **Dashboard principal** puedes acceder a todos los módulos:\n\n🔹 **Módulos principales:**\n• Agregar Lead\n• Panel de Oportunidades\n• Operaciones\n• Despacho Inteligente\n• Control de Equipo\n• KPIs\n• Configuración\n• Cotizaciones\n• Ventas\n• Utilerías\n• Clientes\n• Dedicados\n\nSimplemente haz clic en cualquier tarjeta para acceder. ¿Qué módulo te interesa?';
    }

    // Respuesta genérica del sistema
    return 'Entiendo tu pregunta sobre el sistema. Puedo ayudarte con:\n\n• **Módulos**: Cómo usar cada sección del CRM\n• **Operaciones**: Crear viajes, asignar unidades, rutas\n• **Logística**: Seguimiento, KPIs, reportes\n• **Clientes**: Gestión de leads, oportunidades, cotizaciones\n• **Equipos**: Control de tractocamiones y remolques\n• **Configuración**: Usuarios, roles y permisos\n\n¿Podrías darme más detalles de lo que necesitas?';
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    // Agregar mensaje del usuario
    const userMessage: Message = {
      id: messages.length + 1,
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simular delay de respuesta
    setTimeout(async () => {
      const aiResponse = await getAIResponse(inputValue);
      
      const assistantMessage: Message = {
        id: messages.length + 2,
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 800);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* ========== BOTÓN FLOTANTE ========== */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-8 right-8 z-50 flex items-center justify-center transition-all duration-300 group"
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #1E66F5 0%, #0ea5e9 100%)',
            boxShadow: '0 8px 24px rgba(30, 102, 245, 0.4)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            opacity: 0.65,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(30, 102, 245, 0.5)';
            e.currentTarget.style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(30, 102, 245, 0.4)';
            e.currentTarget.style.opacity = '0.65';
          }}
        >
          <Sparkles className="w-5 h-5 text-white" strokeWidth={2} />
          
          {/* Pulso animado */}
          <div 
            className="absolute inset-0 rounded-full animate-ping"
            style={{
              background: 'rgba(30, 102, 245, 0.4)',
              animationDuration: '2s'
            }}
          />
        </button>
      )}

      {/* ========== PANEL DE CHAT ========== */}
      {isOpen && (
        <div
          className="fixed bottom-8 right-8 z-50 flex flex-col"
          style={{
            width: '420px',
            height: '600px',
            background: '#1F2630',
            borderRadius: '20px',
            border: '1px solid #323A46',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
            overflow: 'hidden'
          }}
        >
          {/* HEADER */}
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{
              background: 'linear-gradient(135deg, #1E66F5 0%, #0ea5e9 100%)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center"
                style={{
                  width: '36px',
                  height: '36px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '10px'
                }}
              >
                <Sparkles className="w-5 h-5 text-white" strokeWidth={2} />
              </div>
              <div>
                <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>
                  Asistente FX27
                </h3>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', color: 'rgba(255, 255, 255, 0.8)' }}>
                  Especializado en logística y CRM
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center transition-all duration-200"
                style={{
                  width: '32px',
                  height: '32px',
                  background: 'rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                }}
              >
                <X className="w-4 h-4 text-white" strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* MENSAJES */}
          <div
            className="flex-1 overflow-y-auto p-4 space-y-4"
            style={{
              background: '#181E27'
            }}
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className="max-w-[85%] rounded-2xl px-4 py-3"
                  style={{
                    background: message.role === 'user' 
                      ? 'linear-gradient(135deg, #1E66F5 0%, #0ea5e9 100%)'
                      : '#252C38',
                    border: message.role === 'assistant' ? '1px solid #323A46' : 'none'
                  }}
                >
                  <p
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '13px',
                      lineHeight: '1.6',
                      color: '#FFFFFF',
                      whiteSpace: 'pre-line'
                    }}
                  >
                    {message.content}
                  </p>
                  <p
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '9px',
                      color: 'rgba(255, 255, 255, 0.5)',
                      marginTop: '6px'
                    }}
                  >
                    {message.timestamp.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {/* Indicador de escritura */}
            {isTyping && (
              <div className="flex justify-start">
                <div
                  className="rounded-2xl px-4 py-3"
                  style={{
                    background: '#252C38',
                    border: '1px solid #323A46'
                  }}
                >
                  <div className="flex gap-1">
                    <div
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{ background: '#1E66F5', animationDelay: '0ms' }}
                    />
                    <div
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{ background: '#1E66F5', animationDelay: '150ms' }}
                    />
                    <div
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{ background: '#1E66F5', animationDelay: '300ms' }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* INPUT */}
          <div
            className="p-4"
            style={{
              background: '#1F2630',
              borderTop: '1px solid #323A46'
            }}
          >
            <div
              className="flex items-center gap-2 px-4 py-3 rounded-xl"
              style={{
                background: '#252C38',
                border: '1px solid #323A46'
              }}
            >
              <input
                type="text"
                placeholder="Pregunta sobre el sistema..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 bg-transparent outline-none"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '13px',
                  color: '#FFFFFF'
                }}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                className="flex items-center justify-center transition-all duration-200"
                style={{
                  width: '36px',
                  height: '36px',
                  background: inputValue.trim() ? 'linear-gradient(135deg, #1E66F5 0%, #0ea5e9 100%)' : '#323A46',
                  borderRadius: '10px',
                  cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
                  opacity: inputValue.trim() ? 1 : 0.5
                }}
              >
                <Send className="w-4 h-4 text-white" strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
