// supabase/functions/analizar-contrato/index.ts
// Edge Function para análisis de contratos con IA (Anthropic Claude)
// GRUPO LOMA | TROB TRANSPORTES

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { archivo_base64, nombre_archivo, tipo_archivo, fecha_analisis } = await req.json();

    if (!archivo_base64) {
      return new Response(
        JSON.stringify({ success: false, error: "No se recibió archivo" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determinar media_type para la API
    let media_type = "application/pdf";
    if (tipo_archivo.includes("png")) media_type = "image/png";
    else if (tipo_archivo.includes("jpeg") || tipo_archivo.includes("jpg")) media_type = "image/jpeg";
    else if (tipo_archivo.includes("pdf")) media_type = "application/pdf";

    // Construir content blocks según tipo de archivo
    const contentBlocks: any[] = [];

    if (media_type.startsWith("image/")) {
      contentBlocks.push({
        type: "image",
        source: {
          type: "base64",
          media_type: media_type,
          data: archivo_base64,
        },
      });
    } else {
      // PDF
      contentBlocks.push({
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: archivo_base64,
        },
      });
    }

    contentBlocks.push({
      type: "text",
      text: `Analiza este contrato exhaustivamente. Fecha de análisis: ${fecha_analisis || new Date().toLocaleDateString('es-MX')}.
      
CONTEXTO: Este análisis es para GRUPO LOMA | TROB TRANSPORTES, una empresa de transporte de carga con sede en Aguascalientes, México. La empresa opera bajo las razones sociales TROB Transportes, WExpress, Speedyhaul y TROB USA. El director es Juan Viveros.

INSTRUCCIONES: Debes responder EXCLUSIVAMENTE con un JSON válido, sin texto adicional, sin backticks, sin markdown. El JSON debe tener esta estructura exacta:

{
  "datos_extraidos": {
    "representante_legal": "Nombre completo del representante legal o 'No especificado'",
    "notaria": "Nombre/número de la notaría o 'No especificado'",
    "numero_escritura": "Número de escritura o instrumento notarial o 'No especificado'",
    "fecha_contrato": "Fecha que aparece en el contrato o 'No especificado'",
    "partes": ["Parte 1 (nombre completo)", "Parte 2 (nombre completo)"],
    "objeto_contrato": "Descripción breve del objeto del contrato",
    "vigencia": "Vigencia del contrato o 'No especificado'",
    "monto_o_tarifa": "Monto, tarifa o contraprestación o 'No especificado'"
  },
  "es_leonino": true/false,
  "explicacion_leonino": "Explicación detallada de por qué es o no es leonino. Un contrato es leonino cuando impone condiciones excesivamente gravosas para una de las partes, beneficiando desproporcionadamente a la otra. Evalúa: penalizaciones desproporcionadas, cláusulas de indemnización unilaterales, renuncia de derechos excesiva, plazos de pago abusivos, jurisdicción inconveniente, terminación unilateral sin causa.",
  "riesgos": [
    {
      "clausula": "Nombre o referencia de la cláusula",
      "descripcion": "Qué dice la cláusula y por qué es riesgosa para TROB",
      "severidad": "ALTA|MEDIA|BAJA",
      "sugerencia": "Modificación específica que se sugiere para blindar a TROB"
    }
  ],
  "resumen_ejecutivo": "Resumen de 3-5 párrafos con: (1) De qué trata el contrato, (2) Principales riesgos para TROB, (3) Si se recomienda firmarlo tal cual o con modificaciones, (4) Qué cláusulas deben negociarse prioritariamente.",
  "clausulas_faltantes": [
    "Cláusula que debería incluirse y no está presente, con explicación breve"
  ],
  "version_blindada": "Texto detallado con TODAS las modificaciones sugeridas para blindar a TROB. Para cada cláusula problemática: (1) Texto original resumido, (2) Texto sugerido modificado. Al final incluir las cláusulas que deben agregarse. Todo enfocado en proteger a GRUPO LOMA/TROB como transportista.",
  "calificacion_riesgo": 7
}

CRITERIOS IMPORTANTES PARA TROB:
- TROB es transportista, debe protegerse contra: responsabilidad excesiva por mercancía, penalizaciones desproporcionadas, plazos de pago mayores a 30 días, ausencia de cláusula de caso fortuito/fuerza mayor, jurisdicción fuera de Aguascalientes
- Verificar que exista: limitación de responsabilidad, seguro de mercancía, definición clara de obligaciones, mecanismo de resolución de controversias, cláusula de terminación bilateral
- La calificación_riesgo debe ser de 1 (sin riesgo) a 10 (riesgo máximo)
- Los riesgos deben ordenarse de mayor a menor severidad

RESPONDE SOLO CON EL JSON, NADA MÁS.`,
    });

    // Llamar a Anthropic API
    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8000,
        messages: [
          {
            role: "user",
            content: contentBlocks,
          },
        ],
      }),
    });

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      console.error("Anthropic API error:", errorText);
      return new Response(
        JSON.stringify({ success: false, error: `Error de IA: ${anthropicResponse.status}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const anthropicData = await anthropicResponse.json();

    // Extraer texto de la respuesta
    const responseText = anthropicData.content
      ?.map((block: any) => (block.type === "text" ? block.text : ""))
      .filter(Boolean)
      .join("\n") || "";

    // Parsear JSON de la respuesta
    let analisis;
    try {
      // Limpiar posibles backticks o texto extra
      const cleanJson = responseText
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "")
        .trim();
      analisis = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error("Error parsing JSON:", parseError, "Response:", responseText.substring(0, 500));
      return new Response(
        JSON.stringify({
          success: false,
          error: "Error al procesar la respuesta de IA. Intenta de nuevo.",
          raw_response: responseText.substring(0, 200),
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validar estructura mínima
    if (!analisis.datos_extraidos || !analisis.riesgos) {
      return new Response(
        JSON.stringify({ success: false, error: "Respuesta de IA incompleta. Intenta de nuevo." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, analisis }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error general:", error);
    return new Response(
      JSON.stringify({ success: false, error: `Error interno: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
