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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-in fade-in select-none overflow-y-auto overflow-x-hidden w-full max-w-full">
      {/* Top Header */}
      <div className="flex items-center justify-between w-full shrink-0">
        <span className="text-xs font-mono font-semibold text-[#A1A1AA] uppercase tracking-widest truncate">
          Android Recent Tasks
        </span>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-[#292930] text-[#A1A1AA] hover:text-white shrink-0 ml-2"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Task Cards Deck (Fixed horizontally, no horizontal scroll) */}
      <div className="w-full max-w-md mx-auto my-auto py-3 grid grid-cols-1 sm:grid-cols-2 gap-3.5 overflow-x-hidden">
        {/* Card 1: Shreenathji Job-Work */}
        <div
          onClick={() => {
            onSelectTab('dashboard');
            onClose();
          }}
          className={`w-full rounded-2xl sm:rounded-3xl border-2 shadow-2xl p-4 flex flex-col justify-between cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform group ${
            isBright
              ? 'bg-[#FFFFFF] border-[#E07A5F]'
              : 'bg-[#292930] border-[#E07A5F]'
          }`}
        >
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <AppLogoIcon size="sm" />
              <span className={`text-xs font-bold truncate ${isBright ? 'text-[#27272A]' : 'text-[#F4F4F6]'}`}>
                Shreenathji Tracker
              </span>
            </div>
            <div
              className={`rounded-xl sm:rounded-2xl p-2.5 sm:p-3 border text-[11px] space-y-1.5 ${
                isBright
                  ? 'bg-[#F4F4F6] border-[#D4D4D8] text-[#71717A]'
                  : 'bg-[#1E1E24] border-[#3F3F46] text-[#A1A1AA]'
              }`}
            >
              <div className="font-semibold text-[#E07A5F]">Active Foundry Floor</div>
              <div className="truncate">Titanium &amp; Rose Gold Pipeline</div>
              <div className="text-[10px] text-[#71717A] font-mono">Running in foreground</div>
            </div>
          </div>
          <button className="w-full mt-3 py-2 rounded-xl bg-[#E07A5F] hover:bg-[#E8998D] text-white font-bold text-xs transition active:scale-95 shadow-md">
            Resume Foundry
          </button>
        </div>

        {/* Card 2: Camera Scanner Task */}
        <div
          onClick={() => {
            onOpenScanner();
            onClose();
          }}
          className={`w-full rounded-2xl sm:rounded-3xl border shadow-2xl p-4 flex flex-col justify-between cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform group opacity-90 hover:opacity-100 ${
            isBright
              ? 'bg-[#FFFFFF] border-[#D4D4D8]'
              : 'bg-[#292930] border-[#3F3F46]'
          }`}
        >
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <div className="p-1.5 rounded-lg bg-[#E07A5F]/20 text-[#E07A5F] shrink-0">
                <Camera className="w-4 h-4" />
              </div>
              <span className={`text-xs font-bold truncate ${isBright ? 'text-[#27272A]' : 'text-[#F4F4F6]'}`}>
                Stage Slip Scanner
              </span>
            </div>
            <div
              className={`rounded-xl sm:rounded-2xl p-2.5 sm:p-3 border text-[11px] space-y-1.5 ${
                isBright
                  ? 'bg-[#F4F4F6] border-[#D4D4D8] text-[#71717A]'
                  : 'bg-[#1E1E24] border-[#3F3F46] text-[#A1A1AA]'
              }`}
            >
              <div className={`font-semibold ${isBright ? 'text-[#27272A]' : 'text-[#F4F4F6]'}`}>
                Scanner Engine
              </div>
              <div className="truncate">QR Code &amp; Code128 Vision</div>
              <div className="text-[10px] text-[#71717A] font-mono">Suspended in background</div>
            </div>
          </div>
          <button
            className={`w-full mt-3 py-2 rounded-xl border text-xs font-semibold transition ${
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
      <div className="flex justify-center shrink-0 pt-2">
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-5 py-2 rounded-full bg-[#292930] hover:bg-[#34343D] text-[#A1A1AA] hover:text-white text-xs font-semibold border border-[#3F3F46] transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Clear All Tasks</span>
        </button>
      </div>
    </div>
  );
};
