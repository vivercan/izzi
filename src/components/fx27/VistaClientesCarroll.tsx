import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Truck, MapPin, Clock, RefreshCw, Navigation, Search, List, Map as MapIcon, X, Phone, Gauge, Zap } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fbxbsslhewchyibdoyzk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieGJzc2xoZXdjaHlpYmRveXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzczODEsImV4cCI6MjA3ODExMzM4MX0.Z8JPlg7hhKbA624QGHp2bKKTNtCD3WInQMO5twjl6a0'
);

const GOOGLE_MAPS_KEY = 'AIzaSyBzElqSRGrJhkrBYrTGwxL0mb6v2pz4l64';

interface VistaClientesCarrollProps { onBack: () => void; }

interface Unidad {
  economico: string;
  empresa: string;
  gps_estatus: string;
  velocidad: number;
  latitud: number;
  longitud: number;
  ubicacion: string;
  ultima_actualizacion: string;
  estado_geo: string;
  municipio_geo: string;
  viaje_id: number | null;
  cliente_destino: string | null;
  operador_efectivo: string;
  telefono_efectivo: string;
}

const mapStylePremium = [
  { elementType: "geometry", stylers: [{ color: "#1e293b" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1e293b" }, { weight: 2 }] },
  { featureType: "administrative.country", elementType: "geometry.stroke", stylers: [{ color: "#475569" }, { weight: 1.5 }] },
  { featureType: "administrative.country", elementType: "labels.text.fill", stylers: [{ color: "#cbd5e1" }] },
  { featureType: "administrative.province", elementType: "geometry.stroke", stylers: [{ color: "#334155" }] },
  { featureType: "administrative.province", elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  { featureType: "administrative.locality", elementType: "labels", stylers: [{ visibility: "simplified" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
  { featureType: "administrative.neighborhood", stylers: [{ visibility: "off" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#334155" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#475569" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#334155" }] },
  { featureType: "road.arterial", stylers: [{ visibility: "simplified" }] },
  { featureType: "road.local", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0f172a" }] },
  { featureType: "water", elementType: "labels", stylers: [{ visibility: "off" }] },
];

const loadGoogleMaps = (): Promise<void> => {
  return new Promise((resolve) => {
    if (window.google?.maps) { resolve(); return; }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}`;
    script.async = true;
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
};

declare global { interface Window { google: any; } }

export const VistaClientesCarroll = ({ onBack }: VistaClientesCarrollProps) => {
  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [vista, setVista] = useState<'lista' | 'mapa'>('lista');
  const [selectedUnidad, setSelectedUnidad] = useState<Unidad | null>(null);
  const [hoveredUnidad, setHoveredUnidad] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const infoWindowRef = useRef<any>(null);

  useEffect(() => {
    fetchUnidades();
    const interval = setInterval(fetchUnidades, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (vista === 'mapa') {
      loadGoogleMaps().then(() => {
        setMapLoaded(true);
        initMap();
      });
    }
  }, [vista]);

  useEffect(() => {
    if (mapLoaded && googleMapRef.current && unidades.length > 0) {
      updateMarkers();
    }
  }, [unidades, mapLoaded, filtro, busqueda]);

  useEffect(() => {
    if (hoveredUnidad && markersRef.current.has(hoveredUnidad)) {
      const marker = markersRef.current.get(hoveredUnidad);
      if (marker) {
        marker.setAnimation(window.google?.maps?.Animation?.BOUNCE);
        setTimeout(() => marker.setAnimation(null), 700);
      }
    }
  }, [hoveredUnidad]);

  const fetchUnidades = async () => {
    try {
      const { data, error } = await supabase.from('carroll_monitor').select('*');
      if (!error && data) { setUnidades(data); setLastUpdate(new Date()); }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const initMap = () => {
    if (!mapRef.current || !window.google) return;
    
    googleMapRef.current = new window.google.maps.Map(mapRef.current, {
      center: { lat: 23.0, lng: -102.0 },
      zoom: 5.5,
      styles: mapStylePremium,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
      zoomControlOptions: { position: window.google.maps.ControlPosition.RIGHT_CENTER },
    });
    
    infoWindowRef.current = new window.google.maps.InfoWindow();
    updateMarkers();
  };

  const createMarkerIcon = (u: Unidad, isHovered: boolean = false) => {
    const isMoving = u.velocidad > 0;
    const baseColor = isMoving ? '#22c55e' : u.viaje_id ? '#f59e0b' : '#6b7280';
    const size = isHovered ? 50 : 42;
    
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size + 10}" viewBox="0 0 ${size} ${size + 10}">
        <defs>
          <filter id="shadow${u.economico}" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="${baseColor}" flood-opacity="0.5"/>
          </filter>
          ${isMoving ? `
          <filter id="glow${u.economico}">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          ` : ''}
        </defs>
        <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 4}" fill="${baseColor}" filter="${isMoving ? `url(#glow${u.economico})` : `url(#shadow${u.economico})`}" stroke="#fff" stroke-width="2"/>
        <text x="${size/2}" y="${size/2 + 1}" text-anchor="middle" dominant-baseline="middle" fill="#fff" font-size="${isHovered ? '12' : '10'}" font-weight="bold" font-family="Arial">${u.economico}</text>
        ${isMoving ? `<text x="${size/2}" y="${size/2 + 13}" text-anchor="middle" fill="#fff" font-size="8" font-family="Arial">${u.velocidad}km/h</text>` : ''}
        <polygon points="${size/2},${size + 6} ${size/2 - 6},${size - 2} ${size/2 + 6},${size - 2}" fill="${baseColor}"/>
      </svg>
    `;
    
    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
      scaledSize: new window.google.maps.Size(size, size + 10),
      anchor: new window.google.maps.Point(size / 2, size + 6),
    };
  };

  const updateMarkers = () => {
    if (!googleMapRef.current || !window.google) return;
    
    const filtered = getFilteredUnidades();
    const currentEcos = new Set(filtered.map(u => u.economico));
    
    markersRef.current.forEach((marker, eco) => {
      if (!currentEcos.has(eco)) {
        marker.setMap(null);
        markersRef.current.delete(eco);
      }
    });
    
    const bounds = new window.google.maps.LatLngBounds();
    
    filtered.forEach((u) => {
      if (!u.latitud || !u.longitud) return;
      
      const position = { lat: u.latitud, lng: u.longitud };
      bounds.extend(position);
      
      if (markersRef.current.has(u.economico)) {
        const marker = markersRef.current.get(u.economico);
        marker.setPosition(position);
        marker.setIcon(createMarkerIcon(u));
      } else {
        const marker = new window.google.maps.Marker({
          position,
          map: googleMapRef.current,
          icon: createMarkerIcon(u),
          title: `ECO ${u.economico}`,
          optimized: false,
        });
        
        marker.addListener('click', () => {
          const isMoving = u.velocidad > 0;
          const statusColor = isMoving ? '#22c55e' : u.viaje_id ? '#f59e0b' : '#6b7280';
          const statusText = isMoving ? `${u.velocidad} km/h` : u.viaje_id ? 'Detenido' : 'Sin viaje';
          
          infoWindowRef.current.setContent(`
            <div style="padding:12px;min-width:220px;font-family:system-ui,-apple-system,sans-serif;background:#0f172a;border-radius:12px;border:1px solid #334155;">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
                <div style="width:40px;height:40px;border-radius:10px;background:${statusColor}20;display:flex;align-items:center;justify-content:center;">
                  <span style="font-size:14px;font-weight:bold;color:${statusColor};">${u.economico}</span>
                </div>
                <div>
                  <div style="font-weight:600;color:#fff;font-size:14px;">${u.operador_efectivo || 'Sin operador'}</div>
                  <div style="color:#64748b;font-size:11px;">${u.empresa}</div>
                </div>
              </div>
              <div style="display:flex;gap:6px;margin-bottom:10px;">
                <span style="background:${statusColor};color:#fff;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:500;">${statusText}</span>
              </div>
              <div style="color:#94a3b8;font-size:11px;line-height:1.4;">
                <div style="margin-bottom:4px;">📍 ${u.ubicacion || 'Sin ubicación'}</div>
                ${u.cliente_destino ? `<div style="color:#60a5fa;">🎯 ${u.cliente_destino}</div>` : ''}
              </div>
            </div>
          `);
          infoWindowRef.current.open(googleMapRef.current, marker);
          setSelectedUnidad(u);
        });
        
        markersRef.current.set(u.economico, marker);
      }
    });
    
    if (filtered.length > 1) {
      googleMapRef.current.fitBounds(bounds, { padding: 50 });
      window.google.maps.event.addListenerOnce(googleMapRef.current, 'idle', () => {
        if (googleMapRef.current.getZoom() > 12) googleMapRef.current.setZoom(12);
        if (googleMapRef.current.getZoom() < 5) googleMapRef.current.setZoom(5);
      });
    }
  };

  const stats = {
    total: unidades.length,
    movimiento: unidades.filter(u => u.velocidad > 0).length,
    detenidos: unidades.filter(u => u.velocidad === 0 && u.viaje_id).length,
    sinViaje: unidades.filter(u => !u.viaje_id).length,
  };

  const getEstadoColor = (u: Unidad) => {
    if (u.velocidad > 0) return { bg: '#22c55e', text: 'En Movimiento', icon: '🟢' };
    if (u.viaje_id) return { bg: '#f59e0b', text: 'Detenido', icon: '🟡' };
    return { bg: '#6b7280', text: 'Sin Viaje', icon: '⚫' };
  };

  const tiempoDesde = (fecha: string) => {
    if (!fecha) return '-';
    const mins = Math.floor((Date.now() - new Date(fecha).getTime()) / 60000);
    if (mins < 1) return 'Ahora';
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins/60)}h`;
  };

  const getFilteredUnidades = () => unidades.filter(u => {
    const matchBusqueda = !busqueda || 
      u.economico.includes(busqueda) || 
      u.operador_efectivo?.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.ubicacion?.toLowerCase().includes(busqueda.toLowerCase());
    const matchFiltro = filtro === 'todos' || 
      (filtro === 'movimiento' && u.velocidad > 0) ||
      (filtro === 'detenido' && u.velocidad === 0);
    return matchBusqueda && matchFiltro;
  });

  const filtered = getFilteredUnidades();

  const focusOnUnit = (u: Unidad) => {
    setSelectedUnidad(u);
    if (vista === 'mapa' && googleMapRef.current && u.latitud && u.longitud) {
      googleMapRef.current.panTo({ lat: u.latitud, lng: u.longitud });
      googleMapRef.current.setZoom(12);
      const marker = markersRef.current.get(u.economico);
      if (marker) window.google.maps.event.trigger(marker, 'click');
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#0B1220' }}>
      {/* Header */}
      <div className="px-4 py-3 border-b" style={{ borderColor: '#1e293b' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 rounded-lg hover:bg-slate-800 transition-colors"><ArrowLeft className="w-5 h-5 text-white" /></button>
            <div>
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-500" />
                <span className="text-white font-bold">Granjas Carroll</span>
                <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: '#10b981', color: '#fff' }}>TORRE DE CONTROL</span>
              </div>
              <span className="text-xs text-gray-500">Actualizado: {lastUpdate.toLocaleTimeString('es-MX')}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchUnidades} className="p-2 rounded-lg hover:bg-slate-800 transition-colors">
              <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-500 text-xs font-medium">En vivo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats + Filtros */}
      <div className="px-4 py-3 border-b flex items-center justify-between gap-4 flex-wrap" style={{ borderColor: '#1e293b' }}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: '#1e293b' }}>
            <span className="text-xl font-bold text-white">{stats.total}</span>
            <span className="text-gray-500 text-xs">Total</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <Zap className="w-4 h-4 text-emerald-500" />
            <span className="text-emerald-500 font-bold">{stats.movimiento}</span>
            <span className="text-emerald-500/70 text-xs">Movimiento</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-amber-500 font-bold">{stats.detenidos}</span>
            <span className="text-amber-500/70 text-xs">Detenidos</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid #334155' }}>
            <button onClick={() => setVista('lista')} className="flex items-center gap-1 px-3 py-2 text-sm transition-colors" style={{ background: vista === 'lista' ? '#10b981' : '#1e293b', color: vista === 'lista' ? '#fff' : '#94a3b8' }}>
              <List className="w-4 h-4" />Lista
            </button>
            <button onClick={() => setVista('mapa')} className="flex items-center gap-1 px-3 py-2 text-sm transition-colors" style={{ background: vista === 'mapa' ? '#10b981' : '#1e293b', color: vista === 'mapa' ? '#fff' : '#94a3b8' }}>
              <MapIcon className="w-4 h-4" />Mapa
            </button>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar eco..." className="pl-9 pr-3 py-2 rounded-lg text-sm text-white transition-colors focus:outline-none focus:ring-1 focus:ring-emerald-500" style={{ background: '#1e293b', border: '1px solid #334155', width: '140px' }} />
          </div>
          <select value={filtro} onChange={(e) => setFiltro(e.target.value)} className="px-3 py-2 rounded-lg text-sm text-gray-300 cursor-pointer" style={{ background: '#1e293b', border: '1px solid #334155' }}>
            <option value="todos">Todos</option>
            <option value="movimiento">En movimiento</option>
            <option value="detenido">Detenidos</option>
          </select>
        </div>
      </div>

      {/* Contenido */}
      {vista === 'lista' ? (
        <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 140px)' }}>
          <table className="w-full">
            <thead className="sticky top-0" style={{ background: '#0f172a' }}>
              <tr className="text-left text-xs text-gray-500 uppercase">
                <th className="px-4 py-3">ECO</th>
                <th className="px-4 py-3">Empresa</th>
                <th className="px-4 py-3">Estatus</th>
                <th className="px-4 py-3">Velocidad</th>
                <th className="px-4 py-3">Ubicacion</th>
                <th className="px-4 py-3">Destino</th>
                <th className="px-4 py-3 text-right">Actualizado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const estado = getEstadoColor(u);
                return (
                  <tr key={u.economico} className="border-b hover:bg-slate-800/50 cursor-pointer transition-colors" style={{ borderColor: '#1e293b' }} onClick={() => setSelectedUnidad(u)}>
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${estado.bg}20` }}><span className="font-bold text-sm" style={{ color: estado.bg }}>{u.economico}</span></div></div></td>
                    <td className="px-4 py-3"><span className="px-2 py-1 rounded text-xs font-bold" style={{ background: u.empresa === 'TROB' ? '#3b82f6' : u.empresa === 'WE' ? '#8b5cf6' : '#f59e0b', color: '#fff' }}>{u.empresa}</span></td>
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ background: estado.bg }} /><span className="text-sm" style={{ color: estado.bg }}>{estado.text}</span></div></td>
                    <td className="px-4 py-3">{u.velocidad > 0 ? <span className="text-emerald-400 font-medium">{u.velocidad} km/h</span> : <span className="text-gray-500">-</span>}</td>
                    <td className="px-4 py-3"><div className="flex items-center gap-1 max-w-[280px]"><MapPin className="w-3 h-3 text-blue-500 flex-shrink-0" /><span className="text-gray-400 text-sm truncate">{u.ubicacion || '-'}</span></div></td>
                    <td className="px-4 py-3">{u.cliente_destino ? <span className="text-blue-400 text-sm">{u.cliente_destino}</span> : <span className="text-gray-600 text-sm">Sin asignar</span>}</td>
                    <td className="px-4 py-3 text-right"><span className="text-gray-500 text-sm">{tiempoDesde(u.ultima_actualizacion)}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex" style={{ height: 'calc(100vh - 140px)' }}>
          {/* Mapa */}
          <div className="flex-1 relative">
            <div ref={mapRef} className="w-full h-full" />
            {!mapLoaded && <div className="absolute inset-0 flex items-center justify-center" style={{ background: '#0f172a' }}><RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" /></div>}
            
            {/* Leyenda flotante */}
            <div className="absolute top-4 left-4 flex items-center gap-3 px-4 py-2 rounded-xl" style={{ background: 'rgba(15,23,42,0.95)', border: '1px solid #334155', backdropFilter: 'blur(8px)' }}>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
                <span className="text-xs text-gray-300">Movimiento</span>
              </div>
              <div className="w-px h-4 bg-slate-700" />
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ background: '#f59e0b' }} />
                <span className="text-xs text-gray-300">Detenido</span>
              </div>
              <div className="w-px h-4 bg-slate-700" />
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ background: '#6b7280' }} />
                <span className="text-xs text-gray-300">Sin viaje</span>
              </div>
            </div>
          </div>
          
          {/* Panel lateral premium */}
          <div className="w-80 border-l overflow-auto" style={{ borderColor: '#1e293b', background: '#0a0f1a' }}>
            <div className="p-4 border-b sticky top-0 z-10" style={{ borderColor: '#1e293b', background: '#0a0f1a' }}>
              <div className="flex items-center justify-between">
                <span className="text-white font-semibold">UNIDADES</span>
                <span className="text-emerald-500 text-sm font-bold">{filtered.length}</span>
              </div>
            </div>
            
            <div className="p-2 space-y-2">
              {filtered.map((u) => {
                const estado = getEstadoColor(u);
                const isSelected = selectedUnidad?.economico === u.economico;
                const isHovered = hoveredUnidad === u.economico;
                
                return (
                  <button
                    key={u.economico}
                    onClick={() => focusOnUnit(u)}
                    onMouseEnter={() => setHoveredUnidad(u.economico)}
                    onMouseLeave={() => setHoveredUnidad(null)}
                    className={`w-full p-3 rounded-xl text-left transition-all duration-200 ${isSelected ? 'ring-1 ring-emerald-500' : ''}`}
                    style={{ 
                      background: isSelected ? 'rgba(16,185,129,0.1)' : isHovered ? '#1e293b' : '#111827',
                      borderLeft: `4px solid ${estado.bg}`,
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${estado.bg}20` }}>
                          <span className="font-bold" style={{ color: estado.bg }}>{u.economico}</span>
                        </div>
                        <div>
                          <div className="text-white font-medium text-sm">{u.operador_efectivo || 'Sin operador'}</div>
                          <div className="text-gray-500 text-xs">{u.empresa}</div>
                        </div>
                      </div>
                      {u.velocidad > 0 && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: 'rgba(34,197,94,0.2)' }}>
                          <Zap className="w-3 h-3 text-emerald-500" />
                          <span className="text-emerald-500 text-xs font-bold">{u.velocidad} km/h</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1 text-gray-400 text-xs">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{u.ubicacion || 'Sin ubicación'}</span>
                    </div>
                    
                    {u.cliente_destino && (
                      <div className="flex items-center gap-1 text-blue-400 text-xs mt-1">
                        <span>→</span>
                        <span className="truncate">{u.cliente_destino}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: '1px solid #1e293b' }}>
                      <span className="text-xs px-2 py-0.5 rounded" style={{ background: `${estado.bg}20`, color: estado.bg }}>{estado.text}</span>
                      <span className="text-gray-500 text-xs">{tiempoDesde(u.ultima_actualizacion)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalle */}
      {selectedUnidad && vista === 'lista' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedUnidad(null)}>
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }} />
          <div className="relative w-full max-w-2xl rounded-2xl overflow-hidden" style={{ background: '#0f172a', border: '1px solid #334155' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#1e293b' }}>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: `${getEstadoColor(selectedUnidad).bg}20` }}>
                  <span className="text-xl font-bold" style={{ color: getEstadoColor(selectedUnidad).bg }}>{selectedUnidad.economico}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-white">{selectedUnidad.operador_efectivo || 'Sin operador'}</span>
                    <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: selectedUnidad.empresa === 'TROB' ? '#3b82f6' : '#8b5cf6', color: '#fff' }}>{selectedUnidad.empresa}</span>
                  </div>
                  <span className="text-gray-400 text-sm">{getEstadoColor(selectedUnidad).text}</span>
                </div>
              </div>
              <button onClick={() => setSelectedUnidad(null)} className="p-2 rounded-lg hover:bg-slate-800 transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="h-56">
              {selectedUnidad.latitud && selectedUnidad.longitud ? (
                <iframe width="100%" height="100%" style={{ border: 0 }} loading="lazy" src={`https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_KEY}&q=${selectedUnidad.latitud},${selectedUnidad.longitud}&zoom=15&maptype=roadmap`} />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: '#1e293b' }}><span className="text-gray-500">Sin coordenadas GPS</span></div>
              )}
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-xl text-center" style={{ background: '#1e293b' }}><Gauge className="w-6 h-6 text-emerald-500 mx-auto mb-2" /><p className="text-2xl font-bold text-white">{selectedUnidad.velocidad || 0}</p><p className="text-xs text-gray-500">km/h</p></div>
                <div className="p-4 rounded-xl text-center" style={{ background: '#1e293b' }}><Navigation className="w-6 h-6 text-blue-500 mx-auto mb-2" /><p className="text-lg font-bold text-white">{selectedUnidad.gps_estatus || 'N/A'}</p><p className="text-xs text-gray-500">GPS</p></div>
                <div className="p-4 rounded-xl text-center" style={{ background: '#1e293b' }}><Clock className="w-6 h-6 text-amber-500 mx-auto mb-2" /><p className="text-lg font-bold text-white">{tiempoDesde(selectedUnidad.ultima_actualizacion)}</p><p className="text-xs text-gray-500">Actualizado</p></div>
              </div>
              <div className="p-4 rounded-xl" style={{ background: '#1e293b' }}><div className="flex items-start gap-2"><MapPin className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" /><div><p className="text-white">{selectedUnidad.ubicacion || 'Ubicacion no disponible'}</p><p className="text-gray-500 text-sm mt-1">{selectedUnidad.estado_geo}, {selectedUnidad.municipio_geo}</p></div></div></div>
              {selectedUnidad.cliente_destino && (
                <div className="p-4 rounded-xl" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
                  <p className="text-xs text-gray-400 uppercase mb-1">Destino</p>
                  <p className="text-blue-400 font-medium">{selectedUnidad.cliente_destino}</p>
                </div>
              )}
              <div className="flex gap-3">
                {selectedUnidad.telefono_efectivo && (<a href={`tel:${selectedUnidad.telefono_efectivo}`} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors hover:opacity-90" style={{ background: '#10b981', color: '#fff' }}><Phone className="w-4 h-4" />Llamar</a>)}
                <button onClick={() => window.open(`https://www.google.com/maps?q=${selectedUnidad.latitud},${selectedUnidad.longitud}`, '_blank')} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors hover:opacity-90" style={{ background: '#3b82f6', color: '#fff' }}><MapIcon className="w-4 h-4" />Abrir Maps</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VistaClientesCarroll;


