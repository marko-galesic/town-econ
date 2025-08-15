import type { TradeRequest } from '../trade/TradeTypes';

import type { AiTrace } from './AiTelemetry';

/**
 * Represents the AI behavior mode for decision making.
 */
export type AiMode = 'random' | 'greedy';

/**
 * Configuration profile for AI behavior and decision making.
 */
export interface AiProfile {
  /** Unique identifier for the AI profile */
  id: string;
  /** The behavior mode for this AI profile */
  mode: AiMode;
  /** Weight factors for different decision criteria */
  weights: {
    /** Weight for price spread considerations (0.0 to 1.0) */
    priceSpread: number;
    /** Weight for prosperity-focused decisions (0.0 to 1.0) */
    prosperity: number;
    /** Weight for military-focused decisions (0.0 to 1.0) */
    military: number;
  };
  /** Maximum number of trades the AI can make per turn */
  maxTradesPerTurn: number;
  /** Maximum quantity of goods per individual trade */
  maxQuantityPerTrade: number;
}

/**
 * Represents an AI decision about whether to make a trade or skip.
 */
export interface AiDecision {
  /** The trade request if the AI decides to trade, undefined if skipping */
  request?: TradeRequest;
  /** Human-readable explanation of the decision */
  reason: string;
  /** Whether the AI chose to skip trading this turn */
  skipped?: boolean;
  /** Telemetry data explaining the decision-making process */
  trace: AiTrace;
}
