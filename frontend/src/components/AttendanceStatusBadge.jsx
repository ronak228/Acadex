import React from 'react';

const STATUS_CONFIG = {
  PRESENT: { label: 'Present', classes: 'bg-status-success/15 text-status-success' },
  ABSENT: { label: 'Absent', classes: 'bg-status-danger/15 text-status-danger' },
  HALF_DAY: { label: 'Half Day', classes: 'bg-yellow-500/15 text-yellow-400' },
  ON_LEAVE: { label: 'On Leave', classes: 'bg-blue-500/15 text-blue-400' }
};

const AttendanceStatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || { label: status, classes: 'bg-slate-700 text-slate-300' };
  return (
    <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded-full ${config.classes}`}>
      {config.label}
    </span>
  );
};

export default AttendanceStatusBadge;
