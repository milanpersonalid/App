import { Stage, BranchType, Design } from '../types';

export type StageWeightKey =
  | 'waxAvgWeightPerPiece'
  | 'metalAvgWeightPerPiece';

export type CalibrationTarget = 'wax' | 'metal';

/**
 * Returns which weight-per-piece field to use for estimating pieces / reference at a given stage.
 *
 * Stage Table:
 * - Wax: waxAvgWeightPerPiece
 * - Casting: metalAvgWeightPerPiece
 * - Buff, Zabora, Dull: metalAvgWeightPerPiece
 * - Chhol and Plating use the shared metal ruler; the branch affects routing, not calibration.
 * - Ready Stock uses the same metal ruler for piece estimation.
 */
export function getStageWeightKey(stage: Stage, branch: BranchType = 'none'): StageWeightKey {
  switch (stage) {
    case 'Wax':
      return 'waxAvgWeightPerPiece';
    case 'Casting':
      return 'metalAvgWeightPerPiece';
    case 'Buff':
    case 'Zabora':
    case 'Dull':
    case 'Chhol':
    case 'Plating':
    case 'Ready Stock':
      return 'metalAvgWeightPerPiece';
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
      return 'Metal Avg Wt';
    case 'Buff':
    case 'Zabora':
    case 'Dull':
      return 'Metal Avg Wt';
    case 'Chhol':
      return 'Metal Avg Wt';
    case 'Plating':
      return 'Metal Avg Wt';
    case 'Ready Stock':
      return 'Metal Avg Wt';
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
 * Checks whether the specific ruler for a design at a given stage/branch is already established (> 0).
 */
export function isStageRulerSet(
  design: Design | undefined,
  stage: Stage,
  branch: BranchType = 'none'
): boolean {
  if (!design) return false;
  const key = getStageWeightKey(stage, branch);
  const val = design[key];
  return typeof val === 'number' && !isNaN(val) && val > 0;
}

/**
 * Indicates whether piece estimation from weight is valid.
 * At every stage in the factory, the piece count is calculated automatically:
 * estimated pieces = weight entered ÷ stage ruler.
 */
export function isWeightEstimationApplicable(_stage?: Stage): boolean {
  return true;
}

/**
 * Returns the default calibration target to establish or update when completing this stage.
 * - Wax -> wax
 * - Casting -> metal (establishes metal average for the first time or recalibrates)
 * - Buff, Zabora, Dull -> metal
 * - Chhol and Plating -> metal
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
    case 'Plating':
    case 'Chhol':
    default:
      return 'metal';
  }
}
