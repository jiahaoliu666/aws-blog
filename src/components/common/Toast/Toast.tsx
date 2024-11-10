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
}

const Toast: React.FC<ToastProps> = ({
  message,
  type,
  isVisible,
  position = 'top-right',
  autoClose = 3000,
  onClose,
  description
}) => {
  const getToastStyles = () => {
    const baseStyles = "fixed px-4 py-3 rounded-lg shadow-lg z-50 flex items-start gap-3 max-w-md w-full";
    const positionStyles = {
      'top': "top-4 left-1/2 -translate-x-1/2",
      'bottom': "bottom-4 left-1/2 -translate-x-1/2",
      'top-right': "top-4 right-4",
      'top-left': "top-4 left-4",
      'bottom-right': "bottom-4 right-4",
      'bottom-left': "bottom-4 left-4"
    };
    const typeStyles = {
      success: "bg-green-50 border border-green-200 text-green-800",
      error: "bg-red-50 border border-red-200 text-red-800",
      info: "bg-blue-50 border border-blue-200 text-blue-800",
      loading: "bg-gray-50 border border-gray-200 text-gray-800",
      warning: "bg-yellow-50 border border-yellow-200 text-yellow-800"
    };
    
    return `${baseStyles} ${positionStyles[position]} ${typeStyles[type]} ${
      isVisible ? 'toast-enter' : 'toast-exit'
    }`;
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FontAwesomeIcon icon={faCheck} className="text-green-500 text-lg" />;
      case 'error':
        return <FontAwesomeIcon icon={faTimes} className="text-red-500 text-lg" />;
      case 'info':
        return <FontAwesomeIcon icon={faInfoCircle} className="text-blue-500 text-lg" />;
      case 'loading':
        return <FontAwesomeIcon icon={faSpinner} className="text-gray-500 text-lg animate-spin" />;
      case 'warning':
        return <FontAwesomeIcon icon={faTriangleExclamation} className="text-yellow-500 text-lg" />;
    }
  };

  const CloseButton = () => (
    <button
      onClick={onClose}
      className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
    >
      <FontAwesomeIcon icon={faXmark} />
    </button>
  );

  if (!isVisible) return null;

  return (
    <div className={getToastStyles()}>
      <div className="flex-shrink-0">{getIcon()}</div>
      <div className="flex-1 pr-8">
        <h4 className="font-semibold text-sm">{message}</h4>
        {description && (
          <p className="text-sm mt-1 opacity-80">{description}</p>
        )}
      </div>
      <CloseButton />
      {type === 'loading' && (
        <div className="absolute bottom-0 left-0 h-1 bg-gray-200 w-full">
          <div className="h-full bg-blue-500 toast-progress" 
               style={{animationDuration: `${autoClose}ms`}} />
        </div>
      )}
    </div>
  );
};

export default Toast; 