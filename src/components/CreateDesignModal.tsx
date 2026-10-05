import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuthAndTheme } from '../context/AuthAndThemeContext';
import {
  X,
  Plus,
  Image as ImageIcon,
  Sparkles,
  Upload,
  RefreshCw,
  Info,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { getSampleRingPhoto } from '../data/initialData';

interface CreateDesignModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateDesignModal: React.FC<CreateDesignModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const { createDesign } = useApp();
  const { theme } = useAuthAndTheme();
  const isBright = theme === 'bright';

  const generateDesignCode = () =>
    `DSG-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

  const [name, setName] = useState('');
  const [orderRef, setOrderRef] = useState<string>(generateDesignCode);
  const [lowStockThreshold, setLowStockThreshold] = useState<string>('500'); // default 500
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [photoFile, setPhotoFile] = useState<File | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!photoUrl.startsWith('blob:')) return;
    return () => URL.revokeObjectURL(photoUrl);
  }, [photoUrl]);

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a descriptive ring design name.');
      return;
    }
    setIsSubmitting(true);
    setError('');

    try {
      const finalPhoto = photoUrl || getSampleRingPhoto(name || 'Custom Ring');
      await createDesign({
        name: name.trim(),
        orderRef: orderRef.trim(),
        photoUrl: finalPhoto,
        photoFile,
        lowStockThreshold: parseInt(lowStockThreshold, 10) || 500,
      });

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create design');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm overflow-y-auto overflow-x-hidden w-full max-w-full no-print">
      <div
        className={`relative w-full max-w-xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-4 border transition-colors flex flex-col max-h-[92vh] max-w-full ${
          isBright
            ? 'bg-white border-[#E4E4E7] text-[#18181B]'
            : 'bg-[#18181B] border-[#27272A] text-neutral-100'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-5 sm:px-7 py-4 border-b shrink-0 ${
            isBright
              ? 'bg-[#FAFAFA] border-[#E4E4E7]'
              : 'bg-[#121214] border-[#27272A]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border flex items-center justify-center ${
                isBright
                  ? 'bg-amber-100/80 text-amber-800 border-amber-300'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}
            >
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3
                className={`font-bold text-base sm:text-lg tracking-tight ${
                  isBright ? 'text-[#18181B]' : 'text-white'
                }`}
              >
                Create Design
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition ${
              isBright
                ? 'text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F6]'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-5 overflow-y-auto overflow-x-hidden w-full max-w-full">
          {error && (
            <div
              className={`p-3.5 text-xs sm:text-sm rounded-xl border flex items-start gap-2.5 font-medium ${
                isBright
                  ? 'bg-red-50 border-red-200 text-red-700'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}
            >
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Design Identity & Code */}
          <div className="space-y-4">
            {/* Design Name */}
            <div>
              <label
                className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                  isBright ? 'text-[#3F3F46]' : 'text-neutral-300'
                }`}
              >
                Design / Ring Name <span className="text-amber-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Royal Kundan Floral Solitaire Ring"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium outline-none transition ${
                  isBright
                    ? 'bg-[#F8FAFC] border-[#CBD5E1] text-[#0F172A] placeholder:text-slate-400 focus:border-amber-600 focus:bg-white focus:ring-1 focus:ring-amber-500/30'
                    : 'bg-[#121214] border-neutral-700 text-neutral-100 placeholder:text-neutral-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30'
                }`}
              />
            </div>

            {/* Design Code */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  className={`block text-xs font-semibold uppercase tracking-wider ${
                    isBright ? 'text-[#3F3F46]' : 'text-neutral-300'
                  }`}
                >
                  Design Code <span className="text-amber-500">*</span>
                </label>
                <span
                  className={`text-[11px] font-mono ${
                    isBright ? 'text-[#64748B]' : 'text-neutral-400'
                  }`}
                >
                  Catalog / Mould Ref
                </span>
              </div>
              <div className="relative flex items-center">
                <input
                  type="text"
                  required
                  placeholder="e.g. DSG-2024-501 or FS-101"
                  value={orderRef}
                  onChange={(e) => setOrderRef(e.target.value.toUpperCase())}
                  className={`w-full pl-3.5 pr-10 py-2.5 rounded-xl border font-mono text-sm uppercase outline-none font-semibold transition ${
                    isBright
                      ? 'bg-[#F8FAFC] border-[#CBD5E1] text-[#0F172A] focus:border-amber-600 focus:bg-white focus:ring-1 focus:ring-amber-500/30'
                      : 'bg-[#121214] border-neutral-700 text-neutral-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setOrderRef(generateDesignCode())}
                  title="Generate new design code"
                  className={`absolute right-2 p-1.5 rounded-lg transition ${
                    isBright
                      ? 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2E8F0]'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                  }`}
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Low Stock Threshold Card */}
          <div
            className={`p-4 rounded-2xl border transition-colors space-y-2.5 ${
              isBright
                ? 'bg-[#F8FAFC] border-[#E2E8F0]'
                : 'bg-[#121214] border-[#27272A]'
            }`}
          >
            <div className="flex items-center justify-between">
              <label
                className={`block text-xs font-semibold uppercase tracking-wider ${
                  isBright ? 'text-[#3F3F46]' : 'text-neutral-300'
                }`}
              >
                Low Stock Alert Threshold (pcs) <span className="text-amber-500">*</span>
              </label>
              <span
                className={`text-[11px] font-mono ${
                  isBright ? 'text-[#64748B]' : 'text-neutral-400'
                }`}
              >
                Trigger Warning
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                required
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                className={`w-36 px-3.5 py-2 rounded-xl border font-mono text-sm font-semibold outline-none transition ${
                  isBright
                    ? 'bg-white border-[#CBD5E1] text-[#0F172A] focus:border-amber-600 focus:ring-1 focus:ring-amber-500/30'
                    : 'bg-neutral-900 border-neutral-700 text-neutral-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30'
                }`}
              />
              <div className="flex items-center gap-1.5 flex-wrap">
                {[200, 500, 1000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setLowStockThreshold(preset.toString())}
                    className={`px-2.5 py-1 text-xs rounded-lg font-mono font-medium transition border ${
                      parseInt(lowStockThreshold, 10) === preset
                        ? isBright
                          ? 'bg-[#0F172A] text-white border-[#0F172A]'
                          : 'bg-amber-400 text-neutral-950 border-amber-400 font-bold'
                        : isBright
                        ? 'bg-white hover:bg-slate-100 text-[#475569] border-[#CBD5E1]'
                        : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-neutral-700'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
            <p
              className={`text-[11px] ${
                isBright ? 'text-[#64748B]' : 'text-neutral-400'
              }`}
            >
              Triggers amber workshop warning when ready stock level drops below this count.
            </p>
          </div>

          {/* Section 3: Ring Visuals & Presets */}
          <div
            className={`p-4 rounded-2xl border transition-colors space-y-3 ${
              isBright
                ? 'bg-[#F8FAFC] border-[#E2E8F0]'
                : 'bg-[#121214] border-[#27272A]'
            }`}
          >
            <label
              className={`block text-xs font-semibold uppercase tracking-wider ${
                isBright ? 'text-[#3F3F46]' : 'text-neutral-300'
              }`}
            >
              Design Ring Photo
            </label>
            <div className="flex items-center gap-4">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt="Preview"
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border shrink-0 ${
                    isBright ? 'border-amber-400 shadow-xs' : 'border-amber-500/40'
                  }`}
                />
              ) : (
                <div
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border flex flex-col items-center justify-center shrink-0 ${
                    isBright
                      ? 'bg-white border-slate-300 text-slate-400'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-600'
                  }`}
                >
                  <ImageIcon className="w-6 h-6 mb-1" />
                  <span className="text-[10px] font-medium">No photo</span>
                </div>
              )}

              <div className="space-y-2 flex-1 min-w-0">
                <label
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition border ${
                    isBright
                      ? 'bg-white hover:bg-slate-100 text-[#1E293B] border-[#CBD5E1] shadow-2xs'
                      : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Image File</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFile}
                    className="hidden"
                  />
                </label>

                {/* Image file upload */}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div
            className={`flex items-center justify-end gap-3 pt-4 border-t ${
              isBright ? 'border-[#E4E4E7]' : 'border-neutral-800'
            }`}
          >
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2.5 text-xs font-semibold rounded-xl transition ${
                isBright
                  ? 'bg-[#F4F4F6] hover:bg-[#E4E4E7] text-[#52525B]'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-bold rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-neutral-950 shadow-md shadow-amber-500/20 transition flex items-center gap-2 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving Design...' : 'Save Design & Generate Barcode'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
