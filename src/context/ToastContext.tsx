// src/context/ToastContext.tsx
"use client";
import React, { createContext, useContext, useState, ReactNode } from 'react';
import Toast, { ToastType } from '@/components/ui/Toast';

interface ToastContextProps {
  showToast: (message: string, type: ToastType, duration?: number) => void;
  showSuccessToast: (message: string) => void;
  showErrorToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: ReactNode;
}

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  
  const showToast = (message: string, type: ToastType, duration?: number) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type, duration }]);
  };

  const showSuccessToast = (message: string) => {
    showToast(message, 'success');
  };
  
  const showErrorToast = (message: string) => {
    showToast(message, 'error');
  };
  
  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };
  
  return (
    <ToastContext.Provider value={{ showToast, showSuccessToast, showErrorToast }}>
      {children}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </ToastContext.Provider>
  );
}