import React from 'react';

const SyllabusCoverageBar = ({ covered, total }) => {
  const percentage = total > 0 ? Math.round((covered / total) * 100) : 0;
  const color = percentage >= 80 ? 'bg-status-success' : percentage >= 50 ? 'bg-yellow-400' : 'bg-status-danger';

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs text-slate-400">
        <span>{covered} of {total} units covered</span>
        <span className="font-semibold text-white">{percentage}%</span>
      </div>
      <div className="w-full h-2 rounded-full bg-bg-deep/60 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default SyllabusCoverageBar;
