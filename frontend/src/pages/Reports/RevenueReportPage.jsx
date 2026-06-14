import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp } from 'lucide-react';
import ReportLayout from '../../layouts/ReportLayout';
import ReportFilterBar from '../../components/ReportFilterBar';
import ExportButton from '../../components/ExportButton';
import Input from '../../components/Input';
import Select from '../../components/Select';
import reportService from '../../services/reportService';
import apiClient from '../../services/apiClient';

const PAYMENT_METHODS = ['CASH', 'BANK_TRANSFER', 'CHEQUE', 'ONLINE', 'UPI'];

const RevenueReportPage = () => {
  const [courses, setCourses] = useState([]);
  const [filters, setFilters] = useState({ from: '', to: '', courseId: '', paymentMethod: '' });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    apiClient.get('/courses').then(r => {
      const list = r.data?.data || r.data || [];
      setCourses(Array.isArray(list) ? list.filter(c => c.isActive !== false) : []);
    }).catch(() => {});
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      if (filters.courseId) params.courseId = filters.courseId;
      if (filters.paymentMethod) params.paymentMethod = filters.paymentMethod;
      const res = await reportService.getRevenue(params);
      setReport(res.data);
      setGenerated(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFilters({ from: '', to: '', courseId: '', paymentMethod: '' });
    setReport(null);
    setGenerated(false);
  };

  const csvColumns = [
    { label: 'Student', key: 'studentFee.student.user.name' },
    { label: 'Course', key: 'studentFee.student.course.name' },
    { label: 'Fee Structure', key: 'studentFee.feeStructure.name' },
    { label: 'Installment', key: 'installment.label' },
    { label: 'Amount', key: 'amountPaid' },
    { label: 'Method', key: 'paymentMethod' },
    { label: 'Date', key: 'paymentDate' },
    { label: 'Receipt No.', key: 'receiptNumber' },
    { label: 'Collected By', key: 'collector.name' },
  ];

  return (
    <ReportLayout title="Revenue Report" description="Fee collection summary with breakdown by course and payment method">

      <ReportFilterBar onGenerate={handleGenerate} onReset={handleReset} loading={loading}>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400 font-medium">From</label>
          <input
            type="date"
            value={filters.from}
            onChange={e => setFilters(f => ({ ...f, from: e.target.value }))}
            className="px-3 py-2 rounded-lg bg-bg-deep border border-slate-700/50 text-white text-sm focus:outline-none focus:border-brand/60 w-36"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400 font-medium">To</label>
          <input
            type="date"
            value={filters.to}
            onChange={e => setFilters(f => ({ ...f, to: e.target.value }))}
            className="px-3 py-2 rounded-lg bg-bg-deep border border-slate-700/50 text-white text-sm focus:outline-none focus:border-brand/60 w-36"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400 font-medium">Course</label>
          <select
            value={filters.courseId}
            onChange={e => setFilters(f => ({ ...f, courseId: e.target.value }))}
            className="px-3 py-2 rounded-lg bg-bg-deep border border-slate-700/50 text-white text-sm focus:outline-none focus:border-brand/60 w-44"
          >
            <option value="">All Courses</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400 font-medium">Payment Method</label>
          <select
            value={filters.paymentMethod}
            onChange={e => setFilters(f => ({ ...f, paymentMethod: e.target.value }))}
            className="px-3 py-2 rounded-lg bg-bg-deep border border-slate-700/50 text-white text-sm focus:outline-none focus:border-brand/60 w-40"
          >
            <option value="">All Methods</option>
            {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
      </ReportFilterBar>

      {generated && report && (
        <div className="flex flex-col gap-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-panel rounded-2xl p-5 border border-slate-700/50">
              <p className="text-xs text-slate-400 mb-1">Total Collected</p>
              <p className="text-2xl font-extrabold text-white">₹{(report.totalCollected || 0).toLocaleString()}</p>
            </div>
            <div className="glass-panel rounded-2xl p-5 border border-slate-700/50">
              <p className="text-xs text-slate-400 mb-1">Total Transactions</p>
              <p className="text-2xl font-extrabold text-white">{report.total || 0}</p>
            </div>
            <div className="glass-panel rounded-2xl p-5 border border-slate-700/50">
              <p className="text-xs text-slate-400 mb-1">Courses Covered</p>
              <p className="text-2xl font-extrabold text-white">{(report.byCourse || []).length}</p>
            </div>
          </div>

          {/* By Method + By Course */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-panel rounded-2xl p-5 border border-slate-700/50">
              <h3 className="text-sm font-bold text-white mb-4">By Payment Method</h3>
              <div className="space-y-2">
                {(report.byMethod || []).map(m => (
                  <div key={m.method} className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">{m.method.replace(/_/g, ' ')}</span>
                    <div className="text-right">
                      <span className="font-bold text-white">₹{m.amount.toLocaleString()}</span>
                      <span className="text-xs text-slate-500 ml-2">({m.count} txns)</span>
                    </div>
                  </div>
                ))}
                {(report.byMethod || []).length === 0 && <p className="text-xs text-slate-500">No data</p>}
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-5 border border-slate-700/50">
              <h3 className="text-sm font-bold text-white mb-4">By Course</h3>
              <div className="space-y-2">
                {(report.byCourse || []).map(c => (
                  <div key={c.course} className="flex items-center justify-between text-sm">
                    <span className="text-slate-300 truncate max-w-[60%]">{c.course}</span>
                    <span className="font-bold text-white">₹{c.amount.toLocaleString()}</span>
                  </div>
                ))}
                {(report.byCourse || []).length === 0 && <p className="text-xs text-slate-500">No data</p>}
              </div>
            </div>
          </div>

          {/* Payments Table */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Payment Transactions</h3>
              <ExportButton
                data={report.payments || []}
                columns={csvColumns}
                filename="revenue_report"
                fetchAllForExport={async () => {
                  const params = {};
                  if (filters.from) params.from = filters.from;
                  if (filters.to) params.to = filters.to;
                  if (filters.courseId) params.courseId = filters.courseId;
                  if (filters.paymentMethod) params.paymentMethod = filters.paymentMethod;
                  params.limit = 10000;
                  const res = await reportService.getRevenue(params);
                  return res.data?.payments || [];
                }}
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold text-xs">
                    <th className="py-2.5 pr-3">Student</th>
                    <th className="py-2.5 pr-3">Course</th>
                    <th className="py-2.5 pr-3">Installment</th>
                    <th className="py-2.5 pr-3">Amount</th>
                    <th className="py-2.5 pr-3">Method</th>
                    <th className="py-2.5 pr-3">Date</th>
                    <th className="py-2.5 pr-3">Receipt</th>
                    <th className="py-2.5">Collected By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {(report.payments || []).length > 0 ? (
                    report.payments.map(p => (
                      <tr key={p.id} className="hover:bg-slate-800/20">
                        <td className="py-2.5 pr-3 font-medium text-white">{p.studentFee?.student?.user?.name}</td>
                        <td className="py-2.5 pr-3 text-xs text-slate-400">{p.studentFee?.student?.course?.name}</td>
                        <td className="py-2.5 pr-3 text-xs">{p.installment?.label || '—'}</td>
                        <td className="py-2.5 pr-3 font-bold text-emerald-400">₹{parseFloat(p.amountPaid).toLocaleString()}</td>
                        <td className="py-2.5 pr-3 text-xs">{p.paymentMethod?.replace(/_/g, ' ')}</td>
                        <td className="py-2.5 pr-3 text-xs">{new Date(p.paymentDate).toLocaleDateString()}</td>
                        <td className="py-2.5 pr-3 text-xs font-mono">{p.receiptNumber}</td>
                        <td className="py-2.5 text-xs">{p.collector?.name}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={8} className="py-8 text-center text-xs text-slate-500">No transactions found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!generated && !loading && (
        <div className="glass-panel rounded-2xl p-12 border border-slate-700/50 flex flex-col items-center gap-3 text-center">
          <DollarSign size={36} className="text-slate-600" />
          <p className="text-slate-400 text-sm">Set filters and click <strong className="text-white">Generate Report</strong> to view revenue data.</p>
        </div>
      )}
    </ReportLayout>
  );
};

export default RevenueReportPage;
