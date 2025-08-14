import type { GameState } from '../../types/GameState';
import type { GoodId, GoodConfig } from '../../types/Goods';
import type { Town } from '../../types/Town';
import { incResource, addProsperity, addMilitary } from '../stateApi';

import type { TradeResult } from './TradeTypes';
import type { ValidatedTrade } from './TradeValidator';

/**
 * Executes a validated trade by moving goods, currency, and applying effects.
 *
 * @param state - Current game state
 * @param vt - Validated trade to execute
 * @param goods - Configuration for all goods in the game
 * @returns TradeResult with updated state and deltas
 */
export function executeTrade(
  state: GameState,
  vt: ValidatedTrade,
  goods: Record<GoodId, GoodConfig>,
): TradeResult {
  // Clone state (immutable approach)
  const newState: GameState = {
    ...state,
    towns: [...state.towns],
  };

  // Find town indices for updating
  const fromTownIndex = newState.towns.findIndex(town => town.id === vt.from.id);
  const toTownIndex = newState.towns.findIndex(town => town.id === vt.to.id);

  if (fromTownIndex === -1 || toTownIndex === -1) {
    throw new Error('Town not found in state during trade execution');
  }

  // Compute total cost
  const total = vt.qty * vt.unitPrice;

  // Clone towns for immutable updates
  let fromTown: Town = { ...newState.towns[fromTownIndex]! };
  let toTown: Town = { ...newState.towns[toTownIndex]! };

  // Execute trade based on side
  if (vt.side === 'sell') {
    // Sell: fromTown sells to toTown
    // Move goods
    fromTown = { ...fromTown, ...incResource(fromTown, vt.goodId, -vt.qty) };
    toTown = { ...toTown, ...incResource(toTown, vt.goodId, vt.qty) };

    // Move currency
    fromTown.treasury += total;
    toTown.treasury -= total;
  } else {
    // Buy: fromTown buys from toTown
    // Move goods
    fromTown = { ...fromTown, ...incResource(fromTown, vt.goodId, vt.qty) };
    toTown = { ...toTown, ...incResource(toTown, vt.goodId, -vt.qty) };

    // Move currency
    fromTown.treasury -= total;
    toTown.treasury += total;
  }

  // Apply effects
  const goodConfig = goods[vt.goodId];
  const effects = goodConfig.effects;

  // Both towns get prosperity boost from trade (trade stimulates both)
  fromTown = { ...fromTown, ...addProsperity(fromTown, effects.prosperityDelta) };
  toTown = { ...toTown, ...addProsperity(toTown, effects.prosperityDelta) };

  // Only buyer gets military boost (buyer-only for gameplay leverage)
  if (vt.side === 'buy') {
    fromTown = { ...fromTown, ...addMilitary(fromTown, effects.militaryDelta) };
  } else {
    toTown = { ...toTown, ...addMilitary(toTown, effects.militaryDelta) };
  }

  // Update towns in state
  newState.towns[fromTownIndex] = fromTown;
  newState.towns[toTownIndex] = toTown;

  // Calculate deltas for return
  const deltas = {
    from: {
      resources: fromTown.resources,
      treasury: fromTown.treasury,
      prosperityRaw: fromTown.prosperityRaw,
      militaryRaw: fromTown.militaryRaw,
    } as Partial<Town>,
    to: {
      resources: toTown.resources,
      treasury: toTown.treasury,
      prosperityRaw: toTown.prosperityRaw,
      militaryRaw: toTown.militaryRaw,
    } as Partial<Town>,
  };

  return {
    state: newState,
    deltas,
    unitPriceApplied: vt.unitPrice,
  };
}
