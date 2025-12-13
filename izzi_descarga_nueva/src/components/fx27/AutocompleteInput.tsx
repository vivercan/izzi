import { useEffect, useRef, useState } from 'react';

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  apiKey: string;
  componentRestrictions?: { country: string | string[] };
}

// Variable global para rastrear si el script ya fue cargado
let scriptLoaded = false;
let scriptLoading = false;
const loadCallbacks: (() => void)[] = [];

export const AutocompleteInput = ({
  value,
  onChange,
  placeholder = '',
  className = '',
  style = {},
  apiKey
}: AutocompleteInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadGoogleMapsScript = () => {
      return new Promise<void>((resolve) => {
        // Si ya está cargado, resolver inmediatamente
        if (scriptLoaded && window.google?.maps?.places) {
          resolve();
          return;
        }

        // Si está cargando, agregar callback a la cola
        if (scriptLoading) {
          loadCallbacks.push(resolve);
          return;
        }

        // Verificar si ya existe el script
        const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
        if (existingScript && window.google?.maps?.places) {
          scriptLoaded = true;
          resolve();
          return;
        }

        // Si existe el script pero aún no está listo, esperar
        if (existingScript) {
          const checkInterval = setInterval(() => {
            if (window.google?.maps?.places) {
              clearInterval(checkInterval);
              scriptLoaded = true;
              resolve();
            }
          }, 100);
          return;
        }

        // Marcar como cargando
        scriptLoading = true;

        // Crear script con loading=async
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
          // Esperar a que google.maps.places esté disponible
          const checkReady = setInterval(() => {
            if (window.google?.maps?.places) {
              clearInterval(checkReady);
              scriptLoaded = true;
              scriptLoading = false;
              resolve();
              
              // Ejecutar todos los callbacks pendientes
              loadCallbacks.forEach(cb => cb());
              loadCallbacks.length = 0;
            }
          }, 50);
        };

        script.onerror = () => {
          console.error('Error al cargar Google Maps API');
          scriptLoading = false;
        };

        document.head.appendChild(script);
      });
    };

    const initAutocomplete = async () => {
      try {
        await loadGoogleMapsScript();

        if (!inputRef.current || !window.google?.maps?.places) {
          return;
        }

        // Limpiar autocomplete anterior si existe
        if (autocompleteRef.current) {
          google.maps.event.clearInstanceListeners(autocompleteRef.current);
          autocompleteRef.current = null;
        }

        // Inicializar autocomplete con el método actual (seguirá funcionando)
        autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ['(cities)', 'postal_code'],
          fields: ['formatted_address', 'name', 'address_components']
        });

        // Listener cuando el usuario selecciona un lugar
        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current?.getPlace();
          if (place?.formatted_address) {
            onChange(place.formatted_address);
          } else if (place?.name) {
            onChange(place.name);
          }
        });

        setIsLoaded(true);
      } catch (error) {
        console.error('Error inicializando autocomplete:', error);
      }
    };

    initAutocomplete();

    return () => {
      // Limpiar listeners al desmontar
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, [apiKey]);

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
      style={style}
      autoComplete="off"
    />
  );
};

// Declaración de tipos para TypeScript
declare global {
  interface Window {
    google: any;
  }
}
