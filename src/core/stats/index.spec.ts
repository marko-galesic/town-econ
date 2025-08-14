import { describe, it, expect } from 'vitest';

import { applyRawStatTurn, DEFAULT_RAW_RULES } from './RawStatSystem';
import { DEFAULT_REVEAL_POLICY, isRevealDue, markRevealed } from './RevealCadence';
import { clampRaw, mapToTier } from './TierMap';

describe('Stats Direct Imports', () => {
  it('should import RevealCadence components', () => {
    expect(DEFAULT_REVEAL_POLICY).toBeDefined();
    expect(isRevealDue).toBeDefined();
    expect(markRevealed).toBeDefined();
  });

  it('should import TierMap components', () => {
    expect(clampRaw).toBeDefined();
    expect(mapToTier).toBeDefined();
  });

  it('should import RawStatSystem components', () => {
    expect(applyRawStatTurn).toBeDefined();
    expect(DEFAULT_RAW_RULES).toBeDefined();
  });
});

describe('Stats Index Exports', () => {
  it('should export RevealCadence components via index', async () => {
    // Test dynamic import to see if index works
    const Stats = await import('./index');
    expect(Stats.DEFAULT_REVEAL_POLICY).toBeDefined();
    expect(Stats.isRevealDue).toBeDefined();
    expect(Stats.markRevealed).toBeDefined();
  });

  it('should export TierMap components via index', async () => {
    // Test dynamic import to see if index works
    const Stats = await import('./index');
    expect(Stats.clampRaw).toBeDefined();
    expect(Stats.mapToTier).toBeDefined();
  });

  it('should export RawStatSystem components via index', async () => {
    // Test dynamic import to see if index works
    const Stats = await import('./index');
    expect(Stats.applyRawStatTurn).toBeDefined();
    expect(Stats.DEFAULT_RAW_RULES).toBeDefined();
  });
});
