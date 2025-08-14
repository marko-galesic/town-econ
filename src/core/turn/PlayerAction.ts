/**
 * Types of player actions that can be performed during a turn.
 */
export type PlayerActionType = 'none' | 'trade';

/**
 * Represents a player action with a type and optional payload.
 */
export interface PlayerAction {
  /** The type of action to perform */
  type: PlayerActionType;
  /** Optional data associated with the action */
  payload?: unknown;
}
