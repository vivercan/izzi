import { ModuleTemplate } from './ModuleTemplate';
import { MODULE_IMAGES } from '../../assets/module-images';
import { useState, useEffect } from 'react';
import { Save, DollarSign, Truck, Navigation, Package, MapPin, Key } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface VariablesCotizacionModuleProps {
  onBack: () => void;
}

interface TarifasState {
  // IMPORTACIÓN TRANSBORDO
  impoTransbordoCortaSecaRegular: number;
  impoTransbordoCortaRefrigeradaRegular: number;
  impoTransbordoCortaSecaHazmat: number;
  impoTransbordoCortaRefrigeradaHazmat: number;
  impoTransbordoLargaSecaRegular: number;
  impoTransbordoLargaRefrigeradaRegular: number;
  impoTransbordoLargaSecaHazmat: number;
  impoTransbordoLargaRefrigeradaHazmat: number;

  // IMPORTACIÓN DTD MÉXICO
  impoDtdCortaSecaRegular: number;
  impoDtdCortaRefrigeradaRegular: number;
  impoDtdLargaSecaRegular: number;
  impoDtdLargaRefrigeradaRegular: number;

  // IMPORTACIÓN DTD USA
  impoDtdUsaSecoCortaMillas: number;
  impoDtdUsaSecoLargaMillas: number;
  impoDtdUsaRefrigeradoCortaMillas: number;
  impoDtdUsaRefrigeradoLargaMillas: number;

  // EXPORTACIÓN DTD USA
  expoDtdUsaSecoCortaMillas: number;
  expoDtdUsaSecoLargaMillas: number;
  expoDtdUsaRefrigeradoCortaMillas: number;
  expoDtdUsaRefrigeradoLargaMillas: number;

  // DOMÉSTICO USA
  domesticoUsaSecoCortaMillas: number;
  domesticoUsaSecoLargaMillas: number;
  domesticoUsaRefrigeradoCortaMillas: number;
  domesticoUsaRefrigeradoLargaMillas: number;

  // NACIONAL MÉXICO
  nacionalVacio: number;
  nacionalCortaSecaRegular: number;
  nacionalLargaSecaRegular: number;
  nacionalCortaRefrigeradaRegular: number;
  nacionalLargaRefrigeradaRegular: number;
  nacionalCortaSecaHazmat: number;
  nacionalLargaSecaHazmat: number;
  nacionalCortaRefrigeradaHazmat: number;
  nacionalLargaRefrigeradaHazmat: number;

  // OTROS
  tipoCambio: number;
  cruce: number;
}

export const VariablesCotizacionModule = ({ onBack }: VariablesCotizacionModuleProps) => {
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState('AIzaSyD72DQyQqozE6lLySRnYCc5KSk9y-YiBno');
  const [apiKeyGuardada, setApiKeyGuardada] = useState(false);
  const [tarifas, setTarifas] = useState<TarifasState>({
    // IMPORTACIÓN TRANSBORDO (MXN/km)
    impoTransbordoCortaSecaRegular: 25,
    impoTransbordoCortaRefrigeradaRegular: 30,
    impoTransbordoCortaSecaHazmat: 35,
    impoTransbordoCortaRefrigeradaHazmat: 40,
    impoTransbordoLargaSecaRegular: 22,
    impoTransbordoLargaRefrigeradaRegular: 27,
    impoTransbordoLargaSecaHazmat: 32,
    impoTransbordoLargaRefrigeradaHazmat: 37,

    // IMPORTACIÓN DTD MÉXICO (MXN/km)
    impoDtdCortaSecaRegular: 28,
    impoDtdCortaRefrigeradaRegular: 33,
    impoDtdLargaSecaRegular: 25,
    impoDtdLargaRefrigeradaRegular: 30,

    // IMPORTACIÓN DTD USA (USD/milla)
    impoDtdUsaSecoCortaMillas: 1.5,
    impoDtdUsaSecoLargaMillas: 1.3,
    impoDtdUsaRefrigeradoCortaMillas: 1.8,
    impoDtdUsaRefrigeradoLargaMillas: 1.6,

    // EXPORTACIÓN DTD USA (USD/milla)
    expoDtdUsaSecoCortaMillas: 1.5,
    expoDtdUsaSecoLargaMillas: 1.3,
    expoDtdUsaRefrigeradoCortaMillas: 1.8,
    expoDtdUsaRefrigeradoLargaMillas: 1.6,

    // DOMÉSTICO USA (USD/milla)
    domesticoUsaSecoCortaMillas: 2.0,
    domesticoUsaSecoLargaMillas: 1.7,
    domesticoUsaRefrigeradoCortaMillas: 2.3,
    domesticoUsaRefrigeradoLargaMillas: 2.0,

    // NACIONAL MÉXICO (MXN/km)
    nacionalVacio: 15,
    nacionalCortaSecaRegular: 20,
    nacionalLargaSecaRegular: 18,
    nacionalCortaRefrigeradaRegular: 25,
    nacionalLargaRefrigeradaRegular: 23,
    nacionalCortaSecaHazmat: 30,
    nacionalLargaSecaHazmat: 28,
    nacionalCortaRefrigeradaHazmat: 35,
    nacionalLargaRefrigeradaHazmat: 33,

    // OTROS
    tipoCambio: 18.5,
    cruce: 150
  });

  const [guardando, setGuardando] = useState(false);

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/config/tarifas`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tarifas)
      });
      
      const result = await response.json();
      if (result.success) {
        alert('✅ Variables de cotización guardadas exitosamente');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error al guardar tarifas:', error);
      alert(`❌ Error: ${error}`);
    } finally {
      setGuardando(false);
    }
  };

  const InputTarifa = ({ label, value, onChange, suffix = 'MXN/km' }: { label: string; value: number; onChange: (val: number) => void; suffix?: string }) => (
    <div>
      <label className="block text-[var(--fx-muted)] mb-1" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '9px', fontWeight: 600 }}>
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          step="0.01"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full px-2 py-1.5 rounded-lg bg-[rgba(15,23,42,0.85)] border border-[rgba(148,163,184,0.4)] text-white focus:outline-none focus:border-[var(--fx-primary)]"
          style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px' }}
        />
        <span className="text-[var(--fx-muted)]" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px', whiteSpace: 'nowrap' }}>
          {suffix}
        </span>
      </div>
    </div>
  );

  return (
    <ModuleTemplate title="Variables de Cotización" onBack={onBack} headerImage={MODULE_IMAGES.COTIZACIONES}>
      <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
        <div className="space-y-6">
          {/* GOOGLE MAPS API KEY */}
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg p-4">
            <h3 className="text-white mb-3 flex items-center gap-2" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 700 }}>
              <MapPin className="w-4 h-4 text-blue-400" />
              GOOGLE MAPS API KEY
            </h3>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="password"
                  value={googleMapsApiKey}
                  onChange={(e) => setGoogleMapsApiKey(e.target.value)}
                  placeholder="Ingresa tu Google Maps API Key..."
                  className="flex-1 px-3 py-2 rounded-lg bg-[rgba(15,23,42,0.85)] border border-[rgba(148,163,184,0.4)] text-white focus:outline-none focus:border-[var(--fx-primary)]"
                  style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px' }}
                />
                <button
                  onClick={async () => {
                    if (!googleMapsApiKey.trim()) {
                      alert('❌ Por favor ingresa una API Key válida');
                      return;
                    }
                    try {
                      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/config/google-maps-key`, {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${publicAnonKey}`,
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ apiKey: googleMapsApiKey })
                      });
                      const result = await response.json();
                      if (result.success) {
                        setApiKeyGuardada(true);
                        alert('✅ API Key guardada exitosamente');
                      } else {
                        throw new Error(result.error);
                      }
                    } catch (error) {
                      console.error('Error al guardar API Key:', error);
                      alert(`❌ Error: ${error}`);
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-2"
                  style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '11px', fontWeight: 700 }}
                >
                  <Key className="w-4 h-4" />
                  GUARDAR KEY
                </button>
              </div>
              {apiKeyGuardada && (
                <div className="text-green-400 text-xs" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                  ✅ API Key configurada correctamente
                </div>
              )}
              <div className="text-blue-300 text-xs" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                <strong>INSTRUCCIONES:</strong> Obtén tu API Key en{' '}
                <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="underline">
                  Google Cloud Console
                </a>
                {' '}→ APIs & Services → Credentials. Asegúrate de activar "Distance Matrix API".
              </div>
            </div>
          </div>

          {/* IMPORTACIÓN TRANSBORDO */}
          <div className="bg-[rgba(15,23,42,0.5)] border border-white/10 rounded-lg p-4">
            <h3 className="text-white mb-3 flex items-center gap-2" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 700 }}>
              <Navigation className="w-4 h-4 text-blue-400" />
              IMPORTACIÓN - TRANSBORDO
            </h3>
            <div className="grid grid-cols-4 gap-3">
              <InputTarifa label="CORTA SECA REGULAR" value={tarifas.impoTransbordoCortaSecaRegular} onChange={(v) => setTarifas({...tarifas, impoTransbordoCortaSecaRegular: v})} />
              <InputTarifa label="CORTA REFRIGERADA REGULAR" value={tarifas.impoTransbordoCortaRefrigeradaRegular} onChange={(v) => setTarifas({...tarifas, impoTransbordoCortaRefrigeradaRegular: v})} />
              <InputTarifa label="CORTA SECA HAZMAT" value={tarifas.impoTransbordoCortaSecaHazmat} onChange={(v) => setTarifas({...tarifas, impoTransbordoCortaSecaHazmat: v})} />
              <InputTarifa label="CORTA REFRIGERADA HAZMAT" value={tarifas.impoTransbordoCortaRefrigeradaHazmat} onChange={(v) => setTarifas({...tarifas, impoTransbordoCortaRefrigeradaHazmat: v})} />
              <InputTarifa label="LARGA SECA REGULAR" value={tarifas.impoTransbordoLargaSecaRegular} onChange={(v) => setTarifas({...tarifas, impoTransbordoLargaSecaRegular: v})} />
              <InputTarifa label="LARGA REFRIGERADA REGULAR" value={tarifas.impoTransbordoLargaRefrigeradaRegular} onChange={(v) => setTarifas({...tarifas, impoTransbordoLargaRefrigeradaRegular: v})} />
              <InputTarifa label="LARGA SECA HAZMAT" value={tarifas.impoTransbordoLargaSecaHazmat} onChange={(v) => setTarifas({...tarifas, impoTransbordoLargaSecaHazmat: v})} />
              <InputTarifa label="LARGA REFRIGERADA HAZMAT" value={tarifas.impoTransbordoLargaRefrigeradaHazmat} onChange={(v) => setTarifas({...tarifas, impoTransbordoLargaRefrigeradaHazmat: v})} />
            </div>
          </div>

          {/* IMPORTACIÓN DTD MÉXICO */}
          <div className="bg-[rgba(15,23,42,0.5)] border border-white/10 rounded-lg p-4">
            <h3 className="text-white mb-3 flex items-center gap-2" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 700 }}>
              <Truck className="w-4 h-4 text-green-400" />
              IMPORTACIÓN DTD - MÉXICO
            </h3>
            <div className="grid grid-cols-4 gap-3">
              <InputTarifa label="CORTA SECA REGULAR" value={tarifas.impoDtdCortaSecaRegular} onChange={(v) => setTarifas({...tarifas, impoDtdCortaSecaRegular: v})} />
              <InputTarifa label="CORTA REFRIGERADA REGULAR" value={tarifas.impoDtdCortaRefrigeradaRegular} onChange={(v) => setTarifas({...tarifas, impoDtdCortaRefrigeradaRegular: v})} />
              <InputTarifa label="LARGA SECA REGULAR" value={tarifas.impoDtdLargaSecaRegular} onChange={(v) => setTarifas({...tarifas, impoDtdLargaSecaRegular: v})} />
              <InputTarifa label="LARGA REFRIGERADA REGULAR" value={tarifas.impoDtdLargaRefrigeradaRegular} onChange={(v) => setTarifas({...tarifas, impoDtdLargaRefrigeradaRegular: v})} />
            </div>
          </div>

          {/* IMPORTACIÓN DTD USA */}
          <div className="bg-[rgba(15,23,42,0.5)] border border-white/10 rounded-lg p-4">
            <h3 className="text-white mb-3 flex items-center gap-2" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 700 }}>
              <Truck className="w-4 h-4 text-purple-400" />
              IMPORTACIÓN DTD - USA
            </h3>
            <div className="grid grid-cols-4 gap-3">
              <InputTarifa label="SECO MILLAS CORTAS" value={tarifas.impoDtdUsaSecoCortaMillas} onChange={(v) => setTarifas({...tarifas, impoDtdUsaSecoCortaMillas: v})} suffix="USD/mi" />
              <InputTarifa label="SECO MILLAS LARGAS" value={tarifas.impoDtdUsaSecoLargaMillas} onChange={(v) => setTarifas({...tarifas, impoDtdUsaSecoLargaMillas: v})} suffix="USD/mi" />
              <InputTarifa label="REFRIGERADO MILLAS CORTAS" value={tarifas.impoDtdUsaRefrigeradoCortaMillas} onChange={(v) => setTarifas({...tarifas, impoDtdUsaRefrigeradoCortaMillas: v})} suffix="USD/mi" />
              <InputTarifa label="REFRIGERADO MILLAS LARGAS" value={tarifas.impoDtdUsaRefrigeradoLargaMillas} onChange={(v) => setTarifas({...tarifas, impoDtdUsaRefrigeradoLargaMillas: v})} suffix="USD/mi" />
            </div>
          </div>

          {/* EXPORTACIÓN DTD USA */}
          <div className="bg-[rgba(15,23,42,0.5)] border border-white/10 rounded-lg p-4">
            <h3 className="text-white mb-3 flex items-center gap-2" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 700 }}>
              <Truck className="w-4 h-4 text-orange-400" />
              EXPORTACIÓN DTD - USA
            </h3>
            <div className="grid grid-cols-4 gap-3">
              <InputTarifa label="SECO MILLAS CORTAS" value={tarifas.expoDtdUsaSecoCortaMillas} onChange={(v) => setTarifas({...tarifas, expoDtdUsaSecoCortaMillas: v})} suffix="USD/mi" />
              <InputTarifa label="SECO MILLAS LARGAS" value={tarifas.expoDtdUsaSecoLargaMillas} onChange={(v) => setTarifas({...tarifas, expoDtdUsaSecoLargaMillas: v})} suffix="USD/mi" />
              <InputTarifa label="REFRIGERADO MILLAS CORTAS" value={tarifas.expoDtdUsaRefrigeradoCortaMillas} onChange={(v) => setTarifas({...tarifas, expoDtdUsaRefrigeradoCortaMillas: v})} suffix="USD/mi" />
              <InputTarifa label="REFRIGERADO MILLAS LARGAS" value={tarifas.expoDtdUsaRefrigeradoLargaMillas} onChange={(v) => setTarifas({...tarifas, expoDtdUsaRefrigeradoLargaMillas: v})} suffix="USD/mi" />
            </div>
          </div>

          {/* DOMÉSTICO USA */}
          <div className="bg-[rgba(15,23,42,0.5)] border border-white/10 rounded-lg p-4">
            <h3 className="text-white mb-3 flex items-center gap-2" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 700 }}>
              <Package className="w-4 h-4 text-red-400" />
              DOMÉSTICO USA
            </h3>
            <div className="grid grid-cols-4 gap-3">
              <InputTarifa label="SECO MILLAS CORTAS" value={tarifas.domesticoUsaSecoCortaMillas} onChange={(v) => setTarifas({...tarifas, domesticoUsaSecoCortaMillas: v})} suffix="USD/mi" />
              <InputTarifa label="SECO MILLAS LARGAS" value={tarifas.domesticoUsaSecoLargaMillas} onChange={(v) => setTarifas({...tarifas, domesticoUsaSecoLargaMillas: v})} suffix="USD/mi" />
              <InputTarifa label="REFRIGERADO MILLAS CORTAS" value={tarifas.domesticoUsaRefrigeradoCortaMillas} onChange={(v) => setTarifas({...tarifas, domesticoUsaRefrigeradoCortaMillas: v})} suffix="USD/mi" />
              <InputTarifa label="REFRIGERADO MILLAS LARGAS" value={tarifas.domesticoUsaRefrigeradoLargaMillas} onChange={(v) => setTarifas({...tarifas, domesticoUsaRefrigeradoLargaMillas: v})} suffix="USD/mi" />
            </div>
          </div>

          {/* NACIONAL MÉXICO */}
          <div className="bg-[rgba(15,23,42,0.5)] border border-white/10 rounded-lg p-4">
            <h3 className="text-white mb-3 flex items-center gap-2" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 700 }}>
              <Navigation className="w-4 h-4 text-yellow-400" />
              NACIONAL MÉXICO
            </h3>
            <div className="grid grid-cols-4 gap-3">
              <InputTarifa label="VACÍO" value={tarifas.nacionalVacio} onChange={(v) => setTarifas({...tarifas, nacionalVacio: v})} />
              <InputTarifa label="CORTA SECA REGULAR" value={tarifas.nacionalCortaSecaRegular} onChange={(v) => setTarifas({...tarifas, nacionalCortaSecaRegular: v})} />
              <InputTarifa label="LARGA SECA REGULAR" value={tarifas.nacionalLargaSecaRegular} onChange={(v) => setTarifas({...tarifas, nacionalLargaSecaRegular: v})} />
              <InputTarifa label="CORTA REFRIGERADA REGULAR" value={tarifas.nacionalCortaRefrigeradaRegular} onChange={(v) => setTarifas({...tarifas, nacionalCortaRefrigeradaRegular: v})} />
              <InputTarifa label="LARGA REFRIGERADA REGULAR" value={tarifas.nacionalLargaRefrigeradaRegular} onChange={(v) => setTarifas({...tarifas, nacionalLargaRefrigeradaRegular: v})} />
              <InputTarifa label="CORTA SECA HAZMAT" value={tarifas.nacionalCortaSecaHazmat} onChange={(v) => setTarifas({...tarifas, nacionalCortaSecaHazmat: v})} />
              <InputTarifa label="LARGA SECA HAZMAT" value={tarifas.nacionalLargaSecaHazmat} onChange={(v) => setTarifas({...tarifas, nacionalLargaSecaHazmat: v})} />
              <InputTarifa label="CORTA REFRIGERADA HAZMAT" value={tarifas.nacionalCortaRefrigeradaHazmat} onChange={(v) => setTarifas({...tarifas, nacionalCortaRefrigeradaHazmat: v})} />
              <InputTarifa label="LARGA REFRIGERADA HAZMAT" value={tarifas.nacionalLargaRefrigeradaHazmat} onChange={(v) => setTarifas({...tarifas, nacionalLargaRefrigeradaHazmat: v})} />
            </div>
          </div>

          {/* OTROS */}
          <div className="bg-[rgba(15,23,42,0.5)] border border-white/10 rounded-lg p-4">
            <h3 className="text-white mb-3 flex items-center gap-2" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 700 }}>
              <DollarSign className="w-4 h-4 text-emerald-400" />
              OTROS
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <InputTarifa label="TIPO DE CAMBIO (USD → MXN)" value={tarifas.tipoCambio} onChange={(v) => setTarifas({...tarifas, tipoCambio: v})} suffix="MXN" />
              <InputTarifa label="CRUCE (DEFAULT DTD)" value={tarifas.cruce} onChange={(v) => setTarifas({...tarifas, cruce: v})} suffix="USD" />
            </div>
          </div>

          {/* BOTÓN GUARDAR */}
          <button
            onClick={handleGuardar}
            disabled={guardando}
            className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 700 }}
          >
            <Save className="w-5 h-5" />
            {guardando ? 'GUARDANDO...' : 'GUARDAR VARIABLES DE COTIZACIÓN'}
          </button>

          {/* NOTA */}
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="text-blue-300" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '10px' }}>
              <strong>NOTA:</strong> Estas variables se usarán automáticamente en el módulo de Cotizaciones. Ruta corta {'<'} 500 km (o 300 mi), Ruta larga {'>='} 500 km (o 300 mi).
            </div>
          </div>
        </div>
      </div>
    </ModuleTemplate>
  );
};