// supabase/functions/analizar-contrato/index.ts
// Edge Function para análisis de contratos con IA (Anthropic Claude)
// GRUPO LOMA | TROB TRANSPORTES
// v3.0 - JSZip for reliable .docx extraction, all file types supported

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import JSZip from "https://esm.sh/jszip@3.10.1";

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
// Extract text from .docx using JSZip (reliable)
// ═══════════════════════════════════════════════════════════════
async function extractDocxText(base64Data: string): Promise<string> {
  try {
    // Decode base64 to binary
    const binaryStr = atob(base64Data);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    // Open ZIP with JSZip
    const zip = await JSZip.loadAsync(bytes);

    // Get word/document.xml
    const docXml = zip.file("word/document.xml");
    if (!docXml) {
      console.log("[docx] word/document.xml not found in ZIP");
      return "";
    }

    const xmlContent = await docXml.async("string");

    // Extract text from XML paragraphs
    let text = "";
    const paragraphs = xmlContent.split(/<\/w:p>/);
    for (const part of paragraphs) {
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

    // Decode XML entities
    text = text
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'");

    return text.trim();
  } catch (err) {
    console.error("[docx] JSZip extraction error:", err);
    return "";
  }
}

// ═══════════════════════════════════════════════════════════════
// Extract text from .xlsx using JSZip
// ═══════════════════════════════════════════════════════════════
async function extractXlsxText(base64Data: string): Promise<string> {
  try {
    const binaryStr = atob(base64Data);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    const zip = await JSZip.loadAsync(bytes);

    // Get shared strings
    const sharedStringsFile = zip.file("xl/sharedStrings.xml");
    let sharedStrings: string[] = [];
    if (sharedStringsFile) {
      const ssXml = await sharedStringsFile.async("string");
      const ssRegex = /<t[^>]*>([^<]*)<\/t>/g;
      let m;
      while ((m = ssRegex.exec(ssXml)) !== null) {
        sharedStrings.push(m[1]);
      }
    }

    // Get sheet1
    const sheet1 = zip.file("xl/worksheets/sheet1.xml");
    if (!sheet1) return sharedStrings.join(" | ");

    const sheetXml = await sheet1.async("string");
    let text = "";
    const rows = sheetXml.split(/<\/row>/);
    for (const row of rows) {
      const cells: string[] = [];
      const cellRegex = /<c[^>]*(?:t="s"[^>]*)?>.*?<v>(\d+)<\/v>/g;
      const inlineCellRegex = /<c[^>]*>.*?<v>([^<]*)<\/v>/g;
      let cm;

      // Shared string references
      while ((cm = cellRegex.exec(row)) !== null) {
        const idx = parseInt(cm[1]);
        if (sharedStrings[idx]) cells.push(sharedStrings[idx]);
      }

      // If no shared strings found, try inline values
      if (cells.length === 0) {
        while ((cm = inlineCellRegex.exec(row)) !== null) {
          cells.push(cm[1]);
        }
      }

      if (cells.length > 0) text += cells.join(" | ") + "\n";
    }

    return text.trim() || sharedStrings.join(" | ");
  } catch (err) {
    console.error("[xlsx] Extraction error:", err);
    return "";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!ANTHROPIC_API_KEY) {
      console.error("[analizar-contrato] ANTHROPIC_API_KEY not configured");
      return jsonResponse({ success: false, error: "Error de configuración: API key de Anthropic no configurada." });
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

    const fileName = (nombre_archivo || "").toLowerCase();
    console.log(`[analizar-contrato] Archivo: ${nombre_archivo}, Tipo: ${tipo_archivo}, B64 len: ${archivo_base64.length}`);

    // Detect file type
    const isPDF = tipo_archivo?.includes("pdf") || fileName.endsWith(".pdf");
    const isImage = tipo_archivo?.includes("image") || /\.(png|jpg|jpeg|gif|webp)$/.test(fileName);
    const isWord = tipo_archivo?.includes("word") || fileName.endsWith(".docx") || fileName.endsWith(".doc");
    const isExcel = tipo_archivo?.includes("sheet") || tipo_archivo?.includes("excel") || fileName.endsWith(".xlsx") || fileName.endsWith(".xls");

    const contentBlocks: any[] = [];
    const fechaStr = fecha_analisis || new Date().toLocaleDateString("es-MX");

    // ═══ BUILD CONTENT BLOCKS BY FILE TYPE ═══

    if (isPDF) {
      // PDF → send directly to Anthropic document type
      console.log("[analizar-contrato] Processing as PDF");
      contentBlocks.push(
        { type: "document", source: { type: "base64", media_type: "application/pdf", data: archivo_base64 } },
        { type: "text", text: `Analiza este contrato PDF para TROB TRANSPORTES. Archivo: "${nombre_archivo}". Fecha: ${fechaStr}. RESPONDE SOLO CON JSON VÁLIDO.` }
      );

    } else if (isImage) {
      // Image → send as image type
      console.log("[analizar-contrato] Processing as image");
      const ext = fileName.split(".").pop() || "";
      const mediaMap: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp" };
      const mediaType = mediaMap[ext] || "image/jpeg";
      contentBlocks.push(
        { type: "image", source: { type: "base64", media_type: mediaType, data: archivo_base64 } },
        { type: "text", text: `Esta es una imagen de un contrato. Analízalo para TROB TRANSPORTES. Archivo: "${nombre_archivo}". Fecha: ${fechaStr}. RESPONDE SOLO CON JSON VÁLIDO.` }
      );

    } else if (isWord) {
      // Word .docx → extract text with JSZip
      console.log("[analizar-contrato] Processing as Word, extracting text with JSZip...");
      const extractedText = await extractDocxText(archivo_base64);

      if (extractedText && extractedText.length > 30) {
        console.log(`[analizar-contrato] Extracted ${extractedText.length} chars from Word`);
        contentBlocks.push({
          type: "text",
          text: `TEXTO EXTRAÍDO DEL CONTRATO WORD "${nombre_archivo}":\n\n═══════════════════════════════════════\n\n${extractedText}\n\n═══════════════════════════════════════\n\nFecha de análisis: ${fechaStr}. Analiza este contrato completo como abogado especialista para TROB TRANSPORTES. RESPONDE SOLO CON JSON VÁLIDO.`
        });
      } else {
        console.log("[analizar-contrato] JSZip extraction got no text, trying alternative...");
        // Fallback: try sending raw base64 and asking Claude to try to read it
        // Some .doc files (old format) won't work with ZIP extraction
        contentBlocks.push({
          type: "text",
          text: `Se intentó extraer texto de un archivo Word "${nombre_archivo}" pero la extracción retornó vacío. Esto puede ser un archivo .doc (formato antiguo) o un archivo protegido. Por favor genera un análisis indicando que el archivo necesita ser convertido a PDF para un análisis completo. Aun así, genera la estructura JSON completa con la información disponible. Fecha: ${fechaStr}. RESPONDE SOLO CON JSON VÁLIDO.`
        });
      }

    } else if (isExcel) {
      // Excel .xlsx → extract text with JSZip
      console.log("[analizar-contrato] Processing as Excel...");
      const extractedText = await extractXlsxText(archivo_base64);

      if (extractedText && extractedText.length > 20) {
        console.log(`[analizar-contrato] Extracted ${extractedText.length} chars from Excel`);
        contentBlocks.push({
          type: "text",
          text: `DATOS EXTRAÍDOS DEL EXCEL "${nombre_archivo}":\n\n${extractedText}\n\nFecha de análisis: ${fechaStr}. Analiza este documento como contrato para TROB TRANSPORTES. RESPONDE SOLO CON JSON VÁLIDO.`
        });
      } else {
        return jsonResponse({ success: false, error: "No se pudo extraer datos del archivo Excel. Conviértelo a PDF." });
      }

    } else {
      // Unknown → try as PDF first
      console.log(`[analizar-contrato] Unknown type: ${tipo_archivo}, trying as PDF`);
      contentBlocks.push(
        { type: "document", source: { type: "base64", media_type: "application/pdf", data: archivo_base64 } },
        { type: "text", text: `Analiza este contrato para TROB TRANSPORTES. Archivo: "${nombre_archivo}". Fecha: ${fechaStr}. RESPONDE SOLO CON JSON VÁLIDO.` }
      );
    }

    // ═══ SYSTEM PROMPT ═══
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
  "version_blindada": "Texto COMPLETO con modificaciones para blindar a TROB. NUNCA truncar.",
  "calificacion_riesgo": 7
}

CRITERIOS TROB TRANSPORTES:
- TROB es transportista de carga. Proteger contra: responsabilidad excesiva, penalizaciones desproporcionadas, plazos de pago >30 días, sin fuerza mayor, jurisdicción fuera de Aguascalientes
- Verificar: limitación responsabilidad, seguro mercancía, obligaciones claras, resolución controversias, terminación bilateral
- Calificación: 1-10 (1=sin riesgo, 10=máximo)
- Info legal TROB: Escritura 21,183 Vol 494, Notaría 35, Lic. Fernando Quezada Leos, Aguascalientes. Rep. legal: Alejandro López Ramírez. RFC: TTR151216CHA

SOLO JSON VÁLIDO.`;

    // ═══ CALL ANTHROPIC API ═══
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
      console.error("[analizar-contrato] Fetch failed:", fetchErr.message);
      return jsonResponse({ success: false, error: `Error conectando con IA: ${fetchErr.message}` });
    }

    console.log(`[analizar-contrato] Anthropic status: ${anthropicResponse.status}`);

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text().catch(() => "");
      console.error(`[analizar-contrato] Anthropic error ${anthropicResponse.status}: ${errorText.substring(0, 500)}`);

      const errorMap: Record<number, string> = {
        401: "API key inválida. Verifica ANTHROPIC_API_KEY en Supabase Secrets.",
        429: "Demasiadas solicitudes. Espera 30 segundos e intenta de nuevo.",
        400: `Error al procesar el archivo. Detalle: ${errorText.substring(0, 150)}`,
        529: "Servicio de IA sobrecargado. Intenta en unos minutos.",
        503: "Servicio de IA no disponible temporalmente.",
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

    // ═══ PARSE JSON ═══
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
