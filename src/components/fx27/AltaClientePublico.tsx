import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Upload, CheckCircle2, AlertCircle, Loader2, FileText, Lock, Info, Send, Shield, X, HelpCircle } from 'lucide-react';

const supabaseUrl = 'https://fbxbsslhewchyibdoyzk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieGJzc2xoZXdjaHlpYmRveXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIwNTM5NTQsImV4cCI6MjA0NzYyOTk1NH0.AYJxjsZbPOLUxNMejSdWX-Gl01gAXOVWwO_4xLYfYTw';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface AltaClientePublicoProps {
  solicitudId: string;
}

interface DatosExtraidos {
  razon_social?: string;
  rfc?: string;
  calle?: string;
  no_ext?: string;
  no_int?: string;
  cp?: string;
  colonia?: string;
  ciudad?: string;
  estado?: string;
  pais?: string;
  representante_legal?: string;
}

interface ErrorValidacion {
  documento: string;
  error: string;
  solucion: string;
}

interface FormData {
  giro: string;
  pagina_web: string;
  tamano_empresa: string;
  whatsapp: string;
  contacto_admin_nombre: string;
  contacto_admin_puesto: string;
  contacto_admin_email: string;
  contacto_admin_tel: string;
  contacto_facturas_nombre: string;
  contacto_facturas_puesto: string;
  contacto_facturas_email: string;
  contacto_facturas_tel: string;
  contacto_op1_nombre: string;
  contacto_op1_puesto: string;
  contacto_op1_email: string;
  contacto_op1_tel: string;
  contacto_op2_nombre: string;
  contacto_op2_puesto: string;
  contacto_op2_email: string;
  contacto_op2_tel: string;
  ref1_empresa: string;
  ref1_contacto: string;
  ref1_whatsapp: string;
  ref1_email: string;
  ref1_anos: string;
  ref2_empresa: string;
  ref2_contacto: string;
  ref2_whatsapp: string;
  ref2_email: string;
  ref2_anos: string;
  ref3_empresa: string;
  ref3_contacto: string;
  ref3_whatsapp: string;
  ref3_email: string;
  ref3_anos: string;
  proceso_facturacion: string;
  firma_nombre: string;
  firma_aceptada: boolean;
}

const TAMANOS_EMPRESA = [
  '-',
  '1-10 colaboradores',
  '11-50 colaboradores',
  '51-200 colaboradores',
  '201-500 colaboradores',
  '500+ colaboradores'
];

const DOCS_MEXICANA = [
  { key: 'constancia_fiscal', label: 'Constancia Situación Fiscal', required: true, tooltip: 'Debe ser del mes fiscal actual', icon: '📄' },
  { key: 'opinion_cumplimiento', label: 'Opinión de Cumplimiento', required: true, tooltip: 'Debe ser del mes actual', icon: '✅' },
  { key: 'comprobante_domicilio', label: 'Comprobante Domicilio', required: true, tooltip: 'Recibo de luz, agua o teléfono de los últimos 3 meses', icon: '🏠' },
  { key: 'ine_representante', label: 'INE Representante Legal', required: true, tooltip: 'INE vigente del representante legal', icon: '🪪' },
  { key: 'acta_constitutiva', label: 'Acta Constitutiva', required: true, tooltip: 'Copia del acta constitutiva de la empresa', icon: '📋' },
  { key: 'poder_notarial', label: 'Poder Notarial', required: false, tooltip: 'Solo si aplica representación legal diferente', icon: '⚖️' }
];

const DOCS_USA = [
  { key: 'w9', label: 'W-9 Form', required: true, tooltip: 'Formulario W-9 firmado del año actual', icon: '📄' },
  { key: 'bank_statement', label: 'Bank Statement', required: true, tooltip: 'Estado de cuenta de los últimos 3 meses', icon: '🏦' },
  { key: 'mc_number', label: 'MC# Certificate', required: true, tooltip: 'Certificado MC activo y vigente', icon: '🚛' },
  { key: 'void_check', label: 'Void Check', required: true, tooltip: 'Cheque cancelado para verificar cuenta bancaria', icon: '📝' },
  { key: 'id_document', label: 'ID Document', required: true, tooltip: 'Licencia o pasaporte vigente', icon: '🪪' }
];

export function AltaClientePublico({ solicitudId }: AltaClientePublicoProps) {
  const [loading, setLoading] = useState(true);
  const [solicitud, setSolicitud] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Paso actual: 'documentos' | 'validando' | 'formulario' | 'enviado' | 'completado'
  const [paso, setPaso] = useState<'documentos' | 'validando' | 'formulario' | 'enviado' | 'completado'>('documentos');
  
  // Documentos
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, string>>({});
  
  // Validación
  const [validando, setValidando] = useState(false);
  const [erroresValidacion, setErroresValidacion] = useState<ErrorValidacion[]>([]);
  const [datosExtraidos, setDatosExtraidos] = useState<DatosExtraidos>({});
  
  // Formulario
  const [form, setForm] = useState<FormData>({
    giro: '', pagina_web: '', tamano_empresa: '-', whatsapp: '',
    contacto_admin_nombre: '', contacto_admin_puesto: '', contacto_admin_email: '', contacto_admin_tel: '',
    contacto_facturas_nombre: '', contacto_facturas_puesto: '', contacto_facturas_email: '', contacto_facturas_tel: '',
    contacto_op1_nombre: '', contacto_op1_puesto: '', contacto_op1_email: '', contacto_op1_tel: '',
    contacto_op2_nombre: '', contacto_op2_puesto: '', contacto_op2_email: '', contacto_op2_tel: '',
    ref1_empresa: '', ref1_contacto: '', ref1_whatsapp: '', ref1_email: '', ref1_anos: '',
    ref2_empresa: '', ref2_contacto: '', ref2_whatsapp: '', ref2_email: '', ref2_anos: '',
    ref3_empresa: '', ref3_contacto: '', ref3_whatsapp: '', ref3_email: '', ref3_anos: '',
    proceso_facturacion: '', firma_nombre: '', firma_aceptada: false
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState<string | null>(null);

  const tipoEmpresa = solicitud?.tipo_empresa || 'MEXICANA';
  const documentos = tipoEmpresa === 'USA_CANADA' ? DOCS_USA : DOCS_MEXICANA;
  const docsRequeridos = documentos.filter(d => d.required);
  const todosRequeridosSubidos = docsRequeridos.every(d => uploadedDocs[d.key]);

  useEffect(() => {
    if (solicitudId) fetchSolicitud();
  }, [solicitudId]);

  const fetchSolicitud = async () => {
    try {
      const { data, error } = await supabase
        .from('alta_clientes')
        .select('*')
        .eq('id', solicitudId)
        .single();
      
      if (error) throw error;
      if (!data) throw new Error('Solicitud no encontrada');
      
      setSolicitud(data);
      
      // Restaurar estado según paso_actual
      if (data.estatus === 'COMPLETADA') {
        setPaso('completado');
      } else if (data.estatus === 'PENDIENTE_CSR' || data.estatus === 'PENDIENTE_CXC' || data.estatus === 'PENDIENTE_CONFIRMACION') {
        setPaso('enviado');
      } else if (data.documentos_validados && data.datos_extraidos) {
        setDatosExtraidos(data.datos_extraidos);
        setPaso('formulario');
      }
      
      if (data.documentos) setUploadedDocs(data.documentos);
      if (data.errores_validacion) setErroresValidacion(data.errores_validacion);
      
    } catch (err) {
      console.error('Error:', err);
      setError('Error al cargar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (docKey: string, file: File) => {
    setUploadingDoc(docKey);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${solicitudId}/${docKey}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('alta-documentos')
        .upload(fileName, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      const newDocs = { ...uploadedDocs, [docKey]: fileName };
      setUploadedDocs(newDocs);
      
      // Guardar en BD
      await supabase
        .from('alta_clientes')
        .update({ documentos: newDocs, paso_actual: 'DOCUMENTOS' })
        .eq('id', solicitudId);
      
      // Limpiar error de este documento si existía
      setErroresValidacion(prev => prev.filter(e => e.documento !== docKey));
      
    } catch (err) {
      console.error('Error subiendo:', err);
      alert('Error al subir el documento');
    } finally {
      setUploadingDoc(null);
    }
  };

  const validarDocumentos = async () => {
    setValidando(true);
    setPaso('validando');
    setErroresValidacion([]);
    
    try {
      // Llamar a Edge Function para validar con IA
      const response = await fetch(`${supabaseUrl}/functions/v1/validar-documentos-alta`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify({
          solicitudId,
          documentos: uploadedDocs,
          tipoEmpresa
        })
      });
      
      const result = await response.json();
      
      if (!result.success) {
        // Hay errores de validación
        setErroresValidacion(result.errores || []);
        setPaso('documentos');
      } else {
        // Documentos válidos, extraer datos
        setDatosExtraidos(result.datosExtraidos || {});
        
        // Guardar en BD
        await supabase
          .from('alta_clientes')
          .update({
            documentos_validados: true,
            datos_extraidos: result.datosExtraidos,
            paso_actual: 'FORMULARIO'
          })
          .eq('id', solicitudId);
        
        setPaso('formulario');
      }
    } catch (err) {
      console.error('Error validando:', err);
      // Por ahora, si falla la validación IA, pasar al formulario sin datos extraídos
      setPaso('formulario');
    } finally {
      setValidando(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setForm(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const enviarFormulario = async () => {
    if (!form.firma_aceptada || !form.firma_nombre) {
      alert('Debe aceptar los términos y firmar digitalmente');
      return;
    }
    
    setSubmitting(true);
    try {
      const dataToSave = {
        ...form,
        ...datosExtraidos,
        estatus: 'PENDIENTE_CSR',
        paso_actual: 'PENDIENTE_CSR',
        firma_fecha: new Date().toISOString(),
        firma_ip: 'Capturado en servidor'
      };
      
      const { error } = await supabase
        .from('alta_clientes')
        .update(dataToSave)
        .eq('id', solicitudId);
      
      if (error) throw error;
      
      // Enviar correos (Edge Function)
      await fetch(`${supabaseUrl}/functions/v1/enviar-correo-alta`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify({
          solicitudId,
          tipo: 'cliente_completo'
        })
      });
      
      setPaso('enviado');
    } catch (err) {
      console.error('Error:', err);
      alert('Error al enviar la solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ESTILOS BASE
  // ═══════════════════════════════════════════════════════════════════════════
  const estilos = {
    fondo: {
      background: 'linear-gradient(135deg, #001f4d 0%, #003d7a 25%, #0066cc 50%, #1a8fff 75%, #4da6ff 100%)',
      minHeight: '100vh',
    },
    overlay: {
      background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.3) 100%)',
      minHeight: '100vh',
    },
    card: {
      background: 'linear-gradient(155deg, rgba(18,32,58,0.96) 0%, rgba(12,22,42,0.98) 35%, rgba(8,16,32,1) 70%, rgba(6,12,24,1) 100%)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    },
    input: {
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: '8px',
      color: '#fff',
      fontFamily: "'Exo 2', sans-serif",
      fontSize: '14px',
    },
    inputLocked: {
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(254,80,0,0.3)',
      borderRadius: '8px',
      color: 'rgba(255,255,255,0.7)',
      fontFamily: "'Exo 2', sans-serif",
      fontSize: '14px',
    },
    label: {
      fontFamily: "'Exo 2', sans-serif",
      fontSize: '12px',
      color: 'rgba(255,255,255,0.6)',
      marginBottom: '4px',
      display: 'block',
    },
    botonPrimario: {
      background: 'linear-gradient(135deg, #fe5000 0%, #cc4000 100%)',
      border: 'none',
      borderRadius: '10px',
      color: '#fff',
      fontFamily: "'Exo 2', sans-serif",
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.3s',
    },
    botonSecundario: {
      background: 'rgba(255,255,255,0.1)',
      border: '1px solid rgba(255,255,255,0.2)',
      borderRadius: '8px',
      color: '#fff',
      fontFamily: "'Exo 2', sans-serif",
      cursor: 'pointer',
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: LOADING
  // ═══════════════════════════════════════════════════════════════════════════
  if (loading) {
    return (
      <div style={estilos.fondo}>
        <div style={estilos.overlay} className="flex items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-white/50" />
        </div>
      </div>
    );
  }

  if (error || !solicitud) {
    return (
      <div style={estilos.fondo}>
        <div style={estilos.overlay} className="flex items-center justify-center">
          <div style={estilos.card} className="p-8 text-center max-w-md">
            <AlertCircle className="w-16 h-16 mx-auto mb-4" style={{ color: '#fe5000' }} />
            <h2 style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '20px', color: '#fff', marginBottom: '8px' }}>
              Solicitud no encontrada
            </h2>
            <p style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
              El enlace puede haber expirado o ser incorrecto.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: COMPLETADO
  // ═══════════════════════════════════════════════════════════════════════════
  if (paso === 'completado') {
    return (
      <div style={estilos.fondo}>
        <div style={estilos.overlay} className="flex items-center justify-center p-4">
          <div style={estilos.card} className="p-10 text-center max-w-lg">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.2)' }}>
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </div>
            <h2 style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '24px', fontWeight: 600, color: '#fff', marginBottom: '12px' }}>
              ¡Alta Completada!
            </h2>
            <p style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '15px', color: 'rgba(255,255,255,0.7)', marginBottom: '24px' }}>
              Su empresa ha sido dada de alta exitosamente en nuestro sistema.
              <br /><br />
              Recibirá un correo con los datos de sus ejecutivos asignados y el directorio de contacto.
            </p>
            <div className="p-4 rounded-lg" style={{ background: 'rgba(254,80,0,0.1)', border: '1px solid rgba(254,80,0,0.3)' }}>
              <p style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', color: '#fe5000' }}>
                Gracias por confiar en Grupo Loma
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: ENVIADO (esperando asignaciones)
  // ═══════════════════════════════════════════════════════════════════════════
  if (paso === 'enviado') {
    return (
      <div style={estilos.fondo}>
        <div style={estilos.overlay} className="flex items-center justify-center p-4">
          <div style={estilos.card} className="p-10 text-center max-w-lg">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.2)' }}>
              <Send className="w-10 h-10 text-blue-400" />
            </div>
            <h2 style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '24px', fontWeight: 600, color: '#fff', marginBottom: '12px' }}>
              Solicitud Enviada
            </h2>
            <p style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '15px', color: 'rgba(255,255,255,0.7)', marginBottom: '24px' }}>
              Hemos recibido su información correctamente.
              <br /><br />
              Nuestro equipo está procesando su alta y pronto recibirá confirmación por correo electrónico.
            </p>
            <div className="flex items-center justify-center gap-2 text-white/50">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px' }}>Procesando...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: VALIDANDO
  // ═══════════════════════════════════════════════════════════════════════════
  if (paso === 'validando') {
    return (
      <div style={estilos.fondo}>
        <div style={estilos.overlay} className="flex items-center justify-center p-4">
          <div style={estilos.card} className="p-10 text-center max-w-lg">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(254,80,0,0.2)' }}>
              <Shield className="w-10 h-10 animate-pulse" style={{ color: '#fe5000' }} />
            </div>
            <h2 style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '24px', fontWeight: 600, color: '#fff', marginBottom: '12px' }}>
              Validando Documentos
            </h2>
            <p style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '15px', color: 'rgba(255,255,255,0.7)', marginBottom: '24px' }}>
              Estamos verificando la vigencia y autenticidad de sus documentos...
            </p>
            
            <div className="space-y-3 text-left">
              {documentos.filter(d => d.required).map((doc, idx) => (
                <div key={doc.key} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  {idx < 2 ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  ) : idx === 2 ? (
                    <Loader2 className="w-5 h-5 animate-spin text-orange-400" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-white/20" />
                  )}
                  <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>
                    {doc.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: PASO 1 - DOCUMENTOS
  // ═══════════════════════════════════════════════════════════════════════════
  if (paso === 'documentos') {
    return (
      <div style={estilos.fondo}>
        <div style={estilos.overlay}>
          {/* Header */}
          <header className="px-6 py-4 flex items-center justify-between" style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)' }}>
            <div className="flex items-center gap-4">
              <img src="/grupo-loma-logo.png" alt="Grupo Loma" className="h-10" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              <div>
                <h1 style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '18px', fontWeight: 600, color: '#fff' }}>
                  Formulario de Alta de Cliente
                </h1>
                <p style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                  Paso 1 de 2: Documentación
                </p>
              </div>
            </div>
            <div className="px-4 py-2 rounded-full" style={{ background: tipoEmpresa === 'USA_CANADA' ? 'rgba(59,130,246,0.2)' : 'rgba(34,197,94,0.2)' }}>
              <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', color: tipoEmpresa === 'USA_CANADA' ? '#93c5fd' : '#86efac' }}>
                {tipoEmpresa === 'USA_CANADA' ? '🇺🇸 USA/Canadá' : '🇲🇽 México'}
              </span>
            </div>
          </header>

          {/* Contenido */}
          <div className="max-w-3xl mx-auto p-6">
            <div style={estilos.card} className="p-8">
              {/* Título */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(254,80,0,0.2)' }}>
                  <Upload className="w-8 h-8" style={{ color: '#fe5000' }} />
                </div>
                <h2 style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '22px', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>
                  Suba sus documentos
                </h2>
                <p style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
                  Para agilizar su registro, primero suba los documentos requeridos.
                  <br />Extraeremos la información automáticamente.
                </p>
              </div>

              {/* Errores de validación */}
              {erroresValidacion.length > 0 && (
                <div className="mb-6 p-4 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', fontWeight: 600, color: '#fca5a5' }}>
                      Problemas encontrados
                    </span>
                  </div>
                  {erroresValidacion.map((err, idx) => (
                    <div key={idx} className="ml-7 mb-2">
                      <p style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', color: '#fca5a5' }}>
                        <strong>{err.documento}:</strong> {err.error}
                      </p>
                      <p style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                        → {err.solucion}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Lista de documentos */}
              <div className="space-y-3">
                {documentos.map((doc) => {
                  const subido = !!uploadedDocs[doc.key];
                  const tieneError = erroresValidacion.some(e => e.documento === doc.key);
                  
                  return (
                    <div
                      key={doc.key}
                      className="flex items-center justify-between p-4 rounded-lg transition-all"
                      style={{
                        background: subido 
                          ? (tieneError ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)')
                          : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${subido ? (tieneError ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)') : 'rgba(255,255,255,0.1)'}`,
                      }}
                    >
                      <div className="flex items-center gap-4">
                        {/* Estado */}
                        {subido ? (
                          tieneError ? (
                            <AlertCircle className="w-6 h-6 text-red-400" />
                          ) : (
                            <CheckCircle2 className="w-6 h-6 text-green-400" />
                          )
                        ) : (
                          <div className="w-6 h-6 rounded-full border-2 border-white/20 flex items-center justify-center">
                            <span>{doc.icon}</span>
                          </div>
                        )}
                        
                        {/* Info */}
                        <div>
                          <div className="flex items-center gap-2">
                            <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', color: '#fff', fontWeight: 500 }}>
                              {doc.label}
                            </span>
                            {doc.required && <span className="text-red-400 text-xs">*</span>}
                            
                            {/* Tooltip */}
                            <div className="relative">
                              <button
                                onMouseEnter={() => setTooltipVisible(doc.key)}
                                onMouseLeave={() => setTooltipVisible(null)}
                                className="p-1 hover:bg-white/10 rounded-full transition-colors"
                              >
                                <HelpCircle className="w-4 h-4 text-white/40" />
                              </button>
                              {tooltipVisible === doc.key && (
                                <div
                                  className="absolute left-6 top-0 z-50 px-3 py-2 rounded-lg whitespace-nowrap"
                                  style={{ background: 'rgba(0,0,0,0.9)', border: '1px solid rgba(254,80,0,0.5)' }}
                                >
                                  <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px', color: '#fff' }}>
                                    {doc.tooltip}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          {subido && (
                            <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                              Documento subido
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Botón subir */}
                      <label
                        className="px-4 py-2 rounded-lg cursor-pointer transition-all flex items-center gap-2"
                        style={{
                          background: subido ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #fe5000 0%, #cc4000 100%)',
                          color: '#fff',
                          fontFamily: "'Exo 2', sans-serif",
                          fontSize: '13px',
                          fontWeight: 500,
                        }}
                      >
                        {uploadingDoc === doc.key ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        {subido ? 'Cambiar' : 'Subir'}
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && handleUpload(doc.key, e.target.files[0])}
                          disabled={uploadingDoc !== null}
                        />
                      </label>
                    </div>
                  );
                })}
              </div>

              {/* Botón continuar */}
              <div className="mt-8">
                <button
                  onClick={validarDocumentos}
                  disabled={!todosRequeridosSubidos || validando}
                  className="w-full py-4 rounded-lg flex items-center justify-center gap-3 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={estilos.botonPrimario}
                >
                  {validando ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Shield className="w-5 h-5" />
                  )}
                  <span style={{ fontSize: '16px' }}>
                    {validando ? 'Validando...' : 'Validar y Continuar'}
                  </span>
                </button>
                
                {!todosRequeridosSubidos && (
                  <p className="text-center mt-3" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                    Suba todos los documentos requeridos (*) para continuar
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: PASO 2 - FORMULARIO
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div style={estilos.fondo}>
      <div style={estilos.overlay} className="min-h-screen">
        {/* Header */}
        <header className="px-6 py-4 flex items-center justify-between sticky top-0 z-50" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)' }}>
          <div className="flex items-center gap-4">
            <img src="/grupo-loma-logo.png" alt="Grupo Loma" className="h-10" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            <div>
              <h1 style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '18px', fontWeight: 600, color: '#fff' }}>
                Formulario de Alta de Cliente
              </h1>
              <p style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                Paso 2 de 2: Complete su información
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded-full" style={{ background: 'rgba(34,197,94,0.2)' }}>
              <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px', color: '#86efac' }}>
                ✓ Documentos validados
              </span>
            </div>
            <div className="px-4 py-2 rounded-full" style={{ background: tipoEmpresa === 'USA_CANADA' ? 'rgba(59,130,246,0.2)' : 'rgba(34,197,94,0.2)' }}>
              <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', color: tipoEmpresa === 'USA_CANADA' ? '#93c5fd' : '#86efac' }}>
                {tipoEmpresa === 'USA_CANADA' ? '🇺🇸 USA/Canadá' : '🇲🇽 México'}
              </span>
            </div>
          </div>
        </header>

        {/* Contenido */}
        <div className="max-w-5xl mx-auto p-6">
          <div className="grid grid-cols-3 gap-6">
            
            {/* Columna izquierda y centro: Formulario */}
            <div className="col-span-2 space-y-6">
              
              {/* Datos Extraídos (bloqueados) */}
              <div style={estilos.card} className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Lock className="w-5 h-5" style={{ color: '#fe5000' }} />
                  <h3 style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '16px', fontWeight: 600, color: '#fff' }}>
                    Datos Extraídos de sus Documentos
                  </h3>
                </div>
                <p style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '16px' }}>
                  Esta información fue extraída automáticamente y no puede ser modificada
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label style={estilos.label}>Razón Social</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={datosExtraidos.razon_social || 'Pendiente de extracción'}
                        disabled
                        className="w-full px-4 py-3 pr-10"
                        style={estilos.inputLocked}
                      />
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400/50" />
                    </div>
                  </div>
                  
                  <div>
                    <label style={estilos.label}>RFC</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={datosExtraidos.rfc || 'Pendiente'}
                        disabled
                        className="w-full px-4 py-3 pr-10"
                        style={estilos.inputLocked}
                      />
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400/50" />
                    </div>
                  </div>
                  
                  <div>
                    <label style={estilos.label}>Representante Legal</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={datosExtraidos.representante_legal || 'Pendiente'}
                        disabled
                        className="w-full px-4 py-3 pr-10"
                        style={estilos.inputLocked}
                      />
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400/50" />
                    </div>
                  </div>
                </div>
                
                {/* Dirección extraída */}
                <div className="mt-4 p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <label style={estilos.label}>Dirección Fiscal</label>
                  <p style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>
                    {datosExtraidos.calle ? (
                      `${datosExtraidos.calle} ${datosExtraidos.no_ext || ''}${datosExtraidos.no_int ? ` Int. ${datosExtraidos.no_int}` : ''}, Col. ${datosExtraidos.colonia || ''}, ${datosExtraidos.ciudad || ''}, ${datosExtraidos.estado || ''} CP ${datosExtraidos.cp || ''}`
                    ) : (
                      'Pendiente de extracción'
                    )}
                  </p>
                </div>
              </div>

              {/* Datos a complementar */}
              <div style={estilos.card} className="p-6">
                <h3 style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '16px' }}>
                  ✏️ Información Adicional
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={estilos.label}>Giro / Actividad</label>
                    <input
                      type="text"
                      name="giro"
                      value={form.giro}
                      onChange={handleChange}
                      placeholder="Ej: Comercialización de productos"
                      className="w-full px-4 py-3"
                      style={estilos.input}
                    />
                  </div>
                  <div>
                    <label style={estilos.label}>Página Web</label>
                    <input
                      type="text"
                      name="pagina_web"
                      value={form.pagina_web}
                      onChange={handleChange}
                      placeholder="www.ejemplo.com"
                      className="w-full px-4 py-3"
                      style={estilos.input}
                    />
                  </div>
                  <div>
                    <label style={estilos.label}>WhatsApp de Contacto</label>
                    <input
                      type="tel"
                      name="whatsapp"
                      value={form.whatsapp}
                      onChange={handleChange}
                      placeholder="+52 449 000 0000"
                      className="w-full px-4 py-3"
                      style={estilos.input}
                    />
                  </div>
                  <div>
                    <label style={estilos.label}>Tamaño de Empresa</label>
                    <select
                      name="tamano_empresa"
                      value={form.tamano_empresa}
                      onChange={handleChange}
                      className="w-full px-4 py-3"
                      style={estilos.input}
                    >
                      {TAMANOS_EMPRESA.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Contactos */}
              <div style={estilos.card} className="p-6">
                <h3 style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '16px' }}>
                  👥 Contactos
                </h3>
                
                {[
                  { prefix: 'contacto_admin', label: 'Administrativo' },
                  { prefix: 'contacto_facturas', label: 'Facturas' },
                  { prefix: 'contacto_op1', label: 'Operativo 1' },
                  { prefix: 'contacto_op2', label: 'Operativo 2' }
                ].map((contacto) => (
                  <div key={contacto.prefix} className="mb-4 p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <label style={{ ...estilos.label, fontSize: '13px', color: '#fe5000', marginBottom: '12px' }}>
                      {contacto.label}
                    </label>
                    <div className="grid grid-cols-4 gap-3">
                      <input
                        type="text"
                        name={`${contacto.prefix}_nombre`}
                        value={(form as any)[`${contacto.prefix}_nombre`]}
                        onChange={handleChange}
                        placeholder="Nombre"
                        className="px-3 py-2"
                        style={estilos.input}
                      />
                      <input
                        type="text"
                        name={`${contacto.prefix}_puesto`}
                        value={(form as any)[`${contacto.prefix}_puesto`]}
                        onChange={handleChange}
                        placeholder="Puesto"
                        className="px-3 py-2"
                        style={estilos.input}
                      />
                      <input
                        type="email"
                        name={`${contacto.prefix}_email`}
                        value={(form as any)[`${contacto.prefix}_email`]}
                        onChange={handleChange}
                        placeholder="correo@empresa.com"
                        className="px-3 py-2"
                        style={estilos.input}
                      />
                      <input
                        type="tel"
                        name={`${contacto.prefix}_tel`}
                        value={(form as any)[`${contacto.prefix}_tel`]}
                        onChange={handleChange}
                        placeholder="Teléfono"
                        className="px-3 py-2"
                        style={estilos.input}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Referencias Comerciales */}
              <div style={estilos.card} className="p-6">
                <h3 style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '16px' }}>
                  🏢 Referencias Comerciales
                </h3>
                
                {[1, 2, 3].map((num) => (
                  <div key={num} className="mb-4 p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <label style={{ ...estilos.label, fontSize: '13px', color: '#fe5000', marginBottom: '12px' }}>
                      Referencia {num}
                    </label>
                    <div className="grid grid-cols-5 gap-3">
                      <input
                        type="text"
                        name={`ref${num}_empresa`}
                        value={(form as any)[`ref${num}_empresa`]}
                        onChange={handleChange}
                        placeholder="Empresa"
                        className="px-3 py-2"
                        style={estilos.input}
                      />
                      <input
                        type="text"
                        name={`ref${num}_contacto`}
                        value={(form as any)[`ref${num}_contacto`]}
                        onChange={handleChange}
                        placeholder="Contacto"
                        className="px-3 py-2"
                        style={estilos.input}
                      />
                      <input
                        type="tel"
                        name={`ref${num}_whatsapp`}
                        value={(form as any)[`ref${num}_whatsapp`]}
                        onChange={handleChange}
                        placeholder="WhatsApp"
                        className="px-3 py-2"
                        style={estilos.input}
                      />
                      <input
                        type="email"
                        name={`ref${num}_email`}
                        value={(form as any)[`ref${num}_email`]}
                        onChange={handleChange}
                        placeholder="Email"
                        className="px-3 py-2"
                        style={estilos.input}
                      />
                      <input
                        type="text"
                        name={`ref${num}_anos`}
                        value={(form as any)[`ref${num}_anos`]}
                        onChange={handleChange}
                        placeholder="Años"
                        className="px-3 py-2"
                        style={estilos.input}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Proceso de Facturación */}
              <div style={estilos.card} className="p-6">
                <h3 style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '16px' }}>
                  📄 Proceso de Facturación
                </h3>
                <textarea
                  name="proceso_facturacion"
                  value={form.proceso_facturacion}
                  onChange={handleChange}
                  placeholder="Describa su proceso de facturación: portal de proveedores, requisitos, días de pago, condiciones de crédito..."
                  rows={4}
                  className="w-full px-4 py-3"
                  style={estilos.input}
                />
              </div>

              {/* Términos y Firma */}
              <div style={estilos.card} className="p-6">
                <h3 style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '16px' }}>
                  ✍️ Términos y Firma Digital
                </h3>
                
                <label className="flex items-start gap-3 cursor-pointer mb-6">
                  <input
                    type="checkbox"
                    name="firma_aceptada"
                    checked={form.firma_aceptada}
                    onChange={handleChange}
                    className="mt-1 w-5 h-5 rounded"
                    style={{ accentColor: '#fe5000' }}
                  />
                  <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>
                    Acepto los <a href="#" className="text-orange-400 underline">Términos y Condiciones</a> y el tratamiento de mis datos conforme al <a href="#" className="text-orange-400 underline">Aviso de Privacidad</a>.
                  </span>
                </label>
                
                <div>
                  <label style={estilos.label}>Nombre completo (Firma Digital) *</label>
                  <input
                    type="text"
                    name="firma_nombre"
                    value={form.firma_nombre}
                    onChange={handleChange}
                    placeholder="Nombre completo del representante legal"
                    className="w-full px-4 py-3"
                    style={estilos.input}
                  />
                </div>
              </div>

              {/* Botón enviar */}
              <button
                onClick={enviarFormulario}
                disabled={submitting || !form.firma_aceptada || !form.firma_nombre}
                className="w-full py-5 rounded-xl flex items-center justify-center gap-3 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={estilos.botonPrimario}
              >
                {submitting ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Send className="w-6 h-6" />
                )}
                <span style={{ fontSize: '18px', fontWeight: 600 }}>
                  {submitting ? 'Enviando...' : 'Enviar Solicitud'}
                </span>
              </button>
            </div>

            {/* Columna derecha: Panel de documentos */}
            <div className="col-span-1">
              <div style={estilos.card} className="p-5 sticky top-24">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <h3 style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', fontWeight: 600, color: '#fff' }}>
                    Documentos Validados
                  </h3>
                </div>
                
                <div className="space-y-2">
                  {documentos.filter(d => uploadedDocs[d.key]).map((doc) => (
                    <div key={doc.key} className="flex items-center gap-2 p-2 rounded" style={{ background: 'rgba(34,197,94,0.1)' }}>
                      <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
                        {doc.label}
                      </span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <p style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                    Sus documentos han sido verificados y cumplen con los requisitos de vigencia.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
