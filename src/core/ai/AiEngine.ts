import type { GameState } from '../../types/GameState';
import type { GoodId, GoodConfig } from '../../types/Goods';
import type { TradeRequest } from '../trade/TradeTypes';

import type { AiProfile, AiDecision } from './AiTypes';
import { generateCandidates } from './Candidates';
import { snapshotMarket } from './Market';
import { chooseTrade } from './Policy';
import type { Quote } from './Valuation';

/**
 * Converts a Quote into a TradeRequest for execution
 */
export function quoteToTradeRequest(q: Quote): TradeRequest {
  return {
    fromTownId: q.buyerId,        // buyer initiates the buy
    toTownId: q.sellerId,
    side: 'buy',
    goodId: q.goodId,
    quantity: q.quantity,
    pricePerUnit: q.unitSellPrice  // buyer pays seller's price (validation rule)
  };
}

/**
 * Decides on AI trade actions based on current market state and AI profile
 */
export function decideAiTrade(
  state: GameState,
  aiTownId: string,
  profile: AiProfile,
  goods: Record<GoodId, GoodConfig>,
  seed: string
): AiDecision {
  const market = snapshotMarket(state);
  const candidates = generateCandidates(market, goods, {
    maxQuantityPerTrade: profile.maxQuantityPerTrade
  });

  // Filter candidates so AI only acts for itself
  const aiCandidates = candidates.filter(candidate =>
    candidate.buyerId === aiTownId || candidate.sellerId === aiTownId
  );

  if (aiCandidates.length === 0) {
    return { skipped: true, reason: 'no-candidate' };
  }

  const chosen = chooseTrade(profile, aiCandidates, goods, seed, aiTownId);

  if (!chosen) {
    return { skipped: true, reason: 'no-candidate' };
  }

  return {
    request: quoteToTradeRequest(chosen),
    reason: profile.mode
  };
}
