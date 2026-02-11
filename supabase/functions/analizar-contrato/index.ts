// supabase/functions/analizar-contrato/index.ts
// GRUPO LOMA | TROB TRANSPORTES | v6.0
// NO pide texto_original_completo — se usa el del cliente

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

    console.log(`[contrato] ${nombre_archivo} | tipo=${tipo_archivo} | texto=${texto_extraido ? texto_extraido.length : 0}`);

    const content: any[] = [];
    let needsPdfBeta = false;

    if (texto_extraido && texto_extraido.length > 30) {
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
      return ok({ success: false, error: "No se pudo procesar el archivo." });
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

IMPORTANTE: NO incluyas el texto original completo del contrato en tu respuesta. Solo incluye la version_blindada (contrato corregido). El texto original ya lo tenemos.

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

    // Defaults
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
    return ok({ success: true, analisis });

  } catch (e: any) {
    console.error("[contrato] FATAL:", e.message);
    return ok({ success: false, error: `Error interno: ${e.message}` });
  }
});
