import React, { createContext, useContext } from 'react';
import { useToast, ToastReturnType } from '@/hooks/toast/useToast';
import { Toast } from '@/components/common/Toast';

const ToastContext = createContext<ToastReturnType | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const toast: ToastReturnType = useToast();

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {toast.toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          isVisible={toast.isVisible}
        />
      ))}
    </ToastContext.Provider>
  );
};

export const useToastContext = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
}; 