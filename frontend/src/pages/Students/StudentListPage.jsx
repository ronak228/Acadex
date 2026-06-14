import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus, Eye, Edit2, ShieldX, UserCheck, Users, Download, X } from 'lucide-react';
import Table from '../../components/Table';
import Select from '../../components/Select';
import Button from '../../components/Button';
import Badge, { statusVariant } from '../../components/Badge';
import ConfirmDialog from '../../components/ConfirmDialog';
import PageHeader from '../../components/PageHeader';
import studentService from '../../services/studentService';
import authService from '../../services/authService';

/* ─── Debounce hook ──────────────────────────── */
const useDebounce = (value, delay = 300) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

/* ─── Alert Banner ───────────────────────────── */
const AlertBanner = ({ alert, onDismiss }) => {
  if (!alert) return null;
  const isSuccess = alert.type === 'success';
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium animate-fadeIn
      ${isSuccess
        ? 'bg-status-success/10 border-status-success/25 text-status-success'
        : 'bg-status-danger/10 border-status-danger/25 text-status-danger'}`}
    >
      <span className="flex-1">{alert.message}</span>
      <button onClick={onDismiss} className="opacity-70 hover:opacity-100 transition-opacity">
        <X size={14} />
      </button>
    </div>
  );
};

/* ─── Page ───────────────────────────────────── */
const StudentListPage = () => {
  const navigate = useNavigate();
  const currentUser = authService.getLocalUser() || { role: 'FACULTY' };
  const isReadOnly = currentUser.role === 'FACULTY';

  // Filters
  const [searchRaw, setSearchRaw]           = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedBatch, setSelectedBatch]   = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const search = useDebounce(searchRaw, 350);

  // Options
  const [courses, setCourses] = useState([]);
  const [batches, setBatches]  = useState([]);

  // Data
  const [students, setStudents] = useState([]);
  const [loading, setLoading]   = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit]             = useState(10);

  // UI state
  const [alert, setAlert]               = useState(null);
  const [confirm, setConfirm]           = useState(null); // { id, currentStatus }
  const [confirmLoading, setConfirmLoading] = useState(false);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

  // Fetch courses
  useEffect(() => {
    studentService.getCourses().then(data =>
      setCourses(data.map(c => ({ value: c.id, label: c.name })))
    );
  }, []);

  // Cascade batches
  useEffect(() => {
    studentService.getBatches(selectedCourse || null).then(data => {
      setBatches(data.map(b => ({ value: b.id, label: b.name })));
      setSelectedBatch('');
    });
  }, [selectedCourse]);

  // Fetch students
  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await studentService.getStudents({
        search, courseId: selectedCourse, batchId: selectedBatch, status: selectedStatus
      });
      setStudents(data);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCourse, selectedBatch, selectedStatus]);

  useEffect(() => {
    loadStudents();
    setCurrentPage(1);
  }, [loadStudents]);

  // Confirm toggle
  const openConfirm = (id, currentStatus) => setConfirm({ id, currentStatus });

  const handleToggleStatus = async () => {
    if (!confirm) return;
    setConfirmLoading(true);
    try {
      const nextStatus = !confirm.currentStatus;
      const res = await studentService.toggleStudentStatus(confirm.id, nextStatus);
      if (res.success) {
        showAlert('success', `Student successfully ${nextStatus ? 'activated' : 'deactivated'}.`);
        loadStudents();
      }
    } catch {
      showAlert('danger', 'Failed to update student status. Please try again.');
    } finally {
      setConfirmLoading(false);
      setConfirm(null);
    }
  };

  // Active filter count
  const activeFilters = [selectedCourse, selectedBatch, selectedStatus, searchRaw].filter(Boolean).length;

  const clearFilters = () => {
    setSearchRaw('');
    setSelectedCourse('');
    setSelectedBatch('');
    setSelectedStatus('');
  };

  // Table headers
  const tableHeaders = [
    { key: 'rollNumber', label: 'Roll No.', sortable: true, width: '110px' },
    {
      key: 'name',
      label: 'Student',
      sortable: true,
      render: row => (
        <div>
          <p className="font-semibold text-white">{row.user?.name || 'N/A'}</p>
          <p className="text-xs text-slate-500 mt-0.5">{row.user?.email}</p>
        </div>
      ),
    },
    { key: 'course', label: 'Course', render: row => row.course?.name || '—' },
    { key: 'batch',  label: 'Batch',  render: row => row.batch?.name  || '—' },
    {
      key: 'enrolledAt',
      label: 'Enrolled',
      render: row => (
        <span className="text-slate-400 text-xs">
          {new Date(row.enrolledAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      width: '90px',
      render: row => (
        <Badge variant={row.isActive ? 'success' : 'danger'} dot>
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  // Row actions
  const tableActions = row => (
    <>
      <Button
        variant="icon"
        size="sm"
        title="View Profile"
        onClick={() => navigate(`/students/${row.id}`)}
        className="text-slate-400 hover:text-white hover:bg-slate-700"
      >
        <Eye size={15} />
      </Button>
      {!isReadOnly && (
        <>
          <Button
            variant="icon"
            size="sm"
            title="Edit Profile"
            onClick={() => navigate(`/students/edit/${row.id}`)}
            className="text-brand-light hover:bg-brand/15"
          >
            <Edit2 size={15} />
          </Button>
          <Button
            variant="icon"
            size="sm"
            title={row.isActive ? 'Deactivate Student' : 'Activate Student'}
            onClick={() => openConfirm(row.id, row.isActive)}
            className={row.isActive
              ? 'text-status-danger hover:bg-status-danger/15'
              : 'text-status-success hover:bg-status-success/15'}
          >
            {row.isActive ? <ShieldX size={15} /> : <UserCheck size={15} />}
          </Button>
        </>
      )}
    </>
  );

  // Pagination
  const totalPages  = Math.ceil(students.length / limit) || 1;
  const paginatedData = students.slice((currentPage - 1) * limit, currentPage * limit);

  return (
    <>
      <div className="flex flex-col gap-6">

        {/* Page Header */}
        <PageHeader
          title="Learner Registry"
          subtitle="Manage student enrollment details, academic records, and batch assignments."
          actions={
            !isReadOnly && (
              <Button
                variant="primary"
                onClick={() => navigate('/students/add')}
              >
                <UserPlus size={15} />
                Add Student
              </Button>
            )
          }
        />

        {/* Alert */}
        <AlertBanner alert={alert} onDismiss={() => setAlert(null)} />

        {/* Filter Bar */}
        <div className="glass-card flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
            {/* Search */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Search</label>
              <div className="relative flex items-center">
                <Search size={14} className="absolute left-3 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Name, roll number, email..."
                  value={searchRaw}
                  onChange={e => setSearchRaw(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-lg text-sm glass-input"
                />
                {searchRaw && (
                  <button
                    onClick={() => setSearchRaw('')}
                    className="absolute right-3 text-slate-500 hover:text-slate-300"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            <Select
              label="Course"
              name="courseFilter"
              options={courses}
              value={selectedCourse}
              onChange={e => setSelectedCourse(e.target.value)}
              placeholder="All Courses"
            />
            <Select
              label="Batch"
              name="batchFilter"
              options={batches}
              value={selectedBatch}
              onChange={e => setSelectedBatch(e.target.value)}
              placeholder="All Batches"
              disabled={!selectedCourse}
            />
            <Select
              label="Status"
              name="statusFilter"
              options={[
                { value: 'active',   label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              placeholder="All Statuses"
            />
          </div>

          {/* Active filter count + clear */}
          {activeFilters > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="brand">{activeFilters} filter{activeFilters > 1 ? 's' : ''} active</Badge>
              <button
                onClick={clearFilters}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
              >
                <X size={11} /> Clear all
              </button>
            </div>
          )}
        </div>

        {/* Table */}
        <Table
          headers={tableHeaders}
          data={paginatedData}
          loading={loading}
          actions={tableActions}
          emptyMessage="No students match your search criteria"
          emptyIcon={Users}
          emptyAction={!isReadOnly ? { label: 'Add First Student', onClick: () => navigate('/students/add') } : undefined}
          pagination={{
            currentPage,
            totalPages,
            total: students.length,
            limit,
            onPageChange: p => setCurrentPage(p),
            onLimitChange: s => { setLimit(s); setCurrentPage(1); },
          }}
        />
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={handleToggleStatus}
        loading={confirmLoading}
        title={confirm?.currentStatus ? 'Deactivate Student?' : 'Activate Student?'}
        description={
          confirm?.currentStatus
            ? 'This will revoke the student\'s portal login access. They can be reactivated at any time.'
            : 'This will restore the student\'s portal login access.'
        }
        confirmLabel={confirm?.currentStatus ? 'Yes, Deactivate' : 'Yes, Activate'}
        variant={confirm?.currentStatus ? 'danger' : 'default'}
      />
    </>
  );
};

export default StudentListPage;
