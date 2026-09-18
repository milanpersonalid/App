import React, { useState } from 'react';
import {
  KeyRound,
  Sun,
  Moon,
  Lock,
  User,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuthAndTheme, DEFAULT_USER } from '../context/AuthAndThemeContext';
import { AppLogoIcon } from './AppLogoIcon';

export const LoginScreen: React.FC = () => {
  const { login, theme, toggleTheme } = useAuthAndTheme();
  const isBright = theme === 'bright';

  const [emailInput, setEmailInput] = useState('mkajudiya001@gmail.com');
  const [pinInput, setPinInput] = useState('1234');
  const [showPassword, setShowPassword] = useState(false);
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

  return (
    <div
      className={`min-h-full w-full max-w-full overflow-x-hidden flex flex-col justify-between p-4 sm:p-6 transition-colors duration-200 ${
        isBright
          ? 'bg-[#F4F4F6] text-[#27272A] selection:bg-[#E07A5F] selection:text-white'
          : 'bg-[#1E1E24] text-[#F4F4F6] selection:bg-[#E07A5F] selection:text-white'
      }`}
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-end">
        {/* Theme Toggle on Login Screen (Dark & Light) */}
        <button
          type="button"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className={`p-2 rounded-full border shadow-xs transition active:scale-95 ${
            isBright
              ? 'bg-[#FFFFFF] border-[#D4D4D8] text-[#E07A5F] hover:bg-[#EBEBEF]'
              : 'bg-[#292930] border-[#3F3F46] text-[#E07A5F] hover:bg-[#34343D]'
          }`}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-[#E07A5F]" />
          ) : (
            <Moon className="w-4 h-4 text-[#E07A5F]" />
          )}
        </button>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-sm mx-auto my-auto py-6 space-y-6">
        {/* Brand Crest */}
        <div className="text-center space-y-2">
          <div className="inline-block">
            <AppLogoIcon size="xl" className="mx-auto shadow-2xl shadow-[#E07A5F]/20 ring-2 ring-[#E07A5F]/30" />
          </div>

          <h1
            className={`text-xl font-bold font-brand tracking-wide transition-colors ${
              isBright ? 'text-[#18181B]' : 'text-[#F4F4F6]'
            }`}
          >
            Shreenathji Imitation
          </h1>
        </div>

        {/* Manual Login Form */}
        <form onSubmit={handleCustomLogin} className="space-y-4">
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
              Password
            </label>
            <div className="relative">
              <Lock className={`w-4 h-4 absolute left-3 top-2.5 ${isBright ? 'text-[#71717A]' : 'text-[#A1A1AA]'}`} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Enter password..."
                className={`w-full pl-9 pr-10 py-2 rounded-xl border text-xs focus:border-[#E07A5F] outline-none ${
                  isBright
                    ? 'bg-[#FFFFFF] border-[#D4D4D8] text-[#27272A]'
                    : 'bg-[#292930] border-[#3F3F46] text-[#F4F4F6]'
                }`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className={`absolute right-2.5 top-2 p-0.5 rounded-md transition ${
                  isBright
                    ? 'text-[#71717A] hover:text-[#27272A] hover:bg-[#EBEBEF]'
                    : 'text-[#A1A1AA] hover:text-[#F4F4F6] hover:bg-[#34343D]'
                }`}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#E07A5F] to-[#C86349] hover:from-[#E8998D] hover:to-[#E07A5F] text-white font-bold text-xs shadow-lg shadow-[#E07A5F]/25 active:scale-95 transition flex items-center justify-center gap-2"
          >
            <KeyRound className="w-4 h-4" />
            <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
