import React, { useState, useEffect } from 'react';
import { AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import ReportLayout from '../../layouts/ReportLayout';
import ReportFilterBar from '../../components/ReportFilterBar';
import ExportButton from '../../components/ExportButton';
import reportService from '../../services/reportService';
import apiClient from '../../services/apiClient';

const OVERDUE_RANGES = [
  { value: '', label: 'All' },
  { value: '0-30', label: '0–30 Days' },
  { value: '31-60', label: '31–60 Days' },
  { value: '60+', label: '60+ Days' },
];

const DueFeeReportPage = () => {
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [filters, setFilters] = useState({ courseId: '', batchId: '', overdueBy: '' });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [expandedStudent, setExpandedStudent] = useState(null);

  useEffect(() => {
    Promise.all([
      apiClient.get('/courses'),
      apiClient.get('/batches')
    ]).then(([cr, br]) => {
      const cl = cr.data?.data || cr.data || [];
      const bl = br.data?.data || br.data || [];
      setCourses(Array.isArray(cl) ? cl.filter(c => c.isActive !== false) : []);
      setBatches(Array.isArray(bl) ? bl.filter(b => b.isActive !== false) : []);
    }).catch(() => {});
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.courseId) params.courseId = filters.courseId;
      if (filters.batchId) params.batchId = filters.batchId;
      if (filters.overdueBy) params.overdueBy = filters.overdueBy;
      const res = await reportService.getDueFees(params);
      setReport(res.data);
      setGenerated(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFilters({ courseId: '', batchId: '', overdueBy: '' });
    setReport(null);
    setGenerated(false);
    setExpandedStudent(null);
  };

  const csvColumns = [
    { label: 'Roll No.', key: 'rollNumber' },
    { label: 'Student', key: 'name' },
    { label: 'Course', key: 'course' },
    { label: 'Batch', key: 'batch' },
    { label: 'Phone', key: 'phone' },
    { label: 'Total Due', key: 'totalAmountDue' },
  ];

  const daysColor = (days) => days > 60 ? 'text-rose-400' : days > 30 ? 'text-amber-400' : 'text-orange-300';

  return (
    <ReportLayout title="Due Fee Report" description="Students with overdue fee installments and outstanding amounts">

      <ReportFilterBar onGenerate={handleGenerate} onReset={handleReset} loading={loading}>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400 font-medium">Course</label>
          <select value={filters.courseId} onChange={e => setFilters(f => ({ ...f, courseId: e.target.value }))}
            className="px-3 py-2 rounded-lg bg-bg-deep border border-slate-700/50 text-white text-sm focus:outline-none focus:border-brand/60 w-44">
            <option value="">All Courses</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400 font-medium">Batch</label>
          <select value={filters.batchId} onChange={e => setFilters(f => ({ ...f, batchId: e.target.value }))}
            className="px-3 py-2 rounded-lg bg-bg-deep border border-slate-700/50 text-white text-sm focus:outline-none focus:border-brand/60 w-44">
            <option value="">All Batches</option>
            {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400 font-medium">Overdue Range</label>
          <select value={filters.overdueBy} onChange={e => setFilters(f => ({ ...f, overdueBy: e.target.value }))}
            className="px-3 py-2 rounded-lg bg-bg-deep border border-slate-700/50 text-white text-sm focus:outline-none focus:border-brand/60 w-36">
            {OVERDUE_RANGES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
      </ReportFilterBar>

      {generated && report && (
        <div className="flex flex-col gap-6">
          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass-panel rounded-2xl p-5 border border-slate-700/50">
              <p className="text-xs text-slate-400 mb-1">Students with Overdue Fees</p>
              <p className="text-2xl font-extrabold text-white">{report.totalStudents}</p>
            </div>
            <div className="glass-panel rounded-2xl p-5 border border-rose-500/20 bg-rose-500/5">
              <p className="text-xs text-slate-400 mb-1">Total Overdue Amount</p>
              <p className="text-2xl font-extrabold text-rose-400">₹{(report.totalOverdueAmount || 0).toLocaleString()}</p>
            </div>
          </div>

          {/* Student List */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Overdue Students</h3>
              <ExportButton data={report.students || []} columns={csvColumns} filename="due_fee_report" />
            </div>

            {(report.students || []).length > 0 ? (
              <div className="flex flex-col gap-2">
                {report.students.map(student => (
                  <div key={student.studentId} className="border border-slate-700/50 rounded-xl overflow-hidden">
                    <button
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-800/20 transition-colors"
                      onClick={() => setExpandedStudent(expandedStudent === student.studentId ? null : student.studentId)}
                    >
                      <div className="flex items-start gap-3 text-left">
                        <AlertCircle size={14} className="text-rose-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-white">{student.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {student.rollNumber} • {student.course} {student.batch ? `• ${student.batch}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-bold text-rose-400">₹{student.totalAmountDue.toLocaleString()}</p>
                          <p className="text-[10px] text-slate-500">{student.overdueInstallments.length} installment(s)</p>
                        </div>
                        {expandedStudent === student.studentId
                          ? <ChevronUp size={14} className="text-slate-500" />
                          : <ChevronDown size={14} className="text-slate-500" />
                        }
                      </div>
                    </button>

                    {expandedStudent === student.studentId && (
                      <div className="border-t border-slate-700/50 p-4 bg-bg-deep/20">
                        <div className="flex flex-wrap gap-2 mb-3 text-xs text-slate-400">
                          <span>📧 {student.email || '—'}</span>
                          <span>📞 {student.phone || '—'}</span>
                        </div>
                        <table className="w-full text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-slate-700/50 text-slate-500">
                              <th className="py-1.5 pr-3 text-left">Installment</th>
                              <th className="py-1.5 pr-3 text-right">Due Date</th>
                              <th className="py-1.5 pr-3 text-right">Amount</th>
                              <th className="py-1.5 pr-3 text-right">Paid</th>
                              <th className="py-1.5 pr-3 text-right">Balance</th>
                              <th className="py-1.5 text-right">Days Overdue</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/40 text-slate-300">
                            {student.overdueInstallments.map(inst => (
                              <tr key={inst.installmentId}>
                                <td className="py-1.5 pr-3">{inst.label}</td>
                                <td className="py-1.5 pr-3 text-right">{new Date(inst.dueDate).toLocaleDateString()}</td>
                                <td className="py-1.5 pr-3 text-right">₹{inst.amount.toLocaleString()}</td>
                                <td className="py-1.5 pr-3 text-right text-emerald-400">₹{inst.amountPaid.toLocaleString()}</td>
                                <td className="py-1.5 pr-3 text-right font-bold text-rose-400">₹{inst.amountDue.toLocaleString()}</td>
                                <td className={`py-1.5 text-right font-bold ${daysColor(inst.daysOverdue)}`}>
                                  {inst.daysOverdue}d
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-8">No overdue fees found for the selected filters.</p>
            )}
          </div>
        </div>
      )}

      {!generated && !loading && (
        <div className="glass-panel rounded-2xl p-12 border border-slate-700/50 flex flex-col items-center gap-3 text-center">
          <AlertCircle size={36} className="text-slate-600" />
          <p className="text-slate-400 text-sm">Apply filters and click <strong className="text-white">Generate Report</strong> to view due fee records.</p>
        </div>
      )}
    </ReportLayout>
  );
};

export default DueFeeReportPage;
