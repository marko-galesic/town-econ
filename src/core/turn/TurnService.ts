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
}

/**
 * Creates a ready-to-use TurnController with all dependencies wired up.
 *
 * This factory function provides a one-liner way for consumers (UI or CLI)
 * to get a fully configured TurnController without manual wiring.
 *
 * @param opts - Optional configuration options
 * @returns Object containing the controller, player queue, and update pipeline
 */
export function createTurnController(opts?: TurnServiceOptions): {
  controller: TurnController;
  playerQ: PlayerActionQueue;
  pipeline: UpdatePipeline;
} {
  const playerQ = new PlayerActionQueue();
  const pipeline = new UpdatePipeline();

  const controllerOptions = opts?.onPhase ? { onPhase: opts.onPhase } : undefined;
  const controller = new TurnController(playerQ, pipeline, controllerOptions);

  return {
    controller,
    playerQ,
    pipeline,
  };
}
