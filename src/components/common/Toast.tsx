import React from 'react';
import { CheckCircle2, AlertOctagon, AlertTriangle, Info, X } from 'lucide-react';
import { useToast, ToastMessage } from '../../context/ToastContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onClose: () => void }> = ({ toast, onClose }) => {
  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    error: <AlertOctagon className="w-5 h-5 text-rose-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    info: <Info className="w-5 h-5 text-sky-500" />,
  };

  const borders = {
    success: 'border-emerald-200 dark:border-emerald-900',
    error: 'border-rose-200 dark:border-rose-900',
    warning: 'border-amber-200 dark:border-amber-900',
    info: 'border-sky-200 dark:border-sky-900',
  };

  return (
    <div className={`pointer-events-auto flex items-start p-3.5 bg-white dark:bg-slate-900 rounded-xl shadow-lg border ${borders[toast.type]} transition-all transform animate-in slide-in-from-bottom-2`}>
      <div className="shrink-0 mr-3 mt-0.5">{icons[toast.type]}</div>
      <div className="flex-1 mr-2">
        <h5 className="text-xs font-semibold text-slate-900 dark:text-slate-100">{toast.title}</h5>
        {toast.message && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{toast.message}</p>}
      </div>
      <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
