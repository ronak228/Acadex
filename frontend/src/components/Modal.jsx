import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * Modal — Upgraded modal with size support, footer slot, loading state, and animations
 *
 * Props:
 *   isOpen     boolean
 *   onClose    () => void
 *   title      string
 *   children   ReactNode  (body content)
 *   footer     ReactNode  (action buttons — rendered in a separate footer area)
 *   size       "sm" | "md" | "lg" | "xl" | "full"
 *   loading    boolean — disables close + dims content
 *   description string — optional subtitle in header
 */
const sizeMap = {
  sm:   'max-w-sm',
  md:   'max-w-md',
  lg:   'max-w-lg',
  xl:   'max-w-xl',
  '2xl':'max-w-2xl',
  full: 'max-w-full mx-4',
};

const Modal = ({
  isOpen = false,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  loading = false,
}) => {
  const closeRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !loading) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm transition-opacity"
        onClick={!loading ? onClose : undefined}
      />

      {/* Modal Surface */}
      <div
        className={`
          relative w-full ${sizeMap[size] || sizeMap.md}
          glass-panel rounded-2xl border border-slate-700/60 shadow-2xl
          flex flex-col overflow-hidden animate-scaleIn z-10
          max-h-[calc(100vh-2rem)]
        `}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800/80 shrink-0">
          <div>
            {title && (
              <h3 id="modal-title" className="text-base font-bold text-white font-heading leading-snug">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs text-slate-400 mt-0.5">{description}</p>
            )}
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-800 hover:text-white transition-all shrink-0 disabled:opacity-40"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className={`flex-1 overflow-y-auto py-1 ${loading ? 'opacity-60 pointer-events-none' : ''}`}>
          {children}
        </div>

        {/* Footer (optional) */}
        {footer && (
          <div className="shrink-0 pt-4 border-t border-slate-800/80 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
