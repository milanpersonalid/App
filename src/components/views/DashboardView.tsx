import React, { useState } from 'react';
import { Stage, Lot, Design, ALL_ACTIVE_STAGES } from '../../types';
import { useApp } from '../../context/AppContext';
import { useAuthAndTheme } from '../../context/AuthAndThemeContext';
import {
  Layers,
  ArrowRight,
  Scale,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Users,
  Clock,
  Printer,
  ChevronRight,
  Search,
  SlidersHorizontal,
} from 'lucide-react';

interface DashboardViewProps {
  onSelectStage: (stage: Stage) => void;
  onOpenStep6: (lot: Lot, design: Design) => void;
  onOpenStep7: (lot: Lot) => void;
  onOpenSlip: (lot: Lot, design: Design) => void;
  onOpenLot: (lot: Lot) => void;
  onOpenScannerConfirm: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onSelectStage,
  onOpenStep6,
  onOpenStep7,
  onOpenSlip,
  onOpenLot,
  onOpenScannerConfirm,
}) => {
  const { lots, designs, getKarigarStatusForStage, confirmArrival } = useApp();
  const { theme } = useAuthAndTheme();
  const isBright = theme === 'bright';

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'awaiting_entry' | 'stage_complete' | 'in_progress'>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Active queues
  const awaitingEntryLots = lots.filter((l) => l.status === 'arrived_awaiting_entry');
  const stageCompleteLots = lots.filter((l) => l.status === 'stage_complete');
  const inProgressLots = lots.filter((l) => l.status === 'in_progress');

  // Stages to show in sequence
  const displayStages: Stage[] = [
    'Wax',
    'Casting',
    'Buff',
    'Zabora',
    'Dull',
    'Chhol',
    'Plating',
  ];

  const q = searchQuery.toLowerCase().trim();

  // Filter Awaiting Lots
  const filteredAwaitingLots = awaitingEntryLots.filter((lot) => {
    if (activeFilter === 'stage_complete' || activeFilter === 'in_progress') return false;
    if (!q) return true;
    return (
      lot.lotNumber.toLowerCase().includes(q) ||
      lot.designName.toLowerCase().includes(q) ||
      lot.currentKarigarName.toLowerCase().includes(q) ||
      lot.currentStage.toLowerCase().includes(q)
    );
  });

  // Filter Stage Complete Lots
  const filteredStageCompleteLots = stageCompleteLots.filter((lot) => {
    if (activeFilter === 'awaiting_entry' || activeFilter === 'in_progress') return false;
    if (!q) return true;
    return (
      lot.lotNumber.toLowerCase().includes(q) ||
      lot.designName.toLowerCase().includes(q) ||
      lot.currentKarigarName.toLowerCase().includes(q) ||
      lot.currentStage.toLowerCase().includes(q)
    );
  });

  // Filter Stages
  const filteredStages = displayStages.filter((stage) => {
    if (activeFilter === 'awaiting_entry') {
      return awaitingEntryLots.some((l) => l.currentStage === stage);
    }
    if (activeFilter === 'stage_complete') {
      return stageCompleteLots.some((l) => l.currentStage === stage);
    }
    if (!q) return true;
    const stageMatch = stage.toLowerCase().includes(q);
    const hasMatchingLot = lots.some(
      (l) =>
        l.currentStage === stage &&
        (l.lotNumber.toLowerCase().includes(q) ||
          l.designName.toLowerCase().includes(q) ||
          l.currentKarigarName.toLowerCase().includes(q))
    );
    return stageMatch || hasMatchingLot;
  });

  const totalResults =
    filteredAwaitingLots.length +
    filteredStageCompleteLots.length +
    filteredStages.length;

  return (
    <div className="space-y-6 pb-12 overflow-x-hidden w-full max-w-full">
      {/* LUXURY WORKSHOP SEARCH & FILTER */}
      <div className="pt-0.5">
        {/* SEARCH & FILTER BAR */}
        <div className="flex items-center gap-2.5">
          <div className="flex-1 relative">
            <Search
              className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${
                isBright ? 'text-[#A8A29E]' : 'text-[#78716C]'
              }`}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search lot, karigar or stage..."
              className={`w-full pl-10 pr-9 py-3 rounded-2xl text-sm font-sans transition-all duration-200 shadow-sm focus:outline-none ${
                isBright
                  ? 'bg-white border border-[#E7E5E4] text-[#1C1917] placeholder-[#A8A29E] focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20'
                  : 'bg-[#292623] border border-[#44403C] text-[#F5F5F4] placeholder-[#78716C] focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20'
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold w-5 h-5 rounded-full bg-black/10 hover:bg-black/20 text-stone-500 flex items-center justify-center transition"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            title="Filter Lots & Stages"
            className={`p-3 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-sm transition active:scale-95 ${
              isFilterOpen || activeFilter !== 'all'
                ? 'bg-[#C5A059] text-white shadow-md shadow-[#C5A059]/30'
                : isBright
                ? 'bg-[#D4C3AC] hover:bg-[#C8B399] text-[#292524]'
                : 'bg-[#3E3832] hover:bg-[#4D453E] text-[#D8C7B0]'
            }`}
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Quick-Select Pills */}
        {isFilterOpen && (
          <div className="flex flex-wrap items-center gap-1.5 pt-3 animate-in fade-in slide-in-from-top-1 duration-150">
            {(
              [
                { key: 'all', label: 'All Lots' },
                { key: 'awaiting_entry', label: `Awaiting Entry (${awaitingEntryLots.length})` },
                { key: 'stage_complete', label: `Stage Done (${stageCompleteLots.length})` },
                { key: 'in_progress', label: `In Progress (${inProgressLots.length})` },
              ] as const
            ).map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveFilter(item.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                  activeFilter === item.key
                    ? 'bg-[#C5A059] text-white shadow-sm'
                    : isBright
                    ? 'bg-white border border-[#E7E5E4] text-[#57534E] hover:bg-stone-50'
                    : 'bg-[#292623] border border-[#44403C] text-stone-300 hover:bg-[#34302C]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}

        {/* Active Search Result Badge */}
        {q && (
          <div className="flex items-center justify-between mt-2.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs">
            <span className="text-amber-800 dark:text-amber-200">
              Showing results for &ldquo;<strong>{searchQuery}</strong>&rdquo;
            </span>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-amber-700 dark:text-amber-300 font-semibold hover:underline"
            >
              Clear
            </button>
          </div>
        )}
      </div>
      {/* ACTION QUEUE: STEP 5 SCAN ARRIVAL AWAITING MANUAL DATA ENTRY (RED STATUS) */}
      {filteredAwaitingLots.length > 0 && (
        <div
          className={`p-4 rounded-2xl border space-y-3 ${
            isBright ? 'bg-rose-50/70 border-rose-200' : 'bg-red-950/30 border-red-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E07A5F] animate-ping" />
              <h3
                className={`font-bold text-xs uppercase tracking-wider font-brand ${
                  isBright ? 'text-[#C86349]' : 'text-red-300'
                }`}
              >
                Awaiting Return Data Entry ({filteredAwaitingLots.length} Lots)
              </h3>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            {filteredAwaitingLots.map((lot) => {
              const design = designs.find((d) => d.id === lot.designId);
              const lastRec = lot.history[lot.history.length - 1];

              return (
                <div
                  key={lot.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 shadow-sm ${
                    isBright
                      ? 'bg-white border-rose-200'
                      : 'bg-neutral-950 border-red-500/30'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-bold text-sm font-mono ${
                          isBright ? 'text-[#27272A]' : 'text-neutral-100'
                        }`}
                      >
                        {lot.lotNumber}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                          isBright
                            ? 'bg-[#F4F4F6] text-[#E07A5F] border border-[#D4D4D8]'
                            : 'bg-neutral-800 text-amber-300'
                        }`}
                      >
                        {lot.currentStage}
                      </span>
                    </div>
                    <div
                      className={`text-xs truncate mt-0.5 font-medium ${
                        isBright ? 'text-[#27272A]' : 'text-neutral-300'
                      }`}
                    >
                      {lot.designName}
                    </div>
                    <div
                      className={`text-[11px] font-mono mt-0.5 ${
                        isBright ? 'text-[#71717A]' : 'text-neutral-400'
                      }`}
                    >
                      Karigar: {lot.currentKarigarName}
                    </div>
                  </div>

                  {design && (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => onOpenSlip(lot, design)}
                        title="Print Stage Slip (કાપલી પ્રિન્ટ)"
                        className={`p-1.5 rounded-lg border transition ${
                          isBright
                            ? 'bg-white hover:bg-slate-100 text-slate-700 border-rose-200'
                            : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-neutral-700'
                        }`}
                      >
                        <Printer className="w-3.5 h-3.5 text-amber-500" />
                      </button>
                      <button
                        onClick={() => onOpenStep6(lot, design)}
                        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#E07A5F] to-[#C86349] hover:from-[#E8998D] hover:to-[#E07A5F] text-white font-bold text-xs shadow-md transition active:scale-95 whitespace-nowrap"
                      >
                        Enter Data
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ACTION QUEUE: STEP 6 COMPLETED, READY TO PICK NEXT STAGE (GREEN STATUS) */}
      {filteredStageCompleteLots.length > 0 && (
        <div
          className={`p-4 rounded-2xl border space-y-3 ${
            isBright ? 'bg-emerald-50/70 border-emerald-200' : 'bg-emerald-950/30 border-emerald-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <h3
                className={`font-bold text-xs uppercase tracking-wider font-brand ${
                  isBright ? 'text-emerald-800' : 'text-emerald-300'
                }`}
              >
                Stage Completed — Ready for Next Stage ({filteredStageCompleteLots.length} Lots)
              </h3>
            </div>
            <span className={`text-[11px] ${isBright ? 'text-[#71717A]' : 'text-neutral-400'}`}>
              Manual advancement required &bull; Dynamic QR regenerated at transition
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {filteredStageCompleteLots.map((lot) => {
              const design = designs.find((d) => d.id === lot.designId);
              const lastRec = lot.history[lot.history.length - 1];
              return (
                <div
                  key={lot.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 shadow-sm ${
                    isBright
                      ? 'bg-white border-emerald-200'
                      : 'bg-neutral-950 border-emerald-500/30'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-bold text-sm font-mono ${
                          isBright ? 'text-[#27272A]' : 'text-neutral-100'
                        }`}
                      >
                        {lot.lotNumber}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                          isBright
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {lot.currentStage} Done
                      </span>
                    </div>
                    <div
                      className={`text-xs truncate mt-0.5 font-medium ${
                        isBright ? 'text-[#27272A]' : 'text-neutral-300'
                      }`}
                    >
                      {lot.designName}
                    </div>
                    <div
                      className={`text-[11px] font-mono mt-0.5 ${
                        isBright ? 'text-[#71717A]' : 'text-neutral-400'
                      }`}
                    >
                      Loss: {lastRec?.weightLoss || 0}g ({lastRec?.lossPercentage || 0}%)
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {design && (
                      <button
                        onClick={() => onOpenSlip(lot, design)}
                        title="Print Stage Slip (કાપલી પ્રિન્ટ)"
                        className={`p-1.5 rounded-lg border transition ${
                          isBright
                            ? 'bg-white hover:bg-slate-100 text-slate-700 border-emerald-200'
                            : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-neutral-700'
                        }`}
                      >
                        <Printer className="w-3.5 h-3.5 text-amber-500" />
                      </button>
                    )}
                    <button
                      onClick={() => onOpenStep7(lot)}
                      className="px-3 py-1.5 rounded-lg bg-[#E07A5F] hover:bg-[#C86349] text-white font-bold text-xs shadow-md transition active:scale-95 whitespace-nowrap"
                    >
                      Next Stage &rarr;
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* NO SEARCH RESULTS STATE */}
      {q && totalResults === 0 && (
        <div
          className={`p-8 rounded-2xl border text-center space-y-3 ${
            isBright ? 'bg-white border-[#E7E5E4]' : 'bg-[#292623] border-[#44403C]'
          }`}
        >
          <p className="font-serif text-lg font-bold">No results found</p>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            No active lots, karigars, or stages matched &ldquo;{searchQuery}&rdquo;. Try another search keyword.
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="px-4 py-2 rounded-xl bg-[#C5A059] text-white text-xs font-bold shadow-sm"
          >
            Clear Search
          </button>
        </div>
      )}

      {/* DASHBOARD STAGE CARDS GRID */}
      {filteredStages.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3
              className={`text-sm font-bold uppercase tracking-wider font-brand ${
                isBright ? 'text-[#27272A]' : 'text-neutral-200'
              }`}
            >
              Stage Sequence &bull; Live
            </h3>
          </div>

          {/* 2-COLUMN GRID (2 STAGES PER ROW) */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {filteredStages.map((stage) => {
            const { working, idle } = getKarigarStatusForStage(stage);
            const stageLots = lots.filter(
              (l) => l.currentStage === stage && l.status !== 'ready_stock'
            );
            const awaitingInStage = stageLots.filter(
              (l) => l.status === 'arrived_awaiting_entry'
            ).length;
            const completedInStage = stageLots.filter(
              (l) => l.status === 'stage_complete'
            ).length;

            const isChhol = stage === 'Chhol';
            const isPlating = stage === 'Plating';

            return (
              <div
                key={stage}
                onClick={() => onSelectStage(stage)}
                className={`group relative p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer shadow-sm flex flex-col justify-between ${
                  isBright
                    ? 'bg-white border-[#D4D4D8] hover:border-[#E07A5F] hover:shadow-md'
                    : 'bg-[#292930] border-[#3F3F46] hover:border-[#E07A5F]/60 hover:bg-[#34343D]'
                }`}
              >
                <div>
                  {/* Stage Name & Optional Branch Tag (unified top row for uniform height across all cards) */}
                  <div className="flex items-center justify-between gap-1 min-h-[26px]">
                    <h4
                      className={`text-base sm:text-lg font-bold transition font-brand ${
                        isBright
                          ? 'text-[#27272A] group-hover:text-[#E07A5F]'
                          : 'text-[#F4F4F6] group-hover:text-[#E8998D]'
                      }`}
                    >
                      {stage}
                    </h4>

                    {isChhol && (
                      <span className="text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-600 border border-blue-500/30 shrink-0">
                        BRANCH
                      </span>
                    )}

                    {isPlating && (
                      <span className="text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#E07A5F]/15 text-[#E07A5F] border border-[#E07A5F]/30 shrink-0">
                        GOLD
                      </span>
                    )}
                  </div>

                  {/* SPEC SPECIFIC LIVE COUNT: "X working / Y idle" */}
                  <div
                    className={`mt-2 p-2 rounded-xl border flex flex-col gap-0.5 ${
                      isBright
                        ? 'bg-[#F4F4F6] border-[#E4E4E7]'
                        : 'bg-[#1E1E24] border-[#3F3F46]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#E07A5F] shrink-0" />
                      <span
                        className={`font-bold text-[11px] sm:text-xs leading-tight ${
                          isBright ? 'text-[#27272A]' : 'text-neutral-200'
                        }`}
                      >
                        {working.length} working &bull; {idle.length} idle
                      </span>
                    </div>
                    <span
                      className={`text-[9px] font-mono ${
                        isBright ? 'text-[#71717A]' : 'text-neutral-400'
                      }`}
                    >
                      {working.length + idle.length} assigned karigars
                    </span>
                  </div>

                  {/* Lots in this Stage */}
                  <div
                    className={`mt-2 flex items-center justify-between text-[11px] ${
                      isBright ? 'text-[#71717A]' : 'text-neutral-400'
                    }`}
                  >
                    <span>Lots:</span>
                    <span
                      className={`font-mono font-bold ${
                        isBright ? 'text-[#27272A]' : 'text-neutral-200'
                      }`}
                    >
                      {stageLots.length} lot{stageLots.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  {/* Status badges if any awaiting entry or completed */}
                  {(awaitingInStage > 0 || completedInStage > 0) && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {awaitingInStage > 0 && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-600 font-bold border border-rose-500/30 animate-pulse">
                          {awaitingInStage} awaiting
                        </span>
                      )}
                      {completedInStage > 0 && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 font-bold border border-emerald-500/30">
                          {completedInStage} done
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom detail action */}
                <div
                  className={`pt-2.5 mt-2.5 border-t flex items-center justify-between text-[10px] sm:text-[11px] transition ${
                    isBright
                      ? 'border-[#E4E4E7] text-[#71717A] group-hover:text-[#E07A5F]'
                      : 'border-[#3F3F46] text-neutral-400 group-hover:text-[#E8998D]'
                  }`}
                >
                  <span className="font-medium">View Stage</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition shrink-0" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      )}
    </div>
  );
};
