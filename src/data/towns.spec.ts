import { describe, it, expect } from 'vitest';

import type { GoodId } from '../types/Goods';
import type { Town } from '../types/Town';

import townsData from './towns.json';

describe('towns.json', () => {
  it('should load valid JSON data', () => {
    expect(townsData).toBeDefined();
    expect(Array.isArray(townsData)).toBe(true);
  });

  it('should contain exactly 3 towns', () => {
    expect(townsData).toHaveLength(3);
  });

  it('should match Town interface for all entries', () => {
    const towns = townsData as Town[];

    towns.forEach(town => {
      // Check required properties exist
      expect(town).toHaveProperty('id');
      expect(town).toHaveProperty('name');
      expect(town).toHaveProperty('resources');
      expect(town).toHaveProperty('prices');
      expect(town).toHaveProperty('militaryRaw');
      expect(town).toHaveProperty('prosperityRaw');
      expect(town).toHaveProperty('treasury');
      expect(town).toHaveProperty('revealed');
      expect(town.revealed).toHaveProperty('militaryTier');
      expect(town.revealed).toHaveProperty('prosperityTier');
      expect(town.revealed).toHaveProperty('lastUpdatedTurn');

      // Check types
      expect(typeof town.id).toBe('string');
      expect(typeof town.name).toBe('string');
      expect(typeof town.militaryRaw).toBe('number');
      expect(typeof town.prosperityRaw).toBe('number');
      expect(typeof town.treasury).toBe('number');
      expect(typeof town.revealed.lastUpdatedTurn).toBe('number');

      // Check resources and prices are objects
      expect(typeof town.resources).toBe('object');
      expect(typeof town.prices).toBe('object');
      expect(town.resources).not.toBeNull();
      expect(town.prices).not.toBeNull();
    });
  });

  it('should have resources and prices for all GoodIds', () => {
    const towns = townsData as Town[];
    const expectedGoodIds: GoodId[] = ['fish', 'wood', 'ore'];

    towns.forEach(town => {
      expectedGoodIds.forEach(goodId => {
        expect(town.resources).toHaveProperty(goodId);
        expect(town.prices).toHaveProperty(goodId);
      });
    });
  });

  it('should have nonnegative integers for all resources and prices', () => {
    const towns = townsData as Town[];

    towns.forEach(town => {
      // Check resources
      Object.values(town.resources).forEach(value => {
        expect(Number.isInteger(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(0);
      });

      // Check prices
      Object.values(town.prices).forEach(value => {
        expect(Number.isInteger(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(0);
      });
    });
  });

  it('should have valid military and prosperity tiers', () => {
    const towns = townsData as Town[];
    const validMilitaryTiers = ['militia', 'garrison', 'formidable', 'host'];
    const validProsperityTiers = ['struggling', 'modest', 'prosperous', 'opulent'];

    towns.forEach(town => {
      expect(validMilitaryTiers).toContain(town.revealed.militaryTier);
      expect(validProsperityTiers).toContain(town.revealed.prosperityTier);
    });
  });

  it('should have lastUpdatedTurn set to 0 for all towns', () => {
    const towns = townsData as Town[];

    towns.forEach(town => {
      expect(town.revealed.lastUpdatedTurn).toBe(0);
    });
  });

  it('should have unique town IDs', () => {
    const towns = townsData as Town[];
    const ids = towns.map(town => town.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should have expected specific values for first town', () => {
    const towns = townsData as Town[];
    const riverdale = towns.find(town => town.id === 'riverdale');

    expect(riverdale).toBeDefined();
    expect(riverdale?.name).toBe('Riverdale');
    expect(riverdale?.resources.fish).toBe(15);
    expect(riverdale?.resources.wood).toBe(8);
    expect(riverdale?.resources.ore).toBe(3);
    expect(riverdale?.prices.fish).toBe(2);
    expect(riverdale?.prices.wood).toBe(3);
    expect(riverdale?.prices.ore).toBe(5);
    expect(riverdale?.militaryRaw).toBe(5);
    expect(riverdale?.prosperityRaw).toBe(8);
    expect(riverdale?.revealed.militaryTier).toBe('militia');
    expect(riverdale?.revealed.prosperityTier).toBe('modest');
    expect(riverdale?.treasury).toBe(750);
  });

  it('should have nonnegative integer treasury values for all towns', () => {
    const towns = townsData as Town[];

    towns.forEach(town => {
      expect(Number.isInteger(town.treasury)).toBe(true);
      expect(town.treasury).toBeGreaterThanOrEqual(0);
    });
  });
});
