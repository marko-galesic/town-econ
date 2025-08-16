import { describe, it, expect } from 'vitest';

import { ProductionConfigError, validateProductionConfig } from './Config';

describe('Production Config Validation - Error Cases', () => {
  describe('base production rates validation', () => {
    it('should throw error for missing base property', () => {
      const badConfig = {};

      expect(() => {
        validateProductionConfig(badConfig);
      }).toThrow(ProductionConfigError);
      expect(() => {
        validateProductionConfig(badConfig);
      }).toThrow('Production config error at base: Expected object');
    });

    it('should throw error for missing required goods', () => {
      const badConfig = {
        base: { fish: 3, wood: 2 },
        // Missing 'ore'
      };

      expect(() => {
        validateProductionConfig(badConfig);
      }).toThrow('Production config error at base.ore: Missing required good');
    });

    it('should throw error for negative base rates', () => {
      const badConfig = {
        base: { fish: -1, wood: 2, ore: 1 },
      };

      expect(() => {
        validateProductionConfig(badConfig);
      }).toThrow('Production config error at base.fish: Expected non-negative integer, got -1');
    });

    it('should throw error for non-integer base rates', () => {
      const badConfig = {
        base: { fish: 3.5, wood: 2, ore: 1 },
      };

      expect(() => {
        validateProductionConfig(badConfig);
      }).toThrow('Production config error at base.fish: Expected integer, got 3.5');
    });

    it('should throw error for NaN base rates', () => {
      const badConfig = {
        base: { fish: NaN, wood: 2, ore: 1 },
      };

      expect(() => {
        validateProductionConfig(badConfig);
      }).toThrow('Production config error at base.fish: Expected finite number, got NaN');
    });

    it('should throw error for Infinity base rates', () => {
      const badConfig = {
        base: { fish: Infinity, wood: 2, ore: 1 },
      };

      expect(() => {
        validateProductionConfig(badConfig);
      }).toThrow('Production config error at base.fish: Expected finite number, got Infinity');
    });
  });

  describe('town multipliers validation', () => {
    it('should throw error for invalid townMultipliers type', () => {
      const badConfig = {
        base: { fish: 3, wood: 2, ore: 1 },
        townMultipliers: 'invalid',
      };

      expect(() => {
        validateProductionConfig(badConfig);
      }).toThrow('Production config error at townMultipliers: Expected object or undefined');
    });

    it('should throw error for unknown goods in town multipliers', () => {
      const badConfig = {
        base: { fish: 3, wood: 2, ore: 1 },
        townMultipliers: {
          northwestTown: { fish: 1.5, unknownGood: 2.0 },
        },
      };

      expect(() => {
        validateProductionConfig(badConfig);
      }).toThrow(
        'Production config error at townMultipliers.northwestTown.unknownGood: Unknown good: unknownGood',
      );
    });

    it('should throw error for negative town multipliers', () => {
      const badConfig = {
        base: { fish: 3, wood: 2, ore: 1 },
        townMultipliers: {
          northwestTown: { fish: -0.5 },
        },
      };

      expect(() => {
        validateProductionConfig(badConfig);
      }).toThrow(
        'Production config error at townMultipliers.northwestTown.fish: Expected positive number, got -0.5',
      );
    });

    it('should throw error for zero town multipliers', () => {
      const badConfig = {
        base: { fish: 3, wood: 2, ore: 1 },
        townMultipliers: {
          northwestTown: { fish: 0 },
        },
      };

      expect(() => {
        validateProductionConfig(badConfig);
      }).toThrow(
        'Production config error at townMultipliers.northwestTown.fish: Expected positive number, got 0',
      );
    });

    it('should throw error for town multipliers exceeding upper bound', () => {
      const badConfig = {
        base: { fish: 3, wood: 2, ore: 1 },
        townMultipliers: {
          northwestTown: { fish: 15.0 },
        },
      };

      expect(() => {
        validateProductionConfig(badConfig);
      }).toThrow(
        'Production config error at townMultipliers.northwestTown.fish: Expected number ≤ 10, got 15',
      );
    });

    it('should throw error for non-numeric town multipliers', () => {
      const badConfig = {
        base: { fish: 3, wood: 2, ore: 1 },
        townMultipliers: {
          northwestTown: { fish: 'invalid' },
        },
      };

      expect(() => {
        validateProductionConfig(badConfig);
      }).toThrow(
        'Production config error at townMultipliers.northwestTown.fish: Expected number, got string',
      );
    });

    it('should throw error for null town multiplier object', () => {
      const badConfig = {
        base: { fish: 3, wood: 2, ore: 1 },
        townMultipliers: {
          northwestTown: null,
        },
      };

      expect(() => {
        validateProductionConfig(badConfig);
      }).toThrow('Production config error at townMultipliers.northwestTown: Expected object');
    });
  });

  describe('maxPerGood validation', () => {
    it('should throw error for invalid maxPerGood type', () => {
      const badConfig = {
        base: { fish: 3, wood: 2, ore: 1 },
        maxPerGood: 'invalid',
      };

      expect(() => {
        validateProductionConfig(badConfig);
      }).toThrow('Production config error at maxPerGood: Expected object or undefined');
    });

    it('should throw error for unknown goods in maxPerGood', () => {
      const badConfig = {
        base: { fish: 3, wood: 2, ore: 1 },
        maxPerGood: { fish: 100, unknownGood: 50 },
      };

      expect(() => {
        validateProductionConfig(badConfig);
      }).toThrow('Production config error at maxPerGood.unknownGood: Unknown good: unknownGood');
    });

    it('should throw error for negative maxPerGood values', () => {
      const badConfig = {
        base: { fish: 3, wood: 2, ore: 1 },
        maxPerGood: { fish: -10 },
      };

      expect(() => {
        validateProductionConfig(badConfig);
      }).toThrow(
        'Production config error at maxPerGood.fish: Expected non-negative integer, got -10',
      );
    });

    it('should throw error for non-integer maxPerGood values', () => {
      const badConfig = {
        base: { fish: 3, wood: 2, ore: 1 },
        maxPerGood: { fish: 99.5 },
      };

      expect(() => {
        validateProductionConfig(badConfig);
      }).toThrow('Production config error at maxPerGood.fish: Expected integer, got 99.5');
    });

    it('should throw error for null maxPerGood object', () => {
      const badConfig = {
        base: { fish: 3, wood: 2, ore: 1 },
        maxPerGood: null,
      };

      expect(() => {
        validateProductionConfig(badConfig);
      }).toThrow('Production config error at maxPerGood: Expected object or undefined');
    });
  });

  describe('globalMaxResource validation', () => {
    it('should throw error for negative globalMaxResource', () => {
      const badConfig = {
        base: { fish: 3, wood: 2, ore: 1 },
        globalMaxResource: -100,
      };

      expect(() => {
        validateProductionConfig(badConfig);
      }).toThrow(
        'Production config error at globalMaxResource: Expected non-negative integer, got -100',
      );
    });

    it('should throw error for non-integer globalMaxResource', () => {
      const badConfig = {
        base: { fish: 3, wood: 2, ore: 1 },
        globalMaxResource: 1000.5,
      };

      expect(() => {
        validateProductionConfig(badConfig);
      }).toThrow('Production config error at globalMaxResource: Expected integer, got 1000.5');
    });
  });

  describe('variance validation', () => {
    it('should throw error for invalid variance type', () => {
      const badConfig = {
        base: { fish: 3, wood: 2, ore: 1 },
        variance: 'invalid',
      };

      expect(() => {
        validateProductionConfig(badConfig);
      }).toThrow('Production config error at variance: Expected object or undefined');
    });

    it('should throw error for invalid variance.enabled type', () => {
      const badConfig = {
        base: { fish: 3, wood: 2, ore: 1 },
        variance: { enabled: 'invalid' },
      };

      expect(() => {
        validateProductionConfig(badConfig);
      }).toThrow('Production config error at variance.enabled: Expected boolean');
    });

    it('should throw error for invalid variance.magnitude value', () => {
      const badConfig = {
        base: { fish: 3, wood: 2, ore: 1 },
        variance: { enabled: true, magnitude: 3 },
      };

      expect(() => {
        validateProductionConfig(badConfig);
      }).toThrow('Production config error at variance.magnitude: Expected 1, 2, or undefined');
    });

    it('should throw error for null variance object', () => {
      const badConfig = {
        base: { fish: 3, wood: 2, ore: 1 },
        variance: null,
      };

      expect(() => {
        validateProductionConfig(badConfig);
      }).toThrow('Production config error at variance: Expected object or undefined');
    });
  });

  describe('root level validation', () => {
    it('should throw error for null config', () => {
      expect(() => {
        validateProductionConfig(null);
      }).toThrow('Production config error at root: Expected object');
    });

    it('should throw error for undefined config', () => {
      expect(() => {
        validateProductionConfig(undefined);
      }).toThrow('Production config error at root: Expected object');
    });

    it('should throw error for primitive config', () => {
      expect(() => {
        validateProductionConfig('invalid');
      }).toThrow('Production config error at root: Expected object');
    });
  });

  describe('edge cases and valid configurations', () => {
    it('should validate config with empty townMultipliers', () => {
      const validConfig = {
        base: { fish: 3, wood: 2, ore: 1 },
        townMultipliers: {},
      };

      expect(() => {
        validateProductionConfig(validConfig);
      }).not.toThrow();
    });

    it('should validate config with empty maxPerGood', () => {
      const validConfig = {
        base: { fish: 3, wood: 2, ore: 1 },
        maxPerGood: {},
      };

      expect(() => {
        validateProductionConfig(validConfig);
      }).not.toThrow();
    });

    it('should validate config with variance magnitude 1', () => {
      const validConfig = {
        base: { fish: 3, wood: 2, ore: 1 },
        variance: { enabled: true, magnitude: 1 },
      };

      expect(() => {
        validateProductionConfig(validConfig);
      }).not.toThrow();
    });

    it('should validate config with variance magnitude 2', () => {
      const validConfig = {
        base: { fish: 3, wood: 2, ore: 1 },
        variance: { enabled: true, magnitude: 2 },
      };

      expect(() => {
        validateProductionConfig(validConfig);
      }).not.toThrow();
    });

    it('should validate config with variance magnitude undefined', () => {
      const validConfig = {
        base: { fish: 3, wood: 2, ore: 1 },
        variance: { enabled: true },
      };

      expect(() => {
        validateProductionConfig(validConfig);
      }).not.toThrow();
    });

    it('should validate config with all optional properties', () => {
      const validConfig = {
        base: { fish: 3, wood: 2, ore: 1 },
        townMultipliers: {
          northwestTown: { fish: 1.5, wood: 2.0 },
        },
        maxPerGood: { fish: 100, wood: 200, ore: 150 },
        globalMaxResource: 1000,
        variance: { enabled: false, magnitude: 1 },
      };

      expect(() => {
        validateProductionConfig(validConfig);
      }).not.toThrow();
    });
  });
});
