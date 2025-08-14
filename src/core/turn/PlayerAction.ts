import type { TradeRequest } from '../trade/TradeTypes';

/**
 * Types of player actions that can be performed during a turn.
 */
export type PlayerActionType = 'none' | 'trade';

/**
 * Represents a trade action with a trade request payload.
 */
export interface TradeAction {
  type: 'trade';
  payload: TradeRequest;
}

/**
 * Represents a player action with a type and optional payload.
 */
export type PlayerAction = { type: 'none' } | TradeAction;
