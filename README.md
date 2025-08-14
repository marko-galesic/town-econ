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

- `pnpm test` - Run test suite once (✅ 258 tests passing)
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
│   │   └── turn/         # Turn-based game progression system
│   │       ├── TurnPhase.ts # Game turn phase definitions
│   │       ├── TurnController.ts # Turn orchestration and phase sequencing
│   │       ├── PlayerAction.ts # Player action type definitions
│   │       ├── PlayerActionQueue.ts # Action queue management
│   │       └── UpdatePipeline.ts # Pluggable update systems pipeline
│   │       ├── TurnController.skeleton.spec.ts # Turn system tests
│   │       ├── TurnController.start.spec.ts # Turn start phase tests
│   │       ├── TurnController.player.spec.ts # Player action phase tests
│   │       ├── TurnController.update.spec.ts # Update stats phase tests
│   │       ├── TurnController.end.spec.ts # Turn end phase tests
│   │       ├── PlayerActionQueue.spec.ts # Queue functionality tests
│   │       └── UpdatePipeline.spec.ts # Update pipeline system tests
│   ├── types/            # TypeScript type definitions
│   │   ├── GameState.ts  # Main game state interface
│   │   ├── Town.ts       # Town entity interface
│   │   ├── Goods.ts      # Goods and resources interface
│   │   └── Tiers.ts      # Military and prosperity tier types
│   ├── data/             # Game data and configuration
│   │   ├── goods.json    # Goods definitions and effects
│   │   └── towns.json    # Initial town configurations
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

### Turn-Based Game Progression (`src/core/turn/`)

A comprehensive turn management system that orchestrates game progression through distinct phases:

#### Turn Phases

- **`Start`** - Beginning of turn setup and initialization
- **`PlayerAction`** - Player decision processing and action execution
- **`AiActions`** - AI-controlled entity behavior and decisions
- **`UpdateStats`** - Game state updates and calculations (pluggable pipeline)
- **`End`** - Turn completion and cleanup with turn summary

#### Turn Controller

- **`TurnController.runTurn(state)`** - Executes complete turn with phase sequencing
- **Phase Orchestration**: Enforces strict phase order and execution
- **Action Processing**: Consumes player actions from queue during player phase
- **State Management**: Returns updated game state with phase execution log
- **Observer Hooks**: Optional `onPhase` callback for monitoring phase execution
- **Turn Incrementation**: Automatically advances turn counter at start of each turn
- **Update Pipeline Integration**: Pluggable system for UpdateStats phase modifications
- **End Phase Summary**: Emits turn completion details with current turn number

#### Player Action System

- **`PlayerActionQueue`**: FIFO queue for managing player actions
- **Action Types**: Extensible system starting with `'none'` and `'trade'` actions
- **Queue Management**: `enqueue()`, `dequeue()`, `clear()`, and `length` operations
- **Integration**: Seamlessly wired into TurnController for action consumption

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
```

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

- **258 Tests**: Covering all core systems including state API, turn management, queue operations, and update pipeline
- **Table-Driven Tests**: Efficient testing of invariants across all functions
- **Deep Freezing**: Prevents accidental mutations during testing
- **100% Coverage**: All core functions fully tested
- **Turn System Tests**: Comprehensive coverage of all turn phases and player actions
- **Update Pipeline Tests**: Full coverage of pluggable update system functionality
- **Phase Detail Tests**: Verification of phase hook data including system counts and turn summaries

### Running Tests

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test src/core/stateApi.spec.ts

# Run turn system tests
pnpm test src/core/turn/

# Run specific turn phase tests
pnpm test src/core/turn/TurnController.start.spec.ts
pnpm test src/core/turn/TurnController.player.spec.ts
pnpm test src/core/turn/TurnController.update.spec.ts
pnpm test src/core/turn/TurnController.end.spec.ts

# Run update pipeline tests
pnpm test src/core/turn/UpdatePipeline.spec.ts

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

## 📄 License

[Add your license here]

## 🆘 Support

For questions or issues:

- Check the troubleshooting section above
- Review the CI logs for build errors
- Ensure your environment matches the prerequisites
- Verify all tests pass: `pnpm test`
- Confirm linting compliance: `pnpm lint`
