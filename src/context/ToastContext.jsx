/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const toastStyles = {
  success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100',
  error: 'border-red-500/40 bg-red-500/10 text-red-100',
  warning: 'border-amber-500/40 bg-amber-500/10 text-amber-100',
  info: 'border-sky-500/40 bg-sky-500/10 text-sky-100',
};

const toastIcons = {
  success: CheckCircle,
  error: AlertTriangle,
  warning: AlertTriangle,
  info: Info,
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((toast) => {
    const id = crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    const nextToast = {
      id,
      type: 'info',
      title: '',
      message: '',
      duration: 5000,
      ...toast,
    };

    setToasts((current) => [...current, nextToast].slice(-4));

    if (nextToast.duration !== null) {
      window.setTimeout(() => dismissToast(id), nextToast.duration);
    }

    return id;
  }, [dismissToast]);

  useEffect(() => {
    const handleEventToast = (event) => {
      showToast(event.detail || {});
    };

    window.addEventListener('voerynth:toast', handleEventToast);
    return () => window.removeEventListener('voerynth:toast', handleEventToast);
  }, [showToast]);

  const value = useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-[10000] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => {
          const Icon = toastIcons[toast.type] || Info;
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto rounded-lg border px-4 py-3 shadow-2xl backdrop-blur-xl ${toastStyles[toast.type] || toastStyles.info}`}
              role="status"
            >
              <div className="flex items-start gap-3">
                <Icon size={18} className="mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  {toast.title && <p className="text-sm font-medium text-slate-100">{toast.title}</p>}
                  {toast.message && <p className="mt-0.5 text-xs text-slate-300">{toast.message}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  className="rounded p-1 text-slate-300 hover:bg-white/10 hover:text-white"
                  aria-label="Dismiss notification"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

