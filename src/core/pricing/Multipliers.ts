import type { ProsperityTier } from '../../types/Tiers';

/**
 * Represents town size information for scaling calculations.
 * Default size is 1.0, future implementations may derive this from town metadata.
 */
export interface TownScale {
  /** Town size factor (default 1.0) */
  size?: number;
}

/**
 * Multipliers for each prosperity tier to adjust prices.
 * Higher prosperity allows for higher prices, lower prosperity pushes prices down.
 */
export interface ProsperityMultipliers {
  /** Struggling towns get 10% price reduction */
  struggling: number;
  /** Modest towns get no price adjustment */
  modest: number;
  /** Prosperous towns get 10% price increase */
  prosperous: number;
  /** Opulent towns get 20% price increase */
  opulent: number;
}

/**
 * Default prosperity multipliers that create a balanced economy.
 * Struggling towns have lower prices, opulent towns have higher prices.
 */
export const DEFAULT_PROSPERITY_MULT: ProsperityMultipliers = {
  struggling: 0.9,
  modest: 1.0,
  prosperous: 1.1,
  opulent: 1.2,
};

/**
 * Applies prosperity and town size multipliers to a price.
 *
 * Formula: p'' = clamp( round( p' * prosperityFactor * sizeFactor ), min, max )
 *
 * @param price - The base price to adjust
 * @param prosperityTier - The town's prosperity tier
 * @param mult - Prosperity multipliers (defaults to DEFAULT_PROSPERITY_MULT)
 * @param sizeFactor - Town size factor (defaults to 1.0)
 * @param min - Minimum allowed price (defaults to 1)
 * @param max - Maximum allowed price (defaults to 9999)
 * @returns The adjusted and clamped price
 */
export function applyProsperityAndScale(
  price: number,
  prosperityTier: ProsperityTier,
  mult: ProsperityMultipliers = DEFAULT_PROSPERITY_MULT,
  sizeFactor = 1.0,
  min = 1,
  max = 9999,
): number {
  // Get the prosperity multiplier for this tier
  const prosperityFactor = mult[prosperityTier];

  // Apply both multipliers
  const adjustedPrice = price * prosperityFactor * sizeFactor;

  // Round to nearest integer
  const roundedPrice = Math.round(adjustedPrice);

  // Clamp to valid range
  return Math.max(min, Math.min(max, roundedPrice));
}
