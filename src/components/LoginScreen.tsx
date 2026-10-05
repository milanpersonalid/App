import React, { useState } from 'react';
import {
  KeyRound,
  Sun,
  Moon,
  Lock,
  User,
  Eye,
  EyeOff,
  UserPlus,
} from 'lucide-react';
import { useAuthAndTheme } from '../context/AuthAndThemeContext';
import { isSupabaseConfigured } from '../lib/supabase';
import { AppLogoIcon } from './AppLogoIcon';

export const LoginScreen: React.FC = () => {
  const { login, requestAccess, theme, toggleTheme } = useAuthAndTheme();
  const isBright = theme === 'bright';

  const [emailInput, setEmailInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [mode, setMode] = useState<'login' | 'request'>('login');
  const [nameInput, setNameInput] = useState('');

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      if (mode === 'request') {
        const message = await requestAccess(nameInput, emailInput, pinInput);
        setSuccessMessage(message);
        setPinInput('');
      } else {
        await login(emailInput.trim(), pinInput);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setIsLoading(false);
    }
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

        {!isSupabaseConfigured ? (
          <div
            role="status"
            className={`space-y-3 rounded-2xl border p-4 text-sm ${
              isBright
                ? 'border-amber-300 bg-amber-50 text-stone-800'
                : 'border-amber-500/40 bg-amber-500/10 text-stone-100'
            }`}
          >
            <h2 className="font-bold">Backend setup required</h2>
            <p className="text-xs leading-relaxed">
              This app needs a Supabase project before anyone can sign in or load production data.
            </p>
            <ol className="list-decimal space-y-1 pl-4 text-xs leading-relaxed">
              <li>Create a project in the Supabase Dashboard.</li>
              <li>Run the SQL in <code>supabase/migrations/202609250001_production_data.sql</code>.</li>
              <li>Add the project URL and publishable key to a <code>.env</code> file in the app folder.</li>
              <li>Restart the app server, then create and sign in with a Supabase user.</li>
            </ol>
            <pre className={`overflow-x-auto rounded-lg p-2 text-[10px] leading-relaxed ${
              isBright ? 'bg-white text-stone-700' : 'bg-neutral-950 text-stone-300'
            }`}>{'VITE_SUPABASE_URL="https://YOUR_PROJECT.supabase.co"\nVITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_..."'}</pre>
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-xs font-bold text-amber-500 underline underline-offset-2"
            >
              Open Supabase Dashboard
            </a>
          </div>
        ) : (
        <form onSubmit={handleCustomLogin} className="space-y-4">
          {mode === 'request' && (
            <div>
              <label className={`text-[10px] font-semibold uppercase tracking-wider block mb-1 ${isBright ? 'text-[#71717A]' : 'text-[#A1A1AA]'}`}>
                Your Name
              </label>
              <div className="relative">
                <User className={`w-4 h-4 absolute left-3 top-2.5 ${isBright ? 'text-[#71717A]' : 'text-[#A1A1AA]'}`} />
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Enter your name..."
                  className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs focus:border-[#E07A5F] outline-none ${isBright ? 'bg-[#FFFFFF] border-[#D4D4D8] text-[#27272A]' : 'bg-[#292930] border-[#3F3F46] text-[#F4F4F6]'}`}
                  required
                />
              </div>
            </div>
          )}
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

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          {successMessage && (
            <p className="text-xs text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
              {successMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#E07A5F] to-[#C86349] hover:from-[#E8998D] hover:to-[#E07A5F] text-white font-bold text-xs shadow-lg shadow-[#E07A5F]/25 active:scale-95 transition flex items-center justify-center gap-2"
          >
            {mode === 'request' ? <UserPlus className="w-4 h-4" /> : <KeyRound className="w-4 h-4" />}
            <span>{isLoading ? (mode === 'request' ? 'Submitting...' : 'Signing In...') : (mode === 'request' ? 'Request Access' : 'Sign In')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode((current) => current === 'login' ? 'request' : 'login');
              setError('');
              setSuccessMessage('');
            }}
            className={`w-full text-xs font-semibold ${isBright ? 'text-[#C86349]' : 'text-[#E8998D]'}`}
          >
            {mode === 'login' ? 'New user? Request access' : 'Already approved? Sign in'}
          </button>
        </form>
        )}
      </div>
    </div>
  );
};
