import { useState, useCallback } from 'react';
import { ToastType } from '@/components/common/Toast';

interface ToastState {
  message: string;
  type: ToastType;
  isVisible: boolean;
  description?: string;
  id: string;
}

export type ToastReturnType = {
  toasts: ToastState[];
  hideToast: (id: string) => void;
  showToast: (message: string, type: ToastType, options?: {
    description?: string;
    duration?: number | false;
  }) => void;
};

export const useToast = (): ToastReturnType => {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showToast = useCallback((
    message: string, 
    type: ToastType, 
    options?: {
      description?: string;
      duration?: number | false;
    }
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = {
      id,
      message,
      type,
      isVisible: true,
      description: options?.description
    };

    setToasts(prev => [...prev, newToast]);
    
    if (options?.duration !== false) {
      setTimeout(() => {
        hideToast(id);
      }, options?.duration || 3000);
    }
  }, [hideToast]);

  return {
    toasts,
    hideToast,
    showToast
  };
}; 