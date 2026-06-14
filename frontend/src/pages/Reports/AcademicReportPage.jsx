import React, { useState, useEffect } from 'react';
import { BookOpen, CheckCircle, Circle, AlertCircle } from 'lucide-react';
import ReportLayout from '../../layouts/ReportLayout';
import ReportFilterBar from '../../components/ReportFilterBar';
import ExportButton from '../../components/ExportButton';
import reportService from '../../services/reportService';
import apiClient from '../../services/apiClient';

const CoverageBar = ({ percent }) => {
  const color = percent >= 75 ? '#10B981' : percent >= 50 ? '#F59E0B' : '#E11D48';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percent}%`, background: color }} />
      </div>
      <span className="text-xs font-bold w-10 text-right" style={{ color }}>{percent}%</span>
    </div>
  );
};

const AcademicReportPage = () => {
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [batches, setBatches] = useState([]);
  const [filters, setFilters] = useState({ courseId: '', subjectId: '', batchId: '' });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [filterError, setFilterError] = useState('');

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

  useEffect(() => {
    if (!filters.courseId) { setSubjects([]); return; }
    apiClient.get('/subjects', { params: { courseId: filters.courseId } }).then(r => {
      const list = r.data?.data || r.data || [];
      setSubjects(Array.isArray(list) ? list.filter(s => s.isActive !== false) : []);
    }).catch(() => {});
  }, [filters.courseId]);

  const handleGenerate = async () => {
    if (!filters.courseId) { setFilterError('Please select a course.'); return; }
    setFilterError('');
    setLoading(true);
    try {
      const params = { courseId: filters.courseId };
      if (filters.subjectId) params.subjectId = filters.subjectId;
      if (filters.batchId) params.batchId = filters.batchId;
      const res = await reportService.getAcademic(params);
      setReport(res.data);
      setGenerated(true);
      setExpandedSubject(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFilters({ courseId: '', subjectId: '', batchId: '' });
    setReport(null);
    setGenerated(false);
    setFilterError('');
  };

  return (
    <ReportLayout title="Academic Report" description="Syllabus coverage percentage per subject and batch">

      {filterError && (
        <div className="flex items-center gap-2 px-3 py-2 mb-3 rounded-lg bg-status-danger/10 border border-status-danger/30 text-status-danger text-sm">
          <AlertCircle size={15} className="shrink-0" />
          {filterError}
        </div>
      )}

      <ReportFilterBar onGenerate={handleGenerate} onReset={handleReset} loading={loading}>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400 font-medium">Course <span className="text-rose-400">*</span></label>
          <select value={filters.courseId}
            onChange={e => setFilters(f => ({ ...f, courseId: e.target.value, subjectId: '' }))}
            className="px-3 py-2 rounded-lg bg-bg-deep border border-slate-700/50 text-white text-sm focus:outline-none focus:border-brand/60 w-44">
            <option value="">Select Course</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400 font-medium">Subject</label>
          <select value={filters.subjectId}
            onChange={e => setFilters(f => ({ ...f, subjectId: e.target.value }))}
            className="px-3 py-2 rounded-lg bg-bg-deep border border-slate-700/50 text-white text-sm focus:outline-none focus:border-brand/60 w-44"
            disabled={!filters.courseId}>
            <option value="">All Subjects</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400 font-medium">Batch</label>
          <select value={filters.batchId}
            onChange={e => setFilters(f => ({ ...f, batchId: e.target.value }))}
            className="px-3 py-2 rounded-lg bg-bg-deep border border-slate-700/50 text-white text-sm focus:outline-none focus:border-brand/60 w-44">
            <option value="">All Batches</option>
            {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      </ReportFilterBar>

      {generated && report && (
        <div className="flex flex-col gap-6">
          {/* Overall Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-panel rounded-2xl p-5 border border-slate-700/50">
              <p className="text-xs text-slate-400 mb-1">Total Units</p>
              <p className="text-2xl font-extrabold text-white">{report.totalUnits}</p>
            </div>
            <div className="glass-panel rounded-2xl p-5 border border-slate-700/50">
              <p className="text-xs text-slate-400 mb-1">Covered Units</p>
              <p className="text-2xl font-extrabold text-emerald-400">{report.totalCovered}</p>
            </div>
            <div className="glass-panel rounded-2xl p-5 border border-slate-700/50">
              <p className="text-xs text-slate-400 mb-2">Overall Coverage</p>
              <CoverageBar percent={report.overallCoverage || 0} />
            </div>
          </div>

          {/* Per Subject */}
          <div className="flex flex-col gap-3">
            {(report.subjects || []).map(sub => (
              <div key={sub.subjectId} className="glass-panel rounded-2xl border border-slate-700/50 overflow-hidden">
                <button
                  className="w-full p-5 flex items-center justify-between hover:bg-slate-800/20 transition-colors"
                  onClick={() => setExpandedSubject(expandedSubject === sub.subjectId ? null : sub.subjectId)}
                >
                  <div className="flex items-center gap-3">
                    <BookOpen size={16} className="text-brand-light shrink-0" />
                    <div className="text-left">
                      <p className="text-sm font-bold text-white">{sub.subjectName}</p>
                      <p className="text-xs text-slate-500">{sub.subjectCode} • {sub.coveredUnits}/{sub.totalUnits} units covered</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32 hidden sm:block">
                      <CoverageBar percent={sub.coveragePercent} />
                    </div>
                    <span className="text-xs text-slate-500">{expandedSubject === sub.subjectId ? '▲' : '▼'}</span>
                  </div>
                </button>

                {expandedSubject === sub.subjectId && (
                  <div className="border-t border-slate-700/50 px-5 pb-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                      {sub.units.map(unit => (
                        <div key={unit.id} className="flex items-start gap-2 p-2 rounded-lg bg-bg-deep/30 text-sm">
                          {unit.isCovered
                            ? <CheckCircle size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                            : <Circle size={14} className="text-slate-600 mt-0.5 shrink-0" />
                          }
                          <div>
                            <span className="text-xs font-semibold text-slate-300">{unit.unitNumber}. {unit.title}</span>
                            {unit.isCovered && unit.progress?.[0]?.coveredByUser && (
                              <p className="text-[10px] text-slate-500 mt-0.5">
                                by {unit.progress[0].coveredByUser.name}
                                {unit.progress[0].coveredAt ? ` • ${new Date(unit.progress[0].coveredAt).toLocaleDateString()}` : ''}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {(report.subjects || []).length === 0 && (
              <p className="text-xs text-slate-500 text-center py-8">No syllabus units found for the selected filters.</p>
            )}
          </div>
        </div>
      )}

      {!generated && !loading && (
        <div className="glass-panel rounded-2xl p-12 border border-slate-700/50 flex flex-col items-center gap-3 text-center">
          <BookOpen size={36} className="text-slate-600" />
          <p className="text-slate-400 text-sm">Select a course and click <strong className="text-white">Generate Report</strong> to view syllabus coverage.</p>
        </div>
      )}
    </ReportLayout>
  );
};

export default AcademicReportPage;
