import type { GameState } from '../types/GameState';
import type { GoodId, GoodConfig } from '../types/Goods';
import type { Town } from '../types/Town';
import goodsData from '../data/goods.json';
import townsData from '../data/towns.json';

/**
 * Options for initializing the game state.
 */
export interface InitGameStateOptions {
  /** Optional random number generator seed. If not provided, generates a default seed. */
  rngSeed?: string;
}

/**
 * Generates a default RNG seed using crypto if available, or falls back to a static seed.
 */
function generateDefaultSeed(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(8);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  return 'default-seed-12345';
}

/**
 * Deep clones an object to ensure no shared references.
 */
function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as T;
  }

  const cloned = {} as T;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

/**
 * Initializes a new game state with the provided options.
 *
 * This function is pure and deterministic - given the same inputs, it will always
 * return the same GameState. The function deep-clones all data to ensure no
 * shared references with the source data.
 *
 * @param opts - Optional initialization options
 * @returns A new GameState instance
 */
export function initGameState(opts: InitGameStateOptions = {}): GameState {
  // Generate RNG seed (either from options or default)
  const rngSeed = opts.rngSeed ?? generateDefaultSeed();

  // Deep clone towns data to avoid shared references
  const towns = deepClone(townsData) as Town[];

    // Transform goods data from array to Record<GoodId, GoodConfig>
  const goods: Record<GoodId, GoodConfig> = {} as Record<GoodId, GoodConfig>;
  goodsData.forEach(good => {
    goods[good.id as GoodId] = deepClone(good) as GoodConfig;
  });

  // Validate that every town has every GoodId in resources and prices
  const goodIds = Object.keys(goods) as GoodId[];

  towns.forEach((town, townIndex) => {
    // Check resources
    goodIds.forEach(goodId => {
      if (!(goodId in town.resources)) {
        throw new Error(`Missing resource key '${goodId}' in towns[${townIndex}].resources`);
      }
    });

    // Check prices
    goodIds.forEach(goodId => {
      if (!(goodId in town.prices)) {
        throw new Error(`Missing price key '${goodId}' in towns[${townIndex}].prices`);
      }
    });
  });

  return {
    turn: 0,
    version: 1,
    rngSeed,
    towns,
    goods
  };
}
