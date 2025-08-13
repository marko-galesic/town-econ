import { describe, it, expect } from 'vitest';

import type { GoodConfig } from '../types/Goods';

import goodsData from './goods.json';

describe('goods.json', () => {
  it('should load valid JSON data', () => {
    expect(goodsData).toBeDefined();
    expect(Array.isArray(goodsData)).toBe(true);
  });

  it('should contain exactly 3 goods', () => {
    expect(goodsData).toHaveLength(3);
  });

  it('should match GoodConfig interface for all entries', () => {
    const goods = goodsData as GoodConfig[];

    goods.forEach((good) => {
      // Check required properties exist
      expect(good).toHaveProperty('id');
      expect(good).toHaveProperty('name');
      expect(good).toHaveProperty('effects');
      expect(good.effects).toHaveProperty('prosperityDelta');
      expect(good.effects).toHaveProperty('militaryDelta');

      // Check types
      expect(typeof good.id).toBe('string');
      expect(typeof good.name).toBe('string');
      expect(typeof good.effects.prosperityDelta).toBe('number');
      expect(typeof good.effects.militaryDelta).toBe('number');

      // Check id is valid GoodId
      expect(['fish', 'wood', 'ore']).toContain(good.id);

      // Check deltas are integers in range 1-3
      expect(Number.isInteger(good.effects.prosperityDelta)).toBe(true);
      expect(Number.isInteger(good.effects.militaryDelta)).toBe(true);
      expect(good.effects.prosperityDelta).toBeGreaterThanOrEqual(1);
      expect(good.effects.prosperityDelta).toBeLessThanOrEqual(3);
      expect(good.effects.militaryDelta).toBeGreaterThanOrEqual(1);
      expect(good.effects.militaryDelta).toBeLessThanOrEqual(3);
    });
  });

  it('should have unique IDs', () => {
    const goods = goodsData as GoodConfig[];
    const ids = goods.map(good => good.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should have expected specific values', () => {
    const goods = goodsData as GoodConfig[];

    const fish = goods.find(good => good.id === 'fish');
    expect(fish).toBeDefined();
    expect(fish?.name).toBe('Fish');
    expect(fish?.effects.prosperityDelta).toBe(2);
    expect(fish?.effects.militaryDelta).toBe(1);

    const wood = goods.find(good => good.id === 'wood');
    expect(wood).toBeDefined();
    expect(wood?.name).toBe('Wood');
    expect(wood?.effects.prosperityDelta).toBe(1);
    expect(wood?.effects.militaryDelta).toBe(2);

    const ore = goods.find(good => good.id === 'ore');
    expect(ore).toBeDefined();
    expect(ore?.name).toBe('Ore');
    expect(ore?.effects.prosperityDelta).toBe(3);
    expect(ore?.effects.militaryDelta).toBe(3);
  });
});
