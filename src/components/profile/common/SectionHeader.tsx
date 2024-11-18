import React from 'react';

interface SectionHeaderProps {
  title: string;
  description: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, description }) => {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-gray-800 tracking-tight">{title}</h1>
      <p className="mt-2 text-gray-600">{description}</p>
    </div>
  );
};