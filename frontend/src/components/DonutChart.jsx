import React from 'react';

const DonutChart = ({ pass = 0, fail = 0, size = 120 }) => {
  const total = pass + fail;
  const passPercent = total > 0 ? (pass / total) * 100 : 0;
  const failPercent = 100 - passPercent;

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const strokeWidth = 14;

  const passDash = (passPercent / 100) * circumference;
  const failDash = (failPercent / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background ring */}
          <circle
            cx={center} cy={center} r={radius}
            fill="none" stroke="#1e293b" strokeWidth={strokeWidth}
          />
          {/* Fail segment (rendered first, full circle) */}
          {failPercent > 0 && (
            <circle
              cx={center} cy={center} r={radius}
              fill="none"
              stroke="#E11D48"
              strokeWidth={strokeWidth}
              strokeDasharray={`${failDash} ${circumference - failDash}`}
              strokeDashoffset={-passDash}
              strokeLinecap="round"
            />
          )}
          {/* Pass segment */}
          {passPercent > 0 && (
            <circle
              cx={center} cy={center} r={radius}
              fill="none"
              stroke="#10B981"
              strokeWidth={strokeWidth}
              strokeDasharray={`${passDash} ${circumference - passDash}`}
              strokeLinecap="round"
            />
          )}
        </svg>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-extrabold text-white">
            {total > 0 ? `${Math.round(passPercent)}%` : '—'}
          </span>
          <span className="text-[9px] text-slate-400 uppercase tracking-wider">Pass</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
          <span className="text-slate-300">Pass <span className="font-bold text-white">{pass}</span></span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
          <span className="text-slate-300">Fail <span className="font-bold text-white">{fail}</span></span>
        </div>
      </div>
    </div>
  );
};

export default DonutChart;
