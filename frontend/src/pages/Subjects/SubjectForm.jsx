import React, { useState, useEffect } from 'react';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import apiClient from '../../services/apiClient';

const SubjectForm = ({ onSubmit, initialData, onClose }) => {
  const [form, setForm] = useState({ name: '', code: '', courseId: '' });
  const [courses, setCourses] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

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
        code: initialData.code || '',
        courseId: initialData.courseId || ''
      });
    }
  }, [initialData]);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Subject name is required';
    if (!form.code.trim()) e.code = 'Subject code is required';
    if (!form.courseId) e.courseId = 'Course is required';
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
        courseId: form.courseId
      });
    } catch {
      // parent handles error display
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-300">Course *</label>
        <Select
          value={form.courseId}
          onChange={(e) => setForm({ ...form, courseId: e.target.value })}
          disabled={!!initialData}
        >
          <option value="">Select course</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
          ))}
        </Select>
        {errors.courseId && <p className="text-xs text-status-danger">{errors.courseId}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-300">Subject Name *</label>
        <Input
          placeholder="e.g. Data Structures"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        {errors.name && <p className="text-xs text-status-danger">{errors.name}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-300">Subject Code *</label>
        <Input
          placeholder="e.g. DS101"
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
        />
        {errors.code && <p className="text-xs text-status-danger">{errors.code}</p>}
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
        <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? 'Saving...' : initialData ? 'Update Subject' : 'Create Subject'}
        </Button>
      </div>
    </form>
  );
};

export default SubjectForm;
