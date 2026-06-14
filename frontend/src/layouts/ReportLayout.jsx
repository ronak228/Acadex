import React from 'react';
import { NavLink } from 'react-router-dom';
import { DollarSign, BookOpen, Users, ClipboardList, Activity, PieChart, TrendingUp } from 'lucide-react';

const navItems = [
  { path: '/reports/revenue', label: 'Revenue', icon: DollarSign },
  { path: '/reports/due-fee', label: 'Due Fees', icon: TrendingUp },
  { path: '/reports/conversions', label: 'Conversions', icon: Users },
  { path: '/reports/academic', label: 'Academic', icon: BookOpen },
  { path: '/reports/attendance', label: 'Attendance', icon: ClipboardList },
  { path: '/reports/performance', label: 'Performance', icon: Activity },
  { path: '/reports/examination', label: 'Examination', icon: PieChart },
];

const ReportLayout = ({ children, title, description }) => {
  return (
    <>
      <div className="flex flex-col gap-6 animate-fadeIn">
        <div className="mb-2">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-heading">{title}</h1>
          {description && <p className="text-xs md:text-sm text-slate-400 mt-1">{description}</p>}
        </div>

        {/* Sub-navigation */}
        <div className="flex overflow-x-auto border-b border-slate-800 pb-px gap-1 no-scrollbar">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-2 px-4 py-2.5 border-b-2 font-medium text-sm transition-all duration-200 whitespace-nowrap
                ${isActive 
                  ? 'border-brand text-brand-light bg-brand/5' 
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded-t-lg'
                }
              `}
            >
              {({ isActive }) => (
                <>
                  <item.icon size={16} className={isActive ? "text-brand-light" : "text-slate-500"} />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Content */}
        <div className="mt-2">
          {children}
        </div>
      </div>
    </>
  );
};

export default ReportLayout;
