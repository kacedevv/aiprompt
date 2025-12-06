import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "relative px-8 py-3 rounded-sm font-medium transition-all duration-300 uppercase tracking-[0.15em] text-xs flex items-center justify-center gap-2 overflow-hidden group";
  
  const variants = {
    primary: `
      bg-gradient-to-r from-[#D4AF37] via-[#FDB931] to-[#C5A028] 
      text-black font-bold
      border border-transparent
      shadow-[0_0_15px_rgba(212,175,55,0.2)] 
      hover:shadow-[0_0_25px_rgba(212,175,55,0.6)] 
      hover:scale-[1.02] active:scale-[0.98]
    `,
    secondary: `
      bg-zinc-900 text-white border border-zinc-700
      hover:bg-zinc-800 hover:border-brand-gold/50 hover:text-brand-gold
      shadow-lg
    `,
    outline: `
      bg-transparent text-brand-gold border border-brand-gold/60
      hover:bg-brand-gold/10 hover:border-brand-gold hover:shadow-[0_0_15px_rgba(212,175,55,0.1)]
    `,
    ghost: `
      bg-transparent text-zinc-400 hover:text-white hover:bg-white/5
    `
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${isLoading ? 'opacity-70 cursor-not-allowed' : ''} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {/* Shine effect for primary buttons */}
      {variant === 'primary' && (
        <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent z-10" />
      )}
      
      <span className="relative z-20 flex items-center gap-2">
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            PROCESSING
          </>
        ) : children}
      </span>
    </button>
  );
};