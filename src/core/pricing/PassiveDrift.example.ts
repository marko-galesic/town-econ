import type { GameState } from '../../types/GameState';

import type { PriceCurveTable } from './Config';
import { createLogRatioPriceMath } from './Curves';
import { applyPassiveDrift, DEFAULT_DRIFT } from './PassiveDrift';

/**
 * Example demonstrating how the passive drift system works.
 *
 * This shows how prices gradually drift toward their target prices
 * based on current stock levels, even without any trades occurring.
 */
export function demonstratePassiveDrift() {
  console.log('=== Passive Price Drift Example ===\n');

  // Create price math implementation
  const math = createLogRatioPriceMath();

  // Define price curves for different goods
  const priceCurves: PriceCurveTable = {
    fish: {
      basePrice: 10, // Base price when stock = target
      targetStock: 100, // Desired inventory level
      elasticity: 1.0, // Price sensitivity
      minPrice: 1, // Minimum allowed price
      maxPrice: 50, // Maximum allowed price
    },
    wood: {
      basePrice: 5,
      targetStock: 50,
      elasticity: 0.8,
      minPrice: 1,
      maxPrice: 20,
    },
    ore: {
      basePrice: 15,
      targetStock: 60,
      elasticity: 1.0,
      minPrice: 1,
      maxPrice: 100,
    },
  };

  // Create a simple game state with one town
  const gameState: GameState = {
    turn: 1,
    version: 1,
    rngSeed: 'example',
    towns: [
      {
        id: 'example-town',
        name: 'Example Town',
        resources: {
          fish: 80, // Below target (100) - should increase price
          wood: 60, // Above target (50) - should decrease price
          ore: 40, // Below target (60) - should increase price
        },
        prices: {
          fish: 8, // Below base price (10) - should increase
          wood: 8, // Above base price (5) - should decrease
          ore: 20, // Above base price (15) - should decrease
        },
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
  console.log(
    `- Fish: stock=${gameState.towns[0]?.resources.fish ?? 'N/A'}, price=${gameState.towns[0]?.prices.fish ?? 'N/A'}`,
  );
  console.log(
    `- Wood: stock=${gameState.towns[0]?.resources.wood ?? 'N/A'}, price=${gameState.towns[0]?.prices.wood ?? 'N/A'}`,
  );
  console.log(`- Target fish price: ${math.nextPrice({ stock: 80, price: 8 }, priceCurves.fish)}`);
  console.log(`- Target wood price: ${math.nextPrice({ stock: 60, price: 8 }, priceCurves.wood)}`);
  console.log();

  // Apply passive drift for several turns
  let currentState = gameState;
  const turns = 5;

  for (let turn = 1; turn <= turns; turn++) {
    currentState = applyPassiveDrift(currentState, priceCurves, math);

    console.log(`After turn ${turn}:`);
    console.log(`- Fish: price=${currentState.towns[0]?.prices.fish ?? 'N/A'}`);
    console.log(`- Wood: price=${currentState.towns[0]?.prices.wood ?? 'N/A'}`);
  }

  console.log('\n=== Drift Analysis ===');
  console.log('Fish price drifted from 8 toward target (higher due to low stock)');
  console.log('Wood price drifted from 8 toward target (lower due to high stock)');
  console.log(`Default drift rate: ${DEFAULT_DRIFT.rate * 100}% per turn`);
  console.log('Prices gradually converge toward their curve-based targets over time.');
}

/**
 * Example showing different drift rates.
 */
export function demonstrateDriftRates() {
  console.log('\n=== Drift Rate Comparison ===\n');

  const math = createLogRatioPriceMath();

  const priceCurves: PriceCurveTable = {
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

  const gameState: GameState = {
    turn: 1,
    version: 1,
    rngSeed: 'example',
    towns: [
      {
        id: 'example-town',
        name: 'Example Town',
        resources: { fish: 80, wood: 100, ore: 40 },
        prices: { fish: 5, wood: 6, ore: 20 }, // fish below target, wood above target, ore below target
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

  const targetPrice = math.nextPrice({ stock: 80, price: 5 }, priceCurves.fish);
  console.log(`Starting fish price: ${gameState.towns[0]?.prices.fish ?? 'N/A'}`);
  console.log(`Target fish price: ${targetPrice}`);
  console.log();

  // Test different drift rates
  const rates = [0.1, 0.25, 0.5, 1.0];

  for (const rate of rates) {
    let currentState = gameState;
    const turns = 3;

    console.log(`Drift rate: ${rate * 100}% per turn`);
    for (let turn = 1; turn <= turns; turn++) {
      currentState = applyPassiveDrift(currentState, priceCurves, math, { rate });
      console.log(`  Turn ${turn}: price=${currentState.towns[0]?.prices.fish ?? 'N/A'}`);
    }
    console.log();
  }

  console.log('Higher drift rates = faster convergence to target prices');
  console.log('Lower drift rates = gradual, stable price changes');
}

// Run examples if this file is executed directly
// Note: These examples can be imported and called from other modules
