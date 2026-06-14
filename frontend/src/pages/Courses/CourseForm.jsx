import React, { useState, useEffect } from 'react';
import Button from '../../components/Button';
import Input from '../../components/Input';

const CourseForm = ({ onSubmit, initialData, onClose }) => {
  const [form, setForm] = useState({
    name: '',
    code: '',
    durationMonths: '',
    fees: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || '',
        code: initialData.code || '',
        durationMonths: initialData.durationMonths?.toString() || '',
        fees: initialData.fees?.toString() || ''
      });
    }
  }, [initialData]);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Course name is required';
    if (!form.code.trim()) e.code = 'Course code is required';
    if (!form.durationMonths || isNaN(Number(form.durationMonths)) || Number(form.durationMonths) < 1)
      e.durationMonths = 'Duration must be a positive number';
    if (!form.fees || isNaN(Number(form.fees)) || Number(form.fees) < 0)
      e.fees = 'Fees must be a valid amount';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await onSubmit({
        name: form.name.trim(),
        code: form.code.trim(),
        durationMonths: Number(form.durationMonths),
        fees: Number(form.fees)
      });
    } catch {
      // parent handles error display
    } finally {
      setLoading(false);
    }
  };

  const field = (key, label, placeholder, type = 'text', extra = {}) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-300">{label}</label>
      <Input
        type={type}
        placeholder={placeholder}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        {...extra}
      />
      {errors[key] && <p className="text-xs text-status-danger">{errors[key]}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {field('name', 'Course Name *', 'e.g. Full Stack Web Development')}

      <div className="grid grid-cols-2 gap-4">
        {field('code', 'Course Code *', 'e.g. FSWD')}
        {field('durationMonths', 'Duration (months) *', '6', 'number', { min: 1 })}
      </div>

      {field('fees', 'Course Fees *', '0.00', 'number', { min: 0, step: '0.01' })}

      <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
        <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? 'Saving...' : initialData ? 'Update Course' : 'Create Course'}
        </Button>
      </div>
    </form>
  );
};

export default CourseForm;
