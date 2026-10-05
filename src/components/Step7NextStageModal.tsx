import React, { useState, useEffect } from 'react';
import { Lot, Stage, BranchType, NEXT_STAGE_OPTIONS } from '../types';
import { useApp } from '../context/AppContext';
import { SearchableSelect } from './SearchableSelect';
import { ArrowRight, Sparkles, X, ShieldAlert, Printer } from 'lucide-react';

interface Step7NextStageModalProps {
  lot: Lot;
  onClose: () => void;
  onSuccess: (dispatchedLot: Lot) => void;
}

export const Step7NextStageModal: React.FC<Step7NextStageModalProps> = ({
  lot,
  onClose,
  onSuccess,
}) => {
  const { advanceToNextStage, karigars } = useApp();

  const isAtChhol = lot.currentStage === 'Chhol';
  const isAtPlating = lot.currentStage === 'Plating';

  // Determine available next stage options based on current stage and branching rules
  let availableStages: { stage: Stage; label: string; branch: BranchType; desc: string }[] = [];

  if (isAtChhol) {
    // AT CHHOL: EXACTLY TWO BRANCHES:
    // 1. Plain branch -> finished -> moves to Ready Stock (Plain)
    // 2. Gold branch -> continues through additional Plating stage -> then moves to Ready Stock (Gold)
    availableStages = [
      {
        stage: 'Ready Stock',
        label: 'Plain Branch → Ready Stock (Plain)',
        branch: 'plain',
        desc: 'Finished as Plain. Any defective/rejected pieces logged as scrap.',
      },
      {
        stage: 'Plating',
        label: 'Gold Branch → Plating Stage',
        branch: 'gold',
        desc: 'Continues through Plating stage (tracks weight loss only), then Ready Stock (Gold).',
      },
    ];
  } else if (isAtPlating) {
    availableStages = [
      {
        stage: 'Ready Stock',
        label: 'Ready Stock (Gold)',
        branch: 'gold',
        desc: 'Plating completed. Finished lot moves to Ready Stock (Gold).',
      },
    ];
  } else {
    availableStages = (NEXT_STAGE_OPTIONS[lot.currentStage] ?? []).map((stage, index) => ({
      stage,
      label: index === 0 ? `Next Stage: ${stage}` : stage,
      branch: 'none' as BranchType,
      desc: `Send this lot directly to ${stage}. Stages between are skipped.`,
    }));
  }

  const [selectedOption, setSelectedOption] = useState(availableStages[0] || null);
  const [selectedKarigarId, setSelectedKarigarId] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [jobWorkAmount, setJobWorkAmount] = useState<string>('');

  // Auto-suggest specialty karigar when stage option is chosen
  useEffect(() => {
    if (selectedOption?.stage && selectedOption.stage !== 'Ready Stock') {
      const match = karigars.find((k) => k.specialtyStages.includes(selectedOption.stage));
      if (match) {
        setSelectedKarigarId(match.id);
      }
    }
  }, [selectedOption, karigars]);

  // Filter karigars suitable for chosen next stage (if not Ready Stock)
  const isMovingToReadyStock = selectedOption?.stage === 'Ready Stock';
  const filteredKarigars = karigars.filter((k) =>
    selectedOption?.stage && selectedOption.stage !== 'Ready Stock'
      ? k.specialtyStages.includes(selectedOption.stage)
      : true
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    if (!selectedOption) {
      setError('Please select the next stage.');
      return;
    }

    if (!isMovingToReadyStock && !selectedKarigarId) {
      setError('Please assign a Karigar for the next stage.');
      return;
    }

    const amount = parseFloat(jobWorkAmount);
    if (!isMovingToReadyStock && (!Number.isFinite(amount) || amount < 0)) {
      setError('Enter the job-work amount for the printed slip. Use 0 if there is no charge.');
      return;
    }

    setError('');
    setIsSaving(true);
    try {
      const res = await advanceToNextStage(
        lot.id,
        selectedOption.stage,
        selectedOption.branch,
        selectedKarigarId || lot.currentKarigarId,
        isMovingToReadyStock ? 0 : Number(amount.toFixed(2))
      );

      if (res.success && res.lot) {
        onSuccess(res.lot);
      } else if (res.success) {
        onSuccess(lot);
      } else {
        setError(res.message);
      }
    } finally {
      setIsSaving(false);
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
        className="relative w-full max-w-lg my-auto max-h-[92vh] flex flex-col bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl overflow-hidden max-w-full cursor-default"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ArrowRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-100">Send to Next Production Stage</h3>
              <p className="text-xs text-neutral-400">
                Lot {lot.lotNumber} &bull; Current: {lot.currentStage} (Completed)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="p-6 space-y-5 overflow-y-auto overflow-x-hidden flex-1 min-h-0">
          {error && (
            <div className="p-3 text-xs rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300">
              Select Next Destination {isAtChhol && <span className="text-amber-400">(Branching Point)</span>}
            </label>

            <SearchableSelect
              value={selectedOption ? `${selectedOption.stage}|${selectedOption.branch}` : ''}
              onChange={(value) => {
                const option = availableStages.find(
                  (item) => `${item.stage}|${item.branch}` === value
                );
                setSelectedOption(option ?? null);
                setSelectedKarigarId('');
                setJobWorkAmount('');
              }}
              searchPlaceholder="Search destinations…"
              className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-700 text-neutral-100 text-sm focus:border-amber-500 outline-none"
              options={availableStages.map((option) => ({
                value: `${option.stage}|${option.branch}`,
                label: option.label,
              }))}
            />
            {selectedOption && (
              <p className="text-xs text-neutral-400">{selectedOption.desc}</p>
            )}
          </div>

          {/* If advancing to another stage (not directly Ready Stock), require Karigar assignment */}
          {!isMovingToReadyStock && (
            <div className="space-y-2 pt-2 border-t border-neutral-800">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300">
                Assign Karigar for {selectedOption?.stage} <span className="text-amber-400">*</span>
              </label>
              <SearchableSelect
                disabled={filteredKarigars.length === 0}
                value={selectedKarigarId}
                onChange={setSelectedKarigarId}
                placeholder={filteredKarigars.length ? 'Select a stage specialist...' : `No karigars assigned to ${selectedOption?.stage ?? 'this stage'}`}
                searchPlaceholder="Search karigars…"
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-neutral-100 text-sm focus:border-amber-500 outline-none"
                options={filteredKarigars.map((k) => ({
                  value: k.id,
                  label: `${k.name}${k.phone ? ` (${k.phone})` : ''} • Specialties: ${k.specialtyStages.join(', ')}`,
                }))}
              />
              <p className="text-[11px] text-neutral-400">
                Only karigars assigned to {selectedOption?.stage} are listed. A fresh QR code will be generated with this stage, karigar, and date.
              </p>

              <div className="pt-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                  Slip Amount (₹) <span className="text-amber-400">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={jobWorkAmount}
                  onChange={(event) => setJobWorkAmount(event.target.value)}
                  placeholder="Job-work price printed on this slip"
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-neutral-100 font-mono text-sm focus:border-amber-500 outline-none"
                />
                <p className="mt-1 text-[11px] text-neutral-500">
                  This saved amount will appear on the slip and in the karigar ledger.
                </p>
              </div>
            </div>
          )}

          {isMovingToReadyStock && (
            <div className="p-3.5 rounded-xl bg-neutral-950 border border-emerald-500/30 text-xs text-emerald-300 space-y-1">
              <div className="font-semibold flex items-center gap-1.5 text-emerald-400">
                <Sparkles className="w-4 h-4" /> Ready Stock Stock-In Confirmation
              </div>
              <p className="text-neutral-300">
                This lot will complete production and deposit into{' '}
                <span className="font-bold text-white">
                  Ready Stock ({selectedOption.branch === 'gold' ? 'Gold' : 'Plain'})
                </span>
                . Final piece counts and weight will be recorded.
              </p>
            </div>
          )}

          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 px-6 py-3.5 border-t border-neutral-800 bg-neutral-950 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-sans shadow-lg shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-wait disabled:active:scale-100"
            >
              {isSaving ? (
                <span>Saving...</span>
              ) : isMovingToReadyStock ? (
                <>
                  <ArrowRight className="w-4 h-4" />
                  <span>Move to Ready Stock</span>
                </>
              ) : (
                <>
                  <Printer className="w-4 h-4" />
                  <span>Dispatch &amp; Print Next Slip &rarr;</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
