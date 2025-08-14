import type { GameState } from '../types/GameState';
import type { GoodId, GoodConfig } from '../types/Goods';
import type { Town } from '../types/Town';

/**
 * Represents a validation error with a precise path to the problematic field.
 */
export interface ValidationError {
  /** The path to the field that failed validation (e.g., "towns[1].prices.ore") */
  path: string;
  /** A descriptive message explaining what validation failed */
  message: string;
}

/**
 * Validates that a value is a finite integer.
 *
 * @param value - The value to validate
 * @param path - The path to this value for error reporting
 * @param minValue - Optional minimum value (inclusive)
 * @returns The validated integer value
 * @throws ValidationError if the value is not a valid integer
 */
function validateInteger(value: unknown, path: string, minValue?: number): number {
  if (typeof value !== 'number') {
    throw { path, message: `Expected number, got ${typeof value}` };
  }

  if (!Number.isFinite(value)) {
    throw { path, message: `Expected finite number, got ${value}` };
  }

  if (!Number.isInteger(value)) {
    throw { path, message: `Expected integer, got ${value}` };
  }

  if (minValue !== undefined && value < minValue) {
    throw { path, message: `Expected value >= ${minValue}, got ${value}` };
  }

  return value;
}

/**
 * Validates that a value is a string.
 *
 * @param value - The value to validate
 * @param path - The path to this value for error reporting
 * @returns The validated string value
 * @throws ValidationError if the value is not a string
 */
function validateString(value: unknown, path: string): string {
  if (typeof value !== 'string') {
    throw { path, message: `Expected string, got ${typeof value}` };
  }
  return value;
}

/**
 * Validates that a value is an array.
 *
 * @param value - The value to validate
 * @param path - The path to this value for error reporting
 * @returns The validated array value
 * @throws ValidationError if the value is not an array
 */
function validateArray<T>(value: unknown, path: string): T[] {
  if (!Array.isArray(value)) {
    throw { path, message: `Expected array, got ${typeof value}` };
  }
  return value;
}

/**
 * Validates that a value is an object (but not null or array).
 *
 * @param value - The value to validate
 * @param path - The path to this value for error reporting
 * @returns The validated object value
 * @throws ValidationError if the value is not an object
 */
function validateObject(value: unknown, path: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw { path, message: `Expected object, got ${value === null ? 'null' : typeof value}` };
  }
  return value as Record<string, unknown>;
}

/**
 * Validates a GoodConfig object.
 *
 * @param value - The value to validate
 * @param path - The path to this value for error reporting
 * @param expectedId - The expected GoodId for this config
 * @returns The validated GoodConfig
 * @throws ValidationError if validation fails
 */
function validateGoodConfig(value: unknown, path: string, expectedId: GoodId): GoodConfig {
  const obj = validateObject(value, path);

  // Check all required good config fields exist first
  if (!('id' in obj)) {
    throw { path: `${path}.id`, message: 'Missing required field: id' };
  }
  if (!('name' in obj)) {
    throw { path: `${path}.name`, message: 'Missing required field: name' };
  }
  if (!('effects' in obj)) {
    throw { path: `${path}.effects`, message: 'Missing required field: effects' };
  }

  // Validate id
  const id = validateString(obj.id, `${path}.id`);
  if (id !== expectedId) {
    throw { path: `${path}.id`, message: `Expected id to be '${expectedId}', got '${id}'` };
  }

  // Validate name
  validateString(obj.name, `${path}.name`);

  // Validate effects
  const effects = validateObject(obj.effects, `${path}.effects`);

  // Check all required effects fields exist first
  if (!('prosperityDelta' in effects)) {
    throw {
      path: `${path}.effects.prosperityDelta`,
      message: 'Missing required field: prosperityDelta',
    };
  }
  if (!('militaryDelta' in effects)) {
    throw {
      path: `${path}.effects.militaryDelta`,
      message: 'Missing required field: militaryDelta',
    };
  }

  // Validate prosperityDelta (integer, can be negative)
  validateInteger(effects.prosperityDelta, `${path}.effects.prosperityDelta`);

  // Validate militaryDelta (integer, can be negative)
  validateInteger(effects.militaryDelta, `${path}.effects.militaryDelta`);

  return value as GoodConfig;
}

/**
 * Validates a Town object.
 *
 * @param value - The value to validate
 * @param path - The path to this value for error reporting
 * @param goodIds - Array of valid GoodId values
 * @returns The validated Town
 * @throws ValidationError if validation fails
 */
function validateTown(value: unknown, path: string, goodIds: GoodId[]): Town {
  const obj = validateObject(value, path);

  // Check all required town fields exist first
  if (!('id' in obj)) {
    throw { path: `${path}.id`, message: 'Missing required field: id' };
  }
  if (!('name' in obj)) {
    throw { path: `${path}.name`, message: 'Missing required field: name' };
  }
  if (!('resources' in obj)) {
    throw { path: `${path}.resources`, message: 'Missing required field: resources' };
  }
  if (!('prices' in obj)) {
    throw { path: `${path}.prices`, message: 'Missing required field: prices' };
  }
  if (!('militaryRaw' in obj)) {
    throw { path: `${path}.militaryRaw`, message: 'Missing required field: militaryRaw' };
  }
  if (!('prosperityRaw' in obj)) {
    throw { path: `${path}.prosperityRaw`, message: 'Missing required field: prosperityRaw' };
  }
  if (!('treasury' in obj)) {
    throw { path: `${path}.treasury`, message: 'Missing required field: treasury' };
  }
  if (!('revealed' in obj)) {
    throw { path: `${path}.revealed`, message: 'Missing required field: revealed' };
  }

  // Validate id
  validateString(obj.id, `${path}.id`);

  // Validate name
  validateString(obj.name, `${path}.name`);

  // Validate resources (Record<GoodId, number> with nonnegative integers)
  const resources = validateObject(obj.resources, `${path}.resources`);
  goodIds.forEach(goodId => {
    if (!(goodId in resources)) {
      throw {
        path: `${path}.resources`,
        message: `Missing required good '${goodId}' in resources`,
      };
    }
    validateInteger(resources[goodId], `${path}.resources.${goodId}`, 0);
  });

  // Validate prices (Record<GoodId, number> with nonnegative integers)
  const prices = validateObject(obj.prices, `${path}.prices`);
  goodIds.forEach(goodId => {
    if (!(goodId in prices)) {
      throw { path: `${path}.prices`, message: `Missing required good '${goodId}' in prices` };
    }
    validateInteger(prices[goodId], `${path}.prices.${goodId}`, 0);
  });

  // Validate militaryRaw (integer, can be negative)
  validateInteger(obj.militaryRaw, `${path}.militaryRaw`);

  // Validate prosperityRaw (integer, can be negative)
  validateInteger(obj.prosperityRaw, `${path}.prosperityRaw`);

  // Validate treasury (nonnegative integer)
  validateInteger(obj.treasury, `${path}.treasury`, 0);

  // Validate revealed object
  const revealed = validateObject(obj.revealed, `${path}.revealed`);

  // Check all required revealed fields exist first
  if (!('militaryTier' in revealed)) {
    throw {
      path: `${path}.revealed.militaryTier`,
      message: 'Missing required field: militaryTier',
    };
  }
  if (!('prosperityTier' in revealed)) {
    throw {
      path: `${path}.revealed.prosperityTier`,
      message: 'Missing required field: prosperityTier',
    };
  }
  if (!('lastUpdatedTurn' in revealed)) {
    throw {
      path: `${path}.revealed.lastUpdatedTurn`,
      message: 'Missing required field: lastUpdatedTurn',
    };
  }

  // Validate militaryTier
  const militaryTier = validateString(revealed.militaryTier, `${path}.revealed.militaryTier`);
  if (!['militia', 'garrison', 'formidable', 'host'].includes(militaryTier)) {
    throw {
      path: `${path}.revealed.militaryTier`,
      message: `Invalid military tier: ${militaryTier}`,
    };
  }

  // Validate prosperityTier
  const prosperityTier = validateString(revealed.prosperityTier, `${path}.revealed.prosperityTier`);
  if (!['struggling', 'modest', 'prosperous', 'opulent'].includes(prosperityTier)) {
    throw {
      path: `${path}.revealed.prosperityTier`,
      message: `Invalid prosperity tier: ${prosperityTier}`,
    };
  }

  // Validate lastUpdatedTurn (nonnegative integer)
  validateInteger(revealed.lastUpdatedTurn, `${path}.revealed.lastUpdatedTurn`, 0);

  // Validate optional aiProfileId
  if (obj.aiProfileId !== undefined) {
    validateString(obj.aiProfileId, `${path}.aiProfileId`);
  }

  return value as Town;
}

/**
 * Validates that an object is a valid GameState.
 *
 * @param obj - The object to validate
 * @throws ValidationError if validation fails
 * @returns The validated GameState
 */
export function validateGameState(obj: unknown): asserts obj is GameState {
  const gameState = validateObject(obj, 'root');

  // Check all required root keys exist first
  if (!('turn' in gameState)) {
    throw { path: 'turn', message: 'Missing required field: turn' };
  }
  if (!('version' in gameState)) {
    throw { path: 'version', message: 'Missing required field: version' };
  }
  if (!('rngSeed' in gameState)) {
    throw { path: 'rngSeed', message: 'Missing required field: rngSeed' };
  }
  if (!('towns' in gameState)) {
    throw { path: 'towns', message: 'Missing required field: towns' };
  }
  if (!('goods' in gameState)) {
    throw { path: 'goods', message: 'Missing required field: goods' };
  }

  // Validate turn (nonnegative integer)
  validateInteger(gameState.turn, 'turn', 0);

  // Validate version (≥1)
  validateInteger(gameState.version, 'version', 1);

  // Validate rngSeed (string)
  validateString(gameState.rngSeed, 'rngSeed');

  // Validate towns array
  const towns = validateArray(gameState.towns, 'towns');

  // Validate goods record
  const goods = validateObject(gameState.goods, 'goods');

  // Check all required goods exist first
  if (!('fish' in goods)) {
    throw { path: 'goods', message: "Missing required good 'fish'" };
  }
  if (!('wood' in goods)) {
    throw { path: 'goods', message: "Missing required good 'wood'" };
  }
  if (!('ore' in goods)) {
    throw { path: 'goods', message: "Missing required good 'ore'" };
  }

  const goodIds: GoodId[] = ['fish', 'wood', 'ore'];

  // Validate each good config
  goodIds.forEach(goodId => {
    validateGoodConfig(goods[goodId], `goods.${goodId}`, goodId);
  });

  // Validate each town
  towns.forEach((town, index) => {
    validateTown(town, `towns[${index}]`, goodIds);
  });
}
