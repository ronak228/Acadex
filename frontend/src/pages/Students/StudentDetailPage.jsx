import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Edit, Mail, Phone, Award, User, BookOpen,
  ShieldX, UserCheck, X
} from 'lucide-react';
import Button from '../../components/Button';
import Badge, { statusVariant } from '../../components/Badge';
import ConfirmDialog from '../../components/ConfirmDialog';
import Tabs from '../../components/Tabs';
import PageHeader from '../../components/PageHeader';
import studentService from '../../services/studentService';
import authService from '../../services/authService';

/* ─── Info Row ────────────────────────────────── */
const InfoRow = ({ label, value }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-xs text-slate-500 font-medium">{label}</span>
    <span className="text-sm text-slate-200 font-medium">{value || '—'}</span>
  </div>
);

/* ─── Alert Banner ────────────────────────────── */
const AlertBanner = ({ alert, onDismiss }) => {
  if (!alert) return null;
  const isSuccess = alert.type === 'success';
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium animate-fadeIn
      ${isSuccess
        ? 'bg-status-success/10 border-status-success/25 text-status-success'
        : 'bg-status-danger/10 border-status-danger/25 text-status-danger'}`}
    >
      <span className="flex-1">{alert.message}</span>
      <button onClick={onDismiss} className="opacity-70 hover:opacity-100">
        <X size={14} />
      </button>
    </div>
  );
};

/* ─── Skeleton ────────────────────────────────── */
const DetailSkeleton = () => (
  <div className="flex flex-col gap-6 animate-pulse">
    <div className="h-10 bg-slate-700/40 rounded-xl w-64" />
    <div className="glass-panel h-28" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="h-48 bg-slate-700/40 rounded-xl" />
      <div className="md:col-span-2 h-64 bg-slate-700/40 rounded-xl" />
    </div>
  </div>
);

/* ─── Page ────────────────────────────────────── */
const StudentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = authService.getLocalUser() || { role: 'FACULTY' };
  const isReadOnly  = currentUser.role === 'FACULTY';

  const [student, setStudent]       = useState(null);
  const [results, setResults]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [alert, setAlert]           = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [activeTab, setActiveTab]   = useState('profile');

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const [studentData, resultsData] = await Promise.all([
        studentService.getStudentById(id),
        studentService.getStudentResults(id),
      ]);
      setStudent(studentData);
      setResults(resultsData);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load student details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleToggleStatus = async () => {
    setConfirmLoading(true);
    try {
      const nextStatus = !student.isActive;
      const res = await studentService.toggleStudentStatus(student.id, nextStatus);
      if (res.success) {
        showAlert('success', `Student ${nextStatus ? 'activated' : 'deactivated'} successfully.`);
        load();
      }
    } catch (err) {
      showAlert('danger', err.response?.data?.message || 'Failed to update status.');
    } finally {
      setConfirmLoading(false);
      setShowConfirm(false);
    }
  };

  if (loading) {
    return <><DetailSkeleton /></>;
  }

  if (error || !student) {
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <div className="glass-panel text-center max-w-sm">
            <p className="text-status-danger font-medium">{error || 'Student not found.'}</p>
            <Button variant="outline" onClick={() => navigate('/students')} className="mt-4 gap-2">
              <ArrowLeft size={15} /> Back to Registry
            </Button>
          </div>
        </div>
      </>
    );
  }

  const initials = student.user?.name
    ?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || '??';

  return (
    <>
      <div className="flex flex-col gap-6">

        {/* Page Header */}
        <PageHeader
          breadcrumb={[{ label: 'Students', href: '/students' }, { label: student.user?.name || 'Profile' }]}
          title={student.user?.name || 'Student Profile'}
          subtitle={`${student.rollNumber} · ${student.course?.name || 'No Course'}`}
          actions={
            !isReadOnly && (
              <div className="flex gap-2">
                <Button
                  variant="danger-outline"
                  size="sm"
                  onClick={() => setShowConfirm(true)}
                >
                  {student.isActive ? <><ShieldX size={14} /> Deactivate</> : <><UserCheck size={14} /> Activate</>}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate(`/students/edit/${student.id}`)}
                >
                  <Edit size={14} /> Edit Profile
                </Button>
              </div>
            )
          }
        />

        {/* Alert */}
        <AlertBanner alert={alert} onDismiss={() => setAlert(null)} />

        {/* Profile Hero Card */}
        <div className="glass-panel flex flex-col sm:flex-row sm:items-center gap-5">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand/40 to-brand-dark/40 flex items-center justify-center text-brand-light font-extrabold text-xl border border-brand/30 shrink-0">
            {initials}
          </div>

          {/* Core info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-extrabold text-white">{student.user?.name}</h2>
              <Badge variant={student.isActive ? 'success' : 'danger'} dot>
                {student.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="text-sm text-slate-400 mt-0.5 font-mono">{student.rollNumber}</p>
          </div>

          {/* Quick stats strip */}
          <div className="flex sm:flex-col gap-4 sm:gap-2 sm:text-right shrink-0 border-t sm:border-t-0 sm:border-l border-slate-800 pt-4 sm:pt-0 sm:pl-6">
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Batch</p>
              <p className="text-sm font-bold text-slate-200 mt-0.5">{student.batch?.name || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Enrolled</p>
              <p className="text-sm font-bold text-slate-200 mt-0.5">
                {new Date(student.enrolledAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultTab="profile" value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab id="profile" icon={User}>Profile</Tabs.Tab>
            <Tabs.Tab id="results" icon={Award} count={results.length}>Results</Tabs.Tab>
          </Tabs.List>

          {/* Tab: Profile */}
          <Tabs.Panel id="profile">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">

              {/* Left column — contact + guardian */}
              <div className="flex flex-col gap-4">
                {/* Contact */}
                <div className="glass-card flex flex-col gap-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2.5">
                    <Mail size={13} className="text-brand-light" /> Contact
                  </h3>
                  <div className="flex flex-col gap-3">
                    <InfoRow label="Email" value={student.user?.email} />
                    <InfoRow label="Phone" value={student.user?.phone} />
                    <InfoRow label="Address" value={student.address} />
                  </div>
                </div>

                {/* Guardian */}
                <div className="glass-card flex flex-col gap-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2.5">
                    <Phone size={13} className="text-brand-light" /> Guardian
                  </h3>
                  <div className="flex flex-col gap-3">
                    <InfoRow label="Name" value={student.parentName} />
                    <InfoRow label="Phone" value={student.parentPhone} />
                  </div>
                </div>
              </div>

              {/* Right column — personal specs */}
              <div className="md:col-span-2">
                <div className="glass-panel flex flex-col gap-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2.5">
                    Personal Details
                  </h3>
                  <div className="grid grid-cols-2 gap-5">
                    <InfoRow
                      label="Date of Birth"
                      value={new Date(student.dateOfBirth).toLocaleDateString(undefined, {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    />
                    <InfoRow label="Gender" value={student.gender ? student.gender.charAt(0) + student.gender.slice(1).toLowerCase() : '—'} />
                    <InfoRow label="Course" value={student.course?.name} />
                    <InfoRow label="Batch" value={student.batch?.name} />
                  </div>
                </div>
              </div>
            </div>
          </Tabs.Panel>

          {/* Tab: Results */}
          <Tabs.Panel id="results">
            <div className="mt-5">
              {results.length === 0 ? (
                <div className="glass-panel text-center py-12">
                  <BookOpen size={32} className="text-slate-600 mx-auto mb-3" strokeWidth={1.5} />
                  <p className="text-sm font-semibold text-slate-400">No examination records yet</p>
                  <p className="text-xs text-slate-600 mt-1">Results will appear here once exams are graded.</p>
                </div>
              ) : (
                <div className="glass-panel overflow-x-auto p-0 rounded-xl">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500 text-xs font-bold uppercase tracking-wider">
                        <th className="px-5 py-3.5">Exam</th>
                        <th className="px-5 py-3.5">Type</th>
                        <th className="px-5 py-3.5 text-center">Score</th>
                        <th className="px-5 py-3.5 text-right">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {results.map(res => (
                        <tr key={res.id} className="hover:bg-slate-800/20 transition-colors">
                          <td className="px-5 py-3.5">
                            <p className="font-semibold text-white">{res.exam?.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {new Date(res.exam?.examDate).toLocaleDateString()}
                            </p>
                          </td>
                          <td className="px-5 py-3.5 capitalize text-slate-400 text-xs">
                            {res.exam?.examType?.toLowerCase()}
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span className="font-bold text-slate-200">{res.marksObtained}</span>
                            <span className="text-slate-500 text-xs"> / {res.exam?.totalMarks}</span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <Badge variant={statusVariant(res.status)}>
                              {res.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Tabs.Panel>
        </Tabs>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleToggleStatus}
        loading={confirmLoading}
        title={student.isActive ? 'Deactivate Student Account?' : 'Activate Student Account?'}
        description={
          student.isActive
            ? "This will revoke the student's portal access. They won't be able to log in until reactivated."
            : "This will restore the student's portal access and login capability."
        }
        confirmLabel={student.isActive ? 'Yes, Deactivate' : 'Yes, Activate'}
        variant={student.isActive ? 'danger' : 'default'}
        icon={student.isActive ? ShieldX : UserCheck}
      />
    </>
  );
};

export default StudentDetailPage;
