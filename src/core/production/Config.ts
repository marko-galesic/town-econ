import productionData from '../../data/production.json';
import type { GoodId } from '../../types/Goods';
import type { ProductionConfig } from '../../types/Production';

/**
 * Custom error class for production configuration validation errors.
 * Includes the path to the problematic configuration value.
 */
export class ProductionConfigError extends Error {
  constructor(
    public path: string,
    message: string,
  ) {
    super(`Production config error at ${path}: ${message}`);
    this.name = 'ProductionConfigError';
  }
}

/**
 * Validates that a value is a finite number greater than 0.
 * @param value - The value to validate
 * @param path - The path to the value for error reporting
 * @param maxValue - Maximum allowed value (default: 10)
 * @throws ProductionConfigError if validation fails
 */
function validatePositiveFiniteNumber(value: unknown, path: string, maxValue: number = 10): void {
  if (typeof value !== 'number') {
    throw new ProductionConfigError(path, `Expected number, got ${typeof value}`);
  }

  if (!Number.isFinite(value)) {
    throw new ProductionConfigError(path, `Expected finite number, got ${value}`);
  }

  if (value <= 0) {
    throw new ProductionConfigError(path, `Expected positive number, got ${value}`);
  }

  if (value > maxValue) {
    throw new ProductionConfigError(path, `Expected number ≤ ${maxValue}, got ${value}`);
  }
}

/**
 * Validates that a value is a non-negative integer.
 * @param value - The value to validate
 * @param path - The path to the value for error reporting
 * @throws ProductionConfigError if validation fails
 */
function validateNonNegativeInteger(value: unknown, path: string): void {
  if (typeof value !== 'number') {
    throw new ProductionConfigError(path, `Expected number, got ${typeof value}`);
  }

  if (!Number.isFinite(value)) {
    throw new ProductionConfigError(path, `Expected finite number, got ${value}`);
  }

  if (!Number.isInteger(value)) {
    throw new ProductionConfigError(path, `Expected integer, got ${value}`);
  }

  if (value < 0) {
    throw new ProductionConfigError(path, `Expected non-negative integer, got ${value}`);
  }
}

/**
 * Validates the production configuration for correctness.
 * @param config - The production configuration to validate
 * @throws ProductionConfigError if validation fails
 */
export function validateProductionConfig(config: unknown): asserts config is ProductionConfig {
  if (!config || typeof config !== 'object') {
    throw new ProductionConfigError('root', 'Expected object');
  }

  const configObj = config as Record<string, unknown>;

  // Validate base production rates
  if (!configObj.base || typeof configObj.base !== 'object') {
    throw new ProductionConfigError('base', 'Expected object');
  }

  const base = configObj.base as Record<string, unknown>;
  const expectedGoods: GoodId[] = ['fish', 'wood', 'ore'];

  // Check that all expected goods are present
  expectedGoods.forEach(goodId => {
    if (!(goodId in base)) {
      throw new ProductionConfigError(`base.${goodId}`, 'Missing required good');
    }
  });

  // Validate base production rates
  expectedGoods.forEach(goodId => {
    validateNonNegativeInteger(base[goodId], `base.${goodId}`);
  });

  // Validate town multipliers if present
  if (configObj.townMultipliers !== undefined) {
    if (typeof configObj.townMultipliers !== 'object' || configObj.townMultipliers === null) {
      throw new ProductionConfigError('townMultipliers', 'Expected object or undefined');
    }

    const townMultipliers = configObj.townMultipliers as Record<string, unknown>;

    Object.entries(townMultipliers).forEach(([townId, townMultiplier]) => {
      if (typeof townMultiplier !== 'object' || townMultiplier === null) {
        throw new ProductionConfigError(`townMultipliers.${townId}`, 'Expected object');
      }

      const townMultiplierObj = townMultiplier as Record<string, unknown>;

      Object.entries(townMultiplierObj).forEach(([goodId, multiplier]) => {
        if (!expectedGoods.includes(goodId as GoodId)) {
          throw new ProductionConfigError(
            `townMultipliers.${townId}.${goodId}`,
            `Unknown good: ${goodId}`,
          );
        }
        validatePositiveFiniteNumber(multiplier, `townMultipliers.${townId}.${goodId}`);
      });
    });
  }

  // Validate maxPerGood if present
  if (configObj.maxPerGood !== undefined) {
    if (typeof configObj.maxPerGood !== 'object' || configObj.maxPerGood === null) {
      throw new ProductionConfigError('maxPerGood', 'Expected object or undefined');
    }

    const maxPerGood = configObj.maxPerGood as Record<string, unknown>;

    Object.entries(maxPerGood).forEach(([goodId, maxValue]) => {
      if (!expectedGoods.includes(goodId as GoodId)) {
        throw new ProductionConfigError(`maxPerGood.${goodId}`, `Unknown good: ${goodId}`);
      }
      validateNonNegativeInteger(maxValue, `maxPerGood.${goodId}`);
    });
  }

  // Validate globalMaxResource if present
  if (configObj.globalMaxResource !== undefined) {
    validateNonNegativeInteger(configObj.globalMaxResource, 'globalMaxResource');
  }

  // Validate variance if present
  if (configObj.variance !== undefined) {
    if (typeof configObj.variance !== 'object' || configObj.variance === null) {
      throw new ProductionConfigError('variance', 'Expected object or undefined');
    }

    const variance = configObj.variance as Record<string, unknown>;

    if (typeof variance.enabled !== 'boolean') {
      throw new ProductionConfigError('variance.enabled', 'Expected boolean');
    }

    if (variance.magnitude !== undefined) {
      if (variance.magnitude !== 1 && variance.magnitude !== 2) {
        throw new ProductionConfigError('variance.magnitude', 'Expected 1, 2, or undefined');
      }
    }
  }
}

/**
 * Loads and validates the production configuration from the JSON data file.
 * @returns The validated production configuration
 * @throws ProductionConfigError if validation fails
 */
export function loadProductionConfig(): ProductionConfig {
  const config = productionData as ProductionConfig;
  validateProductionConfig(config);
  return config;
}
