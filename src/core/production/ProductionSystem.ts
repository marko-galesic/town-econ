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
 *
 * @param state - The current game state
 * @param cfg - Production configuration with base rates and town multipliers
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
      const nextValue = Math.max(clampMin, currentAmount + delta);
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
