import type { GoodId } from './Goods';

/**
 * Production rates for goods per turn.
 * Each good ID maps to the number of units produced per turn.
 */
export type ProductionRates = Record<GoodId, number>;

/**
 * Town-specific production multipliers for goods.
 * Each good ID maps to a multiplier (e.g., 1.0, 1.25, 0.8).
 */
export type TownProductionMultiplier = Partial<Record<GoodId, number>>;

/**
 * Configuration for production variance (jitter).
 */
export interface ProductionVariance {
  /** Whether variance is enabled */
  enabled: boolean;
  /** Magnitude of variance (defaults to 1 if not specified) */
  magnitude?: 1 | 2;
}

/**
 * Configuration for the production system.
 */
export interface ProductionConfig {
  /** Base production rates for all goods */
  base: ProductionRates;
  /** Town-specific production multipliers, keyed by town ID */
  townMultipliers?: Record<string, TownProductionMultiplier>;
  /** Optional per-good production caps (for future use) */
  maxPerGood?: Partial<ProductionRates>;
  /** Optional global maximum resource cap for all goods */
  globalMaxResource?: number;
  /** Optional production variance configuration */
  variance?: ProductionVariance;
}
