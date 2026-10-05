import React, { useState } from 'react';
import {
  X,
  Mail,
  Phone,
  ShieldCheck,
  Settings,
  LogOut,
  Edit2,
  Check,
  KeyRound,
} from 'lucide-react';
import { useAuthAndTheme } from '../context/AuthAndThemeContext';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  onOpenAdmin: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  onOpenSettings,
  onOpenAdmin,
}) => {
  const { currentUser, isAdmin, logout, updateProfile, theme } = useAuthAndTheme();
  const isBright = theme === 'bright';

  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(currentUser?.name || '');
  const [phoneInput, setPhoneInput] = useState(currentUser?.phone || '');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  if (!isOpen || !currentUser) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({
      name: nameInput.trim() || currentUser.name,
      phone: phoneInput.trim() || currentUser.phone,
    });
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto overflow-x-hidden w-full max-w-full animate-in fade-in duration-150">
      <div
        className={`relative w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden my-4 max-w-full transition-colors duration-200 ${
          isBright
            ? 'bg-[#FFFFFF] border-[#D4D4D8] text-[#27272A]'
            : 'bg-[#292930] border-[#3F3F46] text-[#F4F4F6]'
        }`}
      >
        {/* Header Banner */}
        <div
          className={`relative h-28 p-4 flex items-start justify-between border-b transition-colors ${
            isBright
              ? 'bg-gradient-to-r from-[#E07A5F]/25 via-[#F4F4F6] to-[#E8998D]/20 border-[#D4D4D8]'
              : 'bg-gradient-to-r from-[#E07A5F]/30 via-[#1E1E24] to-[#C86349]/20 border-[#3F3F46]'
          }`}
        >
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold backdrop-blur-xs ${
              isBright
                ? 'bg-[#FFFFFF]/90 border-[#D4D4D8] text-[#E07A5F]'
                : 'bg-[#1E1E24]/90 border-[#3F3F46] text-[#E07A5F]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#E07A5F]" />
            <span>Profile</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onClose}
              className={`p-2 rounded-full border transition ${
                isBright
                  ? 'bg-[#FFFFFF]/90 hover:bg-[#EBEBEF] border-[#D4D4D8] text-[#71717A] hover:text-[#27272A]'
                  : 'bg-[#1E1E24]/90 hover:bg-[#34343D] border-[#3F3F46] text-[#A1A1AA] hover:text-[#F4F4F6]'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Profile Card Body */}
        <div className="px-5 pb-5 pt-0 relative">
          {/* Avatar positioning */}
          <div className="flex justify-between items-end -mt-10 mb-4">
            <div className="relative">
              <div
                className={`w-20 h-20 rounded-2xl bg-gradient-to-br from-[#E07A5F] to-[#C86349] border-4 flex items-center justify-center text-white font-bold text-2xl shadow-xl shadow-[#E07A5F]/20 ${
                  isBright ? 'border-[#FFFFFF]' : 'border-[#292930]'
                }`}
              >
                {currentUser.initials}
              </div>
              <div
                className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#7A9B76] border-2 flex items-center justify-center ${
                  isBright ? 'border-[#FFFFFF]' : 'border-[#292930]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onClose();
                  onOpenSettings();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition active:scale-95 shadow-xs ${
                  isBright
                    ? 'bg-[#FFFFFF] hover:bg-[#EBEBEF] text-[#27272A] border-[#D4D4D8]'
                    : 'bg-[#1E1E24] hover:bg-[#34343D] text-[#F4F4F6] border-[#3F3F46]'
                }`}
              >
                <Settings className="w-3.5 h-3.5 text-[#E07A5F]" />
                <span>Settings</span>
              </button>
            </div>
          </div>

          {/* User Details / Edit Form */}
          {!isEditing ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold font-brand flex items-center gap-2">
                  {currentUser.name}
                  <button
                    onClick={() => {
                      setNameInput(currentUser.name);
                      setPhoneInput(currentUser.phone || '');
                      setIsEditing(true);
                    }}
                    title="Edit Name & Phone"
                    className={`p-1 rounded-lg transition ${
                      isBright
                        ? 'text-[#71717A] hover:text-[#E07A5F] hover:bg-[#EBEBEF]'
                        : 'text-[#A1A1AA] hover:text-[#E07A5F] hover:bg-[#34343D]'
                    }`}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </h3>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSaveProfile}
              className={`space-y-3 p-3 rounded-2xl border mb-2 ${
                isBright ? 'bg-[#F4F4F6] border-[#D4D4D8]' : 'bg-[#1E1E24] border-[#3F3F46]'
              }`}
            >
              <div>
                <label className={`text-[10px] font-semibold uppercase tracking-wider block mb-1 ${isBright ? 'text-[#71717A]' : 'text-[#A1A1AA]'}`}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className={`w-full px-3 py-1.5 rounded-xl border text-xs focus:border-[#E07A5F] outline-none ${
                    isBright
                      ? 'bg-[#FFFFFF] border-[#D4D4D8] text-[#27272A]'
                      : 'bg-[#292930] border-[#3F3F46] text-[#F4F4F6]'
                  }`}
                  required
                />
              </div>
              <div>
                <label className={`text-[10px] font-semibold uppercase tracking-wider block mb-1 ${isBright ? 'text-[#71717A]' : 'text-[#A1A1AA]'}`}>
                  Phone Number
                </label>
                <input
                  type="text"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className={`w-full px-3 py-1.5 rounded-xl border text-xs focus:border-[#E07A5F] outline-none ${
                    isBright
                      ? 'bg-[#FFFFFF] border-[#D4D4D8] text-[#27272A]'
                      : 'bg-[#292930] border-[#3F3F46] text-[#F4F4F6]'
                  }`}
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className={`px-3 py-1 rounded-lg text-xs ${isBright ? 'text-[#71717A] hover:text-[#27272A]' : 'text-[#A1A1AA] hover:text-[#F4F4F6]'}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 rounded-lg bg-[#E07A5F] hover:bg-[#E8998D] text-white font-bold text-xs flex items-center gap-1 active:scale-95 transition"
                >
                  <Check className="w-3.5 h-3.5" /> Save
                </button>
              </div>
            </form>
          )}

          {/* Quick Contact & Info pills */}
          <div
            className={`mt-4 p-3 rounded-2xl border space-y-2 text-xs ${
              isBright
                ? 'bg-[#F4F4F6] border-[#D4D4D8]'
                : 'bg-[#1E1E24] border-[#3F3F46]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`flex items-center gap-1.5 text-[11px] ${isBright ? 'text-[#71717A]' : 'text-[#A1A1AA]'}`}>
                <Mail className="w-3.5 h-3.5 text-[#E07A5F]" /> Email
              </span>
              <span className="font-mono text-[11px] truncate max-w-[200px]">
                {currentUser.email}
              </span>
            </div>
            {currentUser.phone && (
              <div className={`flex items-center justify-between border-t pt-2 ${isBright ? 'border-[#D4D4D8]' : 'border-[#3F3F46]'}`}>
                <span className={`flex items-center gap-1.5 text-[11px] ${isBright ? 'text-[#71717A]' : 'text-[#A1A1AA]'}`}>
                  <Phone className="w-3.5 h-3.5 text-[#E07A5F]" /> Phone
                </span>
                <span className="font-mono text-[11px]">
                  {currentUser.phone}
                </span>
              </div>
            )}
            <div className={`flex items-center justify-between border-t pt-2 ${isBright ? 'border-[#D4D4D8]' : 'border-[#3F3F46]'}`}>
              <span className={`flex items-center gap-1.5 text-[11px] ${isBright ? 'text-[#71717A]' : 'text-[#A1A1AA]'}`}>
                <KeyRound className="w-3.5 h-3.5 text-[#E07A5F]" /> Foundry Access
              </span>
              <span className="text-[#7A9B76] font-semibold text-[11px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7A9B76]" /> {isAdmin ? 'Approved Administrator' : 'Approved User'}
              </span>
            </div>
          </div>

          {/* Bottom Actions: Settings & Logout */}
          <div className={`mt-5 pt-3 border-t flex flex-col gap-2 ${isBright ? 'border-[#D4D4D8]' : 'border-[#3F3F46]'}`}>
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAdmin();
                }}
                className={`w-full py-2.5 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition active:scale-[0.99] ${
                  isBright
                    ? 'bg-violet-50 hover:bg-violet-100 text-violet-700 border-violet-200'
                    : 'bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border-violet-500/30'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Open Admin Dashboard</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSettings();
              }}
              className={`w-full py-2.5 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition active:scale-[0.99] ${
                isBright
                  ? 'bg-[#FFFFFF] hover:bg-[#EBEBEF] text-[#27272A] border-[#D4D4D8]'
                  : 'bg-[#1E1E24] hover:bg-[#34343D] text-[#F4F4F6] border-[#3F3F46]'
              }`}
            >
              <Settings className="w-4 h-4 text-[#E07A5F]" />
              <span>Open Settings (Dark / Light Theme &amp; Controls)</span>
            </button>

            {!showLogoutConfirm ? (
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-[#A8556B]/15 hover:bg-[#A8556B]/25 text-[#A8556B] border border-[#A8556B]/40 text-xs font-bold flex items-center justify-center gap-2 transition active:scale-[0.99]"
              >
                <LogOut className="w-4 h-4 text-[#A8556B]" />
                <span>Log Out of Session</span>
              </button>
            ) : (
              <div className="p-3 rounded-xl bg-[#A8556B]/20 border border-[#A8556B]/60 space-y-2 animate-in fade-in">
                <p className="text-xs text-[#A8556B] text-center font-medium">
                  Are you sure you want to log out from this terminal?
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowLogoutConfirm(false)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium ${
                      isBright
                        ? 'bg-[#FFFFFF] hover:bg-[#EBEBEF] text-[#27272A]'
                        : 'bg-[#1E1E24] hover:bg-[#34343D] text-[#F4F4F6]'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      logout();
                    }}
                    className="flex-1 py-1.5 rounded-lg bg-[#A8556B] hover:bg-[#A8556B]/80 text-white text-xs font-bold shadow-md active:scale-95 transition"
                  >
                    Confirm Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
