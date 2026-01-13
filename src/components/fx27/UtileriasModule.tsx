import { useState } from 'react';
import { ModuleTemplate } from './ModuleTemplate';
import { MODULE_IMAGES } from '../../assets/module-images';
import { Download, Database, FileText, FolderOpen, FileCheck, Image, Package, Sparkles } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { ProspeccionIAModule } from './ProspeccionIAModule';

interface UtileriasModuleProps {
  onBack: () => void;
  userEmail?: string; // Para validar acceso a Prospección IA
}

type SubModule = 'backup' | 'gestor' | 'prospeccion' | null;
type GestorSection = 'cotizaciones' | 'contratos' | 'documentos' | 'imagenes' | 'otros' | 'formatos' | null;

// Solo Juan Viveros tiene acceso a Prospección IA
const ADMIN_PROSPECCION = 'juan.viveros@trob.com.mx';

export const UtileriasModule = ({ onBack, userEmail }: UtileriasModuleProps) => {
  const [activeSubModule, setActiveSubModule] = useState<SubModule>(null);
  const [activeGestorSection, setActiveGestorSection] = useState<GestorSection>(null);
  const [downloading, setDownloading] = useState(false);

  // Verificar si el usuario tiene acceso a Prospección IA
  const tieneAccesoProspeccion = userEmail?.toLowerCase() === ADMIN_PROSPECCION.toLowerCase();

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

      // Descargar el CSV
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

  // Si está en Prospección IA, mostrar ese módulo
  if (activeSubModule === 'prospeccion') {
    return <ProspeccionIAModule onBack={() => setActiveSubModule(null)} />;
  }

  // Vista principal con las opciones (2 o 3 según permisos)
  if (!activeSubModule) {
    return (
      <ModuleTemplate title="Utilerías" onBack={onBack} headerImage={MODULE_IMAGES.UTILERIAS}>
        <div className="p-8">
          <div className={`grid ${tieneAccesoProspeccion ? 'grid-cols-3' : 'grid-cols-2'} gap-6 max-w-5xl mx-auto`}>
            {/* Card BACKUP */}
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
                  style={{
                    fontFamily: "'Exo 2', sans-serif",
                    fontSize: '20px',
                    fontWeight: 600
                  }}
                >
                  BACKUP
                </h3>
                <p 
                  className="text-white/60"
                  style={{
                    fontFamily: "'Exo 2', sans-serif",
                    fontSize: '14px'
                  }}
                >
                  Descargar respaldos de leads
                </p>
              </div>
            </button>

            {/* Card GESTOR DE ARCHIVOS */}
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
                  style={{
                    fontFamily: "'Exo 2', sans-serif",
                    fontSize: '20px',
                    fontWeight: 600
                  }}
                >
                  GESTOR DE ARCHIVOS
                </h3>
                <p 
                  className="text-white/60"
                  style={{
                    fontFamily: "'Exo 2', sans-serif",
                    fontSize: '14px'
                  }}
                >
                  Administrar documentos y formatos
                </p>
              </div>
            </button>

            {/* Card PROSPECCIÓN IA - Solo para Admin */}
            {tieneAccesoProspeccion && (
              <button
                onClick={() => setActiveSubModule('prospeccion')}
                className="group relative bg-gradient-to-br from-[#f97316]/10 to-[#ea580c]/5 hover:from-[#f97316]/20 hover:to-[#ea580c]/10 border border-[#f97316]/30 hover:border-[#f97316] rounded-2xl p-8 transition-all duration-300 flex flex-col items-center gap-4"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#f97316]/30 to-[#ea580c]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Sparkles className="w-10 h-10 text-[#f97316]" />
                </div>
                <div className="text-center">
                  <h3 
                    className="text-white mb-2"
                    style={{
                      fontFamily: "'Exo 2', sans-serif",
                      fontSize: '20px',
                      fontWeight: 600
                    }}
                  >
                    PROSPECCIÓN IA
                  </h3>
                  <p 
                    className="text-white/60"
                    style={{
                      fontFamily: "'Exo 2', sans-serif",
                      fontSize: '14px'
                    }}
                  >
                    Apollo + Hunter + Claude AI
                  </p>
                </div>
                {/* Badge NUEVO */}
                <div className="absolute top-3 right-3 bg-[#f97316] text-white text-[10px] font-bold px-2 py-1 rounded-full">
                  NUEVO
                </div>
              </button>
            )}
          </div>
        </div>
      </ModuleTemplate>
    );
  }

  // Vista BACKUP con 3 opciones
  if (activeSubModule === 'backup') {
    return (
      <ModuleTemplate title="Utilerías › Backup" onBack={() => setActiveSubModule(null)} headerImage={MODULE_IMAGES.UTILERIAS}>
        <div className="p-8">
          <div className="max-w-4xl mx-auto">
            <div 
              className="text-white/80 mb-8 text-center"
              style={{
                fontFamily: "'Exo 2', sans-serif",
                fontSize: '16px'
              }}
            >
              Selecciona el tipo de respaldo que deseas descargar
            </div>

            <div className="grid grid-cols-3 gap-6">
              {/* Opción 1: Solo Borrados */}
              <button
                onClick={() => handleBackupDownload('deleted')}
                disabled={downloading}
                className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-500 rounded-2xl p-6 transition-all duration-300 flex flex-col items-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Download className="w-8 h-8 text-red-400" />
                </div>
                <div className="text-center">
                  <h4 
                    className="text-white mb-1"
                    style={{
                      fontFamily: "'Exo 2', sans-serif",
                      fontSize: '16px',
                      fontWeight: 600
                    }}
                  >
                    Solo Borrados
                  </h4>
                  <p 
                    className="text-white/60"
                    style={{
                      fontFamily: "'Exo 2', sans-serif",
                      fontSize: '13px'
                    }}
                  >
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
                  <Download className="w-8 h-8 text-green-400" />
                </div>
                <div className="text-center">
                  <h4 
                    className="text-white mb-1"
                    style={{
                      fontFamily: "'Exo 2', sans-serif",
                      fontSize: '16px',
                      fontWeight: 600
                    }}
                  >
                    Solo Activos
                  </h4>
                  <p 
                    className="text-white/60"
                    style={{
                      fontFamily: "'Exo 2', sans-serif",
                      fontSize: '13px'
                    }}
                  >
                    Leads actuales
                  </p>
                </div>
              </button>

              {/* Opción 3: Ambos */}
              <button
                onClick={() => handleBackupDownload('download')}
                disabled={downloading}
                className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[var(--fx-primary)] rounded-2xl p-6 transition-all duration-300 flex flex-col items-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Database className="w-8 h-8 text-blue-400" />
                </div>
                <div className="text-center">
                  <h4 
                    className="text-white mb-1"
                    style={{
                      fontFamily: "'Exo 2', sans-serif",
                      fontSize: '16px',
                      fontWeight: 600
                    }}
                  >
                    Completo
                  </h4>
                  <p 
                    className="text-white/60"
                    style={{
                      fontFamily: "'Exo 2', sans-serif",
                      fontSize: '13px'
                    }}
                  >
                    Activos + Borrados
                  </p>
                </div>
              </button>
            </div>

            {downloading && (
              <div 
                className="mt-8 text-center text-white/60"
                style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: '14px'
                }}
              >
                Generando backup...
              </div>
            )}
          </div>
        </div>
      </ModuleTemplate>
    );
  }

  // Vista GESTOR DE ARCHIVOS
  if (activeSubModule === 'gestor') {
    return (
      <ModuleTemplate title="Utilerías › Gestor de Archivos" onBack={() => setActiveSubModule(null)} headerImage={MODULE_IMAGES.UTILERIAS}>
        <div className="p-8">
          <div className="grid grid-cols-6 gap-3 max-w-6xl mx-auto">
            {/* Cotizaciones */}
            <button
              onClick={() => setActiveGestorSection('cotizaciones')}
              className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[var(--fx-primary)] rounded-xl p-3 transition-all flex flex-col items-center gap-2"
            >
              <FileText className="w-6 h-6 text-purple-400" />
              <span 
                className="text-white text-center leading-tight"
                style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: '12px'
                }}
              >
                Cotizaciones
              </span>
            </button>

            {/* Contratos */}
            <button
              onClick={() => setActiveGestorSection('contratos')}
              className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[var(--fx-primary)] rounded-xl p-3 transition-all flex flex-col items-center gap-2"
            >
              <FileCheck className="w-6 h-6 text-green-400" />
              <span 
                className="text-white text-center leading-tight"
                style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: '12px'
                }}
              >
                Contratos
              </span>
            </button>

            {/* Documentos */}
            <button
              onClick={() => setActiveGestorSection('documentos')}
              className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[var(--fx-primary)] rounded-xl p-3 transition-all flex flex-col items-center gap-2"
            >
              <FileText className="w-6 h-6 text-blue-400" />
              <span 
                className="text-white text-center leading-tight"
                style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: '12px'
                }}
              >
                Documentos
              </span>
            </button>

            {/* Imágenes */}
            <button
              onClick={() => setActiveGestorSection('imagenes')}
              className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[var(--fx-primary)] rounded-xl p-3 transition-all flex flex-col items-center gap-2"
            >
              <Image className="w-6 h-6 text-yellow-400" />
              <span 
                className="text-white text-center leading-tight"
                style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: '12px'
                }}
              >
                Imágenes
              </span>
            </button>

            {/* Otros */}
            <button
              onClick={() => setActiveGestorSection('otros')}
              className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[var(--fx-primary)] rounded-xl p-3 transition-all flex flex-col items-center gap-2"
            >
              <Package className="w-6 h-6 text-gray-400" />
              <span 
                className="text-white text-center leading-tight"
                style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: '12px'
                }}
              >
                Otros
              </span>
            </button>

            {/* FORMATOS DE VENTA */}
            <button
              onClick={() => setActiveGestorSection('formatos')}
              className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-orange-500 rounded-xl p-3 transition-all flex flex-col items-center gap-2"
            >
              <FileCheck className="w-6 h-6 text-orange-400" />
              <span 
                className="text-white text-center leading-tight"
                style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: '11px'
                }}
              >
                FORMATOS DE VENTA
              </span>
            </button>
          </div>

          {activeGestorSection && (
            <div className="mt-8 max-w-4xl mx-auto">
              <div 
                className="bg-white/5 border border-white/10 rounded-xl p-6"
                style={{
                  fontFamily: "'Exo 2', sans-serif"
                }}
              >
                <h3 
                  className="text-white mb-4"
                  style={{
                    fontSize: '18px',
                    fontWeight: 600
                  }}
                >
                  {activeGestorSection.charAt(0).toUpperCase() + activeGestorSection.slice(1)}
                </h3>
                <p 
                  className="text-white/60"
                  style={{
                    fontSize: '14px'
                  }}
                >
                  Módulo de gestión de {activeGestorSection} en construcción
                </p>
              </div>
            </div>
          )}
        </div>
      </ModuleTemplate>
    );
  }

  return null;
};
