// supabase/functions/analizar-contrato/index.ts
// GRUPO LOMA | TROB TRANSPORTES | v7.0
// Server-side .docx extraction fallback

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function ok(data: any) {
  return new Response(JSON.stringify(data), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

// ═══ SERVER-SIDE .DOCX TEXT EXTRACTION ═══
function extractDocxTextFromBytes(u8: Uint8Array): string {
  try {
    const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
    // Find EOCD
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
        if (method === 0) {
          xml = new TextDecoder().decode(comp);
        } else if (method === 8) {
          // Deflate — use Deno's DecompressionStream
          try {
            const ds2 = new DecompressionStream('raw');
            const writer = ds2.writable.getWriter();
            const reader = ds2.readable.getReader();
            const chunks: Uint8Array[] = [];
            // Write and close in background
            writer.write(comp).then(() => writer.close()).catch(() => {});
            // Read synchronously via loop
            const readAll = async () => {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(value);
              }
            };
            // We can't await here in a sync function, so use alternative
            // Fallback: manual inflate using raw bytes
            xml = '';
          } catch (_) {
            xml = '';
          }
        }
        // If deflate failed, try regex on raw compressed data (works for low compression)
        if (!xml && method === 8) {
          // Try to find <w:t> tags in the raw data (sometimes works with store-level compression)
          const raw = new TextDecoder('utf-8', { fatal: false }).decode(comp);
          if (raw.includes('<w:t')) xml = raw;
        }
        if (xml) {
          let txt = '';
          for (const para of xml.split('</w:p>')) {
            const ws: string[] = [];
            const rx = /<w:t[^>]*>([^<]*)<\/w:t>/g;
            let m; while ((m = rx.exec(para)) !== null) ws.push(m[1]);
            if (ws.length) txt += ws.join('') + '\n';
          }
          return txt.trim()
            .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"').replace(/&apos;/g, "'");
        }
      }
      off += 46 + nLen + eLen + cmtLen;
    }
    return '';
  } catch (e) {
    console.error('[contrato] docx extract error:', e);
    return '';
  }
}

// Async version with proper DecompressionStream
async function extractDocxTextAsync(u8: Uint8Array): Promise<string> {
  try {
    const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
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
        if (method === 0) {
          xml = new TextDecoder().decode(comp);
        } else if (method === 8) {
          try {
            const dec = new DecompressionStream('raw');
            const w = dec.writable.getWriter();
            w.write(comp); w.close();
            const r = dec.readable.getReader();
            const ch: Uint8Array[] = [];
            while (true) { const { done, value } = await r.read(); if (done) break; ch.push(value); }
            const total = ch.reduce((a, c) => a + c.length, 0);
            const result = new Uint8Array(total); let p = 0;
            for (const c of ch) { result.set(c, p); p += c.length; }
            xml = new TextDecoder().decode(result);
          } catch (e) {
            console.error('[contrato] decompress error:', e);
          }
        }
        if (xml) {
          let txt = '';
          for (const para of xml.split('</w:p>')) {
            const ws: string[] = [];
            const rx = /<w:t[^>]*>([^<]*)<\/w:t>/g;
            let m; while ((m = rx.exec(para)) !== null) ws.push(m[1]);
            if (ws.length) txt += ws.join('') + '\n';
          }
          return txt.trim()
            .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"').replace(/&apos;/g, "'");
        }
      }
      off += 46 + nLen + eLen + cmtLen;
    }
    return '';
  } catch (e) {
    console.error('[contrato] docx async extract:', e);
    return '';
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!ANTHROPIC_API_KEY) return ok({ success: false, error: "ANTHROPIC_API_KEY no configurada." });

    let body;
    try { body = await req.json(); } catch (_) { return ok({ success: false, error: "Error al leer solicitud." }); }

    let { archivo_base64, nombre_archivo, tipo_archivo, fecha_analisis, texto_extraido } = body;
    if (!archivo_base64 && !texto_extraido) return ok({ success: false, error: "No se recibió archivo ni texto." });

    const fn = (nombre_archivo || "").toLowerCase();
    const fechaStr = fecha_analisis || new Date().toLocaleDateString("es-MX");
    const isPDF = tipo_archivo?.includes("pdf") || fn.endsWith(".pdf");
    const isImage = tipo_archivo?.includes("image") || /\.(png|jpg|jpeg|gif|webp)$/.test(fn);
    const isDocx = fn.endsWith(".docx");
    const isDoc = fn.endsWith(".doc") && !isDocx;
    const isExcel = fn.endsWith(".xlsx") || fn.endsWith(".xls");

    console.log(`[contrato] ${nombre_archivo} | tipo=${tipo_archivo} | texto=${texto_extraido ? texto_extraido.length : 0} | b64=${archivo_base64 ? archivo_base64.length : 0}`);

    // ═══ DOCX FALLBACK: If client didn't extract text, do it server-side ═══
    if ((!texto_extraido || texto_extraido.length <= 30) && isDocx && archivo_base64) {
      console.log('[contrato] Client extraction failed, trying server-side docx extraction...');
      try {
        const binaryStr = atob(archivo_base64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
        const extracted = await extractDocxTextAsync(bytes);
        if (extracted && extracted.length > 30) {
          texto_extraido = extracted;
          console.log(`[contrato] Server extraction SUCCESS: ${extracted.length} chars`);
        } else {
          console.log(`[contrato] Server extraction got ${extracted.length} chars, trying raw decode...`);
          // Last resort: try to decode as plain text and look for readable content
          const raw = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
          const readable = raw.replace(/[^\x20-\x7E\xA0-\xFF\u0100-\uFFFF]/g, ' ').replace(/\s{3,}/g, '\n').trim();
          if (readable.length > 100) {
            texto_extraido = readable;
            console.log(`[contrato] Raw decode fallback: ${readable.length} chars`);
          }
        }
      } catch (e) {
        console.error('[contrato] Server extraction failed:', e);
      }
    }

    // ═══ BUILD CLAUDE REQUEST ═══
    const content: any[] = [];
    let needsPdfBeta = false;

    if (texto_extraido && texto_extraido.length > 30) {
      console.log(`[contrato] Using text: ${texto_extraido.length} chars`);
      content.push({ type: "text", text: `TEXTO DEL CONTRATO "${nombre_archivo}":\n\n${texto_extraido}\n\nFecha: ${fechaStr}. Analiza para TROB TRANSPORTES. RESPONDE SOLO JSON VÁLIDO.` });
    } else if (isPDF && archivo_base64) {
      needsPdfBeta = true;
      content.push(
        { type: "document", source: { type: "base64", media_type: "application/pdf", data: archivo_base64 } },
        { type: "text", text: `Analiza este contrato PDF para TROB TRANSPORTES. "${nombre_archivo}". Fecha: ${fechaStr}. RESPONDE SOLO JSON VÁLIDO.` }
      );
    } else if (isImage && archivo_base64) {
      const ext = fn.split(".").pop() || "jpeg";
      const mt: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp" };
      content.push(
        { type: "image", source: { type: "base64", media_type: mt[ext] || "image/jpeg", data: archivo_base64 } },
        { type: "text", text: `Imagen de contrato. Analízalo para TROB TRANSPORTES. Fecha: ${fechaStr}. RESPONDE SOLO JSON VÁLIDO.` }
      );
    } else {
      // LAST RESORT: send whatever we have as text to Claude
      console.log(`[contrato] Last resort: sending filename + available info`);
      const fallbackText = texto_extraido || '(No se pudo extraer texto del archivo)';
      content.push({ type: "text", text: `Archivo: "${nombre_archivo}". Contenido disponible:\n${fallbackText}\n\nFecha: ${fechaStr}. Genera análisis para TROB TRANSPORTES con la información disponible. RESPONDE SOLO JSON VÁLIDO.` });
    }

    const systemPrompt = `Eres un abogado corporativo especialista en derecho mercantil y transporte en México.
Analiza el contrato y responde ÚNICAMENTE con JSON válido (sin backticks, sin texto adicional).

{
  "datos_extraidos": {
    "representante_legal": "nombre o 'No especificado'",
    "notaria": "info o 'No especificado'",
    "numero_escritura": "número o 'No especificado'",
    "fecha_contrato": "fecha o 'No especificado'",
    "partes": ["Parte A", "Parte B"],
    "objeto_contrato": "descripción breve",
    "vigencia": "duración o 'No especificado'",
    "monto_o_tarifa": "condiciones económicas o 'No especificado'"
  },
  "es_leonino": false,
  "explicacion_leonino": "Explicación detallada de por qué es o no es leonino",
  "riesgos": [
    {
      "clausula": "Nombre/número de la cláusula",
      "texto_original": "COPIA TEXTUAL de la parte problemática tal como aparece en el contrato",
      "descripcion": "Por qué es riesgoso para TROB",
      "severidad": "ALTA|MEDIA|BAJA",
      "sugerencia": "Texto COMPLETO corregido que debería reemplazar al original"
    }
  ],
  "resumen_ejecutivo": "3-5 párrafos de análisis completo",
  "clausulas_faltantes": ["descripción de cada cláusula que debería existir pero no está"],
  "version_blindada": "CONTRATO COMPLETO reescrito con TODAS las correcciones aplicadas para proteger 100% a TROB. Debe ser el texto final completo listo para firma. NUNCA truncar. NUNCA resumir. Incluir TODAS las cláusulas.",
  "calificacion_riesgo": 7,
  "veredicto": "FIRMAR o NO FIRMAR",
  "justificacion_veredicto": "Párrafo detallado explicando por qué se recomienda firmar o no"
}

IMPORTANTE: NO incluyas el texto original completo del contrato. Solo incluye version_blindada (contrato corregido completo).

TROB TRANSPORTES - transportista de carga mexicano:
- Proteger contra: responsabilidad excesiva, penalizaciones desproporcionadas, plazos pago >30 días, sin fuerza mayor, jurisdicción fuera de Aguascalientes
- Verificar: limitación responsabilidad, seguro mercancía, obligaciones recíprocas, resolución controversias, terminación bilateral
- Calificación 1-10 (1=seguro, 10=peligroso)
- veredicto "FIRMAR" si calificación <= 4, "NO FIRMAR" si > 4
- version_blindada: contrato COMPLETO con correcciones, NUNCA truncar
- Cada riesgo DEBE incluir texto_original (fragmento del contrato) y sugerencia (texto corregido)

Info TROB: Escritura 21,183 Vol 494, Notaría 35, Lic. Fernando Quezada Leos, Ags. Rep. legal: Alejandro López Ramírez. RFC: TTR151216CHA. BBVA.
SOLO JSON VÁLIDO.`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    };
    if (needsPdfBeta) headers["anthropic-beta"] = "pdfs-2024-09-25";

    let res;
    try {
      res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 32000,
          system: systemPrompt,
          messages: [{ role: "user", content: content }],
        }),
      });
    } catch (e: any) {
      return ok({ success: false, error: `Error conexión IA: ${e.message}` });
    }

    if (!res.ok) {
      const err = await res.text().catch(() => "");
      console.error(`[contrato] ${res.status}: ${err.substring(0, 400)}`);
      const m: Record<number, string> = { 401: "API key inválida.", 429: "Demasiadas solicitudes. Espera 30s.", 400: `Error: ${err.substring(0, 120)}`, 529: "IA sobrecargada.", 503: "IA no disponible." };
      return ok({ success: false, error: m[res.status] || `Error IA: ${res.status}` });
    }

    const data = await res.json();
    const text = data.content?.map((b: any) => b.type === "text" ? b.text : "").filter(Boolean).join("\n") || "";
    if (!text) return ok({ success: false, error: "IA no generó respuesta." });

    let analisis;
    try {
      const clean = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      const match = clean.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON found");
      analisis = JSON.parse(match[0]);
    } catch (e: any) {
      console.error("[contrato] Parse:", e.message, text.substring(0, 300));
      return ok({ success: false, error: "Error interpretando respuesta de IA." });
    }

    analisis.datos_extraidos = analisis.datos_extraidos || {};
    analisis.riesgos = (analisis.riesgos || []).map((r: any) => ({
      clausula: r.clausula || '', texto_original: r.texto_original || '',
      descripcion: r.descripcion || '', severidad: r.severidad || 'MEDIA', sugerencia: r.sugerencia || '',
    }));
    analisis.clausulas_faltantes = analisis.clausulas_faltantes || [];
    analisis.calificacion_riesgo = analisis.calificacion_riesgo || 5;
    analisis.es_leonino = analisis.es_leonino ?? false;
    analisis.explicacion_leonino = analisis.explicacion_leonino || "";
    analisis.resumen_ejecutivo = analisis.resumen_ejecutivo || "";
    analisis.version_blindada = analisis.version_blindada || "";
    analisis.veredicto = analisis.veredicto || (analisis.calificacion_riesgo <= 4 ? "FIRMAR" : "NO FIRMAR");
    analisis.justificacion_veredicto = analisis.justificacion_veredicto || "";

    console.log(`[contrato] ✅ ${analisis.veredicto} | Riesgo:${analisis.calificacion_riesgo}/10 | ${analisis.riesgos.length} riesgos | Blindada:${analisis.version_blindada.length} chars`);
    return ok({ success: true, analisis, texto_usado: texto_extraido || '' });

  } catch (e: any) {
    console.error("[contrato] FATAL:", e.message);
    return ok({ success: false, error: `Error interno: ${e.message}` });
  }
});
