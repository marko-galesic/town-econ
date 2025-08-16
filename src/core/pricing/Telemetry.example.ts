import type { PriceChangeTrace } from './Telemetry';

/**
 * Example demonstrating how to use the price change telemetry system
 * for UI/QA explainability ("why did price move?").
 */
export function demonstrateTelemetry() {
  // Example telemetry callback that logs price changes
  const onPriceChange = (trace: PriceChangeTrace) => {
    console.log(`Price change in ${trace.townId} for ${trace.goodId}:`);
    console.log(`  Cause: ${trace.cause}`);
    console.log(
      `  Price progression: ${trace.oldPrice} → ${trace.curvePrice} → ${trace.smoothed} → ${trace.final}`,
    );
    console.log(`  Stock: ${trace.stock} (target: ${trace.target})`);
    console.log(`  Elasticity: ${trace.elasticity}`);
    console.log(`  Prosperity: ${trace.prosperityTier} (factor: ${trace.prosperityFactor})`);
    console.log('---');
  };

  // Example: Collecting telemetry data for analysis
  const telemetryData: PriceChangeTrace[] = [];

  const collectTelemetry = (trace: PriceChangeTrace) => {
    telemetryData.push(trace);

    // You could also:
    // - Send to analytics service
    // - Store in database for historical analysis
    // - Display in UI tooltips
    // - Log for debugging
  };

  // Example: Using telemetry to explain price movements to users
  const explainPriceChange = (trace: PriceChangeTrace): string => {
    const priceChange = trace.final - trace.oldPrice;
    const direction = priceChange > 0 ? 'increased' : 'decreased';

    let explanation = `The price of ${trace.goodId} ${direction} from ${trace.oldPrice} to ${trace.final} in ${trace.townId}. `;

    if (trace.cause === 'post-trade') {
      explanation += `This was due to recent trading activity. `;
    } else {
      explanation += `This was due to natural market drift. `;
    }

    if (trace.stock < trace.target) {
      explanation += `The town has low stock (${trace.stock}) compared to target (${trace.target}), which tends to push prices up. `;
    } else {
      explanation += `The town has high stock (${trace.stock}) compared to target (${trace.target}), which tends to push prices down. `;
    }

    explanation += `The town's prosperity level (${trace.prosperityTier}) also affects pricing.`;

    return explanation;
  };

  return {
    onPriceChange,
    collectTelemetry,
    explainPriceChange,
    telemetryData,
  };
}

/**
 * Example of how to integrate telemetry with a game loop
 */
export function integrateWithGameLoop() {
  // During game initialization
  const telemetryCallback = (trace: PriceChangeTrace) => {
    // Log for debugging
    console.log(
      `Price change: ${trace.townId}.${trace.goodId} ${trace.oldPrice}→${trace.final} (${trace.cause})`,
    );

    // Send to UI for real-time updates
    // updatePriceDisplay(trace);

    // Store for analytics
    // analyticsService.recordPriceChange(trace);

    // Trigger notifications if significant changes occur
    if (Math.abs(trace.final - trace.oldPrice) > 5) {
      // notifyUserOfSignificantPriceChange(trace);
    }
  };

  // Example usage in game loop:
  // const pricingService = createPricingService();
  //
  // // Process trades with telemetry
  // gameState = pricingService.afterTrade(gameState, trade, {
  //   onTrace: telemetryCallback,
  // });
  //
  // // Process drift with telemetry
  // gameState = pricingService.perTurnDrift(gameState, {
  //   onTrace: telemetryCallback,
  // });

  return { telemetryCallback };
}
