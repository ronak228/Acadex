import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, ClipboardList, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import Table from '../../components/Table';
import Button from '../../components/Button';
import PageHeader from '../../components/PageHeader';
import Input from '../../components/Input';
import Select from '../../components/Select';
import ConfirmDialog from '../../components/ConfirmDialog';
import ExamTypeBadge from '../../components/ExamTypeBadge';
import examService from '../../services/examService';
import authService from '../../services/authService';
import apiClient from '../../services/apiClient';

const EXAM_TYPES = ['INTERNAL', 'EXTERNAL', 'PRACTICAL'];

const ExamListPage = () => {
  const navigate = useNavigate();
  const currentUser = authService.getLocalUser() || {};
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role);

  const [exams, setExams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [filterCourse, setFilterCourse] = useState('');
  const [filterBatch, setFilterBatch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  useEffect(() => {
    apiClient.get('/courses').then((r) => {
      const list = r.data.data || r.data.courses || r.data || [];
      setCourses(list.filter((c) => c.isActive !== false));
    });
  }, []);

  useEffect(() => {
    if (filterCourse) {
      apiClient.get('/batches', { params: { courseId: filterCourse } }).then((r) => {
        const list = r.data.data || r.data || [];
        setBatches(list.filter((b) => b.isActive !== false));
      });
    } else {
      setBatches([]);
    }
    setFilterBatch('');
  }, [filterCourse]);

  const loadExams = async () => {
    setLoading(true);
    const params = {};
    if (filterCourse) params.courseId = filterCourse;
    if (filterBatch) params.batchId = filterBatch;
    if (filterType) params.examType = filterType;
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;
    const data = await examService.getExams(params);
    const list = data.data || data.exams || data || [];
    setExams(Array.isArray(list) ? list : []);
    setLoading(false);
  };

  useEffect(() => { loadExams(); }, [filterCourse, filterBatch, filterType, fromDate, toDate]);

  const showAlert = (message, type = 'success') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 3000);
  };

  const openConfirmDelete = (row) => {
    setConfirmDelete(row);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    setConfirmLoading(true);
    try {
      const res = await examService.deleteExam(confirmDelete.id);
      if (res.success) {
        showAlert('Exam deleted.');
        loadExams();
      }
    } finally {
      setConfirmLoading(false);
      setConfirmDelete(null);
    }
  };

  const headers = [
    {
      key: 'title',
      label: 'Title',
      sortable: true,
      render: (row) => (
        <button
          onClick={() => navigate(`/exams/${row.id}`)}
          className="text-brand-light hover:underline font-medium text-left"
        >
          {row.title}
        </button>
      )
    },
    { key: 'course', label: 'Course', render: (row) => row.course?.name || '—' },
    { key: 'batch', label: 'Batch', render: (row) => row.batch?.name || 'All Batches' },
    { key: 'examType', label: 'Type', render: (row) => <ExamTypeBadge type={row.examType} /> },
    { key: 'examDate', label: 'Date', sortable: true, render: (row) => new Date(row.examDate).toLocaleDateString() },
    { key: 'totalMarks', label: 'Total Marks' }
  ];

  const tableActions = (row) => (
    <div className="flex gap-2 justify-end">
      <button
        onClick={() => navigate(`/exams/${row.id}`)}
        className="p-1.5 rounded bg-bg-surfaceLight hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
        title="View Detail"
      >
        <Eye size={14} />
      </button>
      <button
        onClick={() => navigate(`/exams/${row.id}/results`)}
        className="p-1.5 rounded bg-brand/10 hover:bg-brand text-brand-light hover:text-white transition-colors"
        title="Enter / View Results"
      >
        <ClipboardList size={14} />
      </button>
      {isAdmin && (
        <button
          onClick={() => openConfirmDelete(row)}
          className="p-1.5 rounded bg-status-danger/10 hover:bg-status-danger text-status-danger hover:text-white transition-colors"
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );

  return (
    <>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Exams"
          subtitle="Manage all scheduled exams and enter results."
          actions={
            <Button variant="primary" onClick={() => navigate('/exams/create')} className="flex items-center gap-2">
              <Plus size={16} /> <span>Create Exam</span>
            </Button>
          }
        />

        {alert && (
          <div className={`flex gap-2.5 p-3 rounded-lg text-sm border ${
            alert.type === 'success'
              ? 'bg-status-success/15 border-status-success/30 text-status-success'
              : 'bg-status-danger/15 border-status-danger/30 text-status-danger'
          }`}>
            {alert.type === 'success' ? <CheckCircle size={18} className="shrink-0 mt-0.5" /> : <AlertCircle size={18} className="shrink-0 mt-0.5" />}
            <span>{alert.message}</span>
          </div>
        )}

        <div className="glass-card grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Course</label>
            <Select value={filterCourse} onChange={(e) => setFilterCourse(e.target.value)}>
              <option value="">All Courses</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Batch</label>
            <Select value={filterBatch} onChange={(e) => setFilterBatch(e.target.value)} disabled={!filterCourse}>
              <option value="">All Batches</option>
              {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Type</label>
            <Select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="">All Types</option>
              {EXAM_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>)}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">From Date</label>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">To Date</label>
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
        </div>

        <Table
          headers={headers}
          data={exams}
          loading={loading}
          actions={tableActions}
          emptyMessage="No exams found. Create your first exam."
        />

        <ConfirmDialog
          isOpen={!!confirmDelete}
          onClose={() => setConfirmDelete(null)}
          onConfirm={handleConfirmDelete}
          loading={confirmLoading}
          title="Delete Exam?"
          description={`Delete exam "${confirmDelete?.title}"? This action cannot be undone.`}
          confirmLabel="Yes, Delete"
          variant="danger"
        />
      </div>
    </>
  );
};

export default ExamListPage;
