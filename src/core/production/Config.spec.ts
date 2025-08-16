import { describe, it, expect } from 'vitest';

import type { GoodId } from '../../types/Goods';
import type { ProductionConfig } from '../../types/Production';

import { loadProductionConfig, ProductionConfigError } from './Config';

describe('Production Config', () => {
  describe('loadProductionConfig', () => {
    it('should load production configuration successfully', () => {
      const config = loadProductionConfig();
      expect(config).toBeDefined();
      expect(typeof config).toBe('object');
    });

    it('should return valid ProductionConfig type', () => {
      const config = loadProductionConfig();
      expect(config).toMatchObject<ProductionConfig>({
        base: expect.any(Object),
        townMultipliers: expect.any(Object),
      });
    });

    it('should have base production rates for all goods', () => {
      const config = loadProductionConfig();
      const expectedGoods: GoodId[] = ['fish', 'wood', 'ore'];

      expectedGoods.forEach(goodId => {
        expect(config.base[goodId]).toBeDefined();
        expect(typeof config.base[goodId]).toBe('number');
        expect(config.base[goodId]).toBeGreaterThan(0);
      });
    });

    it('should have correct base production values', () => {
      const config = loadProductionConfig();

      expect(config.base.fish).toBe(3);
      expect(config.base.wood).toBe(2);
      expect(config.base.ore).toBe(1);
    });

    it('should have empty townMultipliers by default', () => {
      const config = loadProductionConfig();

      expect(config.townMultipliers).toBeDefined();
      expect(config.townMultipliers).toEqual({});
    });

    it('should have valid production rate types', () => {
      const config = loadProductionConfig();

      Object.values(config.base).forEach(rate => {
        expect(Number.isInteger(rate)).toBe(true);
        expect(rate).toBeGreaterThan(0);
      });
    });

    it('should not have any unexpected properties', () => {
      const config = loadProductionConfig();
      const expectedKeys = ['base', 'townMultipliers'];

      Object.keys(config).forEach(key => {
        expect(expectedKeys).toContain(key);
      });
    });
  });

  describe('ProductionConfigError', () => {
    it('should create error with path and message', () => {
      const error = new ProductionConfigError('base.fish', 'Invalid value');
      expect(error.path).toBe('base.fish');
      expect(error.message).toContain('base.fish');
      expect(error.message).toContain('Invalid value');
      expect(error.name).toBe('ProductionConfigError');
    });
  });

  describe('validation integration', () => {
    // Note: These tests verify that the validation is working by ensuring
    // that the current production.json is valid. To test negative cases,
    // we would need to mock the JSON import or create a separate test
    // configuration file.

    it('should validate current production.json successfully', () => {
      // This test ensures our current production.json passes validation
      expect(() => {
        loadProductionConfig();
      }).not.toThrow();
    });

    it('should have all required goods in base rates', () => {
      const config = loadProductionConfig();
      const expectedGoods: GoodId[] = ['fish', 'wood', 'ore'];

      expectedGoods.forEach(goodId => {
        expect(config.base).toHaveProperty(goodId);
        expect(Number.isInteger(config.base[goodId])).toBe(true);
        expect(config.base[goodId]).toBeGreaterThanOrEqual(0);
      });
    });

    it('should have valid townMultipliers structure', () => {
      const config = loadProductionConfig();

      if (config.townMultipliers) {
        expect(typeof config.townMultipliers).toBe('object');
        expect(config.townMultipliers).not.toBeNull();

        // If there are any town multipliers, validate their structure
        Object.entries(config.townMultipliers).forEach(([, townMultiplier]) => {
          expect(typeof townMultiplier).toBe('object');
          expect(townMultiplier).not.toBeNull();

          Object.entries(townMultiplier).forEach(([goodId, multiplier]) => {
            expect(['fish', 'wood', 'ore']).toContain(goodId);
            expect(typeof multiplier).toBe('number');
            expect(Number.isFinite(multiplier)).toBe(true);
            expect(multiplier).toBeGreaterThan(0);
            expect(multiplier).toBeLessThanOrEqual(10);
          });
        });
      }
    });
  });
});
