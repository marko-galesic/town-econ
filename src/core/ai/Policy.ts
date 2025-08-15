import type { GoodConfig, GoodId } from '../../types/Goods';
import { seededRand } from '../stats/FuzzyTier';

import type { AiProfile } from './AiTypes';
import type { Quote } from './Valuation';
import { scoreQuote } from './Valuation';

/**
 * Result of choosing a trade, including the selected quote and its score
 */
export interface TradeChoice {
  /** The selected trade quote */
  quote: Quote;
  /** The score of the selected quote (only present for greedy mode) */
  score?: number;
}

/**
 * Chooses a trade from the given candidates based on the AI profile and seed.
 *
 * For random mode: Uses deterministic random selection based on seed and AI town ID.
 * For greedy mode: Selects the highest-scoring quote (with stable tie-breaking).
 *
 * @param profile - The AI profile containing behavior mode and weights
 * @param candidates - Array of available trade quotes
 * @param goods - Record of good configurations for scoring
 * @param seed - Random seed for deterministic behavior
 * @param aiTownId - ID of the AI town for deterministic per-town behavior
 * @returns The selected quote with score information or undefined if no candidates available
 */
export function chooseTrade(
  profile: AiProfile,
  candidates: Quote[],
  goods: Record<GoodId, GoodConfig>,
  seed: string,
  aiTownId: string,
): TradeChoice | undefined {
  // No candidates available
  if (candidates.length === 0) {
    return undefined;
  }

  if (profile.mode === 'random') {
    // Random mode: use deterministic random selection
    const rand = seededRand(seed);
    const r = rand(`ai:${aiTownId}:${candidates.length}`);
    const index = Math.floor(r * candidates.length);
    return {
      quote: candidates[index]!,
    };
  } else {
    // Greedy mode: select highest-scoring quote
    let bestQuote: Quote | undefined;
    let bestScore = -Infinity;

    for (const candidate of candidates) {
      const score = scoreQuote(candidate, goods, profile);
      if (score > bestScore) {
        bestScore = score;
        bestQuote = candidate;
      }
    }

    return bestQuote ? {
      quote: bestQuote,
      score: bestScore,
    } : undefined;
  }
}
