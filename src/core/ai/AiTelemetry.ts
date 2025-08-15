import type { AiMode } from './AiTypes';
import type { Quote } from './Valuation';

/**
 * Represents telemetry data for AI decision-making, providing insight into why
 * the AI chose a particular action or decided to skip.
 */
export interface AiTrace {
  /** ID of the AI town making the decision */
  aiTownId: string;
  /** The AI behavior mode (random or greedy) */
  mode: AiMode;
  /** Number of candidate trades available to the AI */
  candidateCount: number;
  /** Details about the chosen trade, if one was selected */
  chosen?: {
    /** The quote that was chosen */
    quote: Quote;
    /** The score of the chosen quote (only present for greedy mode) */
    score?: number;
  };
  /** Human-readable explanation of the decision */
  reason: string;
}
