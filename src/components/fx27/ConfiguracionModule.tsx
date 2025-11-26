import { useState } from 'react';
import { ModuleTemplate } from './ModuleTemplate';
import { UsuariosModule } from './UsuariosModule';
import { CarrollConfigModule } from './CarrollConfigModule';
import { VariablesCotizacionModule } from './VariablesCotizacionModule';
import { MODULE_IMAGES } from '../../assets/module-images';
import { FileText, File, Folder, Image, Package, Upload, Download, Trash2, Users, ArrowLeft, Database, Truck, Settings, MapPin, Calculator } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface ConfiguracionModuleProps {
  onBack: () => void;
}

type FileCategory = 'cotizaciones' | 'contratos' | 'documentos' | 'imagenes' | 'otros';

interface FileMetadata {
  id: string;
  originalName: string;
  storagePath: string;
  category: FileCategory;
  size: number;
  type: string;
  uploadedAt: string;
}

export const ConfiguracionModule = ({ onBack }: ConfiguracionModuleProps) => {
  const [showUsuarios, setShowUsuarios] = useState(false);
  const [showArchivos, setShowArchivos] = useState(false);
  const [showCarroll, setShowCarroll] = useState(false);
  const [showVariablesCotizacion, setShowVariablesCotizacion] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<FileCategory>('cotizaciones');
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [uploading, setUploading] = useState(false);
  const [downloadingBackup, setDownloadingBackup] = useState(false);

  if (showUsuarios) {
    return <UsuariosModule onBack={() => setShowUsuarios(false)} />;
  }

  if (showCarroll) {
    return <CarrollConfigModule onBack={() => setShowCarroll(false)} />;
  }

  if (showVariablesCotizacion) {
    return <VariablesCotizacionModule onBack={() => setShowVariablesCotizacion(false)} />;
  }

  const handleDownloadBackup = async () => {
    setDownloadingBackup(true);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/leads/backup/download`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      if (!response.ok) {
        throw new Error('No hay registros de backup disponibles');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fx27_backup_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      alert('✅ Backup descargado exitosamente');
    } catch (error) {
      console.error('[Configuracion] Error al descargar backup:', error);
      alert(`❌ Error: ${error}`);
    } finally {
      setDownloadingBackup(false);
    }
  };

  const loadFiles = async (category: FileCategory) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/files?category=${category}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      const result = await response.json();
      if (result.success) {
        setFiles(result.files);
      }
    } catch (error) {
      console.error('[Configuracion] Error al cargar archivos:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', selectedCategory);

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/files/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: formData
      });

      const result = await response.json();
      if (result.success) {
        alert(`✅ Archivo "${file.name}" subido exitosamente`);
        loadFiles(selectedCategory);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('[Configuracion] Error al subir archivo:', error);
      alert(`❌ Error al subir archivo: ${error}`);
    } finally {
      setUploading(false);
    }
  };

  const handleFileDownload = async (fileId: string) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/files/${fileId}/download`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      const result = await response.json();
      if (result.success) {
        window.open(result.url, '_blank');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('[Configuracion] Error al descargar archivo:', error);
      alert(`❌ Error al descargar: ${error}`);
    }
  };

  const handleFileDelete = async (fileId: string, fileName: string) => {
    if (!confirm(`¿Eliminar "${fileName}"?`)) return;

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-d84b50bb/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      const result = await response.json();
      if (result.success) {
        alert('✅ Archivo eliminado');
        loadFiles(selectedCategory);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('[Configuracion] Error al eliminar archivo:', error);
      alert(`❌ Error: ${error}`);
    }
  };

  const categoryConfig = {
    cotizaciones: { icon: FileText, label: 'Cotizaciones', color: 'blue' },
    contratos: { icon: File, label: 'Contratos', color: 'green' },
    documentos: { icon: Folder, label: 'Documentos', color: 'purple' },
    imagenes: { icon: Image, label: 'Imágenes', color: 'orange' },
    otros: { icon: Package, label: 'Otros', color: 'gray' }
  };

  if (showArchivos) {
    return (
      <ModuleTemplate 
        title="Gestión de Archivos" 
        onBack={() => setShowArchivos(false)} 
        headerImage="https://images.unsplash.com/photo-1644134913822-1cd030b3d148?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXJnbyUyMGNvbnRhaW5lciUyMHNoaXBwaW5nJTIwcG9ydHxlbnwxfHx8fDE3NjI4OTgxNTl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
      >
        <div className="p-8">
          {/* Selector de Categorías */}
          <div className="mb-6 grid grid-cols-5 gap-3">
            {(Object.keys(categoryConfig) as FileCategory[]).map((cat) => {
              const config = categoryConfig[cat];
              const Icon = config.icon;
              const isActive = selectedCategory === cat;
              
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    loadFiles(cat);
                  }}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    isActive 
                      ? 'bg-[var(--fx-primary)] border-[var(--fx-primary)] text-white' 
                      : 'bg-[var(--fx-surface)] border-white/10 text-[var(--fx-muted)] hover:border-[var(--fx-primary)]'
                  }`}
                  style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', fontWeight: 600 }}
                >
                  <Icon className="w-6 h-6 mx-auto mb-2" />
                  {config.label}
                </button>
              );
            })}
          </div>

          {/* Botón Upload */}
          <div className="mb-6 flex items-center gap-4">
            <label className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white cursor-pointer transition-all">
              <Upload className="w-5 h-5" />
              <span style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', fontWeight: 600 }}>
                {uploading ? 'Subiendo...' : 'Subir Archivo'}
              </span>
              <input 
                type="file" 
                onChange={handleFileUpload} 
                disabled={uploading}
                className="hidden" 
              />
            </label>
            <div className="text-[var(--fx-muted)]" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px' }}>
              Categoría: <span className="text-white font-semibold">{categoryConfig[selectedCategory].label}</span>
            </div>
          </div>

          {/* Lista de Archivos */}
          <div className="rounded-2xl bg-[var(--fx-surface)] border border-white/10 overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h3 className="text-white" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '16px', fontWeight: 700 }}>
                📁 {categoryConfig[selectedCategory].label} ({files.length})
              </h3>
            </div>

            <div className="divide-y divide-white/5">
              {files.length === 0 ? (
                <div className="p-8 text-center text-[var(--fx-muted)]" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px' }}>
                  No hay archivos en esta categoría. Sube uno usando el botón de arriba.
                </div>
              ) : (
                files.map((file) => (
                  <div key={file.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                    <div className="flex-1">
                      <div className="text-white" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '14px', fontWeight: 600 }}>
                        {file.originalName}
                      </div>
                      <div className="text-[var(--fx-muted)]" style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '12px' }}>
                        {(file.size / 1024).toFixed(2)} KB • {new Date(file.uploadedAt).toLocaleString('es-MX')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleFileDownload(file.id)}
                        className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition-colors"
                        title="Descargar"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleFileDelete(file.id, file.originalName)}
                        className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </ModuleTemplate>
    );
  }

  return (
    <ModuleTemplate 
      title="Configuración" 
      onBack={onBack} 
      headerImage={MODULE_IMAGES.CONFIGURACION}
    >
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 👥 Botón USUARIOS */}
          <button
            onClick={() => setShowUsuarios(true)}
            className="group relative overflow-hidden p-8 rounded-2xl bg-gradient-to-br from-white to-gray-100 hover:from-white hover:to-blue-50 transition-all shadow-lg hover:shadow-xl hover:scale-105 border-2 border-transparent hover:border-[var(--fx-primary)]"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-gradient-to-br from-[#1E66F5] to-[#0EA5E9] shadow-lg group-hover:shadow-blue-500/50 transition-shadow">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 
                className="text-gray-900 group-hover:text-[var(--fx-primary)] transition-colors"
                style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: '20px',
                  fontWeight: 700,
                  letterSpacing: '0.5px'
                }}
              >
                USUARIOS
              </h3>
              <p 
                className="text-gray-600 text-center"
                style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: '13px'
                }}
              >
                Gestionar usuarios y permisos del sistema
              </p>
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
          </button>

          {/* 💾 Botón BACKUP */}
          <button
            onClick={handleDownloadBackup}
            disabled={downloadingBackup}
            className="group relative overflow-hidden p-8 rounded-2xl bg-gradient-to-br from-white to-gray-100 hover:from-white hover:to-green-50 transition-all shadow-lg hover:shadow-xl hover:scale-105 border-2 border-transparent hover:border-green-500"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg group-hover:shadow-green-500/50 transition-shadow">
                <Database className="w-8 h-8 text-white" />
              </div>
              <h3 
                className="text-gray-900 group-hover:text-green-600 transition-colors"
                style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: '20px',
                  fontWeight: 700,
                  letterSpacing: '0.5px'
                }}
              >
                {downloadingBackup ? 'DESCARGANDO...' : 'BACKUP'}
              </h3>
              <p 
                className="text-gray-600 text-center"
                style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: '13px'
                }}
              >
                Descargar respaldo completo de leads eliminados
              </p>
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
          </button>

          {/* 📂 Botón ARCHIVOS */}
          <button
            onClick={() => setShowArchivos(true)}
            className="group relative overflow-hidden p-8 rounded-2xl bg-gradient-to-br from-white to-gray-100 hover:from-white hover:to-purple-50 transition-all shadow-lg hover:shadow-xl hover:scale-105 border-2 border-transparent hover:border-purple-500"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-gradient-to-br from-purple-500 to-violet-500 shadow-lg group-hover:shadow-purple-500/50 transition-shadow">
                <Folder className="w-8 h-8 text-white" />
              </div>
              <h3 
                className="text-gray-900 group-hover:text-purple-600 transition-colors"
                style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: '20px',
                  fontWeight: 700,
                  letterSpacing: '0.5px'
                }}
              >
                ARCHIVOS
              </h3>
              <p 
                className="text-gray-600 text-center"
                style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: '13px'
                }}
              >
                Gestionar cotizaciones, contratos y documentos
              </p>
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
          </button>

          {/* 🚚 Botón CARROLL */}
          <button
            onClick={() => setShowCarroll(true)}
            className="group relative overflow-hidden p-8 rounded-2xl bg-gradient-to-br from-white to-gray-100 hover:from-white hover:to-blue-50 transition-all shadow-lg hover:shadow-xl hover:scale-105 border-2 border-transparent hover:border-[var(--fx-primary)]"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-gradient-to-br from-[#1E66F5] to-[#0EA5E9] shadow-lg group-hover:shadow-blue-500/50 transition-shadow">
                <Truck className="w-8 h-8 text-white" />
              </div>
              <h3 
                className="text-gray-900 group-hover:text-[var(--fx-primary)] transition-colors"
                style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: '20px',
                  fontWeight: 700,
                  letterSpacing: '0.5px'
                }}
              >
                CARROLL
              </h3>
              <p 
                className="text-gray-600 text-center"
                style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: '13px'
                }}
              >
                Configuración de Carroll
              </p>
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
          </button>

          {/* 🗺️ Botón VARIABLES DE COTIZACIÓN */}
          <button
            onClick={() => setShowVariablesCotizacion(true)}
            className="group relative overflow-hidden p-8 rounded-2xl bg-gradient-to-br from-white to-gray-100 hover:from-white hover:to-orange-50 transition-all shadow-lg hover:shadow-xl hover:scale-105 border-2 border-transparent hover:border-orange-500"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg group-hover:shadow-orange-500/50 transition-shadow">
                <Calculator className="w-8 h-8 text-white" />
              </div>
              <h3 
                className="text-gray-900 group-hover:text-orange-600 transition-colors"
                style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: '20px',
                  fontWeight: 700,
                  letterSpacing: '0.5px'
                }}
              >
                VARIABLES DE COTIZACIÓN
              </h3>
              <p 
                className="text-gray-600 text-center"
                style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontSize: '13px'
                }}
              >
                Configurar tarifas y tipo de cambio
              </p>
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
          </button>

          {/* Placeholders para futuros módulos */}
          {[1, 2].map((i) => (
            <div key={i} className="p-8 rounded-2xl bg-[var(--fx-surface)] border border-white/10 opacity-50">
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 rounded-full bg-gray-700">
                  <div className="w-8 h-8"></div>
                </div>
                <h3 
                  className="text-[var(--fx-muted)]"
                  style={{
                    fontFamily: "'Exo 2', sans-serif",
                    fontSize: '16px',
                    fontWeight: 600
                  }}
                >
                  Próximamente
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ModuleTemplate>
  );
};