// ==================== UTILIDADES DE GEOCODIFICACIÓN ====================

interface Coordenadas {
  lat: number;
  lng: number;
}

interface UbicacionDetallada {
  direccionCompleta: string;
  municipio: string;
  estado: string;
  codigoPostal: string;
  pais: string;
  esGranjasCarroll: boolean;
  distanciaAGranjasCarroll: number;
}

// 🏭 COORDENADAS EXACTAS DE GRANJAS CARROLL, ORIENTAL PUEBLA
export const GRANJAS_CARROLL_COORDS: Coordenadas = {
  lat: 19.3419,
  lng: -97.6664
};

// Radio de detección en metros
const RADIO_GRANJAS_CARROLL = 500; // 500 metros

/**
 * Calcula la distancia entre dos puntos GPS usando la fórmula de Haversine
 * @param coord1 Primera coordenada
 * @param coord2 Segunda coordenada
 * @returns Distancia en metros
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
 * Verifica si una coordenada está dentro del radio de Granjas Carroll
 * @param coord Coordenada a verificar
 * @returns true si está dentro del radio de 500m
 */
export function estaEnGranjasCarroll(coord: Coordenadas): boolean {
  const distancia = calcularDistancia(coord, GRANJAS_CARROLL_COORDS);
  return distancia <= RADIO_GRANJAS_CARROLL;
}

/**
 * Obtiene información detallada de ubicación usando Google Maps Geocoding API
 * @param coord Coordenadas GPS
 * @param googleMapsApiKey API Key de Google Maps
 * @returns Información detallada de la ubicación
 */
export async function obtenerUbicacionDetallada(
  coord: Coordenadas,
  googleMapsApiKey: string
): Promise<UbicacionDetallada> {
  // Verificar si está en Granjas Carroll PRIMERO
  const distanciaAGranjasCarroll = calcularDistancia(coord, GRANJAS_CARROLL_COORDS);
  const esGranjasCarroll = distanciaAGranjasCarroll <= RADIO_GRANJAS_CARROLL;

  // Si está en Granjas Carroll, retornar inmediatamente sin hacer llamada a API
  if (esGranjasCarroll) {
    return {
      direccionCompleta: 'Granjas Carroll, Oriental Puebla',
      municipio: 'Oriental',
      estado: 'Puebla',
      codigoPostal: '75021',
      pais: 'México',
      esGranjasCarroll: true,
      distanciaAGranjasCarroll: Math.round(distanciaAGranjasCarroll)
    };
  }

  // Si NO está en Granjas Carroll, hacer reverse geocoding con Google Maps
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coord.lat},${coord.lng}&key=${googleMapsApiKey}&language=es`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0];
      
      // Extraer componentes de la dirección
      let municipio = '';
      let estado = '';
      let codigoPostal = '';
      let pais = '';

      for (const component of result.address_components) {
        if (component.types.includes('locality')) {
          municipio = component.long_name;
        }
        if (component.types.includes('administrative_area_level_1')) {
          estado = component.short_name;
        }
        if (component.types.includes('postal_code')) {
          codigoPostal = component.long_name;
        }
        if (component.types.includes('country')) {
          pais = component.long_name;
        }
      }

      return {
        direccionCompleta: result.formatted_address,
        municipio,
        estado,
        codigoPostal,
        pais,
        esGranjasCarroll: false,
        distanciaAGranjasCarroll: Math.round(distanciaAGranjasCarroll)
      };
    }
  } catch (error) {
    console.error('Error en reverse geocoding:', error);
  }

  // Fallback si falla la API
  return {
    direccionCompleta: `${coord.lat.toFixed(4)}, ${coord.lng.toFixed(4)}`,
    municipio: 'Desconocido',
    estado: 'Desconocido',
    codigoPostal: '',
    pais: 'México',
    esGranjasCarroll: false,
    distanciaAGranjasCarroll: Math.round(distanciaAGranjasCarroll)
  };
}

/**
 * Formatea una ubicación detallada en texto corto
 * @param ubicacion Ubicación detallada
 * @returns Texto formateado
 */
export function formatearUbicacionCorta(ubicacion: UbicacionDetallada): string {
  if (ubicacion.esGranjasCarroll) {
    return '🏭 Granjas Carroll, Oriental Puebla';
  }
  
  if (ubicacion.municipio && ubicacion.estado) {
    return `${ubicacion.municipio}, ${ubicacion.estado}`;
  }
  
  return ubicacion.direccionCompleta;
}

/**
 * Formatea una ubicación detallada en texto largo
 * @param ubicacion Ubicación detallada
 * @returns Texto formateado completo
 */
export function formatearUbicacionCompleta(ubicacion: UbicacionDetallada): string {
  if (ubicacion.esGranjasCarroll) {
    return `🏭 Granjas Carroll de México, S de RL de CV\n75021 Oriental, Puebla\n(${ubicacion.distanciaAGranjasCarroll}m del centro)`;
  }
  
  return ubicacion.direccionCompleta;
}

// ==================== OTRAS GEOCERCAS (GEOFENCES) ====================
// Puedes agregar más ubicaciones importantes aquí

export const UBICACIONES_IMPORTANTES = [
  {
    nombre: 'Granjas Carroll, Oriental Puebla',
    coords: GRANJAS_CARROLL_COORDS,
    radio: 500,
    icono: '🏭',
    descripcion: 'Granjas Carroll de México, S de RL de CV'
  },
  {
    nombre: 'Warlo',
    coords: { lat: 19.0427, lng: -97.5922 }, // Coordenadas aproximadas
    radio: 300,
    icono: '🏪',
    descripcion: 'Warlo - Punto de carga/descarga'
  },
  {
    nombre: 'Frialsa Frigoríficos',
    coords: { lat: 19.0427, lng: -97.5922 }, // Coordenadas aproximadas
    radio: 300,
    icono: '❄️',
    descripcion: 'Frialsa Frigoríficos - Almacén refrigerado'
  }
];

/**
 * Detecta si una coordenada está cerca de alguna ubicación importante
 * @param coord Coordenada a verificar
 * @returns Ubicación importante más cercana si está dentro del radio
 */
export function detectarUbicacionImportante(coord: Coordenadas) {
  for (const ubicacion of UBICACIONES_IMPORTANTES) {
    const distancia = calcularDistancia(coord, ubicacion.coords);
    if (distancia <= ubicacion.radio) {
      return {
        ...ubicacion,
        distancia: Math.round(distancia)
      };
    }
  }
  return null;
}
