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

// ═══════════════════════════════════════════════════════════
// DOCUMENT METADATA — extracted dynamically from each .docx
// ═══════════════════════════════════════════════════════════
interface DocMeta {
  font: string;        // e.g. 'Verdana', 'Calibri'
  fontSize: number;    // in pt, e.g. 10, 11, 12
  lineHeight: number;  // ratio, e.g. 1.15, 1.5
  margins: { top: number; bottom: number; left: number; right: number }; // cm
}

const DEFAULT_META: DocMeta = { font: 'Calibri', fontSize: 11, lineHeight: 1.15, margins: { top: 2.5, bottom: 2.5, left: 2.5, right: 2.5 } };

function esc(s: string) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// Google Fonts fallbacks for non-web-safe fonts
function fontLink(font: string): string {
  const webSafe = ['Arial','Verdana','Georgia','Times New Roman','Courier New','Tahoma','Trebuchet MS','Palatino','Garamond','Impact'];
  if (webSafe.some(f => font.toLowerCase().includes(f.toLowerCase()))) return '';
  const map: Record<string,string> = { 'Calibri': 'Carlito', 'Cambria': 'Caladea', 'Segoe UI': 'Open+Sans' };
  const gf = map[font] || font;
  return '<link href="https://fonts.googleapis.com/css2?family=' + encodeURIComponent(gf).replace(/%20/g,'+') + ':wght@400;700&display=swap" rel="stylesheet">';
}

// ═══════════════════════════════════════════════════════════
// ZIP READER — reads multiple entries from .docx
// ═══════════════════════════════════════════════════════════
async function readZipEntries(file: File, targets: string[]): Promise<Map<string, string>> {
  const ab = await file.arrayBuffer(); const u8 = new Uint8Array(ab); const dv = new DataView(ab);
  const results = new Map<string, string>();
  let eocd = -1;
  for (let i = u8.length - 22; i >= Math.max(0, u8.length - 65557); i--) { if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; } }
  if (eocd === -1) return results;
  const cdOff = dv.getUint32(eocd + 16, true), cdN = dv.getUint16(eocd + 10, true);
  let off = cdOff;
  for (let i = 0; i < cdN; i++) {
    if (off + 46 > u8.length || dv.getUint32(off, true) !== 0x02014b50) break;
    const method = dv.getUint16(off + 10, true), cSize = dv.getUint32(off + 20, true);
    const nLen = dv.getUint16(off + 28, true), eLen = dv.getUint16(off + 30, true), cmtLen = dv.getUint16(off + 32, true);
    const locOff = dv.getUint32(off + 42, true);
    const name = new TextDecoder().decode(u8.slice(off + 46, off + 46 + nLen));
    if (targets.includes(name)) {
      const lnl = dv.getUint16(locOff + 26, true), lel = dv.getUint16(locOff + 28, true);
      const ds = locOff + 30 + lnl + lel, comp = u8.slice(ds, ds + cSize);
      if (method === 0) { results.set(name, new TextDecoder().decode(comp)); }
      else if (method === 8) {
        for (const fmt of ['deflate-raw', 'raw'] as const) {
          try {
            const dec = new DecompressionStream(fmt as string); const w = dec.writable.getWriter(); w.write(comp); w.close();
            const r = dec.readable.getReader(); const ch: Uint8Array[] = [];
            while (true) { const { done, value } = await r.read(); if (done) break; ch.push(value); }
            const t = ch.reduce((a, c) => a + c.length, 0); const res = new Uint8Array(t); let p = 0;
            for (const c of ch) { res.set(c, p); p += c.length; }
            const decoded = new TextDecoder().decode(res);
            if (decoded.length > 10) { results.set(name, decoded); break; }
          } catch { /* try next format */ }
        }
      }
      if (results.size === targets.length) break;
    }
    off += 46 + nLen + eLen + cmtLen;
  }
  return results;
}

// ═══════════════════════════════════════════════════════════
// META EXTRACTION — reads font, size, margins, spacing from docx XML
// ═══════════════════════════════════════════════════════════
function extractMeta(stylesXml: string, documentXml: string): DocMeta {
  let font = 'Calibri', fontSize = 11, lineHeight = 1.15;
  const margins = { top: 2.5, bottom: 2.5, left: 2.5, right: 2.5 };
  // styles.xml Normal style
  if (stylesXml) {
    const nm = stylesXml.match(/<w:style[^>]*w:styleId="Normal"[^>]*>([\s\S]*?)<\/w:style>/);
    if (nm) {
      const nf = nm[1].match(/w:ascii="([^"]+)"/); if (nf) font = nf[1];
      const ns = nm[1].match(/<w:sz\s+w:val="(\d+)"/); if (ns) fontSize = parseInt(ns[1]) / 2;
    }
  }
  // document.xml: first run overrides (most docs set font/size per-run)
  if (documentXml) {
    const fr = documentXml.match(/<w:r\b[\s\S]*?<\/w:r>/);
    if (fr) {
      const rf = fr[0].match(/w:ascii="([^"]+)"/); if (rf) font = rf[1];
      const rs = fr[0].match(/<w:sz\s+w:val="(\d+)"/); if (rs) fontSize = parseInt(rs[1]) / 2;
    }
    // Line spacing from first paragraph
    const ls = documentXml.match(/<w:spacing[^/]*w:line="(\d+)"/);
    if (ls) lineHeight = Math.round(parseInt(ls[1]) / 240 * 100) / 100;
    // Page margins from sectPr
    const pm = documentXml.match(/<w:pgMar([^/]*)\/?>/);
    if (pm) {
      const m = pm[1];
      const t = m.match(/w:top="(-?\d+)"/); if (t) margins.top = Math.round(Math.abs(parseInt(t[1])) / 1440 * 2.54 * 10) / 10;
      const b = m.match(/w:bottom="(-?\d+)"/); if (b) margins.bottom = Math.round(Math.abs(parseInt(b[1])) / 1440 * 2.54 * 10) / 10;
      const l = m.match(/w:left="(\d+)"/); if (l) margins.left = Math.round(parseInt(l[1]) / 1440 * 2.54 * 10) / 10;
      const r = m.match(/w:right="(\d+)"/); if (r) margins.right = Math.round(parseInt(r[1]) / 1440 * 2.54 * 10) / 10;
    }
  }
  return { font, fontSize, lineHeight, margins };
}

// ═══════════════════════════════════════════════════════════
// HTML GENERATION — faithful reproduction of docx formatting
// ═══════════════════════════════════════════════════════════
function docxToHtml(xml: string, meta: DocMeta): { text: string; html: string } {
  if (!xml) return { text: '', html: '' };
  const paragraphs = xml.split('</w:p>');
  let text = '', html = '';
  for (const para of paragraphs) {
    // Paragraph alignment
    const jcM = para.match(/w:jc\s+w:val="([^"]+)"/);
    const align = jcM ? (jcM[1] === 'both' ? 'justify' : jcM[1]) : 'justify';
    // Paragraph indentation (twips → pt: divide by 20)
    let mLeft = 0, mRight = 0, tIndent = 0;
    const indM = para.match(/<w:ind([^/]*)\/?>/);
    if (indM) {
      const s = indM[1];
      const il = s.match(/w:left="(\d+)"/); if (il) mLeft = Math.round(parseInt(il[1]) / 20);
      const ir = s.match(/w:right="(\d+)"/); if (ir) mRight = Math.round(parseInt(ir[1]) / 20);
      const fi = s.match(/w:firstLine="(\d+)"/); if (fi) tIndent = Math.round(parseInt(fi[1]) / 20);
      const hi = s.match(/w:hanging="(\d+)"/); if (hi) tIndent = -Math.round(parseInt(hi[1]) / 20);
    }
    // Paragraph spacing override
    let spAfter = '';
    const spM = para.match(/<w:spacing([^/]*)\/?>/);
    if (spM) {
      const af = spM[1].match(/w:after="(\d+)"/);
      if (af) { const pts = Math.round(parseInt(af[1]) / 20); spAfter = pts > 0 ? 'margin-bottom:' + pts + 'pt;' : ''; }
    }
    // Paragraph-level bold (from pPr > rPr)
    const pprM = para.match(/<w:pPr>([\s\S]*?)<\/w:pPr>/);
    let pBold = false;
    if (pprM) {
      const rp = pprM[1].match(/<w:rPr>([\s\S]*?)<\/w:rPr>/);
      if (rp && /<w:b[\s\/]/.test(rp[1]) && !/<w:b\s+w:val="(false|0)"/.test(rp[1])) pBold = true;
    }
    // Extract runs
    const runRx = /<w:r\b[\s\S]*?<\/w:r>/g;
    const runs: { txt: string; bold: boolean; italic: boolean; underline: boolean; font: string | null; size: number | null }[] = [];
    let rm;
    while ((rm = runRx.exec(para)) !== null) {
      const run = rm[0];
      const tRx = /<w:t[^>]*>([^<]*)<\/w:t>/g;
      let tm, runTxt = '';
      while ((tm = tRx.exec(run)) !== null) runTxt += tm[1];
      if (!runTxt) continue;
      const bold = /<w:b[\s\/]/.test(run) && !/<w:b\s+w:val="(false|0)"/.test(run);
      const italic = /<w:i[\s\/]/.test(run) && !/<w:i\s+w:val="(false|0)"/.test(run);
      const underline = /<w:u[\s\/]/.test(run) && !/<w:u\s+w:val="none"/.test(run);
      const rf = run.match(/w:ascii="([^"]+)"/);
      const rs = run.match(/<w:sz\s+w:val="(\d+)"/);
      const runFont = rf && rf[1] !== meta.font ? rf[1] : null;
      const runSize = rs && parseInt(rs[1]) / 2 !== meta.fontSize ? parseInt(rs[1]) / 2 : null;
      runs.push({ txt: runTxt, bold: bold || pBold, italic, underline, font: runFont, size: runSize });
    }
    if (runs.length === 0) {
      html += '<p style="margin:0;line-height:' + meta.lineHeight + ';font-size:' + meta.fontSize + 'pt">&nbsp;</p>\n';
      text += '\n'; continue;
    }
    const fullText = runs.map(r => r.txt).join('');
    text += fullText + '\n';
    // Build inline HTML
    let inline = '';
    for (const r of runs) {
      let t = esc(r.txt);
      if (r.bold) t = '<strong>' + t + '</strong>';
      if (r.italic) t = '<em>' + t + '</em>';
      if (r.underline) t = '<u>' + t + '</u>';
      if (r.font || r.size) {
        let s = '';
        if (r.font) s += "font-family:'" + r.font + "',sans-serif;";
        if (r.size) s += 'font-size:' + r.size + 'pt;';
        t = '<span style="' + s + '">' + t + '</span>';
      }
      inline += t;
    }
    // Build paragraph style
    let st = 'margin:0;text-align:' + align + ';line-height:' + meta.lineHeight + ';';
    if (mLeft) st += 'margin-left:' + mLeft + 'pt;';
    if (mRight) st += 'margin-right:' + mRight + 'pt;';
    if (tIndent) st += 'text-indent:' + tIndent + 'pt;';
    st += spAfter;
    html += '<p style="' + st + '">' + inline + '</p>\n';
  }
  text = text.trim().replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'");
  return { text, html };
}

// Fallback: format server-returned plain text
function textToHtml(text: string, meta: DocMeta): string {
  if (!text) return '';
  return text.split('\n').map(line => {
    const t = line.trim();
    if (!t) return '<p style="margin:0;line-height:' + meta.lineHeight + '">&nbsp;</p>';
    let s = 'margin:0;text-align:justify;line-height:' + meta.lineHeight + ';';
    let c = esc(t);
    // Detect bold patterns
    if (/^(DECLARACIONES|CL\u00c1USULAS|ANEXO|FIRMAS):?\s*$/.test(t)) { s += 'text-align:center;'; c = '<strong>' + c + '</strong>'; }
    else if (/^(PRIMERA|SEGUNDA|TERCERA|CUARTA|QUINTA|SEXTA|S\u00c9PTIMA|OCTAVA|NOVENA|D\u00c9CIM|I{1,3}\.|IV\.|V\.)/.test(t)) c = '<strong>' + c + '</strong>';
    else if (/^[a-h]\)\s/.test(t)) s += 'margin-left:28pt;';
    else if (t.length > 50 && t === t.toUpperCase() && /^CONTRATO/.test(t)) c = '<strong>' + c + '</strong>';
    return '<p style="' + s + '">' + c + '</p>';
  }).join('\n');
}

// Main extraction orchestrator
async function extractDocxFull(file: File): Promise<{ text: string; html: string; meta: DocMeta }> {
  try {
    const entries = await readZipEntries(file, ['word/document.xml', 'word/styles.xml']);
    const docXml = entries.get('word/document.xml') || '';
    const styXml = entries.get('word/styles.xml') || '';
    if (!docXml) return { text: '', html: '', meta: DEFAULT_META };
    const meta = extractMeta(styXml, docXml);
    const { text, html } = docxToHtml(docXml, meta);
    console.log('Extracted:', text.length, 'chars, meta:', JSON.stringify(meta));
    return { text, html, meta };
  } catch (e) { console.error('DOCX extraction:', e); return { text: '', html: '', meta: DEFAULT_META }; }
}

// ═══════════════════════════════════════════════════════════
// PDF GENERATION — uses extracted meta for exact reproduction
// ═══════════════════════════════════════════════════════════
function buildCss(meta: DocMeta): string {
  const m = meta.margins;
  return '@page{margin:' + m.top.toFixed(1) + 'cm ' + m.right.toFixed(1) + 'cm ' + m.bottom.toFixed(1) + 'cm ' + m.left.toFixed(1) + 'cm;size:letter}'
    + "body{font-family:'" + meta.font + "',Carlito,Calibri,sans-serif;font-size:" + meta.fontSize + 'pt;line-height:' + meta.lineHeight + ';color:#000;margin:0;padding:0}'
    + 'p{margin:0}strong{font-weight:bold}em{font-style:italic}'
    + '.page-break{page-break-before:always}'
    // FX27 additions (cover page, analysis) use separate styling
    + ".fx{font-family:'Exo 2',Helvetica,sans-serif}"
    + '.fx-h1{font-size:20pt;color:#0c4a6e;border-bottom:3px solid #0284c7;padding-bottom:10px;margin-bottom:20px}'
    + '.fx-h2{font-size:14pt;color:#0c4a6e;margin-top:24px;border-left:4px solid #0284c7;padding-left:10px}'
    + '.fx-h3{font-size:12pt;color:#1e3a5f;margin:12px 0 6px}'
    + '.fx-meta{font-size:9pt;color:#777;margin-bottom:16px}'
    + '.fx-badge{display:inline-block;padding:3px 12px;border-radius:16px;font-weight:700;font-size:10pt}'
    + '.b-alta{background:#fee2e2;color:#dc2626}.b-media{background:#fef3c7;color:#d97706}.b-baja{background:#d1fae5;color:#059669}'
    + '.risk-box{border-left:5px solid;padding:12px 16px;margin:12px 0;border-radius:0 8px 8px 0}'
    + '.fx-warn{background:#fef2f2;border:2px solid #ef4444;padding:14px;border-radius:8px;margin:14px 0}'
    + '.fx-ok{background:#f0fdf4;border:2px solid #22c55e;padding:14px;border-radius:8px;margin:14px 0}'
    + '.fx-tbl{width:100%;border-collapse:collapse;margin:14px 0}.fx-tbl th,.fx-tbl td{padding:8px 12px;border:1px solid #d1d5db;text-align:left;font-size:10pt}'
    + ".fx-tbl th{background:#0c4a6e;color:#fff;font-family:'Exo 2',sans-serif}"
    + ".footer{margin-top:30px;padding-top:12px;border-top:2px solid #e5e7eb;font-family:'Exo 2',sans-serif;font-size:8pt;color:#aaa;text-align:center}";
}

function generarPDF(titulo: string, html: string, meta: DocMeta) {
  const w = window.open('', '_blank');
  if (!w) { alert('Permite ventanas emergentes'); return; }
  const fl = fontLink(meta.font);
  w.document.write('<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + titulo + '</title>'
    + '<link href="https://fonts.googleapis.com/css2?family=Exo+2:wght@400;600;700;900&display=swap" rel="stylesheet">'
    + fl
    + '<style>' + buildCss(meta) + '</style></head><body>' + html
    + '<div class="footer">FX27 — TROB TRANSPORTES S.A. DE C.V. | ' + new Date().toLocaleDateString('es-MX',{day:'2-digit',month:'long',year:'numeric'}) + '</div></body></html>');
  w.document.close(); setTimeout(() => w.print(), 800);
}

// ═══ PDF Content Builders ═══
function trobTable() {
  return '<table class="fx-tbl"><tr><th colspan="2" style="text-align:center;font-size:11pt">DATOS DEL TRANSPORTISTA</th></tr><tr><td style="width:30%;font-weight:700">Razón Social</td><td>TROB TRANSPORTES S.A. DE C.V.</td></tr><tr><td style="font-weight:700">RFC</td><td>TTR151216CHA</td></tr><tr><td style="font-weight:700">Representante Legal</td><td>Alejandro López Ramírez</td></tr><tr><td style="font-weight:700">Escritura Pública</td><td>21,183 Vol. 494</td></tr><tr><td style="font-weight:700">Notaría</td><td>Notaría Pública No. 35, Lic. Fernando Quezada Leos, Aguascalientes, Ags.</td></tr><tr><td style="font-weight:700">Banco</td><td>BBVA</td></tr></table>';
}
function contratoTable(d: any) {
  return '<table class="fx-tbl"><tr><th colspan="2" style="text-align:center;font-size:11pt">DATOS DEL CONTRATO</th></tr><tr><td style="width:30%;font-weight:700">Fecha</td><td>' + (d.fecha_contrato||'No especificado') + '</td></tr><tr><td style="font-weight:700">Partes</td><td>' + (Array.isArray(d.partes)?d.partes.join(' y '):d.partes||'No especificado') + '</td></tr><tr><td style="font-weight:700">Objeto</td><td>' + (d.objeto_contrato||'No especificado') + '</td></tr><tr><td style="font-weight:700">Vigencia</td><td>' + (d.vigencia||'No especificado') + '</td></tr><tr><td style="font-weight:700">Monto / Tarifa</td><td>' + (d.monto_o_tarifa||'No especificado') + '</td></tr><tr><td style="font-weight:700">Rep. Legal</td><td>' + (d.representante_legal||'No especificado') + '</td></tr><tr><td style="font-weight:700">Notaría</td><td>' + (d.notaria||'No especificado') + '</td></tr><tr><td style="font-weight:700">Escritura</td><td>' + (d.numero_escritura||'No especificado') + '</td></tr></table>';
}
function riskHtml(riesgos: RiesgoContrato[], faltantes: string[]) {
  let h = '';
  riesgos.forEach((r, i) => {
    const bc = r.severidad === 'ALTA' ? '#dc2626' : r.severidad === 'MEDIA' ? '#d97706' : '#059669';
    const bg = r.severidad === 'ALTA' ? '#fef2f2' : r.severidad === 'MEDIA' ? '#fffbeb' : '#f0fdf4';
    h += '<div class="risk-box" style="border-color:' + bc + ';background:' + bg + '"><p class="fx fx-h3">' + (i+1) + '. ' + r.clausula + ' <span class="fx-badge b-' + r.severidad.toLowerCase() + '">' + r.severidad + '</span></p>';
    if (r.texto_original) h += '<div style="padding:8px 12px;background:rgba(0,0,0,0.04);border-radius:4px;margin:6px 0"><p style="margin:0;font-size:9pt;color:#999;font-weight:700">❌ DICE:</p><p style="margin:3px 0 0;font-size:10pt;font-style:italic">"' + r.texto_original + '"</p></div>';
    h += '<div style="padding:8px 12px;background:rgba(0,0,0,0.03);border-radius:4px;margin:6px 0"><p style="margin:0;font-size:9pt;color:#999;font-weight:700">⚠️ RIESGO:</p><p style="margin:3px 0 0;font-size:10pt">' + r.descripcion + '</p></div>';
    h += '<div style="padding:8px 12px;background:rgba(34,197,94,0.06);border-left:3px solid #22c55e;border-radius:4px;margin:6px 0"><p style="margin:0;font-size:9pt;color:#059669;font-weight:700">✅ DEBERÍA DECIR:</p><p style="margin:3px 0 0;font-size:10pt">' + r.sugerencia + '</p></div></div>';
  });
  if (faltantes.length) {
    h += '<p class="fx fx-h2" style="color:#b91c1c">CLÁUSULAS QUE DEBEN INCORPORARSE</p>';
    faltantes.forEach((c, i) => { h += '<div style="background:#fff7ed;border-left:4px solid #ea580c;padding:10px 14px;margin:8px 0;border-radius:0 6px 6px 0;font-size:10pt"><strong>' + (i+1) + '.</strong> ' + c + '</div>'; });
  }
  return h;
}
function verdictHtml(r: AnalisisContrato, f: string) {
  const ok = r.veredicto === 'FIRMAR';
  const brd = ok ? '#22c55e' : '#dc2626'; const bg = ok ? '#f0fdf4' : '#fef2f2';
  const tc = ok ? '#16a34a' : '#dc2626'; const sc = ok ? '#166534' : '#991b1b'; const bc = ok ? '#14532d' : '#7f1d1d';
  return '<div class="page-break" style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:80vh;text-align:center"><div style="border:8px solid ' + brd + ';border-radius:20px;padding:60px 80px;background:' + bg + '"><p class="fx" style="font-size:56pt;font-weight:900;color:' + tc + ';margin:0;line-height:1.1">' + (ok ? '✅ APTO PARA FIRMA' : '⛔ NO FIRMAR') + '</p><div style="width:100%;height:4px;background:' + brd + ';margin:30px 0"></div><p class="fx" style="font-size:16pt;color:' + sc + ';margin:10px 0;font-weight:700">' + (ok ? 'CONTRATO DE BUENA FE' : r.riesgos.length + ' PUNTOS DE RIESGO') + '</p>' + (!ok && r.es_leonino ? '<p class="fx" style="font-size:20pt;color:#dc2626;margin:16px 0;font-weight:900">🚨 CONTRATO LEONINO 🚨</p>' : '') + '<p style="font-size:12pt;color:' + bc + ';margin:20px 0;line-height:1.8;max-width:600px">' + (r.justificacion_veredicto || '') + '</p><div style="margin-top:30px;padding:14px 20px;background:' + (ok ? '#16a34a' : '#dc2626') + ';border-radius:10px"><p class="fx" style="font-size:13pt;color:#fff;margin:0;font-weight:700">' + (ok ? 'Proceder con firma previa revisión legal.' : 'No firmar hasta corrección por legal de TROB.') + '</p></div><p style="font-size:9pt;color:#aaa;margin:24px 0 0">Calificación: ' + r.calificacion_riesgo + '/10 | TROB TRANSPORTES | ' + f + '</p></div></div>';
}

const PASOS = [
  { texto: 'Preparando documento', pct: 8 }, { texto: 'Extrayendo texto y estructura', pct: 20 },
  { texto: 'Identificando partes', pct: 35 }, { texto: 'Analizando cláusulas', pct: 52 },
  { texto: 'Evaluando riesgos para TROB', pct: 68 }, { texto: 'Detectando cláusulas leoninas', pct: 80 },
  { texto: 'Generando versión blindada', pct: 92 },
];

export default function AnalisisContratosModule({ onBack }: Props) {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [archivoBase64, setArchivoBase64] = useState('');
  const [textoExtraido, setTextoExtraido] = useState('');
  const [textoHtml, setTextoHtml] = useState('');
  const [docMeta, setDocMeta] = useState<DocMeta>(DEFAULT_META);
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
    setArchivo(file); setError(''); setResultado(null); setTextoExtraido(''); setTextoHtml(''); setDocMeta(DEFAULT_META);
    const reader = new FileReader();
    reader.onload = () => setArchivoBase64((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
    if (ext === 'docx') {
      try {
        const { text, html, meta } = await extractDocxFull(file);
        if (text && text.length > 30) setTextoExtraido(text);
        if (html && html.length > 30) setTextoHtml(html);
        setDocMeta(meta);
      } catch (e) { console.warn('Client extraction failed:', e); }
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
    const body: any = { nombre_archivo: archivo?.name || '', tipo_archivo: archivo?.type || '',
      fecha_analisis: new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }),
      texto_extraido: textoExtraido || '', archivo_base64: archivoBase64 || '' };
    try {
      const r = await fetch(supabaseUrl + '/functions/v1/analizar-contrato', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + supabaseAnonKey },
        signal: ctrl.signal, body: JSON.stringify(body) });
      clearTimeout(tm); if (!r.ok) throw new Error('HTTP ' + r.status); return await r.json();
    } catch (e: any) { clearTimeout(tm); throw e; }
  };

  const analizar = async () => {
    if (!archivoBase64 && !textoExtraido) return;
    setAnalizando(true); setError(''); setResultado(null); setIntentoActual(0); startProgress();
    for (let i = 1; i <= 3; i++) {
      setIntentoActual(i);
      try {
        const data = await callEdge();
        if (data.success && data.analisis) {
          stopProgress(true); await new Promise(r => setTimeout(r, 500)); setResultado(data.analisis);
          // If client extraction failed, use server text
          if (!textoExtraido && data.texto_usado && data.texto_usado.length > 50 && !data.texto_usado.startsWith('PK')) {
            setTextoExtraido(data.texto_usado);
            setTextoHtml(textToHtml(data.texto_usado, docMeta));
          }
          setAnalizando(false); return;
        }
        throw new Error(data.error || 'Respuesta inválida');
      } catch (err: any) {
        if (i < 3) { setProgreso(3); setPasoActual(0); await new Promise(r => setTimeout(r, i * 3000)); startProgress(); }
        else { stopProgress(false); setError('Error: ' + err.message); setAnalizando(false); }
      }
    }
  };

  const riskColor = (s: number) => s >= 7 ? { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', label: 'ALTO' } : s >= 4 ? { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', label: 'MEDIO' } : { color: '#22c55e', bg: 'rgba(34,197,94,0.08)', label: 'BAJO' };
  const sevColor = (s: string) => s === 'ALTA' ? { bg: '#fee2e2', color: '#dc2626' } : s === 'MEDIA' ? { bg: '#fef3c7', color: '#d97706' } : { bg: '#d1fae5', color: '#059669' };
  const toggle = (k: string) => setSecciones(p => ({ ...p, [k]: !p[k] }));
  const fecha = () => new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
  const getHtml = (): string => textoHtml || (textoExtraido ? textToHtml(textoExtraido, docMeta) : '<p style="color:#999;font-style:italic">(Sin texto)</p>');

  // ═══ BTN 1: CONTRATO COMPLETO ═══
  // Cover page with FX27 data → Page break → EXACT clone of original document → Analysis
  const descargarCompleto = () => {
    if (!resultado) return; const f = fecha();
    // Cover page (FX27 branded)
    let h = '<div class="fx" style="text-align:center;margin-bottom:30px"><p style="font-size:9pt;color:#666;letter-spacing:3px;text-transform:uppercase;margin:0">TROB TRANSPORTES S.A. DE C.V.</p><p class="fx-h1" style="border-bottom:none;margin:6px 0">CONTRATO</p><p style="font-size:10pt;color:#666">' + (archivo?.name || '') + ' | ' + f + '</p><div style="width:80px;height:3px;background:#0284c7;margin:10px auto"></div></div>';
    h += '<div class="fx">' + contratoTable(resultado.datos_extraidos) + trobTable() + '</div>';
    // Contract body — EXACT CLONE of original formatting
    h += '<div class="page-break"></div>' + getHtml();
    // Analysis (if risks exist)
    if (resultado.riesgos.length > 0 || resultado.es_leonino) {
      h += '<div class="page-break"></div><div class="fx"><p class="fx-h1" style="color:#b91c1c;border-bottom-color:#dc2626">OBSERVACIONES Y DICTAMEN</p><p class="fx-meta">Análisis para TROB TRANSPORTES | ' + f + '</p>';
      if (resultado.es_leonino) h += '<div class="fx-warn"><strong style="font-size:13pt;color:#dc2626">🚨 CONTRATO LEONINO</strong><p>' + resultado.explicacion_leonino + '</p></div>';
      h += '<p class="fx-h2">RIESGOS (' + resultado.riesgos.length + ')</p>' + riskHtml(resultado.riesgos, resultado.clausulas_faltantes) + '</div>';
    }
    h += verdictHtml(resultado, f);
    generarPDF('Contrato Completo - TROB', h, docMeta);
  };

  // ═══ BTN 2: BLINDADA ═══
  const descargarBlindada = () => {
    if (!resultado) return; const f = fecha();
    const bHtml = resultado.version_blindada ? textToHtml(resultado.version_blindada, docMeta) : '<p>(No disponible)</p>';
    let h = '<div class="fx" style="text-align:center;margin-bottom:30px"><p style="font-size:9pt;color:#059669;letter-spacing:3px;text-transform:uppercase;margin:0">VERSIÓN BLINDADA — PROTECCIÓN TOTAL TROB</p><p class="fx-h1" style="border-bottom-color:#22c55e;margin:6px 0">CONTRATO CORREGIDO</p><p style="font-size:10pt;color:#666">' + (archivo?.name || '') + ' | ' + f + '</p></div>';
    h += '<div class="fx"><div class="fx-ok"><strong>🛡️ DOCUMENTO BLINDADO</strong><p style="margin:4px 0 0">Protege al 100% los intereses de TROB TRANSPORTES S.A. DE C.V.</p></div>';
    h += contratoTable(resultado.datos_extraidos) + trobTable() + '</div>';
    h += '<div class="page-break"></div>' + bHtml;
    if (resultado.riesgos.length > 0) {
      h += '<div class="page-break"></div><div class="fx"><p class="fx-h1" style="color:#0c4a6e">REGISTRO DE CORRECCIONES</p><p class="fx-meta">Cambios aplicados | ' + f + '</p>';
      resultado.riesgos.forEach((r, i) => {
        h += '<div style="border-left:5px solid #0284c7;padding:12px 16px;margin:12px 0;background:#f0f9ff;border-radius:0 8px 8px 0"><p class="fx fx-h3">' + (i+1) + '. ' + r.clausula + ' <span class="fx-badge b-' + r.severidad.toLowerCase() + '">' + r.severidad + '</span></p>';
        if (r.texto_original) h += '<div style="padding:8px 12px;background:rgba(239,68,68,0.05);border-left:3px solid #ef4444;border-radius:4px;margin:6px 0"><p style="margin:0;font-size:9pt;color:#dc2626;font-weight:700">ANTES:</p><p style="margin:3px 0 0;font-size:10pt;font-style:italic;text-decoration:line-through;color:#666">"' + r.texto_original + '"</p></div>';
        h += '<div style="padding:8px 12px;background:rgba(34,197,94,0.06);border-left:3px solid #22c55e;border-radius:4px;margin:6px 0"><p style="margin:0;font-size:9pt;color:#059669;font-weight:700">DESPUÉS:</p><p style="margin:3px 0 0;font-size:10pt">' + r.sugerencia + '</p></div></div>';
      });
      h += '</div>';
    }
    h += '<div class="page-break" style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:80vh;text-align:center"><div style="border:8px solid #22c55e;border-radius:20px;padding:60px 80px;background:#f0fdf4"><p class="fx" style="font-size:50pt;font-weight:900;color:#16a34a;margin:0;line-height:1.1">✅ APTO PARA FIRMA</p><div style="width:100%;height:4px;background:#22c55e;margin:30px 0"></div><p class="fx" style="font-size:16pt;color:#166534;margin:10px 0;font-weight:700">CORRECCIONES APLICADAS</p><p style="font-size:12pt;color:#14532d;margin:20px 0;line-height:1.8">Se corrigieron ' + resultado.riesgos.length + ' punto' + (resultado.riesgos.length!==1?'s':'') + ' de riesgo.</p></div></div>';
    generarPDF('Blindada TROB', h, docMeta);
  };

  // ═══ BTN 3: RIESGOS ═══
  const descargarRiesgos = () => {
    if (!resultado) return; const rg = riskColor(resultado.calificacion_riesgo); const f = fecha();
    const [a, m, b] = [resultado.riesgos.filter(r => r.severidad === 'ALTA'), resultado.riesgos.filter(r => r.severidad === 'MEDIA'), resultado.riesgos.filter(r => r.severidad === 'BAJA')];
    let h = '<div class="fx"><p class="fx-h1">⚠️ Análisis de Riesgos</p><p class="fx-meta">' + (archivo?.name || '') + ' | ' + f + '</p><div style="text-align:center;margin:20px 0"><span class="fx-badge b-' + rg.label.toLowerCase() + '" style="font-size:16pt">' + resultado.calificacion_riesgo + '/10 — RIESGO ' + rg.label + '</span></div>';
    if (resultado.es_leonino) h += '<div class="fx-warn"><strong>⚠️ CONTRATO LEONINO</strong><p>' + resultado.explicacion_leonino + '</p></div>';
    h += '<p class="fx-h2">Resumen Ejecutivo</p><p style="text-align:justify;line-height:1.8">' + resultado.resumen_ejecutivo + '</p>';
    h += '<p class="fx-h2">Distribución</p><table class="fx-tbl"><tr><th>Severidad</th><th>Cantidad</th></tr><tr><td><span class="fx-badge b-alta">ALTA</span></td><td>' + a.length + '</td></tr><tr><td><span class="fx-badge b-media">MEDIA</span></td><td>' + m.length + '</td></tr><tr><td><span class="fx-badge b-baja">BAJA</span></td><td>' + b.length + '</td></tr></table>';
    h += '<p class="fx-h2">Detalle</p>' + riskHtml([...a,...m,...b], resultado.clausulas_faltantes) + '</div>' + verdictHtml(resultado, f);
    generarPDF('Análisis Riesgos - TROB', h, docMeta);
  };

  // ═══ UI ═══
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
              style={{ background: dragOver ? 'linear-gradient(135deg, rgba(14,165,233,0.12), rgba(6,78,59,0.08))' : 'linear-gradient(135deg, rgba(15,23,42,0.90), rgba(30,41,59,0.70))', border: dragOver ? '2px dashed #0ea5e9' : '2px dashed rgba(100,116,139,0.25)', minHeight: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <input ref={fileRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.xlsx,.xls,.png,.jpg,.jpeg" onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
              {archivo ? (<>
                <div className="p-4 rounded-2xl mb-3" style={{ background: 'linear-gradient(135deg, rgba(14,165,233,0.15), rgba(14,165,233,0.05))' }}><FileText className="w-12 h-12" style={{ color: '#38bdf8' }} /></div>
                <p style={{ fontFamily: F, fontSize: '16px', fontWeight: 700, color: '#f1f5f9' }}>{archivo.name}</p>
                <p style={{ fontFamily: F, fontSize: '13px', color: '#64748b', marginTop: '4px' }}>{(archivo.size / (1024 * 1024)).toFixed(2)} MB{textoExtraido ? ' · ' + textoExtraido.length + ' chars' : ''}{textoHtml ? ' · ' + docMeta.font + ' ' + docMeta.fontSize + 'pt' : ''}</p>
                <button onClick={e => { e.stopPropagation(); setArchivo(null); setArchivoBase64(''); setTextoExtraido(''); setTextoHtml(''); setDocMeta(DEFAULT_META); setError(''); }}
                  className="mt-3 flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/5"
                  style={{ fontFamily: F, fontSize: '13px', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.15)' }}><RotateCcw className="w-4 h-4" /> Cambiar</button>
              </>) : (<>
                <div className="p-4 rounded-2xl mb-3" style={{ background: 'rgba(30,41,59,0.60)' }}><Upload className="w-12 h-12" style={{ color: '#475569' }} /></div>
                <p style={{ fontFamily: F, fontSize: '16px', fontWeight: 600, color: '#94a3b8' }}>Arrastra tu contrato aquí</p>
                <p style={{ fontFamily: F, fontSize: '12px', color: '#475569', marginTop: '4px' }}>PDF, Word, Excel, PNG, JPG — Máx 10MB</p>
              </>)}
            </div>
            {error && (
              <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: 'linear-gradient(135deg, rgba(127,29,29,0.20), rgba(30,41,59,0.80))', border: '1px solid rgba(239,68,68,0.25)' }}>
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#f87171' }} />
                <div><p style={{ fontFamily: F, fontSize: '14px', color: '#fca5a5' }}>{error}</p>
                  <button onClick={analizar} className="mt-2 flex items-center gap-2 px-4 py-2 rounded-lg hover:brightness-110"
                    style={{ background: 'rgba(14,165,233,0.15)', fontFamily: F, fontSize: '13px', color: '#7dd3fc', border: '1px solid rgba(14,165,233,0.25)' }}><RefreshCw className="w-4 h-4" /> Reintentar</button>
                </div>
              </div>
            )}
            {archivo && !analizando && (
              <div className="flex justify-center">
                <button onClick={analizar} disabled={!archivoBase64 && !textoExtraido} className="flex items-center gap-3 px-8 py-4 rounded-xl hover:brightness-110 disabled:opacity-40"
                  style={{ background: (archivoBase64 || textoExtraido) ? 'linear-gradient(135deg, #0284c7, #0369a1, #075985)' : 'rgba(30,41,59,0.50)', fontFamily: F, fontSize: '16px', fontWeight: 700, color: '#f0f9ff', boxShadow: (archivoBase64 || textoExtraido) ? '0 6px 28px rgba(3,105,161,0.40)' : 'none', border: '1px solid rgba(14,165,233,0.30)' }}>
                  <ShieldCheck className="w-6 h-6" /> Analizar Contrato
                </button>
              </div>
            )}
            {analizando && (
              <div className="rounded-2xl p-6 space-y-5" style={{ background: 'linear-gradient(180deg, rgba(15,23,42,0.95), rgba(30,41,59,0.85))', border: '1px solid rgba(148,163,184,0.10)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3"><Loader2 className="w-5 h-5 animate-spin" style={{ color: '#38bdf8' }} /><span style={{ fontFamily: F, fontSize: '15px', fontWeight: 700, color: '#f1f5f9' }}>Analizando...</span></div>
                  <span style={{ fontFamily: F, fontSize: '24px', fontWeight: 800, color: '#38bdf8' }}>{Math.round(progreso)}%</span>
                </div>
                <div className="w-full rounded-full overflow-hidden" style={{ height: '12px', background: 'rgba(30,41,59,0.80)' }}>
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: progreso + '%', background: 'linear-gradient(90deg, #075985, #0284c7, #38bdf8, #7dd3fc)' }} />
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
                {intentoActual > 1 && <div className="flex items-center gap-2" style={{ fontFamily: F, fontSize: '12px', color: '#fbbf24' }}><RefreshCw className="w-4 h-4" />Reintento {intentoActual}/3</div>}
              </div>
            )}
          </div>
        )}
        {resultado && (
          <div className="space-y-4">
            {(() => { const rg = riskColor(resultado.calificacion_riesgo); return (
              <div className="rounded-xl p-5" style={{ background: 'linear-gradient(135deg, ' + rg.bg + ', rgba(15,23,42,0.90))', border: '1px solid ' + rg.color + '25' }}>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {[{ c: '#ef4444', on: resultado.calificacion_riesgo >= 7 }, { c: '#f59e0b', on: resultado.calificacion_riesgo >= 4 && resultado.calificacion_riesgo <= 6 }, { c: '#22c55e', on: resultado.calificacion_riesgo <= 3 }].map((l, i) => (
                        <div key={i} style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid ' + l.c, background: l.on ? l.c : l.c + '15', boxShadow: l.on ? '0 0 12px ' + l.c + '60' : 'none' }} />
                      ))}
                    </div>
                    <div>
                      <p style={{ fontFamily: F, fontSize: '18px', fontWeight: 800, color: rg.color }}>{resultado.calificacion_riesgo}/10 — {resultado.veredicto === 'FIRMAR' ? '✅ APTO' : '⛔ NO FIRMAR'}</p>
                      <p style={{ fontFamily: F, fontSize: '12px', color: '#94a3b8' }}>{resultado.riesgos.length} riesgos{resultado.es_leonino ? ' · LEONINO' : ''} | {docMeta.font} {docMeta.fontSize}pt</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { fn: descargarCompleto, label: 'Contrato Completo', icon: <Download className="w-4 h-4" />, bg: 'linear-gradient(135deg, #1d4ed8, #1e3a8a)' },
                      { fn: descargarBlindada, label: 'Blindada TROB', icon: <Shield className="w-4 h-4" />, bg: 'linear-gradient(135deg, #16a34a, #15803d)' },
                      { fn: descargarRiesgos, label: 'Análisis Riesgos', icon: <AlertTriangle className="w-4 h-4" />, bg: 'linear-gradient(135deg, #ea580c, #c2410c)' },
                    ].map((b, i) => (
                      <button key={i} onClick={b.fn} className="flex items-center gap-2 px-4 py-2.5 rounded-lg hover:brightness-110"
                        style={{ background: b.bg, fontFamily: F, fontSize: '13px', fontWeight: 600, color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.20)' }}>{b.icon} {b.label}</button>
                    ))}
                    <button onClick={() => { setResultado(null); setArchivo(null); setArchivoBase64(''); setTextoExtraido(''); setTextoHtml(''); setDocMeta(DEFAULT_META); setError(''); setProgreso(0); }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg hover:bg-white/5"
                      style={{ fontFamily: F, fontSize: '13px', fontWeight: 600, color: '#94a3b8', border: '1px solid rgba(148,163,184,0.15)' }}><RotateCcw className="w-4 h-4" /> Nuevo</button>
                  </div>
                </div>
              </div>); })()}
            {resultado.es_leonino && (
              <div className="rounded-xl p-5" style={{ background: 'linear-gradient(135deg, rgba(127,29,29,0.15), rgba(15,23,42,0.90))', border: '2px solid rgba(239,68,68,0.30)' }}>
                <div className="flex items-start gap-3"><ShieldAlert className="w-6 h-6 flex-shrink-0" style={{ color: '#f87171' }} />
                  <div><p style={{ fontFamily: F, fontSize: '16px', fontWeight: 700, color: '#f87171' }}>⚠️ Contrato Leonino</p>
                    <p style={{ fontFamily: F, fontSize: '13px', color: '#cbd5e1', marginTop: '6px', lineHeight: '1.7' }}>{resultado.explicacion_leonino}</p></div>
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
                {resultado.riesgos.map((r, i) => { const sc = sevColor(r.severidad); return (
                  <div key={i} className="rounded-lg p-4" style={{ background: 'rgba(30,41,59,0.40)', borderLeft: '4px solid ' + sc.color }}>
                    <div className="flex items-center justify-between mb-2">
                      <p style={{ fontFamily: F, fontSize: '14px', fontWeight: 700, color: '#f1f5f9' }}>{r.clausula}</p>
                      <span className="px-2.5 py-1 rounded-full" style={{ background: sc.color + '15', fontFamily: F, fontSize: '11px', fontWeight: 700, color: sc.color }}>{r.severidad}</span>
                    </div>
                    {r.texto_original && <p style={{ fontFamily: F, fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', background: 'rgba(239,68,68,0.04)', padding: '8px 12px', borderRadius: '6px', borderLeft: '3px solid rgba(239,68,68,0.30)', margin: '4px 0' }}>❌ "{r.texto_original}"</p>}
                    <p style={{ fontFamily: F, fontSize: '13px', color: '#94a3b8', lineHeight: '1.6', marginTop: '6px' }}>{r.descripcion}</p>
                    <div className="mt-3 p-3 rounded-lg" style={{ background: 'rgba(14,165,233,0.05)', border: '1px solid rgba(14,165,233,0.10)' }}>
                      <p style={{ fontFamily: F, fontSize: '12px', color: '#7dd3fc' }}><strong style={{ color: '#38bdf8' }}>✅ Debería decir:</strong> {r.sugerencia}</p>
                    </div>
                  </div>); })}
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
