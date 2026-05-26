import React from 'react';

export const AuthInput = ({ label, icon, error, ...props }) => {
  return (
    <div className="space-y-2 w-full">
      {label && (
        <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] pl-1">
          {label}
        </label>
      )}
      <div className="relative group">
        {icon && (
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-cyan transition-colors z-10">
            {icon}
          </div>
        )}
        <input
          {...props}
          className={`
            w-full bg-white/5 border rounded-2xl py-4 text-white text-sm font-bold outline-none transition-all placeholder:text-white/10
            ${icon ? 'pl-14 pr-6' : 'px-6'}
            ${error ? 'border-red-500/50 bg-red-500/5' : 'border-white/10 focus:border-brand-cyan/50 focus:bg-white/10'}
          `}
        />
      </div>
      {error && <p className="text-[10px] font-bold text-red-400 pl-1">{error}</p>}
    </div>
  );
};

export const AuthButton = ({ children, loading, variant = 'primary', ...props }) => {
  const variants = {
    primary: 'bg-brand-cyan text-bg-deep shadow-brand-cyan/20 hover:shadow-brand-cyan/40',
    secondary: 'bg-brand-purple text-white shadow-brand-purple/20 hover:shadow-brand-purple/40',
    outline: 'bg-white/5 border border-white/10 text-white hover:bg-white/10',
  };

  return (
    <button
      disabled={loading}
      {...props}
      className={`
        w-full py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
      `}
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        children
      )}
    </button>
  );
};
