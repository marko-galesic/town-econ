import { describe, it, expect } from 'vitest';

import type { GameState } from '../types/GameState';

import { serializeGameState } from './serialize';

describe('serializeGameState', () => {
  it('returns a string', () => {
    const mockGameState: GameState = {
      turn: 0,
      version: 1,
      rngSeed: 'abc123',
      towns: [],
      goods: {
        fish: {
          id: 'fish',
          name: 'Fish',
          effects: {
            prosperityDelta: 1,
            militaryDelta: 0
          }
        },
        wood: {
          id: 'wood',
          name: 'Wood',
          effects: {
            prosperityDelta: 0,
            militaryDelta: 1
          }
        },
        ore: {
          id: 'ore',
          name: 'Ore',
          effects: {
            prosperityDelta: 2,
            militaryDelta: 2
          }
        }
      }
    };

    const result = serializeGameState(mockGameState);
    expect(typeof result).toBe('string');
  });

  it('JSON.parse yields object with expected root keys', () => {
    const mockGameState: GameState = {
      turn: 5,
      version: 2,
      rngSeed: 'def456',
      towns: [
        {
          id: 'town1',
          name: 'Test Town',
          resources: { fish: 10, wood: 5, ore: 3 },
          prices: { fish: 2, wood: 1, ore: 4 },
          militaryRaw: 15,
          prosperityRaw: 20,
          revealed: {
            militaryTier: 'strong',
            prosperityTier: 'prosperous',
            lastUpdatedTurn: 5
          }
        }
      ],
      goods: {
        fish: {
          id: 'fish',
          name: 'Fish',
          effects: {
            prosperityDelta: 1,
            militaryDelta: 0
          }
        },
        wood: {
          id: 'wood',
          name: 'Wood',
          effects: {
            prosperityDelta: 0,
            militaryDelta: 1
          }
        },
        ore: {
          id: 'ore',
          name: 'Ore',
          effects: {
            prosperityDelta: 2,
            militaryDelta: 2
          }
        }
      }
    };

    const serialized = serializeGameState(mockGameState);
    const parsed = JSON.parse(serialized);

    // Check that all expected root keys exist
    expect(parsed).toHaveProperty('turn');
    expect(parsed).toHaveProperty('version');
    expect(parsed).toHaveProperty('rngSeed');
    expect(parsed).toHaveProperty('towns');
    expect(parsed).toHaveProperty('goods');

    // Verify the values match the original
    expect(parsed.turn).toBe(5);
    expect(parsed.version).toBe(2);
    expect(parsed.rngSeed).toBe('def456');
    expect(Array.isArray(parsed.towns)).toBe(true);
    expect(typeof parsed.goods).toBe('object');
  });
});
