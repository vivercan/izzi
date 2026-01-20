import React, { useState } from 'react';
import {
  Database, FolderOpen, Sparkles, MessageSquare, Mail,
  FileText, Image, File, FileCheck, Folder,
  Download, Trash2
} from 'lucide-react';

// Importar ModuleTemplate para header consistente
import { ModuleTemplate } from './ModuleTemplate';

// Importar submódulos
import { ProspeccionIAModule } from './ProspeccionIAModule';
import { WhatsAppMonitorModule } from './WhatsAppMonitorModule';

// Configuración de Supabase
const projectId = 'fbxbsslhewchyibdoyzk';
const publicAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZieGJzc2xoZXdjaHlpYmRveXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MzczODEsImV4cCI6MjA3ODExMzM4MX0.Z8JPlg7hhKbA624QGHp2bKKTNtCD3WInQMO5twjl6a0';

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════
interface UtileriasModuleProps {
  onBack: () => void;
  userEmail: string;
}

type SubModule = 'backup' | 'gestor' | 'prospeccion' | 'whatsapp' | 'correo' | null;
type GestorSection = 'cotizaciones' | 'contratos' | 'documentos' | 'imagenes' | 'otros' | 'formatos' | null;

// Solo Juan Viveros tiene acceso a módulos exclusivos
const ADMIN_EMAIL = 'juan.viveros@trob.com.mx';

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════
export const UtileriasModule = ({ onBack, userEmail }: UtileriasModuleProps) => {
  const [activeSubModule, setActiveSubModule] = useState<SubModule>(null);
  const [activeGestorSection, setActiveGestorSection] = useState<GestorSection>(null);
  const [downloading, setDownloading] = useState(false);

  // Verificar si el usuario tiene acceso a módulos exclusivos
  const tieneAccesoExclusivo = userEmail?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════
  const handleBackupDownload = async (type: 'deleted' | 'active' | 'download') => {
    setDownloading(true);
    try {
      const endpoint = `https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/leads/backup/${type}`;

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Error al descargar backup');
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fx27_backup_${type}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      alert('Backup descargado exitosamente');
    } catch (error) {
      console.error('Error downloading backup:', error);
      alert('Error al descargar backup');
    } finally {
      setDownloading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER SUBMÓDULOS
  // ═══════════════════════════════════════════════════════════════════════════

  // WhatsApp Monitor
  if (activeSubModule === 'whatsapp') {
    return <WhatsAppMonitorModule onBack={() => setActiveSubModule(null)} />;
  }

  // Prospección IA
  if (activeSubModule === 'prospeccion') {
    return <ProspeccionIAModule onBack={() => setActiveSubModule(null)} />;
  }

  // Correo (placeholder por ahora)
  if (activeSubModule === 'correo') {
    return (
      <ModuleTemplate title="Supervisión de Correo" onBack={() => setActiveSubModule(null)}>
        <div className="p-8 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Mail className="w-20 h-20 text-white/20 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              Próximamente
            </h2>
            <p className="text-white/50" style={{ fontFamily: "'Exo 2', sans-serif" }}>
              El módulo de supervisión de correo está en desarrollo.
            </p>
          </div>
        </div>
      </ModuleTemplate>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VISTA BACKUP
  // ═══════════════════════════════════════════════════════════════════════════
  if (activeSubModule === 'backup') {
    return (
      <ModuleTemplate title="Backup de Leads" onBack={() => setActiveSubModule(null)}>
        <div className="p-8">
          <div className="max-w-4xl mx-auto">
            <p
              className="text-white/60 text-center mb-8"
              style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '15px' }}
            >
              Descarga respaldos de tus leads en formato CSV
            </p>

            <div className="grid grid-cols-3 gap-6">
              {/* Opción 1: Solo Borrados */}
              <button
                onClick={() => handleBackupDownload('deleted')}
                disabled={downloading}
                className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-500 rounded-2xl p-6 transition-all duration-300 flex flex-col items-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Trash2 className="w-8 h-8 text-red-400" />
                </div>
                <div className="text-center">
                  <h4 className="text-white mb-1" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '16px', fontWeight: 600 }}>
                    Solo Borrados
                  </h4>
                  <p className="text-white/60" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px' }}>
                    Leads eliminados
                  </p>
                </div>
              </button>

              {/* Opción 2: Solo Activos */}
              <button
                onClick={() => handleBackupDownload('active')}
                disabled={downloading}
                className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-green-500 rounded-2xl p-6 transition-all duration-300 flex flex-col items-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileCheck className="w-8 h-8 text-green-400" />
                </div>
                <div className="text-center">
                  <h4 className="text-white mb-1" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '16px', fontWeight: 600 }}>
                    Solo Activos
                  </h4>
                  <p className="text-white/60" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px' }}>
                    Leads actuales
                  </p>
                </div>
              </button>

              {/* Opción 3: Completo */}
              <button
                onClick={() => handleBackupDownload('download')}
                disabled={downloading}
                className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500 rounded-2xl p-6 transition-all duration-300 flex flex-col items-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Database className="w-8 h-8 text-blue-400" />
                </div>
                <div className="text-center">
                  <h4 className="text-white mb-1" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '16px', fontWeight: 600 }}>
                    Completo
                  </h4>
                  <p className="text-white/60" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px' }}>
                    Activos + Borrados
                  </p>
                </div>
              </button>
            </div>

            {downloading && (
              <div className="mt-8 text-center text-white/60" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px' }}>
                Generando backup...
              </div>
            )}
          </div>
        </div>
      </ModuleTemplate>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VISTA GESTOR DE ARCHIVOS
  // ═══════════════════════════════════════════════════════════════════════════
  if (activeSubModule === 'gestor') {
    const secciones = [
      { id: 'cotizaciones', icon: FileText, label: 'Cotizaciones', color: 'blue' },
      { id: 'contratos', icon: FileCheck, label: 'Contratos', color: 'green' },
      { id: 'documentos', icon: File, label: 'Documentos', color: 'purple' },
      { id: 'imagenes', icon: Image, label: 'Imágenes', color: 'pink' },
      { id: 'otros', icon: Folder, label: 'Otros', color: 'gray' },
      { id: 'formatos', icon: Download, label: 'Formatos', color: 'orange' },
    ];

    return (
      <ModuleTemplate title="Gestor de Archivos" onBack={() => setActiveSubModule(null)}>
        <div className="p-8">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-3 gap-6">
              {secciones.map((seccion) => {
                const Icon = seccion.icon;
                return (
                  <button
                    key={seccion.id}
                    onClick={() => setActiveGestorSection(seccion.id as GestorSection)}
                    className={`group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-${seccion.color}-500 rounded-2xl p-6 transition-all duration-300 flex flex-col items-center gap-4`}
                  >
                    <div className={`w-16 h-16 rounded-full bg-${seccion.color}-500/20 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-8 h-8 text-${seccion.color}-400`} />
                    </div>
                    <div className="text-center">
                      <h4 className="text-white mb-1" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '16px', fontWeight: 600 }}>
                        {seccion.label}
                      </h4>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </ModuleTemplate>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VISTA PRINCIPAL - CARDS DE UTILERÍAS
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <ModuleTemplate title="Utilerías" onBack={onBack}>
      <div className="p-8">
        <div className={`grid ${tieneAccesoExclusivo ? 'grid-cols-3 lg:grid-cols-5' : 'grid-cols-2'} gap-6 max-w-6xl mx-auto`}>

          {/* Card BACKUP - Disponible para todos */}
          <button
            onClick={() => setActiveSubModule('backup')}
            className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[var(--fx-primary)] rounded-2xl p-8 transition-all duration-300 flex flex-col items-center gap-4"
          >
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Database className="w-10 h-10 text-green-400" />
            </div>
            <div className="text-center">
              <h3
                className="text-white mb-2"
                style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '18px', fontWeight: 600 }}
              >
                BACKUP
              </h3>
              <p className="text-white/60" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px' }}>
                Descargar respaldos de leads
              </p>
            </div>
          </button>

          {/* Card GESTOR DE ARCHIVOS - Disponible para todos */}
          <button
            onClick={() => setActiveSubModule('gestor')}
            className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[var(--fx-primary)] rounded-2xl p-8 transition-all duration-300 flex flex-col items-center gap-4"
          >
            <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FolderOpen className="w-10 h-10 text-blue-400" />
            </div>
            <div className="text-center">
              <h3
                className="text-white mb-2"
                style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '18px', fontWeight: 600 }}
              >
                GESTOR DE ARCHIVOS
              </h3>
              <p className="text-white/60" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px' }}>
                Administrar documentos y formatos
              </p>
            </div>
          </button>

          {/* Card PROSPECCIÓN IA - Solo Juan Viveros */}
          {tieneAccesoExclusivo && (
            <button
              onClick={() => setActiveSubModule('prospeccion')}
              className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-orange-500 rounded-2xl p-8 transition-all duration-300 flex flex-col items-center gap-4"
            >
              {/* Badge NUEVO */}
              <div className="absolute top-4 right-4 px-2 py-1 rounded-full bg-orange-500 text-white text-xs font-bold">
                NUEVO
              </div>
              <div className="w-20 h-20 rounded-full bg-orange-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Sparkles className="w-10 h-10 text-orange-400" />
              </div>
              <div className="text-center">
                <h3
                  className="text-white mb-2"
                  style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '18px', fontWeight: 600 }}
                >
                  PROSPECCIÓN IA
                </h3>
                <p className="text-white/60" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px' }}>
                  Apollo + Hunter + Claude AI
                </p>
              </div>
            </button>
          )}

          {/* Card WHATSAPP MONITOR - Solo Juan Viveros */}
          {tieneAccesoExclusivo && (
            <button
              onClick={() => setActiveSubModule('whatsapp')}
              className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-green-500 rounded-2xl p-8 transition-all duration-300 flex flex-col items-center gap-4"
            >
              {/* Badge NUEVO */}
              <div className="absolute top-4 right-4 px-2 py-1 rounded-full bg-green-500 text-white text-xs font-bold">
                NUEVO
              </div>
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <MessageSquare className="w-10 h-10 text-green-400" />
              </div>
              <div className="text-center">
                <h3
                  className="text-white mb-2"
                  style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '18px', fontWeight: 600 }}
                >
                  WHATSAPP
                </h3>
                <p className="text-white/60" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px' }}>
                  Supervisión con IA
                </p>
              </div>
            </button>
          )}

          {/* Card CORREO - Solo Juan Viveros */}
          {tieneAccesoExclusivo && (
            <button
              onClick={() => setActiveSubModule('correo')}
              className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500 rounded-2xl p-8 transition-all duration-300 flex flex-col items-center gap-4"
            >
              {/* Badge PRÓXIMAMENTE */}
              <div className="absolute top-4 right-4 px-2 py-1 rounded-full bg-purple-500/50 text-white text-xs font-bold">
                PRONTO
              </div>
              <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Mail className="w-10 h-10 text-purple-400" />
              </div>
              <div className="text-center">
                <h3
                  className="text-white mb-2"
                  style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '18px', fontWeight: 600 }}
                >
                  CORREO
                </h3>
                <p className="text-white/60" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '13px' }}>
                  Supervisión de emails
                </p>
              </div>
            </button>
          )}
        </div>
      </div>
    </ModuleTemplate>
  );
};

export default UtileriasModule;
