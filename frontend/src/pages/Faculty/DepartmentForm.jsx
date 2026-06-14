import React, { useState, useEffect } from 'react';
import Button from '../../components/Button';
import Input from '../../components/Input';

const DepartmentForm = ({ onSubmit, initialData, onClose }) => {
  const [form, setForm] = useState({ name: '', code: '', description: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || '',
        code: initialData.code || '',
        description: initialData.description || ''
      });
    }
  }, [initialData]);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Department name is required';
    if (!form.code.trim()) e.code = 'Department code is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    await onSubmit({
      name: form.name.trim(),
      code: form.code.trim(),
      description: form.description.trim() || undefined
    });
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-300">Department Name *</label>
        <Input
          placeholder="e.g. Computer Science"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        {errors.name && <p className="text-xs text-status-danger">{errors.name}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-300">Department Code *</label>
        <Input
          placeholder="e.g. CS"
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value })}
        />
        {errors.code && <p className="text-xs text-status-danger">{errors.code}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-300">Description</label>
        <textarea
          rows={2}
          placeholder="Optional description..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none glass-input resize-none"
        />
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
        <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? 'Saving...' : initialData ? 'Update Department' : 'Create Department'}
        </Button>
      </div>
    </form>
  );
};

export default DepartmentForm;
