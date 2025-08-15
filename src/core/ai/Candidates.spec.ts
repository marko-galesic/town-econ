import { describe, it, expect } from 'vitest';

import type { GoodConfig, GoodId } from '../../types/Goods';

import { generateCandidates } from './Candidates';
import type { MarketSnapshot } from './Market';

describe('generateCandidates', () => {
  const mockGoods: Record<GoodId, GoodConfig> = {
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
      effects: { prosperityDelta: 0, militaryDelta: 2 },
    },
  };

  const createMockMarket = (): MarketSnapshot => ({
    towns: [
      {
        id: 'townA',
        prices: { fish: 10, wood: 20, ore: 30 },
        stock: { fish: 100, wood: 50, ore: 25 },
        treasury: 1000,
      },
      {
        id: 'townB',
        prices: { fish: 15, wood: 15, ore: 35 },
        stock: { fish: 80, wood: 60, ore: 20 },
        treasury: 800,
      },
      {
        id: 'townC',
        prices: { fish: 8, wood: 25, ore: 28 },
        stock: { fish: 120, wood: 40, ore: 30 },
        treasury: 1200,
      },
    ],
  });

  it('generates candidates only when spread > 0', () => {
    const market = createMockMarket();
    const opts = { maxQuantityPerTrade: 50 };

    const candidates = generateCandidates(market, mockGoods, opts);

    // Verify all candidates have positive price spread
    candidates.forEach(candidate => {
      expect(candidate.unitBuyPrice).toBeGreaterThan(candidate.unitSellPrice);
    });

    // TownA → TownB: fish (10 < 15), wood (20 > 15), ore (30 < 35)
    // TownA → TownC: fish (10 > 8), wood (20 < 25), ore (30 > 28)
    // TownB → TownA: fish (15 > 10), wood (15 < 20), ore (35 > 30)
    // TownB → TownC: fish (15 > 8), wood (15 < 25), ore (35 > 28)
    // TownC → TownA: fish (8 < 10), wood (25 > 20), ore (28 < 30)
    // TownC → TownB: fish (8 < 15), wood (25 > 15), ore (28 < 35)

    // Expected profitable directions:
    // A→B: fish, ore
    // A→C: wood
    // B→A: wood, ore
    // B→C: wood, ore
    // C→A: fish, ore
    // C→B: fish, ore
    // Total: 6 profitable directions × 3 goods = 18 candidates
    expect(candidates.length).toBeGreaterThan(0);
  });

  it('respects stock constraints', () => {
    const market = createMockMarket();
    const opts = { maxQuantityPerTrade: 1000 }; // High limit to test stock constraint

    const candidates = generateCandidates(market, mockGoods, opts);

    candidates.forEach(candidate => {
      const seller = market.towns.find(t => t.id === candidate.sellerId)!;
      expect(candidate.quantity).toBeLessThanOrEqual(seller.stock[candidate.goodId]);
    });
  });

  it('respects treasury constraints', () => {
    const market = createMockMarket();
    const opts = { maxQuantityPerTrade: 1000 }; // High limit to test treasury constraint

    const candidates = generateCandidates(market, mockGoods, opts);

    candidates.forEach(candidate => {
      const buyer = market.towns.find(t => t.id === candidate.buyerId)!;
      const maxAffordable = Math.floor(buyer.treasury / candidate.unitSellPrice);
      expect(candidate.quantity).toBeLessThanOrEqual(maxAffordable);
    });
  });

  it('caps quantity at maxQuantityPerTrade', () => {
    const market = createMockMarket();
    const opts = { maxQuantityPerTrade: 10 };

    const candidates = generateCandidates(market, mockGoods, opts);

    candidates.forEach(candidate => {
      expect(candidate.quantity).toBeLessThanOrEqual(opts.maxQuantityPerTrade);
    });
  });

  it('returns empty array when no profitable trades exist', () => {
    const market: MarketSnapshot = {
      towns: [
        {
          id: 'townA',
          prices: { fish: 10, wood: 20, ore: 30 },
          stock: { fish: 100, wood: 50, ore: 25 },
          treasury: 1000,
        },
        {
          id: 'townB',
          prices: { fish: 10, wood: 20, ore: 30 }, // Same prices as townA
          stock: { fish: 80, wood: 60, ore: 20 },
          treasury: 800,
        },
      ],
    };

    const opts = { maxQuantityPerTrade: 50 };
    const candidates = generateCandidates(market, mockGoods, opts);

    expect(candidates).toEqual([]);
  });

  it('handles zero stock correctly', () => {
    const market: MarketSnapshot = {
      towns: [
        {
          id: 'townA',
          prices: { fish: 10, wood: 20, ore: 30 },
          stock: { fish: 0, wood: 50, ore: 25 }, // No fish stock
          treasury: 1000,
        },
        {
          id: 'townB',
          prices: { fish: 15, wood: 15, ore: 35 },
          stock: { fish: 80, wood: 60, ore: 20 },
          treasury: 800,
        },
      ],
    };

    const opts = { maxQuantityPerTrade: 50 };
    const candidates = generateCandidates(market, mockGoods, opts);

    // Should not generate fish trades from townA due to zero stock
    const fishCandidatesFromA = candidates.filter(
      c => c.sellerId === 'townA' && c.goodId === 'fish',
    );
    expect(fishCandidatesFromA).toEqual([]);
  });

  it('handles zero treasury correctly', () => {
    const market: MarketSnapshot = {
      towns: [
        {
          id: 'townA',
          prices: { fish: 10, wood: 20, ore: 30 },
          stock: { fish: 100, wood: 50, ore: 25 },
          treasury: 1000,
        },
        {
          id: 'townB',
          prices: { fish: 15, wood: 15, ore: 35 },
          stock: { fish: 80, wood: 60, ore: 20 },
          treasury: 0, // No money
        },
      ],
    };

    const opts = { maxQuantityPerTrade: 50 };
    const candidates = generateCandidates(market, mockGoods, opts);

    // Should not generate trades to townB due to zero treasury
    const candidatesToB = candidates.filter(c => c.buyerId === 'townB');
    expect(candidatesToB).toEqual([]);
  });

  it('produces deterministic results', () => {
    const market = createMockMarket();
    const opts = { maxQuantityPerTrade: 50 };

    const candidates1 = generateCandidates(market, mockGoods, opts);
    const candidates2 = generateCandidates(market, mockGoods, opts);

    expect(candidates1).toEqual(candidates2);
  });
});
