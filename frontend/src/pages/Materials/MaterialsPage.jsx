import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle, AlertCircle } from 'lucide-react';
import Button from '../../components/Button';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import Select from '../../components/Select';
import MaterialCard from '../../components/MaterialCard';
import ConfirmDialog from '../../components/ConfirmDialog';
import MaterialForm from './MaterialForm';
import materialService from '../../services/materialService';
import authService from '../../services/authService';
import apiClient from '../../services/apiClient';

const MaterialsPage = () => {
  const currentUser = authService.getLocalUser() || {};
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role);
  const canManage = isAdmin || currentUser.role === 'FACULTY';

  const [materials, setMaterials] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [batches, setBatches] = useState([]);
  const [filterSubject, setFilterSubject] = useState('');
  const [filterBatch, setFilterBatch] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [alert, setAlert] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      apiClient.get('/subjects'),
      apiClient.get('/batches')
    ]).then(([sRes, bRes]) => {
      const sList = sRes.data.subjects || sRes.data || [];
      const bList = bRes.data.data || bRes.data || [];
      setSubjects(sList.filter((s) => s.isActive));
      setBatches(bList.filter((b) => b.isActive));
    });
  }, []);

  const loadMaterials = async () => {
    setLoading(true);
    const params = {};
    if (filterSubject) params.subjectId = filterSubject;
    if (filterBatch) params.batchId = filterBatch;
    const data = await materialService.getMaterials(params);
    setMaterials(data || []);
    setLoading(false);
  };

  useEffect(() => { loadMaterials(); }, [filterSubject, filterBatch]);

  const handleSubmit = async (formData) => {
    try {
      const res = editingMaterial
        ? await materialService.updateMaterial(editingMaterial.id, formData)
        : await materialService.createMaterial(formData);
      if (res.success) {
        setAlert({ type: 'success', message: res.message });
        setIsFormOpen(false);
        setEditingMaterial(null);
        loadMaterials();
        setTimeout(() => setAlert(null), 3000);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong. Please try again.';
      setAlert({ type: 'error', message: msg });
      setTimeout(() => setAlert(null), 4000);
    }
  };

  const openConfirmDelete = (id) => {
    setConfirmDelete(id);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    setConfirmLoading(true);
    try {
      const res = await materialService.deleteMaterial(confirmDelete);
      if (res.success) {
        setAlert({ message: 'Material removed' });
        loadMaterials();
        setTimeout(() => setAlert(null), 3000);
      }
    } finally {
      setConfirmLoading(false);
      setConfirmDelete(null);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Study Materials"
          subtitle="Learning resources per subject and batch."
          actions={canManage && (
            <Button variant="primary" onClick={() => { setEditingMaterial(null); setIsFormOpen(true); }} className="flex items-center gap-2">
              <Plus size={16} /> <span>Add Material</span>
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
            <label className="text-sm font-medium text-slate-300">Subject</label>
            <Select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}>
              <option value="">All Subjects</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-sm font-medium text-slate-300">Batch</label>
            <Select value={filterBatch} onChange={(e) => setFilterBatch(e.target.value)}>
              <option value="">All Batches</option>
              {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
          </div>
        </div>

        {loading && <p className="text-slate-400 text-sm">Loading materials...</p>}

        {!loading && materials.length === 0 && (
          <div className="text-center text-slate-500 text-sm py-10">No study materials found.</div>
        )}

        {!loading && materials.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {materials.map((m) => (
              <MaterialCard
                key={m.id}
                material={m}
                onEdit={canManage ? setEditingMaterial : null}
                onDelete={isAdmin ? openConfirmDelete : null}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        )}

        <Modal
          isOpen={isFormOpen || !!editingMaterial}
          onClose={() => { setIsFormOpen(false); setEditingMaterial(null); }}
          title={editingMaterial ? 'Edit Material' : 'Add Study Material'}
        >
          <MaterialForm
            onSubmit={handleSubmit}
            initialData={editingMaterial}
            onClose={() => { setIsFormOpen(false); setEditingMaterial(null); }}
          />
        </Modal>

        <ConfirmDialog
          isOpen={!!confirmDelete}
          onClose={() => setConfirmDelete(null)}
          onConfirm={handleConfirmDelete}
          loading={confirmLoading}
          title="Remove Material?"
          description="This study material will be permanently removed."
          confirmLabel="Yes, Remove"
          variant="danger"
        />
      </div>
    </>
  );
};

export default MaterialsPage;
