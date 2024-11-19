import React from 'react';
import { commonStyles as styles } from './styles';

interface SectionTitleProps {
  title: string;
  description: string;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ 
  title, 
  description 
}) => {
  return (
    <div className="space-y-2">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{title}</h1>
      <p className="text-sm sm:text-base text-gray-600">{description}</p>
    </div>
  );
};