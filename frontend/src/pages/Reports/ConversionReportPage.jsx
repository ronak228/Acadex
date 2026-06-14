import React, { useState, useEffect } from 'react';
import { TrendingUp, ArrowRight } from 'lucide-react';
import ReportLayout from '../../layouts/ReportLayout';
import ReportFilterBar from '../../components/ReportFilterBar';
import ExportButton from '../../components/ExportButton';
import reportService from '../../services/reportService';
import apiClient from '../../services/apiClient';

const FUNNEL_STEPS = [
  { key: 'NEW', label: 'New', color: '#4F46E5' },
  { key: 'CONTACTED', label: 'Contacted', color: '#0EA5E9' },
  { key: 'INTERESTED', label: 'Interested', color: '#F59E0B' },
  { key: 'CONVERTED', label: 'Converted', color: '#10B981' },
  { key: 'DROPPED', label: 'Dropped', color: '#E11D48' },
];

const SOURCES = ['walk-in', 'referral', 'website', 'social_media', 'other'];

const ConversionReportPage = () => {
  const [staffList, setStaffList] = useState([]);
  const [filters, setFilters] = useState({ from: '', to: '', source: '', assignedTo: '' });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    apiClient.get('/users').then(r => {
      const list = r.data?.data || r.data?.users || r.data || [];
      setStaffList(Array.isArray(list) ? list.filter(u => ['ADMIN', 'RECEPTIONIST'].includes(u.role) && u.isActive) : []);
    }).catch(() => {});
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      if (filters.source) params.source = filters.source;
      if (filters.assignedTo) params.assignedTo = filters.assignedTo;
      const res = await reportService.getConversion(params);
      setReport(res.data);
      setGenerated(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFilters({ from: '', to: '', source: '', assignedTo: '' });
    setReport(null);
    setGenerated(false);
  };

  const csvColumns = [
    { label: 'Name', key: 'name' },
    { label: 'Phone', key: 'phone' },
    { label: 'Course Interest', key: 'courseInterest' },
    { label: 'Status', key: 'status' },
    { label: 'Source', key: 'source' },
    { label: 'Date', key: 'createdAt' },
  ];

  const maxFunnelCount = report ? Math.max(...FUNNEL_STEPS.map(s => report.funnel?.[s.key] || 0), 1) : 1;

  return (
    <ReportLayout title="Conversion Report" description="CRM funnel analysis from inquiry to enrollment">

      <ReportFilterBar onGenerate={handleGenerate} onReset={handleReset} loading={loading}>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400 font-medium">From</label>
          <input type="date" value={filters.from} onChange={e => setFilters(f => ({ ...f, from: e.target.value }))}
            className="px-3 py-2 rounded-lg bg-bg-deep border border-slate-700/50 text-white text-sm focus:outline-none focus:border-brand/60 w-36" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400 font-medium">To</label>
          <input type="date" value={filters.to} onChange={e => setFilters(f => ({ ...f, to: e.target.value }))}
            className="px-3 py-2 rounded-lg bg-bg-deep border border-slate-700/50 text-white text-sm focus:outline-none focus:border-brand/60 w-36" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400 font-medium">Source</label>
          <select value={filters.source} onChange={e => setFilters(f => ({ ...f, source: e.target.value }))}
            className="px-3 py-2 rounded-lg bg-bg-deep border border-slate-700/50 text-white text-sm focus:outline-none focus:border-brand/60 w-36">
            <option value="">All Sources</option>
            {SOURCES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400 font-medium">Assigned Staff</label>
          <select value={filters.assignedTo} onChange={e => setFilters(f => ({ ...f, assignedTo: e.target.value }))}
            className="px-3 py-2 rounded-lg bg-bg-deep border border-slate-700/50 text-white text-sm focus:outline-none focus:border-brand/60 w-44">
            <option value="">All Staff</option>
            {staffList.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
      </ReportFilterBar>

      {generated && report && (
        <div className="flex flex-col gap-6">
          {/* Top KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-panel rounded-2xl p-5 border border-slate-700/50">
              <p className="text-xs text-slate-400 mb-1">Total Inquiries</p>
              <p className="text-2xl font-extrabold text-white">{report.total}</p>
            </div>
            <div className="glass-panel rounded-2xl p-5 border border-slate-700/50">
              <p className="text-xs text-slate-400 mb-1">Conversion Rate</p>
              <p className="text-2xl font-extrabold text-emerald-400">{report.conversionRate}%</p>
            </div>
            <div className="glass-panel rounded-2xl p-5 border border-slate-700/50">
              <p className="text-xs text-slate-400 mb-1">Avg Days to Convert</p>
              <p className="text-2xl font-extrabold text-white">{report.avgDaysToConvert}</p>
            </div>
          </div>

          {/* Funnel Visualization */}
          <div className="glass-panel rounded-2xl p-6 border border-slate-700/50">
            <h3 className="text-sm font-bold text-white mb-6">Inquiry Funnel</h3>
            <div className="flex flex-col gap-3">
              {FUNNEL_STEPS.map((step, idx) => {
                const count = report.funnel?.[step.key] || 0;
                const pct = Math.max((count / maxFunnelCount) * 100, count > 0 ? 4 : 0);
                return (
                  <div key={step.key} className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-400 w-20 text-right">{step.label}</span>
                    <div className="flex-1 h-7 bg-slate-800 rounded-lg overflow-hidden">
                      <div
                        className="h-full rounded-lg flex items-center pl-3 transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: step.color + '33', border: `1px solid ${step.color}66` }}
                      >
                        <span className="text-xs font-bold" style={{ color: step.color }}>{count}</span>
                      </div>
                    </div>
                    {idx < FUNNEL_STEPS.length - 1 && idx !== 3 && (
                      <ArrowRight size={12} className="text-slate-600 shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* By Staff */}
          {(report.byStaff || []).length > 0 && (
            <div className="glass-panel rounded-2xl p-5 border border-slate-700/50">
              <h3 className="text-sm font-bold text-white mb-4">Performance by Staff</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold text-xs">
                      <th className="py-2.5 pr-3">Staff</th>
                      <th className="py-2.5 pr-3 text-center">Total</th>
                      <th className="py-2.5 pr-3 text-center">Converted</th>
                      <th className="py-2.5 pr-3 text-center">Dropped</th>
                      <th className="py-2.5 text-center">Conversion %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {report.byStaff.map(s => (
                      <tr key={s.staffId} className="hover:bg-slate-800/20">
                        <td className="py-2.5 pr-3 font-medium text-white">{s.name}</td>
                        <td className="py-2.5 pr-3 text-center">{s.total}</td>
                        <td className="py-2.5 pr-3 text-center text-emerald-400 font-bold">{s.converted}</td>
                        <td className="py-2.5 pr-3 text-center text-rose-400">{s.dropped}</td>
                        <td className="py-2.5 text-center">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {s.conversionRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Raw Inquiries */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Inquiry List</h3>
              <ExportButton data={report.inquiries || []} columns={csvColumns} filename="conversion_report" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold text-xs">
                    <th className="py-2.5 pr-3">Name</th>
                    <th className="py-2.5 pr-3">Course Interest</th>
                    <th className="py-2.5 pr-3">Source</th>
                    <th className="py-2.5 pr-3">Status</th>
                    <th className="py-2.5">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {(report.inquiries || []).slice(0, 50).map(inq => (
                    <tr key={inq.id} className="hover:bg-slate-800/20">
                      <td className="py-2.5 pr-3 font-medium text-white">{inq.name}</td>
                      <td className="py-2.5 pr-3 text-xs text-slate-400">{inq.courseInterest || '—'}</td>
                      <td className="py-2.5 pr-3 text-xs">{inq.source || '—'}</td>
                      <td className="py-2.5 pr-3">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full border" style={{
                          color: FUNNEL_STEPS.find(s => s.key === inq.status)?.color,
                          borderColor: FUNNEL_STEPS.find(s => s.key === inq.status)?.color + '44',
                          backgroundColor: FUNNEL_STEPS.find(s => s.key === inq.status)?.color + '15',
                        }}>
                          {inq.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-xs">{new Date(inq.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {(report.inquiries || []).length === 0 && (
                    <tr><td colSpan={5} className="py-8 text-center text-xs text-slate-500">No inquiries found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!generated && !loading && (
        <div className="glass-panel rounded-2xl p-12 border border-slate-700/50 flex flex-col items-center gap-3 text-center">
          <TrendingUp size={36} className="text-slate-600" />
          <p className="text-slate-400 text-sm">Apply filters and click <strong className="text-white">Generate Report</strong> to view the CRM funnel.</p>
        </div>
      )}
    </ReportLayout>
  );
};

export default ConversionReportPage;
