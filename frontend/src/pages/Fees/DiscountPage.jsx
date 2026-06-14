import React, { useState, useEffect } from 'react';
import { Plus, Edit2, CheckCircle, AlertCircle, Tag, Award } from 'lucide-react';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import feeService from '../../services/feeService';

const DISCOUNT_TYPES = [
  { value: 'PERCENTAGE', label: 'Percentage (%)' },
  { value: 'FIXED', label: 'Fixed Amount (₹)' }
];

const DiscountForm = ({ initialData, onClose, onSubmit }) => {
  const [form, setForm] = useState({ name: '', type: 'PERCENTAGE', value: '', criteria: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const isScholarship = initialData?._type === 'scholarship' || form._type === 'scholarship';

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || '',
        type: initialData.type || 'PERCENTAGE',
        value: String(initialData.value || ''),
        criteria: initialData.criteria || '',
        _type: initialData._type
      });
    }
  }, [initialData]);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required.';
    if (!form.value || parseFloat(form.value) < 0) e.value = 'Value must be non-negative.';
    if (form.type === 'PERCENTAGE' && parseFloat(form.value) > 100) e.value = 'Percentage cannot exceed 100.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await onSubmit({ name: form.name, type: form.type, value: parseFloat(form.value), criteria: form.criteria || undefined });
    } catch (err) {
      setErrors({ submit: err.response?.data?.message || 'Failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {errors.submit && <p className="text-xs text-status-danger bg-status-danger/10 p-2 rounded-lg">{errors.submit}</p>}

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-300">Name *</label>
        <Input placeholder="e.g. Sibling Discount" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        {errors.name && <p className="text-xs text-status-danger">{errors.name}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300">Type *</label>
          <select
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none glass-input"
          >
            {DISCOUNT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300">Value *</label>
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder={form.type === 'PERCENTAGE' ? '10' : '5000'}
            value={form.value}
            onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
          />
          {errors.value && <p className="text-xs text-status-danger">{errors.value}</p>}
        </div>
      </div>

      {/* Criteria — only for scholarships */}
      {initialData?._type === 'scholarship' && (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300">Criteria (optional)</label>
          <Input placeholder="e.g. Academic merit ≥ 85%" value={form.criteria} onChange={(e) => setForm((f) => ({ ...f, criteria: e.target.value }))} />
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
        <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
        <Button variant="primary" type="submit" loading={loading}>
          {initialData?.id ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
};

const RecordTable = ({ title, icon: Icon, records, loading, onAdd, onEdit }) => {
  const headers = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'type', label: 'Type', render: (row) => row.type?.replace('_', ' ') },
    {
      key: 'value',
      label: 'Value',
      render: (row) => row.type === 'PERCENTAGE' ? `${row.value}%` : `₹${parseFloat(row.value).toLocaleString('en-IN')}`
    },
    ...(records.some((r) => r.criteria !== undefined)
      ? [{ key: 'criteria', label: 'Criteria', render: (row) => row.criteria || '—' }]
      : []),
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
    <button
      onClick={() => onEdit(row)}
      className="p-1.5 rounded bg-brand/10 hover:bg-brand text-brand-light hover:text-white transition-colors"
      title="Edit"
    >
      <Edit2 size={14} />
    </button>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={18} className="text-brand-light" />
          <h2 className="text-lg font-bold text-white">{title}</h2>
        </div>
        <Button variant="primary" onClick={onAdd} className="flex items-center gap-2">
          <Plus size={15} /> Add
        </Button>
      </div>
      <Table
        headers={headers}
        data={records}
        loading={loading}
        actions={tableActions}
        emptyMessage={`No ${title.toLowerCase()} defined.`}
      />
    </div>
  );
};

const DiscountPage = () => {
  const [discounts, setDiscounts] = useState([]);
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('discounts');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [alert, setAlert] = useState(null);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 3500);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [dr, sr] = await Promise.all([feeService.getDiscounts(), feeService.getScholarships()]);
      setDiscounts(dr.data || []);
      setScholarships(sr.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (data) => {
    try {
      if (editingItem?.id) {
        // Existing record — update
        if (editingItem._type === 'discount') {
          await feeService.updateDiscount(editingItem.id, data);
        } else {
          await feeService.updateScholarship(editingItem.id, data);
        }
        showAlert('success', 'Updated successfully.');
      } else {
        // New record — create; _type set by openAdd
        if (editingItem?._type === 'discount') {
          await feeService.createDiscount(data);
        } else {
          await feeService.createScholarship(data);
        }
        showAlert('success', 'Created successfully.');
      }
      setIsFormOpen(false);
      setEditingItem(null);
      load();
    } catch (err) {
      throw err;
    }
  };

  const openEdit = (item, type) => {
    setEditingItem({ ...item, _type: type });
    setIsFormOpen(true);
  };

  const openAdd = (type) => {
    setActiveTab(type === 'discount' ? 'discounts' : 'scholarships');
    setEditingItem({ _type: type });
    setIsFormOpen(true);
  };

  const formTitle = editingItem?.id
    ? `Edit ${editingItem._type === 'discount' ? 'Discount' : 'Scholarship'}`
    : `New ${editingItem?._type === 'discount' ? 'Discount' : 'Scholarship'}`;

  return (
    <>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-heading">Discounts & Scholarships</h1>
          <p className="text-xs md:text-sm text-slate-400">Manage discount rules and scholarship programs.</p>
        </div>

        {alert && (
          <div className={`flex gap-2.5 p-3 rounded-lg text-sm border ${alert.type === 'success' ? 'bg-status-success/15 border-status-success/30 text-status-success' : 'bg-status-danger/15 border-status-danger/30 text-status-danger'}`}>
            {alert.type === 'success' ? <CheckCircle size={18} className="shrink-0 mt-0.5" /> : <AlertCircle size={18} className="shrink-0 mt-0.5" />}
            <span>{alert.message}</span>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex gap-2 border-b border-slate-800 pb-0">
          {[
            { id: 'discounts', label: 'Discounts', icon: Tag },
            { id: 'scholarships', label: 'Scholarships', icon: Award }
          ].map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-brand text-brand-light'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                <TabIcon size={15} /> {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'discounts' && (
          <RecordTable
            title="Discounts"
            icon={Tag}
            records={discounts}
            loading={loading}
            onAdd={() => openAdd('discount')}
            onEdit={(item) => openEdit(item, 'discount')}
          />
        )}

        {activeTab === 'scholarships' && (
          <RecordTable
            title="Scholarships"
            icon={Award}
            records={scholarships}
            loading={loading}
            onAdd={() => openAdd('scholarship')}
            onEdit={(item) => openEdit(item, 'scholarship')}
          />
        )}

        <Modal
          isOpen={isFormOpen}
          onClose={() => { setIsFormOpen(false); setEditingItem(null); }}
          title={formTitle}
          maxWidth="max-w-md"
        >
          <DiscountForm
            initialData={editingItem}
            onClose={() => { setIsFormOpen(false); setEditingItem(null); }}
            onSubmit={handleSubmit}
          />
        </Modal>
      </div>
    </>
  );
};

export default DiscountPage;
