import type { GameState } from '../../types/GameState';
import type { ValidatedTrade } from '../trade/TradeValidator';

import type { PriceCurveTable } from './Config';
import { applyProsperityAndScale } from './Multipliers';
import type { PriceMath } from './PriceCurve';
import { smoothPrice, DEFAULT_SMOOTH } from './Smoothing';
import { readTownPriceState, writeTownPrice } from './TownPriceIO';

/**
 * Helper function to find a town by ID in the game state
 */
function findTown(state: GameState, townId: string) {
  const town = state.towns.find(t => t.id === townId);
  if (!town) {
    throw new Error(`Town with ID '${townId}' not found`);
  }
  return town;
}

/**
 * Helper function to update multiple towns in the game state
 */
function withTownsUpdated(state: GameState, updatedTowns: GameState['towns']): GameState {
  return {
    ...state,
    towns: updatedTowns,
  };
}

/**
 * Applies post-trade price adjustments using curve-based pricing.
 *
 * This function reads the current stock levels (which have already been updated
 * by the trade executor) and applies the appropriate price curves to both towns.
 *
 * @param state - Current game state
 * @param vt - Validated trade that was executed
 * @param tables - Price curve configuration tables
 * @param math - Price math implementation for computing next prices
 * @returns Updated game state with adjusted prices
 */
export function applyPostTradeCurve(
  state: GameState,
  vt: ValidatedTrade,
  tables: PriceCurveTable,
  math: PriceMath,
): GameState {
  const { goodId, from, to } = vt;

  // Get the price curve configuration for this good
  const cfg = tables[goodId];
  if (!cfg) {
    throw new Error(`No price curve configuration found for good: ${goodId}`);
  }

  // Read current price states for both towns (stock already updated by executor)
  const t1State = readTownPriceState(findTown(state, from.id), goodId);
  const t2State = readTownPriceState(findTown(state, to.id), goodId);

  // Compute next prices using the curve-based math
  const next1 = math.nextPrice(t1State, cfg);
  const next2 = math.nextPrice(t2State, cfg);

  // Apply EMA smoothing before prosperity/scale adjustments
  const smoothed1 = smoothPrice(t1State.price, next1, DEFAULT_SMOOTH);
  const smoothed2 = smoothPrice(t2State.price, next2, DEFAULT_SMOOTH);

  // Apply prosperity and scale multipliers to both smoothed prices
  const adjusted1 = applyProsperityAndScale(
    smoothed1,
    findTown(state, from.id).revealed.prosperityTier,
    undefined, // Use default multipliers
    1.0, // Default size factor
    cfg.minPrice ?? 1,
    cfg.maxPrice ?? 9999,
  );

  const adjusted2 = applyProsperityAndScale(
    smoothed2,
    findTown(state, to.id).revealed.prosperityTier,
    undefined, // Use default multipliers
    1.0, // Default size factor
    cfg.minPrice ?? 1,
    cfg.maxPrice ?? 9999,
  );

  // Update both towns with adjusted prices
  const updatedTowns = state.towns.map(town => {
    if (town.id === from.id) {
      return writeTownPrice(town, goodId, adjusted1);
    }
    if (town.id === to.id) {
      return writeTownPrice(town, goodId, adjusted2);
    }
    return town;
  });

  return withTownsUpdated(state, updatedTowns);
}
