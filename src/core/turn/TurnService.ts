import type { GameState } from '../../types/GameState';
import { createSimpleLinearPriceModel } from '../trade/PriceModel';

import { PlayerActionQueue } from './PlayerActionQueue';
import { TurnController } from './TurnController';
import type { TurnPhase } from './TurnPhase';
import { UpdatePipeline } from './UpdatePipeline';

/**
 * Options for configuring the TurnService
 */
export interface TurnServiceOptions {
  /** Optional callback for observing phase execution */
  // eslint-disable-next-line no-unused-vars
  onPhase?: (phase: TurnPhase, detail?: unknown) => void;
  /** Optional price model - if not provided, creates a default simple linear model */
  priceModel?: ReturnType<typeof createSimpleLinearPriceModel>;
}

/**
 * Creates a ready-to-use TurnController with all dependencies wired up.
 *
 * This factory function provides a one-liner way for consumers (UI or CLI)
 * to get a fully configured TurnController without manual wiring.
 *
 * @param state - Game state containing goods configuration
 * @param opts - Optional configuration options
 * @returns Object containing the controller, player queue, and update pipeline
 */
export function createTurnController(
  state: GameState,
  opts?: TurnServiceOptions,
): {
  controller: TurnController;
  playerQ: PlayerActionQueue;
  pipeline: UpdatePipeline;
} {
  const playerQ = new PlayerActionQueue();
  const pipeline = new UpdatePipeline();

  // Create default price model if none provided
  const priceModel = opts?.priceModel ?? createSimpleLinearPriceModel();

  const controllerOptions = {
    ...(opts?.onPhase && { onPhase: opts.onPhase }),
    priceModel,
    goods: state.goods,
  };

  const controller = new TurnController(playerQ, pipeline, controllerOptions);

  return {
    controller,
    playerQ,
    pipeline,
  };
}
