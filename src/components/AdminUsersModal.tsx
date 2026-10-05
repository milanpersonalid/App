import React from 'react';
import { Check, Clock3, RefreshCw, ShieldCheck, UserX, X } from 'lucide-react';
import { AppUserAccess } from '../types';
import { useAuthAndTheme } from '../context/AuthAndThemeContext';
import { fetchAppUsers, reviewAppUser } from '../services/userAccessService';

interface AdminUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminUsersModal: React.FC<AdminUsersModalProps> = ({ isOpen, onClose }) => {
  const { theme, isAdmin } = useAuthAndTheme();
  const isBright = theme === 'bright';
  const [users, setUsers] = React.useState<AppUserAccess[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [busyUserId, setBusyUserId] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');

  const loadUsers = React.useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      setUsers(await fetchAppUsers());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load users.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (isOpen && isAdmin) void loadUsers();
  }, [isOpen, isAdmin, loadUsers]);

  if (!isOpen || !isAdmin) return null;

  const handleReview = async (user: AppUserAccess, status: 'approved' | 'rejected') => {
    setBusyUserId(user.id);
    setError('');
    setMessage('');
    try {
      const updated = await reviewAppUser(user.id, status);
      setUsers((current) => current.map((item) => item.id === updated.id ? updated : item));
      setMessage(`${updated.email} has been ${status}.`);
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'Could not update access.');
    } finally {
      setBusyUserId(null);
    }
  };

  const statusStyle = (status: AppUserAccess['accessStatus']) => status === 'approved'
    ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
    : status === 'rejected'
      ? 'bg-red-500/15 text-red-500 border-red-500/30'
      : 'bg-amber-500/15 text-amber-500 border-amber-500/30';

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm no-print" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className={`w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl border shadow-2xl ${isBright ? 'bg-white border-stone-200 text-stone-900' : 'bg-neutral-900 border-neutral-700 text-white'}`}>
        <div className={`flex items-center justify-between border-b px-5 py-4 ${isBright ? 'border-stone-200 bg-stone-50' : 'border-neutral-800 bg-neutral-950'}`}>
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-5 w-5 text-amber-500" />
            <div>
              <h2 className="text-sm font-bold">Admin Dashboard</h2>
              <p className={`text-[10px] ${isBright ? 'text-stone-500' : 'text-neutral-400'}`}>Approve or reject access requests from registered users.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close admin dashboard" className="rounded-lg p-2"><X className="h-4 w-4" /></button>
        </div>

        <div className="max-h-[calc(90vh-72px)] space-y-5 overflow-y-auto p-4 sm:p-5">
          {(error || message) && <div className={`rounded-lg border px-3 py-2 text-xs ${error ? 'border-red-500/30 bg-red-500/10 text-red-500' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'}`}>{error || message}</div>}

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wide">User access ({users.length})</h3>
              <button type="button" onClick={() => void loadUsers()} disabled={isLoading} className="rounded-lg border border-neutral-500/30 p-2" aria-label="Refresh users"><RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} /></button>
            </div>
            <div className="space-y-2.5">
              {users.map((user) => (
                <div key={user.id} className={`rounded-xl border p-3 ${isBright ? 'border-stone-200 bg-white' : 'border-neutral-800 bg-neutral-950'}`}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-xs font-bold">{user.fullName || user.email.split('@')[0]}</div>
                      <div className={`truncate text-[10px] ${isBright ? 'text-stone-500' : 'text-neutral-400'}`}>{user.email}</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {user.role === 'admin' && <span className="rounded-full border border-violet-500/30 bg-violet-500/15 px-2 py-0.5 text-[9px] font-bold text-violet-500">ADMIN</span>}
                      <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase ${statusStyle(user.accessStatus)}`}>{user.accessStatus}</span>
                    </div>
                  </div>
                  {user.role !== 'admin' && (
                    <div className="mt-3 flex gap-2">
                      {user.accessStatus !== 'approved' && (
                        <button type="button" onClick={() => void handleReview(user, 'approved')} disabled={busyUserId === user.id} className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-[10px] font-bold text-white disabled:opacity-50"><Check className="h-3 w-3" /> Approve</button>
                      )}
                      {user.accessStatus !== 'rejected' && (
                        <button type="button" onClick={() => void handleReview(user, 'rejected')} disabled={busyUserId === user.id} className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-[10px] font-bold text-red-500 disabled:opacity-50"><UserX className="h-3 w-3" /> Reject</button>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {!isLoading && users.length === 0 && <div className={`rounded-xl border p-6 text-center text-xs ${isBright ? 'border-stone-200 text-stone-500' : 'border-neutral-800 text-neutral-400'}`}><Clock3 className="mx-auto mb-2 h-5 w-5" />No access requests yet.</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
