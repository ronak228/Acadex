import React, { useState, useEffect } from 'react';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import apiClient from '../../services/apiClient';

const MATERIAL_TYPES = ['PDF', 'LINK', 'VIDEO', 'NOTE'];

const MaterialForm = ({ onSubmit, initialData, onClose }) => {
  const [form, setForm] = useState({
    title: '', description: '', type: 'LINK', url: '', subjectId: '', batchId: ''
  });
  const [subjects, setSubjects] = useState([]);
  const [batches, setBatches] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      apiClient.get('/subjects'),
      apiClient.get('/batches')
    ]).then(([sRes, bRes]) => {
      const sList = sRes.data.subjects || sRes.data || [];
      const bList = bRes.data.data || bRes.data || [];
      setSubjects(sList.filter((s) => s.isActive));
      setBatches(bList.filter((b) => b.isActive));
    });
  }, []);

  useEffect(() => {
    if (initialData) {
      setForm({
        title: initialData.title || '',
        description: initialData.description || '',
        type: initialData.type || 'LINK',
        url: initialData.url || '',
        subjectId: initialData.subjectId || '',
        batchId: initialData.batchId || ''
      });
    }
  }, [initialData]);

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.url.trim()) e.url = 'URL or file path is required';
    if (!form.subjectId) e.subjectId = 'Subject is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const payload = { ...form };
    if (!payload.batchId) delete payload.batchId;
    try {
      await onSubmit(payload);
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
        <Input placeholder="e.g. Chapter 1 Notes" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        {errors.title && <p className="text-xs text-status-danger">{errors.title}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300">Type *</label>
          <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {MATERIAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
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

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-300">URL / Link *</label>
        <Input placeholder="https://..." value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
        {errors.url && <p className="text-xs text-status-danger">{errors.url}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-300">Batch (optional)</label>
        <Select value={form.batchId} onChange={(e) => setForm({ ...form, batchId: e.target.value })}>
          <option value="">All batches (subject-wide)</option>
          {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-300">Description</label>
        <textarea
          rows={2}
          placeholder="Brief description..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none glass-input"
        />
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
        <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? 'Saving...' : initialData ? 'Update Material' : 'Add Material'}
        </Button>
      </div>
    </form>
  );
};

export default MaterialForm;
