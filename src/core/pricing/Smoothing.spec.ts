import { describe, it, expect } from 'vitest';

import { smoothPrice, DEFAULT_SMOOTH, type Smoothing } from './Smoothing';

describe('Smoothing', () => {
  describe('smoothPrice', () => {
    it('should return new price when alpha = 1.0 (full instant change)', () => {
      const oldPrice = 100;
      const newPrice = 150;
      const smoothing: Smoothing = { alpha: 1.0 };

      const result = smoothPrice(oldPrice, newPrice, smoothing);

      expect(result).toBe(150);
    });

    it('should return old price when alpha = 0.0 (no change)', () => {
      const oldPrice = 100;
      const newPrice = 150;
      const smoothing: Smoothing = { alpha: 0.0 };

      const result = smoothPrice(oldPrice, newPrice, smoothing);

      expect(result).toBe(100);
    });

    it('should return weighted average when 0 < alpha < 1', () => {
      const oldPrice = 100;
      const newPrice = 200;
      const smoothing: Smoothing = { alpha: 0.5 };

      const result = smoothPrice(oldPrice, newPrice, smoothing);

      // Expected: 100 * 0.5 + 200 * 0.5 = 150
      expect(result).toBe(150);
    });

    it('should handle alpha = 0.25 correctly', () => {
      const oldPrice = 100;
      const newPrice = 200;
      const smoothing: Smoothing = { alpha: 0.25 };

      const result = smoothPrice(oldPrice, newPrice, smoothing);

      // Expected: 100 * 0.75 + 200 * 0.25 = 75 + 50 = 125
      expect(result).toBe(125);
    });

    it('should handle alpha = 0.75 correctly', () => {
      const oldPrice = 100;
      const newPrice = 200;
      const smoothing: Smoothing = { alpha: 0.75 };

      const result = smoothPrice(oldPrice, newPrice, smoothing);

      // Expected: 100 * 0.25 + 200 * 0.75 = 25 + 150 = 175
      expect(result).toBe(175);
    });

    it('should round to nearest integer deterministically', () => {
      const oldPrice = 100;
      const newPrice = 103;
      const smoothing: Smoothing = { alpha: 0.3 };

      const result = smoothPrice(oldPrice, newPrice, smoothing);

      // Expected: 100 * 0.7 + 103 * 0.3 = 70 + 30.9 = 100.9 → 101
      expect(result).toBe(101);
    });

    it('should handle decimal alpha values with rounding', () => {
      const oldPrice = 50;
      const newPrice = 60;
      const smoothing: Smoothing = { alpha: 0.333 };

      const result = smoothPrice(oldPrice, newPrice, smoothing);

      // Expected: 50 * 0.667 + 60 * 0.333 = 33.35 + 19.98 = 53.33 → 53
      expect(result).toBe(53);
    });

    it('should clamp alpha values outside [0,1] range', () => {
      const oldPrice = 100;
      const newPrice = 200;

      // Test negative alpha
      const negativeResult = smoothPrice(oldPrice, newPrice, { alpha: -0.5 });
      expect(negativeResult).toBe(100); // Should clamp to 0

      // Test alpha > 1
      const overflowResult = smoothPrice(oldPrice, newPrice, { alpha: 1.5 });
      expect(overflowResult).toBe(200); // Should clamp to 1
    });

    it('should handle edge cases with zero prices', () => {
      const smoothing: Smoothing = { alpha: 0.5 };

      // Old price zero
      expect(smoothPrice(0, 100, smoothing)).toBe(50);

      // New price zero
      expect(smoothPrice(100, 0, smoothing)).toBe(50);

      // Both prices zero
      expect(smoothPrice(0, 0, smoothing)).toBe(0);
    });

    it('should handle large price differences', () => {
      const oldPrice = 1;
      const newPrice = 1000;
      const smoothing: Smoothing = { alpha: 0.1 };

      const result = smoothPrice(oldPrice, newPrice, smoothing);

      // Expected: 1 * 0.9 + 1000 * 0.1 = 0.9 + 100 = 100.9 → 101
      expect(result).toBe(101);
    });
  });

  describe('DEFAULT_SMOOTH', () => {
    it('should have alpha = 0.5', () => {
      expect(DEFAULT_SMOOTH.alpha).toBe(0.5);
    });

    it('should work correctly with smoothPrice function', () => {
      const oldPrice = 100;
      const newPrice = 200;

      const result = smoothPrice(oldPrice, newPrice, DEFAULT_SMOOTH);

      expect(result).toBe(150);
    });
  });
});
