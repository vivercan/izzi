import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Upload, CheckCircle2, AlertCircle, Loader2, Send, Shield, HelpCircle, FolderUp, RefreshCw } from 'lucide-react';

const supabaseUrl = 'https://fbxbsslhewchyibdoyzk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieGJzc2xoZXdjaHlpYmRveXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzczODEsImV4cCI6MjA3ODExMzM4MX0.Z8JPlg7hhKbA624QGHp2bKKTNtCD3WInQMO5twjl6a0';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface AltaClientePublicoProps {
  solicitudId: string;
}

interface DatosExtraidos {
  rfc?: string;
  razon_social?: string;
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
  'Seleccione...',
  '1-10 colaboradores',
  '11-50 colaboradores',
  '51-200 colaboradores',
  '201-500 colaboradores',
  '500+ colaboradores'
];

const DOCS_MEXICANA = [
  { key: 'constancia_fiscal', label: 'Constancia Situación Fiscal', required: true, tooltip: 'Mes actual' },
  { key: 'opinion_cumplimiento', label: 'Opinión de Cumplimiento', required: true, tooltip: 'Mes actual' },
  { key: 'comprobante_domicilio', label: 'Comprobante Domicilio', required: true, tooltip: 'Últimos 3 meses' },
  { key: 'ine_representante', label: 'INE Representante Legal', required: true, tooltip: 'Vigente' },
  { key: 'acta_constitutiva', label: 'Acta Constitutiva', required: true, tooltip: 'Copia' },
  { key: 'poder_notarial', label: 'Poder Notarial', required: false, tooltip: 'Opcional' }
];

const DOCS_USA = [
  { key: 'w9', label: 'W-9 Form', required: true, tooltip: 'Año actual' },
  { key: 'bank_statement', label: 'Bank Statement', required: true, tooltip: 'Últimos 3 meses' },
  { key: 'mc_number', label: 'MC# Certificate', required: true, tooltip: 'Vigente' },
  { key: 'void_check', label: 'Void Check', required: true, tooltip: 'Verificación' },
  { key: 'id_document', label: 'ID Document', required: true, tooltip: 'Vigente' }
];

export function AltaClientePublico({ solicitudId }: AltaClientePublicoProps) {
  const [loading, setLoading] = useState(true);
  const [solicitud, setSolicitud] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Pasos: 'documentos' | 'validando' | 'errores' | 'formulario' | 'enviado' | 'completado'
  const [paso, setPaso] = useState<'documentos' | 'validando' | 'errores' | 'formulario' | 'enviado' | 'completado'>('documentos');
  
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [uploadingAll, setUploadingAll] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, string>>({});
  const [tooltipVisible, setTooltipVisible] = useState<string | null>(null);
  const [erroresValidacion, setErroresValidacion] = useState<ErrorValidacion[]>([]);
  const [datosExtraidos, setDatosExtraidos] = useState<DatosExtraidos>({});
  const [validacionProgreso, setValidacionProgreso] = useState(0);
  const multipleInputRef = useRef<HTMLInputElement>(null);
  
  const [form, setForm] = useState<FormData>({
    giro: '', pagina_web: '', tamano_empresa: 'Seleccione...', whatsapp: '',
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

  const tipoEmpresa = solicitud?.tipo_empresa || 'MEXICANA';
  const documentos = tipoEmpresa === 'USA_CANADA' ? DOCS_USA : DOCS_MEXICANA;
  const docsRequeridos = documentos.filter(d => d.required);
  const todosRequeridosSubidos = docsRequeridos.every(d => uploadedDocs[d.key]);
  const cantidadSubidos = documentos.filter(d => uploadedDocs[d.key]).length;

  useEffect(() => {
    if (solicitudId) fetchSolicitud();
  }, [solicitudId]);

  const fetchSolicitud = async () => {
    try {
      const { data, error } = await supabase.from('alta_clientes').select('*').eq('id', solicitudId).single();
      if (error) throw error;
      if (!data) throw new Error('Solicitud no encontrada');
      setSolicitud(data);
      
      // Restaurar estado según BD
      if (data.estatus === 'COMPLETADA') {
        setPaso('completado');
      } else if (['PENDIENTE_CSR', 'PENDIENTE_CXC', 'PENDIENTE_CONFIRMACION'].includes(data.estatus)) {
        setPaso('enviado');
      } else if (data.documentos_validados && data.datos_extraidos) {
        setDatosExtraidos(data.datos_extraidos);
        setPaso('formulario');
      } else if (data.errores_validacion && data.errores_validacion.length > 0) {
        setErroresValidacion(data.errores_validacion);
        setPaso('errores');
      }
      
      if (data.documentos) setUploadedDocs(data.documentos);
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
      const { error: uploadError } = await supabase.storage.from('alta-documentos').upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const newDocs = { ...uploadedDocs, [docKey]: fileName };
      setUploadedDocs(newDocs);
      await supabase.from('alta_clientes').update({ documentos: newDocs }).eq('id', solicitudId);
      // Limpiar error de este doc si existía
      setErroresValidacion(prev => prev.filter(e => !e.documento.toLowerCase().includes(docKey.replace('_', ' '))));
    } catch (err) {
      console.error('Error subiendo:', err);
      alert('Error al subir el documento');
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleUploadMultiple = async (files: FileList) => {
    setUploadingAll(true);
    const newDocs = { ...uploadedDocs };
    
    const fileMapping: Record<string, string[]> = {
      'constancia_fiscal': ['constancia', 'situacion', 'fiscal', 'csf'],
      'opinion_cumplimiento': ['opinion', 'cumplimiento', '32d'],
      'comprobante_domicilio': ['comprobante', 'domicilio', 'luz', 'agua', 'cfe', 'telmex'],
      'ine_representante': ['ine', 'identificacion', 'credencial'],
      'acta_constitutiva': ['acta', 'constitutiva'],
      'poder_notarial': ['poder', 'notarial']
    };

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileName = file.name.toLowerCase();
      
      let matchedKey = '';
      for (const [key, keywords] of Object.entries(fileMapping)) {
        if (keywords.some(kw => fileName.includes(kw))) {
          matchedKey = key;
          break;
        }
      }
      
      if (!matchedKey) {
        const pendingDoc = documentos.find(d => !newDocs[d.key]);
        if (pendingDoc) matchedKey = pendingDoc.key;
      }
      
      if (matchedKey && !newDocs[matchedKey]) {
        try {
          const fileExt = file.name.split('.').pop();
          const storageName = `${solicitudId}/${matchedKey}_${Date.now()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage.from('alta-documentos').upload(storageName, file, { upsert: true });
          if (!uploadError) newDocs[matchedKey] = storageName;
        } catch (err) {
          console.error('Error:', err);
        }
      }
    }
    
    setUploadedDocs(newDocs);
    await supabase.from('alta_clientes').update({ documentos: newDocs }).eq('id', solicitudId);
    setUploadingAll(false);
  };

  const validarDocumentos = async () => {
    setPaso('validando');
    setValidacionProgreso(0);
    setErroresValidacion([]);

    // Simular progreso mientras la IA trabaja
    const interval = setInterval(() => {
      setValidacionProgreso(prev => Math.min(prev + 10, 90));
    }, 500);

    try {
      const response = await fetch('/api/validar-documentos-alta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          solicitudId,
          documentos: uploadedDocs,
          tipoEmpresa
        })
      });

      clearInterval(interval);
      setValidacionProgreso(100);

      const result = await response.json();

      if (!result.success) {
        setErroresValidacion(result.errores || [{ documento: 'General', error: 'Error en validación', solucion: 'Intente de nuevo' }]);
        setPaso('errores');
      } else {
        setDatosExtraidos(result.datosExtraidos || {});
        setPaso('formulario');
      }
    } catch (err) {
      clearInterval(interval);
      console.error('Error validando:', err);
      // Si falla la validación IA, permitir continuar de todos modos
      setPaso('formulario');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') setForm(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    else setForm(prev => ({ ...prev, [name]: value }));
  };

  const enviarFormulario = async () => {
    if (!form.firma_aceptada || !form.firma_nombre) {
      alert('Debe aceptar los términos y firmar digitalmente');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('alta_clientes').update({ 
        ...form, 
        estatus: 'PENDIENTE_CSR', 
        firma_fecha: new Date().toISOString() 
      }).eq('id', solicitudId);
      if (error) throw error;
      
      // Enviar notificación por correo (Edge Function)
      try {
        await fetch(`${supabaseUrl}/functions/v1/enviar-correo-alta`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseAnonKey}` },
          body: JSON.stringify({ solicitudId, tipo: 'cliente_completo' })
        });
      } catch (e) { console.log('Error enviando correo:', e); }
      
      setPaso('enviado');
    } catch (err) {
      console.error('Error:', err);
      alert('Error al enviar la solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ESTADOS: LOADING / ERROR / COMPLETADO / ENVIADO
  // ═══════════════════════════════════════════════════════════════════════════
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #001f4d 0%, #0066cc 50%, #4da6ff 100%)' }}>
        <Loader2 className="w-16 h-16 animate-spin text-white/50" />
      </div>
    );
  }

  if (error || !solicitud) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #001f4d 0%, #0066cc 50%, #4da6ff 100%)' }}>
        <div className="bg-[#0a1628]/95 p-10 rounded-2xl text-center max-w-md border border-white/10">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-orange-500" />
          <h2 className="text-2xl font-semibold text-white mb-2" style={{ fontFamily: "'Exo 2'" }}>Solicitud no encontrada</h2>
          <p className="text-white/60" style={{ fontFamily: "'Exo 2'" }}>El enlace puede haber expirado o ser incorrecto.</p>
        </div>
      </div>
    );
  }

  if (paso === 'completado' || paso === 'enviado') {
    const esCompletado = paso === 'completado';
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #001f4d 0%, #0066cc 50%, #4da6ff 100%)' }}>
        <div className="bg-[#0a1628]/95 p-12 rounded-2xl text-center max-w-lg border border-white/10">
          <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${esCompletado ? 'bg-green-500/20' : 'bg-blue-500/20'}`}>
            {esCompletado ? <CheckCircle2 className="w-10 h-10 text-green-400" /> : <Send className="w-10 h-10 text-blue-400" />}
          </div>
          <h2 className="text-2xl font-semibold text-white mb-3" style={{ fontFamily: "'Exo 2'" }}>
            {esCompletado ? '¡Alta Completada!' : '¡Solicitud Enviada!'}
          </h2>
          <p className="text-white/70 text-lg" style={{ fontFamily: "'Exo 2'" }}>
            {esCompletado ? 'Su empresa ha sido dada de alta exitosamente.' : 'Hemos recibido su información. Pronto recibirá confirmación por correo.'}
          </p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VALIDANDO
  // ═══════════════════════════════════════════════════════════════════════════
  if (paso === 'validando') {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #001f4d 0%, #0066cc 50%, #4da6ff 100%)' }}>
        <div className="bg-[#0a1628]/95 p-10 rounded-2xl text-center max-w-md border border-white/10">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center bg-orange-500/20">
            <Shield className="w-10 h-10 text-orange-400 animate-pulse" />
          </div>
          <h2 className="text-2xl font-semibold text-white mb-3" style={{ fontFamily: "'Exo 2'" }}>Validando Documentos</h2>
          <p className="text-white/60 mb-6" style={{ fontFamily: "'Exo 2'" }}>
            Verificando vigencias y extrayendo información...
          </p>
          
          {/* Barra de progreso */}
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-4">
            <div 
              className="h-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-300"
              style={{ width: `${validacionProgreso}%` }}
            />
          </div>
          <p className="text-white/40 text-sm" style={{ fontFamily: "'Exo 2'" }}>{validacionProgreso}%</p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ERRORES DE VALIDACIÓN
  // ═══════════════════════════════════════════════════════════════════════════
  if (paso === 'errores') {
    return (
      <div className="h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #001f4d 0%, #0066cc 50%, #4da6ff 100%)' }}>
        <header className="px-6 py-3 flex items-center justify-between" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div>
            <h1 className="text-xl font-semibold text-white" style={{ fontFamily: "'Exo 2'" }}>Alta de Cliente</h1>
            <p className="text-sm text-white/60" style={{ fontFamily: "'Exo 2'" }}>Corrija los documentos</p>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#0a1628]/95 rounded-2xl border border-white/10 p-8">
            <div className="flex items-center gap-3 mb-6">
              <AlertCircle className="w-8 h-8 text-red-400" />
              <h2 className="text-xl font-semibold text-white" style={{ fontFamily: "'Exo 2'" }}>
                Problemas encontrados
              </h2>
            </div>
            
            <div className="space-y-4 mb-8">
              {erroresValidacion.map((err, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                  <p className="text-red-300 font-semibold mb-1" style={{ fontFamily: "'Exo 2'" }}>
                    ❌ {err.documento}
                  </p>
                  <p className="text-white/70 text-sm mb-2" style={{ fontFamily: "'Exo 2'" }}>{err.error}</p>
                  <p className="text-white/50 text-sm" style={{ fontFamily: "'Exo 2'" }}>→ {err.solucion}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => { setErroresValidacion([]); setPaso('documentos'); }}
                className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 transition-colors"
              >
                <RefreshCw className="w-5 h-5 text-white" />
                <span className="text-white font-semibold" style={{ fontFamily: "'Exo 2'" }}>Corregir Documentos</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PASO 1: DOCUMENTOS
  // ═══════════════════════════════════════════════════════════════════════════
  if (paso === 'documentos') {
    return (
      <div className="h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #001f4d 0%, #003d7a 25%, #0066cc 50%, #1a8fff 75%, #4da6ff 100%)' }}>
        <header className="px-6 py-3 flex items-center justify-between" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div>
            <h1 className="text-xl font-semibold text-white" style={{ fontFamily: "'Exo 2'" }}>Alta de Cliente</h1>
            <p className="text-sm text-white/60" style={{ fontFamily: "'Exo 2'" }}>Paso 1: Documentación</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-white/70 text-sm" style={{ fontFamily: "'Exo 2'" }}>{cantidadSubidos}/{documentos.length}</span>
            <div className="px-4 py-1.5 rounded-full bg-green-500/20">
              <span className="text-white font-medium" style={{ fontFamily: "'Exo 2'" }}>
                {tipoEmpresa === 'USA_CANADA' ? '🇺🇸 USA' : '🇲🇽 México'}
              </span>
            </div>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-5xl">
            <div className="bg-[#0a1628]/95 rounded-2xl border border-white/10 p-6" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
              
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-white" style={{ fontFamily: "'Exo 2'" }}>Suba sus documentos</h2>
                  <p className="text-sm text-white/50" style={{ fontFamily: "'Exo 2'" }}>Validaremos vigencias y extraeremos la información</p>
                </div>
                <label className="px-5 py-2.5 rounded-xl cursor-pointer flex items-center gap-2 transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}>
                  {uploadingAll ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : <FolderUp className="w-5 h-5 text-white" />}
                  <span className="text-white font-semibold" style={{ fontFamily: "'Exo 2'" }}>Subir Todos</span>
                  <input
                    ref={multipleInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    multiple
                    className="hidden"
                    onChange={(e) => e.target.files && handleUploadMultiple(e.target.files)}
                    disabled={uploadingAll}
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {documentos.map((doc) => {
                  const subido = !!uploadedDocs[doc.key];
                  const tieneError = erroresValidacion.some(e => e.documento.toLowerCase().includes(doc.label.toLowerCase().split(' ')[0]));
                  return (
                    <div
                      key={doc.key}
                      className="flex items-center justify-between p-3 rounded-xl transition-all"
                      style={{
                        background: tieneError ? 'rgba(239,68,68,0.12)' : subido ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.04)',
                        border: `1.5px solid ${tieneError ? 'rgba(239,68,68,0.35)' : subido ? 'rgba(34,197,94,0.35)' : 'rgba(255,255,255,0.1)'}`,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        {tieneError ? (
                          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                        ) : subido ? (
                          <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-white/25 flex-shrink-0" />
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-white font-medium text-sm" style={{ fontFamily: "'Exo 2'" }}>{doc.label}</span>
                            {doc.required && <span className="text-red-400 text-xs">*</span>}
                            <div className="relative">
                              <button
                                onMouseEnter={() => setTooltipVisible(doc.key)}
                                onMouseLeave={() => setTooltipVisible(null)}
                                className="p-0.5 hover:bg-white/10 rounded-full"
                              >
                                <HelpCircle className="w-3.5 h-3.5 text-white/40" />
                              </button>
                              {tooltipVisible === doc.key && (
                                <div className="absolute left-5 top-0 z-50 px-2 py-1 rounded bg-black/95 border border-orange-500/50 whitespace-nowrap">
                                  <span className="text-xs text-white" style={{ fontFamily: "'Exo 2'" }}>{doc.tooltip}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          {subido && !tieneError && <span className="text-xs text-green-400/80">✓ Subido</span>}
                          {tieneError && <span className="text-xs text-red-400/80">⚠ Requiere corrección</span>}
                        </div>
                      </div>
                      <label
                        className="px-3 py-1.5 rounded-lg cursor-pointer flex items-center gap-1.5 transition-all text-sm"
                        style={{
                          background: subido ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #fe5000 0%, #cc4000 100%)',
                          color: '#fff',
                          fontFamily: "'Exo 2'",
                          fontWeight: 500,
                        }}
                      >
                        {uploadingDoc === doc.key ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {subido ? 'Cambiar' : 'Subir'}
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && handleUpload(doc.key, e.target.files[0])}
                          disabled={uploadingDoc !== null || uploadingAll}
                        />
                      </label>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={validarDocumentos}
                disabled={!todosRequeridosSubidos}
                className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: todosRequeridosSubidos ? 'linear-gradient(135deg, #fe5000 0%, #cc4000 100%)' : 'rgba(255,255,255,0.1)' }}
              >
                <Shield className="w-5 h-5 text-white" />
                <span className="text-white font-semibold text-lg" style={{ fontFamily: "'Exo 2'" }}>Validar y Continuar</span>
              </button>
              
              {!todosRequeridosSubidos && (
                <p className="text-center mt-3 text-white/50 text-sm" style={{ fontFamily: "'Exo 2'" }}>
                  Complete los documentos marcados con * para continuar
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PASO 2: FORMULARIO - Solo campos a completar (datos extraídos ya guardados)
  // ═══════════════════════════════════════════════════════════════════════════
  const inputStyle = "w-full px-4 py-3 bg-white/5 border border-white/15 rounded-lg text-white text-base outline-none focus:border-orange-500/50 transition-colors";
  const labelStyle = "block text-sm font-medium text-white/70 mb-2";

  // Mostrar resumen de datos extraídos
  const tieneExtraccion = datosExtraidos.rfc || datosExtraidos.razon_social;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #001f4d 0%, #003d7a 25%, #0066cc 50%, #1a8fff 75%, #4da6ff 100%)' }}>
      <header className="px-6 py-3 flex items-center justify-between sticky top-0 z-50" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)' }}>
        <div>
          <h1 className="text-xl font-semibold text-white" style={{ fontFamily: "'Exo 2'" }}>Alta de Cliente</h1>
          <p className="text-sm text-white/60" style={{ fontFamily: "'Exo 2'" }}>Paso 2: Complete su información</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-full bg-green-500/20 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span className="text-green-300 text-sm font-medium" style={{ fontFamily: "'Exo 2'" }}>Docs Validados</span>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        
        {/* Resumen de datos extraídos */}
        {tieneExtraccion && (
          <div className="bg-green-500/10 rounded-xl border border-green-500/30 p-5">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <h3 className="text-lg font-semibold text-white" style={{ fontFamily: "'Exo 2'" }}>Datos extraídos de sus documentos</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {datosExtraidos.razon_social && (
                <div>
                  <span className="text-white/50">Razón Social:</span>
                  <span className="text-white ml-2 font-medium">{datosExtraidos.razon_social}</span>
                </div>
              )}
              {datosExtraidos.rfc && (
                <div>
                  <span className="text-white/50">RFC:</span>
                  <span className="text-white ml-2 font-medium">{datosExtraidos.rfc}</span>
                </div>
              )}
              {datosExtraidos.representante_legal && (
                <div>
                  <span className="text-white/50">Rep. Legal:</span>
                  <span className="text-white ml-2 font-medium">{datosExtraidos.representante_legal}</span>
                </div>
              )}
              {datosExtraidos.calle && (
                <div className="col-span-2">
                  <span className="text-white/50">Dirección:</span>
                  <span className="text-white ml-2 font-medium">
                    {datosExtraidos.calle} {datosExtraidos.no_ext}, {datosExtraidos.colonia}, {datosExtraidos.ciudad}, {datosExtraidos.estado} CP {datosExtraidos.cp}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info General */}
        <div className="bg-[#0a1628]/95 rounded-xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-5" style={{ fontFamily: "'Exo 2'" }}>📋 Información Adicional</h3>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label style={{ fontFamily: "'Exo 2'" }} className={labelStyle}>Giro / Actividad</label>
              <input type="text" name="giro" value={form.giro} onChange={handleChange} placeholder="Ej: Comercialización de productos" style={{ fontFamily: "'Exo 2'" }} className={inputStyle} />
            </div>
            <div>
              <label style={{ fontFamily: "'Exo 2'" }} className={labelStyle}>Página Web</label>
              <input type="text" name="pagina_web" value={form.pagina_web} onChange={handleChange} placeholder="www.empresa.com" style={{ fontFamily: "'Exo 2'" }} className={inputStyle} />
            </div>
            <div>
              <label style={{ fontFamily: "'Exo 2'" }} className={labelStyle}>WhatsApp</label>
              <input type="tel" name="whatsapp" value={form.whatsapp} onChange={handleChange} placeholder="+52 449 000 0000" style={{ fontFamily: "'Exo 2'" }} className={inputStyle} />
            </div>
            <div>
              <label style={{ fontFamily: "'Exo 2'" }} className={labelStyle}>Tamaño de Empresa</label>
              <select name="tamano_empresa" value={form.tamano_empresa} onChange={handleChange} style={{ fontFamily: "'Exo 2'" }} className={inputStyle}>
                {TAMANOS_EMPRESA.map(t => <option key={t} value={t} style={{ background: '#1a1a2e' }}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Contactos */}
        <div className="bg-[#0a1628]/95 rounded-xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-5" style={{ fontFamily: "'Exo 2'" }}>👥 Contactos</h3>
          {[
            { prefix: 'contacto_admin', label: 'Administrativo', color: '#fe5000' },
            { prefix: 'contacto_facturas', label: 'Facturas', color: '#3b82f6' },
            { prefix: 'contacto_op1', label: 'Operativo 1', color: '#22c55e' },
            { prefix: 'contacto_op2', label: 'Operativo 2', color: '#a855f7' }
          ].map((c) => (
            <div key={c.prefix} className="mb-4 p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${c.color}25` }}>
              <label className="block text-sm font-semibold mb-3" style={{ fontFamily: "'Exo 2'", color: c.color }}>{c.label}</label>
              <div className="grid grid-cols-4 gap-3">
                <input type="text" name={`${c.prefix}_nombre`} value={(form as any)[`${c.prefix}_nombre`]} onChange={handleChange} placeholder="Nombre" style={{ fontFamily: "'Exo 2'" }} className={inputStyle} />
                <input type="text" name={`${c.prefix}_puesto`} value={(form as any)[`${c.prefix}_puesto`]} onChange={handleChange} placeholder="Puesto" style={{ fontFamily: "'Exo 2'" }} className={inputStyle} />
                <input type="email" name={`${c.prefix}_email`} value={(form as any)[`${c.prefix}_email`]} onChange={handleChange} placeholder="correo@emp.com" style={{ fontFamily: "'Exo 2'" }} className={inputStyle} />
                <input type="tel" name={`${c.prefix}_tel`} value={(form as any)[`${c.prefix}_tel`]} onChange={handleChange} placeholder="Teléfono" style={{ fontFamily: "'Exo 2'" }} className={inputStyle} />
              </div>
            </div>
          ))}
        </div>

        {/* Referencias */}
        <div className="bg-[#0a1628]/95 rounded-xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-5" style={{ fontFamily: "'Exo 2'" }}>🏢 Referencias Comerciales</h3>
          {[1, 2, 3].map((n) => (
            <div key={n} className="mb-4 p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <label className="block text-sm font-semibold text-orange-500 mb-3" style={{ fontFamily: "'Exo 2'" }}>Referencia {n}</label>
              <div className="grid grid-cols-5 gap-3">
                <input type="text" name={`ref${n}_empresa`} value={(form as any)[`ref${n}_empresa`]} onChange={handleChange} placeholder="Empresa" style={{ fontFamily: "'Exo 2'" }} className={inputStyle} />
                <input type="text" name={`ref${n}_contacto`} value={(form as any)[`ref${n}_contacto`]} onChange={handleChange} placeholder="Contacto" style={{ fontFamily: "'Exo 2'" }} className={inputStyle} />
                <input type="tel" name={`ref${n}_whatsapp`} value={(form as any)[`ref${n}_whatsapp`]} onChange={handleChange} placeholder="WhatsApp" style={{ fontFamily: "'Exo 2'" }} className={inputStyle} />
                <input type="email" name={`ref${n}_email`} value={(form as any)[`ref${n}_email`]} onChange={handleChange} placeholder="Email" style={{ fontFamily: "'Exo 2'" }} className={inputStyle} />
                <input type="text" name={`ref${n}_anos`} value={(form as any)[`ref${n}_anos`]} onChange={handleChange} placeholder="Años" style={{ fontFamily: "'Exo 2'" }} className={inputStyle} />
              </div>
            </div>
          ))}
        </div>

        {/* Facturación */}
        <div className="bg-[#0a1628]/95 rounded-xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-5" style={{ fontFamily: "'Exo 2'" }}>📄 Proceso de Facturación</h3>
          <textarea name="proceso_facturacion" value={form.proceso_facturacion} onChange={handleChange} placeholder="Describa: portal de proveedores, requisitos, días de pago, condiciones..." rows={4} style={{ fontFamily: "'Exo 2'", resize: 'vertical' }} className={inputStyle} />
        </div>

        {/* Firma */}
        <div className="bg-[#0a1628]/95 rounded-xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-5" style={{ fontFamily: "'Exo 2'" }}>✍️ Términos y Firma</h3>
          <label className="flex items-start gap-3 cursor-pointer mb-5">
            <input type="checkbox" name="firma_aceptada" checked={form.firma_aceptada} onChange={handleChange} className="mt-1 w-5 h-5 rounded" style={{ accentColor: '#fe5000' }} />
            <span className="text-white/80 text-sm" style={{ fontFamily: "'Exo 2'" }}>
              Acepto los <a href="#" className="text-orange-400 underline">Términos y Condiciones</a> y el <a href="#" className="text-orange-400 underline">Aviso de Privacidad</a>.
            </span>
          </label>
          <div>
            <label style={{ fontFamily: "'Exo 2'" }} className={labelStyle}>Nombre completo (Firma Digital) *</label>
            <input type="text" name="firma_nombre" value={form.firma_nombre} onChange={handleChange} placeholder="Escriba su nombre completo" style={{ fontFamily: "'Exo 2'" }} className={inputStyle} />
          </div>
        </div>

        {/* Botón Enviar */}
        <button
          onClick={enviarFormulario}
          disabled={submitting || !form.firma_aceptada || !form.firma_nombre}
          className="w-full py-4 rounded-xl flex items-center justify-center gap-3 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(135deg, #fe5000 0%, #cc4000 100%)' }}
        >
          {submitting ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : <Send className="w-6 h-6 text-white" />}
          <span className="text-white font-semibold text-lg" style={{ fontFamily: "'Exo 2'" }}>{submitting ? 'Enviando...' : 'Enviar Solicitud'}</span>
        </button>
      </div>
    </div>
  );
}
