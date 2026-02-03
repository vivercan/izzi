import { ModuleTemplate } from './ModuleTemplate';

interface AtencionClientesModuleProps {
  onBack: () => void;
  userEmail?: string;
  userName?: string;
}

export const AtencionClientesModule = ({ onBack, userEmail, userName }: AtencionClientesModuleProps) => {
  return (
    <ModuleTemplate title="Servicio a Clientes" onBack={onBack}>
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4">
        <div className="text-6xl mb-4">🎧</div>
        <h2 
          className="text-2xl font-bold text-white"
          style={{ fontFamily: "'Exo 2', sans-serif" }}
        >
          Módulo en Construcción
        </h2>
        <p 
          className="text-white/60 text-center max-w-md"
          style={{ fontFamily: "'Exo 2', sans-serif" }}
        >
          El módulo de Servicio a Clientes está en desarrollo. Próximamente podrás gestionar tickets, seguimiento y atención al cliente desde aquí.
        </p>
        {userName && (
          <p className="text-white/40 text-sm mt-4" style={{ fontFamily: "'Exo 2', sans-serif" }}>
            Usuario: {userName}
          </p>
        )}
      </div>
    </ModuleTemplate>
  );
};
