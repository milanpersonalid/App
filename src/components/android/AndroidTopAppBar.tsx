import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Bell,
  Camera,
  Download,
  Info,
  RotateCcw,
  Sparkles,
  PlusCircle,
  Settings,
  LogOut,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuthAndTheme } from '../../context/AuthAndThemeContext';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { AppLogoIcon } from '../AppLogoIcon';

interface AndroidTopAppBarProps {
  onOpenScanner: () => void;
  onOpenCreateDesign: () => void;
  onOpenCreateLot: () => void;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
}

export const AndroidTopAppBar: React.FC<AndroidTopAppBarProps> = ({
  onOpenScanner,
  onOpenCreateDesign,
  onOpenCreateLot,
  onOpenProfile,
  onOpenSettings,
}) => {
  const { lots, resetToDefaultData } = useApp();
  const { currentUser, logout, theme } = useAuthAndTheme();
  const isBright = theme === 'bright';
  const { isInstallable, isInstalled, install } = usePWAInstall();

  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const awaitingCount = lots.filter((l) => l.status === 'arrived_awaiting_entry').length;
  const stageDoneCount = lots.filter((l) => l.status === 'stage_complete').length;
  const totalPending = awaitingCount + stageDoneCount;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    if (menuOpen || notifOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen, notifOpen]);

  const handleInstall = async () => {
    setMenuOpen(false);
    await install();
  };

  return (
    <>
      <header
        className={`h-14 flex-shrink-0 w-full px-3 sm:px-4 flex items-center justify-between select-none z-40 relative border-b transition-colors duration-200 ${
          isBright
            ? 'bg-[#FAF7F2] border-[#EBE7DF] text-[#1C1917]'
            : 'bg-[#1E1C1A] border-[#2E2A26] text-[#F7F4EE]'
        }`}
      >
        {/* Left: Hamburger Menu Icon */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            title="Open Menu"
            className={`p-2 -ml-1 rounded-xl active:scale-95 transition ${
              isBright
                ? 'text-[#292524] hover:bg-stone-200/60'
                : 'text-[#E7E5E4] hover:bg-stone-800/60'
            }`}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Left Drawer / Menu Dropdown */}
          {menuOpen && (
            <div
              className={`absolute left-0 top-12 w-64 max-w-[calc(100vw-2rem)] rounded-2xl border shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs overflow-hidden ${
                isBright
                  ? 'bg-white border-[#E7E5E4] text-[#1C1917]'
                  : 'bg-[#292623] border-[#44403C] text-[#F5F5F4]'
              }`}
            >
              {/* Profile header */}
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onOpenProfile();
                }}
                className={`w-full px-4 py-2.5 text-left flex items-center gap-3 transition ${
                  isBright ? 'hover:bg-stone-100' : 'hover:bg-stone-800'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-[#A3835B] text-white font-semibold text-xs flex items-center justify-center shadow-sm">
                  {currentUser?.initials || 'MS'}
                </div>
                <div className="truncate min-w-0">
                  <span className="block truncate font-bold text-sm leading-tight">
                    {currentUser?.name || 'Milan Ajudiya'}
                  </span>
                </div>
              </button>

              <div className={`my-1.5 border-t ${isBright ? 'border-[#E7E5E4]' : 'border-[#44403C]'}`} />

              {/* Quick Actions */}
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onOpenScanner();
                }}
                className={`w-full px-4 py-2.5 text-left flex items-center gap-2.5 font-medium transition ${
                  isBright ? 'hover:bg-stone-100 text-[#1C1917]' : 'hover:bg-stone-800 text-[#F5F5F4]'
                }`}
              >
                <Camera className="w-4 h-4 text-[#C5A059]" />
                <span>Scan Slip / QR Arrival</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onOpenCreateLot();
                }}
                className={`w-full px-4 py-2.5 text-left flex items-center gap-2.5 font-medium transition ${
                  isBright ? 'hover:bg-stone-100 text-[#1C1917]' : 'hover:bg-stone-800 text-[#F5F5F4]'
                }`}
              >
                <PlusCircle className="w-4 h-4 text-[#C5A059]" />
                <span>Create Lot</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onOpenCreateDesign();
                }}
                className={`w-full px-4 py-2.5 text-left flex items-center gap-2.5 font-medium transition ${
                  isBright ? 'hover:bg-stone-100 text-[#1C1917]' : 'hover:bg-stone-800 text-[#F5F5F4]'
                }`}
              >
                <Sparkles className="w-4 h-4 text-[#C5A059]" />
                <span>Create Design</span>
              </button>

              <div className={`my-1.5 border-t ${isBright ? 'border-[#E7E5E4]' : 'border-[#44403C]'}`} />

              {/* Settings shortcut */}
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onOpenSettings();
                }}
                className={`w-full px-4 py-2 text-left flex items-center gap-2.5 transition ${
                  isBright ? 'hover:bg-stone-100 text-[#44403C]' : 'hover:bg-stone-800 text-[#D6D3D1]'
                }`}
              >
                <Settings className="w-4 h-4 text-[#C5A059]" />
                <span>Settings &amp; Theme</span>
              </button>

              {/* Install App */}
              {isInstallable && !isInstalled && (
                <button
                  type="button"
                  onClick={handleInstall}
                  className={`w-full px-4 py-2.5 text-left flex items-center gap-2.5 text-[#C5A059] transition font-semibold ${
                    isBright ? 'hover:bg-stone-100' : 'hover:bg-stone-800'
                  }`}
                >
                  <Download className="w-4 h-4 text-[#C5A059]" />
                  <span>Install App (.apk / PWA)</span>
                </button>
              )}

              {/* Reset Data */}
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  if (window.confirm('Reset all factory lots and designs to fresh state?')) {
                    resetToDefaultData();
                  }
                }}
                className={`w-full px-4 py-2 text-left flex items-center gap-2.5 transition ${
                  isBright ? 'hover:bg-stone-100 text-[#78716C]' : 'hover:bg-stone-800 text-[#A8A29E]'
                }`}
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Factory Data</span>
              </button>

              {/* App Info */}
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setShowAboutModal(true);
                }}
                className={`w-full px-4 py-2 text-left flex items-center gap-2.5 transition ${
                  isBright ? 'hover:bg-stone-100 text-[#78716C]' : 'hover:bg-stone-800 text-[#A8A29E]'
                }`}
              >
                <Info className="w-4 h-4" />
                <span>About Workshop App</span>
              </button>

              <div className={`my-1.5 border-t ${isBright ? 'border-[#E7E5E4]' : 'border-[#44403C]'}`} />

              {/* Log Out */}
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
                className="w-full px-4 py-2 text-left flex items-center gap-2.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition font-semibold"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>

        {/* Center: Uploaded Shreenathji Logo & Title */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <img
            src="/shreenathji-logo.png"
            alt="Shreenathji Logo"
            className="w-8 h-8 rounded-full object-contain bg-white shadow-sm border border-stone-200/80 dark:border-stone-700/80 p-0.5 flex-shrink-0"
          />
          <div className="flex flex-col text-left min-w-0">
            <span
              className={`text-xs sm:text-sm font-bold tracking-[0.14em] font-brand uppercase leading-tight truncate ${
                isBright ? 'text-[#1C1917]' : 'text-[#F5F5F4]'
              }`}
            >
              Shreenathji
            </span>
            <span
              className={`text-[8px] sm:text-[9px] font-semibold tracking-[0.22em] uppercase mt-0.5 leading-none ${
                isBright ? 'text-[#8C5338]' : 'text-[#C5A059]'
              }`}
            >
              Imitation
            </span>
          </div>
        </div>

        {/* Right: Camera Scanner, Bell Notification & Profile Avatar */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Quick Scanner Camera */}
          <button
            type="button"
            onClick={onOpenScanner}
            title="Scan Slip / QR Barcode"
            className={`p-2 rounded-full active:scale-95 transition ${
              isBright
                ? 'text-[#57534E] hover:bg-stone-200/60'
                : 'text-[#D6D3D1] hover:bg-stone-800/60'
            }`}
          >
            <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setNotifOpen(!notifOpen)}
              title="Notifications"
              className={`relative p-2 rounded-full active:scale-95 transition ${
                isBright
                  ? 'text-[#57534E] hover:bg-stone-200/60'
                  : 'text-[#D6D3D1] hover:bg-stone-800/60'
              }`}
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              {totalPending > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#FAF7F2] dark:ring-[#1E1C1A]" />
              )}
            </button>

            {/* Notification Dropdown */}
            {notifOpen && (
              <div
                className={`absolute right-0 top-11 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border shadow-2xl p-3.5 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs overflow-hidden ${
                  isBright
                    ? 'bg-white border-[#E7E5E4] text-[#1C1917]'
                    : 'bg-[#292623] border-[#44403C] text-[#F5F5F4]'
                }`}
              >
                <div
                  className={`flex items-center justify-between pb-2 border-b ${
                    isBright ? 'border-slate-200 text-slate-900' : 'border-stone-700 text-stone-100'
                  }`}
                >
                  <span className="font-bold font-serif text-sm">Workshop Alerts</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isBright
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-[#C5A059]/20 text-[#C5A059]'
                    }`}
                  >
                    {totalPending} Action{totalPending === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="py-2 space-y-2">
                  {awaitingCount > 0 && (
                    <div
                      className={`p-2.5 rounded-xl border flex items-start gap-2.5 transition-colors ${
                        isBright
                          ? 'bg-rose-50 border-rose-200 shadow-xs'
                          : 'bg-rose-950/40 border-rose-900'
                      }`}
                    >
                      <AlertCircle
                        className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                          isBright ? 'text-rose-600' : 'text-rose-400'
                        }`}
                      />
                      <div>
                        <div
                          className={`font-bold ${
                            isBright ? 'text-rose-900' : 'text-rose-300'
                          }`}
                        >
                          {awaitingCount} Awaiting Data Entry
                        </div>
                        <div
                          className={`text-[11px] mt-0.5 leading-snug ${
                            isBright ? 'text-slate-700 font-medium' : 'text-stone-400'
                          }`}
                        >
                          Slip scanned upon arrival; awaiting manual return weight entry.
                        </div>
                      </div>
                    </div>
                  )}

                  {stageDoneCount > 0 && (
                    <div
                      className={`p-2.5 rounded-xl border flex items-start gap-2.5 transition-colors ${
                        isBright
                          ? 'bg-emerald-50 border-emerald-200 shadow-xs'
                          : 'bg-emerald-950/40 border-emerald-900'
                      }`}
                    >
                      <CheckCircle2
                        className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                          isBright ? 'text-emerald-700' : 'text-emerald-400'
                        }`}
                      />
                      <div>
                        <div
                          className={`font-bold ${
                            isBright ? 'text-emerald-900' : 'text-emerald-300'
                          }`}
                        >
                          {stageDoneCount} Stage Completed
                        </div>
                        <div
                          className={`text-[11px] mt-0.5 leading-snug ${
                            isBright ? 'text-slate-700 font-medium' : 'text-stone-400'
                          }`}
                        >
                          Return verified; ready to send to next stage.
                        </div>
                      </div>
                    </div>
                  )}

                  {totalPending === 0 && (
                    <div
                      className={`py-4 text-center text-xs ${
                        isBright ? 'text-slate-600 font-medium' : 'text-stone-400'
                      }`}
                    >
                      All lots are smoothly in progress. No urgent actions pending.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar with Initials */}
          <button
            type="button"
            onClick={onOpenProfile}
            title={`Profile: ${currentUser?.name || 'Milan Ajudiya'}`}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#A3835B] hover:bg-[#8F724E] text-white font-semibold text-xs flex items-center justify-center shadow-sm active:scale-95 transition"
          >
            {currentUser?.initials || 'MS'}
          </button>
        </div>
      </header>

      {/* Android About / System Dialog */}
      {showAboutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in overflow-y-auto overflow-x-hidden w-full max-w-full">
          <div
            className={`w-full max-w-sm rounded-3xl border p-6 shadow-2xl space-y-4 max-w-full ${
              isBright
                ? 'bg-[#FFFFFF] border-[#D4D4D8] text-[#27272A]'
                : 'bg-[#292930] border-[#3F3F46] text-[#F4F4F6]'
            }`}
          >
            <div className="flex items-center gap-3">
              <AppLogoIcon size="lg" className="shadow-lg shadow-[#E07A5F]/20" />
              <div>
                <h3
                  className={`text-base font-bold font-brand transition-colors ${
                    isBright ? 'text-[#18181B]' : 'text-[#F4F4F6]'
                  }`}
                >
                  Shreenathji Imitation
                </h3>
                <p className="text-xs text-[#E07A5F] font-mono">
                  Refined Jewellery Foundry
                </p>
              </div>
            </div>

            <div
              className={`p-3.5 rounded-2xl border space-y-2 text-xs font-mono ${
                isBright
                  ? 'bg-[#F4F4F6] border-[#D4D4D8] text-[#27272A]'
                  : 'bg-[#1E1E24] border-[#3F3F46] text-[#E4E4E7]'
              }`}
            >
              <div className="flex justify-between">
                <span className={isBright ? 'text-[#71717A]' : 'text-[#A1A1AA]'}>Package:</span>
                <span>com.shreenathji.tracker</span>
              </div>
              <div className="flex justify-between">
                <span className={isBright ? 'text-[#71717A]' : 'text-[#A1A1AA]'}>Theme:</span>
                <span className="text-[#E07A5F] font-semibold">Titanium &amp; Rose Gold</span>
              </div>
              <div className="flex justify-between">
                <span className={isBright ? 'text-[#71717A]' : 'text-[#A1A1AA]'}>Android Target:</span>
                <span>Android 14 (API 34)</span>
              </div>
              <div className="flex justify-between">
                <span className={isBright ? 'text-[#71717A]' : 'text-[#A1A1AA]'}>App Version:</span>
                <span>2.4.0 (Build 2026.09)</span>
              </div>
            </div>

            <p className={`text-xs leading-relaxed ${isBright ? 'text-[#71717A]' : 'text-[#A1A1AA]'}`}>
              Designed specifically for contemporary jewellery manufacturing. Features dynamic QR slips, weight discrepancy audit calculations, karigar stage handoffs, and instant offline storage.
            </p>

            <button
              type="button"
              onClick={() => setShowAboutModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#E07A5F] hover:bg-[#E8998D] text-white font-bold text-xs shadow-md transition active:scale-95"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </>
  );
};
