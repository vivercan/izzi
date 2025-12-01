import { ModuleTemplate } from './ModuleTemplate';
import { MODULE_IMAGES } from '../../assets/module-images';

interface ControlEquipoModuleProps {
  onBack: () => void;
}

export const ControlEquipoModule = ({ onBack }: ControlEquipoModuleProps) => {
  return (
    <ModuleTemplate title="Control de Equipo" onBack={onBack} headerImage={MODULE_IMAGES.CONTROL_EQUIPO}>
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <p 
          style={{
            fontFamily: "'Exo 2', sans-serif",
            fontSize: '16px',
            color: 'rgba(255, 255, 255, 0.5)'
          }}
        >
          Contenido del módulo Control de Equipo
        </p>
      </div>
    </ModuleTemplate>
  );
};