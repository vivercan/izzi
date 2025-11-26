import { ModuleTemplate } from './ModuleTemplate';
import { MODULE_IMAGES } from '../../assets/module-images';

interface VentasModuleProps {
  onBack: () => void;
}

export const VentasModule = ({ onBack }: VentasModuleProps) => {
  return (
    <ModuleTemplate title="Ventas" onBack={onBack} headerImage={MODULE_IMAGES.VENTAS}>
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <p 
          style={{
            fontFamily: "'Exo 2', sans-serif",
            fontSize: '16px',
            color: 'rgba(255, 255, 255, 0.5)'
          }}
        >
          Contenido del módulo Ventas
        </p>
      </div>
    </ModuleTemplate>
  );
};