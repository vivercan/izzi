// ═══════════════════════════════════════════════════════════════════════════
// ASIGNAR CXC PÚBLICO - Página sin login para Claudia/Martha
// URL: /asignar-cxc/{solicitudId}
// El link se usa una vez y expira al asignar
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Wallet, Send, CheckCircle2, Loader2, ChevronDown, UserCheck, Building2, CreditCard, AlertCircle } from 'lucide-react';

const supabaseUrl = 'https://fbxbsslhewchyibdoyzk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieGJzc2xoZXdjaHlpYmRveXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzczODEsImV4cCI6MjA3ODExMzM4MX0.Z8JPlg7hhKbA624QGHp2bKKTNtCD3WInQMO5twjl6a0';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface AsignarCxCPublicoProps {
  solicitudId: string;
}

interface CxC {
  id: string;
  nombre: string;
  email: string;
  celular?: string;
  telefono?: string;
}

export function AsignarCxCPublico({ solicitudId }: AsignarCxCPublicoProps) {
  const [loading, setLoading] = useState(true);
  const [solicitud, setSolicitud] = useState<any>(null);
  const [cxcList, setCxcList] = useState<CxC[]>([]);
  const [selectedCxC, setSelectedCxC] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string>('');
  const [assignedName, setAssignedName] = useState('');

  useEffect(() => {
    loadData();
  }, [solicitudId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Cargar solicitud
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

      // Verificar que no esté ya asignado el CxC
      if (sol.cxc_nombre) {
        setDone(true);
        setAssignedName(sol.cxc_nombre);
        setSolicitud(sol);
        setLoading(false);
        return;
      }

      setSolicitud(sol);

      // Cargar catálogo CxC
      const { data: cxcs } = await supabase
        .from('catalogo_cxc')
        .select('*')
        .eq('activo', true)
        .order('nombre');

      setCxcList(cxcs || []);
    } catch (err) {
      setError('Error al cargar los datos. Intente nuevamente.');
    }
    setLoading(false);
  };

  const handleAsignar = async () => {
    if (!selectedCxC || !solicitud) return;
    setSubmitting(true);

    const cxcData = cxcList.find(c => c.id === selectedCxC);
    if (!cxcData) {
      setSubmitting(false);
      return;
    }

    try {
      // Guardar CxC
      const { data: updated, error: updateError } = await supabase
        .from('alta_clientes')
        .update({
          cxc_id: cxcData.id,
          cxc_nombre: cxcData.nombre,
          cxc_email: cxcData.email,
          cxc_celular: cxcData.celular || cxcData.telefono,
          cxc_telefono: cxcData.telefono || cxcData.celular,
          cxc_asignado_por: 'Gerencia CxC (link público)',
          cxc_asignado_fecha: new Date().toISOString(),
        })
        .eq('id', solicitud.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Evaluar si AMBOS tracks están completos
      if (updated.csr_nombre && updated.tipo_pago) {
        // CSR ya fue asignado → transicionar a PENDIENTE_CONFIRMACION
        await supabase.from('alta_clientes')
          .update({ estatus: 'PENDIENTE_CONFIRMACION' })
          .eq('id', solicitud.id);

        // Notificar a Nancy
        await fetch(`${supabaseUrl}/functions/v1/enviar-correo-alta`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKey}`
          },
          body: JSON.stringify({
            tipo: 'pendiente_confirmacion',
            solicitudId: solicitud.id,
            razonSocial: solicitud.razon_social,
            rfc: solicitud.rfc_mc || solicitud.rfc,
            nombreContacto: solicitud.nombre_cliente,
            emailCliente: solicitud.email_cliente,
            empresaFacturadora: solicitud.giro || solicitud.empresa_facturadora,
            csrNombre: updated.csr_nombre,
            csrEmail: updated.csr_email,
            csrTelefono: updated.csr_celular || updated.csr_telefono,
            cxcNombre: cxcData.nombre,
            cxcEmail: cxcData.email,
            cxcTelefono: cxcData.telefono || cxcData.celular,
            tipoPago: updated.tipo_pago,
            diasCredito: updated.dias_credito
          })
        }).catch(() => {});
      }

      setDone(true);
      setAssignedName(cxcData.nombre);

    } catch (err) {
      console.error('Error:', err);
      setError('Error al asignar. Intente nuevamente.');
    }
    setSubmitting(false);
  };

  const cxcSeleccionado = cxcList.find(c => c.id === selectedCxC);

  // ═══════════════════════════════════════════════════════════════════════════
  // ESTILOS
  // ═══════════════════════════════════════════════════════════════════════════
  const bgStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a1628 0%, #1a2d4a 50%, #0a4a8a 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    fontFamily: "'Exo 2', sans-serif",
  };

  const cardStyle = {
    background: 'rgba(15, 23, 42, 0.85)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(100, 130, 170, 0.3)',
    borderRadius: '16px',
    padding: '32px',
    maxWidth: '520px',
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
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
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
  // DONE - Ya se asignó
  // ═══════════════════════════════════════════════════════════════════════════
  if (done) {
    return (
      <div style={bgStyle}>
        <div style={cardStyle} className="text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Ejecutivo CxC Asignado</h2>
          <p className="text-white/60 mb-6">
            <span className="text-blue-400 font-semibold">{assignedName}</span> fue asignado como ejecutivo de cobranza para{' '}
            <span className="text-white font-semibold">{solicitud?.razon_social}</span>
          </p>
          {solicitud?.csr_nombre && solicitud?.tipo_pago && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
              <p className="text-green-300 text-sm">
                ✅ CSR y CxC asignados. Nancy Alonso fue notificada para confirmar el alta.
              </p>
            </div>
          )}
          {(!solicitud?.csr_nombre || !solicitud?.tipo_pago) && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
              <p className="text-yellow-300 text-sm">
                ⏳ CxC asignado. Falta que Juan Viveros asigne CSR y tipo de pago.
              </p>
            </div>
          )}
          <p className="text-white/30 text-xs mt-6">Este enlace ya no es válido. Puede cerrar esta ventana.</p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FORMULARIO - Seleccionar ejecutivo
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div style={bgStyle}>
      <div style={cardStyle}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Asignar Ejecutivo CxC</h1>
            <p className="text-white/40 text-xs">Selecciona el ejecutivo de cobranza</p>
          </div>
        </div>

        {/* Info del cliente */}
        <div className="space-y-3 mb-6">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-4 h-4 text-orange-400" />
              <span className="text-white/50 text-xs">Razón Social</span>
            </div>
            <p className="text-white font-semibold text-lg">{solicitud.razon_social}</p>
            <p className="text-blue-400 text-sm font-mono mt-1">{solicitud.rfc_mc || solicitud.rfc || '—'}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Tipo de pago */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <div className="flex items-center gap-1 mb-1">
                <CreditCard className="w-3 h-3 text-white/40" />
                <span className="text-white/50 text-[10px]">Tipo de Pago</span>
              </div>
              {solicitud.tipo_pago ? (
                <p className={`text-sm font-semibold ${solicitud.tipo_pago === 'CREDITO' ? 'text-green-400' : 'text-orange-400'}`}>
                  {solicitud.tipo_pago === 'CREDITO' ? `Crédito ${solicitud.dias_credito || ''}d` : 'Prepago'}
                </p>
              ) : (
                <p className="text-yellow-400 text-sm">Pendiente</p>
              )}
            </div>

            {/* CSR asignado */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <div className="flex items-center gap-1 mb-1">
                <UserCheck className="w-3 h-3 text-white/40" />
                <span className="text-white/50 text-[10px]">CSR Asignado</span>
              </div>
              {solicitud.csr_nombre ? (
                <p className="text-green-400 text-sm font-semibold">{solicitud.csr_nombre}</p>
              ) : (
                <p className="text-yellow-400 text-sm">Pendiente</p>
              )}
            </div>
          </div>

          {/* Empresa facturadora */}
          {(solicitud.empresa_facturadora || solicitud.giro) && (
            <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-3">
              <span className="text-orange-400 text-[10px]">Empresa Facturadora</span>
              <p className="text-white text-sm">{solicitud.empresa_facturadora || solicitud.giro}</p>
            </div>
          )}
        </div>

        {/* Selector de CxC */}
        <div className="mb-6">
          <label className="text-white/60 text-xs mb-2 block font-medium">
            Ejecutivo de Cobranza (CxC) *
          </label>
          <div className="relative">
            <select
              value={selectedCxC}
              onChange={(e) => setSelectedCxC(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white text-sm appearance-none focus:border-blue-500 focus:outline-none transition-all"
              style={{ background: 'rgba(15, 23, 42, 0.9)' }}
            >
              <option value="" style={{ background: '#0f172a' }}>— Seleccionar ejecutivo —</option>
              {cxcList.map((cxc) => (
                <option key={cxc.id} value={cxc.id} style={{ background: '#0f172a' }}>
                  {cxc.nombre}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          </div>
          {cxcSeleccionado && (
            <div className="mt-2 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <p className="text-blue-300 text-sm font-medium">{cxcSeleccionado.nombre}</p>
              <p className="text-blue-400/70 text-xs mt-1">
                📧 {cxcSeleccionado.email} &nbsp;|&nbsp; 📱 {cxcSeleccionado.telefono || cxcSeleccionado.celular}
              </p>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Botón */}
        <button
          onClick={handleAsignar}
          disabled={!selectedCxC || submitting}
          className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2 text-white font-semibold transition-all disabled:opacity-40"
          style={{
            background: selectedCxC
              ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
              : 'rgba(255,255,255,0.1)',
            boxShadow: selectedCxC ? '0 4px 20px rgba(59, 130, 246, 0.3)' : 'none',
          }}
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Asignando...</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>Asignar Ejecutivo CxC</span>
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

export default AsignarCxCPublico;
