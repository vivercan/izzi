import { useState, useEffect } from 'react';
import { ArrowLeft, Truck, MapPin, Plus, Trash2, Save, Edit2, X } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface AdministracionCarrollProps {
  onBack: () => void;
}

interface Unidad {
  numeroTracto: string;
  operador: string;
  numeroRemolque: string;
}

interface Geocerca {
  id: string;
  nombre: string;
  ciudad: string;
  estado: string;
  lat: number;
  lng: number;
  radio: number;
}

export const AdministracionCarroll = ({ onBack }: AdministracionCarrollProps) => {
  const [tabActivo, setTabActivo] = useState<'unidades' | 'geocercas'>('unidades');
  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [geocercas, setGeocercas] = useState<Geocerca[]>([]);
  const [cargando, setCargando] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [agregando, setAgregando] = useState(false);
  
  // Estados para formularios
  const [formUnidad, setFormUnidad] = useState<Unidad>({ numeroTracto: '', operador: '', numeroRemolque: '' });
  const [formGeocerca, setFormGeocerca] = useState<Geocerca>({ 
    id: '', nombre: '', ciudad: '', estado: '', lat: 0, lng: 0, radio: 600 
  });

  // Cargar datos al montar
  useEffect(() => {
    if (tabActivo === 'unidades') {
      cargarUnidades();
    } else {
      cargarGeocercas();
    }
  }, [tabActivo]);

  const cargarUnidades = async () => {
    setCargando(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/carroll/unidades`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }
      );
      const data = await response.json();
      if (data.success) {
        setUnidades(data.unidades);
      }
    } catch (error) {
      console.error('Error cargando unidades:', error);
    } finally {
      setCargando(false);
    }
  };

  const cargarGeocercas = async () => {
    setCargando(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/carroll/geocercas`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }
      );
      const data = await response.json();
      if (data.success) {
        setGeocercas(data.geocercas);
      }
    } catch (error) {
      console.error('Error cargando geocercas:', error);
    } finally {
      setCargando(false);
    }
  };

  const guardarUnidad = async (unidad: Unidad) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/carroll/unidades`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify(unidad)
        }
      );
      const data = await response.json();
      if (data.success) {
        await cargarUnidades();
        setEditando(null);
        setAgregando(false);
        setFormUnidad({ numeroTracto: '', operador: '', numeroRemolque: '' });
      }
    } catch (error) {
      console.error('Error guardando unidad:', error);
    }
  };

  const eliminarUnidad = async (numeroTracto: string) => {
    if (!confirm(`¿Eliminar unidad ${numeroTracto}?`)) return;
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/carroll/unidades/${numeroTracto}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }
      );
      const data = await response.json();
      if (data.success) {
        await cargarUnidades();
      }
    } catch (error) {
      console.error('Error eliminando unidad:', error);
    }
  };

  const guardarGeocerca = async (geocerca: Geocerca) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/carroll/geocercas`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify(geocerca)
        }
      );
      const data = await response.json();
      if (data.success) {
        await cargarGeocercas();
        setEditando(null);
        setAgregando(false);
        setFormGeocerca({ id: '', nombre: '', ciudad: '', estado: '', lat: 0, lng: 0, radio: 600 });
      }
    } catch (error) {
      console.error('Error guardando geocerca:', error);
    }
  };

  const eliminarGeocerca = async (id: string) => {
    if (!confirm('¿Eliminar esta geocerca?')) return;
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/carroll/geocercas/${id}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }
      );
      const data = await response.json();
      if (data.success) {
        await cargarGeocercas();
      }
    } catch (error) {
      console.error('Error eliminando geocerca:', error);
    }
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: '#0B1220', fontFamily: "'Exo 2', sans-serif" }}>
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div>
            <h1 className="text-white" style={{ fontSize: '24px', fontWeight: 800 }}>
              Administración Carroll
            </h1>
            <p className="text-slate-400" style={{ fontSize: '12px' }}>
              Gestión de unidades dedicadas y geocercas
            </p>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTabActivo('unidades')}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
            tabActivo === 'unidades'
              ? 'bg-[#1E66F5] text-white'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
          style={{ fontSize: '12px', fontWeight: 700 }}
        >
          <Truck className="w-4 h-4" />
          Unidades ({unidades.length}/31)
        </button>
        <button
          onClick={() => setTabActivo('geocercas')}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
            tabActivo === 'geocercas'
              ? 'bg-[#1E66F5] text-white'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
          style={{ fontSize: '12px', fontWeight: 700 }}
        >
          <MapPin className="w-4 h-4" />
          Geocercas ({geocercas.length})
        </button>
      </div>

      {/* CONTENIDO */}
      <div className="bg-slate-900 rounded-xl p-6" style={{ border: '1px solid rgba(30, 102, 245, 0.2)' }}>
        {tabActivo === 'unidades' ? (
          <>
            {/* BOTÓN AGREGAR UNIDAD */}
            <div className="flex justify-end mb-4">
              <button
                onClick={() => {
                  setAgregando(true);
                  setEditando(null);
                  setFormUnidad({ numeroTracto: '', operador: '', numeroRemolque: '' });
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                style={{ fontSize: '11px', fontWeight: 700 }}
              >
                <Plus className="w-4 h-4" />
                Agregar Unidad
              </button>
            </div>

            {/* FORMULARIO AGREGAR */}
            {agregando && (
              <div className="mb-4 p-4 bg-slate-800 rounded-lg" style={{ border: '1px solid #1E66F5' }}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white" style={{ fontSize: '12px', fontWeight: 700 }}>
                    Nueva Unidad
                  </h3>
                  <button onClick={() => setAgregando(false)} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Nº Tracto"
                    value={formUnidad.numeroTracto}
                    onChange={(e) => setFormUnidad({ ...formUnidad, numeroTracto: e.target.value })}
                    className="px-3 py-2 bg-slate-900 text-white rounded-lg border border-slate-700 focus:border-[#1E66F5] outline-none"
                    style={{ fontSize: '11px' }}
                  />
                  <input
                    type="text"
                    placeholder="Operador"
                    value={formUnidad.operador}
                    onChange={(e) => setFormUnidad({ ...formUnidad, operador: e.target.value.toUpperCase() })}
                    className="px-3 py-2 bg-slate-900 text-white rounded-lg border border-slate-700 focus:border-[#1E66F5] outline-none"
                    style={{ fontSize: '11px' }}
                  />
                  <input
                    type="text"
                    placeholder="Nº Remolque"
                    value={formUnidad.numeroRemolque}
                    onChange={(e) => setFormUnidad({ ...formUnidad, numeroRemolque: e.target.value })}
                    className="px-3 py-2 bg-slate-900 text-white rounded-lg border border-slate-700 focus:border-[#1E66F5] outline-none"
                    style={{ fontSize: '11px' }}
                  />
                </div>
                <div className="flex justify-end gap-2 mt-3">
                  <button
                    onClick={() => setAgregando(false)}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                    style={{ fontSize: '10px', fontWeight: 600 }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => guardarUnidad(formUnidad)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1"
                    style={{ fontSize: '10px', fontWeight: 600 }}
                  >
                    <Save className="w-3 h-3" />
                    Guardar
                  </button>
                </div>
              </div>
            )}

            {/* LISTA DE UNIDADES */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {cargando ? (
                <div className="text-center text-slate-400 py-8">Cargando...</div>
              ) : unidades.length === 0 ? (
                <div className="text-center text-slate-400 py-8">No hay unidades registradas</div>
              ) : (
                unidades.map((unidad) => (
                  <div
                    key={unidad.numeroTracto}
                    className="p-3 bg-slate-800 rounded-lg hover:bg-slate-750 transition-colors"
                    style={{ border: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    {editando === unidad.numeroTracto ? (
                      <>
                        <div className="grid grid-cols-3 gap-3">
                          <input
                            type="text"
                            value={formUnidad.numeroTracto}
                            onChange={(e) => setFormUnidad({ ...formUnidad, numeroTracto: e.target.value })}
                            className="px-3 py-2 bg-slate-900 text-white rounded-lg border border-slate-700 focus:border-[#1E66F5] outline-none"
                            style={{ fontSize: '11px' }}
                          />
                          <input
                            type="text"
                            value={formUnidad.operador}
                            onChange={(e) => setFormUnidad({ ...formUnidad, operador: e.target.value.toUpperCase() })}
                            className="px-3 py-2 bg-slate-900 text-white rounded-lg border border-slate-700 focus:border-[#1E66F5] outline-none"
                            style={{ fontSize: '11px' }}
                          />
                          <input
                            type="text"
                            value={formUnidad.numeroRemolque}
                            onChange={(e) => setFormUnidad({ ...formUnidad, numeroRemolque: e.target.value })}
                            className="px-3 py-2 bg-slate-900 text-white rounded-lg border border-slate-700 focus:border-[#1E66F5] outline-none"
                            style={{ fontSize: '11px' }}
                          />
                        </div>
                        <div className="flex justify-end gap-2 mt-3">
                          <button
                            onClick={() => {
                              setEditando(null);
                              setFormUnidad({ numeroTracto: '', operador: '', numeroRemolque: '' });
                            }}
                            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                            style={{ fontSize: '10px', fontWeight: 600 }}
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => guardarUnidad(formUnidad)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1"
                            style={{ fontSize: '10px', fontWeight: 600 }}
                          >
                            <Save className="w-3 h-3" />
                            Guardar
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-[#1E66F5]" style={{ fontSize: '16px', fontWeight: 800, minWidth: '60px' }}>
                            {unidad.numeroTracto}
                          </div>
                          <div>
                            <div className="text-white" style={{ fontSize: '11px', fontWeight: 700 }}>
                              {unidad.operador}
                            </div>
                            <div className="text-slate-400" style={{ fontSize: '9px' }}>
                              Remolque: {unidad.numeroRemolque}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditando(unidad.numeroTracto);
                              setFormUnidad(unidad);
                              setAgregando(false);
                            }}
                            className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => eliminarUnidad(unidad.numeroTracto)}
                            className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            {/* BOTÓN AGREGAR GEOCERCA */}
            <div className="flex justify-end mb-4">
              <button
                onClick={() => {
                  setAgregando(true);
                  setEditando(null);
                  setFormGeocerca({ id: '', nombre: '', ciudad: '', estado: '', lat: 0, lng: 0, radio: 600 });
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                style={{ fontSize: '11px', fontWeight: 700 }}
              >
                <Plus className="w-4 h-4" />
                Agregar Geocerca
              </button>
            </div>

            {/* FORMULARIO AGREGAR GEOCERCA */}
            {agregando && (
              <div className="mb-4 p-4 bg-slate-800 rounded-lg" style={{ border: '1px solid #1E66F5' }}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white" style={{ fontSize: '12px', fontWeight: 700 }}>
                    Nueva Geocerca
                  </h3>
                  <button onClick={() => setAgregando(false)} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="ID (ej: gc-cliente-1)"
                    value={formGeocerca.id}
                    onChange={(e) => setFormGeocerca({ ...formGeocerca, id: e.target.value })}
                    className="px-3 py-2 bg-slate-900 text-white rounded-lg border border-slate-700 focus:border-[#1E66F5] outline-none"
                    style={{ fontSize: '11px' }}
                  />
                  <input
                    type="text"
                    placeholder="Nombre"
                    value={formGeocerca.nombre}
                    onChange={(e) => setFormGeocerca({ ...formGeocerca, nombre: e.target.value })}
                    className="px-3 py-2 bg-slate-900 text-white rounded-lg border border-slate-700 focus:border-[#1E66F5] outline-none"
                    style={{ fontSize: '11px' }}
                  />
                  <input
                    type="text"
                    placeholder="Ciudad"
                    value={formGeocerca.ciudad}
                    onChange={(e) => setFormGeocerca({ ...formGeocerca, ciudad: e.target.value })}
                    className="px-3 py-2 bg-slate-900 text-white rounded-lg border border-slate-700 focus:border-[#1E66F5] outline-none"
                    style={{ fontSize: '11px' }}
                  />
                  <input
                    type="text"
                    placeholder="Estado"
                    value={formGeocerca.estado}
                    onChange={(e) => setFormGeocerca({ ...formGeocerca, estado: e.target.value })}
                    className="px-3 py-2 bg-slate-900 text-white rounded-lg border border-slate-700 focus:border-[#1E66F5] outline-none"
                    style={{ fontSize: '11px' }}
                  />
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="Latitud"
                    value={formGeocerca.lat || ''}
                    onChange={(e) => setFormGeocerca({ ...formGeocerca, lat: parseFloat(e.target.value) })}
                    className="px-3 py-2 bg-slate-900 text-white rounded-lg border border-slate-700 focus:border-[#1E66F5] outline-none"
                    style={{ fontSize: '11px' }}
                  />
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="Longitud"
                    value={formGeocerca.lng || ''}
                    onChange={(e) => setFormGeocerca({ ...formGeocerca, lng: parseFloat(e.target.value) })}
                    className="px-3 py-2 bg-slate-900 text-white rounded-lg border border-slate-700 focus:border-[#1E66F5] outline-none"
                    style={{ fontSize: '11px' }}
                  />
                  <input
                    type="number"
                    placeholder="Radio (metros)"
                    value={formGeocerca.radio || ''}
                    onChange={(e) => setFormGeocerca({ ...formGeocerca, radio: parseInt(e.target.value) })}
                    className="px-3 py-2 bg-slate-900 text-white rounded-lg border border-slate-700 focus:border-[#1E66F5] outline-none"
                    style={{ fontSize: '11px' }}
                  />
                </div>
                <div className="flex justify-end gap-2 mt-3">
                  <button
                    onClick={() => setAgregando(false)}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                    style={{ fontSize: '10px', fontWeight: 600 }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => guardarGeocerca(formGeocerca)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1"
                    style={{ fontSize: '10px', fontWeight: 600 }}
                  >
                    <Save className="w-3 h-3" />
                    Guardar
                  </button>
                </div>
              </div>
            )}

            {/* LISTA DE GEOCERCAS */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {cargando ? (
                <div className="text-center text-slate-400 py-8">Cargando...</div>
              ) : geocercas.length === 0 ? (
                <div className="text-center text-slate-400 py-8">No hay geocercas registradas</div>
              ) : (
                geocercas.map((geocerca) => (
                  <div
                    key={geocerca.id}
                    className="p-3 bg-slate-800 rounded-lg hover:bg-slate-750 transition-colors"
                    style={{ border: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    {editando === geocerca.id ? (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={formGeocerca.id}
                            disabled
                            className="px-3 py-2 bg-slate-700 text-slate-400 rounded-lg border border-slate-600 outline-none"
                            style={{ fontSize: '11px' }}
                          />
                          <input
                            type="text"
                            value={formGeocerca.nombre}
                            onChange={(e) => setFormGeocerca({ ...formGeocerca, nombre: e.target.value })}
                            className="px-3 py-2 bg-slate-900 text-white rounded-lg border border-slate-700 focus:border-[#1E66F5] outline-none"
                            style={{ fontSize: '11px' }}
                          />
                          <input
                            type="text"
                            value={formGeocerca.ciudad}
                            onChange={(e) => setFormGeocerca({ ...formGeocerca, ciudad: e.target.value })}
                            className="px-3 py-2 bg-slate-900 text-white rounded-lg border border-slate-700 focus:border-[#1E66F5] outline-none"
                            style={{ fontSize: '11px' }}
                          />
                          <input
                            type="text"
                            value={formGeocerca.estado}
                            onChange={(e) => setFormGeocerca({ ...formGeocerca, estado: e.target.value })}
                            className="px-3 py-2 bg-slate-900 text-white rounded-lg border border-slate-700 focus:border-[#1E66F5] outline-none"
                            style={{ fontSize: '11px' }}
                          />
                          <input
                            type="number"
                            step="0.0001"
                            value={formGeocerca.lat}
                            onChange={(e) => setFormGeocerca({ ...formGeocerca, lat: parseFloat(e.target.value) })}
                            className="px-3 py-2 bg-slate-900 text-white rounded-lg border border-slate-700 focus:border-[#1E66F5] outline-none"
                            style={{ fontSize: '11px' }}
                          />
                          <input
                            type="number"
                            step="0.0001"
                            value={formGeocerca.lng}
                            onChange={(e) => setFormGeocerca({ ...formGeocerca, lng: parseFloat(e.target.value) })}
                            className="px-3 py-2 bg-slate-900 text-white rounded-lg border border-slate-700 focus:border-[#1E66F5] outline-none"
                            style={{ fontSize: '11px' }}
                          />
                          <input
                            type="number"
                            value={formGeocerca.radio}
                            onChange={(e) => setFormGeocerca({ ...formGeocerca, radio: parseInt(e.target.value) })}
                            className="px-3 py-2 bg-slate-900 text-white rounded-lg border border-slate-700 focus:border-[#1E66F5] outline-none"
                            style={{ fontSize: '11px' }}
                          />
                        </div>
                        <div className="flex justify-end gap-2 mt-3">
                          <button
                            onClick={() => {
                              setEditando(null);
                              setFormGeocerca({ id: '', nombre: '', ciudad: '', estado: '', lat: 0, lng: 0, radio: 600 });
                            }}
                            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                            style={{ fontSize: '10px', fontWeight: 600 }}
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => guardarGeocerca(formGeocerca)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1"
                            style={{ fontSize: '10px', fontWeight: 600 }}
                          >
                            <Save className="w-3 h-3" />
                            Guardar
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-emerald-500" style={{ fontSize: '12px', fontWeight: 700 }}>
                            📍 {geocerca.nombre}
                          </div>
                          <div className="text-slate-400" style={{ fontSize: '10px' }}>
                            {geocerca.ciudad}, {geocerca.estado} • Radio: {geocerca.radio}m
                          </div>
                          <div className="text-slate-500" style={{ fontSize: '9px' }}>
                            {geocerca.lat.toFixed(4)}, {geocerca.lng.toFixed(4)}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditando(geocerca.id);
                              setFormGeocerca(geocerca);
                              setAgregando(false);
                            }}
                            className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => eliminarGeocerca(geocerca.id)}
                            className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
