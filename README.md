# Town Econ

A modern TypeScript project built with Vite, featuring strict type safety, comprehensive testing, automated quality gates, and a robust immutable state management system for town economy simulation.

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+
- **pnpm** (recommended) or npm

### Installation & Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd town-econ

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The app will be available at [http://localhost:5173](http://localhost:5173)

## 📚 Available Scripts

### Development

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build locally

### Quality Assurance

- `pnpm typecheck` - Run TypeScript type checking
- `pnpm lint` - Run ESLint on all files (✅ 100% passing)
- `pnpm lint:fix` - Auto-fix ESLint issues
- `pnpm format` - Format code with Prettier
- `pnpm format:check` - Check code formatting

### Testing

- `pnpm test` - Run test suite once (✅ 986 tests passing)
- `pnpm test:watch` - Run tests in watch mode
- `pnpm coverage` - Generate coverage report

## 🏗️ Project Structure

```
town-econ/
├── .github/workflows/     # GitHub Actions CI
├── .husky/               # Git hooks (pre-commit, pre-push)
├── .vscode/              # VS Code configuration
├── src/
│   ├── core/             # Core game logic and state management
│   │   ├── stateApi.ts   # Immutable state manipulation functions
│   │   ├── stateApi.spec.ts # State API test suite (113 tests)
│   │   ├── initGameState.ts # Game state initialization
│   │   ├── deserialize.ts # JSON deserialization with validation
│   │   ├── validation.ts # Data validation system
│   │   ├── ai/           # AI configuration and behavior profiles
│   │   │   ├── AiTypes.ts # AI mode, profile, and decision interfaces
│   │   │   ├── AiProfiles.ts # Default AI profiles (random, greedy)
│   │   │   ├── Market.ts # Market snapshots and trading helpers for AI
│   │   │   └── index.ts # AI system exports
│   │   ├── trade/        # Trade system types, error handling, validation, execution, and price modeling
│   │   │   ├── TradeTypes.ts # Trade request/response interfaces
│   │   │   ├── TradeErrors.ts # Trade validation and execution errors
│   │   │   ├── TradeValidator.ts # Pure trade validation with precise error paths
│   │   │   ├── TradeValidator.spec.ts # Trade validation test suite (34 tests)
│   │   │   ├── TradeExecutor.ts # Trade execution with goods/currency movement and effects
│   │   │   ├── TradeExecutor.spec.ts # Trade execution test suite (8 tests)
│   │   │   ├── PriceModel.ts # Pluggable price model interface and implementation
│   │   │   ├── PriceModel.spec.ts # Price model test suite (18 tests)
│   │   │   ├── PriceModel.example.ts # Usage examples and documentation
│   │   │   ├── TradeLimits.ts # Runaway state prevention with configurable limits
│   │   │   ├── TradeLimits.spec.ts # Trade limits test suite (18 tests)
│   │   │   ├── TradeExecutor.limits.spec.ts # Trade execution with limits test suite (10 tests)
│   │   │   └── index.ts # Trade system exports
│   │   └── turn/         # Turn-based game progression system
│   │       ├── TurnPhase.ts # Game turn phase definitions
│   │       ├── TurnController.ts # Turn orchestration and phase sequencing
│   │       ├── PlayerAction.ts # Player action type definitions
│   │       ├── PlayerActionQueue.ts # Action queue management
│   │       ├── UpdatePipeline.ts # Pluggable update systems pipeline
│   │       ├── TurnService.ts # Factory service for easy TurnController setup
│   │       ├── index.ts # Barrel exports for all turn-related modules
│   │       ├── TurnController.skeleton.spec.ts # Turn system tests
│   │       ├── TurnController.start.spec.ts # Turn start phase tests
│   │       ├── TurnController.player.spec.ts # Player action phase tests
│   │       ├── TurnController.update.spec.ts # Update stats phase tests
│   │       ├── TurnController.end.spec.ts # Turn end phase tests
│   │       ├── PlayerActionQueue.spec.ts # Queue functionality tests
│   │       ├── UpdatePipeline.spec.ts # Update pipeline system tests
│   │       └── TurnService.spec.ts # TurnService factory tests
│   ├── types/            # TypeScript type definitions
│   │   ├── GameState.ts  # Main game state interface
│   │   ├── Town.ts       # Town entity interface with treasury system
│   │   ├── Goods.ts      # Goods and resources interface
│   │   └── Tiers.ts      # Military and prosperity tier types
│   ├── data/             # Game data and configuration
│   │   ├── goods.json    # Goods definitions and effects
│   │   ├── towns.json    # Initial town configurations
│   │   └── tierThresholds.json # Tier mapping thresholds for military and prosperity
│   ├── core/
│   │   └── stats/        # Statistics and tier mapping utilities
│   │       ├── TierMap.ts # Tier mapping functions and interfaces
│   │       ├── TierMap.spec.ts # Tier mapping test suite
│   │       ├── FuzzyTier.ts # Fuzzy tier mapping with deterministic jitter
│   │       ├── FuzzyTier.spec.ts # Fuzzy tier test suite (15 tests)
│   │       ├── FuzzyTier.example.ts # Usage examples and demonstrations
│   │       ├── RevealCadence.ts # Tier reveal cadence management system
│   │       ├── RevealCadence.spec.ts # Reveal cadence test suite
│   │       ├── RevealSystem.ts # Town tier reveal system with fuzzy logic
│   │       ├── RevealSystem.spec.ts # Reveal system test suite (10 tests)
│   │       ├── RawStatSystem.ts # Per-turn raw stat update system
│   │       ├── RawStatSystem.spec.ts # Raw stat system test suite (11 tests)
│   │       ├── StatsUpdateSystem.ts # Integrated stats update system for UpdatePipeline
│   │       ├── StatsUpdateSystem.spec.ts # Stats update system test suite (11 tests)
│   │       ├── StatsUpdateSystem.example.ts # Usage examples with UpdatePipeline
│   │       └── index.ts # Stats module exports (TierMap, FuzzyTier, RevealCadence, RevealSystem, RawStatSystem, StatsUpdateSystem)
│   ├── lib/              # Utility functions and business logic
│   │   ├── hello.ts      # Example function
│   │   └── hello.spec.ts # Tests
│   └── main.ts           # Application entry point
├── dist/                 # Build output (generated)
├── coverage/             # Test coverage reports (generated)
├── index.html            # Main HTML file
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Vite build configuration
├── vitest.config.ts      # Test configuration
├── eslint.config.js      # ESLint rules
├── .prettierrc           # Prettier formatting rules
└── package.json          # Dependencies and scripts
```

## 🎮 Core Features

### Immutable State Management (`src/core/stateApi.ts`)

A comprehensive set of immutable state manipulation functions for the town economy simulation:

#### Town Operations

- **`getTown(state, townId)`** - Safe town lookup with error handling
- **`setResource(town, goodId, amount)`** - Set resource amount (clamps to ≥0, validates integers)
- **`incResource(town, goodId, delta)`** - Increment/decrement resources (floors at 0)
- **`setPrice(town, goodId, price)`** - Set price (clamps to ≥0, validates integers)
- **`incPrice(town, goodId, delta)`** - Increment/decrement prices (floors at 0)
- **`addProsperity(town, delta)`** - Update prosperity raw value (preserves tier info)
- **`addMilitary(town, delta)`** - Update military raw value (preserves tier info)

#### Economy & Currency

- **Treasury System**: Each town has a `treasury` field representing their currency balance
- **Fixed-Point Currency**: All treasury values are integers ≥0 for precise financial calculations
- **Buying/Selling Ready**: Treasury system enables future trade mechanics and economic transactions

#### Game State Operations

- **`advanceTurn(state)`** - Increment game turn (shallow copy with turn+1)

#### Key Features

- **100% Immutability**: All functions return new objects, never modify originals
- **Type Safety**: Full TypeScript support with strict validation
- **Data Integrity**: Automatic clamping, integer validation, and good ID verification
- **Tier Preservation**: Military and prosperity tier information remains unchanged
- **Comprehensive Testing**: 113 tests covering all edge cases and invariants

### Data Validation System

- **JSON Schema Validation**: Robust validation of game state structure
- **Type-Safe Deserialization**: Safe loading of game data with detailed error reporting
- **Comprehensive Coverage**: All data structures validated with specific error paths
- **Treasury Validation**: Ensures all towns have valid non-negative integer treasury values

### Treasury & Economy System

- **Currency Management**: Each town maintains a `treasury` balance for economic transactions
- **Fixed-Point Precision**: Integer-based currency system prevents floating-point errors
- **Validation**: Comprehensive validation ensures treasury values are always ≥0
- **Seed Data**: Initial towns configured with balanced treasury values (500-1500 range)
- **Future Ready**: Foundation for buying/selling mechanics and economic simulation

### Tier Mapping System (`src/core/stats/TierMap.ts`)

A data-driven system for mapping raw stat values to tier classifications with robust validation:

#### Core Functions

- **`clampRaw(x, min, max)`**: Clamps raw stat values between bounds (default 0-100) with **NaN/Infinity rejection**
- **`mapToTier(raw, thresholds)`**: Maps raw stats to tier IDs using configurable thresholds
- **Stable Sorting**: Automatically sorts thresholds for consistent results regardless of input order

#### Data-Driven Configuration

- **`tierThresholds.json`**: JSON configuration for military and prosperity tier mappings
- **Military Tiers**: militia (0), garrison (20), formidable (50), host (90)
- **Prosperity Tiers**: struggling (0), modest (25), prosperous (60), opulent (95)
- **Configurable**: Easy to modify thresholds without code changes

#### Key Features

- **Pure Functions**: No mutation, deterministic results
- **Type Safety**: Full TypeScript integration with existing `Tiers.ts` types
- **Robust Handling**: Works with unsorted thresholds, edge cases, and boundary values
- **Performance**: Efficient O(n log n) sorting + O(n) lookup
- **100% Coverage**: Comprehensive test suite with edge case coverage
- **Input Validation**: **Rejects NaN and Infinity values with clear error messages**
- **Defensive Programming**: **Always validates input bounds and provides helpful error messages**

### Fuzzy Tier System (`src/core/stats/FuzzyTier.ts`)

A deterministic fuzzy tier mapping system that adds controlled randomness to tier reveals while maintaining game balance:

#### Core Components

- **`FuzzOptions` Interface**: Configurable jitter probability (defaults to 0.2)
- **`seededRand(seedString)`**: Deterministic PRNG using xorshift32 algorithm
- **`fuzzyTierFor(raw, thresholds, seed, townId, turn, opts?)`**: Maps raw values to fuzzy tiers with bounded jitter

#### Fuzzy Tier Behavior

- **True Tier Preference**: By default, 80% chance to show the actual tier
- **Bounded Jitter**: 20% chance to show ±1 tier from true tier (never more than 1 step)
- **Edge Safety**: First/last tiers are clamped to stay within bounds
- **Deterministic**: Same (seed, townId, turn) always yields same fuzzy tier

#### Defensive Programming Features

- **Empty Thresholds Protection**: **Throws clear error if thresholds array is empty**
- **Bounds Validation**: **Always validates tier indices are within [0, thresholds.length-1] range**
- **Configuration Error Detection**: **Detects and reports tier configuration errors**

#### Usage Example

```typescript
import { fuzzyTierFor, DEFAULT_FUZZ } from './src/core/stats';

// Get fuzzy tier with default 20% jitter probability
const fuzzyTier = fuzzyTierFor(
  rawValue, // e.g., 35
  prosperityThresholds, // tier thresholds array
  'game-session-123', // rng seed
  'riverdale', // town ID
  10, // turn number
);

// Custom jitter probability
const customFuzzyTier = fuzzyTierFor(
  rawValue,
  prosperityThresholds,
  'game-session-123',
  'riverdale',
  10,
  { jitterProb: 0.5 }, // 50% chance to jitter
);
```

#### Key Features

- **Deterministic Randomness**: Uses seeded PRNG for reproducible results
- **Configurable Probability**: Default 20% jitter, customizable via `FuzzOptions`
- **Bounded Jitter**: Never jumps more than ±1 step from true tier
- **Edge-Safe**: First/last tiers clamped to stay within bounds
- **Tiny PRNG**: Lightweight xorshift32 algorithm for performance
- **Town/Turn Specific**: Different fuzzy tiers for different towns and turns
- **Production Ready**: Comprehensive test suite with 98% code coverage
- **Input Validation**: **Always validates thresholds array and tier indices**
- **Error Reporting**: **Provides clear, actionable error messages for configuration issues**

### Tier Reveal Cadence System (`src/core/stats/RevealCadence.ts`)

A configurable system for managing when tier information is revealed to players, adding strategic fuzziness to the game:

#### Core Components

- **`RevealPolicy` Interface**: Configurable interval for tier reveals (e.g., every 2 turns)
- **`DEFAULT_REVEAL_POLICY`**: Default policy of revealing every 2 turns
- **`isRevealDue(currentTurn, lastUpdatedTurn, policy)`**: Determines if tiers should be revealed
- **`markRevealed(now)`**: Helper function for tracking when tiers were last revealed

#### Usage Example

```typescript
import { isRevealDue, markRevealed, DEFAULT_REVEAL_POLICY } from './core/stats';

// Check if it's time to reveal updated tier information
if (isRevealDue(currentTurn, lastRevealedTurn, DEFAULT_REVEAL_POLICY)) {
  // Update revealed tiers
  lastRevealedTurn = markRevealed(currentTurn);
}
```

#### Key Features

- **Configurable Cadence**: Support for any interval (1, 2, 3, 5+ turns)
- **Strategic Fuzziness**: Players don't see tier changes every turn, adding uncertainty
- **Deterministic Logic**: Pure functions with predictable behavior
- **Global Policy**: Single cadence policy for all tier reveals (extensible to per-stat policies)
- **Initial Reveal**: Always reveals on turn 0 for new games
- **100% Test Coverage**: Comprehensive test suite covering all scenarios and edge cases

### Town Tier Reveal System (`src/core/stats/RevealSystem.ts`)

A comprehensive system that applies fuzzy tier reveals to towns only when due according to the reveal policy:

#### Core Components

- **`applyRevealPass(state, seed, policy?)`**: Main function that updates town revealed tiers when due
- **Fuzzy Tier Integration**: Uses `fuzzyTierFor()` for deterministic but varied tier assignments
- **Cadence Management**: Integrates with `RevealCadence` system for timing control
- **Immutable Updates**: Returns new game state without modifying originals

#### Usage Example

```typescript
import { applyRevealPass, DEFAULT_REVEAL_POLICY } from './core/stats';

// Apply reveal pass with default policy (every 2 turns)
const updatedState = applyRevealPass(gameState, 'game-session-123');

// Apply with custom reveal policy
const customPolicy = { interval: 3 }; // Reveal every 3 turns
const customUpdatedState = applyRevealPass(gameState, 'game-session-123', customPolicy);
```

#### Key Features

- **Conditional Updates**: Only updates `town.revealed.{militaryTier, prosperityTier, lastUpdatedTurn}` when due
- **Fuzzy Logic**: Uses deterministic fuzzy tier mapping for varied but predictable results
- **Cadence Respect**: Follows reveal policy to control update frequency
- **Deterministic**: Same (seed, town, turn) always produces same results
- **Multi-Town Support**: Processes all towns independently with individual timing
- **Policy Flexibility**: Supports custom reveal intervals beyond default 2-turn cadence
- **100% Test Coverage**: Comprehensive test suite covering all scenarios and edge cases
- **Integration Ready**: Designed to work with UpdatePipeline and TurnController systems
- **Tier Validation**: **Always validates that revealed tiers belong to configured tier sets**
- **Configuration Validation**: **Validates tier configuration to prevent invalid tier assignments**

#### Reveal Logic

The system implements the following logic for each town:

1. **Check Timing**: Uses `isRevealDue()` to determine if reveal is due
2. **Skip if Not Due**: Towns not due for reveal remain unchanged
3. **Apply Fuzzy Tiers**: When due, generates new military and prosperity tiers using `fuzzyTierFor()`
4. **Update Timestamp**: Sets `lastUpdatedTurn` to current turn number
5. **Preserve Other Data**: All other town properties remain unchanged

#### Integration with Game Systems

- **UpdatePipeline Ready**: Can be registered as an update system for automatic execution
- **Turn-Based**: Designed to work with the turn progression system
- **State Immutability**: Maintains the project's immutable state design principles
- **Deterministic Seeds**: Uses game state's RNG seed for reproducible results

### Raw Stat Turn Update System (`src/core/stats/RawStatSystem.ts`)

A pure, deterministic system for applying per-turn stat updates to all towns in the game state:

#### Core Components

- **`RawStatRules` Interface**: Configurable decay rates and maximum values for raw stats
- **`DEFAULT_RAW_RULES`**: Sensible defaults (prosperity decay: 1, military decay: 0, max: 100)
- **`applyRawStatTurn(state, rules?)`**: Applies stat updates to all towns and returns new state

#### Usage Example

```typescript
import { applyRawStatTurn, DEFAULT_RAW_RULES } from './core/stats';

// Apply default decay rules (prosperity -1, military 0)
const updatedState = applyRawStatTurn(gameState);

// Apply custom rules
const customRules = {
  prosperityDecayPerTurn: 2, // Prosperity decays faster
  militaryDecayPerTurn: 1, // Military also decays
  maxRaw: 50, // Lower maximum stat value
};
const customUpdatedState = applyRawStatTurn(gameState, customRules);
```

#### Key Features

- **Pure & Immutable**: Always returns new state, never modifies input
- **Configurable Decay**: Support for positive (decay), negative (growth), or zero (no change) rates
- **Automatic Clamping**: Values automatically clamped to [0, maxRaw] range
- **Per-Town Updates**: Applies updates to all towns in the game state
- **Integer Precision**: All calculations maintain integer precision
- **Deterministic**: Same input always produces same output
- **100% Test Coverage**: Comprehensive test suite with edge case handling

### Integrated Stats Update System (`src/core/stats/StatsUpdateSystem.ts`)

A unified system that combines raw stat updates and tier reveals in the correct order, designed for seamless integration with the UpdatePipeline:

#### Core Components

- **`StatsUpdateOptions` Interface**: Configurable options for raw stats, reveal intervals, and fuzz settings
- **`createStatsUpdateSystem(opts?, seedAccessor?)`**: Factory function that returns a registerable UpdateSystem
- **Automatic Ordering**: Always applies raw updates before reveal updates for consistency
- **UpdatePipeline Ready**: Returns `(s: GameState) => GameState` function for direct registration

#### Usage Example

```typescript
import { createStatsUpdateSystem } from './core/stats';
import { UpdatePipeline } from './core/turn';

// Create the update pipeline
const pipeline = new UpdatePipeline();

// Create and register the stats update system with default settings
const statsSystem = createStatsUpdateSystem();
pipeline.register(statsSystem);

// Or with custom configuration
const customStatsSystem = createStatsUpdateSystem({
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
pipeline.register(customStatsSystem);

// Use custom seed accessor for deterministic but varied results
const seededStatsSystem = createStatsUpdateSystem(
  { revealInterval: 1 },
  state => `turn-${state.turn}-custom-seed`,
);
pipeline.register(seededStatsSystem);
```

#### Key Features

- **Unified Processing**: Combines raw stat updates and tier reveals in single system
- **Correct Order**: Raw updates always applied before reveal updates
- **Configurable Options**: Full customization of decay rates, reveal intervals, and fuzz settings
- **Flexible Seeding**: Custom seed accessor or automatic fallback to `rngSeed`
- **UpdatePipeline Integration**: Designed specifically for registration with UpdatePipeline
- **Deterministic**: Same inputs always produce same outputs
- **Immutable Design**: Returns new game state without modifying originals
- **100% Test Coverage**: Comprehensive test suite covering all configuration options and edge cases

#### Integration with Turn System

The StatsUpdateSystem is designed to work seamlessly with the existing turn-based progression:

```typescript
import { createTurnController } from './core/turn';
import { createStatsUpdateSystem } from './core/stats';

// Create a turn controller with integrated stats updates
const { controller, pipeline } = createTurnController(gameState);

// Register the stats update system
const statsSystem = createStatsUpdateSystem({ revealInterval: 2 });
pipeline.register(statsSystem);

// Run turns - stats will be automatically updated during UpdateStats phase
const result = await controller.runTurn(gameState);
```

**Benefits:**

- **Automatic Execution**: Stats updated automatically during each turn's UpdateStats phase
- **Configurable Timing**: Reveal intervals control how often tier information is updated
- **Consistent Order**: Raw stats always processed before tier reveals
- **Turn Integration**: Seamlessly integrated with existing turn progression system
- **Performance**: Efficient processing with minimal overhead per turn

### Trade Limits & Runaway State Prevention

- **Configurable Limits**: `TradeLimits` interface allows customization of resource, treasury, and price bounds
- **Default Safety**: `DEFAULT_LIMITS` provides reasonable bounds (1M resources, 1B treasury, 1-9999 prices)
- **Automatic Enforcement**: Resources and treasury automatically clamped during trade execution
- **Negative Prevention**: Always prevents negative values regardless of limit configuration
- **Price Boundaries**: Enforces minimum and maximum price constraints on all goods
- **Game Balance**: Prevents runaway inflation/deflation while maintaining meaningful gameplay
- **Backward Compatible**: Existing code continues to work without changes

### Price Modeling System

- **Pluggable Architecture**: `PriceModel` interface allows easy swapping of pricing strategies
- **Supply/Demand Dynamics**: Automatic price adjustment based on trade activity
- **Linear Price Model**: Default implementation with configurable step sizes and boundaries
- **Price Clamping**: Automatic min/max price enforcement to prevent extreme values
- **Immutable Updates**: Price changes return new town instances, preserving original state
- **Per-Trade Adjustment**: Prices change once per trade regardless of quantity for predictable economics

#### Post-Trade Price Adjustment

- **`applyPostTradePricing(state, vt, model)`**: Applies price adjustments to both towns after trade execution
- **Quantity Delta Calculation**: Automatically determines inventory changes from each town's perspective
  - **Seller**: Inventory decreases → negative delta → price increases
  - **Buyer**: Inventory increases → positive delta → price decreases
- **Dual Town Updates**: Updates prices for both towns involved in the trade
- **Price Model Integration**: Uses any PriceModel implementation for flexible pricing strategies
- **Immutable Updates**: Returns new GameState with updated town prices, preserving original state
- **Error Handling**: Throws error if towns not found in current game state
- **Trade Side Awareness**: Correctly interprets buy/sell transactions for proper delta calculation

### AI Configuration System (`src/core/ai/`)

A flexible AI configuration and behavior profile system for guiding AI decision-making in the town economy simulation:

#### Core Components

- **`AiMode`**: Union type for `'random' | 'greedy'` behavior modes
- **`AiProfile`**: Configuration interface with mode, weights, and trade limits
- **`AiDecision`**: Decision result interface with optional trade requests and reasoning
- **Default Profiles**: Pre-configured `RANDOM` and `GREEDY` profiles for immediate use

#### Market Module

The **Market module** provides AI with a read-only view of the current market state for informed decision-making:

- **`MarketSnapshot`**: Complete market overview across all towns
- **`MarketTownView`**: Individual town market data (prices, stock, treasury)
- **`snapshotMarket(state)`**: Pure function that creates market snapshots from GameState
- **`maxAffordable(qty, price, treasury)`**: Helper to compute maximum affordable quantity given budget constraints
- **`maxTradableStock(qty, stock)`**: Helper to compute maximum tradable quantity given inventory constraints

**Key Features**:

- **Pure Functions**: No mutation of input state, deterministic snapshots
- **Trading Constraints**: Built-in helpers for budget and inventory limitations
- **Type Safety**: Full TypeScript support with comprehensive interfaces
- **Performance**: Efficient snapshot creation with deep copying
- **AI Ready**: Designed specifically for AI decision-making systems

#### AI Profiles

**Random Profile (`RANDOM`)**:

- Balanced decision weights (priceSpread: 0.5, prosperity: 0.25, military: 0.25)
- Suitable for unpredictable gameplay and testing scenarios
- Conservative trade limits (1 trade per turn, max 5 quantity per trade)

**Greedy Profile (`GREEDY`)**:

- Prosperity-focused weights (priceSpread: 0.8, prosperity: 0.15, military: 0.05)
- Heavy emphasis on price spread and economic gains
- Same trade limits for game balance

#### Usage Example

```typescript
import { RANDOM, GREEDY, type AiProfile } from './src/core/ai';

// Use default profiles
const randomAI: AiProfile = RANDOM;
const greedyAI: AiProfile = GREEDY;

// Create custom profile
const customAI: AiProfile = {
  id: 'custom',
  mode: 'greedy',
  weights: {
    priceSpread: 0.6,
    prosperity: 0.3,
    military: 0.1,
  },
  maxTradesPerTurn: 2,
  maxQuantityPerTrade: 10,
};
```

**Market Module**:

```typescript
import {
  snapshotMarket,
  maxAffordable,
  maxTradableStock,
  type MarketSnapshot,
} from './src/core/ai';

// Get current market state
const market: MarketSnapshot = snapshotMarket(gameState);

// Find best trading opportunities
for (const town of market.towns) {
  // Check if we can afford fish
  const affordableQty = maxAffordable(50, town.prices.fish, aiTreasury);
  // Check if town has enough stock
  const tradableQty = maxTradableStock(affordableQty, town.stock.fish);

  if (tradableQty > 0) {
    // AI can trade this quantity
    console.log(`Can trade ${tradableQty} fish with ${town.id}`);
  }
}
```

#### Key Features

- **Type Safety**: Full TypeScript support with no `any` types
- **Flexible Weights**: Configurable decision criteria weights (0.0 to 1.0)
- **Trade Limits**: Built-in limits for game balance and performance
- **Extensible**: Easy to add new AI modes and custom profiles
- **Ready for Integration**: Designed to work with future AI decision-making systems
- **Clean Exports**: Barrel exports for easy importing and usage

### Trade System (`src/core/trade/`)

A comprehensive trade system foundation with type-safe interfaces, error handling, validation, pluggable price modeling, and **runaway state prevention**:

#### Trade Types

- **`TradeSide`**: Union type for `'buy' | 'sell'` transactions
- **`TradeRequest`**: Complete trade request interface with town IDs, goods, quantity, side, and pricing
- **`TradeResult`**: Trade execution result with updated state, town deltas, and applied unit price

#### Trade Validation System

- **`TradeValidator`**: Pure, deterministic trade validation with comprehensive input checking
- **`ValidatedTrade`**: Normalized, safe trade plan with resolved Town objects and validated values
- **Input Validation**: Comprehensive validation of town IDs, good availability, quantity, affordability, and price sanity
- **Precise Error Paths**: All validation errors include exact field paths (e.g., `towns[1].resources.ore`, `quantity`)
- **Side-Specific Logic**: Different validation rules for buy vs sell transactions
- **Stock & Treasury Checks**: Validates sufficient resources and currency for trade execution
- **Price Sanity**: Ensures unit prices match counterparty's quoted prices

#### Trade Error Handling

- **`TradeValidationError`**: Validation failures with precise path identification for debugging
- **`TradeExecutionError`**: Runtime trade execution failures with optional cause chaining
- **Type Safety**: All errors extend base Error class with proper TypeScript support

#### Trade Execution System

- **`executeTrade(state, validatedTrade, goods, limits?)`**: Executes validated trades with goods movement, currency transfer, effect application, and **automatic limit enforcement**
- **Limit Integration**: Optional `TradeLimits` parameter for automatic resource and treasury clamping
- **Resource Protection**: Resources automatically clamped to `[0, maxResource]` during trade execution
- **Treasury Safety**: Treasury values clamped to `[0, maxTreasury]` after trade completion
- **Negative Prevention**: Always prevents negative values even without limits specified
- **Configurable Enforcement**: Limits are optional - pass `undefined` for unlimited operation
- **Goods Movement**: Moves goods between towns based on trade side (buy/sell)
- **Currency Transfer**: Updates town treasuries with trade costs
- **Effect Application**: Applies prosperity and military effects from goods
- **Prosperity Effects**: Both towns receive prosperity boosts (trade stimulates both economies)
- **Military Effects**: Only buyer receives military benefits (buyer-only for gameplay leverage)
- **Immutable Updates**: Returns new game state without modifying originals
- **Comprehensive Deltas**: Returns detailed change information for both towns

#### Price Model System

- **`PriceModel` Interface**: Pluggable interface for price adjustment strategies
- **`createSimpleLinearPriceModel()`**: Default implementation with supply/demand dynamics
- **Supply/Demand Logic**: Prices increase when goods are sold (demand), decrease when bought (supply)
- **Configurable**: Customizable step size, min/max boundaries, and price clamping
- **Immutable**: Returns new town instances with updated prices, preserving original state
- **Per-Trade Adjustment**: Price changes once per trade call, regardless of quantity

#### Trade Limits System (`src/core/trade/TradeLimits.ts`)

A comprehensive system to prevent runaway states and maintain game balance:

- **`TradeLimits` Interface**: Configurable caps for resources, treasury, and prices
- **`DEFAULT_LIMITS`**: Reasonable bounds (maxResource: 1M, maxTreasury: 1B, minPrice: 1, maxPrice: 9999)
- **Resource Clamping**: Prevents resources from exceeding `maxResource` or going negative
- **Treasury Limits**: Caps town currency at `maxTreasury` and prevents negative balances
- **Price Boundaries**: Enforces `minPrice` and `maxPrice` constraints on all goods
- **Utility Functions**: `clamp()`, `limitResource()`, `limitTreasury()`, `limitPrice()` for easy integration
- **Configurable**: All limits are optional and can be customized per game mode
- **Backward Compatible**: Existing code continues to work without changes

**Usage Example:**

```typescript
import { DEFAULT_LIMITS, limitResource, limitTreasury } from './src/core/trade';

// Apply limits to prevent runaway inflation
const clampedResource = limitResource(5000000, DEFAULT_LIMITS); // Returns 1000000
const clampedTreasury = limitTreasury(2000000000, DEFAULT_LIMITS); // Returns 1000000000
```

#### Trade Service

The **TradeService** provides a unified entry point for performing complete trade transactions:

```typescript
import { performTrade } from './src/core/trade';

// Single call performs validation, execution, and price updates
const result = await performTrade(
  gameState, // Current game state
  tradeRequest, // Trade request to process
  priceModel, // Price model for post-trade adjustments
  goods, // Goods configuration
);

// Result includes final state with price adjustments and town deltas
const { state, deltas, unitPriceApplied } = result;
```

**Key Benefits:**

- **Single Entry Point**: One method call handles the complete trade lifecycle
- **Composition Pattern**: Orchestrates validation → execution → pricing in sequence
- **Immutability Preserved**: Original state unchanged, returns new state instance
- **Consistent Results**: Deltas and final state are always consistent
- **Error Propagation**: TradeValidationError properly propagated from validation step
- **Ready for Integration**: Perfect for TurnController and UI components

**Implementation Details:**

- **Step 1**: Validates trade request using `validateTrade()`
- **Step 2**: Executes trade using `executeTrade()` for goods/currency movement
- **Step 3**: Applies price adjustments using `applyPostTradePricing()`
- **Returns**: Complete `TradeResult` with final state and deltas

#### Key Features

- **Type-Safe Interfaces**: Full TypeScript support with no `any` types
- **Precise Error Reporting**: Path-based validation errors for easy debugging
- **Immutable Design**: Trade results return new game state without modifying originals
- **Complete Trade Flow**: Full trade lifecycle from validation to execution
- **Effect Integration**: Goods effects automatically applied during trade execution
- **Pluggable Pricing**: Easy to swap different price models for different economic strategies
- **Pure Validation**: Deterministic validation function with no side effects
- **Runaway State Prevention**: Configurable limits prevent resources, treasury, and prices from exceeding bounds
- **Automatic Limit Enforcement**: Resources and treasury automatically clamped during trade execution
- **Comprehensive Coverage**: 51 tests covering validation, execution, price adjustment, and limit enforcement scenarios
- **Production Ready**: Complete trade system ready for game integration with built-in safety mechanisms
- **Export Ready**: All types, errors, validators, executors, price models, and limits exported through barrel exports for easy importing
- **Unified Service**: TradeService composes all trade operations into single callable unit with optional limit support

### Turn-Based Game Progression (`src/core/turn/`)

A comprehensive turn management system that orchestrates game progression through distinct phases:

#### Turn Service Factory (`src/core/turn/TurnService.ts`)

The **TurnService** provides a simple factory function for creating ready-to-use TurnControllers:

```typescript
import { createTurnController } from './src/core/turn';

// Simple usage - get a fully wired TurnController
const { controller, playerQ, pipeline } = createTurnController(gameState);

// With phase monitoring hook
const { controller } = createTurnController(gameState, {
  onPhase: (phase, detail) => console.log(`Phase: ${phase}`, detail),
});

// Run a turn immediately
const result = await controller.runTurn(gameState);
```

**Key Benefits:**

- **One-liner setup**: No manual wiring required
- **Automatic dependency injection**: PlayerActionQueue, UpdatePipeline, and TurnController automatically connected
- **Default PriceModel**: Creates a default SimpleLinearPriceModel for trade price adjustments
- **Goods integration**: Automatically passes goods configuration from game state
- **Optional hooks**: Easy integration of phase monitoring and logging
- **Production ready**: All components properly initialized and validated
- **Type safe**: Full TypeScript support with proper return types
- **Integrated Stats System**: Automatically registers StatsUpdateSystem for automatic stat updates during UpdateStats phase

#### Stats System Integration

The TurnService automatically integrates the **StatsUpdateSystem** to provide automatic stat management:

```typescript
import { createTurnController } from './src/core/turn';

// Create controller - StatsUpdateSystem automatically registered
const { controller } = createTurnController(gameState);

// Run turns - stats automatically updated during UpdateStats phase
const result = await controller.runTurn(gameState);

// Stats are automatically updated:
// - Prosperity decays by 1 per turn (clamped ≥0)
// - Military stats updated according to rules
// - Tier information revealed every 2 turns with fuzzy logic
// - All updates use deterministic RNG from game state
```

**Default Configuration:**

- **Prosperity Decay**: 1 point per turn (clamped at 0)
- **Reveal Interval**: Every 2 turns
- **Fuzzy Logic**: 20% jitter probability for tier reveals
- **Deterministic**: Uses game state's `rngSeed` for reproducible results

**Custom Configuration:**

```typescript
// The factory can be extended to accept custom stats configuration
// For now, it uses sensible defaults that work well for most games
```

**Benefits:**

- **Zero Configuration**: Works out of the box with sensible defaults
- **Automatic Execution**: Stats updated every turn without manual intervention
- **Game Balance**: Built-in decay prevents runaway prosperity inflation
- **Strategic Depth**: Tier reveals at intervals add uncertainty and planning
- **Deterministic**: Same game state always produces same results
- **Performance**: Efficient updates with minimal overhead per turn

#### Turn Phases

- **`Start`** - Beginning of turn setup and initialization
- **`PlayerAction`** - Player decision processing and action execution (including trade processing)
- **`AiActions`** - AI-controlled entity behavior and decisions
- **`UpdateStats`** - Game state updates and calculations (pluggable pipeline)
- **`End`** - Turn completion and cleanup with turn summary

#### Turn Controller

- **`TurnController.runTurn(state)`** - Executes complete turn with phase sequencing
- **Phase Orchestration**: Enforces strict phase order and execution
- **Action Processing**: Consumes player actions from queue during player phase
- **Trade Integration**: Processes trade actions during PlayerAction phase with full trade execution
- **State Management**: Returns updated game state with phase execution log
- **Observer Hooks**: Optional `onPhase` callback for monitoring phase execution
- **Turn Incrementation**: Automatically advances turn counter at start of each turn
- **Update Pipeline Integration**: Pluggable system for UpdateStats phase modifications
- **End Phase Summary**: Emits turn completion details with current turn number
- **Atomic Execution**: Guaranteed atomic turn execution - either completes fully or fails cleanly
- **Error Handling**: Comprehensive error handling with `TurnPhaseError` for precise phase failure reporting
- **State Preservation**: Original input state preserved on failure due to immutability assumption
- **Trade Error Handling**: Trade validation and execution errors properly wrapped in TurnPhaseError

#### Player Action System

- **`PlayerActionQueue`**: FIFO queue for managing player actions
- **Action Types**: Extensible system with `'none'` and `'trade'` actions
- **Trade Actions**: Full support for `{ type: 'trade', payload: TradeRequest }` actions
- **Queue Management**: `enqueue()`, `dequeue()`, `clear()`, and `length` operations
- **Integration**: Seamlessly wired into TurnController for action consumption

#### Trade Action Processing

The **PlayerAction phase** now fully supports trade execution:

```typescript
// Enqueue a trade action
playerQ.enqueue({
  type: 'trade',
  payload: {
    fromTownId: 'riverdale',
    toTownId: 'forestburg',
    goodId: 'fish',
    quantity: 5,
    side: 'buy',
    pricePerUnit: 4, // Must match Forestburg's quoted price
  },
});

// Run the turn - trade will be processed during PlayerAction phase
const result = await controller.runTurn(gameState);

// Trade results available in phase callback
const playerActionPhase = result.phaseLog.find(p => p.phase === 'PlayerAction');
// Contains: { action, result: { unitPriceApplied, deltas } }
```

**Key Features:**

- **One trade per turn**: TurnController processes exactly one queued trade action per turn
- **Full trade lifecycle**: Validation, execution, and price adjustments all handled automatically
- **State updates**: Resources, treasury, and prices updated according to trade results
- **Phase callbacks**: Trade results reported via `onPhase(TurnPhase.PlayerAction, detail)`
- **Error handling**: Trade errors wrapped in `TurnPhaseError` with `PlayerAction` phase
- **Price validation**: Trades must use correct quoted prices from towns
- **Immutable design**: Original game state never modified, new state returned

#### Update Pipeline System

- **`UpdatePipeline`**: Pluggable system for executing update logic during UpdateStats phase
- **System Registration**: `register(sys: UpdateSystem)` for adding new update systems
- **Sequential Execution**: Systems execute in registration order with state chaining
- **Type Safety**: `UpdateSystem = (s: GameState) => GameState` function signature
- **Integration**: Automatically wired into TurnController constructor
- **Phase Reporting**: Reports system count and execution details to phase hooks
- **Future Ready**: Designed for production, pricing, and tier adjustment systems

#### Key Features

- **Strict Phase Sequencing**: Enforced turn progression through all phases
- **Action Queue Integration**: Player actions processed one per turn
- **Immutable Design**: Maintains state immutability principles
- **Async Ready**: All phase methods async for future logic implementation
- **Observer System**: Comprehensive phase monitoring with extensible hooks
- **Safe No-Op Implementation**: All phases safely implemented with future extensibility
- **Comprehensive Testing**: Full test coverage for turn system and queue operations
- **Pluggable Update Systems**: Extensible pipeline for production, pricing, and tier updates
- **Phase Summaries**: Rich phase details including system counts and turn information
- **Atomic Turn Execution**: Complete turn execution or complete rollback - no partial state updates
- **Precise Error Reporting**: `TurnPhaseError` identifies exact phase where failure occurred
- **Robust Error Recovery**: Original game state preserved on any phase failure
- **Factory Service**: Simple one-liner setup with `createTurnController()` factory function

## 🛡️ Validation & Defensive Programming

### Stats System Validation

The stats system now includes comprehensive validation and defensive checks to ensure data integrity and prevent runtime errors:

#### Raw Stat Validation (`src/core/stats/TierMap.ts`)

- **NaN Rejection**: **`clampRaw()` now throws clear errors for NaN inputs**
- **Infinity Rejection**: **Rejects both positive and negative Infinity values**
- **Clear Error Messages**: Provides specific error messages for each validation failure
- **Always Active**: Validation runs in all environments (development and production)

```typescript
// Example validation behavior
clampRaw(NaN); // Throws: "Raw stat value cannot be NaN"
clampRaw(Infinity); // Throws: "Raw stat value cannot be Infinity or -Infinity"
clampRaw(-Infinity); // Throws: "Raw stat value cannot be Infinity or -Infinity"
```

#### Fuzzy Tier Validation (`src/core/stats/FuzzyTier.ts`)

- **Empty Thresholds Protection**: **Throws error if thresholds array is empty**
- **Bounds Validation**: **Always validates tier indices are within valid range**
- **Configuration Error Detection**: **Detects and reports tier configuration errors**
- **Defensive Indexing**: **Prevents array out-of-bounds access**

```typescript
// Example validation behavior
fuzzyTierFor(50, [], 'seed', 'town', 1); // Throws: "Thresholds array cannot be empty - no tiers are configured"
```

#### Tier Reveal Validation (`src/core/stats/RevealSystem.ts`)

- **Tier Configuration Validation**: **Validates that configured tiers belong to known tier sets**
- **Revealed Tier Validation**: **Ensures revealed tiers are always from configured allowed values**
- **Military Tier Validation**: **Validates against MilitaryTier union type**
- **Prosperity Tier Validation**: **Validates against ProsperityTier union type**

```typescript
// Example validation behavior
// Throws error if tier configuration contains invalid tiers
// Throws error if fuzzy tier generation produces unknown tier values
```

#### Benefits of Enhanced Validation

- **Runtime Safety**: Prevents crashes from invalid data
- **Debugging Support**: Clear error messages identify exact validation failures
- **Data Integrity**: Ensures all stat values and tier assignments are valid
- **Configuration Safety**: Catches configuration errors early
- **Production Reliability**: Validation active in all environments
- **Test Coverage**: All validation logic thoroughly tested

### Trade Limits & Runaway State Prevention

- **Configurable Limits**: `TradeLimits` interface allows customization of resource, treasury, and price bounds
- **Default Safety**: `DEFAULT_LIMITS` provides reasonable bounds (1M resources, 1B treasury, 1-9999 prices)
- **Automatic Enforcement**: Resources and treasury automatically clamped during trade execution
- **Negative Prevention**: Always prevents negative values regardless of limit configuration
- **Price Boundaries**: Enforces minimum and maximum price constraints on all goods
- **Game Balance**: Prevents runaway inflation/deflation while maintaining meaningful gameplay
- **Backward Compatible**: Existing code continues to work without changes

## 🔧 Development Workflow

### Code Quality Gates

This project enforces strict quality standards through automated checks:

1. **Pre-commit Hook**: Automatically fixes ESLint issues and formats code
2. **Pre-push Hook**: Runs type checking and tests before pushing
3. **CI Pipeline**: Full validation on every push and pull request
4. **100% Linting Compliance**: All ESLint rules passing with zero errors

### Git Hooks

- **Pre-commit**: Runs `lint-staged` to fix and format staged TypeScript files
- **Pre-push**: Runs `pnpm typecheck` and `pnpm test` to ensure quality

### Commit Message Convention

Use clear, descriptive commit messages:

```
feat: add immutable state API for town economy simulation
fix: resolve memory leak in data processing
docs: update API documentation
test: add comprehensive test suite for stateApi (113 tests)
feat: add TurnService factory for easy TurnController setup
```

## 🛡️ Error Handling & Reliability

### Atomic Turn Execution

The turn system guarantees **atomic execution** - either a complete turn executes successfully, or it fails cleanly with the original state preserved:

- **No Partial Updates**: If any phase fails, the entire turn is rolled back
- **State Preservation**: Original input state remains unchanged on failure
- **Precise Error Reporting**: `TurnPhaseError` identifies exactly which phase failed
- **Immutability Assumption**: Relies on immutable state design for safe rollback

### TurnPhaseError

```typescript
class TurnPhaseError extends Error {
  constructor(
    public readonly phase: TurnPhase,
    public override readonly cause: unknown
  )
}
```

**Usage Example:**

```typescript
try {
  const result = await turnController.runTurn(gameState);
  // Turn completed successfully
} catch (error) {
  if (error instanceof TurnPhaseError) {
    console.log(`Turn failed during ${error.phase}: ${error.cause}`);
    // Original gameState is unchanged and safe to retry
  }
}
```

### Error Recovery Strategies

- **Immediate Retry**: Safe to retry with same state after fixing the underlying issue
- **Phase-Specific Handling**: Different recovery logic based on which phase failed
- **State Inspection**: Original state available for debugging and recovery decisions
- **Logging Integration**: Phase information available for comprehensive error tracking

## 🎯 TypeScript Configuration

### Strict Mode Enabled

- **No implicit any**: All types must be explicit
- **Strict equality**: `===` required, `==` forbidden
- **Unused variables**: Caught at compile time
- **Indexed access**: Requires explicit bounds checking

### Path Aliases

- `@/*` → `src/*` for clean imports

## 🧪 Testing Strategy

### Test Framework

- **Vitest**: Fast, modern testing framework
- **Coverage**: V8 coverage provider with HTML reports
- **Thresholds**: Enforced minimum coverage (85% lines/functions, 75% branches)

### Comprehensive Test Suite

- **946 Tests**: Covering all core systems including state API, turn management, queue operations, update pipeline, TurnService factory, treasury system validation, price modeling, trade validation, trade execution, **trade integration in PlayerAction phase**, **trade limits enforcement**, **tier mapping system**, **fuzzy tier system**, **integrated stats update system**, and **TurnService stats integration**
- **Table-Driven Tests**: Efficient testing of invariants across all functions
- **Deep Freezing**: Prevents accidental mutations during testing
- **100% Coverage**: All core functions fully tested
- **Turn System Tests**: Comprehensive coverage of all turn phases and player actions
- **Trade Integration Tests**: Full coverage of trade processing during PlayerAction phase
- **Trade Limits Tests**: Full coverage of resource, treasury, and price limit enforcement (28 tests)
- **Update Pipeline Tests**: Full coverage of pluggable update system functionality
- **TurnService Tests**: Factory function tests covering component wiring and hook integration
- **Phase Detail Tests**: Verification of phase hook data including system counts and turn summaries
- **Error Handling Tests**: Full coverage of atomic turn execution and phase error reporting
- **Phase Order Tests**: Verification of deterministic phase sequencing and logging
- **Trade Action Tests**: Comprehensive testing of trade queue processing, state updates, and error handling

### Running Tests

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test src/core/stateApi.spec.ts

# Run turn system tests
pnpm test src/core/turn/

# Run TurnService factory tests
pnpm test src/core/turn/TurnService.spec.ts

# Run specific turn phase tests
pnpm test src/core/turn/TurnController.start.spec.ts
pnpm test src/core/turn/TurnController.player.spec.ts
pnpm test src/core/turn/TurnController.update.spec.ts
pnpm test src/core/turn/TurnController.end.spec.ts

# Run trade integration tests
pnpm test src/core/turn/TurnController.trade.spec.ts

# Run trade limits tests
pnpm test src/core/trade/TradeLimits.spec.ts
pnpm test src/core/trade/TradeExecutor.limits.spec.ts

# Run tier mapping tests
pnpm test src/core/stats/TierMap.spec.ts

# Run fuzzy tier tests
pnpm test src/core/stats/FuzzyTier.spec.ts

# Run tier thresholds data tests
pnpm test src/data/tierThresholds.spec.ts

# Run error handling tests
pnpm test src/core/turn/TurnController.error.spec.ts

# Run phase order tests
pnpm test src/core/turn/TurnController.order.spec.ts

# Run update pipeline tests
pnpm test src/core/turn/UpdatePipeline.spec.ts

# Run TurnService factory tests
pnpm test src/core/turn/TurnService.spec.ts

# Run TurnService stats integration tests
pnpm test src/core/turn/TurnService.stats.spec.ts

# Watch mode for development
pnpm test:watch

# Generate coverage report
pnpm coverage
```

## 📝 Code Style

### ESLint Rules

- **TypeScript**: Strict type checking and best practices
- **Import/Export**: Organized imports with alphabetical sorting
- **Code Quality**: No unused variables, consistent formatting
- **100% Compliance**: All linting rules passing with zero errors

### Prettier Configuration

- **Single quotes**: `'string'` instead of `"string"`
- **Trailing commas**: Always enabled for cleaner diffs
- **Line length**: 100 characters maximum
- **End of line**: LF (Unix) for cross-platform compatibility

## 🌍 Environment & Compatibility

### Operating Systems

- **Windows**: Full support with Git Bash
- **macOS**: Native support
- **Linux**: Native support

### Line Endings

- **Git**: Automatically converts CRLF to LF
- **Editor**: Configured for LF line endings
- **CI**: Runs on Ubuntu with LF endings

## 🚨 Troubleshooting

### Common Issues

#### "Command not found: pnpm"

```bash
# Install pnpm globally
npm install -g pnpm

# Or use npm instead
npm install
npm run dev
```

#### TypeScript errors

```bash
# Check for type issues
pnpm typecheck

# Ensure all dependencies are installed
pnpm install
```

#### Linting errors

```bash
# Auto-fix issues
pnpm lint:fix

# Format code
pnpm format
```

#### Test failures

```bash
# Run tests with verbose output
pnpm test --reporter=verbose

# Check coverage for specific files
pnpm coverage
```

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Test** thoroughly: `pnpm test && pnpm typecheck && pnpm lint`
5. **Commit** with clear messages
6. **Push** to your branch
7. **Create** a pull request

### Development Standards

- **100% Test Coverage**: All new functions must have comprehensive tests
- **Zero Linting Errors**: All code must pass ESLint without warnings
- **Type Safety**: Full TypeScript compliance with strict mode
- **Immutability**: State manipulation functions must be pure and immutable
- **Turn System Integration**: New game mechanics should integrate with the turn-based progression system
- **Observer Pattern**: Use the existing `onPhase` hooks for extensibility and monitoring
- **Phase Safety**: All turn phases should be safe no-ops initially, ready for future implementation
- **Error Handling**: Implement atomic operations with proper error reporting using `TurnPhaseError`
- **State Consistency**: Ensure no partial state updates - operations must be all-or-nothing
- **Factory Services**: Provide simple factory functions for complex component setup when appropriate

## 📄 License

[Add your license here]

## 🆘 Support

For questions or issues:

- Check the troubleshooting section above
- Review the CI logs for build errors
- Ensure your environment matches the prerequisites
- Verify all tests pass: `pnpm test`
- Confirm linting compliance: `pnpm lint`
   
   
   
   
   
   
