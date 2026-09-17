import React, { useState } from 'react';

interface AppLogoIconProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const AppLogoIcon: React.FC<AppLogoIconProps> = ({
  className = '',
  size = 'md',
}) => {
  const sizeStyles = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-14 h-14',
    xl: 'w-24 h-24',
  };

  return (
    <div
      className={`relative rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center bg-white shadow-sm border border-amber-200/60 ${sizeStyles[size]} ${className}`}
    >
      <img
        src="/shreenathji-logo.png"
        alt="Shreenathji Imitation Logo"
        className="w-full h-full object-contain p-0.5"
      />
    </div>
  );
};
