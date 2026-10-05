import { Design, Karigar, Lot, LotStageRecord } from '../types';
import { requireSupabase } from '../lib/supabase';
import { getDesignPhotoUrl } from './designImageStorage';

type JsonRecord = Record<string, unknown>;

export type ProductionChange = {
  table: 'designs' | 'lots' | 'karigars';
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  newRow: any;
  oldRow: any;
};

export const designFromRow = async (row: any): Promise<Design> => {
  const storedPhoto = String(row.photo_url ?? '');
  const isStoragePath = storedPhoto.length > 0 &&
    !storedPhoto.startsWith('data:') &&
    !/^https?:\/\//i.test(storedPhoto);
  const photoStoragePath = isStoragePath ? storedPhoto : undefined;

  return {
    id: row.id,
    name: row.name,
    orderRef: row.order_ref,
    photoUrl: photoStoragePath ? await getDesignPhotoUrl(photoStoragePath) : storedPhoto,
    photoStoragePath,
    targetQuantity: row.target_quantity ?? undefined,
    lowStockThreshold: row.low_stock_threshold,
    barcode: row.barcode,
    waxAvgWeightPerPiece: Number(row.wax_avg_weight_per_piece),
    metalAvgWeightPerPiece: Number(row.metal_avg_weight_per_piece),
    plainAvgWeightPerPiece: Number(row.plain_avg_weight_per_piece),
    goldAvgWeightPerPiece: Number(row.gold_avg_weight_per_piece),
    fingerprint: row.fingerprint ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const designToRow = (design: Design): JsonRecord => ({
  id: design.id,
  name: design.name,
  order_ref: design.orderRef,
  photo_url: design.photoStoragePath ?? design.photoUrl,
  target_quantity: design.targetQuantity ?? null,
  low_stock_threshold: design.lowStockThreshold,
  barcode: design.barcode,
  wax_avg_weight_per_piece: design.waxAvgWeightPerPiece,
  metal_avg_weight_per_piece: design.metalAvgWeightPerPiece,
  plain_avg_weight_per_piece: design.plainAvgWeightPerPiece,
  gold_avg_weight_per_piece: design.goldAvgWeightPerPiece,
  // Legacy columns are retained in the database but are no longer collected.
  sample_weight: 0,
  sample_piece_count: 0,
  fingerprint: design.fingerprint ?? null,
  created_at: design.createdAt,
  updated_at: design.updatedAt,
});

export const karigarFromRow = (row: any): Karigar => ({
  id: row.id,
  name: row.name,
  phone: row.phone,
  specialtyStages: row.specialty_stages ?? [],
});

export const lotFromRow = (row: any): Lot => {
  const initialPieces = Number(row.initial_pieces) || 0;
  const initialWeight = Number(row.initial_weight) || 0;
  const history: LotStageRecord[] = (row.history ?? []).map((record: LotStageRecord) => {
    if (record.stage !== 'Wax') return record;
    const normalized = { ...record };
    normalized.dateOrdered ??= normalized.dateReceived ?? normalized.completedAt ?? normalized.dateSent;
    if (row.status === 'awaiting_wax_receipt') {
      delete normalized.dateSent;
      delete normalized.weightSent;
      delete normalized.piecesSent;
      delete normalized.weightReceived;
      delete normalized.estimatedPieces;
      delete normalized.statedPieces;
      delete normalized.weightLoss;
      delete normalized.lossPercentage;
      delete normalized.piecesLoss;
      normalized.isCompleted = false;
      return normalized;
    }
    normalized.weightReceived ??= normalized.weightSent ?? initialWeight;
    normalized.estimatedPieces ??= normalized.piecesSent ?? initialPieces;
    normalized.statedPieces ??= normalized.piecesSent ?? initialPieces;
    normalized.dateReceived ??= normalized.completedAt ?? normalized.dateSent;
    delete normalized.dateSent;
    delete normalized.weightSent;
    delete normalized.piecesSent;
    delete normalized.weightLoss;
    delete normalized.lossPercentage;
    delete normalized.piecesLoss;
    normalized.isCompleted = true;
    return normalized;
  });
  const status = row.current_stage === 'Wax' && row.status !== 'ready_stock' && row.status !== 'awaiting_wax_receipt'
    ? 'stage_complete'
    : row.status;
  return ({
  id: row.id,
  lotNumber: row.lot_number,
  designId: row.design_id,
  designName: row.design_name,
  initialPieces,
  initialWeight,
  currentStage: row.current_stage,
  branch: row.branch,
  currentKarigarId: row.current_karigar_id,
  currentKarigarName: row.current_karigar_name,
  status,
  currentQrData: row.current_qr_data,
  history,
  createdAt: row.created_at,
  readyStockBucket: row.ready_stock_bucket ?? undefined,
  finalPieces: row.final_pieces ?? undefined,
  finalWeight: row.final_weight == null ? undefined : Number(row.final_weight),
  });
};

const lotToRow = (lot: Lot): JsonRecord => ({
  id: lot.id,
  lot_number: lot.lotNumber,
  design_id: lot.designId,
  design_name: lot.designName,
  initial_pieces: lot.status === 'awaiting_wax_receipt' ? null : lot.initialPieces,
  initial_weight: lot.status === 'awaiting_wax_receipt' ? null : lot.initialWeight,
  current_stage: lot.currentStage,
  branch: lot.branch,
  current_karigar_id: lot.currentKarigarId,
  current_karigar_name: lot.currentKarigarName,
  status: lot.status,
  current_qr_data: lot.currentQrData,
  history: lot.history,
  created_at: lot.createdAt,
  ready_stock_bucket: lot.readyStockBucket ?? null,
  final_pieces: lot.finalPieces ?? null,
  final_weight: lot.finalWeight ?? null,
});

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export async function fetchProductionData() {
  const client = requireSupabase();
  const [designResult, lotResult, karigarResult] = await Promise.all([
    client.from('designs').select('*').order('created_at', { ascending: false }),
    client.from('lots').select('*').order('created_at', { ascending: false }),
    client.from('karigars').select('*').order('name'),
  ]);

  throwIfError(designResult.error);
  throwIfError(lotResult.error);
  throwIfError(karigarResult.error);

  return {
    designs: await Promise.all((designResult.data ?? []).map(designFromRow)),
    lots: (lotResult.data ?? []).map(lotFromRow),
    karigars: (karigarResult.data ?? []).map(karigarFromRow),
  };
}

export async function insertDesign(design: Design): Promise<Design> {
  const { data, error } = await requireSupabase()
    .from('designs')
    .insert(designToRow(design))
    .select('*')
    .single();
  throwIfError(error);
  return designFromRow(data);
}

export async function updateDesign(design: Design): Promise<Design> {
  const { data, error } = await requireSupabase()
    .from('designs')
    .update(designToRow(design))
    .eq('id', design.id)
    .select('*')
    .single();
  throwIfError(error);
  return designFromRow(data);
}

export async function insertLot(lot: Lot): Promise<Lot> {
  const { data, error } = await requireSupabase()
    .from('lots')
    .insert(lotToRow(lot))
    .select('*')
    .single();
  throwIfError(error);
  return lotFromRow(data);
}

export async function insertKarigar(karigar: Karigar): Promise<Karigar> {
  const { data, error } = await requireSupabase()
    .from('karigars')
    .insert({
      id: karigar.id,
      name: karigar.name,
      phone: karigar.phone,
      specialty_stages: karigar.specialtyStages,
    })
    .select('*')
    .single();
  throwIfError(error);
  return karigarFromRow(data);
}

export async function updateKarigar(karigar: Karigar): Promise<Karigar> {
  const { data, error } = await requireSupabase()
    .from('karigars')
    .update({
      name: karigar.name,
      phone: karigar.phone,
      specialty_stages: karigar.specialtyStages,
    })
    .eq('id', karigar.id)
    .select('*')
    .single();
  throwIfError(error);
  return karigarFromRow(data);
}

export async function updateLot(lot: Lot): Promise<Lot> {
  const { data, error } = await requireSupabase()
    .from('lots')
    .update(lotToRow(lot))
    .eq('id', lot.id)
    .select('*')
    .single();
  throwIfError(error);
  return lotFromRow(data);
}

export function subscribeToProductionChanges(
  onChange: (change: ProductionChange) => void | Promise<void>
) {
  const client = requireSupabase();
  const dispatch = (table: ProductionChange['table']) => (payload: any) => {
    void onChange({
      table,
      eventType: payload.eventType,
      newRow: payload.new,
      oldRow: payload.old,
    });
  };
  const channel = client
    .channel('production-data-sync')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'designs' }, dispatch('designs'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'lots' }, dispatch('lots'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'karigars' }, dispatch('karigars'))
    .subscribe();

  return () => {
    void client.removeChannel(channel);
  };
}
