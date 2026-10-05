import React, { useEffect } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { AndroidStatusBar } from './AndroidStatusBar';
import { AndroidSystemNavBar } from './AndroidSystemNavBar';
import { useAuthAndTheme } from '../../context/AuthAndThemeContext';

const NativeSystemBars = registerPlugin<{
  setSystemBars: (options: { bright: boolean }) => Promise<void>;
}>('NativePrint');

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

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    void NativeSystemBars.setSystemBars({ bright: isBright }).catch((error) => {
      console.warn('Could not update Android system-bar appearance:', error);
    });
  }, [isBright]);
  const nativeSafeAreaStyle: React.CSSProperties = {
    paddingTop: 'var(--safe-area-inset-top, env(safe-area-inset-top, 0px))',
    paddingBottom: 'var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px))',
  };

  // The installed app already has Android's real system UI. Do not render the
  // simulated status/navigation bars or phone chassis inside its WebView.
  if (Capacitor.isNativePlatform()) {
    return (
      <div
        style={nativeSafeAreaStyle}
        className={`h-[100dvh] w-full max-w-full overflow-hidden transition-colors duration-200 ${
          isBright ? 'bg-[#F4F4F6] theme-bright' : 'bg-[#1E1E24]'
        }`}
      >
        <div
          className={`h-full w-full flex flex-col relative overflow-hidden font-sans ${
            isBright ? 'text-[#27272A] theme-bright' : 'text-[#F4F4F6]'
          }`}
        >
          {children}
        </div>
      </div>
    );
  }

  // Real mobile viewports use the device's own system status/navigation bars.
  if (!isFramed) {
    return (
      <div
        style={nativeSafeAreaStyle}
        className={`h-screen w-full max-w-full flex items-center justify-center overflow-x-hidden overflow-y-hidden transition-colors duration-200 ${
          isBright ? 'bg-[#E4E4E7] theme-bright' : 'bg-[#18181D]'
        }`}
      >
        <div
          className={`h-full w-full max-w-[min(430px,100vw)] flex flex-col justify-between font-sans overflow-x-hidden overflow-y-hidden relative shadow-2xl transition-colors duration-200 ${
            isBright ? 'bg-[#F4F4F6] text-[#27272A] theme-bright' : 'bg-[#1E1E24] text-[#F4F4F6]'
          }`}
        >
          <div className="flex-1 flex flex-col min-h-0 relative overflow-x-hidden overflow-y-hidden w-full max-w-full">
            {children}
          </div>
        </div>
      </div>
    );
  }

  // Framed view for desktop / tablet previews: renders authentic Android smartphone
  return (
    <div
      className={`h-screen max-h-screen w-full max-w-full flex flex-col items-center justify-center p-2 sm:p-3 select-none font-sans overflow-x-hidden overflow-y-hidden transition-colors duration-200 ${
        isBright ? 'bg-[#E4E4E7] theme-bright' : 'bg-[#18181D]'
      }`}
    >
      {/* Top Ambient Bar for Desktop Viewers */}
      <div className="w-full max-w-[min(420px,calc(100vw-1.5rem))] mb-2 flex items-center justify-between text-xs px-2 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#7A9B76] animate-pulse" />
          <span
            className={`font-mono text-[11px] font-semibold truncate ${
              isBright ? 'text-[#71717A]' : 'text-[#A1A1AA]'
            }`}
          >
            Titanium &amp; Rose Gold &bull; Foundry Edition
          </span>
        </div>
      </div>

      {/* Smartphone Chassis */}
      <div
        className={`relative w-full max-w-[min(420px,calc(100vw-1.5rem))] h-[calc(100vh-3.25rem)] max-h-[860px] rounded-[46px] p-3 flex flex-col transition-all duration-200 shrink min-h-0 overflow-visible ${
          isBright
            ? 'bg-[#FFFFFF] shadow-[0_20px_50px_rgba(0,0,0,0.12),0_10px_20px_rgba(0,0,0,0.06)] border-[4px] border-[#D4D4D8]'
            : 'bg-[#292930] shadow-[0_0_60px_rgba(0,0,0,0.85),0_20px_40px_rgba(0,0,0,0.6)] border-[4px] border-[#3F3F46] ring-1 ring-white/10'
        }`}
      >
        {/* Device Physical Buttons (Exterior Styling) */}
        <div
          className={`absolute -left-[6px] top-28 w-[3px] h-12 rounded-l-sm pointer-events-none ${
            isBright ? 'bg-[#D4D4D8]' : 'bg-[#3F3F46]'
          }`}
        />
        <div
          className={`absolute -left-[6px] top-44 w-[3px] h-12 rounded-l-sm pointer-events-none ${
            isBright ? 'bg-[#D4D4D8]' : 'bg-[#3F3F46]'
          }`}
        />
        <div className="absolute -right-[6px] top-32 w-[3px] h-14 bg-[#E07A5F] rounded-r-sm pointer-events-none" />

        {/* Screen Display Container */}
        <div
          className={`w-full h-full rounded-[38px] flex flex-col overflow-x-hidden overflow-y-hidden relative shadow-inner transition-colors duration-200 max-w-full ${
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
          <div className="flex-1 flex flex-col min-h-0 relative overflow-x-hidden overflow-y-hidden w-full max-w-full">
            {children}
          </div>

          {/* Android System Navigation Bar (Back, Home, Recents) */}
          <AndroidSystemNavBar onBack={onBack} onHome={onHome} onRecents={onRecents} />
        </div>
      </div>
    </div>
  );
};
