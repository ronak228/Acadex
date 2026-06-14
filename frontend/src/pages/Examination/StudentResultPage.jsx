import React, { useState, useEffect } from 'react';
import Table from '../../components/Table';
import ResultStatusBadge from '../../components/ResultStatusBadge';
import ResultSummaryCard from '../../components/ResultSummaryCard';
import ExamTypeBadge from '../../components/ExamTypeBadge';
import resultService from '../../services/resultService';

const StudentResultPage = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    resultService.getMyResults()
      .then((data) => {
        setResults(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load your results. Please try again.');
        setLoading(false);
      });
  }, []);

  const headers = [
    { key: 'exam', label: 'Exam', sortable: true, render: (row) => row.exam?.title || '—' },
    { key: 'examType', label: 'Type', render: (row) => <ExamTypeBadge type={row.exam?.examType} /> },
    {
      key: 'examDate',
      label: 'Date',
      sortable: true,
      render: (row) => row.exam?.examDate ? new Date(row.exam.examDate).toLocaleDateString() : '—'
    },
    { key: 'totalMarks', label: 'Total Marks', render: (row) => row.exam?.totalMarks ?? '—' },
    { key: 'marksObtained', label: 'Marks Obtained', sortable: true, render: (row) => Number(row.marksObtained) },
    {
      key: 'percentage',
      label: 'Percentage',
      render: (row) => {
        if (!row.exam?.totalMarks) return '—';
        return `${Math.round((Number(row.marksObtained) / row.exam.totalMarks) * 100)}%`;
      }
    },
    { key: 'status', label: 'Status', render: (row) => <ResultStatusBadge status={row.status} /> }
  ];

  return (
    <>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-heading">My Results</h1>
          <p className="text-xs text-slate-400">Your complete exam performance history.</p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-status-danger/15 border border-status-danger/30 text-status-danger text-sm">
            {error}
          </div>
        )}

        {!loading && !error && results.length > 0 && (
          <ResultSummaryCard results={results} />
        )}

        <Table
          headers={headers}
          data={results}
          loading={loading}
          emptyMessage="No exam results found."
        />
      </div>
    </>
  );
};

export default StudentResultPage;
