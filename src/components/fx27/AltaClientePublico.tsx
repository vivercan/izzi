import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Building2, MapPin, Phone, Mail, Users, FileText, Upload, CheckCircle2, 
  AlertCircle, X, Download, Globe, Briefcase, User, Hash, FileCheck
} from 'lucide-react';

// Supabase Client
const SUPABASE_URL = 'https://fbxbsslhewchyibdoyzk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieGJzc2xoZXdjaHlpYmRveXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzczODEsImV4cCI6MjA3ODExMzM4MX0.Z8JPlg7hhKbA624QGHp2bKKTNtCD3WInQMO5twjl6a0';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface Solicitud {
  id: string;
  tipo_empresa: 'MEXICANA' | 'USA_CANADA';
  nombre_cliente: string;
  apellido_cliente: string;
  email_cliente: string;
  estatus: string;
}

interface AltaClientePublicoProps {
  solicitudId: string;
}

interface FormData {
  razon_social: string;
  rfc: string;
  giro: string;
  pagina_web: string;
  tamano_empresa: string;
  calle: string;
  no_ext: string;
  no_int: string;
  cp: string;
  whatsapp: string;
  colonia: string;
  ciudad: string;
  estado: string;
  pais: string;
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
  { key: 'constancia_fiscal', label: 'Constancia Situación Fiscal', required: true },
  { key: 'opinion_cumplimiento', label: 'Opinión de Cumplimiento', required: true },
  { key: 'comprobante_domicilio', label: 'Comprobante Domicilio', required: true },
  { key: 'ine_representante', label: 'INE Representante Legal', required: true },
  { key: 'acta_constitutiva', label: 'Acta Constitutiva', required: true },
  { key: 'poder_notarial', label: 'Poder Notarial', required: false }
];

const DOCS_USA = [
  { key: 'w9', label: 'W-9 Form', required: true },
  { key: 'bank_statement', label: 'Bank Statement', required: true },
  { key: 'mc_number', label: 'MC# Certificate', required: true },
  { key: 'void_check', label: 'Void Check', required: true },
  { key: 'id_document', label: 'ID Document', required: true }
];

export function AltaClientePublico({ solicitudId }: AltaClientePublicoProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [solicitud, setSolicitud] = useState<Solicitud | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, string>>({});

  const [form, setForm] = useState<FormData>({
    razon_social: '', rfc: '', giro: '', pagina_web: '', tamano_empresa: '-',
    calle: '', no_ext: '', no_int: '', cp: '', whatsapp: '',
    colonia: '', ciudad: '', estado: '', pais: '',
    contacto_admin_nombre: '', contacto_admin_puesto: '', contacto_admin_email: '', contacto_admin_tel: '',
    contacto_facturas_nombre: '', contacto_facturas_puesto: '', contacto_facturas_email: '', contacto_facturas_tel: '',
    contacto_op1_nombre: '', contacto_op1_puesto: '', contacto_op1_email: '', contacto_op1_tel: '',
    contacto_op2_nombre: '', contacto_op2_puesto: '', contacto_op2_email: '', contacto_op2_tel: '',
    ref1_empresa: '', ref1_contacto: '', ref1_whatsapp: '', ref1_email: '', ref1_anos: '',
    ref2_empresa: '', ref2_contacto: '', ref2_whatsapp: '', ref2_email: '', ref2_anos: '',
    ref3_empresa: '', ref3_contacto: '', ref3_whatsapp: '', ref3_email: '', ref3_anos: '',
    proceso_facturacion: '', firma_nombre: '', firma_aceptada: false
  });

  useEffect(() => { if (solicitudId) fetchSolicitud(); }, [solicitudId]);

  const fetchSolicitud = async () => {
    try {
      const { data, error } = await supabase.from('alta_clientes').select('*').eq('id', solicitudId).single();
      if (error) throw error;
      if (!data) throw new Error('Solicitud no encontrada');
      if (data.estatus === 'COMPLETADA') setSuccess(true);
      setSolicitud(data);
      if (data.razon_social) {
        setForm(prev => ({ ...prev, razon_social: data.razon_social || '', rfc: data.rfc || '', giro: data.giro || '', pagina_web: data.pagina_web || '', tamano_empresa: data.tamano_empresa || '-', calle: data.calle || '', no_ext: data.no_ext || '', no_int: data.no_int || '', cp: data.cp || '', whatsapp: data.whatsapp || '', colonia: data.colonia || '', ciudad: data.ciudad || '', estado: data.estado || '', pais: data.pais || '' }));
      }
      if (data.documentos) setUploadedDocs(data.documentos);
    } catch (err) { console.error('Error:', err); setError('Error al cargar'); } 
    finally { setLoading(false); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') setForm(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    else setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (docKey: string, file: File) => {
    if (!solicitudId || !file) return;
    setUploadingDoc(docKey);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${solicitudId}/${docKey}_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('alta-documentos').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('alta-documentos').getPublicUrl(fileName);
      setUploadedDocs(prev => ({ ...prev, [docKey]: publicUrl }));
      await supabase.from('alta_clientes').update({ documentos: { ...uploadedDocs, [docKey]: publicUrl } }).eq('id', solicitudId);
    } catch (err: any) { 
      console.error('Error upload:', err); 
      setError(`Error al subir ${docKey}: ${err?.message || err?.error_description || JSON.stringify(err)}`); 
    } 
    finally { setUploadingDoc(null); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!solicitudId || !form.firma_aceptada) { setError('Debe aceptar los términos'); return; }
    const docs = solicitud?.tipo_empresa === 'USA_CANADA' ? DOCS_USA : DOCS_MEXICANA;
    const missingDocs = docs.filter(d => d.required && !uploadedDocs[d.key]);
    if (missingDocs.length > 0) { setError(`Faltan: ${missingDocs.map(d => d.label).join(', ')}`); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('alta_clientes').update({ ...form, documentos: uploadedDocs, estatus: 'COMPLETADA', firma_fecha: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', solicitudId);
      if (error) throw error;
      setSuccess(true);
    } catch (err) { console.error('Error:', err); setError('Error al enviar'); } 
    finally { setSubmitting(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0a1628 0%, #1a365d 100%)' }}>
      <div className="text-white text-xl">Cargando...</div>
    </div>
  );

  if (success) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0a1628 0%, #1a365d 100%)' }}>
      <div className="bg-white rounded-2xl p-10 max-w-lg text-center shadow-2xl">
        <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-5" />
        <h2 className="text-3xl font-bold text-gray-800 mb-3">¡Solicitud Enviada!</h2>
        <p className="text-lg text-gray-600">Nuestro equipo revisará su información y documentos.</p>
      </div>
    </div>
  );

  if (!solicitud) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0a1628 0%, #1a365d 100%)' }}>
      <div className="bg-white rounded-2xl p-10 max-w-lg text-center shadow-2xl">
        <AlertCircle className="w-20 h-20 text-red-500 mx-auto mb-5" />
        <h2 className="text-3xl font-bold text-gray-800 mb-3">Solicitud no encontrada</h2>
        <p className="text-lg text-gray-600">El enlace puede haber expirado.</p>
      </div>
    </div>
  );

  const tipoMX = solicitud.tipo_empresa !== 'USA_CANADA';
  const docs = tipoMX ? DOCS_MEXICANA : DOCS_USA;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0a1628 0%, #1a365d 100%)' }}>
      {/* HEADER */}
      <header className="sticky top-0 z-50 px-6 py-4" style={{ background: 'rgba(10, 22, 40, 0.97)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="max-w-[1500px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-5">
            <img src="/logo-gl-blanco.png" alt="Grupo Loma" className="h-12" />
            <h1 className="text-2xl font-bold text-white tracking-wide">Formulario de Alta de Cliente</h1>
          </div>
          <div className="flex items-center gap-4">
            <a href="/aviso-privacidad.pdf" download className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 transition-all shadow-lg">
              <Download className="w-4 h-4" /> Aviso Privacidad
            </a>
            <div className="px-5 py-2.5 rounded-lg text-sm font-bold bg-orange-500/20 text-orange-300 border border-orange-500/40">
              {tipoMX ? '🇲🇽 México' : '🇺🇸 USA/Canadá'}
            </div>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="px-6 py-8">
        <form onSubmit={handleSubmit} className="max-w-[1500px] mx-auto">
          <div className="flex gap-8">
            
            {/* === LEFT: FORM DATA (75%) === */}
            <div className="flex-1 bg-white rounded-2xl shadow-2xl p-8">
              
              {error && (
                <div className="flex items-center gap-3 p-4 mb-6 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                  <span className="text-red-700 text-base flex-1">{error}</span>
                  <button type="button" onClick={() => setError(null)}><X className="w-5 h-5 text-red-400" /></button>
                </div>
              )}

              {/* === DATOS EMPRESA === */}
              <section className="mb-8">
                <div className="flex items-center gap-3 mb-5 pb-3 border-b-2 border-slate-200">
                  <div className="p-2 rounded-lg bg-orange-100"><Building2 className="w-6 h-6 text-orange-600" /></div>
                  <h2 className="text-xl font-bold text-slate-800">Datos de la Empresa</h2>
                </div>
                
                {/* Row 1: Razón Social (full width) */}
                <div className="mb-5">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Razón Social *</label>
                  <input type="text" name="razon_social" value={form.razon_social} onChange={handleChange} required 
                    className="w-full px-4 py-3 text-base text-slate-800 bg-slate-50 rounded-xl border-2 border-slate-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 outline-none transition-all" 
                    placeholder="Empresa S.A. de C.V." />
                </div>
                
                {/* Row 2: RFC, Giro, Web, Tamaño */}
                <div className="grid grid-cols-4 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">{tipoMX ? 'RFC *' : 'Tax ID *'}</label>
                    <input type="text" name="rfc" value={form.rfc} onChange={handleChange} required 
                      className="w-full px-4 py-3 text-base text-slate-800 bg-slate-50 rounded-xl border-2 border-slate-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 outline-none transition-all" 
                      placeholder={tipoMX ? 'XAXX010101000' : 'XX-XXXXXXX'} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Giro</label>
                    <input type="text" name="giro" value={form.giro} onChange={handleChange} 
                      className="w-full px-4 py-3 text-base text-slate-800 bg-slate-50 rounded-xl border-2 border-slate-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 outline-none transition-all" 
                      placeholder="Actividad principal" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Página Web</label>
                    <input type="text" name="pagina_web" value={form.pagina_web} onChange={handleChange} 
                      className="w-full px-4 py-3 text-base text-slate-800 bg-slate-50 rounded-xl border-2 border-slate-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 outline-none transition-all" 
                      placeholder="www.ejemplo.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Tamaño</label>
                    <select name="tamano_empresa" value={form.tamano_empresa} onChange={handleChange} 
                      className="w-full px-4 py-3 text-base text-slate-800 bg-slate-50 rounded-xl border-2 border-slate-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 outline-none transition-all cursor-pointer">
                      {TAMANOS_EMPRESA.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              </section>

              {/* === DIRECCIÓN FISCAL === */}
              <section className="mb-8">
                <div className="flex items-center gap-3 mb-5 pb-3 border-b-2 border-slate-200">
                  <div className="p-2 rounded-lg bg-orange-100"><MapPin className="w-6 h-6 text-orange-600" /></div>
                  <h2 className="text-xl font-bold text-slate-800">Dirección Fiscal</h2>
                </div>
                
                {/* Row 1 */}
                <div className="grid grid-cols-6 gap-4 mb-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Calle *</label>
                    <input type="text" name="calle" value={form.calle} onChange={handleChange} required className="w-full px-4 py-3 text-base text-slate-800 bg-slate-50 rounded-xl border-2 border-slate-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 outline-none transition-all" placeholder="Nombre de la calle" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">No. Ext *</label>
                    <input type="text" name="no_ext" value={form.no_ext} onChange={handleChange} required className="w-full px-4 py-3 text-base text-slate-800 bg-slate-50 rounded-xl border-2 border-slate-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 outline-none transition-all" placeholder="123" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">No. Int</label>
                    <input type="text" name="no_int" value={form.no_int} onChange={handleChange} className="w-full px-4 py-3 text-base text-slate-800 bg-slate-50 rounded-xl border-2 border-slate-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 outline-none transition-all" placeholder="A" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">C.P. *</label>
                    <input type="text" name="cp" value={form.cp} onChange={handleChange} required className="w-full px-4 py-3 text-base text-slate-800 bg-slate-50 rounded-xl border-2 border-slate-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 outline-none transition-all" placeholder="00000" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">WhatsApp *</label>
                    <input type="text" name="whatsapp" value={form.whatsapp} onChange={handleChange} required className="w-full px-4 py-3 text-base text-slate-800 bg-slate-50 rounded-xl border-2 border-slate-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 outline-none transition-all" placeholder="+52 55 1234 5678" />
                  </div>
                </div>
                
                {/* Row 2 */}
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Colonia *</label>
                    <input type="text" name="colonia" value={form.colonia} onChange={handleChange} required className="w-full px-4 py-3 text-base text-slate-800 bg-slate-50 rounded-xl border-2 border-slate-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 outline-none transition-all" placeholder="Colonia" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Ciudad *</label>
                    <input type="text" name="ciudad" value={form.ciudad} onChange={handleChange} required className="w-full px-4 py-3 text-base text-slate-800 bg-slate-50 rounded-xl border-2 border-slate-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 outline-none transition-all" placeholder="Ciudad" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Estado *</label>
                    <input type="text" name="estado" value={form.estado} onChange={handleChange} required className="w-full px-4 py-3 text-base text-slate-800 bg-slate-50 rounded-xl border-2 border-slate-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 outline-none transition-all" placeholder="Estado" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">País *</label>
                    <input type="text" name="pais" value={form.pais} onChange={handleChange} required className="w-full px-4 py-3 text-base text-slate-800 bg-slate-50 rounded-xl border-2 border-slate-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 outline-none transition-all" placeholder="México" />
                  </div>
                </div>
              </section>

              {/* === CONTACTOS === */}
              <section className="mb-8">
                <div className="flex items-center gap-3 mb-5 pb-3 border-b-2 border-slate-200">
                  <div className="p-2 rounded-lg bg-orange-100"><Users className="w-6 h-6 text-orange-600" /></div>
                  <h2 className="text-xl font-bold text-slate-800">Contactos</h2>
                </div>
                
                {[
                  { prefix: 'contacto_admin', label: 'Administrativo - Nombre' },
                  { prefix: 'contacto_facturas', label: 'Facturas - Nombre' },
                  { prefix: 'contacto_op1', label: 'Operativo 1 - Nombre' },
                  { prefix: 'contacto_op2', label: 'Operativo 2 - Nombre' }
                ].map(({ prefix, label }) => (
                  <div key={prefix} className="grid grid-cols-4 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">{label}</label>
                      <input type="text" name={`${prefix}_nombre`} value={(form as any)[`${prefix}_nombre`]} onChange={handleChange} className="w-full px-4 py-3 text-base text-slate-800 bg-slate-50 rounded-xl border-2 border-slate-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 outline-none transition-all" placeholder="Nombre completo" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Puesto</label>
                      <input type="text" name={`${prefix}_puesto`} value={(form as any)[`${prefix}_puesto`]} onChange={handleChange} className="w-full px-4 py-3 text-base text-slate-800 bg-slate-50 rounded-xl border-2 border-slate-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 outline-none transition-all" placeholder="Cargo" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                      <input type="email" name={`${prefix}_email`} value={(form as any)[`${prefix}_email`]} onChange={handleChange} className="w-full px-4 py-3 text-base text-slate-800 bg-slate-50 rounded-xl border-2 border-slate-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 outline-none transition-all" placeholder="correo@empresa.com" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Teléfono</label>
                      <input type="text" name={`${prefix}_tel`} value={(form as any)[`${prefix}_tel`]} onChange={handleChange} className="w-full px-4 py-3 text-base text-slate-800 bg-slate-50 rounded-xl border-2 border-slate-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 outline-none transition-all" placeholder="+52 55 1234 5678" />
                    </div>
                  </div>
                ))}
              </section>

              {/* === REFERENCIAS COMERCIALES === */}
              <section className="mb-8">
                <div className="flex items-center gap-3 mb-5 pb-3 border-b-2 border-slate-200">
                  <div className="p-2 rounded-lg bg-orange-100"><Briefcase className="w-6 h-6 text-orange-600" /></div>
                  <h2 className="text-xl font-bold text-slate-800">Referencias Comerciales</h2>
                </div>
                
                {[1, 2, 3].map(num => (
                  <div key={num} className="grid grid-cols-5 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Ref {num} - Empresa</label>
                      <input type="text" name={`ref${num}_empresa`} value={(form as any)[`ref${num}_empresa`]} onChange={handleChange} className="w-full px-4 py-3 text-base text-slate-800 bg-slate-50 rounded-xl border-2 border-slate-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 outline-none transition-all" placeholder="Nombre empresa" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Contacto</label>
                      <input type="text" name={`ref${num}_contacto`} value={(form as any)[`ref${num}_contacto`]} onChange={handleChange} className="w-full px-4 py-3 text-base text-slate-800 bg-slate-50 rounded-xl border-2 border-slate-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 outline-none transition-all" placeholder="Persona" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">WhatsApp</label>
                      <input type="text" name={`ref${num}_whatsapp`} value={(form as any)[`ref${num}_whatsapp`]} onChange={handleChange} className="w-full px-4 py-3 text-base text-slate-800 bg-slate-50 rounded-xl border-2 border-slate-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 outline-none transition-all" placeholder="+52 55 1234 5678" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                      <input type="email" name={`ref${num}_email`} value={(form as any)[`ref${num}_email`]} onChange={handleChange} className="w-full px-4 py-3 text-base text-slate-800 bg-slate-50 rounded-xl border-2 border-slate-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 outline-none transition-all" placeholder="correo@empresa.com" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Años</label>
                      <input type="text" name={`ref${num}_anos`} value={(form as any)[`ref${num}_anos`]} onChange={handleChange} className="w-full px-4 py-3 text-base text-slate-800 bg-slate-50 rounded-xl border-2 border-slate-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 outline-none transition-all" placeholder="# años" />
                    </div>
                  </div>
                ))}
              </section>

              {/* === PROCESO FACTURACIÓN === */}
              <section>
                <div className="flex items-center gap-3 mb-5 pb-3 border-b-2 border-slate-200">
                  <div className="p-2 rounded-lg bg-orange-100"><FileText className="w-6 h-6 text-orange-600" /></div>
                  <h2 className="text-xl font-bold text-slate-800">Proceso de Facturación</h2>
                </div>
                <textarea name="proceso_facturacion" value={form.proceso_facturacion} onChange={handleChange} rows={3}
                  className="w-full px-4 py-3 text-base text-slate-800 bg-slate-50 rounded-xl border-2 border-slate-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 outline-none transition-all resize-none" 
                  placeholder="Portal, requisitos especiales, orden de compra, etc." />
              </section>
            </div>

            {/* === RIGHT: DOCUMENTS (25%) === */}
            <div className="w-[380px] flex-shrink-0 space-y-6">
              
              {/* Documents Panel */}
              <div className="bg-white rounded-2xl shadow-2xl p-6">
                <div className="flex items-center gap-3 mb-5 pb-3 border-b-2 border-slate-200">
                  <div className="p-2 rounded-lg bg-orange-100"><FileCheck className="w-6 h-6 text-orange-600" /></div>
                  <h2 className="text-lg font-bold text-slate-800">Documentos Requeridos</h2>
                </div>
                
                <div className="space-y-3">
                  {docs.map(doc => {
                    const isUploaded = !!uploadedDocs[doc.key];
                    const isUploading = uploadingDoc === doc.key;
                    return (
                      <div key={doc.key} className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${isUploaded ? 'bg-green-50 border-green-300' : 'bg-slate-50 border-slate-200 hover:border-orange-300'}`}>
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {isUploaded ? <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" /> : <FileText className="w-6 h-6 text-slate-400 flex-shrink-0" />}
                          <span className={`text-sm font-semibold truncate ${isUploaded ? 'text-green-700' : 'text-slate-700'}`}>
                            {doc.label} {doc.required && <span className="text-orange-500">*</span>}
                          </span>
                        </div>
                        <label className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold cursor-pointer transition-all ${isUploaded ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-orange-500 text-white hover:bg-orange-600'}`}>
                          {isUploading ? <span className="animate-pulse">...</span> : <><Upload className="w-4 h-4" /><span>{isUploaded ? 'Cambiar' : 'Subir'}</span></>}
                          <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(doc.key, file); }} disabled={isUploading} />
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Terms & Submit */}
              <div className="bg-white rounded-2xl shadow-2xl p-6">
                <div className="flex items-start gap-3 mb-5">
                  <input type="checkbox" id="firma_aceptada" name="firma_aceptada" checked={form.firma_aceptada} onChange={handleChange} className="w-6 h-6 mt-0.5 rounded border-slate-300 text-orange-500 focus:ring-orange-500 cursor-pointer" />
                  <label htmlFor="firma_aceptada" className="text-sm text-slate-600 cursor-pointer leading-relaxed">
                    Acepto los <a href="/terminos" target="_blank" className="text-orange-500 hover:underline font-semibold">Términos y Condiciones</a> y el tratamiento de mis datos conforme al Aviso de Privacidad.
                  </label>
                </div>
                
                <div className="mb-5">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Nombre completo (firma digital) *</label>
                  <input type="text" name="firma_nombre" value={form.firma_nombre} onChange={handleChange} required className="w-full px-4 py-3 text-base text-slate-800 bg-slate-50 rounded-xl border-2 border-slate-200 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 outline-none transition-all" placeholder="Como aparece en su identificación" />
                </div>
                
                <button type="submit" disabled={submitting || !form.firma_aceptada}
                  className={`w-full py-4 rounded-xl text-lg font-bold text-white transition-all flex items-center justify-center gap-3 ${submitting || !form.firma_aceptada ? 'bg-slate-300 cursor-not-allowed' : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5'}`}>
                  {submitting ? <span className="animate-pulse">Enviando...</span> : <><CheckCircle2 className="w-6 h-6" /><span>Enviar Solicitud</span></>}
                </button>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
