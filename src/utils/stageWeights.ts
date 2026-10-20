import { Stage, BranchType, Design } from '../types';

export type StageWeightKey =
  | 'waxAvgWeightPerPiece'
  | 'metalAvgWeightPerPiece'
  | 'buffAvgWeightPerPiece'
  | 'zaboraAvgWeightPerPiece';

export type CalibrationTarget = 'wax' | 'metal' | 'buff' | 'zabora';

/**
 * Returns which weight-per-piece field to use for estimating pieces / reference at a given stage.
 *
 * Stage Table:
 * - Wax: waxAvgWeightPerPiece
 * - Casting: metalAvgWeightPerPiece
 * - Buff: buffAvgWeightPerPiece
 * - Zabora, Dull, Chhol, Plating, Ready Stock: zaboraAvgWeightPerPiece
 */
export function getStageWeightKey(stage: Stage, branch: BranchType = 'none'): StageWeightKey {
  switch (stage) {
    case 'Wax':
      return 'waxAvgWeightPerPiece';
    case 'Casting':
      return 'metalAvgWeightPerPiece';
    case 'Buff':
      return 'buffAvgWeightPerPiece';
    case 'Zabora':
    case 'Dull':
    case 'Chhol':
    case 'Plating':
    case 'Ready Stock':
      return 'zaboraAvgWeightPerPiece';
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
      return 'Buff Avg Wt';
    case 'Zabora':
    case 'Dull':
      return 'Zabora Avg Wt';
    case 'Chhol':
      return 'Zabora Avg Wt';
    case 'Plating':
    case 'Ready Stock':
      return 'Zabora Avg Wt';
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
export function isWeightEstimationApplicable(stage?: Stage): boolean {
  return stage !== 'Chhol';
}

/**
 * Returns the default calibration target to establish or update when completing this stage.
 * - Wax -> wax
 * - Casting -> metal
 * - Buff -> buff
 * - Zabora -> zabora
 * - Dull, Chhol, Plating, Ready Stock -> zabora
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
      return 'buff';
    case 'Zabora':
      return 'zabora';
    case 'Dull':
    case 'Plating':
    case 'Chhol':
    default:
      return 'zabora';
  }
}
