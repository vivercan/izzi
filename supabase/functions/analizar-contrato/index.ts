// supabase/functions/analizar-contrato/index.ts
// Edge Function para análisis de contratos con IA (Anthropic Claude)
// GRUPO LOMA | TROB TRANSPORTES
// v2.2 - Fixed: anthropic-version for document support, Word text extraction, error handling

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { decode as base64Decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

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

// ═══════════════════════════════════════════════════════════════
// Extract text from .docx (ZIP containing XML)
// ═══════════════════════════════════════════════════════════════
async function extractDocxText(base64Data: string): Promise<string> {
  try {
    const bytes = base64Decode(base64Data);
    const arr = new Uint8Array(bytes);
    const textDecoder = new TextDecoder("utf-8", { fatal: false });

    // .docx is a ZIP file - find word/document.xml entry
    let xmlContent = "";
    let offset = 0;

    while (offset < arr.length - 4) {
      // Look for ZIP local file header: PK\x03\x04
      if (arr[offset] === 0x50 && arr[offset + 1] === 0x4b && arr[offset + 2] === 0x03 && arr[offset + 3] === 0x04) {
        const compressionMethod = arr[offset + 8] | (arr[offset + 9] << 8);
        const compressedSize = arr[offset + 18] | (arr[offset + 19] << 8) | (arr[offset + 20] << 16) | (arr[offset + 21] << 24);
        const filenameLen = arr[offset + 26] | (arr[offset + 27] << 8);
        const extraLen = arr[offset + 28] | (arr[offset + 29] << 8);

        const filenameBytes = arr.slice(offset + 30, offset + 30 + filenameLen);
        const filename = textDecoder.decode(filenameBytes);
        const dataStart = offset + 30 + filenameLen + extraLen;

        if (filename === "word/document.xml") {
          if (compressionMethod === 0) {
            // Stored (no compression)
            xmlContent = textDecoder.decode(arr.slice(dataStart, dataStart + compressedSize));
          } else if (compressionMethod === 8) {
            // Deflate
            try {
              const compressedData = arr.slice(dataStart, dataStart + compressedSize);
              const ds = new DecompressionStream("raw");
              const writer = ds.writable.getWriter();
              writer.write(compressedData);
              writer.close();
              const reader = ds.readable.getReader();
              const chunks: Uint8Array[] = [];
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(value);
              }
              const totalLen = chunks.reduce((a, c) => a + c.length, 0);
              const result = new Uint8Array(totalLen);
              let pos = 0;
              for (const chunk of chunks) { result.set(chunk, pos); pos += chunk.length; }
              xmlContent = textDecoder.decode(result);
            } catch (decompErr) {
              console.error("[docx] Decompression error:", decompErr);
            }
          }
          break;
        }

        // Move to next entry
        offset = compressedSize > 0 ? dataStart + compressedSize : dataStart + 1;
      } else {
        offset++;
      }
    }

    if (!xmlContent) {
      console.log("[docx] Could not find word/document.xml in ZIP");
      return "";
    }

    // Extract text from XML - parse <w:t> tags and paragraph breaks
    let text = "";
    const parts = xmlContent.split(/<\/w:p>/);
    for (const part of parts) {
      const lineTexts: string[] = [];
      const regex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
      let m;
      while ((m = regex.exec(part)) !== null) {
        lineTexts.push(m[1]);
      }
      if (lineTexts.length > 0) {
        text += lineTexts.join("") + "\n";
      }
    }

    return text.trim();
  } catch (err) {
    console.error("[docx] Text extraction error:", err);
    return "";
  }
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validate API key
    if (!ANTHROPIC_API_KEY) {
      console.error("[analizar-contrato] ANTHROPIC_API_KEY not configured");
      return jsonResponse({ success: false, error: "Error de configuración: API key de Anthropic no configurada. Verifica los Secrets en Supabase." });
    }

    let body;
    try {
      body = await req.json();
    } catch (_) {
      return jsonResponse({ success: false, error: "Error al leer la solicitud." });
    }

    const { archivo_base64, nombre_archivo, tipo_archivo, fecha_analisis } = body;

    if (!archivo_base64) {
      return jsonResponse({ success: false, error: "No se recibió el archivo." });
    }

    console.log(`[analizar-contrato] Archivo: ${nombre_archivo}, Tipo: ${tipo_archivo}, B64 len: ${archivo_base64.length}`);

    // Determine file type
    const isPDF = tipo_archivo?.includes("pdf") || nombre_archivo?.toLowerCase().endsWith(".pdf");
    const isImage = tipo_archivo?.includes("image") || /\.(png|jpg|jpeg)$/i.test(nombre_archivo || "");
    const isWord = tipo_archivo?.includes("word") || /\.(doc|docx)$/i.test(nombre_archivo || "");

    // Build content blocks
    const contentBlocks: any[] = [];
    const fechaStr = fecha_analisis || new Date().toLocaleDateString("es-MX");

    if (isPDF) {
      contentBlocks.push(
        { type: "document", source: { type: "base64", media_type: "application/pdf", data: archivo_base64 } },
        { type: "text", text: `Analiza este contrato PDF para TROB TRANSPORTES. Archivo: "${nombre_archivo}". Fecha: ${fechaStr}. RESPONDE SOLO CON JSON VÁLIDO.` }
      );
    } else if (isImage) {
      const mediaType = tipo_archivo?.includes("png") ? "image/png" : "image/jpeg";
      contentBlocks.push(
        { type: "image", source: { type: "base64", media_type: mediaType, data: archivo_base64 } },
        { type: "text", text: `Esta es una imagen de un contrato. Analízalo para TROB TRANSPORTES. Archivo: "${nombre_archivo}". Fecha: ${fechaStr}. RESPONDE SOLO CON JSON VÁLIDO.` }
      );
    } else if (isWord) {
      // Extract text from Word document
      console.log("[analizar-contrato] Extracting text from Word...");
      const extractedText = await extractDocxText(archivo_base64);

      if (extractedText && extractedText.length > 50) {
        console.log(`[analizar-contrato] Extracted ${extractedText.length} chars from Word`);
        contentBlocks.push({
          type: "text",
          text: `El siguiente es el texto extraído de un contrato Word (.docx) llamado "${nombre_archivo}".

═══════════════ TEXTO DEL CONTRATO ═══════════════

${extractedText}

═══════════════ FIN DEL CONTRATO ═══════════════

Fecha de análisis: ${fechaStr}. Analiza este contrato completo como abogado especialista para TROB TRANSPORTES. RESPONDE SOLO CON JSON VÁLIDO.`
        });
      } else {
        console.log("[analizar-contrato] Could not extract text from Word");
        return jsonResponse({
          success: false,
          error: "No se pudo extraer el texto del archivo Word. Por favor conviértelo a PDF e intenta de nuevo."
        });
      }
    } else {
      // Fallback: try as PDF
      contentBlocks.push(
        { type: "document", source: { type: "base64", media_type: "application/pdf", data: archivo_base64 } },
        { type: "text", text: `Analiza este contrato para TROB TRANSPORTES. Archivo: "${nombre_archivo}". Fecha: ${fechaStr}. RESPONDE SOLO CON JSON VÁLIDO.` }
      );
    }

    // System prompt
    const systemPrompt = `Eres un abogado corporativo especialista en derecho mercantil y de transporte en México.

Analiza el contrato y responde ÚNICAMENTE con JSON válido (sin backticks, sin texto adicional).

Estructura EXACTA requerida:
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
  "riesgos": [{"clausula":"","descripcion":"","severidad":"ALTA|MEDIA|BAJA","sugerencia":""}],
  "resumen_ejecutivo": "3-5 párrafos",
  "clausulas_faltantes": ["cláusula faltante"],
  "version_blindada": "Texto COMPLETO con modificaciones para blindar a TROB. NUNCA truncar.",
  "calificacion_riesgo": 7
}

CRITERIOS TROB TRANSPORTES:
- TROB es transportista de carga. Proteger contra: responsabilidad excesiva, penalizaciones desproporcionadas, plazos de pago >30 días, sin fuerza mayor, jurisdicción fuera de Aguascalientes
- Verificar: limitación responsabilidad, seguro mercancía, obligaciones claras, resolución controversias, terminación bilateral
- Calificación: 1-10 (1=sin riesgo, 10=máximo)
- Info legal TROB: Escritura 21,183 Vol 494, Notaría 35, Lic. Fernando Quezada Leos, Aguascalientes. Rep. legal: Alejandro López Ramírez. RFC: TTR151216CHA

SOLO JSON VÁLIDO.`;

    // Call Anthropic API
    console.log("[analizar-contrato] Calling Anthropic API...");

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
      console.error("[analizar-contrato] Fetch to Anthropic failed:", fetchErr.message);
      return jsonResponse({ success: false, error: `Error conectando con Anthropic: ${fetchErr.message}` });
    }

    console.log(`[analizar-contrato] Anthropic status: ${anthropicResponse.status}`);

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text().catch(() => "");
      console.error(`[analizar-contrato] Anthropic error ${anthropicResponse.status}: ${errorText.substring(0, 500)}`);

      const errorMap: Record<number, string> = {
        401: "API key inválida. Verifica ANTHROPIC_API_KEY en Supabase.",
        429: "Demasiadas solicitudes. Espera 30 segundos e intenta de nuevo.",
        400: `Formato de archivo no soportado. Intenta con PDF. (${errorText.substring(0, 100)})`,
        529: "Servicio de IA sobrecargado. Intenta en unos minutos.",
        503: "Servicio de IA no disponible. Intenta en unos minutos.",
      };

      return jsonResponse({
        success: false,
        error: errorMap[anthropicResponse.status] || `Error de IA: ${anthropicResponse.status}`
      });
    }

    const anthropicData = await anthropicResponse.json();
    const responseText = anthropicData.content
      ?.map((block: any) => (block.type === "text" ? block.text : ""))
      .filter(Boolean)
      .join("\n") || "";

    console.log(`[analizar-contrato] Response: ${responseText.length} chars`);

    if (!responseText) {
      return jsonResponse({ success: false, error: "La IA no generó respuesta. Intenta de nuevo." });
    }

    // Parse JSON
    let analisis;
    try {
      const clean = responseText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        analisis = JSON.parse(match[0]);
      } else {
        throw new Error("No JSON found");
      }
    } catch (parseErr: any) {
      console.error("[analizar-contrato] Parse error:", parseErr.message, "Preview:", responseText.substring(0, 300));
      return jsonResponse({ success: false, error: "Error interpretando respuesta de la IA. Intenta de nuevo." });
    }

    // Ensure defaults
    analisis.datos_extraidos = analisis.datos_extraidos || {};
    analisis.riesgos = analisis.riesgos || [];
    analisis.clausulas_faltantes = analisis.clausulas_faltantes || [];
    analisis.calificacion_riesgo = analisis.calificacion_riesgo || 5;
    analisis.es_leonino = analisis.es_leonino || false;
    analisis.explicacion_leonino = analisis.explicacion_leonino || "No determinado";
    analisis.resumen_ejecutivo = analisis.resumen_ejecutivo || "Análisis completado.";
    analisis.version_blindada = analisis.version_blindada || "No se generó versión blindada.";

    console.log(`[analizar-contrato] ✅ Riesgo: ${analisis.calificacion_riesgo}/10, Riesgos: ${analisis.riesgos.length}, Leonino: ${analisis.es_leonino}`);

    return jsonResponse({ success: true, analisis });

  } catch (error: any) {
    console.error("[analizar-contrato] FATAL:", error.message, error.stack);
    return jsonResponse({ success: false, error: `Error interno: ${error.message}` });
  }
});
