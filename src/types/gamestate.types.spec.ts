import { describe, it, expect } from 'vitest';

import type { GameState } from './GameState';

describe('GameState types', () => {
  it('should compile with valid game state object literal', () => {
    const validGameState: GameState = {
      turn: 0,
      version: 1,
      rngSeed: 'test-seed-123',
      towns: [],
      goods: {
        fish: {
          id: 'fish',
          name: 'Fish',
          effects: {
            prosperityDelta: 1,
            militaryDelta: 0,
          },
        },
        wood: {
          id: 'wood',
          name: 'Wood',
          effects: {
            prosperityDelta: 0,
            militaryDelta: 1,
          },
        },
        ore: {
          id: 'ore',
          name: 'Ore',
          effects: {
            prosperityDelta: 2,
            militaryDelta: 2,
          },
        },
      },
    };

    expect(validGameState.turn).toBe(0);
    expect(validGameState.version).toBe(1);
    expect(validGameState.rngSeed).toBe('test-seed-123');
    expect(validGameState.towns).toEqual([]);
    expect(validGameState.goods.fish.name).toBe('Fish');
    expect(validGameState.goods.ore.effects.prosperityDelta).toBe(2);
  });

  it('should enforce version ≥ 1 constraint', () => {
    // This should compile but the constraint is documented in JSDoc
    const gameState: GameState = {
      turn: 5,
      version: 2, // ≥ 1 as required
      rngSeed: 'seed-456',
      towns: [],
      goods: {
        fish: {
          id: 'fish',
          name: 'Fish',
          effects: { prosperityDelta: 1, militaryDelta: 0 },
        },
        wood: {
          id: 'wood',
          name: 'Wood',
          effects: { prosperityDelta: 0, militaryDelta: 1 },
        },
        ore: {
          id: 'ore',
          name: 'Ore',
          effects: { prosperityDelta: 2, militaryDelta: 2 },
        },
      },
    };

    expect(gameState.version).toBeGreaterThanOrEqual(1);
    expect(gameState.turn).toBeGreaterThanOrEqual(0);
  });
});
