import React, { useMemo, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Download,
  IndianRupee,
  ReceiptText,
  Scale,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuthAndTheme } from '../../context/AuthAndThemeContext';
import { SearchableSelect } from '../SearchableSelect';
import { JobWorkRateBasis } from '../../types';
import { formatJobWorkRate, getStageRateBasis, rateBasisLabel } from '../../utils/stagePricing';

type LedgerRow = {
  id: string;
  karigarId: string;
  karigarName: string;
  lotNumber: string;
  designName: string;
  stage: string;
  sentDate: string;
  receivedDate: string;
  sentPieces?: number;
  sentWeight?: number;
  receivedPieces?: number;
  receivedWeight?: number;
  orderedQuantity?: number;
  rate?: number;
  rateBasis?: JobWorkRateBasis;
  amount?: number;
  isCompleted: boolean;
};

const formatNumber = (value?: number, digits = 2) =>
  value == null ? '—' : value.toLocaleString('en-IN', { maximumFractionDigits: digits });

const formatDate = (value: string) => {
  if (!value) return 'Pending';
  const [year, month, day] = value.slice(0, 10).split('-');
  return year && month && day ? `${day}-${month}-${year}` : value;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value);

const csvCell = (value: string | number | undefined) => {
  let text = value == null ? '' : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

export const KarigarLedgerView: React.FC = () => {
  const { lots, karigars } = useApp();
  const { theme } = useAuthAndTheme();
  const isBright = theme === 'bright';
  const [karigarFilter, setKarigarFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const allRows = useMemo<LedgerRow[]>(() => lots.flatMap((lot) =>
    lot.history.map((record, index) => ({
      id: `${lot.id}-${index}`,
      karigarId: record.karigarId,
      karigarName: record.karigarName,
      lotNumber: lot.lotNumber,
      designName: lot.designName,
      stage: record.stage,
      sentDate: record.stage === 'Wax' ? '' : record.dateSent,
      receivedDate: record.stage === 'Wax'
        ? record.dateReceived ?? record.completedAt ?? ''
        : record.completedAt ?? record.arrivedAt ?? '',
      sentPieces: record.piecesSent,
      sentWeight: record.weightSent,
      receivedPieces: record.statedPieces ?? record.estimatedPieces,
      receivedWeight: record.weightReceived,
      orderedQuantity: record.orderedQuantity,
      rate: record.jobWorkRate,
      rateBasis: record.jobWorkRateBasis ?? (record.jobWorkRate == null ? undefined : getStageRateBasis(record.stage)),
      amount: record.jobWorkAmount,
      isCompleted: record.isCompleted,
    }))
  ).sort((a, b) => (b.sentDate || b.receivedDate).localeCompare(a.sentDate || a.receivedDate)), [lots]);

  const rows = useMemo(() => allRows.filter((row) => {
    if (karigarFilter !== 'all' && row.karigarId !== karigarFilter) return false;
    if (stageFilter !== 'all' && row.stage !== stageFilter) return false;
    const date = (row.sentDate || row.receivedDate).slice(0, 10);
    if (fromDate && date < fromDate) return false;
    if (toDate && date > toDate) return false;
    return true;
  }), [allRows, karigarFilter, stageFilter, fromDate, toDate]);

  const totals = useMemo(() => rows.reduce((summary, row) => ({
    sentPieces: summary.sentPieces + (row.sentPieces ?? 0),
    sentWeight: summary.sentWeight + (row.sentWeight ?? 0),
    receivedPieces: summary.receivedPieces + (row.receivedPieces ?? 0),
    receivedWeight: summary.receivedWeight + (row.receivedWeight ?? 0),
    amount: summary.amount + (row.amount ?? 0),
    pending: summary.pending + (row.isCompleted ? 0 : 1),
  }), {
    sentPieces: 0,
    sentWeight: 0,
    receivedPieces: 0,
    receivedWeight: 0,
    amount: 0,
    pending: 0,
  }), [rows]);

  const selectedKarigar = karigars.find((karigar) => karigar.id === karigarFilter);

  const downloadLedger = async () => {
    const headers = [
      'Sent Date', 'Received Date', 'Karigar', 'Lot Number', 'Design', 'Stage', 'Ordered Quantity',
      'Pieces Sent', 'Weight Sent (g)', 'Pieces Received', 'Weight Received (g)',
      'Rate Basis', 'Rate (INR)', 'Status', 'Calculated Amount (INR)',
    ];
    const lines = [
      headers.map(csvCell).join(','),
      ...rows.map((row) => [
        row.sentDate,
        row.receivedDate,
        row.karigarName,
        row.lotNumber,
        row.designName,
        row.stage,
        row.orderedQuantity,
        row.sentPieces,
        row.sentWeight,
        row.receivedPieces,
        row.receivedWeight,
        row.rateBasis ? rateBasisLabel(row.rateBasis) : '',
        row.rate,
        row.isCompleted ? 'Received' : 'Pending',
        row.amount,
      ].map(csvCell).join(',')),
      '',
      [
        'TOTALS', '', '', '', '', '', '', totals.sentPieces, totals.sentWeight,
        totals.receivedPieces, totals.receivedWeight, `${totals.pending} pending`, totals.amount,
      ].map(csvCell).join(','),
    ];
    const safeName = (selectedKarigar?.name ?? 'all-karigars').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    const filename = `karigar-ledger-${safeName}-${new Date().toISOString().slice(0, 10)}.csv`;
    const csv = `\uFEFF${lines.join('\r\n')}`;
    const file = new File([csv], filename, { type: 'text/csv;charset=utf-8' });

    if (Capacitor.isNativePlatform() && navigator.share) {
      try {
        if (!navigator.canShare || navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'Karigar Ledger',
            text: selectedKarigar ? `${selectedKarigar.name} ledger` : 'Complete karigar ledger',
            files: [file],
          });
          return;
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        console.warn('Could not share the ledger file; using browser download instead.', error);
      }
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const panelClass = isBright
    ? 'bg-white border-[#E4E4E7] text-[#18181B]'
    : 'bg-neutral-950 border-neutral-800 text-neutral-100';

  return (
    <div className="space-y-5 pb-12 overflow-x-hidden w-full max-w-full">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className={`text-xl font-bold font-brand flex items-center gap-2 ${isBright ? 'text-[#18181B]' : 'text-neutral-100'}`}>
            <ReceiptText className="w-5 h-5 text-amber-500" /> Karigar Ledger
          </h2>
          <p className={`mt-1 text-xs ${isBright ? 'text-slate-500' : 'text-neutral-400'}`}>
            Material sent, material received, and slip-wise job-work amounts.
          </p>
        </div>
        <button
          type="button"
          onClick={downloadLedger}
          disabled={rows.length === 0}
          className="shrink-0 px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" /> CSV
        </button>
      </div>

      <div className={`p-3 rounded-xl border space-y-2.5 ${panelClass}`}>
        <SearchableSelect
          value={karigarFilter}
          onChange={setKarigarFilter}
          bright={isBright}
          searchPlaceholder="Search karigars…"
          className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none ${isBright ? 'bg-[#F8FAFC] border-[#CBD5E1]' : 'bg-neutral-900 border-neutral-700'}`}
          options={[
            { value: 'all', label: 'All Karigars — Complete Ledger' },
            ...karigars.map((karigar) => ({ value: karigar.id, label: `${karigar.name}${karigar.phone ? ` (${karigar.phone})` : ''}` })),
          ]}
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <SearchableSelect
            value={stageFilter}
            onChange={setStageFilter}
            bright={isBright}
            searchPlaceholder="Search stages…"
            className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${isBright ? 'bg-[#F8FAFC] border-[#CBD5E1]' : 'bg-neutral-900 border-neutral-700'}`}
            options={[
              { value: 'all', label: 'All Stages' },
              ...['Wax', 'Casting', 'Buff', 'Zabora', 'Dull', 'Chhol', 'Plating'].map((stage) => ({ value: stage, label: stage })),
            ]}
          />
          <input
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
            aria-label="Ledger start date"
            className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${isBright ? 'bg-[#F8FAFC] border-[#CBD5E1]' : 'bg-neutral-900 border-neutral-700 text-neutral-200'}`}
          />
          <input
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
            aria-label="Ledger end date"
            className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${isBright ? 'bg-[#F8FAFC] border-[#CBD5E1]' : 'bg-neutral-900 border-neutral-700 text-neutral-200'}`}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {[
          { label: 'Sent', value: `${formatNumber(totals.sentPieces, 0)} pcs`, detail: `${formatNumber(totals.sentWeight)} g`, icon: ArrowUpFromLine, color: 'text-blue-500' },
          { label: 'Received', value: `${formatNumber(totals.receivedPieces, 0)} pcs`, detail: `${formatNumber(totals.receivedWeight)} g`, icon: ArrowDownToLine, color: 'text-emerald-500' },
          { label: 'Job-work Total', value: formatCurrency(totals.amount), detail: `${rows.length} entries`, icon: IndianRupee, color: 'text-amber-500' },
          { label: 'Pending Return', value: String(totals.pending), detail: 'active job slips', icon: Scale, color: 'text-rose-500' },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`p-3 rounded-xl border ${panelClass}`}>
              <div className={`flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold ${card.color}`}>
                <Icon className="w-3.5 h-3.5" /> {card.label}
              </div>
              <div className="mt-1 text-sm font-bold font-mono truncate">{card.value}</div>
              <div className={`text-[10px] ${isBright ? 'text-slate-500' : 'text-neutral-500'}`}>{card.detail}</div>
            </div>
          );
        })}
      </div>

      <div className="space-y-2.5">
        {rows.length === 0 ? (
          <div className={`p-8 rounded-xl border text-center text-xs ${panelClass}`}>No ledger entries match these filters.</div>
        ) : rows.map((row) => (
          <div key={row.id} className={`p-3.5 rounded-xl border ${panelClass}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-bold text-sm truncate">{row.karigarName}</div>
                <div className={`text-[11px] mt-0.5 ${isBright ? 'text-slate-500' : 'text-neutral-400'}`}>
                  {row.lotNumber} • {row.designName} • {row.stage}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-mono font-bold text-sm text-amber-500">
                  {row.amount == null ? 'Total —' : formatCurrency(row.amount)}
                </div>
                <div className={`mt-0.5 text-[10px] font-mono ${isBright ? 'text-slate-500' : 'text-neutral-400'}`}>
                  {row.rate == null ? 'Rate —' : formatJobWorkRate(row.rate, row.rateBasis)}
                </div>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${row.isCompleted ? 'bg-emerald-500/15 text-emerald-500' : 'bg-rose-500/15 text-rose-500'}`}>
                  {row.isCompleted ? 'RECEIVED' : 'PENDING'}
                </span>
              </div>
            </div>
            <div className={`grid grid-cols-2 gap-3 mt-3 pt-3 border-t text-[11px] ${isBright ? 'border-slate-200' : 'border-neutral-800'}`}>
              <div>
                <div className={`font-semibold ${row.stage === 'Wax' ? 'text-amber-500' : 'text-blue-500'}`}>
                  {row.stage === 'Wax' ? 'Ordered' : `Sent • ${formatDate(row.sentDate)}`}
                </div>
                <div className={`mt-1 font-mono ${isBright ? 'text-slate-600' : 'text-neutral-300'}`}>
                  {row.stage === 'Wax'
                    ? `${formatNumber(row.orderedQuantity, 0)} pcs requested`
                    : `${formatNumber(row.sentPieces, 0)} pcs • ${formatNumber(row.sentWeight)} g`}
                </div>
              </div>
              <div>
                <div className="font-semibold text-emerald-500">Received • {formatDate(row.receivedDate)}</div>
                <div className={`mt-1 font-mono ${isBright ? 'text-slate-600' : 'text-neutral-300'}`}>
                  {formatNumber(row.receivedPieces, 0)} pcs • {formatNumber(row.receivedWeight)} g
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
