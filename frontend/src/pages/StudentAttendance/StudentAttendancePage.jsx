import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, CheckCircle } from 'lucide-react';
import Table from '../../components/Table';
import Button from '../../components/Button';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import Select from '../../components/Select';
import Input from '../../components/Input';
import AttendanceStatusBadge from '../../components/AttendanceStatusBadge';
import studentAttendanceService from '../../services/studentAttendanceService';
import authService from '../../services/authService';
import apiClient from '../../services/apiClient';

const StudentAttendancePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentUser = authService.getLocalUser() || {};
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role);
  const canMark = isAdmin || currentUser.role === 'FACULTY';

  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(searchParams.get('batchId') || '');
  const [filterDate, setFilterDate] = useState('');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [correctStatus, setCorrectStatus] = useState('');
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    apiClient.get('/batches').then((r) => {
      const list = r.data.data || r.data || [];
      setBatches(list.filter((b) => b.isActive));
    });
  }, []);

  const loadRecords = async () => {
    const params = {};
    if (selectedBatch) params.batchId = selectedBatch;
    if (filterDate) params.date = filterDate;
    if (!params.batchId && !params.date) { setRecords([]); return; }
    setLoading(true);
    const data = await studentAttendanceService.getAttendance(params);
    setRecords(data || []);
    setLoading(false);
  };

  useEffect(() => { loadRecords(); }, [selectedBatch, filterDate]);

  const handleCorrect = async () => {
    if (!correctStatus) return;
    const res = await studentAttendanceService.correctRecord(editRecord.id, { status: correctStatus });
    if (res.success) {
      setAlert({ message: 'Attendance record corrected' });
      setEditRecord(null);
      loadRecords();
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const headers = [
    { key: 'date', label: 'Date', render: (row) => new Date(row.date).toLocaleDateString(), sortable: true },
    { key: 'student', label: 'Student', render: (row) => row.student?.user?.name || '—' },
    { key: 'rollNumber', label: 'Roll No.', render: (row) => row.student?.rollNumber || '—' },
    {
      key: 'status', label: 'Status',
      render: (row) => <AttendanceStatusBadge status={row.status} />
    },
    { key: 'note', label: 'Note', render: (row) => row.note || '—' },
    { key: 'marker', label: 'Marked By', render: (row) => row.marker?.name || 'System' }
  ];

  const tableActions = isAdmin ? (row) => (
    <button
      onClick={() => { setEditRecord(row); setCorrectStatus(row.status); }}
      className="p-1.5 rounded bg-brand/10 hover:bg-brand text-brand-light hover:text-white transition-colors text-xs"
      title="Correct Record"
    >
      Correct
    </button>
  ) : null;

  return (
    <>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Student Attendance"
          subtitle="View and manage student attendance records."
          actions={
            <div className="flex gap-2">
              {canMark && (
                <Button variant="primary" onClick={() => navigate(`/student-attendance/mark${selectedBatch ? `?batchId=${selectedBatch}` : ''}`)} className="flex items-center gap-2">
                  <Plus size={16} /> <span>Mark Attendance</span>
                </Button>
              )}
              <Button variant="ghost" onClick={() => navigate('/student-attendance/summary')}>
                View Summary
              </Button>
            </div>
          }
        />

        {alert && (
          <div className="flex gap-2.5 p-3 rounded-lg bg-status-success/15 border border-status-success/30 text-status-success text-sm">
            <CheckCircle size={18} className="shrink-0 mt-0.5" />
            <span>{alert.message}</span>
          </div>
        )}

        <div className="glass-card flex flex-col md:flex-row gap-4">
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-sm font-medium text-slate-300">Batch</label>
            <Select value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)}>
              <option value="">All Batches</option>
              {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Date</label>
            <Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
          </div>
        </div>

        <Table
          headers={headers}
          data={records}
          loading={loading}
          actions={tableActions}
          emptyMessage="Select a batch or date to view attendance records."
        />

        <Modal isOpen={!!editRecord} onClose={() => setEditRecord(null)} title="Correct Attendance Record">
          {editRecord && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-slate-300">
                Correcting record for <strong className="text-white">{editRecord.student?.user?.name}</strong> on{' '}
                <strong className="text-white">{new Date(editRecord.date).toLocaleDateString()}</strong>
              </p>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-300">New Status</label>
                <Select value={correctStatus} onChange={(e) => setCorrectStatus(e.target.value)}>
                  <option value="PRESENT">Present</option>
                  <option value="ABSENT">Absent</option>
                  <option value="HALF_DAY">Half Day</option>
                  <option value="ON_LEAVE">On Leave</option>
                </Select>
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
                <Button variant="ghost" onClick={() => setEditRecord(null)}>Cancel</Button>
                <Button variant="primary" onClick={handleCorrect}>Save Correction</Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </>
  );
};

export default StudentAttendancePage;
