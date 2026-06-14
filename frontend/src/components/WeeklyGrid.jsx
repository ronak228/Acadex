import React from 'react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const WeeklyGrid = ({ slots, onEdit, onDelete, isAdmin }) => {
  const byDay = {};
  for (let i = 1; i <= 7; i++) byDay[i] = [];
  slots.forEach((s) => {
    if (byDay[s.dayOfWeek]) byDay[s.dayOfWeek].push(s);
  });

  return (
    <div className="grid grid-cols-7 gap-2 min-w-[900px]">
      {DAYS.map((day, idx) => (
        <div key={day} className="flex flex-col gap-2">
          <div className="text-center py-2 rounded-lg bg-brand/10 text-brand-light text-xs font-bold">
            {day}
          </div>
          {byDay[idx + 1].length === 0 ? (
            <div className="flex-1 rounded-lg border border-dashed border-slate-800 min-h-[60px]" />
          ) : (
            byDay[idx + 1].map((slot) => (
              <div
                key={slot.id}
                className="glass-card flex flex-col gap-1 p-2.5 text-xs group relative"
              >
                <span className="font-semibold text-white leading-tight line-clamp-2">{slot.subject?.name}</span>
                <span className="text-slate-400">{slot.startTime} – {slot.endTime}</span>
                {slot.room && <span className="text-slate-500">Room {slot.room}</span>}
                {slot.faculty && (
                  <span className="text-slate-500 truncate">{slot.faculty.user?.name}</span>
                )}
                {isAdmin && (
                  <div className="absolute top-1.5 right-1.5 hidden group-hover:flex gap-1">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(slot)}
                        className="p-0.5 rounded bg-brand/20 text-brand-light text-[10px] hover:bg-brand hover:text-white transition-colors"
                        title="Edit"
                      >
                        ✎
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(slot.id)}
                        className="p-0.5 rounded bg-status-danger/20 text-status-danger text-[10px] hover:bg-status-danger hover:text-white transition-colors"
                        title="Delete"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      ))}
    </div>
  );
};

export default WeeklyGrid;
