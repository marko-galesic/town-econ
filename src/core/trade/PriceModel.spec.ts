import { describe, it, expect } from 'vitest';

import type { Town } from '../../types/Town';

import { createSimpleLinearPriceModel } from './PriceModel';

describe('PriceModel', () => {
  // Test fixture: a simple town with initial prices
  const createTestTown = (): Town => ({
    id: 'test-town',
    name: 'Test Town',
    resources: { fish: 100, wood: 50, ore: 25 },
    prices: { fish: 10, wood: 20, ore: 30 },
    militaryRaw: 0,
    prosperityRaw: 0,
    treasury: 1000,
    revealed: {
      militaryTier: 'militia',
      prosperityTier: 'struggling',
      lastUpdatedTurn: 0,
    },
  });

  describe('createSimpleLinearPriceModel', () => {
    it('should create a price model with default options', () => {
      const model = createSimpleLinearPriceModel();
      expect(model).toBeDefined();
      expect(typeof model.quote).toBe('function');
      expect(typeof model.applyTrade).toBe('function');
    });

    it('should create a price model with custom options', () => {
      const model = createSimpleLinearPriceModel({
        baseStep: 5,
        min: 1,
        max: 200,
      });
      expect(model).toBeDefined();
    });
  });

  describe('quote', () => {
    it('should return the current price for a good', () => {
      const model = createSimpleLinearPriceModel();
      const town = createTestTown();

      expect(model.quote(town, 'fish')).toBe(10);
      expect(model.quote(town, 'wood')).toBe(20);
      expect(model.quote(town, 'ore')).toBe(30);
    });

    it('should return the same price for the same town and good', () => {
      const model = createSimpleLinearPriceModel();
      const town = createTestTown();

      const price1 = model.quote(town, 'fish');
      const price2 = model.quote(town, 'fish');

      expect(price1).toBe(price2);
    });
  });

  describe('applyTrade', () => {
    it('should increase price when goods are sold from town (negative quantityDelta)', () => {
      const model = createSimpleLinearPriceModel();
      const town = createTestTown();
      const originalPrice = town.prices.fish;

      const updatedTown = model.applyTrade(town, 'fish', -5);

      expect(updatedTown.prices.fish).toBe(originalPrice + 1);
      expect(updatedTown.prices.fish).toBeGreaterThan(originalPrice);
    });

    it('should decrease price when goods are bought by town (positive quantityDelta)', () => {
      const model = createSimpleLinearPriceModel();
      const town = createTestTown();
      const originalPrice = town.prices.fish;

      const updatedTown = model.applyTrade(town, 'fish', 3);

      expect(updatedTown.prices.fish).toBe(originalPrice - 1);
      expect(updatedTown.prices.fish).toBeLessThan(originalPrice);
    });

    it('should not change price when quantityDelta is zero', () => {
      const model = createSimpleLinearPriceModel();
      const town = createTestTown();
      const originalPrice = town.prices.fish;

      const updatedTown = model.applyTrade(town, 'fish', 0);

      expect(updatedTown.prices.fish).toBe(originalPrice);
    });

    it('should respect custom baseStep option', () => {
      const model = createSimpleLinearPriceModel({ baseStep: 3 });
      const town = createTestTown();
      const originalPrice = town.prices.fish;

      const updatedTown = model.applyTrade(town, 'fish', -2);

      expect(updatedTown.prices.fish).toBe(originalPrice + 3);
    });

    it('should clamp prices to minimum value', () => {
      const model = createSimpleLinearPriceModel({ min: 5 });
      const town = createTestTown();
      // Set fish price to minimum
      town.prices.fish = 5;

      const updatedTown = model.applyTrade(town, 'fish', 10);

      expect(updatedTown.prices.fish).toBe(5); // Should not go below 5
    });

    it('should clamp prices to maximum value', () => {
      const model = createSimpleLinearPriceModel({ max: 15 });
      const town = createTestTown();
      // Set fish price to maximum
      town.prices.fish = 15;

      const updatedTown = model.applyTrade(town, 'fish', -10);

      expect(updatedTown.prices.fish).toBe(15); // Should not go above 15
    });

    it('should clamp prices at both boundaries', () => {
      const model = createSimpleLinearPriceModel({ min: 5, max: 15 });
      const town = createTestTown();

      // Test minimum boundary
      town.prices.fish = 5;
      let updatedTown = model.applyTrade(town, 'fish', 10);
      expect(updatedTown.prices.fish).toBe(5);

      // Test maximum boundary
      town.prices.fish = 15;
      updatedTown = model.applyTrade(town, 'fish', -10);
      expect(updatedTown.prices.fish).toBe(15);
    });

    it('should only modify the price of the traded good', () => {
      const model = createSimpleLinearPriceModel();
      const town = createTestTown();
      const originalFishPrice = town.prices.fish;
      const originalWoodPrice = town.prices.wood;
      const originalOrePrice = town.prices.ore;

      const updatedTown = model.applyTrade(town, 'fish', -5);

      // Fish price should change
      expect(updatedTown.prices.fish).toBe(originalFishPrice + 1);
      // Other prices should remain unchanged
      expect(updatedTown.prices.wood).toBe(originalWoodPrice);
      expect(updatedTown.prices.ore).toBe(originalOrePrice);
    });

    it('should return a new town instance (immutability)', () => {
      const model = createSimpleLinearPriceModel();
      const town = createTestTown();

      const updatedTown = model.applyTrade(town, 'fish', -5);

      // Should be a different object reference
      expect(updatedTown).not.toBe(town);
      // Original town should be unchanged
      expect(town.prices.fish).toBe(10);
      // Updated town should have new price
      expect(updatedTown.prices.fish).toBe(11);
    });

    it('should preserve all other town properties', () => {
      const model = createSimpleLinearPriceModel();
      const town = createTestTown();

      const updatedTown = model.applyTrade(town, 'fish', -5);

      // All other properties should be preserved
      expect(updatedTown.id).toBe(town.id);
      expect(updatedTown.name).toBe(town.name);
      expect(updatedTown.resources).toBe(town.resources);
      expect(updatedTown.militaryRaw).toBe(town.militaryRaw);
      expect(updatedTown.prosperityRaw).toBe(town.prosperityRaw);
      expect(updatedTown.treasury).toBe(town.treasury);
      expect(updatedTown.revealed).toBe(town.revealed);
    });

    it('should handle multiple trades on the same good', () => {
      const model = createSimpleLinearPriceModel();
      const town = createTestTown();
      const originalPrice = town.prices.fish;

      // First trade: sell 3 fish
      let updatedTown = model.applyTrade(town, 'fish', -3);
      expect(updatedTown.prices.fish).toBe(originalPrice + 1);

      // Second trade: sell 2 more fish
      updatedTown = model.applyTrade(updatedTown, 'fish', -2);
      expect(updatedTown.prices.fish).toBe(originalPrice + 2);

      // Third trade: buy 1 fish back
      updatedTown = model.applyTrade(updatedTown, 'fish', 1);
      expect(updatedTown.prices.fish).toBe(originalPrice + 1);
    });
  });

  describe('edge cases', () => {
    it('should handle very large quantity deltas', () => {
      const model = createSimpleLinearPriceModel();
      const town = createTestTown();
      const originalPrice = town.prices.fish;

      const updatedTown = model.applyTrade(town, 'fish', -1000);

      // Should still only increase by baseStep
      expect(updatedTown.prices.fish).toBe(originalPrice + 1);
    });

    it('should handle negative quantity deltas with custom step', () => {
      const model = createSimpleLinearPriceModel({ baseStep: 2 });
      const town = createTestTown();
      const originalPrice = town.prices.fish;

      const updatedTown = model.applyTrade(town, 'fish', -7);

      expect(updatedTown.prices.fish).toBe(originalPrice + 2);
    });

    it('should handle positive quantity deltas with custom step', () => {
      const model = createSimpleLinearPriceModel({ baseStep: 2 });
      const town = createTestTown();
      const originalPrice = town.prices.fish;

      const updatedTown = model.applyTrade(town, 'fish', 7);

      expect(updatedTown.prices.fish).toBe(originalPrice - 2);
    });
  });
});
