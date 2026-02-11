import { useState, useRef, useEffect, useCallback } from 'react';
import { FileSearch, FileText, Upload, Loader2, AlertCircle, ArrowLeft, Shield, ShieldAlert, ShieldCheck, FileWarning, ChevronDown, ChevronUp, AlertTriangle, Download, RefreshCw, RotateCcw, CheckCircle2 } from 'lucide-react';

const supabaseUrl = 'https://fbxbsslhewchyibdoyzk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieGJzc2xoZXdjaHlpYmRveXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzczODEsImV4cCI6MjA3ODExMzM4MX0.Z8JPlg7hhKbA624QGHp2bKKTNtCD3WInQMO5twjl6a0';
const F = "'Exo 2', sans-serif";

interface RiesgoContrato { clausula: string; texto_original: string; descripcion: string; severidad: 'ALTA' | 'MEDIA' | 'BAJA'; sugerencia: string; }
interface AnalisisContrato {
  datos_extraidos: { representante_legal: string; notaria: string; numero_escritura: string; fecha_contrato: string; partes: string[]; objeto_contrato: string; vigencia: string; monto_o_tarifa: string; };
  es_leonino: boolean; explicacion_leonino: string; riesgos: RiesgoContrato[]; resumen_ejecutivo: string; clausulas_faltantes: string[];
  version_blindada: string; calificacion_riesgo: number; veredicto: string; justificacion_veredicto: string;
}
interface Props { onBack: () => void; }

// ═══ BROWSER .DOCX TEXT EXTRACTION ═══
async function extractDocxText(file: File): Promise<string> {
  try {
    const ab = await file.arrayBuffer(); const u8 = new Uint8Array(ab); const dv = new DataView(ab);
    let eocd = -1;
    for (let i = u8.length - 22; i >= Math.max(0, u8.length - 65557); i--) { if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; } }
    if (eocd === -1) { console.warn('DOCX: No EOCD found'); return ''; }
    const cdOff = dv.getUint32(eocd + 16, true), cdN = dv.getUint16(eocd + 10, true);
    let off = cdOff;
    for (let i = 0; i < cdN; i++) {
      if (off + 46 > u8.length || dv.getUint32(off, true) !== 0x02014b50) break;
      const method = dv.getUint16(off + 10, true), cSize = dv.getUint32(off + 20, true);
      const nLen = dv.getUint16(off + 28, true), eLen = dv.getUint16(off + 30, true), cmtLen = dv.getUint16(off + 32, true);
      const locOff = dv.getUint32(off + 42, true);
      const name = new TextDecoder().decode(u8.slice(off + 46, off + 46 + nLen));
      if (name === 'word/document.xml') {
        const lnl = dv.getUint16(locOff + 26, true), lel = dv.getUint16(locOff + 28, true);
        const ds = locOff + 30 + lnl + lel, comp = u8.slice(ds, ds + cSize);
        let xml = '';
        if (method === 0) xml = new TextDecoder().decode(comp);
        else if (method === 8) {
          try {
            const dec = new DecompressionStream('raw'); const w = dec.writable.getWriter(); w.write(comp); w.close();
            const r = dec.readable.getReader(); const ch: Uint8Array[] = [];
            while (true) { const { done, value } = await r.read(); if (done) break; ch.push(value); }
            const t = ch.reduce((a, c) => a + c.length, 0); const res = new Uint8Array(t); let p = 0;
            for (const c of ch) { res.set(c, p); p += c.length; }
            xml = new TextDecoder().decode(res);
          } catch (e) { console.warn('DOCX: DecompressionStream failed:', e); }
        }
        if (xml) {
          let txt = '';
          for (const para of xml.split('</w:p>')) {
            const ws: string[] = []; const rx = /<w:t[^>]*>([^<]*)<\/w:t>/g;
            let m; while ((m = rx.exec(para)) !== null) ws.push(m[1]);
            if (ws.length) txt += ws.join('') + '\n';
          }
          return txt.trim().replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'");
        }
      }
      off += 46 + nLen + eLen + cmtLen;
    }
    console.warn('DOCX: word/document.xml not found');
    return '';
  } catch (e) { console.error('DOCX extraction error:', e); return ''; }
}

// ═══ PDF CSS ═══
const PDF_CSS = `
  @page{margin:2cm 2.5cm}
  body{font-family:'Merriweather',serif;font-size:11pt;line-height:1.8;color:#1e293b;margin:0;padding:30px}
  h1{font-family:'Exo 2',sans-serif;color:#0c4a6e;font-size:20pt;border-bottom:3px solid #0284c7;padding-bottom:10px;margin-bottom:20px}
  h2{font-family:'Exo 2',sans-serif;color:#0c4a6e;font-size:14pt;margin-top:24px;border-left:4px solid #0284c7;padding-left:10px}
  h3{font-family:'Exo 2',sans-serif;color:#1e3a5f;font-size:12pt;margin:12px 0 6px}
  .meta{font-family:'Exo 2',sans-serif;font-size:9pt;color:#777;margin-bottom:16px}
  .badge{display:inline-block;padding:3px 12px;border-radius:16px;font-family:'Exo 2',sans-serif;font-weight:700;font-size:10pt}
  .b-alta{background:#fee2e2;color:#dc2626}.b-media{background:#fef3c7;color:#d97706}.b-baja{background:#d1fae5;color:#059669}
  .risk-box{border-left:5px solid;padding:12px 16px;margin:12px 0;border-radius:0 8px 8px 0}
  .warn{background:#fef2f2;border:2px solid #ef4444;padding:14px;border-radius:8px;margin:14px 0}
  .ok-box{background:#f0fdf4;border:2px solid #22c55e;padding:14px;border-radius:8px;margin:14px 0}
  table{width:100%;border-collapse:collapse;margin:14px 0}th,td{padding:8px 12px;border:1px solid #d1d5db;text-align:left;font-size:10pt}
  th{background:#0c4a6e;color:#fff;font-family:'Exo 2',sans-serif}
  p{text-align:justify;margin:6px 0}
  .contract{font-family:'Merriweather',serif;font-size:11pt;line-height:2;text-align:justify;white-space:pre-wrap}
  .footer{margin-top:30px;padding-top:12px;border-top:2px solid #e5e7eb;font-family:'Exo 2',sans-serif;font-size:8pt;color:#aaa;text-align:center}
  .page-break{page-break-before:always}
`;

function generarPDF(titulo: string, html: string) {
  const w = window.open('', '_blank');
  if (!w) { alert('Permite ventanas emergentes'); return; }
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${titulo}</title>
  <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700&family=Exo+2:wght@400;600;700;900&display=swap" rel="stylesheet">
  <style>${PDF_CSS}</style></head><body>${html}
  <div class="footer">FX27 — TROB TRANSPORTES S.A. DE C.V. | ${new Date().toLocaleDateString('es-MX',{day:'2-digit',month:'long',year:'numeric'})}</div></body></html>`);
  w.document.close(); setTimeout(() => w.print(), 800);
}

function trobTable() {
  return `<table><tr><th colspan="2" style="text-align:center;font-size:11pt">DATOS DEL TRANSPORTISTA</th></tr>
  <tr><td style="width:30%;font-weight:700">Razón Social</td><td>TROB TRANSPORTES S.A. DE C.V.</td></tr>
  <tr><td style="font-weight:700">RFC</td><td>TTR151216CHA</td></tr>
  <tr><td style="font-weight:700">Representante Legal</td><td>Alejandro López Ramírez</td></tr>
  <tr><td style="font-weight:700">Escritura Pública</td><td>21,183 Vol. 494</td></tr>
  <tr><td style="font-weight:700">Notaría</td><td>Notaría Pública No. 35, Lic. Fernando Quezada Leos, Aguascalientes, Ags.</td></tr>
  <tr><td style="font-weight:700">Banco</td><td>BBVA</td></tr></table>`;
}

function contratoTable(d: any) {
  return `<table><tr><th colspan="2" style="text-align:center;font-size:11pt">DATOS DEL CONTRATO</th></tr>
  <tr><td style="width:30%;font-weight:700">Fecha</td><td>${d.fecha_contrato||'No especificado'}</td></tr>
  <tr><td style="font-weight:700">Partes</td><td>${Array.isArray(d.partes)?d.partes.join(' y '):d.partes||'No especificado'}</td></tr>
  <tr><td style="font-weight:700">Objeto</td><td>${d.objeto_contrato||'No especificado'}</td></tr>
  <tr><td style="font-weight:700">Vigencia</td><td>${d.vigencia||'No especificado'}</td></tr>
  <tr><td style="font-weight:700">Monto / Tarifa</td><td>${d.monto_o_tarifa||'No especificado'}</td></tr>
  <tr><td style="font-weight:700">Rep. Legal</td><td>${d.representante_legal||'No especificado'}</td></tr>
  <tr><td style="font-weight:700">Notaría</td><td>${d.notaria||'No especificado'}</td></tr>
  <tr><td style="font-weight:700">Escritura</td><td>${d.numero_escritura||'No especificado'}</td></tr></table>`;
}

function riskSection(riesgos: RiesgoContrato[], faltantes: string[]) {
  let h = '';
  riesgos.forEach((r, i) => {
    const bc = r.severidad === 'ALTA' ? '#dc2626' : r.severidad === 'MEDIA' ? '#d97706' : '#059669';
    const bg = r.severidad === 'ALTA' ? '#fef2f2' : r.severidad === 'MEDIA' ? '#fffbeb' : '#f0fdf4';
    h += `<div class="risk-box" style="border-color:${bc};background:${bg}">
      <h3>${i+1}. ${r.clausula} <span class="badge b-${r.severidad.toLowerCase()}">${r.severidad}</span></h3>
      ${r.texto_original ? `<div style="padding:8px 12px;background:rgba(0,0,0,0.04);border-radius:4px;margin:6px 0"><p style="margin:0;font-size:9pt;color:#999;font-weight:700">❌ DICE ACTUALMENTE:</p><p style="margin:3px 0 0;font-size:10pt;font-style:italic">"${r.texto_original}"</p></div>` : ''}
      <div style="padding:8px 12px;background:rgba(0,0,0,0.03);border-radius:4px;margin:6px 0"><p style="margin:0;font-size:9pt;color:#999;font-weight:700">⚠️ RIESGO:</p><p style="margin:3px 0 0;font-size:10pt">${r.descripcion}</p></div>
      <div style="padding:8px 12px;background:rgba(34,197,94,0.06);border-left:3px solid #22c55e;border-radius:4px;margin:6px 0"><p style="margin:0;font-size:9pt;color:#059669;font-weight:700">✅ DEBERÍA DECIR:</p><p style="margin:3px 0 0;font-size:10pt">${r.sugerencia}</p></div>
    </div>`;
  });
  if (faltantes.length) {
    h += `<h2 style="color:#b91c1c">CLÁUSULAS QUE DEBEN INCORPORARSE</h2>`;
    faltantes.forEach((c, i) => { h += `<div style="background:#fff7ed;border-left:4px solid #ea580c;padding:10px 14px;margin:8px 0;border-radius:0 6px 6px 0;font-size:10pt"><strong>${i+1}.</strong> ${c}</div>`; });
  }
  return h;
}

function verdictPage(r: AnalisisContrato, f: string) {
  const firmar = r.veredicto === 'FIRMAR';
  const border = firmar ? '#22c55e' : '#dc2626';
  const bg = firmar ? '#f0fdf4' : '#fef2f2';
  const emoji = firmar ? '✅ APTO PARA FIRMA' : '⛔ NO FIRMAR';
  const sub = firmar ? 'CONTRATO DE BUENA FE' : `${r.riesgos.length} PUNTO${r.riesgos.length!==1?'S':''} DE RIESGO`;
  const txtColor = firmar ? '#16a34a' : '#dc2626';
  const subColor = firmar ? '#166534' : '#991b1b';
  const bodyColor = firmar ? '#14532d' : '#7f1d1d';
  const btnBg = firmar ? '#16a34a' : '#dc2626';
  const btnTxt = firmar ? 'Se recomienda proceder con la firma previa revisión final del equipo legal.' : 'No proceder con la firma hasta que el departamento legal de TROB apruebe la versión corregida.';
  return `<div class="page-break" style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:80vh;text-align:center">
    <div style="border:8px solid ${border};border-radius:20px;padding:60px 80px;background:${bg}">
      <p style="font-family:'Exo 2',sans-serif;font-size:56pt;font-weight:900;color:${txtColor};margin:0;line-height:1.1">${emoji}</p>
      <div style="width:100%;height:4px;background:${border};margin:30px 0"></div>
      <p style="font-family:'Exo 2',sans-serif;font-size:16pt;color:${subColor};margin:10px 0;font-weight:700">${sub}</p>
      ${!firmar && r.es_leonino ? '<p style="font-family:\'Exo 2\',sans-serif;font-size:20pt;color:#dc2626;margin:16px 0;font-weight:900">🚨 CONTRATO LEONINO 🚨</p>' : ''}
      <p style="font-size:12pt;color:${bodyColor};margin:20px 0;line-height:1.8;max-width:600px">${r.justificacion_veredicto || (firmar ? 'Condiciones equilibradas y razonables para ambas partes.' : 'Condiciones desfavorables que requieren corrección.')}</p>
      <div style="margin-top:30px;padding:14px 20px;background:${btnBg};border-radius:10px"><p style="font-family:'Exo 2',sans-serif;font-size:13pt;color:#fff;margin:0;font-weight:700">${btnTxt}</p></div>
      <p style="font-size:9pt;color:#aaa;margin:24px 0 0">Calificación: ${r.calificacion_riesgo}/10 | TROB TRANSPORTES | ${f}</p>
    </div></div>`;
}

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
    // Always read base64
    const reader = new FileReader();
    reader.onload = () => setArchivoBase64((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
    // Try client-side extraction for .docx (server has fallback)
    if (ext === 'docx') {
      try {
        const t = await extractDocxText(file);
        if (t && t.length > 30) { setTextoExtraido(t); console.log(`Client extracted ${t.length} chars`); }
        else { console.log('Client extraction got < 30 chars, server will handle'); }
      } catch (e) { console.warn('Client extraction failed, server will handle:', e); }
    }
  };

  const startProgress = useCallback(() => {
    setProgreso(0); setPasoActual(0); let p = 0, step = 0;
    if (intRef.current) clearInterval(intRef.current);
    intRef.current = setInterval(() => {
      const inc = p < 20 ? 0.25 : p < 50 ? 0.18 : p < 75 ? 0.12 : 0.06;
      p = Math.min(p + inc, 93); setProgreso(Math.round(p * 10) / 10);
      while (step < PASOS.length - 1 && p >= PASOS[step].pct) { step++; setPasoActual(step); }
    }, 800);
  }, []);

  const stopProgress = useCallback((ok: boolean) => {
    if (intRef.current) { clearInterval(intRef.current); intRef.current = null; }
    if (ok) { setProgreso(100); setPasoActual(PASOS.length); }
  }, []);

  const callEdge = async (): Promise<any> => {
    const ctrl = new AbortController(); const tm = setTimeout(() => ctrl.abort(), 180000);
    // ALWAYS send both — server uses texto_extraido first, base64 as fallback
    const body: any = {
      nombre_archivo: archivo?.name || '',
      tipo_archivo: archivo?.type || '',
      fecha_analisis: new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }),
      texto_extraido: textoExtraido || '',
      archivo_base64: archivoBase64 || '',
    };
    try {
      const r = await fetch(`${supabaseUrl}/functions/v1/analizar-contrato`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseAnonKey}` },
        signal: ctrl.signal, body: JSON.stringify(body),
      });
      clearTimeout(tm); if (!r.ok) throw new Error(`HTTP ${r.status}`); return await r.json();
    } catch (e: any) { clearTimeout(tm); throw e; }
  };

  const analizar = async () => {
    if (!archivoBase64 && !textoExtraido) return;
    setAnalizando(true); setError(''); setResultado(null); setIntentoActual(0); startProgress();
    for (let i = 1; i <= 3; i++) {
      setIntentoActual(i);
      try {
        const data = await callEdge();
        if (data.success && data.analisis) { stopProgress(true); await new Promise(r => setTimeout(r, 500)); setResultado(data.analisis); setAnalizando(false); return; }
        throw new Error(data.error || 'Respuesta inválida');
      } catch (err: any) {
        if (i < 3) { setProgreso(3); setPasoActual(0); await new Promise(r => setTimeout(r, i * 3000)); startProgress(); }
        else { stopProgress(false); setError(`Error: ${err.message}`); setAnalizando(false); }
      }
    }
  };

  const riskColor = (s: number) => s >= 7 ? { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', label: 'ALTO' } : s >= 4 ? { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', label: 'MEDIO' } : { color: '#22c55e', bg: 'rgba(34,197,94,0.08)', label: 'BAJO' };
  const sevColor = (s: string) => s === 'ALTA' ? { bg: '#fee2e2', color: '#dc2626' } : s === 'MEDIA' ? { bg: '#fef3c7', color: '#d97706' } : { bg: '#d1fae5', color: '#059669' };
  const toggle = (k: string) => setSecciones(p => ({ ...p, [k]: !p[k] }));
  const fecha = () => new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });

  // BTN 1: CONTRATO COMPLETO
  const descargarContratoCompleto = () => {
    if (!resultado) return;
    const f = fecha();
    const textoOriginal = textoExtraido || '(Texto original disponible en archivo fuente)';
    let h = `<div style="text-align:center;margin-bottom:20px">
      <p style="font-family:'Exo 2',sans-serif;font-size:9pt;color:#666;letter-spacing:3px;text-transform:uppercase;margin:0">TROB TRANSPORTES S.A. DE C.V.</p>
      <h1 style="border-bottom:none;margin:6px 0">CONTRATO</h1>
      <p style="font-size:10pt;color:#666">${archivo?.name || ''} | ${f}</p>
      <div style="width:80px;height:3px;background:#0284c7;margin:10px auto"></div></div>`;
    h += contratoTable(resultado.datos_extraidos);
    h += trobTable();
    h += `<h2>TEXTO DEL CONTRATO</h2><div class="contract">${textoOriginal}</div>`;
    if (resultado.riesgos.length > 0 || resultado.es_leonino) {
      h += `<div class="page-break"></div><h1 style="color:#b91c1c;border-bottom-color:#dc2626">OBSERVACIONES Y DICTAMEN</h1><div class="meta">Análisis para TROB TRANSPORTES | ${f}</div>`;
      if (resultado.es_leonino) h += `<div class="warn"><strong style="font-size:13pt;color:#dc2626">🚨 CONTRATO LEONINO</strong><p>${resultado.explicacion_leonino}</p></div>`;
      h += `<h2>RIESGOS IDENTIFICADOS (${resultado.riesgos.length})</h2>`;
      h += riskSection(resultado.riesgos, resultado.clausulas_faltantes);
    }
    h += verdictPage(resultado, f);
    generarPDF('Contrato Completo - TROB', h);
  };

  // BTN 2: BLINDADA TROB
  const descargarBlindada = () => {
    if (!resultado) return;
    const f = fecha();
    let h = `<div style="text-align:center;margin-bottom:20px">
      <p style="font-family:'Exo 2',sans-serif;font-size:9pt;color:#059669;letter-spacing:3px;text-transform:uppercase;margin:0">VERSIÓN BLINDADA — PROTECCIÓN TOTAL TROB</p>
      <h1 style="border-bottom-color:#22c55e;margin:6px 0">CONTRATO CORREGIDO</h1>
      <p style="font-size:10pt;color:#666">Basado en: ${archivo?.name || ''} | ${f}</p>
      <div style="width:80px;height:3px;background:#22c55e;margin:10px auto"></div></div>`;
    h += `<div class="ok-box"><strong>🛡️ DOCUMENTO BLINDADO</strong><p style="margin:4px 0 0">Contrato modificado para proteger al 100% los intereses de TROB TRANSPORTES S.A. DE C.V.</p></div>`;
    h += contratoTable(resultado.datos_extraidos);
    h += trobTable();
    h += `<h2>CONTRATO CON CORRECCIONES APLICADAS</h2><div class="contract">${resultado.version_blindada || '(Versión blindada no disponible)'}</div>`;
    if (resultado.riesgos.length > 0) {
      h += `<div class="page-break"></div><h1 style="color:#0c4a6e">REGISTRO DE CORRECCIONES</h1><div class="meta">Cambios aplicados al contrato original | ${f}</div>`;
      resultado.riesgos.forEach((r, i) => {
        h += `<div style="border-left:5px solid #0284c7;padding:12px 16px;margin:12px 0;background:#f0f9ff;border-radius:0 8px 8px 0">
          <h3>${i+1}. ${r.clausula} <span class="badge b-${r.severidad.toLowerCase()}">${r.severidad}</span></h3>
          ${r.texto_original ? `<div style="padding:8px 12px;background:rgba(239,68,68,0.05);border-left:3px solid #ef4444;border-radius:4px;margin:6px 0"><p style="margin:0;font-size:9pt;color:#dc2626;font-weight:700">ANTES:</p><p style="margin:3px 0 0;font-size:10pt;font-style:italic;text-decoration:line-through;color:#666">"${r.texto_original}"</p></div>` : ''}
          <div style="padding:8px 12px;background:rgba(34,197,94,0.06);border-left:3px solid #22c55e;border-radius:4px;margin:6px 0"><p style="margin:0;font-size:9pt;color:#059669;font-weight:700">DESPUÉS:</p><p style="margin:3px 0 0;font-size:10pt">${r.sugerencia}</p></div>
          <p style="font-size:9pt;color:#64748b;margin:4px 0 0"><strong>Motivo:</strong> ${r.descripcion}</p></div>`;
      });
      if (resultado.clausulas_faltantes.length) {
        h += `<h2>CLÁUSULAS AGREGADAS</h2>`;
        resultado.clausulas_faltantes.forEach((c, i) => { h += `<div style="background:#f0fdf4;border-left:4px solid #22c55e;padding:10px 14px;margin:8px 0;border-radius:0 6px 6px 0;font-size:10pt"><strong>+ ${i+1}.</strong> ${c}</div>`; });
      }
    }
    h += `<div class="page-break" style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:80vh;text-align:center">
      <div style="border:8px solid #22c55e;border-radius:20px;padding:60px 80px;background:#f0fdf4">
        <p style="font-family:'Exo 2',sans-serif;font-size:50pt;font-weight:900;color:#16a34a;margin:0;line-height:1.1">✅ APTO PARA FIRMA</p>
        <div style="width:100%;height:4px;background:#22c55e;margin:30px 0"></div>
        <p style="font-family:'Exo 2',sans-serif;font-size:16pt;color:#166534;margin:10px 0;font-weight:700">VERSIÓN BLINDADA — CORRECCIONES APLICADAS</p>
        <p style="font-size:12pt;color:#14532d;margin:20px 0;line-height:1.8;max-width:600px">Se corrigieron ${resultado.riesgos.length} punto${resultado.riesgos.length!==1?'s':''} de riesgo${resultado.clausulas_faltantes.length ? ` y se agregaron ${resultado.clausulas_faltantes.length} cláusula${resultado.clausulas_faltantes.length!==1?'s':''} faltante${resultado.clausulas_faltantes.length!==1?'s':''}` : ''}.</p>
        <div style="margin-top:30px;padding:14px 20px;background:#16a34a;border-radius:10px"><p style="font-family:'Exo 2',sans-serif;font-size:13pt;color:#fff;margin:0;font-weight:700">Proceder con la firma previa validación del equipo legal de TROB.</p></div>
        <p style="font-size:9pt;color:#aaa;margin:24px 0 0">Riesgo original: ${resultado.calificacion_riesgo}/10 (corregido) | TROB TRANSPORTES | ${f}</p>
      </div></div>`;
    generarPDF('Blindada TROB', h);
  };

  // BTN 3: ANÁLISIS RIESGOS
  const descargarRiesgos = () => {
    if (!resultado) return;
    const rg = riskColor(resultado.calificacion_riesgo); const f = fecha();
    const [a, m, b] = [resultado.riesgos.filter(r => r.severidad === 'ALTA'), resultado.riesgos.filter(r => r.severidad === 'MEDIA'), resultado.riesgos.filter(r => r.severidad === 'BAJA')];
    let h = `<h1>⚠️ Análisis de Riesgos</h1><div class="meta">${archivo?.name || ''} | ${f}</div>
    <div style="text-align:center;margin:20px 0"><span class="badge b-${rg.label.toLowerCase()}" style="font-size:16pt">${resultado.calificacion_riesgo}/10 — RIESGO ${rg.label}</span></div>`;
    if (resultado.es_leonino) h += `<div class="warn"><strong>⚠️ CONTRATO LEONINO</strong><p>${resultado.explicacion_leonino}</p></div>`;
    h += `<h2>Resumen Ejecutivo</h2><p>${resultado.resumen_ejecutivo}</p>`;
    h += `<h2>Distribución</h2><table><tr><th>Severidad</th><th>Cantidad</th></tr><tr><td><span class="badge b-alta">ALTA</span></td><td>${a.length}</td></tr><tr><td><span class="badge b-media">MEDIA</span></td><td>${m.length}</td></tr><tr><td><span class="badge b-baja">BAJA</span></td><td>${b.length}</td></tr></table>`;
    h += `<h2>Detalle</h2>`;
    h += riskSection([...a,...m,...b], resultado.clausulas_faltantes);
    h += verdictPage(resultado, f);
    generarPDF('Análisis Riesgos - TROB', h);
  };

  const Sec = ({ id, titulo, icono, children, badge }: { id: string; titulo: string; icono: React.ReactNode; children: React.ReactNode; badge?: React.ReactNode }) => (
    <div className="rounded-xl overflow-hidden" style={{ background: 'linear-gradient(180deg, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.85) 100%)', border: '1px solid rgba(148,163,184,0.10)', boxShadow: '0 4px 16px rgba(0,0,0,0.20)' }}>
      <button onClick={() => toggle(id)} className="w-full flex items-center justify-between p-4 transition-all hover:bg-white/[0.03]" style={{ borderBottom: secciones[id] ? '1px solid rgba(148,163,184,0.08)' : 'none' }}>
        <div className="flex items-center gap-3">{icono}<span style={{ fontFamily: F, fontSize: '15px', fontWeight: 700, color: '#f1f5f9' }}>{titulo}</span>{badge}</div>
        {secciones[id] ? <ChevronUp className="w-5 h-5" style={{ color: '#64748b' }} /> : <ChevronDown className="w-5 h-5" style={{ color: '#64748b' }} />}
      </button>
      {secciones[id] && <div className="px-5 pb-5 pt-3">{children}</div>}
    </div>
  );

  return (
    <div className="min-h-full relative" style={{ background: 'linear-gradient(160deg, #020617 0%, #0f172a 30%, #1e293b 60%, #0f172a 100%)' }}>
      <div className="sticky top-0 z-20 px-4 py-3 flex items-center gap-4" style={{ background: 'linear-gradient(180deg, rgba(2,6,23,0.95), rgba(15,23,42,0.90))', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(148,163,184,0.08)', boxShadow: '0 4px 20px rgba(0,0,0,0.30)' }}>
        <button onClick={onBack} className="p-2 rounded-lg transition-all hover:bg-white/5"><ArrowLeft className="w-5 h-5" style={{ color: '#94a3b8' }} /></button>
        <div>
          <h1 style={{ fontFamily: F, fontSize: '20px', fontWeight: 700, color: '#f8fafc' }}>Análisis de Contratos con IA</h1>
          <p style={{ fontFamily: F, fontSize: '12px', color: '#64748b' }}>Detecta cláusulas leoninas, riesgos y genera versión blindada para TROB</p>
        </div>
      </div>

      <div className="relative z-10 px-4 py-6 max-w-full mx-auto space-y-5">
        {!resultado && (
          <div className="space-y-5">
            <div onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
              onClick={() => fileRef.current?.click()} className="relative rounded-2xl p-8 text-center cursor-pointer transition-all"
              style={{ background: dragOver ? 'linear-gradient(135deg, rgba(14,165,233,0.12), rgba(6,78,59,0.08))' : 'linear-gradient(135deg, rgba(15,23,42,0.90), rgba(30,41,59,0.70))', border: dragOver ? '2px dashed #0ea5e9' : '2px dashed rgba(100,116,139,0.25)', backdropFilter: 'blur(12px)', minHeight: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
              <input ref={fileRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.xlsx,.xls,.png,.jpg,.jpeg" onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
              {archivo ? (<>
                <div className="p-4 rounded-2xl mb-3" style={{ background: 'linear-gradient(135deg, rgba(14,165,233,0.15), rgba(14,165,233,0.05))' }}><FileText className="w-12 h-12" style={{ color: '#38bdf8' }} /></div>
                <p style={{ fontFamily: F, fontSize: '16px', fontWeight: 700, color: '#f1f5f9' }}>{archivo.name}</p>
                <p style={{ fontFamily: F, fontSize: '13px', color: '#64748b', marginTop: '4px' }}>{(archivo.size / (1024 * 1024)).toFixed(2)} MB{textoExtraido ? ` · ${textoExtraido.length} caracteres` : ''}</p>
                <button onClick={e => { e.stopPropagation(); setArchivo(null); setArchivoBase64(''); setTextoExtraido(''); setError(''); }}
                  className="mt-3 flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:bg-white/5"
                  style={{ fontFamily: F, fontSize: '13px', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.15)' }}><RotateCcw className="w-4 h-4" /> Cambiar</button>
              </>) : (<>
                <div className="p-4 rounded-2xl mb-3" style={{ background: 'rgba(30,41,59,0.60)' }}><Upload className="w-12 h-12" style={{ color: '#475569' }} /></div>
                <p style={{ fontFamily: F, fontSize: '16px', fontWeight: 600, color: '#94a3b8' }}>Arrastra tu contrato aquí</p>
                <p style={{ fontFamily: F, fontSize: '12px', color: '#475569', marginTop: '4px' }}>PDF, Word, Excel, PNG, JPG — Máx 10MB</p>
              </>)}
            </div>

            {error && (
              <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: 'linear-gradient(135deg, rgba(127,29,29,0.20), rgba(30,41,59,0.80))', border: '1px solid rgba(239,68,68,0.25)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#f87171' }} />
                <div>
                  <p style={{ fontFamily: F, fontSize: '14px', color: '#fca5a5' }}>{error}</p>
                  <button onClick={analizar} className="mt-2 flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:brightness-110"
                    style={{ background: 'linear-gradient(135deg, rgba(14,165,233,0.20), rgba(14,165,233,0.10))', fontFamily: F, fontSize: '13px', color: '#7dd3fc', border: '1px solid rgba(14,165,233,0.25)' }}><RefreshCw className="w-4 h-4" /> Reintentar</button>
                </div>
              </div>
            )}

            {archivo && !analizando && (
              <div className="flex justify-center">
                <button onClick={analizar} disabled={!archivoBase64 && !textoExtraido} className="flex items-center gap-3 px-8 py-4 rounded-xl transition-all hover:brightness-110 disabled:opacity-40"
                  style={{ background: (archivoBase64 || textoExtraido) ? 'linear-gradient(135deg, #0284c7, #0369a1, #075985)' : 'rgba(30,41,59,0.50)', fontFamily: F, fontSize: '16px', fontWeight: 700, color: '#f0f9ff', boxShadow: (archivoBase64 || textoExtraido) ? '0 6px 28px rgba(3,105,161,0.40), inset 0 1px 0 rgba(255,255,255,0.10)' : 'none', border: '1px solid rgba(14,165,233,0.30)' }}>
                  <ShieldCheck className="w-6 h-6" /> Analizar Contrato
                </button>
              </div>
            )}

            {analizando && (
              <div className="rounded-2xl p-6 space-y-5" style={{ background: 'linear-gradient(180deg, rgba(15,23,42,0.95), rgba(30,41,59,0.85))', border: '1px solid rgba(148,163,184,0.10)', boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3"><Loader2 className="w-5 h-5 animate-spin" style={{ color: '#38bdf8' }} /><span style={{ fontFamily: F, fontSize: '15px', fontWeight: 700, color: '#f1f5f9' }}>Analizando contrato...</span></div>
                  <span style={{ fontFamily: F, fontSize: '24px', fontWeight: 800, color: '#38bdf8', textShadow: '0 0 20px rgba(56,189,248,0.30)' }}>{Math.round(progreso)}%</span>
                </div>
                <div className="w-full rounded-full overflow-hidden" style={{ height: '12px', background: 'rgba(30,41,59,0.80)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.30)' }}>
                  <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${progreso}%`, background: 'linear-gradient(90deg, #075985, #0284c7, #38bdf8, #7dd3fc)', boxShadow: '0 0 20px rgba(56,189,248,0.40), 0 0 6px rgba(56,189,248,0.60)' }} />
                </div>
                <div className="space-y-2.5 pl-1">
                  {PASOS.map((p, i) => {
                    const done = progreso >= p.pct; const active = pasoActual === i && !done;
                    return (<div key={i} className="flex items-center gap-3" style={{ opacity: done ? 1 : active ? 0.80 : 0.30 }}>
                      {done ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: '#4ade80' }} /> : active ? <Loader2 className="w-5 h-5 flex-shrink-0 animate-spin" style={{ color: '#38bdf8' }} /> : <div className="w-5 h-5 rounded-full flex-shrink-0" style={{ border: '2px solid #334155' }} />}
                      <span style={{ fontFamily: F, fontSize: '13px', fontWeight: done || active ? 600 : 400, color: done ? '#86efac' : active ? '#bae6fd' : '#475569' }}>{p.texto}{done ? ' ✓' : ''}</span>
                    </div>);
                  })}
                </div>
                {intentoActual > 1 && <div className="flex items-center gap-2" style={{ fontFamily: F, fontSize: '12px', color: '#fbbf24' }}><RefreshCw className="w-4 h-4" />Reintentando (intento {intentoActual}/3)</div>}
                <p style={{ fontFamily: F, fontSize: '11px', color: '#334155', textAlign: 'center' }}>Tiempo estimado: 40-120 segundos</p>
              </div>
            )}
          </div>
        )}

        {resultado && (
          <div className="space-y-4">
            {(() => {
              const rg = riskColor(resultado.calificacion_riesgo);
              return (<div className="rounded-xl p-5" style={{ background: `linear-gradient(135deg, ${rg.bg}, rgba(15,23,42,0.90))`, border: `1px solid ${rg.color}25`, boxShadow: `0 4px 20px rgba(0,0,0,0.20)` }}>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {[{ c: '#ef4444', on: resultado.calificacion_riesgo >= 7 }, { c: '#f59e0b', on: resultado.calificacion_riesgo >= 4 && resultado.calificacion_riesgo <= 6 }, { c: '#22c55e', on: resultado.calificacion_riesgo <= 3 }].map((l, i) => (
                        <div key={i} style={{ width: '18px', height: '18px', borderRadius: '50%', border: `2px solid ${l.c}`, background: l.on ? l.c : `${l.c}15`, boxShadow: l.on ? `0 0 12px ${l.c}60` : 'none' }} />
                      ))}
                    </div>
                    <div>
                      <p style={{ fontFamily: F, fontSize: '18px', fontWeight: 800, color: rg.color }}>{resultado.calificacion_riesgo}/10 — {resultado.veredicto === 'FIRMAR' ? '✅ APTO' : '⛔ NO FIRMAR'}</p>
                      <p style={{ fontFamily: F, fontSize: '12px', color: '#94a3b8' }}>{resultado.riesgos.length} riesgos{resultado.es_leonino ? ' · LEONINO' : ''}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { fn: descargarContratoCompleto, label: 'Contrato Completo', icon: <Download className="w-4 h-4" />, bg: 'linear-gradient(135deg, #1d4ed8, #1e3a8a)' },
                      { fn: descargarBlindada, label: 'Blindada TROB', icon: <Shield className="w-4 h-4" />, bg: 'linear-gradient(135deg, #16a34a, #15803d)' },
                      { fn: descargarRiesgos, label: 'Análisis Riesgos', icon: <AlertTriangle className="w-4 h-4" />, bg: 'linear-gradient(135deg, #ea580c, #c2410c)' },
                    ].map((b, i) => (
                      <button key={i} onClick={b.fn} className="flex items-center gap-2 px-4 py-2.5 rounded-lg hover:brightness-110 transition-all"
                        style={{ background: b.bg, fontFamily: F, fontSize: '13px', fontWeight: 600, color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.20)' }}>{b.icon} {b.label}</button>
                    ))}
                    <button onClick={() => { setResultado(null); setArchivo(null); setArchivoBase64(''); setTextoExtraido(''); setError(''); setProgreso(0); }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg hover:bg-white/5 transition-all"
                      style={{ fontFamily: F, fontSize: '13px', fontWeight: 600, color: '#94a3b8', border: '1px solid rgba(148,163,184,0.15)' }}><RotateCcw className="w-4 h-4" /> Nuevo</button>
                  </div>
                </div>
              </div>);
            })()}

            {resultado.es_leonino && (
              <div className="rounded-xl p-5" style={{ background: 'linear-gradient(135deg, rgba(127,29,29,0.15), rgba(15,23,42,0.90))', border: '2px solid rgba(239,68,68,0.30)' }}>
                <div className="flex items-start gap-3">
                  <ShieldAlert className="w-6 h-6 flex-shrink-0" style={{ color: '#f87171' }} />
                  <div>
                    <p style={{ fontFamily: F, fontSize: '16px', fontWeight: 700, color: '#f87171' }}>⚠️ Contrato Leonino</p>
                    <p style={{ fontFamily: F, fontSize: '13px', color: '#cbd5e1', marginTop: '6px', lineHeight: '1.7' }}>{resultado.explicacion_leonino}</p>
                  </div>
                </div>
              </div>
            )}

            <Sec id="datos" titulo="Datos Extraídos" icono={<FileSearch className="w-5 h-5" style={{ color: '#38bdf8' }} />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(resultado.datos_extraidos).map(([k, v]) => (
                  <div key={k} className="p-3 rounded-lg" style={{ background: 'rgba(30,41,59,0.50)' }}>
                    <p style={{ fontFamily: F, fontSize: '10px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{k.replace(/_/g, ' ')}</p>
                    <p style={{ fontFamily: F, fontSize: '14px', color: '#e2e8f0', marginTop: '3px' }}>{Array.isArray(v) ? v.join(', ') : v || 'No especificado'}</p>
                  </div>
                ))}
              </div>
            </Sec>

            <Sec id="resumen" titulo="Resumen Ejecutivo" icono={<FileText className="w-5 h-5" style={{ color: '#a78bfa' }} />}>
              <p style={{ fontFamily: F, fontSize: '14px', color: '#cbd5e1', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>{resultado.resumen_ejecutivo}</p>
            </Sec>

            <Sec id="riesgos" titulo="Riesgos Identificados" icono={<AlertTriangle className="w-5 h-5" style={{ color: '#fbbf24' }} />}
              badge={<span className="px-2.5 py-0.5 rounded-full" style={{ background: 'rgba(251,191,36,0.12)', fontFamily: F, fontSize: '12px', fontWeight: 700, color: '#fbbf24' }}>{resultado.riesgos.length}</span>}>
              <div className="space-y-3">
                {resultado.riesgos.map((r, i) => {
                  const sc = sevColor(r.severidad);
                  return (<div key={i} className="rounded-lg p-4" style={{ background: 'rgba(30,41,59,0.40)', borderLeft: `4px solid ${sc.color}`, boxShadow: '0 2px 8px rgba(0,0,0,0.10)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <p style={{ fontFamily: F, fontSize: '14px', fontWeight: 700, color: '#f1f5f9' }}>{r.clausula}</p>
                      <span className="px-2.5 py-1 rounded-full" style={{ background: `${sc.color}15`, fontFamily: F, fontSize: '11px', fontWeight: 700, color: sc.color }}>{r.severidad}</span>
                    </div>
                    {r.texto_original && <p style={{ fontFamily: F, fontSize: '12px', color: '#94a3b8', lineHeight: '1.5', fontStyle: 'italic', background: 'rgba(239,68,68,0.04)', padding: '8px 12px', borderRadius: '6px', borderLeft: '3px solid rgba(239,68,68,0.30)', margin: '4px 0' }}>❌ "{r.texto_original}"</p>}
                    <p style={{ fontFamily: F, fontSize: '13px', color: '#94a3b8', lineHeight: '1.6', marginTop: '6px' }}>{r.descripcion}</p>
                    <div className="mt-3 p-3 rounded-lg" style={{ background: 'rgba(14,165,233,0.05)', border: '1px solid rgba(14,165,233,0.10)' }}>
                      <p style={{ fontFamily: F, fontSize: '12px', color: '#7dd3fc' }}><strong style={{ color: '#38bdf8' }}>✅ Debería decir:</strong> {r.sugerencia}</p>
                    </div>
                  </div>);
                })}
              </div>
            </Sec>

            {resultado.clausulas_faltantes.length > 0 && (
              <Sec id="faltantes" titulo="Cláusulas Faltantes" icono={<FileWarning className="w-5 h-5" style={{ color: '#fb923c' }} />}
                badge={<span className="px-2.5 py-0.5 rounded-full" style={{ background: 'rgba(251,146,60,0.12)', fontFamily: F, fontSize: '12px', fontWeight: 700, color: '#fb923c' }}>{resultado.clausulas_faltantes.length}</span>}>
                <div className="space-y-2">
                  {resultado.clausulas_faltantes.map((c, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'rgba(251,146,60,0.04)', border: '1px solid rgba(251,146,60,0.10)' }}>
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#fb923c' }} />
                      <p style={{ fontFamily: F, fontSize: '13px', color: '#cbd5e1', lineHeight: '1.5' }}>{c}</p>
                    </div>
                  ))}
                </div>
              </Sec>
            )}

            <Sec id="blindado" titulo="Versión Blindada" icono={<Shield className="w-5 h-5" style={{ color: '#2dd4bf' }} />}>
              <p style={{ fontFamily: F, fontSize: '14px', color: '#cbd5e1', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>{resultado.version_blindada}</p>
            </Sec>
          </div>
        )}
      </div>
    </div>
  );
}
