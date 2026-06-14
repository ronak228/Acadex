import React, { useState, useEffect } from 'react';
import Table from '../../components/Table';
import Select from '../../components/Select';
import studentAttendanceService from '../../services/studentAttendanceService';
import apiClient from '../../services/apiClient';

const AttendanceSummary = () => {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiClient.get('/batches').then((r) => {
      const list = r.data.data || r.data || [];
      setBatches(list.filter((b) => b.isActive));
    });
  }, []);

  useEffect(() => {
    if (!selectedBatch) { setSummary([]); return; }
    setLoading(true);
    studentAttendanceService.getSummary(selectedBatch).then((data) => {
      setSummary(data || []);
      setLoading(false);
    });
  }, [selectedBatch]);

  const headers = [
    { key: 'rollNumber', label: 'Roll No.', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'present', label: 'Present' },
    { key: 'halfDay', label: 'Half Day' },
    { key: 'absent', label: 'Absent' },
    { key: 'onLeave', label: 'On Leave' },
    { key: 'totalDays', label: 'Total Days' },
    {
      key: 'percentage',
      label: 'Attendance %',
      render: (row) => {
        const color = row.percentage >= 75 ? 'text-status-success' : row.percentage >= 50 ? 'text-yellow-400' : 'text-status-danger';
        return <span className={`font-bold ${color}`}>{row.percentage}%</span>;
      }
    }
  ];

  return (
    <>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-heading">Attendance Summary</h1>
          <p className="text-xs text-slate-400">Per-student attendance percentage for a batch.</p>
        </div>

        <div className="glass-card max-w-xs flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300">Select Batch</label>
          <Select value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)}>
            <option value="">Choose a batch...</option>
            {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </Select>
        </div>

        <Table
          headers={headers}
          data={summary}
          loading={loading}
          emptyMessage={selectedBatch ? 'No attendance records found for this batch.' : 'Select a batch to view summary.'}
        />
      </div>
    </>
  );
};

export default AttendanceSummary;
