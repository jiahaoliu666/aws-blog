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
    toastId?: string;
  };
}

export type ToastReturnType = {
  toasts: ToastState[];
  remove: (id: string) => void;
  toast: (params: { message: string; type: ToastType; options?: Parameters<ToastReturnType['showToast']>[2] }) => void;
  showToast: (message: string, type: ToastType, options?: {
    description?: string;
    duration?: number | false;
    position?: 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    icon?: IconDefinition;
    className?: string;
    toastId?: string;
  }) => void;
  success: (message: string, options?: Parameters<ToastReturnType['showToast']>[2]) => void;
  error: (message: string, options?: Parameters<ToastReturnType['showToast']>[2]) => void;
  info: (message: string, options?: Parameters<ToastReturnType['showToast']>[2]) => void;
  warning: (message: string, options?: Parameters<ToastReturnType['showToast']>[2]) => void;
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

    const passwordDurations: Partial<Record<ToastType, number>> = {
      success: 3000,
      error: 4000,
    };

    const duration = options?.duration ?? 
      (message.includes('密碼') ? passwordDurations[type] ?? defaultDurations[type] : defaultDurations[type]);

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
      toastId?: string;
    }
  ) => {
    // 將新的 toast 加入佇列
    toastQueue.current.push({ message, type, options });

    // 如果沒有正在處理的 toast，開始處理佇列
    if (!isProcessing.current) {
      processNextToast();
    }
  }, [processNextToast]);

  const success = useCallback((message: string, options?: Parameters<ToastReturnType['showToast']>[2]) => {
    showToast(message, 'success', options);
  }, [showToast]);

  const error = useCallback((message: string, options?: Parameters<ToastReturnType['showToast']>[2]) => {
    showToast(message, 'error', options);
  }, [showToast]);

  const info = useCallback((message: string, options?: Parameters<ToastReturnType['showToast']>[2]) => {
    showToast(message, 'info', options);
  }, [showToast]);

  const warning = useCallback((message: string, options?: Parameters<ToastReturnType['showToast']>[2]) => {
    showToast(message, 'warning', options);
  }, [showToast]);

  const toast = useCallback((params: { message: string; type: ToastType; options?: Parameters<ToastReturnType['showToast']>[2] }) => {
    showToast(params.message, params.type, params.options);
  }, [showToast]);

  return {
    toasts,
    remove,
    toast,
    showToast,
    success,
    error,
    info,
    warning
  };
}; 