import { describe, it, expect } from 'vitest';

import type { TierThreshold } from './TierMap';
import { clampRaw, mapToTier } from './TierMap';

describe('TierMap', () => {
  describe('clampRaw', () => {
    it('clamps values below 0 to 0', () => {
      expect(clampRaw(-5)).toBe(0);
      expect(clampRaw(-100)).toBe(0);
      expect(clampRaw(-0.1)).toBe(0);
    });

    it('clamps values above 100 to 100', () => {
      expect(clampRaw(105)).toBe(100);
      expect(clampRaw(200)).toBe(100);
      expect(clampRaw(100.1)).toBe(100);
    });

    it('keeps values within bounds unchanged', () => {
      expect(clampRaw(0)).toBe(0);
      expect(clampRaw(50)).toBe(50);
      expect(clampRaw(100)).toBe(100);
      expect(clampRaw(25.5)).toBe(25.5);
    });

    it('respects custom min and max bounds', () => {
      expect(clampRaw(5, 10, 20)).toBe(10);
      expect(clampRaw(25, 10, 20)).toBe(20);
      expect(clampRaw(15, 10, 20)).toBe(15);
    });

    it('handles edge cases', () => {
      expect(clampRaw(0, 0, 0)).toBe(0);
      expect(clampRaw(5, 5, 5)).toBe(5);
      expect(clampRaw(-Infinity)).toBe(0);
      expect(clampRaw(Infinity)).toBe(100);
    });
  });

  describe('mapToTier', () => {
    const militaryThresholds: TierThreshold[] = [
      { tier: 'militia', min: 0 },
      { tier: 'garrison', min: 20 },
      { tier: 'formidable', min: 50 },
      { tier: 'host', min: 90 },
    ];

    const prosperityThresholds: TierThreshold[] = [
      { tier: 'struggling', min: 0 },
      { tier: 'modest', min: 25 },
      { tier: 'prosperous', min: 60 },
      { tier: 'opulent', min: 95 },
    ];

    it('selects correct tier for boundary values', () => {
      // Military tier boundaries
      expect(mapToTier(0, militaryThresholds)).toBe('militia');
      expect(mapToTier(19, militaryThresholds)).toBe('militia');
      expect(mapToTier(20, militaryThresholds)).toBe('garrison');
      expect(mapToTier(49, militaryThresholds)).toBe('garrison');
      expect(mapToTier(50, militaryThresholds)).toBe('formidable');
      expect(mapToTier(89, militaryThresholds)).toBe('formidable');
      expect(mapToTier(90, militaryThresholds)).toBe('host');
      expect(mapToTier(100, militaryThresholds)).toBe('host');

      // Prosperity tier boundaries
      expect(mapToTier(0, prosperityThresholds)).toBe('struggling');
      expect(mapToTier(24, prosperityThresholds)).toBe('struggling');
      expect(mapToTier(25, prosperityThresholds)).toBe('modest');
      expect(mapToTier(59, prosperityThresholds)).toBe('modest');
      expect(mapToTier(60, prosperityThresholds)).toBe('prosperous');
      expect(mapToTier(94, prosperityThresholds)).toBe('prosperous');
      expect(mapToTier(95, prosperityThresholds)).toBe('opulent');
      expect(mapToTier(100, prosperityThresholds)).toBe('opulent');
    });

    it('selects correct tier for mid-range values', () => {
      expect(mapToTier(10, militaryThresholds)).toBe('militia');
      expect(mapToTier(35, militaryThresholds)).toBe('garrison');
      expect(mapToTier(70, militaryThresholds)).toBe('formidable');
      expect(mapToTier(95, militaryThresholds)).toBe('host');

      expect(mapToTier(12, prosperityThresholds)).toBe('struggling');
      expect(mapToTier(40, prosperityThresholds)).toBe('modest');
      expect(mapToTier(75, prosperityThresholds)).toBe('prosperous');
      expect(mapToTier(98, prosperityThresholds)).toBe('opulent');
    });

    it('is stable when thresholds are unsorted', () => {
      const unsortedMilitary: TierThreshold[] = [
        { tier: 'host', min: 90 },
        { tier: 'militia', min: 0 },
        { tier: 'formidable', min: 50 },
        { tier: 'garrison', min: 20 },
      ];

      expect(mapToTier(25, unsortedMilitary)).toBe('garrison');
      expect(mapToTier(75, unsortedMilitary)).toBe('formidable');
      expect(mapToTier(95, unsortedMilitary)).toBe('host');
    });

    it('handles single threshold correctly', () => {
      const singleThreshold: TierThreshold[] = [{ tier: 'militia', min: 0 }];
      expect(mapToTier(0, singleThreshold)).toBe('militia');
      expect(mapToTier(50, singleThreshold)).toBe('militia');
      expect(mapToTier(100, singleThreshold)).toBe('militia');
    });

    it('throws error for empty thresholds array', () => {
      expect(() => mapToTier(50, [])).toThrow('Thresholds array cannot be empty');
    });

    it('handles negative raw values', () => {
      expect(mapToTier(-10, militaryThresholds)).toBe('militia');
      expect(mapToTier(-5, prosperityThresholds)).toBe('struggling');
    });

    it('handles very large raw values', () => {
      expect(mapToTier(1000, militaryThresholds)).toBe('host');
      expect(mapToTier(9999, prosperityThresholds)).toBe('opulent');
    });

    it('works with decimal raw values', () => {
      expect(mapToTier(19.9, militaryThresholds)).toBe('militia');
      expect(mapToTier(20.1, militaryThresholds)).toBe('garrison');
      expect(mapToTier(49.99, militaryThresholds)).toBe('garrison');
      expect(mapToTier(50.01, militaryThresholds)).toBe('formidable');
    });
  });
});
