import type { GameState } from '../../types/GameState';
import type { GoodId } from '../../types/Goods';
import type { ProductionConfig } from '../../types/Production';

/**
 * Options for production calculation and application.
 */
export interface ProductionOptions {
  /** Minimum value to clamp resources to (default: 0) */
  clampMin?: number;
}

/**
 * Preview of production results without mutating state.
 * Maps town ID to good ID to production delta and next value.
 */
export interface ProductionPreview {
  [townId: string]: Partial<
    Record<
      GoodId,
      {
        delta: number;
        next: number;
      }
    >
  >;
}

/**
 * Previews production for one turn without mutating state.
 *
 * This function mirrors the logic of applyProductionTurn exactly,
 * including variance calculation and resource caps, but returns
 * only the deltas and next values without modifying the game state.
 *
 * @param state - The current game state
 * @param cfg - Production configuration with base rates, town multipliers, and optional caps
 * @param opts - Optional production options (default: clampMin = 0)
 * @returns Production preview with deltas and next values for each town and good
 */
export function previewProduction(
  state: GameState,
  cfg: ProductionConfig,
  opts: ProductionOptions = {},
): ProductionPreview {
  const { clampMin = 0 } = opts;
  const preview: ProductionPreview = {};

  // Calculate production for each town
  for (const town of state.towns) {
    preview[town.id] = {};

    // Calculate production for each good
    for (const good of Object.keys(cfg.base) as GoodId[]) {
      const baseRate = cfg.base[good] ?? 0;
      const townMultiplier = cfg.townMultipliers?.[town.id]?.[good] ?? 1;
      let delta = Math.floor(baseRate * townMultiplier);

      // Apply variance if enabled (same logic as applyProductionTurn)
      if (cfg.variance?.enabled) {
        const magnitude = cfg.variance.magnitude ?? 1;
        const jitter = deterministicJitter(state.rngSeed, town.id, state.turn, good, magnitude);
        delta = Math.max(0, delta + jitter);
      }

      const currentAmount = town.resources[good] ?? 0; // Handle missing goods
      let nextValue = Math.max(clampMin, currentAmount + delta);

      // Apply resource caps: per-good cap takes precedence, then global cap, then no limit
      const perGoodCap = cfg.maxPerGood?.[good];
      const globalCap = cfg.globalMaxResource;
      const cap = perGoodCap ?? globalCap ?? Infinity;

      // Clamp to cap if one is specified
      if (cap !== Infinity) {
        nextValue = Math.min(cap, nextValue);
      }

      // Assign the good data to the town entry
      preview[town.id]![good] = {
        delta,
        next: nextValue,
      };
    }
  }

  return preview;
}

/**
 * Generates deterministic jitter for production variance.
 * Uses a simple hash-based approach to ensure consistent results
 * for the same seed, town, turn, and good combination.
 *
 * @param seed - The RNG seed from game state
 * @param townId - The town ID
 * @param turn - The current game turn
 * @param good - The good ID
 * @param magnitude - The maximum magnitude of variance (1 or 2)
 * @returns A deterministic value in the range [-magnitude, +magnitude]
 */
function deterministicJitter(
  seed: string,
  townId: string,
  turn: number,
  good: GoodId,
  magnitude: number,
): number {
  // Create a deterministic hash from the inputs
  const hashInput = `${seed}-${townId}-${turn}-${good}`;
  let hash = 0;

  for (let i = 0; i < hashInput.length; i++) {
    const char = hashInput.charCodeAt(i);
    hash = ((hash << 5) - hash + char) & 0xffffffff;
  }

  // Use the hash to generate a value in [-magnitude, +magnitude]
  const normalized = Math.abs(hash) % (2 * magnitude + 1);
  return normalized - magnitude;
}

/**
 * Applies production for one turn to all towns in the game state.
 *
 * For each town and good:
 * - Calculates production as floor(baseRate * townMultiplier)
 * - Applies optional variance if enabled
 * - Adds production to existing resources
 * - Clamps to minimum value if specified
 * - Applies resource caps: per-good cap takes precedence over global cap
 *   - If cap is set, resources are clamped to cap (clamp behavior, not throw)
 *   - If no cap is set, resources accumulate without limit
 *
 * @param state - The current game state
 * @param cfg - Production configuration with base rates, town multipliers, and optional caps
 * @param opts - Optional production options (default: clampMin = 0)
 * @returns New game state with updated resources (input state is not mutated)
 */
export function applyProductionTurn(
  state: GameState,
  cfg: ProductionConfig,
  opts: ProductionOptions = {},
): GameState {
  const { clampMin = 0 } = opts;

  // Create new towns array with updated resources
  const updatedTowns = state.towns.map(town => {
    // Create new resources object for this town
    const updatedResources: Record<GoodId, number> = { ...town.resources };

    // Apply production for each good
    for (const good of Object.keys(cfg.base) as GoodId[]) {
      const baseRate = cfg.base[good] ?? 0;
      const townMultiplier = cfg.townMultipliers?.[town.id]?.[good] ?? 1;
      let delta = Math.floor(baseRate * townMultiplier);

      // Apply variance if enabled
      if (cfg.variance?.enabled) {
        const magnitude = cfg.variance.magnitude ?? 1;
        const jitter = deterministicJitter(state.rngSeed, town.id, state.turn, good, magnitude);
        delta = Math.max(0, delta + jitter);
      }

      const currentAmount = updatedResources[good] ?? 0; // Handle missing goods
      let nextValue = Math.max(clampMin, currentAmount + delta);

      // Apply resource caps: per-good cap takes precedence, then global cap, then no limit
      const perGoodCap = cfg.maxPerGood?.[good];
      const globalCap = cfg.globalMaxResource;
      const cap = perGoodCap ?? globalCap ?? Infinity;

      // Clamp to cap if one is specified
      if (cap !== Infinity) {
        nextValue = Math.min(cap, nextValue);
      }

      updatedResources[good] = nextValue;
    }

    // Return new town object with updated resources
    return {
      ...town,
      resources: updatedResources,
    };
  });

  // Return new game state (immutable)
  return {
    ...state,
    towns: updatedTowns,
  };
}
