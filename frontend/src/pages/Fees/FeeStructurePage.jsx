import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Eye, CheckCircle, AlertCircle, ToggleLeft, ToggleRight } from 'lucide-react';
import Table from '../../components/Table';
import Button from '../../components/Button';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import FeeStructureForm from './FeeStructureForm';
import ConfirmDialog from '../../components/ConfirmDialog';
import feeService from '../../services/feeService';
import apiClient from '../../services/apiClient';

const fmt = (v) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

const emptyNewInst = () => ({ label: '', amount: '', dueDate: '' });

const FeeStructurePage = () => {
  const [structures, setStructures] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCourseId, setFilterCourseId] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStructure, setEditingStructure] = useState(null);
  const [detailStructure, setDetailStructure] = useState(null);
  const [alert, setAlert] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  // Detail modal installment state
  const [instFormOpen, setInstFormOpen] = useState(false);
  const [newInst, setNewInst] = useState(emptyNewInst());
  const [instErrors, setInstErrors] = useState({});
  const [instLoading, setInstLoading] = useState(false);
  const [editingInst, setEditingInst] = useState(null);

  // Confirmation dialog states
  const [confirmToggle, setConfirmToggle] = useState(null);
  const [confirmDeleteInst, setConfirmDeleteInst] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 3500);
  };

  const loadStructures = async () => {
    setLoading(true);
    try {
      const res = await feeService.getStructures(filterCourseId ? { courseId: filterCourseId } : {});
      const list = res.data || [];
      setStructures(search ? list.filter((s) => s.name.toLowerCase().includes(search.toLowerCase())) : list);
    } catch {
      showAlert('error', 'Failed to load fee structures.');
    } finally {
      setLoading(false);
    }
  };

  const refreshDetail = async (id) => {
    const res = await feeService.getStructureById(id);
    setDetailStructure(res.data);
  };

  useEffect(() => {
    apiClient.get('/courses').then((r) => {
      const list = r.data.courses || r.data || [];
      setCourses(list.filter((c) => c.isActive));
    });
  }, []);

  useEffect(() => {
    loadStructures();
    setCurrentPage(1);
  }, [search, filterCourseId]);

  // formData = { name, courseId, totalAmount, frequency, installments? } for create
  //           = { name, totalAmount, frequency } for update
  const handleFormSubmit = async (formData) => {
    try {
      if (editingStructure) {
        await feeService.updateStructure(editingStructure.id, formData);
        showAlert('success', 'Fee structure updated.');
      } else {
        await feeService.createStructure(formData);
        showAlert('success', 'Fee structure created.');
      }
      setIsFormOpen(false);
      setEditingStructure(null);
      loadStructures();
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Operation failed.');
      throw err; // re-throw so form can show inline error
    }
  };

  const openConfirmToggle = (structure) => setConfirmToggle(structure);
  const handleConfirmToggle = async () => {
    if (!confirmToggle) return;
    setConfirmLoading(true);
    try {
      const res = await feeService.toggleStructureStatus(confirmToggle.id);
      showAlert('success', res.message || `Fee structure ${confirmToggle.isActive ? 'deactivated' : 'activated'}.`);
      loadStructures();
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to update status.');
    } finally {
      setConfirmLoading(false);
      setConfirmToggle(null);
    }
  };

  const openDetail = async (structure) => {
    try {
      setInstFormOpen(false);
      setNewInst(emptyNewInst());
      setEditingInst(null);
      setInstErrors({});
      const res = await feeService.getStructureById(structure.id);
      setDetailStructure(res.data);
    } catch {
      showAlert('error', 'Failed to load structure details.');
    }
  };

  // ─── Installment CRUD (inside detail modal) ──────────────────────────────────

  const validateInst = (inst) => {
    const e = {};
    if (!inst.label.trim()) e.label = 'Label required.';
    if (!inst.amount || parseFloat(inst.amount) <= 0) e.amount = 'Amount must be positive.';
    if (!inst.dueDate) e.dueDate = 'Due date required.';
    setInstErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAddInstallment = async (e) => {
    e.preventDefault();
    if (!validateInst(newInst)) return;
    setInstLoading(true);
    try {
      const nextNo = (detailStructure.installments.length || 0) + 1;
      await feeService.addInstallment(detailStructure.id, {
        installmentNo: nextNo,
        label: newInst.label,
        amount: parseFloat(newInst.amount),
        dueDate: newInst.dueDate
      });
      setNewInst(emptyNewInst());
      setInstFormOpen(false);
      setInstErrors({});
      await refreshDetail(detailStructure.id);
      loadStructures();
    } catch (err) {
      setInstErrors({ submit: err.response?.data?.message || 'Failed to add installment.' });
    } finally {
      setInstLoading(false);
    }
  };

  const handleUpdateInstallment = async (e) => {
    e.preventDefault();
    if (!validateInst(editingInst)) return;
    setInstLoading(true);
    try {
      await feeService.updateInstallment(editingInst.id, {
        label: editingInst.label,
        amount: parseFloat(editingInst.amount),
        dueDate: editingInst.dueDate
      });
      setEditingInst(null);
      setInstErrors({});
      await refreshDetail(detailStructure.id);
      loadStructures();
    } catch (err) {
      setInstErrors({ submit: err.response?.data?.message || 'Failed to update installment.' });
    } finally {
      setInstLoading(false);
    }
  };

  const openConfirmDeleteInst = (inst) => setConfirmDeleteInst(inst);
  const handleConfirmDeleteInst = async () => {
    if (!confirmDeleteInst) return;
    setConfirmLoading(true);
    try {
      await feeService.deleteInstallment(confirmDeleteInst.id);
      await refreshDetail(detailStructure.id);
      loadStructures();
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to delete installment.');
    } finally {
      setConfirmLoading(false);
      setConfirmDeleteInst(null);
    }
  };

  // ─── Table config ─────────────────────────────────────────────────────────────

  const headers = [
    { key: 'name', label: 'Structure Name', sortable: true },
    { key: 'course', label: 'Course', render: (row) => row.course?.name || '—' },
    { key: 'totalAmount', label: 'Total Amount', render: (row) => fmt(row.totalAmount) },
    { key: 'frequency', label: 'Frequency', render: (row) => row.frequency?.replace('_', ' ') },
    {
      key: '_count',
      label: 'Installments',
      render: (row) => (
        <span className="text-brand-light font-semibold">{row._count?.installments ?? 0}</span>
      )
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (row) => (
        <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded-full ${row.isActive ? 'bg-status-success/15 text-status-success' : 'bg-status-danger/15 text-status-danger'}`}>
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      )
    }
  ];

  const tableActions = (row) => (
    <div className="flex gap-2 justify-end">
      <button onClick={() => openDetail(row)} className="p-1.5 rounded bg-bg-surfaceLight hover:bg-slate-600 text-slate-300 hover:text-white transition-colors" title="View installments">
        <Eye size={14} />
      </button>
      <button onClick={() => { setEditingStructure(row); setIsFormOpen(true); }} className="p-1.5 rounded bg-brand/10 hover:bg-brand text-brand-light hover:text-white transition-colors" title="Edit">
        <Edit2 size={14} />
      </button>
      <button
        onClick={() => openConfirmToggle(row)}
        className={`p-1.5 rounded transition-colors ${row.isActive ? 'bg-status-danger/10 hover:bg-status-danger text-status-danger hover:text-white' : 'bg-status-success/10 hover:bg-status-success text-status-success hover:text-white'}`}
        title={row.isActive ? 'Deactivate' : 'Activate'}
      >
        {row.isActive ? <ToggleLeft size={14} /> : <ToggleRight size={14} />}
      </button>
    </div>
  );

  const totalPages = Math.ceil(structures.length / limit) || 1;
  const paginatedData = structures.slice((currentPage - 1) * limit, currentPage * limit);

  // ─── Installment inline edit/add rows ────────────────────────────────────────

  const InstallmentRow = ({ inst }) => {
    const isBeingEdited = editingInst?.id === inst.id;

    if (isBeingEdited) {
      return (
        <form onSubmit={handleUpdateInstallment} className="p-3 rounded-lg bg-brand/5 border border-brand/30 flex flex-col gap-2">
          {instErrors.submit && <p className="text-[10px] text-status-danger">{instErrors.submit}</p>}
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-400">Label</label>
              <input
                type="text"
                value={editingInst.label}
                onChange={(e) => setEditingInst((i) => ({ ...i, label: e.target.value }))}
                className="w-full px-2 py-1.5 rounded-lg text-xs outline-none glass-input"
              />
              {instErrors.label && <p className="text-[10px] text-status-danger">{instErrors.label}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-400">Amount (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={editingInst.amount}
                onChange={(e) => setEditingInst((i) => ({ ...i, amount: e.target.value }))}
                className="w-full px-2 py-1.5 rounded-lg text-xs outline-none glass-input"
              />
              {instErrors.amount && <p className="text-[10px] text-status-danger">{instErrors.amount}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-400">Due Date</label>
              <input
                type="date"
                value={editingInst.dueDate}
                onChange={(e) => setEditingInst((i) => ({ ...i, dueDate: e.target.value }))}
                className="w-full px-2 py-1.5 rounded-lg text-xs outline-none glass-input"
              />
              {instErrors.dueDate && <p className="text-[10px] text-status-danger">{instErrors.dueDate}</p>}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => { setEditingInst(null); setInstErrors({}); }} className="text-xs text-slate-400 hover:text-white transition-colors px-2 py-1">
              Cancel
            </button>
            <button type="submit" disabled={instLoading} className="text-xs px-3 py-1 rounded-lg bg-brand text-white font-semibold hover:bg-brand/80 transition-colors disabled:opacity-60">
              {instLoading ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      );
    }

    return (
      <div className="flex items-center justify-between p-3 rounded-lg bg-bg-deep/40 border border-slate-700/40 group">
        <div>
          <p className="text-sm font-semibold text-white">{inst.label}</p>
          <p className="text-xs text-slate-400">Due: {new Date(inst.dueDate).toLocaleDateString()}</p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-sm font-bold text-brand-light">{fmt(inst.amount)}</p>
          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => {
                setEditingInst({ id: inst.id, label: inst.label, amount: String(inst.amount), dueDate: inst.dueDate?.split('T')[0] || '' });
                setInstFormOpen(false);
                setInstErrors({});
              }}
              className="p-1 rounded bg-brand/10 hover:bg-brand text-brand-light hover:text-white transition-colors"
              title="Edit"
            >
              <Edit2 size={12} />
            </button>
            <button
              type="button"
              onClick={() => openConfirmDeleteInst(inst)}
              className="p-1 rounded bg-status-danger/10 hover:bg-status-danger text-status-danger hover:text-white transition-colors"
              title="Delete"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Fee Structures"
          subtitle="Define fee templates per course with installment schedules."
          actions={
            <Button variant="primary" onClick={() => { setEditingStructure(null); setIsFormOpen(true); }} className="flex items-center gap-2">
              <Plus size={16} /> New Structure
            </Button>
          }
        />

        {alert && (
          <div className={`flex gap-2.5 p-3 rounded-lg text-sm border ${alert.type === 'success' ? 'bg-status-success/15 border-status-success/30 text-status-success' : 'bg-status-danger/15 border-status-danger/30 text-status-danger'}`}>
            {alert.type === 'success' ? <CheckCircle size={18} className="shrink-0 mt-0.5" /> : <AlertCircle size={18} className="shrink-0 mt-0.5" />}
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
                placeholder="Search by structure name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none glass-input"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5 min-w-[200px]">
            <label className="text-sm font-medium text-slate-300">Course</label>
            <select
              value={filterCourseId}
              onChange={(e) => setFilterCourseId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none glass-input"
            >
              <option value="">All Courses</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <Table
          headers={headers}
          data={paginatedData}
          loading={loading}
          actions={tableActions}
          emptyMessage="No fee structures found."
          pagination={{ currentPage, totalPages, limit, onPageChange: setCurrentPage, onLimitChange: () => {} }}
        />

        {/* Create / Edit Modal */}
        <Modal
          isOpen={isFormOpen}
          onClose={() => { setIsFormOpen(false); setEditingStructure(null); }}
          title={editingStructure ? 'Edit Fee Structure' : 'New Fee Structure'}
          maxWidth="max-w-lg"
        >
          <FeeStructureForm
            onSubmit={handleFormSubmit}
            initialData={editingStructure}
            onClose={() => { setIsFormOpen(false); setEditingStructure(null); }}
          />
        </Modal>

        {/* Installment Detail Modal */}
        <Modal
          isOpen={!!detailStructure}
          onClose={() => { setDetailStructure(null); setInstFormOpen(false); setEditingInst(null); setInstErrors({}); }}
          title={detailStructure ? `${detailStructure.name} — Installments` : ''}
          maxWidth="max-w-lg"
        >
          {detailStructure && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-slate-400">Course</p><p className="font-semibold text-white">{detailStructure.course?.name}</p></div>
                <div><p className="text-slate-400">Total</p><p className="font-semibold text-white">{fmt(detailStructure.totalAmount)}</p></div>
                <div><p className="text-slate-400">Frequency</p><p className="font-semibold text-white">{detailStructure.frequency?.replace('_', ' ')}</p></div>
              </div>

              <div className="border-t border-slate-800 pt-3 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-300">Installment Schedule</p>
                  <button
                    type="button"
                    onClick={() => { setInstFormOpen((o) => !o); setEditingInst(null); setInstErrors({}); }}
                    className="flex items-center gap-1.5 text-xs text-brand-light hover:text-white transition-colors"
                  >
                    <Plus size={13} /> Add Installment
                  </button>
                </div>

                {/* Add installment inline form */}
                {instFormOpen && (
                  <form onSubmit={handleAddInstallment} className="p-3 rounded-xl bg-bg-deep/40 border border-brand/30 flex flex-col gap-2">
                    {instErrors.submit && <p className="text-[10px] text-status-danger">{instErrors.submit}</p>}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-400">Label</label>
                        <input
                          type="text"
                          placeholder="Term 1"
                          value={newInst.label}
                          onChange={(e) => setNewInst((i) => ({ ...i, label: e.target.value }))}
                          className="w-full px-2 py-1.5 rounded-lg text-xs outline-none glass-input"
                        />
                        {instErrors.label && <p className="text-[10px] text-status-danger">{instErrors.label}</p>}
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-400">Amount (₹)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={newInst.amount}
                          onChange={(e) => setNewInst((i) => ({ ...i, amount: e.target.value }))}
                          className="w-full px-2 py-1.5 rounded-lg text-xs outline-none glass-input"
                        />
                        {instErrors.amount && <p className="text-[10px] text-status-danger">{instErrors.amount}</p>}
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-400">Due Date</label>
                        <input
                          type="date"
                          value={newInst.dueDate}
                          onChange={(e) => setNewInst((i) => ({ ...i, dueDate: e.target.value }))}
                          className="w-full px-2 py-1.5 rounded-lg text-xs outline-none glass-input"
                        />
                        {instErrors.dueDate && <p className="text-[10px] text-status-danger">{instErrors.dueDate}</p>}
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => { setInstFormOpen(false); setInstErrors({}); }} className="text-xs text-slate-400 hover:text-white transition-colors px-2 py-1">Cancel</button>
                      <button type="submit" disabled={instLoading} className="text-xs px-3 py-1 rounded-lg bg-brand text-white font-semibold hover:bg-brand/80 transition-colors disabled:opacity-60">
                        {instLoading ? 'Adding…' : 'Add'}
                      </button>
                    </div>
                  </form>
                )}

                {detailStructure.installments.length === 0 ? (
                  <p className="text-sm text-slate-500">No installments defined.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {detailStructure.installments.map((inst) => (
                      <InstallmentRow key={inst.id} inst={inst} />
                    ))}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-brand/10 mt-1">
                      <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">Total</p>
                      <p className="text-sm font-extrabold text-brand-light">
                        {fmt(detailStructure.installments.reduce((s, i) => s + parseFloat(i.amount), 0))}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal>

        <ConfirmDialog
          isOpen={!!confirmToggle}
          onClose={() => setConfirmToggle(null)}
          onConfirm={handleConfirmToggle}
          loading={confirmLoading}
          title={confirmToggle?.isActive ? 'Deactivate Fee Structure?' : 'Activate Fee Structure?'}
          description={confirmToggle ? `${confirmToggle.isActive ? 'Deactivate' : 'Activate'} fee structure "${confirmToggle.name}"?` : ''}
          confirmLabel={confirmToggle?.isActive ? 'Yes, Deactivate' : 'Yes, Activate'}
          variant={confirmToggle?.isActive ? 'danger' : 'default'}
        />

        <ConfirmDialog
          isOpen={!!confirmDeleteInst}
          onClose={() => setConfirmDeleteInst(null)}
          onConfirm={handleConfirmDeleteInst}
          loading={confirmLoading}
          title="Delete Installment?"
          description={`Delete installment "${confirmDeleteInst?.label}"?`}
          confirmLabel="Yes, Delete"
          variant="danger"
        />
      </div>
    </>
  );
};

export default FeeStructurePage;
