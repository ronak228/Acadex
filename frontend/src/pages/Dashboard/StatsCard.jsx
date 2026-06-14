import React from 'react';
import { ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';

const variantConfig = {
  indigo:  { icon: 'bg-brand/20 text-brand-light border-brand/30',           bar: 'bg-brand/30' },
  emerald: { icon: 'bg-status-success/20 text-status-success border-status-success/30', bar: 'bg-status-success/30' },
  amber:   { icon: 'bg-status-warning/20 text-status-warning border-status-warning/30', bar: 'bg-status-warning/30' },
  rose:    { icon: 'bg-status-danger/20 text-status-danger border-status-danger/30',     bar: 'bg-status-danger/30' },
  sky:     { icon: 'bg-status-info/20 text-status-info border-status-info/30',           bar: 'bg-status-info/30' },
};

/**
 * StatsCard — KPI metric card with icon, value, trend indicator, and description
 *
 * Props:
 *   title       string
 *   value       string | number
 *   icon        LucideIcon
 *   change      string (e.g. "+12%")
 *   isPositive  boolean
 *   description string
 *   variant     "indigo" | "emerald" | "amber" | "rose" | "sky"
 *   onClick     () => void
 */
const StatsCard = ({
  title,
  value,
  icon: Icon,
  change,
  isPositive = true,
  description,
  variant = 'indigo',
  onClick,
}) => {
  const cfg = variantConfig[variant] || variantConfig.indigo;

  return (
    <div
      className={`glass-card flex flex-col gap-3.5 transition-all duration-200
        ${onClick ? 'cursor-pointer hover:scale-[1.01] hover:shadow-lg' : ''}
      `}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-tight">
          {title}
        </p>
        {Icon && (
          <div className={`p-2 rounded-xl border shrink-0 ${cfg.icon}`}>
            <Icon size={16} />
          </div>
        )}
      </div>

      {/* Value */}
      <div className="flex items-end justify-between gap-2">
        <h3 className="text-2xl md:text-3xl font-extrabold font-heading text-white leading-none">
          {value}
        </h3>

        {/* Trend badge */}
        {change && (
          <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] font-bold
            ${isPositive
              ? 'bg-status-success/15 text-status-success'
              : 'bg-status-danger/15 text-status-danger'}`}
          >
            {isPositive
              ? <ArrowUpRight size={12} className="shrink-0" />
              : <ArrowDownRight size={12} className="shrink-0" />
            }
            {change}
          </span>
        )}
      </div>

      {/* Description */}
      {description && (
        <p className="text-xs text-slate-500 font-medium truncate">{description}</p>
      )}
    </div>
  );
};

export default StatsCard;
