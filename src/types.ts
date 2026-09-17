export type Stage =
  | 'Wax'
  | 'Casting'
  | 'Buff'
  | 'Zabora'
  | 'Dal'
  | 'Chhol'
  | 'Plating'
  | 'Ready Stock';

export const BASE_STAGES: Stage[] = [
  'Wax',
  'Casting',
  'Buff',
  'Zabora',
  'Dal',
  'Chhol',
];

export const ALL_ACTIVE_STAGES: Stage[] = [
  'Wax',
  'Casting',
  'Buff',
  'Zabora',
  'Dal',
  'Chhol',
  'Plating',
];

export type BranchType = 'none' | 'plain' | 'gold';

export type LotStatus =
  | 'in_progress'              // Step 1-4: Sent to karigar, work in progress
  | 'arrived_awaiting_entry'  // Step 5: Red - "Arrived, awaiting entry" (flipped strictly by scan)
  | 'stage_complete'          // Step 6: Green - "Stage complete" (ready to pick next stage)
  | 'ready_stock';            // Lot is finished in Ready Stock Plain or Gold

export interface VisualFingerprint {
  dominantHue: number;        // 0-360
  avgBrightness: number;      // 0-255
  edgeDensity: number;        // 0-1
  warmth: number;             // ratio of gold/yellow tones
  aspectRatio: number;
  hash: string;
}

export interface Design {
  id: string;
  name: string;
  orderRef: string;
  photoUrl: string;
  targetQuantity: number;
  lowStockThreshold: number; // default 500, editable per design
  barcode: string;           // permanent barcode, e.g. "DES-82910"
  averageWeightPerPiece: number; // in grams (Sample weight ÷ Sample piece count)
  sampleWeight: number;      // e.g. 150g
  samplePieceCount: number;  // e.g. 100 pcs
  fingerprint?: VisualFingerprint;
  createdAt: string;
  updatedAt: string;
}

export interface LotStageRecord {
  stage: Stage;
  karigarId: string;
  karigarName: string;
  dateSent: string;
  weightSent: number;       // in grams
  piecesSent: number;
  qrData: string;           // Dynamic QR generated for this stage transition
  
  // Step 5: Scan arrival
  arrivedAt?: string;

  // Step 6: Manual data entry
  weightReceived?: number;   // grams
  estimatedPieces?: number;  // weightReceived / averageWeightPerPiece
  statedPieces?: number;     // entered from karigar slip
  hasDiscrepancy?: boolean;  // discrepancy warning triggered
  discrepancyGramsDiff?: number;
  rejectedPieces?: number;   // manual field, never from weight
  weightLoss?: number;       // weightSent - weightReceived
  lossPercentage?: number;   // (weightLoss / weightSent) * 100
  recalibratedAvgWeight?: number; // if recalibration was performed
  completedAt?: string;
  isCompleted: boolean;
}

export interface Lot {
  id: string;
  lotNumber: string;         // e.g. "LOT-801"
  designId: string;
  designName: string;
  initialPieces: number;
  initialWeight: number;     // grams
  currentStage: Stage;
  branch: BranchType;        // 'none' before Chhol; 'plain' or 'gold' after Chhol
  currentKarigarId: string;
  currentKarigarName: string;
  status: LotStatus;
  currentQrData: string;     // Regenerated at every stage transition!
  history: LotStageRecord[];
  createdAt: string;
  readyStockBucket?: 'Plain' | 'Gold';
  finalPieces?: number;
  finalWeight?: number;
}

export interface Karigar {
  id: string;
  name: string;
  phone: string;
  specialtyStages: Stage[];
}

export interface ReadyStockItem {
  designId: string;
  designName: string;
  barcode: string;
  photoUrl: string;
  lowStockThreshold: number;
  plainPieces: number;
  plainWeight: number;
  goldPieces: number;
  goldWeight: number;
  totalPieces: number;
  isLowStock: boolean;
}

export type AppTheme = 'dark' | 'bright';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  initials: string;
  phone?: string;
  facility: string;
  permissions: string[];
}
