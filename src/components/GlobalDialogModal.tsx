import React, { useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const GlobalDialogModal: React.FC = () => {
  const { dialog, closeDialog } = useApp();

  useEffect(() => {
    if (!dialog?.isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (dialog.onCancel) dialog.onCancel();
        closeDialog();
      } else if (e.key === 'Enter') {
        if (dialog.onConfirm) dialog.onConfirm();
        closeDialog();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialog, closeDialog]);

  if (!dialog || !dialog.isOpen) return null;

  const handleConfirm = () => {
    if (dialog.onConfirm) dialog.onConfirm();
    closeDialog();
  };

  const handleCancel = () => {
    if (dialog.onCancel) dialog.onCancel();
    closeDialog();
  };

  const getIcon = () => {
    switch (dialog.type) {
      case 'success':
        return (
          <div className="w-11 h-11 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        );
      case 'warning':
        return (
          <div className="w-11 h-11 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0 shadow-2xs">
            <AlertTriangle className="w-6 h-6" />
          </div>
        );
      case 'error':
        return (
          <div className="w-11 h-11 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0 shadow-2xs">
            <AlertCircle className="w-6 h-6" />
          </div>
        );
      case 'info':
      default:
        return (
          <div className="w-11 h-11 rounded-full bg-indigo-50 border border-indigo-200 text-[#26394D] flex items-center justify-center shrink-0 shadow-2xs">
            <Info className="w-6 h-6" />
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-zinc-200/90 overflow-hidden transform animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Header */}
        <div className="p-5 pb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {getIcon()}
            <div className="min-w-0">
              <h3 className="font-bold text-base text-zinc-900 truncate">
                {dialog.title || 'ProCollege Notice'}
              </h3>
              <p className="text-[11px] text-zinc-500 font-medium">
                System Confirmation & Notification
              </p>
            </div>
          </div>

          <button
            onClick={handleCancel}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dialog Body Message */}
        <div className="px-5 py-3 text-xs sm:text-sm text-zinc-700 leading-relaxed break-words">
          {dialog.message}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-zinc-50/80 border-t border-zinc-100 flex items-center justify-end gap-2.5">
          {dialog.cancelText && (
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60 rounded-lg transition-colors cursor-pointer"
            >
              {dialog.cancelText}
            </button>
          )}

          <button
            onClick={handleConfirm}
            autoFocus
            className="px-5 py-2 text-xs font-semibold bg-[#26394D] hover:bg-[#141E2B] text-white rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span>{dialog.confirmText || 'OK'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};