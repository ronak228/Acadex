import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Button — Unified button component with full variant + size support
 *
 * Variants: primary | secondary | outline | ghost | danger | danger-outline | icon
 * Sizes:    sm | md | lg
 */
const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  loading = false,
  className = '',
  title,
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center font-semibold transition-all duration-200 ' +
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ' +
    'focus-visible:outline-brand disabled:opacity-50 disabled:cursor-not-allowed ' +
    'select-none shrink-0';

  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
    md: 'px-4 py-2 text-sm rounded-lg gap-2',
    lg: 'px-5 py-2.5 text-[15px] rounded-xl gap-2.5',
    icon: 'p-2 rounded-lg',
  };

  const variants = {
    primary:
      'bg-gradient-to-r from-brand to-brand-light text-white shadow-brand/20 shadow-md ' +
      'hover:brightness-110 hover:shadow-lg hover:shadow-brand/30 active:brightness-95 active:scale-[0.98]',
    secondary:
      'bg-bg-surfaceLight text-slate-100 border border-slate-600/40 ' +
      'hover:bg-slate-600 hover:border-slate-500 active:scale-[0.98]',
    outline:
      'border border-slate-700 text-slate-300 bg-transparent ' +
      'hover:bg-slate-800 hover:text-white hover:border-slate-600 active:scale-[0.98]',
    ghost:
      'text-slate-400 bg-transparent ' +
      'hover:bg-slate-800 hover:text-white active:scale-[0.98]',
    danger:
      'bg-status-danger text-white shadow-danger/20 shadow-md ' +
      'hover:brightness-110 hover:shadow-lg hover:shadow-danger/30 active:brightness-95 active:scale-[0.98]',
    'danger-outline':
      'border border-status-danger/50 text-status-danger bg-transparent ' +
      'hover:bg-status-danger/10 hover:border-status-danger active:scale-[0.98]',
    icon:
      'text-slate-400 bg-transparent rounded-lg ' +
      'hover:bg-slate-800 hover:text-white active:scale-95',
  };

  const sizeKey = variant === 'icon' ? 'icon' : size;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      title={title}
      className={`${base} ${sizes[sizeKey]} ${variants[variant] || variants.primary} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="animate-spin shrink-0" size={sizeKey === 'sm' ? 12 : sizeKey === 'lg' ? 18 : 15} />
      ) : null}
      {children}
    </button>
  );
};

export default Button;
