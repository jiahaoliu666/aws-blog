import React from 'react';
import { commonStyles } from './styles';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`
      ${commonStyles.container}
      ${className}
      w-full
      overflow-hidden
      p-4 lg:p-6
    `}>
      {children}
    </div>
  );
};