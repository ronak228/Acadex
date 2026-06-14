import React from 'react';

const CONFIG = {
  INTERNAL:  { label: 'Internal',  cls: 'bg-brand/15 text-brand-light border border-brand/30' },
  EXTERNAL:  { label: 'External',  cls: 'bg-sky-500/15 text-sky-400 border border-sky-500/30' },
  PRACTICAL: { label: 'Practical', cls: 'bg-purple-500/15 text-purple-300 border border-purple-500/30' }
};

const ExamTypeBadge = ({ type }) => {
  const { label, cls } = CONFIG[type] || { label: type || '—', cls: 'bg-slate-700/50 text-slate-400' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${cls}`}>
      {label}
    </span>
  );
};

export default ExamTypeBadge;
