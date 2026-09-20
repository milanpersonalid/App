import React, { useState, useMemo } from 'react';
import { Lot, Design } from '../types';
import { useApp } from '../context/AppContext';
import { useAuthAndTheme } from '../context/AuthAndThemeContext';
import { AlertTriangle, CheckCircle2, Scale, Calculator, RefreshCw, X, GitBranch } from 'lucide-react';
import {
  getStageAvgWeight,
  getStageWeightLabel,
  isWeightEstimationApplicable,
  getDefaultCalibrationTarget,
  CalibrationTarget,
} from '../utils/stageWeights';

interface Step6DataEntryModalProps {
  lot: Lot;
  design: Design;
  onClose: () => void;
  onSuccess: (updatedLot: Lot) => void;
}

export const Step6DataEntryModal: React.FC<Step6DataEntryModalProps> = ({
  lot,
  design,
  onClose,
  onSuccess,
}) => {
  const { completeStageDataEntry } = useApp();
  const { theme } = useAuthAndTheme();
  const isBright = theme === 'bright';

  const isChholStage = lot.currentStage === 'Chhol';
  const [chholBranch, setChholBranch] = useState<'plain' | 'gold'>(
    lot.branch === 'gold' ? 'gold' : 'plain'
  );

  const effectiveBranch = isChholStage ? chholBranch : lot.branch;
  const currentRecord = lot.history[lot.history.length - 1];
  const weightSent = currentRecord?.weightSent ?? lot.initialWeight;
  const piecesSent = currentRecord?.piecesSent ?? lot.initialPieces;
  
  // Specific stage average weight
  const avgWeightPerPiece = getStageAvgWeight(design, lot.currentStage, effectiveBranch);
  const stageWeightLabel = getStageWeightLabel(lot.currentStage, effectiveBranch);
  const canEstimateByWeight = isWeightEstimationApplicable(lot.currentStage);

  // Step 6 Inputs
  // 1. Total weight received (grams)
  const [weightReceivedInput, setWeightReceivedInput] = useState<string>('');
  // 3. Karigar's stated pieces
  const [statedPiecesInput, setStatedPiecesInput] = useState<string>('');
  // 5. Rejected pieces (manual entry)
  const [rejectedPiecesInput, setRejectedPiecesInput] = useState<string>('0');

  // 7. Recalibration Control
  const defaultTarget = getDefaultCalibrationTarget(lot.currentStage, effectiveBranch);
  const [calibrationTarget, setCalibrationTarget] = useState<CalibrationTarget>(defaultTarget);
  const [enableRecalibration, setEnableRecalibration] = useState<boolean>(false);
  const [actualCountedWeight, setActualCountedWeight] = useState<string>('');
  const [actualCountedPieces, setActualCountedPieces] = useState<string>('');

  const [error, setError] = useState<string>('');

  // Calculations
  const weightReceived = parseFloat(weightReceivedInput) || 0;
  const statedPieces = parseInt(statedPiecesInput, 10) || 0;
  const rejectedPieces = parseInt(rejectedPiecesInput, 10) || 0;

  // Auto-calculated Estimated pieces = Weight received ÷ Average weight per piece (skipped at Chhol)
  const estimatedPieces = useMemo(() => {
    if (!canEstimateByWeight || weightReceived <= 0 || avgWeightPerPiece <= 0) return 0;
    return Math.round(weightReceived / avgWeightPerPiece);
  }, [canEstimateByWeight, weightReceived, avgWeightPerPiece]);

  // Discrepancy warning logic
  const discrepancy = useMemo(() => {
    if (weightReceived <= 0 || !statedPiecesInput || statedPieces <= 0) {
      return { hasWarning: false, gramDiff: 0, pieceDiff: 0, message: '' };
    }

    if (canEstimateByWeight) {
      // Theoretical weight for stated pieces
      const theoreticalWeight = statedPieces * avgWeightPerPiece;
      const gramDiff = Math.abs(weightReceived - theoreticalWeight);
      const pieceDiff = Math.abs(estimatedPieces - statedPieces);

      // Tolerance: 1 to 2 grams natural variance is normal.
      // Warn if gramDiff > 2.0g OR piece difference > 3% / > 3 pieces
      const hasWarning = gramDiff > 2.0 || pieceDiff > Math.max(3, estimatedPieces * 0.03);

      return {
        hasWarning,
        gramDiff: Number(gramDiff.toFixed(2)),
        pieceDiff,
        theoreticalWeight: Number(theoreticalWeight.toFixed(2)),
        message: `Stated ${statedPieces} pcs deviates from estimated ${estimatedPieces} pcs by ${gramDiff.toFixed(2)}g (${pieceDiff} pcs difference).`,
      };
    } else {
      // Chhol stage: Pieces should match piecesSent minus rejects
      const expectedPieces = piecesSent - rejectedPieces;
      const pieceVariance = Math.abs(statedPieces - expectedPieces);
      const hasWarning = pieceVariance > 2;

      return {
        hasWarning,
        gramDiff: 0,
        pieceDiff: pieceVariance,
        theoreticalWeight: 0,
        message: `Stated ${statedPieces} pcs differs from expected ${expectedPieces} pcs (${piecesSent} sent - ${rejectedPieces} rejected). Material was filed off during Chhol.`,
      };
    }
  }, [canEstimateByWeight, weightReceived, statedPiecesInput, statedPieces, avgWeightPerPiece, estimatedPieces, piecesSent, rejectedPieces]);

  // Weight loss & Loss %
  const weightLoss = useMemo(() => {
    if (weightReceived <= 0) return 0;
    return Number(Math.max(0, weightSent - weightReceived).toFixed(3));
  }, [weightSent, weightReceived]);

  const lossPercentage = useMemo(() => {
    if (weightSent <= 0 || weightReceived <= 0) return 0;
    return Number(((weightLoss / weightSent) * 100).toFixed(2));
  }, [weightLoss, weightSent, weightReceived]);

  // Recalibrated Average Weight
  const calculatedRecalibratedWeight = useMemo(() => {
    const countedW = parseFloat(actualCountedWeight);
    const countedP = parseInt(actualCountedPieces, 10);
    if (countedW > 0 && countedP > 0) {
      return Number((countedW / countedP).toFixed(4));
    }
    return null;
  }, [actualCountedWeight, actualCountedPieces]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (weightReceived <= 0) {
      setError('Please enter a valid weight received in grams.');
      return;
    }
    if (!statedPiecesInput || statedPieces < 0) {
      setError("Please enter the karigar's stated pieces count from the slip.");
      return;
    }

    let newRecalibratedWeight: number | undefined = undefined;
    if (enableRecalibration) {
      if (!calculatedRecalibratedWeight) {
        setError('Please provide valid actual counted weight and pieces for recalibration.');
        return;
      }
      newRecalibratedWeight = calculatedRecalibratedWeight;
    }

    const res = completeStageDataEntry(lot.id, {
      weightReceived,
      statedPieces,
      rejectedPieces,
      recalibratedAvgWeight: newRecalibratedWeight,
      recalibrationTarget: enableRecalibration ? calibrationTarget : undefined,
      chholBranchTarget: isChholStage ? chholBranch : undefined,
    });

    if (res.success && res.lot) {
      onSuccess(res.lot);
    } else if (res.success) {
      onSuccess(lot);
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto overflow-x-hidden w-full max-w-full no-print">
      <div
        className={`relative w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden my-6 max-w-full transition-colors ${
          isBright
            ? 'bg-[#FFFFFF] border-[#D4D4D8] text-[#27272A]'
            : 'bg-[#292930] border-[#3F3F46] text-[#F4F4F6]'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4.5 border-b transition-colors ${
            isBright
              ? 'bg-[#F4F4F6] border-[#D4D4D8]'
              : 'bg-[#1E1E24] border-[#3F3F46]'
          }`}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                isBright
                  ? 'bg-[#FAF0ED] text-[#E07A5F] border-[#E8998D]/50'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}
            >
              <Scale className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <h3
                  className={`font-bold text-base tracking-tight ${
                    isBright ? 'text-[#27272A]' : 'text-neutral-100'
                  }`}
                >
                  Enter Stage Weight
                </h3>
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md border transition-colors ${
                    isBright
                      ? 'bg-[#FAF0ED] text-[#C85235] border-[#E8998D]/60'
                      : 'bg-neutral-800/90 text-amber-400 border-neutral-700/80'
                  }`}
                >
                  {lot.lotNumber}
                </span>
              </div>
              <div
                className={`flex items-center gap-2 mt-1 text-xs ${
                  isBright ? 'text-[#71717A]' : 'text-neutral-400'
                }`}
              >
                <span className={isBright ? 'text-[#27272A] font-medium' : 'text-neutral-200 font-medium'}>
                  {lot.currentStage}
                </span>
                <span className={isBright ? 'text-[#A1A1AA]' : 'text-neutral-600'}>&bull;</span>
                <span>
                  Karigar:{' '}
                  <strong className={isBright ? 'text-[#27272A] font-medium' : 'text-neutral-200 font-medium'}>
                    {lot.currentKarigarName}
                  </strong>
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors flex-shrink-0 ${
              isBright
                ? 'text-[#71717A] hover:text-[#27272A] hover:bg-[#EBEBEF]'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4.5">
          {error && (
            <div
              className={`p-3 text-xs rounded-xl border flex items-center gap-2 ${
                isBright
                  ? 'bg-red-50 border-red-200 text-red-700'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}
            >
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Baseline Sent Strip */}
          <div
            className={`grid grid-cols-3 gap-3 p-3 rounded-xl border text-center transition-colors ${
              isBright
                ? 'bg-[#F4F4F6] border-[#D4D4D8]'
                : 'bg-neutral-950/70 border-neutral-800/90'
            }`}
          >
            <div>
              <span
                className={`text-[11px] uppercase tracking-wider block mb-0.5 ${
                  isBright ? 'text-[#71717A]' : 'text-neutral-400'
                }`}
              >
                Sent Weight
              </span>
              <span
                className={`font-mono font-bold text-sm ${
                  isBright ? 'text-[#27272A]' : 'text-neutral-100'
                }`}
              >
                {(weightSent ?? 0).toFixed(2)} g
              </span>
            </div>
            <div className={`border-x ${isBright ? 'border-[#D4D4D8]' : 'border-neutral-800'}`}>
              <span
                className={`text-[11px] uppercase tracking-wider block mb-0.5 ${
                  isBright ? 'text-[#71717A]' : 'text-neutral-400'
                }`}
              >
                Sent Pieces
              </span>
              <span
                className={`font-mono font-bold text-sm ${
                  isBright ? 'text-[#27272A]' : 'text-neutral-100'
                }`}
              >
                {piecesSent} pcs
              </span>
            </div>
            <div>
              <span
                className={`text-[11px] uppercase tracking-wider block mb-0.5 ${
                  isBright ? 'text-[#71717A]' : 'text-neutral-400'
                }`}
              >
                {stageWeightLabel}
              </span>
              <span
                className={`font-mono font-bold text-sm ${
                  isBright ? 'text-[#C85235]' : 'text-amber-400'
                }`}
              >
                {(avgWeightPerPiece || 1.5).toFixed(3)} g/pc
              </span>
            </div>
          </div>

          {/* Chhol Stage Branch Selector */}
          {isChholStage && (
            <div
              className={`p-3 rounded-xl border space-y-2 ${
                isBright ? 'bg-amber-50/70 border-amber-200' : 'bg-amber-500/10 border-amber-500/20'
              }`}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label
                  className={`text-xs font-semibold flex items-center gap-1.5 ${
                    isBright ? 'text-amber-950' : 'text-amber-300'
                  }`}
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  Destination Branch for this Lot:
                </label>
                <div className="inline-flex rounded-lg p-0.5 border border-amber-300/40 bg-black/10">
                  <button
                    type="button"
                    onClick={() => {
                      setChholBranch('plain');
                      setCalibrationTarget('plain');
                    }}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                      chholBranch === 'plain'
                        ? isBright ? 'bg-white text-slate-900 shadow-xs' : 'bg-neutral-800 text-amber-300 shadow-xs'
                        : isBright ? 'text-slate-600 hover:text-slate-900' : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    Plain Branch
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setChholBranch('gold');
                      setCalibrationTarget('gold');
                    }}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                      chholBranch === 'gold'
                        ? isBright ? 'bg-white text-slate-900 shadow-xs' : 'bg-neutral-800 text-amber-300 shadow-xs'
                        : isBright ? 'text-slate-600 hover:text-slate-900' : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    Gold Branch
                  </button>
                </div>
              </div>
              <p className={`text-[11px] leading-relaxed ${isBright ? 'text-amber-900/80' : 'text-amber-200/70'}`}>
                Material is removed during Chhol filing/grinding. Stage output will establish the baseline for the <strong>{chholBranch === 'plain' ? 'Plain' : 'Gold'}</strong> branch.
              </p>
            </div>
          )}

          {/* Core Entry Grid (2 Columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Weight Received */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={`text-xs font-semibold ${isBright ? 'text-[#27272A]' : 'text-neutral-200'}`}>
                  Weight Received (g) <span className={isBright ? 'text-[#E07A5F]' : 'text-amber-400'}>*</span>
                </label>
                {weightReceived > 0 && (
                  <span
                    className={`text-[10px] font-mono flex items-center gap-1 ${
                      isBright ? 'text-[#2A9D8F] font-semibold' : 'text-emerald-400'
                    }`}
                  >
                    <Calculator className="w-3 h-3" />
                    Est. ~{estimatedPieces} pcs
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 482.50"
                  value={weightReceivedInput}
                  onChange={(e) => setWeightReceivedInput(e.target.value)}
                  className={`w-full px-3.5 py-2 rounded-xl border font-mono text-sm outline-none transition ${
                    isBright
                      ? 'bg-[#FFFFFF] border-[#D4D4D8] text-[#27272A] placeholder-[#A1A1AA] focus:border-[#E07A5F] focus:ring-1 focus:ring-[#E07A5F]'
                      : 'bg-neutral-950 border-neutral-700/80 text-neutral-100 placeholder-neutral-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                  }`}
                />
                <span
                  className={`absolute right-3 top-2 text-xs font-mono ${
                    isBright ? 'text-[#71717A]' : 'text-neutral-500'
                  }`}
                >
                  g
                </span>
              </div>
            </div>

            {/* Karigar Stated Pieces */}
            <div>
              <label
                className={`block text-xs font-semibold mb-1 ${
                  isBright ? 'text-[#27272A]' : 'text-neutral-200'
                }`}
              >
                Stated Pieces (from slip) <span className={isBright ? 'text-[#E07A5F]' : 'text-amber-400'}>*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  placeholder="Count on slip"
                  value={statedPiecesInput}
                  onChange={(e) => setStatedPiecesInput(e.target.value)}
                  className={`w-full px-3.5 py-2 rounded-xl border font-mono text-sm outline-none transition ${
                    isBright
                      ? 'bg-[#FFFFFF] border-[#D4D4D8] text-[#27272A] placeholder-[#A1A1AA] focus:border-[#E07A5F] focus:ring-1 focus:ring-[#E07A5F]'
                      : 'bg-neutral-950 border-neutral-700/80 text-neutral-100 placeholder-neutral-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                  }`}
                />
                <span
                  className={`absolute right-3 top-2 text-xs font-mono ${
                    isBright ? 'text-[#71717A]' : 'text-neutral-500'
                  }`}
                >
                  pcs
                </span>
              </div>
            </div>

            {/* Rejected / Defective Pieces */}
            <div>
              <label
                className={`block text-xs font-semibold mb-1 ${
                  isBright ? 'text-[#27272A]' : 'text-neutral-200'
                }`}
              >
                Rejected / Defective (pcs)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={rejectedPiecesInput}
                  onChange={(e) => setRejectedPiecesInput(e.target.value)}
                  className={`w-full px-3.5 py-2 rounded-xl border font-mono text-sm outline-none transition ${
                    isBright
                      ? 'bg-[#FFFFFF] border-[#D4D4D8] text-[#27272A] placeholder-[#A1A1AA] focus:border-[#E07A5F] focus:ring-1 focus:ring-[#E07A5F]'
                      : 'bg-neutral-950 border-neutral-700/80 text-neutral-100 placeholder-neutral-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                  }`}
                />
                <span
                  className={`absolute right-3 top-2 text-xs font-mono ${
                    isBright ? 'text-[#71717A]' : 'text-neutral-500'
                  }`}
                >
                  pcs
                </span>
              </div>
            </div>

            {/* Stage Loss Summary */}
            <div
              className={`p-2.5 rounded-xl border flex flex-col justify-center transition-colors ${
                isBright
                  ? 'bg-[#F4F4F6] border-[#D4D4D8]'
                  : 'bg-neutral-950 border-neutral-800'
              }`}
            >
              <span
                className={`text-[10px] uppercase tracking-wider block mb-0.5 ${
                  isBright ? 'text-[#71717A]' : 'text-neutral-400'
                }`}
              >
                Stage Loss Summary
              </span>
              <div className="flex items-center justify-between text-xs">
                <span className={`font-mono ${isBright ? 'text-[#3F3F46]' : 'text-neutral-200'}`}>
                  Loss:{' '}
                  <strong className={isBright ? 'text-[#18181B]' : 'text-neutral-100'}>
                    {weightReceived > 0 ? `${weightLoss} g` : '—'}
                  </strong>
                </span>
                <span
                  className={`font-mono font-bold ${
                    lossPercentage > 2
                      ? isBright ? 'text-[#C85235]' : 'text-amber-400'
                      : isBright ? 'text-[#2A9D8F]' : 'text-emerald-400'
                  }`}
                >
                  {weightReceived > 0 ? `${lossPercentage}%` : '0%'}
                </span>
              </div>
            </div>
          </div>

          {/* Discrepancy Warning Notice */}
          {discrepancy.hasWarning && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                isBright
                  ? 'bg-[#FEF3C7] border-[#F59E0B] text-[#78350F]'
                  : 'bg-amber-950/40 border-amber-500/50 text-amber-200'
              }`}
            >
              <AlertTriangle
                className={`w-4 h-4 flex-shrink-0 mt-0.5 animate-pulse ${
                  isBright ? 'text-[#B45309]' : 'text-amber-400'
                }`}
              />
              <div className="min-w-0 text-[11px] leading-relaxed">
                <strong className={`font-semibold block ${isBright ? 'text-[#78350F]' : 'text-amber-300'}`}>
                  Piece / Weight Variance Detected
                </strong>
                {discrepancy.message}
              </div>
            </div>
          )}

          {/* Optional Baseline Recalibration Accordion */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setEnableRecalibration(!enableRecalibration)}
              className={`flex items-center gap-1.5 text-xs transition ${
                isBright ? 'text-[#71717A] hover:text-[#E07A5F]' : 'text-neutral-400 hover:text-amber-400'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{enableRecalibration ? 'Hide baseline recalibration' : '+ Recalibrate stage baseline weight (optional)'}</span>
            </button>

            {enableRecalibration && (
              <div
                className={`mt-2.5 p-3 rounded-xl border space-y-2.5 text-xs ${
                  isBright ? 'bg-[#F4F4F6] border-[#E07A5F]/40' : 'bg-neutral-950 border-amber-500/30'
                }`}
              >
                <div>
                  <label className={`block text-[10px] mb-1 font-semibold ${isBright ? 'text-[#71717A]' : 'text-neutral-400'}`}>
                    Target Calibration Point:
                  </label>
                  <select
                    value={calibrationTarget}
                    onChange={(e) => setCalibrationTarget(e.target.value as CalibrationTarget)}
                    className={`w-full px-2.5 py-1.5 rounded-lg border font-mono text-xs outline-none ${
                      isBright
                        ? 'bg-[#FFFFFF] border-[#D4D4D8] text-[#27272A]'
                        : 'bg-neutral-900 border-neutral-700 text-neutral-100'
                    }`}
                  >
                    <option value="wax">Wax Stage Baseline (waxAvgWeightPerPiece)</option>
                    <option value="metal">Metal / Post-Casting Baseline (metalAvgWeightPerPiece)</option>
                    <option value="plain">Post-Chhol Plain Baseline (plainAvgWeightPerPiece)</option>
                    <option value="gold">Post-Chhol Gold Baseline (goldAvgWeightPerPiece)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className={`block text-[10px] mb-1 ${isBright ? 'text-[#71717A]' : 'text-neutral-400'}`}>
                      Actual Counted Wt (g)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 152.0"
                      value={actualCountedWeight}
                      onChange={(e) => setActualCountedWeight(e.target.value)}
                      className={`w-full px-2.5 py-1.5 rounded-lg border font-mono text-xs outline-none ${
                        isBright
                          ? 'bg-[#FFFFFF] border-[#D4D4D8] text-[#27272A]'
                          : 'bg-neutral-900 border-neutral-700 text-neutral-100'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-[10px] mb-1 ${isBright ? 'text-[#71717A]' : 'text-neutral-400'}`}>
                      Actual Counted Pcs
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 100"
                      value={actualCountedPieces}
                      onChange={(e) => setActualCountedPieces(e.target.value)}
                      className={`w-full px-2.5 py-1.5 rounded-lg border font-mono text-xs outline-none ${
                        isBright
                          ? 'bg-[#FFFFFF] border-[#D4D4D8] text-[#27272A]'
                          : 'bg-neutral-900 border-neutral-700 text-neutral-100'
                      }`}
                    />
                  </div>
                </div>
                {calculatedRecalibratedWeight && (
                  <div className={`text-[11px] font-mono ${isBright ? 'text-[#C85235]' : 'text-amber-400'}`}>
                    New <strong className="uppercase">{calibrationTarget}</strong> baseline: <strong className="font-bold">{calculatedRecalibratedWeight} g/pc</strong> for {design.name}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className={`flex items-center justify-end gap-2.5 pt-2 border-t ${isBright ? 'border-[#D4D4D8]' : 'border-neutral-800'}`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-colors ${
                isBright
                  ? 'bg-[#F4F4F6] hover:bg-[#EBEBEF] text-[#27272A] border border-[#D4D4D8]'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl font-sans shadow-md active:scale-95 transition-all ${
                isBright
                  ? 'bg-[#E07A5F] hover:bg-[#C86349] text-white shadow-[#E07A5F]/20'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-emerald-500/20'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              Complete Stage &amp; Assign Artisan &rarr;
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
