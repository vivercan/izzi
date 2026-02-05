import { useState, useEffect, useRef } from 'react';
import { ModuleTemplate } from './ModuleTemplate';
import { MODULE_IMAGES } from '../../assets/module-images';
import { UserPlus, Users, Send, Mail, User, Plus, X, Clock, CheckCircle2, AlertCircle, FileText, Eye, Loader2, ArrowLeft, Building2, Phone, MapPin, CreditCard, Upload, Download, Trash2, Scale, Shield, ShieldAlert, ShieldCheck, FileWarning, ChevronDown, ChevronUp, AlertTriangle, FileDown, RotateCcw } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface ClientesModuleProps {
  onBack: () => void;
}

interface Solicitud {
  id: string;
  email_cliente: string;
  nombre_cliente: string;
  apellido_cliente: string;
  razon_social: string;
  rfc_mc: string;
  tipo_empresa: string;
  estatus: string;
  enviado_por: string;
  created_at: string;
  fecha_completado: string;
  // Datos completos del formulario
  giro: string;
  direccion_completa: string;
  tel_oficina: string;
  whatsapp: string;
  contacto_admin_nombre: string;
  contacto_admin_email: string;
  contacto_facturas_nombre: string;
  contacto_facturas_email: string;
  nombre_rep_legal: string;
  firma_aceptada: boolean;
  firma_fecha: string;
  firma_ip: string;
}

interface Documento {
  id: string;
  tipo_documento: string;
  nombre_archivo: string;
  ruta_storage: string;
  created_at: string;
}

// ═══════════════════════════════════════════════════════════
// INTERFACES PARA ANÁLISIS DE CONTRATOS
// ═══════════════════════════════════════════════════════════
interface RiesgoContrato {
  clausula: string;
  descripcion: string;
  severidad: 'ALTA' | 'MEDIA' | 'BAJA';
  sugerencia: string;
}

interface AnalisisContrato {
  datos_extraidos: {
    representante_legal: string;
    notaria: string;
    numero_escritura: string;
    fecha_contrato: string;
    partes: string[];
    objeto_contrato: string;
    vigencia: string;
    monto_o_tarifa: string;
  };
  es_leonino: boolean;
  explicacion_leonino: string;
  riesgos: RiesgoContrato[];
  resumen_ejecutivo: string;
  clausulas_faltantes: string[];
  version_blindada: string;
  calificacion_riesgo: number; // 1-10
}

type Vista = 'hub' | 'nueva-alta' | 'clientes' | 'detalle-cliente' | 'analisis-contratos';

export const ClientesModule = ({ onBack }: ClientesModuleProps) => {
  const [vista, setVista] = useState<Vista>('hub');
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<Solicitud | null>(null);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [cargando, setCargando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState<{tipo: 'success' | 'error', texto: string} | null>(null);

  // Form state para Nueva Alta
  const [emailCliente, setEmailCliente] = useState('');
  const [emailClienteConfirm, setEmailClienteConfirm] = useState('');
  // Auto-capitalizar nombre (Primera letra mayúscula)
  const capitalizar = (texto: string) => {
    return texto.toLowerCase().split(' ').map(palabra =>
      palabra.charAt(0).toUpperCase() + palabra.slice(1)
    ).join(' ');
  };


  const [nombreCliente, setNombreCliente] = useState('');
  const [apellidoCliente, setApellidoCliente] = useState('');
  const [tipoEmpresa, setTipoEmpresa] = useState<'MEXICANA' | 'USA_CANADA'>('MEXICANA');
  const [emailsAdicionales, setEmailsAdicionales] = useState<string[]>([]);
  const [nuevoEmailAdicional, setNuevoEmailAdicional] = useState('');

  // ═══════════════════════════════════════════════════════════
  // STATE PARA ANÁLISIS DE CONTRATOS
  // ═══════════════════════════════════════════════════════════
  const [archivoContrato, setArchivoContrato] = useState<File | null>(null);
  const [archivoBase64, setArchivoBase64] = useState<string>('');
  const [analizandoContrato, setAnalizandoContrato] = useState(false);
  const [analisisResultado, setAnalisisResultado] = useState<AnalisisContrato | null>(null);
  const [analisisError, setAnalisisError] = useState<string>('');
  const [seccionesAbiertas, setSeccionesAbiertas] = useState<Record<string, boolean>>({
    datos: true,
    leonino: true,
    riesgos: true,
    faltantes: true,
    resumen: true,
    blindado: false,
  });
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getUserEmail = () => {
    try {
      const session = localStorage.getItem('fx27-session');
      if (session) return JSON.parse(session).email || '';
    } catch (e) {}
    return '';
  };

  const cargarSolicitudes = async () => {
    try {
      setCargando(true);
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/alta-clientes`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      const data = await response.json();
      if (data.success) setSolicitudes(data.solicitudes || []);
    } catch (error) {
      console.error('Error cargando solicitudes:', error);
    } finally {
      setCargando(false);
    }
  };

  const cargarDocumentos = async (solicitudId: string) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/alta-cliente/${solicitudId}/documentos`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      const data = await response.json();
      if (data.success) setDocumentos(data.documentos || []);
    } catch (error) {
      console.error('Error cargando documentos:', error);
    }
  };

  const verDetalleCliente = async (solicitud: Solicitud) => {
    setSolicitudSeleccionada(solicitud);
    await cargarDocumentos(solicitud.id);
    setVista('detalle-cliente');
  };

  useEffect(() => {
    if (vista === 'clientes') cargarSolicitudes();
  }, [vista]);

  const agregarEmailAdicional = () => {
    if (nuevoEmailAdicional && nuevoEmailAdicional.includes('@') && !emailsAdicionales.includes(nuevoEmailAdicional)) {
      setEmailsAdicionales([...emailsAdicionales, nuevoEmailAdicional]);
      setNuevoEmailAdicional('');
    }
  };

  const enviarSolicitud = async () => {
    if (!emailCliente || !emailCliente.includes('@')) {
      setMensaje({ tipo: 'error', texto: 'Ingresa un correo electronico valido' });
      return;
    }
    setEnviando(true);
    setMensaje(null);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/alta-cliente/enviar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${publicAnonKey}` },
        body: JSON.stringify({ emailCliente, nombreCliente, apellidoCliente, emailsAdicionales: nuevoEmailAdicional && nuevoEmailAdicional.includes('@') ? [...emailsAdicionales, nuevoEmailAdicional] : emailsAdicionales, tipoEmpresa, enviadoPor: getUserEmail() })
      });
      const data = await response.json();
      if (data.success) {
        setMensaje({ tipo: 'success', texto: `Solicitud enviada a ${emailCliente}` });
        setEmailCliente(''); setNombreCliente(''); setApellidoCliente(''); setEmailsAdicionales([]);
        setTimeout(() => setVista('hub'), 2000);
      } else {
        setMensaje({ tipo: 'error', texto: data.error || 'Error al enviar' });
      }
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Error de conexion' });
    } finally {
      setEnviando(false);
    }
  };

  const getStatusBadge = (estatus: string) => {
    const styles: Record<string, string> = {
      'COMPLETADA': 'bg-green-500/20 text-green-300 border-green-500/30',
      'EN_PROCESO': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      'ENVIADA': 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    };
    return styles[estatus] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  };

  // ═══════════════════════════════════════════════════════════
  // LÓGICA DE ANÁLISIS DE CONTRATOS
  // ═══════════════════════════════════════════════════════════
  const handleFileSelect = async (file: File) => {
    if (!file) return;
    
    // Validar tipo
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.docx') && !file.name.endsWith('.doc')) {
      setAnalisisError('Solo se aceptan archivos PDF, Word o imágenes (PNG/JPG)');
      return;
    }
    
    // Validar tamaño (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setAnalisisError('El archivo no debe exceder 10MB');
      return;
    }

    setArchivoContrato(file);
    setAnalisisError('');
    setAnalisisResultado(null);

    // Convertir a base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setArchivoBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const analizarContrato = async () => {
    if (!archivoBase64 || !archivoContrato) return;

    setAnalizandoContrato(true);
    setAnalisisError('');
    setAnalisisResultado(null);

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/analizar-contrato`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          archivo_base64: archivoBase64,
          nombre_archivo: archivoContrato.name,
          tipo_archivo: archivoContrato.type || 'application/pdf',
          fecha_analisis: new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }),
        }),
      });

      const data = await response.json();

      if (data.success && data.analisis) {
        setAnalisisResultado(data.analisis);
      } else {
        setAnalisisError(data.error || 'Error al analizar el contrato. Intenta de nuevo.');
      }
    } catch (error) {
      console.error('Error:', error);
      setAnalisisError('Error de conexión al analizar el contrato');
    } finally {
      setAnalizandoContrato(false);
    }
  };

  const toggleSeccion = (seccion: string) => {
    setSeccionesAbiertas(prev => ({ ...prev, [seccion]: !prev[seccion] }));
  };

  const descargarAnalisis = () => {
    if (!analisisResultado) return;
    const r = analisisResultado;

    let contenido = `ANÁLISIS DE CONTRATO - GRUPO LOMA | TROB TRANSPORTES\n`;
    contenido += `${'═'.repeat(60)}\n`;
    contenido += `Fecha de Análisis: ${new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}\n`;
    contenido += `Archivo Analizado: ${archivoContrato?.name || 'N/A'}\n`;
    contenido += `Calificación de Riesgo: ${r.calificacion_riesgo}/10\n\n`;

    contenido += `${'─'.repeat(60)}\n`;
    contenido += `DATOS EXTRAÍDOS\n`;
    contenido += `${'─'.repeat(60)}\n`;
    contenido += `Representante Legal: ${r.datos_extraidos.representante_legal}\n`;
    contenido += `Notaría: ${r.datos_extraidos.notaria}\n`;
    contenido += `No. Escritura: ${r.datos_extraidos.numero_escritura}\n`;
    contenido += `Fecha del Contrato: ${r.datos_extraidos.fecha_contrato}\n`;
    contenido += `Partes: ${r.datos_extraidos.partes.join(' | ')}\n`;
    contenido += `Objeto: ${r.datos_extraidos.objeto_contrato}\n`;
    contenido += `Vigencia: ${r.datos_extraidos.vigencia}\n`;
    contenido += `Monto/Tarifa: ${r.datos_extraidos.monto_o_tarifa}\n\n`;

    contenido += `${'─'.repeat(60)}\n`;
    contenido += `ANÁLISIS LEONINO: ${r.es_leonino ? '⚠️ SÍ - CONTRATO LEONINO DETECTADO' : '✅ NO ES LEONINO'}\n`;
    contenido += `${'─'.repeat(60)}\n`;
    contenido += `${r.explicacion_leonino}\n\n`;

    contenido += `${'─'.repeat(60)}\n`;
    contenido += `PUNTOS DE RIESGO (${r.riesgos.length})\n`;
    contenido += `${'─'.repeat(60)}\n`;
    r.riesgos.forEach((riesgo, i) => {
      contenido += `\n${i + 1}. [${riesgo.severidad}] ${riesgo.clausula}\n`;
      contenido += `   Descripción: ${riesgo.descripcion}\n`;
      contenido += `   Sugerencia: ${riesgo.sugerencia}\n`;
    });

    if (r.clausulas_faltantes.length > 0) {
      contenido += `\n${'─'.repeat(60)}\n`;
      contenido += `CLÁUSULAS FALTANTES\n`;
      contenido += `${'─'.repeat(60)}\n`;
      r.clausulas_faltantes.forEach((c, i) => {
        contenido += `${i + 1}. ${c}\n`;
      });
    }

    contenido += `\n${'─'.repeat(60)}\n`;
    contenido += `RESUMEN EJECUTIVO\n`;
    contenido += `${'─'.repeat(60)}\n`;
    contenido += `${r.resumen_ejecutivo}\n`;

    contenido += `\n${'═'.repeat(60)}\n`;
    contenido += `VERSIÓN BLINDADA / MODIFICACIONES SUGERIDAS\n`;
    contenido += `${'═'.repeat(60)}\n`;
    contenido += `${r.version_blindada}\n`;

    contenido += `\n\n${'═'.repeat(60)}\n`;
    contenido += `Documento generado por FX27 - Análisis de Contratos con IA\n`;
    contenido += `GRUPO LOMA | TROB TRANSPORTES\n`;
    contenido += `${new Date().toLocaleString('es-MX')}\n`;

    const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Analisis_Contrato_${archivoContrato?.name?.replace(/\.[^/.]+$/, '') || 'documento'}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetAnalisis = () => {
    setArchivoContrato(null);
    setArchivoBase64('');
    setAnalisisResultado(null);
    setAnalisisError('');
  };

  const getSeveridadColor = (severidad: string) => {
    switch (severidad) {
      case 'ALTA': return { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.4)', text: '#fca5a5', icon: '#ef4444' };
      case 'MEDIA': return { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)', text: '#fcd34d', icon: '#f59e0b' };
      case 'BAJA': return { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.4)', text: '#93c5fd', icon: '#3b82f6' };
      default: return { bg: 'rgba(107,114,128,0.15)', border: 'rgba(107,114,128,0.4)', text: '#d1d5db', icon: '#6b7280' };
    }
  };

  const getRiesgoGlobalColor = (score: number) => {
    if (score <= 3) return { color: '#22c55e', label: 'BAJO', bg: 'rgba(34,197,94,0.15)' };
    if (score <= 6) return { color: '#f59e0b', label: 'MEDIO', bg: 'rgba(245,158,11,0.15)' };
    return { color: '#ef4444', label: 'ALTO', bg: 'rgba(239,68,68,0.15)' };
  };

  // ═══════════════════════════════════════════════════════════
  // HUB - ESTILO DASHBOARD
  // ═══════════════════════════════════════════════════════════
  const renderHub = () => {
    const botones = [
      { id: 'nueva-alta', nombre: 'Nueva Alta', icon: UserPlus },
      { id: 'clientes', nombre: 'Solicitudes', icon: FileText },
      { id: 'analisis-contratos', nombre: 'Análisis de\nContratos', icon: Scale },
    ];

    return (
      <div className="relative w-full h-full overflow-hidden" style={{ borderRadius: '16px' }}>
        {/* Background - Gradiente AZUL ELÉCTRICO igual que Dashboard */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #001f4d 0%, #003d7a 25%, #0066cc 50%, #1a8fff 75%, #4da6ff 100%)',
            borderRadius: '16px',
          }}
        />
        {/* Overlay oscuro sutil */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.25) 0%, rgba(0, 0, 0, 0.15) 50%, rgba(0, 0, 0, 0.25) 100%)',
            borderRadius: '16px',
          }}
        />
        {/* Halo volumétrico */}
        <div
          className="absolute"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '80%',
            height: '60%',
            background: 'radial-gradient(ellipse at center, rgba(30, 80, 160, 0.08) 0%, rgba(40, 90, 170, 0.04) 35%, transparent 70%)',
            filter: 'blur(60px)',
            pointerEvents: 'none',
          }}
        />

        {/* Título */}
        <div className="relative z-10 pt-10 pb-4 px-12">
          <h2 style={{
            fontFamily: "'Exo 2', sans-serif",
            fontSize: '22px',
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.9)',
          }}>
            Administración de Clientes
          </h2>
        </div>

        {/* Contenido */}
        <div className="relative z-10 px-12 pb-12">
          <div className="flex gap-6">
            {botones.map((btn) => {
              const Icon = btn.icon;
              return (
                <button
                  key={btn.id}
                  onClick={() => setVista(btn.id as Vista)}
                  className="group relative flex flex-col items-center justify-center gap-3 transition-all duration-300"
                  style={{
                    background: 'linear-gradient(155deg, rgba(18, 32, 58, 0.96) 0%, rgba(12, 22, 42, 0.98) 35%, rgba(8, 16, 32, 1) 70%, rgba(6, 12, 24, 1) 100%)',
                    border: '2px solid transparent',
                    backgroundImage: 'linear-gradient(155deg, rgba(18, 32, 58, 0.96) 0%, rgba(12, 22, 42, 0.98) 35%, rgba(8, 16, 32, 1) 70%, rgba(6, 12, 24, 1) 100%), linear-gradient(135deg, rgba(180, 100, 50, 0.28) 0%, rgba(60, 90, 140, 0.25) 50%, rgba(180, 100, 50, 0.28) 100%)',
                    backgroundOrigin: 'border-box',
                    backgroundClip: 'padding-box, border-box',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.25), 0 4px 12px rgba(0, 0, 0, 0.45), 0 8px 24px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.05), inset 0 -1px 0 rgba(0, 0, 0, 0.35), inset 2px 2px 4px rgba(30, 50, 80, 0.12), inset -2px -2px 4px rgba(0, 0, 0, 0.2)',
                    borderRadius: '12px',
                    width: '180px',
                    height: '180px',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-6px)';
                    e.currentTarget.style.backgroundImage = 'linear-gradient(155deg, rgba(28, 48, 82, 1) 0%, rgba(20, 35, 62, 1) 35%, rgba(14, 24, 45, 1) 70%, rgba(10, 18, 35, 1) 100%), linear-gradient(135deg, rgba(240, 160, 80, 0.65) 0%, rgba(220, 140, 70, 0.6) 25%, rgba(70, 110, 170, 0.4) 50%, rgba(220, 140, 70, 0.6) 75%, rgba(240, 160, 80, 0.65) 100%)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.4), 0 16px 32px rgba(0, 0, 0, 0.5), 0 0 30px rgba(240, 160, 80, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.backgroundImage = 'linear-gradient(155deg, rgba(18, 32, 58, 0.96) 0%, rgba(12, 22, 42, 0.98) 35%, rgba(8, 16, 32, 1) 70%, rgba(6, 12, 24, 1) 100%), linear-gradient(135deg, rgba(180, 100, 50, 0.28) 0%, rgba(60, 90, 140, 0.25) 50%, rgba(180, 100, 50, 0.28) 100%)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.25), 0 4px 12px rgba(0, 0, 0, 0.45), 0 8px 24px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.05), inset 0 -1px 0 rgba(0, 0, 0, 0.35), inset 2px 2px 4px rgba(30, 50, 80, 0.12), inset -2px -2px 4px rgba(0, 0, 0, 0.2)';
                  }}
                >
                  <Icon style={{ width: '56px', height: '56px', color: 'rgba(255, 255, 255, 0.7)' }} />
                  <span
                    style={{
                      fontFamily: "'Exo 2', sans-serif",
                      fontSize: '15px',
                      fontWeight: 500,
                      color: 'rgba(255, 255, 255, 0.85)',
                      textAlign: 'center',
                      whiteSpace: 'pre-line',
                      lineHeight: '1.3',
                    }}
                  >
                    {btn.nombre}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // NUEVA ALTA - FORMULARIO
  // ═══════════════════════════════════════════════════════════
  const renderNuevaAlta = () => (
    <div className="p-8 max-w-2xl mx-auto">
      <button onClick={() => setVista('hub')} className="flex items-center gap-2 mb-6 text-white/60 hover:text-white transition-colors">
        <ArrowLeft className="w-5 h-5" />
        <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px' }}>Volver</span>
      </button>

      <div className="rounded-xl p-8" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-xl" style={{ background: 'rgba(254, 80, 0, 0.2)' }}>
            <UserPlus className="w-8 h-8" style={{ color: '#fe5000' }} />
          </div>
          <div>
            <h3 style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '20px', fontWeight: 600, color: '#fff' }}>Nueva Solicitud de Alta</h3>
            <p style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Enviar formulario de registro al cliente</p>
          </div>
        </div>

        {mensaje && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-10 ${mensaje.tipo === 'success' ? 'bg-green-500/20 border border-green-500/30' : 'bg-red-500/20 border border-red-500/30'}`}>
            {mensaje.tipo === 'success' ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <AlertCircle className="w-5 h-5 text-red-400" />}
            <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', color: mensaje.tipo === 'success' ? '#86efac' : '#fca5a5' }}>{mensaje.texto}</span>
          </div>
        )}

        {/* Tipo de empresa */}
        <div className="mb-6">
          <label style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '8px' }}>Tipo de Empresa</label>
          <div className="flex gap-10">
            <button
              onClick={() => setTipoEmpresa("MEXICANA")}
              className={"flex-1 py-3 px-4 rounded-lg transition-all " + (tipoEmpresa === "MEXICANA" ? "ring-2 ring-orange-500" : "")}
              style={{
                background: tipoEmpresa === "MEXICANA" ? "rgba(254, 80, 0, 0.2)" : "rgba(255,255,255,0.05)",
                border: "1px solid " + (tipoEmpresa === "MEXICANA" ? "rgba(254, 80, 0, 0.5)" : "rgba(255,255,255,0.1)"),
                fontFamily: "Exo 2, sans-serif", fontSize: "14px", fontWeight: 500,
                color: tipoEmpresa === "MEXICANA" ? "#fe5000" : "rgba(255,255,255,0.7)"
              }}
            >
              🇲🇽 Mexicana
            </button>
            <button
              onClick={() => setTipoEmpresa("USA_CANADA")}
              className={"flex-1 py-3 px-4 rounded-lg transition-all " + (tipoEmpresa === "USA_CANADA" ? "ring-2 ring-blue-500" : "")}
              style={{
                background: tipoEmpresa === "USA_CANADA" ? "rgba(59, 130, 246, 0.2)" : "rgba(255,255,255,0.05)",
                border: "1px solid " + (tipoEmpresa === "USA_CANADA" ? "rgba(59, 130, 246, 0.5)" : "rgba(255,255,255,0.1)"),
                fontFamily: "Exo 2, sans-serif", fontSize: "14px", fontWeight: 500,
                color: tipoEmpresa === "USA_CANADA" ? "#3b82f6" : "rgba(255,255,255,0.7)"
              }}
            >
              🇺🇸 USA/Canada
            </button>
          </div>
        </div>

        {/* Nombre y Apellido */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '8px' }}>Nombre</label>
            <input type="text" value={nombreCliente} onChange={(e) => setNombreCliente(capitalizar(e.target.value))} placeholder="Nombre"
              className="w-full px-4 py-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: "'Exo 2', sans-serif", fontSize: '14px', color: '#fff', outline: 'none' }} />
          </div>
          <div>
            <label style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '8px' }}>Apellido</label>
            <input type="text" value={apellidoCliente} onChange={(e) => setApellidoCliente(capitalizar(e.target.value))} placeholder="Apellido"
              className="w-full px-4 py-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: "'Exo 2', sans-serif", fontSize: '14px', color: '#fff', outline: 'none' }} />
          </div>
        </div>

        {/* Email principal */}
        <div className="mb-4">
          <label style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '8px' }}>Correo Electronico *</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input type="email" value={emailCliente} onChange={(e) => setEmailCliente(e.target.value)} placeholder="cliente@empresa.com"
              className="w-full pl-10 pr-4 py-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: "'Exo 2', sans-serif", fontSize: '14px', color: '#fff', outline: 'none' }} />
          </div>
        </div>

        {/* Emails adicionales */}
        <div className="mb-8">
          <label style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '8px' }}>Correos Adicionales</label>
          <div className="flex gap-2 mb-2">
            <input type="email" value={nuevoEmailAdicional} onChange={(e) => setNuevoEmailAdicional(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && agregarEmailAdicional()} placeholder="otro@empresa.com"
              className="flex-1 px-4 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: "'Exo 2', sans-serif", fontSize: '14px', color: '#fff', outline: 'none' }} />
            <button onClick={agregarEmailAdicional} className="px-3 py-2 rounded-lg hover:bg-white/10 transition-colors" style={{ border: '1px solid rgba(255,255,255,0.2)' }}>
              <Plus className="w-5 h-5 text-white/70" />
            </button>
          </div>
          {emailsAdicionales.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {emailsAdicionales.map((email, i) => (
                <span key={i} className="flex items-center gap-1 px-3 py-1 rounded-full text-sm" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd' }}>
                  {email}
                  <button onClick={() => setEmailsAdicionales(emailsAdicionales.filter(e => e !== email))} className="ml-1 hover:text-white"><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Boton enviar */}
        <button onClick={enviarSolicitud} disabled={enviando || !emailCliente}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-lg transition-all disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #fe5000 0%, #cc4000 100%)', fontFamily: "'Exo 2', sans-serif", fontSize: '15px', fontWeight: 600, color: '#fff' }}>
          {enviando ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          {enviando ? 'Enviando...' : 'Enviar Solicitud'}
        </button>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════
  // CLIENTES - LISTA
  // ═══════════════════════════════════════════════════════════
  const renderClientes = () => (
    <div className="p-8">
      <button onClick={() => setVista('hub')} className="flex items-center gap-2 mb-6 text-white/60 hover:text-white transition-colors">
        <ArrowLeft className="w-5 h-5" />
        <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px' }}>Volver</span>
      </button>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl" style={{ background: 'rgba(59, 130, 246, 0.2)' }}>
            <Users className="w-8 h-8" style={{ color: '#1E40AF' }} />
          </div>
          <div>
            <h3 style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '20px', fontWeight: 600, color: '#fff' }}>Clientes Registrados</h3>
            <p style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{solicitudes.length} solicitudes</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="grid grid-cols-6 gap-4 px-6 py-4" style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          {['Cliente', 'Email', 'Tipo', 'Estatus', 'Fecha', ''].map((h) => (
            <div key={h} style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
          ))}
        </div>

        {cargando ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-white/30" /></div>
        ) : solicitudes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-white/20 mb-3" />
            <p style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>No hay solicitudes</p>
          </div>
        ) : (
          solicitudes.map((sol) => (
            <div key={sol.id} className="grid grid-cols-6 gap-4 px-6 py-4 hover:bg-white/5 transition-colors cursor-pointer" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }} onClick={() => verDetalleCliente(sol)}>
              <div>
                <p style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', color: '#fff', fontWeight: 500 }}>{sol.razon_social || `${sol.nombre_cliente || ''} ${sol.apellido_cliente || ''}`.trim() || 'Sin nombre'}</p>
                {sol.rfc_mc && <p style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{sol.rfc_mc}</p>}
              </div>
              <div style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>{sol.email_cliente}</div>
              <div><span className="px-2 py-1 rounded text-xs" style={{ background: sol.tipo_empresa === 'USA_CANADA' ? 'rgba(59,130,246,0.2)' : 'rgba(34,197,94,0.2)', color: sol.tipo_empresa === 'USA_CANADA' ? '#93c5fd' : '#86efac' }}>{sol.tipo_empresa === 'USA_CANADA' ? '🇺🇸 USA' : '🇲🇽 MX'}</span></div>
              <div><span className={`px-2 py-1 rounded text-xs border ${getStatusBadge(sol.estatus)}`}>{sol.estatus}</span></div>
              <div style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{new Date(sol.created_at).toLocaleDateString('es-MX')}</div>
              <div><Eye className="w-4 h-4 text-white/40" /></div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════
  // DETALLE CLIENTE
  // ═══════════════════════════════════════════════════════════
  const renderDetalleCliente = () => {
    if (!solicitudSeleccionada) return null;
    const s = solicitudSeleccionada;

    return (
      <div className="relative w-full h-full overflow-auto" style={{ borderRadius: '16px' }}>
        {/* Background - Gradiente AZUL ELÉCTRICO igual que Dashboard */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #001f4d 0%, #003d7a 25%, #0066cc 50%, #1a8fff 75%, #4da6ff 100%)',
            borderRadius: '16px',
          }}
        />
        {/* Overlay oscuro sutil */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.25) 0%, rgba(0, 0, 0, 0.15) 50%, rgba(0, 0, 0, 0.25) 100%)',
            borderRadius: '16px',
          }}
        />
        {/* Halo volumétrico */}
        <div
          className="absolute"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '80%',
            height: '60%',
            background: 'radial-gradient(ellipse at center, rgba(30, 80, 160, 0.08) 0%, rgba(40, 90, 170, 0.04) 35%, transparent 70%)',
            filter: 'blur(60px)',
            pointerEvents: 'none',
          }}
        />
        
        <div className="relative z-10 p-10">
          <button onClick={() => setVista('clientes')} className="flex items-center gap-2 mb-6 text-white/60 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px' }}>Volver a Clientes</span>
          </button>

          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-xl" style={{ background: 'rgba(59, 130, 246, 0.2)' }}>
                <Building2 className="w-10 h-10" style={{ color: '#1E40AF' }} />
              </div>
              <div>
                <h2 style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '24px', fontWeight: 600, color: '#fff' }}>{s.razon_social || `${s.nombre_cliente || ''} ${s.apellido_cliente || ''}`.trim() || 'Sin nombre'}</h2>
                <p style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>{s.rfc_mc || 'Sin RFC'}</p>
              </div>
            </div>
            <span className={`px-4 py-2 rounded-lg text-sm border ${getStatusBadge(s.estatus)}`}>{s.estatus}</span>
          </div>

          <div className="grid grid-cols-2 gap-10">
            {/* Datos de la Empresa */}
            <div className="rounded-xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '16px' }}>Datos de la Empresa</h3>
              <div className="space-y-3">
                <div><span className="text-white/50 text-sm">Giro:</span><p className="text-white">{s.giro || '-'}</p></div>
                <div><span className="text-white/50 text-sm">Direccion:</span><p className="text-white">{s.direccion_completa || '-'}</p></div>
                <div><span className="text-white/50 text-sm">Telefono:</span><p className="text-white">{s.tel_oficina || '-'}</p></div>
                <div><span className="text-white/50 text-sm">WhatsApp:</span><p className="text-white">{s.whatsapp || '-'}</p></div>
              </div>
            </div>

            {/* Contactos */}
            <div className="rounded-xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '16px' }}>Contactos</h3>
              <div className="space-y-4">
                <div>
                  <span className="text-white/50 text-sm">Administrativo:</span>
                  <p className="text-white">{s.contacto_admin_nombre || '-'}</p>
                  <p className="text-blue-400 text-sm">{s.contacto_admin_email || '-'}</p>
                </div>
                <div>
                  <span className="text-white/50 text-sm">Facturas:</span>
                  <p className="text-white">{s.contacto_facturas_nombre || '-'}</p>
                  <p className="text-blue-400 text-sm">{s.contacto_facturas_email || '-'}</p>
                </div>
              </div>
            </div>

            {/* Firma */}
            <div className="rounded-xl p-6" style={{ background: s.firma_aceptada ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${s.firma_aceptada ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)'}` }}>
              <h3 style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '16px' }}>Firma Digital</h3>
              {s.firma_aceptada ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-green-400"><CheckCircle2 className="w-5 h-5" /><span>Documento firmado</span></div>
                  <p className="text-white"><strong>Representante:</strong> {s.nombre_rep_legal}</p>
                  <p className="text-white/60 text-sm">Fecha: {s.firma_fecha ? new Date(s.firma_fecha).toLocaleString('es-MX') : '-'}</p>
                  <p className="text-white/40 text-xs">IP: {s.firma_ip}</p>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-yellow-400"><Clock className="w-5 h-5" /><span>Pendiente de firma</span></div>
              )}
            </div>

            {/* Documentos */}
            <div className="rounded-xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '16px' }}>Documentos ({documentos.length})</h3>
              {documentos.length === 0 ? (
                <p className="text-white/40 text-sm">Sin documentos adjuntos</p>
              ) : (
                <div className="space-y-2">
                  {documentos.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                      <div className="flex items-center gap-10">
                        <FileText className="w-5 h-5 text-blue-400" />
                        <div>
                          <p className="text-white text-sm">{doc.nombre_archivo}</p>
                          <p className="text-white/40 text-xs">{doc.tipo_documento}</p>
                        </div>
                      </div>
                      <button className="p-2 hover:bg-white/10 rounded-lg transition-colors"><Download className="w-4 h-4 text-white/60" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // ANÁLISIS DE CONTRATOS - VISTA COMPLETA
  // ═══════════════════════════════════════════════════════════
  const renderAnalisisContratos = () => {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <button onClick={() => { setVista('hub'); resetAnalisis(); }} className="flex items-center gap-2 mb-6 text-white/60 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px' }}>Volver</span>
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-xl" style={{ background: 'rgba(139, 92, 246, 0.2)' }}>
            <Scale className="w-8 h-8" style={{ color: '#a78bfa' }} />
          </div>
          <div>
            <h3 style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '22px', fontWeight: 600, color: '#fff' }}>Análisis de Contratos</h3>
            <p style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
              Análisis con IA — Detecta cláusulas leoninas, riesgos y genera versión blindada para TROB
            </p>
          </div>
        </div>

        {/* Zona de carga de archivo */}
        {!analisisResultado && (
          <div className="rounded-xl p-8" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
            
            {/* Drop zone */}
            <div
              className="relative rounded-xl p-12 text-center cursor-pointer transition-all duration-300"
              style={{
                background: dragOver ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255,255,255,0.02)',
                border: `2px dashed ${dragOver ? 'rgba(139, 92, 246, 0.6)' : archivoContrato ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.15)'}`,
              }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />

              {archivoContrato ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 rounded-full" style={{ background: 'rgba(34,197,94,0.15)' }}>
                    <FileText className="w-12 h-12" style={{ color: '#22c55e' }} />
                  </div>
                  <div>
                    <p style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '16px', fontWeight: 600, color: '#fff' }}>
                      {archivoContrato.name}
                    </p>
                    <p style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
                      {(archivoContrato.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); resetAnalisis(); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
                    style={{ border: '1px solid rgba(255,255,255,0.15)' }}
                  >
                    <RotateCcw className="w-4 h-4 text-white/60" />
                    <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Cambiar archivo</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 rounded-full" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
                    <Upload className="w-12 h-12" style={{ color: 'rgba(255,255,255,0.4)' }} />
                  </div>
                  <div>
                    <p style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '16px', fontWeight: 500, color: 'rgba(255,255,255,0.8)' }}>
                      Arrastra el contrato aquí o haz clic para seleccionar
                    </p>
                    <p style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginTop: '8px' }}>
                      Formatos aceptados: PDF, Word (.docx), Imágenes (PNG, JPG) — Máx. 10MB
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Error */}
            {analisisError && (
              <div className="mt-4 p-4 rounded-lg flex items-center gap-3" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
                <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#ef4444' }} />
                <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', color: '#fca5a5' }}>{analisisError}</span>
              </div>
            )}

            {/* Botón analizar */}
            <button
              onClick={analizarContrato}
              disabled={!archivoContrato || analizandoContrato}
              className="w-full mt-6 flex items-center justify-center gap-3 py-4 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: archivoContrato ? 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)' : 'rgba(255,255,255,0.05)',
                fontFamily: "'Exo 2', sans-serif",
                fontSize: '15px',
                fontWeight: 600,
                color: '#fff',
              }}
            >
              {analizandoContrato ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analizando contrato con IA... Esto puede tomar 30-60 segundos
                </>
              ) : (
                <>
                  <Scale className="w-5 h-5" />
                  Analizar Contrato
                </>
              )}
            </button>

            {/* Animación de análisis */}
            {analizandoContrato && (
              <div className="mt-6 space-y-3">
                {['Extrayendo texto del documento...', 'Identificando partes y representantes...', 'Analizando cláusulas y condiciones...', 'Evaluando riesgos y cláusulas leoninas...', 'Generando versión blindada para TROB...'].map((paso, i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse" style={{ animationDelay: `${i * 0.3}s` }}>
                    <div className="w-2 h-2 rounded-full" style={{ background: '#a78bfa' }} />
                    <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{paso}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ RESULTADOS DEL ANÁLISIS ═══ */}
        {analisisResultado && (
          <div className="space-y-4">

            {/* Barra de riesgo global */}
            {(() => {
              const rg = getRiesgoGlobalColor(analisisResultado.calificacion_riesgo);
              return (
                <div className="rounded-xl p-6 flex items-center justify-between" style={{ background: rg.bg, border: `1px solid ${rg.color}40` }}>
                  <div className="flex items-center gap-4">
                    {analisisResultado.calificacion_riesgo > 6 ? (
                      <ShieldAlert className="w-10 h-10" style={{ color: rg.color }} />
                    ) : analisisResultado.calificacion_riesgo > 3 ? (
                      <Shield className="w-10 h-10" style={{ color: rg.color }} />
                    ) : (
                      <ShieldCheck className="w-10 h-10" style={{ color: rg.color }} />
                    )}
                    <div>
                      <p style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '18px', fontWeight: 700, color: rg.color }}>
                        RIESGO {rg.label} — {analisisResultado.calificacion_riesgo}/10
                      </p>
                      <p style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
                        {analisisResultado.riesgos.length} puntos de riesgo detectados
                        {analisisResultado.es_leonino && ' — CONTRATO LEONINO DETECTADO'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={descargarAnalisis}
                      className="flex items-center gap-2 px-5 py-3 rounded-lg transition-all hover:brightness-110"
                      style={{ background: 'linear-gradient(135deg, #fe5000 0%, #cc4000 100%)', fontFamily: "'Exo 2', sans-serif", fontSize: '14px', fontWeight: 600, color: '#fff' }}
                    >
                      <FileDown className="w-5 h-5" />
                      Descargar Análisis
                    </button>
                    <button
                      onClick={resetAnalisis}
                      className="flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors"
                      style={{ border: '1px solid rgba(255,255,255,0.2)', fontFamily: "'Exo 2', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}
                    >
                      <RotateCcw className="w-4 h-4" />
                      Nuevo Análisis
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Sección: Datos Extraídos */}
            <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <button onClick={() => toggleSeccion('datos')} className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5" style={{ color: '#a78bfa' }} />
                  <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '16px', fontWeight: 600, color: '#fff' }}>Datos Extraídos del Contrato</span>
                </div>
                {seccionesAbiertas.datos ? <ChevronUp className="w-5 h-5 text-white/40" /> : <ChevronDown className="w-5 h-5 text-white/40" />}
              </button>
              {seccionesAbiertas.datos && (
                <div className="px-5 pb-5">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Representante Legal', value: analisisResultado.datos_extraidos.representante_legal },
                      { label: 'Notaría', value: analisisResultado.datos_extraidos.notaria },
                      { label: 'No. Escritura', value: analisisResultado.datos_extraidos.numero_escritura },
                      { label: 'Fecha del Contrato', value: analisisResultado.datos_extraidos.fecha_contrato },
                      { label: 'Objeto del Contrato', value: analisisResultado.datos_extraidos.objeto_contrato },
                      { label: 'Vigencia', value: analisisResultado.datos_extraidos.vigencia },
                      { label: 'Monto / Tarifa', value: analisisResultado.datos_extraidos.monto_o_tarifa },
                    ].map((campo) => (
                      <div key={campo.label} className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <p style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{campo.label}</p>
                        <p style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', color: '#fff', marginTop: '4px' }}>{campo.value || 'No especificado'}</p>
                      </div>
                    ))}
                    <div className="col-span-2 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <p style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Partes del Contrato</p>
                      <p style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', color: '#fff', marginTop: '4px' }}>{analisisResultado.datos_extraidos.partes.join(' — ')}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sección: Análisis Leonino */}
            <div className="rounded-xl overflow-hidden" style={{
              background: analisisResultado.es_leonino ? 'rgba(239,68,68,0.05)' : 'rgba(34,197,94,0.05)',
              border: `1px solid ${analisisResultado.es_leonino ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`,
            }}>
              <button onClick={() => toggleSeccion('leonino')} className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3">
                  {analisisResultado.es_leonino ? (
                    <AlertTriangle className="w-5 h-5" style={{ color: '#ef4444' }} />
                  ) : (
                    <ShieldCheck className="w-5 h-5" style={{ color: '#22c55e' }} />
                  )}
                  <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '16px', fontWeight: 600, color: '#fff' }}>
                    Análisis de Cláusulas Leoninas — {analisisResultado.es_leonino ? 'DETECTADO' : 'NO DETECTADO'}
                  </span>
                </div>
                {seccionesAbiertas.leonino ? <ChevronUp className="w-5 h-5 text-white/40" /> : <ChevronDown className="w-5 h-5 text-white/40" />}
              </button>
              {seccionesAbiertas.leonino && (
                <div className="px-5 pb-5">
                  <p style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                    {analisisResultado.explicacion_leonino}
                  </p>
                </div>
              )}
            </div>

            {/* Sección: Puntos de Riesgo */}
            <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <button onClick={() => toggleSeccion('riesgos')} className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3">
                  <FileWarning className="w-5 h-5" style={{ color: '#f59e0b' }} />
                  <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '16px', fontWeight: 600, color: '#fff' }}>
                    Puntos de Riesgo ({analisisResultado.riesgos.length})
                  </span>
                </div>
                {seccionesAbiertas.riesgos ? <ChevronUp className="w-5 h-5 text-white/40" /> : <ChevronDown className="w-5 h-5 text-white/40" />}
              </button>
              {seccionesAbiertas.riesgos && (
                <div className="px-5 pb-5 space-y-3">
                  {analisisResultado.riesgos.map((riesgo, i) => {
                    const col = getSeveridadColor(riesgo.severidad);
                    return (
                      <div key={i} className="rounded-lg p-4" style={{ background: col.bg, border: `1px solid ${col.border}` }}>
                        <div className="flex items-start justify-between mb-2">
                          <p style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '15px', fontWeight: 600, color: '#fff' }}>
                            {riesgo.clausula}
                          </p>
                          <span className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold" style={{ background: col.bg, color: col.text, border: `1px solid ${col.border}` }}>
                            {riesgo.severidad}
                          </span>
                        </div>
                        <p style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>
                          {riesgo.descripcion}
                        </p>
                        <div className="flex items-start gap-2 p-3 rounded-lg" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                          <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#22c55e' }} />
                          <p style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px', color: '#86efac' }}>
                            <strong>Sugerencia:</strong> {riesgo.sugerencia}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sección: Cláusulas Faltantes */}
            {analisisResultado.clausulas_faltantes.length > 0 && (
              <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <button onClick={() => toggleSeccion('faltantes')} className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5" style={{ color: '#f59e0b' }} />
                    <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '16px', fontWeight: 600, color: '#fff' }}>
                      Cláusulas Faltantes ({analisisResultado.clausulas_faltantes.length})
                    </span>
                  </div>
                  {seccionesAbiertas.faltantes ? <ChevronUp className="w-5 h-5 text-white/40" /> : <ChevronDown className="w-5 h-5 text-white/40" />}
                </button>
                {seccionesAbiertas.faltantes && (
                  <div className="px-5 pb-5 space-y-2">
                    {analisisResultado.clausulas_faltantes.map((clausula, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 700, color: '#f59e0b', minWidth: '24px' }}>{i + 1}.</span>
                        <p style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>{clausula}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Sección: Resumen Ejecutivo */}
            <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.2)' }}>
              <button onClick={() => toggleSeccion('resumen')} className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5" style={{ color: '#3b82f6' }} />
                  <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '16px', fontWeight: 600, color: '#fff' }}>Resumen Ejecutivo</span>
                </div>
                {seccionesAbiertas.resumen ? <ChevronUp className="w-5 h-5 text-white/40" /> : <ChevronDown className="w-5 h-5 text-white/40" />}
              </button>
              {seccionesAbiertas.resumen && (
                <div className="px-5 pb-5">
                  <p style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                    {analisisResultado.resumen_ejecutivo}
                  </p>
                </div>
              )}
            </div>

            {/* Sección: Versión Blindada */}
            <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <button onClick={() => toggleSeccion('blindado')} className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5" style={{ color: '#22c55e' }} />
                  <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '16px', fontWeight: 600, color: '#fff' }}>Versión Blindada — Modificaciones para TROB</span>
                </div>
                {seccionesAbiertas.blindado ? <ChevronUp className="w-5 h-5 text-white/40" /> : <ChevronDown className="w-5 h-5 text-white/40" />}
              </button>
              {seccionesAbiertas.blindado && (
                <div className="px-5 pb-5">
                  <p style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                    {analisisResultado.version_blindada}
                  </p>
                </div>
              )}
            </div>

            {/* Botón descargar al final */}
            <div className="flex justify-center pt-4">
              <button
                onClick={descargarAnalisis}
                className="flex items-center gap-3 px-8 py-4 rounded-xl transition-all hover:brightness-110"
                style={{
                  background: 'linear-gradient(135deg, #fe5000 0%, #cc4000 100%)',
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#fff',
                  boxShadow: '0 4px 15px rgba(254, 80, 0, 0.3)',
                }}
              >
                <FileDown className="w-6 h-6" />
                Descargar Análisis Completo
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER PRINCIPAL
  // ═══════════════════════════════════════════════════════════
  return (
    <ModuleTemplate title="Clientes" onBack={onBack} headerImage={MODULE_IMAGES.SERVICIO_CLIENTES}>
      <div className="h-full overflow-auto">
        {vista === 'hub' && renderHub()}
        {vista === 'nueva-alta' && renderNuevaAlta()}
        {vista === 'clientes' && renderClientes()}
        {vista === 'detalle-cliente' && renderDetalleCliente()}
        {vista === 'analisis-contratos' && renderAnalisisContratos()}
      </div>
    </ModuleTemplate>
  );
};
