import React from 'react';
import { commonStyles as styles } from './styles';

interface SectionTitleProps {
  title: string;
  description?: string;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ 
  title, 
  description 
}) => {
  return (
    <div className="space-y-1.5">
      <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
        {title}
      </h2>
      {description && (
        <p className="text-gray-600 text-sm sm:text-base max-w-2xl">
          {description}
        </p>
      )}
    </div>
  );
};