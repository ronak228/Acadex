import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const toggleSidebar = () => setSidebarOpen(s => !s);

  return (
    <div className="min-h-screen bg-bg-deep text-slate-200">
      <Navbar onToggleSidebar={toggleSidebar} />

      <div className="flex pt-14">
        <Sidebar
          isOpen={sidebarOpen}
          toggleSidebar={toggleSidebar}
          onExpandChange={setSidebarExpanded}
        />

        {sidebarOpen && (
          <div
            onClick={toggleSidebar}
            className="fixed inset-0 z-30 bg-slate-950/60 md:hidden backdrop-blur-xs"
          />
        )}

        <main
          className={`flex-1 min-h-[calc(100vh-3.5rem)] overflow-y-auto p-5 md:p-8
            ${sidebarExpanded ? 'md:ml-64' : 'md:ml-[60px]'}`}
          style={{ transition: 'margin-left 240ms cubic-bezier(0.4,0,0.2,1)' }}
        >
          <div className="fixed top-14 right-0 w-[50%] h-[50%] rounded-full bg-brand/4 blur-[120px] pointer-events-none z-0" />
          <div className="relative z-10 max-w-[1400px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
