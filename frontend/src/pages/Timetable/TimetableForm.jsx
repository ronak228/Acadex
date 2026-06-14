import React, { useState, useEffect } from 'react';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import apiClient from '../../services/apiClient';

const DAYS = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' }
];

const TimetableForm = ({ onSubmit, initialData, batchId, onClose }) => {
  const [form, setForm] = useState({
    batchId: batchId || '',
    subjectId: '',
    facultyId: '',
    dayOfWeek: '',
    startTime: '',
    endTime: '',
    room: ''
  });
  const [batches, setBatches] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      apiClient.get('/batches'),
      apiClient.get('/faculty')
    ]).then(([bRes, fRes]) => {
      const batchList = bRes.data.data || bRes.data || [];
      const facultyList = fRes.data.faculty || fRes.data || [];
      setBatches(batchList.filter((b) => b.isActive));
      setFaculty(facultyList.filter((f) => f.isActive));
    });
  }, []);

  useEffect(() => {
    const bid = form.batchId;
    if (!bid) { setSubjects([]); return; }
    apiClient.get('/batches/' + bid).then((r) => {
      const courseId = r.data.data?.courseId;
      if (courseId) {
        apiClient.get('/subjects', { params: { courseId } }).then((sr) => {
          const list = sr.data.subjects || sr.data || [];
          setSubjects(list.filter((s) => s.isActive));
        });
      }
    });
  }, [form.batchId]);

  useEffect(() => {
    if (initialData) {
      setForm({
        batchId: initialData.batchId || batchId || '',
        subjectId: initialData.subjectId || '',
        facultyId: initialData.facultyId || '',
        dayOfWeek: initialData.dayOfWeek?.toString() || '',
        startTime: initialData.startTime || '',
        endTime: initialData.endTime || '',
        room: initialData.room || ''
      });
    }
  }, [initialData]);

  const validate = () => {
    const e = {};
    if (!form.batchId) e.batchId = 'Batch is required';
    if (!form.subjectId) e.subjectId = 'Subject is required';
    if (!form.facultyId) e.facultyId = 'Faculty is required';
    if (!form.dayOfWeek) e.dayOfWeek = 'Day is required';
    if (!form.startTime) e.startTime = 'Start time is required';
    if (!form.endTime) e.endTime = 'End time is required';
    if (form.startTime && form.endTime && form.startTime >= form.endTime) {
      e.endTime = 'End time must be after start time';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await onSubmit({ ...form, dayOfWeek: Number(form.dayOfWeek) });
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
          <label className="text-sm font-medium text-slate-300">Batch *</label>
          <Select
            value={form.batchId}
            onChange={(e) => setForm({ ...form, batchId: e.target.value, subjectId: '' })}
            disabled={!!batchId}
          >
            <option value="">Select batch</option>
            {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </Select>
          {errors.batchId && <p className="text-xs text-status-danger">{errors.batchId}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300">Subject *</label>
          <Select
            value={form.subjectId}
            onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
          >
            <option value="">Select subject</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
          </Select>
          {errors.subjectId && <p className="text-xs text-status-danger">{errors.subjectId}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300">Faculty *</label>
          <Select value={form.facultyId} onChange={(e) => setForm({ ...form, facultyId: e.target.value })}>
            <option value="">Select faculty</option>
            {faculty.map((f) => <option key={f.id} value={f.id}>{f.user?.name}</option>)}
          </Select>
          {errors.facultyId && <p className="text-xs text-status-danger">{errors.facultyId}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300">Day *</label>
          <Select value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })}>
            <option value="">Select day</option>
            {DAYS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </Select>
          {errors.dayOfWeek && <p className="text-xs text-status-danger">{errors.dayOfWeek}</p>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300">Start Time *</label>
          <Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
          {errors.startTime && <p className="text-xs text-status-danger">{errors.startTime}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300">End Time *</label>
          <Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
          {errors.endTime && <p className="text-xs text-status-danger">{errors.endTime}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300">Room</label>
          <Input placeholder="e.g. Room 101" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
        <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? 'Saving...' : initialData ? 'Update Slot' : 'Add Slot'}
        </Button>
      </div>
    </form>
  );
};

export default TimetableForm;
