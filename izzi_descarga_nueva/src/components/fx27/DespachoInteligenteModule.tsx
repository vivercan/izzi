import { ModuleTemplate } from './ModuleTemplate';
import { MODULE_IMAGES } from '../../assets/module-images';

interface DespachoInteligenteModuleProps {
  onBack: () => void;
}

export const DespachoInteligenteModule = ({ onBack }: DespachoInteligenteModuleProps) => {
  return (
    <ModuleTemplate title="Despacho Inteligente" onBack={onBack} headerImage={MODULE_IMAGES.DESPACHO_INTELIGENTE}>
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <p 
          style={{
            fontFamily: "'Exo 2', sans-serif",
            fontSize: '16px',
            color: 'rgba(255, 255, 255, 0.5)'
          }}
        >
          Contenido del módulo Despacho Inteligente
        </p>
      </div>
    </ModuleTemplate>
  );
};