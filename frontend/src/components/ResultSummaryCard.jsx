import React from 'react';
import { CheckCircle, XCircle, TrendingUp } from 'lucide-react';

const ResultSummaryCard = ({ results = [] }) => {
  const total = results.length;
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = total - passed;
  const avg = total > 0
    ? Math.round(
        results.reduce((sum, r) => {
          const pct = r.exam?.totalMarks ? (Number(r.marksObtained) / r.exam.totalMarks) * 100 : 0;
          return sum + pct;
        }, 0) / total
      )
    : 0;

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="glass-card flex flex-col items-center gap-2 py-5">
        <CheckCircle size={22} className="text-status-success" />
        <p className="text-2xl font-extrabold text-white">{passed}</p>
        <p className="text-xs text-slate-400 font-medium">Passed</p>
      </div>
      <div className="glass-card flex flex-col items-center gap-2 py-5">
        <XCircle size={22} className="text-status-danger" />
        <p className="text-2xl font-extrabold text-white">{failed}</p>
        <p className="text-xs text-slate-400 font-medium">Failed</p>
      </div>
      <div className="glass-card flex flex-col items-center gap-2 py-5">
        <TrendingUp size={22} className="text-brand-light" />
        <p className="text-2xl font-extrabold text-white">{avg}%</p>
        <p className="text-xs text-slate-400 font-medium">Avg Score</p>
      </div>
    </div>
  );
};

export default ResultSummaryCard;
