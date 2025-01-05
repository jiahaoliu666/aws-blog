import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheck, 
  faTimes, 
  faSpinner, 
  faInfoCircle, 
  faXmark,
  faTriangleExclamation 
} from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export type ToastType = 'success' | 'error' | 'info' | 'loading' | 'warning';

interface ToastProps {
  message: string;
  type: ToastType;
  isVisible: boolean;
  position?: 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  autoClose?: number | false;
  onClose?: () => void;
  description?: string;
  progress?: number;
  showProgress?: boolean;
  icon?: IconDefinition;
  className?: string;
}

const Toast: React.FC<ToastProps> = ({
  message,
  type,
  isVisible,
  position = 'top-right',
  autoClose = 3000,
  onClose,
  description,
  progress = 100,
  showProgress = true,
  icon,
  className
}) => {
  const getToastStyles = () => {
    const baseStyles = "fixed px-6 py-4 rounded-2xl shadow-lg z-50 flex items-start gap-4 max-w-md w-full transition-all duration-300 border";
    const positionStyles = {
      'top': "top-24 left-1/2 -translate-x-1/2",
      'bottom': "bottom-6 left-1/2 -translate-x-1/2",
      'top-right': "top-24 right-6",
      'top-left': "top-24 left-6",
      'bottom-right': "bottom-6 right-6",
      'bottom-left': "bottom-6 left-6"
    };
    const typeStyles = {
      success: "bg-emerald-100 border-emerald-200 text-emerald-700 shadow-emerald-500/10",
      error: "bg-rose-100 border-rose-200 text-rose-700 shadow-rose-500/10",
      info: "bg-sky-100 border-sky-200 text-sky-700 shadow-sky-500/10",
      loading: "bg-blue-100 border-blue-200 text-blue-700 shadow-blue-500/10",
      warning: "bg-amber-100 border-amber-200 text-amber-700 shadow-amber-500/10"
    };
    
    return `${baseStyles} ${positionStyles[position]} ${typeStyles[type]} ${className} ${
      isVisible ? 'toast-enter' : 'toast-exit'
    }`;
  };

  const getIcon = () => {
    const iconStyles = {
      success: "text-emerald-600",
      error: "text-rose-600",
      info: "text-sky-600",
      loading: "text-blue-600",
      warning: "text-amber-600"
    };

    return (
      <div className={`${iconStyles[type]} flex-shrink-0 mt-1`}>
        {icon ? (
          <FontAwesomeIcon icon={icon} className="w-5 h-5" />
        ) : (
          <FontAwesomeIcon 
            icon={getDefaultIcon()} 
            className={`w-5 h-5 ${type === 'loading' ? 'animate-spin' : ''}`} 
          />
        )}
      </div>
    );
  };

  const getDefaultIcon = () => {
    switch (type) {
      case 'success': return faCheck;
      case 'error': return faTimes;
      case 'info': return faInfoCircle;
      case 'loading': return faSpinner;
      case 'warning': return faTriangleExclamation;
    }
  };

  if (!isVisible) return null;

  return (
    <div className={getToastStyles()}>
      {getIcon()}
      <div className="flex-1">
        <h4 className="font-semibold text-base leading-snug tracking-wide">{message}</h4>
        {description && (
          <p className="text-sm mt-1.5 opacity-90 leading-relaxed font-normal">{description}</p>
        )}
      </div>
      {showProgress && (
        <div className="absolute bottom-0 left-0 h-1 bg-black/5 dark:bg-white/10 w-full overflow-hidden rounded-b-2xl">
          <div 
            className="h-full toast-progress rounded-r-full" 
            style={{
              width: `${progress}%`,
              backgroundColor: 'currentColor',
              opacity: 0.15
            }} 
          />
        </div>
      )}
    </div>
  );
};

export default Toast; 