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
 * Applies production for one turn to all towns in the game state.
 *
 * For each town and good:
 * - Calculates production as floor(baseRate * townMultiplier)
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
      const delta = Math.floor(baseRate * townMultiplier);
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
