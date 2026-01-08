// supabase/functions/generar-pdf-solicitud/index.ts
// Deploy: supabase functions deploy generar-pdf-solicitud

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// ═══════════════════════════════════════════════════════════════════════════
// CLÁUSULAS LEGALES MÉXICO
// ═══════════════════════════════════════════════════════════════════════════
const CLAUSULAS_MX = `
IV. FIRMA ELECTRÓNICA Y VALIDEZ LEGAL

Las partes acuerdan expresamente que la firma electrónica utilizada para la suscripción del presente documento produce los mismos efectos legales que la firma autógrafa, de conformidad con lo dispuesto en el artículo 89 del Código de Comercio y la Ley de Firma Electrónica Avanzada.

El Cliente reconoce y acepta que la firma electrónica empleada identifica plenamente al firmante, manifiesta su consentimiento expreso y garantiza la integridad del contenido del presente documento, por lo que renuncia a objetar su validez, autenticidad o fuerza probatoria por el solo hecho de haberse celebrado por medios electrónicos.

V. REPRESENTACIÓN LEGAL

La persona que suscribe el presente documento en nombre del Cliente declara, bajo protesta de decir verdad, que cuenta con las facultades legales suficientes para obligarlo en los términos del presente Alta de Cliente, mismas que no le han sido revocadas, limitadas ni modificadas a la fecha de firma, obligando al Cliente en todos sus alcances legales.

VI. NO RELACIÓN LABORAL

El presente documento no crea ni deberá interpretarse como creador de relación laboral alguna entre GRUPO LOMA | TROB TRANSPORTES y el Cliente, ni entre cualquiera de sus empleados, operadores, representantes, agentes o terceros relacionados, siendo cada parte responsable de sus propias obligaciones laborales, fiscales y de seguridad social.

VII. DOMICILIO CONVENCIONAL

Las partes señalan como domicilios convencionales para todos los efectos legales, administrativos y de notificación los indicados en el presente formato de Alta de Cliente, mismos que se considerarán válidos mientras no se notifique por escrito cualquier cambio de domicilio.

VIII. PRELACIÓN DE DOCUMENTOS

En caso de existir discrepancia o conflicto entre el presente Alta de Cliente y cualquier orden de servicio, instrucción operativa, correo electrónico, comunicación verbal o documento posterior, prevalecerán en todo momento los términos y condiciones establecidos en el presente documento, salvo acuerdo expreso y por escrito firmado por ambas partes.

IX. JURISDICCIÓN Y LEGISLACIÓN APLICABLE

Para la interpretación, cumplimiento y ejecución del presente documento, las partes se someten expresamente a las leyes federales de los Estados Unidos Mexicanos y a la competencia de los tribunales mercantiles de la ciudad de Aguascalientes, Aguascalientes, México, renunciando a cualquier otro fuero que pudiera corresponderles por razón de su domicilio presente o futuro.

───────────────────────────────────────────────────────────────────────────────

AL FIRMAR ELECTRÓNICAMENTE EL PRESENTE DOCUMENTO, EL CLIENTE MANIFIESTA SU CONSENTIMIENTO EXPRESO Y ACEPTA ÍNTEGRAMENTE TODOS Y CADA UNO DE LOS TÉRMINOS Y CONDICIONES AQUÍ ESTABLECIDOS.
`;

// ═══════════════════════════════════════════════════════════════════════════
// CLÁUSULAS LEGALES USA/CANADA (INGLÉS)
// ═══════════════════════════════════════════════════════════════════════════
const CLAUSULAS_USA_EN = `
IV. ELECTRONIC SIGNATURE AND LEGAL VALIDITY

The parties expressly agree that the electronic signature used for the execution of this document shall have the same legal effect as a handwritten signature, in accordance with the Electronic Signatures in Global and National Commerce Act (E-SIGN Act, 15 U.S.C. § 7001 et seq.) and the Uniform Electronic Transactions Act (UETA).

The Customer acknowledges and accepts that the electronic signature employed fully identifies the signatory, manifests their express consent, and guarantees the integrity of the content of this document. The Customer hereby waives any right to contest its validity, authenticity, or evidentiary force solely on the basis that it was executed by electronic means.

V. LEGAL REPRESENTATION

The person executing this document on behalf of the Customer declares and warrants that they have full legal authority to bind the Customer to the terms of this Client Registration Agreement, and that such authority has not been revoked, limited, or modified as of the date of signature, thereby binding the Customer to all legal implications hereof.

VI. INDEPENDENT CONTRACTOR STATUS

This document does not create, and shall not be construed to create, any employment relationship between GRUPO LOMA | TROB TRANSPORTES and the Customer, nor between any of their respective employees, operators, representatives, agents, or related third parties. Each party shall be solely responsible for its own labor, tax, and social security obligations.

VII. ADDRESS FOR NOTICES

The parties designate as their addresses for all legal, administrative, and notification purposes those indicated in this Client Registration form. Such addresses shall be deemed valid until written notice of any change of address is provided to the other party.

VIII. DOCUMENT PRECEDENCE

In the event of any discrepancy or conflict between this Client Registration Agreement and any service order, operational instruction, email, verbal communication, or subsequent document, the terms and conditions established in this document shall prevail at all times, unless otherwise expressly agreed in writing and signed by both parties.

IX. GOVERNING LAW AND JURISDICTION

This Agreement shall be governed by and construed in accordance with the laws of the State of Texas, United States of America. Any disputes arising out of or relating to this Agreement shall be subject to the exclusive jurisdiction of the state and federal courts located in Harris County, Texas, and the parties hereby consent to the personal jurisdiction of such courts and waive any objection to venue therein.

For cross-border transportation services involving Canada, applicable provisions of the Canada Transportation Act and relevant provincial regulations shall apply to the extent required by law.

───────────────────────────────────────────────────────────────────────────────

BY ELECTRONICALLY SIGNING THIS DOCUMENT, THE CUSTOMER EXPRESSLY CONSENTS TO AND FULLY ACCEPTS ALL TERMS AND CONDITIONS SET FORTH HEREIN.
`;

// ═══════════════════════════════════════════════════════════════════════════
// TEXTO DEL AVISO DE PRIVACIDAD
// ═══════════════════════════════════════════════════════════════════════════
const AVISO_PRIVACIDAD_MX = `
AVISO DE PRIVACIDAD INTEGRAL

GRUPO LOMA y sus empresas subsidiarias (TROB Transportes S.A. de C.V., WExpress S.A. de C.V., Speedy Haul Inc., TROB USA LLC), con domicilio en Blvd. José María Chávez No. 1805, Col. Circunvalación Norte, C.P. 20020, Aguascalientes, Ags., México, es responsable del tratamiento de sus datos personales.

DATOS PERSONALES RECABADOS: Datos de identificación (nombre, RFC, CURP, INE), datos de contacto (domicilio, teléfono, correo electrónico), datos fiscales (constancia de situación fiscal, opinión de cumplimiento), datos financieros (información bancaria para pagos), datos de representación legal (actas constitutivas, poderes notariales).

FINALIDADES: Prestación de servicios de transporte y logística, elaboración de contratos y facturación, cumplimiento de obligaciones fiscales, evaluación crediticia y cobranza, envío de comunicaciones relacionadas con nuestros servicios.

DERECHOS ARCO: Puede ejercer sus derechos de Acceso, Rectificación, Cancelación u Oposición enviando solicitud a: privacidad@trob.com.mx

TRANSFERENCIA DE DATOS: Sus datos podrán ser transferidos a empresas subsidiarias del Grupo Loma, autoridades fiscales y entidades financieras.

Al proporcionar sus datos y firmar digitalmente, usted consiente el tratamiento de sus datos personales conforme a este aviso.
`;

const PRIVACY_NOTICE_EN = `
PRIVACY NOTICE

GRUPO LOMA and its subsidiaries (TROB Transportes S.A. de C.V., WExpress S.A. de C.V., Speedy Haul Inc., TROB USA LLC), located at Blvd. José María Chávez No. 1805, Col. Circunvalación Norte, C.P. 20020, Aguascalientes, Ags., Mexico, is responsible for the processing of your personal data.

PERSONAL DATA COLLECTED: Identification data (name, Tax ID, government-issued ID), contact data (address, phone, email), tax data (tax status certificates), financial data (banking information for payments), legal representation data (articles of incorporation, powers of attorney).

PURPOSES: Provision of transportation and logistics services, contract preparation and invoicing, tax compliance, credit evaluation and collection, service-related communications.

YOUR RIGHTS: You may exercise your rights of Access, Rectification, Cancellation, or Opposition by sending a request to: privacy@trob.com.mx

DATA TRANSFERS: Your data may be transferred to Grupo Loma subsidiaries, tax authorities, and financial institutions as required by law.

By providing your data and signing digitally, you consent to the processing of your personal data in accordance with this notice.
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { solicitudId, idioma = "es" } = await req.json();
    
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);
    
    // Obtener datos de la solicitud
    const { data: solicitud, error } = await supabase
      .from("alta_clientes")
      .select("*")
      .eq("id", solicitudId)
      .single();
    
    if (error || !solicitud) {
      throw new Error("Solicitud no encontrada");
    }

    const esIngles = idioma === "en" || solicitud.tipo_empresa === "USA_CANADA";
    const clausulas = esIngles ? CLAUSULAS_USA_EN : CLAUSULAS_MX;
    const avisoPrivacidad = esIngles ? PRIVACY_NOTICE_EN : AVISO_PRIVACIDAD_MX;

    // ═══════════════════════════════════════════════════════════════════════════
    // GENERAR CONTENIDO DEL PDF
    // ═══════════════════════════════════════════════════════════════════════════
    const titulo = esIngles ? "CLIENT REGISTRATION AGREEMENT" : "ALTA DE CLIENTE";
    const subtitulo = esIngles ? "REGISTRATION FORMAT MX-USA 2026" : "FORMATO DE REGISTRO MX-USA 2026";
    
    const fechaFirma = solicitud.firma_fecha 
      ? new Date(solicitud.firma_fecha).toLocaleString(esIngles ? "en-US" : "es-MX", { 
          timeZone: "America/Mexico_City",
          year: "numeric", month: "2-digit", day: "2-digit",
          hour: "2-digit", minute: "2-digit", second: "2-digit"
        })
      : "";

    // Crear HTML para el PDF
    const htmlContent = `
<!DOCTYPE html>
<html lang="${esIngles ? 'en' : 'es'}">
<head>
  <meta charset="UTF-8">
  <style>
    @page { size: letter; margin: 1in 0.75in; }
    body { font-family: Arial, sans-serif; font-size: 10pt; line-height: 1.4; color: #333; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #fe5000; padding-bottom: 15px; margin-bottom: 20px; }
    .logo { font-size: 24pt; font-weight: bold; color: #001f4d; }
    .logo span { color: #fe5000; }
    .title { text-align: right; }
    .title h1 { font-size: 18pt; color: #001f4d; margin: 0; }
    .title h2 { font-size: 11pt; color: #fe5000; margin: 5px 0 0 0; font-weight: normal; }
    .section { margin-bottom: 20px; }
    .section-title { background: linear-gradient(90deg, #fe5000, #ff7b00); color: white; padding: 8px 15px; font-weight: bold; font-size: 11pt; margin-bottom: 10px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
    .field { margin-bottom: 8px; }
    .field-label { font-size: 8pt; color: #666; text-transform: uppercase; }
    .field-value { font-size: 10pt; font-weight: 500; border-bottom: 1px solid #ddd; padding: 2px 0; min-height: 14px; }
    .contact-box { background: #f8f9fa; border: 1px solid #e0e0e0; border-radius: 5px; padding: 10px; margin-bottom: 10px; }
    .contact-title { font-weight: bold; color: #fe5000; font-size: 10pt; margin-bottom: 8px; }
    .signature-box { background: #001f4d; color: white; padding: 15px; border-radius: 5px; margin-top: 20px; }
    .signature-title { color: #fe5000; font-weight: bold; text-align: center; margin-bottom: 10px; }
    .signature-name { font-size: 14pt; font-weight: bold; text-align: center; }
    .signature-details { font-size: 8pt; margin-top: 10px; }
    .legal-section { font-size: 9pt; text-align: justify; margin-top: 20px; }
    .legal-section h3 { color: #001f4d; font-size: 10pt; margin-top: 15px; }
    .footer { text-align: center; font-size: 8pt; color: #666; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 10px; }
    .page-break { page-break-before: always; }
    .checkbox { display: inline-block; width: 12px; height: 12px; border: 1px solid #333; margin-right: 5px; vertical-align: middle; }
    .checkbox.checked { background: #fe5000; }
  </style>
</head>
<body>
  <!-- PÁGINA 1 -->
  <div class="header">
    <div class="logo">GRUPO<span>LOMA</span></div>
    <div class="title">
      <h1>${titulo}</h1>
      <h2>${subtitulo}</h2>
    </div>
  </div>

  <!-- DATOS DE LA EMPRESA -->
  <div class="section">
    <div class="section-title">${esIngles ? 'COMPANY INFORMATION' : 'DATOS DE LA EMPRESA'}</div>
    <div class="grid">
      <div class="field">
        <div class="field-label">${esIngles ? 'Company Name' : 'Razón Social'}</div>
        <div class="field-value">${solicitud.razon_social || ''}</div>
      </div>
      <div class="field">
        <div class="field-label">${esIngles ? 'Tax ID' : 'RFC'}</div>
        <div class="field-value">${solicitud.rfc_mc || ''}</div>
      </div>
    </div>
    <div class="field">
      <div class="field-label">${esIngles ? 'Address' : 'Dirección'}</div>
      <div class="field-value">${solicitud.direccion_completa || ''}</div>
    </div>
    <div class="grid-3">
      <div class="field">
        <div class="field-label">${esIngles ? 'Business Activity' : 'Giro'}</div>
        <div class="field-value">${solicitud.giro || ''}</div>
      </div>
      <div class="field">
        <div class="field-label">${esIngles ? 'Website' : 'Página Web'}</div>
        <div class="field-value">${solicitud.pagina_web || ''}</div>
      </div>
      <div class="field">
        <div class="field-label">WhatsApp</div>
        <div class="field-value">${solicitud.whatsapp || ''}</div>
      </div>
    </div>
  </div>

  <!-- DATOS BANCARIOS -->
  <div class="section">
    <div class="section-title">${esIngles ? 'BANKING INFORMATION' : 'DATOS BANCARIOS'}</div>
    <div class="grid-3">
      <div class="field">
        <div class="field-label">${esIngles ? 'Bank' : 'Banco'}</div>
        <div class="field-value">${solicitud.contacto_admin_banco || ''}</div>
      </div>
      <div class="field">
        <div class="field-label">${esIngles ? 'CLABE/Routing' : 'CLABE/Routing'}</div>
        <div class="field-value">${solicitud.contacto_admin_clabe || ''}</div>
      </div>
      <div class="field">
        <div class="field-label">${esIngles ? 'Payment Method' : 'Forma de Pago'}</div>
        <div class="field-value">${solicitud.forma_pago || ''}</div>
      </div>
    </div>
  </div>

  <!-- CONTACTOS -->
  <div class="section">
    <div class="section-title">${esIngles ? 'CONTACTS' : 'CONTACTOS'}</div>
    
    <div class="grid">
      <div class="contact-box">
        <div class="contact-title">${esIngles ? 'INVOICING CONTACT' : 'CONTACTO ENVÍO DE FACTURAS'}</div>
        <div class="grid">
          <div class="field">
            <div class="field-label">${esIngles ? 'Name' : 'Nombre'}</div>
            <div class="field-value">${solicitud.contacto_facturas_nombre || ''}</div>
          </div>
          <div class="field">
            <div class="field-label">${esIngles ? 'Department' : 'Depto'}</div>
            <div class="field-value">${solicitud.contacto_facturas_depto || ''}</div>
          </div>
        </div>
        <div class="field">
          <div class="field-label">Email</div>
          <div class="field-value">${solicitud.contacto_facturas_email || ''}</div>
        </div>
        <div class="field">
          <div class="field-label">${esIngles ? 'Phone' : 'Teléfono'}</div>
          <div class="field-value">${solicitud.contacto_facturas_tel || ''}</div>
        </div>
      </div>

      <div class="contact-box">
        <div class="contact-title">${esIngles ? 'OPERATIONS CONTACT (SHIPPING)' : 'CONTACTO OPERATIVO (EMBARQUES)'}</div>
        <div class="grid">
          <div class="field">
            <div class="field-label">${esIngles ? 'Name' : 'Nombre'}</div>
            <div class="field-value">${solicitud.contacto_op1_nombre || ''}</div>
          </div>
          <div class="field">
            <div class="field-label">${esIngles ? 'Department' : 'Depto'}</div>
            <div class="field-value">${solicitud.contacto_op1_depto || ''}</div>
          </div>
        </div>
        <div class="field">
          <div class="field-label">Email</div>
          <div class="field-value">${solicitud.contacto_op1_email || ''}</div>
        </div>
        <div class="field">
          <div class="field-label">${esIngles ? 'Phone' : 'Teléfono'}</div>
          <div class="field-value">${solicitud.contacto_op1_tel || ''}</div>
        </div>
      </div>
    </div>
  </div>

  <!-- PÁGINA 2 -->
  <div class="page-break"></div>
  
  <div class="header">
    <div class="logo">GRUPO<span>LOMA</span></div>
    <div class="title">
      <h1>${titulo}</h1>
      <h2>${subtitulo}</h2>
    </div>
  </div>

  <!-- REFERENCIAS COMERCIALES -->
  <div class="section">
    <div class="section-title">${esIngles ? 'COMMERCIAL REFERENCES (CARRIERS)' : 'REFERENCIAS COMERCIALES (TRANSPORTISTAS)'}</div>
    
    <div class="contact-box">
      <div class="contact-title">${esIngles ? 'REFERENCE' : 'REFERENCIA'} 1</div>
      <div class="grid">
        <div class="field">
          <div class="field-label">${esIngles ? 'Company' : 'Razón Social'}</div>
          <div class="field-value">${solicitud.ref1_empresa || ''}</div>
        </div>
        <div class="field">
          <div class="field-label">${esIngles ? 'Contact' : 'Contacto'}</div>
          <div class="field-value">${solicitud.ref1_contacto || ''}</div>
        </div>
      </div>
      <div class="grid-3">
        <div class="field">
          <div class="field-label">WhatsApp</div>
          <div class="field-value">${solicitud.ref1_whatsapp || ''}</div>
        </div>
        <div class="field">
          <div class="field-label">Email</div>
          <div class="field-value">${solicitud.ref1_email || ''}</div>
        </div>
        <div class="field">
          <div class="field-label">${esIngles ? 'Years' : 'Años'}</div>
          <div class="field-value">${solicitud.ref1_anos || ''}</div>
        </div>
      </div>
    </div>

    <div class="contact-box">
      <div class="contact-title">${esIngles ? 'REFERENCE' : 'REFERENCIA'} 2</div>
      <div class="grid">
        <div class="field">
          <div class="field-label">${esIngles ? 'Company' : 'Razón Social'}</div>
          <div class="field-value">${solicitud.ref2_empresa || ''}</div>
        </div>
        <div class="field">
          <div class="field-label">${esIngles ? 'Contact' : 'Contacto'}</div>
          <div class="field-value">${solicitud.ref2_contacto || ''}</div>
        </div>
      </div>
    </div>

    <div class="contact-box">
      <div class="contact-title">${esIngles ? 'REFERENCE' : 'REFERENCIA'} 3</div>
      <div class="grid">
        <div class="field">
          <div class="field-label">${esIngles ? 'Company' : 'Razón Social'}</div>
          <div class="field-value">${solicitud.ref3_empresa || ''}</div>
        </div>
        <div class="field">
          <div class="field-label">${esIngles ? 'Contact' : 'Contacto'}</div>
          <div class="field-value">${solicitud.ref3_contacto || ''}</div>
        </div>
      </div>
    </div>
  </div>

  <!-- PROCESO DE FACTURACIÓN -->
  <div class="section">
    <div class="section-title">${esIngles ? 'BILLING PROCESS' : 'PROCESO DE FACTURACIÓN/PAGO'}</div>
    <div class="field">
      <div class="field-value" style="min-height: 60px; white-space: pre-wrap;">${solicitud.proceso_facturacion || ''}</div>
    </div>
  </div>

  <!-- PÁGINA 3 - CLÁUSULAS LEGALES -->
  <div class="page-break"></div>
  
  <div class="header">
    <div class="logo">GRUPO<span>LOMA</span></div>
    <div class="title">
      <h1>${titulo}</h1>
      <h2>${esIngles ? 'LEGAL TERMS AND CONDITIONS' : 'TÉRMINOS Y CONDICIONES LEGALES'}</h2>
    </div>
  </div>

  <div class="legal-section">
    <h3>I. ${esIngles ? 'GENERAL CONDITIONS' : 'CONDICIONES GENERALES'}</h3>
    <p>${esIngles 
      ? 'The Customer agrees to contract freight transportation services with GRUPO LOMA | TROB TRANSPORTES under the terms established in this document and applicable legal provisions.'
      : 'El Cliente acepta contratar servicios de transporte de carga con GRUPO LOMA | TROB TRANSPORTES bajo los términos establecidos en este documento y las disposiciones legales aplicables.'
    }</p>

    <h3>II. ${esIngles ? 'RATES AND PAYMENTS' : 'TARIFAS Y PAGOS'}</h3>
    <p>${esIngles
      ? 'Rates will be quoted per service according to route, type of cargo, and service modality. Payment terms will be agreed upon for each operation.'
      : 'Las tarifas serán cotizadas por servicio según ruta, tipo de carga y modalidad de servicio. Los plazos de pago serán acordados para cada operación.'
    }</p>

    <h3>III. ${esIngles ? 'LIABILITY' : 'RESPONSABILIDAD'}</h3>
    <p>${esIngles
      ? 'GRUPO LOMA | TROB TRANSPORTES shall be liable for damages to cargo under the terms of applicable law and the conditions of the cargo insurance contracted.'
      : 'GRUPO LOMA | TROB TRANSPORTES será responsable por daños a la carga en los términos de la ley aplicable y las condiciones del seguro de carga contratado.'
    }</p>

    ${clausulas}
  </div>

  <!-- FIRMA ELECTRÓNICA -->
  <div class="signature-box">
    <div class="signature-title">${esIngles ? 'ELECTRONICALLY SIGNED' : 'FIRMADO ELECTRÓNICAMENTE'}</div>
    <div class="signature-name">${solicitud.firma_nombre || ''}</div>
    <div class="signature-details">
      <div>${esIngles ? 'Date' : 'Fecha'}: ${fechaFirma}</div>
      <div>IP: ${solicitud.firma_ip || 'Registered'}</div>
      <div>${solicitud.firma_navegador || ''}</div>
      <div style="font-size: 7pt; margin-top: 5px; color: #aaa;">
        ${esIngles 
          ? 'In accordance with the E-SIGN Act and UETA'
          : 'Conforme a la Ley de Firma Electrónica Avanzada'
        }
      </div>
    </div>
  </div>

  <!-- AVISO DE PRIVACIDAD -->
  <div class="page-break"></div>
  
  <div class="header">
    <div class="logo">GRUPO<span>LOMA</span></div>
    <div class="title">
      <h1>${esIngles ? 'PRIVACY NOTICE' : 'AVISO DE PRIVACIDAD'}</h1>
    </div>
  </div>

  <div class="legal-section">
    ${avisoPrivacidad.split('\n').map(p => p.trim() ? `<p>${p}</p>` : '').join('')}
  </div>

  <div class="footer">
    <p>GRUPO LOMA | TROB TRANSPORTES &nbsp;&nbsp;•&nbsp;&nbsp; ${esIngles ? 'Page' : 'Página'} 4 ${esIngles ? 'of' : 'de'} 4 &nbsp;&nbsp;•&nbsp;&nbsp; www.trobtransportes.com</p>
    <p>© 2026 Grupo Loma - ${esIngles ? 'All rights reserved' : 'Todos los derechos reservados'}</p>
  </div>
</body>
</html>
    `;

    // Guardar HTML en storage para conversión posterior
    const htmlFileName = `${solicitudId}/solicitud_${idioma}.html`;
    const htmlBlob = new Blob([htmlContent], { type: "text/html" });
    
    await supabase.storage
      .from("alta-documentos")
      .upload(htmlFileName, htmlBlob, { upsert: true, contentType: "text/html" });

    // Actualizar BD con referencia al PDF
    await supabase.from("alta_clientes").update({
      pdf_solicitud: htmlFileName,
      pdf_generado_fecha: new Date().toISOString(),
    }).eq("id", solicitudId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        pdfPath: htmlFileName,
        message: esIngles ? "PDF generated successfully" : "PDF generado exitosamente"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generando PDF:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
