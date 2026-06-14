import React from 'react';

const COLOR_MAP = {
  indigo:  { from: '#4F46E5', to: '#818CF8' },
  emerald: { from: '#10B981', to: '#34D399' },
  sky:     { from: '#0284C7', to: '#38BDF8' },
  amber:   { from: '#D97706', to: '#FCD34D' },
  rose:    { from: '#E11D48', to: '#FB7185' },
};

const HorizontalBarChart = ({
  data = [],
  valueKey = 'rate',
  labelKey = 'batch',
  color = 'sky',
  max = 100,
  valueFormatter = (v) => `${v}%`,
}) => {
  const { from, to } = COLOR_MAP[color] || COLOR_MAP.sky;

  return (
    <div className="flex flex-col gap-3">
      {data.map((item, idx) => {
        const val = Number(item[valueKey]) || 0;
        const pct = Math.min((val / max) * 100, 100);
        return (
          <div key={idx} className="flex flex-col gap-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 truncate max-w-[60%]">{item[labelKey]}</span>
              <span className="font-bold" style={{ color: to }}>{valueFormatter(val)}</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${pct}%`,
                  background: `linear-gradient(to right, ${from}, ${to})`
                }}
              />
            </div>
          </div>
        );
      })}
      {data.length === 0 && (
        <p className="text-xs text-slate-500 text-center py-4">No data available</p>
      )}
    </div>
  );
};

export default HorizontalBarChart;
