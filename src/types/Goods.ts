/**
 * Represents the unique identifier for a good in the town economy.
 */
export type GoodId = 'fish' | 'wood' | 'ore';

/**
 * Configuration for a good in the town economy.
 *
 * @property id - The unique identifier for the good
 * @property name - The display name for the good
 * @property effects - The economic effects of this good
 * @property effects.prosperityDelta - The change in prosperity (integer)
 * @property effects.militaryDelta - The change in military strength (integer)
 */
export interface GoodConfig {
  /** The unique identifier for the good */
  id: GoodId;
  /** The display name for the good */
  name: string;
  /** The economic effects of this good */
  effects: {
    /** The change in prosperity (integer, can be negative) */
    prosperityDelta: number;
    /** The change in military strength (integer, can be negative) */
    militaryDelta: number;
  };
}
