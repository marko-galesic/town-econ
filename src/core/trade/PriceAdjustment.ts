import type { GameState } from '../../types/GameState';

import type { PriceModel } from './PriceModel';
import type { ValidatedTrade } from './TradeValidator';

/**
 * Applies post-trade price adjustments to both towns involved in a trade.
 *
 * This function determines the quantity delta from each town's perspective:
 * - Seller: inventory decreases → quantityDelta < 0 (price increases)
 * - Buyer: inventory increases → quantityDelta > 0 (price decreases)
 *
 * @param state - Current game state
 * @param vt - Validated trade that was executed
 * @param model - Price model to use for adjustments
 * @returns Updated game state with adjusted prices
 */
export function applyPostTradePricing(
  state: GameState,
  vt: ValidatedTrade,
  model: PriceModel,
): GameState {
  // Find the towns in the current state
  const fromTownIndex = state.towns.findIndex(town => town.id === vt.from.id);
  const toTownIndex = state.towns.findIndex(town => town.id === vt.to.id);

  if (fromTownIndex === -1 || toTownIndex === -1) {
    throw new Error('Town not found in current game state');
  }

  // Calculate quantity delta from each town's perspective
  let fromTownQuantityDelta: number;
  let toTownQuantityDelta: number;

  if (vt.side === 'sell') {
    // From town sells goods: inventory decreases
    fromTownQuantityDelta = -vt.qty;
    // To town buys goods: inventory increases
    toTownQuantityDelta = vt.qty;
  } else {
    // From town buys goods: inventory increases
    fromTownQuantityDelta = vt.qty;
    // To town sells goods: inventory decreases
    toTownQuantityDelta = -vt.qty;
  }

  // Apply price adjustments using the model
  const updatedFromTown = model.applyTrade(
    state.towns[fromTownIndex]!,
    vt.goodId,
    fromTownQuantityDelta,
  );
  const updatedToTown = model.applyTrade(state.towns[toTownIndex]!, vt.goodId, toTownQuantityDelta);

  // Create new towns array with updated towns
  const updatedTowns = [...state.towns];
  updatedTowns[fromTownIndex] = updatedFromTown;
  updatedTowns[toTownIndex] = updatedToTown;

  // Return new game state with updated towns
  return {
    ...state,
    towns: updatedTowns,
  };
}
