import React from 'react';
import { Plus } from 'lucide-react';
import { useAuthAndTheme } from '../../context/AuthAndThemeContext';

interface AndroidQuickFabProps {
  onOpenScanner?: () => void;
  onOpenCreateLot: () => void;
}

export const AndroidQuickFab: React.FC<AndroidQuickFabProps> = ({
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
        className={`w-11 h-11 rounded-2xl border shadow-lg flex items-center justify-center active:scale-95 transition ${
          isBright
            ? 'bg-[#FFFFFF] hover:bg-[#EBEBEF] text-[#E07A5F] border-[#D4D4D8]'
            : 'bg-[#292930] hover:bg-[#34343D] text-[#E07A5F] border-[#3F3F46]'
        }`}
      >
        <Plus className="w-5 h-5" />
      </button>
    </div>
  );
};

