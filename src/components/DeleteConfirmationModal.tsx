import React, { useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteConfirmationModalProps {
  open: boolean;
  bright: boolean;
  title: string;
  message: string;
  blocked?: boolean;
  onCancel: () => void;
  onConfirm?: () => Promise<void>;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  open,
  bright,
  title,
  message,
  blocked = false,
  onCancel,
  onConfirm,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleConfirm = async () => {
    if (!onConfirm || isDeleting) return;
    setError(null);
    setIsDeleting(true);
    try {
      await onConfirm();
      onCancel();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not complete the deletion.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="absolute inset-0 z-[140] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        className={`w-full max-w-sm rounded-2xl border shadow-2xl p-5 ${
          bright ? 'bg-white border-slate-200 text-slate-900' : 'bg-neutral-900 border-neutral-700 text-neutral-100'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-red-500/15 text-red-500 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="delete-dialog-title" className="font-bold text-sm">{title}</h2>
            <p className={`mt-2 text-xs leading-relaxed ${bright ? 'text-slate-600' : 'text-neutral-300'}`}>
              {message}
            </p>
          </div>
          <button type="button" onClick={onCancel} className="p-1 rounded-lg text-neutral-500 hover:bg-neutral-500/10" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && <p className="mt-3 rounded-lg bg-red-500/10 border border-red-500/30 p-2 text-xs text-red-500">{error}</p>}

        <div className="flex justify-end gap-2 mt-5">
          <button type="button" onClick={onCancel} disabled={isDeleting} className={`px-3 py-2 rounded-xl text-xs font-semibold ${bright ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700'}`}>
            {blocked ? 'Close' : 'Cancel'}
          </button>
          {!blocked && (
            <button type="button" onClick={() => void handleConfirm()} disabled={isDeleting} className="px-3 py-2 rounded-xl bg-red-500 hover:bg-red-400 disabled:opacity-60 text-white text-xs font-bold inline-flex items-center gap-1.5">
              <Trash2 className="w-3.5 h-3.5" />
              {isDeleting ? 'Deleting…' : 'Delete'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
