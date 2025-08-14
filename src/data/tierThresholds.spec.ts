import { describe, it, expect } from 'vitest';

import type { TierConfig } from '../core/stats/TierMap';

import tierThresholds from './tierThresholds.json';

describe('tierThresholds.json', () => {
  it('should have valid structure', () => {
    expect(tierThresholds).toHaveProperty('military');
    expect(tierThresholds).toHaveProperty('prosperity');

    expect(Array.isArray(tierThresholds.military)).toBe(true);
    expect(Array.isArray(tierThresholds.prosperity)).toBe(true);
  });

  it('should have military tiers in correct order', () => {
    const military = tierThresholds.military as TierConfig['military'];

    expect(military).toHaveLength(4);
    expect(military[0]?.tier).toBe('militia');
    expect(military[1]?.tier).toBe('garrison');
    expect(military[2]?.tier).toBe('formidable');
    expect(military[3]?.tier).toBe('host');

    // Verify min values are ascending
    expect(military[0]?.min).toBe(0);
    expect(military[1]?.min).toBe(20);
    expect(military[2]?.min).toBe(50);
    expect(military[3]?.min).toBe(90);
  });

  it('should have prosperity tiers in correct order', () => {
    const prosperity = tierThresholds.prosperity as TierConfig['prosperity'];

    expect(prosperity).toHaveLength(4);
    expect(prosperity[0]?.tier).toBe('struggling');
    expect(prosperity[1]?.tier).toBe('modest');
    expect(prosperity[2]?.tier).toBe('prosperous');
    expect(prosperity[3]?.tier).toBe('opulent');

    // Verify min values are ascending
    expect(prosperity[0]?.min).toBe(0);
    expect(prosperity[1]?.min).toBe(25);
    expect(prosperity[2]?.min).toBe(60);
    expect(prosperity[3]?.min).toBe(95);
  });

  it('should have integer min values', () => {
    const allThresholds = [
      ...(tierThresholds.military as TierConfig['military']),
      ...(tierThresholds.prosperity as TierConfig['prosperity']),
    ];

    allThresholds.forEach(threshold => {
      expect(Number.isInteger(threshold.min)).toBe(true);
      expect(threshold.min).toBeGreaterThanOrEqual(0);
    });
  });
});
