import type { AiProfile } from './AiTypes';

/**
 * Random AI profile - makes decisions with balanced weights across all criteria.
 * Suitable for unpredictable gameplay and testing.
 */
export const RANDOM: AiProfile = {
  id: 'random',
  mode: 'random',
  weights: {
    priceSpread: 0.5,
    prosperity: 0.25,
    military: 0.25,
  },
  maxTradesPerTurn: 1,
  maxQuantityPerTrade: 5,
};

/**
 * Greedy AI profile - heavily favors price spread and prosperity over military.
 * Focuses on economic gains and wealth accumulation.
 */
export const GREEDY: AiProfile = {
  id: 'greedy',
  mode: 'greedy',
  weights: {
    priceSpread: 0.8,
    prosperity: 0.15,
    military: 0.05,
  },
  maxTradesPerTurn: 1,
  maxQuantityPerTrade: 5,
};
