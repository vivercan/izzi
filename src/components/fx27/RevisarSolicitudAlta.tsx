// Componente de Revisión de Solicitud - Para Juan Viveros
// Incluye: Validar Cliente (IA), Asignar CSR, Tipo Crédito
// Ubicación: src/components/fx27/RevisarSolicitudAlta.tsx

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

// Catálogo de CSR
const CSR_CATALOGO = [
  { id: 'elizabeth', nombre: 'Elizabeth Pasillas Romo', email: 'customer.service1@trob.com.mx', celular: '+524491896642' },
  { id: 'lizeth', nombre: 'Lizeth Garcia Paredes', email: 'customer.service3@trob.com.mx', celular: '+524492364738' }
];

// Opciones de días de crédito
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
  empresa?: {
    existe_verificada: boolean;
    antiguedad_anos: number | string;
    pagina_web_activa: boolean;
    presencia_mercado: string;
  };
  representante_legal?: {
    nombre: string;
    verificado: boolean;
    otras_empresas: string[];
    alertas: string[];
  };
  hallazgos?: {
    positivos: string[];
    negativos: string[];
    neutrales: string[];
  };
  alertas_criticas?: string[];
}

export default function RevisarSolicitudAlta({ solicitudId, onUpdated }: Props) {
  const [solicitud, setSolicitud] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [validandoRiesgo, setValidandoRiesgo] = useState(false);
  const [analisis, setAnalisis] = useState<AnalisisRiesgo | null>(null);
  
  // Formulario
  const [csrSeleccionado, setCsrSeleccionado] = useState('');
  const [tipoCredito, setTipoCredito] = useState<'PREPAGO' | 'CREDITO'>('PREPAGO');
  const [diasCredito, setDiasCredito] = useState(30);
  const [saving, setSaving] = useState(false);

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
      
      // Cargar análisis previo si existe
      if (data.analisis_riesgo) {
        setAnalisis(data.analisis_riesgo);
      }
      
      // Pre-llenar si ya tiene datos
      if (data.tipo_credito) setTipoCredito(data.tipo_credito);
      if (data.dias_credito) setDiasCredito(data.dias_credito);
      
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // VALIDAR CLIENTE CON IA (Web Search)
  // ═══════════════════════════════════════════════════════════════════════════
  const validarCliente = async () => {
    setValidandoRiesgo(true);
    setAnalisis(null);
    
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/validar-cliente-riesgo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify({ solicitudId })
      });

      const result = await response.json();
      
      if (result.success && result.analysis) {
        setAnalisis(result.analysis);
        
        // Pre-seleccionar tipo de crédito basado en recomendación
        if (result.analysis.recomendacion === 'APROBAR_CREDITO') {
          setTipoCredito('CREDITO');
          setDiasCredito(30);
        } else if (result.analysis.recomendacion === 'CREDITO_LIMITADO') {
          setTipoCredito('CREDITO');
          setDiasCredito(15);
        } else {
          setTipoCredito('PREPAGO');
        }
      } else {
        // Error o sin resultados
        setAnalisis({
          calificacion_riesgo: 'DESCONOCIDO',
          puntuacion: 50,
          recomendacion: 'REVISION_MANUAL',
          resumen_ejecutivo: result.error || 'No se pudo completar el análisis. Se recomienda revisión manual.'
        });
      }
      
    } catch (err) {
      console.error('Error validando:', err);
      setAnalisis({
        calificacion_riesgo: 'DESCONOCIDO',
        puntuacion: 50,
        recomendacion: 'REVISION_MANUAL',
        resumen_ejecutivo: 'Error de conexión. Intente nuevamente.'
      });
    } finally {
      setValidandoRiesgo(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // GUARDAR ASIGNACIÓN
  // ═══════════════════════════════════════════════════════════════════════════
  const guardarAsignacion = async () => {
    if (!csrSeleccionado) {
      alert('Seleccione un Customer Service Representative');
      return;
    }

    setSaving(true);
    try {
      const csr = CSR_CATALOGO.find(c => c.id === csrSeleccionado);
      
      await supabase
        .from('alta_clientes')
        .update({
          ejecutivo_servicio_nombre: csr?.nombre,
          ejecutivo_servicio_email: csr?.email,
          ejecutivo_servicio_tel: csr?.celular,
          tipo_credito: tipoCredito,
          dias_credito: tipoCredito === 'CREDITO' ? diasCredito : null,
          estatus: 'PENDIENTE_COBRANZA',
          fecha_asignacion_csr: new Date().toISOString()
        })
        .eq('id', solicitudId);

      // Enviar correo a Claudia Priana
      await fetch(`${supabaseUrl}/functions/v1/enviar-correo-alta`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify({
          tipo: 'asignar_cobranza',
          solicitudId,
          razonSocial: solicitud.razon_social,
          destinatarios: ['claudia.priana@trob.com.mx', 'martha.velasco@trob.com.mx']
        })
      });

      alert('Asignación guardada. Se notificó a Cobranza.');
      onUpdated?.();
      
    } catch (err) {
      console.error('Error:', err);
      alert('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: Indicador de Riesgo
  // ═══════════════════════════════════════════════════════════════════════════
  const RiesgoIndicador = ({ calificacion, puntuacion }: { calificacion: string; puntuacion: number }) => {
    const configs: Record<string, { color: string; bg: string; icon: any; label: string }> = {
      'BAJO': { color: '#22c55e', bg: 'rgba(34,197,94,0.15)', icon: TrendingUp, label: 'Riesgo Bajo' },
      'MEDIO': { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', icon: Minus, label: 'Riesgo Medio' },
      'ALTO': { color: '#ef4444', bg: 'rgba(239,68,68,0.15)', icon: TrendingDown, label: 'Riesgo Alto' },
      'MUY_ALTO': { color: '#dc2626', bg: 'rgba(220,38,38,0.2)', icon: AlertTriangle, label: 'Riesgo Muy Alto' },
      'DESCONOCIDO': { color: '#6b7280', bg: 'rgba(107,114,128,0.15)', icon: AlertCircle, label: 'Sin Datos' }
    };
    
    const cfg = configs[calificacion] || configs['DESCONOCIDO'];
    const Icon = cfg.icon;
    
    return (
      <div className="flex items-center gap-4">
        <div 
          className="w-20 h-20 rounded-2xl flex flex-col items-center justify-center"
          style={{ background: cfg.bg }}
        >
          <Icon className="w-8 h-8 mb-1" style={{ color: cfg.color }} />
          <span className="text-2xl font-bold" style={{ color: cfg.color }}>{puntuacion}</span>
        </div>
        <div>
          <span className="text-lg font-bold" style={{ color: cfg.color }}>{cfg.label}</span>
          <p className="text-sm text-white/50">Puntuación de 0-100</p>
        </div>
      </div>
    );
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

  return (
    <div className="space-y-6">
      {/* Header con datos del cliente */}
      <div className="bg-[#0a1628]/95 rounded-xl border border-white/10 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white">{solicitud.razon_social}</h2>
            <div className="flex items-center gap-4 mt-2 text-sm text-white/60">
              <span className="flex items-center gap-1">
                <FileText className="w-4 h-4" /> {solicitud.rfc_mc || 'RFC pendiente'}
              </span>
              <span className="flex items-center gap-1">
                <Building2 className="w-4 h-4" /> {solicitud.empresa_facturadora || 'Sin asignar'}
              </span>
              {solicitud.pagina_web && (
                <a href={solicitud.pagina_web} target="_blank" rel="noopener" className="flex items-center gap-1 text-blue-400 hover:underline">
                  <Globe className="w-4 h-4" /> Web
                </a>
              )}
            </div>
          </div>
          
          {/* Badge de Empresa Facturadora */}
          {solicitud.empresa_facturadora && (
            <div className="px-4 py-2 rounded-lg bg-orange-500/20 border border-orange-500/30">
              <span className="text-xs text-orange-400/70">Factura:</span>
              <span className="text-orange-400 font-bold ml-2">{solicitud.empresa_facturadora}</span>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-white/50">Rep. Legal:</span>
            <span className="text-white ml-2">{solicitud.representante_legal || '-'}</span>
          </div>
          <div>
            <span className="text-white/50">Dirección:</span>
            <span className="text-white ml-2">{solicitud.direccion_completa || '-'}</span>
          </div>
          <div>
            <span className="text-white/50">Giro:</span>
            <span className="text-white ml-2">{solicitud.giro || '-'}</span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════
          SECCIÓN 1: VALIDAR CLIENTE (IA + Web Search)
          ═══════════════════════════════════════════════════════════════════════════ */}
      <div className="bg-[#0a1628]/95 rounded-xl border border-white/10 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-500/20">
              <Search className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Validar Cliente</h3>
              <p className="text-sm text-white/50">Análisis exhaustivo con IA + búsqueda web</p>
            </div>
          </div>
          
          <button
            onClick={validarCliente}
            disabled={validandoRiesgo}
            className="px-6 py-3 rounded-xl flex items-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)' }}
          >
            {validandoRiesgo ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-white" />
                <span className="text-white">Analizando...</span>
              </>
            ) : (
              <>
                <Shield className="w-5 h-5 text-white" />
                <span className="text-white">{analisis ? 'Re-Validar' : 'Validar Cliente'}</span>
              </>
            )}
          </button>
        </div>

        {/* Mensaje mientras valida */}
        {validandoRiesgo && (
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
              <div>
                <p className="text-purple-300 font-medium">Análisis en progreso...</p>
                <p className="text-sm text-white/50">
                  Buscando en Google, LinkedIn, SAT, redes sociales y más. Esto puede tomar 30-60 segundos.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Resultados del análisis */}
        {analisis && !validandoRiesgo && (
          <div className="space-y-4">
            {/* Indicador principal */}
            <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <RiesgoIndicador calificacion={analisis.calificacion_riesgo} puntuacion={analisis.puntuacion || 50} />
              
              {/* Recomendación */}
              <div className="text-right">
                <span className="text-xs text-white/50 block mb-1">Recomendación</span>
                <span className={`text-lg font-bold ${
                  analisis.recomendacion === 'APROBAR_CREDITO' ? 'text-green-400' :
                  analisis.recomendacion === 'CREDITO_LIMITADO' ? 'text-yellow-400' :
                  analisis.recomendacion === 'SOLO_PREPAGO' ? 'text-orange-400' :
                  analisis.recomendacion === 'RECHAZAR' ? 'text-red-400' : 'text-white/50'
                }`}>
                  {analisis.recomendacion?.replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            {/* Resumen ejecutivo */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h4 className="text-sm font-semibold text-white/70 mb-2">📋 Resumen Ejecutivo</h4>
              <p className="text-white/80 text-sm leading-relaxed">{analisis.resumen_ejecutivo}</p>
            </div>

            {/* Alertas críticas */}
            {analisis.alertas_criticas && analisis.alertas_criticas.length > 0 && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                <h4 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Alertas Críticas
                </h4>
                <ul className="space-y-1">
                  {analisis.alertas_criticas.map((alerta, i) => (
                    <li key={i} className="text-red-300 text-sm flex items-start gap-2">
                      <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      {alerta}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Hallazgos */}
            {analisis.hallazgos && (
              <div className="grid grid-cols-2 gap-4">
                {/* Positivos */}
                {analisis.hallazgos.positivos && analisis.hallazgos.positivos.length > 0 && (
                  <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                    <h4 className="text-sm font-semibold text-green-400 mb-2">✓ Puntos a Favor</h4>
                    <ul className="space-y-1">
                      {analisis.hallazgos.positivos.map((h, i) => (
                        <li key={i} className="text-green-300 text-xs">{h}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Negativos */}
                {analisis.hallazgos.negativos && analisis.hallazgos.negativos.length > 0 && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                    <h4 className="text-sm font-semibold text-red-400 mb-2">✗ Banderas Rojas</h4>
                    <ul className="space-y-1">
                      {analisis.hallazgos.negativos.map((h, i) => (
                        <li key={i} className="text-red-300 text-xs">{h}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Info de empresa */}
            {analisis.empresa && (
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                <h4 className="text-sm font-semibold text-blue-400 mb-2">🏢 Información de la Empresa</h4>
                <div className="grid grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-white/50">Verificada:</span>
                    <span className={`ml-2 ${analisis.empresa.existe_verificada ? 'text-green-400' : 'text-red-400'}`}>
                      {analisis.empresa.existe_verificada ? 'Sí' : 'No'}
                    </span>
                  </div>
                  <div>
                    <span className="text-white/50">Antigüedad:</span>
                    <span className="text-white ml-2">{analisis.empresa.antiguedad_anos} años</span>
                  </div>
                  <div>
                    <span className="text-white/50">Web activa:</span>
                    <span className={`ml-2 ${analisis.empresa.pagina_web_activa ? 'text-green-400' : 'text-orange-400'}`}>
                      {analisis.empresa.pagina_web_activa ? 'Sí' : 'No'}
                    </span>
                  </div>
                  <div>
                    <span className="text-white/50">Presencia:</span>
                    <span className="text-white ml-2 capitalize">{analisis.empresa.presencia_mercado}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════
          SECCIÓN 2: ASIGNAR CSR + TIPO DE CRÉDITO
          ═══════════════════════════════════════════════════════════════════════════ */}
      <div className="bg-[#0a1628]/95 rounded-xl border border-white/10 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-orange-500/20">
            <User className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Asignar CSR y Crédito</h3>
            <p className="text-sm text-white/50">Customer Service Representative y condiciones</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Seleccionar CSR */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-3">
              Customer Service Rep *
            </label>
            <div className="space-y-2">
              {CSR_CATALOGO.map(csr => (
                <button
                  key={csr.id}
                  onClick={() => setCsrSeleccionado(csr.id)}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    csrSeleccionado === csr.id
                      ? 'border-orange-500 bg-orange-500/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full border-2"
                      style={{ 
                        borderColor: csrSeleccionado === csr.id ? '#fe5000' : 'rgba(255,255,255,0.3)',
                        background: csrSeleccionado === csr.id ? '#fe5000' : 'transparent'
                      }}
                    />
                    <div>
                      <span className={`font-medium block ${csrSeleccionado === csr.id ? 'text-orange-400' : 'text-white'}`}>
                        {csr.nombre}
                      </span>
                      <span className="text-xs text-white/40">{csr.email}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Tipo de Crédito */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-3">
              Tipo de Crédito *
            </label>
            
            {/* Prepago / Crédito */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => setTipoCredito('PREPAGO')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  tipoCredito === 'PREPAGO'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <DollarSign className={`w-6 h-6 mx-auto mb-2 ${tipoCredito === 'PREPAGO' ? 'text-blue-400' : 'text-white/40'}`} />
                <span className={`font-medium ${tipoCredito === 'PREPAGO' ? 'text-blue-400' : 'text-white/70'}`}>
                  Prepago
                </span>
              </button>
              
              <button
                onClick={() => setTipoCredito('CREDITO')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  tipoCredito === 'CREDITO'
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <Calendar className={`w-6 h-6 mx-auto mb-2 ${tipoCredito === 'CREDITO' ? 'text-green-400' : 'text-white/40'}`} />
                <span className={`font-medium ${tipoCredito === 'CREDITO' ? 'text-green-400' : 'text-white/70'}`}>
                  Crédito
                </span>
              </button>
            </div>

            {/* Días de crédito (solo si es crédito) */}
            {tipoCredito === 'CREDITO' && (
              <div>
                <label className="block text-xs text-white/50 mb-2">Días de Crédito</label>
                <div className="flex flex-wrap gap-2">
                  {DIAS_CREDITO_OPCIONES.map(dias => (
                    <button
                      key={dias}
                      onClick={() => setDiasCredito(dias)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        diasCredito === dias
                          ? 'bg-green-500 text-white'
                          : 'bg-white/5 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      {dias}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Botón Guardar */}
        <button
          onClick={guardarAsignacion}
          disabled={saving || !csrSeleccionado}
          className="w-full mt-6 py-4 rounded-xl flex items-center justify-center gap-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          style={{ background: 'linear-gradient(135deg, #fe5000 0%, #cc4000 100%)' }}
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-white" />
              <span className="text-white">Guardando...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5 text-white" />
              <span className="text-white">Guardar y Enviar a Cobranza</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
