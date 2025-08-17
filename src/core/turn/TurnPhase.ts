/**
 * Represents the different phases of a game turn.
 */

export enum TurnPhase {
  Start = 'start',
  PlayerAction = 'playerAction',
  AiActions = 'aiActions',
  UpdateStats = 'updateStats',
  End = 'end',
}
