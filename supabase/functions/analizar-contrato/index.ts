import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as fflate from "https://esm.sh/fflate@0.8.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ═══════════════════════════════════════════════════════════════
// DATOS DE TROB TRANSPORTES
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
- TROB Transportes S.A. de C.V. (59.5%)
- WExpress (25.5%)
- Speedyhaul International (15%)
- TROB USA LLC

FLOTA: 220+ tractores, cajas 53 ft seco y refrigerado
COBERTURA: Nacional + Cross-Border USA (Laredo TX, Colombia NL, McAllen TX)
`;

// ═══════════════════════════════════════════════════════════════
// EXTRAER TEXTO DE .DOCX (ZIP con XML)
// ═══════════════════════════════════════════════════════════════
function extractTextFromDocx(base64Data: string): string {
  try {
    // Decode base64 to Uint8Array
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Unzip the docx
    const unzipped = fflate.unzipSync(bytes);

    // Find word/document.xml
    let xmlContent = "";
    for (const [path, data] of Object.entries(unzipped)) {
      if (path === "word/document.xml" || path.includes("word/document")) {
        xmlContent = new TextDecoder().decode(data as Uint8Array);
        break;
      }
    }

    if (!xmlContent) {
      // Try any XML file
      for (const [path, data] of Object.entries(unzipped)) {
        if (path.endsWith(".xml") && path.includes("word")) {
          xmlContent = new TextDecoder().decode(data as Uint8Array);
          break;
        }
      }
    }

    if (!xmlContent) {
      return "[No se pudo extraer texto del archivo Word]";
    }

    // Extract text from XML - remove tags, keep text content
    // Match <w:t> tags which contain the actual text
    const textParts: string[] = [];
    const regex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
    let match;
    while ((match = regex.exec(xmlContent)) !== null) {
      textParts.push(match[1]);
    }

    // Also detect paragraph breaks
    let result = xmlContent;
    // Replace paragraph endings with newlines
    result = result.replace(/<\/w:p>/g, "\n");
    // Remove all XML tags
    result = result.replace(/<[^>]+>/g, "");
    // Clean up whitespace
    result = result.replace(/\n{3,}/g, "\n\n").trim();

    if (result.length < 50 && textParts.length > 0) {
      return textParts.join(" ");
    }

    return result || textParts.join(" ") || "[Archivo Word vacío o no legible]";
  } catch (error) {
    console.error("Error extracting docx:", error);
    return `[Error al extraer texto del Word: ${error.message}]`;
  }
}

// ═══════════════════════════════════════════════════════════════
// EXTRAER TEXTO DE .XLSX
// ═══════════════════════════════════════════════════════════════
function extractTextFromXlsx(base64Data: string): string {
  try {
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const unzipped = fflate.unzipSync(bytes);

    // Get shared strings
    let sharedStrings: string[] = [];
    for (const [path, data] of Object.entries(unzipped)) {
      if (path.includes("sharedStrings.xml")) {
        const xml = new TextDecoder().decode(data as Uint8Array);
        const regex = /<t[^>]*>([^<]*)<\/t>/g;
        let match;
        while ((match = regex.exec(xml)) !== null) {
          sharedStrings.push(match[1]);
        }
        break;
      }
    }

    // Get sheet data
    let sheetText = "";
    for (const [path, data] of Object.entries(unzipped)) {
      if (path.includes("sheet1.xml") || path.includes("sheet.xml")) {
        const xml = new TextDecoder().decode(data as Uint8Array);
        sheetText = xml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        break;
      }
    }

    return sharedStrings.length > 0 
      ? "CONTENIDO DEL EXCEL:\n" + sharedStrings.join(" | ") + "\n\n" + sheetText
      : sheetText || "[Excel vacío]";
  } catch (error) {
    return `[Error al extraer Excel: ${error.message}]`;
  }
}

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

    const fileName = (nombre_archivo || "").toLowerCase();
    const fileType = (tipo_archivo || "").toLowerCase();
    
    const isPDF = fileType.includes("pdf") || fileName.endsWith(".pdf");
    const isImage = fileType.includes("image") || fileName.endsWith(".png") || fileName.endsWith(".jpg") || fileName.endsWith(".jpeg");
    const isWord = fileType.includes("word") || fileType.includes("officedocument.wordprocessing") || fileName.endsWith(".docx") || fileName.endsWith(".doc");
    const isExcel = fileType.includes("excel") || fileType.includes("spreadsheet") || fileName.endsWith(".xlsx") || fileName.endsWith(".xls");
    const isCSV = fileName.endsWith(".csv") || fileType.includes("csv");

    // Construir contenido del mensaje
    let userContent: any[] = [];

    if (isPDF) {
      userContent = [
        { type: "document", source: { type: "base64", media_type: "application/pdf", data: archivo_base64 } },
        { type: "text", text: `Analiza este contrato. Archivo: ${nombre_archivo}. Fecha: ${fecha_analisis}` },
      ];
    } else if (isImage) {
      const mediaType = fileName.endsWith(".png") ? "image/png" : "image/jpeg";
      userContent = [
        { type: "image", source: { type: "base64", media_type: mediaType, data: archivo_base64 } },
        { type: "text", text: `Analiza este contrato (imagen). Archivo: ${nombre_archivo}. Fecha: ${fecha_analisis}` },
      ];
    } else if (isWord) {
      // EXTRAER TEXTO del Word
      console.log("Extracting text from Word document...");
      const extractedText = extractTextFromDocx(archivo_base64);
      console.log(`Extracted ${extractedText.length} chars from Word`);
      userContent = [
        { type: "text", text: `Analiza el siguiente contrato extraído de un archivo Word (${nombre_archivo}). Fecha de análisis: ${fecha_analisis}.\n\n--- INICIO DEL CONTRATO ---\n${extractedText}\n--- FIN DEL CONTRATO ---` },
      ];
    } else if (isExcel) {
      console.log("Extracting text from Excel...");
      const extractedText = extractTextFromXlsx(archivo_base64);
      userContent = [
        { type: "text", text: `Analiza el siguiente contrato/documento extraído de un archivo Excel (${nombre_archivo}). Fecha: ${fecha_analisis}.\n\n${extractedText}` },
      ];
    } else if (isCSV) {
      const text = atob(archivo_base64);
      userContent = [
        { type: "text", text: `Analiza este documento CSV (${nombre_archivo}). Fecha: ${fecha_analisis}.\n\n${text}` },
      ];
    } else {
      // Fallback: intentar como PDF
      userContent = [
        { type: "document", source: { type: "base64", media_type: "application/pdf", data: archivo_base64 } },
        { type: "text", text: `Analiza este contrato. Archivo: ${nombre_archivo}. Fecha: ${fecha_analisis}` },
      ];
    }

    const systemPrompt = `Eres un abogado corporativo experto en contratos de transporte de carga en México. Tu cliente es TROB TRANSPORTES y debes PROTEGER sus intereses.

${DATOS_TROB}

INSTRUCCIONES DE ANÁLISIS:
1. Lee el contrato completo con máximo detalle
2. Identifica TODAS las partes, fechas, montos, vigencias
3. Detecta si el contrato es LEONINO (abusivo, desproporcionado contra TROB)
4. Identifica CADA punto de riesgo para TROB
5. Lista cláusulas que FALTAN y deberían incluirse para proteger a TROB
6. Genera una VERSIÓN BLINDADA completa del contrato que proteja a TROB

CRITERIOS DE RIESGO PARA TROB (empresa de autotransporte):
- Responsabilidad excesiva por daños a mercancía sin límites razonables
- Penalizaciones desproporcionadas por retrasos
- Plazos de pago mayores a 30 días
- Falta de cláusula de fuerza mayor (bloqueos, clima, inseguridad en carreteras)
- Jurisdicción fuera de Aguascalientes
- Falta de cláusula de ajuste por combustible
- Cláusulas de exclusividad sin reciprocidad
- Responsabilidad por merma sin tolerancias estándar del sector
- Falta de procedimiento claro para reclamaciones con plazos definidos
- Seguros insuficientes o responsabilidad solidaria excesiva
- Plazos de preaviso para terminación menores a 30 días
- Penalidades por cancelación unilateral sin reciprocidad
- Falta de límite máximo de indemnización
- Cesión de derechos sin consentimiento
- Modificaciones unilaterales de tarifas

SEMÁFORO DE RIESGO:
- 1-3: VERDE (contrato seguro, bajo riesgo)
- 4-6: AMARILLO (riesgo moderado, requiere ajustes)
- 7-10: ROJO (peligroso/leonino, no firmar sin cambios)

EN LA VERSIÓN BLINDADA:
- Usa los datos reales de TROB (Escritura 21,183, Vol 494, Notaría 35, Notario Lic. Fernando Quezada Leos, Aguascalientes)
- Representante Legal: Alejandro López Ramírez
- RFC: TTR151216CHA
- Jurisdicción: tribunales de Aguascalientes, Aguascalientes
- Incluye cláusula de fuerza mayor
- Incluye cláusula de ajuste por combustible
- Límites razonables de responsabilidad
- Pagos a máximo 30 días
- Preaviso de 30 días para terminación
- Procedimiento de reclamaciones con plazos
- Límite de indemnización razonable

REGLA CRÍTICA SOBRE contrato_llenado:
- DEBES reproducir el contrato COMPLETO, TODAS las cláusulas, TODOS los párrafos, CADA palabra
- NUNCA uses frases como "[resto del contrato...]", "[continúa igual...]", "[ver original...]" o cualquier resumen/atajo
- Si el contrato tiene 50 cláusulas, las 50 deben aparecer completas
- Solo rellena los espacios en blanco (___), fechas vacías, campos por definir
- La fecha debe ser la fecha de análisis proporcionada
- NO modifiques la redacción, NO agregues cláusulas, NO cambies el orden
- Es el contrato IDÉNTICO pero sin campos vacíos, listo para firma
- Si truncas o resumes el contrato, el resultado es INÚTIL y INACEPTABLE

REGLA CRÍTICA SOBRE version_blindada:
- DEBES escribir el contrato COMPLETO con TODAS las modificaciones, TODAS las cláusulas
- NUNCA uses frases como "[resto igual...]", "[mantener cláusula original...]" o resúmenes
- Cada cláusula modificada debe estar completa, y las no modificadas también deben aparecer íntegras

RESPONDE EXCLUSIVAMENTE en JSON válido (sin markdown, sin backticks, solo JSON puro):
{
  "datos_extraidos": {
    "representante_legal": "nombre del rep legal de la CONTRAPARTE (no TROB)",
    "notaria": "datos de notaría de la contraparte si aparecen",
    "numero_escritura": "número de escritura de la contraparte si aparece",
    "fecha_contrato": "fecha del contrato",
    "partes": ["NOMBRE PARTE A completo", "NOMBRE PARTE B completo"],
    "objeto_contrato": "descripción del objeto del contrato",
    "vigencia": "período de vigencia",
    "monto_o_tarifa": "monto o tarifa acordada"
  },
  "contrato_llenado": "OBLIGATORIO: El texto COMPLETO del contrato original, cláusula por cláusula, párrafo por párrafo, palabra por palabra. Solo con los espacios en blanco rellenados y la fecha del día. NUNCA truncar, NUNCA resumir, NUNCA usar [...]. CADA cláusula debe estar aquí.",
  "es_leonino": true,
  "explicacion_leonino": "explicación detallada",
  "riesgos": [
    {
      "clausula": "nombre/número de la cláusula",
      "descripcion": "qué dice y por qué es riesgoso para TROB",
      "severidad": "ALTA",
      "sugerencia": "cómo modificarla para proteger a TROB"
    }
  ],
  "clausulas_faltantes": ["descripción de cada cláusula que falta"],
  "version_blindada": "OBLIGATORIO: El contrato COMPLETO reescrito con TODAS las protecciones para TROB. CADA cláusula debe estar aquí, las modificadas y las no modificadas. NUNCA truncar.",
  "calificacion_riesgo": 7,
  "resumen_ejecutivo": "resumen ejecutivo con hallazgos y recomendaciones"
}`;

    console.log(`Sending to Anthropic... Content type: ${userContent[0]?.type}, fileName: ${fileName}`);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 64000,
        system: systemPrompt,
        messages: [{ role: "user", content: userContent }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anthropic error:", response.status, errorText);
      return new Response(JSON.stringify({ success: false, error: `Error de IA: ${response.status}. Intenta con PDF.` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "";

    // Parse JSON
    let analisis;
    try {
      analisis = JSON.parse(text);
    } catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try { analisis = JSON.parse(jsonMatch[0]); } catch {
          return new Response(JSON.stringify({ success: false, error: "No se pudo interpretar la respuesta" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
          });
        }
      } else {
        return new Response(JSON.stringify({ success: false, error: "Respuesta inesperada de IA" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
        });
      }
    }

    // Defaults
    if (!analisis.datos_extraidos) analisis.datos_extraidos = { representante_legal: "", notaria: "", numero_escritura: "", fecha_contrato: "", partes: [], objeto_contrato: "", vigencia: "", monto_o_tarifa: "" };
    if (!analisis.contrato_llenado) analisis.contrato_llenado = "";
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
