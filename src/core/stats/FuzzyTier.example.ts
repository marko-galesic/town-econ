import { fuzzyTierFor, seededRand } from './FuzzyTier';
import type { TierThreshold } from './TierMap';

// Example prosperity tier thresholds
const prosperityThresholds: TierThreshold[] = [
  { tier: 'struggling', min: 0 },
  { tier: 'modest', min: 25 },
  { tier: 'prosperous', min: 50 },
  { tier: 'opulent', min: 75 },
];

// Example military tier thresholds
const militaryThresholds: TierThreshold[] = [
  { tier: 'militia', min: 0 },
  { tier: 'garrison', min: 30 },
  { tier: 'formidable', min: 60 },
  { tier: 'host', min: 90 },
];

/**
 * Example usage of FuzzyTier module
 */
export function demonstrateFuzzyTier() {
  const rngSeed = 'game-session-12345';
  const townId = 'riverdale';
  const turn = 10;

  console.log('=== Fuzzy Tier Example ===\n');

  // Example 1: No jitter (always true tier)
  console.log('1. No jitter (jitterProb = 0):');
  const noJitterOpts = { jitterProb: 0 };

  for (let raw = 0; raw <= 100; raw += 25) {
    const fuzzyTier = fuzzyTierFor(raw, prosperityThresholds, rngSeed, townId, turn, noJitterOpts);
    console.log(`   Raw value ${raw} → Fuzzy tier: ${fuzzyTier}`);
  }

  console.log('\n2. Default jitter (jitterProb = 0.2):');

  // Example 2: Default jitter probability
  for (let raw = 0; raw <= 100; raw += 25) {
    const fuzzyTier = fuzzyTierFor(raw, prosperityThresholds, rngSeed, townId, turn);
    console.log(`   Raw value ${raw} → Fuzzy tier: ${fuzzyTier}`);
  }

  console.log('\n3. Always jitter (jitterProb = 1):');

  // Example 3: Always jitter
  const alwaysJitterOpts = { jitterProb: 1 };
  for (let raw = 0; raw <= 100; raw += 25) {
    const fuzzyTier = fuzzyTierFor(
      raw,
      prosperityThresholds,
      rngSeed,
      townId,
      turn,
      alwaysJitterOpts,
    );
    console.log(`   Raw value ${raw} → Fuzzy tier: ${fuzzyTier}`);
  }

  console.log('\n4. Determinism demonstration:');

  // Example 4: Show determinism
  const rawValue = 35;
  const result1 = fuzzyTierFor(rawValue, prosperityThresholds, rngSeed, townId, turn);
  const result2 = fuzzyTierFor(rawValue, prosperityThresholds, rngSeed, townId, turn);
  const result3 = fuzzyTierFor(rawValue, prosperityThresholds, rngSeed, townId, turn + 1);

  console.log(`   Same (seed, town, turn): ${result1} === ${result2} → ${result1 === result2}`);
  console.log(`   Different turn: ${result1} vs ${result3} → ${result1 !== result3}`);

  console.log('\n5. Military tier example:');

  // Example 5: Military tiers
  const militaryRaw = 45;
  const militaryTier = fuzzyTierFor(militaryRaw, militaryThresholds, rngSeed, townId, turn);
  console.log(`   Military strength ${militaryRaw} → Fuzzy tier: ${militaryTier}`);

  console.log('\n6. Custom jitter probability:');

  // Example 6: Custom jitter probability
  const customOpts = { jitterProb: 0.5 };
  for (let raw = 0; raw <= 100; raw += 50) {
    const fuzzyTier = fuzzyTierFor(raw, prosperityThresholds, rngSeed, townId, turn, customOpts);
    console.log(`   Raw value ${raw} → Fuzzy tier: ${fuzzyTier}`);
  }
}

/**
 * Example of using the seeded random number generator directly
 */
export function demonstrateSeededRand() {
  console.log('\n=== Seeded Random Number Generator Example ===\n');

  const rand = seededRand('example-seed');

  console.log('Random numbers for different tags:');
  console.log(`  'tag1': ${rand('tag1')}`);
  console.log(`  'tag2': ${rand('tag2')}`);
  console.log(`  'tag3': ${rand('tag3')}`);

  console.log('\nDeterministic behavior:');
  console.log(`  'tag1' again: ${rand('tag1')}`);
  console.log(`  'tag2' again: ${rand('tag2')}`);

  console.log('\nDifferent seed produces different numbers:');
  const rand2 = seededRand('different-seed');
  console.log(`  Same tag, different seed: ${rand('tag1')} vs ${rand2('tag1')}`);
}

// Run examples if this file is executed directly
// Note: This is just for demonstration - run the functions directly in your code
// demonstrateFuzzyTier();
// demonstrateSeededRand();
