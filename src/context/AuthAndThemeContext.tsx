import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppTheme, UserProfile } from '../types';

export const DEFAULT_USER: UserProfile = {
  id: 'usr-admin-01',
  name: 'Milan Ajudiya',
  email: 'mkajudiya001@gmail.com',
  role: 'Factory Administrator & Production Head',
  initials: 'MA',
  phone: '+91 98250 12345',
  facility: 'Shreenathji Imitation Jewellery - Unit 1',
  permissions: [
    'Create & Recalibrate Designs',
    'Lot Dispatch & Karigar Assignment',
    'Step 5 Confirm Arrival (Status Flip)',
    'Step 6 Manual Slip Verification & Data Entry',
    'Step 7 Stage Progression & Branching',
    'Ready Stock Inventory & Low-Stock Alerts',
    'Loss & Waste Analysis Audits',
  ],
};

export const DEMO_OPERATOR: UserProfile = {
  id: 'usr-op-02',
  name: 'Rajesh Soni',
  email: 'rajesh.soni@shreenathji.com',
  role: 'Floor Supervisor & Data Operator',
  initials: 'RS',
  phone: '+91 98251 98765',
  facility: 'Shreenathji Imitation - Floor 2',
  permissions: [
    'Step 5 Confirm Arrival',
    'Step 6 Manual Data Entry',
    'Print Stage Slips',
    'View Active Lots',
  ],
};

interface AuthAndThemeContextType {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
  currentUser: UserProfile | null;
  isLoggedIn: boolean;
  login: (user?: UserProfile) => void;
  logout: () => void;
  updateProfile: (data: Partial<UserProfile>) => void;
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  hapticEnabled: boolean;
  setHapticEnabled: (val: boolean) => void;
}

const AuthAndThemeContext = createContext<AuthAndThemeContextType | undefined>(undefined);

export const AuthAndThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state with localStorage persistence
  const [theme, setThemeState] = useState<AppTheme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('shreenathji_theme');
      if (saved === 'bright' || saved === 'dark') return saved;
    }
    return 'dark';
  });

  // User auth state with localStorage persistence
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedAuth = localStorage.getItem('shreenathji_auth_logged_in');
      if (savedAuth === 'false') return false;
      return true;
    }
    return true;
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('shreenathji_user_profile');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          if (parsed.name === 'Manoj Kajudiya') {
            const updated = { ...parsed, name: 'Milan Ajudiya', initials: 'MA' };
            localStorage.setItem('shreenathji_user_profile', JSON.stringify(updated));
            return updated;
          }
          return parsed;
        } catch {
          return DEFAULT_USER;
        }
      }
    }
    return DEFAULT_USER;
  });

  // Preferences
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('shreenathji_sound_fx') !== 'false';
  });
  const [hapticEnabled, setHapticEnabled] = useState<boolean>(() => {
    return localStorage.getItem('shreenathji_haptic') !== 'false';
  });

  // Apply theme to document root and body class
  useEffect(() => {
    localStorage.setItem('shreenathji_theme', theme);
    const root = document.documentElement;
    if (theme === 'bright') {
      root.classList.add('theme-bright');
      root.classList.remove('theme-dark');
      root.setAttribute('data-theme', 'bright');
    } else {
      root.classList.remove('theme-bright');
      root.classList.add('theme-dark');
      root.setAttribute('data-theme', 'dark');
    }
  }, [theme]);

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'bright' : 'dark'));
  };

  const login = (user?: UserProfile) => {
    const activeUser = user || DEFAULT_USER;
    setCurrentUser(activeUser);
    setIsLoggedIn(true);
    localStorage.setItem('shreenathji_auth_logged_in', 'true');
    localStorage.setItem('shreenathji_user_profile', JSON.stringify(activeUser));
  };

  const logout = () => {
    setIsLoggedIn(false);
    localStorage.setItem('shreenathji_auth_logged_in', 'false');
  };

  const updateProfile = (data: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...data };
    setCurrentUser(updated);
    localStorage.setItem('shreenathji_user_profile', JSON.stringify(updated));
  };

  return (
    <AuthAndThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        currentUser,
        isLoggedIn,
        login,
        logout,
        updateProfile,
        soundEnabled,
        setSoundEnabled: (val) => {
          setSoundEnabled(val);
          localStorage.setItem('shreenathji_sound_fx', String(val));
        },
        hapticEnabled,
        setHapticEnabled: (val) => {
          setHapticEnabled(val);
          localStorage.setItem('shreenathji_haptic', String(val));
        },
      }}
    >
      {children}
    </AuthAndThemeContext.Provider>
  );
};

export function useAuthAndTheme(): AuthAndThemeContextType {
  const ctx = useContext(AuthAndThemeContext);
  if (!ctx) {
    throw new Error('useAuthAndTheme must be used within an AuthAndThemeProvider');
  }
  return ctx;
}
