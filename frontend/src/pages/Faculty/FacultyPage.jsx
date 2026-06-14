import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Edit2, ShieldX, UserCheck, ShieldAlert, CheckCircle } from 'lucide-react';
import Table from '../../components/Table';
import Button from '../../components/Button';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import FacultyForm from './FacultyForm';
import facultyService from '../../services/facultyService';
import authService from '../../services/authService';
import ConfirmDialog from '../../components/ConfirmDialog';

const FacultyPage = () => {
  const navigate = useNavigate();
  const currentUser = authService.getLocalUser() || { role: 'STUDENT' };
  const isAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN';

  // RBAC Redirect: Admin Only Panel
  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
    }
  }, [isAdmin, navigate]);

  // Filters State
  const [search, setSearch] = useState('');

  // Data State
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modals State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [detailsFaculty, setDetailsFaculty] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Alert State
  const [alert, setAlert] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const loadFaculty = async () => {
    setLoading(true);
    const data = await facultyService.getFaculty({ search });
    setFaculty(data);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) {
      loadFaculty();
      setCurrentPage(1);
    }
  }, [search]);

  // Create or Update Submissions
  const handleFormSubmit = async (formData) => {
    try {
      let res;
      if (editingFaculty) {
        res = await facultyService.updateFaculty(editingFaculty.id, formData);
      } else {
        res = await facultyService.createFaculty(formData);
      }

      if (res.success) {
        setAlert({ type: 'success', message: res.message });
        setIsFormOpen(false);
        setEditingFaculty(null);
        loadFaculty();
        setTimeout(() => setAlert(null), 3000);
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to save faculty. Please try again.' });
      setTimeout(() => setAlert(null), 4000);
      throw err;
    }
  };

  // Toggle active/inactive system login
  const handleToggleStatus = (id, currentStatus) => {
    setConfirm({ id, currentStatus });
  };

  const handleConfirmToggle = async () => {
    setConfirmLoading(true);
    try {
      const nextStatus = !confirm.currentStatus;
      const res = await facultyService.toggleFacultyStatus(confirm.id, nextStatus);
      if (res.success) {
        setAlert({
          type: 'success',
          message: `Faculty member successfully ${nextStatus ? 'activated' : 'blocked'}.`
        });
        loadFaculty();
        setTimeout(() => setAlert(null), 3000);
      }
    } finally {
      setConfirmLoading(false);
      setConfirm(null);
    }
  };

  // Define Table Headers
  const tableHeaders = [
    { key: 'employeeCode', label: 'Employee Code', sortable: true },
    { 
      key: 'name', 
      label: 'Full Name', 
      sortable: true,
      render: (row) => row.user?.name || 'N/A'
    },
    { key: 'designation', label: 'Designation', sortable: true },
    { key: 'department', label: 'Department' },
    { 
      key: 'dateOfJoining', 
      label: 'Date of Joining',
      render: (row) => new Date(row.dateOfJoining).toLocaleDateString()
    },
    { 
      key: 'baseSalary', 
      label: 'Base Salary',
      render: (row) => `₹${row.baseSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    },
    { 
      key: 'isActive', 
      label: 'Status',
      render: (row) => (
        <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded-full ${
          row.isActive 
            ? 'bg-status-success/15 text-status-success' 
            : 'bg-status-danger/15 text-status-danger'
        }`}>
          {row.isActive ? 'Active' : 'Blocked'}
        </span>
      )
    }
  ];

  // Action Cell Render
  const tableActions = (row) => {
    return (
      <div className="flex gap-2 justify-end">
        {/* View profile details */}
        <button
          onClick={() => setDetailsFaculty(row)}
          className="p-1.5 rounded bg-bg-surfaceLight hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
          title="View Details"
        >
          <Eye size={14} />
        </button>

        {/* Edit profile */}
        <button
          onClick={() => {
            setEditingFaculty(row);
            setIsFormOpen(true);
          }}
          className="p-1.5 rounded bg-brand/10 hover:bg-brand text-brand-light hover:text-white transition-colors"
          title="Edit Details"
        >
          <Edit2 size={14} />
        </button>

        {/* Toggle active / block */}
        <button
          onClick={() => handleToggleStatus(row.id, row.isActive)}
          className={`p-1.5 rounded transition-colors ${
            row.isActive 
              ? 'bg-status-danger/10 hover:bg-status-danger text-status-danger hover:text-white' 
              : 'bg-status-success/10 hover:bg-status-success text-status-success hover:text-white'
          }`}
          title={row.isActive ? 'Block Login Access' : 'Restore Login Access'}
        >
          {row.isActive ? <ShieldX size={14} /> : <UserCheck size={14} />}
        </button>
      </div>
    );
  };

  // Pagination Math
  const totalPages = Math.ceil(faculty.length / limit) || 1;
  const paginatedData = faculty.slice((currentPage - 1) * limit, currentPage * limit);

  if (!isAdmin) return null; // let redirect trigger

  return (
    <>
      <div className="flex flex-col gap-6">
        
        {/* Header Toolbar */}
        <PageHeader
          title="Faculty Registry"
          subtitle="Manage faculty employment details, designations, salaries, and system login credentials."
          actions={
            <Button variant="primary" onClick={() => { setEditingFaculty(null); setIsFormOpen(true); }} className="flex items-center gap-2">
              <Plus size={16} />
              <span>Add Faculty</span>
            </Button>
          }
        />

        {/* Alert Dialog */}
        {alert && (
          <div className={`flex gap-2.5 p-3 rounded-lg text-sm animate-fadeIn border ${alert.type === 'error' ? 'bg-status-danger/15 border-status-danger/30 text-status-danger' : 'bg-status-success/15 border-status-success/30 text-status-success'}`}>
            <CheckCircle size={18} className="shrink-0 mt-0.5" />
            <span>{alert.message}</span>
          </div>
        )}

        {/* Search Toolbar */}
        <div className="glass-card max-w-md items-end">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300 font-heading">Search Faculty</label>
            <div className="relative flex items-center">
              <div className="absolute left-3 text-slate-500 pointer-events-none">
                <Search size={16} />
              </div>
              <input
                type="text"
                placeholder="Search by Code, Name, Title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none glass-input"
              />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <Table
          headers={tableHeaders}
          data={paginatedData}
          loading={loading}
          actions={tableActions}
          emptyMessage="No faculty profiles found matching search constraints."
          pagination={{
            currentPage,
            totalPages,
            limit,
            onPageChange: (page) => setCurrentPage(page),
            onLimitChange: (size) => {
              setLimit(size);
              setCurrentPage(1);
            }
          }}
        />

        {/* Create/Edit Form Modal */}
        <Modal
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingFaculty(null);
          }}
          title={editingFaculty ? 'Update Faculty Specifications' : 'Register New Faculty Profile'}
        >
          <FacultyForm
            onSubmit={handleFormSubmit}
            initialData={editingFaculty}
            onClose={() => {
              setIsFormOpen(false);
              setEditingFaculty(null);
            }}
          />
        </Modal>

        {/* Details View Modal */}
        <Modal
          isOpen={!!detailsFaculty}
          onClose={() => setDetailsFaculty(null)}
          title="Faculty Profile Summary"
        >
          {detailsFaculty && (
            <div className="flex flex-col gap-4 text-sm text-slate-300">
              
              <div className="flex items-center gap-3 p-3 rounded-xl bg-bg-deep/40 border border-slate-700/30">
                <div className="w-10 h-10 rounded-full bg-brand/35 flex items-center justify-center text-brand-light font-bold text-base border border-brand/50">
                  {detailsFaculty.user?.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                </div>
                <div>
                  <h4 className="font-bold text-white leading-tight">{detailsFaculty.user?.name}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{detailsFaculty.employeeCode} • {detailsFaculty.designation}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-1">
                <div>
                  <span className="text-[10px] text-slate-500 block">Department</span>
                  <span className="font-medium text-slate-200">{detailsFaculty.department || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Date of Joining</span>
                  <span className="font-medium text-slate-200">{new Date(detailsFaculty.dateOfJoining).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Email Address</span>
                  <span className="font-medium text-slate-200 truncate block">{detailsFaculty.user?.email}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Phone</span>
                  <span className="font-medium text-slate-200">{detailsFaculty.user?.phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Base Salary</span>
                  <span className="font-medium text-status-success">₹{detailsFaculty.baseSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Bank Account Details</span>
                  <span className="font-medium text-slate-200">{detailsFaculty.bankAccount}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">IFSC Code</span>
                  <span className="font-medium text-slate-200">{detailsFaculty.ifscCode || '—'}</span>
                </div>
              </div>

              <div className="flex flex-col gap-1 p-1">
                <span className="text-[10px] text-slate-500">Qualifications</span>
                <span className="font-medium text-slate-200 p-2.5 rounded-lg bg-bg-deep/20 border border-slate-800">
                  {detailsFaculty.qualification || 'No qualification details logged.'}
                </span>
              </div>

              <div className="flex items-center justify-end pt-3 border-t border-slate-800 mt-1">
                <Button variant="primary" onClick={() => setDetailsFaculty(null)}>
                  Close Details
                </Button>
              </div>

            </div>
          )}
        </Modal>

        <ConfirmDialog
          isOpen={!!confirm}
          onClose={() => setConfirm(null)}
          onConfirm={handleConfirmToggle}
          loading={confirmLoading}
          title={confirm?.currentStatus ? 'Block Faculty Access?' : 'Restore Faculty Access?'}
          description={confirm?.currentStatus ? "This will prevent the faculty member from logging in." : "This will restore the faculty member's login access."}
          confirmLabel={confirm?.currentStatus ? 'Yes, Block Access' : 'Yes, Restore'}
          variant={confirm?.currentStatus ? 'danger' : 'default'}
        />
      </div>
    </>
  );
};

export default FacultyPage;
