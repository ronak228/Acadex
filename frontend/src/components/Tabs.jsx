import React, { createContext, useContext, useId } from 'react';

/**
 * Tabs — Accessible tab navigation for detail pages
 *
 * Usage:
 *   <Tabs defaultTab="profile">
 *     <TabList>
 *       <Tab id="profile" icon={User}>Profile</Tab>
 *       <Tab id="results" icon={Award}>Results</Tab>
 *     </TabList>
 *     <TabPanel id="profile">...</TabPanel>
 *     <TabPanel id="results">...</TabPanel>
 *   </Tabs>
 */

const TabsContext = createContext(null);

const Tabs = ({ children, defaultTab, value, onChange, className = '' }) => {
  const [internalActive, setInternalActive] = React.useState(defaultTab || '');
  const active = value !== undefined ? value : internalActive;

  const setActive = (id) => {
    if (onChange) onChange(id);
    else setInternalActive(id);
  };

  return (
    <TabsContext.Provider value={{ active, setActive }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
};

const TabList = ({ children, className = '' }) => (
  <div
    role="tablist"
    className={`flex items-center gap-1 border-b border-slate-800 overflow-x-auto scrollbar-none ${className}`}
  >
    {children}
  </div>
);

const Tab = ({ id, children, icon: Icon, count, disabled = false }) => {
  const { active, setActive } = useContext(TabsContext);
  const isActive = active === id;

  return (
    <button
      role="tab"
      id={`tab-${id}`}
      aria-selected={isActive}
      aria-controls={`panel-${id}`}
      disabled={disabled}
      onClick={() => !disabled && setActive(id)}
      className={`
        relative flex items-center gap-2 px-4 py-2.5 text-sm font-semibold
        whitespace-nowrap transition-all duration-150 focus-visible:outline-none shrink-0
        disabled:opacity-40 disabled:cursor-not-allowed
        ${isActive
          ? 'text-white'
          : 'text-slate-500 hover:text-slate-300'
        }
      `}
    >
      {Icon && <Icon size={15} className="shrink-0" />}
      {children}
      {count !== undefined && (
        <span className={`
          px-1.5 py-0.5 text-[10px] font-bold rounded-full ml-0.5
          ${isActive ? 'bg-brand/20 text-brand-light' : 'bg-slate-800 text-slate-400'}
        `}>
          {count}
        </span>
      )}
      {/* Active indicator line */}
      {isActive && (
        <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand-light rounded-full" />
      )}
    </button>
  );
};

const TabPanel = ({ id, children, className = '' }) => {
  const { active } = useContext(TabsContext);
  if (active !== id) return null;

  return (
    <div
      role="tabpanel"
      id={`panel-${id}`}
      aria-labelledby={`tab-${id}`}
      className={`animate-fadeIn ${className}`}
    >
      {children}
    </div>
  );
};

Tabs.List = TabList;
Tabs.Tab = Tab;
Tabs.Panel = TabPanel;

export default Tabs;
