import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || Math.random().toString(36).substring(7);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="font-poppins font-medium text-sm text-slate-700">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full bg-white/40 backdrop-blur-md border border-slate-200 focus:border-primary-main rounded-full px-5 py-3.5 text-slate-800 placeholder-slate-400 outline-none focus:bg-white/60 focus:shadow-inner transition-all duration-300 ${
          error ? 'border-red-400 focus:border-red-500' : ''
        } ${className}`}
        {...props}
      />
      {error && (
        <span className="text-red-500 font-inter text-xs mt-0.5 px-2">{error}</span>
      )}
    </div>
  );
};
