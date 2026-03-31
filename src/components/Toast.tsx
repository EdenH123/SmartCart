'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { CheckCircle, AlertTriangle, X, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  showToast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div role="status" aria-live="polite" className="fixed bottom-4 left-4 right-4 z-[100] flex flex-col items-center gap-2 pointer-events-none sm:left-auto sm:right-4 sm:items-end">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 3500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const Icon = toast.type === 'success' ? CheckCircle : toast.type === 'error' ? AlertTriangle : Info;
  const colors = {
    success: 'bg-brand-600 text-white',
    error: 'bg-red-600 text-white',
    info: 'bg-gray-800 text-white',
  };

  return (
    <div
      className={`pointer-events-auto flex items-center gap-2.5 rounded-lg px-4 py-3 text-sm font-medium shadow-lg animate-slide-up ${colors[toast.type]}`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{toast.message}</span>
      <button onClick={() => onDismiss(toast.id)} aria-label="סגירה" className="rounded p-0.5 opacity-70 hover:opacity-100">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
