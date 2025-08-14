import type { GameState } from '../../types/GameState';

import { clampRaw } from './TierMap';

/**
 * Configuration rules for raw stat updates
 */
export interface RawStatRules {
  /** Amount of prosperity decay per turn (default: 1) */
  prosperityDecayPerTurn?: number;
  /** Amount of military decay per turn (default: 0) */
  militaryDecayPerTurn?: number;
  /** Maximum raw stat value (default: 100) */
  maxRaw?: number;
}

/**
 * Default rules for raw stat updates
 */
export const DEFAULT_RAW_RULES: RawStatRules = {
  prosperityDecayPerTurn: 1,
  militaryDecayPerTurn: 0,
  maxRaw: 100,
};

/**
 * Applies raw stat turn updates to all towns in the game state
 *
 * @param state - The current game state
 * @param rules - Configuration rules for stat updates (uses defaults if not provided)
 * @returns A new game state with updated raw stats (immutable)
 */
export function applyRawStatTurn(
  state: GameState,
  rules: RawStatRules = DEFAULT_RAW_RULES,
): GameState {
  const {
    prosperityDecayPerTurn = DEFAULT_RAW_RULES.prosperityDecayPerTurn!,
    militaryDecayPerTurn = DEFAULT_RAW_RULES.militaryDecayPerTurn!,
    maxRaw = DEFAULT_RAW_RULES.maxRaw!,
  } = rules;

  // Create new towns array with updated raw stats
  const updatedTowns = state.towns.map(town => ({
    ...town,
    prosperityRaw: clampRaw(town.prosperityRaw - prosperityDecayPerTurn, 0, maxRaw),
    militaryRaw: clampRaw(town.militaryRaw - militaryDecayPerTurn, 0, maxRaw),
  }));

  // Return new state with updated towns
  return {
    ...state,
    towns: updatedTowns,
  };
}
