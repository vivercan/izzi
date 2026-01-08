import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ClipboardCheck, Download, Send, CheckCircle2, Loader2, Building2, FileText, User, Mail, Phone, CreditCard, Calendar, Package } from 'lucide-react';

const supabaseUrl = 'https://fbxbsslhewchyibdoyzk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieGJzc2xoZXdjaHlpYmRveXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzczODEsImV4cCI6MjA3ODExMzM4MX0.Z8JPlg7hhKbA624QGHp2bKKTNtCD3WInQMO5twjl6a0';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Solicitud {
  id: string;
  razon_social: string;
  rfc: string;
  representante_legal: string;
  email_cliente: string;
  calle: string;
  no_ext: string;
  colonia: string;
  cp: string;
  ciudad: string;
  estado: string;
  giro: string;
  whatsapp: string;
  csr_nombre: string;
  csr_email: string;
  csr_celular: string;
  cxc_nombre: string;
  cxc_email: string;
  cxc_celular: string;
  tipo_pago: string;
  dias_credito: number;
  documentos: Record<string, string>;
  estatus: string;
  created_at: string;
  contacto_admin_nombre: string;
  contacto_admin_email: string;
  contacto_admin_tel: string;
}

export function ConfirmarAlta() {
  const [loading, setLoading] = useState(true);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: sols, error: solError } = await supabase
        .from('alta_clientes')
        .select('*')
        .eq('estatus', 'PENDIENTE_CONFIRMACION')
        .order('created_at', { ascending: false });

      if (solError) throw solError;
      setSolicitudes(sols || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const descargarTodos = async () => {
    if (!selectedSolicitud?.documentos) return;
    
    setDownloading(true);
    try {
      const docs = selectedSolicitud.documentos;
      for (const [key, path] of Object.entries(docs)) {
        if (!path) continue;
        const { data, error } = await supabase.storage
          .from('alta-documentos')
          .download(path);
        
        if (error) {
          console.error(`Error descargando ${key}:`, error);
          continue;
        }
        
        // Crear link de descarga
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedSolicitud.rfc}_${key}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Pequeña pausa entre descargas
        await new Promise(r => setTimeout(r, 500));
      }
    } catch (err) {
      console.error('Error descargando:', err);
      alert('Error al descargar documentos');
    } finally {
      setDownloading(false);
    }
  };

  const confirmarAlta = async () => {
    if (!selectedSolicitud) return;

    setSubmitting(true);
    try {
      // Actualizar solicitud
      const { error: updateError } = await supabase
        .from('alta_clientes')
        .update({
          estatus: 'COMPLETADA',
          fecha_confirmacion: new Date().toISOString()
        })
        .eq('id', selectedSolicitud.id);

      if (updateError) throw updateError;

      // Enviar correos finales
      await fetch(`${supabaseUrl}/functions/v1/enviar-correo-alta`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify({
          solicitudId: selectedSolicitud.id,
          tipo: 'alta_completada'
        })
      });

      // Limpiar y refrescar
      setShowConfirm(false);
      setSelectedSolicitud(null);
      fetchData();

      alert('✅ Alta confirmada exitosamente. Se han enviado los correos de bienvenida.');

    } catch (err) {
      console.error('Error confirmando:', err);
      alert('Error al confirmar alta');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0a1628 0%, #1a2d4a 100%)' }}>
        <Loader2 className="w-12 h-12 animate-spin text-green-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ background: 'linear-gradient(135deg, #0a1628 0%, #1a2d4a 100%)' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3" style={{ fontFamily: "'Exo 2'" }}>
            <ClipboardCheck className="w-8 h-8 text-green-500" />
            Confirmar Alta de Clientes
          </h1>
          <p className="text-white/60 mt-2" style={{ fontFamily: "'Exo 2'" }}>
            Solicitudes listas para confirmación final
          </p>
        </div>

        {solicitudes.length === 0 ? (
          <div className="bg-white/5 rounded-2xl border border-white/10 p-12 text-center">
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-400" />
            <h2 className="text-xl text-white font-semibold" style={{ fontFamily: "'Exo 2'" }}>
              No hay solicitudes pendientes
            </h2>
            <p className="text-white/50 mt-2" style={{ fontFamily: "'Exo 2'" }}>
              Todas las altas han sido procesadas
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lista de solicitudes */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white/80 mb-4" style={{ fontFamily: "'Exo 2'" }}>
                ✅ Listas para Confirmar ({solicitudes.length})
              </h2>
              {solicitudes.map((sol) => (
                <div
                  key={sol.id}
                  onClick={() => setSelectedSolicitud(sol)}
                  className={`p-5 rounded-xl cursor-pointer transition-all ${
                    selectedSolicitud?.id === sol.id
                      ? 'bg-green-500/20 border-2 border-green-500'
                      : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <h3 className="text-white font-semibold" style={{ fontFamily: "'Exo 2'" }}>
                    {sol.razon_social}
                  </h3>
                  <p className="text-green-400 font-mono text-sm mt-1">{sol.rfc}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="px-2 py-1 rounded text-xs bg-orange-500/20 text-orange-300">
                      CSR: {sol.csr_nombre?.split(' ')[0]}
                    </span>
                    <span className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-300">
                      CxC: {sol.cxc_nombre?.split(' ')[0]}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Panel de detalle */}
            <div className="lg:col-span-2 bg-white/5 rounded-2xl border border-white/10 p-6 h-fit">
              {!selectedSolicitud ? (
                <div className="text-center py-12">
                  <Building2 className="w-16 h-16 mx-auto mb-4 text-white/20" />
                  <p className="text-white/40" style={{ fontFamily: "'Exo 2'" }}>
                    Selecciona una solicitud para ver detalles
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white" style={{ fontFamily: "'Exo 2'" }}>
                      {selectedSolicitud.razon_social}
                    </h2>
                    <span className="px-4 py-2 rounded-full bg-green-500/20 text-green-300 font-semibold text-sm">
                      Lista para Confirmar
                    </span>
                  </div>

                  {/* Grid de información */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {/* Datos Fiscales */}
                    <div className="bg-black/20 rounded-xl p-4">
                      <h3 className="text-sm font-semibold text-orange-400 mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4" /> DATOS FISCALES
                      </h3>
                      <div className="space-y-2 text-sm">
                        <p className="text-white"><strong className="text-white/60">RFC:</strong> {selectedSolicitud.rfc}</p>
                        <p className="text-white"><strong className="text-white/60">Rep. Legal:</strong> {selectedSolicitud.representante_legal}</p>
                        <p className="text-white"><strong className="text-white/60">Dirección:</strong> {selectedSolicitud.calle} {selectedSolicitud.no_ext}, {selectedSolicitud.colonia}, {selectedSolicitud.ciudad}, {selectedSolicitud.estado} CP {selectedSolicitud.cp}</p>
                      </div>
                    </div>

                    {/* Contacto */}
                    <div className="bg-black/20 rounded-xl p-4">
                      <h3 className="text-sm font-semibold text-purple-400 mb-3 flex items-center gap-2">
                        <User className="w-4 h-4" /> CONTACTO PRINCIPAL
                      </h3>
                      <div className="space-y-2 text-sm">
                        <p className="text-white flex items-center gap-2">
                          <User className="w-4 h-4 text-white/40" /> {selectedSolicitud.contacto_admin_nombre || 'N/A'}
                        </p>
                        <p className="text-white flex items-center gap-2">
                          <Mail className="w-4 h-4 text-white/40" /> {selectedSolicitud.contacto_admin_email || selectedSolicitud.email_cliente}
                        </p>
                        <p className="text-white flex items-center gap-2">
                          <Phone className="w-4 h-4 text-white/40" /> {selectedSolicitud.contacto_admin_tel || selectedSolicitud.whatsapp || 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* CSR Asignado */}
                    <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
                      <h3 className="text-sm font-semibold text-orange-400 mb-3">CSR ASIGNADO</h3>
                      <p className="text-white font-medium">{selectedSolicitud.csr_nombre}</p>
                      <p className="text-white/60 text-sm">{selectedSolicitud.csr_email}</p>
                      <p className="text-white/60 text-sm">{selectedSolicitud.csr_celular}</p>
                    </div>

                    {/* CxC Asignado */}
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                      <h3 className="text-sm font-semibold text-blue-400 mb-3">COBRANZA ASIGNADO</h3>
                      <p className="text-white font-medium">{selectedSolicitud.cxc_nombre}</p>
                      <p className="text-white/60 text-sm">{selectedSolicitud.cxc_email}</p>
                      <p className="text-white/60 text-sm">{selectedSolicitud.cxc_celular}</p>
                    </div>
                  </div>

                  {/* Condiciones de pago */}
                  <div className={`rounded-xl p-4 mb-6 ${
                    selectedSolicitud.tipo_pago === 'PREPAGO' 
                      ? 'bg-orange-500/10 border border-orange-500/30' 
                      : 'bg-green-500/10 border border-green-500/30'
                  }`}>
                    <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                      <CreditCard className="w-4 h-4" /> CONDICIONES DE PAGO
                    </h3>
                    <p className={`text-2xl font-bold ${
                      selectedSolicitud.tipo_pago === 'PREPAGO' ? 'text-orange-400' : 'text-green-400'
                    }`}>
                      {selectedSolicitud.tipo_pago === 'PREPAGO' 
                        ? 'PREPAGO' 
                        : `CRÉDITO - ${selectedSolicitud.dias_credito} DÍAS`}
                    </p>
                  </div>

                  {/* Documentos */}
                  <div className="bg-black/20 rounded-xl p-4 mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-white/60">DOCUMENTOS</h3>
                      <button
                        onClick={descargarTodos}
                        disabled={downloading}
                        className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-2 text-sm"
                      >
                        {downloading ? (
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                        ) : (
                          <Download className="w-4 h-4 text-white" />
                        )}
                        <span className="text-white">Descargar Todos</span>
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedSolicitud.documentos && Object.keys(selectedSolicitud.documentos).map((key) => (
                        <span key={key} className="px-3 py-1 rounded-full bg-white/10 text-white/70 text-xs">
                          ✓ {key.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex gap-4">
                    <button
                      onClick={descargarTodos}
                      disabled={downloading}
                      className="flex-1 py-4 rounded-xl flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      {downloading ? (
                        <Loader2 className="w-5 h-5 animate-spin text-white" />
                      ) : (
                        <Package className="w-5 h-5 text-white" />
                      )}
                      <span className="text-white font-semibold" style={{ fontFamily: "'Exo 2'" }}>
                        Descargar Todo
                      </span>
                    </button>
                    <button
                      onClick={() => setShowConfirm(true)}
                      disabled={submitting}
                      className="flex-1 py-4 rounded-xl flex items-center justify-center gap-2"
                      style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' }}
                    >
                      <CheckCircle2 className="w-5 h-5 text-white" />
                      <span className="text-white font-semibold" style={{ fontFamily: "'Exo 2'" }}>
                        Confirmar Alta
                      </span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Modal de confirmación */}
        {showConfirm && selectedSolicitud && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#0a1628] rounded-2xl border border-white/20 p-8 max-w-md w-full">
              <h3 className="text-xl font-semibold text-white mb-4" style={{ fontFamily: "'Exo 2'" }}>
                Confirmar Alta
              </h3>
              <p className="text-white/80 mb-6">
                ¿Confirma que el alta de <strong className="text-green-400">{selectedSolicitud.razon_social}</strong> está completa y lista para activar?
              </p>
              <div className="bg-white/5 rounded-xl p-4 mb-6 text-sm">
                <p className="text-white/60 mb-2">Se enviará correo de bienvenida a:</p>
                <ul className="text-white space-y-1">
                  <li>• Cliente ({selectedSolicitud.email_cliente})</li>
                  <li>• Juan Viveros</li>
                  <li>• Martha Velasco</li>
                  <li>• Claudia Priana</li>
                  <li>• {selectedSolicitud.csr_nombre}</li>
                  <li>• {selectedSolicitud.cxc_nombre}</li>
                </ul>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition-colors"
                  style={{ fontFamily: "'Exo 2'" }}
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarAlta}
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', fontFamily: "'Exo 2'" }}
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
