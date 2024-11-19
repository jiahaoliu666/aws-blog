import React from 'react';
import { commonStyles } from './styles';

interface SectionContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const SectionContainer: React.FC<SectionContainerProps> = ({ children, className = '' }) => {
  return (
    <div className={`
      w-full 
      max-w-7xl 
      mx-auto 
      px-4 
      sm:px-6 
      lg:px-8 
      transition-all 
      duration-200 
      ${className}
    `}>
      {children}
    </div>
  );
};