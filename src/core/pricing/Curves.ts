import type { PriceCurveConfig, PriceMath, TownPriceState } from './PriceCurve';

/**
 * Creates a log-ratio price math implementation.
 *
 * This implements a stable and symmetric supply/demand curve:
 * p_next = clamp( round(base * exp( k * ln(target/stock_clamped) )), minPrice, maxPrice )
 * where k = elasticity, and stock_clamped = max(1, stock)
 *
 * The curve is:
 * - Monotonic: higher stock → lower price, lower stock → higher price
 * - Symmetric: doubling stock has inverse effect of halving stock
 * - Stable: small changes in stock produce proportional price changes
 * - Bounded: prices are clamped between minPrice and maxPrice
 *
 * @returns A PriceMath implementation using log-ratio curves
 */
export function createLogRatioPriceMath(): PriceMath {
  return {
    nextPrice(state: TownPriceState, cfg: PriceCurveConfig): number {
      const { basePrice, targetStock, elasticity, minPrice = 1, maxPrice = 9999 } = cfg;

      // Clamp stock to minimum of 1 to avoid division by zero and negative logarithms
      const stockClamped = Math.max(1, state.stock);

      // Calculate the log-ratio: ln(target/stock)
      const logRatio = Math.log(targetStock / stockClamped);

      // Apply elasticity: k * ln(target/stock)
      const elasticLogRatio = elasticity * logRatio;

      // Apply exponential: exp(k * ln(target/stock))
      const expFactor = Math.exp(elasticLogRatio);

      // Calculate base price with exponential adjustment
      const adjustedPrice = basePrice * expFactor;

      // Round to nearest integer
      const roundedPrice = Math.round(adjustedPrice);

      // Clamp between min and max prices
      const clampedPrice = Math.max(minPrice, Math.min(maxPrice, roundedPrice));

      return clampedPrice;
    },
  };
}
