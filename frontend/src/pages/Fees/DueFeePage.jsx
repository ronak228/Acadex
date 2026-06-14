import React, { useState, useEffect } from 'react';
import { Search, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Table from '../../components/Table';
import PageHeader from '../../components/PageHeader';
import feeService from '../../services/feeService';

const fmt = (v) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

const DueFeePage = () => {
  const navigate = useNavigate();
  const [dueList, setDueList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 15;

  const loadDueFees = async () => {
    setLoading(true);
    try {
      const res = await feeService.getDueFees();
      const list = res.data || [];
      setDueList(
        search
          ? list.filter((s) => s.user?.name?.toLowerCase().includes(search.toLowerCase()) || s.rollNumber?.includes(search))
          : list
      );
    } catch {
      setDueList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDueFees();
    setCurrentPage(1);
  }, [search]);

  const headers = [
    { key: 'student', label: 'Student', render: (row) => (
      <div>
        <p className="font-semibold text-white">{row.user?.name}</p>
        <p className="text-xs text-slate-400">{row.rollNumber}</p>
      </div>
    )},
    { key: 'course', label: 'Course', render: (row) => row.course?.name || '—' },
    { key: 'batch', label: 'Batch', render: (row) => row.batch?.name || '—' },
    { key: 'contact', label: 'Phone', render: (row) => row.user?.phone || row.parentPhone || '—' },
    {
      key: 'overdueInstallments',
      label: 'Overdue Installments',
      render: (row) => (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded-full bg-status-danger/15 text-status-danger border border-status-danger/30">
          <AlertCircle size={11} /> {row.overdueInstallments}
        </span>
      )
    },
    {
      key: 'totalAmountDue',
      label: 'Amount Due',
      render: (row) => (
        <span className="font-bold text-status-danger">{fmt(row.totalAmountDue)}</span>
      )
    }
  ];

  const tableActions = (row) => (
    <button
      onClick={() => navigate(`/fees/students?studentId=${row.id}&fromDueFees=true`)}
      className="p-1.5 rounded bg-brand/10 hover:bg-brand text-brand-light hover:text-white transition-colors text-xs font-semibold px-3"
      title="View Student Fees"
    >
      View
    </button>
  );

  const totalPages = Math.ceil(dueList.length / limit) || 1;
  const paginatedData = dueList.slice((currentPage - 1) * limit, currentPage * limit);

  const totalAmountDue = dueList.reduce((s, r) => s + r.totalAmountDue, 0);

  return (
    <>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Due Fees"
          subtitle="Students with overdue installments."
          actions={
            <div className="text-right">
              <p className="text-xs text-slate-400">Total Outstanding</p>
              <p className="text-xl font-extrabold text-status-danger">{fmt(totalAmountDue)}</p>
            </div>
          }
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card flex items-center gap-4">
            <div className="p-3 rounded-xl bg-status-danger/15">
              <AlertCircle className="text-status-danger" size={22} />
            </div>
            <div>
              <p className="text-xs text-slate-400">Students with Dues</p>
              <p className="text-2xl font-extrabold text-white">{dueList.length}</p>
            </div>
          </div>
          <div className="glass-card flex items-center gap-4">
            <div className="p-3 rounded-xl bg-status-danger/10">
              <AlertCircle className="text-status-danger" size={22} />
            </div>
            <div>
              <p className="text-xs text-slate-400">Total Overdue Amount</p>
              <p className="text-xl font-extrabold text-status-danger">{fmt(totalAmountDue)}</p>
            </div>
          </div>
          <div className="glass-card flex items-center gap-4">
            <div className="p-3 rounded-xl bg-yellow-500/10">
              <AlertCircle className="text-yellow-400" size={22} />
            </div>
            <div>
              <p className="text-xs text-slate-400">Avg Due Per Student</p>
              <p className="text-xl font-extrabold text-yellow-400">
                {dueList.length > 0 ? fmt(totalAmountDue / dueList.length) : '₹0'}
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="glass-card">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Search</label>
            <div className="relative flex items-center">
              <Search size={16} className="absolute left-3 text-slate-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by name or roll number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none glass-input"
              />
            </div>
          </div>
        </div>

        <Table
          headers={headers}
          data={paginatedData}
          loading={loading}
          actions={tableActions}
          emptyMessage="No overdue fees found."
          pagination={{ currentPage, totalPages, limit, onPageChange: setCurrentPage, onLimitChange: () => {} }}
        />
      </div>
    </>
  );
};

export default DueFeePage;
