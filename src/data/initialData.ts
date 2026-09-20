import { Design, Lot, Karigar } from '../types';
import { generateLotStageQrPayload } from '../utils/qrBarcode';

// Helper for generating lightweight SVG data URLs for sample ring photos
export function getSampleRingPhoto(name: string, primaryColor = '#d97706'): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
    <defs>
      <radialGradient id="bg" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#1e1e24"/>
        <stop offset="100%" stop-color="#0f0f12"/>
      </radialGradient>
      <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fef08a"/>
        <stop offset="35%" stop-color="${primaryColor}"/>
        <stop offset="70%" stop-color="#b45309"/>
        <stop offset="100%" stop-color="#fef08a"/>
      </linearGradient>
      <linearGradient id="gem" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="50%" stop-color="#e0f2fe"/>
        <stop offset="100%" stop-color="#38bdf8"/>
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <rect width="400" height="400" rx="24" fill="url(#bg)"/>
    <circle cx="200" cy="200" r="160" stroke="#27272a" stroke-width="2" fill="none" stroke-dasharray="6 6"/>
    
    <!-- Outer Ring Band -->
    <ellipse cx="200" cy="220" rx="100" ry="85" fill="none" stroke="url(#gold)" stroke-width="22" filter="url(#glow)"/>
    <ellipse cx="200" cy="216" rx="90" ry="76" fill="none" stroke="#78350f" stroke-width="4" opacity="0.6"/>
    
    <!-- Intricate Floral Prongs / Filigree Base -->
    <path d="M 175 135 C 185 110, 215 110, 225 135 Z" fill="url(#gold)" />
    <path d="M 160 145 C 145 130, 160 115, 175 130 Z" fill="url(#gold)" />
    <path d="M 240 145 C 255 130, 240 115, 225 130 Z" fill="url(#gold)" />
    
    <!-- Diamond / Gemstone -->
    <polygon points="200,95 225,120 200,145 175,120" fill="url(#gem)" stroke="#ffffff" stroke-width="2" filter="url(#glow)"/>
    <polygon points="200,105 215,120 200,135 185,120" fill="#ffffff" opacity="0.8"/>
    
    <text x="200" y="340" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-size="14" font-weight="600" fill="#fbbf24" letter-spacing="1">${name.toUpperCase()}</text>
    <text x="200" y="360" text-anchor="middle" font-family="monospace" font-size="11" fill="#a1a1aa">SHREENATHJI IMITATION</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const INITIAL_KARIGARS: Karigar[] = [
  { id: 'kar-1', name: 'Ramesh Bhai', phone: '+91 98251 10293', specialtyStages: ['Wax', 'Casting'] },
  { id: 'kar-2', name: 'Mahesh Bhai', phone: '+91 98252 84721', specialtyStages: ['Wax', 'Buff'] },
  { id: 'kar-3', name: 'Suresh Bhai', phone: '+91 98983 23419', specialtyStages: ['Buff', 'Zabora'] },
  { id: 'kar-4', name: 'Ketan Bhai', phone: '+91 94284 98712', specialtyStages: ['Zabora', 'Dull'] },
  { id: 'kar-5', name: 'Bharat Bhai', phone: '+91 98795 34561', specialtyStages: ['Dull', 'Chhol'] },
  { id: 'kar-6', name: 'Mansukh Bhai', phone: '+91 99096 11284', specialtyStages: ['Chhol'] },
  { id: 'kar-7', name: 'Paresh Bhai', phone: '+91 98247 67120', specialtyStages: ['Plating'] },
  { id: 'kar-8', name: 'Jignesh Bhai', phone: '+91 97238 54329', specialtyStages: ['Wax', 'Casting', 'Buff'] },
];

export const INITIAL_DESIGNS: Design[] = [
  {
    id: 'des-1',
    name: 'Shree Royal Floral Solitaire Ring',
    orderRef: 'ORD-2024-501',
    photoUrl: getSampleRingPhoto('Floral Solitaire', '#f59e0b'),
    targetQuantity: 1500,
    lowStockThreshold: 500,
    barcode: 'DES-108501',
    waxAvgWeightPerPiece: 0.22, // 22g wax / 100pcs
    metalAvgWeightPerPiece: 1.62, // 162g raw metal / 100pcs
    plainAvgWeightPerPiece: 1.48, // after filing for plain
    goldAvgWeightPerPiece: 1.54, // after filing for gold plating
    sampleWeight: 22.0,
    samplePieceCount: 100,
    fingerprint: {
      dominantHue: 42,
      avgBrightness: 165,
      edgeDensity: 0.62,
      warmth: 0.72,
      aspectRatio: 1,
      hash: '42-165-72-62',
    },
    createdAt: '2026-08-10',
    updatedAt: '2026-08-10',
  },
  {
    id: 'des-2',
    name: 'Kundan Navratna Adjustable Band',
    orderRef: 'ORD-2024-502',
    photoUrl: getSampleRingPhoto('Kundan Band', '#eab308'),
    targetQuantity: 2000,
    lowStockThreshold: 450,
    barcode: 'DES-108502',
    waxAvgWeightPerPiece: 0.30,
    metalAvgWeightPerPiece: 2.20,
    plainAvgWeightPerPiece: 2.02,
    goldAvgWeightPerPiece: 2.10,
    sampleWeight: 24.0,
    samplePieceCount: 80,
    fingerprint: {
      dominantHue: 48,
      avgBrightness: 155,
      edgeDensity: 0.78,
      warmth: 0.81,
      aspectRatio: 1,
      hash: '48-155-81-78',
    },
    createdAt: '2026-08-12',
    updatedAt: '2026-08-12',
  },
  {
    id: 'des-3',
    name: 'Classic Micro-Pave Filigree Ring',
    orderRef: 'ORD-2024-503',
    photoUrl: getSampleRingPhoto('Micro-Pave', '#fbbf24'),
    targetQuantity: 1200,
    lowStockThreshold: 500, // Trigger low stock alert to test!
    barcode: 'DES-108503',
    waxAvgWeightPerPiece: 0.18,
    metalAvgWeightPerPiece: 1.30,
    plainAvgWeightPerPiece: 1.18,
    goldAvgWeightPerPiece: 1.23,
    sampleWeight: 21.6,
    samplePieceCount: 120,
    fingerprint: {
      dominantHue: 38,
      avgBrightness: 170,
      edgeDensity: 0.54,
      warmth: 0.68,
      aspectRatio: 1,
      hash: '38-170-68-54',
    },
    createdAt: '2026-08-15',
    updatedAt: '2026-08-15',
  },
  {
    id: 'des-4',
    name: 'Mayur Peacock Carved Statement Ring',
    orderRef: 'ORD-2024-504',
    photoUrl: getSampleRingPhoto('Mayur Carved', '#d97706'),
    targetQuantity: 1000,
    lowStockThreshold: 350,
    barcode: 'DES-108504',
    waxAvgWeightPerPiece: 0.26,
    metalAvgWeightPerPiece: 1.85,
    plainAvgWeightPerPiece: 0,
    goldAvgWeightPerPiece: 0,
    sampleWeight: 26.0,
    samplePieceCount: 100,
    fingerprint: {
      dominantHue: 35,
      avgBrightness: 145,
      edgeDensity: 0.82,
      warmth: 0.75,
      aspectRatio: 1,
      hash: '35-145-75-82',
    },
    createdAt: '2026-08-18',
    updatedAt: '2026-08-18',
  },
];

export const INITIAL_LOTS: Lot[] = [
  {
    id: 'lot-1',
    lotNumber: 'LOT-901',
    designId: 'des-1',
    designName: 'Shree Royal Floral Solitaire Ring',
    initialPieces: 300,
    initialWeight: 486.0, // 300 * 1.62
    currentStage: 'Wax',
    branch: 'none',
    currentKarigarId: 'kar-1',
    currentKarigarName: 'Ramesh Bhai',
    status: 'in_progress', // Handed to karigar
    currentQrData: generateLotStageQrPayload('LOT-901', 'Wax', 'Ramesh Bhai', '2026-09-12'),
    history: [
      {
        stage: 'Wax',
        karigarId: 'kar-1',
        karigarName: 'Ramesh Bhai',
        dateSent: '2026-09-12',
        weightSent: 486.0,
        piecesSent: 300,
        qrData: generateLotStageQrPayload('LOT-901', 'Wax', 'Ramesh Bhai', '2026-09-12'),
        isCompleted: false,
      },
    ],
    createdAt: '2026-09-12',
  },
  {
    id: 'lot-2',
    lotNumber: 'LOT-902',
    designId: 'des-2',
    designName: 'Kundan Navratna Adjustable Band',
    initialPieces: 250,
    initialWeight: 550.0, // 250 * 2.20
    currentStage: 'Casting',
    branch: 'none',
    currentKarigarId: 'kar-2',
    currentKarigarName: 'Mahesh Bhai',
    status: 'in_progress', // Handed to karigar
    currentQrData: generateLotStageQrPayload('LOT-902', 'Casting', 'Mahesh Bhai', '2026-09-13'),
    history: [
      {
        stage: 'Wax',
        karigarId: 'kar-1',
        karigarName: 'Ramesh Bhai',
        dateSent: '2026-09-08',
        weightSent: 550.0,
        piecesSent: 250,
        qrData: generateLotStageQrPayload('LOT-902', 'Wax', 'Ramesh Bhai', '2026-09-08'),
        weightReceived: 546.5,
        estimatedPieces: 248,
        statedPieces: 248,
        hasDiscrepancy: false,
        rejectedPieces: 2,
        weightLoss: 3.5,
        lossPercentage: 0.64,
        isCompleted: true,
        completedAt: '2026-09-10',
      },
      {
        stage: 'Casting',
        karigarId: 'kar-2',
        karigarName: 'Mahesh Bhai',
        dateSent: '2026-09-13',
        weightSent: 546.5,
        piecesSent: 248,
        qrData: generateLotStageQrPayload('LOT-902', 'Casting', 'Mahesh Bhai', '2026-09-13'),
        isCompleted: false,
      },
    ],
    createdAt: '2026-09-08',
  },
  {
    id: 'lot-3',
    lotNumber: 'LOT-903',
    designId: 'des-1',
    designName: 'Shree Royal Floral Solitaire Ring',
    initialPieces: 200,
    initialWeight: 324.0,
    currentStage: 'Buff',
    branch: 'none',
    currentKarigarId: 'kar-3',
    currentKarigarName: 'Suresh Bhai',
    // STEP 5 FLIP DEMONSTRATION: Scanned, flipped strictly to Red: "Arrived, awaiting entry"
    status: 'arrived_awaiting_entry',
    currentQrData: generateLotStageQrPayload('LOT-903', 'Buff', 'Suresh Bhai', '2026-09-11'),
    history: [
      {
        stage: 'Wax',
        karigarId: 'kar-1',
        karigarName: 'Ramesh Bhai',
        dateSent: '2026-09-04',
        weightSent: 324.0,
        piecesSent: 200,
        qrData: generateLotStageQrPayload('LOT-903', 'Wax', 'Ramesh Bhai', '2026-09-04'),
        weightReceived: 322.0,
        estimatedPieces: 199,
        statedPieces: 199,
        hasDiscrepancy: false,
        rejectedPieces: 1,
        weightLoss: 2.0,
        lossPercentage: 0.62,
        isCompleted: true,
        completedAt: '2026-09-06',
      },
      {
        stage: 'Casting',
        karigarId: 'kar-2',
        karigarName: 'Mahesh Bhai',
        dateSent: '2026-09-07',
        weightSent: 322.0,
        piecesSent: 199,
        qrData: generateLotStageQrPayload('LOT-903', 'Casting', 'Mahesh Bhai', '2026-09-07'),
        weightReceived: 317.5,
        estimatedPieces: 196,
        statedPieces: 196,
        hasDiscrepancy: false,
        rejectedPieces: 3,
        weightLoss: 4.5,
        lossPercentage: 1.40,
        isCompleted: true,
        completedAt: '2026-09-10',
      },
      {
        stage: 'Buff',
        karigarId: 'kar-3',
        karigarName: 'Suresh Bhai',
        dateSent: '2026-09-11',
        weightSent: 317.5,
        piecesSent: 196,
        qrData: generateLotStageQrPayload('LOT-903', 'Buff', 'Suresh Bhai', '2026-09-11'),
        arrivedAt: '2026-09-14 10:30',
        isCompleted: false, // Waiting for Step 6 manual entry!
      },
    ],
    createdAt: '2026-09-04',
  },
  {
    id: 'lot-4',
    lotNumber: 'LOT-904',
    designId: 'des-3',
    designName: 'Classic Micro-Pave Filigree Ring',
    initialPieces: 400,
    initialWeight: 520.0,
    currentStage: 'Chhol',
    branch: 'none', // At Chhol, ready for Step 7 branch selection (Plain vs Gold)!
    currentKarigarId: 'kar-6',
    currentKarigarName: 'Mansukh Bhai',
    status: 'stage_complete', // Green: Step 6 completed, waiting to Pick Next Stage (Step 7)
    currentQrData: generateLotStageQrPayload('LOT-904', 'Chhol', 'Mansukh Bhai', '2026-09-12'),
    history: [
      {
        stage: 'Wax',
        karigarId: 'kar-1',
        karigarName: 'Ramesh Bhai',
        dateSent: '2026-08-28',
        weightSent: 520.0,
        piecesSent: 400,
        qrData: generateLotStageQrPayload('LOT-904', 'Wax', 'Ramesh Bhai', '2026-08-28'),
        weightReceived: 517.4,
        estimatedPieces: 398,
        statedPieces: 398,
        rejectedPieces: 2,
        weightLoss: 2.6,
        lossPercentage: 0.50,
        isCompleted: true,
        completedAt: '2026-08-30',
      },
      {
        stage: 'Casting',
        karigarId: 'kar-2',
        karigarName: 'Mahesh Bhai',
        dateSent: '2026-08-31',
        weightSent: 517.4,
        piecesSent: 398,
        qrData: generateLotStageQrPayload('LOT-904', 'Casting', 'Mahesh Bhai', '2026-08-31'),
        weightReceived: 511.0,
        estimatedPieces: 393,
        statedPieces: 393,
        rejectedPieces: 5,
        weightLoss: 6.4,
        lossPercentage: 1.24,
        isCompleted: true,
        completedAt: '2026-09-03',
      },
      {
        stage: 'Buff',
        karigarId: 'kar-3',
        karigarName: 'Suresh Bhai',
        dateSent: '2026-09-04',
        weightSent: 511.0,
        piecesSent: 393,
        qrData: generateLotStageQrPayload('LOT-904', 'Buff', 'Suresh Bhai', '2026-09-04'),
        weightReceived: 507.0,
        estimatedPieces: 390,
        statedPieces: 390,
        rejectedPieces: 3,
        weightLoss: 4.0,
        lossPercentage: 0.78,
        isCompleted: true,
        completedAt: '2026-09-07',
      },
      {
        stage: 'Zabora',
        karigarId: 'kar-4',
        karigarName: 'Ketan Bhai',
        dateSent: '2026-09-08',
        weightSent: 507.0,
        piecesSent: 390,
        qrData: generateLotStageQrPayload('LOT-904', 'Zabora', 'Ketan Bhai', '2026-09-08'),
        weightReceived: 504.4,
        estimatedPieces: 388,
        statedPieces: 388,
        rejectedPieces: 2,
        weightLoss: 2.6,
        lossPercentage: 0.51,
        isCompleted: true,
        completedAt: '2026-09-10',
      },
      {
        stage: 'Dull',
        karigarId: 'kar-5',
        karigarName: 'Bharat Bhai',
        dateSent: '2026-09-10',
        weightSent: 504.4,
        piecesSent: 388,
        qrData: generateLotStageQrPayload('LOT-904', 'Dull', 'Bharat Bhai', '2026-09-10'),
        weightReceived: 501.8,
        estimatedPieces: 386,
        statedPieces: 386,
        rejectedPieces: 2,
        weightLoss: 2.6,
        lossPercentage: 0.52,
        isCompleted: true,
        completedAt: '2026-09-12',
      },
      {
        stage: 'Chhol',
        karigarId: 'kar-6',
        karigarName: 'Mansukh Bhai',
        dateSent: '2026-09-12',
        weightSent: 501.8,
        piecesSent: 386,
        qrData: generateLotStageQrPayload('LOT-904', 'Chhol', 'Mansukh Bhai', '2026-09-12'),
        arrivedAt: '2026-09-14 14:15',
        weightReceived: 497.9,
        estimatedPieces: 383,
        statedPieces: 383,
        hasDiscrepancy: false,
        rejectedPieces: 3,
        weightLoss: 3.9,
        lossPercentage: 0.78,
        isCompleted: true,
        completedAt: '2026-09-15 11:00',
      },
    ],
    createdAt: '2026-08-28',
  },
  {
    id: 'lot-5',
    lotNumber: 'LOT-900',
    designId: 'des-1',
    designName: 'Shree Royal Floral Solitaire Ring',
    initialPieces: 350,
    initialWeight: 567.0,
    currentStage: 'Ready Stock',
    branch: 'plain',
    currentKarigarId: 'kar-6',
    currentKarigarName: 'Mansukh Bhai',
    status: 'ready_stock',
    currentQrData: generateLotStageQrPayload('LOT-900', 'Ready Stock', 'Mansukh Bhai', '2026-09-02'),
    history: [],
    createdAt: '2026-08-15',
    readyStockBucket: 'Plain',
    finalPieces: 341,
    finalWeight: 552.4,
  },
  {
    id: 'lot-6',
    lotNumber: 'LOT-899',
    designId: 'des-2',
    designName: 'Kundan Navratna Adjustable Band',
    initialPieces: 300,
    initialWeight: 660.0,
    currentStage: 'Ready Stock',
    branch: 'gold',
    currentKarigarId: 'kar-7',
    currentKarigarName: 'Paresh Bhai',
    status: 'ready_stock',
    currentQrData: generateLotStageQrPayload('LOT-899', 'Ready Stock', 'Paresh Bhai', '2026-09-05'),
    history: [],
    createdAt: '2026-08-16',
    readyStockBucket: 'Gold',
    finalPieces: 294,
    finalWeight: 646.8,
  },
  {
    id: 'lot-7',
    lotNumber: 'LOT-905',
    designId: 'des-4',
    designName: 'Mayur Peacock Carved Statement Ring',
    initialPieces: 200,
    initialWeight: 370.0,
    currentStage: 'Chhol',
    branch: 'plain',
    currentKarigarId: 'kar-6',
    currentKarigarName: 'Mansukh Bhai',
    status: 'arrived_awaiting_entry',
    currentQrData: generateLotStageQrPayload('LOT-905', 'Chhol', 'Mansukh Bhai', '2026-09-18'),
    history: [
      {
        stage: 'Wax',
        karigarId: 'kar-1',
        karigarName: 'Ramesh Patel',
        dateSent: '2026-09-10 09:00',
        weightSent: 52.0,
        piecesSent: 200,
        qrData: generateLotStageQrPayload('LOT-905', 'Wax', 'Ramesh Patel', '2026-09-10'),
        arrivedAt: '2026-09-10 09:30',
        weightReceived: 51.8,
        estimatedPieces: 199,
        statedPieces: 200,
        hasDiscrepancy: false,
        rejectedPieces: 0,
        weightLoss: 0.2,
        lossPercentage: 0.38,
        isCompleted: true,
        completedAt: '2026-09-11 17:00',
      },
      {
        stage: 'Casting',
        karigarId: 'kar-2',
        karigarName: 'Dinesh Kumar',
        dateSent: '2026-09-12 08:30',
        weightSent: 374.0,
        piecesSent: 200,
        qrData: generateLotStageQrPayload('LOT-905', 'Casting', 'Dinesh Kumar', '2026-09-12'),
        arrivedAt: '2026-09-12 09:00',
        weightReceived: 370.0,
        estimatedPieces: 200,
        statedPieces: 200,
        hasDiscrepancy: false,
        rejectedPieces: 0,
        weightLoss: 4.0,
        lossPercentage: 1.07,
        isCompleted: true,
        completedAt: '2026-09-13 16:30',
      },
      {
        stage: 'Buff',
        karigarId: 'kar-3',
        karigarName: 'Suresh Verma',
        dateSent: '2026-09-14 09:15',
        weightSent: 370.0,
        piecesSent: 200,
        qrData: generateLotStageQrPayload('LOT-905', 'Buff', 'Suresh Verma', '2026-09-14'),
        arrivedAt: '2026-09-14 10:00',
        weightReceived: 367.5,
        estimatedPieces: 199,
        statedPieces: 200,
        hasDiscrepancy: false,
        rejectedPieces: 0,
        weightLoss: 2.5,
        lossPercentage: 0.68,
        isCompleted: true,
        completedAt: '2026-09-15 15:00',
      },
      {
        stage: 'Chhol',
        karigarId: 'kar-6',
        karigarName: 'Mansukh Bhai',
        dateSent: '2026-09-18 10:00',
        weightSent: 367.5,
        piecesSent: 200,
        qrData: generateLotStageQrPayload('LOT-905', 'Chhol', 'Mansukh Bhai', '2026-09-18'),
        arrivedAt: '2026-09-18 11:30',
        isCompleted: false,
      },
    ],
    createdAt: '2026-09-10',
  },
];
