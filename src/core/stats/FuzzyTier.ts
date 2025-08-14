import type { TierThreshold } from './TierMap';
import { mapToTier } from './TierMap';

/**
 * Configuration options for fuzzy tier mapping
 */
export interface FuzzOptions {
  /** Probability of jittering to a neighbor tier (0.0 to 1.0) */
  jitterProb?: number;
}

/**
 * Default fuzz options
 */
export const DEFAULT_FUZZ: FuzzOptions = { jitterProb: 0.2 };

/**
 * Simple deterministic hash function for string to number conversion
 * @param str - Input string to hash
 * @returns Numeric hash value
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Deterministic PRNG using xorshift32 algorithm
 * @param seedString - Base seed string
 * @returns Function that generates deterministic random numbers for given tags
 */
export function seededRand(seedString: string) {
  return function (tag: string): number {
    // Combine seed string and tag, then hash to get numeric seed
    const combined = seedString + tag;
    let seed = simpleHash(combined);

    // xorshift32 algorithm for deterministic random number generation
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;

    // Convert to [0, 1) range
    return (seed >>> 0) / 0x100000000;
  };
}

/**
 * Maps a raw stat value to a fuzzy tier with optional jitter to neighbor tiers
 * @param raw - The raw stat value to map
 * @param thresholds - Array of tier thresholds, sorted by min value ascending
 * @param seed - Random seed string for deterministic behavior
 * @param townId - Town identifier for deterministic per-town behavior
 * @param turn - Turn number for deterministic per-turn behavior
 * @param opts - Fuzz options (defaults to DEFAULT_FUZZ)
 * @returns The fuzzy tier identifier
 */
export function fuzzyTierFor(
  raw: number,
  thresholds: TierThreshold[],
  seed: string,
  townId: string,
  turn: number,
  opts: FuzzOptions = DEFAULT_FUZZ,
): string {
  if (thresholds.length === 0) {
    throw new Error('Thresholds array cannot be empty');
  }

  const { jitterProb = DEFAULT_FUZZ.jitterProb! } = opts;

  // Find the true tier index
  const trueTier = mapToTier(raw, thresholds);
  const trueIdx = thresholds.findIndex(t => t.tier === trueTier);

  if (trueIdx === -1) {
    throw new Error(`Could not find tier ${trueTier} in thresholds`);
  }

  // Generate deterministic random number for this town/turn combination
  const rand = seededRand(seed);
  const r = rand(`${townId}:${turn}:${thresholds[0]!.tier}`);

  let finalIdx = trueIdx;

  // Apply jitter with probability jitterProb
  if (r < jitterProb) {
    // Choose neighbor tier (trueIdx ± 1)
    const jitterDirection = r < jitterProb / 2 ? -1 : 1;
    const neighborIdx = trueIdx + jitterDirection;

    // Clamp between [0, last] to stay within bounds
    finalIdx = Math.max(0, Math.min(thresholds.length - 1, neighborIdx));
  }

  return thresholds[finalIdx]!.tier;
}
