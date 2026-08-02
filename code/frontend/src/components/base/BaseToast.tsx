'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from '@/components/base/icons';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface BaseToastProps {
  toast: ToastItem;
  onClose: (id: string) => void;
}

export const BaseToast: React.FC<BaseToastProps> = ({ toast, onClose }) => {
  const duration = toast.duration || 4000;
  const [progress, setProgress] = useState(100);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const intervalTime = 40;
    const decrement = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= decrement) {
          clearInterval(timer);
          setIsExiting(true);
          setTimeout(() => onClose(toast.id), 300);
          return 0;
        }
        return prev - decrement;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [duration, onClose, toast.id]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onClose(toast.id), 300);
  };

  const config = {
    success: {
      icon: <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />,
      border: 'border-green-500/30',
      bg: 'bg-white',
      progress: 'bg-green-500',
    },
    error: {
      icon: <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />,
      border: 'border-red-500/30',
      bg: 'bg-white',
      progress: 'bg-red-500',
    },
    warning: {
      icon: <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />,
      border: 'border-amber-500/30',
      bg: 'bg-white',
      progress: 'bg-amber-500',
    },
    info: {
      icon: <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />,
      border: 'border-blue-500/30',
      bg: 'bg-white',
      progress: 'bg-blue-500',
    },
  }[toast.type];

  return (
    <div
      className={`relative flex items-start w-80 sm:w-96 p-4 mb-3 rounded-xl shadow-lg border backdrop-blur-md transition-all duration-300 transform ${
        config.bg
      } ${config.border} ${
        isExiting
          ? 'opacity-0 translate-x-full scale-95'
          : 'opacity-100 translate-x-0 scale-100 animate-in fade-in slide-in-from-right-5'
      }`}
      role="alert"
    >
      <div className="mr-3 mt-0.5">{config.icon}</div>
      <div className="flex-1 pr-6">
        {toast.title && <h4 className="text-sm font-semibold text-gray-900 mb-1">{toast.title}</h4>}
        <p className="text-sm text-gray-700 leading-relaxed break-words">{toast.message}</p>
      </div>
      <button
        onClick={handleClose}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
        aria-label="Close toast"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100 rounded-b-xl overflow-hidden">
        <div
          className={`h-full transition-all duration-75 ease-linear ${config.progress}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
