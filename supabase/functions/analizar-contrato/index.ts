import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ═══════════════════════════════════════════════════════════════
// DATOS DE TROB TRANSPORTES - Para referencia en análisis
// ═══════════════════════════════════════════════════════════════
const DATOS_TROB = `
DATOS DE NUESTRA EMPRESA (la parte que debe ser PROTEGIDA en el contrato):

DATOS GENERALES:
- Razón Social: TROB TRANSPORTES, S.A. DE C.V.
- RFC: TTR151216CHA
- Fecha de Constitución: 16 de diciembre de 2015
- Domicilio Fiscal: Avenida Alta Tensión Lote 32 A, Colonia Otra no especificada en el catálogo, C.P. 49000, Ciudad Guzmán, Municipio: Zapotlán el Grande, Estado: Jalisco, México
- Teléfono: +52 811 239 2266
- Correo: ventas@trob.com.mx
- Representante Legal: Alejandro López Ramírez
- IMSS: B8429078108
- Giro: Autotransporte foráneo de carga general y autotransporte foráneo de materiales y residuos peligrosos
- Cruces Fronterizos: Laredo, Colombia NL y McAllen únicamente
- Servicio: Autotransporte seco y refrigerado, cajas 53 ft, bajo esquema dedicado e IMPEX

DATOS NOTARIALES / ACTA CONSTITUTIVA:
- Número de Escritura Pública: 21,183
- Volumen: 494
- Notaría: 35
- Notario Público: Lic. Fernando Quezada Leos
- Ciudad de la Notaría: Aguascalientes, Aguascalientes
- Registro Público: Volumen MCXVIII, Libro 3, Boleta 0211612
- Fecha de Registro: 18 de enero de 2016

DATOS BANCARIOS:
- Banco: BBVA
- Número de Cuenta: 0104258355
- CLABE Interbancaria: 012010001042583559

DIRECTOR GENERAL: Alejandro López Ramírez (alejandro.lopez@trob.com.mx)
GERENTE COMERCIAL: Juan José Viveros Vázquez (juan.viveros@trob.com.mx, +52 811 239 2266)

EMPRESAS DEL GRUPO:
- TROB Transportes S.A. de C.V. (59.5% de la flota)
- WExpress (25.5%)
- Speedyhaul International (15%)
- TROB USA LLC

FLOTA: 220+ tractores, cajas 53 ft seco y refrigerado
COBERTURA: Nacional + Cross-Border USA (Laredo TX, Colombia NL, McAllen TX)
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ success: false, error: "API key no configurada" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const { archivo_base64, nombre_archivo, tipo_archivo, fecha_analisis } = await req.json();

    if (!archivo_base64) {
      return new Response(JSON.stringify({ success: false, error: "No se recibió archivo" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Determinar cómo enviar el archivo a Claude
    const fileName = (nombre_archivo || "").toLowerCase();
    const fileType = (tipo_archivo || "").toLowerCase();
    
    // Tipos soportados nativamente por Anthropic como document
    const isPDF = fileType.includes("pdf") || fileName.endsWith(".pdf");
    const isImage = fileType.includes("image") || fileName.endsWith(".png") || fileName.endsWith(".jpg") || fileName.endsWith(".jpeg");
    
    // Word y Excel NO son soportados nativamente - enviamos como texto en el prompt
    const isWord = fileType.includes("word") || fileType.includes("officedocument.wordprocessing") || fileName.endsWith(".docx") || fileName.endsWith(".doc");
    const isExcel = fileType.includes("excel") || fileType.includes("spreadsheet") || fileName.endsWith(".xlsx") || fileName.endsWith(".xls") || fileName.endsWith(".csv");

    // Construir el contenido del mensaje según el tipo
    let userContent: any[] = [];

    if (isPDF) {
      userContent = [
        {
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: archivo_base64 },
        },
        { type: "text", text: `Analiza este contrato. Archivo: ${nombre_archivo}. Fecha de análisis: ${fecha_analisis || new Date().toLocaleDateString("es-MX")}` },
      ];
    } else if (isImage) {
      const mediaType = fileName.endsWith(".png") ? "image/png" : "image/jpeg";
      userContent = [
        {
          type: "image",
          source: { type: "base64", media_type: mediaType, data: archivo_base64 },
        },
        { type: "text", text: `Analiza este contrato (imagen). Archivo: ${nombre_archivo}. Fecha de análisis: ${fecha_analisis || new Date().toLocaleDateString("es-MX")}` },
      ];
    } else if (isWord || isExcel) {
      // Para Word/Excel: decodificamos el base64 y extraemos lo que podamos como texto
      // Enviamos el base64 como documento genérico con instrucciones
      userContent = [
        {
          type: "document",
          source: { type: "base64", media_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", data: archivo_base64 },
        },
        { type: "text", text: `Analiza este contrato en formato Word/Excel. Archivo: ${nombre_archivo}. Fecha de análisis: ${fecha_analisis || new Date().toLocaleDateString("es-MX")}` },
      ];
    } else {
      // Fallback: intentar como PDF
      userContent = [
        {
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: archivo_base64 },
        },
        { type: "text", text: `Analiza este contrato. Archivo: ${nombre_archivo}. Fecha de análisis: ${fecha_analisis || new Date().toLocaleDateString("es-MX")}` },
      ];
    }

    const systemPrompt = `Eres un abogado corporativo experto en contratos de transporte de carga en México. Tu cliente es TROB TRANSPORTES y debes PROTEGER sus intereses.

${DATOS_TROB}

INSTRUCCIONES DE ANÁLISIS:
1. Lee el contrato completo
2. Identifica TODAS las partes, fechas, montos, vigencias
3. Detecta si el contrato es LEONINO (abusivo, desproporcionado)
4. Identifica CADA punto de riesgo para TROB
5. Lista cláusulas que FALTAN y deberían incluirse
6. Genera una VERSIÓN BLINDADA que proteja a TROB

CRITERIOS DE RIESGO PARA TROB (empresa de transporte):
- Responsabilidad excesiva por daños a mercancía sin límites razonables
- Penalizaciones desproporcionadas por retrasos
- Plazos de pago mayores a 30 días
- Falta de cláusula de fuerza mayor (bloqueos, clima, inseguridad)
- Jurisdicción fuera de Aguascalientes (inconveniente para TROB)
- Falta de cláusula de ajuste por combustible
- Cláusulas de exclusividad sin reciprocidad
- Responsabilidad por merma sin tolerancias estándar del sector
- Falta de procedimiento claro para reclamaciones
- Seguros insuficientes o responsabilidad solidaria excesiva
- Plazos de preaviso para terminación menores a 30 días
- Penalidades por cancelación unilateral sin reciprocidad

EN LA VERSIÓN BLINDADA:
- Usa los datos reales de TROB (escritura 21,183, notaría 35, Rep Legal Alejandro López Ramírez)
- Jurisdicción: Aguascalientes
- Incluye cláusula de fuerza mayor
- Incluye cláusula de ajuste por combustible
- Límites razonables de responsabilidad
- Pagos a 30 días máximo
- Preaviso de 30 días para terminación

RESPONDE EXCLUSIVAMENTE en JSON con esta estructura (sin markdown, sin backticks, solo JSON puro):
{
  "datos_extraidos": {
    "representante_legal": "nombre del rep legal de la contraparte",
    "notaria": "datos de notaría si aparecen",
    "numero_escritura": "número si aparece",
    "fecha_contrato": "fecha del contrato",
    "partes": ["PARTE A", "PARTE B"],
    "objeto_contrato": "descripción breve del objeto",
    "vigencia": "período de vigencia",
    "monto_o_tarifa": "monto o tarifa acordada"
  },
  "es_leonino": true/false,
  "explicacion_leonino": "explicación detallada de por qué es o no leonino",
  "riesgos": [
    {
      "clausula": "nombre o número de la cláusula",
      "descripcion": "qué dice y por qué es riesgoso para TROB",
      "severidad": "ALTA/MEDIA/BAJA",
      "sugerencia": "cómo modificarla para proteger a TROB"
    }
  ],
  "clausulas_faltantes": [
    "descripción de cada cláusula que debería incluirse"
  ],
  "version_blindada": "texto completo del contrato modificado protegiendo a TROB, usando sus datos reales (Escritura 21,183, Notaría 35, Rep Legal Alejandro López Ramírez, etc.)",
  "calificacion_riesgo": 7,
  "resumen_ejecutivo": "resumen de 3-5 párrafos con hallazgos principales y recomendaciones"
}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
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
        messages: [{ role: "user", content: userContent }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anthropic API error:", response.status, errorText);
      
      // Si falla con document type, reintentar sin el tipo document
      if (response.status === 400 && (isWord || isExcel)) {
        console.log("Retrying without document type for Word/Excel...");
        
        // Retry: enviar solo como texto pidiendo que interprete
        const retryContent = [
          { type: "text", text: `El siguiente es un contrato en formato ${isWord ? 'Word (.docx)' : 'Excel (.xlsx)'}. El archivo se llama "${nombre_archivo}". Por favor analízalo como contrato. Si no puedes leer el contenido binario, indica qué información necesitas. Fecha de análisis: ${fecha_analisis || new Date().toLocaleDateString("es-MX")}.\n\nArchivo en base64 (primeros 1000 caracteres para referencia): ${archivo_base64.substring(0, 1000)}` },
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
          return new Response(JSON.stringify({ 
            success: false, 
            error: `Para archivos Word/Excel, por favor conviértelos a PDF primero. Error: ${retryResponse.status}` 
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
        
        const retryData = await retryResponse.json();
        const retryText = retryData.content?.[0]?.text || "";
        
        try {
          const jsonMatch = retryText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const analisis = JSON.parse(jsonMatch[0]);
            return new Response(JSON.stringify({ success: true, analisis }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        } catch {}
        
        return new Response(JSON.stringify({ 
          success: false, 
          error: "No se pudo analizar el archivo Word/Excel. Conviértelo a PDF para mejores resultados." 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      
      return new Response(JSON.stringify({ success: false, error: `Error de IA: ${response.status}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "";

    // Extraer JSON de la respuesta
    let analisis;
    try {
      // Intentar parsear directamente
      analisis = JSON.parse(text);
    } catch {
      // Buscar JSON dentro del texto
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          analisis = JSON.parse(jsonMatch[0]);
        } catch {
          return new Response(JSON.stringify({ success: false, error: "No se pudo interpretar la respuesta de IA" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
      } else {
        return new Response(JSON.stringify({ success: false, error: "Respuesta inesperada de IA" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    // Validar campos mínimos
    if (!analisis.datos_extraidos) {
      analisis.datos_extraidos = { representante_legal: "", notaria: "", numero_escritura: "", fecha_contrato: "", partes: [], objeto_contrato: "", vigencia: "", monto_o_tarifa: "" };
    }
    if (!analisis.riesgos) analisis.riesgos = [];
    if (!analisis.clausulas_faltantes) analisis.clausulas_faltantes = [];
    if (typeof analisis.calificacion_riesgo !== "number") analisis.calificacion_riesgo = 5;
    if (typeof analisis.es_leonino !== "boolean") analisis.es_leonino = false;

    return new Response(JSON.stringify({ success: true, analisis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message || "Error interno" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});
