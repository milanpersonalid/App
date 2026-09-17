import React from 'react';
import { useAuthAndTheme } from '../../context/AuthAndThemeContext';

interface AndroidSystemNavBarProps {
  onBack: () => void;
  onHome: () => void;
  onRecents: () => void;
  navMode?: 'buttons' | 'gesture';
}

export const AndroidSystemNavBar: React.FC<AndroidSystemNavBarProps> = ({
  onBack,
  onHome,
  onRecents,
  navMode = 'buttons',
}) => {
  const { theme } = useAuthAndTheme();
  const isBright = theme === 'bright';

  const triggerHaptic = () => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(12);
      }
    } catch {
      // safe fallback
    }
  };

  const handleBack = () => {
    triggerHaptic();
    onBack();
  };

  const handleHome = () => {
    triggerHaptic();
    onHome();
  };

  const handleRecents = () => {
    triggerHaptic();
    onRecents();
  };

  if (navMode === 'gesture') {
    return (
      <div
        className={`h-4 w-full flex items-center justify-center pb-1 select-none transition-colors duration-200 ${
          isBright ? 'bg-[#F4F4F6]' : 'bg-[#1E1E24]'
        }`}
      >
        <div
          onClick={handleHome}
          className={`w-32 h-1 rounded-full transition-all cursor-pointer active:scale-95 ${
            isBright ? 'bg-[#D4D4D8] hover:bg-[#71717A]' : 'bg-[#3F3F46] hover:bg-[#A1A1AA]'
          }`}
        />
      </div>
    );
  }

  return (
    <div
      className={`h-10 w-full px-8 flex items-center justify-around select-none border-t transition-colors duration-200 z-50 ${
        isBright
          ? 'bg-[#F4F4F6] border-[#D4D4D8]'
          : 'bg-[#1E1E24] border-[#3F3F46]'
      }`}
    >
      {/* Android Back (Triangle / Left arrow) */}
      <button
        type="button"
        onClick={handleBack}
        title="Android Back"
        className={`p-2 active:scale-90 transition rounded-full ${
          isBright
            ? 'text-[#71717A] hover:text-[#27272A] active:text-[#E07A5F]'
            : 'text-[#A1A1AA] hover:text-[#F4F4F6] active:text-[#E07A5F]'
        }`}
      >
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M19 19L5 12L19 5V19Z" />
        </svg>
      </button>

      {/* Android Home (Circle) */}
      <button
        type="button"
        onClick={handleHome}
        title="Android Home"
        className={`p-2 active:scale-90 transition rounded-full ${
          isBright
            ? 'text-[#71717A] hover:text-[#27272A] active:text-[#E07A5F]'
            : 'text-[#A1A1AA] hover:text-[#F4F4F6] active:text-[#E07A5F]'
        }`}
      >
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="7" />
        </svg>
      </button>

      {/* Android Recents (Square) */}
      <button
        type="button"
        onClick={handleRecents}
        title="Android Recents / Multitasking"
        className={`p-2 active:scale-90 transition rounded-full ${
          isBright
            ? 'text-[#71717A] hover:text-[#27272A] active:text-[#E07A5F]'
            : 'text-[#A1A1AA] hover:text-[#F4F4F6] active:text-[#E07A5F]'
        }`}
      >
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <rect x="5" y="5" width="14" height="14" rx="2" />
        </svg>
      </button>
    </div>
  );
};
