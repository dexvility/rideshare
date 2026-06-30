'use client';

import { useState, useCallback, createContext, useContext } from 'react';

interface Toast {
  id: number;
  message: string;
  kind: 'success' | 'error' | 'info';
}

const ToastContext = createContext<{
  toast: (msg: string, kind?: Toast['kind']) => void;
}>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  let counter = 0;

  const toast = useCallback((message: string, kind: Toast['kind'] = 'success') => {
    const id = ++counter;
    setToasts((prev) => [...prev, { id, message, kind }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3200);
  }, []);

  const colors = {
    success: 'var(--color-success)',
    error: 'var(--color-error)',
    info: 'var(--color-primary)',
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div style={{ position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            className="toast"
            style={{ background: colors[t.kind], color: '#fff', borderRadius: 'var(--border-radius)', padding: '0.75rem 1.5rem', fontSize: '0.9rem', whiteSpace: 'nowrap' }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
