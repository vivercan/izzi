import { useState, useEffect, useRef } from 'react';
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
import { ClientesModule } from './components/fx27/ClientesModule';
import { ServicioClientesModule } from './components/fx27/ServicioClientesModule';
import { DedicadosModuleWideTech } from './components/fx27/DedicadosModuleWideTech';
import { DedicadosModuleV2 } from './components/fx27/CarrollModuleFinalV2';
import { CarrollModuleFinalV2Compact } from './components/fx27/CarrollModuleFinalV2Compact';
import { DedicadosHub } from './components/fx27/DedicadosHub';
import { AdminCarrollModule } from './components/fx27/AdminCarrollModule';
import { VistaClientesCarroll } from './components/fx27/VistaClientesCarroll';
import { MapaClimaticoCarroll } from './components/fx27/MapaClimaticoCarroll';
import { AltaClientePublico } from './components/fx27/AltaClientePublico';
import { AsignarCxC } from './components/fx27/AsignarCxC';
import { AsignarCxCPublico } from './components/fx27/AsignarCxCPublico';
import { ConfirmarAltaPublico } from './components/fx27/ConfirmarAltaPublico';
import SalesHorizonModule from './components/fx27/SalesHorizonModule';
import { AtencionClientesModule } from './components/fx27/AtencionClientesModule';
import { MODULE_IMAGES } from './assets/module-images';
import { projectId, publicAnonKey } from './utils/supabase/info';
import './styles/globals.css';

// ============ GOOGLE OAUTH CONFIG ============
const GOOGLE_CLIENT_ID = '26773356182-sb6d8l7krsltmjfh2rto7nutd4eu73qr.apps.googleusercontent.com';
const GOOGLE_SCOPES = 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email';
const TOKEN_REFRESH_MS = 55 * 60 * 1000; // 55 minutos

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// 📋 MATRIZ COMPLETA DE USUARIOS FX27 - ACTUALIZADA 17/DIC/2025
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// # | Usuario            | Correo                          | Password    | Header      | Módulos      | Ventas/Oport
// --|--------------------|---------------------------------|-------------|-------------|--------------|-------------
// 1 | Juan Viveros       | juan.viveros@trob.com.mx        | Mexico86    | ADMIN       | TODOS        | Ver TODO
// 2 | Jennifer Sánchez   | jennifer.sanchez@trob.com.mx    | jsanchez    | ADMIN       | TODOS        | Ver TODO
// 3 | Lizeth Rodríguez   | customer.service3@trob.com.mx   | lrodriguez  | CSR         | Todo -Config | Ver TODO
// 4 | Elizabeth Rodríguez| customer.service1@trob.com.mx   | erodriguez  | CSR         | Todo -Config | Ver TODO
// 5 | Isis Estrada       | isis.estrada@wexpress.com.mx    | iestrada    | VENTAS      | Todo -Config | Solo ISIS
// 6 | Paloma Oliva       | paloma.oliva@speedyhaul.com.mx  | poliva      | VENTAS      | Todo -Config | Solo PALOMA
// 7 | Jaime Soto         | jaime.soto@trob.com.mx          | jsoto       | OPERACIONES | Solo Dedicado| Sin acceso
// 8 | José Rodríguez     | jose.rodriguez@trob.com.mx      | jrodriguez  | OPERACIONES | Solo Dedicado| Sin acceso
// 9 | Marcos Pineda      | marcos.pineda@trob.com.mx       | mpineda     | OPERACIONES | Solo Dedicado| Sin acceso
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

type UserRole = 'admin' | 'ventas' | 'operaciones' | 'csr' | 'custom';

interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  password: string;
  rol: UserRole;
  rolDisplay: string;
  // Para filtrar en Ventas: valor exacto de ejecutivo_ventas en BD (ISIS, PALOMA)
  vendedorVentas?: string;
  // Para filtrar en Oportunidades: nombre que contiene el campo vendedor en leads
  vendedorLeads?: string;
  permisosCustom?: string[];
  ultimoAcceso: string;
  activo: boolean;
  createdAt: string;
}

// 🔒 9 USUARIOS AUTORIZADOS
const USUARIOS_AUTORIZADOS: Usuario[] = [
  // ═══════════════════════════════════════════════════════════════
  // ADMINISTRADORES (2) - Acceso TOTAL a todo
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
  // CSR (2) - Todo menos Config, VEN TODO en módulos de datos
  // ═══════════════════════════════════════════════════════════════
  {
    id: '7',
    nombre: 'Liz Garcia',
    correo: 'customer.service3@trob.com.mx',
    password: 'Lgarcia',
    rol: 'csr',
    rolDisplay: 'CSR',
    ultimoAcceso: '',
    activo: true,
    createdAt: '2025-01-05T00:00:00.000Z'
  },
  {
    id: '8',
    nombre: 'Eli Pasillas',
    correo: 'customer.service1@trob.com.mx',
    password: 'Epasillas',
    rol: 'csr',
    rolDisplay: 'CSR',
    ultimoAcceso: '',
    activo: true,
    createdAt: '2025-01-05T00:00:00.000Z'
  },
  // ═══════════════════════════════════════════════════════════════
  // VENTAS (2) - Todo menos Config, SOLO SUS DATOS en Ventas/Oportunidades
  // ═══════════════════════════════════════════════════════════════
  {
    id: '4',
    nombre: 'Isis Estrada',
    correo: 'isis.estrada@wexpress.com.mx',
    password: 'iestrada',
    rol: 'ventas',
    rolDisplay: 'VENTAS',
    vendedorVentas: 'ISIS',        // Valor en ventas_maestro.ejecutivo_ventas
    vendedorLeads: 'Isis Estrada', // Valor en leads.vendedor (nombre completo)
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
    vendedorVentas: 'PALOMA',      // Valor en ventas_maestro.ejecutivo_ventas
    vendedorLeads: 'Paloma Oliva', // Valor en leads.vendedor (nombre completo)
    ultimoAcceso: '',
    activo: false,
    createdAt: '2025-01-03T00:00:00.000Z'    },
    // ═══════════════════════════════════════════════════════════════
    // VENTAS CUSTOM (1) - Solo módulos específicos
    // ═══════════════════════════════════════════════════════════════
    {
      id: '10',
      nombre: 'Leo Gonzalez',
      correo: 'leonardo.gonzalez@wexpress.com.mx',
      password: 'Aguascalientes2026',
      rol: 'custom',
      rolDisplay: 'VENTAS',
      vendedorLeads: 'Leo Gonzalez',
      permisosCustom: ['agregar-lead', 'panel-oportunidades', 'servicio-clientes'],
      ultimoAcceso: '',
      activo: true,
      createdAt: '2026-01-23T00:00:00.000Z'
    },
    // ═══════════════════════════════════════════════════════════════
    // OPERACIONES (3) - SOLO módulo Dedicado, sin acceso a Ventas/Oportunidades
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
  const [userVendedorVentas, setUserVendedorVentas] = useState<string>('');   // Para módulo Ventas
  const [userVendedorLeads, setUserVendedorLeads] = useState<string>('');     // Para Panel Oportunidades
  const [userPermisosCustom, setUserPermisosCustom] = useState<string[]>([]);
  const [currentModule, setCurrentModule] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string>('');
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [currentUserName, setCurrentUserName] = useState<string>('');
  const [gmailToken, setGmailToken] = useState<string>('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [gsiLoaded, setGsiLoaded] = useState(false);
  const [rutaPublica, setRutaPublica] = useState<{tipo: string, id: string} | null>(null);
  const tokenClientRef = useRef<any>(null);
  const refreshIntervalRef = useRef<any>(null);

    // Detectar rutas públicas (sin login requerido)
  useEffect(() => {
    const path = window.location.pathname;
    // Ruta pública: Alta de cliente
    const altaMatch = path.match(/^\/alta\/([a-f0-9-]{36})$/i);
    if (altaMatch) {
      setRutaPublica({ tipo: 'alta-cliente', id: altaMatch[1] });
    }
    // Ruta pública: Asignar CxC sin login
    const cxcMatch = path.match(/^\/asignar-cxc\/([a-f0-9-]{36})$/i);
    if (cxcMatch) {
      setRutaPublica({ tipo: 'asignar-cxc', id: cxcMatch[1] });
    }
    // Ruta pública: Confirmar Alta sin login
    const confirmarMatch = path.match(/^\/confirmar-alta\/([a-f0-9-]{36})$/i);
    if (confirmarMatch) {
      setRutaPublica({ tipo: 'confirmar-alta', id: confirmarMatch[1] });
    }
    // Rutas internas
    if (path === '/servicio-clientes') {
      setCurrentModule('servicio-clientes');
    }
  }, []);
  // 🔧 INICIALIZAR AL CARGAR
  useEffect(() => {
    // Siempre actualizar usuarios
    localStorage.setItem('fx27-usuarios', JSON.stringify(USUARIOS_AUTORIZADOS));

    const savedSession = localStorage.getItem('fx27-session');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        const usuario = USUARIOS_AUTORIZADOS.find(u => u.correo === session.email && u.activo);
        if (usuario) {
          setIsLoggedIn(true);
          setUserRole(usuario.rol);
          setUserRolDisplay(usuario.rolDisplay);
          setUserVendedorVentas(usuario.vendedorVentas || '');
          setUserVendedorLeads(usuario.vendedorLeads || '');
          setUserPermisosCustom(usuario.permisosCustom || []);
          setCurrentUserEmail(session.email);
          setCurrentUserName(usuario.nombre);
          console.log('✅ Sesión restaurada:', usuario.nombre, '| Ventas:', usuario.vendedorVentas || 'TODO', '| Leads:', usuario.vendedorLeads || 'TODO');
          // Si tenía sesión guardada, intentar refresh silencioso del token de Gmail
          if (gsiLoaded) {
            silentTokenRefresh();
          }
        } else {
          localStorage.removeItem('fx27-session');
        }
      } catch (e) {
        localStorage.removeItem('fx27-session');
      }
    }
  }, []);

  // 🔑 CARGAR GOOGLE IDENTITY SERVICES
  useEffect(() => {
    if (document.getElementById('gsi-script')) { setGsiLoaded(true); return; }
    const script = document.createElement('script');
    script.id = 'gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => setGsiLoaded(true);
    document.head.appendChild(script);
  }, []);

  // Cuando GSI carga y hay sesión guardada → refresh silencioso
  useEffect(() => {
    if (gsiLoaded && isLoggedIn && !gmailToken) {
      silentTokenRefresh();
    }
  }, [gsiLoaded, isLoggedIn]);

  // 🔄 CLEANUP del interval al desmontar
  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  }, []);

  // 🔄 SILENT TOKEN REFRESH — renueva sin popup
  const silentTokenRefresh = () => {
    if (!(window as any).google?.accounts?.oauth2) return;
    try {
      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: GOOGLE_SCOPES,
        callback: (resp: any) => {
          if (!resp.error && resp.access_token) {
            setGmailToken(resp.access_token);
            console.log('🔄 Gmail token renovado silenciosamente');
          }
        },
      });
      tokenClientRef.current = client;
      client.requestAccessToken({ prompt: '' });
    } catch (e) {
      console.log('⚠️ Silent refresh falló, se pedirá al usuario la próxima vez');
    }
  };

  // 🔄 INICIAR AUTO-REFRESH cada 55 minutos
  const startTokenRefreshInterval = () => {
    if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    refreshIntervalRef.current = setInterval(() => {
      console.log('🔄 Auto-refresh Gmail token...');
      silentTokenRefresh();
    }, TOKEN_REFRESH_MS);
  };

  // 🔐 GOOGLE SIGN-IN — trigger popup
  const handleGoogleSignIn = () => {
    if (!gsiLoaded || !(window as any).google?.accounts?.oauth2) {
      setLoginError('Google Sign-In no cargó. Recarga la página e intenta de nuevo.');
      return;
    }
    setGoogleLoading(true);
    setLoginError('');

    const client = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: GOOGLE_SCOPES,
      callback: async (resp: any) => {
        if (resp.error) {
          setGoogleLoading(false);
          if (resp.error !== 'access_denied') {
            setLoginError('Error de autenticación. Intenta de nuevo.');
          }
          return;
        }
        try {
          const info = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${resp.access_token}` },
          });
          const data = await info.json();
          const email = data.email;

          if (!email) {
            setLoginError('No se pudo obtener el correo de Google.');
            setGoogleLoading(false);
            return;
          }

          // Validar contra usuarios autorizados
          const usuario = USUARIOS_AUTORIZADOS.find(u => u.correo === email && u.activo);

          if (!usuario) {
            setLoginError(`El correo ${email} no tiene acceso a FX27. Contacta al administrador.`);
            setGoogleLoading(false);
            // Revocar token si no es usuario autorizado
            (window as any).google.accounts.oauth2.revoke(resp.access_token);
            return;
          }

          console.log('✅ Google Login OK:', usuario.nombre, '| Rol:', usuario.rolDisplay);

          setUserRole(usuario.rol);
          setUserRolDisplay(usuario.rolDisplay);
          setUserVendedorVentas(usuario.vendedorVentas || '');
          setUserVendedorLeads(usuario.vendedorLeads || '');
          setUserPermisosCustom(usuario.permisosCustom || []);
          setIsLoggedIn(true);
          setCurrentUserEmail(email);
          setCurrentUserName(usuario.nombre);
          setGmailToken(resp.access_token);
          tokenClientRef.current = client;

          // Guardar sesión
          localStorage.setItem('fx27-session', JSON.stringify({
            role: usuario.rol,
            rolDisplay: usuario.rolDisplay,
            vendedorVentas: usuario.vendedorVentas || '',
            vendedorLeads: usuario.vendedorLeads || '',
            permisosCustom: usuario.permisosCustom || [],
            email: email,
            name: usuario.nombre,
            timestamp: new Date().toISOString()
          }));

          // Iniciar auto-refresh del token cada 55 min
          startTokenRefreshInterval();

          // Actualizar último acceso
          fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/usuarios/ultimo-acceso`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${publicAnonKey}` },
            body: JSON.stringify({ email })
          }).catch(() => {});

        } catch {
          setLoginError('Error al conectar con Google. Intenta de nuevo.');
        }
        setGoogleLoading(false);
      },
    });

    client.requestAccessToken();
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentModule(null);
    setUserRole('admin');
    setUserRolDisplay('ADMIN');
    setUserVendedorVentas('');
    setUserVendedorLeads('');
    setUserPermisosCustom([]);
    setCurrentUserEmail('');
    setCurrentUserName('');
    setGmailToken('');
    setGoogleLoading(false);
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
    // Revocar token de Google si existe
    if (gmailToken) {
      try { (window as any).google?.accounts?.oauth2?.revoke(gmailToken); } catch {}
    }
    localStorage.removeItem('fx27-session');
  };

  const handleNavigate = (module: string) => {
    if (!checkModuleAccess(module, userRole, userPermisosCustom)) {
      alert('⚠️ Acceso Restringido\n\nNo tienes permisos para este módulo.');
      return;
    }
    setCurrentModule(module);
  };

  const handleBack = () => setCurrentModule(null);

  // 🔒 PERMISOS POR ROL
  const checkModuleAccess = (module: string, role: UserRole, permisosCustom: string[] = []): boolean => {
    if (role === 'admin') return true;
    if (role === 'csr') return module !== 'configuracion';
    if (role === 'ventas') return !['configuracion', 'atencion-clientes'].includes(module);
    if (role === 'operaciones') {
      return ['dedicados', 'admin-carroll', 'monitor-carroll', 'vista-clientes-carroll', 'mapa-climatico-carroll'].includes(module);
    }
    if (role === 'custom') return permisosCustom.includes(module);
    return false;
  };

  // Si es ruta pública, renderizar sin login
  if (rutaPublica) {
    if (rutaPublica.tipo === 'alta-cliente') {
      return <AltaClientePublico solicitudId={rutaPublica.id} />;
    }
    if (rutaPublica.tipo === 'asignar-cxc') {
      return <AsignarCxCPublico solicitudId={rutaPublica.id} />;
    }
    if (rutaPublica.tipo === 'confirmar-alta') {
      return <ConfirmarAltaPublico solicitudId={rutaPublica.id} />;
    }
  }

  return (
    <div className="w-full min-h-screen">
      {!isLoggedIn ? (
        <LoginScreen onGoogleSignIn={handleGoogleSignIn} loginError={loginError} googleLoading={googleLoading} />
      ) : currentModule ? (
        <>
          {currentModule === 'agregar-lead' && <AgregarLeadModule onBack={handleBack} />}
          {currentModule === 'panel-oportunidades' && (
            <PanelOportunidadesModule
              onBack={handleBack}
              userVendedorLeads={userVendedorLeads}  // Nombre completo para filtrar leads
            />
          )}
          {currentModule === 'operaciones' && <ModuleTemplate title="Operaciones" onBack={handleBack} headerImage={MODULE_IMAGES.OPERACIONES} />}
          {currentModule === 'despacho-inteligente' && <DespachoInteligenteModule onBack={handleBack} />}
          {currentModule === 'control-equipo' && <ControlEquipoModule onBack={handleBack} />}
          {currentModule === 'kpis' && <KPIsModule onBack={handleBack} />}
          {currentModule === 'configuracion' && <ConfiguracionModule onBack={handleBack} />}
          {currentModule === 'cotizaciones' && <CotizacionesModule onBack={handleBack} />}
          {currentModule === 'ventas' && <VentasModule onBack={handleBack} userEmail={currentUserEmail} />}
          {currentModule === 'utilerias' && <UtileriasModule onBack={handleBack} userEmail={currentUserEmail} />}
          {currentModule === 'servicio-clientes' && <ServicioClientesModule onBack={handleBack} userEmail={currentUserEmail} userName={currentUserName} />}
          {currentModule === 'dedicados' && (
            <DedicadosHub onBack={handleBack} onNavigate={(submodule) => setCurrentModule(submodule)} />
          )}
          {currentModule === 'admin-carroll' && <CarrollModuleFinalV2Compact onBack={() => setCurrentModule('dedicados')} />}
          {currentModule === 'monitor-carroll' && <DedicadosModuleWideTech onBack={() => setCurrentModule('dedicados')} />}
          {currentModule === 'vista-clientes-carroll' && <VistaClientesCarroll onBack={() => setCurrentModule('dedicados')} />}
          {currentModule === 'mapa-climatico-carroll' && <MapaClimaticoCarroll onBack={() => setCurrentModule('dedicados')} />}
          {currentModule === 'sales-horizon' && <SalesHorizonModule onBack={handleBack} />}
          {currentModule === 'atencion-clientes' && <AtencionClientesModule onBack={handleBack} userEmail={currentUserEmail} userName={currentUserName} gmailToken={gmailToken} userRole={userRole} />}
          {currentModule === 'asignar-cxc' && <AsignarCxC />}
        </>
      ) : (
        <DashboardScreen
          onLogout={handleLogout}
          onNavigate={handleNavigate}
          userRole={userRole}
          userRolDisplay={userRolDisplay}
          permisosCustom={userPermisosCustom}
          userName={currentUserName}
        />
      )}
    </div>
  );
}
