// Componente de Confirmación de Alta - Para Nancy Alonso
// Muestra claramente: Empresa que paga → Empresa que cobra
// Permite descargar docs y confirmar el alta
// Ubicación: src/components/fx27/ConfirmarAltaNancy.tsx

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Download, CheckCircle2, Loader2, FileText, Building2, 
  CreditCard, User, Calendar, DollarSign, Send, AlertCircle,
  Briefcase, Phone, Mail
} from 'lucide-react';

const supabaseUrl = 'https://fbxbsslhewchyibdoyzk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieGJzc2xoZXdjaHlpYmRveXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzczODEsImV4cCI6MjA3ODExMzM4MX0.Z8JPlg7hhKbA624QGHp2bKKTNtCD3WInQMO5twjl6a0';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Mapeo de empresas
const EMPRESAS = {
  'TROB': { nombre: 'TROB Transportes', razonSocial: 'TROB TRANSPORTES SA DE CV', color: '#001f4d' },
  'WE': { nombre: 'WExpress', razonSocial: 'WEXPRESS LOGISTICS SA DE CV', color: '#059669' },
  'SHI': { nombre: 'Speedyhaul', razonSocial: 'SPEEDYHAUL SA DE CV', color: '#7c3aed' },
  'TROB_USA': { nombre: 'TROB USA', razonSocial: 'TROB TRANSPORTES USA LLC', color: '#dc2626' }
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

  useEffect(() => {
    cargarSolicitud();
  }, [solicitudId]);

  const cargarSolicitud = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('alta_clientes')
        .select('*')
        .eq('id', solicitudId)
        .single();

      if (error) throw error;
      setSolicitud(data);
      setConfirmed(data.estatus === 'COMPLETADA');
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Descargar todos los documentos
  const descargarDocumentos = async () => {
    setDownloading(true);
    try {
      // Listar archivos de la solicitud
      const { data: files, error } = await supabase.storage
        .from('alta-documentos')
        .list(solicitudId);

      if (error) throw error;

      // Descargar cada archivo
      for (const file of files || []) {
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('alta-documentos')
          .download(`${solicitudId}/${file.name}`);

        if (downloadError) continue;

        // Crear link de descarga
        const url = URL.createObjectURL(fileData);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${solicitud.razon_social}_${file.name}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Pequeña pausa entre descargas
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      alert('Documentos descargados');
    } catch (err) {
      console.error('Error descargando:', err);
      alert('Error al descargar documentos');
    } finally {
      setDownloading(false);
    }
  };

  // Descargar PDF de solicitud
  const descargarPDF = async () => {
    if (!solicitud.pdf_solicitud) {
      alert('PDF no generado aún');
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from('alta-documentos')
        .download(solicitud.pdf_solicitud);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Solicitud_${solicitud.razon_social}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error:', err);
      alert('Error al descargar PDF');
    }
  };

  // Confirmar alta
  const confirmarAlta = async () => {
    setConfirming(true);
    try {
      // Actualizar estatus
      await supabase
        .from('alta_clientes')
        .update({
          estatus: 'COMPLETADA',
          fecha_alta_completada: new Date().toISOString(),
          confirmado_por: 'Nancy Alonso'
        })
        .eq('id', solicitudId);

      // Enviar correo de confirmación al cliente
      await fetch(`${supabaseUrl}/functions/v1/enviar-correo-alta`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify({
          tipo: 'alta_confirmada',
          solicitudId,
          destinatarios: solicitud.correo_cliente?.split(',').map((e: string) => e.trim()),
          razonSocial: solicitud.razon_social,
          empresaFacturadora: EMPRESAS[solicitud.empresa_facturadora as keyof typeof EMPRESAS]?.nombre || solicitud.empresa_facturadora,
          tipoCredito: solicitud.tipo_credito,
          diasCredito: solicitud.dias_credito,
          ejecutivoServicio: {
            nombre: solicitud.ejecutivo_servicio_nombre,
            email: solicitud.ejecutivo_servicio_email,
            telefono: solicitud.ejecutivo_servicio_tel
          },
          ejecutivoCobranza: {
            nombre: solicitud.ejecutivo_cobranza_nombre,
            telefono: solicitud.ejecutivo_cobranza_tel
          }
        })
      });

      setConfirmed(true);
      alert('Alta confirmada. Se envió correo al cliente.');
      onConfirmed?.();

    } catch (err) {
      console.error('Error:', err);
      alert('Error al confirmar');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!solicitud) {
    return (
      <div className="text-center p-12 text-white/50">
        Solicitud no encontrada
      </div>
    );
  }

  const empresaInfo = EMPRESAS[solicitud.empresa_facturadora as keyof typeof EMPRESAS];

  return (
    <div className="space-y-6">
      {/* ═══════════════════════════════════════════════════════════════════════════
          PANEL PRINCIPAL: QUIÉN PAGA → A QUIÉN
          ═══════════════════════════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-r from-blue-500/20 to-orange-500/20 rounded-2xl border-2 border-blue-500/30 p-6">
        <h2 className="text-center text-sm font-bold text-white/50 mb-4">💰 INFORMACIÓN DE FACTURACIÓN</h2>
        
        <div className="grid grid-cols-3 gap-4 items-center">
          {/* Empresa que paga */}
          <div className="text-center p-4 bg-blue-500/20 rounded-xl border border-blue-500/40">
            <div className="w-12 h-12 bg-blue-500/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <Building2 className="w-6 h-6 text-blue-400" />
            </div>
            <span className="text-xs text-blue-300/70 block mb-1">CLIENTE PAGA</span>
            <span className="text-lg font-bold text-blue-300">{solicitud.razon_social}</span>
            <span className="text-xs text-blue-300/60 block mt-1">{solicitud.rfc_mc}</span>
          </div>

          {/* Flecha */}
          <div className="text-center">
            <div className="text-4xl">→</div>
            <span className="text-xs text-white/40 block mt-2">factura</span>
          </div>

          {/* Empresa que cobra */}
          <div className="text-center p-4 bg-orange-500/20 rounded-xl border border-orange-500/40">
            <div className="w-12 h-12 bg-orange-500/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <Briefcase className="w-6 h-6 text-orange-400" />
            </div>
            <span className="text-xs text-orange-300/70 block mb-1">FACTURAR A</span>
            <span className="text-lg font-bold text-orange-300">
              {empresaInfo?.nombre || solicitud.empresa_facturadora}
            </span>
            <span className="text-xs text-orange-300/60 block mt-1">
              {empresaInfo?.razonSocial}
            </span>
          </div>
        </div>

        {/* Tipo de crédito */}
        <div className="mt-6 flex justify-center gap-8">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            <span className="text-white/60">Tipo:</span>
            <span className={`font-bold ${solicitud.tipo_credito === 'CREDITO' ? 'text-green-400' : 'text-blue-400'}`}>
              {solicitud.tipo_credito || 'Prepago'}
            </span>
          </div>
          
          {solicitud.tipo_credito === 'CREDITO' && solicitud.dias_credito && (
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-400" />
              <span className="text-white/60">Días:</span>
              <span className="font-bold text-green-400">{solicitud.dias_credito}</span>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════
          EJECUTIVOS ASIGNADOS
          ═══════════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 gap-4">
        {/* CSR */}
        <div className="bg-[#0a1628]/95 rounded-xl border border-white/10 p-5">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-white">Servicio a Clientes</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-white/50 w-16">Nombre:</span>
              <span className="text-white font-medium">{solicitud.ejecutivo_servicio_nombre || '-'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-white/30" />
              <span className="text-white/70">{solicitud.ejecutivo_servicio_email || '-'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-white/30" />
              <span className="text-white/70">{solicitud.ejecutivo_servicio_tel || '-'}</span>
            </div>
          </div>
        </div>

        {/* Cobranza */}
        <div className="bg-[#0a1628]/95 rounded-xl border border-white/10 p-5">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-green-400" />
            <h3 className="font-bold text-white">Cobranza</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-white/50 w-16">Nombre:</span>
              <span className="text-white font-medium">{solicitud.ejecutivo_cobranza_nombre || '-'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-white/30" />
              <span className="text-white/70">{solicitud.ejecutivo_cobranza_tel || '-'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════
          ACCIONES
          ═══════════════════════════════════════════════════════════════════════════ */}
      <div className="bg-[#0a1628]/95 rounded-xl border border-white/10 p-6">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-orange-400" />
          Documentos y Acciones
        </h3>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* Descargar todos los docs */}
          <button
            onClick={descargarDocumentos}
            disabled={downloading}
            className="p-4 rounded-xl bg-blue-500/20 border border-blue-500/30 hover:bg-blue-500/30 transition-all flex flex-col items-center gap-2"
          >
            {downloading ? (
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            ) : (
              <Download className="w-6 h-6 text-blue-400" />
            )}
            <span className="text-sm text-blue-300">Descargar Documentos</span>
          </button>

          {/* Descargar PDF */}
          <button
            onClick={descargarPDF}
            className="p-4 rounded-xl bg-purple-500/20 border border-purple-500/30 hover:bg-purple-500/30 transition-all flex flex-col items-center gap-2"
          >
            <FileText className="w-6 h-6 text-purple-400" />
            <span className="text-sm text-purple-300">Ver Solicitud PDF</span>
          </button>

          {/* Ver análisis de riesgo */}
          {solicitud.calificacion_riesgo && (
            <div className={`p-4 rounded-xl flex flex-col items-center gap-2 ${
              solicitud.calificacion_riesgo === 'BAJO' ? 'bg-green-500/20 border border-green-500/30' :
              solicitud.calificacion_riesgo === 'MEDIO' ? 'bg-yellow-500/20 border border-yellow-500/30' :
              'bg-red-500/20 border border-red-500/30'
            }`}>
              <AlertCircle className={`w-6 h-6 ${
                solicitud.calificacion_riesgo === 'BAJO' ? 'text-green-400' :
                solicitud.calificacion_riesgo === 'MEDIO' ? 'text-yellow-400' :
                'text-red-400'
              }`} />
              <span className={`text-sm ${
                solicitud.calificacion_riesgo === 'BAJO' ? 'text-green-300' :
                solicitud.calificacion_riesgo === 'MEDIO' ? 'text-yellow-300' :
                'text-red-300'
              }`}>
                Riesgo: {solicitud.calificacion_riesgo}
              </span>
            </div>
          )}
        </div>

        {/* Botón confirmar */}
        {confirmed ? (
          <div className="flex items-center justify-center gap-3 p-4 bg-green-500/20 rounded-xl border border-green-500/30">
            <CheckCircle2 className="w-6 h-6 text-green-400" />
            <span className="text-green-300 font-bold">ALTA CONFIRMADA</span>
          </div>
        ) : (
          <button
            onClick={confirmarAlta}
            disabled={confirming}
            className="w-full py-4 rounded-xl flex items-center justify-center gap-3 font-bold text-white disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' }}
          >
            {confirming ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Confirmando...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>CONFIRMAR ALTA Y NOTIFICAR AL CLIENTE</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
