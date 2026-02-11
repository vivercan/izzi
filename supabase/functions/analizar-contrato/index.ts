// supabase/functions/analizar-contrato/index.ts
// GRUPO LOMA | TROB TRANSPORTES | v4.0
// FIXED: anthropic-version 2023-06-01 + pdfs-2024-09-25 beta

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function ok(data: any) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!ANTHROPIC_API_KEY) return ok({ success: false, error: "ANTHROPIC_API_KEY no configurada." });

    let body;
    try { body = await req.json(); } catch (_) { return ok({ success: false, error: "Error al leer solicitud." }); }

    const { archivo_base64, nombre_archivo, tipo_archivo, fecha_analisis, texto_extraido } = body;
    if (!archivo_base64 && !texto_extraido) return ok({ success: false, error: "No se recibió archivo ni texto." });

    const fn = (nombre_archivo || "").toLowerCase();
    const fechaStr = fecha_analisis || new Date().toLocaleDateString("es-MX");
    const isPDF = tipo_archivo?.includes("pdf") || fn.endsWith(".pdf");
    const isImage = tipo_archivo?.includes("image") || /\.(png|jpg|jpeg|gif|webp)$/.test(fn);

    console.log(`[contrato] ${nombre_archivo} | tipo=${tipo_archivo} | texto=${texto_extraido ? texto_extraido.length : 0} | b64=${archivo_base64 ? archivo_base64.length : 0}`);

    const content: any[] = [];
    let needsPdfBeta = false;

    if (texto_extraido && texto_extraido.length > 30) {
      // Pre-extracted text from client (Word, Excel)
      console.log(`[contrato] Using pre-extracted text: ${texto_extraido.length} chars`);
      content.push({ type: "text", text: `TEXTO DEL CONTRATO "${nombre_archivo}":\n\n${texto_extraido}\n\nFecha: ${fechaStr}. Analiza para TROB TRANSPORTES. RESPONDE SOLO JSON VÁLIDO.` });
    } else if (isPDF && archivo_base64) {
      console.log("[contrato] PDF mode with beta header");
      needsPdfBeta = true;
      content.push(
        { type: "document", source: { type: "base64", media_type: "application/pdf", data: archivo_base64 } },
        { type: "text", text: `Analiza este contrato PDF para TROB TRANSPORTES. Archivo: "${nombre_archivo}". Fecha: ${fechaStr}. RESPONDE SOLO JSON VÁLIDO.` }
      );
    } else if (isImage && archivo_base64) {
      console.log("[contrato] Image mode");
      const ext = fn.split(".").pop() || "jpeg";
      const mt: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp" };
      content.push(
        { type: "image", source: { type: "base64", media_type: mt[ext] || "image/jpeg", data: archivo_base64 } },
        { type: "text", text: `Imagen de contrato. Analízalo para TROB TRANSPORTES. Fecha: ${fechaStr}. RESPONDE SOLO JSON VÁLIDO.` }
      );
    } else if (archivo_base64) {
      // Unknown → try as text reference
      console.log("[contrato] Unknown type, sending base64 snippet as text");
      content.push({ type: "text", text: `Archivo: "${nombre_archivo}". No se pudo determinar el tipo. Genera análisis con estructura JSON completa indicando que se necesita convertir a PDF. Fecha: ${fechaStr}. RESPONDE SOLO JSON VÁLIDO.` });
    } else {
      return ok({ success: false, error: "No se pudo procesar el archivo." });
    }

    const systemPrompt = `Eres un abogado corporativo especialista en derecho mercantil y transporte en México.
Analiza el contrato y responde ÚNICAMENTE con JSON válido (sin backticks, sin texto).

Estructura EXACTA:
{
  "datos_extraidos": {
    "representante_legal": "nombre o 'No especificado'",
    "notaria": "info o 'No especificado'",
    "numero_escritura": "número o 'No especificado'",
    "fecha_contrato": "fecha o 'No especificado'",
    "partes": ["Parte A", "Parte B"],
    "objeto_contrato": "descripción",
    "vigencia": "duración o 'No especificado'",
    "monto_o_tarifa": "condiciones o 'No especificado'"
  },
  "es_leonino": false,
  "explicacion_leonino": "Explicación",
  "riesgos": [{"clausula":"","descripcion":"","severidad":"ALTA","sugerencia":""}],
  "resumen_ejecutivo": "3-5 párrafos",
  "clausulas_faltantes": ["cláusula faltante"],
  "version_blindada": "Texto COMPLETO con modificaciones. NUNCA truncar.",
  "calificacion_riesgo": 7
}

TROB TRANSPORTES: transportista de carga. Proteger contra responsabilidad excesiva, penalizaciones desproporcionadas, plazos >30 días, sin fuerza mayor, jurisdicción fuera de Aguascalientes.
Info: Escritura 21,183 Vol 494, Notaría 35, Lic. Fernando Quezada Leos, Ags. Rep. legal: Alejandro López Ramírez. RFC: TTR151216CHA.
SOLO JSON.`;

    // Build headers - CRITICAL: version must be 2023-06-01
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    };
    if (needsPdfBeta) {
      headers["anthropic-beta"] = "pdfs-2024-09-25";
    }

    console.log("[contrato] Calling Anthropic...", needsPdfBeta ? "(with PDF beta)" : "(text only)");

    let res;
    try {
      res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 16000,
          system: systemPrompt,
          messages: [{ role: "user", content: content }],
        }),
      });
    } catch (e: any) {
      console.error("[contrato] Fetch error:", e.message);
      return ok({ success: false, error: `Error de conexión con IA: ${e.message}` });
    }

    console.log(`[contrato] Status: ${res.status}`);

    if (!res.ok) {
      const err = await res.text().catch(() => "");
      console.error(`[contrato] API error ${res.status}: ${err.substring(0, 400)}`);
      const m: Record<number, string> = {
        401: "API key inválida.",
        429: "Demasiadas solicitudes. Espera 30s.",
        400: `Error procesando: ${err.substring(0, 120)}`,
        529: "IA sobrecargada.",
        503: "IA no disponible.",
      };
      return ok({ success: false, error: m[res.status] || `Error IA: ${res.status}. ${err.substring(0, 100)}` });
    }

    const data = await res.json();
    const text = data.content?.map((b: any) => b.type === "text" ? b.text : "").filter(Boolean).join("\n") || "";
    console.log(`[contrato] Response: ${text.length} chars`);

    if (!text) return ok({ success: false, error: "IA no generó respuesta." });

    let analisis;
    try {
      const clean = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      const match = clean.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON");
      analisis = JSON.parse(match[0]);
    } catch (e: any) {
      console.error("[contrato] Parse:", e.message, text.substring(0, 200));
      return ok({ success: false, error: "Error interpretando respuesta." });
    }

    // Defaults
    analisis.datos_extraidos = analisis.datos_extraidos || {};
    analisis.riesgos = analisis.riesgos || [];
    analisis.clausulas_faltantes = analisis.clausulas_faltantes || [];
    analisis.calificacion_riesgo = analisis.calificacion_riesgo || 5;
    analisis.es_leonino = analisis.es_leonino ?? false;
    analisis.explicacion_leonino = analisis.explicacion_leonino || "No determinado";
    analisis.resumen_ejecutivo = analisis.resumen_ejecutivo || "Análisis completado.";
    analisis.version_blindada = analisis.version_blindada || "No generada.";

    console.log(`[contrato] ✅ Riesgo:${analisis.calificacion_riesgo}/10 Riesgos:${analisis.riesgos.length} Leonino:${analisis.es_leonino}`);
    return ok({ success: true, analisis });

  } catch (e: any) {
    console.error("[contrato] FATAL:", e.message);
    return ok({ success: false, error: `Error interno: ${e.message}` });
  }
});
