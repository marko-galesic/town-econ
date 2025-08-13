import type { GoodId } from './Goods';
import type { MilitaryTier, ProsperityTier } from './Tiers';

/**
 * Represents a town in the economy simulation.
 */
export interface Town {
  /** Unique identifier for the town */
  id: string;

  /** Display name of the town */
  name: string;

  /** Current resource quantities for each good (nonnegative integers only) */
  resources: Record<GoodId, number>;

  /** Current price for each good (nonnegative integers only) */
  prices: Record<GoodId, number>;

  /** Raw military strength value (integer, can be negative) */
  militaryRaw: number;

  /** Raw prosperity value (integer, can be negative) */
  prosperityRaw: number;

  /** Revealed tier information and last update timestamp */
  revealed: {
    /** The military tier based on raw military strength (derived from militaryRaw) */
    militaryTier: MilitaryTier;
    /** The prosperity tier based on raw prosperity value (derived from prosperityRaw) */
    prosperityTier: ProsperityTier;
    /** The turn number when this information was last updated (nonnegative integer) */
    lastUpdatedTurn: number;
  };

  /** Optional AI profile identifier for automated town behavior */
  aiProfileId?: string;
}
