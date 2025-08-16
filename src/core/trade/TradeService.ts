import type { GameState } from '../../types/GameState';
import type { GoodId, GoodConfig } from '../../types/Goods';
import type { createPricingService } from '../pricing/PricingService';

import { executeTrade } from './TradeExecutor';
import type { TradeLimits } from './TradeLimits';
import type { TradeRequest, TradeResult } from './TradeTypes';
import { validateTrade } from './TradeValidator';

type PricingService = ReturnType<typeof createPricingService>;

/**
 * TradeService provides a single entry point for performing complete trade transactions.
 *
 * This service composes validation, execution, and price updates into one callable unit,
 * ensuring immutability and consistency across all trade operations.
 */
export class TradeService {
  /**
   * Performs a complete trade transaction including validation, execution, and price updates.
   *
   * @param state - Current game state
   * @param request - Trade request to process
   * @param priceModel - Price model for post-trade price adjustments
   * @param goods - Configuration for all goods in the game
   * @returns Promise resolving to TradeResult with final state and deltas
   * @throws TradeValidationError if validation fails
   */
  static async performTrade(
    state: GameState,
    request: TradeRequest,
    pricingService: PricingService,
    goods: Record<GoodId, GoodConfig>,
    limits?: TradeLimits,
  ): Promise<TradeResult> {
    // Step 1: Validate the trade request
    const validatedTrade = validateTrade(state, request);

    // Step 2: Execute the trade and get intermediate result
    const executionResult = executeTrade(state, validatedTrade, goods, limits);

    // Step 3: Apply post-trade price adjustments using the pricing service
    const finalState = pricingService.afterTrade(executionResult.state, validatedTrade);

    // Return the final result with updated state
    return {
      ...executionResult,
      state: finalState,
    };
  }
}

/**
 * Convenience function for performing trades without instantiating the service class.
 *
 * @param state - Current game state
 * @param request - Trade request to process
 * @param priceModel - Price model for post-trade price adjustments
 * @param goods - Configuration for all goods in the game
 * @returns Promise resolving to TradeResult with final state and deltas
 * @throws TradeValidationError if validation fails
 */
export async function performTrade(
  state: GameState,
  request: TradeRequest,
  pricingService: PricingService,
  goods: Record<GoodId, GoodConfig>,
  limits?: TradeLimits,
): Promise<TradeResult> {
  return TradeService.performTrade(state, request, pricingService, goods, limits);
}
