import React from 'react';

const COLOR_MAP = {
  indigo:  { from: '#4F46E5', to: '#818CF8' },
  emerald: { from: '#10B981', to: '#34D399' },
  sky:     { from: '#0284C7', to: '#38BDF8' },
  amber:   { from: '#D97706', to: '#FCD34D' },
  rose:    { from: '#E11D48', to: '#FB7185' },
};

const BarChart = ({
  data = [],
  valueKey = 'count',
  labelKey = 'month',
  color = 'indigo',
  maxHeight = 160,
  valueFormatter = (v) => v,
}) => {
  const values = data.map(d => Number(d[valueKey]) || 0);
  const max = Math.max(...values, 1);
  const { from, to } = COLOR_MAP[color] || COLOR_MAP.indigo;

  return (
    <div className="flex items-end justify-between gap-1" style={{ height: `${maxHeight}px` }}>
      {data.map((item, idx) => {
        const val = Number(item[valueKey]) || 0;
        const heightPx = Math.max((val / max) * maxHeight, val > 0 ? 4 : 0);
        return (
          <div key={idx} className="flex flex-col items-center gap-1.5 flex-1 group">
            <span className="text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: to }}>
              {valueFormatter(val)}
            </span>
            <div
              className="w-full rounded-t-lg transition-all duration-500 hover:brightness-110 relative overflow-hidden"
              style={{
                height: `${heightPx}px`,
                background: `linear-gradient(to top, ${from}, ${to})`
              }}
            >
              <div className="absolute inset-0 bg-white/10 rounded-t-lg" />
            </div>
            <span className="text-[10px] text-slate-400 truncate w-full text-center">
              {item[labelKey]}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default BarChart;
