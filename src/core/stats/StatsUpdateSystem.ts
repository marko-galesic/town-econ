import type { GameState } from '../../types/GameState';

import { type FuzzOptions } from './FuzzyTier';
import { applyRawStatTurn, type RawStatRules, DEFAULT_RAW_RULES } from './RawStatSystem';
import { type RevealPolicy, DEFAULT_REVEAL_POLICY } from './RevealCadence';
import { applyRevealPass } from './RevealSystem';

/**
 * Configuration options for the stats update system
 */
export interface StatsUpdateOptions {
  /** Raw stat update rules (prosperity decay, military decay, max values) */
  raw?: RawStatRules;
  /** Reveal interval - how often to update revealed tiers */
  revealInterval?: number;
  /** Fuzzy tier options (jitter probability) */
  fuzz?: FuzzOptions;
}

/**
 * Creates a stats update system that applies raw stat updates followed by reveal updates
 *
 * @param opts - Configuration options for the system
 * @param seedAccessor - Optional function to extract seed from game state (defaults to rngSeed)
 * @returns A function that can be registered with UpdatePipeline
 */

export function createStatsUpdateSystem(
  _opts?: StatsUpdateOptions,
  _seedAccessor?: (_gameState: GameState) => string,
): (_gameState: GameState) => GameState {
  return (_gameState: GameState) => {
    // Step 1: Apply raw stat updates (decay, etc.)
    const s1 = applyRawStatTurn(_gameState, { ...DEFAULT_RAW_RULES, ..._opts?.raw });

    // Step 2: Apply reveal pass with configured interval
    const policy: RevealPolicy = {
      interval: _opts?.revealInterval ?? DEFAULT_REVEAL_POLICY.interval,
    };

    // Use provided seed accessor or fall back to rngSeed
    const seed = _seedAccessor ? _seedAccessor(s1) : s1.rngSeed;

    const s2 = applyRevealPass(s1, seed, policy);

    return s2;
  };
}
