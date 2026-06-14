import React from 'react';

/**
 * Select — Unified select dropdown matching Input styling exactly
 */
const Select = ({
  label,
  name,
  options = [],
  value,
  onChange,
  error,
  helperText,
  required = false,
  className = '',
  placeholder = 'Select an option',
  disabled = false,
  children,
  ...props
}) => {
  const hasChildren = React.Children.count(children) > 0;

  const chevronSvg = `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M7 8l3 3 3-3' stroke='%2394a3b8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`;

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={name} className="text-sm font-medium text-slate-300">
          {label} {required && <span className="text-status-danger">*</span>}
        </label>
      )}

      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={`
          w-full px-3 py-2 rounded-lg text-sm glass-input appearance-none pr-9
          bg-no-repeat bg-[position:right_10px_center] bg-[size:20px]
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-status-danger/70 focus:border-status-danger' : ''}
        `}
        style={{ backgroundImage: chevronSvg }}
        {...props}
      >
        {hasChildren ? children : (
          <>
            {placeholder && (
              <option value="" className="bg-bg-surface text-slate-400">
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                className="bg-bg-surface text-slate-200"
                disabled={opt.disabled}
              >
                {opt.label}
              </option>
            ))}
          </>
        )}
      </select>

      {error && (
        <p className="text-xs text-status-danger font-medium mt-0.5">{error}</p>
      )}
      {!error && helperText && (
        <p className="text-xs text-slate-500 mt-0.5">{helperText}</p>
      )}
    </div>
  );
};

export default Select;
