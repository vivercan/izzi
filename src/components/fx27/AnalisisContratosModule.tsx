import { useState, useRef, useEffect, useCallback } from 'react';
import { FileSearch, FileText, Upload, Loader2, AlertCircle, ArrowLeft, Shield, ShieldAlert, ShieldCheck, FileWarning, ChevronDown, ChevronUp, AlertTriangle, Download, RefreshCw, RotateCcw, CheckCircle2 } from 'lucide-react';

const supabaseUrl = 'https://fbxbsslhewchyibdoyzk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieGJzc2xoZXdjaHlpYmRveXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzczODEsImV4cCI6MjA3ODExMzM4MX0.Z8JPlg7hhKbA624QGHp2bKKTNtCD3WInQMO5twjl6a0';
const F = "'Exo 2', sans-serif";

interface RiesgoContrato { clausula: string; descripcion: string; severidad: 'ALTA' | 'MEDIA' | 'BAJA'; sugerencia: string; }
interface AnalisisContrato {
  datos_extraidos: { representante_legal: string; notaria: string; numero_escritura: string; fecha_contrato: string; partes: string[]; objeto_contrato: string; vigencia: string; monto_o_tarifa: string; };
  es_leonino: boolean; explicacion_leonino: string; riesgos: RiesgoContrato[]; resumen_ejecutivo: string; clausulas_faltantes: string[]; version_blindada: string; calificacion_riesgo: number;
}
interface Props { onBack: () => void; }

// ═══ BROWSER .DOCX TEXT EXTRACTION ═══
async function extractDocxText(file: File): Promise<string> {
  try {
    const ab = await file.arrayBuffer();
    const u8 = new Uint8Array(ab);
    const dv = new DataView(ab);
    let eocd = -1;
    for (let i = u8.length - 22; i >= Math.max(0, u8.length - 65557); i--) {
      if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd === -1) return '';
    const cdOff = dv.getUint32(eocd + 16, true);
    const cdN = dv.getUint16(eocd + 10, true);
    let off = cdOff;
    for (let i = 0; i < cdN; i++) {
      if (off + 46 > u8.length || dv.getUint32(off, true) !== 0x02014b50) break;
      const method = dv.getUint16(off + 10, true);
      const cSize = dv.getUint32(off + 20, true);
      const nLen = dv.getUint16(off + 28, true);
      const eLen = dv.getUint16(off + 30, true);
      const cmtLen = dv.getUint16(off + 32, true);
      const locOff = dv.getUint32(off + 42, true);
      const name = new TextDecoder().decode(u8.slice(off + 46, off + 46 + nLen));
      if (name === 'word/document.xml') {
        const lnl = dv.getUint16(locOff + 26, true);
        const lel = dv.getUint16(locOff + 28, true);
        const ds = locOff + 30 + lnl + lel;
        const comp = u8.slice(ds, ds + cSize);
        let xml = '';
        if (method === 0) { xml = new TextDecoder().decode(comp); }
        else if (method === 8) {
          const dec = new DecompressionStream('raw');
          const w = dec.writable.getWriter(); w.write(comp); w.close();
          const r = dec.readable.getReader();
          const ch: Uint8Array[] = [];
          while (true) { const { done, value } = await r.read(); if (done) break; ch.push(value); }
          const t = ch.reduce((a, c) => a + c.length, 0);
          const res = new Uint8Array(t); let p = 0;
          for (const c of ch) { res.set(c, p); p += c.length; }
          xml = new TextDecoder().decode(res);
        }
        if (xml) {
          let txt = '';
          for (const para of xml.split('</w:p>')) {
            const ws: string[] = [];
            const rx = /<w:t[^>]*>([^<]*)<\/w:t>/g;
            let m; while ((m = rx.exec(para)) !== null) ws.push(m[1]);
            if (ws.length) txt += ws.join('') + '\n';
          }
          return txt.trim().replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'");
        }
      }
      off += 46 + nLen + eLen + cmtLen;
    }
    return '';
  } catch (e) { console.error('DOCX extraction:', e); return ''; }
}

// ═══ PDF GENERATOR ═══
function generarPDF(titulo: string, html: string) {
  const w = window.open('', '_blank');
  if (!w) { alert('Permite ventanas emergentes'); return; }
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${titulo}</title>
  <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700&family=Exo+2:wght@400;600;700;900&display=swap" rel="stylesheet">
  <style>
    @page{margin:2.5cm 3cm}body{font-family:'Merriweather',serif;font-size:12pt;line-height:1.9;color:#1a1a2e;margin:0;padding:40px}
    h1{font-family:'Exo 2',sans-serif;color:#0c4a6e;font-size:22pt;border-bottom:3px solid #0284c7;padding-bottom:12px;margin-bottom:30px}
    h2{font-family:'Exo 2',sans-serif;color:#0c4a6e;font-size:15pt;margin-top:28px;border-left:4px solid #0284c7;padding-left:12px}
    h3{font-family:'Exo 2',sans-serif;color:#333;font-size:13pt}
    .header-meta{font-family:'Exo 2',sans-serif;font-size:10pt;color:#666;margin-bottom:20px}
    .risk-badge{display:inline-block;padding:4px 14px;border-radius:20px;font-family:'Exo 2',sans-serif;font-weight:700;font-size:11pt}
    .risk-alta{background:#fee2e2;color:#dc2626}.risk-media{background:#fef3c7;color:#d97706}.risk-baja{background:#d1fae5;color:#059669}
    .clausula-box{background:#f0f9ff;border-left:4px solid #0284c7;padding:14px 18px;margin:14px 0;border-radius:0 8px 8px 0}
    .warning-box{background:#fef2f2;border:2px solid #ef4444;padding:16px;border-radius:8px;margin:16px 0}
    .info-box{background:#f0f9ff;border:1px solid #0284c7;padding:16px;border-radius:8px;margin:16px 0}
    table{width:100%;border-collapse:collapse;margin:16px 0}th,td{padding:10px 14px;border:1px solid #d1d5db;text-align:left;font-size:11pt}
    th{background:#0c4a6e;color:#fff;font-family:'Exo 2',sans-serif}p{text-align:justify;margin:8px 0}
    .footer{margin-top:40px;padding-top:16px;border-top:2px solid #e5e7eb;font-family:'Exo 2',sans-serif;font-size:9pt;color:#999;text-align:center}
  </style></head><body>${html}
  <div class="footer">FX27 — TROB TRANSPORTES | ${new Date().toLocaleDateString('es-MX',{day:'2-digit',month:'long',year:'numeric'})}</div></body></html>`);
  w.document.close(); setTimeout(() => w.print(), 800);
}

// ═══ PROGRESS STEPS ═══
const PASOS = [
  { texto: 'Preparando documento para análisis', pct: 8 },
  { texto: 'Extrayendo texto y estructura', pct: 20 },
  { texto: 'Identificando partes del contrato', pct: 35 },
  { texto: 'Analizando cláusulas y condiciones', pct: 52 },
  { texto: 'Evaluando riesgos para TROB', pct: 68 },
  { texto: 'Detectando cláusulas leoninas', pct: 80 },
  { texto: 'Generando versión blindada', pct: 92 },
];

export default function AnalisisContratosModule({ onBack }: Props) {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [archivoBase64, setArchivoBase64] = useState('');
  const [textoExtraido, setTextoExtraido] = useState('');
  const [analizando, setAnalizando] = useState(false);
  const [resultado, setResultado] = useState<AnalisisContrato | null>(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [pasoActual, setPasoActual] = useState(0);
  const [intentoActual, setIntentoActual] = useState(0);
  const [secciones, setSecciones] = useState<Record<string, boolean>>({ datos: true, leonino: true, riesgos: true, faltantes: true, resumen: true, blindado: false });
  const fileRef = useRef<HTMLInputElement>(null);
  const intRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => () => { if (intRef.current) clearInterval(intRef.current); }, []);

  const handleFile = async (file: File) => {
    if (!file) return;
    const ext = file.name.toLowerCase().split('.').pop() || '';
    if (!['pdf','docx','doc','xlsx','xls','png','jpg','jpeg'].includes(ext)) { setError('Formatos: PDF, Word, Excel, PNG, JPG'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('Máximo 10MB'); return; }
    setArchivo(file); setError(''); setResultado(null); setTextoExtraido('');
    const reader = new FileReader();
    reader.onload = () => setArchivoBase64((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
    if (ext === 'docx') {
      try {
        const t = await extractDocxText(file);
        if (t && t.length > 30) { console.log(`Extracted ${t.length} chars`); setTextoExtraido(t); }
      } catch (e) { console.error('DOCX fail:', e); }
    }
  };

  // ═══ REALISTIC PROGRESS — slow, gradual, no jumping ═══
  const startProgress = useCallback(() => {
    setProgreso(0); setPasoActual(0);
    let p = 0, step = 0;
    if (intRef.current) clearInterval(intRef.current);
    intRef.current = setInterval(() => {
      // Very slow increments — simulates real work
      // 0-20%: 0.25/tick, 20-50%: 0.18/tick, 50-75%: 0.12/tick, 75-92%: 0.06/tick
      const inc = p < 20 ? 0.25 : p < 50 ? 0.18 : p < 75 ? 0.12 : 0.06;
      p = Math.min(p + inc, 93);
      setProgreso(Math.round(p * 10) / 10);
      // Advance step when reaching threshold
      while (step < PASOS.length - 1 && p >= PASOS[step].pct) { step++; setPasoActual(step); }
    }, 800); // tick every 800ms = very gradual
  }, []);

  const stopProgress = useCallback((ok: boolean) => {
    if (intRef.current) { clearInterval(intRef.current); intRef.current = null; }
    if (ok) { setProgreso(100); setPasoActual(PASOS.length); }
  }, []);

  const callEdge = async (): Promise<any> => {
    const ctrl = new AbortController();
    const tm = setTimeout(() => ctrl.abort(), 180000);
    const body: any = {
      nombre_archivo: archivo?.name || 'contrato.pdf',
      tipo_archivo: archivo?.type || '',
      fecha_analisis: new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }),
    };
    if (textoExtraido && textoExtraido.length > 30) {
      body.texto_extraido = textoExtraido; body.archivo_base64 = '';
    } else { body.archivo_base64 = archivoBase64; }
    try {
      const r = await fetch(`${supabaseUrl}/functions/v1/analizar-contrato`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseAnonKey}` },
        signal: ctrl.signal, body: JSON.stringify(body),
      });
      clearTimeout(tm);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } catch (e: any) {
      clearTimeout(tm);
      if (e.name === 'AbortError') throw new Error('TIMEOUT: Tardó más de 3 minutos.');
      if (e.message?.includes('Failed to fetch') || e.message?.includes('NetworkError') || e.message?.includes('net::ERR_')) throw new Error('CONEXION: Sin conexión al servidor.');
      throw e;
    }
  };

  const analizar = async () => {
    if (!archivoBase64 && !textoExtraido) return;
    setAnalizando(true); setError(''); setResultado(null); setIntentoActual(0);
    startProgress();
    for (let i = 1; i <= 3; i++) {
      setIntentoActual(i);
      try {
        const data = await callEdge();
        if (data.success && data.analisis) {
          stopProgress(true);
          await new Promise(r => setTimeout(r, 500));
          setResultado(data.analisis); setAnalizando(false); return;
        }
        throw new Error(data.error || 'Respuesta inválida');
      } catch (err: any) {
        console.error(`Intento ${i}/3:`, err.message);
        if (i < 3) {
          setProgreso(3); setPasoActual(0);
          await new Promise(r => setTimeout(r, i * 3000));
          startProgress();
        } else {
          stopProgress(false);
          const msg = err.message?.startsWith('TIMEOUT:') ? 'El análisis tardó demasiado. Intenta con PDF más pequeño.'
            : err.message?.startsWith('CONEXION:') ? 'No se pudo conectar después de 3 intentos.'
            : `Error después de 3 intentos: ${err.message}`;
          setError(msg); setAnalizando(false);
        }
      }
    }
  };

  // ═══ HELPERS ═══
  const riskColor = (s: number) => s >= 7 ? { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', label: 'ALTO' } : s >= 4 ? { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', label: 'MEDIO' } : { color: '#22c55e', bg: 'rgba(34,197,94,0.08)', label: 'BAJO' };
  const sevColor = (s: string) => s === 'ALTA' ? { bg: '#fee2e2', color: '#dc2626' } : s === 'MEDIA' ? { bg: '#fef3c7', color: '#d97706' } : { bg: '#d1fae5', color: '#059669' };
  const toggle = (k: string) => setSecciones(p => ({ ...p, [k]: !p[k] }));
  const fecha = () => new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });

  // ═══ PDF GENERATORS ═══
  const descargarAnalisis = () => {
    if (!resultado) return;
    const rg = riskColor(resultado.calificacion_riesgo);
    let h = `<h1>📋 Análisis de Contrato</h1><div class="header-meta">${archivo?.name || ''} | ${fecha()}</div>
    <div style="text-align:center;margin:20px 0"><span class="risk-badge risk-${rg.label.toLowerCase()}" style="font-size:16pt">RIESGO ${rg.label}: ${resultado.calificacion_riesgo}/10</span></div>`;
    if (resultado.es_leonino) h += `<div class="warning-box"><strong>⚠️ CONTRATO LEONINO</strong><p>${resultado.explicacion_leonino}</p></div>`;
    h += `<h2>Datos Extraídos</h2><table><tr><th>Campo</th><th>Valor</th></tr>${Object.entries(resultado.datos_extraidos).map(([k, v]) => `<tr><td>${k.replace(/_/g, ' ').toUpperCase()}</td><td>${Array.isArray(v) ? v.join(', ') : v || 'N/A'}</td></tr>`).join('')}</table>`;
    h += `<h2>Resumen Ejecutivo</h2><p>${resultado.resumen_ejecutivo}</p><h2>Riesgos (${resultado.riesgos.length})</h2>`;
    resultado.riesgos.forEach((r, i) => { h += `<div class="clausula-box"><h3>${i+1}. ${r.clausula} <span class="risk-badge risk-${r.severidad.toLowerCase()}">${r.severidad}</span></h3><p><strong>Riesgo:</strong> ${r.descripcion}</p><p><strong>Sugerencia:</strong> ${r.sugerencia}</p></div>`; });
    if (resultado.clausulas_faltantes.length) h += `<h2>Cláusulas Faltantes</h2><ul>${resultado.clausulas_faltantes.map(c => `<li>${c}</li>`).join('')}</ul>`;
    generarPDF('Análisis - TROB', h);
  };

  const descargarBlindada = () => {
    if (!resultado) return;
    generarPDF('Blindada - TROB', `<h1>🛡️ Versión Blindada</h1><div class="header-meta">${archivo?.name || ''} | ${fecha()}</div>
    <div class="info-box"><strong>ℹ️</strong> Revisar con equipo legal antes de firma.</div>
    <div style="white-space:pre-wrap;text-align:justify;line-height:2">${resultado.version_blindada}</div>`);
  };

  const descargarRiesgos = () => {
    if (!resultado) return;
    const rg = riskColor(resultado.calificacion_riesgo);
    const [a, m, b] = [resultado.riesgos.filter(r => r.severidad === 'ALTA'), resultado.riesgos.filter(r => r.severidad === 'MEDIA'), resultado.riesgos.filter(r => r.severidad === 'BAJA')];
    let h = `<h1>⚠️ Reporte de Riesgos</h1><div class="header-meta">${archivo?.name || ''} | ${fecha()}</div>
    <div style="text-align:center;margin:20px 0"><span class="risk-badge risk-${rg.label.toLowerCase()}" style="font-size:16pt">${resultado.calificacion_riesgo}/10 (${rg.label})</span></div>`;
    if (resultado.es_leonino) h += `<div class="warning-box"><strong>⚠️ LEONINO</strong><p>${resultado.explicacion_leonino}</p></div>`;
    h += `<h2>Resumen</h2><table><tr><th>Severidad</th><th>Cant.</th></tr><tr><td><span class="risk-badge risk-alta">ALTA</span></td><td>${a.length}</td></tr><tr><td><span class="risk-badge risk-media">MEDIA</span></td><td>${m.length}</td></tr><tr><td><span class="risk-badge risk-baja">BAJA</span></td><td>${b.length}</td></tr></table>`;
    [...a,...m,...b].forEach((r, i) => { h += `<div class="clausula-box"><h3>${i+1}. ${r.clausula} <span class="risk-badge risk-${r.severidad.toLowerCase()}">${r.severidad}</span></h3><p>${r.descripcion}</p><p><strong>Corrección:</strong> ${r.sugerencia}</p></div>`; });
    if (resultado.clausulas_faltantes.length) h += `<h2>Agregar</h2><ul>${resultado.clausulas_faltantes.map(c => `<li style="margin:8px 0">${c}</li>`).join('')}</ul>`;
    generarPDF('Riesgos - TROB', h);
  };

  const descargarLlenado = () => {
    if (!resultado) return;
    const d = resultado.datos_extraidos;
    const rAltos = resultado.riesgos.filter(r => r.severidad === 'ALTA');
    const todos = [...rAltos, ...resultado.riesgos.filter(r => r.severidad === 'MEDIA'), ...resultado.riesgos.filter(r => r.severidad === 'BAJA')];
    let h = `<div style="text-align:center;margin-bottom:30px"><h1 style="border-bottom:none;margin-bottom:5px">CONTRATO — ${archivo?.name || ''}</h1></div>
    <table style="margin-bottom:30px"><tr><th colspan="2" style="text-align:center">DATOS DEL CONTRATO</th></tr>
    <tr><td style="width:35%;font-weight:700">Fecha</td><td>${d.fecha_contrato||'N/E'}</td></tr>
    <tr><td style="font-weight:700">Partes</td><td>${Array.isArray(d.partes)?d.partes.join(' — '):d.partes||'N/E'}</td></tr>
    <tr><td style="font-weight:700">Objeto</td><td>${d.objeto_contrato||'N/E'}</td></tr>
    <tr><td style="font-weight:700">Vigencia</td><td>${d.vigencia||'N/E'}</td></tr>
    <tr><td style="font-weight:700">Monto/Tarifa</td><td>${d.monto_o_tarifa||'N/E'}</td></tr>
    <tr><td style="font-weight:700">Rep. Legal</td><td>${d.representante_legal||'N/E'}</td></tr>
    <tr><td style="font-weight:700">Notaría</td><td>${d.notaria||'N/E'}</td></tr>
    <tr><td style="font-weight:700">Escritura</td><td>${d.numero_escritura||'N/E'}</td></tr></table>
    <h2>TROB TRANSPORTES</h2><table>
    <tr><td style="width:35%;font-weight:700">Razón Social</td><td>TROB TRANSPORTES S.A. DE C.V.</td></tr>
    <tr><td style="font-weight:700">RFC</td><td>TTR151216CHA</td></tr>
    <tr><td style="font-weight:700">Rep. Legal</td><td>Alejandro López Ramírez</td></tr>
    <tr><td style="font-weight:700">Escritura</td><td>21,183 Vol. 494</td></tr>
    <tr><td style="font-weight:700">Notaría</td><td>Notaría 35, Lic. Fernando Quezada Leos, Aguascalientes</td></tr></table>
    <h2>Resumen</h2><p>${resultado.resumen_ejecutivo}</p>
    <h2>Contrato</h2><div style="white-space:pre-wrap;text-align:justify;line-height:2">${resultado.version_blindada}</div>`;
    // Hoja observaciones
    h += `<div style="page-break-before:always"></div><h1 style="color:#dc2626;border-bottom-color:#dc2626">⚠️ OBSERVACIONES LEGALES</h1>`;
    if (resultado.es_leonino) h += `<div class="warning-box"><strong style="font-size:14pt;color:#dc2626">🚨 CONTRATO LEONINO</strong><p>${resultado.explicacion_leonino}</p></div>`;
    h += `<p style="font-style:italic;color:#666">Riesgos y correcciones sugeridas:</p>`;
    todos.forEach((r, i) => {
      const sc = r.severidad === 'ALTA' ? '#ef4444' : r.severidad === 'MEDIA' ? '#f59e0b' : '#22c55e';
      h += `<div style="border-left:5px solid ${sc};padding:14px 18px;margin:14px 0;background:${r.severidad==='ALTA'?'#fef2f2':r.severidad==='MEDIA'?'#fffbeb':'#f0fdf4'};border-radius:0 10px 10px 0">
        <h3 style="margin:0 0 8px">${i+1}. ${r.clausula} <span class="risk-badge risk-${r.severidad.toLowerCase()}">${r.severidad}</span></h3>
        <div style="padding:8px 12px;background:rgba(0,0,0,0.04);border-radius:6px;margin:8px 0"><p style="margin:0;font-size:10pt;color:#888;font-weight:700">❌ RIESGO:</p><p style="margin:4px 0 0">${r.descripcion}</p></div>
        <div style="padding:8px 12px;background:rgba(34,197,94,0.08);border-left:3px solid #22c55e;border-radius:6px;margin:8px 0"><p style="margin:0;font-size:10pt;color:#059669;font-weight:700">✅ DEBERÍA DECIR:</p><p style="margin:4px 0 0">${r.sugerencia}</p></div></div>`;
    });
    if (resultado.clausulas_faltantes.length) { h += `<h2 style="color:#dc2626">Agregar</h2>`; resultado.clausulas_faltantes.forEach((c, i) => { h += `<div style="background:#fff7ed;border-left:4px solid #f97316;padding:12px 16px;margin:10px 0;border-radius:0 8px 8px 0"><strong>${i+1}.</strong> ${c}</div>`; }); }
    // Hoja NO FIRMAR
    h += `<div style="page-break-before:always;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:85vh;text-align:center">
      <div style="border:8px solid #dc2626;border-radius:20px;padding:60px 80px;background:#fef2f2">
        <p style="font-family:'Exo 2',sans-serif;font-size:72pt;font-weight:900;color:#dc2626;margin:0;line-height:1.1">⛔ NO FIRMAR</p>
        <div style="width:100%;height:4px;background:#dc2626;margin:30px 0"></div>
        <p style="font-family:'Exo 2',sans-serif;font-size:18pt;color:#991b1b;margin:10px 0 0;font-weight:700">${todos.length} PUNTO${todos.length!==1?'S':''} DE RIESGO${rAltos.length?`<br>(${rAltos.length} SEVERIDAD ALTA)`:''}</p>
        ${resultado.es_leonino?'<p style="font-family:\'Exo 2\',sans-serif;font-size:22pt;color:#dc2626;margin:20px 0 0;font-weight:900">🚨 CONTRATO LEONINO 🚨</p>':''}
        <p style="font-size:13pt;color:#7f1d1d;margin:30px 0 0;line-height:1.6">Corrija las cláusulas antes de firmar.</p>
        <div style="margin-top:40px;padding:16px 24px;background:#dc2626;border-radius:10px"><p style="font-family:'Exo 2',sans-serif;font-size:14pt;color:#fff;margin:0;font-weight:700">RECOMENDACIÓN: No firmar hasta que el equipo legal de TROB apruebe la versión corregida.</p></div>
        <p style="font-size:10pt;color:#999;margin:30px 0 0">Riesgo: ${resultado.calificacion_riesgo}/10 | TROB | ${fecha()}</p>
      </div></div>`;
    generarPDF('Contrato Llenado - TROB', h);
  };

  // ═══ SECTION COMPONENT ═══
  const Sec = ({ id, titulo, icono, children, badge }: { id: string; titulo: string; icono: React.ReactNode; children: React.ReactNode; badge?: React.ReactNode }) => (
    <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(8,47,73,0.20)', border: '1px solid rgba(14,165,233,0.12)', backdropFilter: 'blur(12px)' }}>
      <button onClick={() => toggle(id)} className="w-full flex items-center justify-between p-4 transition-all hover:bg-white/[0.02]">
        <div className="flex items-center gap-3">{icono}<span style={{ fontFamily: F, fontSize: '15px', fontWeight: 700, color: '#e0f2fe' }}>{titulo}</span>{badge}</div>
        {secciones[id] ? <ChevronUp className="w-5 h-5" style={{ color: 'rgba(186,230,253,0.4)' }} /> : <ChevronDown className="w-5 h-5" style={{ color: 'rgba(186,230,253,0.4)' }} />}
      </button>
      {secciones[id] && <div className="px-5 pb-5">{children}</div>}
    </div>
  );

  // ═══════════════════════════════════════════════════════════
  return (
    <div className="min-h-full relative" style={{ background: 'linear-gradient(145deg, #020617 0%, #0c1929 40%, #082f49 70%, #0a1628 100%)' }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 py-3 flex items-center gap-4" style={{ background: 'rgba(2,6,23,0.88)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(14,165,233,0.10)' }}>
        <button onClick={onBack} className="p-2 rounded-lg transition-all hover:bg-white/5"><ArrowLeft className="w-5 h-5" style={{ color: 'rgba(186,230,253,0.6)' }} /></button>
        <div>
          <h1 style={{ fontFamily: F, fontSize: '20px', fontWeight: 700, color: '#e0f2fe' }}>Análisis de Contratos con IA</h1>
          <p style={{ fontFamily: F, fontSize: '12px', color: 'rgba(186,230,253,0.40)' }}>Detecta cláusulas leoninas, riesgos y genera versión blindada para TROB</p>
        </div>
      </div>

      <div className="relative z-10 px-4 py-6 max-w-full mx-auto space-y-5">

        {/* ═══ UPLOAD ═══ */}
        {!resultado && (
          <div className="space-y-5">
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
              onClick={() => fileRef.current?.click()}
              className="relative rounded-2xl p-8 text-center cursor-pointer transition-all"
              style={{
                background: dragOver ? 'rgba(14,165,233,0.10)' : 'rgba(8,47,73,0.15)',
                border: dragOver ? '2px dashed rgba(56,189,248,0.5)' : '2px dashed rgba(14,165,233,0.15)',
                backdropFilter: 'blur(12px)', minHeight: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              }}>
              <input ref={fileRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.xlsx,.xls,.png,.jpg,.jpeg" onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
              {archivo ? (<>
                <FileText className="w-14 h-14 mb-3" style={{ color: '#38bdf8' }} />
                <p style={{ fontFamily: F, fontSize: '16px', fontWeight: 700, color: '#e0f2fe' }}>{archivo.name}</p>
                <p style={{ fontFamily: F, fontSize: '13px', color: 'rgba(186,230,253,0.45)', marginTop: '4px' }}>{(archivo.size / (1024 * 1024)).toFixed(2)} MB{textoExtraido ? ` · ${textoExtraido.length} caracteres extraídos` : ''}</p>
                <button onClick={e => { e.stopPropagation(); setArchivo(null); setArchivoBase64(''); setTextoExtraido(''); setError(''); }}
                  className="mt-3 flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:bg-white/5"
                  style={{ fontFamily: F, fontSize: '13px', color: 'rgba(186,230,253,0.5)', border: '1px solid rgba(14,165,233,0.15)' }}>
                  <RotateCcw className="w-4 h-4" /> Cambiar
                </button>
              </>) : (<>
                <Upload className="w-14 h-14 mb-3" style={{ color: 'rgba(186,230,253,0.15)' }} />
                <p style={{ fontFamily: F, fontSize: '16px', fontWeight: 600, color: 'rgba(186,230,253,0.55)' }}>Arrastra tu contrato aquí</p>
                <p style={{ fontFamily: F, fontSize: '12px', color: 'rgba(186,230,253,0.25)', marginTop: '4px' }}>PDF, Word, Excel, PNG, JPG — Máx 10MB</p>
              </>)}
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: 'rgba(127,29,29,0.15)', border: '1px solid rgba(239,68,68,0.20)', backdropFilter: 'blur(12px)' }}>
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#ef4444' }} />
                <div>
                  <p style={{ fontFamily: F, fontSize: '14px', color: '#fca5a5' }}>{error}</p>
                  {error.includes('intentos') && (
                    <button onClick={analizar} className="mt-2 flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:bg-white/5"
                      style={{ background: 'rgba(14,165,233,0.12)', fontFamily: F, fontSize: '13px', color: '#7dd3fc', border: '1px solid rgba(14,165,233,0.20)' }}>
                      <RefreshCw className="w-4 h-4" /> Reintentar
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Button */}
            {archivo && !analizando && (
              <div className="flex justify-center">
                <button onClick={analizar} disabled={!archivoBase64 && !textoExtraido}
                  className="flex items-center gap-3 px-8 py-4 rounded-xl transition-all hover:brightness-110 disabled:opacity-40"
                  style={{
                    background: (archivoBase64 || textoExtraido) ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'rgba(8,47,73,0.20)',
                    fontFamily: F, fontSize: '16px', fontWeight: 600, color: '#e0f2fe',
                    boxShadow: (archivoBase64 || textoExtraido) ? '0 4px 24px rgba(3,105,161,0.35)' : 'none',
                    border: '1px solid rgba(14,165,233,0.20)',
                  }}>
                  <ShieldCheck className="w-6 h-6" /> Analizar Contrato
                </button>
              </div>
            )}

            {/* ═══ PROGRESS ═══ */}
            {analizando && (
              <div className="rounded-2xl p-6 space-y-5" style={{ background: 'rgba(8,47,73,0.20)', border: '1px solid rgba(14,165,233,0.12)', backdropFilter: 'blur(16px)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#38bdf8' }} />
                    <span style={{ fontFamily: F, fontSize: '15px', fontWeight: 700, color: '#e0f2fe' }}>Analizando contrato...</span>
                  </div>
                  <span style={{ fontFamily: F, fontSize: '22px', fontWeight: 800, color: '#38bdf8' }}>{Math.round(progreso)}%</span>
                </div>

                {/* Bar */}
                <div className="w-full rounded-full overflow-hidden" style={{ height: '8px', background: 'rgba(8,47,73,0.40)' }}>
                  <div className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${progreso}%`, background: 'linear-gradient(90deg, #0369a1, #0284c7, #38bdf8)', boxShadow: '0 0 16px rgba(56,189,248,0.30)' }} />
                </div>

                {/* Steps */}
                <div className="space-y-2">
                  {PASOS.map((p, i) => {
                    const done = progreso >= p.pct;
                    const active = pasoActual === i && !done;
                    return (
                      <div key={i} className="flex items-center gap-3" style={{ opacity: done ? 1 : active ? 0.75 : 0.30 }}>
                        {done ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: '#22c55e' }} />
                          : active ? <Loader2 className="w-4 h-4 flex-shrink-0 animate-spin" style={{ color: '#38bdf8' }} />
                          : <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ border: '2px solid rgba(186,230,253,0.15)' }} />}
                        <span style={{ fontFamily: F, fontSize: '12px', fontWeight: done || active ? 600 : 400, color: done ? '#86efac' : active ? '#bae6fd' : 'rgba(186,230,253,0.3)' }}>
                          {p.texto}{done ? ' ✓' : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {intentoActual > 1 && <div className="flex items-center gap-2" style={{ fontFamily: F, fontSize: '12px', color: '#fbbf24' }}><RefreshCw className="w-4 h-4" />Reintentando (intento {intentoActual}/3)</div>}
                <p style={{ fontFamily: F, fontSize: '11px', color: 'rgba(186,230,253,0.20)', textAlign: 'center' }}>Tiempo estimado: 40-120 segundos</p>
              </div>
            )}
          </div>
        )}

        {/* ═══ RESULTS ═══ */}
        {resultado && (
          <div className="space-y-4">
            {/* Semaphore + buttons */}
            {(() => {
              const rg = riskColor(resultado.calificacion_riesgo);
              return (
                <div className="rounded-xl p-5" style={{ background: rg.bg, border: `1px solid ${rg.color}30`, backdropFilter: 'blur(12px)' }}>
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {[{ t: 7, c: '#ef4444' }, { t: 4, c: '#f59e0b' }, { t: 0, c: '#22c55e' }].map((l, i) => {
                          const on = (i===0&&resultado.calificacion_riesgo>=7)||(i===1&&resultado.calificacion_riesgo>=4&&resultado.calificacion_riesgo<=6)||(i===2&&resultado.calificacion_riesgo<=3);
                          return <div key={i} style={{ width: '18px', height: '18px', borderRadius: '50%', border: `2px solid ${l.c}`, background: on ? l.c : `${l.c}25`, boxShadow: on ? `0 0 10px ${l.c}80` : 'none' }} />;
                        })}
                      </div>
                      <div>
                        <p style={{ fontFamily: F, fontSize: '17px', fontWeight: 700, color: rg.color }}>RIESGO {rg.label} — {resultado.calificacion_riesgo}/10</p>
                        <p style={{ fontFamily: F, fontSize: '12px', color: 'rgba(255,255,255,0.55)' }}>{resultado.riesgos.length} riesgos{resultado.es_leonino && ' — LEONINO'}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { fn: descargarAnalisis, label: 'Análisis', icon: <Download className="w-4 h-4" />, bg: 'linear-gradient(135deg, #0284c7, #0369a1)' },
                        { fn: descargarBlindada, label: 'Blindada', icon: <Shield className="w-4 h-4" />, bg: 'linear-gradient(135deg, #0891b2, #155e75)' },
                        { fn: descargarRiesgos, label: 'Riesgos', icon: <AlertTriangle className="w-4 h-4" />, bg: 'linear-gradient(135deg, #dc2626, #991b1b)' },
                        { fn: descargarLlenado, label: 'Contrato Llenado', icon: <FileText className="w-4 h-4" />, bg: 'linear-gradient(135deg, #064e3b, #065f46)' },
                      ].map((b, i) => (
                        <button key={i} onClick={b.fn} className="flex items-center gap-2 px-4 py-2.5 rounded-lg hover:brightness-110 transition-all"
                          style={{ background: b.bg, fontFamily: F, fontSize: '13px', fontWeight: 600, color: '#fff' }}>{b.icon} {b.label}</button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

            {resultado.es_leonino && (
              <div className="rounded-xl p-5" style={{ background: 'rgba(127,29,29,0.12)', border: '2px solid rgba(239,68,68,0.25)', backdropFilter: 'blur(12px)' }}>
                <div className="flex items-start gap-3">
                  <ShieldAlert className="w-6 h-6 flex-shrink-0" style={{ color: '#ef4444' }} />
                  <div>
                    <p style={{ fontFamily: F, fontSize: '16px', fontWeight: 700, color: '#ef4444' }}>⚠️ Contrato Leonino Detectado</p>
                    <p style={{ fontFamily: F, fontSize: '13px', color: 'rgba(255,255,255,0.65)', marginTop: '4px', lineHeight: '1.6' }}>{resultado.explicacion_leonino}</p>
                  </div>
                </div>
              </div>
            )}

            <Sec id="datos" titulo="Datos Extraídos" icono={<FileSearch className="w-5 h-5" style={{ color: '#38bdf8' }} />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(resultado.datos_extraidos).map(([k, v]) => (
                  <div key={k} className="p-3 rounded-lg" style={{ background: 'rgba(8,47,73,0.15)' }}>
                    <p style={{ fontFamily: F, fontSize: '10px', fontWeight: 600, color: 'rgba(186,230,253,0.40)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{k.replace(/_/g, ' ')}</p>
                    <p style={{ fontFamily: F, fontSize: '14px', color: '#e0f2fe', marginTop: '2px' }}>{Array.isArray(v) ? v.join(', ') : v || 'No especificado'}</p>
                  </div>
                ))}
              </div>
            </Sec>

            <Sec id="resumen" titulo="Resumen Ejecutivo" icono={<FileText className="w-5 h-5" style={{ color: '#7dd3fc' }} />}>
              <p style={{ fontFamily: F, fontSize: '14px', color: 'rgba(224,242,254,0.80)', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{resultado.resumen_ejecutivo}</p>
            </Sec>

            <Sec id="riesgos" titulo="Riesgos Identificados" icono={<AlertTriangle className="w-5 h-5" style={{ color: '#f59e0b' }} />}
              badge={<span className="px-2 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.15)', fontFamily: F, fontSize: '12px', fontWeight: 700, color: '#fbbf24' }}>{resultado.riesgos.length}</span>}>
              <div className="space-y-3">
                {resultado.riesgos.map((r, i) => {
                  const sc = sevColor(r.severidad);
                  return (
                    <div key={i} className="rounded-lg p-4" style={{ background: 'rgba(8,47,73,0.12)', borderLeft: `4px solid ${sc.color}` }}>
                      <div className="flex items-center justify-between mb-2">
                        <p style={{ fontFamily: F, fontSize: '14px', fontWeight: 700, color: '#e0f2fe' }}>{r.clausula}</p>
                        <span className="px-2.5 py-1 rounded-full" style={{ background: `${sc.color}18`, fontFamily: F, fontSize: '11px', fontWeight: 700, color: sc.color }}>{r.severidad}</span>
                      </div>
                      <p style={{ fontFamily: F, fontSize: '13px', color: 'rgba(224,242,254,0.60)', lineHeight: '1.5' }}>{r.descripcion}</p>
                      <div className="mt-2 p-2.5 rounded-lg" style={{ background: 'rgba(14,165,233,0.06)' }}>
                        <p style={{ fontFamily: F, fontSize: '12px', color: '#7dd3fc' }}><strong>Sugerencia:</strong> {r.sugerencia}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Sec>

            {resultado.clausulas_faltantes.length > 0 && (
              <Sec id="faltantes" titulo="Cláusulas Faltantes" icono={<FileWarning className="w-5 h-5" style={{ color: '#fb923c' }} />}
                badge={<span className="px-2 py-0.5 rounded-full" style={{ background: 'rgba(251,146,60,0.15)', fontFamily: F, fontSize: '12px', fontWeight: 700, color: '#fb923c' }}>{resultado.clausulas_faltantes.length}</span>}>
                <div className="space-y-2">
                  {resultado.clausulas_faltantes.map((c, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'rgba(251,146,60,0.05)' }}>
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#fb923c' }} />
                      <p style={{ fontFamily: F, fontSize: '13px', color: 'rgba(224,242,254,0.65)', lineHeight: '1.5' }}>{c}</p>
                    </div>
                  ))}
                </div>
              </Sec>
            )}

            <Sec id="blindado" titulo="Versión Blindada" icono={<Shield className="w-5 h-5" style={{ color: '#0ea5e9' }} />}>
              <p style={{ fontFamily: F, fontSize: '14px', color: 'rgba(224,242,254,0.80)', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{resultado.version_blindada}</p>
            </Sec>

            <div className="flex justify-center pt-2 pb-6">
              <button onClick={() => { setResultado(null); setArchivo(null); setArchivoBase64(''); setTextoExtraido(''); setError(''); setProgreso(0); }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl transition-all hover:bg-white/5"
                style={{ border: '1px solid rgba(14,165,233,0.15)', fontFamily: F, fontSize: '14px', fontWeight: 600, color: 'rgba(186,230,253,0.45)', backdropFilter: 'blur(8px)' }}>
                <RotateCcw className="w-4 h-4" /> Analizar otro contrato
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
