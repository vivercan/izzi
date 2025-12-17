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

// ═══════════════════════════════════════════════════════════════════════════
// 📋 MATRIZ DE USUARIOS FX27 - ACTUALIZADA 17/DIC/2025
// ═══════════════════════════════════════════════════════════════════════════
// | Usuario            | Correo                          | Rol         | Header      | Módulos                    | Ventas/Oport  |
// |--------------------|--------------------------------|-------------|-------------|----------------------------|---------------|
// | Juan Viveros       | juan.viveros@trob.com.mx       | admin       | ADMIN       | TODOS                      | Ver TODO      |
// | Jennifer Sánchez   | jennifer.sanchez@trob.com.mx   | admin       | ADMIN       | TODOS                      | Ver TODO      |
// | Lizeth Rodríguez   | customer.service3@trob.com.mx  | csr         | CSR         | TODO menos Config          | Ver TODO      |
// | Elizabeth Rodríguez| customer.service1@trob.com.mx  | csr         | CSR         | TODO menos Config          | Ver TODO      |
// | Isis Estrada       | isis.estrada@wexpress.com.mx   | ventas      | VENTAS      | TODO menos Config          | Solo ISIS     |
// | Paloma Oliva       | paloma.oliva@speedyhaul.com.mx | ventas      | VENTAS      | TODO menos Config          | Solo PALOMA   |
// | Jaime Soto         | jaime.soto@trob.com.mx         | operaciones | OPERACIONES | Solo Dedicado              | Sin acceso    |
// | José Rodríguez     | jose.rodriguez@trob.com.mx     | operaciones | OPERACIONES | Solo Dedicado              | Sin acceso    |
// | Marcos Pineda      | marcos.pineda@trob.com.mx      | operaciones | OPERACIONES | Solo Dedicado              | Sin acceso    |
// ═══════════════════════════════════════════════════════════════════════════

type UserRole = 'admin' | 'ventas' | 'operaciones' | 'csr' | 'custom';

interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  password: string;
  rol: UserRole;
  rolDisplay: string;
  vendedor?: string; // 'ISIS' | 'PALOMA' para filtrar en Ventas/Oportunidades
  permisosCustom?: string[];
  ultimoAcceso: string;
  activo: boolean;
  createdAt: string;
}

// 🔒 USUARIOS AUTORIZADOS - 9 USUARIOS TOTALES
const USUARIOS_AUTORIZADOS: Usuario[] = [
  // ═══════════════════════════════════════════════════════════════
  // ADMINISTRADORES (2) - Acceso TOTAL
  // ═══════════════════════════════════════════════════════════════
  {
    id: '1',
    nombre: 'Juan Viveros',
    correo: 'juan.viveros@trob.com.mx',
    password: 'Mexico86',
    rol: 'admin',
    rolDisplay: 'ADMIN',
    ultimoAcceso: '',
    activo: true,
    createdAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: '9',
    nombre: 'Jennifer Sánchez',
    correo: 'jennifer.sanchez@trob.com.mx',
    password: 'jsanchez',
    rol: 'admin',
    rolDisplay: 'ADMIN',
    ultimoAcceso: '',
    activo: true,
    createdAt: '2025-12-17T00:00:00.000Z'
  },
  // ═══════════════════════════════════════════════════════════════
  // CSR (2) - Todo menos Configuración, VE TODO en Ventas/Oportunidades
  // ═══════════════════════════════════════════════════════════════
  {
    id: '7',
    nombre: 'Lizeth Rodríguez',
    correo: 'customer.service3@trob.com.mx',
    password: 'lrodriguez',
    rol: 'csr',
    rolDisplay: 'CSR',
    ultimoAcceso: '',
    activo: true,
    createdAt: '2025-01-05T00:00:00.000Z'
  },
  {
    id: '8',
    nombre: 'Elizabeth Rodríguez',
    correo: 'customer.service1@trob.com.mx',
    password: 'erodriguez',
    rol: 'csr',
    rolDisplay: 'CSR',
    ultimoAcceso: '',
    activo: true,
    createdAt: '2025-01-05T00:00:00.000Z'
  },
  // ═══════════════════════════════════════════════════════════════
  // VENTAS (2) - Todo menos Config, SOLO SUS CLIENTES en Ventas/Oportunidades
  // ═══════════════════════════════════════════════════════════════
  {
    id: '4',
    nombre: 'Isis Estrada',
    correo: 'isis.estrada@wexpress.com.mx',
    password: 'iestrada',
    rol: 'ventas',
    rolDisplay: 'VENTAS',
    vendedor: 'ISIS', // ← Filtro para Ventas y Oportunidades
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
    rolDisplay: 'VENTAS',
    vendedor: 'PALOMA', // ← Filtro para Ventas y Oportunidades
    ultimoAcceso: '',
    activo: true,
    createdAt: '2025-01-03T00:00:00.000Z'
  },
  // ═══════════════════════════════════════════════════════════════
  // OPERACIONES (3) - SOLO módulo Dedicado
  // ═══════════════════════════════════════════════════════════════
  {
    id: '2',
    nombre: 'José Rodríguez',
    correo: 'jose.rodriguez@trob.com.mx',
    password: 'jrodriguez',
    rol: 'operaciones',
    rolDisplay: 'OPERACIONES',
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
    rolDisplay: 'OPERACIONES',
    ultimoAcceso: '',
    activo: true,
    createdAt: '2025-01-02T00:00:00.000Z'
  },
  {
    id: '6',
    nombre: 'Jaime Soto',
    correo: 'jaime.soto@trob.com.mx',
    password: 'jsoto',
    rol: 'operaciones',
    rolDisplay: 'OPERACIONES',
    ultimoAcceso: '',
    activo: true,
    createdAt: '2025-01-04T00:00:00.000Z'
  }
];

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [userRolDisplay, setUserRolDisplay] = useState<string>('ADMIN');
  const [userVendedor, setUserVendedor] = useState<string>(''); // 'ISIS' | 'PALOMA' | ''
  const [userPermisosCustom, setUserPermisosCustom] = useState<string[]>([]);
  const [currentModule, setCurrentModule] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string>('');
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [currentUserName, setCurrentUserName] = useState<string>('');

  // 🔧 INICIALIZAR USUARIOS AL CARGAR LA APP
  useEffect(() => {
    // Siempre actualizar con los usuarios más recientes
    console.log('🔧 Actualizando lista de usuarios autorizados...');
    localStorage.setItem('fx27-usuarios', JSON.stringify(USUARIOS_AUTORIZADOS));

    const savedSession = localStorage.getItem('fx27-session');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        // Verificar que el usuario sigue existiendo y está activo
        const usuario = USUARIOS_AUTORIZADOS.find(u => u.correo === session.email && u.activo);
        if (usuario) {
          setIsLoggedIn(true);
          setUserRole(usuario.rol);
          setUserRolDisplay(usuario.rolDisplay);
          setUserVendedor(usuario.vendedor || '');
          setUserPermisosCustom(usuario.permisosCustom || []);
          setCurrentUserEmail(session.email);
          setCurrentUserName(usuario.nombre);
        } else {
          // Usuario ya no existe o está inactivo
          localStorage.removeItem('fx27-session');
        }
      } catch (e) {
        localStorage.removeItem('fx27-session');
      }
    }
  }, []);

  // 🔐 VALIDACIÓN DE LOGIN
  const handleLogin = (email: string, password: string) => {
    console.log('🔐 Intentando login:', email);
    setLoginError('');

    // Buscar en usuarios autorizados
    const usuario = USUARIOS_AUTORIZADOS.find(u => 
      u.correo === email && 
      u.password === password && 
      u.activo === true
    );

    if (!usuario) {
      console.error('❌ Credenciales incorrectas:', email);
      setLoginError('Credenciales incorrectas. Verifica tu email y contraseña.');
      return;
    }

    console.log('✅ Login exitoso:', usuario.nombre, '- Rol:', usuario.rolDisplay, '- Vendedor:', usuario.vendedor || 'N/A');
    
    setUserRole(usuario.rol);
    setUserRolDisplay(usuario.rolDisplay);
    setUserVendedor(usuario.vendedor || '');
    setUserPermisosCustom(usuario.permisosCustom || []);
    setIsLoggedIn(true);
    setCurrentUserEmail(email);
    setCurrentUserName(usuario.nombre);
    
    // Guardar sesión
    localStorage.setItem('fx27-session', JSON.stringify({
      role: usuario.rol,
      rolDisplay: usuario.rolDisplay,
      vendedor: usuario.vendedor || '',
      permisosCustom: usuario.permisosCustom || [],
      email: email,
      name: usuario.nombre,
      timestamp: new Date().toISOString()
    }));

    // Actualizar último acceso en backend (fire and forget)
    fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/usuarios/ultimo-acceso`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${publicAnonKey}` },
      body: JSON.stringify({ email })
    }).catch(() => {});
  };

  const handleLogout = () => {
    console.log('👋 Cerrando sesión');
    setIsLoggedIn(false);
    setCurrentModule(null);
    setUserRole('admin');
    setUserRolDisplay('ADMIN');
    setUserVendedor('');
    setUserPermisosCustom([]);
    setCurrentUserEmail('');
    setCurrentUserName('');
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

  // 🔒 CONTROL DE PERMISOS POR ROL
  const checkModuleAccess = (module: string, role: UserRole, permisosCustom: string[] = []): boolean => {
    // ADMIN: acceso a TODO
    if (role === 'admin') return true;
    
    // CSR: TODO menos Configuración
    if (role === 'csr') {
      return module !== 'configuracion';
    }
    
    // VENTAS: TODO menos Configuración (filtro de datos se aplica en cada módulo)
    if (role === 'ventas') {
      return module !== 'configuracion';
    }
    
    // OPERACIONES: SOLO Dedicados y sus submódulos
    if (role === 'operaciones') {
      const modulosDedicados = ['dedicados', 'admin-carroll', 'monitor-carroll', 'vista-clientes-carroll', 'mapa-climatico-carroll'];
      return modulosDedicados.includes(module);
    }

    // CUSTOM: según permisos específicos
    if (role === 'custom') {
      return permisosCustom.includes(module);
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
          {currentModule === 'panel-oportunidades' && <PanelOportunidadesModule onBack={handleBack} userVendedor={userVendedor} />}
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
          userRolDisplay={userRolDisplay}
          userName={currentUserName}
        />
      )}
    </div>
  );
}
