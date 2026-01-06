import { useState, useEffect } from 'react';
import { User, Plus, ArrowLeft, Eye, EyeOff, RefreshCw, Trash2 } from 'lucide-react';

interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  password: string;
  rol: 'admin' | 'ventas' | 'operaciones' | 'custom';
  permisosCustom?: string[];
  ultimoAcceso: string;
  activo: boolean;
  createdAt: string;
}

interface UsuariosModuleProps {
  onBack: () => void;
}

// Módulos disponibles para permisos custom
const MODULOS_DISPONIBLES = [
  { id: 'agregar-lead', nombre: 'Agregar Lead' },
  { id: 'panel-oportunidades', nombre: 'Panel de Oportunidades' },
  { id: 'operaciones', nombre: 'Operaciones' },
  { id: 'despacho-inteligente', nombre: 'Despacho Inteligente' },
  { id: 'control-equipo', nombre: 'Control de Equipo' },
  { id: 'kpis', nombre: 'KPIs' },
  { id: 'configuracion', nombre: 'Configuración' },
  { id: 'cotizaciones', nombre: 'Cotizaciones' },
  { id: 'ventas', nombre: 'Ventas' },
  { id: 'utilerias', nombre: 'Utilerías' },
  { id: 'servicio-clientes', nombre: 'Clientes' }
];

// Usuarios predefinidos del sistema
const USUARIOS_INICIALES: Usuario[] = [
  {
    id: '1',
    nombre: 'Juan Viveros',
    correo: 'juan.viveros@trob.com.mx',
    password: 'Mexico86',
    rol: 'admin',
    ultimoAcceso: '',
    activo: true,
    createdAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: '2',
    nombre: 'José Rodríguez',
    correo: 'jose.rodriguez@trob.com.mx',
    password: 'jrodriguez',
    rol: 'operaciones',
    ultimoAcceso: '',
    activo: true,
    createdAt: '2025-01-02T00:00:00.000Z'
  },
  {
    id: '3',
    nombre: 'Marcos Pineda',
    correo: 'marcos.pineda@trob.com.mx',
    password: 'mpineda',
    rol: 'operaciones',
    ultimoAcceso: '',
    activo: true,
    createdAt: '2025-01-02T00:00:00.000Z'
  },
  {
    id: '4',
    nombre: 'Isis Estrada',
    correo: 'isis.estrada@wexpress.com.mx',
    password: 'iestrada',
    rol: 'ventas',
    ultimoAcceso: '',
    activo: true,
    createdAt: '2025-01-03T00:00:00.000Z'
  },
  {
    id: '5',
    nombre: 'Paloma Oliva',
    correo: 'paloma.oliva@speedyhaul.com.mx',
    password: 'poliva',
    rol: 'ventas',
    ultimoAcceso: '',
    activo: true,
    createdAt: '2025-01-03T00:00:00.000Z'
  },
  {
    id: '6',
    nombre: 'Jaime Soto',
    correo: 'jaime.soto@trob.com.mx',
    password: 'jsoto',
    rol: 'ventas',
    ultimoAcceso: '',
    activo: true,
    createdAt: '2025-01-04T00:00:00.000Z'
  },
  {
    id: '7',
    nombre: 'Lizeth Rodríguez',
    correo: 'customer.service3@trob.com.mx',
    password: 'lrodriguez',
    rol: 'ventas',
    ultimoAcceso: '',
    activo: true,
    createdAt: '2025-01-05T00:00:00.000Z'
  },
  {
    id: '8',
    nombre: 'Elizabeth Rodríguez',
    correo: 'customer.service1@trob.com.mx',
    password: 'erodriguez',
    rol: 'ventas',
    ultimoAcceso: '',
    activo: true,
    createdAt: '2025-01-05T00:00:00.000Z'
  }
];

export const UsuariosModule = ({ onBack }: UsuariosModuleProps) => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});
  const [nuevoUsuario, setNuevoUsuario] = useState<Partial<Usuario>>({
    nombre: '',
    correo: '',
    password: '',
    rol: 'ventas',
    permisosCustom: [],
    activo: true
  });

  // Cargar usuarios desde localStorage o usar los iniciales
  useEffect(() => {
    const savedUsers = localStorage.getItem('fx27-usuarios');
    if (savedUsers) {
      try {
        setUsuarios(JSON.parse(savedUsers));
      } catch (e) {
        setUsuarios(USUARIOS_INICIALES);
        localStorage.setItem('fx27-usuarios', JSON.stringify(USUARIOS_INICIALES));
      }
    } else {
      setUsuarios(USUARIOS_INICIALES);
      localStorage.setItem('fx27-usuarios', JSON.stringify(USUARIOS_INICIALES));
    }
  }, []);

  const handleAgregarUsuario = () => {
    if (!nuevoUsuario.nombre || !nuevoUsuario.correo || !nuevoUsuario.password) {
      alert('Por favor completa todos los campos');
      return;
    }

    if (nuevoUsuario.rol === 'custom' && (!nuevoUsuario.permisosCustom || nuevoUsuario.permisosCustom.length === 0)) {
      alert('Debes seleccionar al menos un módulo para el rol Custom');
      return;
    }

    const usuario: Usuario = {
      id: Date.now().toString(),
      nombre: nuevoUsuario.nombre!,
      correo: nuevoUsuario.correo!,
      password: nuevoUsuario.password!,
      rol: nuevoUsuario.rol || 'ventas',
      permisosCustom: nuevoUsuario.permisosCustom || [],
      ultimoAcceso: '',
      activo: true,
      createdAt: new Date().toISOString()
    };

    const nuevosUsuarios = [...usuarios, usuario];
    setUsuarios(nuevosUsuarios);
    localStorage.setItem('fx27-usuarios', JSON.stringify(nuevosUsuarios));
    
    setNuevoUsuario({
      nombre: '',
      correo: '',
      password: '',
      rol: 'ventas',
      permisosCustom: [],
      activo: true
    });
    setShowAddForm(false);
  };

  const handleResetPassword = (id: string) => {
    const newPassword = prompt('Ingresa la nueva contraseña:');
    if (newPassword) {
      const nuevosUsuarios = usuarios.map(u => 
        u.id === id ? { ...u, password: newPassword } : u
      );
      setUsuarios(nuevosUsuarios);
      localStorage.setItem('fx27-usuarios', JSON.stringify(nuevosUsuarios));
      alert('Contraseña actualizada correctamente');
    }
  };

  const handleEliminarUsuario = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este usuario?')) {
      const nuevosUsuarios = usuarios.filter(u => u.id !== id);
      setUsuarios(nuevosUsuarios);
      localStorage.setItem('fx27-usuarios', JSON.stringify(nuevosUsuarios));
    }
  };

  const togglePasswordVisibility = (id: string) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleTogglePermisoCustom = (moduloId: string) => {
    const permisosActuales = nuevoUsuario.permisosCustom || [];
    const nuevosPermisos = permisosActuales.includes(moduloId)
      ? permisosActuales.filter(p => p !== moduloId)
      : [...permisosActuales, moduloId];
    
    setNuevoUsuario({ ...nuevoUsuario, permisosCustom: nuevosPermisos });
  };

  const formatFecha = (fecha: string) => {
    if (!fecha || fecha === 'Nunca' || fecha === '') return '-';
    const date = new Date(fecha);
    return date.toLocaleString('es-MX', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRolBadgeColor = (rol: string) => {
    switch (rol) {
      case 'admin': return 'bg-[#1E66F5] text-white';
      case 'ventas': return 'bg-green-500 text-white';
      case 'operaciones': return 'bg-orange-500 text-white';
      case 'custom': return 'bg-purple-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getRolLabel = (rol: string) => {
    switch (rol) {
      case 'admin': return 'Administrador';
      case 'ventas': return 'Ventas';
      case 'operaciones': return 'Operaciones';
      case 'custom': return 'Custom';
      default: return rol;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--fx-bg)]">
      {/* Header con imagen */}
      <div className="relative h-48 overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
          alt="Usuarios"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B1220]/60 to-[#0B1220]"></div>
        
        {/* Logo FX27 */}
        <div className="absolute top-6 left-8 z-20">
          <div 
            className="text-white"
            style={{
              fontFamily: "'Exo 2', sans-serif",
              fontWeight: 900,
              fontSize: '28px',
              lineHeight: '1',
              letterSpacing: '0.05em'
            }}
          >
            FX27
          </div>
        </div>

        {/* Botón Regresar */}
        <button
          onClick={onBack}
          className="absolute top-6 right-8 z-20 flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-sm border border-white/20"
          style={{
            fontFamily: "'Exo 2', sans-serif",
            fontSize: '14px',
            fontWeight: 600
          }}
        >
          <ArrowLeft className="w-4 h-4" />
          Regresar
        </button>

        {/* Título */}
        <div className="absolute bottom-6 left-8">
          <h1 
            className="text-white flex items-center gap-3"
            style={{
              fontFamily: "'Exo 2', sans-serif",
              fontSize: '32px',
              fontWeight: 700
            }}
          >
            <User className="w-8 h-8" />
            Gestión de Usuarios
          </h1>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-8">
        {/* Botón Agregar Usuario */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#1E66F5] to-[#0EA5E9] hover:from-[#1557dc] hover:to-[#0284c7] text-white transition-all shadow-lg shadow-blue-500/30"
            style={{
              fontFamily: "'Exo 2', sans-serif",
              fontSize: '15px',
              fontWeight: 600
            }}
          >
            <Plus className="w-5 h-5" />
            Añadir Usuario
          </button>
        </div>

        {/* Formulario Añadir Usuario */}
        {showAddForm && (
          <div className="mb-8 p-6 rounded-2xl bg-[var(--fx-surface)] border border-white/10">
            <h3 
              className="text-white mb-4 flex items-center gap-2"
              style={{
                fontFamily: "'Exo 2', sans-serif",
                fontSize: '18px',
                fontWeight: 600
              }}
            >
              <Plus className="w-5 h-5" />
              Nuevo Usuario
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Nombre completo"
                value={nuevoUsuario.nombre}
                onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, nombre: e.target.value })}
                className="px-4 py-2.5 rounded-lg bg-[rgba(15,23,42,0.85)] border border-[rgba(148,163,184,0.4)] text-white placeholder:text-[var(--fx-muted)] focus:outline-none focus:border-[var(--fx-primary)]"
                style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px' }}
              />
              
              <input
                type="email"
                placeholder="Correo electrónico"
                value={nuevoUsuario.correo}
                onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, correo: e.target.value })}
                className="px-4 py-2.5 rounded-lg bg-[rgba(15,23,42,0.85)] border border-[rgba(148,163,184,0.4)] text-white placeholder:text-[var(--fx-muted)] focus:outline-none focus:border-[var(--fx-primary)]"
                style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px' }}
              />
              
              <input
                type="text"
                placeholder="Contraseña"
                value={nuevoUsuario.password}
                onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, password: e.target.value })}
                className="px-4 py-2.5 rounded-lg bg-[rgba(15,23,42,0.85)] border border-[rgba(148,163,184,0.4)] text-white placeholder:text-[var(--fx-muted)] focus:outline-none focus:border-[var(--fx-primary)]"
                style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px' }}
              />
              
              <select
                value={nuevoUsuario.rol}
                onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, rol: e.target.value as any, permisosCustom: [] })}
                className="px-4 py-2.5 rounded-lg bg-[rgba(15,23,42,0.85)] border border-[rgba(148,163,184,0.4)] text-white focus:outline-none focus:border-[var(--fx-primary)]"
                style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px' }}
              >
                <option value="ventas">Ventas</option>
                <option value="operaciones">Operaciones</option>
                <option value="admin">Administrador</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {/* Permisos Custom */}
            {nuevoUsuario.rol === 'custom' && (
              <div className="mt-4 p-4 rounded-lg bg-[rgba(15,23,42,0.5)] border border-[rgba(148,163,184,0.3)]">
                <h4 className="text-white mb-3" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', fontWeight: 600 }}>
                  Selecciona los módulos permitidos:
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {MODULOS_DISPONIBLES.map(modulo => (
                    <label key={modulo.id} className="flex items-center gap-2 cursor-pointer text-white hover:text-[var(--fx-primary)] transition-colors">
                      <input
                        type="checkbox"
                        checked={nuevoUsuario.permisosCustom?.includes(modulo.id) || false}
                        onChange={() => handleTogglePermisoCustom(modulo.id)}
                        className="w-4 h-4 rounded border-[var(--fx-muted)] bg-transparent accent-[var(--fx-primary)]"
                      />
                      <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px' }}>
                        {modulo.nombre}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 flex gap-3">
              <button
                onClick={handleAgregarUsuario}
                className="px-6 py-2 rounded-lg bg-[var(--fx-primary)] hover:bg-[#1557dc] text-white transition-colors"
                style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', fontWeight: 600 }}
              >
                Guardar Usuario
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-6 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white transition-colors"
                style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', fontWeight: 600 }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Tabla de Usuarios */}
        <div className="rounded-2xl bg-[var(--fx-surface)] border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-6 py-4 text-left text-[var(--fx-muted)]" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 600 }}>
                    NOMBRE
                  </th>
                  <th className="px-6 py-4 text-left text-[var(--fx-muted)]" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 600 }}>
                    CORREO
                  </th>
                  <th className="px-6 py-4 text-left text-[var(--fx-muted)]" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 600 }}>
                    ROL
                  </th>
                  <th className="px-6 py-4 text-left text-[var(--fx-muted)]" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 600 }}>
                    CONTRASEÑA
                  </th>
                  <th className="px-6 py-4 text-left text-[var(--fx-muted)]" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 600 }}>
                    ÚLTIMO ACCESO
                  </th>
                  <th className="px-6 py-4 text-left text-[var(--fx-muted)]" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 600 }}>
                    ESTADO
                  </th>
                  <th className="px-6 py-4 text-left text-[var(--fx-muted)]" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px', fontWeight: 600 }}>
                    ACCIONES
                  </th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((usuario) => (
                  <tr key={usuario.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-white" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px' }}>
                      {usuario.nombre}
                    </td>
                    <td className="px-6 py-4 text-[var(--fx-muted)]" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px' }}>
                      {usuario.correo}
                    </td>
                    <td className="px-6 py-4">
                      <span 
                        className={`px-3 py-1 rounded-full text-xs ${getRolBadgeColor(usuario.rol)}`}
                        style={{ fontFamily: "'Exo 2', sans-serif", fontWeight: 600 }}
                      >
                        {getRolLabel(usuario.rol)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-white" style={{ fontFamily: "'Orbitron', monospace", fontSize: '13px' }}>
                          {showPasswords[usuario.id] ? usuario.password : '••••••••'}
                        </span>
                        <button
                          onClick={() => togglePasswordVisibility(usuario.id)}
                          className="text-[var(--fx-muted)] hover:text-white transition-colors"
                        >
                          {showPasswords[usuario.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[var(--fx-muted)]" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px' }}>
                      {formatFecha(usuario.ultimoAcceso)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs ${usuario.activo ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`} style={{ fontFamily: "'Exo 2', sans-serif", fontWeight: 600 }}>
                        {usuario.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleResetPassword(usuario.id)}
                          className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition-colors"
                          title="Resetear contraseña"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        {usuario.rol !== 'admin' && (
                          <button
                            onClick={() => handleEliminarUsuario(usuario.id)}
                            className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
                            title="Eliminar usuario"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center">
          <p className="text-[var(--fx-muted)]" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px' }}>
            Total de usuarios: <span className="text-white" style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 600 }}>{usuarios.length}</span>
          </p>
        </div>
      </div>
    </div>
  );
};
