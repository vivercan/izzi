// ═══════════════════════════════════════════════════════════════════════════
// ASIGNAR CXC (COBRANZA) - Para Claudia Priana / Martha Velasco
// CORREGIDO: Usa PENDIENTE_COBRANZA (no PENDIENTE_CXC) y envía datos completos
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Wallet, Send, CheckCircle2, Loader2, ChevronDown, UserCheck, RefreshCw } from 'lucide-react';

const supabaseUrl = 'https://fbxbsslhewchyibdoyzk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieGJzc2xoZXdjaHlpYmRveXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzczODEsImV4cCI6MjA3ODExMzM4MX0.Z8JPlg7hhKbA624QGHp2bKKTNtCD3WInQMO5twjl6a0';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface CxC { 
  id: string; 
  nombre: string; 
  email: string; 
  celular?: string;
  telefono?: string; 
}

interface Solicitud { 
  id: string; 
  razon_social: string; 
  rfc: string;
  rfc_mc?: string;
  nombre_cliente?: string;
  email_cliente?: string;
  empresa_facturadora?: string;
  csr_nombre: string; 
  csr_email: string;
  csr_celular?: string;
  csr_telefono?: string;
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

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // CORREGIDO: Buscar PENDIENTE_COBRANZA (el estatus que usa RevisarSolicitudAlta)
    const { data: sols } = await supabase
      .from('alta_clientes')
      .select('*')
      .eq('estatus', 'PENDIENTE_COBRANZA')
      .order('created_at', { ascending: false });
    
    const { data: cxcs } = await supabase
      .from('catalogo_cxc')
      .select('*')
      .eq('activo', true);
    
    setSolicitudes(sols || []);
    setCxcList(cxcs || []);
    setLoading(false);
  };

  const handleAsignar = async () => {
    if (!selectedSolicitud || !selectedCxC) return;
    setSubmitting(true);
    
    const cxcData = cxcList.find(c => c.id === selectedCxC);
    if (!cxcData) { 
      setSubmitting(false); 
      return; 
    }

    try {
      // Obtener usuario actual (Claudia o Martha)
      const { data: { user } } = await supabase.auth.getUser();
      const asignadoPor = user?.email?.includes('claudia') ? 'Claudia Priana' : 
                          user?.email?.includes('martha') ? 'Martha Velasco' : 
                          'Gerencia CxC';

      // Actualizar en base de datos
      await supabase
        .from('alta_clientes')
        .update({
          cxc_id: cxcData.id, 
          cxc_nombre: cxcData.nombre, 
          cxc_email: cxcData.email, 
          cxc_celular: cxcData.celular || cxcData.telefono,
          cxc_telefono: cxcData.telefono || cxcData.celular,
          cxc_asignado_por: asignadoPor,
          cxc_asignado_fecha: new Date().toISOString(),
          estatus: 'PENDIENTE_CONFIRMACION'
        })
        .eq('id', selectedSolicitud.id);

      // CORREGIDO: Enviar datos completos al Edge Function para el correo a Nancy
      await fetch(`${supabaseUrl}/functions/v1/enviar-correo-alta`, {
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${supabaseAnonKey}` 
        },
        body: JSON.stringify({ 
          tipo: 'pendiente_confirmacion',
          solicitudId: selectedSolicitud.id,
          // Datos del cliente
          razonSocial: selectedSolicitud.razon_social,
          rfc: selectedSolicitud.rfc_mc || selectedSolicitud.rfc,
          nombreContacto: selectedSolicitud.nombre_cliente,
          emailCliente: selectedSolicitud.email_cliente,
          empresaFacturadora: selectedSolicitud.empresa_facturadora,
          // Datos del CSR
          csrNombre: selectedSolicitud.csr_nombre,
          csrEmail: selectedSolicitud.csr_email,
          csrTelefono: selectedSolicitud.csr_celular || selectedSolicitud.csr_telefono,
          // Datos del CxC
          cxcNombre: cxcData.nombre,
          cxcEmail: cxcData.email,
          cxcTelefono: cxcData.telefono || cxcData.celular,
          // Tipo de pago
          tipoPago: selectedSolicitud.tipo_pago,
          diasCredito: selectedSolicitud.dias_credito
        })
      });

      alert('✅ Ejecutivo CxC asignado. Se notificó a Nancy Alonso.');
      
    } catch (error) {
      console.error('Error:', error);
      alert('Error al asignar');
    }

    setShowConfirm(false); 
    setSelectedSolicitud(null); 
    setSelectedCxC(''); 
    setSubmitting(false); 
    fetchData();
  };

  const cxcSeleccionado = cxcList.find(c => c.id === selectedCxC);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0a1628 0%, #1a2d4a 100%)' }}>
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col p-4" style={{ background: 'linear-gradient(135deg, #0a1628 0%, #1a2d4a 100%)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-3 flex-shrink-0">
        <Wallet className="w-6 h-6 text-blue-500" />
        <h1 className="text-xl font-bold text-white">Asignar Cobranza</h1>
        <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs">
          {solicitudes.length} pendientes
        </span>
        <button
          onClick={fetchData}
          className="ml-auto p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
          title="Actualizar"
        >
          <RefreshCw className={`w-4 h-4 text-white/50 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {solicitudes.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <CheckCircle2 className="w-12 h-12 text-green-400 mr-3" />
          <span className="text-white text-lg">No hay solicitudes pendientes de CxC</span>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-3 gap-3 min-h-0">
          {/* Lista de solicitudes */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-2 overflow-y-auto">
            {solicitudes.map((sol) => (
              <div 
                key={sol.id} 
                onClick={() => setSelectedSolicitud(sol)}
                className={`p-2 rounded-lg cursor-pointer mb-1 transition-all ${
                  selectedSolicitud?.id === sol.id 
                    ? 'bg-blue-500/20 border border-blue-500' 
                    : 'bg-white/5 hover:bg-white/10 border border-transparent'
                }`}
              >
                <p className="text-white text-sm font-medium truncate">{sol.razon_social}</p>
                <p className="text-blue-400 text-xs font-mono">{sol.rfc_mc || sol.rfc}</p>
                <div className="flex items-center gap-1 mt-1">
                  <UserCheck className="w-3 h-3 text-green-400" />
                  <span className="text-white/60 text-xs truncate">{sol.csr_nombre}</span>
                </div>
                <div className={`mt-1 text-xs font-medium ${sol.tipo_pago === 'CREDITO' ? 'text-green-400' : 'text-orange-400'}`}>
                  {sol.tipo_pago === 'CREDITO' ? `Crédito ${sol.dias_credito}d` : 'Prepago'}
                </div>
              </div>
            ))}
          </div>

          {/* Panel de detalle */}
          <div className="col-span-2 bg-white/5 rounded-xl border border-white/10 p-4 flex flex-col">
            {!selectedSolicitud ? (
              <div className="flex-1 flex items-center justify-center text-white/40">
                Selecciona una solicitud
              </div>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-blue-400 mb-3 truncate">
                  {selectedSolicitud.razon_social}
                </h2>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-black/20 rounded-lg p-2">
                    <p className="text-[10px] text-white/50">RFC</p>
                    <p className="text-white text-sm font-mono">{selectedSolicitud.rfc_mc || selectedSolicitud.rfc}</p>
                  </div>
                  <div className="bg-black/20 rounded-lg p-2">
                    <p className="text-[10px] text-white/50">Pago</p>
                    <p className={`text-sm font-semibold ${selectedSolicitud.tipo_pago === 'PREPAGO' ? 'text-orange-400' : 'text-blue-400'}`}>
                      {selectedSolicitud.tipo_pago === 'PREPAGO' ? 'Prepago' : `Crédito ${selectedSolicitud.dias_credito}d`}
                    </p>
                  </div>
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2">
                    <p className="text-[10px] text-green-400">CSR Asignado</p>
                    <p className="text-white text-sm truncate">{selectedSolicitud.csr_nombre}</p>
                  </div>
                </div>

                {/* Empresa facturadora */}
                {selectedSolicitud.empresa_facturadora && (
                  <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-2 mb-3">
                    <p className="text-[10px] text-orange-400">Empresa Facturadora</p>
                    <p className="text-white text-sm">{selectedSolicitud.empresa_facturadora}</p>
                  </div>
                )}

                {/* Selector de CxC */}
                <div className="mb-4">
                  <label className="text-[10px] text-white/60 mb-1 block">Ejecutivo Cobranza *</label>
                  <div className="relative">
                    <select 
                      value={selectedCxC} 
                      onChange={(e) => setSelectedCxC(e.target.value)} 
                      className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm appearance-none focus:border-blue-500 focus:outline-none"
                    >
                      <option value="" style={{ background: '#1a2d4a' }}>Seleccionar...</option>
                      {cxcList.map((cxc) => (
                        <option key={cxc.id} value={cxc.id} style={{ background: '#1a2d4a' }}>
                          {cxc.nombre}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  </div>
                  {cxcSeleccionado && (
                    <p className="text-blue-400 text-xs mt-1">
                      {cxcSeleccionado.email} | {cxcSeleccionado.telefono || cxcSeleccionado.celular}
                    </p>
                  )}
                </div>

                {/* Info de lo que pasará */}
                {cxcSeleccionado && (
                  <div className="mb-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                    <p className="text-blue-300 text-xs">
                      Al asignar, se notificará a <strong>Nancy Alonso</strong> para que confirme el alta del cliente.
                    </p>
                  </div>
                )}

                <button 
                  onClick={() => setShowConfirm(true)} 
                  disabled={!selectedCxC} 
                  className="mt-auto w-full py-2.5 rounded-lg flex items-center justify-center gap-2 disabled:opacity-40 text-white font-semibold transition-all" 
                  style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}
                >
                  <Send className="w-4 h-4" /> Asignar y Enviar a Nancy
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal de confirmación */}
      {showConfirm && selectedSolicitud && cxcSeleccionado && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#0a1628] rounded-xl border border-white/20 p-5 max-w-sm w-full">
            <h3 className="text-base font-semibold text-white mb-2">Confirmar Asignación</h3>
            <p className="text-white/70 text-sm mb-3">
              ¿Asignar <b className="text-white">{selectedSolicitud.razon_social}</b> a <b className="text-blue-400">{cxcSeleccionado.nombre}</b>?
            </p>
            <p className="text-white/50 text-xs mb-4">
              Se enviará notificación a Nancy Alonso para confirmar el alta.
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowConfirm(false)} 
                className="flex-1 py-2 rounded-lg bg-white/10 text-white text-sm hover:bg-white/20 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleAsignar} 
                disabled={submitting} 
                className="flex-1 py-2 rounded-lg bg-blue-500 text-white text-sm flex items-center justify-center gap-1 hover:bg-blue-600 transition-all disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// También exportar como default para compatibilidad con imports
export default AsignarCxC;
