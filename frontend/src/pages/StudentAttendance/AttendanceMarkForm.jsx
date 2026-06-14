import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle } from 'lucide-react';
import Button from '../../components/Button';
import Select from '../../components/Select';
import Input from '../../components/Input';
import AttendanceStatusBadge from '../../components/AttendanceStatusBadge';
import studentAttendanceService from '../../services/studentAttendanceService';
import batchService from '../../services/batchService';
import apiClient from '../../services/apiClient';

const STATUSES = ['PRESENT', 'ABSENT', 'HALF_DAY', 'ON_LEAVE'];

const AttendanceMarkForm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const fromBatchId = searchParams.get('batchId') || '';
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(fromBatchId);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [records, setRecords] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    apiClient.get('/batches').then((r) => {
      const list = r.data.data || r.data || [];
      setBatches(list.filter((b) => b.isActive));
    });
  }, []);

  useEffect(() => {
    if (!selectedBatch) { setStudents([]); setRecords({}); return; }
    setLoading(true);
    batchService.getBatchStudents(selectedBatch).then((data) => {
      setStudents(data || []);
      const init = {};
      (data || []).forEach((s) => { init[s.id] = { status: 'PRESENT', note: '' }; });
      setRecords(init);
      setLoading(false);
    });
  }, [selectedBatch]);

  const setStatus = (studentId, status) => {
    setRecords((prev) => ({ ...prev, [studentId]: { ...prev[studentId], status } }));
  };

  const setNote = (studentId, note) => {
    setRecords((prev) => ({ ...prev, [studentId]: { ...prev[studentId], note } }));
  };

  const markAll = (status) => {
    const updated = {};
    students.forEach((s) => { updated[s.id] = { ...records[s.id], status }; });
    setRecords(updated);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const payload = students.map((s) => ({
      studentId: s.id,
      status: records[s.id]?.status || 'PRESENT',
      note: records[s.id]?.note || null
    }));
    try {
      const res = await studentAttendanceService.bulkMark(selectedBatch, date, payload);
      if (res.success) {
        setAlert({ type: 'success', message: 'Attendance saved successfully' });
        setTimeout(() => setAlert(null), 3000);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong. Please try again.';
      setAlert({ type: 'error', message: msg });
      setTimeout(() => setAlert(null), 4000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-heading">Mark Student Attendance</h1>
          <p className="text-xs text-slate-400">Bulk mark attendance for all students in a batch.</p>
        </div>

        {alert && (
          <div className={`flex gap-2.5 p-3 rounded-lg text-sm border ${alert.type === 'error' ? 'bg-status-danger/15 border-status-danger/30 text-status-danger' : 'bg-status-success/15 border-status-success/30 text-status-success'}`}>
            {alert.type === 'error' ? <AlertCircle size={18} className="shrink-0 mt-0.5" /> : <CheckCircle size={18} className="shrink-0 mt-0.5" />}
            <span>{alert.message}</span>
          </div>
        )}

        <div className="glass-card flex flex-col md:flex-row gap-4">
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-sm font-medium text-slate-300">Batch *</label>
            <Select value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)}>
              <option value="">Select batch</option>
              {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Date *</label>
            <Input
              type="date"
              value={date}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        {loading && <p className="text-slate-400 text-sm">Loading students...</p>}

        {!loading && students.length > 0 && (
          <>
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-slate-400">Mark all as:</span>
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => markAll(s)}
                  className="px-3 py-1 rounded-full text-xs font-bold bg-bg-surfaceLight hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              {students.map((student) => (
                <div key={student.id} className="glass-card flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1">
                    <p className="font-semibold text-white text-sm">{student.user?.name}</p>
                    <p className="text-xs text-slate-400">{student.rollNumber}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {STATUSES.map((s) => (
                      <button
                        key={s}
                        onClick={() => setStatus(student.id, s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${
                          records[student.id]?.status === s
                            ? 'bg-brand text-white border-brand'
                            : 'bg-transparent text-slate-400 border-slate-700 hover:border-slate-500'
                        }`}
                      >
                        {s.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                  <div className="w-40">
                    <input
                      type="text"
                      placeholder="Note (optional)"
                      value={records[student.id]?.note || ''}
                      onChange={(e) => setNote(student.id, e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg text-xs outline-none glass-input"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Attendance'}
              </Button>
            </div>
          </>
        )}

        {!loading && selectedBatch && students.length === 0 && (
          <div className="text-center text-slate-500 text-sm py-10">No students enrolled in this batch.</div>
        )}
      </div>
    </>
  );
};

export default AttendanceMarkForm;
