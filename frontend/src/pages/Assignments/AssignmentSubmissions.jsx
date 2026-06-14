import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import assignmentService from '../../services/assignmentService';
import authService from '../../services/authService';

const AssignmentSubmissions = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = authService.getLocalUser() || {};
  const canGrade = ['ADMIN', 'SUPER_ADMIN', 'FACULTY'].includes(currentUser.role);

  const [submissions, setSubmissions] = useState([]);
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gradeModal, setGradeModal] = useState(null);
  const [gradeForm, setGradeForm] = useState({ marksAwarded: '', feedback: '' });
  const [gradeError, setGradeError] = useState('');
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    Promise.all([
      assignmentService.getSubmissions(id),
      import('../../services/apiClient').then((m) => m.default.get(`/assignments?status=ALL`))
    ]).then(([subs]) => {
      setSubmissions(subs || []);
      setLoading(false);
    });
  }, [id]);

  const handleGrade = async () => {
    if (!gradeForm.marksAwarded) {
      setGradeError('Marks are required.');
      return;
    }
    setGradeError('');
    try {
      const res = await assignmentService.gradeSubmission(id, gradeModal.student.id, gradeForm);
      if (res.success) {
        setAlert({ message: 'Submission graded successfully' });
        setGradeModal(null);
        setGradeForm({ marksAwarded: '', feedback: '' });
        const data = await assignmentService.getSubmissions(id);
        setSubmissions(data || []);
        setTimeout(() => setAlert(null), 3000);
      }
    } catch (err) {
      setGradeError(err.response?.data?.message || 'Failed to save grade.');
    }
  };

  const headers = [
    { key: 'rollNumber', label: 'Roll No.', render: (row) => row.student?.rollNumber || '—' },
    { key: 'name', label: 'Student', render: (row) => row.student?.user?.name || '—' },
    {
      key: 'submittedAt', label: 'Submitted',
      render: (row) => row.submittedAt ? new Date(row.submittedAt).toLocaleDateString() : (
        <span className="text-slate-500 text-xs">Pending</span>
      )
    },
    {
      key: 'marksAwarded', label: 'Marks',
      render: (row) => row.marksAwarded !== null && row.marksAwarded !== undefined
        ? <span className="text-status-success font-bold">{row.marksAwarded}</span>
        : <span className="text-slate-500 text-xs">Not graded</span>
    },
    { key: 'feedback', label: 'Feedback', render: (row) => row.feedback || '—' },
    { key: 'gradedBy', label: 'Graded By', render: (row) => row.grader?.name || '—' }
  ];

  const tableActions = canGrade ? (row) => (
    <button
      onClick={() => { setGradeModal(row); setGradeForm({ marksAwarded: row.marksAwarded || '', feedback: row.feedback || '' }); setGradeError(''); }}
      className="p-1.5 rounded bg-brand/10 hover:bg-brand text-brand-light hover:text-white transition-colors text-xs"
    >
      Grade
    </button>
  ) : null;

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/assignments')}
            className="p-2 rounded-lg bg-bg-surfaceLight hover:bg-slate-600 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white font-heading">Submissions</h1>
            <p className="text-xs text-slate-400">Assignment submission list and grading.</p>
          </div>
        </div>

        {alert && (
          <div className="flex gap-2.5 p-3 rounded-lg bg-status-success/15 border border-status-success/30 text-status-success text-sm">
            <CheckCircle size={18} className="shrink-0 mt-0.5" />
            <span>{alert.message}</span>
          </div>
        )}

        <Table
          headers={headers}
          data={submissions}
          loading={loading}
          actions={tableActions}
          emptyMessage="No submissions yet."
        />

        <Modal isOpen={!!gradeModal} onClose={() => setGradeModal(null)} title="Grade Submission">
          {gradeModal && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-slate-300">
                Grading submission for <strong className="text-white">{gradeModal.student?.user?.name}</strong>
              </p>
              {gradeError && (
                <p className="text-xs text-status-danger bg-status-danger/10 border border-status-danger/30 p-2 rounded-lg">{gradeError}</p>
              )}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-300">Marks Awarded *</label>
                <Input
                  type="number"
                  min="0"
                  placeholder="Enter marks"
                  value={gradeForm.marksAwarded}
                  onChange={(e) => setGradeForm({ ...gradeForm, marksAwarded: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-300">Feedback</label>
                <textarea
                  rows={3}
                  placeholder="Optional feedback..."
                  value={gradeForm.feedback}
                  onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none glass-input"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
                <Button variant="ghost" onClick={() => setGradeModal(null)}>Cancel</Button>
                <Button variant="primary" onClick={handleGrade}>Save Grade</Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </>
  );
};

export default AssignmentSubmissions;
