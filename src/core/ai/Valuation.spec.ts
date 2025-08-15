import { describe, it, expect } from 'vitest';

import type { GoodConfig, GoodId } from '../../types/Goods';

import type { AiProfile } from './AiTypes';
import { scoreQuote, type Quote } from './Valuation';

describe('Valuation', () => {
  // Test data
  const mockGoods: Record<GoodId, GoodConfig> = {
    fish: {
      id: 'fish',
      name: 'Fish',
      effects: {
        prosperityDelta: 2,
        militaryDelta: 1,
      },
    },
    wood: {
      id: 'wood',
      name: 'Wood',
      effects: {
        prosperityDelta: 1,
        militaryDelta: 2,
      },
    },
    ore: {
      id: 'ore',
      name: 'Ore',
      effects: {
        prosperityDelta: 3,
        militaryDelta: 3,
      },
    },
  };

  const mockProfile: AiProfile = {
    id: 'test-ai',
    mode: 'greedy',
    weights: {
      priceSpread: 0.7,
      prosperity: 0.2,
      military: 0.1,
    },
    maxTradesPerTurn: 3,
    maxQuantityPerTrade: 10,
  };

  const baseQuote: Quote = {
    sellerId: 'seller-town',
    buyerId: 'buyer-town',
    goodId: 'fish',
    unitSellPrice: 10,
    unitBuyPrice: 15,
    quantity: 5,
  };

  describe('scoreQuote', () => {
    it('should score higher for larger price spreads', () => {
      const smallSpreadQuote: Quote = { ...baseQuote, unitSellPrice: 12, unitBuyPrice: 15 };
      const largeSpreadQuote: Quote = { ...baseQuote, unitSellPrice: 8, unitBuyPrice: 15 };

      const smallScore = scoreQuote(smallSpreadQuote, mockGoods, mockProfile);
      const largeScore = scoreQuote(largeSpreadQuote, mockGoods, mockProfile);

      expect(largeScore).toBeGreaterThan(smallScore);
    });

    it('should include prosperity effects in scoring', () => {
      const prosperityProfile: AiProfile = {
        ...mockProfile,
        weights: { priceSpread: 0.5, prosperity: 0.4, military: 0.1 },
      };

      const fishQuote: Quote = { ...baseQuote, goodId: 'fish' }; // prosperityDelta: 2
      const woodQuote: Quote = { ...baseQuote, goodId: 'wood' }; // prosperityDelta: 1

      const fishScore = scoreQuote(fishQuote, mockGoods, prosperityProfile);
      const woodScore = scoreQuote(woodQuote, mockGoods, prosperityProfile);

      expect(fishScore).toBeGreaterThan(woodScore);
    });

    it('should include military effects in scoring', () => {
      const militaryProfile: AiProfile = {
        ...mockProfile,
        weights: { priceSpread: 0.5, prosperity: 0.1, military: 0.4 },
      };

      const woodQuote: Quote = { ...baseQuote, goodId: 'wood' }; // militaryDelta: 2
      const fishQuote: Quote = { ...baseQuote, goodId: 'fish' }; // militaryDelta: 1

      const woodScore = scoreQuote(woodQuote, mockGoods, militaryProfile);
      const fishScore = scoreQuote(fishQuote, mockGoods, militaryProfile);

      expect(woodScore).toBeGreaterThan(fishScore);
    });

    it('should handle zero price spread', () => {
      const zeroSpreadQuote: Quote = { ...baseQuote, unitSellPrice: 15, unitBuyPrice: 15 };
      const score = scoreQuote(zeroSpreadQuote, mockGoods, mockProfile);

      // With zero spread, only stat bonus remains
      const expectedStatBonus =
        mockProfile.weights.prosperity * 2 + mockProfile.weights.military * 1;
      expect(score).toBe(expectedStatBonus);
    });

    it('should handle negative price spread', () => {
      const negativeSpreadQuote: Quote = { ...baseQuote, unitSellPrice: 20, unitBuyPrice: 15 };
      const score = scoreQuote(negativeSpreadQuote, mockGoods, mockProfile);

      // Negative spread should reduce the score
      expect(score).toBeLessThan(0);
    });

    it('should handle zero quantity', () => {
      const zeroQuantityQuote: Quote = { ...baseQuote, quantity: 0 };
      const score = scoreQuote(zeroQuantityQuote, mockGoods, mockProfile);

      // With zero quantity, only stat bonus remains
      const expectedStatBonus =
        mockProfile.weights.prosperity * 2 + mockProfile.weights.military * 1;
      expect(score).toBe(expectedStatBonus);
    });

    it('should handle different quantities correctly', () => {
      const smallQuantityQuote: Quote = { ...baseQuote, quantity: 1 };
      const largeQuantityQuote: Quote = { ...baseQuote, quantity: 10 };

      const smallScore = scoreQuote(smallQuantityQuote, mockGoods, mockProfile);
      const largeScore = scoreQuote(largeQuantityQuote, mockGoods, mockProfile);

      // Larger quantity should result in proportionally larger score
      expect(largeScore).toBeGreaterThan(smallScore);
    });

    it('should be deterministic for same inputs', () => {
      const score1 = scoreQuote(baseQuote, mockGoods, mockProfile);
      const score2 = scoreQuote(baseQuote, mockGoods, mockProfile);

      expect(score1).toBe(score2);
    });

    it('should handle ore with highest stat values', () => {
      const oreQuote: Quote = { ...baseQuote, goodId: 'ore' }; // prosperityDelta: 3, militaryDelta: 3
      const score = scoreQuote(oreQuote, mockGoods, mockProfile);

      // Ore should have the highest stat bonus
      const expectedStatBonus =
        mockProfile.weights.prosperity * 3 + mockProfile.weights.military * 3;
      const expectedBase = mockProfile.weights.priceSpread * (15 - 10) * 5;
      const expectedScore = expectedBase + expectedStatBonus;

      expect(score).toBe(expectedScore);
    });
  });
});
