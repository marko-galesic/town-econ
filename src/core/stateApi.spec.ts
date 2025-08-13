import { describe, it, expect } from 'vitest';

import type { GameState } from '../types/GameState';
import type { Town } from '../types/Town';

import { getTown, setResource, incResource, setPrice, incPrice, addProsperity, addMilitary, advanceTurn } from './stateApi';

// Deep freeze utility to catch accidental mutations
function deepFreeze<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;

  Object.freeze(obj);

  if (Array.isArray(obj)) {
    obj.forEach(deepFreeze);
  } else {
    Object.values(obj).forEach(deepFreeze);
  }

  return obj;
}

describe('stateApi', () => {
  // Common test data
  const baseTown: Town = {
    id: 'test-town-1',
    name: 'Test Town',
    resources: { fish: 10, wood: 5, ore: 0 },
    prices: { fish: 2, wood: 3, ore: 1 },
    militaryRaw: 15,
    prosperityRaw: 25,
    revealed: {
      militaryTier: 'garrison',
      prosperityTier: 'modest',
      lastUpdatedTurn: 3
    }
  };

  const baseState: GameState = {
    turn: 5,
    version: 2,
    rngSeed: 'test-seed-123',
    towns: [baseTown],
    goods: {
      fish: { id: 'fish', name: 'Fish', effects: { prosperityDelta: 2, militaryDelta: 1 } },
      wood: { id: 'wood', name: 'Wood', effects: { prosperityDelta: 1, militaryDelta: 2 } },
      ore: { id: 'ore', name: 'Ore', effects: { prosperityDelta: 3, militaryDelta: 3 } }
    }
  };

  describe('Invariant Tests - Table Driven', () => {
    describe('Good ID Validation', () => {
      const invalidGoodIds = ['unknown', 'invalid', 'bad', 'test', 'random'];

      it.each(invalidGoodIds)('should reject invalid good ID: %s', (invalidId) => {
        const frozenTown = deepFreeze({ ...baseTown });

        expect(() => setResource(frozenTown, invalidId, 10)).toThrow(`Unknown good ID: '${invalidId}'`);
        expect(() => incResource(frozenTown, invalidId, 10)).toThrow(`Unknown good ID: '${invalidId}'`);
        expect(() => setPrice(frozenTown, invalidId, 10)).toThrow(`Unknown good ID: '${invalidId}'`);
        expect(() => incPrice(frozenTown, invalidId, 10)).toThrow(`Unknown good ID: '${invalidId}'`);
      });

      it('should accept valid good IDs', () => {
        const frozenTown = deepFreeze({ ...baseTown });
        const validIds = ['fish', 'wood', 'ore'];

        validIds.forEach(id => {
          expect(() => setResource(frozenTown, id, 10)).not.toThrow();
          expect(() => incResource(frozenTown, id, 10)).not.toThrow();
          expect(() => setPrice(frozenTown, id, 10)).not.toThrow();
          expect(() => incPrice(frozenTown, id, 10)).not.toThrow();
        });
      });
    });

    describe('Integer Validation', () => {
      const nonIntegerValues = [
        { value: 3.5, description: 'decimal' },
        { value: NaN, description: 'NaN' },
        { value: Infinity, description: 'Infinity' },
        { value: -Infinity, description: 'negative Infinity' },
        { value: 1.1, description: 'small decimal' },
        { value: -2.7, description: 'negative decimal' }
      ];

      it.each(nonIntegerValues)('should reject non-integer amount: $description ($value)', ({ value }) => {
        const frozenTown = deepFreeze({ ...baseTown });

        expect(() => setResource(frozenTown, 'fish', value)).toThrow(`Amount must be an integer, got: ${value}`);
        expect(() => setPrice(frozenTown, 'fish', value)).toThrow(`Price must be an integer, got: ${value}`);
      });

      it.each(nonIntegerValues)('should reject non-integer delta: $description ($value)', ({ value }) => {
        const frozenTown = deepFreeze({ ...baseTown });

        expect(() => incResource(frozenTown, 'fish', value)).toThrow(`Delta must be an integer, got: ${value}`);
        expect(() => incPrice(frozenTown, 'fish', value)).toThrow(`Delta must be an integer, got: ${value}`);
        expect(() => addProsperity(frozenTown, value)).toThrow(`Delta must be an integer, got: ${value}`);
        expect(() => addMilitary(frozenTown, value)).toThrow(`Delta must be an integer, got: ${value}`);
      });

      it('should accept integer values', () => {
        const frozenTown = deepFreeze({ ...baseTown });
        const integers = [-100, -50, -1, 0, 1, 50, 100];

        integers.forEach(int => {
          expect(() => setResource(frozenTown, 'fish', int)).not.toThrow();
          expect(() => setPrice(frozenTown, 'fish', int)).not.toThrow();
          expect(() => incResource(frozenTown, 'fish', int)).not.toThrow();
          expect(() => incPrice(frozenTown, 'fish', int)).not.toThrow();
          expect(() => addProsperity(frozenTown, int)).not.toThrow();
          expect(() => addMilitary(frozenTown, int)).not.toThrow();
        });
      });
    });

    describe('Clamping and Flooring', () => {
      const clampingTestCases = [
        { input: -100, expected: 0, description: 'large negative' },
        { input: -50, expected: 0, description: 'medium negative' },
        { input: -1, expected: 0, description: 'small negative' },
        { input: 0, expected: 0, description: 'zero' },
        { input: 1, expected: 1, description: 'small positive' },
        { input: 50, expected: 50, description: 'medium positive' },
        { input: 100, expected: 100, description: 'large positive' }
      ];

      it.each(clampingTestCases)('setResource should clamp $description ($input → $expected)', ({ input, expected }) => {
        const frozenTown = deepFreeze({ ...baseTown });
        const result = setResource(frozenTown, 'fish', input);

        expect(result.resources.fish).toBe(expected);
        expect(result).not.toBe(frozenTown);
        expect(frozenTown.resources.fish).toBe(10); // Original unchanged
      });

      it.each(clampingTestCases)('setPrice should clamp $description ($input → $expected)', ({ input, expected }) => {
        const frozenTown = deepFreeze({ ...baseTown });
        const result = setPrice(frozenTown, 'fish', input);

        expect(result.prices.fish).toBe(expected);
        expect(result).not.toBe(frozenTown);
        expect(frozenTown.prices.fish).toBe(2); // Original unchanged
      });

      it('incResource should floor at 0', () => {
        const frozenTown = deepFreeze({ ...baseTown });

        // Test negative delta that would result in negative
        const result = incResource(frozenTown, 'fish', -15); // 10 - 15 = -5, floored to 0

        expect(result.resources.fish).toBe(0);
        expect(result).not.toBe(frozenTown);
        expect(frozenTown.resources.fish).toBe(10); // Original unchanged
      });

      it('incPrice should floor at 0', () => {
        const frozenTown = deepFreeze({ ...baseTown });

        // Test negative delta that would result in negative
        const result = incPrice(frozenTown, 'fish', -5); // 2 - 5 = -3, floored to 0

        expect(result.prices.fish).toBe(0);
        expect(result).not.toBe(frozenTown);
        expect(frozenTown.prices.fish).toBe(2); // Original unchanged
      });
    });

    describe('Tier Preservation', () => {
      it('addProsperity should not modify revealed tiers', () => {
        const frozenTown = deepFreeze({ ...baseTown });
        const result = addProsperity(frozenTown, 100);

        expect(result.prosperityRaw).toBe(125);
        expect(result.revealed.prosperityTier).toBe('modest');
        expect(result.revealed.militaryTier).toBe('garrison');
        expect(result.revealed.lastUpdatedTurn).toBe(3);

        // Verify revealed object reference is preserved
        expect(result.revealed).toBe(frozenTown.revealed);
      });

      it('addMilitary should not modify revealed tiers', () => {
        const frozenTown = deepFreeze({ ...baseTown });
        const result = addMilitary(frozenTown, 100);

        expect(result.militaryRaw).toBe(115);
        expect(result.revealed.militaryTier).toBe('garrison');
        expect(result.revealed.prosperityTier).toBe('modest');
        expect(result.revealed.lastUpdatedTurn).toBe(3);

        // Verify revealed object reference is preserved
        expect(result.revealed).toBe(frozenTown.revealed);
      });

      it('resource functions should not modify revealed tiers', () => {
        const frozenTown = deepFreeze({ ...baseTown });

        const resourceResult = setResource(frozenTown, 'fish', 50);
        const priceResult = setPrice(frozenTown, 'fish', 50);

        expect(resourceResult.revealed).toBe(frozenTown.revealed);
        expect(priceResult.revealed).toBe(frozenTown.revealed);
        expect(resourceResult.revealed.prosperityTier).toBe('modest');
        expect(priceResult.revealed.militaryTier).toBe('garrison');
      });
    });

    describe('Immutability', () => {
      it('all functions should return new objects', () => {
        const frozenTown = deepFreeze({ ...baseTown });
        const frozenState = deepFreeze({ ...baseState });

        // Town functions
        expect(setResource(frozenTown, 'fish', 20)).not.toBe(frozenTown);
        expect(incResource(frozenTown, 'fish', 10)).not.toBe(frozenTown);
        expect(setPrice(frozenTown, 'fish', 20)).not.toBe(frozenTown);
        expect(incPrice(frozenTown, 'fish', 10)).not.toBe(frozenTown);
        expect(addProsperity(frozenTown, 10)).not.toBe(frozenTown);
        expect(addMilitary(frozenTown, 10)).not.toBe(frozenTown);

        // State functions
        expect(advanceTurn(frozenState)).not.toBe(frozenState);
        // getTown returns existing reference, so it should be the same object
        expect(getTown(frozenState, 'test-town-1')).toBe(frozenState.towns[0]);
      });

      it('all functions should preserve original object references for unchanged properties', () => {
        const frozenTown = deepFreeze({ ...baseTown });
        const frozenState = deepFreeze({ ...baseState });

        // Town functions should preserve unchanged object references
        const resourceResult = setResource(frozenTown, 'fish', 20);
        expect(resourceResult.id).toBe(frozenTown.id);
        expect(resourceResult.name).toBe(frozenTown.name);
        expect(resourceResult.prices).toBe(frozenTown.prices);
        expect(resourceResult.militaryRaw).toBe(frozenTown.militaryRaw);
        expect(resourceResult.prosperityRaw).toBe(frozenTown.prosperityRaw);
        expect(resourceResult.revealed).toBe(frozenTown.revealed);

        // State function should preserve unchanged object references
        const turnResult = advanceTurn(frozenState);
        expect(turnResult.version).toBe(frozenState.version);
        expect(turnResult.rngSeed).toBe(frozenState.rngSeed);
        expect(turnResult.towns).toBe(frozenState.towns);
        expect(turnResult.goods).toBe(frozenState.goods);
      });

      it('original objects should remain completely unchanged', () => {
        const originalTown = { ...baseTown };
        const originalState = { ...baseState };

        const townCopy = { ...originalTown };
        const stateCopy = { ...originalState };

        // Apply all functions
        setResource(townCopy, 'fish', 100);
        incResource(townCopy, 'wood', 50);
        setPrice(townCopy, 'ore', 25);
        incPrice(townCopy, 'fish', 10);
        addProsperity(townCopy, 30);
        addMilitary(townCopy, 20);
        advanceTurn(stateCopy);

        // Verify originals are unchanged
        expect(originalTown).toEqual(baseTown);
        expect(originalState).toEqual(baseState);
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty arrays and objects', () => {
        const emptyTown: Town = {
          ...baseTown,
          resources: {
            fish: 0,
            wood: 0,
            ore: 0
          },
          prices: {
            fish: 0,
            wood: 0,
            ore: 0
          }
        };
        const emptyState: GameState = {
          ...baseState,
          towns: [],
          goods: {
            fish: { id: 'fish', name: 'Fish', effects: { prosperityDelta: 0, militaryDelta: 0 } },
            wood: { id: 'wood', name: 'Wood', effects: { prosperityDelta: 0, militaryDelta: 0 } },
            ore: { id: 'ore', name: 'Ore', effects: { prosperityDelta: 0, militaryDelta: 0 } }
          }
        };

        const frozenEmptyTown = deepFreeze(emptyTown);
        const frozenEmptyState = deepFreeze(emptyState);

        // Should not throw on empty collections
        expect(() => setResource(frozenEmptyTown, 'fish', 10)).not.toThrow();
        expect(() => setPrice(frozenEmptyTown, 'fish', 10)).not.toThrow();
        expect(() => advanceTurn(frozenEmptyState)).not.toThrow();
      });

      it('should handle extreme values', () => {
        const frozenTown = deepFreeze({ ...baseTown });
        const frozenState = deepFreeze({ ...baseState });

        // Extreme positive values
        expect(() => setResource(frozenTown, 'fish', Number.MAX_SAFE_INTEGER)).not.toThrow();
        expect(() => addProsperity(frozenTown, Number.MAX_SAFE_INTEGER)).not.toThrow();
        expect(() => addMilitary(frozenTown, Number.MAX_SAFE_INTEGER)).not.toThrow();

        // Extreme negative values
        expect(() => addProsperity(frozenTown, Number.MIN_SAFE_INTEGER)).not.toThrow();
        expect(() => addMilitary(frozenTown, Number.MIN_SAFE_INTEGER)).not.toThrow();

        // Extreme turn numbers
        expect(() => advanceTurn({ ...frozenState, turn: Number.MAX_SAFE_INTEGER })).not.toThrow();
        expect(() => advanceTurn({ ...frozenState, turn: Number.MIN_SAFE_INTEGER })).not.toThrow();
      });

      it('should handle missing resource/price keys gracefully', () => {
        const townWithMissingKeys: Town = {
          ...baseTown,
          resources: {
            fish: 10,
            wood: 0,
            ore: 0
          },
          prices: {
            fish: 2,
            wood: 0,
            ore: 0
          }
        };

        const frozenTown = deepFreeze(townWithMissingKeys);

        // Should default missing keys to 0
        const resourceResult = incResource(frozenTown, 'wood', 15);
        const priceResult = incPrice(frozenTown, 'ore', 20);

        expect(resourceResult.resources.wood).toBe(15); // 0 + 15
        expect(priceResult.prices.ore).toBe(20);       // 0 + 20
      });
    });
  });

  // Keep existing individual function tests for specific behavior verification
  describe('getTown', () => {
    const mockTown: Town = {
      id: 'test-town-1',
      name: 'Test Town',
      resources: {
        fish: 0,
        wood: 0,
        ore: 0
      },
      prices: {
        fish: 0,
        wood: 0,
        ore: 0
      },
      militaryRaw: 0,
      prosperityRaw: 0,
      revealed: {
        militaryTier: 'militia',
        prosperityTier: 'struggling',
        lastUpdatedTurn: 0
      }
    };

    const mockState: GameState = {
      turn: 0,
      version: 1,
      rngSeed: 'test-seed',
      towns: [mockTown],
      goods: {
        fish: { id: 'fish', name: 'Fish', effects: { prosperityDelta: 2, militaryDelta: 1 } },
        wood: { id: 'wood', name: 'Wood', effects: { prosperityDelta: 1, militaryDelta: 2 } },
        ore: { id: 'ore', name: 'Ore', effects: { prosperityDelta: 3, militaryDelta: 3 } }
      }
    };

    it('should return town when found', () => {
      const result = getTown(mockState, 'test-town-1');
      expect(result).toBe(mockTown);
      expect(result.id).toBe('test-town-1');
    });

    it('should throw error with town ID when town not found', () => {
      expect(() => getTown(mockState, 'non-existent-town')).toThrow();

      try {
        getTown(mockState, 'non-existent-town');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('non-existent-town');
        expect((error as Error).message).toBe("Town with ID 'non-existent-town' not found");
      }
    });

    it('should throw error with empty towns array', () => {
      const emptyState: GameState = {
        ...mockState,
        towns: []
      };

      expect(() => getTown(emptyState, 'any-town')).toThrow();

      try {
        getTown(emptyState, 'any-town');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('any-town');
        expect((error as Error).message).toBe("Town with ID 'any-town' not found");
      }
    });
  });

  describe('setResource', () => {
    const mockTown: Town = {
      id: 'test-town-1',
      name: 'Test Town',
      resources: {
        fish: 5,
        wood: 10,
        ore: 0
      },
      prices: {
        fish: 0,
        wood: 0,
        ore: 0
      },
      militaryRaw: 0,
      prosperityRaw: 0,
      revealed: {
        militaryTier: 'militia',
        prosperityTier: 'struggling',
        lastUpdatedTurn: 0
      }
    };

    it('should set positive integer amount correctly', () => {
      const result = setResource(mockTown, 'fish', 15);

      expect(result.resources.fish).toBe(15);
      expect(result).not.toBe(mockTown); // Immutability check
      expect(result.resources).not.toBe(mockTown.resources); // Resources object should be new

      // Original town should be unchanged
      expect(mockTown.resources.fish).toBe(5);
    });

    it('should clamp negative amounts to 0', () => {
      const result = setResource(mockTown, 'wood', -5);

      expect(result.resources.wood).toBe(0);
      expect(result).not.toBe(mockTown);

      // Original town should be unchanged
      expect(mockTown.resources.wood).toBe(10);
    });

    it('should clamp zero correctly', () => {
      const result = setResource(mockTown, 'ore', 0);

      expect(result.resources.ore).toBe(0);
      expect(result).not.toBe(mockTown);

      // Original town should be unchanged
      expect(mockTown.resources.ore).toBe(0);
    });

    it('should reject non-integer amounts', () => {
      expect(() => setResource(mockTown, 'fish', 3.5)).toThrow();
      expect(() => setResource(mockTown, 'fish', NaN)).toThrow();
      expect(() => setResource(mockTown, 'fish', Infinity)).toThrow();

      try {
        setResource(mockTown, 'fish', 3.5);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Amount must be an integer');
        expect((error as Error).message).toContain('3.5');
      }
    });

    it('should throw error for unknown good ID', () => {
      expect(() => setResource(mockTown, 'unknown-good', 10)).toThrow();

      try {
        setResource(mockTown, 'unknown-good', 10);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Unknown good ID');
        expect((error as Error).message).toContain('unknown-good');
      }
    });

    it('should preserve other resources when updating one', () => {
      const result = setResource(mockTown, 'fish', 20);

      expect(result.resources.fish).toBe(20);
      expect(result.resources.wood).toBe(10);
      expect(result.resources.ore).toBe(0);

      // Original town should be unchanged
      expect(mockTown.resources.fish).toBe(5);
      expect(mockTown.resources.wood).toBe(10);
      expect(mockTown.resources.ore).toBe(0);
    });

    it('should handle town with minimal existing resources', () => {
      const townWithMinimalResources: Town = {
        ...mockTown,
        resources: {
          fish: 0,
          wood: 0,
          ore: 0
        }
      };

      const result = setResource(townWithMinimalResources, 'fish', 25);

      expect(result.resources.fish).toBe(25);
      expect(result.resources.wood).toBe(0);
      expect(result.resources.ore).toBe(0);

      // Original town should be unchanged
      expect(townWithMinimalResources.resources.fish).toBe(0);
    });

    it('should preserve all other town properties', () => {
      const result = setResource(mockTown, 'fish', 30);

      expect(result.id).toBe(mockTown.id);
      expect(result.name).toBe(mockTown.name);
      expect(result.prices).toBe(mockTown.prices);
      expect(result.militaryRaw).toBe(mockTown.militaryRaw);
      expect(result.prosperityRaw).toBe(mockTown.prosperityRaw);
      expect(result.revealed).toBe(mockTown.revealed);
    });
  });

  describe('incResource', () => {
    const mockTown: Town = {
      id: 'test-town-1',
      name: 'Test Town',
      resources: {
        fish: 10,
        wood: 5,
        ore: 0
      },
      prices: {
        fish: 0,
        wood: 0,
        ore: 0
      },
      militaryRaw: 0,
      prosperityRaw: 0,
      revealed: {
        militaryTier: 'militia',
        prosperityTier: 'struggling',
        lastUpdatedTurn: 0
      }
    };

    it('should increment positive delta correctly', () => {
      const result = incResource(mockTown, 'fish', 5);

      expect(result.resources.fish).toBe(15);
      expect(result).not.toBe(mockTown); // Immutability check
      expect(result.resources).not.toBe(mockTown.resources); // Resources object should be new

      // Original town should be unchanged
      expect(mockTown.resources.fish).toBe(10);
    });

    it('should decrement with small negative delta correctly', () => {
      const result = incResource(mockTown, 'fish', -3);

      expect(result.resources.fish).toBe(7);
      expect(result).not.toBe(mockTown);

      // Original town should be unchanged
      expect(mockTown.resources.fish).toBe(10);
    });

    it('should floor large negative delta at 0', () => {
      const result = incResource(mockTown, 'fish', -15);

      expect(result.resources.fish).toBe(0);
      expect(result).not.toBe(mockTown);

      // Original town should be unchanged
      expect(mockTown.resources.fish).toBe(10);
    });

    it('should handle exact negative delta that results in 0', () => {
      const result = incResource(mockTown, 'fish', -10);

      expect(result.resources.fish).toBe(0);
      expect(result).not.toBe(mockTown);

      // Original town should be unchanged
      expect(mockTown.resources.fish).toBe(10);
    });

    it('should handle resource starting at 0 with negative delta', () => {
      const result = incResource(mockTown, 'ore', -5);

      expect(result.resources.ore).toBe(0);
      expect(result).not.toBe(mockTown);

      // Original town should be unchanged
      expect(mockTown.resources.ore).toBe(0);
    });

    it('should handle resource starting at 0 with positive delta', () => {
      const result = incResource(mockTown, 'ore', 7);

      expect(result.resources.ore).toBe(7);
      expect(result).not.toBe(mockTown);

      // Original town should be unchanged
      expect(mockTown.resources.ore).toBe(0);
    });

    it('should reject non-integer delta', () => {
      expect(() => incResource(mockTown, 'fish', 3.5)).toThrow();
      expect(() => incResource(mockTown, 'fish', NaN)).toThrow();
      expect(() => incResource(mockTown, 'fish', Infinity)).toThrow();

      try {
        incResource(mockTown, 'fish', 3.5);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Delta must be an integer');
        expect((error as Error).message).toContain('3.5');
      }
    });

    it('should throw error for unknown good ID', () => {
      expect(() => incResource(mockTown, 'unknown-good', 10)).toThrow();

      try {
        incResource(mockTown, 'unknown-good', 10);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Unknown good ID');
        expect((error as Error).message).toContain('unknown-good');
      }
    });

    it('should preserve other resources when updating one', () => {
      const result = incResource(mockTown, 'fish', 5);

      expect(result.resources.fish).toBe(15);
      expect(result.resources.wood).toBe(5);
      expect(result.resources.ore).toBe(0);

      // Original town should be unchanged
      expect(mockTown.resources.fish).toBe(10);
      expect(mockTown.resources.wood).toBe(5);
      expect(mockTown.resources.ore).toBe(0);
    });

    it('should handle town with missing resource keys', () => {
      const townWithMissingResources: Town = {
        ...mockTown,
        resources: {
          fish: 10,
          wood: 0,
          ore: 0
        }
      };

      const result = incResource(townWithMissingResources, 'wood', 8);

      expect(result.resources.wood).toBe(8); // 0 + 8 = 8
      expect(result.resources.fish).toBe(10);
      expect(result.resources.ore).toBe(0);

      // Original town should be unchanged
      expect(townWithMissingResources.resources.wood).toBe(0);
    });

    it('should preserve all other town properties', () => {
      const result = incResource(mockTown, 'fish', 5);

      expect(result.id).toBe(mockTown.id);
      expect(result.name).toBe(mockTown.name);
      expect(result.prices).toBe(mockTown.prices);
      expect(result.militaryRaw).toBe(mockTown.militaryRaw);
      expect(result.prosperityRaw).toBe(mockTown.prosperityRaw);
      expect(result.revealed).toBe(mockTown.revealed);
    });
  });

  describe('setPrice', () => {
    const mockTown: Town = {
      id: 'test-town-1',
      name: 'Test Town',
      resources: {
        fish: 0,
        wood: 0,
        ore: 0
      },
      prices: {
        fish: 5,
        wood: 10,
        ore: 0
      },
      militaryRaw: 0,
      prosperityRaw: 0,
      revealed: {
        militaryTier: 'militia',
        prosperityTier: 'struggling',
        lastUpdatedTurn: 0
      }
    };

    it('should set positive integer price correctly', () => {
      const result = setPrice(mockTown, 'fish', 15);

      expect(result.prices.fish).toBe(15);
      expect(result).not.toBe(mockTown); // Immutability check
      expect(result.prices).not.toBe(mockTown.prices); // Prices object should be new

      // Original town should be unchanged
      expect(mockTown.prices.fish).toBe(5);
    });

    it('should clamp negative prices to 0', () => {
      const result = setPrice(mockTown, 'wood', -5);

      expect(result.prices.wood).toBe(0);
      expect(result).not.toBe(mockTown);

      // Original town should be unchanged
      expect(mockTown.prices.wood).toBe(10);
    });

    it('should clamp zero correctly', () => {
      const result = setPrice(mockTown, 'ore', 0);

      expect(result.prices.ore).toBe(0);
      expect(result).not.toBe(mockTown);

      // Original town should be unchanged
      expect(mockTown.prices.ore).toBe(0);
    });

    it('should reject non-integer prices', () => {
      expect(() => setPrice(mockTown, 'fish', 3.5)).toThrow();
      expect(() => setPrice(mockTown, 'fish', NaN)).toThrow();
      expect(() => setPrice(mockTown, 'fish', Infinity)).toThrow();

      try {
        setPrice(mockTown, 'fish', 3.5);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Price must be an integer');
        expect((error as Error).message).toContain('3.5');
      }
    });

    it('should throw error for unknown good ID', () => {
      expect(() => setPrice(mockTown, 'unknown-good', 10)).toThrow();

      try {
        setPrice(mockTown, 'unknown-good', 10);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Unknown good ID');
        expect((error as Error).message).toContain('unknown-good');
      }
    });

    it('should preserve other prices when updating one', () => {
      const result = setPrice(mockTown, 'fish', 20);

      expect(result.prices.fish).toBe(20);
      expect(result.prices.wood).toBe(10);
      expect(result.prices.ore).toBe(0);

      // Original town should be unchanged
      expect(mockTown.prices.fish).toBe(5);
      expect(mockTown.prices.wood).toBe(10);
      expect(mockTown.prices.ore).toBe(0);
    });

    it('should handle town with minimal existing prices', () => {
      const townWithMinimalPrices: Town = {
        ...mockTown,
        prices: {
          fish: 0,
          wood: 0,
          ore: 0
        }
      };

      const result = setPrice(townWithMinimalPrices, 'fish', 25);

      expect(result.prices.fish).toBe(25);
      expect(result.prices.wood).toBe(0);
      expect(result.prices.ore).toBe(0);

      // Original town should be unchanged
      expect(townWithMinimalPrices.prices.fish).toBe(0);
    });

    it('should preserve all other town properties', () => {
      const result = setPrice(mockTown, 'fish', 30);

      expect(result.id).toBe(mockTown.id);
      expect(result.name).toBe(mockTown.name);
      expect(result.resources).toBe(mockTown.resources);
      expect(result.militaryRaw).toBe(mockTown.militaryRaw);
      expect(result.prosperityRaw).toBe(mockTown.prosperityRaw);
      expect(result.revealed).toBe(mockTown.revealed);
    });
  });

  describe('incPrice', () => {
    const mockTown: Town = {
      id: 'test-town-1',
      name: 'Test Town',
      resources: {
        fish: 0,
        wood: 0,
        ore: 0
      },
      prices: {
        fish: 10,
        wood: 5,
        ore: 0
      },
      militaryRaw: 0,
      prosperityRaw: 0,
      revealed: {
        militaryTier: 'militia',
        prosperityTier: 'struggling',
        lastUpdatedTurn: 0
      }
    };

    it('should increment positive delta correctly', () => {
      const result = incPrice(mockTown, 'fish', 5);

      expect(result.prices.fish).toBe(15);
      expect(result).not.toBe(mockTown); // Immutability check
      expect(result.prices).not.toBe(mockTown.prices); // Prices object should be new

      // Original town should be unchanged
      expect(mockTown.prices.fish).toBe(10);
    });

    it('should decrement with small negative delta correctly', () => {
      const result = incPrice(mockTown, 'fish', -3);

      expect(result.prices.fish).toBe(7);
      expect(result).not.toBe(mockTown);

      // Original town should be unchanged
      expect(mockTown.prices.fish).toBe(10);
    });

    it('should floor large negative delta at 0', () => {
      const result = incPrice(mockTown, 'fish', -15);

      expect(result.prices.fish).toBe(0);
      expect(result).not.toBe(mockTown);

      // Original town should be unchanged
      expect(mockTown.prices.fish).toBe(10);
    });

    it('should handle exact negative delta that results in 0', () => {
      const result = incPrice(mockTown, 'fish', -10);

      expect(result.prices.fish).toBe(0);
      expect(result).not.toBe(mockTown);

      // Original town should be unchanged
      expect(mockTown.prices.fish).toBe(10);
    });

    it('should handle price starting at 0 with negative delta', () => {
      const result = incPrice(mockTown, 'ore', -5);

      expect(result.prices.ore).toBe(0);
      expect(result).not.toBe(mockTown);

      // Original town should be unchanged
      expect(mockTown.prices.ore).toBe(0);
    });

    it('should handle price starting at 0 with positive delta', () => {
      const result = incPrice(mockTown, 'ore', 7);

      expect(result.prices.ore).toBe(7);
      expect(result).not.toBe(mockTown);

      // Original town should be unchanged
      expect(mockTown.prices.ore).toBe(0);
    });

    it('should reject non-integer delta', () => {
      expect(() => incPrice(mockTown, 'fish', 3.5)).toThrow();
      expect(() => incPrice(mockTown, 'fish', NaN)).toThrow();
      expect(() => incPrice(mockTown, 'fish', Infinity)).toThrow();

      try {
        incPrice(mockTown, 'fish', 3.5);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Delta must be an integer');
        expect((error as Error).message).toContain('3.5');
      }
    });

    it('should throw error for unknown good ID', () => {
      expect(() => incPrice(mockTown, 'unknown-good', 10)).toThrow();

      try {
        incPrice(mockTown, 'unknown-good', 10);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Unknown good ID');
        expect((error as Error).message).toContain('unknown-good');
      }
    });

    it('should preserve other prices when updating one', () => {
      const result = incPrice(mockTown, 'fish', 5);

      expect(result.prices.fish).toBe(15);
      expect(result.prices.wood).toBe(5);
      expect(result.prices.ore).toBe(0);

      // Original town should be unchanged
      expect(mockTown.prices.fish).toBe(10);
      expect(mockTown.prices.wood).toBe(5);
      expect(mockTown.prices.ore).toBe(0);
    });

    it('should handle town with missing price keys', () => {
      const townWithMissingPrices: Town = {
        ...mockTown,
        prices: {
          fish: 10,
          wood: 0,
          ore: 0
        }
      };

      const result = incPrice(townWithMissingPrices, 'wood', 8);

      expect(result.prices.wood).toBe(8); // 0 + 8 = 8
      expect(result.prices.fish).toBe(10);
      expect(result.prices.ore).toBe(0);

      // Original town should be unchanged
      expect(townWithMissingPrices.prices.wood).toBe(0);
    });

    it('should preserve all other town properties', () => {
      const result = incPrice(mockTown, 'fish', 5);

      expect(result.id).toBe(mockTown.id);
      expect(result.name).toBe(mockTown.name);
      expect(result.resources).toBe(mockTown.resources);
      expect(result.militaryRaw).toBe(mockTown.militaryRaw);
      expect(result.prosperityRaw).toBe(mockTown.prosperityRaw);
      expect(result.revealed).toBe(mockTown.revealed);
    });
  });

  describe('addProsperity', () => {
    const mockTown: Town = {
      id: 'test-town-1',
      name: 'Test Town',
      resources: {
        fish: 0,
        wood: 0,
        ore: 0
      },
      prices: {
        fish: 0,
        wood: 0,
        ore: 0
      },
      militaryRaw: 5,
      prosperityRaw: 10,
      revealed: {
        militaryTier: 'militia',
        prosperityTier: 'struggling',
        lastUpdatedTurn: 3
      }
    };

    it('should increment positive delta correctly', () => {
      const result = addProsperity(mockTown, 5);

      expect(result.prosperityRaw).toBe(15);
      expect(result).not.toBe(mockTown); // Immutability check

      // Original town should be unchanged
      expect(mockTown.prosperityRaw).toBe(10);
    });

    it('should decrement with negative delta correctly', () => {
      const result = addProsperity(mockTown, -3);

      expect(result.prosperityRaw).toBe(7);
      expect(result).not.toBe(mockTown);

      // Original town should be unchanged
      expect(mockTown.prosperityRaw).toBe(10);
    });

    it('should handle zero delta correctly', () => {
      const result = addProsperity(mockTown, 0);

      expect(result.prosperityRaw).toBe(10);
      expect(result).not.toBe(mockTown);

      // Original town should be unchanged
      expect(mockTown.prosperityRaw).toBe(10);
    });

    it('should handle large negative delta correctly', () => {
      const result = addProsperity(mockTown, -15);

      expect(result.prosperityRaw).toBe(-5);
      expect(result).not.toBe(mockTown);

      // Original town should be unchanged
      expect(mockTown.prosperityRaw).toBe(10);
    });

    it('should reject non-integer delta', () => {
      expect(() => addProsperity(mockTown, 3.5)).toThrow();
      expect(() => addProsperity(mockTown, NaN)).toThrow();
      expect(() => addProsperity(mockTown, Infinity)).toThrow();

      try {
        addProsperity(mockTown, 3.5);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Delta must be an integer');
        expect((error as Error).message).toContain('3.5');
      }
    });

    it('should preserve revealed prosperity tier unchanged', () => {
      const result = addProsperity(mockTown, 20);

      expect(result.prosperityRaw).toBe(30);
      expect(result.revealed.prosperityTier).toBe('struggling');
      expect(result.revealed.prosperityTier).toBe(mockTown.revealed.prosperityTier);

      // Original town should be unchanged
      expect(mockTown.prosperityRaw).toBe(10);
      expect(mockTown.revealed.prosperityTier).toBe('struggling');
    });

    it('should preserve all other town properties', () => {
      const result = addProsperity(mockTown, 5);

      expect(result.id).toBe(mockTown.id);
      expect(result.name).toBe(mockTown.name);
      expect(result.resources).toBe(mockTown.resources);
      expect(result.prices).toBe(mockTown.prices);
      expect(result.militaryRaw).toBe(mockTown.militaryRaw);
      expect(result.revealed).toBe(mockTown.revealed);

      // Only prosperityRaw should be different
      expect(result.prosperityRaw).toBe(15);
      expect(mockTown.prosperityRaw).toBe(10);
    });

    it('should handle town with negative prosperity', () => {
      const townWithNegativeProsperity: Town = {
        ...mockTown,
        prosperityRaw: -5
      };

      const result = addProsperity(townWithNegativeProsperity, 10);

      expect(result.prosperityRaw).toBe(5);
      expect(result).not.toBe(townWithNegativeProsperity);

      // Original town should be unchanged
      expect(townWithNegativeProsperity.prosperityRaw).toBe(-5);
    });

    it('should preserve revealed object reference', () => {
      const result = addProsperity(mockTown, 5);

      // The revealed object should be the same reference (not copied)
      expect(result.revealed).toBe(mockTown.revealed);

      // But the town object itself should be new
      expect(result).not.toBe(mockTown);
    });
  });

  describe('addMilitary', () => {
    const mockTown: Town = {
      id: 'test-town-1',
      name: 'Test Town',
      resources: {
        fish: 0,
        wood: 0,
        ore: 0
      },
      prices: {
        fish: 0,
        wood: 0,
        ore: 0
      },
      militaryRaw: 5,
      prosperityRaw: 10,
      revealed: {
        militaryTier: 'militia',
        prosperityTier: 'struggling',
        lastUpdatedTurn: 3
      }
    };

    it('should increment positive delta correctly', () => {
      const result = addMilitary(mockTown, 5);

      expect(result.militaryRaw).toBe(10);
      expect(result).not.toBe(mockTown); // Immutability check

      // Original town should be unchanged
      expect(mockTown.militaryRaw).toBe(5);
    });

    it('should decrement with negative delta correctly', () => {
      const result = addMilitary(mockTown, -3);

      expect(result.militaryRaw).toBe(2);
      expect(result).not.toBe(mockTown);

      // Original town should be unchanged
      expect(mockTown.militaryRaw).toBe(5);
    });

    it('should handle zero delta correctly', () => {
      const result = addMilitary(mockTown, 0);

      expect(result.militaryRaw).toBe(5);
      expect(result).not.toBe(mockTown);

      // Original town should be unchanged
      expect(mockTown.militaryRaw).toBe(5);
    });

    it('should handle large negative delta correctly', () => {
      const result = addMilitary(mockTown, -10);

      expect(result.militaryRaw).toBe(-5);
      expect(result).not.toBe(mockTown);

      // Original town should be unchanged
      expect(mockTown.militaryRaw).toBe(5);
    });

    it('should reject non-integer delta', () => {
      expect(() => addMilitary(mockTown, 3.5)).toThrow();
      expect(() => addMilitary(mockTown, NaN)).toThrow();
      expect(() => addMilitary(mockTown, Infinity)).toThrow();

      try {
        addMilitary(mockTown, 3.5);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Delta must be an integer');
        expect((error as Error).message).toContain('3.5');
      }
    });

    it('should preserve revealed military tier unchanged', () => {
      const result = addMilitary(mockTown, 20);

      expect(result.militaryRaw).toBe(25);
      expect(result.revealed.militaryTier).toBe('militia');
      expect(result.revealed.militaryTier).toBe(mockTown.revealed.militaryTier);

      // Original town should be unchanged
      expect(mockTown.militaryRaw).toBe(5);
      expect(mockTown.revealed.militaryTier).toBe('militia');
    });

    it('should preserve all other town properties', () => {
      const result = addMilitary(mockTown, 5);

      expect(result.id).toBe(mockTown.id);
      expect(result.name).toBe(mockTown.name);
      expect(result.resources).toBe(mockTown.resources);
      expect(result.prices).toBe(mockTown.prices);
      expect(result.prosperityRaw).toBe(mockTown.prosperityRaw);
      expect(result.revealed).toBe(mockTown.revealed);

      // Only militaryRaw should be different
      expect(result.militaryRaw).toBe(10);
      expect(mockTown.militaryRaw).toBe(5);
    });

    it('should handle town with negative military', () => {
      const townWithNegativeMilitary: Town = {
        ...mockTown,
        militaryRaw: -5
      };

      const result = addMilitary(townWithNegativeMilitary, 10);

      expect(result.militaryRaw).toBe(5);
      expect(result).not.toBe(townWithNegativeMilitary);

      // Original town should be unchanged
      expect(townWithNegativeMilitary.militaryRaw).toBe(-5);
    });

    it('should preserve revealed object reference', () => {
      const result = addMilitary(mockTown, 5);

      // The revealed object should be the same reference (not copied)
      expect(result.revealed).toBe(mockTown.revealed);

      // But the town object itself should be new
      expect(result).not.toBe(mockTown);
    });
  });

  describe('advanceTurn', () => {
    const mockState: GameState = {
      turn: 5,
      version: 2,
      rngSeed: 'test-seed-123',
      towns: [
        {
          id: 'town-1',
          name: 'Test Town 1',
          resources: { fish: 10, wood: 5, ore: 0 },
          prices: { fish: 2, wood: 3, ore: 1 },
          militaryRaw: 15,
          prosperityRaw: 25,
          revealed: {
            militaryTier: 'garrison',
            prosperityTier: 'modest',
            lastUpdatedTurn: 3
          }
        },
        {
          id: 'town-2',
          name: 'Test Town 2',
          resources: { fish: 0, wood: 20, ore: 8 },
          prices: { fish: 1, wood: 4, ore: 6 },
          militaryRaw: -5,
          prosperityRaw: -10,
          revealed: {
            militaryTier: 'militia',
            prosperityTier: 'struggling',
            lastUpdatedTurn: 1
          }
        }
      ],
      goods: {
        fish: { id: 'fish', name: 'Fish', effects: { prosperityDelta: 2, militaryDelta: 1 } },
        wood: { id: 'wood', name: 'Wood', effects: { prosperityDelta: 1, militaryDelta: 2 } },
        ore: { id: 'ore', name: 'Ore', effects: { prosperityDelta: 3, militaryDelta: 3 } }
      }
    };

    it('should increment turn by 1', () => {
      const result = advanceTurn(mockState);

      expect(result.turn).toBe(6);
      expect(result).not.toBe(mockState); // Immutability check

      // Original state should be unchanged
      expect(mockState.turn).toBe(5);
    });

    it('should preserve all other state properties exactly', () => {
      const result = advanceTurn(mockState);

      // Check that only turn is different
      expect(result.turn).toBe(6);
      expect(mockState.turn).toBe(5);

      // All other properties should be identical
      expect(result.version).toBe(mockState.version);
      expect(result.rngSeed).toBe(mockState.rngSeed);
      expect(result.towns).toBe(mockState.towns);
      expect(result.goods).toBe(mockState.goods);
    });

    it('should preserve towns array reference', () => {
      const result = advanceTurn(mockState);

      // Towns array should be the same reference
      expect(result.towns).toBe(mockState.towns);

      // But the state object itself should be new
      expect(result).not.toBe(mockState);
    });

    it('should preserve goods object reference', () => {
      const result = advanceTurn(mockState);

      // Goods object should be the same reference
      expect(result.goods).toBe(mockState.goods);

      // But the state object itself should be new
      expect(result).not.toBe(mockState);
    });

    it('should handle turn 0 correctly', () => {
      const stateAtTurn0: GameState = {
        ...mockState,
        turn: 0
      };

      const result = advanceTurn(stateAtTurn0);

      expect(result.turn).toBe(1);
      expect(result).not.toBe(stateAtTurn0);

      // Original state should be unchanged
      expect(stateAtTurn0.turn).toBe(0);
    });

    it('should handle large turn numbers correctly', () => {
      const stateAtLargeTurn: GameState = {
        ...mockState,
        turn: 999
      };

      const result = advanceTurn(stateAtLargeTurn);

      expect(result.turn).toBe(1000);
      expect(result).not.toBe(stateAtLargeTurn);

      // Original state should be unchanged
      expect(stateAtLargeTurn.turn).toBe(999);
    });

    it('should handle negative turn numbers correctly', () => {
      const stateAtNegativeTurn: GameState = {
        ...mockState,
        turn: -5
      };

      const result = advanceTurn(stateAtNegativeTurn);

      expect(result.turn).toBe(-4);
      expect(result).not.toBe(stateAtNegativeTurn);

      // Original state should be unchanged
      expect(stateAtNegativeTurn.turn).toBe(-5);
    });

    it('should preserve complex nested structures', () => {
      const result = advanceTurn(mockState);

      // Verify town properties are preserved
      expect(result.towns[0]?.id).toBe('town-1');
      expect(result.towns[0]?.resources.fish).toBe(10);
      expect(result.towns[0]?.revealed.militaryTier).toBe('garrison');

      expect(result.towns[1]?.id).toBe('town-2');
      expect(result.towns[1]?.militaryRaw).toBe(-5);
      expect(result.towns[1]?.revealed.prosperityTier).toBe('struggling');

      // Verify goods properties are preserved
      expect(result.goods.fish.effects.prosperityDelta).toBe(2);
      expect(result.goods.wood.effects.militaryDelta).toBe(2);
      expect(result.goods.ore.effects.prosperityDelta).toBe(3);
    });

    it('should work with empty towns array', () => {
      const stateWithNoTowns: GameState = {
        ...mockState,
        towns: []
      };

      const result = advanceTurn(stateWithNoTowns);

      expect(result.turn).toBe(6);
      expect(result.towns).toBe(stateWithNoTowns.towns); // Same reference
      expect(result.towns).toEqual([]); // Empty array

      // Original state should be unchanged
      expect(stateWithNoTowns.turn).toBe(5);
    });

    it('should work with minimal state', () => {
      const minimalState: GameState = {
        turn: 0,
        version: 1,
        rngSeed: 'minimal',
        towns: [],
        goods: {
          fish: { id: 'fish', name: 'Fish', effects: { prosperityDelta: 0, militaryDelta: 0 } },
          wood: { id: 'wood', name: 'Wood', effects: { prosperityDelta: 0, militaryDelta: 0 } },
          ore: { id: 'ore', name: 'Ore', effects: { prosperityDelta: 0, militaryDelta: 0 } }
        }
      };

      const result = advanceTurn(minimalState);

      expect(result.turn).toBe(1);
      expect(result.version).toBe(1);
      expect(result.rngSeed).toBe('minimal');
      expect(result.towns).toBe(minimalState.towns);
      expect(result.goods).toBe(minimalState.goods);

      // Original state should be unchanged
      expect(minimalState.turn).toBe(0);
    });
  });
});
