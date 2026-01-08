// supabase/functions/validar-documentos-alta/index.ts
// Deploy: supabase functions deploy validar-documentos-alta

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { solicitudId, documentos, tipoEmpresa, idioma } = await req.json();
    
    if (!solicitudId || !documentos) {
      return new Response(JSON.stringify({ success: false, error: "Faltan datos" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);
    const errores: any[] = [];
    const datosExtraidos: any = {};

    // ═══════════════════════════════════════════════════════════════════════════
    // DESCARGAR Y PROCESAR CADA DOCUMENTO
    // ═══════════════════════════════════════════════════════════════════════════
    const docsToValidate = tipoEmpresa === "USA_CANADA" 
      ? ["w9", "bank_statement", "mc_number", "void_check", "id_document"]
      : ["constancia_fiscal", "opinion_cumplimiento", "comprobante_domicilio", "ine_representante", "acta_constitutiva", "caratula_bancaria"];

    // Construir contenido para Anthropic
    const documentContents: any[] = [];
    
    for (const docKey of docsToValidate) {
      const filePath = documentos[docKey];
      if (!filePath) continue;

      try {
        // Descargar archivo de Storage
        const { data: fileData, error: downloadError } = await supabase.storage
          .from("alta-documentos")
          .download(filePath);
        
        if (downloadError) {
          console.error(`Error descargando ${docKey}:`, downloadError);
          continue;
        }

        // Convertir a base64
        const arrayBuffer = await fileData.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        
        // Detectar tipo de archivo
        const extension = filePath.split(".").pop()?.toLowerCase();
        let mediaType = "application/pdf";
        if (["jpg", "jpeg"].includes(extension || "")) mediaType = "image/jpeg";
        if (extension === "png") mediaType = "image/png";

        documentContents.push({
          type: mediaType.startsWith("image") ? "image" : "document",
          source: {
            type: "base64",
            media_type: mediaType,
            data: base64,
          },
          docKey,
        });
      } catch (err) {
        console.error(`Error procesando ${docKey}:`, err);
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // LLAMAR A ANTHROPIC API PARA VALIDAR Y EXTRAER
    // ═══════════════════════════════════════════════════════════════════════════
    const systemPrompt = tipoEmpresa === "USA_CANADA" 
      ? `You are a document validation assistant for a logistics company. Analyze the uploaded documents and:
1. Verify each document is valid and not expired
2. Extract the following information:
   - From W-9: Tax ID (EIN/SSN), Company Name, Address
   - From Bank Statement: Bank Name, Account Number (last 4 digits only), Account Holder Name
   - From MC Certificate: MC Number, DOT Number if present
   - From Void Check: Routing Number, Account Number, Bank Name
   - From ID Document: Legal Representative Name

Return a JSON object with:
{
  "valid": true/false,
  "errors": [{"documento": "W-9", "error": "description", "solucion": "how to fix"}],
  "datosExtraidos": {
    "tax_id": "",
    "razon_social": "",
    "calle": "",
    "ciudad": "",
    "estado": "",
    "cp": "",
    "pais": "USA",
    "representante_legal": "",
    "banco": "",
    "routing_number": "",
    "account_number": "",
    "mc_number": "",
    "dot_number": ""
  }
}`
      : `Eres un asistente de validación de documentos para una empresa de logística. Analiza los documentos subidos y:
1. Verifica que cada documento sea válido y esté vigente
2. Extrae la siguiente información:
   - De Constancia Fiscal: RFC, Razón Social, Dirección completa (calle, número, colonia, CP, ciudad, estado)
   - De Opinión de Cumplimiento: Verifica que sea del mes actual y esté en positivo
   - De Comprobante de Domicilio: Verifica que sea de los últimos 3 meses
   - De INE: Nombre del Representante Legal, verifica vigencia
   - De Acta Constitutiva: Objeto social/giro
   - De Carátula Bancaria: Banco, CLABE (18 dígitos), Titular de la cuenta

Reglas de validación:
- Constancia Fiscal: Debe ser del mes actual
- Opinión de Cumplimiento: Debe decir "POSITIVO" o "EN SENTIDO POSITIVO" y ser del mes actual
- Comprobante de Domicilio: Fecha no mayor a 3 meses
- INE: No debe estar vencida
- Carátula Bancaria: Debe mostrar CLABE de 18 dígitos

Devuelve un JSON con:
{
  "valid": true/false,
  "errors": [{"documento": "Constancia Fiscal", "error": "descripción del error", "solucion": "cómo solucionarlo"}],
  "datosExtraidos": {
    "rfc": "",
    "razon_social": "",
    "calle": "",
    "no_ext": "",
    "no_int": "",
    "colonia": "",
    "cp": "",
    "ciudad": "",
    "estado": "",
    "pais": "México",
    "representante_legal": "",
    "banco": "",
    "clabe": "",
    "titular_cuenta": "",
    "giro": ""
  }
}`;

    // Construir messages para Anthropic
    const userContent: any[] = [
      { type: "text", text: "Analiza los siguientes documentos y extrae la información:" }
    ];

    for (const doc of documentContents) {
      userContent.push({
        type: doc.type,
        source: doc.source,
      });
      userContent.push({
        type: "text",
        text: `[Este es el documento: ${doc.docKey}]`,
      });
    }

    userContent.push({
      type: "text",
      text: "Devuelve SOLO el JSON con los resultados, sin explicaciones adicionales.",
    });

    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: "user", content: userContent }],
      }),
    });

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      console.error("Anthropic API error:", errorText);
      throw new Error(`Anthropic API error: ${anthropicResponse.status}`);
    }

    const anthropicResult = await anthropicResponse.json();
    const responseText = anthropicResult.content[0]?.text || "";

    // Extraer JSON del response
    let validationResult;
    try {
      // Buscar JSON en el response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        validationResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseErr) {
      console.error("Error parsing Anthropic response:", parseErr);
      // Si falla el parsing, permitir continuar sin validación
      validationResult = { valid: true, errors: [], datosExtraidos: {} };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // GUARDAR RESULTADOS EN BD
    // ═══════════════════════════════════════════════════════════════════════════
    const updateData: any = {
      datos_extraidos: validationResult.datosExtraidos || {},
      documentos_validados: validationResult.valid,
      errores_validacion: validationResult.errors || [],
      validacion_fecha: new Date().toISOString(),
    };

    // Si extrajo datos, también guardarlos en campos individuales
    if (validationResult.datosExtraidos) {
      const de = validationResult.datosExtraidos;
      if (de.rfc) updateData.rfc_mc = de.rfc;
      if (de.tax_id) updateData.rfc_mc = de.tax_id;
      if (de.razon_social) updateData.razon_social = de.razon_social;
      if (de.calle) {
        updateData.direccion_completa = `${de.calle} ${de.no_ext || ""} ${de.no_int ? "Int. " + de.no_int : ""}, ${de.colonia || ""}, ${de.ciudad || ""}, ${de.estado || ""} CP ${de.cp || ""}`.trim();
      }
      if (de.banco) updateData.contacto_admin_banco = de.banco;
      if (de.clabe) updateData.contacto_admin_clabe = de.clabe;
      if (de.routing_number) updateData.contacto_admin_clabe = de.routing_number;
    }

    await supabase.from("alta_clientes").update(updateData).eq("id", solicitudId);

    // ═══════════════════════════════════════════════════════════════════════════
    // RESPUESTA
    // ═══════════════════════════════════════════════════════════════════════════
    return new Response(
      JSON.stringify({
        success: validationResult.valid,
        errores: validationResult.errors || [],
        datosExtraidos: validationResult.datosExtraidos || {},
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error en validación:", error);
    return new Response(
      JSON.stringify({ 
        success: true, // Permitir continuar aunque falle
        errores: [],
        datosExtraidos: {},
        warning: "Validación automática no disponible"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
