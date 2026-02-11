// supabase/functions/validar-documentos-alta/index.ts
// ACTUALIZADO: Rango de 30 días para Constancia Fiscal y Opinión de Cumplimiento
// CORREGIDO: Formato fechas mexicano DD/MM/YYYY

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') || ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { solicitudId, documentos, tipoEmpresa } = await req.json()

    if (!solicitudId || !documentos) {
      return new Response(JSON.stringify({ success: false, error: 'Faltan parámetros' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Calcular fecha de hoy para pasar al prompt
    const now = new Date()
    const dia = now.getDate()
    const mes = now.getMonth() + 1
    const anio = now.getFullYear()
    const fechaHoy = `${dia} de ${['', 'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'][mes]} de ${anio}`

    // Fecha hace 30 días
    const hace30 = new Date(now)
    hace30.setDate(hace30.getDate() - 30)
    const diaH30 = hace30.getDate()
    const mesH30 = hace30.getMonth() + 1
    const anioH30 = hace30.getFullYear()
    const fechaHace30 = `${diaH30} de ${['', 'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'][mesH30]} de ${anioH30}`

    // Fecha hace 3 meses
    const hace3M = new Date(now)
    hace3M.setMonth(hace3M.getMonth() - 3)
    const diaH3M = hace3M.getDate()
    const mesH3M = hace3M.getMonth() + 1
    const anioH3M = hace3M.getFullYear()
    const fechaHace3Meses = `${diaH3M} de ${['', 'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'][mesH3M]} de ${anioH3M}`

    const docsParaIA: Array<{ key: string; base64: string; mediaType: string }> = []

    // Recolectar todos los documentos subidos
    const allDocKeys = Object.keys(documentos).filter(k => documentos[k])

    for (const docKey of allDocKeys) {
      try {
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('alta-documentos')
          .download(documentos[docKey])

        if (downloadError || !fileData) {
          console.error(`Error descargando ${docKey}:`, downloadError)
          continue
        }

        const arrayBuffer = await fileData.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)
        
        // Convertir a base64 en chunks para evitar stack overflow
        let base64 = ''
        const chunkSize = 32768
        for (let i = 0; i < uint8Array.length; i += chunkSize) {
          const chunk = uint8Array.subarray(i, i + chunkSize)
          base64 += String.fromCharCode(...chunk)
        }
        base64 = btoa(base64)

        const fileName = documentos[docKey].toLowerCase()
        let mediaType = 'application/pdf'
        if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) mediaType = 'image/jpeg'
        else if (fileName.endsWith('.png')) mediaType = 'image/png'

        docsParaIA.push({ key: docKey, base64, mediaType })
      } catch (err) {
        console.error(`Error procesando ${docKey}:`, err)
      }
    }

    let resultado = { valid: false, errors: [] as any[], datosExtraidos: {} }

    if (docsParaIA.length > 0 && ANTHROPIC_API_KEY) {
      // Construir prompt según tipo de empresa
      const isUSA = tipoEmpresa === 'USA' || tipoEmpresa === 'USA/CANADA'

      const systemPrompt = isUSA
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
        : `Eres un asistente de validación de documentos para una empresa de logística mexicana.

FECHA DE HOY: ${fechaHoy}

Analiza los documentos subidos y:
1. Verifica que cada documento sea válido y esté vigente
2. Extrae la siguiente información:
   - De Constancia Fiscal: RFC, Razón Social, Régimen Fiscal, Dirección completa (calle, número exterior, número interior, colonia, CP, ciudad, estado)
   - De Opinión de Cumplimiento: Verifica que sea POSITIVA y que esté vigente
   - De Comprobante de Domicilio: Verifica que no sea mayor a 3 meses
   - De INE: Nombre del Representante Legal, verifica que no esté vencida
   - De Acta Constitutiva: Objeto social/giro de la empresa
   - De Carátula Bancaria: Banco, CLABE interbancaria (debe tener exactamente 18 dígitos), Titular de la cuenta
   - De Poder Notarial: Notaría, número de escritura (si aplica)

REGLAS DE VALIDACIÓN DE FECHAS:
- IMPORTANTE: En México las fechas se escriben DD/MM/YYYY o "día de mes de año". Ejemplo: 03/01/2026 = 3 de enero de 2026, NO 1 de marzo.
- Constancia de Situación Fiscal: La fecha de emisión debe ser de los ÚLTIMOS 30 DÍAS. Cualquier fecha entre ${fechaHace30} y ${fechaHoy} es VÁLIDA.
- Opinión de Cumplimiento: La fecha de emisión debe ser de los ÚLTIMOS 30 DÍAS. Cualquier fecha entre ${fechaHace30} y ${fechaHoy} es VÁLIDA.
- Comprobante de Domicilio: La fecha debe ser de los últimos 3 meses (desde ${fechaHace3Meses}).
- INE/Credencial para votar: La vigencia no debe estar vencida respecto a la fecha actual.
- Acta Constitutiva: No tiene restricción de vigencia.
- Carátula Bancaria: No tiene restricción de vigencia, pero la CLABE debe tener EXACTAMENTE 18 dígitos numéricos.
- Poder Notarial: No tiene restricción de vigencia.

REGLAS DE VALIDACIÓN DE CLABE:
- La CLABE interbancaria debe tener EXACTAMENTE 18 dígitos numéricos consecutivos.
- No debe tener espacios, guiones ni separadores.
- Si tiene menos o más de 18 dígitos, reportar como error.
- Al contar dígitos, cuenta SOLO los caracteres numéricos (0-9), ignora cualquier espacio o separador.

Devuelve un JSON con:
{
  "valid": true/false,
  "errors": [{"documento": "Constancia Fiscal", "error": "descripción del error", "solucion": "cómo solucionarlo"}],
  "datosExtraidos": {
    "rfc": "",
    "razon_social": "",
    "regimen_fiscal": "",
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
    "giro": "",
    "notaria": "",
    "escritura": ""
  }
}

IMPORTANTE: 
- Si un documento está dentro del rango de fechas válido, márquelo como VÁLIDO. No seas más estricto que las reglas indicadas.
- Solo reporta errores cuando el documento CLARAMENTE viola las reglas.
- Si la CLABE tiene 18 dígitos numéricos (ignorando espacios), es VÁLIDA.
- Devuelve ÚNICAMENTE el JSON, sin texto adicional, sin backticks, sin markdown.`

      // Construir contenido para la API
      const userContent: any[] = []

      for (const doc of docsParaIA) {
        if (doc.mediaType === 'application/pdf') {
          userContent.push({
            type: 'document',
            source: { type: 'base64', media_type: doc.mediaType, data: doc.base64 }
          })
        } else {
          userContent.push({
            type: 'image',
            source: { type: 'base64', media_type: doc.mediaType, data: doc.base64 }
          })
        }
        userContent.push({
          type: 'text',
          text: `[Este es el documento: ${doc.key}]`
        })
      }

      userContent.push({
        type: 'text',
        text: 'Analiza todos los documentos anteriores y devuelve SOLO el JSON con los resultados de validación. Sin explicaciones adicionales, sin backticks.'
      })

      // Llamar API Anthropic
      const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 64000,
          system: systemPrompt,
          messages: [{ role: 'user', content: userContent }]
        })
      })

      if (anthropicResponse.ok) {
        const aiData = await anthropicResponse.json()
        const aiText = aiData.content
          ?.map((c: any) => c.type === 'text' ? c.text : '')
          .join('')
          .trim()

        if (aiText) {
          try {
            // Limpiar posibles backticks o markdown
            const cleaned = aiText
              .replace(/```json\s*/gi, '')
              .replace(/```\s*/gi, '')
              .trim()
            resultado = JSON.parse(cleaned)
          } catch (parseErr) {
            console.error('Error parseando respuesta IA:', parseErr)
            console.error('Texto recibido:', aiText.substring(0, 500))
            resultado = {
              valid: false,
              errors: [{ documento: 'Sistema', error: 'Error procesando la respuesta de validación', solucion: 'Intente nuevamente' }],
              datosExtraidos: {}
            }
          }
        }
      } else {
        const errText = await anthropicResponse.text()
        console.error('Error Anthropic API:', anthropicResponse.status, errText)
        resultado = {
          valid: false,
          errors: [{ documento: 'Sistema', error: 'Error de comunicación con el servicio de validación', solucion: 'Intente nuevamente en unos minutos' }],
          datosExtraidos: {}
        }
      }
    } else if (!ANTHROPIC_API_KEY) {
      resultado = {
        valid: false,
        errors: [{ documento: 'Sistema', error: 'Servicio de validación no configurado', solucion: 'Contacte al administrador' }],
        datosExtraidos: {}
      }
    }

    // Guardar resultado en la base de datos
    if (solicitudId) {
      await supabase
        .from('alta_clientes')
        .update({
          datos_extraidos: resultado.datosExtraidos,
          validacion_resultado: resultado,
          validacion_fecha: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', solicitudId)
    }

    return new Response(JSON.stringify({ success: true, ...resultado }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    console.error('Error general:', err)
    return new Response(JSON.stringify({
      success: false,
      valid: false,
      errors: [{ documento: 'Sistema', error: `Error interno: ${err.message}`, solucion: 'Intente nuevamente' }],
      datosExtraidos: {}
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
