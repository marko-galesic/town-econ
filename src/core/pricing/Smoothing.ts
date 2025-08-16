/**
 * Exponential Moving Average (EMA) smoothing for price adjustments.
 *
 * This module provides smoothing functionality to prevent large trades from
 * causing sudden price whipsaws by blending old and new prices.
 */

/**
 * Smoothing configuration with alpha parameter.
 *
 * @param alpha - Smoothing factor between 0.0 and 1.0
 *   - 0.0: No change (keep old price)
 *   - 1.0: Full instant change (use new price)
 *   - 0.5: Equal blend of old and new prices
 */
export interface Smoothing {
  alpha: number;
}

/**
 * Default smoothing configuration with moderate smoothing.
 *
 * Alpha of 0.5 means prices will move 50% toward the target each adjustment,
 * providing a balance between responsiveness and stability.
 */
export const DEFAULT_SMOOTH: Smoothing = { alpha: 0.5 };

/**
 * Applies exponential moving average smoothing to blend old and new prices.
 *
 * @param oldP - The current/old price
 * @param newP - The target/new price from the price curve
 * @param s - Smoothing configuration
 * @returns The smoothed price, rounded to nearest integer
 *
 * @example
 * ```typescript
 * const smoothed = smoothPrice(100, 120, { alpha: 0.5 });
 * // Result: 110 (50% blend of 100 and 120)
 *
 * const instant = smoothPrice(100, 120, { alpha: 1.0 });
 * // Result: 120 (full change to new price)
 *
 * const stable = smoothPrice(100, 120, { alpha: 0.0 });
 * // Result: 100 (no change, keep old price)
 * ```
 */
export function smoothPrice(oldP: number, newP: number, s: Smoothing): number {
  // Clamp alpha to valid range [0, 1]
  const alpha = Math.max(0, Math.min(1, s.alpha));

  // Apply EMA formula: smoothed = old * (1 - α) + new * α
  const smoothed = oldP * (1 - alpha) + newP * alpha;

  // Round to nearest integer for deterministic pricing
  return Math.round(smoothed);
}
