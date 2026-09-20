import { Stage, BranchType, Design } from '../types';

export type StageWeightKey =
  | 'waxAvgWeightPerPiece'
  | 'metalAvgWeightPerPiece'
  | 'plainAvgWeightPerPiece'
  | 'goldAvgWeightPerPiece';

export type CalibrationTarget = 'wax' | 'metal' | 'plain' | 'gold';

/**
 * Returns which weight-per-piece field to use for estimating pieces / reference at a given stage.
 *
 * Stage Table:
 * - Wax: waxAvgWeightPerPiece
 * - Casting: waxAvgWeightPerPiece (still wax-equivalent going in; establishes metalAvgWeightPerPiece upon completion)
 * - Buff, Zabora, Dull: metalAvgWeightPerPiece
 * - Chhol: Does NOT estimate from weight; but plain/gold weights are established here
 * - Plating: goldAvgWeightPerPiece (Gold branch only)
 * - Ready Stock: plainAvgWeightPerPiece or goldAvgWeightPerPiece depending on branch
 */
export function getStageWeightKey(stage: Stage, branch: BranchType = 'none'): StageWeightKey {
  switch (stage) {
    case 'Wax':
    case 'Casting':
      return 'waxAvgWeightPerPiece';
    case 'Buff':
    case 'Zabora':
    case 'Dull':
      return 'metalAvgWeightPerPiece';
    case 'Chhol':
      return branch === 'gold' ? 'goldAvgWeightPerPiece' : 'plainAvgWeightPerPiece';
    case 'Plating':
      return 'goldAvgWeightPerPiece';
    case 'Ready Stock':
      return branch === 'gold' ? 'goldAvgWeightPerPiece' : 'plainAvgWeightPerPiece';
    default:
      return 'metalAvgWeightPerPiece';
  }
}

/**
 * Returns human-readable label for the weight type at the given stage.
 */
export function getStageWeightLabel(stage: Stage, branch: BranchType = 'none'): string {
  switch (stage) {
    case 'Wax':
      return 'Wax Avg Wt';
    case 'Casting':
      return 'Wax Baseline Wt';
    case 'Buff':
    case 'Zabora':
    case 'Dull':
      return 'Metal Avg Wt';
    case 'Chhol':
      return branch === 'gold' ? 'Gold Branch Wt' : 'Plain Branch Wt';
    case 'Plating':
      return 'Gold Avg Wt';
    case 'Ready Stock':
      return branch === 'gold' ? 'Ready Gold Wt' : 'Ready Plain Wt';
    default:
      return 'Avg Wt';
  }
}

/**
 * Returns the relevant weight-per-piece number for a design at a specific stage.
 */
export function getStageAvgWeight(
  design: Design | undefined,
  stage: Stage,
  branch: BranchType = 'none'
): number {
  if (!design) return 1.5;
  const key = getStageWeightKey(stage, branch);
  const val = design[key];
  if (typeof val === 'number' && !isNaN(val) && val > 0) {
    return val;
  }
  if (
    typeof (design as any).averageWeightPerPiece === 'number' &&
    !isNaN((design as any).averageWeightPerPiece) &&
    (design as any).averageWeightPerPiece > 0
  ) {
    return (design as any).averageWeightPerPiece;
  }
  return 1.5;
}

/**
 * Indicates whether piece estimation from weight is valid at this stage.
 * At Chhol, pieces are NOT estimated from weight because material is physically shaved/filed off.
 */
export function isWeightEstimationApplicable(stage: Stage): boolean {
  return stage !== 'Chhol';
}

/**
 * Returns the default calibration target to establish or update when completing this stage.
 * - Wax -> wax
 * - Casting -> metal (establishes metal average for the first time or recalibrates)
 * - Buff, Zabora, Dull -> metal
 * - Chhol -> plain or gold depending on chosen branch
 * - Plating -> gold
 */
export function getDefaultCalibrationTarget(
  stage: Stage,
  branch: BranchType = 'none'
): CalibrationTarget {
  switch (stage) {
    case 'Wax':
      return 'wax';
    case 'Casting':
      return 'metal';
    case 'Buff':
    case 'Zabora':
    case 'Dull':
      return 'metal';
    case 'Chhol':
      return branch === 'gold' ? 'gold' : 'plain';
    case 'Plating':
      return 'gold';
    default:
      return 'metal';
  }
}
