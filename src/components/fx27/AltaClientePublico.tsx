import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Upload, CheckCircle2, AlertCircle, Loader2, Send, Shield, HelpCircle, FolderUp, RefreshCw, CreditCard } from 'lucide-react';

const supabaseUrl = 'https://fbxbsslhewchyibdoyzk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieGJzc2xoZXdjaHlpYmRveXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzczODEsImV4cCI6MjA3ODExMzM4MX0.Z8JPlg7hhKbA624QGHp2bKKTNtCD3WInQMO5twjl6a0';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ═══════════════════════════════════════════════════════════════════════════
// TRADUCCIONES
// ═══════════════════════════════════════════════════════════════════════════
const T = {
  es: {
    title: 'Alta de Cliente', step1: 'Paso 1: Documentación', step2: 'Paso 2: Complete su información',
    uploadDocs: 'Suba sus documentos', uploadAll: 'Subir Todos', validateContinue: 'Validar y Continuar',
    completeRequired: 'Complete los documentos marcados con * para continuar',
    validating: 'Validando Documentos', validatingDesc: 'Verificando vigencias y extrayendo información...',
    problemsFound: 'Problemas encontrados', correctDocs: 'Corregir Documentos', docsValidated: 'Docs Validados',
    extractedData: 'Datos extraídos de sus documentos', bankData: 'Datos Bancarios (extraídos)',
    paymentMethod: 'Forma de Pago', additionalInfo: 'Información Adicional', contacts: 'Contactos',
    commercialRefs: 'Referencias Comerciales', billingProcess: 'Proceso de Facturación',
    termsSignature: 'Términos y Firma', acceptTerms: 'Acepto los', termsConditions: 'Términos y Condiciones',
    privacyNotice: 'Aviso de Privacidad', fullName: 'Nombre completo (Firma Digital) *',
    mustMatch: 'Debe coincidir con', nameNoMatch: 'El nombre no coincide con el Representante Legal',
    sendRequest: 'Enviar Solicitud', sending: 'Enviando...', completed: '¡Alta Completada!',
    sent: '¡Solicitud Enviada!', completedMsg: 'Su empresa ha sido dada de alta exitosamente.',
    sentMsg: 'Hemos recibido su información. Pronto recibirá confirmación por correo.',
    notFound: 'Solicitud no encontrada', notFoundMsg: 'El enlace puede haber expirado o ser incorrecto.',
    uploaded: 'Subido', needsCorrection: 'Requiere corrección', bankDetails: 'Datos bancarios',
    change: 'Cambiar', upload: 'Subir', businessActivity: 'Giro / Actividad', website: 'Página Web',
    companySize: 'Tamaño de Empresa', name: 'Nombre', position: 'Puesto', department: 'Depto',
    phone: 'Teléfono', company: 'Empresa', contact: 'Contacto', years: 'Años',
    billingDesc: 'Describa: portal de proveedores, requisitos, días de pago, condiciones...',
    adminPayments: 'Administrativo (Pagos)', invoices: 'Facturas', operative1: 'Operativo 1 (Embarques)',
    operative2: 'Operativo 2', reference: 'Referencia', transfer: 'Transferencia', check: 'Cheque',
    deposit: 'Depósito', supplierPortal: 'Portal de Proveedores',
    constanciaFiscal: 'Constancia Situación Fiscal', opinionCumplimiento: 'Opinión de Cumplimiento',
    comprobanteDomicilio: 'Comprobante Domicilio', ineRepresentante: 'INE Representante Legal',
    actaConstitutiva: 'Acta Constitutiva', caratulaBancaria: 'Carátula de Cuenta Bancaria',
    poderNotarial: 'Poder Notarial', currentMonth: 'Mes actual', last3Months: 'Últimos 3 meses',
    valid: 'Vigente', copy: 'Copia', noMovements: 'Sin movimientos, solo datos', optional: 'Opcional',
    razonSocial: 'Razón Social', rfc: 'RFC', repLegal: 'Rep. Legal', direccion: 'Dirección',
    banco: 'Banco', clabe: 'CLABE', titular: 'Titular'
  },
  en: {
    title: 'Client Registration', step1: 'Step 1: Documentation', step2: 'Step 2: Complete your information',
    uploadDocs: 'Upload your documents', uploadAll: 'Upload All', validateContinue: 'Validate and Continue',
    completeRequired: 'Complete documents marked with * to continue',
    validating: 'Validating Documents', validatingDesc: 'Verifying validity and extracting information...',
    problemsFound: 'Problems found', correctDocs: 'Correct Documents', docsValidated: 'Docs Validated',
    extractedData: 'Data extracted from your documents', bankData: 'Bank Details (extracted)',
    paymentMethod: 'Payment Method', additionalInfo: 'Additional Information', contacts: 'Contacts',
    commercialRefs: 'Commercial References', billingProcess: 'Billing Process',
    termsSignature: 'Terms and Signature', acceptTerms: 'I accept the', termsConditions: 'Terms and Conditions',
    privacyNotice: 'Privacy Notice', fullName: 'Full name (Digital Signature) *',
    mustMatch: 'Must match', nameNoMatch: 'Name does not match Legal Representative',
    sendRequest: 'Submit Request', sending: 'Submitting...', completed: 'Registration Complete!',
    sent: 'Request Submitted!', completedMsg: 'Your company has been successfully registered.',
    sentMsg: 'We have received your information. You will receive confirmation by email shortly.',
    notFound: 'Request not found', notFoundMsg: 'The link may have expired or is incorrect.',
    uploaded: 'Uploaded', needsCorrection: 'Needs correction', bankDetails: 'Bank details',
    change: 'Change', upload: 'Upload', businessActivity: 'Business Activity', website: 'Website',
    companySize: 'Company Size', name: 'Name', position: 'Position', department: 'Dept',
    phone: 'Phone', company: 'Company', contact: 'Contact', years: 'Years',
    billingDesc: 'Describe: supplier portal, requirements, payment terms, conditions...',
    adminPayments: 'Administrative (Payments)', invoices: 'Invoices', operative1: 'Operations 1 (Shipping)',
    operative2: 'Operations 2', reference: 'Reference', transfer: 'Wire Transfer', check: 'Check',
    deposit: 'Deposit', supplierPortal: 'Supplier Portal',
    constanciaFiscal: 'W-9 Form', opinionCumplimiento: 'Bank Statement',
    comprobanteDomicilio: 'MC# Certificate', ineRepresentante: 'Void Check',
    actaConstitutiva: 'ID Document', caratulaBancaria: 'Bank Account Details',
    poderNotarial: 'Power of Attorney', currentMonth: 'Current year', last3Months: 'Last 3 months',
    valid: 'Valid', copy: 'Copy', noMovements: 'Bank details only', optional: 'Optional',
    razonSocial: 'Company Name', rfc: 'Tax ID', repLegal: 'Legal Rep', direccion: 'Address',
    banco: 'Bank', clabe: 'Routing #', titular: 'Account #'
  }
};

const DOCS_MX = [
  { key: 'constancia_fiscal', lk: 'constanciaFiscal', req: true, tk: 'currentMonth' },
  { key: 'opinion_cumplimiento', lk: 'opinionCumplimiento', req: true, tk: 'currentMonth' },
  { key: 'comprobante_domicilio', lk: 'comprobanteDomicilio', req: true, tk: 'last3Months' },
  { key: 'ine_representante', lk: 'ineRepresentante', req: true, tk: 'valid' },
  { key: 'acta_constitutiva', lk: 'actaConstitutiva', req: true, tk: 'copy' },
  { key: 'caratula_bancaria', lk: 'caratulaBancaria', req: true, tk: 'noMovements' },
  { key: 'poder_notarial', lk: 'poderNotarial', req: false, tk: 'optional' }
];

const DOCS_USA = [
  { key: 'w9', lk: 'constanciaFiscal', req: true, tk: 'currentMonth' },
  { key: 'bank_statement', lk: 'opinionCumplimiento', req: true, tk: 'last3Months' },
  { key: 'mc_number', lk: 'comprobanteDomicilio', req: true, tk: 'valid' },
  { key: 'void_check', lk: 'ineRepresentante', req: true, tk: 'noMovements' },
  { key: 'id_document', lk: 'actaConstitutiva', req: true, tk: 'valid' }
];

const SIZES = { es: ['Seleccione...','1-10 colaboradores','11-50','51-200','201-500','500+'], en: ['Select...','1-10 employees','11-50','51-200','201-500','500+'] };

interface Props { solicitudId: string; }

export function AltaClientePublico({ solicitudId }: Props) {
  const [loading, setLoading] = useState(true);
  const [solicitud, setSolicitud] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<'es'|'en'>('es');
  const t = T[lang];
  const [paso, setPaso] = useState<'documentos'|'validando'|'errores'|'formulario'|'enviado'|'completado'>('documentos');
  const [uploadingDoc, setUploadingDoc] = useState<string|null>(null);
  const [uploadingAll, setUploadingAll] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<Record<string,string>>({});
  const [tooltipVisible, setTooltipVisible] = useState<string|null>(null);
  const [errores, setErrores] = useState<any[]>([]);
  const [datos, setDatos] = useState<any>({});
  const [progreso, setProgreso] = useState(0);
  const multiRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    giro:'',pagina_web:'',tamano_empresa:'Seleccione...',whatsapp:'',
    contacto_admin_nombre:'',contacto_admin_puesto:'',contacto_admin_depto:'',contacto_admin_email:'',contacto_admin_tel:'',
    contacto_facturas_nombre:'',contacto_facturas_puesto:'',contacto_facturas_depto:'',contacto_facturas_email:'',contacto_facturas_tel:'',
    contacto_op1_nombre:'',contacto_op1_puesto:'',contacto_op1_depto:'',contacto_op1_email:'',contacto_op1_tel:'',
    contacto_op2_nombre:'',contacto_op2_puesto:'',contacto_op2_depto:'',contacto_op2_email:'',contacto_op2_tel:'',
    ref1_empresa:'',ref1_contacto:'',ref1_whatsapp:'',ref1_email:'',ref1_anos:'',
    ref2_empresa:'',ref2_contacto:'',ref2_whatsapp:'',ref2_email:'',ref2_anos:'',
    ref3_empresa:'',ref3_contacto:'',ref3_whatsapp:'',ref3_email:'',ref3_anos:'',
    proceso_facturacion:'',firma_nombre:'',firma_aceptada:false,
    forma_pago_transferencia:true,forma_pago_cheque:false,forma_pago_deposito:false,forma_pago_portal:false
  });
  const [submitting, setSubmitting] = useState(false);

  const tipo = solicitud?.tipo_empresa || 'MEXICANA';
  const docs = tipo === 'USA_CANADA' ? DOCS_USA : DOCS_MX;
  const docsReq = docs.filter(d => d.req);
  const allUploaded = docsReq.every(d => uploadedDocs[d.key]);
  const uploaded = docs.filter(d => uploadedDocs[d.key]).length;

  useEffect(() => { if (tipo === 'USA_CANADA') setLang('en'); }, [tipo]);
  useEffect(() => { if (solicitudId) fetchSol(); }, [solicitudId]);

  const fetchSol = async () => {
    try {
      const { data, error } = await supabase.from('alta_clientes').select('*').eq('id', solicitudId).single();
      if (error) throw error;
      if (!data) throw new Error('Not found');
      setSolicitud(data);
      if (data.estatus === 'COMPLETADA') setPaso('completado');
      else if (['PENDIENTE_CSR','PENDIENTE_CXC','PENDIENTE_CONFIRMACION'].includes(data.estatus)) setPaso('enviado');
      else if (data.documentos_validados && data.datos_extraidos) { setDatos(data.datos_extraidos); setPaso('formulario'); }
      else if (data.errores_validacion?.length > 0) { setErrores(data.errores_validacion); setPaso('errores'); }
      if (data.documentos) setUploadedDocs(data.documentos);
      if (data.idioma) setLang(data.idioma);
    } catch (err) { console.error(err); setError('Error'); }
    finally { setLoading(false); }
  };

  const handleUpload = async (key: string, file: File) => {
    setUploadingDoc(key);
    try {
      const ext = file.name.split('.').pop();
      const name = `${solicitudId}/${key}_${Date.now()}.${ext}`;
      await supabase.storage.from('alta-documentos').upload(name, file, { upsert: true });
      const newDocs = { ...uploadedDocs, [key]: name };
      setUploadedDocs(newDocs);
      await supabase.from('alta_clientes').update({ documentos: newDocs }).eq('id', solicitudId);
    } catch (err) { alert('Error'); }
    finally { setUploadingDoc(null); }
  };

  const validar = async () => {
    setPaso('validando'); setProgreso(0); setErrores([]);
    const iv = setInterval(() => setProgreso(p => Math.min(p + 10, 90)), 500);
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/validar-documentos-alta`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseAnonKey}` },
        body: JSON.stringify({ solicitudId, documentos: uploadedDocs, tipoEmpresa: tipo, idioma: lang })
      });
      clearInterval(iv); setProgreso(100);
      const r = await res.json();
      if (!r.success) { setErrores(r.errores || []); setPaso('errores'); }
      else { setDatos(r.datosExtraidos || {}); await supabase.from('alta_clientes').update({ idioma: lang }).eq('id', solicitudId); setPaso('formulario'); }
    } catch { clearInterval(iv); setPaso('formulario'); }
  };

  const cap = (s: string) => s.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const handleChange = (e: any) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') { setForm(p => ({ ...p, [name]: e.target.checked })); return; }
    let v = value;
    if (name.includes('email')) v = value.toLowerCase();
    else if (name.includes('nombre') || name.includes('contacto') || name === 'firma_nombre') v = cap(value);
    else if (name.includes('depto')) v = value.toUpperCase();
    setForm(p => ({ ...p, [name]: v }));
  };

  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
  const firmaOK = () => {
    if (!datos.representante_legal) return true;
    const f = norm(form.firma_nombre).split(' ').filter(w => w.length > 2);
    const r = norm(datos.representante_legal).split(' ').filter(w => w.length > 2);
    return f.filter(w => r.includes(w)).length >= Math.floor(r.length * 0.7);
  };

  const getFormaPago = () => {
    const fp = [];
    if (form.forma_pago_transferencia) fp.push(lang === 'es' ? 'Transferencia' : 'Wire');
    if (form.forma_pago_cheque) fp.push(lang === 'es' ? 'Cheque' : 'Check');
    if (form.forma_pago_deposito) fp.push(lang === 'es' ? 'Depósito' : 'Deposit');
    if (form.forma_pago_portal) fp.push('Portal');
    return fp.join(', ') || 'Transferencia';
  };

  const enviar = async () => {
    if (!form.firma_aceptada || !form.firma_nombre) { alert(lang === 'es' ? 'Acepte términos y firme' : 'Accept terms and sign'); return; }
    if (!firmaOK()) { alert(lang === 'es' ? 'Firma no coincide' : 'Signature mismatch'); return; }
    setSubmitting(true);
    try {
      await supabase.from('alta_clientes').update({ ...form, contacto_admin_banco: datos.banco || '', contacto_admin_clabe: datos.clabe || '', forma_pago: getFormaPago(), idioma: lang, estatus: 'PENDIENTE_CSR', firma_fecha: new Date().toISOString(), firma_navegador: navigator.userAgent }).eq('id', solicitudId);
      await fetch(`${supabaseUrl}/functions/v1/generar-pdf-solicitud`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseAnonKey}` }, body: JSON.stringify({ solicitudId, idioma: lang }) }).catch(() => {});
      await fetch(`${supabaseUrl}/functions/v1/enviar-correo-alta`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseAnonKey}` }, body: JSON.stringify({ solicitudId, tipo: 'cliente_completo', idioma: lang }) }).catch(() => {});
      setPaso('enviado');
    } catch { alert('Error'); }
    finally { setSubmitting(false); }
  };

  const LangToggle = () => (
    <div className="flex items-center gap-2 bg-white/10 rounded-full p-1">
      <button onClick={() => setLang('es')} className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${lang === 'es' ? 'bg-orange-500 text-white' : 'text-white/70 hover:text-white'}`}>🇲🇽 ES</button>
      <button onClick={() => setLang('en')} className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${lang === 'en' ? 'bg-blue-500 text-white' : 'text-white/70 hover:text-white'}`}>🇺🇸 EN</button>
    </div>
  );

  const bg = "linear-gradient(135deg, #001f4d 0%, #003d7a 25%, #0066cc 50%, #1a8fff 75%, #4da6ff 100%)";
  const inputStyle = "w-full px-4 py-3 bg-white/5 border border-white/15 rounded-lg text-white text-base outline-none focus:border-orange-500/50 transition-colors";
  const labelStyle = "block text-sm font-medium text-white/70 mb-2";

  if (loading) return <div className="h-screen flex items-center justify-center" style={{ background: bg }}><Loader2 className="w-16 h-16 animate-spin text-white/50" /></div>;
  if (error || !solicitud) return <div className="h-screen flex items-center justify-center" style={{ background: bg }}><div className="bg-[#0a1628]/95 p-10 rounded-2xl text-center max-w-md border border-white/10"><AlertCircle className="w-16 h-16 mx-auto mb-4 text-orange-500" /><h2 className="text-2xl font-semibold text-white mb-2">{t.notFound}</h2><p className="text-white/60">{t.notFoundMsg}</p></div></div>;

  if (paso === 'completado' || paso === 'enviado') {
    const ok = paso === 'completado';
    return <div className="h-screen flex items-center justify-center" style={{ background: bg }}><div className="bg-[#0a1628]/95 p-12 rounded-2xl text-center max-w-lg border border-white/10"><div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${ok ? 'bg-green-500/20' : 'bg-blue-500/20'}`}>{ok ? <CheckCircle2 className="w-10 h-10 text-green-400" /> : <Send className="w-10 h-10 text-blue-400" />}</div><h2 className="text-2xl font-semibold text-white mb-3">{ok ? t.completed : t.sent}</h2><p className="text-white/70 text-lg">{ok ? t.completedMsg : t.sentMsg}</p></div></div>;
  }

  if (paso === 'validando') return <div className="h-screen flex items-center justify-center" style={{ background: bg }}><div className="bg-[#0a1628]/95 p-10 rounded-2xl text-center max-w-md border border-white/10"><div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center bg-orange-500/20"><Shield className="w-10 h-10 text-orange-400 animate-pulse" /></div><h2 className="text-2xl font-semibold text-white mb-3">{t.validating}</h2><p className="text-white/60 mb-6">{t.validatingDesc}</p><div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-4"><div className="h-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-300" style={{ width: `${progreso}%` }} /></div><p className="text-white/40 text-sm">{progreso}%</p></div></div>;

  if (paso === 'errores') return (
    <div className="h-screen flex flex-col" style={{ background: bg }}>
      <header className="px-6 py-3 flex items-center justify-between" style={{ background: 'rgba(0,0,0,0.4)' }}><div><h1 className="text-xl font-semibold text-white">{t.title}</h1><p className="text-sm text-white/60">{t.correctDocs}</p></div><LangToggle /></header>
      <div className="flex-1 flex items-center justify-center p-4"><div className="w-full max-w-2xl bg-[#0a1628]/95 rounded-2xl border border-white/10 p-8"><div className="flex items-center gap-3 mb-6"><AlertCircle className="w-8 h-8 text-red-400" /><h2 className="text-xl font-semibold text-white">{t.problemsFound}</h2></div><div className="space-y-4 mb-8">{errores.map((e,i) => <div key={i} className="p-4 rounded-xl bg-red-500/10 border border-red-500/30"><p className="text-red-300 font-semibold mb-1">❌ {e.documento}</p><p className="text-white/70 text-sm mb-2">{e.error}</p><p className="text-white/50 text-sm">→ {e.solucion}</p></div>)}</div><button onClick={() => { setErrores([]); setPaso('documentos'); }} className="w-full py-3 rounded-xl flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15"><RefreshCw className="w-5 h-5 text-white" /><span className="text-white font-semibold">{t.correctDocs}</span></button></div></div>
    </div>
  );

  if (paso === 'documentos') return (
    <div className="h-screen flex flex-col" style={{ background: bg }}>
      <header className="px-6 py-3 flex items-center justify-between" style={{ background: 'rgba(0,0,0,0.4)' }}><div><h1 className="text-xl font-semibold text-white">{t.title}</h1><p className="text-sm text-white/60">{t.step1}</p></div><div className="flex items-center gap-3"><span className="text-white/70 text-sm">{uploaded}/{docs.length}</span><LangToggle /><div className="px-4 py-1.5 rounded-full bg-green-500/20"><span className="text-white font-medium">{tipo === 'USA_CANADA' ? '🇺🇸 USA/CA' : '🇲🇽 México'}</span></div></div></header>
      <div className="flex-1 flex items-center justify-center p-4"><div className="w-full max-w-5xl"><div className="bg-[#0a1628]/95 rounded-2xl border border-white/10 p-6">
        <div className="flex items-center justify-between mb-6"><div><h2 className="text-xl font-semibold text-white">{t.uploadDocs}</h2></div><label className="px-5 py-2.5 rounded-xl cursor-pointer flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}>{uploadingAll ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : <FolderUp className="w-5 h-5 text-white" />}<span className="text-white font-semibold">{t.uploadAll}</span><input ref={multiRef} type="file" accept=".pdf,.jpg,.jpeg,.png" multiple className="hidden" disabled={uploadingAll} /></label></div>
        <div className="grid grid-cols-2 gap-3 mb-6">{docs.map(d => {
          const up = !!uploadedDocs[d.key]; const err = errores.some(e => e.documento?.toLowerCase().includes(d.key.replace('_', ' '))); const bank = d.key.includes('bancaria') || d.key.includes('void') || d.key.includes('bank');
          return <div key={d.key} className="flex items-center justify-between p-3 rounded-xl" style={{ background: err ? 'rgba(239,68,68,0.12)' : up ? 'rgba(34,197,94,0.12)' : bank ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.04)', border: `1.5px solid ${err ? 'rgba(239,68,68,0.35)' : up ? 'rgba(34,197,94,0.35)' : bank ? 'rgba(59,130,246,0.35)' : 'rgba(255,255,255,0.1)'}` }}>
            <div className="flex items-center gap-3">{err ? <AlertCircle className="w-5 h-5 text-red-400" /> : up ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : bank ? <CreditCard className="w-5 h-5 text-blue-400" /> : <div className="w-5 h-5 rounded-full border-2 border-white/25" />}<div><div className="flex items-center gap-1.5"><span className="text-white font-medium text-sm">{(t as any)[d.lk]}</span>{d.req && <span className="text-red-400 text-xs">*</span>}<div className="relative"><button onMouseEnter={() => setTooltipVisible(d.key)} onMouseLeave={() => setTooltipVisible(null)} className="p-0.5 hover:bg-white/10 rounded-full"><HelpCircle className="w-3.5 h-3.5 text-white/40" /></button>{tooltipVisible === d.key && <div className="absolute left-5 top-0 z-50 px-2 py-1 rounded bg-black/95 border border-orange-500/50 whitespace-nowrap"><span className="text-xs text-white">{(t as any)[d.tk]}</span></div>}</div></div>{up && !err && <span className="text-xs text-green-400/80">✓ {t.uploaded}</span>}{err && <span className="text-xs text-red-400/80">⚠ {t.needsCorrection}</span>}{bank && !up && <span className="text-xs text-blue-400/80">💳 {t.bankDetails}</span>}</div></div>
            <label className="px-3 py-1.5 rounded-lg cursor-pointer flex items-center gap-1.5 text-sm" style={{ background: up ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #fe5000 0%, #cc4000 100%)', color: '#fff', fontWeight: 500 }}>{uploadingDoc === d.key ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}{up ? t.change : t.upload}<input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => e.target.files?.[0] && handleUpload(d.key, e.target.files[0])} disabled={uploadingDoc !== null || uploadingAll} /></label>
          </div>;
        })}</div>
        <button onClick={validar} disabled={!allUploaded} className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed" style={{ background: allUploaded ? 'linear-gradient(135deg, #fe5000 0%, #cc4000 100%)' : 'rgba(255,255,255,0.1)' }}><Shield className="w-5 h-5 text-white" /><span className="text-white font-semibold text-lg">{t.validateContinue}</span></button>
        {!allUploaded && <p className="text-center mt-3 text-white/50 text-sm">{t.completeRequired}</p>}
      </div></div></div>
    </div>
  );

  // PASO 2: FORMULARIO
  const tieneExt = datos.rfc || datos.razon_social || datos.tax_id;
  const tieneBanco = datos.banco || datos.clabe || datos.routing_number;

  return (
    <div className="min-h-screen" style={{ background: bg }}>
      <header className="px-6 py-3 flex items-center justify-between sticky top-0 z-50" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)' }}><div><h1 className="text-xl font-semibold text-white">{t.title}</h1><p className="text-sm text-white/60">{t.step2}</p></div><div className="flex items-center gap-3"><LangToggle /><div className="px-3 py-1.5 rounded-full bg-green-500/20 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-400" /><span className="text-green-300 text-sm font-medium">{t.docsValidated}</span></div></div></header>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {tieneExt && <div className="bg-green-500/10 rounded-xl border border-green-500/30 p-5"><div className="flex items-center gap-2 mb-3"><CheckCircle2 className="w-5 h-5 text-green-400" /><h3 className="text-lg font-semibold text-white">{t.extractedData}</h3></div><div className="grid grid-cols-2 gap-4 text-sm">{datos.razon_social && <div><span className="text-white/50">{t.razonSocial}:</span><span className="text-white ml-2 font-medium">{datos.razon_social}</span></div>}{(datos.rfc || datos.tax_id) && <div><span className="text-white/50">{t.rfc}:</span><span className="text-white ml-2 font-medium">{datos.rfc || datos.tax_id}</span></div>}{datos.representante_legal && <div><span className="text-white/50">{t.repLegal}:</span><span className="text-white ml-2 font-medium">{datos.representante_legal}</span></div>}{datos.calle && <div className="col-span-2"><span className="text-white/50">{t.direccion}:</span><span className="text-white ml-2 font-medium">{datos.calle} {datos.no_ext}, {datos.colonia}, {datos.ciudad}, {datos.estado} CP {datos.cp}</span></div>}</div></div>}
        {tieneBanco && <div className="bg-blue-500/10 rounded-xl border border-blue-500/30 p-5"><div className="flex items-center gap-2 mb-3"><CreditCard className="w-5 h-5 text-blue-400" /><h3 className="text-lg font-semibold text-white">{t.bankData}</h3></div><div className="grid grid-cols-3 gap-4 text-sm">{datos.banco && <div><span className="text-white/50">{t.banco}:</span><span className="text-white ml-2 font-medium">{datos.banco}</span></div>}{(datos.clabe || datos.routing_number) && <div><span className="text-white/50">{t.clabe}:</span><span className="text-white ml-2 font-medium font-mono">{datos.clabe || datos.routing_number}</span></div>}{(datos.titular_cuenta || datos.account_number) && <div><span className="text-white/50">{t.titular}:</span><span className="text-white ml-2 font-medium">{datos.titular_cuenta || datos.account_number}</span></div>}</div></div>}
        <div className="bg-[#0a1628]/95 rounded-xl border border-white/10 p-6"><h3 className="text-lg font-semibold text-white mb-5">💳 {t.paymentMethod}</h3><div className="flex flex-wrap gap-6">{[{ k: 'forma_pago_transferencia', l: t.transfer },{ k: 'forma_pago_cheque', l: t.check },{ k: 'forma_pago_deposito', l: t.deposit },{ k: 'forma_pago_portal', l: t.supplierPortal }].map(fp => <label key={fp.k} className="flex items-center gap-2 cursor-pointer"><input type="checkbox" name={fp.k} checked={(form as any)[fp.k]} onChange={handleChange} className="w-5 h-5 rounded" style={{ accentColor: '#fe5000' }} /><span className="text-white/80">{fp.l}</span></label>)}</div></div>
        <div className="bg-[#0a1628]/95 rounded-xl border border-white/10 p-6"><h3 className="text-lg font-semibold text-white mb-5">📋 {t.additionalInfo}</h3><div className="grid grid-cols-2 gap-5"><div><label className={labelStyle}>{t.businessActivity}</label><input type="text" name="giro" value={form.giro} onChange={handleChange} className={inputStyle} /></div><div><label className={labelStyle}>{t.website}</label><input type="text" name="pagina_web" value={form.pagina_web} onChange={handleChange} className={inputStyle} /></div><div><label className={labelStyle}>WhatsApp</label><input type="tel" name="whatsapp" value={form.whatsapp} onChange={handleChange} className={inputStyle} /></div><div><label className={labelStyle}>{t.companySize}</label><select name="tamano_empresa" value={form.tamano_empresa} onChange={handleChange} className={inputStyle}>{SIZES[lang].map(s => <option key={s} value={s} style={{ background: '#1a1a2e' }}>{s}</option>)}</select></div></div></div>
        <div className="bg-[#0a1628]/95 rounded-xl border border-white/10 p-6"><h3 className="text-lg font-semibold text-white mb-5">👥 {t.contacts}</h3>{[{ p: 'contacto_admin', l: t.adminPayments, c: '#fe5000' },{ p: 'contacto_facturas', l: t.invoices, c: '#3b82f6' },{ p: 'contacto_op1', l: t.operative1, c: '#22c55e' },{ p: 'contacto_op2', l: t.operative2, c: '#a855f7' }].map(ct => <div key={ct.p} className="mb-4 p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${ct.c}25` }}><label className="block text-sm font-semibold mb-3" style={{ color: ct.c }}>{ct.l}</label><div className="grid grid-cols-5 gap-3"><input type="text" name={`${ct.p}_nombre`} value={(form as any)[`${ct.p}_nombre`]} onChange={handleChange} placeholder={t.name} className={inputStyle} /><input type="text" name={`${ct.p}_puesto`} value={(form as any)[`${ct.p}_puesto`]} onChange={handleChange} placeholder={t.position} className={inputStyle} /><input type="text" name={`${ct.p}_depto`} value={(form as any)[`${ct.p}_depto`]} onChange={handleChange} placeholder={t.department} className={inputStyle} /><input type="email" name={`${ct.p}_email`} value={(form as any)[`${ct.p}_email`]} onChange={handleChange} placeholder="email@co.com" className={inputStyle} /><input type="tel" name={`${ct.p}_tel`} value={(form as any)[`${ct.p}_tel`]} onChange={handleChange} placeholder={t.phone} className={inputStyle} /></div></div>)}</div>
        <div className="bg-[#0a1628]/95 rounded-xl border border-white/10 p-6"><h3 className="text-lg font-semibold text-white mb-5">🏢 {t.commercialRefs}</h3>{[1,2,3].map(n => <div key={n} className="mb-4 p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}><label className="block text-sm font-semibold text-orange-500 mb-3">{t.reference} {n}</label><div className="grid grid-cols-5 gap-3"><input type="text" name={`ref${n}_empresa`} value={(form as any)[`ref${n}_empresa`]} onChange={handleChange} placeholder={t.company} className={inputStyle} /><input type="text" name={`ref${n}_contacto`} value={(form as any)[`ref${n}_contacto`]} onChange={handleChange} placeholder={t.contact} className={inputStyle} /><input type="tel" name={`ref${n}_whatsapp`} value={(form as any)[`ref${n}_whatsapp`]} onChange={handleChange} placeholder="WhatsApp" className={inputStyle} /><input type="email" name={`ref${n}_email`} value={(form as any)[`ref${n}_email`]} onChange={handleChange} placeholder="Email" className={inputStyle} /><input type="text" name={`ref${n}_anos`} value={(form as any)[`ref${n}_anos`]} onChange={handleChange} placeholder={t.years} className={inputStyle} /></div></div>)}</div>
        <div className="bg-[#0a1628]/95 rounded-xl border border-white/10 p-6"><h3 className="text-lg font-semibold text-white mb-5">📄 {t.billingProcess}</h3><textarea name="proceso_facturacion" value={form.proceso_facturacion} onChange={handleChange} placeholder={t.billingDesc} rows={4} style={{ resize: 'vertical' }} className={inputStyle} /></div>
        <div className="bg-[#0a1628]/95 rounded-xl border border-white/10 p-6"><h3 className="text-lg font-semibold text-white mb-5">✍️ {t.termsSignature}</h3><label className="flex items-start gap-3 cursor-pointer mb-5"><input type="checkbox" name="firma_aceptada" checked={form.firma_aceptada} onChange={handleChange} className="mt-1 w-5 h-5 rounded" style={{ accentColor: '#fe5000' }} /><span className="text-white/80 text-sm">{t.acceptTerms} <a href="#" className="text-orange-400 underline">{t.termsConditions}</a> {lang === 'es' ? 'y el' : 'and the'} <a href="#" className="text-orange-400 underline">{t.privacyNotice}</a>.</span></label><div><label className={labelStyle}>{t.fullName}{datos.representante_legal && <span className="text-orange-400 ml-2">— {t.mustMatch}: {datos.representante_legal}</span>}</label><input type="text" name="firma_nombre" value={form.firma_nombre} onChange={handleChange} placeholder={datos.representante_legal || (lang === 'es' ? 'Escriba su nombre completo' : 'Enter your full name')} className={inputStyle} />{form.firma_nombre && !firmaOK() && <p className="text-red-400 text-sm mt-2">⚠️ {t.nameNoMatch}</p>}</div></div>
        <button onClick={enviar} disabled={submitting || !form.firma_aceptada || !form.firma_nombre} className="w-full py-4 rounded-xl flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed" style={{ background: 'linear-gradient(135deg, #fe5000 0%, #cc4000 100%)' }}>{submitting ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : <Send className="w-6 h-6 text-white" />}<span className="text-white font-semibold text-lg">{submitting ? t.sending : t.sendRequest}</span></button>
      </div>
    </div>
  );
}
