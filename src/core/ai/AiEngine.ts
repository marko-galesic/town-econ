import type { GameState } from '../../types/GameState';
import type { GoodId, GoodConfig } from '../../types/Goods';
import type { TradeRequest } from '../trade/TradeTypes';

import type { AiTrace } from './AiTelemetry';
import type { AiProfile, AiDecision } from './AiTypes';
import { generateCandidates } from './Candidates';
import type { CooldownState } from './Cooldown';
import { snapshotMarket } from './Market';
import { chooseTrade } from './Policy';
import type { Quote } from './Valuation';

/**
 * Converts a Quote into a TradeRequest for execution
 */
export function quoteToTradeRequest(q: Quote): TradeRequest {
  return {
    fromTownId: q.buyerId, // buyer initiates the buy
    toTownId: q.sellerId,
    side: 'buy',
    goodId: q.goodId,
    quantity: q.quantity,
    pricePerUnit: q.unitSellPrice, // buyer pays seller's price (validation rule)
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
  seed: string,
  cooldownState?: CooldownState,
): AiDecision {
  const market = snapshotMarket(state);
  const candidates = generateCandidates(market, goods, {
    maxQuantityPerTrade: profile.maxQuantityPerTrade,
  });

  // Filter candidates so AI only acts for itself
  let aiCandidates = candidates.filter(
    candidate => candidate.buyerId === aiTownId || candidate.sellerId === aiTownId,
  );

  // Filter out candidates that are in cooldown for the buyer
  if (cooldownState) {
    aiCandidates = aiCandidates.filter(candidate => {
      // Only apply cooldown to buying actions (when AI is the buyer)
      if (candidate.buyerId === aiTownId) {
        const cooldownKey = `${aiTownId}:${candidate.goodId}`;
        const cooldownUntil = cooldownState[cooldownKey];
        if (cooldownUntil !== undefined && state.turn <= cooldownUntil) {
          return false; // Skip this candidate due to cooldown
        }
      }
      return true;
    });
  }

  if (aiCandidates.length === 0) {
    const trace: AiTrace = {
      aiTownId,
      mode: profile.mode,
      candidateCount: 0,
      reason: 'no-candidate',
    };
    return { skipped: true, reason: 'no-candidate', trace };
  }

  const chosen = chooseTrade(profile, aiCandidates, goods, seed, aiTownId);

  if (!chosen) {
    const trace: AiTrace = {
      aiTownId,
      mode: profile.mode,
      candidateCount: aiCandidates.length,
      reason: 'no-candidate',
    };
    return { skipped: true, reason: 'no-candidate', trace };
  }

  const trace: AiTrace = {
    aiTownId,
    mode: profile.mode,
    candidateCount: aiCandidates.length,
    chosen: {
      quote: chosen.quote,
      ...(chosen.score !== undefined && { score: chosen.score }),
    },
    reason: profile.mode,
  };

  return {
    request: quoteToTradeRequest(chosen.quote),
    reason: profile.mode,
    trace,
  };
}
