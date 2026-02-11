// ═══════════════════════════════════════════════════════════════════════════
// Edge Function: enviar-correo-alta (COMPLETA)
// 5 casos de correo para el flujo de Alta de Clientes
// Ubicación: supabase/functions/enviar-correo-alta/index.ts
// ACTUALIZADO 11-FEB-2026: Links públicos para asignar CxC
// ═══════════════════════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const RESEND_API_KEY = 're_4zCzGpfh_BrRuEinLAHVxms2kNqetqNkP';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════════════════

const LOGO_GRUPO_LOMA = 'https://www.jjcrm27.com/logo-grupo-loma-blanco.png';
const LOGOS_EMPRESA: Record<string, string> = {
  'TROB': 'https://www.jjcrm27.com/logo-trob-blanco.png',
  'WE': 'https://www.jjcrm27.com/logo-we-blanco.png',
  'SHI': 'https://www.jjcrm27.com/logo-shi-blanco.png',
  'TROB_USA': 'https://www.jjcrm27.com/logo-trob-usa-blanco.png',
};

const COLORS = {
  azulCorporativo: '#001f4d',
  naranja: '#fe5000',
  verde: '#22c55e',
  textoOscuro: '#1e293b',
  textoGris: '#64748b'
};

// Directorio de Escalación
const DIRECTORIO_ESCALACION = [
  { rol: 'Gerente CxC', nombre: 'Claudia Priana', email: 'claudia.priana@trob.com.mx', tel: '449 243 2684' },
  { rol: 'Gerente Administración', nombre: 'Martha Velasco', email: 'martha.velasco@trob.com.mx', tel: '449 155 7688' },
  { rol: 'Gerente Operaciones', nombre: 'Israel González', email: 'israel.gonzalez@trob.com.mx', tel: '449 273 6726' },
  { rol: 'Operaciones IMPEX', nombre: 'Daniel González', email: 'daniel.gonzalez@trob.com.mx', tel: '449 352 2883' },
  { rol: 'Gerente Comercial', nombre: 'Juan Viveros', email: 'juan.viveros@trob.com.mx', tel: '811 239 2266' },
  { rol: 'Seguimiento 24/7', nombre: 'Centro de Control', email: 'seguimiento.ags@trob.com.mx', tel: '449 274 1968' },
];

// ═══════════════════════════════════════════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════════════════════════════════════════

const detectarGenero = (nombre: string): 'M' | 'F' => {
  if (!nombre) return 'M';
  const primerNombre = nombre.trim().split(' ')[0].toLowerCase();
  const nombresFemeninos = ['carmen', 'dolores', 'mercedes', 'pilar', 'rocio', 'beatriz', 'raquel', 'isabel', 'ines', 'marisol', 'elizabeth', 'lizeth', 'jennifer', 'nancy', 'isis', 'paloma', 'claudia', 'martha', 'fernanda', 'karla', 'diana', 'norma'];
  const excepcionesMasculinas = ['josema', 'garcia', 'borja', 'nikita'];

  if (nombresFemeninos.includes(primerNombre)) return 'F';
  if (excepcionesMasculinas.includes(primerNombre)) return 'M';
  if (primerNombre.endsWith('a')) return 'F';
  return 'M';
};

const getSaludo = (nombre: string) => {
  if (!nombre) return '';
  const genero = detectarGenero(nombre);
  return `${genero === 'F' ? 'Estimada' : 'Estimado'} ${nombre},`;
};

// Template base HTML
const templateBase = (content: string, titulo: string, empresa?: string) => {
  const logoEmpresa = empresa ? (LOGOS_EMPRESA[empresa] || LOGOS_EMPRESA['TROB']) : LOGOS_EMPRESA['TROB'];

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, sans-serif; background-color: #f1f5f9;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 15px 5px;">
    <tr>
      <td align="center">
        <table width="700" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${COLORS.azulCorporativo} 0%, #003366 100%); padding: 20px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50%" align="left" valign="middle">
                    <img src="${LOGO_GRUPO_LOMA}" alt="Grupo Loma" height="45" style="display: block;">
                  </td>
                  <td width="50%" align="right" valign="middle">
                    <span style="color: #ffffff; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">${titulo}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Contenido -->
          <tr>
            <td style="padding: 25px 30px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #f8fafc; padding: 15px 30px; border-top: 1px solid #e2e8f0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="color: ${COLORS.azulCorporativo}; font-size: 11px; font-weight: 600; margin: 0;">Grupo Loma Transportes</p>
                    <p style="color: ${COLORS.textoGris}; font-size: 10px; margin: 2px 0 0 0;">Sistema FX27 - Alta de Clientes</p>
                  </td>
                  <td style="text-align: right;">
                    <p style="color: ${COLORS.textoGris}; font-size: 9px; margin: 0;">© 2026 Grupo Loma</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

// Función para enviar correo
const enviarCorreo = async (to: string[], subject: string, html: string) => {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'Grupo Loma <no-reply@mail.jjcrm27.com>',
      to,
      subject,
      html
    })
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Error enviando correo');
  }
  return result;
};

// ═══════════════════════════════════════════════════════════════════════════
// CASO 0: SOLICITUD_CLIENTE
// Trigger: Usuario FX27 crea solicitud
// Destino: Cliente
// ═══════════════════════════════════════════════════════════════════════════

const emailSolicitudCliente = (data: any) => {
  const saludo = getSaludo(data.nombreContacto);
  const logoEmpresa = LOGOS_EMPRESA[data.empresaFacturadora] || LOGOS_EMPRESA['TROB'];

  const content = `
    ${saludo ? `<p style="color: ${COLORS.textoGris}; font-size: 13px; margin: 0 0 10px 0;">${saludo}</p>` : ''}

    <h1 style="color: ${COLORS.azulCorporativo}; font-size: 22px; font-weight: 700; margin: 0 0 15px 0;">
      Bienvenido a Grupo Loma
    </h1>

    <p style="color: ${COLORS.textoOscuro}; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
      Hemos recibido su solicitud para iniciar relación comercial. Para continuar con el proceso de alta,
      por favor complete el siguiente formulario con la documentación requerida.
    </p>

    <div style="text-align: center; margin: 25px 0;">
      <a href="${data.linkFormulario}"
         style="display: inline-block; background: linear-gradient(135deg, ${COLORS.naranja} 0%, #cc4000 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-size: 14px; font-weight: 700;">
        COMPLETAR FORMULARIO →
      </a>
    </div>

    <div style="background: #fffbeb; border: 1px solid #fcd34d; border-radius: 6px; padding: 15px; margin-top: 20px;">
      <p style="color: #92400e; font-size: 12px; font-weight: 700; margin: 0 0 10px 0;">📋 DOCUMENTACIÓN REQUERIDA:</p>
      <ul style="color: ${COLORS.textoOscuro}; font-size: 12px; line-height: 1.8; margin: 0; padding-left: 20px;">
        <li>Constancia de Situación Fiscal (mes actual)</li>
        <li>Opinión de Cumplimiento SAT</li>
        <li>Comprobante de domicilio</li>
        <li>INE del Representante Legal</li>
        <li>Acta Constitutiva</li>
        <li>Carátula bancaria</li>
      </ul>
    </div>

    <p style="color: ${COLORS.textoGris}; font-size: 11px; margin: 20px 0 0 0; text-align: center;">
      🔒 Sus datos serán tratados con absoluta confidencialidad
    </p>
  `;

  return templateBase(content, 'ALTA COMERCIAL', data.empresaFacturadora);
};

// ═══════════════════════════════════════════════════════════════════════════
// CASO 1: CLIENTE_COMPLETO
// Trigger: Cliente termina formulario público
// Destino: Juan Viveros
// ═══════════════════════════════════════════════════════════════════════════

const emailClienteCompleto = (data: any) => {
  const content = `
    <div style="background: linear-gradient(135deg, #dbeafe 0%, #e0f2fe 100%); border-radius: 8px; padding: 20px; margin-bottom: 20px;">
      <h2 style="color: ${COLORS.azulCorporativo}; font-size: 18px; margin: 0 0 5px 0;">
        📥 Nueva Solicitud de Alta
      </h2>
      <p style="color: ${COLORS.textoGris}; font-size: 13px; margin: 0;">
        Un cliente ha completado el formulario de alta comercial
      </p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
          <span style="color: ${COLORS.textoGris}; font-size: 12px;">Razón Social:</span><br>
          <span style="color: ${COLORS.textoOscuro}; font-size: 15px; font-weight: 600;">${data.razonSocial || '-'}</span>
        </td>
      </tr>
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
          <span style="color: ${COLORS.textoGris}; font-size: 12px;">RFC:</span><br>
          <span style="color: ${COLORS.textoOscuro}; font-size: 15px; font-weight: 600;">${data.rfc || '-'}</span>
        </td>
      </tr>
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
          <span style="color: ${COLORS.textoGris}; font-size: 12px;">Contacto:</span><br>
          <span style="color: ${COLORS.textoOscuro}; font-size: 15px; font-weight: 600;">${data.nombreContacto || '-'}</span>
        </td>
      </tr>
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
          <span style="color: ${COLORS.textoGris}; font-size: 12px;">Email:</span><br>
          <span style="color: ${COLORS.textoOscuro}; font-size: 15px;">${data.emailCliente || '-'}</span>
        </td>
      </tr>
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
          <span style="color: ${COLORS.textoGris}; font-size: 12px;">Teléfono:</span><br>
          <span style="color: ${COLORS.textoOscuro}; font-size: 15px;">${data.telefono || '-'}</span>
        </td>
      </tr>
      <tr>
        <td style="padding: 10px 0;">
          <span style="color: ${COLORS.textoGris}; font-size: 12px;">Empresa que facturará:</span><br>
          <span style="color: ${COLORS.textoOscuro}; font-size: 15px; font-weight: 600;">${data.empresaFacturadora || 'Por definir'}</span>
        </td>
      </tr>
    </table>

    <div style="text-align: center;">
      <a href="https://www.jjcrm27.com/servicio-clientes"
         style="display: inline-block; background: linear-gradient(135deg, ${COLORS.naranja} 0%, #cc4000 100%); color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-size: 13px; font-weight: 700;">
        REVISAR Y ASIGNAR CSR →
      </a>
    </div>

    <p style="color: ${COLORS.textoGris}; font-size: 11px; margin: 15px 0 0 0; text-align: center;">
      Siguiente paso: Validar información y asignar ejecutivo de Servicio a Clientes
    </p>
  `;

  return templateBase(content, 'SOLICITUD RECIBIDA', data.empresaFacturadora);
};

// ═══════════════════════════════════════════════════════════════════════════
// CASO 1B: EN_REVISION (en_revision) — FLUJO PARALELO
// Trigger: Cliente completó formulario público
// Destino: Juan Viveros (CSR + Pago) + Claudia Priana (CxC) — SIMULTÁNEO
// ACTUALIZADO: Link de Claudia ahora es PÚBLICO con solicitudId
// ═══════════════════════════════════════════════════════════════════════════

const emailEnRevision = (data: any, destinatario: 'juan' | 'claudia') => {
  const accion = destinatario === 'juan'
    ? 'Asignar CSR y Tipo de Pago'
    : 'Asignar Ejecutivo de Cobranza (CxC)';
  const botonTexto = destinatario === 'juan'
    ? 'REVISAR Y ASIGNAR CSR →'
    : 'ASIGNAR EJECUTIVO CXC →';
  // CAMBIO CLAVE: Link público con solicitudId para Claudia
  const linkDestino = destinatario === 'juan'
    ? 'https://www.jjcrm27.com/servicio-clientes'
    : `https://www.jjcrm27.com/asignar-cxc/${data.solicitudId}`;

  const content = `
    <div style="background: linear-gradient(135deg, #dbeafe 0%, #e0f2fe 100%); border-radius: 8px; padding: 20px; margin-bottom: 20px;">
      <h2 style="color: ${COLORS.azulCorporativo}; font-size: 18px; margin: 0 0 5px 0;">
        📥 Nueva Solicitud de Alta — En Revisión
      </h2>
      <p style="color: ${COLORS.textoGris}; font-size: 13px; margin: 0;">
        Un cliente ha completado el formulario. Tu acción: <strong>${accion}</strong>
      </p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
          <span style="color: ${COLORS.textoGris}; font-size: 12px;">Razón Social:</span><br>
          <span style="color: ${COLORS.textoOscuro}; font-size: 15px; font-weight: 600;">${data.razonSocial || '-'}</span>
        </td>
      </tr>
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
          <span style="color: ${COLORS.textoGris}; font-size: 12px;">Empresa Facturadora:</span><br>
          <span style="color: ${COLORS.textoOscuro}; font-size: 15px; font-weight: 600;">${data.empresaFacturadora || 'Por definir'}</span>
        </td>
      </tr>
    </table>

    <div style="background: #fffbeb; border: 1px solid #fbbf24; border-radius: 6px; padding: 12px; margin-bottom: 20px;">
      <p style="color: #92400e; font-size: 12px; margin: 0;">
        ⚡ Este flujo es paralelo. ${destinatario === 'juan' ? 'Claudia también fue notificada para asignar CxC.' : 'Juan también fue notificado para asignar CSR y tipo de pago.'}
        Cuando ambos completen su parte, Nancy será notificada para confirmar.
      </p>
    </div>

    <div style="text-align: center;">
      <a href="${linkDestino}"
         style="display: inline-block; background: linear-gradient(135deg, ${COLORS.naranja} 0%, #cc4000 100%); color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-size: 13px; font-weight: 700;">
        ${botonTexto}
      </a>
    </div>
  `;

  return templateBase(content, 'EN REVISIÓN', data.empresaFacturadora);
};

// ═══════════════════════════════════════════════════════════════════════════
// CASO 2: PENDIENTE_CXC (asignar_cobranza)
// Trigger: Juan Viveros asigna CSR + tipo pago
// Destino: CSR asignado + Claudia Priana + Martha Velasco
// ACTUALIZADO: Link de gerencia ahora es PÚBLICO con solicitudId
// ═══════════════════════════════════════════════════════════════════════════

const emailPendienteCxC = (data: any, destinatario: 'csr' | 'gerencia') => {
  const tipoPagoLabel = data.tipoPago === 'CREDITO'
    ? `Crédito a ${data.diasCredito || 30} días`
    : 'Prepago';

  const tipoPagoColor = data.tipoPago === 'CREDITO' ? COLORS.verde : '#3b82f6';

  if (destinatario === 'csr') {
    // Correo al CSR asignado
    const saludo = getSaludo(data.csrNombre);
    const content = `
      ${saludo ? `<p style="color: ${COLORS.textoGris}; font-size: 13px; margin: 0 0 10px 0;">${saludo}</p>` : ''}

      <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h2 style="color: #166534; font-size: 18px; margin: 0 0 5px 0;">
          ✅ Se te ha asignado un nuevo cliente
        </h2>
        <p style="color: #166534; font-size: 13px; margin: 0;">
          Juan Viveros te asignó como ejecutivo de Servicio a Clientes
        </p>
      </div>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
            <span style="color: ${COLORS.textoGris}; font-size: 12px;">Cliente:</span><br>
            <span style="color: ${COLORS.textoOscuro}; font-size: 16px; font-weight: 700;">${data.razonSocial}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
            <span style="color: ${COLORS.textoGris}; font-size: 12px;">RFC:</span><br>
            <span style="color: ${COLORS.textoOscuro}; font-size: 14px;">${data.rfc || '-'}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
            <span style="color: ${COLORS.textoGris}; font-size: 12px;">Contacto Principal:</span><br>
            <span style="color: ${COLORS.textoOscuro}; font-size: 14px;">${data.nombreContacto || '-'} | ${data.emailCliente || '-'}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0;">
            <span style="color: ${COLORS.textoGris}; font-size: 12px;">Condiciones de Pago:</span><br>
            <span style="color: ${tipoPagoColor}; font-size: 16px; font-weight: 700;">${tipoPagoLabel}</span>
          </td>
        </tr>
      </table>

      <p style="color: ${COLORS.textoGris}; font-size: 12px; margin: 0;">
        El equipo de Cobranza asignará próximamente al ejecutivo CxC para completar el alta.
      </p>
    `;
    return templateBase(content, 'CLIENTE ASIGNADO', data.empresaFacturadora);

  } else {
    // Correo a Claudia y Martha (gerencia CxC) — LINK PÚBLICO
    const content = `
      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h2 style="color: #92400e; font-size: 18px; margin: 0 0 5px 0;">
          ⏳ Pendiente: Asignar Ejecutivo CxC
        </h2>
        <p style="color: #92400e; font-size: 13px; margin: 0;">
          Juan Viveros asignó CSR. Falta asignar ejecutivo de Cobranza.
        </p>
      </div>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
            <span style="color: ${COLORS.textoGris}; font-size: 12px;">Cliente:</span><br>
            <span style="color: ${COLORS.textoOscuro}; font-size: 16px; font-weight: 700;">${data.razonSocial}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
            <span style="color: ${COLORS.textoGris}; font-size: 12px;">RFC:</span><br>
            <span style="color: ${COLORS.textoOscuro}; font-size: 14px;">${data.rfc || '-'}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
            <span style="color: ${COLORS.textoGris}; font-size: 12px;">CSR Asignado:</span><br>
            <span style="color: #7c3aed; font-size: 14px; font-weight: 600;">${data.csrNombre} (${data.csrEmail})</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0;">
            <span style="color: ${COLORS.textoGris}; font-size: 12px;">Condiciones de Pago:</span><br>
            <span style="color: ${tipoPagoColor}; font-size: 16px; font-weight: 700;">${tipoPagoLabel}</span>
          </td>
        </tr>
      </table>

      <div style="text-align: center;">
        <a href="https://www.jjcrm27.com/asignar-cxc/${data.solicitudId}"
           style="display: inline-block; background: linear-gradient(135deg, ${COLORS.naranja} 0%, #cc4000 100%); color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-size: 13px; font-weight: 700;">
          ASIGNAR EJECUTIVO CXC →
        </a>
      </div>
    `;
    return templateBase(content, 'PENDIENTE CXC', data.empresaFacturadora);
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// CASO 3: PENDIENTE_CONFIRMACION
// Trigger: Claudia/Martha asigna ejecutivo CxC
// Destino: Nancy Alonso
// ═══════════════════════════════════════════════════════════════════════════

const emailPendienteConfirmacion = (data: any) => {
  const tipoPagoLabel = data.tipoPago === 'CREDITO'
    ? `Crédito a ${data.diasCredito || 30} días`
    : 'Prepago';

  const content = `
    <p style="color: ${COLORS.textoGris}; font-size: 13px; margin: 0 0 10px 0;">Estimada Nancy,</p>

    <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 8px; padding: 20px; margin-bottom: 20px;">
      <h2 style="color: #92400e; font-size: 18px; margin: 0 0 5px 0;">
        🔔 Alta Lista para Confirmación
      </h2>
      <p style="color: #92400e; font-size: 13px; margin: 0;">
        El cliente ya tiene CSR y CxC asignados. Falta tu confirmación final.
      </p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
          <span style="color: ${COLORS.textoGris}; font-size: 12px;">Cliente:</span><br>
          <span style="color: ${COLORS.textoOscuro}; font-size: 16px; font-weight: 700;">${data.razonSocial}</span>
        </td>
      </tr>
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
          <span style="color: ${COLORS.textoGris}; font-size: 12px;">RFC:</span><br>
          <span style="color: ${COLORS.textoOscuro}; font-size: 14px;">${data.rfc || '-'}</span>
        </td>
      </tr>
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
          <span style="color: ${COLORS.textoGris}; font-size: 12px;">Servicio a Clientes (CSR):</span><br>
          <span style="color: #7c3aed; font-size: 14px; font-weight: 600;">${data.csrNombre}</span>
        </td>
      </tr>
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
          <span style="color: ${COLORS.textoGris}; font-size: 12px;">Cobranza (CxC):</span><br>
          <span style="color: #059669; font-size: 14px; font-weight: 600;">${data.cxcNombre}</span>
        </td>
      </tr>
      <tr>
        <td style="padding: 10px 0;">
          <span style="color: ${COLORS.textoGris}; font-size: 12px;">Condiciones de Pago:</span><br>
          <span style="color: ${data.tipoPago === 'CREDITO' ? COLORS.verde : '#3b82f6'}; font-size: 16px; font-weight: 700;">${tipoPagoLabel}</span>
        </td>
      </tr>
    </table>

    <div style="text-align: center;">
      <a href="https://www.jjcrm27.com/servicio-clientes"
         style="display: inline-block; background: linear-gradient(135deg, ${COLORS.verde} 0%, #16a34a 100%); color: #ffffff; text-decoration: none; padding: 14px 35px; border-radius: 6px; font-size: 14px; font-weight: 700;">
        CONFIRMAR ALTA →
      </a>
    </div>

    <p style="color: ${COLORS.textoGris}; font-size: 11px; margin: 15px 0 0 0; text-align: center;">
      Al confirmar, se enviará correo de bienvenida al cliente con el directorio de contactos.
    </p>
  `;

  return templateBase(content, 'CONFIRMAR ALTA', data.empresaFacturadora);
};

// ═══════════════════════════════════════════════════════════════════════════
// CASO 4: ALTA_COMPLETADA
// Trigger: Nancy confirma el alta
// Destino: Cliente (bienvenida) + Internos (notificación)
// ═══════════════════════════════════════════════════════════════════════════

const emailAltaCompletada = (data: any, destinatario: 'cliente' | 'interno') => {
  const tipoPagoLabel = data.tipoPago === 'CREDITO'
    ? `Crédito a ${data.diasCredito || 30} días`
    : 'Prepago';

  if (destinatario === 'cliente') {
    const saludo = getSaludo(data.nombreContacto);

    const content = `
      ${saludo ? `<p style="color: ${COLORS.textoGris}; font-size: 13px; margin: 0 0 10px 0;">${saludo}</p>` : ''}

      <div style="background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); border-radius: 8px; padding: 20px; margin-bottom: 20px; text-align: center;">
        <h1 style="color: #166534; font-size: 24px; margin: 0 0 5px 0;">
          🎉 ¡Bienvenido a Grupo Loma!
        </h1>
        <p style="color: #166534; font-size: 14px; margin: 0;">
          Su alta comercial ha sido completada exitosamente
        </p>
      </div>

      <p style="color: ${COLORS.textoOscuro}; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
        Nos complace informarle que su proceso de alta comercial con <strong>${data.empresaFacturadora || 'Grupo Loma'}</strong>
        ha sido completado. A continuación encontrará su directorio de contactos para cualquier necesidad.
      </p>

      <div style="background: #f8fafc; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
        <h3 style="color: ${COLORS.azulCorporativo}; font-size: 14px; margin: 0 0 15px 0;">👤 Sus Ejecutivos Asignados</h3>

        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="50%" style="padding: 10px; vertical-align: top;">
              <div style="background: #ffffff; border-radius: 6px; padding: 12px; border: 1px solid #e2e8f0;">
                <span style="color: #7c3aed; font-size: 11px; font-weight: 600;">SERVICIO A CLIENTES</span><br>
                <span style="color: ${COLORS.textoOscuro}; font-size: 14px; font-weight: 600;">${data.csrNombre}</span><br>
                <span style="color: ${COLORS.textoGris}; font-size: 12px;">${data.csrEmail}</span><br>
                <span style="color: ${COLORS.textoGris}; font-size: 12px;">${data.csrTelefono || ''}</span>
              </div>
            </td>
            <td width="50%" style="padding: 10px; vertical-align: top;">
              <div style="background: #ffffff; border-radius: 6px; padding: 12px; border: 1px solid #e2e8f0;">
                <span style="color: #059669; font-size: 11px; font-weight: 600;">COBRANZA</span><br>
                <span style="color: ${COLORS.textoOscuro}; font-size: 14px; font-weight: 600;">${data.cxcNombre}</span><br>
                <span style="color: ${COLORS.textoGris}; font-size: 12px;">${data.cxcEmail || ''}</span><br>
                <span style="color: ${COLORS.textoGris}; font-size: 12px;">${data.cxcTelefono || ''}</span>
              </div>
            </td>
          </tr>
        </table>
      </div>

      <div style="background: #f0f9ff; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
        <h3 style="color: ${COLORS.azulCorporativo}; font-size: 14px; margin: 0 0 15px 0;">📞 Directorio de Escalación</h3>

        <table width="100%" cellpadding="5" cellspacing="0" style="font-size: 12px;">
          ${DIRECTORIO_ESCALACION.map(d => `
            <tr>
              <td style="color: ${COLORS.textoGris}; width: 35%;">${d.rol}:</td>
              <td style="color: ${COLORS.textoOscuro}; font-weight: 500;">${d.nombre}</td>
              <td style="color: ${COLORS.textoGris};">${d.tel}</td>
            </tr>
          `).join('')}
        </table>
      </div>

      <div style="text-align: center; padding: 15px; background: ${data.tipoPago === 'CREDITO' ? '#dcfce7' : '#dbeafe'}; border-radius: 8px;">
        <span style="color: ${COLORS.textoGris}; font-size: 12px;">Condiciones de Pago:</span><br>
        <span style="color: ${data.tipoPago === 'CREDITO' ? '#166534' : '#1d4ed8'}; font-size: 18px; font-weight: 700;">${tipoPagoLabel}</span>
      </div>

      <p style="color: ${COLORS.textoOscuro}; font-size: 13px; line-height: 1.6; margin: 20px 0 0 0; text-align: center;">
        Gracias por su confianza. Estamos listos para servirle.
      </p>
    `;

    return templateBase(content, '¡BIENVENIDO!', data.empresaFacturadora);

  } else {
    const content = `
      <div style="background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h2 style="color: #166534; font-size: 18px; margin: 0 0 5px 0;">
          ✅ Alta Completada
        </h2>
        <p style="color: #166534; font-size: 13px; margin: 0;">
          Nancy Alonso ha confirmado el alta del cliente
        </p>
      </div>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 15px;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
            <span style="color: ${COLORS.textoGris}; font-size: 11px;">Cliente:</span>
            <span style="color: ${COLORS.textoOscuro}; font-size: 14px; font-weight: 600; float: right;">${data.razonSocial}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
            <span style="color: ${COLORS.textoGris}; font-size: 11px;">RFC:</span>
            <span style="color: ${COLORS.textoOscuro}; font-size: 14px; float: right;">${data.rfc || '-'}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
            <span style="color: ${COLORS.textoGris}; font-size: 11px;">CSR:</span>
            <span style="color: #7c3aed; font-size: 14px; float: right;">${data.csrNombre}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
            <span style="color: ${COLORS.textoGris}; font-size: 11px;">CxC:</span>
            <span style="color: #059669; font-size: 14px; float: right;">${data.cxcNombre}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0;">
            <span style="color: ${COLORS.textoGris}; font-size: 11px;">Pago:</span>
            <span style="color: ${data.tipoPago === 'CREDITO' ? COLORS.verde : '#3b82f6'}; font-size: 14px; font-weight: 600; float: right;">${tipoPagoLabel}</span>
          </td>
        </tr>
      </table>

      <p style="color: ${COLORS.textoGris}; font-size: 11px; margin: 0; text-align: center;">
        Se envió correo de bienvenida al cliente con el directorio de contactos.
      </p>
    `;

    return templateBase(content, 'ALTA CONFIRMADA', data.empresaFacturadora);
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// HANDLER PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { tipo } = body;

    console.log('📧 Tipo de correo:', tipo);
    console.log('📦 Datos recibidos:', JSON.stringify(body, null, 2));

    let results: any[] = [];

    switch (tipo) {
      // ─────────────────────────────────────────────────────────────────────
      // CASO 0: Solicitud al cliente
      // ─────────────────────────────────────────────────────────────────────
      case 'solicitud_cliente': {
        const html = emailSolicitudCliente(body);
        const result = await enviarCorreo(
          body.destinatarios || [body.emailCliente],
          `Alta Comercial – ${body.empresaFacturadora || 'Grupo Loma'}`,
          html
        );
        results.push({ to: body.destinatarios, result });
        break;
      }

      // ─────────────────────────────────────────────────────────────────────
      // CASO 1: Cliente completó formulario → Notificar a Juan
      // ─────────────────────────────────────────────────────────────────────
      case 'solicitud_completada':
      case 'cliente_completo': {
        const html = emailClienteCompleto(body);
        const result = await enviarCorreo(
          ['juan.viveros@trob.com.mx'],
          `📥 Nueva Solicitud: ${body.razonSocial}`,
          html
        );
        results.push({ to: 'juan.viveros@trob.com.mx', result });
        break;
      }

      // ─────────────────────────────────────────────────────────────────────
      // CASO 1B: Cliente completó → Notificar a Juan Y Claudia (PARALELO)
      // ─────────────────────────────────────────────────────────────────────
      case 'en_revision': {
        // Correo a Juan (CSR + tipo pago)
        const htmlJuan = emailEnRevision(body, 'juan');
        const resultJuan = await enviarCorreo(
          ['juan.viveros@trob.com.mx'],
          `📥 Nueva Solicitud: ${body.razonSocial} — Asignar CSR`,
          htmlJuan
        );
        results.push({ to: 'juan.viveros@trob.com.mx', result: resultJuan });

        // Correo a Claudia (CxC) — ahora con link público
        const htmlClaudia = emailEnRevision(body, 'claudia');
        const resultClaudia = await enviarCorreo(
          ['claudia.priana@trob.com.mx'],
          `📥 Nueva Solicitud: ${body.razonSocial} — Asignar CxC`,
          htmlClaudia
        );
        results.push({ to: 'claudia.priana@trob.com.mx', result: resultClaudia });
        break;
      }

      // ─────────────────────────────────────────────────────────────────────
      // CASO 2: Juan asignó CSR → Notificar a CSR + Claudia/Martha
      // ─────────────────────────────────────────────────────────────────────
      case 'asignar_cobranza':
      case 'pendiente_cxc': {
        // Correo al CSR
        if (body.csrEmail) {
          const htmlCsr = emailPendienteCxC(body, 'csr');
          const resultCsr = await enviarCorreo(
            [body.csrEmail],
            `✅ Cliente Asignado: ${body.razonSocial}`,
            htmlCsr
          );
          results.push({ to: body.csrEmail, result: resultCsr });
        }

        // Correo a Claudia y Martha — ahora con link público
        const htmlGerencia = emailPendienteCxC(body, 'gerencia');
        const resultGerencia = await enviarCorreo(
          ['claudia.priana@trob.com.mx', 'martha.velasco@trob.com.mx'],
          `⏳ Pendiente CxC: ${body.razonSocial}`,
          htmlGerencia
        );
        results.push({ to: ['claudia.priana@trob.com.mx', 'martha.velasco@trob.com.mx'], result: resultGerencia });
        break;
      }

      // ─────────────────────────────────────────────────────────────────────
      // CASO 3: Claudia/Martha asignó CxC → Notificar a Nancy
      // ─────────────────────────────────────────────────────────────────────
      case 'pendiente_confirmacion': {
        const html = emailPendienteConfirmacion(body);
        const result = await enviarCorreo(
          ['nancy.alonso@trob.com.mx'],
          `🔔 Confirmar Alta: ${body.razonSocial}`,
          html
        );
        results.push({ to: 'nancy.alonso@trob.com.mx', result });
        break;
      }

      // ─────────────────────────────────────────────────────────────────────
      // CASO 4: Nancy confirmó → Notificar a cliente + internos
      // ─────────────────────────────────────────────────────────────────────
      case 'alta_completada':
      case 'alta_confirmada': {
        // Correo de bienvenida al cliente
        if (body.emailCliente) {
          const htmlCliente = emailAltaCompletada(body, 'cliente');
          const resultCliente = await enviarCorreo(
            [body.emailCliente],
            `🎉 ¡Bienvenido a ${body.empresaFacturadora || 'Grupo Loma'}!`,
            htmlCliente
          );
          results.push({ to: body.emailCliente, result: resultCliente });
        }

        // Correo interno a todos los involucrados
        const internosEmails = [
          'juan.viveros@trob.com.mx',
          'claudia.priana@trob.com.mx',
          'martha.velasco@trob.com.mx',
          body.csrEmail,
          body.cxcEmail,
          body.creadoPorEmail
        ].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);

        if (internosEmails.length > 0) {
          const htmlInterno = emailAltaCompletada(body, 'interno');
          const resultInterno = await enviarCorreo(
            internosEmails,
            `✅ Alta Completada: ${body.razonSocial}`,
            htmlInterno
          );
          results.push({ to: internosEmails, result: resultInterno });
        }
        break;
      }

      default:
        throw new Error(`Tipo de correo no reconocido: ${tipo}`);
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
