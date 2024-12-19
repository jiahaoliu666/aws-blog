import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCircleCheck, 
  faCircleExclamation, 
  faCircleInfo, 
  faTriangleExclamation 
} from '@fortawesome/free-solid-svg-icons';

interface AlertProps {
  message: string;
  type?: 'error' | 'success' | 'warning' | 'info';
}

const Alert: React.FC<AlertProps> = ({ message, type = 'info' }) => {
  const styles = {
    error: {
      wrapper: 'border-red-300 bg-red-50 text-red-700',
      icon: faCircleExclamation
    },
    success: {
      wrapper: 'border-green-300 bg-green-50 text-green-700',
      icon: faCircleCheck
    },
    warning: {
      wrapper: 'border-yellow-300 bg-yellow-50 text-yellow-700',
      icon: faTriangleExclamation
    },
    info: {
      wrapper: 'border-blue-300 bg-blue-50 text-blue-700',
      icon: faCircleInfo
    }
  };

  return (
    <div 
      className={`
        mt-4 mb-6 px-6 py-4
        rounded-lg border 
        ${styles[type].wrapper}
        text-center font-medium
        shadow-md backdrop-blur-sm
        transform transition-all duration-300
        animate-fadeIn
        flex items-center justify-center gap-3
      `}
    >
      <FontAwesomeIcon 
        icon={styles[type].icon} 
        className="text-lg"
      />
      <span className="text-sm">{message}</span>
    </div>
  );
};

export default Alert; 