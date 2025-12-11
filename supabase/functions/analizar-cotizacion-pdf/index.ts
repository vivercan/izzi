import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { textoPDF } = await req.json();

    if (!textoPDF) {
      return new Response(JSON.stringify({ success: false, error: "No se proporciono texto del PDF" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ success: false, error: "API Key de Anthropic no configurada" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        messages: [{ role: "user", content: `Analiza este texto extraido de una cotizacion de transporte TROB y extrae TODAS las rutas/servicios cotizados.

TEXTO DEL PDF:
${textoPDF}

INSTRUCCIONES:
1. Identifica CADA ruta cotizada (puede haber multiples bloques "Origen Destino Servicio Importe" hasta "Total")
2. Para cada ruta extrae:
   - origen: ciudad/estado de origen. Si tiene multiples paradas como "Guadalajara, Jal. - Aguascalientes, Ags." eso es el origen completo
   - destino: ciudad/estado de destino final (la ultima ciudad antes del servicio/importe)
   - servicio: "Refrigerado" o "Seco" (si no se especifica, usa "Seco")
   - tarifa: numero sin comas ni simbolos (ej: 30000)
   - moneda: "USD" o "MXN"

IMPORTANTE:
- Cada bloque entre "Origen Destino Servicio Importe" y "Total" es UNA ruta
- El texto puede estar fragmentado en varias lineas, unelo logicamente
- Busca patrones de ciudades mexicanas (Guadalajara, Monterrey, Aguascalientes, etc.) y estadounidenses (Laredo, Dallas, etc.)
- Los importes tienen formato XX,XXX.XX seguido de USD o MXN

Responde UNICAMENTE con un JSON array valido, sin explicaciones, sin markdown, sin backticks:
[{"origen":"...", "destino":"...", "servicio":"...", "tarifa":0, "moneda":"..."}]

Si no encuentras rutas validas, responde exactamente: []` }]
      })
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      return new Response(JSON.stringify({ success: false, error: "Error al llamar a Claude API", details: errorText }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const claudeData = await claudeResponse.json();
    const contenido = claudeData.content?.[0]?.text || "[]";

    let rutas = [];
    try {
      const jsonStr = contenido.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      rutas = JSON.parse(jsonStr);
    } catch (parseError) {
      rutas = [];
    }

    return new Response(JSON.stringify({ success: true, rutas }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
