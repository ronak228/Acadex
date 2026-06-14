import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Edit2, ToggleLeft, ToggleRight, CheckCircle, AlertCircle } from 'lucide-react';
import Table from '../../components/Table';
import Button from '../../components/Button';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import Select from '../../components/Select';
import BatchForm from './BatchForm';
import batchService from '../../services/batchService';
import authService from '../../services/authService';
import apiClient from '../../services/apiClient';
import ConfirmDialog from '../../components/ConfirmDialog';

const BatchPage = () => {
  const navigate = useNavigate();
  const currentUser = authService.getLocalUser() || {};
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role);

  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCourseId, setFilterCourseId] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [alert, setAlert] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;
  const [confirm, setConfirm] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const loadBatches = async () => {
    setLoading(true);
    const params = {};
    if (filterCourseId) params.courseId = filterCourseId;
    if (filterActive !== '') params.isActive = filterActive;
    const data = await batchService.getBatches(params);
    const list = data.data || data || [];
    const filtered = search
      ? list.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()))
      : list;
    setBatches(filtered);
    setLoading(false);
  };

  useEffect(() => {
    apiClient.get('/courses').then((r) => {
      const list = r.data.courses || r.data || [];
      setCourses(list.filter((c) => c.isActive));
    });
  }, []);

  useEffect(() => {
    loadBatches();
    setCurrentPage(1);
  }, [search, filterCourseId, filterActive]);

  const handleFormSubmit = async (formData) => {
    try {
      const res = editingBatch
        ? await batchService.updateBatch(editingBatch.id, formData)
        : await batchService.createBatch(formData);
      if (res.success) {
        setAlert({ type: 'success', message: res.message });
        setIsFormOpen(false);
        setEditingBatch(null);
        loadBatches();
        setTimeout(() => setAlert(null), 3000);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong. Please try again.';
      setAlert({ type: 'error', message: msg });
      setTimeout(() => setAlert(null), 4000);
    }
  };

  const openToggleConfirm = (batch) => {
    setConfirm(batch);
  };

  const handleToggleConfirm = async () => {
    setConfirmLoading(true);
    try {
      const res = await batchService.toggleBatchStatus(confirm.id);
      if (res.success) {
        setAlert({ type: 'success', message: res.message });
        loadBatches();
        setTimeout(() => setAlert(null), 3000);
      }
    } finally {
      setConfirmLoading(false);
      setConfirm(null);
    }
  };

  const headers = [
    { key: 'name', label: 'Batch Name', sortable: true },
    { key: 'course', label: 'Course', render: (row) => row.course?.name || '—' },
    { key: 'faculty', label: 'Faculty', render: (row) => row.faculty?.user?.name || 'Unassigned' },
    { key: 'startDate', label: 'Start Date', render: (row) => new Date(row.startDate).toLocaleDateString() },
    { key: 'endDate', label: 'End Date', render: (row) => row.endDate ? new Date(row.endDate).toLocaleDateString() : 'Ongoing' },
    {
      key: 'isActive', label: 'Status',
      render: (row) => (
        <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded-full ${row.isActive ? 'bg-status-success/15 text-status-success' : 'bg-status-danger/15 text-status-danger'}`}>
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      )
    }
  ];

  const tableActions = (row) => (
    <div className="flex gap-2 justify-end">
      <button
        onClick={() => navigate(`/batches/${row.id}`)}
        className="p-1.5 rounded bg-bg-surfaceLight hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
        title="View Detail"
      >
        <Eye size={14} />
      </button>
      {isAdmin && (
        <>
          <button
            onClick={() => { setEditingBatch(row); setIsFormOpen(true); }}
            className="p-1.5 rounded bg-brand/10 hover:bg-brand text-brand-light hover:text-white transition-colors"
            title="Edit"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => openToggleConfirm(row)}
            className={`p-1.5 rounded transition-colors ${row.isActive ? 'bg-status-danger/10 hover:bg-status-danger text-status-danger hover:text-white' : 'bg-status-success/10 hover:bg-status-success text-status-success hover:text-white'}`}
            title={row.isActive ? 'Deactivate' : 'Activate'}
          >
            {row.isActive ? <ToggleLeft size={14} /> : <ToggleRight size={14} />}
          </button>
        </>
      )}
    </div>
  );

  const totalPages = Math.ceil(batches.length / limit) || 1;
  const paginatedData = batches.slice((currentPage - 1) * limit, currentPage * limit);

  return (
    <>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Batch Management"
          subtitle="Manage student batches across courses."
          actions={isAdmin && (
            <Button variant="primary" onClick={() => { setEditingBatch(null); setIsFormOpen(true); }} className="flex items-center gap-2">
              <Plus size={16} /> <span>New Batch</span>
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
          <div className="flex-1 flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Search</label>
            <div className="relative flex items-center">
              <Search size={16} className="absolute left-3 text-slate-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by batch name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none glass-input"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5 min-w-[180px]">
            <label className="text-sm font-medium text-slate-300">Course</label>
            <Select value={filterCourseId} onChange={(e) => setFilterCourseId(e.target.value)}>
              <option value="">All Courses</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5 min-w-[140px]">
            <label className="text-sm font-medium text-slate-300">Status</label>
            <Select value={filterActive} onChange={(e) => setFilterActive(e.target.value)}>
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </Select>
          </div>
        </div>

        <Table
          headers={headers}
          data={paginatedData}
          loading={loading}
          actions={tableActions}
          emptyMessage="No batches found."
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
          onClose={() => { setIsFormOpen(false); setEditingBatch(null); }}
          title={editingBatch ? 'Edit Batch' : 'Create New Batch'}
        >
          <BatchForm
            onSubmit={handleFormSubmit}
            initialData={editingBatch}
            onClose={() => { setIsFormOpen(false); setEditingBatch(null); }}
          />
        </Modal>

        <ConfirmDialog
          isOpen={!!confirm}
          onClose={() => setConfirm(null)}
          onConfirm={handleToggleConfirm}
          loading={confirmLoading}
          title={confirm?.isActive ? 'Deactivate Batch?' : 'Activate Batch?'}
          description={confirm ? `${confirm.isActive ? 'Deactivate' : 'Activate'} batch "${confirm.name}"?` : ''}
          confirmLabel={confirm?.isActive ? 'Yes, Deactivate' : 'Yes, Activate'}
          variant={confirm?.isActive ? 'danger' : 'default'}
        />
      </div>
    </>
  );
};

export default BatchPage;
