import type { GoodId, GoodConfig } from './Goods';
import type { Town } from './Town';

/**
 * Represents the complete state of the town economy game.
 *
 * @property turn - The current game turn (nonnegative integer)
 * @property version - The game version number (≥1)
 * @property rngSeed - The random number generator seed for reproducible gameplay
 * @property towns - Array of all towns in the game
 * @property goods - Configuration for all goods in the game economy
 */
export interface GameState {
  /** The current game turn (nonnegative integer, starts at 0) */
  turn: number;

  /** The game version number (≥1, increments with major updates) */
  version: number;

  /** The random number generator seed for reproducible gameplay (hex string) */
  rngSeed: string;

  /** Array of all towns in the game (can be empty) */
  towns: Town[];

  /** Configuration for all goods in the game economy (must include all GoodId values) */
  goods: Record<GoodId, GoodConfig>;
}
