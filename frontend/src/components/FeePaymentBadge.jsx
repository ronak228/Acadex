import React from 'react';

const STATUS_MAP = {
  PAID: { label: 'Paid', classes: 'bg-status-success/15 text-status-success border-status-success/30' },
  PARTIALLY_PAID: { label: 'Partial', classes: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  OVERDUE: { label: 'Overdue', classes: 'bg-status-danger/15 text-status-danger border-status-danger/30' },
  PENDING: { label: 'Pending', classes: 'bg-slate-500/15 text-slate-400 border-slate-500/30' },
  WAIVED: { label: 'Waived', classes: 'bg-brand/15 text-brand-light border-brand/30' }
};

const FeePaymentBadge = ({ status }) => {
  const cfg = STATUS_MAP[status] || STATUS_MAP.PENDING;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-bold rounded-full border ${cfg.classes}`}>
      {cfg.label}
    </span>
  );
};

export default FeePaymentBadge;
