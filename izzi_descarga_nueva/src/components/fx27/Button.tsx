import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'hover' | 'disabled';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'default', className = '', children, disabled, ...props }, ref) => {
    const isDisabled = disabled || variant === 'disabled';
    
    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`
          w-full h-[44px] rounded-[var(--radius-md)]
          bg-[var(--fx-primary)] text-white
          transition-all duration-200
          ${!isDisabled ? 'hover:bg-[#2b72f7] hover:shadow-lg active:scale-[0.98]' : ''}
          ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${className}
        `}
        style={{
          fontFamily: "'Exo 2', sans-serif",
          fontWeight: 600,
          fontSize: '16px',
          lineHeight: '20px'
        }}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
