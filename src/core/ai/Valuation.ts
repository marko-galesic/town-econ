import type { GoodConfig, GoodId } from '../../types/Goods';

import type { AiProfile } from './AiTypes';

/**
 * Represents a trade quote with pricing and quantity information.
 */
export interface Quote {
  /** ID of the selling town */
  sellerId: string;
  /** ID of the buying town */
  buyerId: string;
  /** ID of the good being traded */
  goodId: GoodId;
  /** Unit price at which the good is being sold */
  unitSellPrice: number;
  /** Unit price at which the good is being bought */
  unitBuyPrice: number;
  /** Quantity of goods being traded */
  quantity: number;
}

/**
 * Scores a trade quote based on price spread and stat effects.
 *
 * The scoring formula is:
 * score = profile.weights.priceSpread * base + statBonus
 * where:
 * - base = (unitBuyPrice - unitSellPrice) * quantity
 * - statBonus = profile.weights.prosperity * prosperityDelta + profile.weights.military * militaryDelta
 *
 * @param q - The trade quote to score
 * @param goods - Record of good configurations
 * @param profile - AI profile with weights for decision making
 * @returns A numeric score where higher values indicate better trades
 */
export function scoreQuote(
  q: Quote,
  goods: Record<GoodId, GoodConfig>,
  profile: AiProfile
): number {
  // Base score from price spread
  const base = (q.unitBuyPrice - q.unitSellPrice) * q.quantity;

  // Stat bonus from good effects
  const effects = goods[q.goodId].effects;
  const statBonus = profile.weights.prosperity * effects.prosperityDelta +
                   profile.weights.military * effects.militaryDelta;

  // Final weighted score
  return profile.weights.priceSpread * base + statBonus;
}
