'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { BaseToast, ToastItem, ToastType } from '@/components/base/BaseToast';

interface ToastContextType {
  showToast: (type: ToastType, message: string, title?: string, duration?: number) => void;
  success: (message: string, title?: string, duration?: number) => void;
  error: (message: string, title?: string, duration?: number) => void;
  warning: (message: string, title?: string, duration?: number) => void;
  info: (message: string, title?: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, message: string, title?: string, duration?: number) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setToasts((prev) => [...prev, { id, type, message, title, duration }]);
    },
    []
  );

  const contextValue = useMemo(
    () => ({
      showToast,
      success: (message: string, title?: string, duration?: number) =>
        showToast('success', message, title, duration),
      error: (message: string, title?: string, duration?: number) =>
        showToast('error', message, title, duration),
      warning: (message: string, title?: string, duration?: number) =>
        showToast('warning', message, title, duration),
      info: (message: string, title?: string, duration?: number) =>
        showToast('info', message, title, duration),
    }),
    [showToast]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col items-end pointer-events-none">
        <div className="pointer-events-auto">
          {toasts.map((toast) => (
            <BaseToast key={toast.id} toast={toast} onClose={removeToast} />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
