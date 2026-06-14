import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, BookOpen, Calendar } from 'lucide-react';
import Table from '../../components/Table';
import Button from '../../components/Button';
import batchService from '../../services/batchService';

const BatchDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    batchService.getBatchById(id)
      .then((data) => { setBatch(data); })
      .catch(() => { setBatch(null); })
      .finally(() => { setLoading(false); });
  }, [id]);

  const studentHeaders = [
    { key: 'rollNumber', label: 'Roll No.', sortable: true },
    { key: 'name', label: 'Name', render: (row) => row.user?.name || 'N/A', sortable: true },
    { key: 'email', label: 'Email', render: (row) => row.user?.email || 'N/A' },
    { key: 'phone', label: 'Phone', render: (row) => row.user?.phone || '—' },
    {
      key: 'isActive', label: 'Status',
      render: (row) => (
        <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded-full ${row.isActive ? 'bg-status-success/15 text-status-success' : 'bg-status-danger/15 text-status-danger'}`}>
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      )
    }
  ];

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center h-64 text-slate-400">Loading batch details...</div>
      </>
    );
  }

  if (!batch) {
    return (
      <>
        <div className="flex items-center justify-center h-64 text-status-danger">Batch not found.</div>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/batches')}
            className="p-2 rounded-lg bg-bg-surfaceLight hover:bg-slate-600 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-heading">{batch.name}</h1>
            <p className="text-xs text-slate-400">{batch.course?.name} ({batch.course?.code})</p>
          </div>
          <span className={`ml-auto inline-flex px-3 py-1 text-xs font-bold rounded-full ${batch.isActive ? 'bg-status-success/15 text-status-success' : 'bg-status-danger/15 text-status-danger'}`}>
            {batch.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-brand/10">
              <Users size={18} className="text-brand-light" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Enrolled Students</p>
              <p className="text-xl font-bold text-white">{batch.students?.length || 0}</p>
            </div>
          </div>
          <div className="glass-card flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-500/10">
              <BookOpen size={18} className="text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Faculty</p>
              <p className="text-sm font-semibold text-white">{batch.faculty?.user?.name || 'Not Assigned'}</p>
            </div>
          </div>
          <div className="glass-card flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-500/10">
              <Calendar size={18} className="text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Duration</p>
              <p className="text-sm font-semibold text-white">
                {new Date(batch.startDate).toLocaleDateString()}
                {batch.endDate ? ` → ${new Date(batch.endDate).toLocaleDateString()}` : ' → Ongoing'}
              </p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-white font-heading mb-3">Enrolled Students</h2>
          <Table
            headers={studentHeaders}
            data={batch.students || []}
            loading={false}
            emptyMessage="No students enrolled in this batch."
          />
        </div>

        <div className="flex gap-3">
          <Button variant="primary" onClick={() => navigate(`/student-attendance?batchId=${id}`)}>
            Mark Attendance
          </Button>
          <Button variant="ghost" onClick={() => navigate(`/timetable?batchId=${id}`)}>
            View Timetable
          </Button>
          <Button variant="ghost" onClick={() => navigate(`/syllabus?batchId=${id}`)}>
            Syllabus Progress
          </Button>
        </div>
      </div>
    </>
  );
};

export default BatchDetail;
