import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { createClient } from "npm:@supabase/supabase-js@2.39.0";
import newsApp from "./news.tsx";

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
    origin: ["https://jjcrm27.com", "https://www.jjcrm27.com"],
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

// ==================== FORMATOS DE VENTA ====================
// GET: Obtener todos los formatos
app.get('/make-server-d84b50bb/formatos-venta', async (c) => {
  try {
    const formatos = await kv.getByPrefix('formato-venta-');
    return c.json({ success: true, formatos: formatos.map((f: any) => f.value) });
  } catch (error) {
    console.error('Error obteniendo formatos de venta:', error);
    return c.json({ success: false, error: 'Error al obtener formatos' }, 500);
  }
});

// POST: Crear nuevo formato
app.post('/make-server-d84b50bb/formatos-venta', async (c) => {
  try {
    const body = await c.req.json();
    const { convenioVenta, origen, destino, destinoNickname, kilometrosIda, kilometrosRegreso, ubicacionUrl } = body;
    
    if (!convenioVenta || !origen || !destino || !destinoNickname || !kilometrosIda || !kilometrosRegreso || !ubicacionUrl) {
      return c.json({ success: false, error: 'Faltan campos requeridos' }, 400);
    }

    const id = `${Date.now()}-${convenioVenta}`;
    const formato = {
      id,
      convenioVenta,
      origen,
      destino,
      destinoNickname,
      kilometrosIda: parseFloat(kilometrosIda.toString()),
      kilometrosRegreso: parseFloat(kilometrosRegreso.toString()),
      ubicacionUrl,
      createdAt: new Date().toISOString()
    };

    await kv.set(`formato-venta-${id}`, formato);
    console.log(`Formato de venta creado: ${id}`);
    
    return c.json({ success: true, formato });
  } catch (error) {
    console.error('Error creando formato de venta:', error);
    return c.json({ success: false, error: 'Error al crear formato' }, 500);
  }
});

// ==================== API KEYS ====================
// Endpoint para obtener Google Maps API Key
app.get("/make-server-d84b50bb/api-keys/google-maps", (c) => {
  const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY') || '';
  return c.json({ apiKey });
});

// Endpoint para obtener OpenWeatherMap API Key (capas meteorológicas)
app.get("/make-server-d84b50bb/api-keys/openweather", (c) => {
  const apiKey = Deno.env.get('OPENWEATHER_API_KEY') || '';
  return c.json({ apiKey });
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
    console.log(`[WIDETECH BATCH] 📋 Placas: ${placas.join(', ')}`);
    
    // Helper para esperar entre consultas (evitar saturar WideTech)
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    // Contador de requests reales (no cache)
    let apiCallsCount = 0;
    
    // Obtener ÚLTIMA ubicación de cada placa usando GET request simple CON CACHE
    for (let i = 0; i < placas.length; i++) {
      const placa = placas[i];
      
      try {
        console.log(`\n[WIDETECH] 🔍 [${i + 1}/${placas.length}] Procesando: ${placa}`);
        
        // 1️⃣ VERIFICAR CACHE: Si consulté hace menos de 40s, usar cache
        const cached = WIDETECH_CACHE[placa];
        if (cached && (now - cached.lastRequestTime) < MIN_INTERVAL_MS) {
          const cacheAge = Math.ceil((now - cached.lastRequestTime) / 1000);
          console.log(`[WIDETECH] 💾 CACHE HIT para ${placa} (${cacheAge}s)`);
          
          results.push({
            placa,
            success: true,
            location: cached.data,
            fromCache: true,
            cacheAge
          });
          continue;
        }
        
        // 2️⃣ NO HAY CACHE O YA PASARON 40s → CONSULTAR API CON REINTENTOS
        console.log(`[WIDETECH] 🌐 LLAMANDO API para ${placa}...`);
        
        let success = false;
        let attempts = 0;
        const maxAttempts = 3;
        let responseText = '';
        let lastError = '';
        
        while (!success && attempts < maxAttempts) {
          attempts++;
          console.log(`[WIDETECH] 🔄 Intento ${attempts}/${maxAttempts} para ${placa}`);
          
          try {
            // URL GET simple como en Postman (nota: es HistoyDataLastLocationByPlate sin segunda 'r')
            const url = `https://web1ws.widetech.co/WsHistoryGetByPlate.asmx/HistoyDataLastLocationByPlate?sLogin=${login}&sPassword=${password}&sPlate=${placa}`;
            
            // Timeout de 30 segundos (más tiempo)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);
            
            const response = await fetch(url, {
              method: 'GET',
              headers: {
                'Accept': 'application/json, text/xml, */*',
                'User-Agent': 'FX27-CRM/1.0'
              },
              signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            console.log(`[WIDETECH] 📥 Status ${response.status} para ${placa}`);
            
            if (response.ok) {
              responseText = await response.text();
              success = true;
              console.log(`[WIDETECH] ✅ Respuesta recibida (${responseText.length} chars)`);
            } else {
              lastError = `HTTP ${response.status}`;
              console.log(`[WIDETECH] ⚠️ HTTP ${response.status} en intento ${attempts}`);
              
              // Si es HTTP 500, esperar más tiempo antes de reintentar
              if (response.status === 500 && attempts < maxAttempts) {
                console.log(`[WIDETECH] 🛑 HTTP 500 detectado - Esperando 5s extra...`);
                await delay(5000);
              }
            }
            
          } catch (fetchError) {
            lastError = String(fetchError);
            console.error(`[WIDETECH] ❌ Error en intento ${attempts}: ${String(fetchError)}`);
          }
          
          // Backoff exponencial: 3s, 5s, 8s
          if (!success && attempts < maxAttempts) {
            const waitTime = attempts === 1 ? 3000 : attempts === 2 ? 5000 : 8000;
            console.log(`[WIDETECH] ⏳ Backoff ${waitTime/1000}s antes de reintentar...`);
            await delay(waitTime);
          }
        }
        
        if (!success) {
          console.error(`[WIDETECH] ❌ FALLÓ ${placa} después de ${maxAttempts} intentos: ${lastError}`);
          results.push({
            placa,
            success: false,
            error: `Falló después de ${maxAttempts} intentos: ${lastError}`
          });
          continue;
        }
        
        // Verificar error 109 (consultado muy rápido)
        if (responseText.includes('<code>109</code>')) {
          console.log(`[WIDETECH] ⚠️ ERROR 109 para ${placa}: consultado muy rápido`);
          
          if (cached) {
            console.log(`[WIDETECH] 💾 Usando cache anterior por error 109`);
            results.push({
              placa,
              success: true,
              location: cached.data,
              fromCache: true,
              cacheAge: Math.ceil((now - cached.lastRequestTime) / 1000),
              warning: 'Error 109: usando cache'
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
        
        // Verificar si la respuesta contiene error
        if (responseText.includes('<code>') && !responseText.includes('<Latitude>')) {
          const errorCodeMatch = responseText.match(/<code>(\d+)<\/code>/);
          const errorMsgMatch = responseText.match(/<message>([^<]+)<\/message>/);
          const errorCode = errorCodeMatch ? errorCodeMatch[1] : 'unknown';
          const errorMsg = errorMsgMatch ? errorMsgMatch[1] : 'Error desconocido';
          
          console.log(`[WIDETECH] ❌ Error ${errorCode} para ${placa}: ${errorMsg}`);
          
          results.push({
            placa,
            success: false,
            error: `Error ${errorCode}: ${errorMsg}`
          });
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
          const latitude = parseFloat(latMatch[1]);
          const longitude = parseFloat(lngMatch[1]);
          const rawAddress = locationMatch ? locationMatch[1].trim() : 'Ubicación desconocida';
          
          // 🎯 DETECCIÓN INTELIGENTE DE UBICACIONES GPS - RADIOS AMPLIOS
          let finalAddress = rawAddress;
          let ubicacionTipo = 'genérica';
          
          // 📍 BASE DE DATOS DE DESTINOS CON COORDENADAS GPS - RADIOS AUMENTADOS
          const DESTINOS_GPS = [
            { lat: 18.9667, lng: -97.6500, nombre: 'GRANJAS CARROLL', ciudad: 'Oriental', estado: 'Puebla', radio: 2000 },
            { lat: 25.6866, lng: -100.3161, nombre: 'CEDIS Walmart Monterrey', ciudad: 'Monterrey', estado: 'Nuevo León', radio: 1500 },
            { lat: 28.6353, lng: -106.0889, nombre: 'CEDIS Walmart Chihuahua', ciudad: 'Chihuahua', estado: 'Chihuahua', radio: 1500 },
            { lat: 19.4326, lng: -99.1332, nombre: 'Central de Abastos CDMX', ciudad: 'CDMX', estado: 'Ciudad de México', radio: 1500 },
            { lat: 19.0414, lng: -98.2063, nombre: 'Central de Abastos Puebla', ciudad: 'Puebla', estado: 'Puebla', radio: 1200 },
            { lat: 20.6736, lng: -103.3496, nombre: 'CEDIS Soriana Guadalajara', ciudad: 'Guadalajara', estado: 'Jalisco', radio: 1500 },
            { lat: 19.1738, lng: -96.1342, nombre: 'CEDIS Chedraui Veracruz', ciudad: 'Veracruz', estado: 'Veracruz', radio: 1200 },
            { lat: 21.8853, lng: -102.2916, nombre: 'WM Aguascalientes', ciudad: 'Aguascalientes', estado: 'Aguascalientes', radio: 1500 },
            { lat: 22.1565, lng: -100.9855, nombre: 'CEDIS HEB San Luis Potosí', ciudad: 'San Luis Potosí', estado: 'San Luis Potosí', radio: 1500 },
            { lat: 20.5888, lng: -100.3899, nombre: 'CEDIS Costco Querétaro', ciudad: 'Querétaro', estado: 'Querétaro', radio: 1500 },
            { lat: 28.6441, lng: -106.0967, nombre: 'CEDIS Costco Chihuahua', ciudad: 'Chihuahua', estado: 'Chihuahua', radio: 1500 },
            { lat: 21.1227, lng: -101.6827, nombre: 'CEDIS La Comer León', ciudad: 'León', estado: 'Guanajuato', radio: 1500 },
            { lat: 20.6597, lng: -103.3496, nombre: 'CEDIS Guadalajara', ciudad: 'Guadalajara', estado: 'Jalisco', radio: 1500 },
            { lat: 32.5149, lng: -117.0382, nombre: 'CEDIS Tijuana', ciudad: 'Tijuana', estado: 'Baja California', radio: 2000 },
            { lat: 29.0729, lng: -110.9559, nombre: 'CEDIS Hermosillo', ciudad: 'Hermosillo', estado: 'Sonora', radio: 1800 },
            { lat: 21.1619, lng: -86.8515, nombre: 'CEDIS Cancún', ciudad: 'Cancún', estado: 'Quintana Roo', radio: 1500 },
            { lat: 20.9674, lng: -89.5926, nombre: 'CEDIS Mérida', ciudad: 'Mérida', estado: 'Yucatán', radio: 1500 },
            { lat: 16.7516, lng: -93.1029, nombre: 'Empacadora Chiapas', ciudad: 'Tuxtla Gutiérrez', estado: 'Chiapas', radio: 1200 },
            { lat: 17.0732, lng: -96.7266, nombre: 'Loma Bonita', ciudad: 'Oaxaca', estado: 'Oaxaca', radio: 1200 },
            { lat: 20.1011, lng: -98.7624, nombre: 'La Providencia', ciudad: 'Pachuca', estado: 'Hidalgo', radio: 1200 }
          ];
          
          // Función para calcular distancia en metros entre dos puntos GPS (fórmula Haversine)
          const calcularDistancia = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
            const R = 6371000;
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a = 
              Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            return R * c;
          };
          
          // Verificar todos los destinos GPS (sale al encontrar el primero)
          for (const destino of DESTINOS_GPS) {
            const distancia = calcularDistancia(latitude, longitude, destino.lat, destino.lng);
            
            if (distancia <= destino.radio) {
              finalAddress = `${destino.nombre}, ${destino.ciudad}, ${destino.estado}`;
              ubicacionTipo = destino.nombre.toLowerCase().replace(/\s+/g, '-');
              console.log(`[GPS INTELIGENTE] 📍 ${placa} en ${destino.nombre} (${Math.round(distancia)}m)`);
              break;
            }
          }
          
          const location = {
            placa,
            latitude,
            longitude,
            speed: speedMatch ? parseFloat(speedMatch[1]) : 0,
            heading: headingMatch ? headingMatch[1] : 'N/A',
            address: finalAddress,
            addressOriginal: rawAddress,
            ubicacionTipo,
            timestamp: dateTimeMatch ? dateTimeMatch[1] : new Date().toISOString(),
            odometer: odometerMatch ? parseFloat(odometerMatch[1]) : 0,
            ignition: ignitionMatch ? (ignitionMatch[1] === '1' ? 'ON' : 'OFF') : 'N/A',
            temperatura1: temp1Match ? parseFloat(temp1Match[1]) : null,
            temperatura2: temp2Match ? parseFloat(temp2Match[1]) : null
          };
          
          console.log(`[WIDETECH] ✅ ${placa}: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)} | ${location.address.substring(0, 50)}`);
          
          // 4️⃣ GUARDAR EN CACHE
          WIDETECH_CACHE[placa] = {
            data: location,
            lastRequestTime: Date.now()
          };
          
          results.push({
            placa,
            success: true,
            location,
            fromCache: false
          });
          
          apiCallsCount++;
          
        } else {
          console.log(`[WIDETECH] ❌ ${placa}: XML sin coordenadas GPS`);
          console.log(`[WIDETECH] 📄 Primeros 500 chars: ${responseText.substring(0, 500)}`);
          
          results.push({
            placa,
            success: false,
            error: 'No se encontraron coordenadas GPS en la respuesta'
          });
        }
        
        // 5️⃣ DELAY entre consultas API (2 segundos - ULTRA SEGURO contra HTTP 500)
        if (i < placas.length - 1 && !cached) {
          console.log(`[WIDETECH] ⏳ Esperando 2s antes de siguiente consulta...`);
          await delay(2000);
        }
        
      } catch (error) {
        console.error(`[WIDETECH] ❌ Error inesperado en ${placa}:`, error);
        results.push({
          placa,
          success: false,
          error: String(error)
        });
      }
    }
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const fromCache = results.filter(r => r.success && r.fromCache).length;
    
    console.log(`\n[WIDETECH BATCH] ═══════════════════════════════`);
    console.log(`[WIDETECH BATCH] ✅ Exitosos: ${successful}/${placas.length}`);
    console.log(`[WIDETECH BATCH] ❌ Fallidos: ${failed}/${placas.length}`);
    console.log(`[WIDETECH BATCH] 💾 Desde cache: ${fromCache}`);
    console.log(`[WIDETECH BATCH] 🌐 Llamadas API nuevas: ${apiCallsCount}`);
    console.log(`[WIDETECH BATCH] ═══════════════════════════════\n`);
    
    return c.json({
      success: true,
      results,
      total: placas.length,
      successful,
      failed,
      fromCache,
      apiCalls: apiCallsCount
    });
  } catch (error) {
    console.error(`[POST /widetech/locations/batch] Error general: ${error}`);
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

// ==================== NEWS ENDPOINTS ====================
// Montar el router de noticias
app.route('/make-server-d84b50bb/news', newsApp);

// ==================== GRANJAS CARROLL - UNIDADES Y GEOCERCAS ====================

// 📍 GEOCERCAS PREDEFINIDAS (30 clientes principales Granjas Carroll)
const GEOCERCAS_DEFAULT = [
  // ORIGEN
  { id: 'gc-origen', nombre: 'Granjas Carroll', ciudad: 'Oriental', estado: 'Puebla', lat: 19.2394, lng: -97.6550, radio: 500 },
  
  // WALMART
  { id: 'gc-walmart-mty', nombre: 'CEDIS Walmart Monterrey', ciudad: 'Monterrey', estado: 'Nuevo León', lat: 25.6866, lng: -100.3161, radio: 800 },
  { id: 'gc-walmart-chi', nombre: 'CEDIS Walmart Chihuahua', ciudad: 'Chihuahua', estado: 'Chihuahua', lat: 28.6353, lng: -106.0889, radio: 800 },
  { id: 'gc-walmart-gdl', nombre: 'CEDIS Walmart Guadalajara', ciudad: 'Guadalajara', estado: 'Jalisco', lat: 20.6597, lng: -103.3496, radio: 800 },
  { id: 'gc-walmart-ags', nombre: 'CEDIS Walmart Aguascalientes', ciudad: 'Aguascalientes', estado: 'Aguascalientes', lat: 21.8853, lng: -102.2916, radio: 800 },
  { id: 'gc-walmart-tijuana', nombre: 'CEDIS Walmart Tijuana', ciudad: 'Tijuana', estado: 'Baja California', lat: 32.5149, lng: -116.9716, radio: 800 },
  
  // SORIANA
  { id: 'gc-soriana-gdl', nombre: 'CEDIS Soriana Guadalajara', ciudad: 'Guadalajara', estado: 'Jalisco', lat: 20.6534, lng: -103.4047, radio: 600 },
  { id: 'gc-soriana-mty', nombre: 'CEDIS Soriana Monterrey', ciudad: 'Monterrey', estado: 'Nuevo León', lat: 25.6756, lng: -100.3084, radio: 600 },
  { id: 'gc-soriana-hermosillo', nombre: 'CEDIS Soriana Hermosillo', ciudad: 'Hermosillo', estado: 'Sonora', lat: 29.0892, lng: -110.9611, radio: 600 },
  
  // CHEDRAUI
  { id: 'gc-chedraui-ver', nombre: 'CEDIS Chedraui Veracruz', ciudad: 'Veracruz', estado: 'Veracruz', lat: 19.1738, lng: -96.1342, radio: 600 },
  { id: 'gc-chedraui-puebla', nombre: 'CEDIS Chedraui Puebla', ciudad: 'Puebla', estado: 'Puebla', lat: 19.0414, lng: -98.2063, radio: 600 },
  
  // HEB
  { id: 'gc-heb-slp', nombre: 'CEDIS HEB San Luis Potosí', ciudad: 'San Luis Potosí', estado: 'San Luis Potosí', lat: 22.1565, lng: -100.9855, radio: 600 },
  { id: 'gc-heb-mty', nombre: 'CEDIS HEB Monterrey', ciudad: 'Monterrey', estado: 'Nuevo León', lat: 25.6872, lng: -100.3165, radio: 600 },
  
  // COSTCO
  { id: 'gc-costco-qro', nombre: 'CEDIS Costco Querétaro', ciudad: 'Querétaro', estado: 'Querétaro', lat: 20.5888, lng: -100.3899, radio: 700 },
  { id: 'gc-costco-chi', nombre: 'CEDIS Costco Chihuahua', ciudad: 'Chihuahua', estado: 'Chihuahua', lat: 28.6450, lng: -106.0830, radio: 700 },
  { id: 'gc-costco-gdl', nombre: 'CEDIS Costco Guadalajara', ciudad: 'Guadalajara', estado: 'Jalisco', lat: 20.6720, lng: -103.3880, radio: 700 },
  
  // LA COMER
  { id: 'gc-lacomer-leon', nombre: 'CEDIS La Comer León', ciudad: 'León', estado: 'Guanajuato', lat: 21.1216, lng: -101.6828, radio: 600 },
  { id: 'gc-lacomer-cdmx', nombre: 'CEDIS La Comer CDMX', ciudad: 'Ciudad de México', estado: 'Ciudad de México', lat: 19.4326, lng: -99.1332, radio: 600 },
  
  // CENTRAL DE ABASTOS
  { id: 'gc-abastos-cdmx', nombre: 'Central de Abastos CDMX', ciudad: 'Ciudad de México', estado: 'Ciudad de México', lat: 19.3758, lng: -99.0909, radio: 1000 },
  { id: 'gc-abastos-puebla', nombre: 'Central de Abastos Puebla', ciudad: 'Puebla', estado: 'Puebla', lat: 19.0326, lng: -98.1800, radio: 800 },
  { id: 'gc-abastos-gdl', nombre: 'Central de Abastos Guadalajara', ciudad: 'Guadalajara', estado: 'Jalisco', lat: 20.6688, lng: -103.2888, radio: 800 },
  
  // OTROS
  { id: 'gc-hermosillo', nombre: 'CEDIS Hermosillo', ciudad: 'Hermosillo', estado: 'Sonora', lat: 29.0892, lng: -110.9611, radio: 800 },
  { id: 'gc-cancun', nombre: 'CEDIS Cancún', ciudad: 'Cancún', estado: 'Quintana Roo', lat: 21.1619, lng: -86.8515, radio: 800 },
  { id: 'gc-merida', nombre: 'CEDIS Mérida', ciudad: 'Mérida', estado: 'Yucatán', lat: 20.9674, lng: -89.5926, radio: 800 },
  { id: 'gc-tuxtla', nombre: 'Empacadora Chiapas', ciudad: 'Tuxtla Gutiérrez', estado: 'Chiapas', lat: 16.7569, lng: -93.1292, radio: 600 },
  { id: 'gc-oaxaca', nombre: 'Loma Bonita', ciudad: 'Oaxaca', estado: 'Oaxaca', lat: 17.0732, lng: -96.7266, radio: 600 },
  { id: 'gc-pachuca', nombre: 'La Providencia', ciudad: 'Pachuca', estado: 'Hidalgo', lat: 20.1011, lng: -98.7624, radio: 600 },
  { id: 'gc-toluca', nombre: 'CEDIS Toluca', ciudad: 'Toluca', estado: 'Estado de México', lat: 19.2827, lng: -99.6557, radio: 700 },
  { id: 'gc-leon', nombre: 'CEDIS León', ciudad: 'León', estado: 'Guanajuato', lat: 21.1216, lng: -101.6828, radio: 700 },
  { id: 'gc-villahermosa', nombre: 'CEDIS Villahermosa', ciudad: 'Villahermosa', estado: 'Tabasco', lat: 17.9892, lng: -92.9475, radio: 700 }
];

// Función auxiliar para calcular distancia entre dos puntos (fórmula Haversine)
function calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Radio de la Tierra en metros
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Función para detectar geocerca
function detectarGeocerca(lat: number, lng: number, geocercas: any[]): any | null {
  for (const geocerca of geocercas) {
    const distancia = calcularDistancia(lat, lng, geocerca.lat, geocerca.lng);
    if (distancia <= geocerca.radio) {
      return { ...geocerca, distanciaMetros: Math.round(distancia) };
    }
  }
  return null;
}

// GET: Obtener todas las unidades Carroll
app.get('/make-server-d84b50bb/carroll/unidades', async (c) => {
  try {
    const unidades = await kv.getByPrefix('carroll-unidad-');
    console.log(`[GET /carroll/unidades] Retrieved ${unidades.length} unidades`);
    return c.json({ success: true, unidades: unidades.map((u: any) => u.value) });
  } catch (error) {
    console.error('[GET /carroll/unidades] Error:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// POST: Crear/actualizar unidad Carroll
app.post('/make-server-d84b50bb/carroll/unidades', async (c) => {
  try {
    const unidad = await c.req.json();
    if (!unidad.numeroTracto) {
      return c.json({ success: false, error: 'Número de tracto requerido' }, 400);
    }
    
    const key = `carroll-unidad-${unidad.numeroTracto}`;
    await kv.set(key, unidad);
    console.log(`[POST /carroll/unidades] Unidad guardada: ${unidad.numeroTracto}`);
    
    return c.json({ success: true, unidad });
  } catch (error) {
    console.error('[POST /carroll/unidades] Error:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// DELETE: Eliminar unidad Carroll
app.delete('/make-server-d84b50bb/carroll/unidades/:numeroTracto', async (c) => {
  try {
    const numeroTracto = c.req.param('numeroTracto');
    const key = `carroll-unidad-${numeroTracto}`;
    
    await kv.del(key);
    console.log(`[DELETE /carroll/unidades] Unidad eliminada: ${numeroTracto}`);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('[DELETE /carroll/unidades] Error:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// GET: Obtener todas las geocercas
app.get('/make-server-d84b50bb/carroll/geocercas', async (c) => {
  try {
    let geocercas = await kv.getByPrefix('carroll-geocerca-');
    
    // Si no hay geocercas, inicializar con las default
    if (geocercas.length === 0) {
      console.log('[GET /carroll/geocercas] No hay geocercas, inicializando con default...');
      for (const geocerca of GEOCERCAS_DEFAULT) {
        await kv.set(`carroll-geocerca-${geocerca.id}`, geocerca);
      }
      geocercas = GEOCERCAS_DEFAULT.map(g => ({ value: g }));
    }
    
    console.log(`[GET /carroll/geocercas] Retrieved ${geocercas.length} geocercas`);
    return c.json({ success: true, geocercas: geocercas.map((g: any) => g.value) });
  } catch (error) {
    console.error('[GET /carroll/geocercas] Error:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// POST: Crear/actualizar geocerca
app.post('/make-server-d84b50bb/carroll/geocercas', async (c) => {
  try {
    const geocerca = await c.req.json();
    if (!geocerca.id || !geocerca.nombre || geocerca.lat === undefined || geocerca.lng === undefined) {
      return c.json({ success: false, error: 'Campos requeridos: id, nombre, lat, lng' }, 400);
    }
    
    const key = `carroll-geocerca-${geocerca.id}`;
    await kv.set(key, geocerca);
    console.log(`[POST /carroll/geocercas] Geocerca guardada: ${geocerca.id}`);
    
    return c.json({ success: true, geocerca });
  } catch (error) {
    console.error('[POST /carroll/geocercas] Error:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// DELETE: Eliminar geocerca
app.delete('/make-server-d84b50bb/carroll/geocercas/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const key = `carroll-geocerca-${id}`;
    
    await kv.del(key);
    console.log(`[DELETE /carroll/geocercas] Geocerca eliminada: ${id}`);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('[DELETE /carroll/geocercas] Error:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// POST: Detectar geocerca para una ubicación específica
app.post('/make-server-d84b50bb/carroll/detectar-geocerca', async (c) => {
  try {
    const { lat, lng } = await c.req.json();
    
    if (lat === undefined || lng === undefined) {
      return c.json({ success: false, error: 'Latitud y longitud requeridas' }, 400);
    }
    
    // Obtener geocercas
    let geocercas = await kv.getByPrefix('carroll-geocerca-');
    if (geocercas.length === 0) {
      geocercas = GEOCERCAS_DEFAULT.map(g => ({ value: g }));
    }
    
    const geocercasArray = geocercas.map((g: any) => g.value);
    const geocercaDetectada = detectarGeocerca(lat, lng, geocercasArray);
    
    if (geocercaDetectada) {
      console.log(`[POST /carroll/detectar-geocerca] Geocerca detectada: ${geocercaDetectada.nombre} (${geocercaDetectada.distanciaMetros}m)`);
      return c.json({ 
        success: true, 
        dentroDeGeocerca: true,
        geocerca: geocercaDetectada
      });
    } else {
      return c.json({ 
        success: true, 
        dentroDeGeocerca: false,
        geocerca: null
      });
    }
  } catch (error) {
    console.error('[POST /carroll/detectar-geocerca] Error:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== ALTA DE CLIENTES - RESEND EMAIL ====================

// POST: Enviar solicitud de alta de cliente por correo
app.post('/make-server-d84b50bb/alta-cliente/enviar', async (c) => {
  try {
    const { 
      emailCliente, 
      nombreCliente, 
      apellidoCliente,
      emailsAdicionales,
      enviadoPor,
      tipoEmpresa 
    } = await c.req.json();
    
    if (!emailCliente || !enviadoPor) {
      return c.json({ success: false, error: 'Email del cliente y enviado por son requeridos' }, 400);
    }
    
    // 1. Crear registro en Supabase
    const { data: altaData, error: altaError } = await supabase
      .from('alta_clientes')
      .insert({
        email_cliente: emailCliente,
        nombre_cliente: nombreCliente || null,
        apellido_cliente: apellidoCliente || null,
        emails_adicionales: emailsAdicionales || [],
        enviado_por: enviadoPor,
        tipo_empresa: tipoEmpresa || 'MEXICANA',
        estatus: 'ENVIADA'
      })
      .select()
      .single();
    
    if (altaError) {
      console.error('[ALTA CLIENTE] Error creando registro:', altaError);
      return c.json({ success: false, error: 'Error al crear solicitud' }, 500);
    }
    
    const solicitudId = altaData.id;
    const linkFormulario = `https://jjcrm27.com/alta/${solicitudId}`;
    
    // 2. Enviar correo con Resend
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    
    if (!RESEND_API_KEY) {
      console.error('[ALTA CLIENTE] RESEND_API_KEY no configurada');
      return c.json({ success: false, error: 'Configuracion de correo no disponible' }, 500);
    }
    
    const destinatarios = [emailCliente, ...(emailsAdicionales || [])].filter(Boolean);
    const emailHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f0f0f0;font-family:Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0f0;padding:20px 10px;"><tr><td align="center"><table width="750" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #dddddd;"><tr><td style="background:#001f4d;padding:25px 40px;text-align:center;"><h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:bold;letter-spacing:3px;">GRUPO LOMA</h1><p style="color:#7eb8ff;margin:8px 0 0;font-size:12px;letter-spacing:1px;">TROB TRANSPORTES &bull; WEXPRESS &bull; SPEEDY HAUL &bull; TROB USA</p></td></tr><tr><td style="padding:35px 40px;"><h2 style="color:#001f4d;margin:0 0 20px;font-size:20px;">Solicitud de Alta de Cliente</h2><p style="color:#333333;font-size:15px;line-height:1.6;margin:0 0 15px;">Estimado(a) <strong>${nombreCliente || ''} ${apellidoCliente || ''}</strong>,</p><p style="color:#333333;font-size:15px;line-height:1.6;margin:0 0 25px;">Hemos recibido una solicitud para registrarlo como cliente de <strong>Grupo Loma | TROB Transportes</strong>. Por favor complete el formulario haciendo clic en el siguiente botón:</p><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:10px 0 30px;"><a href="${linkFormulario}" style="display:inline-block;background:#e65100;color:#ffffff;text-decoration:none;padding:15px 50px;font-size:16px;font-weight:bold;">COMPLETAR FORMULARIO</a></td></tr></table><table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;border-left:4px solid #001f4d;"><tr><td style="padding:20px;"><p style="color:#001f4d;font-size:14px;font-weight:bold;margin:0 0 10px;">Documentos Requeridos:</p><p style="color:#555555;font-size:13px;line-height:2;margin:0;">${tipoEmpresa === 'USA_CANADA' ? '&#8226; W-9 Form &nbsp;&nbsp; &#8226; Bank Statement (últimos 3 meses) &nbsp;&nbsp; &#8226; MC# / DOT# Certificate<br>&#8226; Void Check &nbsp;&nbsp; &#8226; Proof of Address &nbsp;&nbsp; &#8226; ID del Representante Legal' : '&#8226; Constancia de Situación Fiscal (mes actual) &nbsp;&nbsp; &#8226; Opinión de Cumplimiento<br>&#8226; Comprobante de Domicilio (máx. 3 meses) &nbsp;&nbsp; &#8226; INE del Representante Legal<br>&#8226; Acta Constitutiva &nbsp;&nbsp; &#8226; Poder Notarial (si aplica)'}</p></td></tr></table><p style="color:#999999;font-size:11px;margin:25px 0 0;">Si el botón no funciona: <a href="${linkFormulario}" style="color:#0066cc;">${linkFormulario}</a></p></td></tr><tr><td style="background:#001f4d;padding:20px 40px;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="color:#ffffff;font-size:13px;"><strong>¿Dudas o consultas?</strong><br><a href="mailto:juan.viveros@trob.com.mx" style="color:#7eb8ff;">juan.viveros@trob.com.mx</a> &nbsp;|&nbsp; Tel: +52 811 239 22 66</td><td align="right" style="color:#7eb8ff;font-size:11px;">© 2025 Grupo Loma<br>www.trobtransportes.com</td></tr></table></td></tr></table></td></tr></table></body></html>`;
    
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Grupo Loma <noreply@mail.jjcrm27.com>',
        to: destinatarios,
        subject: 'Solicitud de Alta de Cliente - Grupo Loma | TROB Transportes',
        html: emailHtml
      })
    });
    
    const resendData = await resendResponse.json();
    if (!resendResponse.ok) {
      console.error('[ALTA CLIENTE] Error Resend:', resendData);
      return c.json({ success: false, error: 'Error al enviar correo' }, 500);
    }
    
    console.log(`[ALTA CLIENTE] Correo enviado a: ${destinatarios.join(', ')}`);
    return c.json({ success: true, solicitudId, linkFormulario, emailsEnviados: destinatarios });
  } catch (error) {
    console.error('[ALTA CLIENTE] Error:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// GET: Obtener solicitud por ID
app.get('/make-server-d84b50bb/alta-cliente/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const { data, error } = await supabase.from('alta_clientes').select('*').eq('id', id).single();
    if (error || !data) return c.json({ success: false, error: 'Solicitud no encontrada' }, 404);
    return c.json({ success: true, solicitud: data });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// PUT: Actualizar solicitud
app.put('/make-server-d84b50bb/alta-cliente/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const datosFormulario = await c.req.json();
    const clientIP = c.req.header('x-forwarded-for') || 'unknown';
    const userAgent = c.req.header('user-agent') || 'unknown';
    
    const { data, error } = await supabase.from('alta_clientes').update({
      ...datosFormulario,
      firma_ip: clientIP,
      firma_user_agent: userAgent,
      firma_fecha: datosFormulario.firma_aceptada ? new Date().toISOString() : null,
      estatus: datosFormulario.firma_aceptada ? 'COMPLETADA' : 'EN_PROCESO',
      fecha_completado: datosFormulario.firma_aceptada ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    }).eq('id', id).select().single();
    
    if (error) return c.json({ success: false, error: 'Error al actualizar' }, 500);
    
    if (datosFormulario.firma_aceptada) {
      const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
      const correosNotificacion = ['nancy.alonso@trob.com.mx','juan.viveros@trob.com.mx','claudia.priana@trob.com.mx','martha.velasco@trob.com.mx',data.enviado_por].filter(Boolean);
      
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'FX27 <noreply@mail.jjcrm27.com>',
          to: correosNotificacion,
          subject: `Alta Completada - ${data.razon_social || data.email_cliente}`,
          html: `<h2>Nueva Alta de Cliente Completada</h2><p><strong>Razon Social:</strong> ${data.razon_social || 'N/A'}</p><p><strong>RFC:</strong> ${data.rfc_mc || 'N/A'}</p><p><strong>Email:</strong> ${data.email_cliente}</p><p><strong>Enviado por:</strong> ${data.enviado_por}</p>`
        })
      });
    }
    
    return c.json({ success: true, solicitud: data });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// GET: Listar todas las solicitudes
app.get('/make-server-d84b50bb/alta-clientes', async (c) => {
  try {
    const { data, error } = await supabase.from('alta_clientes').select('*').order('created_at', { ascending: false });
    if (error) return c.json({ success: false, error: 'Error al obtener solicitudes' }, 500);
    return c.json({ success: true, solicitudes: data });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// POST: Subir documento
app.post('/make-server-d84b50bb/alta-cliente/:id/documento', async (c) => {
  try {
    const altaClienteId = c.req.param('id');
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const tipoDocumento = formData.get('tipo') as string;
    
    if (!file || !tipoDocumento) return c.json({ success: false, error: 'Archivo y tipo requeridos' }, 400);
    
    const fileName = `alta-clientes/${altaClienteId}/${tipoDocumento}_${Date.now()}_${file.name}`;
    const fileBuffer = await file.arrayBuffer();
    
    const { data: uploadData, error: uploadError } = await supabase.storage.from('alta-clientes-docs').upload(fileName, fileBuffer, { contentType: file.type });
    if (uploadError) return c.json({ success: false, error: 'Error al subir' }, 500);
    
    const { data: docData } = await supabase.from('alta_clientes_documentos').insert({
      alta_cliente_id: altaClienteId,
      tipo_documento: tipoDocumento,
      nombre_archivo: file.name,
      ruta_storage: uploadData.path,
      tamano_bytes: file.size
    }).select().single();
    
    return c.json({ success: true, documento: docData });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// GET: Obtener documentos
app.get('/make-server-d84b50bb/alta-cliente/:id/documentos', async (c) => {
  try {
    const { data } = await supabase.from('alta_clientes_documentos').select('*').eq('alta_cliente_id', c.req.param('id'));
    return c.json({ success: true, documentos: data });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});


Deno.serve(app.fetch);





