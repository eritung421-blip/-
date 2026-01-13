
import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`glass rounded-3xl p-6 transition-all duration-300 hover:shadow-lg ${onClick ? 'cursor-pointer hover:scale-[1.02]' : ''} ${className}`}
    >
      {children}
    </div>
  );
};
