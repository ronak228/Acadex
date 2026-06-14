import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Plus, CheckCircle, BookOpen, Check, X, ArrowLeft, AlertCircle } from 'lucide-react';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Select from '../../components/Select';
import ConfirmDialog from '../../components/ConfirmDialog';
import SyllabusCoverageBar from '../../components/SyllabusCoverageBar';
import SyllabusUnitForm from './SyllabusUnitForm';
import syllabusService from '../../services/syllabusService';
import authService from '../../services/authService';
import apiClient from '../../services/apiClient';

const SyllabusPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const currentUser = authService.getLocalUser() || {};
  const fromBatch = searchParams.get('batchId');
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role);
  const canMark = isAdmin || currentUser.role === 'FACULTY';

  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(searchParams.get('batchId') || '');
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [alert, setAlert] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  useEffect(() => {
    apiClient.get('/batches').then((r) => {
      const list = r.data.data || r.data || [];
      setBatches(list.filter((b) => b.isActive));
    });
  }, []);

  const loadProgress = async () => {
    if (!selectedBatch) { setProgress(null); return; }
    setLoading(true);
    const data = await syllabusService.getBatchProgress(selectedBatch);
    setProgress(data);
    setLoading(false);
  };

  useEffect(() => { loadProgress(); }, [selectedBatch]);

  const handleFormSubmit = async (formData) => {
    try {
      const res = editingUnit
        ? await syllabusService.updateUnit(editingUnit.id, formData)
        : await syllabusService.createUnit(formData);
      if (res.success) {
        setAlert({ type: 'success', message: res.message });
        setIsFormOpen(false);
        setEditingUnit(null);
        loadProgress();
        setTimeout(() => setAlert(null), 3000);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong. Please try again.';
      setAlert({ type: 'error', message: msg });
      setTimeout(() => setAlert(null), 4000);
    }
  };

  const handleToggleCoverage = async (unitId) => {
    const res = await syllabusService.toggleCoverage(unitId, selectedBatch);
    if (res.success) {
      setAlert({ message: res.message });
      loadProgress();
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const openConfirmDelete = (id) => {
    setConfirmDelete(id);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    setConfirmLoading(true);
    try {
      const res = await syllabusService.deleteUnit(confirmDelete);
      if (res.success) {
        setAlert({ message: 'Unit removed' });
        loadProgress();
        setTimeout(() => setAlert(null), 3000);
      }
    } finally {
      setConfirmLoading(false);
      setConfirmDelete(null);
    }
  };

  const groupBySubject = (units) => {
    const groups = {};
    units.forEach((u) => {
      const key = u.subjectId;
      if (!groups[key]) groups[key] = { subject: u.subject, units: [] };
      groups[key].units.push(u);
    });
    return Object.values(groups);
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {fromBatch && (
              <button onClick={() => navigate(`/batches/${fromBatch}`)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
                <ArrowLeft size={18} />
              </button>
            )}
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-heading">Syllabus Tracking</h1>
              <p className="text-xs text-slate-400">Define and track syllabus coverage per batch.</p>
            </div>
          </div>
          {isAdmin && (
            <Button variant="primary" onClick={() => { setEditingUnit(null); setIsFormOpen(true); }} className="flex items-center gap-2">
              <Plus size={16} /> <span>Add Unit</span>
            </Button>
          )}
        </div>

        {alert && (
          <div className={`flex gap-2.5 p-3 rounded-lg text-sm border ${alert.type === 'error' ? 'bg-status-danger/15 border-status-danger/30 text-status-danger' : 'bg-status-success/15 border-status-success/30 text-status-success'}`}>
            {alert.type === 'error' ? <AlertCircle size={18} className="shrink-0 mt-0.5" /> : <CheckCircle size={18} className="shrink-0 mt-0.5" />}
            <span>{alert.message}</span>
          </div>
        )}

        <div className="glass-card max-w-xs flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300">Select Batch</label>
          <Select value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)}>
            <option value="">Choose a batch...</option>
            {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </Select>
        </div>

        {selectedBatch && progress && (
          <div className="glass-card">
            <SyllabusCoverageBar covered={progress.coveredUnits} total={progress.totalUnits} />
          </div>
        )}

        {loading && <p className="text-slate-400 text-sm">Loading syllabus...</p>}

        {!loading && progress && progress.units?.length > 0 && (
          <div className="flex flex-col gap-6">
            {groupBySubject(progress.units).map(({ subject, units }) => (
              <div key={subject?.id} className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <BookOpen size={16} className="text-brand-light" />
                  <h2 className="font-bold text-white font-heading">{subject?.name} <span className="text-slate-500 font-normal text-xs">({subject?.code})</span></h2>
                </div>
                <div className="flex flex-col gap-2">
                  {units.map((unit) => {
                    const isCovered = unit.progress[0]?.isCovered;
                    return (
                      <div key={unit.id} className={`glass-card flex items-start gap-4 transition-colors ${isCovered ? 'border-status-success/20' : ''}`}>
                        <div className={`mt-0.5 p-1.5 rounded-lg ${isCovered ? 'bg-status-success/15' : 'bg-slate-700/40'}`}>
                          {isCovered ? <Check size={14} className="text-status-success" /> : <div className="w-3.5 h-3.5" />}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-semibold ${isCovered ? 'text-status-success' : 'text-white'}`}>
                            Unit {unit.unitNumber}: {unit.title}
                          </p>
                          {unit.description && <p className="text-xs text-slate-400 mt-0.5">{unit.description}</p>}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          {canMark && (
                            <button
                              onClick={() => handleToggleCoverage(unit.id)}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                                isCovered
                                  ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                                  : 'bg-status-success/10 hover:bg-status-success text-status-success hover:text-white'
                              }`}
                            >
                              {isCovered ? 'Mark Uncovered' : 'Mark Covered'}
                            </button>
                          )}
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => { setEditingUnit(unit); setIsFormOpen(true); }}
                                className="p-1.5 rounded bg-brand/10 hover:bg-brand text-brand-light hover:text-white transition-colors"
                                title="Edit"
                              >
                                ✎
                              </button>
                              <button
                                onClick={() => openConfirmDelete(unit.id)}
                                className="p-1.5 rounded bg-status-danger/10 hover:bg-status-danger text-status-danger hover:text-white transition-colors"
                                title="Remove"
                              >
                                <X size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && selectedBatch && progress?.units?.length === 0 && (
          <div className="text-center text-slate-500 text-sm py-10">No syllabus units defined for this batch's course.</div>
        )}

        {!selectedBatch && (
          <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
            Select a batch to view syllabus progress.
          </div>
        )}

        <Modal
          isOpen={isFormOpen}
          onClose={() => { setIsFormOpen(false); setEditingUnit(null); }}
          title={editingUnit ? 'Edit Syllabus Unit' : 'Add Syllabus Unit'}
        >
          <SyllabusUnitForm
            onSubmit={handleFormSubmit}
            initialData={editingUnit}
            onClose={() => { setIsFormOpen(false); setEditingUnit(null); }}
          />
        </Modal>

        <ConfirmDialog
          isOpen={!!confirmDelete}
          onClose={() => setConfirmDelete(null)}
          onConfirm={handleConfirmDelete}
          loading={confirmLoading}
          title="Remove Syllabus Unit?"
          description="This syllabus unit and its content will be removed."
          confirmLabel="Yes, Remove"
          variant="danger"
        />
      </div>
    </>
  );
};

export default SyllabusPage;
