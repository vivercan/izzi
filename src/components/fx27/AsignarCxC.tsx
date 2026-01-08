import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Wallet, Send, CheckCircle2, Loader2, ChevronDown, Building2, Phone, Mail, User, UserCheck } from 'lucide-react';

const supabaseUrl = 'https://fbxbsslhewchyibdoyzk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieGJzc2xoZXdjaHlpYmRveXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzczODEsImV4cCI6MjA3ODExMzM4MX0.Z8JPlg7hhKbA624QGHp2bKKTNtCD3WInQMO5twjl6a0';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface CxC {
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
  csr_nombre: string;
  csr_email: string;
  tipo_pago: string;
  dias_credito: number;
  estatus: string;
  created_at: string;
}

export function AsignarCxC() {
  const [loading, setLoading] = useState(true);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [cxcList, setCxcList] = useState<CxC[]>([]);
  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null);
  const [selectedCxC, setSelectedCxC] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Obtener solicitudes pendientes de CxC
      const { data: sols, error: solError } = await supabase
        .from('alta_clientes')
        .select('*')
        .eq('estatus', 'PENDIENTE_CXC')
        .order('created_at', { ascending: false });

      if (solError) throw solError;
      setSolicitudes(sols || []);

      // Obtener catálogo CxC
      const { data: cxcs, error: cxcError } = await supabase
        .from('catalogo_cxc')
        .select('*')
        .eq('activo', true);

      if (cxcError) throw cxcError;
      setCxcList(cxcs || []);

    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAsignar = async () => {
    if (!selectedSolicitud || !selectedCxC) return;

    setSubmitting(true);
    try {
      const cxcData = cxcList.find(c => c.id === selectedCxC);
      if (!cxcData) throw new Error('CxC no encontrado');

      // Actualizar solicitud
      const { error: updateError } = await supabase
        .from('alta_clientes')
        .update({
          cxc_id: cxcData.id,
          cxc_nombre: cxcData.nombre,
          cxc_email: cxcData.email,
          cxc_celular: cxcData.celular,
          estatus: 'PENDIENTE_CONFIRMACION',
          fecha_asignacion_cxc: new Date().toISOString()
        })
        .eq('id', selectedSolicitud.id);

      if (updateError) throw updateError;

      // Enviar correo a Nancy Alonso
      await fetch(`${supabaseUrl}/functions/v1/enviar-correo-alta`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify({
          solicitudId: selectedSolicitud.id,
          tipo: 'pendiente_confirmacion'
        })
      });

      // Limpiar y refrescar
      setShowConfirm(false);
      setSelectedSolicitud(null);
      setSelectedCxC('');
      fetchData();

    } catch (err) {
      console.error('Error asignando:', err);
      alert('Error al asignar CxC');
    } finally {
      setSubmitting(false);
    }
  };

  const cxcSeleccionado = cxcList.find(c => c.id === selectedCxC);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0a1628 0%, #1a2d4a 100%)' }}>
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ background: 'linear-gradient(135deg, #0a1628 0%, #1a2d4a 100%)' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3" style={{ fontFamily: "'Exo 2'" }}>
            <Wallet className="w-8 h-8 text-blue-500" />
            Asignar Ejecutivo de Cobranza
          </h1>
          <p className="text-white/60 mt-2" style={{ fontFamily: "'Exo 2'" }}>
            Solicitudes pendientes de asignación de ejecutivo CxC
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
                📋 Pendientes de CxC ({solicitudes.length})
              </h2>
              {solicitudes.map((sol) => (
                <div
                  key={sol.id}
                  onClick={() => setSelectedSolicitud(sol)}
                  className={`p-5 rounded-xl cursor-pointer transition-all ${
                    selectedSolicitud?.id === sol.id
                      ? 'bg-blue-500/20 border-2 border-blue-500'
                      : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-white font-semibold text-lg" style={{ fontFamily: "'Exo 2'" }}>
                        {sol.razon_social || 'Sin razón social'}
                      </h3>
                      <p className="text-blue-400 font-mono text-sm mt-1">{sol.rfc || 'Sin RFC'}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      sol.tipo_pago === 'PREPAGO' 
                        ? 'bg-orange-500/20 text-orange-300' 
                        : 'bg-blue-500/20 text-blue-300'
                    }`}>
                      {sol.tipo_pago === 'PREPAGO' ? 'Prepago' : `Crédito ${sol.dias_credito}d`}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm text-white/60">
                    <UserCheck className="w-4 h-4 text-green-400" />
                    <span>CSR: {sol.csr_nombre}</span>
                  </div>
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
                    Asignar a: <span className="text-blue-400">{selectedSolicitud.razon_social}</span>
                  </h2>

                  {/* Datos del cliente */}
                  <div className="bg-black/20 rounded-xl p-4 mb-4">
                    <h3 className="text-sm font-semibold text-white/60 mb-3">DATOS DEL CLIENTE</h3>
                    <div className="space-y-2 text-sm">
                      <p className="text-white"><strong className="text-white/60">RFC:</strong> {selectedSolicitud.rfc}</p>
                      <p className="text-white"><strong className="text-white/60">Email:</strong> {selectedSolicitud.email_cliente}</p>
                      <p className="text-white">
                        <strong className="text-white/60">Pago:</strong>{' '}
                        <span className={selectedSolicitud.tipo_pago === 'PREPAGO' ? 'text-orange-400' : 'text-blue-400'}>
                          {selectedSolicitud.tipo_pago === 'PREPAGO' ? 'Prepago' : `Crédito - ${selectedSolicitud.dias_credito} días`}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* CSR asignado */}
                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6">
                    <h3 className="text-sm font-semibold text-green-400 mb-2">CSR ASIGNADO</h3>
                    <p className="text-white font-medium">{selectedSolicitud.csr_nombre}</p>
                    <p className="text-white/60 text-sm">{selectedSolicitud.csr_email}</p>
                  </div>

                  {/* Seleccionar CxC */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-white/70 mb-2" style={{ fontFamily: "'Exo 2'" }}>
                      Ejecutivo de Cobranza (CxC) *
                    </label>
                    <div className="relative">
                      <select
                        value={selectedCxC}
                        onChange={(e) => setSelectedCxC(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white appearance-none cursor-pointer focus:border-blue-500 transition-colors"
                        style={{ fontFamily: "'Exo 2'" }}
                      >
                        <option value="" style={{ background: '#1a2d4a' }}>Seleccionar ejecutivo...</option>
                        {cxcList.map((cxc) => (
                          <option key={cxc.id} value={cxc.id} style={{ background: '#1a2d4a' }}>
                            {cxc.nombre}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 pointer-events-none" />
                    </div>
                    {cxcSeleccionado && (
                      <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <p className="text-blue-300 text-sm font-medium">{cxcSeleccionado.nombre}</p>
                        <p className="text-blue-300/70 text-xs mt-1">{cxcSeleccionado.email} | {cxcSeleccionado.celular}</p>
                      </div>
                    )}
                  </div>

                  {/* Botón enviar */}
                  <button
                    onClick={() => setShowConfirm(true)}
                    disabled={!selectedCxC || submitting}
                    className="w-full py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}
                  >
                    <Send className="w-5 h-5 text-white" />
                    <span className="text-white font-semibold text-lg" style={{ fontFamily: "'Exo 2'" }}>
                      Asignar y Enviar a Confirmación
                    </span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Modal de confirmación */}
        {showConfirm && selectedSolicitud && cxcSeleccionado && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#0a1628] rounded-2xl border border-white/20 p-8 max-w-md w-full">
              <h3 className="text-xl font-semibold text-white mb-4" style={{ fontFamily: "'Exo 2'" }}>
                Confirmar Asignación
              </h3>
              <p className="text-white/80 mb-4">
                ¿Desea asignar a <strong className="text-white">{selectedSolicitud.razon_social}</strong> al ejecutivo <strong className="text-blue-400">{cxcSeleccionado.nombre}</strong>?
              </p>
              <div className="bg-white/5 rounded-xl p-4 mb-6">
                <p className="text-white/60 text-sm mb-2">Resumen:</p>
                <p className="text-white text-sm">• CSR: <span className="text-green-400">{selectedSolicitud.csr_nombre}</span></p>
                <p className="text-white text-sm">• CxC: <span className="text-blue-400">{cxcSeleccionado.nombre}</span></p>
                <p className="text-white text-sm">• Pago: {selectedSolicitud.tipo_pago === 'PREPAGO' ? 'Prepago' : `Crédito ${selectedSolicitud.dias_credito} días`}</p>
              </div>
              <p className="text-white/60 text-sm mb-6">
                Se enviará correo a <strong className="text-white">Nancy Alonso</strong> para confirmación final.
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
                  style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', fontFamily: "'Exo 2'" }}
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
