import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Design } from '../../types';
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
  const [searchQuery, setSearchQuery] = useState('');

  // Inline recalibration state
  const [recalibratingDesignId, setRecalibratingDesignId] = useState<string | null>(null);
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
      recalibrateDesign(designId, newAvg);
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
    <div className="space-y-6 pb-12">
      {/* Top Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-100 font-brand flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            Ring Designs &bull; Orders
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
            <Plus className="w-4 h-4" /> Create Order
          </button>
        </div>
      </div>

      {/* Designs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredDesigns.map((design) => {
          const barcodeSvg = generateBarcodeSvg(design.barcode, 20);

          const isRecalibrating = recalibratingDesignId === design.id;
          const isEditingThreshold = editingThresholdId === design.id;

          return (
            <div
              key={design.id}
              className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 flex flex-col justify-between space-y-4 hover:border-neutral-700 transition shadow-lg"
            >
              <div>
                {/* Header: Photo & Title */}
                <div className="flex items-start gap-4 mb-3">
                  <img
                    src={design.photoUrl}
                    alt={design.name}
                    className="w-20 h-20 rounded-xl object-cover border border-neutral-700 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-amber-400 font-semibold">
                        {design.orderRef}
                      </span>
                    </div>
                    <h3 className="font-bold text-base text-neutral-100 truncate mt-0.5">
                      {design.name}
                    </h3>

                    {/* Permanent Barcode Display */}
                    <div className="mt-2 px-2 py-1 rounded-lg bg-white inline-flex flex-col items-center justify-center max-w-[130px] overflow-hidden border border-neutral-200/60 shadow-xs">
                      <div className="w-full flex justify-center overflow-hidden" dangerouslySetInnerHTML={{ __html: barcodeSvg }} />
                    </div>
                  </div>
                </div>

                {/* Key Spec Metrics */}
                <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-neutral-900 border border-neutral-800/80 text-xs">
                  {/* Baseline Average Weight per Piece */}
                  <div>
                    <span className="text-neutral-400 block text-[11px]">
                      Baseline Avg Weight / Piece
                    </span>
                    <span className="font-mono font-bold text-sm text-amber-300">
                      {design.averageWeightPerPiece.toFixed(4)} g
                    </span>
                  </div>

                  {/* Low Stock Alert Threshold */}
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400 text-[11px]">Low Stock Alert</span>
                      <button
                        onClick={() => {
                          setEditingThresholdId(design.id);
                          setNewThresholdValue(design.lowStockThreshold.toString());
                        }}
                        className="text-[10px] text-amber-400 hover:underline"
                      >
                        Edit
                      </button>
                    </div>

                    {isEditingThreshold ? (
                      <div className="flex items-center gap-1.5 mt-1">
                        <input
                          type="number"
                          value={newThresholdValue}
                          onChange={(e) => setNewThresholdValue(e.target.value)}
                          className="w-16 px-1.5 py-0.5 rounded bg-neutral-950 border border-amber-500 text-xs font-mono text-neutral-100"
                        />
                        <button
                          onClick={() => handleSaveThreshold(design.id)}
                          className="p-1 rounded bg-amber-400 text-neutral-950"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <span className="font-mono font-bold text-sm text-neutral-200">
                        {design.lowStockThreshold} pcs
                      </span>
                    )}
                  </div>
                </div>

                {/* Recalibration Section */}
                {isRecalibrating && (
                  <div className="mt-3 p-3.5 rounded-xl bg-neutral-900 border border-amber-500/40 space-y-2 text-xs">
                    <div className="font-semibold text-amber-300 flex items-center justify-between">
                      <span>Recalibrate Baseline Average Weight</span>
                      <button
                        onClick={() => setRecalibratingDesignId(null)}
                        className="text-neutral-400 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                    <p className="text-[10px] text-neutral-400">
                      Actual counted weight &divide; Actual counted pieces = New baseline reused across future stages.
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
                      Update Baseline Avg Weight
                    </button>
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-neutral-900 text-xs">
                <button
                  onClick={() => {
                    setRecalibratingDesignId(design.id);
                    setRecalWeight(design.sampleWeight.toString());
                    setRecalPieces(design.samplePieceCount.toString());
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium transition"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
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
