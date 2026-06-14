import React from 'react';
import { Trophy } from 'lucide-react';

const MEDALS = ['🥇', '🥈', '🥉'];

const TopStudentsList = ({ students = [], title = 'Top Students' }) => (
  <div className="flex flex-col gap-3">
    <div className="flex items-center gap-2">
      <Trophy size={15} className="text-yellow-400 shrink-0" />
      <p className="text-xs font-semibold text-slate-400">{title}</p>
    </div>
    {students.length === 0 ? (
      <p className="text-slate-500 text-sm text-center py-6">No data available</p>
    ) : (
      <ol className="flex flex-col gap-2">
        {students.map((s, idx) => (
          <li key={idx} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-bg-deep/50">
            <span className="text-base w-6 text-center shrink-0">{MEDALS[idx] || `${idx + 1}.`}</span>
            <p className="flex-1 text-sm text-white font-medium truncate">{s.name}</p>
            <span className="text-xs font-bold text-brand-light shrink-0">{s.avgScore}%</span>
          </li>
        ))}
      </ol>
    )}
  </div>
);

export default TopStudentsList;
