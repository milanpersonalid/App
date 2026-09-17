import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Signal } from 'lucide-react';
import { useAuthAndTheme } from '../../context/AuthAndThemeContext';

export const AndroidStatusBar: React.FC = () => {
  const { theme } = useAuthAndTheme();
  const isBright = theme === 'bright';
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      hours = hours % 12 || 12;
      setCurrentTime(`${hours}:${minutes}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`h-7 w-full px-4 flex items-center justify-between text-[11px] font-medium select-none z-50 border-b transition-colors duration-200 ${
        isBright
          ? 'bg-[#F4F4F6] text-[#27272A] border-[#D4D4D8]'
          : 'bg-[#1E1E24] text-[#F4F4F6] border-[#3F3F46]'
      }`}
    >
      {/* Left side: Clock */}
      <div className={`font-semibold tracking-tight ${isBright ? 'text-[#27272A]' : 'text-[#F4F4F6]'}`}>
        {currentTime || '10:45'}
      </div>

      {/* Right side: Android Status Icons */}
      <div className={`flex items-center gap-1.5 ${isBright ? 'text-[#71717A]' : 'text-[#A1A1AA]'}`}>
        <span className="text-[10px] font-bold text-[#E07A5F] font-mono tracking-tighter">5G</span>
        <Signal className="w-3 h-3 stroke-[2.5]" />
        <Wifi className="w-3.2 h-3.2 stroke-[2.5]" />
        <div className="flex items-center gap-0.5 ml-0.5">
          <span className="text-[9px] font-mono opacity-80">100%</span>
          <Battery className="w-3.5 h-3.5 text-[#7A9B76] fill-[#7A9B76]/30 stroke-[2]" />
        </div>
      </div>
    </div>
  );
};
