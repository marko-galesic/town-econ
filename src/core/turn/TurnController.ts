import type { GameState } from '../../types/GameState';

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { PlayerActionQueue } from './PlayerActionQueue';
import { TurnPhase } from './TurnPhase';

/**
 * Result of running a complete turn, containing the updated game state
 * and a log of all phases that were executed.
 */
export interface TurnResult {
  /** The updated game state after the turn */
  state: GameState;
  /** Array of phases executed in order during this turn */
  phaseLog: TurnPhase[];
}

/**
 * Controls the execution of game turns, orchestrating the sequence of phases.
 * For now, phases are executed in sequence without logic - they return the same state.
 *
 * Note: Currently returns the same state reference for immutability. In the future,
 * this may be changed to return shallow copies when state modifications are implemented.
 */
export class TurnController {
  constructor(private readonly playerQ: PlayerActionQueue) {
    // Ensure the queue is properly initialized
    if (!playerQ) {
      throw new Error('PlayerActionQueue is required');
    }
  }
  /**
   * Runs a complete game turn, executing all phases in sequence.
   *
   * @param state - The current game state
   * @returns Promise resolving to the turn result with updated state and phase log
   */
  async runTurn(state: GameState): Promise<TurnResult> {
    const phaseLog: TurnPhase[] = [];

    // Execute phases in order
    let currentState = await this.startTurn(state);
    phaseLog.push(TurnPhase.Start);

    currentState = await this.playerAction(currentState);
    phaseLog.push(TurnPhase.PlayerAction);

    currentState = await this.aiActions(currentState);
    phaseLog.push(TurnPhase.AiActions);

    currentState = await this.updateStats(currentState);
    phaseLog.push(TurnPhase.UpdateStats);

    currentState = await this.endTurn(currentState);
    phaseLog.push(TurnPhase.End);

    return {
      state: currentState,
      phaseLog
    };
  }

  /**
   * Start of turn phase - currently no logic implemented.
   * @param s - Current game state
   * @returns Same game state (no changes yet)
   */
  private async startTurn(s: GameState): Promise<GameState> {
    return s;
  }

  /**
   * Player action phase - consumes one action from the queue if available,
   * otherwise synthesizes a 'none' action.
   * @param s - Current game state
   * @returns Same game state (no changes yet)
   */
  private async playerAction(s: GameState): Promise<GameState> {
    // Consume one action from the queue, or synthesize 'none' if empty
    const action = this.playerQ.dequeue() ?? { type: 'none' as const };

    // TODO: Process the action based on its type
    // For now, just return the same state
    // Log the action for debugging (will be removed when logic is implemented)
    console.log('Processing player action:', action.type);

    return s;
  }

  /**
   * AI actions phase - currently no logic implemented.
   * @param s - Current game state
   * @returns Same game state (no changes yet)
   */
  private async aiActions(s: GameState): Promise<GameState> {
    return s;
  }

  /**
   * Update stats phase - currently no logic implemented.
   * @param s - Current game state
   * @returns Same game state (no changes yet)
   */
  private async updateStats(s: GameState): Promise<GameState> {
    return s;
  }

  /**
   * End of turn phase - currently no logic implemented.
   * @param s - Current game state
   * @returns Same game state (no changes yet)
   */
  private async endTurn(s: GameState): Promise<GameState> {
    return s;
  }
}
