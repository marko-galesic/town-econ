import type { GameState } from '../../types/GameState';
import type { GoodId } from '../../types/Goods';

/**
 * Represents a town's market view for AI decision making.
 */
export interface MarketTownView {
  /** Unique identifier for the town */
  id: string;

  /** Current price for each good (nonnegative integers only) */
  prices: Record<GoodId, number>;

  /** Current stock/quantity available for each good (nonnegative integers only) */
  stock: Record<GoodId, number>;

  /** Current treasury balance (nonnegative integer) */
  treasury: number;
}

/**
 * Complete snapshot of the market state across all towns.
 */
export interface MarketSnapshot {
  /** Array of market views for each town */
  towns: MarketTownView[];
}

/**
 * Creates a pure snapshot of the current market state from GameState.
 * This function does not mutate the input state and returns a new object.
 *
 * @param state - The current game state
 * @returns A snapshot of the market state
 */
export function snapshotMarket(state: GameState): MarketSnapshot {
  const towns: MarketTownView[] = state.towns.map(town => ({
    id: town.id,
    prices: { ...town.prices },
    stock: { ...town.resources },
    treasury: town.treasury,
  }));

  return { towns };
}

/**
 * Calculates the maximum quantity that can be afforded given a treasury and unit price.
 * Clamps the quantity to what can be purchased with available funds.
 *
 * @param qty - The desired quantity to purchase
 * @param unitPrice - The price per unit
 * @param treasury - The available treasury balance
 * @returns The maximum affordable quantity (clamped by treasury)
 */
export function maxAffordable(qty: number, unitPrice: number, treasury: number): number {
  if (unitPrice < 0) return 0; // Negative prices are invalid
  if (unitPrice === 0) return qty; // Free goods - can buy any quantity
  if (treasury <= 0) return 0; // No money - can't buy anything

  const maxQty = Math.floor(treasury / unitPrice);
  return Math.min(qty, maxQty);
}

/**
 * Calculates the maximum quantity that can be traded given available stock.
 * Floors at 0 and clamps to available stock.
 *
 * @param qty - The desired quantity to trade
 * @param stock - The available stock quantity
 * @returns The maximum tradable quantity (clamped by stock)
 */
export function maxTradableStock(qty: number, stock: number): number {
  if (stock <= 0) return 0; // No stock available
  if (qty <= 0) return 0; // No quantity requested

  return Math.min(qty, stock);
}
