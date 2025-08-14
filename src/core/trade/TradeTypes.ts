import type { GameState } from '../../types/GameState';
import type { GoodId } from '../../types/Goods';
import type { Town } from '../../types/Town';

/**
 * Represents the side of a trade transaction.
 */
export type TradeSide = 'buy' | 'sell';

/**
 * Represents a trade request between two towns.
 */
export interface TradeRequest {
  /** The ID of the town initiating the trade */
  fromTownId: string;
  /** The ID of the town receiving the trade */
  toTownId: string;
  /** The ID of the good being traded */
  goodId: GoodId;
  /** The quantity of goods to trade (positive integer) */
  quantity: number;
  /** Whether this is a buy or sell transaction */
  side: TradeSide;
  /** The price per unit for the trade (nonnegative number) */
  pricePerUnit: number;
}

/**
 * Represents the result of a completed trade transaction.
 */
export interface TradeResult {
  /** The updated game state after the trade */
  state: GameState;
  /** The changes made to both towns involved in the trade */
  deltas: {
    /** Changes to the originating town */
    from: Partial<Town>;
    /** Changes to the destination town */
    to: Partial<Town>;
  };
  /** The actual unit price that was applied (may differ from requested price) */
  unitPriceApplied: number;
}
