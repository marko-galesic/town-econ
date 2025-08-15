import { describe, it, expect } from 'vitest';

import type { GameState, GoodId } from '../../types/GameState';
import type { ProductionConfig } from '../../types/Production';

import { applyProductionTurn } from './ProductionSystem';

describe('ProductionSystem', () => {
  // Test data setup
  const mockGoods: Record<GoodId, { name: string; description: string }> = {
    fish: { name: 'Fish', description: 'Fresh fish' },
    wood: { name: 'Wood', description: 'Timber' },
    ore: { name: 'Ore', description: 'Raw ore' },
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
      militaryTier: 'weak' as const,
      prosperityTier: 'poor' as const,
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
    base: Record<GoodId, number>,
    townMultipliers?: Record<string, Record<GoodId, number>>,
  ): ProductionConfig => ({
    base,
    townMultipliers,
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
      expect(result.towns[0].resources.fish).toBe(14);
      expect(result.towns[0].resources.wood).toBe(6);
      expect(result.towns[0].resources.ore).toBe(5);

      // Town 2: fish = 8 + floor(3 * 1.0) = 8 + 3 = 11
      //         wood = 4 + floor(2 * 1.0) = 4 + 2 = 6
      //         ore = 2 + floor(1 * 1.0) = 2 + 1 = 3
      expect(result.towns[1].resources.fish).toBe(11);
      expect(result.towns[1].resources.wood).toBe(6);
      expect(result.towns[1].resources.ore).toBe(3);
    });

    it('assumes multiplier of 1 when town multipliers are missing', () => {
      const baseRates = { fish: 3, wood: 2, ore: 1 };
      const config = createProductionConfig(baseRates); // No townMultipliers

      const initialState = createMockGameState([
        createMockTown('town1', { fish: 10, wood: 5, ore: 3 }),
      ]);

      const result = applyProductionTurn(initialState, config);

      // Should use multiplier of 1: fish = 10 + floor(3 * 1) = 13
      expect(result.towns[0].resources.fish).toBe(13);
      expect(result.towns[0].resources.wood).toBe(7);
      expect(result.towns[0].resources.ore).toBe(4);
    });

    it('assumes multiplier of 1 when specific good multiplier is missing', () => {
      const baseRates = { fish: 3, wood: 2, ore: 1 };
      const townMultipliers = {
        town1: { fish: 1.5 }, // Only fish specified
      };

      const config = createProductionConfig(baseRates, townMultipliers);

      const initialState = createMockGameState([
        createMockTown('town1', { fish: 10, wood: 5, ore: 3 }),
      ]);

      const result = applyProductionTurn(initialState, config);

      // Fish: 10 + floor(3 * 1.5) = 10 + 4 = 14
      // Wood: 5 + floor(2 * 1) = 5 + 2 = 7 (default multiplier)
      // Ore: 3 + floor(1 * 1) = 3 + 1 = 4 (default multiplier)
      expect(result.towns[0].resources.fish).toBe(14);
      expect(result.towns[0].resources.wood).toBe(7);
      expect(result.towns[0].resources.ore).toBe(4);
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
      expect(result.towns[0].resources.fish).toBe(13);
      expect(result.towns[0].resources.wood).toBe(7);
      expect(result.towns[0].resources.ore).toBe(3);
    });

    it('leaves other fields unchanged', () => {
      const baseRates = { fish: 3, wood: 2, ore: 1 };
      const config = createProductionConfig(baseRates);

      const initialState = createMockGameState([
        createMockTown('town1', { fish: 10, wood: 5, ore: 3 }),
      ]);

      const result = applyProductionTurn(initialState, config);

      // Resources should be updated
      expect(result.towns[0].resources.fish).toBe(13);

      // Other fields should remain unchanged
      expect(result.towns[0].id).toBe(initialState.towns[0].id);
      expect(result.towns[0].name).toBe(initialState.towns[0].name);
      expect(result.towns[0].prices).toEqual(initialState.towns[0].prices);
      expect(result.towns[0].militaryRaw).toBe(initialState.towns[0].militaryRaw);
      expect(result.towns[0].prosperityRaw).toBe(initialState.towns[0].prosperityRaw);
      expect(result.towns[0].treasury).toBe(initialState.towns[0].treasury);
      expect(result.towns[0].revealed).toEqual(initialState.towns[0].revealed);

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
        createMockTown('town1', { fish: 10 }), // wood and ore missing
      ]);

      const result = applyProductionTurn(initialState, config);

      // Should handle missing goods gracefully
      expect(result.towns[0].resources.fish).toBe(13);
      expect(result.towns[0].resources.wood).toBe(2); // 0 + floor(2 * 1)
      expect(result.towns[0].resources.ore).toBe(1); // 0 + floor(1 * 1)
    });

    it('applies clampMin option correctly', () => {
      const baseRates = { fish: 3, wood: 2, ore: 1 };
      const config = createProductionConfig(baseRates);

      const initialState = createMockGameState([
        createMockTown('town1', { fish: 10, wood: 5, ore: 3 }),
      ]);

      const result = applyProductionTurn(initialState, config, { clampMin: 20 });

      // All resources should be clamped to minimum of 20
      expect(result.towns[0].resources.fish).toBe(20); // 13 < 20, so clamped
      expect(result.towns[0].resources.wood).toBe(20); // 7 < 20, so clamped
      expect(result.towns[0].resources.ore).toBe(20); // 4 < 20, so clamped
    });

    it('does not mutate input state', () => {
      const baseRates = { fish: 3, wood: 2, ore: 1 };
      const config = createProductionConfig(baseRates);

      const initialState = createMockGameState([
        createMockTown('town1', { fish: 10, wood: 5, ore: 3 }),
      ]);

      const originalFish = initialState.towns[0].resources.fish;
      const originalWood = initialState.towns[0].resources.wood;
      const originalOre = initialState.towns[0].resources.ore;

      applyProductionTurn(initialState, config);

      // Input state should remain unchanged
      expect(initialState.towns[0].resources.fish).toBe(originalFish);
      expect(initialState.towns[0].resources.wood).toBe(originalWood);
      expect(initialState.towns[0].resources.ore).toBe(originalOre);
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
      expect(result.towns[0].resources).not.toBe(initialState.towns[0].resources);
    });
  });
});
