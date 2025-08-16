import { describe, it, expect } from 'vitest';

import type { ProsperityTier } from '../../types/Tiers';

import {
  applyProsperityAndScale,
  DEFAULT_PROSPERITY_MULT,
  type ProsperityMultipliers,
} from './Multipliers';

describe('Multipliers', () => {
  describe('DEFAULT_PROSPERITY_MULT', () => {
    it('should have correct multiplier values', () => {
      expect(DEFAULT_PROSPERITY_MULT.struggling).toBe(0.9);
      expect(DEFAULT_PROSPERITY_MULT.modest).toBe(1.0);
      expect(DEFAULT_PROSPERITY_MULT.prosperous).toBe(1.1);
      expect(DEFAULT_PROSPERITY_MULT.opulent).toBe(1.2);
    });
  });

  describe('applyProsperityAndScale', () => {
    const basePrice = 100;

    it('should apply prosperity multipliers correctly', () => {
      // Struggling towns get 10% reduction
      expect(applyProsperityAndScale(basePrice, 'struggling' as ProsperityTier)).toBe(90);

      // Modest towns get no change
      expect(applyProsperityAndScale(basePrice, 'modest' as ProsperityTier)).toBe(100);

      // Prosperous towns get 10% increase
      expect(applyProsperityAndScale(basePrice, 'prosperous' as ProsperityTier)).toBe(110);

      // Opulent towns get 20% increase
      expect(applyProsperityAndScale(basePrice, 'opulent' as ProsperityTier)).toBe(120);
    });

    it('should apply size factor correctly', () => {
      // Small town (0.8x)
      expect(
        applyProsperityAndScale(
          basePrice,
          'modest' as ProsperityTier,
          DEFAULT_PROSPERITY_MULT,
          0.8,
        ),
      ).toBe(80);

      // Large town (1.5x)
      expect(
        applyProsperityAndScale(
          basePrice,
          'modest' as ProsperityTier,
          DEFAULT_PROSPERITY_MULT,
          1.5,
        ),
      ).toBe(150);
    });

    it('should combine prosperity and size factors', () => {
      // Struggling large town: 100 * 0.9 * 1.5 = 135
      expect(
        applyProsperityAndScale(
          basePrice,
          'struggling' as ProsperityTier,
          DEFAULT_PROSPERITY_MULT,
          1.5,
        ),
      ).toBe(135);

      // Opulent small town: 100 * 1.2 * 0.8 = 96
      expect(
        applyProsperityAndScale(
          basePrice,
          'opulent' as ProsperityTier,
          DEFAULT_PROSPERITY_MULT,
          0.8,
        ),
      ).toBe(96);
    });

    it('should round to nearest integer', () => {
      // 100 * 0.9 * 1.11 = 99.9, should round to 100
      expect(
        applyProsperityAndScale(
          basePrice,
          'struggling' as ProsperityTier,
          DEFAULT_PROSPERITY_MULT,
          1.11,
        ),
      ).toBe(100);

      // 100 * 1.1 * 1.09 = 119.9, should round to 120
      expect(
        applyProsperityAndScale(
          basePrice,
          'prosperous' as ProsperityTier,
          DEFAULT_PROSPERITY_MULT,
          1.09,
        ),
      ).toBe(120);
    });

    it('should clamp to min and max bounds', () => {
      // Test min bound
      expect(
        applyProsperityAndScale(
          basePrice,
          'struggling' as ProsperityTier,
          DEFAULT_PROSPERITY_MULT,
          0.01,
          50,
          200,
        ),
      ).toBe(50);

      // Test max bound
      expect(
        applyProsperityAndScale(
          basePrice,
          'opulent' as ProsperityTier,
          DEFAULT_PROSPERITY_MULT,
          2.0,
          50,
          200,
        ),
      ).toBe(200);
    });

    it('should use default bounds when not specified', () => {
      // Should clamp to default min (1) and max (9999)
      expect(applyProsperityAndScale(0, 'modest' as ProsperityTier)).toBe(1);
      expect(applyProsperityAndScale(10000, 'opulent' as ProsperityTier)).toBe(9999);
    });

    it('should work with custom multipliers', () => {
      const customMultipliers: ProsperityMultipliers = {
        struggling: 0.5,
        modest: 1.0,
        prosperous: 2.0,
        opulent: 3.0,
      };

      expect(
        applyProsperityAndScale(basePrice, 'struggling' as ProsperityTier, customMultipliers),
      ).toBe(50);
      expect(
        applyProsperityAndScale(basePrice, 'opulent' as ProsperityTier, customMultipliers),
      ).toBe(300);
    });

    it('should handle edge cases', () => {
      // Zero price
      expect(applyProsperityAndScale(0, 'modest' as ProsperityTier)).toBe(1);

      // Very small price
      expect(applyProsperityAndScale(1, 'struggling' as ProsperityTier)).toBe(1);

      // Very large price
      expect(applyProsperityAndScale(9999, 'opulent' as ProsperityTier)).toBe(9999);
    });
  });
});
