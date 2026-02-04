// ═══════════════════════════════════════════════════════════════════════════
// CONFIRMAR ALTA - Para Nancy Alonso
// AUTO-SYNC: Inserta en sc_clientes_asignacion + sc_contactos_clientes
// Versión: 3.0 - 04/Feb/2026 - Flujo paralelo con auto-sync
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Download, CheckCircle2, Loader2, FileText, Building2, CreditCard, User, Calendar, DollarSign, Send, AlertCircle, Briefcase, Phone, Mail } from 'lucide-react';

const supabaseUrl = 'https://fbxbsslhewchyibdoyzk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieGJzc2xoZXdjaHlpYmRveXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzczODEsImV4cCI6MjA3ODExMzM4MX0.Z8JPlg7hhKbA624QGHp2bKKTNtCD3WInQMO5twjl6a0';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const EMPRESAS: Record<string, { nombre: string; razonSocial: string; color: string }> = {
  'TROB': { nombre: 'TROB Transportes', razonSocial: 'TROB TRANSPORTES SA DE CV', color: '#001f4d' },
  'WE': { nombre: 'WExpress', razonSocial: 'WEXPRESS LOGISTICS SA DE CV', color: '#059669' },
  'SHI': { nombre: 'Speedyhaul', razonSocial: 'SPEEDYHAUL SA DE CV', color: '#7c3aed' },
  'TROB_USA': { nombre: 'TROB USA', razonSocial: 'TROB TRANSPORTES USA LLC', color: '#dc2626' }
};

// Mapeo CSR nombre → código para sc_clientes_asignacion
const CSR_CODIGO_MAP: Record<string, string> = {
  'Elizabeth Pasillas Romo': 'ELI',
  'Eli Pasillas': 'ELI',
  'customer.service1@trob.com.mx': 'ELI',
  'Lizeth Garcia Paredes': 'LIZ',
  'Liz Garcia': 'LIZ',
  'customer.service3@trob.com.mx': 'LIZ',
};

interface Props {
  solicitudId: string;
  onConfirmed?: () => void;
}

export default function ConfirmarAltaNancy({ solicitudId, onConfirmed }: Props) {
  const [solicitud, setSolicitud] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => { cargarSolicitud(); }, [solicitudId]);

  const cargarSolicitud = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('alta_clientes').select('*').eq('id', solicitudId).single();
      if (error) throw error;
      setSolicitud(data);
      setConfirmed(data.estatus === 'COMPLETADA');
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const descargarDocumentos = async () => {
    setDownloading(true);
    try {
      const { data: files } = await supabase.storage.from('alta-documentos').list(solicitudId);
      for (const file of files || []) {
        const { data: fileData } = await supabase.storage.from('alta-documentos').download(`${solicitudId}/${file.name}`);
        if (fileData) {
          const url = URL.createObjectURL(fileData);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${solicitud.razon_social}_${file.name}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      alert('Documentos descargados');
    } catch (err) {
      alert('Error al descargar documentos');
    } finally {
      setDownloading(false);
    }
  };

  // AUTO-SYNC: Confirma alta + inserta en sc_clientes_asignacion + sc_contactos_clientes
  const confirmarAlta = async () => {
    setConfirming(true);
    try {
      // 1. Marcar como COMPLETADA
      await supabase.from('alta_clientes').update({
        estatus: 'COMPLETADA',
        confirmado_por: 'Nancy Alonso',
        confirmado_fecha: new Date().toISOString(),
        fecha_completado: new Date().toISOString()
      }).eq('id', solicitudId);

      // 2. Enviar correo de bienvenida
      await fetch(`${supabaseUrl}/functions/v1/enviar-correo-alta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseAnonKey}` },
        body: JSON.stringify({
          tipo: 'alta_completada',
          solicitudId,
          razonSocial: solicitud.razon_social,
          rfc: solicitud.rfc_mc || solicitud.rfc,
          nombreContacto: solicitud.nombre_cliente,
          emailCliente: solicitud.email_cliente,
          empresaFacturadora: solicitud.giro || solicitud.empresa_facturadora,
          csrNombre: solicitud.csr_nombre,
          csrEmail: solicitud.csr_email,
          csrTelefono: solicitud.csr_celular || solicitud.csr_telefono,
          cxcNombre: solicitud.cxc_nombre,
          cxcEmail: solicitud.cxc_email,
          cxcTelefono: solicitud.cxc_telefono,
          tipoPago: solicitud.tipo_pago,
          diasCredito: solicitud.dias_credito,
          creadoPorEmail: solicitud.creado_por_email || solicitud.enviado_por
        })
      }).catch(() => {});

      // 3. AUTO-SYNC: Insertar en sc_clientes_asignacion
      const csrCodigo = CSR_CODIGO_MAP[solicitud.csr_nombre] || CSR_CODIGO_MAP[solicitud.csr_email] || 'PENDIENTE';
      const rfcCliente = solicitud.rfc_mc || solicitud.rfc || '';

      const asignacionData: any = {
        cliente: solicitud.razon_social,
        vendedor: solicitud.vendedor_codigo || 'PENDIENTE',
        ejecutivo_sc: csrCodigo,
        status: 'ASIGNADO',
        empresa: solicitud.giro || solicitud.empresa_facturadora || '',
        tipo_pago: solicitud.tipo_pago,
        dias_credito: solicitud.dias_credito,
        cxc_nombre: solicitud.cxc_nombre,
        cxc_email: solicitud.cxc_email,
        notas: `Alta completada ${new Date().toLocaleDateString('es-MX')}`,
      };

      if (rfcCliente) {
        // Con RFC: upsert con conflict en rfc
        asignacionData.rfc = rfcCliente;
        await supabase.from('sc_clientes_asignacion')
          .upsert(asignacionData, { onConflict: 'rfc' })
          .then(({ error }) => {
            if (error) console.warn('Auto-sync asignacion:', error.message);
          });
      } else {
        // Sin RFC: insert simple
        await supabase.from('sc_clientes_asignacion')
          .insert(asignacionData)
          .then(({ error }) => {
            if (error) console.warn('Auto-sync asignacion:', error.message);
          });
      }

      // 4. AUTO-SYNC: Insertar contactos del formulario
      // Columnas reales: cliente_nombre, contacto_nombre, email, whatsapp, cargo, empresa
      const contactos = [
        { cargo: 'ADMIN_PAGOS', nombre: solicitud.contacto_admin_nombre, email: solicitud.contacto_admin_email, whatsapp: solicitud.contacto_admin_cel || solicitud.contacto_admin_tel },
        { cargo: 'FACTURAS', nombre: solicitud.contacto_fact_nombre, email: solicitud.contacto_fact_email, whatsapp: solicitud.contacto_fact_cel || solicitud.contacto_fact_tel },
        { cargo: 'OPERATIVO_1', nombre: solicitud.contacto_op1_nombre, email: solicitud.contacto_op1_email, whatsapp: solicitud.contacto_op1_cel || solicitud.contacto_op1_tel },
        { cargo: 'OPERATIVO_2', nombre: solicitud.contacto_op2_nombre, email: solicitud.contacto_op2_email, whatsapp: solicitud.contacto_op2_cel || solicitud.contacto_op2_tel },
      ];

      for (const c of contactos) {
        if (c.nombre) {
          await supabase.from('sc_contactos_clientes').insert({
            cliente_nombre: solicitud.razon_social,
            contacto_nombre: c.nombre,
            email: c.email || '',
            whatsapp: c.whatsapp || '',
            cargo: c.cargo,
            empresa: solicitud.giro || solicitud.empresa_facturadora || '',
          }).then(({ error }) => {
            if (error) console.warn(`Auto-sync contacto ${c.cargo}:`, error.message);
          });
        }
      }

      setConfirmed(true);
      alert('✅ Alta confirmada. Cliente sincronizado al módulo de Asignación.');
      onConfirmed?.();
    } catch (err) {
      console.error('Error:', err);
      alert('Error al confirmar');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;
  if (!solicitud) return <div className="text-center p-12 text-white/50">Solicitud no encontrada</div>;

  const empresaInfo = EMPRESAS[solicitud.giro] || EMPRESAS[solicitud.empresa_facturadora];
  const tipoPagoLabel = solicitud.tipo_pago === 'CREDITO' ? `Crédito a ${solicitud.dias_credito || 30} días` : 'Prepago';

  return (
    <div className="space-y-6">
      {/* PANEL PRINCIPAL: QUIÉN PAGA → A QUIÉN */}
      <div className="bg-gradient-to-r from-blue-500/20 to-orange-500/20 rounded-2xl border-2 border-blue-500/30 p-6">
        <h2 className="text-center text-sm font-bold text-white/50 mb-4">💰 INFORMACIÓN DE FACTURACIÓN</h2>
        <div className="grid grid-cols-3 gap-4 items-center">
          <div className="text-center p-4 bg-blue-500/20 rounded-xl border border-blue-500/40">
            <div className="w-12 h-12 bg-blue-500/30 rounded-full flex items-center justify-center mx-auto mb-3"><Building2 className="w-6 h-6 text-blue-400" /></div>
            <span className="text-xs text-blue-300/70 block mb-1">CLIENTE PAGA</span>
            <span className="text-lg font-bold text-blue-300">{solicitud.razon_social}</span>
            <span className="text-xs text-blue-300/60 block mt-1">{solicitud.rfc_mc || solicitud.rfc}</span>
          </div>
          <div className="text-center"><div className="text-4xl">→</div><span className="text-xs text-white/40 block mt-2">factura</span></div>
          <div className="text-center p-4 bg-orange-500/20 rounded-xl border border-orange-500/40">
            <div className="w-12 h-12 bg-orange-500/30 rounded-full flex items-center justify-center mx-auto mb-3"><Briefcase className="w-6 h-6 text-orange-400" /></div>
            <span className="text-xs text-orange-300/70 block mb-1">FACTURAR A</span>
            <span className="text-lg font-bold text-orange-300">{empresaInfo?.nombre || solicitud.empresa_facturadora || 'Por definir'}</span>
            <span className="text-xs text-orange-300/60 block mt-1">{empresaInfo?.razonSocial || ''}</span>
          </div>
        </div>
        <div className="mt-6 flex justify-center gap-8">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            <span className="text-white/60">Tipo:</span>
            <span className={`font-bold ${solicitud.tipo_pago === 'CREDITO' ? 'text-green-400' : 'text-blue-400'}`}>{tipoPagoLabel}</span>
          </div>
        </div>
      </div>

      {/* EJECUTIVOS ASIGNADOS */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#0a1628]/95 rounded-xl border border-white/10 p-5">
          <div className="flex items-center gap-2 mb-4"><User className="w-5 h-5 text-purple-400" /><h3 className="font-bold text-white">Servicio a Clientes</h3></div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2"><span className="text-white/50 w-16">Nombre:</span><span className="text-white font-medium">{solicitud.csr_nombre || '-'}</span></div>
            <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-white/30" /><span className="text-white/70">{solicitud.csr_email || '-'}</span></div>
            <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-white/30" /><span className="text-white/70">{solicitud.csr_celular || solicitud.csr_telefono || '-'}</span></div>
          </div>
        </div>
        <div className="bg-[#0a1628]/95 rounded-xl border border-white/10 p-5">
          <div className="flex items-center gap-2 mb-4"><CreditCard className="w-5 h-5 text-green-400" /><h3 className="font-bold text-white">Cobranza</h3></div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2"><span className="text-white/50 w-16">Nombre:</span><span className="text-white font-medium">{solicitud.cxc_nombre || '-'}</span></div>
            <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-white/30" /><span className="text-white/70">{solicitud.cxc_email || '-'}</span></div>
            <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-white/30" /><span className="text-white/70">{solicitud.cxc_telefono || '-'}</span></div>
          </div>
        </div>
      </div>

      {/* ACCIONES */}
      <div className="bg-[#0a1628]/95 rounded-xl border border-white/10 p-6">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-orange-400" />Documentos y Acciones</h3>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <button onClick={descargarDocumentos} disabled={downloading} className="p-4 rounded-xl bg-blue-500/20 border border-blue-500/30 hover:bg-blue-500/30 transition-all flex flex-col items-center gap-2">
            {downloading ? <Loader2 className="w-6 h-6 animate-spin text-blue-400" /> : <Download className="w-6 h-6 text-blue-400" />}
            <span className="text-sm text-blue-300">Descargar Documentos</span>
          </button>
          <button className="p-4 rounded-xl bg-purple-500/20 border border-purple-500/30 hover:bg-purple-500/30 transition-all flex flex-col items-center gap-2">
            <FileText className="w-6 h-6 text-purple-400" />
            <span className="text-sm text-purple-300">Ver Solicitud PDF</span>
          </button>
          {solicitud.calificacion_riesgo && (
            <div className={`p-4 rounded-xl flex flex-col items-center gap-2 ${solicitud.calificacion_riesgo === 'BAJO' ? 'bg-green-500/20 border border-green-500/30' : solicitud.calificacion_riesgo === 'MEDIO' ? 'bg-yellow-500/20 border border-yellow-500/30' : 'bg-red-500/20 border border-red-500/30'}`}>
              <AlertCircle className={`w-6 h-6 ${solicitud.calificacion_riesgo === 'BAJO' ? 'text-green-400' : solicitud.calificacion_riesgo === 'MEDIO' ? 'text-yellow-400' : 'text-red-400'}`} />
              <span className={`text-sm ${solicitud.calificacion_riesgo === 'BAJO' ? 'text-green-300' : solicitud.calificacion_riesgo === 'MEDIO' ? 'text-yellow-300' : 'text-red-300'}`}>Riesgo: {solicitud.calificacion_riesgo}</span>
            </div>
          )}
        </div>

        {(!solicitud.csr_nombre || !solicitud.cxc_nombre) && !confirmed && (
          <div className="mb-4 p-4 bg-yellow-500/20 rounded-xl border border-yellow-500/30">
            <div className="flex items-center gap-2 text-yellow-300"><AlertCircle className="w-5 h-5" /><span className="font-medium">Faltan asignaciones</span></div>
            <p className="text-yellow-300/70 text-sm mt-1">
              {!solicitud.csr_nombre && '• Falta asignar ejecutivo de Servicio a Clientes'}
              {!solicitud.csr_nombre && !solicitud.cxc_nombre && <br />}
              {!solicitud.cxc_nombre && '• Falta asignar ejecutivo de Cobranza'}
            </p>
          </div>
        )}

        {confirmed ? (
          <div className="flex items-center justify-center gap-3 p-4 bg-green-500/20 rounded-xl border border-green-500/30">
            <CheckCircle2 className="w-6 h-6 text-green-400" />
            <span className="text-green-300 font-bold">ALTA CONFIRMADA</span>
          </div>
        ) : (
          <button onClick={confirmarAlta} disabled={confirming || !solicitud.csr_nombre || !solicitud.cxc_nombre} className="w-full py-4 rounded-xl flex items-center justify-center gap-3 font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed" style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' }}>
            {confirming ? <><Loader2 className="w-5 h-5 animate-spin" /><span>Confirmando...</span></> : <><Send className="w-5 h-5" /><span>CONFIRMAR ALTA Y NOTIFICAR AL CLIENTE</span></>}
          </button>
        )}
      </div>
    </div>
  );
}

