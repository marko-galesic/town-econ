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
/* eslint-disable no-unused-vars */
export function createStatsUpdateSystem(
  _opts?: StatsUpdateOptions,
  _seedAccessor?: (_gameState: GameState) => string,
): (_gameState: GameState) => GameState {
  return (_gameState: GameState) => {
    console.log('StatsUpdateSystem called with turn:', _gameState.turn);
    console.log('StatsUpdateSystem towns count:', _gameState.towns.length);

    // Step 1: Apply raw stat updates (decay, etc.)
    const s1 = applyRawStatTurn(_gameState, { ...DEFAULT_RAW_RULES, ..._opts?.raw });
    console.log('After raw stat update - town 0 prosperity:', s1.towns[0]?.prosperityRaw);

    // Step 2: Apply reveal pass with configured interval
    const policy: RevealPolicy = {
      interval: _opts?.revealInterval ?? DEFAULT_REVEAL_POLICY.interval,
    };
    console.log('Reveal policy interval:', policy.interval);

    // Use provided seed accessor or fall back to rngSeed
    const seed = _seedAccessor ? _seedAccessor(s1) : s1.rngSeed;
    console.log('Using seed:', seed);

    const s2 = applyRevealPass(s1, seed, policy);
    console.log(
      'After reveal pass - town 0 lastUpdatedTurn:',
      s2.towns[0]?.revealed.lastUpdatedTurn,
    );

    return s2;
  };
}
/* eslint-enable no-unused-vars */
