import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

/**
 * Breadcrumb — Route context breadcrumb navigation
 *
 * Props:
 *   items  Array<{ label: string, href?: string }>
 *          Last item is always the current page (no href needed)
 */
const Breadcrumb = ({ items = [] }) => {
  if (!items.length) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-slate-500 mb-1">
      <Link
        to="/dashboard"
        className="flex items-center text-slate-500 hover:text-slate-300 transition-colors"
        aria-label="Home"
      >
        <Home size={12} />
      </Link>

      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <React.Fragment key={idx}>
            <ChevronRight size={11} className="text-slate-600 shrink-0" />
            {isLast || !item.href ? (
              <span
                className={isLast ? 'text-slate-300 font-medium truncate max-w-[180px]' : 'text-slate-500'}
                aria-current={isLast ? 'page' : undefined}
              >
                {item.label}
              </span>
            ) : (
              <Link
                to={item.href}
                className="text-slate-500 hover:text-slate-300 transition-colors truncate max-w-[120px]"
              >
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumb;
