import React, { useState, useEffect } from 'react';
import { FlaskConical, ChevronDown, ChevronUp } from 'lucide-react';
import ReportLayout from '../../layouts/ReportLayout';
import ReportFilterBar from '../../components/ReportFilterBar';
import ExportButton from '../../components/ExportButton';
import reportService from '../../services/reportService';
import apiClient from '../../services/apiClient';

const EXAM_TYPES = ['INTERNAL', 'EXTERNAL', 'PRACTICAL'];

const ExaminationReportPage = () => {
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [filters, setFilters] = useState({ courseId: '', batchId: '', examType: '', from: '', to: '' });
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [expandedExam, setExpandedExam] = useState(null);

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
      if (filters.examType) params.examType = filters.examType;
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      const res = await reportService.getExamination(params);
      setReport(res.data || []);
      setGenerated(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFilters({ courseId: '', batchId: '', examType: '', from: '', to: '' });
    setReport([]);
    setGenerated(false);
    setExpandedExam(null);
  };

  const totalPass = report.reduce((s, e) => s + e.passCount, 0);
  const totalFail = report.reduce((s, e) => s + e.failCount, 0);

  const csvColumns = [
    { label: 'Exam', key: 'title' },
    { label: 'Type', key: 'examType' },
    { label: 'Date', key: 'examDate' },
    { label: 'Course', key: 'course' },
    { label: 'Batch', key: 'batch' },
    { label: 'Total Students', key: 'totalStudents' },
    { label: 'Pass', key: 'passCount' },
    { label: 'Fail', key: 'failCount' },
    { label: 'Pass Rate', key: 'passRate' },
    { label: 'Avg Marks', key: 'avgMarks' },
  ];

  return (
    <ReportLayout title="Examination Report" description="Exam-wise pass/fail analysis with top and bottom performers">

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
          <label className="text-xs text-slate-400 font-medium">Exam Type</label>
          <select value={filters.examType} onChange={e => setFilters(f => ({ ...f, examType: e.target.value }))}
            className="px-3 py-2 rounded-lg bg-bg-deep border border-slate-700/50 text-white text-sm focus:outline-none focus:border-brand/60 w-36">
            <option value="">All Types</option>
            {EXAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
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
      </ReportFilterBar>

      {generated && (
        <div className="flex flex-col gap-6">
          {/* Summary */}
          {report.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="glass-panel rounded-2xl p-5 border border-slate-700/50">
                <p className="text-xs text-slate-400 mb-1">Total Exams</p>
                <p className="text-2xl font-extrabold text-white">{report.length}</p>
              </div>
              <div className="glass-panel rounded-2xl p-5 border border-slate-700/50">
                <p className="text-xs text-slate-400 mb-1">Total Students</p>
                <p className="text-2xl font-extrabold text-white">{report.reduce((s, e) => s + e.totalStudents, 0)}</p>
              </div>
              <div className="glass-panel rounded-2xl p-5 border border-slate-700/50">
                <p className="text-xs text-slate-400 mb-1">Overall Pass</p>
                <p className="text-2xl font-extrabold text-emerald-400">{totalPass}</p>
              </div>
              <div className="glass-panel rounded-2xl p-5 border border-slate-700/50">
                <p className="text-xs text-slate-400 mb-1">Overall Fail</p>
                <p className="text-2xl font-extrabold text-rose-400">{totalFail}</p>
              </div>
            </div>
          )}

          {/* Exam List */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Exam Results</h3>
              <ExportButton data={report} columns={csvColumns} filename="examination_report" />
            </div>

            {report.length > 0 ? (
              <div className="flex flex-col gap-3">
                {report.map(exam => (
                  <div key={exam.id} className="border border-slate-700/50 rounded-xl overflow-hidden">
                    <button
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-800/20 transition-colors"
                      onClick={() => setExpandedExam(expandedExam === exam.id ? null : exam.id)}
                    >
                      <div className="flex items-start gap-3 text-left">
                        <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-brand/10 text-brand-light border border-brand/20 uppercase mt-0.5">
                          {exam.examType}
                        </span>
                        <div>
                          <p className="text-sm font-bold text-white">{exam.title}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {exam.course} {exam.batch ? `• ${exam.batch}` : ''} • {new Date(exam.examDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-emerald-400 font-bold hidden sm:inline">{exam.passCount} pass</span>
                        <span className="text-rose-400 font-bold hidden sm:inline">{exam.failCount} fail</span>
                        <span className="text-slate-300 font-bold">{exam.passRate}%</span>
                        {expandedExam === exam.id ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
                      </div>
                    </button>

                    {expandedExam === exam.id && (
                      <div className="border-t border-slate-700/50 p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 bg-bg-deep/20">
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Stats</p>
                          <p className="text-xs text-slate-300">Students: <strong className="text-white">{exam.totalStudents}</strong></p>
                          <p className="text-xs text-slate-300">Avg Marks: <strong className="text-white">{exam.avgMarks} / {exam.totalMarks}</strong></p>
                          <p className="text-xs text-slate-300">Passing: <strong className="text-white">{exam.passingMarks}</strong></p>
                        </div>
                        {exam.top5.length > 0 && (
                          <div>
                            <p className="text-xs text-slate-400 mb-2">Top Performers</p>
                            {exam.top5.map((s, i) => (
                              <div key={i} className="flex justify-between text-xs text-slate-300 mb-1">
                                <span>{i + 1}. {s.name}</span>
                                <span className="font-bold text-emerald-400">{s.marks}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {exam.bottom5.length > 0 && (
                          <div>
                            <p className="text-xs text-slate-400 mb-2">Needs Improvement</p>
                            {exam.bottom5.map((s, i) => (
                              <div key={i} className="flex justify-between text-xs text-slate-300 mb-1">
                                <span>{s.name}</span>
                                <span className={`font-bold ${s.status === 'FAIL' ? 'text-rose-400' : 'text-amber-400'}`}>{s.marks}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-8">No exams found for the selected filters.</p>
            )}
          </div>
        </div>
      )}

      {!generated && !loading && (
        <div className="glass-panel rounded-2xl p-12 border border-slate-700/50 flex flex-col items-center gap-3 text-center">
          <FlaskConical size={36} className="text-slate-600" />
          <p className="text-slate-400 text-sm">Apply filters and click <strong className="text-white">Generate Report</strong> to view examination results.</p>
        </div>
      )}
    </ReportLayout>
  );
};

export default ExaminationReportPage;
