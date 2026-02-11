// ═══════════════════════════════════════════════════════════════════════════
// CONFIRMAR ALTA PÚBLICO - Página sin login para Nancy Alonso
// URL: /confirmar-alta/{solicitudId}
// El link se usa una vez y expira al confirmar
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { CheckCircle2, Loader2, AlertCircle, Building2, CreditCard, UserCheck, Wallet, ShieldCheck, Send } from 'lucide-react';

const supabaseUrl = 'https://fbxbsslhewchyibdoyzk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieGJzc2xoZXdjaHlpYmRveXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzczODEsImV4cCI6MjA3ODExMzM4MX0.Z8JPlg7hhKbA624QGHp2bKKTNtCD3WInQMO5twjl6a0';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface ConfirmarAltaPublicoProps {
  solicitudId: string;
}

export function ConfirmarAltaPublico({ solicitudId }: ConfirmarAltaPublicoProps) {
  const [loading, setLoading] = useState(true);
  const [solicitud, setSolicitud] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [solicitudId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: sol, error: solErr } = await supabase
        .from('alta_clientes')
        .select('*')
        .eq('id', solicitudId)
        .single();

      if (solErr || !sol) {
        setError('Solicitud no encontrada. El enlace puede ser inválido.');
        setLoading(false);
        return;
      }

      // Ya está confirmada
      if (sol.estatus === 'ALTA_COMPLETADA' || sol.estatus === 'COMPLETADA') {
        setDone(true);
        setSolicitud(sol);
        setLoading(false);
        return;
      }

      setSolicitud(sol);
    } catch (err) {
      setError('Error al cargar los datos. Intente nuevamente.');
    }
    setLoading(false);
  };

  const handleConfirmar = async () => {
    if (!solicitud) return;
    setSubmitting(true);

    try {
      // Actualizar estatus a ALTA_COMPLETADA
      const { error: updateError } = await supabase
        .from('alta_clientes')
        .update({
          estatus: 'ALTA_COMPLETADA',
          confirmado_por: 'Nancy Alonso (link público)',
          confirmado_fecha: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', solicitud.id);

      if (updateError) throw updateError;

      // Enviar correos de alta completada
      await fetch(`${supabaseUrl}/functions/v1/enviar-correo-alta`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify({
          tipo: 'alta_completada',
          solicitudId: solicitud.id,
          razonSocial: solicitud.razon_social,
          rfc: solicitud.rfc_mc || solicitud.rfc,
          nombreContacto: solicitud.nombre_cliente,
          emailCliente: solicitud.email_cliente,
          empresaFacturadora: solicitud.empresa_facturadora || solicitud.giro,
          csrNombre: solicitud.csr_nombre,
          csrEmail: solicitud.csr_email,
          csrTelefono: solicitud.csr_celular || solicitud.csr_telefono,
          cxcNombre: solicitud.cxc_nombre,
          cxcEmail: solicitud.cxc_email,
          cxcTelefono: solicitud.cxc_telefono || solicitud.cxc_celular,
          tipoPago: solicitud.tipo_pago,
          diasCredito: solicitud.dias_credito,
          creadoPorEmail: solicitud.creado_por_email
        })
      }).catch(() => {});

      setDone(true);
    } catch (err) {
      console.error('Error:', err);
      setError('Error al confirmar. Intente nuevamente.');
    }
    setSubmitting(false);
  };

  const tipoPagoLabel = solicitud?.tipo_pago === 'CREDITO'
    ? `Crédito a ${solicitud?.dias_credito || 30} días`
    : solicitud?.tipo_pago === 'PREPAGO' ? 'Prepago' : 'No definido';

  // ═══════════════════════════════════════════════════════════════════════════
  // ESTILOS
  // ═══════════════════════════════════════════════════════════════════════════
  const bgStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a1628 0%, #1a2d4a 50%, #0a4a8a 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    fontFamily: "'Exo 2', sans-serif",
  };

  const cardStyle: React.CSSProperties = {
    background: 'rgba(15, 23, 42, 0.85)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(100, 130, 170, 0.3)',
    borderRadius: '16px',
    padding: '32px',
    maxWidth: '560px',
    width: '100%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // LOADING
  // ═══════════════════════════════════════════════════════════════════════════
  if (loading) {
    return (
      <div style={bgStyle}>
        <div style={cardStyle} className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-500 mx-auto mb-4" />
          <p className="text-white/60">Cargando solicitud...</p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ERROR
  // ═══════════════════════════════════════════════════════════════════════════
  if (error && !solicitud) {
    return (
      <div style={bgStyle}>
        <div style={cardStyle} className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Enlace inválido</h2>
          <p className="text-white/60">{error}</p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DONE - Ya se confirmó
  // ═══════════════════════════════════════════════════════════════════════════
  if (done) {
    return (
      <div style={bgStyle}>
        <div style={cardStyle} className="text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Alta Confirmada</h2>
          <p className="text-white/60 mb-6">
            El alta de <span className="text-white font-semibold">{solicitud?.razon_social}</span> ha sido confirmada exitosamente.
          </p>
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
            <p className="text-green-300 text-sm">
              ✅ Se envió correo de bienvenida al cliente con el directorio de contactos.
            </p>
          </div>
          <p className="text-white/30 text-xs mt-6">Este enlace ya no es válido. Puede cerrar esta ventana.</p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FORMULARIO - Confirmar alta
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div style={bgStyle}>
      <div style={cardStyle}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Confirmar Alta de Cliente</h1>
            <p className="text-white/40 text-xs">Revisa la información y confirma el alta</p>
          </div>
        </div>

        {/* Info del cliente */}
        <div className="space-y-3 mb-6">
          {/* Razón Social */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-4 h-4 text-orange-400" />
              <span className="text-white/50 text-xs">Razón Social</span>
            </div>
            <p className="text-white font-semibold text-lg">{solicitud.razon_social}</p>
            <p className="text-blue-400 text-sm font-mono mt-1">{solicitud.rfc_mc || solicitud.rfc || '—'}</p>
          </div>

          {/* CSR y CxC */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <div className="flex items-center gap-1 mb-1">
                <UserCheck className="w-3 h-3 text-purple-400" />
                <span className="text-white/50 text-[10px]">CSR Asignado</span>
              </div>
              <p className="text-purple-400 text-sm font-semibold">{solicitud.csr_nombre || 'Pendiente'}</p>
              {solicitud.csr_email && <p className="text-white/30 text-[10px] mt-0.5">{solicitud.csr_email}</p>}
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <div className="flex items-center gap-1 mb-1">
                <Wallet className="w-3 h-3 text-green-400" />
                <span className="text-white/50 text-[10px]">CxC Asignado</span>
              </div>
              <p className="text-green-400 text-sm font-semibold">{solicitud.cxc_nombre || 'Pendiente'}</p>
              {solicitud.cxc_email && <p className="text-white/30 text-[10px] mt-0.5">{solicitud.cxc_email}</p>}
            </div>
          </div>

          {/* Tipo de pago */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <div className="flex items-center gap-1 mb-1">
              <CreditCard className="w-3 h-3 text-white/40" />
              <span className="text-white/50 text-[10px]">Condiciones de Pago</span>
            </div>
            <p className={`text-sm font-semibold ${solicitud.tipo_pago === 'CREDITO' ? 'text-green-400' : 'text-blue-400'}`}>
              {tipoPagoLabel}
            </p>
          </div>

          {/* Empresa facturadora */}
          {(solicitud.empresa_facturadora || solicitud.giro) && (
            <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-3">
              <span className="text-orange-400 text-[10px]">Empresa Facturadora</span>
              <p className="text-white text-sm">{solicitud.empresa_facturadora || solicitud.giro}</p>
            </div>
          )}

          {/* Contacto del cliente */}
          {solicitud.email_cliente && (
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3">
              <span className="text-blue-400 text-[10px]">Contacto del Cliente</span>
              <p className="text-white text-sm">{solicitud.nombre_cliente || '—'}</p>
              <p className="text-white/40 text-xs">{solicitud.email_cliente} {solicitud.telefono_cliente ? `| ${solicitud.telefono_cliente}` : ''}</p>
            </div>
          )}
        </div>

        {/* Aviso */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 mb-6">
          <p className="text-yellow-300 text-xs">
            ⚠️ Al confirmar, se enviará automáticamente un correo de bienvenida al cliente con su directorio de contactos.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Botón Confirmar */}
        <button
          onClick={handleConfirmar}
          disabled={submitting}
          className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2 text-white font-semibold transition-all disabled:opacity-40"
          style={{
            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            boxShadow: '0 4px 20px rgba(34, 197, 94, 0.3)',
          }}
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Confirmando...</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>Confirmar Alta</span>
            </>
          )}
        </button>

        {/* Footer */}
        <p className="text-center text-white/20 text-[10px] mt-6">
          Grupo Loma Transportes · Sistema FX27 · Alta de Clientes
        </p>
      </div>
    </div>
  );
}

export default ConfirmarAltaPublico;
