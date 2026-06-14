import React, { useState, useEffect } from 'react';
import { Search, Receipt, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Table from '../../components/Table';
import Button from '../../components/Button';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import FeePaymentBadge from '../../components/FeePaymentBadge';
import feeService from '../../services/feeService';
import apiClient from '../../services/apiClient';

const fmt = (v) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

const PAYMENT_METHODS = ['CASH', 'BANK_TRANSFER', 'CHEQUE', 'ONLINE', 'UPI'];

const CollectForm = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState(1); // 1: search student, 2: select fee, 3: enter payment
  const [studentSearch, setStudentSearch] = useState('');
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentFees, setStudentFees] = useState([]);
  const [creditBalance, setCreditBalance] = useState(0);
  const [selectedFee, setSelectedFee] = useState(null);
  const [form, setForm] = useState({ installmentId: '', amountPaid: '', paymentMethod: 'CASH', transactionRef: '', remarks: '' });
  const [applyCredit, setApplyCredit] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  const searchStudents = async () => {
    if (!studentSearch.trim()) return;
    setSearching(true);
    try {
      const res = await apiClient.get('/students', { params: { search: studentSearch } });
      const list = res.data.students || res.data.data || res.data || [];
      setStudents(Array.isArray(list) ? list.slice(0, 10) : []);
    } catch {
      setStudents([]);
    } finally {
      setSearching(false);
    }
  };

  const selectStudent = async (student) => {
    setSelectedStudent(student);
    setLoading(true);
    try {
      const res = await feeService.getStudentFee(student.id);
      setStudentFees(res.data || []);
      setCreditBalance(parseFloat(res.creditBalance ?? 0));
      setStep(2);
    } catch {
      setStudentFees([]);
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const selectFee = (fee) => {
    setSelectedFee(fee);
    setForm((f) => ({ ...f, installmentId: '', amountPaid: '' }));
    setStep(3);
  };

  const fullyCoveredByCredit = applyCredit && parseFloat(form.amountPaid || 0) > 0 && creditBalance >= parseFloat(form.amountPaid || 0);

  const validate = () => {
    const e = {};
    if (fullyCoveredByCredit) { setErrors({}); return true; }
    if (!form.amountPaid || parseFloat(form.amountPaid) <= 0) e.amountPaid = 'Enter a valid amount.';
    if (!form.paymentMethod) e.paymentMethod = 'Select a payment method.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await feeService.collectFee({
        studentFeeId: selectedFee.id,
        installmentId: form.installmentId || undefined,
        amountPaid: fullyCoveredByCredit ? 0 : parseFloat(form.amountPaid),
        paymentMethod: fullyCoveredByCredit ? 'CREDIT_ADJUSTMENT' : form.paymentMethod,
        transactionRef: form.transactionRef || undefined,
        remarks: form.remarks || undefined,
        applyCredit
      });
      onSuccess('Payment recorded successfully.', res.data?.id);
    } catch (err) {
      setErrors({ submit: err.response?.data?.message || 'Payment failed.' });
    } finally {
      setLoading(false);
    }
  };

  const selectedInstallment = selectedFee?.feeStructure?.installments?.find((i) => i.id === form.installmentId);

  return (
    <div className="flex flex-col gap-4">
      {/* Step indicator */}
      <div className="relative mb-6 mt-3">
        {/* Track background */}
        <div className="absolute top-[18px] left-[16.67%] right-[16.67%] h-px bg-slate-800/80" />
        {/* Track progress fill */}
        <div
          className="absolute top-[18px] left-[16.67%] h-px bg-status-success/60 transition-[width] duration-500 ease-in-out"
          style={{ width: `${Math.max(0, (step - 1) * 33.33)}%` }}
        />
        <div className="grid grid-cols-3">
          {['Find Student', 'Select Fee', 'Record Payment'].map((label, i) => {
            const n = i + 1;
            const isActive = step === n;
            const isPast = step > n;
            return (
              <div key={label} className="flex flex-col items-center gap-2">
                <div className={`relative z-10 flex items-center justify-center rounded-full font-bold transition-all duration-300
                  ${isActive
                    ? 'w-9 h-9 text-sm bg-brand text-white shadow-lg shadow-brand/40 ring-4 ring-brand/20 scale-105'
                    : isPast
                    ? 'w-9 h-9 text-sm bg-bg-deep border-2 border-status-success/70 text-status-success'
                    : 'w-9 h-9 text-xs bg-bg-deep border-2 border-slate-700/80 text-slate-600'
                  }`}>
                  {isPast ? <CheckCircle size={15} strokeWidth={2.5} /> : n}
                </div>
                <div className="text-center leading-none space-y-1">
                  <p className={`text-[11px] font-semibold tracking-wide transition-colors
                    ${isActive ? 'text-white' : isPast ? 'text-slate-400' : 'text-slate-600'}`}>
                    {label}
                  </p>
                  <p className={`text-[9px] font-bold uppercase tracking-widest transition-colors
                    ${isActive ? 'text-brand-light' : isPast ? 'text-status-success/60' : 'text-slate-700'}`}>
                    {isActive ? 'In progress' : isPast ? 'Complete' : 'Upcoming'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 1: Search student */}
      {step === 1 && (
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by name or roll number..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchStudents()}
                className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none glass-input"
              />
            </div>
            <Button variant="primary" onClick={searchStudents} loading={searching}>Search</Button>
          </div>
          <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
            {students.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => selectStudent(s)}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-bg-deep/40 border border-slate-700/40 hover:border-brand/50 hover:bg-brand/5 transition-all text-left"
              >
                <div>
                  <p className="text-sm font-semibold text-white">{s.user?.name}</p>
                  <p className="text-xs text-slate-400">{s.rollNumber} · {s.course?.name}</p>
                </div>
              </button>
            ))}
            {students.length === 0 && studentSearch && !searching && (
              <p className="text-sm text-slate-500 text-center py-3">No students found.</p>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Select fee record */}
      {step === 2 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-brand/10 border border-brand/30">
            <div>
              <p className="text-sm font-bold text-white">{selectedStudent?.user?.name}</p>
              <p className="text-xs text-slate-400">{selectedStudent?.rollNumber} · {selectedStudent?.course?.name}</p>
            </div>
            {creditBalance > 0 && (
              <div className="text-right">
                <p className="text-xs text-slate-400">Credit Balance</p>
                <p className="text-sm font-bold text-status-success">{fmt(creditBalance)}</p>
              </div>
            )}
          </div>
          {loading ? (
            <p className="text-sm text-slate-400 text-center py-3">Loading fee records...</p>
          ) : studentFees.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-3">No fee records assigned.</p>
          ) : (
            studentFees.map((sf) => {
              const netPayable = parseFloat(sf.netPayable);
              const effectivePaid = (sf.payments || []).reduce((s, p) => s + parseFloat(p.amountPaid) + parseFloat(p.creditApplied || 0), 0);
              const isFullyPaid = netPayable <= 0 || effectivePaid >= netPayable - 0.001;
              const isPartial = !isFullyPaid && effectivePaid > 0;
              const hasCreditAdj = (sf.payments || []).some((p) => p.paymentMethod === 'CREDIT_ADJUSTMENT' || parseFloat(p.creditApplied || 0) > 0);
              const badge = isFullyPaid
                ? { label: hasCreditAdj ? 'Credit Paid' : 'Paid', cls: 'text-status-success bg-status-success/15 border-status-success/30' }
                : isPartial
                ? { label: 'Partial', cls: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30' }
                : { label: 'Unpaid', cls: 'text-slate-400 bg-slate-700/30 border-slate-600/30' };
              return (
                <button
                  key={sf.id}
                  type="button"
                  onClick={() => !isFullyPaid && selectFee(sf)}
                  disabled={isFullyPaid}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl bg-bg-deep/40 border transition-all text-left ${isFullyPaid ? 'border-slate-700/20 opacity-60 cursor-not-allowed' : 'border-slate-700/40 hover:border-brand/50 hover:bg-brand/5 cursor-pointer'}`}
                >
                  <div>
                    <p className="text-sm font-semibold text-white">{sf.feeStructure?.name}</p>
                    <p className="text-xs text-slate-400">{sf.feeStructure?.installments?.length || 0} installments</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${badge.cls}`}>{badge.label}</span>
                    <p className="text-sm font-bold text-brand-light">{fmt(netPayable)}</p>
                  </div>
                </button>
              );
            })
          )}
          <Button variant="outline" onClick={() => { setStep(1); setStudents([]); }}>Back</Button>
        </div>
      )}

      {/* Step 3: Enter payment */}
      {step === 3 && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {errors.submit && (
            <p className="text-xs text-status-danger bg-status-danger/10 p-2 rounded-lg">{errors.submit}</p>
          )}

          <div className="p-3 rounded-xl bg-brand/10 border border-brand/30 text-sm">
            <p className="font-bold text-white">{selectedStudent?.user?.name}</p>
            <p className="text-xs text-slate-400 mt-0.5">{selectedFee?.feeStructure?.name} · Net Payable: {fmt(selectedFee?.netPayable)}</p>
          </div>
          {creditBalance > 0 && (
            <div className="p-2.5 rounded-xl bg-status-success/10 border border-status-success/30 text-xs text-status-success flex items-center justify-between gap-3">
              <span>Credit balance available: <strong>{fmt(creditBalance)}</strong></span>
              <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={applyCredit}
                  onChange={(e) => setApplyCredit(e.target.checked)}
                  className="accent-status-success"
                />
                <span className="font-semibold">Apply Credit</span>
              </label>
            </div>
          )}
          {applyCredit && creditBalance > 0 && parseFloat(form.amountPaid) > 0 && (() => {
            const creditUsed = Math.min(creditBalance, parseFloat(form.amountPaid));
            const cashNeeded = Math.max(0, parseFloat(form.amountPaid) - creditUsed);
            return (
              <div className="p-2 rounded-lg bg-bg-deep/40 border border-slate-700 text-xs text-slate-300 flex flex-col gap-0.5">
                <span>Credit applied: <strong className="text-status-success">{fmt(creditUsed)}</strong></span>
                <span>Cash to collect: <strong className="text-white">{fmt(cashNeeded)}</strong></span>
              </div>
            );
          })()}

          {/* Installment picker */}
          {selectedFee?.feeStructure?.installments?.length > 0 && (() => {
            const totalAmount = parseFloat(selectedFee.feeStructure.totalAmount) || 1;
            const discountRatio = Math.min(1, parseFloat(selectedFee.netPayable) / totalAmount);
            const unpaidInsts = selectedFee.feeStructure.installments.filter((i) => {
              const netInstAmount = parseFloat(i.amount) * discountRatio;
              const paid = (selectedFee.payments || [])
                .filter((p) => p.installmentId === i.id)
                .reduce((s, p) => s + parseFloat(p.amountPaid) + parseFloat(p.creditApplied || 0), 0);
              return paid < netInstAmount - 0.001;
            });
            return (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-300">Installment (optional)</label>
                <select
                  value={form.installmentId}
                  onChange={(e) => {
                    const inst = unpaidInsts.find((i) => i.id === e.target.value);
                    if (!inst) { setForm((f) => ({ ...f, installmentId: e.target.value })); return; }
                    const netInstAmount = parseFloat((parseFloat(inst.amount) * discountRatio).toFixed(2));
                    const alreadyPaid = (selectedFee.payments || [])
                      .filter((p) => p.installmentId === inst.id)
                      .reduce((s, p) => s + parseFloat(p.amountPaid) + parseFloat(p.creditApplied || 0), 0);
                    const remaining = parseFloat(Math.max(0, netInstAmount - alreadyPaid).toFixed(2));
                    setForm((f) => ({ ...f, installmentId: e.target.value, amountPaid: String(remaining) }));
                  }}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none glass-input"
                >
                  <option value="">Select installment (or pay open amount)</option>
                  {unpaidInsts.map((i) => (
                    <option key={i.id} value={i.id}>{i.label} — {fmt(i.amount)} (due {new Date(i.dueDate).toLocaleDateString()})</option>
                  ))}
                </select>
                {unpaidInsts.length === 0 && (
                  <p className="text-xs text-status-success">All installments are fully paid.</p>
                )}
              </div>
            );
          })()}

          {fullyCoveredByCredit ? (
            <div className="p-3 rounded-xl bg-status-success/10 border border-status-success/30 text-sm text-status-success text-center font-semibold">
              Will be settled using available credit balance. No cash payment required.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-300">Amount Paid (₹) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={form.amountPaid}
                  onChange={(e) => setForm((f) => ({ ...f, amountPaid: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none glass-input"
                />
                {errors.amountPaid && <p className="text-xs text-status-danger">{errors.amountPaid}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-300">Payment Method *</label>
                <select
                  value={form.paymentMethod}
                  onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none glass-input"
                >
                  {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
                </select>
              </div>
            </div>
          )}

          {!fullyCoveredByCredit && ['BANK_TRANSFER', 'CHEQUE', 'ONLINE', 'UPI'].includes(form.paymentMethod) && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Transaction Reference</label>
              <input
                type="text"
                placeholder="UTR / Cheque no. / Ref."
                value={form.transactionRef}
                onChange={(e) => setForm((f) => ({ ...f, transactionRef: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none glass-input"
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Remarks</label>
            <textarea
              rows={2}
              placeholder="Optional notes..."
              value={form.remarks}
              onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none glass-input resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
            <Button variant="outline" type="button" onClick={() => setStep(2)}>Back</Button>
            <Button variant="primary" type="submit" loading={loading}>Record Payment</Button>
          </div>
        </form>
      )}
    </div>
  );
};

const FeeCollectionPage = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [totalPayments, setTotalPayments] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isCollectOpen, setIsCollectOpen] = useState(false);
  const [alert, setAlert] = useState(null);
  const [filters, setFilters] = useState({ from: '', to: '', method: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 15;

  const showAlert = (type, message, paymentId = null) => {
    setAlert({ type, message, paymentId });
    setTimeout(() => setAlert(null), 5000);
  };

  const loadPayments = async () => {
    setLoading(true);
    try {
      const params = { page: currentPage, limit };
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      if (filters.method) params.method = filters.method;
      const res = await feeService.getPayments(params);
      setPayments(res.data || []);
      setTotalPayments(res.total ?? 0);
    } catch {
      showAlert('error', 'Failed to load payments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPayments(); }, [currentPage, filters]);

  const headers = [
    { key: 'receiptNumber', label: 'Receipt No.', render: (row) => <span className="font-mono text-brand-light text-xs">{row.receiptNumber}</span> },
    { key: 'student', label: 'Student', render: (row) => row.studentFee?.student?.user?.name || '—' },
    { key: 'course', label: 'Course', render: (row) => row.studentFee?.student?.course?.name || '—' },
    { key: 'installment', label: 'Installment', render: (row) => row.installment?.label || 'Open' },
    { key: 'amountPaid', label: 'Amount', render: (row) => <span className="font-bold text-status-success">{fmt(row.amountPaid)}</span> },
    { key: 'paymentMethod', label: 'Method', render: (row) => row.paymentMethod?.replace('_', ' ') },
    { key: 'status', label: 'Status', render: (row) => <FeePaymentBadge status={row.status} /> },
    { key: 'paymentDate', label: 'Date', render: (row) => new Date(row.paymentDate).toLocaleDateString() },
    { key: 'collectedBy', label: 'Collected By', render: (row) => row.collector?.name || '—' }
  ];

  const tableActions = (row) => (
    <button
      onClick={() => navigate(`/fees/receipt/${row.id}`)}
      className="p-1.5 rounded bg-bg-surfaceLight hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
      title="View Receipt"
    >
      <Receipt size={14} />
    </button>
  );

  const totalPages = Math.ceil(totalPayments / limit) || 1;

  return (
    <>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Fee Collection"
          subtitle="Record payments and view transaction history."
          actions={
            <Button variant="primary" onClick={() => setIsCollectOpen(true)} className="flex items-center gap-2">
              <Receipt size={16} /> Collect Payment
            </Button>
          }
        />

        {alert && (
          <div className={`flex items-center gap-2.5 p-3 rounded-lg text-sm border ${alert.type === 'success' ? 'bg-status-success/15 border-status-success/30 text-status-success' : 'bg-status-danger/15 border-status-danger/30 text-status-danger'}`}>
            {alert.type === 'success' ? <CheckCircle size={18} className="shrink-0" /> : <AlertCircle size={18} className="shrink-0" />}
            <span className="flex-1">{alert.message}</span>
            {alert.paymentId && (
              <button
                onClick={() => navigate(`/fees/receipt/${alert.paymentId}`)}
                className="ml-2 px-3 py-1 text-xs font-semibold rounded-lg bg-status-success/20 hover:bg-status-success/30 border border-status-success/40 transition-colors shrink-0"
              >
                View Receipt
              </button>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="glass-card flex flex-col md:flex-row gap-4">
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-sm font-medium text-slate-300">From Date</label>
            <input type="date" value={filters.from} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none glass-input" />
          </div>
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-sm font-medium text-slate-300">To Date</label>
            <input type="date" value={filters.to} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none glass-input" />
          </div>
          <div className="flex flex-col gap-1.5 min-w-[160px]">
            <label className="text-sm font-medium text-slate-300">Method</label>
            <select value={filters.method} onChange={(e) => setFilters((f) => ({ ...f, method: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none glass-input">
              <option value="">All Methods</option>
              {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={() => setFilters({ from: '', to: '', method: '' })}>Clear</Button>
          </div>
        </div>

        <Table
          headers={headers}
          data={payments}
          loading={loading}
          actions={tableActions}
          emptyMessage="No payments recorded yet."
          pagination={{ currentPage, totalPages, limit, onPageChange: setCurrentPage, onLimitChange: () => {} }}
        />

        <Modal
          isOpen={isCollectOpen}
          onClose={() => setIsCollectOpen(false)}
          title="Collect Fee Payment"
          maxWidth="max-w-lg"
        >
          <CollectForm
            onClose={() => setIsCollectOpen(false)}
            onSuccess={(msg, paymentId) => {
              setIsCollectOpen(false);
              showAlert('success', msg, paymentId);
              loadPayments();
            }}
          />
        </Modal>
      </div>
    </>
  );
};

export default FeeCollectionPage;
