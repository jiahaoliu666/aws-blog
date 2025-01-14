import React from 'react';
import { commonStyles } from './styles';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`
      bg-white 
      border-0
      ring-2
      ring-gray-300 
      rounded-2xl 
      shadow-sm 
      hover:ring-gray-400 
      transition-all 
      duration-200
      ${className}
      w-full
    `}>
      {children}
    </div>
  );
};