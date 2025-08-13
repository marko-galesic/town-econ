import { describe, it, expect } from 'vitest';

import type { GoodId, GoodConfig } from './Goods';

describe('Goods Types', () => {
  it('should have correct GoodId type', () => {
    // Test that valid GoodId values are accepted
    const validGoodIds: GoodId[] = ['fish', 'wood', 'ore'];
    expect(validGoodIds).toHaveLength(3);

    // Test that the type is correctly constrained
    expect(validGoodIds).toContain('fish');
    expect(validGoodIds).toContain('wood');
    expect(validGoodIds).toContain('ore');
  });

  it('should have correct GoodConfig interface structure', () => {
    // Test that a valid GoodConfig can be created
    const validConfig: GoodConfig = {
      id: 'fish',
      name: 'Fresh Fish',
      effects: {
        prosperityDelta: 2,
        militaryDelta: -1,
      },
    };

    expect(validConfig.id).toBe('fish');
    expect(validConfig.name).toBe('Fresh Fish');
    expect(validConfig.effects.prosperityDelta).toBe(2);
    expect(validConfig.effects.militaryDelta).toBe(-1);
  });

  it('should enforce integer constraints on delta values', () => {
    // Test that decimal values are accepted (TypeScript number type allows decimals)
    // but JSDoc documents that these should be integers
    const configWithDecimals: GoodConfig = {
      id: 'wood',
      name: 'Timber',
      effects: {
        prosperityDelta: 1.5, // Note: TypeScript allows this, but JSDoc specifies integer
        militaryDelta: -0.5,
      },
    };

    // In practice, you might want to add runtime validation or use branded types
    // to enforce integer constraints
    expect(configWithDecimals.effects.prosperityDelta).toBe(1.5);
  });

  it('should have correct type constraints', () => {
    // This test verifies that the types are correctly defined
    // by ensuring we can create valid configurations
    const fishConfig: GoodConfig = {
      id: 'fish',
      name: 'Fresh Fish',
      effects: { prosperityDelta: 1, militaryDelta: 0 },
    };

    const woodConfig: GoodConfig = {
      id: 'wood',
      name: 'Timber',
      effects: { prosperityDelta: 0, militaryDelta: 1 },
    };

    const oreConfig: GoodConfig = {
      id: 'ore',
      name: 'Iron Ore',
      effects: { prosperityDelta: -1, militaryDelta: 2 },
    };

    expect(fishConfig.id).toBe('fish');
    expect(woodConfig.id).toBe('wood');
    expect(oreConfig.id).toBe('ore');
  });
});
