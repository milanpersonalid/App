import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuthAndTheme } from '../../context/AuthAndThemeContext';
import { ReadyStockItem, Lot } from '../../types';
import {
  Archive,
  AlertTriangle,
  Sparkles,
  Scale,
  Check,
  Search,
  CheckCircle2,
  Package,
  Layers,
  ArrowUpRight,
} from 'lucide-react';

interface ReadyStockViewProps {
  onOpenLot: (lot: Lot) => void;
}

export const ReadyStockView: React.FC<ReadyStockViewProps> = ({ onOpenLot }) => {
  const { getReadyStockSummary, lots, updateLowStockThreshold } = useApp();
  const { theme } = useAuthAndTheme();
  const isBright = theme === 'bright';

  const [activeBucket, setActiveBucket] = useState<'all' | 'plain' | 'gold'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Editable threshold state
  const [editingDesignId, setEditingDesignId] = useState<string | null>(null);
  const [newThreshold, setNewThreshold] = useState<string>('');

  // The summary includes every design (including designs with no completed lots)
  // for low-stock reporting. The Stock screen should only list designs that have
  // actually reached Ready Stock; in-progress warehouse lots are not inventory.
  const readyDesignIds = new Set(
    lots.filter((lot) => lot.status === 'ready_stock').map((lot) => lot.designId)
  );
  const stockItems: ReadyStockItem[] = getReadyStockSummary().filter((item) => readyDesignIds.has(item.designId));

  const filteredItems = stockItems.filter((item) => {
    const matchesSearch =
      item.designName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.barcode.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (activeBucket === 'plain' && item.plainPieces === 0) return false;
    if (activeBucket === 'gold' && item.goldPieces === 0) return false;

    return true;
  });

  const handleSaveThreshold = async (designId: string) => {
    const val = parseInt(newThreshold, 10);
    if (val > 0) {
      await updateLowStockThreshold(designId, val);
      setEditingDesignId(null);
    }
  };

  const plainTotalPieces = stockItems.reduce((sum, item) => sum + item.plainPieces, 0);
  const plainTotalWeight = stockItems.reduce((sum, item) => sum + item.plainWeight, 0);

  const goldTotalPieces = stockItems.reduce((sum, item) => sum + item.goldPieces, 0);
  const goldTotalWeight = stockItems.reduce((sum, item) => sum + item.goldWeight, 0);

  const lowStockCount = stockItems.filter((s) => s.isLowStock).length;

  return (
    <div className="space-y-6 pb-12 overflow-x-hidden w-full max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2
            className={`text-xl font-bold font-brand flex items-center gap-2.5 ${
              isBright ? 'text-[#27272A]' : 'text-neutral-100'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                isBright
                  ? 'bg-[#F4F4F6] text-[#27272A] border-[#E4E4E7]'
                  : 'bg-[#292930] text-neutral-200 border-[#3F3F46]'
              }`}
            >
              <Archive className="w-5 h-5" />
            </div>
            <span>Ready Stock</span>
          </h2>
        </div>

        {lowStockCount > 0 && (
          <div
            className={`p-2.5 px-3.5 rounded-xl border text-xs flex items-center gap-2 font-medium shadow-xs ${
              isBright
                ? 'bg-[#FAF8F2] border-[#E8DEC8] text-[#7A5A29]'
                : 'bg-[#292520] border-[#5E4C33] text-[#D4B98E]'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 opacity-80" />
            <span>{lowStockCount} design(s) below minimum stock threshold</span>
          </div>
        )}
      </div>

      {/* 2 Dedicated Stock Category Buckets */}
      <div className="grid grid-cols-2 gap-2">
        {/* Bucket 1: Ready Stock (Plain) */}
        <div
          onClick={() => setActiveBucket(activeBucket === 'plain' ? 'all' : 'plain')}
          className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 relative overflow-hidden shadow-xs hover:shadow-sm active:scale-[0.99] ${
            activeBucket === 'plain'
              ? isBright
                ? 'bg-[#F1F5F9] border-[#94A3B8] ring-1 ring-[#94A3B8]/40'
                : 'bg-[#242730] border-[#4B5563] ring-1 ring-white/15'
              : isBright
              ? 'bg-[#FFFFFF] border-[#E4E4E7] hover:border-[#CBD5E1]'
              : 'bg-[#292930] border-[#3F3F46] hover:border-[#52525B]'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span
              className={`text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider border ${
                isBright
                  ? 'bg-[#E2E8F0] text-[#334155] border-[#CBD5E1]'
                  : 'bg-[#1E293B] text-[#94A3B8] border-[#334155]'
              }`}
            >
              Plain
            </span>
          </div>

          <h3 className={`text-xs font-bold font-brand truncate ${isBright ? 'text-[#1E293B]' : 'text-neutral-100'}`}>
            Ready (Plain)
          </h3>

          <div className="mt-2 grid grid-cols-2 gap-1.5 pt-1.5 border-t border-dashed border-[#CBD5E1]/60 dark:border-[#334155]">
            <div>
              <span className={`block text-[10px] ${isBright ? 'text-[#64748B]' : 'text-neutral-400'}`}>
                Pieces
              </span>
              <span
                className={`text-sm font-bold font-mono tracking-tight ${
                  isBright ? 'text-[#1E293B]' : 'text-neutral-100'
                }`}
              >
                {plainTotalPieces.toLocaleString()}
              </span>
            </div>
            <div>
              <span className={`block text-[10px] ${isBright ? 'text-[#64748B]' : 'text-neutral-400'}`}>
                Weight
              </span>
              <span
                className={`text-sm font-bold font-mono tracking-tight ${
                  isBright ? 'text-[#334155]' : 'text-neutral-200'
                }`}
              >
                {(plainTotalWeight || 0).toFixed(1)}g
              </span>
            </div>
          </div>
        </div>

        {/* Bucket 2: Ready Stock (Gold) */}
        <div
          onClick={() => setActiveBucket(activeBucket === 'gold' ? 'all' : 'gold')}
          className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 relative overflow-hidden shadow-xs hover:shadow-sm active:scale-[0.99] ${
            activeBucket === 'gold'
              ? isBright
                ? 'bg-[#FAF7F2] border-[#D6C7B2] ring-1 ring-[#D6C7B2]/50'
                : 'bg-[#2B2721] border-[#5E4C33] ring-1 ring-[#D4B98E]/20'
              : isBright
              ? 'bg-[#FFFFFF] border-[#E4E4E7] hover:border-[#D6C7B2]'
              : 'bg-[#292930] border-[#3F3F46] hover:border-[#52525B]'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span
              className={`text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider border ${
                isBright
                  ? 'bg-[#F2EAE0] text-[#6B5330] border-[#DECFC0]'
                  : 'bg-[#332A1F] text-[#D4B98E] border-[#4A3D2D]'
              }`}
            >
              Gold
            </span>
          </div>

          <h3 className={`text-xs font-bold font-brand truncate ${isBright ? 'text-[#3D2F1B]' : 'text-neutral-100'}`}>
            Ready (Gold)
          </h3>

          <div className="mt-2 grid grid-cols-2 gap-1.5 pt-1.5 border-t border-dashed border-[#DECFC0]/70 dark:border-[#4A3D2D]">
            <div>
              <span className={`block text-[10px] ${isBright ? 'text-[#786E64]' : 'text-neutral-400'}`}>
                Pieces
              </span>
              <span
                className={`text-sm font-bold font-mono tracking-tight ${
                  isBright ? 'text-[#3D2F1B]' : 'text-neutral-100'
                }`}
              >
                {goldTotalPieces.toLocaleString()}
              </span>
            </div>
            <div>
              <span className={`block text-[10px] ${isBright ? 'text-[#786E64]' : 'text-neutral-400'}`}>
                Weight
              </span>
              <span
                className={`text-sm font-bold font-mono tracking-tight ${
                  isBright ? 'text-[#3D2F1B]' : 'text-amber-300'
                }`}
              >
                {(goldTotalWeight || 0).toFixed(1)}g
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div
          className={`flex items-center gap-1 p-1 rounded-xl border w-fit transition-colors ${
            isBright ? 'bg-[#FFFFFF] border-[#D4D4D8]' : 'bg-[#1E1E24] border-[#3F3F46]'
          }`}
        >
          <button
            onClick={() => setActiveBucket('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeBucket === 'all'
                ? isBright
                  ? 'bg-[#27272A] text-white shadow-xs'
                  : 'bg-[#E4E4E7] text-[#18181B]'
                : isBright
                ? 'text-[#52525B] hover:text-[#18181B] hover:bg-[#F4F4F6]'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            All Stock ({stockItems.length})
          </button>
          <button
            onClick={() => setActiveBucket('plain')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeBucket === 'plain'
                ? isBright
                  ? 'bg-[#334155] text-white shadow-xs'
                  : 'bg-[#475569] text-white'
                : isBright
                ? 'text-[#52525B] hover:text-[#18181B] hover:bg-[#F4F4F6]'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Plain Only
          </button>
          <button
            onClick={() => setActiveBucket('gold')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeBucket === 'gold'
                ? isBright
                  ? 'bg-[#5C4827] text-white shadow-xs'
                  : 'bg-[#7A6442] text-white'
                : isBright
                ? 'text-[#52525B] hover:text-[#18181B] hover:bg-[#F4F4F6]'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Gold Only
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search
            className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
              isBright ? 'text-[#A1A1AA]' : 'text-neutral-500'
            }`}
          />
          <input
            type="text"
            placeholder="Search design or barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-3.5 py-1.5 rounded-xl text-xs outline-none transition-all border ${
              isBright
                ? 'bg-[#FFFFFF] border-[#D4D4D8] text-[#27272A] placeholder-[#A1A1AA] focus:border-[#27272A]'
                : 'bg-[#1E1E24] border-[#3F3F46] text-neutral-100 placeholder-neutral-500 focus:border-neutral-400'
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center ${
                isBright ? 'bg-[#E4E4E7] text-[#71717A]' : 'bg-[#3F3F46] text-neutral-300'
              }`}
            >
              &times;
            </button>
          )}
        </div>
      </div>

      {/* Per Design Inventory Breakdown */}
      {filteredItems.length === 0 ? (
        <div
          className={`p-10 rounded-2xl border text-center space-y-2.5 ${
            isBright ? 'bg-[#FFFFFF] border-[#E4E4E7]' : 'bg-[#292930] border-[#3F3F46]'
          }`}
        >
          <Package className={`w-8 h-8 mx-auto ${isBright ? 'text-[#A1A1AA]' : 'text-neutral-500'}`} />
          <h3 className={`font-bold text-sm ${isBright ? 'text-[#27272A]' : 'text-neutral-100'}`}>
            No ready stock found
          </h3>
          <p className={`text-xs ${isBright ? 'text-[#71717A]' : 'text-neutral-400'}`}>
            No designs match the current filter or search criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => {
            const isEditing = editingDesignId === item.designId;

            // Contributing lots for this design
            const readyLots = lots.filter(
              (l) => l.designId === item.designId && l.status === 'ready_stock'
            );

            return (
              <div
                key={item.designId}
                className={`p-3 rounded-xl border transition-all duration-200 shadow-xs hover:shadow-sm flex flex-col justify-between space-y-2.5 ${
                  item.isLowStock
                    ? isBright
                      ? 'bg-[#FAF8F5] border-[#D6C7B2] ring-1 ring-[#D6C7B2]/40'
                      : 'bg-[#292930] border-[#5E4C33] ring-1 ring-[#D4B98E]/20'
                    : isBright
                    ? 'bg-[#FFFFFF] border-[#E4E4E7]'
                    : 'bg-[#292930] border-[#3F3F46]'
                }`}
              >
                <div className="space-y-3">
                  {/* Header Row with Barcode & Status Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded-md border ${
                        isBright
                          ? 'bg-[#F4F4F6] text-[#52525B] border-[#E4E4E7]'
                          : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                      }`}
                    >
                      {item.barcode}
                    </span>

                    {item.isLowStock ? (
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          isBright
                            ? 'bg-[#F5EFEB] text-[#7A5A29] border-[#DECFC0]'
                            : 'bg-[#332A1F] text-[#D4B98E] border-[#4A3D2D]'
                        }`}
                      >
                        <AlertTriangle className="w-3 h-3 opacity-80" />
                        LOW STOCK ({item.totalPieces}/{item.lowStockThreshold})
                      </span>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                          isBright
                            ? 'bg-[#F2F6F1] text-[#3F5938] border-[#D3DFCF]'
                            : 'bg-[#1E281F] text-[#86B87E] border-[#2E4230]'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3 opacity-80" />
                        In Stock
                      </span>
                    )}
                  </div>

                  {/* Design Hero Info */}
                  <div className="flex items-start gap-3">
                    <img
                      src={item.photoUrl}
                      alt={item.designName}
                      className={`w-14 h-14 rounded-xl object-cover border flex-shrink-0 shadow-2xs ${
                        isBright ? 'border-[#E4E4E7]' : 'border-neutral-700'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <h4
                        className={`font-semibold text-sm truncate ${
                          isBright ? 'text-[#27272A]' : 'text-neutral-100'
                        }`}
                      >
                        {item.designName}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-xs font-mono font-medium px-1.5 py-0.5 rounded ${
                            isBright ? 'bg-[#F4F4F6] text-[#3F3F46]' : 'bg-[#1E1E24] text-neutral-200'
                          }`}
                        >
                          {item.totalPieces.toLocaleString()} pcs
                        </span>
                        <span className={`text-xs ${isBright ? 'text-[#71717A]' : 'text-neutral-400'}`}>
                          total inventory
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* The Two Buckets Side-by-Side Breakdown */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Plain Subcard */}
                    <div
                      className={`p-2.5 rounded-xl border transition-all ${
                        activeBucket === 'gold' ? 'opacity-40' : ''
                      } ${
                        isBright
                          ? 'bg-[#F8FAFC] border-[#E2E8F0]'
                          : 'bg-[#242730] border-[#374151]'
                      }`}
                    >
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wider block mb-0.5 ${
                          isBright ? 'text-[#475569]' : 'text-[#94A3B8]'
                        }`}
                      >
                        Plain
                      </span>
                      <div
                        className={`font-mono text-base font-bold ${
                          isBright ? 'text-[#1E293B]' : 'text-neutral-100'
                        }`}
                      >
                        {item.plainPieces.toLocaleString()} <span className="text-[11px] font-normal text-[#64748B]">pcs</span>
                      </div>
                      <div
                        className={`text-[11px] font-mono mt-0.5 ${
                          isBright ? 'text-[#64748B]' : 'text-neutral-400'
                        }`}
                      >
                        {(item.plainWeight ?? 0).toFixed(2)} g
                      </div>
                    </div>

                    {/* Gold Subcard */}
                    <div
                      className={`p-2.5 rounded-xl border transition-all ${
                        activeBucket === 'plain' ? 'opacity-40' : ''
                      } ${
                        isBright
                          ? 'bg-[#FAF8F5] border-[#EBE3D7]'
                          : 'bg-[#2B2721] border-[#4A3D2D]'
                      }`}
                    >
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wider block mb-0.5 ${
                          isBright ? 'text-[#786445]' : 'text-[#D4B98E]'
                        }`}
                      >
                        Gold
                      </span>
                      <div
                        className={`font-mono text-base font-bold ${
                          isBright ? 'text-[#3D2F1B]' : 'text-neutral-100'
                        }`}
                      >
                        {item.goldPieces.toLocaleString()} <span className="text-[11px] font-normal text-[#786E64]">pcs</span>
                      </div>
                      <div
                        className={`text-[11px] font-mono mt-0.5 ${
                          isBright ? 'text-[#786E64]' : 'text-neutral-400'
                        }`}
                      >
                        {(item.goldWeight ?? 0).toFixed(2)} g
                      </div>
                    </div>
                  </div>

                  {/* Low Stock Alert Threshold Controls */}
                  <div
                    className={`p-2.5 px-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                      isBright
                        ? 'bg-[#F4F4F6] border-[#E4E4E7]'
                        : 'bg-[#1E1E24] border-[#3F3F46]'
                    }`}
                  >
                    <span className={`text-[11px] ${isBright ? 'text-[#71717A]' : 'text-neutral-400'}`}>
                      Alert threshold:
                    </span>
                    {isEditing ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={newThreshold}
                          onChange={(e) => setNewThreshold(e.target.value)}
                          className={`w-16 px-2 py-0.5 rounded border text-xs font-mono outline-none ${
                            isBright
                              ? 'bg-white border-[#A1A1AA] text-[#27272A]'
                              : 'bg-neutral-900 border-neutral-600 text-neutral-100'
                          }`}
                        />
                        <button
                          onClick={() => handleSaveThreshold(item.designId)}
                          className={`p-1 rounded font-medium transition ${
                            isBright
                              ? 'bg-[#27272A] text-white hover:bg-black'
                              : 'bg-neutral-200 text-neutral-900'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono font-medium ${
                            isBright ? 'text-[#27272A]' : 'text-neutral-200'
                          }`}
                        >
                          {item.lowStockThreshold} pcs
                        </span>
                        <button
                          onClick={() => {
                            setEditingDesignId(item.designId);
                            setNewThreshold(item.lowStockThreshold.toString());
                          }}
                          className={`text-[11px] font-medium transition hover:underline ${
                            isBright ? 'text-[#52525B] hover:text-[#18181B]' : 'text-neutral-400 hover:text-neutral-200'
                          }`}
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Finished Contributing Lots */}
                {readyLots.length > 0 && (
                  <div
                    className={`pt-3 border-t ${
                      isBright ? 'border-[#E4E4E7]' : 'border-[#3F3F46]'
                    }`}
                  >
                    <div
                      className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${
                        isBright ? 'text-[#71717A]' : 'text-neutral-400'
                      }`}
                    >
                      Completed Production Lots ({readyLots.length}):
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {readyLots.map((l) => (
                        <button
                          key={l.id}
                          onClick={() => onOpenLot(l)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono transition shadow-2xs border ${
                            isBright
                              ? 'bg-[#F4F4F6] hover:bg-[#EAEAEF] text-[#27272A] border-[#D4D4D8]'
                              : 'bg-[#1E1E24] hover:bg-neutral-800 text-neutral-300 border-[#3F3F46]'
                          }`}
                        >
                          <span>{l.lotNumber}</span>
                          <span className={`text-[10px] ${isBright ? 'text-[#71717A]' : 'text-neutral-400'}`}>
                            &bull; {l.finalPieces} pcs ({l.readyStockBucket})
                          </span>
                          <ArrowUpRight className="w-3 h-3 opacity-60" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
