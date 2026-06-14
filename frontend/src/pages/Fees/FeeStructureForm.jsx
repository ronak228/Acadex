import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import Button from '../../components/Button';
import Input from '../../components/Input';
import apiClient from '../../services/apiClient';

const FREQUENCIES = [
  { value: 'ONE_TIME', label: 'One Time' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'ANNUALLY', label: 'Annually' },
  { value: 'CUSTOM', label: 'Custom' }
];

const emptyInstallment = () => ({ label: '', amount: '', dueDate: '' });

const FeeStructureForm = ({ onSubmit, initialData, onClose }) => {
  const [form, setForm] = useState({ name: '', courseId: '', totalAmount: '', frequency: 'ONE_TIME' });
  const [installments, setInstallments] = useState([emptyInstallment()]);
  const [courses, setCourses] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const isEditing = !!initialData;

  useEffect(() => {
    apiClient.get('/courses').then((r) => {
      const list = r.data.courses || r.data || [];
      setCourses(list.filter((c) => c.isActive));
    });
  }, []);

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || '',
        courseId: initialData.courseId || '',
        totalAmount: String(initialData.totalAmount || ''),
        frequency: initialData.frequency || 'ONE_TIME'
      });
      if (initialData.installments?.length > 0) {
        setInstallments(
          initialData.installments.map((i) => ({
            id: i.id,
            label: i.label,
            amount: String(i.amount),
            dueDate: i.dueDate ? i.dueDate.split('T')[0] : ''
          }))
        );
      }
    }
  }, [initialData]);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required.';
    if (!form.courseId && !isEditing) e.courseId = 'Course is required.';
    if (!form.totalAmount || parseFloat(form.totalAmount) <= 0) e.totalAmount = 'Total amount must be positive.';

    if (!isEditing) {
      const instTotal = installments.reduce((s, i) => s + parseFloat(i.amount || 0), 0);
      const structTotal = parseFloat(form.totalAmount || 0);
      installments.forEach((inst, idx) => {
        if (!inst.label.trim()) e[`inst_label_${idx}`] = 'Label required.';
        if (!inst.amount || parseFloat(inst.amount) <= 0) e[`inst_amount_${idx}`] = 'Amount must be positive.';
        if (!inst.dueDate) e[`inst_date_${idx}`] = 'Due date required.';
      });
      if (structTotal > 0 && Math.abs(instTotal - structTotal) > 0.01) {
        e.installments = `Installment total (₹${instTotal.toFixed(2)}) must equal structure total (₹${structTotal.toFixed(2)}).`;
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (isEditing) {
        await onSubmit({
          name: form.name,
          totalAmount: parseFloat(form.totalAmount),
          frequency: form.frequency
        });
      } else {
        await onSubmit({
          name: form.name,
          courseId: form.courseId,
          totalAmount: parseFloat(form.totalAmount),
          frequency: form.frequency,
          installments: installments.map((inst, idx) => ({
            installmentNo: idx + 1,
            label: inst.label,
            amount: parseFloat(inst.amount),
            dueDate: inst.dueDate
          }))
        });
      }
    } catch (err) {
      setErrors({ submit: err.response?.data?.message || 'Operation failed.' });
      setLoading(false);
    }
  };

  const addInstallmentRow = () => setInstallments([...installments, emptyInstallment()]);
  const removeInstallmentRow = (idx) => setInstallments(installments.filter((_, i) => i !== idx));
  const updateInstallment = (idx, field, value) => {
    const next = [...installments];
    next[idx] = { ...next[idx], [field]: value };
    setInstallments(next);
  };

  const instTotal = installments.reduce((s, i) => s + parseFloat(i.amount || 0), 0);
  const structTotal = parseFloat(form.totalAmount || 0);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {errors.submit && (
        <p className="text-xs text-status-danger bg-status-danger/10 p-2 rounded-lg">{errors.submit}</p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300">Structure Name *</label>
          <Input placeholder="e.g. Annual Tuition 2026" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          {errors.name && <p className="text-xs text-status-danger">{errors.name}</p>}
        </div>

        {!isEditing && (
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Course *</label>
            <select
              value={form.courseId}
              onChange={(e) => setForm({ ...form, courseId: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none glass-input"
            >
              <option value="">Select course</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
            </select>
            {errors.courseId && <p className="text-xs text-status-danger">{errors.courseId}</p>}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300">Total Amount (₹) *</label>
          <Input type="number" min="0" step="0.01" placeholder="50000" value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: e.target.value })} />
          {errors.totalAmount && <p className="text-xs text-status-danger">{errors.totalAmount}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300">Frequency *</label>
          <select
            value={form.frequency}
            onChange={(e) => setForm({ ...form, frequency: e.target.value })}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none glass-input"
          >
            {FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
      </div>

      {/* Installments — only on create */}
      {!isEditing && (
        <div className="flex flex-col gap-3 border-t border-slate-800 pt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-300">Installments</p>
            <div className="flex items-center gap-3">
              {structTotal > 0 && (
                <span className={`text-xs font-semibold ${Math.abs(instTotal - structTotal) < 0.01 ? 'text-status-success' : 'text-status-danger'}`}>
                  ₹{instTotal.toFixed(2)} / ₹{structTotal.toFixed(2)}
                </span>
              )}
              <button type="button" onClick={addInstallmentRow} className="flex items-center gap-1 text-xs text-brand-light hover:text-white transition-colors">
                <Plus size={13} /> Add
              </button>
            </div>
          </div>

          {errors.installments && (
            <p className="text-xs text-status-danger">{errors.installments}</p>
          )}

          {installments.map((inst, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-bg-deep/40 border border-slate-700/40 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">#{idx + 1}</p>
                {installments.length > 1 && (
                  <button type="button" onClick={() => removeInstallmentRow(idx)} className="text-status-danger hover:text-red-400 transition-colors">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400">Label</label>
                  <input
                    type="text"
                    placeholder="Term 1"
                    value={inst.label}
                    onChange={(e) => updateInstallment(idx, 'label', e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg text-xs outline-none glass-input"
                  />
                  {errors[`inst_label_${idx}`] && <p className="text-[10px] text-status-danger">{errors[`inst_label_${idx}`]}</p>}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400">Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={inst.amount}
                    onChange={(e) => updateInstallment(idx, 'amount', e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg text-xs outline-none glass-input"
                  />
                  {errors[`inst_amount_${idx}`] && <p className="text-[10px] text-status-danger">{errors[`inst_amount_${idx}`]}</p>}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400">Due Date</label>
                  <input
                    type="date"
                    value={inst.dueDate}
                    onChange={(e) => updateInstallment(idx, 'dueDate', e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg text-xs outline-none glass-input"
                  />
                  {errors[`inst_date_${idx}`] && <p className="text-[10px] text-status-danger">{errors[`inst_date_${idx}`]}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
        <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
        <Button variant="primary" type="submit" loading={loading}>
          {isEditing ? 'Update Structure' : 'Create Structure'}
        </Button>
      </div>
    </form>
  );
};

export default FeeStructureForm;
