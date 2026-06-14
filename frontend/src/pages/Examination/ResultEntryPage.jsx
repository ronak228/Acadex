import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, CheckCircle, AlertCircle } from 'lucide-react';
import Button from '../../components/Button';
import ResultStatusBadge from '../../components/ResultStatusBadge';
import examService from '../../services/examService';
import resultService from '../../services/resultService';
import apiClient from '../../services/apiClient';

const ResultEntryPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const examData = await examService.getExamById(id);
      setExam(examData);

      const batchId = examData?.batchId;
      const courseId = examData?.courseId;

      const [studentsRes, existingResults] = await Promise.all([
        batchId
          ? apiClient.get('/students', { params: { batchId, isActive: 'true' } })
          : courseId
            ? apiClient.get('/students', { params: { courseId, isActive: 'true' } })
            : Promise.resolve({ data: [] }),
        resultService.getResultsByExam(id).catch(() => [])
      ]);

      const students = Array.isArray(studentsRes.data)
        ? studentsRes.data
        : studentsRes.data?.data || studentsRes.data?.students || [];

      const existingMap = {};
      (Array.isArray(existingResults) ? existingResults : []).forEach((r) => {
        existingMap[r.studentId] = r;
      });

      setRows(
        students.map((s) => ({
          studentId: s.id,
          rollNumber: s.rollNumber,
          name: s.user?.name || '—',
          marksObtained: existingMap[s.id] !== undefined
            ? String(Number(existingMap[s.id].marksObtained))
            : '',
          remarks: existingMap[s.id]?.remarks || ''
        }))
      );
      setLoading(false);
    };
    load();
  }, [id]);

  const computeStatus = (marks) => {
    if (!exam || marks === '' || isNaN(Number(marks))) return null;
    return Number(marks) >= exam.passingMarks ? 'PASS' : 'FAIL';
  };

  const updateRow = (idx, field, value) => {
    setRows((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
    setErrors((prev) => {
      const next = { ...prev };
      delete next[idx];
      return next;
    });
  };

  const validate = () => {
    const e = {};
    rows.forEach((row, idx) => {
      if (row.marksObtained === '') {
        e[idx] = 'Required';
        return;
      }
      const val = Number(row.marksObtained);
      if (isNaN(val) || val < 0 || val > exam.totalMarks) {
        e[idx] = `0 – ${exam.totalMarks}`;
      }
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    const results = rows.map((row) => ({
      studentId: row.studentId,
      marksObtained: Number(row.marksObtained),
      status: computeStatus(row.marksObtained),
      remarks: row.remarks || null
    }));
    try {
      const res = await resultService.saveBulkResults(id, results);
      if (res.success) {
        setAlert({ message: res.message || 'Results saved successfully!', type: 'success' });
        setTimeout(() => setAlert(null), 3000);
      } else {
        setAlert({ message: res.message || 'Failed to save results.', type: 'error' });
      }
    } catch (err) {
      setAlert({ message: err.response?.data?.message || 'Something went wrong. Please try again.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-12 rounded-lg bg-bg-surface animate-pulse" />)}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/exams')}
            className="p-2 rounded-lg bg-bg-surfaceLight hover:bg-slate-600 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-extrabold text-white truncate">Result Entry — {exam?.title}</h1>
            <p className="text-xs text-slate-400">
              Total: <strong className="text-white">{exam?.totalMarks}</strong> &nbsp;|&nbsp;
              Passing: <strong className="text-white">{exam?.passingMarks}</strong> &nbsp;|&nbsp;
              Date: {exam?.examDate ? new Date(exam.examDate).toLocaleDateString() : '—'}
            </p>
          </div>
          <Button
            variant="primary"
            onClick={handleSave}
            loading={saving}
            disabled={rows.length === 0}
            className="flex items-center gap-2 shrink-0"
          >
            <Save size={16} /> Save All
          </Button>
        </div>

        {alert && (
          <div className={`flex gap-2.5 p-3 rounded-lg text-sm border ${
            alert.type === 'success'
              ? 'bg-status-success/15 border-status-success/30 text-status-success'
              : 'bg-status-danger/15 border-status-danger/30 text-status-danger'
          }`}>
            {alert.type === 'success'
              ? <CheckCircle size={18} className="shrink-0 mt-0.5" />
              : <AlertCircle size={18} className="shrink-0 mt-0.5" />}
            <span>{alert.message}</span>
          </div>
        )}

        {rows.length === 0 ? (
          <div className="glass-card flex flex-col items-center justify-center py-12 gap-2">
            <p className="text-slate-400">No students found for this exam.</p>
            <p className="text-xs text-slate-500">Ensure students are enrolled in the exam's course or batch.</p>
          </div>
        ) : (
          <div className="glass-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/60">
                  {['#', 'Roll No', 'Student Name', 'Marks Obtained', 'Status', 'Remarks'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {rows.map((row, idx) => {
                  const status = computeStatus(row.marksObtained);
                  return (
                    <tr key={row.studentId} className="hover:bg-bg-surfaceLight/30 transition-colors">
                      <td className="px-4 py-3 text-slate-500 text-xs">{idx + 1}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs font-mono">{row.rollNumber}</td>
                      <td className="px-4 py-3 text-white font-medium">{row.name}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <input
                            type="number"
                            min="0"
                            max={exam?.totalMarks}
                            value={row.marksObtained}
                            onChange={(e) => updateRow(idx, 'marksObtained', e.target.value)}
                            className={`w-24 px-2.5 py-1.5 rounded-lg text-sm glass-input outline-none focus:ring-1 focus:ring-brand ${
                              errors[idx] ? 'ring-1 ring-status-danger' : ''
                            }`}
                            placeholder="—"
                          />
                          {errors[idx] && <p className="text-[10px] text-status-danger">{errors[idx]}</p>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {status ? <ResultStatusBadge status={status} /> : <span className="text-slate-600 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={row.remarks}
                          onChange={(e) => updateRow(idx, 'remarks', e.target.value)}
                          className="w-40 px-2.5 py-1.5 rounded-lg text-sm glass-input outline-none focus:ring-1 focus:ring-brand"
                          placeholder="Optional"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default ResultEntryPage;
