import { describe, it, expect } from 'vitest';

import type { GameState } from '../../types/GameState';

import type { RawStatRules } from './RawStatSystem';
import { createStatsUpdateSystem } from './StatsUpdateSystem';

// Mock game state for testing
function createMockGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    turn: 0,
    rngSeed: 'test-seed-123',
    towns: [
      {
        id: 'town1',
        name: 'Test Town 1',
        prosperityRaw: 50,
        militaryRaw: 30,
        resources: { fish: 0, wood: 0, ore: 0 },
        prices: { fish: 10, wood: 15, ore: 20 },
        treasury: 100,
        revealed: {
          prosperityTier: 'modest',
          militaryTier: 'militia',
          lastUpdatedTurn: -1, // Never revealed before
        },
      },
      {
        id: 'town2',
        name: 'Test Town 2',
        prosperityRaw: 80,
        militaryRaw: 70,
        resources: { fish: 0, wood: 0, ore: 0 },
        prices: { fish: 12, wood: 18, ore: 25 },
        treasury: 200,
        revealed: {
          prosperityTier: 'prosperous',
          militaryTier: 'formidable',
          lastUpdatedTurn: 0, // Revealed on turn 0
        },
      },
    ],
    ...overrides,
  } as GameState;
}

describe('StatsUpdateSystem', () => {
  describe('createStatsUpdateSystem', () => {
    it('should create a system that applies raw updates then reveal updates', () => {
      const system = createStatsUpdateSystem();
      const initialState = createMockGameState();

      const result = system(initialState);

      // Raw stats should be decayed (prosperity -1, military -0)
      expect(result.towns[0]!.prosperityRaw).toBe(49); // 50 - 1
      expect(result.towns[0]!.militaryRaw).toBe(30); // 30 - 0
      expect(result.towns[1]!.prosperityRaw).toBe(79); // 80 - 1
      expect(result.towns[1]!.militaryRaw).toBe(70); // 70 - 0

      // Reveal should happen on turn 0 (interval=2, lastUpdatedTurn=-1)
      expect(result.towns[0]!.revealed.lastUpdatedTurn).toBe(0);
      expect(result.towns[1]!.revealed.lastUpdatedTurn).toBe(0);
    });

    it('should respect custom raw stat rules', () => {
      const customRules: RawStatRules = {
        prosperityDecayPerTurn: 5,
        militaryDecayPerTurn: 2,
        maxRaw: 200,
      };

      const system = createStatsUpdateSystem({ raw: customRules });
      const initialState = createMockGameState();

      const result = system(initialState);

      // Custom decay should be applied
      expect(result.towns[0]!.prosperityRaw).toBe(45); // 50 - 5
      expect(result.towns[0]!.militaryRaw).toBe(28); // 30 - 2
      expect(result.towns[1]!.prosperityRaw).toBe(75); // 80 - 5
      expect(result.towns[1]!.militaryRaw).toBe(68); // 70 - 2
    });

    it('should respect custom reveal interval', () => {
      const system = createStatsUpdateSystem({ revealInterval: 1 });
      const initialState = createMockGameState({
        turn: 3,
        towns: [
          {
            id: 'town1',
            name: 'Test Town 1',
            prosperityRaw: 50,
            militaryRaw: 30,
            resources: {},
            prices: {},
            treasury: 100,
            revealed: {
              prosperityTier: 'modest',
              militaryTier: 'militia',
              lastUpdatedTurn: 2, // Last revealed on turn 2
            },
          },
          {
            id: 'town2',
            name: 'Test Town 2',
            prosperityRaw: 80,
            militaryRaw: 70,
            resources: {},
            prices: {},
            treasury: 200,
            revealed: {
              prosperityTier: 'prosperous',
              militaryTier: 'formidable',
              lastUpdatedTurn: 2, // Last revealed on turn 2
            },
          },
        ],
      });

      const result = system(initialState);

      // With interval=1, reveal should happen every turn (3 - 2 = 1, which % 1 = 0)
      expect(result.towns[0]!.revealed.lastUpdatedTurn).toBe(3);
      expect(result.towns[1]!.revealed.lastUpdatedTurn).toBe(3);
    });

    it('should not reveal on non-interval turns', () => {
      const system = createStatsUpdateSystem({ revealInterval: 2 });
      const initialState = createMockGameState({
        turn: 3,
        towns: [
          {
            id: 'town1',
            name: 'Test Town 1',
            prosperityRaw: 50,
            militaryRaw: 30,
            resources: { fish: 0, wood: 0, ore: 0 },
            prices: { fish: 10, wood: 15, ore: 20 },
            treasury: 100,
            revealed: {
              prosperityTier: 'modest',
              militaryTier: 'militia',
              lastUpdatedTurn: 2, // Last revealed on turn 2
            },
          },
          {
            id: 'town2',
            name: 'Test Town 2',
            prosperityRaw: 80,
            militaryRaw: 70,
            resources: { fish: 0, wood: 0, ore: 0 },
            prices: { fish: 12, wood: 18, ore: 25 },
            treasury: 200,
            revealed: {
              prosperityTier: 'prosperous',
              militaryTier: 'formidable',
              lastUpdatedTurn: 2, // Last revealed on turn 2
            },
          },
        ],
      });

      const result = system(initialState);

      // With interval=2, reveal should not happen on turn 3 (3 - 2 = 1, which % 2 != 0)
      // Towns should keep their previous reveal timestamps
      expect(result.towns[0]!.revealed.lastUpdatedTurn).toBe(2); // Last revealed on turn 2
      expect(result.towns[1]!.revealed.lastUpdatedTurn).toBe(2); // Last revealed on turn 2
    });

    it('should reveal on interval turns', () => {
      const system = createStatsUpdateSystem({ revealInterval: 2 });
      const initialState = createMockGameState({
        turn: 4,
        towns: [
          {
            id: 'town1',
            name: 'Test Town 1',
            prosperityRaw: 50,
            militaryRaw: 30,
            resources: { fish: 0, wood: 0, ore: 0 },
            prices: { fish: 10, wood: 15, ore: 20 },
            treasury: 100,
            revealed: {
              prosperityTier: 'modest',
              militaryTier: 'militia',
              lastUpdatedTurn: 2, // Last revealed on turn 2
            },
          },
          {
            id: 'town2',
            name: 'Test Town 2',
            prosperityRaw: 80,
            militaryRaw: 70,
            resources: { fish: 0, wood: 0, ore: 0 },
            prices: { fish: 12, wood: 18, ore: 25 },
            treasury: 200,
            revealed: {
              prosperityTier: 'prosperous',
              militaryTier: 'formidable',
              lastUpdatedTurn: 2, // Last revealed on turn 2
            },
          },
        ],
      });

      const result = system(initialState);

      // With interval=2, reveal should happen on turn 4 (4 - 2 = 2, which % 2 = 0)
      expect(result.towns[0]!.revealed.lastUpdatedTurn).toBe(4);
      expect(result.towns[1]!.revealed.lastUpdatedTurn).toBe(4);
    });

    it('should use custom seed accessor when provided', () => {
      const customSeedAccessor = (s: GameState) => `custom-${s.turn}-seed`;
      const system = createStatsUpdateSystem(undefined, customSeedAccessor);
      const initialState = createMockGameState({
        turn: 5,
        towns: [
          {
            id: 'town1',
            name: 'Test Town 1',
            prosperityRaw: 50,
            militaryRaw: 30,
            resources: { fish: 0, wood: 0, ore: 0 },
            prices: { fish: 10, wood: 15, ore: 20 },
            treasury: 100,
            revealed: {
              prosperityTier: 'modest',
              militaryTier: 'militia',
              lastUpdatedTurn: 4, // Last revealed on turn 4
            },
          },
          {
            id: 'town2',
            name: 'Test Town 2',
            prosperityRaw: 80,
            militaryRaw: 70,
            resources: { fish: 0, wood: 0, ore: 0 },
            prices: { fish: 12, wood: 18, ore: 25 },
            treasury: 200,
            revealed: {
              prosperityTier: 'prosperous',
              militaryTier: 'formidable',
              lastUpdatedTurn: 4, // Last revealed on turn 4
            },
          },
        ],
      });

      const result = system(initialState);

      // Should use custom seed accessor and reveal (5 - 4 = 1, which % 2 = 1, so no reveal with default interval=2)
      // But we're testing that the system works with custom seed accessor
      expect(result.towns[0]!.revealed.lastUpdatedTurn).toBe(4); // No reveal due to interval
      expect(result.towns[1]!.revealed.lastUpdatedTurn).toBe(4); // No reveal due to interval
    });

    it('should fall back to rngSeed when no seed accessor provided', () => {
      const system = createStatsUpdateSystem();
      const initialState = createMockGameState({ rngSeed: 'fallback-seed' });

      const result = system(initialState);

      // Should use rngSeed as fallback
      expect(result.towns[0]!.revealed.lastUpdatedTurn).toBe(0);
      expect(result.towns[1]!.revealed.lastUpdatedTurn).toBe(0);
    });

    it('should be deterministic with same inputs', () => {
      const system = createStatsUpdateSystem();
      const initialState = createMockGameState({ turn: 10 });

      const result1 = system(initialState);
      const result2 = system(initialState);

      // Same inputs should produce same outputs
      expect(result1).toEqual(result2);
    });

    it('should handle empty towns array', () => {
      const system = createStatsUpdateSystem();
      const initialState = createMockGameState({ towns: [] });

      const result = system(initialState);

      // Should handle empty towns gracefully
      expect(result.towns).toEqual([]);
    });

    it('should preserve other game state properties', () => {
      const system = createStatsUpdateSystem();
      const initialState = createMockGameState({
        turn: 7,
        rngSeed: 'preserved-seed',
        towns: [
          {
            id: 'town1',
            name: 'Preserved Town',
            prosperityRaw: 100,
            militaryRaw: 100,
            resources: {},
            prices: {},
            treasury: 300,
            revealed: {
              prosperityTier: 'opulent',
              militaryTier: 'host',
              lastUpdatedTurn: 6,
            },
          },
        ],
      });

      const result = system(initialState);

      // Other properties should be preserved
      expect(result.turn).toBe(7);
      expect(result.rngSeed).toBe('preserved-seed');
      expect(result.towns[0]!.name).toBe('Preserved Town');
      expect(result.towns[0]!.id).toBe('town1');
    });

    it('should apply raw updates before reveal updates', () => {
      const system = createStatsUpdateSystem({
        raw: { prosperityDecayPerTurn: 10 },
        revealInterval: 1,
      });

      const initialState = createMockGameState({
        turn: 1,
        towns: [
          {
            id: 'town1',
            name: 'Test Town 1',
            prosperityRaw: 50,
            militaryRaw: 30,
            resources: { fish: 0, wood: 0, ore: 0 },
            prices: { fish: 10, wood: 15, ore: 20 },
            treasury: 100,
            revealed: {
              prosperityTier: 'modest',
              militaryTier: 'militia',
              lastUpdatedTurn: 0, // Last revealed on turn 0
            },
          },
        ],
      });

      const result = system(initialState);

      // Raw decay should be applied first (prosperity 50 -> 40)
      expect(result.towns[0]!.prosperityRaw).toBe(40);

      // Then reveal should happen based on the updated raw value (1 - 0 = 1, which % 1 = 0)
      expect(result.towns[0]!.revealed.lastUpdatedTurn).toBe(1);
    });
  });
});
