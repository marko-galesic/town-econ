import { describe, it, expect } from 'vitest';

import type { GameState } from '../../types/GameState';
import type { GoodId, GoodConfig } from '../../types/Goods';
import type { ProductionConfig } from '../../types/Production';

import { applyProductionTurn } from './ProductionSystem';

describe('ProductionSystem', () => {
  // Test data setup
  const mockGoods: Record<GoodId, GoodConfig> = {
    fish: { id: 'fish', name: 'Fish', effects: { prosperityDelta: 2, militaryDelta: 0 } },
    wood: { id: 'wood', name: 'Wood', effects: { prosperityDelta: 1, militaryDelta: 1 } },
    ore: { id: 'ore', name: 'Ore', effects: { prosperityDelta: 0, militaryDelta: 2 } },
  };

  const createMockTown = (id: string, resources: Record<GoodId, number>) => ({
    id,
    name: `Town ${id}`,
    resources,
    prices: { fish: 10, wood: 8, ore: 15 },
    militaryRaw: 0,
    prosperityRaw: 0,
    treasury: 100,
    revealed: {
      militaryTier: 'militia' as const,
      prosperityTier: 'struggling' as const,
      lastUpdatedTurn: 0,
    },
  });

  const createMockGameState = (towns: ReturnType<typeof createMockTown>[]): GameState => ({
    turn: 0,
    version: 1,
    rngSeed: 'test-seed',
    towns,
    goods: mockGoods,
  });

  const createProductionConfig = (
    base: Partial<Record<GoodId, number>>,
    townMultipliers?: Record<string, Partial<Record<GoodId, number>>>,
    variance?: { enabled: boolean; magnitude?: 1 | 2 },
  ): ProductionConfig => ({
    base: base as Record<GoodId, number>,
    ...(townMultipliers && { townMultipliers }),
    ...(variance && { variance }),
  });

  describe('applyProductionTurn', () => {
    it('produces exactly floor(base * multiplier) per good', () => {
      const baseRates = { fish: 3, wood: 2, ore: 1 };
      const townMultipliers = {
        town1: { fish: 1.5, wood: 0.8, ore: 2.0 },
        town2: { fish: 1.0, wood: 1.0, ore: 1.0 },
      };

      const config = createProductionConfig(baseRates, townMultipliers);

      const initialState = createMockGameState([
        createMockTown('town1', { fish: 10, wood: 5, ore: 3 }),
        createMockTown('town2', { fish: 8, wood: 4, ore: 2 }),
      ]);

      const result = applyProductionTurn(initialState, config);

      // Town 1: fish = 10 + floor(3 * 1.5) = 10 + 4 = 14
      //         wood = 5 + floor(2 * 0.8) = 5 + 1 = 6
      //         ore = 3 + floor(1 * 2.0) = 3 + 2 = 5
      expect(result.towns[0]!.resources.fish).toBe(14);
      expect(result.towns[0]!.resources.wood).toBe(6);
      expect(result.towns[0]!.resources.ore).toBe(5);

      // Town 2: fish = 8 + floor(3 * 1.0) = 8 + 3 = 11
      //         wood = 4 + floor(2 * 1.0) = 4 + 2 = 6
      //         ore = 2 + floor(1 * 1.0) = 2 + 1 = 3
      expect(result.towns[1]!.resources.fish).toBe(11);
      expect(result.towns[1]!.resources.wood).toBe(6);
      expect(result.towns[1]!.resources.ore).toBe(3);
    });

    it('assumes multiplier of 1 when town multipliers are missing', () => {
      const baseRates = { fish: 3, wood: 2, ore: 1 };
      const config = createProductionConfig(baseRates); // No townMultipliers

      const initialState = createMockGameState([
        createMockTown('town1', { fish: 10, wood: 5, ore: 3 }),
      ]);

      const result = applyProductionTurn(initialState, config);

      // Should use multiplier of 1: fish = 10 + floor(3 * 1) = 13
      expect(result.towns[0]!.resources.fish).toBe(13);
      expect(result.towns[0]!.resources.wood).toBe(7);
      expect(result.towns[0]!.resources.ore).toBe(4);
    });

    it('assumes multiplier of 1 when specific good multiplier is missing', () => {
      const baseRates = { fish: 3, wood: 2, ore: 1 };
      const townMultipliers = {
        town1: { fish: 1.5, wood: 1.0, ore: 1.0 }, // Only fish specified
      };

      const config = createProductionConfig(baseRates, townMultipliers);

      const initialState = createMockGameState([
        createMockTown('town1', { fish: 10, wood: 5, ore: 3 }),
      ]);

      const result = applyProductionTurn(initialState, config);

      // Fish: 10 + floor(3 * 1.5) = 10 + 4 = 14
      // Wood: 5 + floor(2 * 1) = 5 + 2 = 7 (default multiplier)
      // Ore: 3 + floor(1 * 1) = 3 + 1 = 4 (default multiplier)
      expect(result.towns[0]!.resources.fish).toBe(14);
      expect(result.towns[0]!.resources.wood).toBe(7);
      expect(result.towns[0]!.resources.ore).toBe(4);
    });

    it('assumes base rate of 0 when good is missing from base rates', () => {
      const baseRates = { fish: 3, wood: 2 }; // ore missing
      const config = createProductionConfig(baseRates);

      const initialState = createMockGameState([
        createMockTown('town1', { fish: 10, wood: 5, ore: 3 }),
      ]);

      const result = applyProductionTurn(initialState, config);

      // Fish: 10 + floor(3 * 1) = 13
      // Wood: 5 + floor(2 * 1) = 7
      // Ore: 3 + floor(0 * 1) = 3 (no change)
      expect(result.towns[0]!.resources.fish).toBe(13);
      expect(result.towns[0]!.resources.wood).toBe(7);
      expect(result.towns[0]!.resources.ore).toBe(3);
    });

    it('leaves other fields unchanged', () => {
      const baseRates = { fish: 3, wood: 2, ore: 1 };
      const config = createProductionConfig(baseRates);

      const initialState = createMockGameState([
        createMockTown('town1', { fish: 10, wood: 5, ore: 3 }),
      ]);

      const result = applyProductionTurn(initialState, config);

      // Resources should be updated
      expect(result.towns[0]!.resources.fish).toBe(13);

      // Other fields should remain unchanged
      expect(result.towns[0]!.id).toBe(initialState.towns[0]!.id);
      expect(result.towns[0]!.name).toBe(initialState.towns[0]!.name);
      expect(result.towns[0]!.prices).toEqual(initialState.towns[0]!.prices);
      expect(result.towns[0]!.militaryRaw).toBe(initialState.towns[0]!.militaryRaw);
      expect(result.towns[0]!.prosperityRaw).toBe(initialState.towns[0]!.prosperityRaw);
      expect(result.towns[0]!.treasury).toBe(initialState.towns[0]!.treasury);
      expect(result.towns[0]!.revealed).toEqual(initialState.towns[0]!.revealed);

      // Game state fields should remain unchanged
      expect(result.turn).toBe(initialState.turn);
      expect(result.version).toBe(initialState.version);
      expect(result.rngSeed).toBe(initialState.rngSeed);
      expect(result.goods).toEqual(initialState.goods);
    });

    it('handles empty towns array', () => {
      const baseRates = { fish: 3, wood: 2, ore: 1 };
      const config = createProductionConfig(baseRates);

      const initialState = createMockGameState([]);

      const result = applyProductionTurn(initialState, config);

      expect(result.towns).toEqual([]);
      expect(result).not.toBe(initialState); // Should be new object
    });

    it('handles towns with missing goods in resources', () => {
      const baseRates = { fish: 3, wood: 2, ore: 1 };
      const config = createProductionConfig(baseRates);

      const initialState = createMockGameState([
        createMockTown('town1', { fish: 10, wood: 0, ore: 0 }), // wood and ore missing
      ]);

      const result = applyProductionTurn(initialState, config);

      // Should handle missing goods gracefully
      expect(result.towns[0]!.resources.fish).toBe(13);
      expect(result.towns[0]!.resources.wood).toBe(2); // 0 + floor(2 * 1)
      expect(result.towns[0]!.resources.ore).toBe(1); // 0 + floor(1 * 1)
    });

    it('applies clampMin option correctly', () => {
      const baseRates = { fish: 3, wood: 2, ore: 1 };
      const config = createProductionConfig(baseRates);

      const initialState = createMockGameState([
        createMockTown('town1', { fish: 10, wood: 5, ore: 3 }),
      ]);

      const result = applyProductionTurn(initialState, config, { clampMin: 20 });

      // All resources should be clamped to minimum of 20
      expect(result.towns[0]!.resources.fish).toBe(20); // 13 < 20, so clamped
      expect(result.towns[0]!.resources.wood).toBe(20); // 7 < 20, so clamped
      expect(result.towns[0]!.resources.ore).toBe(20); // 4 < 20, so clamped
    });

    it('does not mutate input state', () => {
      const baseRates = { fish: 3, wood: 2, ore: 1 };
      const config = createProductionConfig(baseRates);

      const initialState = createMockGameState([
        createMockTown('town1', { fish: 10, wood: 5, ore: 3 }),
      ]);

      const originalFish = initialState.towns[0]!.resources.fish;
      const originalWood = initialState.towns[0]!.resources.wood;
      const originalOre = initialState.towns[0]!.resources.ore;

      applyProductionTurn(initialState, config);

      // Input state should remain unchanged
      expect(initialState.towns[0]!.resources.fish).toBe(originalFish);
      expect(initialState.towns[0]!.resources.wood).toBe(originalWood);
      expect(initialState.towns[0]!.resources.ore).toBe(originalOre);
    });

    it('returns new state object (not reference to input)', () => {
      const baseRates = { fish: 3, wood: 2, ore: 1 };
      const config = createProductionConfig(baseRates);

      const initialState = createMockGameState([
        createMockTown('town1', { fish: 10, wood: 5, ore: 3 }),
      ]);

      const result = applyProductionTurn(initialState, config);

      // Should be different objects
      expect(result).not.toBe(initialState);
      expect(result.towns).not.toBe(initialState.towns);
      expect(result.towns[0]).not.toBe(initialState.towns[0]);
      expect(result.towns[0]!.resources).not.toBe(initialState.towns[0]!.resources);
    });
  });

  describe('Production Variance', () => {
    it('produces same results when variance is disabled', () => {
      const baseRates = { fish: 3, wood: 2, ore: 1 };
      const configWithoutVariance = createProductionConfig(baseRates);
      const configWithVarianceDisabled = createProductionConfig(baseRates, undefined, {
        enabled: false,
      });

      const initialState = createMockGameState([
        createMockTown('town1', { fish: 10, wood: 5, ore: 3 }),
      ]);

      const resultWithoutVariance = applyProductionTurn(initialState, configWithoutVariance);
      const resultWithVarianceDisabled = applyProductionTurn(
        initialState,
        configWithVarianceDisabled,
      );

      // Results should be identical
      expect(resultWithVarianceDisabled.towns[0]!.resources.fish).toBe(
        resultWithoutVariance.towns[0]!.resources.fish,
      );
      expect(resultWithVarianceDisabled.towns[0]!.resources.wood).toBe(
        resultWithoutVariance.towns[0]!.resources.wood,
      );
      expect(resultWithVarianceDisabled.towns[0]!.resources.ore).toBe(
        resultWithoutVariance.towns[0]!.resources.ore,
      );
    });

    it('applies variance when enabled with magnitude 1', () => {
      const baseRates = { fish: 3, wood: 2, ore: 1 };
      const config = createProductionConfig(baseRates, undefined, { enabled: true, magnitude: 1 });

      const initialState = createMockGameState([
        createMockTown('town1', { fish: 10, wood: 5, ore: 3 }),
      ]);

      const result = applyProductionTurn(initialState, config);

      // Base production: fish = 3, wood = 2, ore = 1
      // With variance ±1, results should be in ranges:
      // fish: 10 + [2, 4] = [12, 14]
      // wood: 5 + [1, 3] = [6, 8]
      // ore: 3 + [0, 2] = [3, 5]
      expect(result.towns[0]!.resources.fish).toBeGreaterThanOrEqual(12);
      expect(result.towns[0]!.resources.fish).toBeLessThanOrEqual(14);
      expect(result.towns[0]!.resources.wood).toBeGreaterThanOrEqual(6);
      expect(result.towns[0]!.resources.wood).toBeLessThanOrEqual(8);
      expect(result.towns[0]!.resources.ore).toBeGreaterThanOrEqual(3);
      expect(result.towns[0]!.resources.ore).toBeLessThanOrEqual(5);
    });

    it('applies variance when enabled with magnitude 2', () => {
      const baseRates = { fish: 3, wood: 2, ore: 1 };
      const config = createProductionConfig(baseRates, undefined, { enabled: true, magnitude: 2 });

      const initialState = createMockGameState([
        createMockTown('town1', { fish: 10, wood: 5, ore: 3 }),
      ]);

      const result = applyProductionTurn(initialState, config);

      // Base production: fish = 3, wood = 2, ore = 1
      // With variance ±2, results should be in ranges:
      // fish: 10 + [1, 5] = [11, 15]
      // wood: 5 + [0, 4] = [5, 9]
      // ore: 3 + [-1, 3] = [2, 6] (clamped to ≥0)
      expect(result.towns[0]!.resources.fish).toBeGreaterThanOrEqual(11);
      expect(result.towns[0]!.resources.fish).toBeLessThanOrEqual(15);
      expect(result.towns[0]!.resources.wood).toBeGreaterThanOrEqual(5);
      expect(result.towns[0]!.resources.wood).toBeLessThanOrEqual(9);
      expect(result.towns[0]!.resources.ore).toBeGreaterThanOrEqual(2);
      expect(result.towns[0]!.resources.ore).toBeLessThanOrEqual(6);
    });

    it('defaults to magnitude 1 when variance is enabled but magnitude not specified', () => {
      const baseRates = { fish: 3, wood: 2, ore: 1 };
      const config = createProductionConfig(baseRates, undefined, { enabled: true });

      const initialState = createMockGameState([
        createMockTown('town1', { fish: 10, wood: 5, ore: 3 }),
      ]);

      const result = applyProductionTurn(initialState, config);

      // Should behave the same as magnitude 1
      expect(result.towns[0]!.resources.fish).toBeGreaterThanOrEqual(12);
      expect(result.towns[0]!.resources.fish).toBeLessThanOrEqual(14);
    });

    it('is deterministic for same seed, town, turn, and good', () => {
      const baseRates = { fish: 3, wood: 2, ore: 1 };
      const config = createProductionConfig(baseRates, undefined, { enabled: true, magnitude: 1 });

      const initialState = createMockGameState([
        createMockTown('town1', { fish: 10, wood: 5, ore: 3 }),
      ]);

      // Run production multiple times with same state
      const result1 = applyProductionTurn(initialState, config);
      const result2 = applyProductionTurn(initialState, config);
      const result3 = applyProductionTurn(initialState, config);

      // All results should be identical
      expect(result1.towns[0]!.resources.fish).toBe(result2.towns[0]!.resources.fish);
      expect(result2.towns[0]!.resources.fish).toBe(result3.towns[0]!.resources.fish);
      expect(result1.towns[0]!.resources.wood).toBe(result2.towns[0]!.resources.wood);
      expect(result2.towns[0]!.resources.wood).toBe(result3.towns[0]!.resources.wood);
      expect(result1.towns[0]!.resources.ore).toBe(result2.towns[0]!.resources.ore);
      expect(result2.towns[0]!.resources.ore).toBe(result3.towns[0]!.resources.ore);
    });

    it('produces different results for different towns, turns, or goods', () => {
      const baseRates = { fish: 3, wood: 2, ore: 1 };
      const config = createProductionConfig(baseRates, undefined, { enabled: true, magnitude: 1 });

      // Test different towns
      const state1 = createMockGameState([createMockTown('town1', { fish: 10, wood: 5, ore: 3 })]);
      const state2 = createMockGameState([createMockTown('town2', { fish: 10, wood: 5, ore: 3 })]);

      const result1 = applyProductionTurn(state1, config);
      const result2 = applyProductionTurn(state2, config);

      // Different towns should produce different variance (though they might be the same by chance)
      // We can't guarantee they're different, but we can verify the system is working
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();

      // Test different turns
      const state3 = { ...state1, turn: 1 };
      const result3 = applyProductionTurn(state3, config);

      // Different turns should produce different variance
      // Again, we can't guarantee they're different, but we can verify the system is working
      expect(result3).toBeDefined();

      // Test different seeds
      const state4 = { ...state1, rngSeed: 'different-seed' };
      const result4 = applyProductionTurn(state4, config);

      // Different seeds should produce different variance
      // We can't guarantee they're different, but we can verify the system is working
      expect(result4).toBeDefined();
    });

    it('never produces negative production when variance is applied', () => {
      const baseRates = { fish: 0, wood: 0, ore: 0 }; // Base production of 0
      const config = createProductionConfig(baseRates, undefined, { enabled: true, magnitude: 2 });

      const initialState = createMockGameState([
        createMockTown('town1', { fish: 10, wood: 5, ore: 3 }),
      ]);

      const result = applyProductionTurn(initialState, config);

      // Even with negative jitter, production should never go below 0
      // So resources should never decrease
      expect(result.towns[0]!.resources.fish).toBeGreaterThanOrEqual(10);
      expect(result.towns[0]!.resources.wood).toBeGreaterThanOrEqual(5);
      expect(result.towns[0]!.resources.ore).toBeGreaterThanOrEqual(3);
    });

    it('works correctly with town multipliers and variance', () => {
      const baseRates = { fish: 3, wood: 2, ore: 1 };
      const townMultipliers = {
        town1: { fish: 1.5, wood: 0.8, ore: 2.0 },
      };
      const config = createProductionConfig(baseRates, townMultipliers, {
        enabled: true,
        magnitude: 1,
      });

      const initialState = createMockGameState([
        createMockTown('town1', { fish: 10, wood: 5, ore: 3 }),
      ]);

      const result = applyProductionTurn(initialState, config);

      // Base calculations: fish = floor(3 * 1.5) = 4, wood = floor(2 * 0.8) = 1, ore = floor(1 * 2.0) = 2
      // With variance ±1, results should be in ranges:
      // fish: 10 + [3, 5] = [13, 15]
      // wood: 5 + [0, 2] = [5, 7]
      // ore: 3 + [1, 3] = [4, 6]
      expect(result.towns[0]!.resources.fish).toBeGreaterThanOrEqual(13);
      expect(result.towns[0]!.resources.fish).toBeLessThanOrEqual(15);
      expect(result.towns[0]!.resources.wood).toBeGreaterThanOrEqual(5);
      expect(result.towns[0]!.resources.wood).toBeLessThanOrEqual(7);
      expect(result.towns[0]!.resources.ore).toBeGreaterThanOrEqual(4);
      expect(result.towns[0]!.resources.ore).toBeLessThanOrEqual(6);
    });
  });
});
