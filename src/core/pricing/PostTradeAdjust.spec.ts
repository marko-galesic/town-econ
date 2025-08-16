import { describe, it, expect } from 'vitest';

import type { GameState } from '../../types/GameState';
import type { ValidatedTrade } from '../trade/TradeValidator';

import type { PriceCurveTable } from './Config';
import { createLogRatioPriceMath } from './Curves';
import { applyPostTradeCurve } from './PostTradeAdjust';

describe('PostTradeAdjust', () => {
  // Test data setup
  const mockGameState: GameState = {
    turn: 1,
    version: 1,
    rngSeed: 'test-seed',
    goods: {
      fish: { id: 'fish', name: 'Fish', effects: { prosperityDelta: 2, militaryDelta: 1 } },
      wood: { id: 'wood', name: 'Wood', effects: { prosperityDelta: 1, militaryDelta: 2 } },
      ore: { id: 'ore', name: 'Ore', effects: { prosperityDelta: 3, militaryDelta: 3 } },
    },
    towns: [
      {
        id: 'town1',
        name: 'Seller Town',
        resources: { fish: 50, wood: 30, ore: 20 },
        prices: { fish: 10, wood: 15, ore: 25 },
        treasury: 1000,
        prosperityRaw: 50,
        militaryRaw: 30,
        revealed: {
          militaryTier: 'militia',
          prosperityTier: 'prosperous',
          lastUpdatedTurn: 1,
        },
      },
      {
        id: 'town2',
        name: 'Buyer Town',
        resources: { fish: 20, wood: 40, ore: 15 },
        prices: { fish: 12, wood: 14, ore: 28 },
        treasury: 800,
        prosperityRaw: 40,
        militaryRaw: 25,
        revealed: {
          militaryTier: 'militia',
          prosperityTier: 'modest',
          lastUpdatedTurn: 1,
        },
      },
    ],
  };

  const mockPriceCurves: PriceCurveTable = {
    fish: {
      basePrice: 10,
      targetStock: 25, // Lower target to ensure price increases when stock decreases
      elasticity: 1.0,
      minPrice: 1,
      maxPrice: 100,
    },
    wood: {
      basePrice: 15,
      targetStock: 35,
      elasticity: 0.8,
      minPrice: 1,
      maxPrice: 100,
    },
    ore: {
      basePrice: 25,
      targetStock: 20,
      elasticity: 1.2,
      minPrice: 1,
      maxPrice: 100,
    },
  };

  const mockValidatedTrade: ValidatedTrade = {
    from: mockGameState.towns[0]!,
    to: mockGameState.towns[1]!,
    goodId: 'fish',
    qty: 10,
    unitPrice: 12,
    side: 'sell',
  };

  const math = createLogRatioPriceMath();

  describe('applyPostTradeCurve', () => {
    it('should adjust prices correctly after a sell trade', () => {
      // Simulate trade execution by updating stock levels
      const stateAfterTrade: GameState = {
        ...mockGameState,
        towns: [
          {
            ...mockGameState.towns[0]!,
            resources: { ...mockGameState.towns[0]!.resources, fish: 20 }, // 50 - 10, now below target (25)
          },
          {
            ...mockGameState.towns[1]!,
            resources: { ...mockGameState.towns[1]!.resources, fish: 30 }, // 20 + 10, now above target (25)
          },
        ],
      };

      const result = applyPostTradeCurve(
        stateAfterTrade,
        mockValidatedTrade,
        mockPriceCurves,
        math,
      );

      // Seller's price should increase (stock decreased from 50 to 40)
      expect(result.towns[0]!.prices.fish).toBeGreaterThan(mockGameState.towns[0]!.prices.fish);

      // Buyer's price should decrease (stock increased from 20 to 30)
      expect(result.towns[1]!.prices.fish).toBeLessThan(mockGameState.towns[1]!.prices.fish);

      // Other goods' prices should remain unchanged
      expect(result.towns[0]!.prices.wood).toBe(mockGameState.towns[0]!.prices.wood);
      expect(result.towns[0]!.prices.ore).toBe(mockGameState.towns[0]!.prices.ore);
      expect(result.towns[1]!.prices.wood).toBe(mockGameState.towns[1]!.prices.wood);
      expect(result.towns[1]!.prices.ore).toBe(mockGameState.towns[1]!.prices.ore);
    });

    it('should adjust prices correctly after a buy trade', () => {
      const buyTrade: ValidatedTrade = {
        ...mockValidatedTrade,
        side: 'buy',
      };

      // Simulate trade execution by updating stock levels
      const stateAfterTrade: GameState = {
        ...mockGameState,
        towns: [
          {
            ...mockGameState.towns[0]!,
            resources: { ...mockGameState.towns[0]!.resources, fish: 60 }, // 50 + 10, now above target (25)
          },
          {
            ...mockGameState.towns[1]!,
            resources: { ...mockGameState.towns[1]!.resources, fish: 10 }, // 20 - 10, now below target (25)
          },
        ],
      };

      const result = applyPostTradeCurve(stateAfterTrade, buyTrade, mockPriceCurves, math);

      // Seller's price should decrease (stock increased from 50 to 60)
      expect(result.towns[0]!.prices.fish).toBeLessThan(mockGameState.towns[0]!.prices.fish);

      // Buyer's price should increase (stock decreased from 20 to 10)
      expect(result.towns[1]!.prices.fish).toBeGreaterThan(mockGameState.towns[1]!.prices.fish);
    });

    it('should produce deterministic results for fixed inputs', () => {
      const stateAfterTrade: GameState = {
        ...mockGameState,
        towns: [
          {
            ...mockGameState.towns[0]!,
            resources: { ...mockGameState.towns[0]!.resources, fish: 20 }, // Below target (25)
          },
          {
            ...mockGameState.towns[1]!,
            resources: { ...mockGameState.towns[1]!.resources, fish: 30 }, // Above target (25)
          },
        ],
      };

      const result1 = applyPostTradeCurve(
        stateAfterTrade,
        mockValidatedTrade,
        mockPriceCurves,
        math,
      );
      const result2 = applyPostTradeCurve(
        stateAfterTrade,
        mockValidatedTrade,
        mockPriceCurves,
        math,
      );

      expect(result1.towns[0]!.prices.fish).toBe(result2.towns[0]!.prices.fish);
      expect(result1.towns[1]!.prices.fish).toBe(result2.towns[1]!.prices.fish);
    });

    it('should handle different goods correctly', () => {
      const woodTrade: ValidatedTrade = {
        ...mockValidatedTrade,
        goodId: 'wood',
        qty: 5,
      };

      const stateAfterTrade: GameState = {
        ...mockGameState,
        towns: [
          {
            ...mockGameState.towns[0]!,
            resources: { ...mockGameState.towns[0]!.resources, wood: 25 }, // 30 - 5
          },
          {
            ...mockGameState.towns[1]!,
            resources: { ...mockGameState.towns[1]!.resources, wood: 45 }, // 40 + 5
          },
        ],
      };

      const result = applyPostTradeCurve(stateAfterTrade, woodTrade, mockPriceCurves, math);

      // Wood prices should change
      expect(result.towns[0]!.prices.wood).toBeGreaterThan(mockGameState.towns[0]!.prices.wood);
      expect(result.towns[1]!.prices.wood).toBeLessThan(mockGameState.towns[1]!.prices.wood);

      // Fish prices should remain unchanged
      expect(result.towns[0]!.prices.fish).toBe(mockGameState.towns[0]!.prices.fish);
      expect(result.towns[1]!.prices.fish).toBe(mockGameState.towns[1]!.prices.fish);
    });

    it('should respect price bounds from configuration', () => {
      const extremeCurves: PriceCurveTable = {
        ...mockPriceCurves,
        fish: {
          ...mockPriceCurves.fish,
          minPrice: 5,
          maxPrice: 20,
        },
      };

      const stateAfterTrade: GameState = {
        ...mockGameState,
        towns: [
          {
            ...mockGameState.towns[0]!,
            resources: { ...mockGameState.towns[0]!.resources, fish: 5 }, // Very low stock
          },
          {
            ...mockGameState.towns[1]!,
            resources: { ...mockGameState.towns[1]!.resources, fish: 100 }, // Very high stock
          },
        ],
      };

      const result = applyPostTradeCurve(stateAfterTrade, mockValidatedTrade, extremeCurves, math);

      // Prices should be clamped to bounds
      expect(result.towns[0]!.prices.fish).toBeGreaterThanOrEqual(5);
      expect(result.towns[0]!.prices.fish).toBeLessThanOrEqual(20);
      expect(result.towns[1]!.prices.fish).toBeGreaterThanOrEqual(5);
      expect(result.towns[1]!.prices.fish).toBeLessThanOrEqual(20);
    });

    it('should throw error for missing price curve configuration', () => {
      const invalidCurves = {
        wood: mockPriceCurves.wood,
        ore: mockPriceCurves.ore,
        // fish is intentionally omitted to test missing configuration
      } as PriceCurveTable;

      const stateAfterTrade: GameState = {
        ...mockGameState,
        towns: [
          {
            ...mockGameState.towns[0]!,
            resources: { ...mockGameState.towns[0]!.resources, fish: 40 },
          },
          {
            ...mockGameState.towns[1]!,
            resources: { ...mockGameState.towns[1]!.resources, fish: 30 },
          },
        ],
      };

      expect(() => {
        applyPostTradeCurve(stateAfterTrade, mockValidatedTrade, invalidCurves, math);
      }).toThrow('No price curve configuration found for good: fish');
    });

    it('should handle edge case of very small stock changes', () => {
      const smallTrade: ValidatedTrade = {
        ...mockValidatedTrade,
        qty: 1,
      };

      const stateAfterTrade: GameState = {
        ...mockGameState,
        towns: [
          {
            ...mockGameState.towns[0]!,
            resources: { ...mockGameState.towns[0]!.resources, fish: 15 }, // 50 - 1, now well below target (25)
          },
          {
            ...mockGameState.towns[1]!,
            resources: { ...mockGameState.towns[1]!.resources, fish: 35 }, // 20 + 1, now well above target (25)
          },
        ],
      };

      const result = applyPostTradeCurve(stateAfterTrade, smallTrade, mockPriceCurves, math);

      // Even small changes should produce price adjustments
      expect(result.towns[0]!.prices.fish).toBeGreaterThan(mockGameState.towns[0]!.prices.fish);
      expect(result.towns[1]!.prices.fish).toBeLessThan(mockGameState.towns[1]!.prices.fish);
    });
  });
});
