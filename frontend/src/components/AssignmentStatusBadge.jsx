import React from 'react';

const STATUS_CONFIG = {
  DRAFT: { label: 'Draft', classes: 'bg-slate-700 text-slate-300' },
  PUBLISHED: { label: 'Published', classes: 'bg-status-success/15 text-status-success' },
  CLOSED: { label: 'Closed', classes: 'bg-status-danger/15 text-status-danger' }
};

const AssignmentStatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || { label: status, classes: 'bg-slate-700 text-slate-300' };
  return (
    <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded-full ${config.classes}`}>
      {config.label}
    </span>
  );
};

export default AssignmentStatusBadge;
