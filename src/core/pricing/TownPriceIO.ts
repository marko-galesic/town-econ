import type { GoodId } from '../../types/Goods';
import type { Town } from '../../types/Town';

import type { TownPriceState } from './PriceCurve';

/**
 * Pure helper to extract the current price state for a specific good in a town.
 *
 * @param town - The town to read from
 * @param good - The good identifier to read
 * @returns Current stock and price for the specified good
 */
export function readTownPriceState(town: Town, good: GoodId): TownPriceState {
  return {
    stock: town.resources[good],
    price: town.prices[good],
  };
}

/**
 * Pure helper to update a town's price for a specific good immutably.
 *
 * @param town - The town to update
 * @param good - The good identifier to update
 * @param newPrice - The new price value
 * @returns New town object with updated price (clamped to minimum 1)
 */
export function writeTownPrice(town: Town, good: GoodId, newPrice: number): Town {
  // Immutable copy; clamp ≥1
  const p = Math.max(1, Math.trunc(newPrice));
  return {
    ...town,
    prices: {
      ...town.prices,
      [good]: p,
    },
  };
}
