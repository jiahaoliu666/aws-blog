import { useState, useCallback, useRef } from 'react';
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

interface QueuedToast {
  message: string;
  type: ToastType;
  options?: {
    description?: string;
    duration?: number | false;
    position?: 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    icon?: IconDefinition;
    className?: string;
  };
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
  const toastQueue = useRef<QueuedToast[]>([]);
  const isProcessing = useRef(false);

  const processNextToast = useCallback(() => {
    if (toastQueue.current.length === 0) {
      isProcessing.current = false;
      return;
    }

    isProcessing.current = true;
    const { message, type, options } = toastQueue.current.shift()!;

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

    const defaultDurations = {
      success: 2500,
      error: 4000,
      info: 3000,
      warning: 3500,
      loading: 1500
    };

    const duration = options?.duration ?? defaultDurations[type] ?? 3000;

    if (duration !== false) {
      setTimeout(() => {
        setToasts(prev => 
          prev.map(t => 
            t.id === id ? { ...t, isVisible: false } : t
          )
        );

        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== id));
          // 處理下一個 toast
          processNextToast();
        }, 400);
      }, duration);
    }
  }, []);

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
    // 將新的 toast 加入佇列
    toastQueue.current.push({ message, type, options });

    // 如果沒有正在處理的 toast，開始處理佇列
    if (!isProcessing.current) {
      processNextToast();
    }
  }, [processNextToast]);

  return {
    toasts,
    remove,
    showToast
  };
}; 