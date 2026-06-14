import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Edit2, Send, CheckCircle, AlertCircle, Lock, X } from 'lucide-react';
import Table from '../../components/Table';
import Button from '../../components/Button';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import Select from '../../components/Select';
import ConfirmDialog from '../../components/ConfirmDialog';
import AssignmentStatusBadge from '../../components/AssignmentStatusBadge';
import AssignmentForm from './AssignmentForm';
import assignmentService from '../../services/assignmentService';
import authService from '../../services/authService';
import apiClient from '../../services/apiClient';

const AssignmentPage = () => {
  const navigate = useNavigate();
  const currentUser = authService.getLocalUser() || {};
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role);
  const canManage = isAdmin || currentUser.role === 'FACULTY';
  const isStudent = currentUser.role === 'STUDENT';

  const [assignments, setAssignments] = useState([]);
  const [batches, setBatches] = useState([]);
  const [filterBatch, setFilterBatch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [alert, setAlert] = useState(null);

  // Confirmation states
  const [confirmPublish, setConfirmPublish] = useState(null);
  const [confirmCloseAction, setConfirmCloseAction] = useState(null);
  const [confirmSubmit, setConfirmSubmit] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  useEffect(() => {
    apiClient.get('/batches').then((r) => {
      const list = r.data.data || r.data || [];
      setBatches(list.filter((b) => b.isActive));
    });
  }, []);

  const loadAssignments = async () => {
    setLoading(true);
    const params = {};
    if (filterBatch) params.batchId = filterBatch;
    if (filterStatus) params.status = filterStatus;
    const data = await assignmentService.getAssignments(params);
    setAssignments(data || []);
    setLoading(false);
  };

  useEffect(() => { loadAssignments(); }, [filterBatch, filterStatus]);

  const handleFormSubmit = async (formData) => {
    try {
      const res = editingAssignment
        ? await assignmentService.updateAssignment(editingAssignment.id, formData)
        : await assignmentService.createAssignment(formData);
      if (res.success) {
        setAlert({ type: 'success', message: res.message });
        setIsFormOpen(false);
        setEditingAssignment(null);
        loadAssignments();
        setTimeout(() => setAlert(null), 3000);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong. Please try again.';
      setAlert({ type: 'error', message: msg });
      setTimeout(() => setAlert(null), 4000);
    }
  };

  const openConfirmPublish = (assignment) => setConfirmPublish(assignment);
  const handleConfirmPublish = async () => {
    if (!confirmPublish) return;
    setConfirmLoading(true);
    try {
      const res = await assignmentService.publishAssignment(confirmPublish.id);
      if (res.success) {
        setAlert({ message: res.message });
        loadAssignments();
        setTimeout(() => setAlert(null), 3000);
      }
    } finally {
      setConfirmLoading(false);
      setConfirmPublish(null);
    }
  };

  const openConfirmClose = (assignment) => setConfirmCloseAction(assignment);
  const handleConfirmClose = async () => {
    if (!confirmCloseAction) return;
    setConfirmLoading(true);
    try {
      const res = await assignmentService.closeAssignment(confirmCloseAction.id);
      setAlert({ message: res.message || 'Assignment closed.' });
      loadAssignments();
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to close assignment.' });
    } finally {
      setConfirmLoading(false);
      setConfirmCloseAction(null);
      setTimeout(() => setAlert(null), 4000);
    }
  };

  const openConfirmSubmit = (assignmentId) => setConfirmSubmit(assignmentId);
  const handleConfirmSubmit = async () => {
    if (!confirmSubmit) return;
    setConfirmLoading(true);
    try {
      const res = await assignmentService.submitAssignment(confirmSubmit);
      if (res.success) {
        setAlert({ message: 'Assignment submitted' });
        loadAssignments();
        setTimeout(() => setAlert(null), 3000);
      }
    } finally {
      setConfirmLoading(false);
      setConfirmSubmit(null);
    }
  };

  const headers = [
    { key: 'title', label: 'Title', sortable: true },
    { key: 'batch', label: 'Batch', render: (row) => row.batch?.name || '—' },
    { key: 'subject', label: 'Subject', render: (row) => row.subject?.name || '—' },
    { key: 'dueDate', label: 'Due Date', render: (row) => new Date(row.dueDate).toLocaleDateString() },
    { key: 'maxMarks', label: 'Max Marks' },
    { key: 'status', label: 'Status', render: (row) => <AssignmentStatusBadge status={row.status} /> },
    { key: '_count', label: 'Submissions', render: (row) => row._count?.submissions ?? '—' }
  ];

  const tableActions = (row) => (
    <div className="flex gap-2 justify-end">
      {canManage && (
        <>
          <button
            onClick={() => navigate(`/assignments/${row.id}/submissions`)}
            className="p-1.5 rounded bg-bg-surfaceLight hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
            title="View Submissions"
          >
            <Eye size={14} />
          </button>
          {row.status === 'DRAFT' && (
            <>
              <button
                onClick={() => { setEditingAssignment(row); setIsFormOpen(true); }}
                className="p-1.5 rounded bg-brand/10 hover:bg-brand text-brand-light hover:text-white transition-colors"
                title="Edit"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={() => openConfirmPublish(row)}
                className="p-1.5 rounded bg-status-success/10 hover:bg-status-success text-status-success hover:text-white transition-colors"
                title="Publish"
              >
                <Send size={14} />
              </button>
            </>
          )}
          {row.status === 'PUBLISHED' && (
            <button
              onClick={() => openConfirmClose(row)}
              className="p-1.5 rounded bg-status-warning/10 hover:bg-status-warning text-status-warning hover:text-white transition-colors"
              title="Close submissions & enable grading"
            >
              <Lock size={14} />
            </button>
          )}
        </>
      )}
      {isStudent && row.status === 'PUBLISHED' && (
        <button
          onClick={() => openConfirmSubmit(row.id)}
          className="px-3 py-1 rounded bg-brand text-white text-xs font-bold hover:bg-brand/80 transition-colors"
        >
          Submit
        </button>
      )}
    </div>
  );

  return (
    <>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Assignments"
          subtitle="Create, distribute, and grade assignments."
          actions={canManage && (
            <Button variant="primary" onClick={() => { setEditingAssignment(null); setIsFormOpen(true); }} className="flex items-center gap-2">
              <Plus size={16} /> <span>New Assignment</span>
            </Button>
          )}
        />

        {alert && (
          <div className={`flex gap-2.5 p-3 rounded-lg text-sm border ${
            alert.type === 'error'
              ? 'bg-status-danger/15 border-status-danger/30 text-status-danger'
              : 'bg-status-success/15 border-status-success/30 text-status-success'
          }`}>
            {alert.type === 'error'
              ? <AlertCircle size={18} className="shrink-0 mt-0.5" />
              : <CheckCircle size={18} className="shrink-0 mt-0.5" />}
            <span>{alert.message}</span>
          </div>
        )}

        <div className="glass-card flex flex-col md:flex-row gap-4">
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-sm font-medium text-slate-300">Batch</label>
            <Select value={filterBatch} onChange={(e) => setFilterBatch(e.target.value)}>
              <option value="">All Batches</option>
              {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
          </div>
          {canManage && (
            <div className="flex flex-col gap-1.5 min-w-[160px]">
              <label className="text-sm font-medium text-slate-300">Status</label>
              <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="CLOSED">Closed</option>
              </Select>
            </div>
          )}
        </div>

        <Table
          headers={headers}
          data={assignments}
          loading={loading}
          actions={tableActions}
          emptyMessage="No assignments found."
        />

        <Modal
          isOpen={isFormOpen}
          onClose={() => { setIsFormOpen(false); setEditingAssignment(null); }}
          title={editingAssignment ? 'Edit Assignment' : 'Create Assignment'}
        >
          <AssignmentForm
            onSubmit={handleFormSubmit}
            initialData={editingAssignment}
            onClose={() => { setIsFormOpen(false); setEditingAssignment(null); }}
          />
        </Modal>

        <ConfirmDialog
          isOpen={!!confirmPublish}
          onClose={() => setConfirmPublish(null)}
          onConfirm={handleConfirmPublish}
          loading={confirmLoading}
          title="Publish Assignment?"
          description={`Publish "${confirmPublish?.title}" to all batch students?`}
          confirmLabel="Yes, Publish"
        />

        <ConfirmDialog
          isOpen={!!confirmCloseAction}
          onClose={() => setConfirmCloseAction(null)}
          onConfirm={handleConfirmClose}
          loading={confirmLoading}
          title="Close Assignment?"
          description={`Close "${confirmCloseAction?.title}"? Students can no longer submit, and grading becomes available.`}
          confirmLabel="Yes, Close"
          variant="warning"
        />

        <ConfirmDialog
          isOpen={!!confirmSubmit}
          onClose={() => setConfirmSubmit(null)}
          onConfirm={handleConfirmSubmit}
          loading={confirmLoading}
          title="Submit Assignment?"
          description="Mark this assignment as submitted?"
          confirmLabel="Yes, Submit"
        />
      </div>
    </>
  );
};

export default AssignmentPage;
