import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuthAndTheme } from '../context/AuthAndThemeContext';
import { SearchableSelect } from './SearchableSelect';
import { Lot, Stage } from '../types';
import { calculateJobWorkAmount, rateUnitLabel } from '../utils/stagePricing';
import {
  X,
  Boxes,
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
  onSuccess: (lot: Lot) => void;
  preselectedDesignId?: string;
  editingLot?: Lot;
}

export const CreateLotModal: React.FC<CreateLotModalProps> = ({
  onClose,
  onSuccess,
  preselectedDesignId,
  editingLot,
}) => {
  const { designs, karigars, createLot, editLot, lots, recalibrateDesign } = useApp();
  const { theme } = useAuthAndTheme();
  const isBright = theme === 'bright';

  const generateRandomLotNumber = () =>
    `LOT-${Math.floor(1000 + Math.random() * 9000)}`;

  const [lotNumber, setLotNumber] = useState<string>(editingLot?.lotNumber ?? generateRandomLotNumber());
  const [designId, setDesignId] = useState<string>(editingLot?.designId ?? preselectedDesignId ?? designs[0]?.id ?? '');
  const [initialWeight, setInitialWeight] = useState<string>('');
  const [orderedQuantity, setOrderedQuantity] = useState<string>(String(editingLot?.history.find((record) => record.stage === 'Wax')?.orderedQuantity ?? ''));
  const [samplePieces, setSamplePieces] = useState<string>('200');
  const [sampleWeight, setSampleWeight] = useState<string>('');
  const [rulerOverride, setRulerOverride] = useState<string | null>(null);
  const [piecesOverride, setPiecesOverride] = useState<string | null>(null);
  const startingStage: Stage = 'Wax';
  const [statedPieces, setStatedPieces] = useState<string>('');
  const [karigarId, setKarigarId] = useState<string>(editingLot?.currentKarigarId ?? '');
  const [jobWorkRate, setJobWorkRate] = useState<string>(String(editingLot?.history[editingLot.history.length - 1]?.jobWorkRate ?? ''));
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedDesign = designs.find((d) => d.id === designId);
  const selectedKarigar = karigars.find((k) => k.id === karigarId);
  const existingRuler = selectedDesign ? Number(selectedDesign.waxAvgWeightPerPiece) || 0 : 0;
  const samplePieceCount = parseInt(samplePieces, 10) || 0;
  const sampleWeightGrams = parseFloat(sampleWeight) || 0;
  const sampleRuler = samplePieceCount > 0 && sampleWeightGrams > 0
    ? sampleWeightGrams / samplePieceCount
    : 0;
  const designRuler = existingRuler > 0 ? existingRuler : sampleRuler;
  const activeRuler = rulerOverride === null ? designRuler : Number(rulerOverride);
  const hasWaxReceipt = initialWeight.trim().length > 0;
  const initialWeightGrams = parseFloat(initialWeight) || 0;
  const calculatedPieces = initialWeightGrams > 0 && activeRuler > 0
    ? Math.round(initialWeightGrams / activeRuler)
    : 0;
  const enteredPieces = piecesOverride === null ? calculatedPieces : Number(piecesOverride);
  const initialPieces = Number.isInteger(enteredPieces) && enteredPieces > 0 ? enteredPieces : 0;
  const needsCalibration = Boolean(selectedDesign) && existingRuler <= 0;
  const statedPieceCount = parseInt(statedPieces, 10) || 0;
  const orderedPieceCount = parseInt(orderedQuantity, 10) || 0;
  const orderedDifference = orderedPieceCount - initialPieces;
  const discrepancyGrams = activeRuler > 0 && statedPieceCount > 0
    ? Math.abs(initialWeightGrams - statedPieceCount * activeRuler)
    : 0;
  const hasDiscrepancy = activeRuler > 0 && statedPieceCount > 0 &&
    (discrepancyGrams > 2 || Math.abs(initialPieces - statedPieceCount) > Math.max(3, initialPieces * 0.03));

  useEffect(() => {
    setSamplePieces('200');
    setSampleWeight('');
    setRulerOverride(null);
    setPiecesOverride(null);
  }, [designId]);

  // Set default karigar specializing in starting stage
  useEffect(() => {
    const candidate =
      karigars.find((k) => k.specialtyStages.includes(startingStage)) ||
      karigars[0];
    if (candidate) {
      setKarigarId(candidate.id);
    }
  }, [karigars]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedLotNumber = lotNumber.trim().toUpperCase();
    if (!trimmedLotNumber) {
      setError('Please provide a valid Lot number.');
      return;
    }
    if (lots.some((l) => l.id !== editingLot?.id && l.lotNumber.toUpperCase() === trimmedLotNumber)) {
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
    if (orderedPieceCount <= 0) {
      setError('Enter the quantity originally ordered from the Wax karigar.');
      return;
    }

    const rate = parseFloat(jobWorkRate);
    if (!Number.isFinite(rate) || rate < 0) {
      setError('Enter the Wax job-work rate per piece. Use 0 if there is no charge.');
      return;
    }

    const weight = hasWaxReceipt ? parseFloat(initialWeight) : 0;

    if (hasWaxReceipt && (!Number.isFinite(weight) || weight <= 0)) {
      setError('Wax received weight must be a positive number greater than 0.');
      return;
    }
    if (!hasWaxReceipt && statedPieces.trim()) {
      setError('Enter the received weight before entering the karigar’s stated pieces, or leave both blank to save an outstanding Wax order.');
      return;
    }
    if (hasWaxReceipt && needsCalibration && (!samplePieceCount || !sampleWeightGrams || sampleRuler <= 0)) {
      setError('This design has no Wax ruler yet. Enter the weight and piece count of a small representative sample to calibrate it.');
      return;
    }
    if (hasWaxReceipt && (!Number.isFinite(activeRuler) || activeRuler <= 0)) {
      setError('Enter a valid Wax weight per piece greater than 0.');
      return;
    }
    if (hasWaxReceipt && initialPieces <= 0) {
      setError('Enter a valid whole-number estimate of Wax pieces received.');
      return;
    }
    if (hasWaxReceipt && statedPieceCount <= 0) {
      setError('Enter the piece count stated by the Wax karigar on the slip.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (hasWaxReceipt && needsCalibration && selectedDesign) {
        await recalibrateDesign(
          selectedDesign.id,
          'wax',
          sampleRuler
        );
      }
      const lotData = {
        lotNumber: trimmedLotNumber,
        designId,
        initialPieces,
        initialWeight: weight,
        waxWeightPerPieceUsed: hasWaxReceipt ? activeRuler : undefined,
        orderedQuantity: orderedPieceCount,
        karigarId,
        jobWorkRate: Number(rate.toFixed(2)),
        hasWaxReceipt,
        statedPieces: statedPieceCount,
        hasDiscrepancy,
        discrepancyGramsDiff: Number(discrepancyGrams.toFixed(2)),
      };
      const newLot = editingLot
        ? await editLot(editingLot.id, { lotNumber: trimmedLotNumber, designId, karigarId, orderedQuantity: orderedPieceCount, jobWorkRate: Number(rate.toFixed(2)) })
        : await createLot(lotData);
      onSuccess(newLot);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create lot in Supabase.');
    } finally {
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
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h3
                className={`font-bold text-base sm:text-lg tracking-tight ${
                  isBright ? 'text-[#18181B]' : 'text-white'
                }`}
              >
                {editingLot ? 'Edit Lot' : 'Create Lot'}
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

          {/* Section 1: Lot Identity — production always starts at Wax */}
          <div className="grid grid-cols-1 gap-4">
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
                  value={lotNumber}
                  onChange={(e) => setLotNumber(e.target.value.toUpperCase())}
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

            <SearchableSelect
              value={designId}
              onChange={setDesignId}
              bright={isBright}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium outline-none transition ${
                isBright
                  ? 'bg-white border-[#CBD5E1] text-[#0F172A] focus:border-amber-600 focus:ring-1 focus:ring-amber-500/30'
                  : 'bg-neutral-900 border-neutral-700 text-neutral-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30'
              }`}
              options={designs.map((d) => ({ value: d.id, label: `${d.name} (${d.barcode})` }))}
            />

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

          {/* Section 3: Total batch weight and ruler-based piece estimate */}
          <div className="space-y-4">
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isBright ? 'text-[#3F3F46]' : 'text-neutral-300'}`}>
                Ordered Quantity <span className="text-amber-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={orderedQuantity}
                onChange={(event) => setOrderedQuantity(event.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border font-mono text-sm font-semibold outline-none transition ${isBright ? 'bg-[#F8FAFC] border-[#CBD5E1] text-[#0F172A] focus:border-amber-600' : 'bg-[#121214] border-neutral-700 text-neutral-100 focus:border-amber-500'}`}
              />
              <p className={`mt-1.5 text-[10px] ${isBright ? 'text-slate-500' : 'text-neutral-500'}`}>
                This is the requested quantity, not a manual count of the received lot.
              </p>
            </div>

            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isBright ? 'text-[#3F3F46]' : 'text-neutral-300'}`}>
                Total Wax Received Weight (g) <span className={isBright ? 'text-slate-400' : 'text-neutral-500'}>— optional</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                value={initialWeight}
                onChange={(e) => setInitialWeight(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border font-mono text-sm font-semibold outline-none transition ${isBright ? 'bg-[#F8FAFC] border-[#CBD5E1] text-[#0F172A] focus:border-amber-600 focus:bg-white focus:ring-1 focus:ring-amber-500/30' : 'bg-[#121214] border-neutral-700 text-neutral-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30'}`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isBright ? 'text-[#3F3F46]' : 'text-neutral-300'}`}>
                Wax Karigar’s Stated Pieces <span className={isBright ? 'text-slate-400' : 'text-neutral-500'}>— optional until receipt</span>
              </label>
              <input type="number" min="1" step="1" value={statedPieces} onChange={(e) => setStatedPieces(e.target.value)} className={`w-full px-3.5 py-2.5 rounded-xl border font-mono text-sm font-semibold outline-none transition ${isBright ? 'bg-[#F8FAFC] border-[#CBD5E1] text-[#0F172A] focus:border-amber-600' : 'bg-[#121214] border-neutral-700 text-neutral-100 focus:border-amber-500'}`} />
              {statedPieceCount > 0 && initialPieces > 0 && <p className={`mt-2 text-xs ${hasDiscrepancy ? 'text-amber-500' : isBright ? 'text-emerald-700' : 'text-emerald-300'}`}>
                Ordered {orderedPieceCount || '—'} pcs · karigar stated {statedPieceCount} pcs · weight estimate {initialPieces} pcs{orderedPieceCount > 0 ? orderedDifference > 0 ? ` · short by ${orderedDifference}` : orderedDifference < 0 ? ` · extra ${Math.abs(orderedDifference)}` : ' · exact ordered quantity' : ''}{hasDiscrepancy ? ` · discrepancy warning (${discrepancyGrams.toFixed(2)} g)` : ' · stated count is within the expected range'}
              </p>}
            </div>

            {hasWaxReceipt && needsCalibration && (
              <div className={`p-4 rounded-2xl border space-y-3 ${isBright ? 'bg-amber-50 border-amber-200' : 'bg-amber-950/30 border-amber-500/30'}`}>
                <div>
                  <h4 className={`text-xs font-bold uppercase tracking-wide ${isBright ? 'text-amber-900' : 'text-amber-300'}`}>
                    First {startingStage} Ruler Calibration
                  </h4>
                  <p className={`text-xs mt-1 ${isBright ? 'text-amber-900/80' : 'text-amber-200/80'}`}>
                    No {startingStage} ruler exists for this design yet. Weigh and count a small representative sample only — not the whole lot.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className={`text-xs font-semibold ${isBright ? 'text-[#3F3F46]' : 'text-neutral-300'}`}>
                    Sample Piece Count
                    <input type="number" min="1" step="1" value={samplePieces} onChange={(e) => setSamplePieces(e.target.value)} className={`mt-1 w-full px-3 py-2 rounded-lg border font-mono ${isBright ? 'bg-white border-[#CBD5E1] text-[#0F172A]' : 'bg-neutral-900 border-neutral-700 text-neutral-100'}`} />
                  </label>
                  <label className={`text-xs font-semibold ${isBright ? 'text-[#3F3F46]' : 'text-neutral-300'}`}>
                    Sample Weight (g)
                    <input type="number" min="0.01" step="0.01" value={sampleWeight} onChange={(e) => setSampleWeight(e.target.value)} className={`mt-1 w-full px-3 py-2 rounded-lg border font-mono ${isBright ? 'bg-white border-[#CBD5E1] text-[#0F172A]' : 'bg-neutral-900 border-neutral-700 text-neutral-100'}`} />
                  </label>
                </div>
                {sampleRuler > 0 && <p className={`text-xs font-mono ${isBright ? 'text-amber-900' : 'text-amber-200'}`}>Ruler: {sampleWeightGrams} g ÷ {samplePieceCount} pcs = {sampleRuler.toFixed(4)} g/pc</p>}
              </div>
            )}

            <div className={`p-3 rounded-xl border space-y-3 ${isBright ? 'bg-emerald-50 border-emerald-200' : 'bg-emerald-950/20 border-emerald-800/50'}`}>
              <div>
                <p className={`text-xs font-semibold ${isBright ? 'text-emerald-900' : 'text-emerald-300'}`}>Wax receipt estimate for this lot</p>
                <p className={`text-[10px] mt-0.5 ${isBright ? 'text-emerald-800/80' : 'text-emerald-200/70'}`}>
                  Starts from this design’s saved weight per piece. Changes here apply only to this lot.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className={`text-xs font-semibold ${isBright ? 'text-emerald-900' : 'text-emerald-300'}`}>
                  Wax weight per piece (g)
                  <input
                    type="number"
                    min="0.0001"
                    step="any"
                    disabled={!hasWaxReceipt}
                    value={rulerOverride ?? (designRuler > 0 ? String(designRuler) : '')}
                    onChange={(event) => { setRulerOverride(event.target.value); setPiecesOverride(null); }}
                    className={`mt-1 w-full rounded-lg border px-3 py-2 font-mono text-sm outline-none disabled:opacity-60 ${isBright ? 'bg-white border-emerald-300 text-emerald-950' : 'bg-neutral-900 border-emerald-800 text-emerald-100'}`}
                  />
                </label>
                <label className={`text-xs font-semibold ${isBright ? 'text-emerald-900' : 'text-emerald-300'}`}>
                  Estimated pieces received
                  <input
                    type="number"
                    min="1"
                    step="1"
                    disabled={!hasWaxReceipt}
                    value={piecesOverride ?? (calculatedPieces > 0 ? String(calculatedPieces) : '')}
                    onChange={(event) => setPiecesOverride(event.target.value)}
                    className={`mt-1 w-full rounded-lg border px-3 py-2 font-mono text-sm outline-none disabled:opacity-60 ${isBright ? 'bg-white border-emerald-300 text-emerald-950' : 'bg-neutral-900 border-emerald-800 text-emerald-100'}`}
                  />
                </label>
              </div>
              <p className={`text-[10px] ${isBright ? 'text-emerald-800/80' : 'text-emerald-200/70'}`}>
                {hasWaxReceipt && activeRuler > 0
                  ? `${initialWeightGrams} g ÷ ${activeRuler.toFixed(4)} g/pc = ${calculatedPieces} pcs${piecesOverride !== null ? ' · piece count adjusted for this lot' : ''}`
                  : 'Enter the total received weight to calculate and edit this lot’s estimate.'}
              </p>
              {(rulerOverride !== null || piecesOverride !== null) && (
                <button type="button" onClick={() => { setRulerOverride(null); setPiecesOverride(null); }} className={`text-[11px] font-semibold underline ${isBright ? 'text-emerald-800' : 'text-emerald-300'}`}>
                  Reset to design estimate
                </button>
              )}
              {orderedPieceCount > 0 && initialPieces > 0 && (
                <div className={`mt-3 pt-2.5 border-t flex items-center justify-between text-xs ${isBright ? 'border-emerald-200 text-emerald-900' : 'border-emerald-800/60 text-emerald-200'}`}>
                  <span>Ordered: <strong className="font-mono">{orderedPieceCount} pcs</strong></span>
                  <span className={`font-bold font-mono ${orderedDifference > 0 ? 'text-amber-500' : orderedDifference < 0 ? 'text-blue-500' : 'text-emerald-500'}`}>
                    {orderedDifference > 0 ? `Short by ${orderedDifference}` : orderedDifference < 0 ? `Extra ${Math.abs(orderedDifference)}` : 'Exact quantity'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Karigar Assignment */}
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
                Wax Received From{' '}
                <span className="text-amber-500">*</span>
              </label>
              <span
                className={`text-[11px] font-medium flex items-center gap-1 ${
                  isBright ? 'text-[#64748B]' : 'text-neutral-400'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                Karigar Routing
              </span>
            </div>

            <SearchableSelect
              value={karigarId}
              onChange={setKarigarId}
              bright={isBright}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium outline-none transition ${
                isBright
                  ? 'bg-white border-[#CBD5E1] text-[#0F172A] focus:border-amber-600 focus:ring-1 focus:ring-amber-500/30'
                  : 'bg-neutral-900 border-neutral-700 text-neutral-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30'
              }`}
              options={[
                { value: '', label: 'Select Karigar...' },
                ...karigars.map((k) => {
                  const specializes = k.specialtyStages.includes(startingStage);
                  return {
                    value: k.id,
                    label: `${k.name}${k.phone ? ` (${k.phone})` : ''} ${specializes ? `⭐ [Recommended for ${startingStage}]` : ''}`,
                  };
                }),
              ]}
            />

            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isBright ? 'text-[#3F3F46]' : 'text-neutral-300'}`}>
                Wax Rate ({rateUnitLabel('per_piece')}) <span className="text-amber-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={jobWorkRate}
                onChange={(event) => setJobWorkRate(event.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border font-mono text-sm font-semibold outline-none transition ${isBright ? 'bg-white border-[#CBD5E1] text-[#0F172A] focus:border-amber-600' : 'bg-neutral-900 border-neutral-700 text-neutral-100 focus:border-amber-500'}`}
              />
              <p className={`mt-1 text-[11px] ${isBright ? 'text-[#64748B]' : 'text-neutral-500'}`}>
                {hasWaxReceipt
                  ? `Estimated total: ₹${calculateJobWorkAmount(Number(jobWorkRate) || 0, 'per_piece', initialPieces).toLocaleString('en-IN')}`
                  : `Expected total on ${orderedPieceCount || 0} ordered pieces: ₹${calculateJobWorkAmount(Number(jobWorkRate) || 0, 'per_piece', orderedPieceCount).toLocaleString('en-IN')}. It will update from the actual Wax receipt.`}
              </p>
            </div>

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
                {selectedKarigar.phone && (
                  <span
                    className={`font-mono text-[11px] ${
                      isBright ? 'text-[#64748B]' : 'text-neutral-400'
                    }`}
                  >
                    Mobile: {selectedKarigar.phone}
                  </span>
                )}
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
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-bold rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-neutral-950 shadow-md shadow-amber-500/20 transition flex items-center gap-2 disabled:opacity-60 disabled:cursor-wait"
            >
              {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
              <span>{isSubmitting ? 'Saving Lot…' : editingLot ? 'Save Lot Changes' : hasWaxReceipt ? 'Create Lot & Generate Receipt Slip' : 'Create Lot — Await Wax Receipt'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
