import React, { useState, useEffect } from 'react';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import apiClient from '../../services/apiClient';

const BatchForm = ({ onSubmit, initialData, onClose }) => {
  const [form, setForm] = useState({
    name: '',
    courseId: '',
    startDate: '',
    endDate: '',
    facultyId: ''
  });
  const [courses, setCourses] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      apiClient.get('/courses'),
      apiClient.get('/faculty')
    ]).then(([coursesRes, facultyRes]) => {
      const courseData = coursesRes.data.courses || coursesRes.data || [];
      const facultyData = facultyRes.data.faculty || facultyRes.data || [];
      setCourses(courseData.filter((c) => c.isActive));
      setFaculty(facultyData.filter((f) => f.isActive));
    });
  }, []);

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || '',
        courseId: initialData.courseId || '',
        startDate: initialData.startDate ? initialData.startDate.split('T')[0] : '',
        endDate: initialData.endDate ? initialData.endDate.split('T')[0] : '',
        facultyId: initialData.facultyId || ''
      });
    }
  }, [initialData]);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Batch name is required';
    if (!form.courseId) e.courseId = 'Course is required';
    if (!form.startDate) e.startDate = 'Start date is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const payload = { ...form };
    if (!payload.endDate) delete payload.endDate;
    if (!payload.facultyId) delete payload.facultyId;
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
        <label className="text-sm font-medium text-slate-300">Batch Name *</label>
        <Input
          placeholder="e.g. Batch A – Morning"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        {errors.name && <p className="text-xs text-status-danger">{errors.name}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-300">Course *</label>
        <Select
          value={form.courseId}
          onChange={(e) => setForm({ ...form, courseId: e.target.value })}
        >
          <option value="">Select course</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
          ))}
        </Select>
        {errors.courseId && <p className="text-xs text-status-danger">{errors.courseId}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-300">Assigned Faculty</label>
        <Select
          value={form.facultyId}
          onChange={(e) => setForm({ ...form, facultyId: e.target.value })}
        >
          <option value="">None (assign later)</option>
          {faculty.map((f) => (
            <option key={f.id} value={f.id}>{f.user?.name} – {f.designation}</option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300">Start Date *</label>
          <Input
            type="date"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
          />
          {errors.startDate && <p className="text-xs text-status-danger">{errors.startDate}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300">End Date</label>
          <Input
            type="date"
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
        <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? 'Saving...' : initialData ? 'Update Batch' : 'Create Batch'}
        </Button>
      </div>
    </form>
  );
};

export default BatchForm;
