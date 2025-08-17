import type { GameState } from '../../types/GameState';
import type { GoodId } from '../../types/Goods';
import type { MilitaryTier, ProsperityTier } from '../../types/Tiers';

import { GOOD_ORDER } from './constants';
import { formatCurrency, labelProsperity, labelMilitary } from './format';

/**
 * Represents a price entry for a good in a town.
 */
export interface PriceEntry {
  /** The good identifier */
  goodId: GoodId;
  /** The price value as a number */
  value: number;
  /** The formatted price text */
  text: string;
}

/**
 * View model for a town, containing display-safe data for rendering.
 */
export interface TownViewModel {
  /** The town's unique identifier */
  id: string;
  /** The town's display name */
  name: string;
  /** Array of price entries sorted by good order */
  prices: PriceEntry[];
  /** Prosperity tier information with display text */
  prosperity: {
    tier: ProsperityTier;
    text: string;
  };
  /** Military tier information with display text */
  military: {
    tier: MilitaryTier;
    text: string;
  };
}

/**
 * Selects and transforms a town from GameState into a TownViewModel.
 *
 * @param state - The current game state
 * @param townId - The ID of the town to select
 * @returns A TownViewModel for the specified town
 * @throws Error if the town ID is not found
 */
export function selectTownVM(state: GameState, townId: string): TownViewModel {
  const town = state.towns.find(t => t.id === townId);

  if (!town) {
    throw new Error(`Town with ID "${townId}" not found in game state`);
  }

  // Create price entries in stable order
  const prices: PriceEntry[] = GOOD_ORDER.map(goodId => ({
    goodId,
    value: town.prices[goodId],
    text: formatCurrency(town.prices[goodId]),
  }));

  return {
    id: town.id,
    name: town.name,
    prices,
    prosperity: {
      tier: town.revealed.prosperityTier,
      text: labelProsperity(town.revealed.prosperityTier),
    },
    military: {
      tier: town.revealed.militaryTier,
      text: labelMilitary(town.revealed.militaryTier),
    },
  };
}
