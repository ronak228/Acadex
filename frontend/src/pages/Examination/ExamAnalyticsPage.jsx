import React, { useState, useEffect } from 'react';
import Select from '../../components/Select';
import Input from '../../components/Input';
import PassFailChart from '../../components/PassFailChart';
import AvgMarksBarChart from '../../components/AvgMarksBarChart';
import TopStudentsList from '../../components/TopStudentsList';
import analyticsService from '../../services/analyticsService';
import apiClient from '../../services/apiClient';

const ExamAnalyticsPage = () => {
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [exams, setExams] = useState([]);
  // allResults: each item is a flat result object + .exam attached
  const [allResults, setAllResults] = useState([]);
  const [filterCourse, setFilterCourse] = useState('');
  const [filterBatch, setFilterBatch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiClient.get('/courses').then((r) => {
      const list = r.data.data || r.data.courses || r.data || [];
      setCourses(Array.isArray(list) ? list.filter((c) => c.isActive !== false) : []);
    });
  }, []);

  useEffect(() => {
    if (filterCourse) {
      apiClient.get('/batches', { params: { courseId: filterCourse } }).then((r) => {
        const list = r.data.data || r.data || [];
        setBatches(Array.isArray(list) ? list.filter((b) => b.isActive !== false) : []);
      });
    } else {
      setBatches([]);
    }
    setFilterBatch('');
  }, [filterCourse]);

  useEffect(() => {
    if (!filterCourse) {
      setExams([]);
      setAllResults([]);
      return;
    }

    setLoading(true);

    const params = { courseId: filterCourse };
    if (filterBatch) params.batchId = filterBatch;
    if (filterType) params.examType = filterType;
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;

    analyticsService.getExams(params)
      .then(async (examData) => {
        const examList = Array.isArray(examData) ? examData : [];
        setExams(examList);

        if (examList.length === 0) {
          setAllResults([]);
          setLoading(false);
          return;
        }

        const resultsPerExam = await analyticsService.getResultsForExams(examList.map((e) => e.id));

        // Attach exam object to each result for downstream computations
        const enriched = examList.flatMap((exam, i) =>
          (resultsPerExam[i] || []).map((r) => ({ ...r, exam }))
        );
        setAllResults(enriched);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [filterCourse, filterBatch, filterType, fromDate, toDate]);

  // ─── Derived analytics ───────────────────────────────────────────────────────
  const totalPassed = allResults.filter((r) => r.status === 'PASS').length;
  const totalFailed = allResults.length - totalPassed;

  // Avg score per exam (as %)
  const avgByExam = exams.map((exam, i) => {
    const examResults = allResults.filter((r) => r.exam?.id === exam.id);
    const avg = examResults.length > 0
      ? Math.round(
          examResults.reduce((sum, r) => sum + (Number(r.marksObtained) / exam.totalMarks) * 100, 0) /
            examResults.length
        )
      : 0;
    return { label: exam.title, avg };
  });

  // Top 5 students by average score across all exams
  const studentMap = {};
  allResults.forEach((r) => {
    const name = r.studentName || 'Unknown';
    const pct = r.exam?.totalMarks ? (Number(r.marksObtained) / r.exam.totalMarks) * 100 : 0;
    if (!studentMap[name]) studentMap[name] = { total: 0, count: 0 };
    studentMap[name].total += pct;
    studentMap[name].count += 1;
  });
  const topStudents = Object.entries(studentMap)
    .map(([name, { total, count }]) => ({ name, avgScore: Math.round(total / count) }))
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, 5);

  // Batch comparison: group by exam.batch.name
  const batchMap = {};
  allResults.forEach((r) => {
    const bName = r.exam?.batch?.name || 'No Batch';
    const pct = r.exam?.totalMarks ? (Number(r.marksObtained) / r.exam.totalMarks) * 100 : 0;
    if (!batchMap[bName]) batchMap[bName] = { total: 0, count: 0 };
    batchMap[bName].total += pct;
    batchMap[bName].count += 1;
  });
  const batchComparison = Object.entries(batchMap)
    .map(([label, { total, count }]) => ({ label, avg: Math.round(total / count) }));

  return (
    <>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-heading">Exam Analytics</h1>
          <p className="text-xs text-slate-400">Select a course to load performance data.</p>
        </div>

        {/* Filters */}
        <div className="glass-card grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Course *</label>
            <Select value={filterCourse} onChange={(e) => setFilterCourse(e.target.value)}>
              <option value="">Select Course</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Batch</label>
            <Select value={filterBatch} onChange={(e) => setFilterBatch(e.target.value)} disabled={!filterCourse}>
              <option value="">All Batches</option>
              {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Exam Type</label>
            <Select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="">All Types</option>
              {['INTERNAL', 'EXTERNAL', 'PRACTICAL'].map((t) => (
                <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">From Date</label>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">To Date</label>
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
        </div>

        {!filterCourse && (
          <div className="glass-card flex items-center justify-center py-16">
            <p className="text-slate-400 text-sm">Select a course to view analytics.</p>
          </div>
        )}

        {filterCourse && loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => <div key={i} className="h-48 rounded-xl bg-bg-surface animate-pulse" />)}
          </div>
        )}

        {filterCourse && !loading && (
          <>
            {/* Summary row */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Total Exams', value: exams.length, color: 'text-brand-light' },
                { label: 'Total Results', value: allResults.length, color: 'text-sky-400' },
                {
                  label: 'Overall Pass Rate',
                  value: allResults.length > 0
                    ? `${Math.round((totalPassed / allResults.length) * 100)}%`
                    : '—',
                  color: 'text-status-success'
                }
              ].map(({ label, value, color }) => (
                <div key={label} className="glass-card flex flex-col items-center gap-1 py-5">
                  <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
                  <p className="text-xs text-slate-400">{label}</p>
                </div>
              ))}
            </div>

            {allResults.length === 0 && (
              <div className="glass-card flex items-center justify-center py-12">
                <p className="text-slate-400 text-sm">No results found for the selected filters.</p>
              </div>
            )}

            {allResults.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Pass/Fail overall donut */}
                  <div className="glass-card flex flex-col gap-4 items-center">
                    <p className="text-sm font-semibold text-white self-start">Overall Pass / Fail</p>
                    <PassFailChart passed={totalPassed} failed={totalFailed} />
                  </div>

                  {/* Top Students */}
                  <div className="glass-card">
                    <TopStudentsList students={topStudents} title="Top 5 Students by Avg Score" />
                  </div>

                  {/* Batch Comparison */}
                  <div className="glass-card">
                    <AvgMarksBarChart data={batchComparison} title="Batch Comparison (Avg %)" />
                  </div>
                </div>

                {/* Avg marks per exam bar chart */}
                <div className="glass-card">
                  <AvgMarksBarChart data={avgByExam} title="Average Score per Exam (%)" />
                </div>

                {/* Per-exam pass/fail donut grid */}
                {exams.length > 0 && (
                  <div className="glass-card flex flex-col gap-4">
                    <p className="text-sm font-semibold text-white">Pass / Fail per Exam</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {exams.map((exam) => {
                        const er = allResults.filter((r) => r.exam?.id === exam.id);
                        const p = er.filter((r) => r.status === 'PASS').length;
                        const f = er.length - p;
                        return (
                          <PassFailChart key={exam.id} passed={p} failed={f} title={exam.title} />
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default ExamAnalyticsPage;
