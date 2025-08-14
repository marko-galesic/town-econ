import type { MilitaryTier, ProsperityTier } from '../../types/Tiers';

/**
 * Represents a single tier threshold with minimum value
 */
export interface TierThreshold {
  tier: MilitaryTier | ProsperityTier;
  min: number;
}

/**
 * Configuration containing thresholds for both military and prosperity tiers
 */
export interface TierConfig {
  military: TierThreshold[];
  prosperity: TierThreshold[];
}

/**
 * Clamps a raw stat value between min and max bounds
 * @param x - The raw stat value to clamp
 * @param min - Minimum bound (default: 0)
 * @param max - Maximum bound (default: 100)
 * @returns The clamped value, ensuring it stays within bounds
 */
export function clampRaw(x: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, x));
}

/**
 * Maps a raw stat value to its corresponding tier based on thresholds
 * @param raw - The raw stat value to map
 * @param thresholds - Array of tier thresholds, sorted by min value ascending
 * @returns The tier identifier for the given raw value
 */
export function mapToTier(raw: number, thresholds: TierThreshold[]): string {
  if (thresholds.length === 0) {
    throw new Error('Thresholds array cannot be empty');
  }

  // Sort thresholds by min value ascending to ensure correct order
  const sortedThresholds = [...thresholds].sort((a, b) => a.min - b.min);

  // Find the highest tier whose minimum value is <= raw
  let selectedTier = sortedThresholds[0]!.tier;

  for (let i = sortedThresholds.length - 1; i >= 0; i--) {
    if (raw >= sortedThresholds[i]!.min) {
      selectedTier = sortedThresholds[i]!.tier;
      break;
    }
  }

  return selectedTier;
}
