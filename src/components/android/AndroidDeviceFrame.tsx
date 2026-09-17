import React from 'react';
import { AndroidStatusBar } from './AndroidStatusBar';
import { AndroidSystemNavBar } from './AndroidSystemNavBar';
import { useAuthAndTheme } from '../../context/AuthAndThemeContext';

interface AndroidDeviceFrameProps {
  isFramed: boolean;
  onToggleFrame: () => void;
  onBack: () => void;
  onHome: () => void;
  onRecents: () => void;
  children: React.ReactNode;
}

export const AndroidDeviceFrame: React.FC<AndroidDeviceFrameProps> = ({
  isFramed,
  onToggleFrame,
  onBack,
  onHome,
  onRecents,
  children,
}) => {
  const { theme } = useAuthAndTheme();
  const isBright = theme === 'bright';

  // If not framed (e.g. user toggled off or on real mobile phone), render 100% edge-to-edge
  if (!isFramed) {
    return (
      <div
        className={`min-h-screen w-full flex flex-col justify-between font-sans transition-colors duration-200 ${
          isBright ? 'bg-[#F4F4F6] text-[#27272A] theme-bright' : 'bg-[#1E1E24] text-[#F4F4F6]'
        }`}
      >
        <AndroidStatusBar />
        <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
          {children}
        </div>
        <AndroidSystemNavBar onBack={onBack} onHome={onHome} onRecents={onRecents} />
      </div>
    );
  }

  // Framed view for desktop / tablet previews: renders authentic Android smartphone
  return (
    <div
      className={`min-h-screen w-full flex flex-col items-center justify-center p-2 sm:p-6 select-none font-sans overflow-x-hidden transition-colors duration-200 ${
        isBright ? 'bg-[#E4E4E7] theme-bright' : 'bg-[#18181D]'
      }`}
    >
      {/* Top Ambient Bar for Desktop Viewers */}
      <div className="w-full max-w-[430px] mb-3 flex items-center justify-between text-xs px-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#7A9B76] animate-pulse" />
          <span
            className={`font-mono text-[11px] font-semibold ${
              isBright ? 'text-[#71717A]' : 'text-[#A1A1AA]'
            }`}
          >
            Titanium &amp; Rose Gold &bull; Foundry Edition
          </span>
        </div>
      </div>

      {/* Smartphone Chassis */}
      <div
        className={`relative w-full max-w-[420px] h-[92vh] max-h-[890px] rounded-[46px] p-3 flex flex-col transition-all duration-200 ${
          isBright
            ? 'bg-[#FFFFFF] shadow-[0_20px_50px_rgba(0,0,0,0.12),0_10px_20px_rgba(0,0,0,0.06)] border-[4px] border-[#D4D4D8]'
            : 'bg-[#292930] shadow-[0_0_60px_rgba(0,0,0,0.85),0_20px_40px_rgba(0,0,0,0.6)] border-[4px] border-[#3F3F46] ring-1 ring-white/10'
        }`}
      >
        {/* Device Physical Buttons (Exterior Styling) */}
        <div
          className={`absolute -left-[7px] top-28 w-[3px] h-12 rounded-l-sm ${
            isBright ? 'bg-[#D4D4D8]' : 'bg-[#3F3F46]'
          }`}
        />
        <div
          className={`absolute -left-[7px] top-44 w-[3px] h-12 rounded-l-sm ${
            isBright ? 'bg-[#D4D4D8]' : 'bg-[#3F3F46]'
          }`}
        />
        <div className="absolute -right-[7px] top-32 w-[3px] h-14 bg-[#E07A5F] rounded-r-sm" />

        {/* Screen Display Container */}
        <div
          className={`w-full h-full rounded-[38px] flex flex-col overflow-hidden relative shadow-inner transition-colors duration-200 ${
            isBright ? 'bg-[#F4F4F6] text-[#27272A]' : 'bg-[#1E1E24] text-[#F4F4F6]'
          }`}
        >
          {/* Top Notch / Camera Cutout */}
          <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-black border border-neutral-800 z-50 flex items-center justify-center pointer-events-none">
            <div className="w-1.5 h-1.5 rounded-full bg-[#0a1020]" />
          </div>

          {/* Android Status Bar */}
          <AndroidStatusBar />

          {/* Screen Content Body */}
          <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
            {children}
          </div>

          {/* Android System Navigation Bar (Back, Home, Recents) */}
          <AndroidSystemNavBar onBack={onBack} onHome={onHome} onRecents={onRecents} />
        </div>
      </div>
    </div>
  );
};
