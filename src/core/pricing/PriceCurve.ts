/**
 * Configuration for a price curve that determines how prices change based on supply/demand.
 */
export interface PriceCurveConfig {
  /** Starting price when stock == target */
  basePrice: number;
  /** Desired inventory per town for this good */
  targetStock: number;
  /** Sensitivity to supply/demand changes (>0); typical range 0.5–2 */
  elasticity: number;
  /** Clamp floor (default 1) */
  minPrice?: number;
  /** Clamp ceiling (default 9999) */
  maxPrice?: number;
}

/**
 * Current state of a town's inventory and pricing for a specific good.
 */
export interface TownPriceState {
  /** Current quantity the town holds */
  stock: number;
  /** Current integer price */
  price: number;
}

/**
 * Pure mathematical interface for computing price changes based on supply/demand curves.
 */
export interface PriceMath {
  /**
   * Pure function: compute next integer price from stock & config.
   *
   * @param state - Current town price state
   * @param cfg - Price curve configuration
   * @returns Next integer price
   */

  nextPrice(state: TownPriceState, cfg: PriceCurveConfig): number;
}
