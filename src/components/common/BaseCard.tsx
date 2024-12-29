import React from 'react';

interface BaseCardProps {
  children: React.ReactNode;
  className?: string;
}

const BaseCard: React.FC<BaseCardProps> = ({ children, className = '' }) => {
  return (
    <div className={`
      border rounded-lg 
      transition-shadow duration-300 
      ${className}
    `}>
      {children}
    </div>
  );
};

export default BaseCard; 