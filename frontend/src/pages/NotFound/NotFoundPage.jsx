import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';

const NotFoundPage = () => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
    <div className="max-w-md w-full text-center">
      <div className="flex justify-center mb-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center">
          <GraduationCap size={28} className="text-white" />
        </div>
      </div>
      <div className="text-7xl font-extrabold text-slate-700 mb-4">404</div>
      <h1 className="text-xl font-bold text-white mb-2">Page not found</h1>
      <p className="text-slate-400 text-sm mb-8">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand text-white text-sm font-medium hover:opacity-90 transition"
      >
        Go to Dashboard
      </Link>
    </div>
  </div>
);

export default NotFoundPage;
