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
    const { imagenBase64, textoPDF } = await req.json();

    if (!imagenBase64 && !textoPDF) {
      return new Response(JSON.stringify({ success: false, error: "No se proporciono imagen ni texto" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ success: false, error: "API Key no configurada" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let messages;
    
    if (imagenBase64) {
      // Usar Claude Vision con imagen
      const base64Data = imagenBase64.replace(/^data:image\/\w+;base64,/, '');
      messages = [{
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/png",
              data: base64Data
            }
          },
          {
            type: "text",
            text: `Analiza esta imagen de una cotizacion de transporte y extrae TODAS las rutas/servicios cotizados.

INSTRUCCIONES:
1. Busca tablas o bloques con informacion de rutas
2. Para cada ruta extrae:
   - origen: ciudad/estado de origen completo
   - destino: ciudad/estado de destino final
   - servicio: "Refrigerado" o "Seco"
   - tarifa: numero sin comas (ej: 30000)
   - moneda: "USD" o "MXN"

Responde UNICAMENTE con un JSON array valido, sin explicaciones:
[{"origen":"...", "destino":"...", "servicio":"...", "tarifa":0, "moneda":"..."}]

Si no encuentras rutas, responde: []`
          }
        ]
      }];
    } else {
      // Usar texto como fallback
      messages = [{
        role: "user",
        content: `Analiza este texto de cotizacion de transporte y extrae TODAS las rutas:

${textoPDF}

Para cada ruta extrae: origen, destino, servicio (Refrigerado/Seco), tarifa (numero), moneda (USD/MXN).

Responde SOLO con JSON array:
[{"origen":"...", "destino":"...", "servicio":"...", "tarifa":0, "moneda":"..."}]

Si no hay rutas: []`
      }];
    }

    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        "x-api-key": ANTHROPIC_API_KEY, 
        "anthropic-version": "2023-06-01" 
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        messages: messages
      })
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error("Error Claude:", errorText);
      return new Response(JSON.stringify({ success: false, error: "Error Claude API", details: errorText }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const claudeData = await claudeResponse.json();
    const contenido = claudeData.content?.[0]?.text || "[]";
    console.log("Respuesta Claude:", contenido);

    let rutas = [];
    try {
      const jsonStr = contenido.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      rutas = JSON.parse(jsonStr);
    } catch (e) {
      console.error("Error parsing:", e);
      rutas = [];
    }

    return new Response(JSON.stringify({ success: true, rutas }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
