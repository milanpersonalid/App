import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuthAndTheme } from '../../context/AuthAndThemeContext';
import { SearchableSelect } from '../SearchableSelect';
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
  Trash2,
  X,
  Pencil,
} from 'lucide-react';
import { DeleteConfirmationModal } from '../DeleteConfirmationModal';

interface LotsViewProps {
  onOpenCreateLot: () => void;
  onOpenSlip: (lot: Lot, design: Design) => void;
  onOpenStep6: (lot: Lot, design: Design) => void;
  onOpenStep7: (lot: Lot) => void;
  onOpenLot: (lot: Lot) => void;
  onOpenEditLot: (lot: Lot) => void;
}

export const LotsView: React.FC<LotsViewProps> = ({
  onOpenCreateLot,
  onOpenSlip,
  onOpenStep6,
  onOpenStep7,
  onOpenLot,
  onOpenEditLot,
}) => {
  const { lots, designs, confirmArrival, deleteLot } = useApp();
  const { theme } = useAuthAndTheme();
  const isBright = theme === 'bright';

  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteTarget, setDeleteTarget] = useState<Lot | null>(null);
  const [previewDesign, setPreviewDesign] = useState<Design | null>(null);


  const lotCreatedTime = (lot: Lot) => {
    const generatedIdTimestamp = /^lot-(\d+)$/.exec(lot.id)?.[1];
    if (generatedIdTimestamp) return Number(generatedIdTimestamp);
    const createdAtTimestamp = Date.parse(lot.createdAt);
    return Number.isFinite(createdAtTimestamp) ? createdAtTimestamp : 0;
  };

  const filteredLots = lots.filter((lot) => {
    const matchesSearch =
      lot.lotNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lot.designName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lot.currentKarigarName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStage = stageFilter === 'all' || lot.currentStage === stageFilter;
    const matchesStatus = statusFilter === 'all' || lot.status === statusFilter;

    return matchesSearch && matchesStage && matchesStatus;
  }).sort((left, right) => lotCreatedTime(right) - lotCreatedTime(left));

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
            <SearchableSelect
              value={stageFilter}
              onChange={setStageFilter}
              bright={isBright}
              className={`px-2.5 py-1.5 rounded-lg border text-xs outline-none transition ${
                isBright
                  ? 'bg-[#F8FAFC] border-[#CBD5E1] text-[#0F172A] focus:border-amber-500'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-200 focus:border-amber-500'
              }`}
              options={[
                { value: 'all', label: 'All Stages' },
                ...['Wax', 'Casting', 'Buff', 'Zabora', 'Dull', 'Chhol', 'Plating', 'Ready Stock'].map((stage) => ({ value: stage, label: stage })),
              ]}
            />

            <SearchableSelect
              value={statusFilter}
              onChange={setStatusFilter}
              bright={isBright}
              className={`px-2.5 py-1.5 rounded-lg border text-xs outline-none transition ${
                isBright
                  ? 'bg-[#F8FAFC] border-[#CBD5E1] text-[#0F172A] focus:border-amber-500'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-200 focus:border-amber-500'
              }`}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'awaiting_wax_receipt', label: 'Awaiting Wax Receipt' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'arrived_awaiting_entry', label: 'Arrived (Red)' },
                { value: 'stage_complete', label: 'Complete (Green)' },
                { value: 'ready_stock', label: 'Ready Stock' },
              ]}
            />
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

            const isAwaitingWaxReceipt = lot.status === 'awaiting_wax_receipt';
            const isArrivedAwaitingEntry = lot.status === 'arrived_awaiting_entry';
            const isStageComplete = lot.status === 'stage_complete';
            const isInProgress = lot.status === 'in_progress';
            const isReadyStock = lot.status === 'ready_stock';

            return (
              <div
                  key={lot.id}
                  className={`relative p-3 rounded-xl border transition flex flex-col justify-between gap-3 shadow-sm ${
                  isAwaitingWaxReceipt
                    ? isBright
                      ? 'bg-violet-50/60 border-violet-300 hover:border-violet-400'
                      : 'bg-violet-950/15 border-violet-500/35 hover:border-violet-500/60'
                    : isBright
                    ? 'bg-white border-[#E4E4E7] hover:border-slate-300'
                    : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                <div className="absolute top-2.5 right-2.5 z-10 flex flex-col items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onOpenEditLot(lot)}
                    title="Edit lot"
                    aria-label={`Edit lot ${lot.lotNumber}`}
                    className="p-0.5 text-amber-500/70 hover:text-amber-400 transition"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(lot)}
                    title="Delete lot"
                    aria-label={`Delete lot ${lot.lotNumber}`}
                    className="p-0.5 text-red-500/65 hover:text-red-500 transition"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                {/* Left info */}
                <div className="flex items-center gap-4 min-w-0 pr-12">
                  {design && (
                    <button
                      type="button"
                      onClick={() => setPreviewDesign(design)}
                      className="flex-shrink-0 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                      aria-label={`View larger image of ${design.name}`}
                      title="View image"
                    >
                        {design.photoUrl && (
                          <img
                            src={design.photoUrl}
                            alt={design.name}
                            loading="lazy"
                            className={`w-14 h-14 rounded-xl object-cover border ${
                              isBright ? 'border-slate-200' : 'border-neutral-700'
                            }`}
                          />
                        )}
                    </button>
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
                      {isAwaitingWaxReceipt && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-500 border border-violet-500/35 font-bold">
                          Awaiting Wax Receipt
                        </span>
                      )}
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
                      className={`text-[11px] ${
                        isBright ? 'text-slate-500' : 'text-neutral-400'
                      }`}
                    >
                      Karigar:{' '}
                      <strong className={isBright ? 'text-slate-900' : 'text-neutral-200'}>
                        {lot.currentKarigarName}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  {design && !isAwaitingWaxReceipt && (
                    <button
                      onClick={() => onOpenSlip(lot, design)}
                      title="Print Stage Slip"
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
                      Confirm Arrival
                    </button>
                  )}

                  {isArrivedAwaitingEntry && design && (
                    <button
                      onClick={() => onOpenStep6(lot, design)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs shadow-md transition active:scale-95"
                    >
                      Enter Return Data
                    </button>
                  )}

                  {isStageComplete && (
                    <button
                      onClick={() => onOpenStep7(lot)}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs shadow-md transition active:scale-95"
                    >
                      Send to Next Stage &rarr;
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
      <DeleteConfirmationModal
        open={Boolean(deleteTarget)}
        bright={isBright}
        title="Delete lot?"
        message={deleteTarget ? `Delete lot ${deleteTarget.lotNumber}? This permanently removes its production history.` : ''}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={deleteTarget ? () => deleteLot(deleteTarget.id) : undefined}
      />
      {previewDesign && (
        <div
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) setPreviewDesign(null);
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${previewDesign.name} design image`}
            className="relative w-full max-w-4xl max-h-[92vh] rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-700 shadow-2xl"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
              <div className="min-w-0">
                <h3 className="font-semibold text-sm text-white truncate">{previewDesign.name}</h3>
                <p className="text-xs text-neutral-400 font-mono">{previewDesign.barcode}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDesign(null)}
                className="p-2 ml-3 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800"
                aria-label="Close image preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center justify-center p-3 max-h-[calc(92vh-4.5rem)] overflow-auto">
              {previewDesign.photoUrl && (
                <img
                  src={previewDesign.photoUrl}
                  alt={previewDesign.name}
                  loading="eager"
                  className="max-w-full max-h-[calc(92vh-6rem)] object-contain rounded-lg"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
