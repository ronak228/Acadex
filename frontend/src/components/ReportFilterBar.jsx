import React from 'react';
import { Filter, RefreshCw } from 'lucide-react';
import Button from './Button';

const ReportFilterBar = ({ children, onGenerate, onReset, loading = false, title = 'Filters' }) => {
  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-700/50 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Filter size={15} className="text-brand-light" />
        <h3 className="text-sm font-semibold text-slate-300">{title}</h3>
      </div>
      <div className="flex flex-wrap gap-3 items-end">
        {children}
        <div className="flex gap-2 ml-auto pt-1">
          {onReset && (
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
            >
              <RefreshCw size={13} />
              Reset
            </button>
          )}
          <Button onClick={onGenerate} disabled={loading} className="text-xs px-4 py-2">
            {loading ? 'Generating…' : 'Generate Report'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReportFilterBar;
