import React, { useState, useEffect } from 'react';
import { Users, Shield, Key, Power, Search, CheckCircle, AlertTriangle, UserCheck, ShieldAlert } from 'lucide-react';
import Table from '../../components/Table';
import Select from '../../components/Select';
import Button from '../../components/Button';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import userService from '../../services/userService';
import authService from '../../services/authService';

const UserAdminPage = () => {
  const currentUser = authService.getLocalUser() || { id: 'f1', role: 'ADMIN', name: 'User' };
  
  // Data States
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  // Modal States
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [targetUser, setTargetUser] = useState(null);
  
  const [newRole, setNewRole] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI Toast / Alert States
  const [alert, setAlert] = useState(null);
  const [modalError, setModalError] = useState('');

  const roles = [
    { value: '', label: 'All Roles' },
    { value: 'SUPER_ADMIN', label: 'Super Admin' },
    { value: 'ADMIN', label: 'Admin' },
    { value: 'FACULTY', label: 'Faculty' },
    { value: 'STUDENT', label: 'Student' },
    { value: 'RECEPTIONIST', label: 'Receptionist' }
  ];

  const loadUsers = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (search.trim()) filters.search = search;
      if (selectedRole) filters.role = selectedRole;

      const data = await userService.getAllUsers(filters);
      setUsers(data);
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to load system user accounts.' });
    }
    setLoading(false);
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      loadUsers();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [search, selectedRole]);

  const handleToggleActive = async (user) => {
    if (user.id === currentUser.userId) {
      setAlert({ type: 'error', message: 'You cannot deactivate your own account.' });
      setTimeout(() => setAlert(null), 4000);
      return;
    }

    try {
      const res = await userService.toggleUserActive(user.id);
      if (res.success) {
        setAlert({ 
          type: 'success', 
          message: `User ${user.name} has been ${user.isActive ? 'deactivated' : 'activated'} successfully.` 
        });
        loadUsers();
        setTimeout(() => setAlert(null), 4000);
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to toggle account status.' });
      setTimeout(() => setAlert(null), 4000);
    }
  };

  const handleRoleChangeSubmit = async (e) => {
    e.preventDefault();
    if (!targetUser) return;
    setModalError('');

    if (!newRole) {
      setModalError('Please select a role.');
      return;
    }

    try {
      const res = await userService.changeUserRole(targetUser.id, newRole);
      if (res.success) {
        setAlert({ type: 'success', message: `User role updated to ${newRole} successfully.` });
        setIsRoleModalOpen(false);
        setTargetUser(null);
        setNewRole('');
        loadUsers();
        setTimeout(() => setAlert(null), 4000);
      }
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to change user role.');
    }
  };

  const handlePasswordResetSubmit = async (e) => {
    e.preventDefault();
    if (!targetUser) return;
    setModalError('');

    if (!newPassword || newPassword.length < 8) {
      setModalError('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setModalError('Passwords do not match.');
      return;
    }

    try {
      const res = await userService.resetUserPassword(targetUser.id, newPassword);
      if (res.success) {
        setAlert({ type: 'success', message: `Password reset successfully for ${targetUser.name}.` });
        setIsPasswordModalOpen(false);
        setTargetUser(null);
        setNewPassword('');
        setConfirmPassword('');
        loadUsers();
        setTimeout(() => setAlert(null), 4000);
      }
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to reset user password.');
    }
  };

  const headers = [
    { 
      key: 'name', 
      label: 'User Details', 
      sortable: true,
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-bold text-white text-sm">{row.name}</span>
          <span className="text-[11px] text-slate-500 font-mono">{row.email}</span>
        </div>
      )
    },
    { 
      key: 'role', 
      label: 'Security Role', 
      sortable: true,
      render: (row) => {
        let badgeColor = 'bg-slate-700/20 text-slate-400 border-slate-700/30';
        if (row.role === 'SUPER_ADMIN') badgeColor = 'bg-status-danger/15 text-status-danger border-status-danger/30';
        if (row.role === 'ADMIN') badgeColor = 'bg-brand/15 text-brand-light border-brand/30';
        if (row.role === 'FACULTY') badgeColor = 'bg-status-success/15 text-status-success border-status-success/30';
        if (row.role === 'RECEPTIONIST') badgeColor = 'bg-status-warning/15 text-status-warning border-status-warning/30';
        
        return (
          <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full border ${badgeColor}`}>
            {row.role.replace('_', ' ')}
          </span>
        );
      }
    },
    {
      key: 'phone',
      label: 'Phone Contact',
      render: (row) => row.phone || '—'
    },
    { 
      key: 'isActive', 
      label: 'Account Status',
      render: (row) => (
        <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded-full border ${
          row.isActive 
            ? 'bg-status-success/15 border-status-success/30 text-status-success' 
            : 'bg-slate-800/40 border-slate-700/50 text-slate-500'
        }`}>
          {row.isActive ? 'Active' : 'Deactivated'}
        </span>
      )
    },
    {
      key: 'createdAt',
      label: 'Registered On',
      render: (row) => new Date(row.createdAt).toLocaleDateString()
    }
  ];

  const actions = (row) => {
    const isSelf = row.id === currentUser.userId;
    return (
      <div className="flex gap-2 justify-end">
        <button
          onClick={() => {
            setTargetUser(row);
            setNewRole(row.role);
            setIsRoleModalOpen(true);
          }}
          disabled={isSelf}
          className={`px-2 py-1 rounded bg-bg-surfaceLight hover:bg-slate-600 text-xs text-slate-300 hover:text-white transition-all flex items-center gap-1 border border-slate-700/50 cursor-pointer ${isSelf ? 'opacity-30 cursor-not-allowed' : ''}`}
          title="Adjust Authorization Role"
        >
          <Shield size={13} />
          <span>Role</span>
        </button>
        <button
          onClick={() => {
            setTargetUser(row);
            setNewPassword('');
            setConfirmPassword('');
            setIsPasswordModalOpen(true);
          }}
          className="px-2 py-1 rounded bg-bg-surfaceLight hover:bg-slate-600 text-xs text-slate-300 hover:text-white transition-all flex items-center gap-1 border border-slate-700/50 cursor-pointer"
          title="Reset Password"
        >
          <Key size={13} />
          <span>Key</span>
        </button>
        <button
          onClick={() => handleToggleActive(row)}
          disabled={isSelf}
          className={`px-2 py-1 rounded text-xs transition-all flex items-center gap-1 border cursor-pointer ${
            row.isActive 
              ? 'bg-status-danger/10 hover:bg-status-danger border-status-danger/20 text-status-danger hover:text-white' 
              : 'bg-status-success/10 hover:bg-status-success border-status-success/20 text-status-success hover:text-white'
          } ${isSelf ? 'opacity-30 cursor-not-allowed' : ''}`}
          title={row.isActive ? 'Deactivate Account' : 'Activate Account'}
        >
          <Power size={13} />
          <span>{row.isActive ? 'Suspend' : 'Unsuspend'}</span>
        </button>
      </div>
    );
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        
        {/* Header toolbar */}
        <PageHeader
          title="System Accounts Manager"
          subtitle="Monitor login logs, suspend accounts, reset credentials, and escalate authority roles."
        />

        {/* Alerts banner toast */}
        {alert && (
          <div className={`flex gap-2.5 p-3 rounded-lg border text-sm ${
            alert.type === 'success' 
              ? 'bg-status-success/15 border-status-success/30 text-status-success' 
              : 'bg-status-danger/15 border-status-danger/30 text-status-danger'
          }`}>
            {alert.type === 'success' ? (
              <CheckCircle size={18} className="shrink-0 mt-0.5" />
            ) : (
              <ShieldAlert size={18} className="shrink-0 mt-0.5" />
            )}
            <span>{alert.message}</span>
          </div>
        )}

        {/* Filters Box */}
        <div className="glass-card flex flex-wrap gap-4 items-end max-w-2xl">
          <div className="flex flex-col gap-1.5 w-64">
            <label htmlFor="search" className="text-xs font-semibold text-slate-400">
              Search Username / Email
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                id="search"
                type="text"
                placeholder="Name or email address..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none glass-input"
              />
            </div>
          </div>

          <Select
            label="Filter Security Role"
            name="roleSelect"
            options={roles.slice(1)} // skip the "All Roles" placeholder if select provides standard placeholders, or use slice as needed
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            placeholder="All Roles"
            className="w-44"
          />
        </div>

        {/* Roster Table */}
        <Table
          headers={headers}
          data={users}
          loading={loading}
          actions={actions}
          emptyMessage="No matching system user accounts found."
        />

        {/* Modal: Change Role */}
        <Modal
          isOpen={isRoleModalOpen}
          onClose={() => {
            setIsRoleModalOpen(false);
            setTargetUser(null);
            setModalError('');
          }}
          title={targetUser ? `Adjust Security Role — ${targetUser.name}` : ''}
        >
          {targetUser && (
            <form onSubmit={handleRoleChangeSubmit} className="flex flex-col gap-4">
              {modalError && (
                <div className="p-2.5 rounded-lg bg-status-danger/10 border border-status-danger/20 text-status-danger text-xs flex gap-2">
                  <ShieldAlert size={15} className="shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <p className="text-slate-300 text-xs leading-relaxed">
                Escalating or updating a user's role affects their system dashboard permissions instantly. Ensure authorization protocol clearances.
              </p>

              <Select
                label="Assign New Security Role"
                name="assignRole"
                options={roles.filter(r => r.value !== '' && r.value !== 'SUPER_ADMIN')} // Admin cannot assign Super Admin roles
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                placeholder="Choose role..."
                required
              />

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => {
                    setIsRoleModalOpen(false);
                    setTargetUser(null);
                    setModalError('');
                  }}
                >
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Save Changes
                </Button>
              </div>
            </form>
          )}
        </Modal>

        {/* Modal: Reset Password */}
        <Modal
          isOpen={isPasswordModalOpen}
          onClose={() => {
            setIsPasswordModalOpen(false);
            setTargetUser(null);
            setModalError('');
          }}
          title={targetUser ? `Credential Override — ${targetUser.name}` : ''}
        >
          {targetUser && (
            <form onSubmit={handlePasswordResetSubmit} className="flex flex-col gap-4">
              {modalError && (
                <div className="p-2.5 rounded-lg bg-status-danger/10 border border-status-danger/20 text-status-danger text-xs flex gap-2">
                  <ShieldAlert size={15} className="shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <Input
                  label="New Temporary Password"
                  name="newPassword"
                  type="password"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />

                <Input
                  label="Confirm Temporary Password"
                  name="confirmPassword"
                  type="password"
                  placeholder="Retype password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => {
                    setIsPasswordModalOpen(false);
                    setTargetUser(null);
                    setModalError('');
                  }}
                >
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Override Credentials
                </Button>
              </div>
            </form>
          )}
        </Modal>

      </div>
    </>
  );
};

export default UserAdminPage;
