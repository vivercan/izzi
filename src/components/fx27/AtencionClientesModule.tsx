import React from 'react';
import { ModuleTemplate } from './ModuleTemplate';

interface AtencionClientesModuleProps {
  onBack: () => void;
  userEmail: string;
  userName: string;
}

export const AtencionClientesModule = ({ onBack, userEmail, userName }: AtencionClientesModuleProps) => {
  return (
    <ModuleTemplate title="Servicio a Clientes" onBack={onBack}>
      <div className="flex flex-col items-center justify-center" style={{ minHeight: '60vh' }}>
        <p style={{ fontFamily: "'Exo 2', sans-serif", fontSize: '16px', color: 'rgba(255,255,255,0.35)' }}>
          Módulo en construcción
        </p>
      </div>
    </ModuleTemplate>
  );
};

export default AtencionClientesModule;