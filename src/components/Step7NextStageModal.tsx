import React, { useState, useEffect } from 'react';
import { Lot, Stage, BranchType, Karigar } from '../types';
import { useApp } from '../context/AppContext';
import { ArrowRight, Sparkles, Check, X, ShieldAlert, Printer } from 'lucide-react';

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
    // Normal fixed sequence: Wax → Casting → Buff → Zabora → Dull → Chhol
    const sequence: Stage[] = ['Wax', 'Casting', 'Buff', 'Zabora', 'Dull', 'Chhol'];
    const currentIndex = sequence.indexOf(lot.currentStage);
    if (currentIndex !== -1 && currentIndex < sequence.length - 1) {
      const nextStg = sequence[currentIndex + 1];
      availableStages = [
        {
          stage: nextStg,
          label: `Next Stage: ${nextStg}`,
          branch: 'none',
          desc: `Proceed to ${nextStg} stage in fixed sequence.`,
        },
      ];
    }
  }

  const [selectedOption, setSelectedOption] = useState(availableStages[0] || null);
  const [selectedKarigarId, setSelectedKarigarId] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Auto-suggest specialty karigar when stage option is chosen
  useEffect(() => {
    if (selectedOption?.stage && selectedOption.stage !== 'Ready Stock') {
      const match = karigars.find((k) => k.specialtyStages.includes(selectedOption.stage));
      if (match) {
        setSelectedKarigarId(match.id);
      } else if (karigars.length > 0 && !selectedKarigarId) {
        setSelectedKarigarId(karigars[0].id);
      }
    }
  }, [selectedOption, karigars]);

  // Filter karigars suitable for chosen next stage (if not Ready Stock)
  const isMovingToReadyStock = selectedOption?.stage === 'Ready Stock';
  const filteredKarigars = karigars.filter((k) =>
    selectedOption?.stage && selectedOption.stage !== 'Ready Stock'
      ? k.specialtyStages.includes(selectedOption.stage) || true // Allow any karigar, prioritize specialty
      : true
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOption) {
      setError('Please select the next stage.');
      return;
    }

    if (!isMovingToReadyStock && !selectedKarigarId) {
      setError('Please assign a Karigar for the next stage.');
      return;
    }

    const res = advanceToNextStage(
      lot.id,
      selectedOption.stage,
      selectedOption.branch,
      selectedKarigarId || lot.currentKarigarId
    );

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
      <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl overflow-hidden my-6 max-w-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950">
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
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

            {availableStages.map((opt, idx) => {
              const isSelected = selectedOption?.stage === opt.stage && selectedOption?.branch === opt.branch;
              return (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedOption(opt);
                    setSelectedKarigarId('');
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500/40 text-neutral-100'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm flex items-center gap-2">
                      {opt.label}
                      {opt.branch === 'gold' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-mono font-bold">
                          GOLD BRANCH
                        </span>
                      )}
                      {opt.branch === 'plain' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-400/20 text-blue-300 font-mono font-bold">
                          PLAIN BRANCH
                        </span>
                      )}
                    </span>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? 'border-amber-400 bg-amber-400 text-neutral-950'
                          : 'border-neutral-700'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">{opt.desc}</p>
                </div>
              );
            })}
          </div>

          {/* If advancing to another stage (not directly Ready Stock), require Karigar assignment */}
          {!isMovingToReadyStock && (
            <div className="space-y-2 pt-2 border-t border-neutral-800">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300">
                Assign Karigar for {selectedOption?.stage} <span className="text-amber-400">*</span>
              </label>
              <select
                required
                value={selectedKarigarId}
                onChange={(e) => setSelectedKarigarId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-neutral-100 text-sm focus:border-amber-500 outline-none"
              >
                <option value="">Select a Karigar...</option>
                {filteredKarigars.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.name} ({k.phone}) &bull; Specialties: {k.specialtyStages.join(', ')}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-neutral-400">
                A fresh QR code will be generated containing this stage, karigar, and date.
              </p>
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

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-sans shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
            >
              {isMovingToReadyStock ? (
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
