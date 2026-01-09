// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN DEL PROCESO DE ALTA DE CLIENTES
// Solo accesible por administradores (Juan Viveros)
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Users, Mail, Building2, CreditCard, FileText, Save, Plus, Trash2,
  Loader2, CheckCircle2, AlertCircle, Edit2, X, RefreshCw, Settings,
  UserCheck, DollarSign, Send, Shield
} from 'lucide-react';

const supabaseUrl = 'https://fbxbsslhewchyibdoyzk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieGJzc2xoZXdjaHlpYmRveXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzczODEsImV4cCI6MjA3ODExMzM4MX0.Z8JPlg7hhKbA624QGHp2bKKTNtCD3WInQMO5twjl6a0';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface CSR {
  id: string;
  nombre: string;
  email: string;
  celular: string;
  activo: boolean;
}

interface EmpresaFacturadora {
  id: string;
  nombre: string;
  rfc: string;
  color: string;
  activo: boolean;
}

interface CorreosNotificacion {
  nueva_solicitud: string[];
  solicitud_completada: string[];
  asignar_cobranza: string[];
  confirmar_alta: string[];
  alta_completada: string[];
  copia_siempre: string[];
}

interface Confirmador {
  nombre: string;
  email: string;
  celular: string;
}

export default function ConfiguracionAltaClientes() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);
  const [tabActivo, setTabActivo] = useState<'csr' | 'cxc' | 'correos' | 'empresas' | 'credito'>('csr');

  // Estados de configuración
  const [catalogoCSR, setCatalogoCSR] = useState<CSR[]>([]);
  const [catalogoCxC, setCatalogoCxC] = useState<CSR[]>([]);
  const [confirmador, setConfirmador] = useState<Confirmador>({ nombre: '', email: '', celular: '' });
  const [correosNotificacion, setCorreosNotificacion] = useState<CorreosNotificacion>({
    nueva_solicitud: [],
    solicitud_completada: [],
    asignar_cobranza: [],
    confirmar_alta: [],
    alta_completada: [],
    copia_siempre: []
  });
  const [empresas, setEmpresas] = useState<EmpresaFacturadora[]>([]);
  const [diasCredito, setDiasCredito] = useState<number[]>([]);

  // Estados de edición
  const [editandoCSR, setEditandoCSR] = useState<CSR | null>(null);
  const [editandoCxC, setEditandoCxC] = useState<CSR | null>(null);
  const [nuevoCorreo, setNuevoCorreo] = useState('');

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  const cargarConfiguracion = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('config_alta_clientes')
        .select('clave, valor');

      if (error) throw error;

      const config: Record<string, any> = {};
      data?.forEach(row => {
        config[row.clave] = row.valor;
      });

      setCatalogoCSR(config.catalogo_csr || []);
      setCatalogoCxC(config.catalogo_cxc || []);
      setConfirmador(config.confirmador_alta || { nombre: '', email: '', celular: '' });
      setCorreosNotificacion(config.correos_notificacion || {
        nueva_solicitud: [],
        solicitud_completada: [],
        asignar_cobranza: [],
        confirmar_alta: [],
        alta_completada: [],
        copia_siempre: []
      });
      setEmpresas(config.empresas_facturadoras || []);
      setDiasCredito(config.dias_credito_opciones || []);

    } catch (err) {
      console.error('Error cargando configuración:', err);
      mostrarMensaje('error', 'Error al cargar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const guardarConfiguracion = async (clave: string, valor: any) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('config_alta_clientes')
        .update({ 
          valor, 
          updated_at: new Date().toISOString(),
          updated_by: 'juan.viveros@trob.com.mx'
        })
        .eq('clave', clave);

      if (error) throw error;
      mostrarMensaje('success', 'Configuración guardada correctamente');
    } catch (err) {
      console.error('Error guardando:', err);
      mostrarMensaje('error', 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const mostrarMensaje = (tipo: 'success' | 'error', texto: string) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 3000);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLERS CSR
  // ═══════════════════════════════════════════════════════════════════════════
  const agregarCSR = () => {
    const nuevo: CSR = {
      id: `csr_${Date.now()}`,
      nombre: '',
      email: '',
      celular: '',
      activo: true
    };
    setEditandoCSR(nuevo);
  };

  const guardarCSR = async () => {
    if (!editandoCSR?.nombre || !editandoCSR?.email) {
      mostrarMensaje('error', 'Nombre y email son requeridos');
      return;
    }

    const existe = catalogoCSR.find(c => c.id === editandoCSR.id);
    let nuevosCatalogo: CSR[];

    if (existe) {
      nuevosCatalogo = catalogoCSR.map(c => c.id === editandoCSR.id ? editandoCSR : c);
    } else {
      nuevosCatalogo = [...catalogoCSR, editandoCSR];
    }

    setCatalogoCSR(nuevosCatalogo);
    await guardarConfiguracion('catalogo_csr', nuevosCatalogo);
    setEditandoCSR(null);
  };

  const eliminarCSR = async (id: string) => {
    if (!confirm('¿Eliminar este CSR?')) return;
    const nuevosCatalogo = catalogoCSR.filter(c => c.id !== id);
    setCatalogoCSR(nuevosCatalogo);
    await guardarConfiguracion('catalogo_csr', nuevosCatalogo);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLERS CxC
  // ═══════════════════════════════════════════════════════════════════════════
  const agregarCxC = () => {
    const nuevo: CSR = {
      id: `cxc_${Date.now()}`,
      nombre: '',
      email: '',
      celular: '',
      activo: true
    };
    setEditandoCxC(nuevo);
  };

  const guardarCxC = async () => {
    if (!editandoCxC?.nombre || !editandoCxC?.email) {
      mostrarMensaje('error', 'Nombre y email son requeridos');
      return;
    }

    const existe = catalogoCxC.find(c => c.id === editandoCxC.id);
    let nuevosCatalogo: CSR[];

    if (existe) {
      nuevosCatalogo = catalogoCxC.map(c => c.id === editandoCxC.id ? editandoCxC : c);
    } else {
      nuevosCatalogo = [...catalogoCxC, editandoCxC];
    }

    setCatalogoCxC(nuevosCatalogo);
    await guardarConfiguracion('catalogo_cxc', nuevosCatalogo);
    setEditandoCxC(null);
  };

  const eliminarCxC = async (id: string) => {
    if (!confirm('¿Eliminar este ejecutivo?')) return;
    const nuevosCatalogo = catalogoCxC.filter(c => c.id !== id);
    setCatalogoCxC(nuevosCatalogo);
    await guardarConfiguracion('catalogo_cxc', nuevosCatalogo);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLERS CORREOS
  // ═══════════════════════════════════════════════════════════════════════════
  const agregarCorreo = async (tipo: keyof CorreosNotificacion) => {
    if (!nuevoCorreo || !nuevoCorreo.includes('@')) {
      mostrarMensaje('error', 'Ingrese un email válido');
      return;
    }

    const nuevosCorreos = {
      ...correosNotificacion,
      [tipo]: [...correosNotificacion[tipo], nuevoCorreo]
    };
    setCorreosNotificacion(nuevosCorreos);
    await guardarConfiguracion('correos_notificacion', nuevosCorreos);
    setNuevoCorreo('');
  };

  const eliminarCorreo = async (tipo: keyof CorreosNotificacion, email: string) => {
    const nuevosCorreos = {
      ...correosNotificacion,
      [tipo]: correosNotificacion[tipo].filter(e => e !== email)
    };
    setCorreosNotificacion(nuevosCorreos);
    await guardarConfiguracion('correos_notificacion', nuevosCorreos);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLERS CONFIRMADOR
  // ═══════════════════════════════════════════════════════════════════════════
  const guardarConfirmador = async () => {
    await guardarConfiguracion('confirmador_alta', confirmador);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLERS DÍAS CRÉDITO
  // ═══════════════════════════════════════════════════════════════════════════
  const toggleDiaCredito = async (dia: number) => {
    let nuevosDias: number[];
    if (diasCredito.includes(dia)) {
      nuevosDias = diasCredito.filter(d => d !== dia);
    } else {
      nuevosDias = [...diasCredito, dia].sort((a, b) => a - b);
    }
    setDiasCredito(nuevosDias);
    await guardarConfiguracion('dias_credito_opciones', nuevosDias);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ESTILOS
  // ═══════════════════════════════════════════════════════════════════════════
  const inputStyle = "w-full px-4 py-3 bg-white/5 border border-white/15 rounded-lg text-white outline-none focus:border-orange-500/50 transition-colors";
  const labelStyle = "block text-sm font-medium text-white/70 mb-2";
  const cardStyle = "bg-[#0a1628]/95 rounded-xl border border-white/10 p-6";

  const tabs = [
    { id: 'csr', label: 'CSR', icon: Users, desc: 'Customer Service' },
    { id: 'cxc', label: 'Cobranza', icon: CreditCard, desc: 'Ejecutivos CxC' },
    { id: 'correos', label: 'Correos', icon: Mail, desc: 'Notificaciones' },
    { id: 'empresas', label: 'Empresas', icon: Building2, desc: 'Facturadoras' },
    { id: 'credito', label: 'Crédito', icon: DollarSign, desc: 'Días y opciones' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-orange-500/20">
            <Settings className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Proceso de Alta</h2>
            <p className="text-sm text-white/50">Configuración del sistema de alta de clientes</p>
          </div>
        </div>
        
        <button
          onClick={cargarConfiguracion}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <RefreshCw className="w-5 h-5 text-white/60" />
        </button>
      </div>

      {/* Mensaje */}
      {mensaje && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${
          mensaje.tipo === 'success' 
            ? 'bg-green-500/20 border border-green-500/30' 
            : 'bg-red-500/20 border border-red-500/30'
        }`}>
          {mensaje.tipo === 'success' 
            ? <CheckCircle2 className="w-5 h-5 text-green-400" />
            : <AlertCircle className="w-5 h-5 text-red-400" />
          }
          <span className={mensaje.tipo === 'success' ? 'text-green-300' : 'text-red-300'}>
            {mensaje.texto}
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const activo = tabActivo === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setTabActivo(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all whitespace-nowrap ${
                activo 
                  ? 'bg-orange-500/20 border border-orange-500/30 text-orange-400' 
                  : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════
          TAB: CSR
          ═══════════════════════════════════════════════════════════════════════════ */}
      {tabActivo === 'csr' && (
        <div className={cardStyle}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Customer Service Representatives</h3>
              <p className="text-sm text-white/50">Ejecutivos asignados a clientes nuevos</p>
            </div>
            <button
              onClick={agregarCSR}
              className="px-4 py-2 rounded-lg flex items-center gap-2 text-white font-medium"
              style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' }}
            >
              <Plus className="w-4 h-4" /> Agregar CSR
            </button>
          </div>

          {/* Lista de CSR */}
          <div className="space-y-3">
            {catalogoCSR.map(csr => (
              <div 
                key={csr.id}
                className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${csr.activo ? 'bg-green-500' : 'bg-gray-500'}`} />
                  <div>
                    <span className="text-white font-medium">{csr.nombre}</span>
                    <div className="flex items-center gap-4 text-sm text-white/50">
                      <span>{csr.email}</span>
                      {csr.celular && <span>{csr.celular}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditandoCSR(csr)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-blue-400" />
                  </button>
                  <button
                    onClick={() => eliminarCSR(csr.id)}
                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Modal editar CSR */}
          {editandoCSR && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-[#0f1729] rounded-2xl border border-white/10 p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-white">
                    {catalogoCSR.find(c => c.id === editandoCSR.id) ? 'Editar' : 'Nuevo'} CSR
                  </h3>
                  <button onClick={() => setEditandoCSR(null)} className="p-2 hover:bg-white/10 rounded-lg">
                    <X className="w-5 h-5 text-white/60" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className={labelStyle}>Nombre *</label>
                    <input
                      type="text"
                      value={editandoCSR.nombre}
                      onChange={e => setEditandoCSR({ ...editandoCSR, nombre: e.target.value })}
                      className={inputStyle}
                      placeholder="Nombre completo"
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Email *</label>
                    <input
                      type="email"
                      value={editandoCSR.email}
                      onChange={e => setEditandoCSR({ ...editandoCSR, email: e.target.value })}
                      className={inputStyle}
                      placeholder="email@trob.com.mx"
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Celular</label>
                    <input
                      type="tel"
                      value={editandoCSR.celular}
                      onChange={e => setEditandoCSR({ ...editandoCSR, celular: e.target.value })}
                      className={inputStyle}
                      placeholder="+52..."
                    />
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editandoCSR.activo}
                      onChange={e => setEditandoCSR({ ...editandoCSR, activo: e.target.checked })}
                      className="w-5 h-5 rounded"
                      style={{ accentColor: '#fe5000' }}
                    />
                    <span className="text-white/80">Activo</span>
                  </label>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setEditandoCSR(null)}
                    className="flex-1 py-3 rounded-xl bg-white/10 text-white/70 font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={guardarCSR}
                    disabled={saving}
                    className="flex-1 py-3 rounded-xl text-white font-medium flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #fe5000 0%, #cc4000 100%)' }}
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          TAB: COBRANZA (CxC)
          ═══════════════════════════════════════════════════════════════════════════ */}
      {tabActivo === 'cxc' && (
        <div className={cardStyle}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Ejecutivos de Cobranza</h3>
              <p className="text-sm text-white/50">Personal de Cuentas por Cobrar</p>
            </div>
            <button
              onClick={agregarCxC}
              className="px-4 py-2 rounded-lg flex items-center gap-2 text-white font-medium"
              style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' }}
            >
              <Plus className="w-4 h-4" /> Agregar
            </button>
          </div>

          <div className="space-y-3">
            {catalogoCxC.map(cxc => (
              <div 
                key={cxc.id}
                className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${cxc.activo ? 'bg-green-500' : 'bg-gray-500'}`} />
                  <div>
                    <span className="text-white font-medium">{cxc.nombre}</span>
                    <span className="text-sm text-white/50 block">{cxc.email}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditandoCxC(cxc)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-blue-400" />
                  </button>
                  <button
                    onClick={() => eliminarCxC(cxc.id)}
                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Confirmador de Alta (Nancy) */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-purple-400" />
              <div>
                <h4 className="text-white font-medium">Confirmador de Alta</h4>
                <p className="text-xs text-white/50">Persona que da el visto bueno final</p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelStyle}>Nombre</label>
                <input
                  type="text"
                  value={confirmador.nombre}
                  onChange={e => setConfirmador({ ...confirmador, nombre: e.target.value })}
                  className={inputStyle}
                />
              </div>
              <div>
                <label className={labelStyle}>Email</label>
                <input
                  type="email"
                  value={confirmador.email}
                  onChange={e => setConfirmador({ ...confirmador, email: e.target.value })}
                  className={inputStyle}
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={guardarConfirmador}
                  disabled={saving}
                  className="px-6 py-3 rounded-lg text-white font-medium"
                  style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)' }}
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>

          {/* Modal editar CxC */}
          {editandoCxC && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-[#0f1729] rounded-2xl border border-white/10 p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-white">Editar Ejecutivo CxC</h3>
                  <button onClick={() => setEditandoCxC(null)} className="p-2 hover:bg-white/10 rounded-lg">
                    <X className="w-5 h-5 text-white/60" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className={labelStyle}>Nombre *</label>
                    <input
                      type="text"
                      value={editandoCxC.nombre}
                      onChange={e => setEditandoCxC({ ...editandoCxC, nombre: e.target.value })}
                      className={inputStyle}
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Email *</label>
                    <input
                      type="email"
                      value={editandoCxC.email}
                      onChange={e => setEditandoCxC({ ...editandoCxC, email: e.target.value })}
                      className={inputStyle}
                    />
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editandoCxC.activo}
                      onChange={e => setEditandoCxC({ ...editandoCxC, activo: e.target.checked })}
                      className="w-5 h-5 rounded"
                      style={{ accentColor: '#fe5000' }}
                    />
                    <span className="text-white/80">Activo</span>
                  </label>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setEditandoCxC(null)}
                    className="flex-1 py-3 rounded-xl bg-white/10 text-white/70 font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={guardarCxC}
                    disabled={saving}
                    className="flex-1 py-3 rounded-xl text-white font-medium"
                    style={{ background: 'linear-gradient(135deg, #fe5000 0%, #cc4000 100%)' }}
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          TAB: CORREOS
          ═══════════════════════════════════════════════════════════════════════════ */}
      {tabActivo === 'correos' && (
        <div className={cardStyle}>
          <h3 className="text-lg font-bold text-white mb-6">Destinatarios de Notificaciones</h3>
          
          <div className="space-y-6">
            {[
              { key: 'nueva_solicitud', label: 'Nueva Solicitud', desc: 'Cuando un vendedor crea una solicitud', icon: Send, color: 'blue' },
              { key: 'solicitud_completada', label: 'Solicitud Completada', desc: 'Cuando el cliente completa el formulario', icon: FileText, color: 'green' },
              { key: 'asignar_cobranza', label: 'Asignar Cobranza', desc: 'Cuando se asigna CSR y pasa a cobranza', icon: CreditCard, color: 'purple' },
              { key: 'confirmar_alta', label: 'Confirmar Alta', desc: 'Solicitud lista para confirmación final', icon: Shield, color: 'orange' },
              { key: 'alta_completada', label: 'Alta Completada', desc: 'Cuando se confirma el alta del cliente', icon: CheckCircle2, color: 'emerald' },
              { key: 'copia_siempre', label: 'Copia Siempre', desc: 'Recibe copia de todas las notificaciones', icon: Mail, color: 'gray' }
            ].map(({ key, label, desc, icon: Icon, color }) => (
              <div key={key} className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3 mb-3">
                  <Icon className={`w-5 h-5 text-${color}-400`} />
                  <div>
                    <span className="text-white font-medium">{label}</span>
                    <p className="text-xs text-white/50">{desc}</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  {(correosNotificacion as any)[key]?.map((email: string) => (
                    <span 
                      key={email}
                      className="px-3 py-1 rounded-full bg-white/10 text-white/80 text-sm flex items-center gap-2"
                    >
                      {email}
                      <button
                        onClick={() => eliminarCorreo(key as keyof CorreosNotificacion, email)}
                        className="hover:text-red-400 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={nuevoCorreo}
                    onChange={e => setNuevoCorreo(e.target.value)}
                    placeholder="nuevo@email.com"
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-orange-500/50"
                    onKeyDown={e => e.key === 'Enter' && agregarCorreo(key as keyof CorreosNotificacion)}
                  />
                  <button
                    onClick={() => agregarCorreo(key as keyof CorreosNotificacion)}
                    className="px-3 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          TAB: EMPRESAS
          ═══════════════════════════════════════════════════════════════════════════ */}
      {tabActivo === 'empresas' && (
        <div className={cardStyle}>
          <h3 className="text-lg font-bold text-white mb-6">Empresas Facturadoras</h3>
          
          <div className="grid grid-cols-2 gap-4">
            {empresas.map(emp => (
              <div 
                key={emp.id}
                className="p-4 rounded-xl border-2 transition-all"
                style={{ 
                  background: `${emp.color}15`,
                  borderColor: emp.activo ? emp.color : 'rgba(255,255,255,0.1)'
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold" style={{ color: emp.color }}>{emp.id}</span>
                  <div className={`w-3 h-3 rounded-full ${emp.activo ? 'bg-green-500' : 'bg-gray-500'}`} />
                </div>
                <span className="text-white/80">{emp.nombre}</span>
                {emp.rfc && <span className="text-xs text-white/50 block">{emp.rfc}</span>}
              </div>
            ))}
          </div>
          
          <p className="text-xs text-white/40 mt-4">
            * Para agregar/modificar empresas facturadoras, contacte al administrador del sistema
          </p>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          TAB: CRÉDITO
          ═══════════════════════════════════════════════════════════════════════════ */}
      {tabActivo === 'credito' && (
        <div className={cardStyle}>
          <h3 className="text-lg font-bold text-white mb-6">Opciones de Días de Crédito</h3>
          <p className="text-sm text-white/50 mb-4">Seleccione las opciones disponibles para asignar a clientes</p>
          
          <div className="flex flex-wrap gap-3">
            {[7, 15, 21, 30, 45, 60, 90, 120].map(dia => {
              const activo = diasCredito.includes(dia);
              return (
                <button
                  key={dia}
                  onClick={() => toggleDiaCredito(dia)}
                  className={`px-6 py-3 rounded-xl font-medium transition-all ${
                    activo 
                      ? 'bg-green-500 text-white' 
                      : 'bg-white/5 text-white/40 hover:bg-white/10'
                  }`}
                >
                  {dia} días
                </button>
              );
            })}
          </div>
          
          <div className="mt-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
            <p className="text-sm text-blue-300">
              <strong>Días activos:</strong> {diasCredito.join(', ')} días
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
