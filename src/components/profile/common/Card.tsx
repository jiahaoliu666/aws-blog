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
      border-2 
      border-gray-300 
      rounded-2xl 
      shadow-sm 
      hover:border-gray-400 
      transition-all 
      duration-200
      ${className}
      w-full
      overflow-hidden
    `}>
      {children}
    </div>
  );
};