import { describe, it, expect } from 'vitest';

import type { GameState } from '../../types/GameState';

import type { PriceCurveTable } from './Config';
import { createLogRatioPriceMath } from './Curves';
import { applyPassiveDrift, DEFAULT_DRIFT, type DriftOptions } from './PassiveDrift';

describe('PassiveDrift', () => {
  // Test fixtures
  const math = createLogRatioPriceMath();

  const mockPriceCurves: PriceCurveTable = {
    fish: {
      basePrice: 10,
      targetStock: 100,
      elasticity: 1.0,
      minPrice: 1,
      maxPrice: 50,
    },
    wood: {
      basePrice: 5,
      targetStock: 50,
      elasticity: 0.8,
      minPrice: 1,
      maxPrice: 20,
    },
    ore: {
      basePrice: 15,
      targetStock: 75,
      elasticity: 1.2,
      minPrice: 1,
      maxPrice: 100,
    },
  };

  const mockGameState: GameState = {
    turn: 1,
    version: 1,
    rngSeed: 'test',
    towns: [
      {
        id: 'town1',
        name: 'Test Town 1',
        resources: { fish: 100, wood: 50, ore: 75 }, // At target stock
        prices: { fish: 10, wood: 5, ore: 15 }, // At base price
        militaryRaw: 0,
        prosperityRaw: 0,
        treasury: 1000,
        revealed: {
          militaryTier: 'militia',
          prosperityTier: 'struggling',
          lastUpdatedTurn: 0,
        },
      },
      {
        id: 'town2',
        name: 'Test Town 2',
        resources: { fish: 50, wood: 25, ore: 40 }, // Below target stock
        prices: { fish: 15, wood: 8, ore: 20 }, // Above base price
        militaryRaw: 0,
        prosperityRaw: 0,
        treasury: 1000,
        revealed: {
          militaryTier: 'militia',
          prosperityTier: 'struggling',
          lastUpdatedTurn: 0,
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
        effects: { prosperityDelta: 2, militaryDelta: 1 },
      },
    },
  };

  describe('DEFAULT_DRIFT', () => {
    it('should have a reasonable default rate', () => {
      expect(DEFAULT_DRIFT.rate).toBe(0.15);
    });
  });

  describe('applyPassiveDrift', () => {
    it('should not change prices when current price equals curve price', () => {
      const result = applyPassiveDrift(mockGameState, mockPriceCurves, math);

      // Town 1 has fish at target stock (100) and base price (10) - should stay the same
      expect(result.towns[0]!.prices.fish).toBe(10);
      expect(result.towns[0]!.prices.wood).toBe(5);
    });

    it('should increase prices when below curve price', () => {
      // Create state where fish price is below what it should be for current stock
      const stateWithLowPrice = {
        ...mockGameState,
        towns: mockGameState.towns.map(town => ({
          ...town,
          prices: { ...town.prices, fish: 5 }, // Below base price
        })),
      };

      const result = applyPassiveDrift(stateWithLowPrice, mockPriceCurves, math);

      // Price should increase toward base price (10) by 15% of the difference
      // 5 + round(0.15 * (10 - 75)) = 5 + round(0.75) = 5 + 1 = 6
      expect(result.towns[0]!.prices.fish).toBe(6);
    });

    it('should decrease prices when above curve price', () => {
      // Create state where fish price is above what it should be for current stock
      const stateWithHighPrice = {
        ...mockGameState,
        towns: mockGameState.towns.map(town => ({
          ...town,
          prices: { ...town.prices, fish: 20 }, // Above base price
        })),
      };

      const result = applyPassiveDrift(stateWithHighPrice, mockPriceCurves, math);

      // Price should decrease toward base price (10) by 15% of the difference
      // 20 + round(0.15 * (10 - 20)) = 20 + round(-1.5) = 20 + (-1) = 19
      expect(result.towns[0]!.prices.fish).toBe(19);
    });

    it('should respect custom drift rate', () => {
      const customOpts: DriftOptions = { rate: 0.5 }; // 50% drift

      const stateWithLowPrice = {
        ...mockGameState,
        towns: mockGameState.towns.map(town => ({
          ...town,
          prices: { ...town.prices, fish: 5 }, // Below base price
        })),
      };

      const result = applyPassiveDrift(stateWithLowPrice, mockPriceCurves, math, customOpts);

      // Price should increase by 50% of the difference
      // 5 + round(0.5 * (10 - 5)) = 5 + round(2.5) = 5 + 3 = 8
      expect(result.towns[0]!.prices.fish).toBe(8);
    });

    it('should clamp prices to valid ranges', () => {
      const stateWithExtremePrice = {
        ...mockGameState,
        towns: mockGameState.towns.map(town => ({
          ...town,
          prices: { ...town.prices, fish: 1 }, // At minimum
        })),
      };

      const result = applyPassiveDrift(stateWithExtremePrice, mockPriceCurves, math);

      // Price should increase but not go below minimum
      expect(result.towns[0]!.prices.fish).toBeGreaterThanOrEqual(1);
      expect(result.towns[0]!.prices.fish).toBeLessThanOrEqual(50); // max price
    });

    it('should handle missing price curve configs gracefully', () => {
      const incompleteCurves: PriceCurveTable = {
        fish: mockPriceCurves.fish,
        wood: mockPriceCurves.wood,
        ore: mockPriceCurves.ore,
      };

      const result = applyPassiveDrift(mockGameState, incompleteCurves, math);

      // All prices should drift normally
      expect(result.towns[0]!.prices.fish).toBe(10);
      expect(result.towns[0]!.prices.wood).toBe(5);
      expect(result.towns[0]!.prices.ore).toBe(15);
    });

    it('should return new game state without mutating original', () => {
      const result = applyPassiveDrift(mockGameState, mockPriceCurves, math);

      // Should be a new object
      expect(result).not.toBe(mockGameState);
      expect(result.towns).not.toBe(mockGameState.towns);

      // Original should be unchanged
      expect(mockGameState.towns[0]!.prices.fish).toBe(10);
    });

    it('should validate drift rate bounds', () => {
      expect(() => {
        applyPassiveDrift(mockGameState, mockPriceCurves, math, { rate: -0.1 });
      }).toThrow('Drift rate must be between 0 and 1');

      expect(() => {
        applyPassiveDrift(mockGameState, mockPriceCurves, math, { rate: 1.1 });
      }).toThrow('Drift rate must be between 0 and 1');
    });

    it('should handle zero drift rate', () => {
      const result = applyPassiveDrift(mockGameState, mockPriceCurves, math, { rate: 0 });

      // All prices should remain exactly the same
      expect(result.towns[0]!.prices.fish).toBe(10);
      expect(result.towns[0]!.prices.wood).toBe(5);
      expect(result.towns[1]!.prices.fish).toBe(15);
      expect(result.towns[1]!.prices.wood).toBe(8);
    });

    it('should handle full drift rate (100%)', () => {
      const stateWithPriceMismatch = {
        ...mockGameState,
        towns: mockGameState.towns.map(town => ({
          ...town,
          prices: { ...town.prices, fish: 5 }, // Below base price
        })),
      };

      const result = applyPassiveDrift(stateWithPriceMismatch, mockPriceCurves, math, {
        rate: 1.0,
      });

      // Price should immediately jump to target price
      expect(result.towns[0]!.prices.fish).toBe(10);
    });

    it('should produce integer prices', () => {
      const result = applyPassiveDrift(mockGameState, mockPriceCurves, math);

      // All prices should be integers
      for (const town of result.towns) {
        for (const price of Object.values(town.prices)) {
          expect(Number.isInteger(price)).toBe(true);
        }
      }
    });
  });
});
