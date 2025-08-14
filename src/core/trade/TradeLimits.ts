/**
 * Configuration for trade limits to prevent runaway states.
 * These limits cap resources, treasury, and prices to maintain game balance.
 */
export interface TradeLimits {
  /** Maximum amount of any single resource a town can hold */
  maxResource?: number;
  /** Maximum treasury amount a town can hold */
  maxTreasury?: number;
  /** Minimum price for any good */
  minPrice?: number;
  /** Maximum price for any good */
  maxPrice?: number;
}

/**
 * Default trade limits that provide reasonable bounds for the game.
 * These values prevent runaway inflation/deflation while allowing meaningful gameplay.
 */
export const DEFAULT_LIMITS: TradeLimits = {
  maxResource: 1_000_000,
  maxTreasury: 1_000_000_000,
  minPrice: 1,
  maxPrice: 9999,
};

/**
 * Applies limits to a value, clamping it between min and max bounds.
 *
 * @param value - The value to clamp
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns The clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Applies trade limits to a resource value, ensuring it stays within bounds.
 *
 * @param value - The resource value to limit
 * @param limits - The trade limits to apply
 * @returns The limited resource value
 */
export function limitResource(value: number, limits: TradeLimits): number {
  if (limits.maxResource !== undefined) {
    return clamp(value, 0, limits.maxResource);
  }
  return Math.max(0, value); // Always prevent negative resources
}

/**
 * Applies trade limits to a treasury value, ensuring it stays within bounds.
 *
 * @param value - The treasury value to limit
 * @param limits - The trade limits to apply
 * @returns The limited treasury value
 */
export function limitTreasury(value: number, limits: TradeLimits): number {
  if (limits.maxTreasury !== undefined) {
    return clamp(value, 0, limits.maxTreasury);
  }
  return Math.max(0, value); // Always prevent negative treasury
}

/**
 * Applies trade limits to a price value, ensuring it stays within bounds.
 *
 * @param value - The price value to limit
 * @param limits - The trade limits to apply
 * @returns The limited price value
 */
export function limitPrice(value: number, limits: TradeLimits): number {
  const min = limits.minPrice ?? 0;
  const max = limits.maxPrice ?? Number.MAX_SAFE_INTEGER;
  return clamp(value, min, max);
}
