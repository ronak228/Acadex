import React from 'react';

const fmt = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

const ReceiptCard = ({ receipt }) => {
  if (!receipt) return null;
  const { receiptNumber, student, payment, installment, feeStructure, collectedBy, remarks, issuedAt } = receipt;

  const isCreditAdj = payment?.paymentMethod === 'CREDIT_ADJUSTMENT';

  return (
    <div className="bg-white text-slate-800 rounded-2xl shadow-xl border border-slate-200 p-8 max-w-[480px] w-full mx-auto print:shadow-none print:border-none print:rounded-none print:max-w-full print:p-0 print:mx-0 relative overflow-hidden">
      {/* Decorative top bar */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand to-indigo-400 print:hidden" />
      
      {/* Header */}
      <div className="flex items-start justify-between pb-6 border-b border-slate-100 mb-6">
        <div>
          <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center mb-3">
            <span className="text-white font-extrabold font-heading text-lg">A</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight font-heading">Acadex</h2>
          <p className="text-xs text-slate-500 font-medium">Payment Receipt</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Receipt No</p>
          <p className="text-sm font-bold text-slate-900 font-mono bg-slate-50 px-2 py-1 rounded inline-block">
            {receiptNumber}
          </p>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-3 mb-1">Date Paid</p>
          <p className="text-xs font-medium text-slate-700">
            {payment?.paymentDate
              ? new Date(payment.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
              : '—'}
          </p>
        </div>
      </div>

      {/* Amount Hero */}
      <div className="mb-8 flex flex-col items-center justify-center py-6 bg-slate-50/50 rounded-2xl border border-slate-100">
        <p className="text-xs text-slate-500 font-medium mb-1">Amount Paid</p>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight font-heading">
          {fmt(payment?.amountPaid || 0)}
        </h1>
        <div className="flex items-center gap-2 mt-3">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${
            isCreditAdj 
              ? 'bg-purple-100 text-purple-700 border-purple-200' 
              : 'bg-emerald-100 text-emerald-700 border-emerald-200'
          }`}>
            {payment?.paymentMethod?.replace('_', ' ')}
          </span>
          {payment?.transactionRef && (
            <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded">
              Ref: {payment.transactionRef}
            </span>
          )}
        </div>
      </div>

      {/* Bill To */}
      <div className="mb-6">
        <h3 className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-3">Billed To</h3>
        <div className="grid grid-cols-2 gap-y-4 gap-x-2">
          <div>
            <p className="text-sm font-bold text-slate-900">{student?.name}</p>
            <p className="text-xs text-slate-500 mt-0.5">Roll: {student?.rollNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-800">{student?.course}</p>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mb-8">
        <h3 className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-3">Description</h3>
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between p-3 bg-slate-50 border-b border-slate-200">
            <span className="text-xs font-semibold text-slate-600">Item</span>
            <span className="text-xs font-semibold text-slate-600">Total</span>
          </div>
          <div className="p-3 bg-white flex flex-col gap-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-bold text-slate-800">{feeStructure}</p>
                {installment && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    Installment: {installment.label}
                  </p>
                )}
              </div>
              <p className="text-sm font-bold text-slate-900">
                {fmt(installment ? installment.amount : payment?.amountPaid)}
              </p>
            </div>
            {isCreditAdj && (
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100">
                <p className="text-xs text-slate-500">Paid from existing credit balance</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-end justify-between pt-6 border-t border-slate-100">
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Collected By</p>
          <p className="text-xs font-semibold text-slate-700">{collectedBy}</p>
          {remarks && <p className="text-xs text-slate-500 mt-1 italic max-w-[200px]">{remarks}</p>}
        </div>
        <div className="text-right flex flex-col items-end">
          <div className="w-32 h-px bg-slate-200 mb-2 mt-4" />
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Authorized Signatory</p>
          <p className="text-[10px] text-slate-400 mt-2">
            Issued: {issuedAt ? new Date(issuedAt).toLocaleString('en-IN') : '—'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReceiptCard;
