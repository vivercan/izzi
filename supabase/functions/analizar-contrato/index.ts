// supabase/functions/analizar-contrato/index.ts
// Edge Function para análisis de contratos con IA (Anthropic Claude)
// GRUPO LOMA | TROB TRANSPORTES
// v2.1 - Improved timeout handling, error messages, retry logic

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
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validate API key exists
    if (!ANTHROPIC_API_KEY) {
      console.error("ANTHROPIC_API_KEY not configured");
      return jsonResponse({ success: false, error: "Error de configuración del servidor. Contacta al administrador." }, 200);
    }

    const body = await req.json();
    const { archivo_base64, nombre_archivo, tipo_archivo, fecha_analisis } = body;

    if (!archivo_base64) {
      return jsonResponse({ success: false, error: "No se recibió el archivo." }, 200);
    }

    console.log(`[analizar-contrato] Archivo: ${nombre_archivo}, Tipo: ${tipo_archivo}, Base64 length: ${archivo_base64.length}`);

    // Determine content type for Anthropic API
    const isPDF = tipo_archivo?.includes("pdf") || nombre_archivo?.endsWith(".pdf");
    const isImage = tipo_archivo?.includes("image") || /\.(png|jpg|jpeg)$/i.test(nombre_archivo || "");
    const isWord = tipo_archivo?.includes("word") || /\.(doc|docx)$/i.test(nombre_archivo || "");

    // Build content blocks for Anthropic
    const contentBlocks: any[] = [];

    if (isPDF) {
      contentBlocks.push({
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: archivo_base64 },
      });
    } else if (isImage) {
      const mediaType = tipo_archivo?.includes("png") ? "image/png" : "image/jpeg";
      contentBlocks.push({
        type: "image",
        source: { type: "base64", media_type: mediaType, data: archivo_base64 },
      });
    } else if (isWord) {
      // Word files: send as document with proper type
      contentBlocks.push({
        type: "document",
        source: { 
          type: "base64", 
          media_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 
          data: archivo_base64 
        },
      });
    } else {
      // Fallback: try as PDF
      contentBlocks.push({
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: archivo_base64 },
      });
    }

    // System prompt for TROB contract analysis
    const systemPrompt = `Eres un abogado corporativo especialista en derecho mercantil y de transporte en México, con experiencia en proteger a empresas transportistas.

Analiza el contrato proporcionado y responde ÚNICAMENTE con un JSON válido (sin backticks, sin texto adicional, SOLO el JSON).

El JSON debe tener EXACTAMENTE esta estructura:
{
  "datos_extraidos": {
    "representante_legal": "nombre del representante legal o 'No especificado'",
    "notaria": "información notarial o 'No especificado'",
    "numero_escritura": "número de escritura o 'No especificado'",
    "fecha_contrato": "fecha del contrato o 'No especificado'",
    "partes": ["Parte A", "Parte B"],
    "objeto_contrato": "descripción breve del objeto del contrato",
    "vigencia": "duración del contrato o 'No especificado'",
    "monto_o_tarifa": "monto, tarifa o condiciones económicas o 'No especificado'"
  },
  "es_leonino": true/false,
  "explicacion_leonino": "Si es leonino, explicación detallada de por qué. Si no es leonino, indicar 'El contrato mantiene un equilibrio razonable entre las partes.'",
  "riesgos": [
    {
      "clausula": "Nombre/número de la cláusula",
      "descripcion": "Descripción del riesgo para TROB",
      "severidad": "ALTA" | "MEDIA" | "BAJA",
      "sugerencia": "Recomendación específica para proteger a TROB"
    }
  ],
  "resumen_ejecutivo": "Resumen de 3-5 párrafos con hallazgos principales, contexto legal y recomendaciones específicas para TROB TRANSPORTES",
  "clausulas_faltantes": [
    "Cláusula que debería incluirse y no está presente, con explicación breve"
  ],
  "version_blindada": "Texto COMPLETO con TODAS las modificaciones sugeridas para blindar a TROB. Para CADA cláusula problemática incluir: (1) Texto original resumido, (2) Texto sugerido modificado. Al final incluir las cláusulas que deben agregarse. NUNCA truncar, NUNCA usar '...', NUNCA resumir. CADA cláusula debe estar completa.",
  "calificacion_riesgo": 7
}

CRITERIOS DE EVALUACIÓN PARA TROB TRANSPORTES:
- TROB es una empresa transportista de carga. Debe protegerse contra: responsabilidad excesiva por mercancía, penalizaciones desproporcionadas, plazos de pago mayores a 30 días, ausencia de cláusula de caso fortuito/fuerza mayor, jurisdicción fuera de Aguascalientes
- Verificar que exista: limitación de responsabilidad, seguro de mercancía, definición clara de obligaciones, mecanismo de resolución de controversias, cláusula de terminación bilateral
- La calificacion_riesgo debe ser de 1 (sin riesgo) a 10 (riesgo máximo)
- Los riesgos deben ordenarse de mayor a menor severidad
- Información legal de TROB: Escritura 21,183 Vol 494, Notaría 35 Lic. Fernando Quezada Leos, Aguascalientes, representante legal Alejandro López Ramírez, RFC TTR151216CHA

RESPONDE SOLO CON EL JSON VÁLIDO, NADA MÁS. NO uses backticks. NO agregues texto antes o después del JSON.`;

    contentBlocks.push({
      type: "text",
      text: `Analiza este contrato como abogado especialista para TROB TRANSPORTES. Archivo: "${nombre_archivo}". Fecha de análisis: ${fecha_analisis || new Date().toLocaleDateString("es-MX")}. RESPONDE SOLO CON JSON VÁLIDO.`,
    });

    // Call Anthropic API with AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 second timeout

    console.log("[analizar-contrato] Calling Anthropic API...");

    let anthropicResponse;
    try {
      anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 16000,
          system: systemPrompt,
          messages: [{ role: "user", content: contentBlocks }],
        }),
      });
    } catch (fetchErr: any) {
      clearTimeout(timeoutId);
      if (fetchErr.name === "AbortError") {
        console.error("[analizar-contrato] Anthropic API timeout after 90s");
        return jsonResponse({ success: false, error: "El análisis tardó demasiado. Intenta con un archivo más pequeño." }, 200);
      }
      console.error("[analizar-contrato] Fetch error:", fetchErr.message);
      return jsonResponse({ success: false, error: `Error de conexión con el servicio de IA: ${fetchErr.message}` }, 200);
    }

    clearTimeout(timeoutId);

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text().catch(() => "");
      console.error("[analizar-contrato] Anthropic API error:", anthropicResponse.status, errorText);

      // Handle specific error codes
      if (anthropicResponse.status === 401) {
        return jsonResponse({ success: false, error: "Error de autenticación con el servicio de IA. Verifica la API key." }, 200);
      }
      if (anthropicResponse.status === 429) {
        return jsonResponse({ success: false, error: "Demasiadas solicitudes. Espera un momento y vuelve a intentar." }, 200);
      }
      if (anthropicResponse.status === 400) {
        // Try retry without document type for Word files
        if (isWord) {
          console.log("[analizar-contrato] Retrying Word file as text reference...");
          try {
            const retryContent = [
              {
                type: "text",
                text: `El siguiente es un contrato en formato Word (.docx). El archivo se llama "${nombre_archivo}". El contenido en base64 es demasiado largo para procesarse directamente. Por favor genera un análisis basado en lo que puedas interpretar. Si no puedes leer el contenido, genera un análisis genérico indicando que se recomienda convertir a PDF.\n\nPrimeros 2000 caracteres del base64: ${archivo_base64.substring(0, 2000)}\n\nFecha de análisis: ${fecha_analisis || new Date().toLocaleDateString("es-MX")}. RESPONDE SOLO CON JSON VÁLIDO.`,
              },
            ];

            const retryResponse = await fetch("https://api.anthropic.com/v1/messages", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
              },
              body: JSON.stringify({
                model: "claude-sonnet-4-20250514",
                max_tokens: 16000,
                system: systemPrompt,
                messages: [{ role: "user", content: retryContent }],
              }),
            });

            if (!retryResponse.ok) {
              return jsonResponse({
                success: false,
                error: "No se pudo procesar el archivo Word. Por favor convierte a PDF e intenta de nuevo.",
              }, 200);
            }

            const retryData = await retryResponse.json();
            const retryText = retryData.content?.map((b: any) => (b.type === "text" ? b.text : "")).filter(Boolean).join("\n") || "";
            const retryClean = retryText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
            const retryAnalisis = JSON.parse(retryClean);
            return jsonResponse({ success: true, analisis: retryAnalisis });
          } catch (retryErr) {
            return jsonResponse({
              success: false,
              error: "No se pudo procesar el archivo Word. Por favor convierte a PDF e intenta de nuevo.",
            }, 200);
          }
        }

        return jsonResponse({ success: false, error: `Error al procesar el archivo. Formato no soportado o archivo corrupto. (${anthropicResponse.status})` }, 200);
      }

      return jsonResponse({ success: false, error: `Error del servicio de IA: ${anthropicResponse.status}` }, 200);
    }

    const anthropicData = await anthropicResponse.json();

    // Extract text from response
    const responseText = anthropicData.content
      ?.map((block: any) => (block.type === "text" ? block.text : ""))
      .filter(Boolean)
      .join("\n") || "";

    console.log(`[analizar-contrato] Response length: ${responseText.length} chars`);

    // Parse JSON response
    let analisis;
    try {
      const cleanJson = responseText
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "")
        .trim();
      
      // Try to find JSON object in response
      const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analisis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError: any) {
      console.error("[analizar-contrato] JSON parse error:", parseError.message, "Response preview:", responseText.substring(0, 300));
      return jsonResponse({
        success: false,
        error: "Error al interpretar la respuesta de la IA. Intenta de nuevo.",
      }, 200);
    }

    // Validate minimum structure
    if (!analisis.datos_extraidos || !analisis.riesgos) {
      console.error("[analizar-contrato] Incomplete response structure");
      return jsonResponse({
        success: false,
        error: "La respuesta de la IA está incompleta. Intenta de nuevo.",
      }, 200);
    }

    console.log(`[analizar-contrato] Success! Riesgo: ${analisis.calificacion_riesgo}/10, Riesgos: ${analisis.riesgos.length}`);

    return jsonResponse({ success: true, analisis });

  } catch (error: any) {
    console.error("[analizar-contrato] General error:", error.message, error.stack);
    return jsonResponse({
      success: false,
      error: `Error interno del servidor: ${error.message}`,
    }, 200);
  }
});
