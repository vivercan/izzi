import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ClipboardCheck, Download, CheckCircle2, Loader2, FileText, User, FileDown } from 'lucide-react';
import { jsPDF } from 'jspdf';

const supabaseUrl = 'https://fbxbsslhewchyibdoyzk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieGJzc2xoZXdjaHlpYmRveXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzczODEsImV4cCI6MjA3ODExMzM4MX0.Z8JPlg7hhKbA624QGHp2bKKTNtCD3WInQMO5twjl6a0';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Solicitud {
  id: string; razon_social: string; rfc: string; representante_legal: string; email_cliente: string;
  calle: string; no_ext: string; no_int: string; colonia: string; cp: string; ciudad: string; estado: string;
  giro: string; whatsapp: string;
  csr_nombre: string; csr_email: string; csr_celular: string;
  cxc_nombre: string; cxc_email: string; cxc_celular: string;
  tipo_pago: string; dias_credito: number; documentos: Record<string, string>;
  contacto_admin_nombre: string; contacto_admin_email: string; contacto_admin_tel: string;
  firma_digital: string; firma_ip: string; firma_fecha: string; firma_navegador: string;
  estatus: string; created_at: string;
}

export function ConfirmarAlta() {
  const [loading, setLoading] = useState(true);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: sols } = await supabase.from('alta_clientes').select('*').eq('estatus', 'PENDIENTE_CONFIRMACION').order('created_at', { ascending: false });
    setSolicitudes(sols || []);
    setLoading(false);
  };

  const descargarTodos = async () => {
    if (!selectedSolicitud?.documentos) return;
    setDownloading(true);
    for (const [key, path] of Object.entries(selectedSolicitud.documentos)) {
      if (!path) continue;
      const { data } = await supabase.storage.from('alta-documentos').download(path);
      if (data) {
        const url = URL.createObjectURL(data);
        const a = document.createElement('a'); a.href = url; a.download = `${selectedSolicitud.rfc}_${key}.pdf`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
        await new Promise(r => setTimeout(r, 300));
      }
    }
    setDownloading(false);
  };

  const generarPDFSolicitud = async () => {
    if (!selectedSolicitud) return;
    setGenerandoPDF(true);
    
    try {
      const sol = selectedSolicitud;
      const doc = new jsPDF('p', 'mm', 'letter');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 18;
      const contentWidth = pageWidth - (margin * 2);
      let y = margin;

      const azulOscuro: [number, number, number] = [30, 58, 95];
      const naranja: [number, number, number] = [254, 80, 0];
      const gris: [number, number, number] = [100, 116, 139];
      const negro: [number, number, number] = [30, 41, 59];

      // ═══════════════════════════════════════════════════════════════
      // PÁGINA 1 - DATOS DE LA SOLICITUD
      // ═══════════════════════════════════════════════════════════════
      
      // HEADER
      doc.setFillColor(azulOscuro[0], azulOscuro[1], azulOscuro[2]);
      doc.rect(0, 0, pageWidth, 32, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('GRUPO LOMA | TROB TRANSPORTES', pageWidth / 2, 13, { align: 'center' });
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('SOLICITUD DE ALTA DE CLIENTE', pageWidth / 2, 22, { align: 'center' });
      y = 40;

      // DATOS FISCALES
      doc.setFillColor(naranja[0], naranja[1], naranja[2]);
      doc.rect(margin, y, contentWidth, 7, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('DATOS FISCALES', margin + 3, y + 5);
      y += 10;

      doc.setFontSize(9);
      const datosFiscales = [
        ['Razón Social:', sol.razon_social || ''],
        ['RFC:', sol.rfc || ''],
        ['Representante Legal:', sol.representante_legal || ''],
        ['Dirección:', `${sol.calle || ''} ${sol.no_ext || ''}${sol.no_int ? ' Int. ' + sol.no_int : ''}, ${sol.colonia || ''}`],
        ['C.P. / Ciudad / Estado:', `${sol.cp || ''} / ${sol.ciudad || ''} / ${sol.estado || ''}`],
      ];

      datosFiscales.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(gris[0], gris[1], gris[2]);
        doc.text(label, margin, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(negro[0], negro[1], negro[2]);
        doc.text(String(value), margin + 42, y);
        y += 5;
      });
      y += 4;

      // DATOS DE CONTACTO
      doc.setFillColor(naranja[0], naranja[1], naranja[2]);
      doc.rect(margin, y, contentWidth, 7, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('DATOS DE CONTACTO', margin + 3, y + 5);
      y += 10;

      doc.setFontSize(9);
      const datosContacto = [
        ['Email:', sol.email_cliente || ''],
        ['WhatsApp:', sol.whatsapp || ''],
        ['Giro:', sol.giro || ''],
        ['Contacto Administrativo:', sol.contacto_admin_nombre || ''],
        ['Email / Tel Contacto:', `${sol.contacto_admin_email || ''} / ${sol.contacto_admin_tel || ''}`],
      ];

      datosContacto.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(gris[0], gris[1], gris[2]);
        doc.text(label, margin, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(negro[0], negro[1], negro[2]);
        doc.text(String(value), margin + 42, y);
        y += 5;
      });
      y += 4;

      // CONDICIONES DE PAGO
      doc.setFillColor(34, 197, 94);
      doc.rect(margin, y, contentWidth, 7, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('CONDICIONES DE PAGO', margin + 3, y + 5);
      y += 10;

      doc.setFillColor(236, 253, 245);
      doc.rect(margin, y, contentWidth, 12, 'F');
      doc.setTextColor(6, 95, 70);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      const tipoPagoTexto = sol.tipo_pago === 'PREPAGO' ? 'PREPAGO' : `CREDITO - ${sol.dias_credito} DIAS`;
      doc.text(tipoPagoTexto, pageWidth / 2, y + 8, { align: 'center' });
      y += 17;

      // EJECUTIVOS ASIGNADOS
      doc.setFillColor(59, 130, 246);
      doc.rect(margin, y, contentWidth, 7, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('EJECUTIVOS ASIGNADOS', margin + 3, y + 5);
      y += 10;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(gris[0], gris[1], gris[2]);
      doc.text('Servicio al Cliente (CSR):', margin, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(negro[0], negro[1], negro[2]);
      doc.text(`${sol.csr_nombre || 'Pendiente'} - ${sol.csr_email || ''} - ${sol.csr_celular || ''}`, margin + 42, y);
      y += 5;

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(gris[0], gris[1], gris[2]);
      doc.text('Cobranza (CxC):', margin, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(negro[0], negro[1], negro[2]);
      doc.text(`${sol.cxc_nombre || 'Pendiente'} - ${sol.cxc_email || ''} - ${sol.cxc_celular || ''}`, margin + 42, y);
      y += 8;

      // FIRMA DIGITAL
      doc.setFillColor(124, 58, 237);
      doc.rect(margin, y, contentWidth, 7, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('FIRMA DIGITAL Y ACEPTACION', margin + 3, y + 5);
      y += 10;

      // Cuadro de firma
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.5);
      doc.rect(margin, y, 55, 28);

      if (sol.firma_digital) {
        try {
          doc.addImage(sol.firma_digital, 'PNG', margin + 2, y + 2, 51, 24);
        } catch (e) {
          doc.setTextColor(gris[0], gris[1], gris[2]);
          doc.setFontSize(8);
          doc.text('Firma no disponible', margin + 12, y + 14);
        }
      } else {
        doc.setTextColor(gris[0], gris[1], gris[2]);
        doc.setFontSize(8);
        doc.text('Sin firma digital', margin + 14, y + 14);
      }

      const firmaX = margin + 62;
      doc.setTextColor(negro[0], negro[1], negro[2]);
      doc.setFontSize(8);

      doc.setFont('helvetica', 'bold');
      doc.text('Fecha y Hora:', firmaX, y + 6);
      doc.setFont('helvetica', 'normal');
      doc.text(sol.firma_fecha || new Date().toLocaleString('es-MX'), firmaX + 24, y + 6);

      doc.setFont('helvetica', 'bold');
      doc.text('Dirección IP:', firmaX, y + 12);
      doc.setFont('helvetica', 'normal');
      doc.text(sol.firma_ip || 'No registrada', firmaX + 24, y + 12);

      doc.setFont('helvetica', 'bold');
      doc.text('Navegador:', firmaX, y + 18);
      doc.setFont('helvetica', 'normal');
      const nav = (sol.firma_navegador || 'No registrado').substring(0, 50);
      doc.text(nav, firmaX + 22, y + 18);

      doc.setFont('helvetica', 'bold');
      doc.text('Firmante:', firmaX, y + 24);
      doc.setFont('helvetica', 'normal');
      doc.text(sol.representante_legal || 'Representante Legal', firmaX + 18, y + 24);

      y += 35;

      // Declaración corta
      doc.setFillColor(254, 243, 199);
      doc.rect(margin, y, contentWidth, 20, 'F');
      doc.setTextColor(146, 64, 14);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text('DECLARACIÓN Y COMPROMISO DEL CLIENTE', margin + 3, y + 5);
      doc.setFont('helvetica', 'normal');
      const declaracion = '• Al completar esta solicitud, el cliente declara que toda la información es verdadera y precisa.\n• El cliente autoriza a GRUPO LOMA | TROB TRANSPORTES a verificar la información proporcionada.\n• El cliente se compromete a cumplir con los términos y condiciones de servicio establecidos.\n• Al firmar, el Cliente acepta los TÉRMINOS Y CONDICIONES (página 2).';
      doc.text(declaracion, margin + 3, y + 10);

      // Footer página 1
      doc.setTextColor(gris[0], gris[1], gris[2]);
      doc.setFontSize(8);
      doc.text(`RFC: ${sol.rfc} | Página 1 de 2`, pageWidth / 2, pageHeight - 10, { align: 'center' });

      // ═══════════════════════════════════════════════════════════════
      // PÁGINA 2 - TÉRMINOS Y CONDICIONES
      // ═══════════════════════════════════════════════════════════════
      doc.addPage();
      y = margin;

      doc.setFillColor(azulOscuro[0], azulOscuro[1], azulOscuro[2]);
      doc.rect(0, 0, pageWidth, 22, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('TÉRMINOS Y CONDICIONES GENERALES', pageWidth / 2, 14, { align: 'center' });
      y = 28;

      doc.setTextColor(negro[0], negro[1], negro[2]);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');

      const terminos = `I. DECLARACIONES Y AUTORIZACIONES DEL CLIENTE

Al completar y firmar la presente Solicitud de Crédito y Alta de Cliente ("Solicitud"), la persona firmante, en nombre y representación del cliente (el "Cliente"):

a) Declara, bajo protesta de decir verdad, que toda la información proporcionada es verdadera, completa y precisa.
b) Autoriza expresamente a GRUPO LOMA | TROB TRANSPORTES a verificar la información proporcionada, incluyendo referencias comerciales, bancarias y de comportamiento de pago con otros proveedores.
c) Reconoce que la aprobación de esta Solicitud es facultad exclusiva de GRUPO LOMA | TROB TRANSPORTES y que la misma no implica obligación de otorgar ni de mantener el crédito, pudiendo éste ser modificado, suspendido o cancelado en caso de incumplimiento en los pagos o de cambio en la situación de riesgo del Cliente.

II. CONDICIONES DE SERVICIO, RESPONSABILIDAD Y PENALIZACIONES

El Cliente acepta que los servicios de transporte, logística y maniobras que le preste GRUPO LOMA | TROB TRANSPORTES se regirán por:
a) Las condiciones particulares pactadas por escrito entre las partes (órdenes de servicio, contratos marco, convenios tarifarios, correos de confirmación), y
b) La legislación aplicable en materia de autotransporte federal de carga y comercio en los Estados Unidos Mexicanos.

El Cliente se obliga a pagar la totalidad de los fletes, maniobras y servicios facturados en los plazos de pago autorizados, sin aplicar descuentos, penalizaciones, notas de crédito, compensaciones ni retenciones unilaterales, salvo convenio expreso por escrito firmado por ambas partes.

Cualquier reclamo por demora, daño, merma, pérdida de mercancía, accidente, robo, siniestro o cualquier otro concepto deberá presentarse por escrito dentro de un plazo máximo de 15 días naturales contados a partir de la entrega, adjuntando la evidencia correspondiente. La existencia de un reclamo no autoriza al Cliente a retener, descontar o diferir el pago de facturas.

GRUPO LOMA | TROB TRANSPORTES no será responsable frente al Cliente por penalizaciones, multas contractuales, pérdida de ventas, lucro cesante, daño reputacional ni por daños indirectos o consecuenciales. La responsabilidad máxima del transportista se limitará a lo establecido en la legislación aplicable y al monto amparado por las pólizas de seguro contratadas.

No serán imputables a GRUPO LOMA | TROB TRANSPORTES los retrasos, cancelaciones o incumplimientos derivados de caso fortuito o fuerza mayor: cierres de carreteras, bloqueos, actos de autoridad, fenómenos naturales, siniestros, condiciones de tráfico, fallas mecánicas no previsibles, condiciones climáticas adversas o instrucciones incompletas del Cliente.

El Cliente se obliga a informar por escrito y de forma previa de cualquier cláusula de penalización contenida en sus contratos con terceros que pudiera impactar los servicios de transporte. La falta de dicha información libera a GRUPO LOMA | TROB TRANSPORTES de cualquier responsabilidad.

En ningún caso el Cliente podrá trasladar penalizaciones, multas o retenciones que le impongan sus propios clientes, salvo acuerdo previo, específico y por escrito.

III. DATOS PERSONALES Y CONFIDENCIALIDAD

Los datos personales recabados serán tratados por GRUPO LOMA | TROB TRANSPORTES de manera confidencial conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares, únicamente para:
a) evaluar y gestionar el crédito,
b) administrar la relación comercial, y
c) prestar los servicios contratados.

El Cliente manifiesta haber leído y entendido estos Términos y Condiciones, aceptándolos íntegramente mediante su firma.`;

      const lines = doc.splitTextToSize(terminos, contentWidth);
      doc.text(lines, margin, y);

      // Cuadro de aceptación
      y = pageHeight - 50;
      doc.setFillColor(236, 253, 245);
      doc.rect(margin, y, contentWidth, 28, 'F');
      doc.setDrawColor(34, 197, 94);
      doc.setLineWidth(1);
      doc.rect(margin, y, contentWidth, 28);

      doc.setTextColor(6, 95, 70);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('AL FIRMAR ESTE DOCUMENTO, EL CLIENTE ACEPTA', pageWidth / 2, y + 9, { align: 'center' });
      doc.text('ÍNTEGRAMENTE ESTOS TÉRMINOS Y CONDICIONES.', pageWidth / 2, y + 16, { align: 'center' });
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Este documento forma parte integral del Alta de Cliente de GRUPO LOMA | TROB TRANSPORTES.', pageWidth / 2, y + 24, { align: 'center' });

      // Footer
      doc.setTextColor(gris[0], gris[1], gris[2]);
      doc.setFontSize(8);
      doc.text(`RFC: ${sol.rfc} | Generado: ${new Date().toLocaleString('es-MX')} | Página 2 de 2`, pageWidth / 2, pageHeight - 10, { align: 'center' });

      // Descargar
      doc.save(`Solicitud_Alta_${sol.rfc || 'cliente'}.pdf`);
    } catch (err) {
      console.error('Error generando PDF:', err);
      alert('Error al generar PDF');
    } finally {
      setGenerandoPDF(false);
    }
  };

  const confirmarAlta = async () => {
    if (!selectedSolicitud) return;
    setSubmitting(true);
    await supabase.from('alta_clientes').update({ estatus: 'COMPLETADA', fecha_confirmacion: new Date().toISOString() }).eq('id', selectedSolicitud.id);
    await fetch(`${supabaseUrl}/functions/v1/enviar-correo-alta`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseAnonKey}` },
      body: JSON.stringify({ solicitudId: selectedSolicitud.id, tipo: 'alta_completada' })
    });
    setShowConfirm(false); setSelectedSolicitud(null); setSubmitting(false); fetchData();
    alert('✅ Alta confirmada. Correos enviados.');
  };

  if (loading) return <div className="h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0a1628 0%, #1a2d4a 100%)' }}><Loader2 className="w-10 h-10 animate-spin text-green-500" /></div>;

  return (
    <div className="h-screen flex flex-col p-4" style={{ background: 'linear-gradient(135deg, #0a1628 0%, #1a2d4a 100%)' }}>
      <div className="flex items-center gap-3 mb-3 flex-shrink-0">
        <ClipboardCheck className="w-6 h-6 text-green-500" />
        <h1 className="text-xl font-bold text-white">Confirmar Alta</h1>
        <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 text-xs">{solicitudes.length} pendientes</span>
      </div>

      {solicitudes.length === 0 ? (
        <div className="flex-1 flex items-center justify-center"><CheckCircle2 className="w-12 h-12 text-green-400 mr-3" /><span className="text-white text-lg">No hay solicitudes pendientes</span></div>
      ) : (
        <div className="flex-1 grid grid-cols-4 gap-3 min-h-0">
          <div className="bg-white/5 rounded-xl border border-white/10 p-2 overflow-y-auto">
            {solicitudes.map((sol) => (
              <div key={sol.id} onClick={() => setSelectedSolicitud(sol)}
                className={`p-2 rounded-lg cursor-pointer mb-1 ${selectedSolicitud?.id === sol.id ? 'bg-green-500/20 border border-green-500' : 'bg-white/5 hover:bg-white/10 border border-transparent'}`}>
                <p className="text-white text-sm font-medium truncate">{sol.razon_social}</p>
                <p className="text-green-400 text-xs font-mono">{sol.rfc}</p>
              </div>
            ))}
          </div>

          <div className="col-span-3 bg-white/5 rounded-xl border border-white/10 p-3 flex flex-col overflow-hidden">
            {!selectedSolicitud ? (
              <div className="flex-1 flex items-center justify-center text-white/40">Selecciona una solicitud</div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-base font-semibold text-green-400 truncate">{selectedSolicitud.razon_social}</h2>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${selectedSolicitud.tipo_pago === 'PREPAGO' ? 'bg-orange-500/20 text-orange-300' : 'bg-blue-500/20 text-blue-300'}`}>
                    {selectedSolicitud.tipo_pago === 'PREPAGO' ? 'Prepago' : `Crédito ${selectedSolicitud.dias_credito}d`}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 mb-2 flex-shrink-0">
                  <div className="bg-black/20 rounded p-2">
                    <p className="text-[9px] text-white/50 flex items-center gap-1"><FileText className="w-3 h-3" /> RFC</p>
                    <p className="text-white text-xs font-mono">{selectedSolicitud.rfc}</p>
                  </div>
                  <div className="bg-black/20 rounded p-2">
                    <p className="text-[9px] text-white/50 flex items-center gap-1"><User className="w-3 h-3" /> Rep. Legal</p>
                    <p className="text-white text-xs truncate">{selectedSolicitud.representante_legal || 'N/A'}</p>
                  </div>
                  <div className="bg-black/20 rounded p-2">
                    <p className="text-[9px] text-white/50">Email</p>
                    <p className="text-white text-xs truncate">{selectedSolicitud.email_cliente}</p>
                  </div>
                  <div className="bg-black/20 rounded p-2">
                    <p className="text-[9px] text-white/50">Contacto</p>
                    <p className="text-white text-xs truncate">{selectedSolicitud.contacto_admin_nombre || 'N/A'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-2 flex-shrink-0">
                  <div className="bg-orange-500/10 border border-orange-500/30 rounded p-2">
                    <p className="text-[9px] text-orange-400 font-semibold">CSR ASIGNADO</p>
                    <p className="text-white text-sm">{selectedSolicitud.csr_nombre}</p>
                    <p className="text-white/60 text-[10px]">{selectedSolicitud.csr_email}</p>
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded p-2">
                    <p className="text-[9px] text-blue-400 font-semibold">COBRANZA ASIGNADO</p>
                    <p className="text-white text-sm">{selectedSolicitud.cxc_nombre}</p>
                    <p className="text-white/60 text-[10px]">{selectedSolicitud.cxc_email}</p>
                  </div>
                </div>

                <div className="bg-purple-500/10 border border-purple-500/30 rounded p-2 mb-2 flex-shrink-0">
                  <p className="text-[9px] text-purple-400 font-semibold mb-1">FIRMA DIGITAL</p>
                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                    <div><span className="text-white/50">IP:</span> <span className="text-white">{selectedSolicitud.firma_ip || 'No registrada'}</span></div>
                    <div><span className="text-white/50">Fecha:</span> <span className="text-white">{selectedSolicitud.firma_fecha || 'No registrada'}</span></div>
                    <div><span className="text-white/50">Firma:</span> <span className={selectedSolicitud.firma_digital ? 'text-green-400' : 'text-red-400'}>{selectedSolicitud.firma_digital ? '✓ Capturada' : '✗ Sin firma'}</span></div>
                  </div>
                </div>

                <div className="bg-black/20 rounded p-2 mb-2 flex-shrink-0">
                  <p className="text-[9px] text-white/50 mb-1">DOCUMENTOS</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedSolicitud.documentos && Object.keys(selectedSolicitud.documentos).map((key) => (
                      <span key={key} className="px-2 py-0.5 rounded bg-white/10 text-white/70 text-[10px]">✓ {key.replace(/_/g, ' ')}</span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-auto flex-shrink-0">
                  <button onClick={generarPDFSolicitud} disabled={generandoPDF} className="py-2 rounded-lg bg-purple-500/20 border border-purple-500/50 hover:bg-purple-500/30 text-white text-sm flex items-center justify-center gap-2">
                    {generandoPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />} Solicitud PDF
                  </button>
                  <button onClick={descargarTodos} disabled={downloading} className="py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm flex items-center justify-center gap-2">
                    {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Documentos
                  </button>
                  <button onClick={() => setShowConfirm(true)} className="py-2 rounded-lg flex items-center justify-center gap-2 text-white text-sm font-semibold" style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' }}>
                    <CheckCircle2 className="w-4 h-4" /> Confirmar Alta
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showConfirm && selectedSolicitud && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#0a1628] rounded-xl border border-white/20 p-5 max-w-sm w-full">
            <h3 className="text-base font-semibold text-white mb-2">Confirmar Alta</h3>
            <p className="text-white/70 text-sm mb-3">¿Confirmar alta de <b className="text-green-400">{selectedSolicitud.razon_social}</b>?</p>
            <p className="text-white/50 text-xs mb-3">Se enviará correo de bienvenida al cliente y a todo el equipo.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-2 rounded-lg bg-white/10 text-white text-sm">Cancelar</button>
              <button onClick={confirmarAlta} disabled={submitting} className="flex-1 py-2 rounded-lg bg-green-500 text-white text-sm flex items-center justify-center gap-1">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
