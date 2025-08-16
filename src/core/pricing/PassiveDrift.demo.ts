import type { GameState } from '../../types/GameState';

import type { PriceCurveTable } from './Config';
import { createLogRatioPriceMath } from './Curves';
import { applyPassiveDrift, DEFAULT_DRIFT } from './PassiveDrift';

/**
 * Simple demonstration of the passive drift system
 */
function demo() {
  console.log('=== Passive Price Drift Demo ===\n');

  const math = createLogRatioPriceMath();

  // Simple price curves
  const curves: PriceCurveTable = {
    fish: {
      basePrice: 10,
      targetStock: 100,
      elasticity: 1.0,
      minPrice: 1,
      maxPrice: 50,
    },
    wood: {
      basePrice: 5,
      targetStock: 80,
      elasticity: 1.0,
      minPrice: 1,
      maxPrice: 30,
    },
    ore: {
      basePrice: 15,
      targetStock: 60,
      elasticity: 1.0,
      minPrice: 1,
      maxPrice: 100,
    },
  };

  // Simple game state
  const state: GameState = {
    turn: 1,
    version: 1,
    rngSeed: 'demo',
    towns: [
      {
        id: 'demo-town',
        name: 'Demo Town',
        resources: { fish: 80, wood: 100, ore: 40 }, // fish below target (100), wood above target (80), ore below target (60)
        prices: { fish: 5, wood: 6, ore: 20 }, // fish below base (10), wood above base (5), ore above base (15)
        militaryRaw: 0,
        prosperityRaw: 0,
        treasury: 1000,
        revealed: {
          militaryTier: 'militia',
          prosperityTier: 'struggling',
          lastUpdatedTurn: 0,
        },
      },
    ],
    goods: {
      fish: {
        id: 'fish',
        name: 'Fish',
        effects: { prosperityDelta: 1, militaryDelta: 0 },
      },
      wood: {
        id: 'wood',
        name: 'Wood',
        effects: { prosperityDelta: 0, militaryDelta: 1 },
      },
      ore: {
        id: 'ore',
        name: 'Ore',
        effects: { prosperityDelta: 0, militaryDelta: 2 },
      },
    },
  };

  console.log('Initial state:');
  console.log(`- Fish stock: ${state.towns[0]?.resources.fish ?? 'N/A'} (target: 100)`);
  console.log(`- Fish price: ${state.towns[0]?.prices.fish ?? 'N/A'} (base: 10)`);
  console.log(`- Drift rate: ${DEFAULT_DRIFT.rate * 100}% per turn`);
  console.log();

  // Show price evolution over 5 turns
  let currentState = state;
  for (let turn = 1; turn <= 5; turn++) {
    currentState = applyPassiveDrift(currentState, curves, math);
    console.log(`Turn ${turn}: Fish price = ${currentState.towns[0]?.prices.fish ?? 'N/A'}`);
  }

  console.log('\nThe fish price gradually increased from 5 toward the target price');
  console.log('because the town has below-target stock (80 < 100).');
}

// Export for potential use in tests
export { demo };

// Run if this file is executed directly
// Note: This demo can be imported and called from other modules
