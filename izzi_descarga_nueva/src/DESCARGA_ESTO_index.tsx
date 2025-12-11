import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { createClient } from "npm:@supabase/supabase-js@2.39.0";

const app = new Hono();

// Supabase client para Storage
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Inicializar bucket de archivos al arrancar
const BUCKET_NAME = 'make-d84b50bb-files';
(async () => {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);
    if (!bucketExists) {
      await supabase.storage.createBucket(BUCKET_NAME, { public: false });
      console.log(`[STORAGE] Bucket ${BUCKET_NAME} creado`);
    }
  } catch (error) {
    console.error('[STORAGE] Error inicializando bucket:', error);
  }
})();

// ==================== WIDETECH GPS CACHE ====================
// Caché en memoria para evitar error 109 (40 segundos entre consultas por placa)
const WIDETECH_CACHE: Record<string, { data: any; lastRequestTime: number; fromCache?: boolean }> = {};
const MIN_INTERVAL_MS = 40_000; // 40 segundos

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-d84b50bb/health", (c) => {
  return c.json({ status: "ok" });
});

// ==================== LEADS ENDPOINTS ====================

// GET todos los leads (con filtro opcional por vendedor)
app.get("/make-server-d84b50bb/leads", async (c) => {
  try {
    const vendedor = c.req.query('vendedor'); // Query param para filtrar
    const allLeads = await kv.getByPrefix("lead:");
    
    let leads = allLeads;
    if (vendedor) {
      leads = allLeads.filter((lead: any) => lead.vendedor === vendedor);
      console.log(`[GET /leads] Filtrado por vendedor "${vendedor}": ${leads.length} leads`);
    } else {
      console.log(`[GET /leads] Retrieved ${leads.length} leads (sin filtro)`);
    }
    
    return c.json({ success: true, leads });
  } catch (error) {
    console.error(`[GET /leads] Error retrieving leads: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// POST crear nuevo lead
app.post("/make-server-d84b50bb/leads", async (c) => {
  try {
    const lead = await c.req.json();
    const leadId = `lead:${lead.id}`;
    
    await kv.set(leadId, lead);
    console.log(`[POST /leads] Lead created: ${leadId}`);
    
    return c.json({ success: true, lead });
  } catch (error) {
    console.error(`[POST /leads] Error creating lead: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// PUT actualizar lead existente
app.put("/make-server-d84b50bb/leads/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const lead = await c.req.json();
    const leadId = `lead:${id}`;
    
    await kv.set(leadId, lead);
    console.log(`[PUT /leads/:id] Lead updated: ${leadId}`);
    
    return c.json({ success: true, lead });
  } catch (error) {
    console.error(`[PUT /leads/:id] Error updating lead: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// DELETE eliminar lead (con backup automático)
app.delete("/make-server-d84b50bb/leads/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const leadId = `lead:${id}`;
    
    // 1. Obtener el lead antes de borrarlo
    const leads = await kv.getByPrefix(`lead:${id}`);
    const lead = leads[0];
    
    if (lead) {
      // 2. Guardar en backup con timestamp de borrado
      const backupId = `lead_backup:${id}:${Date.now()}`;
      const backupLead = {
        ...lead,
        deletedAt: new Date().toISOString(),
        deletedBy: 'system' // Puedes pasar el usuario si lo tienes
      };
      await kv.set(backupId, backupLead);
      console.log(`[DELETE /leads/:id] Backup guardado: ${backupId}`);
    }
    
    // 3. Borrar el lead original
    await kv.del(leadId);
    console.log(`[DELETE /leads/:id] Lead deleted: ${leadId}`);
    
    return c.json({ success: true });
  } catch (error) {
    console.error(`[DELETE /leads/:id] Error deleting lead: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== BACKUP ENDPOINTS ====================

// GET descargar SOLO BORRADOS como CSV
app.get("/make-server-d84b50bb/leads/backup/deleted", async (c) => {
  try {
    const backups = await kv.getByPrefix("lead_backup:");
    console.log(`[GET /leads/backup/deleted] Retrieved ${backups.length} backup records`);
    
    if (backups.length === 0) {
      return c.json({ success: false, error: 'No hay registros eliminados' }, 404);
    }
    
    // Crear CSV
    const headers = [
      'ID', 'Empresa', 'Contacto', 'Email', 'Teléfono', 
      'Servicio', 'Viaje', 'Rutas', 'Viajes/Mes', 'Tarifa', 
      'Proyectado USD', 'Vendedor', 'Fecha Captura', 'Fecha Borrado'
    ];
    
    const rows = backups.map((backup: any) => [
      backup.id,
      backup.nombreEmpresa,
      backup.nombreContacto,
      backup.correoElectronico,
      backup.telefonoContacto || '',
      backup.tipoServicio?.join(', ') || '',
      backup.tipoViaje?.join(', ') || '',
      backup.principalesRutas || '',
      backup.viajesPorMes || '',
      backup.tarifa || '',
      backup.proyectadoVentaMensual || '',
      backup.vendedor,
      backup.fechaCaptura,
      backup.deletedAt || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    return c.text(csvContent, 200, {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="fx27_borrados_${new Date().toISOString().split('T')[0]}.csv"`
    });
  } catch (error) {
    console.error(`[GET /leads/backup/deleted] Error: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// GET descargar SOLO ACTIVOS como CSV
app.get("/make-server-d84b50bb/leads/backup/active", async (c) => {
  try {
    const activeLeads = await kv.getByPrefix("lead:");
    console.log(`[GET /leads/backup/active] Retrieved ${activeLeads.length} active leads`);
    
    if (activeLeads.length === 0) {
      return c.json({ success: false, error: 'No hay leads activos' }, 404);
    }
    
    // Crear CSV
    const headers = [
      'ID', 'Empresa', 'Contacto', 'Email', 'Teléfono', 
      'Servicio', 'Viaje', 'Rutas', 'Viajes/Mes', 'Tarifa', 
      'Proyectado USD', 'Vendedor', 'Fecha Captura', 'Estado'
    ];
    
    const rows = activeLeads.map((lead: any) => [
      lead.id,
      lead.nombreEmpresa,
      lead.nombreContacto,
      lead.correoElectronico,
      lead.telefonoContacto || '',
      lead.tipoServicio?.join(', ') || '',
      lead.tipoViaje?.join(', ') || '',
      lead.principalesRutas || '',
      lead.viajesPorMes || '',
      lead.tarifa || '',
      lead.proyectadoVentaMensual || '',
      lead.vendedor,
      lead.fechaCaptura,
      'Activo'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    return c.text(csvContent, 200, {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="fx27_activos_${new Date().toISOString().split('T')[0]}.csv"`
    });
  } catch (error) {
    console.error(`[GET /leads/backup/active] Error: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// GET descargar AMBOS (activos + borrados) como CSV
app.get("/make-server-d84b50bb/leads/backup/download", async (c) => {
  try {
    const activeLeads = await kv.getByPrefix("lead:");
    const backups = await kv.getByPrefix("lead_backup:");
    console.log(`[GET /leads/backup/download] Retrieved ${activeLeads.length} active + ${backups.length} deleted`);
    
    if (activeLeads.length === 0 && backups.length === 0) {
      return c.json({ success: false, error: 'No hay registros' }, 404);
    }
    
    // Crear CSV
    const headers = [
      'ID', 'Empresa', 'Contacto', 'Email', 'Teléfono', 
      'Servicio', 'Viaje', 'Rutas', 'Viajes/Mes', 'Tarifa', 
      'Proyectado USD', 'Vendedor', 'Fecha Captura', 'Estado', 'Fecha Borrado'
    ];
    
    const activeRows = activeLeads.map((lead: any) => [
      lead.id,
      lead.nombreEmpresa,
      lead.nombreContacto,
      lead.correoElectronico,
      lead.telefonoContacto || '',
      lead.tipoServicio?.join(', ') || '',
      lead.tipoViaje?.join(', ') || '',
      lead.principalesRutas || '',
      lead.viajesPorMes || '',
      lead.tarifa || '',
      lead.proyectadoVentaMensual || '',
      lead.vendedor,
      lead.fechaCaptura,
      'Activo',
      ''
    ]);
    
    const deletedRows = backups.map((backup: any) => [
      backup.id,
      backup.nombreEmpresa,
      backup.nombreContacto,
      backup.correoElectronico,
      backup.telefonoContacto || '',
      backup.tipoServicio?.join(', ') || '',
      backup.tipoViaje?.join(', ') || '',
      backup.principalesRutas || '',
      backup.viajesPorMes || '',
      backup.tarifa || '',
      backup.proyectadoVentaMensual || '',
      backup.vendedor,
      backup.fechaCaptura,
      'Eliminado',
      backup.deletedAt || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...activeRows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ...deletedRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    return c.text(csvContent, 200, {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="fx27_completo_${new Date().toISOString().split('T')[0]}.csv"`
    });
  } catch (error) {
    console.error(`[GET /leads/backup/download] Error: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== FILE STORAGE ENDPOINTS ====================

// ==================== USUARIOS ENDPOINTS ====================

// Actualizar último acceso de usuario
app.post("/make-server-d84b50bb/usuarios/ultimo-acceso", async (c) => {
  try {
    const { email } = await c.req.json();
    
    if (!email) {
      return c.json({ success: false, error: 'Email requerido' }, 400);
    }

    // Obtener usuarios del KV
    const usuariosData = await kv.get('fx27-usuarios');
    
    // Si no hay usuarios en el backend, crear estructura inicial
    if (!usuariosData) {
      console.log(`[POST /usuarios/ultimo-acceso] No hay usuarios en backend, creando entrada para: ${email}`);
      
      // Crear usuario con timestamp
      const nuevoUsuario = {
        correo: email,
        ultimoAcceso: new Date().toISOString()
      };
      
      await kv.set('fx27-usuarios', JSON.stringify([nuevoUsuario]));
      
      return c.json({ 
        success: true, 
        message: 'Primer acceso registrado en backend',
        timestamp: new Date().toISOString()
      });
    }

    const usuarios = JSON.parse(usuariosData);
    
    // Verificar si el usuario ya existe
    const usuarioExiste = usuarios.find((u: any) => u.correo === email);
    
    let usuariosActualizados;
    
    if (usuarioExiste) {
      // Actualizar último acceso del usuario existente
      usuariosActualizados = usuarios.map((u: any) => 
        u.correo === email 
          ? { ...u, ultimoAcceso: new Date().toISOString() } 
          : u
      );
    } else {
      // Agregar nuevo usuario
      console.log(`[POST /usuarios/ultimo-acceso] Usuario nuevo en backend: ${email}`);
      usuariosActualizados = [
        ...usuarios,
        {
          correo: email,
          ultimoAcceso: new Date().toISOString()
        }
      ];
    }

    // Guardar en KV
    await kv.set('fx27-usuarios', JSON.stringify(usuariosActualizados));

    console.log(`[POST /usuarios/ultimo-acceso] ✅ Actualizado para: ${email}`);
    
    return c.json({ 
      success: true, 
      message: 'Último acceso actualizado',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`[POST /usuarios/ultimo-acceso] Error: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== FILE STORAGE ENDPOINTS ====================

// POST subir archivo
app.post("/make-server-d84b50bb/files/upload", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const category = formData.get('category') as string || 'general'; // cotizaciones, contratos, documentos, imagenes, otros
    
    if (!file) {
      return c.json({ success: false, error: 'No se proporcionó archivo' }, 400);
    }
    
    const fileName = `${category}/${Date.now()}_${file.name}`;
    const fileBuffer = await file.arrayBuffer();
    
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false
      });
    
    if (error) throw error;
    
    // Guardar metadata en KV
    const fileMetadata = {
      id: Date.now().toString(),
      originalName: file.name,
      storagePath: data.path,
      category,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString()
    };
    
    await kv.set(`file:${fileMetadata.id}`, fileMetadata);
    
    console.log(`[POST /files/upload] Archivo subido: ${fileName}`);
    return c.json({ success: true, file: fileMetadata });
  } catch (error) {
    console.error(`[POST /files/upload] Error: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// GET listar archivos por categoría
app.get("/make-server-d84b50bb/files", async (c) => {
  try {
    const category = c.req.query('category');
    const allFiles = await kv.getByPrefix("file:");
    
    let files = allFiles;
    if (category) {
      files = allFiles.filter((file: any) => file.category === category);
    }
    
    console.log(`[GET /files] Retrieved ${files.length} files`);
    return c.json({ success: true, files });
  } catch (error) {
    console.error(`[GET /files] Error: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// GET descargar archivo (signed URL)
app.get("/make-server-d84b50bb/files/:id/download", async (c) => {
  try {
    const id = c.req.param("id");
    const files = await kv.getByPrefix(`file:${id}`);
    const file = files[0];
    
    if (!file) {
      return c.json({ success: false, error: 'Archivo no encontrado' }, 404);
    }
    
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(file.storagePath, 3600); // 1 hora
    
    if (error) throw error;
    
    console.log(`[GET /files/:id/download] URL generada para: ${file.originalName}`);
    return c.json({ success: true, url: data.signedUrl, file });
  } catch (error) {
    console.error(`[GET /files/:id/download] Error: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// DELETE eliminar archivo
app.delete("/make-server-d84b50bb/files/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const files = await kv.getByPrefix(`file:${id}`);
    const file = files[0];
    
    if (!file) {
      return c.json({ success: false, error: 'Archivo no encontrado' }, 404);
    }
    
    // Eliminar de Storage
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([file.storagePath]);
    
    if (error) throw error;
    
    // Eliminar metadata
    await kv.del(`file:${id}`);
    
    console.log(`[DELETE /files/:id] Archivo eliminado: ${file.originalName}`);
    return c.json({ success: true });
  } catch (error) {
    console.error(`[DELETE /files/:id] Error: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== GPS TRACKING ENDPOINTS ====================

// POST guardar configuración de API GPS (Geotab, Omnitracs, Samsara, etc.)
app.post("/make-server-d84b50bb/gps/config", async (c) => {
  try {
    const config = await c.req.json();
    const { provider, apiKey, apiUrl, webhookSecret, additionalConfig } = config;
    
    // Guardar configuración de GPS en KV
    const gpsConfig = {
      provider, // 'geotab', 'omnitracs', 'samsara', 'verizon', etc.
      apiKey, // API Key del proveedor
      apiUrl, // URL base de la API
      webhookSecret, // Secret para validar webhooks
      additionalConfig, // Configuración adicional específica del proveedor
      updatedAt: new Date().toISOString()
    };
    
    await kv.set('gps-config', gpsConfig);
    console.log(`[POST /gps/config] Configuración GPS guardada para: ${provider}`);
    
    return c.json({ success: true, message: 'Configuración GPS guardada' });
  } catch (error) {
    console.error(`[POST /gps/config] Error: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// GET obtener configuración de GPS
app.get("/make-server-d84b50bb/gps/config", async (c) => {
  try {
    const config = await kv.get('gps-config');
    
    if (!config) {
      return c.json({ success: false, message: 'No hay configuración GPS' }, 404);
    }
    
    // NO devolver API keys completas por seguridad (solo últimos 4 caracteres)
    const safeConfig = {
      ...config,
      apiKey: config.apiKey ? `****${config.apiKey.slice(-4)}` : null
    };
    
    return c.json({ success: true, config: safeConfig });
  } catch (error) {
    console.error(`[GET /gps/config] Error: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// POST actualizar ubicación de una unidad (desde webhook o polling)
app.post("/make-server-d84b50bb/gps/location", async (c) => {
  try {
    const locationData = await c.req.json();
    const { 
      numeroTracto, 
      latitude, 
      longitude, 
      speed, 
      heading, 
      timestamp,
      status, // 'moving', 'stopped', 'idle'
      odometer,
      address // Dirección legible
    } = locationData;
    
    if (!numeroTracto || !latitude || !longitude) {
      return c.json({ success: false, error: 'Faltan datos requeridos' }, 400);
    }
    
    // Guardar ubicación actual
    const location = {
      numeroTracto,
      latitude,
      longitude,
      speed: speed || 0,
      heading: heading || 0,
      timestamp: timestamp || new Date().toISOString(),
      status: status || 'unknown',
      odometer: odometer || 0,
      address: address || 'Desconocida',
      updatedAt: new Date().toISOString()
    };
    
    await kv.set(`gps:current:${numeroTracto}`, location);
    
    // Guardar en histórico (último 30 días)
    const historyKey = `gps:history:${numeroTracto}:${Date.now()}`;
    await kv.set(historyKey, location);
    
    console.log(`[POST /gps/location] Ubicación actualizada: ${numeroTracto} - ${latitude}, ${longitude}`);
    
    return c.json({ success: true, location });
  } catch (error) {
    console.error(`[POST /gps/location] Error: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// POST actualizar múltiples ubicaciones (batch)
app.post("/make-server-d84b50bb/gps/locations/batch", async (c) => {
  try {
    const { locations } = await c.req.json();
    
    if (!Array.isArray(locations) || locations.length === 0) {
      return c.json({ success: false, error: 'Debe proporcionar un array de ubicaciones' }, 400);
    }
    
    const results = [];
    
    for (const loc of locations) {
      const { numeroTracto, latitude, longitude, speed, heading, timestamp, status, odometer, address } = loc;
      
      if (!numeroTracto || !latitude || !longitude) {
        results.push({ numeroTracto, success: false, error: 'Datos incompletos' });
        continue;
      }
      
      const location = {
        numeroTracto,
        latitude,
        longitude,
        speed: speed || 0,
        heading: heading || 0,
        timestamp: timestamp || new Date().toISOString(),
        status: status || 'unknown',
        odometer: odometer || 0,
        address: address || 'Desconocida',
        updatedAt: new Date().toISOString()
      };
      
      await kv.set(`gps:current:${numeroTracto}`, location);
      results.push({ numeroTracto, success: true });
    }
    
    console.log(`[POST /gps/locations/batch] ${results.length} ubicaciones procesadas`);
    
    return c.json({ success: true, results });
  } catch (error) {
    console.error(`[POST /gps/locations/batch] Error: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// GET obtener ubicación actual de una unidad
app.get("/make-server-d84b50bb/gps/location/:numeroTracto", async (c) => {
  try {
    const numeroTracto = c.req.param("numeroTracto");
    const location = await kv.get(`gps:current:${numeroTracto}`);
    
    if (!location) {
      return c.json({ success: false, message: 'No hay ubicación para esta unidad' }, 404);
    }
    
    return c.json({ success: true, location });
  } catch (error) {
    console.error(`[GET /gps/location/:numeroTracto] Error: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// GET obtener ubicaciones de todas las unidades
app.get("/make-server-d84b50bb/gps/locations/all", async (c) => {
  try {
    const locations = await kv.getByPrefix("gps:current:");
    console.log(`[GET /gps/locations/all] Retrieved ${locations.length} ubicaciones`);
    
    return c.json({ success: true, locations, count: locations.length });
  } catch (error) {
    console.error(`[GET /gps/locations/all] Error: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// GET obtener histórico de ubicaciones de una unidad (últimas 24h por defecto)
app.get("/make-server-d84b50bb/gps/history/:numeroTracto", async (c) => {
  try {
    const numeroTracto = c.req.param("numeroTracto");
    const history = await kv.getByPrefix(`gps:history:${numeroTracto}:`);
    
    // Ordenar por timestamp descendente
    const sortedHistory = history.sort((a: any, b: any) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    console.log(`[GET /gps/history/:numeroTracto] Retrieved ${sortedHistory.length} registros históricos`);
    
    return c.json({ success: true, history: sortedHistory, count: sortedHistory.length });
  } catch (error) {
    console.error(`[GET /gps/history/:numeroTracto] Error: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// POST recibir webhook de proveedor GPS (genérico)
app.post("/make-server-d84b50bb/gps/webhook", async (c) => {
  try {
    const payload = await c.req.json();
    const signature = c.req.header('X-Webhook-Signature');
    
    // Validar firma del webhook (implementar según proveedor)
    const config = await kv.get('gps-config');
    if (config?.webhookSecret && signature) {
      // Aquí se validaría la firma según el proveedor
      console.log(`[POST /gps/webhook] Webhook recibido con firma: ${signature}`);
    }
    
    // Guardar webhook raw para debugging
    await kv.set(`gps:webhook:${Date.now()}`, {
      payload,
      signature,
      receivedAt: new Date().toISOString()
    });
    
    console.log(`[POST /gps/webhook] Webhook recibido y guardado`);
    
    return c.json({ success: true, message: 'Webhook recibido' });
  } catch (error) {
    console.error(`[POST /gps/webhook] Error: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// DELETE limpiar histórico antiguo (mantener últimos 30 días)
app.delete("/make-server-d84b50bb/gps/cleanup", async (c) => {
  try {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const allHistory = await kv.getByPrefix("gps:history:");
    
    let deletedCount = 0;
    for (const record of allHistory) {
      // Extraer timestamp del key
      const keyParts = record.key?.split(':');
      const timestamp = parseInt(keyParts[keyParts.length - 1]);
      
      if (timestamp < thirtyDaysAgo) {
        await kv.del(record.key);
        deletedCount++;
      }
    }
    
    console.log(`[DELETE /gps/cleanup] Eliminados ${deletedCount} registros antiguos`);
    
    return c.json({ success: true, deletedCount });
  } catch (error) {
    console.error(`[DELETE /gps/cleanup] Error: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== CARROLL CONFIGURATION ENDPOINTS ====================

// POST guardar parámetros de ETA
app.post("/make-server-d84b50bb/carroll/eta-params", async (c) => {
  try {
    const { etaParams } = await c.req.json();
    
    await kv.set('carroll:eta-params', {
      ...etaParams,
      updatedAt: new Date().toISOString()
    });
    
    console.log(`[POST /carroll/eta-params] Parámetros guardados`);
    return c.json({ success: true, message: 'Parámetros ETA guardados' });
  } catch (error) {
    console.error(`[POST /carroll/eta-params] Error: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// GET obtener configuración completa de Carroll
app.get("/make-server-d84b50bb/carroll/config", async (c) => {
  try {
    const etaParams = await kv.get('carroll:eta-params');
    const clientes = await kv.getByPrefix('carroll:cliente:');
    const rutas = await kv.getByPrefix('carroll:ruta:');
    const destinos = await kv.getByPrefix('carroll:destino:');
    
    return c.json({
      success: true,
      config: {
        etaParams: etaParams || null,
        clientes: clientes || [],
        rutas: rutas || [],
        destinos: destinos || []
      }
    });
  } catch (error) {
    console.error(`[GET /carroll/config] Error: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// POST subir archivos KML o clientes CSV/Excel
app.post("/make-server-d84b50bb/carroll/upload", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'kml' o 'clientes'
    
    if (!file) {
      return c.json({ success: false, error: 'No se proporcionó archivo' }, 400);
    }
    
    const fileName = `carroll/${type}/${Date.now()}_${file.name}`;
    const fileBuffer = await file.arrayBuffer();
    
    // Guardar en storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false
      });
    
    if (error) throw error;
    
    // Guardar metadata
    const fileMetadata = {
      id: Date.now().toString(),
      originalName: file.name,
      storagePath: data.path,
      type,
      size: file.size,
      uploadedAt: new Date().toISOString()
    };
    
    if (type === 'kml') {
      await kv.set(`carroll:ruta:${fileMetadata.id}`, fileMetadata);
    } else if (type === 'clientes') {
      // Parsear CSV/Excel y guardar clientes (simplificado)
      const textContent = await file.text();
      await kv.set(`carroll:cliente:${fileMetadata.id}`, {
        ...fileMetadata,
        content: textContent
      });
    }
    
    console.log(`[POST /carroll/upload] Archivo ${type} subido: ${fileName}`);
    return c.json({ success: true, file: fileMetadata });
  } catch (error) {
    console.error(`[POST /carroll/upload] Error: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== COTIZACIONES & GOOGLE MAPS ENDPOINTS ====================

// POST guardar Google Maps API Key
app.post("/make-server-d84b50bb/config/google-maps-key", async (c) => {
  try {
    const { apiKey } = await c.req.json();
    
    if (!apiKey) {
      return c.json({ success: false, error: 'API Key requerida' }, 400);
    }
    
    await kv.set('google-maps-api-key', apiKey);
    console.log(`[POST /config/google-maps-key] API Key guardada`);
    
    return c.json({ success: true, message: 'API Key guardada exitosamente' });
  } catch (error) {
    console.error(`[POST /config/google-maps-key] Error: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// POST guardar tarifas de cotización
app.post("/make-server-d84b50bb/config/tarifas", async (c) => {
  try {
    const tarifas = await c.req.json();
    
    await kv.set('cotizacion-tarifas', {
      ...tarifas,
      updatedAt: new Date().toISOString()
    });
    
    console.log(`[POST /config/tarifas] Tarifas guardadas`);
    return c.json({ success: true, message: 'Tarifas guardadas exitosamente' });
  } catch (error) {
    console.error(`[POST /config/tarifas] Error: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// GET obtener tarifas de cotización
app.get("/make-server-d84b50bb/config/tarifas", async (c) => {
  try {
    const tarifas = await kv.get('cotizacion-tarifas');
    
    if (!tarifas) {
      return c.json({ success: false, message: 'No hay tarifas configuradas' }, 404);
    }
    
    return c.json({ success: true, tarifas });
  } catch (error) {
    console.error(`[GET /config/tarifas] Error: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// POST calcular distancia usando Google Maps Distance Matrix API
app.post("/make-server-d84b50bb/maps/distance", async (c) => {
  try {
    const { origen, destino } = await c.req.json();
    
    if (!origen || !destino) {
      return c.json({ success: false, error: 'Origen y destino requeridos' }, 400);
    }
    
    // Obtener API Key
    const apiKey = await kv.get('google-maps-api-key');
    if (!apiKey) {
      return c.json({ success: false, error: 'Google Maps API Key no configurada' }, 400);
    }
    
    // Llamar a Google Maps Distance Matrix API
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origen)}&destinations=${encodeURIComponent(destino)}&key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status !== 'OK') {
      console.error(`[POST /maps/distance] Google Maps API error: ${data.status}`);
      return c.json({ success: false, error: `Google Maps API error: ${data.status}` }, 400);
    }
    
    const element = data.rows[0]?.elements[0];
    
    if (!element || element.status !== 'OK') {
      console.error(`[POST /maps/distance] No se pudo calcular la ruta`);
      return c.json({ success: false, error: 'No se pudo calcular la ruta' }, 400);
    }
    
    // Extraer distancia y duración
    const distanceMeters = element.distance.value; // en metros
    const distanceKm = distanceMeters / 1000;
    const distanceMiles = distanceKm * 0.621371;
    const durationSeconds = element.duration.value; // en segundos
    const durationHours = durationSeconds / 3600;
    
    console.log(`[POST /maps/distance] ${origen} → ${destino}: ${distanceKm.toFixed(2)} km`);
    
    return c.json({
      success: true,
      distance: {
        meters: distanceMeters,
        km: Math.round(distanceKm * 100) / 100,
        miles: Math.round(distanceMiles * 100) / 100,
        text: element.distance.text
      },
      duration: {
        seconds: durationSeconds,
        hours: Math.round(durationHours * 100) / 100,
        text: element.duration.text
      },
      origen: data.origin_addresses[0],
      destino: data.destination_addresses[0]
    });
  } catch (error) {
    console.error(`[POST /maps/distance] Error: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== WIDETECH TRACKING ENDPOINTS ====================

// POST obtener ubicación de tractocamión desde WideTech API
app.post("/make-server-d84b50bb/widetech/location", async (c) => {
  try {
    const { placa } = await c.req.json();
    
    if (!placa) {
      return c.json({ success: false, error: 'Número económico requerido' }, 400);
    }
    
    // Credenciales de WideTech
    const login = "GrCarroll";
    const password = "CARROLL2025";
    
    console.log(`[GPS] 🚛 Consultando económico: ${placa}`);
    
    // Construir el SOAP request para WideTech
    // NOTA: sPlate acepta el número económico del tractocamión (505, 777, 893, etc.)
    // IMPORTANTE: El método se llama "HistoryDataLastLocationByPlate" (CON 'r' en History)
    // NAMESPACE: http://shareservice.co/ (NO tempuri.org)
    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <HistoryDataLastLocationByPlate xmlns="http://shareservice.co/">
      <sLogin>${login}</sLogin>
      <sPassword>${password}</sPassword>
      <sPlate>${placa}</sPlate>
    </HistoryDataLastLocationByPlate>
  </soap:Body>
</soap:Envelope>`;
    
    // Llamar a la API de WideTech
    const response = await fetch('https://web1ws.widetech.co/WsHistoryGetByPlate.asmx', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://shareservice.co/HistoryDataLastLocationByPlate'
      },
      body: soapEnvelope
    });
    
    const xmlText = await response.text();
    
    // LOG COMPLETO para debugging
    console.log(`[GPS] 📡 Response status: ${response.status}`);
    console.log(`[GPS] 📄 XML Response (primeros 1000 chars):`, xmlText.substring(0, 1000));
    
    // Parsear XML básico (buscar tags específicos)
    const parseXMLValue = (xml: string, tag: string): string | null => {
      const regex = new RegExp(`<${tag}>([^<]*)</${tag}>`, 'i');
      const match = xml.match(regex);
      return match ? match[1] : null;
    };
    
    // Extraer datos del XML
    const latitude = parseXMLValue(xmlText, 'Latitude');
    const longitude = parseXMLValue(xmlText, 'Longitude');
    const speed = parseXMLValue(xmlText, 'Speed');
    const date = parseXMLValue(xmlText, 'Date');
    const odometer = parseXMLValue(xmlText, 'Odometer');
    const address = parseXMLValue(xmlText, 'Address');
    
    console.log(`[GPS] 🔍 Parsed values - Lat: ${latitude}, Lon: ${longitude}, Speed: ${speed}, Date: ${date}`);
    
    if (!latitude || !longitude) {
      console.log(`[POST /widetech/location] ❌ No se encontró ubicación para económico: ${placa}`);
      return c.json({ 
        success: false, 
        error: 'No se encontró ubicación para esta placa',
        rawResponse: xmlText.substring(0, 500) // Para debugging
      }, 404);
    }
    
    const locationData = {
      placa,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      speed: speed ? parseFloat(speed) : 0,
      timestamp: date || new Date().toISOString(),
      odometer: odometer ? parseFloat(odometer) : 0,
      address: address || 'Desconocida'
    };
    
    console.log(`[POST /widetech/location] Ubicación obtenida: ${placa} - ${latitude}, ${longitude}`);
    
    return c.json({
      success: true,
      location: locationData
    });
  } catch (error) {
    console.error(`[POST /widetech/location] Error: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// POST obtener ubicaciones de múltiples tractocamiones (batch)
app.post("/make-server-d84b50bb/widetech/locations/batch", async (c) => {
  try {
    const { placas } = await c.req.json();
    
    if (!Array.isArray(placas) || placas.length === 0) {
      return c.json({ success: false, error: 'Debe proporcionar un array de placas' }, 400);
    }
    
    const results = [];
    const login = "GrCarroll";
    const password = "CARROLL2025";
    const now = Date.now();
    
    console.log(`[WIDETECH BATCH] 🚛 Consultando ${placas.length} unidades...`);
    
    // Obtener ÚLTIMA ubicación de cada placa usando GET request simple CON CACHE
    for (const placa of placas) {
      try {
        console.log(`\n[WIDETECH] 🔍 Placa: ${placa}`);
        
        // 1️⃣ VERIFICAR CACHE: Si consulté hace menos de 40s, usar cache
        const cached = WIDETECH_CACHE[placa];
        if (cached && (now - cached.lastRequestTime) < MIN_INTERVAL_MS) {
          const timeLeft = Math.ceil((MIN_INTERVAL_MS - (now - cached.lastRequestTime)) / 1000);
          console.log(`[WIDETECH] 💾 CACHE HIT para ${placa} (consultado hace ${Math.ceil((now - cached.lastRequestTime) / 1000)}s, quedan ${timeLeft}s para actualizar)`);
          
          results.push({
            placa,
            success: true,
            location: cached.data,
            fromCache: true,
            cacheAge: Math.ceil((now - cached.lastRequestTime) / 1000)
          });
          continue;
        }
        
        // 2️⃣ NO HAY CACHE O YA PASARON 40s → CONSULTAR API
        console.log(`[WIDETECH] 🌐 CONSULTANDO API para ${placa}`);
        
        // URL GET simple como en Postman (nota: es HistoyDataLastLocationByPlate sin segunda 'r')
        const url = `https://web1ws.widetech.co/WsHistoryGetByPlate.asmx/HistoyDataLastLocationByPlate?sLogin=${login}&sPassword=${password}&sPlate=${placa}`;
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json, text/xml, */*'
          }
        });
        
        console.log(`[WIDETECH] 📥 Response status: ${response.status} para placa ${placa}`);
        
        const responseText = await response.text();
        
        // Verificar error 109 (consultado muy rápido)
        if (responseText.includes('<code>109</code>')) {
          console.log(`[WIDETECH] ⚠️ ERROR 109 para ${placa}: Debe esperar más tiempo`);
          
          if (cached) {
            console.log(`[WIDETECH] 💾 Usando cache viejo por error 109`);
            results.push({
              placa,
              success: true,
              location: cached.data,
              fromCache: true,
              cacheAge: Math.ceil((now - cached.lastRequestTime) / 1000),
              warning: 'Error 109: usando cache viejo'
            });
          } else {
            results.push({
              placa,
              success: false,
              error: 'Error 109: Debe esperar 40 segundos entre consultas'
            });
          }
          continue;
        }
        
        // 3️⃣ PARSEAR XML con REGEX CORREGIDOS (un solo backslash)
        const latMatch = responseText.match(/<Latitude>([-\d.]+)<\/Latitude>/);
        const lngMatch = responseText.match(/<Longitude>([-\d.]+)<\/Longitude>/);
        const speedMatch = responseText.match(/<Speed>([\d.]+)<\/Speed>/);
        const headingMatch = responseText.match(/<Heading>([^<]+)<\/Heading>/);
        const locationMatch = responseText.match(/<Location><!\[CDATA\[([^\]]+)\]\]><\/Location>/);
        const dateTimeMatch = responseText.match(/<DateTimeGPS>([^<]+)<\/DateTimeGPS>/);
        const odometerMatch = responseText.match(/<Odometer>([\d.]+)<\/Odometer>/);
        const ignitionMatch = responseText.match(/<Ignition>([01])<\/Ignition>/);
        
        // Parsear temperaturas (S1 y S2)
        const temp1Match = responseText.match(/<S1[^>]*>([-\d.]+)<\/S1>/);
        const temp2Match = responseText.match(/<S2[^>]*>([-\d.]+)<\/S2>/);
        
        if (latMatch && lngMatch) {
          const location = {
            placa,
            latitude: parseFloat(latMatch[1]),
            longitude: parseFloat(lngMatch[1]),
            speed: speedMatch ? parseFloat(speedMatch[1]) : 0,
            heading: headingMatch ? headingMatch[1] : 'N/A',
            address: locationMatch ? locationMatch[1].trim() : 'Ubicación desconocida',
            timestamp: dateTimeMatch ? dateTimeMatch[1] : new Date().toISOString(),
            odometer: odometerMatch ? parseFloat(odometerMatch[1]) : 0,
            ignition: ignitionMatch ? (ignitionMatch[1] === '1' ? 'ON' : 'OFF') : 'N/A',
            temperatura1: temp1Match ? parseFloat(temp1Match[1]) : null,
            temperatura2: temp2Match ? parseFloat(temp2Match[1]) : null
          };
          
          console.log(`[WIDETECH BATCH] ✅ ${placa}: ${location.latitude}, ${location.longitude} | Temp: ${location.temperatura1}°C / ${location.temperatura2}°C`);
          
          results.push({
            placa,
            success: true,
            location
          });
        } else {
          console.log(`[WIDETECH BATCH] ❌ ${placa}: No se encontró ubicación`);
          results.push({
            placa,
            success: false,
            error: 'No se encontraron coordenadas GPS'
          });
        }
      } catch (error) {
        console.error(`[WIDETECH BATCH] ❌ Error en placa ${placa}:`, error);
        results.push({
          placa,
          success: false,
          error: String(error)
        });
      }
    }
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`[WIDETECH BATCH] ✅ Exitosos: ${successful} | ❌ Fallidos: ${failed}`);
    
    return c.json({
      success: true,
      results,
      total: placas.length,
      successful,
      failed
    });
  } catch (error) {
    console.error(`[POST /widetech/locations/batch] Error: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// GET endpoint de PRUEBA para ver respuesta raw de WideTech
app.get("/make-server-d84b50bb/widetech/test/:placa", async (c) => {
  try {
    const placa = c.req.param("placa");
    const login = "GrCarroll";
    const password = "CARROLL2025";
    
    // Crear Basic Auth header
    const authHeader = 'Basic ' + btoa(`${login}:${password}`);
    
    console.log(`[TEST GPS] 🧪 Probando con económico: ${placa}`);
    console.log(`[TEST GPS] 🔄 Usando método: HistoryDataByPlate_JSON (SIN fechas)`);
    
    // VOLVER a HistoryDataByPlate_JSON pero SIN parámetros de fecha (dejarlos vacíos)
    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <HistoryDataByPlate_JSON xmlns="http://shareservice.co/">
      <sLogin>${login}</sLogin>
      <sPassword>${password}</sPassword>
      <sPlate>${placa}</sPlate>
      <dIni></dIni>
      <dEnd></dEnd>
    </HistoryDataByPlate_JSON>
  </soap:Body>
</soap:Envelope>`;
    
    const response = await fetch('https://web1ws.widetech.co/WsHistoryGetByPlate.asmx', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://shareservice.co/HistoryDataByPlate_JSON',
        'Authorization': authHeader
      },
      body: soapEnvelope
    });
    
    const responseText = await response.text();
    
    console.log(`[TEST GPS] Status: ${response.status}`);
    console.log(`[TEST GPS] Response completa:`, responseText);
    
    // Extraer el JSON del XML
    const jsonMatch = responseText.match(/<HistoryDataByPlate_JSONResult>(.*?)<\/HistoryDataByPlate_JSONResult>/s);
    
    let parsedData = null;
    let found = false;
    
    if (jsonMatch && jsonMatch[1]) {
      try {
        // Decodificar entidades HTML si existen
        const jsonString = jsonMatch[1]
          .replace(/</g, '<')
          .replace(/>/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&/g, '&');
        
        parsedData = JSON.parse(jsonString);
        
        console.log(`[TEST GPS] 📊 JSON parseado:`, parsedData);
        console.log(`[TEST GPS] 📊 Registros: ${parsedData?.length || 0}`);
        
        if (parsedData && parsedData.length > 0) {
          found = true;
          const lastRecord = parsedData[parsedData.length - 1];
          console.log(`[TEST GPS] ✅ ÚLTIMA UBICACIÓN ENCONTRADA!`);
          console.log(`[TEST GPS] 📍 Lat: ${lastRecord.Latitude}, Lon: ${lastRecord.Longitude}`);
          console.log(`[TEST GPS] 📅 Fecha: ${lastRecord.Date}`);
          console.log(`[TEST GPS] 🚗 Velocidad: ${lastRecord.Speed} km/h`);
        } else {
          console.log(`[TEST GPS] ⚠️ JSON vacío o sin registros`);
        }
      } catch (parseError) {
        console.error(`[TEST GPS] ❌ Error parseando JSON: ${parseError}`);
      }
    }
    
    return c.json({
      success: true,
      economico: placa,
      method: 'HistoryDataByPlate_JSON (sin fechas)',
      response: {
        status: response.status,
        fullXML: responseText
      },
      parsedData,
      recordCount: parsedData?.length || 0,
      lastRecord: parsedData && parsedData.length > 0 ? parsedData[parsedData.length - 1] : null,
      found
    });
  } catch (error) {
    console.error(`[TEST GPS] Error: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// GET endpoint SUPER TEST - Prueba múltiples formatos de placa
app.get("/make-server-d84b50bb/widetech/supertest/:economico", async (c) => {
  try {
    const economico = c.req.param("economico");
    const login = "GrCarroll";
    const password = "CARROLL2025";
    const authHeader = 'Basic ' + btoa(`${login}:${password}`);
    
    // PROBAR MÚLTIPLES VARIACIONES (incluye formatos del portal WideTech)
    const variaciones = [
      economico,                    // 777
      `[${economico}]`,            // [777] (formato del título del portal)
      `Trob ${economico}`,         // Trob 777
      `Trob-${economico}`,         // Trob-777
      `TrobTransportesSA${economico}`, // TrobTransportesSA777
      `GC-${economico}`,           // GC-777
      `CARROLL${economico}`,       // CARROLL777
      `TR-${economico}`,           // TR-777
      `0${economico}`,             // 0777
      `00${economico}`,            // 00777
      `GC${economico}`,            // GC777
      `TR${economico}`,            // TR777
      // Si es 777, probar también con IMEI del dispositivo
      ...(economico === '777' ? ['860896050949510'] : [])
    ];
    
    console.log(`[SUPERTEST] 🧪 Probando ${variaciones.length} variaciones de: ${economico}`);
    
    const resultados = [];
    
    for (const variacion of variaciones) {
      const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <HistoryDataByPlate_JSON xmlns="http://shareservice.co/">
      <sLogin>${login}</sLogin>
      <sPassword>${password}</sPassword>
      <sPlate>${variacion}</sPlate>
      <dIni></dIni>
      <dEnd></dEnd>
    </HistoryDataByPlate_JSON>
  </soap:Body>
</soap:Envelope>`;
      
      try {
        const response = await fetch('https://web1ws.widetech.co/WsHistoryGetByPlate.asmx', {
          method: 'POST',
          headers: {
            'Content-Type': 'text/xml; charset=utf-8',
            'SOAPAction': 'http://shareservice.co/HistoryDataByPlate_JSON',
            'Authorization': authHeader
          },
          body: soapEnvelope
        });
        
        const responseText = await response.text();
        
        // Extraer el JSON del XML
        const jsonMatch = responseText.match(/<HistoryDataByPlate_JSONResult>(.*?)<\/HistoryDataByPlate_JSONResult>/s);
        
        let recordCount = 0;
        let lastRecord = null;
        let hasError = false;
        let errorMessage = '';
        
        // Detectar errores SOAP
        if (responseText.includes('soap:Fault') || responseText.includes('faultstring')) {
          hasError = true;
          const faultMatch = responseText.match(/<faultstring>(.*?)<\/faultstring>/);
          errorMessage = faultMatch ? faultMatch[1] : 'Error SOAP desconocido';
        }
        
        if (jsonMatch && jsonMatch[1]) {
          try {
            const jsonString = jsonMatch[1]
              .replace(/</g, '<')
              .replace(/>/g, '>')
              .replace(/&quot;/g, '"')
              .replace(/&/g, '&');
            
            const parsedData = JSON.parse(jsonString);
            recordCount = parsedData?.length || 0;
            
            if (recordCount > 0) {
              lastRecord = parsedData[parsedData.length - 1];
              console.log(`[SUPERTEST] ✅ ¡ENCONTRADO! "${variacion}" tiene ${recordCount} registros`);
              console.log(`[SUPERTEST] 📍 Última ubicación: ${lastRecord.Latitude}, ${lastRecord.Longitude}`);
            }
          } catch (e) {
            // Ignorar errores de parseo
          }
        }
        
        resultados.push({
          variacion,
          status: response.status,
          recordCount,
          encontrado: recordCount > 0,
          lastRecord,
          hasError,
          errorMessage
        });
        
      } catch (error) {
        resultados.push({
          variacion,
          error: String(error),
          encontrado: false
        });
      }
    }
    
    // Filtrar solo los que encontraron datos
    const exitosos = resultados.filter(r => r.encontrado);
    
    console.log(`[SUPERTEST] 🎯 Resultado: ${exitosos.length}/${variaciones.length} formatos con datos`);
    
    return c.json({
      success: true,
      economico,
      totalProbados: variaciones.length,
      exitosos: exitosos.length,
      resultados,
      recomendacion: exitosos.length > 0 
        ? `Usar formato: "${exitosos[0].variacion}"` 
        : 'Ningún formato devolvió datos. Verifica con WideTech el formato correcto de las placas.'
    });
  } catch (error) {
    console.error(`[SUPERTEST] Error: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// GET consultar WSDL de WideTech para ver métodos disponibles
app.get("/make-server-d84b50bb/widetech/wsdl", async (c) => {
  try {
    console.log(`[WSDL] 🔍 Consultando WSDL de WideTech...`);
    
    const response = await fetch('https://web1ws.widetech.co/WsHistoryGetByPlate.asmx?WSDL');
    const wsdlText = await response.text();
    
    console.log(`[WSDL] Status: ${response.status}`);
    console.log(`[WSDL] WSDL completo (primeros 2000 chars):`, wsdlText.substring(0, 2000));
    
    // Extraer todos los métodos/operaciones del WSDL
    const operationMatches = wsdlText.matchAll(/<wsdl:operation name="([^"]+)"/g);
    const operations = [...operationMatches].map(match => match[1]);
    
    // Eliminar duplicados
    const uniqueOperations = [...new Set(operations)];
    
    console.log(`[WSDL] 📋 Métodos encontrados:`, uniqueOperations);
    
    return c.json({
      success: true,
      wsdlUrl: 'https://web1ws.widetech.co/WsHistoryGetByPlate.asmx?WSDL',
      metodos: uniqueOperations,
      totalMetodos: uniqueOperations.length,
      wsdlCompleto: wsdlText
    });
  } catch (error) {
    console.error(`[WSDL] Error: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// GET obtener lista completa de móviles desde WideTech
app.get("/make-server-d84b50bb/widetech/mobile-list", async (c) => {
  try {
    const login = "GrCarroll";
    const password = "CARROLL2025";
    const authHeader = 'Basic ' + btoa(`${login}:${password}`);
    
    console.log(`[MOBILE LIST] 📋 Consultando lista completa de móviles...`);
    
    // Método GetMobileList del WSDL
    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <GetMobileList xmlns="http://shareservice.co/">
      <sLogin>${login}</sLogin>
      <sPassword>${password}</sPassword>
    </GetMobileList>
  </soap:Body>
</soap:Envelope>`;
    
    const response = await fetch('https://web1ws.widetech.co/WsHistoryGetByPlate.asmx', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://shareservice.co/GetMobileList',
        'Authorization': authHeader
      },
      body: soapEnvelope
    });
    
    const responseText = await response.text();
    
    console.log(`[MOBILE LIST] Status: ${response.status}`);
    console.log(`[MOBILE LIST] Response (primeros 2000 chars):`, responseText.substring(0, 2000));
    
    // Intentar extraer datos (puede ser XML o JSON dentro del XML)
    let mobileList = [];
    
    // Buscar si hay un array JSON dentro del XML
    const jsonMatch = responseText.match(/<GetMobileListResult>(.*?)<\/GetMobileListResult>/s);
    if (jsonMatch && jsonMatch[1]) {
      try {
        const jsonString = jsonMatch[1]
          .replace(/</g, '<')
          .replace(/>/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&/g, '&');
        
        mobileList = JSON.parse(jsonString);
        console.log(`[MOBILE LIST] ✅ JSON parseado: ${mobileList.length} móviles`);
      } catch (e) {
        console.log(`[MOBILE LIST] No es JSON, intentando parsear XML...`);
      }
    }
    
    // Si no es JSON, intentar extraer móviles del XML directamente
    if (mobileList.length === 0) {
      const mobileMatches = responseText.matchAll(/<Mobile>(.*?)<\/Mobile>/gs);
      for (const match of mobileMatches) {
        const mobileXml = match[1];
        
        const parseMobileField = (xml: string, tag: string): string | null => {
          const regex = new RegExp(`<${tag}>([^<]*)<\/${tag}>`, 'i');
          const match = xml.match(regex);
          return match ? match[1] : null;
        };
        
        const mobile = {
          id: parseMobileField(mobileXml, 'MobileID') || parseMobileField(mobileXml, 'Id'),
          name: parseMobileField(mobileXml, 'Name') || parseMobileField(mobileXml, 'Nombre'),
          plate: parseMobileField(mobileXml, 'Plate') || parseMobileField(mobileXml, 'Placa'),
          imei: parseMobileField(mobileXml, 'IMEI'),
          partner: parseMobileField(mobileXml, 'Partner')
        };
        
        if (mobile.id || mobile.name || mobile.plate) {
          mobileList.push(mobile);
        }
      }
      
      console.log(`[MOBILE LIST] ✅ XML parseado: ${mobileList.length} móviles`);
    }
    
    return c.json({
      success: true,
      mobileList,
      total: mobileList.length,
      rawResponse: responseText.substring(0, 5000) // Primeros 5000 chars para debugging
    });
  } catch (error) {
    console.error(`[MOBILE LIST] Error: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// GET MEGA TEST - Probar TODOS los métodos posibles
app.get("/make-server-d84b50bb/widetech/megatest", async (c) => {
  try {
    const login = "GrCarroll";
    const password = "CARROLL2025";
    const authHeader = 'Basic ' + btoa(`${login}:${password}`);
    
    console.log(`[MEGATEST] 🚀 Probando TODOS los métodos SOAP disponibles...`);
    
    const resultados = [];
    
    // MÉTODO 1: GetLastLocation (sin parámetros, devuelve todas las ubicaciones)
    try {
      console.log(`[MEGATEST] Probando GetLastLocation...`);
      const soap1 = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <GetLastLocation xmlns="http://shareservice.co/">
      <sLogin>${login}</sLogin>
      <sPassword>${password}</sPassword>
    </GetLastLocation>
  </soap:Body>
</soap:Envelope>`;
      
      const res1 = await fetch('https://web1ws.widetech.co/WsHistoryGetByPlate.asmx', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://shareservice.co/GetLastLocation',
          'Authorization': authHeader
        },
        body: soap1
      });
      
      const text1 = await res1.text();
      console.log(`[MEGATEST] GetLastLocation - Status: ${res1.status}, Length: ${text1.length}`);
      
      resultados.push({
        metodo: 'GetLastLocation',
        status: res1.status,
        responseLength: text1.length,
        preview: text1.substring(0, 500)
      });
    } catch (e) {
      resultados.push({ metodo: 'GetLastLocation', error: String(e) });
    }
    
    // MÉTODO 2: GetLastLocation_JSON (sin parámetros)
    try {
      console.log(`[MEGATEST] Probando GetLastLocation_JSON...`);
      const soap2 = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <GetLastLocation_JSON xmlns="http://shareservice.co/">
      <sLogin>${login}</sLogin>
      <sPassword>${password}</sPassword>
    </GetLastLocation_JSON>
  </soap:Body>
</soap:Envelope>`;
      
      const res2 = await fetch('https://web1ws.widetech.co/WsHistoryGetByPlate.asmx', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://shareservice.co/GetLastLocation_JSON',
          'Authorization': authHeader
        },
        body: soap2
      });
      
      const text2 = await res2.text();
      console.log(`[MEGATEST] GetLastLocation_JSON - Status: ${res2.status}, Length: ${text2.length}`);
      
      // Intentar extraer JSON
      const jsonMatch = text2.match(/<GetLastLocation_JSONResult>(.*?)<\/GetLastLocation_JSONResult>/s);
      if (jsonMatch && jsonMatch[1]) {
        try {
          const jsonString = jsonMatch[1]
            .replace(/</g, '<')
            .replace(/>/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&/g, '&');
          const parsedData = JSON.parse(jsonString);
          console.log(`[MEGATEST] 🎉 GetLastLocation_JSON devolvió ${parsedData?.length || 0} registros!`);
          resultados.push({
            metodo: 'GetLastLocation_JSON',
            status: res2.status,
            success: true,
            recordCount: parsedData?.length || 0,
            data: parsedData
          });
        } catch (e) {
          resultados.push({
            metodo: 'GetLastLocation_JSON',
            status: res2.status,
            responseLength: text2.length,
            preview: text2.substring(0, 500)
          });
        }
      } else {
        resultados.push({
          metodo: 'GetLastLocation_JSON',
          status: res2.status,
          responseLength: text2.length,
          preview: text2.substring(0, 500)
        });
      }
    } catch (e) {
      resultados.push({ metodo: 'GetLastLocation_JSON', error: String(e) });
    }
    
    // MÉTODO 3: GetHistoryData (sin parámetros)
    try {
      console.log(`[MEGATEST] Probando GetHistoryData...`);
      const soap3 = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <GetHistoryData xmlns="http://shareservice.co/">
      <sLogin>${login}</sLogin>
      <sPassword>${password}</sPassword>
      <dIni></dIni>
      <dEnd></dEnd>
    </GetHistoryData>
  </soap:Body>
</soap:Envelope>`;
      
      const res3 = await fetch('https://web1ws.widetech.co/WsHistoryGetByPlate.asmx', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://shareservice.co/GetHistoryData',
          'Authorization': authHeader
        },
        body: soap3
      });
      
      const text3 = await res3.text();
      console.log(`[MEGATEST] GetHistoryData - Status: ${res3.status}, Length: ${text3.length}`);
      
      resultados.push({
        metodo: 'GetHistoryData',
        status: res3.status,
        responseLength: text3.length,
        preview: text3.substring(0, 500)
      });
    } catch (e) {
      resultados.push({ metodo: 'GetHistoryData', error: String(e) });
    }
    
    // MÉTODO 4: GetHistoryData_JSON (sin parámetros)
    try {
      console.log(`[MEGATEST] Probando GetHistoryData_JSON...`);
      const soap4 = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <GetHistoryData_JSON xmlns="http://shareservice.co/">
      <sLogin>${login}</sLogin>
      <sPassword>${password}</sPassword>
      <dIni></dIni>
      <dEnd></dEnd>
    </GetHistoryData_JSON>
  </soap:Body>
</soap:Envelope>`;
      
      const res4 = await fetch('https://web1ws.widetech.co/WsHistoryGetByPlate.asmx', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://shareservice.co/GetHistoryData_JSON',
          'Authorization': authHeader
        },
        body: soap4
      });
      
      const text4 = await res4.text();
      console.log(`[MEGATEST] GetHistoryData_JSON - Status: ${res4.status}, Length: ${text4.length}`);
      
      // Intentar extraer JSON
      const jsonMatch = text4.match(/<GetHistoryData_JSONResult>(.*?)<\/GetHistoryData_JSONResult>/s);
      if (jsonMatch && jsonMatch[1]) {
        try {
          const jsonString = jsonMatch[1]
            .replace(/</g, '<')
            .replace(/>/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&/g, '&');
          const parsedData = JSON.parse(jsonString);
          console.log(`[MEGATEST] 🎉 GetHistoryData_JSON devolvió ${parsedData?.length || 0} registros!`);
          resultados.push({
            metodo: 'GetHistoryData_JSON',
            status: res4.status,
            success: true,
            recordCount: parsedData?.length || 0,
            data: parsedData?.slice(0, 5) // Solo primeros 5 para no saturar
          });
        } catch (e) {
          resultados.push({
            metodo: 'GetHistoryData_JSON',
            status: res4.status,
            responseLength: text4.length,
            preview: text4.substring(0, 500)
          });
        }
      } else {
        resultados.push({
          metodo: 'GetHistoryData_JSON',
          status: res4.status,
          responseLength: text4.length,
          preview: text4.substring(0, 500)
        });
      }
    } catch (e) {
      resultados.push({ metodo: 'GetHistoryData_JSON', error: String(e) });
    }
    
    console.log(`[MEGATEST] ✅ Completado. ${resultados.length} métodos probados.`);
    
    return c.json({
      success: true,
      totalMetodos: resultados.length,
      resultados,
      exitosos: resultados.filter(r => r.success || (r.responseLength && r.responseLength > 500))
    });
  } catch (error) {
    console.error(`[MEGATEST] Error: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

Deno.serve(app.fetch);
