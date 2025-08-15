import { describe, it, expect } from 'vitest';

import type { GoodConfig, GoodId } from '../../types/Goods';

import type { AiProfile } from './AiTypes';
import { chooseTrade } from './Policy';
import type { Quote } from './Valuation';

describe('Policy', () => {
  const mockGoods: Record<GoodId, GoodConfig> = {
    fish: {
      id: 'fish',
      name: 'Fish',
      effects: { prosperityDelta: 1, militaryDelta: 0 },
    },
    wood: {
      id: 'wood',
      name: 'Wood',
      effects: { prosperityDelta: 0, militaryDelta: 2 },
    },
    ore: {
      id: 'ore',
      name: 'Ore',
      effects: { prosperityDelta: 3, militaryDelta: 0 },
    },
  };

  const mockCandidates: Quote[] = [
    {
      sellerId: 'town1',
      buyerId: 'town2',
      goodId: 'fish',
      unitSellPrice: 8,
      unitBuyPrice: 12,
      quantity: 10,
    },
    {
      sellerId: 'town3',
      buyerId: 'town2',
      goodId: 'wood',
      unitSellPrice: 45,
      unitBuyPrice: 55,
      quantity: 5,
    },
    {
      sellerId: 'town4',
      buyerId: 'town2',
      goodId: 'ore',
      unitSellPrice: 90,
      unitBuyPrice: 110,
      quantity: 2,
    },
  ];

  const randomProfile: AiProfile = {
    id: 'random-ai',
    mode: 'random',
    weights: {
      priceSpread: 0.5,
      prosperity: 0.3,
      military: 0.2,
    },
    maxTradesPerTurn: 1,
    maxQuantityPerTrade: 100,
  };

  const greedyProfile: AiProfile = {
    id: 'greedy-ai',
    mode: 'greedy',
    weights: {
      priceSpread: 0.7,
      prosperity: 0.2,
      military: 0.1,
    },
    maxTradesPerTurn: 1,
    maxQuantityPerTrade: 100,
  };

  describe('chooseTrade', () => {
    describe('edge cases', () => {
      it('returns undefined when no candidates available', () => {
        const result = chooseTrade(randomProfile, [], mockGoods, 'test-seed', 'ai-town');
        expect(result).toBeUndefined();
      });
    });

    describe('random mode', () => {
      it('same seed and aiTownId produces same selection', () => {
        const result1 = chooseTrade(
          randomProfile,
          mockCandidates,
          mockGoods,
          'test-seed',
          'ai-town',
        );
        const result2 = chooseTrade(
          randomProfile,
          mockCandidates,
          mockGoods,
          'test-seed',
          'ai-town',
        );

        expect(result1).toBeDefined();
        expect(result2).toBeDefined();
        expect(result1).toEqual(result2);
      });

      it('different seeds produce different selections', () => {
        // Note: This test might occasionally fail if both seeds happen to pick the same index
        // In practice, with good hash functions, this should be rare
        // We'll run it multiple times to increase confidence
        let differentSelections = 0;
        for (let i = 0; i < 10; i++) {
          const r1 = chooseTrade(randomProfile, mockCandidates, mockGoods, `seed1-${i}`, 'ai-town');
          const r2 = chooseTrade(randomProfile, mockCandidates, mockGoods, `seed2-${i}`, 'ai-town');
          if (r1 !== r2) differentSelections++;
        }
        expect(differentSelections).toBeGreaterThan(0);
      });

      it('different aiTownIds produce different selections', () => {
        // Similar to above, this should produce different results
        let differentSelections = 0;
        for (let i = 0; i < 10; i++) {
          const r1 = chooseTrade(
            randomProfile,
            mockCandidates,
            mockGoods,
            'test-seed',
            `ai-town-1-${i}`,
          );
          const r2 = chooseTrade(
            randomProfile,
            mockCandidates,
            mockGoods,
            'test-seed',
            `ai-town-2-${i}`,
          );
          if (r1 !== r2) differentSelections++;
        }
        expect(differentSelections).toBeGreaterThan(0);
      });

      it('selection is deterministic for same parameters', () => {
        const results: Array<{ quote: Quote }> = [];
        for (let i = 0; i < 5; i++) {
          results.push(
            chooseTrade(randomProfile, mockCandidates, mockGoods, 'stable-seed', 'stable-ai')!,
          );
        }

        // All results should be identical
        const first = results[0]!;
        results.forEach(result => expect(result.quote).toEqual(first.quote));
      });
    });

    describe('greedy mode', () => {
      it('selects highest scoring quote', () => {
        const result = chooseTrade(
          greedyProfile,
          mockCandidates,
          mockGoods,
          'test-seed',
          'ai-town',
        );

        expect(result).toBeDefined();

        // Calculate expected scores
        const scores = mockCandidates.map(c => {
          const base = (c.unitBuyPrice - c.unitSellPrice) * c.quantity;
          const effects = mockGoods[c.goodId].effects;
          const statBonus =
            greedyProfile.weights.prosperity * effects.prosperityDelta +
            greedyProfile.weights.military * effects.militaryDelta;
          return greedyProfile.weights.priceSpread * base + statBonus;
        });

        const maxScore = Math.max(...scores);
        const maxScoreIndex = scores.indexOf(maxScore);

        expect(result).toEqual({
          quote: mockCandidates[maxScoreIndex],
          score: maxScore,
        });
      });

      it('maintains stable order for ties', () => {
        // Create candidates with identical scores
        const tiedCandidates: Quote[] = [
          {
            sellerId: 'town1',
            buyerId: 'town2',
            goodId: 'fish',
            unitSellPrice: 10,
            unitBuyPrice: 12,
            quantity: 10,
          },
          {
            sellerId: 'town3',
            buyerId: 'town2',
            goodId: 'fish',
            unitSellPrice: 10,
            unitBuyPrice: 12,
            quantity: 10,
          },
        ];

        const result1 = chooseTrade(greedyProfile, tiedCandidates, mockGoods, 'seed1', 'ai-town');
        const result2 = chooseTrade(greedyProfile, tiedCandidates, mockGoods, 'seed2', 'ai-town');

        // Should pick the first one (stable order) regardless of seed
        expect(result1).toEqual({
          quote: tiedCandidates[0],
          score: 14.2,
        });
        expect(result2).toEqual({
          quote: tiedCandidates[0],
          score: 14.2,
        });
      });

      it('ignores seed parameter in greedy mode', () => {
        const result1 = chooseTrade(greedyProfile, mockCandidates, mockGoods, 'seed1', 'ai-town');
        const result2 = chooseTrade(greedyProfile, mockCandidates, mockGoods, 'seed2', 'ai-town');

        expect(result1?.quote).toEqual(result2?.quote);
        expect(result1?.score).toEqual(result2?.score);
      });
    });

    describe('determinism across different candidate sets', () => {
      it('same seed produces same index for different candidate lengths', () => {
        const candidates1 = mockCandidates.slice(0, 2);
        const candidates2 = mockCandidates.slice(0, 3);

        const result1 = chooseTrade(randomProfile, candidates1, mockGoods, 'test-seed', 'ai-town');
        const result2 = chooseTrade(randomProfile, candidates2, mockGoods, 'test-seed', 'ai-town');

        // Should both be defined
        expect(result1).toBeDefined();
        expect(result2).toBeDefined();

        // Should be deterministic for their respective candidate sets
        const result1Again = chooseTrade(
          randomProfile,
          candidates1,
          mockGoods,
          'test-seed',
          'ai-town',
        );
        const result2Again = chooseTrade(
          randomProfile,
          candidates2,
          mockGoods,
          'test-seed',
          'ai-town',
        );

        expect(result1).toEqual(result1Again);
        expect(result2).toEqual(result2Again);
      });
    });
  });
});
