import type { GoodConfig, GoodId } from '../../types/Goods';

import type { MarketSnapshot } from './Market';
import type { Quote } from './Valuation';

/**
 * Options for generating trade candidates.
 */
export interface CandidateOptions {
  /** Maximum quantity that can be traded in a single transaction */
  maxQuantityPerTrade: number;
}

/**
 * Generates feasible trade candidates from a market snapshot.
 *
 * For each ordered pair of towns (A != B) and each good:
 * - Skips trades where priceA >= priceB (no profit direction A→B)
 * - Respects seller's available stock
 * - Respects buyer's available treasury
 * - Caps quantity at maxQuantityPerTrade
 *
 * @param market - Current market snapshot
 * @param goods - Configuration for all goods
 * @param opts - Options for candidate generation
 * @returns Array of feasible trade quotes
 */
export function generateCandidates(
  market: MarketSnapshot,
  goods: Record<GoodId, GoodConfig>,
  opts: CandidateOptions,
): Quote[] {
  const candidates: Quote[] = [];

  // For each ordered pair of towns (A != B)
  for (let i = 0; i < market.towns.length; i++) {
    for (let j = 0; j < market.towns.length; j++) {
      if (i === j) continue; // Skip same town

      const seller = market.towns[i];
      const buyer = market.towns[j];

      // TypeScript safety check - these should never be undefined in this loop
      if (!seller || !buyer) continue;

      // For each good
      for (const goodId of Object.keys(goods) as GoodId[]) {
        const priceA = seller.prices[goodId];
        const priceB = buyer.prices[goodId];

        // Skip if no profit direction A→B
        if (priceA >= priceB) continue;

        // Calculate maximum quantity constraints
        const maxQtyByStock = seller.stock[goodId];
        const maxQtyByBuyerCash = Math.floor(buyer.treasury / priceA); // buyer pays seller's unit price

        // Determine feasible quantity
        const qty = Math.min(opts.maxQuantityPerTrade, maxQtyByStock, maxQtyByBuyerCash);

        // Only add candidate if quantity > 0
        if (qty > 0) {
          candidates.push({
            sellerId: seller.id,
            buyerId: buyer.id,
            goodId,
            unitSellPrice: priceA,
            unitBuyPrice: priceB,
            quantity: qty,
          });
        }
      }
    }
  }

  return candidates;
}
