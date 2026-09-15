import { useState, useEffect, useCallback } from 'react';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { cn } from '../../utils/cn';

// Global state for simple custom toast
let toastCount = 0;
let addToastObj = null;

export const toast = {
  success: (message, options) => addToastObj?.({ id: ++toastCount, type: 'success', message, ...options }),
  error: (message, options) => addToastObj?.({ id: ++toastCount, type: 'error', message, ...options }),
  info: (message, options) => addToastObj?.({ id: ++toastCount, type: 'info', message, ...options }),
};

const icons = {
  success: <CheckCircle2 className="w-5 h-5 text-success" />,
  error: <AlertCircle className="w-5 h-5 text-error" />,
  info: <Info className="w-5 h-5 text-info" />,
};

export function Toaster() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    addToastObj = (t) => {
      setToasts((prev) => [...prev, t]);
      if (t.duration !== Infinity) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((item) => item.id !== t.id));
        }, t.duration || 3000);
      }
    };
    return () => { addToastObj = null; };
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto flex items-start gap-3 w-80 p-4 bg-surface rounded-lg shadow-2 border border-border animate-in slide-in-from-right-5 fade-in duration-300"
          )}
          role="alert"
        >
          <div className="flex-shrink-0 mt-0.5">{icons[t.type]}</div>
          <div className="flex-1">
            <p className="text-sm font-medium text-text-primary">{t.message}</p>
            {t.description && <p className="mt-1 text-sm text-text-secondary">{t.description}</p>}
          </div>
          <button
            onClick={() => removeToast(t.id)}
            className="flex-shrink-0 ml-4 text-text-placeholder hover:text-text-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
