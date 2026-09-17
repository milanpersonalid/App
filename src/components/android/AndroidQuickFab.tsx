import React from 'react';
import { Camera, Plus } from 'lucide-react';
import { useAuthAndTheme } from '../../context/AuthAndThemeContext';

interface AndroidQuickFabProps {
  onOpenScanner: () => void;
  onOpenCreateLot: () => void;
}

export const AndroidQuickFab: React.FC<AndroidQuickFabProps> = ({
  onOpenScanner,
  onOpenCreateLot,
}) => {
  const { theme } = useAuthAndTheme();
  const isBright = theme === 'bright';

  const triggerHaptic = () => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(15);
      }
    } catch {
      // safe fallback
    }
  };

  return (
    <div className="absolute bottom-20 right-3.5 sm:right-4 z-50 flex flex-col items-end gap-2.5 pointer-events-auto select-none">
      {/* Quick Lot Add */}
      <button
        type="button"
        onClick={() => {
          triggerHaptic();
          onOpenCreateLot();
        }}
        title="New Lot"
        className={`w-10 h-10 rounded-2xl border shadow-lg flex items-center justify-center active:scale-95 transition ${
          isBright
            ? 'bg-[#FFFFFF] hover:bg-[#EBEBEF] text-[#E07A5F] border-[#D4D4D8]'
            : 'bg-[#292930] hover:bg-[#34343D] text-[#E07A5F] border-[#3F3F46]'
        }`}
      >
        <Plus className="w-5 h-5" />
      </button>

      {/* Main Material 3 Extended FAB for Scanner in Rose Gold / Copper */}
      <button
        type="button"
        onClick={() => {
          triggerHaptic();
          onOpenScanner();
        }}
        title="Quick Scan Slip (Step 5 Arrival / Lookup)"
        className="h-13 px-4 rounded-2xl bg-gradient-to-r from-[#E07A5F] to-[#C86349] hover:from-[#E8998D] hover:to-[#E07A5F] text-white font-bold text-xs shadow-xl shadow-[#E07A5F]/30 flex items-center gap-2 active:scale-95 transition"
      >
        <Camera className="w-5 h-5 stroke-[2.5]" />
        <span className="tracking-wide uppercase font-black text-[11px]">Scan Slip</span>
      </button>
    </div>
  );
};
