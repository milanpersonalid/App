import React from 'react';
import {
  X,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Smartphone,
  CheckCircle2,
  LogOut,
  User,
  ArrowLeft,
  Sparkles,
  Sliders,
} from 'lucide-react';
import { useAuthAndTheme } from '../context/AuthAndThemeContext';
import { AppLogoIcon } from './AppLogoIcon';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToProfile?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onBackToProfile,
}) => {
  const {
    theme,
    setTheme,
    soundEnabled,
    setSoundEnabled,
    hapticEnabled,
    setHapticEnabled,
    currentUser,
    logout,
  } = useAuthAndTheme();

  if (!isOpen) return null;

  const isBright = theme === 'bright';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div
        className={`relative w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden my-4 transition-colors duration-200 ${
          isBright
            ? 'bg-[#FFFFFF] border-[#D4D4D8] text-[#27272A]'
            : 'bg-[#292930] border-[#3F3F46] text-[#F4F4F6]'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-5 py-4 border-b transition-colors duration-200 ${
            isBright
              ? 'bg-[#F4F4F6] border-[#D4D4D8]'
              : 'bg-[#1E1E24] border-[#3F3F46]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {onBackToProfile && (
              <button
                type="button"
                onClick={onBackToProfile}
                title="Back to Profile"
                className={`p-1.5 rounded-xl transition ${
                  isBright
                    ? 'text-[#71717A] hover:text-[#27272A] hover:bg-[#EBEBEF]'
                    : 'text-[#A1A1AA] hover:text-[#F4F4F6] hover:bg-[#34343D]'
                }`}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h2 className="text-base font-bold font-brand flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#E07A5F]" />
                <span>App Settings</span>
              </h2>
              <p className={`text-[11px] ${isBright ? 'text-[#71717A]' : 'text-[#A1A1AA]'}`}>
                Titanium &amp; Rose Gold &bull; Jewellery Foundry
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-full transition ${
              isBright
                ? 'text-[#71717A] hover:text-[#27272A] hover:bg-[#EBEBEF]'
                : 'text-[#A1A1AA] hover:text-[#F4F4F6] hover:bg-[#34343D]'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
          {/* 1. THEME MODE SELECTION (TITANIUM & ROSE GOLD PALETTE) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                isBright ? 'text-[#3F3F46]' : 'text-[#E4E4E7]'
              }`}>
                <Sparkles className="w-3.5 h-3.5 text-[#E07A5F]" />
                Foundry Theme (Dark &amp; Light)
              </span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#E07A5F]/20 text-[#E07A5F] font-mono font-bold">
                {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Dark Mode Card */}
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`relative p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 ${
                  theme === 'dark'
                    ? 'bg-[#1E1E24] border-[#E07A5F] ring-2 ring-[#E07A5F]/30 shadow-lg'
                    : 'bg-[#292930] border-[#3F3F46] opacity-70 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="p-2 rounded-xl bg-[#34343D] text-[#E07A5F]">
                    <Moon className="w-4 h-4" />
                  </div>
                  {theme === 'dark' && (
                    <CheckCircle2 className="w-4 h-4 text-[#E07A5F]" />
                  )}
                </div>

                <div>
                  <div className="font-bold text-[#F4F4F6] text-sm">Dark Mode</div>
                  <div className="text-[10px] text-[#A1A1AA] mt-0.5 leading-tight">
                    Titanium #1E1E24 with warm Rose Gold #E07A5F accents.
                  </div>
                </div>

                {/* Micro preview illustration */}
                <div className="h-6 w-full rounded-lg bg-[#1E1E24] border border-[#3F3F46] flex items-center px-2 gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#E07A5F]" />
                  <div className="h-1.5 w-10 rounded bg-[#34343D]" />
                  <div className="h-1.5 w-6 rounded bg-[#E8998D] ml-auto opacity-70" />
                </div>
              </button>

              {/* Light Mode Card */}
              <button
                type="button"
                onClick={() => setTheme('bright')}
                className={`relative p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 ${
                  theme === 'bright'
                    ? 'bg-[#FFFFFF] border-[#E07A5F] ring-2 ring-[#E07A5F]/30 shadow-lg'
                    : 'bg-[#F4F4F6] border-[#D4D4D8] opacity-70 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="p-2 rounded-xl bg-[#E07A5F]/15 text-[#E07A5F]">
                    <Sun className="w-4 h-4" />
                  </div>
                  {theme === 'bright' && (
                    <CheckCircle2 className="w-4 h-4 text-[#E07A5F]" />
                  )}
                </div>

                <div>
                  <div className={`font-bold text-sm ${isBright ? 'text-[#27272A]' : 'text-[#F4F4F6]'}`}>
                    Light Mode
                  </div>
                  <div className={`text-[10px] mt-0.5 leading-tight ${isBright ? 'text-[#71717A]' : 'text-[#A1A1AA]'}`}>
                    Polished mist #F4F4F6 with #FFFFFF card surfaces.
                  </div>
                </div>

                {/* Micro preview illustration */}
                <div className="h-6 w-full rounded-lg bg-[#F4F4F6] border border-[#D4D4D8] flex items-center px-2 gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#E07A5F]" />
                  <div className="h-1.5 w-10 rounded bg-[#D4D4D8]" />
                  <div className="h-1.5 w-6 rounded bg-[#E8998D] ml-auto" />
                </div>
              </button>
            </div>
          </div>

          {/* 2. AUDIO & HAPTIC FEEDBACK */}
          <div
            className={`p-3.5 rounded-2xl border space-y-3 transition-colors ${
              isBright
                ? 'bg-[#F4F4F6] border-[#D4D4D8]'
                : 'bg-[#1E1E24] border-[#3F3F46]'
            }`}
          >
            <span
              className={`text-[11px] font-bold uppercase tracking-wider block ${
                isBright ? 'text-[#3F3F46]' : 'text-[#E4E4E7]'
              }`}
            >
              Interactions &amp; Alerts
            </span>

            {/* Sound Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-xl ${
                    isBright ? 'bg-[#FFFFFF] text-[#E07A5F]' : 'bg-[#292930] text-[#E07A5F]'
                  }`}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-[#71717A]" />}
                </div>
                <div>
                  <div className={`font-semibold ${isBright ? 'text-[#27272A]' : 'text-[#F4F4F6]'}`}>
                    Audio Feedback
                  </div>
                  <div className={`text-[10px] ${isBright ? 'text-[#71717A]' : 'text-[#A1A1AA]'}`}>
                    Play confirmation tones when scanning barcodes
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  soundEnabled ? 'bg-[#E07A5F]' : isBright ? 'bg-[#D4D4D8]' : 'bg-[#3F3F46]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    soundEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Haptic / Vibration Toggle */}
            <div
              className={`flex items-center justify-between border-t pt-2.5 ${
                isBright ? 'border-[#D4D4D8]' : 'border-[#3F3F46]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-xl ${
                    isBright ? 'bg-[#FFFFFF] text-[#E07A5F]' : 'bg-[#292930] text-[#E07A5F]'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <div className={`font-semibold ${isBright ? 'text-[#27272A]' : 'text-[#F4F4F6]'}`}>
                    Haptic Vibration
                  </div>
                  <div className={`text-[10px] ${isBright ? 'text-[#71717A]' : 'text-[#A1A1AA]'}`}>
                    Vibrate on successful lot arrival confirmation
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHapticEnabled(!hapticEnabled)}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  hapticEnabled ? 'bg-[#E07A5F]' : isBright ? 'bg-[#D4D4D8]' : 'bg-[#3F3F46]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    hapticEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* 3. FOUNDRY SPECIFICATION PALETTE INFO */}
          <div
            className={`p-3.5 rounded-2xl border space-y-2.5 ${
              isBright
                ? 'bg-[#F4F4F6] border-[#D4D4D8]'
                : 'bg-[#1E1E24] border-[#3F3F46]'
            }`}
          >
            <div className="flex items-center gap-3">
              <AppLogoIcon size="md" />
              <div>
                <div className="font-bold font-brand">
                  Shreenathji Imitation
                </div>
                <div className={`text-[10px] ${isBright ? 'text-[#71717A]' : 'text-[#A1A1AA]'}`}>
                  Titanium &amp; Rose Gold — Refined Jewellery Foundry
                </div>
              </div>
            </div>

            <div className={`grid grid-cols-2 gap-2 pt-2 border-t text-[11px] ${isBright ? 'border-[#D4D4D8]' : 'border-[#3F3F46]'}`}>
              <div className={`p-2 rounded-xl border ${isBright ? 'bg-[#FFFFFF] border-[#D4D4D8]' : 'bg-[#292930] border-[#3F3F46]'}`}>
                <span className={`block text-[10px] ${isBright ? 'text-[#71717A]' : 'text-[#A1A1AA]'}`}>Foundry Primary</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-3 h-3 rounded-full bg-[#E07A5F]" />
                  <span className="font-semibold text-[#E07A5F]">Rose Gold #E07A5F</span>
                </div>
              </div>
              <div className={`p-2 rounded-xl border ${isBright ? 'bg-[#FFFFFF] border-[#D4D4D8]' : 'bg-[#292930] border-[#3F3F46]'}`}>
                <span className={`block text-[10px] ${isBright ? 'text-[#71717A]' : 'text-[#A1A1AA]'}`}>Foundry Secondary</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-3 h-3 rounded-full bg-[#E8998D]" />
                  <span className="font-semibold text-[#E8998D]">Copper #E8998D</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. ACCOUNT & LOGOUT ACTIONS */}
          <div className={`pt-2 border-t flex flex-col gap-2 ${isBright ? 'border-[#D4D4D8]' : 'border-[#3F3F46]'}`}>
            {onBackToProfile && (
              <button
                type="button"
                onClick={onBackToProfile}
                className={`w-full py-2.5 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition active:scale-[0.99] ${
                  isBright
                    ? 'bg-[#FFFFFF] hover:bg-[#EBEBEF] text-[#27272A] border-[#D4D4D8]'
                    : 'bg-[#292930] hover:bg-[#34343D] text-[#F4F4F6] border-[#3F3F46]'
                }`}
              >
                <User className="w-4 h-4 text-[#E07A5F]" />
                <span>Return to Profile Details</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onClose();
                logout();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-[#A8556B]/15 hover:bg-[#A8556B]/25 text-[#A8556B] border border-[#A8556B]/40 text-xs font-bold flex items-center justify-center gap-2 transition active:scale-[0.99]"
            >
              <LogOut className="w-4 h-4 text-[#A8556B]" />
              <span>Log Out of Foundry Terminal</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
