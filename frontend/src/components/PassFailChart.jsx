import React from 'react';

const PassFailChart = ({ passed = 0, failed = 0, title }) => {
  const total = passed + failed;
  const passPercent = total > 0 ? Math.round((passed / total) * 100) : 0;
  const r = 40;
  const circumference = 2 * Math.PI * r;
  const passArc = (passPercent / 100) * circumference;
  const gap = circumference - passArc;

  return (
    <div className="flex flex-col items-center gap-3">
      {title && <p className="text-xs font-semibold text-slate-400 text-center">{title}</p>}
      <div className="relative w-24 h-24">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="#ef444440" strokeWidth="12" />
          {total > 0 && (
            <circle
              cx="50" cy="50" r={r} fill="none"
              stroke="#22c55e" strokeWidth="12"
              strokeDasharray={`${passArc} ${gap}`}
              strokeLinecap="round"
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-extrabold text-white">{passPercent}%</span>
        </div>
      </div>
      <div className="flex gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-status-success inline-block shrink-0" />
          <span className="text-slate-400">Pass <strong className="text-white">{passed}</strong></span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-status-danger inline-block shrink-0" />
          <span className="text-slate-400">Fail <strong className="text-white">{failed}</strong></span>
        </span>
      </div>
    </div>
  );
};

export default PassFailChart;
