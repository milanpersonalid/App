import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuthAndTheme } from '../../context/AuthAndThemeContext';
import { Lot, Design, Stage, LotStatus } from '../../types';
import {
  Layers,
  Search,
  Printer,
  Scale,
  ArrowRight,
  Filter,
  Plus,
  QrCode,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface LotsViewProps {
  onOpenCreateLot: () => void;
  onOpenSlip: (lot: Lot, design: Design) => void;
  onOpenStep6: (lot: Lot, design: Design) => void;
  onOpenStep7: (lot: Lot) => void;
  onOpenLot: (lot: Lot) => void;
}

export const LotsView: React.FC<LotsViewProps> = ({
  onOpenCreateLot,
  onOpenSlip,
  onOpenStep6,
  onOpenStep7,
  onOpenLot,
}) => {
  const { lots, designs, confirmArrival } = useApp();
  const { theme } = useAuthAndTheme();
  const isBright = theme === 'bright';

  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');


  const filteredLots = lots.filter((lot) => {
    const matchesSearch =
      lot.lotNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lot.designName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lot.currentKarigarName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStage = stageFilter === 'all' || lot.currentStage === stageFilter;
    const matchesStatus = statusFilter === 'all' || lot.status === statusFilter;

    return matchesSearch && matchesStage && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-12 overflow-x-hidden w-full max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2
            className={`text-xl font-bold font-brand flex items-center gap-2 ${
              isBright ? 'text-[#18181B]' : 'text-neutral-100'
            }`}
          >
            <Layers className="w-5 h-5 text-amber-500" />
            Lots Tracker
          </h2>
        </div>

        <button
          onClick={onOpenCreateLot}
          className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition"
        >
          <Plus className="w-4 h-4" /> Create Lot
        </button>
      </div>

      {/* Filters Bar */}
      <div
        className={`p-3 rounded-xl border space-y-2.5 transition-colors ${
          isBright ? 'bg-white border-[#E4E4E7]' : 'bg-neutral-950 border-neutral-800'
        }`}
      >
        <div className="flex flex-col gap-2">
          {/* Search */}
          <div className="relative">
            <Search
              className={`w-4 h-4 absolute left-3 top-2.5 ${
                isBright ? 'text-slate-400' : 'text-neutral-500'
              }`}
            />
            <input
              type="text"
              placeholder="Search lot #, design, Karigar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs outline-none transition ${
                isBright
                  ? 'bg-[#F8FAFC] border-[#CBD5E1] text-[#0F172A] focus:border-amber-500 focus:bg-white'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-100 focus:border-amber-500'
              }`}
            />
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-2 gap-2">
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs outline-none transition ${
                isBright
                  ? 'bg-[#F8FAFC] border-[#CBD5E1] text-[#0F172A] focus:border-amber-500'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-200 focus:border-amber-500'
              }`}
            >
              <option value="all">All Stages</option>
              <option value="Wax">Wax</option>
              <option value="Casting">Casting</option>
              <option value="Buff">Buff</option>
              <option value="Zabora">Zabora</option>
              <option value="Dal">Dal</option>
              <option value="Chhol">Chhol</option>
              <option value="Plating">Plating</option>
              <option value="Ready Stock">Ready Stock</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs outline-none transition ${
                isBright
                  ? 'bg-[#F8FAFC] border-[#CBD5E1] text-[#0F172A] focus:border-amber-500'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-200 focus:border-amber-500'
              }`}
            >
              <option value="all">All Statuses</option>
              <option value="in_progress">In Progress</option>
              <option value="arrived_awaiting_entry">Arrived (Red)</option>
              <option value="stage_complete">Complete (Green)</option>
              <option value="ready_stock">Ready Stock</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lots List Table / Cards */}
      <div className="space-y-2.5">
        {filteredLots.length === 0 ? (
          <div
            className={`p-8 rounded-2xl border text-center text-xs ${
              isBright
                ? 'bg-white border-[#E4E4E7] text-slate-500'
                : 'bg-neutral-950 border-neutral-800 text-neutral-500'
            }`}
          >
            No production lots match the selected filters.
          </div>
        ) : (
          filteredLots.map((lot) => {
            const design = designs.find((d) => d.id === lot.designId);
            const lastRec = lot.history[lot.history.length - 1];

            const isArrivedAwaitingEntry = lot.status === 'arrived_awaiting_entry';
            const isStageComplete = lot.status === 'stage_complete';
            const isInProgress = lot.status === 'in_progress';
            const isReadyStock = lot.status === 'ready_stock';

            return (
              <div
                key={lot.id}
                className={`p-3 rounded-xl border transition flex flex-col justify-between gap-3 shadow-sm ${
                  isBright
                    ? 'bg-white border-[#E4E4E7] hover:border-slate-300'
                    : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                {/* Left info */}
                <div className="flex items-center gap-4 min-w-0">
                  {design && (
                    <img
                      src={design.photoUrl}
                      alt={design.name}
                      className={`w-14 h-14 rounded-xl object-cover border flex-shrink-0 ${
                        isBright ? 'border-slate-200' : 'border-neutral-700'
                      }`}
                    />
                  )}
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`font-bold text-sm font-mono ${
                          isBright ? 'text-[#0F172A]' : 'text-neutral-100'
                        }`}
                      >
                        {lot.lotNumber}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border font-bold ${
                          isBright
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-neutral-900 border-neutral-800 text-amber-300'
                        }`}
                      >
                        {lot.currentStage}
                      </span>

                      {/* Status indicator */}
                      {isArrivedAwaitingEntry && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-500 border border-red-500/40 font-bold animate-pulse">
                          Arrived, awaiting entry
                        </span>
                      )}
                      {isStageComplete && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 border border-emerald-500/40 font-bold">
                          Stage Complete
                        </span>
                      )}
                      {isInProgress && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                            isBright
                              ? 'bg-slate-100 text-slate-700 border-slate-200'
                              : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                          }`}
                        >
                          In Progress
                        </span>
                      )}
                      {isReadyStock && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 border border-amber-500/30 font-bold">
                          Ready Stock ({lot.readyStockBucket})
                        </span>
                      )}
                    </div>

                    <div
                      className={`text-xs font-medium truncate ${
                        isBright ? 'text-slate-700' : 'text-neutral-300'
                      }`}
                    >
                      {lot.designName}
                    </div>

                    <div
                      className={`flex items-center gap-3 text-[11px] flex-wrap ${
                        isBright ? 'text-slate-500' : 'text-neutral-400'
                      }`}
                    >
                      <span>
                        Karigar:{' '}
                        <strong
                          className={isBright ? 'text-slate-900' : 'text-neutral-200'}
                        >
                          {lot.currentKarigarName}
                        </strong>
                      </span>
                      <span>&bull;</span>
                      <span>
                        Sent:{' '}
                        <strong
                          className={`font-mono ${
                            isBright ? 'text-slate-900' : 'text-neutral-200'
                          }`}
                        >
                          {lastRec?.weightSent || lot.initialWeight}g
                        </strong>
                      </span>
                      <span>&bull;</span>
                      <span>
                        Pcs:{' '}
                        <strong
                          className={`font-mono ${
                            isBright ? 'text-slate-900' : 'text-neutral-200'
                          }`}
                        >
                          {lastRec?.piecesSent || lot.initialPieces}
                        </strong>
                      </span>
                      {lastRec?.weightLoss !== undefined && (
                        <>
                          <span>&bull;</span>
                          <span className="text-amber-500 font-mono font-semibold">
                            Loss: {lastRec.weightLoss}g ({lastRec.lossPercentage}%)
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  {design && (
                    <button
                      onClick={() => onOpenSlip(lot, design)}
                      title="Print Stage Slip (Step 1)"
                      className={`p-2 rounded-xl border transition flex items-center gap-1.5 text-xs font-semibold ${
                        isBright
                          ? 'bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#1E293B] border-[#CBD5E1]'
                          : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border-neutral-800'
                      }`}
                    >
                      <Printer className="w-4 h-4 text-amber-500" />
                      <span className="hidden sm:inline">Print Slip</span>
                    </button>
                  )}

                  {isInProgress && (
                    <button
                      onClick={() => confirmArrival(lot.lotNumber)}
                      className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 text-xs font-semibold transition"
                    >
                      Confirm Arrival (Step 5)
                    </button>
                  )}

                  {isArrivedAwaitingEntry && design && (
                    <button
                      onClick={() => onOpenStep6(lot, design)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs shadow-md transition active:scale-95"
                    >
                      Enter Data (Step 6)
                    </button>
                  )}

                  {isStageComplete && (
                    <button
                      onClick={() => onOpenStep7(lot)}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs shadow-md transition active:scale-95"
                    >
                      Pick Next Stage (Step 7) &rarr;
                    </button>
                  )}

                  <button
                    onClick={() => onOpenLot(lot)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition ${
                      isBright
                        ? 'bg-[#F8FAFC] hover:bg-[#F1F5F9] text-slate-700 border-[#CBD5E1]'
                        : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700'
                    }`}
                  >
                    Details
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
