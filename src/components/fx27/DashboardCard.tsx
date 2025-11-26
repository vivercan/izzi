import { ReactNode } from 'react';

interface DashboardCardProps {
  title: string;
  value?: string | number;
  icon?: ReactNode;
  onClick?: () => void;
}

export const DashboardCard = ({ title, value, icon, onClick }: DashboardCardProps) => {
  return (
    <div
      className="
        w-full min-h-[160px] p-[var(--spacing-lg)] rounded-[var(--radius-lg)]
        bg-[var(--fx-surface)] border border-[#1e293b]
        transition-all duration-300 cursor-pointer
        hover:translate-y-[-4px] hover:shadow-[0_12px_28px_rgba(0,0,0,0.3)]
        flex flex-col justify-between
      "
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <h3 className="tech-label text-[var(--fx-text)]">{title}</h3>
        {icon && <div className="text-[var(--fx-primary)]">{icon}</div>}
      </div>
      {value && (
        <div className="mt-4">
          <p className="tech-label text-[var(--fx-primary)]" style={{ fontSize: '28px', lineHeight: '32px' }}>
            {value}
          </p>
        </div>
      )}
    </div>
  );
};
