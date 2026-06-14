import React, { useState, useEffect } from 'react';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import apiClient from '../../services/apiClient';

const SyllabusUnitForm = ({ onSubmit, initialData, onClose }) => {
  const [form, setForm] = useState({ courseId: '', subjectId: '', unitNumber: '', title: '', description: '' });
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiClient.get('/courses').then((r) => {
      const list = r.data.courses || r.data || [];
      setCourses(list.filter((c) => c.isActive));
    });
  }, []);

  useEffect(() => {
    if (!form.courseId) { setSubjects([]); return; }
    apiClient.get('/subjects', { params: { courseId: form.courseId } }).then((r) => {
      const list = r.data.subjects || r.data || [];
      setSubjects(list.filter((s) => s.isActive));
    });
  }, [form.courseId]);

  useEffect(() => {
    if (initialData) {
      setForm({
        courseId: initialData.courseId || '',
        subjectId: initialData.subjectId || '',
        unitNumber: initialData.unitNumber?.toString() || '',
        title: initialData.title || '',
        description: initialData.description || ''
      });
    }
  }, [initialData]);

  const validate = () => {
    const e = {};
    if (!form.courseId) e.courseId = 'Course is required';
    if (!form.subjectId) e.subjectId = 'Subject is required';
    if (!form.unitNumber || isNaN(Number(form.unitNumber))) e.unitNumber = 'Unit number is required';
    if (!form.title.trim()) e.title = 'Title is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await onSubmit({ ...form, unitNumber: Number(form.unitNumber) });
    } catch {
      // parent handles error display
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300">Course *</label>
          <Select
            value={form.courseId}
            onChange={(e) => setForm({ ...form, courseId: e.target.value, subjectId: '' })}
          >
            <option value="">Select course</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          {errors.courseId && <p className="text-xs text-status-danger">{errors.courseId}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300">Subject *</label>
          <Select
            value={form.subjectId}
            onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
            disabled={!form.courseId}
          >
            <option value="">Select subject</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
          {errors.subjectId && <p className="text-xs text-status-danger">{errors.subjectId}</p>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300">Unit No. *</label>
          <Input
            type="number"
            min="1"
            placeholder="1"
            value={form.unitNumber}
            onChange={(e) => setForm({ ...form, unitNumber: e.target.value })}
          />
          {errors.unitNumber && <p className="text-xs text-status-danger">{errors.unitNumber}</p>}
        </div>
        <div className="col-span-2 flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300">Title *</label>
          <Input
            placeholder="e.g. Introduction to Variables"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          {errors.title && <p className="text-xs text-status-danger">{errors.title}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-300">Description</label>
        <textarea
          rows={3}
          placeholder="Brief description of this unit..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none glass-input"
        />
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
        <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? 'Saving...' : initialData ? 'Update Unit' : 'Add Unit'}
        </Button>
      </div>
    </form>
  );
};

export default SyllabusUnitForm;
