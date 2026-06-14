import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardList, CheckSquare, Users, UserSquare2,
  CalendarCheck, DollarSign, BookOpen, LogOut, GraduationCap, Layers,
  Clock, UserCheck, Library, FolderOpen, FileText, ChevronDown,
  ChevronRight, BookMarked, BookCopy, Wallet, CreditCard, Receipt,
  AlertCircle, Tag, FlaskConical, HelpCircle, ClipboardCheck,
  BarChart2, ScrollText, Star, FileBarChart2, PieChart, TrendingUp,
  GanttChart, Briefcase, Building2
} from 'lucide-react';
import authService from '../services/authService';

/* ─── Nav Item ─────────────────────────────────── */
const NavItem = ({ item, role, onNavigate, collapsed }) => {
  const Icon = item.icon;
  if (!item.roles.includes(role)) return null;

  return (
    <li>
      <NavLink
        to={item.path}
        end={item.end}
        title={item.label}
        className={({ isActive }) =>
          `flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 group relative border-l-[3px]
           ${isActive
             ? 'bg-brand/15 text-white border-brand-light'
             : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200 border-transparent'
           }`
        }
        onClick={onNavigate}
      >
        {({ isActive }) => (
          <>
            <Icon
              className={`shrink-0 transition-colors ${isActive ? 'text-brand-light' : 'text-slate-500 group-hover:text-slate-300'}`}
              size={17}
            />
            <span
              className={`truncate whitespace-nowrap overflow-hidden ${collapsed ? 'opacity-0 max-w-0 ml-0' : 'opacity-100 max-w-[160px] ml-3'}`}
              style={{
                transitionProperty: 'opacity, max-width, margin-left',
                transitionDuration: collapsed ? '100ms, 130ms, 100ms' : '200ms, 240ms, 200ms',
                transitionTimingFunction: 'cubic-bezier(0.4,0,0.2,1)',
                transitionDelay: collapsed ? '0ms' : '50ms',
              }}
            >
              {item.label}
            </span>
          </>
        )}
      </NavLink>
    </li>
  );
};

/* ─── Nav Group ────────────────────────────────── */
const NavGroup = ({ group, role, onNavigate, collapsed }) => {
  const location = useLocation();
  const Icon = group.icon;

  const visibleChildren = group.children.filter(c => c.roles.includes(role));
  if (visibleChildren.length === 0) return null;

  const isAnyChildActive = visibleChildren.some(c => location.pathname.startsWith(c.path));
  const [open, setOpen] = useState(isAnyChildActive);

  useEffect(() => {
    if (isAnyChildActive) setOpen(true);
  }, [location.pathname]);

  useEffect(() => {
    if (collapsed) setOpen(false);
    else if (isAnyChildActive) setOpen(true);
  }, [collapsed]);

  return (
    <li>
      <button
        onClick={() => !collapsed && setOpen(o => !o)}
        title={collapsed ? group.label : undefined}
        className={`flex items-center px-3 py-2.5 w-full rounded-lg text-sm font-medium transition-colors duration-150 group border-l-[3px]
          ${isAnyChildActive
            ? 'text-slate-300 border-brand/50'
            : 'text-slate-500 hover:bg-slate-800/70 hover:text-slate-300 border-transparent'
          }`}
      >
        <Icon
          className={`shrink-0 transition-colors ${isAnyChildActive ? 'text-brand-light' : 'text-slate-500 group-hover:text-slate-400'}`}
          size={17}
        />
        <span
          className={`flex-1 text-left whitespace-nowrap overflow-hidden ${collapsed ? 'opacity-0 max-w-0 ml-0' : 'opacity-100 max-w-[120px] ml-3'}`}
          style={{
            transitionProperty: 'opacity, max-width, margin-left',
            transitionDuration: collapsed ? '100ms, 130ms, 100ms' : '200ms, 240ms, 200ms',
            transitionTimingFunction: 'cubic-bezier(0.4,0,0.2,1)',
            transitionDelay: collapsed ? '0ms' : '70ms',
          }}
        >
          {group.label}
        </span>
        <span
          className={`text-slate-600 ${collapsed ? 'opacity-0' : 'opacity-100'} ${open ? 'rotate-0' : '-rotate-90'}`}
          style={{
            transitionProperty: 'opacity, transform',
            transitionDuration: collapsed ? '80ms' : '180ms',
            transitionTimingFunction: 'cubic-bezier(0.4,0,0.2,1)',
            transitionDelay: collapsed ? '0ms' : '100ms',
          }}
        >
          <ChevronDown size={13} />
        </span>
      </button>

      <ul
        className={`mt-0.5 ml-8 pl-3 border-l border-slate-700/50 space-y-0.5 overflow-hidden ${(open && !collapsed) ? 'max-h-[500px]' : 'max-h-0'}`}
        style={{
          transitionProperty: 'max-height',
          transitionDuration: (open && !collapsed) ? '340ms' : '200ms',
          transitionTimingFunction: (open && !collapsed) ? 'cubic-bezier(0,0,0.2,1)' : 'cubic-bezier(0.4,0,1,1)',
        }}
      >
        {visibleChildren.map(child => {
          const ChildIcon = child.icon;
          return (
            <li key={child.path}>
              <NavLink
                to={child.path}
                end={!!child.end}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150
                   ${isActive
                     ? 'bg-brand text-white shadow-sm shadow-brand/20'
                     : 'text-slate-500 hover:bg-slate-800/60 hover:text-slate-300'
                   }`
                }
                onClick={onNavigate}
              >
                {({ isActive }) => (
                  <>
                    <ChildIcon
                      className={`shrink-0 ${isActive ? 'text-white' : 'text-slate-600'}`}
                      size={13}
                    />
                    <span>{child.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </li>
  );
};

/* ─── Section Label ────────────────────────────── */
const SectionLabel = ({ label, collapsed }) => (
  <li className="pt-3 pb-0.5">
    <p
      className={`px-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest whitespace-nowrap overflow-hidden ${collapsed ? 'opacity-0' : 'opacity-100'}`}
      style={{
        transitionProperty: 'opacity',
        transitionDuration: collapsed ? '80ms' : '220ms',
        transitionTimingFunction: 'ease',
        transitionDelay: collapsed ? '0ms' : '110ms',
      }}
    >
      {label}
    </p>
  </li>
);

/* ─── Sidebar ──────────────────────────────────── */
const Sidebar = ({ isOpen, toggleSidebar, onExpandChange }) => {
  const navigate = useNavigate();
  const user = authService.getLocalUser() || { role: 'STUDENT', name: 'User' };
  const role = user.role;

  const [hovered, setHovered] = useState(false);
  const collapseTimer = useRef(null);
  const isExpanded = hovered;
  const showExpanded = isOpen || isExpanded;

  const handleMouseEnter = () => {
    if (collapseTimer.current) {
      clearTimeout(collapseTimer.current);
      collapseTimer.current = null;
    }
    setHovered(true);
    onExpandChange?.(true);
  };

  const handleMouseLeave = () => {
    collapseTimer.current = setTimeout(() => {
      setHovered(false);
      onExpandChange?.(false);
      collapseTimer.current = null;
    }, 200);
  };

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  const onNavigate = () => {
    if (window.innerWidth < 768) toggleSidebar();
  };

  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    : 'U';

  /* ─── Nav Config ─── */
  const navConfig = [
    {
      type: 'item',
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['SUPER_ADMIN', 'ADMIN', 'FACULTY', 'STUDENT', 'RECEPTIONIST'],
    },
    { type: 'section', label: 'Enrollment' },
    {
      type: 'item',
      label: 'Inquiries',
      path: '/inquiries',
      icon: ClipboardList,
      roles: ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST'],
    },
    {
      type: 'item',
      label: 'Admissions',
      path: '/admissions',
      icon: CheckSquare,
      roles: ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST'],
    },
    {
      type: 'item',
      label: 'Students',
      path: '/students',
      icon: Users,
      roles: ['SUPER_ADMIN', 'ADMIN', 'FACULTY'],
    },
    { type: 'section', label: 'People' },
    {
      type: 'group',
      label: 'Faculty',
      icon: UserSquare2,
      roles: ['SUPER_ADMIN', 'ADMIN'],
      children: [
        { label: 'Faculty Registry', path: '/faculty', icon: UserSquare2, roles: ['SUPER_ADMIN', 'ADMIN'], end: true },
        { label: 'Designations',     path: '/faculty/designations', icon: Briefcase, roles: ['SUPER_ADMIN', 'ADMIN'] },
        { label: 'Departments',      path: '/faculty/departments',  icon: Building2,  roles: ['SUPER_ADMIN', 'ADMIN'] },
      ],
    },
    {
      type: 'item',
      label: 'Faculty Attendance',
      path: '/attendance',
      icon: CalendarCheck,
      roles: ['SUPER_ADMIN', 'ADMIN', 'FACULTY'],
    },
    {
      type: 'item',
      label: 'Payroll / Salary',
      path: '/salary',
      icon: DollarSign,
      roles: ['SUPER_ADMIN', 'ADMIN', 'FACULTY'],
    },
    {
      type: 'item',
      label: 'User Accounts',
      path: '/users/admin',
      icon: Users,
      roles: ['SUPER_ADMIN', 'ADMIN'],
    },
    { type: 'section', label: 'Academics' },
    {
      type: 'group',
      label: 'Academic',
      icon: GraduationCap,
      roles: ['SUPER_ADMIN', 'ADMIN', 'FACULTY', 'STUDENT'],
      children: [
        { label: 'Courses',     path: '/courses',            icon: BookMarked, roles: ['SUPER_ADMIN', 'ADMIN'] },
        { label: 'Subjects',    path: '/subjects',           icon: BookCopy,   roles: ['SUPER_ADMIN', 'ADMIN'] },
        { label: 'Batches',     path: '/batches',            icon: Layers,     roles: ['SUPER_ADMIN', 'ADMIN', 'FACULTY'] },
        { label: 'Timetable',   path: '/timetable',          icon: Clock,      roles: ['SUPER_ADMIN', 'ADMIN', 'FACULTY', 'STUDENT'] },
        { label: 'Attendance',  path: '/student-attendance', icon: UserCheck,  roles: ['SUPER_ADMIN', 'ADMIN', 'FACULTY'] },
        { label: 'Syllabus',    path: '/syllabus',           icon: Library,    roles: ['SUPER_ADMIN', 'ADMIN', 'FACULTY', 'STUDENT'] },
        { label: 'Materials',   path: '/materials',          icon: FolderOpen, roles: ['SUPER_ADMIN', 'ADMIN', 'FACULTY', 'STUDENT'] },
        { label: 'Assignments', path: '/assignments',        icon: FileText,   roles: ['SUPER_ADMIN', 'ADMIN', 'FACULTY', 'STUDENT'] },
      ],
    },
    { type: 'section', label: 'Finance' },
    {
      type: 'group',
      label: 'Finance',
      icon: Wallet,
      roles: ['SUPER_ADMIN', 'ADMIN', 'STUDENT'],
      children: [
        { label: 'Fee Structures', path: '/fees/structures', icon: CreditCard,   roles: ['SUPER_ADMIN', 'ADMIN'] },
        { label: 'Fee Collection', path: '/fees/collect',    icon: Receipt,      roles: ['SUPER_ADMIN', 'ADMIN'] },
        { label: 'Student Fees',   path: '/fees/students',   icon: Users,        roles: ['SUPER_ADMIN', 'ADMIN', 'STUDENT'] },
        { label: 'Due Fees',       path: '/fees/due',        icon: AlertCircle,  roles: ['SUPER_ADMIN', 'ADMIN'] },
        { label: 'Discounts',      path: '/fees/discounts',  icon: Tag,          roles: ['SUPER_ADMIN', 'ADMIN'] },
      ],
    },
    { type: 'section', label: 'Examinations' },
    {
      type: 'group',
      label: 'Examination',
      icon: FlaskConical,
      roles: ['SUPER_ADMIN', 'ADMIN', 'FACULTY', 'STUDENT'],
      children: [
        { label: 'Question Bank', path: '/question-bank',   icon: HelpCircle,    roles: ['SUPER_ADMIN', 'ADMIN', 'FACULTY'] },
        { label: 'Exams',         path: '/exams',            icon: BookOpen,      roles: ['SUPER_ADMIN', 'ADMIN', 'FACULTY'] },
        { label: 'My Results',    path: '/results',          icon: Star,          roles: ['STUDENT'] },
        { label: 'Analytics',     path: '/analytics/exams',  icon: BarChart2,     roles: ['SUPER_ADMIN', 'ADMIN', 'FACULTY'] },
      ],
    },
    { type: 'section', label: 'Reports' },
    {
      type: 'group',
      label: 'Reports',
      icon: FileBarChart2,
      roles: ['SUPER_ADMIN', 'ADMIN', 'FACULTY', 'STUDENT'],
      children: [
        { label: 'Revenue',     path: '/reports/revenue',     icon: TrendingUp,  roles: ['SUPER_ADMIN', 'ADMIN'] },
        { label: 'Attendance',  path: '/reports/attendance',  icon: UserCheck,   roles: ['SUPER_ADMIN', 'ADMIN', 'FACULTY'] },
        { label: 'Academic',    path: '/reports/academic',    icon: GanttChart,  roles: ['SUPER_ADMIN', 'ADMIN', 'FACULTY'] },
        { label: 'Examination', path: '/reports/examination', icon: FlaskConical,roles: ['SUPER_ADMIN', 'ADMIN', 'FACULTY'] },
        { label: 'Performance', path: '/reports/performance', icon: ScrollText,  roles: ['SUPER_ADMIN', 'ADMIN', 'FACULTY', 'STUDENT'] },
        { label: 'Conversion',  path: '/reports/conversion',  icon: PieChart,    roles: ['SUPER_ADMIN', 'ADMIN'] },
        { label: 'Due Fees',    path: '/reports/due-fees',    icon: AlertCircle, roles: ['SUPER_ADMIN', 'ADMIN'] },
      ],
    },
  ];

  return (
    <aside
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`fixed top-0 left-0 z-40 h-screen pt-14 overflow-hidden
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        ${(isOpen || isExpanded) ? 'w-64' : 'w-[60px]'}
        bg-bg-surface border-r border-slate-700/40 md:translate-x-0
        ${isExpanded ? 'shadow-2xl shadow-slate-950/60' : ''}`}
      style={{
        transition: 'width 240ms cubic-bezier(0.4,0,0.2,1), transform 240ms cubic-bezier(0.4,0,0.2,1), box-shadow 240ms ease',
        willChange: 'width',
      }}
    >
      <div className="h-full flex flex-col bg-bg-surface">

        {/* User Card */}
        <div className="relative border-b border-slate-800/60 overflow-hidden shrink-0" style={{ height: '68px' }}>
          {/* Collapsed avatar — centered */}
          <div
            className="absolute inset-0 flex justify-center items-center"
            style={{
              opacity: showExpanded ? 0 : 1,
              transition: `opacity ${showExpanded ? '100ms' : '200ms'} ease`,
              pointerEvents: showExpanded ? 'none' : 'auto',
            }}
          >
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center text-white font-bold text-xs border border-brand/40">
                {initials}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-status-success rounded-full border-2 border-bg-surface" />
            </div>
          </div>
          {/* Expanded card — full name/role */}
          <div
            className="absolute inset-0 flex items-center px-3"
            style={{
              opacity: showExpanded ? 1 : 0,
              transition: `opacity ${showExpanded ? '200ms' : '100ms'} ease`,
              transitionDelay: showExpanded ? '60ms' : '0ms',
              pointerEvents: showExpanded ? 'auto' : 'none',
            }}
          >
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-bg-deep/50 border border-slate-800/60 w-full">
              <div className="relative shrink-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center text-white font-bold text-xs border border-brand/40">
                  {initials}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-status-success rounded-full border-2 border-bg-surface" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{user.name}</p>
                <span className="text-[10px] font-semibold text-brand-light">{role.replace('_', ' ')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Nav List */}
        <nav className="flex-1 overflow-y-auto px-2 py-2">
          <ul className="space-y-0.5">
            {navConfig.map((entry, idx) => {
              if (entry.type === 'section') {
                return <SectionLabel key={`sec-${idx}`} label={entry.label} collapsed={!showExpanded} />;
              }
              if (entry.type === 'group') {
                const visible = entry.children?.some(c => c.roles.includes(role));
                if (!visible) return null;
                return (
                  <NavGroup
                    key={`grp-${idx}`}
                    group={entry}
                    role={role}
                    onNavigate={onNavigate}
                    collapsed={!showExpanded}
                  />
                );
              }
              return (
                <NavItem
                  key={entry.path}
                  item={entry}
                  role={role}
                  onNavigate={onNavigate}
                  collapsed={!showExpanded}
                />
              );
            })}
          </ul>
        </nav>

        {/* Bottom: Logout */}
        <div className="border-t border-slate-800/60 p-2">
          <button
            onClick={handleLogout}
            className="flex items-center px-3 py-2 w-full rounded-lg text-sm font-medium text-slate-500
              hover:bg-status-danger/10 hover:text-status-danger transition-colors duration-150"
            title="Sign Out"
          >
            <LogOut size={16} className="shrink-0" />
            <span
              className={`whitespace-nowrap overflow-hidden ${showExpanded ? 'opacity-100 max-w-[120px] ml-3' : 'opacity-0 max-w-0 ml-0'}`}
              style={{
                transitionProperty: 'opacity, max-width, margin-left',
                transitionDuration: !showExpanded ? '100ms, 130ms, 100ms' : '200ms, 240ms, 200ms',
                transitionTimingFunction: 'cubic-bezier(0.4,0,0.2,1)',
                transitionDelay: !showExpanded ? '0ms' : '70ms',
              }}
            >
              Sign Out
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
