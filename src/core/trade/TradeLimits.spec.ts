import { describe, it, expect } from 'vitest';

import type { TradeLimits } from './TradeLimits';
import { DEFAULT_LIMITS, clamp, limitResource, limitTreasury, limitPrice } from './TradeLimits';

describe('TradeLimits', () => {
  describe('DEFAULT_LIMITS', () => {
    it('should have reasonable default values', () => {
      expect(DEFAULT_LIMITS.maxResource).toBe(1_000_000);
      expect(DEFAULT_LIMITS.maxTreasury).toBe(1_000_000_000);
      expect(DEFAULT_LIMITS.minPrice).toBe(1);
      expect(DEFAULT_LIMITS.maxPrice).toBe(9999);
    });
  });

  describe('clamp', () => {
    it('should clamp values between min and max', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
      expect(clamp(0, 0, 10)).toBe(0);
      expect(clamp(10, 0, 10)).toBe(10);
    });

    it('should handle edge cases', () => {
      expect(clamp(0, 0, 0)).toBe(0);
      expect(clamp(-1, 0, 0)).toBe(0);
      expect(clamp(1, 0, 0)).toBe(0);
    });
  });

  describe('limitResource', () => {
    it('should prevent negative resources', () => {
      expect(limitResource(-100, {})).toBe(0);
      expect(limitResource(-1, {})).toBe(0);
      expect(limitResource(0, {})).toBe(0);
    });

    it('should clamp resources to maxResource when specified', () => {
      const limits: TradeLimits = { maxResource: 1000 };
      expect(limitResource(500, limits)).toBe(500);
      expect(limitResource(1000, limits)).toBe(1000);
      expect(limitResource(1500, limits)).toBe(1000);
      expect(limitResource(1_000_000, limits)).toBe(1000);
    });

    it('should allow unlimited resources when maxResource not specified', () => {
      const limits: TradeLimits = {};
      expect(limitResource(1_000_000, limits)).toBe(1_000_000);
      expect(limitResource(Number.MAX_SAFE_INTEGER, limits)).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('should work with DEFAULT_LIMITS', () => {
      expect(limitResource(500_000, DEFAULT_LIMITS)).toBe(500_000);
      expect(limitResource(1_000_000, DEFAULT_LIMITS)).toBe(1_000_000);
      expect(limitResource(2_000_000, DEFAULT_LIMITS)).toBe(1_000_000);
    });
  });

  describe('limitTreasury', () => {
    it('should prevent negative treasury', () => {
      expect(limitTreasury(-100, {})).toBe(0);
      expect(limitTreasury(-1, {})).toBe(0);
      expect(limitTreasury(0, {})).toBe(0);
    });

    it('should clamp treasury to maxTreasury when specified', () => {
      const limits: TradeLimits = { maxTreasury: 10000 };
      expect(limitTreasury(5000, limits)).toBe(5000);
      expect(limitTreasury(10000, limits)).toBe(10000);
      expect(limitTreasury(15000, limits)).toBe(10000);
      expect(limitTreasury(1_000_000_000, limits)).toBe(10000);
    });

    it('should allow unlimited treasury when maxTreasury not specified', () => {
      const limits: TradeLimits = {};
      expect(limitTreasury(1_000_000_000, limits)).toBe(1_000_000_000);
      expect(limitTreasury(Number.MAX_SAFE_INTEGER, limits)).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('should work with DEFAULT_LIMITS', () => {
      expect(limitTreasury(500_000_000, DEFAULT_LIMITS)).toBe(500_000_000);
      expect(limitTreasury(1_000_000_000, DEFAULT_LIMITS)).toBe(1_000_000_000);
      expect(limitTreasury(2_000_000_000, DEFAULT_LIMITS)).toBe(1_000_000_000);
    });
  });

  describe('limitPrice', () => {
    it('should clamp prices between minPrice and maxPrice when specified', () => {
      const limits: TradeLimits = { minPrice: 10, maxPrice: 100 };
      expect(limitPrice(50, limits)).toBe(50);
      expect(limitPrice(10, limits)).toBe(10);
      expect(limitPrice(100, limits)).toBe(100);
      expect(limitPrice(5, limits)).toBe(10);
      expect(limitPrice(150, limits)).toBe(100);
    });

    it('should use default bounds when limits not specified', () => {
      const limits: TradeLimits = {};
      expect(limitPrice(50, limits)).toBe(50);
      expect(limitPrice(0, limits)).toBe(0);
      expect(limitPrice(-100, limits)).toBe(0);
      expect(limitPrice(Number.MAX_SAFE_INTEGER, limits)).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('should work with DEFAULT_LIMITS', () => {
      expect(limitPrice(50, DEFAULT_LIMITS)).toBe(50);
      expect(limitPrice(1, DEFAULT_LIMITS)).toBe(1);
      expect(limitPrice(9999, DEFAULT_LIMITS)).toBe(9999);
      expect(limitPrice(0, DEFAULT_LIMITS)).toBe(1);
      expect(limitPrice(10000, DEFAULT_LIMITS)).toBe(9999);
    });

    it('should handle edge cases', () => {
      const limits: TradeLimits = { minPrice: 0, maxPrice: 0 };
      expect(limitPrice(0, limits)).toBe(0);
      expect(limitPrice(-1, limits)).toBe(0);
      expect(limitPrice(1, limits)).toBe(0);
    });
  });

  describe('integration scenarios', () => {
    it('should handle big trades within limits', () => {
      const limits: TradeLimits = {
        maxResource: 1000,
        maxTreasury: 10000,
        minPrice: 1,
        maxPrice: 100,
      };

      // Simulate a large trade that would exceed limits
      const bigResource = 2000;
      const bigTreasury = 15000;
      const lowPrice = 0;
      const highPrice = 150;

      expect(limitResource(bigResource, limits)).toBe(1000);
      expect(limitTreasury(bigTreasury, limits)).toBe(10000);
      expect(limitPrice(lowPrice, limits)).toBe(1);
      expect(limitPrice(highPrice, limits)).toBe(100);
    });

    it('should prevent runaway inflation scenarios', () => {
      const limits: TradeLimits = {
        maxResource: 1_000_000,
        maxTreasury: 1_000_000_000,
        minPrice: 1,
        maxPrice: 9999,
      };

      // Simulate runaway values
      const runawayResource = Number.MAX_SAFE_INTEGER;
      const runawayTreasury = Number.MAX_SAFE_INTEGER;
      const runawayPrice = Number.MAX_SAFE_INTEGER;

      expect(limitResource(runawayResource, limits)).toBe(1_000_000);
      expect(limitTreasury(runawayTreasury, limits)).toBe(1_000_000_000);
      expect(limitPrice(runawayPrice, limits)).toBe(9999);
    });

    it('should handle negative scenarios gracefully', () => {
      const limits: TradeLimits = {
        maxResource: 1000,
        maxTreasury: 10000,
        minPrice: 1,
        maxPrice: 100,
      };

      // Simulate negative values
      const negativeResource = -1000;
      const negativeTreasury = -5000;
      const negativePrice = -50;

      expect(limitResource(negativeResource, limits)).toBe(0);
      expect(limitTreasury(negativeTreasury, limits)).toBe(0);
      expect(limitPrice(negativePrice, limits)).toBe(1);
    });
  });
});
