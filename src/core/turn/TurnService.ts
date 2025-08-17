import type { GameState } from '../../types/GameState';
import { GREEDY, RANDOM } from '../ai/AiProfiles';
import type { AiProfile } from '../ai/AiTypes';
import { createPricingService } from '../pricing/PricingService';
import { loadProductionConfig } from '../production/Config';
import { applyProductionTurn } from '../production/ProductionSystem';
import { createStatsUpdateSystem } from '../stats/StatsUpdateSystem';

import { PlayerActionQueue } from './PlayerActionQueue';
import { TurnController } from './TurnController';
import type { TurnPhase } from './TurnPhase';
import { UpdatePipeline } from './UpdatePipeline';

/**
 * Options for configuring the TurnService
 */
export interface TurnServiceOptions {
  /** Optional callback for observing phase execution */

  onPhase?: (phase: TurnPhase, detail?: unknown) => void;
  /** Optional AI profiles - if not provided, uses default profiles */
  aiProfiles?: Record<string, AiProfile>;
  /** ID of the player's town - if not provided, defaults to the first town */
  playerTownId?: string;
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

  // Register the stats update system with default options
  const statsSystem = createStatsUpdateSystem(
    { raw: { prosperityDecayPerTurn: 1 }, revealInterval: 2 },
    s => s.rngSeed,
  );
  pipeline.register(statsSystem);

  // Register the production system
  const prodCfg = loadProductionConfig();
  pipeline.register(s => applyProductionTurn(s, prodCfg));

  // Register the pricing service for per-turn drift
  const pricingService = createPricingService();
  pipeline.register(s => pricingService.perTurnDrift(s));

  // Create default AI profiles if none provided
  const aiProfiles = opts?.aiProfiles ?? {
    greedy: GREEDY,
    random: RANDOM,
  };

  // Determine player town ID - default to first town if not specified
  const playerTownId =
    opts?.playerTownId ?? (state.towns.length > 0 ? state.towns[0]!.id : 'riverdale');

  const controllerOptions = {
    ...(opts?.onPhase && { onPhase: opts.onPhase }),
    goods: state.goods,
    aiProfiles,
    playerTownId,
    pricingService,
  };

  const controller = new TurnController(playerQ, pipeline, controllerOptions);

  return {
    controller,
    playerQ,
    pipeline,
  };
}
