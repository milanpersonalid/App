import React, { useState } from 'react';
import {
  ShieldCheck,
  KeyRound,
  ArrowRight,
  Sun,
  Moon,
  Sparkles,
  Lock,
  User,
} from 'lucide-react';
import { useAuthAndTheme, DEFAULT_USER, DEMO_OPERATOR } from '../context/AuthAndThemeContext';
import { AppLogoIcon } from './AppLogoIcon';

export const LoginScreen: React.FC = () => {
  const { login, theme, toggleTheme } = useAuthAndTheme();
  const isBright = theme === 'bright';

  const [emailInput, setEmailInput] = useState('mkajudiya001@gmail.com');
  const [pinInput, setPinInput] = useState('1234');
  const [isLoading, setIsLoading] = useState(false);

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      login({
        ...DEFAULT_USER,
        email: emailInput || DEFAULT_USER.email,
        name: emailInput.includes('rajesh') ? 'Rajesh Soni' : 'Milan Ajudiya',
        initials: emailInput.includes('rajesh') ? 'RS' : 'MA',
      });
      setIsLoading(false);
    }, 300);
  };

  const handleQuickLoginAdmin = () => {
    setIsLoading(true);
    setTimeout(() => {
      login(DEFAULT_USER);
      setIsLoading(false);
    }, 200);
  };

  const handleQuickLoginOperator = () => {
    setIsLoading(true);
    setTimeout(() => {
      login(DEMO_OPERATOR);
      setIsLoading(false);
    }, 200);
  };

  return (
    <div
      className={`min-h-full w-full flex flex-col justify-between p-4 sm:p-6 transition-colors duration-200 ${
        isBright
          ? 'bg-[#F4F4F6] text-[#27272A] selection:bg-[#E07A5F] selection:text-white'
          : 'bg-[#1E1E24] text-[#F4F4F6] selection:bg-[#E07A5F] selection:text-white'
      }`}
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#7A9B76] animate-pulse" />
          <span className={`text-[11px] font-mono uppercase tracking-wider ${isBright ? 'text-[#71717A]' : 'text-[#A1A1AA]'}`}>
            Titanium &amp; Rose Gold Foundry
          </span>
        </div>

        {/* Theme Toggle on Login Screen (Dark & Light) */}
        <button
          type="button"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold shadow-xs transition active:scale-95 ${
            isBright
              ? 'bg-[#FFFFFF] border-[#D4D4D8] text-[#E07A5F] hover:bg-[#EBEBEF]'
              : 'bg-[#292930] border-[#3F3F46] text-[#E07A5F] hover:bg-[#34343D]'
          }`}
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-3.5 h-3.5 text-[#E07A5F]" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-[#E07A5F]" />
              <span>Dark Mode</span>
            </>
          )}
        </button>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-sm mx-auto my-auto py-6 space-y-6">
        {/* Brand Crest */}
        <div className="text-center space-y-2">
          <div className="inline-block relative">
            <AppLogoIcon size="xl" className="mx-auto shadow-2xl shadow-[#E07A5F]/20 ring-2 ring-[#E07A5F]/30" />
            <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-[#E07A5F] text-white">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>

          <h1 className="text-xl font-bold font-brand tracking-wide">
            Shreenathji Imitation
          </h1>
          <p className={`text-xs max-w-xs mx-auto ${isBright ? 'text-[#71717A]' : 'text-[#A1A1AA]'}`}>
            Refined Jewellery Foundry &bull; Production Tracking &amp; Inventory
          </p>
        </div>

        {/* Quick One-Tap Authentication Cards */}
        <div className="space-y-2.5">
          <span className={`text-[10px] font-bold uppercase tracking-wider block text-center ${isBright ? 'text-[#71717A]' : 'text-[#A1A1AA]'}`}>
            One-Tap Authentication
          </span>

          {/* Admin Quick Login */}
          <button
            type="button"
            onClick={handleQuickLoginAdmin}
            disabled={isLoading}
            className={`w-full p-3 rounded-2xl border transition-all flex items-center justify-between group active:scale-[0.98] shadow-md ${
              isBright
                ? 'bg-[#FFFFFF] hover:bg-[#EBEBEF] border-[#D4D4D8] hover:border-[#E07A5F]'
                : 'bg-[#292930] hover:bg-[#34343D] border-[#3F3F46] hover:border-[#E07A5F]'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E07A5F] to-[#C86349] text-white font-bold text-sm flex items-center justify-center shadow-md">
                MA
              </div>
              <div className="text-left min-w-0">
                <div className="font-bold text-xs group-hover:text-[#E07A5F] transition truncate">
                  Milan Ajudiya (Admin)
                </div>
                <div className={`text-[10px] truncate ${isBright ? 'text-[#71717A]' : 'text-[#A1A1AA]'}`}>
                  mkajudiya001@gmail.com
                </div>
              </div>
            </div>

            <div
              className={`p-1.5 rounded-lg group-hover:bg-[#E07A5F] group-hover:text-white transition ${
                isBright ? 'bg-[#F4F4F6] text-[#71717A]' : 'bg-[#1E1E24] text-[#A1A1AA]'
              }`}
            >
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          {/* Supervisor Quick Login */}
          <button
            type="button"
            onClick={handleQuickLoginOperator}
            disabled={isLoading}
            className={`w-full p-3 rounded-2xl border transition-all flex items-center justify-between group active:scale-[0.98] ${
              isBright
                ? 'bg-[#FFFFFF]/70 hover:bg-[#FFFFFF] border-[#D4D4D8] hover:border-[#E07A5F]'
                : 'bg-[#292930]/60 hover:bg-[#292930] border-[#3F3F46] hover:border-[#E07A5F]'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-10 h-10 rounded-xl font-bold text-sm flex items-center justify-center border ${
                  isBright
                    ? 'bg-[#F4F4F6] text-[#27272A] border-[#D4D4D8]'
                    : 'bg-[#1E1E24] text-[#F4F4F6] border-[#3F3F46]'
                }`}
              >
                RS
              </div>
              <div className="text-left min-w-0">
                <div className="font-bold text-xs group-hover:text-[#E07A5F] transition truncate">
                  Rajesh Soni (Floor Supervisor)
                </div>
                <div className={`text-[10px] truncate ${isBright ? 'text-[#71717A]' : 'text-[#A1A1AA]'}`}>
                  rajesh.soni@shreenathji.com
                </div>
              </div>
            </div>

            <div
              className={`p-1.5 rounded-lg group-hover:bg-[#E07A5F] group-hover:text-white transition ${
                isBright ? 'bg-[#F4F4F6] text-[#71717A]' : 'bg-[#1E1E24] text-[#A1A1AA]'
              }`}
            >
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className={`border-t w-full ${isBright ? 'border-[#D4D4D8]' : 'border-[#3F3F46]'}`} />
          <span
            className={`px-2 text-[10px] uppercase tracking-widest font-mono ${
              isBright ? 'bg-[#F4F4F6] text-[#71717A]' : 'bg-[#1E1E24] text-[#A1A1AA]'
            }`}
          >
            Or Manual PIN
          </span>
        </div>

        {/* Manual Login Form */}
        <form onSubmit={handleCustomLogin} className="space-y-3">
          <div>
            <label className={`text-[10px] font-semibold uppercase tracking-wider block mb-1 ${isBright ? 'text-[#71717A]' : 'text-[#A1A1AA]'}`}>
              Email / User ID
            </label>
            <div className="relative">
              <User className={`w-4 h-4 absolute left-3 top-2.5 ${isBright ? 'text-[#71717A]' : 'text-[#A1A1AA]'}`} />
              <input
                type="text"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Enter user email..."
                className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs focus:border-[#E07A5F] outline-none ${
                  isBright
                    ? 'bg-[#FFFFFF] border-[#D4D4D8] text-[#27272A]'
                    : 'bg-[#292930] border-[#3F3F46] text-[#F4F4F6]'
                }`}
                required
              />
            </div>
          </div>

          <div>
            <label className={`text-[10px] font-semibold uppercase tracking-wider block mb-1 ${isBright ? 'text-[#71717A]' : 'text-[#A1A1AA]'}`}>
              Security PIN
            </label>
            <div className="relative">
              <Lock className={`w-4 h-4 absolute left-3 top-2.5 ${isBright ? 'text-[#71717A]' : 'text-[#A1A1AA]'}`} />
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Enter 4-digit PIN..."
                maxLength={8}
                className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs focus:border-[#E07A5F] outline-none ${
                  isBright
                    ? 'bg-[#FFFFFF] border-[#D4D4D8] text-[#27272A]'
                    : 'bg-[#292930] border-[#3F3F46] text-[#F4F4F6]'
                }`}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#E07A5F] to-[#C86349] hover:from-[#E8998D] hover:to-[#E07A5F] text-white font-bold text-xs shadow-lg shadow-[#E07A5F]/25 active:scale-95 transition flex items-center justify-center gap-2"
          >
            <KeyRound className="w-4 h-4" />
            <span>{isLoading ? 'Signing In...' : 'Sign In to Foundry'}</span>
          </button>
        </form>
      </div>

      {/* Footer */}
      <div className={`text-center text-[10px] space-y-1 ${isBright ? 'text-[#71717A]' : 'text-[#A1A1AA]'}`}>
        <div className="flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-[#E07A5F]" />
          <span>Encrypted Foundry Terminal Authentication</span>
        </div>
        <p>Shreenathji Imitation Jewellery Foundry &bull; Rajkot, Gujarat</p>
      </div>
    </div>
  );
};
