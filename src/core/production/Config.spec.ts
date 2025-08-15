import { describe, it, expect } from 'vitest';

import type { GoodId } from '../../types/Goods';
import type { ProductionConfig } from '../../types/Production';

import { loadProductionConfig } from './Config';

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
});
