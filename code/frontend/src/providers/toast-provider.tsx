'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { BaseToast, ToastItem, ToastType } from '@/components/base/BaseToast';

interface ToastContextType {
  showToast: (
    type: ToastType,
    message: string,
    title?: string,
    duration?: number,
    action?: { label: string; onClick: () => void }
  ) => void;
  success: (
    message: string,
    title?: string,
    duration?: number,
    action?: { label: string; onClick: () => void }
  ) => void;
  error: (
    message: string,
    title?: string,
    duration?: number,
    action?: { label: string; onClick: () => void }
  ) => void;
  warning: (
    message: string,
    title?: string,
    duration?: number,
    action?: { label: string; onClick: () => void }
  ) => void;
  info: (
    message: string,
    title?: string,
    duration?: number,
    action?: { label: string; onClick: () => void }
  ) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (
      type: ToastType,
      message: string,
      title?: string,
      duration?: number,
      action?: { label: string; onClick: () => void }
    ) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setToasts((prev) => [...prev, { id, type, message, title, duration, action }]);
    },
    []
  );

  const contextValue = useMemo(
    () => ({
      showToast,
      success: (
        message: string,
        title?: string,
        duration?: number,
        action?: { label: string; onClick: () => void }
      ) => showToast('success', message, title, duration, action),
      error: (
        message: string,
        title?: string,
        duration?: number,
        action?: { label: string; onClick: () => void }
      ) => showToast('error', message, title, duration, action),
      warning: (
        message: string,
        title?: string,
        duration?: number,
        action?: { label: string; onClick: () => void }
      ) => showToast('warning', message, title, duration, action),
      info: (
        message: string,
        title?: string,
        duration?: number,
        action?: { label: string; onClick: () => void }
      ) => showToast('info', message, title, duration, action),
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
