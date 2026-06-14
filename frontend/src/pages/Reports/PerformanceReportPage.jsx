import React, { useState, useEffect } from 'react';
import { Star, ChevronDown, ChevronUp } from 'lucide-react';
import ReportLayout from '../../layouts/ReportLayout';
import ReportFilterBar from '../../components/ReportFilterBar';
import reportService from '../../services/reportService';
import apiClient from '../../services/apiClient';
import authService from '../../services/authService';

const RatingBadge = ({ rating }) => {
  const color = rating >= 75 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    : rating >= 50 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    : 'bg-rose-500/10 text-rose-400 border-rose-500/20';
  return (
    <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold border ${color}`}>
      {rating}
    </span>
  );
};

const PerformanceReportPage = () => {
  const user = authService.getLocalUser();
  const role = user?.role;

  const [batches, setBatches] = useState([]);
  const [filters, setFilters] = useState({ batchId: '', studentId: '' });
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [expandedStudent, setExpandedStudent] = useState(null);

  useEffect(() => {
    if (role === 'STUDENT') return;
    apiClient.get('/batches').then(r => {
      const list = r.data?.data || r.data || [];
      setBatches(Array.isArray(list) ? list.filter(b => b.isActive !== false) : []);
    }).catch(() => {});
  }, [role]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.batchId) params.batchId = filters.batchId;
      if (filters.studentId) params.studentId = filters.studentId;
      const res = await reportService.getPerformance(params);
      setReport(res.data || []);
      setGenerated(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFilters({ batchId: '', studentId: '' });
    setReport([]);
    setGenerated(false);
    setExpandedStudent(null);
  };

  // Students auto-load their own data
  useEffect(() => {
    if (role === 'STUDENT') {
      handleGenerate();
    }
  }, []);

  return (
    <ReportLayout title="Performance Report" description={role === 'STUDENT' ? 'Your academic performance summary' : 'Per-student performance: attendance, exam results, and assignment completion'}>

      {role !== 'STUDENT' && (
        <ReportFilterBar onGenerate={handleGenerate} onReset={handleReset} loading={loading}>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400 font-medium">Batch</label>
            <select value={filters.batchId} onChange={e => setFilters(f => ({ ...f, batchId: e.target.value }))}
              className="px-3 py-2 rounded-lg bg-bg-deep border border-slate-700/50 text-white text-sm focus:outline-none focus:border-brand/60 w-44">
              <option value="">All Batches</option>
              {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        </ReportFilterBar>
      )}

      {generated && report.length > 0 && (
        <div className="flex flex-col gap-4">
          {report.map(rec => (
            <div key={rec.student.id} className="glass-panel rounded-2xl border border-slate-700/50 overflow-hidden">
              {/* Student Header */}
              <button
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-800/20 transition-colors"
                onClick={() => setExpandedStudent(expandedStudent === rec.student.id ? null : rec.student.id)}
              >
                <div className="flex items-center gap-4 text-left">
                  <div className="w-9 h-9 rounded-full bg-brand/20 border border-brand/30 flex items-center justify-center text-brand-light font-bold text-sm">
                    {rec.student.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{rec.student.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {rec.student.rollNumber} • {rec.student.course} {rec.student.batch !== 'N/A' ? `• ${rec.student.batch}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex gap-4 text-xs text-slate-400">
                    <span>Attendance: <strong className={`${rec.attendanceRate >= 75 ? 'text-emerald-400' : rec.attendanceRate >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>{rec.attendanceRate}%</strong></span>
                    <span>Avg Score: <strong className="text-white">{rec.avgExamScore}%</strong></span>
                    <span>Assignments: <strong className="text-white">{rec.assignmentCompletion.rate}%</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Rating:</span>
                    <RatingBadge rating={rec.overallRating} />
                  </div>
                  {expandedStudent === rec.student.id
                    ? <ChevronUp size={14} className="text-slate-500" />
                    : <ChevronDown size={14} className="text-slate-500" />
                  }
                </div>
              </button>

              {/* Expanded Detail */}
              {expandedStudent === rec.student.id && (
                <div className="border-t border-slate-700/50 p-5 bg-bg-deep/20">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                    <div className="p-3 rounded-xl bg-bg-deep/40 border border-slate-700/30">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Attendance</p>
                      <p className="text-xl font-extrabold text-white">{rec.attendanceRate}%</p>
                      <p className="text-xs text-slate-400">{rec.attendancePresent} / {rec.attendanceTotal} days</p>
                    </div>
                    <div className="p-3 rounded-xl bg-bg-deep/40 border border-slate-700/30">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Avg Exam Score</p>
                      <p className="text-xl font-extrabold text-white">{rec.avgExamScore}%</p>
                      <p className="text-xs text-slate-400">{rec.examResults.length} exams taken</p>
                    </div>
                    <div className="p-3 rounded-xl bg-bg-deep/40 border border-slate-700/30">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Assignments</p>
                      <p className="text-xl font-extrabold text-white">{rec.assignmentCompletion.rate}%</p>
                      <p className="text-xs text-slate-400">{rec.assignmentCompletion.submitted} / {rec.assignmentCompletion.total} submitted</p>
                    </div>
                  </div>

                  {/* Exam Results */}
                  {rec.examResults.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Exam Results</p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-slate-700/50 text-slate-500">
                              <th className="py-1.5 pr-3 text-left">Exam</th>
                              <th className="py-1.5 pr-3 text-left">Type</th>
                              <th className="py-1.5 pr-3 text-right">Marks</th>
                              <th className="py-1.5 text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/40 text-slate-300">
                            {rec.examResults.map(r => (
                              <tr key={r.id}>
                                <td className="py-1.5 pr-3 font-medium text-white">{r.title}</td>
                                <td className="py-1.5 pr-3 text-slate-500">{r.examType}</td>
                                <td className="py-1.5 pr-3 text-right">{r.marksObtained} / {r.totalMarks}</td>
                                <td className="py-1.5 text-right">
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                    r.status === 'PASS'
                                      ? 'bg-emerald-500/10 text-emerald-400'
                                      : 'bg-rose-500/10 text-rose-400'
                                  }`}>
                                    {r.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {generated && report.length === 0 && (
        <div className="glass-panel rounded-2xl p-10 border border-slate-700/50 flex flex-col items-center gap-3 text-center">
          <Star size={32} className="text-slate-600" />
          <p className="text-slate-400 text-sm">No performance data found for the selected filters.</p>
        </div>
      )}

      {!generated && !loading && role !== 'STUDENT' && (
        <div className="glass-panel rounded-2xl p-12 border border-slate-700/50 flex flex-col items-center gap-3 text-center">
          <Star size={36} className="text-slate-600" />
          <p className="text-slate-400 text-sm">Select filters and click <strong className="text-white">Generate Report</strong> to view student performance.</p>
        </div>
      )}
    </ReportLayout>
  );
};

export default PerformanceReportPage;
