import type { Town } from '../../types/Town';

import { createSimpleLinearPriceModel } from './PriceModel';

/**
 * Example demonstrating how to use the PriceModel system.
 *
 * This shows how to:
 * 1. Create a price model with custom configuration
 * 2. Quote current prices
 * 3. Apply trades and get updated towns with adjusted prices
 */
export function demonstratePriceModel() {
  // Create a price model with custom settings
  const priceModel = createSimpleLinearPriceModel({
    baseStep: 2, // Price changes by 2 per trade
    min: 5, // Minimum price of 5
    max: 50, // Maximum price of 50
  });

  // Example town with initial prices
  const town: Town = {
    id: 'example-town',
    name: 'Example Town',
    resources: { fish: 100, wood: 50, ore: 25 },
    prices: { fish: 15, wood: 25, ore: 35 },
    militaryRaw: 0,
    prosperityRaw: 0,
    treasury: 1000,
    revealed: {
      militaryTier: 'militia',
      prosperityTier: 'struggling',
      lastUpdatedTurn: 0,
    },
  };

  console.log('Initial prices:', town.prices);

  // Quote current price for fish
  const fishPrice = priceModel.quote(town, 'fish');
  console.log('Current fish price:', fishPrice);

  // Simulate selling fish from town (negative quantityDelta)
  // This should increase the price
  const townAfterSellingFish = priceModel.applyTrade(town, 'fish', -10);
  console.log('After selling 10 fish:', townAfterSellingFish.prices.fish);

  // Simulate buying fish for town (positive quantityDelta)
  // This should decrease the price
  const townAfterBuyingFish = priceModel.applyTrade(townAfterSellingFish, 'fish', 5);
  console.log('After buying 5 fish:', townAfterBuyingFish.prices.fish);

  // Show that original town is unchanged (immutability)
  console.log('Original town fish price unchanged:', town.prices.fish);

  // Demonstrate price clamping at boundaries
  const aggressiveModel = createSimpleLinearPriceModel({
    baseStep: 20,
    min: 10,
    max: 30,
  });

  const townAtMin = { ...town, prices: { ...town.prices, fish: 10 } };
  const townAfterLargeBuy = aggressiveModel.applyTrade(townAtMin, 'fish', 100);
  console.log('Price clamped at minimum:', townAfterLargeBuy.prices.fish);

  const townAtMax = { ...town, prices: { ...town.prices, fish: 30 } };
  const townAfterLargeSell = aggressiveModel.applyTrade(townAtMax, 'fish', -100);
  console.log('Price clamped at maximum:', townAfterLargeSell.prices.fish);
}

// Uncomment to run the example:
// demonstratePriceModel();
