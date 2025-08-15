import { describe, it, expect } from 'vitest';

import type { GameState } from '../../types/GameState';
import type { Town } from '../../types/Town';

import { snapshotMarket, maxAffordable, maxTradableStock } from './Market';

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

describe('Market', () => {
  // Common test data
  const baseTown1: Town = {
    id: 'test-town-1',
    name: 'Test Town 1',
    resources: { fish: 10, wood: 5, ore: 0 },
    prices: { fish: 2, wood: 3, ore: 1 },
    militaryRaw: 15,
    prosperityRaw: 25,
    treasury: 1000,
    revealed: {
      militaryTier: 'garrison',
      prosperityTier: 'modest',
      lastUpdatedTurn: 3,
    },
  };

  const baseTown2: Town = {
    id: 'test-town-2',
    name: 'Test Town 2',
    resources: { fish: 20, wood: 15, ore: 8 },
    prices: { fish: 3, wood: 2, ore: 4 },
    militaryRaw: 20,
    prosperityRaw: 30,
    treasury: 2000,
    revealed: {
      militaryTier: 'host',
      prosperityTier: 'opulent',
      lastUpdatedTurn: 4,
    },
  };

  const baseTown3: Town = {
    id: 'test-town-3',
    name: 'Test Town 3',
    resources: { fish: 0, wood: 0, ore: 0 },
    prices: { fish: 5, wood: 4, ore: 6 },
    militaryRaw: 10,
    prosperityRaw: 15,
    treasury: 500,
    revealed: {
      militaryTier: 'militia',
      prosperityTier: 'struggling',
      lastUpdatedTurn: 2,
    },
  };

  const baseState: GameState = {
    turn: 5,
    version: 2,
    rngSeed: 'test-seed-123',
    towns: [baseTown1, baseTown2, baseTown3],
    goods: {
      fish: { id: 'fish', name: 'Fish', effects: { prosperityDelta: 2, militaryDelta: 1 } },
      wood: { id: 'wood', name: 'Wood', effects: { prosperityDelta: 1, militaryDelta: 2 } },
      ore: { id: 'ore', name: 'Ore', effects: { prosperityDelta: 3, militaryDelta: 3 } },
    },
  };

  describe('snapshotMarket', () => {
    it('should create a snapshot with 3 towns and correct price/stock/treasury mirrors', () => {
      const frozenState = deepFreeze({ ...baseState });
      const snapshot = snapshotMarket(frozenState);

      expect(snapshot.towns).toHaveLength(3);

      // Verify town 1
      expect(snapshot.towns[0]).toEqual({
        id: 'test-town-1',
        prices: { fish: 2, wood: 3, ore: 1 },
        stock: { fish: 10, wood: 5, ore: 0 },
        treasury: 1000,
      });

      // Verify town 2
      expect(snapshot.towns[1]).toEqual({
        id: 'test-town-2',
        prices: { fish: 3, wood: 2, ore: 4 },
        stock: { fish: 20, wood: 15, ore: 8 },
        treasury: 2000,
      });

      // Verify town 3
      expect(snapshot.towns[2]).toEqual({
        id: 'test-town-3',
        prices: { fish: 5, wood: 4, ore: 6 },
        stock: { fish: 0, wood: 0, ore: 0 },
        treasury: 500,
      });
    });

    it('should not mutate the input state', () => {
      const originalState = { ...baseState };
      const frozenState = deepFreeze({ ...baseState });

      snapshotMarket(frozenState);

      // Verify the original state is unchanged
      expect(originalState).toEqual(baseState);
    });

    it('should handle empty towns array', () => {
      const emptyState: GameState = {
        ...baseState,
        towns: [],
      };
      const frozenState = deepFreeze(emptyState);

      const snapshot = snapshotMarket(frozenState);

      expect(snapshot.towns).toHaveLength(0);
    });

    it('should create deep copies of town data', () => {
      const frozenState = deepFreeze({ ...baseState });
      const snapshot = snapshotMarket(frozenState);

      // Modify the snapshot to ensure it doesn't affect the original
      const town0 = snapshot.towns[0];
      if (town0) {
        town0.prices.fish = 999;
        town0.stock.fish = 999;
        town0.treasury = 999;
      }

      // Original state should remain unchanged
      const frozenTown0 = frozenState.towns[0];
      if (frozenTown0) {
        expect(frozenTown0.prices.fish).toBe(2);
        expect(frozenTown0.resources.fish).toBe(10);
        expect(frozenTown0.treasury).toBe(1000);
      }
    });
  });

  describe('maxAffordable', () => {
    it('should clamp quantity by treasury for normal prices', () => {
      expect(maxAffordable(100, 10, 50)).toBe(5); // 50/10 = 5
      expect(maxAffordable(20, 3, 100)).toBe(20); // 100/3 = 33.33..., but 20 < 33
      expect(maxAffordable(5, 25, 100)).toBe(4); // 100/25 = 4
    });

    it('should return 0 when treasury is 0 or negative', () => {
      expect(maxAffordable(100, 10, 0)).toBe(0);
      expect(maxAffordable(100, 10, -50)).toBe(0);
    });

    it('should return 0 when unit price is negative', () => {
      expect(maxAffordable(100, -5, 100)).toBe(0);
    });

    it('should return requested quantity when unit price is 0 (free goods)', () => {
      expect(maxAffordable(100, 0, 100)).toBe(100);
      expect(maxAffordable(50, 0, 0)).toBe(50);
    });

    it('should handle edge cases with very small numbers', () => {
      expect(maxAffordable(1000, 0.1, 1)).toBe(10); // 1/0.1 = 10
      expect(maxAffordable(100, 0.01, 0.5)).toBe(50); // 0.5/0.01 = 50
    });

    it('should handle edge cases with very large numbers', () => {
      expect(maxAffordable(Number.MAX_SAFE_INTEGER, 1, 1000)).toBe(1000);
      expect(maxAffordable(1000, Number.MAX_SAFE_INTEGER, 1000)).toBe(0);
    });
  });

  describe('maxTradableStock', () => {
    it('should clamp quantity by available stock', () => {
      expect(maxTradableStock(100, 50)).toBe(50); // Request 100, have 50
      expect(maxTradableStock(20, 100)).toBe(20); // Request 20, have 100
      expect(maxTradableStock(5, 5)).toBe(5); // Request 5, have 5
    });

    it('should return 0 when stock is 0 or negative', () => {
      expect(maxTradableStock(100, 0)).toBe(0);
      expect(maxTradableStock(100, -10)).toBe(0);
    });

    it('should return 0 when requested quantity is 0 or negative', () => {
      expect(maxTradableStock(0, 100)).toBe(0);
      expect(maxTradableStock(-10, 100)).toBe(0);
    });

    it('should handle edge cases with very large numbers', () => {
      expect(maxTradableStock(Number.MAX_SAFE_INTEGER, 1000)).toBe(1000);
      expect(maxTradableStock(1000, Number.MAX_SAFE_INTEGER)).toBe(1000);
    });

    it('should handle fractional quantities', () => {
      expect(maxTradableStock(10.5, 15)).toBe(10.5); // Request 10.5, have 15
      expect(maxTradableStock(20.7, 10.3)).toBe(10.3); // Request 20.7, have 10.3
    });
  });

  describe('Integration Tests', () => {
    it('should work together for realistic trading scenarios', () => {
      const frozenState = deepFreeze({ ...baseState });
      const snapshot = snapshotMarket(frozenState);

      // Scenario: AI wants to buy 50 fish from town 1
      const town1 = snapshot.towns[0];
      if (!town1) {
        throw new Error('Town 1 not found in snapshot');
      }
      const fishPrice = town1.prices.fish;
      const fishStock = town1.stock.fish;
      const aiTreasury = 200;

      // Calculate what AI can actually afford and trade
      const affordableQty = maxAffordable(50, fishPrice, aiTreasury);
      const tradableQty = maxTradableStock(affordableQty, fishStock);

      // AI wants 50 fish, can afford 100 (200/2), but only requests 50
      expect(affordableQty).toBe(50); // min(50, 200/2) = 50
      expect(tradableQty).toBe(10); // min(50, 10) = 10
    });

    it('should handle multiple goods in a single town', () => {
      const frozenState = deepFreeze({ ...baseState });
      const snapshot = snapshotMarket(frozenState);

      const town2 = snapshot.towns[1];
      if (!town2) {
        throw new Error('Town 2 not found in snapshot');
      }
      const aiTreasury = 100;

      // Check all goods in town 2
      const fishTrade = maxTradableStock(
        maxAffordable(30, town2.prices.fish, aiTreasury),
        town2.stock.fish,
      );
      const woodTrade = maxTradableStock(
        maxAffordable(30, town2.prices.wood, aiTreasury),
        town2.stock.wood,
      );
      const oreTrade = maxTradableStock(
        maxAffordable(30, town2.prices.ore, aiTreasury),
        town2.stock.ore,
      );

      // fish: price 3, stock 20, treasury 100 -> can afford 33, trade 20
      expect(fishTrade).toBe(20);
      // wood: price 2, stock 15, treasury 100 -> can afford 50, trade 15
      expect(woodTrade).toBe(15);
      // ore: price 4, stock 8, treasury 100 -> can afford 25, trade 8
      expect(oreTrade).toBe(8);
    });
  });
});
