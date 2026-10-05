import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuthAndTheme } from '../context/AuthAndThemeContext';
import { Design, Lot } from '../types';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import {
  BarcodeFormat,
  BarcodeScanner,
  GoogleBarcodeScannerModuleInstallState,
} from '@capacitor-mlkit/barcode-scanning';
import { Camera as NativeCamera, CameraDirection } from '@capacitor/camera';
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
import { getStageWeightKey, getStageWeightLabel } from '../utils/stageWeights';

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
  const { theme } = useAuthAndTheme();
  const isBright = theme === 'bright';
  const [mode, setMode] = useState<ScannerMode>(initialMode);

  // Video / Camera stream
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCamera, setHasCamera] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isTakingPhoto, setIsTakingPhoto] = useState<boolean>(false);
  const streamRef = useRef<MediaStream | null>(null);
  const scanListenerRef = useRef<PluginListenerHandle | null>(null);
  const scanHandledRef = useRef<boolean>(false);
  const isNative = Capacitor.isNativePlatform();

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

  // Native Android uses Capacitor camera/scanner plugins. A live browser
  // camera is needed only for the web Photo Search preview.
  useEffect(() => {
    let active = true;
    if (isNative || mode !== 'photo_search') return;

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
        streamRef.current = null;
      }
      if (scanListenerRef.current) {
        void scanListenerRef.current.remove();
        scanListenerRef.current = null;
        void BarcodeScanner.stopScan();
      }
    };
  }, [isNative, mode]);

  // Handle Mode 1: Confirm Arrival execution
  const handleConfirmArrival = async (code: string) => {
    if (!code.trim()) return;
    const res = await confirmArrival(code.trim());
    setArrivalResult(res);
    setManualCodeInput('');
  };

  // Handle Mode 2: Look Up execution
  const handleLookup = (code: string) => {
    const query = code.trim().toUpperCase();
    const normalizedQuery = query.replace(/[^A-Z0-9]/g, '');
    if (!query) return;

    setLookupError('');
    setLookupResult(null);

    // Check exact match design barcode or ID
    const foundDesign = designs.find(
      (d) =>
        d.barcode.toUpperCase() === query ||
        d.id.toUpperCase() === query ||
        d.barcode.toUpperCase().replace(/[^A-Z0-9]/g, '') === normalizedQuery ||
        d.id.toUpperCase().replace(/[^A-Z0-9]/g, '') === normalizedQuery
    );
    if (foundDesign) {
      setLookupResult({ type: 'design', item: foundDesign });
      return;
    }

    // Check exact match lot number or ID
    const foundLot = lots.find(
      (l) =>
        l.lotNumber.toUpperCase() === query ||
        l.id.toUpperCase() === query ||
        l.lotNumber.toUpperCase().replace(/[^A-Z0-9]/g, '') === normalizedQuery ||
        l.id.toUpperCase().replace(/[^A-Z0-9]/g, '') === normalizedQuery
    );
    if (foundLot) {
      setLookupResult({ type: 'lot', item: foundLot });
      return;
    }

    setLookupError(`No design with barcode "${query}" or lot with number "${query}" found.`);
  };

  const handleScannedCode = async (code: string) => {
    const value = code.trim();
    if (!value) return;
    setManualCodeInput(value);
    if (mode === 'confirm_arrival') await handleConfirmArrival(value);
    else if (mode === 'look_up') handleLookup(value);
  };

  const ensureGoogleScannerModule = async () => {
    const { available } = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
    if (available) return;

    setCameraError('Preparing the barcode scanner for first use…');
    await new Promise<void>((resolve, reject) => {
      let listener: PluginListenerHandle | undefined;
      let settled = false;
      const finish = (error?: Error) => {
        if (settled) return;
        settled = true;
        void listener?.remove();
        if (error) reject(error);
        else resolve();
      };

      void BarcodeScanner.addListener('googleBarcodeScannerModuleInstallProgress', (event) => {
        if (event.progress !== undefined) {
          setCameraError(`Preparing the barcode scanner… ${Math.round(event.progress)}%`);
        }
        if (event.state === GoogleBarcodeScannerModuleInstallState.COMPLETED) finish();
        if (
          event.state === GoogleBarcodeScannerModuleInstallState.FAILED ||
          event.state === GoogleBarcodeScannerModuleInstallState.CANCELED
        ) {
          finish(new Error('Scanner setup did not finish. Check your internet connection and try again.'));
        }
      }).then((registeredListener) => {
        listener = registeredListener;
        return BarcodeScanner.installGoogleBarcodeScannerModule();
      }).catch((error: unknown) => {
        finish(error instanceof Error ? error : new Error('Unable to prepare the barcode scanner.'));
      });
    });

    const installed = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
    if (!installed.available) throw new Error('Scanner setup is incomplete. Please try again.');
  };

  const startBarcodeScan = async () => {
    setCameraError('');
    setIsScanning(true);
    scanHandledRef.current = false;

    try {
      if (isNative) {
        await ensureGoogleScannerModule();
        setCameraError('');
        const { barcodes } = await BarcodeScanner.scan({
          formats: [
            BarcodeFormat.QrCode,
            BarcodeFormat.Code128,
            BarcodeFormat.Code39,
            BarcodeFormat.Code93,
            BarcodeFormat.Ean13,
            BarcodeFormat.Ean8,
            BarcodeFormat.DataMatrix,
            BarcodeFormat.Pdf417,
            BarcodeFormat.Aztec,
          ],
          autoZoom: true,
        });
        const value = barcodes.find((barcode) => barcode.rawValue || barcode.displayValue);
        if (value) await handleScannedCode(value.rawValue || value.displayValue);
        else setCameraError('No code was read. Try again or enter it below.');
        return;
      }

      const { supported } = await BarcodeScanner.isSupported();
      if (!supported || !videoRef.current) {
        setCameraError('Live scanning is not supported in this browser. Enter the code below instead.');
        setIsScanning(false);
        return;
      }
      scanListenerRef.current = await BarcodeScanner.addListener('barcodesScanned', async ({ barcodes }) => {
        if (scanHandledRef.current) return;
        const value = barcodes.find((barcode) => barcode.rawValue || barcode.displayValue);
        if (!value) return;
        scanHandledRef.current = true;
        await BarcodeScanner.stopScan();
        await scanListenerRef.current?.remove();
        scanListenerRef.current = null;
        setHasCamera(false);
        setIsScanning(false);
        await handleScannedCode(value.rawValue || value.displayValue);
      });
      await BarcodeScanner.startScan({
        videoElement: videoRef.current,
        formats: [
          BarcodeFormat.QrCode,
          BarcodeFormat.Code128,
          BarcodeFormat.Code39,
          BarcodeFormat.Code93,
          BarcodeFormat.Ean13,
          BarcodeFormat.Ean8,
          BarcodeFormat.DataMatrix,
          BarcodeFormat.Pdf417,
          BarcodeFormat.Aztec,
        ],
      });
      setHasCamera(true);
    } catch (error) {
      console.warn('Barcode scan failed:', error);
      setCameraError(error instanceof Error ? error.message : 'Unable to open the scanner.');
      await scanListenerRef.current?.remove();
      scanListenerRef.current = null;
    } finally {
      if (isNative || scanHandledRef.current) setIsScanning(false);
    }
  };

  // Handle Mode 3: Photo Search execution
  const analyzePhoto = async (imageSrc: string) => {
    setIsAnalyzingPhoto(true);
    setConfirmedMatch(null);
    setCameraError('');
    try {
      const fp = await extractImageFingerprint(imageSrc);
      if (!fp.perceptualHash || fp.hash === 'unavailable') {
        throw new Error('The selected photo could not be analyzed. Try another image.');
      }
      const matches = await findTop3Matches(fp, designs);
      setPhotoSearchResults(matches);
      if (designs.length > 0 && matches.length === 0) {
        setCameraError('Could not read the saved design photos from Supabase. Check the connection and try again.');
      }
    } catch (err) {
      console.error('Photo search failed:', err);
      setCameraError(err instanceof Error ? err.message : 'Could not analyze this photo. Try another image.');
    } finally {
      setIsAnalyzingPhoto(false);
    }
  };

  // Capture snapshot from video feed
  const captureSnapshot = async () => {
    if (isNative) {
      setIsTakingPhoto(true);
      setCameraError('');
      try {
        const photo = await NativeCamera.takePhoto({
          quality: 85,
          cameraDirection: CameraDirection.Rear,
          targetWidth: 1280,
          targetHeight: 960,
        });
        const imageSrc = photo.thumbnail
          ? `data:image/jpeg;base64,${photo.thumbnail}`
          : photo.webPath;
        if (!imageSrc) throw new Error('The camera did not return a usable image.');
        setPhotoSearchImage(imageSrc);
        await analyzePhoto(imageSrc);
      } catch (error) {
        console.warn('Photo capture failed:', error);
        setCameraError(error instanceof Error ? error.message : 'Unable to take a photo.');
      } finally {
        setIsTakingPhoto(false);
      }
      return;
    }

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto overflow-x-hidden w-full max-w-full no-print">
      <div
        className={`relative w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden overflow-x-hidden my-4 border transition-colors max-w-full ${
          isBright
            ? 'bg-white border-slate-200 text-slate-900'
            : 'bg-neutral-900 border-neutral-700 text-neutral-100'
        }`}
      >
        {/* Header Bar */}
        <div
          className={`flex items-center justify-between px-5 py-3.5 border-b transition-colors ${
            isBright ? 'bg-slate-50 border-slate-200' : 'bg-neutral-950 border-neutral-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-lg border ${
                isBright
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}
            >
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3
                className={`font-semibold text-sm sm:text-base ${
                  isBright ? 'text-slate-900' : 'text-neutral-100'
                }`}
              >
                Scanner &amp; Optical Recognition
              </h3>
              <p className={`text-[11px] ${isBright ? 'text-slate-500' : 'text-neutral-400'}`}>
                Choose one of three dedicated scanning modes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-xl transition-colors ${
              isBright
                ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 MODE TABS */}
        <div
          className={`grid grid-cols-3 p-1.5 sm:p-2 border-b gap-1 text-xs w-full overflow-hidden transition-colors ${
            isBright ? 'bg-slate-100 border-slate-200' : 'bg-neutral-950 border-neutral-800'
          }`}
        >
          <button
            onClick={() => {
              setMode('confirm_arrival');
              setArrivalResult(null);
            }}
            className={`py-2 px-2.5 rounded-xl font-medium transition-all flex flex-col items-center gap-1 ${
              mode === 'confirm_arrival'
                ? isBright
                  ? 'bg-rose-100 text-rose-800 border border-rose-300 shadow-sm font-bold'
                  : 'bg-red-500/20 text-red-300 border border-red-500/40 shadow-sm'
                : isBright
                ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
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
                ? isBright
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-sm font-bold'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : isBright
                ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
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
                ? isBright
                  ? 'bg-blue-100 text-blue-900 border border-blue-300 shadow-sm font-bold'
                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
                : isBright
                ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span className="font-bold text-[11px]">3. Photo Search</span>
          </button>
        </div>

        {/* MODE SPECIFIC INSTRUCTIONS BANNER */}
        <div
          className={`px-5 py-2.5 border-b text-xs transition-colors ${
            isBright
              ? 'bg-slate-50 border-slate-200 text-slate-700'
              : 'bg-neutral-950/70 border-neutral-800/80 text-neutral-300'
          }`}
        >
          {mode === 'confirm_arrival' && (
            <div className={`flex items-center justify-between ${isBright ? 'text-slate-700' : 'text-neutral-300'}`}>
              <span>
                <strong className={isBright ? 'text-rose-700 font-bold' : 'text-red-400'}>
                  Scan Arrival:
                </strong>{' '}
                Scans QR/barcode and{' '}
                <em className={isBright ? 'text-slate-900 font-semibold not-italic underline decoration-slate-300' : ''}>
                  updates lot status to "Arrived, awaiting entry."
                </em>{' '}
                Return data can be entered anytime.
              </span>
            </div>
          )}
          {mode === 'look_up' && (
            <div className={isBright ? 'text-slate-700' : 'text-neutral-300'}>
              <span>
                <strong className={isBright ? 'text-amber-800 font-bold' : 'text-amber-400'}>
                  Exact Match Retrieval:
                </strong>{' '}
                Scans permanent design barcode (e.g.{' '}
                <span
                  className={`font-mono px-1.5 py-0.5 rounded text-[11px] ${
                    isBright
                      ? 'text-amber-900 bg-amber-100 border border-amber-200 font-semibold'
                      : 'text-amber-300'
                  }`}
                >
                  DES-108501
                </span>
                ) or lot identifier.
              </span>
            </div>
          )}
          {mode === 'photo_search' && (
            <div className={isBright ? 'text-slate-700' : 'text-neutral-300'}>
              <span>
                <strong className={isBright ? 'text-blue-800 font-bold' : 'text-blue-400'}>
                  Visual Similarity Ranking:
                </strong>{' '}
                Photographs ring, extracts visual fingerprint, and computes{' '}
                <span className={`font-bold ${isBright ? 'text-slate-900' : 'text-white'}`}>
                  top 3 matches
                </span>
                .
              </span>
            </div>
          )}
        </div>

        {/* CAMERA / VIEWFINDER CONTAINER */}
        <div className="p-5 space-y-4">
          <div
            className={`relative aspect-video max-h-56 w-full rounded-xl overflow-hidden flex items-center justify-center border transition-colors ${
              isBright ? 'bg-slate-900 border-slate-300' : 'bg-neutral-950 border-neutral-800'
            }`}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={hasCamera ? 'absolute inset-0 w-full h-full object-cover' : 'hidden'}
            />
            {!hasCamera && (
              <div className="text-center p-4">
                <Camera className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                <p className="text-xs text-neutral-400 max-w-xs">
                  {cameraError || (isNative
                    ? mode === 'photo_search'
                      ? 'Tap Take Photo to open the device camera.'
                      : 'Tap Scan QR / Barcode to open the scanner.'
                    : 'Camera inactive')}
                </p>
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
                  disabled={isNative ? isTakingPhoto : !hasCamera}
                  className="px-4 py-2 rounded-full bg-blue-500 hover:bg-blue-400 text-neutral-950 font-bold text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" /> {isTakingPhoto ? 'Opening Camera…' : isNative ? 'Take Photo' : 'Snap Photo'}
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
              <button
                type="button"
                onClick={() => void startBarcodeScan()}
                disabled={isScanning}
                className={`w-full py-2.5 rounded-xl border font-semibold text-xs flex items-center justify-center gap-2 transition disabled:opacity-60 ${
                  isBright
                    ? 'bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-950'
                    : 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/30 text-amber-200'
                }`}
              >
                <QrCode className="w-4 h-4" />
                {isScanning ? (cameraError || 'Opening scanner…') : 'Scan QR / Barcode'}
              </button>
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
                  className={`flex-1 px-3.5 py-2 rounded-xl text-xs font-mono outline-none border transition-colors ${
                    isBright
                      ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-amber-600 focus:bg-white'
                      : 'bg-neutral-950 border-neutral-700 text-neutral-100 focus:border-amber-500'
                  }`}
                />
                <button
                  onClick={() => {
                    if (mode === 'confirm_arrival') handleConfirmArrival(manualCodeInput);
                    else handleLookup(manualCodeInput);
                  }}
                  className={`px-4 py-2 rounded-xl font-semibold text-xs transition active:scale-95 border ${
                    isBright
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                      : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-transparent'
                  }`}
                >
                  Process
                </button>
              </div>

              {/* Sample Tap-to-Test Badges */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className={isBright ? 'text-slate-500' : 'text-neutral-500'}>Quick test:</span>
                {mode === 'confirm_arrival' ? (
                  lots
                    .filter((l) => l.status === 'in_progress')
                    .slice(0, 4)
                    .map((l) => (
                      <button
                        key={l.id}
                        onClick={() => handleConfirmArrival(l.lotNumber)}
                        className={`px-2.5 py-1 rounded-lg font-mono text-[10px] border transition-colors ${
                          isBright
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                            : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700'
                        }`}
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
                        className={`px-2.5 py-1 rounded-lg font-mono text-[10px] border transition-colors ${
                          isBright
                            ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200 font-semibold'
                            : 'bg-neutral-800 hover:bg-neutral-700 text-amber-300 border-neutral-700'
                        }`}
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
                  ? isBright
                    ? 'bg-rose-50 border-rose-300 text-rose-900'
                    : 'bg-red-950/40 border-red-500/50 text-red-200'
                  : isBright
                  ? 'bg-slate-50 border-slate-200 text-slate-800'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-300'
              }`}
            >
              <div className="flex items-start gap-3">
                {arrivalResult.success ? (
                  <div className="w-4 h-4 rounded-full bg-red-500 flex-shrink-0 mt-0.5 animate-pulse" />
                ) : (
                  <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isBright ? 'text-amber-600' : 'text-amber-400'}`} />
                )}
                <div className="space-y-1.5 flex-1">
                  <div className={`font-bold uppercase tracking-wider ${isBright ? 'text-rose-700' : 'text-red-400'}`}>
                    Arrival Confirmed: "Arrived, awaiting entry"
                  </div>
                  <p className={`leading-relaxed ${isBright ? 'text-slate-800' : 'text-neutral-200'}`}>
                    {arrivalResult.message}
                  </p>
                  <p className={`text-[11px] italic ${isBright ? 'text-slate-500' : 'text-neutral-400'}`}>
                    Note: Arrival has been recorded. Manual return weight and pieces verification can be entered whenever ready.
                  </p>
                  {arrivalResult.lot && onSelectLot && (
                    <button
                      onClick={() => {
                        onSelectLot(arrivalResult.lot!);
                        onClose();
                      }}
                      className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs border transition ${
                        isBright
                          ? 'bg-rose-100 hover:bg-rose-200 text-rose-800 border-rose-300'
                          : 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border-red-500/30'
                      }`}
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
                <div
                  className={`p-3.5 rounded-xl border text-xs ${
                    isBright
                      ? 'bg-rose-50 border-rose-300 text-rose-800'
                      : 'bg-red-500/10 border-red-500/30 text-red-400'
                  }`}
                >
                  {lookupError}
                </div>
              )}
              {lookupResult && (
                <div
                  className={`p-4 rounded-xl border text-xs space-y-3 transition-colors ${
                    isBright
                      ? 'bg-slate-50 border-amber-300 text-slate-900 shadow-sm'
                      : 'bg-neutral-950 border-amber-500/40 text-neutral-100'
                  }`}
                >
                  <div
                    className={`flex items-center justify-between border-b pb-2 ${
                      isBright ? 'border-slate-200' : 'border-neutral-800'
                    }`}
                  >
                    <span className={`font-bold uppercase tracking-wider ${isBright ? 'text-amber-800' : 'text-amber-400'}`}>
                      Exact Match Found ({lookupResult.type.toUpperCase()})
                    </span>
                    <span className={`text-[10px] font-mono ${isBright ? 'text-slate-500' : 'text-neutral-400'}`}>
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
                            className={`w-16 h-16 rounded-lg object-cover border ${
                              isBright ? 'border-slate-300' : 'border-neutral-700'
                            }`}
                          />
                          <div className="flex-1 space-y-1">
                            <h4 className={`font-bold text-sm ${isBright ? 'text-slate-900' : 'text-neutral-100'}`}>
                              {d.name}
                            </h4>
                            <div className={`text-[11px] ${isBright ? 'text-slate-600' : 'text-neutral-400'}`}>
                              Code:{' '}
                              <span className={`font-mono ${isBright ? 'text-slate-900 font-semibold' : 'text-neutral-200'}`}>
                                {d.orderRef}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 text-[10px] font-mono mt-1">
                              <span className={`px-1.5 py-0.5 rounded border ${
                                isBright ? 'bg-amber-50 text-amber-900 border-amber-200' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              }`}>
                                Wax: {d.waxAvgWeightPerPiece}g
                              </span>
                              <span className={`px-1.5 py-0.5 rounded border ${
                                isBright ? 'bg-amber-50 text-amber-900 border-amber-200' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              }`}>
                                Metal: {d.metalAvgWeightPerPiece}g
                              </span>
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
                      const design = designs.find((d) => d.id === l.designId);
                      const stageAvgWeight = design
                        ? Number(design[getStageWeightKey(l.currentStage, l.branch)]) || 0
                        : 0;
                      const stageWeightLabel = getStageWeightLabel(l.currentStage, l.branch);

                      return (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className={`font-bold ${isBright ? 'text-slate-900' : 'text-neutral-200'}`}>
                              {l.lotNumber}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-mono border ${
                                isBright
                                  ? 'bg-slate-200/80 text-slate-800 border-slate-300'
                                  : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                              }`}
                            >
                              Stage: {l.currentStage}
                            </span>
                          </div>
                          <div className={`text-[11px] ${isBright ? 'text-slate-600' : 'text-neutral-400'}`}>
                            Design: {l.designName} &bull; Karigar: {l.currentKarigarName}
                          </div>
                          <div className="flex items-center gap-2 text-xs font-mono">
                            <span className={isBright ? 'text-slate-500' : 'text-neutral-400'}>
                              {stageWeightLabel}:
                            </span>
                            <span
                              className={`font-bold px-1.5 py-0.5 rounded ${
                                isBright
                                  ? 'bg-amber-100 text-amber-950 border border-amber-300'
                                  : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {stageAvgWeight > 0 ? `${stageAvgWeight.toFixed(3)} g/pc` : 'Not calibrated'}
                            </span>
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
                <div
                  className={`flex items-center justify-center gap-2 p-4 text-xs rounded-xl border ${
                    isBright
                      ? 'text-blue-800 bg-blue-50 border-blue-200'
                      : 'text-blue-400 bg-neutral-950 border-neutral-800'
                  }`}
                >
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Analyzing image fingerprint and calculating top 3 similarity rankings...</span>
                </div>
              )}

              {photoSearchResults.length > 0 && !isAnalyzingPhoto && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-bold uppercase tracking-wider ${isBright ? 'text-slate-900' : 'text-neutral-200'}`}>
                      Closest Design Candidates
                    </span>
                    <span className={`text-[11px] ${isBright ? 'text-slate-500' : 'text-neutral-400'}`}>
                      Ranked by similarity %
                    </span>
                  </div>

                  {photoSearchResults[0].similarity < 62 && (
                    <div className={`rounded-lg px-3 py-2 text-[11px] ${
                      isBright ? 'bg-amber-50 text-amber-900' : 'bg-amber-500/10 text-amber-200'
                    }`}>
                      These are the closest available images, but the visual match is weak. Compare them manually; this score is not an identification.
                    </div>
                  )}

                  <div className="space-y-2">
                    {photoSearchResults.map(({ design, similarity }, index) => {
                      const isConfirmed = confirmedMatch?.id === design.id;
                      return (
                        <div
                          key={design.id}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                            isConfirmed
                              ? isBright
                                ? 'bg-emerald-50 border-emerald-400 ring-1 ring-emerald-500 shadow-sm'
                                : 'bg-emerald-950/40 border-emerald-500/60 ring-1 ring-emerald-500'
                              : isBright
                              ? 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-white shadow-xs'
                              : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
                                isBright
                                  ? 'bg-slate-200 text-slate-800'
                                  : 'bg-neutral-800 text-amber-400'
                              }`}
                            >
                              #{index + 1}
                            </div>
                            <img
                              src={design.photoUrl}
                              alt={design.name}
                              className={`w-12 h-12 rounded-lg object-cover border ${
                                isBright ? 'border-slate-300' : 'border-neutral-800'
                              }`}
                            />
                            <div>
                              <h4 className={`font-semibold text-xs ${isBright ? 'text-slate-900' : 'text-neutral-100'}`}>
                                {design.name}
                              </h4>
                              <div className={`text-[10px] font-mono ${isBright ? 'text-slate-500' : 'text-neutral-400'}`}>
                                Barcode: {design.barcode} &bull; Code: {design.orderRef}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {/* Similarity Score bar */}
                            <div className="text-right">
                              <div className={`text-xs font-bold font-mono ${isBright ? 'text-blue-700' : 'text-blue-400'}`}>
                                {similarity}% Similar
                              </div>
                              <div className={`w-16 h-1.5 rounded-full overflow-hidden mt-1 ${isBright ? 'bg-slate-200' : 'bg-neutral-800'}`}>
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
                                  ? 'bg-emerald-600 text-white'
                                  : isBright
                                  ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
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
                    <div
                      className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                        isBright
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                          : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                      }`}
                    >
                      <span>
                        Confirmed design: <strong>{confirmedMatch.name}</strong>
                      </span>
                      {onSelectDesign && (
                        <button
                          onClick={() => {
                            onSelectDesign(confirmedMatch);
                            onClose();
                          }}
                          className="font-bold underline ml-2 hover:opacity-80"
                        >
                          View Design
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {photoSearchImage && photoSearchResults.length === 0 && !isAnalyzingPhoto && (
                <div
                  className={`rounded-xl border p-4 text-xs ${
                    isBright
                      ? 'border-amber-200 bg-amber-50 text-amber-900'
                      : 'border-amber-500/20 bg-amber-500/10 text-amber-200'
                  }`}
                >
                  {designs.length === 0
                    ? 'There are no saved designs to compare against yet.'
                    : cameraError || 'No saved design photos could be compared. Check the connection and try again.'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`px-5 py-3 border-t flex justify-end transition-colors ${
            isBright ? 'bg-slate-50 border-slate-200' : 'bg-neutral-950 border-neutral-800'
          }`}
        >
          <button
            onClick={onClose}
            className={`px-4 py-1.5 rounded-xl text-xs font-medium transition ${
              isBright
                ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
            }`}
          >
            Close Scanner
          </button>
        </div>
      </div>
    </div>
  );
};
