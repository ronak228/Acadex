import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Search, Calendar, AlertCircle } from 'lucide-react';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import facultyService from '../../services/facultyService';
import attendanceService from '../../services/attendanceService';

const AttendanceMarkForm = () => {
  const navigate = useNavigate();

  // Date and filter states
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');

  // Profiles list state
  const [faculty, setFaculty] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({}); // { [facultyId]: { status, note } }
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Load faculty on mount and set default status
  useEffect(() => {
    const loadFacultyList = async () => {
      setLoading(true);
      const list = await facultyService.getFaculty();
      const activeList = list.filter(f => f.isActive);
      setFaculty(activeList);

      // Fetch existing records for selectedDate to allow correcting mistakes (upsert)
      const existing = await attendanceService.getAttendanceList({ date: selectedDate });
      
      const records = {};
      // Initialize default statuses
      activeList.forEach(fac => {
        const found = existing.find(rec => rec.facultyId === fac.id);
        records[fac.id] = {
          status: found ? found.status : 'PRESENT',
          note: found ? found.note : ''
        };
      });
      setAttendanceRecords(records);
      setLoading(false);
    };
    loadFacultyList();
  }, [selectedDate]);

  const handleStatusChange = (facId, status) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [facId]: {
        ...prev[facId],
        status
      }
    }));
  };

  const handleNoteChange = (facId, note) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [facId]: {
        ...prev[facId],
        note
      }
    }));
  };

  // Quick Action: Mark all filtered as PRESENT
  const handleMarkAllPresent = () => {
    const nextRecords = { ...attendanceRecords };
    filteredFaculty.forEach(fac => {
      nextRecords[fac.id] = {
        ...nextRecords[fac.id],
        status: 'PRESENT'
      };
    });
    setAttendanceRecords(nextRecords);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSubmitting(true);

    const payload = {
      date: selectedDate,
      records: Object.keys(attendanceRecords).map(facId => ({
        facultyId: facId,
        status: attendanceRecords[facId].status,
        note: attendanceRecords[facId].note
      }))
    };

    try {
      const res = await attendanceService.markAttendance(payload);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => navigate('/attendance'), 1500);
      }
    } catch (err) {
      setError('Failed to log daily attendance records.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filters mapping
  const filteredFaculty = faculty.filter(fac => {
    const matchSearch = fac.user.name.toLowerCase().includes(search.toLowerCase()) || fac.employeeCode.toLowerCase().includes(search.toLowerCase());
    const matchDept = selectedDept === '' || fac.department === selectedDept;
    return matchSearch && matchDept;
  });

  return (
    <>
      <div className="flex flex-col gap-6 max-w-5xl mx-auto">
        
        {/* Navigation Toolbar */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/attendance')}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-heading">
              Daily Attendance Marks
            </h1>
            <p className="text-xs md:text-sm text-slate-400">
              Audit and record faculty presence status. Upserts are supported to correct mistakes.
            </p>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="flex gap-2.5 p-3 rounded-lg bg-status-danger/15 border border-status-danger/30 text-status-danger text-sm">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex gap-2.5 p-3 rounded-lg bg-status-success/15 border border-status-success/30 text-status-success text-sm">
            <Check size={18} className="shrink-0 mt-0.5" />
            <span>Attendance records logged successfully! Returning to logs...</span>
          </div>
        )}

        {/* Form controls */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          
          {/* Calendar & Filters Toolbar */}
          <div className="glass-card grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="attnDate" className="text-sm font-medium text-slate-300 font-heading">
                Attendance Date
              </label>
              <div className="relative flex items-center">
                <Calendar size={16} className="absolute left-3 text-slate-500 pointer-events-none" />
                <input
                  id="attnDate"
                  type="date"
                  value={selectedDate}
                  max={today} // blocks future dates
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none glass-input"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="attnSearch" className="text-sm font-medium text-slate-300 font-heading">
                Search Staff
              </label>
              <div className="relative flex items-center">
                <Search size={16} className="absolute left-3 text-slate-500 pointer-events-none" />
                <input
                  id="attnSearch"
                  type="text"
                  placeholder="Name or employee code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none glass-input"
                />
              </div>
            </div>

            <Select
              label="Filter Department"
              name="attnDept"
              options={[
                { value: 'Computer Science', label: 'Computer Science' },
                { value: 'Information Technology', label: 'Information Tech' },
                { value: 'Mathematics', label: 'Mathematics' },
                { value: 'Applied Sciences', label: 'Applied Sciences' },
              ]}
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              placeholder="All Departments"
            />

            <Button
              variant="secondary"
              type="button"
              onClick={handleMarkAllPresent}
              disabled={loading || filteredFaculty.length === 0}
              className="w-full flex items-center justify-center gap-1.5"
            >
              <Check size={16} className="text-status-success" />
              <span>Mark Filtered Present</span>
            </Button>
          </div>

          {/* Checklist table */}
          <div className="w-full overflow-x-auto rounded-xl border border-slate-700/50 glass-panel">
            <table className="w-full border-collapse text-left text-sm text-slate-300">
              <thead>
                <tr className="border-b border-slate-700/50 bg-slate-800/30 text-slate-400 font-semibold">
                  <th className="py-3 px-4 w-48">Employee</th>
                  <th className="py-3 px-4 w-44">Department</th>
                  <th className="py-3 px-4">Attendance Status</th>
                  <th className="py-3 px-4 w-60">Remarks / Adjustment Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {loading ? (
                  Array.from({ length: 4 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="py-4 px-4"><div className="h-4 bg-slate-700/50 rounded w-2/3" /></td>
                      <td className="py-4 px-4"><div className="h-4 bg-slate-700/50 rounded w-1/2" /></td>
                      <td className="py-4 px-4"><div className="h-6 bg-slate-700/50 rounded w-2/3" /></td>
                      <td className="py-4 px-4"><div className="h-8 bg-slate-700/50 rounded w-full" /></td>
                    </tr>
                  ))
                ) : filteredFaculty.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-slate-500 font-medium">
                      No active faculty profiles found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredFaculty.map((fac) => {
                    const record = attendanceRecords[fac.id] || { status: 'PRESENT', note: '' };
                    return (
                      <tr key={fac.id} className="hover:bg-slate-800/10">
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-white leading-tight">{fac.user.name}</p>
                          <span className="text-[10px] text-slate-500 font-mono uppercase mt-0.5 block">{fac.employeeCode}</span>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-400">{fac.department || 'N/A'}</td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1">
                            {[
                              { key: 'PRESENT', label: 'Present', color: 'peer-checked:bg-status-success peer-checked:text-white' },
                              { key: 'ABSENT', label: 'Absent', color: 'peer-checked:bg-status-danger peer-checked:text-white' },
                              { key: 'HALF_DAY', label: 'Half Day', color: 'peer-checked:bg-status-warning peer-checked:text-white' },
                              { key: 'ON_LEAVE', label: 'Leave', color: 'peer-checked:bg-slate-600 peer-checked:text-white' },
                            ].map((opt) => (
                              <label key={opt.key} className="cursor-pointer select-none">
                                <input
                                  type="radio"
                                  name={`status-${fac.id}`}
                                  value={opt.key}
                                  checked={record.status === opt.key}
                                  onChange={() => handleStatusChange(fac.id, opt.key)}
                                  className="sr-only peer"
                                />
                                <span className={`px-2.5 py-1 text-xs rounded border border-slate-700/60 bg-bg-surface/30 text-slate-400 hover:text-slate-200 transition-all block ${opt.color}`}>
                                  {opt.label}
                                </span>
                              </label>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <input
                            type="text"
                            placeholder="Add reason for leave or half day..."
                            value={record.note}
                            onChange={(e) => handleNoteChange(fac.id, e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded bg-slate-900/60 border border-slate-700/50 text-xs text-white placeholder:text-slate-600 outline-none focus:border-slate-500 transition-colors"
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Action Triggers */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => navigate('/attendance')}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              loading={submitting}
              disabled={success || filteredFaculty.length === 0}
            >
              Log Daily Attendance
            </Button>
          </div>

        </form>

      </div>
    </>
  );
};

export default AttendanceMarkForm;
