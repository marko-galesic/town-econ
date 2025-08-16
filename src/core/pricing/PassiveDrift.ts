import type { GameState } from '../../types/GameState';
import type { GoodId } from '../../types/Goods';

import type { PriceCurveTable } from './Config';
import { applyProsperityAndScale } from './Multipliers';
import type { PriceMath } from './PriceCurve';
import { smoothPrice, DEFAULT_SMOOTH } from './Smoothing';

/**
 * Configuration options for passive price drift behavior.
 */
export interface DriftOptions {
  /** Rate of drift toward target price (0.0 to 1.0). Default 0.15 = 15% toward target per turn */
  rate?: number;
}

/**
 * Default drift configuration.
 */
export const DEFAULT_DRIFT: Required<DriftOptions> = { rate: 0.15 };

/**
 * Applies passive price drift to all towns and goods in the game state.
 *
 * For each town/good combination, computes the target price from the price curve
 * based on current stock levels, then moves the current price toward that target
 * by the specified drift rate.
 *
 * @param state - Current game state
 * @param tables - Price curve configuration tables
 * @param math - Price math implementation for computing target prices
 * @param opts - Drift configuration options (defaults to DEFAULT_DRIFT)
 * @returns New game state with updated prices
 */
export function applyPassiveDrift(
  state: GameState,
  tables: PriceCurveTable,
  math: PriceMath,
  opts: DriftOptions = DEFAULT_DRIFT,
): GameState {
  const rate = opts.rate ?? DEFAULT_DRIFT.rate!;

  // Validate rate is reasonable
  if (rate < 0 || rate > 1) {
    throw new Error(`Drift rate must be between 0 and 1, got ${rate}`);
  }

  // Create new towns array with updated prices
  const updatedTowns = state.towns.map(town => {
    const updatedPrices: Record<string, number> = {};

    // Process each good for this town
    for (const [goodId] of Object.entries(state.goods)) {
      const goodIdTyped = goodId as GoodId;
      const currentPrice = town.prices[goodIdTyped] ?? 0;
      const currentStock = town.resources[goodIdTyped] ?? 0;

      // Get price curve config for this good
      const curveConfig = tables[goodIdTyped];
      if (!curveConfig) {
        // No curve config, keep current price
        updatedPrices[goodIdTyped] = currentPrice;
        continue;
      }

      // Compute target price from current stock using price curve
      const targetPrice = math.nextPrice({ stock: currentStock, price: currentPrice }, curveConfig);

      // Apply EMA smoothing before drift adjustments
      const smoothedPrice = smoothPrice(currentPrice, targetPrice, DEFAULT_SMOOTH);

      // Apply drift: move smoothed price toward target by rate
      const priceDiff = targetPrice - smoothedPrice;
      const driftAmount = Math.round(rate * priceDiff);
      const newPrice = smoothedPrice + driftAmount;

      // Apply prosperity and scale multipliers to the drifted price
      const adjustedPrice = applyProsperityAndScale(
        newPrice,
        town.revealed.prosperityTier,
        undefined, // Use default multipliers
        1.0, // Default size factor
        curveConfig.minPrice ?? 1,
        curveConfig.maxPrice ?? 9999,
      );

      updatedPrices[goodIdTyped] = adjustedPrice;
    }

    // Return updated town with new prices
    return {
      ...town,
      prices: updatedPrices,
    };
  });

  // Return new game state with updated towns
  return {
    ...state,
    towns: updatedTowns,
  };
}
