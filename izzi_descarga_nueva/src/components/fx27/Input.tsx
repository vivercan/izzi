import { InputHTMLAttributes, forwardRef, useState } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: boolean;
  errorMessage?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, errorMessage, className = '', ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    
    return (
      <div className="w-full">
        {label && (
          <label className="block mb-2 text-[var(--fx-text)]" style={{
            fontFamily: "'Exo 2', sans-serif",
            fontWeight: 500,
            fontSize: '14px',
            lineHeight: '20px'
          }}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full h-[44px] px-4 rounded-[var(--radius-md)]
            bg-transparent border transition-all duration-200
            ${error ? 'border-red-500' : isFocused ? 'border-[var(--fx-primary)]' : 'border-[#334155]'}
            text-[var(--fx-text)] outline-none
            ${className}
          `}
          style={{
            fontFamily: "'Exo 2', sans-serif",
            fontWeight: 400,
            fontSize: '16px',
            lineHeight: '24px'
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {error && errorMessage && (
          <p className="mt-1 text-red-500 caption">{errorMessage}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
