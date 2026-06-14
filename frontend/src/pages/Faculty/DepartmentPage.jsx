import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, ToggleLeft, ToggleRight, CheckCircle } from 'lucide-react';
import Table from '../../components/Table';
import Button from '../../components/Button';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import DepartmentForm from './DepartmentForm';
import departmentService from '../../services/departmentService';
import authService from '../../services/authService';
import ConfirmDialog from '../../components/ConfirmDialog';

const DepartmentPage = () => {
  const currentUser = authService.getLocalUser() || {};
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role);

  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [alert, setAlert] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;
  const [confirm, setConfirm] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const loadDepartments = async () => {
    setLoading(true);
    const data = await departmentService.getDepartments();
    const list = Array.isArray(data) ? data : [];
    const filtered = search
      ? list.filter(
          (d) =>
            d.name.toLowerCase().includes(search.toLowerCase()) ||
            d.code.toLowerCase().includes(search.toLowerCase())
        )
      : list;
    setDepartments(filtered);
    setLoading(false);
  };

  useEffect(() => {
    loadDepartments();
    setCurrentPage(1);
  }, [search]);

  const handleFormSubmit = async (formData) => {
    const res = editingDepartment
      ? await departmentService.updateDepartment(editingDepartment.id, formData)
      : await departmentService.createDepartment(formData);

    if (res.success) {
      setAlert({ message: res.message });
      setIsFormOpen(false);
      setEditingDepartment(null);
      loadDepartments();
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const handleToggle = (department) => {
    setConfirm(department);
  };

  const handleConfirmToggle = async () => {
    setConfirmLoading(true);
    try {
      const res = await departmentService.toggleDepartmentStatus(confirm.id);
      if (res.success) {
        setAlert({ message: res.message });
        loadDepartments();
        setTimeout(() => setAlert(null), 3000);
      }
    } finally {
      setConfirmLoading(false);
      setConfirm(null);
    }
  };

  const headers = [
    { key: 'code', label: 'Code', sortable: true },
    { key: 'name', label: 'Department Name', sortable: true },
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
            onClick={() => { setEditingDepartment(row); setIsFormOpen(true); }}
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

  const totalPages = Math.ceil(departments.length / limit) || 1;
  const paginatedData = departments.slice((currentPage - 1) * limit, currentPage * limit);

  return (
    <>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Departments"
          subtitle="Manage faculty departments. These are used when registering faculty profiles."
          actions={isAdmin && (
            <Button variant="primary" onClick={() => { setEditingDepartment(null); setIsFormOpen(true); }} className="flex items-center gap-2">
              <Plus size={16} />
              <span>New Department</span>
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
                placeholder="Search by name or code..."
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
          emptyMessage="No departments found. Add one to get started."
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
          onClose={() => { setIsFormOpen(false); setEditingDepartment(null); }}
          title={editingDepartment ? 'Edit Department' : 'Create New Department'}
        >
          <DepartmentForm
            onSubmit={handleFormSubmit}
            initialData={editingDepartment}
            onClose={() => { setIsFormOpen(false); setEditingDepartment(null); }}
          />
        </Modal>

        <ConfirmDialog
          isOpen={!!confirm}
          onClose={() => setConfirm(null)}
          onConfirm={handleConfirmToggle}
          loading={confirmLoading}
          title={confirm?.isActive ? 'Deactivate Department?' : 'Activate Department?'}
          description={confirm ? `${confirm.isActive ? 'Deactivate' : 'Activate'} department "${confirm.name}"?` : ''}
          confirmLabel={confirm?.isActive ? 'Yes, Deactivate' : 'Yes, Activate'}
          variant={confirm?.isActive ? 'danger' : 'default'}
        />
      </div>
    </>
  );
};

export default DepartmentPage;
