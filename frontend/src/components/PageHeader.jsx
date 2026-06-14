import React from 'react';
import Breadcrumb from './Breadcrumb';

/**
 * PageHeader — Consistent page header with h1, subtitle, breadcrumb, and CTA slot
 *
 * Props:
 *   title       string
 *   subtitle    string
 *   breadcrumb  Array<{ label: string, href?: string }>
 *   actions     ReactNode — CTA buttons/controls
 *   className   string
 */
const PageHeader = ({
  title,
  subtitle,
  breadcrumb,
  actions,
  className = '',
}) => {
  return (
    <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 ${className}`}>
      <div className="flex flex-col gap-1 min-w-0">
        {breadcrumb && breadcrumb.length > 0 && (
          <Breadcrumb items={breadcrumb} />
        )}
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-heading leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs md:text-sm text-slate-400 leading-relaxed max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap md:flex-nowrap">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
