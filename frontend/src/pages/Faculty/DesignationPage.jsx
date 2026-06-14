import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, ToggleLeft, ToggleRight, CheckCircle } from 'lucide-react';
import Table from '../../components/Table';
import Button from '../../components/Button';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import DesignationForm from './DesignationForm';
import designationService from '../../services/designationService';
import authService from '../../services/authService';
import ConfirmDialog from '../../components/ConfirmDialog';

const DesignationPage = () => {
  const currentUser = authService.getLocalUser() || {};
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role);

  const [designations, setDesignations] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDesignation, setEditingDesignation] = useState(null);
  const [alert, setAlert] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;
  const [confirm, setConfirm] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const loadDesignations = async () => {
    setLoading(true);
    const data = await designationService.getDesignations();
    const list = Array.isArray(data) ? data : [];
    const filtered = search
      ? list.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()))
      : list;
    setDesignations(filtered);
    setLoading(false);
  };

  useEffect(() => {
    loadDesignations();
    setCurrentPage(1);
  }, [search]);

  const handleFormSubmit = async (formData) => {
    const res = editingDesignation
      ? await designationService.updateDesignation(editingDesignation.id, formData)
      : await designationService.createDesignation(formData);

    if (res.success) {
      setAlert({ message: res.message });
      setIsFormOpen(false);
      setEditingDesignation(null);
      loadDesignations();
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const handleToggle = (designation) => {
    setConfirm(designation);
  };

  const handleConfirmToggle = async () => {
    setConfirmLoading(true);
    try {
      const res = await designationService.toggleDesignationStatus(confirm.id);
      if (res.success) {
        setAlert({ message: res.message });
        loadDesignations();
        setTimeout(() => setAlert(null), 3000);
      }
    } finally {
      setConfirmLoading(false);
      setConfirm(null);
    }
  };

  const headers = [
    { key: 'name', label: 'Designation Name', sortable: true },
    { key: 'description', label: 'Description', render: (row) => row.description || '—' },
    {
      key: 'isActive',
      label: 'Status',
      render: (row) => (
        <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded-full ${
          row.isActive ? 'bg-status-success/15 text-status-success' : 'bg-status-danger/15 text-status-danger'
        }`}>
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      )
    }
  ];

  const tableActions = isAdmin
    ? (row) => (
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => { setEditingDesignation(row); setIsFormOpen(true); }}
            className="p-1.5 rounded bg-brand/10 hover:bg-brand text-brand-light hover:text-white transition-colors"
            title="Edit"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => handleToggle(row)}
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

  const totalPages = Math.ceil(designations.length / limit) || 1;
  const paginatedData = designations.slice((currentPage - 1) * limit, currentPage * limit);

  return (
    <>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Designations"
          subtitle="Manage faculty designations. These are used when registering faculty profiles."
          actions={isAdmin && (
            <Button variant="primary" onClick={() => { setEditingDesignation(null); setIsFormOpen(true); }} className="flex items-center gap-2">
              <Plus size={16} />
              <span>New Designation</span>
            </Button>
          )}
        />

        {alert && (
          <div className="flex gap-2.5 p-3 rounded-lg bg-status-success/15 border border-status-success/30 text-status-success text-sm">
            <CheckCircle size={18} className="shrink-0 mt-0.5" />
            <span>{alert.message}</span>
          </div>
        )}

        <div className="glass-card max-w-md">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Search</label>
            <div className="relative flex items-center">
              <Search size={16} className="absolute left-3 text-slate-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by designation name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none glass-input"
              />
            </div>
          </div>
        </div>

        <Table
          headers={headers}
          data={paginatedData}
          loading={loading}
          actions={tableActions}
          emptyMessage="No designations found. Add one to get started."
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
          onClose={() => { setIsFormOpen(false); setEditingDesignation(null); }}
          title={editingDesignation ? 'Edit Designation' : 'Create New Designation'}
        >
          <DesignationForm
            onSubmit={handleFormSubmit}
            initialData={editingDesignation}
            onClose={() => { setIsFormOpen(false); setEditingDesignation(null); }}
          />
        </Modal>

        <ConfirmDialog
          isOpen={!!confirm}
          onClose={() => setConfirm(null)}
          onConfirm={handleConfirmToggle}
          loading={confirmLoading}
          title={confirm?.isActive ? 'Deactivate Designation?' : 'Activate Designation?'}
          description={confirm ? `${confirm.isActive ? 'Deactivate' : 'Activate'} designation "${confirm.name}"?` : ''}
          confirmLabel={confirm?.isActive ? 'Yes, Deactivate' : 'Yes, Activate'}
          variant={confirm?.isActive ? 'danger' : 'default'}
        />
      </div>
    </>
  );
};

export default DesignationPage;
