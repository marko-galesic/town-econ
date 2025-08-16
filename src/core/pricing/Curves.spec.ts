import { describe, it, expect } from 'vitest';

import { createLogRatioPriceMath } from './Curves';
import type { PriceCurveConfig, TownPriceState } from './PriceCurve';

describe('createLogRatioPriceMath', () => {
  const priceMath = createLogRatioPriceMath();

  // Test configuration with typical values
  const baseConfig: PriceCurveConfig = {
    basePrice: 100,
    targetStock: 50,
    elasticity: 1.0,
  };

  describe('basic functionality', () => {
    it('should return integer prices only', () => {
      const state: TownPriceState = { stock: 25, price: 100 };
      const result = priceMath.nextPrice(state, baseConfig);

      expect(Number.isInteger(result)).toBe(true);
    });

    it('should respect min/max price bounds', () => {
      const configWithBounds: PriceCurveConfig = {
        ...baseConfig,
        minPrice: 50,
        maxPrice: 200,
      };

      // Test minimum bound
      const lowStockState: TownPriceState = { stock: 1, price: 100 };
      const lowStockResult = priceMath.nextPrice(lowStockState, configWithBounds);
      expect(lowStockResult).toBeGreaterThanOrEqual(50);

      // Test maximum bound
      const highStockState: TownPriceState = { stock: 200, price: 100 };
      const highStockResult = priceMath.nextPrice(highStockState, configWithBounds);
      expect(highStockResult).toBeLessThanOrEqual(200);
    });

    it('should use default min/max bounds when not specified', () => {
      const state: TownPriceState = { stock: 1, price: 100 };
      const result = priceMath.nextPrice(state, baseConfig);

      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(9999);
    });
  });

  describe('equilibrium behavior', () => {
    it('should return basePrice when stock equals target', () => {
      const state: TownPriceState = { stock: 50, price: 100 };
      const result = priceMath.nextPrice(state, baseConfig);

      expect(result).toBe(100);
    });

    it('should return basePrice when stock equals target (with different base price)', () => {
      const config = { ...baseConfig, basePrice: 75 };
      const state: TownPriceState = { stock: 50, price: 100 };
      const result = priceMath.nextPrice(state, config);

      expect(result).toBe(75);
    });
  });

  describe('monotonicity', () => {
    it('should decrease price when stock increases above target', () => {
      const belowTarget: TownPriceState = { stock: 25, price: 100 };
      const atTarget: TownPriceState = { stock: 50, price: 100 };
      const aboveTarget: TownPriceState = { stock: 75, price: 100 };

      const belowPrice = priceMath.nextPrice(belowTarget, baseConfig);
      const atPrice = priceMath.nextPrice(atTarget, baseConfig);
      const abovePrice = priceMath.nextPrice(aboveTarget, baseConfig);

      expect(belowPrice).toBeGreaterThan(atPrice);
      expect(atPrice).toBeGreaterThan(abovePrice);
    });

    it('should increase price when stock decreases below target', () => {
      const aboveTarget: TownPriceState = { stock: 75, price: 100 };
      const atTarget: TownPriceState = { stock: 50, price: 100 };
      const belowTarget: TownPriceState = { stock: 25, price: 100 };

      const abovePrice = priceMath.nextPrice(aboveTarget, baseConfig);
      const atPrice = priceMath.nextPrice(atTarget, baseConfig);
      const belowPrice = priceMath.nextPrice(belowTarget, baseConfig);

      expect(abovePrice).toBeLessThan(atPrice);
      expect(atPrice).toBeLessThan(belowPrice);
    });
  });

  describe('symmetry and elasticity', () => {
    it('should show inverse relationship when stock doubles vs halves', () => {
      const config = { ...baseConfig, elasticity: 1.0 };

      // Stock = target/2 (half)
      const halfStock: TownPriceState = { stock: 25, price: 100 };
      const halfPrice = priceMath.nextPrice(halfStock, config);

      // Stock = target*2 (double)
      const doubleStock: TownPriceState = { stock: 100, price: 100 };
      const doublePrice = priceMath.nextPrice(doubleStock, config);

      // With elasticity = 1, doubling should have inverse effect of halving
      // price(half) * price(double) should approximately equal basePrice^2
      const product = halfPrice * doublePrice;
      const expectedProduct = config.basePrice * config.basePrice;

      // Allow for rounding differences
      expect(Math.abs(product - expectedProduct)).toBeLessThanOrEqual(1);
    });

    it('should be more sensitive with higher elasticity', () => {
      const lowElasticity: PriceCurveConfig = { ...baseConfig, elasticity: 0.5 };
      const highElasticity: PriceCurveConfig = { ...baseConfig, elasticity: 2.0 };

      const state: TownPriceState = { stock: 25, price: 100 };

      const lowResult = priceMath.nextPrice(state, lowElasticity);
      const highResult = priceMath.nextPrice(state, highElasticity);

      // Higher elasticity should produce more extreme price changes
      expect(highResult).toBeGreaterThan(lowResult);
    });
  });

  describe('edge cases', () => {
    it('should handle zero stock by clamping to 1', () => {
      const state: TownPriceState = { stock: 0, price: 100 };
      const result = priceMath.nextPrice(state, baseConfig);

      // Should not crash and should clamp stock to 1
      expect(result).toBeGreaterThan(0);
      expect(Number.isInteger(result)).toBe(true);
    });

    it('should handle very large stock values', () => {
      const state: TownPriceState = { stock: 10000, price: 100 };
      const result = priceMath.nextPrice(state, baseConfig);

      expect(result).toBeGreaterThan(0);
      expect(Number.isInteger(result)).toBe(true);
      expect(result).toBeLessThanOrEqual(9999); // Should respect max bound
    });

    it('should handle very small target stock', () => {
      const config = { ...baseConfig, targetStock: 1 };
      const state: TownPriceState = { stock: 2, price: 100 };
      const result = priceMath.nextPrice(state, config);

      expect(result).toBeGreaterThan(0);
      expect(Number.isInteger(result)).toBe(true);
    });
  });

  describe('determinism and purity', () => {
    it('should return same result for same inputs', () => {
      const state: TownPriceState = { stock: 30, price: 100 };
      const config = { ...baseConfig, elasticity: 1.5 };

      const result1 = priceMath.nextPrice(state, config);
      const result2 = priceMath.nextPrice(state, config);
      const result3 = priceMath.nextPrice(state, config);

      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });

    it('should not modify input objects', () => {
      const originalState: TownPriceState = { stock: 30, price: 100 };
      const originalConfig: PriceCurveConfig = { ...baseConfig, elasticity: 1.5 };

      const stateCopy = { ...originalState };
      const configCopy = { ...originalConfig };

      priceMath.nextPrice(stateCopy, configCopy);

      expect(stateCopy).toEqual(originalState);
      expect(configCopy).toEqual(originalConfig);
    });
  });

  describe('mathematical properties', () => {
    it('should handle elasticity = 1 correctly', () => {
      const config = { ...baseConfig, elasticity: 1.0 };

      // With elasticity = 1, price should be directly proportional to target/stock ratio
      const state1: TownPriceState = { stock: 25, price: 100 }; // stock = target/2
      const state2: TownPriceState = { stock: 100, price: 100 }; // stock = target*2

      const price1 = priceMath.nextPrice(state1, config);
      const price2 = priceMath.nextPrice(state2, config);

      // price1 should be approximately 2x basePrice (stock = target/2)
      // price2 should be approximately basePrice/2 (stock = target*2)
      expect(price1).toBeGreaterThan(config.basePrice);
      expect(price2).toBeLessThan(config.basePrice);
    });

    it('should produce reasonable price ranges', () => {
      const config = { ...baseConfig, elasticity: 1.0 };

      // Test extreme cases
      const veryLowStock: TownPriceState = { stock: 1, price: 100 };
      const veryHighStock: TownPriceState = { stock: 200, price: 100 };

      const lowPrice = priceMath.nextPrice(veryLowStock, config);
      const highPrice = priceMath.nextPrice(veryHighStock, config);

      // Prices should be reasonable and within bounds
      expect(lowPrice).toBeGreaterThan(0);
      expect(highPrice).toBeGreaterThan(0);
      expect(lowPrice).toBeLessThanOrEqual(9999);
      expect(highPrice).toBeLessThanOrEqual(9999);
    });
  });
});
