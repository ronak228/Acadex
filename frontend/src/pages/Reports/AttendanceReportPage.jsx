import React, { useState, useEffect } from 'react';
import { UserCheck, AlertCircle } from 'lucide-react';
import ReportLayout from '../../layouts/ReportLayout';
import ReportFilterBar from '../../components/ReportFilterBar';
import ExportButton from '../../components/ExportButton';
import reportService from '../../services/reportService';
import apiClient from '../../services/apiClient';

const PctBadge = ({ pct }) => {
  const color = pct >= 75 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    : pct >= 50 ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    : 'text-rose-400 bg-rose-500/10 border-rose-500/20';
  return (
    <span className={`px-2 py-0.5 text-xs font-bold rounded border ${color}`}>
      {pct}%
    </span>
  );
};

const AttendanceReportPage = () => {
  const [batches, setBatches] = useState([]);
  const [filters, setFilters] = useState({ batchId: '', from: '', to: '', studentId: '' });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [filterError, setFilterError] = useState('');

  useEffect(() => {
    apiClient.get('/batches').then(r => {
      const list = r.data?.data || r.data || [];
      setBatches(Array.isArray(list) ? list.filter(b => b.isActive !== false) : []);
    }).catch(() => {});
  }, []);

  const handleGenerate = async () => {
    if (!filters.batchId) { setFilterError('Please select a batch.'); return; }
    setFilterError('');
    setLoading(true);
    try {
      const params = { batchId: filters.batchId };
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      if (filters.studentId) params.studentId = filters.studentId;
      const res = await reportService.getAttendance(params);
      setReport(res.data);
      setGenerated(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFilters({ batchId: '', from: '', to: '', studentId: '' });
    setReport(null);
    setGenerated(false);
    setFilterError('');
  };

  const csvColumns = [
    { label: 'Roll No.', key: 'rollNumber' },
    { label: 'Student', key: 'name' },
    { label: 'Present', key: 'present' },
    { label: 'Absent', key: 'absent' },
    { label: 'Half Day', key: 'halfDay' },
    { label: 'On Leave', key: 'onLeave' },
    { label: 'Total', key: 'total' },
    { label: 'Attendance %', key: 'percentage' },
  ];

  return (
    <ReportLayout title="Attendance Report" description="Per-student attendance percentages for a batch and date range">

      {filterError && (
        <div className="flex items-center gap-2 px-3 py-2 mb-3 rounded-lg bg-status-danger/10 border border-status-danger/30 text-status-danger text-sm">
          <AlertCircle size={15} className="shrink-0" />
          {filterError}
        </div>
      )}

      <ReportFilterBar onGenerate={handleGenerate} onReset={handleReset} loading={loading}>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400 font-medium">Batch <span className="text-rose-400">*</span></label>
          <select
            value={filters.batchId}
            onChange={e => setFilters(f => ({ ...f, batchId: e.target.value }))}
            className="px-3 py-2 rounded-lg bg-bg-deep border border-slate-700/50 text-white text-sm focus:outline-none focus:border-brand/60 w-44"
          >
            <option value="">Select Batch</option>
            {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400 font-medium">From</label>
          <input type="date" value={filters.from}
            onChange={e => setFilters(f => ({ ...f, from: e.target.value }))}
            className="px-3 py-2 rounded-lg bg-bg-deep border border-slate-700/50 text-white text-sm focus:outline-none focus:border-brand/60 w-36" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400 font-medium">To</label>
          <input type="date" value={filters.to}
            onChange={e => setFilters(f => ({ ...f, to: e.target.value }))}
            className="px-3 py-2 rounded-lg bg-bg-deep border border-slate-700/50 text-white text-sm focus:outline-none focus:border-brand/60 w-36" />
        </div>
      </ReportFilterBar>

      {generated && report && (
        <div className="flex flex-col gap-6">
          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-panel rounded-2xl p-5 border border-slate-700/50">
              <p className="text-xs text-slate-400 mb-1">Batch</p>
              <p className="text-lg font-bold text-white">{report.batch?.name}</p>
              <p className="text-xs text-slate-500">{report.batch?.course}</p>
            </div>
            <div className="glass-panel rounded-2xl p-5 border border-slate-700/50">
              <p className="text-xs text-slate-400 mb-1">Total Working Days</p>
              <p className="text-2xl font-extrabold text-white">{report.totalWorkingDays}</p>
            </div>
            <div className="glass-panel rounded-2xl p-5 border border-slate-700/50">
              <p className="text-xs text-slate-400 mb-1">Avg Attendance</p>
              <p className="text-2xl font-extrabold text-white">{report.avgAttendance}%</p>
            </div>
          </div>

          {/* Student Table */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Student Attendance ({report.students?.length} students)</h3>
              <ExportButton data={report.students || []} columns={csvColumns} filename="attendance_report" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold text-xs">
                    <th className="py-2.5 pr-3">Roll No.</th>
                    <th className="py-2.5 pr-3">Student</th>
                    <th className="py-2.5 pr-3 text-center">Present</th>
                    <th className="py-2.5 pr-3 text-center">Absent</th>
                    <th className="py-2.5 pr-3 text-center">Half Day</th>
                    <th className="py-2.5 pr-3 text-center">Total</th>
                    <th className="py-2.5 text-center">Attendance %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {(report.students || []).length > 0 ? (
                    report.students.map(s => (
                      <tr key={s.studentId} className="hover:bg-slate-800/20">
                        <td className="py-2.5 pr-3 text-xs font-mono text-slate-400">{s.rollNumber}</td>
                        <td className="py-2.5 pr-3 font-medium text-white">{s.name}</td>
                        <td className="py-2.5 pr-3 text-center text-emerald-400 font-bold">{s.present}</td>
                        <td className="py-2.5 pr-3 text-center text-rose-400">{s.absent}</td>
                        <td className="py-2.5 pr-3 text-center text-amber-400">{s.halfDay}</td>
                        <td className="py-2.5 pr-3 text-center">{s.total}</td>
                        <td className="py-2.5 text-center"><PctBadge pct={s.percentage} /></td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={7} className="py-8 text-center text-xs text-slate-500">No attendance records found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Legend */}
            <div className="flex gap-4 mt-4 text-xs text-slate-500">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500/60" /> ≥75% Good</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-500/60" /> 50–74% At Risk</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-rose-500/60" /> &lt;50% Critical</span>
            </div>
          </div>
        </div>
      )}

      {!generated && !loading && (
        <div className="glass-panel rounded-2xl p-12 border border-slate-700/50 flex flex-col items-center gap-3 text-center">
          <UserCheck size={36} className="text-slate-600" />
          <p className="text-slate-400 text-sm">Select a batch and click <strong className="text-white">Generate Report</strong> to view attendance data.</p>
        </div>
      )}
    </ReportLayout>
  );
};

export default AttendanceReportPage;
