import React from 'react';
import { InboxIcon } from 'lucide-react';
import Button from './Button';

/**
 * EmptyState — Full-featured empty state with icon, title, description, and CTA
 *
 * Props:
 *   icon         LucideIcon
 *   title        string
 *   description  string
 *   action       { label: string, onClick: fn, icon?: LucideIcon }
 *   compact      boolean — smaller variant for inline use inside cards
 *   className    string
 */
const EmptyState = ({
  icon: Icon = InboxIcon,
  title = 'Nothing here yet',
  description,
  action,
  compact = false,
  className = '',
}) => {
  if (compact) {
    return (
      <div className={`flex flex-col items-center justify-center gap-2 py-8 text-center ${className}`}>
        <div className="w-10 h-10 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-slate-500">
          <Icon size={18} />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-400">{title}</p>
          {description && (
            <p className="text-xs text-slate-500 mt-0.5 max-w-[220px]">{description}</p>
          )}
        </div>
        {action && (
          <Button variant="ghost" size="sm" onClick={action.onClick}>
            {action.icon && <action.icon size={14} />}
            {action.label}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center gap-4 py-16 text-center ${className}`}>
      {/* Icon Container */}
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/60 flex items-center justify-center text-slate-500 shadow-lg">
          <Icon size={28} strokeWidth={1.5} />
        </div>
        {/* Subtle glow */}
        <div className="absolute inset-0 rounded-2xl bg-brand/5 blur-xl pointer-events-none" />
      </div>

      {/* Text */}
      <div className="flex flex-col gap-1.5 max-w-xs">
        <h3 className="text-base font-bold text-slate-200 font-heading">{title}</h3>
        {description && (
          <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
        )}
      </div>

      {/* CTA */}
      {action && (
        <Button
          variant="primary"
          size="md"
          onClick={action.onClick}
          className="mt-1"
        >
          {action.icon && <action.icon size={15} />}
          {action.label}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
