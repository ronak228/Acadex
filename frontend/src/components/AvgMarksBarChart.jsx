import React from 'react';

const AvgMarksBarChart = ({ data = [], title }) => {
  const max = Math.max(...data.map((d) => d.avg), 1);

  return (
    <div className="flex flex-col gap-3">
      {title && <p className="text-xs font-semibold text-slate-400">{title}</p>}
      {data.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-6">No data available</p>
      ) : (
        <div className="flex flex-col gap-3">
          {data.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <p className="text-xs text-slate-400 w-32 truncate shrink-0" title={item.label}>{item.label}</p>
              <div className="flex-1 h-4 bg-bg-deep rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand to-brand-light rounded-full transition-all duration-700"
                  style={{ width: `${(item.avg / max) * 100}%` }}
                />
              </div>
              <p className="text-xs text-white font-bold w-10 text-right shrink-0">{item.avg}%</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AvgMarksBarChart;
