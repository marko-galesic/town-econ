import { describe, it, expect } from 'vitest';

import { createLogRatioPriceMath } from './Curves';
import type { PriceCurveConfig } from './PriceCurve';
import { smoothPrice, DEFAULT_SMOOTH } from './Smoothing';

describe('Pricing Stability', () => {
  const math = createLogRatioPriceMath();

  describe('Edge Cases - Stock Levels', () => {
    describe('Zero Stock (stock=0)', () => {
      it('should clamp zero stock to 1 and push price upward within max bounds', () => {
        const config: PriceCurveConfig = {
          basePrice: 10,
          targetStock: 100,
          elasticity: 1.0,
          minPrice: 1,
          maxPrice: 50,
        };

        // Test with zero stock
        const priceAtZero = math.nextPrice({ stock: 0, price: 10 }, config);

        // Should be clamped to stock=1, so price should be high but within bounds
        expect(priceAtZero).toBeGreaterThan(10); // Higher than base price
        expect(priceAtZero).toBeLessThanOrEqual(50); // Within max bounds
        expect(Number.isInteger(priceAtZero)).toBe(true); // Integer price
        expect(Number.isFinite(priceAtZero)).toBe(true); // Finite number
      });

      it('should handle zero stock with extreme elasticity without breaking', () => {
        const config: PriceCurveConfig = {
          basePrice: 10,
          targetStock: 100,
          elasticity: 5.0, // Very high elasticity
          minPrice: 1,
          maxPrice: 100,
        };

        const priceAtZero = math.nextPrice({ stock: 0, price: 10 }, config);

        expect(priceAtZero).toBeGreaterThan(10);
        expect(priceAtZero).toBeLessThanOrEqual(100);
        expect(Number.isInteger(priceAtZero)).toBe(true);
        expect(Number.isFinite(priceAtZero)).toBe(true);
      });
    });

    describe('Very High Stock (1000× target)', () => {
      it('should push price near minimum when stock is extremely high', () => {
        const config: PriceCurveConfig = {
          basePrice: 10,
          targetStock: 100,
          elasticity: 1.0,
          minPrice: 1,
          maxPrice: 50,
        };

        // Test with 1000x target stock
        const priceAtHighStock = math.nextPrice({ stock: 100000, price: 10 }, config);

        expect(priceAtHighStock).toBeLessThan(10); // Lower than base price
        expect(priceAtHighStock).toBeGreaterThanOrEqual(1); // Within min bounds
        expect(Number.isInteger(priceAtHighStock)).toBe(true);
        expect(Number.isFinite(priceAtHighStock)).toBe(true);
      });

      it('should handle extreme stock levels without numerical overflow', () => {
        const config: PriceCurveConfig = {
          basePrice: 10,
          targetStock: 100,
          elasticity: 1.0,
          minPrice: 1,
          maxPrice: 1000,
        };

        // Test with extremely high stock
        const priceAtExtremeStock = math.nextPrice({ stock: 1e9, price: 10 }, config);

        expect(priceAtExtremeStock).toBeGreaterThanOrEqual(1);
        expect(priceAtExtremeStock).toBeLessThanOrEqual(1000);
        expect(Number.isInteger(priceAtExtremeStock)).toBe(true);
        expect(Number.isFinite(priceAtExtremeStock)).toBe(true);
      });
    });

    describe('Negative Stock', () => {
      it('should clamp negative stock to 1', () => {
        const config: PriceCurveConfig = {
          basePrice: 10,
          targetStock: 100,
          elasticity: 1.0,
          minPrice: 1,
          maxPrice: 50,
        };

        const priceAtNegativeStock = math.nextPrice({ stock: -50, price: 10 }, config);
        const priceAtZeroStock = math.nextPrice({ stock: 0, price: 10 }, config);

        // Both should behave the same (clamped to 1)
        expect(priceAtNegativeStock).toBe(priceAtZeroStock);
        expect(Number.isInteger(priceAtNegativeStock)).toBe(true);
        expect(Number.isFinite(priceAtNegativeStock)).toBe(true);
      });
    });
  });

  describe('Edge Cases - Elasticity', () => {
    describe('Elasticity = 0', () => {
      it('should return approximately base price when elasticity is zero', () => {
        const config: PriceCurveConfig = {
          basePrice: 10,
          targetStock: 100,
          elasticity: 0,
          minPrice: 1,
          maxPrice: 50,
        };

        // At target stock
        const priceAtTarget = math.nextPrice({ stock: 100, price: 10 }, config);
        expect(priceAtTarget).toBe(10); // Should be exactly base price

        // At different stock levels
        const priceAtHalf = math.nextPrice({ stock: 50, price: 10 }, config);
        const priceAtDouble = math.nextPrice({ stock: 200, price: 10 }, config);

        expect(priceAtHalf).toBe(10); // No responsiveness
        expect(priceAtDouble).toBe(10); // No responsiveness
      });
    });

    describe('Extreme Elasticity (2+)', () => {
      it('should show high sensitivity but remain within bounds', () => {
        const config: PriceCurveConfig = {
          basePrice: 10,
          targetStock: 100,
          elasticity: 3.0, // High elasticity
          minPrice: 1,
          maxPrice: 50,
        };

        // Test various stock levels
        const priceAtHalf = math.nextPrice({ stock: 50, price: 10 }, config);
        const priceAtDouble = math.nextPrice({ stock: 200, price: 10 }, config);

        expect(priceAtHalf).toBeGreaterThan(10); // Higher sensitivity
        expect(priceAtDouble).toBeLessThan(10); // Higher sensitivity
        expect(priceAtHalf).toBeGreaterThanOrEqual(1);
        expect(priceAtHalf).toBeLessThanOrEqual(50);
        expect(priceAtDouble).toBeGreaterThanOrEqual(1);
        expect(priceAtDouble).toBeLessThanOrEqual(50);
        expect(Number.isInteger(priceAtHalf)).toBe(true);
        expect(Number.isInteger(priceAtDouble)).toBe(true);
      });

      it('should handle very high elasticity without numerical issues', () => {
        const config: PriceCurveConfig = {
          basePrice: 10,
          targetStock: 100,
          elasticity: 10.0, // Very high elasticity
          minPrice: 1,
          maxPrice: 100,
        };

        const priceAtLowStock = math.nextPrice({ stock: 1, price: 10 }, config);
        const priceAtHighStock = math.nextPrice({ stock: 1000, price: 10 }, config);

        expect(priceAtLowStock).toBeGreaterThanOrEqual(1);
        expect(priceAtLowStock).toBeLessThanOrEqual(100);
        expect(priceAtHighStock).toBeGreaterThanOrEqual(1);
        expect(priceAtHighStock).toBeLessThanOrEqual(100);
        expect(Number.isInteger(priceAtLowStock)).toBe(true);
        expect(Number.isInteger(priceAtHighStock)).toBe(true);
        expect(Number.isFinite(priceAtLowStock)).toBe(true);
        expect(Number.isFinite(priceAtHighStock)).toBe(true);
      });
    });

    describe('Negative Elasticity', () => {
      it('should handle negative elasticity gracefully', () => {
        const config: PriceCurveConfig = {
          basePrice: 10,
          targetStock: 100,
          elasticity: -1.0, // Negative elasticity
          minPrice: 1,
          maxPrice: 50,
        };

        const priceAtHalf = math.nextPrice({ stock: 50, price: 10 }, config);
        const priceAtDouble = math.nextPrice({ stock: 200, price: 10 }, config);

        // With negative elasticity, the relationship is inverted
        expect(priceAtHalf).toBeLessThan(10);
        expect(priceAtDouble).toBeGreaterThan(10);
        expect(Number.isInteger(priceAtHalf)).toBe(true);
        expect(Number.isInteger(priceAtDouble)).toBe(true);
        expect(Number.isFinite(priceAtHalf)).toBe(true);
        expect(Number.isFinite(priceAtDouble)).toBe(true);
      });
    });
  });

  describe('Edge Cases - Price Bounds', () => {
    describe('Min/Max Price Clamping', () => {
      it('should respect minimum price bounds', () => {
        const config: PriceCurveConfig = {
          basePrice: 10,
          targetStock: 100,
          elasticity: 1.0,
          minPrice: 5, // Higher than base
          maxPrice: 50,
        };

        // Test with very high stock (should push price down)
        const priceAtHighStock = math.nextPrice({ stock: 1000, price: 10 }, config);

        expect(priceAtHighStock).toBeGreaterThanOrEqual(5); // Respects min
        expect(priceAtHighStock).toBeLessThanOrEqual(50);
        expect(Number.isInteger(priceAtHighStock)).toBe(true);
      });

      it('should respect maximum price bounds', () => {
        const config: PriceCurveConfig = {
          basePrice: 10,
          targetStock: 100,
          elasticity: 1.0,
          minPrice: 1,
          maxPrice: 15, // Lower than what zero stock would push to
        };

        // Test with zero stock (should push price up)
        const priceAtZeroStock = math.nextPrice({ stock: 0, price: 10 }, config);

        expect(priceAtZeroStock).toBeGreaterThanOrEqual(1);
        expect(priceAtZeroStock).toBeLessThanOrEqual(15); // Respects max
        expect(Number.isInteger(priceAtZeroStock)).toBe(true);
      });

      it('should handle extreme min/max bounds', () => {
        const config: PriceCurveConfig = {
          basePrice: 10,
          targetStock: 100,
          elasticity: 1.0,
          minPrice: 1,
          maxPrice: 1, // Same as min
        };

        const priceAtAnyStock = math.nextPrice({ stock: 50, price: 10 }, config);
        expect(priceAtAnyStock).toBe(1); // Should be clamped to min/max
        expect(Number.isInteger(priceAtAnyStock)).toBe(true);
      });
    });

    describe('Base Price Edge Cases', () => {
      it('should handle zero base price', () => {
        const config: PriceCurveConfig = {
          basePrice: 0,
          targetStock: 100,
          elasticity: 1.0,
          minPrice: 1,
          maxPrice: 50,
        };

        const price = math.nextPrice({ stock: 100, price: 10 }, config);
        expect(price).toBeGreaterThanOrEqual(1);
        expect(price).toBeLessThanOrEqual(50);
        expect(Number.isInteger(price)).toBe(true);
        expect(Number.isFinite(price)).toBe(true);
      });

      it('should handle very high base price', () => {
        const config: PriceCurveConfig = {
          basePrice: 1000000,
          targetStock: 100,
          elasticity: 1.0,
          minPrice: 1,
          maxPrice: 999999,
        };

        const price = math.nextPrice({ stock: 100, price: 10 }, config);
        expect(price).toBeGreaterThanOrEqual(1);
        expect(price).toBeLessThanOrEqual(999999);
        expect(Number.isInteger(price)).toBe(true);
        expect(Number.isFinite(price)).toBe(true);
      });
    });
  });

  describe('Convergence and Stability', () => {
    describe('Repeated Drift Calls', () => {
      it('should converge monotonically toward curve price without oscillation', () => {
        const config: PriceCurveConfig = {
          basePrice: 10,
          targetStock: 100,
          elasticity: 1.0,
          minPrice: 1,
          maxPrice: 50,
        };

        // Start with price far from target
        let currentPrice = 1;
        const targetPrice = math.nextPrice({ stock: 50, price: 10 }, config);
        const prices: number[] = [];

        // Simulate multiple drift iterations
        for (let i = 0; i < 10; i++) {
          const smoothedPrice = smoothPrice(currentPrice, targetPrice, DEFAULT_SMOOTH);
          prices.push(smoothedPrice);
          currentPrice = smoothedPrice;
        }

        // Check for monotonic convergence (no oscillation)
        let lastDiff = Math.abs(prices[0]! - targetPrice);
        for (let i = 1; i < prices.length; i++) {
          const currentDiff = Math.abs(prices[i]! - targetPrice);
          expect(currentDiff).toBeLessThanOrEqual(lastDiff); // Should get closer or stay same
          lastDiff = currentDiff;
        }

        // Final price should be close to target
        expect(Math.abs(prices[prices.length - 1]! - targetPrice)).toBeLessThanOrEqual(1);
      });

      it('should handle EMA smoothing with alpha in (0,1) without oscillation', () => {
        const config: PriceCurveConfig = {
          basePrice: 10,
          targetStock: 100,
          elasticity: 1.0,
          minPrice: 1,
          maxPrice: 50,
        };

        const targetPrice = math.nextPrice({ stock: 50, price: 10 }, config);
        const currentPrice = 1;

        // Test with different smoothing factors
        const smoothingFactors = [0.1, 0.3, 0.5, 0.7, 0.9];

        for (const alpha of smoothingFactors) {
          const smoothing = { alpha };
          let price = currentPrice;
          const prices: number[] = [];

          // Simulate multiple iterations
          for (let i = 0; i < 15; i++) {
            price = smoothPrice(price, targetPrice, smoothing);
            prices.push(price);
          }

          // Check for monotonic convergence
          let lastDiff = Math.abs(prices[0]! - targetPrice);
          for (let i = 1; i < prices.length; i++) {
            const currentDiff = Math.abs(prices[i]! - targetPrice);
            expect(currentDiff).toBeLessThanOrEqual(lastDiff + 1); // Allow small rounding differences
            lastDiff = currentDiff;
          }

          // Final price should be close to target (allow more tolerance for different alpha values)
          expect(Math.abs(prices[prices.length - 1]! - targetPrice)).toBeLessThanOrEqual(5);
        }
      });
    });

    describe('Numerical Stability', () => {
      it('should never produce NaN or Infinity', () => {
        const configs: PriceCurveConfig[] = [
          { basePrice: 0, targetStock: 100, elasticity: 1.0, minPrice: 1, maxPrice: 100 },
          { basePrice: 10, targetStock: 0, elasticity: 1.0, minPrice: 1, maxPrice: 100 },
          { basePrice: 10, targetStock: 100, elasticity: 0, minPrice: 1, maxPrice: 100 },
          { basePrice: 10, targetStock: 100, elasticity: 1.0, minPrice: 0, maxPrice: 100 },
          { basePrice: 10, targetStock: 100, elasticity: 1.0, minPrice: 1, maxPrice: 0 },
        ];

        for (const config of configs) {
          const price = math.nextPrice({ stock: 100, price: 10 }, config);
          expect(Number.isNaN(price)).toBe(false);
          expect(Number.isFinite(price)).toBe(true);
        }
      });

      it('should handle extreme numerical inputs gracefully', () => {
        const config: PriceCurveConfig = {
          basePrice: 10,
          targetStock: 100,
          elasticity: 1.0,
          minPrice: 1,
          maxPrice: 50,
        };

        const extremeStocks = [
          1e-10,
          1e10,
          -1e10,
          Number.MAX_SAFE_INTEGER,
          Number.MIN_SAFE_INTEGER,
        ];

        for (const stock of extremeStocks) {
          const price = math.nextPrice({ stock, price: 10 }, config);
          expect(Number.isNaN(price)).toBe(false);
          expect(Number.isFinite(price)).toBe(true);
          expect(Number.isInteger(price)).toBe(true);
        }
      });
    });
  });

  describe('Invariants', () => {
    it('should always return integer prices', () => {
      const config: PriceCurveConfig = {
        basePrice: 10,
        targetStock: 100,
        elasticity: 1.0,
        minPrice: 1,
        maxPrice: 50,
      };

      // Test various stock levels
      for (let stock = 0; stock <= 1000; stock += 50) {
        const price = math.nextPrice({ stock, price: 10 }, config);
        expect(Number.isInteger(price)).toBe(true);
      }
    });

    it('should always return prices within bounds', () => {
      const config: PriceCurveConfig = {
        basePrice: 10,
        targetStock: 100,
        elasticity: 1.0,
        minPrice: 5,
        maxPrice: 25,
      };

      // Test various stock levels
      for (let stock = 0; stock <= 1000; stock += 50) {
        const price = math.nextPrice({ stock, price: 10 }, config);
        expect(price).toBeGreaterThanOrEqual(5);
        expect(price).toBeLessThanOrEqual(25);
      }
    });

    it('should maintain monotonic relationship with stock changes', () => {
      const config: PriceCurveConfig = {
        basePrice: 10,
        targetStock: 100,
        elasticity: 1.0,
        minPrice: 1,
        maxPrice: 50,
      };

      const stocks = [1, 25, 50, 75, 100, 125, 150, 200];
      const prices = stocks.map(stock => math.nextPrice({ stock, price: 10 }, config));

      // Prices should decrease as stock increases (inverse relationship)
      for (let i = 1; i < prices.length; i++) {
        expect(prices[i]!).toBeLessThanOrEqual(prices[i - 1]!);
      }
    });

    it('should be symmetric around target stock', () => {
      const config: PriceCurveConfig = {
        basePrice: 10,
        targetStock: 100,
        elasticity: 1.0,
        minPrice: 1,
        maxPrice: 50,
      };

      // Test symmetry: stock at 50 and 200 should have same price difference from base
      const priceAt50 = math.nextPrice({ stock: 50, price: 10 }, config);
      const priceAt200 = math.nextPrice({ stock: 200, price: 10 }, config);
      const basePrice = 10;

      const diffFromBase50 = Math.abs(priceAt50 - basePrice);
      const diffFromBase200 = Math.abs(priceAt200 - basePrice);

      // Should be approximately symmetric (allowing for rounding and clamping)
      expect(Math.abs(diffFromBase50 - diffFromBase200)).toBeLessThanOrEqual(5);
    });
  });
});
