// Formulario Alta Cliente v3.0 - Layout 2 columnas con validación IA
import { useState, useEffect } from 'react';
import { Building2, User, Mail, Phone, MapPin, FileText, Upload, CheckCircle2, AlertCircle, Loader2, X, Download, Shield } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface AltaClientePublicoProps {
  solicitudId: string;
}

interface Solicitud {
  id: string;
  email_cliente: string;
  nombre_cliente: string;
  apellido_cliente: string;
  tipo_empresa: 'MEXICANA' | 'USA_CANADA';
  estatus: string;
  razon_social?: string;
  rfc_mc?: string;
}

const DOCUMENTOS_MX = [
  { id: 'csf', nombre: 'Constancia Situación Fiscal', requerido: true },
  { id: 'opinion', nombre: 'Opinión de Cumplimiento', requerido: true },
  { id: 'domicilio', nombre: 'Comprobante Domicilio', requerido: true },
  { id: 'ine', nombre: 'INE Representante Legal', requerido: true },
  { id: 'acta', nombre: 'Acta Constitutiva', requerido: true },
  { id: 'poder', nombre: 'Poder Notarial', requerido: false },
];

const DOCUMENTOS_USA = [
  { id: 'w9', nombre: 'W-9 Form', requerido: true },
  { id: 'bank', nombre: 'Bank Statement (3 meses)', requerido: true },
  { id: 'mc', nombre: 'MC# / DOT# Certificate', requerido: true },
  { id: 'void', nombre: 'Void Check', requerido: true },
  { id: 'domicilio', nombre: 'Proof of Address', requerido: true },
  { id: 'id', nombre: 'ID Representante Legal', requerido: true },
];

export const AltaClientePublico = ({ solicitudId }: AltaClientePublicoProps) => {
  const [solicitud, setSolicitud] = useState<Solicitud | null>(null);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);
  const [validando, setValidando] = useState(false);
  const [mensajeValidacion, setMensajeValidacion] = useState<string | null>(null);

  const [form, setForm] = useState({
    razon_social: '', rfc_mc: '', giro: '', pagina_web: '', tamano_empresa: '',
    calle: '', numero_ext: '', numero_int: '', colonia: '', ciudad: '', estado: '', cp: '', pais: '', whatsapp: '',
    contacto_admin_nombre: '', contacto_admin_puesto: '', contacto_admin_email: '', contacto_admin_tel: '',
    contacto_facturas_nombre: '', contacto_facturas_puesto: '', contacto_facturas_email: '', contacto_facturas_tel: '',
    contacto_operativo_nombre: '', contacto_operativo_puesto: '', contacto_operativo_email: '', contacto_operativo_tel: '',
    contacto_operativo2_nombre: '', contacto_operativo2_puesto: '', contacto_operativo2_email: '', contacto_operativo2_tel: '',
    ref1_empresa: '', ref1_contacto: '', ref1_telefono: '', ref1_email: '', ref1_anos: '',
    ref2_empresa: '', ref2_contacto: '', ref2_telefono: '', ref2_email: '', ref2_anos: '',
    ref3_empresa: '', ref3_contacto: '', ref3_telefono: '', ref3_email: '', ref3_anos: '',
    dias_credito: '30', divisa: 'MXN', proceso_facturacion: '',
    nombre_rep_legal: '', firma_aceptada: false,
  });

  const [archivos, setArchivos] = useState<Record<string, File | null>>({});
  const [subiendo, setSubiendo] = useState<string | null>(null);
  const [documentosSubidos, setDocumentosSubidos] = useState<string[]>([]);

  useEffect(() => { cargarSolicitud(); }, [solicitudId]);

  const documentosRequeridos = solicitud?.tipo_empresa === 'USA_CANADA' ? DOCUMENTOS_USA : DOCUMENTOS_MX;

  const cargarSolicitud = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/alta-cliente/${solicitudId}`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      const data = await response.json();
      if (data.success && data.solicitud) {
        setSolicitud(data.solicitud);
        if (data.solicitud.estatus === 'COMPLETADA') setExito(true);
      } else {
        setError('Solicitud no encontrada o ya fue completada.');
      }
    } catch (err) {
      setError('Error al cargar la solicitud.');
    } finally {
      setCargando(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleFileChange = async (docId: string, file: File | null) => {
    if (!file) return;
    setSubiendo(docId);
    setArchivos(prev => ({ ...prev, [docId]: file }));
    
    // Simular subida - en producción subir a Supabase Storage
    await new Promise(resolve => setTimeout(resolve, 1000));
    setDocumentosSubidos(prev => [...prev.filter(id => id !== docId), docId]);
    setSubiendo(null);
  };

  const handleSubmit = async () => {
    // Validar campos requeridos
    if (!form.razon_social || !form.rfc_mc || !form.calle || !form.cp || !form.whatsapp) {
      setError('Por favor complete todos los campos obligatorios.');
      return;
    }
    if (!form.firma_aceptada || !form.nombre_rep_legal) {
      setError('Debe aceptar los términos y firmar digitalmente.');
      return;
    }

    // Validar documentos requeridos
    const docsRequeridos = documentosRequeridos.filter(d => d.requerido).map(d => d.id);
    const docsFaltantes = docsRequeridos.filter(id => !documentosSubidos.includes(id));
    if (docsFaltantes.length > 0) {
      setError(`Faltan documentos requeridos: ${docsFaltantes.join(', ')}`);
      return;
    }

    setEnviando(true);
    setValidando(true);
    setMensajeValidacion('Validando documentos con IA...');

    try {
      // Obtener IP del cliente
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      const clientIP = ipData.ip;

      // Llamar al backend para validar y guardar
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/alta-cliente/completar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          solicitudId,
          form,
          documentos: documentosSubidos,
          clientIP,
          fechaFirma: new Date().toISOString(),
          userAgent: navigator.userAgent
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setExito(true);
      } else {
        setError(data.error || 'Error al procesar la solicitud.');
      }
    } catch (err) {
      setError('Error de conexión. Intente nuevamente.');
    } finally {
      setEnviando(false);
      setValidando(false);
      setMensajeValidacion(null);
    }
  };

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #001f4d 0%, #003366 100%)' }}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-white">Cargando solicitud...</p>
        </div>
      </div>
    );
  }

  if (exito) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #001f4d 0%, #003366 100%)' }}>
        <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-2xl">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Solicitud Enviada!</h2>
          <p className="text-gray-600 mb-4">Gracias por completar su registro. Nuestro equipo revisará su información.</p>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-green-800 text-sm">Su solicitud ha sido firmada digitalmente y registrada.</p>
          </div>
        </div>
      </div>
    );
  }

  const inputStyle = "w-full px-2 py-1 text-xs text-gray-900 rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none transition-all";
  const labelStyle = "block text-[10px] font-medium text-gray-500 mb-0.5";

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'linear-gradient(180deg, #001f4d 0%, #003366 100%)' }}>
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-2 border-b border-white/10">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <img src="/logo-gl-blanco.png" alt="Grupo Loma" className="h-8" />
          <h1 className="text-base font-bold text-white">Formulario de Alta de Cliente</h1>
          <div className="flex items-center gap-2">
            <a href="/aviso-privacidad.pdf" download className="px-2 py-1 rounded text-[10px] bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-1 transition-all font-medium">
              <Download className="w-3 h-3" /> Aviso Privacidad
            </a>
            <div className="px-2 py-1 rounded text-[10px] font-medium bg-orange-500 text-white">
              {solicitud?.tipo_empresa === 'USA_CANADA' ? '🇺🇸 USA/Canadá' : '🇲🇽 México'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - 2 Columnas */}
      <div className="flex-1 px-4 py-2 overflow-hidden">
        <div className="max-w-[1600px] mx-auto h-full flex gap-3">
          
          {/* COLUMNA IZQUIERDA - Datos (65%) */}
          <div className="flex-1 bg-white rounded-xl shadow-lg p-3 overflow-y-auto">
            
            {error && (
              <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-red-700 text-xs flex-1">{error}</span>
                <button onClick={() => setError(null)}><X className="w-3 h-3 text-red-500" /></button>
              </div>
            )}

            {/* Datos Empresa */}
            <div className="grid grid-cols-6 gap-1 mb-1">
              <div className="col-span-2">
                <label className={labelStyle}>Razón Social *</label>
                <input type="text" name="razon_social" value={form.razon_social} onChange={handleChange} className={inputStyle} />
              </div>
              <div>
                <label className={labelStyle}>{solicitud?.tipo_empresa === 'USA_CANADA' ? 'MC#/DOT#' : 'RFC'} *</label>
                <input type="text" name="rfc_mc" value={form.rfc_mc} onChange={handleChange} className={inputStyle} style={{ textTransform: 'uppercase' }} />
              </div>
              <div>
                <label className={labelStyle}>Giro</label>
                <input type="text" name="giro" value={form.giro} onChange={handleChange} className={inputStyle} />
              </div>
              <div>
                <label className={labelStyle}>Página Web</label>
                <input type="text" name="pagina_web" value={form.pagina_web} onChange={handleChange} className={inputStyle} />
              </div>
              <div>
                <label className={labelStyle}>Tamaño</label>
                <select name="tamano_empresa" value={form.tamano_empresa} onChange={handleChange} className={inputStyle}>
                  <option value="">-</option>
                  <option value="1-10">1-10</option>
                  <option value="11-50">11-50</option>
                  <option value="51-200">51-200</option>
                  <option value="201-500">201-500</option>
                  <option value="500+">500+</option>
                </select>
              </div>
            </div>

            {/* Dirección */}
            <h3 className="text-[11px] font-bold text-gray-600 mt-2 mb-0.5 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Dirección Fiscal
            </h3>
            <div className="grid grid-cols-6 gap-1 mb-1">
              <div className="col-span-2">
                <label className={labelStyle}>Calle *</label>
                <input type="text" name="calle" value={form.calle} onChange={handleChange} className={inputStyle} />
              </div>
              <div>
                <label className={labelStyle}>No. Ext *</label>
                <input type="text" name="numero_ext" value={form.numero_ext} onChange={handleChange} className={inputStyle} />
              </div>
              <div>
                <label className={labelStyle}>No. Int</label>
                <input type="text" name="numero_int" value={form.numero_int} onChange={handleChange} className={inputStyle} />
              </div>
              <div>
                <label className={labelStyle}>C.P. *</label>
                <input type="text" name="cp" value={form.cp} onChange={handleChange} className={inputStyle} maxLength={5} />
              </div>
              <div>
                <label className={labelStyle}>WhatsApp *</label>
                <input type="tel" name="whatsapp" value={form.whatsapp} onChange={handleChange} className={inputStyle} />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-1 mb-1">
              <div>
                <label className={labelStyle}>Colonia *</label>
                <input type="text" name="colonia" value={form.colonia} onChange={handleChange} className={inputStyle} />
              </div>
              <div>
                <label className={labelStyle}>Ciudad *</label>
                <input type="text" name="ciudad" value={form.ciudad} onChange={handleChange} className={inputStyle} />
              </div>
              <div>
                <label className={labelStyle}>Estado *</label>
                <input type="text" name="estado" value={form.estado} onChange={handleChange} className={inputStyle} />
              </div>
              <div>
                <label className={labelStyle}>País *</label>
                <input type="text" name="pais" value={form.pais} onChange={handleChange} className={inputStyle} />
              </div>
            </div>

            {/* Contactos */}
            <h3 className="text-[11px] font-bold text-gray-600 mt-2 mb-0.5 flex items-center gap-1">
              <User className="w-3 h-3" /> Contactos
            </h3>
            {[
              { prefix: 'contacto_admin', title: 'Administrativo' },
              { prefix: 'contacto_facturas', title: 'Facturas' },
              { prefix: 'contacto_operativo', title: 'Operativo 1' },
              { prefix: 'contacto_operativo2', title: 'Operativo 2' },
            ].map(({ prefix, title }) => (
              <div key={prefix} className="grid grid-cols-4 gap-1 mb-0.5">
                <div>
                  <label className={labelStyle}>{title} - Nombre</label>
                  <input type="text" name={`${prefix}_nombre`} value={(form as any)[`${prefix}_nombre`]} onChange={handleChange} className={inputStyle} />
                </div>
                <div>
                  <label className={labelStyle}>Puesto</label>
                  <input type="text" name={`${prefix}_puesto`} value={(form as any)[`${prefix}_puesto`]} onChange={handleChange} className={inputStyle} />
                </div>
                <div>
                  <label className={labelStyle}>Email</label>
                  <input type="email" name={`${prefix}_email`} value={(form as any)[`${prefix}_email`]} onChange={handleChange} className={inputStyle} />
                </div>
                <div>
                  <label className={labelStyle}>Teléfono</label>
                  <input type="tel" name={`${prefix}_tel`} value={(form as any)[`${prefix}_tel`]} onChange={handleChange} className={inputStyle} />
                </div>
              </div>
            ))}

            {/* Referencias */}
            <h3 className="text-[11px] font-bold text-gray-600 mt-2 mb-0.5">📋 Referencias Comerciales</h3>
            {[1, 2, 3].map((n) => (
              <div key={n} className="grid grid-cols-5 gap-1 mb-0.5">
                <div>
                  <label className={labelStyle}>Ref {n} - Empresa</label>
                  <input type="text" name={`ref${n}_empresa`} value={(form as any)[`ref${n}_empresa`]} onChange={handleChange} className={inputStyle} />
                </div>
                <div>
                  <label className={labelStyle}>Contacto</label>
                  <input type="text" name={`ref${n}_contacto`} value={(form as any)[`ref${n}_contacto`]} onChange={handleChange} className={inputStyle} />
                </div>
                <div>
                  <label className={labelStyle}>WhatsApp</label>
                  <input type="tel" name={`ref${n}_telefono`} value={(form as any)[`ref${n}_telefono`]} onChange={handleChange} className={inputStyle} />
                </div>
                <div>
                  <label className={labelStyle}>Email</label>
                  <input type="email" name={`ref${n}_email`} value={(form as any)[`ref${n}_email`]} onChange={handleChange} className={inputStyle} />
                </div>
                <div>
                  <label className={labelStyle}>Años</label>
                  <input type="text" name={`ref${n}_anos`} value={(form as any)[`ref${n}_anos`]} onChange={handleChange} className={inputStyle} />
                </div>
              </div>
            ))}

            {/* Proceso Facturación */}
            <h3 className="text-[11px] font-bold text-gray-600 mt-2 mb-0.5">📝 Proceso de Facturación</h3>
            <textarea name="proceso_facturacion" value={form.proceso_facturacion} onChange={handleChange} className={inputStyle + " h-8 resize-none"} placeholder="Portal, requisitos especiales, orden de compra, etc." />
          </div>

          {/* COLUMNA DERECHA - Documentos (35%) */}
          <div className="w-72 bg-white rounded-xl shadow-lg p-3 flex flex-col">
            <h3 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
              <FileText className="w-4 h-4 text-blue-600" /> Documentos Requeridos
            </h3>
            
            <div className="flex-1 space-y-1 overflow-y-auto">
              {documentosRequeridos.map((doc) => (
                <div key={doc.id} className={`p-1.5 border rounded transition-all ${documentosSubidos.includes(doc.id) ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-blue-300'}`}>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-700 text-[10px] truncate">
                        {doc.nombre} {doc.requerido && <span className="text-red-500">*</span>}
                      </p>
                      {documentosSubidos.includes(doc.id) && (
                        <p className="text-green-600 text-[9px] flex items-center gap-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Cargado
                        </p>
                      )}
                    </div>
                    <label className={`px-2 py-0.5 rounded cursor-pointer transition-all flex items-center gap-1 text-[10px] ${documentosSubidos.includes(doc.id) ? 'bg-green-100 text-green-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                      {subiendo === doc.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                      <span>{documentosSubidos.includes(doc.id) ? '✓' : 'Subir'}</span>
                      <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileChange(doc.id, e.target.files?.[0] || null)} disabled={subiendo !== null} />
                    </label>
                  </div>
                </div>
              ))}
            </div>

            {/* Términos y Firma */}
            <div className="mt-2 pt-2 border-t border-gray-200">
              <label className="flex items-start gap-1.5 cursor-pointer mb-2">
                <input type="checkbox" name="firma_aceptada" checked={form.firma_aceptada} onChange={handleChange} className="w-3.5 h-3.5 mt-0.5 rounded border-gray-300 text-orange-500 focus:ring-orange-500" />
                <span className="text-[9px] text-gray-600 leading-tight">
                  Acepto los <a href="/aviso-privacidad.pdf" className="text-blue-600 underline">Términos y Condiciones</a> y el tratamiento de mis datos conforme al Aviso de Privacidad.
                </span>
              </label>
              <div className="mb-2">
                <label className="text-[9px] text-gray-500">Nombre completo (firma digital) *</label>
                <input type="text" name="nombre_rep_legal" value={form.nombre_rep_legal} onChange={handleChange} className={inputStyle} placeholder="Como aparece en su identificación" />
              </div>
              
              {validando && mensajeValidacion && (
                <div className="mb-2 p-1.5 bg-blue-50 rounded text-[9px] text-blue-700 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> {mensajeValidacion}
                </div>
              )}

              <button 
                onClick={handleSubmit} 
                disabled={enviando || !form.firma_aceptada || !form.nombre_rep_legal}
                className="w-full py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-bold hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {enviando ? 'Validando...' : 'Enviar Solicitud'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
