import React from 'react';
import { Layers, Camera, Archive, X, RotateCcw } from 'lucide-react';
import { ActiveTab } from '../Navigation';
import { AppLogoIcon } from '../AppLogoIcon';
import { useAuthAndTheme } from '../../context/AuthAndThemeContext';

interface AndroidRecentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenScanner: () => void;
}

export const AndroidRecentsModal: React.FC<AndroidRecentsModalProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onOpenScanner,
}) => {
  const { theme } = useAuthAndTheme();
  const isBright = theme === 'bright';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-between p-6 animate-in fade-in select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-semibold text-[#A1A1AA] uppercase tracking-widest">
          Android Recent Tasks
        </span>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-[#292930] text-[#A1A1AA] hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Task Cards Carousel */}
      <div className="flex items-center justify-center gap-4 overflow-x-auto py-4">
        {/* Card 1: Shreenathji Job-Work */}
        <div
          onClick={() => {
            onSelectTab('dashboard');
            onClose();
          }}
          className={`w-64 h-96 rounded-3xl border-2 shadow-2xl p-4 flex flex-col justify-between cursor-pointer hover:scale-105 transition-transform group ${
            isBright
              ? 'bg-[#FFFFFF] border-[#E07A5F]'
              : 'bg-[#292930] border-[#E07A5F]'
          }`}
        >
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AppLogoIcon size="sm" />
              <span className={`text-xs font-bold truncate ${isBright ? 'text-[#27272A]' : 'text-[#F4F4F6]'}`}>
                Shreenathji Tracker
              </span>
            </div>
            <div
              className={`rounded-2xl p-3 border text-[11px] space-y-1.5 ${
                isBright
                  ? 'bg-[#F4F4F6] border-[#D4D4D8] text-[#71717A]'
                  : 'bg-[#1E1E24] border-[#3F3F46] text-[#A1A1AA]'
              }`}
            >
              <div className="font-semibold text-[#E07A5F]">Active Foundry Floor</div>
              <div>Titanium &amp; Rose Gold Pipeline</div>
              <div className="text-[10px] text-[#71717A] font-mono">Running in foreground</div>
            </div>
          </div>
          <button className="w-full py-2.5 rounded-xl bg-[#E07A5F] hover:bg-[#E8998D] text-white font-bold text-xs transition active:scale-95 shadow-md">
            Resume Foundry
          </button>
        </div>

        {/* Card 2: Camera Scanner Task */}
        <div
          onClick={() => {
            onOpenScanner();
            onClose();
          }}
          className={`w-64 h-96 rounded-3xl border shadow-2xl p-4 flex flex-col justify-between cursor-pointer hover:scale-105 transition-transform group opacity-85 hover:opacity-100 ${
            isBright
              ? 'bg-[#FFFFFF] border-[#D4D4D8]'
              : 'bg-[#292930] border-[#3F3F46]'
          }`}
        >
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-[#E07A5F]/20 text-[#E07A5F]">
                <Camera className="w-4 h-4" />
              </div>
              <span className={`text-xs font-bold truncate ${isBright ? 'text-[#27272A]' : 'text-[#F4F4F6]'}`}>
                Stage Slip Scanner
              </span>
            </div>
            <div
              className={`rounded-2xl p-3 border text-[11px] space-y-1.5 ${
                isBright
                  ? 'bg-[#F4F4F6] border-[#D4D4D8] text-[#71717A]'
                  : 'bg-[#1E1E24] border-[#3F3F46] text-[#A1A1AA]'
              }`}
            >
              <div className={`font-semibold ${isBright ? 'text-[#27272A]' : 'text-[#F4F4F6]'}`}>
                Scanner Engine
              </div>
              <div>QR Code &amp; Code128 Vision</div>
              <div className="text-[10px] text-[#71717A] font-mono">Suspended in background</div>
            </div>
          </div>
          <button
            className={`w-full py-2.5 rounded-xl border text-xs font-semibold transition ${
              isBright
                ? 'bg-[#F4F4F6] hover:bg-[#EBEBEF] text-[#27272A] border-[#D4D4D8]'
                : 'bg-[#1E1E24] hover:bg-[#34343D] text-[#F4F4F6] border-[#3F3F46]'
            }`}
          >
            Launch Scanner
          </button>
        </div>
      </div>

      {/* Bottom Clear All */}
      <div className="flex justify-center">
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#292930] hover:bg-[#34343D] text-[#A1A1AA] hover:text-white text-xs font-semibold border border-[#3F3F46] transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Clear All Tasks</span>
        </button>
      </div>
    </div>
  );
};
