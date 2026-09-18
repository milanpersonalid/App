import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Design, Lot } from '../types';
import {
  Camera,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Upload,
  RefreshCw,
  Sparkles,
  QrCode,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { extractImageFingerprint, findTop3Matches, SimilarityResult } from '../utils/photoSearch';

type ScannerMode = 'confirm_arrival' | 'look_up' | 'photo_search';

interface ScannerModalProps {
  initialMode?: ScannerMode;
  onClose: () => void;
  onSelectDesign?: (design: Design) => void;
  onSelectLot?: (lot: Lot) => void;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({
  initialMode = 'confirm_arrival',
  onClose,
  onSelectDesign,
  onSelectLot,
}) => {
  const { lots, designs, confirmArrival } = useApp();
  const [mode, setMode] = useState<ScannerMode>(initialMode);

  // Video / Camera stream
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCamera, setHasCamera] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string>('');
  const streamRef = useRef<MediaStream | null>(null);

  // Text / manual scan simulator input
  const [manualCodeInput, setManualCodeInput] = useState<string>('');

  // Mode 1: Confirm Arrival Result
  const [arrivalResult, setArrivalResult] = useState<{
    success: boolean;
    message: string;
    lot?: Lot;
  } | null>(null);

  // Mode 2: Look Up Result
  const [lookupResult, setLookupResult] = useState<{
    type: 'design' | 'lot';
    item: Design | Lot;
  } | null>(null);
  const [lookupError, setLookupError] = useState<string>('');

  // Mode 3: Photo Search State
  const [photoSearchImage, setPhotoSearchImage] = useState<string | null>(null);
  const [photoSearchResults, setPhotoSearchResults] = useState<SimilarityResult[]>([]);
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState<boolean>(false);
  const [confirmedMatch, setConfirmedMatch] = useState<Design | null>(null);

  // Initialize camera
  useEffect(() => {
    let active = true;

    async function startCamera() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setCameraError('Camera access not supported in this browser.');
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
        });
        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setHasCamera(true);
        setCameraError('');
      } catch (err: any) {
        console.warn('Camera failed to start:', err);
        setCameraError('Camera unavailable. Use manual scanner input or upload photo.');
        setHasCamera(false);
      }
    }

    startCamera();

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Handle Mode 1: Confirm Arrival execution
  const handleConfirmArrival = (code: string) => {
    if (!code.trim()) return;
    const res = confirmArrival(code.trim());
    setArrivalResult(res);
    setManualCodeInput('');
  };

  // Handle Mode 2: Look Up execution
  const handleLookup = (code: string) => {
    const query = code.trim().toUpperCase();
    if (!query) return;

    setLookupError('');
    setLookupResult(null);

    // Check exact match design barcode or ID
    const foundDesign = designs.find(
      (d) => d.barcode.toUpperCase() === query || d.id.toUpperCase() === query
    );
    if (foundDesign) {
      setLookupResult({ type: 'design', item: foundDesign });
      return;
    }

    // Check exact match lot number or ID
    const foundLot = lots.find(
      (l) => l.lotNumber.toUpperCase() === query || l.id.toUpperCase() === query
    );
    if (foundLot) {
      setLookupResult({ type: 'lot', item: foundLot });
      return;
    }

    setLookupError(`No design with barcode "${query}" or lot with number "${query}" found.`);
  };

  // Handle Mode 3: Photo Search execution
  const analyzePhoto = async (imageSrc: string) => {
    setIsAnalyzingPhoto(true);
    setConfirmedMatch(null);
    try {
      const fp = await extractImageFingerprint(imageSrc);
      const matches = findTop3Matches(fp, designs);
      setPhotoSearchResults(matches);
    } catch (err) {
      console.error('Photo search failed:', err);
    } finally {
      setIsAnalyzingPhoto(false);
    }
  };

  // Capture snapshot from video feed
  const captureSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 400;
    canvas.height = videoRef.current.videoHeight || 400;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setPhotoSearchImage(dataUrl);
      analyzePhoto(dataUrl);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const src = reader.result as string;
        setPhotoSearchImage(src);
        analyzePhoto(src);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto overflow-x-hidden w-full max-w-full no-print">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl overflow-hidden overflow-x-hidden my-4 max-w-full">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-800 bg-neutral-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-100 text-sm sm:text-base">
                Scanner &amp; Optical Recognition
              </h3>
              <p className="text-[11px] text-neutral-400">
                Choose one of three dedicated scanning modes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 MODE TABS */}
        <div className="grid grid-cols-3 p-1.5 sm:p-2 bg-neutral-950 border-b border-neutral-800 gap-1 text-xs w-full overflow-hidden">
          <button
            onClick={() => {
              setMode('confirm_arrival');
              setArrivalResult(null);
            }}
            className={`py-2 px-2.5 rounded-xl font-medium transition-all flex flex-col items-center gap-1 ${
              mode === 'confirm_arrival'
                ? 'bg-red-500/20 text-red-300 border border-red-500/40 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span className="font-bold text-[11px]">1. Confirm Arrival</span>
          </button>

          <button
            onClick={() => {
              setMode('look_up');
              setLookupResult(null);
              setLookupError('');
            }}
            className={`py-2 px-2.5 rounded-xl font-medium transition-all flex flex-col items-center gap-1 ${
              mode === 'look_up'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Search className="w-4 h-4" />
            <span className="font-bold text-[11px]">2. Look Up</span>
          </button>

          <button
            onClick={() => {
              setMode('photo_search');
              setConfirmedMatch(null);
            }}
            className={`py-2 px-2.5 rounded-xl font-medium transition-all flex flex-col items-center gap-1 ${
              mode === 'photo_search'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span className="font-bold text-[11px]">3. Photo Search</span>
          </button>
        </div>

        {/* MODE SPECIFIC INSTRUCTIONS BANNER */}
        <div className="px-5 py-2.5 bg-neutral-950/70 border-b border-neutral-800/80 text-xs">
          {mode === 'confirm_arrival' && (
            <div className="text-neutral-300 flex items-center justify-between">
              <span>
                <strong className="text-red-400">Step 5 Status Flip:</strong> Scans QR/barcode and{' '}
                <em>flips lot status strictly to Red — "Arrived, awaiting entry."</em> No data entry.
              </span>
            </div>
          )}
          {mode === 'look_up' && (
            <div className="text-neutral-300">
              <strong className="text-amber-400">Exact Match Retrieval:</strong> Scans permanent design
              barcode (e.g. <span className="font-mono text-amber-300">DES-108501</span>) or lot identifier.
            </div>
          )}
          {mode === 'photo_search' && (
            <div className="text-neutral-300">
              <strong className="text-blue-400">Visual Similarity Ranking:</strong> Photographs ring,
              extracts visual fingerprint, and computes <span className="font-bold text-white">top 3 matches</span>.
            </div>
          )}
        </div>

        {/* CAMERA / VIEWFINDER CONTAINER */}
        <div className="p-5 space-y-4">
          <div className="relative aspect-video max-h-56 w-full rounded-xl bg-neutral-950 border border-neutral-800 overflow-hidden flex items-center justify-center">
            {hasCamera ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-4">
                <Camera className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                <p className="text-xs text-neutral-400 max-w-xs">{cameraError || 'Camera inactive'}</p>
              </div>
            )}

            {/* Target Reticle Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div
                className={`w-48 h-36 border-2 rounded-xl transition-all ${
                  mode === 'confirm_arrival'
                    ? 'border-red-400/80 border-dashed animate-pulse'
                    : mode === 'look_up'
                    ? 'border-amber-400/80'
                    : 'border-blue-400/80'
                }`}
              />
            </div>

            {/* Photo Search Capture trigger button */}
            {mode === 'photo_search' && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3">
                <button
                  onClick={captureSnapshot}
                  disabled={!hasCamera}
                  className="px-4 py-2 rounded-full bg-blue-500 hover:bg-blue-400 text-neutral-950 font-bold text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" /> Snap Photo
                </button>
                <label className="px-4 py-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-100 font-bold text-xs flex items-center gap-1.5 shadow-lg cursor-pointer active:scale-95 transition">
                  <Upload className="w-4 h-4" /> Upload Image
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            )}
          </div>

          {/* Quick active lots or barcode simulator for easy instant testing */}
          {(mode === 'confirm_arrival' || mode === 'look_up') && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={
                    mode === 'confirm_arrival'
                      ? 'Scan or enter Lot # (e.g. LOT-901, LOT-902)...'
                      : 'Scan or enter Design Barcode (e.g. DES-108501) or Lot #...'
                  }
                  value={manualCodeInput}
                  onChange={(e) => setManualCodeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (mode === 'confirm_arrival') handleConfirmArrival(manualCodeInput);
                      else handleLookup(manualCodeInput);
                    }
                  }}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-neutral-100 text-xs font-mono outline-none focus:border-amber-500"
                />
                <button
                  onClick={() => {
                    if (mode === 'confirm_arrival') handleConfirmArrival(manualCodeInput);
                    else handleLookup(manualCodeInput);
                  }}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs transition active:scale-95"
                >
                  Process
                </button>
              </div>

              {/* Sample Tap-to-Test Badges */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-neutral-400">
                <span className="text-neutral-500">Quick test:</span>
                {mode === 'confirm_arrival' ? (
                  lots
                    .filter((l) => l.status === 'in_progress')
                    .slice(0, 4)
                    .map((l) => (
                      <button
                        key={l.id}
                        onClick={() => handleConfirmArrival(l.lotNumber)}
                        className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-mono text-[10px] border border-neutral-700"
                      >
                        {l.lotNumber} ({l.currentStage})
                      </button>
                    ))
                ) : (
                  <>
                    {designs.slice(0, 3).map((d) => (
                      <button
                        key={d.id}
                        onClick={() => handleLookup(d.barcode)}
                        className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-300 font-mono text-[10px] border border-neutral-700"
                      >
                        {d.barcode}
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}

          {/* MODE 1: CONFIRM ARRIVAL FEEDBACK */}
          {mode === 'confirm_arrival' && arrivalResult && (
            <div
              className={`p-4 rounded-xl border text-xs ${
                arrivalResult.success
                  ? 'bg-red-950/40 border-red-500/50 text-red-200'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-300'
              }`}
            >
              <div className="flex items-start gap-3">
                {arrivalResult.success ? (
                  <div className="w-4 h-4 rounded-full bg-red-500 flex-shrink-0 mt-0.5 animate-pulse" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="space-y-1.5 flex-1">
                  <div className="font-bold uppercase tracking-wider text-red-400">
                    Step 5: Status Flipped to "Arrived, awaiting entry"
                  </div>
                  <p className="text-neutral-200 leading-relaxed">{arrivalResult.message}</p>
                  <p className="text-[11px] text-neutral-400 italic">
                    Note: Step 5 is strictly a status flip. Manual data entry happens separately in Step 6 whenever the admin has time.
                  </p>
                  {arrivalResult.lot && onSelectLot && (
                    <button
                      onClick={() => {
                        onSelectLot(arrivalResult.lot!);
                        onClose();
                      }}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 font-semibold text-xs border border-red-500/30"
                    >
                      View Lot Detail <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* MODE 2: LOOK UP FEEDBACK */}
          {mode === 'look_up' && (
            <>
              {lookupError && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                  {lookupError}
                </div>
              )}
              {lookupResult && (
                <div className="p-4 rounded-xl bg-neutral-950 border border-amber-500/40 text-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                    <span className="font-bold text-amber-400 uppercase tracking-wider">
                      Exact Match Found ({lookupResult.type.toUpperCase()})
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {lookupResult.type === 'design'
                        ? (lookupResult.item as Design).barcode
                        : (lookupResult.item as Lot).lotNumber}
                    </span>
                  </div>

                  {lookupResult.type === 'design' ? (
                    (() => {
                      const d = lookupResult.item as Design;
                      return (
                        <div className="flex items-center gap-3">
                          <img
                            src={d.photoUrl}
                            alt={d.name}
                            className="w-16 h-16 rounded-lg object-cover border border-neutral-700"
                          />
                          <div className="flex-1 space-y-1">
                            <h4 className="font-bold text-sm text-neutral-100">{d.name}</h4>
                            <div className="text-neutral-400 text-[11px]">
                              Code: <span className="font-mono text-neutral-200">{d.orderRef}</span> &bull;
                              Avg Wt: <span className="font-mono text-amber-300">{d.averageWeightPerPiece}g</span>
                            </div>
                            {onSelectDesign && (
                              <button
                                onClick={() => {
                                  onSelectDesign(d);
                                  onClose();
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-400 text-neutral-950 font-bold text-xs hover:bg-amber-300 transition"
                              >
                                Open Design View <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    (() => {
                      const l = lookupResult.item as Lot;
                      return (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-neutral-200">
                            <span className="font-bold">{l.lotNumber}</span>
                            <span className="px-2 py-0.5 rounded bg-neutral-800 text-[11px] font-mono">
                              Stage: {l.currentStage}
                            </span>
                          </div>
                          <div className="text-neutral-400 text-[11px]">
                            Design: {l.designName} &bull; Karigar: {l.currentKarigarName}
                          </div>
                          {onSelectLot && (
                            <button
                              onClick={() => {
                                onSelectLot(l);
                                onClose();
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-400 text-neutral-950 font-bold text-xs hover:bg-amber-300 transition"
                            >
                              Open Lot View <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      );
                    })()
                  )}
                </div>
              )}
            </>
          )}

          {/* MODE 3: PHOTO SEARCH TOP 3 RANKED MATCHES */}
          {mode === 'photo_search' && (
            <div className="space-y-3 pt-1">
              {isAnalyzingPhoto && (
                <div className="flex items-center justify-center gap-2 p-4 text-xs text-blue-400 bg-neutral-950 rounded-xl">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Analyzing image fingerprint and calculating top 3 similarity rankings...</span>
                </div>
              )}

              {photoSearchResults.length > 0 && !isAnalyzingPhoto && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-neutral-200 uppercase tracking-wider">
                      Top 3 Similarity Matches
                    </span>
                    <span className="text-[11px] text-neutral-400">Ranked by similarity %</span>
                  </div>

                  <div className="space-y-2">
                    {photoSearchResults.map(({ design, similarity }, index) => {
                      const isConfirmed = confirmedMatch?.id === design.id;
                      return (
                        <div
                          key={design.id}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                            isConfirmed
                              ? 'bg-emerald-950/40 border-emerald-500/60 ring-1 ring-emerald-500'
                              : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-bold text-amber-400 font-mono">
                              #{index + 1}
                            </div>
                            <img
                              src={design.photoUrl}
                              alt={design.name}
                              className="w-12 h-12 rounded-lg object-cover border border-neutral-800"
                            />
                            <div>
                              <h4 className="font-semibold text-xs text-neutral-100">{design.name}</h4>
                              <div className="text-[10px] text-neutral-400 font-mono">
                                Barcode: {design.barcode} &bull; Code: {design.orderRef}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {/* Similarity Score bar */}
                            <div className="text-right">
                              <div className="text-xs font-bold font-mono text-blue-400">
                                {similarity}% Match
                              </div>
                              <div className="w-16 h-1.5 bg-neutral-800 rounded-full overflow-hidden mt-1">
                                <div
                                  className="h-full bg-blue-500 rounded-full"
                                  style={{ width: `${similarity}%` }}
                                />
                              </div>
                            </div>

                            {/* Confirm Match button */}
                            <button
                              onClick={() => {
                                setConfirmedMatch(design);
                                if (onSelectDesign) {
                                  onSelectDesign(design);
                                }
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                                isConfirmed
                                  ? 'bg-emerald-500 text-neutral-950'
                                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
                              }`}
                            >
                              {isConfirmed ? (
                                <span className="flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed
                                </span>
                              ) : (
                                'Confirm'
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {confirmedMatch && (
                    <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
                      <span>Confirmed design: <strong>{confirmedMatch.name}</strong></span>
                      {onSelectDesign && (
                        <button
                          onClick={() => {
                            onSelectDesign(confirmedMatch);
                            onClose();
                          }}
                          className="font-bold underline ml-2"
                        >
                          View Design
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-neutral-950 border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition"
          >
            Close Scanner
          </button>
        </div>
      </div>
    </div>
  );
};
