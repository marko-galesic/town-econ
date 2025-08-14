import type { GameState } from '../../types/GameState';
import { advanceTurn } from '../stateApi';

import type { PlayerActionQueue } from './PlayerActionQueue';
import { TurnPhaseError } from './TurnErrors';
import { TurnPhase } from './TurnPhase';
import type { UpdatePipeline } from './UpdatePipeline';

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
 * Options for configuring the TurnController
 */
export interface TurnControllerOptions {
  /** Optional callback for observing phase execution */
  // eslint-disable-next-line no-unused-vars
  onPhase?: (phase: TurnPhase, detail?: unknown) => void;
}

/**
 * Controls the execution of game turns, orchestrating the sequence of phases.
 * For now, phases are executed in sequence without logic - they return the same state.
 *
 * Note: Currently returns the same state reference for immutability. In the future,
 * this may be changed to return shallow copies when state modifications are implemented.
 */
export class TurnController {
  // eslint-disable-next-line no-unused-vars
  private readonly onPhase: ((phase: TurnPhase, detail?: unknown) => void) | undefined;

  constructor(
    private readonly playerQ: PlayerActionQueue,
    private readonly updatePipeline: UpdatePipeline,
    options?: TurnControllerOptions,
  ) {
    // Ensure the queue is properly initialized
    if (!playerQ) {
      throw new Error('PlayerActionQueue is required');
    }
    if (!updatePipeline) {
      throw new Error('UpdatePipeline is required');
    }
    this.onPhase = options?.onPhase || undefined;
  }
  /**
   * Runs a complete game turn, executing all phases in sequence.
   *
   * This method is atomic: if any phase fails, the original input state is preserved
   * and a TurnPhaseError is thrown with information about which phase failed.
   *
   * Note: This method assumes immutability - it does not mutate the input state.
   * All state modifications are performed through the individual phase methods.
   *
   * @param state - The current game state
   * @returns Promise resolving to the turn result with updated state and phase log
   * @throws TurnPhaseError if any phase fails during execution
   */
  async runTurn(state: GameState): Promise<TurnResult> {
    const phaseLog: TurnPhase[] = [];

    try {
      // Execute phases in order
      let currentState = await this.startTurn(state);
      phaseLog.push(TurnPhase.Start);
      this.onPhase?.(TurnPhase.Start);

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
        phaseLog,
      };
    } catch (error) {
      // If any phase fails, throw a TurnPhaseError with phase context
      // The original state remains unchanged due to immutability assumption
      // Determine which phase failed based on the phase log length
      let failedPhase: TurnPhase;
      if (phaseLog.length === 0) {
        failedPhase = TurnPhase.Start;
      } else if (phaseLog.length === 1) {
        failedPhase = TurnPhase.PlayerAction;
      } else if (phaseLog.length === 2) {
        failedPhase = TurnPhase.AiActions;
      } else if (phaseLog.length === 3) {
        failedPhase = TurnPhase.UpdateStats;
      } else {
        failedPhase = TurnPhase.End;
      }

      throw new TurnPhaseError(failedPhase, error);
    }
  }

  /**
   * Start of turn phase - increments the turn counter.
   * @param s - Current game state
   * @returns Game state with turn incremented by 1
   */
  private async startTurn(s: GameState): Promise<GameState> {
    return advanceTurn(s);
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

    // Notify observer of the phase execution
    this.onPhase?.(TurnPhase.PlayerAction, action);

    // Process the action based on its type
    switch (action.type) {
      case 'none':
      case 'trade':
      default:
        // For now, no state changes - just return the same state
        return s;
    }
  }

  /**
   * AI actions phase - currently no logic implemented.
   * @param s - Current game state
   * @returns Same game state (no changes yet)
   */
  private async aiActions(s: GameState): Promise<GameState> {
    const detail = { decided: false };
    this.onPhase?.(TurnPhase.AiActions, detail);
    return s;
  }

  /**
   * Update stats phase - runs all registered update systems through the pipeline.
   * @param s - Current game state
   * @returns Updated game state after all update systems have been applied
   */
  private async updateStats(s: GameState): Promise<GameState> {
    const s2 = this.updatePipeline.run(s);
    this.onPhase?.(TurnPhase.UpdateStats, { ran: this.updatePipeline.systemCount });
    return s2;
  }

  /**
   * End of turn phase - emits turn summary and returns final state.
   * @param s - Current game state
   * @returns Same game state (no changes)
   */
  private async endTurn(s: GameState): Promise<GameState> {
    this.onPhase?.(TurnPhase.End, { turn: s.turn });
    return s;
  }
}
