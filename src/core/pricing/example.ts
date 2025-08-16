import { createLogRatioPriceMath } from './Curves';
import type { PriceCurveConfig, TownPriceState } from './PriceCurve';

/**
 * Example usage of the pricing system.
 *
 * This demonstrates how to:
 * 1. Create a price curve configuration
 * 2. Use the log-ratio price math to calculate prices
 * 3. Handle different supply/demand scenarios
 */
export function pricingExample() {
  // Create the price math implementation
  const priceMath = createLogRatioPriceMath();

  // Configure a price curve for fish
  const fishPriceConfig: PriceCurveConfig = {
    basePrice: 100, // Base price when stock = target
    targetStock: 50, // Desired inventory level
    elasticity: 1.0, // Sensitivity to supply/demand changes
    minPrice: 25, // Minimum price
    maxPrice: 400, // Maximum price
  };

  // Example town states with different stock levels
  const scenarios: TownPriceState[] = [
    { stock: 25, price: 100 }, // Low stock (half target)
    { stock: 50, price: 100 }, // Target stock
    { stock: 75, price: 100 }, // High stock (1.5x target)
    { stock: 100, price: 100 }, // Very high stock (2x target)
    { stock: 1, price: 100 }, // Very low stock
  ];

  console.log('Fish Pricing Example:');
  console.log('=====================');
  console.log(`Base Price: ${fishPriceConfig.basePrice}`);
  console.log(`Target Stock: ${fishPriceConfig.targetStock}`);
  console.log(`Elasticity: ${fishPriceConfig.elasticity}`);
  console.log('');

  scenarios.forEach(scenario => {
    const newPrice = priceMath.nextPrice(scenario, fishPriceConfig);
    const stockRatio = (scenario.stock / fishPriceConfig.targetStock).toFixed(2);

    console.log(`Stock: ${scenario.stock} (${stockRatio}x target) → Price: ${newPrice}`);
  });

  // Demonstrate elasticity effects
  console.log('\nElasticity Effects:');
  console.log('==================');

  const lowElasticity: PriceCurveConfig = { ...fishPriceConfig, elasticity: 0.5 };
  const highElasticity: PriceCurveConfig = { ...fishPriceConfig, elasticity: 2.0 };

  const testState: TownPriceState = { stock: 25, price: 100 };

  const lowResult = priceMath.nextPrice(testState, lowElasticity);
  const highResult = priceMath.nextPrice(testState, highElasticity);

  console.log(`Low elasticity (0.5): Stock 25 → Price ${lowResult}`);
  console.log(`High elasticity (2.0): Stock 25 → Price ${highResult}`);
}

/**
 * Example of how to integrate with existing town data.
 */
export function createTownPriceState(
  town: { resources: Record<string, number>; prices: Record<string, number> },
  goodId: string,
): TownPriceState {
  return {
    stock: town.resources[goodId] || 0,
    price: town.prices[goodId] || 0,
  };
}

/**
 * Example of how to create a price curve config from game data.
 */
export function createPriceCurveConfig(
  basePrice: number,
  targetStock: number,
  elasticity: number = 1.0,
  minPrice?: number,
  maxPrice?: number,
): PriceCurveConfig {
  const config: PriceCurveConfig = {
    basePrice,
    targetStock,
    elasticity,
  };

  if (minPrice !== undefined) {
    config.minPrice = minPrice;
  }

  if (maxPrice !== undefined) {
    config.maxPrice = maxPrice;
  }

  return config;
}
