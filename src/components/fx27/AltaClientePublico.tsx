// Formulario Alta Cliente v2.0
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
  { id: 'csf', nombre: 'Constancia de Situación Fiscal (mes actual)', requerido: true },
  { id: 'opinion', nombre: 'Opinión de Cumplimiento (mes actual)', requerido: true },
  { id: 'domicilio', nombre: 'Comprobante de Domicilio (máx. 3 meses)', requerido: true },
  { id: 'ine', nombre: 'INE del Representante Legal', requerido: true },
  { id: 'acta', nombre: 'Acta Constitutiva', requerido: true },
  { id: 'poder', nombre: 'Poder Notarial', requerido: false },
];

const DOCUMENTOS_USA = [
  { id: 'w9', nombre: 'W-9 Form', requerido: true },
  { id: 'bank', nombre: 'Bank Statement (últimos 3 meses)', requerido: true },
  { id: 'mc', nombre: 'MC# / DOT# Certificate', requerido: true },
  { id: 'void', nombre: 'Void Check', requerido: true },
  { id: 'domicilio', nombre: 'Proof of Address', requerido: true },
  { id: 'id', nombre: 'ID del Representante Legal', requerido: true },
];

export const AltaClientePublico = ({ solicitudId }: AltaClientePublicoProps) => {
  const [solicitud, setSolicitud] = useState<Solicitud | null>(null);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);
  const [paso, setPaso] = useState(1);

  const [form, setForm] = useState({
    razon_social: '', rfc_mc: '', giro: '',
    calle: '', numero_ext: '', numero_int: '', colonia: '', ciudad: '', estado: '', cp: '', pais: '',
    tel_oficina: '', whatsapp: '',
    contacto_admin_nombre: '', contacto_admin_puesto: '', contacto_admin_email: '', contacto_admin_tel: '',
    contacto_facturas_nombre: '', contacto_facturas_puesto: '', contacto_facturas_email: '', contacto_facturas_tel: '',
    contacto_operativo_nombre: '', contacto_operativo_puesto: '', contacto_operativo_email: '', contacto_operativo_tel: '', contacto_operativo2_nombre: '', contacto_operativo2_puesto: '', contacto_operativo2_email: '', contacto_operativo2_tel: '',
    ref1_empresa: '', ref1_contacto: '', ref1_telefono: '',
    ref2_empresa: '', ref2_contacto: '', ref2_telefono: '', ref2_email: '', ref2_anos: '', ref3_empresa: '', ref3_contacto: '', ref3_telefono: '', ref3_email: '', ref3_anos: '', ref1_email: '', ref1_anos: '',
    dias_credito: '30', divisa: 'MXN', pagina_web: '', tamano_empresa: '', proceso_facturacion: '',
    nombre_rep_legal: '', firma_aceptada: false,
  });

  const [archivos, setArchivos] = useState<Record<string, File | null>>({});
  const [subiendo, setSubiendo] = useState<string | null>(null);
  const [documentosSubidos, setDocumentosSubidos] = useState<string[]>([]);

  useEffect(() => { cargarSolicitud(); }, [solicitudId]);

  const cargarSolicitud = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/alta-cliente/${solicitudId}`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      const data = await response.json();
      if (data.success && data.solicitud) {
        setSolicitud(data.solicitud);
        if (data.solicitud.estatus === 'COMPLETADA') {
          setExito(true);
        }
      } else {
        setError('Solicitud no encontrada o ya fue completada.');
      }
    } catch (err) {
      setError('Error al cargar la solicitud. Intente nuevamente.');
    } finally {
      setCargando(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFileChange = async (docId: string, file: File | null) => {
    if (!file) return;
    setSubiendo(docId);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tipo_documento', docId);
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/alta-cliente/${solicitudId}/documento`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        body: formData
      });
      const data = await response.json();
      if (data.success) {
        setDocumentosSubidos(prev => [...prev, docId]);
        setArchivos(prev => ({ ...prev, [docId]: file }));
      }
    } catch (err) {
      setError('Error al subir documento');
    } finally {
      setSubiendo(null);
    }
  };

  const enviarFormulario = async () => {
    setEnviando(true);
    setError(null);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/alta-cliente/${solicitudId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${publicAnonKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, firma_aceptada: true })
      });
      const data = await response.json();
      if (data.success) {
        setExito(true);
      } else {
        setError(data.error || 'Error al enviar formulario');
      }
    } catch (err) {
      setError('Error de conexión. Intente nuevamente.');
    } finally {
      setEnviando(false);
    }
  };

  const descargarPolitica = () => {
    const contenido = `
AVISO DE PRIVACIDAD INTEGRAL
GRUPO LOMA Y EMPRESAS SUBSIDIARIAS
(TROB Transportes, WExpress, Speedy Haul, TROB USA)

Fecha de última actualización: Enero 2025

En cumplimiento con lo dispuesto por la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP), su Reglamento y los Lineamientos del Aviso de Privacidad, Grupo Loma, con domicilio en Aguascalientes, México, hace de su conocimiento lo siguiente:

1. IDENTIDAD DEL RESPONSABLE
Grupo Loma y sus empresas subsidiarias (TROB Transportes S.A. de C.V., WExpress S.A. de C.V., Speedy Haul Inc., TROB USA LLC) son responsables del tratamiento de sus datos personales.

2. DATOS PERSONALES RECABADOS
Recabamos los siguientes datos personales:
- Datos de identificación: nombre, RFC, CURP, INE
- Datos de contacto: domicilio, teléfono, correo electrónico
- Datos fiscales: constancia de situación fiscal, opinión de cumplimiento
- Datos financieros: información bancaria para pagos
- Datos de representación legal: actas constitutivas, poderes notariales

3. FINALIDADES DEL TRATAMIENTO
Sus datos personales serán utilizados para:
- Prestación de servicios de transporte y logística
- Elaboración de contratos y facturación
- Cumplimiento de obligaciones fiscales
- Evaluación crediticia y cobranza
- Envío de comunicaciones relacionadas con nuestros servicios

4. DERECHOS ARCO
Usted tiene derecho a Acceder, Rectificar, Cancelar u Oponerse al tratamiento de sus datos personales (Derechos ARCO). Para ejercer estos derechos, envíe su solicitud a: privacidad@trob.com.mx

5. TRANSFERENCIA DE DATOS
Sus datos podrán ser transferidos a empresas subsidiarias del Grupo Loma, autoridades fiscales y entidades financieras, únicamente para las finalidades descritas.

6. MODIFICACIONES AL AVISO
Nos reservamos el derecho de modificar este aviso de privacidad. Las modificaciones estarán disponibles en www.trob.com.mx

Al proporcionar sus datos y firmar digitalmente, usted consiente el tratamiento de sus datos personales conforme a este aviso.

© 2025 Grupo Loma - Todos los derechos reservados
    `;
    const blob = new Blob([contenido], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Aviso_Privacidad_Grupo_Loma.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const documentosRequeridos = solicitud?.tipo_empresa === 'USA_CANADA' ? DOCUMENTOS_USA : DOCUMENTOS_MX;

  if (cargando) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #001f4d 0%, #003d7a 50%, #0066cc 100%)' }}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-white mx-auto mb-4" />
          <p className="text-white/80">Cargando formulario...</p>
        </div>
      </div>
    );
  }

  if (error && !solicitud) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #001f4d 0%, #003d7a 50%, #0066cc 100%)' }}>
        <div className="bg-white rounded-xl p-8 max-w-md text-center shadow-2xl">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Enlace no válido</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (exito) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #001f4d 0%, #003d7a 50%, #0066cc 100%)' }}>
        <div className="bg-white rounded-xl p-8 max-w-md text-center shadow-2xl">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Formulario Enviado!</h2>
          <p className="text-gray-600 mb-4">Gracias por completar su registro. Nuestro equipo revisará su información y se pondrá en contacto con usted.</p>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-green-800 text-sm">Su solicitud ha sido firmada digitalmente y registrada en nuestro sistema.</p>
          </div>
        </div>
      </div>
    );
  }

  const inputStyle = "w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm";
  const labelStyle = "block text-xs font-medium text-gray-600 mb-1";

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'linear-gradient(180deg, #001f4d 0%, #003366 100%)' }}>
      {/* Header Compacto */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-white/10">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <img src="/logo-gl-blanco.png" alt="Grupo Loma" className="h-10" />
          </div>
          <h1 className="text-lg font-bold text-white absolute left-1/2 transform -translate-x-1/2">Formulario de Alta de Cliente</h1>
          <div className="flex items-center gap-3">
            <a href="/aviso-privacidad.pdf" download className="px-3 py-1.5 rounded-lg text-xs bg-white/10 hover:bg-white/20 text-white flex items-center gap-1 transition-all">
              <Download className="w-3 h-3" /> Aviso de Privacidad
            </a>
            <div className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <span className="text-white">{solicitud?.tipo_empresa === 'USA_CANADA' ? '🇺🇸 USA/Canadá' : '🇲🇽 México'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="flex-shrink-0 px-4 py-2 bg-white/5">
        <div className="max-w-[1400px] mx-auto flex items-center justify-center gap-2">
          {[
            { n: 1, label: 'Datos Generales' },
            { n: 2, label: 'Documentos y Firma' }
          ].map(({ n, label }) => (
            <div key={n} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${paso >= n ? 'bg-orange-500 text-white' : 'bg-white/20 text-white/50'}`}>{n}</div>
              <span className={`ml-2 text-sm hidden sm:inline ${paso >= n ? 'text-white font-semibold' : 'text-white/40'}`}>{label}</span>
              {n < 2 && <div className={`w-20 h-1 mx-4 rounded ${paso > n ? 'bg-orange-500' : 'bg-white/20'}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* Form Container con Scroll Interno */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-[1400px] mx-auto">
          <div className="bg-gradient-to-b from-white to-gray-50 rounded-2xl shadow-2xl p-6 border border-gray-100">

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <span className="text-red-700 text-sm">{error}</span>
                <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4 text-red-500" /></button>
              </div>
            )}

            {/* PASO 1: Datos de la Empresa */}
            {paso === 1 && (
              <div>
                {/* Datos Empresa - 1 línea */}
                <div className="grid grid-cols-6 gap-2 mb-2">
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

                {/* Dirección - 2 líneas */}
                <h3 className="text-sm font-semibold text-gray-600 mt-3 mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Dirección Fiscal
                </h3>
                <div className="grid grid-cols-6 gap-2 mb-2">
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
                <div className="grid grid-cols-4 gap-2 mb-2">
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
                    <input type="text" name="pais" value={form.pais} onChange={handleChange} className={inputStyle} placeholder={solicitud?.tipo_empresa === 'USA_CANADA' ? 'USA' : 'México'} />
                  </div>
                </div>

                {/* Contactos - compactos en línea */}
                <h3 className="text-sm font-semibold text-gray-600 mt-3 mb-1 flex items-center gap-1">
                  <User className="w-3 h-3" /> Contactos
                </h3>
                {[
                  { prefix: 'contacto_admin', title: 'Administrativo' },
                  { prefix: 'contacto_facturas', title: 'Facturas' },
                  { prefix: 'contacto_operativo', title: 'Operativo 1' },
                  { prefix: 'contacto_operativo2', title: 'Operativo 2' },
                ].map(({ prefix, title }) => (
                  <div key={prefix} className="grid grid-cols-5 gap-2 mb-1 items-end">
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

                {/* Referencias - compactas en línea */}
                <h3 className="text-sm font-semibold text-gray-600 mt-3 mb-1">📋 Referencias Comerciales</h3>
                {[1, 2, 3].map((n) => (
                  <div key={n} className="grid grid-cols-5 gap-2 mb-1 items-end">
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
                      <input type="text" name={`ref${n}_anos`} value={(form as any)[`ref${n}_anos`]} onChange={handleChange} className={inputStyle} placeholder="2" />
                    </div>
                  </div>
                ))}

                {/* Proceso de Facturación */}
                <h3 className="text-sm font-semibold text-gray-600 mt-4 mb-2">📝 Proceso de Facturación</h3>
                <div className="mb-4">
                  <label className={labelStyle}>Describa su proceso de facturación (portal, requisitos especiales, etc.)</label>
                  <textarea name="proceso_facturacion" value={form.proceso_facturacion} onChange={handleChange} className={inputStyle + " h-16 resize-none"} placeholder="Ej: Facturación por portal SAT, requiere orden de compra, etc." />
                </div>

                <div className="flex justify-end mt-4">
                  <button onClick={() => setPaso(2)} className="px-8 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-bold hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg text-sm">
                    Continuar a Documentos →
                  </button>
                </div>
              </div>
            )}

            {/* PASO 3: Documentos */}
            {paso === 3 && (
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Documentos Requeridos
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {documentosRequeridos.map((doc) => (
                    <div key={doc.id} className={`p-4 border rounded-lg transition-all ${documentosSubidos.includes(doc.id) ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-800 text-sm">
                            {doc.nombre} {doc.requerido && <span className="text-red-500">*</span>}
                          </p>
                          {documentosSubidos.includes(doc.id) && (
                            <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Documento cargado
                            </p>
                          )}
                        </div>
                        <label className={`px-3 py-2 rounded-lg cursor-pointer transition-all flex items-center gap-2 text-sm ${documentosSubidos.includes(doc.id) ? 'bg-green-100 text-green-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                          {subiendo === doc.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4" />
                          )}
                          <span>{documentosSubidos.includes(doc.id) ? 'Cambiar' : 'Subir'}</span>
                          <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileChange(doc.id, e.target.files?.[0] || null)} disabled={subiendo !== null} />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between mt-6">
                  <button onClick={() => setPaso(2)} className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors">
                    ← Anterior
                  </button>
                  <button onClick={() => setPaso(4)} className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg">
                    Siguiente →
                  </button>
                </div>
              </div>
            )}

            {/* PASO 4: Firma */}
            {paso === 4 && (
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  Condiciones y Firma Digital
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-700 mb-3 text-sm">💳 Condiciones de Pago</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelStyle}>Días de Crédito</label>
                        <select name="dias_credito" value={form.dias_credito} onChange={handleChange} className={inputStyle}>
                          <option value="0">Contado / Prepago</option>
                          <option value="15">15 días</option>
                          <option value="30">30 días</option>
                          <option value="45">45 días</option>
                          <option value="60">60 días</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelStyle}>Divisa</label>
                        <select name="divisa" value={form.divisa} onChange={handleChange} className={inputStyle}>
                          <option value="MXN">MXN - Pesos Mexicanos</option>
                          <option value="USD">USD - Dólares</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-gray-700 mb-3 text-sm flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-600" />
                      Aviso de Privacidad
                    </h3>
                    <p className="text-xs text-gray-600 mb-3">
                      Sus datos serán tratados conforme a nuestra política de privacidad y la Ley Federal de Protección de Datos Personales.
                    </p>
                    <button onClick={descargarPolitica} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium">
                      <Download className="w-4 h-4" />
                      Descargar Aviso de Privacidad
                    </button>
                  </div>
                </div>

                <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                  <h3 className="font-bold text-gray-800 mb-4 text-sm">✍️ Declaración y Firma Digital</h3>
                  <div className="mb-4">
                    <label className={labelStyle}>Nombre Completo del Representante Legal *</label>
                    <input type="text" name="nombre_rep_legal" value={form.nombre_rep_legal} onChange={handleChange} className={inputStyle} placeholder="Como aparece en su identificación oficial" />
                  </div>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" name="firma_aceptada" checked={form.firma_aceptada} onChange={handleChange} className="w-5 h-5 mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-xs text-gray-700 leading-relaxed">
                      Declaro bajo protesta de decir verdad que toda la información proporcionada es verídica y correcta. Acepto los Términos y Condiciones de servicio de <strong>Grupo Loma | TROB Transportes</strong> y autorizo el uso de mis datos para los fines descritos en el Aviso de Privacidad.
                    </span>
                  </label>
                </div>

                <div className="flex justify-between mt-6">
                  <button onClick={() => setPaso(3)} className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors">
                    ← Anterior
                  </button>
                  <button onClick={enviarFormulario} disabled={enviando || !form.firma_aceptada || !form.nombre_rep_legal}
                    className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-bold hover:from-green-700 hover:to-green-800 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                    {enviando ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                    {enviando ? 'Enviando...' : '✓ Firmar y Enviar'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Footer simple */}
      <div className="flex-shrink-0 bg-[#001f4d] py-3 px-4">
        <p className="text-white/70 text-xs text-center">
          © 2025 Grupo Loma | TROB · WExpress · Speedy Haul · TROB USA — Protegemos sus datos conforme a la LFPDPPP
        </p>
      </div>
    </div>
  );
};






