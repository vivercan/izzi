// ═══════════════════════════════════════════════════════════════════════════
// REVISAR SOLICITUD DE ALTA - Para Juan Viveros (Track A)
// Incluye: Validar Cliente (IA), Asignar CSR, Tipo Pago
// PARALELO: No cambia estatus directamente; evalúa si CxC ya fue asignado
// Versión: 3.0 - 04/Feb/2026 - Flujo paralelo
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Search, Shield, AlertTriangle, CheckCircle2, XCircle, Loader2,
  User, Building2, CreditCard, Calendar, DollarSign, FileText,
  Globe, AlertCircle, TrendingUp, TrendingDown, Minus
} from 'lucide-react';

const supabaseUrl = 'https://fbxbsslhewchyibdoyzk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieGJzc2xoZXdjaHlpYmRveXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzczODEsImV4cCI6MjA3ODExMzM4MX0.Z8JPlg7hhKbA624QGHp2bKKTNtCD3WInQMO5twjl6a0';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Catálogo de CSR (Servicio a Clientes)
const CSR_CATALOGO = [
  { id: 'elizabeth', nombre: 'Elizabeth Pasillas Romo', email: 'customer.service1@trob.com.mx', celular: '+524491896642' },
  { id: 'lizeth', nombre: 'Lizeth Garcia Paredes', email: 'customer.service3@trob.com.mx', celular: '+524492364738' }
];

const DIAS_CREDITO_OPCIONES = [7, 15, 21, 30, 45, 60, 90];

interface Props {
  solicitudId: string;
  onUpdated?: () => void;
}

interface AnalisisRiesgo {
  calificacion_riesgo: 'BAJO' | 'MEDIO' | 'ALTO' | 'MUY_ALTO' | 'DESCONOCIDO';
  puntuacion: number;
  recomendacion: 'APROBAR_CREDITO' | 'CREDITO_LIMITADO' | 'SOLO_PREPAGO' | 'RECHAZAR' | 'REVISION_MANUAL';
  resumen_ejecutivo: string;
  empresa?: { existe_verificada: boolean; antiguedad_anos: number | string; pagina_web_activa: boolean; presencia_mercado: string; };
  hallazgos?: { positivos: string[]; negativos: string[]; neutrales: string[]; };
}

export default function RevisarSolicitudAlta({ solicitudId, onUpdated }: Props) {
  const [solicitud, setSolicitud] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [validandoRiesgo, setValidandoRiesgo] = useState(false);
  const [analisis, setAnalisis] = useState<AnalisisRiesgo | null>(null);

  const [csrSeleccionado, setCsrSeleccionado] = useState('');
  const [tipoPago, setTipoPago] = useState<'PREPAGO' | 'CREDITO'>('PREPAGO');
  const [diasCredito, setDiasCredito] = useState(30);
  const [saving, setSaving] = useState(false);

  useEffect(() => { cargarSolicitud(); }, [solicitudId]);

  const cargarSolicitud = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('alta_clientes').select('*').eq('id', solicitudId).single();
      if (error) throw error;
      setSolicitud(data);
      if (data.analisis_riesgo) setAnalisis(data.analisis_riesgo);
      if (data.tipo_pago) setTipoPago(data.tipo_pago);
      if (data.dias_credito) setDiasCredito(data.dias_credito);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const validarCliente = async () => {
    setValidandoRiesgo(true);
    setAnalisis(null);
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/validar-cliente-riesgo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseAnonKey}` },
        body: JSON.stringify({ solicitudId })
      });
      const result = await response.json();
      if (result.success && result.analysis) {
        setAnalisis(result.analysis);
        if (result.analysis.recomendacion === 'APROBAR_CREDITO') { setTipoPago('CREDITO'); setDiasCredito(30); }
        else if (result.analysis.recomendacion === 'CREDITO_LIMITADO') { setTipoPago('CREDITO'); setDiasCredito(15); }
        else { setTipoPago('PREPAGO'); }
      } else {
        setAnalisis({ calificacion_riesgo: 'DESCONOCIDO', puntuacion: 50, recomendacion: 'REVISION_MANUAL', resumen_ejecutivo: result.error || 'No se pudo completar el análisis.' });
      }
    } catch (err) {
      setAnalisis({ calificacion_riesgo: 'DESCONOCIDO', puntuacion: 50, recomendacion: 'REVISION_MANUAL', resumen_ejecutivo: 'Error de conexión.' });
    } finally {
      setValidandoRiesgo(false);
    }
  };

  // PARALELO: Guarda CSR + pago, luego evalúa si ambos tracks completos
  const guardarAsignacion = async () => {
    if (!csrSeleccionado) { alert('Seleccione un CSR'); return; }
    setSaving(true);
    try {
      const csr = CSR_CATALOGO.find(c => c.id === csrSeleccionado);
      
      // Guardar CSR + tipo pago (sin cambiar estatus aún)
      const { data: updated, error: updateError } = await supabase.from('alta_clientes').update({
        csr_nombre: csr?.nombre,
        csr_email: csr?.email,
        csr_celular: csr?.celular,
        csr_telefono: csr?.celular,
        csr_asignado_por: 'Juan Viveros',
        csr_asignado_fecha: new Date().toISOString(),
        tipo_pago: tipoPago,
        dias_credito: tipoPago === 'CREDITO' ? diasCredito : null,
      }).eq('id', solicitudId).select().single();

      if (updateError) throw updateError;

      // Evaluar si AMBOS tracks están completos (CSR + CxC)
      if (updated.cxc_nombre) {
        // CxC ya fue asignado por Claudia → transicionar a PENDIENTE_CONFIRMACION
        await supabase.from('alta_clientes')
          .update({ estatus: 'PENDIENTE_CONFIRMACION' })
          .eq('id', solicitudId);

        // Notificar a Nancy que puede confirmar
        await fetch(`${supabaseUrl}/functions/v1/enviar-correo-alta`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseAnonKey}` },
          body: JSON.stringify({
            tipo: 'pendiente_confirmacion',
            solicitudId,
            razonSocial: solicitud.razon_social,
            rfc: solicitud.rfc_mc || solicitud.rfc,
            csrNombre: csr?.nombre,
            cxcNombre: updated.cxc_nombre,
            tipoPago: tipoPago,
            diasCredito: tipoPago === 'CREDITO' ? diasCredito : null
          })
        }).catch(() => {});

        alert('✅ Asignación completa. CxC ya estaba asignado — solicitud lista para confirmación de Nancy.');
      } else {
        // CxC aún no asignado → queda en EN_REVISION esperando a Claudia
        alert('✅ CSR y tipo de pago guardados. Falta asignación de CxC por Claudia.');
      }

      onUpdated?.();
    } catch (err) {
      console.error('Error:', err);
      alert('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const RiesgoIndicador = ({ calificacion, puntuacion }: { calificacion: string; puntuacion: number }) => {
    const configs: Record<string, { color: string; bg: string; icon: any; label: string }> = {
      'BAJO': { color: '#22c55e', bg: 'rgba(34,197,94,0.15)', icon: TrendingUp, label: 'Riesgo Bajo' },
      'MEDIO': { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', icon: Minus, label: 'Riesgo Medio' },
      'ALTO': { color: '#ef4444', bg: 'rgba(239,68,68,0.15)', icon: TrendingDown, label: 'Riesgo Alto' },
      'MUY_ALTO': { color: '#dc2626', bg: 'rgba(220,38,38,0.15)', icon: AlertTriangle, label: 'Riesgo Muy Alto' },
      'DESCONOCIDO': { color: '#64748b', bg: 'rgba(100,116,139,0.15)', icon: AlertCircle, label: 'Sin Datos' }
    };
    const config = configs[calificacion] || configs['DESCONOCIDO'];
    const Icon = config.icon;
    return (
      <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: config.bg }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: `${config.color}30` }}>
          <Icon className="w-8 h-8" style={{ color: config.color }} />
        </div>
        <div>
          <span className="text-2xl font-bold" style={{ color: config.color }}>{puntuacion}/100</span>
          <span className="block text-sm" style={{ color: config.color }}>{config.label}</span>
        </div>
      </div>
    );
  };

  if (loading) return <div className="flex items-center justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;
  if (!solicitud) return <div className="text-center p-12 text-white/50">Solicitud no encontrada</div>;

  return (
    <div className="space-y-6">
      {/* DATOS DEL CLIENTE + VALIDACIÓN IA */}
      <div className="bg-[#0a1628]/95 rounded-xl border border-white/10 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500/20">
              <Building2 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{solicitud.razon_social}</h3>
              <p className="text-sm text-white/50">RFC: {solicitud.rfc_mc || solicitud.rfc || '-'}</p>
            </div>
          </div>
          <button onClick={validarCliente} disabled={validandoRiesgo} className="px-6 py-3 rounded-xl flex items-center gap-2 font-semibold transition-all" style={{ background: validandoRiesgo ? '#64748b' : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}>
            {validandoRiesgo ? <><Loader2 className="w-5 h-5 animate-spin text-white" /><span className="text-white">Validando...</span></> : <><Search className="w-5 h-5 text-white" /><span className="text-white">Validar Cliente (IA)</span></>}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white/5 rounded-lg p-3"><span className="text-xs text-white/40 block">Contacto</span><span className="text-white font-medium">{solicitud.nombre_cliente || '-'}</span></div>
          <div className="bg-white/5 rounded-lg p-3"><span className="text-xs text-white/40 block">Email</span><span className="text-white font-medium">{solicitud.email_cliente || '-'}</span></div>
          <div className="bg-white/5 rounded-lg p-3"><span className="text-xs text-white/40 block">Teléfono</span><span className="text-white font-medium">{solicitud.tel_oficina || solicitud.whatsapp || '-'}</span></div>
        </div>

        {analisis && (
          <div className="border-t border-white/10 pt-6">
            <h4 className="text-sm font-semibold text-white/70 mb-4 flex items-center gap-2"><Shield className="w-4 h-4" />Resultado de Validación</h4>
            <div className="grid grid-cols-2 gap-4">
              <RiesgoIndicador calificacion={analisis.calificacion_riesgo} puntuacion={analisis.puntuacion} />
              <div className="bg-white/5 rounded-xl p-4">
                <span className="text-xs text-white/40 block mb-2">Recomendación</span>
                <span className={`font-bold text-lg ${analisis.recomendacion === 'APROBAR_CREDITO' ? 'text-green-400' : analisis.recomendacion === 'CREDITO_LIMITADO' ? 'text-yellow-400' : analisis.recomendacion === 'SOLO_PREPAGO' ? 'text-orange-400' : 'text-red-400'}`}>
                  {analisis.recomendacion?.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
            <div className="mt-4 p-4 bg-white/5 rounded-xl">
              <span className="text-xs text-white/40 block mb-2">Resumen Ejecutivo</span>
              <p className="text-white/80 text-sm">{analisis.resumen_ejecutivo}</p>
            </div>
          </div>
        )}
      </div>

      {/* ASIGNAR CSR + TIPO DE PAGO */}
      <div className="bg-[#0a1628]/95 rounded-xl border border-white/10 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-orange-500/20"><User className="w-5 h-5 text-orange-400" /></div>
          <div><h3 className="text-lg font-bold text-white">Asignar CSR y Tipo de Pago</h3><p className="text-sm text-white/50">Servicio a Clientes y condiciones de pago</p></div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Seleccionar CSR */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-3">Ejecutivo de Servicio a Clientes *</label>
            <div className="space-y-2">
              {CSR_CATALOGO.map(csr => (
                <button key={csr.id} onClick={() => setCsrSeleccionado(csr.id)} className={`w-full p-4 rounded-xl border-2 transition-all text-left ${csrSeleccionado === csr.id ? 'border-orange-500 bg-orange-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full border-2" style={{ borderColor: csrSeleccionado === csr.id ? '#fe5000' : 'rgba(255,255,255,0.3)', background: csrSeleccionado === csr.id ? '#fe5000' : 'transparent' }} />
                    <div>
                      <span className={`font-medium block ${csrSeleccionado === csr.id ? 'text-orange-400' : 'text-white'}`}>{csr.nombre}</span>
                      <span className="text-xs text-white/40">{csr.email}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Tipo de Pago */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-3">Tipo de Pago *</label>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button onClick={() => setTipoPago('PREPAGO')} className={`p-4 rounded-xl border-2 transition-all ${tipoPago === 'PREPAGO' ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}>
                <DollarSign className={`w-6 h-6 mx-auto mb-2 ${tipoPago === 'PREPAGO' ? 'text-blue-400' : 'text-white/40'}`} />
                <span className={`font-medium ${tipoPago === 'PREPAGO' ? 'text-blue-400' : 'text-white/70'}`}>Prepago</span>
              </button>
              <button onClick={() => setTipoPago('CREDITO')} className={`p-4 rounded-xl border-2 transition-all ${tipoPago === 'CREDITO' ? 'border-green-500 bg-green-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}>
                <Calendar className={`w-6 h-6 mx-auto mb-2 ${tipoPago === 'CREDITO' ? 'text-green-400' : 'text-white/40'}`} />
                <span className={`font-medium ${tipoPago === 'CREDITO' ? 'text-green-400' : 'text-white/70'}`}>Crédito</span>
              </button>
            </div>
            {tipoPago === 'CREDITO' && (
              <div>
                <label className="block text-xs text-white/50 mb-2">Días de Crédito</label>
                <div className="flex flex-wrap gap-2">
                  {DIAS_CREDITO_OPCIONES.map(dias => (
                    <button key={dias} onClick={() => setDiasCredito(dias)} className={`px-4 py-2 rounded-lg font-medium transition-all ${diasCredito === dias ? 'bg-green-500 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}>{dias}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <button onClick={guardarAsignacion} disabled={saving || !csrSeleccionado} className="w-full mt-6 py-4 rounded-xl flex items-center justify-center gap-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all" style={{ background: 'linear-gradient(135deg, #fe5000 0%, #cc4000 100%)' }}>
          {saving ? <><Loader2 className="w-5 h-5 animate-spin text-white" /><span className="text-white">Guardando...</span></> : <><CheckCircle2 className="w-5 h-5 text-white" /><span className="text-white">Guardar CSR y Tipo de Pago</span></>}
        </button>
      </div>
    </div>
  );
}
