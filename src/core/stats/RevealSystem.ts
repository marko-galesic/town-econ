import type { GameState } from '../../types/GameState';
import type { MilitaryTier, ProsperityTier } from '../../types/Tiers';

import { fuzzyTierFor } from './FuzzyTier';
import { isRevealDue, DEFAULT_REVEAL_POLICY } from './RevealCadence';
import type { RevealPolicy } from './RevealCadence';
import type { TierConfig } from './TierMap';

/**
 * Applies the reveal pass to update town tier information when due
 * @param state - The current game state
 * @param seed - Random seed for deterministic fuzzy tier generation
 * @param policy - The reveal policy to follow (defaults to DEFAULT_REVEAL_POLICY)
 * @returns A new game state with updated revealed tier information
 */
export function applyRevealPass(
  state: GameState,
  seed: string,
  policy: RevealPolicy = DEFAULT_REVEAL_POLICY,
): GameState {
  // Load tier thresholds from data
  const tierConfig: TierConfig = {
    military: [
      { tier: 'militia', min: 0 },
      { tier: 'garrison', min: 20 },
      { tier: 'formidable', min: 50 },
      { tier: 'host', min: 90 },
    ],
    prosperity: [
      { tier: 'struggling', min: 0 },
      { tier: 'modest', min: 25 },
      { tier: 'prosperous', min: 60 },
      { tier: 'opulent', min: 95 },
    ],
  };

  // Always validate tier configuration
  const validMilitaryTiers: MilitaryTier[] = ['militia', 'garrison', 'formidable', 'host'];
  const validProsperityTiers: ProsperityTier[] = ['struggling', 'modest', 'prosperous', 'opulent'];

  // Ensure all configured tiers are valid
  tierConfig.military.forEach(threshold => {
    if (!validMilitaryTiers.includes(threshold.tier as MilitaryTier)) {
      throw new Error(`Invalid military tier in configuration: ${threshold.tier}`);
    }
  });

  tierConfig.prosperity.forEach(threshold => {
    if (!validProsperityTiers.includes(threshold.tier as ProsperityTier)) {
      throw new Error(`Invalid prosperity tier in configuration: ${threshold.tier}`);
    }
  });

  // Create new state with updated towns
  const updatedTowns = state.towns.map(town => {
    // Check if reveal is due for this town
    if (!isRevealDue(state.turn, town.revealed.lastUpdatedTurn, policy)) {
      // Not due for reveal, return town unchanged
      return town;
    }

    // Reveal is due, update both tiers and timestamp
    const militaryTier = fuzzyTierFor(
      town.militaryRaw,
      tierConfig.military,
      seed,
      town.id,
      state.turn,
    ) as MilitaryTier;

    const prosperityTier = fuzzyTierFor(
      town.prosperityRaw,
      tierConfig.prosperity,
      seed,
      town.id,
      state.turn,
    ) as ProsperityTier;

    // Always validate revealed tiers are in allowed set
    if (!validMilitaryTiers.includes(militaryTier)) {
      throw new Error(
        `Revealed military tier ${militaryTier} is not in allowed set: ${validMilitaryTiers.join(', ')}`,
      );
    }

    if (!validProsperityTiers.includes(prosperityTier)) {
      throw new Error(
        `Revealed prosperity tier ${prosperityTier} is not in allowed set: ${validProsperityTiers.join(', ')}`,
      );
    }

    // Return updated town with new revealed information
    return {
      ...town,
      revealed: {
        ...town.revealed,
        militaryTier,
        prosperityTier,
        lastUpdatedTurn: state.turn,
      },
    };
  });

  // Return new state with updated towns
  return {
    ...state,
    towns: updatedTowns,
  };
}
