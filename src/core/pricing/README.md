# Pricing System

A pluggable, data-driven supply/demand curve system for the town economy simulation.

## Overview

The pricing system provides a mathematical foundation for modeling how prices change based on supply and demand. It implements a log-ratio curve that is stable, symmetric, and configurable.

## Core Components

### PriceCurve.ts

Defines the core interfaces:

- **`PriceCurveConfig`**: Configuration for a price curve
  - `basePrice`: Starting price when stock equals target
  - `targetStock`: Desired inventory level
  - `elasticity`: Sensitivity to supply/demand changes (typical range: 0.5-2.0)
  - `minPrice`: Optional price floor (default: 1)
  - `maxPrice`: Optional price ceiling (default: 9999)

- **`TownPriceState`**: Current state of a town's inventory and pricing
  - `stock`: Current quantity held
  - `price`: Current integer price

- **`PriceMath`**: Pure mathematical interface for computing price changes
  - `nextPrice(state, config)`: Returns the next integer price

### Curves.ts

Implements the log-ratio price math:

```typescript
import { createLogRatioPriceMath } from './Curves';

const priceMath = createLogRatioPriceMath();
const newPrice = priceMath.nextPrice(townState, curveConfig);
```

## Mathematical Formula

The log-ratio curve implements:

```
p_next = clamp(round(base * exp(k * ln(target/stock_clamped)), minPrice, maxPrice)
```

Where:

- `k = elasticity`
- `stock_clamped = max(1, stock)` (prevents division by zero)
- `clamp(x, min, max)` ensures prices stay within bounds
- `round(x)` provides stable integer rounding

## Properties

- **Monotonic**: Higher stock → lower price, lower stock → higher price
- **Symmetric**: Doubling stock has inverse effect of halving stock
- **Stable**: Small changes produce proportional price changes
- **Bounded**: Prices are clamped between min and max values
- **Deterministic**: Same inputs always produce same outputs

## Usage Example

```typescript
import { createLogRatioPriceMath } from './Curves';
import type { PriceCurveConfig, TownPriceState } from './PriceCurve';

// Configure a price curve for fish
const fishConfig: PriceCurveConfig = {
  basePrice: 100, // Base price when stock = target
  targetStock: 50, // Desired inventory level
  elasticity: 1.0, // Sensitivity to changes
  minPrice: 25, // Minimum price
  maxPrice: 400, // Maximum price
};

// Create the price math implementation
const priceMath = createLogRatioPriceMath();

// Calculate new price based on current state
const townState: TownPriceState = {
  stock: 25, // Current inventory (half target)
  price: 100, // Current price
};

const newPrice = priceMath.nextPrice(townState, fishConfig);
// Result: newPrice > 100 (price increases when stock is below target)
```

## Integration

The pricing system is designed to integrate with existing town data:

```typescript
import type { Town } from '../../types/Town';
import type { GoodId } from '../../types/Goods';

function updateTownPrice(town: Town, goodId: GoodId, config: PriceCurveConfig): number {
  const state: TownPriceState = {
    stock: town.resources[goodId],
    price: town.prices[goodId],
  };

  return priceMath.nextPrice(state, config);
}
```

## Testing

Run the test suite to verify mathematical properties:

```bash
pnpm test src/core/pricing/Curves.spec.ts
```

Tests cover:

- Basic functionality (integer prices, bounds)
- Equilibrium behavior (stock = target)
- Monotonicity (price direction changes)
- Symmetry and elasticity effects
- Edge cases (zero stock, large values)
- Determinism and purity
- Mathematical properties

## Performance

The implementation is optimized for:

- **Pure functions**: No side effects, easy to test and reason about
- **Fast computation**: Simple mathematical operations
- **Memory efficiency**: No object allocation during price calculations
- **Deterministic**: Same inputs always produce same outputs
