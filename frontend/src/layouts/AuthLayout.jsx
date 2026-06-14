import React from 'react';
import { GraduationCap, Users, BookOpen, BarChart2, Award } from 'lucide-react';

const features = [
  { icon: Users,     label: 'Multi-role Access',     desc: 'Admin, Faculty, Student & Receptionist' },
  { icon: BookOpen,  label: 'Academic Management',   desc: 'Courses, batches, attendance & exams' },
  { icon: BarChart2, label: 'Live Analytics',         desc: 'Revenue, performance & conversion reports' },
  { icon: Award,     label: 'Examination Engine',     desc: 'Question banks, results & analytics' },
];

const AuthLayout = ({ children }) => {
  return (
    <div className="relative min-h-screen w-full flex overflow-hidden bg-bg-deep">

      {/* ─── Left Panel (decorative) — hidden on mobile ─── */}
      <div className="hidden lg:flex w-[55%] flex-col justify-between p-12 relative overflow-hidden">
        {/* Ambient glows */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-brand/15 blur-[140px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[50%] rounded-full bg-brand-light/10 blur-[120px] pointer-events-none" />

        {/* Brand */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center shadow-lg shadow-brand/30">
            <GraduationCap size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold font-heading text-white tracking-tight">Acadex</h1>
            <p className="text-xs text-slate-500">Unified Education Management</p>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative flex flex-col gap-4">
          <h2 className="text-4xl font-extrabold font-heading text-white leading-tight tracking-tight">
            The complete ERP<br />
            <span className="bg-gradient-to-r from-brand-light to-indigo-300 bg-clip-text text-transparent">
              for modern institutes.
            </span>
          </h2>
          <p className="text-slate-400 text-base leading-relaxed max-w-sm">
            Manage students, faculty, fees, exams, and reports — all in one unified platform built for scale.
          </p>

          {/* Feature chips */}
          <div className="grid grid-cols-1 gap-3 mt-4 max-w-sm">
            {features.map(f => {
              const Icon = f.icon;
              return (
                <div key={f.label} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
                  <div className="w-8 h-8 rounded-lg bg-brand/20 border border-brand/25 flex items-center justify-center shrink-0">
                    <Icon size={15} className="text-brand-light" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{f.label}</p>
                    <p className="text-xs text-slate-500">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <p className="relative text-xs text-slate-600">
          © {new Date().getFullYear()} Acadex · Built for educational excellence
        </p>
      </div>

      {/* ─── Right Panel (login form) ─── */}
      <div className="flex-1 lg:w-[45%] flex items-center justify-center p-6 relative">
        {/* Mobile glows */}
        <div className="lg:hidden absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand/10 blur-[120px] pointer-events-none" />
        <div className="lg:hidden absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-brand-light/8 blur-[120px] pointer-events-none" />

        {/* Vertical separator */}
        <div className="hidden lg:block absolute left-0 top-[10%] h-[80%] w-px bg-gradient-to-b from-transparent via-slate-700/50 to-transparent" />

        <div className="relative w-full max-w-[400px] flex flex-col gap-6">
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center shadow-lg shadow-brand/30">
              <GraduationCap size={19} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold font-heading text-white">Acadex</h1>
              <p className="text-[10px] text-slate-500">Unified Education Management</p>
            </div>
          </div>

          {/* Form card */}
          <div className="glass-panel rounded-2xl border border-slate-700/50 shadow-2xl">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
