import { describe, it, expect, beforeEach } from 'vitest';

import type { GameState } from '../../types/GameState';
import type { GoodId, GoodConfig } from '../../types/Goods';
import type { Town } from '../../types/Town';

import { executeTrade } from './TradeExecutor';
import { DEFAULT_LIMITS } from './TradeLimits';
import type { ValidatedTrade } from './TradeValidator';

describe('TradeExecutor with limits', () => {
  let mockState: GameState;
  let mockGoods: Record<GoodId, GoodConfig>;
  let mockFromTown: Town;
  let mockToTown: Town;
  let mockValidatedTrade: ValidatedTrade;

  beforeEach(() => {
    // Create mock towns with reasonable starting values
    mockFromTown = {
      id: 'from-town',
      name: 'From Town',
      resources: { fish: 1000, wood: 500, ore: 200 },
      treasury: 10000,
      prices: { fish: 10, wood: 5, ore: 15 },
      prosperityRaw: 50,
      militaryRaw: 30,
      revealed: {
        militaryTier: 'militia',
        prosperityTier: 'struggling',
        lastUpdatedTurn: 1,
      },
    };

    mockToTown = {
      id: 'to-town',
      name: 'To Town',
      resources: { fish: 800, wood: 1200, ore: 300 },
      treasury: 15000,
      prices: { fish: 10, wood: 5, ore: 15 },
      prosperityRaw: 60,
      militaryRaw: 40,
      revealed: {
        militaryTier: 'militia',
        prosperityTier: 'struggling',
        lastUpdatedTurn: 1,
      },
    };

    mockState = {
      towns: [mockFromTown, mockToTown],
      turn: 1,
      version: 1,
      rngSeed: '12345',
      goods: mockGoods,
    };

    mockGoods = {
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
    };

    mockValidatedTrade = {
      from: mockFromTown,
      to: mockToTown,
      goodId: 'fish',
      qty: 100,
      unitPrice: 10,
      side: 'sell',
    };
  });

  describe('resource limits', () => {
    it('should clamp resources to maxResource when limits are applied', () => {
      // Create a trade that would result in excessive resources
      const bigTrade: ValidatedTrade = {
        ...mockValidatedTrade,
        qty: 2000000, // This would give toTown 2000800 fish, exceeding DEFAULT_LIMITS.maxResource
        goodId: 'fish',
      };

      const result = executeTrade(mockState, bigTrade, mockGoods, DEFAULT_LIMITS);

      // Check that resources are clamped to maxResource
      const toTown = result.state.towns.find(t => t.id === 'to-town')!;
      expect(toTown.resources.fish).toBe(DEFAULT_LIMITS.maxResource);
    });

    it('should prevent negative resources even without limits', () => {
      // Create a trade that would result in negative resources
      const negativeTrade: ValidatedTrade = {
        ...mockValidatedTrade,
        qty: 2000, // This would give fromTown -1000 fish
        goodId: 'fish',
      };

      const result = executeTrade(mockState, negativeTrade, mockGoods, {});

      // Check that resources are clamped to 0
      const fromTown = result.state.towns.find(t => t.id === 'from-town')!;
      expect(fromTown.resources.fish).toBe(0);
    });

    it('should allow normal trades within limits', () => {
      const normalTrade: ValidatedTrade = {
        ...mockValidatedTrade,
        qty: 100,
        goodId: 'fish',
      };

      const result = executeTrade(mockState, normalTrade, mockGoods, DEFAULT_LIMITS);

      // Check that resources are updated normally
      const fromTown = result.state.towns.find(t => t.id === 'from-town')!;
      const toTown = result.state.towns.find(t => t.id === 'to-town')!;

      expect(fromTown.resources.fish).toBe(900); // 1000 - 100
      expect(toTown.resources.fish).toBe(900); // 800 + 100
    });
  });

  describe('treasury limits', () => {
    it('should clamp treasury to maxTreasury when limits are applied', () => {
      // Create a trade that would result in excessive treasury
      const bigTrade: ValidatedTrade = {
        ...mockValidatedTrade,
        qty: 100000000, // This would give fromTown 1,000,000,000 + 10000 treasury, exceeding limit
        unitPrice: 10,
        goodId: 'fish',
      };

      const result = executeTrade(mockState, bigTrade, mockGoods, DEFAULT_LIMITS);

      // Check that treasury is clamped to maxTreasury
      const fromTown = result.state.towns.find(t => t.id === 'from-town')!;
      expect(fromTown.treasury).toBe(DEFAULT_LIMITS.maxTreasury);
    });

    it('should prevent negative treasury even without limits', () => {
      // Create a trade that would result in negative treasury
      const expensiveTrade: ValidatedTrade = {
        ...mockValidatedTrade,
        qty: 100,
        unitPrice: 200, // This would cost 20000, but fromTown only has 10000
        goodId: 'fish',
        side: 'buy',
      };

      const result = executeTrade(mockState, expensiveTrade, mockGoods, {});

      // Check that treasury is clamped to 0
      const fromTown = result.state.towns.find(t => t.id === 'from-town')!;
      expect(fromTown.treasury).toBe(0);
    });

    it('should allow normal treasury transactions within limits', () => {
      const normalTrade: ValidatedTrade = {
        ...mockValidatedTrade,
        qty: 100,
        unitPrice: 10,
        goodId: 'fish',
      };

      const result = executeTrade(mockState, normalTrade, mockGoods, DEFAULT_LIMITS);

      // Check that treasury is updated normally
      const fromTown = result.state.towns.find(t => t.id === 'from-town')!;
      const toTown = result.state.towns.find(t => t.id === 'to-town')!;

      expect(fromTown.treasury).toBe(11000); // 10000 + (100 * 10)
      expect(toTown.treasury).toBe(14000); // 15000 - (100 * 10)
    });
  });

  describe('buy vs sell behavior', () => {
    it('should handle buy transactions with limits', () => {
      const buyTrade: ValidatedTrade = {
        ...mockValidatedTrade,
        side: 'buy',
        qty: 2000000, // This would give fromTown 2001000 fish, exceeding limits
        goodId: 'fish',
      };

      const result = executeTrade(mockState, buyTrade, mockGoods, DEFAULT_LIMITS);

      // Check that resources are clamped for buyer
      const fromTown = result.state.towns.find(t => t.id === 'from-town')!;
      expect(fromTown.resources.fish).toBe(DEFAULT_LIMITS.maxResource);
    });

    it('should handle sell transactions with limits', () => {
      const sellTrade: ValidatedTrade = {
        ...mockValidatedTrade,
        side: 'sell',
        qty: 2000000, // This would give toTown 2000800 fish, exceeding limits
        goodId: 'fish',
      };

      const result = executeTrade(mockState, sellTrade, mockGoods, DEFAULT_LIMITS);

      // Check that resources are clamped for seller
      const toTown = result.state.towns.find(t => t.id === 'to-town')!;
      expect(toTown.resources.fish).toBe(DEFAULT_LIMITS.maxResource);
    });
  });

  describe('edge cases', () => {
    it('should handle zero quantity trades', () => {
      const zeroTrade: ValidatedTrade = {
        ...mockValidatedTrade,
        qty: 0,
      };

      const result = executeTrade(mockState, zeroTrade, mockGoods, DEFAULT_LIMITS);

      // Check that nothing changes
      const fromTown = result.state.towns.find(t => t.id === 'from-town')!;
      const toTown = result.state.towns.find(t => t.id === 'to-town')!;

      expect(fromTown.resources.fish).toBe(1000);
      expect(toTown.resources.fish).toBe(800);
      expect(fromTown.treasury).toBe(10000);
      expect(toTown.treasury).toBe(15000);
    });

    it('should handle trades with no limits specified', () => {
      const bigTrade: ValidatedTrade = {
        ...mockValidatedTrade,
        qty: 10000,
        goodId: 'fish',
      };

      const result = executeTrade(mockState, bigTrade, mockGoods, undefined);

      // Check that no limits are applied (only negative prevention)
      const fromTown = result.state.towns.find(t => t.id === 'from-town')!;
      const toTown = result.state.towns.find(t => t.id === 'to-town')!;

      expect(fromTown.resources.fish).toBe(0); // Clamped to 0, not negative
      expect(toTown.resources.fish).toBe(10800); // 800 + 10000
    });
  });
});
