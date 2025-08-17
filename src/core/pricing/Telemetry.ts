import type { GoodId } from '../../types/Goods';
import type { ProsperityTier } from '../../types/Tiers';

/**
 * Telemetry data for price changes to enable explainability in UI/QA.
 * Captures the inputs and components that led to a price change.
 */
export interface PriceChangeTrace {
  /** ID of the town where the price change occurred */
  townId: string;

  /** ID of the good whose price changed */
  goodId: GoodId;

  /** Previous price before the change */
  oldPrice: number;

  /** Target price from the price curve calculation */
  curvePrice: number;

  /** Price after smoothing was applied */
  smoothed: number;

  /** Final price after all adjustments (prosperity, scaling, clamping) */
  final: number;

  /** Current stock level of the good in the town */
  stock: number;

  /** Target stock level from the price curve configuration */
  target: number;

  /** Elasticity factor from the price curve configuration */
  elasticity: number;

  /** Town's prosperity tier */
  prosperityTier: ProsperityTier;

  /** Prosperity multiplier factor applied to the price */
  prosperityFactor: number;

  /** What caused this price change */
  cause: 'post-trade' | 'drift';
}

/**
 * Optional callback function for price change telemetry.
 * Called whenever a price changes with detailed trace information.
 */

export type PriceChangeTracer = (trace: PriceChangeTrace) => void;
