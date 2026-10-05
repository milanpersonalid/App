import React from 'react';
import {
  LayoutDashboard,
  Layers,
  Sparkles,
  Archive,
  ReceiptText,
} from 'lucide-react';
import { ActiveTab } from '../Navigation';
import { useApp } from '../../context/AppContext';
import { useAuthAndTheme } from '../../context/AuthAndThemeContext';

interface AndroidBottomNavProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenScanner: () => void;
}

export const AndroidBottomNav: React.FC<AndroidBottomNavProps> = ({
  activeTab,
  onSelectTab,
}) => {
  const { theme } = useAuthAndTheme();
  const isBright = theme === 'bright';

  const triggerHaptic = () => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(8);
      }
    } catch {
      // safe fallback
    }
  };

  const navItems: { id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'designs', label: 'Designs', icon: Sparkles },
    { id: 'lots', label: 'Lots', icon: Layers },
    { id: 'ledger', label: 'Ledger', icon: ReceiptText },
    { id: 'ready_stock', label: 'Stock', icon: Archive },
  ];

  return (
    <nav
      className={`h-16 flex-shrink-0 w-full max-w-full overflow-x-hidden px-2 flex items-center justify-around select-none z-40 relative border-t transition-colors duration-200 ${
        isBright
          ? 'bg-[#FFFFFF] border-[#D4D4D8]'
          : 'bg-[#292930] border-[#3F3F46]'
      }`}
    >
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        const IconComponent = item.icon;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              triggerHaptic();
              onSelectTab(item.id);
            }}
            className="flex-1 flex flex-col items-center justify-center py-1 relative group focus:outline-none"
          >
            {/* MD3 Active Indicator Pill */}
            <div
              className={`relative px-4 py-1 rounded-full transition-all duration-200 flex items-center justify-center ${
                isActive
                  ? 'bg-[#E07A5F]/20 text-[#E07A5F]'
                  : isBright
                  ? 'text-[#71717A] group-hover:text-[#27272A] group-active:scale-95'
                  : 'text-[#A1A1AA] group-hover:text-[#F4F4F6] group-active:scale-95'
              }`}
            >
              <IconComponent
                className={`w-5 h-5 transition-transform duration-200 ${
                  isActive
                    ? 'scale-105 text-[#E07A5F]'
                    : isBright
                    ? 'text-[#71717A]'
                    : 'text-[#A1A1AA]'
                }`}
              />

            </div>

            {/* Label */}
            <span
              className={`text-[10px] mt-0.5 tracking-tight font-medium transition-colors ${
                isActive
                  ? 'text-[#E07A5F] font-semibold'
                  : isBright
                  ? 'text-[#71717A]'
                  : 'text-[#A1A1AA]'
              }`}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
