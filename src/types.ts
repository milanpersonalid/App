export type Stage =
  | 'Wax'
  | 'Casting'
  | 'Buff'
  | 'Zabora'
  | 'Dull'
  | 'Chhol'
  | 'Plating'
  | 'Ready Stock';

export const BASE_STAGES: Stage[] = [
  'Wax',
  'Casting',
  'Buff',
  'Zabora',
  'Dull',
  'Chhol',
];

export const ALL_ACTIVE_STAGES: Stage[] = [
  'Wax',
  'Casting',
  'Buff',
  'Zabora',
  'Dull',
  'Chhol',
  'Plating',
];

/** Allowed forward destinations before the Chhol branch decision. */
export const NEXT_STAGE_OPTIONS: Partial<Record<Stage, Stage[]>> = {
  Wax: ['Casting'],
  Casting: ['Buff', 'Zabora', 'Dull', 'Chhol'],
  Buff: ['Zabora', 'Dull', 'Chhol'],
  Zabora: ['Dull', 'Chhol'],
  Dull: ['Chhol'],
};

export const PRODUCTION_STAGE_ORDER: Stage[] = [
  'Wax', 'Casting', 'Buff', 'Zabora', 'Dull', 'Chhol', 'Plating',
];

export type BranchType = 'none' | 'plain' | 'gold';

export type CalibrationTarget = 'wax' | 'metal';

export type LotStatus =
  | 'awaiting_wax_receipt'  // Wax ordered from karigar, not yet received/weighed
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
  /** 64-bit difference hash used for actual image-to-image matching. */
  perceptualHash?: string;
}

export interface Design {
  id: string;
  name: string;
  orderRef: string;
  photoUrl: string;
  photoStoragePath?: string;
  targetQuantity?: number;
  lowStockThreshold: number; // default 500, editable per design
  barcode: string;           // permanent barcode, e.g. "DES-82910"
  waxAvgWeightPerPiece: number;   // established at Wax stage
  metalAvgWeightPerPiece: number; // established at/after Casting stage (heavier cast metal)
  /** Legacy Supabase columns retained for compatibility; no longer used as calibration rulers. */
  plainAvgWeightPerPiece: number;
  /** Legacy Supabase columns retained for compatibility; no longer used as calibration rulers. */
  goldAvgWeightPerPiece: number;
  fingerprint?: VisualFingerprint;
  createdAt: string;
  updatedAt: string;
}

export interface LotStageRecord {
  stage: Stage;
  karigarId: string;
  karigarName: string;
  dateSent?: string;        // absent for the receive-only Wax record
  dateOrdered?: string;     // Wax order creation date
  dateReceived?: string;    // used when Wax is received while creating the lot
  weightSent?: number;      // in grams; absent for the receive-only Wax record
  piecesSent?: number;      // absent for the receive-only Wax record
  /** Quantity requested from the Wax karigar; only used by the receive-only Wax record. */
  orderedQuantity?: number;
  /** Agreed job-work amount printed on this stage slip, in Indian rupees. */
  jobWorkAmount?: number;
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
  piecesLoss?: number;       // total lost pieces at this stage (missing + rejected)
  recalibratedAvgWeight?: number; // if recalibration was performed
  recalibrationTarget?: CalibrationTarget;
  completedAt?: string;
  isCompleted: boolean;
}

export interface Lot {
  id: string;
  lotNumber: string;         // e.g. "LOT-801"
  designId: string;
  designName: string;
  initialPieces: number;     // estimated Wax pieces received when the lot is created
  initialWeight: number;     // Wax weight received, in grams
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
  accessRole?: 'admin' | 'member';
  accessStatus?: 'pending' | 'approved' | 'rejected';
}

export interface AppUserAccess {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'member';
  accessStatus: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}
