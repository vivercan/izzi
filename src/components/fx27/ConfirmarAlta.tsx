import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ClipboardCheck, Download, CheckCircle2, Loader2, FileText, User, CreditCard } from 'lucide-react';

const supabaseUrl = 'https://fbxbsslhewchyibdoyzk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieGJzc2xoZXdjaHlpYmRveXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzczODEsImV4cCI6MjA3ODExMzM4MX0.Z8JPlg7hhKbA624QGHp2bKKTNtCD3WInQMO5twjl6a0';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Solicitud {
  id: string; razon_social: string; rfc: string; representante_legal: string; email_cliente: string;
  calle: string; no_ext: string; colonia: string; cp: string; ciudad: string; estado: string;
  csr_nombre: string; csr_email: string; csr_celular: string;
  cxc_nombre: string; cxc_email: string; cxc_celular: string;
  tipo_pago: string; dias_credito: number; documentos: Record<string, string>;
  contacto_admin_nombre: string; contacto_admin_email: string; contacto_admin_tel: string;
  estatus: string; created_at: string;
}

export function ConfirmarAlta() {
  const [loading, setLoading] = useState(true);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [downloading, setDownloading] = useState(false);
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
      {/* Header */}
      <div className="flex items-center gap-3 mb-3 flex-shrink-0">
        <ClipboardCheck className="w-6 h-6 text-green-500" />
        <h1 className="text-xl font-bold text-white">Confirmar Alta</h1>
        <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 text-xs">{solicitudes.length} pendientes</span>
      </div>

      {solicitudes.length === 0 ? (
        <div className="flex-1 flex items-center justify-center"><CheckCircle2 className="w-12 h-12 text-green-400 mr-3" /><span className="text-white text-lg">No hay solicitudes pendientes</span></div>
      ) : (
        <div className="flex-1 grid grid-cols-4 gap-3 min-h-0">
          {/* Lista */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-2 overflow-y-auto">
            {solicitudes.map((sol) => (
              <div key={sol.id} onClick={() => setSelectedSolicitud(sol)}
                className={`p-2 rounded-lg cursor-pointer mb-1 ${selectedSolicitud?.id === sol.id ? 'bg-green-500/20 border border-green-500' : 'bg-white/5 hover:bg-white/10 border border-transparent'}`}>
                <p className="text-white text-sm font-medium truncate">{sol.razon_social}</p>
                <p className="text-green-400 text-xs font-mono">{sol.rfc}</p>
              </div>
            ))}
          </div>

          {/* Panel */}
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

                {/* Documentos */}
                <div className="bg-black/20 rounded p-2 mb-2 flex-shrink-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[9px] text-white/50">DOCUMENTOS</p>
                    <button onClick={descargarTodos} disabled={downloading} className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-[10px] flex items-center gap-1">
                      {downloading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />} Descargar
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {selectedSolicitud.documentos && Object.keys(selectedSolicitud.documentos).map((key) => (
                      <span key={key} className="px-2 py-0.5 rounded bg-white/10 text-white/70 text-[10px]">✓ {key.replace(/_/g, ' ')}</span>
                    ))}
                  </div>
                </div>

                {/* Botones */}
                <div className="grid grid-cols-2 gap-2 mt-auto flex-shrink-0">
                  <button onClick={descargarTodos} disabled={downloading} className="py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm flex items-center justify-center gap-2">
                    {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Descargar Todo
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

      {/* Modal */}
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
