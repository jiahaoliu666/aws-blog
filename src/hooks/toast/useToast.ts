import { useState, useCallback } from 'react';
import { ToastType } from '@/components/common/Toast';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

interface ToastState {
  message: string;
  type: ToastType;
  isVisible: boolean;
  description?: string;
  id: string;
  position?: 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  icon?: IconDefinition;
  className?: string;
}

export type ToastReturnType = {
  toasts: ToastState[];
  remove: (id: string) => void;
  showToast: (message: string, type: ToastType, options?: {
    description?: string;
    duration?: number | false;
    position?: 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    icon?: IconDefinition;
    className?: string;
  }) => void;
};

export const useToast = (): ToastReturnType => {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showToast = useCallback((
    message: string, 
    type: ToastType, 
    options?: {
      description?: string;
      duration?: number | false;
      position?: 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
      icon?: IconDefinition;
      className?: string;
    }
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast = {
      id,
      message,
      type,
      isVisible: true,
      description: options?.description,
      position: options?.position || 'top-right',
      icon: options?.icon,
      className: options?.className
    };

    setToasts(prev => [...prev.slice(-4), newToast]);
    
    if (options?.duration !== false) {
      const duration = options?.duration || 5000;
      setTimeout(() => {
        setToasts(prev => 
          prev.map(t => 
            t.id === id ? { ...t, isVisible: false } : t
          )
        );
        
        setTimeout(() => remove(id), 400);
      }, duration);
    }
  }, [remove]);

  return {
    toasts,
    remove,
    showToast
  };
}; 