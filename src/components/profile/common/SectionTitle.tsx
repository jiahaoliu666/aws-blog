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
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">{title}</h1>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};