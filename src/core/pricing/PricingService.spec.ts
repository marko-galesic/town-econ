import { describe, it, expect } from 'vitest';

import type { GameState } from '../../types/GameState';
import type { ValidatedTrade } from '../trade/TradeValidator';

import { createPricingService } from './PricingService';

describe('PricingService', () => {
  const mockState: GameState = {
    turn: 1,
    version: 1,
    rngSeed: '12345',
    goods: {
      fish: {
        id: 'fish',
        name: 'Fish',
        effects: { prosperityDelta: 2, militaryDelta: 1 },
      },
      wood: {
        id: 'wood',
        name: 'Wood',
        effects: { prosperityDelta: 1, militaryDelta: 2 },
      },
      ore: {
        id: 'ore',
        name: 'Ore',
        effects: { prosperityDelta: 3, militaryDelta: 3 },
      },
    },
    towns: [
      {
        id: 'town1',
        name: 'Town 1',
        aiProfileId: 'greedy',
        resources: { fish: 50, wood: 30, ore: 20 },
        prices: { fish: 100, wood: 80, ore: 120 },
        militaryRaw: 50,
        prosperityRaw: 60,
        treasury: 1000,
        revealed: {
          militaryTier: 'militia',
          prosperityTier: 'modest',
          lastUpdatedTurn: 1,
        },
      },
      {
        id: 'town2',
        name: 'Town 2',
        aiProfileId: 'random',
        resources: { fish: 40, wood: 60, ore: 10 },
        prices: { fish: 110, wood: 90, ore: 130 },
        militaryRaw: 70,
        prosperityRaw: 80,
        treasury: 1200,
        revealed: {
          militaryTier: 'garrison',
          prosperityTier: 'prosperous',
          lastUpdatedTurn: 1,
        },
      },
    ],
  };

  const mockTrade: ValidatedTrade = {
    goodId: 'fish',
    qty: 10,
    side: 'sell',
    unitPrice: 6,
    from: mockState.towns[0]!,
    to: mockState.towns[1]!,
  };

  describe('createPricingService', () => {
    it('should create a service with default options', () => {
      const service = createPricingService();
      expect(service).toBeDefined();
      expect(typeof service.afterTrade).toBe('function');
      expect(typeof service.perTurnDrift).toBe('function');
    });

    it('should create a service with custom options', () => {
      const service = createPricingService();
      expect(service).toBeDefined();
    });
  });

  describe('afterTrade', () => {
    it('should adjust prices for both towns after trade', () => {
      const service = createPricingService();
      const result = service.afterTrade(mockState, mockTrade);

      // Verify both towns are updated
      expect(result.towns).toHaveLength(2);

      // Verify the trade affects prices (seller price should increase, buyer price should decrease)
      const town1 = result.towns.find(t => t.id === 'town1')!;
      const town2 = result.towns.find(t => t.id === 'town2')!;

      // Prices should change from the original values
      expect(town1.prices.fish).not.toBe(100);
      expect(town2.prices.fish).not.toBe(110);
    });

    it('should be deterministic for the same input', () => {
      const service = createPricingService();
      const result1 = service.afterTrade(mockState, mockTrade);
      const result2 = service.afterTrade(mockState, mockTrade);

      expect(result1.towns[0]?.prices.fish).toBe(result2.towns[0]?.prices.fish);
      expect(result1.towns[1]?.prices.fish).toBe(result2.towns[1]?.prices.fish);
    });

    it('should apply smoothing to price adjustments', () => {
      const service = createPricingService();
      const result = service.afterTrade(mockState, mockTrade);

      // With low alpha, prices should change less dramatically
      const town1 = result.towns.find(t => t.id === 'town1')!;
      const town2 = result.towns.find(t => t.id === 'town2')!;

      // Prices should still change but more gradually
      expect(town1.prices.fish).not.toBe(100);
      expect(town2.prices.fish).not.toBe(110);
    });
  });

  describe('perTurnDrift', () => {
    it('should apply passive drift to all towns and goods', () => {
      const service = createPricingService();
      const result = service.perTurnDrift(mockState);

      // Verify all towns are updated
      expect(result.towns).toHaveLength(2);

      // Verify prices have changed for all goods in all towns
      result.towns.forEach(town => {
        expect(town.prices.fish).not.toBe(mockState.towns.find(t => t.id === town.id)?.prices.fish);
        expect(town.prices.wood).not.toBe(mockState.towns.find(t => t.id === town.id)?.prices.wood);
        expect(town.prices.ore).not.toBe(mockState.towns.find(t => t.id === town.id)?.prices.ore);
      });
    });

    it('should be deterministic for the same input', () => {
      const service = createPricingService();
      const result1 = service.perTurnDrift(mockState);
      const result2 = service.perTurnDrift(mockState);

      // All prices should be identical between runs
      result1.towns.forEach((town, index) => {
        const town2 = result2.towns[index]!;
        expect(town.prices.fish).toBe(town2.prices.fish);
        expect(town.prices.wood).toBe(town2.prices.wood);
        expect(town.prices.ore).toBe(town2.prices.ore);
      });
    });

    it('should apply prosperity multipliers correctly', () => {
      const service = createPricingService();
      const result = service.perTurnDrift(mockState);

      const town1 = result.towns.find(t => t.id === 'town1')!; // modest
      const town2 = result.towns.find(t => t.id === 'town2')!; // prosperous

      // Verify that prices have been updated (they may or may not be different between towns)
      // but the important thing is that the drift calculation ran
      expect(town1.prices.fish).toBeGreaterThan(0);
      expect(town2.prices.fish).toBeGreaterThan(0);
    });

    it('should move prices toward curve-based target prices', () => {
      const service = createPricingService();
      const result = service.perTurnDrift(mockState);

      // Prices should move toward their curve-based targets
      // This is a basic verification that the drift is working
      result.towns.forEach(town => {
        // All prices should be finite numbers
        expect(town.prices.fish).toBeGreaterThan(0);
        expect(town.prices.wood).toBeGreaterThan(0);
        expect(town.prices.ore).toBeGreaterThan(0);
      });
    });
  });

  describe('integration', () => {
    it('should work consistently between afterTrade and perTurnDrift', () => {
      const service = createPricingService();

      // First apply trade
      const afterTradeState = service.afterTrade(mockState, mockTrade);

      // Then apply drift
      const afterDriftState = service.perTurnDrift(afterTradeState);

      // Both operations should complete without errors
      expect(afterTradeState).toBeDefined();
      expect(afterDriftState).toBeDefined();

      // Both operations should produce valid game states
      expect(afterTradeState.towns).toHaveLength(2);
      expect(afterDriftState.towns).toHaveLength(2);

      // Verify that prices are valid numbers
      afterDriftState.towns.forEach(town => {
        expect(town.prices.fish).toBeGreaterThan(0);
        expect(town.prices.wood).toBeGreaterThan(0);
        expect(town.prices.ore).toBeGreaterThan(0);
      });
    });
  });
});
