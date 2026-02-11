// supabase/functions/analizar-contrato/index.ts
// Edge Function para análisis de contratos con IA (Anthropic Claude)
// GRUPO LOMA | TROB TRANSPORTES
// v3.0 - Zero external dependencies, text extraction done client-side

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!ANTHROPIC_API_KEY) {
      return jsonResponse({ success: false, error: "API key de Anthropic no configurada en Supabase Secrets." });
    }

    let body;
    try {
      body = await req.json();
    } catch (_) {
      return jsonResponse({ success: false, error: "Error al leer la solicitud." });
    }

    const {
      archivo_base64,
      nombre_archivo,
      tipo_archivo,
      fecha_analisis,
      texto_extraido,  // NEW: pre-extracted text from client for Word/Excel
    } = body;

    if (!archivo_base64 && !texto_extraido) {
      return jsonResponse({ success: false, error: "No se recibió el archivo ni texto." });
    }

    const fileName = (nombre_archivo || "").toLowerCase();
    const fechaStr = fecha_analisis || new Date().toLocaleDateString("es-MX");
    console.log(`[contrato] Archivo: ${nombre_archivo}, Tipo: ${tipo_archivo}, Texto: ${texto_extraido ? texto_extraido.length + ' chars' : 'no'}`);

    // Detect file type
    const isPDF = tipo_archivo?.includes("pdf") || fileName.endsWith(".pdf");
    const isImage = tipo_archivo?.includes("image") || /\.(png|jpg|jpeg|gif|webp)$/.test(fileName);

    // Build content blocks
    const contentBlocks: any[] = [];

    if (texto_extraido && texto_extraido.length > 30) {
      // Text was extracted client-side (Word, Excel, etc.)
      console.log(`[contrato] Using pre-extracted text: ${texto_extraido.length} chars`);
      contentBlocks.push({
        type: "text",
        text: `TEXTO DEL CONTRATO "${nombre_archivo}":\n\n${"═".repeat(50)}\n\n${texto_extraido}\n\n${"═".repeat(50)}\n\nFecha: ${fechaStr}. Analiza este contrato completo para TROB TRANSPORTES. RESPONDE SOLO CON JSON VÁLIDO.`,
      });
    } else if (isPDF && archivo_base64) {
      console.log("[contrato] Sending PDF to Anthropic");
      contentBlocks.push(
        { type: "document", source: { type: "base64", media_type: "application/pdf", data: archivo_base64 } },
        { type: "text", text: `Analiza este contrato PDF para TROB TRANSPORTES. Archivo: "${nombre_archivo}". Fecha: ${fechaStr}. RESPONDE SOLO CON JSON VÁLIDO.` }
      );
    } else if (isImage && archivo_base64) {
      console.log("[contrato] Sending image to Anthropic");
      const ext = fileName.split(".").pop() || "jpeg";
      const mediaMap: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp" };
      contentBlocks.push(
        { type: "image", source: { type: "base64", media_type: mediaMap[ext] || "image/jpeg", data: archivo_base64 } },
        { type: "text", text: `Imagen de un contrato. Analízalo para TROB TRANSPORTES. Archivo: "${nombre_archivo}". Fecha: ${fechaStr}. RESPONDE SOLO CON JSON VÁLIDO.` }
      );
    } else if (archivo_base64) {
      // Fallback: try as PDF
      console.log("[contrato] Unknown type, trying as PDF");
      contentBlocks.push(
        { type: "document", source: { type: "base64", media_type: "application/pdf", data: archivo_base64 } },
        { type: "text", text: `Analiza este contrato para TROB TRANSPORTES. Fecha: ${fechaStr}. RESPONDE SOLO CON JSON VÁLIDO.` }
      );
    } else {
      return jsonResponse({ success: false, error: "No se pudo procesar el archivo. Intenta con PDF." });
    }

    // System prompt
    const systemPrompt = `Eres un abogado corporativo especialista en derecho mercantil y de transporte en México.

Analiza el contrato y responde ÚNICAMENTE con JSON válido (sin backticks, sin texto adicional).

Estructura EXACTA:
{
  "datos_extraidos": {
    "representante_legal": "nombre o 'No especificado'",
    "notaria": "info notarial o 'No especificado'",
    "numero_escritura": "número o 'No especificado'",
    "fecha_contrato": "fecha o 'No especificado'",
    "partes": ["Parte A", "Parte B"],
    "objeto_contrato": "descripción breve",
    "vigencia": "duración o 'No especificado'",
    "monto_o_tarifa": "condiciones económicas o 'No especificado'"
  },
  "es_leonino": false,
  "explicacion_leonino": "Explicación",
  "riesgos": [{"clausula":"","descripcion":"","severidad":"ALTA","sugerencia":""}],
  "resumen_ejecutivo": "3-5 párrafos",
  "clausulas_faltantes": ["cláusula faltante"],
  "version_blindada": "Texto COMPLETO con modificaciones. NUNCA truncar.",
  "calificacion_riesgo": 7
}

CRITERIOS TROB TRANSPORTES:
- Transportista de carga. Proteger contra: responsabilidad excesiva, penalizaciones desproporcionadas, plazos >30 días, sin fuerza mayor, jurisdicción fuera de Aguascalientes
- Verificar: limitación responsabilidad, seguro mercancía, obligaciones claras, resolución controversias, terminación bilateral
- Calificación 1-10. Info: Escritura 21,183 Vol 494, Notaría 35, Lic. Fernando Quezada Leos, Ags. Rep. legal: Alejandro López Ramírez. RFC: TTR151216CHA

SOLO JSON VÁLIDO.`;

    // Call Anthropic
    console.log("[contrato] Calling Anthropic...");
    let anthropicResponse;
    try {
      anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2024-10-22",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 16000,
          system: systemPrompt,
          messages: [{ role: "user", content: contentBlocks }],
        }),
      });
    } catch (fetchErr: any) {
      console.error("[contrato] Fetch failed:", fetchErr.message);
      return jsonResponse({ success: false, error: `Error conectando con IA: ${fetchErr.message}` });
    }

    console.log(`[contrato] Anthropic status: ${anthropicResponse.status}`);

    if (!anthropicResponse.ok) {
      const errText = await anthropicResponse.text().catch(() => "");
      console.error(`[contrato] Anthropic error ${anthropicResponse.status}: ${errText.substring(0, 300)}`);
      const msgs: Record<number, string> = {
        401: "API key inválida.",
        429: "Demasiadas solicitudes. Espera 30s.",
        400: `Error procesando archivo. ${errText.substring(0, 100)}`,
        529: "IA sobrecargada. Intenta en minutos.",
        503: "IA no disponible temporalmente.",
      };
      return jsonResponse({ success: false, error: msgs[anthropicResponse.status] || `Error IA: ${anthropicResponse.status}` });
    }

    const data = await anthropicResponse.json();
    const text = data.content?.map((b: any) => b.type === "text" ? b.text : "").filter(Boolean).join("\n") || "";
    console.log(`[contrato] Response: ${text.length} chars`);

    if (!text) return jsonResponse({ success: false, error: "IA no generó respuesta." });

    // Parse JSON
    let analisis;
    try {
      const clean = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      const match = clean.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON");
      analisis = JSON.parse(match[0]);
    } catch (e: any) {
      console.error("[contrato] Parse error:", e.message, "Preview:", text.substring(0, 200));
      return jsonResponse({ success: false, error: "Error interpretando respuesta. Intenta de nuevo." });
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

    console.log(`[contrato] ✅ Riesgo: ${analisis.calificacion_riesgo}/10, ${analisis.riesgos.length} riesgos, Leonino: ${analisis.es_leonino}`);
    return jsonResponse({ success: true, analisis });

  } catch (error: any) {
    console.error("[contrato] FATAL:", error.message);
    return jsonResponse({ success: false, error: `Error interno: ${error.message}` });
  }
});
