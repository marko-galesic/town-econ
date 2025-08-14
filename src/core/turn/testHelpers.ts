import type { GameState } from '../../types/GameState';
import { createSimpleLinearPriceModel } from '../trade/PriceModel';

/**
 * Creates a minimal mock game state for testing purposes.
 */
export function createMockGameState(): GameState {
  return {
    turn: 0,
    version: 1,
    rngSeed: 'test-seed',
    towns: [],
    goods: {
      fish: {
        id: 'fish',
        name: 'Fish',
        effects: { prosperityDelta: 2, militaryDelta: 1 },
      },
      wood: {
        id: 'wood',
        name: 'Wood',
        effects: { prosperityDelta: 1, militaryDelta: 2 },
      },
      ore: {
        id: 'ore',
        name: 'Ore',
        effects: { prosperityDelta: 3, militaryDelta: 3 },
      },
    },
  };
}

/**
 * Creates default TurnController options for testing.
 */
export function createDefaultTurnControllerOptions() {
  return {
    priceModel: createSimpleLinearPriceModel(),
    goods: createMockGameState().goods,
  };
}
