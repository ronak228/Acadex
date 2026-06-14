import React from 'react';

const CONFIG = {
  EASY:   { label: 'Easy',   cls: 'bg-status-success/15 text-status-success border border-status-success/30' },
  MEDIUM: { label: 'Medium', cls: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30' },
  HARD:   { label: 'Hard',   cls: 'bg-status-danger/15 text-status-danger border border-status-danger/30' }
};

const DifficultyBadge = ({ difficulty }) => {
  const { label, cls } = CONFIG[difficulty] || { label: difficulty || '—', cls: 'bg-slate-700/50 text-slate-400' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${cls}`}>
      {label}
    </span>
  );
};

export default DifficultyBadge;
