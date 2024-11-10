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
    const baseStyles = "fixed px-6 py-4 rounded-xl shadow-lg z-50 flex items-start gap-4 max-w-md w-full transition-all duration-300 backdrop-blur-sm border";
    const positionStyles = {
      'top': "top-6 left-1/2 -translate-x-1/2",
      'bottom': "bottom-6 left-1/2 -translate-x-1/2",
      'top-right': "top-6 right-6",
      'top-left': "top-6 left-6",
      'bottom-right': "bottom-6 right-6",
      'bottom-left': "bottom-6 left-6"
    };
    const typeStyles = {
      success: "bg-green-100/95 dark:bg-green-800/90 border-green-400 text-green-700 dark:text-green-100",
      error: "bg-red-100/95 dark:bg-red-800/90 border-red-400 text-red-700 dark:text-red-100",
      info: "bg-blue-100/95 dark:bg-blue-800/90 border-blue-400 text-blue-700 dark:text-blue-100",
      loading: "bg-purple-100/95 dark:bg-purple-800/90 border-purple-400 text-purple-700 dark:text-purple-100",
      warning: "bg-amber-100/95 dark:bg-amber-800/90 border-amber-400 text-amber-700 dark:text-amber-100"
    };
    
    return `${baseStyles} ${positionStyles[position]} ${typeStyles[type]} ${className} ${
      isVisible ? 'toast-enter' : 'toast-exit'
    }`;
  };

  const getIcon = () => {
    const iconStyles = {
      success: "text-green-600 dark:text-green-300 text-lg",
      error: "text-red-600 dark:text-red-300 text-lg",
      info: "text-blue-600 dark:text-blue-300 text-lg",
      loading: "text-purple-600 dark:text-purple-300 text-lg",
      warning: "text-amber-600 dark:text-amber-300 text-lg"
    };

    return (
      <div className={`${iconStyles[type]} flex-shrink-0`}>
        {icon ? (
          <FontAwesomeIcon icon={icon} className="w-5 h-5" />
        ) : (
          <FontAwesomeIcon icon={getDefaultIcon()} className="w-5 h-5" />
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

  const CloseButton = () => (
    <button
      onClick={onClose}
      className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors rounded-full p-1 hover:bg-black/5 dark:hover:bg-white/10"
    >
      <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
    </button>
  );

  if (!isVisible) return null;

  return (
    <div className={getToastStyles()}>
      {getIcon()}
      <div className="flex-1 pr-8">
        <h4 className="font-medium text-base">{message}</h4>
        {description && (
          <p className="text-sm mt-1.5 opacity-85 leading-relaxed">{description}</p>
        )}
      </div>
      <CloseButton />
      {showProgress && (
        <div className="absolute bottom-0 left-0 h-0.5 bg-gray-200/50 dark:bg-gray-700/50 w-full overflow-hidden">
          <div 
            className="h-full toast-progress rounded-r-full" 
            style={{
              width: `${progress}%`,
              backgroundColor: 'currentColor',
              opacity: 0.5
            }} 
          />
        </div>
      )}
    </div>
  );
};

export default Toast; 