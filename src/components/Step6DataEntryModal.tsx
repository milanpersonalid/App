import React, { useState, useMemo, useEffect } from 'react';
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
  const weightSent = currentRecord?.weightSent ?? lot.initialWeight ?? 0;
  const piecesSent = currentRecord?.piecesSent ?? lot.initialPieces ?? 0;

  // Specific stage ruler check:
  // When a lot reaches Chhol, check whether the design's ruler for the currently selected branch
  // (plainAvgWeightPerPiece for Plain, or goldAvgWeightPerPiece for Gold) is already set (> 0).
  const branchRuler = isChholStage
    ? (effectiveBranch === 'gold' ? design.goldAvgWeightPerPiece : design.plainAvgWeightPerPiece)
    : getStageAvgWeight(design, lot.currentStage, effectiveBranch);

  const isRulerSet = typeof branchRuler === 'number' && !isNaN(branchRuler) && branchRuler > 0;
  const isChholFirstTime = isChholStage && !isRulerSet;
  const stageWeightLabel = getStageWeightLabel(lot.currentStage, effectiveBranch);

  // Step 6 Inputs
  // 1. Total weight received (grams)
  const [weightReceivedInput, setWeightReceivedInput] = useState<string>('');
  // 2. Estimated pieces (auto-populated from weight ÷ ruler, but editable manually as a DB column)
  const [estimatedPiecesInput, setEstimatedPiecesInput] = useState<string>('');
  const [isEstimatedPiecesManual, setIsEstimatedPiecesManual] = useState<boolean>(false);
  // 3. Karigar's stated pieces (from physical slip)
  const [statedPiecesInput, setStatedPiecesInput] = useState<string>('');
  // 5. Rejected pieces (manual entry)
  const [rejectedPiecesInput, setRejectedPiecesInput] = useState<string>('0');

  // Recalibration / Calibration Control
  const defaultTarget = getDefaultCalibrationTarget(lot.currentStage, effectiveBranch);
  const [calibrationTarget, setCalibrationTarget] = useState<CalibrationTarget>(defaultTarget);
  const [enableRecalibration, setEnableRecalibration] = useState<boolean>(false);
  const [actualCountedWeight, setActualCountedWeight] = useState<string>('');
  const [actualCountedPieces, setActualCountedPieces] = useState<string>('');

  const [error, setError] = useState<string>('');

  // Sample calculated ruler from actual counted inputs
  const calculatedRecalibratedWeight = useMemo(() => {
    const countedW = parseFloat(actualCountedWeight);
    const countedP = parseInt(actualCountedPieces, 10);
    if (countedW > 0 && countedP > 0) {
      return Number((countedW / countedP).toFixed(4));
    }
    return null;
  }, [actualCountedWeight, actualCountedPieces]);

  // Active ruler used to automatically estimate the piece count:
  // - If first time at Chhol: derived from the mandatory sample entries
  // - If existing ruler exists: uses branchRuler (or optional recalibrated ruler if toggled)
  const activeRuler = useMemo(() => {
    if (isChholFirstTime) {
      return calculatedRecalibratedWeight || 0;
    }
    if (enableRecalibration && calculatedRecalibratedWeight) {
      return calculatedRecalibratedWeight;
    }
    return isRulerSet ? (branchRuler as number) : 0;
  }, [isChholFirstTime, calculatedRecalibratedWeight, enableRecalibration, isRulerSet, branchRuler]);

  // Calculations
  const weightReceived = parseFloat(weightReceivedInput) || 0;
  const statedPieces = parseInt(statedPiecesInput, 10) || 0;
  const rejectedPieces = parseInt(rejectedPiecesInput, 10) || 0;

  // Auto-calculated Estimated pieces = Weight received ÷ Active stage ruler
  const calculatedEstimatedPieces = useMemo(() => {
    if (weightReceived <= 0 || activeRuler <= 0) return 0;
    return Math.round(weightReceived / activeRuler);
  }, [weightReceived, activeRuler]);

  // Automatically populate estimatedPiecesInput when calculatedEstimatedPieces changes,
  // unless the admin has manually edited this value
  useEffect(() => {
    if (!isEstimatedPiecesManual) {
      if (calculatedEstimatedPieces > 0) {
        setEstimatedPiecesInput(String(calculatedEstimatedPieces));
      } else if (weightReceived <= 0) {
        setEstimatedPiecesInput('');
      }
    }
  }, [calculatedEstimatedPieces, isEstimatedPiecesManual, weightReceived]);

  const handleResetEstimatedToAuto = () => {
    setIsEstimatedPiecesManual(false);
    if (calculatedEstimatedPieces > 0) {
      setEstimatedPiecesInput(String(calculatedEstimatedPieces));
    } else {
      setEstimatedPiecesInput('');
    }
  };

  // Effective estimated pieces: prioritizes user manual entry, fallbacks to auto-calculated
  const estimatedPieces = useMemo(() => {
    const parsed = parseInt(estimatedPiecesInput, 10);
    if (!isNaN(parsed) && parsed >= 0) return parsed;
    return calculatedEstimatedPieces > 0 ? calculatedEstimatedPieces : 0;
  }, [estimatedPiecesInput, calculatedEstimatedPieces]);

  // Discrepancy warning logic: compares weight-estimated pieces vs karigar stated pieces
  const discrepancy = useMemo(() => {
    if (weightReceived <= 0 || !statedPiecesInput || statedPieces <= 0 || activeRuler <= 0) {
      return { hasWarning: false, gramDiff: 0, pieceDiff: 0, theoreticalWeight: 0, message: '' };
    }

    // Theoretical weight for stated pieces
    const theoreticalWeight = statedPieces * activeRuler;
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
  }, [weightReceived, statedPiecesInput, statedPieces, activeRuler, estimatedPieces]);

  // Weight loss & Loss %
  const weightLoss = useMemo(() => {
    if (weightReceived <= 0) return 0;
    return Number(Math.max(0, weightSent - weightReceived).toFixed(3));
  }, [weightSent, weightReceived]);

  const lossPercentage = useMemo(() => {
    if (weightSent <= 0 || weightReceived <= 0) return 0;
    return Number(((weightLoss / weightSent) * 100).toFixed(2));
  }, [weightLoss, weightSent, weightReceived]);

  // Pieces loss calculations (Physical inventory reconciliation)
  // Sent = Good Received (statedPieces) + Rejected + Missing
  // Missing Pieces = Sent Pieces - Stated Received Pieces - Rejected Pieces
  // Total Piece Loss = Missing Pieces + Rejected Pieces
  const hasStatedCount = statedPiecesInput.trim() !== '';

  // Pieces unaccounted for during karigar custody in this stage
  const missingPieces = useMemo(() => {
    if (!hasStatedCount) return 0;
    return Math.max(0, piecesSent - statedPieces - rejectedPieces);
  }, [hasStatedCount, piecesSent, statedPieces, rejectedPieces]);

  // Total lost pieces in this stage (missing/unreturned pieces + rejected/scrap pieces)
  const stageLostPieces = useMemo(() => {
    if (!hasStatedCount) return 0;
    return missingPieces + rejectedPieces;
  }, [hasStatedCount, missingPieces, rejectedPieces]);

  // Cumulative pieces lost in earlier completed stages of this lot
  const priorLostPieces = useMemo(() => {
    return Math.max(0, (lot.initialPieces ?? piecesSent) - piecesSent);
  }, [lot.initialPieces, piecesSent]);

  // Overall total pieces lost across the full lot lifecycle from initial launch
  const totalLotLostPieces = useMemo(() => {
    if (!hasStatedCount) return priorLostPieces;
    return priorLostPieces + stageLostPieces;
  }, [hasStatedCount, priorLostPieces, stageLostPieces]);

  const pieceLossPercentage = useMemo(() => {
    if (!hasStatedCount || piecesSent <= 0) return 0;
    return Number(((stageLostPieces / piecesSent) * 100).toFixed(1));
  }, [hasStatedCount, stageLostPieces, piecesSent]);

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

    // First-time Chhol validation: Mandatory sample calibration
    if (isChholFirstTime) {
      if (!calculatedRecalibratedWeight || calculatedRecalibratedWeight <= 0) {
        setError(
          `First-time calibration is mandatory for the ${effectiveBranch === 'gold' ? 'Gold' : 'Plain'} branch at Chhol. Please enter sample counted weight and pieces.`
        );
        return;
      }
    } else if (enableRecalibration) {
      if (!calculatedRecalibratedWeight || calculatedRecalibratedWeight <= 0) {
        setError('Please provide valid actual counted weight and pieces for recalibration.');
        return;
      }
    }

    const newRecalibratedWeight = isChholFirstTime
      ? calculatedRecalibratedWeight!
      : (enableRecalibration && calculatedRecalibratedWeight ? calculatedRecalibratedWeight : undefined);

    const targetCalibration = isChholFirstTime
      ? (effectiveBranch === 'gold' ? 'gold' : 'plain')
      : (enableRecalibration ? calibrationTarget : undefined);

    const finalEstimatedPieces = parseInt(estimatedPiecesInput, 10) || (calculatedEstimatedPieces > 0 ? calculatedEstimatedPieces : 0);

    const res = completeStageDataEntry(lot.id, {
      weightReceived,
      estimatedPieces: finalEstimatedPieces,
      statedPieces,
      rejectedPieces,
      recalibratedAvgWeight: newRecalibratedWeight,
      recalibrationTarget: targetCalibration,
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
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[60] flex items-start sm:items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto overflow-x-hidden w-full max-w-full no-print cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-xl my-auto rounded-2xl border shadow-2xl overflow-hidden max-h-[92vh] flex flex-col max-w-full cursor-default transition-colors ${
          isBright
            ? 'bg-[#FFFFFF] border-[#D4D4D8] text-[#27272A]'
            : 'bg-[#292930] border-[#3F3F46] text-[#F4F4F6]'
        }`}
      >
        {/* Header (Pinned at top) */}
        <div
          className={`flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b shrink-0 transition-colors ${
            isBright
              ? 'bg-[#F4F4F6] border-[#D4D4D8]'
              : 'bg-[#1E1E24] border-[#3F3F46]'
          }`}
        >
          <div className="flex items-center gap-3.5 min-w-0 flex-1 mr-2">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                isBright
                  ? 'bg-[#FAF0ED] text-[#E07A5F] border-[#E8998D]/50'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}
            >
              <Scale className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  className={`font-bold text-sm sm:text-base tracking-tight ${
                    isBright ? 'text-[#18181B]' : 'text-neutral-100'
                  }`}
                >
                  Enter Stage Weight
                </h3>
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md border shadow-2xs transition-colors ${
                    isBright
                      ? 'bg-amber-50 text-amber-900 border-amber-200'
                      : 'bg-amber-950/60 text-amber-300 border-amber-700/60'
                  }`}
                >
                  {lot.lotNumber}
                </span>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                    isBright
                      ? 'bg-slate-100 text-slate-700 border-slate-200'
                      : 'bg-neutral-800/80 text-neutral-300 border-neutral-700'
                  }`}
                >
                  {lot.currentStage}
                </span>
              </div>
              <div
                className={`flex items-center gap-2 mt-1 text-xs flex-wrap ${
                  isBright ? 'text-[#52525B]' : 'text-neutral-300'
                }`}
              >
                <span
                  className={`truncate max-w-[200px] sm:max-w-xs font-medium ${
                    isBright ? 'text-[#27272A]' : 'text-neutral-200'
                  }`}
                  title={design.name}
                >
                  {design.name}
                </span>
                <span className={isBright ? 'text-[#A1A1AA]' : 'text-neutral-500'}>&bull;</span>
                <span className="truncate">
                  Karigar:{' '}
                  <strong className={isBright ? 'text-[#18181B] font-semibold' : 'text-amber-300 font-semibold'}>
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

        {/* Form with scrollable body and pinned action footer */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Scrollable Form Body */}
          <div className="p-4 sm:p-6 space-y-4.5 overflow-y-auto overflow-x-hidden flex-1 min-h-0">
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
                {isChholFirstTime
                  ? calculatedRecalibratedWeight
                    ? `${calculatedRecalibratedWeight.toFixed(4)} g/pc (Sample)`
                    : 'Pending Sample'
                  : `${(branchRuler || 1.5).toFixed(3)} g/pc`}
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
            {/* Left Column: Weight Received & Weight-Based Estimated Pieces */}
            <div className="space-y-3.5">
              {/* Weight Received */}
              <div id="weight-received-section">
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="weight-received-input"
                    className={`text-xs font-semibold ${isBright ? 'text-[#27272A]' : 'text-neutral-200'}`}
                  >
                    Weight Received (g) <span className={isBright ? 'text-[#E07A5F]' : 'text-amber-400'}>*</span>
                  </label>
                  {weightReceived > 0 && activeRuler <= 0 && isChholFirstTime && (
                    <span
                      className={`text-[10px] font-mono font-medium flex items-center gap-1 ${
                        isBright ? 'text-[#C85235]' : 'text-amber-400'
                      }`}
                    >
                      <Calculator className="w-3 h-3" />
                      Enter sample below
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    id="weight-received-input"
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
                <p className={`text-[10px] mt-1 ${isBright ? 'text-slate-500' : 'text-neutral-400'}`}>
                  Total complete-load weight received on scale
                </p>
              </div>

              {/* Estimated Pieces (Weight-Based Database Column) - Positioned directly at the bottom of Weight Received */}
              <div id="estimated-pieces-section">
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="estimated-pieces-input"
                    className={`text-xs font-semibold flex items-center gap-1.5 ${
                      isBright ? 'text-[#27272A]' : 'text-neutral-200'
                    }`}
                  >
                    <Calculator className={`w-3.5 h-3.5 ${isBright ? 'text-[#2A9D8F]' : 'text-emerald-400'}`} />
                    Estimated Pieces (Database Column)
                  </label>
                  <div className="flex items-center gap-1.5">
                    {isEstimatedPiecesManual ? (
                      <span
                        className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded flex items-center gap-1 ${
                          isBright
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                        }`}
                      >
                        Manual Edit
                      </span>
                    ) : (
                      <span
                        className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded ${
                          estimatedPieces > 0
                            ? isBright
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                            : isBright
                              ? 'bg-slate-100 text-slate-500'
                              : 'bg-neutral-800 text-neutral-400'
                        }`}
                      >
                        Auto-populated
                      </span>
                    )}

                    {isEstimatedPiecesManual && calculatedEstimatedPieces > 0 && (
                      <button
                        type="button"
                        onClick={handleResetEstimatedToAuto}
                        title={`Reset to auto-calculated formula (${calculatedEstimatedPieces} pcs)`}
                        className={`text-[10px] font-mono flex items-center gap-1 px-1.5 py-0.5 rounded border transition ${
                          isBright
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                            : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-neutral-700'
                        }`}
                      >
                        <RefreshCw className="w-2.5 h-2.5" />
                        Auto ({calculatedEstimatedPieces})
                      </button>
                    )}
                  </div>
                </div>
                <div className="relative">
                  <input
                    id="estimated-pieces-input"
                    type="number"
                    min="0"
                    placeholder={activeRuler > 0 ? "e.g. 200" : "Awaiting ruler or enter manually"}
                    value={estimatedPiecesInput}
                    onChange={(e) => {
                      setEstimatedPiecesInput(e.target.value);
                      setIsEstimatedPiecesManual(true);
                    }}
                    className={`w-full px-3.5 py-2 rounded-xl border font-mono text-sm outline-none transition font-semibold ${
                      isEstimatedPiecesManual
                        ? isBright
                          ? 'bg-[#FFFBEB] border-[#FCD34D] text-[#92400E] focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-xs'
                          : 'bg-amber-950/20 border-amber-700/60 text-amber-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-xs'
                        : estimatedPieces > 0
                          ? isBright
                            ? 'bg-[#F0FDF4] border-[#86EFAC] text-[#166534] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-xs'
                            : 'bg-emerald-950/30 border-emerald-600/60 text-emerald-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-xs'
                          : isBright
                            ? 'bg-[#FFFFFF] border-[#D4D4D8] text-[#27272A] placeholder-[#A1A1AA] focus:border-[#E07A5F] focus:ring-1 focus:ring-[#E07A5F]'
                            : 'bg-neutral-950 border-neutral-700/80 text-neutral-100 placeholder-neutral-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                    }`}
                  />
                  <span
                    className={`absolute right-3 top-2 text-xs font-mono font-medium ${
                      isEstimatedPiecesManual
                        ? isBright ? 'text-[#92400E]' : 'text-amber-300'
                        : estimatedPieces > 0
                          ? isBright ? 'text-[#166534]' : 'text-emerald-400'
                          : isBright ? 'text-[#71717A]' : 'text-neutral-500'
                    }`}
                  >
                    pcs
                  </span>
                </div>
                {activeRuler > 0 ? (
                  <div className="flex items-center justify-between text-[10px] mt-1 font-mono">
                    <span className={isBright ? 'text-[#2A9D8F] font-medium' : 'text-emerald-400/90'}>
                      {weightReceived > 0
                        ? `Formula: ${weightReceived}g ÷ ${activeRuler.toFixed(3)}g/pc = ${calculatedEstimatedPieces} pcs`
                        : `Formula: Weight Received ÷ ${activeRuler.toFixed(3)}g/pc`}
                    </span>
                    <span className={isBright ? 'text-slate-500' : 'text-neutral-400'}>
                      {isEstimatedPiecesManual ? 'Manual override active' : 'Saved to database'}
                    </span>
                  </div>
                ) : (
                  <p className={`text-[10px] mt-1 ${isBright ? 'text-amber-700' : 'text-amber-400'}`}>
                    Enter manual pieces or calibrate sample below to establish ruler
                  </p>
                )}
              </div>
            </div>

            {/* Right Column: Karigar Stated Pieces & Rejected / Defective Pieces */}
            <div className="space-y-3.5">
              {/* Karigar Stated Pieces */}
              <div id="stated-pieces-section">
                <label
                  htmlFor="stated-pieces-input"
                  className={`block text-xs font-semibold mb-1 ${
                    isBright ? 'text-[#27272A]' : 'text-neutral-200'
                  }`}
                >
                  Stated Pieces (from slip) <span className={isBright ? 'text-[#E07A5F]' : 'text-amber-400'}>*</span>
                </label>
                <div className="relative">
                  <input
                    id="stated-pieces-input"
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
                <p className={`text-[10px] mt-1 ${isBright ? 'text-slate-500' : 'text-neutral-400'}`}>
                  Count written by karigar on physical slip
                </p>
              </div>

              {/* Rejected / Defective Pieces */}
              <div id="rejected-pieces-section">
                <label
                  htmlFor="rejected-pieces-input"
                  className={`block text-xs font-semibold mb-1 ${
                    isBright ? 'text-[#27272A]' : 'text-neutral-200'
                  }`}
                >
                  Rejected / Defective (pcs)
                </label>
                <div className="relative">
                  <input
                    id="rejected-pieces-input"
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
                <p className={`text-[10px] mt-1 ${isBright ? 'text-slate-500' : 'text-neutral-400'}`}>
                  Damage or reject count to subtract from stage yield
                </p>
              </div>
            </div>
          </div>

          {/* Stage Loss Summary */}
          <div
            id="stage-loss-summary-card"
            className={`p-3.5 rounded-xl border space-y-2.5 transition-colors ${
              isBright
                ? 'bg-[#F4F4F6] border-[#D4D4D8]'
                : 'bg-neutral-950 border-neutral-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-[10px] uppercase font-bold tracking-wider ${
                  isBright ? 'text-[#71717A]' : 'text-neutral-400'
                }`}
              >
                Stage Loss Summary
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${
                  isBright
                    ? 'bg-[#FFFFFF] text-[#71717A] border-[#D4D4D8]'
                    : 'bg-neutral-900 text-neutral-400 border-neutral-800'
                }`}
              >
                Weight &amp; Pieces Loss
              </span>
            </div>

            {/* Weight Loss Row */}
            <div className="flex items-center justify-between text-xs">
              <div className="min-w-0">
                <span className={`text-[10px] font-medium block ${isBright ? 'text-[#71717A]' : 'text-neutral-500'}`}>
                  Weight Loss
                </span>
                <span className={`font-mono ${isBright ? 'text-[#3F3F46]' : 'text-neutral-300'}`}>
                  Sent: <strong>{weightSent} g</strong> &rarr; Recv: <strong>{weightReceived > 0 ? `${weightReceived} g` : '—'}</strong>
                </span>
              </div>
              <div className="text-right flex-shrink-0">
                <span className={`font-mono block ${isBright ? 'text-[#3F3F46]' : 'text-neutral-300'}`}>
                  Loss: <strong className={isBright ? 'text-[#18181B]' : 'text-neutral-100'}>{weightReceived > 0 ? `${weightLoss} g` : '—'}</strong>
                </span>
                <span
                  className={`font-mono font-bold text-[11px] ${
                    lossPercentage > 2
                      ? isBright ? 'text-[#C85235]' : 'text-amber-400'
                      : isBright ? 'text-[#2A9D8F]' : 'text-emerald-400'
                  }`}
                >
                  {weightReceived > 0 ? `${lossPercentage}% wt loss` : '0% wt loss'}
                </span>
              </div>
            </div>

            <div className={`border-t ${isBright ? 'border-[#E4E4E7]' : 'border-neutral-800/80'}`} />

            {/* Physical Piece Loss Reconciliation Row */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-[10px] font-medium block ${isBright ? 'text-[#71717A]' : 'text-neutral-500'}`}>
                    Pieces Loss (Physical Reconciliation)
                  </span>
                  {hasStatedCount && (missingPieces > 0 || rejectedPieces > 0) && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                        isBright
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-amber-950/40 text-amber-300 border-amber-800/40'
                      }`}
                    >
                      {missingPieces > 0 && `${missingPieces} missing`}
                      {missingPieces > 0 && rejectedPieces > 0 && ' + '}
                      {rejectedPieces > 0 && `${rejectedPieces} rejected`}
                    </span>
                  )}
                </div>
                <div className="text-right flex items-center gap-2">
                  <span className={`font-mono block ${isBright ? 'text-[#3F3F46]' : 'text-neutral-300'}`}>
                    Total Loss: <strong className={isBright ? 'text-[#18181B]' : 'text-neutral-100'}>{hasStatedCount ? `${stageLostPieces} ${stageLostPieces === 1 ? 'pc' : 'pcs'}` : '—'}</strong>
                  </span>
                  <span
                    className={`font-mono font-bold text-[11px] ${
                      stageLostPieces > 0
                        ? isBright ? 'text-[#C85235]' : 'text-amber-400'
                        : isBright ? 'text-[#2A9D8F]' : 'text-emerald-400'
                    }`}
                  >
                    {hasStatedCount ? `${pieceLossPercentage}% pcs loss` : '0% pcs loss'}
                  </span>
                </div>
              </div>

              {/* Sent, Received/Good, Rejected, Missing breakdown */}
              <div
                className={`grid grid-cols-2 sm:grid-cols-4 gap-2 py-1.5 px-2.5 rounded-lg border font-mono text-[11px] ${
                  isBright
                    ? 'bg-white border-[#E4E4E7]'
                    : 'bg-neutral-900/80 border-neutral-800'
                }`}
              >
                <div>
                  <span className={`block text-[10px] uppercase font-sans ${isBright ? 'text-[#71717A]' : 'text-neutral-400'}`}>
                    Sent
                  </span>
                  <strong className={isBright ? 'text-[#18181B]' : 'text-neutral-100'}>
                    {piecesSent} pcs
                  </strong>
                </div>
                <div>
                  <span className={`block text-[10px] uppercase font-sans ${isBright ? 'text-[#71717A]' : 'text-neutral-400'}`}>
                    Received/Good
                  </span>
                  <strong className={isBright ? 'text-[#18181B]' : 'text-neutral-100'}>
                    {hasStatedCount ? `${statedPieces} pcs` : '—'}
                  </strong>
                </div>
                <div>
                  <span className={`block text-[10px] uppercase font-sans ${isBright ? 'text-[#71717A]' : 'text-neutral-400'}`}>
                    Rejected
                  </span>
                  <strong className={rejectedPieces > 0 ? (isBright ? 'text-amber-700' : 'text-amber-400') : (isBright ? 'text-[#18181B]' : 'text-neutral-100')}>
                    {rejectedPieces} {rejectedPieces === 1 ? 'pc' : 'pcs'}
                  </strong>
                </div>
                <div>
                  <span className={`block text-[10px] uppercase font-sans ${isBright ? 'text-[#71717A]' : 'text-neutral-400'}`}>
                    Missing
                  </span>
                  <strong className={hasStatedCount && missingPieces > 0 ? (isBright ? 'text-red-700' : 'text-red-400') : (isBright ? 'text-[#18181B]' : 'text-neutral-100')}>
                    {hasStatedCount ? `${missingPieces} ${missingPieces === 1 ? 'pc' : 'pcs'}` : '—'}
                  </strong>
                </div>
              </div>

              {/* Physical Reconciliation Formula Line */}
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className={isBright ? 'text-[#71717A]' : 'text-neutral-400'}>
                  Sent ({piecesSent}) = Good ({hasStatedCount ? statedPieces : '—'}) + Rej ({rejectedPieces}) + Miss ({hasStatedCount ? missingPieces : '—'})
                </span>
                <span className={stageLostPieces > 0 ? (isBright ? 'text-[#C85235] font-semibold' : 'text-amber-400 font-semibold') : 'text-emerald-500 font-semibold'}>
                  {hasStatedCount ? (stageLostPieces === 0 ? '0 pcs loss (Balanced)' : `${stageLostPieces} ${stageLostPieces === 1 ? 'pc' : 'pcs'} loss`) : ''}
                </span>
              </div>
            </div>

            {/* Cumulative Lot Piece Loss if prior stages or total loss exists */}
            {hasStatedCount && (priorLostPieces > 0 || totalLotLostPieces > stageLostPieces) && (
              <div
                className={`pt-1.5 border-t text-[10px] font-mono flex items-center justify-between flex-wrap gap-1 ${
                  isBright ? 'border-[#E4E4E7] text-[#71717A]' : 'border-neutral-800/80 text-neutral-400'
                }`}
              >
                <span>Total Lot Lost Pieces (from launch):</span>
                <span
                  className={`font-semibold ${
                    totalLotLostPieces > 0
                      ? isBright ? 'text-[#C85235]' : 'text-amber-400'
                      : isBright ? 'text-[#2A9D8F]' : 'text-emerald-400'
                  }`}
                >
                  {totalLotLostPieces} pcs lost (Initial {lot.initialPieces} &rarr; Current Good {statedPieces} pcs)
                </span>
              </div>
            )}
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

          {/* Calibration / Recalibration Section */}
          {isChholFirstTime ? (
            /* First-Time at Chhol for this branch: MANDATORY CALIBRATION REQUIRED */
            <div
              className={`p-4 rounded-xl border space-y-3 transition-colors ${
                isBright
                  ? 'bg-[#FAF0ED] border-[#E07A5F] text-[#27272A]'
                  : 'bg-amber-950/40 border-amber-500/50 text-neutral-100'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Scale className={`w-4 h-4 flex-shrink-0 ${isBright ? 'text-[#C85235]' : 'text-amber-400'}`} />
                  <h4 className={`text-xs font-bold ${isBright ? 'text-[#78350F]' : 'text-amber-300'}`}>
                    First-Time {effectiveBranch === 'gold' ? 'Gold' : 'Plain'} Branch Calibration (Required)
                  </h4>
                </div>
                <span
                  className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                    isBright ? 'bg-[#E07A5F] text-white' : 'bg-amber-500 text-neutral-950'
                  }`}
                >
                  Ruler Required
                </span>
              </div>

              <p className={`text-xs leading-relaxed ${isBright ? 'text-[#52525B]' : 'text-neutral-300'}`}>
                This design does not have an established ruler for the{' '}
                <strong className={isBright ? 'text-[#27272A]' : 'text-white'}>
                  {effectiveBranch === 'gold' ? 'Gold' : 'Plain'}
                </strong>{' '}
                branch yet. Material was filed off during Chhol, so a brand-new weight-per-piece ruler (
                <code className={`font-mono text-[11px] font-semibold px-1 py-0.5 rounded ${isBright ? 'bg-white text-[#C85235]' : 'bg-neutral-900 text-amber-300'}`}>
                  {effectiveBranch === 'gold' ? 'goldAvgWeightPerPiece' : 'plainAvgWeightPerPiece'}
                </code>
                ) must be established before proceeding. Weigh and count a small sample (e.g. 50–100 pieces) below:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isBright ? 'text-[#27272A]' : 'text-neutral-200'}`}>
                    Sample Counted Weight (g) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="e.g. 74.00"
                      value={actualCountedWeight}
                      onChange={(e) => setActualCountedWeight(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border font-mono text-xs outline-none transition ${
                        isBright
                          ? 'bg-[#FFFFFF] border-[#D4D4D8] text-[#27272A] focus:border-[#E07A5F]'
                          : 'bg-neutral-900 border-neutral-700 text-neutral-100 focus:border-amber-500'
                      }`}
                    />
                    <span className={`absolute right-3 top-2 text-xs font-mono ${isBright ? 'text-[#71717A]' : 'text-neutral-500'}`}>
                      g
                    </span>
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isBright ? 'text-[#27272A]' : 'text-neutral-200'}`}>
                    Sample Counted Pieces <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      placeholder="e.g. 50"
                      value={actualCountedPieces}
                      onChange={(e) => setActualCountedPieces(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border font-mono text-xs outline-none transition ${
                        isBright
                          ? 'bg-[#FFFFFF] border-[#D4D4D8] text-[#27272A] focus:border-[#E07A5F]'
                          : 'bg-neutral-900 border-neutral-700 text-neutral-100 focus:border-amber-500'
                      }`}
                    />
                    <span className={`absolute right-3 top-2 text-xs font-mono ${isBright ? 'text-[#71717A]' : 'text-neutral-500'}`}>
                      pcs
                    </span>
                  </div>
                </div>
              </div>

              {calculatedRecalibratedWeight ? (
                <div
                  className={`p-2.5 rounded-lg border text-xs font-mono flex items-center justify-between flex-wrap gap-2 ${
                    isBright
                      ? 'bg-[#FFFFFF] border-[#E07A5F]/40 text-[#C85235]'
                      : 'bg-neutral-900/90 border-amber-500/40 text-amber-300'
                  }`}
                >
                  <span>
                    Established {effectiveBranch.toUpperCase()} Ruler: <strong>{calculatedRecalibratedWeight} g/pc</strong>
                  </span>
                  {weightReceived > 0 && (
                    <span className="font-sans font-semibold">
                      &rarr; Batch Est.: <strong>{estimatedPieces} pcs</strong>
                    </span>
                  )}
                </div>
              ) : (
                <p className={`text-[11px] italic ${isBright ? 'text-[#A1A1AA]' : 'text-neutral-400'}`}>
                  Enter sample weight &amp; pieces to establish ruler and auto-calculate batch piece count.
                </p>
              )}
            </div>
          ) : (
            /* Established Stages: Optional Collapsed Recalibration Accordion (Off by Default) */
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
          )}

          </div>

          {/* Action buttons (Pinned at bottom of modal) */}
          <div
            className={`flex items-center justify-end gap-2.5 px-5 sm:px-6 py-3.5 border-t shrink-0 ${
              isBright ? 'bg-[#F4F4F6] border-[#D4D4D8]' : 'bg-[#1E1E24] border-neutral-800'
            }`}
          >
            <button
              type="button"
              onClick={onClose}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-colors ${
                isBright
                  ? 'bg-[#FFFFFF] hover:bg-[#EBEBEF] text-[#27272A] border border-[#D4D4D8]'
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
