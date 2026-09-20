import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuthAndTheme } from '../../context/AuthAndThemeContext';
import { Design, CalibrationTarget } from '../../types';
import { generateBarcodeSvg } from '../../utils/qrBarcode';
import {
  Sparkles,
  Plus,
  Scale,
  RefreshCw,
  Search,
  Layers,
  AlertTriangle,
  Barcode,
  Check,
} from 'lucide-react';

interface DesignsViewProps {
  onOpenCreateDesign: () => void;
  onOpenCreateLotWithDesign: (designId: string) => void;
}

export const DesignsView: React.FC<DesignsViewProps> = ({
  onOpenCreateDesign,
  onOpenCreateLotWithDesign,
}) => {
  const { designs, recalibrateDesign, updateLowStockThreshold } = useApp();
  const { theme } = useAuthAndTheme();
  const isBright = theme === 'bright';
  const [searchQuery, setSearchQuery] = useState('');

  // Inline recalibration state
  const [recalibratingDesignId, setRecalibratingDesignId] = useState<string | null>(null);
  const [recalTarget, setRecalTarget] = useState<CalibrationTarget>('wax');
  const [recalWeight, setRecalWeight] = useState<string>('');
  const [recalPieces, setRecalPieces] = useState<string>('');

  // Inline threshold edit state
  const [editingThresholdId, setEditingThresholdId] = useState<string | null>(null);
  const [newThresholdValue, setNewThresholdValue] = useState<string>('');

  const filteredDesigns = designs.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.orderRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.barcode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSaveRecalibration = (designId: string) => {
    const w = parseFloat(recalWeight);
    const p = parseInt(recalPieces, 10);
    if (w > 0 && p > 0) {
      const newAvg = w / p;
      recalibrateDesign(designId, newAvg, recalTarget);
      setRecalibratingDesignId(null);
      setRecalWeight('');
      setRecalPieces('');
    }
  };

  const handleSaveThreshold = (designId: string) => {
    const val = parseInt(newThresholdValue, 10);
    if (val > 0) {
      updateLowStockThreshold(designId, val);
      setEditingThresholdId(null);
    }
  };

  return (
    <div className="space-y-6 pb-12 overflow-x-hidden w-full max-w-full">
      {/* Top Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-100 font-brand flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            Designs
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search design, ref, barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 text-xs outline-none focus:border-amber-500"
            />
          </div>
          <button
            onClick={onOpenCreateDesign}
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" /> Create Design
          </button>
        </div>
      </div>

      {/* Designs Mobile List */}
      <div className="flex flex-col gap-3.5">
        {filteredDesigns.map((design) => {
          const barcodeSvg = generateBarcodeSvg(design.barcode, 20);

          const isRecalibrating = recalibratingDesignId === design.id;
          const isEditingThreshold = editingThresholdId === design.id;

          return (
            <div
              key={design.id}
              className={`p-3.5 rounded-2xl border flex flex-col justify-between space-y-3.5 transition shadow-sm ${
                isBright
                  ? 'bg-white border-[#E4E4E7] hover:border-amber-400'
                  : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <div>
                {/* Header: Photo & Title */}
                <div className="flex items-start gap-3 mb-2.5">
                  <img
                    src={design.photoUrl}
                    alt={design.name}
                    className={`w-16 h-16 rounded-xl object-cover border flex-shrink-0 ${
                      isBright ? 'border-[#E2E8F0]' : 'border-neutral-700'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-amber-500 font-semibold">
                        {design.orderRef}
                      </span>
                    </div>
                    <h3
                      className={`font-bold text-sm truncate mt-0.5 ${
                        isBright ? 'text-[#0F172A]' : 'text-neutral-100'
                      }`}
                    >
                      {design.name}
                    </h3>

                    {/* Permanent Barcode Display */}
                    <div className="mt-1.5 px-2 py-1 rounded-lg bg-white inline-flex flex-col items-center justify-center max-w-[130px] overflow-hidden border border-neutral-200/80 shadow-xs">
                      <div className="w-full flex justify-center overflow-hidden" dangerouslySetInnerHTML={{ __html: barcodeSvg }} />
                    </div>
                  </div>
                </div>

                {/* Key Spec Metrics: 4-Tier Calibration System */}
                <div
                  className={`p-2.5 rounded-xl border text-xs space-y-2.5 ${
                    isBright
                      ? 'bg-[#F8FAFC] border-[#E2E8F0]'
                      : 'bg-neutral-900 border-neutral-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isBright ? 'text-slate-600' : 'text-neutral-400'}`}>
                      Stage Weight Baselines (4 Calibration Tiers)
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] ${isBright ? 'text-slate-500' : 'text-neutral-400'}`}>
                        Alert:
                      </span>
                      {isEditingThreshold ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={newThresholdValue}
                            onChange={(e) => setNewThresholdValue(e.target.value)}
                            className={`w-14 px-1 py-0.5 rounded border text-xs font-mono ${
                              isBright
                                ? 'bg-white border-amber-500 text-[#0F172A]'
                                : 'bg-neutral-950 border-amber-500 text-neutral-100'
                            }`}
                          />
                          <button
                            onClick={() => handleSaveThreshold(design.id)}
                            className="p-1 rounded bg-amber-400 text-neutral-950"
                          >
                            <Check className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingThresholdId(design.id);
                            setNewThresholdValue(design.lowStockThreshold.toString());
                          }}
                          className="font-mono font-bold text-xs text-amber-500 hover:underline flex items-center gap-0.5"
                          title="Click to edit low stock threshold"
                        >
                          {design.lowStockThreshold} pcs
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-dashed border-neutral-700/40">
                    <div>
                      <span className={`block text-[10px] ${isBright ? 'text-slate-500' : 'text-neutral-400'}`}>
                        Wax Stage
                      </span>
                      <span className="font-mono font-bold text-xs text-amber-500">
                        {(design.waxAvgWeightPerPiece ?? 0.2).toFixed(4)} g
                      </span>
                    </div>

                    <div>
                      <span className={`block text-[10px] ${isBright ? 'text-slate-500' : 'text-neutral-400'}`}>
                        Metal / Post-Cast
                      </span>
                      <span className="font-mono font-bold text-xs text-blue-400">
                        {(design.metalAvgWeightPerPiece ?? 1.5).toFixed(4)} g
                      </span>
                    </div>

                    <div>
                      <span className={`block text-[10px] ${isBright ? 'text-slate-500' : 'text-neutral-400'}`}>
                        Post-Chhol Plain
                      </span>
                      <span className="font-mono font-bold text-xs text-emerald-500">
                        {(design.plainAvgWeightPerPiece ?? 1.4).toFixed(4)} g
                      </span>
                    </div>

                    <div>
                      <span className={`block text-[10px] ${isBright ? 'text-slate-500' : 'text-neutral-400'}`}>
                        Post-Chhol Gold
                      </span>
                      <span className="font-mono font-bold text-xs text-amber-400">
                        {(design.goldAvgWeightPerPiece ?? 1.45).toFixed(4)} g
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recalibration Section */}
                {isRecalibrating && (
                  <div className="mt-3 p-3.5 rounded-xl bg-neutral-900 border border-amber-500/40 space-y-2.5 text-xs">
                    <div className="font-semibold text-amber-300 flex items-center justify-between">
                      <span>Recalibrate Stage Baseline Weight</span>
                      <button
                        onClick={() => setRecalibratingDesignId(null)}
                        className="text-neutral-400 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>

                    <div>
                      <label className="block text-[10px] text-neutral-400 mb-1">
                        Select Target Calibration Tier:
                      </label>
                      <select
                        value={recalTarget}
                        onChange={(e) => {
                          const target = e.target.value as CalibrationTarget;
                          setRecalTarget(target);
                          let val = design.waxAvgWeightPerPiece ?? 0.2;
                          if (target === 'metal') val = design.metalAvgWeightPerPiece ?? 1.5;
                          if (target === 'plain') val = design.plainAvgWeightPerPiece ?? 1.4;
                          if (target === 'gold') val = design.goldAvgWeightPerPiece ?? 1.45;
                          setRecalWeight(val.toFixed(4));
                          setRecalPieces('1');
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-950 border border-neutral-700 text-xs font-mono text-neutral-100 outline-none"
                      >
                        <option value="wax">Wax Stage Baseline (waxAvgWeightPerPiece)</option>
                        <option value="metal">Metal / Post-Cast Baseline (metalAvgWeightPerPiece)</option>
                        <option value="plain">Post-Chhol Plain Baseline (plainAvgWeightPerPiece)</option>
                        <option value="gold">Post-Chhol Gold Baseline (goldAvgWeightPerPiece)</option>
                      </select>
                    </div>

                    <p className="text-[10px] text-neutral-400">
                      Actual counted weight &divide; Actual counted pieces = New baseline saved for this specific stage tier.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Counted Weight (g)"
                        value={recalWeight}
                        onChange={(e) => setRecalWeight(e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg bg-neutral-950 border border-neutral-700 text-xs font-mono text-neutral-100 outline-none"
                      />
                      <input
                        type="number"
                        placeholder="Counted Pieces"
                        value={recalPieces}
                        onChange={(e) => setRecalPieces(e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg bg-neutral-950 border border-neutral-700 text-xs font-mono text-neutral-100 outline-none"
                      />
                    </div>
                    <button
                      onClick={() => handleSaveRecalibration(design.id)}
                      className="w-full py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs transition"
                    >
                      Update {recalTarget.toUpperCase()} Baseline Weight
                    </button>
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div
                className={`flex items-center justify-between pt-3 border-t text-xs ${
                  isBright ? 'border-[#E2E8F0]' : 'border-neutral-900'
                }`}
              >
                <button
                  onClick={() => {
                    setRecalibratingDesignId(design.id);
                    setRecalTarget('wax');
                    setRecalWeight((design.waxAvgWeightPerPiece ?? 0.2).toFixed(4));
                    setRecalPieces('1');
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                    isBright
                      ? 'bg-[#F1F5F9] hover:bg-[#E2E8F0] text-slate-700'
                      : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
                  Recalibrate
                </button>

                <button
                  onClick={() => onOpenCreateLotWithDesign(design.id)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold transition active:scale-95 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Lot
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
