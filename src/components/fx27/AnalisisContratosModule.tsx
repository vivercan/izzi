import { useState, useRef } from 'react';
import { Scale, FileText, Upload, Loader2, AlertCircle, ArrowLeft, Shield, ShieldAlert, ShieldCheck, FileWarning, ChevronDown, ChevronUp, AlertTriangle, FileDown, RotateCcw, CheckCircle2, Download } from 'lucide-react';
const supabaseUrl = 'https://fbxbsslhewchyibdoyzk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieGJzc2xoZXdjaHlpYmRveXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzczODEsImV4cCI6MjA3ODExMzM4MX0.Z8JPlg7hhKbA624QGHp2bKKTNtCD3WInQMO5twjl6a0';
interface RiesgoContrato { clausula: string; descripcion: string; severidad: 'ALTA'|'MEDIA'|'BAJA'; sugerencia: string; }
interface AnalisisContrato { datos_extraidos: { representante_legal: string; notaria: string; numero_escritura: string; fecha_contrato: string; partes: string[]; objeto_contrato: string; vigencia: string; monto_o_tarifa: string; }; es_leonino: boolean; explicacion_leonino: string; riesgos: RiesgoContrato[]; resumen_ejecutivo: string; clausulas_faltantes: string[]; version_blindada: string; contrato_llenado: string; calificacion_riesgo: number; }
interface Props { onBack: () => void; }

// ═══ PDF Generator ═══
function generarPDF(titulo: string, contenido: string, color: string) {
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${titulo}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@400;600;700&display=swap');
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Exo 2', Arial, sans-serif; color: #1a1a2e; padding: 40px; line-height: 1.6; }
.header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid ${color}; padding-bottom: 20px; margin-bottom: 30px; }
.logo-area { display: flex; align-items: center; gap: 15px; }
.logo-text { font-size: 28px; font-weight: 700; color: ${color}; }
.logo-sub { font-size: 12px; color: #666; }
.badge { background: ${color}; color: #fff; padding: 8px 20px; border-radius: 8px; font-weight: 700; font-size: 14px; }
.fecha { text-align: right; font-size: 12px; color: #888; }
.section { margin-bottom: 25px; }
.section-title { font-size: 16px; font-weight: 700; color: ${color}; border-bottom: 1px solid #e0e0e0; padding-bottom: 8px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
.content { font-size: 13px; white-space: pre-wrap; line-height: 1.8; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
.grid-item { background: #f5f7fa; padding: 10px 14px; border-radius: 6px; border-left: 3px solid ${color}; }
.grid-label { font-size: 10px; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 0.05em; }
.grid-value { font-size: 13px; font-weight: 600; color: #1a1a2e; margin-top: 2px; }
.risk-item { background: #fff8f0; border: 1px solid #fde0c0; border-radius: 8px; padding: 12px; margin-bottom: 10px; }
.risk-alta { border-color: #ef4444; background: #fef2f2; }
.risk-media { border-color: #f59e0b; background: #fffbeb; }
.risk-baja { border-color: #3b82f6; background: #eff6ff; }
.risk-badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; color: #fff; }
.alta { background: #ef4444; } .media { background: #f59e0b; } .baja { background: #3b82f6; }
.footer { margin-top: 40px; border-top: 2px solid #e0e0e0; padding-top: 15px; font-size: 11px; color: #999; text-align: center; }
@media print { body { padding: 20px; } .no-print { display: none; } }
</style></head><body>
<div class="no-print" style="text-align:center;margin-bottom:20px;">
  <button onclick="window.print()" style="background:${color};color:#fff;border:none;padding:12px 30px;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;font-family:'Exo 2',sans-serif;">⬇ Descargar PDF</button>
  <p style="margin-top:8px;font-size:12px;color:#888;">Usa Ctrl+P o el botón para guardar como PDF</p>
</div>
${contenido}
<div class="footer">Generado por FX27 — GRUPO LOMA | TROB TRANSPORTES — ${new Date().toLocaleString('es-MX')}</div>
</body></html>`);
  w.document.close();
}

function SectionCard({ title, icon, open, onToggle, children, bg, borderColor }: { title: string; icon: React.ReactNode; open: boolean; onToggle: () => void; children: React.ReactNode; bg?: string; borderColor?: string; }) {
  return (<div className="rounded-xl overflow-hidden" style={{ background: bg || 'rgba(255,255,255,0.03)', border: '1px solid ' + (borderColor || 'rgba(255,255,255,0.08)') }}><button onClick={onToggle} className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors"><div className="flex items-center gap-3">{icon}<span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '16px', fontWeight: 600, color: '#fff' }}>{title}</span></div>{open ? <ChevronUp className="w-5 h-5 text-white/40" /> : <ChevronDown className="w-5 h-5 text-white/40" />}</button>{open && <div className="px-5 pb-5">{children}</div>}</div>);
}

export default function AnalisisContratosModule({ onBack }: Props) {
  const [archivoContrato, setArchivoContrato] = useState<File | null>(null);
  const [archivoBase64, setArchivoBase64] = useState('');
  const [analizando, setAnalizando] = useState(false);
  const [resultado, setResultado] = useState<AnalisisContrato | null>(null);
  const [error, setError] = useState('');
  const [secciones, setSecciones] = useState<Record<string, boolean>>({ contratoLlenado: false, datos: true, leonino: true, riesgos: true, faltantes: true, resumen: true, blindado: false });
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const handleFile = (file: File) => { if (!file) return; if (file.size > 25*1024*1024) { setError('Max 25MB'); return; } setArchivoContrato(file); setError(''); setResultado(null); const r = new FileReader(); r.onload = () => setArchivoBase64((r.result as string).split(',')[1]); r.readAsDataURL(file); };
  const analizar = async () => { if (!archivoBase64 || !archivoContrato) return; setAnalizando(true); setError(''); setResultado(null); try { const res = await fetch(supabaseUrl+'/functions/v1/analizar-contrato', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer '+supabaseAnonKey }, body: JSON.stringify({ archivo_base64: archivoBase64, nombre_archivo: archivoContrato.name, tipo_archivo: archivoContrato.type || 'application/pdf', fecha_analisis: new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }) }) }); const data = await res.json(); if (data.success && data.analisis) setResultado(data.analisis); else setError(data.error || 'Error al analizar'); } catch { setError('Error de conexion'); } finally { setAnalizando(false); } };
  const reset = () => { setArchivoContrato(null); setArchivoBase64(''); setResultado(null); setError(''); };
  const toggle = (s: string) => setSecciones(p => ({ ...p, [s]: !p[s] }));
  const sevColor = (s: string) => s === 'ALTA' ? { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.4)', text: '#fca5a5' } : s === 'MEDIA' ? { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)', text: '#fcd34d' } : { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.4)', text: '#93c5fd' };
  const riskColor = (n: number) => n <= 3 ? { color: '#22c55e', label: 'BAJO', bg: 'rgba(34,197,94,0.15)' } : n <= 6 ? { color: '#f59e0b', label: 'MEDIO', bg: 'rgba(245,158,11,0.15)' } : { color: '#ef4444', label: 'ALTO', bg: 'rgba(239,68,68,0.15)' };
  const F = "'Exo 2', sans-serif";

  // ═══ DESCARGAR CONTRATO LLENADO (PDF) ═══
  const descargarContratoLlenado = () => {
    if (!resultado) return;
    const r = resultado;
    const html = `
<div class="header">
  <div class="logo-area"><div class="logo-text">FX27</div><div><div style="font-size:18px;font-weight:700;">Contrato Completo</div><div class="logo-sub">${archivoContrato?.name || 'Contrato'}</div></div></div>
  <div><div class="fecha">${new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}</div></div>
</div>
<div class="section"><div class="content" style="font-size:13px;line-height:2;">${r.contrato_llenado || r.version_blindada || 'No se pudo generar el contrato llenado.'}</div></div>`;
    generarPDF('Contrato — ' + (archivoContrato?.name || ''), html, '#1a1a2e');
  };

  // ═══ DESCARGAR VERSIÓN BLINDADA (PDF) ═══
  const descargarBlindada = () => {
    if (!resultado) return;
    const r = resultado;
    const html = `
<div class="header">
  <div class="logo-area"><div class="logo-text">FX27</div><div><div style="font-size:18px;font-weight:700;">Versión Blindada para TROB</div><div class="logo-sub">Protección legal — ${archivoContrato?.name || 'Contrato'}</div></div></div>
  <div><div class="badge" style="background:#22c55e;">VERSIÓN PROTEGIDA</div><div class="fecha">${new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}</div></div>
</div>
<div class="section"><div class="section-title" style="color:#22c55e;">Contrato Blindado — Listo para Firma</div>
<div class="content" style="font-size:13px;line-height:2;">${resultado.version_blindada}</div></div>
<div class="section" style="margin-top:40px;">
<div class="grid">
  <div class="grid-item" style="border-left-color:#22c55e;"><div class="grid-label">Representante Legal TROB</div><div class="grid-value">Alejandro López Ramírez</div></div>
  <div class="grid-item" style="border-left-color:#22c55e;"><div class="grid-label">Escritura</div><div class="grid-value">21,183 — Vol 494 — Notaría 35</div></div>
  <div class="grid-item" style="border-left-color:#22c55e;"><div class="grid-label">RFC</div><div class="grid-value">TTR151216CHA</div></div>
  <div class="grid-item" style="border-left-color:#22c55e;"><div class="grid-label">Jurisdicción</div><div class="grid-value">Aguascalientes, Aguascalientes</div></div>
</div></div>`;
    generarPDF('Versión Blindada TROB — ' + (archivoContrato?.name || ''), html, '#22c55e');
  };

  // ═══ DESCARGAR ANÁLISIS DE RIESGOS (PDF) ═══
  const descargarRiesgos = () => {
    if (!resultado) return;
    const r = resultado;
    const rg = riskColor(r.calificacion_riesgo);
    let riesgosHtml = r.riesgos.map((ri, i) => {
      const cls = ri.severidad === 'ALTA' ? 'risk-alta' : ri.severidad === 'MEDIA' ? 'risk-media' : 'risk-baja';
      const badge = ri.severidad.toLowerCase();
      return `<div class="risk-item ${cls}"><div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:6px;"><strong style="font-size:14px;">${i+1}. ${ri.clausula}</strong><span class="risk-badge ${badge}">${ri.severidad}</span></div><p style="font-size:12px;color:#555;margin-bottom:6px;">${ri.descripcion}</p><div style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);border-radius:6px;padding:8px;"><p style="font-size:11px;color:#16a34a;"><strong>✅ Sugerencia:</strong> ${ri.sugerencia}</p></div></div>`;
    }).join('');

    let faltantesHtml = '';
    if (r.clausulas_faltantes.length > 0) {
      faltantesHtml = `<div class="section"><div class="section-title" style="color:#f59e0b;">Cláusulas Faltantes (${r.clausulas_faltantes.length})</div>` + r.clausulas_faltantes.map((cl, i) => `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:10px;margin-bottom:6px;font-size:12px;"><strong style="color:#f59e0b;">${i+1}.</strong> ${cl}</div>`).join('') + `</div>`;
    }

    const html = `
<div class="header">
  <div class="logo-area"><div class="logo-text">FX27</div><div><div style="font-size:18px;font-weight:700;">Análisis de Riesgos</div><div class="logo-sub">${archivoContrato?.name || 'Contrato'}</div></div></div>
  <div><div class="badge" style="background:${rg.color};">RIESGO ${rg.label} — ${r.calificacion_riesgo}/10</div><div class="fecha">${new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}</div></div>
</div>
<div class="section"><div class="section-title" style="color:${rg.color};">Semáforo de Riesgo</div>
<div style="text-align:center;padding:20px;">
  <div style="display:inline-block;width:80px;height:80px;border-radius:50%;background:${rg.color};color:#fff;font-size:32px;font-weight:700;line-height:80px;">${r.calificacion_riesgo}</div>
  <p style="font-size:20px;font-weight:700;color:${rg.color};margin-top:10px;">RIESGO ${rg.label}</p>
  <p style="font-size:13px;color:#666;">${r.riesgos.length} puntos de riesgo identificados${r.es_leonino ? ' — CONTRATO LEONINO DETECTADO' : ''}</p>
</div></div>
<div class="section"><div class="section-title">Análisis Leonino — ${r.es_leonino ? '⚠️ DETECTADO' : '✅ NO DETECTADO'}</div><div class="content" style="font-size:12px;">${r.explicacion_leonino}</div></div>
<div class="section"><div class="section-title" style="color:#ef4444;">Puntos de Riesgo (${r.riesgos.length})</div>${riesgosHtml}</div>
${faltantesHtml}
<div class="section"><div class="section-title">Resumen Ejecutivo</div><div class="content" style="font-size:12px;">${r.resumen_ejecutivo}</div></div>`;
    generarPDF('Análisis de Riesgos — ' + (archivoContrato?.name || ''), html, rg.color);
  };

  return (
    <div className="relative w-full min-h-screen overflow-auto">
      <div className="fixed inset-0" style={{ background: 'linear-gradient(135deg, #001f4d 0%, #003d7a 25%, #0066cc 50%, #1a8fff 75%, #4da6ff 100%)', zIndex: 0 }} />
      <div className="fixed inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.25) 100%)', zIndex: 0 }} />
      <div className="sticky top-0 z-40" style={{ height: '80px', background: 'linear-gradient(180deg, rgba(15,25,45,0.92) 0%, rgba(10,18,32,0.75) 100%)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(80,120,180,0.15)' }}>
        <div className="h-full flex items-center justify-between px-6">
          <button onClick={onBack} style={{ background: '#fe5000', borderRadius: '8px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}><ArrowLeft style={{ width: '20px', height: '20px', color: '#fff' }} /></button>
          <span style={{ fontFamily: F, fontSize: '20px', fontWeight: 600, color: '#fff', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>Análisis de Contratos</span>
          <img src="/fx27-logo.png" alt="FX27" style={{ height: '45px' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        </div>
      </div>
      <div className="relative z-10 p-4 px-6" style={{ maxWidth: '100%' }}>
        <div className="flex items-center gap-4 mb-6"><div className="p-3 rounded-xl" style={{ background: 'rgba(139,92,246,0.2)' }}><ShieldCheck className="w-8 h-8" style={{ color: '#a78bfa' }} /></div><div><h3 style={{ fontFamily: F, fontSize: '22px', fontWeight: 600, color: '#fff' }}>Análisis de Contratos con IA</h3><p style={{ fontFamily: F, fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Detecta cláusulas leoninas, riesgos y genera versión blindada para TROB</p></div></div>

        {!resultado && (
          <div className="rounded-xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="rounded-xl p-10 text-center cursor-pointer transition-all" style={{ background: dragOver ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.02)', border: '2px dashed '+(dragOver ? 'rgba(139,92,246,0.6)' : archivoContrato ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.15)') }} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }} onClick={() => fileRef.current?.click()}>
              <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.xlsx,.xls,.csv,.png,.jpg,.jpeg" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
              {archivoContrato ? (<div className="flex flex-col items-center gap-3"><div className="p-4 rounded-full" style={{ background: 'rgba(34,197,94,0.15)' }}><FileText className="w-10 h-10" style={{ color: '#22c55e' }} /></div><p style={{ fontFamily: F, fontSize: '16px', fontWeight: 600, color: '#fff' }}>{archivoContrato.name}</p><p style={{ fontFamily: F, fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{(archivoContrato.size/1024/1024).toFixed(2)} MB</p><button onClick={(e) => { e.stopPropagation(); reset(); }} className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/10" style={{ border: '1px solid rgba(255,255,255,0.15)' }}><RotateCcw className="w-4 h-4 text-white/60" /><span style={{ fontFamily: F, fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Cambiar</span></button></div>) : (<div className="flex flex-col items-center gap-3"><div className="p-4 rounded-full" style={{ background: 'rgba(139,92,246,0.1)' }}><Upload className="w-10 h-10" style={{ color: 'rgba(255,255,255,0.4)' }} /></div><p style={{ fontFamily: F, fontSize: '16px', fontWeight: 500, color: 'rgba(255,255,255,0.8)' }}>Arrastra el contrato o haz clic</p><p style={{ fontFamily: F, fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>PDF, Word, Excel, Imágenes — Máx 25MB</p></div>)}
            </div>
            {error && <div className="mt-4 p-4 rounded-lg flex items-center gap-3" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}><AlertCircle className="w-5 h-5" style={{ color: '#ef4444' }} /><span style={{ fontFamily: F, fontSize: '14px', color: '#fca5a5' }}>{error}</span></div>}
            <button onClick={analizar} disabled={!archivoContrato || analizando} className="w-full mt-5 flex items-center justify-center gap-3 py-4 rounded-lg transition-all disabled:opacity-40" style={{ background: archivoContrato ? 'linear-gradient(135deg, #7c3aed, #5b21b6)' : 'rgba(255,255,255,0.05)', fontFamily: F, fontSize: '15px', fontWeight: 600, color: '#fff' }}>{analizando ? <><Loader2 className="w-5 h-5 animate-spin" /> Analizando... 30-60 seg</> : <><ShieldCheck className="w-5 h-5" /> Analizar Contrato</>}</button>
            {analizando && <div className="mt-5 space-y-3">{['Extrayendo texto del documento...','Identificando partes y representantes...','Analizando cláusulas y condiciones...','Evaluando riesgos para TROB...','Generando versión blindada...'].map((p,i) => <div key={i} className="flex items-center gap-3 animate-pulse" style={{ animationDelay: i*0.3+'s' }}><div className="w-2 h-2 rounded-full" style={{ background: '#a78bfa' }} /><span style={{ fontFamily: F, fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{p}</span></div>)}</div>}
          </div>
        )}

        {resultado && (
          <div className="space-y-4">
            {/* ═══ BARRA SEMÁFORO + BOTONES ═══ */}
            {(() => { const rg = riskColor(resultado.calificacion_riesgo); return (
              <div className="rounded-xl p-5" style={{ background: rg.bg, border: '1px solid '+rg.color+'40' }}>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    {/* Semáforo */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: resultado.calificacion_riesgo >= 7 ? '#ef4444' : 'rgba(239,68,68,0.2)', border: '2px solid #ef4444', boxShadow: resultado.calificacion_riesgo >= 7 ? '0 0 12px rgba(239,68,68,0.6)' : 'none' }} />
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: resultado.calificacion_riesgo >= 4 && resultado.calificacion_riesgo <= 6 ? '#f59e0b' : 'rgba(245,158,11,0.2)', border: '2px solid #f59e0b', boxShadow: resultado.calificacion_riesgo >= 4 && resultado.calificacion_riesgo <= 6 ? '0 0 12px rgba(245,158,11,0.6)' : 'none' }} />
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: resultado.calificacion_riesgo <= 3 ? '#22c55e' : 'rgba(34,197,94,0.2)', border: '2px solid #22c55e', boxShadow: resultado.calificacion_riesgo <= 3 ? '0 0 12px rgba(34,197,94,0.6)' : 'none' }} />
                    </div>
                    <div>
                      <p style={{ fontFamily: F, fontSize: '20px', fontWeight: 700, color: rg.color }}>RIESGO {rg.label} — {resultado.calificacion_riesgo}/10</p>
                      <p style={{ fontFamily: F, fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>{resultado.riesgos.length} riesgos{resultado.es_leonino && ' — CONTRATO LEONINO DETECTADO'}</p>
                    </div>
                  </div>
                  {/* Botones de descarga */}
                  <div className="flex flex-wrap gap-2">
                    <button onClick={descargarContratoLlenado} className="flex items-center gap-2 px-4 py-2.5 rounded-lg hover:brightness-110 transition-all" style={{ background: 'linear-gradient(135deg, #0066cc, #004499)', fontFamily: F, fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                      <Download className="w-4 h-4" /> Contrato Completo
                    </button>
                    <button onClick={descargarBlindada} className="flex items-center gap-2 px-4 py-2.5 rounded-lg hover:brightness-110 transition-all" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', fontFamily: F, fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                      <ShieldCheck className="w-4 h-4" /> Blindada TROB
                    </button>
                    <button onClick={descargarRiesgos} className="flex items-center gap-2 px-4 py-2.5 rounded-lg hover:brightness-110 transition-all" style={{ background: 'linear-gradient(135deg, #fe5000, #cc4000)', fontFamily: F, fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                      <FileWarning className="w-4 h-4" /> Análisis Riesgos
                    </button>
                    <button onClick={reset} className="flex items-center gap-2 px-4 py-2.5 rounded-lg hover:bg-white/10 transition-colors" style={{ border: '1px solid rgba(255,255,255,0.2)', fontFamily: F, fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
                      <RotateCcw className="w-4 h-4" /> Nuevo
                    </button>
                  </div>
                </div>
              </div>); })()}

            {/* ═══ CONTRATO LLENADO ═══ */}
            {resultado.contrato_llenado && <SectionCard title="Contrato Completo (Llenado)" icon={<FileText className="w-5 h-5" style={{ color: '#fff' }} />} open={secciones.contratoLlenado} onToggle={() => toggle('contratoLlenado')} bg="rgba(255,255,255,0.04)" borderColor="rgba(255,255,255,0.12)">
              <p style={{ fontFamily: F, fontSize: '13px', color: 'rgba(255,255,255,0.85)', lineHeight: '1.9', whiteSpace: 'pre-wrap' }}>{resultado.contrato_llenado}</p>
            </SectionCard>}

            {/* ═══ DATOS EXTRAÍDOS ═══ */}
            <SectionCard title="Datos Extraídos" icon={<FileText className="w-5 h-5" style={{ color: '#a78bfa' }} />} open={secciones.datos} onToggle={() => toggle('datos')}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[{l:'Rep. Legal',v:resultado.datos_extraidos.representante_legal},{l:'Notaría',v:resultado.datos_extraidos.notaria},{l:'Escritura',v:resultado.datos_extraidos.numero_escritura},{l:'Fecha',v:resultado.datos_extraidos.fecha_contrato},{l:'Objeto',v:resultado.datos_extraidos.objeto_contrato},{l:'Vigencia',v:resultado.datos_extraidos.vigencia},{l:'Monto',v:resultado.datos_extraidos.monto_o_tarifa}].map(c => <div key={c.l} className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}><p style={{ fontFamily: F, fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>{c.l}</p><p style={{ fontFamily: F, fontSize: '13px', color: '#fff', marginTop: '2px' }}>{c.v || 'N/A'}</p></div>)}
                <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}><p style={{ fontFamily: F, fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Partes</p><p style={{ fontFamily: F, fontSize: '13px', color: '#fff', marginTop: '2px' }}>{resultado.datos_extraidos.partes.join(' — ')}</p></div>
              </div>
            </SectionCard>

            {/* ═══ LEONINO ═══ */}
            <SectionCard title={'Leonino — '+(resultado.es_leonino ? 'DETECTADO' : 'NO')} icon={resultado.es_leonino ? <AlertTriangle className="w-5 h-5" style={{ color: '#ef4444' }} /> : <ShieldCheck className="w-5 h-5" style={{ color: '#22c55e' }} />} open={secciones.leonino} onToggle={() => toggle('leonino')} bg={resultado.es_leonino ? 'rgba(239,68,68,0.05)' : 'rgba(34,197,94,0.05)'} borderColor={resultado.es_leonino ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}>
              <p style={{ fontFamily: F, fontSize: '13px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{resultado.explicacion_leonino}</p>
            </SectionCard>

            {/* ═══ RIESGOS ═══ */}
            <SectionCard title={'Riesgos ('+resultado.riesgos.length+')'} icon={<FileWarning className="w-5 h-5" style={{ color: '#f59e0b' }} />} open={secciones.riesgos} onToggle={() => toggle('riesgos')}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{resultado.riesgos.map((r,i) => { const c = sevColor(r.severidad); return (
                <div key={i} className="rounded-lg p-4" style={{ background: c.bg, border: '1px solid '+c.border }}>
                  <div className="flex items-start justify-between mb-2"><p style={{ fontFamily: F, fontSize: '14px', fontWeight: 600, color: '#fff' }}>{r.clausula}</p><span className="px-3 py-1 rounded-full text-xs font-bold flex-shrink-0" style={{ background: c.bg, color: c.text, border: '1px solid '+c.border }}>{r.severidad}</span></div>
                  <p style={{ fontFamily: F, fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>{r.descripcion}</p>
                  <div className="flex items-start gap-2 p-2.5 rounded-lg" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}><ShieldCheck className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: '#22c55e' }} /><p style={{ fontFamily: F, fontSize: '11px', color: '#86efac' }}><strong>Sugerencia:</strong> {r.sugerencia}</p></div>
                </div>); })}</div>
            </SectionCard>

            {/* ═══ FALTANTES ═══ */}
            {resultado.clausulas_faltantes.length > 0 && <SectionCard title={'Faltantes ('+resultado.clausulas_faltantes.length+')'} icon={<AlertTriangle className="w-5 h-5" style={{ color: '#f59e0b' }} />} open={secciones.faltantes} onToggle={() => toggle('faltantes')} bg="rgba(245,158,11,0.05)" borderColor="rgba(245,158,11,0.2)">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">{resultado.clausulas_faltantes.map((cl,i) => <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}><span style={{ fontFamily: F, fontSize: '13px', fontWeight: 700, color: '#f59e0b' }}>{i+1}.</span><p style={{ fontFamily: F, fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>{cl}</p></div>)}</div>
            </SectionCard>}

            {/* ═══ RESUMEN ═══ */}
            <SectionCard title="Resumen Ejecutivo" icon={<FileText className="w-5 h-5" style={{ color: '#3b82f6' }} />} open={secciones.resumen} onToggle={() => toggle('resumen')} bg="rgba(59,130,246,0.05)" borderColor="rgba(59,130,246,0.2)">
              <p style={{ fontFamily: F, fontSize: '13px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{resultado.resumen_ejecutivo}</p>
            </SectionCard>

            {/* ═══ BLINDADA ═══ */}
            <SectionCard title="Versión Blindada para TROB" icon={<ShieldCheck className="w-5 h-5" style={{ color: '#22c55e' }} />} open={secciones.blindado} onToggle={() => toggle('blindado')} bg="rgba(34,197,94,0.05)" borderColor="rgba(34,197,94,0.2)">
              <p style={{ fontFamily: F, fontSize: '13px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{resultado.version_blindada}</p>
            </SectionCard>

            {/* ═══ BOTONES FINALES ═══ */}
            <div className="flex flex-wrap justify-center gap-3 pt-4 pb-8">
              <button onClick={descargarContratoLlenado} className="flex items-center gap-3 px-6 py-3.5 rounded-xl hover:brightness-110" style={{ background: 'linear-gradient(135deg, #0066cc, #004499)', fontFamily: F, fontSize: '14px', fontWeight: 600, color: '#fff', boxShadow: '0 4px 12px rgba(0,102,204,0.3)' }}><Download className="w-5 h-5" /> Descargar Contrato Completo</button>
              <button onClick={descargarBlindada} className="flex items-center gap-3 px-6 py-3.5 rounded-xl hover:brightness-110" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', fontFamily: F, fontSize: '14px', fontWeight: 600, color: '#fff', boxShadow: '0 4px 12px rgba(34,197,94,0.3)' }}><ShieldCheck className="w-5 h-5" /> Descargar Blindada TROB</button>
              <button onClick={descargarRiesgos} className="flex items-center gap-3 px-6 py-3.5 rounded-xl hover:brightness-110" style={{ background: 'linear-gradient(135deg, #fe5000, #cc4000)', fontFamily: F, fontSize: '14px', fontWeight: 600, color: '#fff', boxShadow: '0 4px 12px rgba(254,80,0,0.3)' }}><FileWarning className="w-5 h-5" /> Descargar Análisis Riesgos</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
