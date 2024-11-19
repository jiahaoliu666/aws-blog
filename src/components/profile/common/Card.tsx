import React from 'react';

export const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="
      bg-white 
      rounded-2xl 
      shadow-sm 
      border border-gray-200/80
      transition-all 
      duration-300
      hover:shadow-lg
      hover:shadow-gray-200/50
      hover:border-gray-300/80
      hover:bg-gray-50/50
      backdrop-blur-xl 
      backdrop-saturate-150
      transform-gpu
      dark:bg-gray-800
      dark:border-gray-700/80
      dark:hover:bg-gray-750
      dark:hover:border-gray-600/80
      dark:hover:shadow-gray-900/30
    ">
      {children}
    </div>
  );
};