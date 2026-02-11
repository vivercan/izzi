import { useState, useRef, useEffect, useCallback } from 'react';
import { FileSearch, FileText, Upload, Loader2, AlertCircle, ArrowLeft, Shield, ShieldAlert, ShieldCheck, FileWarning, ChevronDown, ChevronUp, AlertTriangle, FileDown, RotateCcw, CheckCircle2, Download, RefreshCw } from 'lucide-react';

const supabaseUrl = 'https://fbxbsslhewchyibdoyzk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieGJzc2xoZXdjaHlpYmRveXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzczODEsImV4cCI6MjA3ODExMzM4MX0.Z8JPlg7hhKbA624QGHp2bKKTNtCD3WInQMO5twjl6a0';

const F = "'Exo 2', sans-serif";

interface RiesgoContrato {
  clausula: string;
  descripcion: string;
  severidad: 'ALTA' | 'MEDIA' | 'BAJA';
  sugerencia: string;
}

interface AnalisisContrato {
  datos_extraidos: {
    representante_legal: string;
    notaria: string;
    numero_escritura: string;
    fecha_contrato: string;
    partes: string[];
    objeto_contrato: string;
    vigencia: string;
    monto_o_tarifa: string;
  };
  es_leonino: boolean;
  explicacion_leonino: string;
  riesgos: RiesgoContrato[];
  resumen_ejecutivo: string;
  clausulas_faltantes: string[];
  version_blindada: string;
  calificacion_riesgo: number;
}

interface Props {
  onBack: () => void;
}

// ═══════════════════════════════════════════════════════════════
// PDF GENERATOR
// ═══════════════════════════════════════════════════════════════
function generarPDF(titulo: string, contenidoHTML: string, nombreArchivo: string) {
  const w = window.open('', '_blank');
  if (!w) { alert('Permite ventanas emergentes para descargar el PDF'); return; }
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${titulo}</title>
  <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700&family=Exo+2:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    @page { margin: 2.5cm 3cm; }
    body { font-family: 'Merriweather', serif; font-size: 12pt; line-height: 1.9; color: #1a1a2e; margin: 0; padding: 40px; }
    h1 { font-family: 'Exo 2', sans-serif; color: #0d1b3e; font-size: 22pt; border-bottom: 3px solid #fe5000; padding-bottom: 12px; margin-bottom: 30px; }
    h2 { font-family: 'Exo 2', sans-serif; color: #0d1b3e; font-size: 15pt; margin-top: 28px; border-left: 4px solid #7c3aed; padding-left: 12px; }
    h3 { font-family: 'Exo 2', sans-serif; color: #333; font-size: 13pt; }
    .header-meta { font-family: 'Exo 2', sans-serif; font-size: 10pt; color: #666; margin-bottom: 20px; }
    .risk-badge { display: inline-block; padding: 4px 14px; border-radius: 20px; font-family: 'Exo 2', sans-serif; font-weight: 700; font-size: 11pt; }
    .risk-alta { background: #fee2e2; color: #dc2626; }
    .risk-media { background: #fef3c7; color: #d97706; }
    .risk-baja { background: #d1fae5; color: #059669; }
    .clausula-box { background: #f8f9fa; border-left: 4px solid #7c3aed; padding: 14px 18px; margin: 14px 0; border-radius: 0 8px 8px 0; }
    .warning-box { background: #fef2f2; border: 2px solid #ef4444; padding: 16px; border-radius: 8px; margin: 16px 0; }
    .info-box { background: #eff6ff; border: 1px solid #3b82f6; padding: 16px; border-radius: 8px; margin: 16px 0; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { padding: 10px 14px; border: 1px solid #d1d5db; text-align: left; font-size: 11pt; }
    th { background: #0d1b3e; color: #fff; font-family: 'Exo 2', sans-serif; }
    p { text-align: justify; margin: 8px 0; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 2px solid #e5e7eb; font-family: 'Exo 2', sans-serif; font-size: 9pt; color: #999; text-align: center; }
  </style></head><body>${contenidoHTML}
  <div class="footer">FX27 — Análisis generado por IA para TROB TRANSPORTES | ${new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
  </body></html>`);
  w.document.close();
  setTimeout(() => { w.print(); }, 800);
}

// ═══════════════════════════════════════════════════════════════
// PROGRESS STEPS CONFIGURATION
// ═══════════════════════════════════════════════════════════════
const PASOS_ANALISIS = [
  { texto: 'Extrayendo texto del documento', porcentaje: 10 },
  { texto: 'Identificando partes y representantes', porcentaje: 25 },
  { texto: 'Analizando cláusulas y condiciones', porcentaje: 45 },
  { texto: 'Evaluando riesgos para TROB', porcentaje: 70 },
  { texto: 'Generando versión blindada', porcentaje: 90 },
];

export default function AnalisisContratosModule({ onBack }: Props) {
  const [archivoContrato, setArchivoContrato] = useState<File | null>(null);
  const [archivoBase64, setArchivoBase64] = useState<string>('');
  const [analizando, setAnalizando] = useState(false);
  const [resultado, setResultado] = useState<AnalisisContrato | null>(null);
  const [error, setError] = useState<string>('');
  const [dragOver, setDragOver] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [pasoActual, setPasoActual] = useState(0);
  const [intentoActual, setIntentoActual] = useState(0);
  const [seccionesAbiertas, setSeccionesAbiertas] = useState<Record<string, boolean>>({
    datos: true, leonino: true, riesgos: true, faltantes: true, resumen: true, blindado: false,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progresoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (progresoIntervalRef.current) clearInterval(progresoIntervalRef.current);
    };
  }, []);

  const handleFileSelect = async (file: File) => {
    if (!file) return;
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.docx') && !file.name.endsWith('.doc') && !file.name.endsWith('.png') && !file.name.endsWith('.jpg') && !file.name.endsWith('.jpeg')) {
      setError('Solo se aceptan archivos PDF, Word (.docx) o imágenes (PNG/JPG)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('El archivo no debe exceder 10MB');
      return;
    }
    setArchivoContrato(file);
    setError('');
    setResultado(null);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setArchivoBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  // ═══════════════════════════════════════════════════════════
  // PROGRESS BAR ANIMATION
  // ═══════════════════════════════════════════════════════════
  const iniciarProgreso = useCallback(() => {
    setProgreso(0);
    setPasoActual(0);
    let progresoActual = 0;
    let paso = 0;

    if (progresoIntervalRef.current) clearInterval(progresoIntervalRef.current);

    progresoIntervalRef.current = setInterval(() => {
      // Incrementar progreso gradualmente
      const targetPaso = PASOS_ANALISIS[paso]?.porcentaje || 95;
      const siguientePaso = PASOS_ANALISIS[paso + 1]?.porcentaje || 95;

      if (progresoActual < targetPaso) {
        // Velocidad variable: más rápido al inicio, más lento al final
        const incremento = progresoActual < 30 ? 2 : progresoActual < 60 ? 1.2 : progresoActual < 85 ? 0.6 : 0.2;
        progresoActual = Math.min(progresoActual + incremento, 95);
        setProgreso(Math.round(progresoActual));
      }

      // Avanzar al siguiente paso cuando alcance el porcentaje
      if (progresoActual >= targetPaso && paso < PASOS_ANALISIS.length - 1) {
        paso++;
        setPasoActual(paso);
      }
    }, 400);
  }, []);

  const detenerProgreso = useCallback((exito: boolean) => {
    if (progresoIntervalRef.current) {
      clearInterval(progresoIntervalRef.current);
      progresoIntervalRef.current = null;
    }
    if (exito) {
      setProgreso(100);
      setPasoActual(PASOS_ANALISIS.length);
    }
  }, []);

  // ═══════════════════════════════════════════════════════════
  // CORE ANALYSIS FUNCTION WITH RETRY
  // ═══════════════════════════════════════════════════════════
  const llamarEdgeFunction = async (intento: number): Promise<any> => {
    const controller = new AbortController();
    // Timeout de 120 segundos (Anthropic puede tardar 30-90s en contratos largos)
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/analizar-contrato`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          archivo_base64: archivoBase64,
          nombre_archivo: archivoContrato?.name || 'contrato.pdf',
          tipo_archivo: archivoContrato?.type || 'application/pdf',
          fecha_analisis: new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }),
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`HTTP ${response.status}: ${errorText || 'Error del servidor'}`);
      }

      const data = await response.json();
      return data;
    } catch (err: any) {
      clearTimeout(timeoutId);

      if (err.name === 'AbortError') {
        throw new Error('TIMEOUT: El análisis tardó demasiado. Esto puede pasar con contratos muy largos.');
      }
      if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError') || err.message?.includes('net::ERR_')) {
        throw new Error('CONEXION: No se pudo conectar con el servidor. Verifica tu conexión a internet.');
      }
      throw err;
    }
  };

  const analizarContrato = async () => {
    if (!archivoBase64 || !archivoContrato) return;
    setAnalizando(true);
    setError('');
    setResultado(null);
    setIntentoActual(0);
    iniciarProgreso();

    const MAX_INTENTOS = 3;

    for (let intento = 1; intento <= MAX_INTENTOS; intento++) {
      setIntentoActual(intento);
      try {
        const data = await llamarEdgeFunction(intento);

        if (data.success && data.analisis) {
          detenerProgreso(true);
          // Small delay to show 100%
          await new Promise(r => setTimeout(r, 600));
          setResultado(data.analisis);
          setAnalizando(false);
          return;
        } else {
          throw new Error(data.error || 'Respuesta inválida del servidor');
        }
      } catch (err: any) {
        console.error(`Intento ${intento}/${MAX_INTENTOS} falló:`, err.message);

        if (intento < MAX_INTENTOS) {
          // Reset progress partially for retry
          setProgreso(5);
          setPasoActual(0);
          // Wait before retry (exponential backoff: 2s, 4s)
          await new Promise(r => setTimeout(r, intento * 2000));
          // Restart progress animation
          iniciarProgreso();
        } else {
          // All retries exhausted
          detenerProgreso(false);
          let mensajeError = '';

          if (err.message?.startsWith('TIMEOUT:')) {
            mensajeError = 'El análisis tardó demasiado después de 3 intentos. Intenta con un archivo más pequeño o en formato PDF.';
          } else if (err.message?.startsWith('CONEXION:')) {
            mensajeError = 'No se pudo conectar con el servidor después de 3 intentos. Verifica tu conexión a internet y vuelve a intentar.';
          } else {
            mensajeError = `Error después de ${MAX_INTENTOS} intentos: ${err.message}`;
          }

          setError(mensajeError);
          setAnalizando(false);
        }
      }
    }
  };

  // ═══════════════════════════════════════════════════════════
  // RISK COLOR HELPER
  // ═══════════════════════════════════════════════════════════
  const riskColor = (score: number) => {
    if (score >= 7) return { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: 'ALTO' };
    if (score >= 4) return { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'MEDIO' };
    return { color: '#22c55e', bg: 'rgba(34,197,94,0.1)', label: 'BAJO' };
  };

  const severidadColor = (s: string) => {
    if (s === 'ALTA') return { bg: '#fee2e2', color: '#dc2626', border: '#fca5a5' };
    if (s === 'MEDIA') return { bg: '#fef3c7', color: '#d97706', border: '#fcd34d' };
    return { bg: '#d1fae5', color: '#059669', border: '#6ee7b7' };
  };

  const toggleSeccion = (key: string) => {
    setSeccionesAbiertas(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ═══════════════════════════════════════════════════════════
  // PDF GENERATORS
  // ═══════════════════════════════════════════════════════════
  const descargarAnalisisPDF = () => {
    if (!resultado) return;
    const rg = riskColor(resultado.calificacion_riesgo);
    let html = `<h1>📋 Análisis de Contrato</h1>
    <div class="header-meta">Archivo: ${archivoContrato?.name || 'N/A'} | Fecha: ${new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
    <div style="text-align:center;margin:20px 0;"><span class="risk-badge risk-${rg.label.toLowerCase()}" style="font-size:16pt;">RIESGO ${rg.label}: ${resultado.calificacion_riesgo}/10</span></div>`;

    if (resultado.es_leonino) {
      html += `<div class="warning-box"><strong>⚠️ CONTRATO LEONINO DETECTADO</strong><p>${resultado.explicacion_leonino}</p></div>`;
    }

    html += `<h2>Datos Extraídos</h2><table>
    <tr><th>Campo</th><th>Valor</th></tr>
    ${Object.entries(resultado.datos_extraidos).map(([k, v]) => `<tr><td>${k.replace(/_/g, ' ').toUpperCase()}</td><td>${Array.isArray(v) ? v.join(', ') : v || 'N/A'}</td></tr>`).join('')}
    </table>`;

    html += `<h2>Resumen Ejecutivo</h2><p>${resultado.resumen_ejecutivo}</p>`;

    html += `<h2>Riesgos Identificados (${resultado.riesgos.length})</h2>`;
    resultado.riesgos.forEach((r, i) => {
      html += `<div class="clausula-box"><h3>${i + 1}. ${r.clausula} <span class="risk-badge risk-${r.severidad.toLowerCase()}">${r.severidad}</span></h3><p><strong>Riesgo:</strong> ${r.descripcion}</p><p><strong>Sugerencia:</strong> ${r.sugerencia}</p></div>`;
    });

    if (resultado.clausulas_faltantes.length > 0) {
      html += `<h2>Cláusulas Faltantes</h2><ul>${resultado.clausulas_faltantes.map(c => `<li>${c}</li>`).join('')}</ul>`;
    }

    generarPDF('Análisis de Contrato - TROB', html, 'analisis_contrato');
  };

  const descargarBlindadaPDF = () => {
    if (!resultado) return;
    const html = `<h1>🛡️ Versión Blindada del Contrato</h1>
    <div class="header-meta">Archivo original: ${archivoContrato?.name || 'N/A'} | Generado: ${new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
    <div class="info-box"><strong>ℹ️ Nota:</strong> Esta versión incluye las modificaciones sugeridas para proteger los intereses de TROB TRANSPORTES. Debe ser revisada por el equipo legal antes de su firma.</div>
    <div style="white-space:pre-wrap;text-align:justify;line-height:2;">${resultado.version_blindada}</div>`;
    generarPDF('Versión Blindada - TROB', html, 'contrato_blindado');
  };

  const descargarRiesgosPDF = () => {
    if (!resultado) return;
    const rg = riskColor(resultado.calificacion_riesgo);
    let html = `<h1>⚠️ Reporte de Riesgos</h1>
    <div class="header-meta">Archivo: ${archivoContrato?.name || 'N/A'} | Fecha: ${new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
    <div style="text-align:center;margin:20px 0;"><span class="risk-badge risk-${rg.label.toLowerCase()}" style="font-size:16pt;">CALIFICACIÓN: ${resultado.calificacion_riesgo}/10 (${rg.label})</span></div>`;

    if (resultado.es_leonino) {
      html += `<div class="warning-box"><strong>⚠️ CONTRATO LEONINO</strong><p>${resultado.explicacion_leonino}</p></div>`;
    }

    const altas = resultado.riesgos.filter(r => r.severidad === 'ALTA');
    const medias = resultado.riesgos.filter(r => r.severidad === 'MEDIA');
    const bajas = resultado.riesgos.filter(r => r.severidad === 'BAJA');

    html += `<h2>Resumen de Riesgos</h2><table>
    <tr><th>Severidad</th><th>Cantidad</th></tr>
    <tr><td><span class="risk-badge risk-alta">ALTA</span></td><td>${altas.length}</td></tr>
    <tr><td><span class="risk-badge risk-media">MEDIA</span></td><td>${medias.length}</td></tr>
    <tr><td><span class="risk-badge risk-baja">BAJA</span></td><td>${bajas.length}</td></tr>
    </table>`;

    [...altas, ...medias, ...bajas].forEach((r, i) => {
      html += `<div class="clausula-box"><h3>${i + 1}. ${r.clausula} <span class="risk-badge risk-${r.severidad.toLowerCase()}">${r.severidad}</span></h3><p>${r.descripcion}</p><p><strong>Recomendación:</strong> ${r.sugerencia}</p></div>`;
    });

    if (resultado.clausulas_faltantes.length > 0) {
      html += `<h2>Cláusulas que DEBEN Agregarse</h2><ul>${resultado.clausulas_faltantes.map(c => `<li style="margin:8px 0;">${c}</li>`).join('')}</ul>`;
    }

    generarPDF('Reporte de Riesgos - TROB', html, 'riesgos_contrato');
  };

  // ═══════════════════════════════════════════════════════════
  // COLLAPSIBLE SECTION COMPONENT
  // ═══════════════════════════════════════════════════════════
  const Seccion = ({ id, titulo, icono, children, badge }: { id: string; titulo: string; icono: React.ReactNode; children: React.ReactNode; badge?: React.ReactNode }) => (
    <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <button onClick={() => toggleSeccion(id)} className="w-full flex items-center justify-between p-4 hover:brightness-110 transition-all" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="flex items-center gap-3">
          {icono}
          <span style={{ fontFamily: F, fontSize: '15px', fontWeight: 700, color: '#fff' }}>{titulo}</span>
          {badge}
        </div>
        {seccionesAbiertas[id] ? <ChevronUp className="w-5 h-5 text-white/40" /> : <ChevronDown className="w-5 h-5 text-white/40" />}
      </button>
      {seccionesAbiertas[id] && <div className="px-5 pb-5">{children}</div>}
    </div>
  );

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="min-h-full relative" style={{ background: 'linear-gradient(135deg, #0a0f1c 0%, #111827 50%, #0d1424 100%)' }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 py-3 flex items-center gap-4" style={{ background: 'rgba(10,15,28,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-white/5 transition-all">
          <ArrowLeft className="w-5 h-5 text-white/70" />
        </button>
        <div>
          <h1 style={{ fontFamily: F, fontSize: '20px', fontWeight: 700, color: '#fff' }}>Análisis de Contratos con IA</h1>
          <p style={{ fontFamily: F, fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Detecta cláusulas leoninas, riesgos y genera versión blindada para TROB</p>
        </div>
      </div>

      <div className="relative z-10 px-4 py-6 max-w-full mx-auto space-y-5">
        {/* ═══ UPLOAD ZONE ═══ */}
        {!resultado && (
          <div className="space-y-5">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="relative rounded-2xl p-8 text-center cursor-pointer transition-all hover:brightness-110"
              style={{
                background: dragOver ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.03)',
                border: dragOver ? '2px dashed #7c3aed' : '2px dashed rgba(255,255,255,0.12)',
                minHeight: '200px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                onChange={(e) => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]); }}
              />
              {archivoContrato ? (
                <>
                  <FileText className="w-14 h-14 mb-3" style={{ color: '#22d3ee' }} />
                  <p style={{ fontFamily: F, fontSize: '16px', fontWeight: 700, color: '#fff' }}>{archivoContrato.name}</p>
                  <p style={{ fontFamily: F, fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
                    {(archivoContrato.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                  <button
                    onClick={(e) => { e.stopPropagation(); setArchivoContrato(null); setArchivoBase64(''); setError(''); }}
                    className="mt-3 flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/10 transition-all"
                    style={{ fontFamily: F, fontSize: '13px', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <RotateCcw className="w-4 h-4" /> Cambiar
                  </button>
                </>
              ) : (
                <>
                  <Upload className="w-14 h-14 mb-3" style={{ color: 'rgba(255,255,255,0.2)' }} />
                  <p style={{ fontFamily: F, fontSize: '16px', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Arrastra tu contrato aquí</p>
                  <p style={{ fontFamily: F, fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '4px' }}>PDF, Word (.docx), o imagen (PNG/JPG) — Máx 10MB</p>
                </>
              )}
            </div>

            {/* ═══ ERROR MESSAGE ═══ */}
            {error && (
              <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#ef4444' }} />
                <div>
                  <p style={{ fontFamily: F, fontSize: '14px', color: '#fca5a5' }}>{error}</p>
                  {error.includes('intentos') && (
                    <button
                      onClick={analizarContrato}
                      className="mt-2 flex items-center gap-2 px-4 py-2 rounded-lg hover:brightness-110 transition-all"
                      style={{ background: 'rgba(124,58,237,0.3)', fontFamily: F, fontSize: '13px', color: '#c4b5fd' }}
                    >
                      <RefreshCw className="w-4 h-4" /> Reintentar
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ═══ ANALYZE BUTTON ═══ */}
            {archivoContrato && !analizando && (
              <div className="flex justify-center">
                <button
                  onClick={analizarContrato}
                  disabled={!archivoBase64}
                  className="flex items-center gap-3 px-8 py-4 rounded-xl transition-all hover:brightness-110 disabled:opacity-40"
                  style={{
                    background: archivoBase64 ? 'linear-gradient(135deg, #7c3aed, #5b21b6)' : 'rgba(255,255,255,0.05)',
                    fontFamily: F, fontSize: '16px', fontWeight: 600, color: '#fff',
                    boxShadow: archivoBase64 ? '0 4px 20px rgba(124,58,237,0.4)' : 'none',
                  }}
                >
                  <ShieldCheck className="w-6 h-6" /> Analizar Contrato
                </button>
              </div>
            )}

            {/* ═══ PROGRESS BAR ═══ */}
            {analizando && (
              <div className="rounded-2xl p-6 space-y-5" style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
                {/* Percentage header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#a78bfa' }} />
                    <span style={{ fontFamily: F, fontSize: '15px', fontWeight: 700, color: '#fff' }}>
                      Analizando contrato...
                    </span>
                  </div>
                  <span style={{ fontFamily: F, fontSize: '24px', fontWeight: 800, color: '#a78bfa' }}>
                    {progreso}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full rounded-full overflow-hidden" style={{ height: '10px', background: 'rgba(255,255,255,0.06)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${progreso}%`,
                      background: 'linear-gradient(90deg, #7c3aed, #a78bfa, #c4b5fd)',
                      boxShadow: '0 0 12px rgba(124,58,237,0.5)',
                    }}
                  />
                </div>

                {/* Step indicators */}
                <div className="space-y-2.5">
                  {PASOS_ANALISIS.map((paso, i) => {
                    const completado = progreso >= paso.porcentaje;
                    const activo = pasoActual === i;
                    return (
                      <div key={i} className="flex items-center gap-3" style={{ opacity: completado ? 1 : activo ? 0.8 : 0.35 }}>
                        {completado ? (
                          <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: '#22c55e' }} />
                        ) : activo ? (
                          <Loader2 className="w-5 h-5 flex-shrink-0 animate-spin" style={{ color: '#a78bfa' }} />
                        ) : (
                          <div className="w-5 h-5 rounded-full flex-shrink-0" style={{ border: '2px solid rgba(255,255,255,0.15)' }} />
                        )}
                        <span style={{
                          fontFamily: F,
                          fontSize: '13px',
                          fontWeight: completado || activo ? 600 : 400,
                          color: completado ? '#22c55e' : activo ? '#c4b5fd' : 'rgba(255,255,255,0.4)',
                        }}>
                          {paso.texto} {completado && '✓'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Retry indicator */}
                {intentoActual > 1 && (
                  <div className="flex items-center gap-2 pt-1" style={{ fontFamily: F, fontSize: '12px', color: '#f59e0b' }}>
                    <RefreshCw className="w-4 h-4" />
                    Reintentando... (intento {intentoActual} de 3)
                  </div>
                )}

                {/* Estimated time */}
                <p style={{ fontFamily: F, fontSize: '11px', color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
                  Tiempo estimado: 30-90 segundos dependiendo del tamaño del contrato
                </p>
              </div>
            )}
          </div>
        )}

        {/* ═══ RESULTS ═══ */}
        {resultado && (
          <div className="space-y-4">
            {/* ═══ RISK SEMAPHORE + DOWNLOAD BUTTONS ═══ */}
            {(() => {
              const rg = riskColor(resultado.calificacion_riesgo);
              return (
                <div className="rounded-xl p-5" style={{ background: rg.bg, border: '1px solid ' + rg.color + '40' }}>
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      {/* Traffic light */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: resultado.calificacion_riesgo >= 7 ? '#ef4444' : 'rgba(239,68,68,0.2)', border: '2px solid #ef4444', boxShadow: resultado.calificacion_riesgo >= 7 ? '0 0 12px rgba(239,68,68,0.6)' : 'none' }} />
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: resultado.calificacion_riesgo >= 4 && resultado.calificacion_riesgo <= 6 ? '#f59e0b' : 'rgba(245,158,11,0.2)', border: '2px solid #f59e0b', boxShadow: resultado.calificacion_riesgo >= 4 && resultado.calificacion_riesgo <= 6 ? '0 0 12px rgba(245,158,11,0.6)' : 'none' }} />
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: resultado.calificacion_riesgo <= 3 ? '#22c55e' : 'rgba(34,197,94,0.2)', border: '2px solid #22c55e', boxShadow: resultado.calificacion_riesgo <= 3 ? '0 0 12px rgba(34,197,94,0.6)' : 'none' }} />
                      </div>
                      <div>
                        <p style={{ fontFamily: F, fontSize: '17px', fontWeight: 700, color: rg.color }}>
                          RIESGO {rg.label} — {resultado.calificacion_riesgo}/10
                        </p>
                        <p style={{ fontFamily: F, fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                          {resultado.riesgos.length} riesgos detectados{resultado.es_leonino && ' — CONTRATO LEONINO'}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={descargarAnalisisPDF} className="flex items-center gap-2 px-4 py-2.5 rounded-lg hover:brightness-110 transition-all" style={{ background: 'linear-gradient(135deg, #fe5000, #cc4000)', fontFamily: F, fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                        <Download className="w-4 h-4" /> Análisis PDF
                      </button>
                      <button onClick={descargarBlindadaPDF} className="flex items-center gap-2 px-4 py-2.5 rounded-lg hover:brightness-110 transition-all" style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)', fontFamily: F, fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                        <Shield className="w-4 h-4" /> Blindada PDF
                      </button>
                      <button onClick={descargarRiesgosPDF} className="flex items-center gap-2 px-4 py-2.5 rounded-lg hover:brightness-110 transition-all" style={{ background: 'linear-gradient(135deg, #dc2626, #991b1b)', fontFamily: F, fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                        <AlertTriangle className="w-4 h-4" /> Riesgos PDF
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* LEONINO WARNING */}
            {resultado.es_leonino && (
              <div className="rounded-xl p-5" style={{ background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.4)' }}>
                <div className="flex items-start gap-3">
                  <ShieldAlert className="w-6 h-6 flex-shrink-0" style={{ color: '#ef4444' }} />
                  <div>
                    <p style={{ fontFamily: F, fontSize: '16px', fontWeight: 700, color: '#ef4444' }}>⚠️ Contrato Leonino Detectado</p>
                    <p style={{ fontFamily: F, fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginTop: '4px', lineHeight: '1.6' }}>
                      {resultado.explicacion_leonino}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* DATOS EXTRAIDOS */}
            <Seccion id="datos" titulo="Datos Extraídos del Contrato" icono={<FileSearch className="w-5 h-5" style={{ color: '#22d3ee' }} />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(resultado.datos_extraidos).map(([key, value]) => (
                  <div key={key} className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <p style={{ fontFamily: F, fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {key.replace(/_/g, ' ')}
                    </p>
                    <p style={{ fontFamily: F, fontSize: '14px', color: '#fff', marginTop: '2px' }}>
                      {Array.isArray(value) ? value.join(', ') : value || 'No especificado'}
                    </p>
                  </div>
                ))}
              </div>
            </Seccion>

            {/* RESUMEN EJECUTIVO */}
            <Seccion id="resumen" titulo="Resumen Ejecutivo" icono={<FileText className="w-5 h-5" style={{ color: '#a78bfa' }} />}>
              <p style={{ fontFamily: F, fontSize: '14px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                {resultado.resumen_ejecutivo}
              </p>
            </Seccion>

            {/* RIESGOS */}
            <Seccion
              id="riesgos"
              titulo={`Riesgos Identificados`}
              icono={<AlertTriangle className="w-5 h-5" style={{ color: '#f59e0b' }} />}
              badge={
                <span className="px-2 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.2)', fontFamily: F, fontSize: '12px', fontWeight: 700, color: '#f59e0b' }}>
                  {resultado.riesgos.length}
                </span>
              }
            >
              <div className="space-y-3">
                {resultado.riesgos.map((r, i) => {
                  const sc = severidadColor(r.severidad);
                  return (
                    <div key={i} className="rounded-lg p-4" style={{ background: 'rgba(255,255,255,0.02)', borderLeft: `4px solid ${sc.color}` }}>
                      <div className="flex items-center justify-between mb-2">
                        <p style={{ fontFamily: F, fontSize: '14px', fontWeight: 700, color: '#fff' }}>{r.clausula}</p>
                        <span className="px-2.5 py-1 rounded-full" style={{ background: sc.bg, fontFamily: F, fontSize: '11px', fontWeight: 700, color: sc.color }}>
                          {r.severidad}
                        </span>
                      </div>
                      <p style={{ fontFamily: F, fontSize: '13px', color: 'rgba(255,255,255,0.65)', lineHeight: '1.5' }}>{r.descripcion}</p>
                      <div className="mt-2 p-2.5 rounded-lg" style={{ background: 'rgba(124,58,237,0.08)' }}>
                        <p style={{ fontFamily: F, fontSize: '12px', color: '#c4b5fd' }}>
                          <strong>Sugerencia:</strong> {r.sugerencia}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Seccion>

            {/* CLAUSULAS FALTANTES */}
            {resultado.clausulas_faltantes.length > 0 && (
              <Seccion
                id="faltantes"
                titulo="Cláusulas Faltantes"
                icono={<FileWarning className="w-5 h-5" style={{ color: '#fb923c' }} />}
                badge={
                  <span className="px-2 py-0.5 rounded-full" style={{ background: 'rgba(251,146,60,0.2)', fontFamily: F, fontSize: '12px', fontWeight: 700, color: '#fb923c' }}>
                    {resultado.clausulas_faltantes.length}
                  </span>
                }
              >
                <div className="space-y-2">
                  {resultado.clausulas_faltantes.map((c, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'rgba(251,146,60,0.05)' }}>
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#fb923c' }} />
                      <p style={{ fontFamily: F, fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.5' }}>{c}</p>
                    </div>
                  ))}
                </div>
              </Seccion>
            )}

            {/* VERSION BLINDADA */}
            <Seccion id="blindado" titulo="Versión Blindada (Sugerida)" icono={<Shield className="w-5 h-5" style={{ color: '#7c3aed' }} />}>
              <p style={{ fontFamily: F, fontSize: '14px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                {resultado.version_blindada}
              </p>
            </Seccion>

            {/* NEW ANALYSIS BUTTON */}
            <div className="flex justify-center pt-2 pb-6">
              <button
                onClick={() => { setResultado(null); setArchivoContrato(null); setArchivoBase64(''); setError(''); setProgreso(0); }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl hover:bg-white/10 transition-all"
                style={{ border: '1px solid rgba(255,255,255,0.15)', fontFamily: F, fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}
              >
                <RotateCcw className="w-4 h-4" /> Analizar otro contrato
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
