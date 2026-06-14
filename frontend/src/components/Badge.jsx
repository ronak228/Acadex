import React from 'react';

/**
 * Badge — Unified status/type/count badge component
 *
 * Variants: success | warning | danger | info | brand | neutral | outline
 * Sizes:    sm | md
 */
const variantMap = {
  success: 'bg-status-success/15 text-status-success border border-status-success/25',
  warning: 'bg-status-warning/15 text-status-warning border border-status-warning/25',
  danger:  'bg-status-danger/15  text-status-danger  border border-status-danger/25',
  info:    'bg-status-info/15    text-status-info    border border-status-info/25',
  brand:   'bg-brand/15          text-brand-light    border border-brand/25',
  neutral: 'bg-slate-700/60      text-slate-400      border border-slate-700',
  outline: 'bg-transparent       text-slate-300      border border-slate-600',
};

const sizeMap = {
  sm: 'px-2 py-0.5 text-[11px]',
  md: 'px-2.5 py-0.5 text-xs',
};

const Badge = ({
  children,
  variant = 'neutral',
  size = 'sm',
  dot = false,
  className = '',
}) => {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-semibold rounded-full
        ${variantMap[variant] || variantMap.neutral}
        ${sizeMap[size] || sizeMap.sm}
        ${className}
      `}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            variant === 'success' ? 'bg-status-success' :
            variant === 'warning' ? 'bg-status-warning' :
            variant === 'danger'  ? 'bg-status-danger'  :
            variant === 'info'    ? 'bg-status-info'    :
            variant === 'brand'   ? 'bg-brand-light'    :
            'bg-slate-400'
          }`}
        />
      )}
      {children}
    </span>
  );
};

/**
 * Helper: map common status strings to the correct Badge variant
 */
export const statusVariant = (status) => {
  const map = {
    // Student/Account status
    ACTIVE: 'success', Active: 'success',
    INACTIVE: 'danger', Inactive: 'danger',

    // Admission / Inquiry
    NEW: 'brand',
    CONTACTED: 'warning',
    INTERESTED: 'info',
    CONVERTED: 'success',
    DROPPED: 'neutral',
    APPLIED: 'brand',
    UNDER_REVIEW: 'warning',
    APPROVED: 'success',
    REJECTED: 'danger',

    // Exam / Result
    PASS: 'success',
    FAIL: 'danger',
    PENDING: 'warning',
    SCHEDULED: 'brand',
    COMPLETED: 'success',
    CANCELLED: 'neutral',

    // Fee
    PAID: 'success',
    PARTIAL: 'warning',
    OVERDUE: 'danger',
    DUE: 'warning',

    // Assignment
    SUBMITTED: 'success',
    GRADED: 'brand',
    LATE: 'warning',
    MISSING: 'danger',
  };
  return map[status] || 'neutral';
};

export default Badge;
