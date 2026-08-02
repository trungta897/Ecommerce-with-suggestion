'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { X } from '@/components/base/icons';

export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function BaseModal({ isOpen, onClose, title, children, className }: BaseModalProps) {
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div
        className={cn(
          'relative z-50 w-full max-w-lg rounded-lg bg-background p-6 shadow-lg shadow-black/20 animate-in fade-in-90 zoom-in-95 sm:max-w-md',
          className
        )}
      >
        <div className="flex items-center justify-between mb-4">
          {title && <h2 className="text-lg font-semibold">{title}</h2>}
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-muted transition-colors absolute right-4 top-4"
          >
            <X className="h-5 w-5 opacity-70" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        <div>{children}</div>
      </div>
    </div>
  );
}
