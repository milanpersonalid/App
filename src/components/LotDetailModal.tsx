import React from 'react';
import { Lot, Design } from '../types';
import { useApp } from '../context/AppContext';
import { useAuthAndTheme } from '../context/AuthAndThemeContext';
import {
  X,
  Printer,
  Scale,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  QrCode,
} from 'lucide-react';
import { getStageAvgWeight, getStageWeightLabel } from '../utils/stageWeights';

interface LotDetailModalProps {
  lot: Lot;
  onClose: () => void;
  onOpenSlip: (lot: Lot, design: Design) => void;
  onOpenStep6: (lot: Lot, design: Design) => void;
  onOpenStep7: (lot: Lot) => void;
}

export const LotDetailModal: React.FC<LotDetailModalProps> = ({
  lot,
  onClose,
  onOpenSlip,
  onOpenStep6,
  onOpenStep7,
}) => {
  const { designs, confirmArrival } = useApp();
  const { theme } = useAuthAndTheme();
  const isBright = theme === 'bright';
  const design = designs.find((d) => d.id === lot.designId);

  const isArrivedAwaitingEntry = lot.status === 'arrived_awaiting_entry';
  const isStageComplete = lot.status === 'stage_complete';
  const isInProgress = lot.status === 'in_progress';
  const isReadyStock = lot.status === 'ready_stock';

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto overflow-x-hidden w-full max-w-full no-print cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-4 border transition-colors max-w-full cursor-default ${
          isBright
            ? 'bg-white border-[#E4E4E7] text-[#18181B]'
            : 'bg-neutral-900 border-neutral-700 text-neutral-100'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isBright
              ? 'bg-[#FAFAFA] border-[#E4E4E7]'
              : 'bg-neutral-900 border-neutral-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl border ${
                isBright
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}
            >
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3
                  className={`font-bold text-base ${
                    isBright ? 'text-[#18181B]' : 'text-neutral-100'
                  }`}
                >
                  Lot {lot.lotNumber}
                </h3>
                <span
                  className={`font-mono text-xs px-2 py-0.5 rounded border ${
                    isBright
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                  }`}
                >
                  {lot.currentStage}
                </span>
              </div>
              <p
                className={`text-xs ${
                  isBright ? 'text-[#71717A]' : 'text-neutral-400'
                }`}
              >
                Design: {lot.designName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-xl transition ${
              isBright
                ? 'text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F6]'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto overflow-x-hidden w-full max-w-full">
          {/* STATUS NOTIFICATION BANNERS */}
          {isArrivedAwaitingEntry && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs flex items-center justify-between gap-3 animate-pulse">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div>
                  <span className="font-bold block uppercase tracking-wider">
                    Status: Arrived, Awaiting Entry (Red)
                  </span>
                  <span className={isBright ? 'text-slate-600' : 'text-neutral-300'}>
                    Tray returned from artisan. Ready for manual return weight and piece count entry.
                  </span>
                </div>
              </div>
              {design && (
                <button
                  onClick={() => onOpenStep6(lot, design)}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs shadow transition active:scale-95 whitespace-nowrap"
                >
                  Enter Return Data
                </button>
              )}
            </div>
          )}

          {isStageComplete && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <div>
                  <span className="font-bold block uppercase tracking-wider">
                    Status: Stage Complete (Green)
                  </span>
                  <span className={isBright ? 'text-slate-600' : 'text-neutral-300'}>
                    Return data verified. Lot is ready to advance to the next stage.
                  </span>
                </div>
              </div>
              <button
                onClick={() => onOpenStep7(lot)}
                className="px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs shadow transition active:scale-95 whitespace-nowrap"
              >
                Send to Next Stage
              </button>
            </div>
          )}

          {isInProgress && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                isBright
                  ? 'bg-[#F8FAFC] border-slate-200'
                  : 'bg-neutral-950 border-neutral-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-amber-500" />
                <div>
                  <span
                    className={`font-semibold ${
                      isBright ? 'text-slate-900' : 'text-neutral-200'
                    }`}
                  >
                    With Karigar ({lot.currentKarigarName})
                  </span>
                  <span
                    className={`block text-[11px] ${
                      isBright ? 'text-slate-500' : 'text-neutral-400'
                    }`}
                  >
                    Batch is in active production at stage {lot.currentStage}.
                  </span>
                </div>
              </div>
              <button
                onClick={() => confirmArrival(lot.lotNumber)}
                className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 text-xs font-semibold transition"
              >
                Confirm Arrival
              </button>
            </div>
          )}

          {isReadyStock && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <div>
                  <span className="font-bold text-amber-800 block uppercase tracking-wider">
                    Ready Stock ({lot.readyStockBucket})
                  </span>
                  <span className={isBright ? 'text-slate-600' : 'text-neutral-300'}>
                    Finished production. Final pieces: {lot.finalPieces} pcs &bull; Weight: {lot.finalWeight}g
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Core Lot Card */}
          <div
            className={`p-4 rounded-xl border flex items-center gap-4 ${
              isBright
                ? 'bg-[#F8FAFC] border-slate-200'
                : 'bg-neutral-950 border-neutral-800'
            }`}
          >
            {design && (
              <img
                src={design.photoUrl}
                alt={design.name}
                className={`w-20 h-20 rounded-xl object-cover border flex-shrink-0 ${
                  isBright ? 'border-slate-200' : 'border-neutral-700'
                }`}
              />
            )}
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between">
                <h4
                  className={`font-bold text-sm ${
                    isBright ? 'text-slate-900' : 'text-neutral-100'
                  }`}
                >
                  {lot.designName}
                </h4>
                <span className="text-xs font-mono text-amber-500 font-bold">
                  {lot.lotNumber}
                </span>
              </div>
              <div
                className={`grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] ${
                  isBright ? 'text-slate-600' : 'text-neutral-400'
                }`}
              >
                <div>
                  <span className={isBright ? 'text-slate-400' : 'text-neutral-500'}>
                    Initial Pcs
                  </span>
                  <span
                    className={`font-bold font-mono block ${
                      isBright ? 'text-slate-900' : 'text-neutral-200'
                    }`}
                  >
                    {lot.initialPieces} pcs
                  </span>
                </div>
                <div>
                  <span className={isBright ? 'text-slate-400' : 'text-neutral-500'}>
                    Initial Weight
                  </span>
                  <span
                    className={`font-bold font-mono block ${
                      isBright ? 'text-slate-900' : 'text-neutral-200'
                    }`}
                  >
                    {lot.initialWeight} g
                  </span>
                </div>
                <div>
                  <span className={isBright ? 'text-slate-400' : 'text-neutral-500'}>
                    Current Karigar
                  </span>
                  <span
                    className={`font-bold block truncate ${
                      isBright ? 'text-slate-900' : 'text-neutral-200'
                    }`}
                  >
                    {lot.currentKarigarName}
                  </span>
                </div>
                <div>
                  <span className={isBright ? 'text-slate-400' : 'text-neutral-500'}>
                    {getStageWeightLabel(lot.currentStage, lot.branch)}
                  </span>
                  <span
                    className={`font-bold font-mono block ${
                      isBright ? 'text-amber-800' : 'text-amber-400'
                    }`}
                  >
                    {(getStageAvgWeight(design, lot.currentStage, lot.branch) || 1.5).toFixed(3)} g/pc
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* STAGE HISTORY CYCLE LOG */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4
                className={`text-xs font-bold uppercase tracking-wider ${
                  isBright ? 'text-slate-700' : 'text-neutral-300'
                }`}
              >
                Stage Cycle Progression
              </h4>
              <span
                className={`text-[11px] ${
                  isBright ? 'text-slate-500' : 'text-neutral-400'
                }`}
              >
                {lot.history.length} stages recorded
              </span>
            </div>

            <div className="space-y-2.5">
              {lot.history.map((rec, index) => (
                <div
                  key={index}
                  className={`p-3.5 rounded-xl border text-xs transition ${
                    rec.isCompleted
                      ? isBright
                        ? 'bg-white border-slate-200'
                        : 'bg-neutral-950 border-neutral-800'
                      : isBright
                      ? 'bg-amber-50/50 border-amber-300 ring-1 ring-amber-300/30'
                      : 'bg-neutral-950/60 border-amber-500/40 ring-1 ring-amber-500/20'
                  }`}
                >
                  <div
                    className={`flex items-center justify-between border-b pb-2 mb-2 ${
                      isBright ? 'border-slate-200' : 'border-neutral-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-bold text-sm ${
                          isBright ? 'text-slate-900' : 'text-neutral-100'
                        }`}
                      >
                        {rec.stage}
                      </span>
                      <span
                        className={
                          isBright ? 'text-slate-600 font-medium' : 'text-neutral-400 font-medium'
                        }
                      >
                        with {rec.karigarName}
                      </span>
                    </div>
                    <div>
                      {rec.isCompleted ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 font-mono font-bold">
                          COMPLETED
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-600 font-mono font-bold">
                          ACTIVE STAGE
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px]">
                    <div>
                      <span className={isBright ? 'text-slate-500 block' : 'text-neutral-500 block'}>
                        Weight Sent
                      </span>
                      <span
                        className={`font-mono font-bold ${
                          isBright ? 'text-slate-900' : 'text-neutral-200'
                        }`}
                      >
                        {(rec.weightSent ?? 0).toFixed(2)} g
                      </span>
                    </div>
                    <div>
                      <span className={isBright ? 'text-slate-500 block' : 'text-neutral-500 block'}>
                        Weight Received
                      </span>
                      <span
                        className={`font-mono font-bold ${
                          isBright ? 'text-slate-900' : 'text-neutral-200'
                        }`}
                      >
                        {rec.weightReceived !== undefined ? `${Number(rec.weightReceived || 0).toFixed(2)} g` : 'Pending'}
                      </span>
                    </div>
                    <div>
                      <span className={isBright ? 'text-slate-500 block' : 'text-neutral-500 block'}>
                        Stated / Est. Pcs
                      </span>
                      <span
                        className={`font-mono font-bold ${
                          isBright ? 'text-slate-900' : 'text-neutral-200'
                        }`}
                      >
                        {rec.statedPieces !== undefined
                          ? `${rec.statedPieces} / ${rec.estimatedPieces || '—'}`
                          : 'Pending'}
                      </span>
                    </div>
                    <div>
                      <span className={isBright ? 'text-slate-500 block' : 'text-neutral-500 block'}>
                        Weight Loss (Loss %)
                      </span>
                      <span
                        className={`font-mono font-bold ${
                          isBright ? 'text-slate-900' : 'text-neutral-200'
                        }`}
                      >
                        {rec.weightLoss !== undefined ? `${rec.weightLoss}g (${rec.lossPercentage}%)` : 'Pending'}
                      </span>
                    </div>
                  </div>

                  {rec.rejectedPieces !== undefined && rec.rejectedPieces > 0 && (
                    <div className="mt-2 text-[10px] text-amber-500 font-mono font-semibold">
                      Defective / Rejected: {rec.rejectedPieces} pieces logged as scrap
                    </div>
                  )}

                  {rec.hasDiscrepancy && (
                    <div className="mt-2 p-2 rounded bg-amber-500/10 border border-amber-500/30 text-[10px] text-amber-800 flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Discrepancy flagged: {rec.discrepancyGramsDiff}g variance observed.</span>
                    </div>
                  )}

                  {rec.recalibratedAvgWeight !== undefined && (
                    <div className="mt-2 p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-600 font-mono flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-emerald-500" />
                      <span>
                        Stage Calibrated {rec.recalibrationTarget ? `${rec.recalibrationTarget} baseline` : 'average weight'}: <strong>{rec.recalibratedAvgWeight} g/pc</strong>
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          className={`px-6 py-4 border-t flex items-center justify-between text-xs ${
            isBright
              ? 'bg-[#FAFAFA] border-[#E4E4E7]'
              : 'bg-neutral-950 border-neutral-800'
          }`}
        >
          {design && (
            <button
              onClick={() => onOpenSlip(lot, design)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold shadow-md transition active:scale-95"
            >
              <Printer className="w-4 h-4" />
              Print Stage Slip (કાપલી પ્રિન્ટ)
            </button>
          )}

          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-xl font-medium transition border ${
              isBright
                ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-neutral-700'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
