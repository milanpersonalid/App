import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuthAndTheme } from '../../context/AuthAndThemeContext';
import { Design } from '../../types';
import { generateBarcodeSvg } from '../../utils/qrBarcode';
import {
  Sparkles,
  Plus,
  Search,
  X,
  Trash2,
  Pencil,
} from 'lucide-react';
import { DeleteConfirmationModal } from '../DeleteConfirmationModal';

interface DesignsViewProps {
  onOpenCreateDesign: () => void;
  onOpenEditDesign: (design: Design) => void;
  onOpenCreateLotWithDesign: (designId: string) => void;
}

export const DesignsView: React.FC<DesignsViewProps> = ({
  onOpenCreateDesign,
  onOpenEditDesign,
  onOpenCreateLotWithDesign,
}) => {
  const { designs, lots, deleteDesign } = useApp();
  const { theme } = useAuthAndTheme();
  const isBright = theme === 'bright';
  const [searchQuery, setSearchQuery] = useState('');
  const [previewDesign, setPreviewDesign] = useState<Design | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<{ design: Design; blocked: boolean } | null>(null);

  const filteredDesigns = designs.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.orderRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.barcode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteDesign = (design: Design) => {
    const relatedLots = lots.filter((lot) => lot.designId === design.id).length;
    setDeleteTarget({ design, blocked: relatedLots > 0 });
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
          const barcodeSvg = generateBarcodeSvg(design.barcode, 36);

          return (
            <div
              key={design.id}
              className={`relative p-3.5 rounded-2xl border flex flex-col justify-between space-y-3.5 transition shadow-sm ${
                isBright
                  ? 'bg-white border-[#E4E4E7] hover:border-amber-400'
                  : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <div className="absolute top-2.5 right-2.5 z-10 flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={() => onOpenEditDesign(design)}
                  title="Edit design"
                  aria-label={`Edit design ${design.name}`}
                  className="p-0.5 text-amber-500/70 hover:text-amber-400 transition"
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteDesign(design)}
                  title="Delete design"
                  aria-label={`Delete design ${design.name}`}
                  className="p-0.5 text-red-500/65 hover:text-red-500 transition"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <div>
                {/* Header: Photo & Title */}
                <div className="flex items-start gap-3 mb-2.5 pr-12">
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
                        className={`w-16 h-16 rounded-xl object-cover border ${
                          isBright ? 'border-[#E2E8F0]' : 'border-neutral-700'
                        }`}
                      />
                    )}
                  </button>
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

              </div>

              {/* Bottom Actions */}
              <div
                className={`flex items-center justify-between pt-3 border-t text-xs ${
                  isBright ? 'border-[#E2E8F0]' : 'border-neutral-900'
                }`}
              >
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
      <DeleteConfirmationModal
        open={Boolean(deleteTarget)}
        bright={isBright}
        title={deleteTarget?.blocked ? 'Design cannot be deleted' : 'Delete design?'}
        message={deleteTarget
          ? deleteTarget.blocked
            ? `${deleteTarget.design.name} is used by ${lots.filter((lot) => lot.designId === deleteTarget.design.id).length} production lot(s). Delete those lots first.`
            : `Delete ${deleteTarget.design.name}? This permanently removes the design and its photo.`
          : ''}
        blocked={deleteTarget?.blocked}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={deleteTarget && !deleteTarget.blocked ? () => deleteDesign(deleteTarget.design.id) : undefined}
      />
    </div>
  );
};
