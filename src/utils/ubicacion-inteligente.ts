import { projectId, publicAnonKey } from './supabase/info';

// ==================== TIPOS ====================
export interface Coordenadas {
  lat: number;
  lng: number;
}

export interface ClienteConocido {
  nombre: string;
  coordenadas: Coordenadas;
}

export interface UbicacionDetallada {
  tipo: 'cliente-conocido' | 'ubicacion-generica';
  nombreCliente?: string;
  municipio: string;
  estado: string;
  referenciaAdicional?: string;
  direccionCompleta: string;
}

// ==================== GRANJAS CARROLL (500m) ====================
const GRANJAS_CARROLL: Coordenadas = {
  lat: 19.3419,
  lng: -97.6664
};

// ==================== FUNCIONES DE DISTANCIA ====================
/**
 * Calcula la distancia en metros entre dos coordenadas GPS usando la fórmula de Haversine
 */
export function calcularDistancia(coord1: Coordenadas, coord2: Coordenadas): number {
  const R = 6371e3; // Radio de la Tierra en metros
  const φ1 = (coord1.lat * Math.PI) / 180;
  const φ2 = (coord2.lat * Math.PI) / 180;
  const Δφ = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const Δλ = ((coord2.lng - coord1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distancia en metros
}

/**
 * Verifica si una unidad está en Granjas Carroll (radio 500m)
 */
export function estaEnGranjasCarroll(coord: Coordenadas): boolean {
  const distancia = calcularDistancia(coord, GRANJAS_CARROLL);
  return distancia <= 500;
}

/**
 * Verifica si una unidad está cerca de un cliente conocido (radio 100m)
 */
export function clienteCercano(
  coord: Coordenadas,
  clientes: ClienteConocido[]
): ClienteConocido | null {
  for (const cliente of clientes) {
    const distancia = calcularDistancia(coord, cliente.coordenadas);
    if (distancia <= 100) {
      return cliente;
    }
  }
  return null;
}

// ==================== EXTRACCIÓN DE COORDENADAS DE URLs ====================
/**
 * Extrae coordenadas de una URL de Google Maps
 * Soporta formatos:
 * - https://maps.app.goo.gl/...
 * - https://www.google.com/maps?q=19.123,-98.456
 * - https://www.google.com/maps/@19.123,-98.456,15z
 */
export function extraerCoordenadasDeUrl(url: string): Coordenadas | null {
  if (!url) return null;

  try {
    // Formato: ?q=lat,lng
    const matchQ = url.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (matchQ) {
      return {
        lat: parseFloat(matchQ[1]),
        lng: parseFloat(matchQ[2])
      };
    }

    // Formato: /@lat,lng
    const matchAt = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (matchAt) {
      return {
        lat: parseFloat(matchAt[1]),
        lng: parseFloat(matchAt[2])
      };
    }

    // Formato: /place/.../@lat,lng (más común)
    const matchPlace = url.match(/place\/[^\/]+\/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (matchPlace) {
      return {
        lat: parseFloat(matchPlace[1]),
        lng: parseFloat(matchPlace[2])
      };
    }

    return null;
  } catch (error) {
    console.error('Error extrayendo coordenadas de URL:', error);
    return null;
  }
}

// ==================== OBTENER CLIENTES CONOCIDOS ====================
let clientesCache: ClienteConocido[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Obtiene la lista de clientes conocidos desde el catálogo de formatos
 * Con caché para optimizar rendimiento
 */
export async function obtenerClientesConocidos(): Promise<ClienteConocido[]> {
  // Usar caché si está disponible y válido
  const ahora = Date.now();
  if (clientesCache && (ahora - cacheTimestamp) < CACHE_DURATION) {
    return clientesCache;
  }

  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/formatos-venta`,
      {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      }
    );

    if (!response.ok) {
      console.error('Error obteniendo formatos de venta:', response.statusText);
      return [];
    }

    const data = await response.json();
    const formatos = data.formatos || [];

    // Extraer clientes únicos con coordenadas válidas
    const clientesMap = new Map<string, ClienteConocido>();

    for (const formato of formatos) {
      const coordenadas = extraerCoordenadasDeUrl(formato.ubicacionUrl);
      if (coordenadas && formato.destinoNickname) {
        // Usar destinoNickname como clave única
        const key = formato.destinoNickname.trim().toLowerCase();
        if (!clientesMap.has(key)) {
          clientesMap.set(key, {
            nombre: formato.destinoNickname.trim(),
            coordenadas
          });
        }
      }
    }

    clientesCache = Array.from(clientesMap.values());
    cacheTimestamp = ahora;

    console.log(`✅ Clientes conocidos cargados: ${clientesCache.length}`);
    return clientesCache;
  } catch (error) {
    console.error('Error obteniendo clientes conocidos:', error);
    return [];
  }
}

// ==================== GEOCODIFICACIÓN INVERSA ====================
/**
 * Obtiene información detallada de una ubicación GPS usando Google Maps Geocoding API
 */
export async function obtenerDireccionDetallada(
  coord: Coordenadas
): Promise<UbicacionDetallada | null> {
  try {
    // 1. Verificar si está en Granjas Carroll (prioridad máxima)
    if (estaEnGranjasCarroll(coord)) {
      return {
        tipo: 'cliente-conocido',
        nombreCliente: 'Granjas Carroll',
        municipio: 'Oriental',
        estado: 'Puebla',
        direccionCompleta: 'Granjas Carroll de México, Oriental, Puebla'
      };
    }

    // 2. Verificar si está cerca de algún cliente conocido
    const clientes = await obtenerClientesConocidos();
    const clienteCerca = clienteCercano(coord, clientes);

    // 3. Obtener información de geocodificación
    const apiKeyResponse = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/api-keys/google-maps`,
      {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      }
    );

    if (!apiKeyResponse.ok) {
      console.error('Error obteniendo API Key de Google Maps');
      return null;
    }

    const { apiKey } = await apiKeyResponse.json();
    if (!apiKey) {
      console.error('API Key de Google Maps no configurada');
      return null;
    }

    // 4. Llamar a Geocoding API
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coord.lat},${coord.lng}&key=${apiKey}&language=es`;
    const geocodeResponse = await fetch(geocodeUrl);
    const geocodeData = await geocodeResponse.json();

    if (geocodeData.status !== 'OK' || !geocodeData.results || geocodeData.results.length === 0) {
      console.error('Error en Geocoding API:', geocodeData.status);
      return null;
    }

    // 5. Extraer componentes de dirección
    const resultado = geocodeData.results[0];
    let municipio = '';
    let estado = '';
    let colonia = '';
    let calle = '';

    for (const componente of resultado.address_components) {
      const tipos = componente.types;
      
      if (tipos.includes('locality')) {
        municipio = componente.long_name;
      } else if (tipos.includes('administrative_area_level_1')) {
        estado = componente.short_name;
      } else if (tipos.includes('sublocality') || tipos.includes('sublocality_level_1')) {
        colonia = componente.long_name;
      } else if (tipos.includes('route')) {
        calle = componente.long_name;
      }
    }

    // 6. Construir referencia adicional
    let referenciaAdicional = '';
    if (colonia && calle) {
      referenciaAdicional = `${calle}, ${colonia}`;
    } else if (colonia) {
      referenciaAdicional = colonia;
    } else if (calle) {
      referenciaAdicional = calle;
    }

    // 7. Retornar resultado
    if (clienteCerca) {
      return {
        tipo: 'cliente-conocido',
        nombreCliente: clienteCerca.nombre,
        municipio,
        estado,
        referenciaAdicional,
        direccionCompleta: resultado.formatted_address
      };
    } else {
      return {
        tipo: 'ubicacion-generica',
        municipio,
        estado,
        referenciaAdicional,
        direccionCompleta: resultado.formatted_address
      };
    }
  } catch (error) {
    console.error('Error obteniendo dirección detallada:', error);
    return null;
  }
}

// ==================== FORMATEO DE UBICACIÓN ====================
/**
 * Formatea una ubicación detallada para mostrar en UI
 */
export function formatearUbicacion(ubicacion: UbicacionDetallada): {
  icono: string;
  textoCorto: string;
  textoCompleto: string;
} {
  if (ubicacion.tipo === 'cliente-conocido') {
    // Cliente conocido: 🏭 NOMBRE CLIENTE - Municipio, Estado
    const municipioEstado = `${ubicacion.municipio}, ${ubicacion.estado}`;
    return {
      icono: '🏭',
      textoCorto: `${ubicacion.nombreCliente}`,
      textoCompleto: `${ubicacion.nombreCliente} - ${municipioEstado}`
    };
  } else {
    // Ubicación genérica: 📍 Municipio, Estado (referencia)
    const municipioEstado = `${ubicacion.municipio}, ${ubicacion.estado}`;
    const referencia = ubicacion.referenciaAdicional 
      ? ` (${ubicacion.referenciaAdicional})` 
      : '';
    return {
      icono: '📍',
      textoCorto: municipioEstado,
      textoCompleto: `${municipioEstado}${referencia}`
    };
  }
}
