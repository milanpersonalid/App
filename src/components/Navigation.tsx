import React from 'react';
import { BrandLogo } from './BrandLogo';
import {
  LayoutDashboard,
  Layers,
  Sparkles,
  Archive,
  Camera,
  PlusCircle,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export type ActiveTab = 'dashboard' | 'designs' | 'lots' | 'ready_stock';

interface NavigationProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenScanner: () => void;
  onOpenCreateDesign: () => void;
  onOpenCreateLot: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  onOpenScanner,
  onOpenCreateDesign,
  onOpenCreateLot,
}) => {
  const { lots, getReadyStockSummary, resetToDefaultData } = useApp();

  const awaitingEntryCount = lots.filter((l) => l.status === 'arrived_awaiting_entry').length;
  const stageCompleteCount = lots.filter((l) => l.status === 'stage_complete').length;
  const lowStockCount = getReadyStockSummary().filter((s) => s.isLowStock).length;

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'designs', label: 'Designs (Orders)', icon: <Sparkles className="w-4 h-4" /> },
    {
      id: 'lots',
      label: 'Production Lots',
      icon: <Layers className="w-4 h-4" />,
      badge: awaitingEntryCount + stageCompleteCount || undefined,
    },
    {
      id: 'ready_stock',
      label: 'Ready Stock',
      icon: <Archive className="w-4 h-4" />,
      badge: lowStockCount || undefined,
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800 no-print">
      {/* Top App Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Brand Logo & Title */}
        <div
          onClick={() => onSelectTab('dashboard')}
          className="cursor-pointer transition hover:opacity-90 flex items-center"
        >
          <BrandLogo size="md" />
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Scanner Button (All 3 modes) */}
          <button
            onClick={onOpenScanner}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition"
          >
            <Camera className="w-4 h-4" />
            <span className="hidden sm:inline">Scanner (3 Modes)</span>
            <span className="sm:hidden">Scan</span>
          </button>

          {/* Quick Create Lot */}
          <button
            onClick={onOpenCreateLot}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold border border-neutral-700 transition active:scale-95"
          >
            <PlusCircle className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline">Create Lot</span>
          </button>

          {/* Create Order (Design) */}
          <button
            onClick={onOpenCreateDesign}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold border border-neutral-700 transition active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline">Create Order</span>
          </button>

          {/* Reset Demo Data Helper */}
          <button
            onClick={() => {
              if (window.confirm('Reset app data to default production lot demo?')) {
                resetToDefaultData();
              }
            }}
            title="Reset to initial factory sample lot data"
            className="p-2 rounded-xl text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/80 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex overflow-x-auto no-scrollbar border-t border-neutral-800/60">
        <div className="flex gap-1 py-1.5 min-w-max">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all relative ${
                  isActive
                    ? 'bg-amber-400/10 text-amber-300 border border-amber-500/30'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                      item.id === 'lots'
                        ? 'bg-red-500 text-white'
                        : 'bg-amber-500 text-neutral-950'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
