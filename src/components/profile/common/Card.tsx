import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`
      bg-white rounded-2xl shadow-sm border border-gray-100 
      transition-all duration-200 hover:shadow-md
      ${className}
    `}>
      {children}
    </div>
  );
};