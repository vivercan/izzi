import { ModuleTemplate } from './ModuleTemplate';
import { MODULE_IMAGES } from '../../assets/module-images';

interface ServicioClientesModuleProps {
  onBack: () => void;
}

export const ServicioClientesModule = ({ onBack }: ServicioClientesModuleProps) => {
  return (
    <ModuleTemplate title="Servicio A Clientes" onBack={onBack} headerImage={MODULE_IMAGES.SERVICIO_CLIENTES}>
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <p 
          style={{
            fontFamily: "'Exo 2', sans-serif",
            fontSize: '16px',
            color: 'rgba(255, 255, 255, 0.5)'
          }}
        >
          Contenido del módulo Servicio A Clientes
        </p>
      </div>
    </ModuleTemplate>
  );
};