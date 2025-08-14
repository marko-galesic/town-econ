import { describe, it, expect } from 'vitest';

import type { GameState } from '../../types/GameState';

import { applyRawStatTurn, DEFAULT_RAW_RULES, type RawStatRules } from './RawStatSystem';

describe('RawStatSystem', () => {
  const mockGameState: GameState = {
    turn: 1,
    version: 1,
    rngSeed: 'test-seed',
    towns: [
      {
        id: 'town1',
        name: 'Test Town 1',
        resources: { fish: 100, wood: 50, ore: 25 },
        prices: { fish: 10, wood: 5, ore: 15 },
        militaryRaw: 75,
        prosperityRaw: 80,
        treasury: 1000,
        revealed: {
          militaryTier: 'host',
          prosperityTier: 'prosperous',
          lastUpdatedTurn: 1,
        },
      },
      {
        id: 'town2',
        name: 'Test Town 2',
        resources: { fish: 25, wood: 100, ore: 50 },
        prices: { fish: 8, wood: 6, ore: 12 },
        militaryRaw: 45,
        prosperityRaw: 60,
        treasury: 500,
        revealed: {
          militaryTier: 'formidable',
          prosperityTier: 'modest',
          lastUpdatedTurn: 1,
        },
      },
    ],
    goods: {
      fish: { id: 'fish', name: 'Fish', effects: { prosperityDelta: 1, militaryDelta: 0 } },
      wood: { id: 'wood', name: 'Wood', effects: { prosperityDelta: 0, militaryDelta: 1 } },
      ore: { id: 'ore', name: 'Ore', effects: { prosperityDelta: 2, militaryDelta: 2 } },
    },
  };

  describe('applyRawStatTurn', () => {
    it('should apply default decay rules correctly', () => {
      const result = applyRawStatTurn(mockGameState);

      // Town 1: prosperity 80 -> 79, military 75 -> 75 (no decay)
      expect(result.towns[0]!.prosperityRaw).toBe(79);
      expect(result.towns[0]!.militaryRaw).toBe(75);

      // Town 2: prosperity 60 -> 59, military 45 -> 45 (no decay)
      expect(result.towns[1]!.prosperityRaw).toBe(59);
      expect(result.towns[1]!.militaryRaw).toBe(45);
    });

    it('should apply custom decay rules correctly', () => {
      const customRules: RawStatRules = {
        prosperityDecayPerTurn: 2,
        militaryDecayPerTurn: 1,
        maxRaw: 100,
      };

      const result = applyRawStatTurn(mockGameState, customRules);

      // Town 1: prosperity 80 -> 78, military 75 -> 74
      expect(result.towns[0]!.prosperityRaw).toBe(78);
      expect(result.towns[0]!.militaryRaw).toBe(74);

      // Town 2: prosperity 60 -> 58, military 45 -> 44
      expect(result.towns[1]!.prosperityRaw).toBe(58);
      expect(result.towns[1]!.militaryRaw).toBe(44);
    });

    it('should clamp values to [0, maxRaw] range', () => {
      const stateWithLowStats: GameState = {
        ...mockGameState,
        towns: [
          {
            ...mockGameState.towns[0]!,
            prosperityRaw: 1,
            militaryRaw: 0,
          },
          {
            ...mockGameState.towns[1]!,
            prosperityRaw: 100,
            militaryRaw: 99,
          },
        ],
      };

      const result = applyRawStatTurn(stateWithLowStats);

      // Town 1: prosperity 1 -> 0 (clamped), military 0 -> 0 (clamped)
      expect(result.towns[0]!.prosperityRaw).toBe(0);
      expect(result.towns[0]!.militaryRaw).toBe(0);

      // Town 2: prosperity 100 -> 99, military 99 -> 99
      expect(result.towns[1]!.prosperityRaw).toBe(99);
      expect(result.towns[1]!.militaryRaw).toBe(99);
    });

    it('should respect custom maxRaw clamping', () => {
      const customRules: RawStatRules = {
        prosperityDecayPerTurn: 5,
        militaryDecayPerTurn: 3,
        maxRaw: 50,
      };

      const stateWithHighStats: GameState = {
        ...mockGameState,
        towns: [
          {
            ...mockGameState.towns[0]!,
            prosperityRaw: 60,
            militaryRaw: 55,
          },
        ],
      };

      const result = applyRawStatTurn(stateWithHighStats, customRules);

      // prosperity 60 -> 55, but clamped to 50
      expect(result.towns[0]!.prosperityRaw).toBe(50);
      // military 55 -> 52, but clamped to 50
      expect(result.towns[0]!.militaryRaw).toBe(50);
    });

    it('should not mutate the input state', () => {
      const originalState = JSON.parse(JSON.stringify(mockGameState));
      const result = applyRawStatTurn(mockGameState);

      // Verify input state is unchanged
      expect(mockGameState).toEqual(originalState);
      expect(mockGameState).not.toBe(result);

      // Verify towns arrays are different references
      expect(mockGameState.towns).not.toBe(result.towns);
      expect(mockGameState.towns[0]).not.toBe(result.towns[0]);
      expect(mockGameState.towns[1]).not.toBe(result.towns[1]);
    });

    it('should handle empty towns array', () => {
      const emptyState: GameState = {
        ...mockGameState,
        towns: [],
      };

      const result = applyRawStatTurn(emptyState);

      expect(result.towns).toEqual([]);
      expect(result).not.toBe(emptyState);
    });

    it('should preserve all other town properties', () => {
      const result = applyRawStatTurn(mockGameState);

      // Verify all other properties remain unchanged
      expect(result.towns[0]!.id).toBe(mockGameState.towns[0]!.id);
      expect(result.towns[0]!.name).toBe(mockGameState.towns[0]!.name);
      expect(result.towns[0]!.resources).toEqual(mockGameState.towns[0]!.resources);
      expect(result.towns[0]!.prices).toEqual(mockGameState.towns[0]!.prices);
      expect(result.towns[0]!.treasury).toBe(mockGameState.towns[0]!.treasury);
      expect(result.towns[0]!.revealed).toEqual(mockGameState.towns[0]!.revealed);
    });

    it('should preserve all other game state properties', () => {
      const result = applyRawStatTurn(mockGameState);

      expect(result.turn).toBe(mockGameState.turn);
      expect(result.version).toBe(mockGameState.version);
      expect(result.rngSeed).toBe(mockGameState.rngSeed);
      expect(result.goods).toEqual(mockGameState.goods);
    });

    it('should handle negative decay values (stat increases)', () => {
      const growthRules: RawStatRules = {
        prosperityDecayPerTurn: -2, // Negative means growth
        militaryDecayPerTurn: -1,
        maxRaw: 100,
      };

      const result = applyRawStatTurn(mockGameState, growthRules);

      // Town 1: prosperity 80 -> 82, military 75 -> 76
      expect(result.towns[0]!.prosperityRaw).toBe(82);
      expect(result.towns[0]!.militaryRaw).toBe(76);

      // Town 2: prosperity 60 -> 62, military 45 -> 46
      expect(result.towns[1]!.prosperityRaw).toBe(62);
      expect(result.towns[1]!.militaryRaw).toBe(46);
    });

    it('should handle zero decay values (no change)', () => {
      const noChangeRules: RawStatRules = {
        prosperityDecayPerTurn: 0,
        militaryDecayPerTurn: 0,
        maxRaw: 100,
      };

      const result = applyRawStatTurn(mockGameState, noChangeRules);

      // All stats should remain unchanged
      expect(result.towns[0]!.prosperityRaw).toBe(mockGameState.towns[0]!.prosperityRaw);
      expect(result.towns[0]!.militaryRaw).toBe(mockGameState.towns[0]!.militaryRaw);
      expect(result.towns[1]!.prosperityRaw).toBe(mockGameState.towns[1]!.prosperityRaw);
      expect(result.towns[1]!.militaryRaw).toBe(mockGameState.towns[1]!.militaryRaw);
    });
  });

  describe('DEFAULT_RAW_RULES', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_RAW_RULES.prosperityDecayPerTurn).toBe(1);
      expect(DEFAULT_RAW_RULES.militaryDecayPerTurn).toBe(0);
      expect(DEFAULT_RAW_RULES.maxRaw).toBe(100);
    });
  });
});
