import React, { useState, useEffect } from 'react';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import apiClient from '../../services/apiClient';

const AssignmentForm = ({ onSubmit, initialData, onClose }) => {
  const [form, setForm] = useState({
    title: '', description: '', batchId: '', subjectId: '', dueDate: '', maxMarks: '100'
  });
  const [batches, setBatches] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      apiClient.get('/batches'),
      apiClient.get('/subjects')
    ]).then(([bRes, sRes]) => {
      const bList = bRes.data.data || bRes.data || [];
      const sList = sRes.data.subjects || sRes.data || [];
      setBatches(bList.filter((b) => b.isActive));
      setSubjects(sList.filter((s) => s.isActive));
    });
  }, []);

  useEffect(() => {
    if (initialData) {
      setForm({
        title: initialData.title || '',
        description: initialData.description || '',
        batchId: initialData.batchId || '',
        subjectId: initialData.subjectId || '',
        dueDate: initialData.dueDate ? initialData.dueDate.split('T')[0] : '',
        maxMarks: initialData.maxMarks?.toString() || '100'
      });
    }
  }, [initialData]);

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.batchId) e.batchId = 'Batch is required';
    if (!form.subjectId) e.subjectId = 'Subject is required';
    if (!form.dueDate) e.dueDate = 'Due date is required';
    if (!form.maxMarks || isNaN(Number(form.maxMarks)) || Number(form.maxMarks) <= 0) {
      e.maxMarks = 'Max marks must be a positive number';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await onSubmit({ ...form, maxMarks: Number(form.maxMarks) });
    } catch {
      // parent handles error display
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-300">Title *</label>
        <Input placeholder="e.g. Assignment 1 – Arrays" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        {errors.title && <p className="text-xs text-status-danger">{errors.title}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300">Batch *</label>
          <Select value={form.batchId} onChange={(e) => setForm({ ...form, batchId: e.target.value })}>
            <option value="">Select batch</option>
            {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </Select>
          {errors.batchId && <p className="text-xs text-status-danger">{errors.batchId}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300">Subject *</label>
          <Select value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}>
            <option value="">Select subject</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
          </Select>
          {errors.subjectId && <p className="text-xs text-status-danger">{errors.subjectId}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300">Due Date *</label>
          <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          {errors.dueDate && <p className="text-xs text-status-danger">{errors.dueDate}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300">Max Marks *</label>
          <Input type="number" min="1" value={form.maxMarks} onChange={(e) => setForm({ ...form, maxMarks: e.target.value })} />
          {errors.maxMarks && <p className="text-xs text-status-danger">{errors.maxMarks}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-300">Description</label>
        <textarea
          rows={3}
          placeholder="Assignment instructions..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none glass-input"
        />
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
        <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? 'Saving...' : initialData ? 'Update Assignment' : 'Create Assignment'}
        </Button>
      </div>
    </form>
  );
};

export default AssignmentForm;
