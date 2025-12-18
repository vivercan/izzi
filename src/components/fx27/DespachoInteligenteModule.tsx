import { ModuleTemplate } from './ModuleTemplate';
import { MODULE_IMAGES } from '../../assets/module-images';
import DespachoInteligenteContent from './DespachoInteligenteContent';

interface DespachoInteligenteModuleProps {
  onBack: () => void;
}

export const DespachoInteligenteModule = ({ onBack }: DespachoInteligenteModuleProps) => {
  return (
    <ModuleTemplate title="Despacho Inteligente" onBack={onBack} headerImage={MODULE_IMAGES.DESPACHO_INTELIGENTE}>
      <DespachoInteligenteContent />
    </ModuleTemplate>
  );
};
