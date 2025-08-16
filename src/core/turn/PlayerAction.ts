import type { TradeRequest } from '../trade/TradeTypes';

/**
 * Types of player actions that can be performed during a turn.
 * Currently supports 'none' (no action) and 'trade' (trading goods).
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
 * Represents a player action as a discriminated union type.
 * - 'none': No action taken during the turn
 * - 'trade': Trading action with associated trade request
 */
export type PlayerAction = { type: 'none' } | TradeAction;
