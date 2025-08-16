import type { GameState } from '../../types/GameState';
import { GREEDY, RANDOM } from '../ai/AiProfiles';
import type { AiProfile } from '../ai/AiTypes';
import { createPricingService } from '../pricing/PricingService';

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
 * Creates default AI profiles for testing.
 */
export function createDefaultAiProfiles(): Record<string, AiProfile> {
  return {
    greedy: GREEDY,
    random: RANDOM,
  };
}

/**
 * Creates default TurnController options for testing.
 */
export function createDefaultTurnControllerOptions() {
  return {
    goods: createMockGameState().goods,
    aiProfiles: createDefaultAiProfiles(),
    playerTownId: 'riverdale',
    pricingService: createPricingService(),
  };
}
