import React, { useMemo, useState } from 'react';
import { Stage, Lot, Design, ALL_ACTIVE_STAGES } from '../types';
import { useApp } from '../context/AppContext';
import { useAuthAndTheme } from '../context/AuthAndThemeContext';
import {
  BriefcaseBusiness,
  ChevronDown,
  ChevronRight,
  CircleOff,
  Layers,
  Plus,
  Pencil,
  Printer,
  Users,
  X,
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
  onOpenLot,
}) => {
  const { karigars, lots, designs, confirmArrival, createKarigar, updateKarigarStages } = useApp();
  const { theme } = useAuthAndTheme();
  const isBright = theme === 'bright';
  const [expandedKarigarId, setExpandedKarigarId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [specialtyStages, setSpecialtyStages] = useState<Stage[]>([stage]);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editingKarigarId, setEditingKarigarId] = useState<string | null>(null);
  const [editSpecialtyStages, setEditSpecialtyStages] = useState<Stage[]>([]);
  const [editError, setEditError] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const activeLots = useMemo(
    () => lots.filter((lot) => lot.status === 'in_progress' || lot.status === 'arrived_awaiting_entry' || lot.status === 'awaiting_wax_receipt'),
    [lots]
  );

  const karigarRows = useMemo(() => karigars
    .filter((karigar) => karigar.specialtyStages.includes(stage))
    .map((karigar) => {
    const assignments = activeLots.filter((lot) => lot.currentKarigarId === karigar.id);
    return {
      karigar,
      assignments,
      isWorking: assignments.length > 0,
      isWorkingAtThisStage: assignments.some((lot) => lot.currentStage === stage),
    };
  }).sort((left, right) => {
    if (left.isWorkingAtThisStage !== right.isWorkingAtThisStage) return left.isWorkingAtThisStage ? -1 : 1;
    if (left.isWorking !== right.isWorking) return left.isWorking ? -1 : 1;
    return left.karigar.name.localeCompare(right.karigar.name);
  }), [activeLots, karigars, stage]);

  const workingCount = karigarRows.filter((row) => row.isWorking).length;
  const workingAtStageCount = karigarRows.filter((row) => row.isWorkingAtThisStage).length;

  const toggleSpecialty = (specialty: Stage) => {
    setSpecialtyStages((current) => current.includes(specialty)
      ? current.filter((item) => item !== specialty)
      : [...current, specialty]);
    setFormError('');
  };

  const handleCreateKarigar = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError('');
    setIsSaving(true);
    try {
      await createKarigar({ name, phone, specialtyStages });
      setName('');
      setPhone('');
      setSpecialtyStages([stage]);
      setShowCreateForm(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not save the karigar.');
    } finally {
      setIsSaving(false);
    }
  };

  const startEditingStages = (karigarId: string, stages: Stage[]) => {
    setEditingKarigarId(karigarId);
    setEditSpecialtyStages(stages);
    setEditError('');
  };

  const toggleEditedSpecialty = (specialty: Stage) => {
    setEditSpecialtyStages((current) => current.includes(specialty)
      ? current.filter((item) => item !== specialty)
      : [...current, specialty]);
    setEditError('');
  };

  const handleSaveEditedStages = async (event: React.FormEvent, karigarId: string) => {
    event.preventDefault();
    setEditError('');
    if (editSpecialtyStages.length === 0) {
      setEditError('Select at least one work stage.');
      return;
    }
    try {
      setIsSavingEdit(true);
      await updateKarigarStages(karigarId, editSpecialtyStages);
      setEditingKarigarId(null);
      setEditSpecialtyStages([]);
    } catch (error) {
      setEditError(error instanceof Error ? error.message : 'Could not update the work stages.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const panelClass = isBright
    ? 'bg-white border-[#E4E4E7] text-[#18181B]'
    : 'bg-neutral-950 border-neutral-800 text-neutral-100';

  return (
    <div
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto overflow-x-hidden w-full max-w-full no-print cursor-pointer"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className={`relative w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden my-4 border transition-colors cursor-default ${
          isBright ? 'bg-white border-[#E4E4E7] text-[#18181B]' : 'bg-neutral-900 border-neutral-700 text-neutral-100'
        }`}
      >
        <div className={`flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b ${
          isBright ? 'bg-[#FAFAFA] border-[#E4E4E7]' : 'bg-neutral-950 border-neutral-800'
        }`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-2 rounded-xl border shrink-0 ${
              isBright ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>
              <Layers className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base sm:text-lg">Stage Detail — {stage}</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-mono font-bold border ${
                  isBright ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-neutral-800 text-amber-400 border-neutral-700'
                }`}>
                  {workingAtStageCount} working here
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isBright ? 'text-[#71717A]' : 'text-neutral-400'}`}>
                {karigarRows.length} assigned to {stage} • {workingCount} working • {karigarRows.length - workingCount} not working
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl shrink-0 transition ${isBright ? 'text-[#71717A] hover:bg-[#F4F4F6]' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`}
            aria-label="Close stage details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto overflow-x-hidden">
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => {
                setShowCreateForm((current) => !current);
                setFormError('');
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-neutral-950 hover:bg-amber-300"
            >
              <Plus className="h-4 w-4" /> Add Karigar
            </button>

            {showCreateForm && (
              <form onSubmit={handleCreateKarigar} className={`space-y-4 rounded-xl border p-4 ${
                isBright ? 'border-amber-200 bg-amber-50/60' : 'border-amber-500/30 bg-neutral-950'
              }`}>
                <div>
                  <h4 className="text-sm font-bold">New Karigar</h4>
                  <p className={`mt-1 text-xs ${isBright ? 'text-stone-600' : 'text-neutral-400'}`}>
                    {stage} is selected. Add any other stages this karigar can work in.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="space-y-1 text-xs font-semibold">
                    <span>Name</span>
                    <input
                      type="text"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      required
                      maxLength={100}
                      placeholder="Karigar name"
                      className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-amber-500 ${isBright ? 'border-stone-300 bg-white text-stone-900' : 'border-neutral-700 bg-neutral-900 text-white'}`}
                    />
                  </label>
                  <label className="space-y-1 text-xs font-semibold">
                    <span>Mobile number <span className={isBright ? 'text-stone-400' : 'text-neutral-500'}>(optional)</span></span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      maxLength={20}
                      placeholder="+91 90000 00000"
                      className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-amber-500 ${isBright ? 'border-stone-300 bg-white text-stone-900' : 'border-neutral-700 bg-neutral-900 text-white'}`}
                    />
                  </label>
                </div>
                <fieldset className="space-y-2">
                  <legend className="text-xs font-semibold">Work stages</legend>
                  <div className="flex flex-wrap gap-2">
                    {ALL_ACTIVE_STAGES.map((specialty) => (
                      <label key={specialty} className={`cursor-pointer rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                        specialtyStages.includes(specialty)
                          ? 'border-amber-400 bg-amber-400 text-neutral-950'
                          : isBright ? 'border-stone-300 bg-white text-stone-700' : 'border-neutral-700 bg-neutral-900 text-neutral-300'
                      }`}>
                        <input
                          type="checkbox"
                          checked={specialtyStages.includes(specialty)}
                          onChange={() => toggleSpecialty(specialty)}
                          disabled={specialty === stage}
                          className="sr-only"
                        />
                        {specialty}
                      </label>
                    ))}
                  </div>
                </fieldset>
                {formError && <p role="alert" className="text-xs text-red-500">{formError}</p>}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isSaving || specialtyStages.length === 0}
                    className="rounded-lg bg-amber-400 px-4 py-2 text-xs font-bold text-neutral-950 hover:bg-amber-300 disabled:opacity-50"
                  >
                    {isSaving ? 'Saving…' : 'Save Karigar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    disabled={isSaving}
                    className={`rounded-lg border px-4 py-2 text-xs font-semibold ${isBright ? 'border-stone-300 text-stone-700' : 'border-neutral-700 text-neutral-300'}`}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${isBright ? 'text-slate-700' : 'text-neutral-300'}`}>
                <Users className="w-4 h-4 text-amber-500" /> {stage} Karigars ({karigarRows.length})
              </h4>
              <span className={`text-[10px] sm:text-[11px] ${isBright ? 'text-slate-500' : 'text-neutral-500'}`}>Tap a karigar to see assignments</span>
            </div>

            {karigarRows.length === 0 ? (
              <div className={`p-6 rounded-xl border text-center text-xs ${panelClass}`}>No karigars are assigned to {stage} yet.</div>
            ) : (
              <div className="space-y-2.5">
                {karigarRows.map(({ karigar, assignments, isWorking, isWorkingAtThisStage }) => {
                  const isExpanded = expandedKarigarId === karigar.id;
                  const primaryAssignment = assignments[0];
                  return (
                    <div key={karigar.id} className={`rounded-xl border overflow-hidden transition ${
                      isWorkingAtThisStage
                        ? isBright ? 'bg-white border-amber-300 shadow-sm' : 'bg-neutral-950 border-amber-500/40'
                        : panelClass
                    }`}>
                      <button
                        type="button"
                        onClick={() => setExpandedKarigarId(isExpanded ? null : karigar.id)}
                        className={`w-full p-3.5 flex items-center justify-between gap-3 text-left transition ${isBright ? 'hover:bg-slate-50' : 'hover:bg-neutral-900'}`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                            isWorking ? 'bg-emerald-500/15 text-emerald-500' : isBright ? 'bg-slate-100 text-slate-500' : 'bg-neutral-800 text-neutral-400'
                          }`}>
                            {isWorking ? <BriefcaseBusiness className="w-4 h-4" /> : <CircleOff className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm truncate">{karigar.name}</span>
                            </div>
                            {karigar.phone && (
                              <div className={`text-[10px] font-mono mt-0.5 ${isBright ? 'text-slate-500' : 'text-neutral-500'}`}>
                                {karigar.phone}
                              </div>
                            )}
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {karigar.specialtyStages.length > 0 ? karigar.specialtyStages.map((specialty) => (
                                <span
                                  key={specialty}
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                    specialty === stage
                                      ? 'bg-amber-500/15 text-amber-500'
                                      : isBright ? 'bg-slate-100 text-slate-600' : 'bg-neutral-800 text-neutral-400'
                                  }`}
                                >
                                  {specialty}
                                </span>
                              )) : (
                                <span className={`text-[9px] ${isBright ? 'text-slate-400' : 'text-neutral-600'}`}>No work stages assigned</span>
                              )}
                            </div>
                            {primaryAssignment && (
                              <div className={`text-[10px] mt-1 truncate ${isBright ? 'text-slate-600' : 'text-neutral-400'}`}>
                                {primaryAssignment.currentStage} • {primaryAssignment.lotNumber}
                                {assignments.length > 1 ? ` • +${assignments.length - 1} more` : ''}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-bold border ${
                            isWorking
                              ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                              : isBright ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                          }`}>
                            {isWorking ? 'WORKING' : 'NOT WORKING'}
                          </span>
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className={`px-3.5 pb-3.5 pt-3 border-t ${isBright ? 'border-slate-200 bg-slate-50/70' : 'border-neutral-800 bg-neutral-900/60'}`}>
                          {editingKarigarId === karigar.id ? (
                            <form onSubmit={(event) => void handleSaveEditedStages(event, karigar.id)} className={`mb-3 rounded-xl border p-3 ${isBright ? 'border-amber-200 bg-amber-50' : 'border-amber-500/30 bg-neutral-950'}`}>
                              <div className="mb-2">
                                <div className="text-xs font-bold">Edit work stages for {karigar.name}</div>
                                <div className={`text-[10px] mt-0.5 ${isBright ? 'text-slate-600' : 'text-neutral-400'}`}>Select every stage this karigar can work in.</div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {ALL_ACTIVE_STAGES.map((specialty) => (
                                  <label key={specialty} className={`cursor-pointer rounded-lg border px-2.5 py-1.5 text-[10px] font-bold transition ${
                                    editSpecialtyStages.includes(specialty)
                                      ? 'border-amber-400 bg-amber-400 text-neutral-950'
                                      : isBright ? 'border-stone-300 bg-white text-stone-700' : 'border-neutral-700 bg-neutral-900 text-neutral-300'
                                  }`}>
                                    <input type="checkbox" checked={editSpecialtyStages.includes(specialty)} onChange={() => toggleEditedSpecialty(specialty)} className="sr-only" />
                                    {specialty}
                                  </label>
                                ))}
                              </div>
                              {editError && <p role="alert" className="mt-2 text-[10px] text-red-500">{editError}</p>}
                              <div className="mt-3 flex gap-2">
                                <button type="submit" disabled={isSavingEdit} className="rounded-lg bg-amber-400 px-3 py-1.5 text-[10px] font-bold text-neutral-950 disabled:opacity-50">
                                  {isSavingEdit ? 'Saving…' : 'Save Stages'}
                                </button>
                                <button type="button" disabled={isSavingEdit} onClick={() => setEditingKarigarId(null)} className={`rounded-lg border px-3 py-1.5 text-[10px] font-semibold ${isBright ? 'border-stone-300 bg-white text-stone-700' : 'border-neutral-700 bg-neutral-900 text-neutral-300'}`}>
                                  Cancel
                                </button>
                              </div>
                            </form>
                          ) : (
                            <button
                              type="button"
                              onClick={() => startEditingStages(karigar.id, karigar.specialtyStages)}
                              className={`mb-3 inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[10px] font-semibold ${isBright ? 'border-stone-300 bg-white text-stone-700 hover:bg-stone-100' : 'border-neutral-700 bg-neutral-800 text-neutral-200 hover:bg-neutral-700'}`}
                            >
                              <Pencil className="h-3 w-3" /> Edit Work Stages
                            </button>
                          )}
                          {assignments.length === 0 ? (
                            <div className="py-3 text-center">
                              <CircleOff className={`w-5 h-5 mx-auto mb-1.5 ${isBright ? 'text-slate-400' : 'text-neutral-500'}`} />
                              <p className={`text-xs font-semibold ${isBright ? 'text-slate-600' : 'text-neutral-400'}`}>Not working on any active lot</p>
                              <p className={`text-[10px] mt-1 ${isBright ? 'text-slate-500' : 'text-neutral-500'}`}>
                                Work stages: {karigar.specialtyStages.join(', ') || 'None assigned'}
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {assignments.map((lot) => {
                                const design = designs.find((item) => item.id === lot.designId);
                                const record = lot.history[lot.history.length - 1];
                                const isAwaitingWax = lot.status === 'awaiting_wax_receipt';
                                const sentWeight = lot.currentStage === 'Wax'
                                  ? record?.weightReceived ?? lot.initialWeight
                                  : record?.weightSent ?? lot.initialWeight;
                                const sentPieces = lot.currentStage === 'Wax'
                                  ? record?.estimatedPieces ?? lot.initialPieces
                                  : record?.piecesSent ?? lot.initialPieces;
                                return (
                                  <div key={lot.id} className={`p-3 rounded-xl border ${panelClass}`}>
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex items-center gap-3 min-w-0">
                                        {design && (
                                          <img src={design.photoUrl} alt={design.name} className="w-11 h-11 rounded-lg object-cover border border-neutral-700/40 shrink-0" />
                                        )}
                                        <div className="min-w-0">
                                          <div className="font-bold text-xs truncate">{lot.designName}</div>
                                          <div className="font-mono text-[11px] font-bold text-amber-500">Lot: {lot.lotNumber}</div>
                                        </div>
                                      </div>
                                      <span className={`px-2 py-1 rounded-lg text-[10px] font-bold shrink-0 ${
                                        lot.currentStage === stage ? 'bg-amber-500/15 text-amber-500' : 'bg-blue-500/15 text-blue-500'
                                      }`}>
                                        {lot.currentStage}
                                      </span>
                                    </div>
                                    <div className={`grid grid-cols-2 gap-2 mt-3 text-[10px] ${isBright ? 'text-slate-600' : 'text-neutral-400'}`}>
                                      <div>{isAwaitingWax ? 'Wax received' : 'Material'}: <span className="font-mono font-bold">{isAwaitingWax ? 'Pending' : `${sentWeight} g`}</span></div>
                                      <div>{isAwaitingWax ? 'Ordered' : 'Pieces'}: <span className="font-mono font-bold">{isAwaitingWax ? `${record?.orderedQuantity ?? '—'} pcs` : sentPieces}</span></div>
                                      <div>Status: <span className="font-semibold">{isAwaitingWax ? 'Awaiting Wax receipt' : lot.status === 'arrived_awaiting_entry' ? 'Arrived' : 'In progress'}</span></div>
                                      <div>{isAwaitingWax ? 'Ordered' : 'Sent'}: <span className="font-mono font-bold">{isAwaitingWax ? (record?.dateOrdered ?? lot.createdAt) : (record?.dateSent ?? lot.createdAt)}</span></div>
                                    </div>
                                    <div className={`flex items-center gap-1.5 mt-3 pt-2.5 border-t ${isBright ? 'border-slate-200' : 'border-neutral-800'}`}>
                                      {design && !isAwaitingWax && (
                                        <button type="button" onClick={() => onOpenSlip(lot, design)} className={`p-2 rounded-lg border flex items-center gap-1 text-[10px] font-semibold ${isBright ? 'bg-white border-slate-300' : 'bg-neutral-800 border-neutral-700'}`}>
                                          <Printer className="w-3.5 h-3.5 text-amber-500" /> Slip
                                        </button>
                                      )}
                                      {lot.status === 'in_progress' && (
                                        <button type="button" onClick={() => void confirmArrival(lot.lotNumber)} className="flex-1 px-2 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] font-semibold">
                                          Confirm Arrival
                                        </button>
                                      )}
                                      {lot.status === 'arrived_awaiting_entry' && design && (
                                        <button type="button" onClick={() => onOpenStep6(lot, design)} className="flex-1 px-2 py-2 rounded-lg bg-emerald-500 text-neutral-950 text-[10px] font-bold">
                                          Enter Return Data
                                        </button>
                                      )}
                                      <button type="button" onClick={() => onOpenLot(lot)} className={`px-2.5 py-2 rounded-lg border text-[10px] ${isBright ? 'bg-white border-slate-300' : 'bg-neutral-800 border-neutral-700'}`}>
                                        Lot Details
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className={`px-6 py-3.5 border-t flex justify-between items-center text-xs ${
          isBright ? 'bg-[#FAFAFA] border-[#E4E4E7] text-slate-500' : 'bg-neutral-950 border-neutral-800 text-neutral-400'
        }`}>
          <span>{karigarRows.length} karigars assigned to {stage}</span>
          <button type="button" onClick={onClose} className={`px-4 py-1.5 rounded-xl font-medium border ${isBright ? 'bg-white text-slate-700 border-slate-300' : 'bg-neutral-800 text-neutral-200 border-neutral-700'}`}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
