import { ModuleTemplate } from './ModuleTemplate';
import { MODULE_IMAGES } from '../../assets/module-images';
import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, DollarSign, Navigation, Package, Truck, FileText, Calculator, Save, X } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { AutocompleteInput } from './AutocompleteInput';

interface CotizacionesModuleProps {
  onBack: () => void;
}

interface Ruta {
  id: string;
  origen: string;
  destino: string;
  origenUSA?: string;
  destinoUSA?: string;
  distanciaKm: number | null;
  tiempoHoras: number | null;
}

interface FormCotizacion {
  nombreCliente: string;
  moneda: 'MXN' | 'USD';
  tipoCarga: 'seco' | 'refrigerado';
  clasificacionCarga: 'regular' | 'hazmat';
  tipoViaje: 'importacion' | 'exportacion' | 'nacional';
  tipoServicio: 'transbordo' | 'dtd' | 'domestico-usa';
  rutas: Ruta[];
  tarifaPorKm: number;
  costoCruce: number;
  costoTotal: number;
  incluyeCruce: boolean; // Nuevo campo
}

export const CotizacionesModule = ({ onBack }: CotizacionesModuleProps) => {
  const [formData, setFormData] = useState<FormCotizacion>({
    nombreCliente: '',
    moneda: '' as any, // Sin selección inicial
    tipoCarga: '' as any, // Sin selección inicial
    clasificacionCarga: '' as any, // Sin selección inicial
    tipoViaje: '' as any, // Sin selección inicial
    tipoServicio: '' as any, // Sin selección inicial
    rutas: [],
    tarifaPorKm: 0,
    costoCruce: 0,
    costoTotal: 0,
    incluyeCruce: false // Inicializado a false
  });

  const [nuevaRuta, setNuevaRuta] = useState<{origen: string; destino: string; origenUSA: string; destinoUSA: string}>({
    origen: '',
    destino: '',
    origenUSA: '',
    destinoUSA: ''
  });

  const [calculando, setCalculando] = useState(false);
  const [cotizaciones, setCotizaciones] = useState<FormCotizacion[]>([]);
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState<string>('AIzaSyD72DQyQqozE6lLySRnYCc5KSk9y-YiBno'); // API Key por defecto

  // Función para calcular distancia usando Google Maps Distance Matrix API
  const calcularDistancia = async (origen: string, destino: string): Promise<{distancia: number; tiempo: number} | null> => {
    try {
      setCalculando(true);
      
      // Llamar al backend que usa Google Maps API
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/maps/distance`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ origen, destino })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Error al calcular distancia');
      }
      
      setCalculando(false);
      
      return {
        distancia: data.distance.km,
        tiempo: data.duration.hours
      };
    } catch (error) {
      console.error('Error al calcular distancia:', error);
      const errorMessage = String(error).includes('Google Maps API Key no configurada')
        ? '🔑 Primero debes guardar la API Key de Google Maps.\n\n👉 Ve a: Configuración → Variables de Cotización → Click en "GUARDAR KEY"'
        : `Error al calcular distancia: ${error}\n\nVerifica que los lugares estén escritos correctamente.`;
      
      alert(errorMessage);
      setCalculando(false);
      return null;
    }
  };

  const agregarRuta = async () => {
    if (!nuevaRuta.origen || !nuevaRuta.destino) {
      alert('⚠️ Debes ingresar origen y destino');
      return;
    }

    // Validar que se hayan completado todos los campos del formulario
    if (!formData.tipoServicio || !formData.tipoCarga || !formData.moneda) {
      alert('⚠️ Primero completa todos los campos: MONEDA, VIAJE, CARGA, CLASIFICACIÓN y SERVICIO');
      return;
    }

    const resultado = await calcularDistancia(nuevaRuta.origen, nuevaRuta.destino);
    
    if (resultado) {
      const ruta: Ruta = {
        id: Date.now().toString(),
        origen: nuevaRuta.origen,
        destino: nuevaRuta.destino,
        origenUSA: nuevaRuta.origenUSA,
        destinoUSA: nuevaRuta.destinoUSA,
        distanciaKm: resultado.distancia,
        tiempoHoras: resultado.tiempo
      };

      const nuevasRutas = [...formData.rutas, ruta];
      setFormData({
        ...formData,
        rutas: nuevasRutas
      });

      setNuevaRuta({ origen: '', destino: '', origenUSA: '', destinoUSA: '' });
      
      // Recalcular costo total
      calcularCostoTotal(nuevasRutas, formData);
    }
  };

  const eliminarRuta = (id: string) => {
    const nuevasRutas = formData.rutas.filter(r => r.id !== id);
    setFormData({
      ...formData,
      rutas: nuevasRutas
    });
    calcularCostoTotal(nuevasRutas, formData);
  };

  const calcularCostoTotal = async (rutas: Ruta[], currentFormData: FormCotizacion) => {
    try {
      // Obtener tarifas del backend
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/config/tarifas`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (!data.success) {
        console.error('No hay tarifas configuradas - usando valores por defecto');
        // Fallback a valores hardcodeados
        calcularCostoTotalFallback(rutas, currentFormData);
        return;
      }
      
      const tarifas = data.tarifas;
      const distanciaTotal = rutas.reduce((sum, r) => sum + (r.distanciaKm || 0), 0);
      
      // Determinar si es ruta corta o larga (< 500 km = corta, >= 500 km = larga)
      const esRutaCorta = distanciaTotal < 500;
      
      let tarifaPorKm = 0;
      let monedaFinal = currentFormData.moneda;
      
      // ========== REGLA DTD: SIEMPRE EN USD ==========
      if (currentFormData.tipoServicio === 'dtd') {
        monedaFinal = 'USD';
      }
      
      // ========== VALIDACIÓN HAZMAT EN USA ==========
      if (currentFormData.clasificacionCarga === 'hazmat' && 
          (currentFormData.tipoServicio === 'domestico-usa' || currentFormData.tipoServicio === 'dtd')) {
        alert('⚠️ HAZMAT no está permitido en USA');
        return;
      }
      
      // ========== CÁLCULO SEGÚN TIPO DE SERVICIO ==========
      
      // IMPORTACIÓN TRANSBORDO
      if (currentFormData.tipoViaje === 'importacion' && currentFormData.tipoServicio === 'transbordo') {
        if (esRutaCorta) {
          if (currentFormData.tipoCarga === 'seco' && currentFormData.clasificacionCarga === 'regular') {
            tarifaPorKm = tarifas.impoTransbordoCortaSecaRegular;
          } else if (currentFormData.tipoCarga === 'refrigerado' && currentFormData.clasificacionCarga === 'regular') {
            tarifaPorKm = tarifas.impoTransbordoCortaRefrigeradaRegular;
          } else if (currentFormData.tipoCarga === 'seco' && currentFormData.clasificacionCarga === 'hazmat') {
            tarifaPorKm = tarifas.impoTransbordoCortaSecaHazmat;
          } else if (currentFormData.tipoCarga === 'refrigerado' && currentFormData.clasificacionCarga === 'hazmat') {
            tarifaPorKm = tarifas.impoTransbordoCortaRefrigeradaHazmat;
          }
        } else {
          if (currentFormData.tipoCarga === 'seco' && currentFormData.clasificacionCarga === 'regular') {
            tarifaPorKm = tarifas.impoTransbordoLargaSecaRegular;
          } else if (currentFormData.tipoCarga === 'refrigerado' && currentFormData.clasificacionCarga === 'regular') {
            tarifaPorKm = tarifas.impoTransbordoLargaRefrigeradaRegular;
          } else if (currentFormData.tipoCarga === 'seco' && currentFormData.clasificacionCarga === 'hazmat') {
            tarifaPorKm = tarifas.impoTransbordoLargaSecaHazmat;
          } else if (currentFormData.tipoCarga === 'refrigerado' && currentFormData.clasificacionCarga === 'hazmat') {
            tarifaPorKm = tarifas.impoTransbordoLargaRefrigeradaHazmat;
          }
        }
      }
      
      // IMPORTACIÓN DTD MÉXICO
      else if (currentFormData.tipoViaje === 'importacion' && currentFormData.tipoServicio === 'dtd') {
        // DTD siempre en USD
        monedaFinal = 'USD';
        if (esRutaCorta) {
          if (currentFormData.tipoCarga === 'seco') {
            tarifaPorKm = tarifas.impoDtdCortaSecaRegular;
          } else if (currentFormData.tipoCarga === 'refrigerado') {
            tarifaPorKm = tarifas.impoDtdCortaRefrigeradaRegular;
          }
        } else {
          if (currentFormData.tipoCarga === 'seco') {
            tarifaPorKm = tarifas.impoDtdLargaSecaRegular;
          } else if (currentFormData.tipoCarga === 'refrigerado') {
            tarifaPorKm = tarifas.impoDtdLargaRefrigeradaRegular;
          }
        }
        
        // Convertir km a millas para parte USA y multiplicar por tarifa USA
        // Por simplicidad, asumimos toda la distancia en km por ahora
        // En producción, se calcularía distancia MX y distancia USA por separado
      }
      
      // EXPORTACIÓN DTD
      else if (currentFormData.tipoViaje === 'exportacion' && currentFormData.tipoServicio === 'dtd') {
        monedaFinal = 'USD';
        // Usar distancia en millas (convertir km a millas: km * 0.621371)
        const distanciaMillas = distanciaTotal * 0.621371;
        const esMillasCortas = distanciaMillas < 300; // 300 millas = corta
        
        if (esMillasCortas) {
          if (currentFormData.tipoCarga === 'seco') {
            tarifaPorKm = tarifas.expoDtdUsaSecoCortaMillas / 0.621371; // Convertir $/milla a $/km
          } else if (currentFormData.tipoCarga === 'refrigerado') {
            tarifaPorKm = tarifas.expoDtdUsaRefrigeradoCortaMillas / 0.621371;
          }
        } else {
          if (currentFormData.tipoCarga === 'seco') {
            tarifaPorKm = tarifas.expoDtdUsaSecoLargaMillas / 0.621371;
          } else if (currentFormData.tipoCarga === 'refrigerado') {
            tarifaPorKm = tarifas.expoDtdUsaRefrigeradoLargaMillas / 0.621371;
          }
        }
      }
      
      // DOMÉSTICO USA
      else if (currentFormData.tipoServicio === 'domestico-usa') {
        monedaFinal = 'USD';
        const distanciaMillas = distanciaTotal * 0.621371;
        const esMillasCortas = distanciaMillas < 300;
        
        if (esMillasCortas) {
          if (currentFormData.tipoCarga === 'seco') {
            tarifaPorKm = tarifas.domesticoUsaSecoCortaMillas / 0.621371;
          } else if (currentFormData.tipoCarga === 'refrigerado') {
            tarifaPorKm = tarifas.domesticoUsaRefrigeradoCortaMillas / 0.621371;
          }
        } else {
          if (currentFormData.tipoCarga === 'seco') {
            tarifaPorKm = tarifas.domesticoUsaSecoLargaMillas / 0.621371;
          } else if (currentFormData.tipoCarga === 'refrigerado') {
            tarifaPorKm = tarifas.domesticoUsaRefrigeradoLargaMillas / 0.621371;
          }
        }
      }
      
      // NACIONAL MÉXICO
      else if (currentFormData.tipoViaje === 'nacional') {
        if (esRutaCorta) {
          if (currentFormData.tipoCarga === 'seco' && currentFormData.clasificacionCarga === 'regular') {
            tarifaPorKm = tarifas.nacionalCortaSecaRegular;
          } else if (currentFormData.tipoCarga === 'refrigerado' && currentFormData.clasificacionCarga === 'regular') {
            tarifaPorKm = tarifas.nacionalCortaRefrigeradaRegular;
          } else if (currentFormData.tipoCarga === 'seco' && currentFormData.clasificacionCarga === 'hazmat') {
            tarifaPorKm = tarifas.nacionalCortaSecaHazmat;
          } else if (currentFormData.tipoCarga === 'refrigerado' && currentFormData.clasificacionCarga === 'hazmat') {
            tarifaPorKm = tarifas.nacionalCortaRefrigeradaHazmat;
          }
        } else {
          if (currentFormData.tipoCarga === 'seco' && currentFormData.clasificacionCarga === 'regular') {
            tarifaPorKm = tarifas.nacionalLargaSecaRegular;
          } else if (currentFormData.tipoCarga === 'refrigerado' && currentFormData.clasificacionCarga === 'regular') {
            tarifaPorKm = tarifas.nacionalLargaRefrigeradaRegular;
          } else if (currentFormData.tipoCarga === 'seco' && currentFormData.clasificacionCarga === 'hazmat') {
            tarifaPorKm = tarifas.nacionalLargaSecaHazmat;
          } else if (currentFormData.tipoCarga === 'refrigerado' && currentFormData.clasificacionCarga === 'hazmat') {
            tarifaPorKm = tarifas.nacionalLargaRefrigeradaHazmat;
          }
        }
      }
      
      const costoDistancia = distanciaTotal * tarifaPorKm;
      const costoCruce = currentFormData.tipoServicio === 'dtd' ? tarifas.cruce : 0;
      const costoTotal = costoDistancia + costoCruce;
      
      setFormData({
        ...currentFormData,
        moneda: monedaFinal,
        tarifaPorKm,
        costoCruce,
        costoTotal,
        incluyeCruce: currentFormData.tipoServicio === 'dtd' // Actualizar el campo incluyeCruce
      });
    } catch (error) {
      console.error('Error al calcular costo:', error);
      // Usar valores por defecto si falla
      calcularCostoTotalFallback(rutas, currentFormData);
    }
  };
  
  // Función fallback con valores hardcodeados
  const calcularCostoTotalFallback = (rutas: Ruta[], currentFormData: FormCotizacion) => {
    const distanciaTotal = rutas.reduce((sum, r) => sum + (r.distanciaKm || 0), 0);
    
    // Tarifas base simuladas
    let tarifaPorKm = 0;
    
    // Tarifas según tipo de carga y clasificación
    if (currentFormData.tipoCarga === 'seco' && currentFormData.clasificacionCarga === 'regular') {
      tarifaPorKm = currentFormData.moneda === 'MXN' ? 25 : 1.5;
    } else if (currentFormData.tipoCarga === 'seco' && currentFormData.clasificacionCarga === 'hazmat') {
      tarifaPorKm = currentFormData.moneda === 'MXN' ? 35 : 2.0;
    } else if (currentFormData.tipoCarga === 'refrigerado' && currentFormData.clasificacionCarga === 'regular') {
      tarifaPorKm = currentFormData.moneda === 'MXN' ? 30 : 1.8;
    } else if (currentFormData.tipoCarga === 'refrigerado' && currentFormData.clasificacionCarga === 'hazmat') {
      tarifaPorKm = currentFormData.moneda === 'MXN' ? 40 : 2.3;
    }

    // Ajuste por tipo de viaje
    if (currentFormData.tipoViaje === 'importacion' || currentFormData.tipoViaje === 'exportacion') {
      tarifaPorKm *= 1.2; // +20% para cross-border
    }

    // Ajuste por tipo de servicio
    if (currentFormData.tipoServicio === 'transbordo') {
      tarifaPorKm *= 0.85; // -15% para transbordo
    } else if (currentFormData.tipoServicio === 'domestico-usa') {
      tarifaPorKm *= 1.3; // +30% para doméstico USA
    }

    const costoTotal = distanciaTotal * tarifaPorKm;

    setFormData({
      ...currentFormData,
      tarifaPorKm,
      costoTotal
    });
  };

  const guardarCotizacion = () => {
    if (!formData.nombreCliente) {
      alert('⚠️ Debes ingresar el nombre del cliente');
      return;
    }

    if (formData.rutas.length === 0) {
      alert('⚠️ Debes agregar al menos una ruta');
      return;
    }

    setCotizaciones([...cotizaciones, {...formData}]);
    
    // Limpiar formulario
    setFormData({
      nombreCliente: '',
      moneda: '' as any, // Sin selección inicial
      tipoCarga: '' as any, // Sin selección inicial
      clasificacionCarga: '' as any, // Sin selección inicial
      tipoViaje: '' as any, // Sin selección inicial
      tipoServicio: '' as any, // Sin selección inicial
      rutas: [],
      tarifaPorKm: 0,
      costoCruce: 0,
      costoTotal: 0,
      incluyeCruce: false // Reiniciar a false
    });

    alert('✅ Cotización guardada exitosamente');
  };

  return (
    <ModuleTemplate title="Cotizaciones" onBack={onBack} headerImage={MODULE_IMAGES.COTIZACIONES}>
      <div className="p-3 max-h-[calc(100vh-140px)] overflow-y-auto">
        {/* FORMULARIO CREAR COTIZACIÓN - SIN RECUADRO EXTRA */}
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-2">
            {/* NOMBRE CLIENTE */}
            <div className="col-span-2">
              <label className="block text-[var(--fx-muted)] mb-0.5" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '9px', fontWeight: 600 }}>
                CLIENTE
              </label>
              <input
                type="text"
                value={formData.nombreCliente}
                onChange={(e) => setFormData({...formData, nombreCliente: e.target.value})}
                className="w-full px-2 py-1 rounded-lg bg-[rgba(15,23,42,0.85)] border border-[rgba(148,163,184,0.4)] text-white focus:outline-none focus:border-[var(--fx-primary)]"
                placeholder="Empresa S.A. de C.V."
                style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px' }}
              />
            </div>
          </div>

          {/* ATRIBUTOS CON CHECKBOXES */}
          <div className="grid grid-cols-5 gap-2.5 mt-2">
            {/* MONEDA */}
            <div>
              <label className="block text-[var(--fx-muted)] mb-1" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '9px', fontWeight: 600 }}>
                <DollarSign className="w-3 h-3 inline mr-1 text-white opacity-70" />
                MONEDA
              </label>
              <div className="space-y-0.5">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="moneda"
                    checked={formData.moneda === 'MXN'}
                    onChange={() => {
                      const newFormData = {...formData, moneda: 'MXN' as 'MXN' | 'USD'};
                      setFormData(newFormData);
                      setTimeout(() => calcularCostoTotal(newFormData.rutas, newFormData), 0);
                    }}
                    className="w-3 h-3 text-blue-600"
                  />
                  <span className="text-white" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px' }}>MXN</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="moneda"
                    checked={formData.moneda === 'USD'}
                    onChange={() => {
                      const newFormData = {...formData, moneda: 'USD' as 'MXN' | 'USD'};
                      setFormData(newFormData);
                      setTimeout(() => calcularCostoTotal(newFormData.rutas, newFormData), 0);
                    }}
                    className="w-3 h-3 text-blue-600"
                  />
                  <span className="text-white" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px' }}>USD</span>
                </label>
              </div>
            </div>

            {/* TIPO DE VIAJE */}
            <div>
              <label className="block text-[var(--fx-muted)] mb-1" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '9px', fontWeight: 600 }}>
                <Navigation className="w-3 h-3 inline mr-1 text-white opacity-70" />
                VIAJE
              </label>
              <div className="space-y-0.5">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="tipoViaje"
                    checked={formData.tipoViaje === 'importacion'}
                    onChange={() => {
                      const newFormData = {...formData, tipoViaje: 'importacion' as any};
                      setFormData(newFormData);
                      // Auto-completar ORIGEN con Nuevo Laredo para importación
                      setNuevaRuta({...nuevaRuta, origen: 'Nuevo Laredo, Tamaulipas, Mexico'});
                      setTimeout(() => calcularCostoTotal(newFormData.rutas, newFormData), 0);
                    }}
                    className="w-3 h-3 text-blue-600"
                  />
                  <span className="text-white" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px' }}>Import</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="tipoViaje"
                    checked={formData.tipoViaje === 'exportacion'}
                    onChange={() => {
                      const newFormData = {...formData, tipoViaje: 'exportacion' as any};
                      setFormData(newFormData);
                      // Auto-completar DESTINO con Nuevo Laredo para exportación
                      setNuevaRuta({...nuevaRuta, destino: 'Nuevo Laredo, Tamaulipas, Mexico'});
                      setTimeout(() => calcularCostoTotal(newFormData.rutas, newFormData), 0);
                    }}
                    className="w-3 h-3 text-blue-600"
                  />
                  <span className="text-white" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px' }}>Export</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="tipoViaje"
                    checked={formData.tipoViaje === 'nacional'}
                    onChange={() => {
                      const newFormData = {...formData, tipoViaje: 'nacional' as any};
                      setFormData(newFormData);
                      setTimeout(() => calcularCostoTotal(newFormData.rutas, newFormData), 0);
                    }}
                    className="w-3 h-3 text-blue-600"
                  />
                  <span className="text-white" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px' }}>Nacional</span>
                </label>
              </div>
            </div>

            {/* TIPO DE CARGA */}
            <div>
              <label className="block text-[var(--fx-muted)] mb-1" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '9px', fontWeight: 600 }}>
                <Package className="w-3 h-3 inline mr-1 text-white opacity-70" />
                CARGA
              </label>
              <div className="space-y-0.5">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="tipoCarga"
                    checked={formData.tipoCarga === 'seco'}
                    onChange={() => {
                      const newFormData = {...formData, tipoCarga: 'seco' as 'seco' | 'refrigerado'};
                      setFormData(newFormData);
                      setTimeout(() => calcularCostoTotal(newFormData.rutas, newFormData), 0);
                    }}
                    className="w-3 h-3 text-blue-600"
                  />
                  <span className="text-white" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px' }}>Seco</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="tipoCarga"
                    checked={formData.tipoCarga === 'refrigerado'}
                    onChange={() => {
                      const newFormData = {...formData, tipoCarga: 'refrigerado' as 'seco' | 'refrigerado'};
                      setFormData(newFormData);
                      setTimeout(() => calcularCostoTotal(newFormData.rutas, newFormData), 0);
                    }}
                    className="w-3 h-3 text-blue-600"
                  />
                  <span className="text-white" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px' }}>Refrigerado</span>
                </label>
              </div>
            </div>

            {/* CLASIFICACIÓN */}
            <div>
              <label className="block text-[var(--fx-muted)] mb-1" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '9px', fontWeight: 600 }}>
                CLASIFICACIÓN
              </label>
              <div className="space-y-0.5">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="clasificacion"
                    checked={formData.clasificacionCarga === 'regular'}
                    onChange={() => {
                      const newFormData = {...formData, clasificacionCarga: 'regular' as 'regular' | 'hazmat'};
                      setFormData(newFormData);
                      setTimeout(() => calcularCostoTotal(newFormData.rutas, newFormData), 0);
                    }}
                    className="w-3 h-3 text-blue-600"
                  />
                  <span className="text-white" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px' }}>Regular</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="clasificacion"
                    checked={formData.clasificacionCarga === 'hazmat'}
                    onChange={() => {
                      const newFormData = {...formData, clasificacionCarga: 'hazmat' as 'regular' | 'hazmat'};
                      setFormData(newFormData);
                      setTimeout(() => calcularCostoTotal(newFormData.rutas, newFormData), 0);
                    }}
                    className="w-3 h-3 text-blue-600"
                  />
                  <span className="text-white" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px' }}>Hazmat</span>
                </label>
              </div>
              
              {/* CRUCE - DEBAJO DE CLASIFICACIÓN */}
              <div className="mt-1.5 pt-1.5 border-t border-white/10">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.incluyeCruce}
                    onChange={(e) => {
                      const incluye = e.target.checked;
                      const costoCruce = incluye 
                        ? (formData.clasificacionCarga === 'regular' ? 150 : 290)
                        : 0;
                      const newFormData = {...formData, incluyeCruce: incluye, costoCruce};
                      setFormData(newFormData);
                      setTimeout(() => calcularCostoTotal(newFormData.rutas, newFormData), 0);
                    }}
                    className="w-3 h-3 text-blue-600"
                  />
                  <div>
                    <span className="text-white" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px', fontWeight: 600 }}>CRUCE</span>
                    <div className="text-yellow-300" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '8px' }}>
                      {formData.clasificacionCarga === 'regular' ? '$150 USD' : '$290 USD'}
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* TIPO DE SERVICIO */}
            <div>
              <label className="block text-[var(--fx-muted)] mb-1" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '9px', fontWeight: 600 }}>
                <Truck className="w-3 h-3 inline mr-1 text-white opacity-70" />
                SERVICIO
              </label>
              <div className="space-y-0.5">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="servicio"
                    checked={formData.tipoServicio === 'dtd'}
                    onChange={() => {
                      const newFormData = {...formData, tipoServicio: 'dtd' as any, costoCruce: 150};
                      setFormData(newFormData);
                      setTimeout(() => calcularCostoTotal(newFormData.rutas, newFormData), 0);
                    }}
                    className="w-3 h-3 text-blue-600"
                  />
                  <span className="text-white" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px' }}>DTD</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="servicio"
                    checked={formData.tipoServicio === 'transbordo'}
                    onChange={() => {
                      const newFormData = {...formData, tipoServicio: 'transbordo' as any, costoCruce: 0};
                      setFormData(newFormData);
                      setTimeout(() => calcularCostoTotal(newFormData.rutas, newFormData), 0);
                    }}
                    className="w-3 h-3 text-blue-600"
                  />
                  <span className="text-white" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px' }}>Transbordo</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="servicio"
                    checked={formData.tipoServicio === 'domestico-usa'}
                    onChange={() => {
                      const newFormData = {...formData, tipoServicio: 'domestico-usa' as any, costoCruce: 0};
                      setFormData(newFormData);
                      setTimeout(() => calcularCostoTotal(newFormData.rutas, newFormData), 0);
                    }}
                    className="w-3 h-3 text-blue-600"
                  />
                  <span className="text-white" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px' }}>Doméstico USA</span>
                </label>
              </div>
            </div>
          </div>

          {/* SECCIÓN DE RUTAS */}
          <div className="border-t border-white/10 pt-2 mt-2">
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-white flex items-center gap-1.5" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 700 }}>
                <Navigation className="w-3.5 h-3.5 text-white opacity-70" />
                RUTAS
              </h3>
            </div>

            {/* AGREGAR RUTA - MUY COMPACTO */}
            <div className="bg-gradient-to-br from-blue-600/15 via-cyan-500/10 to-blue-700/15 border border-blue-400/40 rounded-xl p-2.5 mb-2 shadow-lg shadow-blue-500/10">
              {/* MÉXICO */}
              <div className="mb-1.5">
                <div className="text-cyan-300 mb-1 flex items-center gap-1" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '9px', fontWeight: 700 }}>
                  <div className="w-1 h-1 rounded-full bg-cyan-400"></div>
                  MÉXICO
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  <div className="col-span-2">
                    <label className="block text-blue-200 mb-0.5" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '8px', fontWeight: 600 }}>
                      ORIGEN
                    </label>
                    <AutocompleteInput
                      value={nuevaRuta.origen}
                      onChange={(value) => setNuevaRuta({...nuevaRuta, origen: value})}
                      apiKey={googleMapsApiKey}
                      className="w-full px-1.5 py-1 rounded-lg bg-[rgba(15,23,42,0.95)] border border-blue-400/30 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50"
                      placeholder="CDMX"
                      style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px' }}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-blue-200 mb-0.5" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '8px', fontWeight: 600 }}>
                      DESTINO
                    </label>
                    <AutocompleteInput
                      value={nuevaRuta.destino}
                      onChange={(value) => setNuevaRuta({...nuevaRuta, destino: value})}
                      apiKey={googleMapsApiKey}
                      className="w-full px-1.5 py-1 rounded-lg bg-[rgba(15,23,42,0.95)] border border-blue-400/30 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50"
                      placeholder="Laredo, TX"
                      style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px' }}
                    />
                  </div>
                </div>
              </div>

              {/* USA - SOLO PARA DTD */}
              {formData.tipoServicio === 'dtd' && (
                <div className="mb-1.5 pt-1.5 border-t border-cyan-400/20">
                  <div className="text-cyan-300 mb-1 flex items-center gap-1" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '9px', fontWeight: 700 }}>
                    <div className="w-1 h-1 rounded-full bg-cyan-400"></div>
                    USA
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    <div className="col-span-2">
                      <label className="block text-blue-200 mb-0.5" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '8px', fontWeight: 600 }}>
                        ORIGEN USA
                      </label>
                      <input
                        type="text"
                        value={nuevaRuta.origenUSA}
                        onChange={(e) => setNuevaRuta({...nuevaRuta, origenUSA: e.target.value})}
                        className="w-full px-1.5 py-1 rounded-lg bg-[rgba(15,23,42,0.95)] border border-blue-400/30 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50"
                        placeholder="Laredo, TX"
                        style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px' }}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-blue-200 mb-0.5" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '8px', fontWeight: 600 }}>
                        DESTINO USA
                      </label>
                      <input
                        type="text"
                        value={nuevaRuta.destinoUSA}
                        onChange={(e) => setNuevaRuta({...nuevaRuta, destinoUSA: e.target.value})}
                        className="w-full px-1.5 py-1 rounded-lg bg-[rgba(15,23,42,0.95)] border border-blue-400/30 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50"
                        placeholder="Chicago, IL"
                        style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={agregarRuta}
                disabled={calculando}
                className="w-full px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 hover:from-blue-600 hover:via-cyan-600 hover:to-blue-700 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/30 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98] border border-cyan-400/30"
                style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px' }}
              >
                {calculando ? (
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>CALCULANDO...</span>
                  </div>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    AÑADIR RUTA
                  </>
                )}
              </button>
            </div>

            {/* LISTA DE RUTAS */}
            {formData.rutas.length === 0 ? (
              <div className="text-center py-2 text-[var(--fx-muted)]" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px' }}>
                Sin rutas. Agrega la primera.
              </div>
            ) : (
              <div className="space-y-1">
                {formData.rutas.map((ruta, index) => {
                  // Calcular tarifa para esta ruta específica
                  const distancia = ruta.distanciaKm || 0;
                  const tarifaTotal = distancia * formData.tarifaPorKm;
                  const tarifaRedondeada = tarifaTotal % 1 === 0 ? tarifaTotal.toFixed(0) : tarifaTotal.toFixed(2);
                  
                  return (
                    <div key={ruta.id} className="bg-[rgba(15,23,42,0.4)] border border-white/10 rounded-lg p-2 hover:bg-[rgba(15,23,42,0.6)] hover:border-blue-400/30 transition-all group">
                      <div className="flex items-center justify-between">
                        {/* RUTA PRINCIPAL */}
                        <div className="flex-1">
                          <div className="text-white mb-0.5" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 700 }}>
                            {ruta.origen} → {ruta.destino}
                          </div>
                          <div className="flex items-center gap-2" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '9px' }}>
                            <span className="text-blue-300">
                              {formData.tipoServicio === 'dtd' ? 'DTD' : formData.tipoServicio === 'transbordo' ? 'Transbordo' : 'Doméstico USA'}
                            </span>
                            <span className="text-white/30">•</span>
                            <span className="text-emerald-300">
                              {formData.tipoCarga === 'seco' ? 'Seco' : 'Refrigerado'}
                            </span>
                            <span className="text-white/30">•</span>
                            <span className="text-yellow-400" style={{ fontFamily: "'Orbitron', monospace", fontWeight: 700 }}>
                              {formData.moneda === 'MXN' ? '$' : 'US$'}{tarifaRedondeada}
                            </span>
                          </div>
                        </div>
                        
                        {/* BOTÓN ELIMINAR */}
                        <button
                          onClick={() => eliminarRuta(ruta.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-500/20 text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RESUMEN DE COTIZACIÓN */}
          {formData.rutas.length > 0 && (
            <div className="border-t border-white/10 pt-2 mt-2">
              <div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/30 rounded-lg p-2">
                <h3 className="text-white mb-1.5 flex items-center gap-1.5" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 700 }}>
                  <Calculator className="w-3.5 h-3.5 text-emerald-400" />
                  Resumen
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <div className="text-[var(--fx-muted)] mb-0.5" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '8px' }}>
                      Distancia Total
                    </div>
                    <div className="text-white" style={{ fontFamily: "'Orbitron', monospace", fontSize: '13px', fontWeight: 700 }}>
                      {formData.rutas.reduce((sum, r) => sum + (r.distanciaKm || 0), 0).toFixed(0)} km
                    </div>
                  </div>
                  <div>
                    <div className="text-[var(--fx-muted)] mb-0.5" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '8px' }}>
                      Tarifa por km
                    </div>
                    <div className="text-emerald-400" style={{ fontFamily: "'Orbitron', monospace", fontSize: '13px', fontWeight: 700 }}>
                      {formData.moneda === 'MXN' ? '$' : 'US$'}{formData.tarifaPorKm.toFixed(2)}
                    </div>
                  </div>
                  {formData.incluyeCruce && (
                    <div>
                      <div className="text-[var(--fx-muted)] mb-0.5" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '8px' }}>
                        Cruce
                      </div>
                      <div className="text-yellow-400" style={{ fontFamily: "'Orbitron', monospace", fontSize: '13px', fontWeight: 700 }}>
                        US${formData.costoCruce}
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="text-[var(--fx-muted)] mb-0.5" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '8px' }}>
                      Costo Total
                    </div>
                    <div className="text-blue-400" style={{ fontFamily: "'Orbitron', monospace", fontSize: '15px', fontWeight: 700 }}>
                      {formData.moneda === 'MXN' ? '$' : 'US$'}{formData.costoTotal.toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BOTÓN GUARDAR */}
          <button
            onClick={guardarCotizacion}
            className="w-full px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-600 hover:via-green-600 hover:to-emerald-700 text-white transition-all flex items-center justify-center gap-1.5 mt-2 shadow-lg shadow-emerald-500/30 hover:shadow-green-500/40 hover:scale-[1.02] active:scale-[0.98] border border-emerald-400/40"
            style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px' }}
          >
            <Save className="w-4 h-4" />
            GUARDAR COTIZACIÓN
          </button>
        </div>

        {/* COTIZACIONES GUARDADAS */}
        {cotizaciones.length > 0 && (
          <div className="mt-4 border-t border-white/10 pt-3">
            <h2 className="text-white mb-2 flex items-center gap-1.5" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 700 }}>
              <FileText className="w-3.5 h-3.5 text-white opacity-70" />
              COTIZACIONES GUARDADAS ({cotizaciones.length})
            </h2>
            <div className="space-y-1.5">
              {cotizaciones.map((cot, index) => (
                <div key={index} className="bg-[rgba(15,23,42,0.5)] border border-white/10 rounded-lg p-2 flex items-center justify-between">
                  <div>
                    <div className="text-white mb-0.5" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 700 }}>
                      {cot.nombreCliente}
                    </div>
                    <div className="text-[var(--fx-muted)]" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '9px' }}>
                      {cot.rutas.length} ruta(s) • {cot.tipoCarga} • {cot.clasificacionCarga}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-blue-400" style={{ fontFamily: "'Orbitron', monospace", fontSize: '13px', fontWeight: 700 }}>
                      {cot.moneda === 'MXN' ? '$' : 'US$'}{cot.costoTotal.toLocaleString('es-MX', {minimumFractionDigits: 2})}
                    </div>
                    <div className="text-[var(--fx-muted)]" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '8px' }}>
                      {cot.moneda}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ModuleTemplate>
  );
};