import React from 'react';
import { Stage, Lot, Karigar, Design } from '../types';
import { useApp } from '../context/AppContext';
import { useAuthAndTheme } from '../context/AuthAndThemeContext';
import {
  X,
  UserCheck,
  Coffee,
  ArrowRight,
  Printer,
  Scale,
  QrCode,
  Layers,
  Sparkles,
} from 'lucide-react';

interface StageDetailModalProps {
  stage: Stage;
  onClose: () => void;
  onOpenSlip: (lot: Lot, design: Design) => void;
  onOpenStep6: (lot: Lot, design: Design) => void;
  onOpenStep7: (lot: Lot) => void;
  onOpenLot: (lot: Lot) => void;
}

export const StageDetailModal: React.FC<StageDetailModalProps> = ({
  stage,
  onClose,
  onOpenSlip,
  onOpenStep6,
  onOpenStep7,
  onOpenLot,
}) => {
  const { getKarigarStatusForStage, designs, confirmArrival } = useApp();
  const { theme } = useAuthAndTheme();
  const isBright = theme === 'bright';
  const { working, idle } = getKarigarStatusForStage(stage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto no-print">
      <div
        className={`relative w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden my-4 border transition-colors ${
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
              : 'bg-neutral-950 border-neutral-800'
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
                  className={`font-bold text-base sm:text-lg ${
                    isBright ? 'text-[#18181B]' : 'text-neutral-100'
                  }`}
                >
                  Stage Detail — {stage}
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${
                    isBright
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-neutral-800 text-amber-400 border-neutral-700'
                  }`}
                >
                  {working.length} working / {idle.length} idle
                </span>
              </div>
              <p
                className={`text-xs ${
                  isBright ? 'text-[#71717A]' : 'text-neutral-400'
                }`}
              >
                Live Karigar assignments &bull; Sent but not yet received lots
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition ${
              isBright
                ? 'text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F6]'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* SECTION 1: WORKING KARIGARS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4
                className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
                  isBright ? 'text-amber-800' : 'text-amber-400'
                }`}
              >
                <UserCheck className="w-4 h-4 text-emerald-500" />
                Working Karigars ({working.length})
              </h4>
              <span
                className={`text-[11px] ${
                  isBright ? 'text-[#71717A]' : 'text-neutral-400'
                }`}
              >
                Lots sent &amp; currently in active job-work
              </span>
            </div>

            {working.length === 0 ? (
              <div
                className={`p-4 rounded-xl border text-center text-xs ${
                  isBright
                    ? 'bg-[#F8FAFC] border-[#E2E8F0] text-slate-500'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-500'
                }`}
              >
                No Karigars currently working on lots at {stage} stage.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {working.map(({ karigar, lot }) => {
                  const design = designs.find((d) => d.id === lot.designId);
                  const lastRec = lot.history[lot.history.length - 1];

                  const isArrivedAwaitingEntry = lot.status === 'arrived_awaiting_entry';
                  const isStageComplete = lot.status === 'stage_complete';

                  return (
                    <div
                      key={karigar.id + lot.id}
                      className={`p-4 rounded-xl border transition flex flex-col justify-between space-y-3 ${
                        isBright
                          ? 'bg-white border-[#E2E8F0] hover:border-slate-300 shadow-2xs'
                          : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div>
                        {/* Karigar Name & Lot Status Badge */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <div
                              className={`font-bold text-sm flex items-center gap-1.5 ${
                                isBright ? 'text-[#0F172A]' : 'text-neutral-100'
                              }`}
                            >
                              {karigar.name}
                            </div>
                            <div
                              className={`text-[10px] font-mono ${
                                isBright ? 'text-slate-500' : 'text-neutral-400'
                              }`}
                            >
                              {karigar.phone}
                            </div>
                          </div>

                          {/* Status Badge */}
                          {isArrivedAwaitingEntry ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/20 text-red-500 border border-red-500/40 animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                              Arrived, awaiting entry
                            </span>
                          ) : isStageComplete ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-600 border border-emerald-500/40">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Stage Complete
                            </span>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                isBright
                                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                                  : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                              }`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              In Progress
                            </span>
                          )}
                        </div>

                        {/* Active Lot & Design Card */}
                        <div
                          className={`p-2.5 rounded-lg border flex items-center gap-3 ${
                            isBright
                              ? 'bg-[#F8FAFC] border-[#E2E8F0]'
                              : 'bg-neutral-900/80 border-neutral-800'
                          }`}
                        >
                          {design && (
                            <img
                              src={design.photoUrl}
                              alt={design.name}
                              className={`w-12 h-12 rounded-lg object-cover border flex-shrink-0 ${
                                isBright ? 'border-slate-200' : 'border-neutral-700'
                              }`}
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <div
                              className={`font-bold text-xs truncate ${
                                isBright ? 'text-[#1E293B]' : 'text-neutral-200'
                              }`}
                            >
                              {lot.designName}
                            </div>
                            <div className="text-[11px] font-mono text-amber-500 font-semibold">
                              Lot: {lot.lotNumber}
                            </div>
                            <div
                              className={`text-[10px] flex items-center gap-2 mt-0.5 ${
                                isBright ? 'text-slate-500' : 'text-neutral-400'
                              }`}
                            >
                              <span>
                                Sent: {lastRec?.weightSent || lot.initialWeight}g
                              </span>
                              <span>&bull;</span>
                              <span>
                                Pcs: {lastRec?.piecesSent || lot.initialPieces}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div
                        className={`flex items-center gap-1.5 pt-2 border-t text-xs ${
                          isBright ? 'border-slate-200' : 'border-neutral-900'
                        }`}
                      >
                        {design && (
                          <button
                            onClick={() => onOpenSlip(lot, design)}
                            title="Print Stage Slip (ગુજરાતી / English)"
                            className={`p-2 rounded-lg border transition flex items-center gap-1 ${
                              isBright
                                ? 'bg-white hover:bg-slate-100 text-[#0F172A] border-[#CBD5E1]'
                                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700'
                            }`}
                          >
                            <Printer className="w-3.5 h-3.5 text-amber-500" />
                            <span className="text-[10px] font-semibold">Slip</span>
                          </button>
                        )}

                        {lot.status === 'in_progress' && (
                          <button
                            onClick={() => confirmArrival(lot.lotNumber)}
                            className="flex-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 text-[11px] font-semibold transition"
                          >
                            Scan / Confirm Arrival
                          </button>
                        )}

                        {lot.status === 'arrived_awaiting_entry' && design && (
                          <button
                            onClick={() => onOpenStep6(lot, design)}
                            className="flex-1 px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-[11px] font-bold shadow-sm transition active:scale-95"
                          >
                            Enter Data (Step 6)
                          </button>
                        )}

                        {lot.status === 'stage_complete' && (
                          <button
                            onClick={() => onOpenStep7(lot)}
                            className="flex-1 px-2.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 text-[11px] font-bold shadow-sm transition active:scale-95"
                          >
                            Pick Next Stage (Step 7)
                          </button>
                        )}

                        <button
                          onClick={() => onOpenLot(lot)}
                          className={`px-2.5 py-1.5 rounded-lg border text-[11px] transition ${
                            isBright
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                              : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-neutral-700'
                          }`}
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION 2: IDLE KARIGARS */}
          <div
            className={`space-y-3 pt-4 border-t ${
              isBright ? 'border-slate-200' : 'border-neutral-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <h4
                className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
                  isBright ? 'text-slate-600' : 'text-neutral-400'
                }`}
              >
                <Coffee className="w-4 h-4 text-amber-500" />
                Idle Karigars ({idle.length})
              </h4>
              <span
                className={`text-[11px] ${
                  isBright ? 'text-slate-500' : 'text-neutral-500'
                }`}
              >
                Available for assignment at {stage}
              </span>
            </div>

            {idle.length === 0 ? (
              <div
                className={`p-3 rounded-xl border text-center text-xs ${
                  isBright
                    ? 'bg-[#F8FAFC] border-slate-200 text-slate-500'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-500'
                }`}
              >
                All qualified Karigars are currently busy.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {idle.map((k) => (
                  <div
                    key={k.id}
                    className={`p-3 rounded-xl border flex items-center justify-between ${
                      isBright
                        ? 'bg-[#F8FAFC] border-[#E2E8F0]'
                        : 'bg-neutral-950/60 border-neutral-800/80'
                    }`}
                  >
                    <div>
                      <div
                        className={`font-semibold text-xs ${
                          isBright ? 'text-slate-800' : 'text-neutral-300'
                        }`}
                      >
                        {k.name}
                      </div>
                      <div
                        className={`text-[10px] font-mono ${
                          isBright ? 'text-slate-500' : 'text-neutral-500'
                        }`}
                      >
                        {k.phone}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isBright
                          ? 'bg-slate-200 text-slate-700 border-slate-300'
                          : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                      }`}
                    >
                      IDLE
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className={`px-6 py-3.5 border-t flex justify-between items-center text-xs ${
            isBright
              ? 'bg-[#FAFAFA] border-[#E4E4E7] text-slate-500'
              : 'bg-neutral-950 border-neutral-800 text-neutral-400'
          }`}
        >
          <span>Stage: {stage} Workflow</span>
          <button
            onClick={onClose}
            className={`px-4 py-1.5 rounded-xl font-medium transition border ${
              isBright
                ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
