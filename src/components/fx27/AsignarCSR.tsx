import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { UserCheck, CreditCard, Clock, Send, CheckCircle2, Loader2, ChevronDown, Trash2, AlertTriangle } from 'lucide-react';

const supabaseUrl = 'https://fbxbsslhewchyibdoyzk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieGJzc2xoZXdjaHlpYmRveXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzczODEsImV4cCI6MjA3ODExMzM4MX0.Z8JPlg7hhKbA624QGHp2bKKTNtCD3WInQMO5twjl6a0';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface CSR { id: string; nombre: string; email: string; celular: string; }
interface Solicitud { id: string; razon_social: string; rfc: string; representante_legal: string; email_cliente: string; estatus: string; created_at: string; }

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
  const [selectedToDelete, setSelectedToDelete] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: sols } = await supabase.from('alta_clientes').select('*').eq('estatus', 'PENDIENTE_CSR').order('created_at', { ascending: false });
    const { data: csrs } = await supabase.from('catalogo_csr').select('*').eq('activo', true);
    setSolicitudes(sols || []);
    setCsrList(csrs || []);
    setLoading(false);
  };

  const handleAsignar = async () => {
    if (!selectedSolicitud || !selectedCSR) return;
    setSubmitting(true);
    const csrData = csrList.find(c => c.id === selectedCSR);
    if (!csrData) { setSubmitting(false); return; }
    await supabase.from('alta_clientes').update({
      csr_id: csrData.id, csr_nombre: csrData.nombre, csr_email: csrData.email, csr_celular: csrData.celular,
      tipo_pago: tipoPago, dias_credito: tipoPago === 'CREDITO' ? diasCredito : null,
      estatus: 'PENDIENTE_CXC', fecha_asignacion_csr: new Date().toISOString()
    }).eq('id', selectedSolicitud.id);
    await fetch(`${supabaseUrl}/functions/v1/enviar-correo-alta`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseAnonKey}` },
      body: JSON.stringify({ solicitudId: selectedSolicitud.id, tipo: 'csr_asignado' })
    });
    setShowConfirm(false); setSelectedSolicitud(null); setSelectedCSR(''); setSubmitting(false); fetchData();
  };

  const handleDelete = async () => {
    if (selectedToDelete.length === 0) return;
    setSubmitting(true);
    await supabase.from('alta_clientes').delete().in('id', selectedToDelete);
    setShowDeleteConfirm(false); setSelectedToDelete([]); setSelectedSolicitud(null); setSubmitting(false); fetchData();
  };

  const toggleDelete = (id: string) => setSelectedToDelete(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const csrSeleccionado = csrList.find(c => c.id === selectedCSR);

  if (loading) return <div className="h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0a1628 0%, #1a2d4a 100%)' }}><Loader2 className="w-10 h-10 animate-spin text-orange-500" /></div>;

  return (
    <div className="h-screen flex flex-col p-4" style={{ background: 'linear-gradient(135deg, #0a1628 0%, #1a2d4a 100%)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <UserCheck className="w-6 h-6 text-orange-500" />
          <h1 className="text-xl font-bold text-white">Asignar CSR</h1>
          <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 text-xs">{solicitudes.length} pendientes</span>
        </div>
        {selectedToDelete.length > 0 && (
          <button onClick={() => setShowDeleteConfirm(true)} className="px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 text-sm flex items-center gap-2">
            <Trash2 className="w-4 h-4" /> Borrar ({selectedToDelete.length})
          </button>
        )}
      </div>

      {solicitudes.length === 0 ? (
        <div className="flex-1 flex items-center justify-center"><CheckCircle2 className="w-12 h-12 text-green-400 mr-3" /><span className="text-white text-lg">No hay solicitudes pendientes</span></div>
      ) : (
        <div className="flex-1 grid grid-cols-3 gap-3 min-h-0">
          {/* Lista */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-2 overflow-y-auto">
            {solicitudes.map((sol) => (
              <div key={sol.id} onClick={() => setSelectedSolicitud(sol)}
                className={`p-2 rounded-lg cursor-pointer mb-1 flex items-start gap-2 ${selectedSolicitud?.id === sol.id ? 'bg-orange-500/20 border border-orange-500' : 'bg-white/5 hover:bg-white/10 border border-transparent'}`}>
                <input type="checkbox" checked={selectedToDelete.includes(sol.id)} onChange={(e) => { e.stopPropagation(); toggleDelete(sol.id); }} className="mt-0.5 w-3.5 h-3.5 rounded" />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{sol.razon_social || 'Sin nombre'}</p>
                  <p className="text-orange-400 text-xs font-mono">{sol.rfc || '-'}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Panel */}
          <div className="col-span-2 bg-white/5 rounded-xl border border-white/10 p-4 flex flex-col">
            {!selectedSolicitud ? (
              <div className="flex-1 flex items-center justify-center text-white/40">Selecciona una solicitud</div>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-orange-400 mb-3 truncate">{selectedSolicitud.razon_social}</h2>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-black/20 rounded-lg p-2"><p className="text-[10px] text-white/50">RFC</p><p className="text-white text-sm font-mono">{selectedSolicitud.rfc}</p></div>
                  <div className="bg-black/20 rounded-lg p-2"><p className="text-[10px] text-white/50">Rep. Legal</p><p className="text-white text-sm truncate">{selectedSolicitud.representante_legal || 'N/A'}</p></div>
                </div>

                <div className="mb-3">
                  <label className="text-[10px] text-white/60 mb-1 block">Ejecutivo CSR *</label>
                  <div className="relative">
                    <select value={selectedCSR} onChange={(e) => setSelectedCSR(e.target.value)} className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm appearance-none">
                      <option value="" style={{ background: '#1a2d4a' }}>Seleccionar...</option>
                      {csrList.map((csr) => <option key={csr.id} value={csr.id} style={{ background: '#1a2d4a' }}>{csr.nombre}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  </div>
                  {csrSeleccionado && <p className="text-green-400 text-xs mt-1">{csrSeleccionado.email}</p>}
                </div>

                <div className="mb-3">
                  <label className="text-[10px] text-white/60 mb-1 block">Tipo de Pago *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setTipoPago('PREPAGO')} className={`p-2 rounded-lg border text-sm flex items-center justify-center gap-1 ${tipoPago === 'PREPAGO' ? 'border-orange-500 bg-orange-500/20 text-orange-300' : 'border-white/20 text-white/60'}`}>
                      <CreditCard className="w-4 h-4" /> Prepago
                    </button>
                    <button onClick={() => setTipoPago('CREDITO')} className={`p-2 rounded-lg border text-sm flex items-center justify-center gap-1 ${tipoPago === 'CREDITO' ? 'border-blue-500 bg-blue-500/20 text-blue-300' : 'border-white/20 text-white/60'}`}>
                      <Clock className="w-4 h-4" /> Crédito
                    </button>
                  </div>
                </div>

                {tipoPago === 'CREDITO' && (
                  <div className="mb-3">
                    <label className="text-[10px] text-white/60 mb-1 block">Días de Crédito</label>
                    <div className="flex items-center gap-2">
                      <input type="number" value={diasCredito} onChange={(e) => setDiasCredito(parseInt(e.target.value) || 0)} className="w-16 px-2 py-1.5 bg-white/5 border border-white/20 rounded-lg text-white text-center font-bold" />
                      {[15, 30, 45, 60].map((d) => <button key={d} onClick={() => setDiasCredito(d)} className={`px-2 py-1 rounded text-xs ${diasCredito === d ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/60'}`}>{d}</button>)}
                    </div>
                  </div>
                )}

                <button onClick={() => setShowConfirm(true)} disabled={!selectedCSR} className="mt-auto w-full py-2.5 rounded-lg flex items-center justify-center gap-2 disabled:opacity-40 text-white font-semibold" style={{ background: 'linear-gradient(135deg, #fe5000 0%, #cc4000 100%)' }}>
                  <Send className="w-4 h-4" /> Asignar y Enviar
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal Confirmar */}
      {showConfirm && selectedSolicitud && csrSeleccionado && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#0a1628] rounded-xl border border-white/20 p-5 max-w-xs w-full">
            <h3 className="text-base font-semibold text-white mb-2">Confirmar</h3>
            <div className="bg-white/5 rounded-lg p-2 mb-3 text-xs">
              <p className="text-white"><b>Cliente:</b> {selectedSolicitud.razon_social}</p>
              <p className="text-green-400"><b>CSR:</b> {csrSeleccionado.nombre}</p>
              <p className="text-blue-400"><b>Pago:</b> {tipoPago === 'PREPAGO' ? 'Prepago' : `Crédito ${diasCredito}d`}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-2 rounded-lg bg-white/10 text-white text-sm">Cancelar</button>
              <button onClick={handleAsignar} disabled={submitting} className="flex-1 py-2 rounded-lg bg-orange-500 text-white text-sm flex items-center justify-center gap-1">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Borrar */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#0a1628] rounded-xl border border-red-500/30 p-5 max-w-xs w-full">
            <div className="flex items-center gap-2 mb-3"><AlertTriangle className="w-6 h-6 text-red-500" /><h3 className="text-base font-semibold text-white">Borrar</h3></div>
            <p className="text-white/70 text-sm mb-3">¿Borrar <b className="text-red-400">{selectedToDelete.length}</b> solicitud(es)?</p>
            <div className="flex gap-2">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2 rounded-lg bg-white/10 text-white text-sm">Cancelar</button>
              <button onClick={handleDelete} disabled={submitting} className="flex-1 py-2 rounded-lg bg-red-500 text-white text-sm flex items-center justify-center gap-1">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Borrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
