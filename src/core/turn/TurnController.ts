import type { GameState } from '../../types/GameState';
import type { GoodConfig } from '../../types/Goods';
import { decideAiTrade } from '../ai/AiEngine';
import type { AiProfile } from '../ai/AiTypes';
import type { CooldownState } from '../ai/Cooldown';
import { markCooldown, createCooldownKey, clearExpiredCooldowns } from '../ai/Cooldown';
import { advanceTurn } from '../stateApi';
import type { PriceModel } from '../trade/PriceModel';
import { performTrade } from '../trade/TradeService';

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
  /** Price model for trade price adjustments */
  priceModel: PriceModel;
  /** Configuration for all goods in the game */
  goods: Record<string, GoodConfig>;
  /** AI profiles for automated town behavior */
  aiProfiles: Record<string, AiProfile>;
  /** ID of the player's town (AI towns are all others) */
  playerTownId: string;
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
  private readonly priceModel: PriceModel;
  private readonly goods: Record<string, GoodConfig>;
  private readonly aiProfiles: Record<string, AiProfile>;
  private readonly playerTownId: string;
  private cooldownState: CooldownState = {};

  constructor(
    private readonly playerQ: PlayerActionQueue,
    private readonly updatePipeline: UpdatePipeline,
    options: TurnControllerOptions,
  ) {
    // Ensure the queue is properly initialized
    if (!playerQ) {
      throw new Error('PlayerActionQueue is required');
    }
    if (!updatePipeline) {
      throw new Error('UpdatePipeline is required');
    }
    if (!options.priceModel) {
      throw new Error('PriceModel is required');
    }
    if (!options.goods) {
      throw new Error('Goods configuration is required');
    }
    if (!options.aiProfiles) {
      throw new Error('AI profiles are required');
    }
    if (!options.playerTownId) {
      throw new Error('Player town ID is required');
    }

    this.onPhase = options.onPhase || undefined;
    this.priceModel = options.priceModel;
    this.goods = options.goods;
    this.aiProfiles = options.aiProfiles;
    this.playerTownId = options.playerTownId;
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
   * @returns Updated game state after processing the action
   */
  private async playerAction(s: GameState): Promise<GameState> {
    // Consume one action from the queue, or synthesize 'none' if empty
    const action = this.playerQ.dequeue() ?? { type: 'none' as const };

    // Process the action based on its type
    let resultSummary: unknown;
    let currentState = s;

    switch (action.type) {
      case 'trade':
        try {
          const tradeResult = await performTrade(s, action.payload, this.priceModel, this.goods);
          currentState = tradeResult.state;
          resultSummary = {
            action,
            result: {
              unitPriceApplied: tradeResult.unitPriceApplied,
              deltas: tradeResult.deltas,
            },
          };
        } catch (error) {
          // Wrap trade errors in TurnPhaseError to maintain phase error policy
          throw new TurnPhaseError(TurnPhase.PlayerAction, error);
        }
        break;

      case 'none':
      default:
        // No state changes for 'none' action
        resultSummary = { action };
        break;
    }

    // Notify observer of the phase execution
    this.onPhase?.(TurnPhase.PlayerAction, resultSummary);

    return currentState;
  }

  /**
   * AI actions phase - processes AI trade decisions for each AI town.
   * @param s - Current game state
   * @returns Updated game state after AI actions
   */
  private async aiActions(s: GameState): Promise<GameState> {
    let currentState = s;
    const aiTowns = s.towns.filter(town => town.id !== this.playerTownId);

    // Clear expired cooldowns at the start of AI actions phase
    // Clear cooldowns that expired before this turn started
    clearExpiredCooldowns(this.cooldownState, s.turn - 1);

          // If there are no AI towns, emit a simple phase hook and return
      if (aiTowns.length === 0) {
        this.onPhase?.(TurnPhase.AiActions, { decided: false });
        return currentState;
      }

      // Emit phase hook before AI actions execution
      this.onPhase?.(TurnPhase.AiActions, { phase: 'start', aiTownCount: aiTowns.length });

    for (const town of aiTowns) {
      // Get AI profile for this town, defaulting to 'greedy' if not specified
      const profile = this.aiProfiles[town.aiProfileId || 'greedy'] || this.aiProfiles['greedy'];

      if (!profile) {
        continue;
      }

      // Decide on trade action
      const decision = decideAiTrade(
        currentState,
        town.id,
        profile,
        this.goods,
        currentState.rngSeed,
        this.cooldownState,
      );

      if (decision.request) {
        try {
          // Execute the trade
          const tradeResult = await performTrade(
            currentState,
            decision.request,
            this.priceModel,
            this.goods,
          );
          currentState = tradeResult.state;

          // Mark cooldown for the AI town that made the decision (townId, goodId) combination
          const cooldownKey = createCooldownKey(town.id, decision.request.goodId);
          markCooldown(this.cooldownState, cooldownKey, s.turn);

          // Notify observer with trade details and telemetry
          this.onPhase?.(TurnPhase.AiActions, {
            townId: town.id,
            decision,
            tradeResult: {
              unitPriceApplied: tradeResult.unitPriceApplied,
              deltas: tradeResult.deltas,
            },
            trace: decision.trace,
          });

          // Note: maxTradesPerTurn is per-town, not global
          // Each town can make up to their maxTradesPerTurn trades
        } catch (error) {
          // Log error but continue with other AI towns
          this.onPhase?.(TurnPhase.AiActions, {
            townId: town.id,
            decision,
            error: error instanceof Error ? error.message : String(error),
            trace: decision.trace,
          });
        }
      } else {
        // AI decided to skip trading
        this.onPhase?.(TurnPhase.AiActions, {
          townId: town.id,
          decision,
          trace: decision.trace,
        });
      }
    }

    return currentState;
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
