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

  const messageLines = message.split('\n');

  return (
    <div 
      className={`
        mt-4 mb-6 px-6 py-4
        rounded-lg border 
        ${styles[type].wrapper}
        text-left font-medium
        shadow-md backdrop-blur-sm
        transform transition-all duration-300
        animate-fadeIn
      `}
    >
      <div className="flex items-start gap-3">
        <FontAwesomeIcon 
          icon={styles[type].icon} 
          className="text-lg mt-1"
        />
        <div className="text-sm">
          {messageLines.map((line, index) => (
            <React.Fragment key={index}>
              {line}
              {index < messageLines.length - 1 && <br />}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Alert; 