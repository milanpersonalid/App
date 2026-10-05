import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppTheme, UserProfile } from '../types';
import { isSupabaseConfigured, requireSupabase, supabase } from '../lib/supabase';
import { fetchOwnAccessProfile } from '../services/userAccessService';

const INITIAL_ADMIN_EMAIL = 'milanpersonalid@gmail.com';

export const DEFAULT_USER: UserProfile = {
  id: 'usr-admin-01',
  name: 'Milan Ajudiya',
  email: 'milanpersonalid@gmail.com',
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
  isAuthReady: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  requestAccess: (name: string, email: string, password: string) => Promise<string>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  hapticEnabled: boolean;
  setHapticEnabled: (val: boolean) => void;
}

const AuthAndThemeContext = createContext<AuthAndThemeContextType | undefined>(undefined);

export const AuthAndThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>('dark');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(!supabase);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [hapticEnabled, setHapticEnabled] = useState<boolean>(true);

  const profileFromAuthUser = (
    user: { id: string; email?: string; user_metadata?: Record<string, any> },
    access?: { fullName: string; role: 'admin' | 'member'; accessStatus: 'pending' | 'approved' | 'rejected' }
  ): UserProfile => {
    const metadata = user.user_metadata ?? {};
    const email = user.email || metadata.email || '';
    const name = access?.fullName || metadata.name || email.split('@')[0] || 'Workshop User';
    return {
      id: user.id,
      name,
      email,
      role: access?.role === 'admin' ? 'Administrator' : 'Production User',
      initials: metadata.initials || name.split(/\s+/).map((part: string) => part[0]).join('').slice(0, 2).toUpperCase(),
      phone: metadata.phone || '',
      facility: metadata.facility || 'Shreenathji Imitation Jewellery',
      permissions: Array.isArray(metadata.permissions) ? metadata.permissions : [],
      avatarUrl: metadata.avatar_url || undefined,
      accessRole: access?.role,
      accessStatus: access?.accessStatus,
    };
  };

  const hydrateAuthenticatedUser = async (user: { id: string; email?: string; user_metadata?: Record<string, any> }) => {
    let access;
    try {
      access = await fetchOwnAccessProfile(user.id);
    } catch (error) {
      // Keep the existing administrator usable while the new migration is being deployed.
      if (user.email?.toLowerCase() !== INITIAL_ADMIN_EMAIL) throw error;
      access = {
        id: user.id,
        email: user.email,
        fullName: user.user_metadata?.name || user.email.split('@')[0],
        role: 'admin' as const,
        accessStatus: 'approved' as const,
        requestedAt: new Date().toISOString(),
      };
    }
    if (!access) throw new Error('Your access profile is not set up. Contact the administrator.');
    if (access.accessStatus === 'pending') throw new Error('Your access request is awaiting administrator approval.');
    if (access.accessStatus === 'rejected') throw new Error('Your access request was rejected. Contact the administrator.');
    const profile = profileFromAuthUser(user, access);
    setCurrentUser(profile);
    setIsLoggedIn(true);
    return profile;
  };

  useEffect(() => {
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => {
        if (!session?.user) {
          setCurrentUser(null);
          setIsLoggedIn(false);
          setIsAuthReady(true);
          return;
        }
        void hydrateAuthenticatedUser(session.user)
          .catch(() => {
            setCurrentUser(null);
            setIsLoggedIn(false);
          })
          .finally(() => setIsAuthReady(true));
      }, 0);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  // Apply theme to document root and body class
  useEffect(() => {
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

  const login = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured.');
    }
    const { data, error } = await requireSupabase().auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.user) throw new Error('Supabase did not return an authenticated user.');
    try {
      await hydrateAuthenticatedUser(data.user);
    } catch (accessError) {
      await requireSupabase().auth.signOut();
      throw accessError;
    }
  };

  const requestAccess = async (name: string, email: string, password: string): Promise<string> => {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
    const normalizedEmail = email.trim().toLowerCase();
    if (!name.trim()) throw new Error('Enter your name.');
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) throw new Error('Enter a valid email address.');
    if (password.length < 6) throw new Error('Password must contain at least 6 characters.');
    const { data, error } = await requireSupabase().auth.signUp({
      email: normalizedEmail,
      password,
      options: { data: { name: name.trim() } },
    });
    if (error) throw error;
    if (data.session) await requireSupabase().auth.signOut();
    return 'Request submitted. Check your email and confirm your account, then wait for administrator approval before signing in.';
  };

  const logout = async () => {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    }
    setIsLoggedIn(false);
    setCurrentUser(null);
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!currentUser) return;
    const { data: authData, error } = await requireSupabase().auth.updateUser({
      data: {
        name: data.name ?? currentUser.name,
        phone: data.phone ?? currentUser.phone,
        initials: data.initials ?? currentUser.initials,
      },
    });
    if (error) throw error;
    const updated = authData.user
      ? profileFromAuthUser(authData.user, {
        fullName: data.name ?? currentUser.name,
        role: currentUser.accessRole ?? 'member',
        accessStatus: currentUser.accessStatus ?? 'approved',
      })
      : { ...currentUser, ...data };
    setCurrentUser(updated);
  };

  return (
    <AuthAndThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        currentUser,
        isLoggedIn,
        isAuthReady,
        isAdmin: currentUser?.accessRole === 'admin' && currentUser.accessStatus === 'approved',
        login,
        requestAccess,
        logout,
        updateProfile,
        soundEnabled,
        setSoundEnabled,
        hapticEnabled,
        setHapticEnabled,
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
