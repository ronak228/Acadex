import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, UserSquare2, ClipboardList, CheckSquare, Calendar, BookOpen,
  FileText, Activity, AlertCircle, ArrowRight, GraduationCap, DollarSign,
  Plus, Search, UserPlus, CreditCard
} from 'lucide-react';
import StatsCard from './StatsCard';
import BarChart from '../../components/BarChart';
import DonutChart from '../../components/DonutChart';
import HorizontalBarChart from '../../components/HorizontalBarChart';
import Badge, { statusVariant } from '../../components/Badge';
import Button from '../../components/Button';
import authService from '../../services/authService';
import dashboardService from '../../services/dashboardService';

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-700/40 rounded-lg ${className}`} />
);

const QuickAction = ({ icon: Icon, label, onClick, color }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center justify-center gap-2.5 p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-700/50 hover:border-slate-600 transition-all group"
  >
    <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-transform group-hover:scale-110 ${color}`}>
      <Icon size={18} />
    </div>
    <span className="text-xs font-semibold text-slate-300 group-hover:text-white">{label}</span>
  </button>
);

const DashboardPage = () => {
  const navigate = useNavigate();
  const user = authService.getLocalUser() || { name: 'User', role: 'ADMIN', email: '' };
  const role = user.role;

  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    dashboardService.getDashboard()
      .then(res => setDashData(res.data))
      .catch(err => {
        setError('Failed to load dashboard data.');
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, []);

  const kpis = dashData?.kpis || {};
  const charts = dashData?.charts || {};
  const activity = dashData?.recentActivity || {};

  // ----------------------------------------------------
  // RENDER: SUPER_ADMIN / ADMIN VIEW
  // ----------------------------------------------------
  const renderAdminDashboard = () => (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Quick Actions */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-2">
          <QuickAction icon={UserPlus} label="New Admission" onClick={() => navigate('/students/add')} color="bg-brand/20 text-brand-light border-brand/30" />
          <QuickAction icon={CreditCard} label="Collect Fee" onClick={() => navigate('/fees/collect')} color="bg-emerald-500/20 text-emerald-400 border-emerald-500/30" />
          <QuickAction icon={Plus} label="Add Inquiry" onClick={() => navigate('/inquiries')} color="bg-status-info/20 text-status-info border-status-info/30" />
          <QuickAction icon={Search} label="Student Search" onClick={() => navigate('/students')} color="bg-amber-500/20 text-amber-400 border-amber-500/30" />
        </div>
      )}

      {/* Row 1: KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)
        ) : (
          <>
            <StatsCard title="Net Inquiries (Month)" value={kpis.newInquiriesThisMonth ?? 0} icon={ClipboardList} description="New leads this month" variant="indigo" />
            <StatsCard title="Active Students" value={(kpis.activeStudents ?? 0).toLocaleString()} icon={Users} description="Registered learners" variant="emerald" />
            <StatsCard title="Active Faculty" value={kpis.totalFaculty ?? 0} icon={UserSquare2} description="Onboarded staff" variant="amber" />
            <StatsCard title="Pending Admissions" value={kpis.pendingAdmissions ?? 0} icon={CheckSquare} description="Awaiting review" variant="rose" />
          </>
        )}
      </div>

      {/* Row 1b: Revenue + Overdue */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatsCard title="Revenue This Month" value={`₹${(kpis.revenueThisMonth ?? 0).toLocaleString()}`} icon={DollarSign} description="Fee collections" variant="emerald" />
          <StatsCard title="Overdue Fee Students" value={kpis.overdueFeesCount ?? 0} icon={AlertCircle} description="Students with overdue installments" variant="rose" onClick={() => navigate('/fees/due')} />
        </div>
      )}

      {/* Row 2: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card">
          <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wide mb-6">Monthly Admissions</h4>
          {loading ? <Skeleton className="h-40" /> : <BarChart data={charts.admissionsByMonth || []} valueKey="count" labelKey="month" color="indigo" maxHeight={160} />}
        </div>
        <div className="glass-card">
          <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wide mb-6">Revenue by Month</h4>
          {loading ? <Skeleton className="h-40" /> : <BarChart data={charts.revenueByMonth || []} valueKey="amount" labelKey="month" color="emerald" maxHeight={160} valueFormatter={(v) => `₹${(v / 1000).toFixed(1)}k`} />}
        </div>
      </div>

      {/* Row 3: Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Inquiries */}
        <div className="glass-panel p-0 border border-slate-700/50 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wide">Recent Inquiries</h4>
            <Button variant="ghost" size="sm" onClick={() => navigate('/inquiries')} className="text-xs">
              View All <ArrowRight size={14} />
            </Button>
          </div>
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="p-5 space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : (activity.recentInquiries || []).length > 0 ? (
              <table className="w-full text-left text-sm">
                <tbody className="divide-y divide-slate-800/50">
                  {activity.recentInquiries.map((inq) => (
                    <tr key={inq.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-4">
                        <p className="font-semibold text-white">{inq.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{inq.courseInterest || 'Unknown Course'}</p>
                      </td>
                      <td className="p-4 text-right">
                        <Badge variant={statusVariant(inq.status)} dot>{inq.status?.replace(/_/g, ' ')}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500">No recent inquiries</div>
            )}
          </div>
        </div>

        {/* Pending Admissions */}
        <div className="glass-panel p-0 border border-slate-700/50 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wide">Pending Admissions</h4>
            <Button variant="ghost" size="sm" onClick={() => navigate('/admissions')} className="text-xs">
              Review <ArrowRight size={14} />
            </Button>
          </div>
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="p-5 space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : (activity.pendingAdmissions || []).length > 0 ? (
              <table className="w-full text-left text-sm">
                <tbody className="divide-y divide-slate-800/50">
                  {activity.pendingAdmissions.map((adm) => (
                    <tr key={adm.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-4">
                        <p className="font-semibold text-white">{adm.studentName}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{adm.course?.name || 'N/A'}</p>
                      </td>
                      <td className="p-4 text-right">
                        <Badge variant="warning" dot>Pending</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500">No pending admissions</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // ----------------------------------------------------
  // RENDER: RECEPTIONIST VIEW
  // ----------------------------------------------------
  const renderReceptionistDashboard = () => {
    const rKpis = dashData?.kpis || {};
    const rActivity = dashData?.recentActivity || {};

    return (
      <div className="flex flex-col gap-6 animate-fadeIn">
        {/* Quick Actions */}
        {!loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-2">
            <QuickAction icon={Plus} label="New Inquiry" onClick={() => navigate('/inquiries')} color="bg-brand/20 text-brand-light border-brand/30" />
            <QuickAction icon={UserPlus} label="Process Admission" onClick={() => navigate('/admissions')} color="bg-emerald-500/20 text-emerald-400 border-emerald-500/30" />
            <QuickAction icon={Search} label="Lookup Student" onClick={() => navigate('/students')} color="bg-amber-500/20 text-amber-400 border-amber-500/30" />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)
          ) : (
            <>
              <StatsCard title="Today's Inquiries" value={rKpis.todayInquiries ?? 0} icon={ClipboardList} description="Walk-ins & site leads" variant="indigo" />
              <StatsCard title="Pending Admissions" value={rKpis.pendingAdmissions ?? 0} icon={CheckSquare} description="Files under review" variant="amber" />
              <StatsCard title="Follow-ups Due Today" value={rKpis.followUpsDueToday ?? 0} icon={Calendar} description="Leads scheduled" variant="rose" />
            </>
          )}
        </div>

        {/* Follow-up Reminders */}
        <div className="glass-panel p-0 border border-slate-700/50 overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wide flex items-center gap-2">
              <AlertCircle size={16} className="text-status-warning" />
              Inquiry Follow-up Reminders
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-800/50 bg-slate-800/20 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <th className="px-5 py-3">Prospect Name</th>
                  <th className="px-5 py-3">Phone</th>
                  <th className="px-5 py-3">Course Interest</th>
                  <th className="px-5 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {loading ? (
                  <tr><td colSpan={4} className="p-5"><Skeleton className="h-12" /></td></tr>
                ) : (rActivity.followUps || []).length > 0 ? (
                  (rActivity.followUps || []).map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-4 font-semibold text-white">{item.name}</td>
                      <td className="px-5 py-4 text-slate-300">{item.phone}</td>
                      <td className="px-5 py-4 text-slate-400 text-xs">{item.courseInterest || '—'}</td>
                      <td className="px-5 py-4 text-right"><Badge variant={statusVariant(item.status)}>{item.status}</Badge></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-xs text-slate-500">No follow-ups due today</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // ----------------------------------------------------
  // RENDER: FACULTY VIEW
  // ----------------------------------------------------
  const renderFacultyDashboard = () => {
    const fKpis = dashData?.kpis || {};
    const upcomingExams = dashData?.upcomingExams || [];
    const assignments = dashData?.recentAssignments || [];

    return (
      <div className="flex flex-col gap-6 animate-fadeIn">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)
          ) : (
            <>
              <StatsCard title="Assigned Batches" value={fKpis.assignedBatches ?? 0} icon={Users} description="Active teaching batches" variant="indigo" />
              <StatsCard title="Attendance (This Month)" value={fKpis.attendanceTotal ? `${fKpis.attendancePresent} / ${fKpis.attendanceTotal}` : '—'} icon={Calendar} description="Duty days present" variant="emerald" />
              <StatsCard title="Upcoming Examinations" value={fKpis.upcomingExamsCount ?? 0} icon={BookOpen} description="Scheduled ahead" variant="amber" />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-panel p-0 border border-slate-700/50 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-800">
              <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wide flex items-center gap-2">
                <Calendar size={16} className="text-brand-light" />
                Upcoming Exam Schedule
              </h4>
            </div>
            <div className="flex-1 overflow-auto divide-y divide-slate-800/50">
              {loading ? (
                <div className="p-5 space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
              ) : upcomingExams.length > 0 ? (
                upcomingExams.map((exam) => (
                  <div key={exam.id} className="p-5 flex items-center justify-between text-sm hover:bg-slate-800/30 transition-colors">
                    <div>
                      <p className="font-semibold text-white">{exam.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{exam.batch?.name} • {new Date(exam.examDate).toLocaleDateString()}</p>
                    </div>
                    <Badge variant={statusVariant(exam.examType)}>{exam.examType}</Badge>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-slate-500">No upcoming exams scheduled</div>
              )}
            </div>
          </div>

          <div className="glass-panel p-0 border border-slate-700/50 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-800">
              <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wide flex items-center gap-2">
                <FileText size={16} className="text-status-success" />
                Recent Assignments
              </h4>
            </div>
            <div className="flex-1 p-5 overflow-auto">
              {loading ? (
                <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
              ) : assignments.length > 0 ? (
                <div className="space-y-3">
                  {assignments.map((asgn) => (
                    <div key={asgn.id} onClick={() => navigate(`/assignments/${asgn.id}/submissions`)} className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:border-brand/40 hover:bg-slate-800/60 transition-colors cursor-pointer flex items-center justify-between group">
                      <div>
                        <p className="text-sm font-semibold text-white group-hover:text-brand-light transition-colors">{asgn.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{asgn.batch?.name} • {asgn.subject?.name}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-brand-light">{asgn._count?.submissions || 0}</span>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">submissions</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-slate-500">No recent assignments</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ----------------------------------------------------
  // RENDER: STUDENT VIEW
  // ----------------------------------------------------
  const renderStudentDashboard = () => {
    const sKpis = dashData?.kpis || {};
    const results = dashData?.latestResults || [];
    const pending = dashData?.pendingAssignments || [];

    return (
      <div className="flex flex-col gap-6 animate-fadeIn">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)
          ) : (
            <>
              <StatsCard title="Enrolled Batch" value={sKpis.enrolledBatch || '—'} icon={GraduationCap} description={sKpis.course || ''} variant="indigo" />
              <StatsCard title="Attendance Rate" value={`${sKpis.attendanceRate ?? 0}%`} icon={Activity} description={`Present: ${sKpis.attendancePresent ?? 0}, Absent: ${(sKpis.attendanceTotal ?? 0) - (sKpis.attendancePresent ?? 0)}`} variant="emerald" />
              <StatsCard title="Completed Exams" value={sKpis.completedExams ?? 0} icon={BookOpen} description="Examination records" variant="amber" />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Assignments */}
          <div className="glass-panel p-0 border border-slate-700/50 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-800">
              <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wide">Pending Assignments</h4>
            </div>
            <div className="flex-1 p-5 overflow-auto">
              {loading ? (
                <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
              ) : pending.length > 0 ? (
                <div className="space-y-3">
                  {pending.map((asgn) => (
                    <div key={asgn.id} className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
                      <p className="text-sm font-semibold text-white">{asgn.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{asgn.subject?.name}</p>
                      <p className="text-xs font-medium text-status-warning mt-2 flex items-center gap-1.5">
                        <Calendar size={12} /> Due: {new Date(asgn.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-slate-500">No pending assignments</div>
              )}
            </div>
          </div>

          {/* Latest Results */}
          <div className="glass-panel p-0 border border-slate-700/50 overflow-hidden flex flex-col lg:col-span-2">
            <div className="p-5 border-b border-slate-800">
              <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wide">Latest Results</h4>
            </div>
            <div className="flex-1 p-5 overflow-auto">
              {loading ? (
                <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
              ) : results.length > 0 ? (
                <div className="space-y-3">
                  {results.map((r) => (
                    <div key={r.id} className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-center justify-between text-sm">
                      <div>
                        <p className="font-semibold text-white">{r.exam?.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">Score: {parseFloat(r.marksObtained)} / {r.exam?.totalMarks}</p>
                      </div>
                      <Badge variant={statusVariant(r.status)} size="md">{r.status}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-500">No exam results yet</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-1.5 animate-fadeIn">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-heading">
          Welcome back, {user.name.split(' ')[0]}
        </h1>
        <p className="text-xs md:text-sm text-slate-400">
          Here is your overview for today:{' '}
          <span className="font-medium text-slate-300">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </p>
        {error && (
          <p className="text-sm text-status-danger mt-2 flex items-center gap-1.5 font-medium p-2 rounded-lg bg-status-danger/10 border border-status-danger/20 w-fit">
            <AlertCircle size={14} /> {error}
          </p>
        )}
      </div>

      {role === 'SUPER_ADMIN' || role === 'ADMIN' ? renderAdminDashboard() : null}
      {role === 'RECEPTIONIST' && renderReceptionistDashboard()}
      {role === 'FACULTY' && renderFacultyDashboard()}
      {role === 'STUDENT' && renderStudentDashboard()}
    </>
  );
};

export default DashboardPage;
