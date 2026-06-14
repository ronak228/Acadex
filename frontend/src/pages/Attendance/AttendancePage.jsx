import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, CheckCircle, Clock, AlertTriangle, Users, BookOpen } from 'lucide-react';
import Table from '../../components/Table';
import Select from '../../components/Select';
import Button from '../../components/Button';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import attendanceService from '../../services/attendanceService';
import facultyService from '../../services/facultyService';
import authService from '../../services/authService';

const AttendancePage = () => {
  const navigate = useNavigate();
  const currentUser = authService.getLocalUser() || { id: 'f1', role: 'FACULTY', name: 'User' };
  const isAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN';

  // Date Selection States (default to current month/year)
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(String(today.getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(String(today.getFullYear()));

  // Data States
  const [facultySummaryList, setFacultySummaryList] = useState([]); // for Admin
  const [personalSummary, setPersonalSummary] = useState(null); // for Faculty
  const [loading, setLoading] = useState(false);
  const [selectedFacultyCalendar, setSelectedFacultyCalendar] = useState(null); // for Admin checking faculty cell details

  const months = [
    { value: '1', label: 'January' }, { value: '2', label: 'February' },
    { value: '3', label: 'March' }, { value: '4', label: 'April' },
    { value: '5', label: 'May' }, { value: '6', label: 'June' },
    { value: '7', label: 'July' }, { value: '8', label: 'August' },
    { value: '9', label: 'September' }, { value: '10', label: 'October' },
    { value: '11', label: 'November' }, { value: '12', label: 'December' }
  ];

  const years = [
    { value: '2026', label: '2026' },
    { value: '2025', label: '2025' }
  ];

  // Fetch summaries
  const loadData = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        // 1. Fetch active faculty list
        const facList = await facultyService.getFaculty();
        const activeFac = facList.filter(f => f.isActive);
        
        // 2. Fetch monthly summaries in bulk
        const bulkSummaries = await attendanceService.getBulkFacultySummary(selectedMonth, selectedYear);
        
        const summaries = activeFac.map((fac) => {
          return {
            ...fac,
            summary: bulkSummaries[fac.id] || {
              daysPresent: 0,
              daysAbsent: 0,
              halfDays: 0,
              leaves: 0,
              effectiveDays: 0,
              records: [],
              totalCalendarDays: 0
            }
          };
        });
        setFacultySummaryList(summaries);
      } else {
        const facObj = await facultyService.getMyFaculty();
        if (facObj) {
          const sum = await attendanceService.getFacultySummary(facObj.id, selectedMonth, selectedYear);
          setPersonalSummary({
            profile: facObj,
            summary: sum
          });
        }
      }
    } catch (err) {
      console.error('Error loading attendance summaries:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [selectedMonth, selectedYear]);

  // Calendar rendering helper logic
  const renderCalendarGrid = (summaryData) => {
    if (!summaryData) return null;
    const { month, year, records } = summaryData;
    
    const firstDay = new Date(Number(year), Number(month) - 1, 1).getDay(); // weekday offset (0-6)
    const daysInMonth = new Date(Number(year), Number(month), 0).getDate(); // total days

    const dayCells = [];
    // 1. Offset spacer cells
    for (let i = 0; i < firstDay; i++) {
      dayCells.push(<div key={`spacer-${i}`} className="h-16 border border-slate-800/40 bg-slate-900/10" />);
    }

    // 2. Calendar active day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const record = records.find(r => {
        if (!r.date) return false;
        const rDateStr = typeof r.date === 'string' ? r.date.split('T')[0] : new Date(r.date).toISOString().split('T')[0];
        return rDateStr === dateStr;
      });
      
      let statusColor = 'bg-slate-800/30 text-slate-500 border-slate-800/40';
      if (record) {
        if (record.status === 'PRESENT') statusColor = 'bg-status-success/15 border-status-success/30 text-status-success';
        if (record.status === 'ABSENT') statusColor = 'bg-status-danger/15 border-status-danger/30 text-status-danger';
        if (record.status === 'HALF_DAY') statusColor = 'bg-status-warning/15 border-status-warning/30 text-status-warning';
        if (record.status === 'ON_LEAVE') statusColor = 'bg-slate-700/20 border-slate-600/30 text-slate-400';
      }

      dayCells.push(
        <div 
          key={`day-${day}`} 
          className={`h-16 p-1 border rounded-lg flex flex-col justify-between transition-all duration-200 ${statusColor}`}
          title={record && record.note ? `Note: ${record.note}` : undefined}
        >
          <span className="text-xs font-bold">{day}</span>
          {record && (
            <span className="text-[9px] font-extrabold tracking-wide uppercase truncate self-end px-1.5 py-0.5 rounded bg-black/10 border border-white/5">
              {record.status.replace('_', ' ')}
            </span>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-4">
        {/* Calendar stats indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-bg-surface/30 p-4 border border-slate-800 rounded-xl">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded bg-status-success/15 border border-status-success/30" />
            <span className="text-xs text-slate-300 font-medium">Present ({summaryData.daysPresent})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded bg-status-danger/15 border border-status-danger/30" />
            <span className="text-xs text-slate-300 font-medium">Absent ({summaryData.daysAbsent})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded bg-status-warning/15 border border-status-warning/30" />
            <span className="text-xs text-slate-300 font-medium">Half Day ({summaryData.halfDays})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded bg-slate-700/20 border border-slate-600/30" />
            <span className="text-xs text-slate-300 font-medium">On-Leave ({summaryData.leaves})</span>
          </div>
        </div>

        {/* Calendar grid */}
        <div className="glass-panel p-4 rounded-xl border border-slate-700/50">
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400 mb-2 py-1 bg-slate-800/20 rounded">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {dayCells}
          </div>
        </div>
      </div>
    );
  };

  // Define Admin Table Headers
  const adminTableHeaders = [
    { key: 'employeeCode', label: 'Faculty Code', sortable: true },
    { 
      key: 'name', 
      label: 'Full Name', 
      sortable: true,
      render: (row) => row.user?.name || 'N/A'
    },
    { key: 'department', label: 'Department' },
    { 
      key: 'daysPresent', 
      label: 'Present',
      render: (row) => row.summary?.daysPresent || 0
    },
    { 
      key: 'daysAbsent', 
      label: 'Absent',
      render: (row) => row.summary?.daysAbsent || 0
    },
    { 
      key: 'halfDays', 
      label: 'Half Days',
      render: (row) => row.summary?.halfDays || 0
    },
    { 
      key: 'leaves', 
      label: 'Leaves',
      render: (row) => row.summary?.leaves || 0
    },
    { 
      key: 'effectiveDays', 
      label: 'Effective Days',
      render: (row) => (
        <span className="font-bold text-white bg-brand/20 px-2 py-0.5 rounded border border-brand/35 text-xs">
          {row.summary?.effectiveDays || 0}
        </span>
      )
    }
  ];

  // Action audit cell trigger
  const adminTableActions = (row) => {
    return (
      <button
        onClick={() => setSelectedFacultyCalendar(row)}
        className="px-2.5 py-1 rounded bg-bg-surfaceLight hover:bg-slate-600 text-xs text-slate-300 hover:text-white transition-all flex items-center gap-1 cursor-pointer font-medium border border-slate-700/50"
      >
        <Calendar size={13} />
        <span>View Calendar</span>
      </button>
    );
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        
        {/* Header Toolbar */}
        <PageHeader
          title="Attendance Logs"
          subtitle={isAdmin
            ? 'Audit faculty monthly logs summaries and perform daily presence roll-calls.'
            : 'Monitor your monthly schedule check-ins, leaves records, and duty aggregates.'}
          actions={isAdmin && (
            <Button variant="primary" onClick={() => navigate('/attendance/mark')} className="flex items-center gap-2">
              <Calendar size={16} />
              <span>Mark Attendance</span>
            </Button>
          )}
        />

        {/* Filters Box */}
        <div className="glass-card flex flex-wrap gap-4 items-end max-w-lg">
          <Select
            label="Month"
            name="monthSelect"
            options={months}
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            placeholder={null}
            className="w-40"
          />

          <Select
            label="Year"
            name="yearSelect"
            options={years}
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            placeholder={null}
            className="w-32"
          />
        </div>

        {/* ------------------------------------------------ */}
        {/* VIEWPORT: FACULTY USER CALENDAR */}
        {/* ------------------------------------------------ */}
        {!isAdmin && personalSummary && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Aggregate Summary Widget */}
            <div className="flex flex-col gap-4">
              <div className="glass-panel p-6 rounded-xl border border-slate-700/50 flex flex-col gap-3">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                  <div className="w-10 h-10 rounded-full bg-brand/30 flex items-center justify-center text-brand-light font-bold text-sm">
                    {personalSummary.profile.user.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h4 className="font-bold text-white">{personalSummary.profile.user.name}</h4>
                    <p className="text-[10px] text-slate-500 font-mono">{personalSummary.profile.employeeCode} • {personalSummary.profile.designation}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 text-xs">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Effective Duty Days</span>
                    <span className="font-bold text-white text-sm bg-brand/20 border border-brand/30 px-2 py-0.5 rounded">
                      {personalSummary.summary.effectiveDays}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Total Calendar Days</span>
                    <span className="font-semibold text-slate-200">{personalSummary.summary.totalCalendarDays}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Calendar Widget */}
            <div className="lg:col-span-2">
              {renderCalendarGrid(personalSummary.summary)}
            </div>

          </div>
        )}

        {/* ------------------------------------------------ */}
        {/* VIEWPORT: ADMIN AUDIT ROSTER */}
        {/* ------------------------------------------------ */}
        {isAdmin && (
          <Table
            headers={adminTableHeaders}
            data={facultySummaryList}
            loading={loading}
            actions={adminTableActions}
            emptyMessage="No faculty summaries active for this date."
          />
        )}

        {/* Admin Audit Faculty Specific Calendar Modal */}
        <Modal
          isOpen={!!selectedFacultyCalendar}
          onClose={() => setSelectedFacultyCalendar(null)}
          title={selectedFacultyCalendar ? `Attendance Calendar — ${selectedFacultyCalendar.user.name}` : ''}
          maxWidth="max-w-2xl"
        >
          {selectedFacultyCalendar && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between text-xs p-3 rounded-lg bg-bg-deep/40 border border-slate-700/30">
                <span className="font-semibold text-slate-300">{selectedFacultyCalendar.employeeCode} • {selectedFacultyCalendar.designation}</span>
                <span className="font-bold text-brand-light bg-brand/10 border border-brand/20 px-2 py-0.5 rounded">
                  Effective Duty Days: {selectedFacultyCalendar.summary?.effectiveDays || 0}
                </span>
              </div>
              
              {renderCalendarGrid(selectedFacultyCalendar.summary)}
            </div>
          )}
        </Modal>

      </div>
    </>
  );
};

export default AttendancePage;
