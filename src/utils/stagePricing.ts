import { JobWorkRateBasis, Stage } from '../types';

export const getStageRateBasis = (stage: Stage): JobWorkRateBasis => {
  switch (stage) {
    case 'Wax':
    case 'Buff':
    case 'Dull':
      return 'per_piece';
    case 'Casting':
    case 'Zabora':
      return 'per_kg';
    default:
      return 'flat';
  }
};

export const rateBasisLabel = (basis: JobWorkRateBasis) => {
  if (basis === 'per_piece') return 'per piece';
  if (basis === 'per_kg') return 'per kg';
  return 'flat amount';
};

export const rateUnitLabel = (basis: JobWorkRateBasis) => {
  if (basis === 'per_piece') return '₹ / piece';
  if (basis === 'per_kg') return '₹ / kg';
  return '₹ total';
};

export const calculateJobWorkAmount = (
  rate: number,
  basis: JobWorkRateBasis,
  pieces?: number,
  weightGrams?: number,
) => {
  const quantity = basis === 'per_piece'
    ? (pieces ?? 0)
    : basis === 'per_kg'
      ? (weightGrams ?? 0) / 1000
      : 1;
  return Number((Math.max(0, rate) * Math.max(0, quantity)).toFixed(2));
};

export const formatJobWorkRate = (rate?: number, basis?: JobWorkRateBasis) => {
  if (rate == null) return '—';
  const resolvedBasis = basis ?? 'flat';
  if (resolvedBasis === 'per_piece') return `₹${rate.toLocaleString('en-IN')}/pc`;
  if (resolvedBasis === 'per_kg') return `₹${rate.toLocaleString('en-IN')}/kg`;
  return `₹${rate.toLocaleString('en-IN')} flat`;
};
