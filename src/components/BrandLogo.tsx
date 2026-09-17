import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = '',
}) => {
  const iconSizes = {
    sm: 'w-9 h-9',
    md: 'w-12 h-12',
    lg: 'w-20 h-20',
  };

  const titleSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Uploaded Authentic Shreenathji Logo */}
      <div className={`relative flex-shrink-0 ${iconSizes[size]} flex items-center justify-center rounded-full bg-white p-0.5 shadow-md border border-amber-200/50 overflow-hidden`}>
        <img
          src="/shreenathji-logo.png"
          alt="Shreenathji Imitation Logo"
          className="w-full h-full object-contain"
        />
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className={`font-brand font-bold tracking-wider text-[#E07A5F] drop-shadow-sm uppercase ${titleSizes[size]}`}>
            Shreenathji
          </span>
        </div>
        <div className="flex items-center gap-1.5 -mt-0.5">
          <span className="text-[10px] tracking-[0.25em] font-medium text-[#E8998D] uppercase">
            Imitation
          </span>
          {showSubtitle && (
            <>
              <span className="text-[#E07A5F]/60 text-[8px]">•</span>
              <span className="text-[9px] tracking-widest text-[#E07A5F] font-semibold uppercase">
                Foundry Edition
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
