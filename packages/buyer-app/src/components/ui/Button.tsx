import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'orange' | 'secondary';
  fullWidth?: boolean;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  fullWidth = false,
  loading = false,
  disabled,
  className = '',
  ...props
}) => {
  const baseStyle = 'inline-flex items-center justify-center font-poppins font-semibold rounded-full transition-all duration-300 active:scale-95 focus:outline-none';
  
  const variants = {
    primary: 'bg-primary-main hover:bg-primary-hover text-white shadow-premium hover:shadow-lg px-8 py-3.5',
    ghost: 'border-2 border-primary-main/20 hover:border-primary-main hover:bg-primary-main/5 text-primary-main px-8 py-3.5',
    secondary: 'bg-primary-light hover:bg-primary-main text-white shadow-md px-6 py-3',
    orange: 'bg-accent-orange hover:bg-accent-orangeHover text-white shadow-premium hover:shadow-lg px-8 py-3.5',
    danger: 'bg-red-500 hover:bg-red-600 text-white shadow-md px-6 py-3',
  };

  const widthStyle = fullWidth ? 'w-full' : '';
  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      className={`${baseStyle} ${variants[variant]} ${widthStyle} ${isDisabled ? 'opacity-60 cursor-not-allowed' : ''} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>{children}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};
