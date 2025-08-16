import type { GameState } from '../../types/GameState';
import type { ProductionConfig } from '../../types/Production';

import { applyProductionTurn } from './ProductionSystem';

/**
 * Example demonstrating resource caps functionality.
 *
 * This example shows how to configure and use resource caps to prevent
 * unbounded accumulation of resources in towns.
 */
export function demonstrateResourceCaps() {
  // Example game state with a single town
  const gameState: GameState = {
    turn: 1,
    version: 1,
    rngSeed: 'example-seed',
    towns: [
      {
        id: 'riverdale',
        name: 'Riverdale',
        resources: { fish: 8, wood: 12, ore: 5 },
        prices: { fish: 10, wood: 8, ore: 15 },
        militaryRaw: 0,
        prosperityRaw: 0,
        treasury: 100,
        revealed: {
          militaryTier: 'militia' as const,
          prosperityTier: 'struggling' as const,
          lastUpdatedTurn: 0,
        },
      },
    ],
    goods: {
      fish: { id: 'fish', name: 'Fish', effects: { prosperityDelta: 2, militaryDelta: 0 } },
      wood: { id: 'wood', name: 'Wood', effects: { prosperityDelta: 1, militaryDelta: 1 } },
      ore: { id: 'ore', name: 'Ore', effects: { prosperityDelta: 0, militaryDelta: 2 } },
    },
  };

  // Example 1: Per-good caps
  console.log('=== Example 1: Per-good caps ===');
  const perGoodCapsConfig: ProductionConfig = {
    base: { fish: 4, wood: 3, ore: 2 },
    maxPerGood: { fish: 15, wood: 20 }, // fish capped at 15, wood at 20, ore unlimited
  };

  const result1 = applyProductionTurn(gameState, perGoodCapsConfig);
  console.log('Initial resources:', gameState.towns[0]!.resources);
  console.log('After production with per-good caps:', result1.towns[0]!.resources);
  console.log('Fish was capped at 15, wood at 20, ore accumulated normally');

  // Example 2: Global cap
  console.log('\n=== Example 2: Global cap ===');
  const globalCapConfig: ProductionConfig = {
    base: { fish: 4, wood: 3, ore: 2 },
    globalMaxResource: 25, // All goods capped at 25
  };

  const result2 = applyProductionTurn(gameState, globalCapConfig);
  console.log('After production with global cap:', result2.towns[0]!.resources);
  console.log('All goods capped at 25');

  // Example 3: Per-good caps take precedence over global caps
  console.log('\n=== Example 3: Per-good caps take precedence ===');
  const mixedCapsConfig: ProductionConfig = {
    base: { fish: 4, wood: 3, ore: 2 },
    maxPerGood: { fish: 18 }, // fish specifically capped at 18
    globalMaxResource: 30, // global cap at 30
  };

  const result3 = applyProductionTurn(gameState, mixedCapsConfig);
  console.log('After production with mixed caps:', result3.towns[0]!.resources);
  console.log('Fish capped at per-good limit (18), others at global limit (30)');

  // Example 4: No caps (unlimited accumulation)
  console.log('\n=== Example 4: No caps (unlimited) ===');
  const noCapsConfig: ProductionConfig = {
    base: { fish: 4, wood: 3, ore: 2 },
    // No caps specified - resources accumulate without limit
  };

  const result4 = applyProductionTurn(gameState, noCapsConfig);
  console.log('After production with no caps:', result4.towns[0]!.resources);
  console.log('All resources accumulated normally without limits');

  return {
    perGoodCaps: result1,
    globalCap: result2,
    mixedCaps: result3,
    noCaps: result4,
  };
}

/**
 * Example showing how caps work with production variance.
 */
export function demonstrateCapsWithVariance() {
  const gameState: GameState = {
    turn: 1,
    version: 1,
    rngSeed: 'variance-example',
    towns: [
      {
        id: 'hillside',
        name: 'Hillside',
        resources: { fish: 10, wood: 8, ore: 6 },
        prices: { fish: 10, wood: 8, ore: 15 },
        militaryRaw: 0,
        prosperityRaw: 0,
        treasury: 100,
        revealed: {
          militaryTier: 'militia' as const,
          prosperityTier: 'struggling' as const,
          lastUpdatedTurn: 0,
        },
      },
    ],
    goods: {
      fish: { id: 'fish', name: 'Fish', effects: { prosperityDelta: 2, militaryDelta: 0 } },
      wood: { id: 'wood', name: 'Wood', effects: { prosperityDelta: 1, militaryDelta: 1 } },
      ore: { id: 'ore', name: 'Ore', effects: { prosperityDelta: 0, militaryDelta: 2 } },
    },
  };

  const varianceWithCapsConfig: ProductionConfig = {
    base: { fish: 3, wood: 2, ore: 1 },
    variance: { enabled: true, magnitude: 2 }, // ±2 variance
    maxPerGood: { fish: 18, wood: 15 }, // caps applied after variance
  };

  console.log('=== Caps with Variance Example ===');
  console.log('Initial resources:', gameState.towns[0]!.resources);
  console.log('Base production: fish +3, wood +2, ore +1');
  console.log('Variance: ±2 for all goods');
  console.log('Caps: fish ≤ 18, wood ≤ 15, ore unlimited');

  const result = applyProductionTurn(gameState, varianceWithCapsConfig);
  console.log('After production with variance and caps:', result.towns[0]!.resources);
  console.log('Note: Caps are applied after variance calculations');

  return result;
}
