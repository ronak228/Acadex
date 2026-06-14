import React from 'react';

const ResultStatusBadge = ({ status }) => {
  const isPass = status === 'PASS';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
      isPass
        ? 'bg-status-success/15 text-status-success border border-status-success/30'
        : 'bg-status-danger/15 text-status-danger border border-status-danger/30'
    }`}>
      {isPass ? 'Pass' : 'Fail'}
    </span>
  );
};

export default ResultStatusBadge;
