import React, { useEffect, useState, useMemo } from 'react';
import { Lot, Design, Stage, LotStageRecord } from '../types';
import { generateQrCodeDataUrl, generateBarcodeSvg, generateLotStageQrPayload } from '../utils/qrBarcode';
import { Printer, X, ShieldCheck, Languages, Check, RefreshCw, Eye, Edit3 } from 'lucide-react';
import { useAuthAndTheme } from '../context/AuthAndThemeContext';

interface StageSlipModalProps {
  lot: Lot;
  design: Design;
  initialStage?: Stage;
  onClose: () => void;
}

type SlipLanguage = 'gu' | 'en' | 'bi';

const STAGE_ORDER: Record<string, number> = {
  Wax: 1,
  Casting: 2,
  Buff: 3,
  Zabora: 4,
  Dull: 5,
  Dal: 5,
  DAL: 5,
  Chhol: 6,
  Plating: 7,
  'Ready Stock': 8,
};

const GUJARATI_STAGE_NAMES: Record<string, string> = {
  Wax: 'મીણ (Wax)',
  Casting: 'ઢાળકામ (Casting)',
  Buff: 'બફિંગ (Buff)',
  Zabora: 'ઝબોરા (Zabora)',
  Dull: 'ડલ (Dull)',
  Dal: 'ડલ (Dull)',
  DAL: 'ડલ (Dull)',
  Chhol: 'છોલ (Chhol)',
  Plating: 'પ્લેટિંગ (Plating)',
  'Ready Stock': 'તૈયાર સ્ટોક (Ready)',
};

function formatSlipDate(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = d.getDate().toString().padStart(2, '0');
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

export const StageSlipModal: React.FC<StageSlipModalProps> = ({
  lot,
  design,
  initialStage,
  onClose,
}) => {
  const { theme } = useAuthAndTheme();
  const isBright = theme === 'bright';

  // Language state: 'gu' (default matching real physical slip), 'en', or 'bi' (bilingual)
  const [language, setLanguage] = useState<SlipLanguage>('gu');

  // Stage selection for printing (defaults to initialStage or current stage, but can select past stages)
  const [selectedStageName, setSelectedStageName] = useState<Stage>(
    initialStage || lot.currentStage
  );

  useEffect(() => {
    if (initialStage) {
      setSelectedStageName(initialStage);
    } else {
      setSelectedStageName(lot.currentStage);
    }
  }, [initialStage, lot.currentStage, lot.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Editable slip parameters matching user's workshop custom slip
  const defaultProcess = useMemo(() => {
    if (selectedStageName === 'Wax') return 'WAX';
    if (selectedStageName === 'Casting') return lot.branch === 'gold' ? 'CASTING (GOLD)' : 'CASTING';
    return selectedStageName.toUpperCase();
  }, [selectedStageName, lot.branch]);

  const [processTitle, setProcessTitle] = useState<string>(defaultProcess);
  const [amountValue, setAmountValue] = useState<string>('1250');
  const [returnMode, setReturnMode] = useState<'blank' | 'filled'>('blank');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Update default process title when stage changes
  useEffect(() => {
    setProcessTitle(defaultProcess);
  }, [defaultProcess]);

  // Find record for selected stage
  const selectedRecord: LotStageRecord | undefined = useMemo(() => {
    const fromHistory = lot.history.slice().reverse().find((h) => h.stage === selectedStageName);
    if (fromHistory) return fromHistory;
    return lot.history[lot.history.length - 1];
  }, [lot.history, selectedStageName]);

  const weightSent = selectedRecord?.weightSent ?? lot.initialWeight ?? 0;
  const piecesSent = selectedRecord?.piecesSent ?? lot.initialPieces ?? 0;
  const dateSent = formatSlipDate(selectedRecord?.dateSent ?? lot.createdAt);
  const karigarName = selectedRecord?.karigarName ?? lot.currentKarigarName;
  const stageNumber = STAGE_ORDER[selectedStageName] || 1;

  // Generate dynamic QR code for the selected stage
  useEffect(() => {
    const qrPayload =
      selectedRecord?.qrData ||
      generateLotStageQrPayload(lot.lotNumber, selectedStageName, karigarName, dateSent);

    generateQrCodeDataUrl(qrPayload).then(setQrDataUrl);
  }, [selectedRecord, lot.lotNumber, selectedStageName, karigarName, dateSent]);

  const barcodeSvg = useMemo(() => {
    // Generate linear barcode of design barcode or lot number
    return generateBarcodeSvg(design.barcode || lot.lotNumber, 26);
  }, [design.barcode, lot.lotNumber]);

  const handlePrint = () => {
    window.print();
  };

  // Translations dictionary
  const t = {
    processLabel:
      language === 'gu' ? 'Proccess' : language === 'en' ? 'Process' : 'Process / પ્રક્રિયા',
    lotNoLabel:
      language === 'gu' ? 'ક્રમાંક નંબર' : language === 'en' ? 'Lot / Serial No.' : 'ક્રમાંક નંબર / Lot No.',
    karigarLabel:
      language === 'gu' ? 'કારીગર નું નામ' : language === 'en' ? 'Karigar Name' : 'કારીગર નું નામ / Karigar',
    designLabel:
      language === 'gu' ? 'ડિઝાઇન નું નામ' : language === 'en' ? 'Design Name' : 'ડિઝાઇન નું નામ / Design',
    weightLabel:
      language === 'gu' ? 'વજન' : language === 'en' ? 'Weight (g)' : 'વજન / Weight (g)',
    piecesLabel:
      language === 'gu' ? 'પીસ' : language === 'en' ? 'Pieces (pcs)' : 'પીસ / Pieces',
    amountLabel:
      language === 'gu' ? 'રકમ' : language === 'en' ? 'Amount (₹)' : 'રકમ / Amount (₹)',
    dateLabel:
      language === 'gu' ? 'તારીખ' : language === 'en' ? 'Date' : 'તારીખ / Date',
    goodPiecesLabel:
      language === 'gu' ? 'સારા પીસ' : language === 'en' ? 'Good Pieces' : 'સારા પીસ / Good Pcs',
    withoutStudLabel:
      language === 'gu' ? 'બૂટી વગર ના' : language === 'en' ? 'Without Stud' : 'બૂટી વગર ના / W/o Stud',
    rejectionLabel:
      language === 'gu' ? 'રિજેકશન પીસ' : language === 'en' ? 'Rejection Pieces' : 'રિજેકશન પીસ / Rejection',
    returnWeightLabel:
      language === 'gu' ? 'જમા વજન' : language === 'en' ? 'Return Weight' : 'જમા વજન / Return Wt',
    totalLabel:
      language === 'gu' ? 'ટોટલ' : language === 'en' ? 'Total' : 'ટોટલ / Total',
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto overflow-x-hidden w-full max-w-full no-print cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-3xl rounded-2xl sm:rounded-3xl border shadow-2xl overflow-hidden overflow-x-hidden my-3 sm:my-4 max-w-full transition-colors flex flex-col max-h-[92vh] sm:max-h-[95vh] cursor-default ${
          isBright
            ? 'bg-white border-[#E4E4E7] text-[#18181B]'
            : 'bg-[#18181B] border-[#27272A] text-neutral-100'
        }`}
      >
        {/* MODAL HEADER & CONTROLS (HIDDEN DURING PHYSICAL PRINT) */}
        <div
          className={`no-print px-3 sm:px-6 py-3 sm:py-4 border-b flex flex-col gap-2.5 sm:gap-3 shrink-0 ${
            isBright ? 'bg-[#FAFAFA] border-[#E4E4E7]' : 'bg-[#121214] border-[#27272A]'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div
                className={`p-2 rounded-xl border flex items-center justify-center shrink-0 ${
                  isBright
                    ? 'bg-amber-100/80 text-amber-800 border-amber-300'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}
              >
                <Printer className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <h3 className="font-bold text-sm sm:text-base tracking-tight truncate">
                    Stage Slip Print / પ્રિન્ટ કાપલી
                  </h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0">
                    STAGE #{stageNumber}
                  </span>
                </div>
                <p className={`text-[10px] sm:text-xs truncate ${isBright ? 'text-[#71717A]' : 'text-neutral-400'}`}>
                  Paper tracking slip &bull; {lot.lotNumber} &bull; {selectedStageName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-neutral-950 bg-amber-400 hover:bg-amber-300 active:scale-95 rounded-xl transition-all shadow-md shadow-amber-500/20 shrink-0"
                title="Print slip to paper or PDF (Ctrl+P)"
              >
                <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Print Slip</span>
                <span className="sm:hidden">Print</span>
              </button>
              <button
                onClick={onClose}
                className={`p-1.5 sm:p-2 rounded-xl transition border flex items-center justify-center shrink-0 ${
                  isBright
                    ? 'text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-300 shadow-xs'
                    : 'text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 border-neutral-700'
                }`}
                title="Close Pop-up (Esc)"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Interactive Toolbar for Customization */}
          <div
            className={`p-3 rounded-xl border grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs ${
              isBright ? 'bg-white border-[#E2E8F0]' : 'bg-[#18181B] border-[#27272A]'
            }`}
          >
            {/* Language Selector */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Language / ભાષા:
              </label>
              <div className="flex items-center gap-1">
                {(
                  [
                    { id: 'gu', label: 'ગુજરાતી' },
                    { id: 'en', label: 'English' },
                    { id: 'bi', label: 'દ્વિભાષી' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setLanguage(opt.id)}
                    className={`flex-1 py-1 px-1.5 rounded-lg text-xs font-semibold transition border ${
                      language === opt.id
                        ? isBright
                          ? 'bg-[#0F172A] text-white border-[#0F172A]'
                          : 'bg-amber-400 text-neutral-950 border-amber-400 font-bold'
                        : isBright
                        ? 'bg-slate-100 hover:bg-slate-200 text-[#475569] border-transparent'
                        : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-neutral-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Stage Selector */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Select Stage / તબક્કો:
              </label>
              <select
                value={selectedStageName}
                onChange={(e) => setSelectedStageName(e.target.value as Stage)}
                className={`py-1 px-2 rounded-lg border text-xs font-semibold outline-none transition ${
                  isBright
                    ? 'bg-[#F8FAFC] border-[#CBD5E1] text-[#0F172A]'
                    : 'bg-neutral-900 border-neutral-700 text-neutral-100'
                }`}
              >
                {lot.history.map((h, i) => (
                  <option key={i} value={h.stage}>
                    {i + 1}. {h.stage} ({GUJARATI_STAGE_NAMES[h.stage] || h.stage})
                  </option>
                ))}
                {!lot.history.some((h) => h.stage === lot.currentStage) && (
                  <option value={lot.currentStage}>
                    {STAGE_ORDER[lot.currentStage] || 1}. {lot.currentStage}
                  </option>
                )}
              </select>
            </div>

            {/* Process / Header Title */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Process Tag / પ્રક્રિયા:
              </label>
              <input
                type="text"
                value={processTitle}
                onChange={(e) => setProcessTitle(e.target.value)}
                className={`py-1 px-2 rounded-lg border font-mono text-xs font-semibold outline-none transition ${
                  isBright
                    ? 'bg-[#F8FAFC] border-[#CBD5E1] text-[#0F172A]'
                    : 'bg-neutral-900 border-neutral-700 text-neutral-100'
                }`}
                placeholder="e.g. WAX, CASTING, BUFF"
              />
            </div>

            {/* Amount / રકમ */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Amount (₹) / રકમ:
              </label>
              <input
                type="text"
                value={amountValue}
                onChange={(e) => setAmountValue(e.target.value)}
                className={`py-1 px-2 rounded-lg border font-mono text-xs font-semibold outline-none transition ${
                  isBright
                    ? 'bg-[#F8FAFC] border-[#CBD5E1] text-[#0F172A]'
                    : 'bg-neutral-900 border-neutral-700 text-neutral-100'
                }`}
                placeholder="1250"
              />
            </div>
          </div>
        </div>

        {/* PRINTABLE SLIP BODY - FAITHFULLY MATCHING PHYSICAL SLIP IMAGE */}
        <div
          className={`printable-slip-wrapper p-3 sm:p-6 overflow-y-auto overflow-x-hidden flex-1 w-full max-w-full ${
            isBright ? 'bg-[#F1F5F9]' : 'bg-[#09090B]'
          }`}
        >
          <div
            id="stage-slip-print"
            className="printable-slip-container bg-white text-black p-4 sm:p-7 border-2 border-black font-sans w-full max-w-xl mx-auto shadow-md overflow-hidden"
            style={{
              fontFamily:
                'system-ui, -apple-system, BlinkMacSystemFont, "Noto Sans Gujarati", "Shruti", sans-serif',
            }}
          >
            {/* Top Stage Marker & Title Header */}
            <div className="relative border-b-2 border-black pb-2 mb-3">
              {/* Handwritten-style Large Stage Stamp (like marker '1' in user photo) */}
              <div
                className="absolute left-0 top-0 text-blue-700 font-extrabold text-3xl sm:text-4xl leading-none select-none"
                style={{
                  fontFamily: 'serif, cursive, sans-serif',
                  transform: 'rotate(-4deg) translateY(-2px)',
                }}
                title={`Stage #${stageNumber}`}
              >
                {stageNumber}
              </div>

              {/* Centered Main Title: [Lot Number] | [Process Name] */}
              <div className="text-center pl-8 pr-2">
                <h2 className="font-extrabold text-lg sm:text-2xl tracking-wide uppercase font-mono text-black">
                  {lot.lotNumber}|{processTitle}
                </h2>
                <div className="text-[10px] sm:text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mt-0.5">
                  SHREENATHJI IMITATION JEWELLERY • WORKSHOP STAGE SLIP
                </div>
              </div>
            </div>

            {/* DUAL-COLUMN COMPARISON TABLE (Exact Replica of Photo) */}
            <div className="border-2 border-black overflow-hidden mb-3">
              <table
                className="w-full text-xs sm:text-sm border-collapse"
                style={{ borderCollapse: 'collapse' }}
              >
                <tbody>
                  {/* Row 1: Process Header / Col 1 & Return Header */}
                  <tr className="border-b border-black">
                    <td className="w-1/4 p-1.5 sm:p-2 font-bold bg-neutral-100 border-r border-b border-black">
                      {t.processLabel}
                    </td>
                    <td className="w-1/4 p-1.5 sm:p-2 font-bold font-mono border-r-2 border-b border-black uppercase text-black">
                      {processTitle}
                    </td>
                    <td className="w-1/4 p-1.5 sm:p-2 font-bold bg-neutral-100 border-r border-b border-black">
                      {t.lotNoLabel}
                    </td>
                    <td className="w-1/4 p-1.5 sm:p-2 font-mono text-neutral-800 border-b border-black">
                      {returnMode === 'filled' ? lot.lotNumber : ''}
                    </td>
                  </tr>

                  {/* Row 2: Lot Number / Karigar Return */}
                  <tr className="border-b border-black">
                    <td className="p-1.5 sm:p-2 font-bold bg-neutral-100 border-r border-b border-black">
                      {t.lotNoLabel}
                    </td>
                    <td className="p-1.5 sm:p-2 font-bold font-mono border-r-2 border-b border-black text-black">
                      {lot.lotNumber}
                    </td>
                    <td className="p-1.5 sm:p-2 font-bold bg-neutral-100 border-r border-b border-black">
                      {t.karigarLabel}
                    </td>
                    <td className="p-1.5 sm:p-2 font-mono text-neutral-800 border-b border-black">
                      {returnMode === 'filled' ? karigarName : ''}
                    </td>
                  </tr>

                  {/* Row 3: Karigar Name / Design Return */}
                  <tr className="border-b border-black">
                    <td className="p-1.5 sm:p-2 font-bold bg-neutral-100 border-r border-b border-black">
                      {t.karigarLabel}
                    </td>
                    <td className="p-1.5 sm:p-2 font-bold border-r-2 border-b border-black text-black">
                      {karigarName}
                    </td>
                    <td className="p-1.5 sm:p-2 font-bold bg-neutral-100 border-r border-b border-black">
                      {t.designLabel}
                    </td>
                    <td className="p-1.5 sm:p-2 text-neutral-800 border-b border-black">
                      {returnMode === 'filled' ? design.name : ''}
                    </td>
                  </tr>

                  {/* Row 4: Design Name / Good Pieces */}
                  <tr className="border-b border-black">
                    <td className="p-1.5 sm:p-2 font-bold bg-neutral-100 border-r border-b border-black">
                      {t.designLabel}
                    </td>
                    <td className="p-1.5 sm:p-2 font-bold border-r-2 border-b border-black truncate max-w-[140px] text-black">
                      {design.name}
                    </td>
                    <td className="p-1.5 sm:p-2 font-bold bg-neutral-100 border-r border-b border-black">
                      {t.goodPiecesLabel}
                    </td>
                    <td className="p-1.5 sm:p-2 font-mono font-bold text-neutral-800 border-b border-black">
                      {returnMode === 'filled' && selectedRecord?.statedPieces != null
                        ? selectedRecord.statedPieces
                        : ''}
                    </td>
                  </tr>

                  {/* Row 5: Weight Sent / Without Studs */}
                  <tr className="border-b border-black">
                    <td className="p-1.5 sm:p-2 font-bold bg-neutral-100 border-r border-b border-black">
                      {t.weightLabel}
                    </td>
                    <td className="p-1.5 sm:p-2 font-bold font-mono border-r-2 border-b border-black text-black">
                      {(weightSent ?? 0).toFixed(3)}
                    </td>
                    <td className="p-1.5 sm:p-2 font-bold bg-neutral-100 border-r border-b border-black">
                      {t.withoutStudLabel}
                    </td>
                    <td className="p-1.5 sm:p-2 font-mono text-neutral-800 border-b border-black">
                      {/* Blank area for Karigar handwriting */}
                    </td>
                  </tr>

                  {/* Row 6: Pieces Sent / Rejection Pieces */}
                  <tr className="border-b border-black">
                    <td className="p-1.5 sm:p-2 font-bold bg-neutral-100 border-r border-b border-black">
                      {t.piecesLabel}
                    </td>
                    <td className="p-1.5 sm:p-2 font-bold font-mono border-r-2 border-b border-black text-black">
                      {piecesSent}
                    </td>
                    <td className="p-1.5 sm:p-2 font-bold bg-neutral-100 border-r border-b border-black">
                      {t.rejectionLabel}
                    </td>
                    <td className="p-1.5 sm:p-2 font-mono font-bold text-red-600 border-b border-black">
                      {returnMode === 'filled' && selectedRecord?.rejectedPieces != null
                        ? selectedRecord.rejectedPieces
                        : ''}
                    </td>
                  </tr>

                  {/* Row 7: Amount (રકમ) / Return Weight */}
                  <tr className="border-b border-black">
                    <td className="p-1.5 sm:p-2 font-bold bg-neutral-100 border-r border-b border-black">
                      {t.amountLabel}
                    </td>
                    <td className="p-1.5 sm:p-2 font-bold font-mono border-r-2 border-b border-black text-black">
                      {amountValue}
                    </td>
                    <td className="p-1.5 sm:p-2 font-bold bg-neutral-100 border-r border-b border-black">
                      {t.returnWeightLabel}
                    </td>
                    <td className="p-1.5 sm:p-2 font-mono font-bold text-neutral-800 border-b border-black">
                      {returnMode === 'filled' && selectedRecord?.weightReceived != null
                        ? selectedRecord.weightReceived.toFixed(3)
                        : ''}
                    </td>
                  </tr>

                  {/* Row 8: Date / Total */}
                  <tr className="border-b border-black">
                    <td className="p-1.5 sm:p-2 font-bold bg-neutral-100 border-r border-b border-black">
                      {t.dateLabel}
                    </td>
                    <td className="p-1.5 sm:p-2 font-bold font-mono border-r-2 border-b border-black text-black">
                      {dateSent}
                    </td>
                    <td className="p-1.5 sm:p-2 font-bold bg-neutral-100 border-r border-b border-black">
                      {t.totalLabel}
                    </td>
                    <td className="p-1.5 sm:p-2 font-mono font-bold text-black border-b border-black">
                      {returnMode === 'filled' && selectedRecord?.statedPieces != null
                        ? selectedRecord.statedPieces
                        : ''}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* BOTTOM SECTION: BARCODE (LEFT) | DESIGN IMAGE (CENTER) | DYNAMIC QR (RIGHT) */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 items-center border-t-2 border-black pt-3">
              {/* 1. Barcode (Left) */}
              <div className="flex flex-col items-center justify-center p-1 sm:p-2 border border-black rounded-lg bg-white min-h-[110px]">
                <div className="text-[9px] font-bold text-neutral-600 uppercase tracking-tight mb-1 text-center">
                  DESIGN BARCODE
                </div>
                <div
                  className="w-full flex justify-center py-1 overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: barcodeSvg }}
                />
                <span className="text-[10px] font-mono font-bold text-black mt-1">
                  {design.barcode}
                </span>
              </div>

              {/* 2. Photo of Ring with Design Ref Stamp (Center) */}
              <div className="relative flex flex-col items-center justify-center p-1 border border-black rounded-lg bg-white min-h-[110px] overflow-hidden">
                <img
                  src={design.photoUrl}
                  alt={design.name}
                  className="w-full h-24 sm:h-28 object-cover rounded"
                />
                {/* Visual Stamp like "NO-1257" or design ref from user photo */}
                <div className="absolute inset-x-1 bottom-1 bg-black/80 text-white font-mono font-bold text-[10px] sm:text-xs text-center py-0.5 px-1 tracking-wider uppercase backdrop-blur-xs">
                  NO: {design.orderRef || design.name.substring(0, 10)}
                </div>
              </div>

              {/* 3. Scannable Dynamic QR Code (Right) */}
              <div className="flex flex-col items-center justify-center p-1 sm:p-2 border border-black rounded-lg bg-white min-h-[110px]">
                <div className="text-[9px] font-bold text-neutral-600 uppercase tracking-tight mb-1 text-center">
                  STAGE QR SCAN
                </div>
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Stage QR"
                    className="w-18 h-18 sm:w-20 sm:h-20 border border-neutral-300 p-0.5 bg-white"
                  />
                ) : (
                  <div className="w-18 h-18 bg-neutral-200 animate-pulse rounded" />
                )}
                <span className="text-[9px] font-mono font-bold text-black mt-1 tracking-tight text-center">
                  {lot.lotNumber} &bull; STG {stageNumber}
                </span>
              </div>
            </div>

            {/* Slip verification line */}
            <div className="text-[8.5px] font-mono text-neutral-500 flex items-center justify-between pt-2 mt-2 border-t border-dotted border-neutral-400">
              <span>Shreenathji Imitation &bull; Stage: {selectedStageName}</span>
              <span>Dynamic QR changes per stage</span>
              <span>Karigar: {karigarName}</span>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER CONTROLS (HIDDEN DURING PHYSICAL PRINT) */}
        <div
          className={`no-print flex flex-wrap items-center justify-between gap-2.5 px-4 sm:px-6 py-3 border-t text-xs shrink-0 ${
            isBright
              ? 'bg-[#FAFAFA] border-[#E4E4E7] text-[#71717A]'
              : 'bg-[#121214] border-[#27272A] text-neutral-400'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="hidden sm:inline truncate">
              Printed slip accompanies physical tray to workshop artisans. Scan QR on arrival to confirm.
            </span>
            <span className="sm:hidden text-[11px] truncate">Accompany batch with this slip.</span>
          </div>

          <div className="flex items-center gap-2 ml-auto shrink-0">
            <button
              onClick={() => setReturnMode(returnMode === 'blank' ? 'filled' : 'blank')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl font-medium transition border flex items-center gap-1.5 text-xs ${
                isBright
                  ? 'bg-white hover:bg-slate-100 text-[#1E293B] border-[#CBD5E1]'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {returnMode === 'blank' ? 'Show Pre-filled Data' : 'Show Blank Lines'}
              </span>
              <span className="sm:hidden">
                {returnMode === 'blank' ? 'Pre-filled' : 'Blank'}
              </span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 sm:px-4 py-1.5 font-bold rounded-xl text-neutral-950 bg-amber-400 hover:bg-amber-300 active:scale-95 transition flex items-center gap-1.5 shadow-sm text-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <button
              onClick={onClose}
              className={`px-3 sm:px-4 py-1.5 font-bold rounded-xl transition flex items-center gap-1.5 border text-xs active:scale-95 shadow-xs ${
                isBright
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700'
              }`}
            >
              <X className="w-3.5 h-3.5" />
              <span>Close</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
