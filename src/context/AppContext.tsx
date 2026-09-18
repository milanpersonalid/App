import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Design,
  Lot,
  Karigar,
  Stage,
  BranchType,
  ReadyStockItem,
  LotStageRecord,
} from '../types';
import { INITIAL_DESIGNS, INITIAL_LOTS, INITIAL_KARIGARS } from '../data/initialData';
import { generateLotStageQrPayload } from '../utils/qrBarcode';
import { extractImageFingerprint } from '../utils/photoSearch';

interface AppContextType {
  designs: Design[];
  lots: Lot[];
  karigars: Karigar[];
  selectedStageForDetail: Stage | null;
  setSelectedStageForDetail: (stage: Stage | null) => void;
  
  // Actions
  createDesign: (designData: {
    name: string;
    orderRef: string;
    photoUrl: string;
    targetQuantity?: number;
    lowStockThreshold: number;
    sampleWeight: number;
    samplePieceCount: number;
  }) => Promise<Design>;
  recalibrateDesign: (designId: string, newAvgWeight: number) => void;
  updateLowStockThreshold: (designId: string, newThreshold: number) => void;
  
  createLot: (lotData: {
    lotNumber: string;
    designId: string;
    initialPieces: number;
    initialWeight: number;
    startingStage: Stage;
    karigarId: string;
  }) => Lot;

  // Step 5: Scan Confirm Arrival (pure status flip to Red)
  confirmArrival: (lotIdentifier: string) => { success: boolean; lot?: Lot; message: string };

  // Step 6: Manual Data Entry (completes stage to Green)
  completeStageDataEntry: (
    lotId: string,
    entry: {
      weightReceived: number;
      statedPieces: number;
      rejectedPieces: number;
      recalibratedAvgWeight?: number;
    }
  ) => { success: boolean; message: string; lot?: Lot };

  // Step 7: Pick Next Stage
  advanceToNextStage: (
    lotId: string,
    nextStage: Stage,
    branch: BranchType,
    nextKarigarId: string
  ) => { success: boolean; message: string; lot?: Lot };

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

  // Reset demo data helper
  resetToDefaultData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY_DESIGNS = 'shreenathji_designs_v1';
const STORAGE_KEY_LOTS = 'shreenathji_lots_v1';
const STORAGE_KEY_KARIGARS = 'shreenathji_karigars_v1';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [designs, setDesigns] = useState<Design[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DESIGNS);
      return saved ? JSON.parse(saved) : INITIAL_DESIGNS;
    } catch {
      return INITIAL_DESIGNS;
    }
  });

  const [lots, setLots] = useState<Lot[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LOTS);
      return saved ? JSON.parse(saved) : INITIAL_LOTS;
    } catch {
      return INITIAL_LOTS;
    }
  });

  const [karigars, setKarigars] = useState<Karigar[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_KARIGARS);
      return saved ? JSON.parse(saved) : INITIAL_KARIGARS;
    } catch {
      return INITIAL_KARIGARS;
    }
  });

  const [selectedStageForDetail, setSelectedStageForDetail] = useState<Stage | null>(null);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DESIGNS, JSON.stringify(designs));
    } catch (e) {
      console.warn('Failed to save designs', e);
    }
  }, [designs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LOTS, JSON.stringify(lots));
    } catch (e) {
      console.warn('Failed to save lots', e);
    }
  }, [lots]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_KARIGARS, JSON.stringify(karigars));
    } catch (e) {
      console.warn('Failed to save karigars', e);
    }
  }, [karigars]);

  // CREATE DESIGN
  const createDesign = async (data: {
    name: string;
    orderRef: string;
    photoUrl: string;
    targetQuantity?: number;
    lowStockThreshold: number;
    sampleWeight: number;
    samplePieceCount: number;
  }): Promise<Design> => {
    // Average weight per piece = Sample weight ÷ Sample piece count
    const avgWeight = Number((data.sampleWeight / Math.max(1, data.samplePieceCount)).toFixed(4));
    
    // Barcode auto-generated and saved the moment a design is created
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const barcode = `DES-${randomSuffix}`;
    const id = `des-${Date.now()}`;
    const now = new Date().toISOString().split('T')[0];

    // Compute visual fingerprint for Photo Search similarity
    const fingerprint = await extractImageFingerprint(data.photoUrl);

    const newDesign: Design = {
      id,
      name: data.name,
      orderRef: data.orderRef,
      photoUrl: data.photoUrl,
      targetQuantity: data.targetQuantity,
      lowStockThreshold: data.lowStockThreshold || 500,
      barcode,
      averageWeightPerPiece: avgWeight,
      sampleWeight: data.sampleWeight,
      samplePieceCount: data.samplePieceCount,
      fingerprint,
      createdAt: now,
      updatedAt: now,
    };

    setDesigns((prev) => [newDesign, ...prev]);
    return newDesign;
  };

  // RECALIBRATE DESIGN AVERAGE WEIGHT PER PIECE
  const recalibrateDesign = (designId: string, newAvgWeight: number) => {
    setDesigns((prev) =>
      prev.map((d) =>
        d.id === designId
          ? {
              ...d,
              averageWeightPerPiece: Number(newAvgWeight.toFixed(4)),
              updatedAt: new Date().toISOString().split('T')[0],
            }
          : d
      )
    );
  };

  // UPDATE LOW STOCK ALERT THRESHOLD
  const updateLowStockThreshold = (designId: string, newThreshold: number) => {
    setDesigns((prev) =>
      prev.map((d) => (d.id === designId ? { ...d, lowStockThreshold: newThreshold } : d))
    );
  };

  // CREATE LOT
  const createLot = (lotData: {
    lotNumber: string;
    designId: string;
    initialPieces: number;
    initialWeight: number;
    startingStage: Stage;
    karigarId: string;
  }): Lot => {
    const design = designs.find((d) => d.id === lotData.designId);
    const karigar = karigars.find((k) => k.id === lotData.karigarId);
    const now = new Date().toISOString().split('T')[0];

    const karigarName = karigar ? karigar.name : 'Unassigned';
    const dynamicQr = generateLotStageQrPayload(
      lotData.lotNumber,
      lotData.startingStage,
      karigarName,
      now
    );

    const firstStageRecord: LotStageRecord = {
      stage: lotData.startingStage,
      karigarId: lotData.karigarId,
      karigarName,
      dateSent: now,
      weightSent: lotData.initialWeight,
      piecesSent: lotData.initialPieces,
      qrData: dynamicQr,
      isCompleted: false,
    };

    const newLot: Lot = {
      id: `lot-${Date.now()}`,
      lotNumber: lotData.lotNumber,
      designId: lotData.designId,
      designName: design ? design.name : 'Unknown Design',
      initialPieces: lotData.initialPieces,
      initialWeight: lotData.initialWeight,
      currentStage: lotData.startingStage,
      branch: 'none',
      currentKarigarId: lotData.karigarId,
      currentKarigarName: karigarName,
      status: 'in_progress', // Handed to karigar
      currentQrData: dynamicQr,
      history: [firstStageRecord],
      createdAt: now,
    };

    setLots((prev) => [newLot, ...prev]);
    return newLot;
  };

  // STEP 5: SCAN TO CONFIRM ARRIVAL
  // "The admin scans the slip's QR/barcode. This action does exactly one thing:
  // flips that lot's status to red — 'Arrived, awaiting entry.'
  // This step must never ask for or accept any data entry — it is purely a status flip"
  const confirmArrival = (lotIdentifier: string): { success: boolean; lot?: Lot; message: string } => {
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

    const newLots = [...lots];
    newLots[lotIndex] = updatedLot;
    setLots(newLots);

    return {
      success: true,
      lot: updatedLot,
      message: `Arrival confirmed for Lot ${lot.lotNumber} at stage ${lot.currentStage}. Status flipped to: Arrived, awaiting entry.`,
    };
  };

  // STEP 6: MANUAL DATA ENTRY
  const completeStageDataEntry = (
    lotId: string,
    entry: {
      weightReceived: number;
      statedPieces: number;
      rejectedPieces: number;
      recalibratedAvgWeight?: number;
    }
  ): { success: boolean; message: string; lot?: Lot } => {
    const lotIndex = lots.findIndex((l) => l.id === lotId);
    if (lotIndex === -1) {
      return { success: false, message: 'Lot not found.' };
    }

    const lot = lots[lotIndex];
    const design = designs.find((d) => d.id === lot.designId);
    const avgWeight = design?.averageWeightPerPiece || 1.5;

    const history = [...lot.history];
    const currentRecIndex = history.length - 1;
    if (currentRecIndex < 0) {
      return { success: false, message: 'Lot has no active stage record.' };
    }

    const currentRecord = history[currentRecIndex];
    const weightSent = currentRecord.weightSent;
    const weightReceived = entry.weightReceived;

    // 2. Estimated pieces = Weight received ÷ Average weight per piece
    const estimatedPieces = Math.round(weightReceived / Math.max(0.01, avgWeight));

    // 4. Discrepancy warning if stated pieces don't reasonably match estimated pieces
    // A gram or two of natural variance is normal; large unexplained jump warns
    const theoreticalWeightForStated = entry.statedPieces * avgWeight;
    const weightDiffGrams = Math.abs(weightReceived - theoreticalWeightForStated);
    const piecesDiff = Math.abs(estimatedPieces - entry.statedPieces);
    // Discrepancy triggers if weight difference > 2.0 grams or pieces variance > 3%
    const hasDiscrepancy = weightDiffGrams > 2.0 || piecesDiff > Math.max(3, estimatedPieces * 0.03);

    // 6. Weight loss = Weight sent - Weight received
    const weightLoss = Number(Math.max(0, weightSent - weightReceived).toFixed(3));
    const lossPercentage = Number(((weightLoss / Math.max(0.1, weightSent)) * 100).toFixed(2));

    const completedAt = new Date().toISOString().split('T')[0];

    // Update current stage record
    history[currentRecIndex] = {
      ...currentRecord,
      weightReceived,
      estimatedPieces,
      statedPieces: entry.statedPieces,
      hasDiscrepancy,
      discrepancyGramsDiff: Number(weightDiffGrams.toFixed(2)),
      rejectedPieces: entry.rejectedPieces,
      weightLoss,
      lossPercentage,
      recalibratedAvgWeight: entry.recalibratedAvgWeight,
      isCompleted: true,
      completedAt,
    };

    // 7. Optional recalibration
    if (entry.recalibratedAvgWeight && design) {
      recalibrateDesign(design.id, entry.recalibratedAvgWeight);
    }

    // 8. On completion, the lot's status turns green — stage complete
    const updatedLot: Lot = {
      ...lot,
      status: 'stage_complete', // Green status
      history,
    };

    const newLots = [...lots];
    newLots[lotIndex] = updatedLot;
    setLots(newLots);

    return {
      success: true,
      message: `Stage ${lot.currentStage} entry completed. Lot is now Green: Stage Complete.`,
      lot: updatedLot,
    };
  };

  // STEP 7: PICK NEXT STAGE
  // The admin manually selects the next stage from available options — app never auto-advances.
  // This allows the real-world branching (Plain or Gold at Chhol).
  // Regenerates a fresh dynamic QR code for the stage slip!
  const advanceToNextStage = (
    lotId: string,
    nextStage: Stage,
    branch: BranchType,
    nextKarigarId: string
  ): { success: boolean; message: string; lot?: Lot } => {
    const lotIndex = lots.findIndex((l) => l.id === lotId);
    if (lotIndex === -1) {
      return { success: false, message: 'Lot not found.' };
    }

    const lot = lots[lotIndex];
    const lastRecord = lot.history[lot.history.length - 1];
    const prevWeightReceived = lastRecord?.weightReceived ?? lot.initialWeight;
    const prevPieces = (lastRecord?.statedPieces ?? lot.initialPieces) - (lastRecord?.rejectedPieces ?? 0);
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

      const newLots = [...lots];
      newLots[lotIndex] = updatedLot;
      setLots(newLots);

      return {
        success: true,
        message: `Lot ${lot.lotNumber} moved to Ready Stock (${bucket}).`,
        lot: updatedLot,
      };
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

    const newLots = [...lots];
    newLots[lotIndex] = updatedLot;
    setLots(newLots);

    return {
      success: true,
      message: `Lot advanced to ${nextStage} under Karigar ${karigarName}. Fresh QR generated!`,
      lot: updatedLot,
    };
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
    const stageList: Stage[] = ['Wax', 'Casting', 'Buff', 'Zabora', 'Dal', 'Chhol', 'Plating'];
    return stageList.map((stg) => {
      const activeLots = lots.filter((l) => l.currentStage === stg && l.status !== 'ready_stock');
      const pieceCount = activeLots.reduce((sum, l) => {
        const lastRec = l.history[l.history.length - 1];
        return sum + (lastRec?.piecesSent || l.initialPieces);
      }, 0);
      const weightGrams = Number(
        activeLots
          .reduce((sum, l) => {
            const lastRec = l.history[l.history.length - 1];
            return sum + (lastRec?.weightSent || l.initialWeight);
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
    const stages: Stage[] = ['Wax', 'Casting', 'Buff', 'Zabora', 'Dal', 'Chhol', 'Plating'];

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
          totalSent += record.weightSent;
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
            piecesHandled += h.piecesSent;
            rejectionsLogged += h.rejectedPieces || 0;
            totalWeightSent += h.weightSent;
            totalWeightLoss += h.weightLoss || 0;
          }
        });
      });

      const avgLossPercentage =
        totalWeightSent > 0 ? Number(((totalWeightLoss / totalWeightSent) * 100).toFixed(2)) : 0;

      const activeLotsCount = lots.filter(
        (l) => l.currentKarigarId === k.id && l.status !== 'ready_stock'
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
    
    // Find active lots at this stage that are currently "sent but not yet received" (status: in_progress or arrived_awaiting_entry)
    const activeLotsAtStage = lots.filter(
      (l) => l.currentStage === stage && (l.status === 'in_progress' || l.status === 'arrived_awaiting_entry')
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

  const resetToDefaultData = () => {
    setDesigns(INITIAL_DESIGNS);
    setLots(INITIAL_LOTS);
    setKarigars(INITIAL_KARIGARS);
    localStorage.removeItem(STORAGE_KEY_DESIGNS);
    localStorage.removeItem(STORAGE_KEY_LOTS);
    localStorage.removeItem(STORAGE_KEY_KARIGARS);
  };

  return (
    <AppContext.Provider
      value={{
        designs,
        lots,
        karigars,
        selectedStageForDetail,
        setSelectedStageForDetail,
        createDesign,
        recalibrateDesign,
        updateLowStockThreshold,
        createLot,
        confirmArrival,
        completeStageDataEntry,
        advanceToNextStage,
        getReadyStockSummary,
        getStageWisePendingReport,
        getLossReport,
        getKarigarPerformanceReport,
        getKarigarStatusForStage,
        resetToDefaultData,
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
