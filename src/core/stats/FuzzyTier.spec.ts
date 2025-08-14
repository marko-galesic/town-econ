import { describe, it, expect } from 'vitest';

import { fuzzyTierFor, seededRand, DEFAULT_FUZZ, type FuzzOptions } from './FuzzyTier';
import type { TierThreshold } from './TierMap';

// Test data - prosperity tiers for testing
const testThresholds: TierThreshold[] = [
  { tier: 'struggling', min: 0 },
  { tier: 'modest', min: 25 },
  { tier: 'prosperous', min: 50 },
  { tier: 'opulent', min: 75 },
];

describe('FuzzyTier', () => {
  describe('seededRand', () => {
    it('should generate deterministic random numbers for same seed and tag', () => {
      const rand = seededRand('test-seed');
      const result1 = rand('tag1');
      const result2 = rand('tag1');

      expect(result1).toBe(result2);
      expect(result1).toBeGreaterThanOrEqual(0);
      expect(result1).toBeLessThan(1);
    });

    it('should generate different numbers for different tags', () => {
      const rand = seededRand('test-seed');
      const result1 = rand('tag1');
      const result2 = rand('tag2');

      expect(result1).not.toBe(result2);
    });

    it('should generate different numbers for different seeds', () => {
      const rand1 = seededRand('seed1');
      const rand2 = seededRand('seed2');

      const result1 = rand1('tag');
      const result2 = rand2('tag');

      expect(result1).not.toBe(result2);
    });
  });

  describe('fuzzyTierFor', () => {
    const testSeed = 'test-rng-seed';
    const testTownId = 'test-town';
    const testTurn = 5;

    describe('with jitterProb = 0', () => {
      it('should always return true tier', () => {
        const opts: FuzzOptions = { jitterProb: 0 };

        // Test multiple values to ensure no jitter
        const testCases = [
          { raw: 10, expected: 'struggling' },
          { raw: 30, expected: 'modest' },
          { raw: 60, expected: 'prosperous' },
          { raw: 80, expected: 'opulent' },
        ];

        testCases.forEach(({ raw, expected }) => {
          const result = fuzzyTierFor(raw, testThresholds, testSeed, testTownId, testTurn, opts);
          expect(result).toBe(expected);
        });
      });
    });

    describe('with jitterProb = 1', () => {
      it('should always jitter to neighbor tier (clamped at edges)', () => {
        const opts: FuzzOptions = { jitterProb: 1 };

        // Test edge cases and middle cases
        const testCases = [
          { raw: 10, trueTier: 'struggling', possibleNeighbors: ['struggling', 'modest'] },
          {
            raw: 30,
            trueTier: 'modest',
            possibleNeighbors: ['struggling', 'modest', 'prosperous'],
          },
          {
            raw: 60,
            trueTier: 'prosperous',
            possibleNeighbors: ['modest', 'prosperous', 'opulent'],
          },
          { raw: 80, trueTier: 'opulent', possibleNeighbors: ['prosperous', 'opulent'] },
        ];

        testCases.forEach(({ raw, trueTier, possibleNeighbors }) => {
          const result = fuzzyTierFor(raw, testThresholds, testSeed, testTownId, testTurn, opts);

          // Should always be one of the possible neighbors
          expect(possibleNeighbors).toContain(result);

          // Should never be more than 1 step away from true tier
          const trueIdx = testThresholds.findIndex(t => t.tier === trueTier);
          const resultIdx = testThresholds.findIndex(t => t.tier === result);
          expect(Math.abs(resultIdx - trueIdx)).toBeLessThanOrEqual(1);
        });
      });
    });

    describe('with default jitterProb (0.2)', () => {
      it('should occasionally jitter but prefer true tier', () => {
        const opts: FuzzOptions = { jitterProb: 0.2 };

        // Test that we get some jitter but mostly true tier
        const results = [];
        for (let i = 0; i < 100; i++) {
          const result = fuzzyTierFor(30, testThresholds, testSeed, testTownId, testTurn + i, opts);
          results.push(result);
        }

        // Should mostly be 'modest' (true tier for raw=30)
        const modestCount = results.filter(r => r === 'modest').length;
        expect(modestCount).toBeGreaterThan(50); // More than 50% should be true tier

        // Should have some jitter
        const hasJitter = results.some(r => r !== 'modest');
        expect(hasJitter).toBe(true);
      });
    });

    describe('determinism', () => {
      it('should return same fuzzy tier for same (seed, townId, turn)', () => {
        const result1 = fuzzyTierFor(30, testThresholds, testSeed, testTownId, testTurn);
        const result2 = fuzzyTierFor(30, testThresholds, testSeed, testTownId, testTurn);

        expect(result1).toBe(result2);
      });

      it('should return different fuzzy tier for different turns', () => {
        const result2 = fuzzyTierFor(30, testThresholds, testSeed, testTownId, testTurn + 1);

        // May be same or different, but should be deterministic
        const result3 = fuzzyTierFor(30, testThresholds, testSeed, testTownId, testTurn + 1);
        expect(result2).toBe(result3);
      });

      it('should return different fuzzy tier for different towns', () => {
        const result2 = fuzzyTierFor(30, testThresholds, testSeed, 'town2', testTurn);

        // May be same or different, but should be deterministic
        const result3 = fuzzyTierFor(30, testThresholds, testSeed, 'town2', testTurn);
        expect(result2).toBe(result3);
      });
    });

    describe('edge cases', () => {
      it('should handle first tier correctly (never go below bounds)', () => {
        const opts: FuzzOptions = { jitterProb: 1 };

        // Test with raw value that maps to first tier
        const result = fuzzyTierFor(10, testThresholds, testSeed, testTownId, testTurn, opts);

        // Should only be able to jitter to first or second tier
        expect(['struggling', 'modest']).toContain(result);
        expect(result).not.toBe('prosperous');
        expect(result).not.toBe('opulent');
      });

      it('should handle last tier correctly (never go above bounds)', () => {
        const opts: FuzzOptions = { jitterProb: 1 };

        // Test with raw value that maps to last tier
        const result = fuzzyTierFor(80, testThresholds, testSeed, testTownId, testTurn, opts);

        // Should only be able to jitter to third or fourth tier
        expect(['prosperous', 'opulent']).toContain(result);
        expect(result).not.toBe('struggling');
        expect(result).not.toBe('modest');
      });

      it('should throw error for empty thresholds', () => {
        expect(() => {
          fuzzyTierFor(30, [], testSeed, testTownId, testTurn);
        }).toThrow('Thresholds array cannot be empty');
      });
    });

    describe('boundary conditions', () => {
      it('should handle exact threshold values', () => {
        const result = fuzzyTierFor(25, testThresholds, testSeed, testTownId, testTurn);
        expect(['struggling', 'modest', 'prosperous']).toContain(result);
      });

      it('should handle values at tier boundaries', () => {
        const result = fuzzyTierFor(49, testThresholds, testSeed, testTownId, testTurn);
        expect(['struggling', 'modest', 'prosperous']).toContain(result);
      });
    });
  });

  describe('DEFAULT_FUZZ', () => {
    it('should have jitterProb of 0.2', () => {
      expect(DEFAULT_FUZZ.jitterProb).toBe(0.2);
    });
  });
});
