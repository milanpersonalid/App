import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Design,
  Lot,
  Karigar,
  Stage,
  BranchType,
  ReadyStockItem,
  LotStageRecord,
  NEXT_STAGE_OPTIONS,
} from '../types';
import { generateLotStageQrPayload } from '../utils/qrBarcode';
import { extractImageFingerprint } from '../utils/photoSearch';
import {
  fetchProductionData,
  designFromRow,
  insertDesign,
  insertKarigar,
  insertLot,
  karigarFromRow,
  lotFromRow,
  subscribeToProductionChanges,
  updateDesign,
  updateKarigar,
  updateLot,
} from '../services/productionRepository';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  compressDesignImage,
  dataUrlToBlob,
  deleteDesignPhoto,
  uploadDesignPhoto,
} from '../services/designImageStorage';
import { useAuthAndTheme } from './AuthAndThemeContext';
import {
  getStageWeightKey,
  getDefaultCalibrationTarget,
  CalibrationTarget,
} from '../utils/stageWeights';

interface AppContextType {
  designs: Design[];
  lots: Lot[];
  karigars: Karigar[];
  isLoading: boolean;
  dataError: string | null;
  refreshData: () => Promise<void>;
  selectedStageForDetail: Stage | null;
  setSelectedStageForDetail: (stage: Stage | null) => void;
  
  // Actions
  createDesign: (designData: {
    name: string;
    orderRef: string;
    photoUrl: string;
    photoFile?: File;
    targetQuantity?: number;
    lowStockThreshold: number;
  }) => Promise<Design>;
  createKarigar: (data: {
    name: string;
    phone: string;
    specialtyStages: Stage[];
  }) => Promise<Karigar>;
  updateKarigarStages: (karigarId: string, specialtyStages: Stage[]) => Promise<Karigar>;
  recalibrateDesign: (
    designId: string,
    arg2: CalibrationTarget | number,
    arg3?: number | CalibrationTarget
  ) => Promise<void>;
  updateLowStockThreshold: (designId: string, newThreshold: number) => Promise<void>;
  
  createLot: (lotData: {
    lotNumber: string;
    designId: string;
    initialPieces: number;
    initialWeight: number;
    orderedQuantity: number;
    karigarId: string;
    jobWorkAmount: number;
    hasWaxReceipt: boolean;
    statedPieces: number;
    hasDiscrepancy: boolean;
    discrepancyGramsDiff: number;
  }) => Promise<Lot>;
  completeWaxReceipt: (
    lotId: string,
    data: {
      orderedQuantity: number;
      weightReceived: number;
      statedPieces: number;
      samplePieceCount?: number;
      sampleWeight?: number;
    }
  ) => Promise<Lot>;

  // Step 5: Scan Confirm Arrival (pure status flip to Red)
  confirmArrival: (lotIdentifier: string) => Promise<{ success: boolean; lot?: Lot; message: string }>;

  // Step 6: Manual Data Entry (completes stage to Green)
  completeStageDataEntry: (
    lotId: string,
    entry: {
      weightReceived: number;
      estimatedPieces?: number; // Weight-based estimated pieces column (supports manual override)
      statedPieces: number;
      rejectedPieces: number;
      recalibratedAvgWeight?: number;
      recalibrationTarget?: CalibrationTarget;
      chholBranchTarget?: 'plain' | 'gold';
    }
  ) => Promise<{ success: boolean; message: string; lot?: Lot }>;

  // Step 7: Pick Next Stage
  advanceToNextStage: (
    lotId: string,
    nextStage: Stage,
    branch: BranchType,
    nextKarigarId: string,
    jobWorkAmount: number
  ) => Promise<{ success: boolean; message: string; lot?: Lot }>;

  // Reports and derived queries
  getReadyStockSummary: () => ReadyStockItem[];
  getStageWisePendingReport: () => { stage: Stage; lotCount: number; pieceCount: number; weightGrams: number }[];
  getLossReport: (branchFilter: 'all' | 'plain' | 'gold') => {
    stage: Stage;
    totalWeightSent: number;
    totalWeightLoss: number;
    lossPercentage: number;
    lotCount: number;
  }[];
  getKarigarPerformanceReport: () => {
    karigar: Karigar;
    piecesHandled: number;
    rejectionsLogged: number;
    totalWeightSent: number;
    totalWeightLoss: number;
    avgLossPercentage: number;
    activeLotsCount: number;
  }[];
  getKarigarStatusForStage: (stage: Stage) => {
    working: { karigar: Karigar; lot: Lot }[];
    idle: Karigar[];
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoggedIn } = useAuthAndTheme();
  const [designs, setDesigns] = useState<Design[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [karigars, setKarigars] = useState<Karigar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const [selectedStageForDetail, setSelectedStageForDetail] = useState<Stage | null>(null);

  const refreshData = async () => {
    if (!isSupabaseConfigured) {
      setDataError('Supabase is not configured. Add the VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY environment variables.');
      setIsLoading(false);
      return;
    }

    try {
      const data = await fetchProductionData();
      setDesigns(data.designs);
      setLots(data.lots);
      setKarigars(data.karigars);
      setDataError(null);
    } catch (error) {
      setDataError(error instanceof Error ? error.message : 'Unable to load production data from Supabase.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoggedIn) {
      setDesigns([]);
      setLots([]);
      setKarigars([]);
      setDataError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    void refreshData();
    if (!isSupabaseConfigured) return;

    const unsubscribe = subscribeToProductionChanges(async (change) => {
      try {
        const changedId = String((change.eventType === 'DELETE' ? change.oldRow : change.newRow)?.id ?? '');
        if (!changedId) return;

        if (change.table === 'designs') {
          if (change.eventType === 'DELETE') {
            setDesigns((previous) => previous.filter((design) => design.id !== changedId));
            return;
          }
          const changedDesign = await designFromRow(change.newRow);
          setDesigns((previous) => previous.some((design) => design.id === changedDesign.id)
            ? previous.map((design) => design.id === changedDesign.id ? changedDesign : design)
            : [changedDesign, ...previous]);
          return;
        }

        if (change.table === 'lots') {
          if (change.eventType === 'DELETE') {
            setLots((previous) => previous.filter((lot) => lot.id !== changedId));
            return;
          }
          const changedLot = lotFromRow(change.newRow);
          setLots((previous) => previous.some((lot) => lot.id === changedLot.id)
            ? previous.map((lot) => lot.id === changedLot.id ? changedLot : lot)
            : [changedLot, ...previous]);
          return;
        }

        if (change.eventType === 'DELETE') {
          setKarigars((previous) => previous.filter((karigar) => karigar.id !== changedId));
          return;
        }
        const changedKarigar = karigarFromRow(change.newRow);
        setKarigars((previous) => [
          ...previous.filter((karigar) => karigar.id !== changedKarigar.id),
          changedKarigar,
        ].sort((a, b) => a.name.localeCompare(b.name)));
      } catch (error) {
        console.error('Unable to apply a real-time production update.', error);
      }
    });
    // Signed photo URLs expire after seven days; refresh them before expiry if the app stays open.
    const signedPhotoRefreshTimer = window.setInterval(
      () => void refreshData(),
      6 * 24 * 60 * 60 * 1000
    );
    return () => {
      unsubscribe();
      window.clearInterval(signedPhotoRefreshTimer);
    };
  }, [isLoggedIn]);

  const createKarigar = async (data: {
    name: string;
    phone: string;
    specialtyStages: Stage[];
  }): Promise<Karigar> => {
    const name = data.name.trim();
    const phone = data.phone.trim();
    const allowedStages: Stage[] = ['Wax', 'Casting', 'Buff', 'Zabora', 'Dull', 'Chhol', 'Plating'];
    const specialtyStages = [...new Set(data.specialtyStages)];

    if (!name) throw new Error('Enter the karigar name.');
    if (phone && !/^\+?[0-9\s()-]{7,20}$/.test(phone)) {
      throw new Error('Enter a valid phone number.');
    }
    if (specialtyStages.length === 0 || specialtyStages.some((stage) => !allowedStages.includes(stage))) {
      throw new Error('Select at least one valid work stage.');
    }

    const savedKarigar = await insertKarigar({
      id: crypto.randomUUID(),
      name,
      phone,
      specialtyStages,
    });
    setKarigars((previous) =>
      [...previous.filter((karigar) => karigar.id !== savedKarigar.id), savedKarigar]
        .sort((a, b) => a.name.localeCompare(b.name))
    );
    return savedKarigar;
  };

  const updateKarigarStages = async (karigarId: string, specialtyStages: Stage[]): Promise<Karigar> => {
    const current = karigars.find((karigar) => karigar.id === karigarId);
    if (!current) throw new Error('Karigar not found.');
    const allowedStages: Stage[] = ['Wax', 'Casting', 'Buff', 'Zabora', 'Dull', 'Chhol', 'Plating'];
    const uniqueStages = [...new Set(specialtyStages)];
    if (uniqueStages.length === 0 || uniqueStages.some((stage) => !allowedStages.includes(stage))) {
      throw new Error('Select at least one valid work stage.');
    }

    const savedKarigar = await updateKarigar({ ...current, specialtyStages: uniqueStages });
    setKarigars((previous) => [
      ...previous.filter((karigar) => karigar.id !== savedKarigar.id),
      savedKarigar,
    ].sort((left, right) => left.name.localeCompare(right.name)));
    return savedKarigar;
  };

  // CREATE DESIGN
  const createDesign = async (data: {
    name: string;
    orderRef: string;
    photoUrl: string;
    photoFile?: File;
    targetQuantity?: number;
    lowStockThreshold: number;
  }): Promise<Design> => {
    // Weight rulers are established later from measured production data.
    const waxAvg = 0;
    const metalEst = 0;
    
    // Barcode auto-generated and saved the moment a design is created
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const barcode = `DES-${randomSuffix}`;
    const id = `des-${Date.now()}`;
    const now = new Date().toISOString().split('T')[0];

    // Compress and store image bytes separately from the design row. Fingerprinting
    // and upload run concurrently; the database receives only the storage path.
    const sourceImage = data.photoFile ?? dataUrlToBlob(data.photoUrl);
    const compressedImage = await compressDesignImage(sourceImage);
    const fingerprintUrl = URL.createObjectURL(compressedImage);
    let photoStoragePath: string | undefined;
    let fingerprint;
    try {
      const [computedFingerprint, uploadedPath] = await Promise.all([
        extractImageFingerprint(fingerprintUrl),
        uploadDesignPhoto(id, compressedImage),
      ]);
      fingerprint = computedFingerprint;
      photoStoragePath = uploadedPath;
    } finally {
      URL.revokeObjectURL(fingerprintUrl);
    }

    const newDesign: Design = {
      id,
      name: data.name,
      orderRef: data.orderRef,
      photoUrl: photoStoragePath!,
      photoStoragePath,
      targetQuantity: data.targetQuantity,
      lowStockThreshold: data.lowStockThreshold || 500,
      barcode,
      waxAvgWeightPerPiece: waxAvg,
      metalAvgWeightPerPiece: metalEst,
      plainAvgWeightPerPiece: 0,
      goldAvgWeightPerPiece: 0,
      fingerprint,
      createdAt: now,
      updatedAt: now,
    };

    let savedDesign: Design;
    try {
      savedDesign = await insertDesign(newDesign);
    } catch (error) {
      if (photoStoragePath) {
        try {
          await deleteDesignPhoto(photoStoragePath);
        } catch (cleanupError) {
          console.error('Unable to remove uploaded design image after save failure.', cleanupError);
        }
      }
      throw error;
    }
    setDesigns((prev) => [savedDesign, ...prev.filter((d) => d.id !== savedDesign.id)]);
    return savedDesign;
  };

  // Only Wax and shared Metal rulers are used for calibration.
  const recalibrateDesign = async (
    designId: string,
    arg2: CalibrationTarget | number,
    arg3?: number | CalibrationTarget
  ): Promise<void> => {
    let target: CalibrationTarget = 'metal';
    let weight: number = 0;

    if (typeof arg2 === 'string') {
      target = arg2 as CalibrationTarget;
      weight = typeof arg3 === 'number' ? arg3 : 0;
    } else if (typeof arg2 === 'number') {
      weight = arg2;
      if (typeof arg3 === 'string') {
        target = arg3 as CalibrationTarget;
      }
    }

    const fieldMap: Record<CalibrationTarget, keyof Design> = {
      wax: 'waxAvgWeightPerPiece',
      metal: 'metalAvgWeightPerPiece',
    };

    const targetField = fieldMap[target] || 'metalAvgWeightPerPiece';
    const now = new Date().toISOString().split('T')[0];

    const current = designs.find((d) => d.id === designId);
    if (!current) throw new Error('Design not found.');
    const saved = await updateDesign({
      ...current,
      [targetField]: Number(weight.toFixed(4)),
      updatedAt: now,
    });
    setDesigns((prev) => prev.map((d) => (d.id === saved.id ? saved : d)));
  };

  // UPDATE LOW STOCK ALERT THRESHOLD
  const updateLowStockThreshold = async (designId: string, newThreshold: number) => {
    const current = designs.find((d) => d.id === designId);
    if (!current) throw new Error('Design not found.');
    const saved = await updateDesign({ ...current, lowStockThreshold: newThreshold });
    setDesigns((prev) => prev.map((d) => (d.id === saved.id ? saved : d)));
  };

  // CREATE LOT
  const createLot = async (lotData: {
    lotNumber: string;
    designId: string;
    initialPieces: number;
    initialWeight: number;
    orderedQuantity: number;
    karigarId: string;
    jobWorkAmount: number;
    hasWaxReceipt: boolean;
    statedPieces: number;
    hasDiscrepancy: boolean;
    discrepancyGramsDiff: number;
  }): Promise<Lot> => {
    const design = designs.find((d) => d.id === lotData.designId);
    const karigar = karigars.find((k) => k.id === lotData.karigarId);
    const now = new Date().toISOString().split('T')[0];

    const karigarName = karigar ? karigar.name : 'Unassigned';
    const dynamicQr = generateLotStageQrPayload(
      lotData.lotNumber,
      'Wax',
      karigarName,
      now
    );

    const firstStageRecord: LotStageRecord = {
      stage: 'Wax',
      karigarId: lotData.karigarId,
      karigarName,
      dateOrdered: now,
      orderedQuantity: lotData.orderedQuantity,
      jobWorkAmount: lotData.jobWorkAmount,
      qrData: dynamicQr,
      isCompleted: lotData.hasWaxReceipt,
      ...(lotData.hasWaxReceipt ? {
        dateReceived: now,
        weightReceived: lotData.initialWeight,
        estimatedPieces: lotData.initialPieces,
        statedPieces: lotData.statedPieces,
        hasDiscrepancy: lotData.hasDiscrepancy,
        discrepancyGramsDiff: lotData.discrepancyGramsDiff,
        completedAt: now,
      } : {}),
    };

    const newLot: Lot = {
      id: `lot-${Date.now()}`,
      lotNumber: lotData.lotNumber,
      designId: lotData.designId,
      designName: design ? design.name : 'Unknown Design',
      initialPieces: lotData.initialPieces,
      initialWeight: lotData.initialWeight,
      currentStage: 'Wax',
      branch: 'none',
      currentKarigarId: lotData.karigarId,
      currentKarigarName: karigarName,
      status: lotData.hasWaxReceipt ? 'stage_complete' : 'awaiting_wax_receipt',
      currentQrData: dynamicQr,
      history: [firstStageRecord],
      createdAt: now,
    };

    const savedLot = await insertLot(newLot);
    setLots((prev) => [savedLot, ...prev.filter((l) => l.id !== savedLot.id)]);
    return savedLot;
  };

  const completeWaxReceipt = async (
    lotId: string,
    data: {
      orderedQuantity: number;
      weightReceived: number;
      statedPieces: number;
      samplePieceCount?: number;
      sampleWeight?: number;
    }
  ): Promise<Lot> => {
    const lot = lots.find((item) => item.id === lotId);
    if (!lot) throw new Error('Lot not found.');
    if (lot.status !== 'awaiting_wax_receipt' || lot.currentStage !== 'Wax') {
      throw new Error('This lot is not awaiting a Wax receipt.');
    }

    const design = designs.find((item) => item.id === lot.designId);
    if (!design) throw new Error('Design not found.');
    if (!Number.isFinite(data.weightReceived) || data.weightReceived <= 0) {
      throw new Error('Enter the total Wax weight received.');
    }
    if (!Number.isInteger(data.orderedQuantity) || data.orderedQuantity <= 0) {
      throw new Error('Enter the original quantity ordered from the Wax karigar.');
    }
    if (!Number.isInteger(data.statedPieces) || data.statedPieces <= 0) {
      throw new Error('Enter the piece count stated on the Wax karigar slip.');
    }

    let waxRuler = Number(design.waxAvgWeightPerPiece) || 0;
    if (waxRuler <= 0) {
      const samplePieceCount = data.samplePieceCount ?? 0;
      const sampleWeight = data.sampleWeight ?? 0;
      if (!Number.isInteger(samplePieceCount) || samplePieceCount <= 0 || !Number.isFinite(sampleWeight) || sampleWeight <= 0) {
        throw new Error('Enter a valid small-sample piece count and weight to calibrate this design.');
      }
      waxRuler = sampleWeight / samplePieceCount;
      const savedDesign = await updateDesign({
        ...design,
        waxAvgWeightPerPiece: Number(waxRuler.toFixed(4)),
        updatedAt: new Date().toISOString().split('T')[0],
      });
      setDesigns((previous) => previous.map((item) => item.id === savedDesign.id ? savedDesign : item));
    }

    const estimatedPieces = Math.round(data.weightReceived / waxRuler);
    if (estimatedPieces <= 0) throw new Error('The estimated Wax piece count could not be calculated.');
    const discrepancyGrams = Math.abs(data.weightReceived - data.statedPieces * waxRuler);
    const hasDiscrepancy = discrepancyGrams > 2 ||
      Math.abs(estimatedPieces - data.statedPieces) > Math.max(3, estimatedPieces * 0.03);
    const now = new Date().toISOString().split('T')[0];
    const history = lot.history.map((record) => {
      if (record.stage !== 'Wax') return record;
      const completedRecord: LotStageRecord = {
        ...record,
        orderedQuantity: data.orderedQuantity,
        dateReceived: now,
        weightReceived: data.weightReceived,
        estimatedPieces,
        statedPieces: data.statedPieces,
        hasDiscrepancy,
        discrepancyGramsDiff: Number(discrepancyGrams.toFixed(2)),
        isCompleted: true,
        completedAt: now,
      };
      delete completedRecord.dateSent;
      delete completedRecord.weightSent;
      delete completedRecord.piecesSent;
      delete completedRecord.weightLoss;
      delete completedRecord.lossPercentage;
      delete completedRecord.piecesLoss;
      return completedRecord;
    });

    const savedLot = await updateLot({
      ...lot,
      initialWeight: data.weightReceived,
      initialPieces: estimatedPieces,
      status: 'stage_complete',
      history,
    });
    setLots((previous) => previous.map((item) => item.id === savedLot.id ? savedLot : item));
    return savedLot;
  };

  // STEP 5: SCAN TO CONFIRM ARRIVAL
  // "The admin scans the slip's QR/barcode. This action does exactly one thing:
  // flips that lot's status to red — 'Arrived, awaiting entry.'
  // This step must never ask for or accept any data entry — it is purely a status flip"
  const confirmArrival = async (lotIdentifier: string): Promise<{ success: boolean; lot?: Lot; message: string }> => {
    let targetLotNumber = lotIdentifier.trim();

    // Check if input is JSON payload from QR
    if (lotIdentifier.includes('{') && lotIdentifier.includes('}')) {
      try {
        const parsed = JSON.parse(lotIdentifier);
        if (parsed.lotNumber) {
          targetLotNumber = parsed.lotNumber;
        }
      } catch {
        // Continue with raw string
      }
    }

    const lotIndex = lots.findIndex(
      (l) =>
        l.lotNumber.toLowerCase() === targetLotNumber.toLowerCase() ||
        l.id.toLowerCase() === targetLotNumber.toLowerCase() ||
        l.currentQrData === lotIdentifier
    );

    if (lotIndex === -1) {
      return {
        success: false,
        message: `No active lot found matching identifier "${targetLotNumber}".`,
      };
    }

    const lot = lots[lotIndex];

    if (lot.status === 'ready_stock') {
      return {
        success: false,
        lot,
        message: `Lot ${lot.lotNumber} is already completed in Ready Stock.`,
      };
    }

    if (lot.status === 'arrived_awaiting_entry') {
      return {
        success: true,
        lot,
        message: `Lot ${lot.lotNumber} was already marked "Arrived, awaiting entry" at stage ${lot.currentStage}.`,
      };
    }

    if (lot.status !== 'in_progress') {
      return {
        success: false,
        lot,
        message: `Lot ${lot.lotNumber} is not currently waiting for arrival at ${lot.currentStage}.`,
      };
    }

    const nowTime = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

    const updatedHistory = [...lot.history];
    const currentRecIndex = updatedHistory.length - 1;
    if (currentRecIndex >= 0) {
      updatedHistory[currentRecIndex] = {
        ...updatedHistory[currentRecIndex],
        arrivedAt: nowTime,
      };
    }

    const updatedLot: Lot = {
      ...lot,
      status: 'arrived_awaiting_entry', // Red status
      history: updatedHistory,
    };

    try {
      const savedLot = await updateLot(updatedLot);
      setLots((prev) => prev.map((item) => (item.id === savedLot.id ? savedLot : item)));

      return {
        success: true,
        lot: savedLot,
        message: `Arrival confirmed for Lot ${lot.lotNumber} at stage ${lot.currentStage}. Status flipped to: Arrived, awaiting entry.`,
      };
    } catch (error) {
      return { success: false, lot, message: error instanceof Error ? error.message : 'Unable to confirm arrival.' };
    }
  };

  // STEP 6: MANUAL DATA ENTRY
  const completeStageDataEntry = async (
    lotId: string,
    entry: {
      weightReceived: number;
      estimatedPieces?: number;
      statedPieces: number;
      rejectedPieces: number;
      recalibratedAvgWeight?: number;
      recalibrationTarget?: CalibrationTarget;
      chholBranchTarget?: 'plain' | 'gold';
    }
  ): Promise<{ success: boolean; message: string; lot?: Lot }> => {
    const lotIndex = lots.findIndex((l) => l.id === lotId);
    if (lotIndex === -1) {
      return { success: false, message: 'Lot not found.' };
    }

    const lot = lots[lotIndex];
    const design = designs.find((d) => d.id === lot.designId);
    const stage = lot.currentStage;
    if (stage === 'Wax') {
      return {
        success: false,
        message: 'Wax is recorded as received when the lot is created; it does not use stage data entry.',
        lot,
      };
    }
    const effectiveBranch = entry.chholBranchTarget || lot.branch;
    const avgWeight = design ? Number(design[getStageWeightKey(stage, effectiveBranch)]) || 0 : 0;
    const effectiveRuler = entry.recalibratedAvgWeight || avgWeight;

    const history = [...lot.history];
    const currentRecIndex = history.length - 1;
    if (currentRecIndex < 0) {
      return { success: false, message: 'Lot has no active stage record.' };
    }

    const currentRecord = history[currentRecIndex];
    const weightSent = currentRecord.weightSent;
    const weightReceived = entry.weightReceived;

    // 2. Estimated pieces column in DB: Use manual value if provided by admin, otherwise auto-calculate Weight received ÷ Ruler
    const calculatedEstimatedPieces = effectiveRuler > 0
      ? Math.round(weightReceived / effectiveRuler)
      : 0;
    const estimatedPieces =
      typeof entry.estimatedPieces === 'number' && !isNaN(entry.estimatedPieces) && entry.estimatedPieces >= 0
        ? entry.estimatedPieces
        : calculatedEstimatedPieces;

    // 4. Discrepancy warning if stated pieces don't reasonably match estimated pieces
    // A gram or two of natural variance is normal; large unexplained jump warns
    const theoreticalWeightForStated = entry.statedPieces * effectiveRuler;
    const diffGrams = effectiveRuler > 0
      ? Math.abs(weightReceived - theoreticalWeightForStated)
      : 0;
    const weightDiffGrams = Number(diffGrams.toFixed(2));
    const piecesDiff = Math.abs(estimatedPieces - entry.statedPieces);
    const hasDiscrepancy = effectiveRuler > 0 &&
      (diffGrams > 2.0 || piecesDiff > Math.max(3, estimatedPieces * 0.03));

    // 6. Weight loss = Weight sent - Weight received
    const weightLoss = typeof weightSent === 'number' && weightSent > 0
      ? Number(Math.max(0, weightSent - weightReceived).toFixed(3))
      : undefined;
    const lossPercentage = typeof weightSent === 'number' && weightSent > 0 && weightLoss !== undefined
      ? Number(((weightLoss / weightSent) * 100).toFixed(2))
      : undefined;
    const missingPieces = Math.max(
      0,
      (currentRecord.piecesSent ?? 0) - entry.statedPieces - (entry.rejectedPieces || 0)
    );
    const piecesLoss = missingPieces + (entry.rejectedPieces || 0);

    const completedAt = new Date().toISOString().split('T')[0];

    // Determine calibration target if recalibration was performed
    const targetField: CalibrationTarget =
      entry.recalibrationTarget || getDefaultCalibrationTarget(stage, effectiveBranch);

    // Update current stage record
    history[currentRecIndex] = {
      ...currentRecord,
      weightReceived,
      estimatedPieces,
      statedPieces: entry.statedPieces,
      hasDiscrepancy,
      discrepancyGramsDiff: weightDiffGrams,
      rejectedPieces: entry.rejectedPieces,
      weightLoss,
      lossPercentage,
      piecesLoss,
      recalibratedAvgWeight: entry.recalibratedAvgWeight,
      recalibrationTarget: entry.recalibratedAvgWeight ? targetField : undefined,
      isCompleted: true,
      completedAt,
    };

    // 7. Recalibration of specific stage baseline
    if (entry.recalibratedAvgWeight && design) {
      await recalibrateDesign(design.id, targetField, entry.recalibratedAvgWeight);
    }

    // 8. On completion, the lot's status turns green — stage complete
    const updatedLot: Lot = {
      ...lot,
      branch: entry.chholBranchTarget ? entry.chholBranchTarget : lot.branch,
      status: 'stage_complete', // Green status
      history,
    };

    try {
      const savedLot = await updateLot(updatedLot);
      setLots((prev) => prev.map((item) => (item.id === savedLot.id ? savedLot : item)));
      return {
        success: true,
        message: `Stage ${lot.currentStage} entry completed. Lot is now Green: Stage Complete.`,
        lot: savedLot,
      };
    } catch (error) {
      return { success: false, lot, message: error instanceof Error ? error.message : 'Unable to complete stage.' };
    }
  };

  // STEP 7: PICK NEXT STAGE
  // The admin manually selects the next stage from available options — app never auto-advances.
  // This allows the real-world branching (Plain or Gold at Chhol).
  // Regenerates a fresh dynamic QR code for the stage slip!
  const advanceToNextStage = async (
    lotId: string,
    nextStage: Stage,
    branch: BranchType,
    nextKarigarId: string,
    jobWorkAmount: number
  ): Promise<{ success: boolean; message: string; lot?: Lot }> => {
    const lotIndex = lots.findIndex((l) => l.id === lotId);
    if (lotIndex === -1) {
      return { success: false, message: 'Lot not found.' };
    }

    const lot = lots[lotIndex];
    const isValidDestination = lot.currentStage === 'Chhol'
      ? (nextStage === 'Plating' && branch === 'gold') || (nextStage === 'Ready Stock' && branch === 'plain')
      : lot.currentStage === 'Plating'
        ? nextStage === 'Ready Stock' && branch === 'gold'
        : (NEXT_STAGE_OPTIONS[lot.currentStage] ?? []).includes(nextStage);
    if (!isValidDestination) {
      return { success: false, lot, message: `${nextStage} is not a valid forward destination from ${lot.currentStage}.` };
    }
    if (lot.status !== 'stage_complete') {
      return { success: false, lot, message: 'Complete the current stage before choosing its next destination.' };
    }
    const lastRecord = lot.history[lot.history.length - 1];
    const prevWeightReceived = lastRecord?.weightReceived ?? lot.initialWeight;
    const prevPieces = lastRecord?.stage === 'Wax'
      ? (lastRecord.estimatedPieces ?? lot.initialPieces)
      : (lastRecord?.statedPieces ?? lot.initialPieces);
    const now = new Date().toISOString().split('T')[0];

    if (nextStage === 'Ready Stock') {
      const bucket = branch === 'gold' ? 'Gold' : 'Plain';
      const updatedLot: Lot = {
        ...lot,
        currentStage: 'Ready Stock',
        branch,
        status: 'ready_stock',
        readyStockBucket: bucket,
        finalPieces: Math.max(0, prevPieces),
        finalWeight: prevWeightReceived,
      };

      try {
        const savedLot = await updateLot(updatedLot);
        setLots((prev) => prev.map((item) => (item.id === savedLot.id ? savedLot : item)));
        return {
          success: true,
          message: `Lot ${lot.lotNumber} moved to Ready Stock (${bucket}).`,
          lot: savedLot,
        };
      } catch (error) {
        return { success: false, lot, message: error instanceof Error ? error.message : 'Unable to move lot to Ready Stock.' };
      }
    }

    const karigar = karigars.find((k) => k.id === nextKarigarId);
    const karigarName = karigar ? karigar.name : 'Unassigned';

    // Fresh QR generated and printed on stage slip at every single transition!
    const newDynamicQr = generateLotStageQrPayload(
      lot.lotNumber,
      nextStage,
      karigarName,
      now
    );

    const nextStageRecord: LotStageRecord = {
      stage: nextStage,
      karigarId: nextKarigarId,
      karigarName,
      dateSent: now,
      jobWorkAmount,
      weightSent: prevWeightReceived,
      piecesSent: Math.max(0, prevPieces),
      qrData: newDynamicQr,
      isCompleted: false,
    };

    const updatedLot: Lot = {
      ...lot,
      currentStage: nextStage,
      branch: branch !== 'none' ? branch : lot.branch,
      currentKarigarId: nextKarigarId,
      currentKarigarName: karigarName,
      status: 'in_progress', // Handed to karigar for new stage
      currentQrData: newDynamicQr,
      history: [...lot.history, nextStageRecord],
    };

    try {
      const savedLot = await updateLot(updatedLot);
      setLots((prev) => prev.map((item) => (item.id === savedLot.id ? savedLot : item)));
      return {
        success: true,
        message: `Lot advanced to ${nextStage} under Karigar ${karigarName}. Fresh QR generated!`,
        lot: savedLot,
      };
    } catch (error) {
      return { success: false, lot, message: error instanceof Error ? error.message : 'Unable to advance lot.' };
    }
  };

  // READY STOCK PER DESIGN
  const getReadyStockSummary = (): ReadyStockItem[] => {
    return designs.map((d) => {
      const readyLots = lots.filter((l) => l.designId === d.id && l.status === 'ready_stock');
      
      const plainLots = readyLots.filter((l) => l.readyStockBucket === 'Plain');
      const goldLots = readyLots.filter((l) => l.readyStockBucket === 'Gold');

      const plainPieces = plainLots.reduce((sum, l) => sum + (l.finalPieces || 0), 0);
      const plainWeight = Number(plainLots.reduce((sum, l) => sum + (l.finalWeight || 0), 0).toFixed(2));

      const goldPieces = goldLots.reduce((sum, l) => sum + (l.finalPieces || 0), 0);
      const goldWeight = Number(goldLots.reduce((sum, l) => sum + (l.finalWeight || 0), 0).toFixed(2));

      const totalPieces = plainPieces + goldPieces;
      const isLowStock = totalPieces < d.lowStockThreshold;

      return {
        designId: d.id,
        designName: d.name,
        barcode: d.barcode,
        photoUrl: d.photoUrl,
        lowStockThreshold: d.lowStockThreshold,
        plainPieces,
        plainWeight,
        goldPieces,
        goldWeight,
        totalPieces,
        isLowStock,
      };
    });
  };

  // STAGE-WISE PENDING REPORT
  const getStageWisePendingReport = () => {
    const stageList: Stage[] = ['Wax', 'Casting', 'Buff', 'Zabora', 'Dull', 'Chhol', 'Plating'];
    return stageList.map((stg) => {
      const activeLots = lots.filter((l) => l.currentStage === stg && l.status !== 'ready_stock');
      const pieceCount = activeLots.reduce((sum, l) => {
        const lastRec = l.history[l.history.length - 1];
        return sum + (lastRec?.stage === 'Wax'
          ? (lastRec.estimatedPieces ?? l.initialPieces)
          : (lastRec?.piecesSent ?? l.initialPieces));
      }, 0);
      const weightGrams = Number(
        activeLots
          .reduce((sum, l) => {
            const lastRec = l.history[l.history.length - 1];
            return sum + (lastRec?.stage === 'Wax'
              ? (lastRec.weightReceived ?? l.initialWeight)
              : (lastRec?.weightSent ?? l.initialWeight));
          }, 0)
          .toFixed(2)
      );

      return {
        stage: stg,
        lotCount: activeLots.length,
        pieceCount,
        weightGrams,
      };
    });
  };

  // LOSS / WASTAGE REPORT
  const getLossReport = (branchFilter: 'all' | 'plain' | 'gold') => {
    const stages: Stage[] = ['Casting', 'Buff', 'Zabora', 'Dull', 'Chhol', 'Plating'];

    return stages.map((stg) => {
      let filteredLots = lots;
      if (branchFilter !== 'all') {
        filteredLots = lots.filter((l) => l.branch === branchFilter || l.readyStockBucket === (branchFilter === 'gold' ? 'Gold' : 'Plain'));
      }

      let totalSent = 0;
      let totalLoss = 0;
      let count = 0;

      filteredLots.forEach((l) => {
        const record = l.history.find((h) => h.stage === stg && h.isCompleted);
        if (record && record.weightLoss !== undefined) {
          totalSent += record.weightSent ?? 0;
          totalLoss += record.weightLoss;
          count++;
        }
      });

      const lossPercentage = totalSent > 0 ? Number(((totalLoss / totalSent) * 100).toFixed(2)) : 0;

      return {
        stage: stg,
        totalWeightSent: Number(totalSent.toFixed(2)),
        totalWeightLoss: Number(totalLoss.toFixed(2)),
        lossPercentage,
        lotCount: count,
      };
    });
  };

  // KARIGAR PERFORMANCE REPORT
  const getKarigarPerformanceReport = () => {
    return karigars.map((k) => {
      let piecesHandled = 0;
      let rejectionsLogged = 0;
      let totalWeightSent = 0;
      let totalWeightLoss = 0;

      lots.forEach((l) => {
        l.history.forEach((h) => {
          if (h.karigarId === k.id && h.isCompleted) {
            piecesHandled += h.stage === 'Wax'
              ? (h.estimatedPieces ?? h.statedPieces ?? 0)
              : (h.piecesSent ?? h.statedPieces ?? 0);
            rejectionsLogged += h.rejectedPieces || 0;
            if (h.stage !== 'Wax') {
              totalWeightSent += h.weightSent ?? 0;
              totalWeightLoss += h.weightLoss || 0;
            }
          }
        });
      });

      const avgLossPercentage =
        totalWeightSent > 0 ? Number(((totalWeightLoss / totalWeightSent) * 100).toFixed(2)) : 0;

      const activeLotsCount = lots.filter(
        (l) => l.currentKarigarId === k.id && ['awaiting_wax_receipt', 'in_progress', 'arrived_awaiting_entry'].includes(l.status)
      ).length;

      return {
        karigar: k,
        piecesHandled,
        rejectionsLogged,
        totalWeightSent: Number(totalWeightSent.toFixed(2)),
        totalWeightLoss: Number(totalWeightLoss.toFixed(2)),
        avgLossPercentage,
        activeLotsCount,
      };
    });
  };

  // DASHBOARD STAGE DETAIL: KARIGARS WORKING / IDLE
  // "determined by finding which lots are currently 'sent but not yet received' at that stage, per karigar.
  // Karigars with nothing currently assigned must be clearly shown as idle."
  const getKarigarStatusForStage = (stage: Stage) => {
    // Assigned karigars who specialize in or can work at this stage
    const candidateKarigars = karigars.filter((k) => k.specialtyStages.includes(stage));
    
    // Wax orders awaiting receipt and lots sent to later stages both count as active work.
    const activeLotsAtStage = lots.filter(
      (l) => l.currentStage === stage && ['awaiting_wax_receipt', 'in_progress', 'arrived_awaiting_entry'].includes(l.status)
    );

    const working: { karigar: Karigar; lot: Lot }[] = [];
    const idle: Karigar[] = [];

    candidateKarigars.forEach((k) => {
      const workingLot = activeLotsAtStage.find((l) => l.currentKarigarId === k.id);
      if (workingLot) {
        working.push({ karigar: k, lot: workingLot });
      } else {
        idle.push(k);
      }
    });

    return { working, idle };
  };

  return (
    <AppContext.Provider
      value={{
        designs,
        lots,
        karigars,
        isLoading,
        dataError,
        refreshData,
        createKarigar,
        updateKarigarStages,
        selectedStageForDetail,
        setSelectedStageForDetail,
        createDesign,
        recalibrateDesign,
        updateLowStockThreshold,
        createLot,
        completeWaxReceipt,
        confirmArrival,
        completeStageDataEntry,
        advanceToNextStage,
        getReadyStockSummary,
        getStageWisePendingReport,
        getLossReport,
        getKarigarPerformanceReport,
        getKarigarStatusForStage,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
