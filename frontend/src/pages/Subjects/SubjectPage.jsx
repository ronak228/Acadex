import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, ToggleLeft, ToggleRight, CheckCircle, AlertCircle } from 'lucide-react';
import Table from '../../components/Table';
import Button from '../../components/Button';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import Select from '../../components/Select';
import ConfirmDialog from '../../components/ConfirmDialog';
import SubjectForm from './SubjectForm';
import subjectService from '../../services/subjectService';
import authService from '../../services/authService';
import apiClient from '../../services/apiClient';

const SubjectPage = () => {
  const currentUser = authService.getLocalUser() || {};
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role);

  const [subjects, setSubjects] = useState([]);
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [alert, setAlert] = useState(null);
  const [confirmToggle, setConfirmToggle] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    apiClient.get('/courses').then((r) => {
      const list = r.data.courses || r.data || [];
      setCourses(list.filter((c) => c.isActive));
    });
  }, []);

  const loadSubjects = async () => {
    setLoading(true);
    const params = {};
    if (filterCourse) params.courseId = filterCourse;
    if (search) params.search = search;
    const data = await subjectService.getSubjects(params);
    const list = Array.isArray(data) ? data : [];
    setSubjects(list);
    setLoading(false);
  };

  useEffect(() => {
    loadSubjects();
    setCurrentPage(1);
  }, [search, filterCourse]);

  const handleFormSubmit = async (formData) => {
    try {
      const res = editingSubject
        ? await subjectService.updateSubject(editingSubject.id, formData)
        : await subjectService.createSubject(formData);

      if (res.success) {
        setAlert({ type: 'success', message: res.message || (editingSubject ? 'Subject updated' : 'Subject created') });
        setIsFormOpen(false);
        setEditingSubject(null);
        loadSubjects();
        setTimeout(() => setAlert(null), 3000);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong. Please try again.';
      setAlert({ type: 'error', message: msg });
      setTimeout(() => setAlert(null), 4000);
    }
  };

  const openConfirmToggle = (subject) => {
    setConfirmToggle(subject);
  };

  const handleConfirmToggle = async () => {
    if (!confirmToggle) return;
    setConfirmLoading(true);
    try {
      const res = await subjectService.toggleSubjectStatus(confirmToggle.id);
      if (res.success) {
        setAlert({ message: res.message || `Subject ${confirmToggle.isActive ? 'deactivated' : 'activated'}` });
        loadSubjects();
        setTimeout(() => setAlert(null), 3000);
      }
    } finally {
      setConfirmLoading(false);
      setConfirmToggle(null);
    }
  };

  const headers = [
    { key: 'code', label: 'Code', sortable: true },
    { key: 'name', label: 'Subject Name', sortable: true },
    {
      key: 'course',
      label: 'Course',
      render: (row) => row.course ? `${row.course.name} (${row.course.code})` : '—'
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (row) => (
        <span
          className={`inline-flex px-2 py-0.5 text-xs font-bold rounded-full ${
            row.isActive
              ? 'bg-status-success/15 text-status-success'
              : 'bg-status-danger/15 text-status-danger'
          }`}
        >
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      )
    }
  ];

  const tableActions = isAdmin
    ? (row) => (
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => { setEditingSubject(row); setIsFormOpen(true); }}
            className="p-1.5 rounded bg-brand/10 hover:bg-brand text-brand-light hover:text-white transition-colors"
            title="Edit"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => openConfirmToggle(row)}
            className={`p-1.5 rounded transition-colors ${
              row.isActive
                ? 'bg-status-danger/10 hover:bg-status-danger text-status-danger hover:text-white'
                : 'bg-status-success/10 hover:bg-status-success text-status-success hover:text-white'
            }`}
            title={row.isActive ? 'Deactivate' : 'Activate'}
          >
            {row.isActive ? <ToggleLeft size={14} /> : <ToggleRight size={14} />}
          </button>
        </div>
      )
    : null;

  const totalPages = Math.ceil(subjects.length / limit) || 1;
  const paginatedData = subjects.slice((currentPage - 1) * limit, currentPage * limit);

  return (
    <>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Subjects"
          subtitle="Manage subjects per course. Subjects are used in timetables, syllabus, materials, and assignments."
          actions={isAdmin && (
            <Button variant="primary" onClick={() => { setEditingSubject(null); setIsFormOpen(true); }} className="flex items-center gap-2">
              <Plus size={16} />
              <span>New Subject</span>
            </Button>
          )}
        />

        {alert && (
          <div className={`flex gap-2.5 p-3 rounded-lg text-sm border ${alert.type === 'error' ? 'bg-status-danger/15 border-status-danger/30 text-status-danger' : 'bg-status-success/15 border-status-success/30 text-status-success'}`}>
            {alert.type === 'error' ? <AlertCircle size={18} className="shrink-0 mt-0.5" /> : <CheckCircle size={18} className="shrink-0 mt-0.5" />}
            <span>{alert.message}</span>
          </div>
        )}

        <div className="glass-card flex flex-col md:flex-row gap-4">
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-sm font-medium text-slate-300">Search</label>
            <div className="relative flex items-center">
              <Search size={16} className="absolute left-3 text-slate-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by name or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none glass-input"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5 w-full md:w-56">
            <label className="text-sm font-medium text-slate-300">Filter by Course</label>
            <Select value={filterCourse} onChange={(e) => setFilterCourse(e.target.value)}>
              <option value="">All courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </div>
        </div>

        <Table
          headers={headers}
          data={paginatedData}
          loading={loading}
          actions={tableActions}
          emptyMessage="No subjects found. Create a course first, then add subjects."
          pagination={{
            currentPage,
            totalPages,
            limit,
            onPageChange: setCurrentPage,
            onLimitChange: () => {}
          }}
        />

        <Modal
          isOpen={isFormOpen}
          onClose={() => { setIsFormOpen(false); setEditingSubject(null); }}
          title={editingSubject ? 'Edit Subject' : 'Create New Subject'}
        >
          <SubjectForm
            onSubmit={handleFormSubmit}
            initialData={editingSubject}
            onClose={() => { setIsFormOpen(false); setEditingSubject(null); }}
          />
        </Modal>

        <ConfirmDialog
          isOpen={!!confirmToggle}
          onClose={() => setConfirmToggle(null)}
          onConfirm={handleConfirmToggle}
          loading={confirmLoading}
          title={confirmToggle?.isActive ? 'Deactivate Subject?' : 'Activate Subject?'}
          description={confirmToggle ? `${confirmToggle.isActive ? 'Deactivate' : 'Activate'} subject "${confirmToggle.name}"?` : ''}
          confirmLabel={confirmToggle?.isActive ? 'Yes, Deactivate' : 'Yes, Activate'}
          variant={confirmToggle?.isActive ? 'danger' : 'default'}
        />
      </div>
    </>
  );
};

export default SubjectPage;
