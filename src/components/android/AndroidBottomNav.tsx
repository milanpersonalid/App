import React from 'react';
import {
  House,
  Boxes,
  BookOpenText,
  Warehouse,
  type LucideIcon,
} from 'lucide-react';
import { JewelleryIcon } from '../icons/JewelleryIcon';
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

  const navItems: { id: ActiveTab; label: string; icon: LucideIcon }[] = [
    { id: 'dashboard', label: 'Home', icon: House },
    { id: 'designs', label: 'Designs', icon: JewelleryIcon },
    { id: 'lots', label: 'Lots', icon: Boxes },
    { id: 'ledger', label: 'Ledger', icon: BookOpenText },
    { id: 'ready_stock', label: 'Stock', icon: Warehouse },
  ];

  return (
    <nav
      aria-label="Main navigation"
      className={`h-[72px] flex-shrink-0 w-full max-w-full overflow-x-hidden px-2 flex items-center justify-around select-none z-40 relative border-t transition-colors duration-200 ${
        isBright
          ? 'bg-white border-[#EADFD8] shadow-[0_-6px_24px_rgba(61,43,33,0.07)]'
          : 'bg-[#292930] border-[#48444A] shadow-[0_-6px_24px_rgba(0,0,0,0.18)]'
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
            aria-current={isActive ? 'page' : undefined}
            aria-label={item.label}
            className="min-w-0 flex-1 h-full flex flex-col items-center justify-center gap-0.5 relative group focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#E07A5F]"
          >
            <div
              className={`relative w-12 h-9 rounded-2xl transition-colors duration-200 flex items-center justify-center ${
                isActive
                  ? isBright ? 'bg-[#FBE8E1] text-[#B65E47]' : 'bg-[#E07A5F]/20 text-[#F29A80]'
                  : isBright
                  ? 'text-[#77717A] group-hover:bg-[#F6F0EC] group-hover:text-[#3F3F46]'
                  : 'text-[#B5B0B8] group-hover:bg-white/5 group-hover:text-white'
              }`}
            >
              <IconComponent
                className="w-[22px] h-[22px]"
                strokeWidth={isActive ? 2.3 : 1.9}
              />
            </div>

            <span
              className={`text-[11px] leading-4 tracking-tight transition-colors ${
                isActive
                  ? isBright ? 'text-[#A94E39] font-bold' : 'text-[#F29A80] font-bold'
                  : isBright
                  ? 'text-[#77717A] font-medium'
                  : 'text-[#B5B0B8] font-medium'
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
