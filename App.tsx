import { useState, useEffect } from 'react';
import { LoginScreen } from './components/fx27/LoginScreen';
import { DashboardScreen } from './components/fx27/DashboardScreen';
import { AgregarLeadModule } from './components/fx27/AgregarLeadModule';
import { PanelOportunidadesModule } from './components/fx27/PanelOportunidadesModule';
import { ModuleTemplate } from './components/fx27/ModuleTemplate';
import { DespachoInteligenteModule } from './components/fx27/DespachoInteligenteModule';
import { ControlEquipoModule } from './components/fx27/ControlEquipoModule';
import { KPIsModule } from './components/fx27/KPIsModule';
import { ConfiguracionModule } from './components/fx27/ConfiguracionModule';
import { CotizacionesModule } from './components/fx27/CotizacionesModule';
import { VentasModule } from './components/fx27/VentasModule';
import { UtileriasModule } from './components/fx27/UtileriasModule';
import { ServicioClientesModule } from './components/fx27/ServicioClientesModule';
import { DedicadosModuleWideTech } from './components/fx27/DedicadosModuleWideTech';
import { DedicadosModuleV2 } from './components/fx27/CarrollModuleFinalV2';
import { CarrollModuleFinalV2Compact } from './components/fx27/CarrollModuleFinalV2Compact';
import { DedicadosHub } from './components/fx27/DedicadosHub';
import { AdminCarrollModule } from './components/fx27/AdminCarrollModule';
import { VistaClientesCarroll } from './components/fx27/VistaClientesCarroll';
import { MapaClimaticoCarroll } from './components/fx27/MapaClimaticoCarroll';
import { MODULE_IMAGES } from './assets/module-images';
import { projectId, publicAnonKey } from './utils/supabase/info';
import './styles/globals.css';

type UserRole = 'admin' | 'ventas' | 'operaciones' | 'custom';

interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  password: string;
  rol: UserRole;
  permisosCustom?: string[];
  ultimoAcceso: string;
  activo: boolean;
  createdAt: string;
}

// 🔒 USUARIOS PREDEFINIDOS DEL SISTEMA (8 USUARIOS AUTORIZADOS)
const USUARIOS_AUTORIZADOS: Usuario[] = [
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

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [userPermisosCustom, setUserPermisosCustom] = useState<string[]>([]);
  const [currentModule, setCurrentModule] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string>('');
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [currentUserName, setCurrentUserName] = useState<string>(''); // ✅ NUEVO: Nombre del usuario

  // 🔧 INICIALIZAR USUARIOS AL CARGAR LA APP
  useEffect(() => {
    const savedUsers = localStorage.getItem('fx27-usuarios');
    
    if (!savedUsers) {
      console.log('🔧 Inicializando 8 usuarios autorizados...');
      localStorage.setItem('fx27-usuarios', JSON.stringify(USUARIOS_AUTORIZADOS));
    } else {
      try {
        const users = JSON.parse(savedUsers);
        const usuariosActualizados = [...USUARIOS_AUTORIZADOS];
        
        users.forEach((user: Usuario) => {
          if (!USUARIOS_AUTORIZADOS.find(u => u.correo === user.correo)) {
            usuariosActualizados.push(user);
          }
        });
        
        localStorage.setItem('fx27-usuarios', JSON.stringify(usuariosActualizados));
      } catch (e) {
        console.error('Error al cargar usuarios, reinicializando...');
        localStorage.setItem('fx27-usuarios', JSON.stringify(USUARIOS_AUTORIZADOS));
      }
    }

    const savedSession = localStorage.getItem('fx27-session');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        setIsLoggedIn(true);
        setUserRole(session.role || 'admin');
        setUserPermisosCustom(session.permisosCustom || []);
        setCurrentUserEmail(session.email || '');
        setCurrentUserName(session.name || ''); // ✅ NUEVO: Cargar nombre
      } catch (e) {
        localStorage.removeItem('fx27-session');
      }
    }
  }, []);

  // 🔐 VALIDACIÓN BLINDADA - CREDENCIALES EXACTAS
  const handleLogin = (email: string, password: string) => {
    console.log('🔐 Intentando login:', email);
    setLoginError('');
    
    const savedUsers = localStorage.getItem('fx27-usuarios');
    
    if (!savedUsers) {
      console.error('❌ No hay usuarios en localStorage');
      console.log('🔧 Reinicializando usuarios...');
      localStorage.setItem('fx27-usuarios', JSON.stringify(USUARIOS_AUTORIZADOS));
      setLoginError('Sistema reinicializado. Intenta nuevamente.');
      return;
    }

    let usuarios: Usuario[] = [];
    
    try {
      usuarios = JSON.parse(savedUsers);
      console.log('👥 Usuarios en sistema:', usuarios.length);
      console.log('📧 Emails disponibles:', usuarios.map(u => u.correo));
    } catch (e) {
      console.error('❌ Error al parsear usuarios');
      console.log('🔧 Reinicializando usuarios...');
      localStorage.setItem('fx27-usuarios', JSON.stringify(USUARIOS_AUTORIZADOS));
      setLoginError('Sistema reinicializado. Intenta nuevamente.');
      return;
    }

    // 🔒 VALIDACIÓN EXACTA
    const usuario = usuarios.find((u: Usuario) => 
      u.correo === email && 
      u.password === password && 
      u.activo === true
    );

    if (!usuario) {
      console.error('❌ Credenciales incorrectas:', email);
      console.log('🔍 Buscando usuario con email:', email);
      const userExists = usuarios.find(u => u.correo === email);
      if (userExists) {
        console.log('✅ Email existe, contraseña incorrecta');
        console.log('🔑 Contraseña esperada:', userExists.password);
        console.log('🔑 Contraseña recibida:', password);
      } else {
        console.log('❌ Email no existe en el sistema');
      }
      setLoginError('Credenciales incorrectas. Verifica tu email y contraseña.');
      return;
    }

    console.log('✅ Login exitoso:', usuario.nombre, '- Rol:', usuario.rol);
    
    setUserRole(usuario.rol);
    setUserPermisosCustom(usuario.permisosCustom || []);
    setIsLoggedIn(true);
    setCurrentUserEmail(email);
    setCurrentUserName(usuario.nombre); // ✅ NUEVO: Guardar nombre
    
    const usuariosActualizados = usuarios.map((u: Usuario) => 
      u.correo === email ? { ...u, ultimoAcceso: new Date().toISOString() } : u
    );
    localStorage.setItem('fx27-usuarios', JSON.stringify(usuariosActualizados));
    
    localStorage.setItem('fx27-session', JSON.stringify({
      role: usuario.rol,
      permisosCustom: usuario.permisosCustom || [],
      email: email,
      name: usuario.nombre, // ✅ NUEVO: Guardar nombre
      timestamp: new Date().toISOString()
    }));

    // 🔥 ACTUALIZAR ÚLTIMO ACCESO EN BACKEND
    fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/usuarios/ultimo-acceso`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`
      },
      body: JSON.stringify({ email })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          console.log('✅ Último acceso guardado en backend:', data.timestamp);
        } else {
          console.error('❌ Error guardando último acceso:', data.error);
        }
      })
      .catch(err => console.error('❌ Error llamando endpoint ultimo-acceso:', err));
  };

  const handleLogout = () => {
    console.log('👋 Cerrando sesión');
    setIsLoggedIn(false);
    setCurrentModule(null);
    setUserRole('admin');
    setUserPermisosCustom([]);
    setCurrentUserEmail('');
    setCurrentUserName(''); // ✅ NUEVO: Limpiar nombre
    localStorage.removeItem('fx27-session');
  };

  const handleNavigate = (module: string) => {
    const hasAccess = checkModuleAccess(module, userRole, userPermisosCustom);
    
    if (!hasAccess) {
      alert('⚠️ Acceso Restringido\n\nNo tienes permisos para este módulo.\n\nContacta al administrador.');
      return;
    }
    
    setCurrentModule(module);
  };

  const handleBack = () => {
    setCurrentModule(null);
  };

  // 🔒 CONTROL DE PERMISOS BLINDADO (INCLUYE CUSTOM)
  const checkModuleAccess = (module: string, role: UserRole, permisosCustom: string[] = []): boolean => {
    // ADMIN: acceso a TODO
    if (role === 'admin') {
      console.log('✅ Admin - Acceso permitido a:', module);
      return true;
    }
    
    // VENTAS: TODO menos Configuración
    if (role === 'ventas') {
      if (module === 'configuracion') {
        console.log('❌ Ventas - Configuración bloqueada');
        return false;
      }
      console.log('✅ Ventas - Acceso permitido a:', module);
      return true;
    }
    
    // OPERACIONES: SOLO Operaciones
    if (role === 'operaciones') {
      if (module === 'operaciones') {
        console.log('✅ Operaciones - Acceso permitido');
        return true;
      }
      console.log('❌ Operaciones - Módulo bloqueado:', module);
      return false;
    }

    // CUSTOM: según permisos específicos
    if (role === 'custom') {
      const tieneAcceso = permisosCustom.includes(module);
      console.log(tieneAcceso ? '✅' : '❌', 'Custom - Módulo:', module, '- Acceso:', tieneAcceso);
      return tieneAcceso;
    }
    
    return false;
  };

  return (
    <div className="w-full min-h-screen">
      {!isLoggedIn ? (
        <LoginScreen onLogin={handleLogin} loginError={loginError} />
      ) : currentModule ? (
        <>
          {currentModule === 'agregar-lead' && <AgregarLeadModule onBack={handleBack} />}
          {currentModule === 'panel-oportunidades' && <PanelOportunidadesModule onBack={handleBack} />}
          {currentModule === 'operaciones' && <ModuleTemplate title="Operaciones" onBack={handleBack} headerImage={MODULE_IMAGES.OPERACIONES} />}
          {currentModule === 'despacho-inteligente' && <DespachoInteligenteModule onBack={handleBack} />}
          {currentModule === 'control-equipo' && <ControlEquipoModule onBack={handleBack} />}
          {currentModule === 'kpis' && <KPIsModule onBack={handleBack} />}
          {currentModule === 'configuracion' && <ConfiguracionModule onBack={handleBack} />}
          {currentModule === 'cotizaciones' && <CotizacionesModule onBack={handleBack} />}
          {currentModule === 'ventas' && <VentasModule onBack={handleBack} />}
          {currentModule === 'utilerias' && <UtileriasModule onBack={handleBack} />}
          {currentModule === 'servicio-clientes' && <ServicioClientesModule onBack={handleBack} />}
          {currentModule === 'dedicados' && (
            <DedicadosHub 
              onBack={handleBack} 
              onNavigate={(submodule) => setCurrentModule(submodule)} 
            />
          )}
          {currentModule === 'admin-carroll' && <CarrollModuleFinalV2Compact onBack={() => setCurrentModule('dedicados')} />}
          {currentModule === 'monitor-carroll' && <DedicadosModuleWideTech onBack={() => setCurrentModule('dedicados')} />}
          {currentModule === 'vista-clientes-carroll' && <VistaClientesCarroll onBack={() => setCurrentModule('dedicados')} />}
          {currentModule === 'mapa-climatico-carroll' && <MapaClimaticoCarroll onBack={() => setCurrentModule('dedicados')} />}
        </>
      ) : (
        <DashboardScreen 
          onLogout={handleLogout}
          onNavigate={handleNavigate}
          userRole={userRole}
          userName={currentUserName} // ✅ NUEVO: Pasar nombre
        />
      )}
    </div>
  );
}