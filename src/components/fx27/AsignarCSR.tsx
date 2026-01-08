import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { UserCheck, CreditCard, Clock, Send, CheckCircle2, AlertCircle, Loader2, ChevronDown, Building2, Phone, Mail, User } from 'lucide-react';

const supabaseUrl = 'https://fbxbsslhewchyibdoyzk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieGJzc2xoZXdjaHlpYmRveXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzczODEsImV4cCI6MjA3ODExMzM4MX0.Z8JPlg7hhKbA624QGHp2bKKTNtCD3WInQMO5twjl6a0';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface CSR {
  id: string;
  nombre: string;
  email: string;
  celular: string;
}

interface Solicitud {
  id: string;
  razon_social: string;
  rfc: string;
  representante_legal: string;
  email_cliente: string;
  giro: string;
  whatsapp: string;
  contacto_admin_nombre: string;
  contacto_admin_email: string;
  contacto_admin_tel: string;
  estatus: string;
  created_at: string;
}

export function AsignarCSR() {
  const [loading, setLoading] = useState(true);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [csrList, setCsrList] = useState<CSR[]>([]);
  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null);
  const [selectedCSR, setSelectedCSR] = useState<string>('');
  const [tipoPago, setTipoPago] = useState<'PREPAGO' | 'CREDITO'>('CREDITO');
  const [diasCredito, setDiasCredito] = useState<number>(30);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Obtener solicitudes pendientes de CSR
      const { data: sols, error: solError } = await supabase
        .from('alta_clientes')
        .select('*')
        .eq('estatus', 'PENDIENTE_CSR')
        .order('created_at', { ascending: false });

      if (solError) throw solError;
      setSolicitudes(sols || []);

      // Obtener catálogo CSR
      const { data: csrs, error: csrError } = await supabase
        .from('catalogo_csr')
        .select('*')
        .eq('activo', true);

      if (csrError) throw csrError;
      setCsrList(csrs || []);

    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAsignar = async () => {
    if (!selectedSolicitud || !selectedCSR) return;

    setSubmitting(true);
    try {
      const csrData = csrList.find(c => c.id === selectedCSR);
      if (!csrData) throw new Error('CSR no encontrado');

      // Actualizar solicitud
      const { error: updateError } = await supabase
        .from('alta_clientes')
        .update({
          csr_id: csrData.id,
          csr_nombre: csrData.nombre,
          csr_email: csrData.email,
          csr_celular: csrData.celular,
          tipo_pago: tipoPago,
          dias_credito: tipoPago === 'CREDITO' ? diasCredito : null,
          estatus: 'PENDIENTE_CXC',
          fecha_asignacion_csr: new Date().toISOString()
        })
        .eq('id', selectedSolicitud.id);

      if (updateError) throw updateError;

      // Enviar correos (al CSR y a Claudia Priana)
      await fetch(`${supabaseUrl}/functions/v1/enviar-correo-alta`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify({
          solicitudId: selectedSolicitud.id,
          tipo: 'csr_asignado'
        })
      });

      // Limpiar y refrescar
      setShowConfirm(false);
      setSelectedSolicitud(null);
      setSelectedCSR('');
      setTipoPago('CREDITO');
      setDiasCredito(30);
      fetchData();

    } catch (err) {
      console.error('Error asignando:', err);
      alert('Error al asignar CSR');
    } finally {
      setSubmitting(false);
    }
  };

  const csrSeleccionado = csrList.find(c => c.id === selectedCSR);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0a1628 0%, #1a2d4a 100%)' }}>
        <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ background: 'linear-gradient(135deg, #0a1628 0%, #1a2d4a 100%)' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3" style={{ fontFamily: "'Exo 2'" }}>
            <UserCheck className="w-8 h-8 text-orange-500" />
            Asignar CSR
          </h1>
          <p className="text-white/60 mt-2" style={{ fontFamily: "'Exo 2'" }}>
            Solicitudes pendientes de asignación de ejecutivo de servicio al cliente
          </p>
        </div>

        {solicitudes.length === 0 ? (
          <div className="bg-white/5 rounded-2xl border border-white/10 p-12 text-center">
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-400" />
            <h2 className="text-xl text-white font-semibold" style={{ fontFamily: "'Exo 2'" }}>
              No hay solicitudes pendientes
            </h2>
            <p className="text-white/50 mt-2" style={{ fontFamily: "'Exo 2'" }}>
              Todas las solicitudes han sido asignadas
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lista de solicitudes */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white/80 mb-4" style={{ fontFamily: "'Exo 2'" }}>
                📋 Solicitudes Pendientes ({solicitudes.length})
              </h2>
              {solicitudes.map((sol) => (
                <div
                  key={sol.id}
                  onClick={() => setSelectedSolicitud(sol)}
                  className={`p-5 rounded-xl cursor-pointer transition-all ${
                    selectedSolicitud?.id === sol.id
                      ? 'bg-orange-500/20 border-2 border-orange-500'
                      : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-white font-semibold text-lg" style={{ fontFamily: "'Exo 2'" }}>
                        {sol.razon_social || 'Sin razón social'}
                      </h3>
                      <p className="text-orange-400 font-mono text-sm mt-1">{sol.rfc || 'Sin RFC'}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-300">
                      Pendiente
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-white/60">
                      <User className="w-4 h-4" />
                      <span>{sol.representante_legal || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/60">
                      <Mail className="w-4 h-4" />
                      <span>{sol.email_cliente || 'N/A'}</span>
                    </div>
                  </div>
                  <p className="text-white/40 text-xs mt-3">
                    {new Date(sol.created_at).toLocaleDateString('es-MX', { 
                      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              ))}
            </div>

            {/* Panel de asignación */}
            <div className="bg-white/5 rounded-2xl border border-white/10 p-6 h-fit sticky top-6">
              {!selectedSolicitud ? (
                <div className="text-center py-12">
                  <Building2 className="w-16 h-16 mx-auto mb-4 text-white/20" />
                  <p className="text-white/40" style={{ fontFamily: "'Exo 2'" }}>
                    Selecciona una solicitud para asignar
                  </p>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-semibold text-white mb-6" style={{ fontFamily: "'Exo 2'" }}>
                    Asignar a: <span className="text-orange-400">{selectedSolicitud.razon_social}</span>
                  </h2>

                  {/* Datos del cliente */}
                  <div className="bg-black/20 rounded-xl p-4 mb-6">
                    <h3 className="text-sm font-semibold text-white/60 mb-3">DATOS DEL CLIENTE</h3>
                    <div className="space-y-2 text-sm">
                      <p className="text-white"><strong className="text-white/60">RFC:</strong> {selectedSolicitud.rfc}</p>
                      <p className="text-white"><strong className="text-white/60">Rep. Legal:</strong> {selectedSolicitud.representante_legal}</p>
                      <p className="text-white"><strong className="text-white/60">Email:</strong> {selectedSolicitud.email_cliente}</p>
                      <p className="text-white"><strong className="text-white/60">Contacto:</strong> {selectedSolicitud.contacto_admin_nombre} - {selectedSolicitud.contacto_admin_tel}</p>
                    </div>
                  </div>

                  {/* Seleccionar CSR */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-white/70 mb-2" style={{ fontFamily: "'Exo 2'" }}>
                      Ejecutivo de Servicio al Cliente (CSR) *
                    </label>
                    <div className="relative">
                      <select
                        value={selectedCSR}
                        onChange={(e) => setSelectedCSR(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white appearance-none cursor-pointer focus:border-orange-500 transition-colors"
                        style={{ fontFamily: "'Exo 2'" }}
                      >
                        <option value="" style={{ background: '#1a2d4a' }}>Seleccionar ejecutivo...</option>
                        {csrList.map((csr) => (
                          <option key={csr.id} value={csr.id} style={{ background: '#1a2d4a' }}>
                            {csr.nombre}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 pointer-events-none" />
                    </div>
                    {csrSeleccionado && (
                      <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <p className="text-green-300 text-sm font-medium">{csrSeleccionado.nombre}</p>
                        <p className="text-green-300/70 text-xs mt-1">{csrSeleccionado.email} | {csrSeleccionado.celular}</p>
                      </div>
                    )}
                  </div>

                  {/* Tipo de pago */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-white/70 mb-2" style={{ fontFamily: "'Exo 2'" }}>
                      Tipo de Pago *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setTipoPago('PREPAGO')}
                        className={`p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
                          tipoPago === 'PREPAGO'
                            ? 'border-orange-500 bg-orange-500/20 text-orange-300'
                            : 'border-white/20 bg-white/5 text-white/60 hover:bg-white/10'
                        }`}
                      >
                        <CreditCard className="w-5 h-5" />
                        <span style={{ fontFamily: "'Exo 2'" }}>Prepago</span>
                      </button>
                      <button
                        onClick={() => setTipoPago('CREDITO')}
                        className={`p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
                          tipoPago === 'CREDITO'
                            ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                            : 'border-white/20 bg-white/5 text-white/60 hover:bg-white/10'
                        }`}
                      >
                        <Clock className="w-5 h-5" />
                        <span style={{ fontFamily: "'Exo 2'" }}>Crédito</span>
                      </button>
                    </div>
                  </div>

                  {/* Días de crédito */}
                  {tipoPago === 'CREDITO' && (
                    <div className="mb-6">
                      <label className="block text-sm font-semibold text-white/70 mb-2" style={{ fontFamily: "'Exo 2'" }}>
                        Días de Crédito *
                      </label>
                      <input
                        type="number"
                        value={diasCredito}
                        onChange={(e) => setDiasCredito(parseInt(e.target.value) || 0)}
                        min="1"
                        max="120"
                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white text-center text-2xl font-bold focus:border-blue-500 transition-colors"
                        style={{ fontFamily: "'Exo 2'" }}
                      />
                      <div className="flex justify-center gap-2 mt-2">
                        {[15, 30, 45, 60, 90].map((d) => (
                          <button
                            key={d}
                            onClick={() => setDiasCredito(d)}
                            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                              diasCredito === d
                                ? 'bg-blue-500 text-white'
                                : 'bg-white/10 text-white/60 hover:bg-white/20'
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Botón enviar */}
                  <button
                    onClick={() => setShowConfirm(true)}
                    disabled={!selectedCSR || submitting}
                    className="w-full py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: 'linear-gradient(135deg, #fe5000 0%, #cc4000 100%)' }}
                  >
                    <Send className="w-5 h-5 text-white" />
                    <span className="text-white font-semibold text-lg" style={{ fontFamily: "'Exo 2'" }}>
                      Asignar y Enviar
                    </span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Modal de confirmación */}
        {showConfirm && selectedSolicitud && csrSeleccionado && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#0a1628] rounded-2xl border border-white/20 p-8 max-w-md w-full">
              <h3 className="text-xl font-semibold text-white mb-4" style={{ fontFamily: "'Exo 2'" }}>
                Confirmar Asignación
              </h3>
              <div className="bg-white/5 rounded-xl p-4 mb-6">
                <p className="text-white/60 text-sm mb-2">Cliente:</p>
                <p className="text-white font-semibold">{selectedSolicitud.razon_social}</p>
                <p className="text-white/60 text-sm mt-4 mb-2">Ejecutivo CSR:</p>
                <p className="text-green-400 font-semibold">{csrSeleccionado.nombre}</p>
                <p className="text-white/60 text-sm mt-4 mb-2">Condiciones de pago:</p>
                <p className="text-blue-400 font-semibold">
                  {tipoPago === 'PREPAGO' ? 'Prepago' : `Crédito - ${diasCredito} días`}
                </p>
              </div>
              <p className="text-white/60 text-sm mb-6">
                Se enviará correo a <strong className="text-white">{csrSeleccionado.nombre}</strong> y a <strong className="text-white">Claudia Priana</strong> para continuar el proceso.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition-colors"
                  style={{ fontFamily: "'Exo 2'" }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAsignar}
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #fe5000 0%, #cc4000 100%)', fontFamily: "'Exo 2'" }}
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  )}
                  <span className="text-white font-semibold">Confirmar</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
