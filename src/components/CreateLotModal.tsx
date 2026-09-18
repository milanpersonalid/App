import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuthAndTheme } from '../context/AuthAndThemeContext';
import { Stage } from '../types';
import {
  X,
  Layers,
  Sparkles,
  Scale,
  RefreshCw,
  UserCheck,
  Package,
  Tag,
  Info,
  Check,
} from 'lucide-react';

interface CreateLotModalProps {
  onClose: () => void;
  onSuccess: (lotNumber: string) => void;
  preselectedDesignId?: string;
}

export const CreateLotModal: React.FC<CreateLotModalProps> = ({
  onClose,
  onSuccess,
  preselectedDesignId,
}) => {
  const { designs, karigars, createLot, lots } = useApp();
  const { theme } = useAuthAndTheme();
  const isBright = theme === 'bright';

  const generateRandomLotNumber = () =>
    `LOT-${Math.floor(1000 + Math.random() * 9000)}`;

  const [lotNumber, setLotNumber] = useState<string>(generateRandomLotNumber);
  const [designId, setDesignId] = useState<string>(
    preselectedDesignId || designs[0]?.id || ''
  );
  const [initialPieces, setInitialPieces] = useState<string>('200');
  const [initialWeight, setInitialWeight] = useState<string>('300.0');
  const [startingStage, setStartingStage] = useState<Stage>('Wax');
  const [karigarId, setKarigarId] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isWeightManuallyEdited, setIsWeightManuallyEdited] = useState<boolean>(false);

  const selectedDesign = designs.find((d) => d.id === designId);
  const selectedKarigar = karigars.find((k) => k.id === karigarId);

  // Auto-fill estimated weight based on pieces * avg weight unless manually customized
  useEffect(() => {
    if (selectedDesign && initialPieces && !isWeightManuallyEdited) {
      const p = parseInt(initialPieces, 10);
      if (p > 0) {
        const estWeight = Number((p * selectedDesign.averageWeightPerPiece).toFixed(2));
        setInitialWeight(estWeight.toString());
      }
    }
  }, [designId, initialPieces, selectedDesign, isWeightManuallyEdited]);

  // Set default karigar specializing in starting stage
  useEffect(() => {
    const candidate =
      karigars.find((k) => k.specialtyStages.includes(startingStage)) ||
      karigars[0];
    if (candidate) {
      setKarigarId(candidate.id);
    }
  }, [startingStage, karigars]);

  const handleResetWeightToBaseline = () => {
    if (selectedDesign && initialPieces) {
      const p = parseInt(initialPieces, 10);
      if (p > 0) {
        const estWeight = Number((p * selectedDesign.averageWeightPerPiece).toFixed(2));
        setInitialWeight(estWeight.toString());
        setIsWeightManuallyEdited(false);
      }
    }
  };

  const handlePiecesQuickSelect = (piecesToAddOrSet: number, isDirectSet = false) => {
    const current = parseInt(initialPieces, 10) || 0;
    const newPieces = isDirectSet ? piecesToAddOrSet : Math.max(1, current + piecesToAddOrSet);
    setInitialPieces(newPieces.toString());
    if (selectedDesign) {
      const estWeight = Number((newPieces * selectedDesign.averageWeightPerPiece).toFixed(2));
      setInitialWeight(estWeight.toString());
      setIsWeightManuallyEdited(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedLotNumber = lotNumber.trim().toUpperCase();
    if (!trimmedLotNumber) {
      setError('Please provide a valid Lot number.');
      return;
    }
    if (lots.some((l) => l.lotNumber.toUpperCase() === trimmedLotNumber)) {
      setError(`Lot number "${trimmedLotNumber}" already exists. Click the refresh icon to generate a new number.`);
      return;
    }
    if (!designId) {
      setError('Please select a ring design.');
      return;
    }
    if (!karigarId) {
      setError('Please assign a starting Karigar.');
      return;
    }

    const pieces = parseInt(initialPieces, 10);
    const weight = parseFloat(initialWeight);

    if (isNaN(pieces) || pieces <= 0) {
      setError('Initial pieces count must be a positive integer.');
      return;
    }
    if (isNaN(weight) || weight <= 0) {
      setError('Initial weight must be a positive number greater than 0.');
      return;
    }

    const newLot = createLot({
      lotNumber: trimmedLotNumber,
      designId,
      initialPieces: pieces,
      initialWeight: weight,
      startingStage,
      karigarId,
    });

    onSuccess(newLot.lotNumber);
  };

  const computedEffectiveAvgWeight =
    parseInt(initialPieces, 10) > 0 && parseFloat(initialWeight) > 0
      ? (parseFloat(initialWeight) / parseInt(initialPieces, 10)).toFixed(3)
      : null;

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
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3
                className={`font-bold text-base sm:text-lg tracking-tight ${
                  isBright ? 'text-[#18181B]' : 'text-white'
                }`}
              >
                Create Lot
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

          {/* Section 1: Lot Identity & Stage */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Lot Number */}
            <div>
              <label
                className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                  isBright ? 'text-[#3F3F46]' : 'text-neutral-300'
                }`}
              >
                Lot Number <span className="text-amber-500">*</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  required
                  value={lotNumber}
                  onChange={(e) => setLotNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. LOT-4821"
                  className={`w-full pl-3.5 pr-10 py-2.5 rounded-xl border font-mono text-sm uppercase outline-none font-semibold transition ${
                    isBright
                      ? 'bg-[#F8FAFC] border-[#CBD5E1] text-[#0F172A] focus:border-amber-600 focus:bg-white focus:ring-1 focus:ring-amber-500/30'
                      : 'bg-[#121214] border-neutral-700 text-neutral-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setLotNumber(generateRandomLotNumber())}
                  title="Generate new lot number"
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

            {/* Starting Stage */}
            <div>
              <label
                className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                  isBright ? 'text-[#3F3F46]' : 'text-neutral-300'
                }`}
              >
                Starting Stage <span className="text-amber-500">*</span>
              </label>
              <select
                value={startingStage}
                onChange={(e) => setStartingStage(e.target.value as Stage)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium outline-none transition ${
                  isBright
                    ? 'bg-[#F8FAFC] border-[#CBD5E1] text-[#0F172A] focus:border-amber-600 focus:bg-white focus:ring-1 focus:ring-amber-500/30'
                    : 'bg-[#121214] border-neutral-700 text-neutral-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30'
                }`}
              >
                <option value="Wax">Wax (Default Stage 1)</option>
                <option value="Casting">Casting (Stage 2)</option>
                <option value="Buff">Buff (Stage 3)</option>
                <option value="Zabora">Zabora (Stage 4)</option>
                <option value="Dal">Dal (Stage 5)</option>
                <option value="Chhol">Chhol (Stage 6)</option>
              </select>
            </div>
          </div>

          {/* Section 2: Ring Design & Baseline Card */}
          <div
            className={`p-4 rounded-2xl border transition-colors space-y-3 ${
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
                Linked Ring Design <span className="text-amber-500">*</span>
              </label>
            </div>

            <select
              value={designId}
              onChange={(e) => {
                setDesignId(e.target.value);
                setIsWeightManuallyEdited(false);
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium outline-none transition ${
                isBright
                  ? 'bg-white border-[#CBD5E1] text-[#0F172A] focus:border-amber-600 focus:ring-1 focus:ring-amber-500/30'
                  : 'bg-neutral-900 border-neutral-700 text-neutral-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30'
              }`}
            >
              {designs.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.barcode}) &bull; Avg: {d.averageWeightPerPiece}g/pc
                </option>
              ))}
            </select>

            {/* Design Details Card */}
            {selectedDesign && (
              <div
                className={`p-3 rounded-xl border flex items-center gap-3.5 transition-colors ${
                  isBright
                    ? 'bg-white border-[#E2E8F0] shadow-xs'
                    : 'bg-[#18181B] border-[#27272A]'
                }`}
              >
                <img
                  src={selectedDesign.photoUrl}
                  alt={selectedDesign.name}
                  className={`w-14 h-14 rounded-xl object-cover border shrink-0 ${
                    isBright ? 'border-[#E2E8F0]' : 'border-neutral-700'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`font-semibold text-sm truncate ${
                        isBright ? 'text-[#0F172A]' : 'text-white'
                      }`}
                    >
                      {selectedDesign.name}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-semibold border ${
                        isBright
                          ? 'bg-slate-100 text-slate-700 border-slate-200'
                          : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                      }`}
                    >
                      {selectedDesign.barcode}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs">
                    <span
                      className={`flex items-center gap-1 font-semibold ${
                        isBright ? 'text-amber-800' : 'text-amber-400'
                      }`}
                    >
                      <Scale className="w-3.5 h-3.5" />
                      Baseline: {selectedDesign.averageWeightPerPiece} g/pc
                    </span>
                    <span
                      className={`text-[11px] ${
                        isBright ? 'text-[#64748B]' : 'text-neutral-400'
                      }`}
                    >
                      Code: {selectedDesign.orderRef || 'Standard Batch'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Quantity & Weight Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Initial Pieces */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  className={`text-xs font-semibold uppercase tracking-wider ${
                    isBright ? 'text-[#3F3F46]' : 'text-neutral-300'
                  }`}
                >
                  Pieces Count <span className="text-amber-500">*</span>
                </label>
                <span
                  className={`text-[11px] font-mono ${
                    isBright ? 'text-[#64748B]' : 'text-neutral-400'
                  }`}
                >
                  Units
                </span>
              </div>
              <input
                type="number"
                min="1"
                required
                value={initialPieces}
                onChange={(e) => {
                  setInitialPieces(e.target.value);
                  setIsWeightManuallyEdited(false);
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl border font-mono text-sm font-semibold outline-none transition ${
                  isBright
                    ? 'bg-[#F8FAFC] border-[#CBD5E1] text-[#0F172A] focus:border-amber-600 focus:bg-white focus:ring-1 focus:ring-amber-500/30'
                    : 'bg-[#121214] border-neutral-700 text-neutral-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30'
                }`}
              />
              {/* Quick Stepper Chips */}
              <div className="flex items-center gap-1.5 mt-2">
                {[100, 200, 500].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handlePiecesQuickSelect(preset, true)}
                    className={`px-2 py-1 text-[11px] rounded-lg font-mono font-medium transition border ${
                      parseInt(initialPieces, 10) === preset
                        ? isBright
                          ? 'bg-[#0F172A] text-white border-[#0F172A]'
                          : 'bg-amber-400 text-neutral-950 border-amber-400 font-bold'
                        : isBright
                        ? 'bg-white hover:bg-slate-100 text-[#475569] border-[#CBD5E1]'
                        : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-neutral-700'
                    }`}
                  >
                    {preset} pcs
                  </button>
                ))}
              </div>
            </div>

            {/* Initial Weight */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  className={`text-xs font-semibold uppercase tracking-wider ${
                    isBright ? 'text-[#3F3F46]' : 'text-neutral-300'
                  }`}
                >
                  Initial Weight (g) <span className="text-amber-500">*</span>
                </label>
                {isWeightManuallyEdited && (
                  <button
                    type="button"
                    onClick={handleResetWeightToBaseline}
                    className={`text-[10px] underline font-medium ${
                      isBright
                        ? 'text-amber-700 hover:text-amber-900'
                        : 'text-amber-400 hover:text-amber-300'
                    }`}
                  >
                    Reset to baseline
                  </button>
                )}
              </div>
              <input
                type="number"
                step="0.01"
                min="0.1"
                required
                value={initialWeight}
                onChange={(e) => {
                  setInitialWeight(e.target.value);
                  setIsWeightManuallyEdited(true);
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl border font-mono text-sm font-semibold outline-none transition ${
                  isBright
                    ? 'bg-[#F8FAFC] border-[#CBD5E1] text-[#0F172A] focus:border-amber-600 focus:bg-white focus:ring-1 focus:ring-amber-500/30'
                    : 'bg-[#121214] border-neutral-700 text-neutral-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30'
                }`}
              />
              <div className="mt-2 text-[11px] flex items-center justify-between">
                <span
                  className={
                    isBright ? 'text-[#64748B]' : 'text-neutral-400'
                  }
                >
                  Ratio:
                </span>
                {computedEffectiveAvgWeight && (
                  <span
                    className={`font-mono font-semibold ${
                      isBright ? 'text-[#1E293B]' : 'text-neutral-200'
                    }`}
                  >
                    ~{computedEffectiveAvgWeight} g / pc
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Section 4: Artisan (Karigar) Assignment */}
          <div
            className={`p-4 rounded-2xl border transition-colors space-y-3 ${
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
                Assign Starting Karigar ({startingStage}){' '}
                <span className="text-amber-500">*</span>
              </label>
              <span
                className={`text-[11px] font-medium flex items-center gap-1 ${
                  isBright ? 'text-[#64748B]' : 'text-neutral-400'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                Artisan Routing
              </span>
            </div>

            <select
              required
              value={karigarId}
              onChange={(e) => setKarigarId(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium outline-none transition ${
                isBright
                  ? 'bg-white border-[#CBD5E1] text-[#0F172A] focus:border-amber-600 focus:ring-1 focus:ring-amber-500/30'
                  : 'bg-neutral-900 border-neutral-700 text-neutral-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30'
              }`}
            >
              <option value="">Select Karigar...</option>
              {karigars.map((k) => {
                const specializes = k.specialtyStages.includes(startingStage);
                return (
                  <option key={k.id} value={k.id}>
                    {k.name} ({k.phone}) {specializes ? '⭐ [Recommended for ' + startingStage + ']' : ''}
                  </option>
                );
              })}
            </select>

            {selectedKarigar && (
              <div
                className={`px-3 py-2 rounded-xl text-xs flex items-center justify-between ${
                  isBright
                    ? 'bg-white border border-[#E2E8F0] text-[#334155]'
                    : 'bg-[#18181B] border border-[#27272A] text-neutral-300'
                }`}
              >
                <span className="font-medium">
                  Specialties: {selectedKarigar.specialtyStages.join(', ')}
                </span>
                <span
                  className={`font-mono text-[11px] ${
                    isBright ? 'text-[#64748B]' : 'text-neutral-400'
                  }`}
                >
                  Ph: {selectedKarigar.phone}
                </span>
              </div>
            )}
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
              className="px-5 py-2.5 text-xs font-bold rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-neutral-950 shadow-md shadow-amber-500/20 transition flex items-center gap-2"
            >
              <Package className="w-4 h-4" />
              <span>Create Lot &amp; Generate Slip</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

