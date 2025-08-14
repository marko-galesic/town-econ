import type { GoodId } from '../../types/Goods';
import type { Town } from '../../types/Town';

import type { TradeLimits } from './TradeLimits';

/**
 * Interface for price models that can quote prices and adjust them based on trades.
 *
 * Price models implement supply/demand dynamics by adjusting prices when
 * goods are bought or sold from a town's inventory.
 */
export interface PriceModel {
  /**
   * Get the current price for a good in a town.
   *
   * @param town - The town to get the price from
   * @param good - The good to get the price for
   * @returns The current price per unit of the good
   */
  // eslint-disable-next-line no-unused-vars
  quote(town: Town, good: GoodId): number;

  /**
   * Apply a trade and return an updated town with adjusted prices.
   *
   * @param town - The town to update
   * @param good - The good that was traded
   * @param quantityDelta - The change in inventory (negative = sold, positive = bought)
   * @returns A new town instance with updated prices
   */
  // eslint-disable-next-line no-unused-vars
  applyTrade(town: Town, good: GoodId, quantityDelta: number): Town;
}

/**
 * Options for configuring a simple linear price model.
 */
export interface SimpleLinearPriceModelOptions {
  /** The base step size for price adjustments (default: 1) */
  baseStep?: number;
  /** Trade limits to apply to prices (optional, uses internal min/max if not provided) */
  limits?: TradeLimits;
  /** Minimum allowed price (default: 0, overridden by limits.minPrice if provided) */
  min?: number;
  /** Maximum allowed price (default: 100, overridden by limits.maxPrice if provided) */
  max?: number;
}

/**
 * Creates a simple linear price model that adjusts prices based on supply/demand.
 *
 * This model implements basic supply/demand dynamics:
 * - When goods are sold from a town (quantityDelta < 0), price increases
 * - When goods are bought by a town (quantityDelta > 0), price decreases
 * - Price changes are clamped between min and max values
 *
 * @param opts - Configuration options for the price model
 * @returns A configured PriceModel instance
 */
export function createSimpleLinearPriceModel(opts: SimpleLinearPriceModelOptions = {}): PriceModel {
  const { baseStep = 1, limits, min = 0, max = 100 } = opts;

  // Use limits if provided, otherwise fall back to local min/max
  const effectiveMin = limits?.minPrice ?? min;
  const effectiveMax = limits?.maxPrice ?? max;

  return {
    quote(town: Town, good: GoodId): number {
      return town.prices[good];
    },

    applyTrade(town: Town, good: GoodId, quantityDelta: number): Town {
      if (quantityDelta === 0) {
        // No change in inventory, return town unchanged
        return town;
      }

      const currentPrice = town.prices[good];
      let newPrice: number;

      if (quantityDelta < 0) {
        // Goods sold from town (demand increased), price goes up
        newPrice = currentPrice + baseStep;
      } else {
        // Goods bought by town (supply increased), price goes down
        newPrice = currentPrice - baseStep;
      }

      // Clamp price between effective min and max
      newPrice = Math.max(effectiveMin, Math.min(effectiveMax, newPrice));

      // Return new town instance with updated prices
      return {
        ...town,
        prices: {
          ...town.prices,
          [good]: newPrice,
        },
      };
    },
  };
}
