import React from 'react';
import { CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react';

const fmt = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const getInstallmentStatus = (installment, payments = [], discountRatio = 1) => {
  const today = new Date();
  const dueDate = new Date(installment.dueDate);
  const netInstAmount = parseFloat((parseFloat(installment.amount) * discountRatio).toFixed(2));
  const instPayments = payments.filter((p) => p.installmentId === installment.id);
  const totalPaid = instPayments.reduce((s, p) => s + parseFloat(p.amountPaid) + parseFloat(p.creditApplied || 0), 0);
  const isWaived = instPayments.some((p) => p.status === 'WAIVED');

  if (isWaived || (netInstAmount <= 0)) return 'WAIVED';
  if (totalPaid >= netInstAmount - 0.001) return 'PAID';
  if (totalPaid > 0) return 'PARTIALLY_PAID';
  if (dueDate < today) return 'OVERDUE';
  return 'PENDING';
};

const STATUS_CONFIG = {
  PAID:           { icon: CheckCircle, color: 'text-status-success', bg: 'bg-status-success/15 border-status-success/30', label: 'Paid' },
  PARTIALLY_PAID: { icon: Clock,       color: 'text-yellow-400',     bg: 'bg-yellow-500/15 border-yellow-500/30',         label: 'Partial' },
  OVERDUE:        { icon: AlertCircle, color: 'text-status-danger',  bg: 'bg-status-danger/15 border-status-danger/30',   label: 'Overdue' },
  PENDING:        { icon: Clock,       color: 'text-slate-400',      bg: 'bg-slate-700/30 border-slate-600/30',           label: 'Pending' },
  WAIVED:         { icon: XCircle,     color: 'text-brand-light',    bg: 'bg-brand/15 border-brand/30',                   label: 'Waived' }
};

const InstallmentTimeline = ({ installments = [], payments = [], netPayable, totalAmount }) => {
  const discountRatio = (netPayable != null && totalAmount != null && parseFloat(totalAmount) > 0)
    ? Math.min(1, parseFloat(netPayable) / parseFloat(totalAmount))
    : 1;

  if (installments.length === 0) {
    return (
      <p className="text-sm text-slate-500 text-center py-4">No installments defined for this structure.</p>
    );
  }

  return (
    <div className="flex flex-col gap-0">
      {installments.map((inst, idx) => {
        const status = getInstallmentStatus(inst, payments, discountRatio);
        const { icon: Icon, color, bg, label } = STATUS_CONFIG[status];
        const netInstAmount = parseFloat((parseFloat(inst.amount) * discountRatio).toFixed(2));
        const instPayments = payments.filter((p) => p.installmentId === inst.id);
        const totalPaid = instPayments.reduce((s, p) => s + parseFloat(p.amountPaid) + parseFloat(p.creditApplied || 0), 0);
        const hasCreditAdj = instPayments.some((p) => parseFloat(p.creditApplied || 0) > 0);

        return (
          <div key={inst.id} className="flex gap-4 items-start">
            {/* Connector */}
            <div className="flex flex-col items-center shrink-0 pt-1">
              <Icon className={color} size={20} />
              {idx < installments.length - 1 && (
                <div className="w-px flex-1 min-h-[24px] bg-slate-700/60 mt-1" />
              )}
            </div>

            {/* Content */}
            <div className={`flex-1 mb-4 p-3 rounded-xl border ${bg}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">{inst.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Due: {new Date(inst.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                  {discountRatio < 1 && (
                    <p className="text-xs text-brand-light mt-0.5">Discount Applied · Net: {fmt(netInstAmount)}</p>
                  )}
                  {hasCreditAdj && (
                    <p className="text-xs text-status-success mt-0.5">Credit Adjusted</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white">{fmt(netInstAmount)}</p>
                  {totalPaid > 0 && (
                    <p className="text-xs text-slate-400">Paid: {fmt(totalPaid)}</p>
                  )}
                  <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-full border ${bg} ${color}`}>
                    {label}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default InstallmentTimeline;
