import React, { useState } from 'react';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';

/**
 * Input — Unified input field with icon, label, error, helper text, and success state
 */
const Input = React.forwardRef(({
  label,
  name,
  type = 'text',
  error,
  success,
  helperText,
  icon: Icon,
  className = '',
  required = false,
  onBlur,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  const borderClass = error
    ? 'border-status-danger/70 focus:border-status-danger focus:ring-status-danger/15'
    : success
    ? 'border-status-success/60 focus:border-status-success focus:ring-status-success/15'
    : '';

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={name} className="text-sm font-medium text-slate-300">
          {label}{' '}
          {required && <span className="text-status-danger">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3 text-slate-500 pointer-events-none z-10">
            <Icon size={16} />
          </div>
        )}

        <input
          ref={ref}
          id={name}
          name={name}
          type={inputType}
          required={required}
          onBlur={onBlur}
          className={`
            w-full px-3 py-2 rounded-lg text-sm glass-input
            ${Icon ? 'pl-9' : ''}
            ${isPassword ? 'pr-10' : ''}
            ${success && !isPassword ? 'pr-9' : ''}
            ${borderClass}
          `}
          {...props}
        />

        {/* Success icon */}
        {success && !isPassword && (
          <div className="absolute right-3 text-status-success pointer-events-none">
            <CheckCircle2 size={15} />
          </div>
        )}

        {/* Password toggle */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 text-slate-500 hover:text-slate-300 focus:outline-none transition-colors"
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-xs text-status-danger font-medium flex items-center gap-1 mt-0.5">
          {error}
        </p>
      )}

      {/* Helper text (shown when no error) */}
      {!error && helperText && (
        <p className="text-xs text-slate-500 mt-0.5">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
