import React from 'react';
import { commonStyles } from './styles';

interface SectionContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const SectionContainer: React.FC<SectionContainerProps> = ({ 
  children,
  className = ''
}) => {
  return (
    <div className={`
      w-full
      max-w-screen-xl
      mx-auto
      px-4 lg:px-6
      py-4 lg:py-8
      ${className}
    `}>
      {children}
    </div>
  );
};