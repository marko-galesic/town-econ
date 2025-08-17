import { describe, it, expect } from 'vitest';

import type { GameState } from '../../types/GameState';

import { GOOD_ORDER } from './constants';
import { selectTownVM } from './selectors';

describe('selectors', () => {
  const mockGameState: GameState = {
    turn: 1,
    version: 1,
    rngSeed: 'test-seed',
    towns: [
      {
        id: 'town-1',
        name: 'Test Town',
        resources: { fish: 100, wood: 200, ore: 300 },
        prices: { fish: 10, wood: 15, ore: 20 },
        militaryRaw: 50,
        prosperityRaw: 75,
        treasury: 1000,
        revealed: {
          militaryTier: 'garrison',
          prosperityTier: 'prosperous',
          lastUpdatedTurn: 1,
        },
      },
      {
        id: 'town-2',
        name: 'Another Town',
        resources: { fish: 50, wood: 75, ore: 100 },
        prices: { fish: 8, wood: 12, ore: 18 },
        militaryRaw: -10,
        prosperityRaw: -20,
        treasury: 500,
        revealed: {
          militaryTier: 'militia',
          prosperityTier: 'struggling',
          lastUpdatedTurn: 1,
        },
      },
    ],
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
        effects: { prosperityDelta: 1, militaryDelta: 1 },
      },
    },
  };

  describe('selectTownVM', () => {
    it('produces stable GOOD_ORDER for prices', () => {
      const result = selectTownVM(mockGameState, 'town-1');

      expect(result.prices).toHaveLength(3);
      expect(result.prices.map(p => p.goodId)).toEqual(GOOD_ORDER);
    });

    it('returns integer prices and correct labels for revealed tiers', () => {
      const result = selectTownVM(mockGameState, 'town-1');

      // Check price entries
      expect(result.prices[0]).toEqual({
        goodId: 'fish',
        value: 10,
        text: '₲10',
      });
      expect(result.prices[1]).toEqual({
        goodId: 'wood',
        value: 15,
        text: '₲15',
      });
      expect(result.prices[2]).toEqual({
        goodId: 'ore',
        value: 20,
        text: '₲20',
      });

      // Check tier information
      expect(result.prosperity).toEqual({
        tier: 'prosperous',
        text: 'Prosperous',
      });
      expect(result.military).toEqual({
        tier: 'garrison',
        text: 'Garrison',
      });
    });

    it('handles different tier combinations correctly', () => {
      const result = selectTownVM(mockGameState, 'town-2');

      expect(result.prosperity).toEqual({
        tier: 'struggling',
        text: 'Struggling',
      });
      expect(result.military).toEqual({
        tier: 'militia',
        text: 'Small militia',
      });
    });

    it('includes all required fields in the view model', () => {
      const result = selectTownVM(mockGameState, 'town-1');

      expect(result).toHaveProperty('id', 'town-1');
      expect(result).toHaveProperty('name', 'Test Town');
      expect(result).toHaveProperty('prices');
      expect(result).toHaveProperty('prosperity');
      expect(result).toHaveProperty('military');
    });

    it('throws error with town ID in message for bad townId', () => {
      expect(() => {
        selectTownVM(mockGameState, 'non-existent-town');
      }).toThrow('Town with ID "non-existent-town" not found in game state');
    });

    it('handles empty towns array gracefully', () => {
      const emptyState: GameState = {
        ...mockGameState,
        towns: [],
      };

      expect(() => {
        selectTownVM(emptyState, 'any-town');
      }).toThrow('Town with ID "any-town" not found in game state');
    });
  });
});
