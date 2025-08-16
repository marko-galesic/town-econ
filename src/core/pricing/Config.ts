import priceCurvesData from '../../data/priceCurves.json';
import type { GoodId } from '../../types/Goods';

import type { PriceCurveConfig } from './PriceCurve';

export type PriceCurveTable = Record<GoodId, PriceCurveConfig>;

export class PriceCurveConfigError extends Error {
  public path: string;

  constructor(path: string, msg: string) {
    super(msg);
    this.name = 'PriceCurveConfigError';
    this.path = path;
  }
}

/**
 * Validates that a number is finite and positive
 */
function isValidNumber(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new PriceCurveConfigError(path, `Expected finite non-negative number, got ${value}`);
  }
  return value;
}

/**
 * Validates that a number is finite and positive, with optional default
 */
function isValidOptionalNumber(value: unknown, path: string, defaultValue: number): number {
  if (value === undefined) {
    return defaultValue;
  }
  return isValidNumber(value, path);
}

/**
 * Loads and validates price curves configuration from JSON
 * @throws {PriceCurveConfigError} When validation fails
 */
export function loadPriceCurves(): PriceCurveTable {
  const result: PriceCurveTable = {} as PriceCurveTable;

  // Validate that all required goods are present
  const requiredGoods: GoodId[] = ['fish', 'wood', 'ore'];

  for (const goodId of requiredGoods) {
    const goodData = priceCurvesData[goodId as keyof typeof priceCurvesData];

    if (!goodData || typeof goodData !== 'object') {
      throw new PriceCurveConfigError(
        goodId,
        `Missing or invalid configuration for good: ${goodId}`,
      );
    }

    // Validate required fields
    const basePrice = isValidNumber(goodData.basePrice, `${goodId}.basePrice`);
    const targetStock = isValidNumber(goodData.targetStock, `${goodId}.targetStock`);
    const elasticity = isValidNumber(goodData.elasticity, `${goodId}.elasticity`);

    // Validate optional fields with defaults
    const minPrice = isValidOptionalNumber(goodData.minPrice, `${goodId}.minPrice`, 1);
    const maxPrice = isValidOptionalNumber(goodData.maxPrice, `${goodId}.maxPrice`, 9999);

    // Validate that minPrice < maxPrice
    if (minPrice >= maxPrice) {
      throw new PriceCurveConfigError(
        `${goodId}.minPrice`,
        `minPrice (${minPrice}) must be less than maxPrice (${maxPrice})`,
      );
    }

    // Validate that basePrice is within bounds
    if (basePrice < minPrice || basePrice > maxPrice) {
      throw new PriceCurveConfigError(
        `${goodId}.basePrice`,
        `basePrice (${basePrice}) must be between minPrice (${minPrice}) and maxPrice (${maxPrice})`,
      );
    }

    result[goodId] = {
      basePrice,
      targetStock,
      elasticity,
      minPrice,
      maxPrice,
    };
  }

  return result;
}
