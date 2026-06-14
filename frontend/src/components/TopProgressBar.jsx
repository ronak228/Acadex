import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const TopProgressBar = () => {
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    setProgress(30);

    const timer1 = setTimeout(() => setProgress(70), 100);
    const timer2 = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setVisible(false);
        setTimeout(() => setProgress(0), 300); // reset after fade out
      }, 300);
    }, 300);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [location.pathname]);

  if (!visible && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none">
      <div 
        className="h-1 bg-gradient-to-r from-brand-light via-indigo-400 to-brand transition-all duration-300 ease-out shadow-[0_0_10px_rgba(79,70,229,0.7)]"
        style={{ width: `${progress}%`, opacity: visible ? 1 : 0 }}
      >
        <div className="absolute right-0 top-0 h-full w-20 bg-white/40 blur-[2px] animate-pulse" />
      </div>
    </div>
  );
};

export default TopProgressBar;
