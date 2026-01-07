import { useState, useEffect } from 'react';
import { ModuleTemplate } from './ModuleTemplate';
import { MODULE_IMAGES } from '../../assets/module-images';
import { UserPlus, Users, Send, Mail, User, Plus, X, Clock, CheckCircle2, AlertCircle, FileText, Eye, Loader2, ArrowLeft, Building2, Phone, MapPin, CreditCard, Upload, Download, Trash2 } from 'lucide-react';
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

type Vista = 'hub' | 'nueva-alta' | 'clientes' | 'detalle-cliente';

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
  // HUB - ESTILO DASHBOARD
  // ═══════════════════════════════════════════════════════════
  const renderHub = () => {
    const botones = [
      { id: 'nueva-alta', nombre: 'Nueva Alta', icon: UserPlus },
      { id: 'clientes', nombre: 'Clientes', icon: Users },
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

        {/* Contenido */}
        <div className="relative z-10 p-12">
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
                    borderRadius: '10px',
                    width: '200px',
                    height: '170px',
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
                  <Icon className="w-14 h-14" style={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                  <span
                    style={{
                      fontFamily: "'Exo 2', sans-serif",
                      fontSize: '15px',
                      fontWeight: 500,
                      color: 'rgba(255, 255, 255, 0.85)',
                      textAlign: 'center',
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
  // RENDER PRINCIPAL
  // ═══════════════════════════════════════════════════════════
  return (
    <ModuleTemplate title="Clientes" onBack={onBack} headerImage={MODULE_IMAGES.SERVICIO_CLIENTES}>
      <div className="h-full overflow-auto">
        {vista === 'hub' && renderHub()}
        {vista === 'nueva-alta' && renderNuevaAlta()}
        {vista === 'clientes' && renderClientes()}
        {vista === 'detalle-cliente' && renderDetalleCliente()}
      </div>
    </ModuleTemplate>
  );
};
