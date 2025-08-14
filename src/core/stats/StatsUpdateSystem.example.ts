import type { GameState } from '../../types/GameState';
import { UpdatePipeline } from '../turn/UpdatePipeline';

import { createStatsUpdateSystem } from './StatsUpdateSystem';

/**
 * Example demonstrating how to use StatsUpdateSystem with UpdatePipeline
 */
export function exampleStatsUpdatePipelineUsage() {
  // Create the update pipeline
  const pipeline = new UpdatePipeline();

  // Create and register the stats update system with custom options
  const statsSystem = createStatsUpdateSystem({
    raw: {
      prosperityDecayPerTurn: 2, // Custom prosperity decay
      militaryDecayPerTurn: 1, // Custom military decay
      maxRaw: 150, // Custom max raw value
    },
    revealInterval: 3, // Reveal every 3 turns
    fuzz: {
      jitterProb: 0.3, // Custom fuzz probability
    },
  });

  // Register the system with the pipeline
  pipeline.register(statsSystem);

  // You can also register additional systems
  // pipeline.register(otherSystem);

  console.log(`Pipeline has ${pipeline.systemCount} registered systems`);

  return pipeline;
}

/**
 * Example of using a custom seed accessor
 */
export function exampleCustomSeedAccessor() {
  const pipeline = new UpdatePipeline();

  // Create system with custom seed accessor that combines turn and a constant
  const statsSystem = createStatsUpdateSystem(
    { revealInterval: 1 }, // Options
    (state: GameState) => `turn-${state.turn}-custom-seed`, // Custom seed accessor
  );

  pipeline.register(statsSystem);

  return pipeline;
}

/**
 * Example of using the default configuration
 */
export function exampleDefaultConfiguration() {
  const pipeline = new UpdatePipeline();

  // Use all defaults
  const statsSystem = createStatsUpdateSystem();

  pipeline.register(statsSystem);

  return pipeline;
}
