import React, { useEffect, useRef } from 'react';
import { AlertTriangle, Trash2, ShieldX, Loader2 } from 'lucide-react';
import Button from './Button';

/**
 * ConfirmDialog — Replaces all window.confirm() calls with a branded, accessible dialog
 *
 * Props:
 *   isOpen       boolean
 *   onClose      () => void
 *   onConfirm    () => void
 *   title        string
 *   description  string
 *   confirmLabel string (default: "Confirm")
 *   cancelLabel  string (default: "Cancel")
 *   variant      "danger" | "warning" | "default"
 *   loading      boolean
 *   icon         LucideIcon (optional override)
 */
const ConfirmDialog = ({
  isOpen = false,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description = 'This action cannot be undone.',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
  icon: IconOverride,
}) => {
  const cancelRef = useRef(null);

  // Focus cancel button when opened, handle Escape
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.activeElement;
    cancelRef.current?.focus();
    document.body.style.overflow = 'hidden';

    const handleKey = (e) => {
      if (e.key === 'Escape' && !loading) onClose();
    };
    window.addEventListener('keydown', handleKey);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKey);
      prev?.focus();
    };
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const iconConfig = {
    danger:  { Icon: IconOverride || ShieldX,      ring: 'bg-status-danger/10 border-status-danger/20',  iconClass: 'text-status-danger' },
    warning: { Icon: IconOverride || AlertTriangle, ring: 'bg-status-warning/10 border-status-warning/20', iconClass: 'text-status-warning' },
    default: { Icon: IconOverride || AlertTriangle, ring: 'bg-brand/10 border-brand/20',                  iconClass: 'text-brand-light' },
  };

  const { Icon, ring, iconClass } = iconConfig[variant] || iconConfig.danger;

  const confirmVariant = variant === 'danger' ? 'danger' : variant === 'warning' ? 'primary' : 'primary';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-desc"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        onClick={!loading ? onClose : undefined}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-sm glass-panel rounded-2xl border border-slate-700/60 shadow-2xl animate-scaleIn z-10 flex flex-col gap-5">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${ring}`}>
          <Icon size={22} className={iconClass} />
        </div>

        {/* Text */}
        <div className="flex flex-col gap-1.5">
          <h3 id="confirm-title" className="text-base font-bold text-white font-heading">
            {title}
          </h3>
          <p id="confirm-desc" className="text-sm text-slate-400 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            ref={cancelRef}
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            {cancelLabel}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            loading={loading}
            className="flex-1"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
